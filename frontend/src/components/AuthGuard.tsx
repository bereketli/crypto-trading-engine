"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "@/lib/auth-context";

export function AuthGuard({
  children,
  requireAdmin = false,
}: {
  children: React.ReactNode;
  requireAdmin?: boolean;
}) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [loading, user, router]);

  if (loading || !user) {
    return (
      <div className="flex flex-1 items-center justify-center py-24">
        <span
          aria-label="Loading"
          className="size-8 animate-spin rounded-full border-2 border-surface-3 border-t-accent"
        />
      </div>
    );
  }

  // Signed in but not permitted: show a dead end rather than bouncing to login,
  // which would wrongly imply the session is the problem.
  if (requireAdmin && user.role !== "admin") {
    return (
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 py-16 text-center">
        <h1 className="text-xl font-semibold">Admin access required</h1>
        <p className="mt-2 text-sm text-content-dim">
          Your account doesn&apos;t have permission to view this page.
        </p>
        <Link href="/dashboard" className="mt-6 text-sm font-medium text-accent hover:underline">
          Back to dashboard
        </Link>
      </div>
    );
  }

  return <>{children}</>;
}
