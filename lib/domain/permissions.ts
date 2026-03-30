import type { ApplicationStatus, Event, Job } from "@/types/domain";

const terminalApplicationStatuses: ApplicationStatus[] = ["accepted", "rejected", "withdrawn"];

export function canRateStaff(event: Event, applicationStatus: ApplicationStatus) {
  return event.status === "completed" && applicationStatus === "accepted";
}

export function canTransitionApplication(
  current: ApplicationStatus,
  next: ApplicationStatus
) {
  if (current === next) {
    return true;
  }

  if (current === "pending") {
    return ["accepted", "rejected", "withdrawn"].includes(next);
  }

  return terminalApplicationStatuses.includes(current) && next === current;
}

export function isJobOpen(job: Job) {
  return job.status === "open";
}
