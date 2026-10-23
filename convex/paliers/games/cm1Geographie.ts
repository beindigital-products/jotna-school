/**
 * LES GABARITS DE LA GÉOGRAPHIE DU CM1 : la situation du Sénégal, les climats, le découpage administratif, les activités et les
 * voies de communication (`ge-cm1-situation`, `-climats`, `-decoupage`, `-economie`, `-communication`).
 *
 * Sur l'échantillon que le modèle écrivait, la géographie se trompait le plus : un pays voisin au mauvais point cardinal, une zone
 * de climat mal placée, un chef-lieu qui n'en est pas un. Ici chaque réponse se lit dans un tableau fermé, écrit à la main, qui ne dit
 * que ce que la fiche dit, plus des faits que personne ne discute (Dakar est la capitale, le Sénégal compte quatorze régions,
 * Taïba exploite des phosphates, Sabodala de l'or).
 *
 * LE TABLEAU, PUIS LES LIGNES : voir `cm1Faits.ts` (un fait, ses façons de le demander, sa phrase à trou, son indice). Les mauvais
 * choix d'un fait sont les réponses des autres faits de son lot et ses intrus ; une réponse aussi juste (`not`) n'est jamais proposée.
 *
 * CE QUE CE FICHIER N'INVENTE PAS : aucune distance, aucun chiffre de population, aucun nom de fleuve ou de ville que la fiche ne
 * nomme pas. La place d'un pays voisin ne se dit qu'avec les quatre points cardinaux ; la Guinée est « au sud-est », la
 * Guinée-Bissau « au sud », et chacune des deux ne se propose jamais comme mauvais choix de l'autre.
 *
 * MODULE PUR (voir `types.ts`).
 */
import { ce2Gap, ce2Link, ce2Order, ce2Question, ce2Sort, ce2Write, sortRows, type LinkRow, type OrderRow } from "./ce2Outils";
import { RANK_HINTS, SORT_HINTS, gapRows, link, order, questionRows, writeRows, type Pool } from "./cm1Faits";
import type { GameContext, GeneratedGame } from "./shared";

type Make = (ctx: GameContext) => GeneratedGame;

// ===========================================================================
// LE SÉNÉGAL EN AFRIQUE DE L'OUEST (ge-cm1-situation)
// ===========================================================================

const SIT_OCEAN: Pool = {
  items: [
    {
      id: "ocean",
      q: ["Quel océan borde le Sénégal à l'ouest ?", "Quel océan est situé à l'ouest du Sénégal ?", "Les plages du Sénégal sont baignées par quel océan ?"],
      a: "Océan Atlantique",
      also: ["Atlantique", "l'océan Atlantique"],
      ga: "Atlantique",
      s: ["Sur sa côte, le Sénégal est bordé par l'océan ___.", "Les pirogues des pêcheurs voguent sur l'océan ___."],
      hint: "C'est la vaste étendue d'eau que l'on traverse pour aller en Amérique.",
    },
  ],
  extras: ["Océan Indien", "Océan Pacifique"],
  gextras: ["Indien", "Pacifique"],
};

const SIT_SIDE: Pool = {
  items: [
    {
      id: "ouest",
      q: ["Dans quelle partie de l'Afrique se trouve le Sénégal ?", "Le Sénégal est un pays de quelle région du continent africain ?"],
      a: "À l'ouest",
      also: ["Ouest", "l'ouest"],
      ga: "ouest",
      s: ["Le Sénégal se situe dans la partie ___ de l'Afrique."],
      hint: "C'est du côté de l'océan, là où le soleil se couche.",
    },
  ],
  extras: ["À l'est", "Au sud"],
  gextras: ["est", "sud"],
};

const SIT_NEIGHBOURS: Pool = {
  items: [
    {
      id: "mauritanie",
      q: ["Quel pays voisin du Sénégal se trouve au nord ?", "Le Sénégal touche, au nord, quel pays ?"],
      a: "Mauritanie",
      s: ["Le pays voisin situé au nord du Sénégal se nomme ___."],
      hint: "Le fleuve Sénégal marque la frontière de ce pays désertique.",
    },
    {
      id: "mali",
      q: ["Quel pays voisin du Sénégal se trouve à l'est ?", "Le Sénégal touche, à l'est, quel pays ?"],
      a: "Mali",
      s: ["Le pays voisin situé à l'est du Sénégal se nomme ___."],
      hint: "Ce grand pays n'a pas de côte et touche l'est du Sénégal.",
    },
    {
      id: "guinee",
      q: ["Quel pays voisin se trouve au sud-est du Sénégal ?", "Le Sénégal touche, au sud-est, quel pays ?"],
      a: "Guinée",
      not: ["Guinée-Bissau"],
      s: ["Le pays voisin situé au sud-est du Sénégal se nomme ___."],
      hint: "Son nom est proche de celui d'un autre voisin, plus à l'ouest.",
    },
    {
      id: "guinee-bissau",
      q: ["Quel pays voisin se trouve au sud du Sénégal, au bord de l'océan ?", "Le Sénégal touche, au sud et sur la côte, quel pays ?"],
      a: "Guinée-Bissau",
      not: ["Guinée", "Gambie"],
      s: ["Le pays voisin situé au sud du Sénégal, sur la côte, se nomme ___."],
      hint: "C'est le petit pays collé à la Casamance, au bord de l'océan.",
    },
    {
      id: "gambie",
      q: ["Quel petit pays est enclavé dans le Sénégal ?", "Quel mince pays suit un fleuve en plein milieu du Sénégal ?"],
      a: "Gambie",
      not: ["Guinée-Bissau"],
      s: ["Le petit pays enclavé dans le Sénégal se nomme ___."],
      hint: "Ce mince pays suit un fleuve et le Sénégal l'entoure presque entièrement.",
    },
  ],
  extras: ["Côte d'Ivoire", "Maroc"],
};

