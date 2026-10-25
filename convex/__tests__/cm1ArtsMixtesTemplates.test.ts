import { describe, expect, it } from "vitest";
import { defineTemplateTests } from "@/lib/test-support/cm1TestKit";

/**
 * LES ARTS MIXTES DU CM1 : le dessin de mémoire, les frises et motifs, les percussions et cordes, les rythmes. Treize gabarits (`cm1Plastique.ts`,
 * `cm1Musique.ts`) qui prennent les places que ces quatre fiches ne remplissaient pas ; leurs jeux de dessin et d'écoute restent.
 *
 * Le moteur des vérifications est dans `lib/test-support/cm1TestKit.ts`. Ce fichier ne lit AUCUN tableau des sources : ses tables, écrites
 * à part, disent pour chaque réponse ce qu'un énoncé doit contenir pour l'appeler (`ASSOC`), dans quel ordre vont les suites (`CHAINS`),
 * quelles paires sont justes (`PAIRS`) et ce qui va dans chaque case (`MEMBERS`).
 */

const TOPIC_KINDS: Record<string, readonly string[]> = {
  "ar-cm1-memoire": ["cm1-mem-qcm", "cm1-mem-ordre", "cm1-mem-glisser"],
  "ar-cm1-motifs": ["cm1-mot-qcm", "cm1-mot-relier", "cm1-mot-glisser"],
  "ar-cm1-instruments": ["cm1-ins-qcm", "cm1-ins-trou", "cm1-ins-ecrire", "cm1-ins-relier", "cm1-ins-glisser"],
  "ar-cm1-rythmes": ["cm1-ryt-qcm", "cm1-ryt-ecrire"],
};

/** Les jeux que les quatre fiches gardaient déjà, avec leurs places : les gabarits prennent les places qui restent. */
const KEPT_GAMES: Record<string, Record<string, number>> = {
  "ar-cm1-memoire": { "pixel-memoire": 6, "pixel-copie": 1 },
  "ar-cm1-motifs": { "frise-formes": 2, "frise-couleurs": 2, "frise-objets": 1, "pixel-copie": 2 },
  "ar-cm1-instruments": { "ecoute-rythme": 2, "ecoute-motif-rythmique": 2 },
  "ar-cm1-rythmes": { "ecoute-motif-rythmique": 4, "frise-rythme": 3, "ecoute-rythme": 1 },
};

/**
 * Pour chaque réponse possible (bonne ou mauvaise), les fragments qu'un énoncé ne contient que s'il parle d'elle (mots entiers, repliés :
 * sans accent, apostrophe comme une espace). Une entrée vide : une réponse qui n'est jamais bonne.
 */
