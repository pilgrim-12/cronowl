import Link from "next/link";

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gray-950">
      {/* Header */}
      <header className="border-b border-gray-800">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="text-xl font-bold text-white">
            CronOwl
          </Link>
          <Link
            href="/signup"
            className="bg-blue-600 text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            Get Started
          </Link>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold text-white mb-2">Terms of Service</h1>
        <p className="text-gray-500 mb-8">Last updated: December 17, 2025</p>

        <div className="prose prose-invert prose-gray max-w-none space-y-8">
          <section>
            <h2 className="text-xl font-semibold text-white mb-3">1. Acceptance of Terms</h2>
            <p className="text-gray-400">
              By accessing or using CronOwl (&quot;Service&quot;), you agree to be bound by these Terms of Service.
              If you do not agree to these terms, please do not use the Service.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">2. Description of Service</h2>
            <p className="text-gray-400">
              CronOwl is a cron job monitoring service that allows you to monitor scheduled tasks by receiving
              HTTP pings and alerting you when jobs fail to run on schedule. The Service includes web-based
              dashboard, email notifications, push notifications, Telegram alerts, and webhook integrations.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">3. Account Registration</h2>
            <p className="text-gray-400">
              To use the Service, you must create an account. You agree to provide accurate information
              and keep your account credentials secure. You are responsible for all activities that occur
              under your account.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">4. Acceptable Use</h2>
            <p className="text-gray-400 mb-3">You agree not to:</p>
            <ul className="list-disc list-inside text-gray-400 space-y-1">
              <li>Use the Service for any illegal purpose</li>
              <li>Attempt to gain unauthorized access to the Service</li>
              <li>Interfere with or disrupt the Service</li>
              <li>Send excessive requests that could overload our systems</li>
              <li>Use the Service to send spam or malicious content</li>
              <li>Resell or redistribute the Service without permission</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">5. Service Availability</h2>
            <p className="text-gray-400">
              We strive to maintain high availability but do not guarantee uninterrupted service.
              The Service may be temporarily unavailable due to maintenance, updates, or circumstances
              beyond our control. We are not liable for any damages resulting from service interruptions.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">6. Pricing and Payment</h2>
            <p className="text-gray-400">
              CronOwl offers free and paid plans. Paid subscriptions are billed monthly. You may cancel
              at any time, and your subscription will remain active until the end of the billing period.
              Refunds are provided at our discretion. We reserve the right to change pricing with 30 days notice.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">7. Intellectual Property</h2>
            <p className="text-gray-400">
              The Service and its original content, features, and functionality are owned by CronOwl
              and are protected by international copyright, trademark, and other intellectual property laws.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">8. Limitation of Liability</h2>
            <p className="text-gray-400">
              CronOwl is provided &quot;as is&quot; without warranties of any kind. We are not liable for any
              indirect, incidental, special, or consequential damages, including lost profits, data loss,
              or business interruption, even if we have been advised of the possibility of such damages.
              Our total liability shall not exceed the amount paid by you in the past 12 months.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">9. Termination</h2>
            <p className="text-gray-400">
              We may terminate or suspend your account at any time for violations of these terms.
              You may delete your account at any time through the settings page. Upon termination,
              your data will be deleted in accordance with our Privacy Policy.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">10. Changes to Terms</h2>
            <p className="text-gray-400">
              We reserve the right to modify these terms at any time. We will notify users of significant
              changes via email or through the Service. Continued use of the Service after changes
              constitutes acceptance of the new terms.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">11. Contact</h2>
            <p className="text-gray-400">
              If you have questions about these Terms of Service, please contact us at{" "}
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
          </div>
        </div>
      </footer>
    </div>
  );
}
