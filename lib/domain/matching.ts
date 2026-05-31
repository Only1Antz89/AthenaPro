import type {
  ClientFeedback,
  EnrichedJob,
  Event,
  MatchScoreBreakdown,
  OperatorAvailabilityRule,
  OperatorProfile,
  OperatorPerformanceSummary,
  Profile,
  RankedStaffRow,
  ServiceTier,
  SuggestedJob,
  SuggestedOperator
} from "@/types/domain";

const SERVICE_TIER_MINIMUMS: Record<ServiceTier, number> = {
  festival: 2,
  mixed: 0,
  formal: 4,
  high_end: 5
};

const SCORE_WEIGHTS = {
  roleFit: 35,
  availability: 25,
  locationFit: 20,
  categoryFit: 10,
  repeatHistory: 5,
  relationship: 5
} as const;

function getRelevantCategoryScore(
  roleType: string,
  performance: OperatorPerformanceSummary
) {
  const role = roleType.toLowerCase();

  if (
    role.includes("host") ||
    role.includes("guest") ||
    role.includes("brand") ||
    role.includes("registration")
  ) {
    return (
      performance.categoryRatings.customerService +
      performance.categoryRatings.communication +
      performance.categoryRatings.professionalism
    ) / 3;
  }

  if (
    role.includes("steward") ||
    role.includes("security") ||
    role.includes("runner") ||
    role.includes("logistics")
  ) {
    return (
      performance.categoryRatings.reliability +
      performance.categoryRatings.pressureHandling
    ) / 2;
  }

  return (
    performance.categoryRatings.professionalism +
    performance.categoryRatings.customerService +
    performance.categoryRatings.reliability
  ) / 3;
}

function buildLocationScore(baseLocation: string | undefined, eventLocation: string) {
  if (!baseLocation) {
    return SCORE_WEIGHTS.locationFit * 0.5;
  }

  const base = baseLocation.toLowerCase();
  const event = eventLocation.toLowerCase();

  if (event.includes(base) || base.includes(event)) {
    return SCORE_WEIGHTS.locationFit;
  }

  const baseRegion = base.split(",").map((item) => item.trim()).filter(Boolean).at(-1);
  const eventRegion = event.split(",").map((item) => item.trim()).filter(Boolean).at(-1);

  if (baseRegion && eventRegion && baseRegion === eventRegion) {
    return SCORE_WEIGHTS.locationFit * 0.65;
  }

  return SCORE_WEIGHTS.locationFit * 0.25;
}

function buildRoleScore(
  roleType: string,
  preferredRoles: string[],
  skills: string[]
) {
  const role = roleType.toLowerCase();
  const preferredMatch = preferredRoles.some((item) => item.toLowerCase().includes(role));
  const skillMatch = skills.some(
    (item) => item.toLowerCase().includes(role) || role.includes(item.toLowerCase())
  );

  if (preferredMatch) {
    return SCORE_WEIGHTS.roleFit;
  }

  if (skillMatch) {
    return SCORE_WEIGHTS.roleFit * 0.7;
  }

  return 0;
}

function buildAvailabilityScore(
  eventDate: string,
  shiftStart: string,
  shiftEnd: string,
  availabilityRules: OperatorAvailabilityRule[]
) {
  const start = new Date(shiftStart);
  const end = new Date(shiftEnd);
  const event = new Date(eventDate);
  const dayRule = availabilityRules.find((rule) => rule.dayOfWeek === event.getDay());

  if (!dayRule || !dayRule.isAvailable) {
    return 0;
  }

  if (dayRule.isAllDay) {
    return SCORE_WEIGHTS.availability;
  }

  const startMinutes = start.getHours() * 60 + start.getMinutes();
  const endMinutes = end.getHours() * 60 + end.getMinutes();
  const ruleStart = dayRule.startTime
    ? Number(dayRule.startTime.slice(0, 2)) * 60 + Number(dayRule.startTime.slice(3, 5))
    : 0;
  const ruleEnd = dayRule.endTime
    ? Number(dayRule.endTime.slice(0, 2)) * 60 + Number(dayRule.endTime.slice(3, 5))
    : 24 * 60;

  return startMinutes >= ruleStart && endMinutes <= ruleEnd ? SCORE_WEIGHTS.availability : 0;
}

function buildRelationshipScore(
  operatorId: string,
  clientId: string,
  feedback: ClientFeedback[]
) {
  const relatedFeedback = feedback.filter(
    (item) => item.staffId === operatorId && item.clientId === clientId
  );

  if (relatedFeedback.some((item) => item.sentiment === "down")) {
    return -1;
  }

  if (relatedFeedback.some((item) => item.sentiment === "up")) {
    return SCORE_WEIGHTS.relationship;
  }

  return 0;
}

function buildRepeatHistoryScore(
  operatorId: string,
  clientId: string,
  feedback: ClientFeedback[]
) {
  return feedback.some((item) => item.staffId === operatorId && item.clientId === clientId)
    ? SCORE_WEIGHTS.repeatHistory
    : 0;
}

