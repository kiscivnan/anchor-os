"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/anchor", label: "今日" },
  { href: "/spark", label: "念头" },
  { href: "/tracks", label: "分配" },
  { href: "/review", label: "复盘" },
  { href: "/ntrack", label: "N 轨" },
] as const;

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="主要导航"
      className="fixed bottom-0 left-1/2 z-10 grid w-full max-w-md -translate-x-1/2 grid-cols-5 border-t border-slate-200 bg-white/95 px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2 backdrop-blur"
    >
      {navItems.map((item) => {
        const isActive = pathname === item.href;

        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={isActive ? "page" : undefined}
            className={`rounded-xl px-2 py-2 text-center text-sm transition-colors ${
              isActive
                ? "bg-slate-900 font-medium text-white"
                : "text-slate-500 hover:bg-slate-100 hover:text-slate-900"
            }`}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
