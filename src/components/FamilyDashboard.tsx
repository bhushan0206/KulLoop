import React, { useState, useMemo } from 'react';
import { Family, FamilyOccasion, Member } from '../types';
import { exportFamilyRecordToICS, downloadFile } from '../utils/tithiCalculator';
import { 
  Compass, 
  MapPin, 
  BookOpen, 
  CheckCircle, 
  CheckCircle2,
  ArrowRight, 
  Smartphone, 
  FileText, 
  Users, 
  GitBranch,
  History,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  Calendar,
  CalendarCheck,
  Download,
  Check,
  Share2,
  Edit3,
  Camera,
  SlidersHorizontal
} from 'lucide-react';

import { MonthlyRitualTracker } from './MonthlyRitualTracker';
import { NextRitualCountdown } from './NextRitualCountdown';
import { HeritageMilestoneTracker } from './HeritageMilestoneTracker';
import { OccasionSlideOver, SlideOverTab } from './OccasionSlideOver';
import { OccasionCardActionMenu } from './OccasionCardActionMenu';

interface FamilyDashboardProps {
  family: Family;
  occasions: FamilyOccasion[];
  members: Member[];
  onSelectOccasion: (occ: FamilyOccasion) => void;
  onPreviewWhatsApp: (occ: FamilyOccasion) => void;
  onGeneratePriestNote: (occ: FamilyOccasion) => void;
  onNavigateTab: (tab: 'occasions' | 'whatsapp' | 'members' | 'calendar' | 'pricing' | 'tree') => void;
  onOpenAddModal: () => void;
  onOpenShareModal: () => void;
  onTogglePerformed: (id: string, notes?: string, performedBy?: string) => void;
  onUpdateOccasion: (id: string, updates: Partial<FamilyOccasion>) => void;
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
  onOpenShareModal,
  onTogglePerformed,
  onUpdateOccasion,
  onAddMemoryPhoto,
  onDeleteMemoryPhoto,
}) => {
  const [dashboardFilter, setDashboardFilter] = useState<'all' | 'shraddha' | 'birthday_anniversary'>('all');
  const [activeTrackerTab, setActiveTrackerTab] = useState<'monthly' | 'milestones'>('monthly');
  const [showPillars, setShowPillars] = useState(false);
  const [downloadNotice, setDownloadNotice] = useState<string | null>(null);

  // Quick Action Slide-Over state
  const [slideOverOccasionId, setSlideOverOccasionId] = useState<string | null>(null);
  const [slideOverTab, setSlideOverTab] = useState<SlideOverTab>('edit');
  const [isSlideOverOpen, setIsSlideOverOpen] = useState(false);

  const activeSlideOverOccasion = useMemo(() => {
    return occasions.find((o) => o.id === slideOverOccasionId) || null;
  }, [occasions, slideOverOccasionId]);

  const handleOpenSlideOver = (occ: FamilyOccasion, tab: SlideOverTab = 'edit') => {
    setSlideOverOccasionId(occ.id);
    setSlideOverTab(tab);
    setIsSlideOverOpen(true);
  };

  const handleExportAllICS = () => {
    const icsContent = exportFamilyRecordToICS(occasions, family);
    const fileName = `${family.name.replace(/[^a-zA-Z0-9]/g, '_')}_tithi_calendar.ics`;
    downloadFile(fileName, icsContent, 'text/calendar;charset=utf-8;');
    setDownloadNotice(`Calendar (.ics) exported! Ready to import into Google or Apple Calendar.`);
    setTimeout(() => setDownloadNotice(null), 3500);
  };
  
  // Calculate monthly stats
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const monthOccasions = occasions.filter(occ => {
      const date = new Date(occ.occurrence2027.gregorianDateStr);
      return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
  });

  const confirmedCount = monthOccasions.filter((o) => o.isConfirmed).length;
  const totalCount = monthOccasions.length;
  const progress = totalCount > 0 ? (confirmedCount / totalCount) * 100 : 0;

  // Filter upcoming occasions for dashboard display
  const upcomingOccasions = useMemo(() => {
    return occasions
      .filter(occ => {
        if (dashboardFilter === 'all') return true;
        if (dashboardFilter === 'shraddha') return occ.occasionType === 'shraddha' || occ.occasionType === 'mahalaya';
        if (dashboardFilter === 'birthday_anniversary') return occ.occasionType === 'birthday' || occ.occasionType === 'anniversary';
        return true;
      })
      .slice(0, 3);
  }, [occasions, dashboardFilter]);

  return (
    <div className="space-y-6 pb-16">
      {/* GRID ROW 1: Hero Card + Next Ritual Countdown (Side-by-Side Grid) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        {/* Left: Compact Hero & Service Narrative (lg:col-span-7) */}
        <div className="lg:col-span-7 bg-stone-900 rounded-xl overflow-hidden border border-stone-800 shadow-sm text-white p-5 sm:p-6 flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 text-[10px] font-medium text-amber-300">
                <span className="uppercase tracking-wider">Independent Family Ritual Service</span>
                <span aria-hidden="true" className="text-stone-600">·</span>
                <span className="text-stone-300">Partnered with MyDharohar</span>
              </div>

              {/* Monthly Rate Pill */}
              <div className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/10 text-[10px] text-amber-200 border border-white/10 shrink-0">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span>{confirmedCount}/{totalCount} confirmed ({Math.round(progress)}%)</span>
              </div>
            </div>

            <h1 className="text-xl sm:text-2xl font-bold font-serif-display tracking-tight text-stone-100 text-balance leading-snug">
              Quiet for most of the year. Useful exactly when it matters.
            </h1>

            <p className="text-xs sm:text-sm text-stone-300 leading-relaxed">
              Every occasion your family celebrates or remembers — entered once, and reminded on WhatsApp to each person in their own language.
            </p>

            <div className="text-[10px] text-amber-200/90 font-medium">
              No apps for elders to install · Computed for your home location · Zero fear-based astrology
            </div>
          </div>

          {/* Quick Actions Bar */}
          <div className="pt-2 flex flex-wrap items-center gap-2 border-t border-stone-800/80">
            <button
              onClick={onOpenAddModal}
              className="px-3 py-1.5 text-[11px] font-semibold text-stone-950 bg-amber-400 hover:bg-amber-300 rounded-lg transition-colors cursor-pointer shadow-sm"
            >
              + Add Occasion
            </button>
            <button
              onClick={() => onNavigateTab('whatsapp')}
              className="px-3 py-1.5 text-[11px] font-medium text-stone-200 hover:text-white bg-stone-800 hover:bg-stone-700 border border-stone-700 rounded-lg transition-colors cursor-pointer"
            >
              Preview WhatsApp
            </button>
            <button
              onClick={handleExportAllICS}
              className="px-3 py-1.5 text-[11px] font-medium text-amber-300 hover:text-amber-100 bg-stone-800 hover:bg-stone-700 border border-stone-700 rounded-lg transition-colors cursor-pointer inline-flex items-center gap-1.5"
              title="Export all family occasions to .ics file for Google or Apple Calendar"
            >
              <Calendar className="w-3.5 h-3.5 text-amber-400" />
              <span>Export .ics</span>
            </button>
            <button
              onClick={onOpenShareModal}
              className="px-3 py-1.5 text-[11px] font-semibold text-emerald-950 bg-emerald-400 hover:bg-emerald-300 rounded-lg transition-colors cursor-pointer inline-flex items-center gap-1.5 shadow-sm"
              title="Share this family calendar on WhatsApp or Mobile"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Share on WhatsApp</span>
            </button>
            <button
              onClick={() => onNavigateTab('pricing')}
              className="px-3 py-1.5 text-[11px] font-medium text-stone-400 hover:text-stone-200 transition-colors cursor-pointer"
            >
              View Pilot Plan (₹299)
            </button>
          </div>
        </div>

        {/* Right: Next Ritual Countdown Widget (lg:col-span-5) */}
        <div className="lg:col-span-5">
          <NextRitualCountdown
            occasions={occasions}
            family={family}
            onOpenAddModal={onOpenAddModal}
            onPreviewWhatsApp={onPreviewWhatsApp}
            onGeneratePriestNote={onGeneratePriestNote}
            onTogglePerformed={onTogglePerformed}
            onOpenSlideOver={handleOpenSlideOver}
          />
        </div>
      </div>

      {/* GRID ROW 2: Family Lineage Specs & Visual Family Tree (Side-by-Side Grid) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        {/* Left: Family Lineage & Tradition Record (lg:col-span-8) */}
        <div className="lg:col-span-8 bg-white rounded-xl border border-stone-200 shadow-sm p-5 sm:p-6 flex flex-col justify-between space-y-4">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-stone-100">
              <div>
                <div className="flex items-center gap-2 text-[10px] text-stone-500 mb-0.5">
                  <span>Family Lineage & Tradition Record</span>
                  <span aria-hidden="true">·</span>
                  <span className="text-emerald-700 font-medium">Validated Source Configured</span>
                </div>
                <h2 className="text-lg sm:text-xl font-bold text-stone-900 font-serif-display">
                  {family.name}
                </h2>
              </div>

              <div className="flex items-center gap-1.5 text-xs">
                <span className="text-stone-500 text-[11px]">Configurator:</span>
                <span className="font-semibold text-stone-800 text-[11px]">{family.configuratorName}</span>
                <span className="text-stone-400 text-[10px]">({family.configuratorPhone})</span>
              </div>
            </div>

            {/* 4 Metadata Cards in a 4-col mini-grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-3">
              <div className="p-3 rounded-lg bg-stone-50 border border-stone-200/70 space-y-0.5">
                <div className="flex items-center gap-1.5 text-[10px] font-medium text-stone-500">
                  <MapPin className="w-3 h-3 text-amber-600" />
                  <span>Home Location</span>
                </div>
                <div className="text-xs font-semibold text-stone-800 truncate" title={family.homeLocation}>
                  {family.homeLocation}
                </div>
                <div className="text-[10px] text-stone-500">Local sunrise maths</div>
              </div>

              <div className="p-3 rounded-lg bg-stone-50 border border-stone-200/70 space-y-0.5">
                <div className="flex items-center gap-1.5 text-[10px] font-medium text-stone-500">
                  <Compass className="w-3 h-3 text-amber-600" />
                  <span>Calendar Tradition</span>
                </div>
                <div className="text-xs font-semibold text-stone-800">
                  {family.convention} System
                </div>
                <div className="text-[10px] text-stone-500">Amavasya month end</div>
              </div>

              <div className="p-3 rounded-lg bg-stone-50 border border-stone-200/70 space-y-0.5">
                <div className="flex items-center gap-1.5 text-[10px] font-medium text-stone-500">
                  <BookOpen className="w-3 h-3 text-amber-600" />
                  <span>Validation Source</span>
                </div>
                <div className="text-xs font-semibold text-stone-800 truncate" title={family.validationSource}>
                  Datar Panchang
                </div>
                <div className="text-[10px] text-stone-500">Pre-send verification</div>
              </div>

              <div className="p-3 rounded-lg bg-stone-50 border border-stone-200/70 space-y-0.5">
                <div className="flex items-center gap-1.5 text-[10px] font-medium text-stone-500">
                  <Users className="w-3 h-3 text-amber-600" />
                  <span>Loop Coverage</span>
                </div>
                <div className="text-xs font-semibold text-stone-800">
                  {members.length} Members
                </div>
                <div className="text-[10px] text-stone-500">Marathi, Hindi, English</div>
              </div>
            </div>
          </div>

          {/* Tradition note quote */}
          {family.traditionNotes && (
            <div className="p-2.5 rounded-lg bg-amber-50/70 border border-amber-200/60 text-[11px] text-amber-900 flex items-start gap-2">
              <ShieldCheck className="w-3.5 h-3.5 text-amber-700 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-amber-950">Family Custom Record: </span>
                {family.traditionNotes}
              </div>
            </div>
          )}
        </div>

        {/* Right: Visual Family Tree & Lineage Showcase Card (lg:col-span-4) */}
        <div className="lg:col-span-4 bg-gradient-to-br from-stone-900 via-stone-850 to-stone-900 rounded-xl p-5 text-white border border-stone-800 shadow-sm relative overflow-hidden flex flex-col justify-between">
          <div className="absolute top-0 right-0 w-48 h-full bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />
          <div className="relative z-10 space-y-2">
            <div className="flex items-center gap-1.5 text-[10px] font-semibold text-amber-300">
              <GitBranch className="w-3 h-3 text-amber-400" />
              <span className="uppercase tracking-wider">Lineage Duties (कुळवृक्ष)</span>
              <span aria-hidden="true" className="text-stone-500">·</span>
              <span className="text-stone-300">Gotra: Kashyapa</span>
            </div>

            <h3 className="text-base sm:text-lg font-bold font-serif-display text-stone-100">
              Visual Family Lineage & Ritual Duties
            </h3>

            <p className="text-[11px] text-stone-300 leading-relaxed">
              Explore 3 generations of the family tree with specific kartas, sankalpas, and preparation duties.
            </p>
          </div>

          <div className="relative z-10 pt-3 border-t border-stone-800/80 flex items-center justify-between">
            <span className="text-[10px] text-stone-400">3 Generations active</span>
            <button
              onClick={() => onNavigateTab('tree')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-semibold text-stone-950 bg-amber-400 hover:bg-amber-300 rounded-lg transition-colors cursor-pointer shadow-sm"
            >
              <span>Open Tree</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* GRID ROW 3: Upcoming Occasions Section (3-Column Grid) */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-base sm:text-lg font-bold text-stone-900 font-serif-display">
              Upcoming Family Observances (2027)
            </h3>
            <p className="text-[11px] text-stone-500">
              Tithi dates accurately computed for Pune sunrise and validated against the regional almanac.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* Filter Bar */}
            <div className="flex items-center gap-1 p-0.5 bg-white border border-stone-200 rounded-lg shadow-2xs">
              {(['all', 'shraddha', 'birthday_anniversary'] as const).map(filter => (
                <button
                  key={filter}
                  onClick={() => setDashboardFilter(filter)}
                  className={`px-2.5 py-1 text-[11px] font-medium rounded-md capitalize transition-colors cursor-pointer ${
                    dashboardFilter === filter 
                      ? 'bg-amber-400 text-stone-900 shadow-2xs font-semibold' 
                      : 'text-stone-600 hover:bg-stone-100'
                  }`}
                >
                  {filter.replace('_', ' & ')}
                </button>
              ))}
            </div>

            <button
              onClick={() => onNavigateTab('occasions')}
              className="text-[11px] font-semibold text-amber-800 hover:text-amber-900 flex items-center gap-0.5 group shrink-0 pl-1"
            >
              <span>View All ({occasions.length})</span>
              <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>
        </div>

        {upcomingOccasions.length === 0 ? (
          <div className="bg-white rounded-xl border border-stone-200 p-8 text-center space-y-3">
            <div className="w-12 h-12 bg-amber-50 text-amber-700 rounded-full flex items-center justify-center mx-auto">
              <Calendar className="w-6 h-6 text-amber-600" />
            </div>
            <h4 className="text-base font-bold text-stone-900 font-serif-display">
              No occasions recorded yet for {family.name}
            </h4>
            <p className="text-xs text-stone-500 max-w-md mx-auto">
              Record your family's annual Shraddha tithis, birthdays, or festivals. Each date is accurately matched to your local sunrise and notified on WhatsApp.
            </p>
            <button
              onClick={onOpenAddModal}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-stone-900 bg-amber-400 hover:bg-amber-300 rounded-lg transition-colors cursor-pointer shadow-sm mt-2"
            >
              <span>+ Record First Occasion</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {upcomingOccasions.map((occ) => {
              const isShraddha = occ.occasionType === 'shraddha' || occ.occasionType === 'mahalaya';
              const estYear = occ.establishedYear || occ.gregorianFields?.originalYear;
              const yearsSinceEstablished = estYear ? 2027 - estYear : null;
              return (
                <div
                  key={occ.id}
                  className="bg-white rounded-xl border border-stone-200 p-4 shadow-2xs hover:border-amber-300 transition-all flex flex-col justify-between space-y-3"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2 text-xs">
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-stone-500 capitalize text-[10px]">
                          {occ.occasionType.replace('_', ' ')}
                        </span>
                        {occ.isPerformed ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200/80 px-1.5 py-0.5 rounded">
                            <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" />
                            Performed
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                            <CheckCircle className="w-2.5 h-2.5" />
                            Checked
                          </span>
                        )}
                      </div>

                      {/* Floating Action Menu for this card */}
                      <OccasionCardActionMenu
                        occasion={occ}
                        onOpenSlideOver={handleOpenSlideOver}
                        onPreviewWhatsApp={onPreviewWhatsApp}
                        onGeneratePriestNote={onGeneratePriestNote}
                        compact={false}
                      />
                    </div>

                    <div>
                      <h4 className="font-bold text-stone-900 text-sm leading-snug">
                        {occ.title}
                      </h4>
                      {occ.tithiFields && (
                        <p className="text-[11px] text-stone-600 font-devanagari mt-0.5">
                          {occ.tithiFields.lunarMonthDevanagari || occ.tithiFields.lunarMonth} {occ.tithiFields.pakshaDevanagari || occ.tithiFields.paksha} {occ.tithiFields.tithiDevanagari || occ.tithiFields.tithi}
                        </p>
                      )}
                    </div>

                    {/* Heritage Milestone Badge on Card */}
                    {estYear && yearsSinceEstablished && (
                      <div className="flex items-center gap-1 text-[10px] font-medium text-amber-900 bg-amber-50 border border-amber-200/80 px-2 py-0.5 rounded-md">
                        <History className="w-3 h-3 text-amber-700 shrink-0" />
                        <span className="tabular-nums font-semibold">
                          {yearsSinceEstablished}th Year of Tradition
                        </span>
                        <span className="text-stone-400 font-normal">·</span>
                        <span className="text-stone-500 font-normal">Est. {estYear}</span>
                      </div>
                    )}

                    <div className="p-2.5 bg-stone-50 rounded-lg text-xs space-y-0.5 border border-stone-100">
                      <div className="flex items-center justify-between text-stone-800 font-semibold text-[11px]">
                        <span>{occ.occurrence2027.formattedDisplay}</span>
                        <span className="text-stone-500 font-normal">({occ.occurrence2027.weekday})</span>
                      </div>
                      <div className="text-[10px] text-stone-500">
                        Sunrise: {occ.occurrence2027.sunriseTime}
                      </div>
                    </div>
                  </div>

                  {/* Card Quick Action Bar: Edit, Mark Performed, Add Photo, WhatsApp */}
                  <div className="pt-2 border-t border-stone-100 flex flex-wrap items-center justify-between gap-1.5 text-xs">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleOpenSlideOver(occ, 'edit')}
                        className="text-[11px] font-medium text-stone-600 hover:text-amber-800 inline-flex items-center gap-1 cursor-pointer transition-colors"
                        title="Edit occasion title, date & tradition"
                      >
                        <Edit3 className="w-3 h-3 text-stone-400" />
                        <span>Edit</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleOpenSlideOver(occ, 'performed')}
                        className={`text-[11px] font-medium inline-flex items-center gap-1 cursor-pointer transition-colors ${
                          occ.isPerformed ? 'text-emerald-700 font-semibold' : 'text-stone-600 hover:text-emerald-700'
                        }`}
                        title="Record ritual completion & performer"
                      >
                        <CheckCircle2 className={`w-3 h-3 ${occ.isPerformed ? 'text-emerald-600' : 'text-stone-400'}`} />
                        <span>{occ.isPerformed ? 'Done' : 'Mark'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleOpenSlideOver(occ, 'photos')}
                        className="text-[11px] font-medium text-stone-600 hover:text-amber-800 inline-flex items-center gap-1 cursor-pointer transition-colors"
                        title="Add or view memory photos"
                      >
                        <Camera className="w-3 h-3 text-stone-400" />
                        <span>Photo {occ.memoryPhotos?.length ? `(${occ.memoryPhotos.length})` : ''}</span>
                      </button>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => onPreviewWhatsApp(occ)}
                        className="text-[11px] font-semibold text-stone-700 hover:text-amber-800 inline-flex items-center gap-1 cursor-pointer"
                      >
                        <Smartphone className="w-3 h-3 text-stone-500" />
                        <span>WhatsApp</span>
                      </button>

                      {isShraddha && (
                        <button
                          type="button"
                          onClick={() => onGeneratePriestNote(occ)}
                          className="text-[11px] font-medium text-amber-700 hover:text-amber-900 inline-flex items-center gap-1 cursor-pointer"
                        >
                          <FileText className="w-3 h-3" />
                          <span>Priest</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* GRID ROW 4: Deep Tracking Suite (Tabbed View Switcher) */}
      <div className="space-y-4 pt-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-200 pb-3">
          <div>
            <h3 className="text-base sm:text-lg font-bold text-stone-900 font-serif-display">
              Family Observance & Longevity Records
            </h3>
            <p className="text-[11px] text-stone-500">
              Switch between monthly ritual performance & photos, and unbroken multi-generational family milestones.
            </p>
          </div>

          {/* Segmented Switcher for Trackers */}
          <div className="flex items-center gap-1 p-1 bg-stone-200/70 rounded-xl border border-stone-300/80 self-start sm:self-auto shrink-0">
            <button
              onClick={() => setActiveTrackerTab('monthly')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTrackerTab === 'monthly'
                  ? 'bg-white text-stone-900 shadow-2xs font-bold'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Monthly Ritual Tracker</span>
              <span className="text-[10px] px-1.5 py-0.2 bg-amber-100 text-amber-800 rounded-full font-mono">
                {confirmedCount}/{totalCount}
              </span>
            </button>
            <button
              onClick={() => setActiveTrackerTab('milestones')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTrackerTab === 'milestones'
                  ? 'bg-white text-stone-900 shadow-2xs font-bold'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <History className="w-3.5 h-3.5 text-amber-600" />
              <span>Heritage Milestones & Continuity</span>
            </button>
          </div>
        </div>

        {/* Render Selected Tracker */}
        {activeTrackerTab === 'monthly' ? (
          <MonthlyRitualTracker
            occasions={occasions}
            family={family}
            onTogglePerformed={onTogglePerformed}
            onPreviewWhatsApp={onPreviewWhatsApp}
            onGeneratePriestNote={onGeneratePriestNote}
            onAddMemoryPhoto={onAddMemoryPhoto}
            onDeleteMemoryPhoto={onDeleteMemoryPhoto}
            onOpenSlideOver={handleOpenSlideOver}
          />
        ) : (
          <HeritageMilestoneTracker
            occasions={occasions}
            family={family}
            onSelectOccasion={onSelectOccasion}
            onPreviewWhatsApp={onPreviewWhatsApp}
          />
        )}
      </div>

      {/* GRID ROW 5: The Six Pillars of KulLoop (Collapsible to save screen space) */}
      <div className="bg-stone-50 rounded-xl border border-stone-200/80 overflow-hidden shadow-2xs">
        <button
          onClick={() => setShowPillars(!showPillars)}
          className="w-full p-4 flex items-center justify-between text-left hover:bg-stone-100/70 transition-colors cursor-pointer"
        >
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-stone-900 font-serif-display">
                The Six Pillars of KulLoop
              </h3>
              <span className="text-[10px] font-semibold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full">
                Core Philosophy
              </span>
            </div>
            <p className="text-[11px] text-stone-500 mt-0.5">
              Not a panchang app · WhatsApp-first · Real Sunrise Maths · Defensible family heritage service
            </p>
          </div>

          <div className="flex items-center gap-1 text-xs font-semibold text-stone-600 shrink-0">
            <span>{showPillars ? 'Collapse' : 'View Pillars'}</span>
            {showPillars ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </div>
        </button>

        {showPillars && (
          <div className="p-5 pt-0 border-t border-stone-200/80 mt-1">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 pt-4">
              <div className="p-3.5 bg-white rounded-lg border border-stone-200 space-y-1">
                <div className="text-[10px] font-bold text-amber-800">01. Not a Panchang App</div>
                <h4 className="text-xs font-semibold text-stone-900">The Family's Own Occasions</h4>
                <p className="text-[11px] text-stone-600 leading-relaxed">
                  We never compete on generic daily panchang data. Only the occasions this family celebrates or remembers, with tithi dates computed correctly as the hero.
                </p>
              </div>

              <div className="p-3.5 bg-white rounded-lg border border-stone-200 space-y-1">
                <div className="text-[10px] font-bold text-amber-800">02. WhatsApp-First, App Optional</div>
                <h4 className="text-xs font-semibold text-stone-900">Elders Install Nothing</h4>
                <p className="text-[11px] text-stone-600 leading-relaxed">
                  Reminders arrive where the family already lives. The configurator manages the record; elders and members abroad receive clear, respectful messages with zero login friction.
                </p>
              </div>

              <div className="p-3.5 bg-white rounded-lg border border-stone-200 space-y-1">
                <div className="text-[10px] font-bold text-amber-800">03. Standalone with Launch Partner</div>
                <h4 className="text-xs font-semibold text-stone-900">MyDharohar Partnership</h4>
                <p className="text-[11px] text-stone-600 leading-relaxed">
                  Standalone brand, billing, and WhatsApp Business line. Licensed and reviewed festival & shraddha preparation content shared from launch partner MyDharohar.
                </p>
              </div>

              <div className="p-3.5 bg-white rounded-lg border border-stone-200 space-y-1">
                <div className="text-[10px] font-bold text-amber-800">04. Correctness as Trust</div>
                <h4 className="text-xs font-semibold text-stone-900">One Wrong Date Ends Trust</h4>
                <p className="text-[11px] text-stone-600 leading-relaxed">
                  Tithi observance depends on local sunrise. Every date is checked against a named validation source with golden test sets, kshaya tithi, and adhik maas handling.
                </p>
              </div>

              <div className="p-3.5 bg-white rounded-lg border border-stone-200 space-y-1">
                <div className="text-[10px] font-bold text-amber-800">05. Family Pricing & Honest Upsells</div>
                <h4 className="text-xs font-semibold text-stone-900">₹599 / Year Per Family</h4>
                <p className="text-[11px] text-stone-600 leading-relaxed">
                  About ₹50/month for the whole household. Free export anytime. No fear-based astrology, no dosha warnings, and no guilt messaging around death observances.
                </p>
              </div>

              <div className="p-3.5 bg-white rounded-lg border border-stone-200 space-y-1">
                <div className="text-[10px] font-bold text-amber-800">06. Validate Before Building</div>
                <h4 className="text-xs font-semibold text-stone-900">30 Families Concierge Pilot</h4>
                <p className="text-[11px] text-stone-600 leading-relaxed">
                  Run in Marathi, Hindi, and English (Amanta primary) at ₹299 upfront founding price. Date-checked semi-manually before the engine is expanded.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Occasion Quick Action Slide-Over */}
      <OccasionSlideOver
        isOpen={isSlideOverOpen}
        onClose={() => setIsSlideOverOpen(false)}
        occasion={activeSlideOverOccasion}
        family={family}
        initialTab={slideOverTab}
        onUpdateOccasion={onUpdateOccasion}
        onTogglePerformed={onTogglePerformed}
        onAddMemoryPhoto={onAddMemoryPhoto}
        onDeleteMemoryPhoto={onDeleteMemoryPhoto}
        onPreviewWhatsApp={onPreviewWhatsApp}
        onGeneratePriestNote={onGeneratePriestNote}
      />

      {/* ICS Download Notice */}
      {downloadNotice && (
        <div className="fixed bottom-6 right-6 z-50 bg-stone-900 text-amber-300 text-xs px-4 py-2.5 rounded-xl shadow-xl border border-stone-800 flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{downloadNotice}</span>
        </div>
      )}
    </div>
  );
};

