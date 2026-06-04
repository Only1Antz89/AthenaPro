import { Suspense } from "react";
import { OperatorProfileWorkspace } from "@/features/staff/operator-profile-workspace";
import { LoadingPanel } from "@/components/ui/loading-panel";

export default function StaffProfilePage() {
  return (
    <Suspense fallback={<LoadingPanel />}>
      <OperatorProfileWorkspace />
    </Suspense>
  );
}
