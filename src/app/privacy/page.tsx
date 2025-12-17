import Link from "next/link";

export default function PrivacyPage() {
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
        <h1 className="text-3xl font-bold text-white mb-2">Privacy Policy</h1>
        <p className="text-gray-500 mb-8">Last updated: December 17, 2025</p>

        <div className="prose prose-invert prose-gray max-w-none space-y-8">
          <section>
            <h2 className="text-xl font-semibold text-white mb-3">1. Introduction</h2>
            <p className="text-gray-400">
              CronOwl (&quot;we&quot;, &quot;our&quot;, &quot;us&quot;) respects your privacy and is committed to protecting
              your personal data. This Privacy Policy explains how we collect, use, and safeguard your
              information when you use our cron job monitoring service.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">2. Information We Collect</h2>

            <h3 className="text-lg font-medium text-white mt-4 mb-2">Account Information</h3>
            <ul className="list-disc list-inside text-gray-400 space-y-1">
              <li>Email address (for account creation and notifications)</li>
              <li>Password (securely hashed, never stored in plain text)</li>
              <li>Authentication provider data (if using Google or GitHub sign-in)</li>
            </ul>

            <h3 className="text-lg font-medium text-white mt-4 mb-2">Service Data</h3>
            <ul className="list-disc list-inside text-gray-400 space-y-1">
              <li>Check configurations (names, schedules, grace periods)</li>
              <li>Ping history (timestamps, IP addresses, user agents)</li>
              <li>Status history and alert logs</li>
              <li>Webhook URLs and notification preferences</li>
            </ul>

            <h3 className="text-lg font-medium text-white mt-4 mb-2">Technical Data</h3>
            <ul className="list-disc list-inside text-gray-400 space-y-1">
              <li>IP address and approximate location</li>
              <li>Browser type and version</li>
              <li>Device information</li>
              <li>Usage patterns and feature interactions</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">3. How We Use Your Information</h2>
            <p className="text-gray-400 mb-3">We use collected information to:</p>
            <ul className="list-disc list-inside text-gray-400 space-y-1">
              <li>Provide and maintain the Service</li>
              <li>Send alerts and notifications about your monitored jobs</li>
              <li>Process payments and manage subscriptions</li>
              <li>Improve and optimize the Service</li>
              <li>Communicate important updates and changes</li>
              <li>Prevent fraud and ensure security</li>
              <li>Comply with legal obligations</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">4. Data Storage and Security</h2>
            <p className="text-gray-400">
              Your data is stored securely with encryption at rest and in transit.
              We implement industry-standard security measures including:
            </p>
            <ul className="list-disc list-inside text-gray-400 space-y-1 mt-3">
              <li>TLS/SSL encryption for all data transmission</li>
              <li>Secure password hashing</li>
              <li>Regular security audits</li>
              <li>Access controls and authentication</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">5. Data Sharing</h2>
            <p className="text-gray-400 mb-3">
              We do not sell your personal data. We may share data with:
            </p>
            <ul className="list-disc list-inside text-gray-400 space-y-1">
              <li><strong className="text-gray-300">Service Providers:</strong> Third-party services that help us
                operate the Service (hosting, email delivery, payment processing)</li>
              <li><strong className="text-gray-300">Legal Requirements:</strong> When required by law or to protect our rights</li>
              <li><strong className="text-gray-300">Business Transfers:</strong> In case of merger, acquisition, or asset sale</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">6. Data Retention</h2>
            <p className="text-gray-400">
              We retain your data for as long as your account is active. Ping history is retained
              according to your plan (7-90 days). Upon account deletion, we remove your personal
              data within 30 days, except where retention is required by law.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">7. Your Rights</h2>
            <p className="text-gray-400 mb-3">You have the right to:</p>
            <ul className="list-disc list-inside text-gray-400 space-y-1">
              <li><strong className="text-gray-300">Access:</strong> Request a copy of your personal data</li>
              <li><strong className="text-gray-300">Correction:</strong> Update inaccurate information</li>
              <li><strong className="text-gray-300">Deletion:</strong> Delete your account and associated data</li>
              <li><strong className="text-gray-300">Export:</strong> Download your data in a portable format</li>
              <li><strong className="text-gray-300">Opt-out:</strong> Unsubscribe from marketing communications</li>
            </ul>
            <p className="text-gray-400 mt-3">
              To exercise these rights, contact us at{" "}
              <a href="mailto:support@cronowl.com" className="text-blue-400 hover:text-blue-300">
                support@cronowl.com
              </a>
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">8. Cookies and Tracking</h2>
            <p className="text-gray-400">
              We use essential cookies for authentication and session management. We do not use
              third-party tracking or advertising cookies. You can control cookies through your
              browser settings.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">9. Third-Party Services</h2>
            <p className="text-gray-400">
              Our Service integrates with third-party services (Telegram, webhooks) at your request.
              These services have their own privacy policies, and we encourage you to review them.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">10. Children&apos;s Privacy</h2>
            <p className="text-gray-400">
              The Service is not intended for users under 16 years of age. We do not knowingly
              collect personal information from children.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">11. International Transfers</h2>
            <p className="text-gray-400">
              Your data may be transferred to and processed in countries other than your own.
              We ensure appropriate safeguards are in place for such transfers in compliance
              with applicable data protection laws.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">12. Changes to This Policy</h2>
            <p className="text-gray-400">
              We may update this Privacy Policy from time to time. We will notify you of significant
              changes via email or through the Service. The &quot;Last updated&quot; date at the top indicates
              when the policy was last revised.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">13. Contact Us</h2>
            <p className="text-gray-400">
              If you have questions about this Privacy Policy or our data practices, please contact us at{" "}
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
          </div>
        </div>
      </footer>
    </div>
  );
}
