import React, { useState, useEffect, useMemo } from 'react';
import { FamilyOccasion, Family, Member, OccasionType } from '../types';
import { quickPerformedBySuggestions } from '../utils/occasionSearchSuggestions';
import { 
  X, 
  Check, 
  CheckCircle2, 
  Edit3, 
  Camera, 
  Upload, 
  Image as ImageIcon, 
  Calendar, 
  Clock, 
  Sparkles, 
  Smartphone, 
  FileText, 
  Trash2, 
  History, 
  User, 
  Save, 
  Undo2,
  CalendarDays,
  ExternalLink,
  Plus
} from 'lucide-react';

export type SlideOverTab = 'edit' | 'performed' | 'photos';

interface OccasionSlideOverProps {
  isOpen: boolean;
  onClose: () => void;
  occasion: FamilyOccasion | null;
  family: Family;
  members?: Member[];
  initialTab?: SlideOverTab;
  onUpdateOccasion: (id: string, updates: Partial<FamilyOccasion>) => void;
  onTogglePerformed: (id: string, notes?: string, performedBy?: string) => void;
  onAddMemoryPhoto?: (occasionId: string, photo: { id: string; url: string; caption?: string; year?: number; uploadedAt: string }) => void;
  onDeleteMemoryPhoto?: (occasionId: string, photoId: string) => void;
  onPreviewWhatsApp?: (occ: FamilyOccasion) => void;
  onGeneratePriestNote?: (occ: FamilyOccasion) => void;
}

