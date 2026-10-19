import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { EXERCISE_IMAGE_ID } from "../exercise-images";
import {
  ITEM_IMAGES,
  ITEM_IMAGE_DIR,
  ITEM_IMAGE_ID,
  ITEM_IMAGE_SIZE,
  findItemImageByEmoji,
  findItemImageByGuardEmoji,
  findItemImageByWord,
  itemImageSrc,
  lookupItemImageWord,
  normalizeWord,
  type ItemImage,
  type ItemImageGroup,
} from "../item-images";
import { stripArticle } from "../item-pictures";

/* Les caractères invisibles et les espaces de la typographie française : construits
   par leur code, pour qu'on les voie dans la source. */
const NBSP = String.fromCharCode(0xa0);
const NARROW_NBSP = String.fromCharCode(0x202f);
const ZERO_WIDTH_SPACE = String.fromCharCode(0x200b);
const SOFT_HYPHEN = String.fromCharCode(0xad);
const VARIATION_SELECTOR = String.fromCharCode(0xfe0f);
const ZERO_WIDTH_JOINER = String.fromCharCode(0x200d);
const LEFT_TO_RIGHT_MARK = String.fromCharCode(0x200e);
const RIGHT_TO_LEFT_MARK = String.fromCharCode(0x200f);
const GRAVE_ACCENT = String.fromCharCode(0x60);
const ACUTE_ACCENT = String.fromCharCode(0xb4);
const NON_BREAKING_HYPHEN = String.fromCharCode(0x2011);
const HYPHEN = String.fromCharCode(0x2010);

const GROUPS: readonly ItemImageGroup[] = [
  "animaux",
  "aliments",
  "plantes",
  "corps",
  "objets",
  "vetements",
  "transports",
  "signalisation",
  "lieux",
  "solides",
  "moments",
  "formes",
];

const sample: ItemImage[] = [
  {
    id: "zebre",
    alt: "Un zèbre",
    group: "animaux",
    words: ["zèbre"],
    english: ["zebra"],
    emoji: ["🦓"],
    guardEmoji: ["🏇"],
    about: "a zebra",
  },
  {
    id: "pique-nique",
    alt: "Un pique-nique",
    group: "objets",
    words: ["pique-nique"],
    emoji: [],
    about: "a picnic",
  },
];