const SIT_CAPE: Pool = {
  items: [
    {
      id: "cap-vert",
      q: ["Dans quelle presqu'île se trouve Dakar ?", "Sur quelle presqu'île est bâtie la capitale du Sénégal ?"],
      a: "Presqu'île du Cap-Vert",
      also: ["Cap-Vert", "Cap Vert"],
      ga: "Cap-Vert",
      s: ["Dakar est située dans la presqu'île du ___."],
      hint: "Elle avance dans l'océan, à l'ouest du pays.",
    },
  ],
  extras: ["Île de Gorée", "Delta du Saloum"],
  gextras: ["Saloum", "Sine"],
};

const SIT_RELIEF: Pool = {
  items: [
    {
      id: "relief",
      q: ["Comment est le relief du Sénégal ?", "Quel est le relief le plus répandu au Sénégal ?"],
      a: "Surtout plat",
      ga: "plat",
      s: ["Le relief du Sénégal est surtout ___.", "Au Sénégal, on voit de grandes étendues, car le relief est ___."],
      hint: "On y voit de grandes étendues, avec peu de hauteurs.",
    },
  ],
  extras: ["Très montagneux", "Couvert de volcans"],
  gextras: ["montagneux", "volcanique"],
};

const SIT_CAPITAL: Pool = {
  items: [
    {
      id: "dakar",
      q: ["Quelle est la capitale du Sénégal ?", "Dans quelle ville se trouve le gouvernement du Sénégal ?"],
      a: "Dakar",
      s: ["La capitale du Sénégal est ___.", "Le gouvernement du Sénégal siège à ___."],
      hint: "Elle est tout à l'ouest, au bout d'une presqu'île.",
    },
  ],
  extras: ["Saint-Louis", "Thiès", "Kaolack"],
};

const SIT_POOLS = [SIT_OCEAN, SIT_SIDE, SIT_NEIGHBOURS, SIT_CAPE, SIT_RELIEF, SIT_CAPITAL] as const;
const SIT_QCM = questionRows("ge-cm1-situation", SIT_POOLS);
const SIT_TROU = gapRows("ge-cm1-situation", SIT_POOLS);
const SIT_ECRIRE = writeRows("ge-cm1-situation", SIT_POOLS);

const SIT_RELIER: readonly LinkRow[] = [
  link("Relie chaque pays voisin à sa place.", [["Mauritanie", "Au nord"], ["Mali", "À l'est"], ["Guinée-Bissau", "Au sud"]]),
  link("Relie chaque pays à sa place ou à son trait.", [["Gambie", "Enclavée dans le pays"], ["Mauritanie", "Au nord"], ["Mali", "À l'est"], ["Guinée", "Au sud-est"]]),
  link("Relie chaque nom à sa description.", [["Dakar", "Capitale du Sénégal"], ["Cap-Vert", "Presqu'île de Dakar"], ["Atlantique", "Océan à l'ouest"]]),
  link("Relie chaque pays voisin à sa place.", [["Guinée", "Au sud-est"], ["Guinée-Bissau", "Au sud"], ["Gambie", "Enclavée dans le pays"]]),
  link("Relie chaque pays à ce qu'il est pour le Sénégal.", [["Mali", "Voisin de l'est"], ["Mauritanie", "Voisin du nord"], ["Gambie", "Pays enclavé"]]),
  link("Relie chaque mot à ce qu'il désigne.", [["Dakar", "Ville"], ["Atlantique", "Océan"], ["Mali", "Pays"]]),
];

const SIT_GLISSER = [
  ...sortRows("Glisse chaque nom dans la bonne case.", ["Pays voisin", "Pas un pays voisin"], ["Mali", "Mauritanie", "Guinée", "Gambie"], ["Maroc", "Côte d'Ivoire", "Algérie", "Niger"], SORT_HINTS, 4),
  ...sortRows("Glisse chaque nom dans la bonne case.", ["Pays", "Ville"], ["Mali", "Mauritanie", "Guinée", "Gambie"], ["Dakar", "Thiès", "Kaolack", "Saint-Louis"], SORT_HINTS, 4),
];

export const makeCm1SitQcm: Make = (ctx) => ce2Question(ctx, "cm1-sit-qcm", "la situation du Sénégal et ses voisins", SIT_QCM, 3);
export const makeCm1SitTrou: Make = (ctx) => ce2Gap(ctx, "cm1-sit-trou", "compléter une phrase sur la situation du Sénégal", SIT_TROU, 2, 1);
export const makeCm1SitEcrire: Make = (ctx) => ce2Write(ctx, "cm1-sit-ecrire", "écrire un fait sur la situation du Sénégal", SIT_ECRIRE, 2, 2);
export const makeCm1SitRelier: Make = (ctx) => ce2Link(ctx, "cm1-sit-relier", "relier un pays voisin à sa place", SIT_RELIER);
export const makeCm1SitGlisser: Make = (ctx) => ce2Sort(ctx, "cm1-sit-glisser", "distinguer les pays voisins des autres noms", SIT_GLISSER, 2);

// ===========================================================================
// CLIMATS ET VÉGÉTATION (ge-cm1-climats)
// ===========================================================================

const CLI_CLIMATE: Pool = {
  items: [
    {
      id: "sahelien",
      q: ["Quel climat trouve-t-on au nord du Sénégal ?", "Quel est le climat du nord du pays, où la saison des pluies est très courte ?"],
      a: "Sahélien",
      s: ["Au nord du Sénégal, le climat est ___."],
      hint: "Les pluies y sont rares et très courtes.",
    },
    {
      id: "soudanien",
      q: ["Quel climat trouve-t-on au centre du Sénégal ?", "Quel est le climat du centre du pays, entre le nord sec et le sud humide ?"],
      a: "Soudanien",
      s: ["Au centre du Sénégal, le climat est ___."],
      hint: "Les pluies y sont moyennes, entre celles du nord et du sud.",
    },
    {
      id: "guineen",
      q: ["Quel climat trouve-t-on au sud du Sénégal ?", "Quel est le climat du sud du pays, où les pluies sont les plus fortes ?"],
      a: "Guinéen",
      s: ["Au sud du Sénégal, le climat est ___."],
      hint: "Les pluies y sont les plus abondantes du pays.",
    },
  ],
  extras: ["Désertique", "Polaire"],
};

