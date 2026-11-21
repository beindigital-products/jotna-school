// Écrit src/social/posts.json : le planning (2 publications par jour pendant 20 jours, du 19 octobre au 7 novembre) et la banque de contenus.
// Usage : node scripts/build-posts.mjs
//
// Règles de fond (fiche des faits du dépôt, 2026-10-11, puis consignes du propriétaire) :
// - l'offre se dit toujours « gratuit pendant le lancement pour l'année scolaire 2026-2027» ;
// - AUCUNE vidéo pour enfants n'invite l'enfant à s'inscrire (ni à demander à ses parents de le faire) :
//   elles finissent sur un au revoir amusant (« à la prochaine vidéo, à bientôt ») ;
// - chaque vidéo dure au moins une minute ; les cours d'enfants sont de vrais mini-cours,
//   avec la classe et la matière affichées sur tous les plans ;
// - on n'annonce pas l'application iOS/Android comme disponible (la landing dit « à venir ») ;
// - Arabe & Coran est un module activé par l'école ;
// - chiffres permis : 7 matières, CI au CM2, paliers de 10 exercices, 7/10 pour valider, 50 bonnes réponses
//   par niveau, plus de 20 badges, 10 formats d'exercices.
import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const R = (text, pause) => ({ text, ...(pause ? { pause } : {}) });
const S = (text, pause) => ({ who: "steve", text, ...(pause ? { pause } : {}) });
const SV2 = (text, pause) => ({ who: "steve", model: "v2", text, ...(pause ? { pause } : {}) });

const hook = (title, voice, o = {}) => ({ kind: "hook", title, voices: [voice], ...o });
const pio = (pose, voices, o = {}) => ({ kind: "pio", pose, voices: [].concat(voices), ...o });
const phone = (screen, voices, o = {}) => ({ kind: "phone", screen, voices: [].concat(voices), ...o });
const bullets = (title, items, voices, o = {}) => ({ kind: "bullets", title, items, voices: [].concat(voices), ...o });
const steps = (title, items, voices, o = {}) => ({ kind: "steps", title, items, voices: [].concat(voices), ...o });
const stat = (value, label, sub, voice) => ({ kind: "stat", value, label, sub, voices: [voice] });
const board = (title, lines, voices, o = {}) => ({ kind: "board", title, lines: lines.map((l) => (typeof l === "string" ? { text: l } : l)), voices: [].concat(voices), ...o });
const cta = (voice, line, button) => ({ kind: "cta", voices: [voice], min: 3.6, ...(line ? { line } : {}), ...(button ? { button } : {}) });
const outro = (voice, line) => ({ kind: "outro", voices: [voice], min: 4, tail: 1, ...(line ? { line } : {}) });
const quiz = (question, options, answer, explain, ask, reveal) => ({
  kind: "quiz", question, options, answer, explain, voices: [ask, { ...reveal, pause: 4 }], tail: 1.2,
});

// L'offre, dite et écrite toujours de la même façon (une seule voix générée, réutilisée partout).
const OFFRE = "gratuit pendant le lancement pour l'année scolaire 2026-2027";
const FREE_SUB = ["Les écoles", "Les professeurs", "Les parents"];
const FREE = { kind: "free", sub: FREE_SUB, voices: [R(`[proudly] Et le meilleur : c'est ${OFFRE}, pour les écoles, les professeurs et les parents.`)] };
const CTA = cta(R("[warmly] Jotna School. Apprendre devient un réflexe. Créez votre compte sur jotnaschool.com."));
const CTA_PROF = cta(R("[warmly] Créez votre compte professeur sur jotnaschool.com."), "Plus de temps pour vos élèves.", "Créez votre compte professeur");
const CTA_ECOLE = cta(R("[warmly] Inscrivez votre école sur jotnaschool.com."), "Toute l'école avance ensemble.", "Inscrivez votre école");
const CTA_ARABE = cta(R("[warmly] Un module activé par l'école. Parlez-en à la vôtre."), "Arabe & Coran", "Parlez-en à votre école");

const TAGS = {
  tous: ["#JotnaSchool", "#Senegal", "#ApprendreEnJouant", "#EcoleSenegal", "#Education"],
  parents: ["#JotnaSchool", "#ParentsSenegal", "#AideAuxDevoirs", "#Education", "#Senegal"],
  ecoles: ["#JotnaSchool", "#EcoleSenegal", "#Directeur", "#EdTech", "#Senegal"],
  profs: ["#JotnaSchool", "#Professeur", "#EnseignantSenegal", "#EdTech", "#Pedagogie"],
  enfants: ["#JotnaSchool", "#MiniCours", "#Pio", "#ApprendreEnJouant", "#Ecole"],
};

const posts = [];
const add = (p) => posts.push(p);

/** Un mini-cours pour enfants : accroche avec la classe, objectif, leçons, trois questions, récap, au revoir. */
const course = ({ id, day, slot, title, level, hookTitle, hookVoice, goal, lessons, quizzes, recap, bye, hook: h, body }) => ({
  id, day, slot, type: "enfants", audience: "enfants", title, level, format: "video", music: "africa", hook: h, body,
  cover: `Titre « ${hookTitle} » avec la classe ${level}`,
  beats: [
    hook(hookTitle, S(hookVoice), { pose: "cheer" }),
    pio("think", S(goal), { title: "Au programme", text: "Un petit cours, puis trois questions pour t'entraîner !" }),
    ...lessons.map((l) => board(l.title, l.lines, l.voices.map((v) => S(v)))),
    ...quizzes.map((q) => quiz(q.q, q.options, q.answer, q.explain, S(q.ask), S(q.reveal))),
    board("On résume", recap.lines, S(recap.voice)),
    outro(S(bye)),
  ],
});

/* ───── Jour 1 ───── */
add({
  id: "d01-midi-pub-jeu", day: 1, slot: "midi", type: "pub", audience: "tous", title: "Et si apprendre devenait un jeu ?", format: "video", music: "africa",
  hook: "Et si apprendre devenait un jeu ?",
  body: `Jotna School transforme le programme du CI au CM2 en aventure, avec Pio le lionceau : 7 matières, des paliers de 10 exercices, des étoiles à gagner.\n\nGratuit pendant le lancement pour l'année scolaire 2026-2027.`,
  cover: "Titre « Et si apprendre devenait un jeu ? » et Pio qui salue",
  beats: [
    hook("Et si apprendre devenait un jeu ?", R("[warmly] Et si apprendre devenait un jeu ? Imaginez : votre enfant ouvre Jotna School, et un lionceau explorateur l'attend."), { marker: "rgba(255,210,48,0.85)" }),
    pio("hello", S("Bonjour ! Je suis Pio, le lionceau explorateur. J'accompagne les enfants, du CI au CM2, dans chacune de leurs matières."), { title: "Voici Pio" }),
    stat("7", "matières, du CI au CM2", "Français · Maths · Éveil scientifique · Histoire · Géographie · Instruction civique · Éducation artistique", R("Du CI au CM2, il y a sept matières : le français, les mathématiques, l'éveil scientifique, l'histoire, la géographie, l'instruction civique et l'éducation artistique.")),
    phone("trail", R("Chaque matière est un chemin fait de paliers. Un palier, ce sont dix exercices, pour environ dix minutes de jeu. Quand l'enfant obtient sept sur dix, le palier suivant s'ouvre."), { title: "Un chemin de paliers" }),
    phone("result", R("À chaque palier, jusqu'à trois étoiles à gagner. Cinquante bonnes réponses, et c'est un niveau de plus. Et plus de vingt trophées à débloquer."), { title: "Étoiles, niveaux, trophées" }),
    pio("encourage", R("[softly] Et quand l'enfant se trompe, Pio ne gronde jamais. Il donne un indice, il encourage, et on réessaie."), { title: "Pio encourage" }),
    FREE, CTA,
  ],
});
add({
  id: "d01-soir-explicatif-pio", day: 1, slot: "soir", type: "explicatif", audience: "tous", title: "Qui est Pio ?", format: "video", music: "africa",
  hook: "Qui est Pio, le lionceau de Jotna School ?",
  body: `Pio est un lionceau explorateur. Il fête chaque progrès, et quand votre enfant se trompe, il ne gronde jamais : il encourage et donne un indice.\n\nGratuit pendant le lancement pour l'année scolaire 2026-2027.`,
  cover: "Pio qui salue avec le titre « Qui est Pio ? »",
  beats: [
    hook("Qui est Pio ?", R("[cheerfully] Voici Pio, le lionceau explorateur de Jotna School. Dans cette vidéo, on fait connaissance."), { kicker: "Rencontre" }),
    pio("hello", S("Salut ! Moi, c'est Pio. J'ai une loupe, un sac, et plein de curiosité. J'adore explorer, et j'adore apprendre."), { title: "Un explorateur" }),
    pio("cheer", R("Quand un enfant réussit un exercice, Pio fait la fête. Une étoile, un niveau, un trophée : chaque progrès est célébré."), { title: "Il fête chaque progrès" }),
    pio("encourage", R("[softly] Et quand l'enfant se trompe, Pio ne gronde jamais. Il donne un indice, il encourage, et l'enfant peut réessayer, jusqu'à cinq fois."), { title: "Une erreur ? Il encourage" }),
    pio("idle", R("Au CI et au CP, Pio lit même la consigne à voix haute, pour aider les plus petits."), { title: "Il lit les consignes" }),
    pio("salam", R("Et dans le module Arabe et Coran, Pio met un boubou vert et accompagne l'enfant lettre après lettre. Ce module est activé par l'école."), { title: "Un boubou pour l'arabe", outfit: "boubou" }),
    FREE,
    cta(R("[warmly] Pio attend votre enfant."), "Pio attend votre enfant.", "Créez votre compte"),
  ],
});

/* ───── Jour 2 ───── */
add(course({
  id: "d02-midi-enfants-fractions", day: 2, slot: "midi", title: "Mini-cours CM1 : les fractions", level: "CM1 · Mathématiques",
  hook: "Mini-cours de maths pour les CM1 : les fractions 🍕",
  body: "Au programme : ce qu'est une fraction, comment additionner deux fractions, et 3 questions pour s'entraîner. Réponds dans les commentaires avant la correction !\n\nUn mini-cours Jotna School avec Pio.",
  hookTitle: "Mini-cours : les fractions",
  hookVoice: "Salut les CM1 ! Je suis Pio. Aujourd'hui, mini-cours de mathématiques : les fractions. Prépare ton cahier !",
  goal: "Dans ce cours, tu vas comprendre ce qu'est une fraction, apprendre à additionner deux fractions, puis t'entraîner avec trois questions.",
  lessons: [
    { title: "Une fraction, c'est quoi ?", lines: ["🍕 Une pizza coupée en 4 parts égales", "Tu en manges 1 part", { text: "Tu as mangé ¼ de la pizza", big: true }, "En bas : le dénominateur (le nombre de parts)", "En haut : le numérateur (les parts prises)"],
      voices: ["Imagine une pizza coupée en quatre parts égales. Tu en manges une : tu as mangé un quart de la pizza.", "Le nombre du bas s'appelle le dénominateur : c'est le nombre de parts. Le nombre du haut, c'est le numérateur : ce sont les parts que l'on prend."] },
    { title: "Additionner des fractions", lines: [{ text: "¼ + ¼ = 2/4", big: true }, "Même dénominateur : on additionne les numérateurs", "Le dénominateur ne change pas", { text: "½ + ¼ = 2/4 + 1/4 = ¾", big: true }],
      voices: ["Quand les dénominateurs sont les mêmes, c'est facile : on additionne seulement les numérateurs. Un quart plus un quart, ça fait deux quarts.", "Et le dénominateur ne change pas, car les parts gardent la même taille. Un demi, c'est deux quarts. Donc un demi plus un quart, c'est deux quarts plus un quart : trois quarts !"] },
  ],
  quizzes: [
    { q: "2/4 + 1/4 = ?", options: ["3/4", "3/8", "2/8"], answer: 0, explain: "Même dénominateur : 2 + 1 = 3, donc 3/4", ask: "Première question. Deux quarts plus un quart. Combien ça fait ?", reveal: "Trois quarts ! On additionne les numérateurs : deux plus un égale trois, et le dénominateur reste quatre." },
    { q: "½ = ?/4", options: ["1/4", "2/4", "3/4"], answer: 1, explain: "Chaque moitié se coupe en 2 quarts", ask: "Deuxième question. Un demi, c'est combien de quarts ?", reveal: "Deux quarts ! Un demi se partage en deux quarts." },
    { q: "½ + ¼ = ?", options: ["¾", "⅔", "⅛"], answer: 0, explain: "½ = 2/4, donc 2/4 + 1/4 = ¾", ask: "Dernière question, la plus difficile. Un demi plus un quart. Réfléchis bien !", reveal: "Trois quarts ! Un demi, c'est deux quarts, et deux quarts plus un quart font trois quarts. Bravo !" },
  ],
  recap: { lines: ["Dénominateur : le nombre de parts", "Numérateur : les parts prises", "Même dénominateur : on additionne les numérateurs"], voice: "On résume. Le dénominateur, c'est le nombre de parts. Le numérateur, ce sont les parts prises. Et avec le même dénominateur, on additionne les numérateurs." },
  bye: "Roooar ! Bravo, mini-lion des fractions ! À la prochaine vidéo, à bientôt !",
}));
add({
  id: "d02-soir-visuel-matieres", day: 2, slot: "soir", type: "visuel", audience: "tous", title: "7 matières, du CI au CM2", format: "carousel",
  hook: "7 matières, du CI au CM2, dans une seule aventure 📚",
  body: `Français, mathématiques, éveil scientifique, histoire, géographie, instruction civique, éducation artistique : tout le programme officiel sénégalais, en jeux.\n\nGratuit pendant le lancement pour l'année scolaire 2026-2027.`,
  cover: "Première carte du carrousel",
  slides: [
    { title: "Du CI au CM2, tout le programme en jeu", body: "Jotna School avec Pio", accent: "#ff6900" },
    { title: "Français", body: "42 thématiques", accent: "#f54900" },
    { title: "Mathématiques", body: "47 thématiques", accent: "#e17100" },
    { title: "Éveil scientifique, Histoire, Géographie", body: "33 · 26 · 25 thématiques", accent: "#5ea500" },
    { title: "Instruction civique, Éducation artistique", body: "25 · 31 thématiques", accent: "#0284c7" },
    { title: "Gratuit pendant le lancement", body: "Pour l'année scolaire 2026-2027. Créez votre compte sur jotnaschool.com", accent: "#ff6900" },
  ],
  beats: [],
});

