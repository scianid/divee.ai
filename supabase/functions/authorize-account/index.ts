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
    const { userId } = await getAuthenticatedClient(authHeader);

    // Verify caller is an admin
    const { data: adminData } = await supabaseClient
      .from("admin_users")
      .select("user_id")
      .eq("user_id", userId)
      .maybeSingle();

    if (!adminData) {
      return new Response(
        JSON.stringify({ error: "Unauthorized: Admin access required" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { userId: targetUserId, authorized } = await req.json();

    if (!targetUserId || typeof authorized !== "boolean") {
      return new Response(
        JSON.stringify({ error: "userId (string) and authorized (boolean) are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (authorized) {
      const { error: insertError } = await supabaseClient
        .from("authorized_users")
        .upsert({ user_id: targetUserId, authorized_by: userId }, { onConflict: "user_id" });

      if (insertError) {
        throw new Error(`Failed to authorize user: ${insertError.message}`);
      }
    } else {
      const { error: deleteError } = await supabaseClient
        .from("authorized_users")
        .delete()
        .eq("user_id", targetUserId);

      if (deleteError) {
        throw new Error(`Failed to revoke authorization: ${deleteError.message}`);
      }
    }

    return new Response(JSON.stringify({ success: true, userId: targetUserId, authorized }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in authorize-account:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Internal Server Error",
      }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
