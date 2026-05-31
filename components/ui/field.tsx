export function Field({
  label,
  hint,
  children
}: {
  label: React.ReactNode;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block space-y-2">
      <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate">{label}</span>
      {children}
      {hint ? <span className="block text-xs text-slate/85">{hint}</span> : null}
    </label>
  );
}
