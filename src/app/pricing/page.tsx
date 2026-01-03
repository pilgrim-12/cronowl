import Link from "next/link";
import { PLANS } from "@/lib/plans";
import { PricingCard } from "@/components/PricingCard";
import { PublicHeader } from "@/components/PublicHeader";

function WhyCronOwl() {
  const benefits = [
    {
      icon: "🚀",
      title: "Setup in 30 seconds",
      description: "Create a check, add one curl to your script, done. No complex configuration needed.",
    },
    {
      icon: "📱",
      title: "Alerts everywhere",
      description: "Email, push notifications, Telegram, webhooks — get notified however you prefer.",
    },
    {
      icon: "💰",
      title: "Affordable pricing",
      description: "Generous free tier and paid plans that won't break the bank. Built for indie developers.",
    },
    {
      icon: "📲",
      title: "Mobile-ready PWA",
      description: "Install on your phone and get instant push notifications when jobs fail.",
    },
    {
      icon: "⚡",
      title: "Real-time monitoring",
      description: "Know immediately when your cron jobs stop running. Don't wait for users to report issues.",
    },
    {
      icon: "🔒",
      title: "Simple & secure",
      description: "No agents to install. Just a simple HTTP ping from your existing scripts.",
    },
  ];

  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
      {benefits.map((benefit, index) => (
        <div key={index} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-6">
          <div className="text-3xl mb-3">{benefit.icon}</div>
          <h4 className="text-gray-900 dark:text-white font-medium mb-2">{benefit.title}</h4>
          <p className="text-gray-500 dark:text-gray-400 text-sm">{benefit.description}</p>
        </div>
      ))}
    </div>
  );
}

