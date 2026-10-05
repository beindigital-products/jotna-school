"use node";

/**
 * LA VOIX DU MODULE — faire entendre l'arabe, et écouter l'enfant le redire.
 *
 * DEUX ACTIONS, DEUX SENS :
 *   - `speak` fabrique l'audio d'un texte du parcours (nom de lettre,
 *     syllabe, mot, verset, mot-image d'une lettre) ou d'une CONSIGNE en
 *     français (`consignes.ts`, même voix), et rend une URL. Le
 *     résultat est MIS EN CACHE :
 *     le texte du module est fini, donc chaque son n'est payé qu'une fois pour
 *     toutes les écoles et tous les enfants ;
 *   - `verifyPronunciation` reçoit quelques secondes d'enregistrement, les
 *     fait transcrire, compare à ce qui était attendu (`matching.ts`) et rend
 *     un verdict.
 *
 * LE FOURNISSEUR EST ELEVENLABS. C'est ce que demandait la commande (« une
 * belle voix en arabe, douce et compréhensible ») : leur modèle multilingue
 * lit l'arabe vocalisé, et leur transcription (Scribe) le rend. Tout passe par
 * `voiceConfig()` (`convex/voice/elevenlabs.ts`, partagé avec le lecteur de
 * consignes des exercices) — clé, voix, modèles — de sorte que chaque
 * identifiant ait sa valeur en un seul endroit, surchargeable par
 * l'environnement, et qu'un changement de fournisseur se fasse là seulement.
 *
 * RIEN NE MARCHE SANS CLÉ, ET RIEN NE CASSE NON PLUS. Sans
 * `ELEVENLABS_API_KEY`, les deux actions rendent un état « indisponible » que
 * l'écran sait afficher : la leçon continue sans le son, l'enfant lit la
 * translittération et s'auto-évalue. Un module d'apprentissage qui tombe en
 * panne parce qu'une variable d'environnement manque n'est pas acceptable dans
 * une salle de classe.
 *
 * ON NE SYNTHÉTISE QUE CE QUE LE PARCOURS CONTIENT. Les actions prennent une
 * RÉFÉRENCE (une lettre, un item de leçon), jamais un texte libre, et
 * résolvent le texte ici, depuis `alphabet.ts` et `curriculum.ts`. Exposer
 * « dis ce que je te donne » ferait de ce dépôt un générateur de voix gratuit
 * pour qui possède un compte élève.
 *
 * LA VOIX DE L'ENFANT NE SE POSE NULLE PART. Les octets arrivent en argument,
 * partent en transcription, et disparaissent avec la fin de l'action : ni
 * stockage, ni table, ni journal. Même la transcription n'est pas écrite — on
 * la rend à l'écran pour que l'enfant voie ce qui a été entendu, et elle
 * s'efface avec la page. Ce qui reste en base est ce qu'un cahier garderait :
 * la date, l'exercice, et si c'était juste.
 *
 * `"use node"` : ce fichier n'exporte QUE des actions (guidelines du dépôt) —
 * ses lectures et écritures vivent dans `./db.ts`. Le runtime Node garantit
 * `fetch`, `FormData` et `Blob`, dont dépend l'envoi multipart de l'audio.
 */

import { v } from "convex/values";
import { action, internalAction } from "../_generated/server";
import { internal } from "../_generated/api";
import { getAuthUserId } from "@convex-dev/auth/server";
import type { Id } from "../_generated/dataModel";
import { getLetter } from "./alphabet";
import { isConsigneKey, spokenConsigne } from "./consignes";
import { getLesson } from "./curriculum";
import { letterWord } from "./letterWords";
import {
  acceptedFormsForLetter,
  judgePronunciation,
  judgeReading,
  judgeRecitation,
  latinFormsForLetter,
  type LatinForms,
  type PronunciationVerdict,
} from "./matching";
import {
  API_BASE,
  clipCacheKey,
  synthesize,
  voiceConfig,
  voiceFor,
  type VoiceConfig,
} from "../voice/elevenlabs";

/**
 * Deux mégaoctets d'audio, soit très largement les huit secondes que l'écran
 * s'autorise à enregistrer. Au-delà, on refuse sans appeler : ce n'est plus un
 * enfant qui répète une lettre.
 */
const MAX_AUDIO_BYTES = 2_000_000;

/** Les formats qu'un navigateur produit avec `MediaRecorder`. */
const ALLOWED_MIME: Readonly<Record<string, string>> = {
  "audio/webm": "webm",
  "audio/ogg": "ogg",
  "audio/mp4": "mp4",
  "audio/mpeg": "mp3",
  "audio/wav": "wav",
};

// ---------------------------------------------------------------------------
// Références de texte — ce qu'on accepte de faire dire.
// ---------------------------------------------------------------------------

