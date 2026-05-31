"use client";

import { useMemo, useState } from "react";
import { AdminDataTable } from "@/components/admin/data-table";
import { AuditTimeline } from "@/components/admin/audit-timeline";
import { InsightCard } from "@/components/admin/insight-card";
import { NotesPanel } from "@/components/admin/notes-panel";
import { StatusBadge } from "@/components/admin/status-badge";
import { Card } from "@/components/ui/card";
import { Field } from "@/components/ui/field";
import { Select } from "@/components/ui/select";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import type { AssignmentSummary, ClientDetail } from "@/types/admin";

type ClientEventSummary = {
  eventId: string;
  eventTitle: string;
  eventType: string;
  startsAt: string;
  endsAt: string;
  status: "historical" | "future" | "live";
  roleCount: number;
  headcount: number;
  crewHours: number;
  labourCost: number;
  techRentalCost: number;
  athenaServiceCharge: number;
  totalCost: number;
  techRentalItems: string[];
  assignments: AssignmentSummary[];
};

function summarizeClientEvents(assignments: AssignmentSummary[]) {
  return Object.values(
    assignments.reduce<Record<string, ClientEventSummary>>((accumulator, assignment) => {
      const now = Date.now();
      const current = accumulator[assignment.eventId] ?? {
        eventId: assignment.eventId,
        eventTitle: assignment.eventTitle,
        eventType: assignment.eventType,
        startsAt: assignment.startsAt,
        endsAt: assignment.endsAt,
        status:
          new Date(assignment.endsAt).getTime() < now
            ? "historical"
            : new Date(assignment.startsAt).getTime() > now
              ? "future"
              : "live",
        roleCount: 0,
        headcount: 0,
        crewHours: 0,
        labourCost: 0,
        techRentalCost: 0,
        athenaServiceCharge: 0,
        totalCost: 0,
        techRentalItems: [],
        assignments: []
      };

      current.startsAt =
        new Date(assignment.startsAt).getTime() < new Date(current.startsAt).getTime()
          ? assignment.startsAt
          : current.startsAt;
      current.endsAt =
        new Date(assignment.endsAt).getTime() > new Date(current.endsAt).getTime()
          ? assignment.endsAt
          : current.endsAt;
      current.roleCount += 1;
      current.headcount += assignment.requiredHeadcount;
      current.crewHours += assignment.durationHours * assignment.requiredHeadcount;
      current.labourCost += assignment.labourCost;
      current.techRentalCost += assignment.techRentalCost;
      current.athenaServiceCharge += assignment.athenaServiceCharge;
      current.totalCost += assignment.totalChargeAmount;
      current.techRentalItems = [...new Set([...current.techRentalItems, ...assignment.techRentalItems])];
      current.assignments.push(assignment);
      accumulator[assignment.eventId] = current;
      return accumulator;
    }, {})
  ).sort((left, right) => new Date(right.startsAt).getTime() - new Date(left.startsAt).getTime());
}

