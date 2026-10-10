import { dragDrop, fillBlank, match, order, qcm, shortAnswer } from "../bank-helpers";
import type { SubjectBank } from "../demo-types";

/**
 * LE FRANÇAIS, du CI au CM2 : un exercice par type et par classe, à la
 * difficulté et dans la thématique que le programme (`convex/programme`)
 * donne à la classe. Pas de réponse à écrire au CI : l'enfant ne sait pas
 * encore se servir d'un clavier.
 *
 * Au CI et au CP, l'enfant apprend à lire : la consigne lui est dite à voix
 * haute, et les propositions sont des lettres, des syllabes, des mots très
 * courts ou des émojis, jamais des phrases. Les textes et les vers sont écrits
 * pour l'exercice : aucun n'est la citation d'un auteur.
 *
 * Une phrase à trous sert à la conjugaison, aux accords et aux homophones ; une
 * réponse courte, à l'orthographe d'UN mot ou d'une forme verbale.
 */
export const BANK: SubjectBank = {
  CI: [
    qcm({
      topic: "Bonjour, merci, s'il te plaît",
      stage: 1,
      prompt: "Mame donne un cadeau à Fatou. Que dit Fatou ?",
      options: ["Au revoir 👋", "J'ai soif 💧", "Merci 😊", "Bonjour 🌞"],
      answer: "Merci 😊",
      explanation: "On dit « merci » pour remercier quelqu'un qui nous donne un cadeau.",
      hints: [
        "Pense à ce que tu dis quand quelqu'un te donne quelque chose.",
        "C'est un petit mot gentil : tu le dis aussi quand on t'aide ou quand on te sert à manger.",
      ],
    }),
    dragDrop({
      topic: "Les sons a, i, o, l, t",
      stage: 2,
      prompt: "Dis le nom de chaque dessin. Glisse-le sous la lettre du premier son que tu entends.",
      zones: ["a", "t"],
      items: { a: ["🍍", "✈️"], t: ["🍅", "🐢", "🚕"] },
      hints: [
        "Dis le nom du dessin tout doucement et écoute bien le premier son.",
        "Si le premier son est « a », pose le dessin sous a. Si c'est « t », pose-le sous t.",
      ],
    }),
    match({
      topic: "Les lettres et les mots",
      stage: 1,
      prompt: "Relie chaque grande lettre à sa petite lettre.",
      pairs: [
        ["A", "a"],
        ["M", "m"],
        ["T", "t"],
        ["P", "p"],
      ],
      hints: [
        "Regarde bien la forme de chaque grande lettre.",
        "Cherche la petite lettre qui est la sœur de la grande, comme S et s.",
      ],
    }),
    order({
      topic: "Les sons n, e, p, d, m, b",
      stage: 3,
      prompt: "Remets les syllabes dans l'ordre pour écrire « tomate » 🍅.",
      sequence: ["to", "ma", "te"],
      hints: [
        "Lis chaque syllabe, puis cherche celle qu'on entend au début du mot.",
        "La première syllabe se dit « to », comme à la fin du mot « moto ».",
      ],
    }),
    fillBlank({
      topic: "Mes premières phrases",
      stage: 3,
      prompt: "Choisis le petit mot qui va dans chaque phrase.",
      text: "Penda a ___ robe 👗. Modou a ___ ballon ⚽.",
      blanks: [
        { options: ["un", "une"], answer: "une" },
        { options: ["un", "une"], answer: "un" },
      ],
      hints: [
        "Lis chaque phrase en entier, tout doucement.",
        "Dis chaque petit mot devant le nom et écoute : « un » ou « une » sonne juste ?",
      ],
    }),
  ],

  CP: [
    qcm({
      topic: "Raconter une histoire",
      stage: 2,
      prompt: "À la récréation, Fatou saute à la corde. Modou joue au ballon. Qui joue au ballon ?",
      options: ["Modou", "Fatou", "Aminata", "Le maître"],
      answer: "Modou",
      explanation: "Dans le texte, Modou joue au ballon et Fatou saute à la corde.",
      hints: [
        "Lis le texte phrase par phrase et repère le mot « ballon ».",
        "Le nom de l'enfant qui joue au ballon est écrit au début de la phrase qui parle du ballon.",
      ],
    }),
    dragDrop({
      topic: "Inviter et conseiller",
      stage: 2,
      prompt: "Est-ce une invitation ou un conseil ? Glisse chaque phrase dans la bonne case.",
      zones: ["Invitation", "Conseil"],
      items: {
        Invitation: ["Viens jouer !", "Viens danser !", "Je t'invite !"],
        Conseil: ["Fais attention !", "Sois prudent !"],
      },
      hints: [
        "Une invitation te propose de venir faire quelque chose avec quelqu'un.",
        "Un conseil t'aide à bien faire, pour ta sécurité ou ta santé.",
      ],
    }),
    match({
      topic: "Décrire et comparer",
      stage: 1,
      prompt: "Relie chaque mot à son contraire.",
      pairs: [
        ["grand", "petit"],
        ["chaud", "froid"],
        ["lourd", "léger"],
        ["plein", "vide"],
      ],
      hints: [
        "Un contraire dit tout l'inverse : « jour » et « nuit » sont des contraires.",
        "Touche un mot de la colonne de gauche, puis le mot de droite qui dit tout l'inverse.",
      ],
    }),
    order({
      topic: "J'écris des phrases",
      stage: 3,
      prompt: "Remets les mots dans l'ordre pour écrire une phrase.",
      sequence: ["Awa", "porte", "un", "joli", "boubou."],
      hints: [
        "Une phrase commence par une majuscule et finit par un point.",
        "Commence par celui qui fait l'action. Le mot qui porte le point termine la phrase.",
      ],
    }),
    shortAnswer({
      topic: "Je lis des syllabes et des mots",
      stage: 3,
      prompt: "Assemble les syllabes dans le bon ordre et écris le mot : mi - te - mar.",
      accepted: ["marmite", "une marmite", "la marmite"],
      hints: [
        "Dis chaque syllabe, puis essaie de les assembler dans un autre ordre.",
        "C'est un récipient de cuisine dans lequel on fait cuire le riz.",
      ],
    }),
    fillBlank({
      topic: "Les consignes",
      stage: 2,
      prompt: "Complète la consigne avec le bon verbe.",
      text: "___ la forme avec les ciseaux.",
      blanks: [{ options: ["Découpe", "Colorie", "Relie"], answer: "Découpe" }],
      hints: [
        "Lis toute la consigne : que fait-on avec des ciseaux ?",
        "Les ciseaux servent à couper : lis chaque verbe et cherche celui qui parle de couper.",
      ],
    }),
  ],

  CE1: [
    qcm({
      topic: "Lire et comprendre",
      stage: 1,
      prompt:
        "Lis le texte et trouve avec qui Fatou va au puits : « Fatou se lève tôt. Elle va au puits avec sa grande sœur. Elles rapportent deux seaux d'eau. »",
      options: ["Avec son frère", "Avec sa maman", "Toute seule", "Avec sa grande sœur"],
      answer: "Avec sa grande sœur",
      explanation: "Le texte dit : « Elle va au puits avec sa grande sœur. »",
      hints: [
        "Relis le texte et trouve la phrase qui parle du puits.",
        "La personne qui accompagne Fatou est citée dans cette phrase, juste après le mot « avec ».",
      ],
    }),
    dragDrop({
      topic: "Le nom, l'article et l'adjectif",
      stage: 2,
      prompt: "Masculin ou féminin ? Glisse chaque nom dans la bonne case.",
      zones: ["Masculin", "Féminin"],
      items: {
        Masculin: ["arbre", "cahier", "marché"],
        Féminin: ["mangue", "ardoise", "école"],
      },
      hints: [
        "Un nom masculin va avec « un » ou « le » ; un nom féminin va avec « une » ou « la ».",
        "Essaie devant chaque nom : on dit « un sac » mais « une table ».",
      ],
    }),
    match({
      topic: "Le présent et le passé composé",
      stage: 2,
      prompt: "Associe chaque verbe conjugué au présent au même verbe au passé composé.",
      pairs: [
        ["Je mange", "J'ai mangé"],
        ["Tu joues", "Tu as joué"],
        ["Il danse", "Il a dansé"],
        ["Nous chantons", "Nous avons chanté"],
      ],
      hints: [
        "Au passé composé, on met « avoir » au présent, puis le verbe qui finit par -é.",
        "Cherche le même verbe dans les deux colonnes : manger, jouer, danser ou chanter.",
      ],
    }),
    order({
      topic: "Le dictionnaire et les mots de liaison",
      stage: 3,
      prompt: "Range ces mots dans l'ordre alphabétique, comme dans un dictionnaire.",
      sequence: ["banane", "bissap", "mangue", "mil"],
      hints: [
        "Compare d'abord la première lettre de chaque mot.",
        "Quand deux mots commencent par la même lettre, regarde leur deuxième lettre.",
      ],
    }),
    shortAnswer({
      topic: "L'impératif et le futur",
      stage: 3,
      prompt: "Complète avec le verbe au futur simple : Demain, nous ___ (jouer) au ballon.",
      accepted: ["jouerons", "nous jouerons"],
      hints: [
        "Au futur simple, on garde tout l'infinitif du verbe, puis on ajoute la terminaison.",
        "La terminaison qui va avec « nous » est -ons.",
      ],
    }),
    fillBlank({
      topic: "a/à, et/est, on/ont",
      stage: 2,
      prompt: "Complète la phrase avec les bons mots.",
      text: "Mes amis ___ un ballon ___ ils jouent dans la cour.",
      blanks: [
        { options: ["on", "ont"], answer: "ont" },
        { options: ["et", "est"], answer: "et" },
      ],
      hints: [
        "Pour « on » ou « ont », essaie de dire « avaient » à la place : si la phrase reste juste, c'est « ont ».",
        "Pour « et » ou « est », essaie de dire « était » à la place : si la phrase reste juste, c'est « est ».",
      ],
    }),
  ],

  CE2: [
    qcm({
      topic: "COD, COI et pronoms",
      stage: 2,
      prompt: "Quel pronom peut remplacer le COD dans cette phrase : « Modou mange la mangue. »",
      options: ["lui", "la", "le", "leur"],
      answer: "la",
      explanation: "« La mangue » est un COD féminin singulier : on la remplace par « la » et on dit « Modou la mange ».",
      hints: [
        "Pose la question « Modou mange quoi ? » : la réponse est le COD.",
        "Le pronom doit être féminin et singulier, comme le nom « mangue ».",
      ],
    }),
    dragDrop({
      topic: "Les compléments circonstanciels",
      stage: 2,
      prompt: "Lieu, temps ou manière ? Glisse chaque complément dans la bonne case.",
      zones: ["Lieu", "Temps", "Manière"],
      items: {
        Lieu: ["à Thiès", "dans la cour"],
        Temps: ["hier soir", "le matin"],
        Manière: ["doucement", "avec joie"],
      },
      hints: [
        "Pour chaque groupe de mots, pose la bonne question : où ? quand ? comment ?",
        "Exemple : dans « Il court vite à Dakar le lundi », « vite » dit comment, « à Dakar » dit où et « le lundi » dit quand.",
      ],
    }),
    match({
      topic: "Synonymes, familles, homonymes",
      stage: 3,
      prompt: "Relie chaque mot à son sens. Attention, plusieurs de ces mots se prononcent de la même façon !",
      pairs: [
        ["mer", "Une grande étendue d'eau salée"],
        ["mère", "La maman d'un enfant"],
        ["maire", "La personne qui dirige la commune"],
        ["verre", "On boit de l'eau dedans"],
        ["vert", "La couleur de l'herbe"],
      ],
      hints: [
        "Ici, des mots qui se prononcent de la même façon s'écrivent autrement : seul leur sens aide à les reconnaître.",
        "Cherche un mot de la même famille : « verdure », par exemple, va avec l'un de ces mots.",
      ],
    }),
    order({
      topic: "Lire une lettre, une affiche, un poème",
      stage: 2,
      prompt: "Remets les parties de cette lettre dans l'ordre, de haut en bas.",
      sequence: [
        "Thiès, le 12 mars",
        "Cher Ibrahima,",
        "Merci pour ton beau cadeau.",
        "Je t'embrasse très fort.",
        "Aminata",
      ],
      hints: [
        "Pense à une lettre que tu as déjà vue : que lit-on tout en haut, et tout en bas ?",
        "Le message est au milieu : on salue avant de l'écrire, et on termine par une formule gentille.",
      ],
    }),
    shortAnswer({
      topic: "Féminin, pluriel, ou/où, son/sont",
      stage: 3,
      prompt: "Écris le féminin du nom : un boulanger, une ___.",
      accepted: ["boulangère", "une boulangère"],
      hints: [
        "Regarde la fin du mot « boulanger » : c'est elle que le féminin change.",
        "Comme dans « un boucher, une bouchère » : n'oublie pas l'accent grave sur le e.",
      ],
    }),
    fillBlank({
      topic: "L'imparfait et le passé composé",
      stage: 4,
      prompt: "Imparfait ou passé composé ? Choisis la bonne forme du verbe pour chaque trou.",
      text: "D'habitude, Modou ___ à pied à l'école, mais ce matin il ___ le bus.",
      blanks: [
        { options: ["allait", "est allé"], answer: "allait" },
        { options: ["prenait", "a pris"], answer: "a pris" },
      ],
      hints: [
        "Cherche dans la phrase les mots qui disent quand : « d'habitude » et « ce matin ».",
        "Une habitude du passé se dit à l'imparfait ; une action qui a eu lieu une seule fois se dit au passé composé.",
      ],
    }),
  ],

  CM1: [
    qcm({
      topic: "Nature et fonction des mots",
      stage: 3,
      prompt: "Dans la phrase « Le thé est chaud », quelle est la fonction du mot « chaud » ?",
      options: ["sujet", "COD", "attribut du sujet", "complément circonstanciel"],
      answer: "attribut du sujet",
      explanation:
        "Le verbe « être » relie « chaud » au sujet « le thé » : « chaud » dit comment est le thé, c'est l'attribut du sujet.",
      hints: [
        "Repère le verbe de la phrase : c'est un verbe d'état, comme « être » ou « paraître ».",
        "Le mot « chaud » dit comment est le thé : il décrit le sujet.",
      ],
    }),
    dragDrop({
      topic: "Les temps de l'indicatif",
      stage: 2,
      prompt: "Présent, imparfait ou futur simple ? Glisse chaque verbe dans la bonne case.",
      zones: ["Présent", "Imparfait", "Futur simple"],
      items: {
        Présent: ["tu pars", "nous finissons"],
        Imparfait: ["je prenais", "il allait"],
        "Futur simple": ["elle viendra", "vous ferez"],
      },
      hints: [
        "Les terminaisons -ais, -ait, -ions, -iez et -aient annoncent l'imparfait.",
        "Au futur simple, on entend un « r » avant la terminaison : -rai, -ras, -ra, -rons, -rez, -ront.",
      ],
    }),
    match({
      topic: "Préfixes, suffixes et sens des mots",
      stage: 2,
      prompt: "Associe chaque mot à son sens. Regarde bien le début et la fin du mot.",
      pairs: [
        ["relire", "Lire de nouveau"],
        ["inconnu", "Qu'on ne connaît pas"],
        ["joueur", "Celui qui joue"],
        ["lavage", "L'action de laver"],
      ],
      hints: [
        "Cherche le petit morceau ajouté au début (préfixe) ou à la fin (suffixe) du mot.",
        "Le suffixe -eur désigne celui qui fait l'action ; le préfixe re- veut dire « de nouveau ».",
      ],
    }),
    order({
      topic: "Comprendre un récit et une description",
      stage: 2,
      prompt: "Remets les phrases de ce récit dans l'ordre des événements.",
      sequence: [
        "Au lever du jour, Modou pousse sa pirogue dans les vagues.",
        "Arrivé au large, il jette ses filets à la mer.",
        "Quand il les remonte, ils débordent de poissons.",
        "Il rentre alors au village, sa pirogue bien chargée.",
        "Le soir, toute la famille mange le poisson grillé.",
      ],
      hints: [
        "Les pronoms « il », « les » et « ils » remplacent des mots déjà écrits : la phrase où ces mots apparaissent vient avant.",
        "Pour remonter ses filets, Modou doit d'abord les avoir jetés : cherche ce qui doit arriver avant.",
      ],
    }),
    shortAnswer({
      topic: "Les accords",
      stage: 3,
      prompt: "Complète avec le verbe au présent : Les enfants de ma voisine ___ (jouer) dans la cour.",
      accepted: ["jouent"],
      hints: [
        "Pour accorder le verbe, cherche son sujet : qui fait l'action de jouer ?",
        "Le mot « voisine » est tout près du verbe, mais est-ce lui qui fait l'action ?",
      ],
    }),
    fillBlank({
      topic: "Les homophones grammaticaux",
      stage: 4,
      prompt: "Choisis le bon mot pour chaque trou.",
      text: "Les élèves ___ lavent les mains et rangent ___ cahiers.",
      blanks: [
        { options: ["ce", "se"], answer: "se" },
        { options: ["leur", "leurs"], answer: "leurs" },
      ],
      hints: [
        "« Se » accompagne un verbe (se laver) ; « ce » accompagne un nom (ce cahier).",
        "Un possessif s'accorde avec le nom qui le suit : un seul objet ou plusieurs ?",
      ],
    }),
  ],

  CM2: [
    qcm({
      topic: "Donner son avis",
      stage: 2,
      prompt: "Quelle phrase donne une opinion et non un fait ?",
      options: [
        "Le football est le plus beau des sports.",
        "Dakar est la capitale du Sénégal.",
        "La mer est salée.",
        "Un triangle a trois côtés.",
      ],
      answer: "Le football est le plus beau des sports.",
      explanation:
        "« Le plus beau » est un jugement personnel, alors que les autres phrases disent des faits que l'on peut vérifier.",
      hints: [
        "Un fait peut se vérifier. Une opinion dit ce que pense ou ce que préfère une personne.",
        "Une opinion contient souvent un mot de jugement : « meilleur », « délicieux » ou « nul ».",
      ],
    }),
    dragDrop({
      topic: "La poésie",
      stage: 3,
      prompt:
        "Ces vers sont écrits pour l'exercice. Contiennent-ils une comparaison ? Glisse chaque vers dans la bonne case.",
      zones: ["Comparaison", "Pas de comparaison"],
      items: {
        Comparaison: [
          "Le soleil est rond comme une calebasse.",
          "La nuit est noire comme du charbon.",
          "Pareille à une reine, la lune éclaire le village.",
        ],
        "Pas de comparaison": [
          "Le soleil se lève sur Dakar.",
          "Les enfants chantent sous le baobab.",
          "Comme il pleut, les pêcheurs rentrent au port.",
        ],
      },
      hints: [
        "Une comparaison rapproche deux choses avec un mot comme « comme », « pareil à » ou « semblable à ».",
        "Attention : le mot « comme » ne compare pas toujours. Demande-toi si deux choses différentes sont rapprochées.",
      ],
    }),
    match({
      topic: "Le dialogue",
      stage: 2,
      prompt: "Associe chaque verbe de parole à son sens.",
      pairs: [
        ["demander", "Poser une question"],
        ["répondre", "Donner une réponse"],
        ["s'écrier", "Dire très fort sous l'émotion"],
        ["murmurer", "Parler très bas"],
      ],
      hints: [
        "Un verbe de parole dit comment on parle ou ce que l'on fait en parlant.",
        "Commence par les verbes que tu connais le mieux, puis termine par élimination.",
      ],
    }),
    order({
      topic: "Lire pour s'informer et comprendre",
      stage: 3,
      prompt: "Remets dans l'ordre les phrases qui expliquent comment se forme la pluie.",
      sequence: [
        "Le soleil chauffe l'eau de la mer.",
        "L'eau se transforme en vapeur et monte dans le ciel.",
        "En haut, la vapeur se refroidit et forme des nuages.",
        "Dans les nuages, des gouttes grossissent et tombent : c'est la pluie.",
      ],
      hints: [
        "Cherche la cause : qu'est-ce qui se passe en premier et qui fait arriver tout le reste ?",
        "Chaque phrase est la suite de la précédente : cherche ce qui doit arriver avant ce qui suit.",
      ],
    }),
    shortAnswer({
      topic: "Révisions du CFEE",
      stage: 4,
      prompt: "Complète avec le participe passé bien accordé : Les mangues que Fatou a ___ (acheter) sont mûres.",
      accepted: ["achetées"],
      hints: [
        "Avec l'auxiliaire avoir, le participe passé s'accorde avec le COD s'il est placé avant le verbe.",
        "Ici, le COD est « que », qui remplace « les mangues » : cherche son genre et son nombre.",
      ],
    }),
    fillBlank({
      topic: "Conditionnel et subjonctif",
      stage: 3,
      prompt: "Choisis la forme du verbe qui convient pour chaque trou.",
      text: "Il faut que tu ___ tes devoirs pour que ton père ___ content.",
      blanks: [
        { options: ["finis", "finisses", "finiras", "finirais"], answer: "finisses" },
        { options: ["est", "sera", "serait", "soit"], answer: "soit" },
      ],
      hints: [
        "Après « il faut que » et « pour que », le verbe se met au subjonctif présent.",
        "Au subjonctif, les terminaisons sont -e, -es, -e, -ions, -iez, -ent ; « être » est irrégulier : « que je sois ».",
      ],
    }),
  ],
};
