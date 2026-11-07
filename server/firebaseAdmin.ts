import fs from 'fs';
import path from 'path';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let adminApp: any = null;
let initAttempted = false;

function projectIdFromEnv(): string | undefined {
  return (
    process.env.FIREBASE_PROJECT_ID?.trim() ||
    process.env.GCLOUD_PROJECT?.trim() ||
    process.env.VITE_FIREBASE_PROJECT_ID?.trim() ||
    undefined
  );
}

function loadAdmin() {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  return require('firebase-admin');
}

/** Shared firebase-admin bootstrap for FCM + Firestore + ID token verification. */
export function tryInitFirebaseAdmin(): boolean {
  if (adminApp) return true;
  if (initAttempted) return false;
  initAttempted = true;

  const jsonPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH?.trim();
  const jsonRaw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON?.trim();
  const projectId = projectIdFromEnv();

  try {
    const admin = loadAdmin();

    // Prefer inline JSON on Vercel/serverless (no durable filesystem for secrets/)
    if (jsonRaw) {
      const serviceAccount = JSON.parse(jsonRaw);
      adminApp = admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: serviceAccount.project_id || projectId,
      });
      console.info(
        `[firebase-admin] Initialized with service account (${serviceAccount.client_email || 'json'})`
      );
      return true;
    }

    if (jsonPath && fs.existsSync(path.resolve(jsonPath))) {
      const serviceAccount = JSON.parse(fs.readFileSync(path.resolve(jsonPath), 'utf8'));
      adminApp = admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: serviceAccount.project_id || projectId,
      });
      console.info(
        `[firebase-admin] Initialized with service account file (${serviceAccount.client_email || jsonPath})`
      );
      return true;
    }

    // Project-only init is enough for verifyIdToken via Google public keys in many setups
    if (projectId) {
      adminApp = admin.initializeApp({ projectId });
      console.info(`[firebase-admin] Initialized with projectId=${projectId} (token verify / optional FCM)`);
      return true;
    }
  } catch (err) {
    console.warn('[firebase-admin] init failed:', err);
    initAttempted = false;
  }
  return false;
}

export function getFirebaseAdminApp(): unknown {
  tryInitFirebaseAdmin();
  return adminApp;
}

export async function verifyFirebaseIdToken(
  idToken: string
): Promise<{ uid: string; email?: string; name?: string } | null> {
  if (!tryInitFirebaseAdmin() || !adminApp) return null;
  try {
    const admin = loadAdmin();
    const decoded = await admin.auth().verifyIdToken(idToken);
    return {
      uid: decoded.uid as string,
      email: (decoded.email as string | undefined) || undefined,
      name: (decoded.name as string | undefined) || undefined,
    };
  } catch (err) {
    console.warn('[firebase-admin] verifyIdToken failed:', err instanceof Error ? err.message : err);
    return null;
  }
}

export function isFirebaseAdminReady(): boolean {
  return tryInitFirebaseAdmin();
}

export function getFirebaseAdminModule() {
  return loadAdmin();
}
