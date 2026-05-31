import { AdminDataTable } from "@/components/admin/data-table";
import { DetailHeader } from "@/components/admin/detail-header";
import { StatusBadge } from "@/components/admin/status-badge";
import { getAdminOnboarding } from "@/lib/queries/onboarding";
import { formatDateTime } from "@/lib/utils";

export default async function OnboardingPage() {
  const onboarding = await getAdminOnboarding();
  const clients = onboarding.filter((item) => item.entityType === "client");
  const operators = onboarding.filter((item) => item.entityType === "operator");

  return (
    <div className="space-y-6">
      <DetailHeader
        eyebrow="Manual onboarding"
        title="Pending client and operator setup work"
        description="Manual creation flows, checklist completion, and compliance review live here so the operations team can move both sides of the marketplace forward."
      />

      <div className="grid gap-6 xl:grid-cols-2">
        <AdminDataTable
          columns={[
            { key: "entity", label: "Pending client onboarding" },
            { key: "status", label: "Status" },
            { key: "owner", label: "Owner" },
            { key: "updated", label: "Updated" }
          ]}
          rows={clients.map((item) => ({
            id: item.id,
            cells: {
              entity: item.entityName,
              status: <StatusBadge value={item.status} />,
              owner: item.owner,
              updated: formatDateTime(item.updatedAt)
            }
          }))}
        />

        <AdminDataTable
          columns={[
            { key: "entity", label: "Pending operator onboarding" },
            { key: "status", label: "Status" },
            { key: "owner", label: "Owner" },
            { key: "updated", label: "Updated" }
          ]}
          rows={operators.map((item) => ({
            id: item.id,
            cells: {
              entity: item.entityName,
              status: <StatusBadge value={item.status} />,
              owner: item.owner,
              updated: formatDateTime(item.updatedAt)
            }
          }))}
        />
      </div>
    </div>
  );
}
