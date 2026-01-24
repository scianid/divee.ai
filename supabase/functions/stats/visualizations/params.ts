export interface StatsParams {
  accountId?: string;
  projectId?: string;
  startDate: string;
  endDate: string;
}

// Maximum number of rows to fetch from database queries for performance
export const QUERY_LIMIT = 10000;

// Helper to parse and validate query parameters
export function parseParams(url: URL): StatsParams {
  const accountId = url.searchParams.get("account_id");
  const projectId = url.searchParams.get("project_id");
  const startDate = url.searchParams.get("start_date");
  const endDate = url.searchParams.get("end_date");

  if (!startDate) {
    throw new Error("Missing required parameter: start_date");
  }
  if (!endDate) {
    throw new Error("Missing required parameter: end_date");
  }

  if (isNaN(Date.parse(startDate))) {
    throw new Error("Invalid format for parameter: start_date");
  }

  if (isNaN(Date.parse(endDate))) {
    throw new Error("Invalid format for parameter: end_date");
  }

  return { accountId: accountId || undefined, projectId: projectId || undefined, startDate, endDate };
}
