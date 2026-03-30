import type {
  ApplicationStatus,
  AuthSession,
  BrowseJobsFilters,
  EnrichedJob,
  LandingHighlights,
  OrganiserDashboardData,
  Profile,
  RankedStaffRow,
  Rating,
  StaffDashboardData,
  StaffDirectoryFilters
} from "@/types/domain";
import type {
  CreateEventInput,
  CreateJobInput,
  JobApplicationInput,
  LoginInput,
  OrganiserSignupInput,
  StaffRatingInput,
  StaffSignupInput
} from "@/lib/validation/schemas";

export interface StaffBookDataProvider {
  getMode(): "demo" | "live";
  getSession(): Promise<AuthSession | null>;
  signUpOrganiser(input: OrganiserSignupInput): Promise<AuthSession>;
  signUpStaff(input: StaffSignupInput): Promise<AuthSession>;
  signIn(input: LoginInput): Promise<AuthSession>;
  signOut(): Promise<void>;
  getCurrentProfile(): Promise<Profile | null>;
  getLandingHighlights(): Promise<LandingHighlights>;
  getJobs(filters?: BrowseJobsFilters): Promise<EnrichedJob[]>;
  getJobById(id: string): Promise<EnrichedJob | null>;
  getRankedStaff(filters?: StaffDirectoryFilters): Promise<RankedStaffRow[]>;
  getOrganiserDashboard(): Promise<OrganiserDashboardData>;
  getStaffDashboard(): Promise<StaffDashboardData>;
  createEvent(input: CreateEventInput): Promise<void>;
  createJob(input: CreateJobInput): Promise<void>;
  applyToJob(input: JobApplicationInput): Promise<void>;
  updateApplicationStatus(applicationId: string, status: ApplicationStatus): Promise<void>;
  markEventCompleted(eventId: string): Promise<void>;
  submitRating(input: StaffRatingInput): Promise<Rating>;
}
