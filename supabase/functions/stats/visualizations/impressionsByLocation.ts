import { getProjectIdsForUser } from "../../_shared/projectDao.ts";
import { StatsParams } from "./params.ts";

// Handler: Impressions by location
export async function handleImpressionsByLocation(supabase: any, userId: string, params: StatsParams) {
  const projectIds = await getProjectIdsForUser(supabase, userId, params.accountId);

  if (projectIds.length === 0) {
    return { locations: [] };
  }

  // Get impressions with geo data
  const { data: impressions, error } = await supabase
    .from("analytics_impressions")
    .select("geo_country, geo_city, geo_lat, geo_lng")
    .in("project_id", projectIds)
    .gte("created_at", params.startDate)
    .lte("created_at", params.endDate)
    .not("geo_country", "is", null);

  if (error) {
    throw new Error(`Failed to fetch impressions: ${error.message}`);
  }

  // Count by country and city
  const locationCounts = impressions?.reduce((acc: any, imp: any) => {
    const key = `${imp.geo_country}|${imp.geo_city || "Unknown"}`;
    if (!acc[key]) {
      acc[key] = {
        country: imp.geo_country,
        city: imp.geo_city || "Unknown",
        latitude: imp.geo_lat,
        longitude: imp.geo_lng,
        count: 0,
      };
    }
    acc[key].count++;
    return acc;
  }, {});

  const locations = Object.values(locationCounts || {}).sort(
    (a: any, b: any) => b.count - a.count
  );

  return { locations };
}