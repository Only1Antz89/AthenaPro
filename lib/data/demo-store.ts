import { DEMO_DB_KEY } from "@/lib/auth/demo-session";
import { buildStaffJobsBoardItems, buildSuggestedJobMap, buildTrendingSignals } from "@/lib/domain/jobs-board";
import { canRateStaff, canSubmitClientFeedback, canTransitionApplication } from "@/lib/domain/permissions";
import { buildAiSuggestedEventMetadata, buildSuggestedJobsForOperator, buildSuggestedOperatorsForJob } from "@/lib/domain/matching";
import { buildPerformanceSummary, buildRankedStaff, buildRatingSummaries } from "@/lib/domain/ranking";
import { buildBaseDemoDatabase } from "@/lib/data/demo-seed";
import { AppError } from "@/lib/errors";
import { buildNotification, buildNotificationEmailJob } from "@/lib/services/notification-service";
import { generateId, slugify } from "@/lib/utils";
import type {
  Application,
  ApplicationStatus,
  AuthSession,
  ClientFeedback,
  DemoDatabase,
  EnrichedApplication,
  EnrichedJob,
  Event,
  JobViewEvent,
  LandingHighlights,
  MarketingPreference,
  Notification,
  OperatorAvailabilityRule,
  OperatorProfile,
  OperatorWorkspaceData,
  Profile,
  RankedStaffRow,
  Rating,
  ReviewQueueItem,
  StaffDashboardData,
  StaffJobsBoardData
} from "@/types/domain";
import type {
  ClientFeedbackInput,
  CreateEventInput,
  CreateJobInput,
  JobApplicationInput,
  JobAlertInput,
  OperatorReviewInput,
  OrganiserSignupInput,
  StaffSignupInput,
  UpdateMarketingPreferencesInput,
  UpdateOperatorAvailabilityInput,
  UpdateOperatorProfileInput
} from "@/lib/validation/schemas";

function readDemoDatabase(): DemoDatabase {
  if (typeof window === "undefined") {
    return buildBaseDemoDatabase();
  }

  const raw = window.localStorage.getItem(DEMO_DB_KEY);

  if (!raw) {
    const seed = buildBaseDemoDatabase();
    window.localStorage.setItem(DEMO_DB_KEY, JSON.stringify(seed));
    return seed;
  }

  try {
    return normalizeDemoDatabase(JSON.parse(raw) as DemoDatabase);
  } catch {
    const seed = buildBaseDemoDatabase();
    window.localStorage.setItem(DEMO_DB_KEY, JSON.stringify(seed));
    return seed;
  }
}

function normalizeDemoDatabase(database: DemoDatabase): DemoDatabase {
  return {
    ...database,
    savedJobs: database.savedJobs ?? [],
    jobAlerts: database.jobAlerts ?? []
  };
}

function writeDemoDatabase(database: DemoDatabase) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(DEMO_DB_KEY, JSON.stringify(database));
}

const JOB_VIEW_DEDUPLICATION_WINDOW_MS = 6 * 60 * 60 * 1000;

function findProfile(database: DemoDatabase, profileId: string) {
  return database.profiles.find((profile) => profile.id === profileId) ?? null;
}

function findOperatorProfile(database: DemoDatabase, profileId: string) {
  return database.operatorProfiles.find((profile) => profile.profileId === profileId) ?? null;
}

function getAvailabilityRules(database: DemoDatabase, operatorId: string) {
  return database.operatorAvailabilityRules
    .filter((rule) => rule.operatorId === operatorId)
    .sort((left, right) => left.dayOfWeek - right.dayOfWeek);
}

function getPaymentProfile(database: DemoDatabase, operatorId: string) {
  return (
    database.operatorPaymentProfiles.find((profile) => profile.operatorId === operatorId) ?? {
      operatorId,
      provider: "stripe" as const,
      onboardingStatus: "not_started" as const,
      payoutsEnabled: false,
      detailsSubmitted: false,
      updatedAt: new Date().toISOString()
    }
  );
}

function getOrganisationForProfile(database: DemoDatabase, profileId: string) {
  const membership = database.organizationMemberships.find((entry) => entry.profileId === profileId);

  if (!membership) {
    return null;
  }

  return (
    database.organizations.find((organization) => organization.id === membership.organizationId) ?? null
  );
}

function enrichJob(database: DemoDatabase, jobId: string): EnrichedJob {
  const job = database.jobs.find((item) => item.id === jobId);

  if (!job) {
    throw new AppError("Job not found.", "NOT_FOUND", 404);
  }

  const event = database.events.find((item) => item.id === job.eventId);
  const organization = database.organizations.find((item) => item.id === job.organizationId);

  if (!event || !organization) {
    throw new AppError("Job relationships are incomplete.", "RELATIONSHIP_ERROR", 500);
  }

  return {
    ...job,
    event,
    organization,
    applicationCount: database.applications.filter((application) => application.jobId === job.id).length
  };
}

function enrichApplication(database: DemoDatabase, application: Application): EnrichedApplication {
  const job = database.jobs.find((item) => item.id === application.jobId);
  const staff = database.profiles.find((item) => item.id === application.staffId);

  if (!job || !staff) {
    throw new AppError("Application relationships are incomplete.", "RELATIONSHIP_ERROR", 500);
  }

  const event = database.events.find((item) => item.id === job.eventId);
  const organization = database.organizations.find((item) => item.id === job.organizationId);

  if (!event || !organization) {
    throw new AppError("Application relationships are incomplete.", "RELATIONSHIP_ERROR", 500);
  }

  return {
    ...application,
    job,
    event,
    organization,
    staff
  };
}

function getReviewQueue(database: DemoDatabase, organisationId: string): ReviewQueueItem[] {
  const ratedKeys = new Set(database.ratings.map((rating) => `${rating.jobId}:${rating.staffId}`));

  return database.applications
    .filter((application) => application.status === "accepted")
    .map((application) => enrichApplication(database, application))
    .filter(
      (application) =>
        application.organization.id === organisationId &&
        canRateStaff(application.event, application.status) &&
        !ratedKeys.has(`${application.job.id}:${application.staff.id}`)
    )
    .map((application) => ({
      event: application.event,
      staff: application.staff,
      application,
      job: application.job
    }));
}