/* ───── Jour 3 ───── */
add({
  id: "d03-midi-tuto-parents-inscription", day: 3, slot: "midi", type: "tutoriel", audience: "parents", title: "Parents : inscrire son enfant", format: "video", music: "africa",
  hook: "Inscrire son enfant sur Jotna School : le guide complet ✅",
  body: `1. Créez votre compte parent (un seul compte pour tous vos enfants)\n2. Ajoutez votre enfant : vous recevez son code de connexion\n3. Il se connecte avec son code, sans adresse e-mail\n\nGratuit pendant le lancement pour l'année scolaire 2026-2027.`,
  cover: "Titre « Inscrire mon enfant, c'est simple »",
  beats: [
    hook("Inscrire mon enfant, c'est simple", R("[warmly] Comment inscrire votre enfant sur Jotna School ? Suivez le guide, c'est très simple."), { kicker: "Tutoriel parents", pose: "hello" }),
    steps("Étape 1 : votre compte", [{ text: "Rendez-vous sur le site" }, { text: "Choisissez « S'inscrire »", sub: "en tant que parent" }, { text: "Remplissez le formulaire" }],
      [R("D'abord, rendez-vous sur le site, et choisissez « S'inscrire », en tant que parent."), R("Remplissez le formulaire. Un seul compte parent suffit pour tous vos enfants.")]),
    steps("Étape 2 : votre enfant", [{ text: "Ajoutez votre enfant", sub: "depuis votre espace parent" }, { text: "Récupérez son code de connexion", sub: "il commence par ELV-" }, { text: "Gardez-le précieusement" }],
      [R("Ensuite, dans votre espace parent, vous ajoutez votre enfant. Vous recevez son code de connexion personnel : il commence par E L V."), R("Ce code sert d'identifiant. Votre enfant n'a besoin d'aucune adresse e-mail.")]),
    pio("hello", R("Pour jouer, votre enfant saisit son code. Pio l'accueille dans le Camp, et l'aventure commence."), { title: "Place à l'aventure" }),
    bullets("Et ensuite ?", [{ icon: "🧑‍🏫", text: "Donnez son code à son professeur" }, { icon: "📊", text: "Suivez ses progrès" }, { icon: "✉️", text: "Recevez ses bulletins" }],
      [R("Vous pouvez aussi donner son code à son professeur, pour qu'il l'ajoute à sa classe."), R("Et vous suivez ses progrès depuis votre espace parent, avec un bulletin par e-mail à chaque thématique terminée.")]),
    FREE, CTA,
  ],
});
add({
  id: "d03-soir-enfants-lettre-jim", day: 3, slot: "soir", type: "enfants", audience: "enfants", title: "Mini-cours d'arabe : la lettre jîm", level: "Arabe & Coran · niveau débutant", format: "video", music: "africa",
  hook: "Salam ! Mini-cours d'arabe : la lettre ج (jîm) 🦁",
  body: "Au programme : la lettre jîm, son nom, sa forme, le sens de lecture de l'arabe, et 3 questions pour s'entraîner.\n\nUn mini-cours du module Arabe & Coran de Jotna School, avec Pio.",
  cover: "La lettre ج en grand sur fond de nuit étoilée",
  beats: [
    hook("Mini-cours d'arabe : la lettre jîm", S("سَلَام ! Je suis Pio. Aujourd'hui, on apprend une lettre arabe : la lettre jîm. Mets-toi bien à l'aise !"), { pose: "salam", outfit: "boubou", tone: "night" }),
    pio("recite", S("L'alphabet arabe compte vingt-huit lettres. On les apprend une par une : on écoute bien leur nom, puis on le répète à voix haute."), { title: "Au programme", text: "Une lettre, puis trois questions !", outfit: "boubou", tone: "night" }),
    { kind: "letter", glyph: "ج", name: "Jîm", sound: "Répète après Pio", tone: "night", voices: [S("Voici une nouvelle lettre ! Écoute bien son nom."), SV2("جِيم", 0.3), S("Jîm. À toi de la dire, bien fort !", 0.3), SV2("جِيم", 1.2)] },
    board("Comment la reconnaître ?", ["La jîm porte un point", { text: "Le point est en dessous ⬇️", big: true }, "L'arabe se lit de droite à gauche ⬅️"],
      [S("Regarde bien la lettre jîm : elle porte un point, et ce point est placé en dessous."), S("Et n'oublie pas : en arabe, on lit et on écrit de la droite vers la gauche.")], { tone: "night" }),
    quiz("Où est le point de la lettre jîm ?", ["Au-dessus", "En dessous", "Il n'y en a pas"], 1, "Le point de la jîm est en dessous", S("Première question. Où se trouve le point de la lettre jîm ?"), S("En dessous ! Le point de la jîm est sous la lettre.")),
    quiz("Dans quel sens lit-on l'arabe ?", ["De gauche à droite", "De droite à gauche"], 1, "L'arabe se lit de droite à gauche", S("Deuxième question. Dans quel sens lit-on l'arabe ?"), S("De droite à gauche ! Bravo.")),
    quiz("Combien de lettres dans l'alphabet arabe ?", ["20", "28", "30"], 1, "28 lettres, et tu en connais déjà une : la jîm", S("Dernière question. Combien de lettres compte l'alphabet arabe ?"), S("Vingt-huit ! Et tu en connais déjà une : la jîm.")),
    outro(S("Barakallahou fik ! Tu as bien travaillé. À la prochaine vidéo, à bientôt !")),
  ].map((b) => ({ tone: "night", ...b })),
});

/* ───── Jour 4 ───── */
add({
  id: "d04-midi-pub-gratuit-parents", day: 4, slot: "midi", type: "pub", audience: "parents", title: "Réviser sans payer", format: "video", music: "africa",
  hook: "Aider son enfant à réviser, sans payer ? C'est possible 🦁",
  body: `Jotna School propose les exercices du programme officiel sénégalais, du CI au CM2 : 7 matières, 10 types d'exercices, un lionceau qui encourage, des étoiles et des trophées, et un suivi pour les parents.\n\nGratuit pendant le lancement pour l'année scolaire 2026-2027.`,
  cover: "Titre « Réviser sans payer ? » avec Pio",
  beats: [
    hook("Réviser sans payer ?", R("[warmly] Vous cherchez de quoi aider votre enfant à réviser, sans payer ? Voici Jotna School."), { kicker: "Parents", pose: "think" }),
    phone("session", R("Des exercices du CI au CM2, comme à l'école, mais sous forme de jeux : choisir la bonne réponse, relier des paires, remettre dans l'ordre."), { title: "Des exercices en jeux", caption: "Du CI au CM2" }),
    bullets("Dans Jotna School", [{ icon: "📚", text: "7 matières" }, { icon: "🎮", text: "10 types d'exercices" }, { icon: "⭐", text: "Étoiles et trophées" }, { icon: "📈", text: "Un suivi pour les parents" }],
      [R("Sept matières, dix types d'exercices, des étoiles, des niveaux et des trophées, et un suivi pour les parents."), R("Une séance dure environ dix minutes : facile à glisser dans une journée.")]),
    pio("encourage", R("[softly] Et quand l'enfant se trompe, Pio l'encourage au lieu de le gronder. C'est comme ça qu'on prend confiance."), { title: "On encourage" }),
    pio("idle", R("Du CI au CM2, chaque élève retrouve des exercices pour sa classe. Au CI, aucune réponse n'est à taper au clavier."), { title: "Pour chaque classe" }),
    steps("Pour commencer", [{ text: "Créez votre compte parent" }, { text: "Ajoutez votre enfant" }, { text: "Il joue avec son code" }],
      R("Pour commencer : vous créez votre compte parent, vous ajoutez votre enfant, et il joue avec son code personnel.")),
    FREE, CTA,
  ],
});
add({
  id: "d04-soir-explicatif-palier", day: 4, slot: "soir", type: "explicatif", audience: "parents", title: "Un palier, c'est quoi ?", format: "video", music: "africa",
  hook: "Un palier, c'est quoi ? 🎯",
  body: `Sur Jotna School, on avance palier par palier : 10 exercices (environ 10 minutes de jeu), et une moyenne de 7 sur 10 pour valider. Le palier suivant s'ouvre alors.\n\nGratuit pendant le lancement pour l'année scolaire 2026-2027.`,
  cover: "Gros chiffre 10 : exercices par palier",
  beats: [
    hook("Un palier, c'est quoi ?", R("[warmly] Dans Jotna School, on avance palier par palier. Mais c'est quoi, un palier ?"), { pose: "think" }),
    stat("10", "exercices par palier", "pour environ dix minutes de jeu", R("Un palier, c'est dix exercices. Ça représente environ dix minutes de jeu, une durée parfaite pour une séance courte.")),
    stat("7/10", "pour valider le palier", "une moyenne de sept sur dix", R("Pour valider un palier, il faut une moyenne de sept sur dix. Pas besoin d'être parfait : on peut se tromper, et réessayer.")),
    phone("trail", R("Chaque palier est une étape sur le sentier d'une matière. Quand l'enfant valide un palier, le suivant s'ouvre."), { title: "Le sentier des paliers" }),
    stat("3 · 4 · 5", "paliers par thématique", "selon la classe", R("Dans chaque thématique, il y a en général trois paliers au CI et au CP, quatre en CE1 et CE2, et cinq en CM1 et CM2.")),
    pio("cheer", R("Et à la fin d'un palier, une note d'une à trois étoiles s'affiche. Un beau moyen de suivre ses progrès, pas à pas."), { title: "Une note en étoiles" }),
    FREE,
    cta(R("[cheerfully] Dix minutes par jour, et on avance. Jotna School : un palier à la fois."), "Un palier à la fois", "Créez votre compte"),
  ],
});

/* ───── Jour 5 ───── */
add(course({
  id: "d05-midi-enfants-pluriel", day: 5, slot: "midi", title: "Mini-cours CE2 : le pluriel des noms", level: "CE2 · Français",
  hook: "Mini-cours de français pour les CE2 : le pluriel des noms 🐴",
  body: "Au programme : la règle de base, les noms en -al et les noms en -eau, puis 3 questions pour s'entraîner. Réponds dans les commentaires avant la correction !\n\nUn mini-cours Jotna School avec Pio.",
  hookTitle: "Mini-cours : le pluriel",
  hookVoice: "Salut les CE2 ! Je suis Pio. Aujourd'hui, mini-cours de français : le pluriel des noms.",
  goal: "Tu vas apprendre la règle de base du pluriel, deux familles de mots à retenir, puis t'entraîner avec trois questions.",
  lessons: [
    { title: "La règle de base", lines: ["Un chat → des chats", "Une table → des tables", { text: "On ajoute un « s »", big: true }], voices: ["Pour mettre un nom au pluriel, on ajoute en général un s à la fin. Un chat, des chats. Une table, des tables."] },
    { title: "Les noms en -al", lines: ["Un cheval → des chevaux", "Un animal → des animaux", "Un journal → des journaux", { text: "-al devient -aux", big: true }], voices: ["Mais attention ! Beaucoup de noms qui finissent par a l font leur pluriel en a u x. Un cheval, des chevaux. Un animal, des animaux. Un journal, des journaux."] },
    { title: "Les noms en -eau", lines: ["Un bateau → des bateaux", "Un gâteau → des gâteaux", { text: "-eau prend un « x »", big: true }], voices: ["Les noms qui finissent par e a u prennent un x au pluriel. Un bateau, des bateaux. Un gâteau, des gâteaux."] },
  ],
  quizzes: [
    { q: "Un bateau, des…", options: ["bateaus", "bateaux", "bateau"], answer: 1, explain: "-eau prend un x : des bateaux", ask: "Première question. Un bateau, des quoi ?", reveal: "Des bateaux ! Les noms en e a u prennent un x." },
    { q: "Un animal, des…", options: ["animals", "animaux", "animales"], answer: 1, explain: "-al devient -aux : des animaux", ask: "Deuxième question. Un animal, des quoi ?", reveal: "Des animaux ! A l devient a u x." },
    { q: "Un cheval, des…", options: ["chevals", "chevaux", "chevaus"], answer: 1, explain: "cheval → chevaux", ask: "Dernière question. Un cheval, des quoi ?", reveal: "Des chevaux ! Bravo, tu as retenu la règle." },
  ],
  recap: { lines: ["En général : on ajoute un « s »", "-al → -aux", "-eau → -eaux"], voice: "On résume. En général, on ajoute un s. Les noms en a l font a u x. Les noms en e a u prennent un x." },
  bye: "Roooar ! Bravo, champion du pluriel ! À la prochaine vidéo, à bientôt !",
}));
add({
  id: "d05-soir-tuto-profs-pdf", day: 5, slot: "soir", type: "tutoriel", audience: "profs", title: "Professeurs : du PDF aux exercices", format: "video", music: "africa",
  hook: "Votre cours en PDF devient des exercices ✨",
  body: `1. Importez votre PDF dans votre espace professeur\n2. L'IA propose des exercices (en brouillon)\n3. Vous relisez et vous publiez\n\nGratuit pour les professeurs pendant le lancement pour l'année scolaire 2026-2027.`,
  cover: "Titre « Un cours en PDF devient des exercices »",
  beats: [
    hook("Un cours en PDF devient des exercices", R("[impressed] Professeurs : et si votre fiche de cours en PDF devenait des exercices pour vos élèves ?"), { kicker: "Tutoriel professeurs", pose: "amazed" }),
    steps("Du PDF aux exercices", [{ text: "Importez votre PDF", sub: "dans votre espace professeur" }, { text: "L'IA propose des exercices", sub: "ils arrivent en brouillon" }, { text: "Vous relisez et vous publiez", sub: "vos élèves les retrouvent" }],
      [R("Dans votre espace professeur, ouvrez la section d'import de PDF, et choisissez votre fichier."), R("L'intelligence artificielle lit votre document et propose des exercices. Ils arrivent en brouillon : vous gardez la main."), R("Vous relisez, vous corrigez si besoin, et vous publiez. Les exercices apparaissent alors chez vos élèves.")]),
    bullets("Et aussi", [{ icon: "🏫", text: "Créez vos classes" }, { icon: "🧒", text: "Ajoutez vos élèves avec leur code" }, { icon: "📊", text: "Suivez chaque élève" }, { icon: "🔍", text: "Repérez les difficultés" }],
      [R("Vous créez vos classes, vous ajoutez vos élèves avec leur code, et vous suivez chacun d'eux individuellement."), R("Jotna repère aussi les difficultés qui reviennent, pour savoir où revenir en classe.")]),
    pio("think", R("Ensuite, vous retrouvez les résultats de vos élèves dans votre espace, élève par élève."), { title: "Les résultats" }),
    pio("cheer", R("Moins de temps passé à préparer des exercices, et plus de temps pour ce qui compte : vos élèves."), { title: "Plus de temps pour vos élèves" }),
    FREE, CTA_PROF,
  ],
});

