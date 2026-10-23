/**
 * LES GABARITS DES SCIENCES DU CM1 : la digestion, la respiration, le cœur et le sang, les phénomènes physiques et chimiques, les
 * objets techniques, l'hygiène du milieu (`sc-cm1-digestion`, `-respiration`, `-circulation`, `-phenomenes`, `-objets`, `-hygiene`).
 *
 * Sur l'échantillon que le modèle écrivait, les sciences se trompaient sur le corps humain (un organe sur le mauvais trajet, une
 * artère pour une veine) et sur les états de l'eau (la fusion pour l'évaporation). Ici chaque réponse se lit dans un tableau fermé,
 * écrit à la main, qui ne dit que ce que la fiche dit, plus des faits de cours que personne ne discute (l'œsophage relie la bouche à
 * l'estomac, les veines ramènent le sang au cœur, la glace qui chauffe fond).
 *
 * LE TABLEAU, PUIS LES LIGNES : voir `cm1Faits.ts` (un fait, ses façons de le demander, sa phrase à trou, son indice). Les mauvais
 * choix d'un fait sont les réponses des autres faits de son lot et ses intrus ; une réponse aussi juste (`not`) n'est jamais proposée.
 *
 * CE QUE CE FICHIER N'INVENTE PAS : aucun chiffre (pas de nombre de battements, de litres, de degrés), aucun nom savant que la fiche
 * ne donne pas. Les suites (trajet de l'air, voyage du sang, étapes d'un geste) ne rangent que des étapes dont l'ordre ne se discute pas.
 *
 * MODULE PUR (voir `types.ts`).
 */
import { ce2Gap, ce2Link, ce2Order, ce2Question, ce2Sort, ce2Write, sortRows, type LinkRow, type OrderRow } from "./ce2Outils";
import { RANK_HINTS, SORT_HINTS, gapRows, link, order, questionRows, writeRows, type Pool } from "./cm1Faits";
import type { GameContext, GeneratedGame } from "./shared";

type Make = (ctx: GameContext) => GeneratedGame;

// ===========================================================================
// LA DIGESTION (sc-cm1-digestion)
// ===========================================================================

const DIG_ORGANS: Pool = {
  items: [
    {
      id: "bouche",
      q: ["Quel organe reçoit les aliments, où les dents les broient ?", "Où commence la digestion, avec les dents et la salive ?", "Par quel organe les aliments entrent-ils dans le corps ?"],
      a: "Bouche",
      s: ["Les aliments entrent dans le corps par ___, où les dents les broient.", "La digestion commence dans ___ avec la salive."],
      ga: "la bouche",
      hint: "On y mâche, avec la langue et les dents.",
    },
    {
      id: "oesophage",
      q: ["Quel tube relie la bouche à l'estomac ?", "Par quel tube les aliments descendent-ils après la bouche ?", "Comment s'appelle le tube qui fait descendre les aliments avalés ?"],
      a: "Œsophage",
      also: ["Oesophage"],
      s: ["Après la bouche, les aliments descendent par ___ vers l'estomac.", "Les aliments avalés glissent dans ___ pour rejoindre l'estomac."],
      ga: "l'œsophage",
      hint: "C'est un tube étroit qui traverse le cou et la poitrine.",
    },
    {
      id: "estomac",
      q: ["Dans quel organe en forme de poche les aliments sont-ils brassés avec des sucs ?", "Quel organe brasse les aliments avec des sucs, comme une poche musclée ?", "Quel organe se trouve entre le tube de la gorge et les intestins ?"],
      a: "Estomac",
      s: ["Les aliments sont brassés avec des sucs dans ___ en forme de poche.", "Après le tube de la gorge, les aliments arrivent dans ___."],
      ga: "l'estomac",
      hint: "Cette poche musclée se trouve sous les côtes, à gauche.",
    },
    {
      id: "intestins",
      q: ["Dans quels organes longs et enroulés les aliments sont-ils absorbés ?", "Où les nutriments passent-ils dans le sang après l'estomac ?", "Quels organes longs et enroulés finissent le trajet des aliments ?"],
      a: "Intestins",
      s: ["Les nutriments passent dans le sang à travers ___.", "Après l'estomac, les aliments continuent leur trajet dans ___."],
      ga: "les intestins",
      hint: "Ce sont de longs tubes enroulés dans le ventre.",
    },
  ],
  extras: ["Cœur", "Poumons"],
  gextras: ["le cœur", "les poumons"],
};

const DIG_HABITS: Pool = {
  items: [
    {
      id: "macher",
      q: ["Que faut-il faire des aliments dans la bouche avant d'avaler ?", "Comment aide-t-on son estomac avant d'avaler ?"],
      a: "Bien mâcher",
      not: ["Se brosser les dents"],
      s: ["Avant d'avaler, il faut ___ les aliments.", "Pour aider l'estomac, on doit ___ longuement."],
      ga: "bien mâcher",
      hint: "Les dents travaillent, sans se presser.",
    },
    {
      id: "dents",
      q: ["Que faut-il faire après les repas pour garder des dents saines ?", "Quel geste protège les dents et la bouche chaque jour ?"],
      a: "Se brosser les dents",
      not: ["Bien mâcher"],
      s: ["Pour protéger sa bouche, on doit ___ après les repas.", "Chaque jour, on doit ___ pour garder une bouche saine."],
      ga: "se brosser les dents",
      hint: "Il faut une brosse et un peu de pâte.",
    },
  ],
  extras: ["Avaler tout rond", "Sauter les repas", "Boire de l'eau sale"],
  gextras: ["avaler tout rond", "sauter les repas", "boire de l'eau sale"],
};

const DIG_LIQUID: Pool = {
  items: [
    {
      id: "salive",
      q: ["Quel liquide de la bouche mouille les aliments ?", "Quel liquide produit la bouche pour aider à avaler ?"],
      a: "Salive",
      s: ["Dans la bouche, ___ mouille les aliments.", "Pour aider à avaler, la bouche fabrique ___."],
      ga: "la salive",
      hint: "On en a plein la bouche devant un plat qui sent bon.",
    },
  ],
  extras: ["Sueur", "Larme"],
  gextras: ["la sueur", "une larme"],
};

const DIG_MOUTH: Pool = {
  items: [
    {
      id: "dents-organe",
      q: ["Quels organes durs de la bouche broient les aliments ?", "Avec quoi la bouche coupe-t-elle et écrase-t-elle les aliments ?"],
      a: "Dents",
      s: ["Dans la bouche, les aliments sont broyés par ___.", "Pour couper et écraser les aliments, on utilise ___."],
      ga: "les dents",
      hint: "Il y en a en haut et en bas, solides et blanches.",
    },
    {
      id: "langue",
      q: ["Quel organe mobile de la bouche remue les aliments ?", "Quel organe pousse les aliments vers le fond de la bouche ?"],
      a: "Langue",
      s: ["Dans la bouche, les aliments sont remués par ___.", "Pour pousser les aliments vers le fond, la bouche utilise ___."],
      ga: "la langue",
      hint: "Elle est souple et peut aussi goûter.",
    },
  ],
  extras: ["Lèvres", "Joues"],
  gextras: ["les lèvres", "les joues"],
};

const DIG_POOLS = [DIG_ORGANS, DIG_HABITS, DIG_LIQUID, DIG_MOUTH] as const;
const DIG_QCM = questionRows("sc-cm1-digestion", DIG_POOLS);
const DIG_TROU = gapRows("sc-cm1-digestion", DIG_POOLS);
const DIG_ECRIRE = writeRows("sc-cm1-digestion", DIG_POOLS);

const DIG_ORDRE: readonly OrderRow[] = [
  order("Range les organes du trajet des aliments, du premier au dernier.", ["Bouche", "Œsophage", "Estomac", "Intestins"], "dig-ordre:trajet", RANK_HINTS),
  order("Range ces étapes de la digestion, de la première à la dernière.", ["Mâcher les aliments", "Avaler", "Brasser dans l'estomac", "Absorber dans les intestins"], "dig-ordre:etapes", RANK_HINTS),
  order("Range ces organes selon le trajet des aliments, du premier au dernier.", ["Bouche", "Estomac", "Intestins"], "dig-ordre:trois", RANK_HINTS),
  order("Range ces organes selon le trajet des aliments, du premier au dernier.", ["Œsophage", "Estomac", "Intestins"], "dig-ordre:bas", RANK_HINTS),
  order("Range ces organes selon le trajet des aliments, du premier au dernier.", ["Bouche", "Œsophage", "Intestins"], "dig-ordre:sauts", RANK_HINTS),
  order("Range ces gestes pour se brosser les dents, du premier au dernier.", ["Mouiller la brosse", "Mettre la pâte", "Brosser les dents", "Rincer la bouche"], "dig-ordre:brosse", RANK_HINTS),
];

