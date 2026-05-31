import Link from "next/link";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ExportButton({
  href,
  label
}: {
  href: string;
  label: string;
}) {
  return (
    <Link href={href}>
      <Button variant="secondary" className="gap-2">
        <Download className="h-4 w-4" />
        {label}
      </Button>
    </Link>
  );
}
