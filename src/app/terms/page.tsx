import Link from "next/link";
import { PublicHeader } from "@/components/PublicHeader";

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gray-950">
      <PublicHeader />

      {/* Content */}
      <main className="max-w-4xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold text-white mb-2">Terms of Service</h1>
        <p className="text-gray-500 mb-8">Last updated: December 17, 2025</p>

        <div className="prose prose-invert prose-gray max-w-none space-y-8">
          <section>
            <h2 className="text-xl font-semibold text-white mb-3">The Service</h2>
            <p className="text-gray-400">
              CronOwl is a cron job monitoring service. You create checks, ping them from your scripts,
              and we alert you when pings stop arriving on schedule.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">Your Account</h2>
            <p className="text-gray-400">
              You&apos;re responsible for keeping your account credentials secure and for all activity
              under your account.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">Acceptable Use</h2>
            <p className="text-gray-400 mb-3">Don&apos;t use CronOwl to:</p>
            <ul className="list-disc list-inside text-gray-400 space-y-1">
              <li>Do anything illegal</li>
              <li>Send spam or malicious content</li>
              <li>Overload our systems with excessive requests</li>
              <li>Attempt to access other users&apos; data</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">Payments</h2>
            <p className="text-gray-400">
              Paid plans are billed monthly. Cancel anytime — your plan stays active until the end
              of the billing period. We may change prices with 30 days notice.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">Service Availability</h2>
            <p className="text-gray-400">
              We aim for high uptime but don&apos;t guarantee uninterrupted service. We&apos;re not liable
              for damages from service interruptions.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">Limitation of Liability</h2>
            <p className="text-gray-400">
              CronOwl is provided &quot;as is&quot;. We&apos;re not liable for indirect damages or lost profits.
              Our total liability is limited to what you paid us in the past 12 months.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">Termination</h2>
            <p className="text-gray-400">
              We may terminate accounts that violate these terms. You can delete your account anytime
              in settings.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">Contact</h2>
            <p className="text-gray-400">
              Questions? Email us at{" "}
              <a href="mailto:support@cronowl.com" className="text-blue-400 hover:text-blue-300">
                support@cronowl.com
              </a>
            </p>
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-800 py-8 mt-12">
        <div className="max-w-4xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="text-gray-400 text-sm">
            © 2025 CronOwl. All rights reserved.
          </div>
          <div className="flex gap-6 text-sm">
            <Link href="/pricing" className="text-gray-400 hover:text-white">
              Pricing
            </Link>
            <Link href="/terms" className="text-white">
              Terms
            </Link>
            <Link href="/privacy" className="text-gray-400 hover:text-white">
              Privacy
            </Link>
            <Link href="/refund" className="text-gray-400 hover:text-white">
              Refund
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
