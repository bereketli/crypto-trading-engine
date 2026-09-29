"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { AssetIcon, BarChart, Sparkline } from "@/components/charts";
import { Card } from "@/components/ui";
import { useAuth } from "@/lib/auth-context";
import { assetColor, formatCompact, formatMoney, formatPercent, formatPrice } from "@/lib/format";
import { usePortfolio, useTickers } from "@/lib/use-market";
import type { Ticker } from "@/lib/types";

function TopCoinCard({ ticker }: { ticker: Ticker }) {
  const pct = ticker.price_change_percent ?? 0;
  const up = pct >= 0;
  const color = up ? "var(--color-up)" : "var(--color-down)";
  const values = ticker.sparkline.map(Number);
  const change = Number(ticker.price_change ?? 0);

  return (
    <div className="rounded-2xl border border-border bg-surface p-5">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <AssetIcon symbol={ticker.base_asset} color={assetColor(ticker.base_asset)} />
          <div>
            <p className="text-sm font-semibold">{ticker.base_asset}</p>
            <p className="text-xs text-content-faint">{ticker.symbol}</p>
          </div>
        </div>
        <Link
          href={`/markets`}
          aria-label={`View ${ticker.symbol} market`}
          className="rounded-lg border border-border p-1.5 text-content-dim transition-colors hover:text-accent"
        >
          <svg viewBox="0 0 16 16" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M5.5 10.5l5-5M6.5 5.5h4v4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </Link>
      </div>

      <p className="mt-4 text-xs text-content-faint">Last price</p>
      <p className="mt-0.5 text-2xl font-bold tracking-tight" style={{ color }}>
        ${formatPrice(ticker.last_price)}
      </p>

      <div className="mt-3">
        <Sparkline values={values} color={color} width={230} height={52} />
      </div>

      <div className="mt-3 flex items-center justify-between text-xs">
        <span className={`flex items-center gap-1 font-medium ${up ? "text-up" : "text-down"}`}>
          {up ? "▲" : "▼"} {formatPercent(pct)}
        </span>
        <span className="font-mono text-content-dim">
          {change >= 0 ? "+" : "−"}${formatMoney(Math.abs(change))}
        </span>
      </div>
    </div>
  );
}

