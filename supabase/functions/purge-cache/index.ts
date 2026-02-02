import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { getAuthenticatedClient } from "../_shared/supabase.ts";
import { getProjectIdsForUser } from "../_shared/projectDao.ts";

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Only allow POST method
    if (req.method !== "POST") {
      return new Response(
        JSON.stringify({ error: "Method not allowed" }),
        {
          status: 405,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const authHeader = req.headers.get("Authorization");
    const { supabase, userId } = await getAuthenticatedClient(authHeader);

    // Parse request body
    const { projectId } = await req.json();

    if (!projectId) {
      return new Response(
        JSON.stringify({ error: "Missing projectId parameter" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Verify user has access to this project
    const userProjectIds = await getProjectIdsForUser(supabase, userId, undefined, projectId);
    if (!userProjectIds.includes(projectId)) {
      return new Response(
        JSON.stringify({ error: "Unauthorized: You do not have access to this project" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Construct the CDN URL to purge
    const cdnUrl = `https://cdn.divee.ai/functions/v1/config?projectId=${projectId}`;

    // Get Fastly API key from environment
    // @ts-ignore
    const fastlyApiKey = Deno.env.get("FASTLY_API_KEY");
    if (!fastlyApiKey) {
      console.error("FASTLY_API_KEY environment variable not set");
      return new Response(
        JSON.stringify({ error: "Cache purge not configured" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Purge using Fastly soft purge (recommended)
    // Soft purge marks as stale but serves stale content while revalidating
    const purgeResponse = await fetch(cdnUrl, {
      method: "PURGE",
      headers: {
        "Fastly-Key": fastlyApiKey,
        "Fastly-Soft-Purge": "1",
      },
    });

    if (!purgeResponse.ok) {
      const errorText = await purgeResponse.text();
      console.error("Fastly purge failed:", purgeResponse.status, errorText);
      return new Response(
        JSON.stringify({ 
          error: "Failed to purge cache", 
          status: purgeResponse.status,
          details: errorText 
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log(`Cache purged for project ${projectId} by user ${userId}`);

    return new Response(
      JSON.stringify({
        success: true,
        message: "Cache purged successfully",
        projectId,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Error in /purge-cache endpoint:", error);

    return new Response(
      JSON.stringify({
        error: error.message || "Internal server error",
      }),
      {
        status: error.message?.includes("Authorization") ? 401 : 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
