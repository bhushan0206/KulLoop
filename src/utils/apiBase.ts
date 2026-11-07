/**
 * Resolves API paths for web, Vercel, and Capacitor Android shells.
 * Set VITE_API_BASE_URL to your deployed origin (e.g. https://kulloop.vercel.app) when the
 * native app bundles static assets but calls your hosted Express API.
 */
export function getApiBaseUrl(): string {
  const fromEnv = import.meta.env.VITE_API_BASE_URL?.trim();
  if (fromEnv) {
    return fromEnv.replace(/\/$/, '');
  }
  if (typeof window !== 'undefined' && window.location?.origin) {
    return window.location.origin.replace(/\/$/, '');
  }
  return '';
}

export function apiUrl(path: string): string {
  const normalized = path.startsWith('/') ? path : `/${path}`;
  const base = getApiBaseUrl();
  return base ? `${base}${normalized}` : normalized;
}
