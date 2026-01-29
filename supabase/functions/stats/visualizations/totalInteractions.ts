import { getProjectIdsForUser } from "../../_shared/projectDao.ts";
import { StatsParams } from "./params.ts";

// Handler: Total interactions
export async function handleTotalInteractions(supabase: any, userId: string, params: StatsParams) {

  const projectIds = await getProjectIdsForUser(supabase, userId, params.accountId, params.projectId);

  if (projectIds.length === 0)
    return { total: 0, breakdown: [] };

  // Use SQL aggregation to avoid hitting query limits
  const { data: aggregatedData, error } = await supabase.rpc('get_total_interactions_aggregated', {
    p_project_ids: projectIds,
    p_start_date: params.startDate,
    p_end_date: params.endDate
  });

  if (error) {
    throw new Error(`Failed to fetch events: ${error.message}`);
  }

  // Calculate total from aggregated counts
  const total = aggregatedData?.reduce((sum: number, item: any) => sum + Number(item.count), 0) || 0;

  return {
    total,
    breakdown: aggregatedData?.map((item: any) => ({
      type: item.event_type || "unknown",
      count: Number(item.count),
    })) || [],
  };
}
