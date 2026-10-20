'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Code2,
  Compass,
  CalendarDays,
  Settings,
  X,
  Layers,
} from 'lucide-react';
import { useWorkspace } from '@/context/WorkspaceContext';

interface SidebarProps {
  mobileOpen: boolean;
  onMobileClose: () => void;
}

interface NavItem {
  name: string;
  href: string;
  icon: typeof LayoutDashboard;
  badge?: string;
}

const NAV_ITEMS: NavItem[] = [
  {
    name: 'Dashboard',
    href: '/',
    icon: LayoutDashboard,
  },
  {
    name: 'Problems',
    href: '/problems',
    icon: Code2,
  },
  {
    name: 'Topicverse',
    href: '/topicverse',
    icon: Compass,
  },
  {
    name: 'Revision Calendar',
    href: '/calendar',
    icon: CalendarDays,
  },
  {
    name: 'Settings',
    href: '/settings',
    icon: Settings,
  },
];

export const Sidebar: React.FC<SidebarProps> = ({
  mobileOpen,
  onMobileClose,
}) => {
  const pathname = usePathname();
  const { leetCodeConnection } = useWorkspace();
  const isConnected = Boolean(leetCodeConnection?.isConnected);

  return (

    <>
      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs md:hidden"
          onClick={onMobileClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 flex flex-col w-60 bg-[#111114] border-r border-[#22222a] transition-transform duration-200 ease-in-out md:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand / Logo */}
        <div className="flex items-center justify-between h-14 px-4 border-b border-[#202027]">
          <Link
            href="/"
            className="flex items-center gap-2.5 group focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-violet-500/60 rounded px-1"
          >
            <div className="flex items-center justify-center w-7 h-7 rounded-md bg-[#191922] border border-[#2b2b38] group-hover:border-violet-500/40 transition-colors">
              <Layers size={15} className="text-violet-400" />
            </div>
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-sm tracking-tight text-zinc-100">
                LeetTrack
              </span>
              <span className="text-[10px] font-mono font-medium px-1.5 py-0.2 rounded bg-[#1e1e26] text-zinc-400 border border-[#2a2a35]">
                dev
              </span>
            </div>
          </Link>

          <button
            type="button"
            onClick={onMobileClose}
            className="p-1 rounded-md text-zinc-400 hover:text-zinc-200 md:hidden focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-violet-500/60"
            aria-label="Close sidebar"
          >
            <X size={16} />
          </button>
        </div>

        {/* Navigation list */}
        <div className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          <div className="px-2 pb-2 text-[10px] font-medium uppercase tracking-wider text-zinc-500 font-mono">
            Navigation
          </div>
          {NAV_ITEMS.map((item) => {
            const isActive =
              item.href === '/'
                ? pathname === '/'
                : pathname.startsWith(item.href);
            const Icon = item.icon;

            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={onMobileClose}
                className={`flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors group ${
                  isActive
                    ? 'bg-[#1e1e26] text-zinc-100 border border-[#2d2d3c]'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-[#16161b]'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon
                    size={15}
                    className={
                      isActive
                        ? 'text-violet-400'
                        : 'text-zinc-500 group-hover:text-zinc-300'
                    }
                  />
                  <span>{item.name}</span>
                </div>

                {item.badge && (
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-violet-500/10 text-violet-300 border border-violet-500/20">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </div>

        {/* Footer info in sidebar */}
        <div className="p-3 border-t border-[#202027] bg-[#0e0e11]/50 text-xs">
          <div className="flex items-center justify-between px-2 py-1.5 rounded bg-[#16161c] border border-[#24242e]">
            {isConnected ? (
              <>
                <div className="flex items-center gap-2 truncate">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                  <span className="text-[11px] text-zinc-300 font-medium truncate">
                    @{leetCodeConnection?.username}
                  </span>
                </div>
                <span className="text-[10px] font-mono text-zinc-500">LC</span>
              </>
            ) : (
              <>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500/80" />
                  <span className="text-[11px] text-zinc-300 font-medium">Local Mode</span>
                </div>
                <span className="text-[10px] font-mono text-zinc-500">v0.1.0</span>
              </>
            )}
          </div>
        </div>
      </aside>

    </>
  );
};
