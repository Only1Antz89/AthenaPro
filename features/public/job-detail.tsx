"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Heart } from "lucide-react";
import { toast } from "sonner";
import { PageContainer } from "@/components/layout/page-container";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field } from "@/components/ui/field";
import { Textarea } from "@/components/ui/textarea";
import { useQueryState } from "@/features/app/use-query-state";
import { useStaffBook } from "@/features/app/use-staffbook";
import { formatStatusLabel } from "@/lib/brand";
import { toDisplayError } from "@/lib/errors";
import { jobApplicationSchema } from "@/lib/validation/schemas";
import { cn, formatCurrency, formatDate, formatDateTime } from "@/lib/utils";
import type { EnrichedJob, StaffJobsBoardData } from "@/types/domain";

function getEstimatedPay(job: EnrichedJob) {
  const durationMs = new Date(job.shiftEnd).getTime() - new Date(job.shiftStart).getTime();
  const hours = Math.max(durationMs / (1000 * 60 * 60), 0);
  return {
    hours,
    total: hours * job.payRate
  };
}

export function JobDetail({ job }: { job: EnrichedJob }) {
  const { provider, session } = useStaffBook();
  const [coverNote, setCoverNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const board = useQueryState<StaffJobsBoardData | null>(
    () => (session?.role === "staff" ? provider.getStaffJobsBoard() : Promise.resolve(null)),
    [provider, session?.role, session?.userId]
  );
  const boardItem = board.data?.items.find((item) => item.job.id === job.id);
  const estimatedPay = getEstimatedPay(job);
  const profileComplete =
    session?.role === "staff" ? Boolean(board.data?.profile.location && board.data?.profile.skills.length) : false;
  const minimumAgeMet =
    !job.minimumAge || !board.data?.profile.age || board.data.profile.age >= job.minimumAge;
  const eligibility = [
    profileComplete ? "Profile has location and skills" : "Complete profile details to improve matching",
    minimumAgeMet ? "Minimum age requirement looks clear" : `Minimum age is ${job.minimumAge}`,
    boardItem?.matchReasons[0] ?? "Availability and location fit are considered after sign-in"
  ];

  useEffect(() => {
    if (session?.role !== "staff") {
      return;
    }

    void provider.recordJobView(job.id).catch(() => {
      // View tracking should not interrupt the application flow.
    });
  }, [job.id, provider, session?.role]);

  return (
    <main>
      <SiteHeader />
      <section className="py-10 sm:py-12 md:py-16">
        <PageContainer className="grid gap-8 lg:grid-cols-[1fr_360px]">
          <div>
            <Link href="/jobs" className="text-sm font-semibold text-mist">
              Back to job board
            </Link>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <h1 className="text-balance font-display text-4xl font-semibold tracking-[-0.05em] text-ink sm:text-5xl">
                {job.title}
              </h1>
              <Badge variant={job.status === "open" ? "success" : "neutral"}>
                {formatStatusLabel(job.status)}
              </Badge>
              <Badge variant="accent">{job.roleType}</Badge>
            </div>
            <p className="mt-5 max-w-3xl text-base leading-7 text-slate sm:text-lg">{job.description}</p>

            <div className="mt-8 grid gap-4 md:grid-cols-2">
              {[
                ["Job", job.event.title],
                ["Location", job.event.location],
                ["Date", formatDate(job.event.eventDate)],
                ["Hours", `${formatDateTime(job.shiftStart)} - ${formatDateTime(job.shiftEnd)}`],
                ["Rate", `${formatCurrency(job.payRate)}/hr`],
                ["Positions", String(job.positionsNeeded)],
                ["Estimated pay", `${formatCurrency(estimatedPay.total)} over ${estimatedPay.hours.toFixed(1)} hrs`],
                ["Minimum age", job.minimumAge ? `${job.minimumAge}+` : "Not specified"]
              ].map(([label, value]) => (
                <Card key={label} className="space-y-2">
                  <p className="text-sm font-medium text-slate">{label}</p>
                  <p className="text-lg font-semibold text-ink">{value}</p>
                </Card>
              ))}
            </div>
          </div>

          <div className="space-y-5">
            <Card>
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate">Company</p>
              <h2 className="mt-3 text-2xl font-semibold text-ink">{job.organization.name}</h2>
              <p className="mt-2 text-sm text-slate">Job context and event brief.</p>
              <p className="mt-4 text-sm text-slate">{job.applicationCount} deployment requests submitted</p>
              <div className="mt-5 rounded-[20px] border border-line/60 bg-surfaceRaised/50 px-4 py-4">
                <p className="text-sm font-semibold text-ink">Eligibility signals</p>
                <div className="mt-3 space-y-2 text-sm text-slate">
                  {eligibility.map((item) => (
                    <p key={item}>{item}</p>
                  ))}
                </div>
              </div>
            </Card>

            <Card>
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate">
                Submit deployment request
              </p>
              {session?.role === "staff" && boardItem?.hasApplied ? (
                <div className="mt-5 space-y-4">
                  <Badge variant={boardItem.applicationStatus === "accepted" ? "success" : "warning"}>
                    Application {boardItem.applicationStatus}
                  </Badge>
                  <p className="text-sm text-slate">
                    This role is already in your deployment request pipeline.
                  </p>
                  <div className="flex flex-col gap-3 sm:flex-row">
                    {boardItem.applicationStatus === "pending" && boardItem.applicationId ? (
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={async () => {
                          try {
                            await provider.withdrawApplication(boardItem.applicationId!);
                            toast.success("Deployment request withdrawn.");
                            await board.refresh();
                          } catch (error) {
                            toast.error(toDisplayError(error));
                          }
                        }}
                      >
                        Withdraw request
                      </Button>
                    ) : null}
                    <Button
                      type="button"
                      variant="secondary"
                      className="gap-2"
                      onClick={async () => {
                        try {
                          if (boardItem.isSaved) {
                            await provider.unsaveJob(job.id);
                            toast.success("Job removed from saved roles.");
                          } else {
                            await provider.saveJob(job.id);
                            toast.success("Job saved.");
                          }
                          await board.refresh();
                        } catch (error) {
                          toast.error(toDisplayError(error));
                        }
                      }}
                    >
                      <Heart className={cn("h-4 w-4", boardItem.isSaved ? "fill-current" : "")} />
                      {boardItem.isSaved ? "Saved" : "Save job"}
                    </Button>
                  </div>
                </div>
              ) : session?.role === "staff" ? (
                <form
                  className="mt-5 space-y-4"
                  onSubmit={async (event) => {
                    event.preventDefault();
                    try {
                      setSubmitting(true);
                      const payload = jobApplicationSchema.parse({
                        jobId: job.id,
                        coverNote
                      });
                      await provider.applyToJob(payload);
                      toast.success("Deployment request submitted.");
                      setCoverNote("");
                      await board.refresh();
                    } catch (error) {
                      toast.error(toDisplayError(error));
                    } finally {
                      setSubmitting(false);
                    }
                  }}
                >
                  <Field label="Operational note" hint="Keep it concise and relevant to the live environment.">
                    <Textarea
                      value={coverNote}
                      onChange={(event) => setCoverNote(event.target.value)}
                      placeholder="Summarise your fit for this job, venue type, or access environment."
                    />
                  </Field>
                  <Button type="submit" variant="accent" className="w-full sm:w-auto" disabled={submitting}>
                    {submitting ? "Submitting..." : "Submit request"}
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    className="ml-0 w-full gap-2 sm:ml-3 sm:w-auto"
                    onClick={async () => {
                      try {
                        if (boardItem?.isSaved) {
                          await provider.unsaveJob(job.id);
                          toast.success("Job removed from saved roles.");
                        } else {
                          await provider.saveJob(job.id);
                          toast.success("Job saved.");
                        }
                        await board.refresh();
                      } catch (error) {
                        toast.error(toDisplayError(error));
                      }
                    }}
                  >
                    <Heart className={cn("h-4 w-4", boardItem?.isSaved ? "fill-current" : "")} />
                    {boardItem?.isSaved ? "Saved" : "Save job"}
                  </Button>
                </form>
              ) : (
                <div className="mt-5 space-y-4">
                  <p className="text-sm text-slate">
                    Sign in as field team to apply and track job status.
                  </p>
                  <Link href="/auth/login">
                    <Button variant="accent" className="w-full sm:w-auto">
                      Platform access
                    </Button>
                  </Link>
                </div>
              )}
            </Card>
          </div>
        </PageContainer>
      </section>
      <SiteFooter />
    </main>
  );
}
