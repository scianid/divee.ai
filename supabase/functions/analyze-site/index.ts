import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

// CORS headers
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Helper to verify user JWT and return service role client
async function getAuthenticatedClient(authHeader: string | null) {
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
  
  if (error || !user) {
    throw new Error("Invalid JWT: User not found");
  }
  
  // Return service role client for db operations (bypasses RLS logic if we want to handle it manually here, 
  // or we can just use the authClient if policies are set up. using service role as per stats pattern)
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  return { supabase, userId: user.id };
}

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

    // Extract icon/image (og:image, twitter:image, apple-touch-icon, icon)
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
    
    // Simple text extraction - removing scripts, styles, and tags
    // Limit to first 15000 chars to avoid token limits
    const cleanText = html
        .replace(/<script\b[^>]*>([\s\S]*?)<\/script>/gim, "")
        .replace(/<style\b[^>]*>([\s\S]*?)<\/style>/gim, "")
        .replace(/<[^>]+>/g, " ")
        .replace(/\s+/g, " ")
        .trim()
        .substring(0, 15000);

    // 2. Call DeepSeek API
    const deepseekKey = Deno.env.get("DEEPSEEK_API");
    if (!deepseekKey) throw new Error("Missing DEEPSEEK_API environment variable");

    console.log("Analyzing with DeepSeek...");
    const aiRes = await fetch("https://api.deepseek.com/chat/completions", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${deepseekKey}`
        },
        body: JSON.stringify({
            model: "deepseek-chat",
            messages: [
                { 
                    role: "system", 
                    content: "You are an intelligent web scraper assistant. Return only valid JSON." 
                },
                { 
                    role: "user", 
                    content: `Analyze the following website content. Provide a JSON object with:
                    - "language": use the full language name (e.g. "English", "French" etc)
                    - "name": The name of the website or brand.
                    - "description": A short description of the website (max 80 words) - in the detected language.
                    - "direction": "ltr" or "rtl" based on the language.
                    - "placeholders": Translate these 4 phrases into the detected language of the site: 
                      1. "Summarize this article"
                      2. "I can help you with this article!"
                      3. "Ask me anything on this content"
                      4. "What would you like to know?"
                      Return them as an array of strings.
                    
                    Content:
                    ${cleanText}` 
                }
            ],
            response_format: { type: "json_object" }
        })
    });

    if (!aiRes.ok) {
        const errText = await aiRes.text();
        console.error("DeepSeek API Error:", errText);
        throw new Error("Failed to get analysis from DeepSeek");
    }

    const aiData = await aiRes.json();
    const result = JSON.parse(aiData.choices[0].message.content);
    console.log("Analysis result:", result);

    // Validate required fields
    if (!result.name) throw new Error("Could not determine website name");
    if (!result.language) throw new Error("Could not determine website language");
    if (!result.direction) throw new Error("Could not determine language direction");
    // iconUrl comes from initial scan
    if (!iconUrl) throw new Error("Could not find website icon");

    // Generate allowed URLs (base URL with and without www)
    const urlObj = new URL(targetUrl);
    const hostname = urlObj.hostname.replace(/^www\./, "");
    const allowedUrls = [
      `${hostname}`,
      `www.${hostname}`
    ];

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
            highlight_color: ["#68E5FD", "#A389E0"], // Defaults from UI
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
