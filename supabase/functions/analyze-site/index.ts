import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { getAuthenticatedClient } from "../_shared/supabase.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { analyzeSiteWithAi } from "../_shared/ai.ts";

const DEFAULT_COLORS = ["#68E5FD", "#A389E0"];
// @ts-ignore
Deno.serve(async (req: Request) => {

  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    const { supabase, userId } = await getAuthenticatedClient(authHeader);

    const { url: targetUrl, accountId } = await req.json();

    if (!targetUrl || !accountId) {
      throw new Error("Missing 'url' or 'accountId' in request body");
    }

    // Verify account ownership
    const { data: account, error: accountError } = await supabase
      .from("account")
      .select("user_id")
      .eq("id", accountId)
      .single();

    if (accountError || !account) {
      throw new Error("Account not found");
    }

    if (account.user_id !== userId) {
      throw new Error("Unauthorized: You do not have access to this account");
    }

    // 1. Scan the site
    console.log(`Scanning site: ${targetUrl}`);
    const siteRes = await fetch(targetUrl);
    if (!siteRes.ok) throw new Error(`Failed to fetch URL: ${siteRes.statusText}`);

    const html = await siteRes.text();
    const cleanText = cleanHtml(html);

    // iconUrl comes from initial scan
    const iconUrl = extractIconUrl(html, targetUrl);

    // 2. Analyze with AI
    const result = await analyzeSiteWithAi(cleanText);

    // Validate required fields
    if (!result.name) throw new Error("Could not determine website name");
    if (!result.language) throw new Error("Could not determine website language");
    if (!result.direction) throw new Error("Could not determine language direction");


    // Generate allowed URLs (base URL with and without www)
    const allowedUrls = generateAllowedUrls(targetUrl);

    // 3. Generate New Project
    const { data: project, error: insertError } = await supabase
      .from("project")
      .insert({
        account_id: accountId,
        client_name: result.name,
        client_description: result.description || "",
        language: result.language,
        direction: result.direction,
        icon_url: iconUrl,
        allowed_urls: allowedUrls,
        // Default settings
        input_text_placeholders: result.placeholders,
        highlight_color: DEFAULT_COLORS, // Defaults from UI
        show_ad: true // Default to showing ad/branding? or as per Requirement
      })
      .select()
      .single();

    if (insertError) {
      throw new Error(`Failed to create project: ${insertError.message}`);
    }

    return new Response(JSON.stringify(project), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Error in analyze-site:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Internal Server Error",
      }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

function extractIconUrl(html: string, targetUrl: string): string | null {
  let iconUrl = null;
  try {
    const extractMeta = (html: string, property: string) => {
      const regex1 = new RegExp(`<meta\\s+[^>]*property=["']${property}["'][^>]*content=["']([^"']+)["']`, 'i');
      const regex2 = new RegExp(`<meta\\s+[^>]*content=["']([^"']+)["'][^>]*property=["']${property}["']`, 'i');
      const regex3 = new RegExp(`<meta\\s+[^>]*name=["']${property}["'][^>]*content=["']([^"']+)["']`, 'i');
      const regex4 = new RegExp(`<meta\\s+[^>]*content=["']([^"']+)["'][^>]*name=["']${property}["']`, 'i');
      const match = html.match(regex1) || html.match(regex2) || html.match(regex3) || html.match(regex4);
      return match ? match[1] : null;
    };

    const extractLink = (html: string, rel: string) => {
      const regex = new RegExp(`<link\\s+[^>]*rel=["'](?:[^"']*\\s+)?${rel}(?:\\s+[^"']*)?["'][^>]*href=["']([^"']+)["']`, 'i');
      const match = html.match(regex);
      return match ? match[1] : null;
    }

    iconUrl = extractMeta(html, 'og:image') ||
      extractMeta(html, 'twitter:image') ||
      extractLink(html, 'apple-touch-icon') ||
      extractLink(html, 'icon') ||
      extractLink(html, 'shortcut icon');

    // Resolve relative URLs
    if (iconUrl && !iconUrl.startsWith('http') && !iconUrl.startsWith('data:')) {
      iconUrl = new URL(iconUrl, targetUrl).href;
    }
    console.log("Extracted icon URL:", iconUrl);
  } catch (err) {
    console.error("Error extracting icon:", err);
  }
  return iconUrl;
}

function cleanHtml(html: string): string {
  // Simple text extraction - removing scripts, styles, and tags
  // Limit to first 15000 chars to avoid token limits

  return html
    .replace(/<script\b[^>]*>([\s\S]*?)<\/script>/gim, "")
    .replace(/<style\b[^>]*>([\s\S]*?)<\/style>/gim, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .substring(0, 15000);
}

function generateAllowedUrls(targetUrl: string): string[] {
  const urlObj = new URL(targetUrl);
  const hostname = urlObj.hostname.replace(/^www\./, "");
  return [
    `${hostname}`,
    `www.${hostname}`
  ];
}