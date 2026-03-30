"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { PageContainer } from "@/components/layout/page-container";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { EnrichedJob } from "@/types/domain";

export function JobsBrowser({ initialJobs }: { initialJobs: EnrichedJob[] }) {
  const [query, setQuery] = useState("");
  const [location, setLocation] = useState("");
  const [roleType, setRoleType] = useState("");
  const [minimumPay, setMinimumPay] = useState("");

  const jobs = useMemo(
    () =>
      initialJobs.filter((job) => {
        return (
          (!query ||
            job.title.toLowerCase().includes(query.toLowerCase()) ||
            job.event.title.toLowerCase().includes(query.toLowerCase())) &&
          (!location || job.event.location.toLowerCase().includes(location.toLowerCase())) &&
          (!roleType || job.roleType.toLowerCase().includes(roleType.toLowerCase())) &&
          (!minimumPay || job.payRate >= Number(minimumPay))
        );
      }),
    [initialJobs, location, minimumPay, query, roleType]
  );

  return (
    <main>
      <SiteHeader />
      <section className="py-12">
        <PageContainer>
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-accent">Browse jobs</p>
            <h1 className="mt-4 font-display text-5xl font-semibold text-ink">Open event roles with clear shift detail</h1>
            <p className="mt-4 text-lg text-slate">
              Filter by location, role type, and pay to find believable demo roles or real live listings.
            </p>
          </div>

          <Card className="mt-8">
            <div className="grid gap-4 md:grid-cols-4">
              <Field label="Search">
                <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="VIP host, merch, registration" />
              </Field>
              <Field label="Location">
                <Input value={location} onChange={(event) => setLocation(event.target.value)} placeholder="London, Brighton" />
              </Field>
              <Field label="Role type">
                <Input value={roleType} onChange={(event) => setRoleType(event.target.value)} placeholder="Bartender, Host" />
              </Field>
              <Field label="Minimum pay">
                <Input value={minimumPay} onChange={(event) => setMinimumPay(event.target.value)} type="number" min={0} placeholder="14" />
              </Field>
            </div>
          </Card>

          <div className="mt-8 grid gap-4">
            {jobs.map((job) => (
              <Card key={job.id} className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-center">
                <div>
                  <div className="flex flex-wrap items-center gap-3">
                    <h2 className="text-2xl font-semibold text-ink">{job.title}</h2>
                    <Badge variant="accent">{job.roleType}</Badge>
                    <Badge variant="neutral">{job.event.location}</Badge>
                  </div>
                  <p className="mt-2 text-base text-slate">{job.description}</p>
                  <div className="mt-4 flex flex-wrap gap-4 text-sm text-slate">
                    <span>{job.organization.name}</span>
                    <span>{job.event.title}</span>
                    <span>{formatDate(job.event.eventDate)}</span>
                    <span>{formatCurrency(job.payRate)}/hr</span>
                    <span>{job.positionsNeeded} positions</span>
                  </div>
                </div>
                <div className="flex flex-col items-start gap-3 lg:items-end">
                  <p className="text-sm text-slate">{job.applicationCount} applications so far</p>
                  <Link href={`/jobs/${job.id}`}>
                    <Button>View role</Button>
                  </Link>
                </div>
              </Card>
            ))}
          </div>
        </PageContainer>
      </section>
      <SiteFooter />
    </main>
  );
}
