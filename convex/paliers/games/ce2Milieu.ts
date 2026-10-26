/**
 * LES GABARITS DES SCIENCES DU MILIEU AU CE2 : le circuit électrique, se protéger des maladies, l'environnement et la population
 * (`sc-ce2-electricite`, `sc-ce2-sante`, `sc-ce2-environnement`).
 *
 * Sur l'échantillon de CE2, le modèle écrivait ici des exercices creux ou faux : un « circuit » dont on rangeait les étapes dans
 * l'ordre où le modèle les avait pensées (la pile, puis les fils, puis l'ampoule), une question « Pourquoi faut-il faire attention
 * avec l'électricité ? » dont le seul choix possible était « Elle peut être dangereuse », une paire « Hygiène ~ Se laver les mains »
 * qui n'est ni du VIH ni du paludisme, des « effets de la pollution » à écrire en réponse libre. Ici chaque réponse se lit dans une
 * table fermée, écrite à la main, qui ne dit que ce que la fiche dit.
 *
 * CE QUE LES FICHES DONNENT, ET CE QUE CE FICHIER N'INVENTE PAS
 * - L'électricité : le circuit simple (pile, ampoule, fils, interrupteur) ; circuit ouvert et circuit fermé ; les conducteurs (les
 *   métaux) et les isolants (le plastique, le bois, et quelques matières de tous les jours qui bloquent le courant) ; les dangers.
 * - La santé : se protéger du paludisme (la moustiquaire, les habits longs le soir, vider l'eau qui ne bouge pas) ; le VIH expliqué à un
 *   enfant de huit ans : on ne touche pas le sang d'une autre personne, on ne partage ni lame ni seringue, et on ne l'attrape ni en
 *   jouant, ni en mangeant, ni en se donnant la main. Jamais un mot qui fasse peur à un enfant ou qui laisse croire qu'un camarade est
 *   dangereux.
 * - L'environnement : les déchets, les sachets plastiques, la coupe des arbres, les feux de brousse ; les quartiers trop peuplés et le
 *   manque d'eau ; une solution pour chaque problème.
 *
 * RÈGLES POUR AJOUTER UNE LIGNE : celles de `ce2Vivant.ts` (étiquette = nom seul avec majuscule, une apostrophe droite au plus, trois
 * indices sans chiffre ni mot de quatre lettres d'une bonne réponse ou d'une tuile, mauvais choix qui ne sont jamais une seconde bonne
 * réponse, au moins quatre fois `uses` lignes par gabarit).
 *
 * MODULE PUR (voir `types.ts`).
 */
import {
  ce2Gap,
  ce2Link,
  ce2Order,
  ce2Question,
  ce2Sort,
  ce2Write,
  combinations,
  gr,
  hints,
  inFactOrder,
  ordr,
  qr,
  sortRows,
  wr,
  type GapRow,
  type LinkRow,
  type OrderRow,
  type QuestionRow,
  type SortRow,
  type WriteRow,
} from "./ce2Outils";
import type { GameContext, GeneratedGame } from "./shared";

// ===========================================================================
// LE CIRCUIT ÉLECTRIQUE
// ===========================================================================

const CIRCUIT_FACTS = ["circuit:pile", "circuit:fermé", "circuit:ampoule", "circuit:ouvert", "circuit:fils", "matière:conducteur", "circuit:interrupteur", "matière:isolant", "circuit:nombre", "matière:Cuivre", "matière:Plastique", "matière:Fer", "matière:Bois", "matière:Aluminium", "matière:Caoutchouc", "matière:Acier", "matière:Verre", "matière:Tissu", "matière:Carton"];
const CONDUCTORS = ["Cuivre", "Fer", "Aluminium", "Acier"] as const;
const INSULATORS = ["Plastique", "Bois", "Caoutchouc", "Verre", "Tissu", "Carton"] as const;

const PIECE_ROWS: readonly QuestionRow[] = inFactOrder(
  [
    qr("Quelle pièce du circuit donne l'électricité ?", "Pile", ["Ampoule", "Interrupteur"], hints("Pense à ce qui donne l'énergie.", "On la change quand elle est usée.", "Elle est dans la lampe torche."), "circuit:pile"),
    qr("Dans une lampe torche, quelle pièce donne l'électricité ?", "Pile", ["Fils", "Ampoule"], hints("Pense à ce qui donne l'énergie.", "On la change quand elle est usée.", "Elle se glisse dans le manche."), "circuit:pile"),
    qr("Quelle pièce du circuit éclaire ?", "Ampoule", ["Pile", "Fils"], hints("Pense à ce qui donne de la lumière.", "Elle est en verre.", "Elle brille quand le circuit est fermé."), "circuit:ampoule"),
    qr("Quelle pièce du circuit brille quand il est fermé ?", "Ampoule", ["Fils", "Interrupteur"], hints("Pense à ce qui donne de la lumière.", "Elle est en verre.", "Elle éclaire la pièce."), "circuit:ampoule"),
    qr("Quelles pièces longues et minces relient la pile à la lampe ?", "Fils", ["Pile", "Ampoule"], hints("Pense à ce qui est long et mince.", "Ils sont en cuivre, couverts de plastique.", "Ils vont d'une pièce à l'autre."), "circuit:fils"),
    qr("Quelles pièces relient les autres pièces du circuit ?", "Fils", ["Pile", "Interrupteur"], hints("Pense à ce qui est long et mince.", "Ils sont en cuivre, couverts de plastique.", "Ils vont d'une pièce à l'autre."), "circuit:fils"),
    qr("Quelle pièce permet d'ouvrir ou de fermer le circuit ?", "Interrupteur", ["Pile", "Ampoule"], hints("Pense à ce qu'on touche pour allumer.", "On le pousse ou on le tourne.", "Il laisse passer ou arrête le courant."), "circuit:interrupteur"),
    qr("Quelle pièce utilise-t-on pour allumer et éteindre ?", "Interrupteur", ["Fils", "Pile"], hints("Pense à ce qu'on touche pour allumer.", "On le pousse ou on le tourne.", "Il laisse passer ou arrête le courant."), "circuit:interrupteur"),
  ],
  CIRCUIT_FACTS,
);

const PIECE_LINK_POOL = [
  { left: "Pile", right: "Elle donne l'électricité" },
  { left: "Ampoule", right: "Elle éclaire" },
  { left: "Fils", right: "Ils relient les pièces" },
  { left: "Interrupteur", right: "Il ouvre ou ferme le circuit" },
] as const;
const PIECE_LINK_ROWS: readonly LinkRow[] = combinations(PIECE_LINK_POOL, 3).map((pairs) => ({
  prompt: "Relie chaque pièce à son rôle.",
  pairs,
  hints: hints("Pense au rôle de chaque pièce.", "Lis les phrases une par une.", "Une seule phrase va avec chaque pièce."),
}));

