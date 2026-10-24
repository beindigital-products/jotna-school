/**
 * LES GABARITS DU CIVIQUE DU CM2 : la République du Sénégal, ses institutions, les organisations africaines et les organisations
 * internationales (`ci-cm2-republique`, `-institutions`, `-afrique`, `-monde`).
 *
 * Même construction que `cm1Civique.ts` et `cm2Sciences.ts` : des tableaux de faits fermés (`Pool`, `cm1Faits.ts`), les outils de
 * `ce2Outils.ts`, cinq paliers, six gabarits par thématique. Chaque réponse se lit dans un tableau écrit à la main, qui ne dit que ce que
 * la fiche dit, plus des faits de cours que personne ne discute. Aucun nom de personne, aucun chiffre que la fiche ne donne pas.
 *
 * LES PIÈGES DES LOTS PRÉCÉDENTS, TENUS ICI :
 * - une phrase à trou ne met ni article, ni « de », ni « à » devant le trou quand les options changent de genre : l'article est dans l'option ;
 * - toutes les options d'un trou ont la même forme (toutes avec un article, ou aucune) ;
 * - un ordre « de gauche à droite » est refusé par le contrôleur (pas de scène à l'écran) : on range des mots, des niveaux, des étapes ;
 * - un énoncé n'a qu'une apostrophe (« ouest-africain » plutôt que « d'Afrique de l'Ouest ») et jamais de deux-points ;
 * - un énoncé d'ordre dit selon quel critère ; une tuile d'un mot n'a pas d'article (test des images du CI) ;
 * - deux réponses aussi justes pour la même question (la CEDEAO et l'UEMOA, la BOAD et la BAD) ne sont jamais proposées ensemble (`not`) ;
 * - un ordre et un appariement ont cinq lignes au moins, un glissé dix, sans quoi la même question revient à deux paliers ;
 * - un indice n'écrit aucun mot d'une option.
 *
 * MODULE PUR (voir `types.ts`).
 */
import { ce2Gap, ce2Link, ce2Order, ce2Question, ce2Sort, ce2Write, sortRows, type LinkRow, type OrderRow } from "./ce2Outils";
import { RANK_HINTS, SORT_HINTS, gapRows, link, order, questionRows, writeRows, type Pool } from "./cm1Faits";
import type { GameContext, GeneratedGame } from "./shared";

type Make = (ctx: GameContext) => GeneratedGame;

// ===========================================================================
// LA RÉPUBLIQUE DU SÉNÉGAL (ci-cm2-republique)
// ===========================================================================

const REP_SYMBOLES: Pool = {
  items: [
    {
      id: "drapeau",
      q: ["Quel symbole du pays flotte sur les bâtiments officiels ?", "Comment appelle-t-on l'étoffe aux couleurs du pays hissée lors des cérémonies ?"],
      a: "Drapeau",
      also: ["Le drapeau"],
      ga: "le drapeau",
      s: ["Le symbole qui flotte sur les bâtiments officiels est ___.", "Lors des cérémonies, on hisse ___ du pays."],
      hint: "Il se hisse tout en haut d'un mât.",
    },
    {
      id: "hymne",
      q: ["Comment appelle-t-on le chant officiel du pays ?", "Quel symbole du pays se chante debout lors des fêtes nationales ?"],
      a: "Hymne national",
      also: ["Hymne", "L'hymne national"],
      ga: "l'hymne national",
      s: ["Le chant officiel du pays est ___.", "Aux fêtes nationales, on chante debout ___."],
      hint: "On l'écoute en silence, la main sur le cœur.",
    },
    {
      id: "devise",
      q: ["Comment appelle-t-on la courte phrase qui résume l'idéal du pays ?", "Comment appelle-t-on la formule « Un Peuple – Un But – Une Foi » ?"],
      a: "Devise",
      also: ["La devise"],
      ga: "la devise",
      s: ["La phrase qui résume l'idéal du pays est ___.", "« Un Peuple – Un But – Une Foi » est ___ du Sénégal."],
      hint: "Elle tient en trois courts groupes de mots.",
    },
    {
      id: "sceau",
      q: ["Comment appelle-t-on le cachet officiel de la République qui marque les actes importants ?", "Quel symbole de l'État authentifie les documents officiels ?"],
      a: "Sceau",
      also: ["Le sceau"],
      ga: "le sceau",
      s: ["Le cachet officiel de la République s'appelle ___.", "Un acte officiel porte ___ de l'État."],
      hint: "Il laisse une empreinte sur le papier.",
    },
  ],
  extras: ["Passeport", "Calendrier"],
  gextras: ["le passeport", "le calendrier"],
};

const REP_TEXTES: Pool = {
  items: [
    {
      id: "constitution",
      q: ["Comment appelle-t-on la loi la plus importante du pays, qui organise les pouvoirs ?", "Quel texte fixe les règles de base de la République et les droits des citoyens ?"],
      a: "Constitution",
      also: ["La Constitution"],
      ga: "la Constitution",
      s: ["La loi la plus importante du pays est ___.", "Les règles de base de la République sont écrites dans ___."],
      hint: "Toutes les autres lois doivent la respecter.",
    },
    {
      id: "republique",
      q: ["Comment appelle-t-on un pays dont le chef de l'État est élu et ne le devient pas par héritage ?"],
      a: "République",
      also: ["Une République"],
      ga: "une République",
      s: ["Un pays dont le chef de l'État est élu est ___."],
      hint: "Le pouvoir ne passe pas de père en fils.",
    },
    {
      id: "citoyen",
      q: ["Comment appelle-t-on une personne qui a des droits et des devoirs dans son pays ?", "Comment appelle-t-on un habitant qui vote et respecte les lois de son pays ?"],
      a: "Citoyen",
      also: ["Citoyenne", "Un citoyen"],
      ga: "un citoyen",
      s: ["Une personne qui a des droits et des devoirs dans son pays est ___.", "Celui qui vote et respecte les lois est ___."],
      hint: "Chaque habitant du pays peut le devenir.",
    },
  ],
  extras: ["Monarchie", "Règlement"],
  gextras: ["une monarchie", "un règlement"],
};

