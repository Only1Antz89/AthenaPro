import { cache } from "react";
import { getAdminDataset } from "@/lib/queries/admin-dataset";

export const getAdminAuditLog = cache(async () => (await getAdminDataset()).auditEntries);
