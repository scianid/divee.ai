import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { getAuthenticatedClient, supabaseClient } from "../_shared/supabase.ts";

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    const { supabase, userId } = await getAuthenticatedClient(authHeader);

    // Get request body
    const { accountId, email } = await req.json();

    if (!accountId || !email) {
      return new Response(
        JSON.stringify({ error: "Missing accountId or email" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Verify the requesting user owns the account
    const { data: account, error: accountError } = await supabase
      .from("account")
      .select("user_id")
      .eq("id", accountId)
      .single();

    if (accountError || !account) {
      return new Response(
        JSON.stringify({ error: "Account not found" }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (account.user_id !== userId) {
      return new Response(
        JSON.stringify({ error: "You do not have permission to invite collaborators to this account" }),
        {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Look up user by email using admin API
    const { data: { users }, error: userError } = await supabaseClient.auth.admin.listUsers();

    if (userError) {
      console.error("Error looking up users:", userError);
      return new Response(
        JSON.stringify({ error: "Failed to look up user" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const targetUser = users?.find((u: any) => u.email?.toLowerCase() === email.toLowerCase());

    if (!targetUser) {
      return new Response(
        JSON.stringify({ error: "No user found with that email address" }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Check if user is trying to add themselves
    if (targetUser.id === userId) {
      return new Response(
        JSON.stringify({ error: "You cannot add yourself as a collaborator" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Check if target user is the account owner
    if (targetUser.id === account.user_id) {
      return new Response(
        JSON.stringify({ error: "Cannot add the account owner as a collaborator" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Check if already a collaborator
    const { data: existingCollab } = await supabase
      .from("account_collaborator")
      .select("id")
      .eq("account_id", accountId)
      .eq("user_id", targetUser.id)
      .maybeSingle();

    if (existingCollab) {
      return new Response(
        JSON.stringify({ error: "User is already a collaborator on this account" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Add the collaborator
    const { data: newCollab, error: insertError } = await supabase
      .from("account_collaborator")
      .insert({
        account_id: accountId,
        user_id: targetUser.id,
        email: targetUser.email,
        role: "member",
        invited_by: userId,
      })
      .select()
      .single();

    if (insertError) {
      console.error("Error inserting collaborator:", insertError);
      return new Response(
        JSON.stringify({ error: "Failed to add collaborator" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    return new Response(
      JSON.stringify({ success: true, collaborator: newCollab }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Error in /invite-collaborator endpoint:", error);

    return new Response(
      JSON.stringify({
        error: error.message || "Internal server error",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
