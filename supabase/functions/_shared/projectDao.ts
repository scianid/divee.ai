// Helper to get project IDs for a user (and optionally specific account or project)
export async function getProjectIdsForUser(supabase: any, userId: string, accountId?: string, projectId?: string): Promise<string[]> {
  // If a specific project is requested, verify access and return just that project
  if (projectId) {
    // Get owned accounts
    const { data: ownedAccounts, error: ownedError } = await supabase
      .from("account")
      .select("id")
      .eq("user_id", userId);

    if (ownedError) {
      throw new Error(`Failed to fetch user accounts: ${ownedError.message}`);
    }

    // Get collaborated accounts
    const { data: collaboratedAccounts, error: collabError } = await supabase
      .from("account_collaborator")
      .select("account_id")
      .eq("user_id", userId);

    if (collabError) {
      throw new Error(`Failed to fetch collaborated accounts: ${collabError.message}`);
    }

    const ownedIds = ownedAccounts?.map((a: any) => a.id) || [];
    const collaboratedIds = collaboratedAccounts?.map((a: any) => a.account_id) || [];
    const userAccountIds = [...new Set([...ownedIds, ...collaboratedIds])];

    if (userAccountIds.length === 0) {
      return []; // User has no accounts
    }

    // Verify the project belongs to one of the user's accounts
    const { data: project, error: projectError } = await supabase
      .from("project")
      .select("project_id, account_id")
      .eq("project_id", projectId)
      .single();

    if (projectError || !project) {
      throw new Error("Project not found or access denied.");
    }

    if (!userAccountIds.includes(project.account_id)) {
      throw new Error("Unauthorized: You do not have access to this project.");
    }

    return [projectId];
  }

  // 1. Get owned accounts
  const { data: ownedAccounts, error: ownedError } = await supabase
    .from("account")
    .select("id")
    .eq("user_id", userId);

  if (ownedError) {
    throw new Error(`Failed to fetch user accounts: ${ownedError.message}`);
  }

  // 2. Get collaborated accounts
  const { data: collaboratedAccounts, error: collabError } = await supabase
    .from("account_collaborator")
    .select("account_id")
    .eq("user_id", userId);

  if (collabError) {
    throw new Error(`Failed to fetch collaborated accounts: ${collabError.message}`);
  }

  const ownedIds = ownedAccounts?.map((a: any) => a.id) || [];
  const collaboratedIds = collaboratedAccounts?.map((a: any) => a.account_id) || [];
  const userAccountIds = [...new Set([...ownedIds, ...collaboratedIds])];

  if (userAccountIds.length === 0) {
    return []; // User has no accounts
  }

  // 3. If a specific account was requested, verify access
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

  // 4. Otherwise, fetch projects for ALL user accounts (owned + collaborated)
  const { data, error } = await supabase
    .from("project")
    .select("project_id")
    .in("account_id", userAccountIds);

  if (error) {
    throw new Error(`Failed to fetch projects: ${error.message}`);
  }

  return data?.map((p: any) => p.project_id) || [];
}