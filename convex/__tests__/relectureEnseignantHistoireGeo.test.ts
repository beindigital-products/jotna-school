import { describe, expect, it, vi } from "vitest";
import { GAME_KINDS, type GameKind } from "../paliers/games";
import { gameLevel, makeContext, type GameLevel } from "../paliers/games/shared";

vi.setConfig({ testTimeout: 60_000 });

/**
 * LA RELECTURE « ENSEIGNANT » DU 26 OCTOBRE 2026 : l'histoire, la géographie et le civique du CM1 et du CM2.
 *
 * Huit agents jouant un enseignant ont relevé des réponses défendables refusées, des indices qui orientent vers une mauvaise réponse et des
 * consignes qui se trompent de mot. Chaque test rejoue le gabarit du palier 1 au palier 5 et cherche l'exercice relevé : il échoue avec le code
 * d'avant la relecture. Les tables vérifient la justesse des gabarits ; ce fichier vérifie ce que les tables ne voient pas (les écritures admises,
 * le sens d'un indice).
 */

type Exo = { prompt: string; answerKey: string; hints: string[]; payload: Record<string, unknown> };

const PALIERS = [1, 2, 3, 4, 5];
const DRAWS = 60;

/** Tous les exercices qu'un gabarit sert dans les cinq paliers d'une thématique de cinq paliers. */
function played(klass: "CM1" | "CM2", kind: GameKind): Exo[] {
  return PALIERS.flatMap((palier) =>
    Array.from({ length: DRAWS }, (_, n) =>
      GAME_KINDS[kind].make(makeContext(klass, gameLevel(palier, 5) as GameLevel, `${kind}:relecture:${palier}:${n}`, new Set(), undefined, undefined, { index: palier, count: 5 })) as unknown as Exo,
    ),
  );
}

const acceptedOf = (exo: Exo) => exo.payload.acceptedAnswers as string[];
const textOf = (exo: Exo) => String(exo.payload.text);
const pairsOf = (exo: Exo) => exo.payload.pairs as { left: string; right: string }[];

/** L'exercice relevé : il doit se jouer au moins une fois, sinon le test ne prouve rien. */
function found(exos: Exo[], test: (exo: Exo) => boolean): Exo[] {
  const list = exos.filter(test);
  expect(list.length, "l'exercice relevé ne se joue plus").toBeGreaterThan(0);
  return list;
}

describe("histoire du CM1 : la préhistoire et les résistants", () => {
  it("cm1-pre-ecrire : « sans cultiver ni élever » admet aussi la pêche et l'ordre inverse", () => {
    for (const exo of found(played("CM1", "cm1-pre-ecrire"), (e) => /sans cultiver ni élever/u.test(e.prompt))) {
      const accepted = acceptedOf(exo).map((a) => a.toLowerCase());
      expect(exo.answerKey).toBe("Chasse et cueillette");
      for (const answer of ["chasse et cueillette", "la chasse et la cueillette", "cueillette et chasse", "la cueillette et la chasse", "chasse, pêche et cueillette", "la chasse, la pêche et la cueillette", "la pêche, la chasse et la cueillette", "cueillette, chasse et pêche"]) {
        expect(accepted, answer).toContain(answer);
      }
      // Une seule activité ne répond pas à « quelles activités ».
      for (const alone of ["chasse", "cueillette", "pêche", "agriculture", "élevage"]) expect(accepted, alone).not.toContain(alone);
    }
  });

  it("cm1-res-trou : l'indice de la date de Dékheulé ne rapproche pas de 1895", () => {
    for (const exo of found(played("CM1", "cm1-res-trou"), (e) => /Dékheulé/u.test(textOf(e)) && /en ___|En ___/u.test(textOf(e)))) {
      expect(exo.hints[1]).not.toMatch(/peu avant la fin/u);
      expect(exo.hints[1]).toBe("C'est une quinzaine d'années avant la fin du XIXe siècle.");
    }
  });

  it("cm1-res-relier : El Hadji Oumar Tall n'est jamais relié à « son royaume » seul (il a fondé un empire parti du Fouta)", () => {
    const tall = found(played("CM1", "cm1-res-relier"), (e) => pairsOf(e).some((pair) => pair.right === "Fouta" || pair.left === "Fouta"));
    for (const exo of tall) {
      expect(exo.prompt, exo.prompt).not.toBe("Relie chaque résistant à son royaume.");
      expect(exo.prompt, exo.prompt).not.toBe("Relie chaque royaume à son résistant.");
      expect(exo.prompt, exo.prompt).toMatch(/royaume ou (à sa )?région/u);
    }
  });
});

