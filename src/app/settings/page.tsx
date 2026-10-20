'use client';

import React, { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/Button';
import { LeetCodeSection } from '@/components/settings/LeetCodeSection';
import { useWorkspace } from '@/context/WorkspaceContext';
import { Sliders, HardDrive, Check, Download } from 'lucide-react';

export default function SettingsPage() {
  const { problems, revisions } = useWorkspace();
  const [downloaded, setDownloaded] = useState(false);
  const [intervalOption, setIntervalOption] = useState('standard');

  const handleExportData = () => {
    const payload = {
      appName: 'LeetTrack',
      exportedAt: new Date().toISOString(),
      problems,
      revisions,
    };

    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(payload, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `leettrack-backup-${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();

    setDownloaded(true);
    setTimeout(() => setDownloaded(false), 2500);
  };

  return (
    <AppLayout title="Settings">
      <div className="space-y-6 max-w-3xl">
        {/* Header */}
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-zinc-100">
            Settings & Preferences
          </h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            Connect your LeetCode account, configure spaced repetition intervals, and manage local storage.
          </p>
        </div>

        {/* Section 1: LeetCode Account Integration */}
        <LeetCodeSection />

        {/* Section 2: Spaced Repetition */}
        <div className="p-4 rounded-md border border-[#23232b] bg-[#141418] space-y-4">

          <div className="flex items-center gap-2 pb-3 border-b border-[#202027]">
            <Sliders size={15} className="text-violet-400" />
            <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-200">
              Revision Intervals
            </h3>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <p className="font-medium text-zinc-200">Interval Progression</p>
                <p className="text-zinc-500 text-[11px]">
                  Default spaced repetition sequence for newly logged problems.
                </p>
              </div>

              <select
                value={intervalOption}
                onChange={(e) => setIntervalOption(e.target.value)}
                className="px-2.5 py-1.5 rounded-md bg-[#191921] border border-[#2c2c38] text-zinc-200 text-xs focus-visible:border-violet-500/60 focus-visible:outline-none"
              >
                <option value="standard">Standard (1d, 3d, 7d, 14d, 30d)</option>
                <option value="aggressive">Aggressive (12h, 1d, 2d, 4d, 8d)</option>
                <option value="relaxed">Relaxed (2d, 5d, 10d, 21d, 45d)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Section 2: Data & Workspace */}
        <div className="p-4 rounded-md border border-[#23232b] bg-[#141418] space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-[#202027]">
            <HardDrive size={15} className="text-zinc-400" />
            <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-200">
              Data Management
            </h3>
          </div>

          <div className="space-y-4 text-xs">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-zinc-200">Export Workspace Data</p>
                <p className="text-zinc-500 text-[11px]" suppressHydrationWarning>
                  Download a JSON snapshot of your logged problems ({problems.length}) and scheduled revisions ({revisions.length}).
                </p>
              </div>

              <Button
                variant="secondary"
                size="sm"
                icon={downloaded ? <Check size={13} className="text-emerald-400" /> : <Download size={13} />}
                onClick={handleExportData}
              >
                {downloaded ? 'Downloaded' : 'Export JSON'}
              </Button>
            </div>

            <div className="pt-3 border-t border-[#1f1f26] flex items-center justify-between">
              <div>
                <p className="font-medium text-zinc-200">Local Storage Mode</p>
                <p className="text-zinc-500 text-[11px]">
                  All user records survive browser refreshes and are isolated from demo data.
                </p>
              </div>

              <span className="text-[11px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                Persistent (localStorage)
              </span>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
