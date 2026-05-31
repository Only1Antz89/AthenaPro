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
import { ENTITY_LABELS } from "@/lib/brand";
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
      <section className="py-10 sm:py-12 md:py-16">
        <PageContainer>
          <div className="section-frame max-w-3xl pl-4 sm:pl-6">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate">
              {ENTITY_LABELS.staffDirectory}
            </p>
            <h1 className="text-balance mt-4 font-display text-4xl font-semibold tracking-[-0.05em] text-ink sm:text-5xl">
              Vetted field operators ranked by delivery quality, not guesswork.
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-slate sm:text-lg sm:leading-8">
              Reviews, consistency, and profile detail combine into a more useful deployment shortlist for
              live event operators.
            </p>
          </div>

          <Card className="mt-10">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <Field label="Search">
                <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Name or discipline" />
              </Field>
              <Field label="Availability">
                <Input value={availability} onChange={(event) => setAvailability(event.target.value)} placeholder="Immediate, weekends" />
              </Field>
              <Field label="Order">
                <Select value={sort} onChange={(event) => setSort(event.target.value)}>
                  <option value="ranking">Recommended order</option>
                  <option value="rating">Average rating</option>
                  <option value="reviews">Review volume</option>
                </Select>
              </Field>
            </div>
          </Card>

          <div className="mt-8 grid gap-4">
            {ranked.map((entry) => (
              <Card key={entry.staffId} className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex items-start gap-4">
                  <div className="rounded-full bg-accentSoft px-3 py-2 text-sm font-semibold text-mist">
                    #{entry.rank}
                  </div>
                  <Avatar name={entry.profile.fullName} size="lg" />
                  <div>
                    <div className="flex flex-wrap items-center gap-3">
                      <h2 className="text-lg font-semibold text-ink sm:text-xl">{entry.profile.fullName}</h2>
                      {entry.topBadge ? <Badge variant="accent">{entry.topBadge}</Badge> : null}
                    </div>
                    <p className="mt-2 text-sm text-slate">{entry.profile.bio}</p>
                    <p className="mt-3 text-sm text-slate">{entry.profile.skills.join(" • ")}</p>
                    <p className="mt-1 text-sm text-slate">{entry.profile.availability}</p>
                  </div>
                </div>
                <div className="space-y-2 lg:text-right">
                  <Stars value={entry.averageRating || 4.2} size="md" />
                  <p className="text-sm text-slate">{entry.reviewCount} delivery reviews</p>
                  <p className="text-xs font-medium uppercase tracking-[0.16em] text-slate">
                    Standing score {entry.weightedScore.toFixed(2)}
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
