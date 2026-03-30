import { beforeEach, describe, expect, it } from "vitest";
import { DemoDataProvider } from "@/lib/data/demo-provider";
import { demoStore } from "@/lib/data/demo-store";

describe("demo provider workflow", () => {
  beforeEach(() => {
    window.localStorage.clear();
    demoStore.reset();
  });

  it("creates an organiser starter workspace and allows event creation", async () => {
    const provider = new DemoDataProvider();

    await provider.signUpOrganiser({
      role: "organiser",
      fullName: "Organiser Demo",
      email: "organiser@demo.local",
      password: "password123",
      companyName: "Demo Events Ltd"
    });

    const initialDashboard = await provider.getOrganiserDashboard();
    const initialCount = initialDashboard.events.length;

    await provider.createEvent({
      title: "Spring Client Reception",
      description: "Premium evening reception for stakeholders and clients.",
      location: "London",
      eventDate: new Date().toISOString(),
      eventType: "Reception",
      requiredRoles: "Host, Bartender"
    });

    const nextDashboard = await provider.getOrganiserDashboard();

    expect(nextDashboard.organization.name).toBe("Demo Events Ltd");
    expect(nextDashboard.events.length).toBe(initialCount + 1);
  });

  it("creates a staff account and allows a single job application", async () => {
    const provider = new DemoDataProvider();

    await provider.signUpStaff({
      role: "staff",
      fullName: "Staff Demo",
      email: "staff@demo.local",
      password: "password123",
      phone: "07123000999",
      skills: "host, registration",
      bio: "Experienced event staffer with strong front-of-house polish.",
      availability: "Weekends"
    });

    const jobs = await provider.getJobs();
    const dashboardBeforeApply = await provider.getStaffDashboard();
    const alreadyApplied = new Set(dashboardBeforeApply.recentApplications.map((item) => item.job.id));
    const targetJob = jobs.find((job) => !alreadyApplied.has(job.id));

    await provider.applyToJob({
      jobId: targetJob!.id,
      coverNote: "Available and experienced in guest-facing event support."
    });

    const dashboard = await provider.getStaffDashboard();
    expect(dashboard.recentApplications.length).toBeGreaterThan(0);

    await expect(
      provider.applyToJob({
        jobId: targetJob!.id,
        coverNote: "Trying to apply twice should fail."
      })
    ).rejects.toThrow();
  });
});