const REP_DEVISE: Pool = {
  items: [
    {
      id: "devise-texte",
      q: ["Quelle est la devise du Sénégal ?", "Quelle formule résume l'idéal de la République du Sénégal ?"],
      a: "« Un Peuple – Un But – Une Foi »",
      noWrite: true,
      ga: "« Un Peuple – Un But – Une Foi »",
      s: ["La devise du Sénégal est ___.", "Le Sénégal a pour devise ___."],
      hint: "Elle réunit trois idées en une seule phrase.",
    },
  ],
  extras: ["« Liberté – Égalité – Fraternité »", "« Union – Discipline – Travail »"],
  gextras: ["« Liberté – Égalité – Fraternité »", "« Union – Discipline – Travail »"],
};

const REP_COULEURS: Pool = {
  items: [
    {
      id: "couleurs",
      q: ["Quelles sont les trois couleurs du drapeau du Sénégal ?", "De quelles couleurs sont les bandes du drapeau sénégalais ?"],
      a: "Vert, jaune et rouge",
      also: ["Vert, jaune, rouge", "Vert jaune rouge"],
      ga: "vert, jaune et rouge",
      s: ["Le drapeau du Sénégal est ___.", "Les bandes du drapeau sénégalais sont ___."],
      hint: "Elles rappellent celles d'un feu tricolore.",
    },
  ],
  extras: ["Bleu, blanc et rouge", "Noir, jaune et rouge"],
  gextras: ["bleu, blanc et rouge", "noir, jaune et rouge"],
};

const REP_ETOILE: Pool = {
  items: [
    {
      id: "etoile",
      q: ["De quelle couleur est l'étoile au centre du drapeau du Sénégal ?", "Quelle est la couleur de l'étoile du drapeau sénégalais ?"],
      a: "Verte",
      also: ["Vert", "Une étoile verte"],
      ga: "verte",
      s: ["L'étoile du drapeau du Sénégal est ___.", "Au centre du drapeau brille une étoile ___."],
      hint: "C'est la couleur de la bande de gauche.",
    },
  ],
  extras: ["Rouge", "Jaune"],
  gextras: ["rouge", "jaune"],
};

const REP_POOLS = [REP_SYMBOLES, REP_TEXTES, REP_DEVISE, REP_COULEURS, REP_ETOILE] as const;
const REP_QCM = questionRows("ci-cm2-republique", REP_POOLS);
const REP_TROU = gapRows("ci-cm2-republique", REP_POOLS);
const REP_ECRIRE = writeRows("ci-cm2-republique", REP_POOLS);

const REP_ORDRE: readonly OrderRow[] = [
  order("Range les trois mots de la devise, du premier au dernier.", ["Peuple", "But", "Foi"], "rep-ordre:devise", RANK_HINTS),
  order("Range les trois mots de la devise, du dernier au premier.", ["Foi", "But", "Peuple"], "rep-ordre:devise-envers", RANK_HINTS),
  order("Range ces niveaux du pays, du plus petit au plus grand.", ["Commune", "Département", "Région", "Pays"], "rep-ordre:petit", RANK_HINTS),
  order("Range ces niveaux du pays, du plus petit au plus grand.", ["Commune", "Département", "Région"], "rep-ordre:sans-pays", RANK_HINTS),
  order("Range ces niveaux du pays, du plus petit au plus grand.", ["Département", "Région", "Pays"], "rep-ordre:sans-commune", RANK_HINTS),
  order("Range ces niveaux du pays, du plus grand au plus petit.", ["Pays", "Région", "Département", "Commune"], "rep-ordre:grand", RANK_HINTS),
];

const REP_RELIER: readonly LinkRow[] = [
  link("Relie chaque symbole à son rôle.", [["Drapeau", "Flotte aux cérémonies"], ["Hymne national", "Se chante debout"], ["Devise", "Résume l'idéal du pays"], ["Sceau", "Marque les actes officiels"]]),
  link("Relie chaque symbole à son rôle.", [["Drapeau", "Flotte aux cérémonies"], ["Devise", "Résume l'idéal du pays"], ["Sceau", "Marque les actes officiels"]]),
  link("Relie chaque symbole à son rôle.", [["Hymne national", "Se chante debout"], ["Devise", "Résume l'idéal du pays"], ["Sceau", "Marque les actes officiels"]]),
  link("Relie chaque mot à ce qu'il désigne.", [["Constitution", "Loi la plus importante"], ["République", "Chef de l'État élu"], ["Citoyen", "Droits et devoirs"]]),
  link("Relie chaque couleur à sa place sur le drapeau.", [["Vert", "Bande de gauche"], ["Jaune", "Bande du milieu"], ["Rouge", "Bande de droite"]]),
];

const REP_GLISSER = [
  ...sortRows(
    "Glisse chaque élément dans la bonne case.",
    ["Symbole du pays", "Règle ou loi"],
    ["Drapeau", "Hymne national", "Devise", "Sceau"],
    ["Constitution", "Droits du citoyen", "Devoirs du citoyen"],
    SORT_HINTS,
    8,
  ),
  ...sortRows("Glisse chaque mot dans la bonne case.", ["Couleur du drapeau", "Mot de la devise"], ["Vert", "Jaune", "Rouge"], ["Peuple", "But", "Foi"], SORT_HINTS, 8),
];

