
export type Mood = 'Great' | 'Good' | 'Okay' | 'Not Great';
export type MealAmount = 'All' | 'Most' | 'Some' | 'Little';
export type NapQuality = 'Great' | 'Okay' | 'Restless';
export type DiaperType = 'Wet' | 'BM' | 'Both' | 'Potty';
export type Language = 'English' | 'Urdu' | 'Punjabi';

export interface Child {
  id: string;
  firstName: string;
  lastName: string;
  nickname?: string;
  dob: string;
  classroom?: string;
  allergies?: string;
  dietaryNotes?: string;
  napNotes?: string;
  emergencyNotes?: string;
  active: boolean;
  parentIds: string[];
  dailyMedications?: string[];
}

export interface Parent {
  id: string;
  fullName: string;
  email: string;
  phone?: string;
  relationship: 'Mom' | 'Dad' | 'Guardian';
  preferredLanguage: Language;
  receivesEmail: boolean;
}

export interface Holiday {
  id: string;
  name: string;
  date: string; // YYYY-MM-DD
  type: 'Closed' | 'Half Day' | 'Break';
  notes?: string;
}

export interface MealEntry {
  id: string;
  time: string;
  type: 'Breakfast' | 'Lunch' | 'Snack' | 'Other';
  items: string;
  amount: MealAmount;
  notes?: string;
}

export interface BottleEntry {
  id: string;
  time: string;
  type: 'Milk' | 'Formula' | 'Water' | 'Other';
  amount: string; // e.g. "6oz"
  notes?: string;
}

export interface NapEntry {
  id: string;
  startTime: string;
  endTime: string;
  quality: NapQuality;
  notes?: string;
}

export interface DiaperPottyEntry {
  id: string;
  time: string;
  type: DiaperType;
  notes?: string;
}

export interface ActivityEntry {
  id: string;
  time?: string;
  category: 'Circle Time' | 'Outdoor' | 'Art' | 'Sensory' | 'Story' | 'Free Play' | 'Other' | 'Tummy Time' | 'Outdoors Play' | 'Singing' | 'Storytime';
  description: string;
  notes?: string;
}

export interface MedicationEntry {
  id: string;
  time: string;
  name: string;
  dosage: string;
  notes?: string;
}

export interface IncidentEntry {
  id: string;
  time: string;
  type: 'Bump' | 'Scratch' | 'Behavior' | 'Medical' | 'Other';
  description: string;
  actionTaken: string;
  parentNotified: boolean;
}

export interface DailyLog {
  id: string;
  childId: string;
  date: string; // YYYY-MM-DD
  arrivalTime: string;
  departureTime: string;
  overallMood: Mood;
  teacherNotes: string;
  activityNotes: string; // Shared notes for activities
  suppliesNeeded: string;
  meals: MealEntry[];
  bottles: BottleEntry[];
  naps: NapEntry[];
  diapers: DiaperPottyEntry[];
  activities: ActivityEntry[];
  medications: MedicationEntry[];
  incidents: IncidentEntry[];
  status: 'In Progress' | 'Completed' | 'Sent';
  isPresent: boolean;
  includeTrends?: boolean; // NEW: Optional toggle for report
}

export interface Settings {
  daycareName: string;
  fromEmail: string;
  emailSignature: string;
  testEmail: string;
  adminPassword?: string; // Stored password
  autoSendTime?: string;
  sendCopyToSelfDefault?: boolean; // New setting
  // EmailJS Integration
  emailjsServiceId?: string;
  emailjsTemplateId?: string;
  emailjsPublicKey?: string;
  // Supabase Sync
  supabaseUrl?: string;
  supabaseAnonKey?: string;
}

export interface EmailSendLog {
  id: string;
  dailyLogId: string;
  sentTo: string[];
  subject: string;
  sentAt: string;
  status: 'Sent' | 'Failed';
  errorMessage?: string;
}
