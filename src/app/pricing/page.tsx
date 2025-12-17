import Link from "next/link";
import { PLANS, PlanType } from "@/lib/plans";

function CheckIcon() {
  return (
    <svg className="w-5 h-5 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  );
}

function PricingCard({
  plan,
  planKey,
  isPopular = false
}: {
  plan: typeof PLANS[PlanType];
  planKey: PlanType;
  isPopular?: boolean;
}) {
  const isProPlan = planKey === "pro";

  return (
    <div className={`relative bg-gray-900 rounded-2xl p-8 ${isPopular ? "ring-2 ring-blue-500" : ""}`}>
      {isPopular && (
        <div className="absolute -top-4 left-1/2 -translate-x-1/2">
          <span className="bg-blue-500 text-white text-sm font-medium px-4 py-1 rounded-full">
            Most Popular
          </span>
        </div>
      )}

      <div className="text-center mb-6">
        <h3 className="text-xl font-semibold text-white mb-2">{plan.name}</h3>
        <div className="flex items-baseline justify-center gap-1">
          <span className="text-4xl font-bold text-white">
            ${plan.price}
          </span>
          {plan.price > 0 && (
            <span className="text-gray-400">/month</span>
          )}
        </div>
        {plan.price === 0 && (
          <p className="text-gray-400 text-sm mt-1">Free forever</p>
        )}
      </div>

      <ul className="space-y-3 mb-8">
        {plan.features.map((feature, index) => (
          <li key={index} className="flex items-start gap-3">
            <CheckIcon />
            <span className="text-gray-300">{feature}</span>
          </li>
        ))}
      </ul>

      <Link
        href="/signup"
        className={`block w-full text-center py-3 px-6 rounded-lg font-medium transition-colors ${
          isPopular
            ? "bg-blue-600 text-white hover:bg-blue-700"
            : isProPlan
            ? "bg-purple-600 text-white hover:bg-purple-700"
            : "bg-gray-800 text-white hover:bg-gray-700 border border-gray-700"
        }`}
      >
        {plan.price === 0 ? "Get Started" : "Start Free Trial"}
      </Link>
    </div>
  );
}

function ComparisonTable() {
  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-gray-800">
            <th className="text-left py-4 px-4 text-gray-400 font-medium">Feature</th>
            <th className="text-center py-4 px-4 text-gray-400 font-medium">Healthchecks.io</th>
            <th className="text-center py-4 px-4 text-gray-400 font-medium">Cronitor</th>
            <th className="text-center py-4 px-4 text-blue-400 font-medium">CronOwl</th>
          </tr>
        </thead>
        <tbody className="text-sm">
          <tr className="border-b border-gray-800">
            <td className="py-4 px-4 text-gray-300">Free checks</td>
            <td className="py-4 px-4 text-center text-gray-400">20</td>
            <td className="py-4 px-4 text-center text-gray-400">5</td>
            <td className="py-4 px-4 text-center text-green-400 font-medium">25</td>
          </tr>
          <tr className="border-b border-gray-800">
            <td className="py-4 px-4 text-gray-300">100 checks price</td>
            <td className="py-4 px-4 text-center text-gray-400">$20/mo</td>
            <td className="py-4 px-4 text-center text-gray-400">$200/mo</td>
            <td className="py-4 px-4 text-center text-green-400 font-medium">$4/mo</td>
          </tr>
          <tr className="border-b border-gray-800">
            <td className="py-4 px-4 text-gray-300">Unlimited checks</td>
            <td className="py-4 px-4 text-center text-gray-400">$80/mo</td>
            <td className="py-4 px-4 text-center text-gray-400">Custom</td>
            <td className="py-4 px-4 text-center text-green-400 font-medium">$9/mo</td>
          </tr>
          <tr className="border-b border-gray-800">
            <td className="py-4 px-4 text-gray-300">Telegram alerts</td>
            <td className="py-4 px-4 text-center text-gray-400">Paid</td>
            <td className="py-4 px-4 text-center text-gray-400">No</td>
            <td className="py-4 px-4 text-center text-green-400 font-medium">Free</td>
          </tr>
          <tr className="border-b border-gray-800">
            <td className="py-4 px-4 text-gray-300">Push notifications</td>
            <td className="py-4 px-4 text-center text-gray-400">No</td>
            <td className="py-4 px-4 text-center text-gray-400">No</td>
            <td className="py-4 px-4 text-center text-green-400 font-medium">Free</td>
          </tr>
          <tr>
            <td className="py-4 px-4 text-gray-300">PWA / Mobile app</td>
            <td className="py-4 px-4 text-center text-gray-400">No</td>
            <td className="py-4 px-4 text-center text-gray-400">No</td>
            <td className="py-4 px-4 text-center text-green-400 font-medium">Yes</td>
          </tr>
        </tbody>
      </table>
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
        <div key={index} className="bg-gray-900 rounded-lg p-6">
          <h4 className="text-white font-medium mb-2">{faq.q}</h4>
          <p className="text-gray-400 text-sm">{faq.a}</p>
        </div>
      ))}
    </div>
  );
}

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-gray-950">
      {/* Header */}
      <header className="border-b border-gray-800">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="text-xl font-bold text-white">
            🦉 CronOwl
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/login" className="text-gray-400 hover:text-white text-sm">
              Sign in
            </Link>
            <Link
              href="/signup"
              className="bg-blue-600 text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-blue-700 transition-colors"
            >
              Get Started
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-4 py-16 text-center">
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
          Simple, transparent pricing
        </h1>
        <p className="text-xl text-gray-400 mb-4">
          Start free, upgrade when you need more
        </p>
        <p className="text-gray-500">
          No credit card required • Cancel anytime
        </p>
      </section>

      {/* Pricing Cards */}
      <section className="max-w-5xl mx-auto px-4 pb-20">
        <div className="grid md:grid-cols-3 gap-8">
          <PricingCard plan={PLANS.free} planKey="free" />
          <PricingCard plan={PLANS.starter} planKey="starter" isPopular />
          <PricingCard plan={PLANS.pro} planKey="pro" />
        </div>
      </section>

      {/* Comparison */}
      <section className="bg-gray-900 py-20">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-white text-center mb-4">
            Why CronOwl?
          </h2>
          <p className="text-gray-400 text-center mb-12">
            See how we compare to other cron monitoring services
          </p>
          <ComparisonTable />
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20">
        <div className="max-w-3xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-white text-center mb-12">
            Frequently Asked Questions
          </h2>
          <FAQ />
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-gray-900">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to monitor your cron jobs?
          </h2>
          <p className="text-gray-400 mb-8">
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
      <footer className="border-t border-gray-800 py-8">
        <div className="max-w-6xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="text-gray-400 text-sm">
            © 2025 CronOwl. Built with ☕ by indie developers.
          </div>
          <div className="flex gap-6 text-sm">
            <Link href="/pricing" className="text-gray-400 hover:text-white">
              Pricing
            </Link>
            <a href="#" className="text-gray-400 hover:text-white">
              Terms
            </a>
            <a href="#" className="text-gray-400 hover:text-white">
              Privacy
            </a>
            <a href="mailto:support@cronowl.com" className="text-gray-400 hover:text-white">
              Contact
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
