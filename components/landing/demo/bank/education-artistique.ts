import { dragDrop, fillBlank, match, order, qcm, shortAnswer } from "../bank-helpers";
import type { SubjectBank } from "../demo-types";

/**
 * L'ÉDUCATION ARTISTIQUE, du CI au CM2 : un exercice par type et par classe,
 * dans une thématique du programme (`convex/programme/arts.ts`) qui n'est pas
 * « tout en jeux ». Pas de réponse à écrire au CI.
 *
 * Les jeux de la matière (couleurs, frises, dessin sur quadrillage, écoute)
 * sont fabriqués par le code, pas écrits ici : on ne demande donc jamais
 * d'écouter un son, de mélanger des couleurs ni de dessiner. Ces exercices
 * sont des questions de connaissance et de sensibilité (le matériel, les
 * instruments et la façon d'en jouer, les étapes d'une technique, ce que dit
 * le corps d'un personnage), posées avec du texte et des émojis. Ils ne citent
 * aucune parole de l'hymne et ne disent rien du Sénégal que le programme n'écrit.
 */
export const BANK: SubjectBank = {
  CI: [
    qcm({
      topic: "Frises et guirlandes",
      stage: 1,
      prompt: "Quel dessin continue la frise ? 🌳 🏠 🌳 🏠 🌳 ❓",
      options: ["🌳", "🐟", "🏠", "⭐"],
      answer: "🏠",
      explanation: "La frise répète l'arbre, puis la maison, puis l'arbre... Après un arbre, il faut une maison.",
      hints: [
        "Regarde bien la frise : quels dessins reviennent, et dans quel ordre ?",
        "Le dernier dessin est un arbre. Dans la frise, quel dessin vient toujours juste après un arbre ?",
      ],
    }),
    dragDrop({
      topic: "Mimes et émotions",
      stage: 2,
      prompt: "Glisse chaque visage dans la bonne case.",
      zones: ["Joie", "Tristesse", "Colère"],
      items: { Joie: ["😀", "😊"], Tristesse: ["😢", "😭"], Colère: ["😠", "😡"] },
      hints: [
        "Regarde la bouche, les yeux et les sourcils de chaque visage.",
        "Les larmes disent la tristesse. Les sourcils froncés disent la colère.",
      ],
    }),
    match({
      topic: "Les couleurs",
      stage: 1,
      prompt: "Relie chaque chose à sa couleur.",
      pairs: [
        ["🍌", "🟡 jaune"],
        ["🍅", "🔴 rouge"],
        ["🌳", "🟢 vert"],
        ["🥕", "🟠 orange"],
      ],
      hints: [
        "Regarde bien la couleur de chaque dessin.",
        "La carotte est de la même couleur que l'orange.",
      ],
    }),
    order({
      topic: "Les couleurs",
      stage: 3,
      prompt: "Mets les couleurs du drapeau du Sénégal dans l'ordre, de gauche à droite.",
      sequence: ["🟢 vert", "🟡 jaune", "🔴 rouge"],
      hints: [
        "Pense au drapeau dessiné dans ton livre ou au tableau.",
        "La bande du milieu a la couleur du soleil, avec une étoile verte.",
      ],
    }),
    fillBlank({
      topic: "Les formes",
      stage: 1,
      prompt: "Complète la phrase avec le bon mot.",
      text: "La roue du vélo 🚲 est ___.",
      blanks: [{ options: ["ronde", "carrée", "pointue"], answer: "ronde" }],
      hints: [
        "Fais le tour de la roue avec ton doigt.",
        "Une roue n'a aucun coin : c'est pour cela qu'elle roule si bien.",
      ],
    }),
  ],

  CP: [
    qcm({
      topic: "Mélanger les couleurs",
      stage: 2,
      prompt: "Quelles sont les trois couleurs primaires ?",
      options: ["vert, orange, violet", "rouge, jaune, bleu", "noir, blanc, gris", "rose, vert, marron"],
      answer: "rouge, jaune, bleu",
      explanation:
        "Le rouge, le jaune et le bleu sont les couleurs primaires : on ne peut pas les fabriquer en mélangeant d'autres couleurs.",
      hints: [
        "Les couleurs primaires sont les trois couleurs de départ du peintre : on ne les fabrique pas.",
        "Avec elles, on fabrique beaucoup d'autres couleurs, comme l'orange, le vert et le violet.",
      ],
    }),
    dragDrop({
      topic: "Les traits et les lignes",
      stage: 1,
      prompt: "La forme de chaque objet est-elle droite, courbe ou en zigzag ? Glisse-le dans la bonne case.",
      zones: ["Ligne droite", "Ligne courbe", "Zigzag"],
      items: {
        "Ligne droite": ["📏 règle", "🥖 pain"],
        "Ligne courbe": ["🌈 arc-en-ciel", "🍌 banane"],
        Zigzag: ["⚡ éclair"],
      },
      hints: [
        "Suis du doigt chaque objet, d'un bout à l'autre.",
        "Un trait droit ne tourne pas. Un zigzag change de direction par des pointes.",
      ],
    }),
    match({
      topic: "Décorer avec des motifs",
      stage: 2,
      prompt: "Pour décorer un objet, que prends-tu ? Relie chaque action à son matériel.",
      pairs: [
        ["Peindre", "🖌️ un pinceau"],
        ["Dessiner", "✏️ un crayon"],
        ["Modeler", "🏺 de l'argile"],
      ],
      hints: [
        "Pense à ce que tu tiens dans la main pour peindre, pour dessiner et pour modeler.",
        "Un potier fabrique ses pots avec une terre molle.",
      ],
    }),
    order({
      topic: "Comptines et rythmes",
      stage: 2,
      prompt: "Range ces façons d'utiliser ta voix, de la plus douce à la plus forte.",
      sequence: ["🤫 chuchoter", "💬 parler", "📢 crier"],
      hints: [
        "Pour chacune, demande-toi si ta voix fait un peu de bruit ou beaucoup de bruit.",
        "Pense à un secret dit à l'oreille, puis à un ami que tu appelles d'un bout à l'autre de la cour.",
      ],
    }),
    shortAnswer({
      topic: "Jouer un rôle",
      stage: 3,
      prompt: "Dans un jeu de rôles, tu lances un filet à la mer pour attraper des poissons 🐟. Quel métier joues-tu ?",
      accepted: [
        "pêcheur",
        "pecheur",
        "le pêcheur",
        "le pecheur",
        "un pêcheur",
        "un pecheur",
        "pêcheuse",
        "pecheuse",
        "la pêcheuse",
        "la pecheuse",
        "une pêcheuse",
        "une pecheuse",
      ],
      hints: [
        "Pense aux pirogues colorées qui partent en mer le matin, à Mbour ou à Saint-Louis.",
        "Le nom de ce métier est de la même famille que le mot « pêche ».",
      ],
    }),
    fillBlank({
      topic: "Comptines et rythmes",
      stage: 2,
      prompt: "Choisis la bonne réponse pour finir la phrase.",
      text: "Une berceuse se chante ___ pour endormir bébé.",
      blanks: [{ options: ["doucement", "très fort", "en criant"], answer: "doucement" }],
      hints: [
        "Une berceuse aide un bébé à s'endormir : pense à la voix de maman.",
        "Pour ne pas réveiller bébé, on fait le moins de bruit possible.",
      ],
    }),
  ],

  CE1: [
    qcm({
      topic: "Les instruments du Sénégal",
      stage: 2,
      prompt: "Parmi ces instruments du Sénégal, lequel le musicien serre-t-il sous son bras pour en jouer ?",
      options: ["Le balafon", "La kora", "La flûte", "Le tama"],
      answer: "Le tama",
      explanation: "Le tama est un petit tambour : le musicien le serre sous son bras pour en jouer.",
      hints: [
        "Pense à un instrument assez petit pour tenir sous le bras du musicien.",
        "C'est un tambour, donc il a une peau qu'on frappe. Le balafon, lui, a des lames de bois.",
      ],
    }),
    dragDrop({
      topic: "Mimer les sentiments",
      stage: 1,
      prompt:
        "Pour mimer un sentiment, on utilise son visage, ses mains et sa façon de marcher. Glisse chaque geste dans la bonne case.",
      zones: ["Le visage", "Les mains", "La marche"],
      items: {
        "Le visage": ["Froncer les sourcils", "Faire un grand sourire"],
        "Les mains": ["Serrer les poings", "Applaudir"],
        "La marche": ["Traîner les pieds", "Marcher à grands pas"],
      },
      hints: [
        "Demande-toi quelle partie du corps fait le geste : la tête, les bras ou les jambes ?",
        "Les pieds et les pas, c'est la marche. Les sourcils, c'est le visage.",
      ],
    }),
    match({
      topic: "Écouter et comparer les sons",
      stage: 1,
      prompt: "Ces mots décrivent des sons. Relie chaque mot à son contraire.",
      pairs: [
        ["Grave", "Aigu"],
        ["Fort", "Doux"],
        ["Long", "Court"],
      ],
      hints: [
        "Cherche, pour chaque mot, le mot qui veut dire tout le contraire.",
        "Un son qui dure longtemps est le contraire d'un son qui dure très peu.",
      ],
    }),
    order({
      topic: "Plier, découper, coller",
      stage: 3,
      prompt: "Tu veux découper un cœur symétrique, aux deux côtés pareils. Remets les étapes dans le bon ordre.",
      sequence: [
        "Je plie la feuille en deux",
        "Je dessine la moitié d'un cœur le long du pli",
        "Je découpe en suivant le trait",
        "Je déplie la feuille",
      ],
      hints: [
        "Pense à ce qu'on fait en premier pour que les deux côtés du cœur soient pareils.",
        "On déplie la feuille à la fin, pour découvrir le cœur entier.",
      ],
    }),
    shortAnswer({
      topic: "Les instruments du Sénégal",
      stage: 3,
      prompt: "Le riti est un instrument à une seule corde. Avec quel objet frotte-t-on sa corde pour la faire sonner ?",
      accepted: ["archet", "un archet", "l'archet", "l’archet", "avec un archet", "avec l'archet", "avec l’archet"],
      hints: [
        "On ne pince pas la corde du riti et on ne la frappe pas : on la frotte.",
        "L'objet qui frotte la corde a la forme d'un petit arc.",
      ],
    }),
    fillBlank({
      topic: "Dessiner et reproduire",
      stage: 2,
      prompt: "Complète les deux trous avec les bons mots.",
      text: "Je trace un trait droit avec la ___ et j'efface avec la ___.",
      blanks: [
        { options: ["règle", "gomme", "colle"], answer: "règle" },
        { options: ["gomme", "règle", "colle"], answer: "gomme" },
      ],
      hints: [
        "Pense à l'outil qui sert à tracer droit, et à celui qui fait disparaître un trait.",
        "Un des deux outils est plat et long ; l'autre est petit et frotte le papier.",
      ],
    }),
  ],

  CE2: [
    qcm({
      topic: "L'hymne national et les chants",
      stage: 1,
      prompt: "Pendant que l'on chante l'hymne national au lever des couleurs, comment doit-on se tenir ?",
      options: ["Debout et bien droit", "Assis par terre", "En marchant dans la cour", "En bavardant avec un ami"],
      answer: "Debout et bien droit",
      explanation: "L'hymne national se chante avec respect : on se tient debout et bien droit pendant le lever des couleurs.",
      hints: [
        "Pense au respect que l'on doit à l'hymne et au drapeau.",
        "On ne joue pas et on ne bavarde pas : on reste immobile, sur ses deux pieds.",
      ],
    }),
    dragDrop({
      topic: "Le coloriage magique",
      stage: 2,
      prompt: "Couleurs chaudes ou couleurs froides ? Glisse chaque couleur dans la bonne case.",
      zones: ["Couleurs chaudes", "Couleurs froides"],
      items: {
        "Couleurs chaudes": ["🔴 rouge", "🟠 orange", "🟡 jaune"],
        "Couleurs froides": ["🔵 bleu", "🟢 vert", "🟣 violet"],
      },
      hints: [
        "Les couleurs chaudes rappellent le feu et le soleil. Les couleurs froides rappellent l'eau et l'herbe fraîche.",
        "Pense à la flamme d'une bougie, puis à l'eau de la mer : quelles couleurs vois-tu dans chacune ?",
      ],
    }),
    match({
      topic: "Reproduire un modèle",
      stage: 3,
      prompt: "Associe chaque technique à ce qu'on fait avec elle.",
      pairs: [
        ["Le quadrillage", "Recopier carré par carré"],
        ["Le calque", "Suivre les traits sur un papier fin"],
        ["Le pochoir", "Peindre à travers une forme découpée"],
        ["Le collage", "Fixer des papiers avec de la colle"],
      ],
      hints: [
        "Cherche un indice dans le nom de la technique : le quadrillage est fait de carrés.",
        "Le calque est un papier fin à travers lequel on voit le modèle.",
      ],
    }),
    order({
      topic: "Jouer une scène",
      stage: 2,
      prompt: "Pour préparer une saynète, range les étapes dans le bon ordre.",
      sequence: [
        "On choisit l'histoire",
        "On distribue les rôles",
        "On répète la scène",
        "On joue devant le public",
      ],
      hints: [
        "Demande-toi ce qu'il faut avoir décidé avant de pouvoir répéter.",
        "Les comédiens s'entraînent plusieurs fois avant de montrer la scène aux spectateurs.",
      ],
    }),
    shortAnswer({
      topic: "L'hymne national et les chants",
      stage: 3,
      prompt: "Qui a écrit les paroles de l'hymne national « Le Lion rouge » ? Écris son nom de famille.",
      accepted: [
        "Senghor",
        "Léopold Sédar Senghor",
        "Leopold Sedar Senghor",
        "Léopold Sedar Senghor",
        "Leopold Sédar Senghor",
        "Sédar Senghor",
        "Sedar Senghor",
        "Léopold Senghor",
        "Leopold Senghor",
      ],
      hints: [
        "C'est un grand poète sénégalais, très célèbre dans toute l'Afrique.",
        "Son prénom est Léopold Sédar. Quel est son nom de famille ?",
      ],
    }),
    fillBlank({
      topic: "Les mélodies",
      stage: 2,
      prompt: "Complète la phrase sur les mélodies avec les mots qui conviennent.",
      text: "Quand une mélodie monte, les sons deviennent plus ___ ; quand elle descend, ils deviennent plus ___.",
      blanks: [
        { options: ["aigus", "graves", "longs"], answer: "aigus" },
        { options: ["graves", "aigus", "longs"], answer: "graves" },
      ],
      hints: [
        "Une mélodie qui monte va vers le haut, comme quand on grimpe un escalier.",
        "Pense à la voix d'un oiseau et à celle d'un lion : laquelle est haute, laquelle est basse ?",
      ],
    }),
  ],

  CM1: [
    qcm({
      topic: "Percussions et cordes",
      stage: 3,
      prompt: "Quel groupe ne contient que des instruments à cordes ?",
      options: ["djembé, sabar, tama", "kora, djembé, flûte", "kora, xalam, riti", "balafon, xalam, guitare"],
      answer: "kora, xalam, riti",
      explanation:
        "La kora, le xalam et le riti ont des cordes. Le djembé, le sabar et le tama sont des tambours, donc des percussions.",
      hints: [
        "Les instruments à cordes se pincent ou se frottent ; les percussions se frappent.",
        "Cherche l'intrus dans chaque groupe : un tambour, un tuyau ou des lames de bois ne sont pas des cordes.",
      ],
    }),
    dragDrop({
      topic: "Jouer la joie et la tristesse",
      stage: 2,
      prompt: "Pour jouer un personnage gai ou triste, que montre le comédien ? Classe chaque indice dans la bonne case.",
      zones: ["Personnage gai", "Personnage triste"],
      items: {
        "Personnage gai": ["Un grand sourire", "Des pas légers et sautillants", "Une voix claire et rapide"],
        "Personnage triste": ["Les épaules baissées", "Une voix lente et basse", "Des yeux qui regardent le sol"],
      },
      hints: [
        "Pense à la façon dont tu parles et tu marches quand tu es très content, puis quand tu as du chagrin.",
        "La joie donne de l'énergie au corps et à la voix. La tristesse les rend lents et lourds.",
      ],
    }),
    match({
      topic: "Frises et motifs",
      stage: 2,
      prompt: "Relie chaque verbe à ce que l'on fait d'un motif.",
      pairs: [
        ["Répéter", "Refaire le même motif"],
        ["Alterner", "Placer un motif, puis un autre"],
        ["Symétriser", "Retourner comme dans un miroir"],
      ],
      hints: [
        "Pense à un pagne ou à une poterie décorée : regarde comment les motifs se suivent.",
        "Le reflet d'un motif dans un miroir, c'est ce que fait « symétriser ».",
      ],
    }),
    order({
      topic: "Le dessin de mémoire",
      stage: 2,
      prompt: "Pour dessiner de mémoire, remets les étapes dans l'ordre.",
      sequence: [
        "Je regarde le modèle et je le retiens",
        "Je cache le modèle",
        "Je redessine ce dont je me souviens",
        "Je compare avec le modèle",
      ],
      hints: [
        "Pour dessiner de mémoire, le modèle ne doit plus être visible quand tu dessines.",
        "On vérifie son travail seulement quand le dessin est fini.",
      ],
    }),
    shortAnswer({
      topic: "Les rythmes",
      stage: 4,
      prompt:
        "Un coup long (TAM) dure 2 temps, un coup court (ti) dure 1 temps. On joue deux fois de suite TAM ti TAM ti ti. Combien de temps dure le tout ?",
      accepted: ["14"],
      hints: [
        "Calcule d'abord la durée du rythme joué une seule fois, coup après coup.",
        "Dans un seul passage, il y a 2 coups longs de 2 temps et 3 coups courts de 1 temps.",
      ],
    }),
    fillBlank({
      topic: "Percussions et cordes",
      stage: 2,
      prompt: "Complète la phrase avec les deux bons mots.",
      text: "On ___ la peau d'un tambour comme le djembé, mais on ___ les cordes d'une kora.",
      blanks: [
        { options: ["frappe", "pince", "souffle"], answer: "frappe" },
        { options: ["pince", "frappe", "souffle"], answer: "pince" },
      ],
      hints: [
        "Pense à la façon de jouer d'un tambour, puis à celle de jouer d'un instrument à cordes.",
        "Un tambour sonne quand on tape sur sa peau. Les cordes d'une kora se jouent avec les doigts, d'une autre façon.",
      ],
    }),
  ],

  CM2: [
    qcm({
      topic: "Observer et illustrer",
      stage: 3,
      prompt:
        "Texte : « À l'aube, le pêcheur rentre à Saint-Louis dans sa pirogue pleine de poissons. » Quelle illustration convient le mieux ?",
      options: [
        "Un pêcheur dans sa pirogue vide, au lever du soleil",
        "Un pêcheur dans sa pirogue chargée de poissons, au lever du soleil",
        "Un pêcheur dans sa pirogue chargée de poissons, en pleine nuit",
        "Une pirogue chargée de poissons, sans pêcheur, au lever du soleil",
      ],
      answer: "Un pêcheur dans sa pirogue chargée de poissons, au lever du soleil",
      explanation:
        "L'illustration doit montrer ce que dit le texte : le pêcheur, sa pirogue pleine de poissons et le moment de la journée, l'aube.",
      hints: [
        "Relève dans le texte ce qu'il faut montrer : qui, où, quand, et ce que contient la pirogue.",
        "À l'aube, le soleil se lève. Et la pirogue est pleine de poissons : elle n'est pas vide.",
      ],
    }),
    dragDrop({
      topic: "Chanter et accompagner",
      stage: 3,
      prompt: "Rythme ou mélodie ? Range chaque élément dans la bonne case.",
      zones: ["Le rythme", "La mélodie"],
      items: {
        "Le rythme": ["Les coups frappés dans les mains", "Les battements du tambour", "Les coups longs et courts"],
        "La mélodie": ["L'air qu'on fredonne", "Les notes graves et aiguës", "Les sons qui montent et descendent"],
      },
      hints: [
        "Le rythme, c'est la durée des sons et leur retour régulier ; la mélodie, c'est la hauteur des sons qui change.",
        "Pour chaque étiquette, demande-toi : parle-t-on du temps et des durées, ou de la hauteur des sons ?",
      ],
    }),
    match({
      topic: "La mise en scène",
      stage: 2,
      prompt: "Fais correspondre chaque mot du théâtre à son rôle dans le spectacle.",
      pairs: [
        ["Le décor", "Ce qui montre le lieu de l'histoire"],
        ["Le costume", "Ce que le comédien porte pour jouer"],
        ["Le comédien", "La personne qui joue sur scène"],
        ["La mise en scène", "La façon d'organiser le spectacle"],
      ],
      hints: [
        "Lis chaque phrase en pensant à une pièce de théâtre jouée à l'école.",
        "Un décor, c'est un peu comme une grande image placée derrière les acteurs.",
      ],
    }),
    order({
      topic: "Rosaces et symétries",
      stage: 3,
      prompt: "Pour tracer une rosace à six pétales au compas, remets les étapes dans l'ordre.",
      sequence: [
        "Je trace un cercle au compas",
        "Sans changer l'écartement, je pique sur le cercle et je trace un arc",
        "Je pique au bout de cet arc et je recommence, tout autour",
        "Je colorie les six pétales de la rosace",
      ],
      hints: [
        "Chaque étape a besoin de ce que l'étape d'avant a tracé.",
        "On colorie à la fin, quand tous les arcs sont tracés.",
      ],
    }),
    shortAnswer({
      topic: "Rosaces et symétries",
      stage: 4,
      prompt: "Un carreau carré de couleur unie décore un mur. Combien d'axes de symétrie possède-t-il ?",
      accepted: ["4"],
      hints: [
        "Un axe de symétrie est une ligne de pliage : les deux moitiés du carreau se superposent exactement.",
        "Plie mentalement le carré : d'un côté au côté opposé, puis d'un coin au coin opposé. Compte tous les pliages différents.",
      ],
    }),
    fillBlank({
      topic: "Les instruments à vent",
      stage: 2,
      prompt: "Choisis les deux mots qui manquent dans la phrase.",
      text: "On joue de la flûte peule en ___ ; le ___ est lui aussi un instrument à vent.",
      blanks: [
        { options: ["soufflant", "frappant", "pinçant"], answer: "soufflant" },
        { options: ["clairon", "balafon", "xalam"], answer: "clairon" },
      ],
      hints: [
        "Pense à ce que fait la bouche du flûtiste pendant qu'il joue.",
        "Un instrument à vent sonne grâce à l'air qu'on y envoie : il n'a ni cordes ni lames de bois.",
      ],
    }),
  ],
};
