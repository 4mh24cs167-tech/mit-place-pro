// ═══════════════════════════════════════════
// MITM PlacePro — TypeScript Type Definitions
// ═══════════════════════════════════════════

export type UserRole = "admin" | "company" | "student" | "principal";

export type PlacementStatus =
  | "none"
  | "shortlisted"
  | "interview_scheduled"
  | "offered"
  | "placed"
  | "not_placed";

export type JobStatus = "draft" | "open" | "closed";

export type RoundType = "written" | "technical" | "HR" | "GD" | "coding";

export type AttendanceStatus = "pending" | "present" | "absent";

export type RoundResult = "pending" | "selected" | "rejected";

export type PosterStatus = "queued" | "generating" | "done" | "failed";

export interface User {
  id: string;
  email: string;
  role: UserRole;
  mustChangePassword: boolean;
  isActive: boolean;
  lastLoginAt: string | null;
  createdAt: string;
}

export interface Student {
  id: string;
  userId: string;
  usn: string;
  fullName: string;
  phone: string | null;
  dateOfBirth: string | null;
  gender: string | null;
  addressJson: Address | null;
  photoS3Key: string | null;
  photoUrl?: string;
  tenthPercent: number | null;
  tenthBoard: string | null;
  tenthYear: number | null;
  twelfthPercent: number | null;
  twelfthBoard: string | null;
  twelfthYear: number | null;
  twelfthStream: string | null;
  cgpa: number | null;
  backlogs: number;
  department: string;
  semester: number | null;
  driveLink: string | null;
  resumeLink: string | null;
  familyIncome: number | null;
  category: string | null;
  profileData: ProfileData;
  profileComplete: boolean;
  placementStatus: PlacementStatus;
  email?: string;
  departmentType?: 'UG' | 'PG' | 'DEGREE';
  totalSemesters?: number;
}

export interface Address {
  street: string;
  city: string;
  state: string;
  pin: string;
}

export interface ProfileData {
  headline?: string;
  about?: string;
  experience?: ExperienceEntry[];
  skills?: string[];
  projects?: ProjectEntry[];
  certifications?: CertificationEntry[];
  achievements?: string[];
  languages?: LanguageEntry[];
  linkedin?: string;
  github?: string;
  aboutMe?: string;
  tenthMarksCardLink?: string;
  twelfthMarksCardLink?: string;
  ugDegreeName?: string;
  ugUniversity?: string;
  ugCgpa?: number;
  ugYearOfPassing?: number;
}

export interface ExperienceEntry {
  id: string;
  company: string;
  role: string;
  startDate: string;
  endDate: string | null;
  isCurrent: boolean;
  description: string;
}

export interface ProjectEntry {
  id: string;
  title: string;
  description: string;
  techStack: string[];
  githubLink?: string;
  demoLink?: string;
  startDate: string;
}

export interface CertificationEntry {
  id: string;
  name: string;
  issuer: string;
  issueDate: string;
  expiryDate?: string;
  credentialId?: string;
  credentialUrl?: string;
}

export interface LanguageEntry {
  name: string;
  proficiency: "Basic" | "Conversational" | "Fluent" | "Native";
}

export interface Company {
  id: string;
  userId: string;
  name: string;
  logoS3Key: string | null;
  logoUrl?: string;
  website: string | null;
  hqCity: string | null;
  sector: string | null;
  annualTurnoverRange: string | null;
  description: string | null;
  hrName: string | null;
  hrPhone: string | null;
  profileComplete: boolean;
  email?: string;
  isActive?: boolean;
}

export interface Job {
  id: string;
  companyId: string;
  company?: Company;
  title: string;
  description: string;
  requiredSkills: string[];
  allowedDepartments: string[];
  minCgpa: number;
  minTenthPercent: number;
  minTwelfthPercent: number;
  maxBacklogs: number;
  ctcMinLpa: number | null;
  ctcMaxLpa: number | null;
  totalVacancies: number;
  numRounds: number;
  roundsConfig: RoundConfig[];
  timePerCandidateMin: number;
  workMode: string | null;
  workLocation: string | null;
  bondYears: number | null;
  bondAmountInr: number | null;
  joiningDate: string | null;
  status: JobStatus;
}

export interface RoundConfig {
  round: number;
  name: string;
  type: RoundType;
}

export interface Application {
  id: string;
  studentId: string;
  jobId: string;
  student?: Student;
  job?: Job;
  cvId: string | null;
  matchScore: number | null;
  atsScore: number | null;
  adminApproved: boolean | null;
  adminApprovedAt: string | null;
  currentRound: number;
  finalResult: "pending" | "selected" | "rejected";
  offeredCtcLpa: number | null;
}

export interface CV {
  id: string;
  studentId: string;
  title: string;
  targetRole: string;
  s3Key: string;
  fileSizeBytes: number;
  isActive: boolean;
  version: number;
  uploadedAt: string;
}

export interface InterviewSlot {
  id: string;
  applicationId: string;
  application?: Application;
  roundNumber: number;
  scheduledStart: string;
  scheduledEnd: string;
  durationOverrideMin: number | null;
  venue: string | null;
  attendance: AttendanceStatus;
  roundResult: RoundResult;
  markedBy: string | null;
  markedAt: string | null;
}

export interface Notification {
  id: string;
  userId: string;
  type: string;
  title: string;
  body: string;
  metadata: Record<string, unknown>;
  isRead: boolean;
  createdAt: string;
}

export interface DashboardStats {
  totalStudents: number;
  totalCompanies: number;
  totalPlaced: number;
  totalShortlisted: number;
  avgCtc: number;
  profileCompletionRate: number;
  placementRate: number;
  departmentStats: DepartmentStat[];
  companyStats: CompanyStat[];
  monthlyTrend: MonthlyTrend[];
}

export interface DepartmentStat {
  department: string;
  total: number;
  placed: number;
  percentage: number;
}

export interface CompanyStat {
  company: string;
  placed: number;
  avgCtc: number;
}

export interface MonthlyTrend {
  month: string;
  placements: number;
  offers: number;
}

export interface UploadHistory {
  id: string;
  filename: string;
  uploadedAt: string;
  totalRows: number;
  successCount: number;
  failedCount: number;
  status: "processing" | "completed" | "failed";
}

// Navigation items
export interface NavItem {
  label: string;
  href: string;
  icon: string;
  badge?: number;
}
