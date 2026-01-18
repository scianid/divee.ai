// Helper to get project IDs for a user (and optionally specific account)
export async function getProjectIdsForUser(supabase: any, userId: string, accountId?: string): Promise<string[]> {
  // 1. Get all accounts for this user
  const { data: accounts, error: accountError } = await supabase
    .from("account")
    .select("id")
    .eq("user_id", userId);

  if (accountError) {
    throw new Error(`Failed to fetch user accounts: ${accountError.message}`);
  }

  const userAccountIds = accounts?.map((a: any) => a.id) || [];

  if (userAccountIds.length === 0) {
    return []; // User has no accounts
  }

  // 2. If a specific account was requested, verify access
  if (accountId) {
    if (!userAccountIds.includes(accountId)) {
      throw new Error("Unauthorized: You do not have access to this account.");
    }
    
    // Fetch projects for this validated account
    const { data, error } = await supabase
      .from("project")
      .select("project_id")
      .eq("account_id", accountId);

    if (error) {
      throw new Error(`Failed to fetch projects: ${error.message}`);
    }
    
    return data?.map((p: any) => p.project_id) || [];
  }

  // 3. Otherwise, fetch projects for ALL user accounts
  const { data, error } = await supabase
    .from("project")
    .select("project_id")
    .in("account_id", userAccountIds);

  if (error) {
    throw new Error(`Failed to fetch projects: ${error.message}`);
  }

  return data?.map((p: any) => p.project_id) || [];
}