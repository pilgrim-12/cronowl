import { spawn } from "node:child_process";
import https from "node:https";
import http from "node:http";

interface WrapOptions {
  quiet?: boolean;
  baseUrl: string;
  output?: boolean; // --no-output sets this to false
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

async function sendPing(
  url: string,
  body?: Record<string, unknown>
): Promise<{ success: boolean; error?: string }> {
  return new Promise((resolve) => {
    const parsedUrl = new URL(url);
    const isHttps = parsedUrl.protocol === "https:";
    const client = isHttps ? https : http;
    const bodyStr = body ? JSON.stringify(body) : undefined;

    const options = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port || (isHttps ? 443 : 80),
      path: parsedUrl.pathname + parsedUrl.search,
      method: body ? "POST" : "GET",
      headers: {
        "User-Agent": "cronowl-cli/1.0.0",
        ...(bodyStr
          ? {
              "Content-Type": "application/json",
              "Content-Length": Buffer.byteLength(bodyStr),
            }
          : {}),
      },
      timeout: 30000,
    };

    const req = client.request(options, (res) => {
      res.resume(); // Drain response
      res.on("end", () => {
        resolve({ success: res.statusCode === 200 });
      });
    });

    req.on("error", (err) => {
      resolve({ success: false, error: err.message });
    });

    req.on("timeout", () => {
      req.destroy();
      resolve({ success: false, error: "Request timeout" });
    });

    if (bodyStr) {
      req.write(bodyStr);
    }
    req.end();
  });
}

export async function wrap(
  slug: string,
  command: string[],
  options: WrapOptions
): Promise<void> {
  const { baseUrl, quiet, output: sendOutput = true } = options;
  const pingUrl = `${baseUrl}/api/ping/${slug}`;

  if (!command || command.length === 0) {
    logError("No command provided", quiet);
    process.exit(1);
  }

  // Signal start
  log(`Starting job: ${slug}`, quiet);
  log(`Command: ${command.join(" ")}`, quiet);

  const startResult = await sendPing(`${pingUrl}?start=1`);
  if (!startResult.success) {
    logError(`Failed to signal start: ${startResult.error}`, quiet);
    // Continue anyway - don't fail the job because of monitoring
  }

  const startTime = Date.now();
  let stdout = "";
  let stderr = "";

  // Execute command
  const [cmd, ...args] = command;
  const child = spawn(cmd, args, {
    stdio: ["inherit", "pipe", "pipe"],
    shell: true,
  });

  child.stdout?.on("data", (data) => {
    process.stdout.write(data);
    if (sendOutput) {
      stdout += data.toString();
    }
  });

  child.stderr?.on("data", (data) => {
    process.stderr.write(data);
    if (sendOutput) {
      stderr += data.toString();
    }
  });

  child.on("close", async (exitCode) => {
    const duration = Date.now() - startTime;
    const code = exitCode ?? 0;
    const success = code === 0;

    log(`Command finished in ${duration}ms with exit code ${code}`, quiet);

    // Prepare output (combine stdout and stderr, truncate to 10KB)
    let combinedOutput = "";
    if (sendOutput) {
      combinedOutput = stdout;
      if (stderr) {
        combinedOutput += (combinedOutput ? "\n--- STDERR ---\n" : "") + stderr;
      }
      combinedOutput = combinedOutput.slice(0, 10240);
    }

    // Send completion ping
    const payload: Record<string, unknown> = {
      duration,
      exitCode: code,
      status: success ? "success" : "failure",
    };

    if (combinedOutput) {
      payload.output = combinedOutput;
    }

    const endResult = await sendPing(pingUrl, payload);

    if (endResult.success) {
      log(`Ping sent: ${success ? "success" : "failure"}`, quiet);
    } else {
      logError(`Failed to send ping: ${endResult.error}`, quiet);
    }

    // Exit with the same code as the wrapped command
    process.exit(code);
  });

  child.on("error", async (err) => {
    const duration = Date.now() - startTime;

    logError(`Failed to execute command: ${err.message}`, quiet);

    // Send failure ping
    await sendPing(pingUrl, {
      duration,
      exitCode: 1,
      status: "failure",
      output: `Failed to execute: ${err.message}`,
    });

    process.exit(1);
  });
}
