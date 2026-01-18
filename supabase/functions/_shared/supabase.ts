// @ts-ignore
import { createClient } from "jsr:@supabase/supabase-js@2";

export const createAuthClient = (authHeader: string) => createClient(
    // @ts-ignore
    Deno.env.get("SUPABASE_URL") ?? "",
    // @ts-ignore
    Deno.env.get("SUPABASE_ANON_KEY") ?? "",
    {
        global: {
            headers: { Authorization: authHeader },
        },
    }
);


export const supabaseClient = createClient(
    // @ts-ignore
    Deno.env.get("SUPABASE_URL") ?? "",
    // @ts-ignore
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
);

// Helper to verify user JWT and return service role client
export async function getAuthenticatedClient(authHeader: string | null) {
  console.log("Verifying token...");
  
  if (!authHeader) {
    throw new Error("Missing authorization header");
  }

  // Create client with the user's token
  const authClient = createAuthClient(authHeader);

  // Verify the user by asking Supabase Auth
  const { data: { user }, error } = await authClient.auth.getUser();
  
  if (error) {
    console.error("Token verification failed:", error);
    console.log("Auth Header Length:", authHeader.length);
    console.log("Auth Header Start:", authHeader.substring(0, 20));
    throw new Error(`Invalid JWT: ${error.message}`);
  }
  
  if (!user) {
    console.error("No user found for token");
    throw new Error("Invalid JWT: No user found");
  }
  
  console.log(`User verified: ${user.id}`);

  // Return service role client for querying analytics (bypasses RLS)
  return { supabase: supabaseClient, userId: user.id };
}