/* ───── Jour 6 ───── */
add({
  id: "d06-midi-explicatif-etoiles", day: 6, slot: "midi", type: "explicatif", audience: "parents", title: "Étoiles, niveaux et trophées", format: "video", music: "africa",
  hook: "Pourquoi les enfants adorent Jotna School ? Les étoiles ! ⭐",
  body: `Jusqu'à 3 étoiles par palier, 1 niveau tous les 50 bonnes réponses, 3 missions par jour, plus de 20 trophées. Le jeu motive entre les exercices, sans pression, et les parents peuvent désactiver séries et missions.\n\nGratuit pendant le lancement pour l'année scolaire 2026-2027.`,
  cover: "Écran du palier validé avec trois étoiles",
  beats: [
    hook("Des étoiles à gagner !", R("[cheerfully] Pourquoi les enfants adorent Jotna School ? Parce qu'on y gagne des étoiles, des niveaux et des trophées !"), { pose: "cheer" }),
    phone("result", R("À chaque exercice, jusqu'à trois étoiles. Et à la fin d'un palier, une note d'une à trois étoiles s'affiche."), { title: "Jusqu'à trois étoiles" }),
    stat("50", "bonnes réponses = 1 niveau", "", R("Cinquante bonnes réponses, et c'est un niveau de plus. L'enfant voit sa barre de niveau grandir.")),
    bullets("Chaque jour", [{ icon: "🎯", text: "3 missions du jour" }, { icon: "⭐", text: "1 étoile par mission" }, { icon: "🎁", text: "+2 si les trois sont faites" }, { icon: "🔥", text: "Une série de jours" }],
      [R("Chaque jour, trois missions : une étoile pour chacune, et deux de plus si les trois sont réussies."), R("Il y a aussi une série de jours à garder. Un gel offert tous les sept jours protège la série.")]),
    pio("cheer", R("Et plus de vingt trophées à débloquer : petit matheux, lecteur curieux, apprenti savant, globe-trotteur…"), { title: "Plus de 20 trophées", text: "Petit matheux, Lecteur curieux, Globe-trotteur…" }),
    pio("encourage", R("[softly] Le jeu récompense l'effort entre les exercices. Pendant un exercice, la séance reste calme et sobre. Et les parents peuvent désactiver les séries et les missions."), { title: "Sans pression" }),
    FREE,
    cta(R("[warmly] Motiver son enfant sans pression. Jotna School."), "Motiver sans pression", "Créez votre compte"),
  ],
});
add({
  id: "d06-soir-visuel-parents-reflexes", day: 6, slot: "soir", type: "visuel", audience: "parents", title: "Encourager sans gronder : 5 réflexes", format: "carousel",
  hook: "5 réflexes pour aider son enfant à progresser, sans le gronder 💛",
  body: `Enregistrez ce post pour le relire avant les devoirs !\n\nChez Jotna School, Pio applique la même règle : il encourage, donne un indice, et fête chaque progrès. Gratuit pendant le lancement pour l'année scolaire 2026-2027.`,
  cover: "Première carte : 5 réflexes",
  slides: [
    { title: "5 réflexes pour aider son enfant à progresser", body: "Sans le gronder", accent: "#ff6900" },
    { title: "1. Félicitez l'effort", body: "Pas seulement la note", accent: "#e17100" },
    { title: "2. Une erreur est un indice", body: "Pas un échec", accent: "#5ea500" },
    { title: "3. Dix minutes par jour", body: "Valent mieux qu'une heure le dimanche", accent: "#0284c7" },
    { title: "4. Laissez-le choisir", body: "La matière du jour", accent: "#7c3aed" },
    { title: "5. Fêtez les petites victoires", body: "Comme Pio, le lionceau de Jotna School", accent: "#ff6900" },
    { title: "Jotna School : gratuit pendant le lancement", body: "Pour l'année scolaire 2026-2027. jotnaschool.com", accent: "#f54900" },
  ],
  beats: [],
});

/* ───── Jour 7 ───── */
add({
  id: "d07-midi-pub-ecoles", day: 7, slot: "midi", type: "pub", audience: "ecoles", title: "Une école, toutes les classes", format: "video", music: "africa",
  hook: "Directeurs, et si toute votre école apprenait avec Pio ? 🏫",
  body: `Inscrivez votre école, partagez votre code école à vos professeurs, voyez toutes les classes et confiez chacune à un professeur. Le module Arabe & Coran est activable par l'école.\n\nGratuit pendant le lancement pour l'année scolaire 2026-2027.`,
  cover: "Titre « Votre école, en jeu »",
  beats: [
    hook("Votre école, en jeu", R("[confidently] Directeurs d'école : et si toutes vos classes apprenaient avec Pio ?"), { kicker: "Écoles", pose: "hello" }),
    steps("Pour l'école", [{ text: "Inscrivez votre école", sub: "vous obtenez un code école" }, { text: "Partagez-le à vos professeurs", sub: "ils rejoignent votre école" }, { text: "Confiez chaque classe", sub: "un professeur par classe" }],
      [R("D'abord, vous inscrivez votre école. Vous obtenez un code école."), R("Vous le partagez à vos professeurs, qui rejoignent l'école avec ce code."), R("Vous voyez toutes les classes, et vous confiez chacune à un professeur.")]),
    bullets("Pour vos élèves", [{ icon: "📚", text: "7 matières, du CI au CM2" }, { icon: "🦁", text: "Pio qui encourage" }, { icon: "🕌", text: "Arabe & Coran, si vous l'activez" }, { icon: "📈", text: "Un suivi par professeur et par parent" }],
      [R("Vos élèves accèdent aux exercices de leur classe : sept matières, du CI au CM2."), R("Si vous le souhaitez, vous pouvez activer le module Arabe et Coran pour votre école.")]),
    pio("think", R("Un seul code école suffit pour réunir tous vos professeurs. Chacun peut ensuite créer ses classes et suivre ses élèves."), { title: "Un seul code école" }),
    pio("hello", R("Et pour les parents : chacun crée son espace, et suit ses enfants. Un seul compte parent suffit pour plusieurs enfants."), { title: "Les parents aussi" }),
    pio("cheer", R("Les professeurs suivent chaque élève, et les parents suivent leurs enfants depuis leur propre espace. Toute l'école avance ensemble."), { title: "Tous ensemble" }),
    FREE, CTA_ECOLE,
  ],
});
add(course({
  id: "d07-soir-enfants-mammiferes", day: 7, slot: "soir", title: "Mini-cours CE2 : les mammifères", level: "CE2 · Éveil scientifique",
  hook: "Mini-cours d'éveil scientifique pour les CE2 : les mammifères 🦁🐋",
  body: "Au programme : ce qui caractérise un mammifère, des exemples (même la baleine et la chauve-souris !), puis 3 questions. Réponds dans les commentaires avant la correction !\n\nUn mini-cours Jotna School avec Pio.",
  hookTitle: "Mini-cours : les mammifères",
  hookVoice: "Salut les CE2 ! Je suis Pio. Aujourd'hui, mini-cours d'éveil scientifique : les mammifères. Et moi, je suis un mammifère !",
  goal: "Tu vas découvrir ce qui caractérise un mammifère, voir des exemples, puis t'entraîner avec trois questions.",
  lessons: [
    { title: "Qu'est-ce qu'un mammifère ?", lines: ["Il a des poils sur le corps", "Il respire de l'air avec des poumons", { text: "La maman allaite ses petits", big: true }, "Presque tous naissent vivants"],
      voices: ["Un mammifère a des poils sur le corps. Il respire de l'air avec des poumons. Et surtout, la maman allaite ses petits avec son lait.", "Presque tous les mammifères naissent vivants, dans le ventre de leur maman."] },
    { title: "Des exemples", lines: ["🦁 Le lion", "🐘 L'éléphant", "🐋 La baleine", "🦇 La chauve-souris"],
      voices: ["Le lion est un mammifère, l'éléphant aussi. La baleine vit dans l'eau, mais elle respire de l'air et allaite ses petits : c'est un mammifère ! Et la chauve-souris, qui vole, en est un aussi."] },
  ],
  quizzes: [
    { q: "Quel animal est un mammifère ?", options: ["La baleine", "Le requin", "Le crocodile"], answer: 0, explain: "La baleine allaite ses petits", ask: "Première question. Quel animal est un mammifère ?", reveal: "La baleine ! Elle allaite ses petits." },
    { q: "Que boit un bébé mammifère ?", options: ["De l'eau", "Le lait de sa maman", "Du jus"], answer: 1, explain: "La maman allaite ses petits", ask: "Deuxième question. Que boit un bébé mammifère ?", reveal: "Le lait de sa maman !" },
    { q: "La chauve-souris est…", options: ["un oiseau", "un mammifère", "un poisson"], answer: 1, explain: "Elle vole, mais elle allaite ses petits", ask: "Dernière question. La chauve-souris est-elle un oiseau, un mammifère ou un poisson ?", reveal: "Un mammifère ! Elle vole, mais elle a des poils et elle allaite ses petits." },
  ],
  recap: { lines: ["Des poils sur le corps", "Il respire de l'air", "La maman allaite ses petits"], voice: "On résume. Un mammifère a des poils, il respire de l'air, et la maman allaite ses petits." },
  bye: "Roooar ! Bravo, petit explorateur ! À la prochaine vidéo, à bientôt !",
}));

/* ───── Jour 8 ───── */
add({
  id: "d08-midi-explicatif-erreur", day: 8, slot: "midi", type: "explicatif", audience: "parents", title: "Pio ne gronde jamais", format: "video", music: "africa",
  hook: "Une erreur ne fait jamais peur avec Pio 🦁",
  body: `Quand l'enfant se trompe : Pio donne un indice, on réessaie (jusqu'à 5 essais), et chaque progrès est fêté. Apprendre sans stress, c'est apprendre mieux.\n\nGratuit pendant le lancement pour l'année scolaire 2026-2027.`,
  cover: "Pio qui encourage avec le titre « Pio ne gronde jamais »",
  beats: [
    hook("Pio ne gronde jamais", R("[softly] Dans Jotna School, une erreur ne fait jamais peur. Voyons pourquoi."), { pose: "encourage" }),
    bullets("Quand on se trompe", [{ icon: "💡", text: "Pio donne un indice" }, { icon: "🔁", text: "On réessaie" }, { icon: "🎉", text: "Chaque progrès est fêté" }],
      R("Quand l'enfant se trompe, Pio ne gronde jamais. Il donne un indice, l'enfant réessaie, et chaque progrès est fêté.")),
    stat("5", "essais possibles par exercice", "", R("Pour chaque exercice, l'enfant peut essayer jusqu'à cinq fois. Il n'est jamais bloqué après une seule erreur.")),
    stat("10 · 7 · 4", "la note selon l'essai", "1er, 2e et 3e essai", R("Plus l'enfant réussit tôt, plus la note est haute : dix au premier essai, sept au deuxième, quatre au troisième. Un indice retire un point.")),
    pio("think", R("Pourquoi c'est important ? Un enfant qui n'a pas peur de se tromper ose répondre, essaie, et apprend de ses erreurs."), { title: "Oser répondre" }),
    pio("cheer", R("Et quand il réussit, la fête commence : des étoiles, un niveau de plus, parfois un trophée."), { title: "Et la fête commence" }),
    pio("encourage", R("[warmly] Apprendre sans peur de se tromper : c'est comme ça qu'on prend confiance, et qu'on a envie de continuer."), { title: "La confiance d'abord" }),
    FREE,
    cta(R("[warmly] Apprendre sans stress. Jotna School."), "Apprendre sans stress", "Créez votre compte"),
  ],
});
add({
  id: "d08-soir-tuto-parents-suivi", day: 8, slot: "soir", type: "tutoriel", audience: "parents", title: "Parents : suivre la progression", format: "video", music: "africa",
  hook: "Comment suivre les progrès de mon enfant ? 📊",
  body: `Dans votre espace parent : tous vos enfants au même endroit, des rapports par chapitre, un bulletin par e-mail quand une thématique est terminée (désactivable), et une alerte pour chaque badge.\n\nGratuit pendant le lancement pour l'année scolaire 2026-2027.`,
  cover: "Titre « Suivre les progrès de mon enfant »",
  beats: [
    hook("Suivre les progrès de mon enfant", R("[warmly] Comment suivre les progrès de votre enfant, sans le surveiller ? Voici votre espace parent."), { kicker: "Tutoriel parents", pose: "hello" }),
    bullets("Votre espace parent", [{ icon: "👨‍👧‍👦", text: "Tous vos enfants au même endroit" }, { icon: "📊", text: "Des rapports par chapitre" }, { icon: "🏅", text: "Étoiles, niveaux et trophées" }],
      [R("Dans votre espace parent, vous retrouvez tous vos enfants au même endroit."), R("Pour chacun, des rapports par chapitre : ce qu'il a travaillé, et comment il s'en sort.")]),
    phone("result", R("Vous voyez aussi les étoiles et les niveaux gagnés, tels que votre enfant les voit."), { title: "Ce que voit votre enfant" }),
    pio("hello", R("Pour l'enfant, tout se passe dans son propre espace : il joue, il gagne des étoiles, et vous suivez ses progrès de votre côté."), { title: "Chacun son espace" }),
    stat("1", "compte pour tous vos enfants", "", R("Un seul compte parent suffit pour suivre plusieurs enfants, depuis la même page.")),
    steps("Les alertes", [{ text: "Un bulletin par e-mail", sub: "à chaque thématique terminée" }, { text: "Une alerte de badge", sub: "quand il en débloque un" }, { text: "Vous gardez la main", sub: "séries et missions désactivables" }],
      [R("Quand votre enfant termine une thématique, vous recevez un bulletin par e-mail. Vous pouvez décocher cette option à tout moment."), R("Vous êtes aussi prévenu quand il débloque un badge."), R("Enfin, vous pouvez couper les séries de jours et les missions, si vous préférez une expérience plus calme.")]),
    FREE,
    cta(R("[cheerfully] Suivre sans surveiller. Jotna School."), "Suivre sans surveiller", "Créez votre compte parent"),
  ],
});

