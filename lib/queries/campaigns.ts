import {
  getAdminCampaignByIdLiveAware,
  getAdminCampaignsLiveAware,
  getAdminEmailDeliveries,
  getAdminEmailTemplates
} from "@/lib/services/admin-communications";

export const getAdminCampaigns = getAdminCampaignsLiveAware;

export async function getAdminCampaignById(campaignId: string) {
  return getAdminCampaignByIdLiveAware(campaignId);
}

export { getAdminEmailTemplates, getAdminEmailDeliveries };
