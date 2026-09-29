"use client";

import { forwardRef } from "react";

function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost";
  loading?: boolean;
};

export function Button({
  variant = "primary",
  loading = false,
  disabled,
  className,
  children,
  ...props
}: ButtonProps) {
  const base =
    "inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent";

  const variants = {
    primary: "bg-accent text-accent-ink hover:bg-accent-hover",
    secondary: "bg-surface-3 text-content hover:bg-surface-3/70",
    ghost: "text-content-dim hover:text-content hover:bg-surface-2",
  } as const;

  return (
    <button className={cx(base, variants[variant], className)} disabled={disabled || loading} {...props}>
      {loading && (
        <span
          aria-hidden
          className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent"
        />
      )}
      {children}
    </button>
  );
}

type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  hint?: string;
  error?: string;
};

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, hint, error, className, id, ...props },
  ref,
) {
  const inputId = id ?? props.name ?? label.toLowerCase().replace(/\s+/g, "-");

  return (
    <div className="space-y-1.5">
      <label htmlFor={inputId} className="block text-sm font-medium text-content-dim">
        {label}
      </label>
      <input
        ref={ref}
        id={inputId}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined}
        className={cx(
          "w-full rounded-lg border bg-surface-2 px-3.5 py-2.5 text-sm text-content placeholder:text-content-faint",
          "focus:outline-none focus:ring-2 focus:ring-accent/60",
          error ? "border-down" : "border-border",
          className,
        )}
        {...props}
      />
      {error ? (
        <p id={`${inputId}-error`} className="text-xs text-down">
          {error}
        </p>
      ) : hint ? (
        <p id={`${inputId}-hint`} className="text-xs text-content-faint">
          {hint}
        </p>
      ) : null}
    </div>
  );
});

export function Alert({ kind = "error", children }: { kind?: "error" | "success"; children: React.ReactNode }) {
  const styles =
    kind === "error"
      ? "border-down/30 bg-down/10 text-down"
      : "border-up/30 bg-up/10 text-up";

  return (
    <div role="alert" className={cx("rounded-lg border px-3.5 py-2.5 text-sm", styles)}>
      {children}
    </div>
  );
}

export function Card({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <div className={cx("rounded-xl border border-border bg-surface p-6", className)}>{children}</div>
  );
}

export function Badge({ tone = "neutral", children }: { tone?: "neutral" | "up" | "warn"; children: React.ReactNode }) {
  const tones = {
    neutral: "bg-surface-3 text-content-dim",
    up: "bg-up/15 text-up",
    warn: "bg-accent/15 text-accent",
  } as const;

  return (
    <span className={cx("inline-flex items-center rounded px-2 py-0.5 text-xs font-medium", tones[tone])}>
      {children}
    </span>
  );
}
