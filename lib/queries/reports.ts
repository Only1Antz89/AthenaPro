import { cache } from "react";
import { getAdminDataset } from "@/lib/queries/admin-dataset";

export const getAdminExportJobs = cache(async () => (await getAdminDataset()).exports);
