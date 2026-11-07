import React, { useState } from 'react';
import { FamilyOccasion, Family } from '../types';
import { 
  exportFamilyRecordToCSV, 
  exportFamilyRecordToICS, 
  downloadFile 
} from '../utils/tithiCalculator';
import { 
  Calendar as CalendarIcon, 
  Download, 
  Printer, 
  FileSpreadsheet, 
  ShieldCheck, 
  CheckCircle,
  ExternalLink,
  CalendarCheck,
  Check,
  HelpCircle,
  X,
  Smartphone
} from 'lucide-react';

interface AnnualCalendarViewProps {
  occasions: FamilyOccasion[];
  family: Family;
  onOpenAddModal?: () => void;
  onOpenRemindersModal?: (occ?: FamilyOccasion) => void;
  onPreviewWhatsApp: (occ: FamilyOccasion) => void;
  onGeneratePriestNote: (occ: FamilyOccasion) => void;
}

export const AnnualCalendarView: React.FC<AnnualCalendarViewProps> = ({
  occasions,
  family,
  onOpenAddModal,
  onOpenRemindersModal,
  onPreviewWhatsApp,
  onGeneratePriestNote,
}) => {
  const [downloadToast, setDownloadToast] = useState<string | null>(null);
  const [showSyncGuide, setShowSyncGuide] = useState(false);

  // Sort occasions chronologically
  const sortedOccasions = [...occasions].sort((a, b) => {
    return new Date(a.occurrence2027.gregorianDateStr).getTime() - new Date(b.occurrence2027.gregorianDateStr).getTime();
  });

  const showFeedback = (msg: string) => {
    setDownloadToast(msg);
    setTimeout(() => setDownloadToast(null), 3000);
  };

  const handleDownloadCSV = () => {
    const csvContent = exportFamilyRecordToCSV(occasions, family);
    downloadFile(
      `${family.name.replace(/[^a-zA-Z0-9]/g, '_')}_tithi_record.csv`,
      csvContent,
      'text/csv;charset=utf-8;'
    );
    showFeedback('CSV Spreadsheet downloaded');
  };

  const handleDownloadICS = () => {
    const icsContent = exportFamilyRecordToICS(occasions, family);
    downloadFile(
      `${family.name.replace(/[^a-zA-Z0-9]/g, '_')}_tithi_calendar.ics`,
      icsContent,
      'text/calendar;charset=utf-8;'
    );
    showFeedback('iCalendar (.ics) file exported! Ready to sync with Google & Apple Calendar.');
  };

  const handleExportSingleOccasionICS = (occ: FamilyOccasion) => {
    const icsContent = exportFamilyRecordToICS([occ], family);
    downloadFile(
      `${occ.title.replace(/[^a-zA-Z0-9]/g, '_')}.ics`,
      icsContent,
      'text/calendar;charset=utf-8;'
    );
    showFeedback(`Exported "${occ.title}" to .ics`);
  };

  const handlePrint = () => {
    window.print();
  };

  const currentYear = 2027;

  return (
    <div className="space-y-8">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 no-print">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-stone-900 font-serif-display">
            Annual Family Calendar (वार्षिक कुटुंब दिनदर्शिका)
          </h2>
          <p className="text-xs text-stone-500 mt-1">
            Complete cycle of shraddhas, birthdays, vrats, and festivals for {family.name}.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 self-start sm:self-auto">
          {/* ICS Export Button */}
          <button
            onClick={handleDownloadICS}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-amber-950 bg-amber-400 hover:bg-amber-300 rounded-lg transition-colors shadow-2xs cursor-pointer"
            title="Export to iCalendar (.ics) format for Google Calendar, Apple iCal, and Outlook"
          >
            <CalendarCheck className="w-3.5 h-3.5" />
            <span>Export to Google / Apple Calendar (.ics)</span>
          </button>

          {/* Sync Guide Modal Trigger */}
          <button
            onClick={() => setShowSyncGuide(true)}
            className="p-2 text-stone-500 hover:text-stone-800 bg-white hover:bg-stone-50 border border-stone-200 rounded-lg transition-colors cursor-pointer"
            title="How to sync with Google or Apple Calendar"
          >
            <HelpCircle className="w-3.5 h-3.5" />
          </button>

          {/* CSV Download */}
          <button
            onClick={handleDownloadCSV}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-stone-700 bg-white hover:bg-stone-50 border border-stone-200 rounded-lg transition-colors shadow-2xs cursor-pointer"
            title="Download CSV spreadsheet — your family record is never held hostage"
          >
            <Download className="w-3.5 h-3.5 text-stone-500" />
            <span>CSV</span>
          </button>

          {/* Print Puja Room Almanac */}
          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-amber-900 bg-amber-100 hover:bg-amber-200 border border-amber-300 rounded-lg transition-colors shadow-2xs cursor-pointer"
            title="Print a beautiful 1-page physical almanac for your altar or elders"
          >
            <Printer className="w-3.5 h-3.5 text-amber-700" />
            <span>Print Puja Room Calendar</span>
          </button>
        </div>
      </div>

      {/* Toast feedback */}
      {downloadToast && (
        <div className="p-3 bg-amber-50 border border-amber-300 rounded-xl text-xs text-amber-950 flex items-center gap-2 no-print shadow-xs animate-fade-in">
          <Check className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{downloadToast}</span>
        </div>
      )}

      {/* Almanac banner visual */}
      <div className="relative rounded-2xl overflow-hidden bg-stone-900 border border-stone-800 p-6 sm:p-8 text-white no-print">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
          <div className="md:col-span-8 space-y-3">
            <div className="text-xs font-semibold uppercase tracking-wider text-amber-300">
              The Family Heritage Record
            </div>
            <h3 className="text-xl sm:text-2xl font-bold font-serif-display">
              Preserved, private, and seamlessly syncable.
            </h3>
            <p className="text-xs text-stone-300 leading-relaxed max-w-xl">
              "The record of ancestors, occasions and milestones is preserved, private and exportable — something families fear losing when an elder is gone. Sync directly with Google or Apple Calendar with built-in 7-day and 2-day lead reminders."
            </p>
            <div className="flex flex-wrap items-center gap-3 pt-1 text-[11px] text-stone-400">
              <span>Validation standard: {family.validationSource}</span>
              <span aria-hidden="true">·</span>
              <span className="text-amber-300 font-medium">Automatic 7-day & 2-day alarms embedded</span>
            </div>
          </div>
          <div className="md:col-span-4 hidden md:block">
            <img
              src="/assets/images/kulloop_almanac_art_1793303629720.jpg"
              alt="Traditional wooden almanac and diya lamp"
              referrerPolicy="no-referrer"
              className="rounded-xl object-cover h-32 w-full border border-stone-700"
            />
          </div>
        </div>
      </div>

      {/* Printable Almanac Table */}
      <div className="printable-area bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
        {/* Dedicated Print Only Banner Header for Altar / Puja Room */}
        <div className="hidden print:block p-6 border-b-2 border-stone-900 bg-amber-50/50 text-stone-900">
          <div className="flex items-center justify-between pb-3 border-b border-amber-300">
            <div>
              <span className="text-xl font-bold font-serif-display tracking-tight text-amber-900">KulLoop · {family.name}</span>
              <p className="text-xs font-devanagari text-amber-800 mt-0.5">वार्षिक कुटुंब दिनदर्शिका व तिथी स्मरणिका २०२७</p>
            </div>
            <div className="text-right text-xs">
              <span className="font-semibold block">{family.homeLocation}</span>
              <span className="text-stone-600 text-[10px]">{family.convention} System · {family.validationSource}</span>
            </div>
          </div>
          <p className="text-[10px] text-stone-600 mt-2 italic text-center">
            "Every occasion remembered, computed with mathematical accuracy for our home sunrise. Keep on puja altar."
          </p>
        </div>

        {/* Regular Web Header */}
        <div className="p-6 border-b border-stone-200 bg-stone-50/70 print:hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h1 className="text-lg font-bold text-stone-900 font-serif-display">
                {family.name} — Family Tithi Calendar
              </h1>
              <p className="text-xs text-stone-600">
                Home Place: {family.homeLocation} ({family.convention} Calendar System) · Validated against {family.validationSource}
              </p>
            </div>
            <div className="text-xs text-stone-500 font-mono">
              Occasions: {sortedOccasions.length}
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          {sortedOccasions.length === 0 ? (
            <div className="py-12 px-4 text-center space-y-3">
              <div className="w-12 h-12 bg-amber-50 text-amber-700 rounded-full flex items-center justify-center mx-auto border border-amber-200">
                <CalendarIcon className="w-6 h-6 text-amber-600" />
              </div>
              <h4 className="text-base font-bold text-stone-900 font-serif-display">
                No occasions recorded yet for {family.name}
              </h4>
              <p className="text-xs text-stone-500 max-w-sm mx-auto">
                Once you record your family's tithis, birthdays, and festivals, your annual calendar schedule and export tools will appear here.
              </p>
              {onOpenAddModal && (
                <div className="pt-2">
                  <button
                    onClick={onOpenAddModal}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-amber-400 hover:bg-amber-300 text-stone-950 font-semibold rounded-xl text-xs transition-colors cursor-pointer shadow-sm"
                  >
                    <span>+ Record First Occasion</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-stone-100/80 border-b border-stone-200 text-stone-600 font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Occasion / Observance</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Tithi & Paksha</th>
                <th className="py-3 px-4">Sunrise & Timing</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right no-print">Sync / Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {sortedOccasions.map((occ) => {
                const isShraddha = occ.occasionType === 'shraddha' || occ.occasionType === 'mahalaya';
                return (
                  <tr key={occ.id} className="hover:bg-amber-50/40 transition-colors">
                    {/* Gregorian Date */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="font-bold text-stone-900">
                        {occ.occurrence2027.formattedDisplay}
                      </div>
                      <div className="text-[11px] text-stone-500">
                        {occ.occurrence2027.weekday}
                      </div>
                    </td>

                    {/* Occasion / Observance */}
                    <td className="py-3.5 px-4 min-w-[180px]">
                      <div className="font-semibold text-stone-900">
                        {occ.title}
                      </div>
                      {occ.personNameDisplay && (
                        <div className="text-[11px] text-stone-500">
                          {occ.personNameDisplay} {occ.relationshipDisplay && `(${occ.relationshipDisplay})`}
                        </div>
                      )}
                      {occ.practiceNotes && (
                        <div className="text-[10px] text-stone-400 italic line-clamp-1 mt-0.5">
                          {occ.practiceNotes}
                        </div>
                      )}
                    </td>

                    {/* Type */}
                    <td className="py-3.5 px-4 whitespace-nowrap text-stone-600 capitalize">
                      {occ.occasionType.replace('_', ' ')}
                    </td>

                    {/* Tithi & Paksha */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {occ.tithiFields ? (
                        <div className="font-devanagari font-medium text-amber-950">
                          {occ.tithiFields.lunarMonthDevanagari || occ.tithiFields.lunarMonth} {occ.tithiFields.pakshaDevanagari || occ.tithiFields.paksha} {occ.tithiFields.tithiDevanagari || occ.tithiFields.tithi}
                        </div>
                      ) : (
                        <span className="text-stone-400">Calendar Date</span>
                      )}
                    </td>

                    {/* Sunrise & Timing */}
                    <td className="py-3.5 px-4 text-stone-600 text-[11px]">
                      <div>Sunrise: {occ.occurrence2027.sunriseTime}</div>
                      <div className="text-stone-400 text-[10px] truncate max-w-[180px]">
                        {occ.occurrence2027.tithiSpan}
                      </div>
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      {occ.isConfirmed ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                          <CheckCircle className="w-3 h-3" />
                          Checked
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-800 bg-amber-50 px-2 py-0.5 rounded">
                          Unconfirmed
                        </span>
                      )}
                    </td>

                    {/* Actions (Hidden on Print) */}
                    <td className="py-3.5 px-4 text-right whitespace-nowrap no-print">
                      <div className="flex items-center justify-end gap-2">
                        {/* Single Event ICS */}
                        <button
                          onClick={() => handleExportSingleOccasionICS(occ)}
                          className="text-stone-500 hover:text-amber-800 text-[11px] font-medium cursor-pointer"
                          title="Add single occasion to Calendar (.ics)"
                        >
                          + iCal
                        </button>
                        <button
                          onClick={() => onOpenRemindersModal ? onOpenRemindersModal(occ) : onPreviewWhatsApp(occ)}
                          className="text-emerald-700 hover:text-emerald-900 text-xs font-semibold cursor-pointer"
                          title="Open 100% Free Reminders Hub (WhatsApp P2P, Calendar Sync, Email, Push)"
                        >
                          Reminders
                        </button>
                        {isShraddha && (
                          <button
                            onClick={() => onGeneratePriestNote(occ)}
                            className="text-amber-700 hover:text-amber-900 font-semibold text-xs cursor-pointer"
                            title="Generate Priest-Ready Note"
                          >
                            Priest Note
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          )}
        </div>

        {/* Footer print disclaimer */}
        <div className="p-4 bg-stone-50 border-t border-stone-200 text-center text-xs text-stone-500">
          KulLoop · Independent Family Tithi Loop · Email + optional push · MyDharohar prep partner
        </div>
      </div>

      {/* SYNC GUIDE MODAL */}
      {showSyncGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/70 backdrop-blur-sm">
          <div className="bg-white rounded-2xl border border-stone-200 shadow-2xl max-w-lg w-full p-6 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-stone-200">
              <div className="flex items-center gap-2">
                <CalendarCheck className="w-4 h-4 text-amber-700" />
                <h4 className="text-sm font-bold text-stone-900">
                  How to Sync KulLoop with Google or Apple Calendar
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setShowSyncGuide(false)}
                className="p-1 text-stone-400 hover:text-stone-700 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 text-xs text-stone-700 leading-relaxed">
              <div className="p-3.5 bg-amber-50 rounded-xl border border-amber-200 text-amber-950 space-y-1">
                <span className="font-bold block">Why iCalendar (.ics)?</span>
                <span>
                  The `.ics` standard allows all your family’s tithis, shraddhas, and festival dates to sit comfortably alongside your personal meetings and travel plans, with built-in 7-day and 2-day reminder alarms.
                </span>
              </div>

              {/* Steps for Google Calendar */}
              <div className="space-y-1.5">
                <span className="font-bold text-stone-900 block flex items-center gap-1.5">
                  <span>Google Calendar (Web & Mobile):</span>
                </span>
                <ol className="list-decimal pl-5 space-y-1 text-stone-600">
                  <li>Click <strong>"Export to Google / Apple Calendar (.ics)"</strong> above to download the file.</li>
                  <li>Open <strong>calendar.google.com</strong> on your computer.</li>
                  <li>Click the <strong>Settings gear icon (⚙)</strong> &gt; <strong>Settings</strong> &gt; <strong>Import &amp; export</strong>.</li>
                  <li>Upload the downloaded `.ics` file and select your family calendar. All dates will appear with alarms!</li>
                </ol>
              </div>

              {/* Steps for Apple Calendar */}
              <div className="space-y-1.5 pt-1">
                <span className="font-bold text-stone-900 block">
                  Apple Calendar (iPhone, iPad, Mac):
                </span>
                <ol className="list-decimal pl-5 space-y-1 text-stone-600">
                  <li>On Mac: Double-click the downloaded `.ics` file; Apple Calendar opens automatically and prompts to add all events.</li>
                  <li>On iPhone: Tap the downloaded file in Safari/Files, and tap <strong>"Add All"</strong> to import into your iCloud calendar.</li>
                </ol>
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-stone-200">
              <button
                type="button"
                onClick={handleDownloadICS}
                className="px-3.5 py-1.5 text-xs font-semibold text-amber-950 bg-amber-400 hover:bg-amber-300 rounded-lg shadow-2xs cursor-pointer"
              >
                Download .ics File Now
              </button>
              <button
                type="button"
                onClick={() => setShowSyncGuide(false)}
                className="px-3 py-1.5 text-xs text-stone-600 hover:text-stone-800 cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