function buildScoreBreakdown(
  job: EnrichedJob,
  profile: Profile,
  operatorProfile: OperatorProfile | null,
  performance: OperatorPerformanceSummary,
  availabilityRules: OperatorAvailabilityRule[],
  feedback: ClientFeedback[]
): MatchScoreBreakdown | null {
  if ((profile.age ?? operatorProfile?.age ?? 0) < (job.minimumAge ?? 0)) {
    return null;
  }

  if (performance.ratingBand < SERVICE_TIER_MINIMUMS[job.event.serviceTier]) {
    return null;
  }

  const roleFit = buildRoleScore(
    job.roleType,
    operatorProfile?.preferredRoles ?? profile.preferredRoles ?? [],
    profile.skills
  );

  if (roleFit <= 0) {
    return null;
  }

  const availability = buildAvailabilityScore(
    job.event.eventDate,
    job.shiftStart,
    job.shiftEnd,
    availabilityRules
  );

  if (availability <= 0) {
    return null;
  }

  const relationship = buildRelationshipScore(profile.id, job.organizationId, feedback);

  if (relationship < 0) {
    return null;
  }

  return {
    roleFit,
    availability,
    locationFit: buildLocationScore(
      operatorProfile?.baseLocation ?? profile.location,
      job.event.location
    ),
    categoryFit:
      (getRelevantCategoryScore(job.roleType, performance) / 5) * SCORE_WEIGHTS.categoryFit,
    repeatHistory: buildRepeatHistoryScore(profile.id, job.organizationId, feedback),
    relationship
  };
}

function totalScore(breakdown: MatchScoreBreakdown) {
  return Object.values(breakdown).reduce((sum, value) => sum + value, 0);
}

function buildReasons(
  job: EnrichedJob,
  operatorProfile: OperatorProfile | null,
  performance: OperatorPerformanceSummary
) {
  return [
    `${performance.ratingBand}-star fit for ${job.event.serviceTier.replace("_", " ")} service`,
    `${operatorProfile?.baseLocation ?? "Local"} location profile`,
    `${operatorProfile?.preferredRoles?.slice(0, 2).join(", ") || "Role-aligned"} experience`
  ];
}

export function buildSuggestedJobsForOperator(input: {
  jobs: EnrichedJob[];
  profile: Profile;
  operatorProfile: OperatorProfile | null;
  availabilityRules: OperatorAvailabilityRule[];
  performance: OperatorPerformanceSummary;
  feedback: ClientFeedback[];
}): SuggestedJob[] {
  return input.jobs
    .map((job) => {
      const breakdown = buildScoreBreakdown(
        job,
        input.profile,
        input.operatorProfile,
        input.performance,
        input.availabilityRules,
        input.feedback
      );

      if (!breakdown) {
        return null;
      }

      return {
        job,
        score: totalScore(breakdown),
        breakdown,
        reasons: buildReasons(job, input.operatorProfile, input.performance)
      } satisfies SuggestedJob;
    })
    .filter((item): item is SuggestedJob => Boolean(item))
    .sort((left, right) => right.score - left.score);
}

export function buildSuggestedOperatorsForJob(input: {
  job: EnrichedJob;
  operators: RankedStaffRow[];
  operatorProfiles: Map<string, OperatorProfile>;
  availabilityRulesByOperatorId: Map<string, OperatorAvailabilityRule[]>;
  feedback: ClientFeedback[];
}): SuggestedOperator[] {
  return input.operators
    .map((operator) => {
      const breakdown = buildScoreBreakdown(
        input.job,
        operator.profile,
        input.operatorProfiles.get(operator.staffId) ?? null,
        operator,
        input.availabilityRulesByOperatorId.get(operator.staffId) ?? [],
        input.feedback
      );

      if (!breakdown) {
        return null;
      }

      return {
        operator,
        score: totalScore(breakdown),
        breakdown,
        reasons: buildReasons(
          input.job,
          input.operatorProfiles.get(operator.staffId) ?? null,
          operator
        )
      } satisfies SuggestedOperator;
    })
    .filter((item): item is SuggestedOperator => Boolean(item))
    .sort((left, right) => right.score - left.score);
}

export function getServiceTierMinimumBand(serviceTier: ServiceTier) {
  return SERVICE_TIER_MINIMUMS[serviceTier];
}

export function buildAiSuggestedEventMetadata(event: Pick<Event, "description" | "eventType" | "requiredRoles">) {
  const normalized = `${event.eventType} ${event.description} ${event.requiredRoles.join(" ")}`.toLowerCase();
  const suggestedServiceTier: ServiceTier = normalized.includes("luxury") || normalized.includes("vip")
    ? "high_end"
    : normalized.includes("formal") || normalized.includes("investor")
      ? "formal"
      : normalized.includes("festival") || normalized.includes("concert")
        ? "festival"
        : "mixed";

  return {
    suggestedServiceTier,
    aiSuggestedTags: Array.from(
      new Set(
        normalized
          .split(/[^a-z0-9]+/)
          .filter((item) => item.length > 4)
          .slice(0, 6)
      )
    ),
    aiSuggestedRoles: event.requiredRoles.slice(0, 4)
  };
}
