import React, { useState, useEffect, lazy, Suspense, useMemo, useRef } from 'react';
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
  apiUpdateLineageMember,
  apiCreatePerson,
} from './services/api';
import { Header } from './components/Header';
import { FamilyDashboard } from './components/FamilyDashboard';
import { OccasionList } from './components/OccasionList';
import { WhatsAppSimulator } from './components/WhatsAppSimulator';
import { MembersManager } from './components/MembersManager';
import { AnnualCalendarView } from './components/AnnualCalendarView';
import { CalmPricingView } from './components/CalmPricingView';
import { AddOccasionModal } from './components/AddOccasionModal';
import { PriestReadyNoteModal } from './components/PriestReadyNoteModal';
import { PilotIntakeModal } from './components/PilotIntakeModal';
import { UserProfileModal } from './components/UserProfileModal';
import { ShareFamilyModal } from './components/ShareFamilyModal';
import { NotificationHubModal } from './components/NotificationHubModal';
import { OnboardingFlow } from './components/OnboardingFlow';
import { MobileBottomNav } from './components/MobileBottomNav';
import { MobileMoreSheet } from './components/MobileMoreSheet';
import { PrivacyPolicyModal } from './components/PrivacyPolicyModal';
import { Check, ShieldCheck, Sparkles, User, Users, RefreshCw, Loader2 } from 'lucide-react';
import { generateInviteCode } from './utils/inviteCode';
import { readElderMode, writeElderMode } from './utils/elderMode';
import { readSimpleLayout, writeSimpleLayout, isReducedChrome } from './utils/calmExperience';
import { readTheme, writeTheme, applyTheme, ThemeMode, getEffectiveTheme } from './utils/theme';
import { getFamilyAccess } from './utils/familyPermissions';
import { FamilyAccessBanner } from './components/FamilyAccessBanner';
import { initPushNotificationBridge } from './services/pushNotifications';
import { setApiClientContext } from './utils/apiClientContext';
import { buildHeritageAiFamilyContext } from './utils/heritageAiContext';
import { dedupeMembers } from './utils/memberDedupe';

