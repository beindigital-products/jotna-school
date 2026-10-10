import { dragDrop, fillBlank, match, order, qcm, shortAnswer } from "../bank-helpers";
import type { SubjectBank } from "../demo-types";

/**
 * L'HISTOIRE, du CI au CM2 : un exercice par type et par classe, dans une
 * thématique du programme (`convex/programme/histoire.ts`) et au niveau de la
 * classe. Pas de réponse à écrire au CI : l'enfant n'écrit pas encore au
 * clavier.
 *
 * L'histoire commence par le TEMPS (le matin et le soir, hier et demain, les
 * jours, les mois, la famille, l'école), puis les royaumes du Sénégal, la
 * préhistoire, les premiers contacts, les résistants, les grands empires, la
 * colonisation et l'indépendance.
 *
 * L'exactitude avant tout : chaque nom, chaque titre et chaque date vient du
 * programme de la classe. Au CE2, le programme ne cite « aucun autre roi ni
 * aucune date » : aucun exercice de CE2 n'en écrit.
 */
export const BANK: SubjectBank = {
  CI: [
    qcm({
      topic: "Hier, aujourd'hui, demain",
      stage: 2,
      prompt: "Aujourd'hui, c'est mardi. Quel jour était hier ?",
      options: ["Mercredi", "Lundi", "Jeudi", "Samedi"],
      answer: "Lundi",
      explanation: "Hier, c'est le jour d'avant. Le jour d'avant mardi, c'est lundi.",
      hints: [
        "Hier, c'est le jour qui vient juste avant aujourd'hui.",
        "Récite les jours dans l'ordre : quel jour dis-tu juste avant mardi ?",
      ],
    }),
    dragDrop({
      topic: "Le matin, le midi, le soir",
      stage: 1,
      prompt: "Que fait-on le matin ? Que fait-on le soir ? Glisse chaque image.",
      zones: ["Le matin", "Le soir"],
      items: {
        "Le matin": ["⏰ Se lever", "🍞 Petit-déjeuner"],
        "Le soir": ["🍲 Dîner", "🌙 Se coucher"],
      },
      hints: [
        "Le matin, la journée commence. Le soir, elle se termine.",
        "Après le coucher du soleil, on dîne, puis on va au lit.",
      ],
    }),
    match({
      topic: "Les jours de la semaine",
      stage: 2,
      prompt: "Relie chaque jour au jour d'après.",
      pairs: [
        ["Après lundi", "Mardi"],
        ["Après mercredi", "Jeudi"],
        ["Après vendredi", "Samedi"],
        ["Après samedi", "Dimanche"],
      ],
      hints: [
        "Les jours se suivent toujours dans le même ordre, toute la semaine.",
        "Chante la chanson des jours de la semaine dans ta tête, puis arrête-toi sur chaque jour pour trouver le suivant.",
      ],
    }),
    order({
      topic: "Avant, pendant, après",
      stage: 3,
      prompt: "Remets les moments du matin dans l'ordre.",
      sequence: ["🛏️ Se réveiller", "🚿 Se laver", "👕 S'habiller", "🎒 Partir"],
      hints: [
        "Pense à ta propre matinée : par quoi commences-tu quand tu ouvres les yeux ?",
        "Le premier moment se passe encore dans le lit ; le dernier, quand on sort de la maison.",
      ],
    }),
    fillBlank({
      topic: "Le matin, le midi, le soir",
      stage: 1,
      prompt: "Quel mot va à la fin de la phrase ?",
      text: "Le soleil se couche : c'est le ___.",
      blanks: [{ options: ["soir", "matin", "midi"], answer: "soir" }],
      hints: [
        "Pense au moment de la journée où le ciel devient sombre.",
        "Quand le soleil se couche, la journée est presque finie : on va bientôt dîner.",
      ],
    }),
  ],

  CP: [
    qcm({
      topic: "C'est long, c'est court",
      stage: 1,
      prompt: "Qu'est-ce qui dure le plus longtemps ?",
      options: ["Une récréation", "Une journée", "Une semaine", "Une année"],
      answer: "Une année",
      explanation: "Une année dure douze mois : c'est plus long qu'une semaine, qu'une journée ou qu'une récréation.",
      hints: [
        "Compare : combien de temps dure chaque chose ?",
        "Cherche celle qui contient toutes les autres : les semaines, les jours, les récréations.",
      ],
    }),
    dragDrop({
      topic: "Souvent, parfois, jamais",
      stage: 2,
      prompt: "Chaque jour ou chaque année ? Glisse chaque image dans la bonne case.",
      zones: ["Chaque jour", "Chaque année"],
      items: {
        "Chaque jour": ["🌅 Se lever", "🍽️ Manger"],
        "Chaque année": ["🎂 Anniversaire", "🐑 Tabaski", "🎄 Noël"],
      },
      hints: [
        "Certaines choses reviennent tous les jours, d'autres une seule fois dans l'année.",
        "Compte combien de fois chaque chose revient pendant une année entière.",
      ],
    }),
    match({
      topic: "Le calendrier",
      stage: 3,
      prompt: "Relie chaque rang à son mois.",
      pairs: [
        ["Le 1er mois", "Janvier"],
        ["Le 4e mois", "Avril"],
        ["Le 7e mois", "Juillet"],
        ["Le 12e mois", "Décembre"],
      ],
      hints: [
        "Récite les mois de l'année dans l'ordre, en comptant sur tes doigts.",
        "Un mois ouvre l'année et un autre la ferme : ce sont les deux bouts du calendrier.",
      ],
    }),
    order({
      topic: "L'emploi du temps",
      stage: 2,
      prompt: "Voici l'emploi du temps de la classe. Range-le du début à la fin de la matinée.",
      sequence: ["8 h Lecture", "10 h Récréation", "11 h Calcul", "12 h Sortie"],
      hints: [
        "Regarde l'heure écrite devant chaque activité.",
        "La plus petite heure vient en premier, la plus grande en dernier.",
      ],
    }),
    shortAnswer({
      topic: "Le calendrier",
      stage: 2,
      prompt: "Quel mois vient juste après mai ? Écris-le.",
      accepted: ["juin"],
      hints: [
        "Récite les mois dans l'ordre : mars, avril, mai…",
        "Ce mois commence par la lettre j.",
      ],
    }),
    fillBlank({
      topic: "Souvent, parfois, jamais",
      stage: 1,
      prompt: "Choisis le bon mot pour finir la phrase.",
      text: "Au Sénégal, il ne neige ___.",
      blanks: [{ options: ["jamais", "souvent", "toujours"], answer: "jamais" }],
      hints: [
        "Pense à ce que tu vois dans le ciel au Sénégal : as-tu déjà vu de la neige ?",
        "Un seul de ces mots veut dire « pas une seule fois ».",
      ],
    }),
  ],

  CE1: [
    qcm({
      topic: "Le temps qui passe",
      stage: 1,
      prompt: "Sur une ligne du temps, quel moment est le plus ancien ?",
      options: ["Ma naissance", "L'année dernière", "Hier", "Ce matin"],
      answer: "Ma naissance",
      explanation: "Ma naissance est le moment le plus ancien de ma vie : tous les autres sont arrivés après.",
      hints: [
        "Sur une ligne du temps, le plus ancien est tout à gauche et le plus récent tout à droite.",
        "Cherche ce qui est arrivé en premier dans ta vie.",
      ],
    }),
    dragDrop({
      topic: "L'histoire de ma famille",
      stage: 2,
      prompt: "Dans quelle génération de la famille se trouve chaque personne ? Glisse-la dans la bonne case.",
      zones: ["La génération de mes grands-parents", "La génération de mes parents", "Ma génération"],
      items: {
        "La génération de mes grands-parents": ["Mon grand-père", "Ma grand-mère"],
        "La génération de mes parents": ["Mon oncle", "Ma tante"],
        "Ma génération": ["Mon cousin", "Ma sœur"],
      },
      hints: [
        "Dans l'arbre de la famille, chaque génération est un étage : les grands-parents en haut, puis les parents, puis les enfants.",
        "Un oncle est le frère de ton papa ou de ta maman ; un cousin est l'enfant d'un oncle ou d'une tante.",
      ],
    }),
    match({
      topic: "L'histoire de mon école",
      stage: 3,
      prompt: "Comment retrouver l'histoire d'une école ? Associe chaque source à ce qu'elle apporte.",
      pairs: [
        ["Les photos anciennes", "Montrent l'école d'autrefois"],
        ["Le registre", "Garde les noms des élèves"],
        ["Les anciens élèves", "Racontent leurs souvenirs"],
      ],
      hints: [
        "Une photo se regarde, un registre se lit et un ancien élève se rencontre.",
        "Les anciens élèves peuvent parler : ils ont vécu à l'école avant toi.",
      ],
    }),
    order({
      topic: "L'histoire de ma famille",
      stage: 2,
      prompt: "Range ces personnes de la plus âgée à la plus jeune.",
      sequence: ["Ma grand-mère", "Ma maman", "Moi", "Mon petit frère"],
      hints: [
        "Pense à qui est né en premier, puis à qui est né ensuite.",
        "Ta grand-mère est la maman de ta maman : elle est née avant elle.",
      ],
    }),
    shortAnswer({
      topic: "Mon quartier, mon village, ma commune",
      stage: 1,
      prompt: "Comment s'appelle le bâtiment où travaille le maire ? Écris un mot.",
      accepted: ["mairie", "la mairie", "une mairie"],
      hints: [
        "Le maire dirige la commune : il travaille dans un bâtiment spécial.",
        "Le nom de ce bâtiment commence par « mai ».",
      ],
    }),
    fillBlank({
      topic: "L'histoire de mon école",
      stage: 1,
      prompt: "Quel mot manque dans cette phrase ?",
      text: "Pour savoir ce qui a changé dans l'école depuis sa construction, on peut interroger les anciens ___.",
      blanks: [{ options: ["élèves", "ballons", "tableaux"], answer: "élèves" }],
      hints: [
        "Qui était déjà à l'école il y a longtemps et peut raconter ses souvenirs ?",
        "Ce sont des personnes qui sont allées à l'école, comme toi aujourd'hui, mais bien avant toi.",
      ],
    }),
  ],

  CE2: [
    qcm({
      topic: "Les royaumes du Sénégal (1)",
      stage: 2,
      prompt: "Lequel de ces royaumes était un royaume wolof ?",
      options: ["Le Sine", "Le Gabou", "Le Cayor", "Le Fouta"],
      answer: "Le Cayor",
      explanation: "Le Cayor est l'un des royaumes wolofs, comme le Djolof, le Baol et le Walo.",
      hints: [
        "Les Wolofs avaient plusieurs royaumes : le Djolof, le Baol, le Walo et un quatrième.",
        "Le Sine était un royaume sérère et le Fouta se trouvait dans la vallée du fleuve Sénégal.",
      ],
    }),
    dragDrop({
      topic: "Hier et aujourd'hui : le progrès",
      stage: 1,
      prompt: "À quoi sert chaque chose ? Glisse-la dans la bonne case.",
      zones: ["Se déplacer", "S'éclairer", "Communiquer"],
      items: {
        "Se déplacer": ["La charrette", "Le train"],
        "S'éclairer": ["La lampe à pétrole", "L'ampoule électrique"],
        Communiquer: ["La lettre", "Le téléphone portable"],
      },
      hints: [
        "Pour chaque chose, demande-toi : sert-elle à voyager, à voir clair ou à donner des nouvelles ?",
        "La lumière aide à voir quand il fait nuit ; la lettre et le téléphone transmettent un message.",
      ],
    }),
    match({
      topic: "Les rois et leurs titres",
      stage: 3,
      prompt: "Associe chaque royaume au titre de son roi.",
      pairs: [
        ["Le Djolof", "Le Bourba"],
        ["Le Cayor", "Le Damel"],
        ["Le Baol", "Le Teigne"],
        ["Le Walo", "Le Brak"],
        ["Le Sine", "Le Bour"],
      ],
      hints: [
        "Chaque royaume a son propre mot pour dire « roi ».",
        "Le roi du Cayor s'appelle le Damel ; celui du Walo, le Brak.",
      ],
    }),
    order({
      topic: "Hier et aujourd'hui : le progrès",
      stage: 2,
      prompt: "Range ces moyens de communiquer du plus ancien au plus récent.",
      sequence: ["La lettre", "Le téléphone fixe", "Le téléphone portable"],
      hints: [
        "Le plus ancien existe depuis très longtemps ; le plus récent tient dans la poche.",
        "Le téléphone portable est plus récent que le téléphone fixe de la maison.",
      ],
    }),
    shortAnswer({
      topic: "Les royaumes du Sénégal (1)",
      stage: 3,
      prompt: "Selon la tradition, qui a fondé le royaume du Djolof ? Écris son nom de famille.",
      accepted: ["Ndiaye", "N'Diaye", "N’Diaye", "Ndiadiane Ndiaye", "Ndiadiane N'Diaye", "Ndiadiane N’Diaye"],
      hints: [
        "Ce fondateur porte un nom de famille très répandu au Sénégal.",
        "Son prénom est Ndiadiane.",
      ],
    }),
    fillBlank({
      topic: "Les royaumes du Sénégal (2)",
      stage: 3,
      prompt: "Complète la phrase avec les bons mots.",
      text: "Le Sine et le Saloum étaient des royaumes ___, et le Fouta se trouvait dans la vallée du fleuve ___.",
      blanks: [
        { options: ["sérères", "wolofs", "peuls"], answer: "sérères" },
        { options: ["Sénégal", "Gambie", "Saloum"], answer: "Sénégal" },
      ],
      hints: [
        "Le Cayor, le Baol et le Walo étaient des royaumes wolofs ; le Sine et le Saloum, non.",
        "Le fleuve de la vallée du Fouta coule au nord du pays, le long de la frontière avec la Mauritanie.",
      ],
    }),
  ],

  CM1: [
    qcm({
      topic: "La préhistoire",
      stage: 1,
      prompt: "Quelle découverte a permis aux premiers hommes de se chauffer et de cuire leurs aliments ?",
      options: ["La roue", "Le feu", "L'écriture", "Le fer"],
      answer: "Le feu",
      explanation:
        "Grâce au feu, les premiers hommes se sont chauffés, ont éloigné les animaux et ont cuit leurs aliments.",
      hints: [
        "Pense à ce qu'on allume pour cuisiner et pour se réchauffer.",
        "Cette découverte donne de la lumière et de la chaleur, et fait de la fumée.",
      ],
    }),
    dragDrop({
      topic: "Résister sans les armes",
      stage: 2,
      prompt: "Ces personnages ont résisté à la colonisation. Comment ? Glisse chaque nom dans la bonne case.",
      zones: ["Avec les armes", "Sans les armes"],
      items: {
        "Avec les armes": ["Lat Dior Diop", "Maba Diakhou Bâ", "Alboury Ndiaye"],
        "Sans les armes": ["Cheikh Ahmadou Bamba", "Aline Sitoé Diatta"],
      },
      hints: [
        "Certains ont mené la guerre contre l'armée coloniale ; d'autres ont refusé l'ordre colonial sans se battre.",
        "Lat Dior Diop, roi du Cayor, a combattu avec son armée jusqu'à sa mort en 1886.",
      ],
    }),
    match({
      topic: "Les résistants",
      stage: 2,
      prompt: "Associe chaque résistant au fait qui le concerne.",
      pairs: [
        ["Lat Dior Diop", "Mort à Dékheulé en 1886"],
        ["Cheikh Ahmadou Bamba", "Exilé au Gabon en 1895"],
        ["Aline Sitoé Diatta", "Arrêtée en Casamance en 1943"],
      ],
      hints: [
        "Lis bien chaque fait : une mort au combat, un exil loin du pays, une arrestation.",
        "Celui qui a été exilé résistait sans armes, par la prière et le travail.",
      ],
    }),
    order({
      topic: "La préhistoire",
      stage: 3,
      prompt: "Range ces étapes de la préhistoire de la plus ancienne à la plus récente.",
      sequence: ["Les premiers outils en pierre taillée", "La découverte du feu", "Les débuts de l'agriculture"],
      hints: [
        "Au début de la préhistoire, les hommes chassaient et cueillaient avec des outils de pierre ; ils ne cultivaient pas encore.",
        "Les chasseurs-cueilleurs savaient déjà se servir du feu, bien avant de semer les premiers champs.",
      ],
    }),
    shortAnswer({
      topic: "Les premiers contacts",
      stage: 3,
      prompt: "Quels Européens sont arrivés les premiers sur les côtes du Sénégal, au XVe siècle ? Écris un mot.",
      accepted: ["Portugais", "les Portugais", "le Portugais"],
      hints: [
        "Ils venaient d'un petit pays d'Europe, au bord de l'océan Atlantique.",
        "On parle encore leur langue en Guinée-Bissau, notre voisine du sud.",
      ],
    }),
    fillBlank({
      topic: "Les royaumes avant les Européens",
      stage: 2,
      prompt: "Complète la phrase avec le bon mot.",
      text: "Dans les royaumes du Sénégal, les habitants vivaient de l'agriculture, de l'élevage et du ___.",
      blanks: [{ options: ["commerce", "tourisme", "cinéma"], answer: "commerce" }],
      hints: [
        "Les marchands apportaient du sel, de l'or et d'autres produits d'un royaume à l'autre.",
        "Pense à ce que font les gens au marché : ils vendent et ils achètent.",
      ],
    }),
  ],

  CM2: [
    qcm({
      topic: "Les grands empires",
      stage: 2,
      prompt: "Quel empire était célèbre pour son or et avait pour capitale Koumbi Saleh ?",
      options: ["L'empire du Mali", "L'empire songhaï", "Le royaume du Cayor", "L'empire du Ghana"],
      answer: "L'empire du Ghana",
      explanation: "L'empire du Ghana était riche en or ; sa capitale était Koumbi Saleh.",
      hints: [
        "C'est le plus ancien des trois grands empires d'Afrique de l'Ouest étudiés en classe.",
        "Le pays qui porte aujourd'hui son nom est loin de l'ancien empire, au bord du golfe de Guinée.",
      ],
    }),
    dragDrop({
      topic: "Les progrès des sciences et des techniques",
      stage: 2,
      prompt: "À quoi servent ces inventions ? Glisse chacune dans la bonne case.",
      zones: ["Se déplacer", "Communiquer", "Se protéger des maladies"],
      items: {
        "Se déplacer": ["L'automobile", "L'avion"],
        Communiquer: ["Le téléphone", "La radio"],
        "Se protéger des maladies": ["Les vaccins"],
      },
      hints: [
        "Pour chaque invention, demande-toi ce qu'elle a changé dans la vie des gens.",
        "Un vaccin ne guérit pas : on le reçoit en bonne santé, pour ne pas attraper la maladie.",
      ],
    }),
    match({
      topic: "La marche vers l'indépendance",
      stage: 3,
      prompt: "Associe chaque nom ou chaque date à ce qu'il rappelle.",
      pairs: [
        ["Blaise Diagne", "Premier député noir africain"],
        ["Léopold Sédar Senghor", "Premier président du Sénégal"],
        ["La Fédération du Mali", "1959-1960"],
        ["Le 4 avril", "Fête nationale du Sénégal"],
      ],
      hints: [
        "Commence par les dates, puis demande-toi ce que chacun des deux hommes a été le premier à faire.",
        "Le premier chef de l'État sénégalais est aussi un grand poète.",
      ],
    }),
    order({
      topic: "La conquête coloniale",
      stage: 3,
      prompt: "Range ces événements du plus ancien au plus récent.",
      sequence: [
        "L'abolition de l'esclavage dans les colonies françaises",
        "La création de l'AOF",
        "Dakar devient capitale de l'AOF",
        "Blaise Diagne est élu député",
        "L'indépendance du Sénégal",
      ],
      hints: [
        "Pense à la grande histoire : l'esclavage est aboli, la colonisation s'organise, puis l'Afrique se prépare à l'indépendance.",
        "L'AOF est créée avant que Dakar en devienne la capitale : Saint-Louis l'était d'abord.",
      ],
    }),
    shortAnswer({
      topic: "Grandes découvertes et traite négrière",
      stage: 2,
      prompt: "En quelle année l'esclavage a-t-il été aboli dans les colonies françaises ?",
      accepted: ["1848"],
      hints: [
        "C'était au milieu du XIXe siècle, bien avant la création de l'AOF.",
        "Cette année se situe juste avant 1850.",
      ],
    }),
    fillBlank({
      topic: "Les grands empires",
      stage: 3,
      prompt: "Quels mots manquent dans cette phrase ?",
      text: "Mansa Moussa, empereur du ___, a fait son pèlerinage à La Mecque en ___.",
      blanks: [
        { options: ["Mali", "Ghana", "Songhaï"], answer: "Mali" },
        { options: ["1324", "1895", "1960"], answer: "1324" },
      ],
      hints: [
        "Mansa Moussa est le plus célèbre empereur de l'empire fondé par Soundiata Keïta.",
        "Ce pèlerinage a eu lieu au XIVe siècle, bien avant l'arrivée des colonisateurs.",
      ],
    }),
  ],
};
