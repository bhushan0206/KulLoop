import { Request, Response, NextFunction } from 'express';
import { AccessIdentity, FamilyPermission, resolveServerAccess } from './familyAccess';
import { Member } from '../src/types';
import { verifyFirebaseIdToken, isFirebaseAdminReady } from './firebaseAdmin';
import { getBundle } from './kulloopStore';

const SELF_EDIT_KEYS = new Set([
  'reminderPreferences',
  'receiveDayOfNote',
  'digestPreference',
  'frequencyCapPerWeek',
  'optIns',
  'leadTime',
]);

export type AuthenticatedRequest = Request & {
  kulloopIdentity?: AccessIdentity;
  kulloopAccess?: ReturnType<typeof resolveServerAccess>;
  kulloopFamilyId?: string;
};

function headerIdentity(req: Request): AccessIdentity {
  const demoHeader = req.get('x-kulloop-demo');
  return {
    uid: req.get('x-kulloop-uid')?.trim() || undefined,
    email: req.get('x-kulloop-email')?.trim() || undefined,
    displayName: req.get('x-kulloop-display-name')?.trim() || undefined,
    isDemoMode: demoHeader === '1' || demoHeader === 'true',
  };
}

/**
 * Resolve caller identity:
 * 1) Demo explore mode (x-kulloop-demo)
 * 2) Verified Firebase ID token (Authorization: Bearer)
 * 3) Dev header fallback when REQUIRE_FIREBASE_AUTH is not true
 */
export async function resolveRequestIdentity(req: Request): Promise<AccessIdentity> {
  const headers = headerIdentity(req);
  if (headers.isDemoMode) {
    return { ...headers, isDemoMode: true };
  }

  const authHeader = req.get('authorization') || req.get('Authorization') || '';
  const bearer = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';

  if (bearer) {
    const decoded = await verifyFirebaseIdToken(bearer);
    if (decoded) {
      return {
        uid: decoded.uid,
        email: decoded.email || headers.email,
        displayName: decoded.name || headers.displayName,
        isDemoMode: false,
      };
    }
    const err = new Error('Invalid or expired Firebase ID token');
    (err as Error & { status: number }).status = 401;
    throw err;
  }

  const requireAuth = process.env.REQUIRE_FIREBASE_AUTH === 'true';
  if (requireAuth) {
    const err = new Error(
      isFirebaseAdminReady()
        ? 'Authorization Bearer token required'
        : 'Firebase Admin not configured — set FIREBASE_PROJECT_ID or service account'
    );
    (err as Error & { status: number }).status = 401;
    throw err;
  }

  return headers;
}

export function readAccessIdentity(req: Request): AccessIdentity {
  const authed = (req as AuthenticatedRequest).kulloopIdentity;
  if (authed) return authed;
  return headerIdentity(req);
}

/** Attach verified identity before permission checks. */
export async function attachIdentity(req: Request, res: Response, next: NextFunction) {
  try {
    const identity = await resolveRequestIdentity(req);
    (req as AuthenticatedRequest).kulloopIdentity = identity;
    next();
  } catch (err: unknown) {
    const status = (err as { status?: number })?.status || 401;
    const message = err instanceof Error ? err.message : 'Unauthorized';
    return res.status(status).json({ error: 'Unauthorized', message });
  }
}

export function requireFamilyPermission(permission: FamilyPermission) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await getBundle(req);
      (req as AuthenticatedRequest).kulloopFamilyId = data.family.id;
      const access = resolveServerAccess(data.members, data.family, readAccessIdentity(req));

      if (!access[permission]) {
        return res.status(403).json({
          error: 'Forbidden',
          message: `Your family role (${access.role}) cannot perform this action.`,
          role: access.role,
        });
      }

      (req as AuthenticatedRequest).kulloopAccess = access;
      next();
    } catch (err: unknown) {
      console.error('[access] permission check failed:', err);
      return res.status(500).json({
        error: 'Storage error',
        message: err instanceof Error ? err.message : 'Failed to load family',
      });
    }
  };
}

/** Compose: verify identity, then check permission. */
export function gate(permission: FamilyPermission) {
  return [attachIdentity, requireFamilyPermission(permission)];
}

export function gateMemberUpdate() {
  return [attachIdentity, requireMemberUpdatePermission];
}

/** Member PUT: managers may edit anyone; others only self reminder prefs. */
export async function requireMemberUpdatePermission(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await getBundle(req);
    (req as AuthenticatedRequest).kulloopFamilyId = data.family.id;
    const identity = readAccessIdentity(req);
    const access = resolveServerAccess(data.members, data.family, identity);
    const id = req.params.id;
    const updates = req.body || {};

    if (access.canManageMembers) {
      (req as AuthenticatedRequest).kulloopAccess = access;
      return next();
    }

    const existing = data.members.find((m) => m.id === id);
    if (!existing) {
      return res.status(404).json({ error: 'Member not found' });
    }

    const isSelf =
      (access.memberId && access.memberId === id) ||
      (identity.uid && existing.authUid === identity.uid) ||
      (identity.email &&
        existing.email &&
        existing.email.toLowerCase() === identity.email.toLowerCase());

    if (!isSelf) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'You may only update your own reminder settings.',
      });
    }

    const updateKeys = Object.keys(updates).filter((k) => k !== 'id');
    const onlySelfFields = updateKeys.every((k) => SELF_EDIT_KEYS.has(k));
    if (!onlySelfFields) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'View-only members may only change reminder preferences.',
      });
    }

    (req as AuthenticatedRequest).kulloopAccess = access;
    next();
  } catch (err: unknown) {
    console.error('[access] member update check failed:', err);
    return res.status(500).json({
      error: 'Storage error',
      message: err instanceof Error ? err.message : 'Failed to load family',
    });
  }
}

export function memberMatchesIdentity(member: Member, identity: AccessIdentity): boolean {
  if (identity.uid && member.authUid === identity.uid) return true;
  if (
    identity.email &&
    member.email &&
    member.email.toLowerCase() === identity.email.toLowerCase()
  ) {
    return true;
  }
  return false;
}
