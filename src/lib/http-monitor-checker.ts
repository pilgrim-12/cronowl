// HTTP Monitor Checker - executes HTTP checks with SSRF protection and assertions

import { HttpMonitor, HttpMonitorAssertions } from "./http-monitors";

// Blocked hostnames for SSRF protection
const BLOCKED_HOSTNAMES = [
  "localhost",
  "127.0.0.1",
  "0.0.0.0",
  "::1",
  "[::1]",
];

// Blocked IP patterns (private/internal networks)
const BLOCKED_IP_PATTERNS = [
  /^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/, // 10.0.0.0/8
  /^172\.(1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3}$/, // 172.16.0.0/12
  /^192\.168\.\d{1,3}\.\d{1,3}$/, // 192.168.0.0/16
  /^169\.254\.\d{1,3}\.\d{1,3}$/, // Link-local
  /^100\.(6[4-9]|[7-9]\d|1[01]\d|12[0-7])\.\d{1,3}\.\d{1,3}$/, // Carrier-grade NAT
];

// Sensitive headers to mask in logs/UI
export const SENSITIVE_HEADERS = [
  "authorization",
  "x-api-key",
  "api-key",
  "cookie",
  "x-auth-token",
  "bearer",
  "x-access-token",
  "x-secret",
  "password",
];

export interface UrlValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Check if hostname is blocked (internal/private)
 */
function isBlockedHost(hostname: string): boolean {
  // Check exact matches
  if (BLOCKED_HOSTNAMES.includes(hostname.toLowerCase())) {
    return true;
  }

  // Check IP patterns
  for (const pattern of BLOCKED_IP_PATTERNS) {
    if (pattern.test(hostname)) {
      return true;
    }
  }

  // Block .local and .internal domains
  if (
    hostname.endsWith(".local") ||
    hostname.endsWith(".internal") ||
    hostname.endsWith(".localhost") ||
    hostname.endsWith(".lan")
  ) {
    return true;
  }

  return false;
}

/**
 * Validate URL for HTTP monitoring (SSRF protection)
 */
export function validateMonitorUrl(url: string): UrlValidationResult {
  try {
    const parsed = new URL(url);

    // Must be HTTP or HTTPS
    if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
      return { valid: false, error: "URL must use HTTP or HTTPS protocol" };
    }

    // Block internal/private hosts
    if (isBlockedHost(parsed.hostname)) {
      return { valid: false, error: "Cannot monitor localhost or private IP addresses" };
    }

    // Must have a valid hostname
    if (!parsed.hostname || parsed.hostname.length === 0) {
      return { valid: false, error: "Invalid hostname" };
    }

    return { valid: true };
  } catch {
    return { valid: false, error: "Invalid URL format" };
  }
}

/**
 * Mask sensitive header values for display/logging
 */
export function maskSensitiveHeaders(
  headers: Record<string, string>
): Record<string, string> {
  const masked: Record<string, string> = {};

  for (const [key, value] of Object.entries(headers)) {
    const lowerKey = key.toLowerCase();
    const isSensitive = SENSITIVE_HEADERS.some(
      (h) => lowerKey.includes(h)
    );

    if (isSensitive) {
      // Show first 4 chars and mask the rest
      if (value.length > 8) {
        masked[key] = value.substring(0, 4) + "****" + value.substring(value.length - 4);
      } else {
        masked[key] = "********";
      }
    } else {
      masked[key] = value;
    }
  }

  return masked;
}

/**
 * Truncate response body for storage
 */
export function truncateResponseBody(body: string, maxLength: number = 500): string {
  if (body.length <= maxLength) {
    return body;
  }
  return body.substring(0, maxLength) + "... (truncated)";
}

export interface HttpCheckResult {
  status: "success" | "failure";
  statusCode?: number;
  responseTimeMs: number;
  error?: string;
  responseBody?: string;
  assertions?: {
    statusCodePassed: boolean;
    responseTimePassed: boolean;
    bodyContainsPassed?: boolean;
    bodyNotContainsPassed?: boolean;
  };
}

/**
 * Execute HTTP check for a monitor
 */
