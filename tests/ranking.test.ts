import { describe, expect, it } from "vitest";
import { buildRankedStaff, calculateWeightedRating } from "@/lib/domain/ranking";
import type { Profile, Rating } from "@/types/domain";

function makeRating(id: string, staffId: string): Rating {
  return {
    id,
    eventId: `event_${id}`,
    jobId: `job_${id}`,
    organizationId: "o1",
    staffId,
    organiserId: "u1",
    reliabilityScore: 5,
    professionalismScore: 5,
    communicationScore: 5,
    customerServiceScore: 5,
    pressureHandlingScore: 5,
    overallScore: 5,
    rating: 5,
    comment: "",
    createdAt: new Date().toISOString()
  };
}

describe("ranking helpers", () => {
  it("prefers stronger review history over a single lucky rating", () => {
    const globalMean = 4.2;
    const lucky = calculateWeightedRating(5, 1, globalMean);
    const proven = calculateWeightedRating(4.7, 8, globalMean);

    expect(proven).toBeGreaterThan(lucky);
  });

  it("sorts staff by weighted score with deterministic tie-breaking", () => {
    const profiles: Profile[] = [
      { id: "1", role: "staff", fullName: "Alex Lane", email: "a@test.dev", skills: [], createdAt: new Date().toISOString() },
      { id: "2", role: "staff", fullName: "Bella Stone", email: "b@test.dev", skills: [], createdAt: new Date().toISOString() }
    ];
    const ratings: Rating[] = [
      makeRating("r1", "1"),
      makeRating("r2", "1"),
      makeRating("r3", "2"),
      makeRating("r4", "2")
    ];

    const ranked = buildRankedStaff(profiles, ratings);

    expect(ranked[0]?.profile.id).toBe("1");
    expect(ranked[0]?.rank).toBe(1);
  });
});
