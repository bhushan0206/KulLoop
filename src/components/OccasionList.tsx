import React, { useState, useMemo } from 'react';
import { FamilyOccasion, OccasionType, Member, Person, Family } from '../types';
import { exportFamilyRecordToICS, downloadFile } from '../utils/tithiCalculator';
import { 
  Search, 
  Filter, 
  Calendar, 
  CheckCircle, 
  AlertCircle, 
  Smartphone, 
  FileText, 
  Trash2, 
  Plus, 
  ExternalLink,
  ShieldAlert,
  Info,
  X,
  User,
  Tag,
  History,
  Download,
  CalendarCheck,
  HelpCircle,
  Check
} from 'lucide-react';

interface OccasionListProps {
  occasions: FamilyOccasion[];
  family?: Family;
  members?: Member[];
  people?: Person[];
  onOpenAddModal: () => void;
  onPreviewWhatsApp: (occ: FamilyOccasion) => void;
  onOpenRemindersModal?: (occ?: FamilyOccasion) => void;
  onGeneratePriestNote: (occ: FamilyOccasion) => void;
  onToggleConfirm: (id: string) => void;
  onDeleteOccasion: (id: string) => void;
}

// Map ritual types to synonyms and translations for smart search
const RITUAL_SYNONYMS: Record<OccasionType, string[]> = {
  shraddha: ['shraddha', 'shradh', 'shraaddha', 'श्राद्ध', 'pitru', 'ancestor', 'tithi shraddha', 'tarpan', 'pinda'],
  mahalaya: ['mahalaya', 'pitru paksha', 'pitrupaksha', 'महालय', 'पितृपक्ष', 'shraddha', 'sarvapitri'],
  birthday: ['birthday', 'tithi birthday', 'janmadin', 'वाढदिवस', 'जन्मदिवस', 'varshaganth', 'tithi', 'bday'],
  anniversary: ['anniversary', 'wedding', 'स्मृती', 'सालगिरी', 'वर्धापनदिन'],
  vrat_kuldevta: ['vrat', 'vrata', 'kuldevta', 'kuldevata', 'व्रत', 'कुलदैवत', 'fast', 'upas', 'upvas', 'khandoba', 'sankashti', 'ekadashi'],
  festival: ['festival', 'utsav', 'parva', 'सण', 'उत्सव', 'त्योहार', 'diwali', 'ganesh', 'ganpati', 'padwa'],
  milestone: ['milestone', 'sanskar', 'munj', 'thread ceremony', 'मुंज', 'संस्कार', 'ceremony'],
  custom: ['custom', 'family tradition', 'पारंपरिक', 'अन्य'],
};

