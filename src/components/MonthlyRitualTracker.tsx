import React, { useState } from 'react';
import { FamilyOccasion, Family } from '../types';
import { 
  CheckCircle2, 
  Circle, 
  Clock, 
  Check, 
  Undo2, 
  Camera, 
  Image as ImageIcon, 
  Plus, 
  X, 
  ZoomIn, 
  Trash2,
  Calendar,
  Sparkles
} from 'lucide-react';

interface MonthlyRitualTrackerProps {
  occasions: FamilyOccasion[];
  family: Family;
  onTogglePerformed: (id: string, notes?: string, performedBy?: string) => void;
  onPreviewWhatsApp: (occ: FamilyOccasion) => void;
  onGeneratePriestNote: (occ: FamilyOccasion) => void;
  onAddMemoryPhoto?: (occasionId: string, photo: { id: string; url: string; caption?: string; year?: number; uploadedAt: string }) => void;
  onDeleteMemoryPhoto?: (occasionId: string, photoId: string) => void;
}

export const MonthlyRitualTracker: React.FC<MonthlyRitualTrackerProps> = ({
  occasions,
  family,
  onTogglePerformed,
  onPreviewWhatsApp,
  onGeneratePriestNote,
  onAddMemoryPhoto,
  onDeleteMemoryPhoto,
}) => {
  // Available month cohorts to track
  const availableMonths = [
    { key: '2026-10', label: 'Current Month: October 2026 (अश्विन / Kartik)', shortLabel: 'October 2026' },
    { key: '2026-11', label: 'November 2026 (कार्तिक / Margashirsha)', shortLabel: 'November 2026' },
    { key: '2027-02', label: 'February 2027 (माघ Shraddha Season)', shortLabel: 'February 2027' },
    { key: '2027-03', label: 'March 2027 (फाल्गुन Vrats)', shortLabel: 'March 2027' },
  ];

  const [selectedMonthKey, setSelectedMonthKey] = useState<string>('2026-10');
  const [editingOccasionId, setEditingOccasionId] = useState<string | null>(null);
  const [performedByInput, setPerformedByInput] = useState('');
  const [notesInput, setNotesInput] = useState('');

  // Memory photo upload modal state
  const [activePhotoUploadOccasionId, setActivePhotoUploadOccasionId] = useState<string | null>(null);
  const [newPhotoURL, setNewPhotoURL] = useState('');
  const [newPhotoCaption, setNewPhotoCaption] = useState('');
  const [newPhotoYear, setNewPhotoYear] = useState<number>(2026);

  // Lightbox modal state
  const [lightboxPhoto, setLightboxPhoto] = useState<{ url: string; caption?: string; occasionTitle: string; year?: number } | null>(null);

  // Filter occasions matching the selected month
  const monthOccasions = occasions.filter((occ) => {
    const dStr = occ.occurrence2027.gregorianDateStr;
    return dStr.startsWith(selectedMonthKey);
  });

  const totalCount = monthOccasions.length;
  const performedCount = monthOccasions.filter((o) => o.isPerformed).length;
  const percentage = totalCount > 0 ? Math.round((performedCount / totalCount) * 100) : 0;

  const handleOpenEdit = (occ: FamilyOccasion) => {
    setEditingOccasionId(occ.id);
    setPerformedByInput(occ.performedBy || family.configuratorName);
    setNotesInput(occ.performedNotes || '');
  };

  const handleSavePerformance = (id: string) => {
    onTogglePerformed(id, notesInput, performedByInput);
    setEditingOccasionId(null);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          setNewPhotoURL(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAttachPhotoSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activePhotoUploadOccasionId || !newPhotoURL.trim()) return;

    if (onAddMemoryPhoto) {
      onAddMemoryPhoto(activePhotoUploadOccasionId, {
        id: `photo_${Date.now()}`,
        url: newPhotoURL.trim(),
        caption: newPhotoCaption.trim() || 'Family celebration memory',
        year: newPhotoYear,
        uploadedAt: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
      });
    }

    setActivePhotoUploadOccasionId(null);
    setNewPhotoURL('');
    setNewPhotoCaption('');
  };

  const activeMonthMeta = availableMonths.find((m) => m.key === selectedMonthKey) || availableMonths[0];

  return (
    <div className="bg-white rounded-2xl border border-stone-200/90 p-5 sm:p-7 shadow-sm space-y-6">
      {/* Tracker Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-100">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-amber-800 uppercase tracking-wider">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Family Ritual Progress & Memory Album</span>
          </div>
          <h3 className="text-lg sm:text-xl font-bold text-stone-900 font-serif-display mt-0.5">
            {activeMonthMeta.label}
          </h3>
          <p className="text-xs text-stone-500">
            Track performed rituals, shraddhas, and vrats with cherished photos from past family celebrations.
          </p>
        </div>

        {/* Month Selector dropdown */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <label htmlFor="monthSelector" className="text-xs text-stone-500 font-medium whitespace-nowrap">
            Month:
          </label>
          <select
            id="monthSelector"
            value={selectedMonthKey}
            onChange={(e) => setSelectedMonthKey(e.target.value)}
            className="text-xs bg-stone-50 border border-stone-300 rounded-lg px-3 py-1.5 font-medium text-stone-800 focus:outline-none focus:ring-1 focus:ring-amber-500 cursor-pointer"
          >
            {availableMonths.map((m) => (
              <option key={m.key} value={m.key}>
                {m.shortLabel}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Progress Metric Strip */}
      <div className="p-4 rounded-xl bg-stone-50 border border-stone-200/80 space-y-3">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className="font-bold text-stone-900 text-sm">
              {performedCount} of {totalCount} Rituals Performed
            </span>
            <span className="text-stone-400">·</span>
            <span className="text-stone-600">
              {totalCount - performedCount} pending this month
            </span>
          </div>
          <span className="font-mono font-bold text-stone-900 text-sm">
            {percentage}%
          </span>
        </div>

        {/* Progress bar */}
        <div className="w-full bg-stone-200 rounded-full h-2.5 overflow-hidden">
          <div
            className="bg-amber-500 h-2.5 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${percentage}%` }}
          />
        </div>

        <div className="flex items-center justify-between text-[11px] text-stone-500 pt-0.5">
          <span>Observed with reverence · Pune local sunrise</span>
          {percentage === 100 ? (
            <span className="text-emerald-700 font-semibold flex items-center gap-1">
              <Check className="w-3.5 h-3.5" />
              All monthly family rituals completed!
            </span>
          ) : (
            <span>Preserving sacred family memory without stress</span>
          )}
        </div>
      </div>

      {/* Rituals List */}
      <div className="space-y-4">
        {monthOccasions.length === 0 ? (
          <div className="text-center py-8 text-xs text-stone-500 bg-stone-50 rounded-xl border border-dashed border-stone-200">
            No family rituals scheduled for {activeMonthMeta.shortLabel}. Select another month or add a new occasion.
          </div>
        ) : (
          monthOccasions.map((occ) => {
            const isShraddha = occ.occasionType === 'shraddha' || occ.occasionType === 'mahalaya';
            const isEditing = editingOccasionId === occ.id;
            const photos = occ.memoryPhotos || [];

            return (
              <div
                key={occ.id}
                className={`p-4 sm:p-5 rounded-2xl border transition-all ${
                  occ.isPerformed
                    ? 'bg-emerald-50/30 border-emerald-200/80'
                    : 'bg-white border-stone-200 hover:border-amber-300'
                }`}
              >
                {/* Ritual Header Info & Action */}
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <span className="font-bold text-stone-700 uppercase tracking-wider text-[10px]">
                        {occ.occasionType.replace('_', ' ')}
                      </span>
                      <span aria-hidden="true" className="text-stone-300">·</span>
                      <span className="text-stone-500 font-mono">
                        {occ.occurrence2027.formattedDisplay} ({occ.occurrence2027.weekday})
                      </span>
                      <span aria-hidden="true" className="text-stone-300">·</span>

                      {/* Status Badge */}
                      {occ.isPerformed ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-md">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                          <span>Performed</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-800 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                          <Circle className="w-3 h-3 text-amber-600" />
                          <span>Scheduled</span>
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-stone-900 text-base leading-snug">
                        {occ.title}
                      </h4>
                    </div>

                    {occ.tithiFields && (
                      <p className="text-xs text-stone-600 font-devanagari">
                        तिथी: {occ.tithiFields.lunarMonthDevanagari || occ.tithiFields.lunarMonth} {occ.tithiFields.pakshaDevanagari || occ.tithiFields.paksha} {occ.tithiFields.tithiDevanagari || occ.tithiFields.tithi} · {occ.occurrence2027.tithiSpan}
                      </p>
                    )}

                    {/* Performed details log */}
                    {occ.isPerformed && occ.performedAt && (
                      <div className="text-[11px] text-emerald-950 bg-white/80 p-2.5 rounded-xl border border-emerald-200/60 mt-1.5 space-y-0.5">
                        <div className="flex items-center gap-1.5 font-medium text-emerald-900">
                          <Clock className="w-3 h-3 text-emerald-700" />
                          <span>Recorded on {occ.performedAt}</span>
                          {occ.performedBy && <span>· Performed by {occ.performedBy}</span>}
                        </div>
                        {occ.performedNotes && (
                          <div className="text-stone-700 italic">
                            "{occ.performedNotes}"
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Right Actions */}
                  <div className="flex items-center gap-2 shrink-0 self-start sm:self-auto">
                    {occ.isPerformed ? (
                      <button
                        onClick={() => onTogglePerformed(occ.id)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-stone-600 hover:text-stone-900 bg-stone-100 hover:bg-stone-200 rounded-lg transition-colors cursor-pointer"
                        title="Mark as pending"
                      >
                        <Undo2 className="w-3.5 h-3.5" />
                        <span>Undo</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => handleOpenEdit(occ)}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-stone-900 bg-amber-400 hover:bg-amber-300 rounded-lg transition-colors shadow-2xs cursor-pointer"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Mark as Performed</span>
                      </button>
                    )}

                    {isShraddha && (
                      <button
                        onClick={() => onGeneratePriestNote(occ)}
                        className="px-2.5 py-1.5 text-xs font-medium text-amber-900 bg-amber-100 hover:bg-amber-200 rounded-lg transition-colors cursor-pointer"
                        title="Priest-ready note"
                      >
                        Priest Note
                      </button>
                    )}

                    <button
                      onClick={() => onPreviewWhatsApp(occ)}
                      className="px-2.5 py-1.5 text-xs font-medium text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-lg transition-colors cursor-pointer"
                      title="WhatsApp view"
                    >
                      WhatsApp
                    </button>
                  </div>
                </div>

                {/* Inline modal / form when marking as performed */}
                {isEditing && (
                  <div className="mt-4 pt-3 border-t border-stone-200 space-y-3 bg-stone-50/90 p-3.5 rounded-xl">
                    <div className="text-xs font-semibold text-stone-800">
                      Record Ritual Performance Details (संकल्प व विधी संपन्न नोंद)
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[11px] font-medium text-stone-600">
                          Performed By / Family Members Present
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. Aaji & Bhushan, Whole Family"
                          value={performedByInput}
                          onChange={(e) => setPerformedByInput(e.target.value)}
                          className="w-full px-2.5 py-1.5 text-xs bg-white border border-stone-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[11px] font-medium text-stone-600">
                          Notes / Naivedya / Offerings
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. Gau-grasa given, Vishnu puja completed, Prasad distributed"
                          value={notesInput}
                          onChange={(e) => setNotesInput(e.target.value)}
                          className="w-full px-2.5 py-1.5 text-xs bg-white border border-stone-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500"
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setEditingOccasionId(null)}
                        className="px-3 py-1 text-xs text-stone-600 hover:text-stone-800 cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSavePerformance(occ.id)}
                        className="px-3.5 py-1.5 text-xs font-semibold text-stone-900 bg-amber-400 hover:bg-amber-300 rounded-lg shadow-2xs cursor-pointer"
                      >
                        Confirm Ritual Performed
                      </button>
                    </div>
                  </div>
                )}

                {/* MEMORY SLOT / PHOTO GALLERY FOR THIS RITUAL */}
                <div className="mt-4 pt-3.5 border-t border-stone-200/80">
                  <div className="flex items-center justify-between mb-2.5">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-stone-800">
                      <Camera className="w-3.5 h-3.5 text-amber-700" />
                      <span>Memory Slot & Celebration Photos</span>
                      {photos.length > 0 && (
                        <span className="text-[10px] font-bold text-stone-500 font-mono">
                          ({photos.length})
                        </span>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setActivePhotoUploadOccasionId(occ.id);
                        setNewPhotoCaption('');
                        setNewPhotoURL('');
                      }}
                      className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-800 hover:text-amber-950 bg-amber-50 hover:bg-amber-100 border border-amber-200/70 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Attach Photo</span>
                    </button>
                  </div>

                  {photos.length === 0 ? (
                    <div className="py-3 px-4 bg-stone-50/70 rounded-xl border border-dashed border-stone-200 text-center">
                      <p className="text-[11px] text-stone-500">
                        No celebration photos attached yet. Save family moments from this year or past celebrations.
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {photos.map((photo) => (
                        <div
                          key={photo.id}
                          className="group relative bg-stone-900 rounded-xl overflow-hidden border border-stone-200 shadow-2xs aspect-4/3 cursor-pointer"
                          onClick={() =>
                            setLightboxPhoto({
                              url: photo.url,
                              caption: photo.caption,
                              occasionTitle: occ.title,
                              year: photo.year,
                            })
                          }
                        >
                          <img
                            src={photo.url}
                            alt={photo.caption || occ.title}
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-80 group-hover:opacity-95 transition-opacity" />

                          {/* Hover Zoom Icon */}
                          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-black/60 p-1 rounded-full text-white">
                            <ZoomIn className="w-3 h-3" />
                          </div>

                          {/* Delete Button on Hover */}
                          {onDeleteMemoryPhoto && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onDeleteMemoryPhoto(occ.id, photo.id);
                              }}
                              className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity bg-rose-600/90 hover:bg-rose-700 text-white p-1 rounded-full cursor-pointer shadow-xs"
                              title="Remove photo"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          )}

                          {/* Caption Badge */}
                          <div className="absolute bottom-1.5 left-2 right-2 text-white">
                            {photo.year && (
                              <span className="text-[9px] font-bold text-amber-300 uppercase tracking-wider block">
                                {photo.year}
                              </span>
                            )}
                            <p className="text-[10px] font-medium leading-tight truncate text-stone-200">
                              {photo.caption || 'Celebration Memory'}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* PHOTO ATTACH MODAL */}
      {activePhotoUploadOccasionId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/70 backdrop-blur-sm">
          <div className="bg-white rounded-2xl border border-stone-200 shadow-2xl max-w-md w-full p-6 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-stone-200">
              <div className="flex items-center gap-2">
                <Camera className="w-4 h-4 text-amber-700" />
                <h4 className="text-sm font-bold text-stone-900">
                  Attach Celebration Photo to Memory Slot
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setActivePhotoUploadOccasionId(null)}
                className="p-1 text-stone-400 hover:text-stone-700 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAttachPhotoSubmit} className="space-y-4">
              {/* Preview if uploaded */}
              {newPhotoURL ? (
                <div className="relative h-40 rounded-xl overflow-hidden border border-stone-200 bg-stone-100">
                  <img
                    src={newPhotoURL}
                    alt="Celebration preview"
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => setNewPhotoURL('')}
                    className="absolute top-2 right-2 bg-black/70 hover:bg-black text-white p-1 rounded-full text-xs"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <label className="text-xs font-medium text-stone-700 block">
                    Upload Photo from Device
                  </label>
                  <label className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-stone-300 hover:border-amber-400 rounded-xl bg-stone-50 cursor-pointer transition-colors">
                    <ImageIcon className="w-8 h-8 text-stone-400 mb-1" />
                    <span className="text-xs font-semibold text-stone-700">Click to upload celebration photo</span>
                    <span className="text-[10px] text-stone-400 mt-0.5">JPG, PNG, WebP supported</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>

                  <div className="text-center text-[11px] text-stone-400">or pick a sample ceremony image:</div>
                  <div className="flex items-center justify-center gap-2">
                    <button
                      type="button"
                      onClick={() => setNewPhotoURL('/src/assets/images/kulloop_almanac_art_1793303629720.jpg')}
                      className="text-[10px] font-medium text-stone-700 bg-stone-100 hover:bg-stone-200 px-2.5 py-1 rounded-md border border-stone-200 cursor-pointer"
                    >
                      Diya & Marigolds
                    </button>
                    <button
                      type="button"
                      onClick={() => setNewPhotoURL('/src/assets/images/kulloop_hero_family_1793303629503.jpg')}
                      className="text-[10px] font-medium text-stone-700 bg-stone-100 hover:bg-stone-200 px-2.5 py-1 rounded-md border border-stone-200 cursor-pointer"
                    >
                      Family Gathering
                    </button>
                    <button
                      type="button"
                      onClick={() => setNewPhotoURL('/src/assets/images/kulloop_avatar_elder_1793303629841.jpg')}
                      className="text-[10px] font-medium text-stone-700 bg-stone-100 hover:bg-stone-200 px-2.5 py-1 rounded-md border border-stone-200 cursor-pointer"
                    >
                      Aaji’s Blessings
                    </button>
                  </div>
                </div>
              )}

              {/* Caption */}
              <div className="space-y-1">
                <label className="text-xs font-medium text-stone-700">
                  Caption / Ceremony Note
                </label>
                <input
                  type="text"
                  placeholder="e.g. Aaji lighting the samai deep during evening puja"
                  value={newPhotoCaption}
                  onChange={(e) => setNewPhotoCaption(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-stone-50 border border-stone-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>

              {/* Year */}
              <div className="space-y-1">
                <label className="text-xs font-medium text-stone-700">
                  Celebration Year
                </label>
                <select
                  value={newPhotoYear}
                  onChange={(e) => setNewPhotoYear(Number(e.target.value))}
                  className="w-full px-3 py-1.5 text-xs bg-stone-50 border border-stone-300 rounded-lg focus:outline-none"
                >
                  <option value={2026}>2026 (Current Year)</option>
                  <option value={2025}>2025</option>
                  <option value={2024}>2024</option>
                  <option value={2023}>2023</option>
                  <option value={2020}>2020</option>
                  <option value={1998}>1998</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-200">
                <button
                  type="button"
                  onClick={() => setActivePhotoUploadOccasionId(null)}
                  className="px-3 py-1.5 text-xs text-stone-600 hover:text-stone-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!newPhotoURL.trim()}
                  className="px-4 py-1.5 text-xs font-semibold text-stone-900 bg-amber-400 hover:bg-amber-300 rounded-lg transition-colors cursor-pointer shadow-2xs disabled:opacity-40"
                >
                  Save Photo to Memory Slot
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* LIGHTBOX MODAL */}
      {lightboxPhoto && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/85 backdrop-blur-sm cursor-pointer"
          onClick={() => setLightboxPhoto(null)}
        >
          <div
            className="relative max-w-2xl w-full bg-stone-900 rounded-2xl overflow-hidden border border-stone-700 shadow-2xl cursor-default"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative aspect-16/10 bg-black">
              <img
                src={lightboxPhoto.url}
                alt={lightboxPhoto.caption || 'Celebration Memory'}
                className="w-full h-full object-contain"
              />
            </div>

            <div className="p-4 bg-stone-900 text-white flex items-center justify-between">
              <div>
                <div className="text-[11px] text-amber-300 font-semibold uppercase tracking-wider">
                  {lightboxPhoto.occasionTitle} {lightboxPhoto.year && `· ${lightboxPhoto.year}`}
                </div>
                <div className="text-sm font-medium text-stone-100 mt-0.5">
                  {lightboxPhoto.caption || 'Celebration memory'}
                </div>
              </div>

              <button
                type="button"
                onClick={() => setLightboxPhoto(null)}
                className="p-1.5 text-stone-400 hover:text-white rounded-lg bg-stone-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
