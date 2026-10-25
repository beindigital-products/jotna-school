import { describe, expect, it } from "vitest";
import { splitLeadingEmoji } from "@/components/student/game-kit/choix-texte";
import { ITEM_IMAGES } from "../item-images";
import {
  DECODING_PROMPT,
  NAMING_PROMPT,
  PICTURE_TILE_CLASSES,
  READING_PROMPT,
  SENTENCE_PROMPT,
  TILE_GUARDS,
  TRANSLATION_PROMPT,
  explainTilePictures,
  isGlyphTile,
  isPictureTileClass,
  itemImagesInText,
  matchTile,
  pictureForTile,
  promptForbidsPictures,
  recognizeTiles,
  resolveTilePictures,
  splitTile,
  stripArticle,
} from "../item-pictures";

/* Les glyphes qui portent un sélecteur U+FE0F, et les accents combinants : construits
   par leur code, pour qu'on les voie dans la source. */
const VARIATION_SELECTOR = String.fromCharCode(0xfe0f);
const COMBINING_ACUTE = String.fromCharCode(0x301);
const NBSP = String.fromCharCode(0xa0);
const withSelector = (codePoint: number) => `${String.fromCodePoint(codePoint)}${VARIATION_SELECTOR}`;
const MOTORBIKE = withSelector(0x1f3cd);
const SCOOTER = String.fromCodePoint(0x1f6f5);
const PENCIL = withSelector(0x270f);
const SCISSORS = withSelector(0x2702);
const PEN = withSelector(0x1f58a);

const idOf = (text: string) => pictureForTile(text)?.id ?? null;
const idsOf = (pictures: ReturnType<typeof resolveTilePictures>) => pictures.map((picture) => picture?.id ?? null);
const recognizedIds = (tiles: string[]) => idsOf(recognizeTiles(tiles));

describe("isPictureTileClass : la porte", () => {
  it("n'ouvre que sur le CI", () => {
    expect(PICTURE_TILE_CLASSES).toEqual(["CI"]);
    expect(isPictureTileClass("CI")).toBe(true);
  });

  it.each(["CP", "CE1", "CE2", "CM1", "CM2", "ci", "Ci", "", " CI", "6ème"])("refuse la classe %j", (klass) => {
    expect(isPictureTileClass(klass)).toBe(false);
  });

  it("un niveau absent n'est pas une classe", () => {
    expect(isPictureTileClass(undefined)).toBe(false);
    expect(isPictureTileClass(null)).toBe(false);
  });
});

describe("splitTile : l'émoji de tête", () => {
  it("sépare l'émoji de son mot", () => {
    expect(splitTile("🐕 le chien")).toEqual({ emoji: "🐕", rest: "le chien" });
    expect(splitTile("🐕le chien")).toEqual({ emoji: "🐕", rest: "le chien" });
    expect(splitTile("🐕   le chien")).toEqual({ emoji: "🐕", rest: "le chien" });
  });

  it("garde plusieurs émojis de tête ensemble, espaces entre eux comprises", () => {
    expect(splitTile("🐕🐈 les animaux")).toEqual({ emoji: "🐕🐈", rest: "les animaux" });
    expect(splitTile("🐕 🐈 les animaux")).toEqual({ emoji: "🐕 🐈", rest: "les animaux" });
  });

  it("garde le sélecteur U+FE0F dans l'émoji", () => {
    expect(splitTile(`${PENCIL} le crayon`)).toEqual({ emoji: PENCIL, rest: "le crayon" });
    expect(splitTile(`${MOTORBIKE}la moto`)).toEqual({ emoji: MOTORBIKE, rest: "la moto" });
  });

  it("sans émoji en tête : tout est le texte, même avec un émoji plus loin", () => {
    expect(splitTile("le chien")).toEqual({ emoji: "", rest: "le chien" });
    expect(splitTile("le chien 🐕")).toEqual({ emoji: "", rest: "le chien 🐕" });
    expect(splitTile("")).toEqual({ emoji: "", rest: "" });
  });

  it("rien que des émojis : le texte est vide", () => {
    expect(splitTile("🐕")).toEqual({ emoji: "🐕", rest: "" });
    expect(splitTile("🍎🍎🍎")).toEqual({ emoji: "🍎🍎🍎", rest: "" });
    expect(splitTile("🍎 🍎")).toEqual({ emoji: "🍎 🍎", rest: "" });
  });

  it("ne prend ni un chiffre, ni une flèche, ni une lettre pour un émoji", () => {
    expect(splitTile("3 pommes")).toEqual({ emoji: "", rest: "3 pommes" });
    expect(splitTile("→ chat")).toEqual({ emoji: "", rest: "→ chat" });
    expect(splitTile("© chat")).toEqual({ emoji: "", rest: "© chat" });
  });

  it("coupe comme `splitLeadingEmoji` du kit de jeu : les deux règles restent les mêmes", () => {
    const samples = [
      "🐕 le chien",
      "🐕le chien",
      "🐕   le chien",
      "🐕🐈 les animaux",
      "🐕 🐈 les animaux",
      `${PENCIL} le crayon`,
      `${MOTORBIKE}la moto`,
      "le chien",
      "le chien 🐕",
      "",
      "🐕",
      "🍎🍎🍎",
      "🍎 🍎",
      "3 pommes",
      "→ chat",
      "🍎 3 pommes",
      "🥭 la mangue",
      "🍊 l'orange",
      `${SCISSORS} les ciseaux`,
      `${PEN} le stylo`,
      "  🐕 le chien",
      `🐕${NBSP}le chien`,
      "Fatou",
    ];
    for (const text of samples) {
      expect(splitTile(text), JSON.stringify(text)).toEqual(splitLeadingEmoji(text));
    }
  });
});

describe("isGlyphTile : une tuile que des émojis", () => {
  it("reconnaît un émoji, plusieurs, avec ou sans espaces", () => {
    expect(isGlyphTile("🐈")).toBe(true);
    expect(isGlyphTile("🐈🐈🐈")).toBe(true);
    expect(isGlyphTile("🐈 🐈")).toBe(true);
    expect(isGlyphTile(`${PENCIL}`)).toBe(true);
  });

  it("refuse un texte, un nombre, un émoji accompagné d'un mot, le vide", () => {
    for (const text of ["le chat", "3", "🐈 le chat", "🐈 3", "", "  "]) {
      expect(isGlyphTile(text), JSON.stringify(text)).toBe(false);
    }
  });
});

describe("stripArticle : l'article qui ouvre une tuile", () => {
  it.each([
    ["le chat", "chat", "le"],
    ["la table", "table", "la"],
    ["l'elephant", "elephant", "l'"],
    ["l' elephant", "elephant", "l'"],
    ["les chats", "chats", "les"],
    ["un chat", "chat", "un"],
    ["une poule", "poule", "une"],
    ["des ciseaux", "ciseaux", "des"],
    ["du mil", "mil", "du"],
    ["de la table", "table", "de la"],
    ["de l'eau", "eau", "de l'"],
  ])("%j donne le mot %j, l'article %j", (text, word, article) => {
    expect(stripArticle(text)).toEqual({ word, article });
  });

  it.each(["chat", "lait caille", "lemon", "dune", "lesté", "unique", "debout", "un", "le", "tee-shirt"])(
    "%j n'a pas d'article",
    (text) => {
      expect(stripArticle(text), text).toEqual({ word: text, article: "" });
    },
  );

  it("ne retire qu'un article", () => {
    expect(stripArticle("le un chat")).toEqual({ word: "un chat", article: "le" });
  });
});