const ASSOC: Record<string, string[]> = {
  // Le dessin de mémoire : les mots
  "dessin de memoire": ["dessin fait de tete sans rien regarder", "dessin refait en se souvenant"],
  reproduction: ["copie un modele que l on a sous les yeux", "en copiant un modele pose devant soi"],
  modele: ["ce que l on regarde pour le dessiner", "image ou un objet a reproduire"],
  esquisse: [],
  coloriage: [],
  // Le dessin de mémoire : les gestes
  "observer le modele": ["fait-on d abord pour dessiner de memoire", "avec ses yeux avant de cacher le modele"],
  "retenir ce qu on a vu": ["garder le modele dans sa tete", "se souvenir des formes et des couleurs"],
  "cacher le modele": ["du modele pour dessiner vraiment de memoire", "du modele juste avant de redessiner de memoire"],
  "redessiner de memoire": ["une fois le modele cache", "apres avoir mis le modele de cote"],
  "comparer son dessin au modele": ["a la fin avec le modele et son dessin", "reperer ses erreurs une fois le dessin termine"],
  "colorier le dessin": [],
  "effacer le modele": [],
  // Les frises et les motifs : les mots
  frise: ["bande decoree ou un motif revient", "longue bande de motifs qui se suivent"],
  motif: ["petit dessin que l on repete pour decorer", "dessin qui revient dans une bande decoree"],
  symetrie: ["pareil de chaque cote de son axe", "identique de chaque cote d une ligne"],
  collage: [],
  aquarelle: [],
  // Les frises et les motifs : les gestes
  "repeter le motif": ["dessine le meme motif plusieurs fois de suite", "avec un seul motif qui revient"],
  "alterner deux motifs": ["un motif puis un autre puis le premier de nouveau", "deux motifs qui se suivent chacun a son tour"],
  "symetriser le motif": ["son reflet de l autre cote", "motif et son image dans un miroir"],
  "effacer le motif": [],
  "colorier au hasard": [],
  // Les percussions et les cordes : la famille
  percussion: ["djembe", "sabar", "tama", "balafon"],
  cordes: ["kora", "xalam", "riti", "guitare"],
  vent: [],
  // Les percussions et les cordes : comment on en joue
  "en frappant la peau avec les mains": ["du djembe"],
  "en frappant la peau avec une main et une baguette": ["du sabar"],
  "en frappant les lames avec des mailloches": ["du balafon"],
  "en pincant les cordes avec les doigts": ["de la kora"],
  "en frottant la corde avec un archet": ["du riti"],
  // Les percussions et les cordes : reconnaître l'instrument
  kora: ["vingt et une cordes"],
  balafon: ["lames de bois"],
  tama: ["sous le bras"],
  riti: ["une seule corde", "une corde"],
  djembe: ["forme de calice"],
  sabar: ["une main et une baguette"],
  // Les rythmes : les mots
  rythme: ["suite de sons longs et courts qui se repete", "suite de coups longs et courts"],
  pulsation: ["battement regulier que l on sent", "battement regulier comme un pas"],
  silence: ["moment ou l on ne joue aucun son", "pause entre deux sons"],
  couplet: [],
  accord: [],
  // Les rythmes : lire un rythme écrit en mots (chaque suite est comptée à la main)
  un: ["se joue court court court long combien de coups longs"],
  deux: ["se joue long court court combien de coups courts", "se joue long court long court combien de coups longs"],
  trois: ["se joue court long court court combien de coups courts", "se joue long long court long combien de coups longs"],
  quatre: ["se joue court court long court court combien de coups courts"],
};

/** Les réponses aussi justes l'une que l'autre à une même question : jamais proposées ensemble. Aucune ici : les définitions sont exclusives. */
const TWINS: readonly (readonly string[])[] = [];
/** Pas de liste « lequel de ces noms » dans ces thématiques. */
const LIST_STEM = /zzzzzzzz/;

const CHAINS: { when: RegExp; chain: string[] }[] = [
  { when: /dessiner de memoire/, chain: ["Observer le modèle", "Retenir les formes", "Cacher le modèle", "Redessiner de mémoire", "Comparer avec le modèle"] },
  { when: /reproduire un dessin/, chain: ["Regarder le modèle", "Tracer les grandes formes", "Ajouter les détails", "Colorier le dessin"] },
];

const PAIRS: readonly (readonly [string, string])[] = [
  ["Pagne", "Tissu décoré de motifs"],
  ["Calebasse", "Fruit séché gravé de motifs"],
  ["Poterie", "Argile cuite puis peinte"],
  ["Frise", "Bande de motifs"],
  ["Motif", "Dessin qui se répète"],
  ["Symétrie", "Pareil de chaque côté"],
  ["Répéter", "Le même motif revient"],
  ["Alterner", "Deux motifs à tour de rôle"],
  ["Symétriser", "Dessiner un reflet"],
  ["Djembé", "Une peau tendue"],
  ["Balafon", "Des lames de bois"],
  ["Kora", "Des cordes pincées"],
  ["Riti", "Une corde frottée"],
  ["Guitare", "Des cordes grattées"],
  ["Djembé", "Frapper"],
  ["Balafon", "Frapper"],
  ["Kora", "Pincer"],
  ["Riti", "Frotter"],
];

