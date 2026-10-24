import { describe, expect, it } from "vitest";
import { defineTemplateTests } from "@/lib/test-support/cm1TestKit";
import { allProgrammeEntries } from "../programme";
import { generateGames } from "../paliers/games";

/**
 * LES ARTS DU CM2 : les rosaces et la symétrie, observer et illustrer, les instruments à vent, chanter et accompagner, la mise en scène.
 * Vingt-trois gabarits (`cm2Arts.ts`). Les quatre premières fiches gardent leurs jeux de dessin et d'écoute et les gabarits prennent les places
 * qui restent ; la mise en scène n'avait aucun jeu et a ses dix places.
 *
 * Le moteur des vérifications est dans `lib/test-support/cm1TestKit.ts`. Ce fichier ne lit AUCUN tableau des sources : ses tables, écrites à
 * part, disent pour chaque réponse ce qu'un énoncé doit contenir pour l'appeler (`ASSOC`), dans quel ordre vont les suites (`CHAINS`), quelles
 * paires sont justes (`PAIRS`) et ce qui va dans chaque case (`MEMBERS`). Les fragments sont des suites de mots entiers, lues sans accent,
 * sans majuscule et sans ponctuation ; une réponse sans fragment (`[]`) n'est JAMAIS une bonne réponse.
 */

const TOPIC_KINDS: Record<string, readonly string[]> = {
  "ar-cm2-rosaces": ["cm2-ros-qcm", "cm2-ros-ordre", "cm2-ros-ecrire"],
  "ar-cm2-observer": ["cm2-obs-qcm", "cm2-obs-trou", "cm2-obs-ordre", "cm2-obs-relier", "cm2-obs-glisser"],
  "ar-cm2-vent": ["cm2-ven-qcm", "cm2-ven-trou", "cm2-ven-ecrire", "cm2-ven-relier", "cm2-ven-glisser"],
  "ar-cm2-chanter": ["cm2-cha-qcm", "cm2-cha-trou", "cm2-cha-relier", "cm2-cha-glisser"],
  "ar-cm2-mise-en-scene": ["cm2-mes-qcm", "cm2-mes-trou", "cm2-mes-ecrire", "cm2-mes-ordre", "cm2-mes-relier", "cm2-mes-glisser"],
};

/** Les jeux que les quatre premières fiches gardaient déjà, avec leurs places : les gabarits prennent les places qui restent. */
const KEPT_GAMES: Record<string, Record<string, number>> = {
  "ar-cm2-rosaces": { "pixel-symetrie": 5, "coloriage-magique": 2 },
  "ar-cm2-observer": { "pixel-memoire": 2, "pixel-copie": 2 },
  "ar-cm2-vent": { "ecoute-melodie": 2, "ecoute-pareil": 2 },
  "ar-cm2-chanter": { "ecoute-intensite": 2, "ecoute-motif-rythmique": 2, "ecoute-melodie": 2 },
};

