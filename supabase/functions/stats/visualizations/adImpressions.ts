import { getProjectIdsForUser } from "../../_shared/projectDao.ts";
import { StatsParams } from "./params.ts";

// Handler: Ad impressions (event_type = 'ad_impression')
export async function handleAdImpressions(supabase: any, userId: string, params: StatsParams) {

  const projectIds = await getProjectIdsForUser(supabase, userId, params.accountId, params.projectId);

  if (projectIds.length === 0)
    return { total: 0, timeline: [] };

  // Get ad impression events
  const { data: events, error: eventsError } = await supabase
    .from("analytics_events")
    .select("created_at")
    .in("project_id", projectIds)
    .eq("event_type", "ad_impression")
    .gte("created_at", params.startDate)
    .lte("created_at", params.endDate)
    .order("created_at", { ascending: true });

  if (eventsError) {
    throw new Error(`Failed to fetch ad impressions: ${eventsError.message}`);
  }

  // Group by date/hour based on time range
  const startDate = new Date(params.startDate);
  const endDate = new Date(params.endDate);
  const hoursDiff = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60);
  const isHourly = hoursDiff <= 48; // Use hourly grouping for <= 48 hours

  const groupedCounts = events?.reduce((acc: any, event: any) => {
    const date = new Date(event.created_at);
    let key: string;
    
    if (isHourly) {
      // Group by hour
      key = date.toISOString().slice(0, 13) + ":00:00.000Z";
    } else {
      // Group by day
      key = date.toISOString().slice(0, 10);
    }
    
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});

  const timeline = Object.entries(groupedCounts || {}).map(([date, count]) => ({
    date,
    count,
  }));

  return {
    total: events?.length || 0,
    timeline,
  };
}