/* ───── Jour 9 ───── */
add(course({
  id: "d09-midi-enfants-capitale", day: 9, slot: "midi", title: "Mini-cours CM2 : le Sénégal et ses voisins", level: "CM2 · Géographie",
  hook: "Mini-cours de géographie pour les CM2 : le Sénégal et ses voisins 🇸🇳",
  body: "Au programme : situer le Sénégal, ses pays voisins, ses grands cours d'eau, et 3 questions pour s'entraîner. Réponds dans les commentaires avant la correction !\n\nUn mini-cours Jotna School avec Pio.",
  hookTitle: "Mini-cours : le Sénégal",
  hookVoice: "Salut les CM2 ! Je suis Pio. Aujourd'hui, mini-cours de géographie : le Sénégal et ses voisins.",
  goal: "Tu vas situer le Sénégal, nommer ses pays voisins et ses grands cours d'eau, puis t'entraîner avec trois questions.",
  lessons: [
    { title: "Où est le Sénégal ?", lines: ["🌍 En Afrique de l'Ouest", "🌊 À l'ouest : l'océan Atlantique", { text: "La capitale : Dakar", big: true }], voices: ["Le Sénégal se trouve en Afrique de l'Ouest. À l'ouest, il est bordé par l'océan Atlantique. Sa capitale est Dakar."] },
    { title: "Les pays voisins", lines: ["Nord : la Mauritanie", "Est : le Mali", "Sud : la Guinée et la Guinée-Bissau", "Au milieu : la Gambie"], voices: ["Au nord, il y a la Mauritanie. À l'est, le Mali. Au sud, la Guinée et la Guinée-Bissau.", "Et la Gambie forme une longue bande de terre, presque entièrement entourée par le Sénégal."] },
    { title: "Les cours d'eau", lines: ["Le fleuve Sénégal, au nord", "Le fleuve Gambie", "Le fleuve Casamance, au sud"], voices: ["Parmi les grands cours d'eau, il y a le fleuve Sénégal, au nord, qui marque la frontière avec la Mauritanie. Il y a aussi le fleuve Gambie, et le fleuve Casamance, au sud."] },
  ],
  quizzes: [
    { q: "Capitale du Sénégal ?", options: ["Thiès", "Dakar", "Saint-Louis"], answer: 1, explain: "Dakar est la capitale du Sénégal", ask: "Première question. Quelle est la capitale du Sénégal ?", reveal: "C'est Dakar ! Bravo si tu as trouvé." },
    { q: "Quel océan borde le Sénégal ?", options: ["Pacifique", "Atlantique", "Indien"], answer: 1, explain: "L'océan Atlantique, à l'ouest", ask: "Deuxième question. Quel océan borde le Sénégal ?", reveal: "L'océan Atlantique, à l'ouest du pays !" },
    { q: "Quel pays est au nord du Sénégal ?", options: ["Le Mali", "La Mauritanie", "La Guinée"], answer: 1, explain: "La Mauritanie est au nord", ask: "Dernière question. Quel pays se trouve au nord du Sénégal ?", reveal: "La Mauritanie ! Le fleuve Sénégal marque la frontière." },
  ],
  recap: { lines: ["Afrique de l'Ouest, capitale : Dakar", "Océan Atlantique à l'ouest", "Voisins : Mauritanie, Mali, Guinée, Guinée-Bissau, Gambie"], voice: "On résume. Le Sénégal est en Afrique de l'Ouest, sa capitale est Dakar, l'océan Atlantique est à l'ouest, et il a cinq pays voisins." },
  bye: "Roooar ! Bravo, grand voyageur ! À la prochaine vidéo, à bientôt !",
}));
add({
  id: "d09-soir-visuel-ecoles", day: 9, slot: "soir", type: "visuel", audience: "ecoles", title: "Ce que Jotna apporte à l'école", format: "carousel",
  hook: "Ce que Jotna School apporte à votre école 🏫",
  body: `Le programme officiel sénégalais du CI au CM2, chaque classe confiée à un professeur, le suivi de chaque élève, et le module Arabe & Coran si votre école le souhaite.\n\nGratuit pendant le lancement pour l'année scolaire 2026-2027.`,
  cover: "Première carte : Ce que Jotna School apporte à votre école",
  slides: [
    { title: "Ce que Jotna School apporte à votre école", body: "En 5 points", accent: "#ff6900" },
    { title: "Le programme officiel sénégalais", body: "Du CI au CM2, en jeux", accent: "#e17100" },
    { title: "Chaque classe confiée à un professeur", body: "Vous voyez toutes les classes", accent: "#5ea500" },
    { title: "Le suivi de chaque élève", body: "Par son professeur, et par ses parents", accent: "#0284c7" },
    { title: "Arabe & Coran", body: "Un module que votre école active si elle le souhaite", accent: "#7c3aed" },
    { title: "Gratuit pendant le lancement", body: "Pour l'année scolaire 2026-2027. Inscrivez votre école sur jotnaschool.com", accent: "#ff6900" },
  ],
  beats: [],
});

/* ───── Jour 10 ───── */
add({
  id: "d10-midi-explicatif-formats", day: 10, slot: "midi", type: "explicatif", audience: "tous", title: "10 façons d'apprendre en jouant", format: "video", music: "africa",
  hook: "10 types d'exercices pour ne jamais s'ennuyer 🎮",
  body: `QCM, glisser-déposer, association, mise en ordre, réponse courte… et des jeux : phrase à trous, suites et frises, dessin sur quadrillage, écoute, atelier des couleurs.\n\nGratuit pendant le lancement pour l'année scolaire 2026-2027.`,
  cover: "Titre « 10 façons d'apprendre en jouant »",
  beats: [
    hook("10 façons d'apprendre en jouant", R("[cheerfully] Dix types d'exercices, pour ne jamais s'ennuyer ! Voici le tour du propriétaire."), { pose: "amazed" }),
    bullets("Cinq classiques", [{ icon: "✅", text: "Choisir la bonne réponse" }, { icon: "🧩", text: "Glisser-déposer" }, { icon: "🔗", text: "Relier des paires" }, { icon: "🔢", text: "Remettre dans l'ordre" }, { icon: "✏️", text: "Réponse courte" }],
      [R("D'abord, cinq classiques. Choisir la bonne réponse parmi quatre propositions. Glisser-déposer, pour classer et trier."), R("Relier des paires. Remettre dans l'ordre une chronologie ou les mots d'une phrase. Et écrire une réponse courte, où l'orthographe compte.")]),
    bullets("Et cinq jeux", [{ icon: "🔤", text: "Phrase à trous" }, { icon: "🔁", text: "Suites et frises" }, { icon: "🎨", text: "Dessin sur quadrillage" }, { icon: "🎧", text: "Écoute" }, { icon: "🌈", text: "Atelier des couleurs" }],
      [R("Ensuite, cinq jeux. La phrase à trous. Les suites et les frises. Le dessin sur quadrillage, pour reproduire un motif ou trouver une symétrie."), R("L'écoute, avec des sons graves et aigus, des rythmes et des mélodies. Et l'atelier des couleurs, pour réussir ses mélanges.")]),
    pio("idle", R("Au CI, aucune réponse n'est à taper au clavier. Et au CI comme au CP, Pio lit la consigne à voix haute."), { title: "Pensé pour les petits" }),
    pio("cheer", R("[cheerfully] Avec autant de formats, chaque séance est différente. Et c'est le programme officiel, du CI au CM2."), { title: "Jamais deux fois pareil" }),
    FREE,
    cta(R("[warmly] Venez essayer. Jotna School : apprendre devient un réflexe."), "Apprendre devient un réflexe.", "Créez votre compte"),
  ],
});
add(course({
  id: "d10-soir-enfants-sons", day: 10, slot: "soir", title: "Mini-cours CP : grave ou aigu ?", level: "CP · Éducation artistique",
  hook: "Mini-cours d'éducation artistique pour les CP : grave ou aigu ? 🥁",
  body: "Au programme : reconnaître un son grave et un son aigu, une astuce pour ne plus se tromper, et 3 questions. Réponds dans les commentaires avant la correction !\n\nUn mini-cours Jotna School avec Pio.",
  hookTitle: "Mini-cours : les sons",
  hookVoice: "Salut les CP ! Je suis Pio. Aujourd'hui, on écoute ! Mini-cours d'éducation artistique : les sons graves et les sons aigus.",
  goal: "Tu vas apprendre à reconnaître un son grave et un son aigu, puis t'entraîner avec trois questions.",
  lessons: [
    { title: "Un son grave", lines: ["🥁 Le gros tambour", "⛈️ Le tonnerre", { text: "Grave : un son bas et profond", big: true }], voices: ["Un son grave est un son bas et profond. Le gros tambour fait un son grave. Le grondement du tonnerre aussi."] },
    { title: "Un son aigu", lines: ["🎶 Le petit sifflet", "🐦 Le chant de l'oiseau", { text: "Aigu : un son haut et pointu", big: true }], voices: ["Un son aigu est un son haut et pointu. Le petit sifflet fait un son aigu. Le chant d'un oiseau aussi."] },
    { title: "L'astuce", lines: [{ text: "Gros instrument → son grave", big: true }, { text: "Petit instrument → son aigu", big: true }], voices: ["Voici une astuce : plus un instrument est gros, plus son son est grave. Et plus il est petit, plus son son est aigu."] },
  ],
  quizzes: [
    { q: "Le gros tambour fait un son…", options: ["grave", "aigu"], answer: 0, explain: "Un gros instrument fait un son grave", ask: "Première question. Le gros tambour fait-il un son grave ou aigu ?", reveal: "Grave ! Il est gros, donc son son est grave." },
    { q: "Le petit sifflet fait un son…", options: ["grave", "aigu"], answer: 1, explain: "Un petit instrument fait un son aigu", ask: "Deuxième question. Le petit sifflet fait-il un son grave ou aigu ?", reveal: "Aigu ! Il est petit, donc son son est aigu." },
    { q: "Le tonnerre fait un son…", options: ["grave", "aigu"], answer: 0, explain: "Le tonnerre gronde : c'est grave", ask: "Dernière question. Le tonnerre fait-il un son grave ou aigu ?", reveal: "Grave ! Le tonnerre gronde, bas et profond." },
  ],
  recap: { lines: ["Grave : bas et profond", "Aigu : haut et pointu", "Gros instrument → grave, petit → aigu"], voice: "On résume. Un son grave est bas et profond. Un son aigu est haut et pointu. Un gros instrument fait un son grave, un petit instrument fait un son aigu." },
  bye: "Roooar ! Bravo, tu as de belles oreilles ! À la prochaine vidéo, à bientôt !",
}));

/* ───── Jour 11 ───── */
add({
  id: "d11-midi-pub-profs", day: 11, slot: "midi", type: "pub", audience: "profs", title: "Moins de préparation, plus de classe", format: "video", music: "africa",
  hook: "Professeurs : gagnez du temps de préparation ⏱️",
  body: `Importez vos PDF, l'IA propose des exercices, vous relisez et vous publiez. Puis vous suivez chaque élève, avec les difficultés qui reviennent.\n\nGratuit pour les professeurs pendant le lancement pour l'année scolaire 2026-2027.`,
  cover: "Titre « Moins de préparation, plus de classe »",
  beats: [
    hook("Moins de préparation, plus de classe", R("[warmly] Professeurs, gagnez du temps de préparation. Voici ce que Jotna School vous propose."), { kicker: "Professeurs", pose: "cheer" }),
    bullets("Vos exercices", [{ icon: "📄", text: "Importez vos PDF" }, { icon: "🤖", text: "L'IA propose des exercices" }, { icon: "👀", text: "Vous relisez et publiez" }],
      [R("Vous importez vos PDF. L'intelligence artificielle propose des exercices, en brouillon."), R("Vous relisez, vous publiez, et vos élèves y accèdent.")]),
    bullets("Vos élèves", [{ icon: "🏫", text: "Créez vos classes" }, { icon: "🧒", text: "Ajoutez vos élèves" }, { icon: "📊", text: "Suivi individuel" }, { icon: "🔍", text: "Difficultés repérées" }],
      [R("Vous créez vos classes et vous ajoutez vos élèves, avec leur code."), R("Vous suivez chaque élève individuellement, et les difficultés qui reviennent sont repérées.")]),
    phone("session", R("Côté élèves, ce sont des exercices variés, avec Pio qui encourage. Le programme officiel est déjà là, du CI au CM2."), { title: "Côté élèves" }),
    pio("think", R("Vos élèves n'ont pas tous le même niveau ? Chacun avance à son rythme, palier après palier. Et vous gardez la main : les exercices importés arrivent en brouillon, avant votre relecture."), { title: "Chacun son rythme" }),
    pio("cheer", R("Moins de préparation, plus de temps pour enseigner, et pour accompagner ceux qui en ont besoin."), { title: "Plus de temps pour enseigner" }),
    FREE, CTA_PROF,
  ],
});
add({
  id: "d11-soir-explicatif-arabe-micro", day: 11, slot: "soir", type: "explicatif", audience: "parents", title: "Arabe & Coran : l'app écoute l'enfant", format: "video", music: "africa",
  hook: "Une app qui écoute votre enfant réciter 🎙️",
  body: `Dans le module Arabe & Coran, l'enfant avance lettre après lettre sur le chemin jusqu'à la Kaaba, parle au micro, et l'application compare avec la lettre attendue. Jotna ne conserve pas sa voix.\n\nModule activé par l'école. Gratuit pendant le lancement pour l'année scolaire 2026-2027.`,
  cover: "Chemin du Coran avec la Kaaba",
  beats: [
    hook("Une app qui écoute votre enfant", R("[softly] Dans le module Arabe et Coran, l'application écoute l'enfant. Voici comment ça marche."), { pose: "listen", outfit: "boubou", tone: "night" }),
    phone("quran", R("L'enfant avance sur un chemin, du village jusqu'à la Kaaba. Le parcours compte trente leçons, en six niveaux."), { title: "Le chemin du Coran" }),
    stat("28", "lettres à découvrir", "puis les voyelles, les premiers mots et six sourates courtes", R("Il commence par les vingt-huit lettres de l'alphabet. Puis viennent les voyelles, les premiers mots, et six sourates courtes.")),
    pio("recite", R("L'enfant dit la lettre au micro. L'application la compare avec la lettre attendue, et ne dit jamais « c'est faux »."), { title: "Il parle au micro", outfit: "boubou" }),
    steps("« Répète après Pio »", [{ text: "Un essai manqué", sub: "un conseil de volume" }, { text: "Un deuxième essai manqué", sub: "écoute au ralenti" }, { text: "Un troisième", sub: "« tu progresses »" }],
      [R("Après un essai manqué, Pio donne un conseil de volume. Après deux, il fait écouter la lettre au ralenti."), R("Et après trois, il dit : tu progresses, on la redira plus tard. Jamais de reproche.")]),
    pio("bravo", R("Chaque lettre se trace au doigt, on éclate des ballons, et on gagne des autocollants dorés dans « Mon album ». Apprendre devient un jeu !"), { title: "Mon album", outfit: "boubou" }),
    pio("idle", R("Et la voix de l'enfant ? Jotna ne la conserve pas : ni l'audio, ni sa transcription."), { title: "Sa voix n'est pas conservée", outfit: "boubou" }),
    CTA_ARABE,
  ],
});

