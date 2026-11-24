// ---------------------------------------------------------------------------
// L'ÉCONOMIE DU JEU : combien de cauris rapporte quoi, et ce que donne un
// coffre. Module PUR, sans import Convex (comme `questRules.ts`) : testé seul,
// lu par le serveur (`economy.ts`) et par l'écran de fin de palier.
//
// LES CAURIS sont la monnaie du Monde de Pio. Ils se gagnent en jouant et ne
// s'achètent jamais avec de l'argent. Quatre sources :
//   - une fin de palier : un cauri par étoile, plus un bonus si le palier est
//     validé, dans la limite d'un plafond par jour (un enfant ne gagne rien de
//     plus à rejouer vingt fois le même palier) ;
//   - les missions du jour ;
//   - un trophée, selon sa rareté ;
//   - le coffre du jour, qui donne aussi une carte.
// Une seule dépense : le marché (`gameCatalog.SHOP_ITEMS`).
//
// Voir `docs/economie-du-jeu.md`.
// ---------------------------------------------------------------------------

import { rng, seedFrom } from "./questRules";
import type { CardRarity, GameCard } from "./gameCatalog";

/** Un cauri par étoile gagnée dans la tentative. */
export const CAURIS_PER_STAR = 1;
/** Le bonus d'un palier validé. */
export const PALIER_VALIDATED_BONUS = 5;
/** Ce que les paliers rapportent au plus dans une journée. */
export const DAILY_PALIER_CAP = 120;
/** Une mission du jour faite. */
export const CAURIS_PER_QUEST = 5;
/** Les trois missions faites : le bonus du jour. */
export const ALL_QUESTS_BONUS = 10;
/** Un trophée gagné, selon sa rareté (`badges.rarity`). */
export const BADGE_CAURIS: Record<string, number> = {
  common: 10,
  rare: 20,
  epic: 40,
  legendary: 80,
};
/** Le coffre du jour donne entre 15 et 35 cauris, par pas de 5. */
export const CHEST_CAURIS_MIN = 15;
export const CHEST_CAURIS_STEP = 5;
export const CHEST_CAURIS_STEPS = 5;
/** Une carte déjà dans l'album se change en cauris. */
export const DUPLICATE_CARD_CAURIS: Record<CardRarity, number> = {
  common: 10,
  rare: 20,
  epic: 40,
};
/** La part de chaque rareté dans un coffre (somme : 1). */
export const CHEST_RARITY_ODDS: readonly { rarity: CardRarity; share: number }[] = [
  { rarity: "common", share: 0.7 },
  { rarity: "rare", share: 0.25 },
  { rarity: "epic", share: 0.05 },
];
/** Le solde ne dépasse jamais cette borne (garde-fou, comme `QUEST_BONUS_CAP`). */
export const WALLET_CAP = 100_000;

function wholePositive(value: number): number {
  return Number.isFinite(value) ? Math.max(0, Math.floor(value)) : 0;
}

/** Ce qu'une tentative de palier rapporte, avant le plafond du jour. */
export function caurisForPalier(input: { stars: number; validated: boolean }): number {
  return wholePositive(input.stars) * CAURIS_PER_STAR + (input.validated ? PALIER_VALIDATED_BONUS : 0);
}

/** Ce que les missions du jour rapportent, pour `completed` missions sur `total`. */
export function caurisForQuests(completed: number, total: number): number {
  const done = Math.min(wholePositive(completed), wholePositive(total));
  const bonus = total > 0 && done >= total ? ALL_QUESTS_BONUS : 0;
  return done * CAURIS_PER_QUEST + bonus;
}

/** Ce qu'un trophée rapporte. Une rareté inconnue vaut un trophée commun. */
export function caurisForBadge(rarity: string | undefined): number {
  return BADGE_CAURIS[rarity ?? "common"] ?? BADGE_CAURIS.common;
}

/**
 * Ce qu'il reste à verser sous un plafond : `wanted`, rogné pour que
 * `already + versé` ne dépasse pas `cap`.
 */
export function capGain(already: number, wanted: number, cap: number): number {
  const room = Math.max(0, cap - wholePositive(already));
  return Math.min(wholePositive(wanted), room);
}

/**
 * Ce qu'il reste à verser pour qu'une source ait payé `target` en tout. Une
 * même fin de palier se note parfois deux fois (nouvelle chance) : on ne paie
 * que la différence, jamais deux fois la même étoile.
 */
export function owedGain(alreadyPaid: number, target: number): number {
  return Math.max(0, wholePositive(target) - wholePositive(alreadyPaid));
}

export type ChestRoll = {
  cauris: number;
  cardId: string;
  /** La carte est déjà dans l'album : elle se change en cauris. */
  duplicate: boolean;
  /** Les cauris versés à la place d'une carte en double (0 sinon). */
  duplicateCauris: number;
};

/**
 * LE COFFRE DU JOUR. Tirage reproductible : la même graine (élève + jour)
 * donne le même coffre, sur le serveur comme dans un test. Le coffre préfère
 * une carte que l'enfant n'a pas : dans la rareté tirée, il prend d'abord
 * parmi les cartes manquantes ; si l'enfant les a toutes, la carte est un
 * double et se change en cauris.
 */
export function rollChest(input: {
  seed: string;
  cards: readonly GameCard[];
  ownedCardIds: readonly string[];
}): ChestRoll {
  if (input.cards.length === 0) throw new Error("Aucune carte au catalogue");
  const random = rng(seedFrom(input.seed));
  const cauris = CHEST_CAURIS_MIN + CHEST_CAURIS_STEP * Math.floor(random() * CHEST_CAURIS_STEPS);

  const draw = random();
  let acc = 0;
  let rarity: CardRarity = CHEST_RARITY_ODDS[0].rarity;
  for (const odd of CHEST_RARITY_ODDS) {
    acc += odd.share;
    if (draw < acc) {
      rarity = odd.rarity;
      break;
    }
  }

  // Une rareté sans carte au catalogue retombe sur toutes les cartes.
  const ofRarity = input.cards.filter((card) => card.rarity === rarity);
  const pool = ofRarity.length > 0 ? ofRarity : input.cards;
  const owned = new Set(input.ownedCardIds);
  const missing = pool.filter((card) => !owned.has(card.id));
  const from = missing.length > 0 ? missing : pool;
  const card = from[Math.floor(random() * from.length)];
  const duplicate = owned.has(card.id);

  return {
    cauris,
    cardId: card.id,
    duplicate,
    duplicateCauris: duplicate ? DUPLICATE_CARD_CAURIS[card.rarity] : 0,
  };
}
