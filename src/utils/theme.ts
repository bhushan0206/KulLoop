const STORAGE_KEY = 'kulloop_theme';

export type ThemeMode = 'light' | 'dark' | 'system';

export function readTheme(): ThemeMode {
  if (typeof window === 'undefined') return 'system';
  const val = localStorage.getItem(STORAGE_KEY);
  if (val === 'light' || val === 'dark' || val === 'system') return val;
  return 'system';
}

export function writeTheme(theme: ThemeMode): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, theme);
  applyTheme(theme);
}

export function getEffectiveTheme(theme: ThemeMode): 'light' | 'dark' {
  if (theme === 'system' && typeof window !== 'undefined') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  return theme === 'dark' ? 'dark' : 'light';
}

export function applyTheme(theme?: ThemeMode): void {
  if (typeof window === 'undefined') return;
  const targetTheme = theme ?? readTheme();
  const effective = getEffectiveTheme(targetTheme);
  const root = document.documentElement;

  if (effective === 'dark') {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }
}
