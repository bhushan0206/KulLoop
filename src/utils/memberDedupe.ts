import { Member } from '../types';

function memberRank(m: Member, currentUid?: string, currentEmail?: string): number {
  let score = 0;
  if (currentUid && m.authUid === currentUid) score += 100;
  if (currentEmail && m.email?.toLowerCase() === currentEmail.toLowerCase()) score += 50;
  if (m.authUid) score += 10;
  if (m.email) score += 5;
  if (m.familyRole === 'configurator') score += 3;
  const ts = parseInt(m.id.replace(/^mem_/, ''), 10);
  if (!Number.isNaN(ts)) score += Math.min(ts / 1e15, 2);
  return score;
}

function identityKey(m: Member): string {
  if (m.authUid) return `uid:${m.authUid}`;
  if (m.email?.trim()) return `email:${m.email.trim().toLowerCase()}`;
  const phone = (m.phone || '').replace(/\D/g, '');
  const name = (m.name || '').toLowerCase().trim();
  if (phone.length >= 10 && name) return `phone:${phone}|${name}`;
  return `id:${m.id}`;
}

/** Collapse duplicate rows from re-onboarding, Firestore + REST drift, or double POST. */
export function dedupeMembers(
  members: Member[],
  options?: { currentUid?: string; currentEmail?: string; familyId?: string }
): Member[] {
  const { currentUid, currentEmail, familyId } = options || {};
  const scoped = familyId ? members.filter((m) => m.familyId === familyId) : members;

  const byId = new Map<string, Member>();
  for (const m of scoped) byId.set(m.id, m);

  const byIdentity = new Map<string, Member>();
  for (const m of byId.values()) {
    const key = identityKey(m);
    const prev = byIdentity.get(key);
    if (!prev) {
      byIdentity.set(key, m);
      continue;
    }
    const keep =
      memberRank(m, currentUid, currentEmail) >= memberRank(prev, currentUid, currentEmail) ? m : prev;
    byIdentity.set(key, keep);
  }

  let list = [...byIdentity.values()];

  const phoneName = new Map<string, Member[]>();
  for (const m of list) {
    const phone = (m.phone || '').replace(/\D/g, '');
    const name = (m.name || '').toLowerCase().trim();
    if (phone.length < 10 || !name) continue;
    const k = `${phone}|${name}`;
    if (!phoneName.has(k)) phoneName.set(k, []);
    phoneName.get(k)!.push(m);
  }

  for (const group of phoneName.values()) {
    const configurators = group.filter((m) =>
      (m.relationship || '').toLowerCase().includes('configurator')
    );
    if (configurators.length <= 1) continue;

    const best = configurators.reduce((a, b) =>
      memberRank(b, currentUid, currentEmail) > memberRank(a, currentUid, currentEmail) ? b : a
    );
    const dropIds = new Set(configurators.filter((m) => m.id !== best.id).map((m) => m.id));
    list = list.filter((m) => !dropIds.has(m.id));
  }

  return list.sort((a, b) => a.name.localeCompare(b.name));
}
