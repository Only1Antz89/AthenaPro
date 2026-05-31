export type ProfileRole = "organiser" | "staff";
export type MembershipRole = "owner" | "manager";
export type EventStatus = "draft" | "published" | "completed" | "cancelled";
export type JobStatus = "draft" | "open" | "closed" | "cancelled";
export type ApplicationStatus = "pending" | "accepted" | "rejected" | "withdrawn";
export type RuntimeMode = "demo" | "live";
export type ServiceTier = "festival" | "mixed" | "formal" | "high_end";
export type ServiceTierSource = "default" | "manual" | "ai_suggested";
export type FeedbackSentiment = "up" | "down";
export type PaymentProvider = "stripe";
export type NotificationType =
  | "review_due"
  | "promotion_due"
  | "demotion_risk"
  | "job_match"
  | "operator_match"
  | "client_feedback_due"
  | "job_alert"
  | "company_message"
  | "event_pre_day"
  | "event_on_day"
  | "event_post_event"
  | "company_job_posted";
export type NotificationEmailStatus = "queued" | "processing" | "sent" | "failed";
export type JobBoardSort = "newest" | "soonest" | "pay" | "match" | "trending";
export type ClientFeedbackReason =
  | "clear_brief"
  | "respectful_team"
  | "well_organised"
  | "fair_pay"
  | "would_work_again"
  | "unclear_brief"
  | "disrespectful_treatment"
  | "poor_organisation"
  | "payment_issues"
  | "unsafe_or_overwhelming";

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
  location?: string;
  languages?: string[];
  preferredRoles?: string[];
  age?: number;
  createdAt: string;
  updatedAt?: string;
}

export interface OperatorProfile {
  profileId: string;
  displayName: string;
  headline?: string;
  baseLocation?: string;
  details?: string;
  preferredRoles: string[];
  languages: string[];
  canDrive?: boolean;
  dateOfBirth?: string;
  age?: number;
  avatarUrl?: string;
  availabilitySummary?: string;
  stripeAccountStatus?: OperatorPaymentProfile["onboardingStatus"];
  createdAt: string;
  updatedAt: string;
}

export interface OperatorAvailabilityRule {
  id: string;
  operatorId: string;
  dayOfWeek: number;
  isAvailable: boolean;
  isAllDay: boolean;
  startTime?: string;
  endTime?: string;
}