const refValidator = v.union(
  v.object({
    kind: v.literal("letterName"),
    letterKey: v.string(),
  }),
  v.object({
    kind: v.literal("letterSyllable"),
    letterKey: v.string(),
    haraka: v.union(
      v.literal("fatha"),
      v.literal("kasra"),
      v.literal("damma"),
    ),
  }),
  v.object({
    kind: v.literal("lessonItem"),
    lessonKey: v.string(),
    itemKey: v.string(),
  }),
  // Une consigne française du catalogue fermé (`consignes.ts`).
  v.object({
    kind: v.literal("instruction"),
    key: v.string(),
  }),
  // Le mot-image d'une lettre : « أَسَد » pour أ (`letterWords.ts`).
  v.object({
    kind: v.literal("letterWord"),
    letterKey: v.string(),
  }),
);

type SpeechRef =
  | { kind: "letterName"; letterKey: string }
  | { kind: "letterSyllable"; letterKey: string; haraka: "fatha" | "kasra" | "damma" }
  | { kind: "lessonItem"; lessonKey: string; itemKey: string }
  | { kind: "instruction"; key: string }
  | { kind: "letterWord"; letterKey: string };

/** Ce qu'il faut dire, et dans quelle langue — donc avec quelle voix. */
type Speech = { text: string; lang: "ar" | "fr" };

/** Le texte désigné par une référence, ou `null` si elle ne désigne rien. */
function resolveSpeech(ref: SpeechRef): Speech | null {
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

// ---------------------------------------------------------------------------
// Action 1 — faire entendre
// ---------------------------------------------------------------------------

type SpeakResult =
  | { status: "ready"; url: string; cached: boolean }
  | {
      status: "unavailable";
      reason: "not_configured" | "not_allowed" | "unknown_text" | "provider_error";
    };

export const speak = action({
  args: { ref: refValidator },
  handler: async (ctx, args): Promise<SpeakResult> => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return { status: "unavailable", reason: "not_allowed" };

    const caller = await ctx.runQuery(internal.arabic.db.callerContext, {
      userId: userId as string,
    });
    if (!caller.enabled || !caller.profileId) {
      return { status: "unavailable", reason: "not_allowed" };
    }

    const speech = resolveSpeech(args.ref as SpeechRef);
    if (!speech) return { status: "unavailable", reason: "unknown_text" };
    const { text } = speech;

    const config = voiceConfig();
    if (!config) return { status: "unavailable", reason: "not_configured" };
    // Une seule voix par défaut, mais pas le même modèle en français et en arabe.
    const voice = voiceFor(config, speech.lang);

    const cacheKey = clipCacheKey(voice.voiceId, voice.modelId, text);

    const cached = await ctx.runQuery(internal.arabic.db.findClip, { cacheKey });
    if (cached) {
      const url = await ctx.storage.getUrl(cached.storageId);
      if (url) return { status: "ready", url, cached: true };
      // Le fichier a disparu du stockage sans que la ligne suive : on
      // resynthétise plutôt que de rendre une URL morte.
    }

    let audio: Blob;
    try {
      audio = await synthesize(text, config, voice);
    } catch (error) {
      console.error("[arabe] synthèse vocale en échec", error);
      return { status: "unavailable", reason: "provider_error" };
    }

    const storageId = await ctx.storage.store(audio);
    const saved: { storageId: Id<"_storage"> } = await ctx.runMutation(
      internal.arabic.db.saveClip,
      {
        cacheKey,
        text,
        voiceId: voice.voiceId,
        modelId: voice.modelId,
        storageId,
        bytes: audio.size,
      },
    );

    if (caller.isStudent) {
      await ctx.runMutation(internal.arabic.db.addTtsChars, {
        studentId: caller.profileId,
        chars: text.length,
      });
    }

    const url = await ctx.storage.getUrl(saved.storageId);
    if (!url) return { status: "unavailable", reason: "provider_error" };
    return { status: "ready", url, cached: false };
  },
});

/**
 * Les voix du compte ElevenLabs, pour choisir celle des consignes en
 * français. INTERNE : un outil de réglage, lancé à la main
 * (`npx convex run arabic/voice:listVoices`), jamais appelé par un écran.
 */
export const listVoices = internalAction({
  args: {},
  handler: async () => {
    const config = voiceConfig();
    if (!config) return [];
    const response = await fetch(`${API_BASE}/voices`, {
      headers: { "xi-api-key": config.apiKey },
    });
    if (!response.ok) return [];
    const payload = (await response.json()) as {
      voices?: Array<{
        voice_id: string;
        name: string;
        category?: string;
        labels?: Record<string, string>;
        verified_languages?: Array<{ language: string; accent?: string | null }>;
      }>;
    };
    return (payload.voices ?? []).map((voice) => ({
      id: voice.voice_id,
      name: voice.name,
      category: voice.category ?? null,
      labels: voice.labels ?? {},
      languages: (voice.verified_languages ?? []).map(
        (entry) => `${entry.language}${entry.accent ? `/${entry.accent}` : ""}`,
      ),
    }));
  },
});

