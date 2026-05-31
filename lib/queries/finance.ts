import { cache } from "react";
import { getAdminDataset } from "@/lib/queries/admin-dataset";

export const getAdminFinance = cache(async () => (await getAdminDataset()).finance);