const ASSOC: Record<string, string[]> = {
  // ---------------------------------------------------------------------------------------------------------------- ROSACES
  rosace: ["décor en forme de fleur, répété autour d'un centre", "décor tourne autour d'un point central"],
  symetrie: ["deux moitiés d'une figure se ressemblent comme dans un miroir", "figure est pareille de chaque côté de la ligne"],
  "axe de symetrie": ["ligne qui partage une figure en deux moitiés identiques", "ligne sépare une figure symétrique en deux parties pareilles"],
  motif: ["petit dessin décoratif que l'on répète", "dessin qui revient pour décorer"],
  decoration: ["embellir un objet avec des motifs"],
  palette: [],
  pinceau: [],
  gomme: [],
  // ---------------------------------------------------------------------------------------------------------------- OBSERVER
  "dessin d observation": ["dessin fait en regardant bien un objet réel", "dessin d'un objet placé sous les yeux", "quand on dessine un objet que l'on a sous les yeux"],
  "dessin d imitation": ["dessin qui copie un dessin déjà fait", "dessin qui reproduit un modèle déjà dessiné", "Reproduire un modèle déjà dessiné, c'est faire"],
  illustration: ["image qui accompagne un texte pour le montrer", "dessin placé dans un livre pour montrer ce que dit le texte", "dessin placé dans un livre pour montrer le texte"],
  illustrateur: ["personne qui dessine les images d'un livre", "Qui crée les dessins qui accompagnent un texte", "Celui qui crée les dessins d'un livre"],
  modele: ["ce que l'on regarde pour le dessiner", "ce qu'on place devant soi pour le dessiner", "on place devant soi"],
  "pecheur qui lance son filet": ["Le pêcheur jette son filet à la mer"],
  "vendeuse devant ses mangues": ["La vendeuse range ses mangues sur l'étal"],
  "enfants qui jouent sous un grand arbre": ["Les enfants jouent au ballon sous le baobab"],
  "griot avec sa kora": ["Le griot joue de la kora devant le village"],
  "champs sous la pluie": ["La pluie tombe sur les champs"],
  // ---------------------------------------------------------------------------------------------------------------- VENT
  "flute peule": ["instrument à vent traditionnel est joué par les bergers peuls", "tradition peule se joue en soufflant dans un tuyau", "Le berger peul joue de", "instrument à vent de la tradition peule est"],
  trompette: ["en cuivre se joue avec trois pistons", "en cuivre a trois pistons et un son brillant", "à vent en cuivre à trois pistons est", "jouer avec trois pistons, on prend"],
  saxophone: ["très utilisé dans le jazz", "à anche accompagne souvent les orchestres de jazz", "à anche, joué dans le jazz, est", "orchestre de jazz, on entend souvent"],
  clairon: ["sonne les appels militaires", "sans piston, sert à sonner l'appel", "soldat sonne l'appel avec", "sans piston qui sonne l'appel est"],
  kora: [],
  djembe: [],
  balafon: [],
  "en soufflant": ["produit-on un son avec un instrument à vent", "fait-on sonner une flûte ou une trompette", "fait sonner un instrument à vent", "Une flûte sonne"],
  "en frappant": [],
  "en pincant les cordes": [],
  "en frottant": [],
  fredonner: ["chanter un air la bouche fermée", "chante un air sans les paroles", "chanter sans les paroles"],
  crier: [],
  applaudir: [],
  melodie: ["suite de notes qui forme un air", "mot désigne l'air de la chanson", "L'air de la chanson se nomme", "suite de notes qui forme un air de chant", "ligne des notes que la voix chante", "notes que la voix chante forment"],
  // ---------------------------------------------------------------------------------------------------------------- CHANTER
  nuance: ["le fait de chanter plus fort ou plus doux", "chanter plus fort ou plus doux", "force du son, forte ou douce", "fort ou doux voilà"],
  rythme: ["suite de sons longs et courts qui marque le pas du chant", "façon dont les sons durent, longs ou courts", "sons longs et courts qui marquent le pas forment", "au pas du chant, c'est suivre"],
  accompagnement: ["instruments ou les battements qui soutiennent un chant", "ce qui accompagne la voix pendant un chant", "instruments qui soutiennent un chant forment", "Jouer sous la voix avec un instrument"],
  refrain: ["partie d'un chant qui revient après chaque couplet", "partie qui revient après chaque couplet"],
  silence: [],
  solo: [],
  // ---------------------------------------------------------------------------------------------------------------- MISE EN SCÈNE
  decor: ["ce qui montre le lieu de l'histoire sur la scène", "éléments qui représentent l'endroit où se passe la pièce", "les arbres en carton forment"],
  costume: ["vêtements que porte un comédien pour jouer son rôle", "tenue d'un personnage sur la scène", "vêtements du comédien pour son rôle forment", "tenue du personnage sur la scène s'appelle"],
  deguisement: ["se transformer avec des vêtements pour ressembler à une autre personne", "transformation d'un enfant en pirate ou en roi pour jouer", "enfant qui se transforme en roi porte", "vêtements de fête pour ressembler à une autre personne forment"],
  "mise en scene": ["art de placer les comédiens, les décors et la lumière", "façon d'organiser le spectacle sur la scène", "Placer les comédiens, le décor et la lumière, c'est faire", "Organiser le spectacle sur la scène, c'est faire"],
  "metteur en scene": ["dirige les comédiens et organise le spectacle", "dirige tout le spectacle et les comédiens", "personne qui dirige les comédiens est", "Celui qui dirige tout le spectacle est"],
  comedien: ["interprète un personnage devant le public", "personne qui joue un rôle sur la scène", "Celui qui interprète un personnage est"],
  spectateur: ["personne qui regarde le spectacle", "s'assoit dans la salle pour voir la pièce"],
  applaudissement: [],
  cuisinier: [],
  berger: [],
  interpreter: ["comédien qui joue un personnage devant le public", "verbe dit que le comédien donne vie à un personnage", "Jouer un personnage devant le public, c'est", "comédien va"],
  regarder: [],
};