export async function executeHttpCheck(monitor: HttpMonitor): Promise<HttpCheckResult> {
  const startTime = Date.now();

  // Validate URL first
  const urlValidation = validateMonitorUrl(monitor.url);
  if (!urlValidation.valid) {
    return {
      status: "failure",
      responseTimeMs: Date.now() - startTime,
      error: urlValidation.error || "Invalid URL",
    };
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), monitor.timeoutMs);

  try {
    // Build request options
    const requestOptions: RequestInit = {
      method: monitor.method,
      headers: {
        "User-Agent": "CronOwl-HttpMonitor/1.0",
        ...(monitor.headers || {}),
      },
      signal: controller.signal,
    };

    // Add body for POST/PUT
    if ((monitor.method === "POST" || monitor.method === "PUT") && monitor.body) {
      requestOptions.body = monitor.body;
      if (monitor.contentType) {
        (requestOptions.headers as Record<string, string>)["Content-Type"] = monitor.contentType;
      }
    }

    const response = await fetch(monitor.url, requestOptions);
    clearTimeout(timeout);

    const responseTimeMs = Date.now() - startTime;
    const statusCode = response.status;

    // Get response body for assertions
    let responseBody = "";
    try {
      responseBody = await response.text();
    } catch {
      // Ignore body read errors
    }

    // Check assertions
    const assertions = checkAssertions(
      statusCode,
      responseTimeMs,
      responseBody,
      monitor.expectedStatusCodes,
      monitor.assertions
    );

    // Determine overall status
    const allAssertionsPassed =
      assertions.statusCodePassed &&
      assertions.responseTimePassed &&
      (assertions.bodyContainsPassed === undefined || assertions.bodyContainsPassed) &&
      (assertions.bodyNotContainsPassed === undefined || assertions.bodyNotContainsPassed);

    return {
      status: allAssertionsPassed ? "success" : "failure",
      statusCode,
      responseTimeMs,
      responseBody: truncateResponseBody(responseBody),
      assertions,
      error: allAssertionsPassed ? undefined : buildAssertionError(assertions, monitor),
    };
  } catch (error) {
    clearTimeout(timeout);
    const responseTimeMs = Date.now() - startTime;

    if (error instanceof Error) {
      if (error.name === "AbortError") {
        return {
          status: "failure",
          responseTimeMs,
          error: `Timeout after ${monitor.timeoutMs}ms`,
        };
      }

      // Network errors
      if (error.message.includes("ECONNREFUSED")) {
        return {
          status: "failure",
          responseTimeMs,
          error: "Connection refused",
        };
      }

      if (error.message.includes("ENOTFOUND")) {
        return {
          status: "failure",
          responseTimeMs,
          error: "DNS lookup failed - hostname not found",
        };
      }

      if (error.message.includes("ETIMEDOUT")) {
        return {
          status: "failure",
          responseTimeMs,
          error: "Connection timed out",
        };
      }

      if (error.message.includes("CERT") || error.message.includes("SSL")) {
        return {
          status: "failure",
          responseTimeMs,
          error: `SSL/TLS error: ${error.message}`,
        };
      }

      return {
        status: "failure",
        responseTimeMs,
        error: error.message,
      };
    }

    return {
      status: "failure",
      responseTimeMs,
      error: "Unknown error",
    };
  }
}

interface AssertionResults {
  statusCodePassed: boolean;
  responseTimePassed: boolean;
  bodyContainsPassed?: boolean;
  bodyNotContainsPassed?: boolean;
}

function checkAssertions(
  statusCode: number,
  responseTimeMs: number,
  responseBody: string,
  expectedStatusCodes: number[],
  assertions?: HttpMonitorAssertions
): AssertionResults {
  const results: AssertionResults = {
    statusCodePassed: expectedStatusCodes.includes(statusCode),
    responseTimePassed: true,
  };

  if (assertions) {
    // Response time assertion
    if (assertions.maxResponseTimeMs !== undefined) {
      results.responseTimePassed = responseTimeMs <= assertions.maxResponseTimeMs;
    }

    // Body contains assertion
    if (assertions.bodyContains !== undefined) {
      results.bodyContainsPassed = responseBody.includes(assertions.bodyContains);
    }

    // Body NOT contains assertion
    if (assertions.bodyNotContains !== undefined) {
      results.bodyNotContainsPassed = !responseBody.includes(assertions.bodyNotContains);
    }
  }

  return results;
}

function buildAssertionError(
  assertions: AssertionResults,
  monitor: HttpMonitor
): string {
  const errors: string[] = [];

  if (!assertions.statusCodePassed) {
    errors.push(`Unexpected status code (expected: ${monitor.expectedStatusCodes.join(", ")})`);
  }

  if (!assertions.responseTimePassed && monitor.assertions?.maxResponseTimeMs) {
    errors.push(`Response time exceeded ${monitor.assertions.maxResponseTimeMs}ms threshold`);
  }

  if (assertions.bodyContainsPassed === false && monitor.assertions?.bodyContains) {
    errors.push(`Response body does not contain "${monitor.assertions.bodyContains}"`);
  }

  if (assertions.bodyNotContainsPassed === false && monitor.assertions?.bodyNotContains) {
    errors.push(`Response body contains forbidden string "${monitor.assertions.bodyNotContains}"`);
  }

  return errors.join("; ");
}

/**
 * Validate JSON body string
 */
export function validateJsonBody(body: string): { valid: boolean; error?: string } {
  if (!body || body.trim() === "") {
    return { valid: true };
  }

  try {
    JSON.parse(body);
    return { valid: true };
  } catch (e) {
    return {
      valid: false,
      error: e instanceof Error ? e.message : "Invalid JSON",
    };
  }
}

/**
 * Get HTTP status text for code
 */
export function getHttpStatusText(code: number): string {
  const statusTexts: Record<number, string> = {
    200: "OK",
    201: "Created",
    204: "No Content",
    301: "Moved Permanently",
    302: "Found",
    304: "Not Modified",
    400: "Bad Request",
    401: "Unauthorized",
    403: "Forbidden",
    404: "Not Found",
    405: "Method Not Allowed",
    408: "Request Timeout",
    429: "Too Many Requests",
    500: "Internal Server Error",
    502: "Bad Gateway",
    503: "Service Unavailable",
    504: "Gateway Timeout",
  };

  return statusTexts[code] || "Unknown Status";
}
