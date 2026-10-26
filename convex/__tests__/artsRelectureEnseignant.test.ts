import { describe, expect, it, vi } from "vitest";
import { GAME_KINDS, type GameKind } from "../paliers/games";
import { makeContext, type GameLevel } from "../paliers/games/shared";
import type { VisibleClassName } from "../curriculum";

vi.setConfig({ testTimeout: 30_000 });

/**
 * LA RELECTURE « ENSEIGNANT » DU 26 OCTOBRE 2026, LES ARTS : neuf défauts relevés par des agents qui jouaient un enseignant, retenus après
 * vérification dans le code (`docs/relecture-enseignant-agents-2026-10-26.md`).
 *
 * - `ar-cp-roles` : « Quel objet sert au boulanger ? » laissait la balance (qui pèse la farine) aussi juste que le four ; la question dit
 *   désormais à quoi sert l'objet. « Tu prends la température d'un malade et tu le soignes » n'admettait pas le médecin.
 * - `ar-ce1-pliage` : l'indice parlait d'un « trait » qu'aucun mot de l'exercice n'est.
 * - `ar-ce2-hymne` : « Que fait-on ensemble au lever des couleurs ? » n'admettait que chanter (saluer, se lever, se taire sont aussi justes).
 * - `ar-ce2-theatre` : les mots que dit chaque acteur sont aussi le dialogue, les paroles ; l'indice « commence par r » ne vaut que pour le mot
 *   du théâtre.
 * - `ar-cm1-comedie` : « La réponse commence par la lettre E » devant trois choix qui commencent par « des » ; « Le rôle » et « Un rôle »
 *   refusés.
 * - `ar-cm1-memoire` et `ar-cm2-observer` : « Le dessin de le papillon » (gabarit commun du dessin de mémoire et de la copie).
 *
 * Chaque test lit les exercices tirés (jamais les tableaux des sources) et compare à une table écrite ici.
 */

type Exo = { prompt: string; answerKey: string; hints: string[]; payload: Record<string, unknown> };

function draw(kind: GameKind, klass: VisibleClassName, seeds: number, palier?: boolean): Exo[] {
  const out: Exo[] = [];
  for (const level of [1, 2, 3, 4] as GameLevel[]) {
    for (let n = 0; n < seeds; n++) {
      const index = palier ? (n % 5) + 1 : undefined;
      const ctx = makeContext(klass, level, `${kind}:arts-relecture:${level}:${n}`, new Set(), undefined, undefined, index === undefined ? undefined : { index, count: 5 });
      out.push(GAME_KINDS[kind].make(ctx) as unknown as Exo);
    }
  }
  return out;
}

const optionsOf = (exo: Exo) => exo.payload.options as string[];
const rightOption = (exo: Exo) => optionsOf(exo)[exo.payload.correctIndex as number];
const acceptedOf = (exo: Exo) => exo.payload.acceptedAnswers as string[];
const blankOf = (exo: Exo) => (exo.payload.blanks as { options: string[]; answer: string }[])[0];

