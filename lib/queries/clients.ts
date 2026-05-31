import { cache } from "react";
import { getAdminDataset } from "@/lib/queries/admin-dataset";

export const getAdminClients = cache(async () => (await getAdminDataset()).clients);

export async function getAdminClientById(clientId: string) {
  const data = await getAdminDataset();
  return data.clientDetails[clientId] ?? null;
}
