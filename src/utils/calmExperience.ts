const STORAGE_KEY = 'kulloop_simple_layout';

/** Default ON — fewer buttons, clearer paths for all ages. */
export function readSimpleLayout(): boolean {
  if (typeof window === 'undefined') return true;
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === null) return true;
  return stored === 'true';
}

export function writeSimpleLayout(enabled: boolean): void {
  localStorage.setItem(STORAGE_KEY, enabled ? 'true' : 'false');
}

export function isReducedChrome(elderMode: boolean, simpleLayout: boolean): boolean {
  return elderMode || simpleLayout;
}
