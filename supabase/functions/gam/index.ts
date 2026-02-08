import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { getAuthenticatedClient } from "../_shared/supabase.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { getGamAccessToken, getNetworkCode } from "../_shared/gamAuth.ts";

// Google Ad Manager SOAP API endpoint
// Using latest API version (quarterly releases: v202502 = Feb 2025, etc.)
const GAM_API_VERSION = "v202502";
const GAM_SOAP_ENDPOINT = `https://ads.google.com/apis/ads/publisher/${GAM_API_VERSION}/ReportService`;

interface ReportParams {
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
}

interface ReportRow {
  date: string;
  adUnitName: string;
  country: string;
  impressions: number;
  revenue: number; // in micros, will convert to dollars
}

// Parse date from ISO or YYYY-MM-DD format
function parseDate(dateStr: string): { year: number; month: number; day: number } {
  const date = new Date(dateStr);
  return {
    year: date.getFullYear(),
    month: date.getMonth() + 1, // 1-indexed
    day: date.getDate(),
  };
}

// Build SOAP envelope for runReportJob
function buildRunReportJobSoap(networkCode: string, params: ReportParams): string {
  const startDate = parseDate(params.startDate);
  const endDate = parseDate(params.endDate);
  
  return `<?xml version="1.0" encoding="UTF-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:gam="https://www.google.com/apis/ads/publisher/${GAM_API_VERSION}">
  <soapenv:Header>
    <gam:RequestHeader>
      <gam:networkCode>${networkCode}</gam:networkCode>
      <gam:applicationName>Divee.AI</gam:applicationName>
    </gam:RequestHeader>
  </soapenv:Header>
  <soapenv:Body>
    <gam:runReportJob>
      <gam:reportJob>
        <gam:reportQuery>
          <gam:dimensions>DATE</gam:dimensions>
          <gam:adUnitView>FLAT</gam:adUnitView>
          <gam:columns>TOTAL_LINE_ITEM_LEVEL_IMPRESSIONS</gam:columns>
          <gam:columns>TOTAL_LINE_ITEM_LEVEL_CPM_AND_CPC_REVENUE</gam:columns>
          <gam:startDate>
            <gam:year>${startDate.year}</gam:year>
            <gam:month>${startDate.month}</gam:month>
            <gam:day>${startDate.day}</gam:day>
          </gam:startDate>
          <gam:endDate>
            <gam:year>${endDate.year}</gam:year>
            <gam:month>${endDate.month}</gam:month>
            <gam:day>${endDate.day}</gam:day>
          </gam:endDate>
          <gam:dateRangeType>CUSTOM_DATE</gam:dateRangeType>
        </gam:reportQuery>
      </gam:reportJob>
    </gam:runReportJob>
  </soapenv:Body>
</soapenv:Envelope>`;
}

// Build SOAP envelope for getReportJobStatus
function buildGetReportJobStatusSoap(networkCode: string, reportJobId: string): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:gam="https://www.google.com/apis/ads/publisher/${GAM_API_VERSION}">
  <soapenv:Header>
    <gam:RequestHeader>
      <gam:networkCode>${networkCode}</gam:networkCode>
      <gam:applicationName>Divee.AI</gam:applicationName>
    </gam:RequestHeader>
  </soapenv:Header>
  <soapenv:Body>
    <gam:getReportJobStatus>
      <gam:reportJobId>${reportJobId}</gam:reportJobId>
    </gam:getReportJobStatus>
  </soapenv:Body>
</soapenv:Envelope>`;
}

// Build SOAP envelope for getReportDownloadUrlWithOptions
function buildGetReportDownloadUrlSoap(networkCode: string, reportJobId: string): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:gam="https://www.google.com/apis/ads/publisher/${GAM_API_VERSION}">
  <soapenv:Header>
    <gam:RequestHeader>
      <gam:networkCode>${networkCode}</gam:networkCode>
      <gam:applicationName>Divee.AI</gam:applicationName>
    </gam:RequestHeader>
  </soapenv:Header>
  <soapenv:Body>
    <gam:getReportDownloadUrlWithOptions>
      <gam:reportJobId>${reportJobId}</gam:reportJobId>
      <gam:reportDownloadOptions>
        <gam:exportFormat>CSV_DUMP</gam:exportFormat>
        <gam:includeReportProperties>false</gam:includeReportProperties>
        <gam:includeTotalsRow>false</gam:includeTotalsRow>
        <gam:useGzipCompression>true</gam:useGzipCompression>
      </gam:reportDownloadOptions>
    </gam:getReportDownloadUrlWithOptions>
  </soapenv:Body>
</soapenv:Envelope>`;
}