export const makeCm2RepQcm: Make = (ctx) => ce2Question(ctx, "cm2-rep-qcm", "les symboles de la République du Sénégal, sa Constitution et son drapeau", REP_QCM, 3);
export const makeCm2RepTrou: Make = (ctx) => ce2Gap(ctx, "cm2-rep-trou", "compléter une phrase sur les symboles de la République", REP_TROU, 2, 1);
export const makeCm2RepEcrire: Make = (ctx) => ce2Write(ctx, "cm2-rep-ecrire", "écrire un mot de la République", REP_ECRIRE, 1, 2);
export const makeCm2RepOrdre: Make = (ctx) => ce2Order(ctx, "cm2-rep-ordre", "ranger les mots de la devise ou les niveaux du pays", REP_ORDRE);
export const makeCm2RepRelier: Make = (ctx) => ce2Link(ctx, "cm2-rep-relier", "relier un symbole ou un mot de la République à son rôle", REP_RELIER);
export const makeCm2RepGlisser: Make = (ctx) => ce2Sort(ctx, "cm2-rep-glisser", "classer les symboles de la République, ses règles et la devise", REP_GLISSER, 2);

// ===========================================================================
// LES INSTITUTIONS DE LA RÉPUBLIQUE (ci-cm2-institutions)
// ===========================================================================

const INS_INSTITUTION: Pool = {
  items: [
    {
      id: "president",
      q: ["Qui est élu par tous les citoyens pour diriger le pays ?", "Comment appelle-t-on le chef de l'État, élu au suffrage universel ?"],
      a: "Président de la République",
      also: ["Le Président de la République", "Président", "Le Président"],
      ga: "le Président de la République",
      s: ["Le chef de l'État, élu par les citoyens, est ___.", "Les citoyens votent pour choisir ___."],
      hint: "Un vote de tout le pays le place à la tête de l'État.",
    },
    {
      id: "gouvernement",
      q: ["Quel ensemble réunit le Premier ministre et les ministres ?", "Comment appelle-t-on l'équipe formée par le Premier ministre et les ministres ?"],
      a: "Gouvernement",
      also: ["Le Gouvernement"],
      ga: "le Gouvernement",
      s: ["Le Premier ministre et les ministres forment ___.", "Les ministres travaillent ensemble dans ___."],
      hint: "Chaque membre s'occupe d'un domaine différent.",
    },
    {
      id: "assemblee",
      q: ["Quelle institution réunit les députés qui votent les lois ?", "Où siègent les députés du pays ?"],
      a: "Assemblée nationale",
      also: ["L'Assemblée nationale", "Assemblée"],
      ga: "l'Assemblée nationale",
      s: ["Les députés votent les lois à ___.", "Les élus qui votent les lois siègent à ___."],
      hint: "C'est la maison des élus du peuple.",
    },
    {
      id: "tribunaux",
      q: ["Quelles institutions rendent la justice ?", "Où un juge décide qui a raison et qui a tort ?"],
      a: "Cours et tribunaux",
      also: ["Tribunaux", "Les tribunaux", "Tribunal", "Les cours et tribunaux"],
      ga: "les cours et tribunaux",
      s: ["La justice est rendue par ___.", "Un juge siège dans ___."],
      hint: "Les affaires y sont jugées selon la loi.",
    },
  ],
  extras: ["Conseil municipal", "Préfecture"],
  gextras: ["le conseil municipal", "la préfecture"],
};

const INS_PERSONNE: Pool = {
  items: [
    {
      id: "premier",
      q: ["Qui dirige le Gouvernement ?", "Comment appelle-t-on le chef du Gouvernement ?"],
      a: "Premier ministre",
      also: ["Le Premier ministre", "Premier Ministre"],
      not: ["Ministre"],
      ga: "le Premier ministre",
      s: ["Le chef du Gouvernement est ___.", "Les ministres travaillent sous la direction de ___."],
      hint: "Il coordonne le travail de toute l'équipe.",
    },
    {
      id: "depute",
      q: ["Comment appelle-t-on un membre de l'Assemblée nationale ?", "Qui vote les lois à l'Assemblée nationale ?"],
      a: "Député",
      also: ["Un député", "Députée", "Le député"],
      ga: "un député",
      s: ["Un membre de l'Assemblée nationale est ___.", "Celui qui vote les lois est ___."],
      hint: "Les électeurs l'ont choisi pour parler en leur nom.",
    },
    {
      id: "ministre",
      q: ["Comment appelle-t-on un membre du Gouvernement chargé d'un domaine, comme la santé ?"],
      a: "Ministre",
      also: ["Un ministre", "Ministre de la santé"],
      not: ["Premier ministre"],
      ga: "un ministre",
      s: ["Un membre du Gouvernement chargé de la santé est ___."],
      hint: "Il dirige un grand domaine de la vie du pays.",
    },
    {
      id: "juge",
      q: ["Comment appelle-t-on la personne qui rend la justice dans un tribunal ?", "Qui décide qui a raison dans un procès ?"],
      a: "Juge",
      also: ["Un juge", "Le juge"],
      ga: "un juge",
      s: ["La personne qui rend la justice dans un tribunal est ___.", "Dans un procès, c'est ___ qui décide."],
      hint: "Il écoute chacun avant de décider.",
    },
  ],
  extras: ["Maire", "Préfet"],
  gextras: ["le maire", "le préfet"],
};

