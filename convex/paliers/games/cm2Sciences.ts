/**
 * LES GABARITS DES SCIENCES DU CM2 : vivre dans l'eau et sur la terre, les appareils de la maison, bien se nourrir, gérer et restaurer les
 * ressources, la santé de la mère et de l'enfant (`sc-cm2-milieux`, `-appareils`, `-nutrition`, `-ressources`, `-sante`).
 *
 * Même construction que `cm1Sciences.ts` et `cm2Histoire.ts` : des tableaux de faits fermés (`Pool`, `cm1Faits.ts`), les outils de
 * `ce2Outils.ts`, cinq paliers, six gabarits par thématique (cinq pour les milieux, qui n'ont pas de suite à ranger). Chaque réponse se lit
 * dans un tableau écrit à la main, qui ne dit que ce que la fiche dit, plus des faits de cours que personne ne discute. Aucun chiffre,
 * aucun nom savant que la fiche ne donne pas. La santé de la mère et de l'enfant reste au ton des 10-11 ans : pas de détail intime, le
 * VIH se dit par le sang, les aiguilles et les gestes qui ne le transmettent pas.
 *
 * LES PIÈGES DES LOTS PRÉCÉDENTS, TENUS ICI :
 * - une phrase à trou ne met ni article, ni « de », ni « à » devant le trou quand les options changent de genre : l'article est dans l'option ;
 * - un énoncé n'a qu'une apostrophe ; un énoncé d'ordre dit selon quel critère ; une tuile d'un mot n'a pas d'article (test des images du CI) ;
 * - un ordre et un appariement ont cinq lignes au moins, un glissé dix, sans quoi la même question revient à deux paliers ;
 * - un indice n'écrit aucun mot d'une option.
 *
 * MODULE PUR (voir `types.ts`).
 */
import { ce2Gap, ce2Link, ce2Order, ce2Question, ce2Sort, ce2Write, sortRows, type LinkRow, type OrderRow } from "./ce2Outils";
import { SORT_HINTS, gapRows, link, order, questionRows, writeRows, type Pool } from "./cm1Faits";
import type { GameContext, GeneratedGame } from "./shared";

type Make = (ctx: GameContext) => GeneratedGame;

// ===========================================================================
// VIVRE DANS L'EAU, VIVRE SUR TERRE (sc-cm2-milieux)
// ===========================================================================

const MLI_ORGANE: Pool = {
  items: [
    {
      id: "branchies",
      q: ["Quels organes permettent au poisson de respirer dans l'eau ?", "Avec quoi le poisson respire-t-il sous l'eau ?", "Quels organes le poisson utilise-t-il pour respirer sous l'eau ?"],
      a: "Branchies",
      also: ["Les branchies", "Branchie"],
      ga: "branchies",
      s: ["Le poisson respire sous l'eau avec ses ___.", "Pour respirer dans l'eau, le poisson utilise ses ___."],
      hint: "Ils sont cachés de chaque côté de la tête.",
    },
    {
      id: "nageoires",
      q: ["Quelles parties du corps le poisson agite-t-il pour nager ?", "Avec quoi le poisson avance-t-il dans l'eau ?", "Quels organes aident le poisson à se diriger dans l'eau ?"],
      a: "Nageoires",
      also: ["Les nageoires", "Nageoire"],
      ga: "nageoires",
      s: ["Le poisson nage et se dirige avec ses ___.", "Pour avancer dans l'eau, le poisson bat de ses ___."],
      hint: "On les voit sur son dos, ses flancs et sa queue.",
    },
    {
      id: "ecailles",
      q: ["Qu'est-ce qui recouvre la peau du poisson et la protège ?", "Quelles petites plaques dures couvrent le corps du poisson ?", "Quelle couverture brillante a le corps du poisson ?"],
      a: "Écailles",
      also: ["Les écailles", "Ecailles", "Écaille"],
      ga: "écailles",
      s: ["La peau du poisson est protégée par ses ___.", "Le corps du poisson est couvert de ___ qui le protègent."],
      hint: "Elles brillent au soleil quand le poisson sort de l'eau.",
    },
    {
      id: "poils",
      q: ["Qu'est-ce qui couvre la peau de la chèvre ?", "Quelle couverture a le corps d'une chèvre ?", "Qu'est-ce qui protège la peau des animaux comme la chèvre ?"],
      a: "Poils",
      also: ["Les poils", "Poil"],
      ga: "poils",
      s: ["Le corps de la chèvre est couvert de ___ qui le protègent.", "La chèvre se protège du froid et du soleil avec ses ___."],
      hint: "Ils poussent sur la peau et gardent la chaleur.",
    },
    {
      id: "plumes",
      q: ["Quelle couverture a le corps d'un oiseau ?", "Quelles parties légères permettent à l'oiseau de voler ?", "Quelle couverture légère recouvre les ailes d'un oiseau ?"],
      a: "Plumes",
      also: ["Les plumes", "Plume"],
      ga: "plumes",
      s: ["Le corps de l'oiseau est couvert de ___ qui le protègent.", "L'oiseau vole grâce à ses ___."],
      hint: "Elles sont très légères et de toutes les couleurs.",
    },
  ],
};

const MLI_AQUA: Pool = {
  items: [
    {
      id: "poisson",
      q: ["Lequel de ces êtres vivants vit dans l'eau ?", "Quel animal à nageoires vit dans l'eau ?", "Quel être vivant aquatique a des écailles ?"],
      a: "Poisson",
      w: "Quel animal à nageoires vit dans l'eau ? Écris la réponse.",
      also: ["Poisson", "Le poisson"],
      ga: "le poisson",
      s: ["Dans l'eau vit ___.", "Un animal à nageoires du milieu aquatique, c'est ___."],
      hint: "Il a un corps allongé et il ne quitte jamais l'eau.",
    },
    {
      id: "crevette",
      q: ["Quel petit animal à carapace vit dans l'eau ?", "Quel animal aquatique a une carapace et plusieurs pattes ?", "Lequel de ces animaux vit dans la mer ou dans le fleuve ?"],
      a: "Crevette",
      noWrite: true,
      ga: "la crevette",
      s: ["Parmi les animaux du milieu aquatique, on trouve ___.", "Dans la mer ou dans le fleuve vit ___."],
      hint: "Elle a une carapace fine et plusieurs pattes.",
    },
    {
      id: "nenuphar",
      q: ["Quelle plante vit à la surface de l'eau ?", "Lequel de ces êtres vivants est une plante aquatique ?", "Quelle plante aquatique a de larges feuilles qui flottent ?"],
      a: "Nénuphar",
      also: ["Nenuphar"],
      noWrite: true,
      ga: "le nénuphar",
      s: ["Une plante du milieu aquatique, c'est ___.", "Sur un étang flotte ___."],
      hint: "Ses grandes feuilles rondes reposent sur l'eau.",
    },
  ],
  extras: ["Chèvre", "Baobab", "Lion"],
  gextras: ["la chèvre", "le baobab", "le lion"],
  onlyExtras: true,
};

const MLI_TERRE: Pool = {
  items: [
    {
      id: "chevre",
      q: ["Quel animal terrestre a des poils et broute l'herbe ?", "Lequel de ces êtres vivants vit sur la terre ferme et a des poils ?", "Quel animal de la terre ferme broute et saute sur les rochers ?"],
      a: "Chèvre",
      w: "Quel animal terrestre a des poils et broute l'herbe ? Écris la réponse.",
      also: ["Chèvre", "Chevre", "La chèvre"],
      ga: "la chèvre",
      s: ["Sur la terre ferme vit ___.", "Un animal terrestre qui broute, c'est ___."],
      hint: "Elle broute l'herbe et saute sur les rochers.",
    },
    {
      id: "baobab",
      q: ["Quel arbre géant vit sur la terre ferme ?", "Lequel de ces êtres vivants est un grand arbre de la savane ?", "Quelle plante terrestre a un tronc énorme ?"],
      a: "Baobab",
      noWrite: true,
      ga: "le baobab",
      s: ["Parmi les êtres vivants du milieu terrestre, on trouve ___.", "Un grand arbre de la terre ferme, c'est ___."],
      hint: "Son tronc est très large et il vit très longtemps.",
    },
  ],
  extras: ["Poisson", "Crevette", "Nénuphar"],
  gextras: ["le poisson", "la crevette", "le nénuphar"],
  onlyExtras: true,
};

