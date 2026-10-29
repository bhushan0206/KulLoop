import React, { useState } from 'react';
import { FamilyOccasion, Family } from '../types';
import { generatePriestReadyNote } from '../utils/tithiCalculator';
import { X, Copy, Check, Printer, FileText, Share2 } from 'lucide-react';

interface PriestReadyNoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  occasion: FamilyOccasion | null;
  family: Family;
}

export const PriestReadyNoteModal: React.FC<PriestReadyNoteModalProps> = ({
  isOpen,
  onClose,
  occasion,
  family,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !occasion) return null;

  const noteText = generatePriestReadyNote(occasion, family);

  const handleCopy = () => {
    navigator.clipboard.writeText(noteText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/70 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-2xl border border-stone-200 shadow-2xl max-w-2xl w-full p-6 sm:p-8 space-y-6 my-8">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-stone-200 no-print">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-amber-100 rounded-lg text-amber-900">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-stone-900 font-serif-display">
                Priest-Ready Note (गुरुजींसाठी संकल्प व तिथी नोंद)
              </h3>
              <p className="text-xs text-stone-500">
                Formatted for immediate forwarding to the family priest or printing.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-stone-700 rounded-lg cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Printable Card Area */}
        <div className="printable-area bg-stone-50 rounded-xl border border-stone-200 p-6 font-devanagari text-xs text-stone-800 leading-relaxed whitespace-pre-wrap shadow-inner selection:bg-amber-200">
          {noteText}
        </div>

        {/* Action buttons */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-stone-200 no-print">
          <div className="text-xs text-stone-500">
            Checked with {family.validationSource}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-lg transition-colors cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Print Note</span>
            </button>
            <button
              onClick={handleCopy}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-stone-900 bg-amber-400 hover:bg-amber-300 rounded-lg transition-colors cursor-pointer shadow-sm"
            >
              {copied ? <Check className="w-4 h-4 text-stone-900" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'Copied to Clipboard' : 'Copy to WhatsApp'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
