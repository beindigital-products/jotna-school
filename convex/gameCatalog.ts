// ---------------------------------------------------------------------------
// LE CATALOGUE DU JEU : les cartes à collectionner et les objets du marché.
//
// Module PUR, sans import Convex : le serveur le lit pour vendre un objet ou
// tirer une carte, l'écran le lit pour afficher l'album et le marché, et les
// tests le lisent pour vérifier que chaque entrée a son image. Un seul
// catalogue, fermé : une carte ou un objet qui n'y est pas n'existe pas.
//
// Les images vivent dans `public/images/cartes/<id>.webp` et
// `public/images/camp/<id>.webp` (`lib/game-assets.ts` en donne le chemin,
// `scripts/build-game-assets.mjs` les fabrique). Voir `docs/economie-du-jeu.md`.
//
// LES RARETÉS reprennent les clés des trophées (`badges.rarity`) : common,
// rare, epic. Les libellés français sont dans `lib/badges`.
// ---------------------------------------------------------------------------

export type CardRarity = "common" | "rare" | "epic";

export type CardSeries = {
  id: string;
  /** Le titre lu par l'enfant en haut de l'album. */
  title: string;
};

export type GameCard = {
  /** Identifiant stable, aussi le nom du fichier image. Ne jamais le changer. */
  id: string;
  seriesId: string;
  /** Le nom complet, avec son article (« la girafe »). */
  name: string;
  rarity: CardRarity;
  /** Le « savais-tu » : une phrase vraie, courte, à la portée d'un enfant. */
  fact: string;
};

export const CARD_SERIES: readonly CardSeries[] = [
  { id: "fleuve-savane", title: "Les animaux du fleuve et de la savane" },
];

export const CARDS: readonly GameCard[] = [
  {
    id: "girafe",
    seriesId: "fleuve-savane",
    name: "la girafe",
    rarity: "common",
    fact: "Son cou est si long qu'elle mange les feuilles tout en haut des acacias.",
  },
  {
    id: "pelican",
    seriesId: "fleuve-savane",
    name: "le pélican",
    rarity: "common",
    fact: "Sous son bec, une grande poche lui sert de filet pour pêcher.",
  },
  {
    id: "singe",
    seriesId: "fleuve-savane",
    name: "le singe rouge",
    rarity: "common",
    fact: "C'est un singe qui court très vite sur le sol de la savane.",
  },
  {
    id: "gazelle",
    seriesId: "fleuve-savane",
    name: "la gazelle",
    rarity: "common",
    fact: "Elle bondit très haut pour échapper au danger.",
  },
  {
    id: "phacochere",
    seriesId: "fleuve-savane",
    name: "le phacochère",
    rarity: "common",
    fact: "Il court la queue dressée, comme une petite antenne.",
  },
  {
    id: "tortue",
    seriesId: "fleuve-savane",
    name: "la tortue de mer",
    rarity: "rare",
    fact: "Elle pond ses œufs dans le sable de la plage.",
  },
  {
    id: "hippopotame",
    seriesId: "fleuve-savane",
    name: "l'hippopotame",
    rarity: "rare",
    fact: "Il passe ses journées dans l'eau pour rester au frais.",
  },
  {
    id: "flamant",
    seriesId: "fleuve-savane",
    name: "le flamant rose",
    rarity: "rare",
    fact: "Il devient rose grâce à ce qu'il mange.",
  },
  {
    id: "lamantin",
    seriesId: "fleuve-savane",
    name: "le lamantin",
    rarity: "epic",
    fact: "Ce gros nageur paisible broute les plantes de l'eau.",
  },
];

export function findCard(cardId: string): GameCard | undefined {
  return CARDS.find((card) => card.id === cardId);
}

// ---------------------------------------------------------------------------
// LE MARCHÉ DE PIO : des objets pour le camp, payés en cauris.
//
// Les cauris se gagnent en jouant (`economyRules.ts`) ; ils ne s'achètent
// jamais avec de l'argent. Un objet acheté se pose au camp, autour de Pio, à
// sa place (`spot`, en pourcentage du cadre de Pio : `x` est le centre de
// l'objet, `bottom` la hauteur de son pied au-dessus du sol, `width` sa
// largeur). Les objets du sol restent sous 30 %, ceux du ciel au-dessus de
// 75 % : entre les deux flottent le coffre du jour et les modules de l'école.
// Les tenues de Pio n'y sont pas encore : chaque tenue demande ses propres
// clips vidéo (`docs/pio-animations.md`).
// ---------------------------------------------------------------------------

export type ShopItem = {
  /** Identifiant stable, aussi le nom du fichier image. Ne jamais le changer. */
  id: string;
  name: string;
  /** Prix en cauris. */
  price: number;
  rarity: CardRarity;
  /** Ce que l'objet fait au camp, dit à l'enfant. */
  description: string;
  /** Où l'objet se pose autour de Pio (pourcentages du cadre de Pio). */
  spot: { x: number; bottom: number; width: number };
};

export const SHOP_ITEMS: readonly ShopItem[] = [
  {
    id: "cerf-volant",
    name: "Cerf-volant",
    price: 45,
    rarity: "common",
    description: "Il vole au-dessus du camp.",
    spot: { x: 88, bottom: 80, width: 15 },
  },
  {
    id: "djembe",
    name: "Djembé",
    price: 60,
    rarity: "common",
    description: "Un tambour posé près de Pio.",
    spot: { x: 9, bottom: 0, width: 16 },
  },
  {
    id: "tente",
    name: "Tente",
    price: 90,
    rarity: "rare",
    description: "Un abri pour les nuits au camp.",
    spot: { x: 87, bottom: 0, width: 25 },
  },
  {
    id: "longue-vue",
    name: "Longue-vue",
    price: 150,
    rarity: "rare",
    description: "Pour regarder les étoiles, la nuit.",
    spot: { x: 25, bottom: 2, width: 12 },
  },
];

export function findShopItem(itemId: string): ShopItem | undefined {
  return SHOP_ITEMS.find((item) => item.id === itemId);
}
