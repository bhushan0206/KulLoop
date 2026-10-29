import React from 'react';
import { Family, FamilyOccasion, Member } from '../types';
import { 
  Compass, 
  MapPin, 
  BookOpen, 
  CheckCircle, 
  Bell, 
  ShieldCheck, 
  ArrowRight, 
  Clock, 
  Smartphone, 
  FileText, 
  Sparkles,
  Users,
  GitBranch
} from 'lucide-react';

import { MonthlyRitualTracker } from './MonthlyRitualTracker';
import { NextRitualCountdown } from './NextRitualCountdown';

interface FamilyDashboardProps {
  family: Family;
  occasions: FamilyOccasion[];
  members: Member[];
  onSelectOccasion: (occ: FamilyOccasion) => void;
  onPreviewWhatsApp: (occ: FamilyOccasion) => void;
  onGeneratePriestNote: (occ: FamilyOccasion) => void;
  onNavigateTab: (tab: 'occasions' | 'whatsapp' | 'members' | 'calendar' | 'pricing' | 'tree') => void;
  onOpenAddModal: () => void;
  onTogglePerformed: (id: string, notes?: string, performedBy?: string) => void;
  onAddMemoryPhoto?: (occasionId: string, photo: { id: string; url: string; caption?: string; year?: number; uploadedAt: string }) => void;
  onDeleteMemoryPhoto?: (occasionId: string, photoId: string) => void;
}

