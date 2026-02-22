import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { getAuthenticatedClient, supabaseClient } from "../_shared/supabase.ts";
import { corsHeaders } from "../_shared/cors.ts";

function sanitize(input: string): string {
  return input.trim().replace(/[<>]/g, "");
}

// @ts-ignore
Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    const { supabase, userId } = await getAuthenticatedClient(authHeader);

    // Get user email from auth
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) throw new Error("Failed to get user info");

    const body = await req.json();
    const { phone, company_name, notes } = body;

    const { error: insertError } = await supabaseClient
      .from("contact_submissions")
      .insert({
        name: sanitize(user.email ?? ""),
        email: user.email ?? "",
        phone: phone ? sanitize(phone) : null,
        company_name: company_name ? sanitize(company_name) : null,
        notes: notes ? sanitize(notes) : null,
        user_id: userId,
        ip_address: req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || null,
        user_agent: req.headers.get("user-agent") || null,
      });

    if (insertError) {
      throw new Error(`Failed to save details: ${insertError.message}`);
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in request-authorization:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Internal Server Error" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
