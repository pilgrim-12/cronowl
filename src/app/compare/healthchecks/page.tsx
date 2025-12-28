import Link from "next/link";
import { PublicHeader } from "@/components/PublicHeader";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "CronOwl vs Healthchecks.io - Cron Job Monitoring Comparison",
  description: "Compare CronOwl and Healthchecks.io for cron job monitoring. See features, pricing, and why CronOwl is the better choice for developers.",
};

function ComparisonTable() {
  const features = [
    { name: "Free checks", cronowl: "25", competitor: "20", winner: "cronowl" },
    { name: "100 checks pricing", cronowl: "$4/mo", competitor: "$20/mo", winner: "cronowl" },
    { name: "Push Notifications", cronowl: "✅", competitor: "❌", winner: "cronowl" },
    { name: "Email Alerts", cronowl: "✅", competitor: "✅", winner: "tie" },
    { name: "Telegram", cronowl: "✅", competitor: "✅", winner: "tie" },
    { name: "Slack", cronowl: "✅", competitor: "✅", winner: "tie" },
    { name: "Webhooks", cronowl: "✅", competitor: "✅", winner: "tie" },
    { name: "Status Pages", cronowl: "✅", competitor: "❌", winner: "cronowl" },
    { name: "Cron Expressions", cronowl: "✅", competitor: "✅", winner: "tie" },
    { name: "Grace Period", cronowl: "✅", competitor: "✅", winner: "tie" },
    { name: "Job Duration Tracking", cronowl: "✅", competitor: "✅", winner: "tie" },
    { name: "Slow Job Alerts", cronowl: "✅", competitor: "✅", winner: "tie" },
    { name: "Start/Fail Signals", cronowl: "✅", competitor: "✅", winner: "tie" },
    { name: "REST API", cronowl: "✅", competitor: "✅", winner: "tie" },
    { name: "Tags/Groups", cronowl: "✅", competitor: "✅", winner: "tie" },
    { name: "PWA Mobile App", cronowl: "✅", competitor: "❌", winner: "cronowl" },
    { name: "Self-hosted Option", cronowl: "❌", competitor: "✅", winner: "competitor" },
    { name: "PagerDuty", cronowl: "❌", competitor: "✅", winner: "competitor" },
    { name: "SMS Alerts", cronowl: "❌", competitor: "✅", winner: "competitor" },
  ];

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-gray-800">
            <th className="text-left py-4 px-4 text-gray-400 font-medium">Feature</th>
            <th className="text-center py-4 px-4 text-blue-400 font-medium">CronOwl</th>
            <th className="text-center py-4 px-4 text-gray-400 font-medium">Healthchecks.io</th>
          </tr>
        </thead>
        <tbody>
          {features.map((feature, index) => (
            <tr key={index} className="border-b border-gray-800/50">
              <td className="py-3 px-4 text-gray-300">{feature.name}</td>
              <td className={`py-3 px-4 text-center ${feature.winner === "cronowl" ? "text-green-400 font-medium" : "text-gray-300"}`}>
                {feature.cronowl}
              </td>
              <td className={`py-3 px-4 text-center ${feature.winner === "competitor" ? "text-green-400 font-medium" : "text-gray-300"}`}>
                {feature.competitor}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function PricingComparison() {
  const tiers = [
    { checks: 25, cronowl: "Free", competitor: "$0 (20 checks)" },
    { checks: 100, cronowl: "$4/mo", competitor: "$20/mo" },
    { checks: 1000, cronowl: "$9/mo", competitor: "$80/mo" },
  ];

  return (
    <div className="grid md:grid-cols-3 gap-6">
      {tiers.map((tier, index) => (
        <div key={index} className="bg-gray-800 rounded-lg p-6 text-center">
          <div className="text-gray-400 text-sm mb-2">{tier.checks} checks</div>
          <div className="flex items-center justify-center gap-4">
            <div>
              <div className="text-2xl font-bold text-blue-400">{tier.cronowl}</div>
              <div className="text-xs text-gray-500">CronOwl</div>
            </div>
            <div className="text-gray-600">vs</div>
            <div>
              <div className="text-2xl font-bold text-gray-400">{tier.competitor}</div>
              <div className="text-xs text-gray-500">Healthchecks.io</div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function HealthchecksComparisonPage() {
  return (
    <div className="min-h-screen bg-gray-950">
      <PublicHeader />

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-4 py-16 text-center">
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
          CronOwl vs Healthchecks.io
        </h1>
        <p className="text-xl text-gray-400 mb-6">
          Looking for a Healthchecks.io alternative? See how CronOwl compares.
        </p>
        <div className="inline-flex items-center gap-2 bg-green-500/10 text-green-400 px-4 py-2 rounded-full text-sm">
          <span>💰</span>
          <span>Save up to 80% compared to Healthchecks.io</span>
        </div>
      </section>

      {/* Quick Summary */}
      <section className="max-w-4xl mx-auto px-4 pb-16">
        <div className="grid md:grid-cols-3 gap-6">
          <div className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-500/20 rounded-lg p-6 text-center">
            <div className="text-3xl font-bold text-blue-400 mb-2">5x</div>
            <div className="text-gray-300">Cheaper pricing</div>
          </div>
          <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/20 rounded-lg p-6 text-center">
            <div className="text-3xl font-bold text-purple-400 mb-2">+25%</div>
            <div className="text-gray-300">More free checks</div>
          </div>
          <div className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/20 rounded-lg p-6 text-center">
            <div className="text-3xl font-bold text-green-400 mb-2">Push</div>
            <div className="text-gray-300">Notifications included</div>
          </div>
        </div>
      </section>

      {/* Pricing Comparison */}
      <section className="bg-gray-900 py-16">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-white text-center mb-4">
            Pricing Comparison
          </h2>
          <p className="text-gray-400 text-center mb-10">
            CronOwl offers the same features at a fraction of the cost
          </p>
          <PricingComparison />
        </div>
      </section>

      {/* Feature Comparison */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-white text-center mb-4">
            Feature Comparison
          </h2>
          <p className="text-gray-400 text-center mb-10">
            Side-by-side comparison of all features
          </p>
          <div className="bg-gray-900 rounded-lg overflow-hidden">
            <ComparisonTable />
          </div>
        </div>
      </section>

      {/* Why Choose CronOwl */}
      <section className="bg-gray-900 py-16">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-white text-center mb-10">
            Why Choose CronOwl over Healthchecks.io?
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-gray-800 rounded-lg p-6">
              <div className="text-2xl mb-3">🔔</div>
              <h3 className="text-white font-medium mb-2">Push Notifications</h3>
              <p className="text-gray-400 text-sm">
                Get instant push notifications on your phone without installing any app.
                Healthchecks.io doesn&apos;t offer this — you&apos;ll need to rely on email or third-party integrations.
              </p>
            </div>
            <div className="bg-gray-800 rounded-lg p-6">
              <div className="text-2xl mb-3">💰</div>
              <h3 className="text-white font-medium mb-2">80% Lower Cost</h3>
              <p className="text-gray-400 text-sm">
                Monitor 100 cron jobs for just $4/month instead of $20.
                That&apos;s $192 saved per year without sacrificing features.
              </p>
            </div>
            <div className="bg-gray-800 rounded-lg p-6">
              <div className="text-2xl mb-3">📊</div>
              <h3 className="text-white font-medium mb-2">Status Pages Included</h3>
              <p className="text-gray-400 text-sm">
                Share public status pages with your users or team.
                Healthchecks.io doesn&apos;t offer built-in status pages.
              </p>
            </div>
            <div className="bg-gray-800 rounded-lg p-6">
              <div className="text-2xl mb-3">📱</div>
              <h3 className="text-white font-medium mb-2">Mobile PWA</h3>
              <p className="text-gray-400 text-sm">
                Install CronOwl on your phone as a PWA. Check your monitors and
                receive push alerts — no app store download needed.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* When to Choose Healthchecks.io */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-white text-center mb-6">
            When Healthchecks.io Might Be Better
          </h2>
          <p className="text-gray-400 text-center mb-8">
            We believe in honest comparisons. Here&apos;s when Healthchecks.io might be a better fit:
          </p>
          <div className="bg-gray-900 rounded-lg p-6">
            <ul className="space-y-3 text-gray-300">
              <li className="flex items-start gap-3">
                <span className="text-gray-500">•</span>
                <span>You need <strong>self-hosted deployment</strong> — Healthchecks.io is open source</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-gray-500">•</span>
                <span>You require <strong>PagerDuty or Opsgenie</strong> integration for enterprise on-call</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-gray-500">•</span>
                <span>You need <strong>SMS alerts</strong> as a notification channel</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* Migration */}
      <section className="bg-gray-900 py-16">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Easy Migration from Healthchecks.io
          </h2>
          <p className="text-gray-400 mb-8">
            Switching is simple — just update your ping URLs
          </p>
          <div className="bg-gray-800 rounded-lg p-6 text-left max-w-2xl mx-auto">
            <div className="text-gray-400 text-sm mb-2"># Before (Healthchecks.io)</div>
            <code className="text-red-400 text-sm">curl https://hc-ping.com/your-uuid</code>
            <div className="text-gray-400 text-sm mb-2 mt-4"># After (CronOwl)</div>
            <code className="text-green-400 text-sm">curl https://cronowl.com/api/ping/your-slug</code>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to switch?
          </h2>
          <p className="text-gray-400 mb-8">
            Start with 25 free checks — no credit card required
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/signup"
              className="inline-block bg-blue-600 text-white rounded-lg px-8 py-3 text-lg font-medium hover:bg-blue-700 transition-colors"
            >
              Start Free Trial
            </Link>
            <Link
              href="/pricing"
              className="inline-block bg-gray-800 text-white rounded-lg px-8 py-3 text-lg font-medium hover:bg-gray-700 transition-colors"
            >
              View Pricing
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-800 py-8">
        <div className="max-w-6xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="text-gray-400 text-sm">
            © 2025 CronOwl. Built with ☕ by indie developers.
          </div>
          <div className="flex gap-6 text-sm">
            <Link href="/compare/cronitor" className="text-gray-400 hover:text-white">
              vs Cronitor
            </Link>
            <Link href="/pricing" className="text-gray-400 hover:text-white">
              Pricing
            </Link>
            <Link href="/docs/api" className="text-gray-400 hover:text-white">
              API Docs
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