const STATE_ROWS: readonly QuestionRow[] = inFactOrder(
  [
    qr("L'interrupteur est ouvert. Que se passe-t-il ?", "L'ampoule reste éteinte", ["L'ampoule brille", "La pile se remplit"], hints("Un interrupteur ouvert coupe le chemin.", "L'électricité ne peut plus faire le tour.", "Le courant ne passe pas jusqu'à la lampe."), "circuit:ouvert"),
    qr("L'interrupteur est fermé. Que se passe-t-il ?", "L'ampoule brille", ["L'ampoule reste éteinte", "Le fil se coupe"], hints("Un interrupteur fermé laisse passer le courant.", "Le chemin est complet, de la pile à la lampe.", "La lumière s'allume."), "circuit:fermé"),
    qr("Un fil du circuit est coupé. Que se passe-t-il ?", "Le circuit est ouvert", ["Le circuit est fermé", "L'ampoule brille plus fort"], hints("Pense au chemin que suit l'électricité.", "Un fil coupé fait un trou dans le chemin.", "Le courant ne peut plus faire le tour."), "circuit:ouvert"),
    qr("Le circuit est fermé. Que fait l'électricité ?", "Elle circule", ["Elle s'arrête", "Elle disparaît"], hints("Le chemin est complet.", "La pile pousse le courant dans les fils.", "L'ampoule peut briller."), "circuit:fermé"),
    qr("Le circuit est ouvert. Que fait l'électricité ?", "Elle ne circule pas", ["Elle circule", "Elle brille"], hints("Le chemin est coupé.", "La pile ne peut plus pousser le courant.", "L'ampoule reste sans lumière."), "circuit:ouvert"),
    qr("Le circuit est fermé. Que peut faire l'ampoule ?", "Elle brille", ["Elle reste éteinte", "Elle disparaît"], hints("Le chemin est complet.", "Le courant arrive jusqu'à la lampe.", "Cette pièce donne de la lumière."), "circuit:fermé"),
  qr("Comment appelle-t-on un circuit où le courant circule ?", "Un circuit fermé", ["Un circuit ouvert", "Un circuit cassé"], hints("Le chemin est complet.", "Il laisse le courant faire le tour.", "L'ampoule brille dans ce cas."), "circuit:fermé"),
    qr("Comment appelle-t-on un circuit où le courant ne passe pas ?", "Un circuit ouvert", ["Un circuit fermé", "Un circuit plein"], hints("Le chemin est coupé quelque part.", "L'ampoule reste sans lumière.", "Un interrupteur laissé en l'air le rend ainsi."), "circuit:ouvert"),
  ],
  CIRCUIT_FACTS,
);

const MATERIAL_ROWS: readonly QuestionRow[] = inFactOrder(
  [
    ...CONDUCTORS.flatMap((material, i) =>
      ["Lequel de ces matériaux laisse passer l'électricité ?", "Lequel de ces matériaux est un conducteur ?"].map((prompt, form) =>
        qr(
          prompt,
          material,
          [INSULATORS[(i + form) % 6], INSULATORS[(i + form + 3) % 6]],
          hints("Pense aux fils d'un circuit.", "Ce matériau est un métal.", "Il brille et il est dur."),
          `matière:${material}`,
        ),
      ),
    ),
    ...INSULATORS.flatMap((material, i) =>
      ["Lequel de ces matériaux bloque l'électricité ?", "Lequel de ces matériaux est un isolant ?"].map((prompt, form) =>
        qr(
          prompt,
          material,
          [CONDUCTORS[(i + form) % 4], CONDUCTORS[(i + form + 2) % 4]],
          hints("Pense à la gaine qui entoure un fil.", "Ce matériau n'est pas un métal.", "On ne s'en sert pas pour faire passer le courant."),
          `matière:${material}`,
        ),
      ),
    ),
  ],
  CIRCUIT_FACTS,
);

const MATERIAL_SORT_ROWS: readonly SortRow[] = sortRows(
  "Glisse chaque matière dans la bonne case.",
  ["Conducteur", "Isolant"],
  CONDUCTORS,
  INSULATORS,
  hints("Les métaux laissent passer l'électricité.", "Un matériau qui n'est pas un métal la bloque.", "Pense aux fils électriques et à leur gaine."),
  36,
);

const SAFE_ACTS = ["Prévenir un adulte si un fil est abîmé", "Rester loin d'un fil tombé", "Demander à un adulte de brancher l'appareil", "Éteindre l'appareil avant de le ranger"] as const;
const DANGEROUS_ACTS = ["Mettre un doigt dans une prise", "Toucher un fil dénudé", "Toucher une prise avec les mains mouillées", "Jouer près d'un fil tombé"] as const;
const DANGER_SORT_ROWS: readonly SortRow[] = sortRows(
  "Glisse chaque geste dans la bonne case.",
  ["À faire", "À ne pas faire"],
  SAFE_ACTS,
  DANGEROUS_ACTS,
  hints("Pense à ce qui peut te blesser.", "L'électricité est très dangereuse pour le corps.", "Quand on a un doute, on demande de l'aide."),
  16,
);

const CIRCUIT_ORDER_ROWS: readonly OrderRow[] = inFactOrder(
  [
    ordr("Mets ces événements dans l'ordre du temps.", ["On ferme l'interrupteur", "L'électricité circule", "L'ampoule brille"], hints("Commence par ce que tu fais avec la main.", "Ensuite quelque chose passe dans les fils.", "La lumière arrive à la fin."), "circuit:fermé"),
    ordr("Mets ces événements dans l'ordre du temps.", ["On ouvre l'interrupteur", "Le circuit est ouvert", "L'ampoule s'éteint"], hints("Commence par ce que tu fais avec la main.", "Le chemin est coupé ensuite.", "La lumière disparaît à la fin."), "circuit:ouvert"),
    ordr("Mets ces événements dans l'ordre du temps.", ["La pile donne l'électricité", "L'électricité passe dans les fils", "L'ampoule brille"], hints("Tout commence par la source.", "Ensuite le courant voyage.", "La lumière arrive à la fin."), "circuit:pile"),
    ordr("Mets ces événements dans l'ordre du temps.", ["On coupe un fil", "Le circuit s'ouvre", "L'ampoule s'éteint"], hints("Commence par ce que tu fais avec des ciseaux.", "Le chemin est interrompu ensuite.", "La lumière disparaît à la fin."), "circuit:fils"),
  ],
  CIRCUIT_FACTS,
);