const GeminiChatbot = lazy(() =>
  import('./components/GeminiChatbot').then((m) => ({ default: m.GeminiChatbot }))
);
const VisualFamilyTree = lazy(() =>
  import('./components/VisualFamilyTree').then((m) => ({ default: m.VisualFamilyTree }))
);

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
  const [currentUser, setCurrentUser] = useState<UserProfile>(GUEST_USER_PROFILE);
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
  const [isMoreSheetOpen, setIsMoreSheetOpen] = useState(false);
  const [isPrivacyPolicyOpen, setIsPrivacyPolicyOpen] = useState(false);
  const [elderMode, setElderMode] = useState<boolean>(() => readElderMode());
  const [simpleLayout, setSimpleLayout] = useState<boolean>(() => readSimpleLayout());
  const [theme, setTheme] = useState<ThemeMode>(() => readTheme());

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  const toggleTheme = () => {
    const effective = getEffectiveTheme(theme);
    const next: ThemeMode = effective === 'dark' ? 'light' : 'dark';
    setTheme(next);
    writeTheme(next);
  };

  const isDemoMode = localStorage.getItem('kulloop_is_demo') === 'true';
  const hadFirebaseSessionRef = useRef(false);

  const displayMembers = useMemo(
    () =>
      dedupeMembers(members, {
        currentUid: currentUser.uid,
        currentEmail: currentUser.email,
        familyId: family.id,
      }),
    [members, currentUser.uid, currentUser.email, family.id]
  );

  const familyAccess = useMemo(
    () => getFamilyAccess(displayMembers, currentUser, family, isDemoMode),
    [displayMembers, currentUser, family, isDemoMode]
  );

  const reducedChrome = isReducedChrome(elderMode, simpleLayout);

  const heritageAiContext = useMemo(
    () => buildHeritageAiFamilyContext(family, occasions),
    [family, occasions]
  );

  useEffect(() => {
    setApiClientContext({
      uid: currentUser.uid,
      email: currentUser.email || '',
      displayName: currentUser.displayName || '',
      isDemoMode,
    });
  }, [currentUser.uid, currentUser.email, currentUser.displayName, isDemoMode]);

  const activeMember = useMemo(
    () =>
      displayMembers.find(
        (m) =>
          (m.authUid && m.authUid === currentUser.uid) ||
          (m.email && currentUser.email && m.email.toLowerCase() === currentUser.email.toLowerCase())
      ),
    [displayMembers, currentUser]
  );

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
      if (bundle?.family) {
        setFamily(bundle.family);
        setOccasions(bundle.occasions || []);
        setMembers(
          dedupeMembers(bundle.members || [], {
            currentUid: currentUser.uid,
            currentEmail: currentUser.email,
            familyId: bundle.family.id,
          })
        );
        setPeople(bundle.people || []);
        setLineageMembers(bundle.lineageMembers || []);
      }
    } catch (err) {
      console.warn('Backend file load error, using initial defaults:', err);
    }
  };

  useEffect(() => {
    // Avoid hydrating private family data while on the marketing landing
    if (
      sessionStorage.getItem('kulloop_session_active') === 'true' &&
      localStorage.getItem('kulloop_has_onboarded') === 'true'
    ) {
      loadDatabaseData();
    }

    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        hadFirebaseSessionRef.current = true;
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
        // Live session ended (sign-out / expiry) → marketing landing, not a guest family dashboard
        if (
          hadFirebaseSessionRef.current &&
          localStorage.getItem('kulloop_is_demo') !== 'true'
        ) {
          hadFirebaseSessionRef.current = false;
          sessionStorage.removeItem('kulloop_session_active');
          localStorage.removeItem('kulloop_has_onboarded');
          setFamily(DEFAULT_CLEAN_FAMILY);
          setOccasions([]);
          setMembers([]);
          setPeople([]);
          setLineageMembers([]);
          setIsProfileModalOpen(false);
          setActiveTab('overview');
          setHasCompletedOnboarding(false);
        }
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!hasCompletedOnboarding) return;
    return initPushNotificationBridge({
      uid: currentUser.uid,
      familyId: family.id,
      memberId: activeMember?.id,
    });
  }, [hasCompletedOnboarding, currentUser.uid, family.id, activeMember?.id]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleAddOccasion = async (newOcc: FamilyOccasion) => {
    if (!familyAccess.canCreateOccasions) {
      showToast('View-only access — ask your family configurator to add occasions.');
      return;
    }
    setOccasions((prev) => [newOcc, ...prev]);
    showToast(`Added "${newOcc.title}" (saved to server disk)`);
    await apiCreateOccasion(newOcc);

    const personId = newOcc.personIds?.[0];
    if (personId && newOcc.personNameDisplay) {
      const person: Person = {
        id: personId,
        familyId: newOcc.familyId || family.id,
        name: newOcc.personNameDisplay,
        relationship: newOcc.relationshipDisplay || '',
        isAncestor: newOcc.occasionType === 'shraddha' || newOcc.occasionType === 'mahalaya',
        confirmedBy: newOcc.confirmedSource || 'Unconfirmed',
      };
      const saved = await apiCreatePerson(person);
      if (saved) {
        setPeople((prev) => {
          const without = prev.filter((p) => p.id !== saved.id);
          return [...without, saved];
        });
      }
    }
  };

  const handleToggleConfirm = async (id: string) => {
    if (!familyAccess.canEditOccasions) {
      showToast('Your role cannot confirm tithi dates.');
      return;
    }
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
    if (!familyAccess.canMarkPerformed) {
      showToast('View-only access — you can still read and share reminders.');
      return;
    }
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
    if (!familyAccess.canEditOccasions) {
      showToast('Your role cannot edit occasion details.');
      return;
    }
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
    if (!familyAccess.canDeleteOccasions) {
      showToast('Only the family configurator can remove occasions.');
      return;
    }
    const target = occasions.find((o) => o.id === id);
    if (confirm(`Remove "${target?.title}" from the family record?`)) {
      setOccasions((prev) => prev.filter((o) => o.id !== id));
      showToast('Occasion removed (saved to disk)');
      await apiDeleteOccasion(id);
    }
  };

  const handleAddMember = async (member: Member) => {
    if (!familyAccess.canManageMembers) {
      showToast('Ask your configurator to invite family members.');
      return;
    }
    setMembers((prev) =>
      dedupeMembers([...prev, member], {
        currentUid: currentUser.uid,
        currentEmail: currentUser.email,
        familyId: family.id,
      })
    );
    showToast(`Added ${member.name} to the family loop (saved to disk)`);
    await apiCreateMember(member);
  };

  const handleUpdateMember = async (member: Member) => {
    if (!familyAccess.canManageMembers && member.id !== activeMember?.id) {
      showToast('You can only update your own reminder settings.');
      return;
    }
    setMembers((prev) => prev.map((m) => (m.id === member.id ? member : m)));
    showToast(`Updated preferences for ${member.name} (saved to disk)`);
    await apiUpdateMember(member);
  };

  const handleDeleteMember = async (id: string) => {
    if (!familyAccess.canManageMembers) {
      showToast('Only configurator or co-karta can remove members.');
      return;
    }
    const target = members.find((m) => m.id === id);
    if (confirm(`Remove ${target?.name} from the family reminder loop?`)) {
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
    if (!familyAccess.canEditLineage) {
      showToast('Your role cannot edit lineage duties.');
      return;
    }
    setLineageMembers((prev) => prev.map((m) => (m.id === updated.id ? updated : m)));
    showToast(`Updated ritual responsibilities for ${updated.name} (saved to disk)`);
    await apiUpdateLineageMember(updated);
  };

  const handleCompleteOnboarding = async (
    user: UserProfile,
    newFamily: Partial<Family>,
    options?: { intent: 'create' | 'join' }
  ) => {
    sessionStorage.setItem('kulloop_session_active', 'true');
    localStorage.setItem('kulloop_has_onboarded', 'true');
    localStorage.removeItem('kulloop_is_demo');
    setHasCompletedOnboarding(true);
    setCurrentUser(user);
    await saveUserProfile(user);

    const isJoin = options?.intent === 'join';
    const famId = newFamily.id || `fam_${Date.now()}`;
    const updatedFamily: Family = {
      ...family,
      ...newFamily,
      id: famId,
      name: newFamily.name || 'My Family Lineage',
      homeLocation: newFamily.homeLocation || 'Pune, Maharashtra',
      convention: newFamily.convention || 'Amanta',
      inviteCode: newFamily.inviteCode || family.inviteCode || generateInviteCode(),
      region: newFamily.region || family.region || 'Maharashtra',
      validationSource: newFamily.validationSource || family.validationSource,
      plan: newFamily.plan || family.plan || 'pilot_founding',
      payer: newFamily.payer || family.payer || 'configurator',
      consultedEntity: newFamily.consultedEntity || family.consultedEntity || 'An elder',
      configuratorName: isJoin ? family.configuratorName : user.displayName,
      configuratorPhone: newFamily.configuratorPhone || family.configuratorPhone,
    };
    setFamily(updatedFamily);
    await apiUpdateFamily(updatedFamily);

    const newMember: Member = {
      id: `mem_${user.uid}`,
      familyId: famId,
      familyRole: isJoin ? 'member' : 'configurator',
      authUid: user.uid,
      name: user.displayName,
      relationship: isJoin ? 'Family Member (Joined via invite)' : 'Family Configurator (Self)',
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

    if (isJoin) {
      setMembers((prev) => [...prev, newMember]);
      await apiCreateMember(newMember);
      await loadDatabaseData();
      showToast(`You joined ${updatedFamily.name} on KulLoop`);
      return;
    }

    setOccasions([]);
    setMembers([newMember]);
    setPeople([]);
    setLineageMembers([]);
    await apiCreateMember(newMember);
    await loadDatabaseData();
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

  const resetToLanding = () => {
    sessionStorage.removeItem('kulloop_session_active');
    localStorage.removeItem('kulloop_has_onboarded');
    localStorage.removeItem('kulloop_is_demo');
    setFamily(DEFAULT_CLEAN_FAMILY);
    setOccasions([]);
    setMembers([]);
    setPeople([]);
    setLineageMembers([]);
    setCurrentUser(GUEST_USER_PROFILE);
    setIsProfileModalOpen(false);
    setActiveTab('overview');
    setHasCompletedOnboarding(false);
  };

  const handleSignOut = async () => {
    const result = await signOutGoogle();
    if (!result.ok) {
      showToast(result.error);
      return;
    }
    hadFirebaseSessionRef.current = false;
    resetToLanding();
    showToast('Signed out. Welcome back anytime.');
  };

  const completeReturningSession = async (profile: UserProfile) => {
    localStorage.removeItem('kulloop_auth_intent');
    setApiClientContext({
      uid: profile.uid,
      email: profile.email || '',
      displayName: profile.displayName || '',
      isDemoMode: false,
    });
    setCurrentUser(profile);

    let loadedFamily = false;
    try {
      const bundle = await fetchInitialDatabase();
      if (bundle?.family) {
        setFamily(bundle.family);
        setOccasions(bundle.occasions || []);
        setMembers(
          dedupeMembers(bundle.members || [], {
            currentUid: profile.uid,
            currentEmail: profile.email,
            familyId: bundle.family.id,
          })
        );
        setPeople(bundle.people || []);
        setLineageMembers(bundle.lineageMembers || []);
        loadedFamily = true;
      } else {
        setFamily(DEFAULT_CLEAN_FAMILY);
        setOccasions([]);
        setMembers([]);
        setPeople([]);
        setLineageMembers([]);
      }
    } catch (err) {
      console.warn('Returning sign-in data load failed:', err);
      throw new Error('Signed in, but your family loop could not be loaded. Please try again.');
    }

    sessionStorage.setItem('kulloop_session_active', 'true');
    localStorage.setItem('kulloop_has_onboarded', 'true');
    localStorage.removeItem('kulloop_is_demo');
    setHasCompletedOnboarding(true);
    showToast(
      loadedFamily
        ? `Welcome back, ${profile.displayName.split(' ')[0]}`
        : 'Signed in — create or join a family to continue.'
    );
  };

  const handleReturningSignIn = async (existingProfile?: UserProfile) => {
    let profile = existingProfile;
    if (!profile) {
      localStorage.setItem('kulloop_auth_intent', 'returning');
      profile = (await signInWithGoogle()) ?? undefined;
      if (!profile) {
        // Popup blocked → full-page redirect in progress; OnboardingFlow resumes via intent flag
        return;
      }
    }
    await completeReturningSession(profile);
  };

  const handleSwitchToOnboarding = async () => {
    const result = await signOutGoogle();
    if (result.ok) {
      hadFirebaseSessionRef.current = false;
    }
    resetToLanding();
  };

  // Screen 0: Landing + Sign-in & Onboarding Gate
  if (!hasCompletedOnboarding) {
    return (
      <OnboardingFlow
        onComplete={handleCompleteOnboarding}
        onExploreDemo={handleExploreDemo}
        onReturningSignIn={handleReturningSignIn}
        theme={theme}
        onToggleTheme={toggleTheme}
      />
    );
  }

  return (
    <div
      className={`min-h-screen bg-stone-50 dark:bg-[#0D0B08] text-stone-900 dark:text-stone-100 flex flex-col font-sans selection:bg-amber-100 dark:selection:bg-amber-950 selection:text-amber-900 dark:selection:text-amber-200 ${
        elderMode ? 'elder-mode' : ''
      }`}
    >
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-[100] focus:px-4 focus:py-2 focus:bg-amber-400 focus:text-amber-950 focus:rounded-lg focus:text-sm focus:font-semibold"
      >
        Skip to main content
      </a>
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
        isDemoMode={isDemoMode}
        currentUser={currentUser}
        elderMode={elderMode}
        onToggleElderMode={() => {
          const next = !elderMode;
          setElderMode(next);
          writeElderMode(next);
          showToast(next ? 'Elder-friendly mode on' : 'Standard layout restored');
        }}
        simpleLayout={simpleLayout}
        onToggleSimpleLayout={() => {
          const next = !simpleLayout;
          setSimpleLayout(next);
          writeSimpleLayout(next);
          showToast(next ? 'Simple layout on — fewer buttons' : 'Full layout restored');
        }}
        canCreateOccasions={familyAccess.canCreateOccasions}
        canShareInvite={familyAccess.canShareInvite}
        theme={theme}
        onToggleTheme={toggleTheme}
      />

      {/* Toast Notification */}
      <div
        className="fixed bottom-20 sm:bottom-6 right-4 sm:right-6 z-50 pointer-events-none"
        aria-live="polite"
        aria-atomic="true"
      >
        {toastMessage && (
          <div className="pointer-events-auto bg-stone-900 text-amber-300 text-sm px-4 py-3 rounded-xl shadow-xl border border-stone-800 flex items-center gap-2 max-w-[min(100vw-2rem,20rem)]">
            <Check className="w-4 h-4 text-emerald-400 shrink-0" aria-hidden />
            <span>{toastMessage}</span>
          </div>
        )}
      </div>

      {/* Main Container */}
      <main
        id="main-content"
        tabIndex={-1}
        className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 pb-24 xl:pb-8 space-y-6"
      >
        <FamilyAccessBanner access={familyAccess} />

        {!reducedChrome && (
        <div className="bg-white dark:bg-[#1D1915] rounded-2xl border border-stone-200/90 dark:border-stone-800 p-4 sm:p-5 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="relative w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-600/40 overflow-hidden flex items-center justify-center shrink-0">
              {currentUser.photoURL ? (
                <img src={currentUser.photoURL} alt={currentUser.displayName} className="w-full h-full object-cover" />
              ) : (
                <span className="font-bold text-amber-900 dark:text-amber-200">{currentUser.displayName.charAt(0)}</span>
              )}
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-stone-900 dark:text-stone-100 text-sm">{currentUser.displayName}</span>
                <span className="text-xs text-stone-400 dark:text-stone-500 font-mono">@{currentUser.username}</span>
                <span className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-700/40">
                  Configurator
                </span>
              </div>
              <div className="text-xs text-stone-500 dark:text-stone-400 mt-0.5 flex flex-wrap items-center gap-1.5">
                <span>Passions:</span>
                {currentUser.interests?.slice(0, 3).map((tag) => (
                  <span key={tag} className="text-[11px] text-amber-900 dark:text-amber-200 bg-amber-50 dark:bg-amber-950/50 px-2 py-0.2 rounded border border-amber-200/80 dark:border-amber-700/40">
                    {tag}
                  </span>
                ))}
                {(currentUser.interests?.length || 0) > 3 && (
                  <span className="text-[10px] text-stone-400 dark:text-stone-500">+{currentUser.interests.length - 3} more</span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto shrink-0 flex-wrap">
            <button
              onClick={handleSwitchToOnboarding}
              className="px-3 py-1.5 text-xs font-medium text-stone-600 dark:text-stone-300 bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5"
              title="Configure a new family or switch account"
            >
              <RefreshCw className="w-3.5 h-3.5 text-stone-500 dark:text-stone-400" />
              <span>Switch / New Setup</span>
            </button>
            <button
              onClick={() => setIsProfileModalOpen(true)}
              className="px-3.5 py-1.5 text-xs font-medium text-stone-700 dark:text-stone-300 bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <User className="w-3.5 h-3.5 text-stone-500 dark:text-stone-400" />
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
        )}

        {/* Tab Views */}
        {activeTab === 'overview' && (
          <FamilyDashboard
            elderMode={elderMode}
            simpleLayout={simpleLayout}
            familyAccess={familyAccess}
            family={family}
            occasions={occasions}
            members={displayMembers}
            onSelectOccasion={(occ) => handlePreviewWhatsApp(occ)}
            onPreviewWhatsApp={handlePreviewWhatsApp}
            onGeneratePriestNote={handleGeneratePriestNote}
            onNavigateTab={(tab) => setActiveTab(tab)}
            onOpenAddModal={() => setIsAddModalOpen(true)}
            onOpenShareModal={() => {
              if (!familyAccess.canShareInvite) {
                showToast('Ask your configurator to share the family invite.');
                return;
              }
              setIsShareModalOpen(true);
            }}
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
            members={displayMembers}
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
            familyAccess={familyAccess}
          />
        )}

        {activeTab === 'whatsapp' && (
          <WhatsAppSimulator
            family={family}
            occasions={occasions}
            members={displayMembers}
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
            members={displayMembers}
            family={family}
            onAddMember={handleAddMember}
            onUpdateMember={handleUpdateMember}
            onDeleteMember={handleDeleteMember}
            familyAccess={familyAccess}
            onNavigateToTree={() => setActiveTab('tree')}
          />
        )}

        {activeTab === 'tree' && (
          <Suspense
            fallback={
              <div className="flex items-center justify-center py-20 text-stone-500 gap-2">
                <Loader2 className="w-5 h-5 animate-spin" aria-hidden />
                Loading lineage tree…
              </div>
            }
          >
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
          </Suspense>
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
        onSignOut={handleSignOut}
      />

      {/* Gemini Heritage Chatbot */}
      <Suspense fallback={null}>
        <GeminiChatbot
          isOpen={isChatbotOpen}
          onClose={() => setIsChatbotOpen(false)}
          currentUser={currentUser}
          initialPrompt={chatbotInitialPrompt}
          simpleUi={reducedChrome}
          familyContext={heritageAiContext}
        />
      </Suspense>

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
        members={displayMembers}
        activeOccasion={notificationHubOccasion}
        pushContext={{
          uid: currentUser.uid,
          familyId: family.id,
          memberId: activeMember?.id,
        }}
      />

      <PrivacyPolicyModal isOpen={isPrivacyPolicyOpen} onClose={() => setIsPrivacyPolicyOpen(false)} />

      <MobileMoreSheet
        isOpen={isMoreSheetOpen}
        onClose={() => setIsMoreSheetOpen(false)}
        onSelectTab={setActiveTab}
        onOpenProfile={() => setIsProfileModalOpen(true)}
        onOpenChatbot={() => {
          setChatbotInitialPrompt('');
          setIsChatbotOpen(true);
        }}
        onOpenPrivacy={() => setIsPrivacyPolicyOpen(true)}
        simpleLayout={simpleLayout}
        theme={theme}
        onToggleTheme={toggleTheme}
      />

      <MobileBottomNav
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        onOpenReminders={() => {
          setNotificationHubOccasion(null);
          setIsNotificationHubOpen(true);
        }}
        onOpenMore={() => setIsMoreSheetOpen(true)}
      />

      {/* Calm Footer */}
      <footer className="bg-stone-900 text-stone-400 text-xs border-t border-stone-800 py-10 pb-28 xl:pb-10 no-print">
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
              <a href="/privacy" className="hover:text-amber-300 underline-offset-2 hover:underline">
                Privacy
              </a>
              <button
                type="button"
                onClick={() => setIsPrivacyPolicyOpen(true)}
                className="hover:text-amber-300 cursor-pointer underline-offset-2 hover:underline"
              >
                Privacy (in-app)
              </button>
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