const INS_ACTION: Pool = {
  items: [
    {
      id: "lois",
      q: ["Que font les députés à l'Assemblée nationale ?", "Quel est le rôle des députés ?"],
      a: "Voter les lois",
      also: ["Voter des lois", "Voter la loi"],
      ga: "voter les lois",
      s: ["Le rôle des députés est de ___.", "À l'Assemblée nationale, on vient pour ___."],
      hint: "Ils décident de ce qui devient obligatoire pour tous.",
    },
    {
      id: "justice",
      q: ["Que font les cours et tribunaux ?", "Quel est le rôle d'un juge ?"],
      a: "Rendre la justice",
      also: ["Juger", "Rendre justice", "Juger les affaires"],
      ga: "rendre la justice",
      s: ["Le rôle des tribunaux est de ___.", "Un juge a pour mission de ___."],
      hint: "Il tranche quand deux personnes s'opposent devant la loi.",
    },
  ],
  extras: ["Soigner les malades", "Cultiver les champs"],
  gextras: ["soigner les malades", "cultiver les champs"],
};

const INS_ELECTION: Pool = {
  items: [
    {
      id: "election",
      q: ["Comment le Président de la République est-il choisi ?", "Comment devient-on Président de la République ?"],
      a: "Par un vote de tous les citoyens",
      also: ["Au suffrage universel", "Suffrage universel", "Élu par tous les citoyens", "Par le suffrage universel"],
      noWrite: true,
      ga: "par un vote de tous les citoyens",
      s: ["Le Président de la République est choisi ___.", "Au Sénégal, le Président est élu ___."],
      hint: "Chacun glisse un bulletin dans l'urne.",
    },
  ],
  extras: ["Par tirage au sort", "Par un vote des juges"],
  gextras: ["par tirage au sort", "par un vote des juges"],
};

const INS_POOLS = [INS_INSTITUTION, INS_PERSONNE, INS_ACTION, INS_ELECTION] as const;
const INS_QCM = questionRows("ci-cm2-institutions", INS_POOLS);
const INS_TROU = gapRows("ci-cm2-institutions", INS_POOLS);
const INS_ECRIRE = writeRows("ci-cm2-institutions", INS_POOLS);

const INS_ORDRE: readonly OrderRow[] = [
  order("Range ces étapes d'une élection, de la première à la dernière.", ["Faire campagne", "Voter", "Compter les voix", "Proclamer le résultat"], "ins-ordre:election"),
  order("Range ces étapes d'une élection, de la première à la dernière.", ["Faire campagne", "Voter", "Proclamer le résultat"], "ins-ordre:sans-compte"),
  order("Range ces étapes d'une élection, de la première à la dernière.", ["Faire campagne", "Compter les voix", "Proclamer le résultat"], "ins-ordre:sans-vote"),
  order("Range ces étapes d'une élection, de la première à la dernière.", ["Voter", "Compter les voix", "Proclamer le résultat"], "ins-ordre:sans-campagne"),
  order("Range ces étapes d'une élection, de la première à la dernière.", ["Faire campagne", "Voter", "Compter les voix"], "ins-ordre:sans-resultat"),
  order("Range ces étapes pour devenir Président, de la première à la dernière.", ["Être candidat", "Faire campagne", "Être élu", "Diriger le pays"], "ins-ordre:devenir"),
];

const INS_RELIER: readonly LinkRow[] = [
  link("Relie chaque institution à son rôle.", [["Président de la République", "Chef de l'État élu"], ["Gouvernement", "Premier ministre et ministres"], ["Assemblée nationale", "Députés qui votent les lois"], ["Cours et tribunaux", "Juges qui rendent la justice"]]),
  link("Relie chaque institution à son rôle.", [["Président de la République", "Chef de l'État élu"], ["Assemblée nationale", "Députés qui votent les lois"], ["Cours et tribunaux", "Juges qui rendent la justice"]]),
  link("Relie chaque institution à son rôle.", [["Gouvernement", "Premier ministre et ministres"], ["Assemblée nationale", "Députés qui votent les lois"], ["Cours et tribunaux", "Juges qui rendent la justice"]]),
  link("Relie chaque personne à sa fonction.", [["Premier ministre", "Chef du Gouvernement"], ["Ministre", "Dirige un domaine"], ["Député", "Vote les lois"], ["Juge", "Rend la justice"]]),
  link("Relie chaque personne à sa fonction.", [["Ministre", "Dirige un domaine"], ["Député", "Vote les lois"], ["Juge", "Rend la justice"]]),
  link("Relie chaque rôle à celui qui le tient.", [["Voter les lois", "Députés"], ["Rendre la justice", "Juges"], ["Élire le Président", "Citoyens"]]),
];

const INS_GLISSER = [
  ...sortRows(
    "Glisse chaque action dans la bonne case.",
    ["Assemblée nationale", "Cours et tribunaux"],
    ["Voter une loi", "Discuter d'une loi", "Siéger comme député"],
    ["Juger une affaire", "Rendre la justice", "Écouter un témoin"],
    SORT_HINTS,
    8,
  ),
  ...sortRows(
    "Glisse chaque élément dans la bonne case.",
    ["Gouvernement", "Assemblée nationale"],
    ["Premier ministre", "Ministre de la santé", "Ministre de l'éducation"],
    ["Député", "Séance des députés", "Vote d'une loi"],
    SORT_HINTS,
    8,
  ),
];

