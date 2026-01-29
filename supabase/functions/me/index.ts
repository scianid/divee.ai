import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { getAuthenticatedClient } from "../_shared/supabase.ts";

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    const { supabase, userId } = await getAuthenticatedClient(authHeader);

    // Check if user is admin using service role client (bypasses RLS)
    const { data: adminData, error: adminError } = await supabase
      .from("admin_users")
      .select("user_id")
      .eq("user_id", userId)
      .maybeSingle();

    if (adminError) {
      console.error("Error checking admin status:", adminError);
      // Don't expose the error, just return non-admin
    }

    const isAdmin = !!adminData;

    return new Response(
      JSON.stringify({
        userId,
        isAdmin,
        role: isAdmin ? "admin" : "user",
      }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error: any) {
    console.error("Error in /me endpoint:", error);
    
    return new Response(
      JSON.stringify({
        error: error.message || "Internal server error",
      }),
      {
        status: error.message?.includes("Authorization") ? 401 : 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});
