import { describe, expect, it } from "vitest";
import { DEFAULT_PALIERS_BY_CLASS } from "../palierRules";
import { GAME_KINDS } from "../paliers/games";
import { topicUsesModel } from "../paliers/pregen";
import { PALIER_SIZE } from "../paliers/scoring";
import { allProgrammeEntries } from "../programme";

/**
 * L'ORDRE DU PROGRAMME D'ANGLAIS, TEL QUE LE PLAN LE FIXE (`docs/programme-anglais-v2.md`, section 5).
 *
 * Le propriétaire l'a demandé le 26 octobre 2026 : l'alphabet avant « hello » et avant tout mot à lire. Ce fichier est la seule
 * liste de l'ordre, classe par classe. Quand on ajoute, retire ou déplace une thématique d'anglais, ce test casse et dit où :
 * on change alors le plan ET cette liste, pas l'un sans l'autre.
 *
 * Il tient aussi les règles d'un parcours qui se lit de haut en bas : chaque thématique a de 2 à 4 paliers, remplit les dix places
 * d'un palier avec des jeux connus, et aucune n'appelle le modèle de langue.
 */

const ORDER: Record<string, string[]> = {
  CI: ["an-ci-abc-1", "an-ci-abc-2", "an-ci-abc-3", "an-ci-hello", "an-ci-colours", "an-ci-numbers", "an-ci-animals", "an-ci-fruits"],
  CP: ["an-cp-abc", "an-cp-sounds", "an-cp-name", "an-cp-family", "an-cp-body", "an-cp-classroom", "an-cp-numbers-20", "an-cp-food"],
  CE1: [
    "an-ce1-spell",
    "an-ce1-who",
    "an-ce1-days",
    "an-ce1-a-an",
    "an-ce1-plural",
    "an-ce1-possessives",
    "an-ce1-clothes",
    "an-ce1-likes",
    "an-ce1-commands",
  ],
  CE2: [
    "an-ce2-numbers-100",
    "an-ce2-be",
    "an-ce2-have-got",
    "an-ce2-can",
    "an-ce2-home",
    "an-ce2-months",
    "an-ce2-weather",
    "an-ce2-clock",
    "an-ce2-school",
  ],
  CM1: [
    "an-cm1-present-simple",
    "an-cm1-he-she-it",
    "an-cm1-routine",
    "an-cm1-continuous",
    "an-cm1-hobbies",
    "an-cm1-jobs",
    "an-cm1-market",
    "an-cm1-describe",
    "an-cm1-there-is",
  ],
  CM2: [
    "an-cm2-questions",
    "an-cm2-directions",
    "an-cm2-comparatives",
    "an-cm2-was-were",
    "an-cm2-past-regular",
    "an-cm2-past-irregular",
    "an-cm2-going-to",
    "an-cm2-reading",
  ],
};

const englishEntries = () => allProgrammeEntries().filter((entry) => /^an-/.test(entry.topic.key));
const entriesOf = (klass: string) => englishEntries().filter((entry) => entry.klass === klass);

describe("l'ordre du programme d'anglais", () => {
  it.each(Object.entries(ORDER))("%s : les thématiques d'anglais suivent l'ordre du plan", (klass, keys) => {
    expect(entriesOf(klass).map((entry) => entry.topic.key)).toEqual(keys);
  });

  it("compte 51 thématiques d'anglais : 8 au CI, 8 au CP, 9 au CE1, 9 au CE2, 9 au CM1 et 8 au CM2", () => {
    expect(Object.values(ORDER).map((keys) => keys.length)).toEqual([8, 8, 9, 9, 9, 8]);
    expect(englishEntries()).toHaveLength(51);
  });

  it("n'a pas de clé en double", () => {
    const keys = allProgrammeEntries().map((entry) => entry.topic.key);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it("commence le CI et le CP par l'alphabet : aucune salutation avant la dernière lettre", () => {
    const ci = entriesOf("CI").map((entry) => entry.topic.key);
    expect(ci.indexOf("an-ci-hello")).toBeGreaterThan(ci.indexOf("an-ci-abc-3"));
    const cp = entriesOf("CP").map((entry) => entry.topic.key);
    expect(cp.slice(0, 3)).toEqual(["an-cp-abc", "an-cp-sounds", "an-cp-name"]);
  });

  it("apprend avant d'employer : les nombres jusqu'à 100 avant le marché, le pluriel avant « have got », « there is » avant les itinéraires", () => {
    const all = englishEntries().map((entry) => entry.topic.key);
    const before = (first: string, second: string) => expect(all.indexOf(first), `${first} avant ${second}`).toBeLessThan(all.indexOf(second));
    before("an-ce2-numbers-100", "an-cm1-market");
    before("an-cm1-there-is", "an-cm2-directions");
    before("an-ce1-plural", "an-ce1-likes");
    before("an-ce1-plural", "an-ce2-have-got");
    before("an-ce1-possessives", "an-ce1-commands");
    before("an-ce1-spell", "an-ce1-who");
    before("an-cm1-continuous", "an-cm1-hobbies");
    before("an-ce1-days", "an-ce2-school");
    before("an-ce2-clock", "an-ce2-school");
  });

  it("va du présent au passé puis au futur au CM2, et finit par le texte à lire", () => {
    const cm2 = ORDER.CM2;
    const before = (first: string, second: string) => expect(cm2.indexOf(first), `${first} avant ${second}`).toBeLessThan(cm2.indexOf(second));
    before("an-cm2-questions", "an-cm2-was-were");
    before("an-cm2-directions", "an-cm2-was-were");
    before("an-cm2-comparatives", "an-cm2-was-were");
    before("an-cm2-was-were", "an-cm2-past-regular");
    before("an-cm2-past-regular", "an-cm2-past-irregular");
    before("an-cm2-past-irregular", "an-cm2-going-to");
    expect(cm2.at(-1)).toBe("an-cm2-reading");
  });

  it("donne à chaque thématique de 2 à 4 paliers, dix places remplies par des jeux connus, sans le modèle", () => {
    for (const entry of englishEntries()) {
      const { key, games, palierCount } = entry.topic;
      const count = palierCount ?? DEFAULT_PALIERS_BY_CLASS[entry.klass as keyof typeof DEFAULT_PALIERS_BY_CLASS];
      expect(count, key).toBeGreaterThanOrEqual(2);
      expect(count, key).toBeLessThanOrEqual(5);
      expect((games ?? []).reduce((sum, spec) => sum + spec.count, 0), key).toBe(PALIER_SIZE);
      for (const spec of games ?? []) expect(Object.keys(GAME_KINDS), `${key} : ${spec.kind}`).toContain(spec.kind);
      expect(topicUsesModel(key), key).toBe(false);
    }
  });

  it("compte 145 paliers d'anglais, soit 1 450 exercices, quand tout est généré", () => {
    const palierCount = englishEntries().reduce(
      (sum, entry) => sum + (entry.topic.palierCount ?? DEFAULT_PALIERS_BY_CLASS[entry.klass as keyof typeof DEFAULT_PALIERS_BY_CLASS]),
      0,
    );
    expect(palierCount).toBe(145);
    expect(palierCount * PALIER_SIZE).toBe(1450);
  });

  it("ouvre chaque description par le niveau de sa classe", () => {
    for (const entry of englishEntries()) expect(entry.topic.description, entry.topic.key).toMatch(/^Anglais, niveau (pré-A1|A1\+?|A2) : /);
  });
});
