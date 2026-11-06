import React, { useState, useEffect } from 'react';
import { 
  Family, 
  FamilyOccasion, 
  Member, 
  Person, 
  PilotIntakeFormState,
  LineageMember 
} from './types';
import { 
  INITIAL_FAMILY, 
  INITIAL_MEMBERS, 
  INITIAL_PEOPLE, 
  INITIAL_OCCASIONS 
} from './data/mockData';
import { INITIAL_LINEAGE_MEMBERS } from './data/mockLineageData';
import { onAuthStateChanged } from 'firebase/auth';
import { 
  UserProfile, 
  fetchUserProfile, 
  saveUserProfile,
  auth,
  signInWithGoogle,
  signOutGoogle,
  GUEST_USER_PROFILE
} from './services/firebase';
import { 
  fetchInitialDatabase, 
  apiUpdateFamily, 
  apiCreateOccasion, 
  apiUpdateOccasion, 
  apiDeleteOccasion, 
  apiToggleConfirm, 
  apiTogglePerformed, 
  apiAddMemoryPhoto, 
  apiDeleteMemoryPhoto, 
  apiCreateMember, 
  apiUpdateMember, 
  apiDeleteMember, 
  apiUpdateLineageMember 
} from './services/api';
import { Header } from './components/Header';
import { FamilyDashboard } from './components/FamilyDashboard';
import { OccasionList } from './components/OccasionList';
import { WhatsAppSimulator } from './components/WhatsAppSimulator';
import { MembersManager } from './components/MembersManager';
import { VisualFamilyTree } from './components/VisualFamilyTree';
import { AnnualCalendarView } from './components/AnnualCalendarView';
import { CalmPricingView } from './components/CalmPricingView';
import { AddOccasionModal } from './components/AddOccasionModal';
import { PriestReadyNoteModal } from './components/PriestReadyNoteModal';
import { PilotIntakeModal } from './components/PilotIntakeModal';
import { UserProfileModal } from './components/UserProfileModal';
import { GeminiChatbot } from './components/GeminiChatbot';
import { ShareFamilyModal } from './components/ShareFamilyModal';
import { NotificationHubModal } from './components/NotificationHubModal';
import { OnboardingFlow } from './components/OnboardingFlow';
import { Check, ShieldCheck, Sparkles, User, Users, RefreshCw } from 'lucide-react';

const DEFAULT_USER_PROFILE: UserProfile = {
  uid: 'user_configurator_init',
  username: 'family_lead',
  displayName: 'Family Configurator',
  email: '',
  photoURL: '/assets/images/kulloop_avatar_elder_1793303629841.jpg',
  bio: 'Family ritual configurator preserving our ancestral traditions.',
  interests: ['Ancestral Rites (श्राद्ध)', 'Panchang & Astronomy', 'Family Heritage', 'Marathi Traditions'],
  homeLocation: 'Pune, Maharashtra',
  tradition: 'Amanta (Maharashtra)',
  createdAt: new Date().toISOString(),
  language: 'mr',
};

const DEFAULT_CLEAN_FAMILY: Family = {
  id: 'fam_default',
  name: 'My Family Lineage',
  homeLocation: 'Pune, Maharashtra',
  secondLocation: '',
  region: 'Maharashtra',
  convention: 'Amanta',
  validationSource: 'Datar Panchang (Amanta) — verified by family pandit',
  plan: 'pilot_founding',
  payer: 'configurator',
  configuratorName: 'Family Configurator',
  configuratorPhone: '',
  traditionNotes: 'Amanta tradition calendar. Computed for local sunrise.',
  consultedEntity: 'An elder',
};