function getClientFeedbackQueue(database: DemoDatabase, staffId: string) {
  const feedbackKeys = new Set(
    database.clientFeedback.map((item) => `${item.assignmentId}:${item.staffId}`)
  );

  return database.applications
    .filter((application) => application.staffId === staffId && application.status === "accepted")
    .map((application) => enrichApplication(database, application))
    .filter(
      (application) =>
        canSubmitClientFeedback(application.event, application.status) &&
        !feedbackKeys.has(`${application.id}:${staffId}`)
    );
}

function pushNotification(
  database: DemoDatabase,
  input: Parameters<typeof buildNotification>[0],
  emailPayload: Record<string, string>
) {
  const notification = buildNotification(input);
  database.notifications.push(notification);
  database.notificationEmailJobs.push(buildNotificationEmailJob(notification, emailPayload));
}

function buildOrganiserNotifications(
  database: DemoDatabase,
  organisationId: string,
  operatorSuggestions: Record<string, ReturnType<typeof buildSuggestedOperatorsForJob>>
) {
  const organisation = database.organizations.find((item) => item.id === organisationId);
  const reviewQueue = getReviewQueue(database, organisationId);
  const notifications = database.notifications.filter((item) => item.userId === database.organizationMemberships.find((entry) => entry.organizationId === organisationId)?.profileId);

  if (reviewQueue.length > 0) {
    notifications.unshift(
      buildNotification({
        userId: database.organizationMemberships.find((entry) => entry.organizationId === organisationId)!.profileId,
        type: "review_due",
        title: "Reviews waiting",
        body: `${reviewQueue.length} completed assignment${reviewQueue.length > 1 ? "s" : ""} still need operator reviews.`,
        href: "/dashboard/organiser"
      })
    );
  }

  if (Object.values(operatorSuggestions).some((items) => items.length > 0) && organisation) {
    notifications.unshift(
      buildNotification({
        userId: database.organizationMemberships.find((entry) => entry.organizationId === organisationId)!.profileId,
        type: "operator_match",
        title: "Suggested operators ready",
        body: `Fresh operator matches are available for ${organisation.name}'s live briefs.`,
        href: "/dashboard/organiser"
      })
    );
  }

  return notifications
    .sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime())
    .slice(0, 6);
}

function buildStaffNotifications(
  database: DemoDatabase,
  session: AuthSession,
  recommendedJobs: ReturnType<typeof buildSuggestedJobsForOperator>,
  feedbackQueue: EnrichedApplication[],
  performance = buildPerformanceSummary(session.userId, database.ratings)
) {
  const notifications = database.notifications.filter((item) => item.userId === session.userId);

  if (performance.promotionDue) {
    notifications.unshift(
      buildNotification({
        userId: session.userId,
        type: "promotion_due",
        title: "Promotion within reach",
        body: "Complete the next job with another strong rating to move into the next rating band.",
        href: "/dashboard/staff"
      })
    );
  }

  if (performance.demotionRisk) {
    notifications.unshift(
      buildNotification({
        userId: session.userId,
        type: "demotion_risk",
        title: "Performance dip detected",
        body: "The last reviews have pulled your score toward the lower band. A strong next shift will stabilize it.",
        href: "/dashboard/staff"
      })
    );
  }

  if (recommendedJobs[0]) {
    notifications.unshift(
      buildNotification({
        userId: session.userId,
        type: "job_match",
        title: "New job match",
        body: `${recommendedJobs[0].job.title} looks like a strong fit for your profile and availability.`,
        href: `/jobs/${recommendedJobs[0].job.id}`
      })
    );
  }

  if (feedbackQueue.length > 0) {
    notifications.unshift(
      buildNotification({
        userId: session.userId,
        type: "client_feedback_due",
        title: "Client feedback due",
        body: `You still have ${feedbackQueue.length} completed assignment${feedbackQueue.length > 1 ? "s" : ""} waiting for thumbs-up or thumbs-down feedback.`,
        href: "/dashboard/staff"
      })
    );
  }

  return notifications
    .sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime())
    .slice(0, 6);
}

function buildLandingHighlights(database: DemoDatabase): LandingHighlights {
  const activeJobs = database.jobs
    .filter((job) => job.status === "open")
    .slice(0, 4)
    .map((job) => enrichJob(database, job.id));
  const topStaff = buildRankedStaff(
    database.profiles.filter((profile) => profile.role === "staff"),
    database.ratings
  ).slice(0, 4);

  return {
    featuredJobs: activeJobs,
    topStaff,
    stats: {
      activeJobs: database.jobs.filter((job) => job.status === "open").length,
      organisers: database.profiles.filter((profile) => profile.role === "organiser").length,
      staff: database.profiles.filter((profile) => profile.role === "staff").length,
      placements: database.applications.filter((application) => application.status === "accepted").length
    }
  };
}

