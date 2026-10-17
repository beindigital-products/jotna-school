/**
 * LES CHOSES DU MONDE DE L'ENFANT DE CI : de quoi fabriquer, sans modèle, un exercice de tri,
 * de comparaison ou de repérage dont la bonne réponse est certaine.
 *
 * Le modèle écrivait « Quel animal est le plus lourd ? » sans rien montrer, « Mets ces animaux
 * dans l'ordre » sans dire lequel, « Quelle est la forme d'une fenêtre ? » avec deux réponses.
 * Ici chaque chose est écrite UNE fois, avec ce que l'on sait d'elle avec certitude : sa
 * catégorie, sa couleur, son rang de taille et de poids. Un gabarit n'invente rien.
 *
 * RÈGLES POUR AJOUTER UNE CHOSE
 * - Un émoji ancien (Unicode 11 au plus, sans sélecteur de variation) : un appareil de l'élève
 *   sans l'émoji récent afficherait un carré vide.
 * - Une seule catégorie sans doute possible (pas de tomate : fruit ou légume ?).
 * - Une seule couleur sans doute possible (pas de pastèque, ni de mangue).
 * - Les rangs de taille et de poids sont espacés d'au moins DEUX crans quand on compare : un
 *   chien et un mouton, une poule et un chien, se discutent.
 *
 * MODULE PUR (voir `types.ts`).
 */

/** Une chose : son émoji, et son nom avec l'article (« la poule », « l'éléphant »). */
export type Thing = { emoji: string; label: string };

/** Ce que l'enfant lit sur un bouton : l'émoji, puis le nom. */
export function optionOf(thing: Thing): string {
  return `${thing.emoji} ${thing.label}`;
}

const thing = (emoji: string, label: string): Thing => ({ emoji, label });

export type CategoryKey = "fruit" | "animal" | "vetement" | "vehicule" | "ecole";

/** Les catégories : « Est-ce un fruit ? », sans chose qui appartienne à deux. */
export const CATEGORIES: Record<CategoryKey, { question: string; things: readonly Thing[] }> = {
  fruit: {
    question: "un fruit",
    things: [
      thing("🥭", "la mangue"),
      thing("🍌", "la banane"),
      thing("🍉", "la pastèque"),
      thing("🍍", "l'ananas"),
      thing("🍎", "la pomme"),
      thing("🍊", "l'orange"),
      thing("🍋", "le citron"),
    ],
  },
  animal: {
    question: "un animal",
    things: [
      thing("🐔", "la poule"),
      thing("🐑", "le mouton"),
      thing("🐄", "la vache"),
      thing("🐟", "le poisson"),
      thing("🐈", "le chat"),
      thing("🐕", "le chien"),
      thing("🐘", "l'éléphant"),
      thing("🦒", "la girafe"),
    ],
  },
  vetement: {
    question: "un vêtement",
    things: [
      thing("👗", "la robe"),
      thing("👕", "le tee-shirt"),
      thing("👖", "le pantalon"),
      thing("👒", "le chapeau"),
      thing("🧦", "la chaussette"),
    ],
  },
  vehicule: {
    question: "un véhicule",
    things: [
      thing("🚗", "la voiture"),
      thing("🚌", "le bus"),
      thing("🚲", "le vélo"),
      thing("⛵", "le bateau"),
      thing("🛵", "le scooter"),
    ],
  },
  ecole: {
    question: "un objet de l'école",
    things: [thing("📏", "la règle"), thing("📚", "les livres"), thing("🎒", "le cartable"), thing("📒", "le cahier")],
  },
};

export const CATEGORY_KEYS = Object.keys(CATEGORIES) as CategoryKey[];

/** Une chose de la liste et sa catégorie : ce qui sert à dire « oui » ou « non ». */
export function categoryOf(emoji: string): CategoryKey | null {
  return CATEGORY_KEYS.find((key) => CATEGORIES[key].things.some((t) => t.emoji === emoji)) ?? null;
}

/** Les couleurs : une chose par couleur dans une question, jamais deux de la même. */
export const COLORS: Record<string, readonly Thing[]> = {
  rouge: [thing("🍎", "la pomme"), thing("🍓", "la fraise"), thing("🍅", "la tomate")],
  jaune: [thing("🍌", "la banane"), thing("🍋", "le citron")],
  vert: [thing("🥒", "le concombre"), thing("🥦", "le brocoli")],
  orange: [thing("🍊", "l'orange"), thing("🥕", "la carotte")],
  violet: [thing("🍆", "l'aubergine")],
};

/**
 * La taille : du plus petit au plus grand. L'éléphant n'y est pas : la girafe est plus haute,
 * l'éléphant plus gros, « plus grand » se discuterait.
 */
export const SIZE_SCALE: readonly Thing[] = [
  thing("🐜", "la fourmi"),
  thing("🐭", "la souris"),
  thing("🐔", "la poule"),
  thing("🐕", "le chien"),
  thing("🐄", "la vache"),
  thing("🦒", "la girafe"),
];

/** Le poids : du plus léger au plus lourd. */
export const WEIGHT_SCALE: readonly Thing[] = [
  thing("🐜", "la fourmi"),
  thing("🐭", "la souris"),
  thing("🐔", "la poule"),
  thing("🐕", "le chien"),
  thing("🐑", "le mouton"),
  thing("🐄", "la vache"),
  thing("🐘", "l'éléphant"),
];

/** Les jours de la semaine, dans l'ordre. */
export const DAYS = ["lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi", "dimanche"] as const;

/** Les moments de la journée, chacun avec des indices qui ne vont à aucun autre. */
export const MOMENTS: readonly { name: string; label: string; clues: readonly string[] }[] = [
  { name: "matin", label: "le matin", clues: ["Le soleil se lève.", "Le coq chante et le jour commence."] },
  { name: "midi", label: "midi", clues: ["Le soleil est tout en haut du ciel.", "Les ombres sont toutes petites."] },
  { name: "soir", label: "le soir", clues: ["Le soleil se couche.", "Le ciel devient rouge et la nuit arrive."] },
  { name: "nuit", label: "la nuit", clues: ["Il fait noir et les étoiles brillent.", "Il fait noir, tout le monde dort."] },
];
