import { describe, expect, it, vi } from "vitest";
import { SupabaseDataProvider } from "@/lib/data/supabase-provider";

const supabaseProviderState = vi.hoisted(() => ({
  client: null as unknown
}));

vi.mock("@/lib/data/supabase-client", () => ({
  getBrowserSupabaseClient: vi.fn(() => supabaseProviderState.client)
}));

function makeQuery(result: unknown) {
  return {
    eq: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    then(resolve: (value: unknown) => unknown, reject: (reason: unknown) => unknown) {
      return Promise.resolve(result).then(resolve, reject);
    }
  };
}

describe("supabase data provider", () => {
  it("reports hidden job organization joins as a platform data error", async () => {
    supabaseProviderState.client = {
      from: vi.fn((table: string) => {
        if (table !== "jobs") {
          throw new Error(`Unexpected table ${table}`);
        }

        return {
          select: vi.fn(() =>
            makeQuery({
              error: null,
              data: [
                {
                  id: "job_1",
                  event_id: "event_1",
                  organization_id: "org_1",
                  created_by: "owner_1",
                  title: "Registration Assistant",
                  description: "Check-in and badge handoff.",
                  role_type: "Registration",
                  shift_start: "2026-04-02T10:00:00.000Z",
                  shift_end: "2026-04-02T16:00:00.000Z",
                  pay_rate: 15,
                  positions_needed: 2,
                  status: "open",
                  created_at: "2026-04-01T10:00:00.000Z",
                  updated_at: "2026-04-01T10:00:00.000Z",
                  events: {
                    id: "event_1",
                    organization_id: "org_1",
                    created_by: "owner_1",
                    title: "Investor Breakfast Briefing",
                    description: "",
                    location: "Canary Wharf, London",
                    event_date: "2026-04-02T10:00:00.000Z",
                    event_type: "Corporate",
                    required_roles: ["Registration"],
                    status: "published",
                    created_at: "2026-04-01T10:00:00.000Z",
                    updated_at: "2026-04-01T10:00:00.000Z"
                  },
                  organizations: null,
                  applications: []
                }
              ]
            })
          )
        };
      })
    };

    await expect(new SupabaseDataProvider().getJobs()).rejects.toThrow(
      "Workspace data unavailable: job organization data is not visible."
    );
  });
});
