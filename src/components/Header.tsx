import React, { useState } from 'react';
import { 
  PlusCircle, 
  Sparkles, 
  User, 
  FileText, 
  Share2, 
  LogOut, 
  Bell, 
  Menu, 
  X,
  Home,
  Calendar,
  MessageSquare,
  Users,
  GitBranch,
  ShieldCheck,
  Tag
} from 'lucide-react';
import { UserProfile } from '../services/firebase';

interface HeaderProps {
  activeTab: 'overview' | 'occasions' | 'whatsapp' | 'members' | 'tree' | 'calendar' | 'pricing';
  setActiveTab: (tab: 'overview' | 'occasions' | 'whatsapp' | 'members' | 'tree' | 'calendar' | 'pricing') => void;
  onOpenAddModal: () => void;
  onOpenIntakeModal: () => void;
  onOpenProfileModal: () => void;
  onOpenChatbot: () => void;
  onOpenShareModal: () => void;
  onOpenRemindersModal?: () => void;
  onExitDemo?: () => void;
  isDemoMode?: boolean;
  currentUser: UserProfile;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  onOpenAddModal,
  onOpenIntakeModal,
  onOpenProfileModal,
  onOpenChatbot,
  onOpenShareModal,
  onOpenRemindersModal,
  onExitDemo,
  isDemoMode,
  currentUser,
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navItems = [
    { key: 'overview' as const, label: 'Home', icon: Home },
    { key: 'occasions' as const, label: 'Occasions', icon: Calendar },
    { key: 'whatsapp' as const, label: 'WhatsApp', icon: MessageSquare },
    { key: 'tree' as const, label: 'Lineage Tree', icon: GitBranch },
    { key: 'members' as const, label: 'Members', icon: Users },
    { key: 'calendar' as const, label: 'Annual Calendar', icon: Calendar },
    { key: 'pricing' as const, label: 'Pricing (Pilot)', icon: Tag },
  ];

