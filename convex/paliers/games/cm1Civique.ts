/**
 * LES GABARITS DU CIVIQUE DU CM1 : prévenir les conflits par le dialogue, la coopérative et le gouvernement scolaire, la commune et
 * l'État, les organisations du quartier (`ci-cm1-dialogue`, `-ecole`, `-commune`, `-associations`).
 *
 * Ce que le modèle écrivait ici mélangeait les institutions (un préfet élu, un maire nommé, une coopérative qui vend des médicaments).
 * Chaque réponse se lit dans un tableau fermé, écrit à la main, qui ne dit que ce que la fiche dit : qui dirige la commune, qui
 * représente l'État dans une région, un département, un arrondissement, à quoi sert une association de quartier, comment on règle un
 * conflit. Aucun chiffre (nombre de communes, de régions, de conseillers), aucune loi, aucun nom de personne.
 *
 * LE TABLEAU, PUIS LES LIGNES : voir `cm1Faits.ts` (un fait, ses façons de le demander, sa phrase à trou, son indice). Les mauvais
 * choix d'un fait sont les réponses des autres faits de son lot et ses intrus ; une réponse aussi juste (`not`) n'est jamais proposée.
 * Les suites (étapes d'une réunion, d'un vote, d'une médiation, du plus grand territoire au plus petit) ne rangent que des étapes dont
 * l'ordre ne se discute pas.
 *
 * MODULE PUR (voir `types.ts`).
 */
import { ce2Gap, ce2Link, ce2Order, ce2Question, ce2Sort, ce2Write, sortRows, type LinkRow, type OrderRow } from "./ce2Outils";
import { RANK_HINTS, SORT_HINTS, gapRows, link, order, questionRows, writeRows, type Pool } from "./cm1Faits";
import type { GameContext, GeneratedGame } from "./shared";

type Make = (ctx: GameContext) => GeneratedGame;

// ===========================================================================
// PRÉVENIR LES CONFLITS PAR LE DIALOGUE (ci-cm1-dialogue)
// ===========================================================================

const DIA_MOTS: Pool = {
  items: [
    {
      id: "conflit",
      q: ["Comment appelle-t-on une forte dispute entre des personnes qui ne sont pas d'accord ?", "Quel mot désigne une opposition sérieuse entre deux personnes ou deux groupes ?"],
      a: "Conflit",
      s: ["Une forte dispute entre des personnes est ___.", "Quand deux groupes s'opposent sérieusement, voilà ___."],
      ga: "un conflit",
      hint: "Il naît quand chacun reste sur sa position.",
    },
    {
      id: "dialogue",
      q: ["Comment appelle-t-on l'échange où chacun parle et écoute pour se comprendre ?", "Quel mot désigne le fait de se parler et de s'écouter pour régler un désaccord ?"],
      a: "Dialogue",
      s: ["Se parler et s'écouter pour se comprendre, voilà ___.", "Parler chacun son tour et écouter, voilà ___."],
      ga: "le dialogue",
      hint: "On y prend la parole chacun son tour.",
    },
    {
      id: "mediateur",
      q: ["Comment appelle-t-on la personne neutre qui aide deux personnes à s'entendre ?", "Qui aide des personnes en conflit à trouver un accord sans prendre parti ?"],
      a: "Médiateur",
      s: ["La personne neutre qui aide deux autres à s'entendre est ___.", "Celui qui aide à trouver un accord sans prendre parti, c'est ___."],
      ga: "le médiateur",
      hint: "Il ne prend le parti de personne.",
    },
    {
      id: "compromis",
      q: ["Comment appelle-t-on un accord où chacun accepte de faire un pas vers l'autre ?", "Quel mot désigne une solution où chacun renonce à un peu de ce qu'il voulait ?"],
      a: "Compromis",
      s: ["Quand chacun renonce à un peu de ce qu'il voulait, on trouve ___.", "Un accord où chacun fait un pas vers l'autre, voilà ___."],
      ga: "un compromis",
      hint: "Chacun lâche un peu pour que tous avancent.",
    },
    {
      id: "appartenance",
      q: ["Comment appelle-t-on le sentiment de faire partie d'un groupe, comme un quartier ou une équipe ?"],
      a: "Appartenance",
      ga: "l'appartenance",
      hint: "On le ressent avec sa famille, son équipe ou son quartier.",
    },
  ],
  extras: ["Vote", "Punition", "Règlement"],
  gextras: ["un vote", "une punition", "un règlement"],
};

