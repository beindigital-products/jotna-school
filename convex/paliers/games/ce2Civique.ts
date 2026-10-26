/**
 * LES GABARITS DE L'INSTRUCTION CIVIQUE DU CE2 : mes droits et mes devoirs, vivre en paix, les bonnes valeurs, la vie en communauté
 * (`ci-ce2-droits`, `ci-ce2-paix`, `ci-ce2-valeurs`, `ci-ce2-communaute`).
 *
 * Sur l'échantillon de CE2, le modèle écrivait ici des exercices creux ou discutables : « Comment peut-on améliorer la vie dans notre
 * quartier ? » (une question d'opinion), « Donne un exemple de dialogue pour régler un problème » (une réponse libre qu'aucune clé ne
 * peut juger), « Pourquoi est-il important de respecter ses amis ? », des indices qui répétaient « Relis bien les options ». Ici chaque
 * exercice lit une ligne d'un tableau fermé : une situation et son bon comportement, un mot et son sens, un geste et sa valeur.
 *
 * CE QUE LES FICHES DONNENT, ET CE QUE CE FICHIER N'INVENTE PAS
 * - Les droits de l'enfant : avoir un nom, aller à l'école, être soigné, être protégé, jouer. Ses devoirs : respecter les autres,
 *   travailler à l'école, aider à la maison.
 * - La paix : le dialogue, la tolérance, la médiation ; refuser la violence et les moqueries.
 * - Les valeurs : l'honnêteté, la solidarité, le courage, le respect de la parole donnée, l'hospitalité (la teranga), à l'école et à la maison.
 * - La communauté : les règles du quartier, les biens communs (le puits, le marché, le terrain de sport), s'entraider entre voisins.
 * Une situation n'a qu'un bon comportement. Les mauvais choix sont des comportements que l'enfant reconnaît comme mauvais, jamais une
 * autre bonne réponse. Aucune langue, ethnie ni religion n'est rangée dans un groupe.
 *
 * RÈGLES POUR AJOUTER UNE LIGNE : celles de `ce2Vivant.ts` (étiquette = nom seul avec majuscule quand elle nomme une chose, une apostrophe
 * droite au plus par énoncé et par phrase à trou, trois indices sans chiffre ni mot de quatre lettres ou plus d'une bonne réponse ou d'une tuile,
 * une liste de 4, 8, 12, 16 ou 20 lignes, jamais une bonne option deux fois plus longue que les autres).
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
// MES DROITS ET MES DEVOIRS
// ===========================================================================

const RIGHT_FACTS = ["droit:nom", "devoir:aider", "droit:école", "devoir:travailler", "droit:soins", "devoir:respecter", "droit:protection", "droit:jeu", "droit:mot", "devoir:mot"];
const RIGHTS = ["Avoir un nom", "Aller à l'école", "Être soigné", "Être protégé", "Jouer"] as const;
const DUTIES = ["Respecter les autres", "Travailler à l'école", "Aider à la maison"] as const;

const RIGHT_ROWS: readonly QuestionRow[] = inFactOrder(
  [
    qr("Fatou reçoit son prénom le jour de sa naissance. Quel droit est respecté ?", "Avoir un nom", ["Jouer", "Être soigné"], hints("Pense à ce que ses parents lui donnent.", "Grâce à lui, on l'appelle et on la reconnaît.", "Chaque enfant en reçoit un."), "droit:nom"),
    qr("Un acte de naissance écrit le prénom de Modou. Quel droit est respecté ?", "Avoir un nom", ["Aller à l'école", "Être protégé"], hints("Pense à ce qui est écrit sur le papier.", "Il dit qui est l'enfant.", "On l'appelle ainsi toute sa vie."), "droit:nom"),
    qr("Chaque enfant du quartier est inscrit sur le registre de la mairie. Quel droit est respecté ?", "Avoir un nom", ["Être protégé", "Être soigné"], hints("Pense à ce qui est écrit dans le registre.", "On y note qui est chaque enfant.", "Cela commence à la naissance."), "droit:nom"),
    qr("Ibou part à l'école chaque matin avec son cartable. Quel droit est respecté ?", "Aller à l'école", ["Être soigné", "Jouer"], hints("Pense à l'endroit où il va avec son cartable.", "Il y apprend à lire et à écrire.", "Tous les enfants doivent pouvoir s'y rendre."), "droit:école"),
    qr("Aminata apprend à lire avec ses camarades. Quel droit est respecté ?", "Aller à l'école", ["Être protégé", "Avoir un nom"], hints("Pense à ce qu'elle apprend avec la maîtresse.", "Elle est assise dans une classe.", "Cela se passe dans un bâtiment pour apprendre."), "droit:école"),
    qr("Awa a de la fièvre et l'infirmier la soigne. Quel droit est respecté ?", "Être soigné", ["Jouer", "Avoir un nom"], hints("Pense à ce que fait l'infirmier.", "Awa est malade.", "Elle reçoit des médicaments."), "droit:soins"),
    qr("Un médecin examine Cheikh quand il a mal au ventre. Quel droit est respecté ?", "Être soigné", ["Jouer", "Aller à l'école"], hints("Pense à ce que fait le médecin.", "Cheikh a mal.", "On s'occupe de sa santé."), "droit:soins"),
    qr("Une grande personne éloigne Modou d'un fil électrique tombé. Quel droit est respecté ?", "Être protégé", ["Avoir un nom", "Jouer"], hints("Pense au danger qui menace Modou.", "Quelqu'un veille sur lui.", "On le met à l'abri."), "droit:protection"),
    qr("Les adultes surveillent les enfants près du fleuve. Quel droit est respecté ?", "Être protégé", ["Être soigné", "Aller à l'école"], hints("Pense à ce qui pourrait arriver près de l'eau.", "Les adultes sont attentifs.", "Aucun enfant ne doit risquer sa vie."), "droit:protection"),
    qr("Les enfants courent et rient dans la cour. Quel droit est respecté ?", "Jouer", ["Être soigné", "Avoir un nom"], hints("Pense à ce qu'ils font à la récréation.", "Ils s'amusent.", "Ce n'est pas un travail."), "droit:jeu"),
    qr("Après les devoirs, Mariama a le temps de s'amuser. Quel droit est respecté ?", "Jouer", ["Être protégé", "Aller à l'école"], hints("Pense à ce qu'elle fait après le travail.", "Elle se repose et rit.", "Les enfants en ont besoin pour grandir."), "droit:jeu"),
    qr("Les enfants dansent et chantent sous le grand arbre. Quel droit est respecté ?", "Jouer", ["Avoir un nom", "Être soigné"], hints("Pense à ce qu'ils font pour le plaisir.", "Ils rient ensemble.", "C'est un moment de détente."), "droit:jeu"),
  ],
  RIGHT_FACTS,
);

const DUTY_ROWS: readonly QuestionRow[] = inFactOrder(
  [
    qr("Fatou balaie la cour avant de partir à l'école. Quel devoir respecte-t-elle ?", "Aider à la maison", ["Respecter les autres", "Travailler à l'école"], hints("Pense à la cour de sa famille.", "Elle rend service avant de partir.", "Elle se rend utile chez elle."), "devoir:aider"),
    qr("Ibou porte l'eau pour sa mère. Quel devoir respecte-t-il ?", "Aider à la maison", ["Respecter les autres", "Travailler à l'école"], hints("Pense à qui a besoin de cette eau.", "Il soulage sa mère.", "Il se rend utile chez lui."), "devoir:aider"),
    qr("Awa range sa natte et ses habits. Quel devoir respecte-t-elle ?", "Aider à la maison", ["Travailler à l'école", "Respecter les autres"], hints("Pense à l'endroit où elle range.", "Elle garde sa chambre en ordre.", "Elle rend service à sa famille."), "devoir:aider"),
    qr("Modou lave les assiettes après le repas. Quel devoir respecte-t-il ?", "Aider à la maison", ["Respecter les autres", "Travailler à l'école"], hints("Pense à ce qui se passe après le repas.", "Il fait sa part du travail de la famille.", "Cela se passe chez lui."), "devoir:aider"),
    qr("Ali apprend sa leçon chaque soir. Quel devoir respecte-t-il ?", "Travailler à l'école", ["Aider à la maison", "Respecter les autres"], hints("Pense à ce que la maîtresse lui demande.", "Il retient son cours.", "Il fait de son mieux en classe."), "devoir:travailler"),
    qr("Mariama fait tous ses exercices de calcul sans copier. Quel devoir respecte-t-elle ?", "Travailler à l'école", ["Respecter les autres", "Aider à la maison"], hints("Pense à ce qu'on fait avec un cahier.", "Elle fait l'effort elle-même.", "Cela concerne la classe."), "devoir:travailler"),
    qr("Cheikh dit bonjour à tous ses camarades. Quel devoir respecte-t-il ?", "Respecter les autres", ["Aider à la maison", "Travailler à l'école"], hints("Pense à ce que Cheikh dit à ses camarades.", "Il montre de la politesse.", "Il pense aux enfants qui l'entourent."), "devoir:respecter"),
    qr("Pape prête son crayon sans se moquer de son ami. Quel devoir respecte-t-il ?", "Respecter les autres", ["Travailler à l'école", "Aider à la maison"], hints("Pense à ce que ressent son ami.", "Il ne le blesse pas.", "Il agit avec gentillesse."), "devoir:respecter"),
  ],
  RIGHT_FACTS,
);

const RIGHT_SORT_ROWS: readonly SortRow[] = sortRows(
  "Glisse chaque phrase dans la bonne case.",
  ["Droit", "Devoir"],
  RIGHTS,
  DUTIES,
  hints("Ce que l'enfant reçoit va d'un côté.", "Ce que l'enfant doit faire va de l'autre côté.", "Pense à qui donne et à qui doit agir."),
  20,
);

const RIGHT_LINK_POOL = [
  { left: "Avoir un nom", right: "Être appelé par son prénom" },
  { left: "Aller à l'école", right: "Apprendre à lire et à écrire" },
  { left: "Être soigné", right: "Aller voir le médecin" },
  { left: "Être protégé", right: "Être à l'abri du danger" },
  { left: "Jouer", right: "S'amuser dans la cour" },
] as const;
const RIGHT_LINK_ROWS: readonly LinkRow[] = combinations(RIGHT_LINK_POOL, 3)
  .slice(0, 8)
  .map((pairs) => ({
    prompt: "Relie chaque droit à un exemple.",
    pairs,
    hints: hints("Pense à ce que chaque droit permet de vivre.", "Lis les exemples un par un.", "Un seul exemple va avec chaque droit."),
  }));

const RIGHT_GAP_ROWS: readonly GapRow[] = inFactOrder(
  [
    gr("Chaque enfant a le droit d'avoir un ___.", "nom", ["cheval", "champ"], hints("Pense à ce qu'on te donne à ta naissance.", "On t'appelle ainsi.", "Tu l'écris en haut de ton cahier."), "droit:nom"),
    gr("Un enfant malade a le droit d'être ___.", "soigné", ["puni", "grondé"], hints("Pense à ce que fait le médecin.", "L'enfant reçoit des médicaments.", "On s'occupe de sa santé."), "droit:soins"),
    gr("Un enfant a le droit d'être ___ du danger.", "protégé", ["séparé", "puni"], hints("Pense à quelqu'un qui veille sur lui.", "On le met à l'abri.", "Il ne risque rien."), "droit:protection"),
    gr("Tous les enfants ont le droit de ___.", "jouer", ["frapper", "insulter"], hints("Pense à la récréation.", "Les enfants s'amusent.", "Le verbe rime avec nouer."), "droit:jeu"),
    gr("Aider à la maison est un ___ de l'enfant.", "devoir", ["droit", "cadeau"], hints("Ce n'est pas ce que l'enfant reçoit.", "C'est ce qu'il doit faire.", "Le mot est plus long que son contraire."), "devoir:mot"),
    gr("Avoir un nom est un ___ de l'enfant.", "droit", ["devoir", "jeu"], hints("C'est ce que l'enfant reçoit.", "Personne ne peut le lui retirer.", "Le mot est plus court que son contraire."), "droit:mot"),
    gr("L'enfant doit ___ ses camarades.", "respecter", ["frapper", "gronder"], hints("Pense à la politesse.", "On ne blesse personne.", "On pense aux autres."), "devoir:respecter"),
    gr("Travailler en classe est un ___ de l'élève.", "devoir", ["cadeau", "jeu"], hints("C'est ce que l'élève doit faire.", "Ce n'est pas un cadeau.", "Le mot est plus long que son contraire."), "devoir:travailler"),
    gr("L'enfant doit ___ sa mère à la maison.", "aider", ["gronder", "oublier"], hints("Pense à rendre service.", "On porte, on balaie, on range.", "Le verbe commence par la lettre a."), "devoir:aider"),
    gr("Pour un enfant, aller à l'école est un ___.", "droit", ["cadeau", "jeu"], hints("C'est ce que tous les enfants reçoivent.", "On ne peut pas le leur retirer.", "Le mot est plus court que son contraire."), "droit:école"),
    gr("Les enfants ont le droit de ___ à l'école.", "apprendre", ["voler", "dormir"], hints("Pense à ce qu'on fait en classe.", "La maîtresse enseigne.", "Le verbe commence par la lettre a."), "droit:école"),
    gr("Un enfant qui a mal à la dent a le droit d'aller chez le ___.", "médecin", ["tailleur", "menuisier"], hints("Pense à qui soigne les malades.", "Il porte une blouse blanche.", "Il examine et donne des médicaments."), "droit:soins"),
  ],
  RIGHT_FACTS,
);

const RIGHT_WRITE_ROWS: readonly WriteRow[] = inFactOrder(
  [
    wr("Chez le médecin, un enfant malade a le droit d'être ___. Écris le mot.", ["soigné", "soignée", "soignés", "guéri", "guérie"], hints("Pense à ce que fait le médecin.", "L'enfant reçoit des médicaments.", "Le mot commence par la lettre s."), "droit:soins"),
    wr("Comment appelle-t-on ce que l'enfant reçoit, comme avoir un nom ? Écris le mot.", ["droit", "un droit"], hints("C'est ce qui est donné à tous.", "Personne ne peut le retirer.", "Le mot est plus court que son contraire."), "droit:mot"),
    wr("Comment appelle-t-on ce que l'enfant doit faire, comme aider à la maison ? Écris le mot.", ["devoir", "un devoir"], hints("C'est ce qu'on attend de l'enfant.", "On doit le faire.", "Le mot est plus long que son contraire."), "devoir:mot"),
    wr("Quel verbe veut dire s'amuser, comme à la récréation ? Écris le verbe.", ["jouer"], hints("Pense à la récréation.", "On le fait avec ses amis.", "Le verbe rime avec nouer."), "droit:jeu"),
    wr("Balayer la cour et ranger la chambre, c'est ___ sa mère. Écris le verbe.", ["aider"], hints("Pense à rendre service.", "Ces gestes soulagent la famille.", "Le verbe commence par la lettre a."), "devoir:aider"),
    wr("Faire ses exercices et apprendre ses leçons, c'est ___ en classe. Écris le verbe.", ["travailler", "étudier"], hints("Pense au devoir de chaque élève.", "Il fait des efforts.", "Le verbe commence par la lettre t."), "devoir:travailler"),
    wr("Chaque enfant a le droit d'avoir un ___ dès sa naissance. Écris le mot.", ["nom", "prénom", "nom de famille"], hints("Pense à ce qu'on écrit sur un cahier.", "On l'utilise pour appeler l'enfant.", "Le mot a trois lettres."), "droit:nom"),
    wr("Être poli et ne pas se moquer, c'est ___ les autres. Écris le verbe.", ["respecter"], hints("Pense à la politesse.", "On ne blesse personne.", "Le verbe commence par la lettre r."), "devoir:respecter"),
  ],
  RIGHT_FACTS,
);

export function makeCe2RightChoice(ctx: GameContext): GeneratedGame {
  return ce2Question(ctx, "ce2-droit-qcm", "reconnaître le droit de l'enfant respecté dans une situation", RIGHT_ROWS, 2, (row) => row.prompt, 3);
}
export function makeCe2DutyChoice(ctx: GameContext): GeneratedGame {
  return ce2Question(ctx, "ce2-devoir-qcm", "reconnaître le devoir de l'enfant respecté dans une situation", DUTY_ROWS, 2, (row) => row.prompt, 1);
}
export function makeCe2RightSort(ctx: GameContext): GeneratedGame {
  return ce2Sort(ctx, "ce2-droit-glisser", "ranger les droits et les devoirs de l'enfant", RIGHT_SORT_ROWS, 1, 0);
}
export function makeCe2RightLink(ctx: GameContext): GeneratedGame {
  return ce2Link(ctx, "ce2-droit-relier", "relier un droit de l'enfant à un exemple", RIGHT_LINK_ROWS, 1, 0);
}
export function makeCe2RightGap(ctx: GameContext): GeneratedGame {
  return ce2Gap(ctx, "ce2-droit-trou", "compléter une phrase sur les droits et les devoirs de l'enfant", RIGHT_GAP_ROWS, 2, 1);
}
export function makeCe2RightWrite(ctx: GameContext): GeneratedGame {
  return ce2Write(ctx, "ce2-droit-ecrire", "écrire un mot sur les droits et les devoirs de l'enfant", RIGHT_WRITE_ROWS, 2, 3);
}

// ===========================================================================
// VIVRE EN PAIX
// ===========================================================================

const PEACE_FACTS = ["paix:médiation", "mot:dialogue", "paix:moquerie", "mot:tolérance", "paix:dialogue", "mot:médiation", "paix:tolérance", "paix:pardon", "paix:violence", "mot:moquerie"];

const PEACE_ROWS: readonly QuestionRow[] = inFactOrder(
  [
    qr("Deux amis se disputent pour un ballon. Que peut faire un élève ?", "Les écouter l'un après l'autre", ["Les frapper tous les deux", "Rire de leur dispute"], hints("Pense à ce qui aide à régler un problème.", "Chacun doit pouvoir parler à son tour.", "Un médiateur ne prend pas parti."), "paix:médiation"),
    qr("Un camarade se moque de la tenue d'Awa. Que fais-tu ?", "Je lui dis d'arrêter", ["Je me moque aussi", "Je ris avec les autres"], hints("Pense à ce que ressent Awa.", "Une moquerie fait de la peine.", "On peut refuser calmement."), "paix:moquerie"),
    qr("Modou est en colère contre son ami. Que peut-il faire ?", "Lui parler calmement", ["Le pousser très fort", "Ne plus jamais lui parler"], hints("Pense à ce qui calme une dispute.", "Les mots valent mieux que les coups.", "Il faut expliquer ce qu'il ressent."), "paix:dialogue"),
    qr("Un nouvel élève arrive dans la classe. Comment l'accueillir ?", "Avec le sourire et du respect", ["En l'ignorant", "En se moquant de lui"], hints("Pense à ce que ressent un nouvel élève.", "Chacun a sa place dans la classe.", "On accepte les autres tels qu'ils sont."), "paix:tolérance"),
    qr("Deux élèves ont des habitudes différentes. Que faire ?", "Accepter ces différences", ["Obliger l'autre à changer", "Se moquer de lui"], hints("Pense à ce qui rend chacun unique.", "Personne n'a tort d'être différent.", "On vit mieux ensemble ainsi."), "paix:tolérance"),
    qr("Une dispute éclate dans la cour. Qui peut aider à faire la paix ?", "Un camarade qui écoute les deux", ["Un enfant qui crie plus fort", "Un enfant qui prend un bâton"], hints("Pense à qui reste calme.", "Il ne prend pas parti.", "Il fait parler chacun."), "paix:médiation"),
    qr("Fatou a cassé le crayon de Mariama. Que doit-elle faire ?", "Dire qu'elle regrette", ["Cacher le crayon", "Accuser une autre élève"], hints("Pense à ce qui répare une faute.", "Reconnaître son erreur répare le mal.", "Un geste de gentillesse aide beaucoup."), "paix:pardon"),
    qr("Ibou a bousculé un ami sans le vouloir. Que fait-il ?", "Il s'excuse tout de suite", ["Il s'enfuit en courant", "Il dit que c'est la faute de son ami"], hints("Pense à ce qui fait plaisir à son ami.", "Il reconnaît ce qui s'est passé.", "Il dit un mot gentil."), "paix:pardon"),
    qr("Un grand veut forcer un petit à donner son goûter. Que faire ?", "Refuser la force et appeler un adulte", ["Frapper le grand en retour", "Donner le goûter et se taire"], hints("Pense à qui peut protéger le petit.", "On ne répond pas aux coups par des coups.", "Une grande personne peut intervenir."), "paix:violence"),
    qr("On entend des cris au fond de la classe. Que peut-on faire ?", "Demander à chacun de se calmer", ["Crier plus fort que tout le monde", "Jeter une chaise"], hints("Pense à ce qui ramène le calme.", "Il faut parler doucement.", "On apaise avant de discuter."), "paix:dialogue"),
    qr("Pape et Cheikh veulent le même jeu. Quelle solution est juste ?", "Jouer chacun son tour", ["Se battre pour le jeu", "Casser le jeu"], hints("Pense à une règle juste pour deux.", "Les deux enfants se partagent le jeu.", "Personne ne se fait mal."), "paix:dialogue"),
    qr("Une camarade pleure après une moquerie. Que faire ?", "Lui demander pardon", ["Rire encore plus fort", "Dire que ce n'est rien"], hints("Pense à la peine de cette camarade.", "On répare le mal fait.", "On dit un mot gentil."), "paix:moquerie"),
  ],
  PEACE_FACTS,
);

const PEACE_WORD_ROWS: readonly QuestionRow[] = inFactOrder(
  [
    qr("Que veut dire le mot dialogue ?", "Se parler pour se comprendre", ["Se battre pour gagner", "Garder le silence"], hints("Pense à ce qu'on fait avec des mots.", "Deux personnes échangent.", "On veut régler un problème."), "mot:dialogue"),
    qr("Que veut dire le mot tolérance ?", "Accepter les différences", ["Imposer ses idées", "Éviter les autres"], hints("Pense à ce qui rend chacun unique.", "On ne se moque pas.", "On vit ensemble malgré tout."), "mot:tolérance"),
    qr("Que veut dire le mot médiation ?", "Aider deux personnes à faire la paix", ["Gagner contre un adversaire", "Punir les deux personnes"], hints("Pense à une personne au milieu.", "Elle ne prend pas parti.", "Elle donne la parole à chacun des adversaires."), "mot:médiation"),
    qr("Comment appelle-t-on celui qui aide deux personnes à faire la paix ?", "Médiateur", ["Menteur", "Voleur"], hints("Pense à une personne qui reste au milieu.", "Elle écoute les deux côtés.", "Son nom vient du mot médiation."), "mot:médiation"),
    qr("Que montre un enfant qui accepte une autre façon de penser ?", "Tolérance", ["Violence", "Moquerie"], hints("Pense à ce qu'on accepte chez l'autre.", "On ne se moque pas des différences.", "C'est l'inverse de rejeter."), "mot:tolérance"),
    qr("Que refuse-t-on quand on dit non à la violence ?", "Les coups et les insultes", ["Les jeux entre amis", "Les conseils des adultes"], hints("Pense à ce qui fait du mal.", "Cela peut être des gestes ou des mots.", "On veut vivre en paix."), "paix:violence"),
    qr("Quel mot veut dire rire de quelqu'un pour lui faire de la peine ?", "Moquerie", ["Dialogue", "Médiation"], hints("Pense à une peine causée par des rires.", "Elle blesse sans toucher.", "On la refuse toujours."), "mot:moquerie"),
    qr("Quel mot veut dire se parler pour régler un problème ?", "Dialogue", ["Violence", "Moquerie"], hints("Pense à ce qu'on fait avec des mots.", "Les deux personnes s'écoutent.", "On cherche un accord."), "mot:dialogue"),
  ],
  PEACE_FACTS,
);

const ACCEPTED_ACTS = ["Parler calmement", "Écouter l'autre", "Demander pardon", "Accepter les différences"] as const;
const REFUSED_ACTS = ["Frapper", "Se moquer", "Insulter", "Se battre"] as const;
const PEACE_SORT_ROWS: readonly SortRow[] = sortRows(
  "Glisse chaque geste dans la bonne case.",
  ["On accepte", "On refuse"],
  ACCEPTED_ACTS,
  REFUSED_ACTS,
  hints("Pense à ce qui aide à vivre en paix.", "Un côté garde la paix, le second la brise.", "Les coups et les moqueries ne passent jamais."),
  16,
);

const PEACE_LINK_POOL = [
  { left: "Dialogue", right: "Se parler pour régler un problème" },
  { left: "Tolérance", right: "Accepter que l'autre soit différent" },
  { left: "Médiation", right: "Aider deux amis à faire la paix" },
  { left: "Moquerie", right: "Rire de quelqu'un pour lui faire de la peine" },
  { left: "Violence", right: "Faire du mal avec ses mains ou ses mots" },
] as const;
const PEACE_LINK_ROWS: readonly LinkRow[] = combinations(PEACE_LINK_POOL, 3)
  .slice(0, 8)
  .map((pairs) => ({
    prompt: "Relie chaque mot à son sens.",
    pairs,
    hints: hints("Pense au sens de chaque mot.", "Lis les phrases une par une.", "Une seule phrase correspond à chaque mot."),
  }));

const PEACE_ORDER_ROWS: readonly OrderRow[] = [
  ordr("Mets ces étapes dans l'ordre du temps pour régler une dispute.", ["On se calme", "On s'écoute", "On cherche un accord"], hints("Il faut d'abord se détendre.", "Ensuite on prend la parole chacun son tour.", "La dernière étape satisfait tout le monde."), "paix:dialogue"),
  ordr("Mets ces étapes dans l'ordre du temps pour faire la paix.", ["On dit qu'on regrette", "On demande pardon", "On se serre la main"], hints("Il faut d'abord reconnaître sa faute.", "Ensuite on prononce le mot qui répare.", "Le geste final montre la paix."), "paix:pardon"),
  ordr("Mets ces événements dans l'ordre du temps.", ["Deux amis se disputent", "Un camarade vient les écouter", "Les deux amis font la paix"], hints("Tout commence par un désaccord.", "Quelqu'un intervient ensuite.", "Tout se termine bien."), "paix:médiation"),
  ordr("Mets ces événements dans l'ordre du temps.", ["Un enfant se moque d'un autre", "Un camarade lui dit d'arrêter", "Il présente ses excuses"], hints("Tout commence par une faute.", "Quelqu'un réagit calmement.", "La réparation arrive à la fin."), "paix:moquerie"),
];

const PEACE_GAP_ROWS: readonly GapRow[] = inFactOrder(
  [
    gr("Pour régler un problème, on utilise le ___.", "dialogue", ["bâton", "silence"], hints("Pense à ce qu'on fait avec des mots.", "On s'écoute à tour de rôle.", "On cherche un accord."), "paix:dialogue"),
    gr("La ___ nous apprend à accepter les différences.", "tolérance", ["violence", "moquerie"], hints("Pense à ce qu'on accepte chez l'autre.", "On ne juge pas les différences.", "C'est l'inverse de rejeter."), "mot:tolérance"),
    gr("Un médiateur aide deux personnes à faire la ___.", "paix", ["guerre", "chasse"], hints("Pense à la fin de la dispute.", "Les deux personnes se réconcilient.", "Le mot est court."), "mot:médiation"),
    gr("On dit non à la ___ et aux moqueries.", "violence", ["paix", "amitié"], hints("Pense à ce qui fait du mal.", "Cela peut être des coups.", "On la refuse toujours."), "paix:violence"),
    gr("Se moquer des autres leur fait de la ___.", "peine", ["joie", "fête"], hints("Pense à ce que ressent celui dont on rit.", "Cela fait mal sans toucher.", "Le mot est court."), "paix:moquerie"),
    gr("Pour faire la paix, on demande ___.", "pardon", ["vengeance", "punition"], hints("Pense à un mot qui répare.", "On dit qu'on regrette.", "Le mot a six lettres."), "paix:pardon"),
    gr("Quand on se dispute, on doit d'abord se ___.", "calmer", ["battre", "cacher"], hints("Pense à ce qui vient avant de discuter.", "On respire et on se détend.", "Le verbe commence par la lettre c."), "paix:dialogue"),
    gr("Le dialogue, c'est se ___ pour se comprendre.", "parler", ["battre", "cacher"], hints("Pense à ce qu'on fait avec des mots.", "On échange avec l'autre.", "Le verbe commence par la lettre p."), "mot:dialogue"),
    gr("Un camarade qui écoute les deux amis est un ___.", "médiateur", ["menteur", "voleur"], hints("Pense à celui qui reste au milieu.", "Il ne prend pas parti.", "Son nom vient du mot médiation."), "mot:médiation"),
    gr("Les enfants différents doivent être ___.", "respectés", ["moqués", "battus"], hints("Pense à la façon de traiter les autres.", "Chacun a droit au même égard.", "C'est un participe passé."), "paix:tolérance"),
    gr("Après une dispute, on cherche un ___ avec l'autre.", "accord", ["combat", "caillou"], hints("Pense à ce qui satisfait les deux personnes.", "Chacun y trouve son compte.", "Le mot est court."), "paix:dialogue"),
    gr("Insulter un camarade est un manque de ___.", "respect", ["force", "temps"], hints("Pense à la politesse.", "On blesse avec des mots.", "Le mot commence par la lettre r."), "paix:violence"),
  ],
  PEACE_FACTS,
);

const PEACE_WRITE_ROWS: readonly WriteRow[] = inFactOrder(
  [
    wr("Quel mot veut dire se parler pour se comprendre ? Écris le mot.", ["dialogue", "le dialogue"], hints("Pense à ce qu'on fait avec des mots.", "Deux personnes échangent.", "Le mot commence par la lettre d."), "mot:dialogue"),
    wr("Quel mot veut dire accepter les différences ? Écris le mot.", ["tolérance", "tolerance", "la tolérance"], hints("Pense à ce qu'on accepte chez l'autre.", "On ne se moque pas.", "Le mot commence par la lettre t."), "mot:tolérance"),
    wr("Comment appelle-t-on celui qui aide deux personnes à faire la paix ? Écris le mot.", ["médiateur", "mediateur", "un médiateur"], hints("Pense à une personne au milieu.", "Elle écoute les deux côtés.", "Le mot commence par la lettre m."), "mot:médiation"),
    wr("Que doit-on refuser pour vivre en paix ? Écris le mot.", ["violence", "la violence"], hints("Pense à ce qui fait du mal.", "Cela peut être des coups.", "Le mot commence par la lettre v."), "paix:violence"),
    wr("Que demande-t-on quand on a fait de la peine à quelqu'un ? Écris le mot.", ["pardon", "des excuses", "excuses"], hints("Pense à un mot qui répare.", "On dit qu'on regrette.", "Le mot a six lettres."), "paix:pardon"),
    wr("Rire de quelqu'un pour faire de la peine est une ___. Écris le mot.", ["moquerie", "une moquerie"], hints("Pense à des rires qui blessent.", "On la refuse toujours.", "Le mot commence par la lettre m."), "mot:moquerie"),
    wr("Quand on a un problème avec un ami, il faut en ___. Écris le verbe.", ["parler", "discuter"], hints("Pense à ce qu'on fait avec des mots.", "On n'utilise pas les poings.", "Le verbe commence par la lettre p."), "paix:dialogue"),
    wr("Le médiateur se tait et prête l'oreille aux deux amis. Que fait-il ? Écris le verbe.", ["écouter", "ecouter", "entendre"], hints("Pense à ce qu'il fait avant de parler.", "Il est attentif.", "Le verbe commence par la lettre é."), "paix:médiation"),
  ],
  PEACE_FACTS,
);

export function makeCe2PeaceChoice(ctx: GameContext): GeneratedGame {
  return ce2Question(ctx, "ce2-paix-situation", "choisir le comportement qui fait la paix dans une dispute ou une moquerie", PEACE_ROWS, 2, (row) => row.prompt, 1);
}
export function makeCe2PeaceWord(ctx: GameContext): GeneratedGame {
  return ce2Question(ctx, "ce2-paix-mot", "le sens des mots dialogue, tolérance, médiation, moquerie et violence", PEACE_WORD_ROWS, 1, (row) => row.prompt, 3);
}
export function makeCe2PeaceSort(ctx: GameContext): GeneratedGame {
  return ce2Sort(ctx, "ce2-paix-glisser", "ranger les gestes qu'on accepte et ceux qu'on refuse pour vivre en paix", PEACE_SORT_ROWS, 1, 0);
}
export function makeCe2PeaceLink(ctx: GameContext): GeneratedGame {
  return ce2Link(ctx, "ce2-paix-relier", "relier un mot de la paix à son sens", PEACE_LINK_ROWS, 1, 0);
}
export function makeCe2PeaceOrder(ctx: GameContext): GeneratedGame {
  return ce2Order(ctx, "ce2-paix-ordre", "ranger les étapes pour régler une dispute ou faire la paix", PEACE_ORDER_ROWS, 1, 0);
}
export function makeCe2PeaceGap(ctx: GameContext): GeneratedGame {
  return ce2Gap(ctx, "ce2-paix-trou", "compléter une phrase sur la paix, le dialogue et la tolérance", PEACE_GAP_ROWS, 2, 0);
}
export function makeCe2PeaceWrite(ctx: GameContext): GeneratedGame {
  return ce2Write(ctx, "ce2-paix-ecrire", "écrire un mot sur la paix, le dialogue et la tolérance", PEACE_WRITE_ROWS, 2, 2);
}

// ===========================================================================
// LES BONNES VALEURS
// ===========================================================================

const VALUE_FACTS = ["val:honnêteté", "val:mot:solidarité", "val:courage", "val:parole", "val:teranga", "val:mot:honnêteté", "val:solidarité", "val:mot:courage", "val:mot:parole", "val:mot:teranga"];

const VALUE_ROWS: readonly QuestionRow[] = inFactOrder(
  [
    qr("Awa trouve un stylo dans la cour et le rend. Quelle valeur montre-t-elle ?", "Honnêteté", ["Courage", "Teranga"], hints("Pense à ce qui ne lui appartient pas.", "Elle ne garde pas ce stylo.", "Elle fait ce qui est juste."), "val:honnêteté"),
    qr("Ali ne copie pas sur son voisin pendant la dictée. Quelle valeur montre-t-il ?", "Honnêteté", ["Solidarité", "Teranga"], hints("Pense à ce qu'il fait de son propre travail.", "Il ne triche pas.", "On peut lui faire confiance."), "val:honnêteté"),
    qr("Mariama dit la vérité à sa mère sur la note du cahier. Quelle valeur montre-t-elle ?", "Honnêteté", ["Solidarité", "Teranga"], hints("Pense à ce qu'elle choisit de dire.", "Elle ne cache rien.", "Elle ne ment pas."), "val:honnêteté"),
    qr("Les élèves apportent du riz à une famille dont la case a brûlé. Quelle valeur montrent-ils ?", "Solidarité", ["Honnêteté", "Courage"], hints("Pense à ceux qui ont perdu leurs affaires.", "Ils aident ensemble.", "Ils partagent avec ceux qui n'ont plus rien."), "val:solidarité"),
    qr("Un voisin est malade et Fatou porte son seau d'eau. Quelle valeur montre-t-elle ?", "Solidarité", ["Parole donnée", "Teranga"], hints("Pense à ce dont le voisin a besoin.", "Elle rend service à un autre.", "Elle l'aide dans son malheur."), "val:solidarité"),
    qr("Cheikh partage son goûter avec un camarade qui n'a rien. Quelle valeur montre-t-il ?", "Solidarité", ["Courage", "Honnêteté"], hints("Pense à ce que le camarade n'a pas.", "Cheikh donne une part de son goûter.", "Il pense aux autres."), "val:solidarité"),
    qr("Awa a peur du noir mais elle va chercher de l'eau pour sa grand-mère. Quelle valeur montre-t-elle ?", "Courage", ["Honnêteté", "Teranga"], hints("Pense à ce qu'elle ressent en y allant.", "Elle agit malgré sa peur.", "Elle fait ce qu'il faut quand même."), "val:courage"),
    qr("Fatou ose parler devant toute la classe malgré sa peur. Quelle valeur montre-t-elle ?", "Courage", ["Honnêteté", "Teranga"], hints("Pense à ce qu'elle ressent avant de parler.", "Elle n'écoute pas sa peur.", "Elle ose quand même."), "val:courage"),
    qr("Moussa avait promis de rendre le livre lundi et il le rend lundi. Quelle valeur montre-t-il ?", "Parole donnée", ["Courage", "Teranga"], hints("Pense à ce qu'il avait annoncé.", "Il fait ce qu'il a dit.", "On peut compter sur lui."), "val:parole"),
    qr("Aminata a dit qu'elle viendrait à midi et elle arrive à midi. Quelle valeur montre-t-elle ?", "Parole donnée", ["Solidarité", "Courage"], hints("Pense à l'heure qu'elle avait annoncée.", "Elle a fait comme elle a dit.", "Elle ne trompe personne."), "val:parole"),
    qr("Une famille accueille un voyageur et lui offre à manger et un lit. Quelle valeur montre-t-elle ?", "Teranga", ["Courage", "Honnêteté"], hints("Pense à la façon de recevoir un étranger.", "On lui offre ce qu'on a.", "C'est une tradition d'accueil du Sénégal."), "val:teranga"),
    qr("Awa salue chaleureusement une invitée et lui offre de l'eau fraîche. Quelle valeur montre-t-elle ?", "Teranga", ["Parole donnée", "Courage"], hints("Pense à la façon de recevoir quelqu'un.", "On soigne l'invitée.", "C'est un art d'accueillir."), "val:teranga"),
  ],
  VALUE_FACTS,
);

const VALUE_WORD_ROWS: readonly QuestionRow[] = inFactOrder(
  [
    qr("Que veut dire être honnête ?", "Dire la vérité", ["Faire des cadeaux", "Obéir à tout le monde"], hints("Pense à ce qu'on dit aux autres.", "On ne ment pas.", "On ne prend pas ce qui n'est pas à nous."), "val:mot:honnêteté"),
    qr("Que veut dire être solidaire ?", "Aider ceux qui ont un problème", ["Garder tout pour soi", "Faire seul son travail"], hints("Pense aux gens qui manquent de tout.", "On pense aux autres.", "On partage et on aide."), "val:mot:solidarité"),
    qr("Que veut dire avoir du courage ?", "Faire ce qui est juste malgré la peur", ["Ne jamais avoir peur", "Fuir tous les problèmes"], hints("Pense à ce qu'on ressent avant d'agir.", "La crainte existe, mais on agit.", "Ce n'est pas être sans crainte."), "val:mot:courage"),
    qr("Que veut dire tenir sa parole ?", "Faire ce qu'on a promis", ["Dire un secret", "Changer d'avis"], hints("Pense à une promesse.", "On fait ce qu'on a annoncé.", "On ne déçoit personne."), "val:mot:parole"),
    qr("Que veut dire le mot teranga ?", "Bien accueillir ses invités", ["Partager un secret", "Faire un long voyage"], hints("Pense à la façon de recevoir quelqu'un chez soi.", "Au Sénégal, c'est une grande fierté.", "On offre de l'eau et un repas."), "val:mot:teranga"),
    qr("Que montre-t-on quand on rend un objet trouvé ?", "Honnêteté", ["Courage", "Teranga"], hints("Pense à ce qui n'est pas à toi.", "On ne le garde pas.", "On fait ce qui est juste."), "val:honnêteté"),
    qr("Quelle valeur consiste à aider un voisin en difficulté ?", "Solidarité", ["Honnêteté", "Parole donnée"], hints("Pense à ceux qui ont un problème.", "On donne un coup de main.", "On s'entraide."), "val:solidarité"),
    qr("Quelle valeur consiste à bien recevoir un invité ?", "Teranga", ["Courage", "Solidarité"], hints("Pense à la façon de recevoir quelqu'un.", "On lui offre de l'eau et un repas.", "C'est un mot wolof."), "val:teranga"),
  ],
  VALUE_FACTS,
);

const VALUE_ACTIONS: Record<string, readonly string[]> = {
  Honnêteté: ["Rendre un objet trouvé", "Dire la vérité", "Ne pas copier sur son voisin"],
  Solidarité: ["Partager son repas", "Aider un voisin malade", "Donner des habits à une famille"],
  Courage: ["Parler devant la classe malgré sa peur", "Aller seul chercher de l'eau la nuit", "Dire non à un copain qui veut mal faire"],
  "Parole donnée": ["Rendre le livre comme promis", "Arriver à l'heure promise", "Garder un secret promis"],
  Teranga: ["Offrir à boire à un invité", "Offrir une place à un voyageur", "Saluer chaleureusement un invité"],
};
const VALUE_NAMES = Object.keys(VALUE_ACTIONS);
const VALUE_PAIRS = combinations(VALUE_NAMES, 2);
const VALUE_SORT_ROWS: readonly SortRow[] = [0, 1].flatMap((variant) =>
  VALUE_PAIRS.map(([a, b], i): SortRow => ({
    prompt: "Glisse chaque scène sous la valeur qu'elle montre.",
    zones: [a, b],
    items: [
      ...[VALUE_ACTIONS[a][(i + variant) % 3], VALUE_ACTIONS[a][(i + variant + 1) % 3]].map((text) => ({ text, zone: a })),
      ...[VALUE_ACTIONS[b][(i + 2 * variant) % 3], VALUE_ACTIONS[b][(i + 2 * variant + 1) % 3]].map((text) => ({ text, zone: b })),
    ],
    hints: hints("Imagine ce que fait l'enfant dans chaque scène.", "Demande-toi quelle belle qualité il montre.", "Chaque scène va dans une seule case."),
  })),
);

const VALUE_LINK_POOL = [
  { left: "Honnêteté", right: "Rendre ce qu'on a trouvé" },
  { left: "Solidarité", right: "Aider quelqu'un qui a un problème" },
  { left: "Courage", right: "Agir malgré la peur" },
  { left: "Parole donnée", right: "Faire ce qu'on a promis" },
  { left: "Teranga", right: "Bien accueillir un invité" },
] as const;
const VALUE_LINK_ROWS: readonly LinkRow[] = combinations(VALUE_LINK_POOL, 3)
  .slice(0, 8)
  .map((pairs) => ({
    prompt: "Relie chaque valeur à son exemple.",
    pairs,
    hints: hints("Pense à ce que chaque belle qualité pousse à accomplir.", "Lis les exemples un par un.", "Un seul exemple va avec chaque qualité."),
  }));

const VALUE_ORDER_ROWS: readonly OrderRow[] = [
  ordr("Mets ces gestes dans l'ordre du temps pour accueillir un invité.", ["On salue l'invité", "On lui offre à boire", "On partage le repas"], hints("Tout commence par un mot de bienvenue.", "Ensuite on pense à sa soif.", "Le dernier geste se fait à table."), "val:teranga"),
  ordr("Mets ces étapes dans l'ordre du temps.", ["On fait une promesse", "On pense à la tenir", "On fait ce qu'on a promis"], hints("Tout commence par un engagement.", "Il faut ensuite s'en souvenir.", "La dernière étape est l'action."), "val:parole"),
  ordr("Mets ces gestes dans l'ordre du temps pour rendre un objet trouvé.", ["On trouve un objet", "On cherche à qui il est", "On le rend à son propriétaire"], hints("Tout commence par une découverte.", "Il faut savoir qui l'a perdu.", "La remise vient à la fin."), "val:honnêteté"),
  ordr("Mets ces étapes dans l'ordre du temps pour aider un voisin.", ["On apprend que le voisin est malade", "On va chez lui", "On l'aide"], hints("Il faut d'abord savoir ce qui se passe.", "Ensuite on se déplace.", "Le coup de main vient à la fin."), "val:solidarité"),
];

const VALUE_GAP_ROWS: readonly GapRow[] = inFactOrder(
  [
    gr("Celui qui dit la vérité est ___.", "honnête", ["menteur", "méchant"], hints("Pense à ce qu'on dit aux autres.", "On ne ment pas.", "Le mot est un adjectif."), "val:mot:honnêteté"),
    gr("Celui qui partage avec ceux qui manquent de tout est ___.", "solidaire", ["égoïste", "pressé"], hints("Pense aux gens qui manquent de tout.", "On pense aux autres.", "Le mot commence par la lettre s."), "val:mot:solidarité"),
    gr("Avoir du ___, c'est agir malgré la peur.", "courage", ["sommeil", "talent"], hints("Pense à ce qu'on ressent avant d'agir.", "La crainte existe, mais on agit.", "Le mot commence par la lettre c."), "val:mot:courage"),
    gr("Une personne qui tient sa ___ fait ce qu'elle a promis.", "parole", ["chance", "place"], hints("Pense à une promesse.", "On fait ce qu'on a annoncé.", "Le mot commence par la lettre p."), "val:mot:parole"),
    gr("La teranga, c'est bien ___ ses invités.", "accueillir", ["oublier", "chasser"], hints("Pense à la façon de recevoir quelqu'un.", "On offre de l'eau et un repas.", "Le verbe commence par la lettre a."), "val:mot:teranga"),
    gr("Un élève qui ne triche pas montre son ___.", "honnêteté", ["appétit", "sommeil"], hints("Pense à la qualité de celui qui ne triche pas.", "On peut lui faire confiance.", "Le mot commence par la lettre h."), "val:honnêteté"),
    gr("Aider un voisin est un geste de ___.", "solidarité", ["colère", "paresse"], hints("Pense à ceux qui s'entraident.", "On partage les problèmes.", "Le mot commence par la lettre s."), "val:solidarité"),
    gr("Dire non à un copain qui veut mal faire demande du ___.", "courage", ["bruit", "temps"], hints("Pense à ce qu'il faut pour refuser.", "Il faut oser.", "Le mot commence par la lettre c."), "val:courage"),
    gr("Quand on promet, on doit ___ sa promesse.", "tenir", ["perdre", "vendre"], hints("Pense à ce qu'on fait d'une promesse.", "On ne l'oublie pas.", "Le verbe commence par la lettre t."), "val:parole"),
    gr("Un invité reçoit un bon ___ chez nous.", "accueil", ["silence", "bâton"], hints("Pense à la façon de recevoir quelqu'un.", "On lui sourit et on l'installe.", "Le mot commence par la lettre a."), "val:teranga"),
    gr("Chez nous, l'hospitalité se nomme la ___.", "teranga", ["kora", "tama"], hints("Pense à un mot wolof bien connu.", "Il veut dire bien recevoir.", "Le mot commence par la lettre t."), "val:mot:teranga"),
    gr("À l'école comme à la maison, on dit la ___.", "vérité", ["fatigue", "chanson"], hints("Pense à ce qu'on doit dire.", "On ne ment pas.", "Le mot commence par la lettre v."), "val:honnêteté"),
  ],
  VALUE_FACTS,
);

const VALUE_WRITE_ROWS: readonly WriteRow[] = inFactOrder(
  [
    wr("Quelle valeur montre celui qui dit toujours la vérité ? Écris le mot.", ["honnêteté", "honnetete", "l'honnêteté"], hints("Pense à ce qu'on dit aux autres.", "On ne ment pas.", "Le mot commence par la lettre h."), "val:honnêteté"),
    wr("Quelle valeur montre celui qui aide ses voisins ? Écris le mot.", ["solidarité", "solidarite", "la solidarité"], hints("Pense à ceux qui s'entraident.", "On partage les problèmes.", "Le mot commence par la lettre s."), "val:solidarité"),
    wr("Quelle valeur montre celui qui agit malgré sa peur ? Écris le mot.", ["courage", "le courage"], hints("Pense à ce qu'on ressent avant d'agir.", "La crainte existe, mais on agit.", "Le mot commence par la lettre c."), "val:courage"),
    wr("Comment appelle-t-on l'accueil des invités au Sénégal ? Écris le mot.", ["teranga", "la teranga"], hints("Pense à un mot wolof bien connu.", "Il veut dire bien recevoir.", "Le mot commence par la lettre t."), "val:teranga"),
    wr("Que doit-on faire de sa promesse ? Écris le verbe.", ["tenir", "garder", "respecter"], hints("Pense à ce qu'on fait d'une promesse.", "On ne l'oublie pas.", "Le verbe commence par la lettre t."), "val:parole"),
    wr("Que fait-on d'un objet trouvé ? Écris le verbe.", ["rendre", "rapporter"], hints("Pense à ce qui n'est pas à nous.", "On le redonne à son propriétaire.", "Le verbe commence par la lettre r."), "val:honnêteté"),
    wr("Quand on tient sa promesse, on tient sa ___. Écris le mot.", ["parole", "sa parole"], hints("Pense à ce qu'on donne quand on promet.", "On la donne et on la tient.", "Le mot commence par la lettre p."), "val:mot:parole"),
    wr("Celui qui partage avec les autres est ___. Écris le mot.", ["solidaire", "généreux"], hints("Pense à ceux qui donnent un peu de leur bien.", "On pense aux autres.", "Le mot commence par la lettre s."), "val:mot:solidarité"),
  ],
  VALUE_FACTS,
);

export function makeCe2ValueChoice(ctx: GameContext): GeneratedGame {
  return ce2Question(ctx, "ce2-valeur-situation", "reconnaître la valeur qu'une scène montre", VALUE_ROWS, 2, (row) => row.prompt, 1);
}
export function makeCe2ValueWord(ctx: GameContext): GeneratedGame {
  return ce2Question(ctx, "ce2-valeur-definition", "le sens des valeurs honnêteté, solidarité, courage, parole donnée et teranga", VALUE_WORD_ROWS, 1, (row) => row.prompt, 0);
}
export function makeCe2ValueSort(ctx: GameContext): GeneratedGame {
  return ce2Sort(ctx, "ce2-valeur-glisser", "ranger des scènes sous la valeur qu'elles montrent", VALUE_SORT_ROWS, 1, 0);
}
export function makeCe2ValueLink(ctx: GameContext): GeneratedGame {
  return ce2Link(ctx, "ce2-valeur-relier", "relier une valeur à son exemple", VALUE_LINK_ROWS, 1, 0);
}
export function makeCe2ValueOrder(ctx: GameContext): GeneratedGame {
  return ce2Order(ctx, "ce2-valeur-ordre", "ranger les gestes d'une valeur dans l'ordre du temps", VALUE_ORDER_ROWS, 1, 2);
}
export function makeCe2ValueGap(ctx: GameContext): GeneratedGame {
  return ce2Gap(ctx, "ce2-valeur-trou", "compléter une phrase sur les bonnes valeurs", VALUE_GAP_ROWS, 2, 1);
}
export function makeCe2ValueWrite(ctx: GameContext): GeneratedGame {
  return ce2Write(ctx, "ce2-valeur-ecrire", "écrire le nom d'une valeur ou un verbe qui la montre", VALUE_WRITE_ROWS, 2, 3);
}

// ===========================================================================
// LA VIE EN COMMUNAUTÉ
// ===========================================================================

const COMMUNITY_FACTS = ["comm:puits", "comm:voisin:malade", "comm:marché", "comm:terrain", "comm:mot", "comm:règle", "comm:voisin:aide", "comm:nouveau", "comm:bruit", "comm:voisin:besoin"];

const COMMON_ROWS: readonly QuestionRow[] = inFactOrder(
  [
    qr("Lequel de ces choix est un bien commun du quartier ?", "Puits", ["Ma chambre", "Mon cahier"], hints("Pense à ce qui sert à tous les habitants.", "Ce n'est pas à une seule personne.", "On y puise de l'eau."), "comm:puits"),
    qr("Lequel de ces choix est un bien commun du quartier ?", "Marché", ["Ma natte", "Mon ballon"], hints("Pense à ce qui sert à tous les habitants.", "Ce n'est pas à une seule personne.", "On y achète et on y vend."), "comm:marché"),
    qr("Lequel de ces choix est un bien commun du quartier ?", "Terrain de sport", ["Ma chambre", "Mon cahier"], hints("Pense à ce qui sert à tous les habitants.", "Ce n'est pas à une seule personne.", "Les enfants y jouent ensemble."), "comm:terrain"),
    qr("Qu'est-ce que tout le quartier utilise ensemble ?", "Puits", ["Ma natte", "Mon ballon"], hints("Pense à ce que partagent les habitants.", "Personne ne l'a pour lui seul.", "Il donne de l'eau."), "comm:puits"),
    qr("Qu'est-ce que tout le quartier utilise ensemble ?", "Marché", ["Ma chambre", "Mon cahier"], hints("Pense à ce que partagent les habitants.", "Personne ne l'a pour lui seul.", "On y fait ses courses."), "comm:marché"),
    qr("Qu'est-ce que tout le quartier utilise ensemble ?", "Terrain de sport", ["Ma natte", "Mon ballon"], hints("Pense à ce que partagent les habitants.", "Personne ne l'a pour lui seul.", "On y fait de l'exercice."), "comm:terrain"),
    qr("Lequel de ces choix appartient à tous les habitants du quartier ?", "Puits", ["Mon ballon", "Ma chambre"], hints("Pense à ce qui n'est à personne en particulier.", "Tout le monde y a droit.", "On y puise de l'eau."), "comm:puits"),
    qr("Lequel de ces choix appartient à tous les habitants du quartier ?", "Marché", ["Mon cahier", "Ma natte"], hints("Pense à ce qui n'est à personne en particulier.", "Tout le monde y a droit.", "On y vend des légumes."), "comm:marché"),
  ],
  COMMUNITY_FACTS,
);

const RULE_ROWS: readonly QuestionRow[] = inFactOrder(
  [
    qr("Le puits du quartier est sale. Que doit-on faire ?", "Le nettoyer ensemble", ["Le laisser comme ça", "Y jeter des déchets"], hints("Pense à ce qui sert à tous.", "Chacun peut donner un coup de main.", "On veut de l'eau propre."), "comm:puits"),
    qr("Un enfant veut jeter ses déchets au marché. Où doit-il les mettre ?", "Dans la poubelle", ["Par terre", "Devant la boutique"], hints("Pense à ce qui garde le marché propre.", "Il existe un endroit prévu.", "C'est un grand seau."), "comm:marché"),
    qr("Plusieurs enfants veulent le terrain de sport. Quelle règle suivre ?", "Jouer chacun son tour", ["Prendre le terrain par la force", "Empêcher les autres de jouer"], hints("Pense à une règle juste pour tous.", "Tous les joueurs ont leur place sur le terrain.", "On patiente quelques instants."), "comm:terrain"),
    qr("La nuit, des voisins dorment. Que doit-on faire ?", "Parler doucement", ["Crier et chanter fort", "Jouer au tam-tam"], hints("Pense à ceux qui se reposent.", "On évite de les réveiller.", "On baisse la voix."), "comm:bruit"),
    qr("On puise de l'eau au puits. Comment faire avec les autres ?", "Attendre son tour", ["Passer devant tout le monde", "Prendre tous les seaux"], hints("Pense à ceux qui attendent aussi.", "L'eau est pour tous.", "Il faut de la patience."), "comm:puits"),
    qr("Un ballon tombe chez un voisin. Que fait-on ?", "On le demande poliment", ["On entre sans rien dire", "On casse sa clôture"], hints("Pense à ce qui est chez un autre.", "On pose la question avant d'entrer.", "On est poli."), "comm:règle"),
    qr("Le terrain de sport est en désordre après le match. Que faire ?", "Le ranger tous ensemble", ["Partir sans rien ranger", "Casser les buts"], hints("Pense à ceux qui l'utiliseront après.", "Tout le monde a joué.", "On laisse un terrain propre."), "comm:terrain"),
    qr("Un nouvel habitant arrive dans le quartier. Que fait-on ?", "On lui explique les règles", ["On se moque de lui", "On l'ignore"], hints("Pense à ce qu'il ne connaît pas encore.", "Il doit vivre comme les autres.", "On le renseigne gentiment."), "comm:nouveau"),
    qr("Le puits est fermé pour être réparé. Que faire ?", "Attendre qu'il soit réparé", ["Forcer la porte", "Casser le puits"], hints("Pense à ceux qui réparent.", "Il sera rouvert plus tard.", "On est patient."), "comm:puits"),
    qr("Une règle du quartier est affichée. Comment la suit-on ?", "On la respecte comme les autres", ["On fait comme si elle n'existait pas", "On la déchire en petits morceaux"], hints("Pense à ce que fait chacun.", "Elle est la même pour tous.", "On donne l'exemple."), "comm:règle"),
    qr("Des enfants salissent le marché en jouant. Que leur dit-on ?", "De nettoyer ce qu'ils ont sali", ["De continuer à jouer", "De partir en courant"], hints("Pense à ce que chacun doit faire.", "On répare ce qu'on a abîmé.", "On rend le lieu propre."), "comm:marché"),
    qr("Des voisins dorment. Quelle règle suivre au terrain de sport ?", "Arrêter de jouer tard le soir", ["Jouer toute la nuit", "Mettre la musique très fort"], hints("Pense à ceux qui se reposent.", "On joue à des heures raisonnables.", "On respecte le sommeil des autres."), "comm:bruit"),
  ],
  COMMUNITY_FACTS,
);

const NEIGHBOUR_ROWS: readonly QuestionRow[] = inFactOrder(
  [
    qr("Un voisin est malade. Que peut-on faire ?", "Lui apporter à manger", ["Fermer sa porte", "Rire de lui"], hints("Pense à ce dont un malade a besoin.", "On pense à lui.", "On rend service."), "comm:voisin:malade"),
    qr("La maison d'un voisin a brûlé. Que peut-on faire ?", "Lui donner des habits et un repas", ["Se moquer de sa maison", "Fermer sa porte"], hints("Pense à ce qu'il a perdu.", "Il a besoin d'aide tout de suite.", "On partage ce qu'on a."), "comm:voisin:besoin"),
    qr("Une voisine âgée ne peut pas porter son seau. Que faire ?", "Porter son seau pour elle", ["Passer sans rien dire", "Lui dire de se débrouiller"], hints("Pense à sa force.", "Cette dame a besoin d'un coup de main.", "On l'aide gentiment."), "comm:voisin:aide"),
    qr("Un voisin n'a plus de riz. Que peut-on faire ?", "Lui en donner un peu", ["Le lui reprocher", "Rire de lui"], hints("Pense à ce qu'il lui manque.", "On partage avec lui.", "Il aura de quoi manger."), "comm:voisin:besoin"),
    qr("Des voisins construisent un toit. Comment aider ?", "Donner un coup de main", ["Regarder sans bouger", "Cacher les outils"], hints("Pense à ce qui avance le travail.", "Plusieurs mains travaillent mieux.", "On s'entraide."), "comm:voisin:aide"),
    qr("Un enfant du quartier est perdu. Que faire ?", "L'accompagner chez ses parents", ["Le laisser seul", "Se moquer de lui"], hints("Pense à ce qu'il ressent.", "Il a besoin de retrouver les siens.", "On l'emmène en sécurité."), "comm:voisin:aide"),
    qr("Une voisine a un bébé malade. Que peut-on faire ?", "L'aider à aller au dispensaire", ["Fermer les volets", "Faire du bruit près d'elle"], hints("Pense à ce dont le bébé a besoin.", "Le médecin peut le soigner.", "On accompagne la maman."), "comm:voisin:malade"),
    qr("Un voisin déménage. Comment s'entraider ?", "Porter ses affaires avec lui", ["Rester chez soi", "Cacher ses affaires"], hints("Pense aux charges lourdes.", "Plusieurs personnes vont plus vite.", "On lui donne un coup de main pour transporter."), "comm:voisin:aide"),
  ],
  COMMUNITY_FACTS,
);

const COMMON_GOODS = ["Puits", "Marché", "Terrain de sport"] as const;
const PERSONAL_GOODS = ["Mon cahier", "Mon ballon", "Ma chambre", "Ma natte"] as const;
const COMMUNITY_SORT_ROWS: readonly SortRow[] = sortRows(
  "Glisse chaque étiquette dans la bonne case.",
  ["Bien commun", "Bien personnel"],
  COMMON_GOODS,
  PERSONAL_GOODS,
  hints("Pense à ce qui sert à tout le quartier.", "Une chose est partagée par tous, l'autre n'est qu'à une personne.", "Ce qui est à tous se respecte avec soin."),
  16,
);

const COMMUNITY_LINK_POOL = [
  // Chaque geste ne va qu'avec UN lieu ou UNE personne : « Ne pas jeter de déchets » ou « Respecter les règles de tous » valaient
  // pour le puits, le marché et le quartier à la fois, et un échange défendable était refusé.
  { left: "Puits", right: "Garder l'eau propre" },
  { left: "Marché", right: "Payer ce qu'on achète" },
  { left: "Terrain de sport", right: "Jouer chacun son tour" },
  { left: "Voisin malade", right: "Lui apporter à manger" },
  { left: "Nouvel habitant", right: "Lui expliquer les règles" },
] as const;
const COMMUNITY_LINK_ROWS: readonly LinkRow[] = combinations(COMMUNITY_LINK_POOL, 3)
  .slice(0, 8)
  .map((pairs) => ({
    prompt: "Relie chaque lieu ou personne à ce qu'on doit faire.",
    pairs,
    hints: hints("Pense à ce qu'on doit à chaque endroit.", "Lis les phrases une par une.", "Une seule phrase correspond à chaque mot."),
  }));

const COMMUNITY_ORDER_ROWS: readonly OrderRow[] = [
  ordr("Mets ces étapes dans l'ordre du temps pour aider un voisin.", ["Apprendre que le voisin est malade", "Aller chez lui demander ce qui lui manque", "L'aider", "Lui dire au revoir"], hints("Il faut d'abord savoir qu'il a un problème.", "On se déplace ensuite.", "On termine par une politesse."), "comm:voisin:aide"),
  ordr("Mets ces gestes dans l'ordre du temps pour nettoyer le puits.", ["On prend des seaux et des balais", "On enlève les déchets", "On rince le bord du puits"], hints("Il faut d'abord préparer le matériel.", "On commence par le plus gros.", "Le rinçage vient à la fin."), "comm:puits"),
  ordr("Mets ces gestes dans l'ordre du temps pour bien utiliser le terrain de sport.", ["On attend son tour", "On joue", "On range le ballon"], hints("Il faut d'abord patienter.", "Le jeu vient ensuite.", "On ne laisse rien en désordre."), "comm:terrain"),
  ordr("Mets ces événements dans l'ordre du temps.", ["Un nouvel habitant arrive", "On lui explique les règles", "Il les respecte avec les autres"], hints("Tout commence par une arrivée.", "On le renseigne ensuite.", "Il vit comme tout le monde."), "comm:nouveau"),
];

const COMMUNITY_GAP_ROWS: readonly GapRow[] = inFactOrder(
  [
    gr("Le puits est un bien ___ du quartier.", "commun", ["cassé", "privé"], hints("Pense à ce qui sert à tous.", "Il n'est à personne seul.", "Le mot commence par la lettre c."), "comm:mot"),
    gr("Au marché, on met ses déchets dans la ___.", "poubelle", ["rivière", "natte"], hints("Pense à un grand seau.", "On le vide régulièrement.", "Cela garde le lieu propre."), "comm:marché"),
    gr("Sur le terrain de sport, on joue chacun son ___.", "tour", ["prix", "champ"], hints("Pense à ce qui est juste pour tous.", "On attend d'abord.", "Le mot a quatre lettres."), "comm:terrain"),
    gr("Entre voisins, on doit s'entraider quand on a un ___.", "problème", ["bonbon", "cadeau"], hints("Pense à ce qui rend l'aide utile.", "Quelque chose ne va pas.", "Le mot commence par la lettre p."), "comm:voisin:besoin"),
    gr("Les règles du quartier sont les mêmes pour ___.", "tous", ["un seul", "personne"], hints("Pense à ceux qui habitent le quartier.", "Personne n'est oublié.", "Le mot est court."), "comm:règle"),
    gr("Il faut garder l'eau du puits ___.", "propre", ["sale", "cachée"], hints("Pense à ce qu'on veut boire.", "On ne la salit pas.", "Le mot commence par la lettre p."), "comm:puits"),
    gr("Pour ne pas déranger les voisins, on évite de faire trop de ___ la nuit.", "bruit", ["fumée", "poussière"], hints("Pense à ce qui réveille.", "On parle doucement.", "Le mot commence par la lettre b."), "comm:bruit"),
    gr("On ne ___ pas le puits en y jetant des déchets.", "salit", ["lave", "remplit"], hints("Pense à l'eau qu'on veut boire.", "On garde l'eau propre.", "Le verbe commence par la lettre s."), "comm:puits"),
    gr("Un nouvel habitant doit connaître les ___ du quartier.", "règles", ["couleurs", "fruits"], hints("Pense à ce qu'il doit suivre.", "Elles sont les mêmes pour tous.", "Le mot commence par la lettre r."), "comm:nouveau"),
    gr("Le terrain de sport, le puits et le marché sont des biens ___.", "communs", ["privés", "cassés"], hints("Pense à ce qui sert à tous.", "Ils ne sont à personne seul.", "Le mot commence par la lettre c."), "comm:mot"),
    gr("Quand un voisin construit, on peut lui donner un coup de ___.", "main", ["pied", "tête"], hints("Pense à l'aide qu'on apporte.", "On travaille avec lui.", "Le mot a quatre lettres."), "comm:voisin:aide"),
    gr("Dans le quartier, chacun doit ___ les règles.", "respecter", ["oublier", "cacher"], hints("Pense à ce qu'on fait d'une règle.", "On donne l'exemple.", "Le verbe commence par la lettre r."), "comm:règle"),
  ],
  COMMUNITY_FACTS,
);

const COMMUNITY_WRITE_ROWS: readonly WriteRow[] = inFactOrder(
  [
    wr("Quel lieu donne de l'eau à tout le quartier ? Écris le mot.", ["puits", "le puits"], hints("Pense à ce qu'on puise.", "Il est profond.", "Le mot commence par la lettre p."), "comm:puits"),
    wr("Où va-t-on acheter et vendre dans le quartier ? Écris le mot.", ["marché", "le marché", "marche"], hints("Pense aux étals.", "On y trouve des légumes.", "Le mot commence par la lettre m."), "comm:marché"),
    wr("Quel bien commun sert à jouer et à faire du sport ? Écris les trois mots.", ["terrain de sport", "le terrain de sport"], hints("Pense à l'endroit où l'on joue au ballon.", "Il est ouvert à tous les enfants.", "Le premier mot commence par la lettre t."), "comm:terrain"),
    wr("Comment appelle-t-on ce qui sert à tous les habitants ? Écris deux mots.", ["bien commun", "biens communs", "un bien commun"], hints("Pense à ce qui n'est à personne seul.", "Le puits en est un.", "Le premier mot commence par la lettre b."), "comm:mot"),
    // Suivre, appliquer, obéir aux règles sont aussi justes que « respecter » : une réponse défendable ne doit pas être refusée.
    wr("Que doit-on faire des règles du quartier ? Écris le verbe.", ["respecter", "suivre", "appliquer", "obéir", "obeir"], hints("Pense à ce qu'on fait d'une règle.", "On donne l'exemple.", "Le verbe commence par la lettre r."), "comm:règle"),
    wr("Comment s'appellent les gens qui habitent à côté de chez nous ? Écris le mot.", ["voisins", "voisin", "les voisins"], hints("Pense à ceux qui sont près de chez toi.", "On leur dit bonjour chaque jour.", "Le mot commence par la lettre v."), "comm:voisin:aide"),
    wr("Que fait-on pour un voisin qui a besoin d'aide ? Écris le verbe.", ["aider", "s'entraider"], hints("Pense à rendre service.", "On donne un coup de main.", "Le verbe commence par la lettre a."), "comm:voisin:besoin"),
    wr("Où doit-on mettre ses déchets au marché ? Écris le mot.", ["poubelle", "la poubelle", "dans la poubelle"], hints("Pense à un grand seau.", "On le vide régulièrement.", "Le mot commence par la lettre p."), "comm:marché"),
  ],
  COMMUNITY_FACTS,
);

export function makeCe2CommonGood(ctx: GameContext): GeneratedGame {
  return ce2Question(ctx, "ce2-commun-bien", "reconnaître un bien commun du quartier", COMMON_ROWS, 1, (row) => `${row.prompt}|${row.answer}`, 0);
}
export function makeCe2CommunityRule(ctx: GameContext): GeneratedGame {
  return ce2Question(ctx, "ce2-commun-regle", "choisir la règle du quartier à suivre dans une situation", RULE_ROWS, 1, (row) => row.prompt, 3);
}
export function makeCe2Neighbour(ctx: GameContext): GeneratedGame {
  return ce2Question(ctx, "ce2-commun-voisin", "choisir comment aider un voisin", NEIGHBOUR_ROWS, 1, (row) => row.prompt, 2);
}
export function makeCe2CommunitySort(ctx: GameContext): GeneratedGame {
  return ce2Sort(ctx, "ce2-commun-glisser", "ranger les biens communs et les biens personnels", COMMUNITY_SORT_ROWS, 1, 0);
}
export function makeCe2CommunityLink(ctx: GameContext): GeneratedGame {
  return ce2Link(ctx, "ce2-commun-relier", "relier un lieu du quartier à ce qu'on doit faire", COMMUNITY_LINK_ROWS, 1, 0);
}
export function makeCe2CommunityOrder(ctx: GameContext): GeneratedGame {
  return ce2Order(ctx, "ce2-commun-ordre", "ranger les gestes de la vie en communauté dans l'ordre du temps", COMMUNITY_ORDER_ROWS, 1, 0);
}
export function makeCe2CommunityGap(ctx: GameContext): GeneratedGame {
  return ce2Gap(ctx, "ce2-commun-trou", "compléter une phrase sur la vie en communauté", COMMUNITY_GAP_ROWS, 2, 0);
}
export function makeCe2CommunityWrite(ctx: GameContext): GeneratedGame {
  return ce2Write(ctx, "ce2-commun-ecrire", "écrire un mot sur la vie en communauté", COMMUNITY_WRITE_ROWS, 2, 2);
}
