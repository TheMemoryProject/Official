import React from 'react';
import { Sidebar } from '@/components/layout/sidebar';
import { TopNavClient } from './top-nav-client';
import { getSession } from '@/lib/auth/session';
import { CommandPalette } from '@/components/layout/command-palette';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  return (
    <div className="min-h-screen bg-background flex">
      {/* Universal Command Palette (Ctrl + K) */}
      <CommandPalette />

      {/* Sidebar */}
      <Sidebar userRole={session?.role || 'ENGINEER'} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <TopNavClient user={session} />
        <main className="flex-1 p-6 md:p-8 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
