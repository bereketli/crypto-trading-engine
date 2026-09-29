"use client";

import { formatPercent, formatPrice } from "@/lib/format";
import type { Ticker } from "@/lib/types";

/**
 * Marquee of live 24h stats. The list is rendered twice so the CSS
 * translateX(-50%) loop is seamless.
 */
export function TickerStrip({ tickers }: { tickers: Ticker[] }) {
  if (tickers.length === 0) return null;

  const row = (key: string) => (
    <div key={key} className="flex shrink-0 items-center gap-6 pr-6" aria-hidden={key === "b"}>
      {tickers.map((t) => {
        const pct = t.price_change_percent;
        const up = (pct ?? 0) >= 0;
        return (
          <span key={`${key}-${t.symbol}`} className="flex items-center gap-2 whitespace-nowrap text-xs">
            <span className="font-semibold text-content-dim">{t.base_asset}</span>
            <span className="font-mono text-content">${formatPrice(t.last_price)}</span>
            <span className={`font-mono ${up ? "text-up" : "text-down"}`}>{formatPercent(pct)}</span>
          </span>
        );
      })}
    </div>
  );

  return (
    <div className="overflow-hidden border-b border-border bg-surface/60 py-2">
      <div className="flex w-max animate-marquee">
        {row("a")}
        {row("b")}
      </div>
    </div>
  );
}
