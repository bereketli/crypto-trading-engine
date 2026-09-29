"use client";

import { AppShell } from "@/components/AppShell";
import { AssetIcon } from "@/components/charts";
import { Card } from "@/components/ui";
import { assetColor, formatAmount, formatMoney, formatPrice } from "@/lib/format";
import { usePortfolio } from "@/lib/use-market";

function PortfolioContent() {
  const { portfolio, loading } = usePortfolio();

  const total = Number(portfolio?.total_value ?? 0);
  const locked =
    portfolio?.wallets.reduce((sum, w) => {
      const price = Number(w.price ?? 0);
      return sum + Number(w.locked_balance) * price;
    }, 0) ?? 0;

  return (
    <div className="space-y-6 p-4 lg:p-6">
      <div>
        <h1 className="text-xl font-bold">My Coins</h1>
        <p className="mt-1 text-sm text-content-dim">
          Balances across every asset, valued at the last traded price.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="p-5">
          <p className="text-xs text-content-faint">Total value</p>
          {loading ? (
            <div className="mt-2 h-8 w-32 animate-pulse rounded bg-surface-2" />
          ) : (
            <p className="mt-1 text-2xl font-bold">${formatMoney(total)}</p>
          )}
          <p className="mt-1 text-xs text-content-dim">{portfolio?.quote_asset ?? "USDT"}</p>
        </Card>
        <Card className="p-5">
          <p className="text-xs text-content-faint">In open orders</p>
          <p className="mt-1 text-2xl font-bold">${formatMoney(locked)}</p>
          <p className="mt-1 text-xs text-content-dim">Locked balance</p>
        </Card>
        <Card className="p-5">
          <p className="text-xs text-content-faint">Assets held</p>
          <p className="mt-1 text-2xl font-bold">{portfolio?.wallets.length ?? 0}</p>
          <p className="mt-1 text-xs text-content-dim">Wallets</p>
        </Card>
      </div>

      <Card className="p-0">
        <div className="border-b border-border px-5 py-4">
          <h2 className="font-semibold">Balances</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-2xl text-sm">
            <thead>
              <tr className="text-left text-[11px] uppercase tracking-wide text-content-faint">
                <th className="px-5 py-3 font-medium">Asset</th>
                <th className="px-3 py-3 text-right font-medium">Available</th>
                <th className="px-3 py-3 text-right font-medium">Locked</th>
                <th className="px-3 py-3 text-right font-medium">Total</th>
                <th className="px-3 py-3 text-right font-medium">Price</th>
                <th className="px-5 py-3 text-right font-medium">Value</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-content-dim">
                    Loading balances…
                  </td>
                </tr>
              ) : portfolio && portfolio.wallets.length > 0 ? (
                portfolio.wallets.map((w) => (
                  <tr key={w.id} className="border-t border-border-soft">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <AssetIcon symbol={w.asset} color={assetColor(w.asset)} size={30} />
                        <span className="font-medium">{w.asset}</span>
                      </div>
                    </td>
                    <td className="px-3 py-3.5 text-right font-mono">{formatAmount(w.available_balance)}</td>
                    <td className="px-3 py-3.5 text-right font-mono text-content-dim">
                      {formatAmount(w.locked_balance)}
                    </td>
                    <td className="px-3 py-3.5 text-right font-mono">{formatAmount(w.total_balance)}</td>
                    <td className="px-3 py-3.5 text-right font-mono text-content-dim">
                      {w.price ? `$${formatPrice(w.price)}` : "—"}
                    </td>
                    <td className="px-5 py-3.5 text-right font-mono font-medium">
                      {w.value ? `$${formatMoney(w.value)}` : "—"}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-content-dim">
                    No wallets yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

export default function PortfolioPage() {
  return (
    <AppShell>
      <PortfolioContent />
    </AppShell>
  );
}
