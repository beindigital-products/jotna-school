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
 * Le modèle de synthèse par défaut.
 *
 * `eleven_multilingual_v2` lit l'arabe vocalisé et respecte les voyelles
 * brèves — c'est ce qui compte ici : un modèle qui les ignore prononcerait
 * « بَ » et « بِ » de la même façon, et le niveau 2 du parcours n'aurait plus
 * d'objet. Surchargeable par `ELEVENLABS_MODEL_ID`.
 */
const DEFAULT_TTS_MODEL = "eleven_multilingual_v2";

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
 * La voix par défaut : Omar (« Best Arab Narrator »), une voix d'homme en
 * arabe standard, grave et chaude. C'est AUSSI la voix des consignes en
 * français : Pio n'a qu'une voix (`voiceConfig`).
 *
 * UNE VOIX D'HOMME, DEMANDÉE PAR LE PROPRIÉTAIRE le 28 septembre 2026 :
 * « agréable, douce, mais une voix d'homme ». Elle remplace Ekram, une voix de
 * femme. Treize voix d'homme ont lu les mêmes textes, et celle d'Omar a été
 * retenue sur trois mesures :
 * - ses syllabes بَ بِ بُ portent trois voyelles bien distinctes (4,8 Bark au
 *   plus proche, contre 4,5 pour Ekram ; seul Tariq, une voix bien plus dure,
 *   fait mieux), condition du niveau 2 ;
 * - les 27 versets du module, transcrits par `scribe_v2`, rendent exactement
 *   leur texte (Ekram, au même essai, avait ajouté des mots avant un verset) ;
 * - son volume rejoint celui de la voix des consignes (−20 LUFS pour les
 *   deux), l'enfant n'entend donc pas de saut entre le français et l'arabe.
 * Une mesure ne remplace pas l'oreille : c'est l'écoute du propriétaire qui
 * la confirme. Anas (`R6nda3uM038xEEKi7GFl`), plus douce encore mais aux
 * voyelles moins séparées, est la voix de rechange.
 *
 * `ELEVENLABS_VOICE_ID` la remplace. L'identifiant vient de la bibliothèque
 * du compte ElevenLabs qui porte la clé : sur un autre compte, vérifier que la
 * voix y est disponible, sinon l'API répond `voice_not_found`, l'action rend
 * `provider_error` et l'écran continue sans le son.
 */
const DEFAULT_VOICE_ID = "vY0W52tbYe3pDfogQWP7";

/*
 * UNE SEULE VOIX POUR PIO, EN FRANÇAIS COMME EN ARABE. Le 29 septembre 2026,
 * le propriétaire a entendu deux voix dans une même consigne (« Touche la
 * lettre… » par la voix française, puis « بَاء » par Omar) et a demandé une
 * seule voix, ou une voix moins robotique. La voix française d'alors,
 * « Alexandre FR » (`EGS8Z4YTFhSL6Mm6LpoK`), était la plus monotone des
 * voix mesurées : sa hauteur ne variait que sur 4 à 5 demi-tons, contre 8 à
 * 11 pour Omar. Omar lit les consignes françaises sans une erreur de
 * transcription (`scribe_v2` en français) et dit les formules arabes
 * (« مَا شَاءَ اللَّه ») au milieu d'une phrase française.
 *
 * Les consignes prennent donc la voix du parcours. `ELEVENLABS_FR_VOICE_ID`
 * leur redonne une voix à part ; `npx convex run arabic/voice:listVoices`
 * liste les voix du compte.
 *
 * PLUS DE RALENTI SUR LES CONSIGNES : Omar parle posément de lui-même (18
 * caractères par seconde en français, contre 19 à 22 pour Alexandre ralenti
 * à 0,92), et le ralenti de la synthèse ajoutait de l'artifice.
 */

/** ISO-639-3. Leur API accepte aussi « ar » ; on fixe le plus explicite. */
const DEFAULT_STT_LANGUAGE = "ara";

export interface VoiceConfig {
  apiKey: string;
  voiceId: string;
  /** La voix des consignes en français : celle du parcours, sauf réglage. */
  frVoiceId: string;
  ttsModel: string;
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

/** Appelle la synthèse et rend le mp3. Lève si le fournisseur refuse. */
export async function synthesize(
  text: string,
  config: VoiceConfig,
  voiceId: string,
): Promise<Blob> {
  const speed = config.speed;
  const response = await fetch(
    `${API_BASE}/text-to-speech/${encodeURIComponent(voiceId)}?output_format=mp3_44100_128`,
    {
      method: "POST",
      headers: {
        "xi-api-key": config.apiKey,
        "Content-Type": "application/json",
        Accept: "audio/mpeg",
      },
      body: JSON.stringify({
        text,
        model_id: config.ttsModel,
        voice_settings: {
          // Une diction POSÉE : on privilégie la stabilité sur l'expressivité,
          // parce qu'un enfant copie ce qu'il entend et qu'une lecture
          // théâtrale déforme les voyelles brèves.
          stability: 0.6,
          similarity_boost: 0.8,
          style: 0,
          use_speaker_boost: true,
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
