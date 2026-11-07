import { Family, FamilyMemberRole, Member } from '../types';
import { UserProfile } from '../services/firebase';

export interface FamilyAccess {
  role: FamilyMemberRole;
  canEditFamily: boolean;
  canManageMembers: boolean;
  canCreateOccasions: boolean;
  canEditOccasions: boolean;
  canDeleteOccasions: boolean;
  canMarkPerformed: boolean;
  canShareInvite: boolean;
  canExportData: boolean;
  canEditLineage: boolean;
}

const ROLE_MATRIX: Record<FamilyMemberRole, Omit<FamilyAccess, 'role'>> = {
  configurator: {
    canEditFamily: true,
    canManageMembers: true,
    canCreateOccasions: true,
    canEditOccasions: true,
    canDeleteOccasions: true,
    canMarkPerformed: true,
    canShareInvite: true,
    canExportData: true,
    canEditLineage: true,
  },
  co_karta: {
    canEditFamily: false,
    canManageMembers: true,
    canCreateOccasions: true,
    canEditOccasions: true,
    canDeleteOccasions: false,
    canMarkPerformed: true,
    canShareInvite: true,
    canExportData: true,
    canEditLineage: true,
  },
  member: {
    canEditFamily: false,
    canManageMembers: false,
    canCreateOccasions: true,
    canEditOccasions: false,
    canDeleteOccasions: false,
    canMarkPerformed: true,
    canShareInvite: false,
    canExportData: false,
    canEditLineage: false,
  },
  viewer: {
    canEditFamily: false,
    canManageMembers: false,
    canCreateOccasions: false,
    canEditOccasions: false,
    canDeleteOccasions: false,
    canMarkPerformed: false,
    canShareInvite: false,
    canExportData: false,
    canEditLineage: false,
  },
};

export function resolveMemberRole(
  members: Member[],
  currentUser: UserProfile,
  family: Family,
  isDemoMode: boolean
): FamilyMemberRole {
  if (isDemoMode) return 'configurator';

  const byUid = members.find((m) => m.authUid && m.authUid === currentUser.uid);
  if (byUid?.familyRole) return byUid.familyRole;

  const byEmail = members.find(
    (m) => m.email && currentUser.email && m.email.toLowerCase() === currentUser.email.toLowerCase()
  );
  if (byEmail?.familyRole) return byEmail.familyRole;

  if (currentUser.displayName && family.configuratorName === currentUser.displayName) {
    return 'configurator';
  }

  return 'member';
}

export function getFamilyAccess(
  members: Member[],
  currentUser: UserProfile,
  family: Family,
  isDemoMode: boolean
): FamilyAccess {
  const role = resolveMemberRole(members, currentUser, family, isDemoMode);
  return { role, ...ROLE_MATRIX[role] };
}
