export type RecurrenceType = 'tithi' | 'gregorian' | 'festival_rule';

export type OccasionType = 
  | 'shraddha' 
  | 'mahalaya' 
  | 'birthday' 
  | 'anniversary' 
  | 'festival' 
  | 'vrat_kuldevta' 
  | 'milestone' 
  | 'custom';

export type LanguageCode = 'mr' | 'hi' | 'en';

export type FamilyMemberRole = 'configurator' | 'co_karta' | 'member' | 'viewer';

export interface Family {
  id: string;
  /** Shareable code, e.g. KUL-AB12CD */
  inviteCode?: string;
  name: string;
  homeLocation: string; // e.g., "Pune, Maharashtra" (Sunrise reference)
  secondLocation?: string;
  region: string; // "Maharashtra", "North India", "Gujarat", etc.
  convention: 'Amanta' | 'Purnimanta';
  validationSource: string; // e.g. "Datar Panchang (Amanta) - reviewed with Pt. Shrikant Joshi"
  plan: 'pilot_founding' | 'family_annual' | 'trial';
  trialEndDate?: string;
  payer: 'configurator' | 'diaspora_child' | 'gift';
  configuratorName: string;
  configuratorPhone: string;
  traditionNotes?: string;
  consultedEntity: 'Family priest' | 'An elder' | 'Printed almanac' | 'Online panchang';
}

export type ReminderChannel = 'whatsapp' | 'email' | 'push';

export type RitualReminderCategory = 
  | 'shraddha' 
  | 'birthday' 
  | 'vrat_kuldevta' 
  | 'festival' 
  | 'milestone';

export interface CategoryReminderConfig {
  whatsapp: boolean;
  email: boolean;
  push: boolean;
}

export interface MemberReminderPreferences {
  emailAddress?: string;
  pushEnabled?: boolean;
  categories: Record<RitualReminderCategory, CategoryReminderConfig>;
}

export interface Member {
  id: string;
  familyId: string;
  familyRole?: FamilyMemberRole;
  /** Links Firebase Auth uid for role resolution */
  authUid?: string;
  name: string;
  relationship: string; // "Aaji (Grandmother)", "Sister", "Son", etc.
  phone: string;
  email?: string;
  language: LanguageCode;
  country: string;
  city: string;
  timeZone: string; // e.g. "Asia/Kolkata", "America/Toronto"
  optIns: OccasionType[] | 'all';
  leadTime: '7+2' | '7' | '2' | 'day_of';
  receiveDayOfNote: boolean;
  digestPreference: 'individual' | 'weekly_digest' | 'monthly_digest';
  frequencyCapPerWeek: number; // e.g., 2
  status: 'active' | 'paused' | 'opted_out';
  reminderPreferences?: MemberReminderPreferences;
}

export interface Person {
  id: string;
  familyId: string;
  name: string;
  relationship: string;
  isAncestor: boolean;
  gregorianDateOfPassing?: string;
  confirmedBy: string; // "Aaji", "Pt. Joshi", "Almanac", "Unconfirmed"
  gotra?: string;
}

export interface TithiDefinition {
  paksha: 'Shukla' | 'Krishna';
  lunarMonth: string;
  tithi: string;
  pakshaDevanagari?: string;
  lunarMonthDevanagari?: string;
  tithiDevanagari?: string;
}

export interface GregorianDefinition {
  day: number;
  month: number; // 1-12
  originalYear?: number;
}

export interface ComputedOccurrence {
  year: number; // e.g. 2026 or 2027
  gregorianDateStr: string; // "2027-02-18"
  formattedDisplay: string; // "18 February 2027"
  weekday: string; // "Thursday"
  sunriseTime: string; // "06:58 AM IST"
  tithiSpan: string; // "Magha Krishna Saptami ends 02:44 PM"
  isVerified: boolean;
  validationSourceUsed: string;
  edgeCaseNote?: string; // "Adhik maas tested", "Kshaya tithi verified"
}

export interface ContentNote {
  mr: { title: string; body: string; prepList?: string[]; wish?: string };
  hi: { title: string; body: string; prepList?: string[]; wish?: string };
  en: { title: string; body: string; prepList?: string[]; wish?: string };
}

