/**
 * FRANÇAIS — Domaine 1 du CEB : Langue et communication.
 *
 * Source : guides pédagogiques des étapes 1, 2 et 3 (MEN). C'est le seul
 * domaine dont les guides attribuent les paliers classe par classe (CI 1-4,
 * CP 5-8, CE1 1-3, CE2 4-6, CM1 1-4, CM2 5-8) : la répartition ci-dessous
 * les suit. Au CM, les guides ne disent pas quelle notion de grammaire ou
 * quel mode verbal revient au CM1 ou au CM2 : la répartition de ces deux
 * classes est proposée (indicatif au CM1, conditionnel et subjonctif au CM2).
 */
import type { ProgrammeSubject } from "./types";

export const FRANCAIS: ProgrammeSubject = {
  key: "francais",
  name: "Français",
  aliases: ["Francais", "Langue et communication"],
  icon: "Book",
  color: "#db2777",
  order: 2,
  domain: "Langue et communication",
  classes: {
    CI: [
      {
        key: "fr-ci-politesse",
        name: "Bonjour, merci, s'il te plaît",
        description:
          "Communication orale, paliers 1 à 4 du CI : saluer et prendre congé (bonjour, au revoir), se présenter (je m'appelle…), demander une information (où est… ? combien… ?), dire un besoin ou un sentiment (j'ai soif, je suis content), demander la permission ou un service (est-ce que je peux… ? s'il te plaît, merci). Exercices : choisir la bonne phrase pour une situation de la vie de l'enfant (à l'école, au marché, à la maison), relier une situation et la formule qui convient. L'enfant ne lit pas encore : options très courtes, illustrées d'un émoji.",
      },
      {
        key: "fr-ci-sons-1",
        name: "Les sons a, i, o, l, t",
        description:
          "Lecture, palier 2 du CI : entendre et reconnaître les sons [a], [i], [o], [l], [t] ; trouver le mot où l'on entend un son (ami, lit, olive, tomate) ; lire les syllabes la, li, lo, ta, ti, to. À l'oral, n'importe quel mot connu de l'enfant ; à l'écrit, seulement des syllabes et des mots faits de ces lettres (lit, Lola, Toto, tata, tôt). Un émoji illustre chaque mot.",
      },
      {
        key: "fr-ci-sons-2",
        name: "Les sons n, e, p, d, m, b",
        description:
          "Lecture, palier 3 du CI : les sons [n], [ə] (le, me, ne), [p], [d], [m], [b], avec les sons déjà vus (a, i, o, l, t). Syllabes na, ne, pa, po, di, da, ma, mi, bo, ba ; mots à lire faits de ces lettres seulement (papa, dodo, moto, malade, tomate, midi, Modou, Penda). Trouver le son dans un mot entendu, assembler deux syllabes.",
      },
      {
        key: "fr-ci-sons-3",
        name: "Les sons f, u, ou, é, è",
        description:
          "Lecture, palier 4 du CI (première partie) : les sons [f], [y] (u), [u] (ou), [e] (é), [ɛ] (è), avec les sons déjà vus. Syllabes fa, fu, fou, pou, dé, mè ; mots : poule, loupe, fumée, été, élève, père, mère, café, bébé, foulard. Distinguer u et ou, é et è.",
      },
      {
        key: "fr-ci-sons-4",
        name: "Les sons s, r, au, eau, on, om",
        description:
          "Lecture, palier 4 du CI (seconde partie) : les sons [s], [r], [o] écrit au ou eau, [ɔ̃] écrit on ou om. Mots : sac, rat, robe, sel, radio, auto, bateau, eau, mouton, savon, salon, bonbon, ballon. Trouver comment s'écrit le son (au ou eau, on ou om) dans des mots connus.",
      },
      {
        key: "fr-ci-alphabet",
        name: "Les lettres et les mots",
        description:
          "Acquisition globale de l'alphabet et des mots usuels ; graphisme et écriture scripte, début de la cursive au palier 4. Reconnaître une lettre, associer majuscule et minuscule, remettre des lettres dans l'ordre pour écrire un mot connu (papa, ami, moto, école), reconnaître des mots de la classe (maître, cahier, ardoise, craie).",
      },
      {
        key: "fr-ci-phrases",
        name: "Mes premières phrases",
        description:
          "Production d'écrits du CI : énoncés d'une à deux phrases, étiquettes-mots, dictée à l'adulte. Remettre des étiquettes-mots dans l'ordre (« Lola a une moto. »), choisir le mot qui complète une phrase illustrée, la majuscule au début et le point à la fin. Phrases faites de mots déjà lus.",
      },
    ],
    CP: [
      {
        key: "fr-cp-lecture",
        name: "Je lis des syllabes et des mots",
        description:
          "Lecture du CP : révision des sons étudiés au CI (a, i, o, l, t, n, e, p, d, m, b, f, u, ou, é, è, s, r, au, eau, on, om) ; lire des syllabes et des mots de deux ou trois syllabes ; distinguer des sons proches (é/è, ou/u, on/o, b/d, p/b) ; gagner en fluidité. Mots du quotidien : mouton, bateau, tomate, savon, poulet, marmite, malade.",
      },
      {
        key: "fr-cp-inviter",
        name: "Inviter et conseiller",
        description:
          "Communication orale, palier 5 du CP : invitation et recommandation. Choisir la bonne formule pour inviter (« Viens à mon baptême samedi », « Je t'invite à jouer au ballon ») et pour recommander (« Fais attention en traversant », « Lave-toi les mains avant de manger ») ; retrouver qui invite, qui, où, quand ; répondre poliment à une invitation.",
      },
      {
        key: "fr-cp-raconter",
        name: "Raconter une histoire",
        description:
          "Palier 6 du CP : la narration. Remettre dans l'ordre les étapes d'une petite histoire (d'abord, ensuite, enfin), retrouver qui fait quoi dans un petit texte narratif de 2 à 4 phrases, répondre aux questions qui ? où ? quand ?. Histoires de la vie de l'enfant : le marché, la récréation, la pêche avec le grand-père.",
      },
      {
        key: "fr-cp-decrire",
        name: "Décrire et comparer",
        description:
          "Palier 7 du CP : description et comparaison. Décrire un objet, un animal ou une personne (couleur, taille, forme), comparer (plus grand que, plus petit que, aussi… que), les mots contraires (grand/petit, chaud/froid, lourd/léger), les adjectifs simples placés avec leur nom.",
      },
      {
        key: "fr-cp-consignes",
        name: "Les consignes",
        description:
          "Palier 8 du CP : les énoncés injonctifs. Comprendre une consigne (entoure, colorie, découpe, relie, souligne, recopie), remettre dans l'ordre les étapes d'une recette simple (le jus de bissap, le jus de bouye) ou d'un bricolage, les verbes d'action à l'impératif.",
      },
      {
        key: "fr-cp-ecrire",
        name: "J'écris des phrases",
        description:
          "Production d'écrits du CP : énoncés d'au moins deux phrases (raconter, décrire, donner une consigne). Remettre des mots dans l'ordre pour faire une phrase, majuscule et point, compléter une phrase avec le bon mot, singulier et pluriel du nom (un/des, le/les) vus dans les phrases. Grammaire, vocabulaire et orthographe restent intégrés à l'écrit : pas de leçon de règle.",
      },
    ],
    CE1: [
      {
        key: "fr-ce1-phrase",
        name: "La phrase, le verbe et le sujet",
        description:
          "Grammaire, palier 1 du CE1 : reconnaître une phrase (majuscule, point), trouver le verbe (le mot qui change quand on dit hier ou demain), le sujet (qui fait l'action), le complément, le groupe nominal (déterminant et nom). Phrases simples de la vie de tous les jours.",
      },
      {
        key: "fr-ce1-nom-adjectif",
        name: "Le nom, l'article et l'adjectif",
        description:
          "Grammaire, palier 2 du CE1 : les articles (le, la, les, l', un, une, des), l'adjectif qualificatif, le genre (masculin, féminin) et le nombre (singulier, pluriel) dans le groupe nominal ; accorder l'adjectif avec le nom (un grand arbre, une grande case, des grands arbres).",
      },
      {
        key: "fr-ce1-present-passe",
        name: "Le présent et le passé composé",
        description:
          "Conjugaison, paliers 1 et 2 du CE1 : le présent et le passé composé des verbes du 1er groupe (chanter, jouer, manger, danser), des verbes avoir et être, et des verbes aller, partir et finir, à toutes les personnes. Reconnaître le temps grâce à aujourd'hui, maintenant, hier.",
      },
      {
        key: "fr-ce1-imperatif-futur",
        name: "L'impératif et le futur",
        description:
          "Conjugaison et grammaire, palier 3 du CE1 : l'impératif présent (tu, nous, vous) et le futur simple des verbes du 1er groupe ; la phrase impérative (« Ferme la porte. »), la phrase impersonnelle (« Il pleut. ») et la phrase infinitive (« Ne pas marcher sur les fleurs. »).",
      },
      {
        key: "fr-ce1-homophones",
        name: "a/à, et/est, on/ont",
        description:
          "Orthographe du CE1 : les homophones a/à, et/est, on/ont, avec les astuces (a → avait, est → était, ont → avaient) ; l'accord du verbe avec son sujet ; la ponctuation (point, point d'interrogation, point d'exclamation, virgule). Exercices de choix de mots dans des phrases.",
      },
      {
        key: "fr-ce1-dictionnaire",
        name: "Le dictionnaire et les mots de liaison",
        description:
          "Vocabulaire du CE1 : l'ordre alphabétique (ranger des mots, trouver le mot qui vient avant ou après dans le dictionnaire), les connecteurs de temps (d'abord, ensuite, puis, enfin) et de logique (mais, parce que, donc), les mots d'un même thème (le marché, l'école, la ferme, la mer).",
      },
      {
        key: "fr-ce1-lecture",
        name: "Lire et comprendre",
        description:
          "Lecture, paliers 1 à 3 du CE1 : comprendre un texte narratif (qui, quoi, où, quand), un texte descriptif (les caractéristiques d'un animal, d'un lieu) et un texte injonctif (suivre une recette, une règle de jeu). Textes courts de 3 à 6 phrases, écrits pour l'exercice, dans un cadre sénégalais.",
      },
    ],
    CE2: [
      {
        key: "fr-ce2-cod-coi",
        name: "COD, COI et pronoms",
        description:
          "Grammaire, palier 4 du CE2 : le complément d'objet direct et le complément d'objet indirect ; les pronoms personnels sujets et compléments (le, la, les, lui, leur) qui remplacent un nom pour éviter une répétition.",
      },
      {
        key: "fr-ce2-cc",
        name: "Les compléments circonstanciels",
        description:
          "Grammaire, palier 5 du CE2 : les compléments circonstanciels de lieu, de temps et de manière ; la phrase nominale (« Défense de fumer. », « Grande fête au village. ») ; articles définis et indéfinis.",
      },
      {
        key: "fr-ce2-determinants",
        name: "Possessifs et démonstratifs",
        description:
          "Grammaire, palier 6 du CE2 : les adjectifs possessifs (mon, ton, son, notre, votre, leur, mes, tes, ses, nos, vos, leurs) et démonstratifs (ce, cet, cette, ces) ; choisir le bon selon le genre et le nombre du nom.",
      },
      {
        key: "fr-ce2-imparfait",
        name: "L'imparfait et le passé composé",
        description:
          "Conjugaison, palier 4 du CE2 : l'imparfait des verbes usuels des trois groupes ; le passé composé de faire, courir, voir et prendre ; choisir entre imparfait et passé composé dans un petit récit.",
      },
      {
        key: "fr-ce2-imperatif-futur",
        name: "L'impératif et le futur simple",
        description:
          "Conjugaison, paliers 5 et 6 du CE2 : l'impératif des verbes des 2e et 3e groupes (finis, prends, fais, viens, va) ; le futur simple de faire, partir, voir, venir, avoir, être, aller et finir.",
      },
      {
        key: "fr-ce2-orthographe",
        name: "Féminin, pluriel, ou/où, son/sont",
        description:
          "Orthographe, paliers 4 à 6 du CE2 : le féminin des noms (un lion / une lionne, un boulanger / une boulangère, un maître / une maîtresse), le pluriel des noms (-s, -x, -al/-aux), les homophones ou/où et son/sont.",
      },
      {
        key: "fr-ce2-vocabulaire",
        name: "Synonymes, familles, homonymes",
        description:
          "Vocabulaire du CE2 : synonymes, familles de mots (terre, terrain, enterrer), homonymes (vers, verre, vert ; mer, mère, maire), jeux de mots, formules pour commencer et pour terminer une lettre, l'usage du dictionnaire.",
      },
      {
        key: "fr-ce2-lecture",
        name: "Lire une lettre, une affiche, un poème",
        description:
          "Lecture, paliers 4 à 6 du CE2 : retrouver dans une lettre l'expéditeur, le destinataire, la date et la formule de politesse ; lire une affiche (quoi, où, quand, combien) ; reconnaître un poème (vers, strophes, rimes). Textes écrits pour l'exercice.",
      },
    ],
    CM1: [
      {
        key: "fr-cm1-recit",
        name: "Comprendre un récit et une description",
        description:
          "Lecture et production d'écrits, paliers 1 et 2 du CM1 : textes narratifs et descriptifs ; personnages, lieux, ordre des événements, temps du récit ; les mots qui décrivent. Textes de 5 à 10 phrases écrits pour l'exercice, dans un cadre sénégalais.",
      },
      {
        key: "fr-cm1-informer",
        name: "Les textes qui expliquent et qui informent",
        description:
          "Paliers 3 et 4 du CM1 : le texte injonctif (règle de jeu, notice, recette) et le texte informatif (article, fiche documentaire) ; retrouver une information, comprendre l'ordre des étapes, le rôle du titre et des intertitres.",
      },
      {
        key: "fr-cm1-grammaire",
        name: "Nature et fonction des mots",
        description:
          "Grammaire de l'étape 3 (répartition proposée pour le CM1) : nature des mots (nom, déterminant, adjectif, verbe, adverbe, pronom) ; fonctions (sujet, COD, COI, attribut du sujet, compléments circonstanciels) ; types de phrases (déclarative, interrogative, exclamative, impérative) et formes (affirmative, négative).",
      },
      {
        key: "fr-cm1-indicatif",
        name: "Les temps de l'indicatif",
        description:
          "Conjugaison de l'étape 3 (répartition proposée pour le CM1) : présent, imparfait, futur simple, passé composé et passé simple (3e personne) des verbes usuels des trois groupes ; choisir le temps qui convient dans un récit.",
      },
      {
        key: "fr-cm1-accords",
        name: "Les accords",
        description:
          "Orthographe grammaticale du CM1 : accord du verbe avec son sujet (même éloigné ou placé après le verbe), accord de l'adjectif, accord du participe passé employé avec être, pluriel des noms et des adjectifs (-al/-aux, -eau/-eaux, -ou/-oux).",
      },
      {
        key: "fr-cm1-vocabulaire",
        name: "Préfixes, suffixes et sens des mots",
        description:
          "Vocabulaire du CM1 : formation des mots (préfixes in-, im-, re-, dé- ; suffixes -eur, -age, -ment), synonymes, contraires, sens propre et sens figuré, champ lexical d'un thème (la pêche, l'hivernage, la fête).",
      },
      {
        key: "fr-cm1-homophones",
        name: "Les homophones grammaticaux",
        description:
          "Orthographe du CM1 : a/à, et/est, on/ont, son/sont, ou/où, ces/ses, ce/se, leur/leurs, mais/mes, la/l'a/là ; trouver le bon mot dans une phrase grâce aux astuces de remplacement.",
      },
    ],
    CM2: [
      {
        key: "fr-cm2-informer",
        name: "Lire pour s'informer et comprendre",
        description:
          "Palier 5 du CM2 : textes informatifs et explicatifs (pourquoi, comment) ; repérer l'idée principale, les causes et les conséquences, les mots de liaison (car, donc, c'est pourquoi, parce que).",
      },
      {
        key: "fr-cm2-argumenter",
        name: "Donner son avis",
        description:
          "Palier 6 du CM2 : le texte argumentatif et le débat. Distinguer un fait d'une opinion, trouver l'argument qui défend une idée, les connecteurs (d'abord, de plus, enfin, cependant, au contraire), les règles d'un débat respectueux.",
      },
      {
        key: "fr-cm2-dialogue",
        name: "Le dialogue",
        description:
          "Palier 7 du CM2 : le texte dialogué. La ponctuation du dialogue (deux-points, guillemets, tiret), les verbes de parole (demander, répondre, s'écrier, murmurer), passer du dialogue au récit, la conversation au téléphone.",
      },
      {
        key: "fr-cm2-poesie",
        name: "La poésie",
        description:
          "Palier 8 du CM2 : l'expression poétique. Vers, strophes, rimes, sonorités, comparaisons ; jouer avec les mots, déclamer. Les poètes du Sénégal (Léopold Sédar Senghor, Birago Diop) peuvent être nommés, mais ne JAMAIS leur attribuer des vers : les vers des exercices sont écrits pour l'exercice et présentés comme tels.",
      },
      {
        key: "fr-cm2-modes",
        name: "Conditionnel et subjonctif",
        description:
          "Conjugaison de l'étape 3 (répartition proposée pour le CM2) : les quatre modes (indicatif, impératif, conditionnel, subjonctif) ; le conditionnel présent et le subjonctif présent des verbes usuels (être, avoir, aller, faire, finir, prendre), le subjonctif après « il faut que » et « pour que ».",
      },
      {
        key: "fr-cm2-phrase-complexe",
        name: "La phrase complexe",
        description:
          "Grammaire de l'étape 3 (répartition proposée pour le CM2) : propositions indépendantes, juxtaposées, coordonnées ; la proposition subordonnée relative (qui, que, dont, où), complément du nom ; le COI et le COS (complément d'objet second).",
      },
      {
        key: "fr-cm2-cfee",
        name: "Révisions du CFEE",
        description:
          "Préparation au Certificat de Fin d'Études Élémentaires : accord du participe passé (avec être et avec avoir), homophones grammaticaux, pluriels difficiles, terminaisons -é/-er/-ez/-ait, conjugaison des verbes usuels aux temps de l'indicatif.",
      },
    ],
  },
};
