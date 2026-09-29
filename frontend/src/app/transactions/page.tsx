"use client";

import { AppShell } from "@/components/AppShell";
import { AssetIcon } from "@/components/charts";
import { Badge, Card } from "@/components/ui";
import { assetColor, formatAmount, formatDate, formatTime } from "@/lib/format";
import { useTransactions } from "@/lib/use-market";
import type { TransactionStatus, TransactionType } from "@/lib/types";

const STATUS_TONE: Record<TransactionStatus, "neutral" | "up" | "warn" | "down"> = {
  completed: "up",
  pending: "warn",
  failed: "down",
  reversed: "neutral",
};

const INFLOW: TransactionType[] = ["deposit", "transfer_in", "trade_unlock", "trade_settlement"];

function TypeIcon({ type }: { type: TransactionType }) {
  const inflow = INFLOW.includes(type);
  return (
    <span
      className={`grid size-9 shrink-0 place-items-center rounded-full ${
        inflow ? "bg-up/10 text-up" : "bg-down/10 text-down"
      }`}
    >
      <svg viewBox="0 0 16 16" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.8">
        {inflow ? (
          <path d="M8 12.5V3.5M4.5 9L8 12.5 11.5 9" strokeLinecap="round" strokeLinejoin="round" />
        ) : (
          <path d="M8 3.5v9M4.5 7L8 3.5 11.5 7" strokeLinecap="round" strokeLinejoin="round" />
        )}
      </svg>
    </span>
  );
}

function TransactionsContent() {
  const { transactions, total, loading } = useTransactions(50);

  return (
    <div className="space-y-6 p-4 lg:p-6">
      <div>
        <h1 className="text-xl font-bold">Transactions</h1>
        <p className="mt-1 text-sm text-content-dim">
          {total} ledger {total === 1 ? "entry" : "entries"} across your wallets.
        </p>
      </div>

      <Card className="p-0">
        {loading ? (
          <div className="px-5 py-12 text-center text-content-dim">Loading transactions…</div>
        ) : transactions.length === 0 ? (
          <div className="px-5 py-12 text-center">
            <p className="text-content-dim">No transactions yet.</p>
            <p className="mt-1 text-xs text-content-faint">
              Deposits and withdrawals will appear here once the wallet service supports them.
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-border-soft">
            {transactions.map((tx) => {
              const inflow = INFLOW.includes(tx.transaction_type);
              return (
                <li key={tx.id} className="flex items-center gap-4 px-5 py-4">
                  <TypeIcon type={tx.transaction_type} />

                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium capitalize">
                      {tx.transaction_type.replace(/_/g, " ")}
                    </p>
                    <p className="text-xs text-content-faint">
                      {formatDate(tx.created_at)} · {formatTime(tx.created_at)}
                    </p>
                  </div>

                  <div className="hidden sm:block">
                    <AssetIcon symbol={tx.asset} color={assetColor(tx.asset)} size={28} />
                  </div>

                  <div className="text-right">
                    <p className={`font-mono text-sm font-medium ${inflow ? "text-up" : "text-down"}`}>
                      {inflow ? "+" : "−"}
                      {formatAmount(tx.amount)} {tx.asset}
                    </p>
                    <Badge tone={STATUS_TONE[tx.status]}>{tx.status}</Badge>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </div>
  );
}

export default function TransactionsPage() {
  return (
    <AppShell>
      <TransactionsContent />
    </AppShell>
  );
}
