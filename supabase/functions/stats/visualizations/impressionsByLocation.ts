import { getProjectIdsForUser } from "../../_shared/projectDao.ts";
import { StatsParams } from "./params.ts";

// Handler: Impressions by location
export async function handleImpressionsByLocation(supabase: any, userId: string, params: StatsParams) {
  const projectIds = await getProjectIdsForUser(supabase, userId, params.accountId, params.projectId);

  if (projectIds.length === 0) {
    return { locations: [] };
  }

  // Use SQL aggregation to avoid hitting query limits
  const { data: aggregatedData, error } = await supabase.rpc('get_impressions_by_location_aggregated', {
    p_project_ids: projectIds,
    p_start_date: params.startDate,
    p_end_date: params.endDate
  });

  if (error) {
    throw new Error(`Failed to fetch impressions: ${error.message}`);
  }

  // Map to expected format
  const locations = aggregatedData?.map((item: any) => ({
    country: item.geo_country,
    city: item.geo_city,
    latitude: item.geo_lat,
    longitude: item.geo_lng,
    count: Number(item.count),
  })) || [];

  return { locations };
}