function buildOrganiserDashboardFromDb(database: DemoDatabase, session: AuthSession) {
  const profile = findProfile(database, session.userId);
  const organization = getOrganisationForProfile(database, session.userId);

  if (!profile || !organization) {
    throw new AppError("Organiser account is incomplete.", "MISSING_ACCOUNT", 404);
  }

  const organizationEvents = database.events.filter((event) => event.organizationId === organization.id);
  const organizationJobs = database.jobs
    .filter((job) => job.organizationId === organization.id)
    .map((job) => enrichJob(database, job.id));
  const recentApplicants = database.applications
    .filter((application) => organizationJobs.some((job) => job.id === application.jobId))
    .sort((left, right) => new Date(right.appliedAt).getTime() - new Date(left.appliedAt).getTime())
    .slice(0, 5)
    .map((application) => enrichApplication(database, application));
  const rankedOperators = buildRankedStaff(
    database.profiles.filter((item) => item.role === "staff"),
    database.ratings
  );
  const operatorProfiles = new Map(
    database.operatorProfiles.map((item) => [item.profileId, item] as const)
  );
  const availabilityRulesByOperatorId = new Map<string, OperatorAvailabilityRule[]>(
    database.operatorProfiles.map((item) => [item.profileId, getAvailabilityRules(database, item.profileId)])
  );
  const operatorSuggestions = Object.fromEntries(
    organizationJobs
      .filter((job) => job.status === "open")
      .map((job) => [
        job.id,
        buildSuggestedOperatorsForJob({
          job,
          operators: rankedOperators,
          operatorProfiles,
          availabilityRulesByOperatorId,
          feedback: database.clientFeedback
        }).slice(0, 5)
      ])
  );

  return {
    session,
    organization,
    profile,
    marketingPreference: getMarketingPreference(database, session.userId),
    stats: {
      upcomingEvents: organizationEvents.filter((event) => event.status === "published").length,
      activeJobs: organizationJobs.filter((job) => job.status === "open").length,
      pendingApplicants: recentApplicants.filter((application) => application.status === "pending").length,
      completedEvents: organizationEvents.filter((event) => event.status === "completed").length
    },
    events: organizationEvents.sort(
      (left, right) => new Date(right.eventDate).getTime() - new Date(left.eventDate).getTime()
    ),
    jobs: organizationJobs,
    recentApplicants,
    ratingQueue: getReviewQueue(database, organization.id),
    operatorSuggestions,
    notifications: buildOrganiserNotifications(database, organization.id, operatorSuggestions)
  };
}

function buildStaffDashboardFromDb(database: DemoDatabase, session: AuthSession): StaffDashboardData {
  const profile = findProfile(database, session.userId);

  if (!profile) {
    throw new AppError("Staff account is incomplete.", "MISSING_ACCOUNT", 404);
  }

  const operatorProfile = findOperatorProfile(database, session.userId);
  const rankedStaff = buildRankedStaff(
    database.profiles.filter((item) => item.role === "staff"),
    database.ratings
  );
  const performanceSummary =
    buildRatingSummaries(
      database.profiles.filter((item) => item.role === "staff"),
      database.ratings
    ).find((summary) => summary.staffId === session.userId) ?? buildPerformanceSummary(session.userId, []);
  const recommendedJobs = buildSuggestedJobsForOperator({
    jobs: database.jobs
      .filter((job) => job.status === "open")
      .map((job) => enrichJob(database, job.id)),
    profile,
    operatorProfile,
    availabilityRules: getAvailabilityRules(database, session.userId),
    performance: performanceSummary,
    feedback: database.clientFeedback
  }).slice(0, 5);
  const clientFeedbackQueue = getClientFeedbackQueue(database, session.userId);

  return {
    session,
    profile,
    operatorProfile,
    performanceSummary,
    ratingSummary: performanceSummary,
    rank:
      rankedStaff.find((entry) => entry.profile.id === session.userId)?.rank ?? rankedStaff.length,
    recentApplications: database.applications
      .filter((application) => application.staffId === session.userId)
      .sort((left, right) => new Date(right.appliedAt).getTime() - new Date(left.appliedAt).getTime())
      .slice(0, 5)
      .map((application) => enrichApplication(database, application)),
    recommendedJobs,
    reviews: database.ratings
      .filter((rating) => rating.staffId === session.userId)
      .sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime()),
    notifications: buildStaffNotifications(database, session, recommendedJobs, clientFeedbackQueue, performanceSummary),
    clientFeedbackQueue
  };
}

function buildStaffJobsBoardFromDb(database: DemoDatabase, session: AuthSession): StaffJobsBoardData {
  const profile = findProfile(database, session.userId);

  if (!profile) {
    throw new AppError("Staff account is incomplete.", "MISSING_ACCOUNT", 404);
  }

  const operatorProfile = findOperatorProfile(database, session.userId);
  const availabilityRules = getAvailabilityRules(database, session.userId);
  const performanceSummary =
    buildRatingSummaries(
      database.profiles.filter((item) => item.role === "staff"),
      database.ratings
    ).find((summary) => summary.staffId === session.userId) ?? buildPerformanceSummary(session.userId, []);
  const suggestedJobs = buildSuggestedJobsForOperator({
    jobs: database.jobs
      .filter((job) => job.status === "open")
      .map((job) => enrichJob(database, job.id)),
    profile,
    operatorProfile,
    availabilityRules,
    performance: performanceSummary,
    feedback: database.clientFeedback.filter((item) => item.staffId === session.userId)
  });
  const suggestedJobMap = buildSuggestedJobMap(suggestedJobs);
  const ownApplicationsByJobId = new Map(
    database.applications
      .filter((application) => application.staffId === session.userId)
      .map((application) => [application.jobId, application])
  );
  const savedJobIds = new Set(
    database.savedJobs.filter((savedJob) => savedJob.staffId === session.userId).map((savedJob) => savedJob.jobId)
  );

  return {
    session,
    profile,
    operatorProfile,
    alerts: database.jobAlerts
      .filter((alert) => alert.staffId === session.userId)
      .sort((left, right) => new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime()),
    items: buildStaffJobsBoardItems(
      database.jobs
        .filter((job) => job.status === "open")
        .map((job) => {
          const enrichedJob = enrichJob(database, job.id);
          const ownApplication = ownApplicationsByJobId.get(job.id);
          const suggestion = suggestedJobMap.get(job.id);

          return {
            job: enrichedJob,
            applicationId: ownApplication?.id,
            applicationStatus: ownApplication?.status,
            isSaved: savedJobIds.has(job.id),
            matchScore: suggestion?.score ?? 0,
            matchReasons: suggestion?.reasons ?? [],
            trendingSignals: buildTrendingSignals({
              jobId: job.id,
              applications: database.applications,
              viewEvents: database.jobViewEvents
            })
          };
        })
    )
  };
}

function recordJobViewInDatabase(database: DemoDatabase, viewerId: string, jobId: string, now = new Date()) {
  const threshold = now.getTime() - JOB_VIEW_DEDUPLICATION_WINDOW_MS;
  const hasRecentView = database.jobViewEvents.some(
    (event) =>
      event.jobId === jobId &&
      event.viewerId === viewerId &&
      new Date(event.viewedAt).getTime() >= threshold
  );

  if (hasRecentView) {
    return false;
  }

  database.jobViewEvents.push({
    id: generateId("view"),
    jobId,
    viewerId,
    viewedAt: now.toISOString()
  } satisfies JobViewEvent);

  return true;
}

