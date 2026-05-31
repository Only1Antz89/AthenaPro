import { describe, expect, it, vi } from "vitest";
import { POST } from "@/app/api/auth/register/route";

const supabaseTestState = vi.hoisted(() => ({
  client: null as unknown,
  operations: [] as string[],
  resolveProfileInsert: null as null | (() => void)
}));

vi.mock("@/lib/supabase/admin", () => ({
  createAdminSupabaseClient: vi.fn(() => supabaseTestState.client)
}));

function buildStaffPayload() {
  return {
    role: "staff",
    fullName: "Ava Morgan",
    email: "ava@example.com",
    password: "Password123!",
    confirmPassword: "Password123!",
    phone: "07123000000",
    location: "London",
    canDrive: true,
    skills: "Guest Services, Ticket Scanning",
    bio: "Reliable field team operator with strong guest-facing experience.",
    availability: "Monday-Sunday 09:00-23:00",
    availabilityRules: Array.from({ length: 7 }).map((_, dayOfWeek) => ({
      dayOfWeek,
      isAvailable: true,
      isAllDay: false,
      startTime: "09:00",
      endTime: "23:00"
    })),
    newsletterConsent: true
  };
}

function buildSupabaseClient() {
  const insert = vi.fn((table: string) => {
    supabaseTestState.operations.push(`start:${table}`);

    if (table === "profiles") {
      return new Promise<{ error: null }>((resolve) => {
        supabaseTestState.resolveProfileInsert = () => {
          supabaseTestState.operations.push("resolve:profiles");
          resolve({ error: null });
        };
      });
    }

    supabaseTestState.operations.push(`resolve:${table}`);
    return Promise.resolve({ error: null });
  });

  return {
    auth: {
      admin: {
        createUser: vi.fn().mockResolvedValue({
          data: { user: { id: "00000000-0000-4000-8000-000000000001" } },
          error: null
        }),
        deleteUser: vi.fn().mockResolvedValue({ error: null })
      }
    },
    from: vi.fn((table: string) => ({
      insert: () => insert(table),
      delete: () => ({
        eq: vi.fn().mockResolvedValue({ error: null })
      })
    }))
  };
}

async function flushMicrotasks() {
  await new Promise((resolve) => setTimeout(resolve, 0));
}

function expectCallable(value: unknown): asserts value is () => void {
  expect(value).toBeTypeOf("function");
}

describe("auth registration route", () => {
  it("creates the staff profile before dependent staff records", async () => {
    supabaseTestState.client = buildSupabaseClient();
    supabaseTestState.operations = [];
    supabaseTestState.resolveProfileInsert = null;

    const responsePromise = POST(
      new Request("http://test.local/api/auth/register", {
        method: "POST",
        body: JSON.stringify(buildStaffPayload())
      })
    );

    await flushMicrotasks();

    expect(supabaseTestState.operations).toEqual(["start:profiles"]);
    const resolveProfileInsert: unknown = supabaseTestState.resolveProfileInsert;
    expectCallable(resolveProfileInsert);

    resolveProfileInsert();
    const response = await responsePromise;

    expect(response.status).toBe(200);
    expect(supabaseTestState.operations).toEqual([
      "start:profiles",
      "resolve:profiles",
      "start:operator_profiles",
      "resolve:operator_profiles",
      "start:operator_payment_profiles",
      "resolve:operator_payment_profiles",
      "start:marketing_preferences",
      "resolve:marketing_preferences",
      "start:operator_availability_rules",
      "resolve:operator_availability_rules"
    ]);
  });
});