const DIA_ATTITUDES: Pool = {
  items: [
    {
      id: "ecouter",
      q: ["Que faut-il faire avant de répondre pour comprendre ce que pense l'autre ?", "Quel geste montre à son interlocuteur qu'on veut comprendre son point de vue ?"],
      a: "Écouter l'autre",
      noWrite: true,
      not: ["Garder son calme", "Respecter les différences", "Chercher une solution commune", "Faire appel à un médiateur"],
      s: ["Pour prévenir un conflit, il faut ___ jusqu'au bout.", "Pour comprendre un point de vue, on doit ___."],
      ga: "écouter l'autre",
      hint: "Il faut d'abord se taire et tendre l'oreille.",
    },
    {
      id: "calme",
      q: ["Que faut-il faire pour ne pas s'énerver pendant un désaccord ?", "Quelle attitude évite de crier sur l'autre ?"],
      a: "Garder son calme",
      noWrite: true,
      not: ["Écouter l'autre", "Respecter les différences", "Chercher une solution commune", "Faire appel à un médiateur"],
      s: ["Pour ne pas s'énerver pendant un désaccord, il faut ___.", "Pour éviter de crier, on doit ___."],
      ga: "garder son calme",
      hint: "Respirer et baisser la voix aide beaucoup.",
    },
    {
      id: "differences",
      q: ["Que faut-il faire des différences entre les personnes, comme la langue ou l'origine ?", "Comment faut-il traiter ceux qui ne pensent pas comme nous ?"],
      a: "Respecter les différences",
      noWrite: true,
      not: ["Écouter l'autre", "Garder son calme", "Chercher une solution commune", "Faire appel à un médiateur"],
      s: ["Pour bien vivre ensemble, il faut ___ entre les personnes.", "Avec ceux qui ne pensent pas comme nous, on doit ___."],
      ga: "respecter les différences",
      hint: "Chacun a sa langue, ses habitudes et sa façon de penser.",
    },
    {
      id: "solution",
      q: ["Que faut-il faire ensemble quand deux personnes veulent des choses opposées ?", "Quelle attitude permet de sortir d'un désaccord sans gagnant ni perdant ?"],
      a: "Chercher une solution commune",
      noWrite: true,
      not: ["Écouter l'autre", "Garder son calme", "Respecter les différences", "Faire appel à un médiateur"],
      s: ["Quand deux personnes veulent des choses opposées, elles doivent ___.", "Pour sortir d'un désaccord sans perdant, il faut ___."],
      ga: "chercher une solution commune",
      hint: "Il faut réfléchir ensemble à ce qui convient à tous.",
    },
    {
      id: "appel",
      q: ["Que peut-on faire si le dialogue ne suffit pas à régler le conflit ?", "Quelle aide demande-t-on quand deux personnes ne s'entendent plus ?"],
      a: "Faire appel à un médiateur",
      noWrite: true,
      not: ["Écouter l'autre", "Garder son calme", "Respecter les différences", "Chercher une solution commune"],
      s: ["Si le dialogue ne suffit pas, on peut ___.", "Quand deux personnes ne s'entendent plus, elles peuvent ___."],
      ga: "faire appel à un médiateur",
      hint: "Une personne neutre peut aider quand on bloque.",
    },
  ],
  extras: ["Crier plus fort", "Insulter l'autre", "Couper la parole", "Bouder dans son coin"],
  gextras: ["crier plus fort", "insulter l'autre", "couper la parole", "bouder dans son coin"],
};

const DIA_POOLS = [DIA_MOTS, DIA_ATTITUDES] as const;
const DIA_QCM = questionRows("ci-cm1-dialogue", DIA_POOLS);
const DIA_TROU = gapRows("ci-cm1-dialogue", DIA_POOLS);
const DIA_ECRIRE = writeRows("ci-cm1-dialogue", DIA_POOLS);

const DIA_ORDRE: readonly OrderRow[] = [
  order("Range ces étapes pour régler un conflit par le dialogue, de la première à la dernière.", ["Se calmer", "Exposer le problème", "Chercher des solutions", "Choisir un compromis"], "dia-ordre:regler", RANK_HINTS),
  order("Range ces étapes pour régler un conflit par le dialogue, de la première à la dernière.", ["Se calmer", "Exposer le problème", "Choisir un compromis"], "dia-ordre:trois", RANK_HINTS),
  order("Range ces étapes pour régler un conflit par le dialogue, de la première à la dernière.", ["Exposer le problème", "Chercher des solutions", "Choisir un compromis"], "dia-ordre:fin", RANK_HINTS),
  order("Range ces étapes pour régler un conflit par le dialogue, de la première à la dernière.", ["Se calmer", "Chercher des solutions", "Choisir un compromis"], "dia-ordre:sauts", RANK_HINTS),
  order("Range ces étapes quand le dialogue ne suffit pas, de la première à la dernière.", ["Essayer de dialoguer", "Constater que cela ne suffit pas", "Faire appel à un médiateur", "Accepter l'accord trouvé"], "dia-ordre:mediation", RANK_HINTS),
  order("Range ces moments d'un échange, du premier au dernier.", ["Un élève parle", "L'autre écoute sans couper", "L'autre répond à son tour"], "dia-ordre:tours", RANK_HINTS),
];

const DIA_RELIER: readonly LinkRow[] = [
  link("Relie chaque mot à son sens.", [["Conflit", "Forte dispute"], ["Dialogue", "Échange où chacun écoute"], ["Médiateur", "Personne neutre qui aide"], ["Compromis", "Accord où chacun cède un peu"]]),
  link("Relie chaque mot à son sens.", [["Conflit", "Forte dispute"], ["Médiateur", "Personne neutre qui aide"], ["Compromis", "Accord où chacun cède un peu"]]),
  link("Relie chaque mot à son sens.", [["Dialogue", "Échange où chacun écoute"], ["Médiateur", "Personne neutre qui aide"], ["Appartenance", "Sentiment de faire partie d'un groupe"]]),
  link("Relie chaque attitude à son effet.", [["Écouter l'autre", "Comprendre son point de vue"], ["Garder son calme", "Éviter les cris"], ["Respecter les différences", "Bien vivre ensemble"], ["Faire appel à un médiateur", "Retrouver un accord"]]),
  link("Relie chaque attitude à son effet.", [["Écouter l'autre", "Comprendre son point de vue"], ["Garder son calme", "Éviter les cris"], ["Respecter les différences", "Bien vivre ensemble"]]),
  link("Relie chaque attitude à son effet.", [["Garder son calme", "Éviter les cris"], ["Respecter les différences", "Bien vivre ensemble"], ["Faire appel à un médiateur", "Retrouver un accord"]]),
];