export interface FamilyOccasion {
  id: string;
  familyId: string;
  title: string;
  occasionType: OccasionType;
  recurrenceType: RecurrenceType;
  personIds: string[]; // Related people
  personNameDisplay?: string;
  relationshipDisplay?: string;
  tithiFields?: TithiDefinition;
  gregorianFields?: GregorianDefinition;
  festivalKey?: string;
  mahalayaOverride?: 'same_tithi' | 'sarvapitri_amavasya' | 'custom';
  isConfirmed: boolean;
  confirmedSource: string;
  practiceNotes: string;
  occurrence2027: ComputedOccurrence;
  contentNote: ContentNote;
  priority: 'high' | 'normal' | 'digest';
  myDharoharGuideUrl?: string;
  establishedYear?: number; // Year ritual / anniversary was first established or recorded (e.g., 1988)
  heritageNotes?: string; // Story of when and how the sankalpa or tradition began
  isPerformed?: boolean;
  performedAt?: string;
  performedBy?: string;
  performedNotes?: string;
  memoryPhotos?: Array<{
    id: string;
    url: string;
    caption?: string;
    year?: number;
    uploadedAt: string;
  }>;
}

export interface PilotIntakeFormState {
  // Section 1: Configurator
  fullName: string;
  whatsappNumber: string;
  email: string;
  preferredLanguage: LanguageCode;
  howDidYouHear: string;

  // Section 2: Home & Tradition
  familyName: string;
  homeLocation: string;
  secondLocation: string;
  convention: 'Amanta' | 'Purnimanta' | 'Not sure';
  traditionNotes: string;
  consultedEntity: string;

  // Section 3: Ancestor Sample
  ancestorName: string;
  ancestorRelation: string;
  knowsTithi: 'yes' | 'gregorian' | 'neither';
  ancestorPaksha: 'Shukla' | 'Krishna' | 'Not sure';
  ancestorMonth: string;
  ancestorTithi: string;
  ancestorPassingDate: string;
  mahalayaPractice: string;

  // Section 4: Other date
  otherOccasionType: string;
  otherPerson: string;
  otherKeptBy: 'Tithi' | 'Calendar date' | 'Both';
  otherDateOrTithi: string;

  // Section 5: Vrats & Festivals
  selectedFestivals: string[];
  selectedVrats: string[];

  // Section 6: Family Members
  membersList: Array<{
    name: string;
    relationship: string;
    phone: string;
    language: LanguageCode;
    observances: string;
    leadTime: string;
    country: string;
    city: string;
  }>;

  // Section 7-9: Consent & Agreements
  consentAgreed: boolean;
  paymentAcknowledged: boolean;
  privacyAgreed: boolean;
}

export interface RitualResponsibility {
  id: string;
  occasionId?: string;
  occasionTitle: string;
  occasionType?: OccasionType;
  role: 
    | 'Chief Karta (मुख्य कर्ता)' 
    | 'Co-Host / Sankalpa (संकल्प व पूजा)' 
    | 'Samagri & Preparations (साहित्य व व्यवस्था)' 
    | 'Naivedya & Prasad (नैवेद्य व पाकसंस्कार)' 
    | 'Priest Liaison (गुरुजी व पाठशाळा समन्वय)' 
    | 'Diaspora Link (विदेश समन्वय)' 
    | 'Apprentice & Youth (सहाय्यक संस्कार)' 
    | 'Honoree & Elder Blessing (पूज्य आशीर्वाद)';
  tithiOrDate: string;
  dutySummary: string;
  checklist: string[];
  status: 'pending' | 'in_progress' | 'completed';
  notes?: string;
}

export interface LineageMember {
  id: string;
  familyId: string;
  name: string;
  nameDevanagari?: string;
  relationship: string;
  relationshipDevanagari?: string;
  generation: 1 | 2 | 3;
  generationLabel: string;
  isAncestor: boolean;
  gregorianDateOfPassing?: string;
  tithiOfPassing?: string;
  gotra: string;
  kuldevta?: string;
  gender: 'male' | 'female';
  spouseId?: string;
  spouseName?: string;
  parentIds?: string[];
  childrenIds?: string[];
  location: string;
  isDiaspora?: boolean;
  avatarUrl?: string;
  phone?: string;
  language?: LanguageCode;
  primaryRole: string;
  primaryRoleDevanagari?: string;
  bio?: string;
  responsibilities: RitualResponsibility[];
}

