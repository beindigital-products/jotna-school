import { describe, expect, it, vi } from "vitest";
import { generateGames } from "../paliers/games";
import { judgeShortAnswer } from "../paliers/exerciseRules";
import { effectivePalierCount } from "../palierRules";
import { allProgrammeEntries } from "../programme";

// Ces tests jouent des centaines de tirages : sur le serveur de CI, chargé, l'un d'eux dépasse les 5 secondes par défaut.
vi.setConfig({ testTimeout: 60_000 });

/**
 * LA RELECTURE « ENSEIGNANT » DU 26 OCTOBRE 2026, LES SCIENCES (docs/relecture-enseignant-agents-2026-10-26.md).
 *
 * Huit agents jouant un enseignant ont relu la fiche des exercices. Chaque défaut ci-dessous a été retrouvé dans le gabarit, jugé réel, puis corrigé à la
 * source. Chaque test est écrit pour ÉCHOUER avec l'ancien gabarit : un indice qui compte faux, un indice qui annonce ce que l'exercice ne montre pas,
 * une étiquette qui vaut pour deux cases, une réponse défendable refusée, un énoncé qui admet une seconde maladie.
 */

type Game = { type: string; prompt: string; hints: string[]; payload: Record<string, unknown> };

/** Tous les exercices d'une thématique d'un genre, à chaque palier, sur plusieurs graines. */
function played(topicKey: string, kind: string, seeds = 12): Game[] {
  const entry = allProgrammeEntries().find((candidate) => candidate.topic.key === topicKey);
  if (!entry) throw new Error(`thématique inconnue : ${topicKey}`);
  const palierCount = effectivePalierCount({ palierCount: entry.topic.palierCount, class: entry.klass });
  const out: Game[] = [];
  for (let palierIndex = 1; palierIndex <= palierCount; palierIndex++)
    for (let n = 0; n < seeds; n++) {
      const games = generateGames(entry.topic.games ?? [], { klass: entry.klass, palierIndex, palierCount, seed: `relecture:${topicKey}:${palierIndex}:${n}` });
      for (const game of games) if ((game.payload.game as { kind?: string } | undefined)?.kind === kind) out.push(game as unknown as Game);
    }
  expect(out.length, `${topicKey} ${kind} : aucun tirage`).toBeGreaterThan(0);
  return out;
}

const itemsOf = (game: Game) => game.payload.items as { text: string; correctZone: string }[];
const pairsOf = (game: Game) => game.payload.pairs as { left: string; right: string }[];
const blankOf = (game: Game) => (game.payload.blanks as { options: string[]; answer: string }[])[0];
/** Admise telle quelle : pas de « tu as mal écrit » (l'indulgence aux fautes de frappe ne compte pas pour une réponse admise). */
const accepts = (game: Game, answer: string) => {
  const verdict = judgeShortAnswer(answer, { acceptedAnswers: game.payload.acceptedAnswers as string[] });
  return verdict.correct && verdict.spelling === null;
};
const fold = (text: string) => text.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();

const NUMBER_WORDS: Record<string, number> = { un: 1, deux: 2, trois: 3, quatre: 4, cinq: 5 };
/** Les nombres qu'un indice annonce : « Trois gestes … » dit trois. */
const claimedCounts = (hint: string) =>
  fold(hint)
    .split(/[^a-z]+/)
    .filter((word) => word in NUMBER_WORDS && word !== "un")
    .map((word) => NUMBER_WORDS[word]);

