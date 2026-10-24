/**
 * ANGLAIS — langue vivante étrangère, HORS DU GUIDE OFFICIEL.
 *
 * Le « Guide pédagogique des matières du CI au CM2 au Sénégal » ne contient
 * pas d'anglais : cette matière est une PROPOSITION de Jotna School, à faire
 * relire par un professeur d'anglais avant d'ouvrir la matière aux élèves.
 * Chaque description le dit en tête (« Anglais, niveau … »).
 *
 * Le public : des enfants francophones qui découvrent l'anglais, sans aucun
 * prérequis. Les niveaux visés suivent le Cadre européen commun de référence
 * pour les langues (CECRL) :
 *
 *   CI et CP    pré-A1   reconnaître et lire des mots isolés, avec l'image
 *   CE1 et CE2  A1       dire et comprendre des phrases très simples sur soi,
 *                        sa famille, ses goûts, ce qu'on sait faire
 *   CM1         A1+      parler de sa journée, de ce qu'on fait en ce moment
 *   CM2         A2       raconter hier, dire demain, comparer, demander son
 *                        chemin, lire un petit texte : la porte de la 6e
 *
 * CE QUE LE MODÈLE DOIT TROUVER ICI : un VOCABULAIRE FERMÉ et des STRUCTURES
 * FERMÉES, thématique par thématique. Un modèle laissé libre invente des mots
 * hors niveau ; une liste close le tient dans le cadre (même principe que
 * « ne sors pas de ce cadre » de `paliers/prompts.ts`). Les règles propres à
 * l'anglais (consignes en français, orthographe britannique, pas d'oral…)
 * sont dans `SUBJECT_RULES`, au même endroit.
 *
 * LIMITES ASSUMÉES
 * - Pas d'oral. L'application n'a pas de voix anglaise : aucun exercice
 *   d'écoute ni de prononciation. C'est le gros manque d'un cours de langue ;
 *   il se comblera avec des clips audio, comme pour l'arabe.
 * - Les jeux fabriqués par le code (`paliers/games/anglaisCi.ts` au CI,
 *   `paliers/games/anglais.ts` au CP) ont leurs consignes en français : seuls
 *   les mots que l'enfant apprend sont en anglais. Aucun n'est un jeu d'écoute.
 * - L'anglais est écrit à la britannique (colour, grey, trousers, have got).
 */
import type { ProgrammeSubject } from "./types";

