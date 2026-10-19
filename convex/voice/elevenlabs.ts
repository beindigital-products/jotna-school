/**
 * LA VOIX DE PIO — le fournisseur, sa configuration, et la synthèse.
 *
 * Deux écrans font parler Pio : le module d'arabe (`convex/arabic/voice.ts`,
 * qui écoute aussi l'enfant) et le lecteur de consignes des exercices
 * (`convex/voice/exercisePrompt.ts`). Tous deux passent par ici, de sorte que
 * chaque identifiant — clé, voix, modèles — ait sa valeur en un seul endroit,
 * surchargeable par l'environnement, et qu'un changement de fournisseur se
 * fasse dans ce seul fichier. Le mode d'emploi est dans
 * `docs/module-arabe-coran.md`.
 *
 * LE FOURNISSEUR EST ELEVENLABS. C'est ce que demandait la commande (« une
 * belle voix en arabe, douce et compréhensible ») : leur modèle multilingue
 * lit l'arabe vocalisé comme le français, et leur transcription (Scribe)
 * rend l'arabe.
 *
 * PAS DE `"use node"` : `fetch`, `Blob` et `process.env` existent dans le
 * runtime par défaut de Convex. Les actions Node (`arabic/voice.ts`) comme
 * celles du runtime par défaut importent donc ce module.
 */

export const API_BASE = "https://api.elevenlabs.io/v1";

/**
 * Le modèle de synthèse de l'arabe.
 *
 * `eleven_multilingual_v2` lit l'arabe vocalisé et respecte les voyelles
 * brèves — c'est ce qui compte ici : un modèle qui les ignore prononcerait
 * « بَ » et « بِ » de la même façon, et le niveau 2 du parcours n'aurait plus
 * d'objet. Surchargeable par `ELEVENLABS_MODEL_ID`.
 */
const DEFAULT_TTS_MODEL = "eleven_multilingual_v2";

/**
 * Le modèle des phrases en français : `eleven_v4`.
 *
 * LE 5 OCTOBRE 2026, LE PROPRIÉTAIRE A TROUVÉ LA VOIX DES CONSIGNES « trop
 * robotique, très IA ». Le modèle y est pour beaucoup : sur la même consigne,
 * les mêmes voix ne varient que de 4 à 7 demi-tons avec
 * `eleven_multilingual_v2`, et de 10,5 à 12 avec `eleven_v4`, le modèle le
 * plus expressif d'ElevenLabs.
 *
 * L'ARABE RESTE SUR `DEFAULT_TTS_MODEL`. `eleven_v4` garde trois voyelles
 * distinctes, mais moins séparées : 3,5 Bark entre les deux plus proches de
 * بَ بِ بُ pour la voix retenue, contre 4,3 avec l'ancien modèle (formants F1
 * et F2 mesurés). Et une des voix essayées y disait جِيم avec un g dur
 * (« Game » pour `scribe_v2`, quatre prises sur quatre). L'enfant copie ce
 * qu'il entend : l'arabe garde le modèle qui a fait ses preuves, et seul le
 * français (consignes du module, lecteur de consignes des exercices) passe
 * sur `eleven_v4`. Une voix, deux modèles (`voiceFor`). Surchargeable par
 * `ELEVENLABS_FR_MODEL_ID`.
 */
const DEFAULT_FR_TTS_MODEL = "eleven_v4";

/**
 * Le modèle de transcription par défaut.
 *
 * ElevenLabs a déprécié `scribe_v1`. Le 28 septembre 2026, les deux modèles
 * ont transcrit les mêmes enregistrements (بَاء, تَاء, des syllabes, un verset)
 * de façon identique une fois le texte passé par `normalizeArabic` : seules la
 * ponctuation et une hamza finale différaient. Surchargeable par
 * `ELEVENLABS_STT_MODEL_ID`.
 */
const DEFAULT_STT_MODEL = "scribe_v2";