export interface OperatorPaymentProfile {
  operatorId: string;
  provider: PaymentProvider;
  accountId?: string;
  onboardingStatus: "not_started" | "pending" | "ready";
  payoutsEnabled: boolean;
  detailsSubmitted: boolean;
  lastSyncedAt?: string;
  updatedAt: string;
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
  serviceTier: ServiceTier;
  serviceTierSource: ServiceTierSource;
  suggestedServiceTier?: ServiceTier | null;
  aiSuggestedTags?: string[];
  aiSuggestedRoles?: string[];
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
  minimumAge?: number | null;
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

export interface JobViewEvent {
  id: string;
  jobId: string;
  viewerId: string;
  viewedAt: string;
}

export interface SavedJob {
  staffId: string;
  jobId: string;
  createdAt: string;
}

export interface JobAlert {
  id: string;
  staffId: string;
  name: string;
  query?: string;
  location?: string;
  roleTypes: string[];
  minimumPay?: number | null;
  dateFrom?: string;
  dateTo?: string;
  isActive: boolean;
  emailOptIn: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CompanyFollow {
  staffId: string;
  organizationId: string;
  createdAt: string;
}

export interface JobLike {
  staffId: string;
  jobId: string;
  createdAt: string;
}

export interface DismissedJob {
  staffId: string;
  jobId: string;
  createdAt: string;
}

export interface JobMediaSlide {
  id: string;
  jobId: string;
  organizationId: string;
  imageUrl: string;
  altText?: string;
  caption?: string;
  sortOrder: number;
  createdAt: string;
}

export interface ConversationThread {
  id: string;
  organizationId: string;
  staffId: string;
  jobId?: string;
  eventId?: string;
  applicationId?: string;
  subject: string;
  lastMessageAt: string;
  createdAt: string;
}

export interface ConversationMessage {
  id: string;
  threadId: string;
  senderId: string;
  body: string;
  createdAt: string;
  readAt?: string;
}

export interface PushSubscriptionRecord {
  id: string;
  userId: string;
  endpoint: string;
  p256dh: string;
  auth: string;
  userAgent?: string;
  createdAt: string;
  updatedAt: string;
}

export interface EnrichedConversationThread extends ConversationThread {
  organization: Organization;
  job?: EnrichedJob;
  messages: ConversationMessage[];
  unreadCount: number;
}

export interface PerformanceCategoryScores {
  reliability: number;
  professionalism: number;
  communication: number;
  customerService: number;
  pressureHandling: number;
}

export interface OperatorReview {
  id: string;
  eventId: string;
  jobId: string;
  organizationId: string;
  staffId: string;
  organiserId: string;
  reliabilityScore: number;
  professionalismScore: number;
  communicationScore: number;
  customerServiceScore: number;
  pressureHandlingScore: number;
  overallScore: number;
  rating: number;
  comment: string;
  createdAt: string;
}

export type Rating = OperatorReview;

export interface OperatorPerformanceSummary {
  staffId: string;
  overallRating: number;
  averageRating: number;
  reviewCount: number;
  weightedScore: number;
  categoryRatings: PerformanceCategoryScores;
  ratingBand: number;
  promotionDue: boolean;
  demotionRisk: boolean;
  lastTwoAverage: number;
}

export type StaffRatingSummary = OperatorPerformanceSummary;

export interface RankedStaffRow extends OperatorPerformanceSummary {
  profile: Profile;
  rank: number;
  topBadge?: "Prime" | "Lead" | "Verified";
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

export interface ReviewQueueItem {
  event: Event;
  staff: Profile;
  application: Application;
  job: Job;
}

export type RatingQueueItem = ReviewQueueItem;

export interface ClientFeedback {
  id: string;
  assignmentId: string;
  jobId: string;
  organizationId: string;
  staffId: string;
  clientId: string;
  sentiment: FeedbackSentiment;
  reasons: ClientFeedbackReason[];
  note?: string;
  createdAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  href?: string;
  isRead: boolean;
  createdAt: string;
  emailStatus?: NotificationEmailStatus;
}

export interface NotificationEmailJob {
  id: string;
  notificationId: string;
  userId: string;
  templateKey: NotificationType;
  status: NotificationEmailStatus;
  payload: string;
  createdAt: string;
  updatedAt: string;
}

export interface MarketingPreference {
  profileId: string;
  emailNormalized?: string;
  newsletterOptIn: boolean;
  offersOptIn: boolean;
  productUpdatesOptIn: boolean;
  newsletterOptedInAt?: string;
  newsletterOptedOutAt?: string;
  marketingOptedOutAt?: string;
  unsubscribeToken?: string;
  source: string;
  createdAt: string;
  updatedAt: string;
}

export interface MatchScoreBreakdown {
  roleFit: number;
  availability: number;
  locationFit: number;
  categoryFit: number;
  repeatHistory: number;
  relationship: number;
}

export interface SuggestedJob {
  job: EnrichedJob;
  score: number;
  breakdown: MatchScoreBreakdown;
  reasons: string[];
}

export interface SuggestedOperator {
  operator: RankedStaffRow;
  score: number;
  breakdown: MatchScoreBreakdown;
  reasons: string[];
}

export interface JobTrendingSignals {
  views24h: number;
  views72h: number;
  applications24h: number;
  applications72h: number;
}

export interface OrganiserDashboardData {
  session: AuthSession;
  organization: Organization;
  profile: Profile;
  marketingPreference: MarketingPreference;
  stats: {
    upcomingEvents: number;
    activeJobs: number;
    pendingApplicants: number;
    completedEvents: number;
  };
  events: Event[];
  jobs: EnrichedJob[];
  recentApplicants: EnrichedApplication[];
  ratingQueue: ReviewQueueItem[];
  operatorSuggestions: Record<string, SuggestedOperator[]>;
  notifications: Notification[];
}

export interface StaffDashboardData {
  session: AuthSession;
  profile: Profile;
  operatorProfile: OperatorProfile | null;
  performanceSummary: OperatorPerformanceSummary;
  ratingSummary: StaffRatingSummary;
  rank: number;
  recentApplications: EnrichedApplication[];
  recommendedJobs: SuggestedJob[];
  reviews: OperatorReview[];
  notifications: Notification[];
  clientFeedbackQueue: EnrichedApplication[];
}

export interface StaffJobsBoardItem {
  job: EnrichedJob;
  hasApplied: boolean;
  applicationId?: string;
  applicationStatus?: ApplicationStatus;
  isSaved: boolean;
  isLiked: boolean;
  isDismissed: boolean;
  isFollowingCompany: boolean;
  mediaSlides: JobMediaSlide[];
  matchScore: number;
  matchReasons: string[];
  trendingScore: number;
  trendingSignals: JobTrendingSignals;
}

export interface StaffJobsBoardData {
  session: AuthSession;
  profile: Profile;
  operatorProfile: OperatorProfile | null;
  items: StaffJobsBoardItem[];
  alerts: JobAlert[];
  followedOrganizations: CompanyFollow[];
  conversations: EnrichedConversationThread[];
  pushSubscriptions: PushSubscriptionRecord[];
}

export interface OperatorWorkspaceData {
  session: AuthSession;
  profile: Profile;
  operatorProfile: OperatorProfile;
  marketingPreference: MarketingPreference;
  performanceSummary: OperatorPerformanceSummary;
  availabilityRules: OperatorAvailabilityRule[];
  paymentProfile: OperatorPaymentProfile;
  notifications: Notification[];
  recentApplications: EnrichedApplication[];
  recommendedJobs: SuggestedJob[];
  recentReviews: OperatorReview[];
  clientFeedbackQueue: EnrichedApplication[];
  savedJobs: StaffJobsBoardItem[];
  likedJobs: StaffJobsBoardItem[];
  dismissedJobs: StaffJobsBoardItem[];
  conversations: EnrichedConversationThread[];
  pushSubscriptions: PushSubscriptionRecord[];
}

export interface DemoDatabase {
  organizations: Organization[];
  profiles: Profile[];
  operatorProfiles: OperatorProfile[];
  operatorAvailabilityRules: OperatorAvailabilityRule[];
  operatorPaymentProfiles: OperatorPaymentProfile[];
  organizationMemberships: OrganizationMembership[];
  events: Event[];
  jobs: Job[];
  applications: Application[];
  applicationHistory: ApplicationStatusHistoryEntry[];
  jobViewEvents: JobViewEvent[];
  savedJobs: SavedJob[];
  jobAlerts: JobAlert[];
  companyFollows: CompanyFollow[];
  jobLikes: JobLike[];
  dismissedJobs: DismissedJob[];
  jobMediaSlides: JobMediaSlide[];
  conversationThreads: ConversationThread[];
  conversationMessages: ConversationMessage[];
  pushSubscriptions: PushSubscriptionRecord[];
  ratings: OperatorReview[];
  clientFeedback: ClientFeedback[];
  notifications: Notification[];
  notificationEmailJobs: NotificationEmailJob[];
  marketingPreferences: MarketingPreference[];
}

export interface BrowseJobsFilters {
  query?: string;
  location?: string;
  roleType?: string;
  roleTypes?: string[];
  minimumPay?: number;
  date?: string;
  dateFrom?: string;
  dateTo?: string;
  savedOnly?: boolean;
  sort?: JobBoardSort;
}

export interface StaffDirectoryFilters {
  query?: string;
  skill?: string;
  availability?: string;
  sort?: "ranking" | "rating" | "reviews";
}