const DIA_GLISSER = [
  ...sortRows(
    "Glisse chaque attitude dans la bonne case.",
    ["Bonne attitude", "Mauvaise attitude"],
    ["Écouter l'autre", "Garder son calme", "Respecter les différences", "Chercher un compromis"],
    ["Crier plus fort", "Insulter l'autre", "Couper la parole", "Bouder dans son coin"],
    SORT_HINTS,
    8,
  ),
  ...sortRows("Glisse chaque mot dans la bonne case.", ["Aide à s'entendre", "Empêche de s'entendre"], ["Dialogue", "Écoute", "Compromis", "Respect"], ["Insulte", "Menace", "Cri", "Mépris"], SORT_HINTS, 8),
];

export const makeCm1DiaQcm: Make = (ctx) => ce2Question(ctx, "cm1-dia-qcm", "les mots et les attitudes pour prévenir un conflit", DIA_QCM, 3);
export const makeCm1DiaTrou: Make = (ctx) => ce2Gap(ctx, "cm1-dia-trou", "compléter une phrase sur le dialogue", DIA_TROU, 2, 1);
export const makeCm1DiaEcrire: Make = (ctx) => ce2Write(ctx, "cm1-dia-ecrire", "écrire un mot du dialogue", DIA_ECRIRE, 1, 2);
export const makeCm1DiaOrdre: Make = (ctx) => ce2Order(ctx, "cm1-dia-ordre", "ranger les étapes pour régler un conflit", DIA_ORDRE);
export const makeCm1DiaRelier: Make = (ctx) => ce2Link(ctx, "cm1-dia-relier", "relier un mot ou une attitude à son sens", DIA_RELIER);
export const makeCm1DiaGlisser: Make = (ctx) => ce2Sort(ctx, "cm1-dia-glisser", "classer les attitudes et les mots du dialogue", DIA_GLISSER, 2);

// ===========================================================================
// LA COOPÉRATIVE ET LE GOUVERNEMENT SCOLAIRE (ci-cm1-ecole)
// ===========================================================================

const SCO_ORGANES: Pool = {
  items: [
    {
      id: "cooperative",
      q: ["Quelle organisation réunit des élèves et des maîtres pour acheter du matériel et mener des projets ?", "Quelle organisation de l'école rassemble les cotisations pour des projets communs ?"],
      a: "Coopérative scolaire",
      s: ["Pour acheter du matériel et mener des projets, élèves et maîtres forment ___.", "Les cotisations de l'école servent aux projets de ___."],
      ga: "la coopérative scolaire",
      hint: "On y met un peu d'argent en commun pour tout le monde.",
    },
    {
      id: "gouvernement",
      q: ["Quelle équipe d'élèves élus se partage les tâches de la vie scolaire ?", "Comment appelle-t-on l'équipe des élèves choisis par leurs camarades pour animer la vie scolaire ?"],
      a: "Gouvernement scolaire",
      s: ["Des élèves élus qui se partagent les tâches de l'école forment ___.", "Les élèves choisis par leurs camarades pour animer l'école forment ___."],
      ga: "le gouvernement scolaire",
      hint: "Ses membres sont comme des ministres de l'école.",
    },
    {
      id: "parlement",
      q: ["Quelle assemblée d'élèves délégués discute et vote les décisions de la vie scolaire ?"],
      a: "Parlement scolaire",
      s: ["Les délégués des classes qui discutent et votent forment ___."],
      ga: "le parlement scolaire",
      hint: "Les délégués y prennent la parole puis lèvent la main.",
    },
    {
      id: "comite",
      q: ["Quel comité aide à gérer l'école avec des parents et des maîtres ?", "Comment appelle-t-on le comité où des parents et des maîtres gèrent l'école ensemble ?"],
      a: "Comité de gestion",
      s: ["Des parents et des maîtres aident à gérer l'école dans ___."],
      ga: "le comité de gestion",
      hint: "On y parle du budget et de l'entretien des bâtiments.",
    },
  ],
  extras: ["Cantine", "Bibliothèque", "Terrain de sport"],
  gextras: ["la cantine", "la bibliothèque", "le terrain de sport"],
};

const SCO_ROLES: Pool = {
  items: [
    {
      id: "president",
      q: ["Qui dirige les réunions et parle au nom du groupe ?", "Quel responsable conduit les réunions d'une coopérative ?"],
      a: "Président",
      s: ["Dans le bureau, celui qui dirige les réunions est ___.", "Dans le bureau, la personne qui parle au nom du groupe est ___."],
      ga: "le président",
      hint: "Il donne la parole à chacun.",
    },
    {
      id: "secretaire",
      q: ["Qui écrit le compte rendu des réunions ?", "Quel responsable note ce qui est décidé pendant une réunion ?"],
      a: "Secrétaire",
      s: ["Dans le bureau, la personne qui écrit le compte rendu est ___.", "Dans le bureau, la personne qui note ce qui est décidé est ___."],
      ga: "le secrétaire",
      hint: "Il lui faut un stylo et un cahier.",
    },
    {
      id: "tresorier",
      q: ["Qui garde l'argent et note les dépenses de la coopérative ?", "Quel responsable tient les comptes de l'organisation ?"],
      a: "Trésorier",
      s: ["Dans le bureau, la personne qui garde l'argent est ___.", "Dans le bureau, la personne qui tient les comptes est ___."],
      ga: "le trésorier",
      hint: "Il surveille chaque pièce qui entre et qui sort.",
    },
  ],
  extras: ["Gardien", "Cuisinier"],
  gextras: ["le gardien", "le cuisinier"],
};

