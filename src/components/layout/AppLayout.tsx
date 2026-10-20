'use client';

import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

interface AppLayoutProps {
  children: React.ReactNode;
  title?: string;
  onQuickAdd?: () => void;
}

export const AppLayout: React.FC<AppLayoutProps> = ({
  children,
  title,
  onQuickAdd,
}) => {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#0e0e11] text-[#ededf0] flex">
      {/* Sidebar (Desktop persistent + Mobile slide-over) */}
      <Sidebar
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col md:pl-60 min-w-0">
        <Header
          title={title}
          onMobileMenuClick={() => setMobileOpen(true)}
          onQuickAdd={onQuickAdd}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-6xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
};
