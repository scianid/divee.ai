import type { ReportParams } from "./types.ts";

// Google Ad Manager SOAP API endpoint
// Using latest API version (quarterly releases: v202502 = Feb 2025, etc.)
export const GAM_API_VERSION = "v202502";
export const GAM_SOAP_ENDPOINT = `https://ads.google.com/apis/ads/publisher/${GAM_API_VERSION}/ReportService`;

// Global Line Item ID filter - set to null to disable filtering
export const GAM_LINE_ITEM_ID: string | null = "7202316716";

// Parse date from ISO or YYYY-MM-DD format
function parseDate(dateStr: string): { year: number; month: number; day: number } {
  const date = new Date(dateStr);
  return {
    year: date.getFullYear(),
    month: date.getMonth() + 1, // 1-indexed
    day: date.getDate(),
  };
}

// Build statement filter for Line Item ID
function buildStatementFilter(): string {
  if (!GAM_LINE_ITEM_ID) return '';

  return `
          <gam:statement>
            <gam:query>WHERE LINE_ITEM_ID = :lineItemId</gam:query>
            <gam:values>
              <gam:key>lineItemId</gam:key>
              <gam:value xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:type="gam:NumberValue">
                <gam:value>${GAM_LINE_ITEM_ID}</gam:value>
              </gam:value>
            </gam:values>
          </gam:statement>`;
}

// Build SOAP envelope for runReportJob
export function buildRunReportJobSoap(networkCode: string, params: ReportParams): string {
  const startDate = parseDate(params.startDate);
  const endDate = parseDate(params.endDate);
  const statementFilter = buildStatementFilter();

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
          <gam:dimensions>AD_UNIT_NAME</gam:dimensions>
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
          <gam:dateRangeType>CUSTOM_DATE</gam:dateRangeType>${statementFilter}
        </gam:reportQuery>
      </gam:reportJob>
    </gam:runReportJob>
  </soapenv:Body>
</soapenv:Envelope>`;
}

// Build SOAP envelope for getReportJobStatus
export function buildGetReportJobStatusSoap(networkCode: string, reportJobId: string): string {
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
export function buildGetReportDownloadUrlSoap(networkCode: string, reportJobId: string): string {
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
export async function soapRequest(accessToken: string, soapAction: string, soapBody: string): Promise<string> {
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
export function extractXmlValue(xml: string, tagName: string): string | null {
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
