"use client";

import { Quote } from "lucide-react";
import { PromptReaderButton, usePromptReader } from "./prompt-reader";

/**
 * Renders an exercise prompt with a clean two-part layout when it contains
 * a quoted sentence (e.g. 'Trouve le temps du verbe : "Aujourd'hui, nous jouons."').
 *
 * Splits on the first ':' or '—' and, if the trailing part is an explicit
 * quoted sentence, displays the instruction on top and the sentence below
 * in a highlighted card.
 *
 * Inside a `PromptReaderProvider` (pupils who are learning to read, CI/CP),
 * a big 🔊 button sits before the prompt and Pio reads it aloud; the text
 * is tinted while he speaks. Elsewhere (older pupils, teacher previews) the
 * prompt renders exactly as before.
 */
export default function ExercisePrompt({ prompt }: { prompt: string }) {
  const reader = usePromptReader();
  const text = <PromptText prompt={prompt} />;
  if (!reader) return text;

  return (
    <div className="flex items-start gap-3">
      <PromptReaderButton reader={reader} />
      <div
        className={`min-w-0 flex-1 rounded-2xl transition-colors duration-300 ${
          reader.status === "playing" ? "bg-sky-50" : ""
        }`}
      >
        {text}
      </div>
    </div>
  );
}

function PromptText({ prompt }: { prompt: string }) {
  const { instruction, quoted } = parsePrompt(prompt);

  if (!quoted) {
    return (
      <p className="text-xl font-bold text-gray-900 leading-relaxed">
        {prompt}
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-xl font-bold text-gray-900 leading-relaxed">
        {instruction}
      </p>
      <div className="flex items-start gap-3 rounded-2xl border-2 border-indigo-100 bg-indigo-50/70 px-5 py-4">
        <Quote className="mt-1 h-5 w-5 flex-shrink-0 text-indigo-400" />
        <p className="text-lg font-medium text-indigo-900 italic leading-relaxed">
          {quoted}
        </p>
      </div>
    </div>
  );
}

function parsePrompt(prompt: string): {
  instruction: string;
  quoted: string | null;
} {
  // Strategy 1 — look for a balanced quoted passage using the FIRST opening
  // quote and the LAST matching closing quote. This handles apostrophes
  // inside the quoted sentence (e.g. "Aujourd'hui, nous jouons.")
  const quoteCandidates: Array<{ open: string; close: string }> = [
    { open: "«", close: "»" },
    { open: "\u201C", close: "\u201D" }, // “ ”
    { open: '"', close: '"' },
    { open: "\u2018", close: "\u2019" }, // ‘ ’
    { open: "'", close: "'" },
  ];

  for (const { open, close } of quoteCandidates) {
    const first = prompt.indexOf(open);
    const last = prompt.lastIndexOf(close);
    if (first === -1 || last === -1 || last - first < 5) continue;
    if (open === close && first === last) continue;
    // For symmetric quotes (same open == close) we need at least 2 occurrences
    const quoted = prompt.slice(first + open.length, last).trim();
    if (!quoted || quoted.length < 4) continue;
    const before = prompt.slice(0, first).trim();
    const cleaned = before.replace(/[:—-]+\s*$/u, "").trim();
    if (cleaned.length > 0) {
      return { instruction: cleaned, quoted };
    }
  }

  // Strategy 2 — split on the first colon if the part after looks like a
  // sentence ending with punctuation (. ! ?)
  const colonIndex = prompt.indexOf(":");
  if (colonIndex > 10 && colonIndex < prompt.length - 5) {
    const instruction = prompt.slice(0, colonIndex).trim();
    const rest = prompt.slice(colonIndex + 1).trim();
    if (/[.!?]$/.test(rest) && rest.length > 5) {
      return { instruction, quoted: rest };
    }
  }

  return { instruction: prompt, quoted: null };
}
