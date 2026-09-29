"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Logo } from "@/components/Logo";
import { Sparkline } from "@/components/charts";
import { useAuth } from "@/lib/auth-context";
import { assetColor, formatPercent, formatPrice } from "@/lib/format";
import { useTickers } from "@/lib/use-market";

const FEATURES = [
  {
    title: "Exact-precision ledger",
    body: "Balances and fills stored as NUMERIC(36,18) — no floating-point drift on money.",
  },
  {
    title: "Price-time matching",
    body: "An order book with partial and complete fills, emitting trade and wallet events.",
  },
  {
    title: "Hardened sessions",
    body: "Argon2 hashing, short-lived JWTs, and single-use rotating refresh tokens.",
  },
];

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const { tickers } = useTickers(false);

  useEffect(() => {
    if (!loading && user) router.replace("/dashboard");
  }, [loading, user, router]);

  const top = [...tickers]
    .sort((a, b) => Number(b.quote_volume) - Number(a.quote_volume))
    .slice(0, 5);

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="border-b border-border">
        <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <Logo />
          <div className="flex items-center gap-2">
            <Link
              href="/login"
              className="rounded-xl px-4 py-2 text-sm font-medium text-content-dim transition-colors hover:text-content"
            >
              Log in
            </Link>
            <Link
              href="/register"
              className="rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-accent-ink transition-colors hover:bg-accent-hover"
            >
              Register
            </Link>
          </div>
        </nav>
      </header>

      <main className="flex-1">
        <section className="mx-auto max-w-6xl px-4 py-16 md:py-24">
          <div className="grid items-center gap-12 md:grid-cols-2">
            <div className="space-y-6">
              <span className="inline-flex items-center gap-2 rounded-full border border-accent/20 bg-accent-soft px-3 py-1 text-xs font-medium text-accent">
                <span className="size-1.5 rounded-full bg-accent" />
                Live market data from PostgreSQL
              </span>
              <h1 className="text-4xl font-bold leading-[1.1] tracking-tight md:text-5xl">
                The exchange backend,{" "}
                <span className="text-accent">built properly.</span>
              </h1>
              <p className="max-w-lg text-content-dim">
                Berko is a production-style crypto exchange — FastAPI, PostgreSQL, an
                event-driven matching engine, and this dashboard on top.
              </p>
              <div className="flex flex-wrap gap-3">
                <Link
                  href="/register"
                  className="rounded-xl bg-accent px-6 py-3 text-sm font-semibold text-accent-ink transition-colors hover:bg-accent-hover"
                >
                  Create account
                </Link>
                <Link
                  href="/login"
                  className="rounded-xl border border-border bg-surface px-6 py-3 text-sm font-semibold transition-colors hover:bg-surface-2"
                >
                  Log in
                </Link>
              </div>
              <p className="text-xs text-content-faint">
                Educational project — simulated assets only, no real funds or blockchain activity.
              </p>
            </div>

            <div className="rounded-2xl border border-border bg-surface p-5">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-sm font-semibold text-content-dim">Live markets</h2>
                <span className="rounded-md bg-accent-soft px-2 py-0.5 text-[10px] font-semibold text-accent">
                  24H
                </span>
              </div>

              {top.length === 0 ? (
                <p className="py-8 text-center text-sm text-content-faint">Loading markets…</p>
              ) : (
                <ul className="space-y-1">
                  {top.map((t) => {
                    const up = (t.price_change_percent ?? 0) >= 0;
                    return (
                      <li
                        key={t.symbol}
                        className="flex items-center gap-3 rounded-xl px-2 py-2.5 hover:bg-surface-2"
                      >
                        <span
                          className="grid size-8 shrink-0 place-items-center rounded-full text-[10px] font-bold"
                          style={{
                            backgroundColor: `${assetColor(t.base_asset)}1f`,
                            color: assetColor(t.base_asset),
                          }}
                        >
                          {t.base_asset.slice(0, 3)}
                        </span>
                        <span className="flex-1 text-sm font-medium">{t.base_asset}</span>
                        <Sparkline
                          values={t.sparkline.map(Number)}
                          color={up ? "var(--color-up)" : "var(--color-down)"}
                          width={70}
                          height={26}
                          filled={false}
                        />
                        <span className="w-24 text-right font-mono text-sm">
                          ${formatPrice(t.last_price)}
                        </span>
                        <span
                          className={`w-16 text-right font-mono text-xs ${up ? "text-up" : "text-down"}`}
                        >
                          {formatPercent(t.price_change_percent)}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>
        </section>

        <section className="border-t border-border bg-surface/40">
          <div className="mx-auto grid max-w-6xl gap-8 px-4 py-14 md:grid-cols-3">
            {FEATURES.map((f) => (
              <div key={f.title} className="space-y-2">
                <h3 className="font-semibold">{f.title}</h3>
                <p className="text-sm leading-relaxed text-content-dim">{f.body}</p>
              </div>
            ))}
          </div>
        </section>
      </main>

      <footer className="border-t border-border py-6">
        <p className="text-center text-xs text-content-faint">
          Berko Crypto Platform — educational project.
        </p>
      </footer>
    </div>
  );
}
