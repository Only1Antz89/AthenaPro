import { describe, expect, it } from "vitest";
import { buildRankedStaff, calculateWeightedRating } from "@/lib/domain/ranking";
import type { Profile, Rating } from "@/types/domain";

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
      { id: "r1", eventId: "e1", organizationId: "o1", staffId: "1", organiserId: "u1", rating: 5, comment: "", createdAt: new Date().toISOString() },
      { id: "r2", eventId: "e2", organizationId: "o1", staffId: "1", organiserId: "u1", rating: 5, comment: "", createdAt: new Date().toISOString() },
      { id: "r3", eventId: "e3", organizationId: "o1", staffId: "2", organiserId: "u1", rating: 5, comment: "", createdAt: new Date().toISOString() },
      { id: "r4", eventId: "e4", organizationId: "o1", staffId: "2", organiserId: "u1", rating: 5, comment: "", createdAt: new Date().toISOString() }
    ];

    const ranked = buildRankedStaff(profiles, ratings);

    expect(ranked[0]?.profile.id).toBe("1");
    expect(ranked[0]?.rank).toBe(1);
  });
});
