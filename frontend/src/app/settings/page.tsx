"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Alert, Badge, Button, Card, Input } from "@/components/ui";
import { ApiError, api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import type { KycStatus } from "@/lib/types";

const KYC_COPY: Record<KycStatus, { tone: "neutral" | "up" | "warn"; text: string }> = {
  unverified: { tone: "neutral", text: "Submit your identity documents to unlock higher limits." },
  pending: { tone: "warn", text: "Your submission is under review. This usually takes 1–2 days." },
  verified: { tone: "up", text: "Your identity is verified. All account limits are unlocked." },
  rejected: { tone: "neutral", text: "Your submission was rejected. Contact support to retry." },
};

function KycSection() {
  const { user, setUser } = useAuth();
  const [status, setStatus] = useState<{ kind: "error" | "success"; text: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (!user) return null;
  const copy = KYC_COPY[user.kyc_status];
  const canSubmit = user.kyc_status === "unverified" || user.kyc_status === "rejected";

  async function handleSubmit() {
    setStatus(null);
    setSubmitting(true);
    try {
      setUser(await api.submitKyc());
      setStatus({ kind: "success", text: "Verification submitted for review." });
    } catch (err) {
      setStatus({
        kind: "error",
        text: err instanceof ApiError ? err.message : "Unable to reach the server.",
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card>
      <div className="flex items-center justify-between gap-4">
        <h2 className="font-semibold">Identity verification</h2>
        <Badge tone={copy.tone}>{user.kyc_status}</Badge>
      </div>
      <p className="mt-2 text-sm text-content-dim">{copy.text}</p>

      {status && (
        <div className="mt-4">
          <Alert kind={status.kind}>{status.text}</Alert>
        </div>
      )}

      {canSubmit && (
        <Button className="mt-5" loading={submitting} onClick={handleSubmit}>
          Submit verification
        </Button>
      )}
    </Card>
  );
}

function ProfileSection() {
  const { user, setUser } = useAuth();
  const [username, setUsername] = useState(user?.username ?? "");
  const [status, setStatus] = useState<{ kind: "error" | "success"; text: string } | null>(null);
  const [saving, setSaving] = useState(false);

  const unchanged = username.trim() === user?.username;

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setStatus(null);
    setSaving(true);
    try {
      const updated = await api.updateMe({ username: username.trim() });
      setUser(updated);
      setStatus({ kind: "success", text: "Profile updated." });
    } catch (err) {
      setStatus({
        kind: "error",
        text: err instanceof ApiError ? err.message : "Unable to reach the server.",
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card>
      <h2 className="font-semibold">Profile</h2>
      <p className="mt-1 text-sm text-content-dim">Your email address cannot be changed.</p>

      <form onSubmit={handleSubmit} className="mt-5 space-y-4">
        {status && <Alert kind={status.kind}>{status.text}</Alert>}

        <Input label="Email" value={user?.email ?? ""} disabled readOnly />

        <Input
          label="Username"
          name="username"
          required
          minLength={3}
          maxLength={50}
          pattern="[A-Za-z0-9_]+"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          hint="3–50 characters. Letters, numbers, and underscores only."
        />

        <Button type="submit" loading={saving} disabled={unchanged}>
          Save changes
        </Button>
      </form>
    </Card>
  );
}

function PasswordSection() {
  const { logout } = useAuth();
  const router = useRouter();

  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [status, setStatus] = useState<{ kind: "error" | "success"; text: string } | null>(null);
  const [saving, setSaving] = useState(false);

  const mismatch = confirm.length > 0 && confirm !== next;

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (mismatch) return;

    setStatus(null);
    setSaving(true);
    try {
      await api.changePassword({ current_password: current, new_password: next });
      // The backend revokes every refresh token on password change, so this
      // session is intentionally dead — send the user back to log in.
      setStatus({ kind: "success", text: "Password changed. Redirecting to log in…" });
      setTimeout(async () => {
        await logout();
        router.push("/login");
      }, 1200);
    } catch (err) {
      setStatus({
        kind: "error",
        text: err instanceof ApiError ? err.message : "Unable to reach the server.",
      });
      setSaving(false);
    }
  }

  return (
    <Card>
      <h2 className="font-semibold">Password</h2>
      <p className="mt-1 text-sm text-content-dim">
        Changing your password signs you out of every device.
      </p>

      <form onSubmit={handleSubmit} className="mt-5 space-y-4">
        {status && <Alert kind={status.kind}>{status.text}</Alert>}

        <Input
          label="Current password"
          name="current_password"
          type="password"
          autoComplete="current-password"
          required
          value={current}
          onChange={(e) => setCurrent(e.target.value)}
        />

        <Input
          label="New password"
          name="new_password"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          value={next}
          onChange={(e) => setNext(e.target.value)}
          hint="At least 8 characters."
        />

        <Input
          label="Confirm new password"
          name="confirm_password"
          type="password"
          autoComplete="new-password"
          required
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          error={mismatch ? "Passwords do not match." : undefined}
        />

        <Button type="submit" loading={saving} disabled={mismatch}>
          Change password
        </Button>
      </form>
    </Card>
  );
}

export default function SettingsPage() {
  return (
    <AppShell>
      <div className="mx-auto w-full max-w-2xl p-4 lg:p-6">
        <h1 className="mb-8 text-2xl font-bold">Settings</h1>
        <div className="space-y-6">
          <ProfileSection />
          <KycSection />
          <PasswordSection />
        </div>
      </div>
    </AppShell>
  );
}
