import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { getAuthenticatedClient } from "../_shared/supabase.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { getProjectIdsForUser } from "../_shared/projectDao.ts";
import type { ReportParams } from "./types.ts";
import { runGamReport, waitForReport, fetchAndAggregateReport } from "./report.ts";

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
    const projectId = url.searchParams.get("project_id"); // Optional project filter
    const siteName = url.searchParams.get("site_name"); // Optional site filter
    
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
    
    // If a project is specified, validate user has access
    if (projectId) {
      const userProjectIds = await getProjectIdsForUser(supabase, userId, undefined, projectId);
      if (!userProjectIds.includes(projectId)) {
        return new Response(
          JSON.stringify({ error: "Unauthorized: You do not have access to this project." }),
          {
            status: 401,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
    }

    // Get all projects the user has access to and their allowed URLs
    const userProjectIds = await getProjectIdsForUser(supabase, userId);
    if (userProjectIds.length === 0) {
      return new Response(
        JSON.stringify({ error: "No accessible projects found" }),
        {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Fetch allowed URLs for these projects
    const { data: projectsData, error: projectsError } = await supabase
      .from("project")
      .select("project_id, allowed_urls")
      .in("project_id", userProjectIds);

    if (projectsError) {
      throw new Error(`Failed to fetch projects: ${projectsError.message}`);
    }

    // Fetch revenue share config for these projects
    const { data: configData, error: configError } = await supabase
      .from("project_config")
      .select("project_id, revenue_share_percentage")
      .in("project_id", userProjectIds);

    if (configError) {
      throw new Error(`Failed to fetch project config: ${configError.message}`);
    }

    // Build revenue share map (default to 50% if not configured)
    const revenueShareMap = new Map<string, number>();
    configData?.forEach((config: any) => {
      revenueShareMap.set(config.project_id, config.revenue_share_percentage || 50);
    });

    // Build project ID to allowed URLs map
    const projectUrlsMap = new Map<string, string[]>();
    projectsData?.forEach((p: any) => {
      if (p.allowed_urls && Array.isArray(p.allowed_urls)) {
        projectUrlsMap.set(p.project_id, p.allowed_urls);
      }
    });

    // Extract all allowed URLs and determine revenue share
    // If a specific site is filtered, we need to know which project it belongs to
    const allowedUrls = new Map<string, number>(); // URL -> revenue share %
    projectUrlsMap.forEach((urls, projectId) => {
      const revenueShare = revenueShareMap.get(projectId) || 50;
      urls.forEach(url => {
        // If URL exists in multiple projects, use the highest revenue share
        const existingShare = allowedUrls.get(url) || 0;
        allowedUrls.set(url, Math.max(existingShare, revenueShare));
      });
    });

    console.log(`User has access to ${allowedUrls.size} allowed URLs`);
    
    // If a specific site is requested, validate it's in allowed URLs
    if (siteName && allowedUrls.size > 0 && !allowedUrls.has(siteName)) {
      return new Response(
        JSON.stringify({ error: "Unauthorized: You do not have access to this site." }),
        {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const params: ReportParams = {
      startDate: startDate.split("T")[0], // Normalize to YYYY-MM-DD
      endDate: endDate.split("T")[0],
    };
    
    console.log(`Running GAM report for ${params.startDate} to ${params.endDate}`);
    
    // Run the report via SOAP API
    const reportJobId = await runGamReport(params);
    
    // Wait for completion
    await waitForReport(reportJobId);
    console.log("Report job completed");
    
    // Fetch and aggregate results (streaming to save memory)
    // Pass siteName to filter during aggregation
    const data = await fetchAndAggregateReport(reportJobId, siteName || undefined);
    console.log(`Processed ${data.rowCount} rows`);
    
    // Filter sites to only include allowed URLs (if no specific site was requested)
    if (!siteName && allowedUrls.size > 0) {
      for (const [site] of data.bySite.entries()) {
        if (!allowedUrls.has(site)) {
          data.bySite.delete(site);
        }
      }
      console.log(`Filtered to ${data.bySite.size} allowed sites`);
    }
    
    // Calculate revenue share
    // If filtering by site, use that site's revenue share
    // Otherwise, use weighted average based on each site's revenue
    let userRevenueShare = 50; // default
    if (siteName && allowedUrls.has(siteName)) {
      userRevenueShare = allowedUrls.get(siteName) || 50;
    } else {
      // Calculate weighted average revenue share
      let totalRevenue = 0;
      let weightedSum = 0;
      for (const [site, siteData] of data.bySite.entries()) {
        const share = allowedUrls.get(site) || 50;
        totalRevenue += siteData.revenue;
        weightedSum += siteData.revenue * share;
      }
      if (totalRevenue > 0) {
        userRevenueShare = weightedSum / totalRevenue;
      }
    }
    
    const userRevenue = (data.totalRevenue * userRevenueShare) / 100;
    console.log(`Revenue share: ${userRevenueShare}% (User: $${userRevenue.toFixed(2)}, Total: $${data.totalRevenue.toFixed(2)})`);
    
    // Convert Maps to sorted arrays
    const timeline = Array.from(data.byDate.entries())
      .map(([date, d]) => ({ date, impressions: d.impressions, revenue: d.revenue }))
      .sort((a, b) => a.date.localeCompare(b.date));
    
    const byAdUnit = Array.from(data.byAdUnit.entries())
      .map(([adUnitName, d]) => ({ 
        adUnitName, 
        impressions: d.impressions, 
        revenue: Math.round(d.revenue * 100) / 100 
      }))
      .sort((a, b) => b.impressions - a.impressions); // Sort by impressions descending
    
    const bySite = Array.from(data.bySite.entries())
      .map(([siteName, d]) => ({ 
        siteName, 
        impressions: d.impressions, 
        revenue: Math.round(d.revenue * 100) / 100 
      }))
      .sort((a, b) => b.impressions - a.impressions); // Sort by impressions descending
    
    return new Response(
      JSON.stringify({
        totalImpressions: data.totalImpressions,
        totalRevenue: Math.round(data.totalRevenue * 100) / 100,
        userRevenue: Math.round(userRevenue * 100) / 100,
        revenueSharePercentage: Math.round(userRevenueShare * 100) / 100,
        timeline,
        byAdUnit,
        bySite,
        rowCount: data.rowCount,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("GAM Error:", error);
    
    const statusCode = error instanceof Error && error.message.includes("Missing authorization") 
      ? 401 
      : 500;
    
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Internal server error",
      }),
      {
        status: statusCode,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

