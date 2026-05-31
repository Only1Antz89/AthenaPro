import type {
  ApplicationStatus,
  AuthSession,
  BrowseJobsFilters,
  JobAlert,
  JobStatus,
  LandingHighlights,
  Notification,
  OperatorProfile,
  OperatorWorkspaceData,
  Profile,
  RankedStaffRow,
  Rating,
  StaffDashboardData,
  StaffJobsBoardData,
  StaffDirectoryFilters
} from "@/types/domain";
import type {
  ClientFeedbackInput,
  CreateEventInput,
  CreateJobInput,
  JobApplicationInput,
  JobAlertInput,
  LoginInput,
  OperatorReviewInput,
  OrganiserSignupInput,
  PasswordResetRequestInput,
  StaffSignupInput,
  UpdateEmailInput,
  UpdateMarketingPreferencesInput,
  UpdateOperatorAvailabilityInput,
  UpdateOperatorProfileInput,
  UpdatePasswordInput
} from "@/lib/validation/schemas";

export interface StaffBookDataProvider {
  getMode(): "demo" | "live";
  getSession(): Promise<AuthSession | null>;
  signUpOrganiser(input: OrganiserSignupInput): Promise<AuthSession>;
  signUpStaff(input: StaffSignupInput): Promise<AuthSession>;
  signIn(input: LoginInput): Promise<AuthSession>;
  signOut(): Promise<void>;
  requestPasswordReset(input: PasswordResetRequestInput, redirectTo: string): Promise<void>;
  getCurrentProfile(): Promise<Profile | null>;
  getCurrentOperatorProfile(): Promise<OperatorProfile | null>;
  getLandingHighlights(): Promise<LandingHighlights>;
  getJobs(filters?: BrowseJobsFilters): Promise<import("@/types/domain").EnrichedJob[]>;
  getJobById(id: string): Promise<import("@/types/domain").EnrichedJob | null>;
  getRankedStaff(filters?: StaffDirectoryFilters): Promise<RankedStaffRow[]>;
  getOrganiserDashboard(): Promise<import("@/types/domain").OrganiserDashboardData>;
  getStaffDashboard(): Promise<StaffDashboardData>;
  getStaffJobsBoard(): Promise<StaffJobsBoardData>;
  getOperatorWorkspace(): Promise<OperatorWorkspaceData>;
  getNotifications(): Promise<Notification[]>;
  getJobAlerts(): Promise<JobAlert[]>;
  createEvent(input: CreateEventInput): Promise<void>;
  createJob(input: CreateJobInput): Promise<void>;
  updateJobStatus(jobId: string, status: Extract<JobStatus, "open" | "closed" | "cancelled">): Promise<void>;
  applyToJob(input: JobApplicationInput): Promise<void>;
  withdrawApplication(applicationId: string): Promise<void>;
  recordJobView(jobId: string): Promise<void>;
  saveJob(jobId: string): Promise<void>;
  unsaveJob(jobId: string): Promise<void>;
  upsertJobAlert(input: JobAlertInput): Promise<JobAlert>;
  deleteJobAlert(alertId: string): Promise<void>;
  updateApplicationStatus(applicationId: string, status: ApplicationStatus): Promise<{ warning?: string }>;
  markEventCompleted(eventId: string): Promise<void>;
  submitOperatorReview(input: OperatorReviewInput): Promise<Rating>;
  submitClientFeedback(input: ClientFeedbackInput): Promise<void>;
  updateOperatorProfile(input: UpdateOperatorProfileInput): Promise<void>;
  updateOperatorAvailability(input: UpdateOperatorAvailabilityInput): Promise<void>;
  updateEmail(input: UpdateEmailInput): Promise<void>;
  updateMarketingPreferences(input: UpdateMarketingPreferencesInput): Promise<void>;
  updatePassword(input: UpdatePasswordInput): Promise<void>;
}
