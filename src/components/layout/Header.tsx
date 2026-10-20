'use client';

import React from 'react';
import { Menu, Search, Plus } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface HeaderProps {
  title?: string;
  onMobileMenuClick: () => void;
  onQuickAdd?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  title = 'Your workspace',
  onMobileMenuClick,
  onQuickAdd,
}) => {
  return (
    <header className="sticky top-0 z-30 flex items-center justify-between h-14 px-4 sm:px-6 bg-[#0e0e11]/90 backdrop-blur-md border-b border-[#202027]">
      {/* Left side: Hamburger (mobile) + Title */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onMobileMenuClick}
          className="p-1.5 rounded-md text-zinc-400 hover:text-zinc-200 md:hidden hover:bg-[#181820] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-violet-500/60"
          aria-label="Open sidebar menu"
        >
          <Menu size={18} />
        </button>

        <div className="flex items-center gap-2">
          <h1 className="text-sm font-semibold text-zinc-100 tracking-tight">
            {title}
          </h1>
        </div>
      </div>

      {/* Right side: Search shortcut & quick action */}
      <div className="flex items-center gap-2.5">
        <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded-md bg-[#141419] border border-[#24242e] text-zinc-400 text-xs">
          <Search size={13} className="text-zinc-500" />
          <span className="text-zinc-500">Quick find...</span>
          <kbd className="font-mono text-[10px] text-zinc-500 bg-[#1e1e26] border border-[#2d2d38] rounded px-1.5 py-0.2 ml-2">
            ⌘K
          </kbd>
        </div>

        {onQuickAdd && (
          <Button
            variant="primary"
            size="sm"
            icon={<Plus size={13} strokeWidth={2.2} />}
            onClick={onQuickAdd}
          >
            Log problem
          </Button>
        )}
      </div>
    </header>
  );
};