function getMarketingPreference(database: DemoDatabase, profileId: string): MarketingPreference {
  const existing = database.marketingPreferences.find((item) => item.profileId === profileId);

  if (existing) {
    return existing;
  }

  return {
    profileId,
    emailNormalized: undefined,
    newsletterOptIn: false,
    offersOptIn: false,
    productUpdatesOptIn: false,
    newsletterOptedOutAt: new Date().toISOString(),
    marketingOptedOutAt: new Date().toISOString(),
    unsubscribeToken: generateId("unsubscribe"),
    source: "default",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
}

function buildOperatorWorkspaceFromDb(database: DemoDatabase, session: AuthSession): OperatorWorkspaceData {
  const dashboard = buildStaffDashboardFromDb(database, session);
  const operatorProfile = findOperatorProfile(database, session.userId);

  if (!operatorProfile) {
    throw new AppError("Operator profile not found.", "PROFILE_NOT_FOUND", 404);
  }

  return {
    session,
    profile: dashboard.profile,
    operatorProfile,
    marketingPreference: getMarketingPreference(database, session.userId),
    performanceSummary: dashboard.performanceSummary,
    availabilityRules: getAvailabilityRules(database, session.userId),
    paymentProfile: getPaymentProfile(database, session.userId),
    notifications: dashboard.notifications,
    recentReviews: dashboard.reviews.slice(0, 6),
    clientFeedbackQueue: dashboard.clientFeedbackQueue
  };
}

function buildStarterOrganiserWorkspace(database: DemoDatabase, profile: Profile, companyName: string) {
  const organizationId = generateId("org");
  const organization = {
    id: organizationId,
    name: companyName,
    slug: slugify(companyName),
    createdAt: new Date().toISOString()
  };

  const eventDraft: Event = {
    id: generateId("event"),
    organizationId,
    createdBy: profile.id,
    title: "Premium Client Evening",
    description: "A ready-to-demo evening event with hospitality and guest arrival roles.",
    location: "Central London",
    eventDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 5).toISOString(),
    eventType: "Private reception",
    requiredRoles: ["Host", "Bartender", "Runner"],
    serviceTier: "formal",
    serviceTierSource: "manual",
    suggestedServiceTier: "high_end",
    aiSuggestedTags: ["private", "hospitality", "vip"],
    aiSuggestedRoles: ["Host", "Bartender"],
    status: "published",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  const completedEvent: Event = {
    id: generateId("event"),
    organizationId,
    createdBy: profile.id,
    title: "Winter Investor Reception",
    description: "Completed showcase event used to demonstrate ratings and post-event ops.",
    location: "Mayfair, London",
    eventDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 8).toISOString(),
    eventType: "Corporate reception",
    requiredRoles: ["Host", "Bar assistant"],
    serviceTier: "high_end",
    serviceTierSource: "manual",
    suggestedServiceTier: "high_end",
    aiSuggestedTags: ["investor", "premium", "reception"],
    aiSuggestedRoles: ["Host", "Bar assistant"],
    status: "completed",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  const openJob = {
    id: generateId("job"),
    eventId: eventDraft.id,
    organizationId,
    createdBy: profile.id,
    title: "Guest Host",
    description: "Front-of-house role for arrivals, wayfinding, and guest confidence.",
    roleType: "Host",
    shiftStart: new Date(Date.now() + 1000 * 60 * 60 * 24 * 5).toISOString(),
    shiftEnd: new Date(Date.now() + 1000 * 60 * 60 * 24 * 5.25).toISOString(),
    payRate: 16,
    positionsNeeded: 2,
    minimumAge: 18,
    status: "open" as const,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  const ratingJob = {
    ...openJob,
    id: generateId("job"),
    eventId: completedEvent.id,
    title: "Reception Bartender",
    roleType: "Bartender",
    minimumAge: 21,
    status: "closed" as const
  };

  const applicant = database.profiles.find((item) => item.role === "staff")!;
  const acceptedApplicant = database.profiles.find((item) => item.id === "user_staff_5")!;

  const pendingApplication: Application = {
    id: generateId("app"),
    jobId: openJob.id,
    staffId: applicant.id,
    status: "pending",
    coverNote: "Available and experienced with premium guests.",
    appliedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  const acceptedApplication: Application = {
    id: generateId("app"),
    jobId: ratingJob.id,
    staffId: acceptedApplicant.id,
    status: "accepted",
    coverNote: "Experienced bartender for premium receptions.",
    appliedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 8).toISOString()
  };

  database.organizations.push(organization);
  database.organizationMemberships.push({
    id: generateId("membership"),
    organizationId,
    profileId: profile.id,
    role: "owner",
    createdAt: new Date().toISOString()
  });
  database.events.push(eventDraft, completedEvent);
  database.jobs.push(openJob, ratingJob);
  database.applications.push(pendingApplication, acceptedApplication);
}

function buildStarterStaffWorkspace(database: DemoDatabase, profile: Profile) {
  const relevantJobs = database.jobs.filter((job) => job.status === "open").slice(0, 2);
  const existingCompletedJob = database.jobs.find((job) => job.id === "job_10") ?? database.jobs[0]!;

  database.applications.push(
    ...relevantJobs.map(
      (job, index): Application => ({
        id: generateId("app"),
        jobId: job.id,
        staffId: profile.id,
        status: index === 0 ? "pending" : "accepted",
        coverNote: "Ready to jump into customer-facing event work and represent the brand well.",
        appliedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * (index + 1)).toISOString(),
        updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 12 * (index + 1)).toISOString()
      })
    )
  );

  const firstScores = {
    reliabilityScore: 5,
    professionalismScore: 5,
    communicationScore: 4,
    customerServiceScore: 5,
    pressureHandlingScore: 4
  };
  const secondScores = {
    reliabilityScore: 4,
    professionalismScore: 4,
    communicationScore: 4,
    customerServiceScore: 4,
    pressureHandlingScore: 4
  };

  for (const [scores, comment, offset] of [
    [firstScores, "Excellent professionalism and strong guest confidence.", 6],
    [secondScores, "Very solid shift performance and easy to brief.", 5]
  ] as const) {
    const overallScore =
      (scores.reliabilityScore +
        scores.professionalismScore +
        scores.communicationScore +
        scores.customerServiceScore +
        scores.pressureHandlingScore) /
      5;

    database.ratings.push({
      id: generateId("rating"),
      eventId: existingCompletedJob.eventId,
      jobId: existingCompletedJob.id,
      organizationId: existingCompletedJob.organizationId,
      staffId: profile.id,
      organiserId: existingCompletedJob.createdBy,
      ...scores,
      overallScore,
      rating: overallScore,
      comment,
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * offset).toISOString()
    });
  }
}

