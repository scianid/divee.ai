import { getProjectIdsForUser } from "../../_shared/projectDao.ts";
import { StatsParams } from "./params.ts";

// Handler: Widget visible events over time
export async function handleWidgetVisibleOverTime(supabase: any, userId: string, params: StatsParams) {
    const projectIds = await getProjectIdsForUser(supabase, userId, params.accountId, params.projectId);

    if (projectIds.length === 0) {
        return { total: 0, timeline: [] };
    }

    // Determine grouping granularity based on time range
    const startDate = new Date(params.startDate);
    const endDate = new Date(params.endDate);
    const hoursDiff = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60);
    const isHourly = hoursDiff <= 48; // Use hourly grouping for <= 48 hours

    // Use SQL aggregation to avoid hitting query limits
    const { data: aggregatedData, error } = await supabase.rpc('get_widget_visible_over_time_aggregated', {
        p_project_ids: projectIds,
        p_start_date: params.startDate,
        p_end_date: params.endDate,
        p_group_by: isHourly ? 'hour' : 'day'
    });

    if (error) {
        throw new Error(`Failed to fetch widget visible events: ${error.message}`);
    }

    // Calculate total from timeline
    const total = (aggregatedData || []).reduce((sum: number, item: any) => sum + parseInt(item.count), 0);

    return {
        total,
        timeline: aggregatedData || [],
    };
}
