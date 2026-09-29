"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { Button } from "./ui";

function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2">
      <svg viewBox="0 0 32 32" className="size-7" aria-hidden>
        <path
          fill="var(--color-accent)"
          d="M16 2 9.5 8.5l2.4 2.4L16 6.8l4.1 4.1 2.4-2.4L16 2zM6.8 11.2 2 16l4.8 4.8 2.4-2.4L6.8 16l2.4-2.4-2.4-2.4zm18.4 0-2.4 2.4L25.2 16l-2.4 2.4 2.4 2.4L30 16l-4.8-4.8zM16 11.2 11.2 16 16 20.8 20.8 16 16 11.2zm-6.1 9.9-2.4 2.4L16 30l6.5-6.5-2.4-2.4-4.1 4.1-4.1-4.1z"
        />
      </svg>
      <span className="text-lg font-bold tracking-tight">
        Crypto<span className="text-accent">Engine</span>
      </span>
    </Link>
  );
}

export function Navbar() {
  const { user, logout, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  async function handleLogout() {
    await logout();
    router.push("/login");
  }

  const links = user
    ? [
        { href: "/dashboard", label: "Dashboard" },
        { href: "/settings", label: "Settings" },
        ...(user.role === "admin" ? [{ href: "/admin/users", label: "Users" }] : []),
      ]
    : [];

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-bg/90 backdrop-blur">
      <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4">
        <div className="flex items-center gap-8">
          <Logo />
          <ul className="hidden items-center gap-6 text-sm md:flex">
            {links.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className={
                    pathname === link.href
                      ? "font-medium text-accent"
                      : "text-content-dim transition-colors hover:text-content"
                  }
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div className="flex items-center gap-2">
          {loading ? (
            <div className="size-8 animate-pulse rounded-full bg-surface-2" />
          ) : user ? (
            <>
              <span className="hidden text-sm text-content-dim sm:inline">
                Hi, <span className="text-content">{user.username}</span>
              </span>
              <Button variant="ghost" onClick={handleLogout}>
                Log out
              </Button>
            </>
          ) : (
            <>
              <Link href="/login">
                <Button variant="ghost">Log in</Button>
              </Link>
              <Link href="/register">
                <Button>Register</Button>
              </Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}