const SCO_VOTE: Pool = {
  items: [
    {
      id: "election",
      q: ["Comment appelle-t-on le choix des responsables par le vote de leurs camarades ?", "Quel mot désigne le moment où l'on vote pour choisir ses responsables ?"],
      a: "Élection",
      s: ["Choisir ses responsables par un vote, c'est faire ___.", "Voter pour désigner un président, c'est organiser ___."],
      ga: "une élection",
      hint: "Chacun donne sa voix à celui qu'il préfère.",
    },
    {
      id: "bulletin",
      q: ["Que dépose-t-on dans l'urne pour voter ?", "Quel papier plie-t-on avant de le glisser dans l'urne ?"],
      a: "Bulletin de vote",
      s: ["Pour voter, on met dans l'urne ___.", "À la fin du vote, on glisse dans l'urne ___."],
      ga: "un bulletin de vote",
      hint: "On y écrit un nom ou on le choisit parmi plusieurs.",
    },
    {
      id: "ordre-du-jour",
      q: ["Comment appelle-t-on la liste des sujets dont on va parler pendant la réunion ?", "Quelle liste lit-on au début d'une réunion pour savoir de quoi on va discuter ?"],
      a: "Ordre du jour",
      s: ["La liste des sujets à discuter pendant la réunion est ___.", "Au début de la réunion, on lit ___."],
      ga: "l'ordre du jour",
      hint: "Elle est écrite avant que la réunion commence.",
    },
    {
      id: "compte-rendu",
      q: ["Comment appelle-t-on le texte qui résume ce qui a été dit et décidé pendant la réunion ?", "Quel écrit garde la trace des décisions d'une réunion ?"],
      a: "Compte rendu",
      s: ["Le texte qui résume ce qui a été décidé pendant la réunion est ___.", "Pour garder la trace des décisions, on écrit ___."],
      ga: "le compte rendu",
      hint: "On le relit à la réunion suivante.",
    },
  ],
  extras: ["Règlement", "Récréation"],
  gextras: ["le règlement", "la récréation"],
};

const SCO_POOLS = [SCO_ORGANES, SCO_ROLES, SCO_VOTE] as const;
const SCO_QCM = questionRows("ci-cm1-ecole", SCO_POOLS);
const SCO_TROU = gapRows("ci-cm1-ecole", SCO_POOLS);
const SCO_ECRIRE = writeRows("ci-cm1-ecole", SCO_POOLS);

const SCO_ORDRE: readonly OrderRow[] = [
  order("Range ces étapes d'une élection, de la première à la dernière.", ["Présenter les candidats", "Voter", "Compter les voix", "Annoncer l'élu"], "sco-ordre:election", RANK_HINTS),
  order("Range ces étapes d'une élection, de la première à la dernière.", ["Présenter les candidats", "Voter", "Annoncer l'élu"], "sco-ordre:trois", RANK_HINTS),
  order("Range ces étapes d'une élection, de la première à la dernière.", ["Voter", "Compter les voix", "Annoncer l'élu"], "sco-ordre:fin", RANK_HINTS),
  order("Range ces moments d'une réunion, du premier au dernier.", ["Lire l'ordre du jour", "Discuter des sujets", "Prendre une décision", "Écrire le compte rendu"], "sco-ordre:reunion", RANK_HINTS),
  order("Range ces moments d'une réunion, du premier au dernier.", ["Lire l'ordre du jour", "Prendre une décision", "Écrire le compte rendu"], "sco-ordre:reunion-trois", RANK_HINTS),
  order("Range ces étapes d'un projet de la coopérative, de la première à la dernière.", ["Proposer un projet", "En discuter en réunion", "Voter pour le choisir", "Réaliser le projet"], "sco-ordre:projet", RANK_HINTS),
];

const SCO_RELIER: readonly LinkRow[] = [
  link("Relie chaque organisation à son rôle.", [["Coopérative scolaire", "Réunit des cotisations pour des projets"], ["Gouvernement scolaire", "Élèves élus qui animent l'école"], ["Parlement scolaire", "Délégués qui discutent et votent"], ["Comité de gestion", "Parents et maîtres qui gèrent l'école"]]),
  link("Relie chaque organisation à son rôle.", [["Coopérative scolaire", "Réunit des cotisations pour des projets"], ["Gouvernement scolaire", "Élèves élus qui animent l'école"], ["Comité de gestion", "Parents et maîtres qui gèrent l'école"]]),
  link("Relie chaque organisation à son rôle.", [["Gouvernement scolaire", "Élèves élus qui animent l'école"], ["Parlement scolaire", "Délégués qui discutent et votent"], ["Comité de gestion", "Parents et maîtres qui gèrent l'école"]]),
  link("Relie chaque responsable à sa tâche.", [["Président", "Dirige les réunions"], ["Secrétaire", "Écrit le compte rendu"], ["Trésorier", "Garde l'argent"]]),
  link("Relie chaque mot à son sens.", [["Élection", "Choix par le vote"], ["Bulletin de vote", "Papier glissé dans l'urne"], ["Ordre du jour", "Liste des sujets à discuter"], ["Compte rendu", "Résumé des décisions"]]),
  link("Relie chaque mot à son sens.", [["Élection", "Choix par le vote"], ["Ordre du jour", "Liste des sujets à discuter"], ["Compte rendu", "Résumé des décisions"]]),
];

