import { beforeEach, describe, expect, it } from "vitest";
import { DemoDataProvider } from "@/lib/data/demo-provider";
import { sortBoardItemsByNew } from "@/lib/domain/jobs-board";
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
      password: "Password123!",
      confirmPassword: "Password123!",
      companyName: "Demo Events Ltd",
      newsletterConsent: false
    });

    const initialDashboard = await provider.getOrganiserDashboard();
    const initialCount = initialDashboard.events.length;

    await provider.createEvent({
      title: "Spring Client Reception",
      description: "Premium evening reception for stakeholders and clients.",
      location: "London",
      eventDate: new Date().toISOString(),
      eventType: "Reception",
      requiredRoles: "Host, Bartender",
      serviceTier: "formal"
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
      password: "Password123!",
      confirmPassword: "Password123!",
      phone: "07123000999",
      location: "London",
      canDrive: true,
      skills: "host, registration",
      bio: "Experienced event staffer with strong front-of-house polish.",
      availability: "Weekends",
      newsletterConsent: false
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

  it("builds the jobs board with trending and new ordering", async () => {
    const provider = new DemoDataProvider();

    await provider.signIn({
      email: "ava.morgan@demo.staffbook.app",
      password: "Password123!"
    });

    const board = await provider.getStaffJobsBoard();
    const trendingScores = board.items.map((item) => item.trendingScore);
    const newItems = sortBoardItemsByNew(board.items);

    expect(trendingScores[0]).toBeGreaterThanOrEqual(trendingScores[1]);
    expect(new Date(newItems[0]!.job.createdAt).getTime()).toBeGreaterThanOrEqual(
      new Date(newItems[1]!.job.createdAt).getTime()
    );
  });

  it("returns applied jobs with the current application status", async () => {
    const provider = new DemoDataProvider();

    await provider.signIn({
      email: "ava.morgan@demo.staffbook.app",
      password: "Password123!"
    });

    const board = await provider.getStaffJobsBoard();
    const appliedItem = board.items.find((item) => item.job.id === "job_1");

    expect(appliedItem?.hasApplied).toBe(true);
    expect(appliedItem?.applicationStatus).toBe("pending");
  });

  it("saves jobs and prevents duplicate saved job entries", async () => {
    const provider = new DemoDataProvider();

    await provider.signIn({
      email: "ava.morgan@demo.staffbook.app",
      password: "Password123!"
    });

    await provider.saveJob("job_3");
    await provider.saveJob("job_3");

    const board = await provider.getStaffJobsBoard();
    expect(board.items.find((item) => item.job.id === "job_3")?.isSaved).toBe(true);

    await provider.unsaveJob("job_3");
    const afterUnsave = await provider.getStaffJobsBoard();
    expect(afterUnsave.items.find((item) => item.job.id === "job_3")?.isSaved).toBe(false);
  });

  it("creates and deletes job alerts", async () => {
    const provider = new DemoDataProvider();

    await provider.signIn({
      email: "ava.morgan@demo.staffbook.app",
      password: "Password123!"
    });

    const alert = await provider.upsertJobAlert({
      name: "Weekend hosting",
      query: "host",
      location: "London",
      roleTypes: ["Host"],
      minimumPay: 16,
      dateFrom: "",
      dateTo: "",
      isActive: true,
      emailOptIn: true
    });
    const alerts = await provider.getJobAlerts();

    expect(alerts.some((item) => item.id === alert.id)).toBe(true);

    await provider.deleteJobAlert(alert.id);
    const nextAlerts = await provider.getJobAlerts();
    expect(nextAlerts.some((item) => item.id === alert.id)).toBe(false);
  });

  it("allows staff to withdraw a pending application", async () => {
    const provider = new DemoDataProvider();

    await provider.signIn({
      email: "ava.morgan@demo.staffbook.app",
      password: "Password123!"
    });

    const before = await provider.getStaffJobsBoard();
    const pending = before.items.find((item) => item.applicationStatus === "pending" && item.applicationId);

    await provider.withdrawApplication(pending!.applicationId!);
    const after = await provider.getStaffJobsBoard();

    expect(after.items.find((item) => item.job.id === pending!.job.id)?.applicationStatus).toBe("withdrawn");
  });

  it("suppresses duplicate job views within six hours", async () => {
    const provider = new DemoDataProvider();

    await provider.signIn({
      email: "ava.morgan@demo.staffbook.app",
      password: "Password123!"
    });

    const before = await provider.getStaffJobsBoard();
    const beforeViews = before.items.find((item) => item.job.id === "job_3")!.trendingSignals.views72h;

    await provider.recordJobView("job_3");
    const afterFirstView = await provider.getStaffJobsBoard();
    const firstViews = afterFirstView.items.find((item) => item.job.id === "job_3")!.trendingSignals.views72h;

    await provider.recordJobView("job_3");
    const afterSecondView = await provider.getStaffJobsBoard();
    const secondViews = afterSecondView.items.find((item) => item.job.id === "job_3")!.trendingSignals.views72h;

    expect(firstViews).toBe(beforeViews + 1);
    expect(secondViews).toBe(firstViews);
  });
});