const CLI_ZONE: Pool = {
  items: [
    {
      id: "zone-nord",
      q: ["Dans quelle partie du pays le climat est-il sahélien ?", "Où se trouve la zone du climat sahélien ?"],
      a: "Au nord",
      ga: "nord",
      s: ["Le climat sahélien est celui du ___ du Sénégal."],
      hint: "C'est la partie la plus proche du désert.",
    },
    {
      id: "zone-centre",
      q: ["Dans quelle partie du pays le climat est-il soudanien ?", "Où se trouve la zone du climat soudanien ?"],
      a: "Au centre",
      ga: "centre",
      s: ["Le climat soudanien est celui du ___ du Sénégal."],
      hint: "C'est la partie du milieu.",
    },
    {
      id: "zone-sud",
      q: ["Dans quelle partie du pays le climat est-il guinéen ?", "Où se trouve la zone du climat guinéen ?"],
      a: "Au sud",
      ga: "sud",
      s: ["Le climat guinéen est celui du ___ du Sénégal."],
      hint: "C'est la partie où il pleut le plus.",
    },
  ],
};

const CLI_PLANTS: Pool = {
  items: [
    {
      id: "steppe",
      q: ["Quelle végétation de petites herbes et d'arbustes épineux trouve-t-on au nord ?", "Quelle végétation claire, faite de maigres herbes, couvre le nord du Sénégal ?"],
      a: "Steppe",
      also: ["steppe"],
      ga: "steppe",
      s: ["Au nord du Sénégal, la végétation est la ___."],
      hint: "Les herbes y sont courtes et les arbres très rares.",
    },
    {
      id: "savane",
      q: ["Quelle végétation d'herbes hautes et de quelques arbres trouve-t-on au centre ?", "Quelle végétation de hautes herbes avec quelques arbres couvre le centre du pays ?"],
      a: "Savane",
      also: ["savane"],
      ga: "savane",
      s: ["Au centre du Sénégal, la végétation est la ___."],
      hint: "On y voit de hautes herbes et des baobabs éloignés les uns des autres.",
    },
    {
      id: "foret",
      q: ["Quelle végétation de grands arbres serrés trouve-t-on au sud ?", "Quelle végétation couvre le sud, où les arbres sont hauts et proches les uns des autres ?"],
      a: "Forêt",
      also: ["forêt", "foret"],
      ga: "forêt",
      s: ["Au sud du Sénégal, la végétation est la ___."],
      hint: "Les arbres y sont hauts et donnent beaucoup d'ombre.",
    },
  ],
  extras: ["Toundra", "Prairie"],
  gextras: ["toundra", "prairie"],
};

const CLI_RAIN: Pool = {
  items: [
    {
      id: "pluie-sud",
      q: ["Où les pluies sont-elles les plus abondantes au Sénégal ?", "Quelle partie du pays reçoit le plus de pluie ?"],
      a: "Au sud",
      ga: "sud",
      s: ["Les pluies sont les plus abondantes dans le ___ du Sénégal."],
      hint: "C'est le côté le plus éloigné du désert.",
    },
    {
      id: "pluie-nord",
      q: ["Où les pluies sont-elles les plus rares au Sénégal ?", "Quelle partie du pays reçoit le moins de pluie ?"],
      a: "Au nord",
      ga: "nord",
      s: ["Les pluies sont les plus rares dans le ___ du Sénégal."],
      hint: "C'est le côté le plus proche du désert.",
    },
  ],
  extras: ["Au centre"],
  gextras: ["centre"],
};

const CLI_POOLS = [CLI_CLIMATE, CLI_ZONE, CLI_PLANTS, CLI_RAIN] as const;
const CLI_QCM = questionRows("ge-cm1-climats", CLI_POOLS);
const CLI_TROU = gapRows("ge-cm1-climats", CLI_POOLS);
const CLI_ECRIRE = writeRows("ge-cm1-climats", CLI_POOLS);

const CLI_ORDRE: readonly OrderRow[] = [
  order("Range ces végétations du nord au sud.", ["Steppe", "Savane", "Forêt"], "cli-ordre:vegetations", RANK_HINTS),
  order("Range ces climats du nord au sud.", ["Sahélien", "Soudanien", "Guinéen"], "cli-ordre:climats", RANK_HINTS),
  order("Range ces quantités de pluie de la plus faible à la plus forte.", ["Peu de pluie", "Pluies moyennes", "Beaucoup de pluie"], "cli-ordre:pluies", RANK_HINTS),
  order("Range ces parties du Sénégal de la plus sèche à la plus pluvieuse.", ["Nord du pays", "Centre du pays", "Sud du pays"], "cli-ordre:zones", RANK_HINTS),
  order("Range ces végétations de la moins boisée à la plus boisée.", ["Steppe", "Savane", "Forêt"], "cli-ordre:arbres", RANK_HINTS),
];

