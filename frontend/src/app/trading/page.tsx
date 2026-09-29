"use client";

import { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { AssetIcon, BarChart } from "@/components/charts";
import { Badge, Card } from "@/components/ui";
import { api } from "@/lib/api";
import { assetColor, formatAmount, formatPercent, formatPrice, formatTime } from "@/lib/format";
import { useTickers } from "@/lib/use-market";
import type { MarketTrade } from "@/lib/types";

function SwapWidget({ symbols }: { symbols: { base: string; price: number }[] }) {
  const [from, setFrom] = useState("BTC");
  const [to, setTo] = useState("ETH");
  const [amount, setAmount] = useState("0.05");

  const priceOf = (asset: string) => symbols.find((s) => s.base === asset)?.price ?? 0;
  const fromPrice = priceOf(from);
  const toPrice = priceOf(to);

  const received = useMemo(() => {
    const amt = Number(amount);
    if (!Number.isFinite(amt) || !fromPrice || !toPrice) return 0;
    return (amt * fromPrice) / toPrice;
  }, [amount, fromPrice, toPrice]);

  const options = symbols.map((s) => s.base);

  return (
    <Card className="p-5">
      <div className="mb-4 flex items-start justify-between">
        <div>
          <h2 className="font-semibold">Exchange</h2>
          <p className="text-xs text-content-faint">Instant token swap</p>
        </div>
        <button
          aria-label="Swap direction"
          onClick={() => {
            setFrom(to);
            setTo(from);
          }}
          className="rounded-lg border border-border p-1.5 text-content-dim transition-colors hover:text-accent"
        >
          <svg viewBox="0 0 16 16" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M4 6l2-2 2 2M6 4v8M12 10l-2 2-2-2M10 12V4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>

      <div className="rounded-xl border border-border bg-surface-2 p-4">
        <div className="flex items-center justify-between text-xs text-content-faint">
          <span>You will send</span>
          <span>1 {from} = ${formatPrice(fromPrice)}</span>
        </div>
        <div className="mt-2 flex items-center gap-3">
          <input
            aria-label="Amount to send"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            inputMode="decimal"
            className="min-w-0 flex-1 bg-transparent text-xl font-bold focus:outline-none"
          />
          <select
            aria-label="Send asset"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="rounded-lg border border-border bg-surface px-2.5 py-1.5 text-sm font-medium focus:outline-none"
          >
            {options.map((o) => (
              <option key={o} value={o}>
                {o}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="my-2 flex justify-center">
        <span className="rounded-full border border-border bg-surface p-1.5 text-content-dim">
          <svg viewBox="0 0 16 16" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M8 3v10M4.5 9.5L8 13l3.5-3.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
      </div>

      <div className="rounded-xl border border-border bg-surface-2 p-4">
        <div className="flex items-center justify-between text-xs text-content-faint">
          <span>You will receive</span>
          <span>1 {to} = ${formatPrice(toPrice)}</span>
        </div>
        <div className="mt-2 flex items-center gap-3">
          <span className="min-w-0 flex-1 truncate text-xl font-bold">{formatAmount(received)}</span>
          <select
            aria-label="Receive asset"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="rounded-lg border border-border bg-surface px-2.5 py-1.5 text-sm font-medium focus:outline-none"
          >
            {options.map((o) => (
              <option key={o} value={o}>
                {o}
              </option>
            ))}
          </select>
        </div>
      </div>

      <button
        disabled
        title="Order placement is not implemented yet"
        className="mt-4 w-full cursor-not-allowed rounded-xl bg-accent py-3 text-sm font-semibold text-accent-ink opacity-60"
      >
        Exchange
      </button>
      <p className="mt-2 text-center text-[11px] text-content-faint">
        Quote is live. Order placement lands with the matching engine (Phase 4).
      </p>
    </Card>
  );
}

function TradingContent() {
  const { tickers } = useTickers();
  const [symbol, setSymbol] = useState("BTCUSDT");
  const [trades, setTrades] = useState<MarketTrade[]>([]);
  const [loadingTrades, setLoadingTrades] = useState(true);

  const active = tickers.find((t) => t.symbol === symbol) ?? tickers[0];

  useEffect(() => {
    let cancelled = false;
    setLoadingTrades(true);
    api
      .marketTrades(symbol, 24)
      .then((data) => !cancelled && setTrades(data))
      .catch(() => !cancelled && setTrades([]))
      .finally(() => !cancelled && setLoadingTrades(false));
    return () => {
      cancelled = true;
    };
  }, [symbol]);

  const swapSymbols = tickers.map((t) => ({ base: t.base_asset, price: Number(t.last_price ?? 0) }));
  const up = (active?.price_change_percent ?? 0) >= 0;

  return (
    <div className="grid gap-6 p-4 lg:p-6 xl:grid-cols-[1fr_360px]">
      <div className="space-y-6">
        <Card className="p-5">
          <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              {active && <AssetIcon symbol={active.base_asset} color={assetColor(active.base_asset)} />}
              <div>
                <select
                  aria-label="Select market"
                  value={symbol}
                  onChange={(e) => setSymbol(e.target.value)}
                  className="rounded-lg border border-border bg-surface-2 px-2.5 py-1 text-sm font-semibold focus:outline-none"
                >
                  {tickers.map((t) => (
                    <option key={t.symbol} value={t.symbol}>
                      {t.base_asset}/{t.quote_asset}
                    </option>
                  ))}
                </select>
                <p className="mt-1.5 text-2xl font-bold">
                  ${formatPrice(active?.last_price)}
                  <span className={`ml-2 text-sm font-medium ${up ? "text-up" : "text-down"}`}>
                    {formatPercent(active?.price_change_percent)}
                  </span>
                </p>
              </div>
            </div>
            <div className="flex gap-2 text-xs">
              <span className="rounded-lg border border-border px-2.5 py-1.5 text-content-dim">
                24h H ${formatPrice(active?.high_price)}
              </span>
              <span className="rounded-lg border border-border px-2.5 py-1.5 text-content-dim">
                24h L ${formatPrice(active?.low_price)}
              </span>
            </div>
          </div>

          <BarChart
            values={active?.sparkline.map(Number) ?? []}
            labels={(active?.sparkline ?? []).map((_, i) => `${i * 2}h`)}
          />
        </Card>

        <Card className="p-0">
          <div className="flex items-center justify-between border-b border-border px-5 py-4">
            <h2 className="font-semibold">Recent trades</h2>
            <Badge>{symbol}</Badge>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[11px] uppercase tracking-wide text-content-faint">
                  <th className="px-5 py-3 font-medium">Time</th>
                  <th className="px-3 py-3 font-medium">Side</th>
                  <th className="px-3 py-3 text-right font-medium">Price</th>
                  <th className="px-5 py-3 text-right font-medium">Amount</th>
                </tr>
              </thead>
              <tbody>
                {loadingTrades ? (
                  <tr>
                    <td colSpan={4} className="px-5 py-10 text-center text-content-dim">
                      Loading trades…
                    </td>
                  </tr>
                ) : trades.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-5 py-10 text-center text-content-dim">
                      No trades for this market.
                    </td>
                  </tr>
                ) : (
                  trades.map((t) => (
                    <tr key={t.id} className="border-t border-border-soft">
                      <td className="px-5 py-2.5 font-mono text-xs text-content-dim">
                        {formatTime(t.created_at)}
                      </td>
                      <td className="px-3 py-2.5">
                        <span
                          className={`rounded px-1.5 py-0.5 text-[11px] font-semibold uppercase ${
                            t.taker_side === "buy" ? "bg-up/10 text-up" : "bg-down/10 text-down"
                          }`}
                        >
                          {t.taker_side}
                        </span>
                      </td>
                      <td
                        className={`px-3 py-2.5 text-right font-mono ${
                          t.taker_side === "buy" ? "text-up" : "text-down"
                        }`}
                      >
                        ${formatPrice(t.price)}
                      </td>
                      <td className="px-5 py-2.5 text-right font-mono text-content-dim">
                        {formatAmount(t.quantity)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      <div>
        <SwapWidget symbols={swapSymbols} />
      </div>
    </div>
  );
}

export default function TradingPage() {
  return (
    <AppShell>
      <TradingContent />
    </AppShell>
  );
}
