import { describe, it, expect } from "vitest";
import {
  ALL_QUESTS_BONUS,
  CAURIS_PER_QUEST,
  CHEST_CAURIS_MIN,
  CHEST_CAURIS_STEP,
  CHEST_CAURIS_STEPS,
  CHEST_RARITY_ODDS,
  DAILY_PALIER_CAP,
  DUPLICATE_CARD_CAURIS,
  PALIER_VALIDATED_BONUS,
  capGain,
  caurisForBadge,
  caurisForPalier,
  caurisForQuests,
  owedGain,
  rollChest,
} from "../economyRules";
import { CARDS, CARD_SERIES, SHOP_ITEMS, findCard, findShopItem } from "../gameCatalog";

describe("les cauris d'une fin de palier", () => {
  it("un cauri par étoile, plus le bonus du palier validé", () => {
    expect(caurisForPalier({ stars: 24, validated: true })).toBe(24 + PALIER_VALIDATED_BONUS);
    expect(caurisForPalier({ stars: 12, validated: false })).toBe(12);
  });

  it("ne descend jamais sous zéro et ignore une valeur cassée", () => {
    expect(caurisForPalier({ stars: -3, validated: false })).toBe(0);
    expect(caurisForPalier({ stars: Number.NaN, validated: false })).toBe(0);
    expect(caurisForPalier({ stars: 7.9, validated: false })).toBe(7);
  });
});

describe("les cauris des missions du jour", () => {
  it("paie chaque mission faite", () => {
    expect(caurisForQuests(0, 3)).toBe(0);
    expect(caurisForQuests(2, 3)).toBe(2 * CAURIS_PER_QUEST);
  });

  it("ajoute le bonus quand les trois sont faites", () => {
    expect(caurisForQuests(3, 3)).toBe(3 * CAURIS_PER_QUEST + ALL_QUESTS_BONUS);
  });

  it("ne paie pas plus de missions qu'il n'y en a", () => {
    expect(caurisForQuests(5, 3)).toBe(3 * CAURIS_PER_QUEST + ALL_QUESTS_BONUS);
    expect(caurisForQuests(1, 0)).toBe(0);
  });
});

describe("les cauris d'un trophée", () => {
  it("grandit avec la rareté", () => {
    expect(caurisForBadge("common")).toBeLessThan(caurisForBadge("rare"));
    expect(caurisForBadge("rare")).toBeLessThan(caurisForBadge("epic"));
    expect(caurisForBadge("epic")).toBeLessThan(caurisForBadge("legendary"));
  });

  it("une rareté absente ou inconnue vaut un trophée commun", () => {
    expect(caurisForBadge(undefined)).toBe(caurisForBadge("common"));
    expect(caurisForBadge("mythique")).toBe(caurisForBadge("common"));
  });
});

describe("le plafond du jour et le reste à verser", () => {
  it("rogne un gain qui dépasserait le plafond", () => {
    expect(capGain(100, 35, DAILY_PALIER_CAP)).toBe(20);
    expect(capGain(0, 35, DAILY_PALIER_CAP)).toBe(35);
  });

  it("ne verse plus rien une fois le plafond atteint", () => {
    expect(capGain(DAILY_PALIER_CAP, 10, DAILY_PALIER_CAP)).toBe(0);
    expect(capGain(DAILY_PALIER_CAP + 50, 10, DAILY_PALIER_CAP)).toBe(0);
  });

  it("ne paie que la différence quand une source est notée deux fois", () => {
    expect(owedGain(0, 29)).toBe(29);
    expect(owedGain(20, 29)).toBe(9);
    expect(owedGain(29, 29)).toBe(0);
    expect(owedGain(29, 12)).toBe(0);
  });
});

