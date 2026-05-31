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
import type { AssignmentSummary, OperatorDetail } from "@/types/admin";

function groupAssignmentsByLabel(
  assignments: AssignmentSummary[],
  getLabel: (assignment: AssignmentSummary) => string
) {
  return Object.values(
    assignments.reduce<Record<string, { label: string; count: number; hours: number; value: number }>>(
      (accumulator, assignment) => {
        const label = getLabel(assignment);
        const current = accumulator[label] ?? {
          label,
          count: 0,
          hours: 0,
          value: 0
        };

        current.count += 1;
        current.hours += assignment.durationHours;
        current.value += assignment.totalPayAmount;
        accumulator[label] = current;
        return accumulator;
      },
      {}
    )
  ).sort((left, right) => right.count - left.count || right.value - left.value);
}

function groupAssignmentsByCompanyRole(assignments: AssignmentSummary[]) {
  return Object.values(
    assignments.reduce<
      Record<string, { companyName: string; roleType: string; count: number; hours: number; value: number }>
    >((accumulator, assignment) => {
      const key = `${assignment.clientName}:${assignment.roleType}`;
      const current = accumulator[key] ?? {
        companyName: assignment.clientName,
        roleType: assignment.roleType,
        count: 0,
        hours: 0,
        value: 0
      };

      current.count += 1;
      current.hours += assignment.durationHours;
      current.value += assignment.totalPayAmount;
      accumulator[key] = current;
      return accumulator;
    }, {})
  ).sort((left, right) => right.count - left.count || right.value - left.value);
}

