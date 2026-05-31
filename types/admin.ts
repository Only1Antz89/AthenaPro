export type AdminRole =
  | "super_admin"
  | "operations_admin"
  | "finance_admin"
  | "marketing_admin";

export type ClientStatus = "active" | "inactive" | "at_risk";
export type VerificationStatus = "pending" | "in_review" | "verified" | "rejected";
export type OnboardingStatus = "pending" | "in_review" | "approved" | "rejected";
export type AssignmentStatus =
  | "draft"
  | "open"
  | "partially_filled"
  | "filled"
  | "in_progress"
  | "completed"
  | "cancelled";
export type CampaignStatus = "draft" | "scheduled" | "sending" | "sent" | "failed";
export type CampaignAudience = "clients" | "operators" | "both";
export type MarketingCategory = "news" | "offers" | "updates";
export type ExportFormat = "csv" | "json" | "xlsx";
export type CampaignContentMode = "rich" | "markdown";
export const EMAIL_TEMPLATE_TYPES = [
  "client_onboarding",
  "operator_onboarding",
  "client_onboarding_approved",
  "operator_onboarding_approved",
  "client_offboarding",
  "operator_offboarding",
  "job_confirmation_client",
  "job_confirmation_operator",
  "promotion",
  "payment",
  "newsletter",
  "notification",
  "password_changed",
  "password_reset",
  "ticketing_tech_support",
  "personnel_operations",
  "commercial_management",
  "integrated_support"
] as const;

export type EmailTemplateType = (typeof EMAIL_TEMPLATE_TYPES)[number];

export const EMAIL_TEMPLATE_LABELS: Record<EmailTemplateType, string> = {
  client_onboarding: "Client onboarding",
  operator_onboarding: "Operator onboarding",
  client_onboarding_approved: "Client onboarding approved",
  operator_onboarding_approved: "Operator onboarding approved",
  client_offboarding: "Client offboarding",
  operator_offboarding: "Operator offboarding",
  job_confirmation_client: "Client job confirmation",
  job_confirmation_operator: "Operator job confirmation",
  promotion: "Promotion",
  payment: "Payment",
  newsletter: "Newsletter",
  notification: "Notification",
  password_changed: "Password changed",
  password_reset: "Password reset",
  ticketing_tech_support: "Ticketing & tech support",
  personnel_operations: "Personnel & operations",
  commercial_management: "Commercial management",
  integrated_support: "Integrated support"
};
export type CampaignBlockType = "heading" | "text" | "image" | "cta" | "markdown";

export interface AdminIdentity {
  id: string;
  fullName: string;
  email: string;
  adminRole: AdminRole;
  isActive: boolean;
}

export interface AdminDashboardKpis {
  totalClients: number;
  activeClients: number;
  totalOperators: number;
  verifiedOperators: number;
  openAssignments: number;
  filledAssignments: number;
  completedAssignments: number;
  cancelledAssignments: number;
  monthlyRevenue: number;
  outstandingBalances: number;
  repeatBookingRate: number;
  topClient: string;
  topOperator: string;
}

export interface AdminChartPoint {
  label: string;
  value: number;
}

export interface AdminAlert {
  id: string;
  type: "balance" | "assignment" | "onboarding" | "operator";
  label: string;
  href: string;
  severity: "low" | "medium" | "high";
  context: string;
}

export interface ClientSummary {
  id: string;
  companyName: string;
  tradingName?: string;
  primaryContactName: string;
  primaryContactEmail: string;
  billingContactEmail: string;
  status: ClientStatus;
  onboardingStatus: OnboardingStatus;
  signupDate: string;
  activeAssignments: number;
  futureAssignments: number;
  lifetimeSpend: number;
  monthlySpend: number;
  outstandingBalance: number;
  repeatBookingRate: number;
  favouriteOperators: number;
  blockedOperators: number;
  lastActivityAt: string;
  notes: string[];
}

export interface ClientFinancialRecord {
  invoiceId: string;
  invoiceNumber: string;
  issueDate: string;
  dueDate: string;
  totalAmount: number;
  amountPaid: number;
  balance: number;
  status: "draft" | "sent" | "part_paid" | "paid" | "overdue";
}

export interface ClientDetail extends ClientSummary {
  billingContactName: string;
  primaryContactPhone: string;
  billingContactPhone: string;
  address: string;
  paymentHistory: ClientPaymentRecord[];
  assignments: AssignmentSummary[];
  preferredOperators: OperatorSummary[];
  blockedOperatorProfiles: OperatorSummary[];
  auditEntries: AuditEntry[];
}

export interface OperatorSummary {
  id: string;
  userId: string;
  displayName: string;
  email: string;
  verificationStatus: VerificationStatus;
  onboardingStatus: OnboardingStatus;
  regions: string[];
  skillTags: string[];
  averageRating: number;
  totalCompleted: number;
  totalCancellations: number;
  totalNoShows: number;
  repeatClients: number;
  favouriteCount: number;
  blockedCount: number;
  complaintCount: number;
  earningsYtd: number;
  isActive: boolean;
  latestAssignmentAt?: string;
  notes: string[];
}

export interface OperatorDocument {
  id: string;
  documentType: string;
  verificationStatus: VerificationStatus;
  expiresAt?: string;
  reviewedAt?: string;
}

export interface OperatorDetail extends OperatorSummary {
  completionRate: number;
  assignments: AssignmentSummary[];
  repeatClientNames: string[];
  favouritedByClients: string[];
  documents: OperatorDocument[];
  auditEntries: AuditEntry[];
}

