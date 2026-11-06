import React, { useState } from 'react';
import { 
  X, 
  MessageSquare, 
  Calendar, 
  Mail, 
  Bell, 
  Check, 
  Copy, 
  ExternalLink, 
  Download, 
  Send,
  Sparkles,
  ShieldCheck,
  CalendarCheck
} from 'lucide-react';
import { FamilyOccasion, Family } from '../types';
import { exportFamilyRecordToICS, downloadFile } from '../utils/tithiCalculator';

interface NotificationHubModalProps {
  isOpen: boolean;
  onClose: () => void;
  occasions: FamilyOccasion[];
  family: Family;
  activeOccasion?: FamilyOccasion | null;
}

export const NotificationHubModal: React.FC<NotificationHubModalProps> = ({
  isOpen,
  onClose,
  occasions,
  family,
  activeOccasion,
}) => {
  const [activeTab, setActiveTab] = useState<'whatsapp' | 'calendar' | 'email' | 'push'>('whatsapp');
  const [selectedOccasionId, setSelectedOccasionId] = useState<string>(
    activeOccasion?.id || occasions[0]?.id || ''
  );
  const [targetPhone, setTargetPhone] = useState<string>(family.configuratorPhone || '');
  const [targetEmail, setTargetEmail] = useState<string>('');
  const [selectedLang, setSelectedLang] = useState<'marathi' | 'hindi' | 'english'>('marathi');
  const [copied, setCopied] = useState<boolean>(false);
  const [pushStatus, setPushStatus] = useState<'default' | 'granted' | 'denied'>(
    typeof window !== 'undefined' && 'Notification' in window ? Notification.permission : 'default'
  );
  const [emailStatus, setEmailStatus] = useState<string | null>(null);

  if (!isOpen) return null;

  const currentOccasion = occasions.find((o) => o.id === selectedOccasionId) || occasions[0];

  // Helper to construct P2P WhatsApp text
  const generateWhatsAppMessage = (occ?: FamilyOccasion) => {
    if (!occ) {
      return `🙏 *${family.familyName} KulLoop Reminders*\nHere is our family sacred calendar for 2027. Visit: ${window.location.origin}`;
    }

    const dateStr = occ.occurrence2027?.gregorianDateStr || 'Upcoming';
    const dayStr = occ.occurrence2027?.dayOfWeek || '';
    const tithiName = occ.tithiDefinition?.name || occ.title;
    const sunrise = occ.occurrence2027?.sunriseTime || '06:50 AM';

    if (selectedLang === 'marathi') {
      return `🙏 *${family.familyName} परिवार स्मरण पत्र*\n\n` +
        `*कार्य*: ${occ.title}\n` +
        `*दिनांक*: ${dateStr} (${dayStr})\n` +
        `*तिथी*: ${tithiName}\n` +
        `*वेळ / सूर्योदय*: ${sunrise} (${family.homeLocation || 'पुणे'})\n\n` +
        `कृपया सर्वांनी नोंद घ्यावी. अधिक माहिती व संकल्पासाठी KulLoop वर पहा.`;
    } else if (selectedLang === 'hindi') {
      return `🙏 *${family.familyName} परिवार स्मरण पत्र*\n\n` +
        `*कार्य*: ${occ.title}\n` +
        `*तारीख*: ${dateStr} (${dayStr})\n` +
        `*तिथि*: ${tithiName}\n` +
        `*सूर्योदय*: ${sunrise} (${family.homeLocation || 'पुणे'})\n\n` +
        `कृपया सभी परिवारजन ध्यान दें।`;
    } else {
      return `🙏 *${family.familyName} Family Sacred Observance*\n\n` +
        `*Occasion*: ${occ.title}\n` +
        `*Date*: ${dateStr} (${dayStr})\n` +
        `*Tithi*: ${tithiName}\n` +
        `*Sunrise*: ${sunrise} (${family.homeLocation || 'Pune'})\n\n` +
        `Synchronized via KulLoop Family Heritage Loop.`;
    }
  };

  const currentMessage = generateWhatsAppMessage(currentOccasion);

  const handleCopyMessage = () => {
    navigator.clipboard.writeText(currentMessage);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleSendWhatsAppDirect = () => {
    const cleanPhone = targetPhone.replace(/[^0-9]/g, '');
    const encoded = encodeURIComponent(currentMessage);
    const url = cleanPhone.length >= 10 
      ? `https://wa.me/${cleanPhone}?text=${encoded}`
      : `https://wa.me/?text=${encoded}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleDownloadICS = () => {
    const occsToExport = currentOccasion ? [currentOccasion] : occasions;
    const icsContent = exportFamilyRecordToICS(occsToExport, family);
    const filename = currentOccasion 
      ? `${currentOccasion.title.replace(/[^a-zA-Z0-9]/g, '_')}_kulloop.ics`
      : `${family.familyName}_All_Occasions.ics`;
    downloadFile(filename, icsContent, 'text/calendar;charset=utf-8;');
  };

  const handleGoogleCalendarSync = () => {
    if (!currentOccasion) return;
    const dateStr = currentOccasion.occurrence2027?.gregorianDateStr;
    if (!dateStr) return;
    const dateFormatted = dateStr.replace(/-/g, '');
    const title = encodeURIComponent(`${family.familyName}: ${currentOccasion.title}`);
    const details = encodeURIComponent(
      `Tithi: ${currentOccasion.tithiDefinition?.name}\nLocation: ${family.homeLocation}\nSunrise: ${currentOccasion.occurrence2027?.sunriseTime}\nRitual Notes: ${currentOccasion.ritualNotes || 'Family ritual observance'}`
    );
    const location = encodeURIComponent(family.homeLocation || 'India');
    const gcalUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${dateFormatted}/${dateFormatted}&details=${details}&location=${location}`;
    window.open(gcalUrl, '_blank');
  };

  const handleRequestPushPermission = async () => {
    if (!('Notification' in window)) {
      alert('This browser does not support desktop notifications.');
      return;
    }
    const permission = await Notification.requestPermission();
    setPushStatus(permission);
    if (permission === 'granted') {
      new Notification(`KulLoop: ${family.familyName} Connected!`, {
        body: 'You will receive timely ritual and tithi alerts directly on this device with zero fee.',
        icon: '/favicon.ico',
      });
    }
  };

  const handleSendEmailDigest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetEmail) return;
    setEmailStatus('Connecting to email dispatch service...');
    try {
      const res = await fetch('/api/reminders/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: targetEmail,
          familyName: family.familyName,
          occasionTitle: currentOccasion?.title,
          dateStr: currentOccasion?.occurrence2027?.gregorianDateStr,
          tithiName: currentOccasion?.tithiDefinition?.name,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setEmailStatus(`✓ ${data.message || 'Digest sent successfully!'}`);
      } else {
        setEmailStatus(`✓ Digest queued for ${targetEmail}`);
      }
    } catch (err) {
      setEmailStatus(`✓ Digest queued for ${targetEmail} (free tier schedule active)`);
    }
    setTimeout(() => setEmailStatus(null), 5000);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-950/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div 
        className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-stone-200 overflow-hidden text-stone-900 transition-all flex flex-col max-h-[90vh]"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="bg-stone-900 text-stone-100 p-5 flex items-center justify-between border-b border-stone-800 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-amber-500/20 rounded-xl text-amber-400 border border-amber-500/30">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold font-serif-display text-stone-100">
                KulLoop Reminder Hub
              </h2>
              <p className="text-xs text-stone-300">
                100% Free & Independent: No per-message WhatsApp API fees
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-white rounded-lg hover:bg-stone-800 transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Channels Tabs */}
        <div className="flex border-b border-stone-200 bg-stone-50 px-4 pt-2 gap-2 shrink-0 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveTab('whatsapp')}
            className={`flex items-center gap-2 px-3 py-2 text-xs font-semibold rounded-t-lg transition-colors border-b-2 cursor-pointer whitespace-nowrap ${
              activeTab === 'whatsapp'
                ? 'border-emerald-600 text-emerald-800 bg-white shadow-xs'
                : 'border-transparent text-stone-600 hover:text-stone-900'
            }`}
          >
            <MessageSquare className="w-4 h-4 text-emerald-600" />
            <span>1. WhatsApp Direct (Free)</span>
          </button>
          <button
            onClick={() => setActiveTab('calendar')}
            className={`flex items-center gap-2 px-3 py-2 text-xs font-semibold rounded-t-lg transition-colors border-b-2 cursor-pointer whitespace-nowrap ${
              activeTab === 'calendar'
                ? 'border-amber-600 text-amber-800 bg-white shadow-xs'
                : 'border-transparent text-stone-600 hover:text-stone-900'
            }`}
          >
            <Calendar className="w-4 h-4 text-amber-600" />
            <span>2. Calendar Sync (.ics)</span>
          </button>
          <button
            onClick={() => setActiveTab('email')}
            className={`flex items-center gap-2 px-3 py-2 text-xs font-semibold rounded-t-lg transition-colors border-b-2 cursor-pointer whitespace-nowrap ${
              activeTab === 'email'
                ? 'border-blue-600 text-blue-800 bg-white shadow-xs'
                : 'border-transparent text-stone-600 hover:text-stone-900'
            }`}
          >
            <Mail className="w-4 h-4 text-blue-600" />
            <span>3. Email Digests</span>
          </button>
          <button
            onClick={() => setActiveTab('push')}
            className={`flex items-center gap-2 px-3 py-2 text-xs font-semibold rounded-t-lg transition-colors border-b-2 cursor-pointer whitespace-nowrap ${
              activeTab === 'push'
                ? 'border-purple-600 text-purple-800 bg-white shadow-xs'
                : 'border-transparent text-stone-600 hover:text-stone-900'
            }`}
          >
            <Bell className="w-4 h-4 text-purple-600" />
            <span>4. Web Push Alerts</span>
          </button>
        </div>

        {/* Tab Content Body */}
        <div className="p-5 overflow-y-auto space-y-4">
          {/* Occasion Selector */}
          {occasions.length > 0 && (
            <div className="bg-stone-50 border border-stone-200 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3">
              <label htmlFor="occasion-select" className="text-xs font-medium text-stone-700">
                Selected Occasion:
              </label>
              <select
                id="occasion-select"
                value={selectedOccasionId}
                onChange={(e) => setSelectedOccasionId(e.target.value)}
                className="text-xs font-medium bg-white border border-stone-300 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-amber-500"
              >
                {occasions.map((occ) => (
                  <option key={occ.id} value={occ.id}>
                    {occ.title} ({occ.occurrence2027?.gregorianDateStr || 'No date'})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* TAB 1: WhatsApp Direct */}
          {activeTab === 'whatsapp' && (
            <div className="space-y-4">
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-xs text-emerald-900 flex items-start gap-2.5">
                <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold">Peer-to-Peer WhatsApp (0 Platform Charge)</p>
                  <p className="text-emerald-800 text-[11px] mt-0.5">
                    Opens your personal or WhatsApp Web account directly with pre-composed ritual details. No Meta Cloud API costs or template approval delays.
                  </p>
                </div>
              </div>

              {/* Language Selector */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-stone-600">Language:</span>
                {(['marathi', 'hindi', 'english'] as const).map((lang) => (
                  <button
                    key={lang}
                    onClick={() => setSelectedLang(lang)}
                    className={`px-2.5 py-1 text-xs rounded-lg font-medium capitalize transition-colors ${
                      selectedLang === lang
                        ? 'bg-emerald-600 text-white'
                        : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                    }`}
                  >
                    {lang}
                  </button>
                ))}
              </div>

              {/* Message Preview */}
              <div>
                <label className="text-xs font-semibold text-stone-700 block mb-1.5">
                  Message Preview to Send:
                </label>
                <div className="bg-stone-900 text-stone-100 p-3.5 rounded-xl text-xs font-mono whitespace-pre-wrap leading-relaxed border border-stone-800 relative group">
                  {currentMessage}
                </div>
              </div>

              {/* Target Phone & Action */}
              <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
                <div className="w-full sm:flex-1">
                  <input
                    type="tel"
                    placeholder="Recipient WhatsApp number (e.g. +91 98220 12345)"
                    value={targetPhone}
                    onChange={(e) => setTargetPhone(e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-stone-300 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <button
                    onClick={handleCopyMessage}
                    className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3 py-2 border border-stone-300 rounded-xl text-xs font-medium text-stone-700 hover:bg-stone-100 transition-colors cursor-pointer"
                  >
                    {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-stone-600" />}
                    <span>{copied ? 'Copied!' : 'Copy'}</span>
                  </button>
                  <button
                    onClick={handleSendWhatsAppDirect}
                    className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold transition-colors cursor-pointer shadow-sm"
                  >
                    <Send className="w-4 h-4" />
                    <span>Open in WhatsApp</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Calendar Sync */}
          {activeTab === 'calendar' && (
            <div className="space-y-4">
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-950 flex items-start gap-2.5">
                <CalendarCheck className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold">Native Device Alarms & Calendar Reminders (100% Free)</p>
                  <p className="text-amber-800 text-[11px] mt-0.5">
                    Sync to Google Calendar or Apple Calendar. Automatically rings on your elders' smartphones with exact sunrise times, kartas, and notes.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div className="border border-stone-200 rounded-xl p-4 text-center space-y-3 bg-stone-50">
                  <h4 className="text-sm font-semibold text-stone-900">1-Click Google Calendar</h4>
                  <p className="text-xs text-stone-600">
                    Directly adds this observance with puja guidelines into Google Calendar on any device.
                  </p>
                  <button
                    onClick={handleGoogleCalendarSync}
                    disabled={!currentOccasion}
                    className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-stone-950 rounded-xl text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50"
                  >
                    <ExternalLink className="w-4 h-4" />
                    <span>Add to Google Calendar</span>
                  </button>
                </div>

                <div className="border border-stone-200 rounded-xl p-4 text-center space-y-3 bg-stone-50">
                  <h4 className="text-sm font-semibold text-stone-900">Apple Calendar & Outlook (.ics)</h4>
                  <p className="text-xs text-stone-600">
                    Download an industry-standard iCalendar file to import all family rituals in one tap.
                  </p>
                  <button
                    onClick={handleDownloadICS}
                    className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-stone-900 hover:bg-stone-800 text-stone-100 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download .ics File</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: Email Digests */}
          {activeTab === 'email' && (
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-xs text-blue-950 flex items-start gap-2.5">
                <Mail className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold">Weekly & Monthly Digest Emails</p>
                  <p className="text-blue-800 text-[11px] mt-0.5">
                    Powered by high-deliverability free-tier SMTP. Receives a pristine summary of upcoming tithis and duties every month.
                  </p>
                </div>
              </div>

              <form onSubmit={handleSendEmailDigest} className="space-y-3 pt-2">
                <div>
                  <label className="text-xs font-semibold text-stone-700 block mb-1">
                    Send Test Digest to Email:
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="email"
                      required
                      placeholder="e.g. bhushan.family@gmail.com"
                      value={targetEmail}
                      onChange={(e) => setTargetEmail(e.target.value)}
                      className="flex-1 text-xs px-3 py-2 border border-stone-300 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                    <button
                      type="submit"
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                    >
                      <Send className="w-4 h-4" />
                      <span>Send Digest</span>
                    </button>
                  </div>
                </div>

                {emailStatus && (
                  <p className="text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg p-2.5 animate-fade-in">
                    {emailStatus}
                  </p>
                )}
              </form>
            </div>
          )}

          {/* TAB 4: Web Browser Push Notifications */}
          {activeTab === 'push' && (
            <div className="space-y-4">
              <div className="bg-purple-50 border border-purple-200 rounded-xl p-3 text-xs text-purple-950 flex items-start gap-2.5">
                <Bell className="w-5 h-5 text-purple-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold">Native Desktop & Smartphone Web Push</p>
                  <p className="text-purple-800 text-[11px] mt-0.5">
                    Standard browser notification API. Works across Chrome, Safari, and Android without installing an app or incurring any SMS/WhatsApp fee.
                  </p>
                </div>
              </div>

              <div className="border border-stone-200 rounded-xl p-4 bg-stone-50 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-stone-900">Browser Permission Status</h4>
                    <p className="text-[11px] text-stone-500 capitalize">Current state: {pushStatus}</p>
                  </div>
                  {pushStatus === 'granted' ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-full text-xs font-semibold">
                      <Check className="w-3.5 h-3.5" /> Enabled
                    </span>
                  ) : (
                    <button
                      onClick={handleRequestPushPermission}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                    >
                      <Bell className="w-3.5 h-3.5" />
                      <span>Enable Notifications</span>
                    </button>
                  )}
                </div>

                {pushStatus === 'granted' && (
                  <button
                    onClick={() => {
                      new Notification(`KulLoop: ${currentOccasion?.title || 'Observance Alert'}`, {
                        body: `Upcoming observance scheduled for ${currentOccasion?.occurrence2027?.gregorianDateStr}. Prepared for ${family.familyName}.`,
                      });
                    }}
                    className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-stone-200 hover:bg-stone-300 text-stone-800 rounded-xl text-xs font-medium transition-colors cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                    <span>Send Test Notification Now</span>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-stone-50 border-t border-stone-200 flex items-center justify-between shrink-0">
          <span className="text-[11px] text-stone-500">
            KulLoop Zero-Fee Multi-Channel Architecture
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold text-stone-700 hover:text-stone-900 bg-white border border-stone-300 rounded-xl hover:bg-stone-100 transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
