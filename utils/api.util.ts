/**
 * Salesforce API Utility
 * Helper functions for Salesforce REST API calls
 */

interface ApiConfig {
  params: string;
  tokenUrl: string;
}

interface TokenResponse {
  access_token: string;
  instance_url: string;
  token_type: string;
}

/**
 * Get OAuth access token from Salesforce
 */
export async function getAccessToken(config: ApiConfig): Promise<TokenResponse> {
  const response = await fetch(config.tokenUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: config.params
  });

  if (!response.ok) {
    throw new Error(`Failed to get access token: ${response.status} ${response.statusText}`);
  }

  return response.json() as Promise<TokenResponse>;
}

/**
 * Execute a GET request to Salesforce API
 */
export async function apiGet(config: ApiConfig, endpoint: string): Promise<string> {
  const token = await getAccessToken(config);
  
  const response = await fetch(endpoint, {
    method: 'GET',
    headers: {
      'Authorization': `${token.token_type} ${token.access_token}`,
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    throw new Error(`API GET failed: ${response.status} ${response.statusText}`);
  }

  return response.text();
}

/**
 * Execute a PATCH request to Salesforce API
 */
export async function apiPatch(
  config: ApiConfig, 
  endpoint: string, 
  data: Record<string, unknown>[]
): Promise<void> {
  const token = await getAccessToken(config);
  
  const response = await fetch(endpoint, {
    method: 'PATCH',
    headers: {
      'Authorization': `${token.token_type} ${token.access_token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data[0])
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`API PATCH failed: ${response.status} ${response.statusText} - ${errorText}`);
  }

  console.log('✓ API PATCH successful');
}

/**
 * Execute a POST request to Salesforce API
 */
export async function apiPost(
  config: ApiConfig, 
  endpoint: string, 
  data: Record<string, unknown>
): Promise<string> {
  const token = await getAccessToken(config);
  
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Authorization': `${token.token_type} ${token.access_token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`API POST failed: ${response.status} ${response.statusText} - ${errorText}`);
  }

  return response.text();
}

/**
 * Extract a key value from JSON response
 */
export function getKeyValue(json: Record<string, unknown>, key: string): string {
  if (json.records && Array.isArray(json.records) && json.records.length > 0) {
    const record = json.records[0] as Record<string, unknown>;
    return String(record[key] || '');
  }
  return String(json[key] || '');
}

/**
 * Build SOQL query URL
 */
export function buildSoqlUrl(baseUrl: string, query: string): string {
  const encodedQuery = encodeURIComponent(query);
  return `${baseUrl}/services/data/v48.0/query/?q=${encodedQuery}`;
}
