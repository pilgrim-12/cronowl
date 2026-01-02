"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { Header } from "@/components/Header";
import {
  StatusPage,
  StatusPageBranding,
  Check,
  Incident,
  IncidentStatus,
  IncidentSeverity,
  getUserStatusPages,
  getUserChecks,
  createStatusPage,
  updateStatusPage,
  deleteStatusPage,
  canCreateStatusPage,
  StatusPageLimitResult,
  getUserPlan,
  createIncident,
  addIncidentUpdate,
  resolveIncident,
  getStatusPageIncidents,
  getIncidentWithUpdates,
  deleteIncident,
} from "@/lib/checks";
import { PLANS, PlanType } from "@/lib/plans";

interface StatusPageModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: {
    title: string;
    description: string;
    checkIds: string[];
    isPublic: boolean;
    showTags: boolean;
    branding?: StatusPageBranding;
  }) => Promise<void>;
  checks: Check[];
  initialData?: StatusPage;
  userPlan: PlanType;
}

function StatusPageModal({
  isOpen,
  onClose,
  onSave,
  checks,
  initialData,
  userPlan,
}: StatusPageModalProps) {
  const [title, setTitle] = useState(initialData?.title || "");
  const [description, setDescription] = useState(initialData?.description || "");
  const [selectedCheckIds, setSelectedCheckIds] = useState<string[]>(
    initialData?.checkIds || []
  );
  const [isPublic, setIsPublic] = useState(initialData?.isPublic ?? true);
  const [showTags, setShowTags] = useState(initialData?.showTags ?? true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<"general" | "branding">("general");

  // Branding fields (Pro only)
  const [logoUrl, setLogoUrl] = useState(initialData?.branding?.logoUrl || "");
  const [primaryColor, setPrimaryColor] = useState(initialData?.branding?.primaryColor || "");
  const [hidePoweredBy, setHidePoweredBy] = useState(initialData?.branding?.hidePoweredBy || false);

  const canUseBranding = PLANS[userPlan].customBranding;

  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title);
      setDescription(initialData.description || "");
      setSelectedCheckIds(initialData.checkIds);
      setIsPublic(initialData.isPublic);
      setShowTags(initialData.showTags);
      setLogoUrl(initialData.branding?.logoUrl || "");
      setPrimaryColor(initialData.branding?.primaryColor || "");
      setHidePoweredBy(initialData.branding?.hidePoweredBy || false);
    } else {
      setTitle("");
      setDescription("");
      setSelectedCheckIds([]);
      setIsPublic(true);
      setShowTags(true);
      setLogoUrl("");
      setPrimaryColor("");
      setHidePoweredBy(false);
    }
    setActiveTab("general");
  }, [initialData, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setSaving(true);
    try {
      const branding: StatusPageBranding | undefined = canUseBranding && (logoUrl || primaryColor || hidePoweredBy)
        ? {
            logoUrl: logoUrl || undefined,
            primaryColor: primaryColor || undefined,
            hidePoweredBy: hidePoweredBy || undefined,
          }
        : undefined;

      await onSave({
        title: title.trim(),
        description: description.trim(),
        checkIds: selectedCheckIds,
        isPublic,
        showTags,
        branding,
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
            {/* Tabs */}
            <div className="flex gap-4 mt-4">
              <button
                type="button"
                onClick={() => setActiveTab("general")}
                className={`text-sm pb-2 border-b-2 transition-colors ${
                  activeTab === "general"
                    ? "text-blue-400 border-blue-400"
                    : "text-gray-500 border-transparent hover:text-gray-300"
                }`}
              >
                General
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("branding")}
                className={`text-sm pb-2 border-b-2 transition-colors flex items-center gap-1.5 ${
                  activeTab === "branding"
                    ? "text-blue-400 border-blue-400"
                    : "text-gray-500 border-transparent hover:text-gray-300"
                }`}
              >
                Branding
                {!canUseBranding && (
                  <span className="text-xs bg-blue-600 text-white px-1.5 py-0.5 rounded">Pro</span>
                )}
              </button>
            </div>
          </div>

          <div className="p-6 space-y-4">
            {activeTab === "general" ? (
              <>
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
              </>
            ) : (
              /* Branding Tab */
              <>
                {!canUseBranding ? (
                  <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 text-center">
                    <svg className="w-12 h-12 text-blue-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    <h3 className="text-white font-medium mb-2">Custom Branding is a Pro Feature</h3>
                    <p className="text-gray-400 text-sm mb-4">
                      Customize your status page with your own logo, colors, and remove the "Powered by CronOwl" footer.
                    </p>
                    <Link
                      href="/pricing"
                      className="inline-block bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
                    >
                      Upgrade to Pro
                    </Link>
                  </div>
                ) : (
                  <>
                    {/* Logo URL */}
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">
                        Logo URL
                      </label>
                      <input
                        type="url"
                        value={logoUrl}
                        onChange={(e) => setLogoUrl(e.target.value)}
                        placeholder="https://example.com/logo.png"
                        className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        URL to your logo image (recommended: 120x32px)
                      </p>
                      {logoUrl && (
                        <div className="mt-2 p-3 bg-gray-800 rounded-lg">
                          <p className="text-xs text-gray-500 mb-2">Preview:</p>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={logoUrl}
                            alt="Logo preview"
                            className="h-8 w-auto max-w-[120px] object-contain"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = "none";
                            }}
                          />
                        </div>
                      )}
                    </div>

                    {/* Primary Color */}
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">
                        Primary Color
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="color"
                          value={primaryColor || "#22c55e"}
                          onChange={(e) => setPrimaryColor(e.target.value)}
                          className="w-10 h-10 rounded-lg border border-gray-700 bg-gray-800 cursor-pointer"
                        />
                        <input
                          type="text"
                          value={primaryColor}
                          onChange={(e) => setPrimaryColor(e.target.value)}
                          placeholder="#22c55e"
                          className="flex-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        Used for the "All Systems Operational" banner
                      </p>
                    </div>

                    {/* Hide Powered By */}
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={hidePoweredBy}
                        onChange={(e) => setHidePoweredBy(e.target.checked)}
                        className="w-4 h-4 rounded border-gray-600 text-blue-500 focus:ring-blue-500 focus:ring-offset-0 bg-gray-700"
                      />
                      <div>
                        <span className="text-white">Hide "Powered by CronOwl"</span>
                        <p className="text-xs text-gray-500">
                          Remove CronOwl branding from the status page footer
                        </p>
                      </div>
                    </label>
                  </>
                )}
              </>
            )}
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
  const [planUsage, setPlanUsage] = useState<StatusPageLimitResult | null>(null);
  const [limitError, setLimitError] = useState<string | null>(null);
  const [userPlan, setUserPlan] = useState<PlanType>("free");

  // Incident management state
  const [incidentModalOpen, setIncidentModalOpen] = useState(false);
  const [selectedPageForIncident, setSelectedPageForIncident] = useState<StatusPage | null>(null);
  const [pageIncidents, setPageIncidents] = useState<Incident[]>([]);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    async function loadData() {
      if (!user) return;

      try {
        const [pages, userChecks, usage, plan] = await Promise.all([
          getUserStatusPages(user.uid),
          getUserChecks(user.uid),
          canCreateStatusPage(user.uid),
          getUserPlan(user.uid),
        ]);
        setStatusPages(pages);
        setChecks(userChecks);
        setPlanUsage(usage);
        setUserPlan(plan);
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
    branding?: StatusPageBranding;
  }) => {
    if (!user) return;
    setLimitError(null);

    try {
      await createStatusPage(user.uid, data);

      // Reload pages and usage
      const [pages, usage] = await Promise.all([
        getUserStatusPages(user.uid),
        canCreateStatusPage(user.uid),
      ]);
      setStatusPages(pages);
      setPlanUsage(usage);
    } catch (error) {
      if (error instanceof Error) {
        setLimitError(error.message);
      }
      throw error;
    }
  };

  const handleUpdate = async (data: {
    title: string;
    description: string;
    checkIds: string[];
    isPublic: boolean;
    showTags: boolean;
    branding?: StatusPageBranding;
  }) => {
    if (!editingPage) return;

    await updateStatusPage(editingPage.id, data);

    // Reload pages
    if (user) {
      const pages = await getUserStatusPages(user.uid);
      setStatusPages(pages);
    }
  };

  // Incident management functions
  const openIncidentModal = async (page: StatusPage) => {
    setSelectedPageForIncident(page);
    const incidents = await getStatusPageIncidents(page.id, true);
    setPageIncidents(incidents);
    setIncidentModalOpen(true);
  };

  const handleCreateIncident = async (data: {
    title: string;
    status: IncidentStatus;
    severity: IncidentSeverity;
    message: string;
  }) => {
    if (!user || !selectedPageForIncident) return;

    await createIncident(selectedPageForIncident.id, user.uid, {
      title: data.title,
      status: data.status,
      severity: data.severity,
      initialMessage: data.message,
    });

    // Refresh incidents
    const incidents = await getStatusPageIncidents(selectedPageForIncident.id, true);
    setPageIncidents(incidents);
  };

  const handleResolveIncident = async (incidentId: string, message?: string) => {
    await resolveIncident(incidentId, message);

    if (selectedPageForIncident) {
      const incidents = await getStatusPageIncidents(selectedPageForIncident.id, true);
      setPageIncidents(incidents);
    }
  };

  const handleAddUpdate = async (incidentId: string, message: string, status: IncidentStatus) => {
    await addIncidentUpdate(incidentId, message, status);

    if (selectedPageForIncident) {
      const incidents = await getStatusPageIncidents(selectedPageForIncident.id, true);
      setPageIncidents(incidents);
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
        {/* Plan Usage Banner */}
        {planUsage && (
          <div className="bg-gray-900 rounded-lg p-4 mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-white font-medium">
                    {PLANS[planUsage.plan].name} Plan
                  </span>
                  {planUsage.plan === "free" && (
                    <Link
                      href="/pricing"
                      className="text-xs bg-blue-600 hover:bg-blue-700 text-white px-2 py-0.5 rounded transition-colors"
                    >
                      Upgrade
                    </Link>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex-1 max-w-xs">
                    <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all ${
                          planUsage.current / planUsage.limit > 0.9
                            ? "bg-red-500"
                            : planUsage.current / planUsage.limit > 0.7
                            ? "bg-yellow-500"
                            : "bg-green-500"
                        }`}
                        style={{
                          width: `${Math.min((planUsage.current / planUsage.limit) * 100, 100)}%`,
                        }}
                      />
                    </div>
                  </div>
                  <span className="text-gray-400 text-sm whitespace-nowrap">
                    {planUsage.current} / {planUsage.limit} status pages
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Limit Error Alert */}
        {limitError && (
          <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <div className="flex-1">
                <p className="text-red-400">{limitError}</p>
                <Link href="/pricing" className="text-blue-400 hover:text-blue-300 text-sm mt-1 inline-block">
                  View pricing plans
                </Link>
              </div>
              <button
                onClick={() => setLimitError(null)}
                className="text-gray-400 hover:text-white"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
              <Link href="/dashboard" className="hover:text-gray-400">
                Dashboard
              </Link>
              <span>/</span>
              <span className="text-gray-400">Status Pages</span>
            </div>
            <h1 className="text-2xl font-bold text-white">Status Pages</h1>
            <p className="text-gray-400 mt-1 text-sm sm:text-base">
              Create public status pages to share with your team or customers
            </p>
          </div>
          <button
            onClick={() => {
              setEditingPage(undefined);
              setIsModalOpen(true);
            }}
            disabled={planUsage ? !planUsage.allowed : false}
            className="flex items-center justify-center gap-2 bg-blue-600 text-white rounded-lg px-4 py-2.5 hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shrink-0 w-full sm:w-auto"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span className="whitespace-nowrap">New Status Page</span>
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
                className="bg-gray-900 border border-gray-800 rounded-xl p-4 sm:p-6"
              >
                {/* Header with title and actions */}
                <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-lg font-semibold text-white truncate">{page.title}</h3>
                      <span
                        className={`text-xs px-2 py-0.5 rounded shrink-0 ${
                          page.isPublic
                            ? "bg-green-500/20 text-green-400"
                            : "bg-gray-500/20 text-gray-400"
                        }`}
                      >
                        {page.isPublic ? "Public" : "Private"}
                      </span>
                    </div>
                    {page.description && (
                      <p className="text-gray-400 text-sm mt-1 line-clamp-2">{page.description}</p>
                    )}
                    <div className="flex items-center gap-2 sm:gap-4 mt-2 text-sm text-gray-500 flex-wrap">
                      <span>{page.checkIds.length} check(s)</span>
                      <span className="hidden sm:inline">•</span>
                      <span>Created {new Date(page.createdAt.seconds * 1000).toLocaleDateString()}</span>
                    </div>
                  </div>

                  {/* Actions - responsive grid on mobile */}
                  <div className="flex items-center gap-1 sm:gap-2 shrink-0">
                    {/* Incidents */}
                    <button
                      onClick={() => openIncidentModal(page)}
                      className="p-2 text-gray-400 hover:text-orange-400 hover:bg-gray-800 rounded-lg transition-colors"
                      title="Manage Incidents"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                    </button>

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
                  <div className="flex flex-wrap items-center gap-2 sm:gap-4">
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

      {/* Status Page Modal */}
      <StatusPageModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingPage(undefined);
        }}
        onSave={editingPage ? handleUpdate : handleCreate}
        checks={checks}
        initialData={editingPage}
        userPlan={userPlan}
      />

      {/* Incident Modal */}
      {incidentModalOpen && selectedPageForIncident && (
        <IncidentModal
          isOpen={incidentModalOpen}
          onClose={() => {
            setIncidentModalOpen(false);
            setSelectedPageForIncident(null);
            setPageIncidents([]);
          }}
          pageTitle={selectedPageForIncident.title}
          incidents={pageIncidents}
          onCreateIncident={handleCreateIncident}
          onResolveIncident={handleResolveIncident}
          onAddUpdate={handleAddUpdate}
          planLimit={PLANS[userPlan].activeIncidentsLimit}
        />
      )}
    </div>
  );
}

// Incident Modal Component
interface IncidentModalProps {
  isOpen: boolean;
  onClose: () => void;
  pageTitle: string;
  incidents: Incident[];
  onCreateIncident: (data: {
    title: string;
    status: IncidentStatus;
    severity: IncidentSeverity;
    message: string;
  }) => Promise<void>;
  onResolveIncident: (incidentId: string, message?: string) => Promise<void>;
  onAddUpdate: (incidentId: string, message: string, status: IncidentStatus) => Promise<void>;
  planLimit: number;
}

function IncidentModal({
  isOpen,
  onClose,
  pageTitle,
  incidents,
  onCreateIncident,
  onResolveIncident,
  onAddUpdate,
  planLimit,
}: IncidentModalProps) {
  const [view, setView] = useState<"list" | "create" | "update">("list");
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  const [title, setTitle] = useState("");
  const [status, setStatus] = useState<IncidentStatus>("investigating");
  const [severity, setSeverity] = useState<IncidentSeverity>("minor");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  const activeIncidents = incidents.filter((i) => i.status !== "resolved");
  const resolvedIncidents = incidents.filter((i) => i.status === "resolved");
  const canCreateMore = activeIncidents.length < planLimit;

  const resetForm = () => {
    setTitle("");
    setStatus("investigating");
    setSeverity("minor");
    setMessage("");
    setSelectedIncident(null);
  };

  const handleCreate = async () => {
    if (!title.trim() || !message.trim()) return;
    setSaving(true);
    try {
      await onCreateIncident({ title, status, severity, message });
      resetForm();
      setView("list");
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async () => {
    if (!selectedIncident || !message.trim()) return;
    setSaving(true);
    try {
      if (status === "resolved") {
        await onResolveIncident(selectedIncident.id, message);
      } else {
        await onAddUpdate(selectedIncident.id, message, status);
      }
      resetForm();
      setView("list");
    } finally {
      setSaving(false);
    }
  };

  const severityColors = {
    minor: "bg-yellow-500/20 text-yellow-400",
    major: "bg-orange-500/20 text-orange-400",
    critical: "bg-red-500/20 text-red-400",
  };

  const statusColors = {
    investigating: "bg-orange-500/20 text-orange-400",
    identified: "bg-yellow-500/20 text-yellow-400",
    monitoring: "bg-blue-500/20 text-blue-400",
    resolved: "bg-green-500/20 text-green-400",
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gray-900 border border-gray-800 rounded-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-800 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-white">Incidents</h2>
            <p className="text-sm text-gray-500">{pageTitle}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {view === "list" && (
            <>
              {/* Create button */}
              <button
                onClick={() => {
                  resetForm();
                  setView("create");
                }}
                disabled={!canCreateMore}
                className="w-full mb-6 flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white rounded-lg px-4 py-3 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                Create Incident
              </button>
              {!canCreateMore && (
                <p className="text-center text-yellow-400 text-sm mb-4">
                  You&apos;ve reached the limit of {planLimit} active incident(s). Resolve existing incidents first.
                </p>
              )}

              {/* Active Incidents */}
              {activeIncidents.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-sm font-medium text-gray-400 mb-3">Active Incidents</h3>
                  <div className="space-y-3">
                    {activeIncidents.map((incident) => (
                      <div key={incident.id} className="bg-gray-800 rounded-lg p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-medium text-white">{incident.title}</h4>
                              <span className={`text-xs px-2 py-0.5 rounded ${severityColors[incident.severity]}`}>
                                {incident.severity}
                              </span>
                              <span className={`text-xs px-2 py-0.5 rounded ${statusColors[incident.status]}`}>
                                {incident.status}
                              </span>
                            </div>
                            <p className="text-xs text-gray-500">
                              Created {new Date(incident.createdAt.seconds * 1000).toLocaleString()}
                            </p>
                          </div>
                          <button
                            onClick={() => {
                              setSelectedIncident(incident);
                              setStatus(incident.status);
                              setMessage("");
                              setView("update");
                            }}
                            className="text-blue-400 hover:text-blue-300 text-sm"
                          >
                            Update
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Resolved Incidents */}
              {resolvedIncidents.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-gray-400 mb-3">Resolved Incidents</h3>
                  <div className="space-y-2">
                    {resolvedIncidents.slice(0, 5).map((incident) => (
                      <div key={incident.id} className="bg-gray-800/50 rounded-lg p-3 flex items-center justify-between">
                        <div>
                          <span className="text-gray-300">{incident.title}</span>
                          <span className="text-xs text-gray-500 ml-2">
                            {incident.resolvedAt
                              ? new Date(incident.resolvedAt.seconds * 1000).toLocaleDateString()
                              : ""}
                          </span>
                        </div>
                        <span className={`text-xs px-2 py-0.5 rounded ${statusColors.resolved}`}>
                          resolved
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {incidents.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  No incidents yet. Create one when something goes wrong.
                </div>
              )}
            </>
          )}

          {view === "create" && (
            <div className="space-y-4">
              <button
                onClick={() => setView("list")}
                className="text-gray-400 hover:text-white text-sm flex items-center gap-1 mb-4"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back to list
              </button>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Database connectivity issues"
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as IncidentStatus)}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="investigating">Investigating</option>
                    <option value="identified">Identified</option>
                    <option value="monitoring">Monitoring</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Severity</label>
                  <select
                    value={severity}
                    onChange={(e) => setSeverity(e.target.value as IncidentSeverity)}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="minor">Minor</option>
                    <option value="major">Major</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Initial Message</label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="We are investigating issues with..."
                  rows={3}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>

              <button
                onClick={handleCreate}
                disabled={saving || !title.trim() || !message.trim()}
                className="w-full bg-red-600 hover:bg-red-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white rounded-lg px-4 py-2 transition-colors"
              >
                {saving ? "Creating..." : "Create Incident"}
              </button>
            </div>
          )}

          {view === "update" && selectedIncident && (
            <div className="space-y-4">
              <button
                onClick={() => {
                  setView("list");
                  setSelectedIncident(null);
                }}
                className="text-gray-400 hover:text-white text-sm flex items-center gap-1 mb-4"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back to list
              </button>

              <div className="bg-gray-800 rounded-lg p-4 mb-4">
                <h3 className="font-medium text-white mb-1">{selectedIncident.title}</h3>
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2 py-0.5 rounded ${severityColors[selectedIncident.severity]}`}>
                    {selectedIncident.severity}
                  </span>
                  <span className={`text-xs px-2 py-0.5 rounded ${statusColors[selectedIncident.status]}`}>
                    {selectedIncident.status}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">New Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as IncidentStatus)}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="investigating">Investigating</option>
                  <option value="identified">Identified</option>
                  <option value="monitoring">Monitoring</option>
                  <option value="resolved">Resolved</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Update Message</label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder={status === "resolved" ? "The issue has been resolved..." : "We have identified the issue..."}
                  rows={3}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>

              <button
                onClick={handleUpdate}
                disabled={saving || !message.trim()}
                className={`w-full ${
                  status === "resolved"
                    ? "bg-green-600 hover:bg-green-700"
                    : "bg-blue-600 hover:bg-blue-700"
                } disabled:bg-gray-700 disabled:cursor-not-allowed text-white rounded-lg px-4 py-2 transition-colors`}
              >
                {saving
                  ? "Saving..."
                  : status === "resolved"
                  ? "Mark as Resolved"
                  : "Post Update"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