export const OccasionSlideOver: React.FC<OccasionSlideOverProps> = ({
  isOpen,
  onClose,
  occasion,
  family,
  members = [],
  initialTab = 'edit',
  onUpdateOccasion,
  onTogglePerformed,
  onAddMemoryPhoto,
  onDeleteMemoryPhoto,
  onPreviewWhatsApp,
  onGeneratePriestNote,
}) => {
  const [activeTab, setActiveTab] = useState<SlideOverTab>(initialTab);

  // Edit Tab State
  const [title, setTitle] = useState('');
  const [occasionType, setOccasionType] = useState<OccasionType>('shraddha');
  const [practiceNotes, setPracticeNotes] = useState('');
  const [heritageNotes, setHeritageNotes] = useState('');
  const [establishedYear, setEstablishedYear] = useState<number | undefined>(undefined);
  const [gregorianDateStr, setGregorianDateStr] = useState('');
  const [lunarMonth, setLunarMonth] = useState('');
  const [lunarMonthDevanagari, setLunarMonthDevanagari] = useState('');
  const [paksha, setPaksha] = useState<'Shukla' | 'Krishna'>('Krishna');
  const [tithi, setTithi] = useState('');
  const [tithiDevanagari, setTithiDevanagari] = useState('');
  const [editSuccessMessage, setEditSuccessMessage] = useState<string | null>(null);

  // Performed Tab State
  const [isPerformedLocal, setIsPerformedLocal] = useState(false);
  const [performedByInput, setPerformedByInput] = useState('');
  const [performedNotesInput, setPerformedNotesInput] = useState('');
  const [performedAtInput, setPerformedAtInput] = useState('');
  const [performedSuccessMessage, setPerformedSuccessMessage] = useState<string | null>(null);

  // Photo Tab State
  const [photoUrlInput, setPhotoUrlInput] = useState('');
  const [photoCaptionInput, setPhotoCaptionInput] = useState('');

  const performedByQuickFill = useMemo(
    () => quickPerformedBySuggestions(members, family.configuratorName),
    [members, family.configuratorName]
  );
  const [photoYearInput, setPhotoYearInput] = useState<number>(new Date().getFullYear());
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [selectedViewingPhoto, setSelectedViewingPhoto] = useState<string | null>(null);
  const [photoSuccessMessage, setPhotoSuccessMessage] = useState<string | null>(null);

  // Sync internal state when occasion or initialTab changes
  useEffect(() => {
    if (occasion) {
      setTitle(occasion.title || '');
      setOccasionType(occasion.occasionType || 'shraddha');
      setPracticeNotes(occasion.practiceNotes || '');
      setHeritageNotes(occasion.heritageNotes || '');
      setEstablishedYear(occasion.establishedYear || occasion.gregorianFields?.originalYear);
      setGregorianDateStr(occasion.occurrence2027?.gregorianDateStr || '');

      if (occasion.tithiFields) {
        setLunarMonth(occasion.tithiFields.lunarMonth || '');
        setLunarMonthDevanagari(occasion.tithiFields.lunarMonthDevanagari || '');
        setPaksha(occasion.tithiFields.paksha || 'Krishna');
        setTithi(occasion.tithiFields.tithi || '');
        setTithiDevanagari(occasion.tithiFields.tithiDevanagari || '');
      }

      setIsPerformedLocal(Boolean(occasion.isPerformed));
      setPerformedByInput(occasion.performedBy || family.configuratorName || '');
      setPerformedNotesInput(occasion.performedNotes || '');
      setPerformedAtInput(
        occasion.performedAt || 
        new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
      );

      setPhotoUrlInput('');
      setPhotoCaptionInput('');
      setPhotoPreview(null);
      setEditSuccessMessage(null);
      setPerformedSuccessMessage(null);
      setPhotoSuccessMessage(null);
    }
  }, [occasion, family]);

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !occasion) return null;

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!occasion) return;

    const updates: Partial<FamilyOccasion> = {
      title,
      occasionType,
      practiceNotes,
      heritageNotes,
      establishedYear: establishedYear ? Number(establishedYear) : undefined,
    };

    if (gregorianDateStr) {
      updates.occurrence2027 = {
        ...occasion.occurrence2027,
        gregorianDateStr,
      };
    }

    if (occasion.tithiFields || lunarMonth || tithi) {
      updates.tithiFields = {
        lunarMonth: lunarMonth || occasion.tithiFields?.lunarMonth || '',
        lunarMonthDevanagari: lunarMonthDevanagari || occasion.tithiFields?.lunarMonthDevanagari || '',
        paksha: paksha || occasion.tithiFields?.paksha || 'Krishna',
        tithi: tithi || occasion.tithiFields?.tithi || '',
        tithiDevanagari: tithiDevanagari || occasion.tithiFields?.tithiDevanagari || '',
      };
    }

    onUpdateOccasion(occasion.id, updates);
    setEditSuccessMessage('Occasion details saved successfully!');
    setTimeout(() => setEditSuccessMessage(null), 3000);
  };

  const handleTogglePerformedSubmit = () => {
    if (!occasion) return;
    const nextState = !isPerformedLocal;
    setIsPerformedLocal(nextState);

    onTogglePerformed(
      occasion.id,
      nextState ? (performedNotesInput || undefined) : undefined,
      nextState ? (performedByInput || family.configuratorName) : undefined
    );

    setPerformedSuccessMessage(
      nextState
        ? 'Ritual marked as completed & recorded!'
        : 'Ritual status marked as pending.'
    );
    setTimeout(() => setPerformedSuccessMessage(null), 3000);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          setPhotoPreview(reader.result);
          setPhotoUrlInput(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddPhotoSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalUrl = photoPreview || photoUrlInput.trim();
    if (!finalUrl || !onAddMemoryPhoto) return;

    onAddMemoryPhoto(occasion.id, {
      id: `photo_${Date.now()}`,
      url: finalUrl,
      caption: photoCaptionInput.trim() || undefined,
      year: Number(photoYearInput) || new Date().getFullYear(),
      uploadedAt: new Date().toISOString(),
    });

    setPhotoUrlInput('');
    setPhotoCaptionInput('');
    setPhotoPreview(null);
    setPhotoSuccessMessage('Sacred memory photo added successfully!');
    setTimeout(() => setPhotoSuccessMessage(null), 3000);
  };

  const isShraddha = occasion.occasionType === 'shraddha' || occasion.occasionType === 'mahalaya';
  const memoryPhotos = occasion.memoryPhotos || [];

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-stone-900/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200">
      <div 
        className="absolute inset-0" 
        onClick={onClose} 
        aria-hidden="true" 
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <aside
          role="dialog"
          aria-modal="true"
          aria-label={`Quick actions for ${occasion.title}`}
          className="w-screen max-w-lg bg-stone-50 border-l border-stone-200 shadow-2xl flex flex-col justify-between overflow-hidden animate-in slide-in-from-right duration-300"
        >
          {/* Slide-Over Header */}
          <div className="bg-white px-5 py-4 border-b border-stone-200 shrink-0">
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-200/70">
                    {occasion.occasionType.replace('_', ' ')}
                  </span>
                  {occasion.isPerformed ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200/80 px-2 py-0.5 rounded">
                      <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" />
                      Observed
                    </span>
                  ) : (
                    <span className="text-[10px] text-stone-500 font-medium">
                      Scheduled for 2027
                    </span>
                  )}
                </div>

                <h2 className="text-lg font-bold text-stone-900 font-serif-display leading-tight">
                  {occasion.title}
                </h2>

                {occasion.myDharoharGuideUrl && (
                  <a
                    href={occasion.myDharoharGuideUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11px] font-semibold text-amber-800 hover:underline inline-block"
                  >
                    Optional prep guide (partner) →
                  </a>
                )}
                <p className="text-xs text-stone-500 flex items-center gap-2">
                  <span>{occasion.occurrence2027?.formattedDisplay} ({occasion.occurrence2027?.weekday})</span>
                  {occasion.tithiFields && (
                    <>
                      <span aria-hidden="true" className="text-stone-300">·</span>
                      <span className="font-devanagari text-stone-700">
                        {occasion.tithiFields.lunarMonthDevanagari || occasion.tithiFields.lunarMonth} {occasion.tithiFields.tithiDevanagari || occasion.tithiFields.tithi}
                      </span>
                    </>
                  )}
                </p>
              </div>

              <button
                onClick={onClose}
                aria-label="Close slide-over"
                className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Slide-over Action Tabs */}
            <div className="flex items-center gap-1 mt-4 p-1 bg-stone-100 rounded-lg border border-stone-200">
              <button
                type="button"
                onClick={() => setActiveTab('edit')}
                className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                  activeTab === 'edit'
                    ? 'bg-white text-stone-900 shadow-2xs font-bold'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                <Edit3 className="w-3.5 h-3.5 text-amber-700" />
                <span>Edit Occasion</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('performed')}
                className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                  activeTab === 'performed'
                    ? 'bg-white text-stone-900 shadow-2xs font-bold'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                <CheckCircle2 className={`w-3.5 h-3.5 ${isPerformedLocal ? 'text-emerald-600' : 'text-stone-500'}`} />
                <span>Mark Performed</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('photos')}
                className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                  activeTab === 'photos'
                    ? 'bg-white text-stone-900 shadow-2xs font-bold'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                <Camera className="w-3.5 h-3.5 text-amber-600" />
                <span>Photos ({memoryPhotos.length})</span>
              </button>
            </div>
          </div>

          {/* Slide-Over Body (Scrollable) */}
          <div className="flex-1 overflow-y-auto p-5 space-y-5">
            {/* TAB 1: EDIT OCCASION */}
            {activeTab === 'edit' && (
              <form onSubmit={handleSaveEdit} className="space-y-4">
                {editSuccessMessage && (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-xs font-medium flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{editSuccessMessage}</span>
                  </div>
                )}

                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-stone-700">
                    Occasion / Ritual Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Grandfather's annual shraddha / Diwali Lakshmi puja"
                    className="w-full px-3 py-2 text-xs bg-white border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 text-stone-900 font-medium"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-stone-700">
                      Category
                    </label>
                    <select
                      value={occasionType}
                      onChange={(e) => setOccasionType(e.target.value as OccasionType)}
                      className="w-full px-2.5 py-2 text-xs bg-white border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 text-stone-900"
                    >
                      <option value="shraddha">Shraddha (पूर्वज श्राद्ध)</option>
                      <option value="birthday">Birthday (तृतीया वाढदिवस)</option>
                      <option value="anniversary">Anniversary (विवाह दिन)</option>
                      <option value="vrat_kuldevta">Vrat / Kuldevta (कुलदैवत)</option>
                      <option value="festival">Festival (सण उत्सव)</option>
                      <option value="milestone">Milestone (समारंभ)</option>
                      <option value="custom">Custom Tradition (विशेष परंपरा)</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-stone-700">
                      Computed Date (2027)
                    </label>
                    <input
                      type="date"
                      value={gregorianDateStr}
                      onChange={(e) => setGregorianDateStr(e.target.value)}
                      className="w-full px-2.5 py-2 text-xs bg-white border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 text-stone-900"
                    />
                  </div>
                </div>

                {/* Tithi Details Group */}
                <div className="p-3 bg-stone-100/70 border border-stone-200 rounded-lg space-y-3">
                  <span className="text-[11px] font-bold text-stone-800 uppercase tracking-wider block">
                    Panchang & Tithi Specification
                  </span>

                  <div className="grid grid-cols-2 gap-2.5">
                    <div className="space-y-1">
                      <label className="block text-[11px] font-medium text-stone-600">
                        Lunar Month (English)
                      </label>
                      <input
                        type="text"
                        value={lunarMonth}
                        onChange={(e) => setLunarMonth(e.target.value)}
                        placeholder="e.g. Magha / Ashvina"
                        className="w-full px-2.5 py-1.5 text-xs bg-white border border-stone-300 rounded-md text-stone-800"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="block text-[11px] font-medium text-stone-600">
                        महिना (देवनागरी)
                      </label>
                      <input
                        type="text"
                        value={lunarMonthDevanagari}
                        onChange={(e) => setLunarMonthDevanagari(e.target.value)}
                        placeholder="उदा. माघ / कार्तिक"
                        className="w-full px-2.5 py-1.5 text-xs bg-white border border-stone-300 rounded-md text-stone-800 font-devanagari"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="block text-[11px] font-medium text-stone-600">
                        Paksha
                      </label>
                      <select
                        value={paksha}
                        onChange={(e) => setPaksha(e.target.value as 'Shukla' | 'Krishna')}
                        className="w-full px-2.5 py-1.5 text-xs bg-white border border-stone-300 rounded-md text-stone-800"
                      >
                        <option value="Krishna">Krishna (वद्य / Dark Fortnight)</option>
                        <option value="Shukla">Shukla (शुद्ध / Bright Fortnight)</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="block text-[11px] font-medium text-stone-600">
                        तिथी (देवनागरी किंवा इंग्रजी)
                      </label>
                      <input
                        type="text"
                        value={tithiDevanagari || tithi}
                        onChange={(e) => {
                          setTithiDevanagari(e.target.value);
                          setTithi(e.target.value);
                        }}
                        placeholder="उदा. सप्तमी / एकादशी / अमावास्या"
                        className="w-full px-2.5 py-1.5 text-xs bg-white border border-stone-300 rounded-md text-stone-800 font-devanagari"
                      />
                    </div>
                  </div>
                </div>

                {/* Practice & Family Notes */}
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-stone-700">
                    Family Ritual Custom & Practice Notes
                  </label>
                  <textarea
                    rows={3}
                    value={practiceNotes}
                    onChange={(e) => setPracticeNotes(e.target.value)}
                    placeholder="e.g. Prepare traditional Modak and invite 2 Brahmins at 11:30 AM. Strictly no onion or garlic on this day."
                    className="w-full px-3 py-2 text-xs bg-white border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 text-stone-900 leading-relaxed"
                  />
                  <p className="text-[10px] text-stone-500">
                    These notes automatically inform WhatsApp reminder messages sent to family members.
                  </p>
                </div>

                {/* Heritage Continuity Notes */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-stone-700">
                      Established Year
                    </label>
                    <input
                      type="number"
                      value={establishedYear || ''}
                      onChange={(e) => setEstablishedYear(e.target.value ? Number(e.target.value) : undefined)}
                      placeholder="e.g. 1988"
                      className="w-full px-2.5 py-2 text-xs bg-white border border-stone-300 rounded-lg text-stone-800"
                    />
                  </div>

                  <div className="col-span-2 space-y-1">
                    <label className="block text-xs font-semibold text-stone-700">
                      Ancestral Heritage Note
                    </label>
                    <input
                      type="text"
                      value={heritageNotes}
                      onChange={(e) => setHeritageNotes(e.target.value)}
                      placeholder="e.g. Started when the family moved to Pune in 1998"
                      className="w-full px-2.5 py-2 text-xs bg-white border border-stone-300 rounded-lg text-stone-800"
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    className="w-full py-2.5 px-4 bg-amber-700 hover:bg-amber-800 text-white font-semibold text-xs rounded-lg transition-colors cursor-pointer shadow-xs flex items-center justify-center gap-1.5"
                  >
                    <Save className="w-4 h-4" />
                    <span>Save Occasion Details (Direct to Record)</span>
                  </button>
                </div>
              </form>
            )}

            {/* TAB 2: MARK PERFORMED */}
            {activeTab === 'performed' && (
              <div className="space-y-5">
                {performedSuccessMessage && (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-xs font-medium flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{performedSuccessMessage}</span>
                  </div>
                )}

                {/* Status Toggle Card */}
                <div className={`p-4 rounded-xl border transition-all ${
                  isPerformedLocal 
                    ? 'bg-emerald-50/80 border-emerald-300 text-emerald-950' 
                    : 'bg-stone-100 border-stone-200 text-stone-800'
                }`}>
                  <div className="flex items-center justify-between gap-3">
                    <div className="space-y-0.5">
                      <div className="text-xs font-bold uppercase tracking-wider text-stone-600">
                        Observance Status
                      </div>
                      <div className="text-sm font-semibold flex items-center gap-1.5">
                        {isPerformedLocal ? (
                          <>
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                            <span>Observed & Complete for this Cycle</span>
                          </>
                        ) : (
                          <>
                            <Clock className="w-4 h-4 text-amber-600 shrink-0" />
                            <span>Pending / Upcoming for 2027</span>
                          </>
                        )}
                      </div>
                      <p className="text-[11px] text-stone-500">
                        {isPerformedLocal
                          ? 'This tithi has been fulfilled with sankalpa and offerings.'
                          : 'Marking performed records the timestamp and performer in your family archive.'}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={handleTogglePerformedSubmit}
                      className={`px-3 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer shadow-xs shrink-0 flex items-center gap-1.5 ${
                        isPerformedLocal
                          ? 'bg-stone-200 hover:bg-stone-300 text-stone-800'
                          : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                      }`}
                    >
                      {isPerformedLocal ? (
                        <>
                          <Undo2 className="w-3.5 h-3.5" />
                          <span>Undo / Reopen</span>
                        </>
                      ) : (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>Mark Performed</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Detail Form for Performance Record */}
                <div className="space-y-3 pt-1">
                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-stone-700">
                      Who Performed the Ritual? (Karta / Lead)
                    </label>
                    <input
                      type="text"
                      value={performedByInput}
                      onChange={(e) => setPerformedByInput(e.target.value)}
                      placeholder="e.g. Name of karta or family lead"
                      className="w-full px-3 py-2 text-xs bg-white border border-stone-300 rounded-lg text-stone-900"
                    />
                    <div className="flex items-center gap-1.5 pt-1">
                      <span className="text-[10px] text-stone-400">Quick fill:</span>
                      {performedByQuickFill.map((name) => (
                        <button
                          key={name}
                          type="button"
                          onClick={() => setPerformedByInput(name)}
                          className="text-[10px] px-2 py-0.5 rounded bg-stone-100 hover:bg-stone-200 text-stone-700 cursor-pointer"
                        >
                          {name}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-stone-700">
                      Recorded Date / Time
                    </label>
                    <input
                      type="text"
                      value={performedAtInput}
                      onChange={(e) => setPerformedAtInput(e.target.value)}
                      placeholder="e.g. 29 Oct 2026, 11:30 AM"
                      className="w-full px-3 py-2 text-xs bg-white border border-stone-300 rounded-lg text-stone-900"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-stone-700">
                      Ritual & Priest Notes (Sankalpa, Offerings, Dakshina)
                    </label>
                    <textarea
                      rows={3}
                      value={performedNotesInput}
                      onChange={(e) => setPerformedNotesInput(e.target.value)}
                      placeholder="e.g. Conducted with family pandit. Tarpan done. Annadana offered."
                      className="w-full px-3 py-2 text-xs bg-white border border-stone-300 rounded-lg text-stone-900 leading-relaxed"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      onTogglePerformed(occasion.id, performedNotesInput, performedByInput);
                      setIsPerformedLocal(true);
                      setPerformedSuccessMessage('Performance notes updated in family archive!');
                      setTimeout(() => setPerformedSuccessMessage(null), 3000);
                    }}
                    className="w-full py-2 px-3 bg-stone-900 hover:bg-stone-800 text-white font-semibold text-xs rounded-lg transition-colors cursor-pointer shadow-xs flex items-center justify-center gap-1.5"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>Save Ritual Performance Log</span>
                  </button>
                </div>
              </div>
            )}

            {/* TAB 3: PHOTOS & SACRED MEMORIES */}
            {activeTab === 'photos' && (
              <div className="space-y-5">
                {photoSuccessMessage && (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-xs font-medium flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{photoSuccessMessage}</span>
                  </div>
                )}

                {/* Add Photo Form */}
                <form onSubmit={handleAddPhotoSubmit} className="p-4 bg-white border border-stone-200 rounded-xl space-y-3 shadow-2xs">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-stone-900">
                    <Camera className="w-4 h-4 text-amber-600" />
                    <span>Attach New Darshan / Celebration Photo</span>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <label className="flex-1 border-2 border-dashed border-stone-300 hover:border-amber-500 rounded-lg p-3 text-center cursor-pointer transition-colors bg-stone-50 hover:bg-amber-50/40">
                        <Upload className="w-4 h-4 mx-auto text-stone-500 mb-1" />
                        <span className="text-[11px] font-medium text-stone-700 block">
                          Upload Image File
                        </span>
                        <span className="text-[10px] text-stone-400">
                          PNG, JPG, WebP from phone or computer
                        </span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleFileChange}
                          className="hidden"
                        />
                      </label>
                    </div>

                    <div className="space-y-1">
                      <span className="text-[10px] font-medium text-stone-500">Or Paste Image URL</span>
                      <input
                        type="url"
                        value={photoUrlInput}
                        onChange={(e) => {
                          setPhotoUrlInput(e.target.value);
                          setPhotoPreview(e.target.value);
                        }}
                        placeholder="https://images.unsplash.com/..."
                        className="w-full px-2.5 py-1.5 text-xs bg-stone-50 border border-stone-300 rounded-md text-stone-900"
                      />
                    </div>

                    {photoPreview && (
                      <div className="relative rounded-lg overflow-hidden border border-stone-200 h-32 bg-stone-100 flex items-center justify-center">
                        <img
                          src={photoPreview}
                          alt="Preview"
                          className="h-full w-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setPhotoPreview(null);
                            setPhotoUrlInput('');
                          }}
                          className="absolute top-1.5 right-1.5 p-1 bg-stone-900/80 hover:bg-stone-900 text-white rounded-full cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}

                    <div className="grid grid-cols-3 gap-2">
                      <div className="space-y-1">
                        <label className="block text-[11px] font-medium text-stone-700">Year</label>
                        <input
                          type="number"
                          value={photoYearInput}
                          onChange={(e) => setPhotoYearInput(Number(e.target.value))}
                          className="w-full px-2 py-1.5 text-xs bg-white border border-stone-300 rounded-md text-stone-800"
                        />
                      </div>

                      <div className="col-span-2 space-y-1">
                        <label className="block text-[11px] font-medium text-stone-700">Caption / Note</label>
                        <input
                          type="text"
                          value={photoCaptionInput}
                          onChange={(e) => setPhotoCaptionInput(e.target.value)}
                          placeholder="e.g. Diya lighting & Puran Poli bhog"
                          className="w-full px-2.5 py-1.5 text-xs bg-white border border-stone-300 rounded-md text-stone-800"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={!photoPreview && !photoUrlInput.trim()}
                      className="w-full py-2 bg-amber-700 hover:bg-amber-800 disabled:opacity-50 text-white font-semibold text-xs rounded-lg transition-colors cursor-pointer shadow-xs flex items-center justify-center gap-1.5"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Save to Memory Archive</span>
                    </button>
                  </div>
                </form>

                {/* Memory Gallery */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-stone-800">
                    <span>Archived Memories ({memoryPhotos.length})</span>
                    <span className="text-[10px] text-stone-500 font-normal">Click image to enlarge</span>
                  </div>

                  {memoryPhotos.length === 0 ? (
                    <div className="text-center py-8 px-4 rounded-xl border border-dashed border-stone-300 bg-stone-50/60">
                      <ImageIcon className="w-8 h-8 text-stone-300 mx-auto mb-2" />
                      <p className="text-xs font-semibold text-stone-700">No memory photos attached yet</p>
                      <p className="text-[11px] text-stone-500 max-w-xs mx-auto mt-0.5">
                        Upload puja photos, ancestor portraits, or family feast memories to keep this tradition alive for next generations.
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-2.5">
                      {memoryPhotos.map((photo) => (
                        <div
                          key={photo.id}
                          className="group relative rounded-lg overflow-hidden border border-stone-200 bg-stone-100 shadow-2xs aspect-4/3"
                        >
                          <img
                            src={photo.url}
                            alt={photo.caption || occasion.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 cursor-pointer"
                            onClick={() => setSelectedViewingPhoto(photo.url)}
                          />

                          <div className="absolute inset-0 bg-gradient-to-t from-stone-950/80 via-transparent to-transparent opacity-90 p-2 flex flex-col justify-between pointer-events-none">
                            <div className="flex justify-end pointer-events-auto">
                              {onDeleteMemoryPhoto && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (confirm('Delete this memory photo from archive?')) {
                                      onDeleteMemoryPhoto(occasion.id, photo.id);
                                    }
                                  }}
                                  className="p-1 bg-stone-900/80 hover:bg-rose-600 text-white rounded cursor-pointer transition-colors"
                                  title="Remove photo"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              )}
                            </div>

                            <div className="text-white pointer-events-auto">
                              <span className="text-[9px] font-bold uppercase tracking-wider text-amber-300 block">
                                Year {photo.year || '2026'}
                              </span>
                              {photo.caption && (
                                <p className="text-[11px] font-medium leading-tight line-clamp-2">
                                  {photo.caption}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Enlarged Photo Modal */}
                {selectedViewingPhoto && (
                  <div
                    className="fixed inset-0 z-60 bg-stone-950/90 flex items-center justify-center p-4"
                    onClick={() => setSelectedViewingPhoto(null)}
                  >
                    <div className="relative max-w-2xl max-h-[85vh] bg-stone-900 rounded-xl overflow-hidden p-2">
                      <button
                        onClick={() => setSelectedViewingPhoto(null)}
                        className="absolute top-4 right-4 p-1.5 bg-stone-800 text-white rounded-full hover:bg-stone-700 cursor-pointer z-10"
                      >
                        <X className="w-4 h-4" />
                      </button>
                      <img
                        src={selectedViewingPhoto}
                        alt="Enlarged"
                        className="max-h-[80vh] w-auto mx-auto object-contain rounded-lg"
                      />
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Slide-Over Footer: Quick External Actions */}
          <div className="p-4 bg-white border-t border-stone-200 shrink-0 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              {onPreviewWhatsApp && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onPreviewWhatsApp(occasion);
                  }}
                  className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-lg text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <Smartphone className="w-3.5 h-3.5 text-emerald-600" />
                  <span>WhatsApp Preview</span>
                </button>
              )}

              {isShraddha && onGeneratePriestNote && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onGeneratePriestNote(occasion);
                  }}
                  className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 rounded-lg text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <FileText className="w-3.5 h-3.5 text-amber-700" />
                  <span>Priest Note</span>
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 text-xs font-medium text-stone-600 hover:text-stone-900 hover:bg-stone-100 rounded-lg transition-colors cursor-pointer"
            >
              Done
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
};
