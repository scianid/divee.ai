import { getProjectIdsForUser } from "../../_shared/projectDao.ts";
import { StatsParams, QUERY_LIMIT } from "./params.ts";

// Handler: Interactions over time
export async function handleInteractionsOverTime(supabase: any, userId: string, params: StatsParams) {
  const projectIds = await getProjectIdsForUser(supabase, userId, params.accountId, params.projectId);

  if (projectIds.length === 0) {
    return { timeline: [] };
  }

  // Get events grouped by date
  const { data: events, error } = await supabase
    .from("analytics_events")
    .select("created_at, event_type")
    .in("project_id", projectIds)
    .gte("created_at", params.startDate)
    .lte("created_at", params.endDate)
    .order("created_at")
    .limit(QUERY_LIMIT);

  if (error) {
    throw new Error(`Failed to fetch events: ${error.message}`);
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

    if (!acc[key]) {
      acc[key] = { date: key, count: 0 };
    }
    acc[key].count++;
    return acc;
  }, {});

  return {
    timeline: Object.values(groupedCounts || {}).sort(
      (a: any, b: any) => a.date.localeCompare(b.date)
    ),
  };
}