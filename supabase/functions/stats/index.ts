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

// Helper to verify user JWT and return service role client
async function getAuthenticatedClient(authHeader: string | null) {
  console.log("Verifying token...");
  if (!authHeader) {
    throw new Error("Missing authorization header");
  }

  // Create client with the user's token
  const authClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? "",
    {
      global: {
        headers: { Authorization: authHeader },
      },
    }
  );

  // Verify the user by asking Supabase Auth
  const { data: { user }, error } = await authClient.auth.getUser();
  
  if (error) {
    console.error("Token verification failed:", error);
    console.log("Auth Header Length:", authHeader.length);
    console.log("Auth Header Start:", authHeader.substring(0, 20));
    throw new Error(`Invalid JWT: ${error.message}`);
  }
  
  if (!user) {
    console.error("No user found for token");
    throw new Error("Invalid JWT: No user found");
  }
  
  console.log(`User verified: ${user.id}`);

  // Return service role client for querying analytics (bypasses RLS)
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  return { supabase, userId: user.id };
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

function getResolution(startDate: string, endDate: string): 'hour' | 'day' {
  const start = new Date(startDate).getTime();
  const end = new Date(endDate).getTime();
  const diffHours = (end - start) / (1000 * 60 * 60);
  return diffHours <= 50 ? 'hour' : 'day';
}

// Helper to get project IDs for a user (and optionally specific account)
async function getProjectIds(supabase: any, userId: string, accountId?: string): Promise<string[]> {
  // 1. Get all accounts for this user
  const { data: accounts, error: accountError } = await supabase
    .from("account")
    .select("id")
    .eq("user_id", userId);

  if (accountError) {
    throw new Error(`Failed to fetch user accounts: ${accountError.message}`);
  }

  const userAccountIds = accounts?.map((a: any) => a.id) || [];

  if (userAccountIds.length === 0) {
    return []; // User has no accounts
  }

  // 2. If a specific account was requested, verify access
  if (accountId) {
    if (!userAccountIds.includes(accountId)) {
      throw new Error("Unauthorized: You do not have access to this account.");
    }
    
    // Fetch projects for this validated account
    const { data, error } = await supabase
      .from("project")
      .select("project_id")
      .eq("account_id", accountId);

    if (error) {
      throw new Error(`Failed to fetch projects: ${error.message}`);
    }
    return data?.map((p: any) => p.project_id) || [];
  }

  // 3. Otherwise, fetch projects for ALL user accounts
  const { data, error } = await supabase
    .from("project")
    .select("project_id")
    .in("account_id", userAccountIds);

  if (error) {
    throw new Error(`Failed to fetch projects: ${error.message}`);
  }

  return data?.map((p: any) => p.project_id) || [];
}

// Handler: Total interactions
async function handleTotalInteractions(supabase: any, userId: string, params: StatsParams) {
  const projectIds = await getProjectIds(supabase, userId, params.accountId);

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
async function handleImpressionsByWidget(supabase: any, userId: string, params: StatsParams) {
  const projectIds = await getProjectIds(supabase, userId, params.accountId);

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
async function handleImpressionsByLocation(supabase: any, userId: string, params: StatsParams) {
  const projectIds = await getProjectIds(supabase, userId, params.accountId);

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

// Handler: Interactions over time
async function handleInteractionsOverTime(supabase: any, userId: string, params: StatsParams) {
  const projectIds = await getProjectIds(supabase, userId, params.accountId);

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

  const resolution = getResolution(params.startDate, params.endDate);

  // Group by date (day or hour)
  const groupedCounts = events?.reduce((acc: any, event: any) => {
    let key;
    if (resolution === 'hour') {
        // e.g. 2023-10-27T10:00:00.000Z -> 2023-10-27T10:00
        key = event.created_at.substring(0, 13) + ":00";
    } else {
        key = event.created_at.split("T")[0];
    }

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

// Handler: Impressions over time
async function handleImpressionsOverTime(supabase: any, userId: string, params: StatsParams) {
  const projectIds = await getProjectIds(supabase, userId, params.accountId);

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

  const resolution = getResolution(params.startDate, params.endDate);

  // Group by date (day or hour)
  const groupedCounts = impressions?.reduce((acc: any, imp: any) => {
    let key;
    if (resolution === 'hour') {
        key = imp.created_at.substring(0, 13) + ":00";
    } else {
        key = imp.created_at.split("T")[0];
    }

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

// Handler: Impressions by platform
async function handleImpressionsByPlatform(supabase: any, userId: string, params: StatsParams) {
  const projectIds = await getProjectIds(supabase, userId, params.accountId);

  if (projectIds.length === 0) {
    return { platforms: [] };
  }

  const { data: impressions, error } = await supabase
    .from("analytics_impressions")
    .select("platform")
    .in("project_id", projectIds)
    .gte("created_at", params.startDate)
    .lte("created_at", params.endDate);

  if (error) {
    throw new Error(`Failed to fetch impressions: ${error.message}`);
  }

  const platformCounts = impressions?.reduce((acc: any, imp: any) => {
    const platform = imp.platform || "Unknown";
    acc[platform] = (acc[platform] || 0) + 1;
    return acc;
  }, {});

  return {
    platforms: Object.entries(platformCounts || {}).map(([platform, count]) => ({
      platform,
      count,
    })),
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
