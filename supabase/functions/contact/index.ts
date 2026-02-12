import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { supabaseClient } from "../_shared/supabase.ts";

interface ContactFormData {
  name: string;
  email: string;
  phone?: string;
  company_name?: string;
  captchaToken: string;
}

// Verify reCAPTCHA Enterprise token with Google
async function verifyCaptcha(token: string, expectedAction: string = "CONTACT_FORM"): Promise<boolean> {
  // @ts-ignore
  const apiKey = Deno.env.get("RECAPTCHA_API_KEY");
  
  if (!apiKey) {
    console.error("RECAPTCHA_API_KEY not configured");
    return false;
  }

  const projectId = "divee-487210";

  try {
    const response = await fetch(
      `https://recaptchaenterprise.googleapis.com/v1/projects/${projectId}/assessments?key=${apiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          event: {
            token: token,
            expectedAction: expectedAction,
            siteKey: "6LfxcWgsAAAAAPfJRxGjWfrDJ22v-5EVltuWmKoY",
          },
        }),
      }
    );

    const data = await response.json();
    
    // Log the full response for debugging
    console.log("reCAPTCHA verification response:", JSON.stringify(data, null, 2));
    
    // Check if there's an error from the API
    if (data.error) {
      console.error("reCAPTCHA API error:", data.error);
      return false;
    }
    
    // Check if the token is valid and score is acceptable (0.0 - 1.0, higher is better)
    // Typically, 0.5 or higher is considered legitimate
    const tokenValid = data.tokenProperties?.valid === true;
    const actionMatches = data.tokenProperties?.action === expectedAction;
    const score = data.riskAnalysis?.score ?? 0;
    const scoreAcceptable = score >= 0.5;
    
    console.log("Validation details:", {
      tokenValid,
      actionMatches,
      expectedAction,
      actualAction: data.tokenProperties?.action,
      score,
      scoreAcceptable
    });
    
    const isValid = tokenValid && actionMatches && scoreAcceptable;
    
    return isValid;
  } catch (error) {
    console.error("Error verifying captcha:", error);
    return false;
  }
}

// Validate email format
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Sanitize input to prevent XSS
function sanitizeInput(input: string): string {
  return input.trim().replace(/[<>]/g, "");
}

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      {
        status: 405,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }

  try {
    // Parse request body
    const body: ContactFormData = await req.json();
    
    // Validate required fields
    if (!body.name || !body.email || !body.captchaToken) {
      return new Response(
        JSON.stringify({ 
          error: "Missing required fields: name, email, and captcha are required" 
        }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    // Validate email format
    if (!isValidEmail(body.email)) {
      return new Response(
        JSON.stringify({ error: "Invalid email format" }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    // Verify captcha
    const captchaValid = await verifyCaptcha(body.captchaToken);
    if (!captchaValid) {
      return new Response(
        JSON.stringify({ error: "Invalid captcha. Please try again." }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    // Sanitize inputs
    const sanitizedData = {
      name: sanitizeInput(body.name),
      email: sanitizeInput(body.email),
      phone: body.phone ? sanitizeInput(body.phone) : null,
      company_name: body.company_name ? sanitizeInput(body.company_name) : null,
      ip_address: req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || null,
      user_agent: req.headers.get("user-agent") || null,
    };

    // Insert into database using service role (bypasses RLS)
    const { data, error } = await supabaseClient
      .from("contact_submissions")
      .insert(sanitizedData)
      .select("id")
      .single();

    if (error) {
      console.error("Error inserting contact submission:", error);
      throw new Error("Failed to save contact submission");
    }

    console.log("Contact submission saved:", data.id);

    return new Response(
      JSON.stringify({ 
        success: true,
        message: "Thank you for contacting us! We'll get back to you soon."
      }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error: any) {
    console.error("Error in /contact endpoint:", error);
    
    return new Response(
      JSON.stringify({
        error: error.message || "Internal server error",
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});