export const OccasionList: React.FC<OccasionListProps> = ({
  occasions,
  family,
  members = [],
  people = [],
  onOpenAddModal,
  onPreviewWhatsApp,
  onOpenRemindersModal,
  onGeneratePriestNote,
  onToggleConfirm,
  onDeleteOccasion,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | OccasionType>('all');
  const [downloadToast, setDownloadToast] = useState<string | null>(null);
  const [showSyncGuideModal, setShowSyncGuideModal] = useState(false);

  const activeFamily: Family = family || {
    id: 'fam_01',
    name: 'Joshi Family Record',
    homeLocation: 'Pune, Maharashtra',
    region: 'Maharashtra',
    convention: 'Amanta',
    configuratorName: 'Bhushan Joshi',
    configuratorPhone: '+91 98220 12345',
    validationSource: 'Datar Panchang (Pune)',
    traditionNotes: 'Jejuri Khandoba, Kuldevi Bhavani',
    plan: 'pilot_founding',
    payer: 'configurator',
    consultedEntity: 'Printed almanac'
  };

  const showDownloadNotice = (msg: string) => {
    setDownloadToast(msg);
    setTimeout(() => setDownloadToast(null), 3500);
  };

  const handleExportAllICS = () => {
    const icsContent = exportFamilyRecordToICS(occasions, activeFamily);
    const fileName = `${activeFamily.name.replace(/[^a-zA-Z0-9]/g, '_')}_tithi_calendar.ics`;
    downloadFile(fileName, icsContent, 'text/calendar;charset=utf-8;');
    showDownloadNotice(`Exported all ${occasions.length} family occasions to .ics! Open in Google Calendar or Apple Calendar.`);
  };

  const handleExportFilteredICS = () => {
    const listToExport = filteredOccasions.length > 0 ? filteredOccasions : occasions;
    const icsContent = exportFamilyRecordToICS(listToExport, activeFamily);
    const fileName = `${activeFamily.name.replace(/[^a-zA-Z0-9]/g, '_')}_filtered_tithis.ics`;
    downloadFile(fileName, icsContent, 'text/calendar;charset=utf-8;');
    showDownloadNotice(`Exported ${listToExport.length} filtered occasions to .ics file!`);
  };

  const handleExportSingleICS = (occ: FamilyOccasion) => {
    const icsContent = exportFamilyRecordToICS([occ], activeFamily);
    const fileName = `${occ.title.replace(/[^a-zA-Z0-9]/g, '_')}.ics`;
    downloadFile(fileName, icsContent, 'text/calendar;charset=utf-8;');
    showDownloadNotice(`Exported "${occ.title}" to .ics`);
  };

  // Filter occasions based on title, ritual type, and associated family member
  const filteredOccasions = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();

    return occasions.filter((occ) => {
      // 1. Type Filter (tabs)
      const matchesTypeFilter = typeFilter === 'all' || occ.occasionType === typeFilter;
      if (!matchesTypeFilter) return false;

      // 2. Search query check
      if (!term) return true;

      // Match A: Title
      const matchesTitle = occ.title.toLowerCase().includes(term);

      // Match B: Ritual Type (direct code, human label, and synonyms)
      const directType = occ.occasionType.toLowerCase();
      const spacedType = occ.occasionType.replace('_', ' ').toLowerCase();
      const recurrenceType = occ.recurrenceType.toLowerCase();
      const synonyms = RITUAL_SYNONYMS[occ.occasionType] || [];
      const matchesRitualType = 
        directType.includes(term) ||
        spacedType.includes(term) ||
        recurrenceType.includes(term) ||
        synonyms.some((s) => s.includes(term));

      // Match C: Associated Family Member
      const matchesPersonName = !!(occ.personNameDisplay && occ.personNameDisplay.toLowerCase().includes(term));
      const matchesRelationship = !!(occ.relationshipDisplay && occ.relationshipDisplay.toLowerCase().includes(term));
      const matchesPerformedBy = !!(occ.performedBy && occ.performedBy.toLowerCase().includes(term));

      // Check linked Person records (ancestors or living relatives)
      const matchesLinkedPeople = occ.personIds.some((pId) => {
        const foundPerson = people.find((p) => p.id === pId);
        if (!foundPerson) return false;
        return (
          foundPerson.name.toLowerCase().includes(term) ||
          foundPerson.relationship.toLowerCase().includes(term) ||
          (foundPerson.gotra && foundPerson.gotra.toLowerCase().includes(term))
        );
      });

      // Check associated Members
      const matchesLinkedMember = members.some((m) => {
        if (!occ.personNameDisplay) return false;
        return (
          occ.personNameDisplay.toLowerCase().includes(m.name.toLowerCase()) ||
          m.name.toLowerCase().includes(term) && occ.title.toLowerCase().includes(m.name.split(' ')[0].toLowerCase())
        );
      });

      const matchesFamilyMember = 
        matchesPersonName || 
        matchesRelationship || 
        matchesPerformedBy || 
        matchesLinkedPeople || 
        matchesLinkedMember;

      // Match D: Additional context (tithi names or notes)
      const matchesTithi = !!(
        (occ.tithiFields?.lunarMonth && occ.tithiFields.lunarMonth.toLowerCase().includes(term)) ||
        (occ.tithiFields?.tithi && occ.tithiFields.tithi.toLowerCase().includes(term)) ||
        (occ.tithiFields?.lunarMonthDevanagari && occ.tithiFields.lunarMonthDevanagari.includes(term)) ||
        (occ.tithiFields?.tithiDevanagari && occ.tithiFields.tithiDevanagari.includes(term)) ||
        (occ.practiceNotes && occ.practiceNotes.toLowerCase().includes(term))
      );

      return matchesTitle || matchesRitualType || matchesFamilyMember || matchesTithi;
    });
  }, [occasions, searchTerm, typeFilter, people, members]);

  const unconfirmedCount = occasions.filter((o) => !o.isConfirmed).length;

  // Quick suggestions for easy one-click search testing
  const quickSearchSuggestions = [
    { label: 'Shraddha Rites', term: 'shraddha' },
    { label: 'Aaji (Grandmother)', term: 'aaji' },
    { label: 'Vrat & Kuldevta', term: 'kuldevta' },
    { label: 'Birthdays', term: 'birthday' },
    { label: 'Vasant Joshi', term: 'vasant' },
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner / Headline */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-stone-900 font-serif-display">
            Family Occasions Record (कुटुंब तिथी व दिनविशेष)
          </h2>
          <p className="text-xs text-stone-500 mt-1">
            Every occasion the family observes. Tithi dates are verified against the family's named validation source.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          {/* ICS Export Action */}
          <button
            onClick={searchTerm || typeFilter !== 'all' ? handleExportFilteredICS : handleExportAllICS}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-stone-800 bg-white hover:bg-stone-100 border border-stone-300 rounded-lg transition-colors whitespace-nowrap shadow-2xs cursor-pointer"
            title="Download iCalendar (.ics) file to import into Google Calendar or Apple Calendar"
          >
            <CalendarCheck className="w-4 h-4 text-amber-700" />
            <span>Export Calendar (.ics)</span>
          </button>

          {/* Sync Guide Helper */}
          <button
            onClick={() => setShowSyncGuideModal(true)}
            className="p-2 text-stone-500 hover:text-stone-800 bg-white hover:bg-stone-100 border border-stone-200 rounded-lg transition-colors cursor-pointer"
            title="How to sync with Google Calendar & Apple Calendar"
            aria-label="Calendar sync instructions"
          >
            <HelpCircle className="w-4 h-4" />
          </button>

          {/* Add Occasion */}
          <button
            onClick={onOpenAddModal}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-stone-900 bg-amber-400 hover:bg-amber-300 rounded-lg transition-colors whitespace-nowrap shadow-sm cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Occasion</span>
          </button>
        </div>
      </div>

      {/* Unconfirmed Alert Banner if any */}
      {unconfirmedCount > 0 && (
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
          <div className="text-xs text-amber-900 space-y-1">
            <span className="font-bold">Correctness Guardrail: </span>
            <span>
              {unconfirmedCount} occasion(s) are flagged as unconfirmed (entered from memory or converted from a Gregorian date). As per the trust protocol, these must be checked with an elder or family priest before the reminder cycle begins.
            </span>
          </div>
        </div>
      )}

      {/* Search Bar & Filters Section */}
      <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-2xs space-y-3">
        {/* Main Search Bar */}
        <div className="relative">
          <label htmlFor="occasion-search" className="sr-only">
            Search family occasions by title, ritual type, or family member
          </label>
          <div className="relative flex items-center">
            <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              id="occasion-search"
              type="text"
              placeholder="Search occasions by title, ritual type (e.g. Shraddha, Birthday, Vrat), or family member (e.g. Aaji, Vasant)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-10 py-2.5 text-xs bg-stone-50 hover:bg-stone-50/80 focus:bg-white border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500 text-stone-800 transition-all placeholder:text-stone-400"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-stone-400 hover:text-stone-700 rounded-md transition-colors cursor-pointer"
                title="Clear search"
                aria-label="Clear search input"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Quick Search Chips & Filter Bar */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pt-1 border-t border-stone-100">
          {/* Quick Suggestions */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
            <span className="text-[11px] text-stone-400 font-medium shrink-0 flex items-center gap-1">
              <span>Filter by:</span>
            </span>
            {quickSearchSuggestions.map((item) => {
              const isActive = searchTerm.toLowerCase() === item.term.toLowerCase();
              return (
                <button
                  key={item.term}
                  type="button"
                  onClick={() => setSearchTerm(isActive ? '' : item.term)}
                  className={`px-2.5 py-1 text-[11px] rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
                    isActive 
                      ? 'bg-amber-400 text-stone-950 font-semibold shadow-2xs' 
                      : 'bg-stone-100 hover:bg-stone-200/80 text-stone-600'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </div>

          {/* Type Filter Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-0.5 shrink-0">
            <button
              onClick={() => setTypeFilter('all')}
              className={`px-3 py-1 text-[11px] font-medium rounded-lg whitespace-nowrap transition-colors cursor-pointer ${
                typeFilter === 'all'
                  ? 'bg-stone-900 text-white'
                  : 'text-stone-600 hover:bg-stone-100'
              }`}
            >
              All ({occasions.length})
            </button>
            <button
              onClick={() => setTypeFilter('shraddha')}
              className={`px-3 py-1 text-[11px] font-medium rounded-lg whitespace-nowrap transition-colors cursor-pointer ${
                typeFilter === 'shraddha'
                  ? 'bg-stone-900 text-white'
                  : 'text-stone-600 hover:bg-stone-100'
              }`}
            >
              Shraddhas
            </button>
            <button
              onClick={() => setTypeFilter('birthday')}
              className={`px-3 py-1 text-[11px] font-medium rounded-lg whitespace-nowrap transition-colors cursor-pointer ${
                typeFilter === 'birthday'
                  ? 'bg-stone-900 text-white'
                  : 'text-stone-600 hover:bg-stone-100'
              }`}
            >
              Birthdays
            </button>
            <button
              onClick={() => setTypeFilter('vrat_kuldevta')}
              className={`px-3 py-1 text-[11px] font-medium rounded-lg whitespace-nowrap transition-colors cursor-pointer ${
                typeFilter === 'vrat_kuldevta'
                  ? 'bg-stone-900 text-white'
                  : 'text-stone-600 hover:bg-stone-100'
              }`}
            >
              Vrats & Kuldevta
            </button>
            <button
              onClick={() => setTypeFilter('festival')}
              className={`px-3 py-1 text-[11px] font-medium rounded-lg whitespace-nowrap transition-colors cursor-pointer ${
                typeFilter === 'festival'
                  ? 'bg-stone-900 text-white'
                  : 'text-stone-600 hover:bg-stone-100'
              }`}
            >
              Festivals
            </button>
            <button
              onClick={() => setTypeFilter('milestone')}
              className={`px-3 py-1 text-[11px] font-medium rounded-lg whitespace-nowrap transition-colors cursor-pointer ${
                typeFilter === 'milestone'
                  ? 'bg-stone-900 text-white'
                  : 'text-stone-600 hover:bg-stone-100'
              }`}
            >
              Milestones
            </button>
          </div>
        </div>

        {/* Search Results Summary (when search is active) */}
        {(searchTerm || typeFilter !== 'all') && (
          <div className="flex items-center justify-between text-[11px] text-stone-500 pt-2 border-t border-stone-100">
            <div className="flex items-center gap-1.5">
              <span>Showing</span>
              <span className="font-semibold text-stone-900 font-mono tabular-nums">{filteredOccasions.length}</span>
              <span>of</span>
              <span className="font-semibold text-stone-900 font-mono tabular-nums">{occasions.length}</span>
              <span>occasions</span>
              {searchTerm && (
                <>
                  <span aria-hidden="true">·</span>
                  <span>Filtered by: <strong className="text-stone-800">"{searchTerm}"</strong></span>
                </>
              )}
            </div>

            <button
              type="button"
              onClick={() => {
                setSearchTerm('');
                setTypeFilter('all');
              }}
              className="text-amber-700 hover:text-amber-900 font-medium cursor-pointer transition-colors"
            >
              Clear filters
            </button>
          </div>
        )}
      </div>

      {/* Occasions List */}
      <div className="space-y-3">
        {filteredOccasions.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl border border-stone-200 p-8 space-y-3">
            <Calendar className="w-10 h-10 text-stone-300 mx-auto" />
            <h4 className="text-base font-semibold text-stone-700">No matching occasions found</h4>
            <p className="text-xs text-stone-500 max-w-md mx-auto">
              {searchTerm 
                ? `No occasions match "${searchTerm}". We searched across occasion titles, ritual types (shraddha, vrat, birthday, etc.), and associated family members.`
                : 'No occasions match the selected filter category.'}
            </p>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setSearchTerm('');
                  setTypeFilter('all');
                }}
                className="px-3.5 py-1.5 text-xs font-medium text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-lg transition-colors cursor-pointer"
              >
                Clear Search & Filters
              </button>
              <button
                onClick={onOpenAddModal}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-stone-900 bg-amber-400 hover:bg-amber-300 rounded-lg transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Add Occasion</span>
              </button>
            </div>
          </div>
        ) : (
          filteredOccasions.map((occ) => {
            const isShraddha = occ.occasionType === 'shraddha' || occ.occasionType === 'mahalaya';

            return (
              <div
                key={occ.id}
                className="bg-white rounded-xl border border-stone-200 p-4 sm:p-5 shadow-sm hover:border-amber-300 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                {/* Left details */}
                <div className="space-y-2 flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span className="font-semibold text-stone-700 uppercase tracking-wider text-[11px]">
                      {occ.occasionType.replace('_', ' ')}
                    </span>
                    <span aria-hidden="true" className="text-stone-300">·</span>
                    <span className="text-stone-500">
                      {occ.recurrenceType === 'tithi' ? 'Tithi-Based Recurrence' : occ.recurrenceType === 'gregorian' ? 'Calendar Date Recurrence' : 'Festival Observance Rule'}
                    </span>
                    <span aria-hidden="true" className="text-stone-300">·</span>
                    {occ.isConfirmed ? (
                      <button
                        onClick={() => onToggleConfirm(occ.id)}
                        className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 hover:text-emerald-800"
                        title="Click to toggle status"
                      >
                        <CheckCircle className="w-3.5 h-3.5" />
                        <span>Confirmed</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => onToggleConfirm(occ.id)}
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 hover:bg-amber-100"
                        title="Click to mark confirmed"
                      >
                        <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                        <span>Unconfirmed (Verify)</span>
                      </button>
                    )}
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-stone-900 leading-snug">
                      {occ.title}
                    </h3>
                    {occ.personNameDisplay ? (
                      <p className="text-xs text-stone-600 font-medium flex items-center gap-1.5 mt-0.5">
                        <User className="w-3.5 h-3.5 text-amber-700/70 shrink-0" />
                        <span>Associated Member: <strong className="text-stone-800">{occ.personNameDisplay}</strong> {occ.relationshipDisplay && <span className="text-stone-500 font-normal">({occ.relationshipDisplay})</span>}</span>
                      </p>
                    ) : (
                      <p className="text-xs text-stone-400 italic mt-0.5">
                        Family-wide Observance
                      </p>
                    )}

                    {(occ.establishedYear || occ.gregorianFields?.originalYear) && (
                      <div className="inline-flex items-center gap-1.5 mt-1 text-[11px] font-medium text-amber-900 bg-amber-50 border border-amber-200/70 px-2 py-0.5 rounded">
                        <History className="w-3 h-3 text-amber-700" />
                        <span>
                          {2026 - (occ.establishedYear || occ.gregorianFields!.originalYear!)} Years Observed ({2027 - (occ.establishedYear || occ.gregorianFields!.originalYear!)}th in 2027) · Est. {occ.establishedYear || occ.gregorianFields!.originalYear}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Tithi or Date Breakdown */}
                  <div className="text-xs text-stone-600 space-y-0.5">
                    {occ.tithiFields && (
                      <div className="font-devanagari text-amber-950 font-medium">
                        तिथी: {occ.tithiFields.lunarMonthDevanagari || occ.tithiFields.lunarMonth} {occ.tithiFields.pakshaDevanagari || occ.tithiFields.paksha} {occ.tithiFields.tithiDevanagari || occ.tithiFields.tithi}
                      </div>
                    )}
                    {occ.practiceNotes && (
                      <div className="text-stone-500 text-[11px] line-clamp-1">
                        <span className="font-medium text-stone-700">Practice:</span> {occ.practiceNotes}
                      </div>
                    )}
                    <div className="text-[11px] text-stone-400">
                      Validation source: {occ.occurrence2027.validationSourceUsed}
                    </div>
                  </div>
                </div>

                {/* Center / Right: 2027 Occurrence badge */}
                <div className="bg-stone-50 border border-stone-200/80 rounded-lg p-3 text-xs md:text-right shrink-0 min-w-[200px] space-y-1">
                  <div className="text-stone-500 text-[11px]">Next Gregorian Date</div>
                  <div className="text-sm font-bold text-stone-900">
                    {occ.occurrence2027.formattedDisplay}
                  </div>
                  <div className="text-[11px] font-medium text-stone-700">
                    {occ.occurrence2027.weekday} · {occ.occurrence2027.sunriseTime}
                  </div>
                  <div className="text-[10px] text-stone-400 truncate max-w-[220px]">
                    {occ.occurrence2027.tithiSpan}
                  </div>
                </div>

                {/* Right Actions */}
                <div className="flex md:flex-col items-center justify-end gap-2 shrink-0 border-t md:border-t-0 pt-2 md:pt-0">
                  <button
                    onClick={() => onOpenRemindersModal ? onOpenRemindersModal(occ) : onPreviewWhatsApp(occ)}
                    className="flex-1 md:flex-none inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-medium text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors cursor-pointer"
                    title="Open Zero-Fee Reminders: WhatsApp P2P, Calendar Sync, Email, Push"
                  >
                    <Smartphone className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Remind Hub</span>
                  </button>

                  <button
                    onClick={() => handleExportSingleICS(occ)}
                    className="flex-1 md:flex-none inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-medium text-stone-700 bg-stone-50 hover:bg-stone-100 border border-stone-200 rounded-lg transition-colors cursor-pointer"
                    title="Export single occasion as .ics file for Google or Apple Calendar"
                  >
                    <Download className="w-3.5 h-3.5 text-amber-700" />
                    <span>.ics</span>
                  </button>

                  {isShraddha && (
                    <button
                      onClick={() => onGeneratePriestNote(occ)}
                      className="flex-1 md:flex-none inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-amber-900 bg-amber-100 hover:bg-amber-200 rounded-lg transition-colors cursor-pointer"
                      title="Generate Priest-Ready Note (गुरुजींसाठी नोंद)"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>Priest Note</span>
                    </button>
                  )}

                  <button
                    onClick={() => onDeleteOccasion(occ.id)}
                    className="p-1.5 text-stone-400 hover:text-rose-600 rounded-md transition-colors cursor-pointer"
                    title="Delete occasion"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Download Feedback Toast */}
      {downloadToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-stone-900 text-amber-300 text-xs px-4 py-2.5 rounded-xl shadow-xl border border-stone-800 flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{downloadToast}</span>
        </div>
      )}

      {/* Calendar Sync Instructions Modal */}
      {showSyncGuideModal && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full border border-stone-200 shadow-2xl p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div className="flex items-center gap-2">
                <CalendarCheck className="w-5 h-5 text-amber-600" />
                <h3 className="font-bold text-stone-900 text-base font-serif-display">
                  Sync Tithis to Your Personal Calendar
                </h3>
              </div>
              <button
                onClick={() => setShowSyncGuideModal(false)}
                className="p-1 text-stone-400 hover:text-stone-700 rounded-md cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-stone-600 leading-relaxed">
              When you download an <strong>.ics</strong> file from KulLoop, all occasions are encoded with dual 7-day and 2-day reminder alarms, exact local sunrise times, tithi spans, and practice notes.
            </p>

            <div className="space-y-3 pt-1 text-xs text-stone-700">
              <div className="p-3 bg-stone-50 rounded-xl border border-stone-200/80 space-y-1">
                <div className="font-bold text-stone-900 flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-amber-200 text-amber-900 text-[10px] flex items-center justify-center font-bold">1</span>
                  <span>Google Calendar (Web / Android)</span>
                </div>
                <ol className="list-decimal list-inside text-stone-600 space-y-0.5 pl-6 text-[11px]">
                  <li>Open <strong>calendar.google.com</strong> on your computer.</li>
                  <li>Click the gear icon (Settings) in the top-right &rarr; <strong>Settings</strong>.</li>
                  <li>In the left sidebar, click <strong>Import &amp; export</strong>.</li>
                  <li>Click <strong>Select file from your computer</strong> and choose the downloaded .ics file.</li>
                  <li>Select which calendar to add the tithis to, then click <strong>Import</strong>.</li>
                </ol>
              </div>

              <div className="p-3 bg-stone-50 rounded-xl border border-stone-200/80 space-y-1">
                <div className="font-bold text-stone-900 flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-amber-200 text-amber-900 text-[10px] flex items-center justify-center font-bold">2</span>
                  <span>Apple Calendar (iPhone, iPad, Mac)</span>
                </div>
                <ol className="list-decimal list-inside text-stone-600 space-y-0.5 pl-6 text-[11px]">
                  <li>On iPhone / iPad: Tap the downloaded .ics file in Safari or Files, then tap <strong>Add All</strong>.</li>
                  <li>On Mac: Double-click the .ics file &rarr; Choose the calendar to add &rarr; Click <strong>OK</strong>.</li>
                  <li>Events will automatically sync across all your Apple devices via iCloud.</li>
                </ol>
              </div>

              <div className="p-3 bg-stone-50 rounded-xl border border-stone-200/80 space-y-1">
                <div className="font-bold text-stone-900 flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-amber-200 text-amber-900 text-[10px] flex items-center justify-center font-bold">3</span>
                  <span>Microsoft Outlook</span>
                </div>
                <ol className="list-decimal list-inside text-stone-600 space-y-0.5 pl-6 text-[11px]">
                  <li>Go to <strong>outlook.live.com/calendar</strong> &rarr; Click <strong>Add calendar</strong>.</li>
                  <li>Select <strong>Upload from file</strong> &rarr; Browse and choose the downloaded .ics file.</li>
                  <li>Click <strong>Import</strong>.</li>
                </ol>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-end gap-2 border-t border-stone-100">
              <button
                onClick={() => {
                  setShowSyncGuideModal(false);
                  handleExportAllICS();
                }}
                className="px-4 py-2 text-xs font-semibold text-stone-900 bg-amber-400 hover:bg-amber-300 rounded-lg transition-colors cursor-pointer inline-flex items-center gap-1.5"
              >
                <Download className="w-4 h-4" />
                <span>Download .ics Now</span>
              </button>
              <button
                onClick={() => setShowSyncGuideModal(false)}
                className="px-3.5 py-2 text-xs font-medium text-stone-600 hover:text-stone-900 rounded-lg cursor-pointer"
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
