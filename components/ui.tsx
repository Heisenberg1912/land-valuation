"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Info } from "lucide-react";

export function Button(props: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "ghost" | "outline" }) {
  const { className = "", variant = "primary", ...rest } = props;
  const base =
    "inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-black transition active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-widest";
  const styles =
    variant === "primary"
      ? "bg-[color:var(--accent)] text-[color:var(--accent-contrast)] hover:opacity-90 shadow-md shadow-black/10"
      : variant === "outline"
        ? "border-2 border-[color:var(--line)] bg-[color:var(--card)] text-[color:var(--text)] hover:bg-[color:var(--card-weak)]"
        : "bg-transparent text-[color:var(--text)] hover:bg-[color:var(--pill)]";
  return (
    <motion.button 
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={`${base} ${styles} ${className}`} 
      {...rest as any} 
    />
  );
}

export function Pill({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={`inline-flex items-center rounded-xl border border-[color:var(--line)] bg-[color:var(--pill)] px-3 py-1 text-[10px] font-black text-[color:var(--muted)] tracking-widest ${className}`}>
      {children}
    </span>
  );
}

export function Card({ children, className = "", ...rest }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={`relative overflow-hidden bg-[color:var(--card)] border border-[color:var(--line)] rounded-[2rem] shadow-sm p-6 transition-all duration-300 hover:shadow-md ${className}`} {...rest}>
      {children}
    </div>
  );
}

export function Accordion({ title, icon, defaultOpen = false, children, extra }: { title: string, icon?: React.ReactNode, defaultOpen?: boolean, children: React.ReactNode, extra?: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="rounded-[2.5rem] border border-[color:var(--line)] bg-[color:var(--card)] shadow-sm overflow-hidden transition-all hover:border-[color:var(--accent)]/10">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between p-6 text-left transition-colors hover:bg-[color:var(--card-weak)]"
      >
        <div className="flex items-center gap-4">
          {icon && <div className="p-3 rounded-2xl bg-[color:var(--card-weak)] text-[color:var(--accent)]">{icon}</div>}
          <div>
            <span className="font-black text-[color:var(--text)] text-lg tracking-tight uppercase">{title}</span>
            {extra && <div className="mt-1">{extra}</div>}
          </div>
        </div>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.3 }}
          className="text-[color:var(--muted)]"
        >
          <ChevronDown size={24} strokeWidth={3} />
        </motion.div>
      </button>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="border-t border-[color:var(--line)] p-8 bg-[color:var(--card)]">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function Spinner() {
  return (
    <div className="inline-flex items-center gap-3">
      <div className="relative h-5 w-5 flex items-center justify-center">
        <motion.span
          className="absolute h-5 w-5 rounded-full border-2 border-transparent border-t-white"
          animate={{ rotate: 360 }}
          transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
        />
        <motion.span
          className="absolute h-3 w-3 rounded-full border-2 border-transparent border-b-white/60"
          animate={{ rotate: -360 }}
          transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
        />
      </div>
      <span className="text-sm font-black uppercase tracking-widest">Analyzing…</span>
    </div>
  );
}
