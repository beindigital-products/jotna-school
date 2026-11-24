"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";

/**
 * Un code à recopier ou à dicter (code de connexion, code élève, code école).
 * Police à chasse fixe, gros caractères, bouton copier.
 */
export function CodeChip({
  code,
  size = "md",
  label,
}: {
  code: string;
  size?: "sm" | "md" | "lg";
  label?: string;
}) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* presse-papiers indisponible : le code reste lisible à l'écran */
    }
  }

  const text =
    size === "lg" ? "text-xl sm:text-2xl" : size === "sm" ? "text-sm" : "text-base";

  return (
    <span className="inline-flex max-w-full items-center gap-1 rounded-xl border border-stone-200 bg-white pl-3 print:border-0 print:pl-0">
      {label && <span className="sr-only">{label} : </span>}
      <span
        className={`break-all font-mono font-semibold tracking-wider text-stone-900 ${text}`}
      >
        {code}
      </span>
      <button
        type="button"
        onClick={copy}
        className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-stone-600 outline-none hover:bg-stone-100 hover:text-stone-900 focus-visible:ring-2 focus-visible:ring-stone-900 print:hidden"
        aria-label={copied ? "Copié" : `Copier ${label ?? "le code"}`}
      >
        {copied ? (
          <Check className="h-4 w-4 text-emerald-700" aria-hidden />
        ) : (
          <Copy className="h-4 w-4" aria-hidden />
        )}
      </button>
      <span role="status" className="sr-only">
        {copied ? "Code copié" : ""}
      </span>
    </span>
  );
}
