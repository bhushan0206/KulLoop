import React, { useState, useEffect } from 'react';
import { 
  UserProfile, 
  INTEREST_OPTIONS, 
  CULTURAL_AVATARS, 
  saveUserProfile, 
  fetchCommunityProfiles,
  signInWithGoogle,
  signOutGoogle
} from '../services/firebase';
import { LanguageCode } from '../types';
import { 
  X, 
  User, 
  Upload, 
  Check, 
  Sparkles, 
  Heart, 
  Share2, 
  Users, 
  ShieldCheck, 
  LogIn, 
  LogOut,
  MapPin,
  Tag,
  MessageCircle,
  Globe
} from 'lucide-react';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile;
  onUpdateCurrentUser: (profile: UserProfile) => void;
  onOpenAssistantWithTopic?: (topic: string) => void;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onUpdateCurrentUser,
  onOpenAssistantWithTopic,
}) => {
  const [activeTab, setActiveTab] = useState<'profile' | 'community'>('profile');
  
  // Profile form state
  const [username, setUsername] = useState(currentUser.username);
  const [displayName, setDisplayName] = useState(currentUser.displayName);
  const [bio, setBio] = useState(currentUser.bio || '');
  const [photoURL, setPhotoURL] = useState(currentUser.photoURL || '');
  const [homeLocation, setHomeLocation] = useState(currentUser.homeLocation || 'Pune, Maharashtra');
  const [tradition, setTradition] = useState(currentUser.tradition || 'Amanta');
  const [language, setLanguage] = useState<LanguageCode>(currentUser.language || 'mr');
  const [interests, setInterests] = useState<string[]>(currentUser.interests || []);
  const [customInterest, setCustomInterest] = useState('');
  
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [communityMembers, setCommunityMembers] = useState<UserProfile[]>([]);
  const [selectedInterestFilter, setSelectedInterestFilter] = useState<string>('all');

  useEffect(() => {
    setUsername(currentUser.username);
    setDisplayName(currentUser.displayName);
    setBio(currentUser.bio || '');
    setPhotoURL(currentUser.photoURL || '');
    setHomeLocation(currentUser.homeLocation || 'Pune, Maharashtra');
    setTradition(currentUser.tradition || 'Amanta');
    setLanguage(currentUser.language || 'mr');
    setInterests(currentUser.interests || []);
  }, [currentUser]);

  useEffect(() => {
    if (activeTab === 'community') {
      fetchCommunityProfiles().then((list) => {
        // filter out current user
        setCommunityMembers(list.filter((u) => u.uid !== currentUser.uid));
      });
    }
  }, [activeTab, currentUser.uid]);

  if (!isOpen) return null;

  const toggleInterest = (interest: string) => {
    if (interests.includes(interest)) {
      setInterests(interests.filter((i) => i !== interest));
    } else {
      setInterests([...interests, interest]);
    }
  };

  const handleAddCustomInterest = (e: React.FormEvent) => {
    e.preventDefault();
    if (customInterest.trim() && !interests.includes(customInterest.trim())) {
      setInterests([...interests, customInterest.trim()]);
      setCustomInterest('');
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          setPhotoURL(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    const cleanUsername = username.trim().toLowerCase().replace(/[^a-z0-9_]/g, '');

    const updated: UserProfile = {
      ...currentUser,
      username: cleanUsername || 'user',
      displayName: displayName.trim() || 'KulLoop Member',
      bio: bio.trim(),
      photoURL,
      homeLocation,
      tradition,
      language,
      interests,
      updatedAt: new Date().toISOString(),
    };

    await saveUserProfile(updated);
    onUpdateCurrentUser(updated);
    setIsSaving(false);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  // Filter community members by shared interest
  const filteredCommunity = communityMembers.filter((member) => {
    if (selectedInterestFilter === 'all') return true;
    return member.interests?.includes(selectedInterestFilter);
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/70 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-2xl border border-stone-200 shadow-2xl max-w-2xl w-full p-6 sm:p-8 space-y-6 my-8 max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-stone-200">
          <div>
            <h3 className="text-xl font-bold text-stone-900 font-serif-display">
              User Profile & Heritage Community
            </h3>
            <p className="text-xs text-stone-500 mt-0.5">
              Customize your profile, list your cultural passions, and connect with other families.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-stone-700 rounded-lg cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher: Profile vs Community */}
        <div className="flex items-center gap-2 border-b border-stone-200 pb-2">
          <button
            onClick={() => setActiveTab('profile')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
              activeTab === 'profile'
                ? 'bg-amber-400 text-stone-950 shadow-2xs'
                : 'text-stone-600 hover:bg-stone-100'
            }`}
          >
            My Profile
          </button>
          <button
            onClick={() => setActiveTab('community')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'community'
                ? 'bg-amber-400 text-stone-950 shadow-2xs'
                : 'text-stone-600 hover:bg-stone-100'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Connect with Others ({communityMembers.length})</span>
          </button>
        </div>

        {activeTab === 'profile' ? (
          <form onSubmit={handleSave} className="space-y-6">
            {/* Google Auth Status & Sign-In */}
            <div className="p-3.5 bg-amber-50 rounded-xl border border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="space-y-0.5">
                <span className="font-bold text-amber-950 flex items-center gap-1.5">
                  <LogIn className="w-3.5 h-3.5 text-amber-800" />
                  <span>Google Authentication</span>
                </span>
                <p className="text-[11px] text-amber-900">
                  {currentUser.email ? `Signed in with Google as ${currentUser.email}` : 'Sign in with your Google account to sync your family profile.'}
                </p>
              </div>

              <button
                type="button"
                onClick={async () => {
                  try {
                    if (currentUser.email) {
                      const guestUser = await signOutGoogle();
                      onUpdateCurrentUser(guestUser);
                    } else {
                      const userP = await signInWithGoogle();
                      if (userP) {
                        onUpdateCurrentUser(userP);
                        setSavedSuccess(true);
                        setTimeout(() => setSavedSuccess(false), 3000);
                      }
                    }
                  } catch (err: any) {
                    console.info('[Google Sign-in status]:', err?.message || err);
                  }
                }}
                className="inline-flex items-center justify-center gap-2 px-3.5 py-1.5 text-xs font-semibold text-stone-900 bg-white hover:bg-stone-100 border border-stone-300 rounded-lg shadow-2xs transition-colors cursor-pointer shrink-0"
              >
                {currentUser.email ? (
                  <>
                    <LogOut className="w-3.5 h-3.5 text-rose-600" />
                    <span>Sign Out</span>
                  </>
                ) : (
                  <>
                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                    </svg>
                    <span>Sign in with Google</span>
                  </>
                )}
              </button>
            </div>
            {/* Avatar & Photo Picker */}
            <div className="space-y-3">
              <label className="text-xs font-semibold text-stone-700 uppercase tracking-wider block">
                Profile Picture or Cultural Avatar
              </label>

              <div className="flex flex-col sm:flex-row items-center gap-5">
                <div className="relative w-20 h-20 rounded-full bg-amber-100 border-2 border-amber-300 overflow-hidden flex items-center justify-center shrink-0 shadow-inner">
                  {photoURL ? (
                    <img
                      src={photoURL}
                      alt={displayName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User className="w-10 h-10 text-amber-800" />
                  )}
                </div>

                <div className="flex-1 space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <label className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-lg cursor-pointer transition-colors border border-stone-200">
                      <Upload className="w-3.5 h-3.5" />
                      <span>Upload Photo</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                    </label>

                    {photoURL && (
                      <button
                        type="button"
                        onClick={() => setPhotoURL('')}
                        className="text-xs text-stone-500 hover:text-rose-600 px-2 py-1"
                      >
                        Remove
                      </button>
                    )}
                  </div>

                  {/* Curated Avatars */}
                  <div className="space-y-1">
                    <span className="text-[11px] text-stone-500">Or choose a traditional avatar:</span>
                    <div className="flex items-center gap-2">
                      {CULTURAL_AVATARS.map((av) => (
                        <button
                          type="button"
                          key={av.id}
                          onClick={() => setPhotoURL(av.url)}
                          className={`flex items-center gap-1.5 p-1 rounded-lg border text-[11px] transition-all cursor-pointer ${
                            photoURL === av.url
                              ? 'border-amber-500 bg-amber-50 text-amber-900 font-semibold'
                              : 'border-stone-200 hover:bg-stone-50 text-stone-600'
                          }`}
                        >
                          <img
                            src={av.url}
                            alt={av.label}
                            className="w-5 h-5 rounded-full object-cover"
                          />
                          <span>{av.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Username & Display Name */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-medium text-stone-700">
                  Username (@handle)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 text-xs">@</span>
                  <input
                    type="text"
                    required
                    placeholder="bhushan_pune"
                    value={username}
                    onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                    className="w-full pl-7 pr-3 py-2 text-xs bg-stone-50 border border-stone-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500 font-mono text-stone-900"
                  />
                </div>
                <p className="text-[10px] text-stone-400">Lowercase letters, numbers, and underscores.</p>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-stone-700">
                  Display Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="Bhushan Joshi"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-stone-50 border border-stone-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500 text-stone-900 font-medium"
                />
              </div>
            </div>

            {/* Home Location, Tradition & Language */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-medium text-stone-700">
                  Home Location
                </label>
                <input
                  type="text"
                  placeholder="e.g. Pune, Maharashtra"
                  value={homeLocation}
                  onChange={(e) => setHomeLocation(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-stone-50 border border-stone-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-stone-700">
                  Calendar Tradition
                </label>
                <input
                  type="text"
                  placeholder="e.g. Amanta"
                  value={tradition}
                  onChange={(e) => setTradition(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-stone-50 border border-stone-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-stone-700">
                  Preferred Language
                </label>
                <div className="relative">
                  <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-stone-400" />
                  <select
                    value={language}
                    onChange={(e) => setLanguage(e.target.value as LanguageCode)}
                    className="w-full pl-9 pr-3 py-2 text-xs bg-stone-50 border border-stone-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500"
                  >
                    <option value="mr">Marathi (मराठी)</option>
                    <option value="hi">Hindi (हिंदी)</option>
                    <option value="en">English</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Short Bio */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs text-stone-700">
                <label className="font-medium">Short Bio</label>
                <span className="text-[11px] text-stone-400">{bio.length}/280</span>
              </div>
              <textarea
                rows={3}
                maxLength={280}
                placeholder="Share a short note about your family heritage, customs, or what you care to preserve..."
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-stone-50 border border-stone-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500 text-stone-800 leading-relaxed"
              />
            </div>

            {/* Interests & Passions Section */}
            <div className="space-y-3 p-4 rounded-xl bg-stone-50 border border-stone-200">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-stone-800 uppercase tracking-wider">
                    Cultural Passions & Interests
                  </h4>
                  <p className="text-[11px] text-stone-500 mt-0.5">
                    Select the traditions and topics you are passionate about. Helps connect with like-minded families.
                  </p>
                </div>
                <span className="text-xs font-semibold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full">
                  {interests.length} selected
                </span>
              </div>

              {/* Tag options */}
              <div className="flex flex-wrap gap-2 pt-1">
                {INTEREST_OPTIONS.map((interest) => {
                  const isSelected = interests.includes(interest);
                  return (
                    <button
                      type="button"
                      key={interest}
                      onClick={() => toggleInterest(interest)}
                      className={`px-3 py-1.5 text-xs rounded-full border transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-stone-900 text-amber-300 border-stone-900 font-semibold shadow-2xs'
                          : 'bg-white text-stone-700 border-stone-300 hover:border-amber-400'
                      }`}
                    >
                      {interest}
                    </button>
                  );
                })}
              </div>

              {/* Add custom interest */}
              <div className="pt-2 flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Add custom passion (e.g. Kuldevi Rites, Vedic Chanting)..."
                  value={customInterest}
                  onChange={(e) => setCustomInterest(e.target.value)}
                  className="flex-1 px-3 py-1.5 text-xs bg-white border border-stone-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
                <button
                  type="button"
                  onClick={handleAddCustomInterest}
                  className="px-3 py-1.5 text-xs font-medium text-stone-800 bg-stone-200 hover:bg-stone-300 rounded-lg cursor-pointer"
                >
                  + Add
                </button>
              </div>
            </div>

            {/* Save Button */}
            <div className="flex items-center justify-between pt-4 border-t border-stone-200">
              <div className="text-xs text-stone-500 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Protected by Firestore security rules</span>
              </div>

              <div className="flex items-center gap-3">
                {savedSuccess && (
                  <span className="text-xs text-emerald-700 font-semibold flex items-center gap-1">
                    <Check className="w-4 h-4" />
                    Saved!
                  </span>
                )}
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2 text-xs font-semibold text-stone-950 bg-amber-400 hover:bg-amber-300 rounded-lg transition-colors cursor-pointer shadow-sm disabled:opacity-50"
                >
                  {isSaving ? 'Saving...' : 'Save Profile Changes'}
                </button>
              </div>
            </div>
          </form>
        ) : (
          /* Community Connection View */
          <div className="space-y-6">
            <div className="bg-amber-50/70 p-4 rounded-xl border border-amber-200/70 space-y-1">
              <h4 className="text-xs font-bold text-amber-950 uppercase tracking-wider">
                Connect with Families Sharing Similar Passions
              </h4>
              <p className="text-xs text-amber-900 leading-relaxed">
                Meet other family coordinators, panchang scholars, and diaspora members keeping ancestral tithis alive.
              </p>
            </div>

            {/* Interest Filter */}
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1 text-xs">
              <span className="text-stone-500 shrink-0">Filter by passion:</span>
              <button
                onClick={() => setSelectedInterestFilter('all')}
                className={`px-2.5 py-1 rounded-full whitespace-nowrap cursor-pointer ${
                  selectedInterestFilter === 'all'
                    ? 'bg-stone-900 text-white font-semibold'
                    : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                }`}
              >
                All ({communityMembers.length})
              </button>
              {INTEREST_OPTIONS.slice(0, 4).map((i) => (
                <button
                  key={i}
                  onClick={() => setSelectedInterestFilter(i)}
                  className={`px-2.5 py-1 rounded-full whitespace-nowrap cursor-pointer ${
                    selectedInterestFilter === i
                      ? 'bg-stone-900 text-white font-semibold'
                      : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                  }`}
                >
                  {i}
                </button>
              ))}
            </div>

            {/* Community List */}
            <div className="space-y-4">
              {filteredCommunity.length === 0 ? (
                <div className="text-center py-10 text-xs text-stone-500">
                  No other members found with this interest yet.
                </div>
              ) : (
                filteredCommunity.map((member) => {
                  const sharedCount = member.interests?.filter((i) => currentUser.interests?.includes(i)).length || 0;

                  return (
                    <div
                      key={member.uid}
                      className="p-4 rounded-xl bg-stone-50 border border-stone-200 hover:border-amber-300 transition-all space-y-3"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="w-11 h-11 rounded-full bg-amber-100 border border-amber-300 overflow-hidden flex items-center justify-center font-bold text-amber-900 text-sm shrink-0">
                            {member.photoURL ? (
                              <img src={member.photoURL} alt={member.displayName} className="w-full h-full object-cover" />
                            ) : (
                              member.displayName.charAt(0)
                            )}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h5 className="font-bold text-stone-900 text-sm leading-tight">
                                {member.displayName}
                              </h5>
                              <span className="text-xs text-stone-400 font-mono">@{member.username}</span>
                            </div>
                            <div className="text-[11px] text-stone-500 flex items-center gap-1.5 mt-0.5">
                              <MapPin className="w-3 h-3 text-amber-600" />
                              <span>{member.homeLocation}</span>
                              <span aria-hidden="true">·</span>
                              <span>{member.tradition}</span>
                            </div>
                          </div>
                        </div>

                        {sharedCount > 0 && (
                          <span className="text-[10px] font-semibold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full shrink-0">
                            {sharedCount} shared passion{sharedCount > 1 ? 's' : ''}
                          </span>
                        )}
                      </div>

                      {member.bio && (
                        <p className="text-xs text-stone-600 leading-relaxed">
                          {member.bio}
                        </p>
                      )}

                      {/* Interests */}
                      {member.interests && (
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {member.interests.map((tag) => {
                            const isShared = currentUser.interests?.includes(tag);
                            return (
                              <span
                                key={tag}
                                className={`text-[10px] px-2 py-0.5 rounded-full ${
                                  isShared
                                    ? 'bg-amber-100 text-amber-900 font-semibold border border-amber-300'
                                    : 'bg-white text-stone-600 border border-stone-200'
                                }`}
                              >
                                {tag}
                              </span>
                            );
                          })}
                        </div>
                      )}

                      {/* Action */}
                      <div className="pt-2 border-t border-stone-200 flex items-center justify-between text-xs">
                        <span className="text-stone-400 text-[11px]">KulLoop Verified Member</span>
                        {onOpenAssistantWithTopic && (
                          <button
                            type="button"
                            onClick={() => {
                              onClose();
                              onOpenAssistantWithTopic(`I would like to explore connections and family traditions regarding ${member.interests?.[0] || 'our cultural roots'} like ${member.displayName} does.`);
                            }}
                            className="inline-flex items-center gap-1 text-xs font-semibold text-amber-800 hover:text-amber-950 cursor-pointer"
                          >
                            <Sparkles className="w-3.5 h-3.5" />
                            <span>Discuss in AI Assistant</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
