import { createServiceRoleClient } from "@/lib/data/supabase-client";
import { buildBaseDemoDatabase } from "@/lib/data/demo-seed";
import { buildRankedStaff } from "@/lib/domain/ranking";
import { env, getRuntimeMode } from "@/lib/env";
import type { EnrichedJob, LandingHighlights, RankedStaffRow } from "@/types/domain";

function buildPublicDemoJobs(): EnrichedJob[] {
  const database = buildBaseDemoDatabase();

  return database.jobs
    .filter((job) => job.status === "open")
    .map((job) => {
      const event = database.events.find((item) => item.id === job.eventId)!;
      const organization = database.organizations.find((item) => item.id === job.organizationId)!;

      return {
        ...job,
        event,
        organization,
        applicationCount: database.applications.filter((item) => item.jobId === job.id).length
      };
    });
}

function buildPublicDemoHighlights(): LandingHighlights {
  const database = buildBaseDemoDatabase();
  return {
    featuredJobs: buildPublicDemoJobs().slice(0, 4),
    topStaff: buildRankedStaff(
      database.profiles.filter((profile) => profile.role === "staff"),
      database.ratings
    ).slice(0, 4),
    stats: {
      activeJobs: database.jobs.filter((job) => job.status === "open").length,
      organisers: database.profiles.filter((profile) => profile.role === "organiser").length,
      staff: database.profiles.filter((profile) => profile.role === "staff").length,
      placements: database.applications.filter((application) => application.status === "accepted").length
    }
  };
}

export async function getPublicHighlights(): Promise<LandingHighlights> {
  if (getRuntimeMode() === "demo" || !env.supabaseServiceRoleKey) {
    return buildPublicDemoHighlights();
  }

  const client = createServiceRoleClient();
  const [jobsResult, staffResult, organiserCountResult, staffCountResult, placementsResult] = await Promise.all([
    client
      .from("jobs")
      .select("*, events(*), organizations(*), applications(id)")
      .eq("status", "open")
      .limit(4),
    client.from("ranked_staff").select("*").limit(4),
    client.from("profiles").select("id", { count: "exact", head: true }).eq("role", "organiser"),
    client.from("profiles").select("id", { count: "exact", head: true }).eq("role", "staff"),
    client
      .from("applications")
      .select("id", { count: "exact", head: true })
      .eq("status", "accepted")
  ]);

  if (
    jobsResult.error ||
    staffResult.error ||
    organiserCountResult.error ||
    staffCountResult.error ||
    placementsResult.error
  ) {
    return buildPublicDemoHighlights();
  }

  return {
    featuredJobs: (jobsResult.data ?? []).map((row) => ({
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
      updatedAt: String(row.updated_at),
      event: {
        id: String((row.events as Record<string, unknown>).id),
        organizationId: String((row.events as Record<string, unknown>).organization_id),
        createdBy: String((row.events as Record<string, unknown>).created_by),
        title: String((row.events as Record<string, unknown>).title),
        description: String((row.events as Record<string, unknown>).description ?? ""),
        location: String((row.events as Record<string, unknown>).location ?? ""),
        eventDate: String((row.events as Record<string, unknown>).event_date),
        eventType: String((row.events as Record<string, unknown>).event_type ?? ""),
        requiredRoles: Array.isArray((row.events as Record<string, unknown>).required_roles)
          ? ((row.events as Record<string, unknown>).required_roles as string[])
          : [],
        status: (row.events as Record<string, unknown>).status as EnrichedJob["event"]["status"],
        createdAt: String((row.events as Record<string, unknown>).created_at),
        updatedAt: String((row.events as Record<string, unknown>).updated_at)
      },
      organization: {
        id: String((row.organizations as Record<string, unknown>).id),
        name: String((row.organizations as Record<string, unknown>).name),
        slug: String((row.organizations as Record<string, unknown>).slug),
        createdAt: String((row.organizations as Record<string, unknown>).created_at)
      },
      applicationCount: Array.isArray(row.applications) ? row.applications.length : 0
    })),
    topStaff: (staffResult.data ?? []).map((row) => ({
      staffId: String(row.staff_id),
      averageRating: Number(row.average_rating ?? 0),
      reviewCount: Number(row.review_count ?? 0),
      weightedScore: Number(row.weighted_score ?? 0),
      rank: Number(row.rank ?? 0),
      topBadge:
        Number(row.rank) === 1
          ? "Top Rated"
          : Number(row.rank) <= 3
            ? "Reliable"
            : Number(row.rank) <= 6
              ? "Rising"
              : undefined,
      profile: {
        id: String(row.staff_id),
        role: "staff",
        fullName: String(row.full_name),
        email: String(row.email ?? ""),
        phone: row.phone ? String(row.phone) : undefined,
        bio: row.bio ? String(row.bio) : undefined,
        skills: Array.isArray(row.skills) ? row.skills.map(String) : [],
        availability: row.availability ? String(row.availability) : undefined,
        avatarUrl: row.avatar_url ? String(row.avatar_url) : undefined,
        createdAt: new Date().toISOString()
      }
    })),
    stats: {
      activeJobs: jobsResult.data?.length ?? 0,
      organisers: organiserCountResult.count ?? 0,
      staff: staffCountResult.count ?? 0,
      placements: placementsResult.count ?? 0
    }
  };
}