function FAQ() {
  const faqs = [
    {
      q: "Can I upgrade or downgrade anytime?",
      a: "Yes! You can change your plan at any time. When upgrading, you'll be charged the prorated amount. When downgrading, the new rate applies at the next billing cycle.",
    },
    {
      q: "What happens if I exceed my check limit?",
      a: "You won't be able to create new checks until you upgrade or delete existing ones. Your existing checks will continue to work normally.",
    },
    {
      q: "Is there a free trial for paid plans?",
      a: "Yes, all paid plans come with a 14-day free trial. No credit card required to start.",
    },
    {
      q: "What payment methods do you accept?",
      a: "We accept all major credit cards (Visa, Mastercard, American Express) and PayPal through our secure payment processor.",
    },
  ];

  return (
    <div className="space-y-6">
      {faqs.map((faq, index) => (
        <div key={index} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-6">
          <h4 className="text-gray-900 dark:text-white font-medium mb-2">{faq.q}</h4>
          <p className="text-gray-500 dark:text-gray-400 text-sm">{faq.a}</p>
        </div>
      ))}
    </div>
  );
}

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <PublicHeader />

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-4 py-16 text-center">
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
          Simple, transparent pricing
        </h1>
        <p className="text-xl text-gray-500 dark:text-gray-400 mb-4">
          Start free, upgrade when you need more
        </p>
        <p className="text-gray-500 dark:text-gray-500">
          No credit card required • Cancel anytime
        </p>
      </section>

      {/* Pricing Cards */}
      <section className="max-w-5xl mx-auto px-4 pb-12">
        <div className="grid md:grid-cols-3 gap-8">
          <PricingCard plan={PLANS.free} planKey="free" />
          <PricingCard plan={PLANS.starter} planKey="starter" isPopular />
          <PricingCard plan={PLANS.pro} planKey="pro" />
        </div>
      </section>

      {/* Detailed Limits Comparison */}
      <section className="max-w-4xl mx-auto px-4 pb-20">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white text-center mb-8">
          Plan Limits & Quotas
        </h2>
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-800">
                <th className="text-left py-4 px-6 text-gray-500 dark:text-gray-400 font-medium">Feature</th>
                <th className="text-center py-4 px-4 text-gray-500 dark:text-gray-400 font-medium">Free</th>
                <th className="text-center py-4 px-4 text-blue-500 dark:text-blue-400 font-medium">Starter</th>
                <th className="text-center py-4 px-4 text-purple-500 dark:text-purple-400 font-medium">Pro</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              <tr className="border-b border-gray-200/50 dark:border-gray-800/50">
                <td className="py-3 px-6 text-gray-700 dark:text-gray-300">Checks</td>
                <td className="py-3 px-4 text-center text-gray-700 dark:text-gray-300">{PLANS.free.checksLimit}</td>
                <td className="py-3 px-4 text-center text-gray-700 dark:text-gray-300">{PLANS.starter.checksLimit}</td>
                <td className="py-3 px-4 text-center text-gray-700 dark:text-gray-300">{PLANS.pro.checksLimit}</td>
              </tr>
              <tr className="border-b border-gray-200/50 dark:border-gray-800/50">
                <td className="py-3 px-6 text-gray-700 dark:text-gray-300">History retention</td>
                <td className="py-3 px-4 text-center text-gray-700 dark:text-gray-300">{PLANS.free.historyDays} days</td>
                <td className="py-3 px-4 text-center text-gray-700 dark:text-gray-300">{PLANS.starter.historyDays} days</td>
                <td className="py-3 px-4 text-center text-gray-700 dark:text-gray-300">{PLANS.pro.historyDays} days</td>
              </tr>
              <tr className="border-b border-gray-200/50 dark:border-gray-800/50">
                <td className="py-3 px-6 text-gray-700 dark:text-gray-300">API keys</td>
                <td className="py-3 px-4 text-center text-gray-700 dark:text-gray-300">{PLANS.free.apiKeysLimit}</td>
                <td className="py-3 px-4 text-center text-gray-700 dark:text-gray-300">{PLANS.starter.apiKeysLimit}</td>
                <td className="py-3 px-4 text-center text-gray-700 dark:text-gray-300">{PLANS.pro.apiKeysLimit}</td>
              </tr>
              <tr className="border-b border-gray-200/50 dark:border-gray-800/50">
                <td className="py-3 px-6 text-gray-700 dark:text-gray-300">Status pages</td>
                <td className="py-3 px-4 text-center text-gray-700 dark:text-gray-300">{PLANS.free.statusPagesLimit}</td>
                <td className="py-3 px-4 text-center text-gray-700 dark:text-gray-300">{PLANS.starter.statusPagesLimit}</td>
                <td className="py-3 px-4 text-center text-gray-700 dark:text-gray-300">{PLANS.pro.statusPagesLimit}</td>
              </tr>
              <tr className="border-b border-gray-200/50 dark:border-gray-800/50">
                <td className="py-3 px-6 text-gray-700 dark:text-gray-300">Webhooks per check</td>
                <td className="py-3 px-4 text-center text-gray-700 dark:text-gray-300">{PLANS.free.webhooksPerCheck}</td>
                <td className="py-3 px-4 text-center text-gray-700 dark:text-gray-300">{PLANS.starter.webhooksPerCheck}</td>
                <td className="py-3 px-4 text-center text-gray-700 dark:text-gray-300">{PLANS.pro.webhooksPerCheck}</td>
              </tr>
              <tr className="border-b border-gray-200/50 dark:border-gray-800/50">
                <td className="py-3 px-6 text-gray-700 dark:text-gray-300">Log output size</td>
                <td className="py-3 px-4 text-center text-gray-700 dark:text-gray-300">{PLANS.free.logOutputSize / 1024}KB</td>
                <td className="py-3 px-4 text-center text-gray-700 dark:text-gray-300">{PLANS.starter.logOutputSize / 1024}KB</td>
                <td className="py-3 px-4 text-center text-gray-700 dark:text-gray-300">{PLANS.pro.logOutputSize / 1024}KB</td>
              </tr>
              <tr>
                <td className="py-3 px-6 text-gray-700 dark:text-gray-300">Team members</td>
                <td className="py-3 px-4 text-center text-gray-500 dark:text-gray-500">—</td>
                <td className="py-3 px-4 text-center text-gray-500 dark:text-gray-500">—</td>
                <td className="py-3 px-4 text-center text-gray-700 dark:text-gray-300">{PLANS.pro.teamMembers}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* Why CronOwl */}
      <section className="bg-gray-100 dark:bg-gray-900 py-20">
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white text-center mb-4">
            Why CronOwl?
          </h2>
          <p className="text-gray-500 dark:text-gray-400 text-center mb-12">
            Everything you need to monitor your scheduled tasks
          </p>
          <WhyCronOwl />
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20">
        <div className="max-w-3xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white text-center mb-12">
            Frequently Asked Questions
          </h2>
          <FAQ />
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-gray-100 dark:bg-gray-900">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            Ready to monitor your cron jobs?
          </h2>
          <p className="text-gray-500 dark:text-gray-400 mb-8">
            Join developers who trust CronOwl to watch their scheduled tasks
          </p>
          <Link
            href="/signup"
            className="inline-block bg-blue-600 text-white rounded-lg px-8 py-3 text-lg font-medium hover:bg-blue-700 transition-colors"
          >
            Start Monitoring — It&apos;s Free
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 dark:border-gray-800 py-8">
        <div className="max-w-6xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="text-gray-500 dark:text-gray-400 text-sm">
            © 2025 CronOwl. Built with ☕ by indie developers.
          </div>
          <div className="flex gap-6 text-sm">
            <Link href="/pricing" className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
              Pricing
            </Link>
            <Link href="/terms" className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
              Terms
            </Link>
            <Link href="/privacy" className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
              Privacy
            </Link>
            <Link href="/refund" className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
              Refund
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
