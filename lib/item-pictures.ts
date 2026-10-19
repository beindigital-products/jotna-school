/**
 * QUELLE IMAGE POUR QUELLE TUILE, ET QUAND L'IMAGE SERAIT UNE TRICHE.
 *
 * `lib/item-images.ts` dit quelles images existent ; ce module décide quelle
 * tuile en reçoit une. Il est pur (pas de React) : l'écran
 * (`components/exercises/item-pictures.tsx`) n'y ajoute que la porte et le dessin.
 *
 * LA PORTE. Seules les classes de `PICTURE_TILE_CLASSES` voient les images : le
 * CI, qui ne sait pas encore lire. Pour le CP, il suffira d'y écrire "CP". La
 * liste est ici et non dans `convex/` : c'est une règle d'affichage, que le
 * serveur ne lit pas. `READING_LEARNER_CLASSES` (`convex/curriculum.ts`) règle la
 * voix de Pio, une autre affaire : les deux listes sont indépendantes.
 *
 * UNE TUILE EST RECONNUE PAR SON TEXTE (`pictureForTile`), et de façon EXACTE :
 * toute la tuile compte, jamais un morceau.
 *   1. On retire l'émoji de tête, l'article (le, la, l', les, un, une, des, du,
 *      de la, de l') et la ponctuation finale, on normalise (`normalizeWord`) et
 *      on cherche le mot dans les `words` du catalogue (le français), puis dans
 *      ses `english`. « Le baobab », « L'éléphant », « Âne » reçoivent leur
 *      image ; « Fruits du baobab », « les chats » (un pluriel n'est pas le
 *      singulier du catalogue) et « 3 pommes » ne reçoivent rien.
 *   2. Un mot ambigu (`ambiguousBare` : « orange », le fruit ou la couleur ;
 *      « Pierre », la pierre ou le prénom) n'a son image qu'avec un article
 *      (« une orange ») ou avec l'émoji de la chose en tête. Un autre émoji de
 *      tête, le rond orange par exemple, dit la couleur : rien. Le groupe peut
 *      aussi lever le doute (`recognizeTiles`, plus bas).
 *   3. REPLI : « [chien] Rex » ou « [pomme] une belle pomme », dont le mot n'est
 *      pas au catalogue, reçoivent l'image de leur émoji de tête ([chien] tient
 *      lieu de l'émoji), à trois conditions : il n'y a qu'un émoji en tête, le
 *      reste n'a ni chiffre ni nombre écrit en lettres (« [pomme] trois pommes »
 *      compte, une seule pomme dessinée mentirait), et il tient en trois mots.
 *   4. Une tuile qui n'est QUE des émojis, des chiffres ou des signes n'est
 *      jamais changée : le comptage, les frises et les motifs restent en émojis.
 *      Une rangée d'émojis en tête de tuile (« [pomme][pomme] pomme ») en est
 *      une : rien non plus.
 *
 * LE GROUPE REND SON SENS À DEUX TUILES (`recognizeTiles`), parce qu'une tuile
 * seule ne sait pas ce qu'elle est.
 *   - Un NOM ANGLAIS demande un témoin. « pen » est le stylo des leçons d'anglais
 *     et la première syllabe de « Penda » : seul entre « lo » et « lou », c'est une
 *     syllabe. Il reçoit son image si l'émoji de la chose le précède, ou si un
 *     autre nom anglais du MÊME groupe l'accompagne (« cat, dog, fish » est une
 *     leçon d'anglais).
 *   - Le mot ambigu d'un fruit (« orange », `bareInGroup`) prend son image quand une
 *     autre tuile du groupe est un aliment (« pomme, orange, banane ») : sans cela, la
 *     seule tuile sans image au milieu des fruits de la liste désignerait celle-là.
 *
 * LES GARDE-FOUS (`explainTilePictures`). L'image ne doit jamais donner la
 * réponse d'un exercice qui demande de relier un MOT à une IMAGE, ou de LIRE.
 * Ils retirent TOUTES les images d'un exercice, jamais une seule : épargner la
 * bonne tuile et montrer les autres la désignerait par élimination (`TILE_GUARDS`
 * en donne les titres).
 *   a. L'énoncé demande de lire ou d'identifier un mot écrit (`READING_PROMPT`),
 *      de décoder (`DECODING_PROMPT` : la syllabe, la lettre, « commence par »),
 *      de ranger les MOTS d'une phrase (`SENTENCE_PROMPT`), de NOMMER ce qu'il
 *      montre (`NAMING_PROMPT`) ou de traduire (`TRANSLATION_PROMPT`) : aucune
 *      tuile n'a d'image.
 *   b. L'énoncé contient l'émoji d'une chose du catalogue, et une tuile résout vers
 *      cette même image (« Quel animal est-ce ? [éléphant] » avec « l'éléphant ») :
 *      aucune tuile n'a d'image. L'émoji s'y lit LARGE (`guardEmoji` : le carré
 *      noir, le dé, la brique, la boîte de conserve).
 *   c. Association : un côté ne montre que des émojis (`glyphTiles`), et une
 *      tuile-mot de l'autre côté résout vers l'image d'un de ces émojis : le
 *      côté des mots n'a pas d'image. Le côté des émojis est laissé tel quel
 *      (une tuile « que des émojis » n'est jamais changée, règle 4).
 *   d. QCM (`choice`) : une tuile qui porte des lettres n'a pas d'image alors
 *      qu'une autre en a une. Une seule tuile est juste : celle qui se détache du
 *      lot, la seule illustrée ou la seule nue, désigne la réponse par élimination.
 *   e. L'énoncé a sa propre image (`exerciseImage`, `payload.image`), et c'est
 *      celle d'une tuile (le chat sur l'énoncé, « le chat » parmi les options) :
 *      l'image de la bonne tuile ne serait que la copie de celle de l'énoncé.
 *   f. Association et glisser-déposer : une même image sur les deux groupes de
 *      tuiles (`counterpart`) : « Arachide » en face de « Cacahuète » se
 *      relient par leur dessin identique, sans savoir ce que c'est.
 *
 * LES ÉMOJIS DE TÊTE se lisent comme `splitLeadingEmoji`
 * (`components/student/game-kit/choix-texte.ts`) : un graphème à
 * `Emoji_Presentation`, ou portant un sélecteur U+FE0F, avec `Intl.Segmenter`
 * quand il existe. Un module de `lib/` n'importe pas de `components/` : les
 * quelques lignes sont recopiées, et un test compare les deux fonctions.
 */

