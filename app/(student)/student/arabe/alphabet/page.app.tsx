"use client";

/**
 * MON ALBUM DES LETTRES — l'écran où un enfant vient ÉCOUTER une lettre, et
 * voir celles qu'il a gagnées.
 *
 * Il double le parcours, et ce n'est pas un doublon : le parcours enseigne
 * quatre lettres à la fois et verrouille le reste ; ici, tout est ouvert,
 * rien n'est noté. C'est l'affiche de la classe — on cherche le ع parce qu'on
 * l'a oublié, on l'écoute trois fois, on repart.
 *
 * UN ALBUM, POUR QU'IL AIT ENVIE DE LE REMPLIR. Chaque lettre d'une leçon
 * terminée devient un AUTOCOLLANT doré avec son image (أ comme أَسَد 🦁) ; les
 * autres attendent en blanc, sans cadenas — on peut toujours les écouter.
 *
 * TOUT SE DIT. Toucher une lettre dit son nom, puis son mot-image. Les
 * détails d'écriture (les quatre formes) sont rangés « pour les grands » :
 * un débutant apprend d'abord la lettre seule.
 */

import { useMemo, useState } from "react";
import Link from "next/link";
import { useQuery } from "convex/react";
import { ArrowLeft, Star } from "lucide-react";
import { api } from "@/convex/_generated/api";
import { ARABIC_LETTERS, getLetter, type ArabicLetterKey } from "@/convex/arabic/alphabet";
import { ARABIC_LESSONS } from "@/convex/arabic/curriculum";
import { CONSIGNES } from "@/convex/arabic/consignes";
import { LETTER_WORDS } from "@/convex/arabic/letterWords";
import { ArabicGlyph } from "@/components/arabic/arabic-glyph";
import { CoachLine } from "@/components/arabic/coach";
import { LetterTile, WordTile } from "@/components/arabic/drills";
import { LetterCard } from "@/components/arabic/letter-card";
import { speech, useSpeech } from "@/components/arabic/speech";
import { arabicCopy } from "@/lib/arabic/copy";
import { QuranLoader } from "@/components/arabic/quran-loader";

export default function ArabicAlphabetPage() {
  const path = useQuery(api.arabic.lessons.getPath);
  const { say } = useSpeech();
  const [selected, setSelected] = useState<ArabicLetterKey>("alif");

  const learned = useMemo(() => {
    const done = new Set(
      (path?.progress ?? []).filter((row) => row.status === "completed").map((row) => row.lessonKey),
    );
    return new Set(
      ARABIC_LESSONS.filter((lesson) => lesson.kind === "alphabet" && done.has(lesson.key)).flatMap(
        (lesson) => lesson.letters as ArabicLetterKey[],
      ),
    );
  }, [path]);

  if (path === undefined) return <QuranLoader message={arabicCopy.loading.album} />;

  if (!path.enabled) {
    return (
      <div className="mx-4 max-w-md rounded-3xl border-2 border-amber-200 bg-white p-8 text-center shadow-sm sm:mx-auto">
        <h1 className="font-display text-xl font-extrabold text-gray-900">{arabicCopy.notEnabled.title}</h1>
        <p className="mt-2 text-base text-gray-600">{arabicCopy.notEnabled.body}</p>
      </div>
    );
  }

  const letter = getLetter(selected);

  function choose(key: ArabicLetterKey) {
    setSelected(key);
    void say([speech.letter(key), speech.word(key)]);
    // La fiche est sous la grille : sans ce défilement, un enfant touche une
    // lettre et croit qu'il ne s'est rien passé.
    window.requestAnimationFrame(() =>
      document.getElementById("fiche-lettre")?.scrollIntoView({ behavior: "smooth", block: "start" }),
    );
  }

  return (
    <div className="space-y-5 px-4 sm:px-0">
      <div className="flex items-center gap-3">
        <Link
          href="/student/arabe"
          aria-label="Revenir au chemin"
          className="btn-chunky flex h-11 w-11 shrink-0 items-center justify-center rounded-full border-[3px] border-white bg-gradient-to-b from-amber-50 to-amber-200 text-amber-900"
          style={{ "--btn-depth": "#c9a35a" } as React.CSSProperties}
        >
          <ArrowLeft className="h-6 w-6" strokeWidth={3} aria-hidden />
        </Link>
        <h1 className="font-display flex-1 text-2xl font-extrabold text-gray-900">Mon album</h1>
        <span className="flex items-center gap-1 rounded-full bg-amber-100 px-3 py-1.5 font-display font-extrabold text-amber-800">
          <Star className="h-5 w-5 fill-amber-400 text-amber-500" aria-hidden />
          {learned.size}/28
        </span>
      </div>

      <CoachLine pose="salam" size={90} line={CONSIGNES.album} say={[speech.consigne("album")]} />

      <div dir="rtl" lang="ar" className="grid grid-cols-4 gap-2.5 sm:grid-cols-7">
        {ARABIC_LETTERS.map((item) => {
          const active = item.key === selected;
          const won = learned.has(item.key);
          return (
            <button
              key={item.key}
              type="button"
              onClick={() => choose(item.key)}
              aria-pressed={active}
              aria-label={`${item.nameFr}${won ? ", autocollant gagné" : ""}`}
              className={`btn-chunky relative flex min-h-[4.5rem] items-center justify-center rounded-2xl border-[3px] transition-transform active:scale-95 ${
                active
                  ? "border-white bg-gradient-to-b from-teal-400 to-teal-600 text-white"
                  : won
                    ? "border-white bg-gradient-to-b from-amber-200 to-amber-400 text-amber-950"
                    : "border-gray-100 bg-white text-gray-800"
              }`}
              style={{ "--btn-depth": active ? "#115e59" : won ? "#b45309" : "#e5e7eb" } as React.CSSProperties}
            >
              <ArabicGlyph text={item.isolated} className="h-12 w-12" />
              {won && (
                <span aria-hidden className="absolute -right-1.5 -top-1.5 flex h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-white text-base shadow">
                  {LETTER_WORDS[item.key].emoji}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {letter && (
        <div id="fiche-lettre" className="scroll-mt-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <LetterTile letterKey={selected} onPress={() => void say([speech.letter(selected)])} />
            <WordTile letterKey={selected} onPress={() => void say([speech.word(selected)])} />
          </div>

          <details className="rounded-3xl border-2 border-gray-100 bg-white/70 p-3">
            <summary className="cursor-pointer font-display text-sm font-extrabold text-gray-500">
              Pour les grands : ses quatre formes
            </summary>
            <div className="mt-3">
              <LetterCard letter={letter} />
            </div>
          </details>
        </div>
      )}
    </div>
  );
}