describe("normalizeWord : la forme qui se compare", () => {
  it.each<[string, string]>([
    ["Chat", "chat"],
    ["  Âne  ", "ane"],
    ["Éléphant", "elephant"],
    ["Chèvre", "chevre"],
    ["Hyène", "hyene"],
    ["Pastèque", "pasteque"],
    ["Mosquée", "mosquee"],
    ["L'éléphant", "l'elephant"],
    ["L’éléphant", "l'elephant"],
    ["l‘Âne", "l'ane"],
    ["Cœur", "coeur"],
    ["ŒUF", "oeuf"],
    ["œuf", "oeuf"],
    ["Œuf", "oeuf"],
    ["Æ", "ae"],
    ["le   chat", "le chat"],
    ["le\tchat\n", "le chat"],
    [`le${NBSP}chat`, "le chat"],
    [`le${NARROW_NBSP}chat`, "le chat"],
    ["chat.", "chat"],
    ["chat !", "chat"],
    [`chat${NARROW_NBSP}!`, "chat"],
    ["chat ?", "chat"],
    ["chat...", "chat"],
    ["chat…", "chat"],
    ["chat, ", "chat"],
    ["chat ;", "chat"],
    ["chat :", "chat"],
    ["Qui ?!", "qui"],
    ["tee-shirt", "tee-shirt"],
    ["3 pommes", "3 pommes"],
    ["le chat, le chien", "le chat, le chien"],
    ["a.b", "a.b"],
    [`ch${ZERO_WIDTH_SPACE}at`, "chat"],
    [`pa${SOFT_HYPHEN}vé`, "pave"],
    [`chat${ZERO_WIDTH_JOINER}`, "chat"],
    [`ch${ZERO_WIDTH_JOINER}at`, "chat"],
    [`${LEFT_TO_RIGHT_MARK}chat${RIGHT_TO_LEFT_MARK}`, "chat"],
    [`l${GRAVE_ACCENT}éléphant`, "l'elephant"],
    [`l${ACUTE_ACCENT}âne`, "l'ane"],
    [`tee${NON_BREAKING_HYPHEN}shirt`, "tee-shirt"],
    [`tee${HYPHEN}shirt`, "tee-shirt"],
    [`${String.fromCharCode(0x2702)}${VARIATION_SELECTOR}`, String.fromCharCode(0x2702)],
    ["", ""],
    ["   ", ""],
    ["!!!", ""],
  ])("%j donne %j", (text, expected) => {
    expect(normalizeWord(text)).toBe(expected);
  });

  it("rogne la ponctuation finale en un seul passage : une longue suite de signes suivie d'une lettre reste instantanée", () => {
    // Une expression régulière `[\s.,;:!?…]+$` y relisait tout le texte à chaque signe (650 ms pour 20 000 signes).
    const start = performance.now();
    for (const text of ["!".repeat(20_000) + "a", ". ".repeat(10_000) + "chat", "chat" + "…".repeat(20_000)]) {
      normalizeWord(text);
    }
    expect(performance.now() - start).toBeLessThan(200);
    expect(normalizeWord("chat" + "!?…. ".repeat(5))).toBe("chat");
  });

  it("est idempotente", () => {
    for (const text of ["L’Éléphant !", "ŒUF", "  le   chat…", "tee-shirt", "3 pommes"]) {
      expect(normalizeWord(normalizeWord(text)), text).toBe(normalizeWord(text));
    }
  });
});

describe("findItemImageByWord : retrouver une image par son mot", () => {
  it("trouve le singulier français, puis l'anglais", () => {
    expect(findItemImageByWord("chat")?.id).toBe("chat");
    expect(findItemImageByWord("cat")?.id).toBe("chat");
    expect(findItemImageByWord("souris")?.id).toBe("souris");
    expect(findItemImageByWord("mouse")?.id).toBe("souris");
    expect(findItemImageByWord("sheep")?.id).toBe("mouton");
    expect(findItemImageByWord("lait caillé")?.id).toBe("lait-caille");
  });

  it("dit la langue du mot : le français d'abord, l'anglais à part", () => {
    expect(lookupItemImageWord("chat")).toMatchObject({ english: false, image: { id: "chat" } });
    expect(lookupItemImageWord("cat")).toMatchObject({ english: true, image: { id: "chat" } });
    expect(lookupItemImageWord("CAT !")).toMatchObject({ english: true, image: { id: "chat" } });
    // Sans leurs accents, « éléphant » et « elephant » sont le même mot : français.
    expect(lookupItemImageWord("elephant")).toMatchObject({ english: false, image: { id: "elephant" } });
    expect(lookupItemImageWord("licorne")).toBeNull();
    expect(lookupItemImageWord(undefined as unknown as string)).toBeNull();
  });

  it("les homographes d'un mot français sont partis : « pen », « rock », « football », « moto » n'est plus le scooter", () => {
    expect(findItemImageByWord("pen")).toBeNull();
    expect(findItemImageByWord("rock")).toBeNull();
    expect(findItemImageByWord("football")).toBeNull();
    expect(findItemImageByWord("moto")?.id).toBe("moto");
    expect(findItemImageByWord("motorbike")?.id).toBe("moto");
    expect(findItemImageByWord("scooter")?.id).toBe("scooter");
    expect(findItemImageByWord("stylo")?.id).toBe("stylo");
    expect(findItemImageByWord("stone")?.id).toBe("pierre");
  });

  it("ignore la casse, les accents, l'œ et la ponctuation finale", () => {
    expect(findItemImageByWord("ÂNE")?.id).toBe("ane");
    expect(findItemImageByWord("ane")?.id).toBe("ane");
    expect(findItemImageByWord("Âne !")?.id).toBe("ane");
    expect(findItemImageByWord("Cœur")?.id).toBe("coeur");
    expect(findItemImageByWord("coeur")?.id).toBe("coeur");
    expect(findItemImageByWord("ŒUF")?.id).toBe("oeuf");
    expect(findItemImageByWord("  Éléphant.  ")?.id).toBe("elephant");
  });

  it("compare le mot ENTIER : ni pluriel, ni article, ni morceau", () => {
    for (const word of ["chats", "le chat", "un chat", "cha", "chat noir", "pomme verte", "mille", "chien-chien"]) {
      expect(findItemImageByWord(word), word).toBeNull();
    }
  });

  it("ne trouve rien pour un mot vide ou inconnu", () => {
    for (const word of ["", "   ", "...", "licorne", "xyz"]) {
      expect(findItemImageByWord(word), word).toBeNull();
    }
    expect(findItemImageByWord(undefined as unknown as string)).toBeNull();
    expect(findItemImageByWord(42 as unknown as string)).toBeNull();
  });

  it("lit le catalogue qu'on lui donne, sans toucher à celui du site", () => {
    expect(findItemImageByWord("zèbre", sample)?.id).toBe("zebre");
    expect(findItemImageByWord("ZEBRA", sample)?.id).toBe("zebre");
    expect(findItemImageByWord("pique-nique", sample)?.id).toBe("pique-nique");
    expect(findItemImageByWord("chat", sample)).toBeNull();
    // Deuxième appel avec le même tableau : l'index est déjà construit, le résultat est le même.
    expect(findItemImageByWord("zebra", sample)?.id).toBe("zebre");
    expect(findItemImageByWord("zèbre")).toBeNull();
  });
});

