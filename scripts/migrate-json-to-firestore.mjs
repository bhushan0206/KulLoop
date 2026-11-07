#!/usr/bin/env node
/**
 * One-shot: import data/kulloop_store.json into Cloud Firestore (Admin SDK).
 * Usage: node scripts/migrate-json-to-firestore.mjs
 */
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

const root = process.cwd();
const jsonPath = path.join(root, 'data/kulloop_store.json');
const saPath =
  process.env.FIREBASE_SERVICE_ACCOUNT_PATH?.trim() ||
  path.join(root, 'secrets/firebase-service-account.json');

function stripUndefined(obj) {
  if (Array.isArray(obj)) return obj.map(stripUndefined);
  if (obj && typeof obj === 'object') {
    const out = {};
    for (const [k, v] of Object.entries(obj)) {
      if (v === undefined) continue;
      out[k] = stripUndefined(v);
    }
    return out;
  }
  return obj;
}

async function main() {
  if (!fs.existsSync(jsonPath)) {
    console.error('Missing', jsonPath);
    process.exit(1);
  }
  if (!fs.existsSync(saPath) && !process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
    console.error('Missing service account at', saPath);
    process.exit(1);
  }

  const bundle = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
  const familyId = bundle.family?.id || `fam_${Date.now()}`;
  bundle.family = { ...bundle.family, id: familyId };

  const admin = (await import('firebase-admin')).default;
  if (!admin.apps.length) {
    const cred = process.env.FIREBASE_SERVICE_ACCOUNT_JSON
      ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON)
      : JSON.parse(fs.readFileSync(saPath, 'utf8'));
    admin.initializeApp({
      credential: admin.credential.cert(cred),
      projectId: cred.project_id || process.env.FIREBASE_PROJECT_ID || process.env.VITE_FIREBASE_PROJECT_ID,
    });
  }

  const dbId =
    process.env.FIRESTORE_DATABASE_ID?.trim() ||
    process.env.VITE_FIREBASE_DATABASE_ID?.trim() ||
    '';
  let db;
  if (dbId) {
    const { getFirestore } = await import('firebase-admin/firestore');
    db = getFirestore(admin.app(), dbId);
    console.log('Using Firestore database:', dbId);
  } else {
    db = admin.firestore();
    console.log('Using Firestore database: (default)');
  }

  const famRef = db.collection('families').doc(familyId);
  await famRef.set(stripUndefined({ ...bundle.family, id: familyId }), { merge: true });

  async function writeCol(name, items) {
    const col = famRef.collection(name);
    let n = 0;
    for (const item of items || []) {
      const id = item.id || `${name}_${Date.now()}_${n}`;
      const { id: _omit, ...rest } = item;
      await col.doc(id).set(stripUndefined({ ...rest, id }), { merge: true });
      n++;
    }
    return n;
  }

  const counts = {
    occasions: await writeCol('occasions', bundle.occasions),
    members: await writeCol('members', bundle.members),
    people: await writeCol('people', bundle.people),
    lineage: await writeCol('lineage', bundle.lineageMembers),
    pushDevices: await writeCol('pushDevices', bundle.pushDevices),
  };

  await famRef.collection('meta').doc('reminderDispatch').set(
    {
      keys: bundle.reminderDispatchLog || [],
      updatedAt: new Date().toISOString(),
    },
    { merge: true }
  );

  if (bundle.family.inviteCode) {
    const code = String(bundle.family.inviteCode).trim().toUpperCase();
    await db.collection('inviteCodes').doc(code).set(
      {
        familyId,
        familyName: bundle.family.name,
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
    console.log('Invite code mapped:', code, '→', familyId);
  }

  for (const [uid, profile] of Object.entries(bundle.users || {})) {
    await db.collection('users').doc(uid).set(stripUndefined(profile), { merge: true });
  }

  await famRef.collection('auditLogs').add({
    action: 'MIGRATE_FROM_JSON',
    entityType: 'SYSTEM',
    entityId: familyId,
    timestamp: new Date().toISOString(),
    details: 'Imported from data/kulloop_store.json',
  });

  console.log('Migrated family', bundle.family.name, `(${familyId})`, counts);
  console.log('Done. Safe to keep JSON as local backup; server now uses Firestore when SA is set.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
