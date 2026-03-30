// @ts-nocheck
import { buildRankedStaff, buildRatingSummaries } from "@/lib/domain/ranking";
import { AppError } from "@/lib/errors";
import { getBrowserSupabaseClient } from "@/lib/data/supabase-client";
import type { StaffBookDataProvider } from "@/lib/data/contracts";
import type {
  Application,
  ApplicationStatus,
  AuthSession,
  BrowseJobsFilters,
  EnrichedApplication,
  EnrichedJob,
  Event,
  LandingHighlights,
  OrganiserDashboardData,
  Organization,
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

async function getSessionOrThrow() {
  const client: any = getBrowserSupabaseClient();
  const {
    data: { session }
  } = await client.auth.getSession();

  if (!session?.user) {
    throw new AppError("You must be signed in.", "UNAUTHENTICATED", 401);
  }

  return session;
}

function mapProfile(row: Record<string, unknown>): Profile {
  return {
    id: String(row.id),
    role: row.role as Profile["role"],
    fullName: String(row.full_name),
    email: String(row.email),
    phone: row.phone ? String(row.phone) : undefined,
    companyName: row.company_name ? String(row.company_name) : undefined,
    bio: row.bio ? String(row.bio) : undefined,
    skills: Array.isArray(row.skills) ? row.skills.map(String) : [],
    availability: row.availability ? String(row.availability) : undefined,
    avatarUrl: row.avatar_url ? String(row.avatar_url) : undefined,
    createdAt: String(row.created_at)
  };
}

function mapOrganization(row: Record<string, unknown>): Organization {
  return {
    id: String(row.id),
    name: String(row.name),
    slug: String(row.slug),
    createdAt: String(row.created_at)
  };
}

function mapEvent(row: Record<string, unknown>): Event {
  return {
    id: String(row.id),
    organizationId: String(row.organization_id),
    createdBy: String(row.created_by),
    title: String(row.title),
    description: String(row.description ?? ""),
    location: String(row.location ?? ""),
    eventDate: String(row.event_date),
    eventType: String(row.event_type ?? ""),
    requiredRoles: Array.isArray(row.required_roles) ? row.required_roles.map(String) : [],
    status: row.status as Event["status"],
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at)
  };
}

function mapJob(row: Record<string, unknown>) {
  return {
    id: String(row.id),
    eventId: String(row.event_id),
    organizationId: String(row.organization_id),
    createdBy: String(row.created_by),
    title: String(row.title),
    description: String(row.description ?? ""),
    roleType: String(row.role_type ?? ""),
    shiftStart: String(row.shift_start),
    shiftEnd: String(row.shift_end),
    payRate: Number(row.pay_rate ?? 0),
    positionsNeeded: Number(row.positions_needed ?? 1),
    status: row.status as EnrichedJob["status"],
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at)
  };
}

function mapApplication(row: Record<string, unknown>): Application {
  return {
    id: String(row.id),
    jobId: String(row.job_id),
    staffId: String(row.staff_id),
    status: row.status as Application["status"],
    coverNote: String(row.cover_note ?? ""),
    appliedAt: String(row.applied_at),
    updatedAt: String(row.updated_at)
  };
}

function mapRating(row: Record<string, unknown>): Rating {
  return {
    id: String(row.id),
    eventId: String(row.event_id),
    organizationId: String(row.organization_id),
    staffId: String(row.staff_id),
    organiserId: String(row.organiser_id),
    rating: Number(row.rating),
    comment: String(row.comment ?? ""),
    createdAt: String(row.created_at)
  };
}

