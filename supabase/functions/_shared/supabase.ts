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
  if (!authHeader) {
    throw new Error("Missing authorization header");
  }

  // Create client with the user's token
  const authClient = createAuthClient(authHeader);

  // Verify the user by asking Supabase Auth
  const { data: { user }, error } = await authClient.auth.getUser();
  
  if (error) {
    throw new Error(`Invalid JWT: ${error.message}`);
  }
  
  if (!user) {
    throw new Error("Invalid JWT: No user found");
  }

  // Return service role client for querying analytics (bypasses RLS)
  return { supabase: supabaseClient, userId: user.id };
}