const MLI_PLANTE: Pool = {
  items: [
    {
      id: "racines",
      q: ["Que développent les plantes de zone sèche pour aller chercher l'eau très loin ?", "Quelles parties de la plante vont puiser l'eau profondément dans le sol ?", "Quelle partie aide une plante de zone sèche à trouver de l'eau ?"],
      a: "Racines profondes",
      also: ["Les racines profondes", "Racines"],
      ga: "racines profondes",
      s: ["En zone sèche, certaines plantes ont des ___ pour chercher l'eau.", "Pour trouver l'eau loin sous le sol, une plante développe des ___."],
      hint: "Elles s'enfoncent sous la terre, très loin.",
    },
    {
      id: "epines",
      q: ["Que portent certaines plantes de zone sèche pour se protéger et garder leur eau ?", "Quelle protection piquante ont certaines plantes de zone sèche ?", "Quelle protection éloigne les animaux d'une plante de zone sèche ?"],
      a: "Feuilles épineuses",
      also: ["Les feuilles épineuses", "Feuilles epineuses", "Épines"],
      ga: "feuilles épineuses",
      s: ["Pour se protéger en zone sèche, certaines plantes ont des ___.", "Une plante de zone sèche se défend avec des ___."],
      hint: "Elles piquent les animaux qui veulent les manger.",
    },
  ],
  extras: ["Grandes fleurs", "Tiges flottantes"],
  gextras: ["grandes fleurs", "tiges flottantes"],
};

const MLI_MILIEU: Pool = {
  items: [
    {
      id: "milieu-aquatique",
      q: ["Comment appelle-t-on l'endroit où vivent le poisson et la crevette ?", "Dans quel type de lieu vit le nénuphar ?", "Où vivent les êtres vivants qui passent leur vie dans l'eau ?"],
      a: "Milieu aquatique",
      also: ["Aquatique", "Le milieu aquatique"],
      ga: "aquatique",
      s: ["Le poisson vit dans un milieu ___.", "Le nénuphar pousse dans un milieu ___."],
      hint: "Tout s'y passe sous l'eau ou à sa surface.",
    },
    {
      id: "milieu-terrestre",
      q: ["Comment appelle-t-on l'endroit où vivent la chèvre et le baobab ?", "Dans quel type de lieu vit la chèvre ?", "Où vivent les êtres vivants qui passent leur vie sur la terre ferme ?"],
      a: "Milieu terrestre",
      also: ["Terrestre", "Le milieu terrestre"],
      ga: "terrestre",
      s: ["La chèvre vit dans un milieu ___.", "Le baobab pousse dans un milieu ___."],
      hint: "Tout s'y passe sur le sol et dans l'air.",
    },
  ],
  extras: ["Milieu polaire"],
  gextras: ["polaire"],
};

const MLI_POOLS = [MLI_ORGANE, MLI_AQUA, MLI_TERRE, MLI_PLANTE, MLI_MILIEU] as const;
const MLI_QCM = questionRows("sc-cm2-milieux", MLI_POOLS);
const MLI_TROU = gapRows("sc-cm2-milieux", MLI_POOLS);
const MLI_ECRIRE = writeRows("sc-cm2-milieux", MLI_POOLS);

const MLI_RELIER: readonly LinkRow[] = [
  link("Relie chaque animal à ce qui couvre son corps.", [["Poisson", "Écailles"], ["Chèvre", "Poils"], ["Oiseau", "Plumes"]]),
  link("Relie chaque partie à son rôle.", [["Branchies", "Respirer dans l'eau"], ["Nageoires", "Nager"], ["Écailles", "Protéger la peau"]]),
  link("Relie chaque être vivant à sa place.", [["Poisson", "Dans l'eau"], ["Chèvre", "Sur la terre ferme"], ["Nénuphar", "À la surface de l'eau"]]),
  link("Relie chaque partie à l'animal qui la porte.", [["Branchies", "Poisson"], ["Poils", "Chèvre"], ["Plumes", "Oiseau"]]),
  link("Relie chaque adaptation à son effet.", [["Racines profondes", "Trouver l'eau loin"], ["Feuilles épineuses", "Éloigner les animaux"], ["Écailles", "Protéger le poisson"]]),
];

const MLI_GLISSER = [
  ...sortRows("Glisse chaque être vivant dans la bonne case.", ["Milieu aquatique", "Milieu terrestre"], ["Poisson", "Crevette", "Nénuphar"], ["Chèvre", "Baobab", "Lion"], SORT_HINTS, 9),
  ...sortRows(
    "Glisse chaque partie dans la bonne case.",
    ["Pour vivre dans l'eau", "Pour vivre sur la terre"],
    ["Branchies", "Nageoires", "Écailles"],
    ["Poils", "Plumes", "Racines profondes", "Feuilles épineuses"],
    SORT_HINTS,
    8,
  ),
];

export const makeCm2MliQcm: Make = (ctx) => ce2Question(ctx, "cm2-mli-qcm", "les êtres vivants de l'eau et de la terre et leurs adaptations", MLI_QCM, 3);
export const makeCm2MliTrou: Make = (ctx) => ce2Gap(ctx, "cm2-mli-trou", "compléter une phrase sur les milieux de vie", MLI_TROU, 2, 1);
export const makeCm2MliEcrire: Make = (ctx) => ce2Write(ctx, "cm2-mli-ecrire", "écrire un fait sur les milieux de vie", MLI_ECRIRE, 2, 2);
export const makeCm2MliRelier: Make = (ctx) => ce2Link(ctx, "cm2-mli-relier", "relier un être vivant à ce qui l'aide à vivre", MLI_RELIER);
export const makeCm2MliGlisser: Make = (ctx) => ce2Sort(ctx, "cm2-mli-glisser", "classer les êtres vivants et leurs adaptations", MLI_GLISSER, 2);

// ===========================================================================
// LES APPAREILS DE LA MAISON (sc-cm2-appareils)
// ===========================================================================

const APR_USAGE: Pool = {
  items: [
    {
      id: "frigo",
      q: ["Quel appareil garde les aliments au frais ?", "Quel appareil conserve le lait et la viande froids ?", "Quel appareil évite que les aliments se gâtent trop vite ?"],
      a: "Réfrigérateur",
      also: ["Le réfrigérateur", "Frigo", "Refrigerateur"],
      ga: "le réfrigérateur",
      s: ["Pour garder les aliments au frais, on utilise ___.", "Le lait reste frais plus longtemps dans ___."],
      hint: "Il garde le froid grâce à sa porte bien fermée.",
    },
    {
      id: "ventilo",
      q: ["Quel appareil brasse l'air pour rafraîchir une pièce ?", "Quel appareil fait du vent avec des pales qui tournent ?", "Quel appareil électrique aide à avoir moins chaud quand il fait très chaud ?"],
      a: "Ventilateur",
      also: ["Le ventilateur"],
      ga: "le ventilateur",
      s: ["Pour avoir moins chaud dans une pièce, on allume ___.", "On allume ___ pour faire du vent."],
      hint: "Ses pales tournent vite et envoient de l'air frais.",
    },
    {
      id: "portable",
      q: ["Quel appareil se glisse dans la poche et permet d'appeler ?", "Quel appareil sans fil permet de téléphoner partout ?", "Quel appareil sert à appeler et à envoyer des messages ?"],
      a: "Téléphone portable",
      also: ["Le téléphone portable", "Portable", "Téléphone", "Telephone portable"],
      ga: "le téléphone portable",
      s: ["Pour appeler un ami, on peut utiliser ___.", "On envoie un message avec ___."],
      hint: "Il tient dans la main et se recharge sur une prise.",
    },
    {
      id: "fer",
      q: ["Quel appareil chaud sert à défroisser les habits ?", "Quel appareil électrique lisse le tissu quand il est chaud ?", "Quel appareil faut-il laisser refroidir avant de le ranger ?"],
      a: "Fer à repasser",
      also: ["Le fer à repasser", "Fer a repasser", "Fer"],
      ga: "le fer à repasser",
      s: ["Pour défroisser un habit, on utilise ___.", "On lisse un habit froissé avec ___."],
      hint: "Sa semelle chauffe et peut brûler.",
    },
  ],
  extras: ["Radio", "Ampoule"],
  gextras: ["la radio", "l'ampoule"],
};