// ---------------------------------------------------------------------------
// Action 2 — écouter l'enfant
// ---------------------------------------------------------------------------

type VerifyResult =
  | {
      status: "judged";
      verdict: PronunciationVerdict;
      score: number;
      /** Ce que la transcription a entendu — affiché, jamais écrit en base. */
      heard: string;
      /** Les mots du verset qui manquaient. Vide hors lecture suivie. */
      missing: string[];
      /**
       * Le mot sur lequel une RÉCITATION a décroché — « tu as buté ici ».
       * `null` partout ailleurs : lire un verset sous les yeux n'a pas de
       * point de rupture, seulement des mots manqués.
       */
      firstMiss: string | null;
      remaining: number;
    }
  | { status: "quota_reached" }
  | {
      status: "unavailable";
      reason:
        | "not_configured"
        | "not_allowed"
        | "unknown_text"
        | "audio_too_large"
        | "unsupported_format"
        | "provider_error";
    };

export const verifyPronunciation = action({
  args: {
    lessonKey: v.string(),
    itemKey: v.string(),
    drill: v.union(
      v.literal("pronounce"),
      v.literal("read"),
      v.literal("recite"),
    ),
    audio: v.bytes(),
    mimeType: v.string(),
    /** La crête de la jauge du micro côté appareil (0 à 1), pour le journal. */
    peakLevel: v.optional(v.number()),
  },
  handler: async (ctx, args): Promise<VerifyResult> => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return { status: "unavailable", reason: "not_allowed" };

    const caller = await ctx.runQuery(internal.arabic.db.callerContext, {
      userId: userId as string,
    });
    // Seul un ÉLÈVE s'enregistre : un professeur qui parcourt le module écoute
    // et lit, il n'a pas de progression où écrire une tentative.
    if (!caller.enabled || !caller.profileId || !caller.isStudent) {
      return { status: "unavailable", reason: "not_allowed" };
    }

    const extension = ALLOWED_MIME[baseMime(args.mimeType)];
    if (!extension) return { status: "unavailable", reason: "unsupported_format" };
    if (args.audio.byteLength > MAX_AUDIO_BYTES) {
      return { status: "unavailable", reason: "audio_too_large" };
    }

    const expected = resolveExpected(args.lessonKey, args.itemKey);
    if (!expected) return { status: "unavailable", reason: "unknown_text" };

    const config = voiceConfig();
    if (!config) return { status: "unavailable", reason: "not_configured" };

    // Le jeton se prend AVANT l'appel — voir `db.consumeSttQuota`.
    const quota = await ctx.runMutation(internal.arabic.db.consumeSttQuota, {
      studentId: caller.profileId,
    });
    if (!quota.allowed) return { status: "quota_reached" };

    let transcript: string;
    try {
      transcript = await transcribe(
        args.audio,
        baseMime(args.mimeType),
        extension,
        config,
      );
    } catch (error) {
      console.error("[arabe] transcription en échec", error);
      return { status: "unavailable", reason: "provider_error" };
    }

    // LA FAMILLE D'EXERCICE DÉCIDE DU JUGE, pas la forme du texte. Réciter de
    // mémoire « وَالْعَصْرِ » — un verset d'un seul mot — reste de la
    // récitation : l'ordre y compte, le seuil y est plus haut, et le juger
    // comme un mot lu appellerait « mémorisé » ce qui ne l'est pas.
    // Une lettre ne se récite pas : `expected` n'est jamais « letter » pour une
    // leçon de mémorisation (elles n'ont pas de lettres), mais la famille vient
    // du client — on rend alors un texte vide, que le juge refuse proprement.
    const recitation =
      args.drill === "recite"
        ? judgeRecitation({
            expected: expected.kind === "letter" ? "" : expected.text,
            transcript,
          })
        : null;

    const judgement =
      recitation ??
      (expected.kind === "letter"
        ? judgePronunciation({
            accepted: expected.accepted,
            transcript,
            requireGlyph: expected.glyph,
            latin: expected.latin,
          })
        : expected.kind === "word"
          ? judgePronunciation({
              accepted: [expected.text],
              transcript,
            })
          : judgeReading({ expected: expected.text, transcript }));

    const missing = "missing" in judgement ? judgement.missing : [];
    const firstMiss = recitation?.firstMiss ?? null;

    // Une ligne TECHNIQUE par essai, jamais le contenu : elle suffit à dire si
    // l'audio était vide ou illisible, ou si la transcription a répondu en
    // latin, quand un adulte signale que « l'appli n'entend pas ».
    console.log(
      `[arabe] essai ${args.drill} « ${args.itemKey} » : ${args.audio.byteLength} o, ` +
        `${baseMime(args.mimeType)} (${audioContainer(args.audio)}), crête ` +
        `${args.peakLevel === undefined ? "inconnue" : args.peakLevel.toFixed(3)}, transcription de ` +
        `${transcript.trim().length} caractères (${scriptOf(transcript)}), verdict ${judgement.verdict}`,
    );
    await ctx.runMutation(internal.arabic.db.recordServerAttempt, {
      studentId: caller.profileId,
      lessonKey: args.lessonKey,
      drill: args.drill,
      itemKey: args.itemKey,
      // « Presque » compte comme réussi pour la PROGRESSION — l'enfant a
      // produit un son reconnaissable — mais la NOTE garde la nuance, et
      // c'est elle qui décide des étoiles.
      correct: judgement.verdict !== "retry",
      score: judgement.score,
      verdict: judgement.verdict,
    });

    return {
      status: "judged",
      verdict: judgement.verdict,
      score: judgement.score,
      heard: judgement.heard,
      missing,
      firstMiss,
      remaining: quota.remaining,
    };
  },
});