const DIG_RELIER: readonly LinkRow[] = [
  link("Relie chaque organe à son rôle.", [["Bouche", "Broie les aliments"], ["Œsophage", "Conduit les aliments"], ["Estomac", "Brasse les aliments"], ["Intestins", "Absorbent les nutriments"]]),
  link("Relie chaque organe à sa place dans le trajet.", [["Bouche", "Début du trajet"], ["Intestins", "Fin du trajet"], ["Estomac", "Poche musclée"]]),
  link("Relie chaque partie de la bouche à son rôle.", [["Dents", "Broient les aliments"], ["Langue", "Remue les aliments"], ["Salive", "Mouille les aliments"]]),
  link("Relie chaque geste à son bienfait.", [["Se brosser les dents", "Protège la bouche"], ["Bien mâcher", "Aide la digestion"], ["Boire de l'eau propre", "Évite les maladies"]]),
  link("Relie chaque organe à son aspect.", [["Bouche", "Dents et langue"], ["Œsophage", "Tube étroit"], ["Estomac", "Poche"]]),
  link("Relie chaque geste à l'endroit où il se passe.", [["Mâcher", "Dans la bouche"], ["Brasser", "Dans l'estomac"], ["Absorber", "Dans les intestins"]]),
];

const DIG_GLISSER = [
  ...sortRows("Glisse chaque organe dans la bonne case.", ["Appareil digestif", "Appareil respiratoire"], ["Bouche", "Œsophage", "Estomac", "Intestins"], ["Nez", "Trachée", "Bronches", "Poumons"], SORT_HINTS, 8),
  ...sortRows(
    "Glisse chaque geste dans la bonne case.",
    ["Bonne habitude", "Mauvaise habitude"],
    ["Bien mâcher", "Se brosser les dents", "Boire de l'eau propre", "Manger lentement"],
    ["Avaler tout rond", "Sauter les repas", "Manger avec des mains sales", "Boire de l'eau sale"],
    SORT_HINTS,
    8,
  ),
];

export const makeCm1DigQcm: Make = (ctx) => ce2Question(ctx, "cm1-dig-qcm", "les organes et les gestes de la digestion", DIG_QCM, 3);
export const makeCm1DigTrou: Make = (ctx) => ce2Gap(ctx, "cm1-dig-trou", "compléter une phrase sur la digestion", DIG_TROU, 2, 1);
export const makeCm1DigEcrire: Make = (ctx) => ce2Write(ctx, "cm1-dig-ecrire", "écrire un fait sur la digestion", DIG_ECRIRE, 1, 2);
export const makeCm1DigOrdre: Make = (ctx) => ce2Order(ctx, "cm1-dig-ordre", "ranger le trajet des aliments", DIG_ORDRE);
export const makeCm1DigRelier: Make = (ctx) => ce2Link(ctx, "cm1-dig-relier", "relier un organe de la digestion à son rôle", DIG_RELIER);
export const makeCm1DigGlisser: Make = (ctx) => ce2Sort(ctx, "cm1-dig-glisser", "classer les organes et les habitudes", DIG_GLISSER, 2);

// ===========================================================================
// LA RESPIRATION ET SES MALADIES (sc-cm1-respiration)
// ===========================================================================

const RSP_PARTS: Pool = {
  items: [
    {
      id: "nez",
      q: ["Par quel organe l'air entre-t-il dans le corps ?", "Quel organe du visage réchauffe et filtre l'air inspiré ?", "Par quel organe commence le trajet de l'air ?"],
      a: "Nez",
      s: ["L'air entre dans le corps par ___, qui le réchauffe.", "Le trajet de l'air commence par ___."],
      ga: "le nez",
      hint: "On le sent au milieu du visage.",
    },
    {
      id: "trachee",
      q: ["Quel tube de la gorge conduit l'air vers les poumons ?", "Quel nom porte le tube qui descend dans le cou et mène l'air aux bronches ?", "Quel tube, renforcé d'anneaux, relie la gorge aux bronches ?"],
      a: "Trachée",
      also: ["Trachee"],
      s: ["Après le nez, l'air passe par ___ dans le cou.", "Le tube renforcé d'anneaux qui descend dans le cou est ___."],
      ga: "la trachée",
      hint: "Ce tube est renforcé par des anneaux.",
    },
    {
      id: "bronches",
      q: ["Quel nom portent les deux tubes où la trachée se sépare ?", "Quels tubes mènent l'air de la trachée à chaque poumon ?"],
      a: "Bronches",
      s: ["La trachée se divise en deux tubes qui sont ___.", "L'air arrive à chaque poumon par ___."],
      ga: "les bronches",
      hint: "Elles se divisent ensuite comme les branches d'un arbre.",
    },
    {
      id: "poumons",
      q: ["Quels organes se gonflent d'air quand on inspire ?", "Dans quels organes l'oxygène passe-t-il dans le sang ?", "Quels organes finissent le trajet de l'air inspiré ?"],
      a: "Poumons",
      s: ["L'oxygène entre dans le sang à travers ___.", "Quand on inspire, l'air remplit ___."],
      ga: "les poumons",
      hint: "Il y en a deux, de chaque côté de la poitrine.",
    },
  ],
  extras: ["Estomac", "Cœur"],
  gextras: ["l'estomac", "le cœur"],
};

const RSP_MOVE: Pool = {
  items: [
    {
      id: "inspiration",
      q: ["Quel nom porte le mouvement qui fait entrer l'air dans les poumons ?", "Quand on prend de l'air, quel mouvement fait-on ?"],
      a: "Inspiration",
      s: ["Quand on ___, l'air entre dans les poumons.", "Pour faire entrer l'air, on gonfle la poitrine, donc on ___."],
      ga: "inspire",
      hint: "La poitrine se gonfle et le ventre se creuse un peu.",
    },
    {
      id: "expiration",
      q: ["Quel nom porte le mouvement qui fait sortir l'air des poumons ?", "Quand on rejette l'air, quel mouvement fait-on ?"],
      a: "Expiration",
      s: ["Quand on ___, l'air sort des poumons.", "Pour rejeter l'air, on dégonfle la poitrine, donc on ___."],
      ga: "expire",
      hint: "La poitrine se vide, comme un ballon qui se dégonfle.",
    },
  ],
  extras: ["Digestion", "Circulation"],
  gextras: ["digère", "circule"],
};

const RSP_DISEASE: Pool = {
  items: [
    {
      id: "rhume",
      q: ["Quelle maladie fait couler le nez et éternuer ?", "Quelle maladie banale donne le nez bouché et la gorge irritée ?"],
      a: "Rhume",
      s: ["Quand le nez coule et que l'on éternue, on a ___.", "Un nez bouché et une gorge irritée, c'est souvent ___."],
      ga: "un rhume",
      hint: "Elle passe en quelques jours avec du repos.",
    },
    {
      id: "toux",
      q: ["Quel réflexe fait sortir brusquement l'air pour dégager la gorge ?", "Quel nom porte le rejet brusque de l'air qui dégage les voies respiratoires ?"],
      a: "Toux",
      s: ["Le réflexe qui dégage la gorge en chassant l'air très vite est ___.", "Un réflexe brusque dégage les voies respiratoires, c'est ___."],
      ga: "la toux",
      hint: "Un bruit sec que l'on fait malgré soi.",
    },
    {
      id: "asthme",
      q: ["Quelle maladie provoque des crises avec manque d'air et sifflements ?", "Quelle maladie rend la respiration difficile par crises ?"],
      a: "Asthme",
      s: ["Manquer d'air par crises, avec des sifflements, correspond à ___.", "La respiration devient difficile par crises dans ___."],
      ga: "l'asthme",
      hint: "On peut le soigner avec un appareil à inhaler.",
    },
    {
      id: "tuberculose",
      q: ["Quelle maladie grave des poumons est causée par un microbe et se soigne avec des médicaments ?", "Quelle maladie des poumons, due à un microbe, doit être soignée longtemps ?"],
      a: "Tuberculose",
      s: ["Une maladie grave des poumons due à un microbe est ___.", "Contre ___, on prend des médicaments pendant longtemps."],
      ga: "la tuberculose",
      hint: "Un microbe s'installe dans les poumons et l'on tousse beaucoup.",
    },
  ],
  extras: ["Gale", "Paludisme"],
  gextras: ["la gale", "le paludisme"],
};

