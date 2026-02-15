import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { getAuthenticatedClient } from "../_shared/supabase.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { getProjectIdsForUser } from "../_shared/projectDao.ts";
import { supabaseClient } from "../_shared/supabase.ts";

interface UnanalyzedConversation {
  id: string;
  project_id: string;
  visitor_id: string | null;
  session_id: string | null;
  created_at: string;
  updated_at: string | null;
  messages: any[];
  url: string | null;
  article_title: string | null;
  analyzed_at: string | null;
}

// @ts-ignore
Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  
  try {
    const authHeader = req.headers.get("Authorization");
    
    // Verify user authentication
    const { supabase, userId } = await getAuthenticatedClient(authHeader);
    
    // Parse query parameters
    const url = new URL(req.url);
    const projectId = url.searchParams.get("projectId");
    const limit = Math.min(parseInt(url.searchParams.get("limit") || "50"), 100); // Max 100
    const offset = parseInt(url.searchParams.get("offset") || "0");
    
    if (!projectId) {
      return new Response(
        JSON.stringify({ error: "projectId is required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Verify user has access to the project
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

    // Fetch unanalyzed conversations using service role (bypasses RLS)
    const { data: conversations, error: conversationsError, count } = await supabaseClient
      .from("conversations")
      .select(`
        id,
        project_id,
        visitor_id,
        session_id,
        created_at,
        updated_at,
        messages,
        url,
        article_title,
        analyzed_at
      `, { count: "exact" })
      .eq("project_id", projectId)
      .is("analyzed_at", null)
      .order("created_at", { ascending: true })
      .range(offset, offset + limit - 1);

    if (conversationsError) {
      throw new Error(`Failed to fetch conversations: ${conversationsError.message}`);
    }

    return new Response(
      JSON.stringify({
        conversations: conversations || [],
        total: count || 0,
        limit,
        offset,
        projectId,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error in conversations-unanalyzed function:", error);
    
    const status = error instanceof Error && error.message.includes("Unauthorized") ? 401 : 500;
    
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "Internal server error" 
      }),
      {
        status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
