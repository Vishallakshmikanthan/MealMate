"use client";

import { usePathname } from "next/navigation";
import Sidebar from "./Sidebar";
import BottomNav from "./BottomNav";

const SHELL_EXCLUDED_PREFIXES = ["/onboarding"];

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const excludeShell = SHELL_EXCLUDED_PREFIXES.some((prefix) =>
    pathname.startsWith(prefix)
  );

  if (excludeShell) return <>{children}</>;

  return (
    <div className="flex min-h-screen bg-background">
      {/* Fixed desktop sidebar */}
      <aside className="hidden md:flex md:flex-col md:w-60 md:fixed md:inset-y-0 md:left-0 z-30 border-r border-slate-100">
        <Sidebar />
      </aside>

      {/* Scrollable content area */}
      <div className="flex-1 flex flex-col md:ml-60 min-w-0">
        {/* Mobile top header */}
        <header className="md:hidden sticky top-0 z-20 bg-white/80 backdrop-blur-md border-b border-slate-100 px-4 h-14 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-primary-500 flex items-center justify-center">
              <span className="text-white text-xs font-extrabold">M</span>
            </div>
            <span className="font-bold text-slate-900 tracking-tight">
              Meal<span className="text-primary-500">Ops</span>
            </span>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto pb-20 md:pb-0">
          {children}
        </main>
      </div>

      {/* Fixed mobile bottom nav */}
      <div className="md:hidden fixed bottom-0 inset-x-0 z-30">
        <BottomNav />
      </div>
    </div>
  );
}
