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

  // Group by date (day or hour)
  const groupedCounts = events?.reduce((acc: any, event: any) => {
    const key = event.created_at.split("T")[0];

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