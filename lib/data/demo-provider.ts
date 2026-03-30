import { demoStore } from "@/lib/data/demo-store";
import { AppError } from "@/lib/errors";
import { getDemoSessionFromStorage, setDemoSession } from "@/lib/auth/demo-session";
import type { StaffBookDataProvider } from "@/lib/data/contracts";
import type {
  ApplicationStatus,
  AuthSession,
  BrowseJobsFilters,
  Profile,
  StaffDirectoryFilters
} from "@/types/domain";
import type {
  CreateEventInput,
  CreateJobInput,
  JobApplicationInput,
  LoginInput,
  OrganiserSignupInput,
  StaffRatingInput,
  StaffSignupInput
} from "@/lib/validation/schemas";

export class DemoDataProvider implements StaffBookDataProvider {
  getMode() {
    return "demo" as const;
  }

  async getSession(): Promise<AuthSession | null> {
    return getDemoSessionFromStorage();
  }

  async signUpOrganiser(input: OrganiserSignupInput) {
    const profile = demoStore.createOrganiserAccount(input);
    const session: AuthSession = {
      mode: "demo",
      userId: profile.id,
      role: "organiser",
      email: profile.email
    };

    setDemoSession(session);
    return session;
  }

  async signUpStaff(input: StaffSignupInput) {
    const profile = demoStore.createStaffAccount(input);
    const session: AuthSession = {
      mode: "demo",
      userId: profile.id,
      role: "staff",
      email: profile.email
    };

    setDemoSession(session);
    return session;
  }

  async signIn(input: LoginInput) {
    const profile = demoStore.findProfileByEmail(input.email);

    if (!profile) {
      throw new AppError(
        "This demo account does not exist yet. Create it on the signup screen first.",
        "LOGIN_FAILED",
        401
      );
    }

    const session: AuthSession = {
      mode: "demo",
      userId: profile.id,
      role: profile.role,
      email: profile.email
    };

    setDemoSession(session);
    return session;
  }

  async signOut() {
    setDemoSession(null);
  }

  async getCurrentProfile(): Promise<Profile | null> {
    const session = getDemoSessionFromStorage();
    return session ? (demoStore.getSessionUser(session) ?? null) : null;
  }

  async getLandingHighlights() {
    return demoStore.getLandingHighlights();
  }

  async getJobs(filters?: BrowseJobsFilters) {
    return demoStore.getJobs().filter((job) => {
      const query = filters?.query?.toLowerCase();
      const location = filters?.location?.toLowerCase();
      const roleType = filters?.roleType?.toLowerCase();

      return (
        (!query ||
          job.title.toLowerCase().includes(query) ||
          job.description.toLowerCase().includes(query) ||
          job.event.title.toLowerCase().includes(query)) &&
        (!location || job.event.location.toLowerCase().includes(location)) &&
        (!roleType || job.roleType.toLowerCase().includes(roleType)) &&
        (!filters?.minimumPay || job.payRate >= filters.minimumPay) &&
        (!filters?.date || job.event.eventDate.slice(0, 10) === filters.date)
      );
    });
  }

  async getJobById(id: string) {
    return demoStore.getJobById(id);
  }

  async getRankedStaff(filters?: StaffDirectoryFilters) {
    return demoStore.getRankedStaff().filter((entry) => {
      const query = filters?.query?.toLowerCase();
      const skill = filters?.skill?.toLowerCase();
      const availability = filters?.availability?.toLowerCase();

      return (
        (!query ||
          entry.profile.fullName.toLowerCase().includes(query) ||
          entry.profile.bio?.toLowerCase().includes(query)) &&
        (!skill || entry.profile.skills.some((item) => item.toLowerCase().includes(skill))) &&
        (!availability ||
          entry.profile.availability?.toLowerCase().includes(availability))
      );
    });
  }

  async getOrganiserDashboard() {
    const session = getDemoSessionFromStorage();

    if (!session || session.role !== "organiser") {
      throw new AppError("You must sign in as an organiser.", "UNAUTHENTICATED", 401);
    }

    return demoStore.getOrganiserDashboard(session);
  }

  async getStaffDashboard() {
    const session = getDemoSessionFromStorage();

    if (!session || session.role !== "staff") {
      throw new AppError("You must sign in as staff.", "UNAUTHENTICATED", 401);
    }

    return demoStore.getStaffDashboard(session);
  }

  async createEvent(input: CreateEventInput) {
    const session = getDemoSessionFromStorage();

    if (!session) {
      throw new AppError("You must sign in first.", "UNAUTHENTICATED", 401);
    }

    demoStore.createEvent(session, input);
  }

  async createJob(input: CreateJobInput) {
    const session = getDemoSessionFromStorage();

    if (!session) {
      throw new AppError("You must sign in first.", "UNAUTHENTICATED", 401);
    }

    demoStore.createJob(session, input);
  }

  async applyToJob(input: JobApplicationInput) {
    const session = getDemoSessionFromStorage();

    if (!session) {
      throw new AppError("You must sign in first.", "UNAUTHENTICATED", 401);
    }

    demoStore.applyToJob(session, input);
  }

  async updateApplicationStatus(applicationId: string, status: ApplicationStatus) {
    const session = getDemoSessionFromStorage();

    if (!session) {
      throw new AppError("You must sign in first.", "UNAUTHENTICATED", 401);
    }

    demoStore.updateApplicationStatus(session, applicationId, status);
  }

  async markEventCompleted(eventId: string) {
    demoStore.markEventCompleted(eventId);
  }

  async submitRating(input: StaffRatingInput) {
    const session = getDemoSessionFromStorage();

    if (!session) {
      throw new AppError("You must sign in first.", "UNAUTHENTICATED", 401);
    }

    return demoStore.submitRating(session, input);
  }
}