const CIRCUIT_GAP_ROWS: readonly GapRow[] = inFactOrder(
  [
    gr("Le circuit électrique simple a une pile, une ampoule, des fils et un ___.", "interrupteur", ["ballon", "robinet"], hints("Pense à la pièce qu'on pousse pour allumer.", "Il ouvre ou ferme le chemin.", "Son nom est très long."), "circuit:interrupteur"),
    gr("Quand le circuit est ___, l'ampoule brille.", "fermé", ["ouvert", "cassé"], hints("Le chemin doit être complet.", "L'interrupteur est poussé.", "C'est le contraire d'ouvert."), "circuit:fermé"),
    gr("Quand le circuit est ___, l'ampoule reste éteinte.", "ouvert", ["fermé", "plein"], hints("Le chemin est coupé.", "Le courant ne peut pas faire le tour.", "C'est le contraire de fermé."), "circuit:ouvert"),
    gr("Un métal est un bon ___ d'électricité.", "conducteur", ["isolant", "cadeau"], hints("Un métal laisse passer l'électricité.", "Le mot commence par la lettre c.", "Il conduit, comme son nom le dit."), "matière:conducteur"),
    gr("Le plastique et le bois sont des ___.", "isolants", ["conducteurs", "métaux"], hints("Ces matières bloquent l'électricité.", "Elles servent de gaine autour des fils.", "Le mot commence par la lettre i."), "matière:isolant"),
    gr("Le cuivre et le fer sont des ___.", "conducteurs", ["isolants", "plastiques"], hints("Ces matières sont des métaux.", "Elles laissent passer l'électricité.", "Le mot commence par la lettre c."), "matière:conducteur"),
    gr("La ___ donne l'électricité au circuit.", "pile", ["ampoule", "interrupteur"], hints("Pense à la lampe torche.", "On la change quand elle est usée.", "Elle a deux bornes, un plus et un moins."), "circuit:pile"),
    gr("Les ___ relient les pièces du circuit.", "fils", ["piles", "ampoules"], hints("Ils sont longs et minces.", "Ils sont couverts de plastique.", "Ils vont d'une pièce à l'autre."), "circuit:fils"),
    gr("Un circuit sans pile ne peut pas ___ l'ampoule.", "allumer", ["manger", "ouvrir"], hints("Sans source d'énergie, rien ne marche.", "Le verbe commence par la lettre a.", "Il fait briller la lumière."), "circuit:pile"),
  gr("Le courant ne passe que si le circuit est ___.", "fermé", ["ouvert", "coupé"], hints("Le chemin doit être complet.", "L'interrupteur est poussé.", "C'est le contraire d'ouvert."), "circuit:fermé"),
  gr("Pour allumer et éteindre, on utilise un ___.", "interrupteur", ["robinet", "ballon"], hints("Pense à ce qu'on touche près de la porte.", "On le pousse ou on le tourne.", "Son nom est très long."), "circuit:interrupteur"),
    gr("L'ampoule ___ quand le circuit est fermé.", "brille", ["grince", "tombe"], hints("Pense à la lumière.", "Elle éclaire la pièce.", "Le verbe se termine par un e."), "circuit:ampoule"),
  ],
  CIRCUIT_FACTS,
);

const CIRCUIT_WRITE_ROWS: readonly WriteRow[] = inFactOrder(
  [
    wr("Quelle pièce du circuit éclaire ? Écris le mot.", ["ampoule", "l'ampoule", "une ampoule"], hints("Pense à ce qui donne de la lumière.", "Elle est en verre.", "Elle brille quand le circuit est fermé."), "circuit:ampoule"),
    wr("Quelle pièce du circuit donne l'électricité ? Écris le mot.", ["pile", "la pile", "une pile"], hints("Pense à ce qui donne l'énergie.", "On la change quand elle est usée.", "Elle est dans la lampe torche."), "circuit:pile"),
    wr("Comment appelle-t-on une matière qui laisse passer l'électricité ? Écris le mot.", ["conducteur", "un conducteur"], hints("Les métaux sont de cette sorte.", "Le mot commence par la lettre c.", "Il conduit, comme son nom le dit."), "matière:conducteur"),
    wr("Comment appelle-t-on une matière qui bloque l'électricité ? Écris le mot.", ["isolant", "un isolant"], hints("Le plastique et le bois sont de cette sorte.", "Le mot commence par la lettre i.", "Il isole, comme son nom le dit."), "matière:isolant"),
    wr("Un circuit simple a une pile, une ampoule, des fils et un interrupteur. Combien de sortes de pièces ? Écris le nombre.", ["4", "quatre"], hints("Compte la pile, l'ampoule, les fils et l'interrupteur.", "C'est le nombre de pattes d'une chèvre.", "C'est un de moins que cinq."), "circuit:nombre"),
    wr("Un circuit où l'électricité circule est un circuit ___. Écris le mot.", ["fermé", "ferme"], hints("Le chemin est complet.", "L'ampoule brille dans ce cas.", "C'est le contraire d'ouvert."), "circuit:fermé"),
    wr("Un circuit où l'électricité ne passe pas est un circuit ___. Écris le mot.", ["ouvert"], hints("Le chemin est coupé quelque part.", "L'ampoule reste sans lumière.", "C'est le contraire de fermé."), "circuit:ouvert"),
    wr("Quelle pièce sert à allumer et à éteindre ? Écris le mot.", ["interrupteur", "un interrupteur", "l'interrupteur"], hints("Pense à ce qu'on touche près de la porte.", "On le pousse ou on le tourne.", "Son nom est très long."), "circuit:interrupteur"),
  ],
  CIRCUIT_FACTS,
);

export function makeCe2CircuitPiece(ctx: GameContext): GeneratedGame {
  return ce2Question(ctx, "ce2-circuit-piece-qcm", "le rôle de la pile, de l'ampoule, des fils et de l'interrupteur", PIECE_ROWS, 1, (row) => `${row.prompt}|${row.answer}`, 1);
}
export function makeCe2CircuitPieceLink(ctx: GameContext): GeneratedGame {
  return ce2Link(ctx, "ce2-circuit-piece-relier", "relier une pièce du circuit à son rôle", PIECE_LINK_ROWS, 1, 0);
}
export function makeCe2CircuitState(ctx: GameContext): GeneratedGame {
  return ce2Question(ctx, "ce2-circuit-etat-qcm", "circuit ouvert, circuit fermé et ce qui arrive à l'ampoule", STATE_ROWS, 1, (row) => row.prompt, 0);
}
export function makeCe2MaterialSort(ctx: GameContext): GeneratedGame {
  return ce2Sort(ctx, "ce2-conducteur-glisser", "ranger les conducteurs et les isolants", MATERIAL_SORT_ROWS, 1, 0);
}
export function makeCe2MaterialChoice(ctx: GameContext): GeneratedGame {
  return ce2Question(ctx, "ce2-matiere-qcm", "reconnaître un conducteur ou un isolant", MATERIAL_ROWS, 1, (row) => `${row.prompt}|${row.answer}`, 2);
}
export function makeCe2DangerSort(ctx: GameContext): GeneratedGame {
  return ce2Sort(ctx, "ce2-danger-glisser", "ranger les gestes sûrs et les gestes dangereux avec l'électricité", DANGER_SORT_ROWS, 1, 0);
}
export function makeCe2CircuitOrder(ctx: GameContext): GeneratedGame {
  return ce2Order(ctx, "ce2-circuit-ordre", "ranger ce qui se passe quand on ferme ou ouvre un circuit", CIRCUIT_ORDER_ROWS, 1, 0);
}
export function makeCe2CircuitGap(ctx: GameContext): GeneratedGame {
  return ce2Gap(ctx, "ce2-circuit-trou", "compléter une phrase sur le circuit, les conducteurs et les isolants", CIRCUIT_GAP_ROWS, 2, 0);
}
export function makeCe2CircuitWrite(ctx: GameContext): GeneratedGame {
  return ce2Write(ctx, "ce2-circuit-ecrire", "écrire un mot sur le circuit électrique", CIRCUIT_WRITE_ROWS, 1, 2);
}

