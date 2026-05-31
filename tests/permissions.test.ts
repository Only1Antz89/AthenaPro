import { describe, expect, it } from "vitest";
import { canRateStaff, canTransitionApplication } from "@/lib/domain/permissions";
import type { Event } from "@/types/domain";

const baseEvent: Event = {
  id: "event_1",
  organizationId: "org_1",
  createdBy: "user_1",
  title: "Event",
  description: "",
  location: "",
  eventDate: new Date().toISOString(),
  eventType: "Corporate",
  requiredRoles: [],
  serviceTier: "mixed",
  serviceTierSource: "manual",
  status: "published",
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
};

describe("domain permissions", () => {
  it("only allows ratings for accepted staff on completed events", () => {
    expect(canRateStaff({ ...baseEvent, status: "completed" }, "accepted")).toBe(true);
    expect(canRateStaff(baseEvent, "accepted")).toBe(false);
    expect(canRateStaff({ ...baseEvent, status: "completed" }, "pending")).toBe(false);
  });

  it("guards application transitions", () => {
    expect(canTransitionApplication("pending", "accepted")).toBe(true);
    expect(canTransitionApplication("accepted", "rejected")).toBe(false);
  });
});
