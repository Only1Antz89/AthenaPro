import { cache } from "react";
import { getAdminDataset } from "@/lib/queries/admin-dataset";

export const getAdminOperators = cache(async () => (await getAdminDataset()).operators);

export async function getAdminOperatorById(operatorId: string) {
  const data = await getAdminDataset();
  return data.operatorDetails[operatorId] ?? null;
}