describe("pictureForTile : les tuiles de la production (CI)", () => {
  it.each([
    ["🐕 le chien", "chien"],
    ["🦒 la girafe", "girafe"],
    ["🐘 l'éléphant", "elephant"],
    ["🥭 la mangue", "mangue"],
    ["🍊 l'orange", "orange"],
    ["Lion", "lion"],
    ["Poule", "poule"],
    ["Chat", "chat"],
    ["Âne", "ane"],
    ["Chèvre", "chevre"],
    ["La table", "table"],
    ["Le seau", "seau"],
    ["Seau", "seau"],
    ["Le baobab", "baobab"],
    ["La mosquée", "mosquee"],
    ["Une charrette", "charrette"],
    ["le cube", "cube"],
    ["le pavé", "pave"],
    ["la boule", "boule"],
    ["midi", "midi"],
    ["Le soir", "soir"],
    ["la nuit", "nuit"],
    ["Le matin", "matin"],
    ["matin", "matin"],
    ["le cylindre", "cylindre"],
    ["Cylindre", "cylindre"],
    ["Le pilon", "pilon"],
    ["Un pilon", "pilon"],
    ["L'eau", "eau"],
    ["Eau", "eau"],
    ["de l'eau", "eau"],
    ["Fleur", "fleur"],
    ["La feuille", "feuille"],
    ["lit", "lit"],
    ["Bissap", "bissap"],
    ["Fromager", "fromager"],
    ["la moto", "moto"],
    ["Moto", "moto"],
    ["le scooter", "scooter"],
    ["une orange", "orange"],
    ["cow", "vache"],
    ["sheep", "mouton"],
    ["dog", "chien"],
    ["apple", "pomme"],
    ["lemon", "citron"],
  ])("%j reçoit l'image %j", (text, id) => {
    expect(idOf(text)).toBe(id);
  });

  it.each([
    "orange",
    "Mille",
    "les chats",
    "3 pommes",
    "🍎 3 pommes",
    "🍎",
    "Fatou",
  ])("%j ne reçoit rien", (text) => {
    expect(pictureForTile(text)).toBeNull();
  });

  // La vague 2 : les tuiles que la production nommait encore sans image (les parties de la
  // plante, les plats, le corps, les feux, des lieux, des objets) et les gabarits du code.
  it.each([
    ["Tige", "tige"],
    ["Racine", "racine"],
    ["Fruit", "fruit"],
    ["Fruits du baobab", "fruit-du-baobab"],
    ["Fruits du fromager", "fruit-du-fromager"],
    ["Yassa", "yassa"],
    ["Mafé", "mafe"],
    ["Thiéboudienne", "thieboudienne"],
    ["L'après-midi", "apres-midi"],
    ["auto", "voiture"],
    ["Feuilles", "feuille"],
    ["Fleurs", "fleur"],
    ["Les livres", "livre"],
    ["📚 les livres", "livre"],
    ["La fenêtre", "fenetre"],
    ["Le nez", "nez"],
    ["Les yeux", "yeux"],
    ["L'œil", "yeux"],
    ["Les oreilles", "oreille"],
    ["la langue", "langue"],
    ["feu rouge", "feu-rouge"],
    ["Le feu vert", "feu-vert"],
    ["Un passage pour piétons", "passage-pour-pietons"],
    ["La salle de classe", "salle-de-classe"],
    ["la savane", "savane"],
    ["Le marché", "marche"],
    ["La ferme", "ferme"],
  ])("%j (vague 2) reçoit l'image %j", (text, id) => {
    expect(idOf(text)).toBe(id);
  });

  // Un verbe s'écrit comme un nom : seul et sans article, « ferme » ne reçoit pas la ferme, sauf
  // au milieu d'autres lieux, où le doute n'existe plus.
  it("« ferme », « marche » et « tente » seuls ne reçoivent rien, mais prennent leur image parmi des lieux", () => {
    for (const verb of ["ferme", "marche", "tente"]) expect(pictureForTile(verb), verb).toBeNull();
    expect(idsOf(resolveTilePictures(["Ferme", "la maison", "l'arbre"], { prompt: "Où va-t-on ?" }))).toEqual([
      "ferme",
      "maison",
      "arbre",
    ]);
  });

  // Le cylindre, le matin et le pilon avaient été refusés au studio après trois tours (pas
  // d'entrée, donc pas d'image) ; ils sont revenus au quatrième avec les consignes que la
  // documentation avait écrites pour eux. Ces trois noms valent désormais une image.
  it.each(["le cylindre", "Le matin", "Un pilon"])("%j (image refaite) reçoit son image", (text) => {
    expect(pictureForTile(text)).not.toBeNull();
  });
});

describe("pictureForTile : articles, apostrophes, accents, casse, ponctuation", () => {
  it.each([
    ["le chat", "chat"],
    ["la poule", "poule"],
    ["un chat", "chat"],
    ["une poule", "poule"],
    ["des ciseaux", "ciseaux"],
    ["Les ciseaux", "ciseaux"],
    ["du mil", "mil"],
    ["de la table", "table"],
    ["du lait caillé", "lait-caille"],
    ["Lait caillé", "lait-caille"],
    ["l'âne", "ane"],
    ["L’âne", "ane"],
    ["l’éléphant", "elephant"],
    ["L'ÉLÉPHANT", "elephant"],
    ["l' éléphant", "elephant"],
    ["un tee-shirt", "tee-shirt"],
    ["T-shirt", "tee-shirt"],
    ["une étoile", "etoile"],
  ])("%j reçoit l'image %j", (text, id) => {
    expect(idOf(text)).toBe(id);
  });

  it.each([
    ["CHÈVRE", "chevre"],
    ["chevre", "chevre"],
    ["Cœur", "coeur"],
    ["coeur", "coeur"],
    ["un cœur", "coeur"],
    ["ŒUF", "oeuf"],
    ["œuf", "oeuf"],
    ["OEUF", "oeuf"],
    ["Éléphant", "elephant"],
    ["elephant", "elephant"],
    ["Hyène", "hyene"],
    ["LION", "lion"],
    ["lIoN", "lion"],
  ])("%j : accents, œ et casse ne comptent pas", (text, id) => {
    expect(idOf(text)).toBe(id);
  });

  it.each([
    ["Le chat.", "chat"],
    ["le chien !", "chien"],
    ["Chat ?", "chat"],
    ["la poule…", "poule"],
    ["le lion...", "lion"],
    ["  le   chat  ", "chat"],
    [`le${NBSP}chat`, "chat"],
    ["le chat ;", "chat"],
  ])("%j : la ponctuation finale et les espaces ne comptent pas", (text, id) => {
    expect(idOf(text)).toBe(id);
  });

  it("reconnaît les noms anglais du catalogue", () => {
    for (const [text, id] of [
      ["cat", "chat"],
      ["Dog", "chien"],
      ["horse", "cheval"],
      ["chicken", "poule"],
      ["hen", "poule"],
      ["sheep", "mouton"],
      ["mouse", "souris"],
      ["banana", "banane"],
      ["lemon", "citron"],
    ]) {
      expect(idOf(text), text).toBe(id);
    }
  });

  it("refuse l'article anglais : « the cat » n'est pas une tuile du catalogue", () => {
    expect(pictureForTile("the cat")).toBeNull();
  });
});