/** Les suites : chaque énoncé qui contient `when` n'accepte que des tuiles prises dans une de ces listes, dans cet ordre. */
const CHAINS: { when: RegExp; chain: string[] }[] = [
  { when: /tracer une rosace au compas de la premiere/, chain: ["Tracer un cercle au compas", "Piquer sur le cercle et tracer un arc", "Recommencer tout autour du cercle", "Colorier les pétales"] },
  { when: /figure symetrique de la premiere/, chain: ["Tracer l'axe de symétrie", "Dessiner une moitié de la figure", "Dessiner l'autre moitié de l'autre côté", "Colorier les deux moitiés pareil"] },
  { when: /dessiner un objet reel de la premiere/, chain: ["Observer le modèle", "Tracer les grandes formes", "Ajouter les détails", "Colorier le dessin"] },
  { when: /illustrer un texte de la premiere/, chain: ["Lire le texte", "Choisir le passage", "Dessiner la scène", "Colorier l'image"] },
  { when: /preparer un spectacle de la premiere/, chain: ["Choisir l'histoire", "Distribuer les rôles", "Répéter la pièce", "Jouer devant le public"] },
  { when: /moments d un spectacle du premier/, chain: ["Entrer en scène", "Jouer son rôle", "Saluer le public"] },
];

const PAIRS: [string, string][] = [
  // Observer
  ["Dessin d'observation", "Regarder un objet réel"], ["Dessin d'imitation", "Copier un dessin"], ["Illustration", "Image d'un texte"], ["Illustrateur", "Dessine les images d'un livre"],
  ["Modèle", "Ce qu'on regarde pour dessiner"],
  // Vent
  ["Flûte peule", "Instrument des bergers peuls"], ["Trompette", "Trois pistons"], ["Saxophone", "Une anche qui vibre"], ["Clairon", "Appels militaires"],
  ["Kora", "Instrument à cordes"], ["Xalam", "Instrument à cordes"], ["Guitare", "Instrument à cordes"],
  ["Djembé", "Instrument à percussion"], ["Tama", "Instrument à percussion"], ["Balafon", "Instrument à percussion"],
  ["Flûte peule", "Instrument à vent"], ["Trompette", "Instrument à vent"], ["Clairon", "Instrument à vent"],
  ["Mélodie", "Suite de notes"], ["Fredonner", "Chanter bouche fermée"], ["Rythme", "Sons longs et courts"],
  // Chanter
  ["Nuance", "Fort ou doux"], ["Accompagnement", "Soutient le chant"], ["Refrain", "Partie qui revient"],
  // Mise en scène
  ["Décor", "Montre le lieu de l'histoire"], ["Costume", "Vêtement du personnage"], ["Metteur en scène", "Dirige les comédiens"], ["Comédien", "Joue un personnage"],
  ["Spectateur", "Regarde le spectacle"], ["Mise en scène", "Organise le spectacle"], ["Interpréter", "Jouer un personnage"],
];

