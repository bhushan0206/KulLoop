import { DatabaseAllResponse } from '../services/api';

/** Keep only rows belonging to the loaded family record (no cross-family bleed). */
export function scopeBundleToFamily(bundle: DatabaseAllResponse): DatabaseAllResponse {
  const familyId = bundle.family?.id;
  if (!familyId) return bundle;

  const matchesFamily = <T extends { familyId?: string }>(row: T) =>
    !row.familyId || row.familyId === familyId;

  return {
    ...bundle,
    occasions: (bundle.occasions || []).filter(matchesFamily),
    members: (bundle.members || []).filter(matchesFamily),
    people: (bundle.people || []).filter(matchesFamily),
    lineageMembers: (bundle.lineageMembers || []).filter(matchesFamily),
  };
}