describe("pictureForTile : la correspondance est exacte, jamais partielle", () => {
  it.each([
    "chats",
    "les chats",
    "des pommes",
    "les poules",
    "des lions",
    "les éléphants",
    "oranges",
    "des oranges",
    "le grand chat",
    "chat noir",
    "chat et chien",
    "un chat noir",
    "pomme verte",
    "midi et demi",
    "Fruits du manguier",
    "le chat dort",
    "la table de 2",
    "L'eau minérale",
    "Mille",
    "Fatou",
    "Moussa",
  ])("%j ne reçoit rien", (text) => {
    expect(pictureForTile(text)).toBeNull();
  });

  it("refuse un texte sans lettre, vide ou fait de signes", () => {
    for (const text of ["", "   ", "?", "...", "+", "→", "3 + 2", "12", "5"]) {
      expect(pictureForTile(text), JSON.stringify(text)).toBeNull();
    }
  });

  it("refuse tout ce qui n'est pas un texte", () => {
    expect(pictureForTile(undefined as unknown as string)).toBeNull();
    expect(pictureForTile(null as unknown as string)).toBeNull();
    expect(pictureForTile(12 as unknown as string)).toBeNull();
  });
});

describe("pictureForTile : un mot ambigu (l'orange)", () => {
  it.each(["orange", "Orange", "ORANGE", "orange !", "des oranges", "Oranges"])("%j seul ne reçoit rien", (text) => {
    expect(pictureForTile(text)).toBeNull();
  });

  it.each(["une orange", "Une orange", "l'orange", "L’orange", "une orange.", "de l'orange"])(
    "%j reçoit le fruit, grâce à son article",
    (text) => {
      expect(idOf(text)).toBe("orange");
    },
  );

  it("reçoit le fruit avec l'émoji du fruit en tête", () => {
    expect(idOf("🍊 orange")).toBe("orange");
    expect(idOf("🍊orange")).toBe("orange");
    expect(idOf("🍊 une orange")).toBe("orange");
  });

  it("ne reçoit rien avec l'émoji d'une COULEUR ou d'une autre chose en tête", () => {
    expect(pictureForTile("🟠 orange")).toBeNull();
    expect(pictureForTile("🧡 orange")).toBeNull();
    // Une pomme n'est pas une orange : pas de repli sur l'émoji de tête non plus.
    expect(pictureForTile("🍎 orange")).toBeNull();
  });
});

describe("pictureForTile : le repli par l'émoji de tête", () => {
  it.each([
    ["🐕 Rex", "chien"],
    ["🐶 Médor", "chien"],
    ["🍎 une belle pomme", "pomme"],
    ["🍎 pomme verte", "pomme"],
    ["🐕 Rex et Médor", "chien"],
    ["🐈 Minou", "chat"],
    ["⚽ un ballon rouge", "ballon"],
    ["🐘 Babar", "elephant"],
  ])("%j reçoit l'image de son émoji : %j", (text, id) => {
    expect(idOf(text)).toBe(id);
  });

  it("reconnaît un émoji qui porte un sélecteur U+FE0F", () => {
    // La moto et le scooter sont deux images : l'émoji de la moto ne prend plus celle du scooter.
    expect(idOf(`${MOTORBIKE} Zoé`)).toBe("moto");
    expect(idOf(`${SCOOTER} Zoé`)).toBe("scooter");
    expect(idOf(`${PENCIL} le crayon`)).toBe("crayon");
    expect(idOf(`${SCISSORS} les ciseaux`)).toBe("ciseaux");
    expect(idOf(`${PEN} le stylo`)).toBe("stylo");
  });

  it("ne s'applique pas quand le reste a un chiffre", () => {
    expect(pictureForTile("🍎 3 pommes")).toBeNull();
    expect(pictureForTile("🐕 Rex 2")).toBeNull();
    expect(pictureForTile("🍎 2")).toBeNull();
  });

  it("ne s'applique pas quand le reste est un nombre écrit en lettres : un comptage", () => {
    expect(pictureForTile("🍎 trois pommes")).toBeNull();
    expect(pictureForTile("🍎 deux")).toBeNull();
    expect(pictureForTile("🐕 dix chiens")).toBeNull();
  });

  it("ne s'applique pas à plus de trois mots", () => {
    expect(pictureForTile("🐕 Rex le grand chien")).toBeNull();
    expect(pictureForTile("🍎 une très belle pomme")).toBeNull();
  });

  it("ne s'applique pas à un émoji hors catalogue", () => {
    expect(pictureForTile("🔴 rouge")).toBeNull();
    expect(pictureForTile("🦄 Licorne")).toBeNull();
  });

  it("ne s'applique pas à une rangée d'émojis en tête : un comptage, une frise", () => {
    expect(pictureForTile("🍎🍎 pomme")).toBeNull();
    expect(pictureForTile("🍎🍎🍎 pommes")).toBeNull();
    expect(pictureForTile("🐕 🐈 chien et chat")).toBeNull();
  });

  it("le mot du catalogue passe avant l'émoji de tête", () => {
    expect(idOf("🐕 le chat")).toBe("chat");
  });
});

describe("pictureForTile : une tuile qui n'est QUE des émojis reste telle quelle", () => {
  it.each(["🍎", "🍎🍎🍎", "🍎 🍎", "🐈🐕", "🐈", "🟦", "🔺", "⭐", "🍊"])("%j ne reçoit rien", (text) => {
    expect(pictureForTile(text)).toBeNull();
  });

  it("aucun émoji du catalogue, seul, ne reçoit son image", () => {
    for (const image of ITEM_IMAGES) {
      for (const glyph of [...image.emoji, ...(image.guardEmoji ?? [])]) {
        expect(pictureForTile(glyph), `${image.id} : ${glyph}`).toBeNull();
      }
    }
  });
});

describe("pictureForTile : tout le catalogue", () => {
  it("chaque mot reçoit son image (sauf le mot ambigu seul), avec ou sans article", () => {
    for (const image of ITEM_IMAGES) {
      for (const word of image.words) {
        if (!image.ambiguousBare) expect(idOf(word), `${image.id} : « ${word} »`).toBe(image.id);
        else expect(idOf(word), `${image.id} : « ${word} » seul`).toBeNull();
        expect(idOf(`un ${word}`), `${image.id} : un ${word}`).toBe(image.id);
        expect(idOf(`${word.toUpperCase()} !`), `${image.id} : ${word.toUpperCase()}`).toBe(
          image.ambiguousBare ? null : image.id,
        );
      }
    }
  });

  it("chaque nom anglais reçoit son image sans témoin (`pictureForTile`) ; c'est `recognizeTiles` qui en demande un", () => {
    for (const image of ITEM_IMAGES) {
      for (const word of image.english ?? []) {
        expect(matchTile(word)?.via, `${image.id} : « ${word} »`).toBe(image.ambiguousBare ? undefined : "anglais");
        if (!image.ambiguousBare) expect(idOf(word), `${image.id} : « ${word} »`).toBe(image.id);
      }
    }
  });

  it("chaque émoji du catalogue, en tête d'un prénom, donne l'image de la chose", () => {
    for (const image of ITEM_IMAGES) {
      for (const glyph of image.emoji) {
        expect(idOf(`${glyph} Zoé`), `${image.id} : ${glyph}`).toBe(image.id);
      }
    }
  });

  it("chaque émoji du catalogue, en tête de son mot, donne l'image de la chose", () => {
    for (const image of ITEM_IMAGES) {
      for (const glyph of image.emoji) {
        expect(idOf(`${glyph} ${image.words[0]}`), `${image.id} : ${glyph}`).toBe(image.id);
      }
    }
  });
});

