import React, { useState } from 'react';
import { Family, FamilyOccasion } from '../types';
import { 
  X, 
  MessageSquare, 
  Copy, 
  Check, 
  Share2, 
  Sparkles,
  ExternalLink,
  Users,
  ShieldCheck,
  Calendar
} from 'lucide-react';
import { openWhatsAppDirect } from '../utils/whatsapp';

interface ShareFamilyModalProps {
  family: Family;
  occasions: FamilyOccasion[];
  isOpen: boolean;
  onClose: () => void;
}

export const ShareFamilyModal: React.FC<ShareFamilyModalProps> = ({
  family,
  occasions,
  isOpen,
  onClose,
}) => {
  const [lang, setLang] = useState<'mr' | 'hi' | 'en'>('mr');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  // Use current site URL or fallback
  const shareUrl = typeof window !== 'undefined' ? window.location.origin : 'https://kulloop.in';

  // Upcoming 3 occasions summary
  const upcomingSummary = occasions.slice(0, 3).map(o => 
    `• ${o.title}: ${o.occurrence2027.formattedDisplay}`
  ).join('\n');

  // Pre-composed messages
  const messages = {
    mr: `सस्नेह नमस्कार 🙏\n\nमी आपल्या *${family.name}* चे सर्व तिथी, श्राद्ध, आणि सणांचे वार्षिक कॅलेंडर *कुललूप (KulLoop)* वर सुरक्षित नोंदवले आहे.\n\nयेत्या काही विशेष तिथी:\n${upcomingSummary}\n\nआपल्या कुटुंबाचे कॅलेंडर व तिथी आठवणी येथे पहा:\n👉 ${shareUrl}\n\n(घरच्या ज्येष्ठांना कोणतेही ॲप डाऊनलोड करण्याची आवश्यकता नाही. सर्व आठवणी थेट व्हॉट्सॲपवर योग्य भाषेत येतात.)`,
    
    hi: `सादर प्रणाम 🙏\n\nमैंने हमारे *${family.name}* के सभी वार्षिक श्राद्ध, जन्मतिथि और पारिवारिक पर्वों का विवरण *कुललूप (KulLoop)* पर सुरक्षित दर्ज किया है।\n\nआगामी मुख्य तिथियाँ:\n${upcomingSummary}\n\nहमारे पारिवारिक कैलेंडर को यहाँ देखें:\n👉 ${shareUrl}\n\n(घर के बड़ों को कोई नया ऐप डाउनलोड नहीं करना पड़ेगा। सभी आवश्यक स्मरण सीधे व्हाट्सएप पर समय पर प्राप्त होंगे।)`,
    
    en: `Namaste! 🙏\n\nI have set up our *${family.name}* ancestral shraddhas, birthdays, and family tithi calendar on *KulLoop*.\n\nUpcoming Family Dates:\n${upcomingSummary}\n\nView our family calendar here:\n👉 ${shareUrl}\n\n(No apps needed for elders. All reminders arrive peacefully on WhatsApp in their preferred language.)`
  };

  const selectedText = messages[lang];

  const handleCopy = () => {
    navigator.clipboard.writeText(selectedText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleWhatsAppShare = () => {
    openWhatsAppDirect('', selectedText);
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${family.name} — KulLoop Tithi Calendar`,
          text: selectedText,
          url: shareUrl,
        });
      } catch (err) {
        // User cancelled or unsupported
      }
    } else {
      handleCopy();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-2xl max-w-lg w-full border border-stone-200 shadow-2xl overflow-hidden"
        role="dialog"
        aria-modal="true"
      >
        {/* Modal Header */}
        <div className="p-5 bg-gradient-to-r from-stone-900 to-stone-800 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-amber-400 text-stone-900 flex items-center justify-center">
              <Share2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-base font-serif-display text-amber-200">
                Share Family Calendar on WhatsApp
              </h3>
              <p className="text-[11px] text-stone-300">
                Send to family group or individual elders with one tap
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-stone-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-4 text-xs">
          {/* Language Tabs */}
          <div>
            <label className="text-[11px] font-semibold text-stone-600 uppercase tracking-wider block mb-1.5">
              Select Message Language (भाषेची निवड)
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setLang('mr')}
                className={`py-2 px-3 rounded-lg border text-center font-medium transition-all cursor-pointer ${
                  lang === 'mr'
                    ? 'bg-amber-50 border-amber-400 text-amber-900 shadow-xs'
                    : 'bg-stone-50 border-stone-200 text-stone-600 hover:bg-stone-100'
                }`}
              >
                मराठी (Marathi)
              </button>
              <button
                type="button"
                onClick={() => setLang('hi')}
                className={`py-2 px-3 rounded-lg border text-center font-medium transition-all cursor-pointer ${
                  lang === 'hi'
                    ? 'bg-amber-50 border-amber-400 text-amber-900 shadow-xs'
                    : 'bg-stone-50 border-stone-200 text-stone-600 hover:bg-stone-100'
                }`}
              >
                हिंदी (Hindi)
              </button>
              <button
                type="button"
                onClick={() => setLang('en')}
                className={`py-2 px-3 rounded-lg border text-center font-medium transition-all cursor-pointer ${
                  lang === 'en'
                    ? 'bg-amber-50 border-amber-400 text-amber-900 shadow-xs'
                    : 'bg-stone-50 border-stone-200 text-stone-600 hover:bg-stone-100'
                }`}
              >
                English
              </button>
            </div>
          </div>

          {/* Message Preview Box */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold text-stone-600 uppercase tracking-wider block">
              Pre-Composed WhatsApp Invite Preview
            </label>
            <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 text-stone-800 font-sans leading-relaxed whitespace-pre-wrap max-h-52 overflow-y-auto select-all text-[12px]">
              {selectedText}
            </div>
          </div>

          {/* Social / WhatsApp Action Buttons */}
          <div className="space-y-2 pt-2">
            <button
              onClick={handleWhatsAppShare}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-semibold rounded-xl text-xs shadow-sm transition-all cursor-pointer"
            >
              <MessageSquare className="w-4 h-4 fill-current text-white" />
              <span>Open in WhatsApp & Share to Family Group</span>
              <ExternalLink className="w-3.5 h-3.5 opacity-80" />
            </button>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={handleCopy}
                className="flex items-center justify-center gap-1.5 px-3 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-800 font-medium rounded-xl text-xs transition-colors cursor-pointer border border-stone-200"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-stone-500" />}
                <span>{copied ? 'Copied Message!' : 'Copy Text'}</span>
              </button>

              <button
                onClick={handleNativeShare}
                className="flex items-center justify-center gap-1.5 px-3 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-800 font-medium rounded-xl text-xs transition-colors cursor-pointer border border-stone-200"
              >
                <Share2 className="w-4 h-4 text-stone-500" />
                <span>Mobile Share Sheet</span>
              </button>
            </div>
          </div>

          {/* Quiet Trust Banner */}
          <div className="p-2.5 bg-amber-50/70 border border-amber-200/60 rounded-xl flex items-center gap-2 text-[11px] text-amber-900">
            <ShieldCheck className="w-4 h-4 text-amber-700 shrink-0" />
            <span>
              <strong>Dignified & Private:</strong> KulLoop links never trigger unwanted spam or public directories.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
