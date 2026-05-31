import { cache } from "react";
import { getAdminDataset } from "@/lib/queries/admin-dataset";

export const getAdminDashboardData = cache(async () => (await getAdminDataset()).dashboard);