const APR_SECU: Pool = {
  items: [
    {
      id: "secu-debrancher",
      q: ["Que faut-il faire avant de nettoyer un appareil électrique ?", "Quel geste faut-il faire d'abord avant de nettoyer un appareil branché ?", "Que faire de la prise avant de nettoyer un ventilateur ?"],
      a: "Débrancher l'appareil",
      also: ["Débrancher", "Le débrancher", "Debrancher"],
      ga: "débrancher l'appareil",
      s: ["Avant de nettoyer un appareil électrique, il faut ___.", "Pour nettoyer un ventilateur en sécurité, il faut ___ d'abord."],
      hint: "Le courant ne doit plus arriver jusqu'au fil.",
    },
    {
      id: "secu-mains",
      q: ["Que faut-il faire avant de toucher une prise ?", "Dans quel état doivent être les mains pour brancher une fiche ?", "Que faut-il faire à ses mains avant de brancher un appareil ?"],
      a: "Sécher ses mains",
      also: ["Se sécher les mains", "Sécher les mains", "Secher ses mains"],
      ga: "sécher ses mains",
      s: ["Avant de toucher une prise, il faut ___.", "Pour brancher un appareil sans danger, il faut ___."],
      hint: "L'eau et le courant ne font pas bon ménage.",
    },
    {
      id: "secu-adulte",
      q: ["Que faire si un appareil fume ou fait des étincelles ?", "Que faut-il faire quand un appareil électrique sent le brûlé ?", "Que faire si un fil électrique est abîmé ?"],
      a: "Appeler un adulte",
      also: ["Prévenir un adulte", "Appeler un grand"],
      ga: "appeler un adulte",
      s: ["Si un appareil fume, il faut ___.", "Quand un fil est abîmé, il faut ___."],
      hint: "Une personne plus âgée sait quoi faire.",
    },
  ],
  extras: ["Mouiller la prise", "Tirer sur le fil pour débrancher", "Toucher les fils nus", "Brancher plusieurs appareils sur une prise"],
  gextras: ["mouiller la prise", "tirer sur le fil pour débrancher", "toucher les fils nus", "brancher plusieurs appareils sur une prise"],
  onlyExtras: true,
};

const APR_ENERGIE: Pool = {
  items: [
    {
      id: "eco-lumiere",
      q: ["Quel geste économise l'électricité quand on quitte une pièce ?", "Que faire de la lumière en sortant d'une pièce vide ?", "Quel petit geste évite de gaspiller du courant en quittant la classe ?"],
      a: "Éteindre la lumière",
      also: ["Éteindre", "Eteindre la lumière"],
      ga: "éteindre la lumière",
      s: ["Pour économiser l'électricité, on peut ___ en sortant.", "En quittant une pièce vide, il faut ___."],
      hint: "Un simple interrupteur suffit.",
    },
    {
      id: "eco-chargeur",
      q: ["Que faire d'un chargeur quand le téléphone est plein ?", "Quel geste évite de gaspiller du courant après la recharge ?", "Que faire quand le téléphone a fini de charger ?"],
      a: "Débrancher le chargeur",
      also: ["Débrancher", "Debrancher le chargeur"],
      ga: "débrancher le chargeur",
      s: ["Quand la recharge est finie, il faut ___.", "Pour ne pas gaspiller du courant, on peut ___ après la charge."],
      hint: "Il ne doit plus rester dans la prise.",
    },
    {
      id: "eco-frigo",
      q: ["Que faire de la porte du réfrigérateur pour qu'il consomme moins ?", "Quel geste garde le froid dans le réfrigérateur ?", "Comment limiter l'électricité utilisée par un réfrigérateur ?"],
      a: "Ouvrir la porte le moins possible",
      also: ["Ouvrir peu la porte", "Fermer la porte"],
      ga: "ouvrir la porte le moins possible",
      s: ["Pour que le réfrigérateur consomme moins, il faut ___.", "Pour garder le froid, on doit ___."],
      hint: "Chaque ouverture laisse entrer de la chaleur.",
    },
  ],
  extras: ["Laisser la lumière allumée", "Laisser le chargeur branché", "Laisser la porte ouverte longtemps"],
  gextras: ["laisser la lumière allumée", "laisser le chargeur branché", "laisser la porte ouverte longtemps"],
  onlyExtras: true,
};

const APR_ENTRETIEN: Pool = {
  items: [
    {
      id: "ent-poussiere",
      q: ["Que faire des pales sales pour que le ventilateur tourne bien ?", "Quel entretien retire la saleté posée sur un ventilateur ?", "Que faut-il retirer des pales pour que le ventilateur souffle bien ?"],
      a: "Enlever la poussière",
      also: ["Nettoyer", "Enlever la poussiere"],
      ga: "enlever la poussière",
      s: ["Pour entretenir un ventilateur, il faut ___.", "Un ventilateur tourne mieux quand on sait ___."],
      hint: "Un chiffon doux suffit.",
    },
    {
      id: "ent-refroidir",
      q: ["Que faire d'un fer à repasser chaud avant de le ranger ?", "Quel entretien faut-il faire après le repassage ?", "Que faut-il attendre avant de ranger un fer à repasser ?"],
      a: "Laisser refroidir",
      also: ["Le laisser refroidir", "Attendre qu'il refroidisse"],
      ga: "laisser refroidir",
      s: ["Avant de ranger le fer à repasser, il faut ___.", "Après le repassage, on doit ___ le fer."],
      hint: "Il faut un peu de patience.",
    },
    {
      id: "ent-choc",
      q: ["Que faut-il éviter pour que le téléphone portable dure longtemps ?", "Quel entretien protège un téléphone portable ?", "Comment prendre soin d'un téléphone portable ?"],
      a: "Éviter les chocs",
      also: ["Éviter les chutes", "Eviter les chocs"],
      ga: "éviter les chocs",
      s: ["Pour que le téléphone dure, il faut ___.", "Un téléphone portable se casse moins si on sait ___."],
      hint: "Un écran fragile n'aime pas tomber.",
    },
  ],
  extras: ["Mouiller l'appareil"],
  gextras: ["mouiller l'appareil"],
};

const APR_POOLS = [APR_USAGE, APR_SECU, APR_ENERGIE, APR_ENTRETIEN] as const;
const APR_QCM = questionRows("sc-cm2-appareils", APR_POOLS);
const APR_TROU = gapRows("sc-cm2-appareils", APR_POOLS);
const APR_ECRIRE = writeRows("sc-cm2-appareils", APR_POOLS);

const APR_ORDRE: readonly OrderRow[] = [
  order("Range les gestes pour repasser un habit en sécurité, du premier au dernier.", ["Brancher le fer", "Attendre qu'il chauffe", "Repasser l'habit", "Débrancher le fer"], "apr-ordre:repasser"),
  order("Range les gestes pour nettoyer un ventilateur, du premier au dernier.", ["Débrancher le ventilateur", "Enlever la poussière", "Laisser sécher", "Rebrancher le ventilateur"], "apr-ordre:ventilateur"),
  order("Range les gestes pour recharger un téléphone, du premier au dernier.", ["Brancher le chargeur", "Brancher le téléphone", "Attendre la fin de la charge", "Débrancher le chargeur"], "apr-ordre:telephone"),
  order("Range les gestes pour changer une ampoule, du premier au dernier.", ["Éteindre la lumière", "Attendre que l'ampoule refroidisse", "Dévisser l'ampoule", "Visser la nouvelle ampoule"], "apr-ordre:ampoule"),
  order("Range les gestes pour brancher un appareil, du premier au dernier.", ["Se laver les mains", "Sécher ses mains", "Prendre la fiche", "Brancher la fiche"], "apr-ordre:brancher"),
];