const RSP_PREVENT: Pool = {
  items: [
    {
      id: "aerer",
      q: ["Que faut-il faire chaque jour pour renouveler l'air de la pièce ?", "Quel geste simple chasse l'air vicié de la maison fermée ?"],
      a: "Aérer la maison",
      not: ["Éviter la fumée"],
      s: ["Pour avoir un air sain, il faut ___ chaque jour.", "Ouvrir les fenêtres pour renouveler l'air correspond à ___."],
      ga: "aérer la maison",
      hint: "On ouvre les fenêtres et les portes.",
    },
    {
      id: "fumee",
      q: ["Que faut-il éviter de respirer pour protéger ses poumons ?", "Qu'est-ce qui abîme les poumons quand on en respire beaucoup ?"],
      a: "Éviter la fumée",
      not: ["Aérer la maison"],
      s: ["Pour protéger ses poumons, il faut ___ du tabac et des feux.", "On protège ses poumons quand on sait ___."],
      ga: "éviter la fumée",
      hint: "Elle pique les yeux et fait tousser.",
    },
  ],
  extras: ["Fermer les fenêtres", "Rester dans la poussière", "Brûler des déchets"],
  gextras: ["fermer les fenêtres", "rester dans la poussière", "brûler des déchets"],
};

const RSP_POOLS = [RSP_PARTS, RSP_MOVE, RSP_DISEASE, RSP_PREVENT] as const;
const RSP_QCM = questionRows("sc-cm1-respiration", RSP_POOLS);
const RSP_TROU = gapRows("sc-cm1-respiration", RSP_POOLS);
const RSP_ECRIRE = writeRows("sc-cm1-respiration", RSP_POOLS);

const RSP_ORDRE: readonly OrderRow[] = [
  order("Range le trajet de l'air inspiré, du premier organe au dernier.", ["Nez", "Trachée", "Bronches", "Poumons"], "rsp-ordre:inspire", RANK_HINTS),
  order("Range le trajet de l'air expiré, du premier organe au dernier.", ["Poumons", "Bronches", "Trachée", "Nez"], "rsp-ordre:expire", RANK_HINTS),
  order("Range ces organes selon le trajet de l'air inspiré, du premier au dernier.", ["Nez", "Trachée", "Poumons"], "rsp-ordre:trois", RANK_HINTS),
  order("Range ces organes selon le trajet de l'air inspiré, du premier au dernier.", ["Trachée", "Bronches", "Poumons"], "rsp-ordre:bas", RANK_HINTS),
  order("Range ces organes selon le trajet de l'air expiré, du premier au dernier.", ["Poumons", "Trachée", "Nez"], "rsp-ordre:sort", RANK_HINTS),
  order("Range ce que fait l'air inspiré, du premier geste au dernier.", ["Il entre par le nez", "Il passe par la trachée", "Il remplit les poumons"], "rsp-ordre:gestes", RANK_HINTS),
];

const RSP_RELIER: readonly LinkRow[] = [
  link("Relie chaque organe à son rôle.", [["Nez", "Filtre et réchauffe l'air"], ["Trachée", "Tube de la gorge"], ["Poumons", "Échangent l'oxygène"]]),
  link("Relie chaque maladie à son signe.", [["Rhume", "Nez qui coule"], ["Asthme", "Manque d'air par crises"], ["Toux", "Dégage la gorge"], ["Tuberculose", "Maladie des poumons due à un microbe"]]),
  link("Relie chaque geste à son effet.", [["Aérer", "Renouveler l'air"], ["Éviter la fumée", "Protéger les poumons"], ["Se couvrir le nez", "Éviter la poussière"]]),
  link("Relie chaque mouvement à ce qu'il fait.", [["Inspirer", "Faire entrer l'air"], ["Expirer", "Faire sortir l'air"], ["Tousser", "Chasser l'air d'un coup"]]),
  link("Relie chaque organe à sa place dans le trajet.", [["Nez", "Entrée de l'air"], ["Poumons", "Fin du trajet"], ["Trachée", "Milieu du trajet"]]),
  link("Relie chaque organe à son aspect.", [["Trachée", "Tube à anneaux"], ["Poumons", "Deux grands sacs"], ["Bronches", "Deux tubes qui se divisent"]]),
];

const RSP_GLISSER = [
  ...sortRows("Glisse chaque organe dans la bonne case.", ["Appareil respiratoire", "Appareil digestif"], ["Nez", "Trachée", "Bronches", "Poumons"], ["Bouche", "Œsophage", "Estomac", "Intestins"], SORT_HINTS, 8),
  ...sortRows(
    "Glisse chaque mot dans la bonne case.",
    ["Maladie", "Prévention"],
    ["Rhume", "Toux", "Asthme", "Tuberculose"],
    ["Aérer la maison", "Éviter la fumée", "Éviter la poussière", "Se laver les mains"],
    SORT_HINTS,
    8,
  ),
];

export const makeCm1RspQcm: Make = (ctx) => ce2Question(ctx, "cm1-rsp-qcm", "les organes, les mouvements et les maladies de la respiration", RSP_QCM, 3);
export const makeCm1RspTrou: Make = (ctx) => ce2Gap(ctx, "cm1-rsp-trou", "compléter une phrase sur la respiration", RSP_TROU, 2, 1);
export const makeCm1RspEcrire: Make = (ctx) => ce2Write(ctx, "cm1-rsp-ecrire", "écrire un fait sur la respiration", RSP_ECRIRE, 1, 2);
export const makeCm1RspOrdre: Make = (ctx) => ce2Order(ctx, "cm1-rsp-ordre", "ranger le trajet de l'air", RSP_ORDRE);
export const makeCm1RspRelier: Make = (ctx) => ce2Link(ctx, "cm1-rsp-relier", "relier un organe ou une maladie à son rôle", RSP_RELIER);
export const makeCm1RspGlisser: Make = (ctx) => ce2Sort(ctx, "cm1-rsp-glisser", "classer les organes, les maladies et la prévention", RSP_GLISSER, 2);

// ===========================================================================
// LE CŒUR ET LE SANG (sc-cm1-circulation)
// ===========================================================================

const CIR_PARTS: Pool = {
  items: [
    {
      id: "coeur",
      q: ["Quel organe musclé pompe le sang dans tout le corps ?", "Quel organe de la poitrine bat sans arrêt pour envoyer le sang ?", "Quel organe fait circuler le sang en se contractant ?"],
      a: "Cœur",
      s: ["Le sang est envoyé dans tout le corps par ___.", "Un organe musclé bat sans arrêt dans la poitrine, c'est ___."],
      ga: "le cœur",
      hint: "Il bat dans la poitrine, un peu à gauche.",
    },
    {
      id: "arteres",
      q: ["Comment s'appellent les vaisseaux qui emportent le sang loin du cœur ?", "Quels vaisseaux partent du cœur vers les organes ?"],
      a: "Artères",
      s: ["Le sang part du cœur vers les organes par ___.", "Les vaisseaux qui partent du cœur sont ___."],
      ga: "les artères",
      hint: "Ce sont eux qui battent quand on prend le pouls.",
    },
    {
      id: "veines",
      q: ["Comment s'appellent les vaisseaux qui ramènent le sang vers le cœur ?", "Quels vaisseaux reviennent des organes vers le cœur ?"],
      a: "Veines",
      s: ["Le sang revient vers le cœur par ___.", "Les vaisseaux qui arrivent au cœur sont ___."],
      ga: "les veines",
      hint: "Les bleues se voient parfois sous la peau du poignet.",
    },
  ],
  extras: ["Bronches", "Intestins"],
  gextras: ["les bronches", "les intestins"],
};