/* ───── Jour 12 ───── */
add(course({
  id: "d12-midi-enfants-multiplication", day: 12, slot: "midi", title: "Mini-cours CE2 : la table de 7", level: "CE2 · Mathématiques",
  hook: "Mini-cours de maths pour les CE2 : la table de 7 ✖️",
  body: "Au programme : toute la table de 7, l'astuce du 56, et 3 questions pour s'entraîner. Réponds dans les commentaires avant la correction !\n\nUn mini-cours Jotna School avec Pio.",
  hookTitle: "Mini-cours : la table de 7",
  hookVoice: "Salut les CE2 ! Je suis Pio. Aujourd'hui, mini-cours de mathématiques : la table de sept.",
  goal: "Tu vas apprendre la table de sept, avec une astuce pour la retenir, puis t'entraîner avec trois questions.",
  lessons: [
    { title: "La table de 7 (1/2)", lines: [{ text: "7 × 1 = 7", big: true }, { text: "7 × 2 = 14", big: true }, { text: "7 × 3 = 21", big: true }, { text: "7 × 4 = 28", big: true }, { text: "7 × 5 = 35", big: true }], voices: ["Commençons doucement : sept fois un, sept. Sept fois deux, quatorze. Sept fois trois, vingt et un. Sept fois quatre, vingt-huit. Sept fois cinq, trente-cinq."] },
    { title: "La table de 7 (2/2)", lines: [{ text: "7 × 6 = 42", big: true }, { text: "7 × 7 = 49", big: true }, { text: "7 × 8 = 56", big: true }, { text: "7 × 9 = 63", big: true }, { text: "7 × 10 = 70", big: true }], voices: ["Et la suite : sept fois six, quarante-deux. Sept fois sept, quarante-neuf. Sept fois huit, cinquante-six. Sept fois neuf, soixante-trois. Sept fois dix, soixante-dix."] },
    { title: "L'astuce du 56", lines: [{ text: "5 · 6 · 7 · 8", big: true }, { text: "56 = 7 × 8", big: true }], voices: ["Voici une astuce pour retenir sept fois huit : regarde cette suite, cinq, six, sept, huit. Cinquante-six, c'est sept fois huit !"] },
  ],
  quizzes: [
    { q: "7 × 3 = ?", options: ["21", "24", "27"], answer: 0, explain: "7 × 3 = 21", ask: "Première question. Combien font sept fois trois ?", reveal: "Vingt et un ! Sept, quatorze, vingt et un." },
    { q: "7 × 6 = ?", options: ["36", "42", "48"], answer: 1, explain: "7 × 6 = 42", ask: "Deuxième question. Combien font sept fois six ?", reveal: "Quarante-deux ! C'est aussi six fois sept." },
    { q: "7 × 8 = ?", options: ["54", "56", "58"], answer: 1, explain: "5, 6, 7, 8 → 56 = 7 × 8", ask: "Dernière question, avec l'astuce ! Combien font sept fois huit ?", reveal: "Cinquante-six ! Cinq, six, sept, huit. Tu as trouvé l'astuce !" },
  ],
  recap: { lines: ["7 × 6 = 42", "7 × 7 = 49", { text: "7 × 8 = 56 : 5, 6, 7, 8", big: true }], voice: "On résume. Sept fois six, quarante-deux. Sept fois sept, quarante-neuf. Et sept fois huit, cinquante-six : cinq, six, sept, huit !" },
  bye: "Roooar ! Bravo, champion de la table de sept ! À la prochaine vidéo, à bientôt !",
}));
add({
  id: "d12-soir-visuel-code-enfant", day: 12, slot: "soir", type: "visuel", audience: "parents", title: "Un enfant, un code", format: "carousel",
  hook: "Pas d'adresse e-mail pour votre enfant : un code suffit 🔑",
  body: `Vous créez son compte depuis votre espace parent, il se connecte avec son code personnel. Un seul compte parent pour tous vos enfants. Sans pub.\n\nGratuit pendant le lancement pour l'année scolaire 2026-2027.`,
  cover: "Première carte : Pas d'e-mail pour votre enfant",
  slides: [
    { title: "Pas d'e-mail pour votre enfant", body: "Un code suffit", accent: "#ff6900" },
    { title: "Vous créez son compte", body: "Depuis votre espace parent", accent: "#e17100" },
    { title: "Il se connecte avec son code personnel", body: "Un code qui commence par ELV-", accent: "#5ea500" },
    { title: "Un seul compte parent", body: "Pour tous vos enfants", accent: "#0284c7" },
    { title: "Sans publicité", body: "Pour apprendre sans distraction", accent: "#7c3aed" },
    { title: "Gratuit pendant le lancement", body: "Pour l'année scolaire 2026-2027. jotnaschool.com", accent: "#ff6900" },
  ],
  beats: [],
});

/* ───── Jour 13 ───── */
add({
  id: "d13-midi-tuto-eleve-reperes", day: 13, slot: "midi", type: "tutoriel", audience: "tous", title: "Se repérer : Camp, sentier, carte", format: "video", music: "africa",
  hook: "Premier jour dans Jotna School ? Voici comment s'y retrouver 🗺️",
  body: `Le Camp : l'accueil avec Pio. Le sentier : la suite des paliers d'une matière. La carte : le monde des matières. La salle des trophées : les récompenses. Le carnet : les tampons.\n\nGratuit pendant le lancement pour l'année scolaire 2026-2027.`,
  cover: "Écran du Camp avec Pio",
  beats: [
    hook("Se repérer dans Jotna", R("[cheerfully] Premier jour dans Jotna School ? Voici comment s'y retrouver, étape par étape."), { kicker: "Tutoriel", pose: "walk" }),
    phone("camp", R("Le Camp, c'est l'accueil. Pio t'y attend, dans la savane, avec le bouton pour reprendre l'aventure là où tu t'étais arrêté."), { title: "Le Camp", caption: "L'accueil" }),
    phone("trail", R("Le sentier, c'est la suite des paliers d'une matière. Un palier, une étape. Le palier suivant s'ouvre quand on a validé le précédent."), { title: "Le sentier", caption: "Un palier, une étape" }),
    pio("amazed", R("La carte, c'est le monde des matières : une matière, un monde. Aucun monde n'est verrouillé, on peut explorer comme on veut."), { title: "La carte" }),
    pio("cheer", R("La salle des trophées garde les récompenses, et le carnet collectionne les tampons. De quoi être fier de son parcours !"), { title: "Trophées et carnet" }),
    phone("session", R("Et pendant un exercice, tout reste simple : on lit la question, on choisit sa réponse, et on valide. Si besoin, Pio donne un indice."), { title: "Pendant un exercice" }),
    FREE,
    { ...cta(R("[warmly] Bonne aventure ! Jotna School."), "Bonne aventure !", "Créez votre compte"), min: 5 },
  ],
});
add(course({
  id: "d13-soir-enfants-couleurs", day: 13, slot: "soir", title: "Mini-cours CI-CP : les couleurs", level: "CI · CP · Éducation artistique",
  hook: "Mini-cours d'éducation artistique pour le CI et le CP : les couleurs 🎨",
  body: "Au programme : les trois couleurs primaires, les mélanges, et 3 questions pour s'entraîner. Réponds dans les commentaires avant la correction !\n\nUn mini-cours Jotna School avec Pio.",
  hookTitle: "Mini-cours : les couleurs",
  hookVoice: "Salut les petits ! Je suis Pio. Aujourd'hui, on joue avec les couleurs ! Mini-cours d'éducation artistique, pour le CI et le CP.",
  goal: "Tu vas découvrir les trois couleurs primaires, apprendre à les mélanger, puis t'entraîner avec trois questions.",
  lessons: [
    { title: "Les couleurs primaires", lines: ["🔴 Le rouge", "🟡 Le jaune", "🔵 Le bleu"], voices: ["Il y a trois couleurs primaires : le rouge, le jaune et le bleu. Avec elles, on fabrique plein d'autres couleurs !"] },
    { title: "Les mélanges", lines: [{ text: "🟡 + 🔵 = 🟢 vert", big: true }, { text: "🔴 + 🟡 = 🟠 orange", big: true }, { text: "🔴 + 🔵 = 🟣 violet", big: true }], voices: ["Si on mélange du jaune et du bleu, on obtient du vert. Du rouge et du jaune, ça donne de l'orange. Et du rouge et du bleu, du violet !"] },
  ],
  quizzes: [
    { q: "Jaune + bleu = ?", options: ["Vert", "Orange", "Violet"], answer: 0, explain: "Jaune + bleu = vert", ask: "Première question. Que donne le jaune avec le bleu ?", reveal: "Du vert ! Jaune plus bleu, ça fait vert." },
    { q: "Rouge + jaune = ?", options: ["Vert", "Orange", "Violet"], answer: 1, explain: "Rouge + jaune = orange", ask: "Deuxième question. Que donne le rouge avec le jaune ?", reveal: "De l'orange ! Rouge plus jaune, ça fait orange." },
    { q: "Rouge + bleu = ?", options: ["Vert", "Orange", "Violet"], answer: 2, explain: "Rouge + bleu = violet", ask: "Dernière question. Que donne le rouge avec le bleu ?", reveal: "Du violet ! Bravo, tu es un vrai artiste." },
  ],
  recap: { lines: ["Primaires : rouge, jaune, bleu", "Jaune + bleu = vert", "Rouge + jaune = orange", "Rouge + bleu = violet"], voice: "On résume. Les couleurs primaires sont le rouge, le jaune et le bleu. Jaune et bleu font du vert, rouge et jaune de l'orange, rouge et bleu du violet." },
  bye: "Roooar ! Bravo, petit artiste ! À la prochaine vidéo, à bientôt !",
}));

/* ───── Jour 14 ───── */
add({
  id: "d14-midi-pub-recap", day: 14, slot: "midi", type: "pub", audience: "tous", title: "Deux semaines avec Pio", format: "video", music: "africa",
  hook: "Deux semaines avec Pio : ce que Jotna School vous propose 🦁",
  body: `Pio qui encourage, 7 matières du CI au CM2, des étoiles, des niveaux et des trophées. Pour les parents, les professeurs et les écoles.\n\nGratuit pendant le lancement pour l'année scolaire 2026-2027.`,
  cover: "Titre « Deux semaines avec Pio »",
  beats: [
    hook("Deux semaines avec Pio", R("[warmly] En deux semaines, vous avez découvert Pio et Jotna School. Faisons le point."), { pose: "cheer" }),
    bullets("Pour les enfants", [{ icon: "🦁", text: "Pio, qui encourage" }, { icon: "📚", text: "7 matières, du CI au CM2" }, { icon: "⭐", text: "Étoiles, niveaux, trophées" }],
      [R("Pour les enfants, un lionceau qui encourage, sept matières du CI au CM2, et des étoiles, des niveaux et des trophées à gagner."), R("Des paliers de dix exercices, avec dix types d'exercices différents, pour ne jamais s'ennuyer.")]),
    bullets("Pour les adultes", [{ icon: "👨‍👩‍👧", text: "Parents : un suivi clair" }, { icon: "🧑‍🏫", text: "Professeurs : du PDF aux exercices" }, { icon: "🏫", text: "Écoles : toutes les classes" }],
      [R("Pour les parents, un suivi clair, avec des rapports par chapitre et un bulletin par e-mail."), R("Pour les professeurs, des exercices créés à partir de leurs PDF. Et pour les écoles, toutes les classes au même endroit.")]),
    pio("salam", R("Et pour les écoles qui le souhaitent, le module Arabe et Coran, avec Pio en boubou."), { title: "Arabe & Coran", outfit: "boubou" }),
    pio("cheer", R("Et tout au long du parcours, Pio est là pour encourager, donner un indice, et fêter chaque progrès."), { title: "Pio est là" }),
    FREE, { ...CTA, min: 5 },
  ],
});
add({
  id: "d14-soir-pub-final", day: 14, slot: "soir", type: "pub", audience: "tous", title: "Prêt pour l'aventure ?", format: "video", music: "africa",
  hook: "Prêt pour l'aventure ? Pio vous attend ! 🦁",
  body: `Des étoiles à gagner, des paliers à franchir, des trophées à débloquer. Jotna School est gratuit pendant le lancement pour l'année scolaire 2026-2027, pour les écoles, les professeurs et les parents.\n\nCréez votre compte sur jotnaschool.com`,
  cover: "Titre « Prêt pour l'aventure ? »",
  beats: [
    hook("Prêt pour l'aventure ?", S("Prêts pour l'aventure ? Moi, Pio, je vous attends avec impatience !"), { pose: "cheer" }),
    phone("camp", R("Elle commence au Camp, dans la savane, avec Pio, et le bouton pour partir à l'aventure."), { title: "Le Camp" }),
    phone("trail", R("Puis on avance sur le sentier, palier par palier, dix exercices à la fois."), { title: "Le sentier" }),
    phone("result", R("À chaque palier, des étoiles à gagner, des niveaux à franchir, et des trophées à débloquer."), { title: "Étoiles, niveaux, trophées" }),
    phone("session", R("Chaque exercice est un petit jeu : on lit, on réfléchit, on choisit sa réponse, et Pio réagit."), { title: "Un petit jeu à chaque exercice" }),
    pio("encourage", R("[softly] Et toujours avec bienveillance : Pio ne gronde jamais, il encourage."), { title: "Toujours bienveillant" }),
    steps("Pour les parents", [{ text: "Créez votre compte" }, { text: "Ajoutez votre enfant" }, { text: "Il joue avec son code" }], R("Pour les parents : vous créez votre compte, vous ajoutez votre enfant, et il peut jouer avec son code.")),
    bullets("Pour les écoles", [{ icon: "🏫", text: "Vos classes" }, { icon: "📊", text: "Un suivi" }, { icon: "📄", text: "Des exercices depuis vos PDF" }], R("Pour les professeurs et les écoles : des classes, un suivi, et des exercices créés à partir de vos PDF.")),
    FREE,
    cta(R("[warmly] Jotna School. Apprendre devient un réflexe. Créez votre compte sur jotnaschool.com !")),
  ],
});

/* ───── Une publicité et un mini-cours par classe (CI, CP, CE1, CE2, CM1, CM2) ───── */

/** Publicité d'une classe, pour les parents : ce que l'enfant de cette classe trouve, puis l'offre et l'appel à créer un compte. */
const classAd = ({ slug, cls, spec }) => ({
  id: `d00-midi-${slug}`, day: 0, slot: "midi", type: "pub", audience: "parents", title: `Publicité ${cls} : ce que Jotna propose à votre enfant`, format: "video", music: "africa",
  hook: `Votre enfant est en ${cls} ? Voici ce que Jotna School lui propose 🎒`,
  body: `Les 7 matières du programme, des paliers de 10 exercices, Pio qui encourage, et un suivi pour les parents. ${spec.bodyLine}\n\nGratuit pendant le lancement pour l'année scolaire 2026-2027.`,
  cover: `Titre « Votre enfant est en ${cls} ? » avec Pio`,
  beats: [
    hook(`Votre enfant est en ${cls} ?`, R(`[warmly] Votre enfant est en ${cls} ? Voici ce que Jotna School lui propose, tout au long de l'année.`), { kicker: `Parents de ${cls}`, pose: "hello" }),
    stat("7", "matières au programme", "Français · Maths · Éveil scientifique · Histoire · Géographie · Instruction civique · Éducation artistique", R("Il retrouve les sept matières du programme : le français, les mathématiques, l'éveil scientifique, l'histoire, la géographie, l'instruction civique et l'éducation artistique.")),
    ...spec.beats,
    phone("trail", R("Chaque thématique est un chemin de paliers : dix exercices à chaque palier, pour environ dix minutes de jeu. Avec une moyenne de sept sur dix, le palier suivant s'ouvre."), { title: "Un chemin de paliers" }),
    pio("encourage", R("[softly] Et quand votre enfant se trompe, Pio l'encourage : il donne un indice, et l'enfant réessaie."), { title: "Pio encourage" }),
    pio("hello", R("Dix minutes par jour suffisent pour garder le rythme, et vous suivez ses progrès depuis votre espace parent."), { title: "Dix minutes par jour" }),
    FREE, CTA,
  ],
});
const PALIERS_3 = stat("3", "paliers par thématique", "en général, au CI et au CP", R("Chaque thématique compte en général trois paliers : on avance doucement, à son rythme."));

add(classAd({ slug: "pub-ci", cls: "CI", spec: {
  bodyLine: "Au CI, aucune réponse n'est à taper au clavier, et Pio lit la consigne à voix haute.",
  beats: [
    pio("idle", R("Au CI, aucune réponse n'est à taper au clavier : l'enfant touche, glisse, associe. Et Pio lit la consigne à voix haute, pour l'accompagner."), { title: "Pas de clavier" }),
    PALIERS_3,
  ] } }));
