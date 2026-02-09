"use client";

import React from "react";

export function Button(props: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "ghost" | "outline" }) {
  const { className = "", variant = "primary", ...rest } = props;
  const base =
    "inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-semibold transition active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed";
  const styles =
    variant === "primary"
      ? "bg-[color:var(--accent)] text-[color:var(--accent-contrast)] hover:opacity-90"
      : variant === "outline"
        ? "border border-[color:var(--line)] bg-[color:var(--card)] text-[color:var(--text)] hover:bg-[color:var(--pill)]"
        : "bg-transparent text-[color:var(--text)] hover:bg-[color:var(--pill)]";
  return <button className={`${base} ${styles} ${className}`} {...rest} />;
}

export function Pill({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={`inline-flex items-center rounded-full border border-[color:var(--line)] bg-[color:var(--pill)] px-3 py-1 text-xs font-medium text-[color:var(--muted)] ${className}`}>
      {children}
    </span>
  );
}

export function SectionTitle({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-3">
      <div className="text-xs font-semibold tracking-wide text-[color:var(--muted)]">{title.toUpperCase()}</div>
      {subtitle ? <div className="mt-1 text-sm text-[color:var(--text)]">{subtitle}</div> : null}
    </div>
  );
}

export function Field({ label, value }: { label: string; value?: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-black/5 py-2 last:border-b-0">
      <div className="text-sm text-[color:var(--muted)]">{label}</div>
      <div className="text-sm font-semibold text-[color:var(--text)] text-right">{value ?? <span className="font-medium text-[color:var(--muted)]">-</span>}</div>
    </div>
  );
}

export function Card({ children, className = "", ...rest }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={`card min-w-0 p-4 ${className}`} {...rest}>
      {children}
    </div>
  );
}

export function Spinner() {
  return (
    <div className="inline-flex items-center gap-2 text-sm text-black/60">
      <span className="h-4 w-4 animate-spin rounded-full border-2 border-black/20 border-t-black/70" />
      <span>Analyzing…</span>
    </div>
  );
}