async function getAllBaseData() {
  const client = getBrowserSupabaseClient();
  const [
    profilesResult,
    organizationsResult,
    eventsResult,
    jobsResult,
    applicationsResult,
    ratingsResult
  ] = await Promise.all([
    client.from("profiles").select("*"),
    client.from("organizations").select("*"),
    client.from("events").select("*"),
    client.from("jobs").select("*"),
    client.from("applications").select("*"),
    client.from("ratings").select("*")
  ]);

  const errors = [
    profilesResult.error,
    organizationsResult.error,
    eventsResult.error,
    jobsResult.error,
    applicationsResult.error,
    ratingsResult.error
  ].filter(Boolean);

  if (errors.length > 0) {
    throw new AppError(errors[0]!.message, "SUPABASE_QUERY");
  }

  return {
    profiles: (profilesResult.data ?? []).map((row) => mapProfile(row)),
    organizations: (organizationsResult.data ?? []).map((row) => mapOrganization(row)),
    events: (eventsResult.data ?? []).map((row) => mapEvent(row)),
    jobs: (jobsResult.data ?? []).map((row) => mapJob(row)),
    applications: (applicationsResult.data ?? []).map((row) => mapApplication(row)),
    ratings: (ratingsResult.data ?? []).map((row) => mapRating(row))
  };
}

function enrichJob(
  jobId: string,
  dataset: Awaited<ReturnType<typeof getAllBaseData>>
): EnrichedJob {
  const job = dataset.jobs.find((entry) => entry.id === jobId);
  const event = job ? dataset.events.find((entry) => entry.id === job.eventId) : null;
  const organization = job
    ? dataset.organizations.find((entry) => entry.id === job.organizationId)
    : null;

  if (!job || !event || !organization) {
    throw new AppError("Job relationships are incomplete.", "RELATIONSHIP_ERROR", 500);
  }

  return {
    ...job,
    event,
    organization,
    applicationCount: dataset.applications.filter((entry) => entry.jobId === job.id).length
  };
}

function enrichApplication(
  application: Application,
  dataset: Awaited<ReturnType<typeof getAllBaseData>>
): EnrichedApplication {
  const job = dataset.jobs.find((entry) => entry.id === application.jobId);
  const event = job ? dataset.events.find((entry) => entry.id === job.eventId) : null;
  const organization = job
    ? dataset.organizations.find((entry) => entry.id === job.organizationId)
    : null;
  const staff = dataset.profiles.find((entry) => entry.id === application.staffId);

  if (!job || !event || !organization || !staff) {
    throw new AppError("Application relationships are incomplete.", "RELATIONSHIP_ERROR", 500);
  }

  return { ...application, job, event, organization, staff };
}

export class SupabaseDataProvider implements StaffBookDataProvider {
  getMode() {
    return "live" as const;
  }

  async getSession(): Promise<AuthSession | null> {
    const client: any = getBrowserSupabaseClient();
    const {
      data: { session }
    } = await client.auth.getSession();

    if (!session?.user) {
      return null;
    }

    const { data, error } = await client
      .from("profiles")
      .select("id, role, email")
      .eq("id", session.user.id)
      .single();

    if (error || !data) {
      return null;
    }

    return {
      mode: "live" as const,
      userId: String(data.id),
      role: data.role as Profile["role"],
      email: String(data.email)
    };
  }

  async signUpOrganiser(input: OrganiserSignupInput) {
    const client: any = getBrowserSupabaseClient();
    const { data, error } = await client.auth.signUp({
      email: input.email,
      password: input.password
    });

    if (error || !data.user) {
      throw new AppError(error?.message ?? "Unable to sign up organiser.", "SIGNUP_FAILED");
    }

    const organizationId = crypto.randomUUID();
    const now = new Date().toISOString();

    const [orgResult, profileResult, membershipResult] = await Promise.all([
      client.from("organizations").insert({
        id: organizationId,
        name: input.companyName,
        slug: input.companyName.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
        created_at: now
      }),
      client.from("profiles").insert({
        id: data.user.id,
        role: "organiser",
        full_name: input.fullName,
        email: input.email,
        company_name: input.companyName,
        skills: [],
        created_at: now
      }),
      client.from("organization_memberships").insert({
        id: crypto.randomUUID(),
        organization_id: organizationId,
        profile_id: data.user.id,
        role: "owner",
        created_at: now
      })
    ]);

    if (orgResult.error || profileResult.error || membershipResult.error) {
      throw new AppError(
        orgResult.error?.message ??
          profileResult.error?.message ??
          membershipResult.error?.message ??
          "Unable to create organiser workspace.",
        "PROFILE_CREATE_FAILED"
      );
    }

    return {
      mode: "live" as const,
      userId: data.user.id,
      role: "organiser",
      email: input.email
    };
  }

