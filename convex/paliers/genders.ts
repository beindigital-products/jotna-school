/**
 * LE GENRE DES NOMS COURANTS DU CI ET DU CP : de quoi vérifier, sans modèle,
 * qu'un trou n'écrit pas « Le poule est jaune » ou « Mon mère est dans le
 * jardin ».
 *
 * Le modèle accorde mal l'article d'une phrase à trou avec le mot de la
 * réponse : le palier montrait « Le ___ est un animal qui dit 'cot cot' » avec
 * « poule ». L'enfant lit « Le poule » et apprend une faute.
 *
 * LA PRUDENCE EST LA RÈGLE (comme `exerciseAudit.ts`) : seuls les noms dont le
 * genre ne fait aucun doute sont listés. Un nom qui s'emploie aux deux genres
 * (élève, ami, enfant, bébé, camarade) n'y est pas, et un nom absent de la liste
 * n'est jamais jugé. Ajouter un mot : le genre doit être celui du dictionnaire,
 * sans variante.
 *
 * MODULE PUR (pas de Convex).
 */

/** Sans accent, sans casse, « œ » écrit « oe » : la forme sous laquelle on cherche un mot. */
function normalize(word: string): string {
  return word
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/œ/g, "oe")
    .replace(/[’‘`]/g, "'")
    .trim();
}

const FEMININE = new Set(
  (
    "poule mere tomate olive loupe fumee robe radio auto moto mangue banane orange papaye vache chevre brebis pintade " +
    "maison table chaise ecole maitresse lune fleur plume souris girafe tortue voiture bouche main tete jambe dent " +
    "fille soeur tante maman mamie porte fenetre lampe craie ardoise trousse gomme regle page image couleur etoile " +
    "rue route ville mer plage pluie eau herbe feuille branche carotte pomme poire cerise fraise salade soupe glace " +
    "bouteille assiette cuillere fourchette casserole cle chemise jupe chaussure veste casquette montre poupee bille " +
    "corde balle cour classe nuit journee semaine lettre syllabe phrase voyelle abeille mouche fourmi chenille photo " +
    "cuisine chambre douche cloche cage marmite natte calebasse pirogue lumiere"
  ).split(" "),
);

const MASCULINE = new Set(
  (
    "papa pere cafe foulard sac rat sel bateau mouton savon salon bonbon ballon lit midi ete chat chien cheval ane " +
    "lion singe elephant poisson oiseau canard coq cochon boeuf taureau livre cahier stylo crayon tableau bureau banc " +
    "cartable maitre jardin arbre fruit legume riz mil pain lait the jus gateau citron melon mais manioc oignon " +
    "ananas avocat soleil ciel vent nuage feu fleuve village marche magasin camion velo train avion telephone " +
    "ordinateur chapeau pantalon pagne boubou tissu sol mur toit nez oeil doigt pied bras cou dos ventre genou frere " +
    "oncle garcon sable cadeau repas matin soir jour"
  ).split(" "),
);

export type Gender = "m" | "f";

/** Le genre d'un nom de la liste, ou `null` s'il n'y est pas (ou s'il s'emploie aux deux genres). */
export function genderOf(word: string): Gender | null {
  const key = normalize(word);
  if (FEMININE.has(key)) return "f";
  if (MASCULINE.has(key)) return "m";
  return null;
}

const ARTICLE_BEFORE_BLANK =
  /(?<![\p{L}'’])(le|un|ce|du|au|mon|ton|son|la|une|cette|ma|ta|sa)\s+___/iu;
const MASCULINE_ARTICLES = new Set(["le", "un", "ce", "du", "au", "mon", "ton", "son"]);
const POSSESSIVES = new Set(["mon", "ton", "son"]);
/** Devant une voyelle ou un « h », « mon », « ton », « son » s'emploient aux deux genres (« mon amie »). */
const VOWEL_START = /^[aeiouyh]/u;

/**
 * L'article écrit juste avant le trou, quand le mot de la réponse est d'un autre
 * genre : `{ article, gender }`. `null` quand tout s'accorde, quand le trou n'a
 * pas d'article devant lui, ou quand le mot n'est pas dans la liste.
 */
export function articleGenderMismatch(
  text: string,
  answer: string,
): { article: string; gender: Gender } | null {
  const gender = genderOf(answer);
  if (!gender) return null;
  const article = ARTICLE_BEFORE_BLANK.exec(text)?.[1]?.toLowerCase();
  if (!article) return null;
  if (POSSESSIVES.has(article) && VOWEL_START.test(normalize(answer))) return null;
  const articleGender: Gender = MASCULINE_ARTICLES.has(article) ? "m" : "f";
  return articleGender === gender ? null : { article, gender };
}