describe("CE1 : un indice n'annonce pas plus de choses que l'exercice n'en montre", () => {
  it("sc-ce1-eau 1.6 : l'indice du glissé de l'eau ne compte pas trois gestes quand la case en reçoit un ou deux", () => {
    const games = played("sc-ce1-eau", "ce1-pot-glisser", 30);
    for (const game of games) {
      const safe = itemsOf(game).filter((item) => item.correctZone === "Rend l'eau plus sûre").length;
      for (const hint of game.hints) for (const claimed of claimedCounts(hint)) expect(claimed, `« ${hint} » : la case en reçoit ${safe}`).toBe(safe);
    }
    // Le tirage de la fiche (deux gestes dans la case) existe bien : sans lui, le test ne prouverait rien.
    expect(games.some((game) => itemsOf(game).filter((item) => item.correctZone === "Rend l'eau plus sûre").length !== 3)).toBe(true);
  });

  it("sc-ce1-respiration 1.7 : l'indice 2 ne nomme pas un animal, un organe et l'air quand les trois mots n'en parlent pas", () => {
    const games = played("sc-ce1-respiration", "ce1-resp-relier", 40);
    const category: Record<string, string> = { Poumons: "corps", Nez: "corps", Branchies: "animal", Fumée: "air", "Air pur": "air" };
    let withoutAnimal = 0;
    for (const game of games) {
      const present = new Set(pairsOf(game).map((pair) => category[pair.left]));
      if (!present.has("animal")) withoutAnimal += 1;
      // « Un mot parle d'un animal, un autre du corps, un autre de l'air. » ne vaut que si les trois sortes y sont.
      if (/^un mot parle/i.test(game.hints[1])) for (const kind of ["animal", "corps", "air"]) expect(present.has(kind), `« ${game.hints[1]} » : ${pairsOf(game).map((pair) => pair.left).join(", ")}`).toBe(true);
    }
    expect(withoutAnimal).toBeGreaterThan(0);
  });

  it("sc-ce1-respiration 1.7 : le nez se relie à une explication que les poumons ne partagent pas", () => {
    const nose = played("sc-ce1-respiration", "ce1-resp-relier", 40)
      .flatMap(pairsOf)
      .filter((pair) => pair.left === "Nez");
    expect(nose.length).toBeGreaterThan(0);
    for (const pair of nose) {
      // « L'air y entre quand on respire » vaut aussi pour les poumons : l'explication doit nommer ce qui n'est vrai que du nez.
      expect(pair.right, pair.right).not.toBe("L'air y entre quand on respire");
      expect(fold(pair.right), pair.right).toContain("visage");
    }
  });

  it("sc-ce1-respiration 1.1 : l'indice ne parle pas d'un « animal » quand la question parle de l'homme", () => {
    for (const game of played("sc-ce1-respiration", "ce1-resp-organe-qcm", 30)) for (const hint of game.hints) expect(hint).not.toMatch(/cet animal/);
  });

  it("sc-ce1-paludisme 1.7 : l'indice 2 ne cite pas l'eau, un lieu ou un objet quand les trois mots n'en parlent pas", () => {
    const games = played("sc-ce1-paludisme", "ce1-palu-relier", 60);
    const category: Record<string, string> = { Moustiquaire: "objet", Dispensaire: "lieu", "Eaux stagnantes": "eau", Anophèle: "animal", "Vers intestinaux": "animal" };
    let withoutWater = 0;
    for (const game of games) {
      const present = new Set(pairsOf(game).map((pair) => category[pair.left]));
      if (!present.has("eau")) withoutWater += 1;
      if (/^un mot parle/i.test(game.hints[1])) for (const kind of ["lieu", "objet", "animal", "eau"]) expect(present.has(kind), `« ${game.hints[1]} » : ${pairsOf(game).map((pair) => pair.left).join(", ")}`).toBe(true);
    }
    expect(withoutWater).toBeGreaterThan(0);
  });
});