  async signUpStaff(input: StaffSignupInput) {
    const client: any = getBrowserSupabaseClient();
    const { data, error } = await client.auth.signUp({
      email: input.email,
      password: input.password
    });

    if (error || !data.user) {
      throw new AppError(error?.message ?? "Unable to sign up staff.", "SIGNUP_FAILED");
    }

    const { error: profileError } = await client.from("profiles").insert({
      id: data.user.id,
      role: "staff",
      full_name: input.fullName,
      email: input.email,
      phone: input.phone,
      bio: input.bio,
      skills: input.skills.split(",").map((item) => item.trim()),
      availability: input.availability,
      created_at: new Date().toISOString()
    });

    if (profileError) {
      throw new AppError(profileError.message, "PROFILE_CREATE_FAILED");
    }

    return {
      mode: "live" as const,
      userId: data.user.id,
      role: "staff",
      email: input.email
    };
  }

  async signIn(input: LoginInput) {
    const client: any = getBrowserSupabaseClient();
    const { data, error } = await client.auth.signInWithPassword({
      email: input.email,
      password: input.password
    });

    if (error || !data.user) {
      throw new AppError(error?.message ?? "Unable to sign in.", "LOGIN_FAILED", 401);
    }

    const { data: profile, error: profileError } = await client
      .from("profiles")
      .select("id, role, email")
      .eq("id", data.user.id)
      .single();

    if (profileError || !profile) {
      throw new AppError("Profile not found.", "PROFILE_NOT_FOUND", 404);
    }

    return {
      mode: "live" as const,
      userId: String(profile.id),
      role: profile.role as Profile["role"],
      email: String(profile.email)
    };
  }

  async signOut() {
    const client: any = getBrowserSupabaseClient();
    await client.auth.signOut();
  }

  async getCurrentProfile() {
    const session = await this.getSession();

    if (!session) {
      return null;
    }

    const client: any = getBrowserSupabaseClient();
    const { data, error } = await client.from("profiles").select("*").eq("id", session.userId).single();

    if (error || !data) {
      return null;
    }

    return mapProfile(data);
  }

  async getLandingHighlights(): Promise<LandingHighlights> {
    const dataset = await getAllBaseData();
    const topStaff = buildRankedStaff(
      dataset.profiles.filter((profile) => profile.role === "staff"),
      dataset.ratings
    ).slice(0, 4);

    return {
      featuredJobs: dataset.jobs
        .filter((job) => job.status === "open")
        .slice(0, 4)
        .map((job) => enrichJob(job.id, dataset)),
      topStaff,
      stats: {
        activeJobs: dataset.jobs.filter((job) => job.status === "open").length,
        organisers: dataset.profiles.filter((profile) => profile.role === "organiser").length,
        staff: dataset.profiles.filter((profile) => profile.role === "staff").length,
        placements: dataset.applications.filter((application) => application.status === "accepted").length
      }
    };
  }

  async getJobs(filters?: BrowseJobsFilters) {
    const dataset = await getAllBaseData();

    return dataset.jobs
      .filter((job) => job.status === "open")
      .filter((job) => {
        const event = dataset.events.find((entry) => entry.id === job.eventId);

        if (!event) {
          return false;
        }

        const query = filters?.query?.toLowerCase();
        const location = filters?.location?.toLowerCase();
        const roleType = filters?.roleType?.toLowerCase();

        return (
          (!query ||
            job.title.toLowerCase().includes(query) ||
            job.description.toLowerCase().includes(query) ||
            event.title.toLowerCase().includes(query)) &&
          (!location || event.location.toLowerCase().includes(location)) &&
          (!roleType || job.roleType.toLowerCase().includes(roleType)) &&
          (!filters?.minimumPay || job.payRate >= filters.minimumPay) &&
          (!filters?.date || event.eventDate.slice(0, 10) === filters.date)
        );
      })
      .map((job) => enrichJob(job.id, dataset));
  }

  async getJobById(id: string) {
    const dataset = await getAllBaseData();

    try {
      return enrichJob(id, dataset);
    } catch {
      return null;
    }
  }

