
"use client";

import React from 'react';
import { TallyHeader } from './tally-header';
import { TallyLeftPanel } from './tally-sidebar';

export function TallyLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="tally-theme bg-tally-bg text-tally-fg min-h-screen font-sans text-sm antialiased">
      <TallyHeader />
      <div className="flex h-[calc(100vh-2rem)]">
        <TallyLeftPanel />
        <main className="flex-1 p-0.5 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