describe("itemImagesInText : les images dont un émoji est dans le texte", () => {
  it("trouve l'image de l'émoji d'un énoncé", () => {
    expect(itemImagesInText("Quel animal est-ce ? 🐘").map((image) => image.id)).toEqual(["elephant"]);
  });

  it("garde l'ordre d'apparition et ne répète pas une image", () => {
    expect(itemImagesInText("🐈 🐕 🐱 🐈").map((image) => image.id)).toEqual(["chat", "chien"]);
    expect(itemImagesInText("🍎🍎🍎").map((image) => image.id)).toEqual(["pomme"]);
  });

  it("reconnaît un glyphe avec ou sans U+FE0F", () => {
    const scissors = String.fromCharCode(0x2702);
    expect(itemImagesInText(`Coupe avec ${SCISSORS}`).map((image) => image.id)).toEqual(["ciseaux"]);
    expect(itemImagesInText(`Coupe avec ${scissors}`).map((image) => image.id)).toEqual(["ciseaux"]);
  });

  it("lit LARGE : le carré noir, le dé, la boîte de conserve, la goutte et les cœurs de couleur", () => {
    const ids = (text: string) => itemImagesInText(text).map((image) => image.id);
    expect(ids("Quelle forme ? ⬛")).toEqual(["carre"]);
    expect(ids("🔴 🔵 🟠")).toEqual(["rond"]);
    expect(ids("🔺")).toEqual(["triangle"]);
    expect(ids("💖 🧡")).toEqual(["coeur"]);
    expect(ids("⭐")).toEqual(["etoile"]);
    expect(ids("Quel solide ? 🎲")).toEqual(["cube"]);
    expect(ids("🧱")).toEqual(["pave"]);
    expect(ids("🥫")).toEqual(["cylindre"]);
    expect(ids("🏀")).toEqual(["boule"]);
    expect(ids("De l'eau 💧")).toEqual(["eau"]);
  });

  it("ne trouve rien sans émoji du catalogue", () => {
    expect(itemImagesInText("Quel animal miaule ?")).toEqual([]);
    expect(itemImagesInText("Compte les 🦄")).toEqual([]);
    expect(itemImagesInText("")).toEqual([]);
    expect(itemImagesInText(undefined as unknown as string)).toEqual([]);
  });
});

describe("READING_PROMPT : un énoncé qui demande de lire", () => {
  it.each([
    "Lis le mot : chat",
    "lis le mot",
    "LIS LE MOT",
    "Peux-tu lire ce mot ?",
    "Lire, c'est facile",
    "Fais une lecture",
    "Quel mot est écrit ?",
    "Quel mot est ECRIT ?",
    "Trouve le mot écrit",
    "Quelle est la phrase écrite ?",
    "Les mots écrits",
    "Les phrases écrites",
    "Écrit-on « chat » avec un h ?",
    "Lis.",
    "Lis, puis réponds",
    "Lisez bien",
    "Lisez les mots.",
    "Relis la phrase",
    "Épelle le mot",
    "Epelez ce nom",
  ])("%j demande de lire", (prompt) => {
    expect(READING_PROMPT.test(prompt)).toBe(true);
  });

  it.each([
    "Mets ces animaux dans l'ordre, du plus petit au plus grand.",
    "Quel animal est-ce ? 🐘",
    "Quel animal miaule ?",
    "Relie chaque animal à son ombre",
    "Où dort le chat ? Dans son lit",
    "Il lit un livre",
    "Il lisait",
    "Une lisière",
    "Un écrivain",
    "Écris ton prénom",
    "Il écrira",
    "Polis le bois",
    "",
  ])("%j ne demande pas de lire", (prompt) => {
    expect(READING_PROMPT.test(prompt)).toBe(false);
  });

  it("s'essaie sans mémoire : deux appels de suite donnent le même résultat", () => {
    expect(READING_PROMPT.test("Lis le mot")).toBe(true);
    expect(READING_PROMPT.test("Lis le mot")).toBe(true);
  });
});

