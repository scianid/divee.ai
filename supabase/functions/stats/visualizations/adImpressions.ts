import { getProjectIdsForUser } from "../../_shared/projectDao.ts";
import { StatsParams, QUERY_LIMIT } from "./params.ts";

// Handler: Ad impressions (event_type = 'ad_impression')
export async function handleAdImpressions(supabase: any, userId: string, params: StatsParams) {

  const projectIds = await getProjectIdsForUser(supabase, userId, params.accountId, params.projectId);

  if (projectIds.length === 0)
    return { total: 0, timeline: [] };

  // Determine grouping granularity based on time range
  const startDate = new Date(params.startDate);
  const endDate = new Date(params.endDate);
  const hoursDiff = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60);
  const isHourly = hoursDiff <= 48; // Use hourly grouping for <= 48 hours

  // Use SQL aggregation to avoid hitting query limits
  const { data: aggregatedData, error: aggError } = await supabase.rpc('get_ad_impressions_aggregated', {
    p_project_ids: projectIds,
    p_start_date: params.startDate,
    p_end_date: params.endDate,
    p_group_by: isHourly ? 'hour' : 'day'
  });

  if (aggError) {
    throw new Error(`Failed to fetch ad impressions: ${aggError.message}`);
  }

  // Use aggregated results from RPC
  return {
    total: aggregatedData?.reduce((sum: number, item: any) => sum + item.count, 0) || 0,
    timeline: aggregatedData || [],
  };
}