// ===========================================================================
// SE PROTÉGER DES MALADIES
// ===========================================================================

const HEALTH_FACTS = ["palu:moustique", "vih:lame", "palu:moustiquaire", "vih:sang", "palu:eau", "vih:jeu", "palu:habits", "vih:repas", "palu:fièvre", "vih:main", "palu:nom", "vih:seringue", "vih:classe"];
const MALARIA_ROWS: readonly QuestionRow[] = inFactOrder(
  [
    qr("Par quoi le paludisme se transmet-il ?", "Par la piqûre d'un moustique", ["En jouant avec un ami", "En mangeant des mangues"], hints("Pense à un petit insecte qui bourdonne la nuit.", "Il pique la peau pour boire du sang.", "Il se cache près des eaux qui ne bougent pas."), "palu:moustique"),
    qr("Comment se protéger des moustiques pendant la nuit ?", "Dormir sous une moustiquaire", ["Dormir dehors sous les étoiles", "Manger du riz avant de dormir"], hints("Pense à un filet au-dessus du lit.", "Il empêche les insectes d'approcher.", "On le tend autour du matelas."), "palu:moustiquaire"),
    qr("Où les moustiques pondent-ils leurs œufs ?", "Dans l'eau qui ne bouge pas", ["Dans le sable sec", "Dans les branches"], hints("Pense à une flaque oubliée.", "Il faut de l'eau pour que les petits grandissent.", "Cette eau reste au même endroit."), "palu:eau"),
    qr("Que faut-il faire de l'eau qui ne bouge pas autour de la maison ?", "Vider cette eau", ["Garder cette eau", "Boire cette eau"], hints("Pense aux moustiques qui y pondent.", "Sans elle, les petits moustiques ne grandissent pas.", "Il faut s'en débarrasser."), "palu:eau"),
    qr("Quel vêtement protège le soir des piqûres de moustiques ?", "Des habits longs", ["Short", "Maillot"], hints("Pense à couvrir la peau.", "Les manches et le pantalon aident.", "Les moustiques piquent surtout à la tombée de la nuit."), "palu:habits"),
    qr("Que faut-il faire si on a de la fièvre ?", "Prévenir un adulte", ["Se cacher", "Jouer dehors"], hints("Pense à qui peut t'aider.", "Il faut aller voir quelqu'un qui soigne.", "Ne reste pas seul avec ta fièvre."), "palu:fièvre"),
    qr("Quel animal transmet le paludisme ?", "Moustique", ["Poule", "Chèvre"], hints("Pense à un insecte qui pique.", "Il bourdonne près de ton oreille la nuit.", "Il aime l'eau qui dort."), "palu:moustique"),
    qr("Pourquoi dort-on sous une moustiquaire ?", "Pour éviter les piqûres", ["Pour avoir plus chaud", "Pour cacher le lit"], hints("Pense aux insectes de la nuit.", "Le filet les arrête.", "Il protège ta peau."), "palu:moustiquaire"),
  ],
  HEALTH_FACTS,
);

const HIV_ROWS: readonly QuestionRow[] = inFactOrder(
  [
    qr("Quel objet ne faut-il jamais partager pour éviter le VIH ?", "Lame", ["Ballon", "Livre"], hints("Pense à un objet qui coupe la peau.", "Il peut avoir du sang dessus.", "On l'utilise pour se raser."), "vih:lame"),
    qr("Quel objet ne faut-il jamais partager pour éviter le VIH ?", "Seringue", ["Ballon", "Natte"], hints("Pense à un objet qui perce la peau.", "Les infirmiers s'en servent.", "Elle peut avoir du sang dessus."), "vih:seringue"),
    qr("Pour ne pas attraper le VIH, que faut-il éviter de toucher ?", "Le sang d'une autre personne", ["La main d'un ami", "Le ballon d'un copain"], hints("Pense à ce qui coule quand on se blesse.", "C'est un liquide rouge.", "Il faut appeler un adulte pour le nettoyer."), "vih:sang"),
    qr("Peut-on jouer avec un enfant qui a le VIH ?", "Oui, sans aucun danger", ["Non, jamais", "Seulement de loin"], hints("On n'attrape pas le VIH en jouant.", "Un enfant qui a le VIH est comme les autres.", "Il peut courir et rire avec toi."), "vih:jeu"),
    qr("Peut-on attraper le VIH en mangeant avec une personne qui l'a ?", "Non, on ne l'attrape pas ainsi", ["Oui, toujours", "Oui, avec la cuillère"], hints("Le VIH ne passe pas par les repas.", "Manger ensemble est sans danger.", "Le sang est la clé de cette maladie."), "vih:repas"),
    qr("Peut-on attraper le VIH en se donnant la main ?", "Non, on ne l'attrape pas ainsi", ["Oui, toujours", "Oui, à chaque fois"], hints("Se toucher la main est sans danger.", "Le VIH ne passe pas par la peau saine.", "Tu peux serrer la main de tout le monde."), "vih:main"),
    qr("Peut-on attraper le VIH en jouant au ballon ?", "Non, on ne l'attrape pas ainsi", ["Oui, toujours", "Oui, si on joue longtemps"], hints("Jouer ensemble est sans danger.", "Le ballon ne transmet pas la maladie.", "Le VIH passe par le sang, pas par le jeu."), "vih:jeu"),
    qr("Peut-on rester à côté d'un camarade qui a le VIH ?", "Oui, sans aucun danger", ["Non, jamais", "Seulement de loin"], hints("Le VIH ne passe pas quand on est côte à côte.", "Un camarade qui a le VIH peut étudier avec toi.", "Il n'y a pas de risque en classe."), "vih:classe"),
  ],
  HEALTH_FACTS,
);

const MALARIA_ACTS = ["Dormir sous une moustiquaire", "Vider l'eau qui ne bouge pas", "Porter des habits longs le soir"] as const;
const HIV_ACTS = ["Ne pas partager une lame", "Ne pas partager une seringue", "Ne pas toucher le sang d'un autre"] as const;
const GESTURE_SORT_ROWS: readonly SortRow[] = sortRows(
  "Glisse chaque geste sous la maladie dont il protège.",
  ["Paludisme", "VIH"],
  MALARIA_ACTS,
  HIV_ACTS,
  hints("Certains gestes évitent les piqûres, d'autres un contact dangereux.", "Pense aux insectes et aux objets qui coupent.", "Chaque geste va dans une seule case."),
  8,
);

