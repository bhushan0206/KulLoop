import React, { useState, useMemo, useEffect } from 'react';
import { FamilyOccasion, Family } from '../types';
import { 
  Award, 
  Calendar, 
  Clock, 
  History, 
  Sparkles, 
  CheckCircle2, 
  ChevronRight, 
  ScrollText, 
  Share2, 
  Compass,
  Flame,
  ShieldCheck
} from 'lucide-react';

interface HeritageMilestoneTrackerProps {
  occasions: FamilyOccasion[];
  family: Family;
  onSelectOccasion?: (occ: FamilyOccasion) => void;
  onPreviewWhatsApp?: (occ: FamilyOccasion) => void;
  onOpenRemindersModal?: (occ?: FamilyOccasion) => void;
}

export const HeritageMilestoneTracker: React.FC<HeritageMilestoneTrackerProps> = ({
  occasions,
  family,
  onSelectOccasion,
  onPreviewWhatsApp,
  onOpenRemindersModal,
}) => {
  // Current calendar reference years
  const currentCalendarYear = 2026;
  const nextObservanceYear = 2027;

  // Filter occasions that have establishedYear or originalYear
  const occasionsWithMilestone = useMemo(() => {
    return occasions
      .map((occ) => {
        const estYear = occ.establishedYear || occ.gregorianFields?.originalYear;
        if (!estYear) return null;
        const completedYears = Math.max(0, currentCalendarYear - estYear);
        const observanceYearNumber = Math.max(1, nextObservanceYear - estYear);
        return {
          ...occ,
          effectiveEstYear: estYear,
          completedYears,
          observanceYearNumber,
        };
      })
      .filter((item): item is NonNullable<typeof item> => item !== null)
      .sort((a, b) => a.effectiveEstYear - b.effectiveEstYear); // Oldest first
  }, [occasions, currentCalendarYear, nextObservanceYear]);

  // Selected occasion for focal milestone inspector
  const [selectedOccasionId, setSelectedOccasionId] = useState<string>('');

  useEffect(() => {
    if (selectedOccasionId) return;
    const firstId = occasionsWithMilestone[0]?.id;
    if (firstId) setSelectedOccasionId(firstId);
  }, [occasionsWithMilestone, selectedOccasionId]);

  const selectedMilestone = useMemo(() => {
    return (
      occasionsWithMilestone.find((o) => o.id === selectedOccasionId) ||
      occasionsWithMilestone[0]
    );
  }, [occasionsWithMilestone, selectedOccasionId]);

  // Aggregated family heritage statistics
  const heritageStats = useMemo(() => {
    const totalHeritageYears = occasionsWithMilestone.reduce(
      (acc, curr) => acc + curr.completedYears,
      0
    );
    const oldest = occasionsWithMilestone[0];
    const majorJubileesCount = occasionsWithMilestone.filter(
      (o) => o.completedYears >= 25
    ).length;

    return {
      totalHeritageYears,
      oldestEstablishedYear: oldest?.effectiveEstYear,
      oldestTitle: oldest?.title,
      oldestYears: oldest?.completedYears,
      trackedOccasionsCount: occasionsWithMilestone.length,
      majorJubileesCount,
    };
  }, [occasionsWithMilestone]);

  // Milestone tier description
  const getMilestoneTier = (years: number) => {
    if (years >= 50) return { label: 'Golden Heritage (सुवर्ण परंपरा)', badgeColor: 'bg-amber-100 text-amber-900 border-amber-300', icon: '🏆' };
    if (years >= 40) return { label: 'Ruby Milestone (माणिक्य पर्व)', badgeColor: 'bg-rose-100 text-rose-900 border-rose-300', icon: '✨' };
    if (years >= 25) return { label: 'Silver Jubilee (रौप्य परंपरा)', badgeColor: 'bg-slate-200 text-slate-800 border-slate-300', icon: '🥈' };
    if (years >= 10) return { label: 'Decade Continuity (दशक परंपरा)', badgeColor: 'bg-stone-200 text-stone-800 border-stone-300', icon: '🌿' };
    return { label: 'Sankalpa Continuity', badgeColor: 'bg-amber-50 text-amber-900 border-amber-200', icon: '🪔' };
  };

  // State for copy feedback
  const [copiedNote, setCopiedNote] = useState(false);

  const handleCopySummary = () => {
    if (!selectedMilestone) return;
    const summaryText = `*${family.name} - Heritage Milestone*\n` +
      `📌 Ritual: ${selectedMilestone.title}\n` +
      `⏳ Established / First Recorded: ${selectedMilestone.effectiveEstYear}\n` +
      `🎖 Completed Years of Observance: ${selectedMilestone.completedYears} years\n` +
      `📅 2027 Observance: ${selectedMilestone.observanceYearNumber}th Year of Tradition\n` +
      `📖 Notes: ${selectedMilestone.heritageNotes || selectedMilestone.practiceNotes}\n` +
      `Computed via KulLoop with ${family.validationSource}.`;
    
    navigator.clipboard.writeText(summaryText);
    setCopiedNote(true);
    setTimeout(() => setCopiedNote(false), 2500);
  };

  if (!selectedMilestone) {
    return null;
  }

  const tier = getMilestoneTier(selectedMilestone.completedYears);

  return (
    <div className="bg-stone-900 rounded-2xl border border-stone-800 shadow-xl overflow-hidden text-stone-100">
      {/* Header bar */}
      <div className="px-6 py-5 border-b border-stone-800/90 bg-stone-950/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-medium text-amber-400">
            <History className="w-4 h-4 text-amber-400" />
            <span className="uppercase tracking-wider">Heritage Milestones & Lineage Continuity</span>
            <span aria-hidden="true" className="text-stone-600">·</span>
            <span className="text-stone-400">कुळपरंपरा मैलाचा दगड</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold font-serif-display text-white mt-1">
            Family Ritual Longevity & Heritage Statistics
          </h2>
          <p className="text-xs text-stone-400 mt-0.5">
            Preserving and honoring unbroken years since each sacred sankalpa, ancestral passing, or family tradition was first established.
          </p>
        </div>

        {/* Global heritage KPI badge */}
        <div className="inline-flex items-center gap-3 px-4 py-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 self-start sm:self-auto shrink-0">
          <Award className="w-5 h-5 text-amber-400 shrink-0" />
          <div className="text-left">
            <div className="text-[10px] uppercase font-semibold text-amber-400/80 tracking-wider">
              Cumulative Lineage Span
            </div>
            <div className="text-lg font-bold tabular-nums text-white flex items-baseline gap-1.5 font-serif-display">
              <span>{heritageStats.totalHeritageYears}</span>
              <span className="text-xs font-sans text-amber-200/90 font-normal">Years Observed Across Traditions</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Focus Area: Selected Ritual Milestone Breakdown */}
      <div className="p-6 sm:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Focal Ritual Milestone Showcase */}
        <div className="lg:col-span-7 space-y-6">
          {/* Quick Occasion Switcher Bar */}
          <div>
            <label className="block text-xs font-semibold uppercase text-stone-400 mb-2">
              Select Ritual or Anniversary to Inspect Heritage Milestone:
            </label>
            <div className="flex flex-wrap gap-2">
              {occasionsWithMilestone.map((occ) => {
                const isSelected = occ.id === selectedMilestone.id;
                return (
                  <button
                    key={occ.id}
                    onClick={() => setSelectedOccasionId(occ.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all text-left flex items-center gap-2 cursor-pointer border ${
                      isSelected
                        ? 'bg-amber-400 text-stone-950 border-amber-300 font-semibold shadow-md'
                        : 'bg-stone-800/90 text-stone-300 border-stone-700/80 hover:bg-stone-750 hover:text-white hover:border-stone-600'
                    }`}
                  >
                    <span className="truncate max-w-[170px]">{occ.title}</span>
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded tabular-nums ${
                        isSelected
                          ? 'bg-stone-950/20 text-stone-950 font-bold'
                          : 'bg-stone-700/70 text-amber-300'
                      }`}
                    >
                      {occ.completedYears}y
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Focal Card: The Highlighted Milestone */}
          <div className="bg-gradient-to-br from-stone-800/90 via-stone-850 to-stone-900 rounded-xl border border-stone-700/80 p-6 shadow-inner relative overflow-hidden">
            {/* Subtle watermark badge */}
            <div className="absolute top-2 right-3 text-7xl font-serif-display font-black text-amber-400/5 select-none pointer-events-none">
              {selectedMilestone.effectiveEstYear}
            </div>

            <div className="relative z-10 space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-700/60 pb-4">
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2.5 py-1 rounded-md font-semibold border ${tier.badgeColor}`}>
                    {tier.icon} {tier.label}
                  </span>
                  <span className="text-xs text-stone-400 capitalize">
                    {selectedMilestone.occasionType.replace('_', ' ')}
                  </span>
                </div>

                <div className="text-xs text-stone-400 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-amber-400" />
                  <span>First Recorded: <strong className="text-stone-200">{selectedMilestone.effectiveEstYear}</strong></span>
                </div>
              </div>

              {/* Title & Headline */}
              <div>
                <h3 className="text-xl sm:text-2xl font-bold font-serif-display text-white leading-tight">
                  {selectedMilestone.title}
                </h3>
                {selectedMilestone.personNameDisplay && (
                  <p className="text-xs text-amber-200/90 mt-1">
                    Dedicated to: <span className="font-semibold">{selectedMilestone.personNameDisplay}</span>
                    {selectedMilestone.relationshipDisplay && ` (${selectedMilestone.relationshipDisplay})`}
                  </p>
                )}
              </div>

              {/* Giant Metric Display */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-2">
                {/* Metric 1: Total Completed Years */}
                <div className="bg-stone-900/90 rounded-lg p-4 border border-stone-700/70">
                  <div className="text-[11px] uppercase tracking-wider font-semibold text-stone-400">
                    Total Completed Years
                  </div>
                  <div className="mt-1 flex items-baseline gap-2">
                    <span className="text-4xl sm:text-5xl font-black font-serif-display text-amber-400 tabular-nums">
                      {selectedMilestone.completedYears}
                    </span>
                    <span className="text-sm font-medium text-stone-300">
                      Years of Tradition
                    </span>
                  </div>
                  <div className="text-xs text-stone-400 mt-1 font-devanagari">
                    {selectedMilestone.completedYears} वर्षे अखंड परंपरा
                  </div>
                </div>

                {/* Metric 2: Upcoming Observance Milestone */}
                <div className="bg-stone-900/90 rounded-lg p-4 border border-stone-700/70">
                  <div className="text-[11px] uppercase tracking-wider font-semibold text-stone-400">
                    2027 Heritage Observance
                  </div>
                  <div className="mt-1 flex items-baseline gap-2">
                    <span className="text-4xl sm:text-5xl font-black font-serif-display text-emerald-400 tabular-nums">
                      {selectedMilestone.observanceYearNumber}
                      <span className="text-2xl font-normal align-top">th</span>
                    </span>
                    <span className="text-sm font-medium text-stone-300">
                      Annual Observance
                    </span>
                  </div>
                  <div className="text-xs text-stone-400 mt-1 font-devanagari">
                    {selectedMilestone.observanceYearNumber} वे वार्षिक स्मरण (२०२७)
                  </div>
                </div>
              </div>

              {/* Heritage Story & Ancestral Origin */}
              <div className="bg-stone-900/60 rounded-lg p-4 border border-stone-800 text-xs space-y-2">
                <div className="flex items-center gap-2 font-semibold text-amber-300">
                  <ScrollText className="w-3.5 h-3.5" />
                  <span>Heritage Background & Lineage Record</span>
                </div>
                <p className="text-stone-300 leading-relaxed">
                  {selectedMilestone.heritageNotes || selectedMilestone.practiceNotes}
                </p>
                <div className="pt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-stone-400">
                  <span>
                    Validation: <strong className="text-stone-300">{selectedMilestone.confirmedSource}</strong>
                  </span>
                  <span>
                    Next Computed Date: <strong className="text-stone-200">{selectedMilestone.occurrence2027.formattedDisplay}</strong>
                  </span>
                </div>
              </div>

              {/* Chronological Continuity Timeline */}
              <div className="space-y-2 pt-2">
                <div className="text-[11px] uppercase font-semibold text-stone-400 flex items-center justify-between">
                  <span>Chronological Continuity Timeline</span>
                  <span className="text-amber-400 font-normal">
                    {selectedMilestone.effectiveEstYear} ➔ {nextObservanceYear}
                  </span>
                </div>

                <div className="relative pt-3 pb-1">
                  {/* Timeline bar */}
                  <div className="h-2 w-full bg-stone-750 rounded-full overflow-hidden flex">
                    <div className="h-full bg-gradient-to-r from-amber-600 via-amber-400 to-emerald-400 rounded-full w-full" />
                  </div>

                  {/* Waypoint Markers */}
                  <div className="flex justify-between items-center text-[10px] text-stone-400 mt-2">
                    <div className="text-left">
                      <span className="font-semibold text-stone-200 block">{selectedMilestone.effectiveEstYear}</span>
                      <span>Sankalpa / Established</span>
                    </div>

                    {selectedMilestone.completedYears >= 25 && (
                      <div className="text-center hidden sm:block">
                        <span className="font-semibold text-amber-300 block">{selectedMilestone.effectiveEstYear + 25}</span>
                        <span>Silver (25y)</span>
                      </div>
                    )}

                    {selectedMilestone.completedYears >= 50 && (
                      <div className="text-center hidden sm:block">
                        <span className="font-semibold text-amber-400 block">{selectedMilestone.effectiveEstYear + 50}</span>
                        <span>Golden (50y)</span>
                      </div>
                    )}

                    <div className="text-right">
                      <span className="font-semibold text-emerald-300 block">{nextObservanceYear}</span>
                      <span>{selectedMilestone.observanceYearNumber}th Observance</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-stone-700/60">
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCopySummary}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-stone-750 hover:bg-stone-700 text-xs font-medium text-stone-200 border border-stone-600 transition-colors cursor-pointer"
                  >
                    <Share2 className="w-3.5 h-3.5 text-stone-400" />
                    <span>{copiedNote ? 'Copied Heritage Summary!' : 'Copy Heritage Summary'}</span>
                  </button>

                  {onOpenRemindersModal ? (
                    <button
                      onClick={() => onOpenRemindersModal(selectedMilestone)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-950/70 hover:bg-emerald-900/80 text-xs font-medium text-emerald-300 border border-emerald-800 transition-colors cursor-pointer"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Zero-Fee Reminders (Cal/WA)</span>
                    </button>
                  ) : onPreviewWhatsApp ? (
                    <button
                      onClick={() => onPreviewWhatsApp(selectedMilestone)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-950/70 hover:bg-emerald-900/80 text-xs font-medium text-emerald-300 border border-emerald-800 transition-colors cursor-pointer"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Preview WhatsApp Card</span>
                    </button>
                  ) : null}
                </div>

                {onSelectOccasion && (
                  <button
                    onClick={() => onSelectOccasion(selectedMilestone)}
                    className="text-xs text-amber-400 hover:text-amber-300 font-semibold inline-flex items-center gap-1 cursor-pointer"
                  >
                    <span>View Ritual Details</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Family Heritage Overview Cards & Roster */}
        <div className="lg:col-span-5 space-y-5">
          {/* 3 Family Heritage Stat Mini-Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-3">
            {/* Longest Standing Tradition */}
            <div className="p-4 rounded-xl bg-stone-800/80 border border-stone-700/70 flex items-start gap-3.5">
              <div className="p-2.5 rounded-lg bg-amber-500/10 text-amber-400 shrink-0 border border-amber-500/20">
                <Flame className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className="text-[11px] uppercase tracking-wider font-semibold text-stone-400">
                  Longest Running Observance
                </div>
                <div className="text-sm font-bold text-white truncate mt-0.5" title={heritageStats.oldestTitle}>
                  {heritageStats.oldestTitle}
                </div>
                <div className="text-xs text-amber-300 mt-0.5">
                  <span className="font-bold tabular-nums">{heritageStats.oldestYears} Years</span> continuous (Est. {heritageStats.oldestEstablishedYear})
                </div>
              </div>
            </div>

            {/* Major Jubilees & Milestones */}
            <div className="p-4 rounded-xl bg-stone-800/80 border border-stone-700/70 flex items-start gap-3.5">
              <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-400 shrink-0 border border-emerald-500/20">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className="text-[11px] uppercase tracking-wider font-semibold text-stone-400">
                  Silver & Golden Jubilees
                </div>
                <div className="text-sm font-bold text-white mt-0.5">
                  <span className="text-emerald-400 tabular-nums">{heritageStats.majorJubileesCount}</span> Traditions Surpassed 25+ Years
                </div>
                <div className="text-xs text-stone-400 mt-0.5">
                  Passed down across 3 generations unbroken
                </div>
              </div>
            </div>
          </div>

          {/* All Tracked Milestones Compact List */}
          <div className="rounded-xl bg-stone-800/60 border border-stone-700/70 p-4 space-y-3">
            <div className="flex items-center justify-between text-xs pb-2 border-b border-stone-700/60">
              <span className="font-semibold text-stone-300 uppercase tracking-wider text-[11px]">
                All Family Heritage Milestones ({occasionsWithMilestone.length})
              </span>
              <span className="text-stone-400 text-[10px]">
                Click to inspect
              </span>
            </div>

            <div className="space-y-2 max-h-[310px] overflow-y-auto pr-1">
              {occasionsWithMilestone.map((occ) => {
                const isSelected = occ.id === selectedMilestone.id;
                const itemTier = getMilestoneTier(occ.completedYears);

                return (
                  <div
                    key={occ.id}
                    onClick={() => setSelectedOccasionId(occ.id)}
                    className={`p-3 rounded-lg border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                      isSelected
                        ? 'bg-amber-500/15 border-amber-400/60 text-white shadow-sm'
                        : 'bg-stone-900/60 border-stone-800 hover:bg-stone-800/80 hover:border-stone-700 text-stone-300'
                    }`}
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-semibold text-stone-100 truncate">
                          {occ.title}
                        </span>
                      </div>
                      <div className="text-[11px] text-stone-400 flex items-center gap-2 mt-0.5">
                        <span>Est. {occ.effectiveEstYear}</span>
                        <span aria-hidden="true">·</span>
                        <span className="capitalize">{occ.occasionType.replace('_', ' ')}</span>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="text-sm font-bold tabular-nums text-amber-400 font-serif-display">
                        {occ.completedYears} yrs
                      </div>
                      <div className="text-[10px] text-emerald-400 font-medium tabular-nums">
                        {occ.observanceYearNumber}th in 2027
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Cultural Assurance Note */}
          <div className="p-3.5 rounded-lg bg-amber-950/30 border border-amber-800/40 text-xs text-amber-200/90 leading-relaxed flex items-start gap-2.5">
            <Compass className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-amber-300">Generational Continuity: </span>
              In Vedic tradition, maintaining ancestors’ shraddhas and family vrats year after year creates uninterrupted spiritual merit (पुण्य) and bridges generations living abroad.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