const SCO_GLISSER = [
  ...sortRows(
    "Glisse chaque mot dans la bonne case.",
    ["Organisation de l'école", "Responsable du bureau"],
    ["Coopérative scolaire", "Gouvernement scolaire", "Parlement scolaire", "Comité de gestion"],
    ["Président", "Secrétaire", "Trésorier"],
    SORT_HINTS,
    8,
  ),
  ...sortRows(
    "Glisse chaque tâche dans la bonne case.",
    ["Secrétaire", "Trésorier"],
    ["Écrire le compte rendu", "Noter les décisions", "Résumer la réunion"],
    ["Garder l'argent", "Noter les dépenses", "Tenir les comptes"],
    SORT_HINTS,
    8,
  ),
];

export const makeCm1ScoQcm: Make = (ctx) => ce2Question(ctx, "cm1-sco-qcm", "les organisations de l'école, les responsables et le vote", SCO_QCM, 3);
export const makeCm1ScoTrou: Make = (ctx) => ce2Gap(ctx, "cm1-sco-trou", "compléter une phrase sur la vie de l'école", SCO_TROU, 2, 1);
export const makeCm1ScoEcrire: Make = (ctx) => ce2Write(ctx, "cm1-sco-ecrire", "écrire un mot de la vie de l'école", SCO_ECRIRE, 1, 2);
export const makeCm1ScoOrdre: Make = (ctx) => ce2Order(ctx, "cm1-sco-ordre", "ranger les étapes d'une élection ou d'une réunion", SCO_ORDRE);
export const makeCm1ScoRelier: Make = (ctx) => ce2Link(ctx, "cm1-sco-relier", "relier une organisation ou un responsable à son rôle", SCO_RELIER);
export const makeCm1ScoGlisser: Make = (ctx) => ce2Sort(ctx, "cm1-sco-glisser", "classer les organisations et les tâches du bureau", SCO_GLISSER, 2);

// ===========================================================================
// LA COMMUNE ET L'ÉTAT (ci-cm1-commune)
// ===========================================================================

const MUN_COLLECTIVITES: Pool = {
  items: [
    {
      id: "commune",
      q: ["Comment appelle-t-on le territoire dirigé par un maire et un conseil municipal ?"],
      a: "Commune",
      s: ["Un maire et un conseil municipal dirigent ___."],
      ga: "la commune",
      hint: "C'est la ville ou le village où l'on habite.",
    },
    {
      id: "maire",
      q: ["Qui dirige la commune ?", "Comment appelle-t-on le chef de la commune ?"],
      a: "Maire",
      not: ["Conseil municipal", "Commune"],
      s: ["Le chef de la commune est ___.", "La personne qui dirige la commune est ___."],
      ga: "le maire",
      hint: "On le trouve à la mairie.",
    },
    {
      id: "conseil-municipal",
      q: ["Comment appelle-t-on l'assemblée des élus qui décident des affaires de la commune ?", "Quelle assemblée d'élus travaille avec le maire pour la commune ?"],
      a: "Conseil municipal",
      not: ["Maire"],
      s: ["Les élus qui décident des affaires de la commune forment ___.", "Avec le maire, les élus de la commune forment ___."],
      ga: "le conseil municipal",
      hint: "Ses membres se réunissent pour voter des décisions.",
    },
    {
      id: "conseil-departemental",
      q: ["Comment appelle-t-on l'assemblée des élus qui décident des affaires du département ?", "Quelle assemblée des élus s'occupe des affaires du département ?"],
      a: "Conseil départemental",
      s: ["Les élus qui décident des affaires du département forment ___.", "Pour le département, les élus forment ___."],
      ga: "le conseil départemental",
      hint: "Ses membres sont choisis par les habitants du département.",
    },
  ],
  extras: ["Gouverneur", "Préfet"],
  gextras: ["le gouverneur", "le préfet"],
};

const MUN_ETAT: Pool = {
  items: [
    {
      id: "gouverneur",
      q: ["Qui représente l'État dans une région ?", "Comment appelle-t-on le représentant de l'État dans une région ?"],
      a: "Gouverneur",
      s: ["Dans une région, l'État est représenté par ___.", "Le représentant de l'État dans une région est ___."],
      ga: "le gouverneur",
      hint: "Il est envoyé par l'État pour toute la région.",
    },
    {
      id: "prefet",
      q: ["Qui représente l'État dans un département ?", "Comment appelle-t-on le représentant de l'État dans un département ?"],
      a: "Préfet",
      s: ["Dans un département, l'État est représenté par ___.", "Le représentant de l'État dans un département est ___."],
      ga: "le préfet",
      hint: "Il est envoyé par l'État pour tout le département.",
    },
    {
      id: "sous-prefet",
      q: ["Qui représente l'État dans un arrondissement ?", "Comment appelle-t-on le représentant de l'État dans un arrondissement ?"],
      a: "Sous-préfet",
      s: ["Dans un arrondissement, l'État est représenté par ___.", "Le représentant de l'État dans un arrondissement est ___."],
      ga: "le sous-préfet",
      hint: "Il est envoyé par l'État pour un territoire plus petit.",
    },
  ],
  extras: ["Maire", "Chef de quartier"],
  gextras: ["le maire", "le chef de quartier"],
};