/**
 * La voix par défaut : Steve (« Steve – Soft and Calm »), une voix d'homme
 * française, jeune, douce et posée. Elle dit TOUT, les consignes en français
 * comme l'arabe du parcours : Pio n'a qu'une voix (`voiceConfig`).
 *
 * ELLE REMPLACE OMAR LE 5 OCTOBRE 2026. Le propriétaire trouvait les
 * consignes « trop robotiques » et voulait une voix « rassurante, douce,
 * naturelle » ; le 28 septembre, il avait demandé une voix d'homme
 * (« agréable, douce, mais une voix d'homme »). Dix voix d'homme françaises
 * de la bibliothèque, et Omar, ont lu la même consigne sur `eleven_v4`, puis
 * quatre finalistes ont lu l'arabe du module. Steve a été retenu sur quatre
 * mesures :
 * - l'intonation : 10,6 demi-tons d'étendue sur la consigne, contre 6,9 pour
 *   la même voix sur l'ancien modèle ;
 * - le volume : son français (`eleven_v4`) et son arabe
 *   (`eleven_multilingual_v2`) sortent tous deux autour de −22 LUFS. Chez
 *   Théo, autre finaliste, l'arabe sortait 6 dB plus bas que le français, et
 *   « بِ » à −31 LUFS : l'enfant aurait entendu la lettre plus faible que la
 *   consigne ;
 * - les voyelles : بَ بِ بُ à 4,3 Bark l'une de l'autre au plus proche
 *   (formants F1 et F2) ;
 * - la fidélité : `scribe_v2` rend 26 des 28 versets du module à la lettre ;
 *   les deux autres ne diffèrent que par la longueur d'une voyelle
 *   (« فصلي » pour « فَصَلِّ »), sans mot ajouté.
 * Une mesure ne remplace pas l'oreille : c'est l'écoute du propriétaire qui
 * la confirme. Pour garder Omar (`vY0W52tbYe3pDfogQWP7`) sur l'arabe seul :
 * Omar dans `ELEVENLABS_VOICE_ID`, Steve dans `ELEVENLABS_FR_VOICE_ID`.
 *
 * `ELEVENLABS_VOICE_ID` la remplace. L'identifiant vient de la bibliothèque
 * du compte ElevenLabs qui porte la clé : sur un autre compte, vérifier que la
 * voix y est disponible, sinon l'API répond `voice_not_found`, l'action rend
 * `provider_error` et l'écran continue sans le son.
 */
const DEFAULT_VOICE_ID = "jfEwztGDkpbpy89xeku6";

/*
 * UNE SEULE VOIX POUR PIO, EN FRANÇAIS COMME EN ARABE. Le 29 septembre 2026,
 * le propriétaire a entendu deux voix dans une même consigne (« Touche la
 * lettre… » par une voix française, puis « بَاء » par la voix arabe) et a
 * demandé une seule voix, ou une voix moins robotique. Les consignes prennent
 * donc la voix du parcours. `ELEVENLABS_FR_VOICE_ID` leur redonne une voix à
 * part ; `npx convex run arabic/voice:listVoices` liste les voix du compte.
 *
 * PAS DE RALENTI SUR LES CONSIGNES : le ralenti de la synthèse ajoutait de
 * l'artifice, et `eleven_v4` n'en tient pas compte (à 0,9, la même consigne
 * dure autant qu'à 1).
 */

/** ISO-639-3. Leur API accepte aussi « ar » ; on fixe le plus explicite. */
const DEFAULT_STT_LANGUAGE = "ara";

export interface VoiceConfig {
  apiKey: string;
  voiceId: string;
  /** La voix des consignes en français : celle du parcours, sauf réglage. */
  frVoiceId: string;
  /** Le modèle de l'arabe du parcours, qui garde les voyelles brèves. */
  ttsModel: string;
  /** Le modèle des phrases en français, plus naturel. */
  frTtsModel: string;
  sttModel: string;
  sttLanguage: string;
  /** 0,7 à 1,2 chez ElevenLabs. Absent = vitesse naturelle du modèle. */
  speed: number | null;
}

/**
 * La configuration, ou `null` si le fournisseur n'est pas branché.
 *
 * Seule la clé est obligatoire. La voix et les modèles ont une valeur par
 * défaut, chacune surchargeable par l'environnement.
 *
 * RIEN NE MARCHE SANS CLÉ, ET RIEN NE CASSE NON PLUS. Sans
 * `ELEVENLABS_API_KEY`, les actions rendent un état « indisponible » que les
 * écrans savent afficher : la leçon ou l'exercice continue sans le son.
 */