describe("resolveTilePictures : les garde-fous", () => {
  it("laisse les images quand l'énoncé ne demande ni de lire ni de relier un mot à son image", () => {
    const pictures = resolveTilePictures(["la souris", "le chat", "l'éléphant"], {
      prompt: "Mets ces animaux dans l'ordre, du plus petit au plus grand.",
    });
    expect(idsOf(pictures)).toEqual(["souris", "chat", "elephant"]);
  });

  it("donne les mêmes images que pictureForTile quand rien ne la gêne", () => {
    const tiles = ["🐕 le chien", "Lion", "orange", "3 pommes", "Fatou", "🍎"];
    expect(idsOf(resolveTilePictures(tiles))).toEqual(tiles.map((tile) => idOf(tile)));
    expect(idsOf(resolveTilePictures(tiles, {}))).toEqual(tiles.map((tile) => idOf(tile)));
    expect(idsOf(resolveTilePictures(tiles, { prompt: "Quel animal est le plus grand ?" }))).toEqual(
      tiles.map((tile) => idOf(tile)),
    );
  });

  describe("a. l'énoncé demande de lire", () => {
    it("retire toutes les images", () => {
      expect(idsOf(resolveTilePictures(["le chat", "le chien"], { prompt: "Lis le mot : chat" }))).toEqual([
        null,
        null,
      ]);
    });

    it("reconnaît « écrit » avec ou sans accent, et l'accent écrit en deux points de code", () => {
      for (const prompt of [
        "Quel mot est écrit ?",
        "Quel mot est ecrit ?",
        `Quel mot est e${COMBINING_ACUTE}crit ?`,
        "QUEL MOT EST ÉCRIT ?",
      ]) {
        expect(idsOf(resolveTilePictures(["le chat", "le chien"], { prompt })), prompt).toEqual([null, null]);
      }
    });
  });

  describe("b. l'énoncé montre l'émoji d'une chose qu'une tuile nomme", () => {
    it("retire toutes les images, la tuile fausse comme la bonne", () => {
      expect(idsOf(resolveTilePictures(["l'éléphant", "le lion"], { prompt: "Quel animal est-ce ? 🐘" }))).toEqual([
        null,
        null,
      ]);
    });

    it("s'applique aussi à une tuile reconnue par son émoji de tête", () => {
      expect(idsOf(resolveTilePictures(["🐕 Rex", "🐈 Minou"], { prompt: "Quel animal est-ce ? 🐕" }))).toEqual([
        null,
        null,
      ]);
    });

    it("s'applique à un émoji du catalogue qui a plusieurs glyphes", () => {
      expect(idsOf(resolveTilePictures(["le chat", "le chien"], { prompt: "Quel animal est-ce ? 🐱" }))).toEqual([
        null,
        null,
      ]);
    });

    it("laisse les images quand l'émoji de l'énoncé n'est celui d'aucune tuile", () => {
      expect(idsOf(resolveTilePictures(["le chat", "le chien"], { prompt: "Compte les 🍎 : combien en vois-tu ?" }))).toEqual([
        "chat",
        "chien",
      ]);
      expect(idsOf(resolveTilePictures(["le chat", "le chien"], { prompt: "Quel animal est-ce ? 🦄" }))).toEqual([
        "chat",
        "chien",
      ]);
    });
  });

  describe("c. association : l'autre côté montre en émojis ce que celui-ci nomme", () => {
    it("retire les images du côté des mots", () => {
      expect(idsOf(resolveTilePictures(["le chat", "le chien"], { glyphTiles: ["🐈", "🐕"] }))).toEqual([null, null]);
    });

    it("suffit qu'une seule tuile-mot soit désignée par un émoji : tout le côté perd ses images", () => {
      expect(idsOf(resolveTilePictures(["le chat", "la banane"], { glyphTiles: ["🐈", "🍎"] }))).toEqual([null, null]);
    });

    it("lit aussi une tuile de plusieurs émojis", () => {
      expect(idsOf(resolveTilePictures(["le chat", "le chien"], { glyphTiles: ["🐈🐈", "🐕🐕🐕"] }))).toEqual([
        null,
        null,
      ]);
    });

    it("laisse les images quand les émojis de l'autre côté sont étrangers aux mots", () => {
      expect(idsOf(resolveTilePictures(["le chat", "le chien"], { glyphTiles: ["🍎", "🍌"] }))).toEqual(["chat", "chien"]);
      expect(idsOf(resolveTilePictures(["le chat", "le chien"], { glyphTiles: [] }))).toEqual(["chat", "chien"]);
    });

    it("le côté des émojis est laissé tel quel : une tuile que des émojis n'a jamais d'image", () => {
      expect(idsOf(resolveTilePictures(["🐈", "🐕"], { glyphTiles: ["le chat", "le chien"] }))).toEqual([null, null]);
    });

    it("les trois garde-fous se cumulent sans se gêner", () => {
      expect(
        idsOf(
          resolveTilePictures(["le chat", "le chien"], {
            prompt: "Relie chaque animal à son dessin.",
            glyphTiles: ["🍎", "🍌"],
          }),
        ),
      ).toEqual(["chat", "chien"]);
    });
  });

  describe("la forme du résultat", () => {
    it("rend toujours un tableau de la même longueur que les tuiles", () => {
      const cases: string[][] = [
        [],
        ["Fatou"],
        ["le chat"],
        ["le chat", "le chat", "le chat"],
        ["🍎", "🍎🍎", "3", "orange", "le lion", "", "  "],
        ["l'éléphant", "le lion", "la girafe", "le singe", "la souris", "la fourmi", "Rex", "mille"],
      ];
      const contexts = [
        undefined,
        {},
        { prompt: "Lis le mot" },
        { prompt: "Quel animal ? 🐘" },
        { glyphTiles: ["🐘"] },
        { choice: true },
        { counterpart: ["le lion"] },
        { exerciseImage: "lion" },
      ];
      for (const tiles of cases) {
        for (const ctx of contexts) {
          expect(resolveTilePictures(tiles, ctx), JSON.stringify([tiles, ctx])).toHaveLength(tiles.length);
        }
      }
    });

    it("met null, et pas undefined, pour une tuile sans image", () => {
      const pictures = resolveTilePictures(["le chat", "Fatou"]);
      expect(pictures[0]?.id).toBe("chat");
      expect(pictures[1]).toBeNull();
    });

    it("garde les doublons : deux tuiles du même mot ont la même image", () => {
      expect(idsOf(resolveTilePictures(["le chat", "un chat"]))).toEqual(["chat", "chat"]);
    });

    it("supporte une tuile qui n'est pas un texte sans lever d'erreur", () => {
      const tiles = ["le chat", 12, undefined, null] as unknown as string[];
      expect(idsOf(resolveTilePictures(tiles))).toEqual(["chat", null, null, null]);
    });

    it("supporte un contexte absent, nul ou mal formé sans lever d'erreur", () => {
      const tiles = ["le chat", "le chien"];
      expect(idsOf(resolveTilePictures(tiles))).toEqual(["chat", "chien"]);
      expect(idsOf(resolveTilePictures(tiles, null as unknown as undefined))).toEqual(["chat", "chien"]);
      expect(idsOf(resolveTilePictures(tiles, { prompt: 12 as unknown as string }))).toEqual(["chat", "chien"]);
      expect(idsOf(resolveTilePictures(tiles, { glyphTiles: "🐈" as unknown as string[] }))).toEqual(["chat", "chien"]);
    });

    it("ne modifie pas le tableau reçu", () => {
      const tiles = ["le chat", "le chien"];
      resolveTilePictures(tiles, { prompt: "Lis le mot" });
      expect(tiles).toEqual(["le chat", "le chien"]);
    });
  });
});

/**
 * UN NOM ANGLAIS DEMANDE UN TÉMOIN. « pen » est le stylo des leçons d'anglais et la
 * première syllabe de « Penda » : seul au milieu de syllabes, c'est une syllabe.
 * (Quatre exercices de syllabes du CI de production montraient un stylo sur « pen ».)
 */
describe("les noms anglais : reconnus avec un témoin, jamais seuls", () => {
  it("`matchTile` dit par où une tuile est reconnue : le mot français, le mot anglais, l'émoji de tête", () => {
    expect(matchTile("le chat")?.via).toBe("mot");
    expect(matchTile("cat")?.via).toBe("anglais");
    expect(matchTile("🐕 Rex")?.via).toBe("emoji");
    expect(matchTile("Fatou")).toBeNull();
    expect(matchTile(12 as unknown as string)).toBeNull();
  });

  it("un mot qui s'écrit pareil en français et en anglais (sans accent) est du français, il n'a pas besoin de témoin", () => {
    expect(matchTile("lion")?.via).toBe("mot");
    expect(matchTile("elephant")?.via).toBe("mot");
    expect(matchTile("Éléphant")?.via).toBe("mot");
    expect(recognizedIds(["lion"])).toEqual(["lion"]);
  });

  it("un nom anglais seul n'a pas d'image", () => {
    expect(recognizedIds(["cat"])).toEqual([null]);
    expect(recognizedIds(["cow", "Fatou", "3"])).toEqual([null, null, null]);
    // Le mot seul reste reconnu tel quel : c'est `recognizeTiles` qui demande le témoin.
    expect(idOf("cat")).toBe("chat");
  });

  it("deux noms anglais du même groupe se témoignent : une leçon d'anglais", () => {
    expect(recognizedIds(["cat", "dog", "fish"])).toEqual(["chat", "chien", "poisson"]);
    expect(recognizedIds(["cow", "sheep"])).toEqual(["vache", "mouton"]);
    // Les noms français ou sans accent d'un groupe d'anglais gardent leur image, sans compter comme témoins.
    expect(recognizedIds(["elephant", "cow", "lion", "sheep"])).toEqual(["elephant", "vache", "lion", "mouton"]);
  });

  it("le témoin est l'ÉMOJI de la chose en tête, quand le groupe n'a qu'un nom anglais", () => {
    expect(recognizedIds(["🐱 cat", "lo"])).toEqual(["chat", null]);
    // Un autre émoji ne témoigne pas : « [chien] cat » se contredit.
    expect(recognizedIds(["🐶 cat", "lo"])).toEqual([null, null]);
  });

  it("une syllabe qui est aussi un mot anglais n'a pas d'image : « pen », « car », « hen », « ant »", () => {
    expect(recognizedIds(["lo", "pen", "lou"])).toEqual([null, null, null]);
    expect(recognizedIds(["car", "ta", "ble"])).toEqual([null, null, null]);
    expect(recognizedIds(["hen", "ant"])).toEqual(["poule", "fourmi"]);
    expect(recognizedIds(["hen", "ta"])).toEqual([null, null]);
  });

  it("« pen » n'est plus le stylo : ni mot français, ni nom anglais du catalogue ; « stylo » l'est", () => {
    expect(pictureForTile("pen")).toBeNull();
    expect(pictureForTile("Pen")).toBeNull();
    expect(idOf("le stylo")).toBe("stylo");
  });

  it("les prompts de syllabes de la production ne montrent aucun stylo, ni aucune autre image", () => {
    const cases: [string, string[]][] = [
      ["Par quelle syllabe commence « penda » ?", ["lo", "pen", "lou"]],
      ["Par quelle syllabe commence « ami » ?", ["a", "pen", "pa"]],
      ["Par quelle syllabe finit « midi » ?", ["di", "eau", "la"]],
      ["Quel mot commence par la syllabe « pou » ?", ["bonbon", "poule", "tata"]],
    ];
    for (const [prompt, options] of cases) {
      expect(idsOf(resolveTilePictures(options, { prompt, choice: true })), prompt).toEqual(options.map(() => null));
    }
    const link = resolveTilePictures(["to", "pa", "pen", "a"], { prompt: "Relie chaque syllabe au mot qui commence par elle." });
    expect(idsOf(link)).toEqual([null, null, null, null]);
  });
});

