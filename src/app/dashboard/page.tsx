"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useAuth } from "@/lib/auth-context";
import {
  Check,
  getUserChecks,
  createCheck,
  deleteCheck,
  calculateRealStatus,
} from "@/lib/checks";

export default function DashboardPage() {
  const { user, loading, signOut } = useAuth();
  const router = useRouter();
  const [checks, setChecks] = useState<Check[]>([]);
  const [loadingChecks, setLoadingChecks] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user) {
      loadChecks();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const loadChecks = async () => {
    if (!user) return;
    setLoadingChecks(true);
    try {
      const userChecks = await getUserChecks(user.uid);
      setChecks(userChecks);
    } catch (error) {
      console.error("Failed to load checks:", error);
    } finally {
      setLoadingChecks(false);
    }
  };

  const handleCreateCheck = async (
    name: string,
    schedule: string,
    gracePeriod: number
  ) => {
    if (!user) return;
    try {
      await createCheck(user.uid, { name, schedule, gracePeriod });
      await loadChecks();
      setShowCreateModal(false);
    } catch (error) {
      console.error("Failed to create check:", error);
    }
  };

  const handleDeleteCheck = async (checkId: string) => {
    if (!confirm("Are you sure you want to delete this check?")) return;
    try {
      await deleteCheck(checkId);
      await loadChecks();
    } catch (error) {
      console.error("Failed to delete check:", error);
    }
  };

  const getStatusColor = (check: Check) => {
    const realStatus = calculateRealStatus(check);
    switch (realStatus) {
      case "up":
        return "bg-green-500";
      case "down":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  const getPingUrl = (slug: string) => {
    return `${window.location.origin}/api/ping/${slug}`;
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-950">
      <header className="border-b border-gray-800">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold text-white">🦉 CronOwl</h1>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              {user.photoURL ? (
                <Image
                  src={user.photoURL}
                  alt="Avatar"
                  width={32}
                  height={32}
                  className="rounded-full"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center text-white text-sm">
                  {user.email?.charAt(0).toUpperCase()}
                </div>
              )}
              <span className="text-gray-400 text-sm">{user.email}</span>
            </div>
            <button
              onClick={() => signOut()}
              className="text-gray-400 hover:text-white text-sm"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold text-white">Your Checks</h2>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-blue-600 text-white rounded-lg px-4 py-2 font-medium hover:bg-blue-700 transition-colors"
          >
            + New Check
          </button>
        </div>

        {loadingChecks ? (
          <div className="text-gray-400 text-center py-8">
            Loading checks...
          </div>
        ) : checks.length === 0 ? (
          <div className="bg-gray-900 rounded-lg p-8 text-center">
            <div className="text-6xl mb-4">🦉</div>
            <h3 className="text-xl font-medium text-white mb-2">
              No checks yet
            </h3>
            <p className="text-gray-400 mb-6">
              Create your first check to start monitoring your cron jobs
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-blue-600 text-white rounded-lg px-6 py-2.5 font-medium hover:bg-blue-700 transition-colors"
            >
              Create your first check
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {checks.map((check) => (
              <div key={check.id} className="bg-gray-900 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-3 h-3 rounded-full ${getStatusColor(
                        check
                      )}`}
                    />
                    <div>
                      <h3 className="text-white font-medium">{check.name}</h3>
                      <p className="text-gray-400 text-sm">
                        {check.schedule} • {check.gracePeriod}min grace
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => copyToClipboard(getPingUrl(check.slug))}
                      className="text-gray-400 hover:text-white text-sm px-3 py-1 bg-gray-800 rounded"
                    >
                      Copy URL
                    </button>
                    <button
                      onClick={() => handleDeleteCheck(check.id)}
                      className="text-red-400 hover:text-red-300 text-sm px-3 py-1"
                    >
                      Delete
                    </button>
                  </div>
                </div>
                <div className="mt-3 bg-gray-800 rounded p-2">
                  <code className="text-green-400 text-sm break-all">
                    {getPingUrl(check.slug)}
                  </code>
                </div>
                <p className="text-gray-500 text-xs mt-2">
                  Last ping:{" "}
                  {check.lastPing
                    ? new Date(check.lastPing.toDate()).toLocaleString()
                    : "Never"}
                </p>
              </div>
            ))}
          </div>
        )}
      </main>

      {showCreateModal && (
        <CreateCheckModal
          onClose={() => setShowCreateModal(false)}
          onCreate={handleCreateCheck}
        />
      )}
    </div>
  );
}

function CreateCheckModal({
  onClose,
  onCreate,
}: {
  onClose: () => void;
  onCreate: (name: string, schedule: string, gracePeriod: number) => void;
}) {
  const [name, setName] = useState("");
  const [schedule, setSchedule] = useState("every 5 minutes");
  const [gracePeriod, setGracePeriod] = useState(5);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onCreate(name, schedule, gracePeriod);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-gray-900 rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-bold text-white mb-4">Create New Check</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="e.g., Daily backup"
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Expected Schedule
            </label>
            <select
              value={schedule}
              onChange={(e) => setSchedule(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="every 1 minute">Every 1 minute</option>
              <option value="every 5 minutes">Every 5 minutes</option>
              <option value="every 15 minutes">Every 15 minutes</option>
              <option value="every 30 minutes">Every 30 minutes</option>
              <option value="every hour">Every hour</option>
              <option value="every day">Every day</option>
              <option value="every week">Every week</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Grace Period (minutes)
            </label>
            <input
              type="number"
              value={gracePeriod}
              onChange={(e) => setGracePeriod(Number(e.target.value))}
              min={1}
              max={60}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-gray-500 text-xs mt-1">
              How long to wait before marking as down
            </p>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-800 text-white rounded-lg px-4 py-2.5 font-medium hover:bg-gray-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 bg-blue-600 text-white rounded-lg px-4 py-2.5 font-medium hover:bg-blue-700 transition-colors"
            >
              Create
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
