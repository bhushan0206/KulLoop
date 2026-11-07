import { Family, FamilyMemberRole, Member } from '../src/types';

export type FamilyPermission =
  | 'canEditFamily'
  | 'canManageMembers'
  | 'canCreateOccasions'
  | 'canEditOccasions'
  | 'canDeleteOccasions'
  | 'canMarkPerformed'
  | 'canEditLineage';

export interface ServerFamilyAccess {
  role: FamilyMemberRole;
  memberId?: string;
  canEditFamily: boolean;
  canManageMembers: boolean;
  canCreateOccasions: boolean;
  canEditOccasions: boolean;
  canDeleteOccasions: boolean;
  canMarkPerformed: boolean;
  canEditLineage: boolean;
}

const ROLE_MATRIX: Record<FamilyMemberRole, Omit<ServerFamilyAccess, 'role' | 'memberId'>> = {
  configurator: {
    canEditFamily: true,
    canManageMembers: true,
    canCreateOccasions: true,
    canEditOccasions: true,
    canDeleteOccasions: true,
    canMarkPerformed: true,
    canEditLineage: true,
  },
  co_karta: {
    canEditFamily: false,
    canManageMembers: true,
    canCreateOccasions: true,
    canEditOccasions: true,
    canDeleteOccasions: false,
    canMarkPerformed: true,
    canEditLineage: true,
  },
  member: {
    canEditFamily: false,
    canManageMembers: false,
    canCreateOccasions: true,
    canEditOccasions: false,
    canDeleteOccasions: false,
    canMarkPerformed: true,
    canEditLineage: false,
  },
  viewer: {
    canEditFamily: false,
    canManageMembers: false,
    canCreateOccasions: false,
    canEditOccasions: false,
    canDeleteOccasions: false,
    canMarkPerformed: false,
    canEditLineage: false,
  },
};

export interface AccessIdentity {
  uid?: string;
  email?: string;
  displayName?: string;
  isDemoMode?: boolean;
}

export function resolveServerAccess(
  members: Member[],
  family: Family,
  identity: AccessIdentity
): ServerFamilyAccess {
  if (identity.isDemoMode) {
    return { role: 'configurator', ...ROLE_MATRIX.configurator };
  }

  let role: FamilyMemberRole = 'member';
  let memberId: string | undefined;

  if (identity.uid) {
    const byUid = members.find((m) => m.authUid === identity.uid);
    if (byUid) {
      memberId = byUid.id;
      if (byUid.familyRole) role = byUid.familyRole;
    }
  }

  if (!memberId && identity.email) {
    const byEmail = members.find(
      (m) => m.email && m.email.toLowerCase() === identity.email!.toLowerCase()
    );
    if (byEmail) {
      memberId = byEmail.id;
      if (byEmail.familyRole) role = byEmail.familyRole;
    }
  }

  if (
    identity.displayName &&
    family.configuratorName &&
    identity.displayName === family.configuratorName
  ) {
    role = 'configurator';
  }

  return { role, memberId, ...ROLE_MATRIX[role] };
}
