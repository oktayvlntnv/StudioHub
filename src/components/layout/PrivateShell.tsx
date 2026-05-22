"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import {
  Clapperboard,
  Home,
  MonitorPlay,
  Search,
  Settings,
  ShieldCheck,
  SlidersHorizontal,
  Tv,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/", label: "Home", icon: Home },
  { href: "/movies", label: "Movies", icon: Clapperboard },
  { href: "/tv-shows", label: "TV Shows", icon: MonitorPlay },
  { href: "/live-tv", label: "Live TV", icon: Tv },
  { href: "/search", label: "Search", icon: Search },
  { href: "/sources", label: "Sources", icon: SlidersHorizontal },
  { href: "/settings", label: "Settings", icon: Settings },
  { href: "/legal", label: "Legal", icon: ShieldCheck },
];

interface PrivateShellProps {
  children: ReactNode;
}

export function PrivateShell({ children }: PrivateShellProps) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-[#050709] text-slate-100">
      <aside className="fixed left-0 top-0 z-30 hidden h-screen w-72 border-r border-white/10 bg-[#080b10]/95 px-4 py-5 xl:block">
        <Link
          href="/"
          className="flex items-center gap-3 rounded-2xl px-3 py-3 outline-none transition focus-visible:ring-2 focus-visible:ring-teal-300"
        >
          <span className="grid size-11 place-items-center rounded-2xl bg-teal-300 text-slate-950">
            <MonitorPlay className="size-6" aria-hidden="true" />
          </span>
          <span>
            <span className="block text-lg font-bold text-white">StudioHub</span>
            <span className="text-xs font-semibold text-slate-400">Private</span>
          </span>
        </Link>

        <nav className="mt-8 space-y-2" aria-label="Primary">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
            return (
              <Link
                className={cn(
                  "flex min-h-12 items-center gap-3 rounded-2xl px-4 text-sm font-semibold text-slate-300 outline-none transition hover:bg-white/[0.07] hover:text-white focus-visible:ring-2 focus-visible:ring-teal-300",
                  isActive && "bg-white/[0.09] text-white",
                )}
                href={item.href}
                key={item.href}
              >
                <Icon className="size-5" aria-hidden="true" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="absolute bottom-5 left-4 right-4 rounded-2xl border border-teal-300/20 bg-teal-300/10 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-teal-100">
            Private mode
          </p>
          <p className="mt-2 text-sm leading-6 text-slate-300">
            Mock owner session. Public catalog and registration are intentionally
            absent.
          </p>
        </div>
      </aside>

      <header className="sticky top-0 z-20 border-b border-white/10 bg-[#050709]/90 px-4 py-3 backdrop-blur xl:ml-72">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3">
          <Link
            href="/"
            className="flex items-center gap-2 rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-teal-300 xl:hidden"
          >
            <span className="grid size-10 place-items-center rounded-xl bg-teal-300 text-slate-950">
              <MonitorPlay className="size-5" aria-hidden="true" />
            </span>
            <span className="font-bold text-white">StudioHub</span>
          </Link>
          <nav
            className="no-scrollbar flex flex-1 gap-2 overflow-x-auto xl:hidden"
            aria-label="Mobile primary"
          >
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive =
                item.href === "/"
                  ? pathname === "/"
                  : pathname.startsWith(item.href);
              return (
                <Link
                  aria-label={item.label}
                  className={cn(
                    "grid size-11 shrink-0 place-items-center rounded-xl border border-white/10 bg-white/[0.04] text-slate-300 outline-none transition focus-visible:ring-2 focus-visible:ring-teal-300",
                    isActive && "border-teal-300/40 bg-teal-300/15 text-teal-100",
                  )}
                  href={item.href}
                  key={item.href}
                  title={item.label}
                >
                  <Icon className="size-5" aria-hidden="true" />
                </Link>
              );
            })}
          </nav>
          <form action="/api/auth/sign-out" method="post">
            <button
              className="hidden min-h-10 items-center gap-3 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-semibold text-slate-300 outline-none transition hover:bg-white/[0.08] focus-visible:ring-2 focus-visible:ring-teal-300 sm:flex"
              type="submit"
            >
              <span className="size-2 rounded-full bg-emerald-300" />
              Sign out
            </button>
          </form>
        </div>
      </header>

      <main className="xl:ml-72">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          {children}
        </div>
      </main>
    </div>
  );
}