import {
  findItemImageByEmoji,
  findItemImageByGuardEmoji,
  lookupItemImageWord,
  normalizeWord,
  type ItemImage,
} from "./item-images";

/** Les classes dont les tuiles montrent leur image : le CI. Pour le CP, ajouter "CP". */
export const PICTURE_TILE_CLASSES = ["CI"] as const;

const PICTURE_CLASSES: ReadonlySet<string> = new Set(PICTURE_TILE_CLASSES);

/** Vrai pour une classe dont les tuiles montrent leur image. Un niveau absent n'en est pas un. */
export function isPictureTileClass(klass: string | undefined | null): boolean {
  return typeof klass === "string" && PICTURE_CLASSES.has(klass);
}

/* ── Les graphèmes et l'émoji de tête ───────────────────────────────────── */

/* Le sélecteur de variation émoji (U+FE0F) est construit par son code : écrit en
   clair, il serait invisible dans la source. */
const VARIATION_SELECTOR = String.fromCharCode(0xfe0f);
const EMOJI_GRAPHEME = new RegExp(`\\p{Emoji_Presentation}|${VARIATION_SELECTOR}`, "u");
const WHITESPACE = /^\s+$/u;

type Segmenter = { segment: (text: string) => Iterable<{ segment: string }> };

let segmenter: Segmenter | null | undefined;

