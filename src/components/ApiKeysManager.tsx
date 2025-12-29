"use client";

import { useState, useEffect } from "react";
import { User } from "firebase/auth";

// Component for displaying newly created key
function NewKeyDisplay({
  newKey,
  onDone,
  copyToClipboard,
}: {
  newKey: string;
  onDone: () => void;
  copyToClipboard: (text: string) => Promise<void>;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await copyToClipboard(newKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
      <h3 className="text-lg font-semibold text-white mb-4">API Key Created</h3>
      <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 mb-4">
        <div className="flex items-center gap-2 text-yellow-400 mb-3">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <p className="text-sm font-medium">
            Copy this key now. You won&apos;t be able to see it again!
          </p>
        </div>
        <div className="bg-gray-800 rounded-lg p-3">
          <code className="text-sm font-mono text-white break-all block mb-3">
            {newKey}
          </code>
          <button
            onClick={handleCopy}
            className={`w-full py-2 rounded-lg text-sm font-medium transition-colors ${
              copied
                ? "bg-green-600 text-white"
                : "bg-gray-700 text-white hover:bg-gray-600"
            }`}
          >
            {copied ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Copied to clipboard!
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                </svg>
                Copy to clipboard
              </span>
            )}
          </button>
        </div>
      </div>
      <button
        onClick={onDone}
        className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors"
      >
        I&apos;ve saved my key
      </button>
    </>
  );
}

interface ApiKeyInfo {
  id: string;
  name: string;
  prefix: string;
  createdAt: string;
  lastUsedAt: string | null;
}

interface ApiKeysManagerProps {
  user: User;
}

export function ApiKeysManager({ user }: ApiKeysManagerProps) {
  const [keys, setKeys] = useState<ApiKeyInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newKeyName, setNewKeyName] = useState("");
  const [newKey, setNewKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadKeys = async () => {
    try {
      const token = await user.getIdToken();
      const res = await fetch("/api/user/api-keys", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (res.ok) {
        const data = await res.json();
        setKeys(data.keys);
      }
    } catch (err) {
      console.error("Failed to load API keys:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadKeys();
  }, [user]);

  const handleCreate = async () => {
    if (!newKeyName.trim()) return;

    setCreating(true);
    setError(null);

    try {
      const token = await user.getIdToken();
      const res = await fetch("/api/user/api-keys", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name: newKeyName.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to create API key");
        return;
      }

      setNewKey(data.key);
      setNewKeyName("");
      loadKeys();
    } catch (err) {
      console.error("Failed to create API key:", err);
      setError("Failed to create API key");
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (keyId: string) => {
    if (!confirm("Are you sure you want to revoke this API key? This cannot be undone.")) {
      return;
    }

    setDeletingId(keyId);

    try {
      const token = await user.getIdToken();
      const res = await fetch(`/api/user/api-keys?id=${keyId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.ok) {
        setKeys(keys.filter((k) => k.id !== keyId));
      }
    } catch (err) {
      console.error("Failed to revoke API key:", err);
    } finally {
      setDeletingId(null);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // Fallback for older browsers
      const textArea = document.createElement("textarea");
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="bg-gray-900 rounded-lg p-6">
        <h2 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
          </svg>
          API Keys
        </h2>
        <div className="animate-pulse space-y-3">
          <div className="h-12 bg-gray-800 rounded"></div>
          <div className="h-12 bg-gray-800 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-900 rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-medium text-white flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
          </svg>
          API Keys
        </h2>
        <button
          onClick={() => setShowCreateModal(true)}
          className="text-sm bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Create Key
        </button>
      </div>

      <p className="text-gray-400 text-sm mb-4">
        Use API keys to access the CronOwl API programmatically. Keep your keys secret!
      </p>

      {keys.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <svg className="w-12 h-12 mx-auto mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
          </svg>
          <p>No API keys yet</p>
          <p className="text-sm mt-1">Create one to get started with the API</p>
        </div>
      ) : (
        <div className="space-y-3">
          {keys.map((key) => (
            <div
              key={key.id}
              className="flex items-center justify-between bg-gray-800 rounded-lg px-4 py-3"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-white font-medium">{key.name}</span>
                  <code className="text-xs text-gray-500 bg-gray-700 px-2 py-0.5 rounded">
                    {key.prefix}
                  </code>
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  Created {formatDate(key.createdAt)}
                  {key.lastUsedAt && ` • Last used ${formatDate(key.lastUsedAt)}`}
                </div>
              </div>
              <button
                onClick={() => handleDelete(key.id)}
                disabled={deletingId === key.id}
                className="text-red-400 hover:text-red-300 text-sm disabled:opacity-50"
              >
                {deletingId === key.id ? "Revoking..." : "Revoke"}
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-900 rounded-xl p-6 w-full max-w-md mx-4 border border-gray-800">
            {newKey ? (
              // Show the newly created key
              <NewKeyDisplay
                newKey={newKey}
                onDone={() => {
                  setShowCreateModal(false);
                  setNewKey(null);
                }}
                copyToClipboard={copyToClipboard}
              />
            ) : (
              // Create form
              <>
                <h3 className="text-lg font-semibold text-white mb-4">Create API Key</h3>

                {/* Security warning */}
                <div className="bg-gray-800 border border-gray-700 rounded-lg p-3 mb-4">
                  <div className="flex items-start gap-2">
                    <svg className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-gray-400 text-sm">
                      Your API key will only be shown once after creation. Make sure to copy and store it securely.
                    </p>
                  </div>
                </div>

                <div className="mb-4">
                  <label className="block text-sm text-gray-400 mb-1">Key Name</label>
                  <input
                    type="text"
                    value={newKeyName}
                    onChange={(e) => setNewKeyName(e.target.value)}
                    placeholder="e.g., Production, CI/CD, Testing"
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    maxLength={50}
                  />
                </div>
                {error && (
                  <p className="text-red-400 text-sm mb-4">{error}</p>
                )}
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setShowCreateModal(false);
                      setNewKeyName("");
                      setError(null);
                    }}
                    className="flex-1 bg-gray-800 text-white py-2 rounded-lg hover:bg-gray-700 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreate}
                    disabled={creating || !newKeyName.trim()}
                    className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {creating ? "Creating..." : "Create"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
