import { getProjectIdsForUser } from "../../_shared/projectDao.ts";
import { StatsParams } from "./params.ts";

// Handler: Interactions over time
export async function handleInteractionsOverTime(supabase: any, userId: string, params: StatsParams) {
  const projectIds = await getProjectIdsForUser(supabase, userId, params.accountId, params.projectId);

  if (projectIds.length === 0) {
    return { timeline: [] };
  }

  // Determine grouping granularity based on time range
  const startDate = new Date(params.startDate);
  const endDate = new Date(params.endDate);
  const hoursDiff = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60);
  const isHourly = hoursDiff <= 48; // Use hourly grouping for <= 48 hours

  // Use SQL aggregation to avoid hitting query limits
  const { data: aggregatedData, error } = await supabase.rpc('get_interactions_over_time_aggregated', {
    p_project_ids: projectIds,
    p_start_date: params.startDate,
    p_end_date: params.endDate,
    p_group_by: isHourly ? 'hour' : 'day'
  });

  if (error) {
    throw new Error(`Failed to fetch interactions: ${error.message}`);
  }

  return {
    timeline: aggregatedData || [],
  };
}