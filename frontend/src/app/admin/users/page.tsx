"use client";

import { useCallback, useEffect, useState } from "react";
import { AuthGuard } from "@/components/AuthGuard";
import { Alert, Badge, Button, Card } from "@/components/ui";
import { ApiError, api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import type { KycStatus, User, UserRole } from "@/lib/types";

const PAGE_SIZE = 10;

const KYC_OPTIONS: KycStatus[] = ["unverified", "pending", "verified", "rejected"];

const KYC_TONE: Record<KycStatus, "neutral" | "up" | "warn"> = {
  unverified: "neutral",
  pending: "warn",
  verified: "up",
  rejected: "neutral",
};

function UserRow({
  user,
  isSelf,
  onChange,
}: {
  user: User;
  isSelf: boolean;
  onChange: (id: string, patch: Parameters<typeof api.updateUser>[1]) => Promise<void>;
}) {
  const [busy, setBusy] = useState(false);

  async function run(patch: Parameters<typeof api.updateUser>[1]) {
    setBusy(true);
    try {
      await onChange(user.id, patch);
    } finally {
      setBusy(false);
    }
  }

  return (
    <tr className="border-t border-border align-middle">
      <td className="py-3 pr-3">
        <div className="font-medium">
          {user.username}
          {isSelf && <span className="ml-2 text-xs text-content-faint">(you)</span>}
        </div>
        <div className="truncate text-xs text-content-dim">{user.email}</div>
      </td>

      <td className="px-3 py-3">
        <select
          aria-label={`Role for ${user.username}`}
          value={user.role}
          disabled={busy || isSelf}
          onChange={(e) => run({ role: e.target.value as UserRole })}
          className="rounded border border-border bg-surface-2 px-2 py-1 text-xs disabled:opacity-50"
        >
          <option value="user">user</option>
          <option value="admin">admin</option>
        </select>
      </td>

      <td className="px-3 py-3">
        <select
          aria-label={`KYC status for ${user.username}`}
          value={user.kyc_status}
          disabled={busy}
          onChange={(e) => run({ kyc_status: e.target.value as KycStatus })}
          className="rounded border border-border bg-surface-2 px-2 py-1 text-xs"
        >
          {KYC_OPTIONS.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select>
      </td>

      <td className="px-3 py-3">
        <Badge tone={user.is_active ? "up" : "neutral"}>{user.is_active ? "active" : "disabled"}</Badge>
      </td>

      <td className="py-3 pl-3 text-right">
        <Button
          variant="secondary"
          className="px-3 py-1.5 text-xs"
          loading={busy}
          disabled={isSelf}
          onClick={() => run({ is_active: !user.is_active })}
        >
          {user.is_active ? "Disable" : "Enable"}
        </Button>
      </td>
    </tr>
  );
}

function AdminUsersContent() {
  const { user: currentUser } = useAuth();

  const [users, setUsers] = useState<User[]>([]);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [search, setSearch] = useState("");
  const [kycFilter, setKycFilter] = useState<"" | KycStatus>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.listUsers({
        limit: PAGE_SIZE,
        offset,
        search: search.trim() || undefined,
        kyc_status: kycFilter || undefined,
      });
      setUsers(data.items);
      setTotal(data.total);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Unable to reach the server.");
    } finally {
      setLoading(false);
    }
  }, [offset, search, kycFilter]);

  // Debounced so typing in the search box doesn't fire a request per keystroke.
  useEffect(() => {
    const timer = setTimeout(load, 250);
    return () => clearTimeout(timer);
  }, [load]);

  async function handleChange(id: string, patch: Parameters<typeof api.updateUser>[1]) {
    setError(null);
    try {
      const updated = await api.updateUser(id, patch);
      setUsers((prev) => prev.map((u) => (u.id === id ? updated : u)));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Unable to reach the server.");
    }
  }

  const page = Math.floor(offset / PAGE_SIZE) + 1;
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-10">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">User management</h1>
        <p className="mt-1 text-sm text-content-dim">
          {total} account{total === 1 ? "" : "s"} registered.
        </p>
      </div>

      <Card className="p-0">
        <div className="flex flex-wrap items-center gap-3 border-b border-border p-4">
          <input
            aria-label="Search users"
            placeholder="Search email or username…"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setOffset(0);
            }}
            className="min-w-56 flex-1 rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm placeholder:text-content-faint focus:outline-none focus:ring-2 focus:ring-accent/60"
          />
          <select
            aria-label="Filter by KYC status"
            value={kycFilter}
            onChange={(e) => {
              setKycFilter(e.target.value as "" | KycStatus);
              setOffset(0);
            }}
            className="rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm"
          >
            <option value="">All KYC statuses</option>
            {KYC_OPTIONS.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </div>

        {error && (
          <div className="p-4">
            <Alert>{error}</Alert>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full min-w-3xl text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wide text-content-faint">
                <th className="px-4 py-3 font-medium">User</th>
                <th className="px-3 py-3 font-medium">Role</th>
                <th className="px-3 py-3 font-medium">KYC</th>
                <th className="px-3 py-3 font-medium">Status</th>
                <th className="px-4 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="[&>tr>td:first-child]:pl-4 [&>tr>td:last-child]:pr-4">
              {loading && users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-content-dim">
                    Loading…
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-content-dim">
                    No users match those filters.
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <UserRow
                    key={user.id}
                    user={user}
                    isSelf={user.id === currentUser?.id}
                    onChange={handleChange}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between border-t border-border p-4 text-sm">
          <span className="text-content-dim">
            Page {page} of {pages}
          </span>
          <div className="flex gap-2">
            <Button
              variant="secondary"
              className="px-3 py-1.5 text-xs"
              disabled={offset === 0}
              onClick={() => setOffset((o) => Math.max(0, o - PAGE_SIZE))}
            >
              Previous
            </Button>
            <Button
              variant="secondary"
              className="px-3 py-1.5 text-xs"
              disabled={offset + PAGE_SIZE >= total}
              onClick={() => setOffset((o) => o + PAGE_SIZE)}
            >
              Next
            </Button>
          </div>
        </div>
      </Card>

      <p className="mt-4 text-xs text-content-faint">
        You cannot change your own role or disable your own account, and the last active admin
        cannot be demoted — both are enforced by the API.
      </p>
    </div>
  );
}

export default function AdminUsersPage() {
  return (
    <AuthGuard requireAdmin>
      <AdminUsersContent />
    </AuthGuard>
  );
}