describe("géographie du CM1 : les climats", () => {
  it("cm1-cli-ecrire : « où les pluies sont-elles les plus rares » admet Nord, Le nord, Dans le nord", () => {
    for (const exo of found(played("CM1", "cm1-cli-ecrire"), (e) => /Où les pluies sont-elles les plus rares/u.test(e.prompt))) {
      expect(exo.answerKey).toBe("Au nord");
      expect(acceptedOf(exo)).toEqual(expect.arrayContaining(["Au nord", "Nord", "Le nord", "Dans le nord", "Au nord du pays", "Au nord du Sénégal"]));
      expect(acceptedOf(exo)).not.toContain("Au sud");
      expect(acceptedOf(exo)).not.toContain("Sud");
    }
  });

  it("cm1-cli-ecrire : la zone du climat et les pluies abondantes admettent aussi la forme sans « au »", () => {
    for (const exo of found(played("CM1", "cm1-cli-ecrire"), (e) => /pluies sont-elles les plus abondantes|climat est-il guinéen|climat est-il soudanien|climat est-il sahélien/u.test(e.prompt))) {
      const accepted = acceptedOf(exo).map((a) => a.toLowerCase());
      const zone = accepted[0].replace(/^au /u, "");
      expect(accepted, exo.prompt).toEqual(expect.arrayContaining([zone, `le ${zone}`, `dans le ${zone}`]));
    }
  });
});

describe("civique du CM1 : les organisations du quartier", () => {
  it("cm1-aso-ecrire : « Le comité de quartier » et « Association de quartier » sont acceptés", () => {
    for (const exo of found(played("CM1", "cm1-aso-ecrire"), (e) => /réunit des habitants pour améliorer la vie du quartier/u.test(e.prompt))) {
      expect(exo.answerKey).toBe("Comité de quartier");
      expect(acceptedOf(exo)).toEqual(expect.arrayContaining(["Comité de quartier", "Comite de quartier", "Le comité de quartier", "Un comité de quartier", "Association de quartier"]));
      // Une association de parents ou de femmes ne répond pas à cette question.
      for (const other of ["Association de parents d'élèves", "Groupement de femmes", "Association sportive et culturelle"]) expect(acceptedOf(exo)).not.toContain(other);
    }
  });
});

describe("civique du CM2 : les institutions", () => {
  it("cm2-ins-ecrire : ce que font les députés se dit aussi faire, adopter les lois ou légiférer", () => {
    for (const exo of found(played("CM2", "cm2-ins-ecrire"), (e) => /Que font les députés/u.test(e.prompt))) {
      expect(exo.answerKey).toBe("Voter les lois");
      expect(acceptedOf(exo)).toEqual(expect.arrayContaining(["Voter les lois", "Faire les lois", "Adopter les lois", "Adopter des lois", "Légiférer"]));
      expect(acceptedOf(exo)).not.toContain("Rendre la justice");
    }
  });
});

describe("histoire du CM2 : le progrès et l'indépendance", () => {
  it("cm2-pro-ecrire : « éclairer les maisons et les rues » admet l'ampoule et la lampe, pas les questions qui les nomment", () => {
    const exos = played("CM2", "cm2-pro-ecrire");
    for (const exo of found(exos, (e) => /éclairer les maisons et les rues/u.test(e.prompt))) {
      expect(exo.answerKey).toBe("Électricité");
      expect(acceptedOf(exo)).toEqual(expect.arrayContaining(["Électricité", "L'électricité", "Ampoule", "L'ampoule", "La lampe", "Lampe"]));
    }
    // Quand l'énoncé écrit déjà « ampoule » ou « lampe », répondre ce mot ne répond à rien.
    for (const exo of found(exos, (e) => /briller une ampoule|allumer une lampe/u.test(e.prompt))) {
      expect(exo.answerKey).toBe("Électricité");
      const accepted = acceptedOf(exo).map((a) => a.toLowerCase());
      expect(accepted).not.toContain("ampoule");
      expect(accepted).not.toContain("lampe");
    }
  });

  it("cm2-ind-trou : l'indice du 4 avril ne parle ni de printemps ni de début de mois (le 1er mai y répond aussi)", () => {
    for (const exo of found(played("CM2", "cm2-ind-trou"), (e) => /fête son indépendance le ___|indépendance du Sénégal a lieu le ___/u.test(textOf(e)))) {
      expect(exo.hints[1]).not.toMatch(/printemps|début du mois/u);
      expect(exo.hints[1]).toBe("Cette fête tombe au quatrième mois de l'année.");
    }
  });
});
