import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

// CORS headers
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface StatsParams {
  accountId?: string;
  startDate: string;
  endDate: string;
}

// Helper to create Supabase client
// Use service role for bypassing RLS on analytics tables
function getSupabaseClient() {
  return createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );
}

// Verify JWT and get user from token
async function verifyUser(authHeader: string | null) {
  if (!authHeader) {
    throw new Error("Missing authorization header");
  }
  
  // Create client with anon key to verify the JWT
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? "",
    {
      global: {
        headers: { Authorization: authHeader },
      },
    }
  );
  
  const { data: { user }, error } = await supabase.auth.getUser();
  
  if (error || !user) {
    throw new Error("Invalid authentication token");
  }
  
  return user;
}

// Helper to parse and validate query parameters
function parseParams(url: URL): StatsParams {
  const accountId = url.searchParams.get("account_id");
  const startDate = url.searchParams.get("start_date");
  const endDate = url.searchParams.get("end_date");

  if (!startDate) {
    throw new Error("Missing required parameter: start_date");
  }
  if (!endDate) {
    throw new Error("Missing required parameter: end_date");
  }

  return { accountId: accountId || undefined, startDate, endDate };
}

// Helper to get project IDs for an account
async function getProjectIds(supabase: any, accountId?: string): Promise<string[]> {
  let query = supabase.from("project").select("project_id");
  
  if (accountId) {
    query = query.eq("account_id", accountId);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to fetch projects: ${error.message}`);
  }

  return data?.map((p: any) => p.project_id) || [];
}

// Handler: Total interactions
async function handleTotalInteractions(supabase: any, params: StatsParams) {
  const projectIds = await getProjectIds(supabase, params.accountId);

  if (projectIds.length === 0) {
    return { total: 0, breakdown: [] };
  }

  // Get total events
  const { data: events, error: eventsError } = await supabase
    .from("analytics_events")
    .select("event_type")
    .in("project_id", projectIds)
    .gte("created_at", params.startDate)
    .lte("created_at", params.endDate);

  if (eventsError) {
    throw new Error(`Failed to fetch events: ${eventsError.message}`);
  }

  // Count by event type
  const breakdown = events?.reduce((acc: any, event: any) => {
    const type = event.event_type || "unknown";
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {});

  return {
    total: events?.length || 0,
    breakdown: Object.entries(breakdown || {}).map(([type, count]) => ({
      type,
      count,
    })),
  };
}

// Handler: Impressions by widget (project)
async function handleImpressionsByWidget(supabase: any, params: StatsParams) {
  const projectIds = await getProjectIds(supabase, params.accountId);

  if (projectIds.length === 0) {
    return { widgets: [] };
  }

  // Get project names
  const { data: projects, error: projectError } = await supabase
    .from("project")
    .select("project_id, client_name")
    .in("project_id", projectIds);

  if (projectError) {
    throw new Error(`Failed to fetch projects: ${projectError.message}`);
  }

  // Get impressions count per project
  const { data: impressions, error: impressionsError } = await supabase
    .from("analytics_impressions")
    .select("project_id")
    .in("project_id", projectIds)
    .gte("created_at", params.startDate)
    .lte("created_at", params.endDate);

  if (impressionsError) {
    throw new Error(`Failed to fetch impressions: ${impressionsError.message}`);
  }

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

// Handler: Impressions by location
async function handleImpressionsByLocation(supabase: any, params: StatsParams) {
  const projectIds = await getProjectIds(supabase, params.accountId);

  if (projectIds.length === 0) {
    return { locations: [] };
  }

  // Get impressions with geo data
  const { data: impressions, error } = await supabase
    .from("analytics_impressions")
    .select("geo_country, geo_city")
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

// Handler: Interactions over time
async function handleInteractionsOverTime(supabase: any, params: StatsParams) {
  const projectIds = await getProjectIds(supabase, params.accountId);

  if (projectIds.length === 0) {
    return { timeline: [] };
  }

  // Get events grouped by date
  const { data: events, error } = await supabase
    .from("analytics_events")
    .select("created_at, event_type")
    .in("project_id", projectIds)
    .gte("created_at", params.startDate)
    .lte("created_at", params.endDate)
    .order("created_at");

  if (error) {
    throw new Error(`Failed to fetch events: ${error.message}`);
  }

  // Group by date (day)
  const dailyCounts = events?.reduce((acc: any, event: any) => {
    const date = event.created_at.split("T")[0];
    if (!acc[date]) {
      acc[date] = { date, count: 0 };
    }
    acc[date].count++;
    return acc;
  }, {});

  return {
    timeline: Object.values(dailyCounts || {}).sort(
      (a: any, b: any) => a.date.localeCompare(b.date)
    ),
  };
}

// Handler: Impressions over time
async function handleImpressionsOverTime(supabase: any, params: StatsParams) {
  const projectIds = await getProjectIds(supabase, params.accountId);

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

  // Group by date (day)
  const dailyCounts = impressions?.reduce((acc: any, imp: any) => {
    const date = imp.created_at.split("T")[0];
    if (!acc[date]) {
      acc[date] = { date, count: 0 };
    }
    acc[date].count++;
    return acc;
  }, {});

  return {
    timeline: Object.values(dailyCounts || {}).sort(
      (a: any, b: any) => a.date.localeCompare(b.date)
    ),
  };
}

// Main handler with routing
Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  console.log("RUNNING");
  
  try {
    const url = new URL(req.url);
    const path = url.pathname;
    const authHeader = req.headers.get("Authorization");
    
    // Verify the user's JWT token
    await verifyUser(authHeader);
    
    // Use service role client for database queries (bypasses RLS)
    const supabase = getSupabaseClient();
    
    // Parse common parameters
    const params = parseParams(url);

    // Route to appropriate handler
    let data;
    if (path.endsWith("/total-interactions")) {
      data = await handleTotalInteractions(supabase, params);
    } else if (path.endsWith("/impressions-by-widget")) {
      data = await handleImpressionsByWidget(supabase, params);
    } else if (path.endsWith("/impressions-by-location")) {
      data = await handleImpressionsByLocation(supabase, params);
    } else if (path.endsWith("/interactions-over-time")) {
      data = await handleInteractionsOverTime(supabase, params);
    } else if (path.endsWith("/impressions-over-time")) {
      data = await handleImpressionsOverTime(supabase, params);
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
        error: error instanceof Error ? error.message : "Internal server error",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
