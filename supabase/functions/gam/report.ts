import { getGamAccessToken, getNetworkCode } from "../_shared/gamAuth.ts";
import type { ReportParams, AggregatedData } from "./types.ts";
import {
  buildRunReportJobSoap,
  buildGetReportJobStatusSoap,
  buildGetReportDownloadUrlSoap,
  soapRequest,
  extractXmlValue,
} from "./soap.ts";

// Run a report on Google Ad Manager via SOAP
export async function runGamReport(params: ReportParams): Promise<string> {
  const accessToken = await getGamAccessToken();
  const networkCode = getNetworkCode();
  
  const soapBody = buildRunReportJobSoap(networkCode, params);
  const response = await soapRequest(accessToken, "runReportJob", soapBody);
  
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
export async function waitForReport(reportJobId: string, maxAttempts = 45): Promise<void> {
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

// Stream and aggregate CSV data without loading all into memory
export async function fetchAndAggregateReport(reportJobId: string): Promise<AggregatedData> {
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
