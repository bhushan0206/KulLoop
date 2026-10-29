import React, { useState } from 'react';
import { Member, LanguageCode, Family } from '../types';
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
  GitBranch
} from 'lucide-react';

interface MembersManagerProps {
  members: Member[];
  family: Family;
  onAddMember: (member: Member) => void;
  onUpdateMember: (member: Member) => void;
  onDeleteMember: (id: string) => void;
  onNavigateToTree?: () => void;
}

export const MembersManager: React.FC<MembersManagerProps> = ({
  members,
  family,
  onAddMember,
  onUpdateMember,
  onDeleteMember,
  onNavigateToTree,
}) => {
  const [showAddForm, setShowAddForm] = useState(false);

  // New member form state
  const [name, setName] = useState('');
  const [relationship, setRelationship] = useState('');
  const [phone, setPhone] = useState('+91 ');
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
      name,
      relationship,
      phone,
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
    };

    onAddMember(newMember);
    setShowAddForm(false);
    setName('');
    setRelationship('');
  };

  const togglePause = (member: Member) => {
    onUpdateMember({
      ...member,
      status: member.status === 'active' ? 'paused' : 'active',
    });
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-stone-900 font-serif-display">
            Family Members & Delivery Loop (कुटुंब सदस्य)
          </h2>
          <p className="text-xs text-stone-500 mt-1">
            Invite family members across India or abroad. Each person gets reminders in their own language on WhatsApp.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {onNavigateToTree && (
            <button
              onClick={onNavigateToTree}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-stone-700 hover:text-stone-900 bg-stone-100 hover:bg-stone-200 border border-stone-200 rounded-lg transition-colors cursor-pointer"
            >
              <GitBranch className="w-3.5 h-3.5 text-amber-700" />
              <span>Visual Family Tree</span>
            </button>
          )}
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-stone-900 bg-amber-400 hover:bg-amber-300 rounded-lg transition-colors shadow-2xs cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>{showAddForm ? 'Close Form' : 'Invite Family Member'}</span>
          </button>
        </div>
      </div>

      {/* Add Member Form Drawer / Card */}
      {showAddForm && (
        <form onSubmit={handleCreateMember} className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-stone-100">
            <h3 className="text-sm font-bold text-stone-900">
              Invite Member to WhatsApp Tithi Loop
            </h3>
            <span className="text-xs text-stone-400">No app install required for them</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-medium text-stone-700">Full Name</label>
              <input
                type="text"
                required
                placeholder="e.g. Sunita Joshi"
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
              <label className="text-xs font-medium text-stone-700">WhatsApp Phone (with Country Code)</label>
              <input
                type="text"
                required
                placeholder="+91 98221 00000"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-medium text-stone-700">Minor Dates Format</label>
              <select
                value={digestPreference}
                onChange={(e) => setDigestPreference(e.target.value as any)}
                className="w-full px-3 py-1.5 text-xs bg-stone-50 border border-stone-300 rounded-lg"
              >
                <option value="individual">Individual WhatsApp messages</option>
                <option value="weekly_digest">Weekly digest for minor dates (Vrats)</option>
                <option value="monthly_digest">Monthly digest</option>
              </select>
              <p className="text-[10px] text-stone-500">Shraddhas are always sent individually.</p>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-stone-700">Weekly Frequency Cap</label>
              <input
                type="number"
                min="1"
                max="5"
                value={frequencyCap}
                onChange={(e) => setFrequencyCap(Number(e.target.value))}
                className="w-full px-3 py-1.5 text-xs bg-stone-50 border border-stone-300 rounded-lg"
              />
              <p className="text-[10px] text-stone-500">Maximum reminder messages sent per week.</p>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="px-3 py-1.5 text-xs text-stone-600 hover:text-stone-800"
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

      {/* Members Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {members.map((member) => (
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

              {member.country !== 'India' && (
                <div className="text-[11px] text-blue-800 bg-blue-50/70 p-2 rounded-lg border border-blue-100">
                  🌐 <strong>Abroad Safety:</strong> Displays Pune home date with local sensible delivery hour.
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="pt-3 border-t border-stone-100 flex items-center justify-between gap-2">
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
                onClick={() => onDeleteMember(member.id)}
                className="text-stone-400 hover:text-rose-600 p-1 rounded cursor-pointer"
                title="Remove member"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
