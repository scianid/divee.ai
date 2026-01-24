import { getProjectIdsForUser } from "../../_shared/projectDao.ts";
import { StatsParams, QUERY_LIMIT } from "./params.ts";

// Handler: Impressions by widget (project)
export async function handleImpressionsByWidget(supabase: any, userId: string, params: StatsParams) {
    const projectIds = await getProjectIdsForUser(supabase, userId, params.accountId, params.projectId);

    if (projectIds.length === 0) {
        return { widgets: [] };
    }

    const [projects, impressions] = await Promise.all([
        getProjectNames(supabase, projectIds),
        getImpressions(supabase, projectIds, params.startDate, params.endDate),
    ]);

    // Count by project_id
    const counts = impressions?.reduce((acc: any, imp: any) => {
        acc[imp.project_id] = (acc[imp.project_id] || 0) + 1;
        return acc;
    }, {});

    // Combine with project names
    const widgets = projects?.map((p: any) => ({
        projectId: p.project_id,
        name: p.client_name,
        impressions: counts?.[p.project_id] || 0,
    })) || [];

    return { widgets };
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

async function getImpressions(supabase: any, projectIds: string[], startDate: string, endDate: string) {
    // Get impressions count per project
    const { data: impressions, error: impressionsError } = await supabase
        .from("analytics_impressions")
        .select("project_id")
        .in("project_id", projectIds)
        .gte("created_at", startDate)
        .lte("created_at", endDate)
        .limit(QUERY_LIMIT);

    if (impressionsError) {
        throw new Error(`Failed to fetch impressions: ${impressionsError.message}`);
    }

    return impressions;
}