/** « audio/webm;codecs=opus » → « audio/webm ». */
function baseMime(mimeType: string): string {
  return mimeType.split(";")[0].trim().toLowerCase();
}

/** Le conteneur réel, lu dans les premiers octets : le type annoncé peut mentir. */
function audioContainer(audio: ArrayBuffer): string {
  const head = new Uint8Array(audio.slice(0, 12));
  const ascii = (from: number, to: number) => String.fromCharCode(...head.slice(from, to));
  if (ascii(4, 8) === "ftyp") return "mp4";
  if (head[0] === 0x1a && head[1] === 0x45 && head[2] === 0xdf && head[3] === 0xa3) return "webm";
  if (ascii(0, 4) === "OggS") return "ogg";
  if (ascii(0, 4) === "RIFF") return "wav";
  if (ascii(0, 3) === "ID3" || (head[0] === 0xff && (head[1] & 0xe0) === 0xe0)) return "mp3";
  return "inconnu";
}

/** L'écriture d'une transcription, sans en garder un mot. */
function scriptOf(text: string): "vide" | "arabe" | "latin" | "autre" {
  if (text.trim().length === 0) return "vide";
  if (/[؀-ۿ]/.test(text)) return "arabe";
  if (/[A-Za-z]/.test(text)) return "latin";
  return "autre";
}

type Expected =
  | { kind: "letter"; accepted: string[]; glyph: string; latin: LatinForms }
  | { kind: "word"; text: string }
  | { kind: "ayah"; text: string };

/**
 * Ce qui était attendu, et COMMENT le juger.
 *
 * Trois régimes, parce qu'on ne juge pas de la même façon une lettre, un mot
 * et un verset : une lettre a plusieurs réponses justes (son nom, sa syllabe)
 * et une garde sur le glyphe ; un mot n'en a qu'une ; un verset se compte mot
 * à mot (`judgeReading`).
 */
function resolveExpected(lessonKey: string, itemKey: string): Expected | null {
  const lesson = getLesson(lessonKey);
  if (!lesson) return null;

  if ((lesson.letters as readonly string[]).includes(itemKey)) {
    const letter = getLetter(itemKey);
    if (!letter) return null;
    return {
      kind: "letter",
      accepted: acceptedFormsForLetter(letter),
      glyph: letter.isolated,
      // Un nom de lettre transcrit « Jim » ou « Cuff » : voir `latinSkeleton`.
      latin: latinFormsForLetter(letter),
    };
  }

  const item = lesson.items.find((candidate) => candidate.key === itemKey);
  if (!item) return null;

  return item.ar.includes(" ")
    ? { kind: "ayah", text: item.ar }
    : { kind: "word", text: item.ar };
}

/** Envoie l'audio à la transcription et rend le texte reconnu. */
async function transcribe(
  audio: ArrayBuffer,
  mimeType: string,
  extension: string,
  config: VoiceConfig,
): Promise<string> {
  const form = new FormData();
  form.append("file", new Blob([audio], { type: mimeType }), `voix.${extension}`);
  form.append("model_id", config.sttModel);
  form.append("language_code", config.sttLanguage);
  // On ne veut ni les « [rires] » ni la séparation des locuteurs : un seul
  // enfant parle, et ces annotations pollueraient la comparaison.
  form.append("tag_audio_events", "false");
  form.append("diarize", "false");

  const response = await fetch(`${API_BASE}/speech-to-text`, {
    method: "POST",
    headers: { "xi-api-key": config.apiKey },
    body: form,
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(
      `elevenlabs stt ${response.status}: ${detail.slice(0, 200)}`,
    );
  }

  const payload = (await response.json()) as { text?: unknown };
  return typeof payload.text === "string" ? payload.text : "";
}
