import { describe, expect, it } from "vitest";
import {
  createEventSchema,
  organiserSignupSchema,
  staffRatingSchema
} from "@/lib/validation/schemas";

describe("validation schemas", () => {
  it("accepts valid organiser signup data", () => {
    const parsed = organiserSignupSchema.parse({
      role: "organiser",
      fullName: "Leah Thompson",
      email: "leah@example.com",
      password: "password123",
      companyName: "Ember Collective"
    });

    expect(parsed.companyName).toBe("Ember Collective");
  });

  it("rejects invalid rating values", () => {
    expect(() =>
      staffRatingSchema.parse({
        eventId: "event_1",
        staffId: "staff_1",
        jobId: "job_1",
        rating: 6,
        comment: "Great"
      })
    ).toThrow();
  });

  it("requires enough detail for event creation", () => {
    expect(() =>
      createEventSchema.parse({
        title: "A",
        description: "short",
        location: "",
        eventDate: "",
        eventType: "",
        requiredRoles: ""
      })
    ).toThrow();
  });
});
