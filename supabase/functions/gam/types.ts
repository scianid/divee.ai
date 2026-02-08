export interface ReportParams {
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
}

export interface AggregatedData {
  byDate: Map<string, { impressions: number; revenue: number }>;
  totalImpressions: number;
  totalRevenue: number;
  rowCount: number;
}

export interface TimelineEntry {
  date: string;
  impressions: number;
  revenue: number;
}