const CIR_PULSE: Pool = {
  items: [
    {
      id: "pouls",
      q: ["Quel nom portent les battements du cœur que l'on sent au poignet ?", "Quel nom porte ce que l'on sent en posant les doigts sur le poignet ?"],
      a: "Pouls",
      s: ["On sent le ___ en posant les doigts sur le poignet.", "Les battements du cœur sentis au poignet sont le ___."],
      ga: "pouls",
      hint: "On le compte avec une montre et deux doigts.",
    },
  ],
  extras: ["Souffle", "Frisson"],
  gextras: ["souffle", "frisson"],
};

const CIR_PLACE: Pool = {
  items: [
    {
      id: "poignet",
      q: ["Où peut-on sentir facilement son pouls ?", "Sur quelle partie du bras pose-t-on les doigts pour prendre le pouls ?"],
      a: "Poignet",
      not: ["Cou"],
      s: ["On prend le pouls en posant les doigts sur le ___.", "Les battements se sentent bien au ___."],
      ga: "poignet",
      hint: "C'est l'articulation entre la main et l'avant-bras.",
    },
  ],
  extras: ["Genou", "Orteil"],
  gextras: ["genou", "coude"],
};

const CIR_BLOOD: Pool = {
  items: [
    {
      id: "oxygene",
      q: ["Quel gaz de l'air, pris dans les poumons, le sang apporte-t-il aux organes ?", "Que transporte le sang dans tout le corps avec les aliments ?"],
      a: "Oxygène",
      s: ["Le sang transporte ___ et les aliments dans tout le corps.", "Le sang prend ___ dans les poumons."],
      ga: "l'oxygène",
      hint: "On l'inspire avec l'air, il nous fait vivre.",
    },
  ],
  extras: ["Fumée", "Poussière"],
  gextras: ["la fumée", "la poussière"],
};

const CIR_WHERE: Pool = {
  items: [
    {
      id: "poumons-sang",
      q: ["Dans quels organes le sang se charge-t-il d'oxygène ?", "Où le sang prend-il l'oxygène ?"],
      a: "Poumons",
      s: ["Le sang se charge d'oxygène dans ___.", "L'oxygène entre dans le sang à travers ___."],
      ga: "les poumons",
      hint: "Ils se gonflent à chaque inspiration.",
    },
    {
      id: "intestins-sang",
      q: ["Dans quels organes le sang se charge-t-il d'aliments digérés ?", "Où le sang prend-il les nutriments des aliments ?"],
      a: "Intestins",
      s: ["Le sang se charge d'aliments digérés dans ___.", "Les nutriments passent dans le sang à travers ___."],
      ga: "les intestins",
      hint: "Ce sont de longs tubes enroulés dans le ventre.",
    },
  ],
  extras: ["Reins"],
  gextras: ["les reins"],
};

const CIR_POOLS = [CIR_PARTS, CIR_PULSE, CIR_PLACE, CIR_BLOOD, CIR_WHERE] as const;
const CIR_QCM = questionRows("sc-cm1-circulation", CIR_POOLS);
const CIR_TROU = gapRows("sc-cm1-circulation", CIR_POOLS);
const CIR_ECRIRE = writeRows("sc-cm1-circulation", CIR_POOLS);

const CIR_ORDRE: readonly OrderRow[] = [
  order("Range le voyage du sang qui part du cœur, du premier au dernier.", ["Cœur", "Artères", "Organes", "Veines"], "cir-ordre:cycle", RANK_HINTS),
  order("Range le voyage du sang qui part du cœur, du premier au dernier.", ["Cœur", "Artères", "Organes"], "cir-ordre:aller", RANK_HINTS),
  order("Range le voyage du sang qui revient au cœur, du premier au dernier.", ["Organes", "Veines", "Cœur"], "cir-ordre:retour", RANK_HINTS),
  order("Range le voyage du sang, du premier passage au dernier.", ["Artères", "Organes", "Veines"], "cir-ordre:milieu", RANK_HINTS),
  order("Range ces gestes pour prendre son pouls, du premier au dernier.", ["Poser les doigts sur le poignet", "Sentir les battements", "Compter les battements"], "cir-ordre:pouls", RANK_HINTS),
  order("Range ce qui arrive à l'oxygène, du premier au dernier moment.", ["Respirer l'air", "Passer dans le sang", "Arriver aux organes"], "cir-ordre:oxygene", RANK_HINTS),
];

const CIR_RELIER: readonly LinkRow[] = [
  link("Relie chaque partie à son rôle.", [["Cœur", "Pompe le sang"], ["Artères", "Emportent le sang"], ["Veines", "Ramènent le sang"]]),
  link("Relie chaque organe à ce qu'il donne au sang.", [["Poumons", "Donnent l'oxygène"], ["Intestins", "Donnent les aliments"], ["Cœur", "Envoie le sang"]]),
  link("Relie chaque mot à son sens.", [["Pouls", "Battements du cœur"], ["Poignet", "Où l'on sent le pouls"], ["Sang", "Transporte l'oxygène"]]),
  link("Relie chaque vaisseau à son trajet.", [["Artères", "Partent du cœur"], ["Veines", "Reviennent au cœur"], ["Cœur", "Pompe"]]),
  link("Relie chaque chose à son origine.", [["Oxygène", "Vient des poumons"], ["Aliments", "Viennent des intestins"], ["Sang", "Transporte les deux"]]),
  link("Relie chaque mot à son aspect.", [["Cœur", "Organe musclé"], ["Pouls", "Battements"], ["Sang", "Liquide rouge"]]),
];

const CIR_GLISSER = [
  ...sortRows(
    "Glisse chaque mot dans la bonne case.",
    ["Artères", "Veines"],
    ["Emportent le sang", "Partent du cœur", "Vont vers les organes"],
    ["Ramènent le sang", "Arrivent au cœur", "Reviennent des organes"],
    SORT_HINTS,
    8,
  ),
  ...sortRows(
    "Glisse chaque mot dans la bonne case.",
    ["Appareil circulatoire", "Appareil respiratoire"],
    ["Cœur", "Artères", "Veines", "Sang"],
    ["Nez", "Trachée", "Bronches", "Poumons"],
    SORT_HINTS,
    8,
  ),
];

export const makeCm1CirQcm: Make = (ctx) => ce2Question(ctx, "cm1-cir-qcm", "le cœur, les vaisseaux et le sang", CIR_QCM, 3);
export const makeCm1CirTrou: Make = (ctx) => ce2Gap(ctx, "cm1-cir-trou", "compléter une phrase sur la circulation", CIR_TROU, 2, 1);
export const makeCm1CirEcrire: Make = (ctx) => ce2Write(ctx, "cm1-cir-ecrire", "écrire un fait sur la circulation", CIR_ECRIRE, 1, 2);
export const makeCm1CirOrdre: Make = (ctx) => ce2Order(ctx, "cm1-cir-ordre", "ranger le voyage du sang", CIR_ORDRE);
export const makeCm1CirRelier: Make = (ctx) => ce2Link(ctx, "cm1-cir-relier", "relier une partie de la circulation à son rôle", CIR_RELIER);
export const makeCm1CirGlisser: Make = (ctx) => ce2Sort(ctx, "cm1-cir-glisser", "classer les artères, les veines et les appareils", CIR_GLISSER, 2);

// ===========================================================================
// PHÉNOMÈNES PHYSIQUES ET CHIMIQUES (sc-cm1-phenomenes)
// ===========================================================================

