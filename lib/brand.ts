import type { ApplicationStatus, RankedStaffRow } from "@/types/domain";

export const BRAND = {
  name: "ΛTHENΛ PRO",
  plainName: "Athena Pro",
  tagline: "The Intelligence Behind the Gate",
  concept: "Mythic Logic. Modern Execution.",
  description:
    "Athena Pro unifies ticketing infrastructure, frontline staffing, and commercial event intelligence for live operations that cannot afford guesswork.",
  metadataDescription:
    "Athena Pro is a premium event operations platform combining ticketing technology, field team deployment, and commercial oversight."
} as const;

export const NAV_LABELS = {
  jobs: "Job Board",
  rankedStaff: "Field Team",
  organiser: "Company",
  staff: "Field Team",
  services: "Services",
  about: "About",
  contact: "Contact",
  clientDashboard: "Company Workspace",
  fieldTeamDashboard: "Field Team Workspace",
  login: "Platform Access",
  signup: "Request Access"
} as const;

export const ENTITY_LABELS = {
  staff: "Field Team",
  seniorStaff: "Lead operators",
  topRatedStaff: "Top field team",
  organisers: "Companies",
  jobs: "Job Board",
  ratings: "Delivery scores",
  staffDirectory: "Field team directory",
  placements: "Confirmed jobs",
  applications: "Applications",
  liveJobs: "Live jobs"
} as const;

export const PUBLIC_COPY = {
  heroEyebrow: BRAND.concept,
  heroHeadline: "The Intelligence Behind the Gate",
  heroSubheadline:
    "Athena Pro bridges gate technology, disciplined field execution, and commercial event intelligence in one operating layer.",
  heroPrimaryCta: "Start an enquiry",
  heroSecondaryCta: "Platform access"
} as const;

export function getRankBadge(rank: number): RankedStaffRow["topBadge"] {
  if (rank === 1) {
    return "Prime";
  }

  if (rank <= 3) {
    return "Lead";
  }

  if (rank <= 6) {
    return "Verified";
  }

  return undefined;
}

export function formatApplicationStatus(status: ApplicationStatus) {
  switch (status) {
    case "pending":
      return "Under review";
    case "accepted":
      return "Confirmed";
    case "rejected":
      return "Released";
    case "withdrawn":
      return "Withdrawn";
    default:
      return status;
  }
}

export function formatStatusLabel(value: string) {
  return value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}
