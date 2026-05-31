import type {
  Application,
  ApplicationStatus,
  BrowseJobsFilters,
  EnrichedJob,
  JobTrendingSignals,
  JobViewEvent,
  StaffJobsBoardItem,
  SuggestedJob
} from "@/types/domain";

const TRENDING_WEIGHTS = {
  views72h: 1,
  views24h: 1.5,
  applications72h: 3,
  applications24h: 4
} as const;

type BoardSource = {
  job: EnrichedJob;
  applicationId?: string;
  applicationStatus?: ApplicationStatus;
  isSaved?: boolean;
  matchScore: number;
  matchReasons: string[];
  trendingSignals: JobTrendingSignals;
};

function calculateMomentumRaw(signals: JobTrendingSignals) {
  return (
    signals.views72h * TRENDING_WEIGHTS.views72h +
    signals.views24h * TRENDING_WEIGHTS.views24h +
    signals.applications72h * TRENDING_WEIGHTS.applications72h +
    signals.applications24h * TRENDING_WEIGHTS.applications24h
  );
}

function getMomentumScore(momentumRaw: number, maxMomentumRaw: number) {
  if (maxMomentumRaw <= 0) {
    return 0;
  }

  return (momentumRaw / maxMomentumRaw) * 100;
}

export function sortBoardItemsByTrending(items: StaffJobsBoardItem[]) {
  return [...items].sort((left, right) => {
    if (right.trendingScore !== left.trendingScore) {
      return right.trendingScore - left.trendingScore;
    }

    return new Date(right.job.createdAt).getTime() - new Date(left.job.createdAt).getTime();
  });
}

export function sortBoardItemsByNew(items: StaffJobsBoardItem[]) {
  return [...items].sort(
    (left, right) => new Date(right.job.createdAt).getTime() - new Date(left.job.createdAt).getTime()
  );
}

export function sortBoardItemsBySoonest(items: StaffJobsBoardItem[]) {
  return [...items].sort(
    (left, right) => new Date(left.job.shiftStart).getTime() - new Date(right.job.shiftStart).getTime()
  );
}

export function sortBoardItemsByPay(items: StaffJobsBoardItem[]) {
  return [...items].sort((left, right) => {
    if (right.job.payRate !== left.job.payRate) {
      return right.job.payRate - left.job.payRate;
    }

    return new Date(left.job.shiftStart).getTime() - new Date(right.job.shiftStart).getTime();
  });
}

export function sortBoardItemsByMatch(items: StaffJobsBoardItem[]) {
  return [...items].sort((left, right) => {
    if (right.matchScore !== left.matchScore) {
      return right.matchScore - left.matchScore;
    }

    return right.trendingScore - left.trendingScore;
  });
}

export function sortBoardItems(items: StaffJobsBoardItem[], sort: BrowseJobsFilters["sort"]) {
  switch (sort) {
    case "newest":
      return sortBoardItemsByNew(items);
    case "soonest":
      return sortBoardItemsBySoonest(items);
    case "pay":
      return sortBoardItemsByPay(items);
    case "match":
      return sortBoardItemsByMatch(items);
    case "trending":
    default:
      return sortBoardItemsByTrending(items);
  }
}

export function filterJobs(jobs: EnrichedJob[], filters?: BrowseJobsFilters) {
  const normalizedQuery = filters?.query?.trim().toLowerCase();
  const normalizedLocation = filters?.location?.trim().toLowerCase();
  const normalizedRoleType = filters?.roleType?.trim().toLowerCase();
  const roleTypes = new Set((filters?.roleTypes ?? []).map((item) => item.toLowerCase()));
  const minimumPay = filters?.minimumPay;
  const dateFrom = filters?.dateFrom ?? filters?.date;
  const dateTo = filters?.dateTo ?? filters?.date;

  return jobs.filter((job) => {
    const eventDate = job.event.eventDate.slice(0, 10);
    const roleType = job.roleType.toLowerCase();

    return (
      (!normalizedQuery ||
        job.title.toLowerCase().includes(normalizedQuery) ||
        job.description.toLowerCase().includes(normalizedQuery) ||
        job.event.title.toLowerCase().includes(normalizedQuery) ||
        job.organization.name.toLowerCase().includes(normalizedQuery)) &&
      (!normalizedLocation || job.event.location.toLowerCase().includes(normalizedLocation)) &&
      (!normalizedRoleType || roleType.includes(normalizedRoleType)) &&
      (roleTypes.size === 0 || roleTypes.has(roleType)) &&
      (!minimumPay || job.payRate >= minimumPay) &&
      (!dateFrom || eventDate >= dateFrom) &&
      (!dateTo || eventDate <= dateTo)
    );
  });
}

export function buildStaffJobsBoardItems(sources: BoardSource[]) {
  const maxMomentumRaw = sources.reduce(
    (max, source) => Math.max(max, calculateMomentumRaw(source.trendingSignals)),
    0
  );

  return sortBoardItemsByTrending(
    sources.map((source) => {
      const momentumRaw = calculateMomentumRaw(source.trendingSignals);
      const momentumScore = getMomentumScore(momentumRaw, maxMomentumRaw);

      return {
        job: source.job,
        applicationId: source.applicationId,
        hasApplied: Boolean(source.applicationStatus),
        applicationStatus: source.applicationStatus,
        isSaved: Boolean(source.isSaved),
        matchScore: source.matchScore,
        matchReasons: source.matchReasons,
        trendingScore: momentumScore * 0.65 + source.matchScore * 0.35,
        trendingSignals: source.trendingSignals
      } satisfies StaffJobsBoardItem;
    })
  );
}

export function buildTrendingSignals(input: {
  jobId: string;
  applications: Pick<Application, "jobId" | "appliedAt">[];
  viewEvents: Pick<JobViewEvent, "jobId" | "viewerId" | "viewedAt">[];
  now?: Date;
}) {
  const now = input.now ?? new Date();
  const window24h = now.getTime() - 24 * 60 * 60 * 1000;
  const window72h = now.getTime() - 72 * 60 * 60 * 1000;

  const jobApplications = input.applications
    .filter((application) => application.jobId === input.jobId)
    .map((application) => new Date(application.appliedAt).getTime());
  const jobViews = input.viewEvents.filter((view) => view.jobId === input.jobId);

  const countApplicationsSince = (threshold: number) =>
    jobApplications.filter((timestamp) => timestamp >= threshold).length;
  const countDistinctViewersSince = (threshold: number) =>
    new Set(
      jobViews
        .filter((view) => new Date(view.viewedAt).getTime() >= threshold)
        .map((view) => view.viewerId)
    ).size;

  return {
    views24h: countDistinctViewersSince(window24h),
    views72h: countDistinctViewersSince(window72h),
    applications24h: countApplicationsSince(window24h),
    applications72h: countApplicationsSince(window72h)
  } satisfies JobTrendingSignals;
}

export function buildSuggestedJobMap(suggestedJobs: SuggestedJob[]) {
  return new Map(
    suggestedJobs.map((item) => [
      item.job.id,
      { score: item.score, reasons: item.reasons }
    ])
  );
}