  async getRankedStaff(filters?: StaffDirectoryFilters): Promise<RankedStaffRow[]> {
    const dataset = await getAllBaseData();
    const ranked = buildRankedStaff(
      dataset.profiles.filter((profile) => profile.role === "staff"),
      dataset.ratings
    );

    return ranked
      .filter((item) => {
        const query = filters?.query?.toLowerCase();
        const skill = filters?.skill?.toLowerCase();
        const availability = filters?.availability?.toLowerCase();

        return (
          (!query ||
            item.profile.fullName.toLowerCase().includes(query) ||
            item.profile.bio?.toLowerCase().includes(query)) &&
          (!skill || item.profile.skills.some((entry) => entry.toLowerCase().includes(skill))) &&
          (!availability ||
            item.profile.availability?.toLowerCase().includes(availability))
        );
      })
      .sort((left, right) => {
        if (filters?.sort === "rating") {
          return right.averageRating - left.averageRating;
        }

        if (filters?.sort === "reviews") {
          return right.reviewCount - left.reviewCount;
        }

        return left.rank - right.rank;
      });
  }

  async getOrganiserDashboard(): Promise<OrganiserDashboardData> {
    const session = await this.getSession();

    if (!session || session.role !== "organiser") {
      throw new AppError("You must be signed in as an organiser.", "UNAUTHENTICATED", 401);
    }

    const dataset = await getAllBaseData();
    const client: any = getBrowserSupabaseClient();
    const organizationMembership = await client
      .from("organization_memberships")
      .select("*")
      .eq("profile_id", session.userId)
      .single();

    if (organizationMembership.error || !organizationMembership.data) {
      throw new AppError("Organisation membership not found.", "ORG_NOT_FOUND", 404);
    }

    const organization = dataset.organizations.find(
      (item) => item.id === String(organizationMembership.data.organization_id)
    );
    const profile = dataset.profiles.find((item) => item.id === session.userId);

    if (!organization || !profile) {
      throw new AppError("Organiser account is incomplete.", "PROFILE_NOT_FOUND", 404);
    }

    const events = dataset.events.filter((event) => event.organizationId === organization.id);
    const jobs = dataset.jobs
      .filter((job) => job.organizationId === organization.id)
      .map((job) => enrichJob(job.id, dataset));
    const recentApplicants = dataset.applications
      .filter((application) => jobs.some((job) => job.id === application.jobId))
      .slice(0, 5)
      .map((application) => enrichApplication(application, dataset));

    return {
      session,
      organization,
      profile,
      stats: {
        upcomingEvents: events.filter((event) => event.status === "published").length,
        activeJobs: jobs.filter((job) => job.status === "open").length,
        pendingApplicants: recentApplicants.filter((item) => item.status === "pending").length,
        completedEvents: events.filter((event) => event.status === "completed").length
      },
      events,
      jobs,
      recentApplicants,
      ratingQueue: dataset.applications
        .filter((application) => application.status === "accepted")
        .map((application) => enrichApplication(application, dataset))
        .filter(
          (application) =>
            application.organization.id === organization.id &&
            application.event.status === "completed" &&
            !dataset.ratings.some(
              (rating) =>
                rating.eventId === application.event.id && rating.staffId === application.staff.id
            )
        )
        .map((application) => ({
          event: application.event,
          staff: application.staff,
          application,
          job: application.job
        }))
    };
  }

  async getStaffDashboard(): Promise<StaffDashboardData> {
    const session = await this.getSession();

    if (!session || session.role !== "staff") {
      throw new AppError("You must be signed in as staff.", "UNAUTHENTICATED", 401);
    }

    const dataset = await getAllBaseData();
    const profile = dataset.profiles.find((item) => item.id === session.userId);

    if (!profile) {
      throw new AppError("Staff profile not found.", "PROFILE_NOT_FOUND", 404);
    }

    const summaries = buildRatingSummaries(
      dataset.profiles.filter((entry) => entry.role === "staff"),
      dataset.ratings
    );
    const ranked = buildRankedStaff(
      dataset.profiles.filter((entry) => entry.role === "staff"),
      dataset.ratings
    );

    return {
      session,
      profile,
      ratingSummary:
        summaries.find((summary) => summary.staffId === session.userId) ?? {
          staffId: session.userId,
          averageRating: 0,
          reviewCount: 0,
          weightedScore: 4.2
        },
      rank: ranked.find((item) => item.profile.id === session.userId)?.rank ?? ranked.length,
      recentApplications: dataset.applications
        .filter((application) => application.staffId === session.userId)
        .slice(0, 5)
        .map((application) => enrichApplication(application, dataset)),
      recommendedJobs: dataset.jobs
        .filter((job) => job.status === "open")
        .slice(0, 4)
        .map((job) => enrichJob(job.id, dataset)),
      reviews: dataset.ratings.filter((rating) => rating.staffId === session.userId)
    };
  }

