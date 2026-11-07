/** Normalizes user input (KUL-AB12CD, kul ab12cd, etc.) */
export function normalizeInviteCode(raw: string): string {
  const cleaned = raw.trim().toUpperCase().replace(/\s+/g, '');
  if (cleaned.startsWith('KUL-')) {
    return cleaned;
  }
  if (/^[A-Z0-9]{6}$/.test(cleaned)) {
    return `KUL-${cleaned}`;
  }
  return cleaned;
}

export function generateInviteCode(): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let suffix = '';
  for (let i = 0; i < 6; i++) {
    suffix += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return `KUL-${suffix}`;
}

export function buildInviteLink(origin: string, code: string): string {
  const normalized = normalizeInviteCode(code);
  const params = new URLSearchParams({ join: normalized.replace(/^KUL-/, '') });
  return `${origin.replace(/\/$/, '')}/?${params.toString()}`;
}