export const makeCm2InsQcm: Make = (ctx) => ce2Question(ctx, "cm2-ins-qcm", "les institutions de la République : le Président, le Gouvernement, l'Assemblée nationale et la justice", INS_QCM, 3);
export const makeCm2InsTrou: Make = (ctx) => ce2Gap(ctx, "cm2-ins-trou", "compléter une phrase sur les institutions de la République", INS_TROU, 2, 1);
export const makeCm2InsEcrire: Make = (ctx) => ce2Write(ctx, "cm2-ins-ecrire", "écrire le nom d'une institution ou de ceux qui la tiennent", INS_ECRIRE, 1, 2);
export const makeCm2InsOrdre: Make = (ctx) => ce2Order(ctx, "cm2-ins-ordre", "ranger les étapes d'une élection", INS_ORDRE);
export const makeCm2InsRelier: Make = (ctx) => ce2Link(ctx, "cm2-ins-relier", "relier une institution ou une personne à son rôle", INS_RELIER);
export const makeCm2InsGlisser: Make = (ctx) => ce2Sort(ctx, "cm2-ins-glisser", "classer ce qui revient à chaque institution", INS_GLISSER, 2);

// ===========================================================================
// LES ORGANISATIONS AFRICAINES (ci-cm2-afrique)
// ===========================================================================

const AFR_OUEST: Pool = {
  items: [
    {
      id: "cedeao",
      q: ["Quelle communauté regroupe les pays ouest-africains pour coopérer ?", "Quelle organisation réunit des pays ouest-africains dans une communauté économique ?"],
      a: "CEDEAO",
      also: ["La CEDEAO"],
      not: ["UEMOA"],
      ga: "la CEDEAO",
      s: ["Les pays ouest-africains coopèrent au sein de ___.", "Pour coopérer, des pays ouest-africains forment ___."],
      hint: "Son nom parle d'une communauté économique de pays voisins.",
    },
    {
      id: "uemoa",
      q: ["Quelle union ouest-africaine partage une même monnaie, le franc CFA ?", "Quelle organisation réunit des pays qui utilisent le même franc CFA ?"],
      a: "UEMOA",
      also: ["L'UEMOA"],
      not: ["CEDEAO"],
      ga: "l'UEMOA",
      s: ["Les pays qui partagent le franc CFA forment ___.", "Une même monnaie unit les pays membres de ___."],
      hint: "Ses membres ont un même billet dans la poche.",
    },
    {
      id: "omvs",
      q: ["Quelle organisation gère ensemble le fleuve Sénégal ?", "Quelle organisation met en valeur le fleuve Sénégal pour ses pays riverains ?"],
      a: "OMVS",
      also: ["L'OMVS"],
      ga: "l'OMVS",
      s: ["Le fleuve Sénégal est géré par ___.", "Les pays riverains du fleuve Sénégal se sont unis dans ___."],
      hint: "Ses pays se partagent les eaux d'un même fleuve.",
    },
    {
      id: "omvg",
      q: ["Quelle organisation gère ensemble le fleuve Gambie ?", "Quelle organisation met en valeur le fleuve Gambie pour ses pays riverains ?"],
      a: "OMVG",
      also: ["L'OMVG"],
      ga: "l'OMVG",
      s: ["Le fleuve Gambie est géré par ___.", "Les pays riverains du fleuve Gambie se sont unis dans ___."],
      hint: "Son fleuve rejoint l'océan au sud de Dakar.",
    },
    {
      id: "cilss",
      q: ["Quelle organisation lutte contre la sécheresse ?", "Quelle organisation aide les pays du Sahel à lutter contre la sécheresse ?"],
      a: "CILSS",
      also: ["Le CILSS"],
      ga: "le CILSS",
      s: ["La lutte contre la sécheresse est menée par ___.", "Les pays du Sahel luttent ensemble contre la sécheresse avec ___."],
      hint: "Son combat porte sur le manque de pluie.",
    },
  ],
  extras: ["ONU", "FIFA"],
  gextras: ["l'ONU", "la FIFA"],
};

const AFR_BANQUE: Pool = {
  items: [
    {
      id: "bceao",
      q: ["Quelle banque centrale des États ouest-africains a son siège à Dakar ?", "Quelle banque émet la monnaie commune des pays de l'UEMOA ?"],
      a: "BCEAO",
      also: ["La BCEAO"],
      ga: "la BCEAO",
      s: ["La banque centrale des États ouest-africains, installée à Dakar, est ___.", "À Dakar se trouve le siège de ___."],
      hint: "Elle veille sur la monnaie de plusieurs pays voisins.",
    },
    {
      id: "boad",
      q: ["Quelle banque finance le développement des pays ouest-africains ?", "Quelle banque ouest-africaine prête de l'argent pour des projets de développement ?"],
      a: "BOAD",
      also: ["La BOAD"],
      not: ["BAD"],
      ga: "la BOAD",
      s: ["Pour financer leur développement, les pays ouest-africains ont créé ___.", "La banque ouest-africaine de développement s'appelle ___."],
      hint: "Son nom rappelle l'ouest du continent.",
    },
    {
      id: "bad",
      q: ["Quelle banque finance le développement de tous les pays africains ?", "Quelle banque africaine soutient des projets dans tout le continent ?"],
      a: "BAD",
      also: ["La BAD"],
      not: ["BOAD"],
      ga: "la BAD",
      s: ["Pour financer des projets dans toute l'Afrique, on peut compter sur ___.", "La banque africaine de développement s'appelle ___."],
      hint: "Son champ d'action couvre tout le continent.",
    },
  ],
  extras: ["Caisse d'épargne", "Banque postale"],
  gextras: ["la caisse d'épargne", "la banque postale"],
};