export interface AssignmentApplicant {
  operatorId: string;
  operatorName: string;
  status: "applied" | "accepted" | "rejected" | "waitlisted";
  rating: number;
}

export interface AssignmentSummary {
  id: string;
  eventId: string;
  eventTitle: string;
  eventType: string;
  clientId: string;
  clientName: string;
  title: string;
  description: string;
  roleType: string;
  locationName: string;
  startsAt: string;
  endsAt: string;
  durationHours: number;
  status: AssignmentStatus;
  requiredHeadcount: number;
  assignedHeadcount: number;
  applicantCount: number;
  payRate: number;
  chargeRate: number;
  labourCost: number;
  techRentalCost: number;
  techRentalItems: string[];
  athenaServiceCharge: number;
  totalChargeAmount: number;
  totalPayAmount: number;
  fillRate: number;
  repeatOperatorsAvailable: number;
}

export interface AssignmentDetail extends AssignmentSummary {
  applicants: AssignmentApplicant[];
  assignedTeam: OperatorSummary[];
  favouriteOperatorMatches: OperatorSummary[];
  auditEntries: AuditEntry[];
  feedback: Array<{
    operatorName: string;
    rating: number;
    reviewText: string;
  }>;
}

export interface ClientPaymentRecord {
  id: string;
  clientId: string;
  invoiceId?: string;
  amount: number;
  paymentDate: string;
  paymentMethod: string;
  externalReference: string;
}

export interface FinanceSummary {
  totalBilled: number;
  totalCollected: number;
  totalOutstanding: number;
  monthlyRevenue: number;
  topRevenueClients: Array<{
    clientId: string;
    companyName: string;
    totalSpend: number;
  }>;
  outstandingInvoices: ClientFinancialRecord[];
}

export interface OnboardingItem {
  id: string;
  entityType: "client" | "operator";
  entityId: string;
  entityName: string;
  status: OnboardingStatus;
  owner: string;
  updatedAt: string;
  checklist: Array<{
    label: string;
    completed: boolean;
  }>;
}

export interface CampaignSummary {
  id: string;
  name: string;
  subject: string;
  previewText: string;
  audience: CampaignAudience;
  templateType: EmailTemplateType;
  marketingCategory: MarketingCategory;
  segmentKey: string;
  status: CampaignStatus;
  contentMode: CampaignContentMode;
  htmlContent: string;
  markdownContent?: string;
  contentJson?: string;
  googleDocId?: string;
  googleDocUrl?: string;
  scheduledAt?: string;
  sentAt?: string;
  audienceCount: number;
  openRate: number;
  clickRate: number;
}

export interface CampaignDetail extends CampaignSummary {
  recipientBreakdown: Array<{
    label: string;
    count: number;
  }>;
}

export interface EmailTemplate {
  id: string;
  name: string;
  templateType: EmailTemplateType;
  subjectTemplate: string;
  previewText: string;
  bodyHtml: string;
  bodyMarkdown?: string;
  isSystem: boolean;
  updatedAt: string;
}

export interface EmailDelivery {
  id: string;
  templateType: EmailTemplateType;
  recipientEmail: string;
  recipientName?: string;
  campaignId?: string;
  subject: string;
  status:
    | "queued"
    | "sent"
    | "delivered"
    | "opened"
    | "clicked"
    | "bounced"
    | "complained"
    | "unsubscribed"
    | "rejected"
    | "failed";
  provider: string;
  category?: "transactional" | "marketing";
  errorMessage?: string;
  sentAt?: string;
  deliveredAt?: string;
  openedAt?: string;
  clickedAt?: string;
  lastEvent?: string;
  lastEventAt?: string;
  createdAt: string;
}

export interface ExportJob {
  id: string;
  exportType: string;
  format: ExportFormat;
  status: "queued" | "processing" | "completed" | "failed";
  requestedBy: string;
  createdAt: string;
  completedAt?: string;
}

export interface AuditEntry {
  id: string;
  actorName: string;
  action: string;
  entityType: string;
  entityLabel: string;
  createdAt: string;
  metadata: string;
}

export interface AdminDashboardData {
  kpis: AdminDashboardKpis;
  topClients: Array<{
    clientId: string;
    companyName: string;
    totalSpend: number;
  }>;
  topOperators: Array<{
    operatorId: string;
    displayName: string;
    rankingScore: number;
    averageRating: number;
  }>;
  alerts: AdminAlert[];
  revenueSeries: AdminChartPoint[];
  assignmentSeries: AdminChartPoint[];
  overdueBalances: ClientFinancialRecord[];
  onboardingQueue: OnboardingItem[];
}

export interface AdminDataset {
  admin: AdminIdentity;
  dashboard: AdminDashboardData;
  clients: ClientSummary[];
  clientDetails: Record<string, ClientDetail>;
  operators: OperatorSummary[];
  operatorDetails: Record<string, OperatorDetail>;
  assignments: AssignmentSummary[];
  assignmentDetails: Record<string, AssignmentDetail>;
  finance: FinanceSummary;
  onboarding: OnboardingItem[];
  campaigns: CampaignSummary[];
  campaignDetails: Record<string, CampaignDetail>;
  emailTemplates: EmailTemplate[];
  emailDeliveries: EmailDelivery[];
  exports: ExportJob[];
  auditEntries: AuditEntry[];
}
