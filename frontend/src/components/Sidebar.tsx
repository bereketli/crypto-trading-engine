"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Logo } from "./Logo";
import { useAuth } from "@/lib/auth-context";

type IconProps = { className?: string };

const Icons = {
  dashboard: (p: IconProps) => (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" {...p}>
      <rect x="2.5" y="2.5" width="6" height="6" rx="1.5" />
      <rect x="11.5" y="2.5" width="6" height="6" rx="1.5" />
      <rect x="2.5" y="11.5" width="6" height="6" rx="1.5" />
      <rect x="11.5" y="11.5" width="6" height="6" rx="1.5" />
    </svg>
  ),
  coins: (p: IconProps) => (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" {...p}>
      <circle cx="10" cy="10" r="7.5" />
      <path d="M10 6v8M7.8 8.2h3.4a1.8 1.8 0 010 3.6H7.8" strokeLinecap="round" />
    </svg>
  ),
  markets: (p: IconProps) => (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" {...p}>
      <path d="M2.5 13.5l4-4.5 3.5 3 5-6.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M13 5.5h2.5V8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  trading: (p: IconProps) => (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" {...p}>
      <rect x="2.5" y="3.5" width="15" height="11" rx="2" />
      <path d="M7 17.5h6M10 14.5v3" strokeLinecap="round" />
    </svg>
  ),
  transactions: (p: IconProps) => (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" {...p}>
      <rect x="2.5" y="4" width="15" height="12" rx="2" />
      <path d="M2.5 8.5h15" strokeLinecap="round" />
    </svg>
  ),
  users: (p: IconProps) => (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" {...p}>
      <circle cx="8" cy="7" r="3" />
      <path d="M2.5 16.5c0-3 2.5-4.5 5.5-4.5s5.5 1.5 5.5 4.5" strokeLinecap="round" />
      <path d="M14 4.5a2.8 2.8 0 010 5.4M15.5 16.5c0-2-.6-3.3-1.8-4.2" strokeLinecap="round" />
    </svg>
  ),
  settings: (p: IconProps) => (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" {...p}>
      <circle cx="10" cy="10" r="2.6" />
      <path d="M10 2.5v2M10 15.5v2M17.5 10h-2M4.5 10h-2M15.3 4.7l-1.4 1.4M6.1 13.9l-1.4 1.4M15.3 15.3l-1.4-1.4M6.1 6.1L4.7 4.7" strokeLinecap="round" />
    </svg>
  ),
  logout: (p: IconProps) => (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" {...p}>
      <path d="M12 6.5V4.5a1.5 1.5 0 00-1.5-1.5h-5A1.5 1.5 0 004 4.5v11A1.5 1.5 0 005.5 17h5a1.5 1.5 0 001.5-1.5v-2" strokeLinecap="round" />
      <path d="M8.5 10h8.5m0 0l-2.5-2.5M17 10l-2.5 2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
};

interface NavItem {
  href: string;
  label: string;
  icon: keyof typeof Icons;
  badge?: string;
  adminOnly?: boolean;
}

const NAV: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: "dashboard" },
  { href: "/portfolio", label: "My Coins", icon: "coins" },
  { href: "/markets", label: "Markets", icon: "markets" },
  { href: "/trading", label: "Trading", icon: "trading" },
  { href: "/transactions", label: "Transactions", icon: "transactions" },
  { href: "/admin/users", label: "Users", icon: "users", adminOnly: true },
  { href: "/settings", label: "Settings", icon: "settings" },
];

export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();

  const items = NAV.filter((item) => !item.adminOnly || user?.role === "admin");

  async function handleLogout() {
    await logout();
    router.push("/login");
  }

  return (
    <aside className="flex h-full w-[264px] shrink-0 flex-col border-r border-border bg-surface">
      <div className="px-5 py-5">
        <Link href="/dashboard" onClick={onNavigate}>
          <Logo />
        </Link>
      </div>

      <nav className="flex-1 overflow-y-auto px-3">
        <ul className="space-y-1">
          {items.map((item) => {
            const Icon = Icons[item.icon];
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={onNavigate}
                  aria-current={active ? "page" : undefined}
                  className={`group relative flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm transition-colors ${
                    active
                      ? "bg-accent-soft font-medium text-accent"
                      : "text-content-dim hover:bg-surface-2 hover:text-content"
                  }`}
                >
                  {active && (
                    <span className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-r bg-accent" />
                  )}
                  <Icon className="size-[18px] shrink-0" />
                  <span className="flex-1">{item.label}</span>
                  {item.badge && (
                    <span className="rounded-md bg-accent/15 px-1.5 py-0.5 text-[10px] font-semibold text-accent">
                      {item.badge}
                    </span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>

        <div className="mt-6 overflow-hidden rounded-2xl border border-accent/15 bg-gradient-to-br from-accent-soft to-surface-2 p-4">
          <h3 className="text-sm font-semibold">Unlock Premium</h3>
          <p className="mt-1.5 text-xs leading-relaxed text-content-dim">
            Advanced order types, lower fees, and priority matching.
          </p>
          <button className="mt-3 rounded-lg bg-accent px-3 py-1.5 text-xs font-semibold text-accent-ink transition-colors hover:bg-accent-hover">
            Get Now →
          </button>
        </div>
      </nav>

      <div className="border-t border-border p-3">
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm text-content-dim transition-colors hover:bg-surface-2 hover:text-down"
        >
          <Icons.logout className="size-[18px]" />
          Log out
        </button>
      </div>
    </aside>
  );
}
