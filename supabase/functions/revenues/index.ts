import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { getAuthenticatedClient } from "../_shared/supabase.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { getProjectIdsForUser } from "../_shared/projectDao.ts";

// Pricing for GPT-5.2 (tokens per million)
const INPUT_TOKEN_COST = 1.10; // $1.10 per 1M input tokens
const OUTPUT_TOKEN_COST = 4.40; // $4.40 per 1M output tokens

interface ProjectRevenue {
  project_id: string;
  project_name: string;
  ad_revenue: number;
  token_cost: number;
  net_revenue: number;
  revenue_share_percentage: number;
  impressions: number;
}

interface TimeSeriesData {
  date: string;
  ad_revenue: number;
  token_cost: number;
  net_revenue: number;
  impressions: number;
}

// @ts-ignore
Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  
  try {
    const url = new URL(req.url);
    const authHeader = req.headers.get("Authorization");
    
    // Verify user authentication
    const { supabase, userId } = await getAuthenticatedClient(authHeader);
    
    // Parse query parameters
    const startDate = url.searchParams.get("start_date");
    const endDate = url.searchParams.get("end_date");
    const projectIdFilter = url.searchParams.get("project_id"); // Optional project filter
    
    if (!startDate || !endDate) {
      return new Response(
        JSON.stringify({
          error: "Missing required parameters: start_date and end_date",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }
    
    // Get all projects the user has access to
    const userProjectIds = await getProjectIdsForUser(
      supabase, 
      userId, 
      undefined, 
      projectIdFilter || undefined
    );
    
    if (userProjectIds.length === 0) {
      return new Response(
        JSON.stringify({ 
          error: "No accessible projects found",
          projectRevenues: [],
          totalRevenue: 0,
          totalAdRevenue: 0,
          totalTokenCost: 0,
          totalImpressions: 0,
          timeSeries: []
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // If project filter is specified, verify access
    if (projectIdFilter && !userProjectIds.includes(projectIdFilter)) {
      return new Response(
        JSON.stringify({ error: "Unauthorized: You do not have access to this project." }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Fetch project details and revenue share config
    const { data: projectsData, error: projectsError } = await supabase
      .from("project")
      .select("project_id, client_name, account_id")
      .in("project_id", userProjectIds);

    if (projectsError) {
      throw new Error(`Failed to fetch projects: ${projectsError.message}`);
    }

    const { data: configData, error: configError } = await supabase
      .from("project_config")
      .select("project_id, revenue_share_percentage")
      .in("project_id", userProjectIds);

    if (configError) {
      throw new Error(`Failed to fetch project config: ${configError.message}`);
    }

    // Build maps for quick lookup
    const projectNameMap = new Map<string, string>();
    projectsData?.forEach((p: any) => {
      projectNameMap.set(p.project_id, p.client_name || "Unnamed Project");
    });

    const revenueShareMap = new Map<string, number>();
    configData?.forEach((config: any) => {
      revenueShareMap.set(config.project_id, config.revenue_share_percentage || 50);
    });

    // Adjust end date to include full day
    const endDatePlusOne = new Date(endDate);
    endDatePlusOne.setDate(endDatePlusOne.getDate() + 1);
    const endDateInclusive = endDatePlusOne.toISOString().split('T')[0];

    // Fetch ad revenue data using ad_impressions_aggregated view
    const { data: adData, error: adError } = await supabase
      .from("ad_impressions_aggregated")
      .select("project_id, usage_date, total_impressions, total_revenue")
      .in("project_id", userProjectIds)
      .gte("usage_date", startDate)
      .lt("usage_date", endDateInclusive);

    if (adError) {
      console.error("Failed to fetch ad data:", adError);
    }

    // Fetch token usage data
    const { data: tokenData, error: tokenError } = await supabase
      .from("token_usage")
      .select("project_id, created_at, input_tokens, output_tokens")
      .in("project_id", userProjectIds)
      .gte("created_at", startDate)
      .lt("created_at", endDateInclusive);

    if (tokenError) {
      console.error("Failed to fetch token data:", tokenError);
    }

    // Aggregate data by project
    const projectMap = new Map<string, ProjectRevenue>();
    
    // Initialize projects
    userProjectIds.forEach(projectId => {
      projectMap.set(projectId, {
        project_id: projectId,
        project_name: projectNameMap.get(projectId) || "Unknown",
        ad_revenue: 0,
        token_cost: 0,
        net_revenue: 0,
        revenue_share_percentage: revenueShareMap.get(projectId) || 50,
        impressions: 0,
      });
    });

    // Aggregate ad revenue
    adData?.forEach((row: any) => {
      const project = projectMap.get(row.project_id);
      if (project) {
        project.ad_revenue += row.total_revenue || 0;
        project.impressions += row.total_impressions || 0;
      }
    });

    // Aggregate token costs
    tokenData?.forEach((row: any) => {
      const project = projectMap.get(row.project_id);
      if (project) {
        const inputCost = (row.input_tokens / 1_000_000) * INPUT_TOKEN_COST;
        const outputCost = (row.output_tokens / 1_000_000) * OUTPUT_TOKEN_COST;
        project.token_cost += inputCost + outputCost;
      }
    });

    // Calculate net revenue (ad revenue - token cost) * revenue share percentage
    projectMap.forEach(project => {
      const grossProfit = project.ad_revenue - project.token_cost;
      project.net_revenue = (grossProfit * project.revenue_share_percentage) / 100;
    });

    // Calculate time series data
    const timeSeriesMap = new Map<string, TimeSeriesData>();
    
    // Aggregate ad revenue by date
    adData?.forEach((row: any) => {
      const date = row.usage_date;
      if (!timeSeriesMap.has(date)) {
        timeSeriesMap.set(date, {
          date,
          ad_revenue: 0,
          token_cost: 0,
          net_revenue: 0,
          impressions: 0,
        });
      }
      const entry = timeSeriesMap.get(date)!;
      entry.ad_revenue += row.total_revenue || 0;
      entry.impressions += row.total_impressions || 0;
    });

    // Aggregate token costs by date
    tokenData?.forEach((row: any) => {
      const date = new Date(row.created_at).toISOString().split('T')[0];
      if (!timeSeriesMap.has(date)) {
        timeSeriesMap.set(date, {
          date,
          ad_revenue: 0,
          token_cost: 0,
          net_revenue: 0,
          impressions: 0,
        });
      }
      const entry = timeSeriesMap.get(date)!;
      const inputCost = (row.input_tokens / 1_000_000) * INPUT_TOKEN_COST;
      const outputCost = (row.output_tokens / 1_000_000) * OUTPUT_TOKEN_COST;
      entry.token_cost += inputCost + outputCost;
    });

    // Calculate net revenue for each date
    // For time series, use weighted average revenue share
    const totalAdRevenueForWeighting = Array.from(projectMap.values()).reduce((sum, p) => sum + p.ad_revenue, 0);
    let weightedRevenueShare = 50; // default
    
    if (totalAdRevenueForWeighting > 0) {
      let weightedSum = 0;
      projectMap.forEach(project => {
        weightedSum += (project.ad_revenue / totalAdRevenueForWeighting) * project.revenue_share_percentage;
      });
      weightedRevenueShare = weightedSum;
    }

    timeSeriesMap.forEach(entry => {
      const grossProfit = entry.ad_revenue - entry.token_cost;
      entry.net_revenue = (grossProfit * weightedRevenueShare) / 100;
    });

    // Convert to arrays and sort
    const projectRevenues = Array.from(projectMap.values())
      .filter(p => p.ad_revenue > 0 || p.token_cost > 0) // Only include projects with activity
      .sort((a, b) => b.net_revenue - a.net_revenue);

    const timeSeries = Array.from(timeSeriesMap.values())
      .sort((a, b) => a.date.localeCompare(b.date));

    // Calculate totals
    const totalAdRevenue = projectRevenues.reduce((sum, p) => sum + p.ad_revenue, 0);
    const totalTokenCost = projectRevenues.reduce((sum, p) => sum + p.token_cost, 0);
    const totalNetRevenue = projectRevenues.reduce((sum, p) => sum + p.net_revenue, 0);
    const totalImpressions = projectRevenues.reduce((sum, p) => sum + p.impressions, 0);

    // Calculate projected monthly revenue (extrapolate based on date range)
    const startMs = new Date(startDate).getTime();
    const endMs = new Date(endDate).getTime();
    const daysInRange = Math.round((endMs - startMs) / (1000 * 60 * 60 * 24)) + 1;
    const projectedMonthly = daysInRange > 0 ? (totalNetRevenue / daysInRange) * 30 : 0;

    return new Response(
      JSON.stringify({
        projectRevenues,
        totalRevenue: totalNetRevenue,
        totalAdRevenue,
        totalTokenCost,
        totalImpressions,
        projectedMonthly,
        timeSeries,
        dateRange: {
          start: startDate,
          end: endDate,
          days: daysInRange,
        },
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error in revenues function:", error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "Internal server error" 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
