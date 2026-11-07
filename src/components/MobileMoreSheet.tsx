import React from 'react';
import { X, MessageSquare, Users, Calendar, Tag, ShieldCheck, Sparkles, User, ExternalLink } from 'lucide-react';
import { MYDHAROHAR } from '../constants/mydharohar';

type AppTab = 'overview' | 'occasions' | 'whatsapp' | 'members' | 'tree' | 'calendar' | 'pricing';

interface MobileMoreSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTab: (tab: AppTab) => void;
  onOpenProfile: () => void;
  onOpenChatbot: () => void;
  onOpenPrivacy: () => void;
  simpleLayout?: boolean;
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
}) => {
  if (!isOpen) return null;

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
      <div className="absolute bottom-0 inset-x-0 bg-stone-50 rounded-t-2xl border-t border-stone-200 shadow-xl max-h-[70vh] overflow-y-auto safe-area-pb">
        <div className="flex items-center justify-between px-4 py-3 border-b border-stone-200">
          <span className="text-sm font-semibold text-stone-800">More</span>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-stone-200 min-w-[44px] min-h-[44px] flex items-center justify-center"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <ul className="py-2">
          {items.map((item) => (
            <li key={item.label}>
              <button
                type="button"
                onClick={() => handlePick(item)}
                className="w-full flex items-center gap-3 px-4 py-3.5 text-left text-sm text-stone-800 hover:bg-amber-50 min-h-[48px]"
              >
                <item.icon className="w-5 h-5 text-amber-800" aria-hidden />
                {item.label}
              </button>
            </li>
          ))}
          <li className="border-t border-stone-200 mt-1 pt-1">
            <a
              href={MYDHAROHAR.home}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center gap-3 px-4 py-3 text-left text-xs text-stone-600 hover:bg-stone-100 min-h-[44px]"
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
