import Link from "next/link";
import { PublicHeader } from "@/components/PublicHeader";

function CodeBlock({ children, title, language }: { children: string; title?: string; language?: string }) {
  return (
    &lt;div className="bg-gray-950 rounded-lg overflow-hidden"&gt;
      {title &amp;&amp; (
        &lt;div className="bg-gray-900 px-4 py-2 text-sm text-gray-400 border-b border-gray-800 flex justify-between"&gt;
          &lt;span&gt;{title}&lt;/span&gt;
          {language &amp;&amp; &lt;span className="text-gray-500"&gt;{language}&lt;/span&gt;}
        &lt;/div&gt;
      )}
      &lt;pre className="p-4 text-sm text-green-400 overflow-x-auto"&gt;
        &lt;code&gt;{children}&lt;/code&gt;
      &lt;/pre&gt;
    &lt;/div&gt;
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
    &lt;Link
      href={href}
      className="bg-gray-900 border border-gray-800 rounded-lg p-6 hover:border-gray-700 transition-colors group"
    &gt;
      &lt;div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center mb-4 group-hover:bg-blue-500/30 transition-colors"&gt;
        {icon}
      &lt;/div&gt;
      &lt;h3 className="text-lg font-semibold text-white mb-2"&gt;{title}&lt;/h3&gt;
      &lt;p className="text-gray-400 text-sm"&gt;{description}&lt;/p&gt;
    &lt;/Link&gt;
  );
}

function TableOfContents() {
  const sections = [
    { id: "what-is-cronowl", title: "What is CronOwl?" },
    { id: "quick-start", title: "Quick Start" },
    { id: "how-it-works", title: "How It Works" },
    { id: "schedules", title: "Schedules &amp; Cron Expressions" },
    { id: "notifications", title: "Notifications" },
    { id: "status-pages", title: "Status Pages" },
    { id: "incidents", title: "Incident Management" },
    { id: "examples", title: "Integration Examples" },
    { id: "ping-options", title: "Ping Options" },
    { id: "plans", title: "Plans &amp; Limits" },
    { id: "faq", title: "FAQ" },
  ];

  return (
    &lt;nav className="bg-gray-900 rounded-lg p-6 mb-12"&gt;
      &lt;h3 className="text-lg font-semibold text-white mb-4"&gt;Table of Contents&lt;/h3&gt;
      &lt;ul className="space-y-2"&gt;
        {sections.map((section) =&gt; (
          &lt;li key={section.id}&gt;
            &lt;a
              href={`#${section.id}`}
              className="text-gray-400 hover:text-blue-400 transition-colors text-sm"
            &gt;
              {section.title}
            &lt;/a&gt;
          &lt;/li&gt;
        ))}
      &lt;/ul&gt;
    &lt;/nav&gt;
  );
}

