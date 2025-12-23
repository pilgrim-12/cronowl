import Link from "next/link";
import { PublicHeader } from "@/components/PublicHeader";

function CodeBlock({ children, title }: { children: string; title?: string }) {
  return (
    <div className="bg-gray-950 rounded-lg overflow-hidden">
      {title && (
        <div className="bg-gray-900 px-4 py-2 text-sm text-gray-400 border-b border-gray-800">
          {title}
        </div>
      )}
      <pre className="p-4 text-sm text-green-400 overflow-x-auto">
        <code>{children}</code>
      </pre>
    </div>
  );
}

function Endpoint({
  method,
  path,
  description,
  children,
}: {
  method: "GET" | "POST" | "PATCH" | "DELETE";
  path: string;
  description: string;
  children?: React.ReactNode;
}) {
  const methodColors = {
    GET: "bg-green-500/20 text-green-400",
    POST: "bg-blue-500/20 text-blue-400",
    PATCH: "bg-yellow-500/20 text-yellow-400",
    DELETE: "bg-red-500/20 text-red-400",
  };

  return (
    <div className="border border-gray-800 rounded-lg overflow-hidden mb-6">
      <div className="bg-gray-900 px-4 py-3 flex items-center gap-3">
        <span className={`px-2 py-1 rounded text-xs font-bold ${methodColors[method]}`}>
          {method}
        </span>
        <code className="text-white font-mono">{path}</code>
      </div>
      <div className="p-4">
        <p className="text-gray-400 mb-4">{description}</p>
        {children}
      </div>
    </div>
  );
}

