import React, { useState } from 'react';
import { 
  OccasionType, 
  RecurrenceType, 
  FamilyOccasion, 
  Family 
} from '../types';
import { 
  LUNAR_MONTHS, 
  TITHI_NAMES, 
  AVAILABLE_FESTIVALS, 
  AVAILABLE_VRATS 
} from '../data/mockData';
import { estimateTithiFromDate } from '../utils/tithiCalculator';
import { X, Sparkles, AlertCircle, CheckCircle } from 'lucide-react';

interface AddOccasionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddOccasion: (occ: FamilyOccasion) => void;
  family: Family;
}

export const AddOccasionModal: React.FC<AddOccasionModalProps> = ({
  isOpen,
  onClose,
  onAddOccasion,
  family,
}) => {
  const [occasionType, setOccasionType] = useState<OccasionType>('shraddha');
  const [recurrenceType, setRecurrenceType] = useState<RecurrenceType>('tithi');
  
  // Person details
  const [personName, setPersonName] = useState('');
  const [relationship, setRelationship] = useState('');
  const [customTitle, setCustomTitle] = useState('');

  // Tithi fields
  const [paksha, setPaksha] = useState<'Shukla' | 'Krishna'>('Krishna');
  const [lunarMonth, setLunarMonth] = useState('Magha');
  const [tithi, setTithi] = useState('Saptami');

  // Guided conversion from Gregorian
  const [knowsTithi, setKnowsTithi] = useState<'yes' | 'gregorian'>('yes');
  const [gregorianDateOfPassing, setGregorianDateOfPassing] = useState('');
  const [conversionResult, setConversionResult] = useState<ReturnType<typeof estimateTithiFromDate> | null>(null);

  // Gregorian fields (for calendar date birthdays)
  const [gregDate, setGregDate] = useState('1990-01-01');

  // Festival / Vrat selection
  const [selectedFestivalKey, setSelectedFestivalKey] = useState('ganesh_chaturthi');
  const [selectedVratKey, setSelectedVratKey] = useState('sankashti');

  // Mahalaya option
  const [mahalayaPractice, setMahalayaPractice] = useState<'same_tithi' | 'sarvapitri_amavasya' | 'custom'>('same_tithi');

  // Confirmation & Notes
  const [isConfirmed, setIsConfirmed] = useState(true);
  const [confirmedSource, setConfirmedSource] = useState('Aaji (Grandmother) & Printed Almanan');
  const [practiceNotes, setPracticeNotes] = useState('');
  const [establishedYear, setEstablishedYear] = useState('');

  if (!isOpen) return null;

  const handleEstimate = (dateStr: string) => {
    setGregorianDateOfPassing(dateStr);
    const est = estimateTithiFromDate(dateStr, family.convention);
    setConversionResult(est);
    if (est) {
      setLunarMonth(est.lunarMonth);
      setPaksha(est.paksha);
      setTithi(est.tithi);
      setIsConfirmed(false); // As per PDF Page 8: Unconfirmed until checked
      setConfirmedSource('Estimated from Gregorian date — please confirm with elder / priest');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    let title = customTitle;
    let personNameDisplay = personName;
    let relationshipDisplay = relationship;

    if (occasionType === 'shraddha') {
      title = `Shraddha: ${personName || 'Ancestor'}`;
    } else if (occasionType === 'birthday') {
      title = `${personName || 'Family Member'}'s Birthday (${recurrenceType === 'tithi' ? 'Tithi-Based' : 'Calendar Date'})`;
    } else if (occasionType === 'anniversary') {
      title = `${personName || 'Family'} Wedding Anniversary`;
    } else if (occasionType === 'festival') {
      const fest = AVAILABLE_FESTIVALS.find((f) => f.id === selectedFestivalKey);
      title = fest ? `${fest.nameEn} (${fest.nameMr})` : 'Family Festival';
    } else if (occasionType === 'vrat_kuldevta') {
      const vr = AVAILABLE_VRATS.find((v) => v.id === selectedVratKey);
      title = vr ? `${vr.nameEn}` : 'Kuldevta / Vrat Day';
    } else if (!title) {
      title = 'Family Observance';
    }

    // Selected month and tithi Devanagari
    const monthObj = LUNAR_MONTHS.find((m) => m.nameEn.toLowerCase() === lunarMonth.toLowerCase());
    const tithiObj = TITHI_NAMES.find((t) => t.id.toLowerCase().includes(tithi.toLowerCase()) || t.nameEn.toLowerCase().includes(tithi.toLowerCase()));

    const newOccasion: FamilyOccasion = {
      id: `occ_${Date.now()}`,
      familyId: family.id,
      title,
      occasionType,
      recurrenceType,
      personIds: personName ? [`per_${Date.now()}`] : [],
      personNameDisplay,
      relationshipDisplay,
      tithiFields: recurrenceType === 'tithi' ? {
        paksha,
        lunarMonth,
        tithi,
        pakshaDevanagari: paksha === 'Shukla' ? 'शुक्ल पक्ष' : 'कृष्ण पक्ष (वद्य)',
        lunarMonthDevanagari: monthObj?.nameMr || lunarMonth,
        tithiDevanagari: tithiObj?.nameMr || tithi,
      } : undefined,
      gregorianFields: recurrenceType === 'gregorian' ? {
        day: new Date(gregDate).getDate() || 15,
        month: (new Date(gregDate).getMonth() + 1) || 5,
        originalYear: new Date(gregDate).getFullYear(),
      } : undefined,
      festivalKey: occasionType === 'festival' ? selectedFestivalKey : undefined,
      establishedYear: establishedYear ? parseInt(establishedYear, 10) : (recurrenceType === 'gregorian' ? new Date(gregDate).getFullYear() : undefined),
      mahalayaOverride: occasionType === 'shraddha' ? mahalayaPractice : undefined,
      isConfirmed: isConfirmed && knowsTithi === 'yes',
      confirmedSource: confirmedSource || (isConfirmed ? 'Family Elder' : 'Unconfirmed'),
      practiceNotes: practiceNotes || 'Observed as per family tradition at home.',
      priority: occasionType === 'shraddha' ? 'high' : 'normal',
      occurrence2027: {
        year: 2027,
        gregorianDateStr: '2027-04-14',
        formattedDisplay: '14 April 2027',
        weekday: 'Wednesday',
        sunriseTime: '06:14 AM IST (Pune)',
        tithiSpan: `${lunarMonth} ${paksha} ${tithi} observed as per Pune sunrise`,
        isVerified: isConfirmed,
        validationSourceUsed: family.validationSource,
        edgeCaseNote: 'Computed for home sunrise location.',
      },
      contentNote: {
        mr: {
          title: `${title} स्मरण`,
          body: `येत्या चालू वर्षातील तिथीनुसार ${title} चे स्मरण. स्थान: ${family.homeLocation} सूर्योदयानुरूप.`,
          prepList: ['पूजेचे साहित्य व नैवेद्य आदल्या दिवशी तयार ठेवा.'],
          wish: occasionType === 'birthday' ? 'वाढदिवसाच्या हार्दिक शुभेच्छा!' : undefined,
        },
        hi: {
          title: `${title} स्मरण`,
          body: `इस वर्ष की तिथि अनुसार ${title} का स्मरण। स्थान: ${family.homeLocation} सूर्योदय अनुसार।`,
          prepList: ['पूजा सामग्री समय से व्यवस्थित करें।'],
          wish: occasionType === 'birthday' ? 'जन्मदिन की हार्दिक शुभकामनाएं!' : undefined,
        },
        en: {
          title: `Family Remembrance: ${title}`,
          body: `Upcoming observance for ${title}, calculated for ${family.homeLocation} local sunrise.`,
          prepList: ['Keep ritual offerings and preparations ready in advance.'],
          wish: occasionType === 'birthday' ? 'Wishing a very happy and blessed birthday!' : undefined,
        },
      },
    };

    onAddOccasion(newOccasion);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/70 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-2xl border border-stone-200 shadow-2xl max-w-2xl w-full p-6 sm:p-8 space-y-6 my-8 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-stone-200">
          <div>
            <h3 className="text-xl font-bold text-stone-900 font-serif-display">
              Add Family Occasion
            </h3>
            <p className="text-xs text-stone-500">
              Only enter once. KulLoop calculates each year's date for {family.homeLocation}.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-stone-700 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Step 1: Occasion Type */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-stone-700 uppercase tracking-wider">
              Occasion Type
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { id: 'shraddha', label: 'Shraddha (Ancestor)' },
                { id: 'birthday', label: 'Birthday' },
                { id: 'anniversary', label: 'Anniversary' },
                { id: 'vrat_kuldevta', label: 'Vrat / Kuldevta' },
                { id: 'festival', label: 'Family Festival' },
                { id: 'milestone', label: 'Life Milestone' },
                { id: 'custom', label: 'Custom Occasion' },
              ].map((opt) => (
                <button
                  type="button"
                  key={opt.id}
                  onClick={() => {
                    setOccasionType(opt.id as OccasionType);
                    if (opt.id === 'shraddha' || opt.id === 'vrat_kuldevta') {
                      setRecurrenceType('tithi');
                    }
                  }}
                  className={`p-2.5 text-xs text-center font-medium rounded-lg border transition-all ${
                    occasionType === opt.id
                      ? 'bg-amber-500 text-stone-950 border-amber-600 font-semibold shadow-sm'
                      : 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Conditional Person Details */}
          {(occasionType === 'shraddha' || occasionType === 'birthday' || occasionType === 'anniversary') && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl bg-stone-50 border border-stone-200">
              <div className="space-y-1">
                <label className="text-xs font-medium text-stone-700">
                  {occasionType === 'shraddha' ? 'Ancestor Name (पितरांचे नाव)' : 'Person Name'}
                </label>
                <input
                  type="text"
                  required
                  placeholder={occasionType === 'shraddha' ? 'e.g. Late Vasant Joshi (कै. वसंत जोशी)' : 'e.g. Malati Joshi'}
                  value={personName}
                  onChange={(e) => setPersonName(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-white border border-stone-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-stone-700">
                  Relationship to Family (नातेसंबंध)
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Grandfather (आजोबा), Mother, Elder Uncle"
                  value={relationship}
                  onChange={(e) => setRelationship(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-white border border-stone-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>
            </div>
          )}

          {/* Recurrence Mode Selector */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-stone-700 uppercase tracking-wider">
              Recurrence Method
            </label>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setRecurrenceType('tithi')}
                className={`flex-1 p-3 text-xs text-left rounded-lg border transition-all ${
                  recurrenceType === 'tithi'
                    ? 'bg-amber-50 border-amber-500 text-amber-950 font-semibold'
                    : 'bg-white border-stone-200 text-stone-600'
                }`}
              >
                <div className="font-bold text-amber-900">Tithi-Based Recurrence (Hero)</div>
                <div className="text-[11px] text-stone-500 mt-0.5">
                  Calculated by Hindu lunar calendar (Paksha, Month, Tithi) for {family.homeLocation}.
                </div>
              </button>

              {occasionType !== 'shraddha' && (
                <button
                  type="button"
                  onClick={() => setRecurrenceType('gregorian')}
                  className={`flex-1 p-3 text-xs text-left rounded-lg border transition-all ${
                    recurrenceType === 'gregorian'
                      ? 'bg-amber-50 border-amber-500 text-amber-950 font-semibold'
                      : 'bg-white border-stone-200 text-stone-600'
                  }`}
                >
                  <div className="font-bold text-amber-900">Calendar Date Recurrence</div>
                  <div className="text-[11px] text-stone-500 mt-0.5">
                    Fixed Gregorian day & month (e.g. 14 October, 22 November).
                  </div>
                </button>
              )}
            </div>
          </div>

          {/* Tithi Specific Fields */}
          {recurrenceType === 'tithi' && occasionType !== 'festival' && (
            <div className="space-y-4 p-4 rounded-xl bg-amber-50/50 border border-amber-200">
              {occasionType === 'shraddha' && (
                <div className="space-y-2">
                  <div className="flex items-center gap-4 text-xs font-medium text-stone-700">
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="radio"
                        checked={knowsTithi === 'yes'}
                        onChange={() => setKnowsTithi('yes')}
                        className="text-amber-600"
                      />
                      <span>I know the Tithi</span>
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="radio"
                        checked={knowsTithi === 'gregorian'}
                        onChange={() => setKnowsTithi('gregorian')}
                        className="text-amber-600"
                      />
                      <span>I only know Gregorian date of passing</span>
                    </label>
                  </div>

                  {knowsTithi === 'gregorian' && (
                    <div className="p-3 bg-white rounded-lg border border-amber-200 text-xs space-y-2">
                      <label className="font-medium text-stone-700">
                        Date of passing:
                      </label>
                      <input
                        type="date"
                        value={gregorianDateOfPassing}
                        onChange={(e) => handleEstimate(e.target.value)}
                        className="w-full px-3 py-1.5 text-xs bg-stone-50 border border-stone-300 rounded-lg"
                      />
                      {conversionResult && (
                        <div className="p-2.5 bg-amber-50 rounded text-amber-950 space-y-1">
                          <div className="font-bold flex items-center gap-1 text-amber-800">
                            <Sparkles className="w-3.5 h-3.5" />
                            Estimated Tithi: {conversionResult.lunarMonth} {conversionResult.paksha} {conversionResult.tithi}
                          </div>
                          <div className="text-[11px] text-amber-900">
                            {conversionResult.verificationNote}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Month, Paksha, Tithi Pickers */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-stone-700">Lunar Month (मास)</label>
                  <select
                    value={lunarMonth}
                    onChange={(e) => setLunarMonth(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-white border border-stone-300 rounded-lg"
                  >
                    {LUNAR_MONTHS.map((m) => (
                      <option key={m.id} value={m.nameEn}>
                        {m.nameEn} ({m.nameMr})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-stone-700">Paksha (पक्ष)</label>
                  <select
                    value={paksha}
                    onChange={(e) => setPaksha(e.target.value as 'Shukla' | 'Krishna')}
                    className="w-full px-3 py-2 text-xs bg-white border border-stone-300 rounded-lg"
                  >
                    <option value="Krishna">Krishna Paksha (वद्य / Waning)</option>
                    <option value="Shukla">Shukla Paksha (शुद्ध / Waxing)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-stone-700">Tithi (तिथी)</label>
                  <select
                    value={tithi}
                    onChange={(e) => setTithi(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-white border border-stone-300 rounded-lg"
                  >
                    {TITHI_NAMES.map((t) => (
                      <option key={t.id} value={t.nameEn.split(' ')[0]}>
                        {t.nameEn} ({t.nameMr})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Mahalaya Pitru Paksha rule for Shraddha */}
              {occasionType === 'shraddha' && (
                <div className="space-y-1 pt-2">
                  <label className="text-xs font-medium text-stone-700">
                    Mahalaya (Pitru Paksha) Practice (पितृपक्ष महालय पद्धती)
                  </label>
                  <select
                    value={mahalayaPractice}
                    onChange={(e) => setMahalayaPractice(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs bg-white border border-stone-300 rounded-lg"
                  >
                    <option value="same_tithi">Same Tithi in Pitru Paksha (Recommended)</option>
                    <option value="sarvapitri_amavasya">Sarvapitri Amavasya (सर्वपित्री अमावास्या)</option>
                    <option value="custom">Other family custom / consultation needed</option>
                  </select>
                  <p className="text-[11px] text-stone-500">
                    Mahalaya shraddha is stored distinctly from the annual death tithi (PDF Page 8 & 17).
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Festival Selection */}
          {occasionType === 'festival' && (
            <div className="space-y-2 p-4 rounded-xl bg-stone-50 border border-stone-200">
              <label className="text-xs font-medium text-stone-700">
                Choose Reviewed Festival
              </label>
              <select
                value={selectedFestivalKey}
                onChange={(e) => setSelectedFestivalKey(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-white border border-stone-300 rounded-lg"
              >
                {AVAILABLE_FESTIVALS.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.nameEn} ({f.nameMr}) — Month: {f.defaultMonth}
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-stone-500">
                KulLoop guardrail: Festivals are added strictly by family choice. We never send festival spam.
              </p>
            </div>
          )}

          {/* Vrat Selection */}
          {occasionType === 'vrat_kuldevta' && (
            <div className="space-y-2 p-4 rounded-xl bg-stone-50 border border-stone-200">
              <label className="text-xs font-medium text-stone-700">
                Choose Vrat or Kuldevta Observance
              </label>
              <select
                value={selectedVratKey}
                onChange={(e) => setSelectedVratKey(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-white border border-stone-300 rounded-lg"
              >
                {AVAILABLE_VRATS.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.nameEn} ({v.nameMr})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Calendar Date for Birthdays / Milestones */}
          {recurrenceType === 'gregorian' && (
            <div className="space-y-1 p-4 rounded-xl bg-stone-50 border border-stone-200">
              <label className="text-xs font-medium text-stone-700">
                Date (Day & Month)
              </label>
              <input
                type="date"
                value={gregDate}
                onChange={(e) => setGregDate(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-white border border-stone-300 rounded-lg"
              />
            </div>
          )}

          {/* Confirmation & Validation Source Note */}
          <div className="space-y-3 p-4 rounded-xl bg-stone-50 border border-stone-200">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="confirmedCheckbox"
                checked={isConfirmed}
                onChange={(e) => setIsConfirmed(e.target.checked)}
                className="rounded text-amber-600 focus:ring-amber-500"
              />
              <label htmlFor="confirmedCheckbox" className="text-xs font-medium text-stone-800">
                This date has been confirmed with family elder, priest, or printed almanac
              </label>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-stone-700">
                Who confirmed / Validation source:
              </label>
              <input
                type="text"
                value={confirmedSource}
                onChange={(e) => setConfirmedSource(e.target.value)}
                placeholder="e.g. Aaji, Family Priest Pt. Joshi, Datar Panchang"
                className="w-full px-3 py-1.5 text-xs bg-white border border-stone-300 rounded-lg"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-stone-700">
                Family Practice Notes (optional):
              </label>
              <input
                type="text"
                value={practiceNotes}
                onChange={(e) => setPracticeNotes(e.target.value)}
                placeholder="e.g. Prepared at home before noon; cow grass offering; puran poli"
                className="w-full px-3 py-1.5 text-xs bg-white border border-stone-300 rounded-lg"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-stone-700 flex items-center justify-between">
                <span>First Established / Recorded Year (optional):</span>
                <span className="text-[10px] text-amber-700 font-semibold">Heritage Milestone</span>
              </label>
              <input
                type="number"
                min="1900"
                max="2030"
                value={establishedYear}
                onChange={(e) => setEstablishedYear(e.target.value)}
                placeholder="e.g. 1988 (to compute continuous years of tradition)"
                className="w-full px-3 py-1.5 text-xs bg-white border border-stone-300 rounded-lg"
              />
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-stone-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-stone-600 hover:text-stone-800 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-semibold text-stone-900 bg-amber-400 hover:bg-amber-300 rounded-lg transition-colors shadow-sm"
            >
              Save Occasion to Family Loop
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
