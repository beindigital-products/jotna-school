/**
 * LE MONDE PEINT D'UNE MATIÈRE — la vignette ronde qui la représente sur la carte
 * et au camp.
 *
 * Huit mondes, une peinture par matière (`public/images/world/mondes/`,
 * fabriquées par `scripts/build-world-scenes.mjs`) : un boulier géant dans la
 * savane pour les mathématiques, un livre ouvert et une plume pour le français,
 * un phare pour l'anglais… Même peinture douce en 3D, même lumière dorée que
 * les biomes et le camp. On les retrouve par le NOM de la matière, pas par sa
 * clé `icon` : le catalogue range « Globe » pour l'histoire-géographie comme
 * pour l'anglais, et l'école renomme ses matières (« Sciences » devenue
 * « Éveil scientifique », « EMC » devenue « Instruction civique »). Une matière
 * sans monde peint (un nom que personne n'a prévu) garde son biome et son
 * pictogramme (`subjectIcons.ts`) : jamais un monde sans visage.
 *
 * Chaque monde existe en deux tailles : 384 pixels (`full`) et 192 pixels
 * (`lite`, suffixe `-s`) pour les appareils à donnée chère.
 */
export type WorldSceneId =
  | "maths"
  | "francais"
  | "sciences"
  | "histoire"
  | "geographie"
  | "civique"
  | "arts"
  | "anglais";

export const WORLD_SCENE_IDS: readonly WorldSceneId[] = [
  "maths",
  "francais",
  "sciences",
  "histoire",
  "geographie",
  "civique",
  "arts",
  "anglais",
];

/** Sans accents, en minuscules, sans ponctuation : « Éveil scientifique » devient « eveil scientifique ». */
function normalize(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

/**
 * Les mots qui désignent chaque matière, dans l'ordre où on les teste.
 * « Histoire-Géographie » (une seule matière dans l'ancien catalogue) prend
 * l'histoire : c'est le premier mot.
 */
const RULES: ReadonlyArray<readonly [WorldSceneId, RegExp]> = [
  ["maths", /\b(math|mathematique|calcul|nombre|geometrie)/],
  ["anglais", /\b(anglais|english)/],
  ["histoire", /\bhistoire/],
  ["geographie", /\bgeo/],
  ["civique", /\b(civi|emc|citoyen|vivre ensemble)/],
  ["sciences", /\b(science|eveil|svt|physique|biologie)/],
  ["arts", /\b(art|arts|musique|musical|dessin|peinture|comedie|theatre|scenique)/],
  ["francais", /\b(francais|lecture|ecriture|langue|grammaire|conjugaison)/],
];

export function worldSceneIdFor(subjectName: string | undefined | null): WorldSceneId | null {
  if (!subjectName) return null;
  const n = normalize(subjectName);
  for (const [id, rule] of RULES) if (rule.test(n)) return id;
  return null;
}

/**
 * Le monde d'une THÉMATIQUE, pour le décor de sa séance. La clé du programme
 * officiel porte la matière dans ses deux premières lettres (`ma-…`, `fr-…`,
 * `an-…`, `convex/programme/`) : c'est le signe le plus sûr, et la séance en
 * ligne l'a déjà sous la main. Sans clé (une thématique écrite par un
 * professeur), on retombe sur le nom de la matière ; sans rien, pas de monde :
 * la séance garde la savane du camp.
 */
const PROGRAMME_PREFIX: Readonly<Record<string, WorldSceneId>> = {
  ma: "maths",
  fr: "francais",
  sc: "sciences",
  hi: "histoire",
  ge: "geographie",
  ci: "civique",
  ar: "arts",
  an: "anglais",
};

export function worldSceneIdForTopic(topic: {
  programmeKey?: string | null;
  subjectName?: string | null;
}): WorldSceneId | null {
  const prefix = typeof topic.programmeKey === "string" ? /^([a-z]{2})-/.exec(topic.programmeKey)?.[1] : undefined;
  if (prefix && PROGRAMME_PREFIX[prefix]) return PROGRAMME_PREFIX[prefix];
  return worldSceneIdFor(topic.subjectName);
}

/**
 * LE DÉCOR DE SÉANCE d'un monde : la grande peinture devant laquelle
 * l'exercice se joue (`public/images/world/decors/`, fabriquées par
 * `scripts/build-world-backdrops.mjs`). Deux cadrages : `portrait` pour un
 * téléphone debout, `wide` dès 640 px de large.
 */
export function worldBackdropSrc(id: WorldSceneId, framing: "portrait" | "wide"): string {
  return `/images/world/decors/${id}-${framing}.webp`;
}

export function worldSceneSrc(
  subjectName: string | undefined | null,
  tier: "full" | "lite" = "full",
): string | null {
  const id = worldSceneIdFor(subjectName);
  return id ? `/images/world/mondes/${id}${tier === "lite" ? "-s" : ""}.webp` : null;
}