const AFR_CONTINENT: Pool = {
  items: [
    {
      id: "ua",
      q: ["Quelle organisation réunit les pays du continent africain et a son siège à Addis-Abeba ?", "Quelle organisation rassemble les États africains et siège à Addis-Abeba ?"],
      a: "Union africaine",
      also: ["UA", "L'Union africaine"],
      ga: "l'Union africaine",
      s: ["Les États africains se réunissent dans ___.", "Le siège de ___ se trouve à Addis-Abeba."],
      hint: "Son siège est dans la capitale d'un pays de l'Est.",
    },
    {
      id: "caf",
      q: ["Quelle confédération africaine organise le football du continent ?", "Quelle confédération africaine dirige le football en Afrique ?"],
      a: "CAF",
      also: ["La CAF"],
      ga: "la CAF",
      s: ["Le football du continent africain est dirigé par ___.", "Les compétitions africaines de football sont organisées par ___."],
      hint: "Son sport se joue avec un ballon rond.",
    },
  ],
  extras: ["ONU", "FIFA"],
  gextras: ["l'ONU", "la FIFA"],
};

const AFR_POOLS = [AFR_OUEST, AFR_BANQUE, AFR_CONTINENT] as const;
const AFR_QCM = questionRows("ci-cm2-afrique", AFR_POOLS);
const AFR_TROU = gapRows("ci-cm2-afrique", AFR_POOLS);
const AFR_ECRIRE = writeRows("ci-cm2-afrique", AFR_POOLS);

const AFR_ORDRE: readonly OrderRow[] = [
  order("Range ces ensembles, du plus petit au plus grand.", ["Sénégal", "Afrique de l'Ouest", "Afrique", "Monde"], "afr-ordre:petit", RANK_HINTS),
  order("Range ces ensembles, du plus petit au plus grand.", ["Sénégal", "Afrique de l'Ouest", "Afrique"], "afr-ordre:sans-monde", RANK_HINTS),
  order("Range ces ensembles, du plus petit au plus grand.", ["Sénégal", "Afrique", "Monde"], "afr-ordre:sans-ouest", RANK_HINTS),
  order("Range ces ensembles, du plus petit au plus grand.", ["Afrique de l'Ouest", "Afrique", "Monde"], "afr-ordre:sans-senegal", RANK_HINTS),
  order("Range ces ensembles, du plus petit au plus grand.", ["Sénégal", "Afrique de l'Ouest", "Monde"], "afr-ordre:sans-afrique", RANK_HINTS),
  order("Range ces ensembles, du plus grand au plus petit.", ["Monde", "Afrique", "Afrique de l'Ouest", "Sénégal"], "afr-ordre:grand", RANK_HINTS),
];

const AFR_RELIER: readonly LinkRow[] = [
  link("Relie chaque organisation à ce qu'elle fait.", [["OMVS", "Fleuve Sénégal"], ["OMVG", "Fleuve Gambie"], ["CILSS", "Lutte contre la sécheresse"]]),
  link("Relie chaque organisation à ce qu'elle fait.", [["BCEAO", "Banque centrale à Dakar"], ["Union africaine", "Siège à Addis-Abeba"], ["CAF", "Football africain"]]),
  link("Relie chaque organisation à ce qu'elle fait.", [["CEDEAO", "Coopération ouest-africaine"], ["OMVS", "Fleuve Sénégal"], ["CILSS", "Lutte contre la sécheresse"]]),
  link("Relie chaque organisation à ce qu'elle fait.", [["UEMOA", "Même monnaie"], ["CAF", "Football africain"], ["Union africaine", "Siège à Addis-Abeba"]]),
  link("Relie chaque banque à ce qu'elle fait.", [["BAD", "Développement de tout le continent"], ["BOAD", "Développement de l'Ouest"], ["BCEAO", "Banque centrale à Dakar"]]),
];

const AFR_GLISSER = [
  ...sortRows(
    "Glisse chaque organisation dans la bonne case.",
    ["Afrique de l'Ouest", "Toute l'Afrique"],
    ["CEDEAO", "UEMOA", "OMVS", "OMVG", "BCEAO", "BOAD"],
    ["Union africaine", "BAD", "CAF"],
    SORT_HINTS,
    8,
  ),
  ...sortRows("Glisse chaque organisation dans la bonne case.", ["Banque", "Pas une banque"], ["BCEAO", "BOAD", "BAD"], ["OMVS", "OMVG", "CAF", "Union africaine"], SORT_HINTS, 8),
];

export const makeCm2AfrQcm: Make = (ctx) => ce2Question(ctx, "cm2-afr-qcm", "les organisations africaines : coopération, fleuves, banques, Union africaine et football", AFR_QCM, 3);
export const makeCm2AfrTrou: Make = (ctx) => ce2Gap(ctx, "cm2-afr-trou", "compléter une phrase sur les organisations africaines", AFR_TROU, 2, 1);
export const makeCm2AfrEcrire: Make = (ctx) => ce2Write(ctx, "cm2-afr-ecrire", "écrire le sigle d'une organisation africaine", AFR_ECRIRE, 1, 2);
export const makeCm2AfrOrdre: Make = (ctx) => ce2Order(ctx, "cm2-afr-ordre", "ranger le Sénégal, l'Afrique de l'Ouest, l'Afrique et le monde", AFR_ORDRE);
export const makeCm2AfrRelier: Make = (ctx) => ce2Link(ctx, "cm2-afr-relier", "relier une organisation africaine à ce qu'elle fait", AFR_RELIER);
export const makeCm2AfrGlisser: Make = (ctx) => ce2Sort(ctx, "cm2-afr-glisser", "classer les organisations africaines", AFR_GLISSER, 2);

// ===========================================================================
// LES ORGANISATIONS INTERNATIONALES (ci-cm2-monde)
// ===========================================================================

