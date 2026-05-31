import { AdminDataTable } from "@/components/admin/data-table";
import { DetailHeader } from "@/components/admin/detail-header";
import { ExportButton } from "@/components/admin/export-button";
import { KpiGrid } from "@/components/admin/kpi-grid";
import { StatusBadge } from "@/components/admin/status-badge";
import { getAdminFinance } from "@/lib/queries/finance";
import { formatCurrency, formatDate } from "@/lib/utils";

export default async function FinancePage() {
  const finance = await getAdminFinance();

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <DetailHeader
          eyebrow="Finance"
          title="Billed, collected, outstanding, and top-revenue client performance"
          description="Phase 1 finance focuses on visibility, exportability, and payment reminder context rather than full accounting replacement."
        />
        <ExportButton href="/api/admin/finance" label="Export finance data" />
      </div>

      <KpiGrid
        items={[
          { label: "Total billed", value: formatCurrency(finance.totalBilled), hint: "Gross invoiced volume across tracked client accounts.", trend: 11 },
          { label: "Collected", value: formatCurrency(finance.totalCollected), hint: "Payments successfully recorded against client invoices.", trend: 7 },
          { label: "Outstanding", value: formatCurrency(finance.totalOutstanding), hint: "Open balance requiring finance follow-up or reminders.", trend: -3 },
          { label: "Monthly revenue", value: formatCurrency(finance.monthlyRevenue), hint: "Current month revenue projection from assignment activity.", trend: 9 }
        ]}
      />

      <AdminDataTable
        columns={[
          { key: "invoice", label: "Invoice" },
          { key: "status", label: "Status" },
          { key: "due", label: "Due date" },
          { key: "amount", label: "Amount" },
          { key: "balance", label: "Balance" }
        ]}
        rows={finance.outstandingInvoices.map((invoice) => ({
          id: invoice.invoiceId,
          cells: {
            invoice: invoice.invoiceNumber,
            status: <StatusBadge value={invoice.status} />,
            due: formatDate(invoice.dueDate),
            amount: formatCurrency(invoice.totalAmount),
            balance: formatCurrency(invoice.balance)
          }
        }))}
      />

      <AdminDataTable
        columns={[
          { key: "client", label: "Top spend client" },
          { key: "spend", label: "Lifetime spend" }
        ]}
        rows={finance.topRevenueClients.map((client) => ({
          id: client.clientId,
          cells: {
            client: client.companyName,
            spend: formatCurrency(client.totalSpend)
          }
        }))}
      />
    </div>
  );
}
