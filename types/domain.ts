export type ProfileRole = "organiser" | "staff";
export type MembershipRole = "owner" | "manager";
export type EventStatus = "draft" | "published" | "completed" | "cancelled";
export type JobStatus = "draft" | "open" | "closed" | "cancelled";
export type ApplicationStatus = "pending" | "accepted" | "rejected" | "withdrawn";
export type RuntimeMode = "demo" | "live";

export interface Organization {
  id: string;
  name: string;
  slug: string;
  createdAt: string;
}

export interface Profile {
  id: string;
  role: ProfileRole;
  fullName: string;
  email: string;
  phone?: string;
  companyName?: string;
  bio?: string;
  skills: string[];
  availability?: string;
  avatarUrl?: string;
  createdAt: string;
}

export interface OrganizationMembership {
  id: string;
  organizationId: string;
  profileId: string;
  role: MembershipRole;
  createdAt: string;
}

export interface Event {
  id: string;
  organizationId: string;
  createdBy: string;
  title: string;
  description: string;
  location: string;
  eventDate: string;
  eventType: string;
  requiredRoles: string[];
  status: EventStatus;
  createdAt: string;
  updatedAt: string;
}

export interface Job {
  id: string;
  eventId: string;
  organizationId: string;
  createdBy: string;
  title: string;
  description: string;
  roleType: string;
  shiftStart: string;
  shiftEnd: string;
  payRate: number;
  positionsNeeded: number;
  status: JobStatus;
  createdAt: string;
  updatedAt: string;
}

export interface Application {
  id: string;
  jobId: string;
  staffId: string;
  status: ApplicationStatus;
  coverNote: string;
  appliedAt: string;
  updatedAt: string;
}

export interface ApplicationStatusHistoryEntry {
  id: string;
  applicationId: string;
  fromStatus: ApplicationStatus | null;
  toStatus: ApplicationStatus;
  actorId: string;
  createdAt: string;
}

export interface Rating {
  id: string;
  eventId: string;
  organizationId: string;
  staffId: string;
  organiserId: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export interface StaffRatingSummary {
  staffId: string;
  averageRating: number;
  reviewCount: number;
  weightedScore: number;
}

export interface RankedStaffRow extends StaffRatingSummary {
  profile: Profile;
  rank: number;
  topBadge?: "Top Rated" | "Reliable" | "Rising";
}

export interface AuthSession {
  mode: RuntimeMode;
  userId: string;
  role: ProfileRole;
  email: string;
}

export interface LandingHighlights {
  featuredJobs: EnrichedJob[];
  topStaff: RankedStaffRow[];
  stats: {
    activeJobs: number;
    organisers: number;
    staff: number;
    placements: number;
  };
}

export interface EnrichedEvent extends Event {
  organization: Organization;
}

export interface EnrichedJob extends Job {
  event: Event;
  organization: Organization;
  applicationCount: number;
}

export interface EnrichedApplication extends Application {
  job: Job;
  event: Event;
  organization: Organization;
  staff: Profile;
}

export interface RatingQueueItem {
  event: Event;
  staff: Profile;
  application: Application;
  job: Job;
}

export interface OrganiserDashboardData {
  session: AuthSession;
  organization: Organization;
  profile: Profile;
  stats: {
    upcomingEvents: number;
    activeJobs: number;
    pendingApplicants: number;
    completedEvents: number;
  };
  events: Event[];
  jobs: EnrichedJob[];
  recentApplicants: EnrichedApplication[];
  ratingQueue: RatingQueueItem[];
}

export interface StaffDashboardData {
  session: AuthSession;
  profile: Profile;
  ratingSummary: StaffRatingSummary;
  rank: number;
  recentApplications: EnrichedApplication[];
  recommendedJobs: EnrichedJob[];
  reviews: Rating[];
}

export interface DemoDatabase {
  organizations: Organization[];
  profiles: Profile[];
  organizationMemberships: OrganizationMembership[];
  events: Event[];
  jobs: Job[];
  applications: Application[];
  applicationHistory: ApplicationStatusHistoryEntry[];
  ratings: Rating[];
}

export interface BrowseJobsFilters {
  query?: string;
  location?: string;
  roleType?: string;
  minimumPay?: number;
  date?: string;
}

export interface StaffDirectoryFilters {
  query?: string;
  skill?: string;
  availability?: string;
  sort?: "ranking" | "rating" | "reviews";
}
