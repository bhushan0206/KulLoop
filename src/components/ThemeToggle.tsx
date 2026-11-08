import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { ThemeMode, getEffectiveTheme } from '../utils/theme';

interface ThemeToggleProps {
  theme: ThemeMode;
  onToggle: () => void;
  className?: string;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({
  theme,
  onToggle,
  className = '',
}) => {
  const effective = getEffectiveTheme(theme);
  const isDark = effective === 'dark';

  return (
    <button
      type="button"
      onClick={onToggle}
      className={`inline-flex items-center justify-center p-2 rounded-lg text-xs font-medium border transition-colors cursor-pointer min-h-[36px] min-w-[36px] ${
        isDark
          ? 'bg-stone-800 text-amber-300 border-stone-700 hover:bg-stone-700 hover:text-amber-200'
          : 'bg-stone-800/90 text-stone-300 border-stone-700 hover:bg-stone-700/90 hover:text-white'
      } ${className}`}
      title={isDark ? 'Switch to Light mode' : 'Switch to Dark mode'}
      aria-label={isDark ? 'Switch to Light mode' : 'Switch to Dark mode'}
    >
      {isDark ? (
        <Sun className="w-4 h-4 text-amber-300" aria-hidden />
      ) : (
        <Moon className="w-4 h-4 text-stone-300" aria-hidden />
      )}
    </button>
  );
};
