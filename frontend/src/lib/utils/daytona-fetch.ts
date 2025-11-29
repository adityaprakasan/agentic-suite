/**
 * Utility functions for making authenticated requests to Daytona sandbox URLs.
 * 
 * Daytona shows a preview warning page that blocks programmatic access.
 * These utilities add the required headers to bypass the warning:
 * - X-Daytona-Skip-Preview-Warning: true (bypasses the warning page)
 * - X-Daytona-Preview-Token: {token} (authenticates private sandbox access)
 */

/**
 * Headers required for Daytona sandbox requests
 */
export const DAYTONA_HEADERS = {
  'X-Daytona-Skip-Preview-Warning': 'true',
} as const;

/**
 * Get Daytona headers with optional authentication token
 */
export function getDaytonaHeaders(token?: string): Record<string, string> {
  const headers: Record<string, string> = {
    'X-Daytona-Skip-Preview-Warning': 'true',
  };
  
  if (token) {
    headers['X-Daytona-Preview-Token'] = token;
  }
  
  return headers;
}

/**
 * Merge existing headers with Daytona headers
 */
export function mergeDaytonaHeaders(
  existingHeaders?: HeadersInit,
  token?: string
): Record<string, string> {
  const daytonaHeaders = getDaytonaHeaders(token);
  
  if (!existingHeaders) {
    return daytonaHeaders;
  }
  
  // Convert HeadersInit to plain object
  if (existingHeaders instanceof Headers) {
    const obj: Record<string, string> = {};
    existingHeaders.forEach((value, key) => {
      obj[key] = value;
    });
    return { ...obj, ...daytonaHeaders };
  }
  
  if (Array.isArray(existingHeaders)) {
    const obj: Record<string, string> = {};
    existingHeaders.forEach(([key, value]) => {
      obj[key] = value;
    });
    return { ...obj, ...daytonaHeaders };
  }
  
  return { ...existingHeaders, ...daytonaHeaders };
}

/**
 * Fetch wrapper that adds Daytona authentication headers.
 * Use this for all direct requests to sandbox URLs.
 * 
 * @param url - The URL to fetch (should be a Daytona sandbox URL)
 * @param options - Standard fetch options
 * @param token - Optional Daytona preview token for private sandbox authentication
 * @returns Promise<Response> - The fetch response
 * 
 * @example
 * ```typescript
 * // Basic usage
 * const response = await daytonaFetch(sandboxUrl + '/path/to/file');
 * 
 * // With token authentication
 * const response = await daytonaFetch(sandboxUrl + '/path/to/file', {}, project.sandbox.token);
 * 
 * // With custom options
 * const response = await daytonaFetch(sandboxUrl + '/api/endpoint', {
 *   method: 'POST',
 *   headers: { 'Content-Type': 'application/json' },
 *   body: JSON.stringify(data),
 * }, project.sandbox.token);
 * ```
 */
export async function daytonaFetch(
  url: string,
  options?: RequestInit,
  token?: string
): Promise<Response> {
  const mergedHeaders = mergeDaytonaHeaders(options?.headers, token);
  
  return fetch(url, {
    ...options,
    headers: mergedHeaders,
  });
}

/**
 * Constructs a proxy URL for accessing sandbox content through the backend.
 * Use this for iframes and other elements that cannot add custom headers.
 * 
 * @param sandboxId - The sandbox ID
 * @param path - The path within the sandbox to access
 * @returns The proxy URL through the backend
 * 
 * @example
 * ```typescript
 * // For iframe src
 * <iframe src={constructProxyUrl(sandbox.id, 'presentations/demo/slide_1.html')} />
 * ```
 */
export function constructProxyUrl(
  sandboxId: string | undefined,
  path: string | undefined
): string | undefined {
  if (!sandboxId || !path) {
    return undefined;
  }
  
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || '';
  
  // Remove leading slash from path if present
  const cleanPath = path.replace(/^\//, '');
  
  // Encode the path parameter
  const encodedPath = encodeURIComponent(cleanPath);
  
  return `${backendUrl}/api/sandboxes/${sandboxId}/proxy?path=${encodedPath}`;
}