export function OperatorDetailInsights({ operator }: { operator: OperatorDetail }) {
  const [eventTypeFilter, setEventTypeFilter] = useState("all");
  const eventTypeOptions = useMemo(
    () => [...new Set(operator.assignments.map((assignment) => assignment.eventType))].sort(),
    [operator.assignments]
  );

  const filteredAssignments = useMemo(
    () =>
      operator.assignments.filter((assignment) =>
        eventTypeFilter === "all" ? true : assignment.eventType === eventTypeFilter
      ),
    [eventTypeFilter, operator.assignments]
  );

  const now = Date.now();
  const historicalAssignments = filteredAssignments.filter(
    (assignment) => new Date(assignment.endsAt).getTime() < now
  );
  const futureAssignments = filteredAssignments.filter(
    (assignment) => new Date(assignment.startsAt).getTime() > now
  );

  const historicalEarnings = historicalAssignments.reduce(
    (sum, assignment) => sum + assignment.totalPayAmount,
    0
  );
  const projectedEarnings = futureAssignments.reduce(
    (sum, assignment) => sum + assignment.totalPayAmount,
    0
  );
  const futureBookedHours = futureAssignments.reduce(
    (sum, assignment) => sum + assignment.durationHours,
    0
  );

  const eventTypeMix = groupAssignmentsByLabel(operator.assignments, (assignment) => assignment.eventType);
  const roleMix = groupAssignmentsByLabel(operator.assignments, (assignment) => assignment.roleType);
  const companyRoleMix = groupAssignmentsByCompanyRole(operator.assignments);

  return (
    <div className="space-y-6">
      <Card className="rounded-[26px] p-5">
        <div className="grid gap-4 xl:grid-cols-[1fr_240px] xl:items-end">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate">
              Earnings and role intelligence
            </p>
            <h3 className="mt-2 font-display text-3xl font-semibold tracking-[-0.05em] text-ink">
              Earnings history, event-type fit, and role frequency
            </h3>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-slate">
              Filter this profile by event type to inspect historical earnings, projected income, and where this
              operator works most often.
            </p>
          </div>

          <Field label="Event type filter" hint={`${filteredAssignments.length} assignments in view`}>
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
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate">Historical earnings</p>
            <p className="mt-3 text-2xl font-semibold text-ink">{formatCurrency(historicalEarnings)}</p>
          </Card>
          <Card className="rounded-[22px] p-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate">Projected earnings</p>
            <p className="mt-3 text-2xl font-semibold text-ink">{formatCurrency(projectedEarnings)}</p>
          </Card>
          <Card className="rounded-[22px] p-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate">Future booked hours</p>
            <p className="mt-3 text-2xl font-semibold text-ink">{futureBookedHours.toFixed(1)} hrs</p>
          </Card>
          <Card className="rounded-[22px] p-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate">Most worked role</p>
            <p className="mt-3 text-lg font-semibold text-ink">{roleMix[0]?.label ?? "No history yet"}</p>
            <p className="mt-2 text-sm text-slate">{roleMix[0] ? `${roleMix[0].count} assignments` : "Awaiting work history"}</p>
          </Card>
        </div>
      </Card>

      <div className="grid gap-6 xl:grid-cols-2">
        <InsightCard
          title="Event types attended most"
          description="Where this operator shows up most often across completed and upcoming work."
        >
          <AdminDataTable
            columns={[
              { key: "eventType", label: "Event type" },
              { key: "count", label: "Assignments" },
              { key: "hours", label: "Hours" },
              { key: "earnings", label: "Earnings" }
            ]}
            rows={eventTypeMix.map((item) => ({
              id: item.label,
              cells: {
                eventType: item.label,
                count: item.count,
                hours: `${item.hours.toFixed(1)} hrs`,
                earnings: formatCurrency(item.value)
              }
            }))}
            emptyLabel="No event history for this operator."
          />
        </InsightCard>

        <InsightCard
          title="Roles worked most"
          description="Role repetition overall across the operator's accepted assignments."
        >
          <AdminDataTable
            columns={[
              { key: "role", label: "Role" },
              { key: "count", label: "Assignments" },
              { key: "hours", label: "Hours" },
              { key: "earnings", label: "Earnings" }
            ]}
            rows={roleMix.map((item) => ({
              id: item.label,
              cells: {
                role: item.label,
                count: item.count,
                hours: `${item.hours.toFixed(1)} hrs`,
                earnings: formatCurrency(item.value)
              }
            }))}
            emptyLabel="No role history for this operator."
          />
        </InsightCard>
      </div>

      <InsightCard
        title="Role frequency by company"
        description="Which role this operator has done most often for each client they have worked with."
      >
        <AdminDataTable
          columns={[
            { key: "company", label: "Client" },
            { key: "role", label: "Top role" },
            { key: "count", label: "Assignments" },
            { key: "hours", label: "Hours" },
            { key: "earnings", label: "Earnings" }
          ]}
          rows={companyRoleMix.map((item) => ({
            id: `${item.companyName}-${item.roleType}`,
            cells: {
              company: item.companyName,
              role: item.roleType,
              count: item.count,
              hours: `${item.hours.toFixed(1)} hrs`,
              earnings: formatCurrency(item.value)
            }
          }))}
          emptyLabel="No client-specific role history is available."
        />
      </InsightCard>

      <InsightCard
        title="Assignment history and projected income"
        description="Historical and future work for the selected event type filter."
      >
        <AdminDataTable
          columns={[
            { key: "event", label: "Event" },
            { key: "role", label: "Role" },
            { key: "status", label: "Status" },
            { key: "timing", label: "Timing" },
            { key: "earnings", label: "Potential / earned" }
          ]}
          rows={filteredAssignments.map((assignment) => ({
            id: assignment.id,
            cells: {
              event: (
                <div>
                  <p className="font-medium text-ink">{assignment.eventTitle}</p>
                  <p className="mt-1 text-xs uppercase tracking-[0.16em] text-slate">
                    {assignment.eventType} • {assignment.clientName}
                  </p>
                </div>
              ),
              role: assignment.roleType,
              status: <StatusBadge value={assignment.status} />,
              timing: `${formatDateTime(assignment.startsAt)} to ${formatDateTime(assignment.endsAt)}`,
              earnings: (
                <div>
                  <p className="text-ink">{formatCurrency(assignment.totalPayAmount)}</p>
                  <p className="mt-1 text-xs uppercase tracking-[0.16em] text-slate">
                    {assignment.durationHours.toFixed(1)} hrs at {formatCurrency(assignment.payRate)}/hr
                  </p>
                </div>
              )
            }
          }))}
          emptyLabel="No assignments match the current event type filter."
        />
      </InsightCard>

      <div className="grid gap-6 xl:grid-cols-[1fr_0.95fr]">
        <NotesPanel notes={operator.notes} />
        <AuditTimeline entries={operator.auditEntries} />
      </div>
    </div>
  );
}
