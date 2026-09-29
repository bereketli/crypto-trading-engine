"use client";

import Link from "next/link";
import { useAuth } from "@/lib/auth-context";

function initials(name: string) {
  return name.slice(0, 1).toUpperCase();
}

export function Topbar({ onMenu }: { onMenu: () => void }) {
  const { user } = useAuth();
  if (!user) return null;

  return (
    <header className="flex items-center gap-4 border-b border-border bg-bg/80 px-4 py-3.5 backdrop-blur lg:px-6">
      <button
        onClick={onMenu}
        aria-label="Open navigation"
        className="rounded-lg p-2 text-content-dim hover:bg-surface-2 hover:text-content lg:hidden"
      >
        <svg viewBox="0 0 20 20" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M3 5.5h14M3 10h14M3 14.5h14" strokeLinecap="round" />
        </svg>
      </button>

      <Link href="/settings" className="flex shrink-0 items-center gap-3">
        <span className="grid size-10 place-items-center rounded-full bg-accent-soft text-sm font-bold text-accent ring-1 ring-accent/20">
          {initials(user.username)}
        </span>
        <span className="hidden flex-col leading-tight sm:flex">
          <span className="flex items-center gap-2">
            <span className="text-sm font-semibold">@{user.username}</span>
            {user.role === "admin" && (
              <span className="rounded bg-accent px-1.5 py-px text-[9px] font-bold tracking-wide text-accent-ink">
                ADMIN
              </span>
            )}
            {user.kyc_status === "verified" && user.role !== "admin" && (
              <span className="rounded bg-accent/15 px-1.5 py-px text-[9px] font-bold tracking-wide text-accent">
                VERIFIED
              </span>
            )}
          </span>
          <span className="text-xs text-content-faint">{user.email}</span>
        </span>
      </Link>

      <div className="relative ml-auto hidden max-w-md flex-1 md:block">
        <svg
          viewBox="0 0 20 20"
          className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-content-faint"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
        >
          <circle cx="9" cy="9" r="5.5" />
          <path d="M13.5 13.5L17 17" strokeLinecap="round" />
        </svg>
        <input
          placeholder="Search anything here..."
          aria-label="Search"
          className="w-full rounded-xl border border-border bg-surface py-2.5 pl-10 pr-4 text-sm placeholder:text-content-faint focus:border-accent/40 focus:outline-none focus:ring-2 focus:ring-accent/20"
        />
      </div>

      <div className="ml-auto flex items-center gap-2 md:ml-0">
        <button
          aria-label="Messages"
          className="rounded-xl border border-border bg-surface p-2.5 text-content-dim transition-colors hover:text-content"
        >
          <svg viewBox="0 0 20 20" className="size-[18px]" fill="none" stroke="currentColor" strokeWidth="1.6">
            <rect x="2.5" y="4.5" width="15" height="11" rx="2" />
            <path d="M3 6l7 4.5L17 6" strokeLinecap="round" />
          </svg>
        </button>
        <button
          aria-label="Notifications"
          className="relative rounded-xl border border-border bg-surface p-2.5 text-content-dim transition-colors hover:text-content"
        >
          <svg viewBox="0 0 20 20" className="size-[18px]" fill="none" stroke="currentColor" strokeWidth="1.6">
            <path d="M5.5 8a4.5 4.5 0 119 0c0 3.5 1.5 4.5 1.5 4.5H4S5.5 11.5 5.5 8z" strokeLinejoin="round" />
            <path d="M8.5 15a1.8 1.8 0 003 0" strokeLinecap="round" />
          </svg>
          <span className="absolute right-2 top-2 size-1.5 rounded-full bg-accent" />
        </button>
        <Link
          href="/transactions"
          className="flex items-center gap-2 rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-accent-ink transition-colors hover:bg-accent-hover"
        >
          Deposit
          <svg viewBox="0 0 20 20" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.8">
            <rect x="2.5" y="5" width="15" height="10" rx="2" />
            <path d="M2.5 8.5h15" />
          </svg>
        </Link>
      </div>
    </header>
  );
}
