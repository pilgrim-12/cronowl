import Link from "next/link";
import { PublicHeader } from "@/components/PublicHeader";

export default function RefundPage() {
  return (
    <div className="min-h-screen bg-gray-950">
      <PublicHeader />

      {/* Content */}
      <main className="max-w-4xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold text-white mb-2">Refund Policy</h1>
        <p className="text-gray-500 mb-8">Last updated: December 17, 2025</p>

        <div className="prose prose-invert prose-gray max-w-none space-y-8">
          <section>
            <h2 className="text-xl font-semibold text-white mb-3">14-Day Money-Back Guarantee</h2>
            <p className="text-gray-400">
              We offer a full refund within 14 days of your purchase, no questions asked.
              If you&apos;re not satisfied with CronOwl for any reason, contact us and we&apos;ll
              process your refund.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">How to Request a Refund</h2>
            <p className="text-gray-400">
              Email us at{" "}
              <a href="mailto:support@cronowl.com" className="text-blue-400 hover:text-blue-300">
                support@cronowl.com
              </a>{" "}
              with your account email and we&apos;ll process your refund within 5-10 business days.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">After 14 Days</h2>
            <p className="text-gray-400">
              After the 14-day period, we don&apos;t offer refunds. However, you can cancel your
              subscription anytime and continue using CronOwl until the end of your billing period.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">Questions?</h2>
            <p className="text-gray-400">
              Contact us at{" "}
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
            <Link href="/privacy" className="text-gray-400 hover:text-white">
              Privacy
            </Link>
            <Link href="/refund" className="text-white">
              Refund
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
