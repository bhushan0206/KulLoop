import React, { useState, useRef, useEffect } from 'react';
import { FamilyOccasion } from '../types';
import { SlideOverTab } from './OccasionSlideOver';
import { 
  MoreVertical, 
  Edit3, 
  CheckCircle2, 
  Camera, 
  Smartphone, 
  FileText,
  SlidersHorizontal
} from 'lucide-react';

interface OccasionCardActionMenuProps {
  occasion: FamilyOccasion;
  onOpenSlideOver: (occ: FamilyOccasion, tab: SlideOverTab) => void;
  onPreviewWhatsApp?: (occ: FamilyOccasion) => void;
  onGeneratePriestNote?: (occ: FamilyOccasion) => void;
  compact?: boolean;
}

export const OccasionCardActionMenu: React.FC<OccasionCardActionMenuProps> = ({
  occasion,
  onOpenSlideOver,
  onPreviewWhatsApp,
  onGeneratePriestNote,
  compact = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const isShraddha = occasion.occasionType === 'shraddha' || occasion.occasionType === 'mahalaya';
  const hasPhotos = (occasion.memoryPhotos?.length || 0) > 0;

  return (
    <div className="relative inline-block text-left" ref={menuRef}>
      {compact ? (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setIsOpen((prev) => !prev);
          }}
          aria-haspopup="true"
          aria-expanded={isOpen}
          aria-label={`Actions for ${occasion.title}`}
          className="p-1 rounded-md text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors cursor-pointer"
        >
          <MoreVertical className="w-4 h-4" />
        </button>
      ) : (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setIsOpen((prev) => !prev);
          }}
          aria-haspopup="true"
          aria-expanded={isOpen}
          aria-label={`Actions for ${occasion.title}`}
          className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-semibold text-stone-700 bg-stone-100 hover:bg-stone-200 border border-stone-200/90 rounded-md transition-colors cursor-pointer shadow-2xs"
        >
          <SlidersHorizontal className="w-3 h-3 text-amber-700" />
          <span>Actions</span>
        </button>
      )}

      {isOpen && (
        <div 
          role="menu"
          aria-orientation="vertical"
          className="absolute right-0 mt-1 w-52 rounded-xl bg-white shadow-xl border border-stone-200 py-1.5 z-40 animate-in fade-in zoom-in-95 duration-150 focus:outline-none"
        >
          <div className="px-3 py-1.5 border-b border-stone-100">
            <p className="text-[10px] font-bold uppercase tracking-wider text-stone-400">
              Quick Actions
            </p>
            <p className="text-xs font-semibold text-stone-800 truncate" title={occasion.title}>
              {occasion.title}
            </p>
          </div>

          <div className="p-1 space-y-0.5">
            <button
              type="button"
              role="menuitem"
              onClick={(e) => {
                e.stopPropagation();
                setIsOpen(false);
                onOpenSlideOver(occasion, 'edit');
              }}
              className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs text-stone-700 hover:text-stone-900 hover:bg-amber-50/80 rounded-lg transition-colors cursor-pointer text-left font-medium"
            >
              <Edit3 className="w-3.5 h-3.5 text-amber-700 shrink-0" />
              <span>Edit Occasion</span>
            </button>

            <button
              type="button"
              role="menuitem"
              onClick={(e) => {
                e.stopPropagation();
                setIsOpen(false);
                onOpenSlideOver(occasion, 'performed');
              }}
              className="w-full flex items-center justify-between px-2.5 py-1.5 text-xs text-stone-700 hover:text-stone-900 hover:bg-emerald-50/80 rounded-lg transition-colors cursor-pointer text-left font-medium"
            >
              <div className="flex items-center gap-2">
                <CheckCircle2 className={`w-3.5 h-3.5 ${occasion.isPerformed ? 'text-emerald-600' : 'text-stone-400'} shrink-0`} />
                <span>Mark Performed</span>
              </div>
              {occasion.isPerformed && (
                <span className="text-[9px] font-bold text-emerald-700 bg-emerald-100/70 px-1.5 py-0.2 rounded">
                  Done
                </span>
              )}
            </button>

            <button
              type="button"
              role="menuitem"
              onClick={(e) => {
                e.stopPropagation();
                setIsOpen(false);
                onOpenSlideOver(occasion, 'photos');
              }}
              className="w-full flex items-center justify-between px-2.5 py-1.5 text-xs text-stone-700 hover:text-stone-900 hover:bg-amber-50/80 rounded-lg transition-colors cursor-pointer text-left font-medium"
            >
              <div className="flex items-center gap-2">
                <Camera className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                <span>Add / View Photos</span>
              </div>
              {hasPhotos && (
                <span className="text-[9px] font-mono text-stone-500 bg-stone-100 px-1.5 py-0.2 rounded">
                  {occasion.memoryPhotos?.length}
                </span>
              )}
            </button>
          </div>

          <div className="pt-1 mt-1 border-t border-stone-100 p-1 space-y-0.5">
            {onPreviewWhatsApp && (
              <button
                type="button"
                role="menuitem"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsOpen(false);
                  onPreviewWhatsApp(occasion);
                }}
                className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs text-stone-600 hover:text-stone-900 hover:bg-stone-50 rounded-lg transition-colors cursor-pointer text-left"
              >
                <Smartphone className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>WhatsApp Preview</span>
              </button>
            )}

            {isShraddha && onGeneratePriestNote && (
              <button
                type="button"
                role="menuitem"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsOpen(false);
                  onGeneratePriestNote(occasion);
                }}
                className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs text-stone-600 hover:text-stone-900 hover:bg-stone-50 rounded-lg transition-colors cursor-pointer text-left"
              >
                <FileText className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                <span>Priest Ready Note</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