const PHE_NAMES: Pool = {
  items: [
    {
      id: "evaporation",
      q: ["Quel nom porte le passage de l'eau liquide à la vapeur ?", "Quel phénomène sèche le linge mouillé au soleil ?", "Quel phénomène fait disparaître l'eau de la flaque quand il fait chaud ?"],
      a: "Évaporation",
      also: ["Evaporation"],
      s: ["Au soleil, l'eau de la flaque disparaît à cause de ___.", "Le linge mouillé sèche au soleil grâce à ___."],
      ga: "l'évaporation",
      hint: "La chaleur change le liquide en gaz.",
    },
    {
      id: "condensation",
      q: ["Quel nom porte le passage de la vapeur à l'eau liquide ?", "Quel phénomène forme des gouttes sur un verre d'eau très froide ?", "Quel phénomène forme la buée sur une vitre froide ?"],
      a: "Condensation",
      s: ["La buée sur une vitre froide vient de ___.", "Des gouttes se forment sur un verre froid à cause de ___."],
      ga: "la condensation",
      hint: "Le froid change le gaz en liquide.",
    },
    {
      id: "fusion",
      q: ["Quel nom porte le passage de la glace à l'eau liquide ?", "Quel phénomène fait fondre un glaçon au soleil ?", "Quel phénomène change un solide en liquide quand on le chauffe ?"],
      a: "Fusion",
      s: ["Un glaçon qui fond au soleil subit ___.", "Un solide qui devient liquide en chauffant subit ___."],
      ga: "la fusion",
      hint: "Le solide devient mou, puis coule.",
    },
    {
      id: "solidification",
      q: ["Quel nom porte le passage de l'eau liquide à la glace ?", "Quel phénomène change l'eau en glace au congélateur ?", "Quel phénomène change un liquide en solide quand il refroidit ?"],
      a: "Solidification",
      s: ["L'eau qui gèle au congélateur subit ___.", "Un liquide qui durcit en refroidissant subit ___."],
      ga: "la solidification",
      hint: "Le liquide devient dur à cause du froid.",
    },
    {
      id: "combustion",
      q: ["Quel nom porte le fait de brûler, avec de l'air et de la chaleur ?", "Quel phénomène chimique transforme le bois en cendres et en fumée ?", "Quel phénomène chimique produit une flamme ?"],
      a: "Combustion",
      s: ["Le bois qui brûle dans un foyer subit ___.", "Une flamme qui brûle un combustible est ___."],
      ga: "la combustion",
      hint: "Il faut du feu, de l'air et quelque chose à brûler.",
    },
    {
      id: "rouille",
      q: ["Quel nom porte le dépôt orangé qui ronge le fer mouillé à l'air ?", "Quel phénomène chimique abîme un clou de fer laissé sous la pluie ?"],
      a: "Rouille",
      s: ["Un clou de fer laissé sous la pluie se couvre de ___.", "Le fer mouillé s'abîme avec ___."],
      ga: "la rouille",
      hint: "Le fer devient orange et s'effrite.",
    },
  ],
};

const PHE_AIR: Pool = {
  items: [
    {
      id: "air",
      q: ["De quoi le feu a-t-il besoin pour continuer à brûler ?", "Que faut-il au feu, en plus du bois et de la chaleur ?"],
      a: "Air",
      s: ["Le feu s'éteint sans ___.", "Sans ___, la bougie et le bois ne brûlent pas."],
      ga: "air",
      hint: "On le souffle sur les braises pour les raviver.",
    },
  ],
  extras: ["Eau", "Sable"],
  gextras: ["eau", "sable"],
};

const PHE_CANDLE: Pool = {
  items: [
    {
      id: "bougie",
      q: ["Que devient la flamme d'une bougie placée sous un verre bien fermé ?", "Que se passe-t-il quand on coiffe une bougie allumée avec un verre ?"],
      a: "Elle s'éteint",
      s: ["Sous un verre fermé, la flamme d'une bougie ___.", "Quand l'air manque, la flamme ___."],
      ga: "s'éteint",
      hint: "Quelque chose manque sous le verre.",
    },
  ],
  extras: ["Elle grossit", "Elle change de place"],
  gextras: ["grossit", "change de place"],
};

const PHE_IRON: Pool = {
  items: [
    {
      id: "fer",
      q: ["Que faut-il au fer pour qu'il rouille ?", "Avec quoi un clou de fer rouille-t-il ?"],
      a: "Eau et air",
      s: ["Un clou de fer laissé sous la pluie finit par ___.", "Le fer mouillé et laissé à l'air finit par ___."],
      ga: "rouiller",
      hint: "Il faut qu'il soit mouillé et à l'air libre.",
    },
  ],
  extras: ["Sable sec", "Froid seul"],
  gextras: ["geler", "fondre"],
};

const PHE_POOLS = [PHE_NAMES, PHE_AIR, PHE_CANDLE, PHE_IRON] as const;
const PHE_QCM = questionRows("sc-cm1-phenomenes", PHE_POOLS);
const PHE_TROU = gapRows("sc-cm1-phenomenes", PHE_POOLS);
const PHE_ECRIRE = writeRows("sc-cm1-phenomenes", PHE_POOLS);

const PHE_ORDRE: readonly OrderRow[] = [
  order("Range les états de l'eau chauffée, du premier au dernier.", ["Glace", "Eau liquide", "Vapeur"], "phe-ordre:chauffe", RANK_HINTS),
  order("Range les états de l'eau refroidie, du premier au dernier.", ["Vapeur", "Eau liquide", "Glace"], "phe-ordre:froid", RANK_HINTS),
  order("Range ce que devient un glaçon que l'on chauffe, du premier au dernier état.", ["Solide", "Liquide", "Gaz"], "phe-ordre:glacon", RANK_HINTS),
  order("Range ce qui arrive à une bougie couverte, du premier au dernier moment.", ["On pose un verre", "L'air manque", "La flamme s'éteint"], "phe-ordre:bougie", RANK_HINTS),
  order("Range les étapes de la formation de la rouille, de la première à la dernière.", ["Le fer est mouillé", "L'eau et l'air l'attaquent", "Le fer devient orange"], "phe-ordre:rouille", RANK_HINTS),
  order("Range les étapes du séchage du linge, de la première à la dernière.", ["On étend le linge mouillé", "L'eau s'évapore", "Le linge est sec"], "phe-ordre:linge", RANK_HINTS),
];

const PHE_RELIER: readonly LinkRow[] = [
  link("Relie chaque phénomène à son changement.", [["Évaporation", "Du liquide au gaz"], ["Condensation", "Du gaz au liquide"], ["Fusion", "Du solide au liquide"], ["Solidification", "Du liquide au solide"]]),
  link("Relie chaque scène à son phénomène.", [["Glaçon qui fond", "Fusion"], ["Linge qui sèche", "Évaporation"], ["Buée sur un verre", "Condensation"]]),
  link("Relie chaque scène à son phénomène.", [["Eau qui gèle", "Solidification"], ["Bois qui brûle", "Combustion"], ["Clou orange", "Rouille"]]),
  link("Relie chaque phénomène à ce qu'il demande.", [["Combustion", "A besoin d'air"], ["Rouille", "A besoin d'eau et d'air"], ["Évaporation", "A besoin de chaleur"]]),
  link("Relie chaque cause à son effet.", [["Chaleur", "Fait fondre la glace"], ["Froid", "Fait geler l'eau"], ["Soleil", "Sèche le linge"]]),
  link("Relie chaque mot à son état.", [["Buée", "Gaz devenu liquide"], ["Glaçon", "Solide"], ["Vapeur", "Gaz"]]),
];

const PHE_GLISSER = [
  ...sortRows("Glisse chaque phénomène dans la bonne case.", ["Physique", "Chimique"], ["Évaporation", "Condensation", "Fusion", "Solidification"], ["Combustion", "Rouille"], SORT_HINTS, 8),
  ...sortRows("Glisse chaque mot dans la bonne case.", ["Solide", "Gaz"], ["Glace", "Fer", "Pierre", "Bois"], ["Vapeur d'eau", "Air", "Oxygène", "Gaz carbonique"], SORT_HINTS, 8),
  ...sortRows("Glisse chaque mot dans la bonne case.", ["Liquide", "Solide"], ["Eau", "Huile", "Lait", "Jus"], ["Glace", "Fer", "Pierre", "Bois"], SORT_HINTS, 8),
];

export const makeCm1PheQcm: Make = (ctx) => ce2Question(ctx, "cm1-phe-qcm", "les changements d'état de l'eau, la combustion et la rouille", PHE_QCM, 3);
export const makeCm1PheTrou: Make = (ctx) => ce2Gap(ctx, "cm1-phe-trou", "compléter une phrase sur un phénomène", PHE_TROU, 2, 1);
export const makeCm1PheEcrire: Make = (ctx) => ce2Write(ctx, "cm1-phe-ecrire", "écrire le nom d'un phénomène", PHE_ECRIRE, 1, 2);
export const makeCm1PheOrdre: Make = (ctx) => ce2Order(ctx, "cm1-phe-ordre", "ranger les états de l'eau et les étapes d'un phénomène", PHE_ORDRE);
export const makeCm1PheRelier: Make = (ctx) => ce2Link(ctx, "cm1-phe-relier", "relier un phénomène à son changement", PHE_RELIER);
export const makeCm1PheGlisser: Make = (ctx) => ce2Sort(ctx, "cm1-phe-glisser", "classer les phénomènes et les états de la matière", PHE_GLISSER, 2);

