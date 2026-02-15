import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { getAuthenticatedClient } from "../_shared/supabase.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { supabaseClient } from "../_shared/supabase.ts";

const BATCH_SIZE = 50;
const ANALYSIS_MODEL = "gpt-4o-mini";
const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");

interface ConversationAnalysis {
  tags: Array<{ tag: string; confidence: number }>;
  engagement_score: number;
  business_score: number;
  content_score: number;
  sentiment_score: number;
  summary: string;
  key_insights: string[];
}

// @ts-ignore
Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");

    // Verify user authentication (admin only for manual trigger)
    const { supabase, userId } = await getAuthenticatedClient(authHeader);

    // Check if user is admin
    const { data: userData } = await supabase
      .from("user_profile")
      .select("is_admin")
      .eq("user_id", userId)
      .single();

    if (!userData?.is_admin) {
      return new Response(
        JSON.stringify({ error: "Unauthorized: Admin access required" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Parse query parameters
    const url = new URL(req.url);
    const projectId = url.searchParams.get("projectId");
    const limit = Math.min(
      parseInt(url.searchParams.get("limit") || String(BATCH_SIZE)),
      100
    );

    if (!projectId) {
      return new Response(
        JSON.stringify({ error: "projectId is required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Fetch unanalyzed conversations
    const { data: conversations, error: fetchError } = await supabaseClient
      .from("conversations")
      .select(
        `
        id,
        project_id,
        visitor_id,
        session_id,
        created_at,
        updated_at,
        messages,
        url,
        article_title,
        started_at,
        last_message_at
      `
      )
      .eq("project_id", projectId)
      .is("analyzed_at", null)
      .order("created_at", { ascending: true })
      .limit(limit);

    if (fetchError) {
      throw new Error(`Failed to fetch conversations: ${fetchError.message}`);
    }

    const results = [];

    // Analyze each conversation
    for (const conversation of conversations || []) {
      try {
        const analysis = await analyzeConversation(conversation);

        // Store analysis
        await storeAnalysis(conversation.id, conversation.project_id, analysis);

        results.push({
          conversation_id: conversation.id,
          status: "success",
          interest_score: analysis.interest_score,
        });
      } catch (err) {
        console.error(`Failed to analyze ${conversation.id}:`, err);
        results.push({
          conversation_id: conversation.id,
          status: "error",
          error: err instanceof Error ? err.message : "Unknown error",
        });
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        processed: conversations?.length || 0,
        projectId,
        results,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error in analyze-conversations function:", error);

    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Internal server error",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

async function analyzeConversation(
  conversation: any
): Promise<ConversationAnalysis & { interest_score: number }> {
  const context = prepareConversationContext(conversation);

  const systemPrompt = `You are analyzing user conversations with an AI article assistant.
Your task is to:
1. Identify relevant tags from the predefined taxonomy
2. Calculate component scores (0-100) for engagement, business value, content quality, and sentiment
3. Provide a brief summary and key insights

Tag taxonomy: content_gap, sell_potential, criticism, low_confidence, high_confidence,
factual_error, clarification_needed, deep_dive, related_topic, research_mode,
casual_browsing, expert_user, beginner_user, praise, frustrated, engaged, skeptical,
quick_exit, deep_conversation, suggestion_clicked, competitor_mention, feature_request,
pain_point, price_sensitivity, decision_making, mobile_user, returning_visitor

Return a JSON object with:
{
  "tags": [{"tag": "tag_name", "confidence": 0.95}],
  "engagement_score": 75,
  "business_score": 40,
  "content_score": 60,
  "sentiment_score": 50,
  "summary": "Brief summary",
  "key_insights": ["insight1", "insight2"]
}`;

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: ANALYSIS_MODEL,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: context },
      ],
      temperature: 0.3,
      response_format: { type: "json_object" },
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.statusText}`);
  }

  const result = await response.json();
  const analysis: ConversationAnalysis = JSON.parse(
    result.choices[0].message.content
  );

  // Calculate final interest score
  const interest_score = calculateInterestScore(
    analysis.engagement_score,
    analysis.business_score,
    analysis.content_score,
    analysis.sentiment_score
  );

  return { ...analysis, interest_score };
}

function calculateInterestScore(
  engagement: number,
  business: number,
  content: number,
  sentiment: number
): number {
  const weights = {
    engagement: 0.4,
    business: 0.3,
    content: 0.2,
    sentiment: 0.1,
  };

  return Math.round(
    engagement * weights.engagement +
      business * weights.business +
      content * weights.content +
      sentiment * weights.sentiment
  );
}

function prepareConversationContext(conversation: any): string {
  const messages = conversation.messages || [];
  const messageCount = messages.length;
  const duration = conversation.last_message_at && conversation.started_at
    ? new Date(conversation.last_message_at).getTime() -
      new Date(conversation.started_at).getTime()
    : 0;

  return `
Article: ${conversation.article_title || "Unknown"}
URL: ${conversation.url || "Unknown"}
Created: ${conversation.created_at}
Message Count: ${messageCount}
Duration: ${Math.round(duration / 1000)}s

Conversation:
${messages
    .map(
      (m: any, i: number) => `${i + 1}. ${m.role.toUpperCase()}: ${m.content}`
    )
    .join("\n")}
`;
}

async function storeAnalysis(
  conversationId: string,
  projectId: string,
  analysis: ConversationAnalysis & { interest_score: number }
) {
  // Insert analysis record
  const { error: analysisError } = await supabaseClient
    .from("conversation_analysis")
    .insert({
      conversation_id: conversationId,
      project_id: projectId,
      interest_score: analysis.interest_score,
      engagement_score: analysis.engagement_score,
      business_score: analysis.business_score,
      content_score: analysis.content_score,
      sentiment_score: analysis.sentiment_score,
      ai_summary: analysis.summary,
      key_insights: analysis.key_insights,
      analysis_version: ANALYSIS_MODEL,
    });

  if (analysisError) {
    console.error("Failed to insert analysis:", analysisError);
    throw analysisError;
  }

  // Insert tags
  if (analysis.tags && analysis.tags.length > 0) {
    const { error: tagsError } = await supabaseClient
      .from("conversation_tags")
      .insert(
        analysis.tags.map((t: any) => ({
          conversation_id: conversationId,
          tag: t.tag,
          confidence: t.confidence,
        }))
      );

    if (tagsError) {
      console.error("Failed to insert tags:", tagsError);
      // Don't throw - tags are not critical
    }
  }

  // Mark conversation as analyzed
  const { error: updateError } = await supabaseClient
    .from("conversations")
    .update({ analyzed_at: new Date().toISOString() })
    .eq("id", conversationId);

  if (updateError) {
    console.error("Failed to update analyzed_at:", updateError);
    throw updateError;
  }
}