const MON_AGENCE: Pool = {
  items: [
    {
      id: "unicef",
      q: ["Quelle agence de l'ONU protège les enfants du monde ?", "Quelle agence onusienne aide les enfants ?"],
      a: "UNICEF",
      also: ["L'UNICEF"],
      ga: "l'UNICEF",
      s: ["Pour les enfants du monde, l'ONU a créé ___.", "L'agence qui protège les enfants est ___."],
      hint: "Son nom rappelle l'enfance.",
    },
    {
      id: "unesco",
      q: ["Quelle agence onusienne développe l'éducation et la culture ?", "Quelle agence onusienne défend l'éducation et la culture dans le monde ?"],
      a: "UNESCO",
      also: ["L'UNESCO"],
      ga: "l'UNESCO",
      s: ["L'éducation et la culture dans le monde sont défendues par ___.", "Pour la culture et l'éducation, on compte sur ___."],
      hint: "Elle protège les savoirs et les trésors des peuples.",
    },
    {
      id: "fao",
      q: ["Quelle agence onusienne lutte pour l'alimentation du monde ?", "Quelle agence onusienne aide à nourrir le monde ?"],
      a: "FAO",
      also: ["La FAO"],
      ga: "la FAO",
      s: ["L'alimentation du monde est suivie par ___.", "Pour nourrir le monde, l'ONU a créé ___."],
      hint: "Elle veille sur les champs, les récoltes et les repas.",
    },
    {
      id: "oms",
      q: ["Quelle agence onusienne veille sur la santé dans le monde ?", "Quelle agence onusienne lutte contre les maladies dans le monde ?"],
      a: "OMS",
      also: ["L'OMS"],
      ga: "l'OMS",
      s: ["La santé dans le monde est suivie par ___.", "Pour lutter contre les maladies, on compte sur ___."],
      hint: "Ses médecins surveillent les épidémies.",
    },
    {
      id: "hcr",
      q: ["Quelle agence onusienne protège les réfugiés ?", "Quelle agence onusienne aide les personnes qui ont dû fuir leur pays ?"],
      a: "HCR",
      also: ["Le HCR"],
      ga: "le HCR",
      s: ["Les réfugiés sont protégés par ___.", "Pour aider ceux qui ont fui leur pays, l'ONU a créé ___."],
      hint: "Elle offre un abri à ceux qui fuient la guerre.",
    },
    {
      id: "oit",
      q: ["Quelle agence onusienne s'occupe du travail ?", "Quelle agence onusienne défend les droits des travailleurs ?"],
      a: "OIT",
      also: ["L'OIT"],
      ga: "l'OIT",
      s: ["Le travail dans le monde est suivi par ___.", "Les droits des travailleurs sont défendus par ___."],
      hint: "Elle veut que chacun gagne sa vie dans de bonnes conditions.",
    },
    {
      id: "fnuap",
      q: ["Quelle agence onusienne s'occupe de la population ?", "Quelle agence onusienne suit l'évolution de la population mondiale ?"],
      a: "FNUAP",
      also: ["Le FNUAP"],
      ga: "le FNUAP",
      s: ["La population mondiale est suivie par ___.", "Pour la population du monde, l'ONU a créé ___."],
      hint: "Elle compte les habitants de la planète.",
    },
    {
      id: "omc",
      q: ["Quelle organisation mondiale s'occupe du commerce ?", "Quelle organisation règle les échanges commerciaux entre les pays ?"],
      a: "OMC",
      also: ["L'OMC"],
      ga: "l'OMC",
      s: ["Le commerce entre les pays est suivi par ___.", "Pour les échanges commerciaux, on compte sur ___."],
      hint: "Elle veille aux échanges de marchandises entre les pays.",
    },
  ],
  extras: ["CIO", "FIFA"],
  gextras: ["le CIO", "la FIFA"],
};

const MON_AUTRE: Pool = {
  items: [
    {
      id: "onu",
      q: ["Quelle organisation mondiale réunit les pays du monde pour travailler à la paix ?", "Quelle organisation mondiale compte des agences comme l'UNICEF ou la FAO ?"],
      a: "ONU",
      also: ["L'ONU"],
      ga: "l'ONU",
      s: ["Les pays du monde se réunissent dans ___ pour la paix.", "Les agences de santé et d'éducation dépendent de ___."],
      hint: "Ses agences travaillent dans le monde entier.",
    },
    {
      id: "cicr",
      q: ["Quelle organisation internationale secourt les victimes des guerres et des catastrophes ?", "Quelle organisation internationale soigne les blessés des conflits partout dans le monde ?"],
      a: "CICR",
      also: ["Croix-Rouge", "La Croix-Rouge", "Le CICR"],
      ga: "le CICR",
      s: ["Pour secourir les victimes des guerres, on compte sur ___.", "Les blessés des conflits sont soignés par ___."],
      hint: "Son emblème est connu sur les ambulances.",
    },
    {
      id: "fifa",
      q: ["Quelle organisation dirige le football dans le monde ?", "Quelle organisation mondiale organise la Coupe du monde de football ?"],
      a: "FIFA",
      also: ["La FIFA"],
      ga: "la FIFA",
      s: ["Le football mondial est dirigé par ___.", "La Coupe du monde de football est organisée par ___."],
      hint: "Son ballon rond fait vibrer toute la planète.",
    },
    {
      id: "cio",
      q: ["Quelle organisation internationale organise les Jeux olympiques ?", "Quelle organisation mondiale dirige le mouvement olympique ?"],
      a: "CIO",
      also: ["Le CIO"],
      ga: "le CIO",
      s: ["Les Jeux olympiques sont organisés par ___.", "Le mouvement olympique est dirigé par ___."],
      hint: "Ses anneaux sont connus sur tous les continents.",
    },
  ],
  extras: ["OMC", "OIT"],
  gextras: ["l'OMC", "l'OIT"],
};