const CLI_RELIER: readonly LinkRow[] = [
  link("Relie chaque climat à sa végétation.", [["Sahélien", "Steppe"], ["Soudanien", "Savane"], ["Guinéen", "Forêt"]]),
  link("Relie chaque climat à sa zone.", [["Sahélien", "Au nord"], ["Soudanien", "Au centre"], ["Guinéen", "Au sud"]]),
  link("Relie chaque végétation à sa zone.", [["Steppe", "Au nord"], ["Savane", "Au centre"], ["Forêt", "Au sud"]]),
  link("Relie chaque zone à ses pluies.", [["Au nord", "Peu de pluie"], ["Au centre", "Pluies moyennes"], ["Au sud", "Beaucoup de pluie"]]),
  link("Relie chaque végétation à son paysage.", [["Steppe", "Herbes courtes"], ["Savane", "Hautes herbes et arbres espacés"], ["Forêt", "Grands arbres serrés"]]),
];

const CLI_GLISSER = [
  ...sortRows("Glisse chaque mot dans la bonne case.", ["Au nord", "Au sud"], ["Climat sahélien", "Steppe", "Peu de pluie"], ["Climat guinéen", "Forêt", "Beaucoup de pluie"], SORT_HINTS, 4),
  ...sortRows("Glisse chaque mot dans la bonne case.", ["Au centre", "Au nord"], ["Climat soudanien", "Savane", "Pluies moyennes"], ["Climat sahélien", "Steppe", "Peu de pluie"], SORT_HINTS, 4),
  ...sortRows("Glisse chaque mot dans la bonne case.", ["Au centre", "Au sud"], ["Climat soudanien", "Savane", "Pluies moyennes"], ["Climat guinéen", "Forêt", "Beaucoup de pluie"], SORT_HINTS, 4),
];

export const makeCm1CliQcm: Make = (ctx) => ce2Question(ctx, "cm1-cli-qcm", "les climats et la végétation du Sénégal", CLI_QCM, 3);
export const makeCm1CliTrou: Make = (ctx) => ce2Gap(ctx, "cm1-cli-trou", "compléter une phrase sur les climats", CLI_TROU, 2, 1);
export const makeCm1CliEcrire: Make = (ctx) => ce2Write(ctx, "cm1-cli-ecrire", "écrire un fait sur les climats", CLI_ECRIRE, 1, 2);
export const makeCm1CliOrdre: Make = (ctx) => ce2Order(ctx, "cm1-cli-ordre", "ranger les zones du nord au sud", CLI_ORDRE);
export const makeCm1CliRelier: Make = (ctx) => ce2Link(ctx, "cm1-cli-relier", "relier un climat à sa végétation ou à sa zone", CLI_RELIER);
export const makeCm1CliGlisser: Make = (ctx) => ce2Sort(ctx, "cm1-cli-glisser", "classer les climats et les végétations par zone", CLI_GLISSER, 2);

// ===========================================================================
// LE DÉCOUPAGE ADMINISTRATIF (ge-cm1-decoupage)
// ===========================================================================

const DEC_CHIEF: Pool = {
  items: [
    {
      id: "gouverneur",
      q: ["Qui dirige une région ?", "Quel nom porte le chef d'une région ?"],
      a: "Gouverneur",
      also: ["gouverneur"],
      ga: "gouverneur",
      s: ["Le chef d'une région est le ___."],
      hint: "Il dirige la plus vaste division du pays.",
    },
    {
      id: "prefet",
      q: ["Qui dirige un département ?", "Quel nom porte le chef d'un département ?"],
      a: "Préfet",
      also: ["préfet", "prefet"],
      ga: "préfet",
      s: ["Le chef d'un département est le ___."],
      hint: "Il dirige une division plus petite que la région, mais plus grande que l'arrondissement.",
    },
    {
      id: "sous-prefet",
      q: ["Qui dirige un arrondissement ?", "Quel nom porte le chef d'un arrondissement ?"],
      a: "Sous-préfet",
      also: ["sous-préfet", "sous-prefet"],
      ga: "sous-préfet",
      s: ["Le chef d'un arrondissement est le ___."],
      hint: "Il aide le chef de la division qui est juste au-dessus.",
    },
    {
      id: "maire",
      q: ["Qui dirige une commune ?", "Quel nom porte le chef d'une commune ?"],
      a: "Maire",
      also: ["maire"],
      ga: "maire",
      s: ["Le chef d'une commune est le ___."],
      hint: "Les habitants de la commune l'ont élu.",
    },
  ],
};

const DEC_UNIT: Pool = {
  items: [
    {
      id: "region",
      q: ["De quelle division administrative le gouverneur est-il le chef ?", "Quelle division est dirigée par un gouverneur ?"],
      a: "Région",
      also: ["région", "region"],
      ga: "la région",
      s: ["Un gouverneur dirige ce qu'on nomme ___."],
      hint: "C'est la plus vaste des divisions du pays.",
    },
    {
      id: "departement",
      q: ["De quelle division administrative le préfet est-il le chef ?", "Quelle division est dirigée par un préfet ?"],
      a: "Département",
      also: ["département", "departement"],
      ga: "le département",
      s: ["Un préfet dirige ce qu'on nomme ___."],
      hint: "Plusieurs de ces divisions forment une région.",
    },
    {
      id: "arrondissement",
      q: ["De quelle division administrative le sous-préfet est-il le chef ?", "Quelle division est dirigée par un sous-préfet ?"],
      a: "Arrondissement",
      also: ["arrondissement"],
      ga: "l'arrondissement",
      s: ["Un sous-préfet dirige ce qu'on nomme ___."],
      hint: "Plusieurs de ces divisions forment un département.",
    },
    {
      id: "commune",
      q: ["De quelle division administrative le maire est-il le chef ?", "Quelle division est dirigée par un maire ?"],
      a: "Commune",
      also: ["commune"],
      ga: "la commune",
      s: ["Un maire dirige ce qu'on nomme ___."],
      hint: "C'est la division la plus proche des habitants.",
    },
  ],
};

