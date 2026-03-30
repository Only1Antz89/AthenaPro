import { JobsBrowser } from "@/features/public/jobs-browser";
import { getPublicJobs } from "@/lib/services/staffbook-service";

export default async function JobsPage() {
  const jobs = await getPublicJobs();
  return <JobsBrowser initialJobs={jobs} />;
}