// Make SOAP request
async function soapRequest(accessToken: string, soapAction: string, soapBody: string): Promise<string> {
  console.log(`SOAP Request to: ${GAM_SOAP_ENDPOINT}`);
  console.log(`SOAPAction: ${soapAction}`);
  
  const response = await fetch(GAM_SOAP_ENDPOINT, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${accessToken}`,
      "Content-Type": "text/xml; charset=utf-8",
      "SOAPAction": soapAction,
    },
    body: soapBody,
  });
  
  const responseText = await response.text();
  
  if (!response.ok) {
    console.error("SOAP Error Response:", responseText);
    throw new Error(`SOAP request failed: ${response.status} - ${responseText.substring(0, 500)}`);
  }
  
  return responseText;
}

// Extract value from XML using simple regex (avoiding XML parser dependency)
function extractXmlValue(xml: string, tagName: string): string | null {
  // Handle both namespaced and non-namespaced tags
  const patterns = [
    new RegExp(`<[^>]*:${tagName}[^>]*>([^<]*)<`, 'i'),
    new RegExp(`<${tagName}[^>]*>([^<]*)<`, 'i'),
  ];
  
  for (const pattern of patterns) {
    const match = xml.match(pattern);
    if (match) return match[1];
  }
  return null;
}

// Run a report on Google Ad Manager via SOAP
async function runGamReport(params: ReportParams): Promise<string> {
  const accessToken = await getGamAccessToken();
  const networkCode = getNetworkCode();
  
  const soapBody = buildRunReportJobSoap(networkCode, params);
  const response = await soapRequest(
    accessToken, 
    "runReportJob", 
    soapBody
  );
  
  // Extract reportJobId from response
  const reportJobId = extractXmlValue(response, "id");
  if (!reportJobId) {
    console.error("Full response:", response);
    throw new Error("Failed to extract reportJobId from response");
  }
  
  console.log(`Report job started: ${reportJobId}`);
  return reportJobId;
}

// Poll for report completion
async function waitForReport(reportJobId: string, maxAttempts = 45): Promise<void> {
  const accessToken = await getGamAccessToken();
  const networkCode = getNetworkCode();
  
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const soapBody = buildGetReportJobStatusSoap(networkCode, reportJobId);
    const response = await soapRequest(accessToken, "getReportJobStatus", soapBody);
    
    // Extract status from response - try multiple tag names
    let status = extractXmlValue(response, "rval");
    if (!status) {
      status = extractXmlValue(response, "getReportJobStatusResponse");
    }
    console.log(`Report status (attempt ${attempt + 1}/${maxAttempts}): ${status || 'unknown'}`);
    console.log(`Response snippet: ${response.substring(0, 500)}`);
    
    if (status === "COMPLETED") {
      return;
    }
    
    if (status === "FAILED") {
      throw new Error("Report job failed");
    }
    
    // Wait 2 seconds before next poll
    await new Promise((resolve) => setTimeout(resolve, 2000));
  }
  
  throw new Error("Report timed out after maximum attempts");
}

// Get report download URL and fetch CSV
interface AggregatedData {
  byDate: Map<string, { impressions: number; revenue: number }>;
  totalImpressions: number;
  totalRevenue: number;
  rowCount: number;
}

// Stream and aggregate CSV data without loading all into memory
async function fetchAndAggregateReport(reportJobId: string): Promise<AggregatedData> {
  const accessToken = await getGamAccessToken();
  const networkCode = getNetworkCode();
  
  const soapBody = buildGetReportDownloadUrlSoap(networkCode, reportJobId);
  const response = await soapRequest(accessToken, "getReportDownloadUrlWithOptions", soapBody);
  
  // Extract download URL from response
  let downloadUrl = extractXmlValue(response, "rval");
  if (!downloadUrl) {
    console.error("Full response:", response);
    throw new Error("Failed to extract download URL from response");
  }
  
  // Decode XML entities in the URL
  downloadUrl = downloadUrl
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"');
  
  console.log(`Downloading report from: ${downloadUrl}`);
  
  // Download the gzipped CSV
  let csvResponse = await fetch(downloadUrl);
  if (csvResponse.status === 403 || csvResponse.status === 401) {
    console.log("Retrying download with Authorization header...");
    csvResponse = await fetch(downloadUrl, {
      headers: {
        "Authorization": `Bearer ${accessToken}`,
      },
    });
  }
  
  if (!csvResponse.ok) {
    const errorText = await csvResponse.text();
    console.error(`Download failed: ${csvResponse.status} - ${errorText.substring(0, 500)}`);
    throw new Error(`Failed to download report: ${csvResponse.status}`);
  }
  
  // Decompress gzip and process as stream
  const body = csvResponse.body;
  if (!body) {
    throw new Error("No response body");
  }
  
  // Decompress gzip stream
  const decompressedStream = body.pipeThrough(new DecompressionStream("gzip"));
  const reader = decompressedStream.getReader();
  const decoder = new TextDecoder();
  
  // Initialize aggregation
  const data: AggregatedData = {
    byDate: new Map(),
    totalImpressions: 0,
    totalRevenue: 0,
    rowCount: 0,
  };
  
  let buffer = "";
  let headerSkipped = false;
  
  // Process stream in chunks
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    
    // Keep last incomplete line in buffer
    buffer = lines.pop() || "";
    
    for (const line of lines) {
      if (!headerSkipped) {
        headerSkipped = true;
        continue;
      }
      
      if (!line.trim()) continue;
      
      // CSV columns: DATE, IMPRESSIONS, REVENUE
      const values = line.split(",");
      if (values.length >= 3) {
        const date = values[0]?.trim() || "";
        const impressions = parseInt(values[1]?.trim() || "0", 10);
        const revenue = parseFloat(values[2]?.trim() || "0") / 1000000;
        
        // Aggregate by date
        const dateEntry = data.byDate.get(date) || { impressions: 0, revenue: 0 };
        dateEntry.impressions += impressions;
        dateEntry.revenue += revenue;
        data.byDate.set(date, dateEntry);
        
        // Totals
        data.totalImpressions += impressions;
        data.totalRevenue += revenue;
        data.rowCount++;
      }
    }
  }
  
  // Process any remaining buffer
  if (buffer.trim() && headerSkipped) {
    const values = buffer.split(",");
    if (values.length >= 3) {
      const date = values[0]?.trim() || "";
      const impressions = parseInt(values[1]?.trim() || "0", 10);
      const revenue = parseFloat(values[2]?.trim() || "0") / 1000000;
      
      const dateEntry = data.byDate.get(date) || { impressions: 0, revenue: 0 };
      dateEntry.impressions += impressions;
      dateEntry.revenue += revenue;
      data.byDate.set(date, dateEntry);
      
      data.totalImpressions += impressions;
      data.totalRevenue += revenue;
      data.rowCount++;
    }
  }
  
  console.log(`Processed ${data.rowCount} rows`);
  return data;
}
// Main handler
// @ts-ignore
Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  
  try {
    const url = new URL(req.url);
    const authHeader = req.headers.get("Authorization");
    
    // Verify user authentication
    await getAuthenticatedClient(authHeader);
    
    // Parse query parameters
    const startDate = url.searchParams.get("start_date");
    const endDate = url.searchParams.get("end_date");
    
    if (!startDate || !endDate) {
      return new Response(
        JSON.stringify({
          error: "Missing required parameters: start_date and end_date",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }
    
    const params: ReportParams = {
      startDate: startDate.split("T")[0], // Normalize to YYYY-MM-DD
      endDate: endDate.split("T")[0],
    };
    
    console.log(`Running GAM report for ${params.startDate} to ${params.endDate}`);
    
    // Run the report via SOAP API
    const reportJobId = await runGamReport(params);
    
    // Wait for completion
    await waitForReport(reportJobId);
    console.log("Report job completed");
    
    // Fetch and aggregate results (streaming to save memory)
    const data = await fetchAndAggregateReport(reportJobId);
    console.log(`Processed ${data.rowCount} rows`);
    
    // Convert Maps to sorted arrays
    const timeline = Array.from(data.byDate.entries())
      .map(([date, d]) => ({ date, impressions: d.impressions, revenue: d.revenue }))
      .sort((a, b) => a.date.localeCompare(b.date));
    
    return new Response(
      JSON.stringify({
        totalImpressions: data.totalImpressions,
        totalRevenue: Math.round(data.totalRevenue * 100) / 100, // Round to cents
        timeline,
        rowCount: data.rowCount,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("GAM Error:", error);
    
    const statusCode = error instanceof Error && error.message.includes("Missing authorization") 
      ? 401 
      : 500;
    
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Internal server error",
      }),
      {
        status: statusCode,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