export function voiceConfig(): VoiceConfig | null {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  const voiceId = process.env.ELEVENLABS_VOICE_ID ?? DEFAULT_VOICE_ID;
  if (!apiKey || !voiceId) return null;

  const rawSpeed = Number(process.env.ELEVENLABS_SPEED);
  return {
    apiKey,
    voiceId,
    frVoiceId: process.env.ELEVENLABS_FR_VOICE_ID ?? voiceId,
    ttsModel: process.env.ELEVENLABS_MODEL_ID ?? DEFAULT_TTS_MODEL,
    frTtsModel: process.env.ELEVENLABS_FR_MODEL_ID ?? DEFAULT_FR_TTS_MODEL,
    sttModel: process.env.ELEVENLABS_STT_MODEL_ID ?? DEFAULT_STT_MODEL,
    sttLanguage: process.env.ELEVENLABS_STT_LANGUAGE ?? DEFAULT_STT_LANGUAGE,
    speed:
      Number.isFinite(rawSpeed) && rawSpeed >= 0.7 && rawSpeed <= 1.2
        ? rawSpeed
        : null,
  };
}

/**
 * La clé du cache audio (`arabicAudioClips`, rangé par `arabic/db.ts`).
 *
 * Elle porte la voix ET le modèle : changer de voix ne resservira pas
 * l'ancienne. Le texte est court (un verset, une consigne), donc lisible tel
 * quel dans le tableau de bord — pas d'empreinte à déchiffrer. Une même
 * phrase française dite par le module d'arabe et par le lecteur de consignes
 * partage donc son fichier.
 */
export function clipCacheKey(voiceId: string, modelId: string, text: string): string {
  return `${voiceId}|${modelId}|${text}`;
}

/** Les deux langues de Pio : le français des consignes, l'arabe du parcours. */
export type SpeechLang = "fr" | "ar";

/** Qui dit une phrase, et avec quel modèle. */
export interface Voice {
  lang: SpeechLang;
  voiceId: string;
  modelId: string;
}

/**
 * La voix et le modèle d'une langue. Une seule voix par défaut, deux
 * modèles : `frTtsModel` pour le français, `ttsModel` pour l'arabe. Toute
 * synthèse et toute clé de cache passent par ici, pour qu'une même phrase
 * garde toujours la même clé.
 */
export function voiceFor(config: VoiceConfig, lang: SpeechLang): Voice {
  return lang === "fr"
    ? { lang, voiceId: config.frVoiceId, modelId: config.frTtsModel }
    : { lang, voiceId: config.voiceId, modelId: config.ttsModel };
}

/**
 * Les réglages de diction, par langue.
 *
 * L'arabe se dit POSÉ : on privilégie la stabilité sur l'expressivité, parce
 * qu'un enfant copie ce qu'il entend et qu'une lecture théâtrale déforme les
 * voyelles brèves. Le français se dit NATUREL : une stabilité moyenne laisse
 * la phrase monter et descendre. `eleven_v4` n'a pas de réglage de style.
 */
const VOICE_SETTINGS: Record<SpeechLang, Record<string, number | boolean>> = {
  ar: { stability: 0.6, similarity_boost: 0.8, style: 0, use_speaker_boost: true },
  fr: { stability: 0.5, similarity_boost: 0.75 },
};

/** Appelle la synthèse et rend le mp3. Lève si le fournisseur refuse. */
export async function synthesize(
  text: string,
  config: VoiceConfig,
  voice: Voice,
): Promise<Blob> {
  const speed = config.speed;
  const response = await fetch(
    `${API_BASE}/text-to-speech/${encodeURIComponent(voice.voiceId)}?output_format=mp3_44100_128`,
    {
      method: "POST",
      headers: {
        "xi-api-key": config.apiKey,
        "Content-Type": "application/json",
        Accept: "audio/mpeg",
      },
      body: JSON.stringify({
        text,
        model_id: voice.modelId,
        voice_settings: {
          ...VOICE_SETTINGS[voice.lang],
          ...(speed !== null ? { speed } : {}),
        },
      }),
    },
  );

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(
      `elevenlabs tts ${response.status}: ${detail.slice(0, 200)}`,
    );
  }
  return await response.blob();
}
