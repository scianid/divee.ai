import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { supabaseClient, getAuthenticatedClient } from "../_shared/supabase.ts";
import { corsHeaders } from "../_shared/cors.ts";

const DEFAULT_BATCH_SIZE = 20;
const MAX_BATCH_SIZE = 50;
const TAGGING_MODEL = "gpt-4o-mini";
const MAX_CONTENT_CHARS = 12000; // ~3000 tokens at ~4 chars/token

// @ts-ignore
const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");

interface ArticleTag {
  value: string;
  type: "category" | "person" | "place";
  confidence: number;
}

// @ts-ignore
Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    const url = new URL(req.url);
    const projectId = url.searchParams.get("projectId");
    const limit = Math.min(
      parseInt(url.searchParams.get("limit") || String(DEFAULT_BATCH_SIZE)),
      MAX_BATCH_SIZE
    );

    // Allow service role JWT (from cron) or authenticated admin
    let isServiceRole = false;
    const token = authHeader?.replace("Bearer ", "");
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split(".")[1]));
        isServiceRole = payload.role === "service_role";
      } catch {
        // Not a valid JWT — fall through to admin check
      }
    }

    if (!isServiceRole) {
      const { userId } = await getAuthenticatedClient(authHeader);

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
    }

    // Fetch untagged articles (tagged_at IS NULL AND tag_attempts < 3)
    let query = supabaseClient
      .from("article")
      .select("unique_id, project_id, title, content, tag_attempts")
      .is("tagged_at", null)
      .lt("tag_attempts", 3)
      .order("created_at", { ascending: true })
      .limit(limit);

    if (projectId) {
      query = query.eq("project_id", projectId);
    }

    const { data: articles, error: fetchError } = await query;

    if (fetchError) {
      throw new Error(`Failed to fetch articles: ${fetchError.message}`);
    }

    const results: Array<{
      article_id: string;
      status: "success" | "error";
      tag_count?: number;
      error?: string;
    }> = [];

    for (const article of articles || []) {
      try {
        const tags = await tagArticle(article);
        await storeTags(article.unique_id, article.project_id, tags);

        results.push({
          article_id: article.unique_id,
          status: "success",
          tag_count: tags.length,
        });
      } catch (err) {
        console.error(`Failed to tag article ${article.unique_id}:`, err);

        // Increment tag_attempts so persistently-failing articles don't block the queue
        await supabaseClient
          .from("article")
          .update({ tag_attempts: (article.tag_attempts ?? 0) + 1 })
          .eq("unique_id", article.unique_id);

        results.push({
          article_id: article.unique_id,
          status: "error",
          error: err instanceof Error ? err.message : "Unknown error",
        });
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        processed: articles?.length ?? 0,
        projectId,
        results,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in tag-articles function:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Internal server error",
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

async function tagArticle(article: {
  unique_id: string;
  title: string;
  content: string | null;
}): Promise<ArticleTag[]> {
  if (!OPENAI_API_KEY) {
    throw new Error("Missing OPENAI_API_KEY environment variable");
  }

  const truncatedContent = (article.content ?? "").slice(0, MAX_CONTENT_CHARS);

  const systemPrompt = `You are an editorial tagging engine. Given an article's title and content, return a JSON object with a "tags" array.

Tag types:
- "category": Broad editorial categories (e.g. Politics, Economy, Technology, AI, Health, Science, Sports, Entertainment, Automotive, Real Estate, Finance, Education, Environment, Military, Law)
- "person": Named individuals or companies mentioned prominently (e.g. Donald Trump, Elon Musk, Apple, Nike). Normalize to full canonical names.
- "place": Countries, cities, regions, or geopolitical entities the article is primarily about (e.g. United States, France, Lisbon, European Union, Middle East)

Rules:
- Return at most 5 tags total across all types.
- Only tag what is *central* to the article, not merely mentioned.
- Normalize person names to full canonical form (e.g. "Trump" → "Donald Trump").
- Prefer specific tags over generic ones when the article clearly warrants them.
- If nothing fits confidently, return fewer tags rather than guessing.
- Tags must be title-cased.
- IMPORTANT: Detect the language of the article and return all tag values in that same language. For example, if the article is in Hebrew, return Hebrew tag values; if in French, return French tag values; etc.

Response format (JSON only, no markdown):
{
  "tags": [
    { "value": "Politics", "type": "category", "confidence": 0.97 },
    { "value": "Donald Trump", "type": "person", "confidence": 0.95 }
  ]
}`;

  const userMessage = `Title: ${article.title}\n\nContent:\n${truncatedContent}`;

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: TAGGING_MODEL,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage },
      ],
      response_format: { type: "json_object" }
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`OpenAI API error ${response.status}: ${errorBody}`);
  }

  const result = await response.json();
  const parsed = JSON.parse(result.choices[0].message.content);

  if (!Array.isArray(parsed.tags)) {
    throw new Error("OpenAI returned malformed JSON: missing tags array");
  }

  // Validate and clamp to top 5
  const tags: ArticleTag[] = parsed.tags
    .filter(
      (t: any) =>
        typeof t.value === "string" &&
        ["category", "person", "place"].includes(t.type) &&
        typeof t.confidence === "number"
    )
    .slice(0, 5);

  return tags;
}

async function storeTags(
  articleUniqueId: string,
  projectId: string,
  tags: ArticleTag[]
) {
  if (tags.length > 0) {
    const { error: insertError } = await supabaseClient
      .from("article_tag")
      .upsert(
        tags.map((t) => ({
          article_unique_id: articleUniqueId,
          project_id: projectId,
          tag: t.value,
          tag_type: t.type,
          confidence: t.confidence,
        })),
        { onConflict: "article_unique_id,tag" }
      );

    if (insertError) {
      throw new Error(`Failed to insert tags: ${insertError.message}`);
    }
  }

  // Mark article as tagged regardless of tag count (an article with no good tags is still "tagged")
  const { error: updateError } = await supabaseClient
    .from("article")
    .update({ tagged_at: new Date().toISOString() })
    .eq("unique_id", articleUniqueId);

  if (updateError) {
    throw new Error(`Failed to mark article as tagged: ${updateError.message}`);
  }
}