describe("findItemImageByEmoji : retrouver une image par son glyphe", () => {
  it("trouve les glyphes du catalogue, tous ceux d'une entrée", () => {
    expect(findItemImageByEmoji("🐈")?.id).toBe("chat");
    expect(findItemImageByEmoji("🐱")?.id).toBe("chat");
    expect(findItemImageByEmoji("🐘")?.id).toBe("elephant");
    expect(findItemImageByEmoji("🍊")?.id).toBe("orange");
    expect(findItemImageByEmoji("🥭")?.id).toBe("mangue");
  });

  it("ne tient pas compte du sélecteur U+FE0F", () => {
    const scissors = String.fromCharCode(0x2702);
    expect(findItemImageByEmoji(scissors)?.id).toBe("ciseaux");
    expect(findItemImageByEmoji(`${scissors}${VARIATION_SELECTOR}`)?.id).toBe("ciseaux");
    const plate = String.fromCodePoint(0x1f37d);
    expect(findItemImageByEmoji(plate)?.id).toBe("assiette");
    expect(findItemImageByEmoji(`${plate}${VARIATION_SELECTOR}`)?.id).toBe("assiette");
  });

  it("ignore les espaces autour, et ne trouve rien d'inconnu", () => {
    expect(findItemImageByEmoji(" 🐈 ")?.id).toBe("chat");
    for (const glyph of ["", " ", "🦄", "chat", "🐈🐈", "A"]) {
      expect(findItemImageByEmoji(glyph), glyph).toBeNull();
    }
    expect(findItemImageByEmoji(undefined as unknown as string)).toBeNull();
  });

  it("lit le catalogue qu'on lui donne", () => {
    expect(findItemImageByEmoji("🦓", sample)?.id).toBe("zebre");
    expect(findItemImageByEmoji("🐈", sample)).toBeNull();
    expect(findItemImageByEmoji("🦓")).toBeNull();
  });
});

