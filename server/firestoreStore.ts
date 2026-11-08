/**
 * Canonical KulLoop family ledger in Cloud Firestore (Admin SDK).
 * Layout:
 *   families/{familyId}
 *   families/{familyId}/occasions|members|people|lineage|pushDevices/{id}
 *   families/{familyId}/meta/reminderDispatch  { keys: string[] }
 *   inviteCodes/{code} → { familyId }
 *   users/{uid}
 */
import { tryInitFirebaseAdmin, getFirebaseAdminApp, getFirebaseAdminModule } from './firebaseAdmin.js';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
import type { DatabaseSchema } from './storage.js';
import type { Family, FamilyOccasion, Member, Person, LineageMember } from '../src/types';
import type { UserProfile } from '../src/services/firebase';
import type { PushDeviceRecord } from './pushMessaging.js';

function databaseIdFromEnv(): string | undefined {
  const id =
    process.env.FIRESTORE_DATABASE_ID?.trim() ||
    process.env.VITE_FIREBASE_DATABASE_ID?.trim() ||
    '';
  return id || undefined;
}

function stripUndefined<T extends Record<string, unknown>>(obj: T): T {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v === undefined) continue;
    if (v && typeof v === 'object' && !Array.isArray(v) && !(v instanceof Date)) {
      out[k] = stripUndefined(v as Record<string, unknown>);
    } else {
      out[k] = v;
    }
  }
  return out as T;
}