describe("le coffre du jour", () => {
  const maxCauris = CHEST_CAURIS_MIN + CHEST_CAURIS_STEP * (CHEST_CAURIS_STEPS - 1);

  it("la même graine donne le même coffre", () => {
    const a = rollChest({ seed: "eleve-1|2026-11-24", cards: CARDS, ownedCardIds: [] });
    const b = rollChest({ seed: "eleve-1|2026-11-24", cards: CARDS, ownedCardIds: [] });
    expect(a).toEqual(b);
  });

  it("donne des cauris dans la fourchette et une carte du catalogue", () => {
    for (let day = 1; day <= 60; day++) {
      const roll = rollChest({ seed: `eleve-2|jour-${day}`, cards: CARDS, ownedCardIds: [] });
      expect(roll.cauris).toBeGreaterThanOrEqual(CHEST_CAURIS_MIN);
      expect(roll.cauris).toBeLessThanOrEqual(maxCauris);
      expect(roll.cauris % CHEST_CAURIS_STEP).toBe(0);
      expect(findCard(roll.cardId)).toBeDefined();
      expect(roll.duplicate).toBe(false);
      expect(roll.duplicateCauris).toBe(0);
    }
  });

  it("préfère une carte que l'enfant n'a pas", () => {
    const commons = CARDS.filter((card) => card.rarity === "common");
    const allButOne = commons.slice(1).map((card) => card.id);
    for (let day = 1; day <= 200; day++) {
      const roll = rollChest({ seed: `eleve-3|jour-${day}`, cards: CARDS, ownedCardIds: allButOne });
      const card = findCard(roll.cardId)!;
      if (card.rarity === "common") {
        expect(roll.cardId).toBe(commons[0].id);
        expect(roll.duplicate).toBe(false);
      }
    }
  });

  it("change un double en cauris, selon sa rareté", () => {
    const everything = CARDS.map((card) => card.id);
    for (let day = 1; day <= 60; day++) {
      const roll = rollChest({ seed: `eleve-4|jour-${day}`, cards: CARDS, ownedCardIds: everything });
      expect(roll.duplicate).toBe(true);
      expect(roll.duplicateCauris).toBe(DUPLICATE_CARD_CAURIS[findCard(roll.cardId)!.rarity]);
    }
  });

  it("tire surtout des cartes communes, parfois une rare, rarement une épique", () => {
    const seen = { common: 0, rare: 0, epic: 0 };
    for (let day = 1; day <= 2000; day++) {
      const roll = rollChest({ seed: `eleve-5|jour-${day}`, cards: CARDS, ownedCardIds: [] });
      seen[findCard(roll.cardId)!.rarity]++;
    }
    expect(seen.common).toBeGreaterThan(seen.rare);
    expect(seen.rare).toBeGreaterThan(seen.epic);
    expect(seen.epic).toBeGreaterThan(0);
  });

  it("les parts de rareté font un tout", () => {
    const total = CHEST_RARITY_ODDS.reduce((sum, odd) => sum + odd.share, 0);
    expect(total).toBeCloseTo(1, 10);
  });

  it("refuse un catalogue vide", () => {
    expect(() => rollChest({ seed: "x", cards: [], ownedCardIds: [] })).toThrow();
  });
});

describe("le catalogue du jeu", () => {
  it("chaque carte a un identifiant unique et une série connue", () => {
    const ids = CARDS.map((card) => card.id);
    expect(new Set(ids).size).toBe(ids.length);
    const series = new Set(CARD_SERIES.map((s) => s.id));
    for (const card of CARDS) expect(series.has(card.seriesId)).toBe(true);
  });

  it("chaque rareté tirée par un coffre a au moins une carte", () => {
    for (const odd of CHEST_RARITY_ODDS) {
      expect(CARDS.some((card) => card.rarity === odd.rarity)).toBe(true);
    }
  });

  it("chaque objet du marché a un identifiant unique et un prix entier positif", () => {
    const ids = SHOP_ITEMS.map((item) => item.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const item of SHOP_ITEMS) {
      expect(Number.isInteger(item.price)).toBe(true);
      expect(item.price).toBeGreaterThan(0);
      expect(findShopItem(item.id)).toBe(item);
    }
  });

  it("chaque objet tient dans le cadre de Pio, au sol ou dans le ciel", () => {
    for (const item of SHOP_ITEMS) {
      expect(item.spot.x - item.spot.width / 2).toBeGreaterThanOrEqual(0);
      expect(item.spot.x + item.spot.width / 2).toBeLessThanOrEqual(100);
      // La bande du milieu est celle du coffre du jour et des modules.
      const onGround = item.spot.bottom >= 0 && item.spot.bottom <= 30;
      const inSky = item.spot.bottom >= 75 && item.spot.bottom <= 100;
      expect(onGround || inSky).toBe(true);
    }
  });

  it("le premier objet s'achète en une journée de jeu", () => {
    const cheapest = Math.min(...SHOP_ITEMS.map((item) => item.price));
    expect(cheapest).toBeLessThanOrEqual(DAILY_PALIER_CAP);
  });
});
