import { z } from "zod";

export const organiserSignupSchema = z.object({
  role: z.literal("organiser"),
  fullName: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
  companyName: z.string().min(2)
});

export const staffSignupSchema = z.object({
  role: z.literal("staff"),
  fullName: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
  phone: z.string().min(7),
  skills: z.string().min(2),
  bio: z.string().min(10),
  availability: z.string().min(2)
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
});

export const createEventSchema = z.object({
  title: z.string().min(2),
  description: z.string().min(10),
  location: z.string().min(2),
  eventDate: z.string().min(2),
  eventType: z.string().min(2),
  requiredRoles: z.string().min(2)
});

export const createJobSchema = z.object({
  eventId: z.string().min(2),
  title: z.string().min(2),
  description: z.string().min(10),
  roleType: z.string().min(2),
  shiftStart: z.string().min(2),
  shiftEnd: z.string().min(2),
  payRate: z.coerce.number().min(1),
  positionsNeeded: z.coerce.number().int().min(1)
});

export const jobApplicationSchema = z.object({
  jobId: z.string().min(2),
  coverNote: z.string().min(10)
});

export const staffRatingSchema = z.object({
  eventId: z.string().min(2),
  staffId: z.string().min(2),
  jobId: z.string().min(2),
  rating: z.coerce.number().int().min(1).max(5),
  comment: z.string().min(4)
});

export type OrganiserSignupInput = z.infer<typeof organiserSignupSchema>;
export type StaffSignupInput = z.infer<typeof staffSignupSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type CreateEventInput = z.infer<typeof createEventSchema>;
export type CreateJobInput = z.infer<typeof createJobSchema>;
export type JobApplicationInput = z.infer<typeof jobApplicationSchema>;
export type StaffRatingInput = z.infer<typeof staffRatingSchema>;