  async createEvent(input: CreateEventInput) {
    const session = await getSessionOrThrow();
    const client: any = getBrowserSupabaseClient();
    const membership = await client
      .from("organization_memberships")
      .select("organization_id")
      .eq("profile_id", session.user.id)
      .single();

    if (membership.error || !membership.data) {
      throw new AppError("Organisation membership not found.", "ORG_NOT_FOUND");
    }

    const { error } = await client.from("events").insert({
      organization_id: membership.data.organization_id,
      created_by: session.user.id,
      title: input.title,
      description: input.description,
      location: input.location,
      event_date: input.eventDate,
      event_type: input.eventType,
      required_roles: input.requiredRoles.split(",").map((item) => item.trim()),
      status: "published"
    });

    if (error) {
      throw new AppError(error.message, "CREATE_EVENT_FAILED");
    }
  }

  async createJob(input: CreateJobInput) {
    const session = await getSessionOrThrow();
    const client: any = getBrowserSupabaseClient();
    const { data: event, error: eventError } = await client
      .from("events")
      .select("organization_id")
      .eq("id", input.eventId)
      .single();

    if (eventError || !event) {
      throw new AppError("Event not found.", "EVENT_NOT_FOUND", 404);
    }

    const { error } = await client.from("jobs").insert({
      event_id: input.eventId,
      organization_id: event.organization_id,
      created_by: session.user.id,
      title: input.title,
      description: input.description,
      role_type: input.roleType,
      shift_start: input.shiftStart,
      shift_end: input.shiftEnd,
      pay_rate: input.payRate,
      positions_needed: input.positionsNeeded,
      status: "open"
    });

    if (error) {
      throw new AppError(error.message, "CREATE_JOB_FAILED");
    }
  }

  async applyToJob(input: JobApplicationInput) {
    const session = await getSessionOrThrow();
    const client: any = getBrowserSupabaseClient();
    const { error } = await client.from("applications").insert({
      job_id: input.jobId,
      staff_id: session.user.id,
      status: "pending",
      cover_note: input.coverNote
    });

    if (error) {
      throw new AppError(error.message, "APPLY_FAILED");
    }
  }

  async updateApplicationStatus(applicationId: string, status: ApplicationStatus) {
    const client: any = getBrowserSupabaseClient();
    const { error } = await client
      .from("applications")
      .update({ status })
      .eq("id", applicationId);

    if (error) {
      throw new AppError(error.message, "UPDATE_APPLICATION_FAILED");
    }
  }

  async markEventCompleted(eventId: string) {
    const client: any = getBrowserSupabaseClient();
    const { error } = await client
      .from("events")
      .update({ status: "completed" })
      .eq("id", eventId);

    if (error) {
      throw new AppError(error.message, "UPDATE_EVENT_FAILED");
    }
  }

  async submitRating(input: StaffRatingInput): Promise<Rating> {
    const session = await getSessionOrThrow();
    const client: any = getBrowserSupabaseClient();
    const organizationLookup = await client
      .from("jobs")
      .select("organization_id")
      .eq("id", input.jobId)
      .single();
    const { data, error } = await client
      .from("ratings")
      .insert({
        event_id: input.eventId,
        organization_id: organizationLookup.data?.organization_id,
        staff_id: input.staffId,
        organiser_id: session.user.id,
        rating: input.rating,
        comment: input.comment
      })
      .select("*")
      .single();

    if (error || !data) {
      throw new AppError(error?.message ?? "Unable to submit rating.", "RATING_FAILED");
    }

    return mapRating(data);
  }
}