/** Les graphèmes d'un texte, tels qu'un lecteur les voit ; des points de code sans `Intl.Segmenter`. */
function graphemes(text: string): string[] {
  if (segmenter === undefined) {
    const api = (
      Intl as unknown as {
        Segmenter?: new (locale: string, options: { granularity: string }) => Segmenter;
      }
    ).Segmenter;
    try {
      segmenter = typeof api === "function" ? new api("fr", { granularity: "grapheme" }) : null;
    } catch {
      segmenter = null;
    }
  }
  if (segmenter) return Array.from(segmenter.segment(text), (part) => part.segment);
  return Array.from(text);
}

function isEmojiGrapheme(grapheme: string): boolean {
  return EMOJI_GRAPHEME.test(grapheme);
}

/**
 * Sépare les émojis qui OUVRENT une tuile de son texte : « [chien] le chien »
 * donne `{ emoji: "[chien]", rest: "le chien" }` ([chien] tient lieu de l'émoji).
 * L'espace qui les sépare est rendue au texte. Sans émoji en tête : `emoji` vide,
 * `rest` entier. Rien que des émojis : `rest` vide. Même règle que
 * `splitLeadingEmoji` du kit de jeu.
 */
export function splitTile(text: string): { emoji: string; rest: string } {
  const parts = graphemes(text);
  let i = 0;
  let lastEmoji = -1;
  while (i < parts.length) {
    const part = parts[i];
    if (isEmojiGrapheme(part)) {
      lastEmoji = i;
      i++;
      continue;
    }
    if (WHITESPACE.test(part) && lastEmoji !== -1) {
      i++;
      continue;
    }
    break;
  }
  if (lastEmoji === -1) return { emoji: "", rest: text };
  const emoji = parts.slice(0, lastEmoji + 1).join("");
  const rest = parts
    .slice(lastEmoji + 1)
    .join("")
    .replace(/^\s+/u, "");
  return { emoji, rest };
}

/** Vrai pour une tuile qui n'est que des émojis (et des espaces) : « [pomme][pomme] ». */
export function isGlyphTile(text: string): boolean {
  const { emoji, rest } = splitTile(text);
  return emoji !== "" && rest.trim() === "";
}

/** L'émoji qui ouvre la tuile quand il est SEUL en tête, sinon une chaîne vide. */
function headEmoji(text: string): string {
  const head = graphemes(splitTile(text).emoji).filter(isEmojiGrapheme);
  return head.length === 1 ? head[0] : "";
}

/** Vrai pour une tuile qui porte au moins une lettre, hors émoji de tête : un mot, pas un chiffre ni une frise. */
function hasLetters(text: unknown): boolean {
  return typeof text === "string" && /\p{L}/u.test(splitTile(text).rest);
}

/* ── Reconnaître une tuile ──────────────────────────────────────────────── */

/* L'article, sur un texte déjà passé par `normalizeWord` (minuscules, sans accent,
   apostrophe droite, espaces repliés). « l' » n'exige pas d'espace après lui ;
   les autres, si : « lait caillé » ne commence pas par l'article « la ». */
const ARTICLE = /^(?:de la |de l' ?|les |des |une |un |du |le |la |l' ?)/;

/** Un nombre écrit en lettres, sur un texte normalisé : « un » et « une » sont des articles, pas des nombres. */
const NUMBER_WORD =
  /\b(?:zero|deux|trois|quatre|cinq|six|sept|huit|neuf|dix|onze|douze|treize|quatorze|quinze|seize|vingt|trente|quarante|cinquante|soixante|cent|mille)\b/;

/** Au plus ce nombre de mots pour le repli par l'émoji de tête. */
const FALLBACK_MAX_WORDS = 3;

/**
 * Retire l'article qui ouvre un texte DÉJÀ normalisé (`normalizeWord`) :
 * « l'elephant » donne `{ word: "elephant", article: "l'" }`. Sans article :
 * `article` vide, `word` inchangé. Un seul article est retiré.
 */