const SAFE_WITH_HIV = ["Jouer ensemble", "Manger ensemble", "Se donner la main", "Partager un jeu"] as const;
const RISK_WITH_HIV = ["Partager une lame", "Partager une seringue", "Toucher du sang"] as const;
const HIV_SORT_ROWS: readonly SortRow[] = sortRows(
  "Pour le VIH, glisse chaque geste sous sans danger ou dangereux.",
  ["Sans danger", "Dangereux"],
  SAFE_WITH_HIV,
  RISK_WITH_HIV,
  hints("Pense à ce qui peut transmettre la maladie.", "Elle passe seulement par le contact avec du liquide rouge.", "Les jeux et les repas ne la transmettent jamais."),
  12,
);

const MALARIA_LINK_POOL = [
  { left: "Dormir sous une moustiquaire", right: "Les moustiques ne peuvent pas piquer pendant la nuit" },
  { left: "Vider l'eau qui ne bouge pas", right: "Les moustiques n'y pondent plus" },
  { left: "Porter des habits longs", right: "La peau est couverte le soir" },
  { left: "Aller voir un médecin", right: "Le médecin soigne la maladie" },
] as const;
const MALARIA_LINK_ROWS: readonly LinkRow[] = combinations(MALARIA_LINK_POOL, 3).map((pairs) => ({
  prompt: "Relie chaque geste à ce qu'il apporte.",
  pairs,
  hints: hints("Pense à ce que chaque geste évite ou permet.", "Lis les raisons une par une.", "Une seule raison va avec chaque geste."),
}));

const HEALTH_GAP_ROWS: readonly GapRow[] = inFactOrder(
  [
    gr("Le paludisme se transmet par la piqûre d'un ___.", "moustique", ["serpent", "poisson"], hints("Pense à un insecte qui bourdonne.", "Il pique pour boire du sang.", "Il aime l'eau qui dort."), "palu:moustique"),
    gr("On dort sous une ___ pour se protéger des moustiques.", "moustiquaire", ["natte", "valise"], hints("Pense à un filet au-dessus du lit.", "Il empêche les insectes d'approcher.", "On le tend autour du matelas."), "palu:moustiquaire"),
    gr("Les moustiques pondent dans l'eau qui ne ___ pas.", "bouge", ["chante", "saute"], hints("Pense à une flaque oubliée.", "Cette eau reste au même endroit.", "Le verbe est le contraire de rester immobile."), "palu:eau"),
    gr("Pour ne pas attraper le VIH, on ne partage pas une ___.", "lame", ["balle", "natte"], hints("Pense à un objet qui coupe la peau.", "Il peut avoir du sang dessus.", "On l'utilise pour se raser."), "vih:lame"),
    gr("Pour ne pas attraper le VIH, on ne touche pas le ___ d'une autre personne.", "sang", ["lait", "mil"], hints("Pense à ce qui coule quand on se blesse.", "C'est un liquide rouge.", "Il faut appeler un adulte."), "vih:sang"),
    gr("On ne peut pas attraper le VIH en se donnant la ___.", "main", ["lame", "seringue"], hints("Pense à un geste d'amitié.", "On le fait pour dire bonjour.", "Les doigts se serrent."), "vih:main"),
    gr("Les moustiques piquent surtout à la tombée de la ___.", "nuit", ["pluie", "récréation"], hints("Pense au moment où il fait noir.", "On dort sous la moustiquaire à ce moment.", "C'est le contraire du jour."), "palu:moustiquaire"),
  gr("On ne partage jamais une ___ avec un autre.", "seringue", ["balle", "natte"], hints("Pense à ce qui perce la peau.", "Les infirmiers s'en servent.", "Elle peut avoir du sang dessus."), "vih:seringue"),
  gr("Le paludisme donne de la ___.", "fièvre", ["joie", "musique"], hints("Pense à la température du corps.", "On a chaud et on tremble.", "Il faut prévenir un adulte."), "palu:fièvre"),
  gr("Pour se protéger du paludisme, on porte des habits ___ le soir.", "longs", ["courts", "mouillés"], hints("Pense à couvrir les bras et les jambes.", "Le contraire de courts.", "Les moustiques piquent la peau découverte."), "palu:habits"),
    gr("Avec un ami qui a le VIH, on peut ___ sans danger.", "jouer", ["se couper", "se piquer"], hints("Pense à ce que font les amis à la récréation.", "On le fait avec un ballon.", "Ça ne transmet rien."), "vih:jeu"),
    gr("Quand on a de la fièvre, on prévient un ___.", "adulte", ["ballon", "mouton"], hints("Pense à une grande personne.", "Elle sait quoi faire pour te soigner.", "Ton père ou ta mère en sont."), "palu:fièvre"),
  ],
  HEALTH_FACTS,
);

const HEALTH_WRITE_ROWS: readonly WriteRow[] = inFactOrder(
  [
    wr("Quel insecte transmet le paludisme ? Écris le mot.", ["moustique", "le moustique", "un moustique"], hints("Pense à un petit insecte qui pique.", "Il bourdonne la nuit.", "Il aime l'eau qui dort."), "palu:moustique"),
    wr("Sous quoi dort-on pour éviter les piqûres de moustique ? Écris le mot.", ["moustiquaire", "une moustiquaire", "la moustiquaire"], hints("Pense à un filet au-dessus du lit.", "Il empêche les insectes d'approcher.", "On le tend autour du matelas."), "palu:moustiquaire"),
    // Question ouverte : tout objet qui coupe ou qui pique la peau est juste, le rasoir et l'aiguille aussi.
    wr("Quel objet ne faut-il jamais partager pour éviter le VIH ? Écris le mot.", ["lame", "seringue", "une lame", "une seringue", "rasoir", "lame de rasoir", "aiguille"], hints("Pense à un objet qui coupe ou qui pique.", "Il peut avoir du sang dessus.", "Les infirmiers et les coiffeurs s'en servent."), "vih:lame"),
    wr("Que ne faut-il pas toucher d'une autre personne pour éviter le VIH ? Écris le mot.", ["sang", "le sang"], hints("Pense à ce qui coule quand on se blesse.", "C'est un liquide rouge.", "Il faut appeler un adulte."), "vih:sang"),
    // « La maladie des moustiques » seule admet aussi la dengue et la fièvre jaune : l'anophèle, appris au CE1, désigne le paludisme.
    wr("Comment s'appelle la maladie que donne la piqûre du moustique anophèle ? Écris le mot.", ["paludisme", "le paludisme", "palu", "le palu", "malaria", "la malaria"], hints("Elle donne de la fièvre.", "Le mot commence par la lettre p.", "On s'en protège avec une moustiquaire."), "palu:nom"),
    // « Quel liquide », pas « que faut-il vider » : sinon « les pneus », « les pots » ou « les flaques » sont justes et refusés.
    wr("Quel liquide faut-il vider des vieux pots et des pneus pour éviter les moustiques ? Écris le mot.", ["eau", "l'eau", "eau stagnante", "l'eau stagnante"], hints("Pense à ce qui reste au fond après la pluie.", "Les moustiques y pondent.", "On la boit aussi."), "palu:eau"),
    wr("Le soir, on porte des habits ___ pour éviter les piqûres. Écris le mot.", ["longs", "long"], hints("Pense à couvrir les bras et les jambes.", "Le contraire de courts.", "Les moustiques piquent la peau découverte."), "palu:habits"),
    wr("Que doit-on faire de l'eau qui ne bouge pas autour de la maison ? Écris le verbe.", ["vider"], hints("Pense aux moustiques qui y pondent.", "Sans cette eau, ils ne peuvent pas grandir.", "Le verbe commence par la lettre v."), "palu:eau"),
  ],
  HEALTH_FACTS,
);