describe("la moto et le scooter sont deux choses, avec deux images", () => {
  it("chacune a son nom, son émoji et son image", () => {
    expect(idOf("la moto")).toBe("moto");
    expect(idOf("le scooter")).toBe("scooter");
    expect(idOf("motorbike")).toBe("moto");
    expect(idOf(`${MOTORBIKE} la moto`)).toBe("moto");
    expect(idOf(`${SCOOTER} le scooter`)).toBe("scooter");
  });

  it("une liste qui a les deux ne montre pas deux fois la même image", () => {
    expect(idsOf(resolveTilePictures(["la moto", "le scooter", "le vélo"]))).toEqual(["moto", "scooter", "velo"]);
  });
});

/**
 * LE GROUPE LÈVE LE DOUTE D'UN MOT AMBIGU. « orange » seul peut être la couleur, mais
 * parmi des fruits (« Mets ces fruits dans l'ordre alphabétique » : pomme, orange,
 * banane) c'est le fruit, et la seule tuile sans image désignait celle-là.
 */
describe("un mot ambigu : le groupe le comprend", () => {
  it("l'orange seule, ou parmi des couleurs, n'a pas d'image", () => {
    expect(recognizedIds(["orange"])).toEqual([null]);
    expect(recognizedIds(["rouge", "orange", "vert"])).toEqual([null, null, null]);
    expect(recognizedIds(["orange", "Fatou"])).toEqual([null, null]);
  });

  it("parmi des aliments, elle prend l'image du fruit", () => {
    expect(recognizedIds(["pomme", "orange", "banane"])).toEqual(["pomme", "orange", "banane"]);
    expect(recognizedIds(["Orange", "le riz"])).toEqual(["orange", "riz"]);
    // Les fruits d'une leçon d'anglais : l'orange s'écrit pareil, les autres témoignent.
    expect(recognizedIds(["pineapple", "orange", "banana", "mango"])).toEqual(["ananas", "orange", "banane", "mangue"]);
  });

  it("l'émoji d'une couleur dit la couleur, même parmi des fruits", () => {
    expect(recognizedIds(["🟠 orange", "pomme"])).toEqual([null, "pomme"]);
  });

  it("un autre groupe d'images que celui du fruit ne lève pas le doute : l'orange parmi des animaux", () => {
    expect(recognizedIds(["orange", "le chat", "le chien"])).toEqual([null, "chat", "chien"]);
  });

  it("« Pierre » est un prénom seul, une pierre parmi des lieux et de la nature", () => {
    expect(idOf("la pierre")).toBe("pierre");
    expect(idOf("une pierre")).toBe("pierre");
    expect(idOf(`${String.fromCodePoint(0x1faa8)} pierre`)).toBe("pierre");
    expect(pictureForTile("Pierre")).toBeNull();
    expect(recognizedIds(["Pierre", "Fatou", "Moussa"])).toEqual([null, null, null]);
    // Les tuiles de « Classe ces éléments : naturel ou fabriqué ».
    expect(recognizedIds(["Pierre", "Seau", "Pirogue", "Sable"])).toEqual(["pierre", "seau", "pirogue", "sable"]);
    // Un objet n'est pas la nature : « Pierre » y reste un prénom.
    expect(recognizedIds(["Pierre", "Seau"])).toEqual([null, "seau"]);
  });
});

/**
 * LE GARDE-FOU a LIT LES VRAIES CONSIGNES DU CI. Sur 1205 exercices de production, ni
 * « lis » ni « écrit » ne se trouvait dans une consigne de lecture : elles disent
 * « syllabe », « commence par », « mots dans l'ordre », « Quel est le nom de… ».
 */
describe("les énoncés qui ne veulent pas d'image (garde-fou a)", () => {
  it.each([
    "Quel mot commence par la syllabe « pou » ?",
    "Quel mot commence par la syllabe « mo » ?",
    "Par quelle syllabe commence « penda » ?",
    "Par quelle syllabe finit « midi » ?",
    "Relie chaque syllabe au mot qui commence par elle.",
    "Quel mot finit par « a » ?",
    "Quels mots commencent par la lettre « b » ?",
    "Écris la majuscule de « a ».",
    "Choisis la minuscule.",
    "Quelle lettre manque ?",
  ])("décoder : %j", (prompt) => {
    expect(DECODING_PROMPT.test(prompt.normalize("NFC"))).toBe(true);
    expect(promptForbidsPictures(prompt)).toBe(true);
  });

  it.each([
    "Remets les mots dans l'ordre.",
    "Remets les mots dans l’ordre.",
    "Mets les mots dans l'ordre : une, Fatou, mangue, a.",
    "Remets les mots dans l'ordre : 'a une moto Fatou'.",
    "Place les mots dans la bonne phrase.",
    "Range les mots pour faire une phrase.",
    "Mets les mots dans le bon ordre.",
    "Mets ces mots dans l'ordre.",
    "Glisse le bon mot dans la phrase : « Fatou ___ une mangue. »",
    "Quel mot complète la phrase ?",
    "Construis une phrase avec ces mots.",
    "Dans la phrase, quel mot est un nom ?",
  ])("ranger ou choisir les mots d'une phrase : %j", (prompt) => {
    expect(promptForbidsPictures(prompt)).toBe(true);
  });

  it.each([
    "Quel est le nom de cette forme ? ⬛",
    "Quel est le nom du solide qui ressemble à cet objet ? 🥫",
    "Quel est le nom d'un animal qui vole ?",
    "Quelle est le nom des fruits ?",
    "Comment s'appelle cet animal ?",
    "Comment s’appelle ce fruit ?",
    "Comment appelle-t-on ce solide ?",
  ])("nommer : %j", (prompt) => {
    expect(NAMING_PROMPT.test(prompt.normalize("NFC").replace(/’/g, "'"))).toBe(true);
    expect(promptForbidsPictures(prompt)).toBe(true);
  });

  it.each(["Comment dit-on « chat » en anglais ?", "Que veut dire « dog » ?", "How do you say « chien » ?", "Quel est ce mot in English ?"])(
    "traduire : %j",
    (prompt) => {
      expect(TRANSLATION_PROMPT.test(prompt)).toBe(true);
      expect(promptForbidsPictures(prompt)).toBe(true);
    },
  );

  it.each([
    "Mets ces animaux dans l'ordre, du plus petit au plus grand.",
    "Mets ces animaux dans l'ordre, du plus léger au plus lourd.",
    "Mets ces fruits dans l'ordre alphabétique.",
    "Mets ces mots dans l'ordre alphabétique.",
    "Classe ces mots par ordre de croissance.",
    "Dépose les mots dans les bonnes zones.",
    "Glisse les mots dans la bonne zone.",
    "Associe chaque mot à son synonyme.",
    "Relie chaque mot à son image.",
    "Mets ces phrases dans le bon ordre.",
    "Choisis la bonne réponse.",
    "Quel animal est le plus grand ?",
    "Quel animal aboie ?",
    "Quelle forme est ronde ?",
    "Quand se lève-t-on ?",
    "Que mange Aïssatou ?",
    "Relie chaque animal à son cri.",
    "Relie chaque objet à sa position.",
    "Place les objets selon leur position.",
    "Où vit chaque animal ? Glisse-le dans sa case.",
    "Quelle partie de la plante fait la photosynthèse ?",
    "Écris ton prénom",
    "Combien de mangues ?",
    "",
  ])("laisse les images : %j", (prompt) => {
    expect(promptForbidsPictures(prompt)).toBe(false);
  });

  it("une consigne qui n'est pas un texte ne demande rien", () => {
    expect(promptForbidsPictures(undefined)).toBe(false);
    expect(promptForbidsPictures(12)).toBe(false);
  });

  it("l'ordre alphabétique de MOTS n'est pas une phrase à ranger", () => {
    expect(SENTENCE_PROMPT.test("Mets ces mots dans l'ordre alphabétique.")).toBe(false);
    expect(SENTENCE_PROMPT.test("Mets ces mots dans l'ordre.")).toBe(true);
  });

  it("retire toutes les images, et le garde-fou a le dit", () => {
    const result = explainTilePictures(["le chat", "le chien"], { prompt: "Remets les mots dans l'ordre." });
    expect(result.guard).toBe("a");
    expect(idsOf(result.pictures)).toEqual([null, null]);
    expect(idsOf(result.recognized)).toEqual(["chat", "chien"]);
  });
});