function ensureOperatorSupportRecords(
  database: DemoDatabase,
  profile: Profile,
  availabilitySummary: string,
  canDrive = false
) {
  if (!database.operatorProfiles.some((item) => item.profileId === profile.id)) {
    database.operatorProfiles.push({
      profileId: profile.id,
      displayName: profile.fullName,
      details: profile.bio,
      baseLocation: profile.location,
      preferredRoles: profile.preferredRoles ?? profile.skills.slice(0, 2),
      languages: profile.languages ?? ["English"],
      canDrive,
      dateOfBirth: "1998-01-01",
      age: profile.age,
      availabilitySummary,
      createdAt: profile.createdAt,
      updatedAt: new Date().toISOString()
    });
  }

  if (!database.operatorAvailabilityRules.some((item) => item.operatorId === profile.id)) {
    database.operatorAvailabilityRules.push(
      ...Array.from({ length: 7 }).map((_, dayOfWeek) => ({
        id: `${profile.id}_availability_${dayOfWeek}`,
        operatorId: profile.id,
        dayOfWeek,
        isAvailable: dayOfWeek >= 1 && dayOfWeek <= 5,
        isAllDay: false,
        startTime: "08:00",
        endTime: "18:00"
      }))
    );
  }

  if (!database.operatorPaymentProfiles.some((item) => item.operatorId === profile.id)) {
    database.operatorPaymentProfiles.push({
      operatorId: profile.id,
      provider: "stripe",
      onboardingStatus: "not_started",
      payoutsEnabled: false,
      detailsSubmitted: false,
      updatedAt: new Date().toISOString()
    });
  }
}