// ===========================================================================
// DÉMONTER ET ASSEMBLER UN OBJET (sc-cm1-objets)
// ===========================================================================

const OBJ_BIKE: Pool = {
  items: [
    {
      id: "guidon",
      q: ["Quelle pièce du vélo sert à tourner et à se diriger ?", "Avec quelle pièce du vélo choisit-on sa direction ?"],
      a: "Guidon",
      s: ["On dirige un vélo en tournant ___.", "La pièce que l'on tient pour tourner est ___."],
      ga: "le guidon",
      hint: "On le tient des deux mains, devant soi.",
    },
    {
      id: "freins",
      q: ["Quelle pièce du vélo sert à ralentir et à s'arrêter ?", "Quelles pièces serre-t-on avec les doigts pour s'arrêter ?"],
      a: "Freins",
      s: ["Pour s'arrêter, on serre ___ du vélo.", "Les pièces qui ralentissent les roues sont ___."],
      ga: "les freins",
      hint: "Des leviers que l'on serre près des poignées.",
    },
    {
      id: "chaine",
      q: ["Quelle pièce transmet le mouvement des pédales à la roue ?", "Quelle pièce du vélo relie le pédalier à la roue arrière ?"],
      a: "Chaîne",
      also: ["Chaine"],
      s: ["Le mouvement des pédales passe à la roue par ___.", "La pièce de métal faite de maillons qui entraîne la roue est ___."],
      ga: "la chaîne",
      hint: "Elle est faite de petits maillons et il faut l'huiler.",
    },
    {
      id: "selle",
      q: ["Quelle pièce du vélo sert à s'asseoir ?", "Sur quelle pièce du vélo le cycliste est-il assis ?"],
      a: "Selle",
      s: ["Le cycliste est assis sur ___.", "Pour s'asseoir sur un vélo, on utilise ___."],
      ga: "la selle",
      hint: "On la règle à la hauteur des jambes.",
    },
    {
      id: "pedales",
      q: ["Quelle pièce pousse-t-on du pied pour faire avancer le vélo ?", "Quelles pièces tournent sous les pieds du cycliste ?"],
      a: "Pédales",
      also: ["Pedales"],
      s: ["On fait avancer un vélo en poussant sur ___.", "Les pieds du cycliste appuient sur ___."],
      ga: "les pédales",
      hint: "Les pieds les poussent à tour de rôle.",
    },
  ],
  extras: ["Ampoule", "Joint"],
  gextras: ["l'ampoule", "le joint"],
};

const OBJ_LAMP: Pool = {
  items: [
    {
      id: "pile",
      q: ["Quelle pièce fournit l'énergie de la lampe torche ?", "Quelle pièce de la lampe torche s'use et se change ?"],
      a: "Pile",
      s: ["La lampe torche reçoit son énergie grâce à ___.", "Quand la lumière faiblit, on change ___."],
      ga: "la pile",
      hint: "Elle se glisse dans le boîtier.",
    },
    {
      id: "ampoule",
      q: ["Quelle pièce de la lampe torche produit la lumière ?", "Quelle pièce de la lampe s'allume ?"],
      a: "Ampoule",
      s: ["La lumière de la lampe torche vient de ___.", "La pièce qui brille quand on appuie sur le bouton est ___."],
      ga: "l'ampoule",
      hint: "Elle brille quand le courant passe.",
    },
    {
      id: "interrupteur",
      q: ["Quelle pièce sert à allumer et à éteindre la lampe ?", "Quelle pièce de la lampe torche coupe ou laisse passer le courant ?"],
      a: "Interrupteur",
      s: ["On allume et on éteint la lampe avec ___.", "La pièce qui coupe ou laisse passer le courant est ___."],
      ga: "l'interrupteur",
      hint: "On le pousse du pouce.",
    },
  ],
  extras: ["Boîtier", "Ressort"],
  gextras: ["le boîtier", "le ressort"],
};

const OBJ_TAP: Pool = {
  items: [
    {
      id: "joint",
      q: ["Quelle pièce du robinet empêche l'eau de fuir ?", "Quelle petite pièce de caoutchouc assure l'étanchéité du robinet ?"],
      a: "Joint",
      s: ["L'étanchéité d'un robinet est assurée par ___.", "Quand un robinet goutte, on change ___."],
      ga: "le joint",
      hint: "C'est une petite rondelle souple.",
    },
    {
      id: "manette",
      q: ["Quelle pièce du robinet sert à ouvrir et à fermer l'eau ?", "Quelle pièce du robinet tourne-t-on pour faire couler l'eau ?"],
      a: "Manette",
      s: ["On ouvre l'eau en tournant ___ du robinet.", "La pièce que la main tourne sur le robinet est ___."],
      ga: "la manette",
      hint: "On la tourne avec la main.",
    },
  ],
  extras: ["Tuyau", "Bec"],
  gextras: ["le tuyau", "le bec"],
};

const OBJ_WHICH: Pool = {
  items: [
    {
      id: "objet-velo",
      q: ["Dans quel objet trouve-t-on une chaîne, des pédales et un guidon ?"],
      a: "Vélo",
      s: ["Une chaîne, des pédales et un guidon forment ___."],
      ga: "un vélo",
      hint: "Il roule sur deux roues sans moteur.",
    },
    {
      id: "objet-lampe",
      q: ["Dans quel objet trouve-t-on une pile, une ampoule et un interrupteur ?"],
      a: "Lampe torche",
      s: ["Une pile, une ampoule et un interrupteur forment ___."],
      ga: "une lampe torche",
      hint: "On l'emporte la nuit pour voir dans le noir.",
    },
    {
      id: "objet-robinet",
      q: ["Dans quel objet trouve-t-on un joint et une manette ?"],
      a: "Robinet",
      s: ["Un joint et une manette appartiennent à ___."],
      ga: "un robinet",
      hint: "Il laisse couler l'eau ou l'arrête.",
    },
  ],
};

const OBJ_CARE: Pool = {
  items: [
    {
      id: "huiler",
      q: ["Comment entretient-on une chaîne de vélo qui grince ?", "Que faire quand la chaîne du vélo grince ?"],
      a: "Huiler la chaîne",
      s: ["Quand la chaîne grince, on doit ___.", "Pour qu'une chaîne tourne bien, il faut ___."],
      ga: "huiler la chaîne",
      hint: "Quelques gouttes suffisent sur les maillons.",
    },
    {
      id: "changer-pile",
      q: ["Que faire quand la lampe torche s'éclaire de moins en moins ?", "Comment redonner de l'énergie à une lampe torche qui faiblit ?"],
      a: "Changer la pile",
      s: ["Quand la lampe faiblit, on doit ___.", "Quand la lampe éclaire mal, il faut ___."],
      ga: "changer la pile",
      hint: "Ce qui donne l'énergie est usé.",
    },
    {
      id: "changer-joint",
      q: ["Que faire quand un robinet fuit goutte à goutte ?", "Comment arrêter la fuite d'un robinet usé ?"],
      a: "Changer le joint",
      s: ["Pour qu'un robinet cesse de fuir, on doit ___.", "Un robinet qui goutte demande de ___."],
      ga: "changer le joint",
      hint: "La petite rondelle souple est usée.",
    },
    {
      id: "gonfler",
      q: ["Que faire quand un pneu de vélo est trop mou ?", "Comment rendre ses pneus fermes ?"],
      a: "Gonfler les pneus",
      s: ["Un pneu trop mou se répare en le ___.", "Pour rouler facilement, on doit ___."],
      ga: "gonfler les pneus",
      hint: "On y envoie de l'air avec une pompe.",
    },
  ],
};

const OBJ_POOLS = [OBJ_BIKE, OBJ_LAMP, OBJ_TAP, OBJ_WHICH, OBJ_CARE] as const;
const OBJ_QCM = questionRows("sc-cm1-objets", OBJ_POOLS);
const OBJ_TROU = gapRows("sc-cm1-objets", OBJ_POOLS);
const OBJ_ECRIRE = writeRows("sc-cm1-objets", OBJ_POOLS);