const MON_JOJ: Pool = {
  items: [
    {
      id: "dakar",
      q: ["Quelle ville accueille les Jeux olympiques de la jeunesse en 2026 ?", "Dans quelle ville se tiennent les Jeux olympiques de la jeunesse en 2026 ?"],
      a: "Dakar",
      ga: "Dakar",
      s: ["Les Jeux olympiques de la jeunesse de 2026 ont lieu à ___.", "En 2026, les jeunes sportifs du monde se retrouvent à ___."],
      hint: "C'est la capitale du Sénégal.",
    },
  ],
  extras: ["Abidjan", "Bamako"],
  gextras: ["Abidjan", "Bamako"],
};

const MON_JUMELAGE: Pool = {
  items: [
    {
      id: "jumelage",
      q: ["Comment appelle-t-on l'amitié officielle entre deux villes de pays différents ?", "Quel mot désigne le lien d'échange entre deux villes de pays différents ?"],
      a: "Jumelage",
      also: ["Le jumelage", "Villes jumelées"],
      ga: "le jumelage",
      s: ["Une amitié officielle entre deux villes de pays différents s'appelle ___.", "Pour unir deux villes de pays différents, on organise ___."],
      hint: "Deux cités s'unissent au-delà des frontières.",
    },
  ],
  extras: ["Commerce", "Voyage"],
  gextras: ["le commerce", "le voyage"],
};

const MON_POOLS = [MON_AGENCE, MON_AUTRE, MON_JOJ, MON_JUMELAGE] as const;
const MON_QCM = questionRows("ci-cm2-monde", MON_POOLS);
const MON_TROU = gapRows("ci-cm2-monde", MON_POOLS);
const MON_ECRIRE = writeRows("ci-cm2-monde", MON_POOLS);

const MON_ORDRE: readonly OrderRow[] = [
  order("Range ces échelons, du plus petit au plus grand.", ["Quartier", "Ville", "Pays", "Monde"], "mon-ordre:petit", RANK_HINTS),
  order("Range ces échelons, du plus petit au plus grand.", ["Quartier", "Ville", "Pays"], "mon-ordre:sans-monde", RANK_HINTS),
  order("Range ces échelons, du plus petit au plus grand.", ["Quartier", "Ville", "Monde"], "mon-ordre:sans-pays", RANK_HINTS),
  order("Range ces échelons, du plus petit au plus grand.", ["Quartier", "Pays", "Monde"], "mon-ordre:sans-ville", RANK_HINTS),
  order("Range ces échelons, du plus petit au plus grand.", ["Ville", "Pays", "Monde"], "mon-ordre:sans-quartier", RANK_HINTS),
  order("Range ces échelons, du plus grand au plus petit.", ["Monde", "Pays", "Ville", "Quartier"], "mon-ordre:grand", RANK_HINTS),
];

const MON_RELIER: readonly LinkRow[] = [
  link("Relie chaque agence à son domaine.", [["UNICEF", "Enfants"], ["OMS", "Santé"], ["FAO", "Alimentation"], ["HCR", "Réfugiés"]]),
  link("Relie chaque agence à son domaine.", [["OIT", "Travail"], ["OMC", "Commerce"], ["FNUAP", "Population"], ["UNESCO", "Éducation et culture"]]),
  link("Relie chaque agence à son domaine.", [["UNICEF", "Enfants"], ["UNESCO", "Éducation et culture"], ["OMS", "Santé"]]),
  link("Relie chaque agence à son domaine.", [["FAO", "Alimentation"], ["OIT", "Travail"], ["HCR", "Réfugiés"]]),
  link("Relie chaque organisation à ce qu'elle fait.", [["CIO", "Jeux olympiques"], ["FIFA", "Football mondial"], ["CICR", "Croix-Rouge"]]),
  link("Relie chaque agence à son domaine.", [["FNUAP", "Population"], ["OMC", "Commerce"], ["UNICEF", "Enfants"]]),
];

const MON_GLISSER = [
  ...sortRows(
    "Glisse chaque organisation dans la bonne case.",
    ["Agence de l'ONU", "Hors de l'ONU"],
    ["UNICEF", "UNESCO", "FAO", "OMS", "HCR"],
    ["FIFA", "CIO", "CICR"],
    SORT_HINTS,
    8,
  ),
  ...sortRows("Glisse chaque mot dans la bonne case.", ["Sport", "Aide aux personnes"], ["FIFA", "CIO", "Coupe du monde", "Jeux olympiques"], ["CICR", "HCR", "UNICEF"], SORT_HINTS, 8),
];

export const makeCm2MonQcm: Make = (ctx) => ce2Question(ctx, "cm2-mon-qcm", "l'ONU et ses agences, la Croix-Rouge, la FIFA, le CIO et le jumelage des villes", MON_QCM, 3);
export const makeCm2MonTrou: Make = (ctx) => ce2Gap(ctx, "cm2-mon-trou", "compléter une phrase sur les organisations internationales", MON_TROU, 2, 1);
export const makeCm2MonEcrire: Make = (ctx) => ce2Write(ctx, "cm2-mon-ecrire", "écrire le sigle d'une organisation internationale", MON_ECRIRE, 1, 2);
export const makeCm2MonOrdre: Make = (ctx) => ce2Order(ctx, "cm2-mon-ordre", "ranger le quartier, la ville, le pays et le monde", MON_ORDRE);
export const makeCm2MonRelier: Make = (ctx) => ce2Link(ctx, "cm2-mon-relier", "relier une organisation internationale à son domaine", MON_RELIER);
export const makeCm2MonGlisser: Make = (ctx) => ce2Sort(ctx, "cm2-mon-glisser", "classer les organisations internationales", MON_GLISSER, 2);