export function stripArticle(normalized: string): { word: string; article: string } {
  const match = ARTICLE.exec(normalized);
  if (!match) return { word: normalized, article: "" };
  return { word: normalized.slice(match[0].length).trim(), article: match[0].trim() };
}

/** Une tuile reconnue : son image, et par où (le mot français, le mot anglais, l'émoji de tête). */
export type TileMatch = { image: ItemImage; via: "mot" | "anglais" | "emoji" };

/**
 * L'image d'une tuile d'après son texte, et par où elle vient : les règles 1 à 4 de
 * l'en-tête, SANS ce que le groupe y ajoute (`recognizeTiles`) ni les garde-fous
 * (`explainTilePictures`).
 */
export function matchTile(text: string): TileMatch | null {
  if (typeof text !== "string") return null;
  const { emoji, rest } = splitTile(text);
  const head = graphemes(emoji).filter(isEmojiGrapheme);
  // Une rangée d'émojis en tête : un comptage, une frise. Elle reste en émojis.
  if (head.length > 1) return null;

  const label = normalizeWord(rest);
  // Rien à lire (que des émojis, des chiffres, des signes) : jamais changée.
  if (!/\p{L}/u.test(label)) return null;

  const { word, article } = stripArticle(label);
  const hit = word ? lookupItemImageWord(word) : null;
  if (hit) {
    const via = hit.english ? "anglais" : "mot";
    if (!hit.image.ambiguousBare || article) return { image: hit.image, via };
    // « orange » seul peut être la couleur : il faut l'émoji de la chose elle-même.
    const named = head.length === 1 ? findItemImageByEmoji(head[0]) : null;
    return named?.id === hit.image.id ? { image: hit.image, via } : null;
  }

  // Le repli : le mot n'est pas au catalogue (un prénom, un adjectif), l'émoji de tête parle pour lui.
  if (head.length !== 1) return null;
  if (/\p{N}/u.test(label) || NUMBER_WORD.test(label)) return null;
  if (label.split(" ").length > FALLBACK_MAX_WORDS) return null;
  const image = findItemImageByEmoji(head[0]);
  return image ? { image, via: "emoji" } : null;
}

/**
 * L'image d'une tuile d'après son texte seul, ou `null` : `matchTile` sans dire par
 * où elle vient. Un nom anglais y est reconnu sans témoin ; c'est `recognizeTiles`
 * qui le demande.
 */
export function pictureForTile(text: string): ItemImage | null {
  return matchTile(text)?.image ?? null;
}

/**
 * Le mot SEUL d'une tuile, sans émoji ni article, quand il est ambigu et qu'un groupe
 * peut le lever (`bareInGroup` : « orange » dans une liste de fruits) ; sinon `null`.
 */
function bareAmbiguousImage(text: unknown): ItemImage | null {
  if (typeof text !== "string") return null;
  const { emoji, rest } = splitTile(text);
  if (emoji) return null;
  const { word, article } = stripArticle(normalizeWord(rest));
  if (article || !word) return null;
  const hit = lookupItemImageWord(word);
  return hit && !hit.english && hit.image.ambiguousBare && hit.image.bareInGroup ? hit.image : null;
}

/**
 * L'image de chaque tuile d'un GROUPE, avant les garde-fous : `matchTile` sur chacune,
 * plus ce que le groupe apprend (voir l'en-tête). Un tableau de la MÊME longueur que
 * `tiles`, avec `null` pour une tuile sans image.
 *   - un nom anglais seul est retiré, sauf si l'émoji de la chose le précède ;
 *   - un mot ambigu sans article ni émoji prend son image quand une autre tuile du
 *     groupe est de son groupe d'images (l'orange parmi les aliments).
 */