const OBJ_ORDRE: readonly OrderRow[] = [
  order("Range les gestes pour changer la pile d'une lampe torche, du premier au dernier.", ["Éteindre la lampe", "Ouvrir le boîtier", "Retirer la vieille pile", "Poser la nouvelle pile", "Refermer le boîtier"], "obj-ordre:pile", RANK_HINTS),
  order("Range les gestes pour changer le joint d'un robinet, du premier au dernier.", ["Fermer l'arrivée d'eau", "Démonter la manette", "Changer le joint", "Remonter la manette", "Rouvrir l'eau"], "obj-ordre:joint", RANK_HINTS),
  order("Range les gestes pour réparer une crevaison, du premier au dernier.", ["Retirer la roue", "Sortir la chambre à air", "Boucher le trou", "Remettre la chambre à air", "Regonfler le pneu"], "obj-ordre:crevaison", RANK_HINTS),
  order("Range les gestes pour gonfler un pneu, du premier au dernier.", ["Dévisser le capuchon", "Brancher la pompe", "Pomper", "Revisser le capuchon"], "obj-ordre:gonfler", RANK_HINTS),
  order("Range les étapes pour démonter puis remonter un objet, de la première à la dernière.", ["Noter l'ordre des pièces", "Démonter les pièces", "Nettoyer ou changer la pièce", "Remonter dans l'ordre inverse"], "obj-ordre:demonter", RANK_HINTS),
  order("Range les gestes pour allumer une lampe torche, du premier au dernier.", ["Vérifier la pile", "Appuyer sur l'interrupteur", "L'ampoule s'allume"], "obj-ordre:allumer", RANK_HINTS),
];

const OBJ_RELIER: readonly LinkRow[] = [
  link("Relie chaque pièce du vélo à son rôle.", [["Guidon", "Diriger"], ["Freins", "Ralentir"], ["Chaîne", "Transmettre le mouvement"], ["Selle", "S'asseoir"]]),
  link("Relie chaque pièce de la lampe torche à son rôle.", [["Pile", "Fournit l'énergie"], ["Ampoule", "Éclaire"], ["Interrupteur", "Allume et éteint"]]),
  link("Relie chaque pièce du robinet à son rôle.", [["Manette", "Ouvre et ferme l'eau"], ["Joint", "Empêche les fuites"], ["Bec", "Laisse couler l'eau"]]),
  link("Relie chaque objet à l'une de ses pièces.", [["Vélo", "Chaîne"], ["Lampe torche", "Pile"], ["Robinet", "Joint"]]),
  link("Relie chaque panne à son remède.", [["Chaîne qui grince", "Huiler"], ["Pile usée", "Changer la pile"], ["Robinet qui fuit", "Changer le joint"]]),
  link("Relie chaque pièce du vélo à ce qu'elle fait.", [["Pédales", "Font avancer"], ["Roues", "Roulent"], ["Pneu", "Se gonfle"]]),
];

const OBJ_GLISSER = [
  ...sortRows("Glisse chaque pièce dans la bonne case.", ["Vélo", "Lampe torche"], ["Guidon", "Chaîne", "Pédales", "Selle"], ["Pile", "Ampoule", "Interrupteur"], SORT_HINTS, 8),
  ...sortRows("Glisse chaque pièce dans la bonne case.", ["Lampe torche", "Robinet"], ["Pile", "Ampoule", "Interrupteur"], ["Joint", "Manette", "Bec"], SORT_HINTS, 8),
  ...sortRows("Glisse chaque pièce dans la bonne case.", ["Vélo", "Robinet"], ["Guidon", "Chaîne", "Pédales", "Selle"], ["Joint", "Manette", "Bec"], SORT_HINTS, 8),
];

export const makeCm1ObjQcm: Make = (ctx) => ce2Question(ctx, "cm1-obj-qcm", "les pièces du vélo, de la lampe torche et du robinet", OBJ_QCM, 3);
export const makeCm1ObjTrou: Make = (ctx) => ce2Gap(ctx, "cm1-obj-trou", "compléter une phrase sur un objet technique", OBJ_TROU, 2, 1);
export const makeCm1ObjEcrire: Make = (ctx) => ce2Write(ctx, "cm1-obj-ecrire", "écrire le nom d'une pièce ou d'un geste", OBJ_ECRIRE, 1, 2);
export const makeCm1ObjOrdre: Make = (ctx) => ce2Order(ctx, "cm1-obj-ordre", "ranger les gestes d'un démontage ou d'un entretien", OBJ_ORDRE);
export const makeCm1ObjRelier: Make = (ctx) => ce2Link(ctx, "cm1-obj-relier", "relier une pièce à son rôle", OBJ_RELIER);
export const makeCm1ObjGlisser: Make = (ctx) => ce2Sort(ctx, "cm1-obj-glisser", "classer les pièces par objet", OBJ_GLISSER, 2);

// ===========================================================================
// L'HYGIÈNE DU MILIEU (sc-cm1-hygiene)
// ===========================================================================

const HYG_PROBLEM: Pool = {
  items: [
    {
      id: "insalubrite",
      q: ["Quel mot désigne un lieu sale, avec des ordures et des eaux usées ?", "Quel mot décrit un lieu malsain, couvert d'ordures et de flaques sales ?"],
      a: "Insalubrité",
      also: ["Insalubrite"],
      s: ["Des ordures et des eaux usées partout, c'est ___.", "Un quartier plein de déchets est touché par ___."],
      ga: "l'insalubrité",
      hint: "Le lieu est sale et dangereux pour la santé.",
    },
    {
      id: "promiscuite",
      q: ["Comment appelle-t-on le fait de vivre très serrés, à trop nombreux dans un petit espace ?", "Quel mot décrit une famille nombreuse entassée dans une seule pièce ?"],
      a: "Promiscuité",
      also: ["Promiscuite"],
      s: ["Vivre à trop nombreux dans un petit espace, c'est ___.", "Dans un logement trop petit, les microbes passent plus vite à cause de ___."],
      ga: "la promiscuité",
      hint: "Il n'y a presque plus de place entre les personnes.",
    },
  ],
  extras: ["Pollution", "Épidémie"],
  gextras: ["la pollution", "une épidémie"],
};

const HYG_KIND: Pool = {
  items: [
    {
      id: "individuelle",
      q: ["Comment appelle-t-on les gestes de propreté que chacun fait pour son corps ?", "Quelle hygiène concerne la propreté de son propre corps ?"],
      a: "Hygiène individuelle",
      also: ["Hygiene individuelle"],
      s: ["Se laver les mains ou se doucher relève de l'hygiène ___.", "La propreté de chacun pour son corps est l'hygiène ___."],
      ga: "individuelle",
      hint: "Chacun s'en occupe pour soi.",
    },
    {
      id: "collective",
      q: ["Comment appelle-t-on les gestes de propreté faits ensemble pour le quartier ?", "Quelle hygiène concerne la propreté des rues et des lieux communs ?"],
      a: "Hygiène collective",
      also: ["Hygiene collective"],
      s: ["Nettoyer la rue tous ensemble relève de l'hygiène ___.", "La propreté des lieux communs est l'hygiène ___."],
      ga: "collective",
      hint: "Tous les habitants y participent ensemble.",
    },
  ],
  extras: ["Hygiène animale", "Hygiène alimentaire"],
  gextras: ["animale", "alimentaire"],
};

const HYG_SKIN: Pool = {
  items: [
    {
      id: "gale",
      q: ["Quelle maladie de la peau démange fortement et passe par contact ?", "Quelle maladie de la peau donne de fortes démangeaisons dans la famille ?"],
      a: "Gale",
      s: ["Une maladie de la peau qui démange beaucoup est ___.", "Une maladie de la peau qui passe par contact et démange est ___."],
      ga: "la gale",
      hint: "Elle donne envie de se gratter, surtout la nuit.",
    },
    {
      id: "teigne",
      q: ["Quelle maladie du cuir chevelu laisse des plaques sans cheveux ?", "Quelle maladie de la tête fait tomber les cheveux par plaques ?"],
      a: "Teigne",
      s: ["Des plaques sans cheveux sur la tête viennent de ___.", "Des plaques sans cheveux sur le crâne viennent souvent de ___."],
      ga: "la teigne",
      hint: "On la soigne en gardant la tête propre.",
    },
  ],
  extras: ["Rhume", "Asthme"],
  gextras: ["le rhume", "l'asthme"],
};