const MUN_CHOIX: Pool = {
  items: [
    {
      id: "elus",
      q: ["Comment sont désignés le maire et les conseillers de la commune ?", "Comment sont choisis ceux qui dirigent la commune ?"],
      a: "Élus par les habitants",
      noWrite: true,
      s: ["Les conseillers de la commune sont ___.", "Ceux qui dirigent la commune sont ___."],
      ga: "élus par les habitants",
      hint: "Chaque habitant donne sa voix lors d'un scrutin.",
    },
    {
      id: "nommes",
      q: ["Comment sont désignés le gouverneur, le préfet et le sous-préfet ?", "Comment sont choisis ceux qui représentent l'État dans les régions, les départements et les arrondissements ?"],
      a: "Nommés par l'État",
      noWrite: true,
      s: ["Le gouverneur, le préfet et le sous-préfet sont ___.", "Ceux qui représentent l'État sur le territoire sont ___."],
      ga: "nommés par l'État",
      hint: "Ils ne passent pas devant les électeurs.",
    },
  ],
  extras: ["Tirés au sort", "Choisis par les élèves"],
  gextras: ["tirés au sort", "choisis par les élèves"],
};

const MUN_POOLS = [MUN_COLLECTIVITES, MUN_ETAT, MUN_CHOIX] as const;
const MUN_QCM = questionRows("ci-cm1-commune", MUN_POOLS);
const MUN_TROU = gapRows("ci-cm1-commune", MUN_POOLS);
const MUN_ECRIRE = writeRows("ci-cm1-commune", MUN_POOLS);

const MUN_ORDRE: readonly OrderRow[] = [
  order("Range ces territoires, du plus grand au plus petit.", ["Pays", "Région", "Département", "Arrondissement"], "mun-ordre:territoires", RANK_HINTS),
  order("Range ces territoires, du plus grand au plus petit.", ["Pays", "Région", "Département"], "mun-ordre:haut", RANK_HINTS),
  order("Range ces territoires, du plus grand au plus petit.", ["Région", "Département", "Arrondissement"], "mun-ordre:bas", RANK_HINTS),
  order("Range ces territoires, du plus grand au plus petit.", ["Pays", "Département", "Arrondissement"], "mun-ordre:sauts", RANK_HINTS),
  order("Range ces représentants de l'État, du plus grand territoire au plus petit.", ["Gouverneur", "Préfet", "Sous-préfet"], "mun-ordre:representants", RANK_HINTS),
  order("Range ces territoires, du plus petit au plus grand.", ["Arrondissement", "Département", "Région", "Pays"], "mun-ordre:inverse", RANK_HINTS),
];

const MUN_RELIER: readonly LinkRow[] = [
  link("Relie chaque responsable à son territoire.", [["Maire", "Commune"], ["Gouverneur", "Région"], ["Préfet", "Département"], ["Sous-préfet", "Arrondissement"]]),
  link("Relie chaque responsable à son territoire.", [["Gouverneur", "Région"], ["Préfet", "Département"], ["Sous-préfet", "Arrondissement"]]),
  link("Relie chaque responsable à son territoire.", [["Maire", "Commune"], ["Préfet", "Département"], ["Sous-préfet", "Arrondissement"]]),
  link("Relie chaque assemblée ou chaque responsable à son territoire.", [["Conseil municipal", "Commune"], ["Conseil départemental", "Département"], ["Sous-préfet", "Arrondissement"]]),
  link("Relie chaque personne à son rôle.", [["Maire", "Dirige la commune"], ["Gouverneur", "Représente l'État dans la région"], ["Préfet", "Représente l'État dans le département"]]),
  link("Relie chaque mot à son sens.", [["Élus", "Choisis par les habitants"], ["Nommés", "Désignés par l'État"], ["Conseil municipal", "Assemblée de la commune"]]),
];

const MUN_GLISSER = [
  ...sortRows(
    "Glisse chaque responsable dans la bonne case.",
    ["Élus par les habitants", "Nommés par l'État"],
    ["Maire", "Conseil municipal", "Conseil départemental"],
    ["Gouverneur", "Préfet", "Sous-préfet"],
    SORT_HINTS,
    8,
  ),
];

export const makeCm1MunQcm: Make = (ctx) => ce2Question(ctx, "cm1-mun-qcm", "la commune, le département et les représentants de l'État", MUN_QCM, 3);
export const makeCm1MunTrou: Make = (ctx) => ce2Gap(ctx, "cm1-mun-trou", "compléter une phrase sur la commune et l'État", MUN_TROU, 2, 1);
export const makeCm1MunEcrire: Make = (ctx) => ce2Write(ctx, "cm1-mun-ecrire", "écrire le nom d'un responsable ou d'une assemblée", MUN_ECRIRE, 1, 2);
export const makeCm1MunOrdre: Make = (ctx) => ce2Order(ctx, "cm1-mun-ordre", "ranger les territoires et les représentants de l'État", MUN_ORDRE);
export const makeCm1MunRelier: Make = (ctx) => ce2Link(ctx, "cm1-mun-relier", "relier un responsable à son territoire", MUN_RELIER);
export const makeCm1MunGlisser: Make = (ctx) => ce2Sort(ctx, "cm1-mun-glisser", "classer les responsables élus et nommés", MUN_GLISSER, 2);