describe("findItemImageByGuardEmoji : la lecture LARGE des garde-fous", () => {
  it("trouve les glyphes prudents, et ceux que seuls les garde-fous lisent", () => {
    expect(findItemImageByGuardEmoji("🐈")?.id).toBe("chat");
    expect(findItemImageByGuardEmoji("⬛")?.id).toBe("carre");
    expect(findItemImageByGuardEmoji("🔴")?.id).toBe("rond");
    expect(findItemImageByGuardEmoji("🔺")?.id).toBe("triangle");
    expect(findItemImageByGuardEmoji("🎲")?.id).toBe("cube");
    expect(findItemImageByGuardEmoji("🧱")?.id).toBe("pave");
    expect(findItemImageByGuardEmoji("🥫")?.id).toBe("cylindre");
    // Le baril porte un sélecteur U+FE0F : avec ou sans lui, c'est la même chose.
    expect(findItemImageByGuardEmoji(`${String.fromCodePoint(0x1f6e2)}${VARIATION_SELECTOR}`)?.id).toBe("cylindre");
    expect(findItemImageByGuardEmoji(String.fromCodePoint(0x1f6e2))?.id).toBe("cylindre");
    expect(findItemImageByGuardEmoji("💧")?.id).toBe("eau");
  });

  it("ne tient pas compte du sélecteur U+FE0F, comme `findItemImageByEmoji`", () => {
    const heart = String.fromCharCode(0x2764);
    expect(findItemImageByGuardEmoji(heart)?.id).toBe("coeur");
    expect(findItemImageByGuardEmoji(`${heart}${VARIATION_SELECTOR}`)?.id).toBe("coeur");
  });

  it("`findItemImageByEmoji`, lui, reste PRUDENT : un rond rouge n'est pas le rond d'une tuile « [rond] rouge »", () => {
    for (const glyph of ["⬛", "🔴", "🔺", "🎲", "🥫", "💧", "⭐"]) {
      expect(findItemImageByEmoji(glyph), glyph).toBeNull();
    }
  });

  it("lit le catalogue qu'on lui donne, avec ses glyphes larges", () => {
    expect(findItemImageByGuardEmoji("🏇", sample)?.id).toBe("zebre");
    expect(findItemImageByGuardEmoji("🦓", sample)?.id).toBe("zebre");
    expect(findItemImageByEmoji("🏇", sample)).toBeNull();
    expect(findItemImageByGuardEmoji("🏇")).toBeNull();
  });

  it("ignore ce qui n'est pas un glyphe", () => {
    for (const glyph of ["", " ", "chat", "🐈🐈", "A"]) expect(findItemImageByGuardEmoji(glyph), glyph).toBeNull();
    expect(findItemImageByGuardEmoji(undefined as unknown as string)).toBeNull();
  });
});

describe("les chemins des fichiers", () => {
  it("sert l'image depuis les fichiers du site", () => {
    expect(ITEM_IMAGE_DIR).toBe("/objets");
    expect(itemImageSrc("chat")).toBe("/objets/chat.webp");
    expect(itemImageSrc("lait-caille")).toBe("/objets/lait-caille.webp");
    expect(ITEM_IMAGE_SIZE).toBe(384);
  });

  it("a le même identifiant sûr que les images d'énoncé, et refuse un nom de fichier dangereux", () => {
    expect(ITEM_IMAGE_ID.source).toBe(EXERCISE_IMAGE_ID.source);
    for (const id of ["../secret", "Chat", "chat.webp", "a/b", "chat ", "-chat", "chat-", "", "chat_2"]) {
      expect(ITEM_IMAGE_ID.test(id), id).toBe(false);
    }
    for (const id of ["chat", "lait-caille", "tee-shirt", "b52"]) {
      expect(ITEM_IMAGE_ID.test(id), id).toBe(true);
    }
  });
});

/**
 * LE CATALOGUE LUI-MÊME. Une tuile n'est reconnue que si son mot est au
 * catalogue : un mot donné à deux images, ou un mot qui commence par un article
 * (que `pictureForTile` retire avant de chercher), serait une image qu'on ne
 * trouve jamais ou la mauvaise.
 */
