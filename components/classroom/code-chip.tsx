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
    size === "lg" ? "text-2xl" : size === "sm" ? "text-sm" : "text-base";

  return (
    <span className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-gray-50 py-1 pl-3 pr-1">
      <span
        className={`font-mono font-semibold tracking-wider text-gray-900 ${text}`}
        aria-label={label}
      >
        {code}
      </span>
      <button
        type="button"
        onClick={copy}
        className="rounded-md p-1.5 text-gray-500 hover:bg-gray-200 hover:text-gray-800"
        aria-label={copied ? "Copié" : `Copier ${label ?? "le code"}`}
        title={copied ? "Copié" : "Copier"}
      >
        {copied ? (
          <Check className="h-4 w-4 text-emerald-600" />
        ) : (
          <Copy className="h-4 w-4" />
        )}
      </button>
    </span>
  );
}