// ===========================================================================
// LES ORGANISATIONS DE MON QUARTIER (ci-cm1-associations)
// ===========================================================================

const ASO_QUI: Pool = {
  items: [
    {
      id: "asc",
      q: ["Que veut dire ASC ?", "Quelle association organise des matchs, des spectacles et des activités de culture pour les jeunes ?"],
      a: "Association sportive et culturelle",
      s: ["ASC veut dire ___.", "Pour animer le sport et la culture dans le quartier, les jeunes forment ___."],
      ga: "une association sportive et culturelle",
      hint: "Le ballon et le théâtre y ont leur place.",
    },
    {
      id: "gpf",
      q: ["Quelle organisation réunit des femmes du quartier pour mener des activités ensemble et s'entraider ?"],
      a: "Groupement de femmes",
      also: ["Le groupement de femmes", "Un groupement de femmes"],
      s: ["Des femmes qui s'entraident pour mener des activités ensemble forment ___."],
      ga: "un groupement de femmes",
      hint: "On y travaille ensemble pour gagner sa vie.",
    },
    {
      id: "cq",
      q: ["Quelle organisation réunit des habitants pour améliorer la vie du quartier ?"],
      a: "Comité de quartier",
      // « Le comité de quartier » et « Association de quartier » disent la même chose : défendables, donc acceptés.
      also: ["Le comité de quartier", "Un comité de quartier", "Association de quartier", "L'association de quartier", "Une association de quartier"],
      s: ["Des habitants qui veulent améliorer la vie du quartier forment ___."],
      ga: "un comité de quartier",
      hint: "Ses membres parlent propreté, sécurité et entraide.",
    },
    // Deux faits : « Que veut dire APE ? » ne peut pas admettre « APE », « Quelle association… ? » le doit.
    {
      id: "ape",
      q: ["Que veut dire APE ?"],
      a: "Association de parents d'élèves",
      also: ["Association des parents d'élèves"],
      s: ["APE veut dire ___."],
      ga: "une association de parents d'élèves",
      hint: "Ses membres connaissent bien les maîtres de leurs enfants.",
    },
    {
      id: "ape-role",
      q: ["Quelle association réunit les parents pour aider l'école ?"],
      a: "Association de parents d'élèves",
      also: ["Association des parents d'élèves", "APE"],
      s: ["Des parents qui veulent aider l'école se regroupent dans ___."],
      ga: "une association de parents d'élèves",
      hint: "Ses membres connaissent bien les maîtres de leurs enfants.",
    },
  ],
  extras: ["Association de commerçants", "Groupement de pêcheurs"],
  gextras: ["une association de commerçants", "un groupement de pêcheurs"],
};

const ASO_BUTS: Pool = {
  items: [
    {
      id: "but-asc",
      q: ["À quoi sert une association sportive et culturelle ?", "Pourquoi les jeunes créent-ils une association sportive et culturelle ?", "Dans quel but une association sportive et culturelle existe-t-elle ?"],
      a: "Animer le sport et la culture",
      noWrite: true,
      s: ["Une association sportive et culturelle sert à ___.", "Les jeunes créent une association sportive et culturelle pour ___.", "Une association sportive et culturelle existe pour ___."],
      ga: "animer le sport et la culture",
      hint: "Matchs, danses et concerts occupent leur temps libre.",
    },
    {
      id: "but-gpf",
      q: ["À quoi sert un groupement de femmes ?", "Pourquoi des femmes du quartier forment-elles un groupement ?", "Dans quel but un groupement de femmes existe-t-il ?"],
      a: "S'entraider et travailler ensemble",
      noWrite: true,
      s: ["Un groupement de femmes sert à ___.", "Des femmes se regroupent pour ___.", "Un groupement de femmes existe pour ___."],
      ga: "s'entraider et travailler ensemble",
      hint: "À plusieurs, elles réussissent mieux qu'isolées.",
    },
    {
      id: "but-cq",
      q: ["À quoi sert un comité de quartier ?", "Pourquoi des habitants forment-ils un comité de quartier ?", "Dans quel but un comité de quartier existe-t-il ?"],
      a: "Améliorer la vie du quartier",
      noWrite: true,
      s: ["Un comité de quartier sert à ___.", "Des habitants forment un comité pour ___.", "Un comité de quartier existe pour ___."],
      ga: "améliorer la vie du quartier",
      hint: "Les rues et les voisins profitent de son travail.",
    },
    {
      id: "but-ape",
      q: ["À quoi sert une association de parents d'élèves ?", "Pourquoi des parents forment-ils une association autour de l'école ?", "Dans quel but une association de parents d'élèves existe-t-elle ?"],
      a: "Aider l'école",
      noWrite: true,
      s: ["Une association de parents d'élèves sert à ___.", "Des parents s'organisent pour ___.", "Une association de parents d'élèves existe pour ___."],
      ga: "aider l'école",
      hint: "Les parents et les maîtres travaillent la main dans la main.",
    },
  ],
  extras: ["Vendre des médicaments", "Faire payer les impôts", "Juger les voleurs"],
  gextras: ["vendre des médicaments", "faire payer les impôts", "juger les voleurs"],
};