/**
 * LE GARDE-FOU b LIT LES FORMES ET LES SOLIDES. Leurs entrées n'ont pas d'émoji de tête
 * (« [rond rouge] rouge » est la couleur) : leurs `guardEmoji` ne servent qu'aux
 * garde-fous. Sans eux, « Quel est le nom de cette forme ? [carré noir] » gardait l'image
 * du carré sur la bonne tuile, et l'enfant appariait deux dessins sans lire un nom.
 */
describe("les formes et les solides : l'émoji de l'énoncé ou de l'autre côté trahit l'image", () => {
  const without = (tiles: string[], ctx: Parameters<typeof resolveTilePictures>[1]) => idsOf(resolveTilePictures(tiles, ctx));

  it("une forme en émoji dans l'énoncé : aucune tuile n'a d'image (garde-fou b)", () => {
    const result = explainTilePictures(["le carré", "le rond", "le triangle"], { prompt: "Regarde ⬛ : laquelle est pareille ?" });
    expect(result.guard).toBe("b");
    expect(idsOf(result.pictures)).toEqual([null, null, null]);
  });

  it("un solide en émoji dans l'énoncé : le dé, la brique, la boîte de conserve", () => {
    expect(explainTilePictures(["le cube", "la boule"], { prompt: "Regarde 🎲 : lequel est pareil ?" }).guard).toBe("b");
    expect(explainTilePictures(["le pavé", "la boule"], { prompt: "Regarde 🧱 : lequel est pareil ?" }).guard).toBe("b");
    expect(explainTilePictures(["le cylindre", "la boule"], { prompt: "Regarde 🥫 : lequel est pareil ?" }).guard).toBe("b");
  });

  it("des formes en émojis d'un côté, leurs noms de l'autre : les noms n'ont pas d'image (garde-fou c)", () => {
    const result = explainTilePictures(["Étoile", "Cœur", "Triangle"], {
      prompt: "Associe chaque forme à son nom.",
      glyphTiles: ["⭐", "💖", "🔺"],
    });
    expect(result.guard).toBe("c");
    expect(idsOf(result.pictures)).toEqual([null, null, null]);
  });

  it("l'émoji de tête d'une tuile reste PRUDENT : un rond rouge n'en fait pas le rond", () => {
    expect(pictureForTile("🔴 rouge")).toBeNull();
    expect(pictureForTile("🟦 bleu")).toBeNull();
    expect(pictureForTile("⭐ Zoé")).toBeNull();
  });

  it("un émoji de forme étranger aux tuiles ne retire rien", () => {
    expect(without(["le chat", "le chien"], { prompt: "Regarde ⬛ : quel animal est-ce ?" })).toEqual(["chat", "chien"]);
  });

  it("les consignes de forme de la production sont toutes retenues, par le nom ou par l'émoji", () => {
    for (const shape of ["⬛", "🔴", "🔺", "⭐", "💖", "🔲", "🟦", "⚪"]) {
      const tiles = ["le carré", "le rond", "le triangle", "l'étoile", "le cœur"];
      const prompt = `Quel est le nom de cette forme ? ${shape}`;
      expect(without(tiles, { prompt, choice: true }), prompt).toEqual(tiles.map(() => null));
    }
  });
});

describe("QCM : une tuile à lettres sans image désigne la réponse (garde-fou d)", () => {
  it("la seule tuile sans image, ou la seule avec, ne reste pas : toutes les images partent", () => {
    // Le chien est la seule tuile illustrée ; « Fatou » n'a pas d'image.
    const lone = explainTilePictures(["le chien", "Fatou", "Moussa"], { prompt: "Quel animal aboie ?", choice: true });
    expect(lone.guard).toBe("d");
    expect(idsOf(lone.pictures)).toEqual([null, null, null]);
    // La bonne réponse « le matin » n'avait pas d'image : elle se voyait par élimination.
    const bare = explainTilePictures(["le matin", "le soir", "midi"], { prompt: "Le soleil se lève. Quel moment est-ce ?", choice: true });
    expect(idsOf(bare.recognized)).toEqual(["matin", "soir", "midi"]);
    expect(bare.guard).toBeNull();
    const missing = explainTilePictures(["le soir", "midi", "le crépuscule"], { prompt: "Quand dîne-t-on ?", choice: true });
    expect(missing.guard).toBe("d");
    expect(idsOf(missing.pictures)).toEqual([null, null, null]);
  });

  it("hors QCM (sans `choice`), les images partielles restent : une mise en ordre ou une association n'a pas de bonne tuile à désigner", () => {
    const tiles = ["le chien", "Fatou", "Moussa"];
    expect(idsOf(resolveTilePictures(tiles, { prompt: "Quel animal aboie ?" }))).toEqual(["chien", null, null]);
    expect(idsOf(resolveTilePictures(tiles, { prompt: "Quel animal aboie ?", choice: false }))).toEqual(["chien", null, null]);
  });

  it("toutes les tuiles à lettres ont leur image : elles restent", () => {
    const tiles = ["Lion", "Poule", "Chat", "Âne"];
    expect(idsOf(resolveTilePictures(tiles, { prompt: "Quel animal miaule ?", choice: true }))).toEqual(["lion", "poule", "chat", "ane"]);
  });

  it("une tuile sans lettre (un nombre, des émojis) n'est pas une tuile à lettres : elle ne coupe rien", () => {
    expect(idsOf(resolveTilePictures(["le chien", "Lion", "12"], { choice: true }))).toEqual(["chien", "lion", null]);
    expect(idsOf(resolveTilePictures(["le chien", "Lion", "🍎🍎"], { choice: true }))).toEqual(["chien", "lion", null]);
  });

  it("l'émoji de tête sans mot du catalogue compte : « [chien] Rex » reçoit l'image de son émoji", () => {
    expect(idsOf(resolveTilePictures(["🐕 Rex", "🐈 Minou"], { choice: true }))).toEqual(["chien", "chat"]);
  });

  it("un QCM sans image reconnue ne dit rien", () => {
    const result = explainTilePictures(["Fatou", "Moussa"], { choice: true });
    expect(result.guard).toBeNull();
    expect(idsOf(result.pictures)).toEqual([null, null]);
  });

  it("des tuiles illustrées et une phrase sans image : les images partent", () => {
    const result = explainTilePictures(["Le lion", "Parce que la lune tourne autour de la Terre."], { choice: true });
    expect(result.guard).toBe("d");
  });
});