const APR_RELIER: readonly LinkRow[] = [
  link("Relie chaque appareil à son usage.", [["Réfrigérateur", "Garder au frais"], ["Ventilateur", "Rafraîchir l'air"], ["Téléphone portable", "Appeler"], ["Fer à repasser", "Défroisser"]]),
  link("Relie chaque appareil à ce qu'il fait.", [["Réfrigérateur", "Conserve les aliments"], ["Ventilateur", "Fait du vent"], ["Fer à repasser", "Chauffe pour lisser les habits"]]),
  link("Relie chaque geste à son effet.", [["Éteindre la lumière", "Économiser l'électricité"], ["Fermer la porte du réfrigérateur", "Garder le froid"], ["Débrancher l'appareil", "Éviter le choc électrique"]]),
  link("Relie chaque appareil à son entretien.", [["Ventilateur", "Enlever la poussière"], ["Fer à repasser", "Laisser refroidir"], ["Téléphone portable", "Éviter les chocs"]]),
  link("Relie chaque appareil ou chaque objet à son danger.", [["Fer à repasser", "Brûlure"], ["Prise", "Choc électrique"], ["Ventilateur", "Doigts dans les pales"]]),
];

const APR_GLISSER = [
  ...sortRows(
    "Glisse chaque geste dans la bonne case.",
    ["Sécurité", "Économie"],
    ["Sécher ses mains", "Débrancher avant de nettoyer", "Appeler un adulte", "Ne pas mouiller la prise"],
    ["Éteindre la lumière", "Débrancher le chargeur", "Éteindre le ventilateur", "Fermer la porte du frigo"],
    SORT_HINTS,
    8,
  ),
  ...sortRows(
    "Glisse chaque objet dans la bonne case.",
    ["Appareil électrique", "Outil sans électricité"],
    ["Réfrigérateur", "Ventilateur", "Fer à repasser", "Téléphone portable"],
    ["Balai", "Pilon", "Daba"],
    SORT_HINTS,
    8,
  ),
];

export const makeCm2AprQcm: Make = (ctx) => ce2Question(ctx, "cm2-apr-qcm", "les appareils de la maison, leur sécurité et leur entretien", APR_QCM, 3);
export const makeCm2AprTrou: Make = (ctx) => ce2Gap(ctx, "cm2-apr-trou", "compléter une phrase sur les appareils de la maison", APR_TROU, 2, 1);
export const makeCm2AprEcrire: Make = (ctx) => ce2Write(ctx, "cm2-apr-ecrire", "écrire un fait sur les appareils de la maison", APR_ECRIRE, 1, 2);
export const makeCm2AprOrdre: Make = (ctx) => ce2Order(ctx, "cm2-apr-ordre", "ranger les gestes d'un appareil de la maison", APR_ORDRE);
export const makeCm2AprRelier: Make = (ctx) => ce2Link(ctx, "cm2-apr-relier", "relier un appareil à son usage, son entretien ou son danger", APR_RELIER);
export const makeCm2AprGlisser: Make = (ctx) => ce2Sort(ctx, "cm2-apr-glisser", "classer les gestes de sécurité et les objets de la maison", APR_GLISSER, 2);

// ===========================================================================
// BIEN SE NOURRIR POUR BIEN GRANDIR (sc-cm2-nutrition)
// ===========================================================================

const NUT_GROUPE: Pool = {
  items: [
    {
      id: "g-energie",
      q: ["Quels aliments donnent de la force pour courir et jouer ?", "Quels aliments donnent de l'énergie au corps ?", "Quel groupe d'aliments nous fait avancer toute la journée ?"],
      a: "Aliments énergétiques",
      also: ["Énergétiques", "Energetiques", "Les aliments énergétiques"],
      ga: "aliments énergétiques",
      s: ["Le riz et le mil font partie des ___.", "Les ___ donnent de la force pour la journée."],
      hint: "Ce sont surtout des céréales et des tubercules.",
    },
    {
      id: "g-construction",
      q: ["Quels aliments aident le corps à grandir et à fabriquer muscles et os ?", "Quel groupe d'aliments sert à construire le corps ?", "Quels aliments riches en protéines font grandir l'enfant ?"],
      a: "Aliments de construction",
      also: ["De construction", "Les aliments de construction"],
      ga: "aliments de construction",
      s: ["Le poisson et le niébé font partie des ___.", "Les ___ aident l'enfant à grandir."],
      hint: "On y trouve surtout de la viande, des œufs et des haricots.",
    },
    {
      id: "g-protection",
      q: ["Quels aliments protègent le corps contre les maladies ?", "Quel groupe d'aliments apporte des vitamines ?", "Quels fruits et légumes aident le corps à se défendre ?"],
      a: "Aliments de protection",
      also: ["De protection", "Les aliments de protection"],
      ga: "aliments de protection",
      s: ["La mangue et les légumes verts font partie des ___.", "Les ___ défendent le corps contre les maladies."],
      hint: "On les reconnaît à leurs couleurs vives.",
    },
  ],
};

const NUT_ALIMENT: Pool = {
  items: [
    {
      id: "riz",
      q: ["À quel groupe appartient le riz ?", "Le riz est un aliment de quel groupe ?"],
      a: "Aliment énergétique",
      also: ["Énergétique", "Energetique"],
      ga: "aliments énergétiques",
      s: ["Le riz fait partie des ___.", "Dans un repas, le riz est classé parmi les ___."],
      hint: "C'est une céréale qui donne de la force.",
    },
    {
      id: "mil",
      q: ["À quel groupe d'aliments appartient le mil ?", "Le mil est un aliment de quel groupe ?"],
      a: "Aliment énergétique",
      also: ["Énergétique", "Energetique"],
      ga: "aliments énergétiques",
      s: ["Le mil fait partie des ___.", "La farine de mil est classée parmi les ___."],
      hint: "Ses grains se pilent pour faire de la farine.",
    },
    {
      id: "poisson",
      q: ["À quel groupe appartient le poisson ?", "Le poisson est un aliment de quel groupe ?"],
      a: "Aliment de construction",
      also: ["De construction"],
      ga: "aliments de construction",
      s: ["Le poisson fait partie des ___.", "Dans un repas, le poisson est classé parmi les ___."],
      hint: "Il vient de la mer ou du fleuve et il est riche en protéines.",
    },
    {
      id: "niebe",
      q: ["À quel groupe appartient le niébé ?", "Le niébé est un aliment de quel groupe ?"],
      a: "Aliment de construction",
      also: ["De construction"],
      ga: "aliments de construction",
      s: ["Le niébé fait partie des ___.", "Les haricots comme le niébé sont classés parmi les ___."],
      hint: "Ce haricot cuit se mange avec du riz.",
    },
    {
      id: "mangue",
      q: ["À quel groupe appartient la mangue ?", "La mangue est un aliment de quel groupe ?"],
      a: "Aliment de protection",
      also: ["De protection"],
      ga: "aliments de protection",
      s: ["La mangue fait partie des ___.", "Dans un repas, la mangue est classée parmi les ___."],
      hint: "Ce fruit sucré est plein de vitamines.",
    },
    {
      id: "legumes",
      q: ["À quel groupe appartiennent les légumes verts ?", "Les légumes verts sont des aliments de quel groupe ?"],
      a: "Aliment de protection",
      also: ["De protection"],
      ga: "aliments de protection",
      s: ["Les légumes verts font partie des ___.", "Les feuilles vertes sont classées parmi les ___."],
      hint: "Les feuilles et les légumes se mangent crus ou en sauce.",
    },
  ],
};

const NUT_PLAT: Pool = {
  items: [
    {
      id: "thieb",
      q: ["Quel plat sénégalais associe le riz, le poisson et des légumes ?", "Quel plat national se prépare avec du riz rouge et du poisson ?", "Quel plat de riz au poisson est très connu à Dakar ?"],
      a: "Thiéboudienne",
      also: ["Thieboudienne", "Thiébou dienne", "Thiéb"],
      s: ["Le plat de riz au poisson avec des légumes se nomme ___.", "Le plat national sénégalais au riz et au poisson se nomme ___."],
      hint: "Le riz y cuit dans une sauce rouge.",
    },
    {
      id: "mafe",
      q: ["Quel plat sénégalais est une sauce à l'arachide servie avec du riz ?", "Quel plat se prépare avec de la pâte d'arachide et de la viande ?", "Quel plat de riz est cuit dans une sauce épaisse d'arachide ?"],
      a: "Mafé",
      also: ["Mafe", "Maffé"],
      s: ["Le plat sénégalais à la pâte d'arachide se nomme ___.", "Le riz avec une sauce épaisse d'arachide se nomme ___."],
      hint: "Sa sauce est épaisse et onctueuse.",
    },
    {
      id: "yassa",
      q: ["Quel plat sénégalais associe poulet, oignons et citron ?", "Quel plat se prépare avec des oignons dorés et du citron ?", "Quel plat de poulet mariné avec des oignons est servi avec du riz ?"],
      a: "Yassa",
      also: ["Yassa poulet", "Yassa au poulet"],
      s: ["Le plat sénégalais au poulet et au citron se nomme ___.", "Le poulet mariné aux oignons se nomme ___."],
      hint: "Il est parfumé et un peu acide.",
    },
  ],
  extras: ["Pizza", "Hamburger"],
};