add(classAd({ slug: "pub-cp", cls: "CP", spec: {
  bodyLine: "Au CP, Pio lit la consigne à voix haute, pour aider l'enfant à comprendre ce qu'on lui demande.",
  beats: [
    pio("idle", R("Au CP, Pio lit la consigne à voix haute, pour aider l'enfant à bien comprendre ce qu'on lui demande."), { title: "Pio lit la consigne" }),
    PALIERS_3,
  ] } }));
add(classAd({ slug: "pub-ce1", cls: "CE1", spec: {
  bodyLine: "Au CE1, des réponses courtes où l'orthographe compte, et en général 4 paliers par thématique.",
  beats: [
    stat("4", "paliers par thématique", "en général, au CE1 et au CE2", R("Au CE1, chaque thématique compte en général quatre paliers : un peu plus de pratique pour bien s'entraîner.")),
    pio("think", R("Des réponses courtes font aussi leur apparition, où l'orthographe compte : une bonne façon de s'entraîner à écrire."), { title: "On s'entraîne à écrire" }),
  ] } }));
add(classAd({ slug: "pub-ce2", cls: "CE2", spec: {
  bodyLine: "Au CE2, les 10 types d'exercices et en général 4 paliers par thématique.",
  beats: [
    stat("4", "paliers par thématique", "en général, au CE1 et au CE2", R("Au CE2, chaque thématique compte en général quatre paliers, pour bien consolider ce qui a été vu en classe.")),
    bullets("Dix types d'exercices", [{ icon: "🔢", text: "Remettre dans l'ordre" }, { icon: "🔗", text: "Relier des paires" }, { icon: "🎨", text: "Dessiner sur un quadrillage" }, { icon: "🎧", text: "Écouter des sons et des rythmes" }],
      R("Les dix types d'exercices sont de la partie : remettre dans l'ordre, relier des paires, dessiner sur un quadrillage, écouter des sons et des rythmes.")),
  ] } }));
add(classAd({ slug: "pub-cm1", cls: "CM1", spec: {
  bodyLine: "Au CM1, en général 5 paliers par thématique : on va plus loin dans chaque sujet.",
  beats: [
    stat("5", "paliers par thématique", "en général, au CM1 et au CM2", R("Au CM1, chaque thématique compte en général cinq paliers : on va plus loin dans chaque sujet.")),
    pio("cheer", R("Les sept matières sont au programme, avec toujours Pio pour encourager, et des étoiles à gagner à chaque palier."), { title: "Toujours avec Pio" }),
  ] } }));
add(classAd({ slug: "pub-cm2", cls: "CM2", spec: {
  bodyLine: "Au CM2, en général 5 paliers par thématique, et certains chapitres conviennent aussi aux élèves de 6e en révision.",
  beats: [
    stat("5", "paliers par thématique", "en général, au CM1 et au CM2", R("Au CM2, chaque thématique compte en général cinq paliers : un vrai parcours d'entraînement.")),
    pio("think", R("Certains chapitres conviennent aussi aux élèves de sixième, pour réviser. Et le suivi par chapitre aide à voir où il faut insister."), { title: "Aussi pour réviser en 6e" }),
  ] } }));

add(course({
  id: "d00-soir-cours-ci", day: 0, slot: "soir", title: "Mini-cours CI : les nombres de 1 à 5", level: "CI · Mathématiques",
  hook: "Mini-cours de maths pour les CI : les nombres de 1 à 5 🥭",
  body: "Au programme : compter de 1 à 5 en montrant chaque objet, et 3 questions pour s'entraîner. Compte avec ton doigt et réponds dans les commentaires !\n\nUn mini-cours Jotna School avec Pio.",
  hookTitle: "Mini-cours : compter jusqu'à 5",
  hookVoice: "Salut les CI ! Je suis Pio. Aujourd'hui, on apprend à compter, avec un mini-cours de mathématiques : les nombres de un à cinq.",
  goal: "On va compter ensemble des mangos et des animaux, puis tu vas t'entraîner avec trois questions.",
  lessons: [
    { title: "Comptons ensemble !", lines: [{ text: "1  🥭", big: true }, { text: "2  🥭🥭", big: true }, { text: "3  🥭🥭🥭", big: true }, { text: "4  🥭🥭🥭🥭", big: true }, { text: "5  🥭🥭🥭🥭🥭", big: true }], voices: ["Un mango : un. Deux mangos : deux. Trois mangos : trois. Quatre mangos : quatre. Cinq mangos : cinq. Compte avec moi !"] },
    { title: "Pour bien compter", lines: ["☝️ On montre chaque objet du doigt", "On dit un seul nombre par objet", "Le dernier nombre dit = le total"], voices: ["Pour bien compter, on montre chaque objet avec son doigt, et on dit un seul nombre pour chaque objet. Le dernier nombre que tu dis, c'est le total !"] },
  ],
  quizzes: [
    { q: "🍎🍎🍎  Combien ?", options: ["2", "3", "4"], answer: 1, explain: "Une, deux, trois pommes", ask: "Première question. Combien y a-t-il de pommes ? Compte avec ton doigt !", reveal: "Trois ! Une, deux, trois pommes." },
    { q: "🐘🐘  Combien ?", options: ["1", "2", "3"], answer: 1, explain: "Un éléphant, deux éléphants", ask: "Deuxième question. Combien y a-t-il d'éléphants ?", reveal: "Deux ! Un éléphant, deux éléphants." },
    { q: "🌴🌴🌴🌴🌴  Combien ?", options: ["4", "5", "6"], answer: 1, explain: "Une, deux, trois, quatre, cinq palmiers", ask: "Dernière question. Combien y a-t-il de palmiers ? Prends ton temps.", reveal: "Cinq ! Une, deux, trois, quatre, cinq palmiers. Bravo !" },
  ],
  recap: { lines: [{ text: "1 · 2 · 3 · 4 · 5", big: true }, "On montre chaque objet du doigt", "Le dernier nombre dit = le total"], voice: "On résume. On compte en montrant chaque objet du doigt : un, deux, trois, quatre, cinq. Et le dernier nombre dit, c'est le total." },
  bye: "Roooar ! Bravo, petit champion des nombres ! À la prochaine vidéo, à bientôt !",
}));
add(course({
  id: "d00-soir-cours-ce1", day: 0, slot: "soir", title: "Mini-cours CE1 : l'addition avec retenue", level: "CE1 · Mathématiques",
  hook: "Mini-cours de maths pour les CE1 : l'addition avec retenue ➕",
  body: "Au programme : poser une addition, gérer la retenue, et 3 questions pour s'entraîner. Réponds dans les commentaires avant la correction !\n\nUn mini-cours Jotna School avec Pio.",
  hookTitle: "Mini-cours : l'addition",
  hookVoice: "Salut les CE1 ! Je suis Pio. Aujourd'hui, mini-cours de mathématiques : l'addition avec retenue.",
  goal: "Tu vas apprendre à poser une addition, à gérer la retenue, puis t'entraîner avec trois questions.",
  lessons: [
    { title: "Poser l'addition", lines: ["Unités sous unités", "Dizaines sous dizaines", { text: "38 + 25 = ?", big: true }, "On commence par les unités"], voices: ["Pour poser une addition, on aligne les chiffres : les unités sous les unités, et les dizaines sous les dizaines. Et on commence toujours par les unités."] },
    { title: "38 + 25 : la retenue", lines: ["Unités : 8 + 5 = 13", "On écrit 3 et on retient 1", "Dizaines : 3 + 2 + 1 = 6", { text: "38 + 25 = 63", big: true }], voices: ["Prenons trente-huit plus vingt-cinq. Les unités d'abord : huit plus cinq, treize. On écrit trois, et on retient un.", "Puis les dizaines : trois plus deux, plus un de retenue, six. Donc trente-huit plus vingt-cinq égale soixante-trois !"] },
  ],
  quizzes: [
    { q: "27 + 15 = ?", options: ["42", "32", "41"], answer: 0, explain: "7 + 5 = 12 : on écrit 2, on retient 1", ask: "Première question. Vingt-sept plus quinze. Combien ça fait ?", reveal: "Quarante-deux ! Sept plus cinq, douze : on écrit deux et on retient un. Puis deux plus un plus un, quatre." },
    { q: "46 + 37 = ?", options: ["73", "83", "93"], answer: 1, explain: "6 + 7 = 13 : on écrit 3, on retient 1", ask: "Deuxième question. Quarante-six plus trente-sept.", reveal: "Quatre-vingt-trois ! Six plus sept, treize : on écrit trois, on retient un. Puis quatre plus trois plus un, huit." },
    { q: "58 + 24 = ?", options: ["72", "82", "92"], answer: 1, explain: "8 + 4 = 12 : on écrit 2, on retient 1", ask: "Dernière question. Cinquante-huit plus vingt-quatre.", reveal: "Quatre-vingt-deux ! Huit plus quatre, douze : on écrit deux et on retient un. Puis cinq plus deux plus un, huit." },
  ],
  recap: { lines: ["Unités sous unités", "On commence par les unités", "Plus de 9 : on écrit l'unité et on retient la dizaine"], voice: "On résume. On aligne les chiffres, on commence par les unités, et quand on dépasse neuf, on écrit le chiffre des unités et on retient la dizaine." },
  bye: "Roooar ! Bravo, champion de l'addition ! À la prochaine vidéo, à bientôt !",
}));

/* ───── Deuxième et troisième cours de chaque classe (un par jour en rotation, puis la banque) ───── */