export function recognizeTiles(tiles: readonly string[]): (ItemImage | null)[] {
  const matches = tiles.map((tile) => matchTile(tile));
  const englishCount = matches.filter((match) => match?.via === "anglais").length;
  const pictures = matches.map((match, index) => {
    if (!match) return null;
    if (match.via !== "anglais" || englishCount >= 2) return match.image;
    // Un seul nom anglais dans le groupe : l'émoji de la chose en tête le confirme, ou il se tait.
    const glyph = headEmoji(tiles[index]);
    return glyph && findItemImageByEmoji(glyph)?.id === match.image.id ? match.image : null;
  });
  tiles.forEach((tile, index) => {
    if (pictures[index]) return;
    const ambiguous = bareAmbiguousImage(tile);
    if (ambiguous && pictures.some((picture) => picture !== null && picture.group === ambiguous.bareInGroup)) {
      pictures[index] = ambiguous;
    }
  });
  return pictures;
}

/**
 * Les images du catalogue dont un émoji figure dans ce texte, sans doublon, dans
 * l'ordre où elles apparaissent. Sert aux garde-fous : l'émoji d'un énoncé, ou
 * d'une tuile « que des émojis », qui désigne la chose qu'une tuile-mot nomme. Les
 * glyphes se lisent LARGES (`guardEmoji` compris) : le carré noir de l'énoncé est
 * le carré de la tuile.
 */
export function itemImagesInText(text: string): ItemImage[] {
  if (typeof text !== "string" || !text) return [];
  const found: ItemImage[] = [];
  for (const glyph of graphemes(text)) {
    const image = findItemImageByGuardEmoji(glyph);
    if (image && !found.includes(image)) found.push(image);
  }
  return found;
}

/* ── Les énoncés qui ne veulent pas d'image ─────────────────────────────── */

/* Les mots d'un énoncé, entiers, sans tenir compte de la casse ni des accents. Les
   bornes sont écrites avec `\p{L}` : `\b` ne connaît pas les lettres accentuées. Le
   début est un caractère consommé, pas un `(?<!…)` : la lookbehind manque à Safari
   d'avant 16.4, et une expression qu'un moteur ne sait pas lire casse tout le module. */
const BEFORE_WORD = "(?:^|[^\\p{L}\\p{N}])";
const AFTER_WORD = "(?![\\p{L}\\p{N}])";
const wholeWords = (alternatives: string) => new RegExp(`${BEFORE_WORD}(?:${alternatives})${AFTER_WORD}`, "iu");

/**
 * Un énoncé qui demande de LIRE, ou d'identifier un mot écrit : « Lis le mot »,
 * « Lisez bien », « Relis la phrase », « Épelle le mot », « la lecture », « le mot
 * écrit ». « lit » (le meuble, ou il lit), « écris » ou « écrivain » n'en sont pas.
 */
export const READING_PROMPT = wholeWords(
  "lis|lire|lisez|lisons|relis|relire|relisez|lecture|[eé]pel(?:le|ez|er|ons)|[eé]crit(?:e|s|es)?",
);

/**
 * Un énoncé qui demande de DÉCODER : il parle d'une syllabe ou d'une lettre, ou de ce
 * par quoi un mot commence ou finit. « Quel mot commence par la syllabe « pou » ? »,
 * « Relie chaque syllabe au mot qui commence par elle », « Par quelle syllabe finit
 * « midi » ? ». Les mots sont des SONS à lire : une image sur certains permet de
 * répondre à l'oral, et le motif des images désigne une option.
 */
export const DECODING_PROMPT = wholeWords(
  "syllabes?|lettres?|majuscules?|minuscules?|(?:commence|commencent|finit|finissent)\\s+par",
);

/**
 * Un énoncé qui demande de ranger les MOTS d'une phrase, ou d'en choisir un :
 * « Remets les mots dans l'ordre », « Place les mots dans la bonne phrase », « Glisse
 * le bon mot dans la phrase », « Construis une phrase avec ces mots ». Les tuiles sont
 * les mots d'une phrase (« Fatou a une mangue »), pas des noms de choses : l'image
 * identifie le seul nom, toujours le dernier mot, et la lecture des autres n'est plus
 * qu'à moitié nécessaire. L'ordre alphabétique de mots n'en est pas une (l'image ne dit
 * rien de l'ordre des lettres), ni « Classe ces mots par ordre de croissance », ni
 * « Dépose les mots dans les bonnes zones » (on y range des noms de choses).
 */
