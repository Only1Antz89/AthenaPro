import { cn } from "@/lib/utils";

export interface AdminTableColumn {
  key: string;
  label: string;
  className?: string;
}

export interface AdminTableRow {
  id: string;
  cells: Record<string, React.ReactNode>;
  href?: string;
}

export function AdminDataTable({
  columns,
  rows,
  emptyLabel
}: {
  columns: AdminTableColumn[];
  rows: AdminTableRow[];
  emptyLabel?: string;
}) {
  return (
    <div className="overflow-hidden rounded-[28px] border border-white/8">
      {rows.length > 0 ? (
        <div className="divide-y divide-white/8 md:hidden">
          {rows.map((row) => (
            <div key={row.id} className="bg-white/[0.015] p-4">
              <div className="space-y-3">
                {columns.map((column) => (
                  <div key={column.key} className="space-y-1">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate">
                      {column.label}
                    </p>
                    <div className="text-sm text-ink">{row.cells[column.key]}</div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="px-4 py-10 text-center text-sm text-slate md:hidden">
          {emptyLabel ?? "No rows available."}
        </div>
      )}

      <div className="hidden overflow-x-auto md:block">
        <table className="min-w-full border-collapse">
          <thead className="bg-white/[0.03]">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  className={cn(
                    "px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.18em] text-slate",
                    column.className
                  )}
                >
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length > 0 ? (
              rows.map((row) => (
                <tr key={row.id} className="border-t border-white/8 bg-white/[0.015] align-top">
                  {columns.map((column) => (
                    <td key={column.key} className="px-4 py-3 text-sm text-ink">
                      {row.cells[column.key]}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td
                  className="px-4 py-10 text-center text-sm text-slate"
                  colSpan={Math.max(columns.length, 1)}
                >
                  {emptyLabel ?? "No rows available."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