describe("catalogue des images de tuiles : les entrées", () => {
  it("contient les 98 images : les 88 de la première vague, le cylindre, le matin et le pilon refaits, sept mots fréquents de plus", () => {
    expect(ITEM_IMAGES.length).toBeGreaterThanOrEqual(98);
    for (const id of ["cylindre", "matin", "pilon", "eau", "fleur", "feuille", "lit", "bissap", "fromager", "moto"]) {
      expect(ITEM_IMAGES.some((image) => image.id === id), id).toBe(true);
    }
  });

  it("chaque entrée a un identifiant sûr et unique, un texte alternatif, un sujet et un groupe connu", () => {
    const ids = ITEM_IMAGES.map((image) => image.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const image of ITEM_IMAGES) {
      expect(image.id, image.id).toMatch(ITEM_IMAGE_ID);
      expect(image.alt.trim().length, `${image.id} : alt`).toBeGreaterThan(2);
      expect(image.alt, `${image.id} : alt`).not.toMatch(/^(image|photo|dessin) de/i);
      expect(image.about.trim().length, `${image.id} : about`).toBeGreaterThan(2);
      expect(GROUPS, `${image.id} : group`).toContain(image.group);
    }
  });

  it("chaque groupe a au moins une image", () => {
    for (const group of GROUPS) {
      expect(ITEM_IMAGES.some((image) => image.group === group), group).toBe(true);
    }
  });

  it("chaque entrée a au moins un mot, et des mots qui se comparent", () => {
    for (const image of ITEM_IMAGES) {
      expect(image.words.length, `${image.id} : words`).toBeGreaterThan(0);
      for (const word of image.words) {
        const key = normalizeWord(word);
        expect(key.length, `${image.id} : « ${word} »`).toBeGreaterThan(0);
        // Un mot du catalogue s'écrit au singulier, sans ponctuation finale.
        expect(key, `${image.id} : « ${word} »`).not.toMatch(/[.,;:!?…]$/);
      }
    }
  });

  it("les noms anglais se comparent aussi, et ne répètent pas un mot français de la même image", () => {
    for (const image of ITEM_IMAGES) {
      for (const word of image.english ?? []) {
        const key = normalizeWord(word);
        expect(key.length, `${image.id} : « ${word} »`).toBeGreaterThan(0);
        expect(key, `${image.id} : « ${word} »`).not.toMatch(/[.,;:!?…]$/);
        expect(image.words.map(normalizeWord), `${image.id} : « ${word} » est déjà un mot français`).not.toContain(key);
      }
    }
  });

  it("aucun mot ne commence par un article : pictureForTile le retirerait avant de chercher", () => {
    for (const image of [...ITEM_IMAGES]) {
      for (const word of [...image.words, ...(image.english ?? [])]) {
        expect(stripArticle(normalizeWord(word)).article, `${image.id} : « ${word} »`).toBe("");
      }
    }
  });

  it("le nom accessible nomme la chose : il contient le premier mot de l'entrée", () => {
    for (const image of ITEM_IMAGES) {
      expect(normalizeWord(image.alt), image.id).toContain(normalizeWord(image.words[0]));
    }
  });

  it("aucun mot, français ou anglais, après normalisation, n'est donné à deux images différentes", () => {
    const owner = new Map<string, string>();
    const clashes: string[] = [];
    for (const image of ITEM_IMAGES) {
      for (const word of [...image.words, ...(image.english ?? [])]) {
        const key = normalizeWord(word);
        const known = owner.get(key);
        if (known && known !== image.id) clashes.push(`« ${key} » : ${known} et ${image.id}`);
        owner.set(key, image.id);
      }
    }
    expect(clashes).toEqual([]);
  });

  it("aucun émoji, prudent ou large, sans son sélecteur U+FE0F, n'est donné à deux images différentes", () => {
    const owner = new Map<string, string>();
    const clashes: string[] = [];
    for (const image of ITEM_IMAGES) {
      for (const glyph of [...image.emoji, ...(image.guardEmoji ?? [])]) {
        expect(glyph.trim().length, `${image.id} : émoji vide`).toBeGreaterThan(0);
        expect(glyph, `${image.id} : un émoji, pas un mot`).not.toMatch(/[\p{L}\p{N}]/u);
        const key = glyph.split(VARIATION_SELECTOR).join("");
        const known = owner.get(key);
        if (known && known !== image.id) clashes.push(`${key} : ${known} et ${image.id}`);
        owner.set(key, image.id);
      }
    }
    expect(clashes).toEqual([]);
  });

  it("chaque mot normalisé pointe vers une seule image : la sienne, et la bonne langue", () => {
    for (const image of ITEM_IMAGES) {
      for (const word of image.words) {
        expect(lookupItemImageWord(word), `${image.id} : « ${word} »`).toMatchObject({ english: false, image: { id: image.id } });
      }
      for (const word of image.english ?? []) {
        expect(lookupItemImageWord(word), `${image.id} : « ${word} »`).toMatchObject({ english: true, image: { id: image.id } });
      }
    }
  });

  it("chaque émoji pointe vers l'image qui le porte, par la lecture prudente comme par la large", () => {
    for (const image of ITEM_IMAGES) {
      for (const glyph of image.emoji) {
        expect(findItemImageByEmoji(glyph)?.id, `${image.id} : ${glyph}`).toBe(image.id);
        expect(findItemImageByGuardEmoji(glyph)?.id, `${image.id} : ${glyph}`).toBe(image.id);
      }
      for (const glyph of image.guardEmoji ?? []) {
        expect(glyph, `${image.id} : un émoji, pas un mot`).not.toMatch(/[\p{L}\p{N}]/u);
        expect(findItemImageByGuardEmoji(glyph)?.id, `${image.id} : ${glyph}`).toBe(image.id);
        // Un glyphe large ne figure pas aussi dans la liste prudente : il ne sert qu'aux garde-fous.
        expect(image.emoji.map((g) => g.split(VARIATION_SELECTOR).join("")), `${image.id} : ${glyph}`).not.toContain(
          glyph.split(VARIATION_SELECTOR).join(""),
        );
      }
    }
  });

  it("les formes et les solides sont lus LARGE par les garde-fous, et prudemment en tête de tuile", () => {
    for (const id of ["carre", "rond", "triangle", "coeur", "etoile", "cube", "pave", "boule", "cylindre"]) {
      const image = ITEM_IMAGES.find((entry) => entry.id === id);
      expect(image?.guardEmoji?.length, id).toBeGreaterThan(0);
      expect(image?.emoji, id).toEqual([]);
    }
  });

  it("garde l'ambiguïté de l'orange et de la pierre : le mot seul n'est pas donné", () => {
    expect(ITEM_IMAGES.find((image) => image.id === "orange")?.ambiguousBare).toBe(true);
    expect(ITEM_IMAGES.find((image) => image.id === "pierre")?.ambiguousBare).toBe(true);
    // Un mot ambigu doit pouvoir recevoir son image sans article : par l'émoji de la chose en
    // tête de tuile, ou par son groupe (« ferme » parmi d'autres lieux). Il lui faut l'un des deux.
    for (const image of ITEM_IMAGES.filter((entry) => entry.ambiguousBare)) {
      expect(image.emoji.length > 0 || image.bareInGroup !== undefined, `${image.id} : émoji ou groupe`).toBe(true);
    }
  });

  it("`bareInGroup` nomme un groupe qui existe, et ne va qu'à un mot ambigu", () => {
    for (const image of ITEM_IMAGES.filter((entry) => entry.bareInGroup)) {
      expect(GROUPS, `${image.id}`).toContain(image.bareInGroup);
      expect(image.ambiguousBare, `${image.id}`).toBe(true);
    }
    expect(ITEM_IMAGES.find((image) => image.id === "orange")?.bareInGroup).toBe("aliments");
    expect(ITEM_IMAGES.find((image) => image.id === "pierre")?.bareInGroup).toBe("lieux");
  });

  it("les formes sont dessinées par le script, et le disent en français", () => {
    const shapes = ITEM_IMAGES.filter((image) => image.group === "formes");
    expect(shapes.map((image) => image.id)).toEqual(["carre", "rond", "triangle", "rectangle", "coeur", "etoile"]);
    for (const shape of shapes) {
      expect(shape.about, shape.id).toMatch(/dessinée? par scripts\/build-item-images\.mjs$/);
    }
  });
});