export const SENTENCE_PROMPT = new RegExp(
  `${BEFORE_WORD}(?:mots?${AFTER_WORD}[^.?!]*?(?:dans\\s+(?:l'|le\\s+(?:bon\\s+)?)ordre(?!\\s+alphab)|phrases?${AFTER_WORD})|phrases?${AFTER_WORD}[^.?!]*?${BEFORE_WORD}mots?${AFTER_WORD})`,
  "iu",
);

/**
 * Un énoncé qui demande le NOM de ce qu'il montre : « Quel est le nom de cette
 * forme ? », « Comment s'appelle cet animal ? ». L'énoncé montre la chose (en émoji,
 * en image), les tuiles la montrent dessinée, et l'enfant apparie deux dessins sans
 * connaître un seul nom.
 */
export const NAMING_PROMPT = new RegExp(
  `${BEFORE_WORD}(?:quel(?:le)?\\s+est\\s+le\\s+nom\\s+(?:d'|d(?:e|u|es)${AFTER_WORD})|comment\\s+s'appelle(?:nt)?${AFTER_WORD}|comment\\s+appelle-t-on${AFTER_WORD})`,
  "iu",
);

/**
 * Un énoncé qui demande une TRADUCTION ou le sens d'un mot : « Comment dit-on « chat »
 * en anglais ? », « Que veut dire « dog » ? ». L'image du chat sur « cat » donnerait la
 * réponse sans que le mot anglais ait été entendu.
 */
export const TRANSLATION_PROMPT = wholeWords(
  "en\\s+anglais|in\\s+english|comment\\s+dit-on|how\\s+do\\s+you\\s+say|que\\s+veut\\s+dire|what\\s+does\\s+\\S+\\s+mean",
);

/** Les énoncés du garde-fou a, dans l'ordre. */
export const PICTURELESS_PROMPTS: readonly RegExp[] = [
  READING_PROMPT,
  DECODING_PROMPT,
  SENTENCE_PROMPT,
  NAMING_PROMPT,
  TRANSLATION_PROMPT,
];

/** Vrai quand l'énoncé demande de lire, de décoder, de ranger des mots, de nommer ou de traduire (garde-fou a). */
export function promptForbidsPictures(prompt: unknown): boolean {
  if (typeof prompt !== "string" || !prompt) return false;
  // « NFC » : une lettre accentuée écrite en deux points de code reste reconnue.
  // L'apostrophe courbe devient droite : « l’ordre » et « s’appelle » se lisent.
  const text = prompt.normalize("NFC").replace(/[‘’ʼ′]/g, "'");
  return PICTURELESS_PROMPTS.some((pattern) => pattern.test(text));
}

/* ── Les garde-fous ─────────────────────────────────────────────────────── */

export type TileContext = {
  /** L'énoncé de l'exercice : il peut demander de lire, ou montrer un émoji. */
  prompt?: string;
  /**
   * Association et glisser-déposer : les tuiles « que des émojis » (`isGlyphTile`)
   * de l'AUTRE côté que celui qu'on résout.
   */
  glyphTiles?: readonly string[];
  /**
   * QCM : les tuiles sont les réponses possibles, une seule est juste. Une tuile à
   * lettres sans image au milieu de tuiles à image la désigne (garde-fou d).
   */
  choice?: boolean;
  /**
   * Association et glisser-déposer : les textes de l'AUTRE groupe de tuiles du même
   * exercice (l'autre côté, les cases). Une même image des deux côtés relie les
   * deux par leur dessin (garde-fou f).
   */
  counterpart?: readonly string[];
  /** L'identifiant de l'image d'énoncé (`payload.image`) : c'est celle d'une tuile, elle trahit (garde-fou e). */
  exerciseImage?: string;
};

/** Le garde-fou qui a retiré les images d'un exercice. */
export type TileGuard = "a" | "b" | "c" | "d" | "e" | "f";