const DEC_CAPITAL: Pool = {
  items: [
    {
      id: "dakar",
      q: ["Quelle ville est la capitale du Sénégal ?", "Quelle ville est à la fois une région et la capitale du pays ?"],
      a: "Dakar",
      s: ["La capitale du Sénégal est ___.", "La région de ___ est aussi la capitale du pays."],
      hint: "Elle est tout à l'ouest, au bout d'une presqu'île.",
    },
  ],
  extras: ["Thiès", "Saint-Louis", "Kaolack"],
};

const DEC_NUMBER: Pool = {
  items: [
    {
      id: "quatorze",
      q: ["Combien de régions le Sénégal compte-t-il ?", "Le Sénégal est divisé en combien de régions ?"],
      a: "14",
      also: ["quatorze"],
      s: ["Le Sénégal est divisé en ___ régions.", "Dakar est l'une des ___ régions du Sénégal."],
      hint: "C'est un peu plus de dix.",
    },
  ],
  extras: ["8", "10", "12"],
};

const DEC_POOLS = [DEC_CHIEF, DEC_UNIT, DEC_CAPITAL, DEC_NUMBER] as const;
const DEC_QCM = questionRows("ge-cm1-decoupage", DEC_POOLS);
const DEC_TROU = gapRows("ge-cm1-decoupage", DEC_POOLS);
const DEC_ECRIRE = writeRows("ge-cm1-decoupage", DEC_POOLS);

const DEC_ORDRE: readonly OrderRow[] = [
  order("Range ces divisions de la plus vaste à la plus petite.", ["Région", "Département", "Arrondissement"], "dec-ordre:divisions", RANK_HINTS),
  order("Range ces chefs de celui qui dirige la plus vaste division à celui qui dirige la plus petite.", ["Gouverneur", "Préfet", "Sous-préfet"], "dec-ordre:chefs", RANK_HINTS),
  order("Range ces lieux du plus vaste au plus petit.", ["Sénégal", "Région", "Département"], "dec-ordre:lieux", RANK_HINTS),
  order("Range ces divisions de la plus petite à la plus vaste.", ["Arrondissement", "Département", "Région"], "dec-ordre:petit", RANK_HINTS),
  order("Range ces chefs de celui qui dirige la plus petite division à celui qui dirige la plus vaste.", ["Sous-préfet", "Préfet", "Gouverneur"], "dec-ordre:chefspetit", RANK_HINTS),
];

const DEC_RELIER: readonly LinkRow[] = [
  link("Relie chaque division à son chef.", [["Région", "Gouverneur"], ["Département", "Préfet"], ["Arrondissement", "Sous-préfet"]]),
  link("Relie chaque division à son chef.", [["Commune", "Maire"], ["Région", "Gouverneur"], ["Département", "Préfet"], ["Arrondissement", "Sous-préfet"]]),
  link("Relie chaque chef à sa division.", [["Gouverneur", "Région"], ["Préfet", "Département"], ["Maire", "Commune"]]),
  link("Relie chaque chef à sa division.", [["Sous-préfet", "Arrondissement"], ["Maire", "Commune"], ["Gouverneur", "Région"]]),
  link("Relie chaque mot à son sens.", [["Dakar", "Capitale du Sénégal"], ["Région", "La plus vaste division"], ["Commune", "Dirigée par un maire"]]),
];

const DEC_GLISSER = sortRows(
  "Glisse chaque mot dans la bonne case.",
  ["Divisions", "Chefs"],
  ["Région", "Département", "Arrondissement", "Commune"],
  ["Gouverneur", "Préfet", "Sous-préfet", "Maire"],
  SORT_HINTS,
  6,
);

export const makeCm1DecQcm: Make = (ctx) => ce2Question(ctx, "cm1-dec-qcm", "le découpage administratif et ses chefs", DEC_QCM, 3);
export const makeCm1DecTrou: Make = (ctx) => ce2Gap(ctx, "cm1-dec-trou", "compléter une phrase sur le découpage administratif", DEC_TROU, 2, 1);
export const makeCm1DecEcrire: Make = (ctx) => ce2Write(ctx, "cm1-dec-ecrire", "écrire un fait sur le découpage administratif", DEC_ECRIRE, 2, 2);
export const makeCm1DecOrdre: Make = (ctx) => ce2Order(ctx, "cm1-dec-ordre", "ranger les divisions du pays et leurs chefs", DEC_ORDRE);
export const makeCm1DecRelier: Make = (ctx) => ce2Link(ctx, "cm1-dec-relier", "relier une division à son chef", DEC_RELIER);
export const makeCm1DecGlisser: Make = (ctx) => ce2Sort(ctx, "cm1-dec-glisser", "distinguer les divisions et leurs chefs", DEC_GLISSER, 1);

// ===========================================================================
// RESSOURCES ET ACTIVITÉS ÉCONOMIQUES (ge-cm1-economie)
// ===========================================================================

