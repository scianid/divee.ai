// Google Ad Manager OAuth2 Service Account Authentication
// Uses JWT assertion to get access token for GAM REST API

interface ServiceAccountCredentials {
  type: string;
  project_id: string;
  private_key_id: string;
  private_key: string;
  client_email: string;
  client_id: string;
  auth_uri: string;
  token_uri: string;
  auth_provider_x509_cert_url: string;
  client_x509_cert_url: string;
}

interface TokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

// Convert base64url string to Uint8Array
function base64UrlEncode(data: Uint8Array): string {
  return btoa(String.fromCharCode(...data))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

// Import RSA private key from PEM format
async function importPrivateKey(pemKey: string): Promise<CryptoKey> {
  // Remove PEM headers and clean up whitespace
  const pemContents = pemKey
    .replace(/-----BEGIN PRIVATE KEY-----/g, '')
    .replace(/-----END PRIVATE KEY-----/g, '')
    .replace(/\s/g, '');
  
  // Decode base64 to binary
  const binaryString = atob(pemContents);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  
  // Import as RSA key for RS256
  return await crypto.subtle.importKey(
    'pkcs8',
    bytes.buffer,
    {
      name: 'RSASSA-PKCS1-v1_5',
      hash: 'SHA-256',
    },
    false,
    ['sign']
  );
}

// Create signed JWT for Google OAuth2
async function createSignedJwt(
  credentials: ServiceAccountCredentials,
  scope: string
): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const expiry = now + 3600; // 1 hour
  
  const header = {
    alg: 'RS256',
    typ: 'JWT',
  };
  
  const payload = {
    iss: credentials.client_email,
    scope: scope,
    aud: credentials.token_uri,
    iat: now,
    exp: expiry,
  };
  
  // Encode header and payload
  const encoder = new TextEncoder();
  const headerB64 = base64UrlEncode(encoder.encode(JSON.stringify(header)));
  const payloadB64 = base64UrlEncode(encoder.encode(JSON.stringify(payload)));
  
  // Create signing input
  const signingInput = `${headerB64}.${payloadB64}`;
  
  // Import private key and sign
  const privateKey = await importPrivateKey(credentials.private_key);
  const signature = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    privateKey,
    encoder.encode(signingInput)
  );
  
  // Encode signature
  const signatureB64 = base64UrlEncode(new Uint8Array(signature));
  
  return `${signingInput}.${signatureB64}`;
}

// Exchange JWT for access token
async function exchangeJwtForToken(
  jwt: string,
  tokenUri: string
): Promise<TokenResponse> {
  const response = await fetch(tokenUri, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt,
    }),
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Token exchange failed: ${response.status} - ${errorText}`);
  }
  
  return response.json();
}

// Cache for access token
let cachedToken: { token: string; expiry: number } | null = null;

// Get valid access token (with caching)
export async function getGamAccessToken(): Promise<string> {
  // Check if we have a valid cached token (with 5 min buffer)
  if (cachedToken && cachedToken.expiry > Date.now() + 5 * 60 * 1000) {
    return cachedToken.token;
  }
  
  // Get service account credentials from environment
  // @ts-ignore
  const credentialsJson = Deno.env.get('GAM_SERVICE_ACCOUNT_JSON');
  if (!credentialsJson) {
    throw new Error('GAM_SERVICE_ACCOUNT_JSON environment variable not set');
  }
  
  // Trim whitespace and newlines
  const trimmedJson = credentialsJson.trim().replace(/\s+/g, '');
  
  let credentials: ServiceAccountCredentials;
  try {
    // Try to parse directly (if stored as JSON string)
    credentials = JSON.parse(trimmedJson);
  } catch (jsonError) {
    // Try to decode from base64 first
    try {
      const decoded = atob(trimmedJson);
      credentials = JSON.parse(decoded);
    } catch (base64Error) {
      console.error('JSON parse error:', jsonError);
      console.error('Base64 decode error:', base64Error);
      console.error('Credential string length:', credentialsJson.length);
      console.error('First 50 chars:', credentialsJson.substring(0, 50));
      throw new Error('GAM_SERVICE_ACCOUNT_JSON is not valid JSON or base64-encoded JSON');
    }
  }
  
  // Create and sign JWT
  const scope = 'https://www.googleapis.com/auth/admanager';
  const jwt = await createSignedJwt(credentials, scope);
  
  // Exchange for access token
  const tokenResponse = await exchangeJwtForToken(jwt, credentials.token_uri);
  
  // Cache the token
  cachedToken = {
    token: tokenResponse.access_token,
    expiry: Date.now() + tokenResponse.expires_in * 1000,
  };
  
  return cachedToken.token;
}

// Get network code from environment
export function getNetworkCode(): string {
  // @ts-ignore
  const networkCode = Deno.env.get('GAM_NETWORK_CODE');
  if (!networkCode) {
    throw new Error('GAM_NETWORK_CODE environment variable not set');
  }
  return networkCode;
}