describe("CE2", () => {
  it("sc-ce2-plantes 1.8 : l'indice du glissé de la germination n'annonce pas trois choses quand la case en montre deux", () => {
    for (const game of played("sc-ce2-plantes", "ce2-besoin-glisser", 30)) {
      const needed = itemsOf(game).filter((item) => item.correctZone === "Il lui faut").length;
      for (const hint of game.hints) for (const claimed of claimedCounts(hint)) expect(claimed, `« ${hint} » : la case en reçoit ${needed}`).toBe(needed);
    }
  });

  it("sc-ce2-environnement 1.4 : « manque d'eau » seul n'est jamais rangé en population ; ce qui s'y range nomme le trop-plein d'habitants", () => {
    const games = played("sc-ce2-environnement", "ce2-env-probleme-glisser", 40);
    for (const game of games) {
      const texts = itemsOf(game).map((item) => item.text);
      expect(texts, "« Manque d'eau » se range aussi en environnement").not.toContain("Manque d'eau");
      for (const item of itemsOf(game).filter((entry) => entry.correctZone === "Population")) expect(fold(item.text), item.text).toMatch(/peupl|place|pour tous|monde/);
    }
  });

  it("sc-ce2-sante 1.9 : « la maladie des moustiques » seule admet la dengue et la fièvre jaune ; l'énoncé désigne l'anophèle et « malaria » est admis", () => {
    const games = played("sc-ce2-sante", "ce2-sante-ecrire", 40).filter((game) => /^Comment s'appelle la maladie/.test(game.prompt));
    expect(games.length).toBeGreaterThan(0);
    for (const game of games) {
      expect(game.prompt).toContain("anophèle");
      expect(accepts(game, "paludisme")).toBe(true);
      expect(accepts(game, "le paludisme")).toBe(true);
      expect(accepts(game, "malaria")).toBe(true);
      expect(accepts(game, "la malaria")).toBe(true);
      expect(accepts(game, "dengue")).toBe(false);
    }
  });

  it("sc-ce2-animaux 1.7 : « La tortue est un animal ___ » ne propose pas « aquatique » (la tortue de mer l'est)", () => {
    const games = played("sc-ce2-animaux", "ce2-animal-trou", 40).filter((game) => String(game.payload.text).startsWith("La tortue est un animal"));
    expect(games.length).toBeGreaterThan(0);
    for (const game of games) {
      expect(blankOf(game).answer).toBe("ovipare");
      expect(blankOf(game).options).not.toContain("aquatique");
    }
  });
});

describe("CM1", () => {
  it("sc-cm1-hygiene 1.6 : « insalubre », l'adjectif du lieu décrit, est admis", () => {
    const games = played("sc-cm1-hygiene", "cm1-hyg-ecrire", 40).filter((game) => /^Quel mot (désigne|décrit) un lieu/.test(game.prompt));
    expect(games.length).toBeGreaterThan(0);
    for (const game of games) {
      expect(accepts(game, "Insalubrité")).toBe(true);
      expect(accepts(game, "insalubre")).toBe(true);
    }
  });

  it("sc-cm1-hygiene 1.8 : « insalubrité » ne se relie pas à ses causes (les ordures et les eaux usées), mais à ce qu'elle est", () => {
    const pairs = played("sc-cm1-hygiene", "cm1-hyg-relier", 60).flatMap(pairsOf);
    expect(pairs.some((pair) => pair.left === "Insalubrité")).toBe(true);
    for (const pair of pairs.filter((entry) => entry.left === "Insalubrité")) expect(pair.right).not.toBe("Ordures et eaux usées");
  });

  it("sc-cm1-objets 1.6 : « remplacer le joint » et « réparer le joint » sont admis pour le robinet qui fuit", () => {
    const games = played("sc-cm1-objets", "cm1-obj-ecrire", 40).filter((game) => /robinet/.test(game.prompt) && /fuit|goutte|fuite/.test(game.prompt));
    expect(games.length).toBeGreaterThan(0);
    for (const game of games) {
      expect(accepts(game, "Changer le joint")).toBe(true);
      expect(accepts(game, "Remplacer le joint")).toBe(true);
      expect(accepts(game, "Réparer le joint")).toBe(true);
    }
  });

  it("sc-cm1-respiration 1.6 : « la fumée » est admise, et l'énoncé demande un geste quand la réponse en est un", () => {
    const written = played("sc-cm1-respiration", "cm1-rsp-ecrire", 40).filter((game) => /fumée/.test(game.prompt));
    expect(written.length).toBeGreaterThan(0);
    for (const game of written) {
      expect(accepts(game, "Éviter la fumée")).toBe(true);
      expect(accepts(game, "La fumée")).toBe(true);
      expect(accepts(game, "fumée")).toBe(true);
    }
    // « Que faut-il éviter de respirer ? » avec pour bonne case « Éviter la fumée » : la question doit demander un geste.
    for (const game of played("sc-cm1-respiration", "cm1-rsp-qcm", 40)) {
      const options = game.payload.options as string[];
      if (options[game.payload.correctIndex as number] === "Éviter la fumée") expect(game.prompt, game.prompt).toMatch(/geste/);
    }
  });

  it("sc-cm1-phenomenes 1.6 : « la fusion » et « la fonte » sont admises pour le glaçon qui fond", () => {
    const games = played("sc-cm1-phenomenes", "cm1-phe-ecrire", 40).filter((game) => /glaçon/.test(game.prompt));
    expect(games.length).toBeGreaterThan(0);
    for (const game of games) {
      for (const answer of ["Fusion", "la fusion", "Fonte", "la fonte"]) expect(accepts(game, answer), `${game.prompt} : ${answer}`).toBe(true);
      expect(accepts(game, "Condensation")).toBe(false);
    }
  });
});

describe("CM2", () => {
  it("sc-cm2-appareils 1.6 : la question des mains admet « sèches », et le QCM demande un geste", () => {
    const written = played("sc-cm2-appareils", "cm2-apr-ecrire", 40).filter((game) => /mains/.test(game.prompt) && /fiche|prise|appareil/.test(game.prompt));
    expect(written.length).toBeGreaterThan(0);
    for (const game of written) {
      expect(accepts(game, "Sécher ses mains")).toBe(true);
      expect(accepts(game, "Sèches")).toBe(true);
      expect(accepts(game, "Les mains sèches")).toBe(true);
    }
    // « Dans quel état … ? » avec pour bonne case « Sécher ses mains » : l'énoncé ne demande pas un état.
    for (const game of played("sc-cm2-appareils", "cm2-apr-qcm", 40)) {
      const options = game.payload.options as string[];
      if (options[game.payload.correctIndex as number] === "Sécher ses mains") expect(game.prompt, game.prompt).not.toMatch(/Dans quel état/);
    }
  });

  it("sc-cm2-appareils 1.9 : « débrancher le chargeur » (aussi un geste de sécurité) n'est pas rangé dans une case", () => {
    const games = played("sc-cm2-appareils", "cm2-apr-glisser", 40).filter((game) => (game.payload.zones as string[]).includes("Économie"));
    expect(games.length).toBeGreaterThan(0);
    for (const game of games) expect(itemsOf(game).map((item) => item.text)).not.toContain("Débrancher le chargeur");
  });

  it("sc-cm2-nutrition 1.6 : « construction » et « aliments de construction » sont admis pour le poisson, et de même pour les autres groupes", () => {
    const games = played("sc-cm2-nutrition", "cm2-nut-ecrire", 60);
    const groups: [RegExp, string[]][] = [
      [/poisson|niébé/, ["Aliment de construction", "De construction", "Construction", "Aliments de construction", "Les aliments de construction"]],
      [/mangue|légumes verts/, ["Aliment de protection", "De protection", "Protection", "Aliments de protection", "Les aliments de protection"]],
      [/riz|mil/, ["Aliment énergétique", "Énergétique", "Aliments énergétiques", "Les aliments énergétiques"]],
    ];
    let checked = 0;
    for (const game of games.filter((entry) => /de quel groupe|à quel groupe/.test(entry.prompt)))
      for (const [pattern, answers] of groups)
        if (pattern.test(game.prompt)) {
          checked += 1;
          for (const answer of answers) expect(accepts(game, answer), `${game.prompt} : ${answer}`).toBe(true);
        }
    expect(checked).toBeGreaterThan(0);
  });
});
