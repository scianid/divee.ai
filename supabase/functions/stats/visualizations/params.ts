export interface StatsParams {
  accountId?: string;
  startDate: string;
  endDate: string;
}

// Helper to parse and validate query parameters
export function parseParams(url: URL): StatsParams {
  const accountId = url.searchParams.get("account_id");
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

  return { accountId: accountId || undefined, startDate, endDate };
}
