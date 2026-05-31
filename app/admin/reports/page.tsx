import { AdminDataTable } from "@/components/admin/data-table";
import { DetailHeader } from "@/components/admin/detail-header";
import { ExportButton } from "@/components/admin/export-button";
import { StatusBadge } from "@/components/admin/status-badge";
import { getAdminExportJobs } from "@/lib/queries/reports";
import { formatDateTime } from "@/lib/utils";

export default async function ReportsPage() {
  const exports = await getAdminExportJobs();

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <DetailHeader
          eyebrow="Reports and exports"
          title="Create export jobs and track completion"
          description="Large datasets should be generated safely on the server and either streamed or stored temporarily in Supabase Storage."
        />
        <ExportButton href="/api/admin/exports" label="View export jobs" />
      </div>

      <AdminDataTable
        columns={[
          { key: "type", label: "Export type" },
          { key: "format", label: "Format" },
          { key: "status", label: "Status" },
          { key: "requested", label: "Requested" }
        ]}
        rows={exports.map((job) => ({
          id: job.id,
          cells: {
            type: job.exportType,
            format: job.format.toUpperCase(),
            status: <StatusBadge value={job.status} />,
            requested: `${job.requestedBy} • ${formatDateTime(job.createdAt)}`
          }
        }))}
      />
    </div>
  );
}