const MEMBERS: Record<string, string[]> = {
  "Avec le modèle": ["Observer les formes", "Repérer les couleurs", "Compter les carreaux", "Copier les traits"],
  "Sans le modèle": ["Redessiner de mémoire", "Se souvenir des couleurs", "Retrouver la place des formes", "Dessiner de tête"],
  Répéter: ["Rond, rond, rond", "Carré, carré, carré", "Triangle, triangle, triangle", "Losange, losange, losange"],
  Alterner: ["Rond, carré, rond, carré", "Triangle, losange, triangle, losange", "Carré, triangle, carré, triangle", "Losange, rond, losange, rond"],
  Percussion: ["Djembé", "Sabar", "Tama", "Balafon"],
  Cordes: ["Kora", "Xalam", "Riti", "Guitare"],
};

const { make, draws, drawsOf } = defineTemplateTests({
  label: "des arts mixtes du CM1",
  klass: "CM1",
  count: 5,
  topicKinds: TOPIC_KINDS,
  expectedKinds: 13,
  topicCount: 4,
  kindPattern: /^cm1-(mem|mot|ins|ryt)-/,
  assoc: ASSOC,
  twins: TWINS,
  listStem: LIST_STEM,
  chains: CHAINS,
  pairs: PAIRS,
  members: MEMBERS,
  zonePairs: [
    ["Avec le modèle", "Sans le modèle"],
    ["Répéter", "Alterner"],
    ["Percussion", "Cordes"],
  ],
  keptGames: KEPT_GAMES,
});

/** Les choix d'un QCM ou d'une phrase à trou, la bonne réponse d'abord. */
function choicesOf(exo: { payload: { options?: string[]; correctIndex?: number; blanks?: { options: string[]; answer: string }[] } }): { right: string; all: string[] } {
  if (exo.payload.blanks) return { right: exo.payload.blanks[0].answer, all: exo.payload.blanks[0].options };
  return { right: exo.payload.options![exo.payload.correctIndex!], all: exo.payload.options! };
}

describe("aucun mauvais choix n'est une deuxième bonne réponse que la table ne voit pas", () => {
  it("cacher le modèle : ni observer, ni retenir, ni effacer le modèle (des étapes ou une façon de le cacher)", () => {
    let seen = 0;
    for (const d of drawsOf("cm1-mem-qcm")) {
      const { right, all } = choicesOf(make("cm1-mem-qcm", d) as never);
      if (right !== "Cacher le modèle") continue;
      seen += 1;
      for (const wrong of ["Observer le modèle", "Retenir ce qu'on a vu", "Effacer le modèle"]) expect(all, right).not.toContain(wrong);
    }
    expect(seen).toBeGreaterThan(0);
  });
  it("le sabar : le tama se frappe aussi d'une main et d'une baguette, il n'est jamais un mauvais choix", () => {
    let seen = 0;
    for (const kind of ["cm1-ins-qcm", "cm1-ins-trou"] as const) {
      for (const d of drawsOf(kind)) {
        const { right, all } = choicesOf(make(kind, d) as never);
        if (!/sabar/i.test(right)) continue;
        seen += 1;
        expect(all.filter((option) => /tama/i.test(option)), right).toEqual([]);
      }
    }
    expect(seen).toBeGreaterThan(0);
  });
});

describe("les rythmes à écrire : le nombre de coups est recompté sur la suite écrite dans l'énoncé", () => {
  it("accepte le mot et le chiffre du bon nombre, jamais un autre", () => {
    const WORDS = ["", "un", "deux", "trois", "quatre", "cinq"];
    let counted = 0;
    for (const d of draws) {
      const exo = make("cm1-ryt-ecrire", d) as unknown as { prompt: string; payload: { acceptedAnswers: string[] } };
      const found = exo.prompt.match(/se joue (.+)\. Combien de coups (courts|longs) contient-il/);
      if (!found) continue;
      counted += 1;
      const wanted = found[2] === "courts" ? "court" : "long";
      const total = found[1].split(", ").filter((beat) => beat === wanted).length;
      const accepted = exo.payload.acceptedAnswers.map((answer) => answer.toLowerCase());
      expect(accepted, exo.prompt).toContain(String(total));
      expect(accepted, exo.prompt).toContain(WORDS[total]);
      expect(accepted.filter((answer) => /^\d+$/.test(answer)), exo.prompt).toEqual([String(total)]);
    }
    expect(counted).toBeGreaterThan(20);
  });
});