const ECO_ACTIVITY: Pool = {
  items: [
    {
      id: "agriculture",
      q: ["Quelle activité cultive l'arachide, le mil et le riz ?", "Quelle activité fait pousser les plantes dont les hommes se nourrissent ?"],
      a: "Agriculture",
      also: ["agriculture"],
      ga: "l'agriculture",
      s: ["Cultiver le mil et le riz, c'est ___."],
      hint: "On travaille la terre, on sème et on récolte.",
    },
    {
      id: "elevage",
      q: ["Quelle activité s'occupe des bœufs, des moutons et des chèvres du Ferlo ?", "Quelle activité produit la viande et le lait des troupeaux ?"],
      a: "Élevage",
      also: ["élevage", "elevage"],
      ga: "l'élevage",
      s: ["Soigner des troupeaux de bœufs, c'est ___."],
      hint: "On garde des bêtes et on les mène paître.",
    },
    {
      id: "peche",
      q: ["Quelle activité prend du poisson en mer et sur le fleuve ?", "Quelle activité emploie des pirogues et des filets ?"],
      a: "Pêche",
      also: ["pêche", "peche"],
      ga: "la pêche",
      s: ["Prendre du poisson avec une pirogue, c'est ___."],
      hint: "On travaille sur l'eau et on ramène des poissons.",
    },
    {
      id: "mines",
      q: ["Quelle activité sort les phosphates et l'or du sol ?", "Quelle activité creuse la terre pour en tirer des minerais ?"],
      a: "Mines",
      also: ["mines", "mine"],
      ga: "les mines",
      s: ["Creuser le sol pour sortir des minerais, c'est ___."],
      hint: "On creuse le sol pour en tirer des richesses cachées.",
    },
    {
      id: "industrie",
      q: ["Quelle activité transforme les produits dans des usines ?", "Quelle activité fabrique de l'huile, du ciment ou des conserves avec des machines ?"],
      a: "Industrie",
      also: ["industrie"],
      ga: "l'industrie",
      s: ["Transformer des produits dans une usine, c'est ___."],
      hint: "Les machines travaillent à la chaîne.",
    },
    {
      id: "commerce",
      q: ["Quelle activité achète et vend des produits ?", "Quelle activité fait circuler les marchandises du producteur au client ?"],
      a: "Commerce",
      also: ["commerce"],
      ga: "le commerce",
      s: ["Acheter et vendre des produits, c'est ___."],
      hint: "On échange des marchandises contre de l'argent.",
    },
    {
      id: "artisanat",
      q: ["Quelle activité fabrique à la main des objets comme des poteries ou des bijoux ?", "Quelle activité de fabrication à la main fait vivre le tisserand ou le forgeron ?"],
      a: "Artisanat",
      also: ["artisanat"],
      ga: "l'artisanat",
      s: ["Fabriquer des objets à la main, c'est ___."],
      hint: "Chaque objet est fait avec soin, un par un.",
    },
  ],
};

const ECO_RESOURCE: Pool = {
  items: [
    {
      id: "phosphates",
      q: ["Quelle ressource des mines est exploitée à Taïba, dans la région de Thiès ?", "Quelle ressource, utile comme engrais, sort du sol de Taïba ?"],
      a: "Phosphates",
      also: ["phosphates", "phosphate"],
      ga: "des phosphates",
      s: ["À Taïba, on extrait ___ du sol."],
      hint: "On les broie pour en faire un engrais.",
    },
    {
      id: "or",
      q: ["Quelle ressource précieuse est extraite à Sabodala, dans la région de Kédougou ?", "Quel métal jaune et précieux sort du sol de Sabodala ?"],
      a: "Or",
      also: ["or"],
      ga: "de l'or",
      s: ["À Sabodala, on extrait ___ du sol."],
      hint: "C'est un métal jaune très précieux.",
    },
  ],
  extras: ["Charbon", "Diamant"],
  gextras: ["du charbon", "des diamants"],
};

const ECO_REGION: Pool = {
  items: [
    {
      id: "thies",
      q: ["Dans quelle région exploite-t-on les phosphates de Taïba ?"],
      a: "Thiès",
      s: ["Les phosphates de Taïba sont exploités dans la région de ___."],
      hint: "Cette région est proche de la capitale, vers l'est.",
    },
    {
      id: "kedougou",
      q: ["Dans quelle région exploite-t-on l'or de Sabodala ?"],
      a: "Kédougou",
      also: ["Kedougou"],
      s: ["L'or de Sabodala est exploité dans la région de ___."],
      hint: "Cette région est tout à l'est, loin de la côte.",
    },
  ],
  extras: ["Louga", "Ziguinchor", "Saint-Louis"],
};

const ECO_POOLS = [ECO_ACTIVITY, ECO_RESOURCE, ECO_REGION] as const;
const ECO_QCM = questionRows("ge-cm1-economie", ECO_POOLS);
const ECO_TROU = gapRows("ge-cm1-economie", ECO_POOLS);
const ECO_ECRIRE = writeRows("ge-cm1-economie", ECO_POOLS);

const ECO_ORDRE: readonly OrderRow[] = [
  order("Range les étapes de la culture du mil du premier au dernier geste.", ["Préparer le champ", "Semer le mil", "Récolter le mil", "Vendre le mil au marché"], "eco-ordre:mil", RANK_HINTS),
  order("Range les gestes du pêcheur du premier au dernier.", ["Jeter le filet", "Remonter le filet", "Trier le poisson", "Vendre le poisson"], "eco-ordre:pecheur", RANK_HINTS),
  order("Range les étapes de la mine du premier au dernier geste.", ["Creuser la mine", "Extraire les phosphates", "Charger les camions", "Embarquer au port"], "eco-ordre:mine", RANK_HINTS),
  order("Range les étapes de la fabrication de l'huile du premier au dernier geste.", ["Récolter l'arachide", "Presser les graines", "Remplir les bidons", "Vendre l'huile"], "eco-ordre:huile", RANK_HINTS),
  order("Range les gestes de l'éleveur du premier au dernier.", ["Traire les vaches", "Verser le lait dans un bidon", "Porter le lait au marché", "Vendre le lait"], "eco-ordre:eleveur", RANK_HINTS),
];

const ECO_RELIER: readonly LinkRow[] = [
  link("Relie chaque activité à ce qu'elle produit.", [["Agriculture", "Mil"], ["Pêche", "Poisson"], ["Élevage", "Lait"], ["Mines", "Phosphates"]]),
  link("Relie chaque activité à ce qu'on y utilise.", [["Pêche", "Pirogue"], ["Agriculture", "Daba"], ["Industrie", "Usine"]]),
  link("Relie chaque ressource à son lieu.", [["Phosphates", "Taïba"], ["Or", "Sabodala"], ["Pêche", "Littoral"]]),
  link("Relie chaque activité à son métier.", [["Agriculture", "Cultivateur"], ["Pêche", "Pêcheur"], ["Élevage", "Éleveur"], ["Artisanat", "Forgeron"]]),
  link("Relie chaque activité à son lieu.", [["Industrie", "Usine"], ["Commerce", "Marché"], ["Mines", "Sous-sol"]]),
];

