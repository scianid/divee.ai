import { getProjectIdsForUser } from "../../_shared/projectDao.ts";
import { StatsParams, QUERY_LIMIT } from "./params.ts";

// Handler: Total interactions
export async function handleTotalInteractions(supabase: any, userId: string, params: StatsParams) {

  const projectIds = await getProjectIdsForUser(supabase, userId, params.accountId, params.projectId);

  if (projectIds.length === 0)
    return { total: 0, breakdown: [] };

  // Get total events
  const { data: events, error: eventsError } = await supabase
    .from("analytics_events")
    .select("event_type")
    .in("project_id", projectIds)
    .gte("created_at", params.startDate)
    .lte("created_at", params.endDate)
    .limit(QUERY_LIMIT);

  if (eventsError) {
    throw new Error(`Failed to fetch events: ${eventsError.message}`);
  }

  // Count by event type
  const breakdown = events?.reduce((acc: any, event: any) => {
    const type = event.event_type || "unknown";
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {});

  return {
    total: events?.length || 0,
    breakdown: Object.entries(breakdown || {}).map(([type, count]) => ({
      type,
      count,
    })),
  };
}
