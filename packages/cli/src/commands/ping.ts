import https from "node:https";
import http from "node:http";

interface PingOptions {
  duration?: string;
  exitCode?: string;
  output?: string;
  fail?: boolean;
  start?: boolean;
  quiet?: boolean;
  baseUrl: string;
}

interface PingResult {
  success: boolean;
  status?: number;
  message?: string;
  error?: string;
}

function log(message: string, quiet?: boolean): void {
  if (!quiet) {
    console.log(`[cronowl] ${message}`);
  }
}

function logError(message: string, quiet?: boolean): void {
  if (!quiet) {
    console.error(`[cronowl] ERROR: ${message}`);
  }
}

async function sendRequest(url: string, method: string, body?: string): Promise<PingResult> {
  return new Promise((resolve) => {
    const parsedUrl = new URL(url);
    const isHttps = parsedUrl.protocol === "https:";
    const client = isHttps ? https : http;

    const options = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port || (isHttps ? 443 : 80),
      path: parsedUrl.pathname + parsedUrl.search,
      method,
      headers: {
        "User-Agent": "cronowl-cli/1.0.0",
        ...(body ? { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(body) } : {}),
      },
      timeout: 30000,
    };

    const req = client.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => {
        data += chunk;
      });
      res.on("end", () => {
        try {
          const json = JSON.parse(data);
          resolve({
            success: res.statusCode === 200,
            status: res.statusCode,
            message: json.message || json.status,
            error: json.error,
          });
        } catch {
          resolve({
            success: res.statusCode === 200,
            status: res.statusCode,
            message: data,
          });
        }
      });
    });

    req.on("error", (err) => {
      resolve({
        success: false,
        error: err.message,
      });
    });

    req.on("timeout", () => {
      req.destroy();
      resolve({
        success: false,
        error: "Request timeout",
      });
    });

    if (body) {
      req.write(body);
    }
    req.end();
  });
}

export async function ping(slug: string, options: PingOptions): Promise<void> {
  const { baseUrl, quiet, start, fail, duration, exitCode, output } = options;

  // Build URL
  let url = `${baseUrl}/api/ping/${slug}`;

  // Add query params for start signal
  if (start) {
    url += "?start=1";
  }

  // Build body for POST (if we have metrics)
  const hasMetrics = duration || exitCode || output || fail;
  let body: string | undefined;

  if (hasMetrics) {
    const payload: Record<string, unknown> = {};

    if (duration) {
      payload.duration = parseInt(duration, 10);
    }

    if (exitCode) {
      payload.exitCode = parseInt(exitCode, 10);
    } else if (fail) {
      payload.exitCode = 1;
    }

    if (output) {
      // Truncate output to 10KB
      payload.output = output.slice(0, 10240);
    }

    // Determine status
    const code = exitCode ? parseInt(exitCode, 10) : (fail ? 1 : 0);
    payload.status = code === 0 ? "success" : "failure";

    body = JSON.stringify(payload);
  }

  log(start ? `Signaling job start: ${slug}` : `Pinging: ${slug}`, quiet);

  const result = await sendRequest(url, hasMetrics ? "POST" : "GET", body);

  if (result.success) {
    log(`OK - ${result.message || "ping recorded"}`, quiet);
  } else {
    logError(result.error || `HTTP ${result.status}`, quiet);
    process.exit(1);
  }
}
