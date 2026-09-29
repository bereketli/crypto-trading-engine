/**
 * Berko mark: a hexagonal blockchain "node" tile enclosing a geometric B
 * built from two stacked blocks, with a ledger seam splitting them.
 */
export function LogoMark({ className = "size-9" }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" className={className} role="img" aria-label="Berko">
      <defs>
        <linearGradient id="berko-tile" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#5CF2B4" />
          <stop offset="55%" stopColor="#2FD39A" />
          <stop offset="100%" stopColor="#12A97C" />
        </linearGradient>
        <linearGradient id="berko-glow" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* Hexagon tile */}
      <path
        d="M20 1.6 34.6 10v20L20 38.4 5.4 30V10z"
        fill="url(#berko-tile)"
      />
      <path d="M20 1.6 34.6 10v20L20 38.4 5.4 30V10z" fill="url(#berko-glow)" />

      {/* Geometric B: stem + two blocks */}
      <path
        d="M13.4 11.2h8.4c3.3 0 5.6 1.9 5.6 4.7 0 1.7-.8 3-2.2 3.7 1.9.7 3 2.2 3 4.3 0 3.1-2.5 5.1-6.2 5.1h-8.6zm4.3 3.5v3.6h3.5c1.3 0 2.1-.7 2.1-1.8s-.8-1.8-2.1-1.8zm0 6.9v4h3.9c1.5 0 2.4-.8 2.4-2s-.9-2-2.4-2z"
        fill="#06251B"
      />
    </svg>
  );
}

export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <span className="flex items-center gap-2.5">
      <LogoMark />
      {!compact && (
        <span className="flex flex-col leading-none">
          <span className="text-[17px] font-bold tracking-tight text-content">Berko</span>
          <span className="mt-0.5 text-[10px] font-medium tracking-wide text-content-faint">
            Crypto Platform
          </span>
        </span>
      )}
    </span>
  );
}