const ECO_GLISSER = [
  ...sortRows("Glisse chaque mot dans la bonne case.", ["Agriculture", "Pêche"], ["Mil", "Arachide", "Riz", "Maïs"], ["Poisson", "Pirogue", "Filet", "Sardinelle"], SORT_HINTS, 4),
  ...sortRows("Glisse chaque mot dans la bonne case.", ["Élevage", "Mines"], ["Bœufs", "Moutons", "Chèvres", "Troupeau"], ["Phosphates", "Or", "Taïba", "Sabodala"], SORT_HINTS, 4),
  ...sortRows("Glisse chaque mot dans la bonne case.", ["Industrie", "Artisanat"], ["Usine d'huile", "Usine de ciment", "Usine de conserves", "Machine"], ["Poterie", "Bijoux", "Tissage", "Sculpture"], SORT_HINTS, 4),
];

export const makeCm1EcoQcm: Make = (ctx) => ce2Question(ctx, "cm1-eco-qcm", "les activités et les ressources du Sénégal", ECO_QCM, 3);
export const makeCm1EcoTrou: Make = (ctx) => ce2Gap(ctx, "cm1-eco-trou", "compléter une phrase sur les activités économiques", ECO_TROU, 2, 1);
export const makeCm1EcoEcrire: Make = (ctx) => ce2Write(ctx, "cm1-eco-ecrire", "écrire un fait sur les activités économiques", ECO_ECRIRE, 1, 2);
export const makeCm1EcoOrdre: Make = (ctx) => ce2Order(ctx, "cm1-eco-ordre", "ranger les étapes d'une activité économique", ECO_ORDRE);
export const makeCm1EcoRelier: Make = (ctx) => ce2Link(ctx, "cm1-eco-relier", "relier une activité à ce qu'elle produit", ECO_RELIER);
export const makeCm1EcoGlisser: Make = (ctx) => ce2Sort(ctx, "cm1-eco-glisser", "classer des produits et des outils par activité", ECO_GLISSER, 2);

// ===========================================================================
// LES VOIES DE COMMUNICATION (ge-cm1-communication)
// ===========================================================================

const COM_ROAD: Pool = {
  items: [
    {
      id: "autoroute",
      q: ["Quelle route large et rapide, à péage, relie Dakar à Diamniadio ?", "Comment appelle-t-on une route à plusieurs voies, réservée aux véhicules rapides ?"],
      a: "Autoroute",
      also: ["autoroute", "autoroute à péage"],
      ga: "autoroute",
      s: ["Entre Dakar et Diamniadio, on peut rouler sur une ___ à péage.", "Pour aller vite de Dakar vers l'aéroport, on peut prendre une ___ à péage."],
      hint: "Les voitures y roulent vite et on paie pour l'utiliser.",
    },
  ],
  extras: ["Piste", "Sentier"],
  gextras: ["piste", "route de terre"],
};

const COM_RAIL: Pool = {
  items: [
    {
      id: "chemin-de-fer",
      q: ["Sur quelle voie roulent les trains ?", "Comment appelle-t-on la voie faite de rails où roulent les trains ?"],
      a: "Le chemin de fer",
      also: ["chemin de fer"],
      ga: "chemin de fer",
      s: ["Les trains roulent sur le ___.", "Les rails du ___ guident les roues des trains."],
      hint: "Deux barres de métal parallèles guident les roues.",
    },
    {
      id: "ter",
      q: ["Quel train express moderne relie Dakar à Diamniadio ?", "Comment s'appelle le train express régional de Dakar ?"],
      a: "TER",
      also: ["TER", "ter"],
      ga: "TER",
      s: ["Le train express régional de Dakar s'appelle le ___.", "Le ___ est le train express régional de la capitale et de sa banlieue."],
      hint: "Ses trois lettres veulent dire train express régional.",
    },
  ],
  extras: ["Le car rapide"],
  gextras: ["car rapide"],
};

const COM_PORT: Pool = {
  items: [
    {
      id: "port",
      q: ["Où les gros navires déchargent-ils leurs marchandises à Dakar ?", "Quel grand équipement de Dakar accueille les bateaux de commerce ?"],
      a: "Port",
      also: ["port", "port de Dakar"],
      ga: "port",
      s: ["Les navires déchargent leurs marchandises dans le ___ de Dakar.", "Les bateaux de commerce accostent dans le ___ de Dakar."],
      hint: "Les grues y soulèvent des conteneurs au bord de l'eau.",
    },
  ],
  extras: ["Gare", "Marché"],
  gextras: ["marché", "stade"],
};

const COM_AIRPORT: Pool = {
  items: [
    {
      id: "aeroport",
      q: ["Quel est le nom de l'aéroport international du Sénégal, près de Diass ?", "Où atterrissent les avions venus du monde entier au Sénégal ?"],
      a: "Aéroport Blaise-Diagne",
      also: ["Blaise-Diagne", "Blaise Diagne", "aéroport international Blaise-Diagne"],
      ga: "Diagne",
      s: ["Le grand aéroport international du Sénégal porte le nom de Blaise ___.", "À Diass, l'aéroport international porte le nom de Blaise ___."],
      hint: "Il se trouve loin du centre de la capitale, à Diass.",
    },
  ],
  extras: ["Aéroport de Gorée", "Aéroport du Ferlo"],
  gextras: ["Senghor", "Diouf"],
};

