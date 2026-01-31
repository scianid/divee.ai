import { getProjectIdsForUser } from "../../_shared/projectDao.ts";
import { StatsParams } from "./params.ts";

export interface TopArticle {
  url: string;
  title: string;
  imageUrl: string | null;
  impressions: number;
  customQuestions: number;
  suggestedQuestions: number;
  totalQuestions: number;
  engagementRate: number;
}

export interface TopArticlesParams extends StatsParams {
  limit?: number;
  sortBy?: 'impressions' | 'engagement';
}

// Handler: Top performing articles by impressions or engagement
export async function handleTopArticles(
  supabase: any, 
  userId: string, 
  params: TopArticlesParams
): Promise<TopArticle[]> {

  const projectIds = await getProjectIdsForUser(supabase, userId, params.accountId, params.projectId);

  if (projectIds.length === 0) {
    return [];
  }

  const limit = params.limit || 3;
  const sortBy = params.sortBy || 'impressions';

  // Use SQL aggregation function
  const { data, error } = await supabase.rpc('get_top_articles_aggregated', {
    p_project_ids: projectIds,
    p_start_date: params.startDate,
    p_end_date: params.endDate,
    p_limit: limit,
    p_sort_by: sortBy
  });

  if (error) {
    throw new Error(`Failed to fetch top articles: ${error.message}`);
  }

  // Transform to camelCase and calculate engagement rate
  return (data || []).map((row: any) => ({
    url: row.url,
    title: row.title,
    imageUrl: row.image_url,
    impressions: row.impressions,
    customQuestions: row.custom_questions,
    suggestedQuestions: row.suggested_questions,
    totalQuestions: row.total_questions,
    engagementRate: row.impressions > 0 
      ? Math.round((row.total_questions / row.impressions) * 10000) / 100 
      : 0
  }));
}