export function ClientDetailInsights({ client }: { client: ClientDetail }) {
  const [eventTypeFilter, setEventTypeFilter] = useState("all");
  const eventTypeOptions = useMemo(
    () => [...new Set(client.assignments.map((assignment) => assignment.eventType))].sort(),
    [client.assignments]
  );

  const filteredAssignments = useMemo(
    () =>
      client.assignments.filter((assignment) =>
        eventTypeFilter === "all" ? true : assignment.eventType === eventTypeFilter
      ),
    [client.assignments, eventTypeFilter]
  );

  const eventSummaries = useMemo(() => summarizeClientEvents(filteredAssignments), [filteredAssignments]);
  const historicalEvents = eventSummaries.filter((event) => event.status === "historical");
  const futureEvents = eventSummaries.filter((event) => event.status === "future" || event.status === "live");
  const recentEvent =
    [...eventSummaries].sort(
      (left, right) =>
        Math.abs(new Date(left.startsAt).getTime() - Date.now()) -
        Math.abs(new Date(right.startsAt).getTime() - Date.now())
    )[0] ?? null;

  const historicalSpend = historicalEvents.reduce((sum, event) => sum + event.totalCost, 0);
  const futureCommittedSpend = futureEvents.reduce((sum, event) => sum + event.totalCost, 0);
  const futureCrewHours = futureEvents.reduce((sum, event) => sum + event.crewHours, 0);

  return (
    <div className="space-y-6">
      <Card className="rounded-[26px] p-5">
        <div className="grid gap-4 xl:grid-cols-[1fr_240px] xl:items-end">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate">
              Commercial event breakdown
            </p>
            <h3 className="mt-2 font-display text-3xl font-semibold tracking-[-0.05em] text-ink">
              Cost forecasting, recent event detail, and event history
            </h3>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-slate">
              Filter this client by event type to inspect historical spend, future committed cost, and the breakdown
              behind the most recent event on record.
            </p>
          </div>

          <Field label="Event type filter" hint={`${eventSummaries.length} events in view`}>
            <Select value={eventTypeFilter} onChange={(event) => setEventTypeFilter(event.target.value)}>
              <option value="all">All event types</option>
              {eventTypeOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </Select>
          </Field>
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Card className="rounded-[22px] p-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate">Historical spend</p>
            <p className="mt-3 text-2xl font-semibold text-ink">{formatCurrency(historicalSpend)}</p>
          </Card>
          <Card className="rounded-[22px] p-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate">Future committed cost</p>
            <p className="mt-3 text-2xl font-semibold text-ink">{formatCurrency(futureCommittedSpend)}</p>
          </Card>
          <Card className="rounded-[22px] p-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate">Future crew hours</p>
            <p className="mt-3 text-2xl font-semibold text-ink">{futureCrewHours.toFixed(1)} hrs</p>
          </Card>
          <Card className="rounded-[22px] p-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate">Recent event</p>
            <p className="mt-3 text-lg font-semibold text-ink">{recentEvent?.eventTitle ?? "No events yet"}</p>
            <p className="mt-2 text-sm text-slate">{recentEvent?.eventType ?? "Awaiting first event"}</p>
          </Card>
        </div>
      </Card>

      <InsightCard
        title="Recent event cost breakdown"
        description="Nearest event to the current date with labour, tech, service-charge, and total-cost visibility."
      >
        {recentEvent ? (
          <div className="space-y-5">
            <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
              <div>
                <p className="font-display text-3xl font-semibold tracking-[-0.05em] text-ink">
                  {recentEvent.eventTitle}
                </p>
                <p className="mt-2 text-sm text-slate">
                  {recentEvent.eventType} • {formatDateTime(recentEvent.startsAt)} to {formatDateTime(recentEvent.endsAt)}
                </p>
              </div>
              <StatusBadge value={recentEvent.status} />
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
              <Card className="rounded-[22px] p-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate">Talent needed</p>
                <p className="mt-3 text-2xl font-semibold text-ink">{recentEvent.headcount}</p>
              </Card>
              <Card className="rounded-[22px] p-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate">Crew hours</p>
                <p className="mt-3 text-2xl font-semibold text-ink">{recentEvent.crewHours.toFixed(1)} hrs</p>
              </Card>
              <Card className="rounded-[22px] p-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate">Labour cost</p>
                <p className="mt-3 text-2xl font-semibold text-ink">{formatCurrency(recentEvent.labourCost)}</p>
              </Card>
              <Card className="rounded-[22px] p-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate">Tech rented</p>
                <p className="mt-3 text-2xl font-semibold text-ink">{formatCurrency(recentEvent.techRentalCost)}</p>
              </Card>
              <Card className="rounded-[22px] p-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate">Athena total</p>
                <p className="mt-3 text-2xl font-semibold text-ink">{formatCurrency(recentEvent.totalCost)}</p>
              </Card>
            </div>

            <AdminDataTable
              columns={[
                { key: "role", label: "Job / role" },
                { key: "need", label: "People needed" },
                { key: "timing", label: "How long for" },
                { key: "tech", label: "Tech rented" },
                { key: "service", label: "Service charge" },
                { key: "total", label: "Total cost" }
              ]}
              rows={recentEvent.assignments.map((assignment) => ({
                id: assignment.id,
                cells: {
                  role: (
                    <div>
                      <p className="font-medium text-ink">{assignment.roleType}</p>
                      <p className="mt-1 text-xs uppercase tracking-[0.16em] text-slate">{assignment.title}</p>
                    </div>
                  ),
                  need: assignment.requiredHeadcount,
                  timing: `${assignment.durationHours.toFixed(1)} hrs`,
                  tech: assignment.techRentalItems.join(", "),
                  service: formatCurrency(assignment.athenaServiceCharge),
                  total: formatCurrency(assignment.totalChargeAmount)
                }
              }))}
            />
          </div>
        ) : (
          <p className="text-sm text-slate">No event breakdown is available for this client yet.</p>
        )}
      </InsightCard>

      <div className="grid gap-6 xl:grid-cols-2">
        <InsightCard
          title="Future events"
          description="Upcoming client events with required headcount, booked hours, and projected cost."
        >
          <AdminDataTable
            columns={[
              { key: "event", label: "Event" },
              { key: "timing", label: "Timing" },
              { key: "need", label: "People needed" },
              { key: "cost", label: "Projected cost" }
            ]}
            rows={futureEvents.map((event) => ({
              id: event.eventId,
              cells: {
                event: (
                  <div>
                    <p className="font-medium text-ink">{event.eventTitle}</p>
                    <p className="mt-1 text-xs uppercase tracking-[0.16em] text-slate">{event.eventType}</p>
                  </div>
                ),
                timing: `${formatDateTime(event.startsAt)} to ${formatDateTime(event.endsAt)}`,
                need: `${event.headcount} people • ${event.crewHours.toFixed(1)} crew hrs`,
                cost: formatCurrency(event.totalCost)
              }
            }))}
            emptyLabel="No future events match the current filter."
          />
        </InsightCard>

        <InsightCard
          title="Historical events"
          description="Past client events showing where spend has already landed."
        >
          <AdminDataTable
            columns={[
              { key: "event", label: "Event" },
              { key: "timing", label: "Timing" },
              { key: "cost", label: "Historical cost" },
              { key: "service", label: "Athena service charge" }
            ]}
            rows={historicalEvents.map((event) => ({
              id: event.eventId,
              cells: {
                event: (
                  <div>
                    <p className="font-medium text-ink">{event.eventTitle}</p>
                    <p className="mt-1 text-xs uppercase tracking-[0.16em] text-slate">{event.eventType}</p>
                  </div>
                ),
                timing: `${formatDateTime(event.startsAt)} to ${formatDateTime(event.endsAt)}`,
                cost: formatCurrency(event.totalCost),
                service: formatCurrency(event.athenaServiceCharge)
              }
            }))}
            emptyLabel="No historical events match the current filter."
          />
        </InsightCard>
      </div>

      <InsightCard
        title="Job cost lines"
        description="Assignment-level commercial breakdown across the selected event type."
      >
        <AdminDataTable
          columns={[
            { key: "event", label: "Event" },
            { key: "role", label: "Role" },
            { key: "need", label: "People needed" },
            { key: "duration", label: "How long for" },
            { key: "tech", label: "Tech rented" },
            { key: "breakdown", label: "Cost breakdown" }
          ]}
          rows={filteredAssignments.map((assignment) => ({
            id: assignment.id,
            cells: {
              event: (
                <div>
                  <p className="font-medium text-ink">{assignment.eventTitle}</p>
                  <p className="mt-1 text-xs uppercase tracking-[0.16em] text-slate">{assignment.eventType}</p>
                </div>
              ),
              role: assignment.roleType,
              need: assignment.requiredHeadcount,
              duration: `${assignment.durationHours.toFixed(1)} hrs`,
              tech: assignment.techRentalItems.join(", "),
              breakdown: (
                <div className="space-y-1">
                  <p className="text-ink">Labour {formatCurrency(assignment.labourCost)}</p>
                  <p className="text-slate">Tech {formatCurrency(assignment.techRentalCost)}</p>
                  <p className="text-slate">Athena fee {formatCurrency(assignment.athenaServiceCharge)}</p>
                  <p className="font-medium text-ink">Total {formatCurrency(assignment.totalChargeAmount)}</p>
                </div>
              )
            }
          }))}
          emptyLabel="No job cost lines match the current event type filter."
        />
      </InsightCard>

      <div className="grid gap-6 xl:grid-cols-[1fr_0.95fr]">
        <NotesPanel notes={client.notes} />
        <AuditTimeline entries={client.auditEntries} />
      </div>
    </div>
  );
}
