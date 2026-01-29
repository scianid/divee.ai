import { getProjectIdsForUser } from "../../_shared/projectDao.ts";
import { StatsParams } from "./params.ts";

// Handler: Impressions by widget (project)
export async function handleImpressionsByWidget(supabase: any, userId: string, params: StatsParams) {
    const projectIds = await getProjectIdsForUser(supabase, userId, params.accountId, params.projectId);

    if (projectIds.length === 0) {
        return { widgets: [], total: 0 };
    }

    const [projects, impressionCounts] = await Promise.all([
        getProjectNames(supabase, projectIds),
        getImpressionCounts(supabase, projectIds, params.startDate, params.endDate),
    ]);

    // Build a map of project_id -> count
    const countsMap = impressionCounts?.reduce((acc: any, item: any) => {
        acc[item.project_id] = item.count;
        return acc;
    }, {}) || {};

    // Combine with project names
    const widgets = projects?.map((p: any) => ({
        projectId: p.project_id,
        name: p.client_name,
        impressions: countsMap[p.project_id] || 0,
    })) || [];

    // Calculate total from aggregated counts
    const total = impressionCounts?.reduce((sum: number, item: any) => sum + Number(item.count), 0) || 0;

    return { widgets, total };
}

async function getProjectNames(supabase: any, projectIds: string[]) {
    // Get project names
    const { data: projects, error: projectError } = await supabase
        .from("project")
        .select("project_id, client_name")
        .in("project_id", projectIds);

    if (projectError) {
        throw new Error(`Failed to fetch projects: ${projectError.message}`);
    }

    return projects;
}

async function getImpressionCounts(supabase: any, projectIds: string[], startDate: string, endDate: string) {
    // Use SQL aggregation to avoid hitting query limits
    const { data: counts, error } = await supabase.rpc('get_impressions_by_widget_aggregated', {
        p_project_ids: projectIds,
        p_start_date: startDate,
        p_end_date: endDate
    });

    if (error) {
        throw new Error(`Failed to fetch impression counts: ${error.message}`);
    }

    return counts;
}