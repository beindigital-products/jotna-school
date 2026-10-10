import { dragDrop, fillBlank, match, order, qcm, shortAnswer } from "../bank-helpers";
import type { SubjectBank } from "../demo-types";

/**
 * LA GÉOGRAPHIE, du CI au CM2 : un exercice par type et par classe, dans une
 * thématique du programme (`convex/programme`) et au niveau de la classe.
 *
 * Le Sénégal de l'enfant d'abord : se repérer (droite et gauche, devant et
 * derrière, quadrillage, itinéraire, plan), puis les points cardinaux, le
 * climat, le relief, les régions, les activités, le découpage administratif,
 * les ressources, la population et les villes.
 *
 * Aucune image, aucune carte à regarder : tout se répond avec des mots, des
 * émojis, des flèches ou de petits plans décrits en texte. Un chiffre n'est
 * écrit que s'il vient du programme ou d'un fait sûr. Le dessin sur
 * quadrillage du CI est un jeu fabriqué par le code, pas écrit ici ; pas de
 * réponse à écrire au CI.
 */
export const BANK: SubjectBank = {
  CI: [
    qcm({
      topic: "Ma droite et ma gauche",
      stage: 2,
      prompt: "Tu marches tout droit ⬆️. Tu tournes à droite. Quelle flèche montre où tu vas ?",
      options: ["⬅️", "➡️", "⬆️", "⬇️"],
      answer: "➡️",
      explanation: "Tourner à droite, c'est aller du côté de ta main droite : ici, c'est la flèche ➡️.",
      hints: [
        "Lève ta main droite : c'est de ce côté-là que tu tournes.",
        "Ne choisis ni la flèche qui continue tout droit, ni celle qui revient en arrière.",
      ],
    }),
    dragDrop({
      topic: "Les repères de mon école",
      stage: 1,
      prompt: "Fixe ou mobile ? Glisse chaque repère de l'école dans la bonne case.",
      zones: ["Repère fixe", "Repère mobile"],
      items: {
        "Repère fixe": ["🌳 baobab", "🕌 mosquée", "🚪 portail"],
        "Repère mobile": ["🚗 voiture", "🚌 car", "🚲 vélo"],
      },
      hints: [
        "Un repère fixe reste toujours au même endroit. Un repère mobile peut partir.",
        "Demande-toi : demain, ce repère sera-t-il encore là, au même endroit ?",
      ],
    }),
    match({
      topic: "Se repérer sur un quadrillage",
      stage: 2,
      prompt: "Un pion se déplace sur le quadrillage. Relie chaque mot à sa flèche.",
      pairs: [
        ["À gauche", "⬅️"],
        ["En haut", "⬆️"],
        ["À droite", "➡️"],
        ["En bas", "⬇️"],
      ],
      hints: [
        "Regarde la pointe de chaque flèche : elle montre où le pion va.",
        "Le haut est vers le ciel, le bas vers le sol. Pour gauche et droite, pense à tes deux mains.",
      ],
    }),
    order({
      topic: "Devant, derrière, à côté",
      stage: 3,
      prompt: "Aïssatou est devant Modou. Fatou est derrière Modou. Mets-les dans la file, du premier au dernier.",
      sequence: ["Aïssatou", "Modou", "Fatou"],
      hints: [
        "Le premier de la file est celui qui n'a personne devant lui.",
        "Place d'abord Modou. Celui qui est devant lui va avant, celui qui est derrière lui va après.",
      ],
    }),
    fillBlank({
      topic: "Se repérer sur un quadrillage",
      stage: 3,
      prompt: "Choisis le bon mot pour finir la phrase.",
      text: "Dans un quadrillage, les cases rangées de haut en bas forment une ___.",
      blanks: [{ options: ["colonne", "ligne"], answer: "colonne" }],
      hints: [
        "Pense à un poteau ou à un tronc d'arbre : il est debout, de haut en bas.",
        "Les cases rangées de gauche à droite forment une ligne. Et celles rangées de haut en bas ?",
      ],
    }),
  ],

  CP: [
    qcm({
      topic: "Se repérer dans le quartier",
      stage: 1,
      prompt: "Pour retrouver ton chemin dans le quartier, quel repère ne bouge jamais ?",
      options: ["🕌 la mosquée", "🚗 une voiture", "🐑 un mouton", "🚲 un vélo"],
      answer: "🕌 la mosquée",
      explanation:
        "La mosquée reste toujours au même endroit : c'est un repère fixe. Une voiture, un mouton ou un vélo peuvent s'en aller.",
      hints: [
        "Un bon repère reste au même endroit, aujourd'hui comme demain.",
        "Pour chaque choix, demande-toi : peut-il rouler ou marcher jusqu'à un autre endroit ?",
      ],
    }),
    dragDrop({
      topic: "Près ou loin ?",
      stage: 1,
      prompt: "Avec ta main ou avec tes pas ? Glisse chaque chose à mesurer dans la bonne case.",
      zones: ["Avec l'empan", "Avec des pas"],
      items: {
        "Avec l'empan": ["✏️ un crayon", "📓 un cahier", "une ardoise"],
        "Avec des pas": ["la cour", "⚽ le terrain", "la classe"],
      },
      hints: [
        "L'empan, c'est la longueur de ta main bien ouverte, du pouce au petit doigt.",
        "Les petites choses se mesurent avec la main. Pour une grande distance, on avance en comptant ses pas.",
      ],
    }),
    match({
      topic: "Vu de dessus",
      stage: 2,
      prompt: "Regarde chaque objet de dessus. Relie-le à la forme que tu vois.",
      pairs: [
        ["Un seau", "🔴 un rond"],
        ["Un dé", "🟥 un carré"],
        ["Une ardoise", "un rectangle"],
      ],
      hints: [
        "Imagine que tu es un oiseau : tu regardes l'objet d'en haut, pas de côté.",
        "Regarde les coins et les côtés : le rond n'a pas de coin, le carré a 4 côtés égaux, le rectangle 2 grands côtés et 2 petits.",
      ],
    }),
    order({
      topic: "Le chemin de l'école",
      stage: 1,
      prompt: "Modou raconte son trajet de la maison à l'école. Remets ses étapes dans l'ordre.",
      sequence: ["Je sors", "Je marche", "J'arrive à l'école", "J'entre en classe"],
      hints: [
        "Pense à ton propre trajet du matin : par quoi commences-tu ?",
        "On ne peut pas entrer en classe avant d'être arrivé à l'école.",
      ],
    }),
    shortAnswer({
      topic: "Près ou loin ?",
      stage: 3,
      prompt: "Fatou compte 8 pas jusqu'à la boutique, puis 6 jusqu'à la mosquée, puis 5 jusqu'à l'école. Combien de pas en tout ?",
      accepted: ["19"],
      hints: [
        "Fatou fait trois parties de chemin : additionne-les, une par une.",
        "Commence par 8 + 6, puis ajoute les pas qui restent.",
      ],
    }),
    fillBlank({
      topic: "Se repérer dans le quartier",
      stage: 2,
      prompt: "Complète la phrase avec le bon mot.",
      text: "Le puits est derrière le baobab. Donc le baobab est ___ le puits.",
      blanks: [{ options: ["devant", "derrière", "dans"], answer: "devant" }],
      hints: [
        "Si le puits est derrière le baobab, tu vois d'abord le baobab, puis le puits.",
        "Pense à une file : si Awa est derrière Modou, où est Modou par rapport à Awa ?",
      ],
    }),
  ],

  CE1: [
    qcm({
      topic: "Les points cardinaux",
      stage: 2,
      prompt: "Le matin, Modou regarde le soleil qui se lève. Quel point cardinal est derrière lui ?",
      options: ["le nord", "le sud", "l'ouest", "l'est"],
      answer: "l'ouest",
      explanation:
        "Le soleil se lève à l'est. Quand on regarde l'est, on tourne le dos à l'ouest, là où le soleil se couche.",
      hints: [
        "Le soleil se lève d'un côté du ciel et se couche du côté opposé.",
        "Modou regarde le côté où le soleil se lève. Derrière lui, c'est le côté tout à fait opposé.",
      ],
    }),
    dragDrop({
      topic: "Le climat et les saisons",
      stage: 2,
      prompt: "Saison sèche ou saison des pluies ? Glisse chaque mot dans la bonne case.",
      zones: ["Saison sèche", "Saison des pluies"],
      items: {
        "Saison sèche": ["janvier", "mars", "avril"],
        "Saison des pluies": ["août", "septembre", "les orages"],
      },
      hints: [
        "Pense à l'hivernage, la saison des pluies : en quels mois les champs sont-ils verts et les mares pleines ?",
        "L'hivernage dure à peu près de juillet à octobre. Le reste de l'année, c'est la saison sèche.",
      ],
    }),
    match({
      topic: "Le relief et les cours d'eau",
      stage: 2,
      prompt: "Associe chaque mot à ce qu'il veut dire.",
      pairs: [
        ["Un fleuve", "Un cours d'eau qui va à la mer"],
        ["Un lac", "De l'eau entourée de terre"],
        ["Un puits", "Un trou pour trouver de l'eau"],
        ["Une colline", "Une petite hauteur arrondie"],
      ],
      hints: [
        "Lis chaque phrase en pensant à un endroit que tu connais : le fleuve Sénégal, le lac de Guiers, le puits du village.",
        "Commence par le plus facile : où va l'eau d'un fleuve ? Que creuse-t-on pour atteindre l'eau sous la terre ?",
      ],
    }),
    order({
      topic: "Les points cardinaux",
      stage: 3,
      prompt:
        "Sur une boussole, pars du nord et tourne dans le sens des aiguilles d'une montre. Range les points cardinaux dans l'ordre.",
      sequence: ["Nord", "Est", "Sud", "Ouest"],
      hints: [
        "Sur le dessin d'une boussole, le nord est en haut. Les aiguilles d'une montre tournent vers la droite, puis vers le bas.",
        "Après le nord, le deuxième point est celui où le soleil se lève.",
      ],
    }),
    shortAnswer({
      topic: "Le plan de la classe et de l'école",
      stage: 2,
      prompt:
        "Sur ce plan de la classe, 🔷 est une table, 🔴 une chaise et 🔶 une armoire. Combien de tables y a-t-il dans la rangée 🔷 🔴 🔷 🔶 🔴 🔷 ?",
      accepted: ["3"],
      hints: [
        "Relis ce que veut dire chaque signe : c'est la légende du plan.",
        "Compte seulement les signes bleus, un par un, sans compter les autres.",
      ],
    }),
    fillBlank({
      topic: "Le climat et les saisons",
      stage: 1,
      prompt: "Complète la phrase avec le nom de ce vent.",
      text: "En saison sèche, un vent chaud et sec souffle sur le Sénégal : c'est l'___.",
      blanks: [{ options: ["harmattan", "hivernage", "orage"], answer: "harmattan" }],
      hints: [
        "Ce vent apporte un air chaud et sec, pas de la pluie.",
        "Ce vent vient du Sahara, surtout de décembre à mars : il dessèche la peau et apporte de la poussière.",
      ],
    }),
  ],

  CE2: [
    qcm({
      topic: "Ma région et les régions du Sénégal",
      stage: 2,
      prompt: "Laquelle de ces villes porte aussi le nom d'une des 14 régions du Sénégal ?",
      options: ["Mbour", "Touba", "Rufisque", "Kédougou"],
      answer: "Kédougou",
      explanation:
        "Kédougou est une région du Sénégal, et son chef-lieu porte le même nom. Mbour, Touba et Rufisque sont des villes, pas des régions.",
      hints: [
        "Une région et son chef-lieu portent le même nom. Pense aux régions que tu connais : Dakar, Thiès, Louga…",
        "Rufisque, par exemple, se trouve dans la région de Dakar : ce n'est pas un nom de région. Vérifie ainsi chaque ville.",
      ],
    }),
    dragDrop({
      topic: "Les activités des hommes",
      stage: 1,
      prompt: "À quelle activité appartient chaque mot ? Glisse-le dans la bonne case.",
      zones: ["Agriculture", "Élevage", "Pêche"],
      items: {
        Agriculture: ["l'arachide", "le riz"],
        "Élevage": ["les moutons", "les chèvres"],
        "Pêche": ["les pirogues", "les poissons"],
      },
      hints: [
        "L'agriculture cultive la terre, l'élevage s'occupe des animaux, la pêche se fait sur l'eau.",
        "Les pirogues partent de Kayar, de Joal et de Mbour. Les moutons, eux, vivent sur la terre ferme.",
      ],
    }),
    match({
      topic: "Ma région et les régions du Sénégal",
      stage: 3,
      prompt: "Associe chaque ville à la région où elle se trouve.",
      pairs: [
        ["Mbour", "Thiès"],
        ["Touba", "Diourbel"],
        ["Richard-Toll", "Saint-Louis"],
        ["Bignona", "Ziguinchor"],
      ],
      hints: [
        "Chaque région porte le nom de son chef-lieu, mais ce n'est pas toujours sa plus grande ville. Demande-toi dans quelle région se trouve chaque ville.",
        "Bignona se trouve en Casamance, dans le sud du pays. Richard-Toll est tout au nord, au bord du fleuve Sénégal.",
      ],
    }),
    order({
      topic: "Lire une carte",
      stage: 3,
      prompt: "Sur une carte du Sénégal, le nord est en haut. Range ces villes de la plus au nord à la plus au sud.",
      sequence: ["Saint-Louis", "Dakar", "Kaolack", "Ziguinchor"],
      hints: [
        "Sur une carte, la ville qui est le plus haut est la plus au nord.",
        "Pense au grand fleuve du nord et à la Casamance tout au sud : cela te donne la première et la dernière ville.",
      ],
    }),
    shortAnswer({
      topic: "Lire une carte",
      stage: 2,
      prompt:
        "Sur une carte, 1 cm représente 10 km dans la réalité. Deux villes y sont à 4 cm l'une de l'autre. Quelle est leur distance réelle, en km ?",
      accepted: ["40"],
      hints: [
        "Relis l'échelle de la carte : combien de kilomètres représente 1 cm ?",
        "Il y a 4 cm entre les deux villes : calcule 4 fois 10 km.",
      ],
    }),
    fillBlank({
      topic: "L'habitat et les déplacements",
      stage: 2,
      prompt: "Choisis le mot qui complète bien la phrase.",
      text: "Quand des familles quittent la campagne pour aller vivre en ville, on parle d'___ rural.",
      blanks: [{ options: ["exode", "élevage", "hivernage"], answer: "exode" }],
      hints: [
        "Le mot cherché dit qu'un grand nombre de personnes partent d'un endroit pour aller vivre ailleurs.",
        "Ce mot veut dire « grand départ » : chaque année, des jeunes quittent ainsi leur village pour aller vivre à Dakar.",
      ],
    }),
  ],

  CM1: [
    qcm({
      topic: "Climats et végétation",
      stage: 3,
      prompt: "Pourquoi trouve-t-on la forêt surtout au sud du Sénégal ?",
      options: [
        "Le désert y est plus proche",
        "Il y pleut davantage qu'au nord",
        "Il y a plus de villes et d'usines",
        "Le vent chaud et sec y souffle toute l'année",
      ],
      answer: "Il y pleut davantage qu'au nord",
      explanation:
        "Les pluies sont plus abondantes au sud : c'est le climat guinéen, où la forêt peut pousser. Au nord, il pleut peu et la steppe domine.",
      hints: [
        "Pour pousser, les arbres ont besoin d'eau. Où y en a-t-il le plus ?",
        "Le climat change du nord au sud : sahélien, soudanien, puis guinéen. Pense à la quantité de pluie dans chacun.",
      ],
    }),
    dragDrop({
      topic: "Les voies de communication",
      stage: 1,
      prompt: "Voyager ou communiquer à distance ? Glisse chaque mot dans la bonne case.",
      zones: ["Voyager", "Communiquer"],
      items: {
        Voyager: ["le TER", "l'autoroute", "l'aéroport"],
        Communiquer: ["la radio", "la télévision", "Internet"],
      },
      hints: [
        "Certaines voies servent à déplacer des personnes ; d'autres moyens servent à envoyer des nouvelles et des messages.",
        "Pour écouter la radio, tu n'as pas besoin de te déplacer : elle apporte les nouvelles jusqu'à toi.",
      ],
    }),
    match({
      topic: "Le découpage administratif",
      stage: 2,
      prompt: "Associe chaque responsable au territoire qu'il dirige.",
      pairs: [
        ["Le gouverneur", "La région"],
        ["Le préfet", "Le département"],
        ["Le sous-préfet", "L'arrondissement"],
        ["Le maire", "La commune"],
      ],
      hints: [
        "Le découpage va du plus grand au plus petit : région, département, arrondissement, commune.",
        "« Sous-préfet » veut dire « en dessous du préfet » : son territoire est plus petit que celui du préfet.",
      ],
    }),
    order({
      topic: "Ressources et activités économiques",
      stage: 3,
      prompt: "Remets dans l'ordre le chemin de l'arachide, du champ jusqu'au marché.",
      sequence: [
        "On sème l'arachide dans les champs",
        "On récolte l'arachide",
        "On fait sécher l'arachide au soleil",
        "Une huilerie presse les graines pour en faire de l'huile",
        "On vend l'huile au marché",
      ],
      hints: [
        "Une plante doit être semée et avoir poussé avant qu'on puisse la récolter.",
        "L'huile doit être fabriquée avant d'être vendue : la vente est la dernière étape.",
      ],
    }),
    shortAnswer({
      topic: "Le Sénégal en Afrique de l'Ouest",
      stage: 4,
      prompt: "Combien de pays ont une frontière terrestre avec le Sénégal, la Gambie comprise ?",
      accepted: ["5"],
      hints: [
        "Fais le tour du Sénégal : un voisin au nord, un à l'est, puis ceux du sud.",
        "Tu as la Mauritanie au nord et le Mali à l'est. À toi de trouver les autres voisins, sans oublier la Gambie.",
      ],
    }),
    fillBlank({
      topic: "Le Sénégal en Afrique de l'Ouest",
      stage: 2,
      prompt: "Complète la phrase pour situer le Sénégal.",
      text: "Le Sénégal est situé à l'___ de l'Afrique, au bord de l'océan ___.",
      blanks: [
        { options: ["ouest", "est"], answer: "ouest" },
        { options: ["Atlantique", "Indien", "Pacifique"], answer: "Atlantique" },
      ],
      hints: [
        "Le Sénégal est du côté de l'Afrique où le soleil se couche.",
        "Cet océan baigne toute la côte du Sénégal, de Saint-Louis à la Casamance, et sépare l'Afrique de l'Amérique.",
      ],
    }),
  ],

  CM2: [
    qcm({
      topic: "Villes et campagnes",
      stage: 3,
      prompt: "Avec l'exode rural, beaucoup de familles arrivent à Dakar. Quelle en est une conséquence pour la ville ?",
      options: [
        "La ville perd des habitants",
        "Les campagnes se remplissent",
        "Des quartiers poussent vite, souvent sans plan ni égouts",
        "Il y a moins de voitures en ville",
      ],
      answer: "Des quartiers poussent vite, souvent sans plan ni égouts",
      explanation:
        "Les familles qui arrivent doivent se loger : en banlieue, des quartiers se construisent vite, souvent sans plan et sans égouts.",
      hints: [
        "Les familles qui arrivent en ville doivent trouver où habiter. Où s'installent-elles ?",
        "Pense à la banlieue de Dakar, comme Pikine ou Keur Massar : comment a-t-elle grandi si vite ?",
      ],
    }),
    dragDrop({
      topic: "Protéger nos ressources",
      stage: 2,
      prompt: "Qu'est-ce qui détruit nos ressources, qu'est-ce qui les protège ? Glisse chaque mot dans la bonne case.",
      zones: ["Ce qui détruit", "Ce qui protège"],
      items: {
        "Ce qui détruit": ["la déforestation", "les feux de brousse", "la surpêche"],
        "Ce qui protège": ["le reboisement", "la Grande Muraille verte", "les aires marines protégées"],
      },
      hints: [
        "Une menace abîme la nature ; une solution la répare ou la protège.",
        "Reboiser, c'est replanter des arbres : cela protège. Brûler la brousse la détruit.",
      ],
    }),
    match({
      topic: "Le milieu et les activités",
      stage: 3,
      prompt: "Associe chaque milieu à sa principale richesse.",
      pairs: [
        ["La vallée du fleuve Sénégal", "Le riz"],
        ["Le bassin arachidier", "L'arachide"],
        ["La côte", "La pêche"],
        ["Le Ferlo", "L'élevage"],
      ],
      hints: [
        "Chaque milieu offre ses richesses : de l'eau, des terres fertiles, la mer, de grandes plaines sèches.",
        "Le riz pousse les pieds dans l'eau, les troupeaux ont besoin de grands pâturages, et la mer est pleine de poissons.",
      ],
    }),
    order({
      topic: "Protéger nos ressources",
      stage: 4,
      prompt: "Remets dans l'ordre les étapes qui mènent de la déforestation à l'avancée du désert.",
      sequence: [
        "On coupe trop d'arbres",
        "Le sol n'est plus protégé",
        "La pluie et le vent emportent la terre",
        "Il ne reste qu'une terre pauvre où rien ne pousse",
        "Le désert avance",
      ],
      hints: [
        "Commence par la cause, ce que font les hommes. Les conséquences viennent ensuite, l'une après l'autre.",
        "Les racines des arbres retiennent la terre : sans arbres, la pluie et le vent l'emportent.",
      ],
    }),
    shortAnswer({
      topic: "La population du Sénégal",
      stage: 2,
      prompt: "Selon le recensement de 2023, à peu près combien de millions d'habitants le Sénégal compte-t-il ?",
      accepted: ["18", "18000000"],
      hints: [
        "C'est un nombre de millions entre 10 et 20 : le Sénégal a moins de 20 millions d'habitants.",
        "Il est compris entre 15 et 20 millions.",
      ],
    }),
    fillBlank({
      topic: "La population du Sénégal",
      stage: 3,
      prompt: "Complète ces deux phrases sur les habitants du Sénégal.",
      text: "La pyramide des âges est large à la base : la population est ___. Elle est très dense à ___ et sur la côte.",
      blanks: [
        { options: ["jeune", "âgée"], answer: "jeune" },
        { options: ["Dakar", "Kédougou", "Tambacounda"], answer: "Dakar" },
      ],
      hints: [
        "La base de la pyramide montre les plus jeunes. Si elle est large, ils sont très nombreux.",
        "La densité est forte là où beaucoup de gens vivent sur peu d'espace : pense à la plus petite région du pays, qui est aussi la plus peuplée.",
      ],
    }),
  ],
};