export default function ApiDocsPage() {
  return (
    <div className="min-h-screen bg-gray-950">
      <PublicHeader />

      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="mb-12">
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
            <Link href="/" className="hover:text-gray-400">Home</Link>
            <span>/</span>
            <span className="text-gray-400">API Documentation</span>
          </div>
          <h1 className="text-4xl font-bold text-white mb-4">API Documentation</h1>
          <p className="text-xl text-gray-400">
            Complete reference for the CronOwl REST API v1
          </p>
        </div>

        {/* Quick Start */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-white mb-4">Quick Start</h2>
          <div className="bg-gray-900 rounded-lg p-6 mb-6">
            <h3 className="text-lg font-semibold text-white mb-3">1. Get your API key</h3>
            <p className="text-gray-400 mb-4">
              Go to <Link href="/settings" className="text-blue-400 hover:underline">Settings</Link> and
              create a new API key in the &quot;API Keys&quot; section.
            </p>

            <h3 className="text-lg font-semibold text-white mb-3">2. Make your first request</h3>
            <CodeBlock title="List all checks">
{`curl -H "Authorization: Bearer YOUR_API_KEY" \\
  https://cronowl.com/api/v1/checks`}
            </CodeBlock>
          </div>
        </section>

        {/* Authentication */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-white mb-4">Authentication</h2>
          <p className="text-gray-400 mb-4">
            All API requests require a Bearer token in the Authorization header:
          </p>
          <CodeBlock>
{`Authorization: Bearer sk_live_xxxxxxxxxxxx`}
          </CodeBlock>
          <div className="mt-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
            <p className="text-yellow-400 text-sm">
              <strong>Important:</strong> Keep your API keys secret. Never expose them in client-side code or public repositories.
            </p>
          </div>
        </section>

        {/* Response Format */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-white mb-4">Response Format</h2>
          <p className="text-gray-400 mb-4">All responses are JSON with this structure:</p>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <h4 className="text-white font-medium mb-2">Success</h4>
              <CodeBlock>
{`{
  "success": true,
  "data": { ... },
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 45
  }
}`}
              </CodeBlock>
            </div>
            <div>
              <h4 className="text-white font-medium mb-2">Error</h4>
              <CodeBlock>
{`{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid field",
    "details": { ... }
  }
}`}
              </CodeBlock>
            </div>
          </div>
        </section>

        {/* API Keys Endpoints */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-white mb-6">API Keys</h2>

          <Endpoint method="GET" path="/api/v1/auth/keys" description="List all API keys for your account">
            <CodeBlock title="Response">
{`{
  "success": true,
  "data": [
    {
      "id": "abc123",
      "name": "Production",
      "prefix": "sk_live_xxxx...",
      "createdAt": "2024-01-15T10:00:00Z",
      "lastUsedAt": "2024-01-20T15:30:00Z"
    }
  ]
}`}
            </CodeBlock>
          </Endpoint>

          <Endpoint method="POST" path="/api/v1/auth/keys" description="Create a new API key">
            <CodeBlock title="Request body">
{`{
  "name": "CI/CD Pipeline"
}`}
            </CodeBlock>
            <div className="mt-4">
              <CodeBlock title="Response (key shown only once!)">
{`{
  "success": true,
  "data": {
    "id": "def456",
    "name": "CI/CD Pipeline",
    "key": "sk_live_xxxxxxxxxxxxxxxxxxxx",
    "prefix": "sk_live_xxxx...",
    "createdAt": "2024-01-20T16:00:00Z"
  }
}`}
              </CodeBlock>
            </div>
          </Endpoint>

          <Endpoint method="DELETE" path="/api/v1/auth/keys/:id" description="Revoke an API key">
            <CodeBlock title="Response">
{`{
  "success": true,
  "data": { "revoked": true }
}`}
            </CodeBlock>
          </Endpoint>
        </section>

        {/* Checks Endpoints */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-white mb-6">Checks</h2>

          <Endpoint method="GET" path="/api/v1/checks" description="List all checks with optional filtering">
            <h4 className="text-white font-medium mb-2">Query Parameters</h4>
            <table className="w-full text-sm mb-4">
              <thead>
                <tr className="border-b border-gray-800">
                  <th className="text-left py-2 text-gray-400">Parameter</th>
                  <th className="text-left py-2 text-gray-400">Description</th>
                </tr>
              </thead>
              <tbody className="text-gray-300">
                <tr className="border-b border-gray-800">
                  <td className="py-2"><code>page</code></td>
                  <td className="py-2">Page number (default: 1)</td>
                </tr>
                <tr className="border-b border-gray-800">
                  <td className="py-2"><code>limit</code></td>
                  <td className="py-2">Results per page (default: 20, max: 100)</td>
                </tr>
                <tr className="border-b border-gray-800">
                  <td className="py-2"><code>status</code></td>
                  <td className="py-2">Filter by status: up, down, new</td>
                </tr>
                <tr className="border-b border-gray-800">
                  <td className="py-2"><code>tag</code></td>
                  <td className="py-2">Filter by tag</td>
                </tr>
              </tbody>
            </table>
            <CodeBlock title="Example">
{`curl -H "Authorization: Bearer sk_live_xxx" \\
  "https://cronowl.com/api/v1/checks?status=up&limit=10"`}
            </CodeBlock>
          </Endpoint>

          <Endpoint method="POST" path="/api/v1/checks" description="Create a new check">
            <h4 className="text-white font-medium mb-2">Request Body</h4>
            <table className="w-full text-sm mb-4">
              <thead>
                <tr className="border-b border-gray-800">
                  <th className="text-left py-2 text-gray-400">Field</th>
                  <th className="text-left py-2 text-gray-400">Type</th>
                  <th className="text-left py-2 text-gray-400">Description</th>
                </tr>
              </thead>
              <tbody className="text-gray-300">
                <tr className="border-b border-gray-800">
                  <td className="py-2"><code>name</code></td>
                  <td className="py-2">string</td>
                  <td className="py-2">Check name (required)</td>
                </tr>
                <tr className="border-b border-gray-800">
                  <td className="py-2"><code>schedule</code></td>
                  <td className="py-2">string</td>
                  <td className="py-2">Preset: &quot;every 5 minutes&quot;, &quot;every hour&quot;, &quot;every day&quot;, etc.</td>
                </tr>
                <tr className="border-b border-gray-800">
                  <td className="py-2"><code>cronExpression</code></td>
                  <td className="py-2">string</td>
                  <td className="py-2">Cron syntax: &quot;*/5 * * * *&quot; (overrides schedule)</td>
                </tr>
                <tr className="border-b border-gray-800">
                  <td className="py-2"><code>timezone</code></td>
                  <td className="py-2">string</td>
                  <td className="py-2">Timezone (default: UTC)</td>
                </tr>
                <tr className="border-b border-gray-800">
                  <td className="py-2"><code>gracePeriod</code></td>
                  <td className="py-2">number</td>
                  <td className="py-2">Grace period in minutes (0-60)</td>
                </tr>
                <tr className="border-b border-gray-800">
                  <td className="py-2"><code>tags</code></td>
                  <td className="py-2">string[]</td>
                  <td className="py-2">Tags for organization</td>
                </tr>
                <tr className="border-b border-gray-800">
                  <td className="py-2"><code>webhookUrl</code></td>
                  <td className="py-2">string</td>
                  <td className="py-2">Webhook URL for alerts</td>
                </tr>
                <tr className="border-b border-gray-800">
                  <td className="py-2"><code>maxDuration</code></td>
                  <td className="py-2">number</td>
                  <td className="py-2">Slow job threshold in milliseconds</td>
                </tr>
              </tbody>
            </table>
            <CodeBlock title="Example">
{`curl -X POST \\
  -H "Authorization: Bearer sk_live_xxx" \\
  -H "Content-Type: application/json" \\
  -d '{
    "name": "Database Backup",
    "cronExpression": "0 2 * * *",
    "timezone": "Europe/Moscow",
    "gracePeriod": 10,
    "tags": ["production", "critical"],
    "maxDuration": 300000
  }' \\
  https://cronowl.com/api/v1/checks`}
            </CodeBlock>
          </Endpoint>

          <Endpoint method="GET" path="/api/v1/checks/:id" description="Get a single check by ID">
            <CodeBlock title="Response">
{`{
  "success": true,
  "data": {
    "id": "abc123",
    "name": "Database Backup",
    "slug": "db-backup-xyz",
    "schedule": "cron",
    "scheduleType": "cron",
    "cronExpression": "0 2 * * *",
    "timezone": "Europe/Moscow",
    "gracePeriod": 10,
    "status": "up",
    "paused": false,
    "lastPing": "2024-01-20T02:00:15Z",
    "lastDuration": 45000,
    "tags": ["production", "critical"],
    "maxDuration": 300000,
    "createdAt": "2024-01-01T10:00:00Z"
  }
}`}
            </CodeBlock>
          </Endpoint>

          <Endpoint method="PATCH" path="/api/v1/checks/:id" description="Update a check">
            <CodeBlock title="Example - Update name and add tag">
{`curl -X PATCH \\
  -H "Authorization: Bearer sk_live_xxx" \\
  -H "Content-Type: application/json" \\
  -d '{"name": "Daily Backup", "tags": ["prod", "db"]}' \\
  https://cronowl.com/api/v1/checks/abc123`}
            </CodeBlock>
          </Endpoint>

          <Endpoint method="DELETE" path="/api/v1/checks/:id" description="Delete a check">
            <CodeBlock title="Response">
{`{
  "success": true,
  "data": { "deleted": true }
}`}
            </CodeBlock>
          </Endpoint>

          <Endpoint method="POST" path="/api/v1/checks/:id/pause" description="Pause monitoring for a check">
            <p className="text-gray-400 text-sm mb-2">
              Paused checks won&apos;t trigger down alerts even if they miss pings.
            </p>
            <CodeBlock title="Response">
{`{
  "success": true,
  "data": { "paused": true, "id": "abc123" }
}`}
            </CodeBlock>
          </Endpoint>

          <Endpoint method="POST" path="/api/v1/checks/:id/resume" description="Resume monitoring for a paused check">
            <CodeBlock title="Response">
{`{
  "success": true,
  "data": { "paused": false, "id": "abc123" }
}`}
            </CodeBlock>
          </Endpoint>
        </section>

        {/* Ping History */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-white mb-6">Ping History</h2>

          <Endpoint method="GET" path="/api/v1/checks/:id/pings" description="Get ping history for a check">
            <h4 className="text-white font-medium mb-2">Query Parameters</h4>
            <table className="w-full text-sm mb-4">
              <thead>
                <tr className="border-b border-gray-800">
                  <th className="text-left py-2 text-gray-400">Parameter</th>
                  <th className="text-left py-2 text-gray-400">Description</th>
                </tr>
              </thead>
              <tbody className="text-gray-300">
                <tr className="border-b border-gray-800">
                  <td className="py-2"><code>limit</code></td>
                  <td className="py-2">Number of pings to return (default: 20, max: 100)</td>
                </tr>
              </tbody>
            </table>
            <CodeBlock title="Response">
{`{
  "success": true,
  "data": [
    {
      "id": "ping1",
      "timestamp": "2024-01-20T02:00:15Z",
      "ip": "203.0.113.50",
      "userAgent": "curl/8.0",
      "duration": 45000,
      "exitCode": 0,
      "status": "success"
    }
  ],
  "meta": {
    "checkId": "abc123",
    "checkName": "Database Backup",
    "count": 1
  }
}`}
            </CodeBlock>
          </Endpoint>

          <Endpoint method="GET" path="/api/v1/checks/:id/status" description="Get status change history">
            <CodeBlock title="Response">
{`{
  "success": true,
  "data": [
    {
      "id": "event1",
      "status": "up",
      "timestamp": "2024-01-20T02:00:15Z",
      "duration": 86400
    },
    {
      "id": "event2",
      "status": "down",
      "timestamp": "2024-01-19T02:05:00Z",
      "duration": 300
    }
  ],
  "meta": {
    "checkId": "abc123",
    "checkName": "Database Backup",
    "currentStatus": "up",
    "count": 2
  }
}`}
            </CodeBlock>
          </Endpoint>
        </section>

        {/* Ping Endpoint */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-white mb-6">Ping Endpoint</h2>
          <p className="text-gray-400 mb-4">
            The ping endpoint is public and doesn&apos;t require authentication. Use the check&apos;s slug from the dashboard.
          </p>

          <Endpoint method="GET" path="/api/ping/:slug" description="Send a ping to indicate your job is running">
            <h4 className="text-white font-medium mb-2">Query Parameters</h4>
            <table className="w-full text-sm mb-4">
              <thead>
                <tr className="border-b border-gray-800">
                  <th className="text-left py-2 text-gray-400">Parameter</th>
                  <th className="text-left py-2 text-gray-400">Description</th>
                </tr>
              </thead>
              <tbody className="text-gray-300">
                <tr className="border-b border-gray-800">
                  <td className="py-2"><code>duration</code></td>
                  <td className="py-2">Job duration in milliseconds</td>
                </tr>
                <tr className="border-b border-gray-800">
                  <td className="py-2"><code>exit_code</code></td>
                  <td className="py-2">Exit code (0 = success)</td>
                </tr>
                <tr className="border-b border-gray-800">
                  <td className="py-2"><code>status</code></td>
                  <td className="py-2">&quot;success&quot; or &quot;failure&quot;</td>
                </tr>
                <tr className="border-b border-gray-800">
                  <td className="py-2"><code>output</code></td>
                  <td className="py-2">Job output (max 1KB)</td>
                </tr>
                <tr className="border-b border-gray-800">
                  <td className="py-2"><code>start</code></td>
                  <td className="py-2">Set to &quot;1&quot; to signal job start (no status change)</td>
                </tr>
              </tbody>
            </table>
            <CodeBlock title="Examples">
{`# Simple ping
curl https://cronowl.com/api/ping/your-slug

# With duration (for slow job detection)
curl "https://cronowl.com/api/ping/your-slug?duration=45000"

# With exit code
curl "https://cronowl.com/api/ping/your-slug?exit_code=0"

# Signal job start
curl "https://cronowl.com/api/ping/your-slug?start=1"

# Full example in bash script
START_TIME=$(date +%s%3N)
# ... your job here ...
END_TIME=$(date +%s%3N)
DURATION=$((END_TIME - START_TIME))
curl "https://cronowl.com/api/ping/your-slug?duration=$DURATION&exit_code=$?"`}
            </CodeBlock>
          </Endpoint>
        </section>

        {/* Postman */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-white mb-4">Testing with Postman</h2>
          <div className="bg-gray-900 rounded-lg p-6">
            <ol className="list-decimal list-inside space-y-3 text-gray-300">
              <li>Create a new request in Postman</li>
              <li>Set the method (GET, POST, etc.) and URL</li>
              <li>Go to the <strong>Authorization</strong> tab</li>
              <li>Select <strong>Bearer Token</strong> from the Type dropdown</li>
              <li>Paste your API key in the Token field</li>
              <li>For POST/PATCH requests, go to <strong>Body</strong> tab, select <strong>raw</strong> and <strong>JSON</strong></li>
              <li>Send your request!</li>
            </ol>
          </div>
        </section>

        {/* Error Codes */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-white mb-4">Error Codes</h2>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800">
                <th className="text-left py-3 text-gray-400">Code</th>
                <th className="text-left py-3 text-gray-400">HTTP Status</th>
                <th className="text-left py-3 text-gray-400">Description</th>
              </tr>
            </thead>
            <tbody className="text-gray-300">
              <tr className="border-b border-gray-800">
                <td className="py-3"><code>UNAUTHORIZED</code></td>
                <td className="py-3">401</td>
                <td className="py-3">Missing or invalid Authorization header</td>
              </tr>
              <tr className="border-b border-gray-800">
                <td className="py-3"><code>INVALID_API_KEY</code></td>
                <td className="py-3">401</td>
                <td className="py-3">Invalid or revoked API key</td>
              </tr>
              <tr className="border-b border-gray-800">
                <td className="py-3"><code>NOT_FOUND</code></td>
                <td className="py-3">404</td>
                <td className="py-3">Resource not found</td>
              </tr>
              <tr className="border-b border-gray-800">
                <td className="py-3"><code>VALIDATION_ERROR</code></td>
                <td className="py-3">400</td>
                <td className="py-3">Invalid request data</td>
              </tr>
              <tr className="border-b border-gray-800">
                <td className="py-3"><code>LIMIT_EXCEEDED</code></td>
                <td className="py-3">400</td>
                <td className="py-3">Plan limit reached</td>
              </tr>
              <tr className="border-b border-gray-800">
                <td className="py-3"><code>RATE_LIMIT_EXCEEDED</code></td>
                <td className="py-3">429</td>
                <td className="py-3">Too many requests (60/min)</td>
              </tr>
              <tr className="border-b border-gray-800">
                <td className="py-3"><code>INTERNAL_ERROR</code></td>
                <td className="py-3">500</td>
                <td className="py-3">Server error</td>
              </tr>
            </tbody>
          </table>
        </section>

        {/* Rate Limits */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-white mb-4">Rate Limits</h2>
          <div className="bg-gray-900 rounded-lg p-6">
            <ul className="space-y-2 text-gray-300">
              <li>• API requests: <strong>60 requests per minute</strong> per API key</li>
              <li>• Ping endpoint: <strong>100 requests per minute</strong> per IP</li>
              <li>• Maximum API keys per user: <strong>10</strong></li>
            </ul>
          </div>
        </section>

        {/* Footer */}
        <div className="border-t border-gray-800 pt-8 mt-12">
          <p className="text-gray-500 text-center">
            Need help? Contact us at{" "}
            <a href="mailto:support@cronowl.com" className="text-blue-400 hover:underline">
              support@cronowl.com
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
