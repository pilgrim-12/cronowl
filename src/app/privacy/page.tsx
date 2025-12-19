import Link from "next/link";
import { PublicHeader } from "@/components/PublicHeader";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gray-950">
      <PublicHeader />

      {/* Content */}
      <main className="max-w-4xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold text-white mb-2">Privacy Policy</h1>
        <p className="text-gray-500 mb-8">Last updated: December 17, 2025</p>

        <div className="prose prose-invert prose-gray max-w-none space-y-8">
          <section>
            <h2 className="text-xl font-semibold text-white mb-3">What We Collect</h2>
            <ul className="list-disc list-inside text-gray-400 space-y-1">
              <li>Email address (for account and notifications)</li>
              <li>Check configurations and ping history</li>
              <li>Basic usage data to improve the service</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">How We Use It</h2>
            <ul className="list-disc list-inside text-gray-400 space-y-1">
              <li>To provide the monitoring service</li>
              <li>To send alerts when your jobs fail</li>
              <li>To process payments</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">Data Security</h2>
            <p className="text-gray-400">
              Your data is encrypted in transit and at rest. We use secure password hashing
              and follow industry security practices.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">Data Sharing</h2>
            <p className="text-gray-400">
              We don&apos;t sell your data. We only share data with service providers necessary
              to operate CronOwl, or when required by law.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">Your Rights</h2>
            <p className="text-gray-400">
              You can access, update, or delete your data at any time through your account settings,
              or by contacting us at{" "}
              <a href="mailto:support@cronowl.com" className="text-blue-400 hover:text-blue-300">
                support@cronowl.com
              </a>
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">Cookies</h2>
            <p className="text-gray-400">
              We use essential cookies only for authentication. No tracking or advertising cookies.
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
            <Link href="/terms" className="text-gray-400 hover:text-white">
              Terms
            </Link>
            <Link href="/privacy" className="text-white">
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