export default function DocsPage() {
  return (
    &lt;div className="min-h-screen bg-gray-950"&gt;
      &lt;PublicHeader /&gt;

      &lt;div className="max-w-5xl mx-auto px-4 py-12"&gt;
        {/* Header */}
        &lt;div className="mb-12"&gt;
          &lt;div className="flex items-center gap-2 text-sm text-gray-500 mb-4"&gt;
            &lt;Link href="/" className="hover:text-gray-400"&gt;Home&lt;/Link&gt;
            &lt;span&gt;/&lt;/span&gt;
            &lt;span className="text-gray-400"&gt;Documentation&lt;/span&gt;
          &lt;/div&gt;
          &lt;h1 className="text-4xl font-bold text-white mb-4"&gt;Documentation&lt;/h1&gt;
          &lt;p className="text-xl text-gray-400"&gt;
            Complete guide to monitoring your cron jobs with CronOwl
          &lt;/p&gt;
        &lt;/div&gt;

        {/* Quick Links */}
        &lt;div className="grid md:grid-cols-3 gap-4 mb-12"&gt;
          &lt;DocCard
            title="Quick Start"
            description="Get started in 2 minutes"
            href="#quick-start"
            icon={
              &lt;svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"&gt;
                &lt;path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /&gt;
              &lt;/svg&gt;
            }
          /&gt;
          &lt;DocCard
            title="API Reference"
            description="Full REST API documentation"
            href="/docs/api"
            icon={
              &lt;svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"&gt;
                &lt;path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" /&gt;
              &lt;/svg&gt;
            }
          /&gt;
          &lt;DocCard
            title="Status Pages"
            description="Public status pages for your users"
            href="#status-pages"
            icon={
              &lt;svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"&gt;
                &lt;path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /&gt;
              &lt;/svg&gt;
            }
          /&gt;
        &lt;/div&gt;

        {/* Table of Contents */}
        &lt;TableOfContents /&gt;

        {/* What is CronOwl */}
        &lt;section id="what-is-cronowl" className="mb-16"&gt;
          &lt;h2 className="text-2xl font-bold text-white mb-6"&gt;What is CronOwl?&lt;/h2&gt;

          &lt;div className="prose prose-invert max-w-none"&gt;
            &lt;p className="text-gray-400 mb-4"&gt;
              CronOwl is a &lt;strong className="text-white"&gt;dead man&apos;s switch&lt;/strong&gt; monitoring service for your scheduled tasks and cron jobs.
              Instead of actively checking if your servers are up, CronOwl waits for your jobs to &quot;check in&quot; by sending a simple HTTP request (ping).
            &lt;/p&gt;

            &lt;p className="text-gray-400 mb-6"&gt;
              If a ping doesn&apos;t arrive within the expected time window, CronOwl knows something is wrong and immediately alerts you via email, push notifications, Telegram, or webhooks.
            &lt;/p&gt;

            &lt;div className="bg-gray-900 rounded-lg p-6 mb-6"&gt;
              &lt;h3 className="text-lg font-semibold text-white mb-4"&gt;Perfect for monitoring:&lt;/h3&gt;
              &lt;ul className="grid md:grid-cols-2 gap-3 text-gray-300"&gt;
                &lt;li className="flex items-center gap-2"&gt;
                  &lt;svg className="w-5 h-5 text-green-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"&gt;
                    &lt;path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /&gt;
                  &lt;/svg&gt;
                  Database backups
                &lt;/li&gt;
                &lt;li className="flex items-center gap-2"&gt;
                  &lt;svg className="w-5 h-5 text-green-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"&gt;
                    &lt;path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /&gt;
                  &lt;/svg&gt;
                  Data synchronization jobs
                &lt;/li&gt;
                &lt;li className="flex items-center gap-2"&gt;
                  &lt;svg className="w-5 h-5 text-green-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"&gt;
                    &lt;path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /&gt;
                  &lt;/svg&gt;
                  Report generation
                &lt;/li&gt;
                &lt;li className="flex items-center gap-2"&gt;
                  &lt;svg className="w-5 h-5 text-green-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"&gt;
                    &lt;path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /&gt;
                  &lt;/svg&gt;
                  Email queue processing
                &lt;/li&gt;
                &lt;li className="flex items-center gap-2"&gt;
                  &lt;svg className="w-5 h-5 text-green-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"&gt;
                    &lt;path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /&gt;
                  &lt;/svg&gt;
                  Scheduled API calls
                &lt;/li&gt;
                &lt;li className="flex items-center gap-2"&gt;
                  &lt;svg className="w-5 h-5 text-green-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"&gt;
                    &lt;path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /&gt;
                  &lt;/svg&gt;
                  Cleanup and maintenance tasks
                &lt;/li&gt;
                &lt;li className="flex items-center gap-2"&gt;
                  &lt;svg className="w-5 h-5 text-green-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"&gt;
                    &lt;path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /&gt;
                  &lt;/svg&gt;
                  Payment processing
                &lt;/li&gt;
                &lt;li className="flex items-center gap-2"&gt;
                  &lt;svg className="w-5 h-5 text-green-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"&gt;
                    &lt;path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /&gt;
                  &lt;/svg&gt;
                  Any scheduled task that must run reliably
                &lt;/li&gt;
              &lt;/ul&gt;
            &lt;/div&gt;

            &lt;div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4"&gt;
              &lt;p className="text-blue-400 text-sm"&gt;
                &lt;strong&gt;Why &quot;dead man&apos;s switch&quot;?&lt;/strong&gt; The concept comes from safety devices that trigger when the operator becomes incapacitated.
                Similarly, CronOwl triggers alerts when your job stops &quot;checking in&quot; — meaning something has gone wrong.
              &lt;/p&gt;
            &lt;/div&gt;
          &lt;/div&gt;
        &lt;/section&gt;

        {/* Quick Start */}
        &lt;section id="quick-start" className="mb-16"&gt;
          &lt;h2 className="text-2xl font-bold text-white mb-6"&gt;Quick Start&lt;/h2&gt;

          &lt;div className="space-y-8"&gt;
            {/* Step 1 */}
            &lt;div className="bg-gray-900 rounded-lg p-6"&gt;
              &lt;div className="flex items-center gap-3 mb-4"&gt;
                &lt;span className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-sm"&gt;1&lt;/span&gt;
                &lt;h3 className="text-lg font-semibold text-white"&gt;Create a check&lt;/h3&gt;
              &lt;/div&gt;
              &lt;p className="text-gray-400 mb-4"&gt;
                Go to your &lt;Link href="/dashboard" className="text-blue-400 hover:underline"&gt;Dashboard&lt;/Link&gt; and
                click &quot;New Check&quot;. Give it a descriptive name and set the expected schedule.
              &lt;/p&gt;
              &lt;div className="bg-gray-950 rounded-lg p-4"&gt;
                &lt;p className="text-gray-400 text-sm mb-2"&gt;Example schedules:&lt;/p&gt;
                &lt;ul className="text-gray-300 text-sm space-y-1"&gt;
                  &lt;li&gt;• &lt;code className="text-green-400"&gt;every 5 minutes&lt;/code&gt; — For health checks&lt;/li&gt;
                  &lt;li&gt;• &lt;code className="text-green-400"&gt;every hour&lt;/code&gt; — For hourly reports&lt;/li&gt;
                  &lt;li&gt;• &lt;code className="text-green-400"&gt;every day at 2am&lt;/code&gt; — For nightly backups&lt;/li&gt;
                  &lt;li&gt;• &lt;code className="text-green-400"&gt;0 2 * * *&lt;/code&gt; — Custom cron expression&lt;/li&gt;
                &lt;/ul&gt;
              &lt;/div&gt;
            &lt;/div&gt;

            {/* Step 2 */}
            &lt;div className="bg-gray-900 rounded-lg p-6"&gt;
              &lt;div className="flex items-center gap-3 mb-4"&gt;
                &lt;span className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-sm"&gt;2&lt;/span&gt;
                &lt;h3 className="text-lg font-semibold text-white"&gt;Copy your ping URL&lt;/h3&gt;
              &lt;/div&gt;
              &lt;p className="text-gray-400 mb-4"&gt;
                Each check gets a unique URL. Copy it from the dashboard — it looks like this:
              &lt;/p&gt;
              &lt;CodeBlock&gt;
{`https://cronowl.com/api/ping/abc123xyz`}
              &lt;/CodeBlock&gt;
            &lt;/div&gt;

            {/* Step 3 */}
            &lt;div className="bg-gray-900 rounded-lg p-6"&gt;
              &lt;div className="flex items-center gap-3 mb-4"&gt;
                &lt;span className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-sm"&gt;3&lt;/span&gt;
                &lt;h3 className="text-lg font-semibold text-white"&gt;Add ping to your script&lt;/h3&gt;
              &lt;/div&gt;
              &lt;p className="text-gray-400 mb-4"&gt;
                Add a single curl request at the end of your cron job. When CronOwl receives the ping, it knows your job ran successfully.
              &lt;/p&gt;
              &lt;CodeBlock title="backup.sh" language="bash"&gt;
{`#!/bin/bash
set -e

# Your backup logic
pg_dump mydb &gt; /backups/mydb_$(date +%Y%m%d).sql

# Ping CronOwl on success
curl -fsS --retry 3 https://cronowl.com/api/ping/YOUR_SLUG`}
              &lt;/CodeBlock&gt;
            &lt;/div&gt;

            {/* Step 4 */}
            &lt;div className="bg-gray-900 rounded-lg p-6"&gt;
              &lt;div className="flex items-center gap-3 mb-4"&gt;
                &lt;span className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-sm"&gt;4&lt;/span&gt;
                &lt;h3 className="text-lg font-semibold text-white"&gt;Get alerts when things break&lt;/h3&gt;
              &lt;/div&gt;
              &lt;p className="text-gray-400 mb-4"&gt;
                If your job doesn&apos;t ping within the expected time + grace period, we&apos;ll alert you immediately:
              &lt;/p&gt;
              &lt;div className="grid grid-cols-2 md:grid-cols-4 gap-4"&gt;
                &lt;div className="bg-gray-950 rounded-lg p-3 text-center"&gt;
                  &lt;span className="text-2xl mb-2 block"&gt;Email&lt;/span&gt;
                  &lt;span className="text-gray-300 text-sm"&gt;Instant alerts&lt;/span&gt;
                &lt;/div&gt;
                &lt;div className="bg-gray-950 rounded-lg p-3 text-center"&gt;
                  &lt;span className="text-2xl mb-2 block"&gt;Push&lt;/span&gt;
                  &lt;span className="text-gray-300 text-sm"&gt;Mobile &amp; web&lt;/span&gt;
                &lt;/div&gt;
                &lt;div className="bg-gray-950 rounded-lg p-3 text-center"&gt;
                  &lt;span className="text-2xl mb-2 block"&gt;Telegram&lt;/span&gt;
                  &lt;span className="text-gray-300 text-sm"&gt;Bot messages&lt;/span&gt;
                &lt;/div&gt;
                &lt;div className="bg-gray-950 rounded-lg p-3 text-center"&gt;
                  &lt;span className="text-2xl mb-2 block"&gt;Webhook&lt;/span&gt;
                  &lt;span className="text-gray-300 text-sm"&gt;Slack, Discord&lt;/span&gt;
                &lt;/div&gt;
              &lt;/div&gt;
            &lt;/div&gt;
          &lt;/div&gt;
        &lt;/section&gt;

        {/* How It Works */}
        &lt;section id="how-it-works" className="mb-16"&gt;
          &lt;h2 className="text-2xl font-bold text-white mb-6"&gt;How It Works&lt;/h2&gt;

          &lt;div className="bg-gray-900 rounded-lg p-6 mb-6"&gt;
            &lt;div className="space-y-6"&gt;
              &lt;div className="flex items-start gap-4"&gt;
                &lt;div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center flex-shrink-0"&gt;
                  &lt;svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"&gt;
                    &lt;path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /&gt;
                  &lt;/svg&gt;
                &lt;/div&gt;
                &lt;div&gt;
                  &lt;h4 className="text-white font-medium mb-1"&gt;1. Your job runs and pings CronOwl&lt;/h4&gt;
                  &lt;p className="text-gray-400 text-sm"&gt;
                    At the end of your script, make an HTTP request to your unique ping URL.
                    CronOwl records the timestamp, duration, and any metadata you send.
                  &lt;/p&gt;
                &lt;/div&gt;
              &lt;/div&gt;

              &lt;div className="flex items-start gap-4"&gt;
                &lt;div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center flex-shrink-0"&gt;
                  &lt;svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"&gt;
                    &lt;path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /&gt;
                  &lt;/svg&gt;
                &lt;/div&gt;
                &lt;div&gt;
                  &lt;h4 className="text-white font-medium mb-1"&gt;2. CronOwl tracks the schedule&lt;/h4&gt;
                  &lt;p className="text-gray-400 text-sm"&gt;
                    Based on your configured schedule (e.g., &quot;every hour&quot;), CronOwl knows when the next ping should arrive.
                    It continuously monitors all your checks.
                  &lt;/p&gt;
                &lt;/div&gt;
              &lt;/div&gt;

              &lt;div className="flex items-start gap-4"&gt;
                &lt;div className="w-10 h-10 bg-yellow-500/20 rounded-lg flex items-center justify-center flex-shrink-0"&gt;
                  &lt;svg className="w-5 h-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"&gt;
                    &lt;path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /&gt;
                  &lt;/svg&gt;
                &lt;/div&gt;
                &lt;div&gt;
                  &lt;h4 className="text-white font-medium mb-1"&gt;3. Grace period buffer&lt;/h4&gt;
                  &lt;p className="text-gray-400 text-sm"&gt;
                    Jobs don&apos;t always run at exactly the same time. The grace period (1-60 minutes) gives your job
                    extra time before CronOwl considers it late.
                  &lt;/p&gt;
                &lt;/div&gt;
              &lt;/div&gt;

              &lt;div className="flex items-start gap-4"&gt;
                &lt;div className="w-10 h-10 bg-red-500/20 rounded-lg flex items-center justify-center flex-shrink-0"&gt;
                  &lt;svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"&gt;
                    &lt;path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /&gt;
                  &lt;/svg&gt;
                &lt;/div&gt;
                &lt;div&gt;
                  &lt;h4 className="text-white font-medium mb-1"&gt;4. Alert on missing ping&lt;/h4&gt;
                  &lt;p className="text-gray-400 text-sm"&gt;
                    If the expected time + grace period passes without a ping, CronOwl immediately sends alerts
                    through all your configured channels.
                  &lt;/p&gt;
                &lt;/div&gt;
              &lt;/div&gt;

              &lt;div className="flex items-start gap-4"&gt;
                &lt;div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center flex-shrink-0"&gt;
                  &lt;svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"&gt;
                    &lt;path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /&gt;
                  &lt;/svg&gt;
                &lt;/div&gt;
                &lt;div&gt;
                  &lt;h4 className="text-white font-medium mb-1"&gt;5. Recovery notification&lt;/h4&gt;
                  &lt;p className="text-gray-400 text-sm"&gt;
                    When a previously &quot;down&quot; check receives a ping again, CronOwl sends a recovery notification
                    so you know the issue is resolved.
                  &lt;/p&gt;
                &lt;/div&gt;
              &lt;/div&gt;
            &lt;/div&gt;
          &lt;/div&gt;

          &lt;div className="bg-gray-900 rounded-lg p-6"&gt;
            &lt;h3 className="text-lg font-semibold text-white mb-4"&gt;Status States&lt;/h3&gt;
            &lt;div className="grid md:grid-cols-3 gap-4"&gt;
              &lt;div className="bg-gray-950 rounded-lg p-4"&gt;
                &lt;div className="flex items-center gap-2 mb-2"&gt;
                  &lt;span className="w-3 h-3 bg-gray-500 rounded-full"&gt;&lt;/span&gt;
                  &lt;span className="text-white font-medium"&gt;New&lt;/span&gt;
                &lt;/div&gt;
                &lt;p className="text-gray-400 text-sm"&gt;Check created but no pings received yet. Waiting for first ping.&lt;/p&gt;
              &lt;/div&gt;
              &lt;div className="bg-gray-950 rounded-lg p-4"&gt;
                &lt;div className="flex items-center gap-2 mb-2"&gt;
                  &lt;span className="w-3 h-3 bg-green-500 rounded-full"&gt;&lt;/span&gt;
                  &lt;span className="text-white font-medium"&gt;Up&lt;/span&gt;
                &lt;/div&gt;
                &lt;p className="text-gray-400 text-sm"&gt;Pings arriving on schedule. Everything is working correctly.&lt;/p&gt;
              &lt;/div&gt;
              &lt;div className="bg-gray-950 rounded-lg p-4"&gt;
                &lt;div className="flex items-center gap-2 mb-2"&gt;
                  &lt;span className="w-3 h-3 bg-red-500 rounded-full"&gt;&lt;/span&gt;
                  &lt;span className="text-white font-medium"&gt;Down&lt;/span&gt;
                &lt;/div&gt;
                &lt;p className="text-gray-400 text-sm"&gt;Ping is late. Expected time + grace period has passed without a ping.&lt;/p&gt;
              &lt;/div&gt;
            &lt;/div&gt;
          &lt;/div&gt;
        &lt;/section&gt;

        {/* Schedules */}
        &lt;section id="schedules" className="mb-16"&gt;
          &lt;h2 className="text-2xl font-bold text-white mb-6"&gt;Schedules &amp; Cron Expressions&lt;/h2&gt;

          &lt;div className="space-y-6"&gt;
            &lt;div className="bg-gray-900 rounded-lg p-6"&gt;
              &lt;h3 className="text-lg font-semibold text-white mb-4"&gt;Preset Schedules&lt;/h3&gt;
              &lt;p className="text-gray-400 mb-4"&gt;
                Choose from common intervals for quick setup:
              &lt;/p&gt;
              &lt;div className="grid md:grid-cols-3 gap-3"&gt;
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
                ].map((schedule) =&gt; (
                  &lt;div key={schedule} className="bg-gray-950 rounded px-3 py-2 text-green-400 text-sm font-mono"&gt;
                    {schedule}
                  &lt;/div&gt;
                ))}
              &lt;/div&gt;
            &lt;/div&gt;

            &lt;div className="bg-gray-900 rounded-lg p-6"&gt;
              &lt;h3 className="text-lg font-semibold text-white mb-4"&gt;Custom Cron Expressions&lt;/h3&gt;
              &lt;p className="text-gray-400 mb-4"&gt;
                For precise control, use standard cron syntax:
              &lt;/p&gt;

              &lt;div className="bg-gray-950 rounded-lg p-4 mb-4"&gt;
                &lt;code className="text-green-400"&gt;* * * * *&lt;/code&gt;
                &lt;div className="flex gap-2 mt-2 text-xs text-gray-500"&gt;
                  &lt;span className="flex-1 text-center"&gt;minute&lt;br/&gt;(0-59)&lt;/span&gt;
                  &lt;span className="flex-1 text-center"&gt;hour&lt;br/&gt;(0-23)&lt;/span&gt;
                  &lt;span className="flex-1 text-center"&gt;day&lt;br/&gt;(1-31)&lt;/span&gt;
                  &lt;span className="flex-1 text-center"&gt;month&lt;br/&gt;(1-12)&lt;/span&gt;
                  &lt;span className="flex-1 text-center"&gt;weekday&lt;br/&gt;(0-6)&lt;/span&gt;
                &lt;/div&gt;
              &lt;/div&gt;

              &lt;table className="w-full text-sm"&gt;
                &lt;thead&gt;
                  &lt;tr className="border-b border-gray-800"&gt;
                    &lt;th className="text-left py-2 text-gray-400"&gt;Expression&lt;/th&gt;
                    &lt;th className="text-left py-2 text-gray-400"&gt;Description&lt;/th&gt;
                  &lt;/tr&gt;
                &lt;/thead&gt;
                &lt;tbody className="text-gray-300"&gt;
                  &lt;tr className="border-b border-gray-800"&gt;
                    &lt;td className="py-2"&gt;&lt;code className="text-green-400"&gt;*/5 * * * *&lt;/code&gt;&lt;/td&gt;
                    &lt;td className="py-2"&gt;Every 5 minutes&lt;/td&gt;
                  &lt;/tr&gt;
                  &lt;tr className="border-b border-gray-800"&gt;
                    &lt;td className="py-2"&gt;&lt;code className="text-green-400"&gt;0 * * * *&lt;/code&gt;&lt;/td&gt;
                    &lt;td className="py-2"&gt;Every hour at minute 0&lt;/td&gt;
                  &lt;/tr&gt;
                  &lt;tr className="border-b border-gray-800"&gt;
                    &lt;td className="py-2"&gt;&lt;code className="text-green-400"&gt;0 2 * * *&lt;/code&gt;&lt;/td&gt;
                    &lt;td className="py-2"&gt;Every day at 2:00 AM&lt;/td&gt;
                  &lt;/tr&gt;
                  &lt;tr className="border-b border-gray-800"&gt;
                    &lt;td className="py-2"&gt;&lt;code className="text-green-400"&gt;0 9 * * 1-5&lt;/code&gt;&lt;/td&gt;
                    &lt;td className="py-2"&gt;Every weekday at 9:00 AM&lt;/td&gt;
                  &lt;/tr&gt;
                  &lt;tr className="border-b border-gray-800"&gt;
                    &lt;td className="py-2"&gt;&lt;code className="text-green-400"&gt;0 0 1 * *&lt;/code&gt;&lt;/td&gt;
                    &lt;td className="py-2"&gt;First day of every month at midnight&lt;/td&gt;
                  &lt;/tr&gt;
                  &lt;tr className="border-b border-gray-800"&gt;
                    &lt;td className="py-2"&gt;&lt;code className="text-green-400"&gt;30 4 * * 0&lt;/code&gt;&lt;/td&gt;
                    &lt;td className="py-2"&gt;Every Sunday at 4:30 AM&lt;/td&gt;
                  &lt;/tr&gt;
                &lt;/tbody&gt;
              &lt;/table&gt;
            &lt;/div&gt;

            &lt;div className="bg-gray-900 rounded-lg p-6"&gt;
              &lt;h3 className="text-lg font-semibold text-white mb-4"&gt;Timezone Support&lt;/h3&gt;
              &lt;p className="text-gray-400 mb-4"&gt;
                All schedules are evaluated in your selected timezone. Supported timezones include:
              &lt;/p&gt;
              &lt;div className="grid md:grid-cols-4 gap-2 text-sm"&gt;
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
                ].map((tz) =&gt; (
                  &lt;div key={tz} className="bg-gray-950 rounded px-2 py-1 text-gray-300"&gt;
                    {tz}
                  &lt;/div&gt;
                ))}
              &lt;/div&gt;
              &lt;p className="text-gray-500 text-sm mt-2"&gt;And 20+ more timezones available in the dashboard.&lt;/p&gt;
            &lt;/div&gt;

            &lt;div className="bg-gray-900 rounded-lg p-6"&gt;
              &lt;h3 className="text-lg font-semibold text-white mb-4"&gt;Grace Period&lt;/h3&gt;
              &lt;p className="text-gray-400 mb-4"&gt;
                The grace period (1-60 minutes) is extra time added after the expected ping time before marking a check as &quot;down&quot;.
                This accounts for:
              &lt;/p&gt;
              &lt;ul className="text-gray-300 space-y-2"&gt;
                &lt;li className="flex items-start gap-2"&gt;
                  &lt;span className="text-blue-400"&gt;•&lt;/span&gt;
                  Jobs that take variable time to complete
                &lt;/li&gt;
                &lt;li className="flex items-start gap-2"&gt;
                  &lt;span className="text-blue-400"&gt;•&lt;/span&gt;
                  Network latency or temporary connectivity issues
                &lt;/li&gt;
                &lt;li className="flex items-start gap-2"&gt;
                  &lt;span className="text-blue-400"&gt;•&lt;/span&gt;
                  Server load causing slight delays
                &lt;/li&gt;
              &lt;/ul&gt;
              &lt;div className="mt-4 bg-blue-500/10 border border-blue-500/30 rounded-lg p-3"&gt;
                &lt;p className="text-blue-400 text-sm"&gt;
                  &lt;strong&gt;Example:&lt;/strong&gt; If your job runs at 2:00 AM with a 5-minute grace period,
                  CronOwl won&apos;t alert until 2:05 AM if no ping is received.
                &lt;/p&gt;
              &lt;/div&gt;
            &lt;/div&gt;
          &lt;/div&gt;
        &lt;/section&gt;

        {/* Notifications */}
        &lt;section id="notifications" className="mb-16"&gt;
          &lt;h2 className="text-2xl font-bold text-white mb-6"&gt;Notifications&lt;/h2&gt;

          &lt;p className="text-gray-400 mb-6"&gt;
            CronOwl sends notifications through multiple channels. Configure them in your{" "}
            &lt;Link href="/settings" className="text-blue-400 hover:underline"&gt;Settings&lt;/Link&gt;.
          &lt;/p&gt;

          &lt;div className="space-y-6"&gt;
            {/* Email */}
            &lt;div className="bg-gray-900 rounded-lg p-6"&gt;
              &lt;div className="flex items-center gap-3 mb-4"&gt;
                &lt;div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center"&gt;
                  &lt;svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"&gt;
                    &lt;path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /&gt;
                  &lt;/svg&gt;
                &lt;/div&gt;
                &lt;div&gt;
                  &lt;h3 className="text-lg font-semibold text-white"&gt;Email&lt;/h3&gt;
                  &lt;p className="text-gray-400 text-sm"&gt;All plans&lt;/p&gt;
                &lt;/div&gt;
              &lt;/div&gt;
              &lt;p className="text-gray-400 mb-3"&gt;
                Receive detailed email alerts for down, recovery, and slow job events.
                Emails are sent to your account email address.
              &lt;/p&gt;
              &lt;p className="text-gray-500 text-sm"&gt;
                Enable in Settings → Notifications → Email notifications
              &lt;/p&gt;
            &lt;/div&gt;

            {/* Push */}
            &lt;div className="bg-gray-900 rounded-lg p-6"&gt;
              &lt;div className="flex items-center gap-3 mb-4"&gt;
                &lt;div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center"&gt;
                  &lt;svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"&gt;
                    &lt;path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /&gt;
                  &lt;/svg&gt;
                &lt;/div&gt;
                &lt;div&gt;
                  &lt;h3 className="text-lg font-semibold text-white"&gt;Push Notifications&lt;/h3&gt;
                  &lt;p className="text-gray-400 text-sm"&gt;All plans&lt;/p&gt;
                &lt;/div&gt;
              &lt;/div&gt;
              &lt;p className="text-gray-400 mb-3"&gt;
                Get instant push notifications on your phone or desktop. Works even when the browser is closed.
                CronOwl is a PWA — install it on your home screen for the best experience.
              &lt;/p&gt;
              &lt;p className="text-gray-500 text-sm"&gt;
                Enable in Settings → Notifications → Push notifications (requires browser permission)
              &lt;/p&gt;
            &lt;/div&gt;

            {/* Telegram */}
            &lt;div className="bg-gray-900 rounded-lg p-6"&gt;
              &lt;div className="flex items-center gap-3 mb-4"&gt;
                &lt;div className="w-10 h-10 bg-sky-500/20 rounded-lg flex items-center justify-center"&gt;
                  &lt;svg className="w-5 h-5 text-sky-400" fill="currentColor" viewBox="0 0 24 24"&gt;
                    &lt;path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/&gt;
                  &lt;/svg&gt;
                &lt;/div&gt;
                &lt;div&gt;
                  &lt;h3 className="text-lg font-semibold text-white"&gt;Telegram&lt;/h3&gt;
                  &lt;p className="text-gray-400 text-sm"&gt;All plans&lt;/p&gt;
                &lt;/div&gt;
              &lt;/div&gt;
              &lt;p className="text-gray-400 mb-3"&gt;
                Receive alerts directly in Telegram. Link your account with a simple verification code.
              &lt;/p&gt;
              &lt;div className="bg-gray-950 rounded-lg p-4"&gt;
                &lt;p className="text-gray-400 text-sm mb-2"&gt;How to connect:&lt;/p&gt;
                &lt;ol className="text-gray-300 text-sm space-y-1"&gt;
                  &lt;li&gt;1. Open @CronOwlBot in Telegram&lt;/li&gt;
                  &lt;li&gt;2. Copy the 6-digit code from Settings → Telegram&lt;/li&gt;
                  &lt;li&gt;3. Send the code to the bot&lt;/li&gt;
                  &lt;li&gt;4. Done! You&apos;ll receive alerts in Telegram&lt;/li&gt;
                &lt;/ol&gt;
              &lt;/div&gt;
            &lt;/div&gt;

            {/* Webhooks */}
            &lt;div className="bg-gray-900 rounded-lg p-6"&gt;
              &lt;div className="flex items-center gap-3 mb-4"&gt;
                &lt;div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center"&gt;
                  &lt;svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"&gt;
                    &lt;path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /&gt;
                  &lt;/svg&gt;
                &lt;/div&gt;
                &lt;div&gt;
                  &lt;h3 className="text-lg font-semibold text-white"&gt;Webhooks&lt;/h3&gt;
                  &lt;p className="text-gray-400 text-sm"&gt;Starter &amp; Pro plans&lt;/p&gt;
                &lt;/div&gt;
              &lt;/div&gt;
              &lt;p className="text-gray-400 mb-3"&gt;
                Send alerts to any HTTP endpoint. Includes native formatting for Slack and Discord.
              &lt;/p&gt;

              &lt;div className="space-y-4"&gt;
                &lt;div&gt;
                  &lt;h4 className="text-white font-medium mb-2"&gt;Slack&lt;/h4&gt;
                  &lt;p className="text-gray-400 text-sm mb-2"&gt;
                    Use a Slack Incoming Webhook URL. Messages are formatted with colored attachments.
                  &lt;/p&gt;
                  &lt;CodeBlock&gt;
{`https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXX`}
                  &lt;/CodeBlock&gt;
                &lt;/div&gt;

                &lt;div&gt;
                  &lt;h4 className="text-white font-medium mb-2"&gt;Discord&lt;/h4&gt;
                  &lt;p className="text-gray-400 text-sm mb-2"&gt;
                    Use a Discord Webhook URL. Messages use rich embeds with colors.
                  &lt;/p&gt;
                  &lt;CodeBlock&gt;
{`https://discord.com/api/webhooks/000000000000000000/XXXXXXXX`}
                  &lt;/CodeBlock&gt;
                &lt;/div&gt;

                &lt;div&gt;
                  &lt;h4 className="text-white font-medium mb-2"&gt;Generic Webhook&lt;/h4&gt;
                  &lt;p className="text-gray-400 text-sm mb-2"&gt;
                    Any other URL receives a JSON POST request:
                  &lt;/p&gt;
                  &lt;CodeBlock title="Payload" language="json"&gt;
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
                  &lt;/CodeBlock&gt;
                &lt;/div&gt;
              &lt;/div&gt;
            &lt;/div&gt;

            {/* Notification Types */}
            &lt;div className="bg-gray-900 rounded-lg p-6"&gt;
              &lt;h3 className="text-lg font-semibold text-white mb-4"&gt;Notification Types&lt;/h3&gt;
              &lt;div className="space-y-4"&gt;
                &lt;div className="flex items-start gap-3"&gt;
                  &lt;span className="w-3 h-3 bg-red-500 rounded-full mt-1.5"&gt;&lt;/span&gt;
                  &lt;div&gt;
                    &lt;h4 className="text-white font-medium"&gt;Down Alert&lt;/h4&gt;
                    &lt;p className="text-gray-400 text-sm"&gt;Sent when a check misses its expected ping time + grace period.&lt;/p&gt;
                  &lt;/div&gt;
                &lt;/div&gt;
                &lt;div className="flex items-start gap-3"&gt;
                  &lt;span className="w-3 h-3 bg-green-500 rounded-full mt-1.5"&gt;&lt;/span&gt;
                  &lt;div&gt;
                    &lt;h4 className="text-white font-medium"&gt;Recovery Alert&lt;/h4&gt;
                    &lt;p className="text-gray-400 text-sm"&gt;Sent when a previously down check receives a ping and is back up.&lt;/p&gt;
                  &lt;/div&gt;
                &lt;/div&gt;
                &lt;div className="flex items-start gap-3"&gt;
                  &lt;span className="w-3 h-3 bg-yellow-500 rounded-full mt-1.5"&gt;&lt;/span&gt;
                  &lt;div&gt;
                    &lt;h4 className="text-white font-medium"&gt;Slow Job Alert&lt;/h4&gt;
                    &lt;p className="text-gray-400 text-sm"&gt;Sent when a job&apos;s duration exceeds the configured maximum duration (maxDuration).&lt;/p&gt;
                  &lt;/div&gt;
                &lt;/div&gt;
              &lt;/div&gt;
            &lt;/div&gt;
          &lt;/div&gt;
        &lt;/section&gt;

        {/* Status Pages */}
        &lt;section id="status-pages" className="mb-16"&gt;
          &lt;h2 className="text-2xl font-bold text-white mb-6"&gt;Status Pages&lt;/h2&gt;
          &lt;p className="text-gray-400 mb-6"&gt;
            Create public status pages to share the health of your services with your team or customers.
          &lt;/p&gt;

          &lt;div className="space-y-6"&gt;
            &lt;div className="bg-gray-900 rounded-lg p-6"&gt;
              &lt;h3 className="text-lg font-semibold text-white mb-4"&gt;Features&lt;/h3&gt;
              &lt;ul className="space-y-3 text-gray-300"&gt;
                &lt;li className="flex items-start gap-3"&gt;
                  &lt;svg className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"&gt;
                    &lt;path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /&gt;
                  &lt;/svg&gt;
                  &lt;span&gt;&lt;strong&gt;Uptime History&lt;/strong&gt; — Visual timeline showing uptime for 7-90 days (depends on plan)&lt;/span&gt;
                &lt;/li&gt;
                &lt;li className="flex items-start gap-3"&gt;
                  &lt;svg className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"&gt;
                    &lt;path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /&gt;
                  &lt;/svg&gt;
                  &lt;span&gt;&lt;strong&gt;Real-time Status&lt;/strong&gt; — Auto-updates every 30 seconds&lt;/span&gt;
                &lt;/li&gt;
                &lt;li className="flex items-start gap-3"&gt;
                  &lt;svg className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"&gt;
                    &lt;path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /&gt;
                  &lt;/svg&gt;
                  &lt;span&gt;&lt;strong&gt;Incidents&lt;/strong&gt; — Post incidents and updates to keep users informed&lt;/span&gt;
                &lt;/li&gt;
                &lt;li className="flex items-start gap-3"&gt;
                  &lt;svg className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"&gt;
                    &lt;path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /&gt;
                  &lt;/svg&gt;
                  &lt;span&gt;&lt;strong&gt;Custom Branding&lt;/strong&gt; — Add your logo, colors, and hide &quot;Powered by CronOwl&quot; (Pro plan)&lt;/span&gt;
                &lt;/li&gt;
                &lt;li className="flex items-start gap-3"&gt;
                  &lt;svg className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"&gt;
                    &lt;path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /&gt;
                  &lt;/svg&gt;
                  &lt;span&gt;&lt;strong&gt;Status Badge&lt;/strong&gt; — Embed a status badge in your README or website&lt;/span&gt;
                &lt;/li&gt;
              &lt;/ul&gt;
            &lt;/div&gt;

            &lt;div className="bg-gray-900 rounded-lg p-6"&gt;
              &lt;h3 className="text-lg font-semibold text-white mb-4"&gt;Creating a Status Page&lt;/h3&gt;
              &lt;ol className="space-y-3 text-gray-300"&gt;
                &lt;li className="flex items-start gap-3"&gt;
                  &lt;span className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-xs flex-shrink-0"&gt;1&lt;/span&gt;
                  &lt;span&gt;Go to &lt;Link href="/dashboard/status-pages" className="text-blue-400 hover:underline"&gt;Status Pages&lt;/Link&gt; in your dashboard&lt;/span&gt;
                &lt;/li&gt;
                &lt;li className="flex items-start gap-3"&gt;
                  &lt;span className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-xs flex-shrink-0"&gt;2&lt;/span&gt;
                  &lt;span&gt;Click &quot;New Status Page&quot;&lt;/span&gt;
                &lt;/li&gt;
                &lt;li className="flex items-start gap-3"&gt;
                  &lt;span className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-xs flex-shrink-0"&gt;3&lt;/span&gt;
                  &lt;span&gt;Enter a title and description&lt;/span&gt;
                &lt;/li&gt;
                &lt;li className="flex items-start gap-3"&gt;
                  &lt;span className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-xs flex-shrink-0"&gt;4&lt;/span&gt;
                  &lt;span&gt;Select which checks to display&lt;/span&gt;
                &lt;/li&gt;
                &lt;li className="flex items-start gap-3"&gt;
                  &lt;span className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-xs flex-shrink-0"&gt;5&lt;/span&gt;
                  &lt;span&gt;Toggle &quot;Public&quot; to make it accessible&lt;/span&gt;
                &lt;/li&gt;
              &lt;/ol&gt;
            &lt;/div&gt;

            &lt;div className="bg-gray-900 rounded-lg p-6"&gt;
              &lt;h3 className="text-lg font-semibold text-white mb-4"&gt;Status Badge&lt;/h3&gt;
              &lt;p className="text-gray-400 mb-4"&gt;
                Embed a live status badge in your README or website:
              &lt;/p&gt;
              &lt;CodeBlock title="Markdown" language="markdown"&gt;
{`[![Status](https://cronowl.com/api/status/YOUR_SLUG/badge)](https://cronowl.com/status/YOUR_SLUG)`}
              &lt;/CodeBlock&gt;
              &lt;div className="mt-4"&gt;
                &lt;CodeBlock title="HTML" language="html"&gt;
{`&lt;a href="https://cronowl.com/status/YOUR_SLUG"&gt;
  &lt;img src="https://cronowl.com/api/status/YOUR_SLUG/badge" alt="Status"&gt;
&lt;/a&gt;`}
                &lt;/CodeBlock&gt;
              &lt;/div&gt;
            &lt;/div&gt;

            &lt;div className="bg-gray-900 rounded-lg p-6"&gt;
              &lt;h3 className="text-lg font-semibold text-white mb-4"&gt;Custom Branding (Pro)&lt;/h3&gt;
              &lt;p className="text-gray-400 mb-4"&gt;
                Pro plan users can customize their status pages:
              &lt;/p&gt;
              &lt;ul className="space-y-2 text-gray-300"&gt;
                &lt;li className="flex items-center gap-2"&gt;
                  &lt;span className="text-blue-400"&gt;•&lt;/span&gt;
                  &lt;strong&gt;Logo URL&lt;/strong&gt; — Display your company logo
                &lt;/li&gt;
                &lt;li className="flex items-center gap-2"&gt;
                  &lt;span className="text-blue-400"&gt;•&lt;/span&gt;
                  &lt;strong&gt;Primary Color&lt;/strong&gt; — Customize the accent color (hex format)
                &lt;/li&gt;
                &lt;li className="flex items-center gap-2"&gt;
                  &lt;span className="text-blue-400"&gt;•&lt;/span&gt;
                  &lt;strong&gt;Hide Powered By&lt;/strong&gt; — Remove &quot;Powered by CronOwl&quot; footer
                &lt;/li&gt;
              &lt;/ul&gt;
            &lt;/div&gt;
          &lt;/div&gt;
        &lt;/section&gt;

        {/* Incidents */}
        &lt;section id="incidents" className="mb-16"&gt;
          &lt;h2 className="text-2xl font-bold text-white mb-6"&gt;Incident Management&lt;/h2&gt;
          &lt;p className="text-gray-400 mb-6"&gt;
            Keep your users informed during outages by creating and managing incidents on your status pages.
          &lt;/p&gt;

          &lt;div className="space-y-6"&gt;
            &lt;div className="bg-gray-900 rounded-lg p-6"&gt;
              &lt;h3 className="text-lg font-semibold text-white mb-4"&gt;Incident Workflow&lt;/h3&gt;
              &lt;div className="flex flex-wrap gap-2 mb-4"&gt;
                &lt;span className="px-3 py-1 bg-red-500/20 text-red-400 rounded-full text-sm"&gt;Investigating&lt;/span&gt;
                &lt;span className="text-gray-500"&gt;→&lt;/span&gt;
                &lt;span className="px-3 py-1 bg-yellow-500/20 text-yellow-400 rounded-full text-sm"&gt;Identified&lt;/span&gt;
                &lt;span className="text-gray-500"&gt;→&lt;/span&gt;
                &lt;span className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded-full text-sm"&gt;Monitoring&lt;/span&gt;
                &lt;span className="text-gray-500"&gt;→&lt;/span&gt;
                &lt;span className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-sm"&gt;Resolved&lt;/span&gt;
              &lt;/div&gt;
              &lt;p className="text-gray-400 text-sm"&gt;
                Update the incident status as you progress through the investigation and resolution.
              &lt;/p&gt;
            &lt;/div&gt;

            &lt;div className="bg-gray-900 rounded-lg p-6"&gt;
              &lt;h3 className="text-lg font-semibold text-white mb-4"&gt;Severity Levels&lt;/h3&gt;
              &lt;div className="space-y-3"&gt;
                &lt;div className="flex items-center gap-3"&gt;
                  &lt;span className="px-2 py-1 bg-yellow-500/20 text-yellow-400 rounded text-xs font-medium"&gt;Minor&lt;/span&gt;
                  &lt;span className="text-gray-400"&gt;Small issues with minimal impact&lt;/span&gt;
                &lt;/div&gt;
                &lt;div className="flex items-center gap-3"&gt;
                  &lt;span className="px-2 py-1 bg-orange-500/20 text-orange-400 rounded text-xs font-medium"&gt;Major&lt;/span&gt;
                  &lt;span className="text-gray-400"&gt;Significant degradation affecting some users&lt;/span&gt;
                &lt;/div&gt;
                &lt;div className="flex items-center gap-3"&gt;
                  &lt;span className="px-2 py-1 bg-red-500/20 text-red-400 rounded text-xs font-medium"&gt;Critical&lt;/span&gt;
                  &lt;span className="text-gray-400"&gt;Complete outage or major functionality broken&lt;/span&gt;
                &lt;/div&gt;
              &lt;/div&gt;
            &lt;/div&gt;

            &lt;div className="bg-gray-900 rounded-lg p-6"&gt;
              &lt;h3 className="text-lg font-semibold text-white mb-4"&gt;Creating an Incident&lt;/h3&gt;
              &lt;ol className="space-y-2 text-gray-300"&gt;
                &lt;li&gt;1. Go to your Status Page in the dashboard&lt;/li&gt;
                &lt;li&gt;2. Click &quot;New Incident&quot;&lt;/li&gt;
                &lt;li&gt;3. Enter a title and initial message&lt;/li&gt;
                &lt;li&gt;4. Select severity and affected checks&lt;/li&gt;
                &lt;li&gt;5. The incident appears immediately on your public status page&lt;/li&gt;
              &lt;/ol&gt;
            &lt;/div&gt;

            &lt;div className="bg-gray-900 rounded-lg p-6"&gt;
              &lt;h3 className="text-lg font-semibold text-white mb-4"&gt;Incident Updates&lt;/h3&gt;
              &lt;p className="text-gray-400 mb-3"&gt;
                Add updates to keep users informed as you investigate and resolve the issue:
              &lt;/p&gt;
              &lt;ul className="space-y-2 text-gray-300 text-sm"&gt;
                &lt;li&gt;• Each update can change the incident status&lt;/li&gt;
                &lt;li&gt;• Updates are displayed in reverse chronological order&lt;/li&gt;
                &lt;li&gt;• Users see a timeline of the incident progression&lt;/li&gt;
                &lt;li&gt;• Resolved incidents are shown for 7 days, then archived&lt;/li&gt;
              &lt;/ul&gt;
            &lt;/div&gt;
          &lt;/div&gt;
        &lt;/section&gt;

        {/* Integration Examples */}
        &lt;section id="examples" className="mb-16"&gt;
          &lt;h2 className="text-2xl font-bold text-white mb-6"&gt;Integration Examples&lt;/h2&gt;

          {/* Bash */}
          &lt;div className="mb-8"&gt;
            &lt;h3 className="text-lg font-semibold text-white mb-4"&gt;Bash / Shell Script&lt;/h3&gt;
            &lt;CodeBlock title="backup.sh" language="bash"&gt;
{`#!/bin/bash
set -e

# Signal job start (optional)
curl -fsS "https://cronowl.com/api/ping/YOUR_SLUG?start=1"

START_TIME=$(date +%s%3N)

# Your backup logic here
pg_dump mydb &gt; /backups/mydb_$(date +%Y%m%d).sql
gzip /backups/mydb_$(date +%Y%m%d).sql

END_TIME=$(date +%s%3N)
DURATION=$((END_TIME - START_TIME))

# Signal completion with duration
curl -fsS "https://cronowl.com/api/ping/YOUR_SLUG?duration=$DURATION&amp;exit_code=$?"`}
            &lt;/CodeBlock&gt;
          &lt;/div&gt;

          {/* Crontab */}
          &lt;div className="mb-8"&gt;
            &lt;h3 className="text-lg font-semibold text-white mb-4"&gt;Crontab&lt;/h3&gt;
            &lt;CodeBlock title="crontab -e" language="bash"&gt;
{`# Run backup every day at 2am and ping CronOwl
0 2 * * * /path/to/backup.sh &amp;&amp; curl -fsS https://cronowl.com/api/ping/YOUR_SLUG

# Alternatively, ping even on failure to track exit code
0 2 * * * /path/to/backup.sh; curl -fsS "https://cronowl.com/api/ping/YOUR_SLUG?exit_code=$?"`}
            &lt;/CodeBlock&gt;
          &lt;/div&gt;

          {/* Python */}
          &lt;div className="mb-8"&gt;
            &lt;h3 className="text-lg font-semibold text-white mb-4"&gt;Python&lt;/h3&gt;
            &lt;CodeBlock title="job.py" language="python"&gt;
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
        requests.get(f"{CRONOWL_URL}?status=failure&amp;output={str(e)[:1000]}", timeout=10)
        raise

