import { StaffDirectory } from "@/features/public/staff-directory";
import { getPublicRankedStaff } from "@/lib/services/staffbook-service";

export default async function StaffPage() {
  const staff = await getPublicRankedStaff();
  return <StaffDirectory initialStaff={staff} />;
}