describe("l'image de l'énoncé est celle d'une tuile (garde-fou e)", () => {
  it("le chat sur l'énoncé, « le chat » parmi les options : aucune image sur les options", () => {
    const result = explainTilePictures(["le chat", "le chien", "le lion"], { prompt: "Quel animal vois-tu ?", exerciseImage: "chat" });
    expect(result.guard).toBe("e");
    expect(idsOf(result.pictures)).toEqual([null, null, null]);
  });

  it("une image d'énoncé qu'aucune tuile ne nomme ne retire rien", () => {
    expect(idsOf(resolveTilePictures(["le chat", "le chien"], { exerciseImage: "lion" }))).toEqual(["chat", "chien"]);
    expect(idsOf(resolveTilePictures(["le chat", "le chien"], { exerciseImage: "inconnue" }))).toEqual(["chat", "chien"]);
    expect(idsOf(resolveTilePictures(["le chat", "le chien"], { exerciseImage: undefined }))).toEqual(["chat", "chien"]);
  });

  it("c'est vrai pour une tuile reconnue par son émoji de tête aussi", () => {
    expect(explainTilePictures(["🐕 Rex", "🐈 Minou"], { exerciseImage: "chien" }).guard).toBe("e");
  });
});

describe("la même image des deux côtés (garde-fou f)", () => {
  it("« Arachide » face à « Cacahuète » : les deux côtés perdent leurs images", () => {
    const left = explainTilePictures(["Arachide", "Manguier"], { counterpart: ["Cacahuète", "Mangue"] });
    expect(left.guard).toBe("f");
    expect(idsOf(left.pictures)).toEqual([null, null]);
    // Vu de l'autre côté, c'est la même décision : la symétrie tient l'écran cohérent.
    const right = explainTilePictures(["Cacahuète", "Mangue"], { counterpart: ["Arachide", "Manguier"] });
    expect(right.guard).toBe("f");
    expect(idsOf(right.pictures)).toEqual([null, null]);
  });

  it("deux côtés qui nomment des choses différentes gardent leurs images", () => {
    const result = explainTilePictures(["le chat", "le chien"], { counterpart: ["la souris", "l'os"] });
    expect(result.guard).toBeNull();
    expect(idsOf(result.pictures)).toEqual(["chat", "chien"]);
  });

  it("l'autre côté en mots hors catalogue ne retire rien", () => {
    expect(idsOf(resolveTilePictures(["le chat", "le chien"], { counterpart: ["Miaou", "Ouaf"] }))).toEqual(["chat", "chien"]);
  });

  it("un autre groupe vide ou mal formé ne retire rien", () => {
    expect(idsOf(resolveTilePictures(["le chat"], { counterpart: [] }))).toEqual(["chat"]);
    expect(idsOf(resolveTilePictures(["le chat"], { counterpart: "le chat" as unknown as string[] }))).toEqual(["chat"]);
  });
});

describe("explainTilePictures : ce qui s'est passé", () => {
  it("les six garde-fous ont un titre", () => {
    expect(Object.keys(TILE_GUARDS)).toEqual(["a", "b", "c", "d", "e", "f"]);
    for (const title of Object.values(TILE_GUARDS)) expect(title.length).toBeGreaterThan(10);
  });

  it("rien ne joue : les images reconnues restent, sans garde-fou", () => {
    const result = explainTilePictures(["le chat", "le chien"], { prompt: "Quel animal est le plus grand ?" });
    expect(result.guard).toBeNull();
    expect(result.pictures).toEqual(result.recognized);
    expect(idsOf(result.pictures)).toEqual(["chat", "chien"]);
  });

  it("le premier garde-fou dans l'ordre a à f est celui qu'on nomme", () => {
    // L'énoncé demande de lire (a) ET montre l'émoji du chat (b) ET l'image d'énoncé est celle du chat (e).
    const result = explainTilePictures(["le chat", "Fatou"], {
      prompt: `Lis le mot ${String.fromCodePoint(0x1f408)}`,
      choice: true,
      exerciseImage: "chat",
    });
    expect(result.guard).toBe("a");
  });

  it("`resolveTilePictures` rend les mêmes images que `explainTilePictures`", () => {
    const tiles = ["le chien", "Fatou", "Moussa"];
    const ctx = { prompt: "Quel animal aboie ?", choice: true };
    expect(resolveTilePictures(tiles, ctx)).toEqual(explainTilePictures(tiles, ctx).pictures);
  });
});

describe("la phrase d'un texte à trous (`sentence`)", () => {
  const TOOLS = ["le balai", "les ciseaux", "l'arrosoir"];

  it("sans émoji, la phrase ne retire rien : les trois outils ont leur image", () => {
    const result = explainTilePictures(TOOLS, { prompt: "Complète la phrase.", choice: true, sentence: "Pour balayer la cour, je prends ___." });
    expect(result.guard).toBeNull();
    expect(result.pictures.map((picture) => picture?.id)).toEqual(["balai", "ciseaux", "arrosoir"]);
  });

  it("l'émoji de la chose dans la phrase la trahit : aucune image (garde-fou b)", () => {
    const result = explainTilePictures(TOOLS, { prompt: "Complète la phrase.", choice: true, sentence: "Pour balayer la cour 🧹, je prends ___." });
    expect(result.guard).toBe("b");
    expect(result.pictures).toEqual([null, null, null]);
  });

  it("les mots de la phrase ne comptent pas pour le garde-fou a : parler de lire n'est pas demander de lire", () => {
    const tiles = ["le balai", "les ciseaux", "le marteau"];
    expect(promptForbidsPictures("Je lis ___ avec maman.")).toBe(true);
    const result = explainTilePictures(tiles, { prompt: "Complète la phrase.", choice: true, sentence: "Je lis ___ avec maman." });
    expect(result.guard).toBeNull();
    expect(result.pictures.every((picture) => picture !== null)).toBe(true);
  });

  it("une option sans image au milieu des autres les retire toutes (garde-fou d) : « Je dors dans mon ___. »", () => {
    const result = explainTilePictures(["papa", "lit", "toto"], { prompt: "Complète la phrase.", choice: true, sentence: "Je dors dans mon ___." });
    expect(result.recognized.map((picture) => picture?.id ?? null)).toEqual([null, "lit", null]);
    expect(result.guard).toBe("d");
  });
});
