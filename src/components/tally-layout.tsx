
"use client";

import React from 'react';
import { TallyHeader } from './tally-header';
import { TallySidebar } from './tally-sidebar';

export function TallyLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="tally-theme bg-tally-bg text-tally-fg min-h-screen font-mono text-sm">
      <TallyHeader />
      <div className="flex h-[calc(100vh-2.5rem)]">
        <main className="flex-1 p-2 overflow-y-auto">
          {children}
        </main>
        <TallySidebar />
      </div>
    </div>
  );
}