export async function getPublicJobs() {
  if (getRuntimeMode() === "demo" || !env.supabaseServiceRoleKey) {
    return buildPublicDemoJobs();
  }

  const client = createServiceRoleClient();
  const jobsResult = await client
    .from("jobs")
    .select("*, events(*), organizations(*), applications(id)")
    .eq("status", "open");

  if (jobsResult.error) {
    return buildPublicDemoJobs();
  }

  return (jobsResult.data ?? []).map((row) => ({
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
    updatedAt: String(row.updated_at),
    event: {
      id: String((row.events as Record<string, unknown>).id),
      organizationId: String((row.events as Record<string, unknown>).organization_id),
      createdBy: String((row.events as Record<string, unknown>).created_by),
      title: String((row.events as Record<string, unknown>).title),
      description: String((row.events as Record<string, unknown>).description ?? ""),
      location: String((row.events as Record<string, unknown>).location ?? ""),
      eventDate: String((row.events as Record<string, unknown>).event_date),
      eventType: String((row.events as Record<string, unknown>).event_type ?? ""),
      requiredRoles: Array.isArray((row.events as Record<string, unknown>).required_roles)
        ? ((row.events as Record<string, unknown>).required_roles as string[])
        : [],
      status: (row.events as Record<string, unknown>).status as EnrichedJob["event"]["status"],
      createdAt: String((row.events as Record<string, unknown>).created_at),
      updatedAt: String((row.events as Record<string, unknown>).updated_at)
    },
    organization: {
      id: String((row.organizations as Record<string, unknown>).id),
      name: String((row.organizations as Record<string, unknown>).name),
      slug: String((row.organizations as Record<string, unknown>).slug),
      createdAt: String((row.organizations as Record<string, unknown>).created_at)
    },
    applicationCount: Array.isArray(row.applications) ? row.applications.length : 0
  }));
}

export async function getPublicRankedStaff(): Promise<RankedStaffRow[]> {
  if (getRuntimeMode() === "demo" || !env.supabaseServiceRoleKey) {
    const database = buildBaseDemoDatabase();
    return buildRankedStaff(
      database.profiles.filter((profile) => profile.role === "staff"),
      database.ratings
    );
  }

  const client = createServiceRoleClient();
  const staffResult = await client.from("ranked_staff").select("*");

  if (staffResult.error) {
    return getPublicHighlights().then((payload) => payload.topStaff);
  }

  return (staffResult.data ?? []).map((row) => ({
    staffId: String(row.staff_id),
    averageRating: Number(row.average_rating ?? 0),
    reviewCount: Number(row.review_count ?? 0),
    weightedScore: Number(row.weighted_score ?? 0),
    rank: Number(row.rank ?? 0),
    topBadge:
      Number(row.rank) === 1
        ? "Top Rated"
        : Number(row.rank) <= 3
          ? "Reliable"
          : Number(row.rank) <= 6
            ? "Rising"
            : undefined,
    profile: {
      id: String(row.staff_id),
      role: "staff",
      fullName: String(row.full_name),
      email: String(row.email ?? ""),
      phone: row.phone ? String(row.phone) : undefined,
      bio: row.bio ? String(row.bio) : undefined,
      skills: Array.isArray(row.skills) ? row.skills.map(String) : [],
      availability: row.availability ? String(row.availability) : undefined,
      avatarUrl: row.avatar_url ? String(row.avatar_url) : undefined,
      createdAt: new Date().toISOString()
    }
  }));
}