  const handleSelectNav = (tab: typeof activeTab) => {
    setActiveTab(tab);
    setIsMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 bg-stone-900 text-stone-100 border-b border-stone-800 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-4 sm:gap-6 h-16">
          {/* Zone 1: Brand title, one line */}
          <div className="flex items-center gap-3 whitespace-nowrap shrink-0">
            {/* Hamburger Button for Mobile / Tablet */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="xl:hidden p-1.5 text-stone-400 hover:text-white rounded-lg hover:bg-stone-800 transition-colors cursor-pointer"
              aria-label={isMobileMenuOpen ? 'Close Navigation Menu' : 'Open Navigation Menu'}
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            <a
              href="/"
              onClick={(e) => {
                e.preventDefault();
                handleSelectNav('overview');
              }}
              className="text-left group cursor-pointer focus:outline-none flex items-center gap-2"
              title="Return to Home Overview"
            >
              <span className="text-xl font-bold tracking-tight text-amber-300 font-serif-display group-hover:text-amber-200 transition-colors">
                KulLoop
              </span>
              <span className="text-xs text-stone-400 font-medium hidden sm:inline">
                · Family Tithi Loop
              </span>
            </a>
          </div>

          {/* Zone 2: Desktop text navigation links */}
          <nav className="hidden xl:flex items-center gap-4 text-xs lg:text-sm font-medium text-stone-300">
            {navItems.map((item) => (
              <button
                key={item.key}
                onClick={() => handleSelectNav(item.key)}
                className={`hover:text-amber-200 transition-colors whitespace-nowrap shrink-0 py-1 border-b-2 ${
                  activeTab === item.key
                    ? 'text-amber-300 border-amber-400 font-semibold'
                    : 'border-transparent text-stone-300'
                }`}
              >
                {item.label}
              </button>
            ))}
          </nav>

          {/* Zone 3: Actions, Demo Badge & Profile */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {isDemoMode && onExitDemo && (
              <button
                onClick={onExitDemo}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-semibold text-amber-950 bg-amber-400 hover:bg-amber-300 rounded-lg transition-all cursor-pointer shadow-xs animate-pulse"
                title="Exit Demo and Set Up Your Family"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Exit Demo</span>
              </button>
            )}

            {/* Share Family Calendar on WhatsApp */}
            <button
              onClick={onOpenShareModal}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-emerald-300 bg-emerald-950/60 hover:bg-emerald-900/80 border border-emerald-500/40 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer shadow-2xs"
              title="Share Family Calendar on WhatsApp or Mobile"
            >
              <Share2 className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden md:inline">Share</span>
            </button>

            {/* Zero-Cost Notification & Reminder Hub */}
            {onOpenRemindersModal && (
              <button
                onClick={onOpenRemindersModal}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-amber-200 bg-stone-800/90 hover:bg-stone-700/90 border border-amber-500/30 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer shadow-2xs"
                title="Open Zero-Fee Reminder Hub (WhatsApp, Calendar, Email, Push)"
              >
                <Bell className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden md:inline">Reminders</span>
              </button>
            )}

            {/* Gemini AI Assistant Button */}
            <button
              onClick={onOpenChatbot}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-amber-200 bg-stone-800/90 hover:bg-stone-700/90 border border-amber-500/30 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer shadow-2xs"
              title="Chat with KulLoop Gemini Heritage Assistant"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden md:inline">Heritage AI</span>
            </button>

            {/* Profile Avatar & Sign In/Out Button */}
            <button
              onClick={onOpenProfileModal}
              className={`inline-flex items-center gap-1.5 p-1 pl-1.5 pr-2 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                currentUser.email 
                  ? 'bg-stone-800 hover:bg-stone-700 border border-stone-700 text-stone-200' 
                  : 'bg-amber-400 hover:bg-amber-300 text-stone-950 font-semibold shadow-xs'
              }`}
              title={currentUser.email ? `Signed in as ${currentUser.displayName}` : 'Sign In / View Profile'}
            >
              <div className="w-5 h-5 rounded-full bg-amber-400 text-stone-950 font-bold flex items-center justify-center overflow-hidden text-[10px] shrink-0 border border-amber-500/40">
                {currentUser.photoURL ? (
                  <img src={currentUser.photoURL} alt={currentUser.displayName} className="w-full h-full object-cover" />
                ) : (
                  currentUser.displayName.charAt(0)
                )}
              </div>
              <span className="hidden lg:inline max-w-[80px] truncate text-[11px]">
                {currentUser.email ? `@${currentUser.username}` : 'Sign In'}
              </span>
            </button>

            {/* Primary Action Button */}
            <button
              onClick={onOpenAddModal}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-stone-900 bg-amber-400 hover:bg-amber-300 rounded-lg transition-colors whitespace-nowrap shrink-0 shadow-sm cursor-pointer"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Add</span>
            </button>
          </div>
        </div>

        {/* Secondary navigation strip (visible below xl breakpoint) */}
        <div className="flex xl:hidden items-center overflow-x-auto py-2 text-xs border-t border-stone-800 gap-1.5 no-scrollbar">
          {navItems.map((item) => (
            <button
              key={item.key}
              onClick={() => handleSelectNav(item.key)}
              className={`whitespace-nowrap px-2.5 py-1 rounded-lg text-xs font-medium cursor-pointer transition-colors ${
                activeTab === item.key 
                  ? 'bg-amber-400 text-stone-950 font-semibold shadow-xs' 
                  : 'text-stone-300 hover:text-white hover:bg-stone-800'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Slide-out Mobile Navigation Drawer Modal */}
      {isMobileMenuOpen && (
        <div className="xl:hidden fixed inset-0 z-50 bg-stone-950/80 backdrop-blur-xs flex">
          <div className="w-4/5 max-w-xs bg-stone-900 border-r border-stone-800 h-full p-5 flex flex-col justify-between shadow-2xl animate-fade-in">
            <div className="space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-stone-800">
                <div className="flex items-center gap-2">
                  <span className="text-xl font-bold font-serif-display text-amber-300">KulLoop</span>
                  <span className="text-[11px] text-stone-400">· Family Loop</span>
                </div>
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-1 text-stone-400 hover:text-white rounded-lg hover:bg-stone-800 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Navigation Items */}
              <nav className="space-y-1">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.key;
                  return (
                    <button
                      key={item.key}
                      onClick={() => handleSelectNav(item.key)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all text-left ${
                        isActive
                          ? 'bg-amber-400 text-stone-950 font-semibold shadow-sm'
                          : 'text-stone-300 hover:bg-stone-800 hover:text-white'
                      }`}
                    >
                      <Icon className={`w-4 h-4 ${isActive ? 'text-stone-950' : 'text-amber-400'}`} />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </nav>

              {/* Quick Actions in Mobile Drawer */}
              <div className="pt-4 border-t border-stone-800 space-y-2">
                <button
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    onOpenAddModal();
                  }}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-amber-400 hover:bg-amber-300 text-stone-950 text-xs font-semibold rounded-xl shadow-xs transition-colors cursor-pointer"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>+ Record Sacred Occasion</span>
                </button>

                {onOpenRemindersModal && (
                  <button
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      onOpenRemindersModal();
                    }}
                    className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-stone-800 hover:bg-stone-700 text-amber-200 text-xs font-medium rounded-xl border border-stone-700 transition-colors cursor-pointer"
                  >
                    <Bell className="w-4 h-4 text-amber-400" />
                    <span>Free Reminders Hub</span>
                  </button>
                )}
              </div>
            </div>

            {/* Drawer Footer with Account info */}
            <div className="pt-4 border-t border-stone-800 flex items-center justify-between">
              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  onOpenProfileModal();
                }}
                className="flex items-center gap-2 text-left group"
              >
                <div className="w-7 h-7 rounded-full bg-amber-400 text-stone-950 font-bold flex items-center justify-center text-xs">
                  {currentUser.displayName ? currentUser.displayName.charAt(0) : 'U'}
                </div>
                <div>
                  <div className="text-xs font-semibold text-stone-200 group-hover:text-amber-300 transition-colors">
                    {currentUser.displayName || 'Guest User'}
                  </div>
                  <div className="text-[10px] text-stone-400">
                    {currentUser.email ? `@${currentUser.username}` : 'Manage Account'}
                  </div>
                </div>
              </button>
            </div>
          </div>
          {/* Backdrop dismiss */}
          <div className="flex-1" onClick={() => setIsMobileMenuOpen(false)} />
        </div>
      )}
    </header>
  );
};
