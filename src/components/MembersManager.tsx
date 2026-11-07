import React, { useState } from 'react';
import { 
  Member, 
  LanguageCode, 
  Family,
  FamilyMemberRole,
  RitualReminderCategory, 
  MemberReminderPreferences,
  CategoryReminderConfig 
} from '../types';
import { 
  Users, 
  UserPlus, 
  Smartphone, 
  Globe, 
  Clock, 
  ShieldCheck, 
  PauseCircle, 
  PlayCircle, 
  Trash2,
  CheckCircle2,
  Check,
  GitBranch,
  Bell,
  Mail,
  Sliders,
  X,
  Sparkles,
  RotateCcw,
  Volume2,
  Info,
  Calendar,
  AlertCircle
} from 'lucide-react';

interface MembersManagerProps {
  members: Member[];
  family: Family;
  onAddMember: (member: Member) => void;
  onUpdateMember: (member: Member) => void;
  onDeleteMember: (id: string) => void;
  onNavigateToTree?: () => void;
  familyAccess?: import('../utils/familyPermissions').FamilyAccess;
}

// Categories definition with descriptions
interface CategoryMetadata {
  key: RitualReminderCategory;
  title: string;
  devanagari: string;
  description: string;
  recommended: { whatsapp: boolean; email: boolean; push: boolean };
}

const RITUAL_CATEGORIES: CategoryMetadata[] = [
  {
    key: 'shraddha',
    title: 'Ancestral Shraddhas',
    devanagari: 'श्राद्ध व पितृपक्ष',
    description: 'Annual death anniversaries, Mahalaya Pitru Paksha, and Gau-grasa reminders.',
    recommended: { whatsapp: true, email: true, push: true },
  },
  {
    key: 'birthday',
    title: 'Tithi Birthdays',
    devanagari: 'तिथी वाढदिवस',
    description: 'Lunar sunrise tithi birthdays for family elders and children.',
    recommended: { whatsapp: true, email: false, push: true },
  },
  {
    key: 'vrat_kuldevta',
    title: 'Vrats & Kuldevta',
    devanagari: 'व्रत व कुलदैवत',
    description: 'Monthly Sankashti, Ekadashis, Khandoba / Champa Shashthi observances.',
    recommended: { whatsapp: true, email: false, push: false },
  },
  {
    key: 'festival',
    title: 'Major Festivals',
    devanagari: 'सण व उत्सव',
    description: 'Ganesh Chaturthi, Diwali, Gudi Padwa, and family vrat traditions.',
    recommended: { whatsapp: true, email: true, push: false },
  },
  {
    key: 'milestone',
    title: 'Family Milestones',
    devanagari: 'संस्कार व विशेष',
    description: 'Munj / Thread ceremony anniversaries and sacred life-stage rites.',
    recommended: { whatsapp: true, email: true, push: true },
  },
];

// Default helper
const getInitialPreferences = (member: Member): MemberReminderPreferences => {
  if (member.reminderPreferences) {
    return JSON.parse(JSON.stringify(member.reminderPreferences));
  }
  return {
    emailAddress: member.email || '',
    pushEnabled: true,
    categories: {
      shraddha: { whatsapp: true, email: true, push: true },
      birthday: { whatsapp: true, email: false, push: true },
      vrat_kuldevta: { whatsapp: true, email: false, push: false },
      festival: { whatsapp: true, email: true, push: false },
      milestone: { whatsapp: true, email: true, push: true },
    },
  };
};