export default function App() {
  const [activeTab, setActiveTab] = useState<'overview' | 'occasions' | 'whatsapp' | 'members' | 'tree' | 'calendar' | 'pricing'>('overview');
  
  // App data state
  const [family, setFamily] = useState<Family>(DEFAULT_CLEAN_FAMILY);
  const [occasions, setOccasions] = useState<FamilyOccasion[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [people, setPeople] = useState<Person[]>([]);
  const [lineageMembers, setLineageMembers] = useState<LineageMember[]>([]);

  // User Profile & Onboarding state
  const [currentUser, setCurrentUser] = useState<UserProfile>(DEFAULT_USER_PROFILE);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState<boolean>(() => {
    // Look at session/local state: ONLY true if user actively finished onboarding in THIS browser session
    return sessionStorage.getItem('kulloop_session_active') === 'true' && localStorage.getItem('kulloop_has_onboarded') === 'true';
  });

  // Modals & previews
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isIntakeModalOpen, setIsIntakeModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isNotificationHubOpen, setIsNotificationHubOpen] = useState(false);
  const [notificationHubOccasion, setNotificationHubOccasion] = useState<FamilyOccasion | null>(null);
  const [isChatbotOpen, setIsChatbotOpen] = useState(false);
  const [chatbotInitialPrompt, setChatbotInitialPrompt] = useState<string>('');
  const [priestModalOccasion, setPriestModalOccasion] = useState<FamilyOccasion | null>(null);
  const [activeWhatsAppOccasion, setActiveWhatsAppOccasion] = useState<FamilyOccasion | undefined>(undefined);

  // Toast feedback
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Load persistent database on mount (scoped to active user & family)
  const loadDatabaseData = async () => {
    // If demo mode is active, load sample demo dataset
    if (localStorage.getItem('kulloop_is_demo') === 'true') {
      setFamily(INITIAL_FAMILY);
      setOccasions(INITIAL_OCCASIONS);
      setMembers(INITIAL_MEMBERS);
      setPeople(INITIAL_PEOPLE);
      setLineageMembers(INITIAL_LINEAGE_MEMBERS);
      return;
    }

    try {
      const bundle = await fetchInitialDatabase();
      if (bundle) {
        if (bundle.family && bundle.family.name !== 'The Joshi Family (जोशी परिवार)') {
          setFamily(bundle.family);
        }
        // Do not bleed mock Joshi occasions into a newly configured custom family
        if (bundle.occasions && bundle.occasions.length > 0) {
          const nonMockOccasions = bundle.occasions.filter(o => o.familyId !== 'fam_joshi_01');
          setOccasions(nonMockOccasions);
        }
        if (bundle.members && bundle.members.length > 0) {
          const nonMockMembers = bundle.members.filter(m => m.familyId !== 'fam_joshi_01');
          setMembers(nonMockMembers);
        }
        if (bundle.people && bundle.people.length > 0) {
          const nonMockPeople = bundle.people.filter(p => p.familyId !== 'fam_joshi_01');
          setPeople(nonMockPeople);
        }
        if (bundle.lineageMembers && bundle.lineageMembers.length > 0) {
          const nonMockLineage = bundle.lineageMembers.filter(lm => lm.familyId !== 'fam_joshi_01');
          setLineageMembers(nonMockLineage);
        }
        if (bundle.currentUser && bundle.currentUser.displayName !== 'Bhushan Joshi') {
          setCurrentUser(bundle.currentUser);
        }
      }
    } catch (err) {
      console.warn('Backend file load error, using initial defaults:', err);
    }
  };

  useEffect(() => {
    loadDatabaseData();

    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        const p = await fetchUserProfile(fbUser.uid);
        if (p) {
          setCurrentUser(p);
        } else {
          const newP: UserProfile = {
            uid: fbUser.uid,
            username: fbUser.email 
              ? fbUser.email.split('@')[0].toLowerCase().replace(/[^a-z0-9_]/g, '') 
              : `user_${fbUser.uid.slice(0, 6)}`,
            displayName: fbUser.displayName || 'KulLoop Member',
            email: fbUser.email || '',
            photoURL: fbUser.photoURL || '',
            bio: 'Family ritual configurator preserving our ancestral traditions.',
            interests: ['Ancestral Rites (श्राद्ध)', 'Panchang & Astronomy', 'Family Heritage', 'Marathi Traditions'],
            homeLocation: 'Pune, Maharashtra',
            tradition: 'Amanta (Maharashtra)',
            createdAt: new Date().toISOString(),
            language: 'mr',
          };
          await saveUserProfile(newP);
          setCurrentUser(newP);
        }
      } else {
        setCurrentUser(GUEST_USER_PROFILE);
      }
    });

    return () => unsubscribe();
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleAddOccasion = async (newOcc: FamilyOccasion) => {
    setOccasions((prev) => [newOcc, ...prev]);
    showToast(`Added "${newOcc.title}" (saved to server disk)`);
    await apiCreateOccasion(newOcc);
  };

  const handleToggleConfirm = async (id: string) => {
    setOccasions((prev) =>
      prev.map((occ) => {
        if (occ.id === id) {
          const nextState = !occ.isConfirmed;
          showToast(nextState ? 'Occasion confirmed (saved to disk)' : 'Occasion marked unconfirmed (saved to disk)');
          return {
            ...occ,
            isConfirmed: nextState,
            occurrence2027: {
              ...occ.occurrence2027,
              isVerified: nextState,
            },
          };
        }
        return occ;
      })
    );
    await apiToggleConfirm(id);
  };

  const handleTogglePerformed = async (id: string, notes?: string, performedBy?: string) => {
    setOccasions((prev) =>
      prev.map((occ) => {
        if (occ.id === id) {
          const nextState = !occ.isPerformed;
          showToast(
            nextState
              ? `Marked "${occ.title}" as performed (saved to disk)`
              : `Unmarked "${occ.title}" (saved to disk)`
          );
          return {
            ...occ,
            isPerformed: nextState,
            performedAt: nextState
              ? new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) + ', ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
              : undefined,
            performedBy: nextState ? (performedBy || currentUser.displayName) : undefined,
            performedNotes: nextState ? notes : undefined,
          };
        }
        return occ;
      })
    );
    await apiTogglePerformed(id, notes, performedBy || currentUser.displayName);
  };

  const handleAddMemoryPhoto = async (
    occasionId: string,
    photo: { id: string; url: string; caption?: string; year?: number; uploadedAt: string }
  ) => {
    setOccasions((prev) =>
      prev.map((occ) => {
        if (occ.id === occasionId) {
          const existing = occ.memoryPhotos || [];
          showToast('Celebration photo added to memory slot (saved to disk)');
          return {
            ...occ,
            memoryPhotos: [...existing, photo],
          };
        }
        return occ;
      })
    );
    await apiAddMemoryPhoto(occasionId, photo);
  };

  const handleDeleteMemoryPhoto = async (occasionId: string, photoId: string) => {
    setOccasions((prev) =>
      prev.map((occ) => {
        if (occ.id === occasionId) {
          showToast('Photo removed from memory slot (saved to disk)');
          return {
            ...occ,
            memoryPhotos: (occ.memoryPhotos || []).filter((p) => p.id !== photoId),
          };
        }
        return occ;
      })
    );
    await apiDeleteMemoryPhoto(occasionId, photoId);
  };

  const handleUpdateOccasion = async (id: string, updates: Partial<FamilyOccasion>) => {
    setOccasions((prev) =>
      prev.map((occ) => {
        if (occ.id === id) {
          return { ...occ, ...updates };
        }
        return occ;
      })
    );
    showToast('Occasion updated (saved to disk)');
    await apiUpdateOccasion(id, updates);
  };

  const handleDeleteOccasion = async (id: string) => {
    const target = occasions.find((o) => o.id === id);
    if (confirm(`Remove "${target?.title}" from the family record?`)) {
      setOccasions((prev) => prev.filter((o) => o.id !== id));
      showToast('Occasion removed (saved to disk)');
      await apiDeleteOccasion(id);
    }
  };

  const handleAddMember = async (member: Member) => {
    setMembers((prev) => [...prev, member]);
    showToast(`Added ${member.name} to the family loop (saved to disk)`);
    await apiCreateMember(member);
  };

  const handleUpdateMember = async (member: Member) => {
    setMembers((prev) => prev.map((m) => (m.id === member.id ? member : m)));
    showToast(`Updated preferences for ${member.name} (saved to disk)`);
    await apiUpdateMember(member);
  };

  const handleDeleteMember = async (id: string) => {
    const target = members.find((m) => m.id === id);
    if (confirm(`Remove ${target?.name} from WhatsApp reminders?`)) {
      setMembers((prev) => prev.filter((m) => m.id !== id));
      showToast('Member removed from loop (saved to disk)');
      await apiDeleteMember(id);
    }
  };

  const handlePreviewWhatsApp = (occ: FamilyOccasion) => {
    setActiveWhatsAppOccasion(occ);
    setActiveTab('whatsapp');
  };

  const handleGeneratePriestNote = (occ: FamilyOccasion) => {
    setPriestModalOccasion(occ);
  };

  const handlePilotIntakeSuccess = async (data: PilotIntakeFormState) => {
    const updatedFam: Family = {
      ...family,
      name: data.familyName,
      homeLocation: data.homeLocation,
      convention: data.convention === 'Purnimanta' ? 'Purnimanta' : 'Amanta',
      configuratorName: data.fullName,
      configuratorPhone: data.whatsappNumber,
      traditionNotes: data.traditionNotes,
    };
    setFamily(updatedFam);
    showToast(`Pilot intake received for ${data.familyName}! Saved to disk.`);
    await apiUpdateFamily(updatedFam);
  };

  const handleOpenAssistantWithTopic = (prompt: string) => {
    setChatbotInitialPrompt(prompt);
    setIsChatbotOpen(true);
  };

  const handleUpdateLineageMember = async (updated: LineageMember) => {
    setLineageMembers((prev) => prev.map((m) => (m.id === updated.id ? updated : m)));
    showToast(`Updated ritual responsibilities for ${updated.name} (saved to disk)`);
    await apiUpdateLineageMember(updated);
  };

  const handleCompleteOnboarding = async (user: UserProfile, newFamily: Partial<Family>) => {
    sessionStorage.setItem('kulloop_session_active', 'true');
    localStorage.setItem('kulloop_has_onboarded', 'true');
    localStorage.removeItem('kulloop_is_demo');
    setHasCompletedOnboarding(true);
    setCurrentUser(user);
    await saveUserProfile(user);

    const famId = newFamily.id || `fam_${Date.now()}`;
    const updatedFamily: Family = {
      ...family,
      ...newFamily,
      id: famId,
      name: newFamily.name || 'My Family Lineage',
      homeLocation: newFamily.homeLocation || 'Pune, Maharashtra',
      convention: newFamily.convention || 'Amanta',
      configuratorName: user.displayName,
      configuratorPhone: newFamily.configuratorPhone || family.configuratorPhone,
    };
    setFamily(updatedFamily);
    await apiUpdateFamily(updatedFamily);

    // Initial clean slate for new family: configurator is member #1
    const configuratorMember: Member = {
      id: `mem_${Date.now()}`,
      familyId: famId,
      name: user.displayName,
      relationship: 'Family Configurator (Self)',
      phone: updatedFamily.configuratorPhone || '+91 98000 00000',
      email: user.email,
      language: user.language || 'mr',
      country: 'India',
      city: updatedFamily.homeLocation.split(',')[0].trim(),
      timeZone: 'Asia/Kolkata',
      optIns: 'all',
      leadTime: '7+2',
      receiveDayOfNote: true,
      digestPreference: 'individual',
      frequencyCapPerWeek: 2,
      status: 'active',
      reminderPreferences: {
        emailAddress: user.email,
        pushEnabled: false,
        categories: {
          shraddha: { whatsapp: true, email: true, push: false },
          birthday: { whatsapp: true, email: true, push: false },
          vrat_kuldevta: { whatsapp: true, email: false, push: false },
          festival: { whatsapp: true, email: false, push: false },
          milestone: { whatsapp: true, email: true, push: false },
        },
      },
    };

    // Set clean slate for occasions & members belonging to this new family
    setOccasions([]);
    setMembers([configuratorMember]);
    setPeople([]);
    setLineageMembers([]);

    // Persist configurator member
    await apiCreateMember(configuratorMember);

    showToast(`Welcome to KulLoop! Configured for ${updatedFamily.name}`);
  };

  const handleExploreDemo = () => {
    sessionStorage.setItem('kulloop_session_active', 'true');
    localStorage.setItem('kulloop_is_demo', 'true');
    setFamily(INITIAL_FAMILY);
    setOccasions(INITIAL_OCCASIONS);
    setMembers(INITIAL_MEMBERS);
    setPeople(INITIAL_PEOPLE);
    setLineageMembers(INITIAL_LINEAGE_MEMBERS);
    setHasCompletedOnboarding(true);
    showToast('Viewing The Joshi Family demonstration record.');
  };

  const handleSwitchToOnboarding = () => {
    sessionStorage.clear();
    localStorage.clear();
    setHasCompletedOnboarding(false);
  };

  // Screen 0: First-time Sign-in & Onboarding Gate
  if (!hasCompletedOnboarding) {
    return (
      <OnboardingFlow
        onComplete={handleCompleteOnboarding}
        onExploreDemo={handleExploreDemo}
      />
    );
  }

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900 flex flex-col font-sans selection:bg-amber-100 selection:text-amber-900">
      {/* Top Bar Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenAddModal={() => setIsAddModalOpen(true)}
        onOpenIntakeModal={() => setIsIntakeModalOpen(true)}
        onOpenProfileModal={() => setIsProfileModalOpen(true)}
        onOpenShareModal={() => setIsShareModalOpen(true)}
        onOpenRemindersModal={() => {
          setNotificationHubOccasion(null);
          setIsNotificationHubOpen(true);
        }}
        onOpenChatbot={() => {
          setChatbotInitialPrompt('');
          setIsChatbotOpen(true);
        }}
        onExitDemo={handleSwitchToOnboarding}
        isDemoMode={localStorage.getItem('kulloop_is_demo') === 'true' || family.id === 'joshi_family_01'}
        currentUser={currentUser}
      />

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-stone-900 text-amber-300 text-xs px-4 py-2.5 rounded-xl shadow-xl border border-stone-800 flex items-center gap-2 animate-fade-in">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* User Profile & Community Banner Strip */}
        <div className="bg-white rounded-2xl border border-stone-200/90 p-4 sm:p-5 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="relative w-12 h-12 rounded-full bg-amber-100 border border-amber-300 overflow-hidden flex items-center justify-center shrink-0">
              {currentUser.photoURL ? (
                <img src={currentUser.photoURL} alt={currentUser.displayName} className="w-full h-full object-cover" />
              ) : (
                <span className="font-bold text-amber-900">{currentUser.displayName.charAt(0)}</span>
              )}
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-stone-900 text-sm">{currentUser.displayName}</span>
                <span className="text-xs text-stone-400 font-mono">@{currentUser.username}</span>
                <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  Configurator
                </span>
              </div>
              <div className="text-xs text-stone-500 mt-0.5 flex flex-wrap items-center gap-1.5">
                <span>Passions:</span>
                {currentUser.interests?.slice(0, 3).map((tag) => (
                  <span key={tag} className="text-[11px] text-amber-900 bg-amber-50 px-2 py-0.2 rounded border border-amber-200/80">
                    {tag}
                  </span>
                ))}
                {(currentUser.interests?.length || 0) > 3 && (
                  <span className="text-[10px] text-stone-400">+{currentUser.interests.length - 3} more</span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto shrink-0 flex-wrap">
            <button
              onClick={handleSwitchToOnboarding}
              className="px-3 py-1.5 text-xs font-medium text-stone-600 bg-stone-100 hover:bg-stone-200 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5"
              title="Configure a new family or switch account"
            >
              <RefreshCw className="w-3.5 h-3.5 text-stone-500" />
              <span>Switch / New Setup</span>
            </button>
            <button
              onClick={() => setIsProfileModalOpen(true)}
              className="px-3.5 py-1.5 text-xs font-medium text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <User className="w-3.5 h-3.5 text-stone-500" />
              <span>Edit Profile & Passions</span>
            </button>
            <button
              onClick={() => {
                setChatbotInitialPrompt('');
                setIsChatbotOpen(true);
              }}
              className="px-3.5 py-1.5 text-xs font-semibold text-amber-950 bg-amber-400 hover:bg-amber-300 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 shadow-2xs"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Ask Heritage AI</span>
            </button>
          </div>
        </div>

        {/* Tab Views */}
        {activeTab === 'overview' && (
          <FamilyDashboard
            family={family}
            occasions={occasions}
            members={members}
            onSelectOccasion={(occ) => handlePreviewWhatsApp(occ)}
            onPreviewWhatsApp={handlePreviewWhatsApp}
            onGeneratePriestNote={handleGeneratePriestNote}
            onNavigateTab={(tab) => setActiveTab(tab)}
            onOpenAddModal={() => setIsAddModalOpen(true)}
            onOpenShareModal={() => setIsShareModalOpen(true)}
            onOpenRemindersModal={(occ) => {
              setNotificationHubOccasion(occ || null);
              setIsNotificationHubOpen(true);
            }}
            onTogglePerformed={handleTogglePerformed}
            onUpdateOccasion={handleUpdateOccasion}
            onAddMemoryPhoto={handleAddMemoryPhoto}
            onDeleteMemoryPhoto={handleDeleteMemoryPhoto}
          />
        )}

        {activeTab === 'occasions' && (
          <OccasionList
            occasions={occasions}
            family={family}
            members={members}
            people={people}
            onOpenAddModal={() => setIsAddModalOpen(true)}
            onPreviewWhatsApp={handlePreviewWhatsApp}
            onOpenRemindersModal={(occ) => {
              setNotificationHubOccasion(occ || null);
              setIsNotificationHubOpen(true);
            }}
            onGeneratePriestNote={handleGeneratePriestNote}
            onToggleConfirm={handleToggleConfirm}
            onDeleteOccasion={handleDeleteOccasion}
          />
        )}

        {activeTab === 'whatsapp' && (
          <WhatsAppSimulator
            family={family}
            occasions={occasions}
            members={members}
            initialOccasion={activeWhatsAppOccasion}
            onOpenAddModal={() => setIsAddModalOpen(true)}
            onOpenRemindersModal={(occ) => {
              setNotificationHubOccasion(occ || null);
              setIsNotificationHubOpen(true);
            }}
            onGeneratePriestNote={handleGeneratePriestNote}
          />
        )}

        {activeTab === 'members' && (
          <MembersManager
            members={members}
            family={family}
            onAddMember={handleAddMember}
            onUpdateMember={handleUpdateMember}
            onDeleteMember={handleDeleteMember}
            onNavigateToTree={() => setActiveTab('tree')}
          />
        )}

        {activeTab === 'tree' && (
          <VisualFamilyTree
            family={family}
            lineageMembers={lineageMembers}
            onOpenAddModal={() => setIsAddModalOpen(true)}
            onOpenRemindersModal={() => {
              setNotificationHubOccasion(null);
              setIsNotificationHubOpen(true);
            }}
            onUpdateLineageMember={handleUpdateLineageMember}
            onNavigateToOccasion={(occId) => {
              setActiveTab('occasions');
            }}
            onPreviewWhatsApp={(memberName, duty) => {
              showToast(`WhatsApp duty digest queued for ${memberName}`);
              setActiveTab('whatsapp');
            }}
          />
        )}

        {activeTab === 'calendar' && (
          <AnnualCalendarView
            occasions={occasions}
            family={family}
            onOpenAddModal={() => setIsAddModalOpen(true)}
            onOpenRemindersModal={(occ) => {
              setNotificationHubOccasion(occ || null);
              setIsNotificationHubOpen(true);
            }}
            onPreviewWhatsApp={handlePreviewWhatsApp}
            onGeneratePriestNote={handleGeneratePriestNote}
          />
        )}

        {activeTab === 'pricing' && (
          <CalmPricingView
            onOpenIntakeModal={() => setIsIntakeModalOpen(true)}
          />
        )}
      </main>

      {/* User Profile & Community Connections Modal */}
      <UserProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        currentUser={currentUser}
        onUpdateCurrentUser={(updated) => {
          setCurrentUser(updated);
          showToast('Profile updated successfully');
        }}
        onOpenAssistantWithTopic={handleOpenAssistantWithTopic}
      />

      {/* Gemini Heritage Chatbot */}
      <GeminiChatbot
        isOpen={isChatbotOpen}
        onClose={() => setIsChatbotOpen(false)}
        currentUser={currentUser}
        initialPrompt={chatbotInitialPrompt}
      />

      {/* Add Occasion Modal */}
      <AddOccasionModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAddOccasion={handleAddOccasion}
        family={family}
      />

      {/* Priest Ready Note Modal */}
      <PriestReadyNoteModal
        isOpen={!!priestModalOccasion}
        onClose={() => setPriestModalOccasion(null)}
        occasion={priestModalOccasion}
        family={family}
      />

      {/* Pilot Intake Modal */}
      <PilotIntakeModal
        isOpen={isIntakeModalOpen}
        onClose={() => setIsIntakeModalOpen(false)}
        onSubmitSuccess={handlePilotIntakeSuccess}
      />

      {/* Share Family Calendar on WhatsApp Modal */}
      <ShareFamilyModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        family={family}
        occasions={occasions}
      />

      {/* Zero-Fee Notification & Reminders Hub Modal (Options 1-4) */}
      <NotificationHubModal
        isOpen={isNotificationHubOpen}
        onClose={() => setIsNotificationHubOpen(false)}
        occasions={occasions}
        family={family}
        activeOccasion={notificationHubOccasion}
      />

      {/* Calm Footer */}
      <footer className="bg-stone-900 text-stone-400 text-xs border-t border-stone-800 py-10 no-print">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="text-base font-bold text-amber-300 font-serif-display">KulLoop</span>
              <span className="text-stone-500">·</span>
              <span className="text-stone-300">Family Tithi Loop</span>
              <span className="text-stone-500">·</span>
              <span>In partnership with <a href="https://www.mydharohar.org/" target="_blank" rel="noreferrer" className="text-amber-300/80 hover:text-amber-200 underline">MyDharohar</a></span>
            </div>

            <div className="flex items-center gap-6 text-stone-400">
              <button onClick={() => setActiveTab('overview')} className="hover:text-stone-200 cursor-pointer">Home</button>
              <button onClick={() => setActiveTab('occasions')} className="hover:text-stone-200 cursor-pointer">Occasions</button>
              <button onClick={() => setActiveTab('whatsapp')} className="hover:text-stone-200 cursor-pointer">WhatsApp</button>
              <button onClick={() => setIsProfileModalOpen(true)} className="hover:text-amber-300 cursor-pointer">Profile & Community</button>
              <button onClick={() => setIsChatbotOpen(true)} className="hover:text-amber-300 cursor-pointer">Heritage AI</button>
              <button onClick={() => setActiveTab('pricing')} className="hover:text-stone-200 cursor-pointer">Pilot (₹299)</button>
            </div>
          </div>

          <div className="pt-4 border-t border-stone-800 text-[11px] text-stone-500 flex flex-col sm:flex-row items-center justify-between gap-2">
            <div>
              Preserving Indian family ritual life with calm, privacy, and mathematical correctness. No fear-based astrology.
            </div>
            <div className="flex items-center gap-1 text-stone-400">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Family Heritage Record · Private & Always Exportable</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