export function hasFirestoreCredentials(): boolean {
  return Boolean(
    process.env.FIREBASE_SERVICE_ACCOUNT_JSON?.trim() ||
      process.env.FIREBASE_SERVICE_ACCOUNT_PATH?.trim()
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getAdminFirestore(): any {
  if (!tryInitFirebaseAdmin() || !getFirebaseAdminApp()) {
    throw new Error('Firebase Admin is not initialized — set FIREBASE_SERVICE_ACCOUNT_JSON or PATH');
  }
  const admin = getFirebaseAdminModule();
  const app = getFirebaseAdminApp();
  const dbId = databaseIdFromEnv();
  if (dbId) {
    try {
      const { getFirestore } = require('firebase-admin/firestore');
      return getFirestore(app, dbId);
    } catch {
      console.warn(`[firestore] Named database "${dbId}" unavailable; using (default)`);
    }
  }
  return admin.firestore();
}

function emptyBundle(familyId = 'fam_default'): DatabaseSchema {
  const now = new Date().toISOString();
  return {
    meta: {
      driver: 'firestore-admin',
      version: 2,
      createdAt: now,
      lastSavedAt: now,
      persistenceFile: `firestore:families/${familyId}`,
      recordsCount: {
        occasions: 0,
        members: 0,
        people: 0,
        lineageMembers: 0,
        users: 0,
      },
    },
    family: {
      id: familyId,
      name: 'My Family Lineage',
      homeLocation: 'Pune, Maharashtra',
      secondLocation: '',
      region: 'Maharashtra',
      convention: 'Amanta',
      validationSource: 'Datar Panchang (Amanta) — verified by family pandit',
      plan: 'pilot_founding',
      payer: 'configurator',
      configuratorName: 'Family Configurator',
      configuratorPhone: '',
      traditionNotes: 'Amanta tradition calendar. Computed for local sunrise.',
      consultedEntity: 'An elder',
    },
    occasions: [],
    members: [],
    people: [],
    lineageMembers: [],
    users: {},
    pushDevices: [],
    reminderDispatchLog: [],
    auditLogs: [],
  };
}

async function readSubcollection<T extends { id: string }>(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  db: any,
  familyId: string,
  name: string
): Promise<T[]> {
  const snap = await db.collection('families').doc(familyId).collection(name).get();
  return snap.docs.map((d: { id: string; data: () => object }) => ({ id: d.id, ...d.data() } as T));
}

export async function loadFamilyBundle(familyId: string): Promise<DatabaseSchema> {
  const db = getAdminFirestore();
  const famRef = db.collection('families').doc(familyId);
  const famSnap = await famRef.get();
  const bundle = emptyBundle(familyId);

  if (famSnap.exists) {
    bundle.family = { id: familyId, ...(famSnap.data() as object) } as Family;
  } else {
    bundle.family.id = familyId;
  }

  const [occasions, members, people, lineage, pushDevices, reminderSnap] = await Promise.all([
    readSubcollection<FamilyOccasion>(db, familyId, 'occasions'),
    readSubcollection<Member>(db, familyId, 'members'),
    readSubcollection<Person>(db, familyId, 'people'),
    readSubcollection<LineageMember>(db, familyId, 'lineage'),
    readSubcollection<PushDeviceRecord>(db, familyId, 'pushDevices'),
    famRef.collection('meta').doc('reminderDispatch').get(),
  ]);

  bundle.occasions = occasions;
  bundle.members = members;
  bundle.people = people;
  bundle.lineageMembers = lineage;
  bundle.pushDevices = pushDevices;
  bundle.reminderDispatchLog = (reminderSnap.data()?.keys as string[]) || [];
  // Users live in top-level /users — not embedded in family mutate cycles
  bundle.users = {};

  const now = new Date().toISOString();
  bundle.meta.lastSavedAt = now;
  bundle.meta.recordsCount = {
    occasions: occasions.length,
    members: members.length,
    people: people.length,
    lineageMembers: lineage.length,
    users: 0,
  };

  return bundle;
}

export async function resolveFamilyId(opts: {
  familyId?: string;
  uid?: string;
  email?: string;
  inviteCode?: string;
}): Promise<string | null> {
  const db = getAdminFirestore();

  if (opts.familyId) {
    const snap = await db.collection('families').doc(opts.familyId).get();
    if (snap.exists) return opts.familyId;
  }

  if (opts.inviteCode) {
    const raw = opts.inviteCode.trim().toUpperCase().replace(/\s+/g, '');
    const candidates = new Set<string>([raw]);
    if (raw.startsWith('KUL-')) candidates.add(raw.slice(4));
    else if (/^[A-Z0-9]{6}$/.test(raw)) candidates.add(`KUL-${raw}`);
    for (const code of candidates) {
      const inv = await db.collection('inviteCodes').doc(code).get();
      if (inv.exists) {
        const fid = inv.data()?.familyId as string | undefined;
        if (fid) return fid;
      }
    }
  }

  const familyIdFromMemberDoc = (doc: { ref: { parent?: { parent?: { id?: string; path?: string } }; path?: string } }) => {
    // Prefer nested families/{familyId}/members/{id} — ignore legacy top-level members/*
    const familyRef = doc.ref.parent?.parent;
    if (familyRef?.path?.startsWith('families/')) return familyRef.id;
    return null;
  };

  if (opts.uid) {
    try {
      const byUid = await db.collectionGroup('members').where('authUid', '==', opts.uid).limit(10).get();
      for (const doc of byUid.docs) {
        const fid = familyIdFromMemberDoc(doc);
        if (fid) return fid;
      }
    } catch (err) {
      console.warn('[firestore] members.authUid collectionGroup query failed (index?):', err);
    }
  }

  if (opts.email) {
    const email = opts.email.trim().toLowerCase();
    try {
      const byEmail = await db.collectionGroup('members').where('email', '==', email).limit(10).get();
      for (const doc of byEmail.docs) {
        const fid = familyIdFromMemberDoc(doc);
        if (fid) return fid;
      }
    } catch (err) {
      console.warn('[firestore] members.email collectionGroup query failed (index?):', err);
    }
  }

  return null;
}

export async function listFamilyIds(): Promise<string[]> {
  const db = getAdminFirestore();
  const snap = await db.collection('families').get();
  return snap.docs.map((d: { id: string }) => d.id);
}

async function syncCollection<T extends { id: string }>(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  db: any,
  familyId: string,
  name: string,
  items: T[]
): Promise<void> {
  const col = db.collection('families').doc(familyId).collection(name);
  const existing = await col.get();
  const keep = new Set(items.map((i) => i.id));
  const batchLimit = 400;
  let batch = db.batch();
  let ops = 0;

  const commitIfNeeded = async () => {
    if (ops >= batchLimit) {
      await batch.commit();
      batch = db.batch();
      ops = 0;
    }
  };

  for (const doc of existing.docs) {
    if (!keep.has(doc.id)) {
      batch.delete(doc.ref);
      ops++;
      await commitIfNeeded();
    }
  }

  for (const item of items) {
    const { id, ...rest } = item as T & { email?: string };
    const payload = { ...rest } as Record<string, unknown>;
    if (typeof payload.email === 'string') {
      payload.email = payload.email.trim().toLowerCase();
    }
    batch.set(col.doc(id), stripUndefined(payload), { merge: true });
    ops++;
    await commitIfNeeded();
  }

  if (ops > 0) await batch.commit();
}

export async function persistFamilyBundle(
  familyId: string,
  bundle: DatabaseSchema,
  audit?: { action: string; entityType: string; entityId: string }
): Promise<void> {
  const db = getAdminFirestore();
  const famRef = db.collection('families').doc(familyId);
  const { id: _id, ...familyFields } = bundle.family;
  await famRef.set(stripUndefined({ ...familyFields, id: familyId } as Record<string, unknown>), {
    merge: true,
  });

  await Promise.all([
    syncCollection(db, familyId, 'occasions', bundle.occasions),
    syncCollection(db, familyId, 'members', bundle.members),
    syncCollection(db, familyId, 'people', bundle.people),
    syncCollection(db, familyId, 'lineage', bundle.lineageMembers),
    syncCollection(db, familyId, 'pushDevices', bundle.pushDevices),
  ]);

  await famRef
    .collection('meta')
    .doc('reminderDispatch')
    .set(
      {
        keys: (bundle.reminderDispatchLog || []).slice(-5000),
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );

  if (bundle.family.inviteCode) {
    let code = String(bundle.family.inviteCode).trim().toUpperCase().replace(/\s+/g, '');
    if (!code.startsWith('KUL-') && /^[A-Z0-9]{6}$/.test(code)) code = `KUL-${code}`;
    bundle.family.inviteCode = code;
    await db.collection('inviteCodes').doc(code).set(
      {
        familyId,
        familyName: bundle.family.name,
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
  }

  // Do not rewrite global /users from family mutate — use upsertUserProfile separately

  if (audit) {
    await famRef.collection('auditLogs').add({
      ...audit,
      timestamp: new Date().toISOString(),
    });
  }
}

export async function upsertUserProfile(profile: UserProfile): Promise<UserProfile> {
  const db = getAdminFirestore();
  const saved = {
    ...profile,
    updatedAt: new Date().toISOString(),
  };
  await db
    .collection('users')
    .doc(profile.uid)
    .set(stripUndefined(saved as unknown as Record<string, unknown>), { merge: true });
  return saved;
}

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const db = getAdminFirestore();
  const snap = await db.collection('users').doc(uid).get();
  if (!snap.exists) return null;
  return { uid, ...snap.data() } as UserProfile;
}

export async function listUserProfiles(): Promise<UserProfile[]> {
  const db = getAdminFirestore();
  const snap = await db.collection('users').limit(200).get();
  return snap.docs.map((d: { id: string; data: () => object }) => ({ uid: d.id, ...d.data() } as UserProfile));
}

export async function migrateJsonBundleToFirestore(bundle: DatabaseSchema): Promise<string> {
  const familyId = bundle.family.id || `fam_${Date.now()}`;
  bundle.family.id = familyId;
  await persistFamilyBundle(familyId, bundle, {
    action: 'MIGRATE_FROM_JSON',
    entityType: 'SYSTEM',
    entityId: familyId,
  });
  return familyId;
}
