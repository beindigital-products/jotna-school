import { dragDrop, fillBlank, match, order, qcm, shortAnswer } from "../bank-helpers";
import type { SubjectBank } from "../demo-types";

/**
 * L'ÉVEIL SCIENTIFIQUE, du CI au CM2 : un exercice par type et par classe, à la
 * difficulté et dans la thématique que le programme (`convex/programme`)
 * donne à la classe. Pas de réponse à écrire au CI.
 *
 * Que des faits observables dans la vie de l'enfant et que le programme
 * nomme : les états de l'eau, la chaîne alimentaire, le paludisme, le circuit
 * électrique... La santé se traite par ce que l'enfant peut faire lui-même.
 * Au CI et au CP, des émojis courants et anciens, des étiquettes de trois mots
 * au plus : l'enfant apprend à lire.
 */
export const BANK: SubjectBank = {
  CI: [
    qcm({
      topic: "Naturel ou fabriqué ?",
      stage: 1,
      prompt: "Lequel a été fabriqué par l'homme ?",
      options: ["🌳 Arbre", "🚲 Vélo", "🐟 Poisson", "💧 Eau"],
      answer: "🚲 Vélo",
      explanation: "Le vélo est fabriqué par l'homme. L'arbre, le poisson et l'eau existent dans la nature, sans l'homme.",
      hints: [
        "Regarde bien chaque image : une seule montre un objet que des gens ont construit.",
        "Pour chaque image, demande-toi : est-ce que ça existe tout seul dans la nature, ou est-ce que des gens l'ont fabriqué ?",
      ],
    }),
    dragDrop({
      topic: "Les animaux autour de moi",
      stage: 2,
      prompt: "Domestique ou sauvage ? Glisse chaque animal au bon endroit.",
      zones: ["Domestiques", "Sauvages"],
      items: {
        Domestiques: ["🐑 Mouton", "🐐 Chèvre", "🐔 Poule"],
        Sauvages: ["🦁 Lion", "🐒 Singe", "🐊 Crocodile"],
      },
      hints: [
        "Un animal domestique vit près des gens : la famille s'en occupe.",
        "Dans le village, on voit certains de ces animaux dans les cours. Les autres vivent loin des maisons.",
      ],
    }),
    match({
      topic: "Les outils de la maison et de l'école",
      stage: 2,
      prompt: "Relie chaque outil à ce qu'il sert à faire.",
      pairs: [
        ["✂️ Ciseaux", "Couper"],
        ["🔨 Marteau", "Enfoncer un clou"],
        ["🧹 Balai", "Balayer"],
        ["Arrosoir", "Arroser"],
      ],
      hints: [
        "Pense à ce que tu fais avec chaque outil, à l'école ou à la maison.",
        "Des mots de la même famille se ressemblent : le balai sert à balayer.",
      ],
    }),
    order({
      topic: "Mon corps et la propreté",
      stage: 3,
      prompt: "Remets les gestes dans l'ordre pour te laver les mains.",
      sequence: ["💧 Mouiller", "🧼 Savonner", "👐 Frotter", "🚰 Rincer"],
      hints: [
        "Regarde comment tu te laves les mains avant de manger : par quoi commences-tu ?",
        "Le savon se met sur des mains mouillées. Le dernier geste enlève la mousse.",
      ],
    }),
    fillBlank({
      topic: "Les plantes autour de moi",
      stage: 2,
      prompt: "Complète la phrase avec le bon mot.",
      text: "La mangue est ___ du manguier.",
      blanks: [{ options: ["le fruit", "la racine", "la feuille"], answer: "le fruit" }],
      hints: [
        "Le manguier est un arbre. Pense à la partie qu'on mange, celle qui est sucrée.",
        "On cueille cette partie quand elle est mûre, puis on la mange.",
      ],
    }),
  ],

  CP: [
    qcm({
      topic: "Les maladies du milieu",
      stage: 1,
      prompt: "Quel petit animal peut donner le paludisme en piquant ?",
      options: ["🐝 Abeille", "🦂 Scorpion", "🐜 Fourmi", "🦟 Moustique"],
      answer: "🦟 Moustique",
      explanation: "Le paludisme est transmis par la piqûre du moustique. Dormir sous une moustiquaire nous protège pendant la nuit.",
      hints: [
        "Le paludisme donne de la fièvre. Il s'attrape quand un tout petit animal nous pique.",
        "Cet animal vole surtout le soir et la nuit, et il fait « bzzz » près de nos oreilles.",
      ],
    }),
    dragDrop({
      topic: "Bien manger",
      stage: 2,
      prompt: "Utile ou nuisible pour ta santé ? Glisse chaque aliment.",
      zones: ["Utiles", "Nuisibles"],
      items: {
        Utiles: ["🥭 Mangue", "🐟 Poisson", "🥛 Lait caillé"],
        Nuisibles: ["🤢 Fruit gâté", "Pain moisi", "Trop de bonbons"],
      },
      hints: [
        "Un aliment utile aide ton corps à grandir et à être fort.",
        "Un aliment nuisible peut te rendre malade : il est abîmé, ou il y a trop de sucre.",
      ],
    }),
    match({
      topic: "Protéger la nature",
      stage: 2,
      prompt: "Que faire ? Relie chaque problème à la bonne action.",
      pairs: [
        ["Cour sale", "La balayer"],
        ["Plante sans eau", "L'arroser"],
        ["Arbre coupé", "Planter un arbre"],
        ["Sachet par terre", "À la poubelle"],
      ],
      hints: [
        "Lis chaque problème et pense à ce que tu peux faire pour l'arranger.",
        "Un balai sert à nettoyer le sol de la cour.",
      ],
    }),
    order({
      topic: "Les êtres vivants grandissent",
      stage: 1,
      prompt: "Remets les âges de la vie dans l'ordre, du plus jeune au plus âgé.",
      sequence: ["👶 Bébé", "👦 Enfant", "👨 Adulte", "👴 Vieillard"],
      hints: [
        "Pense aux gens de ta famille, du plus petit enfant jusqu'aux grands-parents.",
        "On commence par le bébé. Celui qui a les cheveux blancs vient en dernier.",
      ],
    }),
    shortAnswer({
      topic: "Solide, liquide ou gaz ?",
      stage: 2,
      prompt: "Dans le congélateur, l'eau devient dure comme une pierre. Comment s'appelle-t-elle ?",
      accepted: [
        "glace",
        "la glace",
        "de la glace",
        "glaçon",
        "un glaçon",
        "le glaçon",
        "glaçons",
        "des glaçons",
        "les glaçons",
        "glacon",
        "un glacon",
        "glacons",
        "des glacons",
      ],
      hints: [
        "Quand il fait très froid, l'eau ne coule plus : elle garde sa forme.",
        "On en met dans une boisson pour la rafraîchir. Elle est dure, froide, et elle fond au soleil.",
      ],
    }),
    fillBlank({
      topic: "Les maladies du milieu",
      stage: 1,
      prompt: "Choisis le bon mot pour finir la phrase.",
      text: "Quand j'ai de la fièvre, on m'emmène au ___.",
      blanks: [{ options: ["dispensaire", "marché", "stade"], answer: "dispensaire" }],
      hints: [
        "La fièvre est un signe de maladie : il faut se faire soigner.",
        "C'est un lieu de santé où l'infirmier peut te soigner.",
      ],
    }),
  ],

  CE1: [
    qcm({
      topic: "La respiration",
      stage: 1,
      prompt: "Avec quoi un poisson respire-t-il dans l'eau ?",
      options: ["Ses branchies", "Ses poumons", "Son nez", "Ses nageoires"],
      answer: "Ses branchies",
      explanation: "Le poisson respire avec ses branchies. L'homme, lui, respire avec ses poumons, par le nez et par la bouche.",
      hints: [
        "Un poisson vit dans l'eau : il ne respire pas comme toi, avec un nez.",
        "Regarde sous les ouïes, de chaque côté de sa tête : on y voit de petites lames rouges.",
      ],
    }),
    dragDrop({
      topic: "Les substances autour de nous",
      stage: 2,
      prompt: "On remue chaque produit dans un verre d'eau. Se dissout-il ? Glisse-le au bon endroit.",
      zones: ["Se dissout dans l'eau", "Ne se dissout pas"],
      items: {
        "Se dissout dans l'eau": ["Le sel", "Le sucre"],
        "Ne se dissout pas": ["Le sable", "Un caillou", "Un morceau de bois"],
      },
      hints: [
        "Un produit qui se dissout ne se voit plus quand on remue, mais il est toujours dans l'eau. S'il ne se dissout pas, on le voit encore.",
        "Pense au thé ou au bissap sucré : que devient le sucre quand on remue ?",
      ],
    }),
    match({
      topic: "Les objets techniques simples",
      stage: 1,
      prompt: "Associe chaque objet à son usage.",
      pairs: [
        ["Lampe torche", "Éclairer dans le noir"],
        ["Ciseaux", "Couper du papier"],
        ["Robinet", "Faire couler l'eau"],
        ["Cadenas", "Fermer à clé"],
        ["Règle", "Mesurer une longueur"],
      ],
      hints: [
        "Pense à ce que tu fais avec chaque objet, à la maison ou à l'école.",
        "Quand on tourne un robinet, quelque chose se met à couler.",
      ],
    }),
    order({
      topic: "Comment se nourrissent les êtres vivants",
      stage: 2,
      prompt: "Range cette chaîne alimentaire. Le premier est mangé par le deuxième, et le deuxième par le troisième.",
      sequence: ["L'herbe", "Le mouton", "Le lion"],
      hints: [
        "Une chaîne alimentaire commence par une plante, qui fabrique sa propre nourriture.",
        "Demande-toi : que mange le mouton ? Et qui mange le mouton ?",
      ],
    }),
    shortAnswer({
      topic: "Les parasites et le paludisme",
      stage: 3,
      prompt: "Le moustique anophèle transmet le paludisme. Quel objet, installé au-dessus du lit, nous protège la nuit ?",
      accepted: [
        "moustiquaire",
        "une moustiquaire",
        "la moustiquaire",
        "moustiquaires",
        "des moustiquaires",
        "les moustiquaires",
        "moustiquaire imprégnée",
        "une moustiquaire imprégnée",
        "la moustiquaire imprégnée",
        "moustiquaires imprégnées",
        "des moustiquaires imprégnées",
        "moustiquaire impregnee",
        "une moustiquaire impregnee",
      ],
      hints: [
        "Pense à ce que ta famille installe autour du lit avant de dormir.",
        "C'est un grand voile à mailles très fines : les moustiques ne peuvent pas passer.",
      ],
    }),
    fillBlank({
      topic: "L'eau potable",
      stage: 2,
      prompt: "Choisis les bons mots pour que la phrase soit juste.",
      text: "On garde l'eau potable dans un récipient ___ et ___.",
      blanks: [
        { options: ["propre", "sale", "troué"], answer: "propre" },
        { options: ["couvert", "ouvert", "cassé"], answer: "couvert" },
      ],
      hints: [
        "L'eau potable est une eau qu'on peut boire sans danger : il faut la garder ainsi.",
        "Pense à ce qui protège l'eau de la poussière et des mouches.",
      ],
    }),
  ],

  CE2: [
    qcm({
      topic: "La vie des animaux",
      stage: 2,
      prompt: "Parmi ces animaux, lequel est ovipare, c'est-à-dire qu'il pond des œufs ?",
      options: ["La chèvre", "Le chat", "La tortue", "La vache"],
      answer: "La tortue",
      explanation: "La tortue pond des œufs : elle est ovipare. La chèvre, le chat et la vache sont vivipares : leurs petits se développent dans le ventre de la mère.",
      hints: [
        "Un animal vivipare ne pond pas d'œufs : son petit se développe dans le ventre de sa mère.",
        "Trois de ces animaux nourrissent leurs petits avec leur lait. Ces petits ont grandi dans le ventre de leur mère.",
      ],
    }),
    dragDrop({
      topic: "L'environnement et la population",
      stage: 2,
      prompt: "Abîme ou protège l'environnement ? Glisse chaque action au bon endroit.",
      zones: ["Abîme l'environnement", "Protège l'environnement"],
      items: {
        "Abîme l'environnement": [
          "Allumer des feux de brousse",
          "Jeter des sachets dans la rue",
          "Couper des arbres sans en replanter",
        ],
        "Protège l'environnement": [
          "Planter des arbres",
          "Mettre les déchets à la poubelle",
          "Ramasser les sachets plastiques",
        ],
      },
      hints: [
        "Une action qui abîme salit le quartier ou détruit la nature. Une action qui protège garde le quartier propre ou soigne la nature.",
        "Demande-toi : après cette action, la nature va-t-elle mieux ou plus mal ?",
      ],
    }),
    match({
      topic: "Le circuit électrique",
      stage: 1,
      prompt: "Associe chaque élément du circuit à son rôle.",
      pairs: [
        ["Pile", "Donne l'électricité"],
        ["Ampoule", "S'allume et éclaire"],
        ["Interrupteur", "Ouvre ou ferme le circuit"],
        ["Fils électriques", "Laissent passer le courant"],
      ],
      hints: [
        "Pense à une lampe torche : qu'y a-t-il à l'intérieur, et que fait chaque partie ?",
        "L'interrupteur est le bouton sur lequel on appuie pour allumer ou éteindre.",
      ],
    }),
    order({
      topic: "La vie des plantes",
      stage: 3,
      prompt: "Remets dans l'ordre la vie d'une plante à fruit, de la graine jusqu'au fruit.",
      sequence: ["On sème la graine", "La graine germe", "La jeune plante grandit", "La fleur s'ouvre", "Le fruit se forme"],
      hints: [
        "Repère d'abord ce qui se passe en premier : que fait-on avant que la graine pousse ?",
        "La jeune plante grandit avant d'avoir des fleurs, et la fleur apparaît avant le fruit.",
      ],
    }),
    shortAnswer({
      topic: "Le corps humain",
      stage: 2,
      prompt: "Comment s'appelle la « boîte » d'os qui protège le cerveau dans la tête ?",
      accepted: [
        "crâne",
        "le crâne",
        "crane",
        "le crane",
        "boîte crânienne",
        "la boîte crânienne",
        "boite cranienne",
        "la boite cranienne",
      ],
      hints: [
        "Passe ta main sur ta tête : sous la peau, tu sens un os dur et rond.",
        "Plusieurs os bien assemblés forment cette boîte. Son nom rime avec « âne ».",
      ],
    }),
    fillBlank({
      topic: "Se protéger des maladies",
      stage: 2,
      prompt: "Complète la phrase pour mieux connaître le VIH.",
      text: "On n'attrape pas le VIH en jouant, en mangeant ensemble ou en se donnant la main. Il peut passer par le ___.",
      blanks: [{ options: ["sang", "ballon", "repas"], answer: "sang" }],
      hints: [
        "Lis bien la première phrase : elle dit ce qui ne transmet pas le VIH.",
        "Si un camarade se blesse, on ne touche pas ce qui coule de sa blessure : on appelle un adulte.",
      ],
    }),
  ],

  CM1: [
    qcm({
      topic: "Le cœur et le sang",
      stage: 3,
      prompt: "Quels vaisseaux ramènent le sang vers le cœur ?",
      options: ["Les artères", "Les veines", "Les bronches", "Les intestins"],
      answer: "Les veines",
      explanation: "Les artères emportent le sang du cœur vers tout le corps, et les veines le ramènent vers le cœur.",
      hints: [
        "Le sang circule dans des tuyaux appelés vaisseaux sanguins. Certains partent du cœur, d'autres y reviennent.",
        "Les artères partent du cœur : on sent leur pouls au poignet. Le retour se fait par d'autres tuyaux.",
      ],
    }),
    dragDrop({
      topic: "La respiration et ses maladies",
      stage: 2,
      prompt: "Cette habitude protège-t-elle ou abîme-t-elle tes poumons ? Glisse chaque étiquette au bon endroit.",
      zones: ["Protège les poumons", "Abîme les poumons"],
      items: {
        "Protège les poumons": [
          "Aérer la maison",
          "Se couvrir le nez quand il y a de la poussière",
          "Cuisiner dans un endroit bien aéré",
        ],
        "Abîme les poumons": [
          "Brûler des ordures près de la maison",
          "Cuisiner dans une pièce fermée",
          "Rester dans une pièce pleine de fumée",
        ],
      },
      hints: [
        "Tes poumons aiment l'air pur. La fumée et la poussière les abîment.",
        "Quand l'air d'une pièce ne se renouvelle pas, la fumée y reste. Ouvrir les portes et les fenêtres aide.",
      ],
    }),
    match({
      topic: "Démonter et assembler un objet",
      stage: 2,
      prompt: "Associe chaque pièce du vélo à son rôle.",
      pairs: [
        ["Le guidon", "Sert à diriger le vélo"],
        ["Les freins", "Ralentissent ou arrêtent la roue"],
        ["La chaîne", "Transmet le mouvement des pédales"],
        ["La selle", "Sert à s'asseoir"],
      ],
      hints: [
        "Imagine-toi sur un vélo : que fais-tu avec tes mains, avec tes pieds, avec ton corps assis ?",
        "Pour rouler, tes pieds poussent les pédales, et une pièce relie les pédales à la roue arrière.",
      ],
    }),
    order({
      topic: "La digestion",
      stage: 2,
      prompt: "Range les organes dans l'ordre où passe un aliment que l'on avale.",
      sequence: ["La bouche", "L'œsophage", "L'estomac", "Les intestins"],
      hints: [
        "Suis le chemin d'un morceau de pain, depuis le moment où tu le mets dans ta bouche jusqu'à la fin du voyage.",
        "Après la bouche, l'aliment descend par un tube jusqu'à une poche qui le brasse, puis passe dans un long tuyau replié.",
      ],
    }),
    shortAnswer({
      topic: "Phénomènes physiques et chimiques",
      stage: 3,
      prompt: "De la vapeur d'eau touche un couvercle froid et se change en petites gouttes. Comment s'appelle ce phénomène ?",
      accepted: ["condensation", "la condensation", "liquéfaction", "la liquéfaction", "liquefaction", "la liquefaction"],
      hints: [
        "Ici, la vapeur redevient de l'eau liquide. C'est le contraire de l'évaporation.",
        "Les gouttes qui se forment sur une bouteille sortie du frigo, c'est le même phénomène. Le mot finit par « -ation ».",
      ],
    }),
    fillBlank({
      topic: "L'hygiène du milieu",
      stage: 2,
      prompt: "Choisis le bon mot dans chaque trou.",
      text: "Se laver tous les jours, c'est de l'hygiène ___. Ramasser les ordures du quartier, c'est de l'hygiène ___.",
      blanks: [
        { options: ["individuelle", "collective"], answer: "individuelle" },
        { options: ["collective", "individuelle"], answer: "collective" },
      ],
      hints: [
        "« Individuelle » parle d'une seule personne, « collective » parle d'un groupe.",
        "Qui profite du geste : toi seul, ou tous les habitants du quartier ?",
      ],
    }),
  ],

  CM2: [
    qcm({
      topic: "La santé de la mère et de l'enfant",
      stage: 1,
      prompt: "Pourquoi emmène-t-on les bébés et les jeunes enfants se faire vacciner ?",
      options: [
        "Pour qu'ils grandissent plus vite",
        "Pour remplacer le lait de leur mère",
        "Pour qu'ils dorment mieux la nuit",
        "Pour les protéger de maladies graves",
      ],
      answer: "Pour les protéger de maladies graves",
      explanation: "Un vaccin prépare le corps à se défendre : il protège l'enfant contre des maladies graves, comme la rougeole ou la polio.",
      hints: [
        "Pense au carnet de santé de l'enfant : à chaque rendez-vous au centre de santé, on y note les vaccins reçus.",
        "Le vaccin n'est ni un aliment ni un médicament pour guérir : il prépare le corps avant la maladie.",
      ],
    }),
    dragDrop({
      topic: "Bien se nourrir pour bien grandir",
      stage: 3,
      prompt: "Dans quel groupe range-t-on chaque aliment ? Glisse-le au bon endroit.",
      zones: ["Aliments énergétiques", "Aliments de construction", "Aliments de protection"],
      items: {
        "Aliments énergétiques": ["Le mil", "Le riz"],
        "Aliments de construction": ["Le poisson", "Les œufs"],
        "Aliments de protection": ["La mangue", "Les carottes"],
      },
      hints: [
        "Énergie : pour courir et jouer. Construction : pour faire grandir muscles et os. Protection : pour défendre le corps.",
        "Les fruits et les légumes apportent des vitamines : ils protègent le corps contre les maladies.",
      ],
    }),
    match({
      topic: "Vivre dans l'eau, vivre sur terre",
      stage: 2,
      prompt: "Associe chaque partie à ce qu'elle permet de faire dans son milieu.",
      pairs: [
        ["Les nageoires du poisson", "Se déplacer dans l'eau"],
        ["Les branchies du poisson", "Respirer dans l'eau"],
        ["Les plumes de l'oiseau", "Voler dans les airs"],
        ["Les racines profondes de l'arbre", "Trouver l'eau loin sous le sol"],
      ],
      hints: [
        "Pour chaque partie, demande-toi à quoi elle sert : se déplacer, respirer ou trouver de l'eau ?",
        "Dans une région sèche, l'eau est loin sous le sol : l'arbre doit aller la chercher en profondeur.",
      ],
    }),
    order({
      topic: "Les appareils de la maison",
      stage: 3,
      prompt: "Remets dans l'ordre les gestes pour repasser du linge en sécurité.",
      sequence: [
        "Brancher le fer",
        "Attendre que le fer chauffe",
        "Repasser le linge",
        "Débrancher le fer",
        "Laisser refroidir le fer",
      ],
      hints: [
        "Pense à ce qu'on fait avant de repasser, pendant, puis après, quand on a fini.",
        "On coupe le courant avant de laisser le fer refroidir, sinon il continue à chauffer.",
      ],
    }),
    shortAnswer({
      topic: "Gérer et restaurer les ressources",
      stage: 3,
      prompt: "On laisse un champ se reposer un certain temps, sans le cultiver, pour que la terre retrouve sa force. Comment s'appelle cette pratique ?",
      accepted: [
        "jachère",
        "la jachère",
        "jachere",
        "la jachere",
        "mise en jachère",
        "la mise en jachère",
        "mise en jachere",
        "la mise en jachere",
      ],
      hints: [
        "Un champ cultivé chaque année s'épuise. Que peut faire le paysan pour que sa terre se repose ?",
        "Le mot est féminin. Il s'écrit avec « ch » au milieu et se termine par « ère ».",
      ],
    }),
    fillBlank({
      topic: "La santé de la mère et de l'enfant",
      stage: 2,
      prompt: "Choisis le mot qui complète la phrase.",
      text: "Pendant la grossesse, la future maman va aux consultations ___ pour suivre sa santé et celle du bébé.",
      blanks: [{ options: ["prénatales", "postnatales", "scolaires"], answer: "prénatales" }],
      hints: [
        "Ces visites ont lieu pendant la grossesse, donc avant que le bébé naisse.",
        "« Natal » parle de la naissance. Le début du mot dit si c'est avant ou après.",
      ],
    }),
  ],
};