export const FamilyDashboard: React.FC<FamilyDashboardProps> = ({
  family,
  occasions,
  members,
  onSelectOccasion,
  onPreviewWhatsApp,
  onGeneratePriestNote,
  onNavigateTab,
  onOpenAddModal,
  onTogglePerformed,
  onAddMemoryPhoto,
  onDeleteMemoryPhoto,
}) => {
  // Sort upcoming occasions
  const upcomingOccasions = [...occasions].slice(0, 3);
  const confirmedCount = occasions.filter((o) => o.isConfirmed).length;

  return (
    <div className="space-y-10 pb-16">
      {/* Hero Split Section */}
      <div className="bg-stone-900 rounded-2xl overflow-hidden border border-stone-800 shadow-lg text-white">
        <div className="grid grid-cols-1 lg:grid-cols-12 items-stretch">
          {/* Text narrative */}
          <div className="lg:col-span-7 p-6 sm:p-10 flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-xs font-medium text-amber-300">
                <span className="uppercase tracking-wider">Independent Family Ritual Service</span>
                <span aria-hidden="true">·</span>
                <span className="text-stone-300">Partnered with MyDharohar</span>
              </div>

              <h1 className="text-2xl sm:text-4xl font-bold font-serif-display tracking-tight text-stone-100 text-balance leading-snug">
                Quiet for most of the year. Useful exactly when it matters.
              </h1>

              <p className="text-sm sm:text-base text-stone-300 leading-relaxed max-w-2xl">
                Every occasion your family celebrates or remembers — ancestors' shraddhas, tithi birthdays, anniversaries, and family vrats — entered once, and reminded on WhatsApp to each person in their own language.
              </p>

              <div className="pt-2 text-xs text-amber-200/90 font-medium">
                No apps for elders to install · Computed for your home location · Zero fear-based astrology
              </div>
            </div>

            {/* Quick Actions */}
            <div className="pt-4 flex flex-wrap items-center gap-3">
              <button
                onClick={onOpenAddModal}
                className="px-5 py-2.5 text-xs font-semibold text-stone-950 bg-amber-400 hover:bg-amber-300 rounded-lg transition-colors whitespace-nowrap cursor-pointer shadow-sm"
              >
                + Add Family Occasion
              </button>
              <button
                onClick={() => onNavigateTab('whatsapp')}
                className="px-4 py-2.5 text-xs font-medium text-stone-200 hover:text-white bg-stone-800 hover:bg-stone-700 border border-stone-700 rounded-lg transition-colors whitespace-nowrap cursor-pointer"
              >
                Preview WhatsApp Messages
              </button>
              <button
                onClick={() => onNavigateTab('pricing')}
                className="px-4 py-2.5 text-xs font-medium text-stone-400 hover:text-stone-200 transition-colors whitespace-nowrap cursor-pointer"
              >
                View Pilot Plan (₹299)
              </button>
            </div>
          </div>

          {/* Hero Visual */}
          <div className="lg:col-span-5 relative min-h-[260px] lg:min-h-full bg-stone-950">
            <img
              src="/src/assets/images/kulloop_hero_family_1793303629503.jpg"
              alt="Three generations of family with traditional calendar and mobile reminder"
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover object-center"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-stone-950/80 via-transparent to-transparent pointer-events-none" />
            <div className="absolute bottom-4 left-4 right-4 text-xs text-stone-300 bg-stone-900/80 backdrop-blur-md px-3 py-2 rounded-lg border border-stone-700/60">
              <span className="font-semibold text-amber-300">The Joshi Family Record</span>: Pune sunrise convention · 4 active members · 3 languages
            </div>
          </div>
        </div>
      </div>

      {/* Countdown Timer for the Next Upcoming Ritual */}
      <NextRitualCountdown
        occasions={occasions}
        family={family}
        onPreviewWhatsApp={onPreviewWhatsApp}
        onGeneratePriestNote={onGeneratePriestNote}
        onTogglePerformed={onTogglePerformed}
      />

      {/* Trust & Family Profile Anchor Card */}
      <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-6 sm:p-7">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-stone-100">
          <div>
            <div className="flex items-center gap-2 text-xs text-stone-500 mb-1">
              <span>Family Lineage & Tradition Record</span>
              <span aria-hidden="true">·</span>
              <span className="text-emerald-700 font-medium">Validated Source Configured</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-stone-900 font-serif-display">
              {family.name}
            </h2>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="text-stone-500">Configurator:</span>
            <span className="font-semibold text-stone-800">{family.configuratorName}</span>
            <span className="text-stone-400">({family.configuratorPhone})</span>
          </div>
        </div>

        {/* 4 Metadata Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-6">
          <div className="p-4 rounded-lg bg-stone-50 border border-stone-200/70 space-y-1">
            <div className="flex items-center gap-2 text-xs font-medium text-stone-500">
              <MapPin className="w-3.5 h-3.5 text-amber-600" />
              <span>Home Location (Sunrise)</span>
            </div>
            <div className="text-sm font-semibold text-stone-800 pt-0.5">
              {family.homeLocation}
            </div>
            <div className="text-xs text-stone-500">
              Dates computed at local sunrise, never recipient timezone.
            </div>
          </div>

          <div className="p-4 rounded-lg bg-stone-50 border border-stone-200/70 space-y-1">
            <div className="flex items-center gap-2 text-xs font-medium text-stone-500">
              <Compass className="w-3.5 h-3.5 text-amber-600" />
              <span>Calendar Tradition</span>
            </div>
            <div className="text-sm font-semibold text-stone-800 pt-0.5">
              {family.convention} System
            </div>
            <div className="text-xs text-stone-500">
              Month ends on Amavasya (Maharashtra & Western India practice).
            </div>
          </div>

          <div className="p-4 rounded-lg bg-stone-50 border border-stone-200/70 space-y-1">
            <div className="flex items-center gap-2 text-xs font-medium text-stone-500">
              <BookOpen className="w-3.5 h-3.5 text-amber-600" />
              <span>Validation Source</span>
            </div>
            <div className="text-sm font-semibold text-stone-800 pt-0.5 truncate" title={family.validationSource}>
              Datar Panchang (Amanta)
            </div>
            <div className="text-xs text-stone-500">
              Reviewed with Pt. Shrikant Joshi. Pre-send verification active.
            </div>
          </div>

          <div className="p-4 rounded-lg bg-stone-50 border border-stone-200/70 space-y-1">
            <div className="flex items-center gap-2 text-xs font-medium text-stone-500">
              <Users className="w-3.5 h-3.5 text-amber-600" />
              <span>Loop Coverage</span>
            </div>
            <div className="text-sm font-semibold text-stone-800 pt-0.5">
              {members.length} Members across 2 Countries
            </div>
            <div className="text-xs text-stone-500">
              Languages: Marathi, Hindi, English.
            </div>
          </div>
        </div>

        {/* Tradition note quote */}
        {family.traditionNotes && (
          <div className="mt-5 p-3.5 rounded-lg bg-amber-50/70 border border-amber-200/60 text-xs text-amber-900 flex items-start gap-2.5">
            <ShieldCheck className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-amber-950">Family Custom Record: </span>
              {family.traditionNotes}
            </div>
          </div>
        )}
      </div>

      {/* Monthly Rituals Progress Tracker */}
      <MonthlyRitualTracker
        occasions={occasions}
        family={family}
        onTogglePerformed={onTogglePerformed}
        onPreviewWhatsApp={onPreviewWhatsApp}
        onGeneratePriestNote={onGeneratePriestNote}
        onAddMemoryPhoto={onAddMemoryPhoto}
        onDeleteMemoryPhoto={onDeleteMemoryPhoto}
      />

      {/* Visual Family Tree & Lineage Showcase Card */}
      <div className="bg-gradient-to-r from-stone-900 via-stone-850 to-stone-900 rounded-2xl p-6 sm:p-7 text-white border border-stone-800 shadow-md relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-full bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-semibold text-amber-300">
              <span className="flex items-center gap-1.5 uppercase tracking-wider">
                <GitBranch className="w-3.5 h-3.5 text-amber-400" />
                <span>Lineage & Generational Responsibilities (कुळवृक्ष)</span>
              </span>
              <span aria-hidden="true" className="text-stone-500">·</span>
              <span className="text-stone-300">Gotra: Kashyapa (काश्यप)</span>
            </div>
            <h3 className="text-xl sm:text-2xl font-bold font-serif-display text-stone-100">
              Visual Family Lineage & Ritual Duties
            </h3>
            <p className="text-xs sm:text-sm text-stone-300 max-w-2xl leading-relaxed">
              Explore 3 generations of the family tree. Select any member — from ancestors and elders to householder kartas and next-generation youth — to view and track their specific ritual responsibilities, sankalpas, and preparation checklists.
            </p>
          </div>
          <button
            onClick={() => onNavigateTab('tree')}
            className="self-start md:self-auto shrink-0 inline-flex items-center gap-2 px-5 py-2.5 text-xs font-semibold text-stone-950 bg-amber-400 hover:bg-amber-300 rounded-xl transition-colors cursor-pointer shadow-sm"
          >
            <span>Open Family Tree</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Upcoming Occasions Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-stone-900 font-serif-display">
              Upcoming Family Observances (2027)
            </h3>
            <p className="text-xs text-stone-500">
              Tithi dates accurately computed for Pune sunrise and validated against the regional almanac.
            </p>
          </div>
          <button
            onClick={() => onNavigateTab('occasions')}
            className="text-xs font-semibold text-amber-800 hover:text-amber-900 flex items-center gap-1 group"
          >
            <span>View All ({occasions.length})</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {upcomingOccasions.map((occ) => {
            const isShraddha = occ.occasionType === 'shraddha' || occ.occasionType === 'mahalaya';
            return (
              <div
                key={occ.id}
                className="bg-white rounded-xl border border-stone-200 p-5 shadow-sm hover:border-amber-300 transition-all flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2 text-xs">
                    <span className="font-medium text-stone-500 capitalize">
                      {occ.occasionType.replace('_', ' ')}
                    </span>
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                      <CheckCircle className="w-3 h-3" />
                      Checked
                    </span>
                  </div>

                  <div>
                    <h4 className="font-bold text-stone-900 text-base leading-snug">
                      {occ.title}
                    </h4>
                    {occ.tithiFields && (
                      <p className="text-xs text-stone-600 font-devanagari mt-1">
                        {occ.tithiFields.lunarMonthDevanagari || occ.tithiFields.lunarMonth} {occ.tithiFields.pakshaDevanagari || occ.tithiFields.paksha} {occ.tithiFields.tithiDevanagari || occ.tithiFields.tithi}
                      </p>
                    )}
                  </div>

                  <div className="p-3 bg-stone-50 rounded-lg text-xs space-y-1 border border-stone-100">
                    <div className="flex items-center justify-between text-stone-800 font-semibold">
                      <span>{occ.occurrence2027.formattedDisplay}</span>
                      <span className="text-stone-500 font-normal">({occ.occurrence2027.weekday})</span>
                    </div>
                    <div className="text-[11px] text-stone-500">
                      Sunrise: {occ.occurrence2027.sunriseTime}
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-stone-100 flex items-center justify-between gap-2">
                  <button
                    onClick={() => onPreviewWhatsApp(occ)}
                    className="text-xs font-semibold text-stone-700 hover:text-amber-800 inline-flex items-center gap-1"
                  >
                    <Smartphone className="w-3.5 h-3.5 text-stone-500" />
                    <span>WhatsApp View</span>
                  </button>

                  {isShraddha && (
                    <button
                      onClick={() => onGeneratePriestNote(occ)}
                      className="text-xs font-medium text-amber-700 hover:text-amber-900 inline-flex items-center gap-1"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>Priest Note</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Six Pillars of the Revised Vision (from PDF Page 3) */}
      <div className="bg-stone-50 rounded-2xl border border-stone-200/80 p-6 sm:p-8 space-y-6">
        <div>
          <h3 className="text-lg font-bold text-stone-900 font-serif-display">
            The Six Pillars of KulLoop
          </h3>
          <p className="text-xs text-stone-600 mt-1">
            How Family Tithi Loop turns a crowded calendar into a defensible family heritage service.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          <div className="p-4 bg-white rounded-xl border border-stone-200 space-y-2">
            <div className="text-xs font-bold text-amber-800">01. Not a Panchang App</div>
            <h4 className="text-sm font-semibold text-stone-900">The Family's Own Occasions</h4>
            <p className="text-xs text-stone-600 leading-relaxed">
              We never compete on generic daily panchang data. Only the occasions this family celebrates or remembers, with tithi dates computed correctly as the hero.
            </p>
          </div>

          <div className="p-4 bg-white rounded-xl border border-stone-200 space-y-2">
            <div className="text-xs font-bold text-amber-800">02. WhatsApp-First, App Optional</div>
            <h4 className="text-sm font-semibold text-stone-900">Elders Install Nothing</h4>
            <p className="text-xs text-stone-600 leading-relaxed">
              Reminders arrive where the family already lives. The configurator manages the record; elders and members abroad receive clear, respectful messages with zero login friction.
            </p>
          </div>

          <div className="p-4 bg-white rounded-xl border border-stone-200 space-y-2">
            <div className="text-xs font-bold text-amber-800">03. Standalone with Launch Partner</div>
            <h4 className="text-sm font-semibold text-stone-900">MyDharohar Partnership</h4>
            <p className="text-xs text-stone-600 leading-relaxed">
              Standalone brand, billing, and WhatsApp Business line. Licensed and reviewed festival & shraddha preparation content shared from launch partner MyDharohar.
            </p>
          </div>

          <div className="p-4 bg-white rounded-xl border border-stone-200 space-y-2">
            <div className="text-xs font-bold text-amber-800">04. Correctness as Trust</div>
            <h4 className="text-sm font-semibold text-stone-900">One Wrong Date Ends Trust</h4>
            <p className="text-xs text-stone-600 leading-relaxed">
              Tithi observance depends on local sunrise. Every date is checked against a named validation source with golden test sets, kshaya tithi, and adhik maas handling.
            </p>
          </div>

          <div className="p-4 bg-white rounded-xl border border-stone-200 space-y-2">
            <div className="text-xs font-bold text-amber-800">05. Family Pricing & Honest Upsells</div>
            <h4 className="text-sm font-semibold text-stone-900">₹599 / Year Per Family</h4>
            <p className="text-xs text-stone-600 leading-relaxed">
              About ₹50/month for the whole household. Free export anytime. No fear-based astrology, no dosha warnings, and no guilt messaging around death observances.
            </p>
          </div>

          <div className="p-4 bg-white rounded-xl border border-stone-200 space-y-2">
            <div className="text-xs font-bold text-amber-800">06. Validate Before Building</div>
            <h4 className="text-sm font-semibold text-stone-900">30 Families Concierge Pilot</h4>
            <p className="text-xs text-stone-600 leading-relaxed">
              Run in Marathi, Hindi, and English (Amanta primary) at ₹299 upfront founding price. Date-checked semi-manually before the engine is expanded.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