const NUT_EQUIL: Pool = {
  items: [
    {
      id: "equilibre",
      q: ["Que contient un repas équilibré ?", "Comment est composé un repas équilibré ?", "Que doit-on trouver dans un repas qui fait grandir sainement ?"],
      a: "Des aliments des trois groupes",
      also: ["Les trois groupes d'aliments", "Aliments des trois groupes"],
      ga: "des aliments des trois groupes",
      s: ["Un repas équilibré contient ___.", "Pour bien grandir, un repas doit contenir ___."],
      hint: "Il mélange de la force, de quoi grandir et de quoi se défendre.",
    },
  ],
  extras: ["Un seul groupe d'aliments", "Seulement des sucreries"],
  gextras: ["un seul groupe d'aliments", "des sucreries seulement"],
};

const NUT_TROUBLE: Pool = {
  items: [
    {
      id: "carence",
      q: ["Comment appelle-t-on le manque d'une substance dont le corps a besoin ?", "Quel mot désigne le manque d'un élément important pour le corps ?"],
      a: "Carence",
      also: ["La carence", "Carence alimentaire"],
      not: ["Malnutrition"],
      ga: "la carence",
      s: ["Le manque de vitamines ou de fer dans l'alimentation se nomme ___.", "Un manque d'une substance utile au corps se nomme ___."],
      hint: "Il manque quelque chose au corps.",
    },
    {
      id: "malnutrition",
      q: ["Comment appelle-t-on un mauvais état causé par une alimentation insuffisante ou mal choisie ?", "Quel mot désigne une alimentation qui ne couvre pas les besoins du corps ?"],
      a: "Malnutrition",
      also: ["La malnutrition"],
      not: ["Carence"],
      ga: "la malnutrition",
      s: ["Une alimentation qui ne couvre pas les besoins du corps se nomme ___.", "Le mauvais état d'un enfant mal nourri se nomme ___."],
      hint: "Le corps ne reçoit pas ce qu'il lui faut pour être fort.",
    },
    {
      id: "obesite",
      q: ["Comment appelle-t-on un poids beaucoup trop élevé à cause d'une alimentation trop riche ?", "Quel mot désigne le fait d'avoir trop de graisse dans le corps ?", "Quel trouble vient de trop de sucreries et de graisses ?"],
      a: "Obésité",
      also: ["L'obésité", "Obesite"],
      ga: "l'obésité",
      s: ["Un poids très élevé à cause de la nourriture se nomme ___.", "Manger trop gras et trop sucré peut mener à ___."],
      hint: "Le corps stocke trop de réserves.",
    },
  ],
  extras: ["Allergie", "Rhume"],
  gextras: ["l'allergie", "le rhume"],
};

const NUT_POOLS = [NUT_GROUPE, NUT_ALIMENT, NUT_PLAT, NUT_EQUIL, NUT_TROUBLE] as const;
const NUT_QCM = questionRows("sc-cm2-nutrition", NUT_POOLS);
const NUT_TROU = gapRows("sc-cm2-nutrition", NUT_POOLS);
const NUT_ECRIRE = writeRows("sc-cm2-nutrition", NUT_POOLS);

const NUT_ORDRE: readonly OrderRow[] = [
  order("Range les repas de la journée du matin au soir.", ["Petit-déjeuner", "Déjeuner", "Goûter", "Dîner"], "nut-ordre:repas"),
  order("Range les repas de la journée du matin au soir.", ["Petit-déjeuner", "Déjeuner", "Dîner"], "nut-ordre:trois"),
  order("Range les repas de la journée du matin au soir.", ["Déjeuner", "Goûter", "Dîner"], "nut-ordre:soir"),
  order("Range les repas de la journée du matin au soir.", ["Petit-déjeuner", "Goûter", "Dîner"], "nut-ordre:gouter"),
  order("Range les gestes pour préparer un repas, du premier au dernier.", ["Acheter les aliments", "Laver les légumes", "Cuire le repas", "Servir le repas"], "nut-ordre:preparer"),
];

const NUT_RELIER: readonly LinkRow[] = [
  link("Relie chaque aliment à son groupe.", [["Riz", "Énergétique"], ["Poisson", "Construction"], ["Mangue", "Protection"]]),
  link("Relie chaque aliment à son groupe.", [["Igname", "Énergétique"], ["Niébé", "Construction"], ["Orange", "Protection"]]),
  link("Relie chaque plat à ses ingrédients.", [["Thiéboudienne", "Riz et poisson"], ["Mafé", "Riz et sauce d'arachide"], ["Yassa", "Poulet et oignons"]]),
  link("Relie chaque trouble à ce qu'il décrit.", [["Carence", "Manque d'un élément"], ["Malnutrition", "Mauvaise alimentation"], ["Obésité", "Poids trop élevé"]]),
  link("Relie chaque groupe à son rôle.", [["Énergétique", "Donne de la force"], ["Construction", "Fait grandir"], ["Protection", "Défend contre les maladies"]]),
];

const NUT_GLISSER = [
  ...sortRows("Glisse chaque aliment dans la bonne case.", ["Aliment énergétique", "Aliment de construction"], ["Riz", "Mil", "Igname", "Patate"], ["Poisson", "Niébé", "Viande", "Œuf"], SORT_HINTS, 8),
  ...sortRows("Glisse chaque aliment dans la bonne case.", ["Aliment énergétique", "Aliment de protection"], ["Riz", "Mil", "Igname", "Patate"], ["Mangue", "Orange", "Papaye", "Légumes verts"], SORT_HINTS, 8),
  ...sortRows("Glisse chaque aliment dans la bonne case.", ["Aliment de construction", "Aliment de protection"], ["Poisson", "Niébé", "Viande", "Œuf"], ["Mangue", "Orange", "Papaye", "Légumes verts"], SORT_HINTS, 8),
];

export const makeCm2NutQcm: Make = (ctx) => ce2Question(ctx, "cm2-nut-qcm", "les groupes d'aliments, les plats sénégalais et les troubles de la nutrition", NUT_QCM, 3);
export const makeCm2NutTrou: Make = (ctx) => ce2Gap(ctx, "cm2-nut-trou", "compléter une phrase sur l'alimentation", NUT_TROU, 2, 1);
export const makeCm2NutEcrire: Make = (ctx) => ce2Write(ctx, "cm2-nut-ecrire", "écrire un fait sur l'alimentation", NUT_ECRIRE, 1, 2);
export const makeCm2NutOrdre: Make = (ctx) => ce2Order(ctx, "cm2-nut-ordre", "ranger les repas de la journée ou les gestes d'un repas", NUT_ORDRE);
export const makeCm2NutRelier: Make = (ctx) => ce2Link(ctx, "cm2-nut-relier", "relier un aliment, un plat ou un trouble à ce qui le décrit", NUT_RELIER);
export const makeCm2NutGlisser: Make = (ctx) => ce2Sort(ctx, "cm2-nut-glisser", "classer les aliments par groupe", NUT_GLISSER, 2);

// ===========================================================================
// GÉRER ET RESTAURER LES RESSOURCES (sc-cm2-ressources)
// ===========================================================================