const HYG_GESTURES: Pool = {
  items: [
    {
      id: "mains",
      q: ["Quel geste protège des microbes avant de manger ?", "Que faut-il faire avec du savon avant de passer à table ?"],
      a: "Se laver les mains",
      not: ["Se doucher"],
      s: ["Avant de manger, on doit ___ avec du savon.", "Pour éviter les microbes à table, il faut ___."],
      ga: "se laver les mains",
      hint: "Du savon, de l'eau propre et quelques frottements.",
    },
    {
      id: "poubelle",
      q: ["Quel geste de tous garde les rues propres ?", "Où doit-on jeter les ordures pour garder le quartier propre ?"],
      a: "Jeter à la poubelle",
      not: ["Évacuer les eaux usées"],
      s: ["Pour garder le quartier propre, on doit ___ les ordures.", "Les ordures ne se jettent pas dans la rue, on doit ___."],
      ga: "jeter à la poubelle",
      hint: "Le sac est fermé et déposé au bon endroit.",
    },
    {
      id: "eaux",
      q: ["Que fait-on des eaux sales pour éviter les mauvaises odeurs et les moustiques ?", "Quel geste évite que l'eau sale stagne près des maisons ?"],
      a: "Évacuer les eaux usées",
      not: ["Jeter à la poubelle"],
      s: ["Pour ne pas attirer les moustiques, on doit ___.", "Une eau sale qui stagne se règle en venant ___."],
      ga: "évacuer les eaux usées",
      hint: "L'eau sale doit s'écouler loin des maisons.",
    },
    {
      id: "doucher",
      q: ["Quel geste de propreté du corps se fait tous les jours avec de l'eau et du savon ?", "Comment garde-t-on la peau propre au quotidien ?"],
      a: "Se doucher",
      not: ["Se laver les mains"],
      s: ["Pour garder la peau propre, on doit ___ chaque jour.", "La propreté du corps se garde en venant ___."],
      ga: "se doucher",
      hint: "On se mouille entièrement et on se savonne.",
    },
  ],
  extras: ["Jeter dans la rue", "Laisser l'eau stagner"],
  gextras: ["jeter dans la rue", "laisser l'eau stagner"],
};

const HYG_SHARE: Pool = {
  items: [
    {
      id: "peigne",
      q: ["Que faut-il éviter de prêter pour ne pas attraper la teigne ?", "Quel objet de toilette ne se partage pas, à cause des maladies de la tête ?"],
      a: "Peigne",
      s: ["Pour ne pas attraper la teigne, on ne prête pas son ___.", "On évite de partager son ___ pour protéger sa tête."],
      ga: "peigne",
      hint: "On s'en sert pour coiffer les cheveux.",
    },
  ],
  extras: ["Cahier", "Cartable"],
  gextras: ["cahier", "cartable"],
};

const HYG_POOLS = [HYG_PROBLEM, HYG_KIND, HYG_SKIN, HYG_GESTURES, HYG_SHARE] as const;
const HYG_QCM = questionRows("sc-cm1-hygiene", HYG_POOLS);
const HYG_TROU = gapRows("sc-cm1-hygiene", HYG_POOLS);
const HYG_ECRIRE = writeRows("sc-cm1-hygiene", HYG_POOLS);

const HYG_ORDRE: readonly OrderRow[] = [
  order("Range les gestes pour se laver les mains, du premier au dernier.", ["Mouiller les mains", "Frotter avec du savon", "Rincer à l'eau propre", "Sécher les mains"], "hyg-ordre:mains", RANK_HINTS),
  order("Range le parcours d'un sac de déchets, du premier au dernier moment.", ["Remplir le sac", "Fermer le sac", "Le déposer au point de collecte", "Le camion l'emporte"], "hyg-ordre:sac", RANK_HINTS),
  order("Range ce qui arrive quand les ordures s'entassent, du premier au dernier fait.", ["Les ordures s'entassent", "Les mouches et les rats arrivent", "Les maladies se répandent"], "hyg-ordre:ordures", RANK_HINTS),
  order("Range les gestes pour se brosser les dents, du premier au dernier.", ["Mouiller la brosse", "Mettre la pâte", "Brosser les dents", "Rincer la bouche"], "hyg-ordre:dents", RANK_HINTS),
  order("Range les gestes au retour d'une promenade, du premier au dernier.", ["Enlever ses chaussures", "Se laver les pieds", "Se sécher", "Mettre des vêtements propres"], "hyg-ordre:retour", RANK_HINTS),
  order("Range les gestes pour nettoyer la cour de l'école, du premier au dernier.", ["Prendre un balai", "Balayer la cour", "Ramasser les déchets", "Les jeter dans la poubelle"], "hyg-ordre:cour", RANK_HINTS),
];

const HYG_RELIER: readonly LinkRow[] = [
  link("Relie chaque mot à son sens.", [["Insalubrité", "Ordures et eaux usées"], ["Promiscuité", "Trop de monde serré"], ["Hygiène individuelle", "Propreté de son corps"], ["Hygiène collective", "Propreté du quartier"]]),
  link("Relie chaque maladie à son signe.", [["Gale", "Peau qui démange"], ["Teigne", "Plaques dans les cheveux"], ["Rhume", "Nez qui coule"]]),
  link("Relie chaque objet à son usage.", [["Savon", "Laver les mains"], ["Poubelle", "Jeter les ordures"], ["Brosse à dents", "Protéger la bouche"]]),
  link("Relie chaque danger à ce qui l'attire.", [["Moustiques", "Eau qui stagne"], ["Mouches", "Ordures entassées"], ["Microbes", "Mains sales"]]),
  link("Relie chaque problème à sa solution.", [["Peigne prêté", "Ne pas le prêter"], ["Eau sale", "L'évacuer"], ["Ordures", "À la poubelle"]]),
  link("Relie chaque mot à ce qu'il cause ou protège.", [["Insalubrité", "Cause de maladies"], ["Propreté", "Protège la santé"], ["Promiscuité", "Aide les microbes à passer"]]),
];

const HYG_GLISSER = [
  ...sortRows(
    "Glisse chaque geste dans la bonne case.",
    ["Hygiène individuelle", "Hygiène collective"],
    ["Se laver les mains", "Se doucher", "Couper les ongles", "Se brosser les dents"],
    ["Jeter à la poubelle", "Nettoyer la rue", "Évacuer les eaux usées", "Balayer la cour"],
    SORT_HINTS,
    8,
  ),
  ...sortRows("Glisse chaque mot dans la bonne case.", ["Maladie de la peau", "Maladie des poumons"], ["Gale", "Teigne"], ["Asthme", "Tuberculose", "Rhume"], SORT_HINTS, 8),
  ...sortRows(
    "Glisse chaque geste dans la bonne case.",
    ["Bon geste", "Mauvais geste"],
    ["Se laver les mains", "Jeter à la poubelle", "Boire de l'eau propre", "Aérer sa chambre"],
    ["Jeter dans la rue", "Laisser l'eau stagner", "Prêter son peigne", "Manger avec les mains sales"],
    SORT_HINTS,
    8,
  ),
];

export const makeCm1HygQcm: Make = (ctx) => ce2Question(ctx, "cm1-hyg-qcm", "l'insalubrité, les maladies de la peau et les gestes d'hygiène", HYG_QCM, 3);
export const makeCm1HygTrou: Make = (ctx) => ce2Gap(ctx, "cm1-hyg-trou", "compléter une phrase sur l'hygiène", HYG_TROU, 2, 1);
export const makeCm1HygEcrire: Make = (ctx) => ce2Write(ctx, "cm1-hyg-ecrire", "écrire un fait sur l'hygiène", HYG_ECRIRE, 1, 2);
export const makeCm1HygOrdre: Make = (ctx) => ce2Order(ctx, "cm1-hyg-ordre", "ranger les gestes d'hygiène", HYG_ORDRE);
export const makeCm1HygRelier: Make = (ctx) => ce2Link(ctx, "cm1-hyg-relier", "relier un mot d'hygiène à son sens", HYG_RELIER);
export const makeCm1HygGlisser: Make = (ctx) => ce2Sort(ctx, "cm1-hyg-glisser", "classer les gestes et les maladies", HYG_GLISSER, 2);
