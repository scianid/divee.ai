import { getProjectIdsForUser } from "../../_shared/projectDao.ts";
import { StatsParams } from "./params.ts";

// Handler: Impressions by platform
export async function handleImpressionsByPlatform(supabase: any, userId: string, params: StatsParams) {
  const projectIds = await getProjectIdsForUser(supabase, userId, params.accountId, params.projectId);

  if (projectIds.length === 0) {
    return { platforms: [] };
  }

  // Use SQL aggregation to avoid hitting query limits
  const { data: aggregatedData, error } = await supabase.rpc('get_impressions_by_platform_aggregated', {
    p_project_ids: projectIds,
    p_start_date: params.startDate,
    p_end_date: params.endDate
  });

  if (error) {
    throw new Error(`Failed to fetch impressions: ${error.message}`);
  }

  return {
    platforms: aggregatedData?.map((item: any) => ({
      platform: item.platform,
      count: Number(item.count),
    })) || [],
  };
}