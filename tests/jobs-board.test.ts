import { describe, expect, it } from "vitest";
import { getSwipeDecision } from "@/features/staff/mobile-social-job-feed";
import { buildStaffJobsBoardItems, filterJobs } from "@/lib/domain/jobs-board";
import type { EnrichedJob } from "@/types/domain";

function makeJob(id: string, createdAt: string): EnrichedJob {
  return {
    id,
    eventId: `event_${id}`,
    organizationId: "org_1",
    createdBy: "org_user_1",
    title: `Job ${id}`,
    description: "Assignment description",
    roleType: "Host",
    shiftStart: "2026-04-10T09:00:00.000Z",
    shiftEnd: "2026-04-10T17:00:00.000Z",
    payRate: 16,
    positionsNeeded: 2,
    minimumAge: 18,
    status: "open",
    createdAt,
    updatedAt: createdAt,
    event: {
      id: `event_${id}`,
      organizationId: "org_1",
      createdBy: "org_user_1",
      title: "Test event",
      description: "Event description",
      location: "London",
      eventDate: "2026-04-10T10:00:00.000Z",
      eventType: "Launch",
      requiredRoles: ["Host"],
      serviceTier: "mixed",
      serviceTierSource: "manual",
      suggestedServiceTier: "mixed",
      aiSuggestedTags: [],
      aiSuggestedRoles: [],
      status: "published",
      createdAt,
      updatedAt: createdAt
    },
    organization: {
      id: "org_1",
      name: "Test Org",
      slug: "test-org",
      createdAt
    },
    applicationCount: 0
  };
}

describe("jobs board helpers", () => {
  it("only treats decisive horizontal movement as a swipe", () => {
    expect(getSwipeDecision(130, 20)).toBe("right");
    expect(getSwipeDecision(-140, 22)).toBe("left");
    expect(getSwipeDecision(90, 5)).toBeNull();
    expect(getSwipeDecision(130, 120)).toBeNull();
    expect(getSwipeDecision(24, 150)).toBeNull();
  });

  it("falls back to applications when views are zero", () => {
    const items = buildStaffJobsBoardItems([
      {
        job: makeJob("a", "2026-04-01T10:00:00.000Z"),
        matchScore: 0,
        matchReasons: [],
        trendingSignals: {
          views24h: 0,
          views72h: 0,
          applications24h: 2,
          applications72h: 2
        }
      },
      {
        job: makeJob("b", "2026-04-01T09:00:00.000Z"),
        matchScore: 0,
        matchReasons: [],
        trendingSignals: {
          views24h: 0,
          views72h: 0,
          applications24h: 0,
          applications72h: 0
        }
      }
    ]);

    expect(items[0]?.job.id).toBe("a");
    expect(items[0]?.trendingScore).toBeGreaterThan(0);
  });

  it("prefers stronger short-window activity over older volume", () => {
    const items = buildStaffJobsBoardItems([
      {
        job: makeJob("older", "2026-04-01T10:00:00.000Z"),
        matchScore: 0,
        matchReasons: [],
        trendingSignals: {
          views24h: 0,
          views72h: 10,
          applications24h: 0,
          applications72h: 1
        }
      },
      {
        job: makeJob("recent", "2026-04-01T09:00:00.000Z"),
        matchScore: 0,
        matchReasons: [],
        trendingSignals: {
          views24h: 6,
          views72h: 6,
          applications24h: 1,
          applications72h: 1
        }
      }
    ]);

    expect(items[0]?.job.id).toBe("recent");
  });

  it("breaks trending ties using the newer job timestamp", () => {
    const items = buildStaffJobsBoardItems([
      {
        job: makeJob("older", "2026-04-01T08:00:00.000Z"),
        matchScore: 40,
        matchReasons: [],
        trendingSignals: {
          views24h: 3,
          views72h: 3,
          applications24h: 1,
          applications72h: 1
        }
      },
      {
        job: makeJob("newer", "2026-04-01T12:00:00.000Z"),
        matchScore: 40,
        matchReasons: [],
        trendingSignals: {
          views24h: 3,
          views72h: 3,
          applications24h: 1,
          applications72h: 1
        }
      }
    ]);

    expect(items[0]?.job.id).toBe("newer");
  });

  it("boosts high-fit jobs when momentum is equal", () => {
    const items = buildStaffJobsBoardItems([
      {
        job: makeJob("low-fit", "2026-04-01T10:00:00.000Z"),
        matchScore: 20,
        matchReasons: [],
        trendingSignals: {
          views24h: 4,
          views72h: 4,
          applications24h: 1,
          applications72h: 1
        }
      },
      {
        job: makeJob("high-fit", "2026-04-01T09:00:00.000Z"),
        matchScore: 90,
        matchReasons: [],
        trendingSignals: {
          views24h: 4,
          views72h: 4,
          applications24h: 1,
          applications72h: 1
        }
      }
    ]);

    expect(items[0]?.job.id).toBe("high-fit");
    expect(items[0]?.trendingScore).toBeGreaterThan(items[1]!.trendingScore);
  });

  it("filters jobs by role types and date range", () => {
    const jobs = [
      { ...makeJob("host", "2026-04-01T10:00:00.000Z"), roleType: "Host" },
      {
        ...makeJob("runner", "2026-04-01T10:00:00.000Z"),
        roleType: "Runner",
        event: {
          ...makeJob("runner", "2026-04-01T10:00:00.000Z").event,
          eventDate: "2026-05-10T10:00:00.000Z"
        }
      }
    ];

    const filtered = filterJobs(jobs, {
      roleTypes: ["Runner"],
      dateFrom: "2026-05-01",
      dateTo: "2026-05-31"
    });

    expect(filtered.map((job) => job.id)).toEqual(["runner"]);
  });

  it("carries saved and application metadata into board items", () => {
    const items = buildStaffJobsBoardItems([
      {
        job: makeJob("saved", "2026-04-01T10:00:00.000Z"),
        applicationId: "app_123",
        applicationStatus: "pending",
        isSaved: true,
        matchScore: 50,
        matchReasons: ["Strong role fit"],
        trendingSignals: {
          views24h: 1,
          views72h: 1,
          applications24h: 0,
          applications72h: 0
        }
      }
    ]);

    expect(items[0]?.isSaved).toBe(true);
    expect(items[0]?.hasApplied).toBe(true);
    expect(items[0]?.applicationId).toBe("app_123");
  });
});
