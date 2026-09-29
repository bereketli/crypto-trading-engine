"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Logo } from "@/components/Logo";
import { Alert, Button, Card, Input } from "@/components/ui";
import { ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

export default function RegisterPage() {
  const { register, login, user, loading } = useAuth();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && user) router.replace("/dashboard");
  }, [loading, user, router]);

  const mismatch = confirm.length > 0 && confirm !== password;

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (mismatch) return;

    setError(null);
    setSubmitting(true);
    try {
      await register({ email, username, password });
      // Registration returns the profile, not tokens — log in to get a session.
      await login({ email, password });
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Unable to reach the server.");
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center px-4 py-12">
      <div className="mb-8 flex justify-center">
        <Logo />
      </div>
      <Card>
        <h1 className="text-2xl font-bold">Create account</h1>
        <p className="mt-1 text-sm text-content-dim">Start trading on the demo exchange.</p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          {error && <Alert>{error}</Alert>}

          <Input
            label="Email"
            name="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
          />

          <Input
            label="Username"
            name="username"
            required
            minLength={3}
            maxLength={50}
            pattern="[A-Za-z0-9_]+"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="satoshi_n"
            hint="3–50 characters. Letters, numbers, and underscores only."
          />

          <Input
            label="Password"
            name="password"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            hint="At least 8 characters."
          />

          <Input
            label="Confirm password"
            name="confirm"
            type="password"
            autoComplete="new-password"
            required
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder="••••••••"
            error={mismatch ? "Passwords do not match." : undefined}
          />

          <Button type="submit" loading={submitting} disabled={mismatch} className="w-full">
            Create account
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-content-dim">
          Already registered?{" "}
          <Link href="/login" className="font-medium text-accent hover:underline">
            Log in
          </Link>
        </p>
      </Card>
    </div>
  );
}