const COM_MEDIA: Pool = {
  items: [
    {
      id: "radio",
      q: ["Quel moyen de communication fait entendre les nouvelles sans montrer d'images ?", "Quel moyen de communication diffuse des voix et de la musique, mais aucune image ?"],
      a: "Radio",
      also: ["radio"],
      ga: "la radio",
      s: ["Pour écouter les nouvelles sans images, on utilise ___.", "Pour entendre la voix d'un journaliste sans image, on écoute ___."],
      hint: "On l'écoute avec des oreilles, souvent en cuisinant.",
    },
    {
      id: "television",
      q: ["Quel moyen de communication montre des images et des sons sur un écran ?", "Quel moyen de communication permet de regarder un journal à la maison ?"],
      a: "Télévision",
      also: ["télévision", "television", "télé"],
      ga: "la télévision",
      s: ["Pour regarder des images et des sons sur un écran, on utilise ___.", "Pour voir un journal avec des images, on regarde ___."],
      not: ["Internet"],
      hint: "Un poste posé dans le salon affiche des images animées.",
    },
    {
      id: "telephone",
      q: ["Quel moyen de communication permet de parler à quelqu'un qui est loin ?", "Quel moyen de communication permet de téléphoner à un proche ?"],
      a: "Téléphone",
      also: ["téléphone", "telephone"],
      ga: "le téléphone",
      s: ["Pour parler à quelqu'un qui est loin, on utilise ___.", "Pour appeler un ami qui habite loin, on utilise ___."],
      not: ["Internet"],
      hint: "On le tient près de l'oreille pour entendre l'autre.",
    },
    {
      id: "internet",
      q: ["Quel réseau mondial permet de chercher des informations et d'envoyer des messages ?", "Quel réseau relie les ordinateurs du monde entier ?"],
      a: "Internet",
      also: ["internet"],
      ga: "le réseau Internet",
      s: ["Pour chercher une information dans le monde entier, on utilise ___.", "Pour envoyer un message dans le monde entier, on utilise ___."],
      hint: "C'est une toile mondiale qui relie les machines.",
    },
  ],
};

const COM_POOLS = [COM_ROAD, COM_RAIL, COM_PORT, COM_AIRPORT, COM_MEDIA] as const;
const COM_QCM = questionRows("ge-cm1-communication", COM_POOLS);
const COM_TROU = gapRows("ge-cm1-communication", COM_POOLS);
const COM_ECRIRE = writeRows("ge-cm1-communication", COM_POOLS);

const COM_ORDRE: readonly OrderRow[] = [
  order("Range ces déplacements du plus lent au plus rapide.", ["À pied", "À vélo", "En voiture", "En avion"], "com-ordre:deplacements", RANK_HINTS),
  order("Range ces moyens de transport du plus lent au plus rapide.", ["Charrette", "Voiture", "Avion"], "com-ordre:transports", RANK_HINTS),
  order("Range ces bateaux du plus lent au plus rapide.", ["Pirogue à rames", "Bateau à moteur", "Avion"], "com-ordre:bateaux", RANK_HINTS),
  order("Range ces moyens d'envoyer un message du plus lent au plus rapide.", ["Lettre", "Téléphone", "Internet"], "com-ordre:messages", RANK_HINTS),
  order("Range ces façons d'avancer du plus lent au plus rapide.", ["Marcher", "Courir", "Rouler en voiture"], "com-ordre:avancer", RANK_HINTS),
];

const COM_RELIER: readonly LinkRow[] = [
  link("Relie chaque moyen de transport à son lieu.", [["Bateau", "Port"], ["Avion", "Aéroport"], ["Train", "Gare"], ["Voiture", "Route"]]),
  link("Relie chaque moyen de communication à ce qu'il fait.", [["Radio", "Fait entendre"], ["Télévision", "Fait voir"], ["Téléphone", "Fait parler"]]),
  link("Relie chaque mot à son sens.", [["Autoroute", "Route à péage"], ["TER", "Train express régional"], ["Port", "Lieu des navires"]]),
  link("Relie chaque lieu à ce qu'on y trouve.", [["Aéroport", "Avions"], ["Port", "Navires"], ["Gare", "Trains"]]),
  link("Relie chaque voie à son véhicule.", [["Rails", "Train"], ["Mer", "Navire"], ["Piste d'envol", "Avion"], ["Autoroute", "Voiture"]]),
];

const COM_GLISSER = [
  ...sortRows("Glisse chaque mot dans la bonne case.", ["Transport", "Communication"], ["Autoroute", "Port", "Aéroport", "TER"], ["Radio", "Télévision", "Téléphone", "Internet"], SORT_HINTS, 4),
  ...sortRows("Glisse chaque mot dans la bonne case.", ["Sur la terre ferme", "Sur l'eau ou dans l'air"], ["Autoroute", "TER", "Train", "Camion"], ["Avion", "Bateau", "Pirogue", "Hélicoptère"], SORT_HINTS, 4),
];

export const makeCm1ComQcm: Make = (ctx) => ce2Question(ctx, "cm1-com-qcm", "les voies de transport et les moyens de communication", COM_QCM, 3);
export const makeCm1ComTrou: Make = (ctx) => ce2Gap(ctx, "cm1-com-trou", "compléter une phrase sur les voies de communication", COM_TROU, 2, 1);
export const makeCm1ComEcrire: Make = (ctx) => ce2Write(ctx, "cm1-com-ecrire", "écrire un fait sur les voies de communication", COM_ECRIRE, 1, 2);
export const makeCm1ComOrdre: Make = (ctx) => ce2Order(ctx, "cm1-com-ordre", "ranger des moyens de transport du plus lent au plus rapide", COM_ORDRE);
export const makeCm1ComRelier: Make = (ctx) => ce2Link(ctx, "cm1-com-relier", "relier un moyen de transport à son lieu", COM_RELIER);
export const makeCm1ComGlisser: Make = (ctx) => ce2Sort(ctx, "cm1-com-glisser", "distinguer transport et communication", COM_GLISSER, 2);
