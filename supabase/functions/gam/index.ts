import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { getAuthenticatedClient } from "../_shared/supabase.ts";
import { corsHeaders } from "../_shared/cors.ts";
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
    await getAuthenticatedClient(authHeader);
    
    // Parse query parameters
    const startDate = url.searchParams.get("start_date");
    const endDate = url.searchParams.get("end_date");
    
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
    const data = await fetchAndAggregateReport(reportJobId);
    console.log(`Processed ${data.rowCount} rows`);
    
    // Convert Maps to sorted arrays
    const timeline = Array.from(data.byDate.entries())
      .map(([date, d]) => ({ date, impressions: d.impressions, revenue: d.revenue }))
      .sort((a, b) => a.date.localeCompare(b.date));
    
    return new Response(
      JSON.stringify({
        totalImpressions: data.totalImpressions,
        totalRevenue: Math.round(data.totalRevenue * 100) / 100,
        timeline,
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

