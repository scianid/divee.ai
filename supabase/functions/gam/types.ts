export interface ReportParams {
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
  siteName?: string; // Optional site filter
}

export interface AdUnitData {
  impressions: number;
  revenue: number;
}

export interface SiteData {
  impressions: number;
  revenue: number;
}

export interface AggregatedData {
  byDate: Map<string, { impressions: number; revenue: number }>;
  byAdUnit: Map<string, AdUnitData>;
  bySite: Map<string, SiteData>;
  totalImpressions: number;
  totalRevenue: number;
  rowCount: number;
}

export interface TimelineEntry {
  date: string;
  impressions: number;
  revenue: number;
}

export interface AdUnitEntry {
  adUnitName: string;
  impressions: number;
  revenue: number;
}

export interface SiteEntry {
  siteName: string;
  impressions: number;
  revenue: number;
}
