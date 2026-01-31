import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { getAuthenticatedClient } from "../_shared/supabase.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { parseParams } from "./visualizations/params.ts";
import { handleTotalInteractions } from "./visualizations/totalInteractions.ts";
import { handleImpressionsByWidget } from "./visualizations/impressionsByWidget.ts";
import { handleImpressionsByLocation } from "./visualizations/impressionsByLocation.ts";
import { handleInteractionsOverTime } from "./visualizations/interactionsOverTime.ts";
import { handleImpressionsOverTime } from "./visualizations/impressionsOverTime.ts";
import { handleImpressionsByPlatform } from "./visualizations/impressionsByPlatform.ts";
import { handleAdImpressions } from "./visualizations/adImpressions.ts";
import { handleAdClicks } from "./visualizations/adClicks.ts";
import { handleTopArticles } from "./visualizations/topArticles.ts";

// Main handler with routing
// @ts-ignore
Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  
  try {
    const url = new URL(req.url);
    const path = url.pathname;
    const authHeader = req.headers.get("Authorization");
    
    // Verify JWT manually (Gateway verification disabled)
    // Now returns both client and userId
    const { supabase, userId } = await getAuthenticatedClient(authHeader);
    
    // Parse common parameters
    const params = parseParams(url);

    // Route to appropriate handler
    let data;
    if (path.endsWith("/total-interactions")) {
      data = await handleTotalInteractions(supabase, userId, params);
    } else if (path.endsWith("/impressions-by-widget")) {
      data = await handleImpressionsByWidget(supabase, userId, params);
    } else if (path.endsWith("/impressions-by-location")) {
      data = await handleImpressionsByLocation(supabase, userId, params);
    } else if (path.endsWith("/interactions-over-time")) {
      data = await handleInteractionsOverTime(supabase, userId, params);
    } else if (path.endsWith("/impressions-over-time")) {
      data = await handleImpressionsOverTime(supabase, userId, params);
    } else if (path.endsWith("/impressions-by-platform")) {
      data = await handleImpressionsByPlatform(supabase, userId, params);
    } else if (path.endsWith("/ad-impressions")) {
      data = await handleAdImpressions(supabase, userId, params);
    } else if (path.endsWith("/ad-clicks")) {
      data = await handleAdClicks(supabase, userId, params);
    } else if (path.endsWith("/top-articles")) {
      // Parse additional params for top-articles
      const limit = parseInt(url.searchParams.get("limit") || "3");
      const sortBy = (url.searchParams.get("sort_by") || "impressions") as 'impressions' | 'engagement';
      data = await handleTopArticles(supabase, userId, { ...params, limit, sortBy });
    } else {
      return new Response(
        JSON.stringify({
          error: "Not found",
          availableEndpoints: [
            "/total-interactions",
            "/impressions-by-widget",
            "/impressions-by-location",
            "/interactions-over-time",
            "/impressions-over-time",
            "/impressions-by-platform",
            "/ad-impressions",
            "/ad-clicks",
            "/top-articles",
          ],
        }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? `[Function Internal Error] ${error.message}` : "Internal server error",
      }),
      {
        status: 401, // Using 401 for internal auth failures too
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
