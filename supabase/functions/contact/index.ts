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

// Verify reCAPTCHA token with Google
async function verifyCaptcha(token: string): Promise<boolean> {
  // @ts-ignore
  const secretKey = Deno.env.get("RECAPTCHA_SECRET_KEY");
  
  if (!secretKey) {
    console.error("RECAPTCHA_SECRET_KEY not configured");
    return false;
  }

  try {
    const response = await fetch(
      "https://www.google.com/recaptcha/api/siteverify",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: `secret=${secretKey}&response=${token}`,
      }
    );

    const data = await response.json();
    return data.success === true;
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
