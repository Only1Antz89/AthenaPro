import { DEMO_DB_KEY } from "@/lib/auth/demo-session";
import { canRateStaff, canTransitionApplication } from "@/lib/domain/permissions";
import { buildRankedStaff, buildRatingSummaries } from "@/lib/domain/ranking";
import { AppError } from "@/lib/errors";
import { buildBaseDemoDatabase } from "@/lib/data/demo-seed";
import { generateId, slugify } from "@/lib/utils";
import type {
  Application,
  ApplicationStatus,
  AuthSession,
  DemoDatabase,
  EnrichedApplication,
  EnrichedJob,
  Event,
  LandingHighlights,
  OrganiserDashboardData,
  Profile,
  RankedStaffRow,
  Rating,
  RatingQueueItem,
  StaffDashboardData
} from "@/types/domain";
import type {
  CreateEventInput,
  CreateJobInput,
  JobApplicationInput,
  OrganiserSignupInput,
  StaffRatingInput,
  StaffSignupInput
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
    return JSON.parse(raw) as DemoDatabase;
  } catch {
    const seed = buildBaseDemoDatabase();
    window.localStorage.setItem(DEMO_DB_KEY, JSON.stringify(seed));
    return seed;
  }
}

function writeDemoDatabase(database: DemoDatabase) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(DEMO_DB_KEY, JSON.stringify(database));
}

function findProfile(database: DemoDatabase, profileId: string) {
  return database.profiles.find((profile) => profile.id === profileId) ?? null;
}

function getOrganisationForProfile(database: DemoDatabase, profileId: string) {
  const membership = database.organizationMemberships.find(
    (entry) => entry.profileId === profileId
  );

  if (!membership) {
    return null;
  }

  return database.organizations.find((organization) => organization.id === membership.organizationId) ?? null;
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

function buildLandingHighlights(database: DemoDatabase): LandingHighlights {
  const activeJobs = database.jobs.filter((job) => job.status === "open").slice(0, 4).map((job) => enrichJob(database, job.id));
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

function buildRatingQueue(database: DemoDatabase, organisationId: string): RatingQueueItem[] {
  const ratedKeys = new Set(database.ratings.map((rating) => `${rating.eventId}:${rating.staffId}`));

  return database.applications
    .filter((application) => application.status === "accepted")
    .map((application) => enrichApplication(database, application))
    .filter(
      (application) =>
        application.organization.id === organisationId &&
        canRateStaff(application.event, application.status) &&
        !ratedKeys.has(`${application.event.id}:${application.staff.id}`)
    )
    .map((application) => ({
      event: application.event,
      staff: application.staff,
      application,
      job: application.job
    }));
}

function buildOrganiserDashboardFromDb(
  database: DemoDatabase,
  session: AuthSession
): OrganiserDashboardData {
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
    .filter((application) =>
      organizationJobs.some((job) => job.id === application.jobId)
    )
    .sort((left, right) => new Date(right.appliedAt).getTime() - new Date(left.appliedAt).getTime())
    .slice(0, 5)
    .map((application) => enrichApplication(database, application));

  return {
    session,
    organization,
    profile,
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
    ratingQueue: buildRatingQueue(database, organization.id)
  };
}

function buildStaffDashboardFromDb(database: DemoDatabase, session: AuthSession): StaffDashboardData {
  const profile = findProfile(database, session.userId);

  if (!profile) {
    throw new AppError("Staff account is incomplete.", "MISSING_ACCOUNT", 404);
  }

  const rankedStaff = buildRankedStaff(
    database.profiles.filter((item) => item.role === "staff"),
    database.ratings
  );
  const ratingSummary =
    buildRatingSummaries(
      database.profiles.filter((item) => item.role === "staff"),
      database.ratings
    ).find((summary) => summary.staffId === session.userId) ?? {
      staffId: session.userId,
      averageRating: 0,
      reviewCount: 0,
      weightedScore: 4.2
    };

  return {
    session,
    profile,
    ratingSummary,
    rank:
      rankedStaff.find((entry) => entry.profile.id === session.userId)?.rank ??
      rankedStaff.length,
    recentApplications: database.applications
      .filter((application) => application.staffId === session.userId)
      .sort((left, right) => new Date(right.appliedAt).getTime() - new Date(left.appliedAt).getTime())
      .slice(0, 5)
      .map((application) => enrichApplication(database, application)),
    recommendedJobs: database.jobs
      .filter((job) => job.status === "open")
      .slice(0, 4)
      .map((job) => enrichJob(database, job.id)),
    reviews: database.ratings
      .filter((rating) => rating.staffId === session.userId)
      .sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime())
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
    status: "closed" as const
  };

  const applicant = database.profiles.find((item) => item.role === "staff")!;
  const acceptedApplicant = database.profiles.find((item) => item.id === "user_staff_5")!;

  const pendingApplication: Application = {
    id: generateId("app"),
    jobId: openJob.id,
    staffId: applicant.id,
    status: "pending" as const,
    coverNote: "Available and experienced with premium guests.",
    appliedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  const acceptedApplication: Application = {
    id: generateId("app"),
    jobId: ratingJob.id,
    staffId: acceptedApplicant.id,
    status: "accepted" as const,
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

  database.ratings.push(
    {
      id: generateId("rating"),
      eventId: existingCompletedJob.eventId,
      organizationId: existingCompletedJob.organizationId,
      staffId: profile.id,
      organiserId: existingCompletedJob.createdBy,
      rating: 5,
      comment: "Excellent professionalism and strong guest confidence.",
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 6).toISOString()
    },
    {
      id: generateId("rating"),
      eventId: existingCompletedJob.eventId,
      organizationId: existingCompletedJob.organizationId,
      staffId: profile.id,
      organiserId: existingCompletedJob.createdBy,
      rating: 4,
      comment: "Very solid shift performance and easy to brief.",
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString()
    }
  );
}

export const demoStore = {
  reset() {
    writeDemoDatabase(buildBaseDemoDatabase());
  },
  getSessionUser(session: AuthSession) {
    const database = readDemoDatabase();
    return findProfile(database, session.userId);
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
      createdAt: new Date().toISOString()
    };

    database.profiles.push(profile);
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
      createdAt: new Date().toISOString()
    };

    database.profiles.push(profile);
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
  createEvent(session: AuthSession, input: CreateEventInput) {
    const database = readDemoDatabase();
    const organization = getOrganisationForProfile(database, session.userId);

    if (!organization) {
      throw new AppError("No organisation found for organiser.", "NO_ORG");
    }

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
      status: "open",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

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
  submitRating(session: AuthSession, input: StaffRatingInput): Rating {
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

    const rating = {
      id: generateId("rating"),
      eventId: input.eventId,
      organizationId: job.organizationId,
      staffId: input.staffId,
      organiserId: session.userId,
      rating: input.rating,
      comment: input.comment,
      createdAt: new Date().toISOString()
    };

    database.ratings.push(rating);
    writeDemoDatabase(database);
    return rating;
  }
};
