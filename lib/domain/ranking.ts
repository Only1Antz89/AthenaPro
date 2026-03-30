import type { RankedStaffRow, Rating, Profile, StaffRatingSummary } from "@/types/domain";
import { average } from "@/lib/utils";

export const BAYESIAN_C = 5;

export function calculateWeightedRating(
  averageRating: number,
  reviewCount: number,
  globalMean: number,
  confidence = BAYESIAN_C
) {
  if (reviewCount <= 0) {
    return globalMean;
  }

  return (
    (averageRating * reviewCount + globalMean * confidence) /
    (reviewCount + confidence)
  );
}

export function buildRatingSummaries(
  staffProfiles: Profile[],
  ratings: Rating[]
): StaffRatingSummary[] {
  const globalMean = average(ratings.map((item) => item.rating)) || 4.2;

  return staffProfiles.map((profile) => {
    const ownRatings = ratings.filter((item) => item.staffId === profile.id);
    const averageRating = average(ownRatings.map((item) => item.rating));
    const reviewCount = ownRatings.length;

    return {
      staffId: profile.id,
      averageRating,
      reviewCount,
      weightedScore: calculateWeightedRating(averageRating, reviewCount, globalMean)
    };
  });
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
      topBadge:
        index === 0 ? "Top Rated" : index < 3 ? "Reliable" : index < 6 ? "Rising" : undefined
    }));
}
