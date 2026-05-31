import { demoStore } from "@/lib/data/demo-store";
import { AppError } from "@/lib/errors";
import { getDemoSessionFromStorage, setDemoSession } from "@/lib/auth/demo-session";
import { filterJobs } from "@/lib/domain/jobs-board";
import type { StaffBookDataProvider } from "@/lib/data/contracts";
import type {
  ApplicationStatus,
  AuthSession,
  BrowseJobsFilters,
  JobStatus,
  Profile,
  StaffDirectoryFilters
} from "@/types/domain";
import type {
  ClientFeedbackInput,
  CreateEventInput,
  CreateJobInput,
  JobApplicationInput,
  JobAlertInput,
  LoginInput,
  OperatorReviewInput,
  OrganiserSignupInput,
  PasswordResetRequestInput,
  StaffSignupInput,
  UpdateEmailInput,
  UpdateMarketingPreferencesInput,
  UpdateOperatorAvailabilityInput,
  UpdateOperatorProfileInput,
  UpdatePasswordInput
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

  async requestPasswordReset(_input: PasswordResetRequestInput, _redirectTo: string) {
    return;
  }

  async getCurrentProfile(): Promise<Profile | null> {
    const session = getDemoSessionFromStorage();
    return session ? (demoStore.getSessionUser(session) ?? null) : null;
  }

  async getCurrentOperatorProfile() {
    const session = getDemoSessionFromStorage();
    return session ? (demoStore.getOperatorProfile(session) ?? null) : null;
  }

  async getLandingHighlights() {
    return demoStore.getLandingHighlights();
  }

  async getJobs(filters?: BrowseJobsFilters) {
    return filterJobs(demoStore.getJobs(), filters);
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
        (!availability || entry.profile.availability?.toLowerCase().includes(availability))
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

  async getStaffJobsBoard() {
    const session = getDemoSessionFromStorage();

    if (!session || session.role !== "staff") {
      throw new AppError("You must sign in as staff.", "UNAUTHENTICATED", 401);
    }

    return demoStore.getStaffJobsBoard(session);
  }

  async getOperatorWorkspace() {
    const session = getDemoSessionFromStorage();

    if (!session || session.role !== "staff") {
      throw new AppError("You must sign in as staff.", "UNAUTHENTICATED", 401);
    }

    return demoStore.getOperatorWorkspace(session);
  }

  async getNotifications() {
    const session = getDemoSessionFromStorage();

    if (!session) {
      throw new AppError("You must sign in first.", "UNAUTHENTICATED", 401);
    }

    return demoStore.getNotifications(session);
  }

  async getJobAlerts() {
    const session = getDemoSessionFromStorage();

    if (!session || session.role !== "staff") {
      return [];
    }

    return demoStore.getJobAlerts(session);
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

  async updateJobStatus(jobId: string, status: Extract<JobStatus, "open" | "closed" | "cancelled">) {
    const session = getDemoSessionFromStorage();

    if (!session) {
      throw new AppError("You must sign in first.", "UNAUTHENTICATED", 401);
    }

    demoStore.updateJobStatus(session, jobId, status);
  }

  async applyToJob(input: JobApplicationInput) {
    const session = getDemoSessionFromStorage();

    if (!session) {
      throw new AppError("You must sign in first.", "UNAUTHENTICATED", 401);
    }

    demoStore.applyToJob(session, input);
  }

  async withdrawApplication(applicationId: string) {
    const session = getDemoSessionFromStorage();

    if (!session || session.role !== "staff") {
      throw new AppError("You must sign in as staff.", "UNAUTHENTICATED", 401);
    }

    demoStore.withdrawApplication(session, applicationId);
  }

  async saveJob(jobId: string) {
    const session = getDemoSessionFromStorage();

    if (!session || session.role !== "staff") {
      throw new AppError("You must sign in as staff.", "UNAUTHENTICATED", 401);
    }

    demoStore.saveJob(session, jobId);
  }

  async unsaveJob(jobId: string) {
    const session = getDemoSessionFromStorage();

    if (!session || session.role !== "staff") {
      throw new AppError("You must sign in as staff.", "UNAUTHENTICATED", 401);
    }

    demoStore.unsaveJob(session, jobId);
  }

  async upsertJobAlert(input: JobAlertInput) {
    const session = getDemoSessionFromStorage();

    if (!session || session.role !== "staff") {
      throw new AppError("You must sign in as staff.", "UNAUTHENTICATED", 401);
    }

    return demoStore.upsertJobAlert(session, input);
  }

  async deleteJobAlert(alertId: string) {
    const session = getDemoSessionFromStorage();

    if (!session || session.role !== "staff") {
      throw new AppError("You must sign in as staff.", "UNAUTHENTICATED", 401);
    }

    demoStore.deleteJobAlert(session, alertId);
  }

  async recordJobView(jobId: string) {
    const session = getDemoSessionFromStorage();

    if (!session || session.role !== "staff") {
      return;
    }

    demoStore.recordJobView(session, jobId);
  }

  async updateApplicationStatus(applicationId: string, status: ApplicationStatus): Promise<{ warning?: string }> {
    const session = getDemoSessionFromStorage();

    if (!session) {
      throw new AppError("You must sign in first.", "UNAUTHENTICATED", 401);
    }

    demoStore.updateApplicationStatus(session, applicationId, status);
    return {};
  }

  async markEventCompleted(eventId: string) {
    demoStore.markEventCompleted(eventId);
  }

  async submitOperatorReview(input: OperatorReviewInput) {
    const session = getDemoSessionFromStorage();

    if (!session) {
      throw new AppError("You must sign in first.", "UNAUTHENTICATED", 401);
    }

    return demoStore.submitOperatorReview(session, input);
  }

  async submitClientFeedback(input: ClientFeedbackInput) {
    const session = getDemoSessionFromStorage();

    if (!session) {
      throw new AppError("You must sign in first.", "UNAUTHENTICATED", 401);
    }

    demoStore.submitClientFeedback(session, input);
  }

  async updateOperatorProfile(input: UpdateOperatorProfileInput) {
    const session = getDemoSessionFromStorage();

    if (!session) {
      throw new AppError("You must sign in first.", "UNAUTHENTICATED", 401);
    }

    demoStore.updateOperatorProfile(session, input);
  }

  async updateOperatorAvailability(input: UpdateOperatorAvailabilityInput) {
    const session = getDemoSessionFromStorage();

    if (!session) {
      throw new AppError("You must sign in first.", "UNAUTHENTICATED", 401);
    }

    demoStore.updateOperatorAvailability(session, input);
  }

  async updateEmail(input: UpdateEmailInput) {
    const session = getDemoSessionFromStorage();

    if (!session) {
      throw new AppError("You must sign in first.", "UNAUTHENTICATED", 401);
    }

    demoStore.updateEmail(session, input.email);
    setDemoSession({ ...session, email: input.email });
  }

  async updateMarketingPreferences(input: UpdateMarketingPreferencesInput) {
    const session = getDemoSessionFromStorage();

    if (!session) {
      throw new AppError("You must sign in first.", "UNAUTHENTICATED", 401);
    }

    demoStore.updateMarketingPreferences(session, input);
  }

  async updatePassword(_input: UpdatePasswordInput) {
    const session = getDemoSessionFromStorage();

    if (!session) {
      throw new AppError("You must sign in first.", "UNAUTHENTICATED", 401);
    }
  }
}
