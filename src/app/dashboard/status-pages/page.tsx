"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { Header } from "@/components/Header";
import {
  StatusPage,
  Check,
  getUserStatusPages,
  getUserChecks,
  createStatusPage,
  updateStatusPage,
  deleteStatusPage,
} from "@/lib/checks";

interface StatusPageModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: {
    title: string;
    description: string;
    checkIds: string[];
    isPublic: boolean;
    showTags: boolean;
  }) => Promise<void>;
  checks: Check[];
  initialData?: StatusPage;
}

function StatusPageModal({
  isOpen,
  onClose,
  onSave,
  checks,
  initialData,
}: StatusPageModalProps) {
  const [title, setTitle] = useState(initialData?.title || "");
  const [description, setDescription] = useState(initialData?.description || "");
  const [selectedCheckIds, setSelectedCheckIds] = useState<string[]>(
    initialData?.checkIds || []
  );
  const [isPublic, setIsPublic] = useState(initialData?.isPublic ?? true);
  const [showTags, setShowTags] = useState(initialData?.showTags ?? true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title);
      setDescription(initialData.description || "");
      setSelectedCheckIds(initialData.checkIds);
      setIsPublic(initialData.isPublic);
      setShowTags(initialData.showTags);
    } else {
      setTitle("");
      setDescription("");
      setSelectedCheckIds([]);
      setIsPublic(true);
      setShowTags(true);
    }
  }, [initialData, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setSaving(true);
    try {
      await onSave({
        title: title.trim(),
        description: description.trim(),
        checkIds: selectedCheckIds,
        isPublic,
        showTags,
      });
      onClose();
    } finally {
      setSaving(false);
    }
  };

  const toggleCheck = (checkId: string) => {
    setSelectedCheckIds((prev) =>
      prev.includes(checkId)
        ? prev.filter((id) => id !== checkId)
        : [...prev, checkId]
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gray-900 border border-gray-800 rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <div className="p-6 border-b border-gray-800">
            <h2 className="text-lg font-semibold text-white">
              {initialData ? "Edit Status Page" : "Create Status Page"}
            </h2>
          </div>

          <div className="p-6 space-y-4">
            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="My Service Status"
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Description (optional)
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Current status of our services..."
                rows={2}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
            </div>

            {/* Checks selection */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Select Checks to Display
              </label>
              <div className="space-y-2 max-h-48 overflow-y-auto bg-gray-800 rounded-lg p-2">
                {checks.length === 0 ? (
                  <p className="text-gray-500 text-sm p-2">No checks available</p>
                ) : (
                  checks.map((check) => (
                    <label
                      key={check.id}
                      className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-700 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={selectedCheckIds.includes(check.id)}
                        onChange={() => toggleCheck(check.id)}
                        className="w-4 h-4 rounded border-gray-600 text-blue-500 focus:ring-blue-500 focus:ring-offset-0 bg-gray-700"
                      />
                      <span className="text-white">{check.name}</span>
                      <span
                        className={`ml-auto text-xs px-2 py-0.5 rounded ${
                          check.status === "up"
                            ? "bg-green-500/20 text-green-400"
                            : check.status === "down"
                            ? "bg-red-500/20 text-red-400"
                            : "bg-gray-500/20 text-gray-400"
                        }`}
                      >
                        {check.status}
                      </span>
                    </label>
                  ))
                )}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {selectedCheckIds.length} check(s) selected
              </p>
            </div>

            {/* Options */}
            <div className="space-y-3">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isPublic}
                  onChange={(e) => setIsPublic(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-600 text-blue-500 focus:ring-blue-500 focus:ring-offset-0 bg-gray-700"
                />
                <div>
                  <span className="text-white">Public</span>
                  <p className="text-xs text-gray-500">
                    Anyone with the link can view this status page
                  </p>
                </div>
              </label>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showTags}
                  onChange={(e) => setShowTags(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-600 text-blue-500 focus:ring-blue-500 focus:ring-offset-0 bg-gray-700"
                />
                <div>
                  <span className="text-white">Show Tags</span>
                  <p className="text-xs text-gray-500">
                    Display check tags on the public page
                  </p>
                </div>
              </label>
            </div>
          </div>

          <div className="p-6 border-t border-gray-800 flex gap-3 justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || !title.trim()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {saving ? "Saving..." : initialData ? "Save Changes" : "Create"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function StatusPagesPage() {
  const { user, loading: authLoading, signOut } = useAuth();
  const router = useRouter();
  const [statusPages, setStatusPages] = useState<StatusPage[]>([]);
  const [checks, setChecks] = useState<Check[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPage, setEditingPage] = useState<StatusPage | undefined>();
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    async function loadData() {
      if (!user) return;

      try {
        const [pages, userChecks] = await Promise.all([
          getUserStatusPages(user.uid),
          getUserChecks(user.uid),
        ]);
        setStatusPages(pages);
        setChecks(userChecks);
      } catch (error) {
        console.error("Failed to load status pages:", error);
      } finally {
        setLoading(false);
      }
    }

    if (user) {
      loadData();
    }
  }, [user]);

  const handleCreate = async (data: {
    title: string;
    description: string;
    checkIds: string[];
    isPublic: boolean;
    showTags: boolean;
  }) => {
    if (!user) return;

    await createStatusPage(user.uid, data);

    // Reload pages
    const pages = await getUserStatusPages(user.uid);
    setStatusPages(pages);
  };

  const handleUpdate = async (data: {
    title: string;
    description: string;
    checkIds: string[];
    isPublic: boolean;
    showTags: boolean;
  }) => {
    if (!editingPage) return;

    await updateStatusPage(editingPage.id, data);

    // Reload pages
    if (user) {
      const pages = await getUserStatusPages(user.uid);
      setStatusPages(pages);
    }
  };

  const handleDelete = async (pageId: string) => {
    if (!confirm("Are you sure you want to delete this status page?")) return;

    await deleteStatusPage(pageId);

    // Reload pages
    if (user) {
      const pages = await getUserStatusPages(user.uid);
      setStatusPages(pages);
    }
  };

  const copyToClipboard = async (slug: string) => {
    const url = `${window.location.origin}/status/${slug}`;
    await navigator.clipboard.writeText(url);
    setCopiedSlug(slug);
    setTimeout(() => setCopiedSlug(null), 2000);
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-950">
      <Header user={user} signOut={signOut} />

      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
              <Link href="/dashboard" className="hover:text-gray-400">
                Dashboard
              </Link>
              <span>/</span>
              <span className="text-gray-400">Status Pages</span>
            </div>
            <h1 className="text-2xl font-bold text-white">Status Pages</h1>
            <p className="text-gray-400 mt-1">
              Create public status pages to share with your team or customers
            </p>
          </div>
          <button
            onClick={() => {
              setEditingPage(undefined);
              setIsModalOpen(true);
            }}
            className="flex items-center gap-2 bg-blue-600 text-white rounded-lg px-4 py-2 hover:bg-blue-700 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New Status Page
          </button>
        </div>

        {/* Status pages list */}
        {statusPages.length === 0 ? (
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-12 text-center">
            <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h2 className="text-lg font-semibold text-white mb-2">No status pages yet</h2>
            <p className="text-gray-400 mb-6">
              Create a public status page to share the health of your services
            </p>
            <button
              onClick={() => {
                setEditingPage(undefined);
                setIsModalOpen(true);
              }}
              className="bg-blue-600 text-white rounded-lg px-4 py-2 hover:bg-blue-700 transition-colors"
            >
              Create Your First Status Page
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {statusPages.map((page) => (
              <div
                key={page.id}
                className="bg-gray-900 border border-gray-800 rounded-xl p-6"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <h3 className="text-lg font-semibold text-white">{page.title}</h3>
                      <span
                        className={`text-xs px-2 py-0.5 rounded ${
                          page.isPublic
                            ? "bg-green-500/20 text-green-400"
                            : "bg-gray-500/20 text-gray-400"
                        }`}
                      >
                        {page.isPublic ? "Public" : "Private"}
                      </span>
                    </div>
                    {page.description && (
                      <p className="text-gray-400 text-sm mt-1">{page.description}</p>
                    )}
                    <div className="flex items-center gap-4 mt-3 text-sm text-gray-500">
                      <span>{page.checkIds.length} check(s)</span>
                      <span>•</span>
                      <span>
                        Created {new Date(page.createdAt.seconds * 1000).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Copy URL */}
                    <button
                      onClick={() => copyToClipboard(page.slug)}
                      className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
                      title="Copy URL"
                    >
                      {copiedSlug === page.slug ? (
                        <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                        </svg>
                      )}
                    </button>

                    {/* View */}
                    <Link
                      href={`/status/${page.slug}`}
                      target="_blank"
                      className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
                      title="View page"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </Link>

                    {/* Edit */}
                    <button
                      onClick={() => {
                        setEditingPage(page);
                        setIsModalOpen(true);
                      }}
                      className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
                      title="Edit"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>

                    {/* Delete */}
                    <button
                      onClick={() => handleDelete(page.id)}
                      className="p-2 text-gray-400 hover:text-red-400 hover:bg-gray-800 rounded-lg transition-colors"
                      title="Delete"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Badge preview */}
                <div className="mt-4 pt-4 border-t border-gray-800">
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-gray-500">Badge:</span>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={`/api/status/${page.slug}/badge?label=status`}
                      alt="Status badge"
                      className="h-5"
                    />
                    <button
                      onClick={() => {
                        const badgeUrl = `${window.location.origin}/api/status/${page.slug}/badge`;
                        const markdown = `![Status](${badgeUrl})`;
                        navigator.clipboard.writeText(markdown);
                        setCopiedSlug(`badge-${page.slug}`);
                        setTimeout(() => setCopiedSlug(null), 2000);
                      }}
                      className="text-xs text-gray-500 hover:text-gray-400 transition-colors"
                    >
                      {copiedSlug === `badge-${page.slug}` ? "Copied!" : "Copy Markdown"}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Modal */}
      <StatusPageModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingPage(undefined);
        }}
        onSave={editingPage ? handleUpdate : handleCreate}
        checks={checks}
        initialData={editingPage}
      />
    </div>
  );
}
