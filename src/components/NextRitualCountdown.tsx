import React, { useState, useEffect } from 'react';
import { FamilyOccasion, Family } from '../types';
import { exportFamilyRecordToICS, downloadFile } from '../utils/tithiCalculator';
import { 
  Clock, 
  Flame, 
  CheckCircle2, 
  Smartphone, 
  Sparkles, 
  FileText, 
  ArrowRight,
  Calendar,
  CalendarCheck
} from 'lucide-react';
import { OccasionCardActionMenu } from './OccasionCardActionMenu';
import { SlideOverTab } from './OccasionSlideOver';
import { MyDharoharPrepNudge } from './MyDharoharPrepNudge';

interface NextRitualCountdownProps {
  occasions: FamilyOccasion[];
  family: Family;
  onOpenAddModal?: () => void;
  onOpenRemindersModal?: (occ?: FamilyOccasion) => void;
  onPreviewWhatsApp: (occ: FamilyOccasion) => void;
  onGeneratePriestNote: (occ: FamilyOccasion) => void;
  onTogglePerformed: (id: string, notes?: string, performedBy?: string) => void;
  onOpenSlideOver?: (occ: FamilyOccasion, tab: SlideOverTab) => void;
}

export const NextRitualCountdown: React.FC<NextRitualCountdownProps> = ({
  occasions,
  family,
  onOpenAddModal,
  onOpenRemindersModal,
  onPreviewWhatsApp,
  onGeneratePriestNote,
  onTogglePerformed,
  onOpenSlideOver,
}) => {
  // Helper to compute precise target timestamp for countdown
  const getTargetTimestamp = (occ: FamilyOccasion): number => {
    const dateStr = occ.occurrence2027.gregorianDateStr;
    if (occ.occasionType === 'festival' || occ.title.toLowerCase().includes('lakshmi')) {
      return new Date(`${dateStr}T18:15:00`).getTime();
    } else if (occ.occasionType === 'shraddha' || occ.occasionType === 'mahalaya') {
      return new Date(`${dateStr}T11:30:00`).getTime();
    } else {
      return new Date(`${dateStr}T09:00:00`).getTime();
    }
  };

  // Find unperformed rituals whose target time has NOT yet passed
  const nowMs = Date.now();
  const futureRituals = occasions
    .filter((o) => !o.isPerformed && getTargetTimestamp(o) > nowMs)
    .sort((a, b) => getTargetTimestamp(a) - getTargetTimestamp(b));

  // Pick the closest upcoming future ritual. If all scheduled dates have elapsed, fallback to the next in the sequence.
  const nextRitual = futureRituals[0] || occasions.filter((o) => !o.isPerformed)[0] || occasions[0];

  const [timeLeft, setTimeLeft] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
    isPast: boolean;
  }>({ days: 0, hours: 0, minutes: 0, seconds: 0, isPast: false });

  const [synced, setSynced] = useState(false);

  useEffect(() => {
    if (!nextRitual) return;

    const targetTime = getTargetTimestamp(nextRitual);

    const updateCountdown = () => {
      // Use current runtime date
      const now = new Date().getTime();
      const diff = targetTime - now;

      if (diff <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0, isPast: true });
      } else {
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
        const minutes = Math.floor((diff / (1000 * 60)) % 60);
        const seconds = Math.floor((diff / 1000) % 60);

        setTimeLeft({ days, hours, minutes, seconds, isPast: false });
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [nextRitual]);

  if (!nextRitual) {
    return (
      <div className="bg-gradient-to-br from-stone-900 via-stone-900 to-stone-950 rounded-xl border border-stone-800 shadow-sm p-5 text-white relative overflow-hidden h-full flex flex-col justify-between">
        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 space-y-3">
          <div className="flex items-center gap-1.5 text-[10px] font-semibold text-amber-300 uppercase tracking-wider">
            <Flame className="w-3.5 h-3.5 text-amber-400" />
            <span>Sacred Observances</span>
          </div>
          <h4 className="text-base font-bold text-stone-100 font-serif-display">
            No upcoming observances recorded yet
          </h4>
          <p className="text-xs text-stone-300 leading-relaxed">
            Add your family's annual shraddha tithis, birthdays, or festivals. KulLoop will compute the exact sunrise timing and count down here.
          </p>
        </div>
        <div className="relative z-10 pt-4 border-t border-stone-800">
          {onOpenAddModal ? (
            <button
              onClick={onOpenAddModal}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-400 hover:bg-amber-300 text-stone-950 font-semibold rounded-lg text-xs transition-colors cursor-pointer shadow-sm"
            >
              <span>+ Add Occasion</span>
            </button>
          ) : (
            <span className="text-[11px] text-amber-300 font-medium">+ Add Occasion</span>
          )}
        </div>
      </div>
    );
  }

  const isShraddha = nextRitual.occasionType === 'shraddha' || nextRitual.occasionType === 'mahalaya';

  const handleSyncToCalendar = () => {
    try {
      const icsData = exportFamilyRecordToICS([nextRitual], family);
      const safeTitle = nextRitual.title.replace(/[^a-zA-Z0-9]/g, '_');
      downloadFile(`${safeTitle}_kuloop.ics`, icsData, 'text/calendar;charset=utf-8;');
      setSynced(true);
      setTimeout(() => setSynced(false), 3000);
    } catch (err) {
      console.error('Failed to sync next ritual to calendar', err);
    }
  };

  return (
    <div className="bg-gradient-to-br from-stone-900 via-stone-900 to-stone-950 rounded-xl border border-stone-800 shadow-sm p-4 sm:p-5 text-white relative overflow-hidden h-full flex flex-col justify-between">
      {/* Decorative subtle ambient backdrop */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col justify-between h-full gap-3">
        {/* Top: Next Ritual Metadata */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-[10px] font-semibold text-amber-300">
              <span className="flex items-center gap-1.5 uppercase tracking-wider">
                <Flame className="w-3 h-3 text-amber-400" />
                <span>Next Upcoming Sacred Observance</span>
              </span>
              <span aria-hidden="true" className="text-stone-500">·</span>
              <span className="text-stone-400 capitalize">
                {nextRitual.occasionType.replace('_', ' ')}
              </span>
            </div>

            {onOpenSlideOver && (
              <OccasionCardActionMenu
                occasion={nextRitual}
                onOpenSlideOver={onOpenSlideOver}
                onPreviewWhatsApp={onPreviewWhatsApp}
                onOpenRemindersModal={onOpenRemindersModal}
                onGeneratePriestNote={onGeneratePriestNote}
                compact={false}
              />
            )}
          </div>

          <div>
            <h3 className="text-base sm:text-lg font-bold font-serif-display text-stone-100 leading-snug">
              {nextRitual.title}
            </h3>
            {nextRitual.tithiFields && (
              <p className="text-[11px] sm:text-xs text-stone-300 font-devanagari mt-0.5">
                {nextRitual.tithiFields.lunarMonthDevanagari || nextRitual.tithiFields.lunarMonth}{' '}
                {nextRitual.tithiFields.pakshaDevanagari || nextRitual.tithiFields.paksha}{' '}
                {nextRitual.tithiFields.tithiDevanagari || nextRitual.tithiFields.tithi}
                <span className="text-stone-500 font-sans mx-1.5">·</span>
                <span className="font-sans text-stone-400">{nextRitual.occurrence2027.tithiSpan}</span>
              </p>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2 text-[10px] text-stone-300 pt-0.5">
            <div className="flex items-center gap-1 bg-stone-800/80 px-2 py-0.5 rounded-md border border-stone-700/80">
              <Calendar className="w-3 h-3 text-amber-400" />
              <span>{nextRitual.occurrence2027.formattedDisplay} ({nextRitual.occurrence2027.weekday})</span>
            </div>

            <div className="flex items-center gap-1 bg-stone-800/80 px-2 py-0.5 rounded-md border border-stone-700/80">
              <Clock className="w-3 h-3 text-amber-400" />
              <span>Sunrise: {nextRitual.occurrence2027.sunriseTime}</span>
            </div>
          </div>
        </div>

        {/* Center: Live Countdown Cards or Observance Day Banner */}
        <div className="py-1">
          {timeLeft.isPast ? (
            <div className="flex items-center gap-2 p-2.5 bg-amber-500/20 border border-amber-500/40 rounded-lg text-amber-200 text-xs font-medium">
              <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
              <span>Observance concluded or scheduled for today. Ready for sankalpa.</span>
            </div>
          ) : (
            <div className="flex items-center justify-between sm:justify-start gap-1.5 sm:gap-2">
              {/* Days */}
              <div className="flex flex-col items-center bg-stone-800/90 border border-stone-700/80 rounded-lg px-2.5 py-1.5 min-w-[52px] shadow-inner flex-1 sm:flex-none">
                <span className="text-xl sm:text-2xl font-bold text-amber-300 font-mono tabular-nums">
                  {String(timeLeft.days).padStart(2, '0')}
                </span>
                <span className="text-[9px] text-stone-400 uppercase tracking-widest font-semibold">
                  Days
                </span>
              </div>

              <span className="text-base sm:text-lg font-bold text-stone-500 font-mono">:</span>

              {/* Hours */}
              <div className="flex flex-col items-center bg-stone-800/90 border border-stone-700/80 rounded-lg px-2.5 py-1.5 min-w-[52px] shadow-inner flex-1 sm:flex-none">
                <span className="text-xl sm:text-2xl font-bold text-amber-300 font-mono tabular-nums">
                  {String(timeLeft.hours).padStart(2, '0')}
                </span>
                <span className="text-[9px] text-stone-400 uppercase tracking-widest font-semibold">
                  Hours
                </span>
              </div>

              <span className="text-base sm:text-lg font-bold text-stone-500 font-mono">:</span>

              {/* Minutes */}
              <div className="flex flex-col items-center bg-stone-800/90 border border-stone-700/80 rounded-lg px-2.5 py-1.5 min-w-[52px] shadow-inner flex-1 sm:flex-none">
                <span className="text-xl sm:text-2xl font-bold text-amber-300 font-mono tabular-nums">
                  {String(timeLeft.minutes).padStart(2, '0')}
                </span>
                <span className="text-[9px] text-stone-400 uppercase tracking-widest font-semibold">
                  Minutes
                </span>
              </div>

              <span className="text-base sm:text-lg font-bold text-stone-500 font-mono hidden xs:inline">:</span>

              {/* Seconds */}
              <div className="hidden xs:flex flex-col items-center bg-stone-800/90 border border-stone-700/80 rounded-lg px-2.5 py-1.5 min-w-[52px] shadow-inner flex-1 sm:flex-none">
                <span className="text-xl sm:text-2xl font-bold text-amber-200 font-mono tabular-nums">
                  {String(timeLeft.seconds).padStart(2, '0')}
                </span>
                <span className="text-[9px] text-stone-400 uppercase tracking-widest font-semibold">
                  Sec
                </span>
              </div>
            </div>
          )}
        </div>

        {nextRitual.myDharoharGuideUrl && (
          <MyDharoharPrepNudge
            variant="on-dark"
            guideUrl={nextRitual.myDharoharGuideUrl}
            occasionTitle={nextRitual.title}
          />
        )}

        {/* Bottom: Actions in a clean flex row */}
        <div className="flex items-center gap-1.5 pt-2 border-t border-stone-800/80">
          <button
            onClick={() => onOpenRemindersModal ? onOpenRemindersModal(nextRitual) : onPreviewWhatsApp(nextRitual)}
            className="flex-1 inline-flex items-center justify-center gap-1 px-2.5 py-1.5 text-[11px] font-semibold text-stone-950 bg-amber-400 hover:bg-amber-300 rounded-lg transition-colors cursor-pointer shadow-sm whitespace-nowrap"
            title="Options 1-4: WhatsApp P2P, Calendar Sync, Email Digest, Push"
          >
            <Smartphone className="w-3 h-3" />
            <span>Reminders</span>
          </button>

          <button
            onClick={handleSyncToCalendar}
            className="flex-1 inline-flex items-center justify-center gap-1 px-2.5 py-1.5 text-[11px] font-medium text-stone-200 hover:text-white bg-stone-800 hover:bg-stone-700 border border-stone-700 rounded-lg transition-colors cursor-pointer whitespace-nowrap"
            title="Export this ritual to Apple / Google Calendar (.ics)"
          >
            <CalendarCheck className={`w-3 h-3 ${synced ? 'text-emerald-400' : 'text-amber-400'}`} />
            <span>{synced ? 'Synced' : 'Calendar'}</span>
          </button>

          {isShraddha ? (
            <button
              onClick={() => onGeneratePriestNote(nextRitual)}
              className="flex-1 inline-flex items-center justify-center gap-1 px-2.5 py-1.5 text-[11px] font-medium text-stone-200 hover:text-white bg-stone-800 hover:bg-stone-700 border border-stone-700 rounded-lg transition-colors cursor-pointer whitespace-nowrap"
            >
              <FileText className="w-3 h-3" />
              <span>Priest Note</span>
            </button>
          ) : (
            <button
              onClick={() => onTogglePerformed(nextRitual.id)}
              className="flex-1 inline-flex items-center justify-center gap-1 px-2.5 py-1.5 text-[11px] font-medium text-stone-200 hover:text-white bg-stone-800 hover:bg-stone-700 border border-stone-700 rounded-lg transition-colors cursor-pointer whitespace-nowrap"
            >
              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
              <span>Done</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