export function makeCe2MalariaChoice(ctx: GameContext): GeneratedGame {
  return ce2Question(ctx, "ce2-palu-qcm", "comment on attrape le paludisme et comment s'en protéger", MALARIA_ROWS, 1, (row) => row.prompt, 0);
}
export function makeCe2HivChoice(ctx: GameContext): GeneratedGame {
  return ce2Question(ctx, "ce2-vih-qcm", "ce qui transmet le VIH et ce qui ne le transmet pas", HIV_ROWS, 2, (row) => `${row.prompt}|${row.answer}`, 0);
}
export function makeCe2GestureSort(ctx: GameContext): GeneratedGame {
  return ce2Sort(ctx, "ce2-geste-glisser", "ranger les gestes qui protègent du paludisme ou du VIH", GESTURE_SORT_ROWS, 1, 0);
}
export function makeCe2HivSort(ctx: GameContext): GeneratedGame {
  return ce2Sort(ctx, "ce2-vih-glisser", "ranger les gestes sans danger et les gestes dangereux pour le VIH", HIV_SORT_ROWS, 1, 0);
}
export function makeCe2MalariaLink(ctx: GameContext): GeneratedGame {
  return ce2Link(ctx, "ce2-palu-relier", "relier un geste contre le paludisme à ce qu'il apporte", MALARIA_LINK_ROWS, 1, 0);
}
export function makeCe2HealthGap(ctx: GameContext): GeneratedGame {
  return ce2Gap(ctx, "ce2-sante-trou", "compléter une phrase sur le paludisme ou le VIH", HEALTH_GAP_ROWS, 2, 2);
}
export function makeCe2HealthWrite(ctx: GameContext): GeneratedGame {
  return ce2Write(ctx, "ce2-sante-ecrire", "écrire un mot sur le paludisme ou le VIH", HEALTH_WRITE_ROWS, 2, 3);
}

// ===========================================================================
// L'ENVIRONNEMENT ET LA POPULATION
// ===========================================================================

const ENV_FACTS = ["env:sachet:cause", "env:feu:solution", "env:arbres:cause", "env:déchets:solution", "env:eau:cause", "env:sachet:solution", "env:feu:cause", "env:arbres:solution", "env:peuplé:cause", "env:déchets:cause", "env:eau:solution", "env:déchets:ramasser", "env:déchets:rue"];
const CAUSE_ROWS: readonly QuestionRow[] = inFactOrder(
  [
    qr("Pourquoi les sachets plastiques sont-ils un problème ?", "Ils restent très longtemps dans la nature", ["Ils pourrissent vite", "Ils font pousser les plantes"], hints("Pense à un sachet oublié par terre.", "Il ne se transforme pas en terre.", "On le retrouve encore des années plus tard."), "env:sachet:cause"),
    qr("Que provoque la coupe de trop d'arbres ?", "Moins d'ombre et moins d'abris pour les animaux", ["Plus d'ombre sous le soleil", "Plus d'animaux dans la brousse"], hints("Pense à ce que donne un grand arbre.", "Les oiseaux y font leur nid.", "Sans lui, le soleil tape plus fort."), "env:arbres:cause"),
    qr("Que provoquent les feux de brousse ?", "Ils brûlent les arbres, les herbes et les animaux", ["Ils font pousser les arbres plus vite", "Ils apportent de l'eau"], hints("Pense au feu qui court dans l'herbe sèche.", "Il détruit ce qu'il touche.", "Il laisse seulement de la cendre."), "env:feu:cause"),
    qr("Que se passe-t-il quand les déchets restent dans la rue ?", "Ils attirent les mouches et sentent mauvais", ["Ils rendent l'air très pur", "Ils font beaucoup d'ombre"], hints("Pense aux odeurs d'un tas d'ordures.", "Les insectes aiment les restes.", "Les maladies s'installent."), "env:déchets:cause"),
    qr("Pourquoi ne faut-il pas jeter les déchets par terre ?", "Ils salissent et font tomber malade", ["Ils font pousser les arbres", "Ils rendent l'eau plus claire"], hints("Pense à ce que deviennent les ordures.", "Les mouches et les rats s'y installent.", "La santé de tous est en danger."), "env:déchets:cause"),
  qr("Pourquoi les arbres sont-ils utiles ?", "Ils donnent de l'ombre et abritent les animaux", ["Ils font beaucoup de bruit", "Ils salissent toutes les rues"], hints("Pense à ce qu'on trouve sous un grand arbre.", "Les oiseaux y font leur nid.", "Ils protègent du soleil."), "env:arbres:cause"),
  qr("Pourquoi manque-t-on d'eau dans un quartier trop peuplé ?", "Il y a trop de monde pour la même eau", ["Il y a trop de pluie", "Les gens boivent moins"], hints("Pense au nombre d'habitants.", "Beaucoup de gens utilisent un seul puits.", "L'eau est partagée entre beaucoup de bouches."), "env:eau:cause"),
    qr("Qu'arrive-t-il dans un quartier trop peuplé ?", "Il y a peu de place pour tout le monde", ["Il y a trop d'espace vide", "Il y a peu de gens"], hints("Pense à une rue pleine de maisons serrées.", "Il y a beaucoup d'habitants au même endroit.", "On ne peut plus bouger."), "env:peuplé:cause"),
  ],
  ENV_FACTS,
);