const RSC_TERME: Pool = {
  items: [
    {
      id: "ressource",
      q: ["Comment appelle-t-on ce que la nature donne aux hommes, comme l'eau, les arbres et les poissons ?", "Quel nom porte tout ce que la nature fournit et dont les gens ont besoin ?"],
      a: "Ressource naturelle",
      also: ["Ressources naturelles", "Une ressource naturelle", "La ressource naturelle"],
      ga: "la ressource naturelle",
      s: ["Ce que la nature donne aux hommes se nomme ___.", "Tout ce que la nature fournit aux gens s'appelle ___."],
      hint: "On la trouve dans la nature et on en a tous besoin.",
    },
    {
      id: "jachere",
      q: ["Comment appelle-t-on le repos d'un champ laissé sans culture ?", "Quel mot désigne un champ qu'on laisse au repos pour que la terre se refasse ?"],
      a: "Jachère",
      also: ["La jachère", "Jachere"],
      ga: "la jachère",
      s: ["Un champ laissé au repos pour que le sol se refasse se nomme ___.", "Mettre un champ au repos quelques saisons, c'est faire ___."],
      hint: "Le champ se repose, comme quelqu'un qui dort.",
    },
    {
      id: "sol",
      q: ["Comment appelle-t-on une terre qui n'a plus assez de richesses pour nourrir les plantes ?", "Quel nom porte un sol trop cultivé qui ne donne presque plus de récolte ?"],
      a: "Sol épuisé",
      also: ["Un sol épuisé", "Le sol épuisé", "Sol appauvri", "Sol epuise"],
      ga: "le sol épuisé",
      s: ["Une terre qui ne nourrit plus les plantes est ___.", "Après trop de récoltes sans repos, un champ devient ___."],
      hint: "Il a donné beaucoup de récoltes et n'a plus de force.",
    },
    {
      id: "pauvrete",
      q: ["Comment appelle-t-on la situation de personnes qui manquent de nourriture et d'argent ?", "Quel mot désigne le manque de biens et de ressources dans une famille ?"],
      a: "Pauvreté",
      also: ["La pauvreté", "Pauvrete"],
      ga: "la pauvreté",
      s: ["Manquer de nourriture et d'argent, voilà ___.", "Le manque de ressources peut aggraver ___."],
      hint: "Il manque presque tout pour bien vivre.",
    },
  ],
};

const RSC_GESTE: Pool = {
  items: [
    {
      id: "eau",
      q: ["Que faire pour ne pas gaspiller l'eau en se lavant les mains ?", "Quel geste économise l'eau quand on se lave ?", "Quel geste évite de perdre de l'eau inutilement ?"],
      a: "Fermer le robinet pendant le savonnage",
      also: ["Fermer le robinet", "Fermer l'eau"],
      ga: "fermer le robinet pendant le savonnage",
      s: ["Pour économiser l'eau, il faut ___.", "Pour ne pas gaspiller l'eau, on doit ___."],
      hint: "Un geste de la main suffit, sans rien acheter.",
    },
    {
      id: "arbre",
      q: ["Que faire pour garder des arbres quand on en coupe un ?", "Quel geste aide à refaire la forêt ?", "Que faire après avoir coupé un arbre ?"],
      a: "Planter un arbre à la place de celui qu'on coupe",
      also: ["Planter un arbre", "Replanter un arbre"],
      ga: "planter un arbre à la place de celui qu'on coupe",
      s: ["Après avoir coupé un arbre, il faut ___.", "Pour refaire un petit bois, on doit ___."],
      hint: "Un jeune plant pousse là où l'ancien est tombé.",
    },
    {
      id: "jachere",
      q: ["Que faire pour qu'un champ retrouve sa richesse ?", "Quel geste redonne de la force à un sol fatigué ?", "Que faire d'un champ qui ne donne presque plus de récolte ?"],
      a: "Laisser le champ au repos quelques saisons",
      also: ["Mettre le champ en jachère", "Laisser le champ au repos"],
      ga: "laisser le champ au repos quelques saisons",
      s: ["Pour qu'un sol retrouve sa richesse, il faut ___.", "Quand un champ est fatigué, on peut ___."],
      hint: "La terre se repose avant la prochaine récolte.",
    },
    {
      id: "peche",
      q: ["Que fait un pêcheur responsable des petits poissons qu'il attrape ?", "Quel geste protège les poissons qui n'ont pas fini de grandir ?", "Comment pêcher sans vider la mer ?"],
      a: "Rejeter à l'eau les petits poissons",
      also: ["Rejeter les petits poissons", "Remettre les petits poissons à l'eau"],
      ga: "rejeter à l'eau les petits poissons",
      s: ["Un pêcheur responsable doit ___.", "Pour que la pêche dure, on peut ___."],
      hint: "Les plus jeunes ont le temps de grandir et de se reproduire.",
    },
  ],
  extras: ["Laisser l'eau couler pendant des heures", "Brûler la brousse pour nettoyer le champ", "Pêcher tous les petits poissons"],
  gextras: ["laisser l'eau couler pendant des heures", "brûler la brousse pour nettoyer le champ", "pêcher tous les petits poissons"],
};

const RSC_CAUSE: Pool = {
  items: [
    {
      id: "cause-sol",
      q: ["Qu'est-ce qui épuise un sol ?", "Pourquoi un champ cultivé chaque année finit-il par donner moins ?", "Qu'est-ce qui rend un sol pauvre en richesses ?"],
      a: "Cultiver sans jamais laisser reposer le sol",
      noWrite: true,
      ga: "cultiver sans jamais laisser reposer le sol",
      s: ["Un sol s'épuise quand on continue de ___.", "À force de ___, un champ donne moins."],
      hint: "La terre n'a pas le temps de se refaire.",
    },
    {
      id: "cause-mer",
      q: ["Qu'est-ce qui fait disparaître les poissons de la mer ?", "Pourquoi la mer se vide-t-elle de ses poissons ?", "Qu'est-ce qui rend les poissons de plus en plus rares ?"],
      a: "Pêcher plus de poissons qu'il n'en naît",
      noWrite: true,
      ga: "pêcher plus de poissons qu'il n'en naît",
      s: ["La mer se vide quand on ne cesse de ___.", "Il y a moins de poissons parce qu'on continue de ___."],
      hint: "Les petits nés chaque année ne compensent pas les prises.",
    },
    {
      id: "cause-arbres",
      q: ["Qu'est-ce qui fait disparaître une forêt ?", "Pourquoi une forêt devient-elle de plus en plus petite ?", "Pourquoi un pays est-il moins boisé d'année en année ?"],
      a: "Couper des arbres sans en replanter",
      noWrite: true,
      ga: "couper des arbres sans en replanter",
      s: ["Une forêt disparaît quand on ne cesse de ___.", "Les arbres manquent parce qu'on continue de ___."],
      hint: "Rien ne pousse pour remplacer ce qui est coupé.",
    },
  ],
};

const RSC_CONSEQ: Pool = {
  items: [
    {
      id: "cause-sol",
      q: ["Quelle conséquence a un sol épuisé pour les familles qui cultivent ?", "Que se passe-t-il pour les récoltes quand le sol est épuisé ?", "Quel effet a un sol fatigué sur les récoltes d'une famille ?"],
      a: "Des récoltes plus petites",
      noWrite: true,
      hint: "Les greniers restent à moitié vides.",
    },
    {
      id: "cause-mer",
      q: ["Que rapportent les pêcheurs au port quand la mer manque de poissons ?", "Quelle conséquence a la surpêche pour les familles de pêcheurs ?", "Que deviennent les prises des pêcheurs quand les poissons deviennent rares ?"],
      a: "Moins de poissons à vendre",
      noWrite: true,
      hint: "Les filets reviennent presque vides au port.",
    },
    {
      id: "eau-manque",
      q: ["Que deviennent les plantes quand l'eau manque trop longtemps ?", "Quelle conséquence a un long manque d'eau sur les champs ?", "Que subissent les cultures quand il ne pleut presque plus ?"],
      a: "Des plantes qui sèchent",
      noWrite: true,
      hint: "Leurs feuilles jaunissent puis tombent.",
    },
  ],
};

const RSC_POOLS = [RSC_TERME, RSC_GESTE, RSC_CAUSE, RSC_CONSEQ] as const;
const RSC_QCM = questionRows("sc-cm2-ressources", RSC_POOLS);
const RSC_TROU = gapRows("sc-cm2-ressources", RSC_POOLS);
const RSC_ECRIRE = writeRows("sc-cm2-ressources", RSC_POOLS);

