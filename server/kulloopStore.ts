/**
 * Unified KulLoop persistence facade.
 * Canonical: Firestore (Admin SDK) whenever service-account credentials exist.
 * Fallback: in-memory only (no JSON PII writes) for demo / misconfigured local.
 */
import type { Request } from 'express';
import {
  DatabaseSchema,
  buildEmptyDatabase,
  memoryStore,
} from './storage';
import {
  hasFirestoreCredentials,
  loadFamilyBundle,
  persistFamilyBundle,
  resolveFamilyId,
  listFamilyIds,
  upsertUserProfile,
  getUserProfile,
  listUserProfiles,
} from './firestoreStore';
import { tryInitFirebaseAdmin } from './firebaseAdmin';
import type { UserProfile } from '../src/services/firebase';

export function isFirestoreCanonical(): boolean {
  return hasFirestoreCredentials() && tryInitFirebaseAdmin();
}

function identityFromRequest(req: Request): { uid?: string; email?: string; isDemo?: boolean } {
  const authed = req as Request & {
    kulloopIdentity?: { uid?: string; email?: string; isDemoMode?: boolean };
    kulloopFamilyId?: string;
  };
  if (authed.kulloopIdentity) {
    return {
      uid: authed.kulloopIdentity.uid,
      email: authed.kulloopIdentity.email,
      isDemo: authed.kulloopIdentity.isDemoMode,
    };
  }
  const demo = req.get('x-kulloop-demo');
  return {
    uid: req.get('x-kulloop-uid')?.trim() || undefined,
    email: req.get('x-kulloop-email')?.trim() || undefined,
    isDemo: demo === '1' || demo === 'true',
  };
}

/**
 * Resolve which family ledger to use.
 * Never trusts client-supplied family ids for writes — gated routes set kulloopFamilyId
 * after loading the caller's actual family via membership.
 */
export async function resolveActiveFamilyId(req?: Request): Promise<string> {
  if (req) {
    const authed = req as Request & { kulloopFamilyId?: string };
    if (authed.kulloopFamilyId) return authed.kulloopFamilyId;

    const identity = identityFromRequest(req);
    if (identity.isDemo) {
      return memoryStore.getData().family.id || 'fam_demo';
    }

    if (isFirestoreCanonical()) {
      const found = await resolveFamilyId({
        uid: identity.uid,
        email: identity.email,
      });
      if (found) return found;
      // Signed-in but not yet linked to a family — empty default id for create flows
      if (identity.uid || identity.email) {
        return 'fam_default';
      }
    } else {
      return memoryStore.getData().family.id;
    }
  }

  // Cron / system: no arbitrary "first family" — callers must pass familyId to loadFamilyBundle
  return memoryStore.getData().family.id || 'fam_default';
}

export async function getBundle(req?: Request, familyId?: string): Promise<DatabaseSchema> {
  // Explicit familyId only for trusted server callers (invite lookup, cron, migration)
  const id = familyId || (await resolveActiveFamilyId(req));

  if (!isFirestoreCanonical()) {
    const data = memoryStore.getData();
    if (familyId && data.family.id !== familyId) {
      data.family.id = familyId;
    }
    return data;
  }

  return loadFamilyBundle(id);
}

export async function mutateBundle(
  req: Request | undefined,
  updater: (draft: DatabaseSchema) => void,
  actionName = 'UPDATE',
  entityType = 'UNKNOWN',
  entityId = '0',
  /** Trusted server-only override (cron). Never pass client body ids here. */
  trustedFamilyId?: string
): Promise<DatabaseSchema> {
  const id = trustedFamilyId || (await resolveActiveFamilyId(req));
  const draft = await getBundle(req, id);
  const priorId = draft.family.id || id;
  updater(draft);
  // Allow empty fam_default → new fam_* only (onboarding); otherwise lock id
  const emptyShell =
    priorId === 'fam_default' &&
    (draft.members?.length || 0) === 0 &&
    (draft.occasions?.length || 0) === 0;
  if (!emptyShell) {
    draft.family.id = priorId;
  }
  const lockedFamilyId = draft.family.id || priorId;
  draft.family.id = lockedFamilyId;

  draft.auditLogs = draft.auditLogs || [];
  draft.auditLogs.unshift({
    id: `log_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    action: actionName,
    entityType,
    entityId,
    timestamp: new Date().toISOString(),
  });
  if (draft.auditLogs.length > 50) {
    draft.auditLogs = draft.auditLogs.slice(0, 50);
  }

  if (isFirestoreCanonical()) {
    await persistFamilyBundle(lockedFamilyId, draft, {
      action: actionName,
      entityType,
      entityId,
    });
    return loadFamilyBundle(lockedFamilyId);
  }

  return memoryStore.replace(draft);
}

export async function getAllBundlesForCron(): Promise<DatabaseSchema[]> {
  if (!isFirestoreCanonical()) {
    return [memoryStore.getData()];
  }
  const ids = await listFamilyIds();
  if (ids.length === 0) return [];
  return Promise.all(ids.map((id) => loadFamilyBundle(id)));
}

export async function saveUser(profile: UserProfile): Promise<UserProfile> {
  if (isFirestoreCanonical()) {
    return upsertUserProfile(profile);
  }
  return memoryStore.saveUser(profile);
}

export async function fetchUser(uid: string): Promise<UserProfile | null> {
  if (isFirestoreCanonical()) {
    return getUserProfile(uid);
  }
  return memoryStore.getData().users[uid] || null;
}

export async function fetchUsers(): Promise<UserProfile[]> {
  if (isFirestoreCanonical()) {
    return listUserProfiles();
  }
  return Object.values(memoryStore.getData().users);
}

export async function resetActiveFamily(req?: Request): Promise<DatabaseSchema> {
  const id = await resolveActiveFamilyId(req);
  if (id === 'fam_default' && isFirestoreCanonical()) {
    // Don't wipe an unrelated family via fallback id
    const empty = buildEmptyDatabase(id);
    return empty;
  }
  const empty = buildEmptyDatabase(id);
  if (isFirestoreCanonical()) {
    await persistFamilyBundle(id, empty, {
      action: 'RESET_FAMILY',
      entityType: 'SYSTEM',
      entityId: id,
    });
    return loadFamilyBundle(id);
  }
  return memoryStore.replace(empty);
}

export function attachFamilyIdToRequest(req: Request, familyId: string): void {
  (req as Request & { kulloopFamilyId?: string }).kulloopFamilyId = familyId;
}
