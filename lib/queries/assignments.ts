import { cache } from "react";
import { getAdminDataset } from "@/lib/queries/admin-dataset";

export const getAdminAssignments = cache(async () => (await getAdminDataset()).assignments);

export async function getAdminAssignmentById(assignmentId: string) {
  const data = await getAdminDataset();
  return data.assignmentDetails[assignmentId] ?? null;
}
