'use client';

import React, { useState } from 'react';
import { useWorkspace } from '@/context/WorkspaceContext';
import { Button } from '@/components/ui/Button';
import { formatSyncTimestamp, formatRelativeTime } from '@/lib/storage';
import {
  RefreshCw,
  AlertCircle,
  ExternalLink,
  Unlink,
  Info,
  Flame,
  Trophy,
  ShieldCheck,
  Check,
  X,
} from 'lucide-react';


export const LeetCodeSection: React.FC = () => {
  const {
    leetCodeConnection,
    isSyncingLeetCode,
    syncLeetCodeAccount,
    disconnectLeetCodeAccount,
  } = useWorkspace();

  const [inputUsername, setInputUsername] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showConfirmDisconnect, setShowConfirmDisconnect] = useState(false);

  const isConnected = Boolean(leetCodeConnection?.isConnected);
  const profile = leetCodeConnection?.profile;
  const summary = leetCodeConnection?.lastSyncSummary;

  const handleSync = async (usernameToSync?: string) => {
    const target = usernameToSync || (isConnected ? leetCodeConnection?.username : inputUsername);
    if (!target || !target.trim()) {
      setErrorMessage('Please enter your LeetCode username.');
      return;
    }

    setErrorMessage(null);
    setSuccessMessage(null);

    const result = await syncLeetCodeAccount(target.trim());

    if (!result.success) {
      setErrorMessage(result.error || 'Failed to sync with LeetCode. Please try again.');
    } else if (result.summary) {
      setInputUsername('');
      if (result.summary.importedCount > 0) {
        setSuccessMessage(
          `Successfully imported ${result.summary.importedCount} new problem${
            result.summary.importedCount === 1 ? '' : 's'
          } to your workspace! (${result.summary.alreadyExistingCount} already tracked, 0 duplicates created)`
        );
      } else {
        setSuccessMessage(
          `Sync complete: All ${result.summary.alreadyExistingCount} confirmed problems are already up to date in your workspace. 0 duplicates created.`
        );
      }
    }
  };

  const handleDisconnect = () => {
    disconnectLeetCodeAccount();
    setShowConfirmDisconnect(false);
    setSuccessMessage('LeetCode account disconnected. Your imported problems remain safely in your workspace.');
    setErrorMessage(null);
  };

  return (
    <div className="p-4 sm:p-5 rounded-md border border-[#23232b] bg-[#141418] space-y-5">
      {/* Header & Status Indicator */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3.5 border-b border-[#202027] gap-2">
        <div className="flex items-center gap-2.5">
          <div className="flex items-center justify-center w-7 h-7 rounded-md bg-[#ffa116]/10 border border-[#ffa116]/20 text-[#ffa116]">
            {/* LeetCode Icon Representation */}
            <svg
              className="w-4 h-4 fill-current"
              viewBox="0 0 24 24"
              role="img"
              aria-label="LeetCode"
            >
              <path d="M16.102 17.93l-2.697 2.607c-.466.467-1.111.662-1.823.662s-1.357-.195-1.824-.662l-4.332-4.363c-.467-.467-.702-1.15-.702-1.863s.235-1.357.702-1.824l4.319-4.38c.467-.467 1.125-.645 1.837-.645s1.357.195 1.823.662l2.697 2.606c.514.515 1.365.497 1.9-.038.535-.536.553-1.387.039-1.901l-2.609-2.636a5.074 5.074 0 0 0-3.69-1.428c-1.455 0-2.846.57-3.87 1.593L3.58 12.06c-1.024 1.024-1.58 2.401-1.58 3.844 0 1.442.556 2.82 1.58 3.843l4.332 4.364c1.024 1.024 2.415 1.603 3.87 1.603s2.846-.579 3.87-1.603l2.609-2.636c.514-.514.496-1.365-.039-1.9-.535-.536-1.386-.554-1.9-.039z" />
              <path d="M10.802 3.54a1.35 1.35 0 0 0-1.901-.039 1.35 1.35 0 0 0-.039 1.9l4.57 4.545a1.35 1.35 0 0 0 1.901.039 1.35 1.35 0 0 0 .039-1.9L10.802 3.54z" />
            </svg>
          </div>

          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-200">
              LeetCode Integration
            </h3>
            <p className="text-zinc-500 text-[11px] mt-0.5">
              Connect your public handle to import verified solutions and track spaced reviews.
            </p>
          </div>
        </div>

        {/* Connection Status Badge */}
        <div className="flex items-center gap-2">
          {leetCodeConnection && leetCodeConnection.isConnected ? (
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>Connected as @{leetCodeConnection.username}</span>
            </div>
          ) : (
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-zinc-800 border border-zinc-700 text-zinc-400">
              <span className="w-1.5 h-1.5 rounded-full bg-zinc-500" />
              <span>Not Connected</span>
            </div>
          )}
        </div>

      </div>

      {/* Success Notification */}
      {successMessage && (
        <div className="flex items-start justify-between gap-2 p-3 rounded-md bg-emerald-950/30 border border-emerald-500/30 text-emerald-300 text-xs animate-in fade-in duration-200">
          <div className="flex items-start gap-2">
            <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <p className="leading-relaxed">{successMessage}</p>
          </div>
          <button
            type="button"
            onClick={() => setSuccessMessage(null)}
            className="text-zinc-400 hover:text-zinc-200 p-0.5 rounded"
            aria-label="Dismiss message"
          >
            <X size={13} />
          </button>
        </div>
      )}

      {/* Error Notification */}
      {errorMessage && (
        <div className="flex items-start justify-between gap-2 p-3 rounded-md bg-rose-950/30 border border-rose-500/30 text-rose-300 text-xs animate-in fade-in duration-200">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <p className="leading-relaxed">{errorMessage}</p>
          </div>
          <button
            type="button"
            onClick={() => setErrorMessage(null)}
            className="text-zinc-400 hover:text-zinc-200 p-0.5 rounded"
            aria-label="Dismiss error"
          >
            <X size={13} />
          </button>
        </div>
      )}

      {/* Main Connection Interaction */}
      {!leetCodeConnection || !leetCodeConnection.isConnected ? (
        /* Not Connected View: Username input + Connect button */
        <div className="space-y-3">

          <label htmlFor="leetcode-username-input" className="block text-xs font-medium text-zinc-300">
            LeetCode Username
          </label>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
            <div className="relative flex-1">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-500 text-xs font-mono">
                @
              </span>
              <input
                id="leetcode-username-input"
                type="text"
                value={inputUsername}
                onChange={(e) => setInputUsername(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleSync();
                  }
                }}
                disabled={isSyncingLeetCode}
                placeholder="e.g. harsha, tourist, or your_handle"
                className="w-full pl-7 pr-3 py-1.5 rounded-md bg-[#191921] border border-[#2c2c38] text-zinc-100 text-xs placeholder:text-zinc-600 focus-visible:border-violet-500/60 focus-visible:outline-none disabled:opacity-50"
              />
            </div>

            <Button
              variant="primary"
              size="sm"
              disabled={isSyncingLeetCode || !inputUsername.trim()}
              icon={
                isSyncingLeetCode ? (
                  <RefreshCw size={13} className="animate-spin" />
                ) : (
                  <RefreshCw size={13} />
                )
              }
              onClick={() => handleSync()}
            >
              {isSyncingLeetCode ? 'Connecting...' : 'Connect & Import'}
            </Button>
          </div>

          <div className="flex items-center gap-1.5 text-[11px] text-zinc-500 pt-1">
            <ShieldCheck size={13} className="text-emerald-400/80 shrink-0" />
            <span>
              Zero credentials required. Only public profile statistics and recent accepted submissions are queried.
            </span>
          </div>
        </div>
      ) : (
        /* Connected View: Profile Details + Sync Actions */
        <div className="space-y-4">
          {/* Profile Card */}
          <div className="p-3.5 rounded-md bg-[#181820] border border-[#272733] flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              {profile?.userAvatar ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={profile.userAvatar}
                  alt={profile.username}
                  className="w-10 h-10 rounded-full border border-zinc-700 object-cover bg-zinc-800"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-violet-600/20 border border-violet-500/30 flex items-center justify-center text-violet-300 font-semibold text-sm">
                  {leetCodeConnection.username.charAt(0).toUpperCase()}
                </div>
              )}

              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-zinc-100">
                    {profile?.realName || leetCodeConnection.username}
                  </span>
                  <a
                    href={`https://leetcode.com/u/${leetCodeConnection.username}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] text-violet-400 hover:text-violet-300 transition-colors font-mono"
                    title="View public LeetCode profile"
                  >
                    <span>@{leetCodeConnection.username}</span>
                    <ExternalLink size={11} />
                  </a>
                </div>

                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-[11px] text-zinc-400">
                  {profile?.ranking && (
                    <span className="inline-flex items-center gap-1 text-zinc-300">
                      <Trophy size={11} className="text-amber-400" />
                      Rank <span className="font-mono">#{profile.ranking.toLocaleString()}</span>
                    </span>
                  )}
                  {profile?.streak !== undefined && profile.streak > 0 && (
                    <span className="inline-flex items-center gap-1 text-zinc-300">
                      <Flame size={11} className="text-orange-400" />
                      {profile.streak} day streak
                    </span>
                  )}
                  {profile?.totalActiveDays !== undefined && (
                    <span className="text-zinc-500 font-mono">
                      {profile.totalActiveDays} active days
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Profile Statistics Chips */}
            {profile?.solvedStats && (
              <div className="flex items-center gap-2 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-[#252530]">
                <div className="px-2.5 py-1 rounded bg-[#131317] border border-[#23232b] text-center">
                  <div className="text-[10px] text-zinc-500 uppercase tracking-wider font-mono">Solved</div>
                  <div className="text-xs font-semibold font-mono text-zinc-200">
                    {profile.solvedStats.all}
                  </div>
                </div>
                <div className="px-2 py-1 rounded bg-[#131317] border border-emerald-500/20 text-center">
                  <div className="text-[10px] text-emerald-400/80 uppercase tracking-wider font-mono">Easy</div>
                  <div className="text-xs font-semibold font-mono text-emerald-400">
                    {profile.solvedStats.easy}
                  </div>
                </div>
                <div className="px-2 py-1 rounded bg-[#131317] border border-amber-500/20 text-center">
                  <div className="text-[10px] text-amber-400/80 uppercase tracking-wider font-mono">Med</div>
                  <div className="text-xs font-semibold font-mono text-amber-400">
                    {profile.solvedStats.medium}
                  </div>
                </div>
                <div className="px-2 py-1 rounded bg-[#131317] border border-rose-500/20 text-center">
                  <div className="text-[10px] text-rose-400/80 uppercase tracking-wider font-mono">Hard</div>
                  <div className="text-xs font-semibold font-mono text-rose-400">
                    {profile.solvedStats.hard}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Sync Status & Action Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
            <div className="text-xs text-zinc-400">
              <span className="font-medium text-zinc-300">Last successful sync: </span>
              <span className="font-mono text-zinc-400">
                {formatSyncTimestamp(leetCodeConnection.lastSyncTime)}
              </span>
              {leetCodeConnection.lastSyncTime && (
                <span className="text-zinc-500 text-[11px] ml-1.5">
                  ({formatRelativeTime(leetCodeConnection.lastSyncTime)})
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                disabled={isSyncingLeetCode}
                icon={
                  isSyncingLeetCode ? (
                    <RefreshCw size={13} className="animate-spin text-violet-400" />
                  ) : (
                    <RefreshCw size={13} />
                  )
                }
                onClick={() => handleSync()}
              >
                {isSyncingLeetCode ? 'Syncing...' : 'Sync Now'}
              </Button>

              {!showConfirmDisconnect ? (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-zinc-500 hover:text-rose-400"
                  icon={<Unlink size={13} />}
                  onClick={() => setShowConfirmDisconnect(true)}
                >
                  Disconnect
                </Button>
              ) : (
                <div className="flex items-center gap-1.5 p-1 bg-rose-500/10 border border-rose-500/20 rounded-md">
                  <span className="text-[11px] text-rose-300 px-1">Confirm unlink?</span>
                  <button
                    type="button"
                    onClick={handleDisconnect}
                    className="px-2 py-0.5 text-[11px] rounded bg-rose-600 hover:bg-rose-500 text-white font-medium transition-colors"
                  >
                    Yes
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowConfirmDisconnect(false)}
                    className="px-1.5 py-0.5 text-[11px] text-zinc-400 hover:text-zinc-200"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Sync Breakdown & Public API Scope Explanation */}
      {summary && (
        <div className="pt-3 border-t border-[#202027] space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400 font-mono">
              Synchronization Breakdown
            </h4>
            <span className="text-[10px] text-zinc-500 font-mono">
              Safe & repeatable (0 duplicates)
            </span>
          </div>

          {/* Metric Cards Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
            <div className="p-2.5 rounded bg-[#101014] border border-[#22222a]">
              <span className="text-zinc-500 text-[10px] block uppercase font-mono">Profile Total</span>
              <span className="text-sm font-semibold font-mono text-zinc-200">
                {summary.totalOnProfile}
              </span>
              <span className="text-[10px] text-zinc-500 block mt-0.5">Reported on profile</span>
            </div>

            <div className="p-2.5 rounded bg-[#101014] border border-violet-500/20">
              <span className="text-violet-400/80 text-[10px] block uppercase font-mono">Confirmed Public</span>
              <span className="text-sm font-semibold font-mono text-violet-300">
                {summary.retrievedCount}
              </span>
              <span className="text-[10px] text-zinc-500 block mt-0.5">Verified public items</span>
            </div>

            <div className="p-2.5 rounded bg-[#101014] border border-emerald-500/20">
              <span className="text-emerald-400/80 text-[10px] block uppercase font-mono">Newly Added</span>
              <span className="text-sm font-semibold font-mono text-emerald-300">
                +{summary.importedCount}
              </span>
              <span className="text-[10px] text-zinc-500 block mt-0.5">Added to workspace</span>
            </div>

            <div className="p-2.5 rounded bg-[#101014] border border-[#22222a]">
              <span className="text-zinc-400 text-[10px] block uppercase font-mono">Already Tracked</span>
              <span className="text-sm font-semibold font-mono text-zinc-300">
                {summary.alreadyExistingCount}
              </span>
              <span className="text-[10px] text-zinc-500 block mt-0.5">Preserved untouched</span>
            </div>
          </div>

          {/* Transparent API Scope Limitation Alert */}
          {summary.unretrievableCount > 0 && (
            <div className="p-3 rounded-md bg-[#131318] border border-[#23232e] text-[11px] text-zinc-400 space-y-1.5 leading-relaxed">
              <div className="flex items-center gap-1.5 text-zinc-300 font-medium">
                <Info size={13} className="text-violet-400 shrink-0" />
                <span>LeetCode Public API Transparency Note</span>
              </div>
              <p>
                Your LeetCode profile indicates <span className="font-mono text-zinc-200">{summary.totalOnProfile}</span> total solved problems.
                LeetCode&apos;s public GraphQL service allows unauthenticated access only to recent accepted submissions (~20–50 items).
                The remaining <span className="font-mono text-zinc-300">{summary.unretrievableCount}</span> older solutions reside in private session history,
                which LeetTrack does not guess or fabricate to maintain complete data integrity.
              </p>
              <p className="text-zinc-500 text-[10px]">
                You can manually add any older problems using &ldquo;Log problem&rdquo; anytime. Existing revision schedules and personal notes are never modified.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
