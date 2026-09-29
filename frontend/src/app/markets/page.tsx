"use client";

import { useMemo, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { AssetIcon, Sparkline } from "@/components/charts";
import { Card } from "@/components/ui";
import { assetColor, formatCompact, formatPercent, formatPrice } from "@/lib/format";
import { useTickers } from "@/lib/use-market";

type SortKey = "symbol" | "price" | "change" | "volume";

function MarketsContent() {
  const { tickers, loading } = useTickers();
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortKey>("volume");

  const rows = useMemo(() => {
    const filtered = tickers.filter((t) =>
      `${t.symbol} ${t.base_asset}`.toLowerCase().includes(query.trim().toLowerCase()),
    );

    const sorters: Record<SortKey, (a: typeof filtered[number], b: typeof filtered[number]) => number> = {
      symbol: (a, b) => a.symbol.localeCompare(b.symbol),
      price: (a, b) => Number(b.last_price ?? 0) - Number(a.last_price ?? 0),
      change: (a, b) => (b.price_change_percent ?? 0) - (a.price_change_percent ?? 0),
      volume: (a, b) => Number(b.quote_volume) - Number(a.quote_volume),
    };

    return [...filtered].sort(sorters[sort]);
  }, [tickers, query, sort]);

  const gainers = rows.filter((t) => (t.price_change_percent ?? 0) > 0).length;

  return (
    <div className="space-y-6 p-4 lg:p-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold">Markets</h1>
          <p className="mt-1 text-sm text-content-dim">
            {tickers.length} pairs · {gainers} up · {tickers.length - gainers} down (24h)
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <input
            placeholder="Search markets…"
            aria-label="Search markets"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="rounded-xl border border-border bg-surface px-3.5 py-2 text-sm placeholder:text-content-faint focus:border-accent/40 focus:outline-none focus:ring-2 focus:ring-accent/20"
          />
          <select
            aria-label="Sort markets"
            value={sort}
            onChange={(e) => setSort(e.target.value as SortKey)}
            className="rounded-xl border border-border bg-surface px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/20"
          >
            <option value="volume">Sort: Volume</option>
            <option value="change">Sort: 24h change</option>
            <option value="price">Sort: Price</option>
            <option value="symbol">Sort: Name</option>
          </select>
        </div>
      </div>

      <Card className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full min-w-3xl text-sm">
            <thead>
              <tr className="text-left text-[11px] uppercase tracking-wide text-content-faint">
                <th className="px-5 py-3.5 font-medium">Market</th>
                <th className="px-3 py-3.5 font-medium">24h chart</th>
                <th className="px-3 py-3.5 text-right font-medium">Last price</th>
                <th className="px-3 py-3.5 text-right font-medium">24h change</th>
                <th className="px-3 py-3.5 text-right font-medium">24h high</th>
                <th className="px-3 py-3.5 text-right font-medium">24h low</th>
                <th className="px-5 py-3.5 text-right font-medium">Volume</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-content-dim">
                    Loading markets…
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-content-dim">
                    No markets match “{query}”.
                  </td>
                </tr>
              ) : (
                rows.map((t) => {
                  const up = (t.price_change_percent ?? 0) >= 0;
                  return (
                    <tr key={t.symbol} className="border-t border-border-soft hover:bg-surface-2/50">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <AssetIcon symbol={t.base_asset} color={assetColor(t.base_asset)} size={30} />
                          <div>
                            <p className="font-medium">
                              {t.base_asset}
                              <span className="text-content-faint">/{t.quote_asset}</span>
                            </p>
                            <p className="text-xs text-content-faint">{t.trade_count} trades</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-3.5">
                        <Sparkline
                          values={t.sparkline.map(Number)}
                          color={up ? "var(--color-up)" : "var(--color-down)"}
                          width={110}
                          height={34}
                        />
                      </td>
                      <td className="px-3 py-3.5 text-right font-mono">${formatPrice(t.last_price)}</td>
                      <td className="px-3 py-3.5 text-right">
                        <span
                          className={`rounded-md px-2 py-1 font-mono text-xs ${
                            up ? "bg-up/10 text-up" : "bg-down/10 text-down"
                          }`}
                        >
                          {formatPercent(t.price_change_percent)}
                        </span>
                      </td>
                      <td className="px-3 py-3.5 text-right font-mono text-content-dim">
                        ${formatPrice(t.high_price)}
                      </td>
                      <td className="px-3 py-3.5 text-right font-mono text-content-dim">
                        ${formatPrice(t.low_price)}
                      </td>
                      <td className="px-5 py-3.5 text-right font-mono text-content-dim">
                        ${formatCompact(t.quote_volume)}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

export default function MarketsPage() {
  return (
    <AppShell>
      <MarketsContent />
    </AppShell>
  );
}
