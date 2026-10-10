import { dragDrop, fillBlank, match, order, qcm, shortAnswer } from "../bank-helpers";
import type { SubjectBank } from "../demo-types";

/**
 * L'ANGLAIS, du CI au CM2 : un exercice par type et par classe, dans une
 * thématique et à une difficulté que le programme (`convex/programme`) donne
 * à la classe. Les consignes, les indices et les explications sont en
 * français ; l'anglais n'apparaît que dans ce que l'enfant apprend (mots,
 * phrases, réponses), écrit à la britannique.
 *
 * Au CI et au CP, aucun mot anglais dans la consigne : les mots sont dans les
 * propositions, avec un émoji. Pas d'écoute, pas de rime, pas de
 * prononciation (l'application ne lit pas l'anglais) et pas de réponse à
 * écrire au CI. Les mauvaises propositions d'un QCM sont les erreurs
 * classiques d'un francophone (« I have eight years », « She cans swim »,
 * « more taller »).
 */
export const BANK: SubjectBank = {
  CI: [
    qcm({
      topic: "Les couleurs en anglais",
      stage: 1,
      prompt: "Quel mot va avec la couleur de ce cercle : 🔵 ?",
      options: ["red", "blue", "green", "yellow"],
      answer: "blue",
      explanation: "Le cercle 🔵 est bleu, et bleu se dit « blue » en anglais.",
      hints: [
        "Regarde bien la couleur du cercle.",
        "Pense à la couleur du ciel quand il n'y a pas de nuages.",
      ],
    }),
    dragDrop({
      topic: "Les fruits en anglais",
      stage: 2,
      prompt: "Fruits ou animaux ? Glisse chaque image dans la bonne case.",
      zones: ["🍇 Fruits", "🐾 Animaux"],
      items: {
        "🍇 Fruits": ["🥭 mango", "🍌 banana", "🍍 pineapple"],
        "🐾 Animaux": ["🐘 elephant", "🦁 lion", "🐒 monkey"],
      },
      hints: [
        "Regarde l'image de chaque tuile avant de lire le mot.",
        "Un fruit pousse sur un arbre ou sur une plante. Un animal bouge tout seul : il marche, court ou grimpe.",
      ],
    }),
    match({
      topic: "Les animaux en anglais",
      stage: 2,
      prompt: "Relie chaque animal à son mot.",
      pairs: [
        ["🐶", "dog"],
        ["🐐", "goat"],
        ["🐑", "sheep"],
        ["🐄", "cow"],
        ["🐴", "horse"],
      ],
      hints: [
        "Regarde bien chaque animal avant de choisir son mot.",
        "Attention : la chèvre et le mouton se ressemblent. Sur les images, la chèvre a une petite barbe ; le mouton est tout frisé, comme du coton.",
      ],
    }),
    order({
      topic: "Compter jusqu'à 10 en anglais",
      stage: 2,
      prompt: "Range ces nombres du plus petit au plus grand.",
      sequence: ["2️⃣ two", "5️⃣ five", "8️⃣ eight", "🔟 ten"],
      hints: [
        "Regarde le nombre dessiné sur chaque tuile : lequel est le plus petit ?",
        "Récite : 1, 2, 3, 4, 5, 6, 7, 8, 9, 10. Parmi les quatre nombres, celui que tu dis en premier est le plus petit.",
      ],
    }),
    fillBlank({
      topic: "Hello! Goodbye!",
      stage: 2,
      prompt: "Regarde l'image et choisis le mot qui manque.",
      text: "🌙 Good ___!",
      blanks: [{ options: ["morning", "night", "please"], answer: "night" }],
      hints: [
        "Regarde bien l'image avant de choisir.",
        "L'image montre la lune : à quel moment de la journée la voit-on ?",
      ],
    }),
  ],

  CP: [
    qcm({
      topic: "Mon corps en anglais",
      stage: 2,
      prompt: "La maîtresse te demande de toucher ton nez 👃. Quelle phrase dit-elle ?",
      options: ["Touch your ear.", "Touch your eye.", "Touch your mouth.", "Touch your nose."],
      answer: "Touch your nose.",
      explanation: "« nose » veut dire « nez » : « Touch your nose. » veut dire « touche ton nez ».",
      hints: [
        "Regarde l'image 👃 : quelle partie du visage montre-t-elle ?",
        "Le mot cherché commence par la lettre n, comme « nez ».",
      ],
    }),
    dragDrop({
      topic: "Manger et boire en anglais",
      stage: 1,
      prompt: "Je mange ou je bois ? Glisse chaque image dans la bonne case.",
      zones: ["Je mange 🍴", "Je bois 🥤"],
      items: {
        "Je mange 🍴": ["🍚 rice", "🍞 bread", "🥚 egg"],
        "Je bois 🥤": ["💧 water", "🥛 milk", "🍵 tea"],
      },
      hints: [
        "Regarde l'image de chaque tuile avant de lire le mot.",
        "Pense à ton repas : qu'est-ce que tu manges, et qu'est-ce que tu bois dans un verre ?",
      ],
    }),
    match({
      topic: "Ma famille en anglais",
      stage: 2,
      prompt: "Voici une famille. Relie chaque personnage à son mot.",
      pairs: [
        ["👩", "mother"],
        ["👨", "father"],
        ["👦", "brother"],
        ["👧", "sister"],
        ["👶", "baby"],
      ],
      hints: [
        "Regarde bien chaque personnage : adulte ou enfant, homme ou femme ?",
        "Les parents sont les adultes. Le bébé est le plus petit de la famille.",
      ],
    }),
    order({
      topic: "Les nombres de 11 à 20 en anglais",
      stage: 3,
      prompt: "Remets ces nombres dans l'ordre, du plus petit au plus grand.",
      sequence: ["twelve", "fifteen", "seventeen", "twenty"],
      hints: [
        "Cherche d'abord le nombre le plus petit, puis le suivant, et ainsi de suite.",
        "Compte en anglais : « ten, eleven… », et continue. Le mot de la liste que tu dis en premier est le plus petit.",
      ],
    }),
    shortAnswer({
      topic: "Les nombres de 11 à 20 en anglais",
      stage: 4,
      prompt: "Écris ce nombre en lettres, en anglais : 16",
      accepted: ["sixteen"],
      hints: [
        "Les nombres de 13 à 19 se terminent tous par le même bout de mot : « teen ».",
        "Le début s'écrit exactement comme le chiffre 6 en français.",
      ],
    }),
    fillBlank({
      topic: "Dans ma classe en anglais",
      stage: 2,
      prompt: "Regarde l'image et complète la phrase.",
      text: "🎒 It is a ___.",
      blanks: [{ options: ["bag", "book", "door"], answer: "bag" }],
      hints: [
        "Regarde l'image : c'est ce que tu portes sur le dos pour aller à l'école.",
        "Le mot a trois lettres et il commence par la lettre b.",
      ],
    }),
  ],

  CE1: [
    qcm({
      topic: "Se présenter en anglais",
      stage: 2,
      prompt: "On te demande « How old are you? ». Tu as huit ans. Quelle est la bonne réponse ?",
      options: ["I am eight.", "I have eight years.", "I am eight years.", "I have eight."],
      answer: "I am eight.",
      explanation:
        "On dit son âge avec le verbe être : « I am eight. » (ou « I am eight years old. »). Sans « old », « years » est une faute, et on n'emploie jamais le verbe avoir.",
      hints: [
        "Regarde la question « How old are you? » : elle contient « are », une forme du verbe être.",
        "Pour dire son âge, l'anglais utilise le verbe être (« I am »), et jamais le mot « years » tout seul.",
      ],
    }),
    dragDrop({
      topic: "A ou an ?",
      stage: 2,
      prompt: "« a » ou « an » ? Glisse chaque mot dans la bonne case.",
      zones: ["a", "an"],
      items: {
        a: ["dog", "banana", "book"],
        an: ["apple", "egg", "elephant"],
      },
      hints: [
        "Regarde la première lettre de chaque mot : est-ce une voyelle (a, e, i, o, u) ou une consonne ?",
        "On met « an » devant un mot qui commence par une voyelle, et « a » devant une consonne.",
      ],
    }),
    match({
      topic: "Les ordres de la classe",
      stage: 1,
      prompt: "Associe chaque image à l'ordre de la maîtresse.",
      pairs: [
        ["👀", "look"],
        ["👂", "listen"],
        ["✍️", "write"],
        ["📖", "open your book"],
      ],
      hints: [
        "Regarde bien chaque image : que fait-on avec les yeux, avec les oreilles, avec un stylo, avec un livre ?",
        "Un seul des ordres contient plusieurs mots : c'est celui qui parle du livre.",
      ],
    }),
    order({
      topic: "Les vêtements en anglais",
      stage: 3,
      prompt: "Remets les mots dans le bon ordre pour dire : « C'est une robe rouge. »",
      sequence: ["It", "is", "a", "red", "dress."],
      hints: [
        "La majuscule te montre le premier mot, et le point te montre le dernier.",
        "En anglais, la couleur se place avant le nom, et non après comme en français.",
      ],
    }),
    shortAnswer({
      topic: "Les jours de la semaine",
      stage: 4,
      prompt: "Écris le jour qui manque, en anglais : « Tomorrow is Wednesday. Today is ___. »",
      accepted: ["Tuesday"],
      hints: [
        "Aujourd'hui, c'est le jour qui vient juste avant demain. Quel jour vient juste avant mercredi ?",
        "C'est le jour qui suit Monday. En anglais, les jours s'écrivent avec une majuscule.",
      ],
    }),
    fillBlank({
      topic: "J'aime, je n'aime pas",
      stage: 2,
      prompt: "Choisis le mot qui complète la réponse.",
      text: "Do you like mango? Yes, I ___.",
      blanks: [{ options: ["do", "like", "are"], answer: "do" }],
      hints: [
        "Relis la question : par quel petit mot commence-t-elle ?",
        "Pour répondre à une question qui commence par « Do you… », on répète ce petit mot après « Yes, I ».",
      ],
    }),
  ],

  CE2: [
    qcm({
      topic: "Je peux, je sais : can",
      stage: 2,
      prompt: "Quelle phrase dit bien : « Elle sait nager. » ?",
      options: ["She cans swim.", "She can swims.", "She can swim.", "She can to swim."],
      answer: "She can swim.",
      explanation:
        "« can » ne prend jamais de -s et le verbe qui suit reste tel quel, sans « to » : on dit « She can swim. »",
      hints: [
        "« can » ne change jamais, même avec « she » : il ne prend pas de -s.",
        "Après « can », on met le verbe directement : pas de « to » et pas de -s.",
      ],
    }),
    dragDrop({
      topic: "La maison et où c'est",
      stage: 1,
      prompt: "Une pièce de la maison ou un objet ? Glisse chaque mot dans la bonne case.",
      zones: ["Une pièce", "Un objet"],
      items: {
        "Une pièce": ["kitchen", "bathroom", "bedroom"],
        "Un objet": ["bed", "table", "TV"],
      },
      hints: [
        "Pense à ta maison : où dors-tu ? où te laves-tu ? où prépare-t-on le repas ?",
        "Une pièce est un endroit entouré de murs. Un objet est une chose que l'on utilise dans une pièce.",
      ],
    }),
    match({
      topic: "Le temps qu'il fait",
      stage: 2,
      prompt: "Associe chaque image à la phrase qui la décrit.",
      pairs: [
        ["☀️", "It is sunny."],
        ["🌧️", "It is rainy."],
        ["🌬️", "It is windy."],
        ["☁️", "It is cloudy."],
        ["🥶", "It is cold."],
      ],
      hints: [
        "Regarde bien chaque image : soleil, pluie, vent, nuage, froid.",
        "Les phrases se ressemblent : seul le dernier mot change. Cherche le mot qui va avec l'image.",
      ],
    }),
    order({
      topic: "Être en anglais : am, is, are",
      stage: 2,
      prompt: "Remets les mots dans le bon ordre pour poser la question : « Es-tu un élève ? »",
      sequence: ["Are", "you", "a", "student?"],
      hints: [
        "La majuscule te montre le premier mot, et le point d'interrogation le dernier.",
        "Dans une question, le verbe passe avant le sujet. Compare avec la phrase « You are a student. »",
      ],
    }),
    shortAnswer({
      topic: "Les mois de l'année",
      stage: 3,
      prompt: "Écris, en anglais, le mois qui vient juste après « August ».",
      accepted: ["September"],
      hints: [
        "Récite les mois dans l'ordre : juillet, août, ... Lequel vient juste après août ?",
        "C'est le neuvième mois de l'année. Attention : il ne s'écrit pas tout à fait comme en français !",
      ],
    }),
    fillBlank({
      topic: "J'ai : have got, has got",
      stage: 3,
      prompt: "Complète les deux trous avec le bon mot.",
      text: "I ___ got two sisters. My brother ___ got a bag.",
      blanks: [
        { options: ["have", "has", "am"], answer: "have" },
        { options: ["have", "has", "is"], answer: "has" },
      ],
      hints: [
        "Regarde le sujet de chaque phrase : « I » d'un côté, « My brother » de l'autre.",
        "Avec « he », « she », « it » ou une seule personne, « have got » devient « has got ».",
      ],
    }),
  ],

  CM1: [
    qcm({
      topic: "He, she, it : le s du verbe",
      stage: 2,
      prompt: "Choisis la phrase juste pour dire : « Cheikh regarde la télé. »",
      options: ["Cheikh watch TV.", "Cheikh watches TV.", "Cheikh watchs TV.", "Cheikh is watch TV."],
      answer: "Cheikh watches TV.",
      explanation:
        "Avec « he », « she » ou un prénom, le verbe prend -s ; après « ch », « sh », « s » ou « o », on ajoute -es : « watches ».",
      hints: [
        "Cheikh est une seule personne, comme « he » : le verbe doit changer à la fin.",
        "Quand le verbe finit par « ch », « sh », « s » ou « o », on ajoute -es et non -s.",
      ],
    }),
    dragDrop({
      topic: "Ma journée en anglais",
      stage: 2,
      prompt: "« at » ou « in » ? Glisse chaque moment de la journée dans la bonne case.",
      zones: ["at", "in"],
      items: {
        at: ["six o'clock", "nine o'clock", "night"],
        in: ["the morning", "the afternoon", "the evening"],
      },
      hints: [
        "Regarde chaque mot : est-ce une heure exacte, ou un moment de la journée ?",
        "« at » va avec une heure exacte ; « in » va avec une grande partie de la journée. Une seule exception : la nuit.",
      ],
    }),
    match({
      topic: "Les métiers en anglais",
      stage: 2,
      prompt: "Associe chaque situation au métier qui convient.",
      pairs: [
        ["Il pêche en mer.", "fisherman"],
        ["Il conduit un car.", "driver"],
        ["Il cultive le mil.", "farmer"],
        ["Elle enseigne aux élèves.", "teacher"],
        ["Il vend au marché.", "trader"],
      ],
      hints: [
        "Lis chaque phrase et pense au métier de la personne.",
        "Dans plusieurs de ces mots, la fin « -er » veut dire « celui qui fait ». Cherche le verbe caché au début du mot.",
      ],
    }),
    order({
      topic: "Ce que je fais : le présent",
      stage: 3,
      prompt: "Remets les mots dans l'ordre pour dire : « Je prends toujours mon petit-déjeuner. »",
      sequence: ["I", "always", "eat", "breakfast."],
      hints: [
        "Commence par le sujet, puis pense à la place du mot « always ».",
        "En anglais, l'adverbe de fréquence (always, usually, sometimes, never) se place avant le verbe.",
      ],
    }),
    shortAnswer({
      topic: "En ce moment : le -ing",
      stage: 4,
      prompt: "Complète en écrivant « swim » à la forme en -ing : « Fatou is ___ now. »",
      accepted: ["swimming"],
      hints: [
        "Pour dire ce qui se passe en ce moment, on utilise « is / am / are » suivi d'un verbe qui finit par -ing.",
        "« swim » finit par une seule voyelle entre deux consonnes (w-i-m) : double la dernière lettre avant -ing, comme run → running.",
      ],
    }),
    fillBlank({
      topic: "Au marché en anglais",
      stage: 2,
      prompt: "Choisis le bon mot pour acheter deux tomates.",
      text: "I would like two ___, please.",
      blanks: [{ options: ["tomato", "tomatos", "tomatoes"], answer: "tomatoes" }],
      hints: [
        "Tu veux deux tomates : le mot doit être au pluriel.",
        "Beaucoup de mots qui finissent par -o prennent -es au pluriel, comme « mangoes ».",
      ],
    }),
  ],

  CM2: [
    qcm({
      topic: "Comparer : plus grand, le plus grand",
      stage: 2,
      prompt: "Comment dit-on « Awa est plus grande que Modou. » en anglais ? Choisis la bonne phrase.",
      options: [
        "Awa is more tall than Modou.",
        "Awa is more taller than Modou.",
        "Awa is taller that Modou.",
        "Awa is taller than Modou.",
      ],
      answer: "Awa is taller than Modou.",
      explanation:
        "« tall » est un adjectif court : on ajoute -er (taller), puis « than » pour dire « que ». On n'écrit jamais « more taller » ni « taller that ».",
      hints: [
        "Pour comparer, un adjectif court comme « tall » prend la fin -er. On n'ajoute pas « more ».",
        "Pour dire « que » après « taller », l'anglais n'utilise pas « that ».",
      ],
    }),
    dragDrop({
      topic: "Lire un petit texte",
      stage: 3,
      prompt:
        "Vrai ou faux ? Lis le texte, puis glisse chaque phrase dans la bonne case : « Fatou is nine. She is from Ziguinchor. Yesterday she was at the market. »",
      zones: ["True", "False"],
      items: {
        True: ["She is not ten.", "Fatou is from Ziguinchor.", "She was at the market yesterday."],
        False: ["Fatou is ten.", "She is from Mali.", "Yesterday she was not at the market."],
      },
      hints: [
        "Lis le texte phrase par phrase. « She » (elle), c'est Fatou.",
        "Une phrase est « True » si elle dit la même chose que le texte, même avec d'autres mots. Attention au petit mot « not ».",
      ],
    }),
    match({
      topic: "Poser des questions",
      stage: 3,
      prompt: "Associe chaque question au type de réponse attendu.",
      pairs: [
        ["Who is he?", "Une personne"],
        ["When is your birthday?", "Un moment"],
        ["Why are you sad?", "Une raison"],
        ["How many books have you got?", "Un nombre"],
        ["How much is it?", "Un prix"],
      ],
      hints: [
        "Regarde le premier mot de chaque question : who, when, why, how...",
        "Attention à « how many » et « how much » : l'un demande de compter, l'autre demande combien ça coûte.",
      ],
    }),
    order({
      topic: "Demander son chemin",
      stage: 3,
      prompt:
        "Remets ce petit dialogue dans l'ordre. Pour aller au marché, on va d'abord tout droit, puis on tourne à gauche, et le marché est à côté de la banque.",
      sequence: [
        "Excuse me, where is the market?",
        "Go straight on.",
        "Turn left.",
        "It is next to the bank.",
        "Thank you.",
      ],
      hints: [
        "Ce dialogue commence par une question et se termine par un remerciement.",
        "Entre la question et le merci, relis le chemin en français et cherche la phrase anglaise de chaque étape.",
      ],
    }),
    shortAnswer({
      topic: "Raconter hier : verbes irréguliers",
      stage: 4,
      prompt: "Écris le verbe « buy » au passé pour compléter : « Yesterday I ___ two mangoes at the market. »",
      accepted: ["bought"],
      hints: [
        "« buy » est un verbe irrégulier : on n'ajoute pas -ed, le mot change complètement.",
        "Au passé, il commence par b, il a 6 lettres et il se termine par « ght ».",
      ],
    }),
    fillBlank({
      topic: "Demain : être going to",
      stage: 3,
      prompt: "Complète la phrase pour dire ce que tu vas faire demain.",
      text: "Tomorrow I ___ going to ___ my grandmother.",
      blanks: [
        { options: ["am", "is", "are"], answer: "am" },
        { options: ["visit", "visits", "visiting", "visited"], answer: "visit" },
      ],
      hints: [
        "Pour parler de demain, on utilise « be + going to + verbe ». Avec « I », quelle forme de « be » faut-il ?",
        "Après « going to », le verbe reste à l'infinitif : pas de -s, pas de -ing, pas de -ed.",
      ],
    }),
  ],
};
