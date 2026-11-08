import React from 'react';
import { X, MessageSquare, Users, Calendar, Tag, ShieldCheck, Sparkles, User, ExternalLink, Sun, Moon } from 'lucide-react';
import { MYDHAROHAR } from '../constants/mydharohar';
import { ThemeMode, getEffectiveTheme } from '../utils/theme';

type AppTab = 'overview' | 'occasions' | 'whatsapp' | 'members' | 'tree' | 'calendar' | 'pricing';

interface MobileMoreSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTab: (tab: AppTab) => void;
  onOpenProfile: () => void;
  onOpenChatbot: () => void;
  onOpenPrivacy: () => void;
  simpleLayout?: boolean;
  theme?: ThemeMode;
  onToggleTheme?: () => void;
}

const MORE_ITEMS: { tab?: AppTab; label: string; icon: typeof MessageSquare; action?: 'profile' | 'ai' | 'privacy' }[] = [
  { tab: 'whatsapp', label: 'WhatsApp loop', icon: MessageSquare },
  { tab: 'members', label: 'Family members', icon: Users },
  { tab: 'calendar', label: 'Annual calendar', icon: Calendar },
  { tab: 'pricing', label: 'Pilot plan', icon: Tag },
  { action: 'profile', label: 'Profile & community', icon: User },
  { action: 'ai', label: 'Heritage AI', icon: Sparkles },
  { action: 'privacy', label: 'Privacy policy', icon: ShieldCheck },
];

export const MobileMoreSheet: React.FC<MobileMoreSheetProps> = ({
  isOpen,
  onClose,
  onSelectTab,
  onOpenProfile,
  onOpenChatbot,
  onOpenPrivacy,
  simpleLayout,
  theme = 'system',
  onToggleTheme,
}) => {
  if (!isOpen) return null;

  const isDark = getEffectiveTheme(theme) === 'dark';

  const items = simpleLayout
    ? MORE_ITEMS.filter((i) => i.tab !== 'pricing')
    : MORE_ITEMS;

  const handlePick = (item: (typeof MORE_ITEMS)[number]) => {
    onClose();
    if (item.tab) {
      onSelectTab(item.tab);
    } else if (item.action === 'profile') {
      onOpenProfile();
    } else if (item.action === 'ai') {
      onOpenChatbot();
    } else if (item.action === 'privacy') {
      onOpenPrivacy();
    }
  };

  return (
    <div className="fixed inset-0 z-40 xl:hidden" role="dialog" aria-modal="true" aria-label="More options">
      <button type="button" className="absolute inset-0 bg-stone-900/50" aria-label="Close menu" onClick={onClose} />
      <div className="absolute bottom-0 inset-x-0 bg-stone-50 dark:bg-stone-900 rounded-t-2xl border-t border-stone-200 dark:border-stone-800 shadow-xl max-h-[70vh] overflow-y-auto safe-area-pb">
        <div className="flex items-center justify-between px-4 py-3 border-b border-stone-200 dark:border-stone-800">
          <span className="text-sm font-semibold text-stone-800 dark:text-stone-100">More</span>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-stone-200 dark:hover:bg-stone-800 min-w-[44px] min-h-[44px] flex items-center justify-center text-stone-600 dark:text-stone-300"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <ul className="py-2">
          {onToggleTheme && (
            <li>
              <button
                type="button"
                onClick={() => {
                  onToggleTheme();
                }}
                className="w-full flex items-center justify-between px-4 py-3.5 text-left text-sm text-stone-800 dark:text-stone-200 hover:bg-amber-50 dark:hover:bg-stone-800 min-h-[48px]"
              >
                <div className="flex items-center gap-3">
                  {isDark ? (
                    <Sun className="w-5 h-5 text-amber-400" aria-hidden />
                  ) : (
                    <Moon className="w-5 h-5 text-stone-600" aria-hidden />
                  )}
                  <span>Appearance</span>
                </div>
                <span className="text-xs px-2 py-0.5 rounded-full bg-stone-200 dark:bg-stone-800 text-stone-600 dark:text-stone-300 font-medium">
                  {isDark ? 'Dark mode' : 'Light mode'}
                </span>
              </button>
            </li>
          )}
          {items.map((item) => (
            <li key={item.label}>
              <button
                type="button"
                onClick={() => handlePick(item)}
                className="w-full flex items-center gap-3 px-4 py-3.5 text-left text-sm text-stone-800 dark:text-stone-200 hover:bg-amber-50 dark:hover:bg-stone-800 min-h-[48px]"
              >
                <item.icon className="w-5 h-5 text-amber-800 dark:text-amber-400" aria-hidden />
                {item.label}
              </button>
            </li>
          ))}
          <li className="border-t border-stone-200 dark:border-stone-800 mt-1 pt-1">
            <a
              href={MYDHAROHAR.home}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center gap-3 px-4 py-3 text-left text-xs text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 min-h-[44px]"
              onClick={onClose}
            >
              <ExternalLink className="w-4 h-4 text-stone-500 shrink-0" aria-hidden />
              Optional prep guides (partner site)
            </a>
          </li>
        </ul>
      </div>
    </div>
  );
};
