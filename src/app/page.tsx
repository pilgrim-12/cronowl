import Link from "next/link";
import { OwlLogo } from "@/components/OwlLogo";
import { PublicHeader } from "@/components/PublicHeader";
import { SmartCTAButton } from "@/components/SmartCTAButton";

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-950">
      <PublicHeader />

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-4 py-24 text-center">
        <div className="flex justify-center mb-6">
          <OwlLogo className="w-24 h-24" />
        </div>
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
          <SmartCTAButton>Start Monitoring — Free</SmartCTAButton>
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
                curl https://cronowl.com/api/ping/abc123
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

      {/* Features */}
      <section className="py-20">
        <div className="max-w-6xl mx-auto px-4">
          <h3 className="text-3xl font-bold text-white text-center mb-4">
            Everything you need
          </h3>
          <p className="text-gray-400 text-center mb-12 max-w-2xl mx-auto">
            From simple pings to full API automation
          </p>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            <div className="bg-gray-900 rounded-lg p-6">
              <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h4 className="text-lg font-semibold text-white mb-2">Cron Expressions</h4>
              <p className="text-gray-400 text-sm">
                Full cron syntax support with timezone awareness
              </p>
            </div>
            <div className="bg-gray-900 rounded-lg p-6">
              <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h4 className="text-lg font-semibold text-white mb-2">Status Pages</h4>
              <p className="text-gray-400 text-sm">
                Public status pages with embeddable badges
              </p>
            </div>
            <div className="bg-gray-900 rounded-lg p-6">
              <div className="w-10 h-10 bg-yellow-500/20 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-5 h-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h4 className="text-lg font-semibold text-white mb-2">Slow Job Alerts</h4>
              <p className="text-gray-400 text-sm">
                Get notified when jobs take longer than expected
              </p>
            </div>
            <div className="bg-gray-900 rounded-lg p-6">
              <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                </svg>
              </div>
              <h4 className="text-lg font-semibold text-white mb-2">REST API</h4>
              <p className="text-gray-400 text-sm">
                Full API for automation and integrations
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* API Section */}
      <section className="bg-gray-900 py-20">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h3 className="text-3xl font-bold text-white mb-4">
                Powerful REST API
              </h3>
              <p className="text-gray-400 mb-6">
                Automate everything with our API. Create checks, manage monitoring,
                and integrate with your CI/CD pipelines.
              </p>
              <ul className="space-y-3 mb-6">
                <li className="flex items-center gap-3 text-gray-300">
                  <span className="text-green-500">✓</span>
                  Bearer token authentication
                </li>
                <li className="flex items-center gap-3 text-gray-300">
                  <span className="text-green-500">✓</span>
                  Full CRUD for checks
                </li>
                <li className="flex items-center gap-3 text-gray-300">
                  <span className="text-green-500">✓</span>
                  Ping history & status events
                </li>
                <li className="flex items-center gap-3 text-gray-300">
                  <span className="text-green-500">✓</span>
                  Pause/resume monitoring
                </li>
              </ul>
              <Link
                href="/docs/api"
                className="text-blue-400 hover:text-blue-300 font-medium"
              >
                View API Documentation →
              </Link>
            </div>
            <div className="bg-gray-950 rounded-xl p-6 font-mono text-sm overflow-x-auto">
              <div className="text-gray-500 mb-2"># List all checks</div>
              <div className="text-green-400 mb-4">
                curl -H &quot;Authorization: Bearer sk_live_xxx&quot; \<br />
                &nbsp;&nbsp;https://cronowl.com/api/v1/checks
              </div>
              <div className="text-gray-500 mb-2"># Create a check</div>
              <div className="text-green-400 mb-4">
                curl -X POST \<br />
                &nbsp;&nbsp;-H &quot;Authorization: Bearer sk_live_xxx&quot; \<br />
                &nbsp;&nbsp;-H &quot;Content-Type: application/json&quot; \<br />
                &nbsp;&nbsp;-d &apos;&#123;&quot;name&quot;:&quot;Backup&quot;,&quot;schedule&quot;:&quot;every hour&quot;&#125;&apos; \<br />
                &nbsp;&nbsp;https://cronowl.com/api/v1/checks
              </div>
              <div className="text-gray-500 mb-2"># Ping with duration</div>
              <div className="text-green-400">
                curl &quot;https://cronowl.com/api/ping/abc123?duration=5000&quot;
              </div>
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
          <SmartCTAButton className="inline-block">
            Start Monitoring — It&apos;s Free
          </SmartCTAButton>
        </div>
      </section>

      {/* Comparison Section */}
      <section className="bg-gray-900 py-16">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h3 className="text-2xl font-bold text-white mb-4">
            How we compare to alternatives
          </h3>
          <p className="text-gray-400 mb-8">
            See why developers are switching to CronOwl
          </p>
          <div className="grid md:grid-cols-2 gap-6">
            <Link
              href="/compare/healthchecks"
              className="bg-gray-800 hover:bg-gray-750 rounded-lg p-6 text-left transition-colors group"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-white font-medium">vs Healthchecks.io</span>
                <span className="text-gray-500 group-hover:text-gray-400 transition-colors">→</span>
              </div>
              <p className="text-gray-400 text-sm mb-3">
                Same features, 80% cheaper. Plus push notifications and status pages.
              </p>
              <div className="text-green-400 text-sm font-medium">Save $192/year</div>
            </Link>
            <Link
              href="/compare/cronitor"
              className="bg-gray-800 hover:bg-gray-750 rounded-lg p-6 text-left transition-colors group"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-white font-medium">vs Cronitor</span>
                <span className="text-gray-500 group-hover:text-gray-400 transition-colors">→</span>
              </div>
              <p className="text-gray-400 text-sm mb-3">
                98% cost savings. $4/mo vs $200/mo for 100 cron jobs.
              </p>
              <div className="text-green-400 text-sm font-medium">Save $2,352/year</div>
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
          <div className="flex flex-wrap justify-center md:justify-end gap-6 text-sm">
            <Link href="/pricing" className="text-gray-400 hover:text-white">
              Pricing
            </Link>
            <Link href="/compare/healthchecks" className="text-gray-400 hover:text-white">
              vs Healthchecks
            </Link>
            <Link href="/compare/cronitor" className="text-gray-400 hover:text-white">
              vs Cronitor
            </Link>
            <Link href="/docs/api" className="text-gray-400 hover:text-white">
              API
            </Link>
            <Link href="/terms" className="text-gray-400 hover:text-white">
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
