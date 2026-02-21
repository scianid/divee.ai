import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { getAuthenticatedClient, supabaseClient } from "../_shared/supabase.ts";
import { corsHeaders } from "../_shared/cors.ts";

// @ts-ignore
Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    const { userId: adminUserId } = await getAuthenticatedClient(authHeader);
    const impersonationEnabledUserIds = (Deno.env.get("IMPERSONATION_ENABLED_USER_IDS") ?? "").split(",").map(id => id.trim());

    if (!impersonationEnabledUserIds.includes(adminUserId)) {
      return new Response(
        JSON.stringify({ error: "Unauthorized: Admin access required" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { targetUserId } = await req.json();

    if (!targetUserId) {
      return new Response(
        JSON.stringify({ error: "Missing 'targetUserId' in request body" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Prevent admins from impersonating themselves
    if (targetUserId === adminUserId) {
      return new Response(
        JSON.stringify({ error: "Cannot impersonate yourself" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // @ts-ignore
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    // @ts-ignore
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

    // Approach 1: direct admin session endpoint (GoTrue v2.99+)
    const sessionRes = await fetch(
      `${supabaseUrl}/auth/v1/admin/users/${targetUserId}/sessions`,
      {
        method: "POST",
        headers: {
          "apikey": serviceKey,
          "Authorization": `Bearer ${serviceKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({}),
      }
    );

    if (sessionRes.ok) {
      const sess = await sessionRes.json();
      console.log(`Admin ${adminUserId} started impersonating user ${targetUserId} (direct session)`);
      return new Response(
        JSON.stringify({ access_token: sess.access_token, refresh_token: sess.refresh_token, user: sess.user }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Direct session endpoint returned ${sessionRes.status} — falling back to link redirect approach`);

    // Approach 2: generateLink and GET the action_link directly.
    // The action_link URL contains the hashed_token as the `token` query param.
    // GoTrue's GET /verify compares this hash directly against the DB — no double-hashing.
    // We follow the redirect manually and parse the access_token/refresh_token from the Location header fragment.
    const { data: targetUserData, error: userError } = await supabaseClient.auth.admin.getUserById(targetUserId);
    if (userError || !targetUserData?.user?.email) {
      return new Response(
        JSON.stringify({ error: "Target user not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { data: linkData, error: linkError } = await supabaseClient.auth.admin.generateLink({
      type: "magiclink",
      email: targetUserData.user.email,
    });

    if (linkError || !linkData?.properties?.action_link) {
      throw new Error(`Failed to generate link: ${linkError?.message}`);
    }

    const actionLink = linkData.properties.action_link;
    console.log("Action link generated, following redirect...");

    const linkRes = await fetch(actionLink, { redirect: "manual" });
    console.log(`Link response: status=${linkRes.status} type=${linkRes.type}`);

    const location = linkRes.headers.get("location");
    if (!location) {
      const body = await linkRes.text().catch(() => "");
      throw new Error(`No Location header in redirect. status=${linkRes.status} body=${body.substring(0, 300)}`);
    }

    // GoTrue redirects to: SITE_URL#access_token=...&refresh_token=...&type=magiclink&...
    const fragment = location.includes("#") ? location.split("#")[1] : new URL(location).search.substring(1);
    const tokenParams = new URLSearchParams(fragment);
    const access_token = tokenParams.get("access_token");
    const refresh_token = tokenParams.get("refresh_token");

    if (!access_token || !refresh_token) {
      throw new Error(`Tokens not found in redirect location: ${location.substring(0, 300)}`);
    }

    console.log(`Admin ${adminUserId} started impersonating user ${targetUserId} (link redirect)`);

    return new Response(
      JSON.stringify({ access_token, refresh_token, user: targetUserData.user }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in impersonate:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Internal Server Error",
      }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
