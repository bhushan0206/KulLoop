import React, { useState } from 'react';
import { FamilyOccasion, OccasionType } from '../types';
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
  Info
} from 'lucide-react';

interface OccasionListProps {
  occasions: FamilyOccasion[];
  onOpenAddModal: () => void;
  onPreviewWhatsApp: (occ: FamilyOccasion) => void;
  onGeneratePriestNote: (occ: FamilyOccasion) => void;
  onToggleConfirm: (id: string) => void;
  onDeleteOccasion: (id: string) => void;
}

export const OccasionList: React.FC<OccasionListProps> = ({
  occasions,
  onOpenAddModal,
  onPreviewWhatsApp,
  onGeneratePriestNote,
  onToggleConfirm,
  onDeleteOccasion,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | OccasionType>('all');

  const filteredOccasions = occasions.filter((occ) => {
    const matchesSearch = 
      occ.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (occ.personNameDisplay && occ.personNameDisplay.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (occ.tithiFields?.lunarMonth && occ.tithiFields.lunarMonth.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (occ.tithiFields?.tithi && occ.tithiFields.tithi.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesType = typeFilter === 'all' || occ.occasionType === typeFilter;
    return matchesSearch && matchesType;
  });

  const unconfirmedCount = occasions.filter((o) => !o.isConfirmed).length;

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

        <button
          onClick={onOpenAddModal}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-stone-900 bg-amber-400 hover:bg-amber-300 rounded-lg transition-colors whitespace-nowrap self-start sm:self-auto shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Occasion</span>
        </button>
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

      {/* Filters & Search Toolbar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-white p-3 rounded-xl border border-stone-200">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by ancestor, person, tithi (e.g. Magha, Saptami)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 text-xs bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500 text-stone-800"
          />
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-0.5">
          <button
            onClick={() => setTypeFilter('all')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-colors ${
              typeFilter === 'all'
                ? 'bg-stone-900 text-white'
                : 'text-stone-600 hover:bg-stone-100'
            }`}
          >
            All ({occasions.length})
          </button>
          <button
            onClick={() => setTypeFilter('shraddha')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-colors ${
              typeFilter === 'shraddha'
                ? 'bg-stone-900 text-white'
                : 'text-stone-600 hover:bg-stone-100'
            }`}
          >
            Shraddhas
          </button>
          <button
            onClick={() => setTypeFilter('birthday')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-colors ${
              typeFilter === 'birthday'
                ? 'bg-stone-900 text-white'
                : 'text-stone-600 hover:bg-stone-100'
            }`}
          >
            Birthdays
          </button>
          <button
            onClick={() => setTypeFilter('vrat_kuldevta')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-colors ${
              typeFilter === 'vrat_kuldevta'
                ? 'bg-stone-900 text-white'
                : 'text-stone-600 hover:bg-stone-100'
            }`}
          >
            Vrats & Kuldevta
          </button>
          <button
            onClick={() => setTypeFilter('festival')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-colors ${
              typeFilter === 'festival'
                ? 'bg-stone-900 text-white'
                : 'text-stone-600 hover:bg-stone-100'
            }`}
          >
            Festivals
          </button>
          <button
            onClick={() => setTypeFilter('milestone')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-colors ${
              typeFilter === 'milestone'
                ? 'bg-stone-900 text-white'
                : 'text-stone-600 hover:bg-stone-100'
            }`}
          >
            Milestones
          </button>
        </div>
      </div>

      {/* Occasions List */}
      <div className="space-y-3">
        {filteredOccasions.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl border border-stone-200 p-8 space-y-3">
            <Calendar className="w-10 h-10 text-stone-300 mx-auto" />
            <h4 className="text-base font-semibold text-stone-700">No occasions found</h4>
            <p className="text-xs text-stone-500 max-w-sm mx-auto">
              No dates match your search or filter. Try a different term or add a new family occasion.
            </p>
            <button
              onClick={onOpenAddModal}
              className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-stone-900 bg-amber-400 hover:bg-amber-300 rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Add Occasion</span>
            </button>
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
                    {occ.personNameDisplay && (
                      <p className="text-xs text-stone-600 font-medium">
                        Person: {occ.personNameDisplay} {occ.relationshipDisplay && `(${occ.relationshipDisplay})`}
                      </p>
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
                    onClick={() => onPreviewWhatsApp(occ)}
                    className="flex-1 md:flex-none inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-medium text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-lg transition-colors"
                    title="Preview WhatsApp message in Marathi, Hindi & English"
                  >
                    <Smartphone className="w-3.5 h-3.5 text-emerald-600" />
                    <span>WhatsApp</span>
                  </button>

                  {isShraddha && (
                    <button
                      onClick={() => onGeneratePriestNote(occ)}
                      className="flex-1 md:flex-none inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-amber-900 bg-amber-100 hover:bg-amber-200 rounded-lg transition-colors"
                      title="Generate Priest-Ready Note (गुरुजींसाठी नोंद)"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>Priest Note</span>
                    </button>
                  )}

                  <button
                    onClick={() => onDeleteOccasion(occ.id)}
                    className="p-1.5 text-stone-400 hover:text-rose-600 rounded-md transition-colors"
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
    </div>
  );
};