/** Les dimensions d'un fichier webp, lues dans son en-tête, sans décoder l'image. */
function webpSize(buffer: Buffer): { width: number; height: number } | null {
  if (buffer.length < 30) return null;
  if (buffer.toString("ascii", 0, 4) !== "RIFF" || buffer.toString("ascii", 8, 12) !== "WEBP") return null;
  const kind = buffer.toString("ascii", 12, 16);
  if (kind === "VP8 ") {
    return { width: buffer.readUInt16LE(26) & 0x3fff, height: buffer.readUInt16LE(28) & 0x3fff };
  }
  if (kind === "VP8L") {
    const bits = buffer.readUInt32LE(21);
    return { width: (bits & 0x3fff) + 1, height: ((bits >>> 14) & 0x3fff) + 1 };
  }
  if (kind === "VP8X") {
    return { width: buffer.readUIntLE(24, 3) + 1, height: buffer.readUIntLE(27, 3) + 1 };
  }
  return null;
}

/**
 * UNE ENTRÉE, UN FICHIER ; UN FICHIER, UNE ENTRÉE. Le catalogue promet des images
 * aux tuiles : un fichier absent affiche l'émoji de repli ou rien, le défaut même
 * qu'on corrige ; un fichier sans entrée est une image fabriquée et jamais montrée,
 * ou une image refusée restée dans le dossier (le cylindre, le matin et le pilon
 * l'ont été : leurs fichiers ne sont pas dans `public/objets/`).
 *
 * Cette garde vaut toujours. Elle s'appliquait d'abord seulement avec
 * `ITEM_IMAGES_REQUIRE_FILES=1`, le temps que les images du studio arrivent par
 * `scripts/build-item-images.mjs` après le catalogue ; elles sont toutes livrées.
 * Ajouter une entrée sans son fichier, ou un fichier sans son entrée, casse ce test.
 */
