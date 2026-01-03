"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  TeamMember,
  TeamMemberLimitResult,
  canInviteTeamMember,
  getTeamMembers,
  inviteTeamMember,
  removeTeamMember,
  getTeamInvitations,
  acceptTeamInvitation,
} from "@/lib/checks";
import { PLANS, PlanType } from "@/lib/plans";
import { useConfirm } from "@/components/ConfirmDialog";

interface TeamManagerProps {
  userId: string;
  userEmail: string;
  userPlan: PlanType;
}

export function TeamManager({ userId, userEmail, userPlan }: TeamManagerProps) {
  const { confirm, ConfirmDialog } = useConfirm();
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [invitations, setInvitations] = useState<TeamMember[]>([]);
  const [planUsage, setPlanUsage] = useState<TeamMemberLimitResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"viewer" | "editor">("viewer");
  const [inviting, setInviting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const planLimits = PLANS[userPlan];
  const isProPlan = planLimits.teamMembers > 0;

  useEffect(() => {
    loadData();
  }, [userId, userEmail]);

  const loadData = async () => {
    try {
      const [teamMembers, usage, pendingInvites] = await Promise.all([
        getTeamMembers(userId),
        canInviteTeamMember(userId),
        getTeamInvitations(userEmail),
      ]);
      setMembers(teamMembers);
      setPlanUsage(usage);
      setInvitations(pendingInvites);
    } catch (err) {
      console.error("Failed to load team data:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;

    setInviting(true);
    setError(null);
    setSuccess(null);

    try {
      await inviteTeamMember(userId, inviteEmail.trim(), inviteRole);
      setSuccess(`Invitation sent to ${inviteEmail}`);
      setInviteEmail("");
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send invitation");
    } finally {
      setInviting(false);
    }
  };

  const handleRemove = async (memberId: string) => {
    const confirmed = await confirm({
      title: "Remove Team Member",
      message: "Are you sure you want to remove this team member? They will lose access to your checks.",
      confirmText: "Remove",
      cancelText: "Cancel",
      variant: "danger",
    });
    if (!confirmed) return;

    try {
      await removeTeamMember(memberId);
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to remove member");
    }
  };

  const handleAcceptInvite = async (invitationId: string) => {
    try {
      await acceptTeamInvitation(invitationId, userId);
      setSuccess("You've joined the team!");
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to accept invitation");
    }
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-900 rounded-lg p-6 border border-gray-200 dark:border-gray-800">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 dark:bg-gray-800 rounded w-1/3 mb-4"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-2/3"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-900 rounded-lg p-6 border border-gray-200 dark:border-gray-800">
      <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4 flex items-center gap-2">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
        Team Members
        {isProPlan && planUsage && (
          <span className="text-sm text-gray-500 dark:text-gray-500 font-normal ml-auto">
            {planUsage.current} / {planUsage.limit} members
          </span>
        )}
      </h2>

      {!isProPlan ? (
        <div className="bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <p className="text-gray-600 dark:text-gray-400 mb-2">
            Team members are available on the Pro plan. Invite up to 3 team members to collaborate on your monitoring.
          </p>
          <Link href="/pricing" className="text-blue-400 hover:text-blue-300 text-sm">
            Upgrade to Pro
          </Link>
        </div>
      ) : (
        <>
          {/* Pending Invitations (for this user) */}
          {invitations.length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-3">Pending Invitations</h3>
              <div className="space-y-2">
                {invitations.map((invite) => (
                  <div
                    key={invite.id}
                    className="flex items-center justify-between bg-blue-500/10 border border-blue-500/20 rounded-lg p-3"
                  >
                    <div>
                      <p className="text-gray-900 dark:text-white text-sm">You've been invited as {invite.role}</p>
                      <p className="text-gray-600 dark:text-gray-400 text-xs">
                        Invited {new Date(invite.invitedAt.seconds * 1000).toLocaleDateString()}
                      </p>
                    </div>
                    <button
                      onClick={() => handleAcceptInvite(invite.id)}
                      className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
                    >
                      Accept
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Invite Form */}
          {planUsage?.allowed && (
            <form onSubmit={handleInvite} className="mb-6">
              <div className="flex gap-2">
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="Email address"
                  className="flex-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg px-4 py-2 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as "viewer" | "editor")}
                  className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="viewer">Viewer</option>
                  <option value="editor">Editor</option>
                </select>
                <button
                  type="submit"
                  disabled={inviting || !inviteEmail.trim()}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {inviting ? "..." : "Invite"}
                </button>
              </div>
              <p className="text-gray-500 dark:text-gray-500 text-xs mt-2">
                Viewers can see checks and status. Editors can also modify checks.
              </p>
            </form>
          )}

          {/* Error/Success Messages */}
          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
              {error}
            </div>
          )}
          {success && (
            <div className="mb-4 p-3 bg-green-500/10 border border-green-500/20 rounded-lg text-green-400 text-sm">
              {success}
            </div>
          )}

          {/* Team Members List */}
          {members.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-500 text-sm">No team members yet. Invite someone to collaborate!</p>
          ) : (
            <div className="space-y-2">
              {members.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between bg-gray-50 dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center">
                      <span className="text-gray-600 dark:text-gray-400 text-sm font-medium">
                        {member.memberEmail.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="text-gray-900 dark:text-white text-sm">{member.memberEmail}</p>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs px-1.5 py-0.5 rounded ${
                          member.status === "accepted"
                            ? "bg-green-500/20 text-green-400"
                            : "bg-yellow-500/20 text-yellow-400"
                        }`}>
                          {member.status === "accepted" ? "Active" : "Pending"}
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-500 capitalize">{member.role}</span>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => handleRemove(member.id)}
                    className="text-gray-500 hover:text-red-400 dark:text-gray-400 dark:hover:text-red-400 p-1"
                    title="Remove member"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Limit reached */}
          {planUsage && !planUsage.allowed && (
            <div className="mt-4 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg text-yellow-400 text-sm">
              {planUsage.reason}
            </div>
          )}
        </>
      )}

      {ConfirmDialog}
    </div>
  );
}
