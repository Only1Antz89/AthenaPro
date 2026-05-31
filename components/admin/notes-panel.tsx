import { Card } from "@/components/ui/card";

export function NotesPanel({
  title = "Internal notes",
  notes
}: {
  title?: string;
  notes: string[];
}) {
  return (
    <Card className="rounded-[26px] p-5">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate">{title}</p>
      <div className="mt-4 space-y-3">
        {notes.map((note) => (
          <div key={note} className="rounded-[20px] bg-white/[0.03] px-4 py-3 text-sm leading-6 text-slate">
            {note}
          </div>
        ))}
      </div>
    </Card>
  );
}