describe("catalogue des images de tuiles : les fichiers", () => {
  const dir = join(process.cwd(), "public", "objets");
  const files = existsSync(dir) ? readdirSync(dir).filter((name) => name.endsWith(".webp")) : [];

  it("le dossier public/objets existe et contient des images", () => {
    expect(existsSync(dir)).toBe(true);
    expect(files.length).toBeGreaterThan(0);
  });

  it("chaque entrée a son fichier public/objets/<id>.webp", () => {
    const missing = ITEM_IMAGES.map((image) => image.id).filter((id) => !files.includes(`${id}.webp`));
    expect(missing).toEqual([]);
  });

  it("chaque fichier a son entrée : pas d'image orpheline", () => {
    const known = new Set(ITEM_IMAGES.map((image) => `${image.id}.webp`));
    expect(files.filter((file) => !known.has(file))).toEqual([]);
  });

  it("chaque fichier est un webp de 384 × 384", () => {
    for (const file of files) {
      expect(webpSize(readFileSync(join(dir, file))), file).toEqual({
        width: ITEM_IMAGE_SIZE,
        height: ITEM_IMAGE_SIZE,
      });
    }
  });

  /* Un fichier de plus de 40 Ko n'est pas passé par le script de conversion (webp
     qualité 85, 384 × 384 : les plus lourds font 21 Ko). Un fichier de moins de 1 Ko
     est vide ou cassé : les formes pleines, les plus légères, pèsent environ 1,4 Ko. */
  it("chaque fichier pèse entre 1 et 40 Ko", () => {
    for (const file of files) {
      const bytes = statSync(join(dir, file)).size;
      expect(bytes, file).toBeGreaterThanOrEqual(1024);
      expect(bytes, file).toBeLessThanOrEqual(40 * 1024);
    }
  });
});
