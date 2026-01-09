import Link from "next/link";
import { PublicHeader } from "@/components/PublicHeader";

interface ChangelogEntry {
  version: string;
  date: string;
  title: string;
  type: "feature" | "improvement" | "fix" | "breaking";
  changes: string[];
}

const changelog: ChangelogEntry[] = [
  {
    version: "0.1.0",
    date: "2026-01-10",
    title: "Initial Release",
    type: "feature",
    changes: [
      "Dead Man's Switch monitoring for cron jobs",
      "Multi-channel alerting: Email, Push, Telegram, Webhooks",
      "HTTP endpoint monitoring with assertions",
      "Public status pages with incident management",
      "Full REST API with rate limiting",
      "CLI tool (npm install -g cronowl)",
      "Subscription plans via Paddle",
    ],
  },
];

const typeColors = {
  feature: "bg-green-500/20 text-green-400 border-green-500/30",
  improvement: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  fix: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  breaking: "bg-red-500/20 text-red-400 border-red-500/30",
};

const typeLabels = {
  feature: "New Feature",
  improvement: "Improvement",
  fix: "Bug Fix",
  breaking: "Breaking Change",
};

export default function ChangelogPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <PublicHeader />

      <div className="max-w-3xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="mb-12">
          <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-500 mb-4">
            <Link href="/" className="hover:text-gray-600 dark:hover:text-gray-400">
              Home
            </Link>
            <span>/</span>
            <span className="text-gray-600 dark:text-gray-400">Changelog</span>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Changelog
          </h1>
          <p className="text-xl text-gray-500 dark:text-gray-400">
            New features, improvements, and fixes in CronOwl
          </p>
        </div>

        {/* Changelog entries */}
        <div className="space-y-8">
          {changelog.map((entry) => (
            <article
              key={entry.version}
              className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-6"
            >
              <div className="flex flex-wrap items-center gap-3 mb-4">
                <span className="text-xl font-bold text-gray-900 dark:text-white">
                  v{entry.version}
                </span>
                <span
                  className={`px-2 py-0.5 text-xs font-medium rounded border ${typeColors[entry.type]}`}
                >
                  {typeLabels[entry.type]}
                </span>
                <span className="text-sm text-gray-500 dark:text-gray-500">
                  {new Date(entry.date).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </span>
              </div>

              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                {entry.title}
              </h2>

              <ul className="space-y-2">
                {entry.changes.map((change, index) => (
                  <li
                    key={index}
                    className="flex items-start gap-2 text-gray-600 dark:text-gray-400"
                  >
                    <span className="text-green-500 mt-1">+</span>
                    <span>{change}</span>
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>

        {/* Footer */}
        <div className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-800">
          <p className="text-gray-500 dark:text-gray-500 text-sm text-center">
            Subscribe to our newsletter or follow us on Twitter for updates.
          </p>
        </div>
      </div>
    </div>
  );
}
