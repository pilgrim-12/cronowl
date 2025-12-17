import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-950">
      {/* Header */}
      <header className="border-b border-gray-800">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold text-white">🦉 CronOwl</h1>
          <div className="flex items-center gap-4">
            <Link
              href="/login"
              className="text-gray-400 hover:text-white text-sm"
            >
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
      <section className="max-w-6xl mx-auto px-4 py-24 text-center">
        <div className="text-6xl mb-6">🦉</div>
        <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
          Know when your cron jobs
          <br />
          <span className="text-blue-500">stop working</span>
        </h2>
        <p className="text-xl text-gray-400 mb-8 max-w-2xl mx-auto">
          Simple monitoring for your scheduled tasks. Get alerted before your
          users notice something is broken.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/signup"
            className="bg-blue-600 text-white rounded-lg px-8 py-3 text-lg font-medium hover:bg-blue-700 transition-colors"
          >
            Start Monitoring — Free
          </Link>
          <a
            href="#how-it-works"
            className="border border-gray-700 text-white rounded-lg px-8 py-3 text-lg font-medium hover:bg-gray-800 transition-colors"
          >
            How it works
          </a>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="bg-gray-900 py-20">
        <div className="max-w-6xl mx-auto px-4">
          <h3 className="text-3xl font-bold text-white text-center mb-12">
            Dead simple setup
          </h3>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="text-4xl mb-4">1️⃣</div>
              <h4 className="text-xl font-semibold text-white mb-2">
                Create a check
              </h4>
              <p className="text-gray-400">
                Set up a check with your expected schedule (every hour, daily,
                etc.)
              </p>
            </div>
            <div className="text-center">
              <div className="text-4xl mb-4">2️⃣</div>
              <h4 className="text-xl font-semibold text-white mb-2">
                Add one line
              </h4>
              <p className="text-gray-400">
                Add a curl request to the end of your cron script
              </p>
              <code className="text-green-400 text-sm mt-2 block">
                curl https://cronowl.vercel.app/api/ping/abc123
              </code>
            </div>
            <div className="text-center">
              <div className="text-4xl mb-4">3️⃣</div>
              <h4 className="text-xl font-semibold text-white mb-2">
                Get alerted
              </h4>
              <p className="text-gray-400">
                If your job stops pinging, we&apos;ll email you immediately
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Use cases */}
      <section className="py-20">
        <div className="max-w-6xl mx-auto px-4">
          <h3 className="text-3xl font-bold text-white text-center mb-12">
            Monitor what matters
          </h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-gray-900 rounded-lg p-6">
              <div className="text-3xl mb-3">💾</div>
              <h4 className="text-lg font-semibold text-white mb-1">
                Database backups
              </h4>
              <p className="text-gray-400 text-sm">
                Know if your backup script fails
              </p>
            </div>
            <div className="bg-gray-900 rounded-lg p-6">
              <div className="text-3xl mb-3">📧</div>
              <h4 className="text-lg font-semibold text-white mb-1">
                Email digests
              </h4>
              <p className="text-gray-400 text-sm">
                Ensure newsletters go out on time
              </p>
            </div>
            <div className="bg-gray-900 rounded-lg p-6">
              <div className="text-3xl mb-3">🔄</div>
              <h4 className="text-lg font-semibold text-white mb-1">
                Data sync
              </h4>
              <p className="text-gray-400 text-sm">Monitor API integrations</p>
            </div>
            <div className="bg-gray-900 rounded-lg p-6">
              <div className="text-3xl mb-3">🧹</div>
              <h4 className="text-lg font-semibold text-white mb-1">
                Cleanup jobs
              </h4>
              <p className="text-gray-400 text-sm">
                Verify temp files get deleted
              </p>
            </div>
            <div className="bg-gray-900 rounded-lg p-6">
              <div className="text-3xl mb-3">📊</div>
              <h4 className="text-lg font-semibold text-white mb-1">
                Report generation
              </h4>
              <p className="text-gray-400 text-sm">Track scheduled reports</p>
            </div>
            <div className="bg-gray-900 rounded-lg p-6">
              <div className="text-3xl mb-3">🔔</div>
              <h4 className="text-lg font-semibold text-white mb-1">
                Any scheduled task
              </h4>
              <p className="text-gray-400 text-sm">
                If it runs on a schedule, we can monitor it
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="bg-gray-900 py-20">
        <div className="max-w-6xl mx-auto px-4">
          <h3 className="text-3xl font-bold text-white text-center mb-4">
            Simple pricing
          </h3>
          <p className="text-gray-400 text-center mb-12">
            Start free, upgrade when you need more
          </p>
          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {/* Free */}
            <div className="bg-gray-800 rounded-lg p-6">
              <h4 className="text-xl font-semibold text-white mb-2">Free</h4>
              <div className="text-3xl font-bold text-white mb-4">$0</div>
              <ul className="space-y-2 mb-6 text-sm">
                <li className="text-gray-300 flex items-center gap-2">
                  <span className="text-green-500">✓</span> 25 checks
                </li>
                <li className="text-gray-300 flex items-center gap-2">
                  <span className="text-green-500">✓</span> Email alerts
                </li>
                <li className="text-gray-300 flex items-center gap-2">
                  <span className="text-green-500">✓</span> Push notifications
                </li>
                <li className="text-gray-300 flex items-center gap-2">
                  <span className="text-green-500">✓</span> Telegram alerts
                </li>
              </ul>
              <Link
                href="/signup"
                className="block text-center border border-gray-600 text-white rounded-lg px-4 py-2.5 font-medium hover:bg-gray-700 transition-colors"
              >
                Get Started
              </Link>
            </div>
            {/* Starter */}
            <div className="bg-blue-600 rounded-lg p-6 relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <span className="bg-yellow-500 text-black text-xs font-bold px-3 py-1 rounded-full">
                  POPULAR
                </span>
              </div>
              <h4 className="text-xl font-semibold text-white mb-2">Starter</h4>
              <div className="text-3xl font-bold text-white mb-4">
                $4<span className="text-lg font-normal">/mo</span>
              </div>
              <ul className="space-y-2 mb-6 text-sm">
                <li className="text-white flex items-center gap-2">
                  <span>✓</span> 100 checks
                </li>
                <li className="text-white flex items-center gap-2">
                  <span>✓</span> Everything in Free
                </li>
                <li className="text-white flex items-center gap-2">
                  <span>✓</span> Webhooks
                </li>
                <li className="text-white flex items-center gap-2">
                  <span>✓</span> 30 days history
                </li>
              </ul>
              <Link
                href="/signup"
                className="block text-center bg-white text-blue-600 rounded-lg px-4 py-2.5 font-medium hover:bg-gray-100 transition-colors"
              >
                Start Free Trial
              </Link>
            </div>
            {/* Pro */}
            <div className="bg-gray-800 rounded-lg p-6">
              <h4 className="text-xl font-semibold text-white mb-2">Pro</h4>
              <div className="text-3xl font-bold text-white mb-4">
                $9<span className="text-lg font-normal">/mo</span>
              </div>
              <ul className="space-y-2 mb-6 text-sm">
                <li className="text-gray-300 flex items-center gap-2">
                  <span className="text-green-500">✓</span> Unlimited checks
                </li>
                <li className="text-gray-300 flex items-center gap-2">
                  <span className="text-green-500">✓</span> Everything in Starter
                </li>
                <li className="text-gray-300 flex items-center gap-2">
                  <span className="text-green-500">✓</span> 90 days history
                </li>
                <li className="text-gray-300 flex items-center gap-2">
                  <span className="text-green-500">✓</span> Team (3 users)
                </li>
              </ul>
              <Link
                href="/signup"
                className="block text-center border border-gray-600 text-white rounded-lg px-4 py-2.5 font-medium hover:bg-gray-700 transition-colors"
              >
                Start Free Trial
              </Link>
            </div>
          </div>
          <div className="text-center mt-8">
            <Link href="/pricing" className="text-blue-400 hover:text-blue-300 text-sm">
              View full pricing comparison →
            </Link>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <h3 className="text-3xl font-bold text-white mb-4">
            Stop losing sleep over cron jobs
          </h3>
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
            <Link href="/terms" className="text-gray-400 hover:text-white">
              Terms
            </Link>
            <Link href="/privacy" className="text-gray-400 hover:text-white">
              Privacy
            </Link>
            <a
              href="mailto:support@cronowl.com"
              className="text-gray-400 hover:text-white"
            >
              Contact
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
