import React from 'react';
import { PlusCircle, Sparkles, User, FileText, Share2 } from 'lucide-react';
import { UserProfile } from '../services/firebase';

interface HeaderProps {
  activeTab: 'overview' | 'occasions' | 'whatsapp' | 'members' | 'tree' | 'calendar' | 'pricing';
  setActiveTab: (tab: 'overview' | 'occasions' | 'whatsapp' | 'members' | 'tree' | 'calendar' | 'pricing') => void;
  onOpenAddModal: () => void;
  onOpenIntakeModal: () => void;
  onOpenProfileModal: () => void;
  onOpenChatbot: () => void;
  onOpenShareModal: () => void;
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
  currentUser,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-stone-900 text-stone-100 border-b border-stone-800 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-6 h-16">
          {/* Zone 1: Brand title, one line */}
          <div className="flex items-center gap-3 whitespace-nowrap shrink-0">
            <button
              onClick={() => setActiveTab('overview')}
              className="text-left group cursor-pointer focus:outline-none"
            >
              <div className="flex items-center gap-2">
                <span className="text-xl font-bold tracking-tight text-amber-300 font-serif-display">
                  KulLoop
                </span>
                <span className="text-xs text-stone-400 font-medium hidden sm:inline">
                  · Family Tithi Loop
                </span>
              </div>
            </button>
          </div>

          {/* Zone 2: Clean single-line text navigation links */}
          <nav className="hidden lg:flex items-center gap-5 text-sm font-medium text-stone-300">
            <button
              onClick={() => setActiveTab('overview')}
              className={`hover:text-amber-200 transition-colors whitespace-nowrap shrink-0 py-1 border-b-2 ${
                activeTab === 'overview'
                  ? 'text-amber-300 border-amber-400 font-semibold'
                  : 'border-transparent text-stone-300'
              }`}
            >
              Family Home
            </button>
            <button
              onClick={() => setActiveTab('occasions')}
              className={`hover:text-amber-200 transition-colors whitespace-nowrap shrink-0 py-1 border-b-2 ${
                activeTab === 'occasions'
                  ? 'text-amber-300 border-amber-400 font-semibold'
                  : 'border-transparent text-stone-300'
              }`}
            >
              Occasions & Tithis
            </button>
            <button
              onClick={() => setActiveTab('whatsapp')}
              className={`hover:text-amber-200 transition-colors whitespace-nowrap shrink-0 py-1 border-b-2 ${
                activeTab === 'whatsapp'
                  ? 'text-amber-300 border-amber-400 font-semibold'
                  : 'border-transparent text-stone-300'
              }`}
            >
              WhatsApp Experience
            </button>
            <button
              onClick={() => setActiveTab('tree')}
              className={`hover:text-amber-200 transition-colors whitespace-nowrap shrink-0 py-1 border-b-2 ${
                activeTab === 'tree'
                  ? 'text-amber-300 border-amber-400 font-semibold'
                  : 'border-transparent text-stone-300'
              }`}
            >
              Family Tree & Lineage
            </button>
            <button
              onClick={() => setActiveTab('members')}
              className={`hover:text-amber-200 transition-colors whitespace-nowrap shrink-0 py-1 border-b-2 ${
                activeTab === 'members'
                  ? 'text-amber-300 border-amber-400 font-semibold'
                  : 'border-transparent text-stone-300'
              }`}
            >
              Members
            </button>
            <button
              onClick={() => setActiveTab('calendar')}
              className={`hover:text-amber-200 transition-colors whitespace-nowrap shrink-0 py-1 border-b-2 ${
                activeTab === 'calendar'
                  ? 'text-amber-300 border-amber-400 font-semibold'
                  : 'border-transparent text-stone-300'
              }`}
            >
              Annual Calendar
            </button>
            <button
              onClick={() => setActiveTab('pricing')}
              className={`hover:text-amber-200 transition-colors whitespace-nowrap shrink-0 py-1 border-b-2 ${
                activeTab === 'pricing'
                  ? 'text-amber-300 border-amber-400 font-semibold'
                  : 'border-transparent text-stone-300'
              }`}
            >
              Pricing & Pilot
            </button>
          </nav>

          {/* Zone 3: AI Assistant, Profile & Primary Action */}
          <div className="flex items-center gap-2.5 shrink-0">