const SOLUTION_ROWS: readonly QuestionRow[] = inFactOrder(
  [
    qr("Que faire des déchets ?", "Les mettre à la poubelle", ["Les jeter dans la rue", "Les brûler dans la brousse"], hints("Pense à un seau avec un couvercle.", "Cela garde le quartier propre.", "On le vide ensuite au bon endroit."), "env:déchets:solution"),
    qr("Comment éviter les sachets plastiques ?", "Utiliser un panier ou un sac en tissu", ["En acheter beaucoup plus", "Les jeter par terre"], hints("Pense à ce que l'on peut laver et réutiliser.", "Les grands-mères en ont toujours un.", "Il remplace le sachet à chaque course."), "env:sachet:solution"),
    qr("Que faire quand on coupe un arbre ?", "Planter un nouvel arbre", ["Couper un autre arbre", "Ne rien faire du tout"], hints("Pense à l'avenir de la brousse.", "Il faut remplacer ce qui a disparu.", "Une petite pousse grandira."), "env:arbres:solution"),
    qr("Comment éviter les feux de brousse ?", "Ne pas allumer de feu dans la brousse", ["Allumer des feux près des herbes sèches", "Jeter des cendres chaudes dans l'herbe"], hints("Pense à ce qui peut mettre le feu à l'herbe sèche.", "Une étincelle suffit.", "Mieux vaut ne pas jouer avec le feu."), "env:feu:solution"),
    qr("Comment économiser l'eau ?", "Fermer le robinet quand on ne s'en sert pas", ["Laisser couler l'eau", "Remplir un seau et le vider"], hints("Pense à ce qui coule au moment de se laver les mains.", "On peut l'arrêter avec un geste.", "Chaque goutte compte."), "env:eau:solution"),
    qr("Que faire pour ne pas gaspiller l'eau du puits ?", "Ne prendre que l'eau dont on a besoin", ["Remplir tous les seaux du village", "Laisser le seau ouvert au soleil"], hints("Pense à ce que tu bois et à ce que tu laisses.", "Chaque goutte compte.", "L'eau est rare pendant la saison sèche."), "env:eau:solution"),
  qr("Comment protéger les arbres de la brousse ?", "Ne pas couper de jeunes arbres", ["Couper les plus petits d'abord", "Allumer un feu autour des troncs"], hints("Pense à ce qui grandit pour donner de l'ombre.", "Les petites pousses sont fragiles.", "Il faut leur laisser le temps."), "env:arbres:solution"),
  qr("Que peut-on faire pour garder le quartier propre ?", "Ramasser les déchets ensemble", ["Laisser les déchets au soleil", "Jeter les déchets dans le puits"], hints("Pense à un travail que l'on fait à plusieurs.", "On passe dans les rues avec un sac.", "Les voisins s'entraident."), "env:déchets:ramasser"),
  ],
  ENV_FACTS,
);

const PROBLEM_POOL = [
  { left: "Sachets plastiques", right: "Un panier en tissu" },
  { left: "Déchets dans la rue", right: "Poubelle" },
  { left: "Arbre coupé", right: "Un arbre planté" },
  { left: "Feu de brousse", right: "Ne pas allumer de feu" },
  { left: "Manque d'eau", right: "Ne pas gaspiller l'eau" },
] as const;
const PROBLEM_LINK_ROWS: readonly LinkRow[] = combinations(PROBLEM_POOL, 3)
  .slice(0, 8)
  .map((pairs) => ({
  prompt: "Relie chaque problème à une solution.",
  pairs,
  hints: hints("Pense à ce qui répare chaque problème.", "Lis les solutions une par une.", "Une seule solution va avec chaque problème."),
}));

const NATURE_PROBLEMS = ["Sachets plastiques", "Coupe des arbres", "Feux de brousse", "Déchets dans la rue"] as const;
const PEOPLE_PROBLEMS = ["Quartier trop peuplé", "Pas assez d'eau pour tous", "Peu de place pour vivre"] as const;
const PROBLEM_SORT_ROWS: readonly SortRow[] = sortRows(
  "Glisse chaque problème dans la bonne case.",
  ["Environnement", "Population"],
  NATURE_PROBLEMS,
  PEOPLE_PROBLEMS,
  hints("Certains problèmes viennent de la nature abîmée.", "D'autres viennent d'un très grand nombre d'habitants.", "Chaque problème a une seule case."),
  12,
);

const GOOD_ACTS = ["Mettre les déchets à la poubelle", "Planter un arbre", "Fermer le robinet", "Utiliser un sac en tissu", "Ramasser les déchets"] as const;
const BAD_ACTS = ["Jeter un sachet par terre", "Allumer un feu dans la brousse", "Couper des arbres pour rien", "Laisser couler l'eau", "Jeter les déchets dans la rue"] as const;
const ACT_SORT_ROWS: readonly SortRow[] = sortRows(
  "Glisse chaque geste dans la bonne case.",
  ["Bon geste", "Mauvais geste"],
  GOOD_ACTS,
  BAD_ACTS,
  hints("Demande-toi si ce que tu fais protège ou abîme le milieu.", "Du bon côté, on aide la nature et les gens.", "De l'autre côté, on abîme ce qui nous entoure."),
  20,
);

const ENV_ORDER_ROWS: readonly OrderRow[] = inFactOrder(
  [
    ordr("Mets ces gestes dans l'ordre du temps pour planter un arbre.", ["Creuser un trou", "Mettre le jeune arbre", "Reboucher avec la terre", "Arroser"], hints("Commence par préparer la place.", "On met la plante avant de couvrir ses racines.", "L'eau vient à la fin."), "env:arbres:solution"),
    ordr("Mets ces gestes dans l'ordre du temps pour jeter des déchets.", ["Ramasser les déchets", "Les mettre dans un sac", "Jeter le sac à la poubelle"], hints("On commence par le sol.", "Il faut tout rassembler avant de transporter.", "Le dernier geste est pour le bon endroit."), "env:déchets:solution"),
    ordr("Mets ces événements dans l'ordre du temps.", ["On coupe beaucoup d'arbres", "Le sol n'est plus protégé", "La pluie emporte la terre"], hints("Tout commence par un geste des hommes.", "Sans racines, le sol se défait.", "Un orage fait le reste."), "env:arbres:cause"),
    ordr("Mets ces événements dans l'ordre du temps.", ["Une étincelle tombe dans l'herbe sèche", "Le feu s'étend", "Les arbres brûlent"], hints("Tout commence par une petite flamme.", "Le feu grandit ensuite.", "Les plantes sont atteintes à la fin."), "env:feu:cause"),
  ],
  ENV_FACTS,
);