const ASO_POOLS = [ASO_QUI, ASO_BUTS] as const;
const ASO_QCM = questionRows("ci-cm1-associations", ASO_POOLS);
const ASO_TROU = gapRows("ci-cm1-associations", ASO_POOLS);
const ASO_ECRIRE = writeRows("ci-cm1-associations", ASO_POOLS);

const ASO_ORDRE: readonly OrderRow[] = [
  order("Range ces étapes pour agir dans le quartier, de la première à la dernière.", ["Repérer le problème du quartier", "En discuter en réunion", "Choisir une action", "Agir ensemble"], "aso-ordre:agir", RANK_HINTS),
  order("Range ces étapes pour agir dans le quartier, de la première à la dernière.", ["Repérer le problème du quartier", "En discuter en réunion", "Agir ensemble"], "aso-ordre:trois", RANK_HINTS),
  order("Range ces étapes pour agir dans le quartier, de la première à la dernière.", ["En discuter en réunion", "Choisir une action", "Agir ensemble"], "aso-ordre:fin", RANK_HINTS),
  order("Range ces étapes pour créer une association, de la première à la dernière.", ["Avoir une idée commune", "En parler aux habitants", "Se réunir", "Élire un bureau"], "aso-ordre:creer", RANK_HINTS),
  order("Range ces étapes pour créer une association, de la première à la dernière.", ["Avoir une idée commune", "Se réunir", "Élire un bureau"], "aso-ordre:creer-trois", RANK_HINTS),
  order("Range ces étapes pour créer une association, de la première à la dernière.", ["En parler aux habitants", "Se réunir", "Élire un bureau"], "aso-ordre:creer-fin", RANK_HINTS),
];

const ASO_RELIER: readonly LinkRow[] = [
  link("Relie chaque organisation à son domaine.", [["ASC", "Sport et culture"], ["APE", "Parents et école"], ["Comité de quartier", "Vie du quartier"], ["Groupement de femmes", "Entraide des femmes"]]),
  link("Relie chaque organisation à son but.", [["Association sportive et culturelle", "Animer le sport et la culture"], ["Groupement de femmes", "S'entraider et travailler ensemble"], ["Comité de quartier", "Améliorer la vie du quartier"], ["Association de parents d'élèves", "Aider l'école"]]),
  link("Relie chaque organisation à son but.", [["Association sportive et culturelle", "Animer le sport et la culture"], ["Groupement de femmes", "S'entraider et travailler ensemble"], ["Comité de quartier", "Améliorer la vie du quartier"]]),
  link("Relie chaque organisation à son but.", [["Groupement de femmes", "S'entraider et travailler ensemble"], ["Comité de quartier", "Améliorer la vie du quartier"], ["Association de parents d'élèves", "Aider l'école"]]),
  link("Relie chaque organisation à ceux qu'elle réunit.", [["Association de parents d'élèves", "Parents"], ["Groupement de femmes", "Femmes"], ["Comité de quartier", "Habitants"]]),
  link("Relie chaque organisation à une activité.", [["Association sportive et culturelle", "Un tournoi de football"], ["Groupement de femmes", "Un jardin cultivé ensemble"], ["Comité de quartier", "Un nettoyage des rues"]]),
];

const ASO_GLISSER = [
  ...sortRows(
    "Glisse chaque activité dans la bonne case.",
    ["Association sportive et culturelle", "Comité de quartier"],
    ["Tournoi de football", "Soirée de danse", "Concert"],
    ["Nettoyer les rues", "Surveiller le quartier", "Boucher les flaques"],
    SORT_HINTS,
    8,
  ),
  ...sortRows(
    "Glisse chaque activité dans la bonne case.",
    ["Groupement de femmes", "Comité de quartier"],
    ["Cultiver un jardin", "Fabriquer du savon", "Teindre des tissus"],
    ["Nettoyer les rues", "Surveiller le quartier", "Boucher les flaques"],
    SORT_HINTS,
    8,
  ),
];

export const makeCm1AsoQcm: Make = (ctx) => ce2Question(ctx, "cm1-aso-qcm", "les organisations du quartier et à quoi elles servent", ASO_QCM, 3);
export const makeCm1AsoTrou: Make = (ctx) => ce2Gap(ctx, "cm1-aso-trou", "compléter une phrase sur une organisation du quartier", ASO_TROU, 2, 1);
export const makeCm1AsoEcrire: Make = (ctx) => ce2Write(ctx, "cm1-aso-ecrire", "écrire le nom d'une organisation du quartier", ASO_ECRIRE, 1, 2);
export const makeCm1AsoOrdre: Make = (ctx) => ce2Order(ctx, "cm1-aso-ordre", "ranger les étapes pour agir dans le quartier ou créer une association", ASO_ORDRE);
export const makeCm1AsoRelier: Make = (ctx) => ce2Link(ctx, "cm1-aso-relier", "relier une organisation à son but", ASO_RELIER);
export const makeCm1AsoGlisser: Make = (ctx) => ce2Sort(ctx, "cm1-aso-glisser", "classer les activités des organisations du quartier", ASO_GLISSER, 2);
