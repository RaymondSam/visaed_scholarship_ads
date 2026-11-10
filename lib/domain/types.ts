export const STUDY_LEVELS = [
  "secondary",
  "certificate",
  "diploma",
  "bachelor",
  "master",
  "doctorate",
  "postdoctoral",
] as const;

export const FUNDING_TYPES = ["full", "partial", "tuition", "stipend", "other"] as const;
export const APPLICATION_MODES = ["external", "coming_soon"] as const;
export const DELIVERY_MODES = ["on_campus", "online", "hybrid"] as const;
export const SCHOLARSHIP_STATUSES = ["draft", "published", "closed", "archived"] as const;
export const USER_ROLES = ["super_admin", "admin", "student"] as const;
export const ACCOUNT_STATUSES = ["invited", "active", "suspended"] as const;
export const CONTACT_REASONS = [
  "general",
  "correction",
  "privacy",
  "partnership",
  "account_help",
] as const;

export type StudyLevel = (typeof STUDY_LEVELS)[number];
export type FundingType = (typeof FUNDING_TYPES)[number];
export type ApplicationMode = (typeof APPLICATION_MODES)[number];
export type DeliveryMode = (typeof DELIVERY_MODES)[number];
export type ScholarshipStatus = (typeof SCHOLARSHIP_STATUSES)[number];
export type UserRole = (typeof USER_ROLES)[number];
export type AccountStatus = (typeof ACCOUNT_STATUSES)[number];
export type ContactReason = (typeof CONTACT_REASONS)[number];
export type ContactState = "new" | "read" | "closed";
export type Assurance = "aal1" | "aal2";

export type StudyField = {
  id: string;
  name: string;
  sortOrder: number;
};

export type Scholarship = {
  id: string;
  slug: string | null;
  title: string;
  summary: string;
  descriptionMarkdown: string;
  eligibilityMarkdown: string;
  benefitsMarkdown: string;
  requiredDocuments: string[];
  providerName: string;
  providerUrl: string | null;
  applicationUrl: string | null;
  applicationMode: ApplicationMode;
  status: ScholarshipStatus;
  isFeatured: boolean;
  isSponsored: boolean;
  sponsorDisclosure: string | null;
  studyLevels: StudyLevel[];
  fundingType: FundingType | null;
  amountMin: number | null;
  amountMax: number | null;
  currency: string | null;
  fundingNotes: string | null;
  hostCountryCode: string | null;
  isRemote: boolean;
  deliveryMode: DeliveryMode | null;
  openToAllNationalities: boolean;
  eligibleCountryCodes: string[];
  deadlineAt: string | null;
  deadlineTimezone: string | null;
  isRolling: boolean;
  coverExt: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
  publishedAt: string | null;
  closedAt: string | null;
  lastVerifiedAt: string | null;
  createdBy: string | null;
  updatedBy: string | null;
  createdAt: string;
  updatedAt: string;
  studyFieldIds: string[];
};

export type InternalNote = {
  scholarshipId: string;
  sourceNotes: string;
  editorialNotes: string;
  upfrontFeeAbsentConfirmed: boolean;
  verifiedBy: string | null;
};

export type Profile = {
  id: string;
  email: string;
  passwordHash: string | null;
  role: UserRole;
  status: AccountStatus;
  fullName: string;
  countryCode: string | null;
  educationLevel: StudyLevel | null;
  studyFieldIds: string[];
  invitedBy: string | null;
  inviteTokenHash: string | null;
  inviteExpires: string | null;
  resetTokenHash: string | null;
  resetExpires: string | null;
  mfaSecret: string | null;
  mfaEnabled: boolean;
  createdAt: string;
  updatedAt: string;
};

export type AuditEntry = {
  id: string;
  actorId: string | null;
  action: string;
  entityType: string;
  entityId: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
};

export type ContactMessage = {
  id: string;
  name: string;
  email: string;
  reason: ContactReason;
  message: string;
  status: ContactState;
  handledBy: string | null;
  readAt: string | null;
  createdAt: string;
};

export type RateBucket = {
  key: string;
  windowStart: string;
  hits: number;
};

export type MailMessage = {
  id: string;
  to: string;
  subject: string;
  body: string;
  createdAt: string;
};

export type Database = {
  schemaVersion: 1;
  profiles: Profile[];
  scholarships: Scholarship[];
  internals: InternalNote[];
  audit: AuditEntry[];
  contacts: ContactMessage[];
  rateBuckets: RateBucket[];
  mailbox: MailMessage[];
};

export type CatalogQuery = {
  q?: string;
  level?: string;
  field?: string;
  country?: string;
  remote?: boolean;
  funding?: string;
  deadline?: "any" | "7" | "30" | "90" | "rolling";
  sort?: "deadline" | "newest" | "featured";
  page?: number;
  view?: "open" | "closed";
};

export type AdminListQuery = {
  status?: string;
  closing?: boolean;
  reviewDue?: boolean;
  closedThisMonth?: boolean;
};

export const STUDY_FIELDS: StudyField[] = [
  ["agriculture", "Agriculture"],
  ["architecture", "Architecture"],
  ["arts-and-design", "Arts and design"],
  ["business", "Business"],
  ["computer-science", "Computer science"],
  ["education", "Education"],
  ["engineering", "Engineering"],
  ["environmental-studies", "Environmental studies"],
  ["health-sciences", "Health sciences"],
  ["humanities", "Humanities"],
  ["law", "Law"],
  ["mathematics", "Mathematics"],
  ["medicine", "Medicine"],
  ["natural-sciences", "Natural sciences"],
  ["social-sciences", "Social sciences"],
  ["vocational", "Vocational"],
  ["other", "Other"],
].map(([id, name], index) => ({ id, name, sortOrder: (index + 1) * 10 }));

export const LEVEL_LABELS: Record<StudyLevel, string> = {
  secondary: "Secondary",
  certificate: "Certificate",
  diploma: "Diploma",
  bachelor: "Bachelor's",
  master: "Master's",
  doctorate: "Doctorate",
  postdoctoral: "Postdoctoral",
};

export const FUNDING_LABELS: Record<FundingType, string> = {
  full: "Full funding",
  partial: "Partial funding",
  tuition: "Tuition funding",
  stipend: "Stipend",
  other: "Other funding",
};

export const DELIVERY_LABELS: Record<DeliveryMode, string> = {
  on_campus: "On campus",
  online: "Online",
  hybrid: "Hybrid",
};

export const ROLE_LABELS: Record<UserRole, string> = {
  super_admin: "Super admin",
  admin: "Admin",
  student: "Student",
};

export const REASON_LABELS: Record<ContactReason, string> = {
  general: "General question",
  correction: "Correct or remove a listing",
  privacy: "Privacy request",
  partnership: "Partnership",
  account_help: "I need an account",
};

export const PAGE_SIZE = 12;
export const REVIEW_WINDOW_MS = 90 * 24 * 60 * 60 * 1000;

export function reviewDueAt(lastVerifiedAt: string | null): string | null {
  if (!lastVerifiedAt) return null;
  return new Date(new Date(lastVerifiedAt).getTime() + REVIEW_WINDOW_MS).toISOString();
}
