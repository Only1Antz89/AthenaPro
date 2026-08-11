import { notFound } from "next/navigation";
import { JobDetail } from "@/features/public/job-detail";
import { getPublicJobs } from "@/lib/services/staffbook-service";

export default async function JobPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const jobs = await getPublicJobs();
  const job = jobs.find((entry) => entry.id === id);

  if (!job) {
    notFound();
  }

  return <JobDetail job={job} />;
}