            {/* Share Family Calendar on WhatsApp */}
            <button
              onClick={onOpenShareModal}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-300 bg-emerald-950/60 hover:bg-emerald-900/80 border border-emerald-500/40 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer shadow-2xs"
              title="Share Family Calendar on WhatsApp or Mobile"
            >
              <Share2 className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden sm:inline">Share Calendar</span>
            </button>

            {/* Gemini AI Assistant Button */}
            <button
              onClick={onOpenChatbot}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-amber-200 bg-stone-800/90 hover:bg-stone-700/90 border border-amber-500/30 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer shadow-2xs"
              title="Chat with KulLoop Gemini Heritage Assistant"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">Heritage AI</span>
            </button>

            {/* Profile Avatar & Sign In/Out Button */}
            <button
              onClick={onOpenProfileModal}
              className={`inline-flex items-center gap-2 p-1 pl-1.5 pr-2.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                currentUser.email 
                  ? 'bg-stone-800 hover:bg-stone-700 border border-stone-700 text-stone-200' 
                  : 'bg-amber-400 hover:bg-amber-300 text-stone-950 font-semibold shadow-xs'
              }`}
              title={currentUser.email ? `Signed in as ${currentUser.displayName}` : 'Sign In / View Profile'}
            >
              <div className="w-6 h-6 rounded-full bg-amber-400 text-stone-950 font-bold flex items-center justify-center overflow-hidden text-[11px] shrink-0 border border-amber-500/40">
                {currentUser.photoURL ? (
                  <img src={currentUser.photoURL} alt={currentUser.displayName} className="w-full h-full object-cover" />
                ) : (
                  currentUser.displayName.charAt(0)
                )}
              </div>
              <span className="hidden sm:inline max-w-[100px] truncate">
                {currentUser.email ? `@${currentUser.username}` : 'Sign In'}
              </span>
            </button>

            {/* Primary Action Button */}
            <button
              onClick={onOpenAddModal}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-stone-900 bg-amber-400 hover:bg-amber-300 rounded-lg transition-colors whitespace-nowrap shrink-0 shadow-sm cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span className="hidden sm:inline">Add Occasion</span>
              <span className="sm:hidden">Add</span>
            </button>
          </div>
        </div>

        {/* Mobile secondary navigation strip */}
        <div className="flex lg:hidden items-center justify-between overflow-x-auto py-2 text-xs border-t border-stone-800 gap-4 no-scrollbar">
          <button
            onClick={() => setActiveTab('overview')}
            className={`whitespace-nowrap px-2 py-1 rounded cursor-pointer ${
              activeTab === 'overview' ? 'bg-amber-400 text-stone-900 font-semibold' : 'text-stone-300'
            }`}
          >
            Home
          </button>
          <button
            onClick={() => setActiveTab('occasions')}
            className={`whitespace-nowrap px-2 py-1 rounded cursor-pointer ${
              activeTab === 'occasions' ? 'bg-amber-400 text-stone-900 font-semibold' : 'text-stone-300'
            }`}
          >
            Occasions
          </button>
          <button
            onClick={() => setActiveTab('whatsapp')}
            className={`whitespace-nowrap px-2 py-1 rounded cursor-pointer ${
              activeTab === 'whatsapp' ? 'bg-amber-400 text-stone-900 font-semibold' : 'text-stone-300'
            }`}
          >
            WhatsApp
          </button>
          <button
            onClick={() => setActiveTab('tree')}
            className={`whitespace-nowrap px-2 py-1 rounded cursor-pointer ${
              activeTab === 'tree' ? 'bg-amber-400 text-stone-900 font-semibold' : 'text-stone-300'
            }`}
          >
            Tree & Duties
          </button>
          <button
            onClick={() => setActiveTab('members')}
            className={`whitespace-nowrap px-2 py-1 rounded cursor-pointer ${
              activeTab === 'members' ? 'bg-amber-400 text-stone-900 font-semibold' : 'text-stone-300'
            }`}
          >
            Members
          </button>
          <button
            onClick={() => setActiveTab('calendar')}
            className={`whitespace-nowrap px-2 py-1 rounded cursor-pointer ${
              activeTab === 'calendar' ? 'bg-amber-400 text-stone-900 font-semibold' : 'text-stone-300'
            }`}
          >
            Calendar
          </button>
          <button
            onClick={() => setActiveTab('pricing')}
            className={`whitespace-nowrap px-2 py-1 rounded cursor-pointer ${
              activeTab === 'pricing' ? 'bg-amber-400 text-stone-900 font-semibold' : 'text-stone-300'
            }`}
          >
            Pilot
          </button>
        </div>
      </div>
    </header>
  );
};