const ENV_GAP_ROWS: readonly GapRow[] = inFactOrder(
  [
    gr("Un sachet plastique reste très longtemps dans la ___.", "nature", ["classe", "cuisine"], hints("Pense à l'endroit où on le jette.", "Il y reste des années.", "C'est l'environnement autour de nous."), "env:sachet:cause"),
    gr("Les feux de ___ brûlent les arbres et les herbes.", "brousse", ["école", "puits"], hints("Pense à l'endroit sauvage, loin du village.", "Il y pousse de l'herbe sèche.", "Les animaux sauvages y vivent."), "env:feu:cause"),
    gr("On met les déchets à la ___.", "poubelle", ["rue", "brousse"], hints("Pense à un grand seau avec un couvercle.", "On le vide régulièrement.", "Cela garde le quartier propre."), "env:déchets:solution"),
    gr("Pour remplacer un arbre coupé, on en ___ un autre.", "plante", ["coupe", "brûle"], hints("Pense à une graine ou à une petite pousse.", "On la met dans la terre.", "Elle grandira avec le temps."), "env:arbres:solution"),
    gr("Un quartier trop ___ manque souvent d'eau.", "peuplé", ["propre", "vert"], hints("Pense au nombre d'habitants.", "Il y a trop de monde dans un petit espace.", "Le mot vient de ceux qui y habitent."), "env:peuplé:cause"),
    gr("Un sac en ___ peut remplacer un sachet plastique.", "tissu", ["sable", "pierre"], hints("Pense à une matière souple qu'on peut laver.", "Les boubous sont faits de cette matière.", "On peut le réutiliser."), "env:sachet:solution"),
    gr("Il faut ___ le robinet quand on ne s'en sert pas.", "fermer", ["ouvrir", "casser"], hints("Pense à ce qu'on fait pour arrêter l'eau.", "C'est le contraire d'ouvrir.", "Cela évite de gaspiller."), "env:eau:solution"),
    gr("On ne doit pas ___ les déchets dans la rue.", "jeter", ["ramasser", "compter"], hints("Pense à ce qu'on fait avec un papier inutile.", "C'est un mauvais geste dans la rue.", "On le fait loin de la poubelle."), "env:déchets:rue"),
    gr("Les sachets plastiques ne ___ pas dans la terre.", "pourrissent", ["dorment", "chantent"], hints("Pense à ce qui arrive à une feuille morte.", "Le plastique reste intact très longtemps.", "Le verbe commence par la lettre p."), "env:sachet:cause"),
  gr("Pour garder le quartier propre, on ___ les déchets ensemble.", "ramasse", ["perd", "cache"], hints("Pense à un travail fait à plusieurs.", "On passe dans les rues avec un sac.", "C'est le contraire de jeter."), "env:déchets:ramasser"),
  gr("Un feu de brousse peut brûler toute la ___.", "forêt", ["mer", "lune"], hints("Pense à tous les arbres.", "Le feu court dans l'herbe sèche.", "Les animaux fuient."), "env:feu:cause"),
  gr("Planter un arbre aide à protéger la ___.", "nature", ["cuisine", "voiture"], hints("Pense à tout ce qui vit dehors.", "Les arbres donnent de l'ombre.", "C'est l'environnement autour de nous."), "env:arbres:solution"),
  ],
  ENV_FACTS,
);

const ENV_WRITE_ROWS: readonly WriteRow[] = inFactOrder(
  [
    wr("Où faut-il mettre les déchets ? Écris le mot.", ["poubelle", "la poubelle", "une poubelle"], hints("Pense à un grand seau avec un couvercle.", "On le vide régulièrement.", "Cela garde le quartier propre."), "env:déchets:solution"),
    wr("Pour remplacer ce qu'on a coupé dans la brousse, on plante un ___. Écris le mot.", ["arbre", "un arbre"], hints("Pense à une petite pousse.", "Elle grandit avec le temps.", "Il donne de l'ombre aux animaux."), "env:arbres:solution"),
    wr("Comment appelle-t-on le feu qui brûle les herbes et les arbres ? Écris les trois mots.", ["feu de brousse", "feux de brousse", "un feu de brousse"], hints("Pense à la saison sèche.", "Il court dans l'herbe.", "Le dernier mot est le nom d'un lieu sauvage."), "env:feu:cause"),
    // L'énoncé dit « donné au marché pour porter les achats » : sinon « bouteille » serait juste et refusée.
    wr(
      "Quel objet en plastique, donné au marché pour porter les achats, reste très longtemps dans la nature ? Écris le mot.",
      ["sachet", "sachets", "un sachet", "sachet plastique", "sachets plastiques", "sachet en plastique", "sac", "sac plastique", "sac en plastique"],
      hints("Il est léger et très fin.", "Il vole dans la rue.", "On peut le remplacer par un panier."),
      "env:sachet:cause",
    ),
    wr("Que faut-il fermer pour ne pas gaspiller l'eau ? Écris le mot.", ["robinet", "le robinet"], hints("Pense à ce qu'on tourne pour arrêter l'eau.", "Il est au-dessus de l'évier.", "Il coule quand on l'ouvre."), "env:eau:solution"),
    wr("Un quartier où il y a beaucoup trop de monde est trop ___. Écris le mot.", ["peuplé", "surpeuplé"], hints("Pense au nombre d'habitants.", "Le mot vient de ceux qui y habitent.", "Il se termine par la lettre é."), "env:peuplé:cause"),
    wr("Que ramasse-t-on ensemble pour garder le quartier propre ? Écris le mot.", ["déchets", "les déchets", "dechets", "ordures"], hints("Pense à ce qu'on trouve par terre.", "On les met dans un sac.", "Ils vont ensuite à la poubelle."), "env:déchets:ramasser"),
    wr("Quel liquide manque dans un quartier trop peuplé ? Écris le mot.", ["eau", "l'eau"], hints("Pense à ce qu'on boit.", "On la puise au puits.", "Elle est précieuse."), "env:eau:cause"),
  ],
  ENV_FACTS,
);

export function makeCe2EnvironmentCause(ctx: GameContext): GeneratedGame {
  return ce2Question(ctx, "ce2-env-cause-qcm", "ce que provoque un problème de l'environnement ou de la population", CAUSE_ROWS, 1, (row) => row.prompt, 0);
}
export function makeCe2EnvironmentSolution(ctx: GameContext): GeneratedGame {
  return ce2Question(ctx, "ce2-env-solution-qcm", "la solution à un problème de l'environnement", SOLUTION_ROWS, 1, (row) => row.prompt, 0);
}
export function makeCe2ProblemLink(ctx: GameContext): GeneratedGame {
  return ce2Link(ctx, "ce2-env-relier", "relier un problème à sa solution", PROBLEM_LINK_ROWS, 1, 0);
}
export function makeCe2ProblemSort(ctx: GameContext): GeneratedGame {
  return ce2Sort(ctx, "ce2-env-probleme-glisser", "ranger les problèmes de l'environnement et de la population", PROBLEM_SORT_ROWS, 1, 0);
}
export function makeCe2ActSort(ctx: GameContext): GeneratedGame {
  return ce2Sort(ctx, "ce2-env-geste-glisser", "ranger les bons et les mauvais gestes pour l'environnement", ACT_SORT_ROWS, 1, 1);
}
export function makeCe2EnvironmentOrder(ctx: GameContext): GeneratedGame {
  return ce2Order(ctx, "ce2-env-ordre", "ranger les gestes ou les événements dans l'ordre du temps", ENV_ORDER_ROWS, 1, 3);
}
export function makeCe2EnvironmentGap(ctx: GameContext): GeneratedGame {
  return ce2Gap(ctx, "ce2-env-trou", "compléter une phrase sur l'environnement et la population", ENV_GAP_ROWS, 2, 1);
}
export function makeCe2EnvironmentWrite(ctx: GameContext): GeneratedGame {
  return ce2Write(ctx, "ce2-env-ecrire", "écrire un mot sur l'environnement et la population", ENV_WRITE_ROWS, 2, 3);
}
