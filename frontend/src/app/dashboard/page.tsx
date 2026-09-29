"use client";

import Link from "next/link";
import { AuthGuard } from "@/components/AuthGuard";
import { Badge, Card } from "@/components/ui";
import { useAuth } from "@/lib/auth-context";
import type { KycStatus } from "@/lib/types";

const KYC_TONE: Record<KycStatus, "neutral" | "up" | "warn"> = {
  unverified: "neutral",
  pending: "warn",
  verified: "up",
  rejected: "neutral",
};

// Endpoints these panels need don't exist yet — see the SRS phase plan.
const UPCOMING = [
  { title: "Wallets", detail: "Balances, deposits, withdrawals", phase: "Phase 2" },
  { title: "Spot trading", detail: "Limit, market, and stop orders", phase: "Phase 3" },
  { title: "Matching engine", detail: "Live order book and fills", phase: "Phase 4" },
];

function DashboardContent() {
  const { user } = useAuth();
  if (!user) return null;

  const joined = new Date(user.created_at).toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="mt-1 text-sm text-content-dim">Welcome back, {user.username}.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="font-semibold">Account</h2>
            <Link href="/settings" className="text-sm font-medium text-accent hover:underline">
              Manage
            </Link>
          </div>

          <dl className="grid gap-x-8 gap-y-5 sm:grid-cols-2">
            <div>
              <dt className="text-xs uppercase tracking-wide text-content-faint">Username</dt>
              <dd className="mt-1 text-sm">{user.username}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-content-faint">Email</dt>
              <dd className="mt-1 truncate text-sm">{user.email}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-content-faint">Account ID</dt>
              <dd className="mt-1 truncate font-mono text-xs text-content-dim">{user.id}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-content-faint">Member since</dt>
              <dd className="mt-1 text-sm">{joined}</dd>
            </div>
          </dl>

          <div className="mt-6 flex flex-wrap gap-2 border-t border-border pt-5">
            <Badge tone={KYC_TONE[user.kyc_status]}>KYC: {user.kyc_status}</Badge>
            <Badge tone={user.is_verified ? "up" : "neutral"}>
              Email {user.is_verified ? "verified" : "unverified"}
            </Badge>
            <Badge tone={user.is_active ? "up" : "neutral"}>
              {user.is_active ? "Active" : "Disabled"}
            </Badge>
            {user.role === "admin" && <Badge tone="warn">Admin</Badge>}
          </div>

          {user.role === "admin" && (
            <Link
              href="/admin/users"
              className="mt-5 inline-flex text-sm font-medium text-accent hover:underline"
            >
              Open user management →
            </Link>
          )}
        </Card>

        <Card>
          <h2 className="font-semibold">Estimated balance</h2>
          <p className="mt-4 font-mono text-3xl">
            0.00 <span className="text-base text-content-dim">USDT</span>
          </p>
          <p className="mt-3 text-sm text-content-dim">
            Wallet service is not wired up yet, so no balances are available.
          </p>
        </Card>
      </div>

      <div className="mt-8">
        <h2 className="mb-4 text-sm font-semibold text-content-dim">Coming next</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          {UPCOMING.map((item) => (
            <div key={item.title} className="rounded-xl border border-dashed border-border bg-surface/40 p-5">
              <div className="flex items-center justify-between">
                <h3 className="font-medium">{item.title}</h3>
                <Badge>{item.phase}</Badge>
              </div>
              <p className="mt-2 text-sm text-content-dim">{item.detail}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <AuthGuard>
      <DashboardContent />
    </AuthGuard>
  );
}
