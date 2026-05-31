import { cache } from "react";
import { getAdminDataset } from "@/lib/queries/admin-dataset";

export const getAdminOnboarding = cache(async () => (await getAdminDataset()).onboarding);
