import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { getAuthenticatedClient, supabaseClient } from "../_shared/supabase.ts";
import { corsHeaders } from "../_shared/cors.ts";

// Verify a user has access to a given account (owns it or is a collaborator)
async function getUserAccountIds(userId: string): Promise<string[]> {
  const [{ data: owned }, { data: collab }] = await Promise.all([
    supabaseClient.from("account").select("id").eq("user_id", userId),
    supabaseClient.from("account_collaborator").select("account_id").eq("user_id", userId),
  ]);
  const ids = [
    ...((owned ?? []).map((a: any) => a.id)),
    ...((collab ?? []).map((a: any) => a.account_id)),
  ];
  return [...new Set(ids)];
}

function isAdmin(userId: string, adminData: any): boolean {
  return !!adminData;
}

// @ts-ignore
Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    const { userId } = await getAuthenticatedClient(authHeader);

    // Check admin status
    const { data: adminData } = await supabaseClient
      .from("admin_users")
      .select("user_id")
      .eq("user_id", userId)
      .maybeSingle();
    const userIsAdmin = isAdmin(userId, adminData);

    const accountIds = await getUserAccountIds(userId);

    // ── LIST ────────────────────────────────────────────────────────────────
    if (req.method === "GET") {
      if (accountIds.length === 0) {
        return json({ projects: [] });
      }

      const { data: projects, error } = await supabaseClient
        .from("project")
        .select("*")
        .in("account_id", accountIds)
        .order("created_at", { ascending: false });

      if (error) throw new Error(error.message);

      let result = projects ?? [];

      // Merge admin-only config fields
      if (userIsAdmin && result.length > 0) {
        const uuids = result.map((p: any) => p.project_id);
        const { data: configData } = await supabaseClient
          .from("project_config")
          .select("project_id, ad_tag_id, override_mobile_ad_size, override_desktop_ad_size")
          .in("project_id", uuids);

        if (configData) {
          const configMap = new Map(configData.map((c: any) => [c.project_id, c]));
          result = result.map((p: any) => ({
            ...p,
            ad_tag_id: configMap.get(p.project_id)?.ad_tag_id ?? "",
            override_mobile_ad_size: configMap.get(p.project_id)?.override_mobile_ad_size ?? "",
            override_desktop_ad_size: configMap.get(p.project_id)?.override_desktop_ad_size ?? "",
          }));
        }
      }

      return json({ projects: result });
    }

    // ── CREATE ──────────────────────────────────────────────────────────────
    if (req.method === "POST") {
      const body = await req.json();
      const { admin_fields, ...payload } = body;

      // Verify user owns/collaborates on the target account
      if (!accountIds.includes(payload.account_id)) {
        return error403("You do not have access to this account");
      }

      const { data, error: insertError } = await supabaseClient
        .from("project")
        .insert([payload])
        .select()
        .single();

      if (insertError) throw new Error(insertError.message);

      // Save admin config fields if provided and caller is admin
      if (userIsAdmin && admin_fields && data) {
        await upsertProjectConfig(data.project_id, admin_fields);
      }

      return json({ project: data });
    }

    // ── UPDATE ──────────────────────────────────────────────────────────────
    if (req.method === "PATCH") {
      const body = await req.json();
      const { project_id, admin_fields, ...payload } = body;

      if (!project_id) return error400("project_id is required");

      // Verify ownership
      const { data: existing } = await supabaseClient
        .from("project")
        .select("account_id")
        .eq("project_id", project_id)
        .maybeSingle();

      if (!existing || !accountIds.includes(existing.account_id)) {
        return error403("You do not have access to this project");
      }

      const { data, error: updateError } = await supabaseClient
        .from("project")
        .update(payload)
        .eq("project_id", project_id)
        .select()
        .single();

      if (updateError) throw new Error(updateError.message);

      if (userIsAdmin && admin_fields && data) {
        await upsertProjectConfig(project_id, admin_fields);
      }

      return json({ project: data });
    }

    // ── DELETE ──────────────────────────────────────────────────────────────
    if (req.method === "DELETE") {
      const { project_id } = await req.json();
      if (!project_id) return error400("project_id is required");

      // Verify ownership
      const { data: existing } = await supabaseClient
        .from("project")
        .select("account_id")
        .eq("project_id", project_id)
        .maybeSingle();

      if (!existing || !accountIds.includes(existing.account_id)) {
        return error403("You do not have access to this project");
      }

      const { error: deleteError } = await supabaseClient
        .from("project")
        .delete()
        .eq("project_id", project_id);

      if (deleteError) throw new Error(deleteError.message);

      return json({ success: true });
    }

    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Error in projects function:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Internal Server Error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

// ── Helpers ────────────────────────────────────────────────────────────────

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function error400(msg: string) {
  return new Response(JSON.stringify({ error: msg }), {
    status: 400,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function error403(msg: string) {
  return new Response(JSON.stringify({ error: msg }), {
    status: 403,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function upsertProjectConfig(projectId: string, fields: any) {
  const config = {
    project_id: projectId,
    ad_tag_id: fields.ad_tag_id ?? null,
    override_mobile_ad_size: fields.override_mobile_ad_size ?? null,
    override_desktop_ad_size: fields.override_desktop_ad_size ?? null,
  };

  const { data: existing } = await supabaseClient
    .from("project_config")
    .select("id")
    .eq("project_id", projectId)
    .maybeSingle();

  if (existing) {
    await supabaseClient.from("project_config").update(config).eq("project_id", projectId);
  } else if (fields.ad_tag_id || fields.override_mobile_ad_size || fields.override_desktop_ad_size) {
    await supabaseClient.from("project_config").insert([config]);
  }
}