const MEMBERS: Record<string, string[]> = {
  "D'après un modèle réel": ["Dessiner le baobab de la cour", "Dessiner son cartable sur la table", "Dessiner une mangue devant soi", "Dessiner son voisin de classe"],
  "D'après son imagination": ["Dessiner un animal qui vole et parle", "Dessiner la maison de ses rêves", "Dessiner une ville sur la lune", "Dessiner un dragon gentil"],
  "Instrument à vent": ["Flûte peule", "Trompette", "Saxophone", "Clairon"],
  "Autre instrument": ["Kora", "Djembé", "Balafon", "Xalam", "Tama"],
  Fort: ["Un coup de tonnerre", "Un tambour de fête", "Un klaxon dans la rue", "Un cri de joie"],
  Doux: ["Une berceuse pour bébé", "Un murmure à l'oreille", "Le vent dans les feuilles", "Un chuchotement en classe"],
  "Sur la scène": ["Comédien", "Décor", "Costume", "Personnage"],
  "Dans la salle": ["Spectateur", "Public", "Fauteuil", "Applaudissements"],
  "Avant le spectacle": ["Choisir l'histoire", "Distribuer les rôles", "Répéter la pièce", "Fabriquer le décor"],
  "Pendant le spectacle": ["Entrer en scène", "Dire son texte", "Jouer son rôle", "Se déplacer sur la scène"],
};

/** Des réponses qui sont toutes justes pour une même question : elles ne se proposent jamais ensemble. */
const TWINS: readonly (readonly string[])[] = [
  ["costume", "deguisement"],
  ["rosace", "motif"],
  ["symetrie", "axe de symetrie"],
  ["trompette", "clairon"],
  ["saxophone", "trompette"],
];
/** Aucun énoncé de ce lot ne demande « lequel de ces noms » : tout le groupe ne peut pas être juste. */
const LIST_STEM = /^\b$/;

defineTemplateTests({
  label: "des arts du CM2",
  klass: "CM2",
  count: 5,
  topicKinds: TOPIC_KINDS,
  expectedKinds: 23,
  topicCount: 5,
  kindPattern: /^cm2-(ros|obs|ven|cha|mes)-/,
  assoc: ASSOC,
  twins: TWINS,
  listStem: LIST_STEM,
  chains: CHAINS,
  pairs: PAIRS,
  members: MEMBERS,
  zonePairs: [
    ["D'après un modèle réel", "D'après son imagination"],
    ["Instrument à vent", "Autre instrument"],
    ["Fort", "Doux"],
    ["Sur la scène", "Dans la salle"],
    ["Avant le spectacle", "Pendant le spectacle"],
  ],
  keptGames: KEPT_GAMES,
});

describe("une phrase à trou n'accorde aucun mot placé après le blanc", () => {
  /** Les seuls mots qui suivent un blanc dans ce lot : un petit mot ou un déterminant, jamais un adjectif que le genre de la réponse ferait accorder. */
  const AFTER_BLANK = new Set(["du", "son", "un"]);

  it("laisse après le blanc un petit mot, jamais un mot qui s'accorde", () => {
    for (const entry of allProgrammeEntries()) {
      if (!(entry.topic.key in TOPIC_KINDS)) continue;
      for (let n = 0; n < 20; n++)
        for (let palier = 1; palier <= 5; palier++) {
          const games = generateGames(entry.topic.games ?? [], { klass: "CM2", palierIndex: palier, palierCount: 5, seed: `accord:${entry.topic.key}:${n}:${palier}` });
          for (const game of games) {
            if (game.type !== "fill-blank") continue;
            const next = /___ ([\p{L}']+)/u.exec(String(game.payload.text))?.[1];
            if (next !== undefined) expect(AFTER_BLANK.has(next.toLowerCase()), `« ${String(game.payload.text)} » : « ${next} » suit le blanc`).toBe(true);
          }
        }
    }
  });
});