if __name__ == "__main__":
    main()`}
            &lt;/CodeBlock&gt;
          &lt;/div&gt;

          {/* Node.js */}
          &lt;div className="mb-8"&gt;
            &lt;h3 className="text-lg font-semibold text-white mb-4"&gt;Node.js&lt;/h3&gt;
            &lt;CodeBlock title="job.js" language="javascript"&gt;
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
    await fetch(\`\${CRONOWL_URL}?status=failure&amp;output=\${encodeURIComponent(error.message)}\`);
    throw error;
  }
}

runJob();`}
            &lt;/CodeBlock&gt;
          &lt;/div&gt;

          {/* PHP */}
          &lt;div className="mb-8"&gt;
            &lt;h3 className="text-lg font-semibold text-white mb-4"&gt;PHP&lt;/h3&gt;
            &lt;CodeBlock title="job.php" language="php"&gt;
{`&lt;?php
$cronowlUrl = "https://cronowl.com/api/ping/YOUR_SLUG";

// Signal start
file_get_contents("$cronowlUrl?start=1");

$startTime = microtime(true);

try {
    // Your job logic here
    processData();

    $duration = round((microtime(true) - $startTime) * 1000);
    file_get_contents("$cronowlUrl?duration=$duration");

} catch (Exception $e) {
    $output = urlencode(substr($e-&gt;getMessage(), 0, 1000));
    file_get_contents("$cronowlUrl?status=failure&amp;output=$output");
    throw $e;
}`}
            &lt;/CodeBlock&gt;
          &lt;/div&gt;

          {/* Ruby */}
          &lt;div className="mb-8"&gt;
            &lt;h3 className="text-lg font-semibold text-white mb-4"&gt;Ruby&lt;/h3&gt;
            &lt;CodeBlock title="job.rb" language="ruby"&gt;
{`require 'net/http'

CRONOWL_URL = "https://cronowl.com/api/ping/YOUR_SLUG"

def ping(params = {})
  uri = URI("#{CRONOWL_URL}?#{URI.encode_www_form(params)}")
  Net::HTTP.get(uri)
end

# Signal start
ping(start: 1)

start_time = Time.now

begin
  # Your job logic here
  process_data

  duration_ms = ((Time.now - start_time) * 1000).to_i
  ping(duration: duration_ms)

rescue =&gt; e
  ping(status: 'failure', output: e.message[0..1000])
  raise
end`}
            &lt;/CodeBlock&gt;
          &lt;/div&gt;

          {/* Go */}
          &lt;div className="mb-8"&gt;
            &lt;h3 className="text-lg font-semibold text-white mb-4"&gt;Go&lt;/h3&gt;
            &lt;CodeBlock title="main.go" language="go"&gt;
{`package main

import (
    "fmt"
    "net/http"
    "time"
)

const cronowlURL = "https://cronowl.com/api/ping/YOUR_SLUG"

func ping(params string) {
    http.Get(cronowlURL + params)
}

func main() {
    // Signal start
    ping("?start=1")

    startTime := time.Now()

    err := runJob()

    duration := time.Since(startTime).Milliseconds()

    if err != nil {
        ping(fmt.Sprintf("?status=failure&amp;output=%s", err.Error()))
        panic(err)
    }

    ping(fmt.Sprintf("?duration=%d", duration))
}`}
            &lt;/CodeBlock&gt;
          &lt;/div&gt;

          {/* Docker / Kubernetes */}
          &lt;div className="mb-8"&gt;
            &lt;h3 className="text-lg font-semibold text-white mb-4"&gt;Docker / Kubernetes CronJob&lt;/h3&gt;
            &lt;CodeBlock title="cronjob.yaml" language="yaml"&gt;
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
              curl -fsS "https://cronowl.com/api/ping/YOUR_SLUG?duration=$DURATION&amp;exit_code=$EXIT_CODE"
          restartPolicy: OnFailure`}
            &lt;/CodeBlock&gt;
          &lt;/div&gt;

          {/* GitHub Actions */}
          &lt;div className="mb-8"&gt;
            &lt;h3 className="text-lg font-semibold text-white mb-4"&gt;GitHub Actions&lt;/h3&gt;
            &lt;CodeBlock title=".github/workflows/scheduled.yml" language="yaml"&gt;
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
          echo "duration=$(($(date +%s%3N) - START))" &gt;&gt; $GITHUB_OUTPUT

      - name: Signal completion
        if: always()
        run: |
          curl -fsS "https://cronowl.com/api/ping/YOUR_SLUG?duration=\${{ steps.job.outputs.duration }}&amp;exit_code=\${{ job.status == 'success' &amp;&amp; '0' || '1' }}"`}
            &lt;/CodeBlock&gt;
          &lt;/div&gt;

          {/* Laravel */}
          &lt;div className="mb-8"&gt;
            &lt;h3 className="text-lg font-semibold text-white mb-4"&gt;Laravel&lt;/h3&gt;
            &lt;CodeBlock title="app/Console/Kernel.php" language="php"&gt;
{`protected function schedule(Schedule $schedule)
{
    $schedule-&gt;command('backup:run')
        -&gt;daily()
        -&gt;at('02:00')
        -&gt;before(function () {
            Http::get('https://cronowl.com/api/ping/YOUR_SLUG?start=1');
        })
        -&gt;after(function () {
            Http::get('https://cronowl.com/api/ping/YOUR_SLUG');
        })
        -&gt;onFailure(function () {
            Http::get('https://cronowl.com/api/ping/YOUR_SLUG?status=failure');
        });
}`}
            &lt;/CodeBlock&gt;
          &lt;/div&gt;

          {/* Django */}
          &lt;div className="mb-8"&gt;
            &lt;h3 className="text-lg font-semibold text-white mb-4"&gt;Django (Celery)&lt;/h3&gt;
            &lt;CodeBlock title="tasks.py" language="python"&gt;
{`import requests
import time
from celery import shared_task

CRONOWL_URL = "https://cronowl.com/api/ping/YOUR_SLUG"

@shared_task
def my_scheduled_task():
    requests.get(f"{CRONOWL_URL}?start=1", timeout=10)
    start_time = time.time()

    try:
        # Your task logic here
        do_work()

        duration_ms = int((time.time() - start_time) * 1000)
        requests.get(f"{CRONOWL_URL}?duration={duration_ms}", timeout=10)

    except Exception as e:
        requests.get(f"{CRONOWL_URL}?status=failure", timeout=10)
        raise`}
            &lt;/CodeBlock&gt;
          &lt;/div&gt;

          {/* PowerShell */}
          &lt;div className="mb-8"&gt;
            &lt;h3 className="text-lg font-semibold text-white mb-4"&gt;PowerShell (Windows)&lt;/h3&gt;
            &lt;CodeBlock title="backup.ps1" language="powershell"&gt;
{`$CronOwlUrl = "https://cronowl.com/api/ping/YOUR_SLUG"

# Signal start
Invoke-WebRequest -Uri "$CronOwlUrl`?start=1" -UseBasicParsing | Out-Null

$StartTime = Get-Date

try {
    # Your job logic here
    & "C:\Scripts\backup.bat"

    $Duration = [math]::Round(((Get-Date) - $StartTime).TotalMilliseconds)
    Invoke-WebRequest -Uri "$CronOwlUrl`?duration=$Duration" -UseBasicParsing | Out-Null
}
catch {
    $ExitCode = $LASTEXITCODE
    Invoke-WebRequest -Uri "$CronOwlUrl`?status=failure&amp;exit_code=$ExitCode" -UseBasicParsing | Out-Null
    throw
}`}
            &lt;/CodeBlock&gt;
          &lt;/div&gt;
        &lt;/section&gt;

        {/* Ping Options */}
        &lt;section id="ping-options" className="mb-16"&gt;
          &lt;h2 className="text-2xl font-bold text-white mb-6"&gt;Ping Options&lt;/h2&gt;
          &lt;p className="text-gray-400 mb-6"&gt;
            The ping endpoint accepts optional parameters to provide more context about your job.
          &lt;/p&gt;

          &lt;div className="bg-gray-900 rounded-lg overflow-hidden mb-6"&gt;
            &lt;table className="w-full text-sm"&gt;
              &lt;thead&gt;
                &lt;tr className="border-b border-gray-800"&gt;
                  &lt;th className="text-left py-3 px-4 text-gray-400"&gt;Parameter&lt;/th&gt;
                  &lt;th className="text-left py-3 px-4 text-gray-400"&gt;Description&lt;/th&gt;
                  &lt;th className="text-left py-3 px-4 text-gray-400"&gt;Example&lt;/th&gt;
                &lt;/tr&gt;
              &lt;/thead&gt;
              &lt;tbody className="text-gray-300"&gt;
                &lt;tr className="border-b border-gray-800"&gt;
                  &lt;td className="py-3 px-4"&gt;&lt;code className="text-green-400"&gt;start=1&lt;/code&gt;&lt;/td&gt;
                  &lt;td className="py-3 px-4"&gt;Signal job start (doesn&apos;t change status)&lt;/td&gt;
                  &lt;td className="py-3 px-4 text-gray-500"&gt;?start=1&lt;/td&gt;
                &lt;/tr&gt;
                &lt;tr className="border-b border-gray-800"&gt;
                  &lt;td className="py-3 px-4"&gt;&lt;code className="text-green-400"&gt;duration&lt;/code&gt;&lt;/td&gt;
                  &lt;td className="py-3 px-4"&gt;Job duration in milliseconds&lt;/td&gt;
                  &lt;td className="py-3 px-4 text-gray-500"&gt;?duration=45000&lt;/td&gt;
                &lt;/tr&gt;
                &lt;tr className="border-b border-gray-800"&gt;
                  &lt;td className="py-3 px-4"&gt;&lt;code className="text-green-400"&gt;exit_code&lt;/code&gt;&lt;/td&gt;
                  &lt;td className="py-3 px-4"&gt;Exit code (0 = success, non-zero = failure)&lt;/td&gt;
                  &lt;td className="py-3 px-4 text-gray-500"&gt;?exit_code=0&lt;/td&gt;
                &lt;/tr&gt;
                &lt;tr className="border-b border-gray-800"&gt;
                  &lt;td className="py-3 px-4"&gt;&lt;code className="text-green-400"&gt;status&lt;/code&gt;&lt;/td&gt;
                  &lt;td className="py-3 px-4"&gt;&quot;success&quot; or &quot;failure&quot;&lt;/td&gt;
                  &lt;td className="py-3 px-4 text-gray-500"&gt;?status=failure&lt;/td&gt;
                &lt;/tr&gt;
                &lt;tr className="border-b border-gray-800"&gt;
                  &lt;td className="py-3 px-4"&gt;&lt;code className="text-green-400"&gt;output&lt;/code&gt;&lt;/td&gt;
                  &lt;td className="py-3 px-4"&gt;Job output/logs (max 1-10KB based on plan)&lt;/td&gt;
                  &lt;td className="py-3 px-4 text-gray-500"&gt;?output=Done&lt;/td&gt;
                &lt;/tr&gt;
              &lt;/tbody&gt;
            &lt;/table&gt;
          &lt;/div&gt;

          &lt;div className="space-y-4"&gt;
            &lt;div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4"&gt;
              &lt;p className="text-blue-400 text-sm"&gt;
                &lt;strong&gt;Tip:&lt;/strong&gt; Use &lt;code&gt;exit_code&lt;/code&gt; to automatically mark jobs as failed when they exit with an error.
                CronOwl treats exit_code != 0 as a failure.
              &lt;/p&gt;
            &lt;/div&gt;

            &lt;div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4"&gt;
              &lt;p className="text-yellow-400 text-sm"&gt;
                &lt;strong&gt;Slow Job Detection:&lt;/strong&gt; If you set &lt;code&gt;maxDuration&lt;/code&gt; on your check and send &lt;code&gt;duration&lt;/code&gt;
                with your ping, CronOwl will alert you when jobs take longer than expected.
              &lt;/p&gt;
            &lt;/div&gt;
          &lt;/div&gt;
        &lt;/section&gt;

        {/* Plan Limits */}
        &lt;section id="plans" className="mb-16"&gt;
          &lt;h2 className="text-2xl font-bold text-white mb-6"&gt;Plans &amp; Limits&lt;/h2&gt;

          &lt;div className="bg-gray-900 rounded-lg overflow-hidden mb-6"&gt;
            &lt;table className="w-full text-sm"&gt;
              &lt;thead&gt;
                &lt;tr className="border-b border-gray-800"&gt;
                  &lt;th className="text-left py-3 px-4 text-gray-400"&gt;Feature&lt;/th&gt;
                  &lt;th className="text-center py-3 px-4 text-gray-400"&gt;Free&lt;/th&gt;
                  &lt;th className="text-center py-3 px-4 text-gray-400"&gt;Starter ($4/mo)&lt;/th&gt;
                  &lt;th className="text-center py-3 px-4 text-gray-400"&gt;Pro ($9/mo)&lt;/th&gt;
                &lt;/tr&gt;
              &lt;/thead&gt;
              &lt;tbody className="text-gray-300"&gt;
                &lt;tr className="border-b border-gray-800"&gt;
                  &lt;td className="py-3 px-4"&gt;Checks&lt;/td&gt;
                  &lt;td className="py-3 px-4 text-center"&gt;25&lt;/td&gt;
                  &lt;td className="py-3 px-4 text-center"&gt;100&lt;/td&gt;
                  &lt;td className="py-3 px-4 text-center"&gt;500&lt;/td&gt;
                &lt;/tr&gt;
                &lt;tr className="border-b border-gray-800"&gt;
                  &lt;td className="py-3 px-4"&gt;Status Pages&lt;/td&gt;
                  &lt;td className="py-3 px-4 text-center"&gt;1&lt;/td&gt;
                  &lt;td className="py-3 px-4 text-center"&gt;3&lt;/td&gt;
                  &lt;td className="py-3 px-4 text-center"&gt;10&lt;/td&gt;
                &lt;/tr&gt;
                &lt;tr className="border-b border-gray-800"&gt;
                  &lt;td className="py-3 px-4"&gt;History Days&lt;/td&gt;
                  &lt;td className="py-3 px-4 text-center"&gt;7&lt;/td&gt;
                  &lt;td className="py-3 px-4 text-center"&gt;30&lt;/td&gt;
                  &lt;td className="py-3 px-4 text-center"&gt;90&lt;/td&gt;
                &lt;/tr&gt;
                &lt;tr className="border-b border-gray-800"&gt;
                  &lt;td className="py-3 px-4"&gt;API Requests/min&lt;/td&gt;
                  &lt;td className="py-3 px-4 text-center"&gt;30&lt;/td&gt;
                  &lt;td className="py-3 px-4 text-center"&gt;120&lt;/td&gt;
                  &lt;td className="py-3 px-4 text-center"&gt;300&lt;/td&gt;
                &lt;/tr&gt;
                &lt;tr className="border-b border-gray-800"&gt;
                  &lt;td className="py-3 px-4"&gt;API Keys&lt;/td&gt;
                  &lt;td className="py-3 px-4 text-center"&gt;1&lt;/td&gt;
                  &lt;td className="py-3 px-4 text-center"&gt;3&lt;/td&gt;
                  &lt;td className="py-3 px-4 text-center"&gt;10&lt;/td&gt;
                &lt;/tr&gt;
                &lt;tr className="border-b border-gray-800"&gt;
                  &lt;td className="py-3 px-4"&gt;Webhooks per Check&lt;/td&gt;
                  &lt;td className="py-3 px-4 text-center"&gt;—&lt;/td&gt;
                  &lt;td className="py-3 px-4 text-center"&gt;3&lt;/td&gt;
                  &lt;td className="py-3 px-4 text-center"&gt;10&lt;/td&gt;
                &lt;/tr&gt;
                &lt;tr className="border-b border-gray-800"&gt;
                  &lt;td className="py-3 px-4"&gt;Log Output Size&lt;/td&gt;
                  &lt;td className="py-3 px-4 text-center"&gt;1 KB&lt;/td&gt;
                  &lt;td className="py-3 px-4 text-center"&gt;5 KB&lt;/td&gt;
                  &lt;td className="py-3 px-4 text-center"&gt;10 KB&lt;/td&gt;
                &lt;/tr&gt;
                &lt;tr className="border-b border-gray-800"&gt;
                  &lt;td className="py-3 px-4"&gt;Active Incidents&lt;/td&gt;
                  &lt;td className="py-3 px-4 text-center"&gt;1&lt;/td&gt;
                  &lt;td className="py-3 px-4 text-center"&gt;3&lt;/td&gt;
                  &lt;td className="py-3 px-4 text-center"&gt;100&lt;/td&gt;
                &lt;/tr&gt;
                &lt;tr className="border-b border-gray-800"&gt;
                  &lt;td className="py-3 px-4"&gt;Custom Branding&lt;/td&gt;
                  &lt;td className="py-3 px-4 text-center"&gt;—&lt;/td&gt;
                  &lt;td className="py-3 px-4 text-center"&gt;—&lt;/td&gt;
                  &lt;td className="py-3 px-4 text-center"&gt;✓&lt;/td&gt;
                &lt;/tr&gt;
                &lt;tr className="border-b border-gray-800"&gt;
                  &lt;td className="py-3 px-4"&gt;Team Members&lt;/td&gt;
                  &lt;td className="py-3 px-4 text-center"&gt;—&lt;/td&gt;
                  &lt;td className="py-3 px-4 text-center"&gt;—&lt;/td&gt;
                  &lt;td className="py-3 px-4 text-center"&gt;3&lt;/td&gt;
                &lt;/tr&gt;
              &lt;/tbody&gt;
            &lt;/table&gt;
          &lt;/div&gt;

          &lt;div className="flex gap-4"&gt;
            &lt;Link
              href="/pricing"
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
            &gt;
              View Pricing
            &lt;/Link&gt;
            &lt;Link
              href="/signup"
              className="px-6 py-3 bg-gray-800 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors"
            &gt;
              Get Started Free
            &lt;/Link&gt;
          &lt;/div&gt;
        &lt;/section&gt;

        {/* FAQ */}
        &lt;section id="faq" className="mb-16"&gt;
          &lt;h2 className="text-2xl font-bold text-white mb-6"&gt;Frequently Asked Questions&lt;/h2&gt;

          &lt;div className="space-y-4"&gt;
            &lt;div className="bg-gray-900 rounded-lg p-6"&gt;
              &lt;h3 className="text-white font-medium mb-2"&gt;What happens if my job runs but fails to ping CronOwl?&lt;/h3&gt;
              &lt;p className="text-gray-400"&gt;
                If CronOwl doesn&apos;t receive a ping within the expected time + grace period, it marks the check as &quot;down&quot; and sends alerts.
                This could mean your job failed, the network was unreachable, or the ping command wasn&apos;t executed.
              &lt;/p&gt;
            &lt;/div&gt;

            &lt;div className="bg-gray-900 rounded-lg p-6"&gt;
              &lt;h3 className="text-white font-medium mb-2"&gt;How often does CronOwl check for missed pings?&lt;/h3&gt;
              &lt;p className="text-gray-400"&gt;
                CronOwl runs a status check every minute. This means you&apos;ll be alerted within 1 minute of your grace period expiring.
              &lt;/p&gt;
            &lt;/div&gt;

            &lt;div className="bg-gray-900 rounded-lg p-6"&gt;
              &lt;h3 className="text-white font-medium mb-2"&gt;Can I pause monitoring temporarily?&lt;/h3&gt;
              &lt;p className="text-gray-400"&gt;
                Yes! Click the pause button on any check in your dashboard. Paused checks won&apos;t trigger alerts even if they miss pings.
                Resume monitoring anytime with a single click.
              &lt;/p&gt;
            &lt;/div&gt;

            &lt;div className="bg-gray-900 rounded-lg p-6"&gt;
              &lt;h3 className="text-white font-medium mb-2"&gt;What&apos;s the difference between exit_code and status?&lt;/h3&gt;
              &lt;p className="text-gray-400"&gt;
                &lt;code className="text-green-400"&gt;exit_code&lt;/code&gt; is the numeric exit code from your script (0 = success, non-zero = failure).
                &lt;code className="text-green-400"&gt;status&lt;/code&gt; is a string (&quot;success&quot; or &quot;failure&quot;) for explicit control.
                If both are provided, &lt;code&gt;status&lt;/code&gt; takes precedence.
              &lt;/p&gt;
            &lt;/div&gt;

            &lt;div className="bg-gray-900 rounded-lg p-6"&gt;
              &lt;h3 className="text-white font-medium mb-2"&gt;Is there a way to monitor from the command line?&lt;/h3&gt;
              &lt;p className="text-gray-400"&gt;
                Yes! CronOwl provides a full REST API. Use your API key to list checks, create new ones, view history, and more.
                See the &lt;Link href="/docs/api" className="text-blue-400 hover:underline"&gt;API documentation&lt;/Link&gt; for details.
              &lt;/p&gt;
            &lt;/div&gt;

            &lt;div className="bg-gray-900 rounded-lg p-6"&gt;
              &lt;h3 className="text-white font-medium mb-2"&gt;What if I need more than 500 checks?&lt;/h3&gt;
              &lt;p className="text-gray-400"&gt;
                Contact us at &lt;a href="mailto:support@cronowl.com" className="text-blue-400 hover:underline"&gt;support@cronowl.com&lt;/a&gt; for enterprise plans with higher limits.
              &lt;/p&gt;
            &lt;/div&gt;

            &lt;div className="bg-gray-900 rounded-lg p-6"&gt;
              &lt;h3 className="text-white font-medium mb-2"&gt;How secure is my data?&lt;/h3&gt;
              &lt;p className="text-gray-400"&gt;
                CronOwl uses industry-standard security practices: HTTPS everywhere, encrypted data at rest,
                API keys are hashed before storage, and webhook URLs are validated to prevent SSRF attacks.
              &lt;/p&gt;
            &lt;/div&gt;

            &lt;div className="bg-gray-900 rounded-lg p-6"&gt;
              &lt;h3 className="text-white font-medium mb-2"&gt;Can I use CronOwl with Docker/Kubernetes?&lt;/h3&gt;
              &lt;p className="text-gray-400"&gt;
                Absolutely! See the Kubernetes CronJob example in the &lt;a href="#examples" className="text-blue-400 hover:underline"&gt;Integration Examples&lt;/a&gt; section.
                The ping is just a simple HTTP request, so it works with any containerized environment.
              &lt;/p&gt;
            &lt;/div&gt;
          &lt;/div&gt;
        &lt;/section&gt;

        {/* Footer */}
        &lt;div className="border-t border-gray-800 pt-8 mt-12"&gt;
          &lt;div className="flex flex-col md:flex-row gap-4 justify-between items-center"&gt;
            &lt;p className="text-gray-500"&gt;
              Need help? Contact us at{" "}
              &lt;a href="mailto:support@cronowl.com" className="text-blue-400 hover:underline"&gt;
                support@cronowl.com
              &lt;/a&gt;
            &lt;/p&gt;
            &lt;div className="flex gap-4"&gt;
              &lt;Link href="/docs/api" className="text-gray-400 hover:text-white transition-colors"&gt;
                API Reference
              &lt;/Link&gt;
              &lt;Link href="/pricing" className="text-gray-400 hover:text-white transition-colors"&gt;
                Pricing
              &lt;/Link&gt;
              &lt;Link href="/dashboard" className="text-gray-400 hover:text-white transition-colors"&gt;
                Dashboard
              &lt;/Link&gt;
            &lt;/div&gt;
          &lt;/div&gt;
        &lt;/div&gt;
      &lt;/div&gt;
    &lt;/div&gt;
  );
}
