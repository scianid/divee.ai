import { getProjectIdsForUser } from "../../_shared/projectDao.ts";
import { StatsParams } from "./params.ts";

// Handler: Impressions over time
export async function handleImpressionsOverTime(supabase: any, userId: string, params: StatsParams) {
    const projectIds = await getProjectIdsForUser(supabase, userId, params.accountId, params.projectId);

    if (projectIds.length === 0) {
        return { timeline: [] };
    }

    // Get impressions grouped by date
    const { data: impressions, error } = await supabase
        .from("analytics_impressions")
        .select("created_at")
        .in("project_id", projectIds)
        .gte("created_at", params.startDate)
        .lte("created_at", params.endDate)
        .order("created_at");

    if (error) {
        throw new Error(`Failed to fetch impressions: ${error.message}`);
    }

    // Group by date (day or hour)
    const groupedCounts = impressions?.reduce((acc: any, imp: any) => {
        const key = imp.created_at.split("T")[0];

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