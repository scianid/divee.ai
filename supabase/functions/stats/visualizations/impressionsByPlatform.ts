import { getProjectIdsForUser } from "../../_shared/projectDao.ts";
import { StatsParams } from "./params.ts";

// Handler: Impressions by platform
export async function handleImpressionsByPlatform(supabase: any, userId: string, params: StatsParams) {
  const projectIds = await getProjectIdsForUser(supabase, userId, params.accountId, params.projectId);

  if (projectIds.length === 0) {
    return { platforms: [] };
  }

  const { data: impressions, error } = await supabase
    .from("analytics_impressions")
    .select("platform")
    .in("project_id", projectIds)
    .gte("created_at", params.startDate)
    .lte("created_at", params.endDate);

  if (error) {
    throw new Error(`Failed to fetch impressions: ${error.message}`);
  }

  const platformCounts = impressions?.reduce((acc: any, imp: any) => {
    const platform = imp.platform || "Unknown";
    acc[platform] = (acc[platform] || 0) + 1;
    return acc;
  }, {});

  return {
    platforms: Object.entries(platformCounts || {}).map(([platform, count]) => ({
      platform,
      count,
    })),
  };
}