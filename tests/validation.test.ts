import { describe, expect, it } from "vitest";
import {
  contactInquirySchema,
  jobAlertSchema,
  passwordResetCompleteSchema,
  createEventSchema,
  organiserSignupSchema,
  staffSignupSchema,
  staffRatingSchema
} from "@/lib/validation/schemas";
import { createCampaignSchema } from "@/lib/validation/campaign";

describe("validation schemas", () => {
  it("accepts valid organiser signup data", () => {
    const parsed = organiserSignupSchema.parse({
      role: "organiser",
      fullName: "Leah Thompson",
      email: "leah@example.com",
      password: "Password123!",
      confirmPassword: "Password123!",
      companyName: "Athena Client Group",
      newsletterConsent: false
    });

    expect(parsed.companyName).toBe("Athena Client Group");
  });

  it("accepts valid staff signup data with location and driving status", () => {
    const parsed = staffSignupSchema.parse({
      role: "staff",
      fullName: "Ava Morgan",
      email: "ava@example.com",
      password: "Password123!",
      confirmPassword: "Password123!",
      phone: "07123000000",
      location: "London",
      canDrive: true,
      skills: "Host, Registration",
      bio: "Reliable field team operator with strong guest-facing experience.",
      availability: "Mon, Tue • 09:00-17:00",
      availabilityRules: Array.from({ length: 7 }).map((_, dayOfWeek) => ({
        dayOfWeek,
        isAvailable: dayOfWeek === 1 || dayOfWeek === 2,
        isAllDay: false,
        startTime: dayOfWeek === 1 || dayOfWeek === 2 ? "09:00" : "",
        endTime: dayOfWeek === 1 || dayOfWeek === 2 ? "17:00" : ""
      })),
      newsletterConsent: false
    });

    expect(parsed.location).toBe("London");
    expect(parsed.canDrive).toBe(true);
    expect(parsed.availabilityRules?.filter((rule) => rule.isAvailable)).toHaveLength(2);
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

  it("requires at least one service need in the contact intake", () => {
    expect(() =>
      contactInquirySchema.parse({
        name: "Alex Stone",
        email: "alex@example.com",
        eventType: "Festival",
        expectedAttendance: "12000",
        serviceNeeds: [],
        brief: "Need gate support"
      })
    ).toThrow();
  });

  it("rejects mismatched password confirmation during reset", () => {
    expect(() =>
      passwordResetCompleteSchema.parse({
        password: "Password123!",
        confirmPassword: "Password123?"
      })
    ).toThrow();
  });

  it("rejects job alerts with an end date before the start date", () => {
    expect(() =>
      jobAlertSchema.parse({
        name: "London roles",
        roleTypes: ["Host"],
        dateFrom: "2026-06-10",
        dateTo: "2026-06-01",
        isActive: true,
        emailOptIn: true
      })
    ).toThrow();
  });

  it("rejects an invalid campaign schedule date", () => {
    expect(() =>
      createCampaignSchema.parse({
        name: "April client update",
        subject: "April client update",
        previewText: "A quick platform update.",
        audience: "clients",
        templateType: "newsletter",
        segmentKey: "all",
        contentMode: "markdown",
        htmlContent: "<p>A quick platform update.</p>",
        markdownContent: "A quick platform update.",
        contentJson: [],
        scheduledAt: "not-a-date"
      })
    ).toThrow();
  });

  it("accepts service-line email template types", () => {
    const parsed = createCampaignSchema.parse({
      name: "Ticketing support briefing",
      subject: "Ticketing and tech support plan",
      previewText: "A delivery note for the gate technology layer.",
      audience: "clients",
      templateType: "ticketing_tech_support",
      segmentKey: "all",
      contentMode: "markdown",
      htmlContent: "<p>Gate support overview.</p>",
      markdownContent: "Gate support overview.",
      contentJson: [],
      scheduledAt: ""
    });

    expect(parsed.templateType).toBe("ticketing_tech_support");
  });
});
