import { dragDrop, fillBlank, match, order, qcm, shortAnswer } from "../bank-helpers";
import type { SubjectBank } from "../demo-types";

/**
 * L'INSTRUCTION CIVIQUE, du CI au CM2 : un exercice par type et par classe,
 * dans la thématique que le programme (`convex/programme/civique.ts`) donne à
 * la classe. Pas de réponse à écrire au CI.
 *
 * Au CI et au CP, l'enfant choisit le bon comportement dans une situation de
 * sa vie (la classe, la rue, la maison), sans morale culpabilisante : les
 * mauvaises propositions sont de vrais gestes d'enfant, à éviter. Aux classes
 * suivantes, les symboles et les institutions n'affirment que ce que le
 * programme dit : jamais les paroles de l'hymne, aucun nom de personne en
 * fonction, aucune date.
 */
export const BANK: SubjectBank = {
  CI: [
    qcm({
      topic: "Traverser la rue",
      stage: 1,
      prompt: "Tu veux traverser la rue. Le feu des piétons est rouge 🔴. Que fais-tu ?",
      options: ["Je traverse 🚶", "Je cours 🏃", "Je m'arrête ✋", "Je joue ⚽"],
      answer: "Je m'arrête ✋",
      explanation: "Quand le feu des piétons est rouge, on s'arrête et on attend le feu vert pour traverser.",
      hints: [
        "Regarde bien la couleur du feu.",
        "Quand le feu des piétons est rouge, ce sont les voitures qui passent.",
      ],
    }),
    dragDrop({
      topic: "À l'école chaque jour",
      stage: 2,
      prompt: "En classe, que faut-il faire et que faut-il éviter ? Glisse chaque phrase dans la bonne case.",
      zones: ["À faire ✅", "À éviter ❌"],
      items: {
        "À faire ✅": ["J'arrive tôt ⏰", "Je range 📚", "Je salue 👋"],
        "À éviter ❌": ["Je casse 💥", "Je crie 📢", "Je frappe 👊"],
      },
      hints: [
        "Pense à une classe où chacun est calme et prend soin des affaires.",
        "Demande-toi : est-ce que ça fait plaisir ou de la peine aux autres ?",
      ],
    }),
    match({
      topic: "Bonjour, merci, pardon",
      stage: 1,
      prompt: "Relie chaque image au bon mot ou au bon geste.",
      pairs: [
        ["🌅", "Bonjour"],
        ["🎁", "Merci"],
        ["🌙", "Bonne nuit"],
        ["😔", "Pardon"],
        ["🚿", "Je me lave"],
      ],
      hints: [
        "Regarde chaque image : que dit-on, ou que fait-on, quand on la voit ?",
        "Le soleil se lève le matin. La lune se voit la nuit.",
      ],
    }),
    order({
      topic: "On s'entraide",
      stage: 3,
      prompt: "Remets l'histoire de Modou dans le bon ordre.",
      sequence: ["Modou tombe 🤕", "Il pleure 😢", "Je l'aide 🤝", "Il sourit 😀"],
      hints: [
        "Au début de l'histoire, Modou a un problème.",
        "On pleure après être tombé. On sourit quand on a été aidé.",
      ],
    }),
    fillBlank({
      topic: "Bonjour, merci, pardon",
      stage: 2,
      prompt: "Complète la phrase avec le bon mot.",
      text: "J'ai fait mal à Awa. Je dis ___.",
      blanks: [{ options: ["merci", "pardon", "bonjour"], answer: "pardon" }],
      hints: [
        "Relis la phrase : qu'est-ce qui est arrivé à Awa ?",
        "Quand on fait de la peine à quelqu'un, on s'excuse avec un petit mot.",
      ],
    }),
  ],

  CP: [
    qcm({
      topic: "Filles et garçons, tous égaux",
      stage: 2,
      prompt: "À la maison, qui peut aider à balayer et à faire la vaisselle ?",
      options: ["Tout le monde", "Seulement les filles", "Seulement les garçons", "Seulement maman"],
      answer: "Tout le monde",
      explanation: "Filles et garçons ont les mêmes droits et partagent les tâches : chacun peut aider à la maison.",
      hints: [
        "Rappelle-toi : filles et garçons ont les mêmes droits, à l'école comme à la maison.",
        "Réfléchis : faut-il être une fille pour tenir un balai ou laver une assiette ?",
      ],
    }),
    dragDrop({
      topic: "Le règlement de la classe",
      stage: 2,
      prompt: "Droit ou devoir ? Glisse chaque phrase dans la bonne case.",
      zones: ["Droits", "Devoirs"],
      items: {
        Droits: ["Être respecté", "Jouer"],
        Devoirs: ["Écouter la maîtresse", "Respecter les autres", "Ranger mes affaires"],
      },
      hints: [
        "Un droit, c'est ce que tu peux faire ou recevoir pour bien grandir.",
        "Un devoir, c'est ce que tu dois faire pour que la classe se passe bien.",
      ],
    }),
    match({
      topic: "Mes responsabilités en classe",
      stage: 2,
      prompt: "Relie chaque responsabilité à sa mission.",
      pairs: [
        ["Chef de classe", "Aide la maîtresse"],
        ["Propreté", "Balaie la classe"],
        ["Matériel", "Range les craies"],
        ["Lever des couleurs", "Lève le drapeau"],
      ],
      hints: [
        "Lis chaque mission : qui s'occupe de quoi dans la classe ?",
        "Pense au drapeau, à la craie, au balai : à quelle responsabilité va chaque objet ?",
      ],
    }),
    order({
      topic: "Régler un conflit sans se battre",
      stage: 3,
      prompt: "Remets ces moments dans l'ordre, du début à la fin.",
      sequence: ["Une dispute 😡", "Je me calme", "On se parle", "On se réconcilie"],
      hints: [
        "Quelle est la première chose qui arrive dans une dispute ?",
        "Avant de se parler, il faut d'abord se calmer.",
      ],
    }),
    shortAnswer({
      topic: "La sécurité sur la route",
      stage: 2,
      prompt: "Sur une moto, que dois-tu mettre sur la tête pour te protéger ? Écris le mot.",
      accepted: ["casque", "un casque", "le casque", "mon casque", "casque de moto", "un casque de moto"],
      hints: [
        "Pense à ce que porte un conducteur de moto pour protéger sa tête en cas de chute.",
        "Ce mot commence par la lettre « c » et l'objet est dur et solide.",
      ],
    }),
    fillBlank({
      topic: "Le règlement de la classe",
      stage: 1,
      prompt: "Choisis le mot qui complète la phrase.",
      text: "En classe, je lève la ___ avant de parler.",
      blanks: [{ options: ["main", "tête", "jambe"], answer: "main" }],
      hints: [
        "Pour parler en classe, on ne crie pas : on fait un geste.",
        "Ce geste se fait avec le bras, en ouvrant les doigts.",
      ],
    }),
  ],

  CE1: [
    qcm({
      topic: "Nos différences, notre richesse",
      stage: 2,
      prompt: "Mame vient d'arriver de Casamance. À la maison, elle parle une autre langue que toi. Que fais-tu ?",
      options: [
        "Je me moque de sa façon de parler",
        "Je ne lui parle pas",
        "Je dis aux autres de l'éviter",
        "Je l'invite à jouer avec moi",
      ],
      answer: "Je l'invite à jouer avec moi",
      explanation: "Les langues différentes sont une richesse : en jouant ensemble, on apprend des mots nouveaux et on devient amis.",
      hints: [
        "Pense à ce que tu aimerais si tu arrivais dans une nouvelle école.",
        "Une nouvelle élève a besoin d'amis, pas de moqueries.",
      ],
    }),
    dragDrop({
      topic: "Respecter les autorités",
      stage: 2,
      prompt: "Qui fait quoi pour nous protéger ? Classe chaque action sous le bon métier.",
      zones: ["Policiers et gendarmes", "Sapeurs-pompiers"],
      items: {
        "Policiers et gendarmes": ["Arrêtent les voleurs", "Dirigent la circulation"],
        "Sapeurs-pompiers": ["Éteignent les incendies", "Secourent les blessés"],
      },
      hints: [
        "Pense au métier de chacun : les uns font respecter la loi, les autres viennent au secours.",
        "Quand il y a un feu ou un accident, c'est la sirène des sapeurs-pompiers qu'on entend.",
      ],
    }),
    match({
      topic: "Le civisme",
      stage: 2,
      prompt: "Associe chaque situation au bon geste.",
      pairs: [
        ["Une borne-fontaine qui coule", "Je la ferme"],
        ["Une lampe allumée sans personne", "Je l'éteins"],
        ["Un papier par terre dans la rue", "Je le jette à la poubelle"],
        ["Un jeune arbre dans la cour", "Je l'arrose"],
      ],
      hints: [
        "Pense à ce qu'il faut faire pour ne pas gaspiller et pour garder les lieux propres.",
        "Cherche d'abord ce qu'on fait d'un robinet qui coule, puis d'une lumière qui ne sert à rien.",
      ],
    }),
    order({
      topic: "Les symboles de la Nation",
      stage: 1,
      prompt: "Le drapeau du Sénégal a trois bandes verticales. Range-les de gauche à droite, en partant du mât.",
      sequence: ["Vert", "Or", "Rouge"],
      hints: [
        "Imagine le drapeau dessiné dans ton cahier, avec le mât à gauche.",
        "L'étoile verte est dessinée sur la bande du milieu. Quelle est la couleur de cette bande ?",
      ],
    }),
    shortAnswer({
      topic: "Respecter les autorités",
      stage: 1,
      prompt: "Comment appelle-t-on la personne qui dirige l'école ? Écris un seul mot.",
      accepted: [
        "directeur",
        "directrice",
        "le directeur",
        "la directrice",
        "un directeur",
        "une directrice",
        "directeur d'école",
        "directrice d'école",
        "directeur d’école",
        "directrice d’école",
      ],
      hints: [
        "Ce n'est ni ton maître ni ta maîtresse : c'est la personne qui s'occupe de toute l'école.",
        "Le mot commence par « d ». Il n'y en a qu'un (ou une) dans toute l'école.",
      ],
    }),
    fillBlank({
      topic: "Les symboles de la Nation",
      stage: 3,
      prompt: "Complète la devise du Sénégal en choisissant les bons mots.",
      text: "La devise du Sénégal est « Un ___ – Un But – Une ___ ».",
      blanks: [
        { options: ["Peuple", "Pays", "Chef"], answer: "Peuple" },
        { options: ["Foi", "Paix", "Loi", "Voix"], answer: "Foi" },
      ],
      hints: [
        "La devise a trois parties, qui commencent toutes par « Un » ou « Une ».",
        "Le premier mot désigne tous les habitants d'un pays. Le dernier veut dire « ce en quoi l'on croit ».",
      ],
    }),
  ],

  CE2: [
    qcm({
      topic: "Les bonnes valeurs",
      stage: 2,
      prompt: "Mariama trouve un billet de 1 000 F dans la cour de l'école. Que doit-elle faire ?",
      options: [
        "Le garder pour acheter des beignets",
        "Le donner à la maîtresse pour retrouver son propriétaire",
        "Le cacher dans son cartable",
        "Le dire à ses amis et le partager",
      ],
      answer: "Le donner à la maîtresse pour retrouver son propriétaire",
      explanation: "L'honnêteté, c'est rendre ce qui ne nous appartient pas : la maîtresse pourra retrouver la personne qui a perdu son billet.",
      hints: [
        "Demande-toi : à qui appartient ce billet ? Est-ce à Mariama ?",
        "Une personne honnête rend ce qu'elle trouve, avec l'aide d'un adulte de confiance.",
      ],
    }),
    dragDrop({
      topic: "Mes droits et mes devoirs",
      stage: 2,
      prompt: "Est-ce un droit ou un devoir de l'enfant ? Range chaque phrase dans la bonne case.",
      zones: ["Un droit", "Un devoir"],
      items: {
        "Un droit": ["Aller à l'école", "Être soigné quand on est malade", "Jouer avec ses amis"],
        "Un devoir": ["Respecter les autres", "Travailler à l'école", "Aider à la maison"],
      },
      hints: [
        "Un droit protège l'enfant : c'est ce qu'on lui donne pour bien grandir.",
        "Un devoir, c'est ce que l'enfant doit faire pour les autres ou pour la classe.",
      ],
    }),
    match({
      topic: "La vie en communauté",
      stage: 2,
      prompt: "Associe chaque situation du quartier à la bonne façon de s'entraider.",
      pairs: [
        ["Un voisin est malade", "On lui rend visite"],
        ["Une voisine porte une lourde charge", "On l'aide à la porter"],
        ["Une famille voisine n'a plus d'eau", "On partage notre eau avec elle"],
        ["La rue est sale après une fête", "On nettoie ensemble"],
      ],
      hints: [
        "Lis chaque situation et cherche ce que ferait un bon voisin.",
        "Une charge lourde se porte à deux ; une rue sale se nettoie à plusieurs.",
      ],
    }),
    order({
      topic: "Vivre en paix",
      stage: 3,
      prompt: "Remets dans l'ordre les étapes pour régler une dispute par le dialogue.",
      sequence: [
        "Une dispute éclate entre deux élèves",
        "Un médiateur écoute chacun à son tour",
        "Ils cherchent ensemble une solution",
        "Les deux élèves se réconcilient",
      ],
      hints: [
        "Commence par ce qui déclenche tout : la dispute. Termine par ce qui ramène la paix.",
        "On ne cherche une solution qu'après avoir écouté chacun.",
      ],
    }),
    shortAnswer({
      topic: "Les bonnes valeurs",
      stage: 2,
      prompt: "Quel mot wolof désigne l'hospitalité, l'art d'accueillir chaleureusement ses invités ? Écris-le.",
      accepted: ["teranga", "téranga", "teraanga", "la teranga", "la téranga", "la teraanga"],
      hints: [
        "On l'entend dans le surnom de l'équipe nationale de football.",
        "Ce mot commence par « t » et il a trois syllabes.",
      ],
    }),
    fillBlank({
      topic: "Mes droits et mes devoirs",
      stage: 3,
      prompt: "Choisis les deux mots qui rendent la phrase juste.",
      text: "Chaque enfant a le droit d'être ___ contre la violence, et le devoir de ___ ses leçons.",
      blanks: [
        { options: ["protégé", "puni", "oublié"], answer: "protégé" },
        { options: ["réviser", "cacher", "perdre"], answer: "réviser" },
      ],
      hints: [
        "Lis chaque partie de la phrase : la première parle d'un droit, la seconde d'un devoir.",
        "Un enfant doit être à l'abri des coups. Un bon élève relit ses leçons le soir.",
      ],
    }),
  ],

  CM1: [
    qcm({
      topic: "Prévenir les conflits par le dialogue",
      stage: 2,
      prompt: "Deux équipes du quartier veulent jouer sur le même terrain le samedi après-midi. Quelle solution règle le problème sans conflit ?",
      options: [
        "Elles se battent pour le terrain",
        "L'équipe la plus forte le prend",
        "Elles se parlent et jouent à tour de rôle",
        "Elles se boudent et partent",
      ],
      answer: "Elles se parlent et jouent à tour de rôle",
      explanation: "Le dialogue et le compromis donnent à chacun sa part : les deux équipes jouent à tour de rôle, sans se battre.",
      hints: [
        "Cherche la solution où personne ne perd tout et où personne n'a besoin de se battre.",
        "Un compromis, c'est quand chacun accepte de faire un pas vers l'autre.",
      ],
    }),
    dragDrop({
      topic: "La commune et l'État",
      stage: 3,
      prompt: "Qui est élu dans la commune ou le département, et qui représente l'État ? Classe chaque autorité.",
      zones: ["Élus de la commune ou du département", "Représentants de l'État"],
      items: {
        "Élus de la commune ou du département": ["Le maire", "Le conseil municipal", "Le conseil départemental"],
        "Représentants de l'État": ["Le gouverneur de région", "Le préfet de département", "Le sous-préfet d'arrondissement"],
      },
      hints: [
        "Regarde chaque titre : certains sont choisis par le vote des habitants, d'autres représentent l'État.",
        "Le conseil municipal est formé de conseillers que les habitants ont élus.",
      ],
    }),
    match({
      topic: "Les organisations de mon quartier",
      stage: 2,
      prompt: "Relie chaque organisation à son rôle dans le quartier.",
      pairs: [
        ["Une ASC (sport et culture)", "Organiser les navétanes"],
        ["Un groupement de femmes", "Gérer une tontine ou un commerce"],
        ["Un comité de quartier", "Présenter les problèmes à la mairie"],
        ["Une association de parents d'élèves", "Équiper l'école en tables-bancs"],
      ],
      hints: [
        "Lis bien le nom de chaque organisation : il dit qui elle réunit. Demande-toi ce que ces personnes font ensemble.",
        "Les navétanes sont les tournois de football des vacances ; dans une tontine, chaque membre cotise et reçoit la caisse à son tour.",
      ],
    }),
    order({
      topic: "La coopérative et le gouvernement scolaire",
      stage: 3,
      prompt: "Remets dans l'ordre le déroulement de l'élection du gouvernement scolaire.",
      sequence: [
        "Les candidats font campagne",
        "Les élèves votent à bulletin secret",
        "On dépouille les bulletins",
        "On proclame les résultats",
      ],
      hints: [
        "Dans une élection, on connaît d'abord les candidats avant de voter.",
        "On ne proclame un résultat qu'après avoir dépouillé les bulletins.",
      ],
    }),
    shortAnswer({
      topic: "La commune et l'État",
      stage: 1,
      prompt: "Comment s'appelle la personne qui dirige la commune ? Écris un seul mot.",
      accepted: ["maire", "le maire", "la maire", "un maire"],
      hints: [
        "C'est un élu local, pas un représentant de l'État.",
        "Son titre commence par « m » et s'écrit avec cinq lettres.",
      ],
    }),
    fillBlank({
      topic: "Prévenir les conflits par le dialogue",
      stage: 2,
      prompt: "Termine la phrase avec le bon mot.",
      text: "Une personne neutre qui aide deux élèves à se mettre d'accord s'appelle un ___.",
      blanks: [{ options: ["médiateur", "adversaire", "spectateur"], answer: "médiateur" }],
      hints: [
        "On cherche quelqu'un qui n'est d'aucun côté et qui aide les deux élèves à se comprendre.",
        "Ce mot est de la même famille que « médiation ».",
      ],
    }),
  ],

  CM2: [
    qcm({
      topic: "Les institutions de la République",
      stage: 2,
      prompt: "Comment le Président de la République du Sénégal est-il choisi ?",
      options: ["Par les députés", "Par tous les électeurs", "Par les ministres", "Par les juges"],
      answer: "Par tous les électeurs",
      explanation: "Le Président de la République est élu au suffrage universel : tous les électeurs peuvent voter pour le choisir.",
      hints: [
        "Pense au jour de l'élection présidentielle : qui fait la queue devant les bureaux de vote ?",
        "On dit qu'il est élu au « suffrage universel » : « suffrage » veut dire « vote », « universel » veut dire « pour tous ».",
      ],
    }),
    dragDrop({
      topic: "Les organisations internationales",
      stage: 2,
      prompt: "ONU ou sport ? Place chaque sigle dans la bonne case.",
      zones: ["Agences de l'ONU", "Organisations du sport"],
      items: {
        "Agences de l'ONU": ["UNICEF", "UNESCO", "OMS", "FAO"],
        "Organisations du sport": ["FIFA", "CIO"],
      },
      hints: [
        "Retrouve ce que veut dire chaque sigle : enfants, éducation, santé, alimentation, football, Jeux olympiques.",
        "La FIFA s'occupe du football dans le monde. Quel autre sigle parle des Jeux olympiques ?",
      ],
    }),
    match({
      topic: "Les organisations africaines",
      stage: 4,
      prompt: "Associe chaque organisation africaine à sa mission.",
      pairs: [
        ["CILSS", "Lutter contre la sécheresse"],
        ["OMVS", "Mettre en valeur le fleuve Sénégal"],
        ["OMVG", "Mettre en valeur le fleuve Gambie"],
        ["BCEAO", "Émettre notre monnaie"],
        ["CAF", "Organiser le football africain"],
      ],
      hints: [
        "Les sigles OMVS et OMVG se ressemblent : leur dernière lettre est l'initiale du nom du fleuve.",
        "Dans les sigles, cherche le B de « banque » et le F de « football ».",
      ],
    }),
    order({
      topic: "Les organisations africaines",
      stage: 3,
      prompt: "Range ces ensembles du plus petit au plus grand, selon le nombre de pays qu'ils rassemblent.",
      sequence: ["Le Sénégal", "La CEDEAO", "L'Union africaine", "L'ONU"],
      hints: [
        "Compte les pays : un seul, puis quelques pays d'une région, puis tout un continent, puis le monde entier.",
        "La CEDEAO réunit des pays d'Afrique de l'Ouest ; l'Union africaine, les pays de tout le continent.",
      ],
    }),
    shortAnswer({
      topic: "Les organisations internationales",
      stage: 3,
      prompt: "Quel sigle désigne l'agence de l'ONU qui protège et aide les réfugiés ?",
      accepted: ["HCR", "UNHCR", "le HCR", "l'UNHCR", "l’UNHCR"],
      hints: [
        "Le nom complet de cette agence commence par « Haut-Commissariat ».",
        "Le sigle a trois lettres : la dernière est la première lettre du mot « réfugiés ».",
      ],
    }),
    fillBlank({
      topic: "La République du Sénégal",
      stage: 2,
      prompt: "Complète la phrase avec le mot qui convient.",
      text: "La ___ est la loi fondamentale du Sénégal : toutes les autres lois doivent la respecter.",
      blanks: [{ options: ["Constitution", "République", "Nation"], answer: "Constitution" }],
      hints: [
        "Cherche le mot qui désigne le texte placé au sommet de toutes les lois du pays.",
        "Ce mot commence par « C » et se termine par « -tion ».",
      ],
    }),
  ],
};
