import { getRankBadge } from "@/lib/brand";
import { average } from "@/lib/utils";
import type {
  OperatorPerformanceSummary,
  PerformanceCategoryScores,
  Profile,
  RankedStaffRow,
  Rating
} from "@/types/domain";

export const BAYESIAN_C = 5;

const EMPTY_CATEGORY_SCORES: PerformanceCategoryScores = {
  reliability: 0,
  professionalism: 0,
  communication: 0,
  customerService: 0,
  pressureHandling: 0
};

function getGlobalMean(ratings: Rating[]) {
  return average(ratings.map((item) => item.overallScore ?? item.rating)) || 4.2;
}

function getThresholdForBand(band: number) {
  if (band >= 5) {
    return 4.75;
  }

  if (band === 4) {
    return 3.75;
  }

  if (band === 3) {
    return 2.75;
  }

  if (band === 2) {
    return 1.75;
  }

  if (band === 1) {
    return 0.75;
  }

  return 0;
}

export function calculateWeightedRating(
  averageRating: number,
  reviewCount: number,
  globalMean: number,
  confidence = BAYESIAN_C
) {
  if (reviewCount <= 0) {
    return globalMean;
  }

  return (averageRating * reviewCount + globalMean * confidence) / (reviewCount + confidence);
}

export function getRatingBand(overallRating: number) {
  if (overallRating >= 4.75) {
    return 5;
  }

  if (overallRating >= 3.75) {
    return 4;
  }

  if (overallRating >= 2.75) {
    return 3;
  }

  if (overallRating >= 1.75) {
    return 2;
  }

  if (overallRating >= 0.75) {
    return 1;
  }

  return 0;
}

export function buildPerformanceSummary(
  staffId: string,
  ratings: Rating[],
  globalMean = getGlobalMean(ratings)
): OperatorPerformanceSummary {
  const ownRatings = ratings
    .filter((item) => item.staffId === staffId)
    .sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime());
  const reviewCount = ownRatings.length;
  const averageRating = average(ownRatings.map((item) => item.overallScore ?? item.rating));
  const weightedScore = calculateWeightedRating(averageRating, reviewCount, globalMean);
  const categoryRatings: PerformanceCategoryScores = reviewCount
    ? {
        reliability: average(ownRatings.map((item) => item.reliabilityScore)),
        professionalism: average(ownRatings.map((item) => item.professionalismScore)),
        communication: average(ownRatings.map((item) => item.communicationScore)),
        customerService: average(ownRatings.map((item) => item.customerServiceScore)),
        pressureHandling: average(ownRatings.map((item) => item.pressureHandlingScore))
      }
    : EMPTY_CATEGORY_SCORES;
  const ratingBand = getRatingBand(weightedScore);
  const nextBandThreshold = getThresholdForBand(Math.min(ratingBand + 1, 5));
  const currentBandFloor = getThresholdForBand(ratingBand);
  const lastTwoAverage = average(
    ownRatings
      .slice(0, 2)
      .map((item) => item.overallScore ?? item.rating)
  );

  return {
    staffId,
    overallRating: weightedScore,
    averageRating,
    reviewCount,
    weightedScore,
    categoryRatings,
    ratingBand,
    promotionDue:
      ratingBand < 5 &&
      nextBandThreshold - weightedScore <= 0.25 &&
      lastTwoAverage >= nextBandThreshold,
    demotionRisk:
      ratingBand > 0 &&
      weightedScore - currentBandFloor <= 0.25 &&
      lastTwoAverage > 0 &&
      lastTwoAverage <= 2.5,
    lastTwoAverage
  };
}

export function buildRatingSummaries(
  staffProfiles: Profile[],
  ratings: Rating[]
): OperatorPerformanceSummary[] {
  const globalMean = getGlobalMean(ratings);

  return staffProfiles.map((profile) => buildPerformanceSummary(profile.id, ratings, globalMean));
}

export function buildRankedStaff(
  staffProfiles: Profile[],
  ratings: Rating[]
): RankedStaffRow[] {
  const summaries = buildRatingSummaries(staffProfiles, ratings);

  return summaries
    .map((summary) => ({
      ...summary,
      profile: staffProfiles.find((profile) => profile.id === summary.staffId)!,
      rank: 0 as number,
      topBadge: undefined as RankedStaffRow["topBadge"]
    }))
    .sort((left, right) => {
      if (right.weightedScore !== left.weightedScore) {
        return right.weightedScore - left.weightedScore;
      }

      if (right.averageRating !== left.averageRating) {
        return right.averageRating - left.averageRating;
      }

      if (right.reviewCount !== left.reviewCount) {
        return right.reviewCount - left.reviewCount;
      }

      return left.profile.fullName.localeCompare(right.profile.fullName);
    })
    .map((item, index) => ({
      ...item,
      rank: index + 1,
      topBadge: getRankBadge(index + 1)
    }));
}