function DashboardContent() {
  const { user } = useAuth();
  const { tickers, loading: tickersLoading } = useTickers();
  const { portfolio, loading: portfolioLoading } = usePortfolio();
  const [selected, setSelected] = useState<string | null>(null);

  const sorted = useMemo(
    () => [...tickers].sort((a, b) => (b.price_change_percent ?? 0) - (a.price_change_percent ?? 0)),
    [tickers],
  );

  const topCoins = sorted.slice(0, 3);
  const chartTicker = useMemo(
    () => tickers.find((t) => t.symbol === selected) ?? tickers.find((t) => t.symbol === "ETHUSDT") ?? tickers[0],
    [tickers, selected],
  );

  const chartValues = chartTicker?.sparkline.map(Number) ?? [];
  const chartLabels = chartValues.map((_, i) => `${i * 2}h`);

  return (
    <div className="space-y-6 p-4 lg:p-6">
      {/* Top coins */}
      <section>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="flex items-center gap-1.5 text-xs text-content-faint">
              <svg viewBox="0 0 16 16" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="1.6">
                <circle cx="8" cy="8" r="6" />
                <path d="M8 5v3l2 1.5" strokeLinecap="round" />
              </svg>
              Based on recent 24 hours
            </p>
            <h1 className="mt-1 flex items-center gap-3 text-xl font-bold">
              My Top Coins
              <span className="rounded-md bg-surface-2 px-2 py-0.5 text-xs font-medium text-content-dim">
                {topCoins.length} Assets
              </span>
            </h1>
          </div>
          <Link href="/markets" className="text-sm font-medium text-accent hover:underline">
            See all markets →
          </Link>
        </div>

        {tickersLoading ? (
          <div className="grid gap-4 md:grid-cols-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-52 animate-pulse rounded-2xl border border-border bg-surface" />
            ))}
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-3">
            {topCoins.map((t) => (
              <TopCoinCard key={t.symbol} ticker={t} />
            ))}
          </div>
        )}
      </section>

      <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          {/* Price chart */}
          <Card className="p-5">
            <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
              <div>
                <select
                  aria-label="Select market"
                  value={chartTicker?.symbol ?? ""}
                  onChange={(e) => setSelected(e.target.value)}
                  className="rounded-lg border border-border bg-surface-2 px-2.5 py-1 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-accent/30"
                >
                  {tickers.map((t) => (
                    <option key={t.symbol} value={t.symbol}>
                      {t.base_asset}/{t.quote_asset}
                    </option>
                  ))}
                </select>
                <p className="mt-2 text-3xl font-bold tracking-tight">
                  {formatPrice(chartTicker?.last_price)}
                  <span
                    className={`ml-2 align-middle text-sm font-medium ${
                      (chartTicker?.price_change_percent ?? 0) >= 0 ? "text-up" : "text-down"
                    }`}
                  >
                    ({formatPercent(chartTicker?.price_change_percent)})
                  </span>
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="rounded-lg border border-border px-2.5 py-1.5 text-content-dim">
                  H ${formatPrice(chartTicker?.high_price)}
                </span>
                <span className="rounded-lg border border-border px-2.5 py-1.5 text-content-dim">
                  L ${formatPrice(chartTicker?.low_price)}
                </span>
                <span className="rounded-lg bg-accent-soft px-2.5 py-1.5 font-medium text-accent">
                  {chartTicker?.trade_count ?? 0} trades / 24h
                </span>
              </div>
            </div>

            <BarChart values={chartValues} labels={chartLabels} />
          </Card>

          {/* Market table */}
          <Card className="p-0">
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <div>
                <h2 className="font-semibold">Crypto Prices</h2>
                <p className="text-xs text-content-faint">Live from the trades ledger</p>
              </div>
              <Link href="/markets" className="text-sm font-medium text-accent hover:underline">
                See All
              </Link>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-2xl text-sm">
                <thead>
                  <tr className="text-left text-[11px] uppercase tracking-wide text-content-faint">
                    <th className="px-5 py-3 font-medium">Asset</th>
                    <th className="px-3 py-3 font-medium">Chart</th>
                    <th className="px-3 py-3 text-right font-medium">Price</th>
                    <th className="px-3 py-3 text-right font-medium">24h</th>
                    <th className="px-5 py-3 text-right font-medium">Volume</th>
                  </tr>
                </thead>
                <tbody>
                  {sorted.slice(0, 6).map((t) => {
                    const up = (t.price_change_percent ?? 0) >= 0;
                    return (
                      <tr key={t.symbol} className="border-t border-border-soft">
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-2.5">
                            <AssetIcon symbol={t.base_asset} color={assetColor(t.base_asset)} size={28} />
                            <span className="font-medium">{t.base_asset}</span>
                            <span className="text-xs text-content-faint">{t.quote_asset}</span>
                          </div>
                        </td>
                        <td className="px-3 py-3">
                          <Sparkline
                            values={t.sparkline.map(Number)}
                            color={up ? "var(--color-up)" : "var(--color-down)"}
                            width={90}
                            height={28}
                            filled={false}
                          />
                        </td>
                        <td className="px-3 py-3 text-right font-mono">${formatPrice(t.last_price)}</td>
                        <td className={`px-3 py-3 text-right font-mono ${up ? "text-up" : "text-down"}`}>
                          {formatPercent(t.price_change_percent)}
                        </td>
                        <td className="px-5 py-3 text-right font-mono text-content-dim">
                          ${formatCompact(t.quote_volume)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        {/* Right rail */}
        <div className="space-y-6">
          <Card className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="font-semibold">Portfolio</h2>
                <p className="text-xs text-content-faint">Valued at last traded price</p>
              </div>
              <span className="rounded-md bg-accent-soft px-2 py-1 text-[10px] font-semibold text-accent">
                {portfolio?.quote_asset ?? "USDT"}
              </span>
            </div>

            {portfolioLoading ? (
              <div className="mt-5 h-8 w-40 animate-pulse rounded bg-surface-2" />
            ) : (
              <p className="mt-4 text-3xl font-bold tracking-tight">
                ${formatMoney(portfolio?.total_value)}
              </p>
            )}

            <div className="mt-5 space-y-3">
              {portfolio?.wallets.slice(0, 5).map((w) => (
                <div key={w.id} className="flex items-center gap-3">
                  <AssetIcon symbol={w.asset} color={assetColor(w.asset)} size={30} />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">{w.asset}</p>
                    <p className="truncate text-xs text-content-faint">
                      {formatPrice(w.total_balance)} {w.asset}
                    </p>
                  </div>
                  <span className="font-mono text-sm">
                    {w.value ? `$${formatMoney(w.value)}` : "—"}
                  </span>
                </div>
              ))}
              {portfolio?.wallets.length === 0 && (
                <p className="text-sm text-content-dim">No wallets yet.</p>
              )}
            </div>

            <Link
              href="/portfolio"
              className="mt-5 block rounded-xl bg-accent py-2.5 text-center text-sm font-semibold text-accent-ink transition-colors hover:bg-accent-hover"
            >
              View all coins
            </Link>
          </Card>

          <Card className="p-5">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="font-semibold">Top Movers</h2>
                <p className="text-xs text-content-faint">Biggest 24h swings</p>
              </div>
              <Link href="/markets" className="text-xs font-medium text-accent hover:underline">
                See All
              </Link>
            </div>

            <div className="space-y-3.5">
              {[...tickers]
                .sort(
                  (a, b) =>
                    Math.abs(b.price_change_percent ?? 0) - Math.abs(a.price_change_percent ?? 0),
                )
                .slice(0, 6)
                .map((t) => {
                  const up = (t.price_change_percent ?? 0) >= 0;
                  return (
                    <div key={t.symbol} className="flex items-center gap-3">
                      <AssetIcon symbol={t.base_asset} color={assetColor(t.base_asset)} size={30} />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium">{t.base_asset}</p>
                        <p className="text-xs text-content-faint">{t.symbol}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-mono text-sm">${formatPrice(t.last_price)}</p>
                        <p className={`font-mono text-xs ${up ? "text-up" : "text-down"}`}>
                          {formatPercent(t.price_change_percent)}
                        </p>
                      </div>
                    </div>
                  );
                })}
            </div>
          </Card>

          {user?.role === "admin" && (
            <Card className="p-5">
              <h2 className="font-semibold">Administration</h2>
              <p className="mt-1 text-xs text-content-dim">
                Manage accounts, roles, and KYC review.
              </p>
              <Link
                href="/admin/users"
                className="mt-4 inline-flex text-sm font-medium text-accent hover:underline"
              >
                Open user management →
              </Link>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <AppShell>
      <DashboardContent />
    </AppShell>
  );
}