const RSC_ORDRE: readonly OrderRow[] = [
  order("Range les étapes de la jachère, de la première à la dernière.", ["On cultive le champ", "Le sol s'épuise", "On laisse le champ au repos", "Le sol retrouve sa richesse"], "rsc-ordre:jachere"),
  order("Range les gestes d'un pêcheur responsable, du premier au dernier.", ["Jeter le filet", "Remonter le filet", "Rejeter les petits poissons", "Garder les gros poissons"], "rsc-ordre:pecheur"),
  order("Range les gestes pour se laver les mains sans gaspiller l'eau, du premier au dernier.", ["Mouiller les mains", "Fermer le robinet", "Se savonner", "Rouvrir pour rincer"], "rsc-ordre:mains"),
  order("Range les étapes pour refaire un petit bois, de la première à la dernière.", ["Choisir un terrain", "Planter les jeunes arbres", "Arroser les jeunes arbres", "Attendre que les arbres grandissent"], "rsc-ordre:bois"),
  order("Range les gestes pour arroser un jardin, du premier au dernier.", ["Remplir l'arrosoir", "Porter l'arrosoir au jardin", "Arroser au pied des plantes", "Replacer l'arrosoir"], "rsc-ordre:jardin"),
];

const RSC_RELIER: readonly LinkRow[] = [
  link("Relie chaque problème à son effet.", [["Sol épuisé", "Récoltes plus petites"], ["Surpêche", "Moins de poissons"], ["Manque d'eau", "Cultures qui sèchent"]]),
  link("Relie chaque geste à son but.", [["Jachère", "Reposer le sol"], ["Fermer le robinet", "Garder l'eau"], ["Planter un arbre", "Refaire la forêt"]]),
  link("Relie chaque mot à ce qu'il désigne.", [["Ressource naturelle", "Eau, arbres, sol"], ["Pauvreté", "Manque de biens"], ["Jachère", "Champ au repos"]]),
  link("Relie chaque ressource à un risque.", [["Eau", "Gaspillage"], ["Poissons", "Surpêche"], ["Sol", "Épuisement"]]),
  link("Relie chaque ressource à un geste qui la protège.", [["Eau", "Fermer le robinet"], ["Sol", "Jachère"], ["Poissons", "Pêche responsable"]]),
];

const RSC_GLISSER = [
  ...sortRows(
    "Glisse chaque geste dans la bonne case.",
    ["Gaspille une ressource", "Protège une ressource"],
    ["Laisser couler l'eau", "Pêcher les petits poissons", "Couper sans replanter", "Cultiver sans repos"],
    ["Fermer le robinet", "Mettre en jachère", "Planter un arbre", "Pêcher avec modération"],
    SORT_HINTS,
    8,
  ),
  ...sortRows(
    "Glisse chaque mot dans la bonne case.",
    ["Ressource", "Problème"],
    ["Eau", "Arbres", "Poissons", "Sol"],
    ["Sol épuisé", "Surpêche", "Pauvreté", "Manque d'eau"],
    SORT_HINTS,
    8,
  ),
];

export const makeCm2RscQcm: Make = (ctx) => ce2Question(ctx, "cm2-rsc-qcm", "les ressources naturelles, leur dégradation et les gestes qui les protègent", RSC_QCM, 3);
export const makeCm2RscTrou: Make = (ctx) => ce2Gap(ctx, "cm2-rsc-trou", "compléter une phrase sur la gestion des ressources", RSC_TROU, 2, 1);
export const makeCm2RscEcrire: Make = (ctx) => ce2Write(ctx, "cm2-rsc-ecrire", "écrire un fait sur la gestion des ressources", RSC_ECRIRE, 1, 2);
export const makeCm2RscOrdre: Make = (ctx) => ce2Order(ctx, "cm2-rsc-ordre", "ranger les étapes d'un geste qui protège une ressource", RSC_ORDRE);
export const makeCm2RscRelier: Make = (ctx) => ce2Link(ctx, "cm2-rsc-relier", "relier une ressource, un problème ou un geste à son effet", RSC_RELIER);
export const makeCm2RscGlisser: Make = (ctx) => ce2Sort(ctx, "cm2-rsc-glisser", "distinguer ce qui gaspille et ce qui protège une ressource", RSC_GLISSER, 2);

// ===========================================================================
// LA SANTÉ DE LA MÈRE ET DE L'ENFANT (sc-cm2-sante)
// ===========================================================================

const SAN_SOINS: Pool = {
  items: [
    {
      id: "cpn",
      q: ["Comment appelle-t-on la visite de santé d'une femme enceinte avant la naissance ?", "Quelle visite au centre de santé suit la grossesse ?", "Quel rendez-vous de santé aide la mère et son bébé avant la naissance ?"],
      a: "Consultation prénatale",
      also: ["Consultations prénatales", "Consultation prenatale", "La consultation prénatale"],
      ga: "la consultation prénatale",
      s: ["La visite de santé avant la naissance du bébé se nomme ___.", "Une femme enceinte va au centre de santé pour ___."],
      hint: "Elle a lieu pendant que le bébé grandit encore.",
    },
    {
      id: "vaccination",
      q: ["Comment appelle-t-on le geste qui protège l'enfant contre des maladies grâce à un vaccin ?", "Quel geste fait au centre de santé protège les enfants des maladies graves ?", "Que reçoit un bébé au centre de santé pour ne pas tomber gravement malade ?"],
      a: "Vaccination",
      also: ["La vaccination", "Vaccin"],
      ga: "la vaccination",
      s: ["Le geste qui protège l'enfant grâce à un vaccin se nomme ___.", "Un bébé qui reçoit son vaccin fait ___."],
      hint: "Une petite piqûre évite de grandes maladies.",
    },
    {
      id: "allaitement",
      q: ["Comment appelle-t-on le fait de nourrir un bébé avec le lait de sa mère ?", "Quel mot désigne le repas d'un bébé au sein de sa mère ?", "Comment s'appelle le fait de donner le lait de la mère au nourrisson ?"],
      a: "Allaitement",
      also: ["L'allaitement", "Allaitement maternel"],
      ga: "l'allaitement",
      s: ["Nourrir un bébé avec le lait de sa mère se nomme ___.", "Le lait de la mère donné au bébé s'appelle ___."],
      hint: "La mère nourrit son petit sans rien acheter.",
    },
  ],
};

const SAN_CARNET: Pool = {
  items: [
    {
      id: "carnet",
      q: ["Quel carnet garde la liste des vaccins reçus par un enfant ?", "Dans quel carnet note-t-on la santé et les vaccins d'un enfant ?"],
      a: "Carnet de santé",
      also: ["Le carnet de santé", "Carnet de vaccination"],
      ga: "le carnet de santé",
      s: ["Les vaccins d'un enfant sont notés dans ___.", "Pour suivre la santé d'un bébé, on remplit ___."],
      hint: "On le garde bien et on l'apporte à chaque visite.",
    },
  ],
  extras: ["Cahier de textes", "Carnet de notes"],
  gextras: ["le cahier de textes", "le carnet de notes"],
};

const SAN_LAIT: Pool = {
  items: [
    {
      id: "lait",
      q: ["Quel aliment suffit au bébé pendant ses premiers mois ?", "Quel est le meilleur aliment d'un nourrisson ?", "Que doit boire un tout petit bébé pour grandir en bonne santé ?"],
      a: "Lait maternel",
      also: ["Le lait maternel", "Lait de la mère", "Lait de sa mère"],
      ga: "le lait maternel",
      s: ["Pendant ses premiers mois, le bébé boit surtout ___.", "Un nourrisson grandit bien avec ___."],
      hint: "Il est produit par la maman et protège le bébé.",
    },
  ],
  extras: ["Eau sucrée", "Bouillie épaisse"],
  gextras: ["l'eau sucrée", "la bouillie épaisse"],
};

const SAN_FAMILLE: Pool = {
  items: [
    {
      id: "naissances",
      q: ["Que permet à la mère l'espacement des naissances ?", "Pourquoi est-il bon d'espacer les naissances pour la santé de la mère ?"],
      a: "Reprendre des forces",
      also: ["Se reposer", "Reprendre ses forces"],
      ga: "reprendre des forces",
      s: ["Des naissances espacées permettent à la mère de ___.", "Quand les naissances sont espacées, la mère peut ___."],
      hint: "Son corps a le temps de récupérer.",
    },
  ],
  extras: ["Travailler davantage", "Manger moins"],
  gextras: ["travailler davantage", "manger moins"],
};

