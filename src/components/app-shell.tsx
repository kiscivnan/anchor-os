import Link from "next/link";
import type { ReactNode } from "react";

import { BottomNav } from "@/components/bottom-nav";

interface AppShellProps {
  children: ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="mx-auto min-h-dvh w-full max-w-md bg-white shadow-sm">
      <header className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
        <p className="text-sm font-semibold tracking-wide text-slate-900">
          锚点 OS
        </p>
        <Link
          href="/settings"
          className="text-xs text-slate-400 hover:text-slate-700"
          aria-label="设置"
        >
          设置
        </Link>
      </header>
      <main className="px-5 py-6 pb-24">{children}</main>
      <BottomNav />
    </div>
  );
}