export const ANGLAIS: ProgrammeSubject = {
  key: "anglais",
  name: "Anglais",
  aliases: ["English", "Langue anglaise"],
  icon: "Languages",
  color: "#14b8a6",
  order: 8,
  domain: "Langue vivante étrangère (hors guide officiel)",
  classes: {
    CI: [
      {
        key: "an-ci-hello",
        name: "Hello! Goodbye!",
        palierCount: 2,
        description:
          "Anglais, niveau pré-A1 : saluer et se présenter. Vocabulaire fermé : hello, hi, goodbye, bye, good morning, good night, yes, no, please, thank you, sorry. Dire son prénom : « I am Awa. », « My name is Modou. ». L'enfant associe une salutation à une image (🌅 le matin, 🌙 le soir, 👋 un salut) ; pas d'autres mots.",
        games: [
          { kind: "salut-francais", count: 2 },
          { kind: "salut-dessin", count: 1 },
          { kind: "salut-situation", count: 1 },
          { kind: "salut-relier", count: 1 },
          { kind: "salut-glisser", count: 1 },
          { kind: "salut-prenom", count: 1 },
          { kind: "salut-rencontre", count: 1 },
          { kind: "salut-trou", count: 1 },
          { kind: "salut-trou-dessin", count: 1 },
        ],
        byLevel: true,
      },
      {
        key: "an-ci-colours",
        name: "Les couleurs en anglais",
        palierCount: 2,
        description:
          "Anglais, niveau pré-A1 : les couleurs. Vocabulaire fermé : red, blue, yellow, green, orange, black, white, pink, brown, purple. L'enfant associe le mot à la couleur (🔴 🔵 🟡 🟢 🟠 ⚫ ⚪ 🟣 🟤) ou à un objet de cette couleur (🍎 red, 🍌 yellow), et reconnaît « It is red. » ; pas de phrase plus longue.",
        games: [
          { kind: "couleur-mot", count: 3 },
          { kind: "couleur-chose", count: 2 },
          { kind: "couleur-francais", count: 1 },
          { kind: "couleur-relier", count: 1 },
          { kind: "couleur-glisser", count: 1 },
          { kind: "couleur-phrase", count: 2 },
        ],
        byLevel: true,
      },
      {
        key: "an-ci-numbers",
        name: "Compter jusqu'à 10 en anglais",
        description:
          "Anglais, niveau pré-A1 : les nombres de 0 à 10. Vocabulaire fermé : zero, one, two, three, four, five, six, seven, eight, nine, ten. L'enfant associe le mot au chiffre (3 = three) et à une quantité d'émojis (🍎🍎🍎 = three), continue une suite (one, two, three, ?). Jamais de nombre au-delà de 10.",
        games: [
          { kind: "compte-mot", count: 1 },
          { kind: "compte-chiffre", count: 1 },
          { kind: "compte-dessins", count: 2 },
          { kind: "compte-relier", count: 1 },
          { kind: "compte-relier-dessins", count: 1 },
          { kind: "compte-ordre", count: 1 },
          { kind: "compte-suivant", count: 1 },
          { kind: "compte-suite", count: 1 },
          { kind: "compte-glisser", count: 1 },
        ],
        byLevel: true,
      },
      {
        key: "an-ci-animals",
        name: "Les animaux en anglais",
        description:
          "Anglais, niveau pré-A1 : les animaux. Vocabulaire fermé : dog, cat, bird, fish, cow, goat, sheep, horse, chicken, monkey, lion, elephant. L'enfant associe l'émoji de l'animal au mot (🐶 dog, 🐱 cat, 🐦 bird, 🐟 fish, 🐄 cow, 🐐 goat, 🐑 sheep, 🐴 horse, 🐔 chicken, 🐒 monkey, 🦁 lion, 🐘 elephant) ; mots isolés, au singulier, sans phrase.",
        games: [
          { kind: "animal-mot", count: 3 },
          { kind: "animal-francais", count: 2 },
          { kind: "animal-relier", count: 2 },
          { kind: "animal-glisser", count: 1 },
          { kind: "animal-intrus", count: 2 },
        ],
        byLevel: true,
      },
      {
        key: "an-ci-fruits",
        name: "Les fruits en anglais",
        palierCount: 2,
        description:
          "Anglais, niveau pré-A1 : les fruits. Vocabulaire fermé : mango, banana, orange, apple, lemon, watermelon, pineapple. L'enfant associe l'émoji du fruit au mot (🥭 mango, 🍌 banana, 🍊 orange, 🍎 apple, 🍋 lemon, 🍉 watermelon, 🍍 pineapple) et trouve l'intrus parmi des fruits et des animaux déjà vus ; mots isolés, au singulier.",
        games: [
          { kind: "fruit-mot", count: 3 },
          { kind: "fruit-francais", count: 2 },
          { kind: "fruit-relier", count: 2 },
          { kind: "fruit-glisser", count: 1 },
          { kind: "fruit-intrus", count: 2 },
        ],
        byLevel: true,
      },
    ],
    CP: [
      {
        key: "an-cp-family",
        name: "Ma famille en anglais",
        palierCount: 2,
        description:
          "Anglais, niveau pré-A1 : la famille. Vocabulaire fermé : mother, father, brother, sister, grandmother, grandfather, baby, friend. Structure : « This is my mother. ». L'enfant associe le mot au personnage (👩 mother, 👨 father, 👦 brother, 👧 sister, 👵 grandmother, 👴 grandfather, 👶 baby) et complète « This is my ___. » ; pas de « have got », pas de pluriel.",
        games: [
          { kind: "famille-mot", count: 2 },
          { kind: "famille-lien", count: 2 },
          { kind: "famille-relier", count: 1 },
          { kind: "famille-glisser", count: 1 },
          { kind: "famille-trou", count: 2 },
          { kind: "famille-phrase", count: 2 },
        ],
      },
      {
        key: "an-cp-body",
        name: "Mon corps en anglais",
        palierCount: 2,
        description:
          "Anglais, niveau pré-A1 : le corps. Vocabulaire fermé : head, hair, eye, ear, nose, mouth, hand, finger, arm, leg, foot. L'enfant associe le mot à la partie du corps (👁️ eye, 👂 ear, 👃 nose, 👄 mouth, ✋ hand) et comprend « Touch your nose. », « Point to your head. » ; au singulier seulement (pas de feet, eyes, hands).",
        games: [
          { kind: "corps-mot", count: 2 },
          { kind: "corps-consigne", count: 2 },
          { kind: "corps-relier", count: 1 },
          { kind: "corps-glisser", count: 1 },
          { kind: "corps-trou", count: 2 },
          { kind: "corps-phrase", count: 2 },
        ],
      },
      {
        key: "an-cp-classroom",
        name: "Dans ma classe en anglais",
        palierCount: 2,
        description:
          "Anglais, niveau pré-A1 : les objets de la classe. Vocabulaire fermé : book, pen, pencil, bag, ruler, desk, chair, board, door, window. Structures : « It is a book. », « What is it? ». L'enfant associe le mot à l'objet (📖 book, ✏️ pencil, 🎒 bag, 🪑 chair, 🚪 door) et complète « It is a ___. » ; tous ces mots commencent par une consonne, donc « a » seulement.",
        games: [
          { kind: "classe-mot", count: 1 },
          { kind: "classe-francais", count: 2 },
          { kind: "classe-relier", count: 1 },
          { kind: "classe-glisser", count: 1 },
          { kind: "classe-trou", count: 1 },
          { kind: "classe-question", count: 2 },
          { kind: "classe-phrase", count: 2 },
        ],
      },
      {
        key: "an-cp-numbers-20",
        name: "Les nombres de 11 à 20 en anglais",
        description:
          "Anglais, niveau pré-A1 : les nombres de 0 à 20. Vocabulaire fermé : zero à ten (revus), puis eleven, twelve, thirteen, fourteen, fifteen, sixteen, seventeen, eighteen, nineteen, twenty. Structures : « How old are you? », « I am seven. ». L'enfant associe le mot au chiffre, compte des objets, remet des nombres dans l'ordre ; jamais de nombre au-delà de 20.",
        games: [
          { kind: "nombre-mot", count: 1 },
          { kind: "nombre-chiffre", count: 1 },
          { kind: "nombre-relier", count: 1 },
          { kind: "nombre-ordre", count: 2 },
          { kind: "nombre-suivant", count: 1 },
          { kind: "nombre-age", count: 1 },
          { kind: "nombre-ecrire", count: 1 },
          { kind: "nombre-glisser", count: 1 },
          { kind: "nombre-compter", count: 1 },
        ],
      },
      {
        key: "an-cp-food",
        name: "Manger et boire en anglais",
        palierCount: 2,
        description:
          "Anglais, niveau pré-A1 : les aliments. Vocabulaire fermé : rice, fish, bread, milk, water, egg, chicken, tea, juice. Structure : « I like rice. » (phrase positive seulement). L'enfant associe le mot à l'émoji (🍚 rice, 🐟 fish, 🍞 bread, 🥛 milk, 💧 water, 🥚 egg, 🍗 chicken) et complète « I like ___. » ; pas de forme négative, pas de question.",
        games: [
          { kind: "aliment-mot", count: 2 },
          { kind: "aliment-francais", count: 1 },
          { kind: "aliment-relier", count: 1 },
          { kind: "aliment-glisser", count: 1 },
          { kind: "aliment-trou", count: 1 },
          { kind: "aliment-trou-francais", count: 2 },
          { kind: "aliment-phrase", count: 2 },
        ],
      },
    ],
    CE1: [
      {
        key: "an-ce1-who",
        name: "Se présenter en anglais",
        palierCount: 3,
        games: [
          { kind: "ce1-en-who-reponse", count: 3 },
          { kind: "ce1-en-who-question", count: 1 },
          { kind: "ce1-en-who-relier", count: 1 },
          { kind: "ce1-en-who-trou", count: 2 },
          { kind: "ce1-en-who-ordre", count: 1 },
          { kind: "ce1-en-who-phrase", count: 1 },
          { kind: "ce1-en-who-glisser", count: 1 },
        ],
        description:
          "Anglais, niveau A1 : se présenter. Échanges fermés : « What is your name? / My name is Awa. », « How are you? / I am fine, thank you. », « How old are you? / I am eight. », « Where are you from? / I am from Senegal. » Pays : Senegal, Mali, Guinea, Gambia, France. L'enfant associe chaque question à sa réponse, complète un petit dialogue, remet un dialogue de trois répliques dans l'ordre.",
      },
      {
        key: "an-ce1-days",
        name: "Les jours de la semaine",
        palierCount: 2,
        games: [
          { kind: "ce1-en-days-ordre", count: 2 },
          { kind: "ce1-en-days-apres", count: 2 },
          { kind: "ce1-en-days-trou", count: 2 },
          { kind: "ce1-en-days-ecrire", count: 1 },
          { kind: "ce1-en-days-relier", count: 1 },
          { kind: "ce1-en-days-glisser", count: 1 },
          { kind: "ce1-en-days-phrase", count: 1 },
        ],
        description:
          "Anglais, niveau A1 : les jours. Vocabulaire fermé : Monday, Tuesday, Wednesday, Thursday, Friday, Saturday, Sunday, today, tomorrow. Structures : « Today is Monday. », « Tomorrow is Tuesday. » L'enfant remet les jours dans l'ordre, trouve le jour d'avant ou d'après, complète « Today is ___. » ; les jours s'écrivent avec une majuscule.",
      },
      {
        key: "an-ce1-a-an",
        name: "A ou an ?",
        palierCount: 3,
        games: [
          { kind: "ce1-en-aan-glisser", count: 2 },
          { kind: "ce1-en-aan-phrase", count: 2 },
          { kind: "ce1-en-aan-trou", count: 2 },
          { kind: "ce1-en-aan-ordre", count: 1 },
          { kind: "ce1-en-aan-relier", count: 1 },
          { kind: "ce1-en-aan-ecrire", count: 2 },
        ],
        description:
          "Anglais, niveau A1 : l'article a / an. « a » devant un mot qui commence par une consonne (a dog, a banana, a mango, a book), « an » devant une voyelle (an apple, an orange, an egg, an elephant). Structure : « What is it? / It is a dog. » Mots des thématiques déjà vues, au singulier ; jamais de mot comme hour ou university, pas de pluriel, pas de « the ».",
      },
      {
        key: "an-ce1-clothes",
        name: "Les vêtements en anglais",
        palierCount: 2,
        games: [
          { kind: "ce1-en-clothes-mot", count: 1 },
          { kind: "ce1-en-clothes-francais", count: 2 },
          { kind: "ce1-en-clothes-relier", count: 1 },
          { kind: "ce1-en-clothes-couleur", count: 2 },
          { kind: "ce1-en-clothes-phrase", count: 2 },
          { kind: "ce1-en-clothes-trou", count: 1 },
          { kind: "ce1-en-clothes-trou-mot", count: 1 },
        ],
        description:
          "Anglais, niveau A1 : les vêtements. Vocabulaire fermé : T-shirt, shirt, trousers, skirt, dress, shoes, socks, hat, cap, boubou. Structure : « It is a red dress. » : article + couleur + vêtement, avec les couleurs déjà vues ; en anglais la couleur se place AVANT le nom (« a red dress », pas « a dress red »). L'enfant associe le mot au vêtement (👕 T-shirt, 👗 dress, 👟 shoes, 🧦 socks, 🧢 cap). Shoes, socks et trousers s'apprennent comme des mots entiers, sans phrase.",
      },
      {
        key: "an-ce1-likes",
        name: "J'aime, je n'aime pas",
        palierCount: 3,
        games: [
          { kind: "ce1-en-likes-trou", count: 2 },
          { kind: "ce1-en-likes-reponse", count: 2 },
          { kind: "ce1-en-likes-sens", count: 2 },
          { kind: "ce1-en-likes-phrase", count: 2 },
          { kind: "ce1-en-likes-relier", count: 1 },
          { kind: "ce1-en-likes-glisser", count: 1 },
        ],
        description:
          "Anglais, niveau A1 : dire ce qu'on aime. Structures fermées : « I like rice. », « I do not like fish. », « Do you like mango? / Yes, I do. / No, I do not. » Aliments : rice, fish, bread, chicken, milk, water, mango, banana, orange, apple. L'enfant complète la phrase, choisit la bonne réponse à une question, remet les mots d'une phrase dans l'ordre ; les formes contractées (don't) sont acceptées en réponse mais jamais exigées.",
      },
      {
        key: "an-ce1-commands",
        name: "Les ordres de la classe",
        palierCount: 2,
        games: [
          { kind: "ce1-en-cmd-mot", count: 2 },
          { kind: "ce1-en-cmd-francais", count: 2 },
          { kind: "ce1-en-cmd-relier", count: 1 },
          { kind: "ce1-en-cmd-situation", count: 2 },
          { kind: "ce1-en-cmd-phrase", count: 1 },
          { kind: "ce1-en-cmd-trou", count: 1 },
          { kind: "ce1-en-cmd-glisser", count: 1 },
        ],
        description:
          "Anglais, niveau A1 : comprendre les consignes de la classe. Vocabulaire fermé : stand up, sit down, open your book, close your book, look, listen, write, read, come here, be quiet, please. L'enfant associe l'ordre à l'image (🧍 stand up, 🪑 sit down, 📖 open your book, 🤫 be quiet) et choisit l'ordre qui convient à une situation ; impératif seulement (« Open your book, please. »).",
      },
    ],
    CE2: [
      {
        key: "an-ce2-be",
        games: [
          { kind: "ce2-en-be-trou", count: 2 },
          { kind: "ce2-en-be-phrase", count: 2 },
          { kind: "ce2-en-be-neg", count: 1 },
          { kind: "ce2-en-be-question", count: 1 },
          { kind: "ce2-en-be-reponse", count: 2 },
          { kind: "ce2-en-be-glisser", count: 1 },
          { kind: "ce2-en-be-ecrire", count: 1 },
        ],
        name: "Être en anglais : am, is, are",
        palierCount: 3,
        description:
          "Anglais, niveau A1 : le verbe be au présent. I am, you are, he is, she is, it is, we are, they are ; négation (« I am not », « He is not », « They are not ») ; question et réponse courte (« Are you a student? / Yes, I am. / No, I am not. »). L'enfant choisit am, is ou are, complète des phrases, remet les mots dans l'ordre (dans la question, le verbe vient AVANT le sujet). Les formes contractées (I'm, he's) sont acceptées mais jamais exigées.",
      },
      {
        key: "an-ce2-have-got",
        games: [
          { kind: "ce2-en-hg-trou", count: 2 },
          { kind: "ce2-en-hg-phrase", count: 2 },
          { kind: "ce2-en-hg-neg", count: 1 },
          { kind: "ce2-en-hg-question", count: 1 },
          { kind: "ce2-en-hg-reponse", count: 1 },
          { kind: "ce2-en-hg-relier", count: 1 },
          { kind: "ce2-en-hg-glisser", count: 1 },
          { kind: "ce2-en-hg-ecrire", count: 1 },
        ],
        name: "J'ai : have got, has got",
        palierCount: 3,
        description:
          "Anglais, niveau A1 : posséder. « I have got a brother. », « She has got two sisters. », « Have you got a pen? / Yes, I have. / No, I have not. » Vocabulaire : la famille, les animaux et les objets de la classe déjà vus, les nombres jusqu'à 20 pour le pluriel régulier en -s (two sisters, three books). L'enfant choisit have got ou has got selon le sujet (he, she, it → has got) ; pas d'autre forme.",
      },
      {
        key: "an-ce2-can",
        games: [
          { kind: "ce2-en-can-fr", count: 1 },
          { kind: "ce2-en-can-phrase", count: 1 },
          { kind: "ce2-en-can-neg", count: 1 },
          { kind: "ce2-en-can-trou", count: 2 },
          { kind: "ce2-en-can-question", count: 1 },
          { kind: "ce2-en-can-reponse", count: 1 },
          { kind: "ce2-en-can-relier", count: 1 },
          { kind: "ce2-en-can-glisser", count: 1 },
          { kind: "ce2-en-can-ecrire", count: 1 },
        ],
        name: "Je peux, je sais : can",
        palierCount: 3,
        description:
          "Anglais, niveau A1 : dire ce qu'on sait faire. « I can swim. », « He can run. », « I cannot sing. », « Can you dance? / Yes, I can. / No, I cannot. » Verbes fermés : run, jump, swim, sing, dance, read, write, draw, cook, climb. can ne prend jamais de s (« She can swim », jamais « She cans ») et se place avant le verbe, sans « to ».",
      },
      {
        key: "an-ce2-home",
        games: [
          { kind: "ce2-en-home-mot", count: 1 },
          { kind: "ce2-en-home-phrase", count: 2 },
          { kind: "ce2-en-home-ou", count: 1 },
          { kind: "ce2-en-home-trou", count: 2 },
          { kind: "ce2-en-home-ordre", count: 1 },
          { kind: "ce2-en-home-relier", count: 1 },
          { kind: "ce2-en-home-glisser", count: 1 },
          { kind: "ce2-en-home-ecrire", count: 1 },
        ],
        name: "La maison et où c'est",
        description:
          "Anglais, niveau A1 : la maison et les prépositions de lieu. Vocabulaire fermé : house, kitchen, bedroom, bathroom, living room, bed, table, chair, TV, cat, bag. Prépositions : in, on, under, next to, behind, in front of. Structures : « The cat is under the table. », « Where is the bag? / It is on the chair. » (l'article « the » s'introduit ici). L'enfant place un objet d'après une phrase, choisit la préposition, répond à « Where is… ? ».",
      },
      {
        key: "an-ce2-months",
        games: [
          { kind: "ce2-en-months-mot", count: 1 },
          { kind: "ce2-en-months-voisin", count: 2 },
          { kind: "ce2-en-months-anniversaire", count: 1 },
          { kind: "ce2-en-months-trou", count: 2 },
          { kind: "ce2-en-months-ordre", count: 1 },
          { kind: "ce2-en-months-relier", count: 1 },
          { kind: "ce2-en-months-glisser", count: 1 },
          { kind: "ce2-en-months-ecrire", count: 1 },
        ],
        name: "Les mois de l'année",
        palierCount: 2,
        description:
          "Anglais, niveau A1 : les mois. Vocabulaire fermé : January, February, March, April, May, June, July, August, September, October, November, December. Structure : « My birthday is in May. » L'enfant remet les mois dans l'ordre, trouve le mois d'avant ou d'après, complète une phrase avec « in » + le mois ; les mois s'écrivent avec une majuscule.",
      },
      {
        key: "an-ce2-weather",
        games: [
          { kind: "ce2-en-weather-mot", count: 1 },
          { kind: "ce2-en-weather-phrase", count: 1 },
          { kind: "ce2-en-weather-question", count: 1 },
          { kind: "ce2-en-weather-trou", count: 2 },
          { kind: "ce2-en-weather-ordre", count: 1 },
          { kind: "ce2-en-weather-relier", count: 1 },
          { kind: "ce2-en-weather-saison", count: 1 },
          { kind: "ce2-en-weather-glisser", count: 1 },
          { kind: "ce2-en-weather-ecrire", count: 1 },
        ],
        name: "Le temps qu'il fait",
        palierCount: 2,
        description:
          "Anglais, niveau A1 : la météo et les saisons du Sénégal. Vocabulaire fermé : sunny, rainy, windy, cloudy, hot, cold, dry season, rainy season. Structures : « It is hot today. », « What is the weather like? / It is sunny. », « It is the rainy season in July. » L'enfant associe le mot à l'émoji (☀️ sunny, 🌧️ rainy, 💨 windy, ☁️ cloudy, 🥵 hot, 🥶 cold) et choisit la phrase qui décrit une image.",
      },
      {
        key: "an-ce2-clock",
        games: [
          { kind: "ce2-en-clock-phrase", count: 2 },
          { kind: "ce2-en-clock-heure", count: 1 },
          { kind: "ce2-en-clock-trou", count: 2 },
          { kind: "ce2-en-clock-question", count: 1 },
          { kind: "ce2-en-clock-relier", count: 1 },
          { kind: "ce2-en-clock-ordre", count: 1 },
          { kind: "ce2-en-clock-glisser", count: 1 },
          { kind: "ce2-en-clock-ecrire", count: 1 },
        ],
        name: "L'heure en anglais",
        palierCount: 3,
        description:
          "Anglais, niveau A1 : l'heure pile et la demie. « What time is it? / It is seven o'clock. », « It is half past seven. » Nombres de one à twelve. L'enfant choisit la bonne phrase pour une heure écrite en chiffres (7:00, 7:30), associe une heure à son horloge décrite en mots, remet des moments de la journée dans l'ordre ; pas de « quarter past », pas de « to ».",
      },
    ],
    CM1: [
      {
        key: "an-cm1-present-simple",
        name: "Ce que je fais : le présent",
        palierCount: 4,
        description:
          "Anglais, niveau A1+ : le présent simple avec I, you, we, they. « I play football. », « We eat rice. », « They do not play. », « Do you play football? / Yes, I do. / No, I do not. » Verbes fermés : play, eat, drink, read, write, watch, like, go, have, study. Adverbes de fréquence, placés avant le verbe : always, usually, sometimes, never (« I always eat breakfast. »). Pas de he, she, it dans cette thématique.",
      },
      {
        key: "an-cm1-he-she-it",
        name: "He, she, it : le s du verbe",
        palierCount: 4,
        description:
          "Anglais, niveau A1+ : le présent simple à la troisième personne. « He plays. », « She eats rice. », « It sleeps. » Règle : on ajoute -s au verbe (plays, eats), -es après s, sh, ch ou o (watches, goes), et have devient has. Négation et question : « She does not play. », « Does he play football? / Yes, he does. » : après does, le verbe reste sans s. Verbes : play, eat, read, watch, go, have, drink, write.",
      },
      {
        key: "an-cm1-routine",
        name: "Ma journée en anglais",
        palierCount: 3,
        description:
          "Anglais, niveau A1+ : la routine. « I get up at six o'clock. », « I have breakfast. », « I go to school. », « I have lunch. », « I do my homework. », « I go to bed at nine o'clock. » Moments : in the morning, in the afternoon, in the evening, at night. L'enfant remet les moments d'une journée dans l'ordre, complète avec at ou in, associe une phrase à une heure ; présent simple seulement.",
      },
      {
        key: "an-cm1-continuous",
        name: "En ce moment : le -ing",
        palierCount: 4,
        description:
          "Anglais, niveau A1+ : le présent continu. « I am reading. », « She is cooking. », « They are playing football. », « What are you doing? » Verbes : read, cook, play, eat, drink, write, run, swim, dance, sleep. Orthographe : read → reading, play → playing, write → writing, dance → dancing, run → running, swim → swimming. L'enfant choisit am, is ou are + verbe en -ing, et distingue « I play football every day » (une habitude) de « I am playing football now » (en ce moment).",
      },
      {
        key: "an-cm1-jobs",
        name: "Les métiers en anglais",
        palierCount: 2,
        description:
          "Anglais, niveau A1+ : les métiers. Vocabulaire fermé : teacher, doctor, nurse, farmer, fisherman, driver, tailor, trader, police officer, student. Structures : « My father is a driver. », « She is a nurse. », « What does your mother do? / She is a teacher. » L'enfant associe le métier à une situation (🩺 doctor, 🎣 fisherman, 🚗 driver), complète avec « a », choisit la bonne réponse à « What does he do? ».",
      },
      {
        key: "an-cm1-market",
        name: "Au marché en anglais",
        palierCount: 3,
        description:
          "Anglais, niveau A1+ : acheter. « How much is it? / It is five hundred francs. », « I would like two mangoes, please. », « A kilo of rice, please. » Nombres jusqu'à 100 (twenty, thirty… one hundred) et centaines rondes jusqu'à one thousand. Pluriels réguliers : -s (bananas, onions), -es (mangoes, tomatoes). Produits : mango, banana, tomato, onion, orange, egg, fish, bread, rice. Monnaie : le franc (FCFA).",
      },
      {
        key: "an-cm1-describe",
        name: "Décrire une personne ou un objet",
        palierCount: 3,
        description:
          "Anglais, niveau A1+ : décrire. Adjectifs fermés : tall, short, big, small, old, young, new, happy, sad, strong, beautiful. « He is tall. », « She has got long black hair. », « It is a big red ball. » En anglais l'adjectif se place AVANT le nom et ne s'accorde jamais (« two small dogs », pas « two smalls dogs »). Cheveux : long, short, black, brown ; yeux : brown, black, green, blue.",
      },
    ],
    CM2: [
      {
        key: "an-cm2-was-were",
        games: [
          { kind: "cm2-en-wv-phrase", count: 3 },
          { kind: "cm2-en-wv-trou", count: 2 },
          { kind: "cm2-en-wv-ecrire", count: 1 },
          { kind: "cm2-en-wv-ordre", count: 1 },
          { kind: "cm2-en-wv-relier", count: 1 },
          { kind: "cm2-en-wv-glisser", count: 2 },
        ],
        name: "Hier : was et were",
        palierCount: 3,
        description:
          "Anglais, niveau A2 : le verbe be au passé. I was, you were, he was, she was, it was, we were, they were ; négation (« I was not », « They were not ») ; question (« Were you at home? / Yes, I was. / No, I was not. »). Repères de temps : yesterday, last night, last week, last Sunday. L'enfant choisit was ou were et complète des phrases sur ce qui s'est passé hier (« Yesterday I was at school. »).",
      },
      {
        key: "an-cm2-past-regular",
        games: [
          { kind: "cm2-en-pr-phrase", count: 3 },
          { kind: "cm2-en-pr-trou", count: 2 },
          { kind: "cm2-en-pr-ecrire", count: 1 },
          { kind: "cm2-en-pr-ordre", count: 1 },
          { kind: "cm2-en-pr-relier", count: 1 },
          { kind: "cm2-en-pr-glisser", count: 2 },
        ],
        name: "Raconter hier : verbes en -ed",
        palierCount: 4,
        description:
          "Anglais, niveau A2 : le passé simple des verbes réguliers. « I played football yesterday. », « She watched TV. », « We visited my grandmother. » Verbes : play, watch, visit, walk, cook, help, clean, listen, study (studied), dance (danced). Négation et question avec did : « I did not play. », « Did you watch TV? / Yes, I did. » : après did, le verbe reste à l'infinitif (« Did you play », jamais « Did you played »). Repères : yesterday, last week, two days ago.",
      },
      {
        key: "an-cm2-past-irregular",
        games: [
          { kind: "cm2-en-pi-phrase", count: 3 },
          { kind: "cm2-en-pi-trou", count: 2 },
          { kind: "cm2-en-pi-ecrire", count: 1 },
          { kind: "cm2-en-pi-ordre", count: 1 },
          { kind: "cm2-en-pi-relier", count: 1 },
          { kind: "cm2-en-pi-glisser", count: 2 },
        ],
        name: "Raconter hier : verbes irréguliers",
        palierCount: 4,
        description:
          "Anglais, niveau A2 : le passé simple des verbes irréguliers, liste fermée : go → went, have → had, see → saw, eat → ate, drink → drank, buy → bought, come → came, make → made, take → took, write → wrote. « I went to the market yesterday. », « We ate rice. » Négation et question : « I did not go. », « Did you see Awa? » : le verbe reste à l'infinitif après did. L'enfant associe chaque verbe à son passé et choisit la bonne forme dans une phrase.",
      },
      {
        key: "an-cm2-going-to",
        games: [
          { kind: "cm2-en-gt-phrase", count: 3 },
          { kind: "cm2-en-gt-trou", count: 2 },
          { kind: "cm2-en-gt-ecrire", count: 1 },
          { kind: "cm2-en-gt-ordre", count: 1 },
          { kind: "cm2-en-gt-relier", count: 1 },
          { kind: "cm2-en-gt-glisser", count: 2 },
        ],
        name: "Demain : être going to",
        palierCount: 3,
        description:
          "Anglais, niveau A2 : dire ce qu'on va faire. « I am going to visit my grandmother. », « She is going to play football tomorrow. », « What are you going to do? » Négation : « I am not going to… ». Repères : tomorrow, tonight, next week, next month. Le verbe après going to reste à l'infinitif, sans s ni -ing (« He is going to eat », jamais « going to eats »). Verbes déjà vus seulement.",
      },
      {
        key: "an-cm2-comparatives",
        games: [
          { kind: "cm2-en-cp-phrase", count: 3 },
          { kind: "cm2-en-cp-trou", count: 2 },
          { kind: "cm2-en-cp-ecrire", count: 1 },
          { kind: "cm2-en-cp-ordre", count: 1 },
          { kind: "cm2-en-cp-relier", count: 1 },
          { kind: "cm2-en-cp-glisser", count: 2 },
        ],
        name: "Comparer : plus grand, le plus grand",
        palierCount: 4,
        description:
          "Anglais, niveau A2 : comparer. Adjectifs courts : tall → taller → the tallest, small → smaller → the smallest, big → bigger → the biggest (consonne doublée), old → older → the oldest, fast → faster → the fastest. Adjectifs longs : beautiful → more beautiful → the most beautiful, expensive → more expensive → the most expensive. Irrégulier : good → better → the best. Structures : « Awa is taller than Modou. », « This mango is the biggest. » Jamais « more taller ».",
      },
      {
        key: "an-cm2-directions",
        games: [
          { kind: "cm2-en-dr-phrase", count: 3 },
          { kind: "cm2-en-dr-trou", count: 2 },
          { kind: "cm2-en-dr-ecrire", count: 1 },
          { kind: "cm2-en-dr-ordre", count: 1 },
          { kind: "cm2-en-dr-relier", count: 1 },
          { kind: "cm2-en-dr-glisser", count: 2 },
        ],
        name: "Demander son chemin",
        palierCount: 3,
        description:
          "Anglais, niveau A2 : s'orienter en ville. Lieux : school, market, mosque, hospital, shop, bank, post office, bus station. Indications : go straight on, turn left, turn right, next to, opposite, between. Structures : « Excuse me, where is the market? », « Go straight on and turn left. », « It is next to the bank. » L'enfant suit un itinéraire décrit en anglais, choisit la bonne indication, remet un dialogue dans l'ordre.",
      },
      {
        key: "an-cm2-questions",
        games: [
          { kind: "cm2-en-qs-phrase", count: 3 },
          { kind: "cm2-en-qs-trou", count: 2 },
          { kind: "cm2-en-qs-ecrire", count: 1 },
          { kind: "cm2-en-qs-ordre", count: 1 },
          { kind: "cm2-en-qs-relier", count: 1 },
          { kind: "cm2-en-qs-glisser", count: 2 },
        ],
        name: "Poser des questions",
        palierCount: 3,
        description:
          "Anglais, niveau A2 : les mots interrogatifs : what, where, who, when, why, how, how many, how much ; « Because… » pour répondre à why. Exemples : « Who is he? / He is my brother. », « When is your birthday? / It is in May. », « Why are you sad? / Because I am tired. », « How many books have you got? » L'enfant associe chaque question au type de réponse (une personne, un lieu, un moment, une raison, un nombre, un prix) et complète des questions avec le bon mot.",
      },
      {
        key: "an-cm2-reading",
        games: [
          { kind: "cm2-en-rd-phrase", count: 3 },
          { kind: "cm2-en-rd-trou", count: 2 },
          { kind: "cm2-en-rd-ecrire", count: 1 },
          { kind: "cm2-en-rd-ordre", count: 1 },
          { kind: "cm2-en-rd-relier", count: 1 },
          { kind: "cm2-en-rd-glisser", count: 2 },
        ],
        name: "Lire un petit texte",
        palierCount: 4,
        description:
          "Anglais, niveau A2 : comprendre un texte court. Textes de 3 à 5 phrases, écrits pour l'exercice (jamais copiés d'un auteur), sur soi, la famille, la journée, le quartier, avec le vocabulaire et les structures de toutes les thématiques précédentes. Le texte est recopié en entier dans l'énoncé de chaque exercice. L'enfant répond à des questions de compréhension (qcm, ou vrai / faux en deux zones « True » et « False »), ou remet les répliques d'un petit dialogue dans l'ordre.",
      },
    ],
  },
};
