import React from 'react';
import { Home, Calendar, GitBranch, Bell, MoreHorizontal } from 'lucide-react';

type AppTab = 'overview' | 'occasions' | 'whatsapp' | 'members' | 'tree' | 'calendar' | 'pricing';

interface MobileBottomNavProps {
  activeTab: AppTab;
  onSelectTab: (tab: AppTab) => void;
  onOpenReminders: () => void;
  onOpenMore: () => void;
}

const TAB_ITEMS: { tab: AppTab; label: string; icon: typeof Home }[] = [
  { tab: 'overview', label: 'Home', icon: Home },
  { tab: 'occasions', label: 'Occasions', icon: Calendar },
  { tab: 'tree', label: 'Kul', icon: GitBranch },
];

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  activeTab,
  onSelectTab,
  onOpenReminders,
  onOpenMore,
}) => {
  return (
    <nav
      className="xl:hidden fixed bottom-0 inset-x-0 z-30 bg-stone-900/95 backdrop-blur border-t border-stone-700 safe-area-pb"
      aria-label="Primary"
    >
      <div className="grid grid-cols-5 max-w-lg mx-auto">
        {TAB_ITEMS.map(({ tab, label, icon: Icon }) => {
          const selected = activeTab === tab;
          return (
            <button
              key={tab}
              type="button"
              onClick={() => onSelectTab(tab)}
              className={`flex flex-col items-center justify-center gap-0.5 py-2.5 min-h-[56px] text-[10px] font-medium transition-colors ${
                selected ? 'text-amber-300' : 'text-stone-400 hover:text-stone-200'
              }`}
              aria-current={selected ? 'page' : undefined}
            >
              <Icon className="w-5 h-5" aria-hidden />
              <span>{label}</span>
            </button>
          );
        })}
        <button
          type="button"
          onClick={onOpenReminders}
          className="flex flex-col items-center justify-center gap-0.5 py-2.5 min-h-[56px] text-[10px] font-medium text-stone-400 hover:text-stone-200"
        >
          <Bell className="w-5 h-5" aria-hidden />
          <span>Alerts</span>
        </button>
        <button
          type="button"
          onClick={onOpenMore}
          className={`flex flex-col items-center justify-center gap-0.5 py-2.5 min-h-[56px] text-[10px] font-medium transition-colors ${
            ['whatsapp', 'members', 'calendar', 'pricing'].includes(activeTab)
              ? 'text-amber-300'
              : 'text-stone-400 hover:text-stone-200'
          }`}
          aria-haspopup="dialog"
        >
          <MoreHorizontal className="w-5 h-5" aria-hidden />
          <span>More</span>
        </button>
      </div>
    </nav>
  );
};
