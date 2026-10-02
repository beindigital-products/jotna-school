/**
 * CE QU'UNE RÉFÉRENCE FAIT DIRE — le texte d'un son du module d'arabe, et sa
 * langue (donc sa voix).
 *
 * Module pur, partagé par la synthèse à la demande (`voice.ts`) et le
 * téléchargement des sons pour le hors-ligne (`offline/voice.ts`) : une même
 * référence donne le même texte, donc le même fichier en cache.
 *
 * ON NE SYNTHÉTISE QUE CE QUE LE PARCOURS CONTIENT. Une référence désigne une
 * lettre, un item de leçon, une consigne du catalogue fermé — jamais un texte
 * libre (`voice.ts` dit pourquoi).
 */
import { ARABIC_LETTERS, HARAKAT, getLetter } from "./alphabet";
import { CONSIGNES, isConsigneKey, spokenConsigne, type ConsigneKey } from "./consignes";
import { ARABIC_LESSONS, getLesson } from "./curriculum";
import { letterWord } from "./letterWords";

export type SpeechRef =
  | { kind: "letterName"; letterKey: string }
  | { kind: "letterSyllable"; letterKey: string; haraka: "fatha" | "kasra" | "damma" }
  | { kind: "lessonItem"; lessonKey: string; itemKey: string }
  | { kind: "instruction"; key: string }
  | { kind: "letterWord"; letterKey: string };

/** Ce qu'il faut dire, et dans quelle langue — donc avec quelle voix. */
export type Speech = { text: string; lang: "ar" | "fr" };

/** Le texte désigné par une référence, ou `null` si elle ne désigne rien. */
export function resolveSpeech(ref: SpeechRef): Speech | null {
  const ar = (text: string | null | undefined): Speech | null =>
    text ? { text, lang: "ar" } : null;

  if (ref.kind === "instruction") {
    return isConsigneKey(ref.key) ? { text: spokenConsigne(ref.key), lang: "fr" } : null;
  }
  if (ref.kind === "letterWord") {
    return ar(letterWord(ref.letterKey)?.ar);
  }
  if (ref.kind === "letterName") {
    return ar(getLetter(ref.letterKey)?.nameAr);
  }
  if (ref.kind === "letterSyllable") {
    const letter = getLetter(ref.letterKey);
    return ar(letter ? letter.syllables[ref.haraka] : null);
  }
  const lesson = getLesson(ref.lessonKey);
  if (!lesson) return null;

  const item = lesson.items.find((candidate) => candidate.key === ref.itemKey);
  if (item) return ar(item.ar);

  // Une leçon d'alphabet n'a pas d'items : ses « items » sont ses lettres, et
  // l'écran demande le NOM quand il désigne une lettre.
  if ((lesson.letters as readonly string[]).includes(ref.itemKey)) {
    return ar(getLetter(ref.itemKey)?.nameAr);
  }
  return null;
}

/**
 * TOUS LES SONS DU MODULE : ce que l'application télécharge pour que le
 * module se joue sans réseau. Le texte du module est fini — consignes,
 * lettres, syllabes, mots-images, items de lecture — et c'est ce qui rend le
 * téléchargement possible : la liste se calcule depuis le code, sans
 * demander au serveur ce qui existe.
 */
export function allSpeechRefs(): SpeechRef[] {
  const refs: SpeechRef[] = [];
  for (const key of Object.keys(CONSIGNES) as ConsigneKey[]) {
    refs.push({ kind: "instruction", key });
  }
  for (const letter of ARABIC_LETTERS) {
    refs.push({ kind: "letterName", letterKey: letter.key });
    for (const haraka of HARAKAT) {
      refs.push({ kind: "letterSyllable", letterKey: letter.key, haraka: haraka.key });
    }
    if (letterWord(letter.key)) refs.push({ kind: "letterWord", letterKey: letter.key });
  }
  for (const lesson of ARABIC_LESSONS) {
    for (const item of lesson.items) {
      refs.push({ kind: "lessonItem", lessonKey: lesson.key, itemKey: item.key });
    }
    for (const letterKey of lesson.letters) {
      refs.push({ kind: "lessonItem", lessonKey: lesson.key, itemKey: letterKey });
    }
  }
  return refs.filter((ref) => resolveSpeech(ref) !== null);
}