export const demoStore = {
  reset() {
    writeDemoDatabase(buildBaseDemoDatabase());
  },
  getSessionUser(session: AuthSession) {
    const database = readDemoDatabase();
    return findProfile(database, session.userId);
  },
  getOperatorProfile(session: AuthSession) {
    const database = readDemoDatabase();
    return findOperatorProfile(database, session.userId);
  },
  getLandingHighlights() {
    return buildLandingHighlights(readDemoDatabase());
  },
  getJobs() {
    const database = readDemoDatabase();
    return database.jobs.map((job) => enrichJob(database, job.id));
  },
  getJobById(jobId: string) {
    const database = readDemoDatabase();

    try {
      return enrichJob(database, jobId);
    } catch {
      return null;
    }
  },
  getRankedStaff(): RankedStaffRow[] {
    const database = readDemoDatabase();
    return buildRankedStaff(
      database.profiles.filter((profile) => profile.role === "staff"),
      database.ratings
    );
  },
  getNotifications(session: AuthSession): Notification[] {
    const database = readDemoDatabase();

    return session.role === "staff"
      ? buildStaffDashboardFromDb(database, session).notifications
      : buildOrganiserDashboardFromDb(database, session).notifications;
  },
  getJobAlerts(session: AuthSession) {
    const database = readDemoDatabase();

    if (session.role !== "staff") {
      return [];
    }

    return database.jobAlerts
      .filter((alert) => alert.staffId === session.userId)
      .sort((left, right) => new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime());
  },
  getStaffJobsBoard(session: AuthSession) {
    return buildStaffJobsBoardFromDb(readDemoDatabase(), session);
  },
  createOrganiserAccount(input: OrganiserSignupInput) {
    const database = readDemoDatabase();

    if (database.profiles.some((profile) => profile.email === input.email)) {
      throw new AppError("An account with that email already exists.", "DUPLICATE_EMAIL");
    }

    const profile: Profile = {
      id: generateId("user"),
      role: "organiser",
      fullName: input.fullName,
      email: input.email,
      companyName: input.companyName,
      skills: [],
      location: "London",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    database.profiles.push(profile);
    database.marketingPreferences.push({
      profileId: profile.id,
      emailNormalized: input.email.toLowerCase(),
      newsletterOptIn: input.newsletterConsent,
      offersOptIn: input.newsletterConsent,
      productUpdatesOptIn: input.newsletterConsent,
      newsletterOptedInAt: input.newsletterConsent ? new Date().toISOString() : undefined,
      newsletterOptedOutAt: input.newsletterConsent ? undefined : new Date().toISOString(),
      marketingOptedOutAt: input.newsletterConsent ? undefined : new Date().toISOString(),
      unsubscribeToken: generateId("unsubscribe"),
      source: "signup_organiser",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    } satisfies MarketingPreference);
    buildStarterOrganiserWorkspace(database, profile, input.companyName);
    writeDemoDatabase(database);

    return profile;
  },
  createStaffAccount(input: StaffSignupInput) {
    const database = readDemoDatabase();

    if (database.profiles.some((profile) => profile.email === input.email)) {
      throw new AppError("An account with that email already exists.", "DUPLICATE_EMAIL");
    }

    const profile: Profile = {
      id: generateId("user"),
      role: "staff",
      fullName: input.fullName,
      email: input.email,
      phone: input.phone,
      bio: input.bio,
      skills: input.skills.split(",").map((item) => item.trim()),
      availability: input.availability,
      location: input.location,
      languages: ["English"],
      preferredRoles: input.skills.split(",").map((item) => item.trim()).slice(0, 2),
      age: 24,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    database.profiles.push(profile);
    database.marketingPreferences.push({
      profileId: profile.id,
      emailNormalized: input.email.toLowerCase(),
      newsletterOptIn: input.newsletterConsent,
      offersOptIn: input.newsletterConsent,
      productUpdatesOptIn: input.newsletterConsent,
      newsletterOptedInAt: input.newsletterConsent ? new Date().toISOString() : undefined,
      newsletterOptedOutAt: input.newsletterConsent ? undefined : new Date().toISOString(),
      marketingOptedOutAt: input.newsletterConsent ? undefined : new Date().toISOString(),
      unsubscribeToken: generateId("unsubscribe"),
      source: "signup_staff",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    } satisfies MarketingPreference);
    ensureOperatorSupportRecords(database, profile, input.availability, input.canDrive);
    buildStarterStaffWorkspace(database, profile);
    writeDemoDatabase(database);

    return profile;
  },
  findProfileByEmail(email: string) {
    const database = readDemoDatabase();
    return database.profiles.find((profile) => profile.email === email) ?? null;
  },
  getOrganiserDashboard(session: AuthSession) {
    return buildOrganiserDashboardFromDb(readDemoDatabase(), session);
  },
  getStaffDashboard(session: AuthSession) {
    return buildStaffDashboardFromDb(readDemoDatabase(), session);
  },
  getOperatorWorkspace(session: AuthSession) {
    return buildOperatorWorkspaceFromDb(readDemoDatabase(), session);
  },
  createEvent(session: AuthSession, input: CreateEventInput) {
    const database = readDemoDatabase();
    const organization = getOrganisationForProfile(database, session.userId);

    if (!organization) {
      throw new AppError("No organisation found for organiser.", "NO_ORG");
    }

    const aiMetadata = buildAiSuggestedEventMetadata({
      description: input.description,
      eventType: input.eventType,
      requiredRoles: input.requiredRoles.split(",").map((item) => item.trim())
    });

    database.events.push({
      id: generateId("event"),
      organizationId: organization.id,
      createdBy: session.userId,
      title: input.title,
      description: input.description,
      location: input.location,
      eventDate: input.eventDate,
      eventType: input.eventType,
      requiredRoles: input.requiredRoles.split(",").map((item) => item.trim()),
      serviceTier: input.serviceTier,
      serviceTierSource: "manual",
      suggestedServiceTier: aiMetadata.suggestedServiceTier,
      aiSuggestedTags: aiMetadata.aiSuggestedTags,
      aiSuggestedRoles: aiMetadata.aiSuggestedRoles,
      status: "published",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    writeDemoDatabase(database);
  },
  createJob(session: AuthSession, input: CreateJobInput) {
    const database = readDemoDatabase();
    const event = database.events.find((item) => item.id === input.eventId);

    if (!event) {
      throw new AppError("Event not found.", "NOT_FOUND", 404);
    }

    database.jobs.push({
      id: generateId("job"),
      eventId: input.eventId,
      organizationId: event.organizationId,
      createdBy: session.userId,
      title: input.title,
      description: input.description,
      roleType: input.roleType,
      shiftStart: input.shiftStart,
      shiftEnd: input.shiftEnd,
      payRate: input.payRate,
      positionsNeeded: input.positionsNeeded,
      minimumAge: input.minimumAge ?? null,
      status: "open",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    writeDemoDatabase(database);
  },
  updateJobStatus(session: AuthSession, jobId: string, status: "open" | "closed" | "cancelled") {
    const database = readDemoDatabase();
    const job = database.jobs.find((item) => item.id === jobId);

    if (!job) {
      throw new AppError("Job not found.", "NOT_FOUND", 404);
    }

    const organization = getOrganisationForProfile(database, session.userId);

    if (!organization || organization.id !== job.organizationId) {
      throw new AppError("You cannot manage this job.", "FORBIDDEN", 403);
    }

    job.status = status;
    job.updatedAt = new Date().toISOString();
    writeDemoDatabase(database);
  },
  applyToJob(session: AuthSession, input: JobApplicationInput) {
    const database = readDemoDatabase();
    const existing = database.applications.find(
      (application) => application.jobId === input.jobId && application.staffId === session.userId
    );

    if (existing) {
      throw new AppError("You have already applied to this role.", "DUPLICATE_APPLICATION");
    }

    database.applications.push({
      id: generateId("app"),
      jobId: input.jobId,
      staffId: session.userId,
      status: "pending",
      coverNote: input.coverNote,
      appliedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    writeDemoDatabase(database);
  },
  withdrawApplication(session: AuthSession, applicationId: string) {
    const database = readDemoDatabase();
    const application = database.applications.find((item) => item.id === applicationId);

    if (!application || application.staffId !== session.userId) {
      throw new AppError("Application not found.", "NOT_FOUND", 404);
    }

    if (!canTransitionApplication(application.status, "withdrawn")) {
      throw new AppError("This application cannot be withdrawn.", "INVALID_STATUS");
    }

    const previousStatus = application.status;
    application.status = "withdrawn";
    application.updatedAt = new Date().toISOString();
    database.applicationHistory.push({
      id: generateId("hist"),
      applicationId,
      fromStatus: previousStatus,
      toStatus: "withdrawn",
      actorId: session.userId,
      createdAt: new Date().toISOString()
    });
    writeDemoDatabase(database);
  },
  saveJob(session: AuthSession, jobId: string) {
    const database = readDemoDatabase();

    if (session.role !== "staff") {
      throw new AppError("Only field-team accounts can save jobs.", "FORBIDDEN", 403);
    }

    const job = database.jobs.find((item) => item.id === jobId && item.status === "open");

    if (!job) {
      throw new AppError("Job not found.", "NOT_FOUND", 404);
    }

    if (!database.savedJobs.some((savedJob) => savedJob.staffId === session.userId && savedJob.jobId === jobId)) {
      database.savedJobs.push({
        staffId: session.userId,
        jobId,
        createdAt: new Date().toISOString()
      });
      writeDemoDatabase(database);
    }
  },
  unsaveJob(session: AuthSession, jobId: string) {
    const database = readDemoDatabase();
    const nextSavedJobs = database.savedJobs.filter(
      (savedJob) => !(savedJob.staffId === session.userId && savedJob.jobId === jobId)
    );

    if (nextSavedJobs.length !== database.savedJobs.length) {
      database.savedJobs = nextSavedJobs;
      writeDemoDatabase(database);
    }
  },
  upsertJobAlert(session: AuthSession, input: JobAlertInput) {
    const database = readDemoDatabase();

    if (session.role !== "staff") {
      throw new AppError("Only field-team accounts can manage job alerts.", "FORBIDDEN", 403);
    }

    const now = new Date().toISOString();
    const existingIndex = input.id
      ? database.jobAlerts.findIndex((alert) => alert.id === input.id && alert.staffId === session.userId)
      : -1;
    const nextAlert = {
      id: existingIndex >= 0 ? database.jobAlerts[existingIndex]!.id : generateId("job_alert"),
      staffId: session.userId,
      name: input.name,
      query: input.query || undefined,
      location: input.location || undefined,
      roleTypes: input.roleTypes ?? [],
      minimumPay: input.minimumPay ?? null,
      dateFrom: input.dateFrom || undefined,
      dateTo: input.dateTo || undefined,
      isActive: input.isActive,
      emailOptIn: input.emailOptIn,
      createdAt: existingIndex >= 0 ? database.jobAlerts[existingIndex]!.createdAt : now,
      updatedAt: now
    };

    if (existingIndex >= 0) {
      database.jobAlerts[existingIndex] = nextAlert;
    } else {
      database.jobAlerts.push(nextAlert);
    }

    writeDemoDatabase(database);
    return nextAlert;
  },
  deleteJobAlert(session: AuthSession, alertId: string) {
    const database = readDemoDatabase();
    const nextAlerts = database.jobAlerts.filter(
      (alert) => !(alert.id === alertId && alert.staffId === session.userId)
    );

    if (nextAlerts.length !== database.jobAlerts.length) {
      database.jobAlerts = nextAlerts;
      writeDemoDatabase(database);
    }
  },
  recordJobView(session: AuthSession, jobId: string) {
    if (session.role !== "staff") {
      return;
    }

    const database = readDemoDatabase();
    const job = database.jobs.find((item) => item.id === jobId);

    if (!job || job.status !== "open") {
      return;
    }

    const didRecord = recordJobViewInDatabase(database, session.userId, jobId);

    if (didRecord) {
      writeDemoDatabase(database);
    }
  },
  updateApplicationStatus(session: AuthSession, applicationId: string, status: ApplicationStatus) {
    const database = readDemoDatabase();
    const application = database.applications.find((item) => item.id === applicationId);

    if (!application) {
      throw new AppError("Application not found.", "NOT_FOUND", 404);
    }

    if (!canTransitionApplication(application.status, status)) {
      throw new AppError("Invalid application transition.", "INVALID_STATUS");
    }

    const previousStatus = application.status;
    application.status = status;
    application.updatedAt = new Date().toISOString();
    database.applicationHistory.push({
      id: generateId("hist"),
      applicationId,
      fromStatus: previousStatus,
      toStatus: status,
      actorId: session.userId,
      createdAt: new Date().toISOString()
    });
    writeDemoDatabase(database);
  },
  markEventCompleted(eventId: string) {
    const database = readDemoDatabase();
    const event = database.events.find((item) => item.id === eventId);

    if (!event) {
      throw new AppError("Event not found.", "NOT_FOUND", 404);
    }

    event.status = "completed";
    event.updatedAt = new Date().toISOString();
    writeDemoDatabase(database);
  },
  submitOperatorReview(session: AuthSession, input: OperatorReviewInput): Rating {
    const database = readDemoDatabase();
    const event = database.events.find((item) => item.id === input.eventId);
    const job = database.jobs.find((item) => item.id === input.jobId);
    const application = database.applications.find(
      (item) => item.jobId === input.jobId && item.staffId === input.staffId
    );

    if (!event || !job || !application) {
      throw new AppError("Unable to validate the rating.", "INVALID_RATING_CONTEXT");
    }

    if (!canRateStaff(event, application.status)) {
      throw new AppError("This staff member is not eligible for rating yet.", "NOT_RATEABLE");
    }

    if (database.ratings.some((item) => item.jobId === input.jobId && item.staffId === input.staffId)) {
      throw new AppError("This operator has already been reviewed for the assignment.", "DUPLICATE_REVIEW");
    }

    const overallScore =
      (input.reliabilityScore +
        input.professionalismScore +
        input.communicationScore +
        input.customerServiceScore +
        input.pressureHandlingScore) /
      5;

    const rating = {
      id: generateId("rating"),
      eventId: input.eventId,
      jobId: input.jobId,
      organizationId: job.organizationId,
      staffId: input.staffId,
      organiserId: session.userId,
      reliabilityScore: input.reliabilityScore,
      professionalismScore: input.professionalismScore,
      communicationScore: input.communicationScore,
      customerServiceScore: input.customerServiceScore,
      pressureHandlingScore: input.pressureHandlingScore,
      overallScore,
      rating: overallScore,
      comment: input.comment,
      createdAt: new Date().toISOString()
    };

    database.ratings.push(rating);
    const performance = buildPerformanceSummary(input.staffId, database.ratings);

    if (performance.promotionDue) {
      pushNotification(
        database,
        {
          userId: input.staffId,
          type: "promotion_due",
          title: "Promotion within reach",
          body: "One more strong assignment can move you into the next performance band.",
          href: "/dashboard/staff"
        },
        { subject: "Promotion within reach" }
      );
    } else if (performance.demotionRisk) {
      pushNotification(
        database,
        {
          userId: input.staffId,
          type: "demotion_risk",
          title: "Performance attention needed",
          body: "Recent scores have lowered your rating band buffer. A strong next job will help recover it.",
          href: "/dashboard/staff"
        },
        { subject: "Performance attention needed" }
      );
    }

    writeDemoDatabase(database);
    return rating;
  },
  submitClientFeedback(session: AuthSession, input: ClientFeedbackInput) {
    const database = readDemoDatabase();
    const application = database.applications.find((item) => item.id === input.assignmentId);
    const job = database.jobs.find((item) => item.id === input.jobId);

    if (!application || !job) {
      throw new AppError("Unable to validate client feedback.", "INVALID_FEEDBACK_CONTEXT");
    }

    if (application.staffId !== session.userId) {
      throw new AppError("You can only submit feedback for your own assignments.", "UNAUTHORISED", 403);
    }

    if (database.clientFeedback.some((item) => item.assignmentId === input.assignmentId && item.staffId === session.userId)) {
      throw new AppError("Client feedback already exists for this assignment.", "DUPLICATE_FEEDBACK");
    }

    const feedback: ClientFeedback = {
      id: generateId("feedback"),
      assignmentId: input.assignmentId,
      jobId: input.jobId,
      organizationId: job.organizationId,
      staffId: session.userId,
      clientId: input.clientId,
      sentiment: input.sentiment,
      reasons: input.reasons as ClientFeedback["reasons"],
      note: input.note || undefined,
      createdAt: new Date().toISOString()
    };

    database.clientFeedback.push(feedback);
    writeDemoDatabase(database);
  },
  updateOperatorProfile(session: AuthSession, input: UpdateOperatorProfileInput) {
    const database = readDemoDatabase();
    const profile = findProfile(database, session.userId);
    const operatorProfile = findOperatorProfile(database, session.userId);

    if (!profile || !operatorProfile) {
      throw new AppError("Operator profile not found.", "PROFILE_NOT_FOUND", 404);
    }

    profile.fullName = input.fullName;
    profile.phone = input.phone;
    profile.bio = input.details;
    profile.skills = input.skills;
    profile.location = input.baseLocation;
    profile.languages = input.languages;
    profile.preferredRoles = input.preferredRoles;
    profile.avatarUrl = input.avatarUrl || undefined;
    profile.age = Math.max(
      0,
      new Date().getFullYear() - new Date(input.dateOfBirth).getFullYear()
    );
    profile.updatedAt = new Date().toISOString();

    operatorProfile.displayName = input.fullName;
    operatorProfile.details = input.details;
    operatorProfile.headline = input.headline || undefined;
    operatorProfile.baseLocation = input.baseLocation;
    operatorProfile.preferredRoles = input.preferredRoles;
    operatorProfile.languages = input.languages;
    operatorProfile.dateOfBirth = input.dateOfBirth;
    operatorProfile.age = profile.age;
    operatorProfile.avatarUrl = input.avatarUrl || undefined;
    operatorProfile.updatedAt = new Date().toISOString();

    writeDemoDatabase(database);
  },
  updateOperatorAvailability(session: AuthSession, input: UpdateOperatorAvailabilityInput) {
    const database = readDemoDatabase();
    const profile = findProfile(database, session.userId);
    const operatorProfile = findOperatorProfile(database, session.userId);

    if (!profile || !operatorProfile) {
      throw new AppError("Operator profile not found.", "PROFILE_NOT_FOUND", 404);
    }

    profile.availability = input.availabilitySummary;
    profile.updatedAt = new Date().toISOString();
    operatorProfile.availabilitySummary = input.availabilitySummary;
    operatorProfile.updatedAt = new Date().toISOString();
    database.operatorAvailabilityRules = database.operatorAvailabilityRules.filter(
      (rule) => rule.operatorId !== session.userId
    );
    database.operatorAvailabilityRules.push(
      ...input.rules.map((rule) => ({
        id: rule.id || `${session.userId}_availability_${rule.dayOfWeek}`,
        operatorId: session.userId,
        dayOfWeek: rule.dayOfWeek,
        isAvailable: rule.isAvailable,
        isAllDay: rule.isAllDay,
        startTime: rule.startTime || undefined,
        endTime: rule.endTime || undefined
      }))
    );

    writeDemoDatabase(database);
  },
  updateEmail(session: AuthSession, email: string) {
    const database = readDemoDatabase();
    const profile = findProfile(database, session.userId);

    if (!profile) {
      throw new AppError("Profile not found.", "PROFILE_NOT_FOUND", 404);
    }

    profile.email = email;
    profile.updatedAt = new Date().toISOString();
    const marketingPreference = database.marketingPreferences.find((item) => item.profileId === profile.id);

    if (marketingPreference) {
      marketingPreference.emailNormalized = email.toLowerCase();
      marketingPreference.updatedAt = profile.updatedAt;
    }

    writeDemoDatabase(database);
  },
  updateMarketingPreferences(session: AuthSession, input: UpdateMarketingPreferencesInput) {
    const database = readDemoDatabase();
    const now = new Date().toISOString();
    const existing = database.marketingPreferences.find((item) => item.profileId === session.userId);

    if (existing) {
      existing.newsletterOptIn = input.newsletterConsent;
      existing.offersOptIn = input.offersConsent;
      existing.productUpdatesOptIn = input.productUpdatesConsent;
      existing.newsletterOptedInAt = input.newsletterConsent ? now : existing.newsletterOptedInAt;
      existing.newsletterOptedOutAt = input.newsletterConsent ? undefined : now;
      existing.marketingOptedOutAt =
        input.newsletterConsent || input.offersConsent || input.productUpdatesConsent ? undefined : now;
      existing.source = "profile_settings";
      existing.updatedAt = now;
    } else {
      database.marketingPreferences.push({
        profileId: session.userId,
        emailNormalized: database.profiles.find((profile) => profile.id === session.userId)?.email.toLowerCase(),
        newsletterOptIn: input.newsletterConsent,
        offersOptIn: input.offersConsent,
        productUpdatesOptIn: input.productUpdatesConsent,
        newsletterOptedInAt: input.newsletterConsent ? now : undefined,
        newsletterOptedOutAt: input.newsletterConsent ? undefined : now,
        marketingOptedOutAt:
          input.newsletterConsent || input.offersConsent || input.productUpdatesConsent ? undefined : now,
        unsubscribeToken: generateId("unsubscribe"),
        source: "profile_settings",
        createdAt: now,
        updatedAt: now
      });
    }

    writeDemoDatabase(database);
  }
};
