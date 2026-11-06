import React, { useState } from 'react';
import { Family, FamilyOccasion, Member, LanguageCode } from '../types';
import { 
  Smartphone, 
  Send, 
  Copy, 
  Check, 
  Globe, 
  Clock, 
  MapPin, 
  Share2, 
  Info,
  Calendar,
  MessageSquare,
  ExternalLink
} from 'lucide-react';
import { openWhatsAppDirect } from '../utils/whatsapp';

interface WhatsAppSimulatorProps {
  family: Family;
  occasions: FamilyOccasion[];
  members: Member[];
  initialOccasion?: FamilyOccasion;
  onOpenAddModal?: () => void;
  onOpenRemindersModal?: (occ?: FamilyOccasion) => void;
  onGeneratePriestNote: (occ: FamilyOccasion) => void;
}

export const WhatsAppSimulator: React.FC<WhatsAppSimulatorProps> = ({
  family,
  occasions,
  members,
  initialOccasion,
  onOpenAddModal,
  onOpenRemindersModal,
  onGeneratePriestNote,
}) => {
  const [selectedMemberId, setSelectedMemberId] = useState<string>(members[0]?.id || '');
  const [selectedOccasionId, setSelectedOccasionId] = useState<string>(
    initialOccasion?.id || occasions[0]?.id || ''
  );
  const [leadTimeStep, setLeadTimeStep] = useState<'7_days' | '2_days' | 'day_of'>('7_days');
  const [simulatedReplies, setSimulatedReplies] = useState<Array<{ sender: 'user' | 'bot'; text: string; time: string }>>([]);
  const [replyInput, setReplyInput] = useState('');
  const [copiedToast, setCopiedToast] = useState(false);

  const activeMember = members.find((m) => m.id === selectedMemberId) || members[0];
  const activeOccasion = occasions.find((o) => o.id === selectedOccasionId) || occasions[0];

  // Empty state guard when no members or occasions exist
  if (!activeOccasion || !activeMember) {
    return (
      <div className="bg-white rounded-2xl border border-stone-200 p-8 sm:p-12 text-center space-y-4">
        <div className="w-16 h-16 bg-emerald-50 text-emerald-700 rounded-full flex items-center justify-center mx-auto border border-emerald-200">
          <Smartphone className="w-8 h-8 text-emerald-600" />
        </div>
        <div className="max-w-md mx-auto space-y-2">
          <h3 className="text-xl font-bold font-serif-display text-stone-900">
            WhatsApp Simulator for {family.name}
          </h3>
          <p className="text-xs text-stone-500 leading-relaxed">
            No occasions or members recorded yet. Add your family's first Shraddha tithi, birthday, or festival to preview live multi-lingual WhatsApp reminders here.
          </p>
          {onOpenAddModal && (
            <div className="pt-2">
              <button
                onClick={onOpenAddModal}
                className="px-4 py-2 bg-amber-400 hover:bg-amber-300 text-stone-950 font-semibold rounded-xl text-xs transition-colors cursor-pointer shadow-sm"
              >
                + Add First Occasion
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Language based on active member preference
  const lang: LanguageCode = activeMember?.language || 'mr';

  // Construct message based on recipient location, language, and occasion
  const getRenderedMessage = () => {
    if (!activeOccasion) return '';

    const isAbroad = activeMember?.country !== 'India';
    const isShraddha = activeOccasion.occasionType === 'shraddha' || activeOccasion.occasionType === 'mahalaya';
    const isBirthday = activeOccasion.occasionType === 'birthday';
    const isMilestone = activeOccasion.occasionType === 'milestone';

    const occurrence = activeOccasion.occurrence2027;
    const dateFormatted = occurrence.formattedDisplay;
    const weekday = occurrence.weekday;
    const tithiSpan = occurrence.tithiSpan;

    // Greeting by language
    if (lang === 'mr') {
      let leadLabel = leadTimeStep === '7_days' ? 'येत्या ७ दिवसांत' : leadTimeStep === '2_days' ? 'येत्या २ दिवसांत' : 'आज';
      
      let message = `सस्नेह नमस्कार, ${activeMember.name.split(' ')[0]}जी 🙏\n\n`;
      message += `*कुललूप (Family Tithi Loop) स्मरण*\n`;
      message += `${leadLabel} ${weekday}, ${dateFormatted} रोजी आपल्या कुटुंबातील विशेष तिथी आहे:\n\n`;
      message += `📌 *${activeOccasion.title}*\n`;
      if (activeOccasion.tithiFields) {
        message += `तिथी: ${activeOccasion.tithiFields.lunarMonthDevanagari || activeOccasion.tithiFields.lunarMonth} ${activeOccasion.tithiFields.pakshaDevanagari || activeOccasion.tithiFields.paksha} ${activeOccasion.tithiFields.tithiDevanagari || activeOccasion.tithiFields.tithi}\n`;
      }
      message += `स्थान: ${family.homeLocation} सूर्योदयानुरूप.\n`;
      message += `वेळ: ${tithiSpan}\n\n`;

      if (isShraddha && activeOccasion.contentNote.mr.prepList) {
        message += `📋 *तयारीची नोंद (मायधरोहर सौजन्याने):*\n`;
        activeOccasion.contentNote.mr.prepList.forEach((item) => {
          message += `• ${item}\n`;
        });
        message += `\n`;
      }

      if (isBirthday && activeOccasion.contentNote.mr.wish) {
        message += `🎂 *वाढदिवसाच्या शुभेच्छा संदेश (पुढे पाठवण्यासाठी):*\n`;
        message += `"${activeOccasion.contentNote.mr.wish}"\n\n`;
      }

      if (activeOccasion.practiceNotes) {
        message += `कुटुंब पद्धती: ${activeOccasion.practiceNotes}\n\n`;
      }

      message += `_संदर्भ: ${occurrence.validationSourceUsed} नियमांनुसार पडताळणीकृत._\n`;
      message += `_थांबवण्यासाठी STOP किंवा विराम देण्यासाठी PAUSE असे उत्तर द्या._`;
      return message;
    } else if (lang === 'hi') {
      let leadLabel = leadTimeStep === '7_days' ? 'आगामी ७ दिनों में' : leadTimeStep === '2_days' ? 'आगामी २ दिनों में' : 'आज';

      let message = `सादर प्रणाम, ${activeMember.name.split(' ')[0]}जी 🙏\n\n`;
      message += `*कुललूप (Family Tithi Loop) पारिवारिक स्मरण*\n`;
      message += `${leadLabel} ${weekday}, ${dateFormatted} को हमारे परिवार की विशेष तिथि है:\n\n`;
      message += `📌 *${activeOccasion.title}*\n`;
      if (activeOccasion.tithiFields) {
        message += `तिथि: ${activeOccasion.tithiFields.lunarMonthDevanagari || activeOccasion.tithiFields.lunarMonth} ${activeOccasion.tithiFields.pakshaDevanagari || activeOccasion.tithiFields.paksha} ${activeOccasion.tithiFields.tithiDevanagari || activeOccasion.tithiFields.tithi}\n`;
      }
      message += `स्थान: ${family.homeLocation} स्थानीय सूर्योदय अनुसार।\n`;
      message += `समय विवरण: ${tithiSpan}\n\n`;

      if (isShraddha && activeOccasion.contentNote.hi.prepList) {
        message += `📋 *तैयारी निर्देश (मायधरोहर सौजन्य से):*\n`;
        activeOccasion.contentNote.hi.prepList.forEach((item) => {
          message += `• ${item}\n`;
        });
        message += `\n`;
      }

      if (isBirthday && activeOccasion.contentNote.hi.wish) {
        message += `🎂 *बधाई संदेश (अग्रेषित करने के लिए):*\n`;
        message += `"${activeOccasion.contentNote.hi.wish}"\n\n`;
      }

      message += `_पंचांग संदर्भ: ${occurrence.validationSourceUsed} द्वारा सत्यापित।_\n`;
      message += `_संदेश रोकने के लिए STOP अथवा भाषा बदलने हेतु LANG लिखें।_`;
      return message;
    } else {
      // English (e.g. for Sunita in Toronto or diaspora)
      let leadLabel = leadTimeStep === '7_days' ? 'in 7 days' : leadTimeStep === '2_days' ? 'in 2 days' : 'today';

      let message = `Namaskar ${activeMember.name.split(' ')[0]} 🙏\n\n`;
      message += `*Family Tithi Loop Reminder*\n`;
      message += `Coming up ${leadLabel} on *${weekday}, ${dateFormatted}*:\n\n`;
      message += `📌 *${activeOccasion.title}*\n`;
      if (activeOccasion.tithiFields) {
        message += `Tithi: ${activeOccasion.tithiFields.lunarMonth} ${activeOccasion.tithiFields.paksha} ${activeOccasion.tithiFields.tithi}\n`;
      }

      if (isAbroad) {
        message += `*Calendar Notice:* Observed on ${weekday}, ${dateFormatted} by family home calendar for ${family.homeLocation}.\n`;
        message += `(Delivered at 09:00 AM ${activeMember.city} local time)\n`;
      } else {
        message += `Location: Calculated for ${family.homeLocation} sunrise.\n`;
      }
      message += `Tithi Span: ${tithiSpan}\n\n`;

      if (isShraddha && activeOccasion.contentNote.en.prepList) {
        message += `📋 *Preparation Note (via MyDharohar):*\n`;
        activeOccasion.contentNote.en.prepList.forEach((item) => {
          message += `• ${item}\n`;
        });
        message += `\n`;
      }

      if (isBirthday && activeOccasion.contentNote.en.wish) {
        message += `🎂 *Forwardable Wish for Family:*\n`;
        message += `"${activeOccasion.contentNote.en.wish}"\n\n`;
      }

      if (isMilestone) {
        message += `🏡 *Today in Our Family Memory:*\n`;
        message += `"${activeOccasion.contentNote.en.body}"\n\n`;
      }

      message += `_Source: Verified against ${occurrence.validationSourceUsed}._\n`;
      message += `_Reply STOP to pause, or DIGEST to switch minor dates to monthly._`;
      return message;
    }
  };

  const handleCopyMessage = () => {
    navigator.clipboard.writeText(getRenderedMessage());
    setCopiedToast(true);
    setTimeout(() => setCopiedToast(false), 2000);
  };

  const handleSimulateReply = (cmd: string) => {
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const userMsg = { sender: 'user' as const, text: cmd, time };

    let botResponse = '';
    if (cmd.toUpperCase() === 'STOP') {
      botResponse = `Understood. Reminders for your number have been paused. Configurator (${family.configuratorName}) has been gently notified. Reply START anytime to resume.`;
    } else if (cmd.toUpperCase() === 'PAUSE') {
      botResponse = `Reminders paused for 30 days. We will check in gently before the next family occasion.`;
    } else if (cmd.toUpperCase().includes('MARATHI') || cmd.toUpperCase().includes('LANG MR')) {
      botResponse = `आपली भाषा मराठी (Marathi) मध्ये निश्चित केली आहे. पुढील सर्व आठवणी मराठीत येतील.`;
    } else if (cmd.toUpperCase() === 'DIGEST') {
      botResponse = `Your preference is updated to weekly digest for minor dates. Shraddha observances will always be delivered individually.`;
    } else {
      botResponse = `Received your message: "${cmd}". The family configurator has been informed.`;
    }

    const botMsg = { sender: 'bot' as const, text: botResponse, time };
    setSimulatedReplies((prev) => [...prev, userMsg, botMsg]);
    setReplyInput('');
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h2 className="text-xl sm:text-2xl font-bold text-stone-900 font-serif-display">
          Interactive WhatsApp Recipient Experience
        </h2>
        <p className="text-xs text-stone-500 mt-1">
          Elders and family members install no app. See exactly what arrives on their phone in Marathi, Hindi, or English.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Controls Column (Left) */}
        <div className="lg:col-span-5 space-y-5 bg-white p-6 rounded-2xl border border-stone-200 shadow-sm">
          <div className="space-y-2">
            <label className="text-xs font-semibold text-stone-700 uppercase tracking-wider flex items-center gap-1.5">
              <span>Select Recipient Member</span>
            </label>
            <div className="space-y-2">
              {members.map((m) => (
                <button
                  key={m.id}
                  onClick={() => setSelectedMemberId(m.id)}
                  className={`w-full p-3 text-left rounded-xl border transition-all flex items-center justify-between text-xs ${
                    selectedMemberId === m.id
                      ? 'bg-amber-50/80 border-amber-400 text-stone-900 shadow-xs'
                      : 'bg-stone-50 border-stone-200 text-stone-600 hover:bg-stone-100'
                  }`}
                >
                  <div>
                    <div className="font-semibold text-stone-900">{m.name}</div>
                    <div className="text-[11px] text-stone-500 flex items-center gap-2 mt-0.5">
                      <span>{m.city}, {m.country}</span>
                      <span aria-hidden="true">·</span>
                      <span className="font-medium text-amber-800">
                        {m.language === 'mr' ? 'मराठी (Marathi)' : m.language === 'hi' ? 'हिंदी (Hindi)' : 'English'}
                      </span>
                    </div>
                  </div>
                  {m.country !== 'India' && (
                    <span className="text-[10px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                      Abroad ({m.timeZone.split('/')[1]})
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-stone-700 uppercase tracking-wider">
              Select Family Occasion
            </label>
            <select
              value={selectedOccasionId}
              onChange={(e) => setSelectedOccasionId(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-stone-50 border border-stone-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500 font-medium"
            >
              {occasions.map((occ) => (
                <option key={occ.id} value={occ.id}>
                  {occ.title} ({occ.occurrence2027.formattedDisplay})
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-stone-700 uppercase tracking-wider">
              Reminder Cadence / Lead Time
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => setLeadTimeStep('7_days')}
                className={`py-2 text-xs font-medium rounded-lg border transition-all ${
                  leadTimeStep === '7_days'
                    ? 'bg-stone-900 text-white border-stone-900'
                    : 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100'
                }`}
              >
                7 Days Before
              </button>
              <button
                onClick={() => setLeadTimeStep('2_days')}
                className={`py-2 text-xs font-medium rounded-lg border transition-all ${
                  leadTimeStep === '2_days'
                    ? 'bg-stone-900 text-white border-stone-900'
                    : 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100'
                }`}
              >
                2 Days Before
              </button>
              <button
                onClick={() => setLeadTimeStep('day_of')}
                className={`py-2 text-xs font-medium rounded-lg border transition-all ${
                  leadTimeStep === 'day_of'
                    ? 'bg-stone-900 text-white border-stone-900'
                    : 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100'
                }`}
              >
                Day-Of Note
              </button>
            </div>
          </div>

          <div className="pt-2 border-t border-stone-200 flex flex-col gap-2">
            <button
              onClick={() => openWhatsAppDirect(activeMember.phone, getRenderedMessage())}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 rounded-xl transition-all shadow-sm cursor-pointer"
              title={`Launch WhatsApp directly with prefilled message to ${activeMember.name} (${activeMember.phone})`}
            >
              <MessageSquare className="w-4 h-4 fill-current text-white" />
              <span>Send on WhatsApp ({activeMember.name.split(' ')[0]})</span>
              <ExternalLink className="w-3.5 h-3.5 opacity-80" />
            </button>

            {onOpenRemindersModal && (
              <button
                onClick={() => onOpenRemindersModal(activeOccasion)}
                className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 text-xs font-semibold text-amber-900 bg-amber-100 hover:bg-amber-200 border border-amber-300 rounded-xl transition-colors cursor-pointer"
                title="View All Zero-Cost Channels: WhatsApp, Calendar Sync, Email Digest & Web Push"
              >
                <span>Zero-Fee Channels Hub (Cal, Email, Push)</span>
              </button>
            )}

            <div className="flex items-center gap-2">
              <button
                onClick={handleCopyMessage}
                className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-lg transition-colors cursor-pointer"
              >
                {copiedToast ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                <span>{copiedToast ? 'Copied!' : 'Copy Text'}</span>
              </button>

              {activeOccasion && (activeOccasion.occasionType === 'shraddha' || activeOccasion.occasionType === 'mahalaya') && (
                <button
                  onClick={() => onGeneratePriestNote(activeOccasion)}
                  className="inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-amber-900 bg-amber-100 hover:bg-amber-200 rounded-lg transition-colors cursor-pointer"
                >
                  <span>Priest Note (गुरुजींसाठी नोंद)</span>
                </button>
              )}
            </div>
          </div>

          {/* Guidelines info */}
          <div className="p-3.5 bg-stone-50 rounded-xl border border-stone-200/80 text-xs text-stone-600 space-y-1.5">
            <div className="font-semibold text-stone-800 flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 text-amber-700" />
              <span>Recipient Design Principles (PDF Page 6)</span>
            </div>
            <p className="text-[11px] leading-relaxed">
              • <strong>Readable on basic phones:</strong> Short lines, large clear structure, no links required.
              <br />
              • <strong>Abroad timezone safety:</strong> Labelled with family home location ({family.homeLocation}) to prevent date confusion.
              <br />
              • <strong>Respectful silence:</strong> Only occasions opted-in; silence between dates is a feature.
            </p>
          </div>
        </div>

        {/* WhatsApp Mobile Mockup Frame (Right) */}
        <div className="lg:col-span-7 flex justify-center">
          <div className="w-full max-w-[420px] bg-stone-900 rounded-[36px] p-3 shadow-2xl border-4 border-stone-800">
            {/* Phone Screen */}
            <div className="w-full bg-[#EFEAE2] rounded-[28px] overflow-hidden flex flex-col h-[680px]">
              {/* WhatsApp Header */}
              <div className="bg-[#075E54] text-white px-4 py-3 flex items-center justify-between shadow-sm shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-emerald-800 flex items-center justify-center font-bold text-amber-300 text-sm border border-amber-300/40">
                    KL
                  </div>
                  <div>
                    <div className="font-semibold text-sm leading-tight flex items-center gap-1">
                      <span>KulLoop Verified</span>
                      <Check className="w-3 h-3 text-emerald-300" />
                    </div>
                    <div className="text-[10px] text-emerald-100">
                      Official Family Tithi Service · {family.name.split(' ')[0]}
                    </div>
                  </div>
                </div>

                <div className="text-right text-[10px] text-emerald-100 font-mono">
                  {activeMember.city}
                </div>
              </div>

              {/* Chat Canvas */}
              <div className="flex-1 p-3 overflow-y-auto space-y-3 font-sans text-xs">
                {/* Date bubble */}
                <div className="text-center my-2">
                  <span className="bg-white/80 backdrop-blur-xs text-stone-600 text-[10px] font-medium px-2.5 py-1 rounded-full shadow-2xs">
                    Today · 09:00 AM
                  </span>
                </div>

                {/* Primary Automated WhatsApp Message */}
                <div className="flex flex-col items-start">
                  <div className="bg-white text-stone-900 p-3.5 rounded-2xl rounded-tl-xs shadow-sm max-w-[90%] whitespace-pre-wrap leading-relaxed text-[12px] border border-stone-100">
                    {getRenderedMessage()}
                    <div className="text-[9px] text-stone-400 text-right mt-1.5 flex items-center justify-end gap-1">
                      <span>09:00 AM</span>
                      <span className="text-blue-500">✓✓</span>
                    </div>
                  </div>
                </div>

                {/* Simulated Conversation replies */}
                {simulatedReplies.map((r, idx) => (
                  <div
                    key={idx}
                    className={`flex flex-col ${r.sender === 'user' ? 'items-end' : 'items-start'}`}
                  >
                    <div
                      className={`p-3 rounded-2xl text-[12px] shadow-sm max-w-[85%] whitespace-pre-wrap leading-relaxed ${
                        r.sender === 'user'
                          ? 'bg-[#DCF8C6] text-stone-900 rounded-tr-xs'
                          : 'bg-white text-stone-900 rounded-tl-xs border border-stone-100'
                      }`}
                    >
                      {r.text}
                      <div className="text-[9px] text-stone-400 text-right mt-1">
                        {r.time}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Quick Reply Affordances */}
              <div className="px-3 py-2 bg-stone-100/90 border-t border-stone-200/60 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                <span className="text-[10px] text-stone-500 font-medium shrink-0">Quick reply:</span>
                <button
                  onClick={() => handleSimulateReply('STOP')}
                  className="px-2 py-1 bg-white hover:bg-stone-50 text-stone-700 text-[10px] font-medium rounded-full border border-stone-200 shrink-0 cursor-pointer"
                >
                  STOP
                </button>
                <button
                  onClick={() => handleSimulateReply('PAUSE')}
                  className="px-2 py-1 bg-white hover:bg-stone-50 text-stone-700 text-[10px] font-medium rounded-full border border-stone-200 shrink-0 cursor-pointer"
                >
                  PAUSE
                </button>
                <button
                  onClick={() => handleSimulateReply('DIGEST')}
                  className="px-2 py-1 bg-white hover:bg-stone-50 text-stone-700 text-[10px] font-medium rounded-full border border-stone-200 shrink-0 cursor-pointer"
                >
                  DIGEST
                </button>
                <button
                  onClick={() => handleSimulateReply('CHANGE TO MARATHI')}
                  className="px-2 py-1 bg-white hover:bg-stone-50 text-stone-700 text-[10px] font-medium rounded-full border border-stone-200 shrink-0 cursor-pointer"
                >
                  मराठी
                </button>
              </div>

              {/* Chat Input Bar */}
              <div className="bg-[#F0F2F5] px-3 py-2 flex items-center gap-2 shrink-0">
                <input
                  type="text"
                  placeholder="Type a response (e.g. STOP, DIGEST)..."
                  value={replyInput}
                  onChange={(e) => setReplyInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && replyInput.trim()) {
                      handleSimulateReply(replyInput);
                    }
                  }}
                  className="flex-1 bg-white px-3 py-2 rounded-full text-xs text-stone-800 placeholder-stone-400 focus:outline-none border border-stone-200"
                />
                <button
                  onClick={() => {
                    if (replyInput.trim()) handleSimulateReply(replyInput);
                  }}
                  className="w-8 h-8 rounded-full bg-[#075E54] text-white flex items-center justify-center shrink-0 cursor-pointer hover:bg-[#064e46]"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