const SAN_VIH: Pool = {
  items: [
    {
      id: "vih",
      q: ["Quel virus cause le sida ?", "Comment s'appelle le virus responsable du sida ?"],
      a: "VIH",
      also: ["Le VIH", "Vih"],
      not: ["Sida"],
      ga: "VIH",
      s: ["Le sida est causé par le virus ___.", "Le virus responsable du sida s'appelle ___."],
      hint: "Ce sont trois lettres que l'on voit sur les affiches de santé.",
    },
    {
      id: "sida",
      q: ["Quelle maladie est causée par le virus VIH ?", "Comment appelle-t-on la maladie due au virus VIH ?"],
      a: "Sida",
      also: ["Le sida", "SIDA"],
      not: ["VIH"],
      ga: "sida",
      s: ["La maladie due au VIH se nomme ___.", "Le virus VIH peut provoquer ___."],
      hint: "C'est une maladie grave que l'on peut prévenir.",
    },
  ],
  extras: ["Paludisme", "Rougeole"],
  gextras: ["paludisme", "rougeole"],
};

const SAN_MODE: Pool = {
  items: [
    {
      id: "sang",
      q: ["Par quoi le VIH peut-il passer d'une personne à une autre ?", "Par quel moyen le virus du sida peut-il se transmettre ?", "De quelle façon le VIH peut-il se transmettre ?"],
      a: "Par le sang",
      also: ["Le sang", "Sang"],
      ga: "par le sang",
      s: ["Le VIH peut passer d'une personne à une autre ___.", "Le virus du sida peut se transmettre ___."],
      hint: "Une plaie ou une aiguille en contact avec un autre corps.",
    },
  ],
  extras: ["Par une poignée de main", "En partageant un repas", "Par une piqûre de moustique"],
  gextras: ["par une poignée de main", "en partageant un repas", "par une piqûre de moustique"],
  onlyExtras: true,
};

const SAN_PREVENIR: Pool = {
  items: [
    {
      id: "prevenir",
      q: ["Que doit-on faire pour se protéger du VIH ?", "Quel geste protège du virus du sida ?", "Quelle règle simple évite de prendre le VIH ?"],
      a: "Ne pas partager d'aiguille ni de lame",
      noWrite: true,
      ga: "ne pas partager d'aiguille ni de lame",
      s: ["Pour se protéger du VIH, il faut ___.", "Pour éviter le VIH, on doit ___."],
      hint: "Ce qui pique ou coupe ne passe pas d'une personne à l'autre.",
    },
    {
      id: "traitement",
      q: ["Que doit faire une personne qui vit avec le VIH pour rester en bonne santé ?", "Comment une personne séropositive peut-elle vivre longtemps ?", "Quel geste aide une personne malade du sida à se soigner ?"],
      a: "Suivre son traitement au centre de santé",
      noWrite: true,
      ga: "suivre son traitement au centre de santé",
      s: ["Une personne qui vit avec le VIH doit ___.", "Pour rester en bonne santé, une personne séropositive doit ___."],
      hint: "Des médicaments pris chaque jour la protègent.",
    },
  ],
  extras: ["Éviter de serrer la main d'un malade", "Ne plus manger avec ses amis"],
  gextras: ["éviter de serrer la main d'un malade", "ne plus manger avec ses amis"],
  onlyExtras: true,
};

const SAN_OBJET: Pool = {
  items: [
    {
      id: "objet",
      q: ["Que ne faut-il jamais partager pour éviter le VIH ?", "Quel objet qui pique ou qui coupe ne se partage jamais ?"],
      a: "Une aiguille ou une lame",
      also: ["Aiguille ou lame", "Aiguille", "Lame", "Une aiguille", "Une lame"],
      ga: "une aiguille ou une lame",
      s: ["Pour éviter le VIH, on ne partage jamais ___.", "Pour se protéger du VIH, il ne faut jamais partager ___."],
      hint: "Ce qui pique ou coupe ne passe pas d'une personne à l'autre.",
    },
  ],
  extras: ["Un ballon de foot", "Un cahier d'école"],
  gextras: ["un ballon de foot", "un cahier d'école"],
  onlyExtras: true,
};

const SAN_POOLS = [SAN_SOINS, SAN_CARNET, SAN_LAIT, SAN_FAMILLE, SAN_VIH, SAN_MODE, SAN_PREVENIR, SAN_OBJET] as const;
const SAN_QCM = questionRows("sc-cm2-sante", SAN_POOLS);
const SAN_TROU = gapRows("sc-cm2-sante", SAN_POOLS);
const SAN_ECRIRE = writeRows("sc-cm2-sante", SAN_POOLS);

const SAN_ORDRE: readonly OrderRow[] = [
  order("Range ces moments de la vie d'un bébé, du premier au dernier.", ["Consultation prénatale", "Naissance", "Allaitement"], "san-ordre:bebe"),
  order("Range ces moments de la vie d'un bébé, du premier au dernier.", ["Consultation prénatale", "Naissance", "Premier vaccin"], "san-ordre:vaccin"),
  order("Range ces moments de la vie d'un enfant, du premier au dernier.", ["Naissance", "Premier anniversaire", "Entrée à l'école"], "san-ordre:enfant"),
  order("Range les gestes d'une visite de vaccination, du premier au dernier.", ["Aller au centre de santé", "Montrer le carnet", "Recevoir le vaccin", "Noter le vaccin dans le carnet"], "san-ordre:visite"),
  order("Range les gestes d'une consultation prénatale, du premier au dernier.", ["Arriver au centre de santé", "Se faire peser", "Parler avec la sage-femme", "Prendre le prochain rendez-vous"], "san-ordre:consultation"),
];

const SAN_RELIER: readonly LinkRow[] = [
  link("Relie chaque geste à son but.", [["Consultation prénatale", "Suivre la grossesse"], ["Vaccination", "Protéger l'enfant"], ["Allaitement", "Nourrir le bébé"]]),
  link("Relie chaque mot à son usage.", [["Carnet de santé", "Noter les vaccins"], ["Centre de santé", "Soigner et vacciner"], ["Lait maternel", "Nourrir et protéger"]]),
  link("Relie chaque mot à ce qu'il désigne.", [["VIH", "Virus"], ["Sida", "Maladie"], ["Vaccin", "Protection"]]),
  link("Relie chaque personne à son rôle.", [["Sage-femme", "Suit la grossesse"], ["Infirmier", "Vaccine l'enfant"], ["Mère", "Allaite son bébé"]]),
  link("Relie chaque personne à ce dont elle a besoin.", [["Femme enceinte", "Consultation prénatale"], ["Bébé", "Lait maternel"], ["Enfant", "Vaccins"]]),
];

const SAN_GLISSER = [
  ...sortRows(
    "Glisse chaque soin dans la bonne case.",
    ["Avant la naissance", "Après la naissance"],
    ["Consultation prénatale", "Suivi de la grossesse", "Visite chez la sage-femme"],
    ["Allaitement", "Vaccin du bébé", "Pesée du bébé"],
    SORT_HINTS,
    9,
  ),
  ...sortRows(
    "Glisse chaque situation dans la bonne case.",
    ["Peut transmettre le VIH", "Ne transmet pas le VIH"],
    ["Aiguille déjà utilisée", "Lame déjà utilisée", "Sang d'une personne infectée"],
    ["Poignée de main", "Repas partagé", "Câlin entre amis", "Piqûre de moustique"],
    SORT_HINTS,
    8,
  ),
];

export const makeCm2SanQcm: Make = (ctx) => ce2Question(ctx, "cm2-san-qcm", "la santé de la mère et de l'enfant et le VIH", SAN_QCM, 3);
export const makeCm2SanTrou: Make = (ctx) => ce2Gap(ctx, "cm2-san-trou", "compléter une phrase sur la santé de la mère et de l'enfant", SAN_TROU, 2, 1);
export const makeCm2SanEcrire: Make = (ctx) => ce2Write(ctx, "cm2-san-ecrire", "écrire un fait sur la santé de la mère et de l'enfant", SAN_ECRIRE, 1, 2);
export const makeCm2SanOrdre: Make = (ctx) => ce2Order(ctx, "cm2-san-ordre", "ranger les moments et les gestes de la santé de l'enfant", SAN_ORDRE);
export const makeCm2SanRelier: Make = (ctx) => ce2Link(ctx, "cm2-san-relier", "relier un soin, un mot ou une personne à son rôle", SAN_RELIER);
export const makeCm2SanGlisser: Make = (ctx) => ce2Sort(ctx, "cm2-san-glisser", "classer les soins et les gestes qui transmettent ou non le VIH", SAN_GLISSER, 2);