export const MembersManager: React.FC<MembersManagerProps> = ({
  members,
  family,
  onAddMember,
  onUpdateMember,
  onDeleteMember,
  onNavigateToTree,
  familyAccess,
}) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [viewMode, setViewMode] = useState<'cards' | 'matrix'>('cards');

  // Reminders settings panel state
  const [selectedMemberForReminders, setSelectedMemberForReminders] = useState<Member | null>(null);
  const [activePreferences, setActivePreferences] = useState<MemberReminderPreferences | null>(null);
  const [editingEmail, setEditingEmail] = useState('');
  const [testNotificationToast, setTestNotificationToast] = useState<string | null>(null);

  // New member form state
  const [name, setName] = useState('');
  const [relationship, setRelationship] = useState('');
  const [familyRole, setFamilyRole] = useState<FamilyMemberRole>('member');
  const [phone, setPhone] = useState('+91 ');
  const [email, setEmail] = useState('');
  const [language, setLanguage] = useState<LanguageCode>('mr');
  const [country, setCountry] = useState('India');
  const [city, setCity] = useState('Pune');
  const [timeZone, setTimeZone] = useState('Asia/Kolkata');
  const [leadTime, setLeadTime] = useState<'7+2' | '7' | '2' | 'day_of'>('7+2');
  const [digestPreference, setDigestPreference] = useState<'individual' | 'weekly_digest' | 'monthly_digest'>('individual');
  const [frequencyCap, setFrequencyCap] = useState(2);

  const handleCountryChange = (c: string) => {
    setCountry(c);
    if (c === 'India') {
      setTimeZone('Asia/Kolkata');
      setPhone('+91 ');
    } else if (c === 'Canada' || c === 'USA') {
      setTimeZone('America/Toronto');
      setPhone('+1 ');
      setLanguage('en');
    } else if (c === 'UK') {
      setTimeZone('Europe/London');
      setPhone('+44 ');
      setLanguage('en');
    } else if (c === 'UAE') {
      setTimeZone('Asia/Dubai');
      setPhone('+971 ');
    }
  };

  const handleCreateMember = (e: React.FormEvent) => {
    e.preventDefault();
    const newMember: Member = {
      id: `mem_${Date.now()}`,
      familyId: family.id,
      familyRole,
      name,
      relationship,
      phone,
      email: email.trim() || undefined,
      language,
      country,
      city,
      timeZone,
      optIns: 'all',
      leadTime,
      receiveDayOfNote: true,
      digestPreference,
      frequencyCapPerWeek: frequencyCap,
      status: 'active',
      reminderPreferences: {
        emailAddress: email.trim() || undefined,
        pushEnabled: true,
        categories: {
          shraddha: { whatsapp: true, email: !!email.trim(), push: true },
          birthday: { whatsapp: true, email: false, push: true },
          vrat_kuldevta: { whatsapp: true, email: false, push: false },
          festival: { whatsapp: true, email: !!email.trim(), push: false },
          milestone: { whatsapp: true, email: !!email.trim(), push: true },
        },
      },
    };

    onAddMember(newMember);
    setShowAddForm(false);
    setName('');
    setRelationship('');
    setEmail('');
  };

  const togglePause = (member: Member) => {
    onUpdateMember({
      ...member,
      status: member.status === 'active' ? 'paused' : 'active',
    });
  };

  // Open Reminders Settings Panel
  const handleOpenReminders = (member: Member) => {
    setSelectedMemberForReminders(member);
    const prefs = getInitialPreferences(member);
    setActivePreferences(prefs);
    setEditingEmail(member.email || prefs.emailAddress || '');
  };

  // Close Reminders Panel
  const handleCloseReminders = () => {
    setSelectedMemberForReminders(null);
    setActivePreferences(null);
  };

  // Toggle single category channel
  const handleToggleChannel = (categoryKey: RitualReminderCategory, channel: 'whatsapp' | 'email' | 'push') => {
    if (!activePreferences) return;

    const currentVal = activePreferences.categories[categoryKey][channel];
    setActivePreferences({
      ...activePreferences,
      categories: {
        ...activePreferences.categories,
        [categoryKey]: {
          ...activePreferences.categories[categoryKey],
          [channel]: !currentVal,
        },
      },
    });
  };

  // Toggle whole category (all channels on/off)
  const handleToggleCategoryAll = (categoryKey: RitualReminderCategory) => {
    if (!activePreferences) return;
    const cat = activePreferences.categories[categoryKey];
    const allEnabled = cat.whatsapp && cat.email && cat.push;

    setActivePreferences({
      ...activePreferences,
      categories: {
        ...activePreferences.categories,
        [categoryKey]: {
          whatsapp: !allEnabled,
          email: !allEnabled,
          push: !allEnabled,
        },
      },
    });
  };

  // Bulk toggles across all categories
  const handleBulkChannelToggle = (channel: 'whatsapp' | 'email' | 'push', enable: boolean) => {
    if (!activePreferences) return;
    const updated = { ...activePreferences.categories };
    RITUAL_CATEGORIES.forEach((cat) => {
      updated[cat.key] = {
        ...updated[cat.key],
        [channel]: enable,
      };
    });
    setActivePreferences({
      ...activePreferences,
      categories: updated,
    });
  };

  // Reset to recommended defaults
  const handleResetDefaults = () => {
    if (!activePreferences) return;
    const resetCategories: Record<RitualReminderCategory, CategoryReminderConfig> = {
      shraddha: { whatsapp: true, email: true, push: true },
      birthday: { whatsapp: true, email: false, push: true },
      vrat_kuldevta: { whatsapp: true, email: false, push: false },
      festival: { whatsapp: true, email: true, push: false },
      milestone: { whatsapp: true, email: true, push: true },
    };
    setActivePreferences({
      ...activePreferences,
      categories: resetCategories,
      pushEnabled: true,
    });
  };

  // Save Reminders Preferences
  const handleSaveReminders = () => {
    if (!selectedMemberForReminders || !activePreferences) return;

    const updatedMember: Member = {
      ...selectedMemberForReminders,
      email: editingEmail.trim() || undefined,
      reminderPreferences: {
        ...activePreferences,
        emailAddress: editingEmail.trim() || undefined,
      },
    };

    onUpdateMember(updatedMember);
    handleCloseReminders();
  };

  // Test Push Notification trigger
  const handleSendTestPush = (categoryName: string) => {
    const text = `🔔 Push Notification Test: ${selectedMemberForReminders?.name || 'Member'} — ${categoryName} reminder delivered accurately for ${family.homeLocation} sunrise.`;
    setTestNotificationToast(text);

    // Try browser Notification API if allowed
    if ('Notification' in window) {
      if (Notification.permission === 'granted') {
        try {
          new Notification('KulLoop Heritage Reminder', {
            body: text,
            icon: '/favicon.ico',
          });
        } catch {
          // ignore
        }
      } else if (Notification.permission !== 'denied') {
        Notification.requestPermission();
      }
    }

    setTimeout(() => {
      setTestNotificationToast(null);
    }, 4500);
  };

  return (
    <div className="space-y-6">
      {/* Test Notification Toast */}
      {testNotificationToast && (
        <div className="fixed top-20 right-6 z-50 max-w-md bg-stone-900 text-white p-4 rounded-2xl shadow-2xl border border-stone-800 flex items-start gap-3 animate-fade-in">
          <div className="w-8 h-8 rounded-full bg-amber-400 text-stone-950 flex items-center justify-center shrink-0 font-bold">
            <Bell className="w-4 h-4 text-stone-950" />
          </div>
          <div className="text-xs space-y-1">
            <div className="font-bold text-amber-300">Live Notification Dispatched</div>
            <p className="text-stone-300">{testNotificationToast}</p>
          </div>
          <button
            onClick={() => setTestNotificationToast(null)}
            className="text-stone-500 hover:text-white p-1 rounded"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-stone-900 font-serif-display">
            Family Members & Delivery Loop (कुटुंब सदस्य)
          </h2>
          <p className="text-xs text-stone-500 mt-1">
            Manage WhatsApp, Email, and Push notification channels across Shraddha, Birthday, and Festival categories.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          {/* View toggle */}
          <div className="flex items-center p-0.5 bg-stone-100 rounded-lg border border-stone-200">
            <button
              type="button"
              onClick={() => setViewMode('cards')}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                viewMode === 'cards' ? 'bg-white text-stone-900 shadow-2xs' : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Directory Cards
            </button>
            <button
              type="button"
              onClick={() => setViewMode('matrix')}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                viewMode === 'matrix' ? 'bg-white text-stone-900 shadow-2xs' : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Reminders Matrix
            </button>
          </div>

          {onNavigateToTree && (
            <button
              onClick={onNavigateToTree}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-stone-700 hover:text-stone-900 bg-stone-100 hover:bg-stone-200 border border-stone-200 rounded-lg transition-colors cursor-pointer"
            >
              <GitBranch className="w-3.5 h-3.5 text-amber-700" />
              <span>Family Tree</span>
            </button>
          )}

          {(familyAccess?.canManageMembers ?? true) && (
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-stone-900 bg-amber-400 hover:bg-amber-300 rounded-lg transition-colors shadow-2xs cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>{showAddForm ? 'Close Form' : 'Invite Member'}</span>
          </button>
          )}
        </div>
      </div>

      {/* Add Member Form Drawer / Card */}
      {showAddForm && (
        <form onSubmit={handleCreateMember} className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-stone-100">
            <h3 className="text-sm font-bold text-stone-900">
              Invite Member to WhatsApp & Multi-Channel Tithi Loop
            </h3>
            <span className="text-xs text-stone-400">Configured with intelligent category defaults</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-medium text-stone-700">Full Name</label>
              <input
                type="text"
                required
                placeholder="e.g. Family member name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-1.5 text-xs bg-stone-50 border border-stone-300 rounded-lg"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-stone-700">Relationship</label>
              <input
                type="text"
                required
                placeholder="e.g. Daughter, Elder Aunt, Brother"
                value={relationship}
                onChange={(e) => setRelationship(e.target.value)}
                className="w-full px-3 py-1.5 text-xs bg-stone-50 border border-stone-300 rounded-lg"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-stone-700">Family role</label>
              <select
                value={familyRole}
                onChange={(e) => setFamilyRole(e.target.value as FamilyMemberRole)}
                className="w-full px-3 py-1.5 text-xs bg-stone-50 border border-stone-300 rounded-lg"
              >
                <option value="configurator">Configurator (full control)</option>
                <option value="co_karta">Co-karta (rituals)</option>
                <option value="member">Member (reminders)</option>
                <option value="viewer">Viewer (read-only)</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-stone-700">WhatsApp Phone</label>
              <input
                type="text"
                required
                placeholder="+91 98221 00000"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3 py-1.5 text-xs bg-stone-50 border border-stone-300 rounded-lg"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-stone-700">Email Address (Optional)</label>
              <input
                type="email"
                placeholder="e.g. sunita@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-1.5 text-xs bg-stone-50 border border-stone-300 rounded-lg"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-medium text-stone-700">Reminder Language</label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value as LanguageCode)}
                className="w-full px-3 py-1.5 text-xs bg-stone-50 border border-stone-300 rounded-lg"
              >
                <option value="mr">Marathi (मराठी)</option>
                <option value="hi">Hindi (हिंदी)</option>
                <option value="en">English</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-stone-700">Country of Residence</label>
              <select
                value={country}
                onChange={(e) => handleCountryChange(e.target.value)}
                className="w-full px-3 py-1.5 text-xs bg-stone-50 border border-stone-300 rounded-lg"
              >
                <option value="India">India</option>
                <option value="Canada">Canada</option>
                <option value="USA">USA</option>
                <option value="UK">United Kingdom</option>
                <option value="UAE">UAE</option>
                <option value="Australia">Australia</option>
                <option value="Singapore">Singapore</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-stone-700">City / Region</label>
              <input
                type="text"
                placeholder="e.g. Toronto, Mumbai"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full px-3 py-1.5 text-xs bg-stone-50 border border-stone-300 rounded-lg"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-stone-700">Reminder Lead Time</label>
              <select
                value={leadTime}
                onChange={(e) => setLeadTime(e.target.value as any)}
                className="w-full px-3 py-1.5 text-xs bg-stone-50 border border-stone-300 rounded-lg"
              >
                <option value="7+2">7 Days & 2 Days Before (Suggested)</option>
                <option value="7">7 Days Only</option>
                <option value="2">2 Days Only</option>
                <option value="day_of">Day-Of Note Only</option>
              </select>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="px-3 py-1.5 text-xs text-stone-600 hover:text-stone-800 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold text-stone-900 bg-amber-400 hover:bg-amber-300 rounded-lg shadow-2xs cursor-pointer"
            >
              Add Member to Family Loop
            </button>
          </div>
        </form>
      )}

      {/* MATRIX VIEW */}
      {viewMode === 'matrix' && (
        <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-2xs">
          <div className="p-4 border-b border-stone-200 bg-stone-50/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-bold text-stone-900 text-sm flex items-center gap-2">
                <Sliders className="w-4 h-4 text-amber-700" />
                <span>Multi-Member Category Reminders Matrix</span>
              </h3>
              <p className="text-xs text-stone-500 mt-0.5">
                Overview of enabled notification channels (WhatsApp / Email / Push) across ritual categories for each member.
              </p>
            </div>
            <div className="flex items-center gap-4 text-xs">
              <span className="flex items-center gap-1.5 text-stone-600">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> WhatsApp (WA)
              </span>
              <span className="flex items-center gap-1.5 text-stone-600">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span> Email (EM)
              </span>
              <span className="flex items-center gap-1.5 text-stone-600">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span> Push (PS)
              </span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-stone-100/70 text-stone-600 border-b border-stone-200">
                <tr>
                  <th className="py-3 px-4 font-semibold text-stone-800">Member</th>
                  <th className="py-3 px-3 font-semibold text-stone-800">Shraddha Rites</th>
                  <th className="py-3 px-3 font-semibold text-stone-800">Tithi Birthdays</th>
                  <th className="py-3 px-3 font-semibold text-stone-800">Vrats & Kuldevta</th>
                  <th className="py-3 px-3 font-semibold text-stone-800">Major Festivals</th>
                  <th className="py-3 px-3 font-semibold text-stone-800">Milestones</th>
                  <th className="py-3 px-4 font-semibold text-stone-800 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {members.map((member) => {
                  const prefs = getInitialPreferences(member);

                  return (
                    <tr key={member.id} className="hover:bg-stone-50/70 transition-colors">
                      <td className="py-3.5 px-4 font-medium text-stone-900">
                        <div className="font-bold text-xs">{member.name}</div>
                        <div className="text-[11px] text-stone-500 flex flex-wrap items-center gap-1.5">
                          <span>{member.relationship}</span>
                          {member.familyRole && (
                            <span className="text-[10px] font-semibold text-amber-900 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded">
                              {member.familyRole.replace('_', ' ')}
                            </span>
                          )}
                        </div>
                      </td>

                      {RITUAL_CATEGORIES.map((cat) => {
                        const config = prefs.categories[cat.key];
                        return (
                          <td key={cat.key} className="py-3.5 px-3">
                            <div className="flex items-center gap-1 text-[11px] font-mono">
                              <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                                config?.whatsapp ? 'bg-emerald-100 text-emerald-800' : 'bg-stone-100 text-stone-400 opacity-40'
                              }`}>
                                WA
                              </span>
                              <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                                config?.email ? 'bg-amber-100 text-amber-900' : 'bg-stone-100 text-stone-400 opacity-40'
                              }`}>
                                EM
                              </span>
                              <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                                config?.push ? 'bg-blue-100 text-blue-900' : 'bg-stone-100 text-stone-400 opacity-40'
                              }`}>
                                PS
                              </span>
                            </div>
                          </td>
                        );
                      })}

                      <td className="py-3.5 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => handleOpenReminders(member)}
                          className="px-2.5 py-1 text-xs font-semibold text-amber-950 bg-amber-100 hover:bg-amber-200 rounded-lg transition-colors cursor-pointer"
                        >
                          Configure
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CARDS VIEW */}
      {viewMode === 'cards' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {members.map((member) => {
            const prefs = getInitialPreferences(member);

            // Calculate active count of channels across categories
            const cats = Object.values(prefs.categories);
            const waCount = cats.filter((c) => c.whatsapp).length;
            const emCount = cats.filter((c) => c.email).length;
            const psCount = cats.filter((c) => c.push).length;

            return (
              <div
                key={member.id}
                className={`bg-white rounded-2xl border p-5 shadow-sm transition-all flex flex-col justify-between space-y-4 ${
                  member.status === 'paused'
                    ? 'border-stone-200 opacity-70 bg-stone-50/50'
                    : 'border-stone-200 hover:border-amber-300'
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-900 flex items-center justify-center font-bold text-sm shrink-0">
                        {member.name.charAt(0)}
                      </div>
                      <div>
                        <h3 className="font-bold text-stone-900 text-sm">
                          {member.name}
                        </h3>
                        <p className="text-xs text-stone-500">
                          {member.relationship}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 text-xs">
                      {member.status === 'active' ? (
                        <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                          Active
                        </span>
                      ) : (
                        <span className="text-[11px] font-semibold text-amber-800 bg-amber-50 px-2 py-0.5 rounded">
                          Paused
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Delivery specifications */}
                  <div className="p-3 bg-stone-50 rounded-xl border border-stone-100 text-xs space-y-1.5">
                    <div className="flex items-center justify-between text-stone-700">
                      <span className="text-stone-500">WhatsApp:</span>
                      <span className="font-mono text-stone-900">{member.phone}</span>
                    </div>

                    {member.email && (
                      <div className="flex items-center justify-between text-stone-700">
                        <span className="text-stone-500">Email:</span>
                        <span className="font-mono text-stone-900">{member.email}</span>
                      </div>
                    )}

                    <div className="flex items-center justify-between text-stone-700">
                      <span className="text-stone-500">Language:</span>
                      <span className="font-semibold text-amber-900">
                        {member.language === 'mr' ? 'मराठी (Marathi)' : member.language === 'hi' ? 'हिंदी (Hindi)' : 'English'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-stone-700">
                      <span className="text-stone-500">Location & Timezone:</span>
                      <span>{member.city}, {member.country} ({member.timeZone.split('/')[1] || member.timeZone})</span>
                    </div>

                    <div className="flex items-center justify-between text-stone-700">
                      <span className="text-stone-500">Cadence & Cap:</span>
                      <span>Lead: {member.leadTime} days · Max {member.frequencyCapPerWeek}/wk</span>
                    </div>
                  </div>

                  {/* Channel Preferences Strip */}
                  <div className="p-2.5 bg-stone-100/60 rounded-xl border border-stone-200/80 flex items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-stone-500 font-medium">Channels:</span>
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-800 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded">
                        <Smartphone className="w-3 h-3 text-emerald-600" />
                        <span>WA: {waCount}/5</span>
                      </span>
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-900 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded">
                        <Mail className="w-3 h-3 text-amber-700" />
                        <span>Email: {emCount}/5</span>
                      </span>
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-blue-900 bg-blue-50 border border-blue-200 px-1.5 py-0.5 rounded">
                        <Bell className="w-3 h-3 text-blue-700" />
                        <span>Push: {psCount}/5</span>
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleOpenReminders(member)}
                      className="px-2.5 py-1 text-xs font-semibold text-stone-900 bg-amber-400 hover:bg-amber-300 rounded-lg transition-colors cursor-pointer shadow-2xs flex items-center gap-1"
                    >
                      <Sliders className="w-3 h-3" />
                      <span>Reminders</span>
                    </button>
                  </div>

                  {member.country !== 'India' && (
                    <div className="text-[11px] text-blue-800 bg-blue-50/70 p-2 rounded-lg border border-blue-100">
                      🌐 <strong>Abroad Safety:</strong> Displays Pune home date with local sensible delivery hour.
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="pt-3 border-t border-stone-100 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => togglePause(member)}
                      className="text-xs font-medium text-stone-600 hover:text-stone-900 inline-flex items-center gap-1 cursor-pointer"
                    >
                      {member.status === 'active' ? (
                        <>
                          <PauseCircle className="w-3.5 h-3.5" />
                          <span>Pause Reminders</span>
                        </>
                      ) : (
                        <>
                          <PlayCircle className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Resume Reminders</span>
                        </>
                      )}
                    </button>

                    <button
                      onClick={() => handleOpenReminders(member)}
                      className="text-xs font-medium text-amber-800 hover:text-amber-950 inline-flex items-center gap-1 cursor-pointer"
                    >
                      <Bell className="w-3.5 h-3.5 text-amber-600" />
                      <span>Settings</span>
                    </button>
                  </div>

                  <button
                    onClick={() => onDeleteMember(member.id)}
                    className="text-stone-400 hover:text-rose-600 p-1 rounded cursor-pointer"
                    title="Remove member"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* REMINDERS SETTINGS PANEL (MODAL) */}
      {selectedMemberForReminders && activePreferences && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-stone-950/70 backdrop-blur-sm">
          <div className="bg-white rounded-2xl border border-stone-200 shadow-2xl max-w-2xl w-full max-h-[92vh] flex flex-col overflow-hidden animate-fade-in">
            {/* Header */}
            <div className="bg-stone-900 text-white px-5 py-4 flex items-center justify-between shrink-0 border-b border-stone-800">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-amber-400 text-stone-950 flex items-center justify-center font-bold text-sm">
                  <Bell className="w-5 h-5 text-stone-950" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-amber-200 font-serif-display">
                    Reminders Settings: {selectedMemberForReminders.name}
                  </h3>
                  <p className="text-xs text-stone-400">
                    {selectedMemberForReminders.relationship} · {selectedMemberForReminders.city}, {selectedMemberForReminders.country}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleCloseReminders}
                className="p-1 text-stone-400 hover:text-white rounded-md cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Content Body */}
            <div className="flex-1 p-5 overflow-y-auto space-y-6 text-xs leading-relaxed bg-stone-50/50">
              {/* Contact Destination Settings */}
              <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-2xs space-y-3">
                <h4 className="font-bold text-xs text-stone-800 uppercase tracking-wider flex items-center gap-1.5">
                  <Smartphone className="w-3.5 h-3.5 text-stone-600" />
                  <span>Delivery Destinations for this Member</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                  <div>
                    <label className="text-[11px] font-semibold text-stone-600 block mb-1">
                      WhatsApp Number
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        disabled
                        value={selectedMemberForReminders.phone}
                        className="w-full px-3 py-1.5 text-xs bg-stone-100 border border-stone-200 rounded-lg text-stone-700 font-mono"
                      />
                      <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-1 rounded border border-emerald-200 whitespace-nowrap font-medium">
                        Verified
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-stone-600 block mb-1">
                      Email Address (for Ritual Calendars & Notes)
                    </label>
                    <input
                      type="email"
                      placeholder="e.g. member@family.org"
                      value={editingEmail}
                      onChange={(e) => setEditingEmail(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs bg-white border border-stone-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500 text-stone-900"
                    />
                  </div>
                </div>

                {/* Push Notification status */}
                <div className="pt-2 border-t border-stone-100 flex items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-stone-700">Push Notifications:</span>
                    <span className="text-stone-500">Instant device alerts for impending tithis</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleSendTestPush('Ancestral Shraddha')}
                    className="px-2.5 py-1 text-[11px] font-medium text-blue-900 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors cursor-pointer flex items-center gap-1"
                  >
                    <Volume2 className="w-3 h-3 text-blue-700" />
                    <span>Send Test Push</span>
                  </button>
                </div>
              </div>

              {/* Category Preferences Matrix */}
              <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-2xs space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-stone-100">
                  <div>
                    <h4 className="font-bold text-xs text-stone-800 uppercase tracking-wider flex items-center gap-1.5">
                      <Sliders className="w-3.5 h-3.5 text-stone-600" />
                      <span>Ritual Categories Channel Matrix</span>
                    </h4>
                    <p className="text-[11px] text-stone-500 mt-0.5">
                      Toggle WhatsApp, Email, or Push alerts for each specific type of observance.
                    </p>
                  </div>

                  {/* Bulk toggles */}
                  <div className="flex items-center gap-2 text-[11px]">
                    <button
                      type="button"
                      onClick={() => handleBulkChannelToggle('whatsapp', true)}
                      className="text-stone-600 hover:text-stone-900 underline cursor-pointer"
                    >
                      All WA
                    </button>
                    <span className="text-stone-300">·</span>
                    <button
                      type="button"
                      onClick={() => handleBulkChannelToggle('email', true)}
                      className="text-stone-600 hover:text-stone-900 underline cursor-pointer"
                    >
                      All Email
                    </button>
                    <span className="text-stone-300">·</span>
                    <button
                      type="button"
                      onClick={() => handleBulkChannelToggle('push', true)}
                      className="text-stone-600 hover:text-stone-900 underline cursor-pointer"
                    >
                      All Push
                    </button>
                    <span className="text-stone-300">·</span>
                    <button
                      type="button"
                      onClick={handleResetDefaults}
                      className="text-amber-800 hover:text-amber-950 font-medium cursor-pointer"
                      title="Reset to recommended cultural defaults"
                    >
                      Recommended
                    </button>
                  </div>
                </div>

                {/* Table of categories */}
                <div className="space-y-3 pt-1">
                  {RITUAL_CATEGORIES.map((category) => {
                    const cfg = activePreferences.categories[category.key];
                    const isAllSelected = cfg.whatsapp && cfg.email && cfg.push;

                    return (
                      <div
                        key={category.key}
                        className="p-3.5 rounded-xl border border-stone-200/80 bg-stone-50/50 hover:bg-stone-50 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                      >
                        <div className="space-y-0.5 max-w-sm">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-stone-900 text-xs">
                              {category.title}
                            </span>
                            <span className="font-devanagari text-amber-950 text-xs font-medium">
                              ({category.devanagari})
                            </span>
                          </div>
                          <p className="text-[11px] text-stone-500">
                            {category.description}
                          </p>
                        </div>

                        {/* Channel Toggles */}
                        <div className="flex items-center gap-2 shrink-0">
                          {/* WhatsApp Toggle */}
                          <button
                            type="button"
                            onClick={() => handleToggleChannel(category.key, 'whatsapp')}
                            className={`px-2.5 py-1.5 rounded-lg text-xs font-medium border flex items-center gap-1.5 transition-all cursor-pointer ${
                              cfg.whatsapp
                                ? 'bg-emerald-50 text-emerald-900 border-emerald-300 shadow-2xs'
                                : 'bg-white text-stone-400 border-stone-200 hover:border-stone-300'
                            }`}
                            title="Toggle WhatsApp Reminder"
                          >
                            <Smartphone className={`w-3.5 h-3.5 ${cfg.whatsapp ? 'text-emerald-600' : 'text-stone-400'}`} />
                            <span>WhatsApp</span>
                            {cfg.whatsapp && <Check className="w-3 h-3 text-emerald-600" />}
                          </button>

                          {/* Email Toggle */}
                          <button
                            type="button"
                            onClick={() => handleToggleChannel(category.key, 'email')}
                            className={`px-2.5 py-1.5 rounded-lg text-xs font-medium border flex items-center gap-1.5 transition-all cursor-pointer ${
                              cfg.email
                                ? 'bg-amber-50 text-amber-900 border-amber-300 shadow-2xs'
                                : 'bg-white text-stone-400 border-stone-200 hover:border-stone-300'
                            }`}
                            title="Toggle Email Reminder"
                          >
                            <Mail className={`w-3.5 h-3.5 ${cfg.email ? 'text-amber-700' : 'text-stone-400'}`} />
                            <span>Email</span>
                            {cfg.email && <Check className="w-3 h-3 text-amber-700" />}
                          </button>

                          {/* Push Toggle */}
                          <button
                            type="button"
                            onClick={() => handleToggleChannel(category.key, 'push')}
                            className={`px-2.5 py-1.5 rounded-lg text-xs font-medium border flex items-center gap-1.5 transition-all cursor-pointer ${
                              cfg.push
                                ? 'bg-blue-50 text-blue-900 border-blue-300 shadow-2xs'
                                : 'bg-white text-stone-400 border-stone-200 hover:border-stone-300'
                            }`}
                            title="Toggle Push Notification"
                          >
                            <Bell className={`w-3.5 h-3.5 ${cfg.push ? 'text-blue-600' : 'text-stone-400'}`} />
                            <span>Push</span>
                            {cfg.push && <Check className="w-3 h-3 text-blue-600" />}
                          </button>

                          {/* Category quick flip */}
                          <button
                            type="button"
                            onClick={() => handleToggleCategoryAll(category.key)}
                            className="text-[10px] text-stone-400 hover:text-stone-700 px-1 py-1 cursor-pointer"
                            title={isAllSelected ? 'Mute all channels for this category' : 'Enable all channels for this category'}
                          >
                            {isAllSelected ? 'Mute' : 'All'}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Cultural Guardrail Notice */}
              <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl flex items-start gap-2.5 text-xs text-amber-900">
                <Info className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <div className="font-bold">KulLoop Calm Delivery Assurance</div>
                  <p className="text-[11px] text-amber-800/90 leading-relaxed">
                    Ancestral Shraddhas are always dispatched with a respectful 7-day and 2-day lead time to ensure adequate preparation of sacred items (darbha grass, black sesame). Minor vrats respect the weekly frequency cap of {selectedMemberForReminders.frequencyCapPerWeek} messages to prevent message fatigue.
                  </p>
                </div>
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="bg-stone-100/80 px-5 py-3 border-t border-stone-200 flex items-center justify-between shrink-0">
              <button
                type="button"
                onClick={handleResetDefaults}
                className="text-xs text-stone-600 hover:text-stone-900 font-medium cursor-pointer inline-flex items-center gap-1"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset Recommended</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCloseReminders}
                  className="px-3.5 py-1.5 text-xs font-medium text-stone-700 hover:text-stone-900 bg-white border border-stone-300 rounded-lg transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveReminders}
                  className="px-4 py-1.5 text-xs font-semibold text-stone-900 bg-amber-400 hover:bg-amber-300 rounded-lg transition-colors shadow-2xs cursor-pointer flex items-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Save Preferences</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