add(course({
  id: "d00-soir-cours-cp-voyelles", day: 0, slot: "soir", title: "Mini-cours CP : les voyelles", level: "CP · Français",
  hook: "Mini-cours de français pour les CP : les voyelles 🔤",
  body: "Au programme : les 6 voyelles, comment les reconnaître au début des mots, et 3 questions pour s'entraîner. Réponds dans les commentaires avant la correction !\n\nUn mini-cours Jotna School avec Pio.",
  hookTitle: "Mini-cours : les voyelles",
  hookVoice: "Salut les CP ! Je suis Pio. Aujourd'hui, mini-cours de français : les voyelles.",
  goal: "Tu vas découvrir les voyelles, les écouter dans des mots, puis t'entraîner avec trois questions.",
  lessons: [
    { title: "Les voyelles", lines: [{ text: "a · e · i · o · u · y", big: true }, "Il y a 6 voyelles", "Les autres lettres sont des consonnes"], voices: ["En français, il y a six voyelles : a, e, i, o, u, et y. Toutes les autres lettres sont des consonnes."] },
    { title: "Écoute-les dans les mots", lines: ["🌳 arbre : a", "🏝️ île : i", "🍊 orange : o", "🏭 usine : u"], voices: ["On les entend au début de beaucoup de mots : a comme arbre, i comme île, o comme orange, u comme usine."] },
  ],
  quizzes: [
    { q: "Quelle lettre est une voyelle ?", options: ["b", "o", "t"], answer: 1, explain: "Le o est une voyelle", ask: "Première question. Quelle lettre est une voyelle : b, o ou t ?", reveal: "O ! Le o est une voyelle." },
    { q: "Combien y a-t-il de voyelles ?", options: ["4", "6", "8"], answer: 1, explain: "a, e, i, o, u, y", ask: "Deuxième question. Combien y a-t-il de voyelles en français ?", reveal: "Six : a, e, i, o, u et y." },
    { q: "« orange » commence par…", options: ["une voyelle", "une consonne"], answer: 0, explain: "Orange commence par la lettre o", ask: "Dernière question. Le mot orange commence-t-il par une voyelle ou par une consonne ?", reveal: "Par une voyelle ! Orange commence par la lettre o." },
  ],
  recap: { lines: [{ text: "a · e · i · o · u · y", big: true }, "Les autres lettres : des consonnes"], voice: "On résume. Les voyelles sont a, e, i, o, u et y. Toutes les autres lettres sont des consonnes." },
  bye: "Roooar ! Bravo, petit lecteur ! À la prochaine vidéo, à bientôt !",
}));
add(course({
  id: "d00-soir-cours-ce1-saisons", day: 0, slot: "soir", title: "Mini-cours CE1 : les saisons au Sénégal", level: "CE1 · Éveil",
  hook: "Mini-cours d'éveil pour les CE1 : les saisons au Sénégal ☀️🌧️",
  body: "Au programme : les deux grandes saisons, ce qui les distingue, et 3 questions pour s'entraîner. Réponds dans les commentaires avant la correction !\n\nUn mini-cours Jotna School avec Pio.",
  hookTitle: "Mini-cours : les saisons",
  hookVoice: "Salut les CE1 ! Je suis Pio. Aujourd'hui, mini-cours d'éveil : les saisons au Sénégal.",
  goal: "Tu vas découvrir les deux grandes saisons, ce qui les distingue, puis t'entraîner avec trois questions.",
  lessons: [
    { title: "Deux grandes saisons", lines: ["☀️ La saison sèche", "🌧️ La saison des pluies"], voices: ["Au Sénégal, on parle surtout de deux saisons : la saison sèche et la saison des pluies."] },
    { title: "La saison des pluies", lines: ["🌧️ Il pleut souvent", "🌱 Les plantes poussent", "D'environ juillet à octobre"], voices: ["La saison des pluies arrive en général vers juillet, et dure jusqu'en octobre environ. Il pleut souvent, et les plantes poussent."] },
    { title: "La saison sèche", lines: ["☀️ Il pleut très peu", "🌾 La terre devient sèche", "D'environ novembre à juin"], voices: ["La saison sèche vient ensuite, de novembre à juin environ. Il pleut très peu, et la terre devient sèche."] },
  ],
  quizzes: [
    { q: "Quand il pleut souvent, c'est…", options: ["la saison sèche", "la saison des pluies"], answer: 1, explain: "Il pleut souvent en saison des pluies", ask: "Première question. Quand il pleut souvent, quelle est la saison ?", reveal: "La saison des pluies !" },
    { q: "Que font les plantes en saison des pluies ?", options: ["Elles poussent", "Elles dorment"], answer: 0, explain: "L'eau fait pousser les plantes", ask: "Deuxième question. Que font les plantes pendant la saison des pluies ?", reveal: "Elles poussent ! L'eau les aide à grandir." },
    { q: "Combien de grandes saisons au Sénégal ?", options: ["2", "4", "6"], answer: 0, explain: "La saison sèche et la saison des pluies", ask: "Dernière question. Combien de grandes saisons y a-t-il au Sénégal ?", reveal: "Deux ! La saison sèche et la saison des pluies." },
  ],
  recap: { lines: ["Deux grandes saisons", "Pluies : juillet à octobre environ", "Sèche : novembre à juin environ"], voice: "On résume. Il y a deux grandes saisons : la saison des pluies, de juillet à octobre environ, et la saison sèche, de novembre à juin environ." },
  bye: "Roooar ! Bravo, petit météorologue ! À la prochaine vidéo, à bientôt !",
}));
add(course({
  id: "d00-soir-cours-cm1-eau", day: 0, slot: "soir", title: "Mini-cours CM1 : le cycle de l'eau", level: "CM1 · Éveil scientifique",
  hook: "Mini-cours d'éveil scientifique pour les CM1 : le cycle de l'eau 💧",
  body: "Au programme : le voyage d'une goutte d'eau (évaporation, condensation, précipitations) et 3 questions pour s'entraîner. Réponds dans les commentaires avant la correction !\n\nUn mini-cours Jotna School avec Pio.",
  hookTitle: "Mini-cours : le cycle de l'eau",
  hookVoice: "Salut les CM1 ! Je suis Pio. Aujourd'hui, mini-cours d'éveil scientifique : le cycle de l'eau.",
  goal: "Tu vas suivre le voyage d'une goutte d'eau, puis t'entraîner avec trois questions.",
  lessons: [
    { title: "Le voyage d'une goutte", lines: ["☀️ Le soleil chauffe l'eau : l'évaporation", "☁️ La vapeur se refroidit : la condensation", "🌧️ L'eau retombe : les précipitations"], voices: ["Le soleil chauffe l'eau de la mer, des fleuves et des lacs : elle se transforme en vapeur. C'est l'évaporation.", "En montant, la vapeur se refroidit et forme des nuages. C'est la condensation. Puis l'eau retombe en pluie : ce sont les précipitations."] },
    { title: "Et après la pluie ?", lines: ["💧 L'eau coule vers les rivières", "🌍 Une partie s'infiltre dans le sol", { text: "Le cycle recommence !", big: true }], voices: ["Après la pluie, une partie de l'eau coule vers les rivières et la mer, et une partie s'infiltre dans le sol. Et le cycle recommence !"] },
  ],
  quizzes: [
    { q: "Le soleil chauffe l'eau : c'est…", options: ["l'évaporation", "la condensation", "les précipitations"], answer: 0, explain: "L'eau devient vapeur", ask: "Première question. Quand le soleil chauffe l'eau et la transforme en vapeur, comment ça s'appelle ?", reveal: "L'évaporation !" },
    { q: "Les nuages se forment par…", options: ["l'évaporation", "la condensation", "les précipitations"], answer: 1, explain: "La vapeur se refroidit et forme des nuages", ask: "Deuxième question. Comment les nuages se forment-ils ?", reveal: "Par la condensation : la vapeur se refroidit et forme des nuages." },
    { q: "La pluie, c'est…", options: ["l'évaporation", "la condensation", "les précipitations"], answer: 2, explain: "L'eau retombe du ciel", ask: "Dernière question. Quand l'eau retombe du ciel, comment ça s'appelle ?", reveal: "Les précipitations ! Bravo." },
  ],
  recap: { lines: ["Évaporation : l'eau devient vapeur", "Condensation : la vapeur forme des nuages", "Précipitations : l'eau retombe"], voice: "On résume. L'évaporation transforme l'eau en vapeur. La condensation forme les nuages. Les précipitations font retomber l'eau." },
  bye: "Roooar ! Bravo, petit scientifique ! À la prochaine vidéo, à bientôt !",
}));
add(course({
  id: "d00-soir-cours-cm2-aire", day: 0, slot: "soir", title: "Mini-cours CM2 : périmètre et aire du rectangle", level: "CM2 · Mathématiques",
  hook: "Mini-cours de maths pour les CM2 : périmètre et aire du rectangle 📐",
  body: "Au programme : les deux formules (périmètre et aire), un exemple, et 3 questions pour s'entraîner. Réponds dans les commentaires avant la correction !\n\nUn mini-cours Jotna School avec Pio.",
  hookTitle: "Mini-cours : périmètre et aire",
  hookVoice: "Salut les CM2 ! Je suis Pio. Aujourd'hui, mini-cours de mathématiques : le périmètre et l'aire d'un rectangle.",
  goal: "Tu vas apprendre deux formules, puis t'entraîner avec trois questions.",
  lessons: [
    { title: "Le périmètre", lines: ["Le périmètre : le tour de la figure", { text: "P = 2 × (L + l)", big: true }, "Rectangle de 6 cm sur 4 cm", { text: "P = 2 × (6 + 4) = 20 cm", big: true }], voices: ["Le périmètre, c'est la longueur du tour d'une figure. Pour un rectangle, on additionne la longueur et la largeur, et on multiplie par deux."] },
    { title: "L'aire", lines: ["L'aire : la surface à l'intérieur", { text: "A = L × l", big: true }, "Rectangle de 6 cm sur 4 cm", { text: "A = 6 × 4 = 24 cm²", big: true }], voices: ["L'aire, c'est la surface à l'intérieur de la figure. Pour un rectangle, on multiplie la longueur par la largeur. Pour six centimètres sur quatre, ça fait vingt-quatre centimètres carrés."] },
  ],
  quizzes: [
    { q: "Périmètre d'un rectangle de 5 cm sur 3 cm ?", options: ["16 cm", "15 cm", "8 cm"], answer: 0, explain: "2 × (5 + 3) = 16 cm", ask: "Première question. Quel est le périmètre d'un rectangle de cinq centimètres sur trois ?", reveal: "Seize centimètres ! Cinq plus trois, huit, multiplié par deux, seize." },
    { q: "Aire d'un rectangle de 5 cm sur 3 cm ?", options: ["15 cm²", "16 cm²", "8 cm²"], answer: 0, explain: "5 × 3 = 15 cm²", ask: "Deuxième question. Quelle est l'aire de ce même rectangle ?", reveal: "Quinze centimètres carrés ! Cinq fois trois, quinze." },
    { q: "Périmètre d'un carré de 4 cm de côté ?", options: ["8 cm", "16 cm", "12 cm"], answer: 1, explain: "4 + 4 + 4 + 4 = 16 cm", ask: "Dernière question. Quel est le périmètre d'un carré de quatre centimètres de côté ?", reveal: "Seize centimètres ! Un carré a quatre côtés égaux : quatre fois quatre." },
  ],
  recap: { lines: ["Périmètre : le tour → 2 × (L + l)", "Aire : la surface → L × l"], voice: "On résume. Le périmètre, c'est le tour : deux fois la longueur plus la largeur. L'aire, c'est la surface : la longueur fois la largeur." },
  bye: "Roooar ! Bravo, champion des figures ! À la prochaine vidéo, à bientôt !",
}));
add({
  id: "d00-soir-cours-coran-ba-ta-tha", day: 0, slot: "soir", type: "enfants", audience: "enfants", title: "Mini-cours d'arabe : bâ, tâ, thâ", level: "Arabe & Coran · niveau débutant", format: "video", music: "africa",
  hook: "Salam ! Mini-cours d'arabe : les lettres ب ت ث (bâ, tâ, thâ) 🦁",
  body: "Au programme : trois lettres de même forme qui ne se distinguent que par leurs points, et 3 questions pour s'entraîner.\n\nUn mini-cours du module Arabe & Coran de Jotna School, avec Pio.",
  cover: "Les lettres ب ت ث sur fond de nuit étoilée",
  beats: [
    hook("Mini-cours d'arabe : bâ, tâ, thâ", S("سَلَام ! Je suis Pio. Aujourd'hui, on découvre trois lettres sœurs : le bâ, le tâ et le thâ."), { pose: "salam", outfit: "boubou" }),
    pio("recite", S("Ces trois lettres ont presque la même forme. Ce qui change, ce sont les points. On va les écouter, puis s'entraîner avec trois questions."), { title: "Au programme", text: "Trois lettres, puis trois questions !", outfit: "boubou" }),
    { kind: "letter", glyph: "ب", name: "Bâ", sound: "Un point en dessous", voices: [S("Première lettre, le bâ. Écoute bien son nom."), SV2("بَاء", 0.3), S("Bâ. Elle a un seul point, placé en dessous.", 0.3)] },
    { kind: "letter", glyph: "ت", name: "Tâ", sound: "Deux points au-dessus", voices: [S("Deuxième lettre, le tâ. Écoute bien."), SV2("تَاء", 0.3), S("Tâ. Elle a deux points, placés au-dessus.", 0.3)] },
    { kind: "letter", glyph: "ث", name: "Thâ", sound: "Trois points au-dessus", voices: [S("Troisième lettre, le thâ. Écoute bien."), SV2("ثَاء", 0.3), S("Thâ. Elle a trois points, placés au-dessus.", 0.3)] },
    board("Même forme, points différents", [{ text: "ب : 1 point en dessous", big: true }, { text: "ت : 2 points au-dessus", big: true }, { text: "ث : 3 points au-dessus", big: true }],
      S("Regarde bien : la forme est la même. Seuls les points changent. Un point en dessous pour le bâ, deux points au-dessus pour le tâ, trois points au-dessus pour le thâ.")),
    quiz("Combien de points pour le tâ ت ?", ["1", "2", "3"], 1, "Le tâ a deux points, au-dessus", S("Première question. Combien de points a la lettre tâ ?"), S("Deux points, placés au-dessus !")),
    quiz("Le bâ ب a son point…", ["au-dessus", "en dessous"], 1, "Le bâ a un point en dessous", S("Deuxième question. Où se trouve le point de la lettre bâ ?"), S("En dessous ! Un seul point, sous la lettre.")),
    quiz("Quelle lettre a trois points ?", ["Bâ", "Tâ", "Thâ"], 2, "Le thâ a trois points, au-dessus", S("Dernière question. Quelle lettre a trois points ?"), S("Le thâ ! Trois points, au-dessus de la lettre.")),
    outro(S("Barakallahou fik ! Tu as bien travaillé. À la prochaine vidéo, à bientôt !")),
  ].map((b) => ({ tone: "night", ...b })),
});

