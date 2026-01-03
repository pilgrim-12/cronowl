import Link from "next/link";
import { PublicHeader } from "@/components/PublicHeader";

function CodeBlock({ children, title, language }: { children: string; title?: string; language?: string }) {
  return (
    <div className="bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden">
      {title && (
        <div className="bg-gray-200 dark:bg-gray-900 px-4 py-2 text-sm text-gray-500 dark:text-gray-400 border-b border-gray-300 dark:border-gray-800 flex justify-between">
          <span>{title}</span>
          {language && <span className="text-gray-500 dark:text-gray-500">{language}</span>}
        </div>
      )}
      <pre className="p-4 text-sm text-green-600 dark:text-green-400 overflow-x-auto">
        <code>{children}</code>
      </pre>
    </div>
  );
}

function DocCard({
  title,
  description,
  href,
  icon,
}: {
  title: string;
  description: string;
  href: string;
  icon: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-6 hover:border-gray-300 dark:hover:border-gray-700 transition-colors group"
    >
      <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center mb-4 group-hover:bg-blue-500/30 transition-colors">
        {icon}
      </div>
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{title}</h3>
      <p className="text-gray-500 dark:text-gray-400 text-sm">{description}</p>
    </Link>
  );
}

function TableOfContents() {
  const sections = [
    { id: "what-is-cronowl", title: "What is CronOwl?" },
    { id: "quick-start", title: "Quick Start" },
    { id: "how-it-works", title: "How It Works" },
    { id: "schedules", title: "Schedules & Cron Expressions" },
    { id: "notifications", title: "Notifications" },
    { id: "status-pages", title: "Status Pages" },
    { id: "incidents", title: "Incident Management" },
    { id: "examples", title: "Integration Examples" },
    { id: "ping-options", title: "Ping Options" },
    { id: "plans", title: "Plans & Limits" },
    { id: "faq", title: "FAQ" },
  ];

  return (
    <nav className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-6 mb-12">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Table of Contents</h3>
      <ul className="space-y-2">
        {sections.map((section) => (
          <li key={section.id}>
            <a
              href={`#${section.id}`}
              className="text-gray-500 dark:text-gray-400 hover:text-blue-400 transition-colors text-sm"
            >
              {section.title}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}

export default function DocsPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <PublicHeader />

      <div className="max-w-5xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="mb-12">
          <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-500 mb-4">
            <Link href="/" className="hover:text-gray-600 dark:hover:text-gray-400">Home</Link>
            <span>/</span>
            <span className="text-gray-600 dark:text-gray-400">Documentation</span>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">Documentation</h1>
          <p className="text-xl text-gray-500 dark:text-gray-400">
            Complete guide to monitoring your cron jobs with CronOwl
          </p>
        </div>

        {/* Quick Links */}
        <div className="grid md:grid-cols-3 gap-4 mb-12">
          <DocCard
            title="Quick Start"
            description="Get started in 2 minutes"
            href="#quick-start"
            icon={
              <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            }
          />
          <DocCard
            title="API Reference"
            description="Full REST API documentation"
            href="/docs/api"
            icon={
              <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
              </svg>
            }
          />
          <DocCard
            title="Status Pages"
            description="Public status pages for your users"
            href="#status-pages"
            icon={
              <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            }
          />
        </div>

        {/* Table of Contents */}
        <TableOfContents />

        {/* What is CronOwl */}
        <section id="what-is-cronowl" className="mb-16">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">What is CronOwl?</h2>

          <div className="prose prose-invert max-w-none">
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              CronOwl is a <strong className="text-gray-900 dark:text-white">dead man&apos;s switch</strong> monitoring service for your scheduled tasks and cron jobs.
              Instead of actively checking if your servers are up, CronOwl waits for your jobs to &quot;check in&quot; by sending a simple HTTP request (ping).
            </p>

            <p className="text-gray-500 dark:text-gray-400 mb-6">
              If a ping doesn&apos;t arrive within the expected time window, CronOwl knows something is wrong and immediately alerts you via email, push notifications, Telegram, or webhooks.
            </p>

            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-6 mb-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Perfect for monitoring:</h3>
              <ul className="grid md:grid-cols-2 gap-3 text-gray-700 dark:text-gray-300">
                <li className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-green-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Database backups
                </li>
                <li className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-green-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Data synchronization jobs
                </li>
                <li className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-green-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Report generation
                </li>
                <li className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-green-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Email queue processing
                </li>
                <li className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-green-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Scheduled API calls
                </li>
                <li className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-green-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Cleanup and maintenance tasks
                </li>
                <li className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-green-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Payment processing
                </li>
                <li className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-green-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Any scheduled task that must run reliably
                </li>
              </ul>
            </div>

            <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
              <p className="text-blue-600 dark:text-blue-400 text-sm">
                <strong>Why &quot;dead man&apos;s switch&quot;?</strong> The concept comes from safety devices that trigger when the operator becomes incapacitated.
                Similarly, CronOwl triggers alerts when your job stops &quot;checking in&quot; — meaning something has gone wrong.
              </p>
            </div>
          </div>
        </section>

        {/* Quick Start */}
        <section id="quick-start" className="mb-16">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Quick Start</h2>

          <div className="space-y-8">
            {/* Step 1 */}
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-6">
              <div className="flex items-center gap-3 mb-4">
                <span className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-sm">1</span>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Create a check</h3>
              </div>
              <p className="text-gray-500 dark:text-gray-400 mb-4">
                Go to your <Link href="/dashboard" className="text-blue-400 hover:underline">Dashboard</Link> and
                click &quot;New Check&quot;. Give it a descriptive name and set the expected schedule.
              </p>
              <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4">
                <p className="text-gray-500 dark:text-gray-400 text-sm mb-2">Example schedules:</p>
                <ul className="text-gray-700 dark:text-gray-300 text-sm space-y-1">
                  <li>• <code className="text-green-600 dark:text-green-400">every 5 minutes</code> — For health checks</li>
                  <li>• <code className="text-green-600 dark:text-green-400">every hour</code> — For hourly reports</li>
                  <li>• <code className="text-green-600 dark:text-green-400">every day at 2am</code> — For nightly backups</li>
                  <li>• <code className="text-green-600 dark:text-green-400">0 2 * * *</code> — Custom cron expression</li>
                </ul>
              </div>
            </div>

            {/* Step 2 */}
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-6">
              <div className="flex items-center gap-3 mb-4">
                <span className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-sm">2</span>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Copy your ping URL</h3>
              </div>
              <p className="text-gray-500 dark:text-gray-400 mb-4">
                Each check gets a unique URL. Copy it from the dashboard — it looks like this:
              </p>
              <CodeBlock>
{`https://cronowl.com/api/ping/abc123xyz`}
              </CodeBlock>
            </div>

            {/* Step 3 */}
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-6">
              <div className="flex items-center gap-3 mb-4">
                <span className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-sm">3</span>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Add ping to your script</h3>
              </div>
              <p className="text-gray-500 dark:text-gray-400 mb-4">
                Add a single curl request at the end of your cron job. When CronOwl receives the ping, it knows your job ran successfully.
              </p>
              <CodeBlock title="backup.sh" language="bash">
{`#!/bin/bash
set -e

# Your backup logic
pg_dump mydb > /backups/mydb_$(date +%Y%m%d).sql

# Ping CronOwl on success
curl -fsS --retry 3 https://cronowl.com/api/ping/YOUR_SLUG`}
              </CodeBlock>
            </div>

            {/* Step 4 */}
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-6">
              <div className="flex items-center gap-3 mb-4">
                <span className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-sm">4</span>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Get alerts when things break</h3>
              </div>
              <p className="text-gray-500 dark:text-gray-400 mb-4">
                If your job doesn&apos;t ping within the expected time + grace period, we&apos;ll alert you immediately:
              </p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-3 text-center">
                  <span className="text-2xl mb-2 block">Email</span>
                  <span className="text-gray-700 dark:text-gray-300 text-sm">Instant alerts</span>
                </div>
                <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-3 text-center">
                  <span className="text-2xl mb-2 block">Push</span>
                  <span className="text-gray-700 dark:text-gray-300 text-sm">Mobile & web</span>
                </div>
                <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-3 text-center">
                  <span className="text-2xl mb-2 block">Telegram</span>
                  <span className="text-gray-700 dark:text-gray-300 text-sm">Bot messages</span>
                </div>
                <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-3 text-center">
                  <span className="text-2xl mb-2 block">Webhook</span>
                  <span className="text-gray-700 dark:text-gray-300 text-sm">Slack, Discord</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section id="how-it-works" className="mb-16">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">How It Works</h2>

          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-6 mb-6">
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <h4 className="text-gray-900 dark:text-white font-medium mb-1">1. Your job runs and pings CronOwl</h4>
                  <p className="text-gray-500 dark:text-gray-400 text-sm">
                    At the end of your script, make an HTTP request to your unique ping URL.
                    CronOwl records the timestamp, duration, and any metadata you send.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h4 className="text-gray-900 dark:text-white font-medium mb-1">2. CronOwl tracks the schedule</h4>
                  <p className="text-gray-500 dark:text-gray-400 text-sm">
                    Based on your configured schedule (e.g., &quot;every hour&quot;), CronOwl knows when the next ping should arrive.
                    It continuously monitors all your checks.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-yellow-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <div>
                  <h4 className="text-gray-900 dark:text-white font-medium mb-1">3. Grace period buffer</h4>
                  <p className="text-gray-500 dark:text-gray-400 text-sm">
                    Jobs don&apos;t always run at exactly the same time. The grace period (1-60 minutes) gives your job
                    extra time before CronOwl considers it late.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-red-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                </div>
                <div>
                  <h4 className="text-gray-900 dark:text-white font-medium mb-1">4. Alert on missing ping</h4>
                  <p className="text-gray-500 dark:text-gray-400 text-sm">
                    If the expected time + grace period passes without a ping, CronOwl immediately sends alerts
                    through all your configured channels.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h4 className="text-gray-900 dark:text-white font-medium mb-1">5. Recovery notification</h4>
                  <p className="text-gray-500 dark:text-gray-400 text-sm">
                    When a previously &quot;down&quot; check receives a ping again, CronOwl sends a recovery notification
                    so you know the issue is resolved.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Status States</h3>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-3 h-3 bg-gray-500 rounded-full"></span>
                  <span className="text-gray-900 dark:text-white font-medium">New</span>
                </div>
                <p className="text-gray-500 dark:text-gray-400 text-sm">Check created but no pings received yet. Waiting for first ping.</p>
              </div>
              <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-3 h-3 bg-green-500 rounded-full"></span>
                  <span className="text-gray-900 dark:text-white font-medium">Up</span>
                </div>
                <p className="text-gray-500 dark:text-gray-400 text-sm">Pings arriving on schedule. Everything is working correctly.</p>
              </div>
              <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-3 h-3 bg-red-500 rounded-full"></span>
                  <span className="text-gray-900 dark:text-white font-medium">Down</span>
                </div>
                <p className="text-gray-500 dark:text-gray-400 text-sm">Ping is late. Expected time + grace period has passed without a ping.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Schedules */}
        <section id="schedules" className="mb-16">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Schedules & Cron Expressions</h2>

          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Preset Schedules</h3>
              <p className="text-gray-500 dark:text-gray-400 mb-4">
                Choose from common intervals for quick setup:
              </p>
              <div className="grid md:grid-cols-3 gap-3">
                {[
                  "every minute",
                  "every 2 minutes",
                  "every 5 minutes",
                  "every 10 minutes",
                  "every 15 minutes",
                  "every 30 minutes",
                  "every hour",
                  "every 2 hours",
                  "every 6 hours",
                  "every 12 hours",
                  "every day",
                  "every week",
                ].map((schedule) => (
                  <div key={schedule} className="bg-gray-100 dark:bg-gray-800 rounded px-3 py-2 text-green-600 dark:text-green-400 text-sm font-mono">
                    {schedule}
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Custom Cron Expressions</h3>
              <p className="text-gray-500 dark:text-gray-400 mb-4">
                For precise control, use standard cron syntax:
              </p>

              <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4 mb-4">
                <code className="text-green-600 dark:text-green-400">* * * * *</code>
                <div className="flex gap-2 mt-2 text-xs text-gray-500 dark:text-gray-500">
                  <span className="flex-1 text-center">minute<br/>(0-59)</span>
                  <span className="flex-1 text-center">hour<br/>(0-23)</span>
                  <span className="flex-1 text-center">day<br/>(1-31)</span>
                  <span className="flex-1 text-center">month<br/>(1-12)</span>
                  <span className="flex-1 text-center">weekday<br/>(0-6)</span>
                </div>
              </div>

              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-800">
                    <th className="text-left py-2 text-gray-500 dark:text-gray-400">Expression</th>
                    <th className="text-left py-2 text-gray-500 dark:text-gray-400">Description</th>
                  </tr>
                </thead>
                <tbody className="text-gray-700 dark:text-gray-300">
                  <tr className="border-b border-gray-200 dark:border-gray-800">
                    <td className="py-2"><code className="text-green-600 dark:text-green-400">*/5 * * * *</code></td>
                    <td className="py-2">Every 5 minutes</td>
                  </tr>
                  <tr className="border-b border-gray-200 dark:border-gray-800">
                    <td className="py-2"><code className="text-green-600 dark:text-green-400">0 * * * *</code></td>
                    <td className="py-2">Every hour at minute 0</td>
                  </tr>
                  <tr className="border-b border-gray-200 dark:border-gray-800">
                    <td className="py-2"><code className="text-green-600 dark:text-green-400">0 2 * * *</code></td>
                    <td className="py-2">Every day at 2:00 AM</td>
                  </tr>
                  <tr className="border-b border-gray-200 dark:border-gray-800">
                    <td className="py-2"><code className="text-green-600 dark:text-green-400">0 9 * * 1-5</code></td>
                    <td className="py-2">Every weekday at 9:00 AM</td>
                  </tr>
                  <tr className="border-b border-gray-200 dark:border-gray-800">
                    <td className="py-2"><code className="text-green-600 dark:text-green-400">0 0 1 * *</code></td>
                    <td className="py-2">First day of every month at midnight</td>
                  </tr>
                  <tr className="border-b border-gray-200 dark:border-gray-800">
                    <td className="py-2"><code className="text-green-600 dark:text-green-400">30 4 * * 0</code></td>
                    <td className="py-2">Every Sunday at 4:30 AM</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Timezone Support</h3>
              <p className="text-gray-500 dark:text-gray-400 mb-4">
                All schedules are evaluated in your selected timezone. Supported timezones include:
              </p>
              <div className="grid md:grid-cols-4 gap-2 text-sm">
                {[
                  "UTC",
                  "America/New_York",
                  "America/Los_Angeles",
                  "America/Chicago",
                  "Europe/London",
                  "Europe/Paris",
                  "Europe/Moscow",
                  "Asia/Tokyo",
                  "Asia/Shanghai",
                  "Asia/Dubai",
                  "Australia/Sydney",
                  "Pacific/Auckland",
                ].map((tz) => (
                  <div key={tz} className="bg-gray-100 dark:bg-gray-800 rounded px-2 py-1 text-gray-700 dark:text-gray-300">
                    {tz}
                  </div>
                ))}
              </div>
              <p className="text-gray-500 dark:text-gray-500 text-sm mt-2">And 20+ more timezones available in the dashboard.</p>
            </div>

            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Grace Period</h3>
              <p className="text-gray-500 dark:text-gray-400 mb-4">
                The grace period (1-60 minutes) is extra time added after the expected ping time before marking a check as &quot;down&quot;.
                This accounts for:
              </p>
              <ul className="text-gray-700 dark:text-gray-300 space-y-2">
                <li className="flex items-start gap-2">
                  <span className="text-blue-400">•</span>
                  Jobs that take variable time to complete
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-400">•</span>
                  Network latency or temporary connectivity issues
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-400">•</span>
                  Server load causing slight delays
                </li>
              </ul>
              <div className="mt-4 bg-blue-500/10 border border-blue-500/30 rounded-lg p-3">
                <p className="text-blue-600 dark:text-blue-400 text-sm">
                  <strong>Example:</strong> If your job runs at 2:00 AM with a 5-minute grace period,
                  CronOwl won&apos;t alert until 2:05 AM if no ping is received.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Notifications */}
        <section id="notifications" className="mb-16">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Notifications</h2>

          <p className="text-gray-500 dark:text-gray-400 mb-6">
            CronOwl sends notifications through multiple channels. Configure them in your{" "}
            <Link href="/settings" className="text-blue-400 hover:underline">Settings</Link>.
          </p>

          <div className="space-y-6">
            {/* Email */}
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Email</h3>
                  <p className="text-gray-500 dark:text-gray-400 text-sm">All plans</p>
                </div>
              </div>
              <p className="text-gray-500 dark:text-gray-400 mb-3">
                Receive detailed email alerts for down, recovery, and slow job events.
                Emails are sent to your account email address.
              </p>
              <p className="text-gray-500 dark:text-gray-500 text-sm">
                Enable in Settings → Notifications → Email notifications
              </p>
            </div>

            {/* Push */}
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Push Notifications</h3>
                  <p className="text-gray-500 dark:text-gray-400 text-sm">All plans</p>
                </div>
              </div>
              <p className="text-gray-500 dark:text-gray-400 mb-3">
                Get instant push notifications on your phone or desktop. Works even when the browser is closed.
                CronOwl is a PWA — install it on your home screen for the best experience.
              </p>
              <p className="text-gray-500 dark:text-gray-500 text-sm">
                Enable in Settings → Notifications → Push notifications (requires browser permission)
              </p>
            </div>

            {/* Telegram */}
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-sky-500/20 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-sky-400" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Telegram</h3>
                  <p className="text-gray-500 dark:text-gray-400 text-sm">All plans</p>
                </div>
              </div>
              <p className="text-gray-500 dark:text-gray-400 mb-3">
                Receive alerts directly in Telegram. Link your account with a simple verification code.
              </p>
              <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4">
                <p className="text-gray-500 dark:text-gray-400 text-sm mb-2">How to connect:</p>
                <ol className="text-gray-700 dark:text-gray-300 text-sm space-y-1">
                  <li>1. Open @CronOwlBot in Telegram</li>
                  <li>2. Copy the 6-digit code from Settings → Telegram</li>
                  <li>3. Send the code to the bot</li>
                  <li>4. Done! You&apos;ll receive alerts in Telegram</li>
                </ol>
              </div>
            </div>

            {/* Webhooks */}
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Webhooks</h3>
                  <p className="text-gray-500 dark:text-gray-400 text-sm">Starter & Pro plans</p>
                </div>
              </div>
              <p className="text-gray-500 dark:text-gray-400 mb-3">
                Send alerts to any HTTP endpoint. Includes native formatting for Slack and Discord.
              </p>

              <div className="space-y-4">
                <div>
                  <h4 className="text-gray-900 dark:text-white font-medium mb-2">Slack</h4>
                  <p className="text-gray-500 dark:text-gray-400 text-sm mb-2">
                    Use a Slack Incoming Webhook URL. Messages are formatted with colored attachments.
                  </p>
                  <CodeBlock>
{`https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXX`}
                  </CodeBlock>
                </div>

                <div>
                  <h4 className="text-gray-900 dark:text-white font-medium mb-2">Discord</h4>
                  <p className="text-gray-500 dark:text-gray-400 text-sm mb-2">
                    Use a Discord Webhook URL. Messages use rich embeds with colors.
                  </p>
                  <CodeBlock>
{`https://discord.com/api/webhooks/000000000000000000/XXXXXXXX`}
                  </CodeBlock>
                </div>

                <div>
                  <h4 className="text-gray-900 dark:text-white font-medium mb-2">Generic Webhook</h4>
                  <p className="text-gray-500 dark:text-gray-400 text-sm mb-2">
                    Any other URL receives a JSON POST request:
                  </p>
                  <CodeBlock title="Payload" language="json">
{`{
  "event": "check.down",
  "check": {
    "id": "abc123",
    "name": "Database Backup",
    "slug": "db-backup-xyz",
    "status": "down"
  },
  "timestamp": "2024-01-20T02:10:00Z",
  "message": "Check 'Database Backup' is DOWN"
}`}
                  </CodeBlock>
                </div>
              </div>
            </div>

            {/* Notification Types */}
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Notification Types</h3>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <span className="w-3 h-3 bg-red-500 rounded-full mt-1.5"></span>
                  <div>
                    <h4 className="text-gray-900 dark:text-white font-medium">Down Alert</h4>
                    <p className="text-gray-500 dark:text-gray-400 text-sm">Sent when a check misses its expected ping time + grace period.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="w-3 h-3 bg-green-500 rounded-full mt-1.5"></span>
                  <div>
                    <h4 className="text-gray-900 dark:text-white font-medium">Recovery Alert</h4>
                    <p className="text-gray-500 dark:text-gray-400 text-sm">Sent when a previously down check receives a ping and is back up.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="w-3 h-3 bg-yellow-500 rounded-full mt-1.5"></span>
                  <div>
                    <h4 className="text-gray-900 dark:text-white font-medium">Slow Job Alert</h4>
                    <p className="text-gray-500 dark:text-gray-400 text-sm">Sent when a job&apos;s duration exceeds the configured maximum duration (maxDuration).</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Status Pages */}
        <section id="status-pages" className="mb-16">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Status Pages</h2>
          <p className="text-gray-500 dark:text-gray-400 mb-6">
            Create public status pages to share the health of your services with your team or customers.
          </p>

          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Features</h3>
              <ul className="space-y-3 text-gray-700 dark:text-gray-300">
                <li className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span><strong>Uptime History</strong> — Visual timeline showing uptime for 7-90 days (depends on plan)</span>
                </li>
                <li className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span><strong>Real-time Status</strong> — Auto-updates every 30 seconds</span>
                </li>
                <li className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span><strong>Incidents</strong> — Post incidents and updates to keep users informed</span>
                </li>
                <li className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span><strong>Custom Branding</strong> — Add your logo, colors, and hide &quot;Powered by CronOwl&quot; (Pro plan)</span>
                </li>
                <li className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span><strong>Status Badge</strong> — Embed a status badge in your README or website</span>
                </li>
              </ul>
            </div>

            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Creating a Status Page</h3>
              <ol className="space-y-3 text-gray-700 dark:text-gray-300">
                <li className="flex items-start gap-3">
                  <span className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-xs flex-shrink-0">1</span>
                  <span>Go to <Link href="/dashboard/status-pages" className="text-blue-400 hover:underline">Status Pages</Link> in your dashboard</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-xs flex-shrink-0">2</span>
                  <span>Click &quot;New Status Page&quot;</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-xs flex-shrink-0">3</span>
                  <span>Enter a title and description</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-xs flex-shrink-0">4</span>
                  <span>Select which checks to display</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-xs flex-shrink-0">5</span>
                  <span>Toggle &quot;Public&quot; to make it accessible</span>
                </li>
              </ol>
            </div>

            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Status Badge</h3>
              <p className="text-gray-500 dark:text-gray-400 mb-4">
                Embed a live status badge in your README or website:
              </p>
              <CodeBlock title="Markdown" language="markdown">
{`[![Status](https://cronowl.com/api/status/YOUR_SLUG/badge)](https://cronowl.com/status/YOUR_SLUG)`}
              </CodeBlock>
              <div className="mt-4">
                <CodeBlock title="HTML" language="html">
{`<a href="https://cronowl.com/status/YOUR_SLUG">
  <img src="https://cronowl.com/api/status/YOUR_SLUG/badge" alt="Status">
</a>`}
                </CodeBlock>
              </div>
            </div>
          </div>
        </section>

        {/* Incidents */}
        <section id="incidents" className="mb-16">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Incident Management</h2>
          <p className="text-gray-500 dark:text-gray-400 mb-6">
            Keep your users informed during outages by creating and managing incidents on your status pages.
          </p>

          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Incident Workflow</h3>
              <div className="flex flex-wrap gap-2 mb-4">
                <span className="px-3 py-1 bg-red-500/20 text-red-400 rounded-full text-sm">Investigating</span>
                <span className="text-gray-500 dark:text-gray-500">→</span>
                <span className="px-3 py-1 bg-yellow-500/20 text-yellow-400 rounded-full text-sm">Identified</span>
                <span className="text-gray-500 dark:text-gray-500">→</span>
                <span className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded-full text-sm">Monitoring</span>
                <span className="text-gray-500 dark:text-gray-500">→</span>
                <span className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-sm">Resolved</span>
              </div>
              <p className="text-gray-500 dark:text-gray-400 text-sm">
                Update the incident status as you progress through the investigation and resolution.
              </p>
            </div>

            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Severity Levels</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <span className="px-2 py-1 bg-yellow-500/20 text-yellow-400 rounded text-xs font-medium">Minor</span>
                  <span className="text-gray-500 dark:text-gray-400">Small issues with minimal impact</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="px-2 py-1 bg-orange-500/20 text-orange-400 rounded text-xs font-medium">Major</span>
                  <span className="text-gray-500 dark:text-gray-400">Significant degradation affecting some users</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="px-2 py-1 bg-red-500/20 text-red-400 rounded text-xs font-medium">Critical</span>
                  <span className="text-gray-500 dark:text-gray-400">Complete outage or major functionality broken</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Integration Examples */}
        <section id="examples" className="mb-16">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Integration Examples</h2>

          {/* Bash */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Bash / Shell Script</h3>
            <CodeBlock title="backup.sh" language="bash">
{`#!/bin/bash
set -e

# Signal job start (optional)
curl -fsS "https://cronowl.com/api/ping/YOUR_SLUG?start=1"

START_TIME=$(date +%s%3N)

# Your backup logic here
pg_dump mydb > /backups/mydb_$(date +%Y%m%d).sql
gzip /backups/mydb_$(date +%Y%m%d).sql

END_TIME=$(date +%s%3N)
DURATION=$((END_TIME - START_TIME))

# Signal completion with duration
curl -fsS "https://cronowl.com/api/ping/YOUR_SLUG?duration=$DURATION&exit_code=$?"`}
            </CodeBlock>
          </div>

          {/* Crontab */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Crontab</h3>
            <CodeBlock title="crontab -e" language="bash">
{`# Run backup every day at 2am and ping CronOwl
0 2 * * * /path/to/backup.sh && curl -fsS https://cronowl.com/api/ping/YOUR_SLUG

# Alternatively, ping even on failure to track exit code
0 2 * * * /path/to/backup.sh; curl -fsS "https://cronowl.com/api/ping/YOUR_SLUG?exit_code=$?"`}
            </CodeBlock>
          </div>

          {/* Python */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Python</h3>
            <CodeBlock title="job.py" language="python">
{`import requests
import time

CRONOWL_URL = "https://cronowl.com/api/ping/YOUR_SLUG"

def main():
    # Signal start
    requests.get(f"{CRONOWL_URL}?start=1", timeout=10)

    start_time = time.time()

    try:
        # Your job logic here
        process_data()

        duration_ms = int((time.time() - start_time) * 1000)
        requests.get(f"{CRONOWL_URL}?duration={duration_ms}", timeout=10)

    except Exception as e:
        requests.get(f"{CRONOWL_URL}?status=failure&output={str(e)[:1000]}", timeout=10)
        raise

if __name__ == "__main__":
    main()`}
            </CodeBlock>
          </div>

          {/* Node.js */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Node.js</h3>
            <CodeBlock title="job.js" language="javascript">
{`const CRONOWL_URL = 'https://cronowl.com/api/ping/YOUR_SLUG';

async function runJob() {
  // Signal start
  await fetch(\`\${CRONOWL_URL}?start=1\`);

  const startTime = Date.now();

  try {
    // Your job logic here
    await processData();

    const duration = Date.now() - startTime;
    await fetch(\`\${CRONOWL_URL}?duration=\${duration}\`);

  } catch (error) {
    await fetch(\`\${CRONOWL_URL}?status=failure&output=\${encodeURIComponent(error.message)}\`);
    throw error;
  }
}

runJob();`}
            </CodeBlock>
          </div>

          {/* Docker / Kubernetes */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Docker / Kubernetes CronJob</h3>
            <CodeBlock title="cronjob.yaml" language="yaml">
{`apiVersion: batch/v1
kind: CronJob
metadata:
  name: database-backup
spec:
  schedule: "0 2 * * *"
  jobTemplate:
    spec:
      template:
        spec:
          containers:
          - name: backup
            image: your-backup-image
            command:
            - /bin/sh
            - -c
            - |
              curl -fsS "https://cronowl.com/api/ping/YOUR_SLUG?start=1"
              START=$(date +%s%3N)
              /backup.sh
              EXIT_CODE=$?
              END=$(date +%s%3N)
              DURATION=$((END - START))
              curl -fsS "https://cronowl.com/api/ping/YOUR_SLUG?duration=$DURATION&exit_code=$EXIT_CODE"
          restartPolicy: OnFailure`}
            </CodeBlock>
          </div>

          {/* GitHub Actions */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">GitHub Actions</h3>
            <CodeBlock title=".github/workflows/scheduled.yml" language="yaml">
{`name: Scheduled Job
on:
  schedule:
    - cron: '0 */6 * * *'  # Every 6 hours

jobs:
  run:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Signal start
        run: curl -fsS "https://cronowl.com/api/ping/YOUR_SLUG?start=1"

      - name: Run job
        id: job
        run: |
          START=$(date +%s%3N)
          # Your job here
          npm run process-data
          echo "duration=$(($(date +%s%3N) - START))" >> $GITHUB_OUTPUT

      - name: Signal completion
        if: always()
        run: |
          curl -fsS "https://cronowl.com/api/ping/YOUR_SLUG?duration=\${{ steps.job.outputs.duration }}"`}
            </CodeBlock>
          </div>
        </section>

        {/* Ping Options */}
        <section id="ping-options" className="mb-16">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Ping Options</h2>
          <p className="text-gray-500 dark:text-gray-400 mb-6">
            The ping endpoint accepts optional parameters to provide more context about your job.
          </p>

          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden mb-6">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-800">
                  <th className="text-left py-3 px-4 text-gray-500 dark:text-gray-400">Parameter</th>
                  <th className="text-left py-3 px-4 text-gray-500 dark:text-gray-400">Description</th>
                  <th className="text-left py-3 px-4 text-gray-500 dark:text-gray-400">Example</th>
                </tr>
              </thead>
              <tbody className="text-gray-700 dark:text-gray-300">
                <tr className="border-b border-gray-200 dark:border-gray-800">
                  <td className="py-3 px-4"><code className="text-green-600 dark:text-green-400">start=1</code></td>
                  <td className="py-3 px-4">Signal job start (doesn&apos;t change status)</td>
                  <td className="py-3 px-4 text-gray-500 dark:text-gray-500">?start=1</td>
                </tr>
                <tr className="border-b border-gray-200 dark:border-gray-800">
                  <td className="py-3 px-4"><code className="text-green-600 dark:text-green-400">duration</code></td>
                  <td className="py-3 px-4">Job duration in milliseconds</td>
                  <td className="py-3 px-4 text-gray-500 dark:text-gray-500">?duration=45000</td>
                </tr>
                <tr className="border-b border-gray-200 dark:border-gray-800">
                  <td className="py-3 px-4"><code className="text-green-600 dark:text-green-400">exit_code</code></td>
                  <td className="py-3 px-4">Exit code (0 = success, non-zero = failure)</td>
                  <td className="py-3 px-4 text-gray-500 dark:text-gray-500">?exit_code=0</td>
                </tr>
                <tr className="border-b border-gray-200 dark:border-gray-800">
                  <td className="py-3 px-4"><code className="text-green-600 dark:text-green-400">status</code></td>
                  <td className="py-3 px-4">&quot;success&quot; or &quot;failure&quot;</td>
                  <td className="py-3 px-4 text-gray-500 dark:text-gray-500">?status=failure</td>
                </tr>
                <tr className="border-b border-gray-200 dark:border-gray-800">
                  <td className="py-3 px-4"><code className="text-green-600 dark:text-green-400">output</code></td>
                  <td className="py-3 px-4">Job output/logs (max 1-10KB based on plan)</td>
                  <td className="py-3 px-4 text-gray-500 dark:text-gray-500">?output=Done</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="space-y-4">
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
              <p className="text-blue-600 dark:text-blue-400 text-sm">
                <strong>Tip:</strong> Use <code>exit_code</code> to automatically mark jobs as failed when they exit with an error.
                CronOwl treats exit_code != 0 as a failure.
              </p>
            </div>

            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
              <p className="text-yellow-600 dark:text-yellow-400 text-sm">
                <strong>Slow Job Detection:</strong> If you set <code>maxDuration</code> on your check and send <code>duration</code>
                with your ping, CronOwl will alert you when jobs take longer than expected.
              </p>
            </div>
          </div>
        </section>

        {/* Plan Limits */}
        <section id="plans" className="mb-16">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Plans & Limits</h2>

          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden mb-6">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-800">
                  <th className="text-left py-3 px-4 text-gray-500 dark:text-gray-400">Feature</th>
                  <th className="text-center py-3 px-4 text-gray-500 dark:text-gray-400">Free</th>
                  <th className="text-center py-3 px-4 text-gray-500 dark:text-gray-400">Starter ($4/mo)</th>
                  <th className="text-center py-3 px-4 text-gray-500 dark:text-gray-400">Pro ($9/mo)</th>
                </tr>
              </thead>
              <tbody className="text-gray-700 dark:text-gray-300">
                <tr className="border-b border-gray-200 dark:border-gray-800">
                  <td className="py-3 px-4">Checks</td>
                  <td className="py-3 px-4 text-center">25</td>
                  <td className="py-3 px-4 text-center">100</td>
                  <td className="py-3 px-4 text-center">500</td>
                </tr>
                <tr className="border-b border-gray-200 dark:border-gray-800">
                  <td className="py-3 px-4">Status Pages</td>
                  <td className="py-3 px-4 text-center">1</td>
                  <td className="py-3 px-4 text-center">3</td>
                  <td className="py-3 px-4 text-center">10</td>
                </tr>
                <tr className="border-b border-gray-200 dark:border-gray-800">
                  <td className="py-3 px-4">History Days</td>
                  <td className="py-3 px-4 text-center">7</td>
                  <td className="py-3 px-4 text-center">30</td>
                  <td className="py-3 px-4 text-center">90</td>
                </tr>
                <tr className="border-b border-gray-200 dark:border-gray-800">
                  <td className="py-3 px-4">API Requests/min</td>
                  <td className="py-3 px-4 text-center">30</td>
                  <td className="py-3 px-4 text-center">120</td>
                  <td className="py-3 px-4 text-center">300</td>
                </tr>
                <tr className="border-b border-gray-200 dark:border-gray-800">
                  <td className="py-3 px-4">Webhooks per Check</td>
                  <td className="py-3 px-4 text-center">—</td>
                  <td className="py-3 px-4 text-center">3</td>
                  <td className="py-3 px-4 text-center">10</td>
                </tr>
                <tr className="border-b border-gray-200 dark:border-gray-800">
                  <td className="py-3 px-4">Custom Branding</td>
                  <td className="py-3 px-4 text-center">—</td>
                  <td className="py-3 px-4 text-center">—</td>
                  <td className="py-3 px-4 text-center">✓</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="flex gap-4">
            <Link
              href="/pricing"
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
            >
              View Pricing
            </Link>
            <Link
              href="/signup"
              className="px-6 py-3 bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700 text-gray-900 dark:text-white rounded-lg font-medium transition-colors"
            >
              Get Started Free
            </Link>
          </div>
        </section>

        {/* FAQ */}
        <section id="faq" className="mb-16">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Frequently Asked Questions</h2>

          <div className="space-y-4">
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-6">
              <h3 className="text-gray-900 dark:text-white font-medium mb-2">What happens if my job runs but fails to ping CronOwl?</h3>
              <p className="text-gray-500 dark:text-gray-400">
                If CronOwl doesn&apos;t receive a ping within the expected time + grace period, it marks the check as &quot;down&quot; and sends alerts.
                This could mean your job failed, the network was unreachable, or the ping command wasn&apos;t executed.
              </p>
            </div>

            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-6">
              <h3 className="text-gray-900 dark:text-white font-medium mb-2">How often does CronOwl check for missed pings?</h3>
              <p className="text-gray-500 dark:text-gray-400">
                CronOwl runs a status check every minute. This means you&apos;ll be alerted within 1 minute of your grace period expiring.
              </p>
            </div>

            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-6">
              <h3 className="text-gray-900 dark:text-white font-medium mb-2">Can I pause monitoring temporarily?</h3>
              <p className="text-gray-500 dark:text-gray-400">
                Yes! Click the pause button on any check in your dashboard. Paused checks won&apos;t trigger alerts even if they miss pings.
                Resume monitoring anytime with a single click.
              </p>
            </div>

            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-6">
              <h3 className="text-gray-900 dark:text-white font-medium mb-2">What&apos;s the difference between exit_code and status?</h3>
              <p className="text-gray-500 dark:text-gray-400">
                <code className="text-green-600 dark:text-green-400">exit_code</code> is the numeric exit code from your script (0 = success, non-zero = failure).
                <code className="text-green-600 dark:text-green-400">status</code> is a string (&quot;success&quot; or &quot;failure&quot;) for explicit control.
                If both are provided, <code>status</code> takes precedence.
              </p>
            </div>

            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-6">
              <h3 className="text-gray-900 dark:text-white font-medium mb-2">Is there a way to monitor from the command line?</h3>
              <p className="text-gray-500 dark:text-gray-400">
                Yes! CronOwl provides a full REST API. Use your API key to list checks, create new ones, view history, and more.
                See the <Link href="/docs/api" className="text-blue-400 hover:underline">API documentation</Link> for details.
              </p>
            </div>

            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-6">
              <h3 className="text-gray-900 dark:text-white font-medium mb-2">How secure is my data?</h3>
              <p className="text-gray-500 dark:text-gray-400">
                CronOwl uses industry-standard security practices: HTTPS everywhere, encrypted data at rest,
                API keys are hashed before storage, and webhook URLs are validated to prevent SSRF attacks.
              </p>
            </div>
          </div>
        </section>

        {/* Footer */}
        <div className="border-t border-gray-200 dark:border-gray-800 pt-8 mt-12">
          <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
            <p className="text-gray-500 dark:text-gray-500">
              Need help? Contact us at{" "}
              <a href="mailto:support@cronowl.com" className="text-blue-400 hover:underline">
                support@cronowl.com
              </a>
            </p>
            <div className="flex gap-4">
              <Link href="/docs/api" className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">
                API Reference
              </Link>
              <Link href="/pricing" className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">
                Pricing
              </Link>
              <Link href="/dashboard" className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">
                Dashboard
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
