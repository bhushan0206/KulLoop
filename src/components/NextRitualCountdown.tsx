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

interface NextRitualCountdownProps {
  occasions: FamilyOccasion[];
  family: Family;
  onPreviewWhatsApp: (occ: FamilyOccasion) => void;
  onGeneratePriestNote: (occ: FamilyOccasion) => void;
  onTogglePerformed: (id: string, notes?: string, performedBy?: string) => void;
}

export const NextRitualCountdown: React.FC<NextRitualCountdownProps> = ({
  occasions,
  family,
  onPreviewWhatsApp,
  onGeneratePriestNote,
  onTogglePerformed,
}) => {
  // Reference date: current local time (Oct 29, 2026, or system now)
  // Find the next upcoming unperformed ritual
  const upcomingRituals = occasions
    .filter((o) => !o.isPerformed)
    .sort((a, b) => {
      return (
        new Date(a.occurrence2027.gregorianDateStr).getTime() -
        new Date(b.occurrence2027.gregorianDateStr).getTime()
      );
    });

  // Pick the closest upcoming ritual (default to Diwali Lakshmi Puja or the first upcoming)
  const nextRitual = upcomingRituals[0] || occasions[0];

  // Calculate target timestamp
  // If date string has year 2026/2027, parse with standard evening / sunrise hour
  const getTargetTimestamp = (occ: FamilyOccasion): number => {
    const dateStr = occ.occurrence2027.gregorianDateStr; // e.g. "2026-10-31"
    
    // Check if it's Diwali / evening ritual or morning shraddha
    if (occ.occasionType === 'festival' || occ.title.toLowerCase().includes('lakshmi')) {
      return new Date(`${dateStr}T18:15:00`).getTime();
    } else if (occ.occasionType === 'shraddha') {
      return new Date(`${dateStr}T11:30:00`).getTime();
    } else {
      return new Date(`${dateStr}T09:00:00`).getTime();
    }
  };

  const [timeLeft, setTimeLeft] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
    isPast: boolean;
  }>({ days: 0, hours: 0, minutes: 0, seconds: 0, isPast: false });

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

  if (!nextRitual) return null;

  const isShraddha = nextRitual.occasionType === 'shraddha' || nextRitual.occasionType === 'mahalaya';

  const [synced, setSynced] = useState(false);

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
    <div className="bg-gradient-to-br from-stone-900 via-stone-900 to-stone-950 rounded-2xl border border-stone-800 shadow-md p-6 sm:p-7 text-white relative overflow-hidden">
      {/* Decorative subtle ambient backdrop */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        {/* Left: Next Ritual Metadata */}
        <div className="space-y-3 flex-1">
          <div className="flex items-center gap-2 text-xs font-semibold text-amber-300">
            <span className="flex items-center gap-1.5 uppercase tracking-wider">
              <Flame className="w-3.5 h-3.5 text-amber-400" />
              <span>Next Upcoming Sacred Observance</span>
            </span>
            <span aria-hidden="true" className="text-stone-500">·</span>
            <span className="text-stone-400 capitalize">
              {nextRitual.occasionType.replace('_', ' ')}
            </span>
          </div>

          <div>
            <h3 className="text-xl sm:text-2xl font-bold font-serif-display text-stone-100 leading-snug">
              {nextRitual.title}
            </h3>
            {nextRitual.tithiFields && (
              <p className="text-xs sm:text-sm text-stone-300 font-devanagari mt-1">
                {nextRitual.tithiFields.lunarMonthDevanagari || nextRitual.tithiFields.lunarMonth}{' '}
                {nextRitual.tithiFields.pakshaDevanagari || nextRitual.tithiFields.paksha}{' '}
                {nextRitual.tithiFields.tithiDevanagari || nextRitual.tithiFields.tithi}
                <span className="text-stone-500 font-sans mx-2">·</span>
                <span className="font-sans text-stone-400">{nextRitual.occurrence2027.tithiSpan}</span>
              </p>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3 text-xs text-stone-300 pt-1">
            <div className="flex items-center gap-1.5 bg-stone-800/80 px-2.5 py-1 rounded-lg border border-stone-700/80">
              <Calendar className="w-3.5 h-3.5 text-amber-400" />
              <span>{nextRitual.occurrence2027.formattedDisplay} ({nextRitual.occurrence2027.weekday})</span>
            </div>

            <div className="flex items-center gap-1.5 bg-stone-800/80 px-2.5 py-1 rounded-lg border border-stone-700/80">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              <span>Sunrise: {nextRitual.occurrence2027.sunriseTime}</span>
            </div>
          </div>
        </div>

        {/* Center: Live Countdown Cards */}
        <div className="shrink-0">
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Days */}
            <div className="flex flex-col items-center bg-stone-800/90 border border-stone-700/80 rounded-xl px-3 sm:px-4 py-2.5 min-w-[64px] sm:min-w-[76px] shadow-inner">
              <span className="text-2xl sm:text-3xl font-extrabold text-amber-300 font-mono tabular-nums">
                {String(timeLeft.days).padStart(2, '0')}
              </span>
              <span className="text-[10px] text-stone-400 uppercase tracking-widest font-semibold mt-0.5">
                Days
              </span>
            </div>

            <span className="text-xl sm:text-2xl font-bold text-stone-500 font-mono">:</span>

            {/* Hours */}
            <div className="flex flex-col items-center bg-stone-800/90 border border-stone-700/80 rounded-xl px-3 sm:px-4 py-2.5 min-w-[64px] sm:min-w-[76px] shadow-inner">
              <span className="text-2xl sm:text-3xl font-extrabold text-amber-300 font-mono tabular-nums">
                {String(timeLeft.hours).padStart(2, '0')}
              </span>
              <span className="text-[10px] text-stone-400 uppercase tracking-widest font-semibold mt-0.5">
                Hours
              </span>
            </div>

            <span className="text-xl sm:text-2xl font-bold text-stone-500 font-mono">:</span>

            {/* Minutes */}
            <div className="flex flex-col items-center bg-stone-800/90 border border-stone-700/80 rounded-xl px-3 sm:px-4 py-2.5 min-w-[64px] sm:min-w-[76px] shadow-inner">
              <span className="text-2xl sm:text-3xl font-extrabold text-amber-300 font-mono tabular-nums">
                {String(timeLeft.minutes).padStart(2, '0')}
              </span>
              <span className="text-[10px] text-stone-400 uppercase tracking-widest font-semibold mt-0.5">
                Minutes
              </span>
            </div>

            <span className="text-xl sm:text-2xl font-bold text-stone-500 font-mono hidden sm:inline">:</span>

            {/* Seconds (hidden on very small screens, visible on sm+) */}
            <div className="hidden sm:flex flex-col items-center bg-stone-800/90 border border-stone-700/80 rounded-xl px-3 sm:px-4 py-2.5 min-w-[64px] sm:min-w-[76px] shadow-inner">
              <span className="text-2xl sm:text-3xl font-extrabold text-amber-200 font-mono tabular-nums">
                {String(timeLeft.seconds).padStart(2, '0')}
              </span>
              <span className="text-[10px] text-stone-400 uppercase tracking-widest font-semibold mt-0.5">
                Seconds
              </span>
            </div>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex flex-row lg:flex-col items-stretch gap-2 shrink-0">
          <button
            onClick={() => onPreviewWhatsApp(nextRitual)}
            className="flex-1 lg:flex-none inline-flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-stone-950 bg-amber-400 hover:bg-amber-300 rounded-xl transition-colors cursor-pointer shadow-sm whitespace-nowrap"
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>WhatsApp Reminder</span>
          </button>

          <button
            onClick={handleSyncToCalendar}
            className="flex-1 lg:flex-none inline-flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs font-medium text-stone-200 hover:text-white bg-stone-800 hover:bg-stone-700 border border-stone-700 rounded-xl transition-colors cursor-pointer whitespace-nowrap"
            title="Export this ritual to Apple / Google Calendar (.ics)"
          >
            <CalendarCheck className={`w-3.5 h-3.5 ${synced ? 'text-emerald-400' : 'text-amber-400'}`} />
            <span>{synced ? 'Downloaded .ics!' : 'Sync to Calendar'}</span>
          </button>

          {isShraddha ? (
            <button
              onClick={() => onGeneratePriestNote(nextRitual)}
              className="flex-1 lg:flex-none inline-flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs font-medium text-stone-200 hover:text-white bg-stone-800 hover:bg-stone-700 border border-stone-700 rounded-xl transition-colors cursor-pointer whitespace-nowrap"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Priest Note</span>
            </button>
          ) : (
            <button
              onClick={() => onTogglePerformed(nextRitual.id)}
              className="flex-1 lg:flex-none inline-flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs font-medium text-stone-200 hover:text-white bg-stone-800 hover:bg-stone-700 border border-stone-700 rounded-xl transition-colors cursor-pointer whitespace-nowrap"
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Mark as Done</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
