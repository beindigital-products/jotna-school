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

export function worldSceneSrc(
  subjectName: string | undefined | null,
  tier: "full" | "lite" = "full",
): string | null {
  const id = worldSceneIdFor(subjectName);
  return id ? `/images/world/mondes/${id}${tier === "lite" ? "-s" : ""}.webp` : null;
}
