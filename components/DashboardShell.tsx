import type { ReactNode } from 'react';
import Sidebar from '@/components/Sidebar';

// Common shell shared between Order Analysis (/) and Performance Analysis
// (/performance): sidebar, background, and the max-width content wrapper.
// This is pure layout markup extracted from the existing page.tsx — it
// contains no Order Analysis business logic.
export default function DashboardShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-surface-sunken">
      <Sidebar />

      <main className="pl-16 md:pl-[320px] transition-[padding]">
        <div className="px-4 sm:px-6 py-6 space-y-8 max-w-[1400px] mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