describe("ar-cp-roles : l'objet qui sert à un travail précis", () => {
  /** [« à… », à quoi l'objet sert, l'objet] : écrit à part de la source. */
  const USES: [string, string, string][] = [
    ["au vendeur", "à peser ce qu'on achète", "Balance"],
    ["au maître", "à écrire sur le tableau noir", "Craie"],
    ["à l'infirmière", "à mesurer la fièvre", "Thermomètre"],
    ["au pêcheur", "à prendre les poissons dans l'eau", "Filet"],
    ["au cultivateur", "à retourner la terre du champ", "Daba"],
    ["au chauffeur", "à guider le car", "Volant"],
    ["au tailleur", "à assembler le tissu avec du fil", "Machine à coudre"],
    ["au boulanger", "à cuire la pâte", "Four"],
  ];

  it("dit dans la question à quoi l'objet sert, et la bonne option est l'objet de ce travail", () => {
    const seen = new Set<string>();
    for (const exo of draw("metier-outil", "CP", 80)) {
      const row = USES.find(([to, use]) => exo.prompt === `Quel objet sert ${to} ${use} ?`);
      expect(row, `question sans usage : ${exo.prompt}`).toBeDefined();
      expect(rightOption(exo), exo.prompt).toBe(row![2]);
      seen.add(row![0]);
    }
    expect(seen.size).toBe(USES.length);
  });

  it("ne laisse plus « Quel objet sert au boulanger ? » sans dire à quoi : la balance pèse la farine", () => {
    for (const exo of draw("metier-outil", "CP", 80)) expect(exo.prompt).not.toMatch(/^Quel objet sert (au|à l')\S+ \?$/u);
  });

  it("admet le médecin et le docteur pour celui qui prend la température et soigne", () => {
    const rows = draw("metier-ecrire", "CP", 200).filter((exo) => exo.prompt.includes("prends la température"));
    expect(rows.length).toBeGreaterThan(0);
    for (const exo of rows) {
      const accepted = acceptedOf(exo);
      for (const word of ["infirmière", "infirmier", "médecin", "le médecin", "docteur", "un docteur"]) expect(accepted, word).toContain(word);
    }
  });
});

describe("ar-ce1-pliage : l'indice du « relier » ne nomme que ce que les mots sont", () => {
  it("ne parle d'aucun « trait » : ni Ciseaux, ni Colle, ni Argile, ni Papier, ni Pli n'en est un", () => {
    const rows = draw("ce1-pli-relier", "CE1", 120);
    expect(rows.length).toBeGreaterThan(0);
    for (const exo of rows) {
      expect(exo.hints[1], exo.prompt).not.toMatch(/trait/iu);
      expect(exo.hints[1], exo.prompt).not.toMatch(/\bun outil, un autre\b/u);
    }
  });
});

describe("ar-ce2-hymne : le verbe qu'on fait avec la voix", () => {
  it("met la voix dans l'énoncé, pour que saluer ou se lever ne soient pas des réponses justes", () => {
    const rows = draw("ce2-hymne-ecrire", "CE2", 200).filter((exo) => /lever des couleurs/u.test(exo.prompt) && /verbe/u.test(exo.prompt) && !/inventer/u.test(exo.prompt));
    expect(rows.length).toBeGreaterThan(0);
    for (const exo of rows) {
      expect(exo.prompt).toBe("Que fait-on avec sa voix, tous ensemble, au lever des couleurs ? Écris le verbe.");
      expect(exo.answerKey).toBe("chanter");
      expect(acceptedOf(exo)).toEqual(expect.arrayContaining(["chanter", "chanter l'hymne", "chanter ensemble"]));
      for (const wrong of ["saluer", "se lever", "se taire"]) expect(acceptedOf(exo)).not.toContain(wrong);
    }
  });
});

describe("ar-ce2-theatre : les mots que dit chaque acteur", () => {
  it("admet le dialogue et les paroles en plus des répliques, et l'indice de la lettre vise le mot du théâtre", () => {
    const rows = draw("ce2-theatre-ecrire", "CE2", 200).filter((exo) => exo.prompt.startsWith("Comment appelle-t-on les mots que dit chaque acteur"));
    expect(rows.length).toBeGreaterThan(0);
    for (const exo of rows) {
      const accepted = acceptedOf(exo);
      for (const word of ["répliques", "réplique", "texte", "dialogue", "dialogues", "paroles"]) expect(accepted, word).toContain(word);
      expect(exo.answerKey).toBe("répliques");
      expect(exo.hints[2]).toBe("Le mot du théâtre commence par la lettre r.");
    }
  });
});

describe("ar-cm1-comedie : l'article des choix et de la réponse écrite", () => {
  const TROU_ARTICLES = ["un ", "une ", "des ", "le ", "la ", "les ", "l'"];

  it("ne dit pas « commence par la lettre E » devant des choix qui commencent tous par « des »", () => {
    let seen = 0;
    for (const exo of draw("cm1-cmd-trou", "CM1", 120, true)) {
      const answer = blankOf(exo).answer;
      if (!TROU_ARTICLES.some((article) => answer.startsWith(article))) continue;
      seen++;
      expect(exo.hints[2], `${exo.payload.text} / ${answer}`).not.toMatch(/^La réponse commence par la lettre/u);
      if (/lettre [A-Z]\.$/u.test(exo.hints[2])) expect(exo.hints[2]).toMatch(/^Après l'article, la réponse commence par la lettre [A-Z]\.$/u);
      if (answer === "des épaules basses") expect(exo.hints[2]).toBe("Après l'article, la réponse commence par la lettre E.");
    }
    expect(seen).toBeGreaterThan(0);
  });

  it("accepte « Le rôle » et « Un rôle » pour le personnage qu'un comédien joue", () => {
    const rows = draw("cm1-cmd-ecrire", "CM1", 160, true).filter((exo) => exo.prompt.startsWith("Comment appelle-t-on le personnage qu'un comédien joue"));
    expect(rows.length).toBeGreaterThan(0);
    for (const exo of rows) for (const word of ["Rôle", "Role", "Le rôle", "Un rôle"]) expect(acceptedOf(exo), word).toContain(word);
  });

  it("accepte « Un jeu de rôle » et « Le comédien » sous leur article", () => {
    const rows = draw("cm1-cmd-ecrire", "CM1", 160, true);
    const game = rows.filter((exo) => exo.prompt.includes("situation imaginée"));
    const actor = rows.filter((exo) => exo.prompt.includes("joue un rôle devant le public") || exo.prompt.includes("joue un personnage sur une scène"));
    expect(game.length).toBeGreaterThan(0);
    expect(actor.length).toBeGreaterThan(0);
    for (const exo of game) for (const word of ["Jeu de rôle", "Un jeu de rôle", "Le jeu de rôle"]) expect(acceptedOf(exo), word).toContain(word);
    for (const exo of actor) for (const word of ["Comédien", "Le comédien", "Un comédien", "Acteur"]) expect(acceptedOf(exo), word).toContain(word);
  });
});

describe("le dessin de mémoire et la copie (ar-cm1-memoire, ar-cm2-observer) : « du », pas « de le »", () => {
  const CLASSES: VisibleClassName[] = ["CI", "CP", "CE1", "CE2", "CM1", "CM2"];

  it("contracte « de le » en « du » et « de les » en « des » dans la réponse attendue", () => {
    const keys = new Set<string>();
    for (const klass of CLASSES) {
      for (const kind of ["pixel-memoire", "pixel-copie"] as const) {
        for (const exo of draw(kind, klass, 40)) {
          expect(exo.answerKey, `${klass} ${kind}`).not.toMatch(/\bde (le|les) /u);
          expect(exo.answerKey).toMatch(/^Le dessin (du|des|de la|de l'|de) /u);
          keys.add(exo.answerKey);
        }
      }
    }
    // « le papillon » et « le masque » sont les deux exemples relevés : ils doivent sortir contractés.
    const joined = [...keys].join("\n");
    expect(joined).toMatch(/Le dessin du papillon, de mémoire\./u);
    expect(joined).toMatch(/Le dessin du masque, case par case, comme le modèle\./u);
    // Les noms féminins et élidés gardent leur forme.
    expect(joined).toMatch(/Le dessin de la fleur, case par case/u);
    expect(joined).toMatch(/Le dessin de l'étoile, /u);
  });

  it("garde « Regarde bien le papillon » et « Reproduis le masque » : l'article reste après un verbe", () => {
    for (const exo of draw("pixel-memoire", "CM1", 40)) expect(exo.prompt).toMatch(/^Regarde bien (le |la |l'|les )/u);
    for (const exo of draw("pixel-copie", "CM2", 40)) expect(exo.prompt).toMatch(/^Reproduis (le |la |l'|les )/u);
  });
});
