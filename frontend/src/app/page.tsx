import Link from "next/link";

const MARKETS = [
  { pair: "BTC/USDT", price: "67,412.55", change: "+2.41%", up: true },
  { pair: "ETH/USDT", price: "3,284.10", change: "+1.18%", up: true },
  { pair: "BNB/USDT", price: "589.24", change: "-0.63%", up: false },
];

const FEATURES = [
  {
    title: "Spot wallets",
    body: "Per-asset balances with available and locked amounts, backed by exact-precision NUMERIC columns.",
  },
  {
    title: "Matching engine",
    body: "Price-time priority matching with partial and complete fills, emitting trade and wallet events.",
  },
  {
    title: "Secure sessions",
    body: "Argon2 password hashing, short-lived JWT access tokens, and single-use rotating refresh tokens.",
  },
];

export default function Home() {
  return (
    <div className="flex flex-1 flex-col">
      <section className="mx-auto w-full max-w-6xl px-4 py-16 md:py-24">
        <div className="grid items-center gap-12 md:grid-cols-2">
          <div className="space-y-6">
            <h1 className="text-4xl font-bold leading-tight tracking-tight md:text-5xl">
              Trade crypto on a{" "}
              <span className="text-accent">production-style</span> exchange
            </h1>
            <p className="max-w-lg text-content-dim">
              A Binance-inspired exchange backend built with FastAPI, PostgreSQL, and an
              event-driven matching engine — paired with this Next.js front end.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/register"
                className="rounded-lg bg-accent px-6 py-3 text-sm font-semibold text-accent-ink transition-colors hover:bg-accent-hover"
              >
                Get started
              </Link>
              <Link
                href="/login"
                className="rounded-lg bg-surface-2 px-6 py-3 text-sm font-semibold text-content transition-colors hover:bg-surface-3"
              >
                Log in
              </Link>
            </div>
            <p className="text-xs text-content-faint">
              Educational project — simulated assets only, no real funds or blockchain activity.
            </p>
          </div>

          <div className="rounded-xl border border-border bg-surface p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-content-dim">Market overview</h2>
              <span className="rounded bg-surface-3 px-2 py-0.5 text-xs text-content-faint">Demo data</span>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-content-faint">
                  <th className="pb-2 font-medium">Pair</th>
                  <th className="pb-2 text-right font-medium">Price</th>
                  <th className="pb-2 text-right font-medium">24h</th>
                </tr>
              </thead>
              <tbody>
                {MARKETS.map((market) => (
                  <tr key={market.pair} className="border-t border-border/60">
                    <td className="py-3 font-medium">{market.pair}</td>
                    <td className="py-3 text-right font-mono">{market.price}</td>
                    <td className={`py-3 text-right font-mono ${market.up ? "text-up" : "text-down"}`}>
                      {market.change}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="border-t border-border bg-surface/40">
        <div className="mx-auto grid max-w-6xl gap-6 px-4 py-14 md:grid-cols-3">
          {FEATURES.map((feature) => (
            <div key={feature.title} className="space-y-2">
              <h3 className="font-semibold">{feature.title}</h3>
              <p className="text-sm leading-relaxed text-content-dim">{feature.body}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