/** Ce que dit chaque garde-fou, pour les rapports, les tests et la documentation. */
export const TILE_GUARDS: Record<TileGuard, string> = {
  a: "l'énoncé demande de lire, de décoder, de ranger les mots d'une phrase, de nommer ou de traduire",
  b: "l'énoncé montre l'émoji d'une chose qu'une tuile nomme",
  c: "association : l'autre côté montre en émojis ce que celui-ci nomme",
  d: "QCM : une tuile à lettres sans image désigne, par élimination, la tuile qui en a une",
  e: "l'image de l'énoncé est celle d'une tuile",
  f: "association, glisser-déposer : une même image sur les deux groupes de tuiles",
};

/** Ce que `explainTilePictures` rend : les images reconnues, celles qui restent, et le garde-fou qui a tout retiré. */
export type TileResolution = {
  /** Les images reconnues (`recognizeTiles`), avant les garde-fous. */
  recognized: (ItemImage | null)[];
  /** Les images montrées : `recognized`, ou rien du tout quand un garde-fou a joué. */
  pictures: (ItemImage | null)[];
  /** Le garde-fou qui a retiré toutes les images, ou `null` : le premier, dans l'ordre a à f. */
  guard: TileGuard | null;
};

/**
 * L'image de chaque tuile, garde-fous compris, et ce qui s'est passé : un tableau de
 * la MÊME longueur que `tiles`, toujours, avec `null` pour une tuile sans image. Les
 * garde-fous a à f de l'en-tête retirent toutes les images d'un coup.
 */
export function explainTilePictures(tiles: readonly string[], ctx?: TileContext): TileResolution {
  const recognized = recognizeTiles(tiles);
  const named = recognized.filter((picture): picture is ItemImage => picture !== null);
  if (named.length === 0) return { recognized, pictures: recognized, guard: null };
  const ids = new Set(named.map((picture) => picture.id));
  const cut = (guard: TileGuard): TileResolution => ({ recognized, pictures: recognized.map(() => null), guard });

  // a. L'énoncé demande de lire, de décoder, de ranger des mots, de nommer ou de traduire.
  const prompt = typeof ctx?.prompt === "string" ? ctx.prompt : "";
  if (prompt && promptForbidsPictures(prompt)) return cut("a");

  // b. L'énoncé montre l'émoji d'une chose qu'une tuile nomme.
  if (prompt && itemImagesInText(prompt.normalize("NFC")).some((image) => ids.has(image.id))) return cut("b");

  // c. Association : l'autre côté montre en émojis ce que celui-ci nomme en mots.
  const glyphTiles = Array.isArray(ctx?.glyphTiles) ? ctx.glyphTiles : [];
  if (glyphTiles.some((tile) => itemImagesInText(tile).some((image) => ids.has(image.id)))) return cut("c");

  // d. QCM : une tuile à lettres sans image, au milieu de tuiles à image.
  if (ctx?.choice === true && tiles.some((tile, index) => recognized[index] === null && hasLetters(tile))) return cut("d");

  // e. L'image de l'énoncé est celle d'une tuile.
  if (typeof ctx?.exerciseImage === "string" && ids.has(ctx.exerciseImage)) return cut("e");

  // f. L'autre groupe de tuiles montre la même image.
  const counterpart = Array.isArray(ctx?.counterpart) ? ctx.counterpart : [];
  if (counterpart.length > 0 && recognizeTiles(counterpart).some((picture) => picture !== null && ids.has(picture.id))) {
    return cut("f");
  }

  return { recognized, pictures: recognized, guard: null };
}

/**
 * L'image de chaque tuile, garde-fous compris : un tableau de la MÊME longueur que
 * `tiles`, toujours, avec `null` pour une tuile sans image. Voir `explainTilePictures`
 * pour savoir ce qui a joué.
 */
export function resolveTilePictures(tiles: readonly string[], ctx?: TileContext): (ItemImage | null)[] {
  return explainTilePictures(tiles, ctx).pictures;
}
