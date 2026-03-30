"use client";

import { useMemo, useState } from "react";
import { PageContainer } from "@/components/layout/page-container";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Stars } from "@/components/ui/stars";
import type { RankedStaffRow } from "@/types/domain";

export function StaffDirectory({ initialStaff }: { initialStaff: RankedStaffRow[] }) {
  const [query, setQuery] = useState("");
  const [availability, setAvailability] = useState("");
  const [sort, setSort] = useState("ranking");

  const ranked = useMemo(() => {
    return [...initialStaff]
      .filter((entry) => {
        return (
          (!query ||
            entry.profile.fullName.toLowerCase().includes(query.toLowerCase()) ||
            entry.profile.skills.join(" ").toLowerCase().includes(query.toLowerCase())) &&
          (!availability ||
            entry.profile.availability?.toLowerCase().includes(availability.toLowerCase()))
        );
      })
      .sort((left, right) => {
        if (sort === "rating") {
          return right.averageRating - left.averageRating;
        }
        if (sort === "reviews") {
          return right.reviewCount - left.reviewCount;
        }
        return left.rank - right.rank;
      });
  }, [availability, initialStaff, query, sort]);

  return (
    <main>
      <SiteHeader />
      <section className="py-12">
        <PageContainer>
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-accent">Ranked staff</p>
            <h1 className="mt-4 font-display text-5xl font-semibold text-ink">Weighted rankings that reward consistency, not lucky one-offs</h1>
            <p className="mt-4 text-lg text-slate">
              Review count and quality combine into a ranking score that keeps the directory credible for organisers.
            </p>
          </div>

          <Card className="mt-8">
            <div className="grid gap-4 md:grid-cols-3">
              <Field label="Search">
                <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Name or skill" />
              </Field>
              <Field label="Availability">
                <Input value={availability} onChange={(event) => setAvailability(event.target.value)} placeholder="Weekends, flexible" />
              </Field>
              <Field label="Sort by">
                <Select value={sort} onChange={(event) => setSort(event.target.value)}>
                  <option value="ranking">Weighted ranking</option>
                  <option value="rating">Average rating</option>
                  <option value="reviews">Review count</option>
                </Select>
              </Field>
            </div>
          </Card>

          <div className="mt-8 grid gap-4">
            {ranked.map((entry) => (
              <Card key={entry.staffId} className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex items-start gap-4">
                  <div className="rounded-full bg-accentSoft px-3 py-2 text-sm font-semibold text-accent">
                    #{entry.rank}
                  </div>
                  <Avatar name={entry.profile.fullName} size="lg" />
                  <div>
                    <div className="flex flex-wrap items-center gap-3">
                      <h2 className="text-xl font-semibold text-ink">{entry.profile.fullName}</h2>
                      {entry.topBadge ? <Badge variant="accent">{entry.topBadge}</Badge> : null}
                    </div>
                    <p className="mt-2 text-sm text-slate">{entry.profile.bio}</p>
                    <p className="mt-3 text-sm text-slate">{entry.profile.skills.join(" • ")}</p>
                    <p className="mt-1 text-sm text-slate">{entry.profile.availability}</p>
                  </div>
                </div>
                <div className="space-y-2 lg:text-right">
                  <Stars value={entry.averageRating || 4.2} size="md" />
                  <p className="text-sm text-slate">{entry.reviewCount} reviews</p>
                  <p className="text-xs font-medium uppercase tracking-[0.16em] text-slate">
                    Weighted score {entry.weightedScore.toFixed(2)}
                  </p>
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