add(course({
  id: "d00-soir-cours-ci-formes", day: 0, slot: "soir", title: "Mini-cours CI : les formes", level: "CI · Mathématiques",
  hook: "Mini-cours de maths pour les CI : cercle, carré, triangle ⚪🟦🔺",
  body: "Au programme : reconnaître le cercle, le carré et le triangle, et 3 questions pour s'entraîner. Réponds dans les commentaires avant la correction !\n\nUn mini-cours Jotna School avec Pio.",
  hookTitle: "Mini-cours : les formes",
  hookVoice: "Salut les CI ! Je suis Pio. Aujourd'hui, mini-cours de mathématiques : les formes.",
  goal: "Tu vas découvrir trois formes, puis t'entraîner avec trois questions.",
  lessons: [
    { title: "Le cercle", lines: [{ text: "⚪ Le cercle", big: true }, "Tout rond, sans aucun coin", "🌕 Comme la lune", "🍽️ Comme une assiette"], voices: ["Le cercle est tout rond, sans aucun coin. Comme la lune, ou comme une assiette."] },
    { title: "Le carré et le triangle", lines: [{ text: "🟦 Le carré", big: true }, "4 côtés égaux, 4 coins", { text: "🔺 Le triangle", big: true }, "3 côtés, 3 coins"], voices: ["Le carré a quatre côtés de la même longueur, et quatre coins. Le triangle a trois côtés et trois coins."] },
  ],
  quizzes: [
    { q: "Quelle forme est toute ronde ?", options: ["Le cercle", "Le carré", "Le triangle"], answer: 0, explain: "Le cercle est tout rond", ask: "Première question. Quelle forme est toute ronde ?", reveal: "Le cercle ! Il est tout rond, sans coin." },
    { q: "Combien de coins a le triangle ?", options: ["2", "3", "4"], answer: 1, explain: "Un triangle a 3 coins", ask: "Deuxième question. Combien de coins a le triangle ?", reveal: "Trois ! Un, deux, trois coins." },
    { q: "Combien de côtés a le carré ?", options: ["3", "4", "5"], answer: 1, explain: "Un carré a 4 côtés égaux", ask: "Dernière question. Combien de côtés a le carré ?", reveal: "Quatre ! Un, deux, trois, quatre côtés égaux." },
  ],
  recap: { lines: ["⚪ Cercle : tout rond", "🟦 Carré : 4 côtés égaux", "🔺 Triangle : 3 côtés"], voice: "On résume. Le cercle est tout rond. Le carré a quatre côtés égaux. Le triangle a trois côtés." },
  bye: "Roooar ! Bravo, petit géomètre ! À la prochaine vidéo, à bientôt !",
}));
add(course({
  id: "d00-soir-cours-cp-jours", day: 0, slot: "soir", title: "Mini-cours CP : les jours de la semaine", level: "CP · Français",
  hook: "Mini-cours de français pour les CP : les jours de la semaine 📅",
  body: "Au programme : les 7 jours de la semaine dans l'ordre, et 3 questions pour s'entraîner. Réponds dans les commentaires avant la correction !\n\nUn mini-cours Jotna School avec Pio.",
  hookTitle: "Mini-cours : les jours",
  hookVoice: "Salut les CP ! Je suis Pio. Aujourd'hui, mini-cours de français : les jours de la semaine.",
  goal: "Tu vas apprendre les sept jours dans l'ordre, puis t'entraîner avec trois questions.",
  lessons: [
    { title: "Sept jours", lines: [{ text: "Il y a 7 jours dans une semaine", big: true }, "lundi · mardi · mercredi · jeudi", "vendredi · samedi · dimanche"], voices: ["Une semaine compte sept jours : lundi, mardi, mercredi, jeudi, vendredi, samedi et dimanche."] },
    { title: "Dans l'ordre", lines: ["Lundi → mardi → mercredi", "Jeudi → vendredi", "Samedi → dimanche", "Et on recommence !"], voices: ["Après lundi, c'est mardi. Après mardi, mercredi. Puis jeudi, vendredi, samedi, et enfin dimanche. Et on recommence !"] },
  ],
  quizzes: [
    { q: "Combien de jours dans une semaine ?", options: ["5", "7", "10"], answer: 1, explain: "Une semaine = 7 jours", ask: "Première question. Combien y a-t-il de jours dans une semaine ?", reveal: "Sept jours !" },
    { q: "Après lundi, c'est…", options: ["mardi", "jeudi", "dimanche"], answer: 0, explain: "Lundi, puis mardi", ask: "Deuxième question. Quel jour vient après lundi ?", reveal: "Mardi !" },
    { q: "Le jour avant dimanche, c'est…", options: ["vendredi", "samedi", "lundi"], answer: 1, explain: "Samedi, puis dimanche", ask: "Dernière question. Quel jour vient juste avant dimanche ?", reveal: "Samedi ! Samedi, puis dimanche." },
  ],
  recap: { lines: ["7 jours dans une semaine", "lundi · mardi · mercredi · jeudi", "vendredi · samedi · dimanche"], voice: "On résume. Une semaine compte sept jours : lundi, mardi, mercredi, jeudi, vendredi, samedi et dimanche." },
  bye: "Roooar ! Bravo, petit calendrier ! À la prochaine vidéo, à bientôt !",
}));
add(course({
  id: "d00-soir-cours-ce1-dizaines", day: 0, slot: "soir", title: "Mini-cours CE1 : dizaines et unités", level: "CE1 · Mathématiques",
  hook: "Mini-cours de maths pour les CE1 : les dizaines et les unités 🔢",
  body: "Au programme : comprendre comment s'écrit un nombre (dizaines et unités), le décomposer, et 3 questions pour s'entraîner. Réponds dans les commentaires avant la correction !\n\nUn mini-cours Jotna School avec Pio.",
  hookTitle: "Mini-cours : dizaines et unités",
  hookVoice: "Salut les CE1 ! Je suis Pio. Aujourd'hui, mini-cours de mathématiques : les dizaines et les unités.",
  goal: "Tu vas comprendre comment on écrit un nombre, puis t'entraîner avec trois questions.",
  lessons: [
    { title: "Dizaines et unités", lines: ["10 unités = 1 dizaine", "Dans 47 : 4 dizaines", "Dans 47 : 7 unités", { text: "47 = 4 dizaines + 7 unités", big: true }], voices: ["Dix unités font une dizaine. Dans le nombre quarante-sept, il y a quatre dizaines et sept unités."] },
    { title: "Décomposer un nombre", lines: [{ text: "63 = 60 + 3", big: true }, { text: "85 = 80 + 5", big: true }, "Chiffre de gauche : les dizaines", "Chiffre de droite : les unités"], voices: ["On peut décomposer un nombre. Soixante-trois, c'est soixante plus trois. Quatre-vingt-cinq, c'est quatre-vingts plus cinq. Le chiffre de gauche donne les dizaines, celui de droite les unités."] },
  ],
  quizzes: [
    { q: "Dans 52, combien de dizaines ?", options: ["2", "5", "7"], answer: 1, explain: "52 = 5 dizaines + 2 unités", ask: "Première question. Dans cinquante-deux, combien y a-t-il de dizaines ?", reveal: "Cinq dizaines ! Et deux unités." },
    { q: "Dans 38, combien d'unités ?", options: ["3", "8", "11"], answer: 1, explain: "38 = 3 dizaines + 8 unités", ask: "Deuxième question. Dans trente-huit, combien y a-t-il d'unités ?", reveal: "Huit unités ! Et trois dizaines." },
    { q: "40 + 6 = ?", options: ["46", "64", "406"], answer: 0, explain: "4 dizaines + 6 unités = 46", ask: "Dernière question. Quarante plus six. Combien ça fait ?", reveal: "Quarante-six ! Quatre dizaines et six unités." },
  ],
  recap: { lines: ["10 unités = 1 dizaine", "À gauche : les dizaines", "À droite : les unités"], voice: "On résume. Dix unités font une dizaine. Dans un nombre, le chiffre de gauche donne les dizaines, et celui de droite les unités." },
  bye: "Roooar ! Bravo, champion des nombres ! À la prochaine vidéo, à bientôt !",
}));
add(course({
  id: "d00-soir-cours-cm1-present", day: 0, slot: "soir", title: "Mini-cours CM1 : le présent des verbes en -er", level: "CM1 · Français",
  hook: "Mini-cours de français pour les CM1 : le présent des verbes en -er ✍️",
  body: "Au programme : les terminaisons du présent des verbes du 1er groupe, et 3 questions pour s'entraîner. Réponds dans les commentaires avant la correction !\n\nUn mini-cours Jotna School avec Pio.",
  hookTitle: "Mini-cours : le présent",
  hookVoice: "Salut les CM1 ! Je suis Pio. Aujourd'hui, mini-cours de français : le présent des verbes du premier groupe.",
  goal: "Tu vas apprendre les terminaisons du présent, puis t'entraîner avec trois questions.",
  lessons: [
    { title: "Chanter au présent", lines: ["Je chante", "Tu chantes", "Il chante", "Nous chantons", "Vous chantez", "Ils chantent"], voices: ["Prenons le verbe chanter. Je chante, tu chantes, il chante, nous chantons, vous chantez, ils chantent."] },
    { title: "Les terminaisons", lines: [{ text: "-e · -es · -e · -ons · -ez · -ent", big: true }, "Les verbes en -er sont du 1er groupe", "On garde le début : chant-"], voices: ["Les verbes du premier groupe se terminent par e r. Au présent, on garde le début du verbe, et on ajoute : e, e s, e, o n s, e z, e n t."] },
  ],
  quizzes: [
    { q: "Tu (manger) → tu…", options: ["manges", "mange", "mangent"], answer: 0, explain: "Tu + es : tu manges", ask: "Première question. Tu, verbe manger. Comment on écrit ?", reveal: "Tu manges, avec e s !" },
    { q: "Nous (jouer) → nous…", options: ["jouez", "jouons", "jouent"], answer: 1, explain: "Nous + ons : nous jouons", ask: "Deuxième question. Nous, verbe jouer. Comment on écrit ?", reveal: "Nous jouons, avec o n s !" },
    { q: "Ils (danser) → ils…", options: ["dansent", "danses", "dansez"], answer: 0, explain: "Ils + ent : ils dansent", ask: "Dernière question. Ils, verbe danser. Comment on écrit ?", reveal: "Ils dansent, avec e n t !" },
  ],
  recap: { lines: ["Verbes en -er : 1er groupe", { text: "-e · -es · -e · -ons · -ez · -ent", big: true }], voice: "On résume. Les verbes en e r sont du premier groupe. Au présent, leurs terminaisons sont : e, e s, e, o n s, e z, e n t." },
  bye: "Roooar ! Bravo, champion de la conjugaison ! À la prochaine vidéo, à bientôt !",
}));
add(course({
  id: "d00-soir-cours-cm2-pourcentages", day: 0, slot: "soir", title: "Mini-cours CM2 : les pourcentages", level: "CM2 · Mathématiques",
  hook: "Mini-cours de maths pour les CM2 : les pourcentages simples 💯",
  body: "Au programme : ce que veut dire « pour cent », 50 %, 25 % et 10 %, et 3 questions pour s'entraîner. Réponds dans les commentaires avant la correction !\n\nUn mini-cours Jotna School avec Pio.",
  hookTitle: "Mini-cours : les pourcentages",
  hookVoice: "Salut les CM2 ! Je suis Pio. Aujourd'hui, mini-cours de mathématiques : les pourcentages.",
  goal: "Tu vas découvrir ce que veut dire pour cent, puis calculer des pourcentages simples, avec trois questions.",
  lessons: [
    { title: "Pour cent", lines: ["Pour cent = sur 100", { text: "50 % = la moitié", big: true }, { text: "25 % = le quart", big: true }, { text: "10 % = le dixième", big: true }], voices: ["Un pourcentage, c'est une quantité sur cent. Cinquante pour cent, c'est la moitié. Vingt-cinq pour cent, c'est le quart. Dix pour cent, c'est le dixième."] },
    { title: "Calculer", lines: [{ text: "50 % de 40 = 20", big: true }, { text: "25 % de 40 = 10", big: true }, { text: "10 % de 40 = 4", big: true }], voices: ["Pour calculer cinquante pour cent de quarante, on prend la moitié : vingt. Pour vingt-cinq pour cent, le quart : dix. Et pour dix pour cent, on divise par dix : quatre."] },
  ],
  quizzes: [
    { q: "50 % de 60 = ?", options: ["20", "30", "50"], answer: 1, explain: "50 % = la moitié : 60 ÷ 2 = 30", ask: "Première question. Cinquante pour cent de soixante.", reveal: "Trente ! C'est la moitié de soixante." },
    { q: "25 % de 80 = ?", options: ["20", "25", "40"], answer: 0, explain: "25 % = le quart : 80 ÷ 4 = 20", ask: "Deuxième question. Vingt-cinq pour cent de quatre-vingts.", reveal: "Vingt ! C'est le quart de quatre-vingts." },
    { q: "10 % de 90 = ?", options: ["9", "19", "10"], answer: 0, explain: "10 % = diviser par 10 : 90 ÷ 10 = 9", ask: "Dernière question. Dix pour cent de quatre-vingt-dix.", reveal: "Neuf ! On divise quatre-vingt-dix par dix." },
  ],
  recap: { lines: ["50 % : la moitié", "25 % : le quart", "10 % : diviser par 10"], voice: "On résume. Cinquante pour cent, c'est la moitié. Vingt-cinq pour cent, le quart. Et dix pour cent, on divise par dix." },
  bye: "Roooar ! Bravo, champion des pourcentages ! À la prochaine vidéo, à bientôt !",
}));

/** Publicité du module Arabe & Coran, pour les parents (le module est activé par l'école). */
add({
  id: "d00-midi-pub-coran", day: 0, slot: "midi", type: "pub", audience: "parents", title: "Pub Arabe & Coran : lettre après lettre", format: "video", music: "africa",
  hook: "Arabe & Coran : votre enfant apprend lettre après lettre 🕌",
  body: `Dans le module Arabe & Coran, l'enfant avance sur un chemin jusqu'à la Kaaba : 30 leçons en 6 niveaux, l'alphabet de 28 lettres, les voyelles, les premiers mots et six sourates courtes. Pio l'écoute et l'encourage. Jotna ne conserve pas sa voix.\n\nModule activé par l'école. Gratuit pendant le lancement pour l'année scolaire 2026-2027.`,
  cover: "Titre « Arabe & Coran » sur fond de nuit étoilée",
  beats: [
    hook("Arabe & Coran, lettre après lettre", R("[warmly] Votre enfant apprend l'arabe et le Coran ? Voici comment Jotna School l'accompagne, lettre après lettre."), { kicker: "Parents", pose: "salam", outfit: "boubou" }),
    phone("quran", R("Le module Arabe et Coran guide l'enfant sur un chemin, du village jusqu'à la Kaaba : trente leçons, en six niveaux."), { title: "Le chemin du Coran" }),
    stat("28", "lettres à découvrir", "puis les voyelles, les premiers mots et six sourates courtes", R("Il commence par les vingt-huit lettres de l'alphabet. Puis viennent les voyelles, les premiers mots, et six sourates courtes.")),
    pio("recite", R("L'enfant répète au micro, et l'application l'écoute. Pio l'encourage : jamais de reproche. Et Jotna ne conserve pas sa voix."), { title: "Il répète, Pio l'écoute", outfit: "boubou" }),
    pio("idle", R("Les consignes sont dites à voix haute, en français puis en arabe : l'enfant n'est jamais seul face à la page."), { title: "Des consignes à voix haute", outfit: "boubou" }),
    pio("bravo", R("Chaque lettre se trace au doigt, on éclate des ballons, et on gagne des autocollants dorés dans « Mon album ». Apprendre devient un jeu !"), { title: "Mon album", outfit: "boubou" }),
    pio("salam", R("Ce module est activé par l'école. Si vous souhaitez le proposer à votre enfant, parlez-en à son école."), { title: "Activé par l'école", outfit: "boubou" }),
    FREE, CTA_ARABE,
  ].map((b) => ({ tone: "night", ...b })),
});

/* ───── Planning : 2 publications par jour, du 19 octobre au 7 novembre (20 jours) ───── */
// Chaque jour : UNE publicité (créneau de midi) et UN cours (créneau du soir). Les cours tournent sur les classes :
// CI, CP, CE1, CE2, CM1, CM2, puis Arabe & Coran, et on recommence (trois fois par classe en tout).
// La première semaine, la publicité du jour vise la classe du cours ; ensuite elle alterne publicités, explicatifs et tutoriels.
// Jamais plus de deux publications par jour : la banque ci-dessous sert à REMPLACER un créneau, de façon aléatoire et régulière.
const SCHEDULE = [
  ["pub-jeu", "cours-ci"],
  ["pub-cp", "enfants-sons"],
  ["pub-ce1", "cours-ce1"],
  ["pub-ce2", "enfants-multiplication"],
  ["pub-cm1", "enfants-fractions"],
  ["pub-cm2", "enfants-capitale"],
  ["pub-coran", "enfants-lettre-jim"],
  ["pub-ci", "enfants-couleurs"],
  ["pub-gratuit-parents", "cours-cp-voyelles"],
  ["pub-ecoles", "cours-ce1-saisons"],
  ["pub-profs", "enfants-pluriel"],
  ["explicatif-pio", "cours-cm1-eau"],
  ["pub-recap", "cours-cm2-aire"],
  ["tuto-profs-pdf", "cours-coran-ba-ta-tha"],
  ["tuto-parents-inscription", "cours-ci-formes"],
  ["explicatif-palier", "cours-cp-jours"],
  ["explicatif-etoiles", "cours-ce1-dizaines"],
  ["explicatif-erreur", "enfants-mammiferes"],
  ["tuto-parents-suivi", "cours-cm1-present"],
  ["pub-final", "cours-cm2-pourcentages"],
].flat();
// Banque : à publier quand on veut, à la place d'une publicité du planning (jamais en plus).
const BANK = ["explicatif-formats", "tuto-eleve-reperes", "explicatif-arabe-micro", "visuel-matieres", "visuel-parents-reflexes", "visuel-ecoles", "visuel-code-enfant"];
const slugOf = (p) => p.id.split("-").slice(2).join("-");
const bySlug = new Map(posts.map((p) => [slugOf(p), p]));
const need = (slug) => {
  const p = bySlug.get(slug);
  if (!p) throw new Error(`Publication inconnue : ${slug}`);
  return p;
};
const scheduled = SCHEDULE.map((slug, i) => {
  const day = Math.floor(i / 2) + 1;
  const slot = i % 2 === 0 ? "midi" : "soir";
  return { ...need(slug), day, slot, id: `d${String(day).padStart(2, "0")}-${slot}-${slug}` };
});
const bank = BANK.map((slug, i) => ({ ...need(slug), day: 0, slot: "banque", bank: true, id: `bank-${String(i + 1).padStart(2, "0")}-${slug}` }));

// Légendes par réseau, composées à partir de `hook` et `body`. Les posts d'enfants n'invitent à aucune inscription.
const out = [...scheduled, ...bank].map(({ hook: h, body, ...p }) => {
  const tags = TAGS[p.audience] ?? TAGS.tous;
  const kids = p.audience === "enfants";
  return {
    ...p,
    hashtags: tags,
    caption: {
      tiktok: `${h} ${kids ? "Réponds dans les commentaires !" : "Gratuit pendant le lancement pour l'année scolaire 2026-2027."} ${tags.slice(0, 4).join(" ")}`,
      instagram: `${h}\n\n${body}\n\n${kids ? "" : "👉 Lien en bio : jotnaschool.com\n\n"}${tags.join(" ")}`,
      facebook: `${h}\n\n${body}\n\n${kids ? "En savoir plus : https://jotnaschool.com" : "Créez votre compte gratuit : https://jotnaschool.com"}`,
    },
  };
});

const here = dirname(fileURLToPath(import.meta.url));
writeFileSync(join(here, "..", "src", "social", "posts.json"), JSON.stringify(out, null, 1) + "\n");
const seen = new Set();
let total = 0;
for (const p of out) for (const b of p.beats) for (const v of b.voices ?? []) { const k = `${v.who}|${v.model}|${v.text}`; if (!seen.has(k)) { seen.add(k); total += v.text.length; } }
console.log(`${out.length} publications : ${out.filter((p) => p.format === "video").length} vidéos, ${out.filter((p) => p.format === "carousel").length} carrousels ; ${seen.size} répliques distinctes, ${total} caractères`);
