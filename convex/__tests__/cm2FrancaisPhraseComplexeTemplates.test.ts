import { acceptedOf, all, blankOf, defineMathsTests, itemsOf, ok, optionsOf, pairsOf, rightOption, textOf, wrongOf, zonesOf, type Check } from "@/lib/test-support/cm1MathsKit";

/**
 * LA PHRASE COMPLEXE DU CM2 (`fr-cm2-phrase-complexe`).
 *
 * Ce fichier a son propre corpus de phrases analysées, écrit à part de `cm2PhraseComplexe.ts` : les phrases à une proposition, les propositions juxtaposées et
 * coordonnées (avec leur nombre de verbes conjugués), les phrases à proposition relative (le pronom, le mot qu'il complète), les groupes COD, COI et COS, les phrases à mot
 * de liaison. Il RELIT chaque exercice : la phrase doit être dans son corpus, la bonne réponse doit être celle de l'analyse, et aucun mauvais choix ne doit être une
 * deuxième bonne réponse (un pronom relatif n'est jamais valable que s'il est celui de l'analyse, un mot de liaison que s'il est celui du sens).
 */

const SIMPLE = [
  "Awa chante une chanson.",
  "Les enfants jouent dans la cour.",
  "Moussa et Fatou mangent du riz.",
  "Le pêcheur lance son filet dans la mer.",
  "Le car arrive demain matin.",
  "Nous achetons du pain et des mangues.",
  "Le maître donne un livre à Awa.",
  "Mon frère travaille dans le champ.",
  "Les femmes vendent des légumes au marché.",
  "Khady lit un livre sur les baobabs.",
  "Ma mère et ma tante préparent le repas.",
  "Le chef parle aux villageois.",
];
const JUXTAPOSED: [string, number][] = [
  ["Awa chante, Moussa danse.", 2],
  ["Le soleil se lève, les oiseaux chantent.", 2],
  ["Il pleut, les enfants restent à la maison.", 2],
  ["Fatou lit, Modou dessine.", 2],
  ["Le vent souffle, les feuilles tombent.", 2],
  ["Le car arrive, les voyageurs montent.", 2],
  ["Les pêcheurs partent, la mer est calme.", 2],
  ["Le chef parle, tout le monde écoute.", 2],
  ["J'arrive, tu pars.", 2],
  ["La nuit tombe, le village s'endort.", 2],
  ["Le coq chante, le jour se lève, les paysans partent.", 3],
];
const COORDINATED = [
  "Awa chante et Moussa danse.",
  "Il est petit mais il court vite.",
  "Awa reste à la maison car elle est malade.",
  "Il a beaucoup plu donc la route est inondée.",
  "Moussa pêche et sa sœur vend le poisson.",
  "Le chat dort mais le chien veille.",
  "Je veux jouer mais je dois travailler.",
  "Nous avons faim donc nous mangeons.",
  "Elle ouvre la porte et elle sort.",
  "Il ne sort pas car il est malade.",
  "Les enfants jouent et les parents bavardent.",
  "Ma sœur prépare le repas et le sert.",
];
const MIXED = ["Il pleut, nous restons dedans et nous jouons.", "Le coq chante, le jour se lève et les paysans partent."];
type R = { text: string; before: string; rel: string; after: string; pronoun: string; antecedent: string };
const rr = (before: string, rel: string, after: string, pronoun: string, antecedent: string): R => ({ text: `${before} ${rel} ${after}`, before, rel, after, pronoun, antecedent });
const RELATIVES: R[] = [
  rr("Le garçon", "qui joue au ballon", "est mon frère.", "qui", "garçon"),
  rr("Un oiseau", "qui chantait", "s'est posé sur le toit.", "qui", "oiseau"),
  rr("La femme", "qui vend des mangues", "s'appelle Awa.", "qui", "femme"),
  rr("Les enfants", "qui courent", "sont contents.", "qui", "enfants"),
  rr("Le pêcheur", "qui lance le filet", "est fort.", "qui", "pêcheur"),
  rr("Mon voisin", "qui travaille au port", "rentre tard.", "qui", "voisin"),
  rr("Le livre", "que j'ai lu", "est long.", "que", "livre"),
  rr("La mangue", "que tu manges", "est mûre.", "que", "mangue"),
  rr("Les chansons", "que Fatou chante", "sont belles.", "que", "chansons"),
  rr("Le poisson", "que le pêcheur a pris", "est gros.", "que", "poisson"),
  rr("Le cadeau", "que Moussa offre", "est joli.", "que", "cadeau"),
  rr("Les fruits", "que ma mère achète", "sont frais.", "que", "fruits"),
  rr("La fille", "dont je parle", "est ma cousine.", "dont", "fille"),
  rr("Le livre", "dont tu as besoin", "est sur la table.", "dont", "livre"),
  rr("Le chien", "dont les enfants ont peur", "est attaché.", "dont", "chien"),
  rr("Le village", "dont il vient", "est loin d'ici.", "dont", "village"),
  rr("La maison", "où Awa dort", "est petite.", "où", "maison"),
  rr("Le marché", "où ma mère vend des légumes", "est grand.", "où", "marché"),
  rr("La cour", "où les enfants jouent", "est grande.", "où", "cour"),
  rr("La ville", "où mon oncle travaille", "est grande.", "où", "ville"),
];
const OBJECTS: [string, string, string][] = [
  ["Je donne un livre à Awa.", "un livre", "COD"],
  ["Je donne un livre à Awa.", "à Awa", "COS"],
  ["Le maître prête un crayon à Moussa.", "un crayon", "COD"],
  ["Le maître prête un crayon à Moussa.", "à Moussa", "COS"],
  ["Maman offre un cadeau à ma sœur.", "un cadeau", "COD"],
  ["Maman offre un cadeau à ma sœur.", "à ma sœur", "COS"],
  ["Le pêcheur vend du poisson aux clients.", "du poisson", "COD"],
  ["Le pêcheur vend du poisson aux clients.", "aux clients", "COS"],
  ["Fatou envoie une lettre à sa tante.", "une lettre", "COD"],
  ["Fatou envoie une lettre à sa tante.", "à sa tante", "COS"],
  ["Le chef raconte une histoire aux enfants.", "une histoire", "COD"],
  ["Le chef raconte une histoire aux enfants.", "aux enfants", "COS"],
  ["Papa montre le chemin à Omar.", "le chemin", "COD"],
  ["Papa montre le chemin à Omar.", "à Omar", "COS"],
  ["Nous apportons des mangues à notre voisine.", "des mangues", "COD"],
  ["Nous apportons des mangues à notre voisine.", "à notre voisine", "COS"],
  ["Le maître rend les cahiers aux élèves.", "les cahiers", "COD"],
  ["Le maître rend les cahiers aux élèves.", "aux élèves", "COS"],
  ["Moussa écrit une carte à son ami.", "une carte", "COD"],
  ["Moussa écrit une carte à son ami.", "à son ami", "COS"],
  ["Le directeur donne un prix à Fatou.", "un prix", "COD"],
  ["Le directeur donne un prix à Fatou.", "à Fatou", "COS"],
  ["Ma tante envoie des fruits à mon père.", "des fruits", "COD"],
  ["Ma tante envoie des fruits à mon père.", "à mon père", "COS"],
  ["Le vendeur rend la monnaie au client.", "la monnaie", "COD"],
  ["Le vendeur rend la monnaie au client.", "au client", "COS"],
  ["Tu prêtes ton vélo à ton frère.", "ton vélo", "COD"],
  ["Tu prêtes ton vélo à ton frère.", "à ton frère", "COS"],
  ["Awa parle à Moussa.", "à Moussa", "COI"],
  ["Les élèves obéissent au maître.", "au maître", "COI"],
  ["Fatou téléphone à sa tante.", "à sa tante", "COI"],
  ["Moussa pense à sa mère.", "à sa mère", "COI"],
  ["Nous parlons de notre voyage.", "de notre voyage", "COI"],
  ["Les enfants jouent au ballon.", "au ballon", "COI"],
  ["Tu ressembles à ton père.", "à ton père", "COI"],
  ["Le chef sourit aux enfants.", "aux enfants", "COI"],
  ["Ils rêvent de leurs vacances.", "de leurs vacances", "COI"],
  ["Elle répond à sa voisine.", "à sa voisine", "COI"],
];
const LIAISONS: [string, string, string][] = [
  ["Il est petit", "il court très vite.", "mais"],
  ["Le sol est mouillé", "il a plu.", "car"],
  ["Il a beaucoup plu", "la route est inondée.", "donc"],
  ["Moussa est fatigué", "il continue de travailler.", "mais"],
  ["Awa reste à la maison", "elle est malade.", "car"],
  ["Awa est fatiguée", "elle se couche tôt.", "donc"],
  ["Awa est malade", "elle va à l'école.", "mais"],
  ["Les enfants sont contents", "c'est vendredi.", "car"],
  ["Moussa a faim", "il mange du riz.", "donc"],
  ["Il pleut", "nous sortons quand même.", "mais"],
  ["Moussa mange beaucoup", "il a très faim.", "car"],
  ["Le car est en retard", "nous attendons.", "donc"],
  ["Je voudrais venir", "je n'ai pas le temps.", "mais"],
  ["Nous rentrons", "la nuit tombe.", "car"],
  ["Il fait nuit", "les enfants dorment.", "donc"],
  ["Le car est ancien", "il roule bien.", "mais"],
  ["Fatou allume la lampe", "il fait sombre.", "car"],
  ["Le puits est vide", "les femmes vont à la rivière.", "donc"],
];

type Info = { count: number; link: "simple" | "juxtaposées" | "coordonnées" | "relative" | "mixte" };
const INFO = new Map<string, Info>();
for (const text of SIMPLE) INFO.set(text, { count: 1, link: "simple" });
for (const [text, count] of JUXTAPOSED) INFO.set(text, { count, link: "juxtaposées" });
for (const text of COORDINATED) INFO.set(text, { count: 2, link: "coordonnées" });
for (const text of MIXED) INFO.set(text, { count: 3, link: "mixte" });
for (const r of RELATIVES) INFO.set(r.text, { count: 2, link: "relative" });

const LABELS = { juxtaposées: "Juxtaposées", coordonnées: "Coordonnées", relative: "Subordonnée relative" } as const;
const PRONOUNS = ["qui", "que", "dont", "où"];
const apostrophes = (text: string) => (text.match(/'/g) ?? []).length;
const between = (prompt: string, open: string, close: string): string | null => {
  const from = prompt.indexOf(open);
  if (from < 0) return null;
  const to = prompt.indexOf(close, from + open.length);
  return to < 0 ? null : prompt.slice(from + open.length, to);
};

const checkCount: Check = (exo) => {
  const m = /^Combien de propositions la phrase « (.+) » contient-elle \?$/.exec(exo.prompt);
  const info = m ? INFO.get(m[1]) : undefined;
  if (!m || !info) return `phrase inconnue : ${exo.prompt}`;
  return all(ok(rightOption(exo) === String(info.count), `${exo.prompt} : ${rightOption(exo)}, pas ${info.count}`), ok(optionsOf(exo).slice().sort().join() === "1,2,3", `les choix : ${optionsOf(exo).join(" ; ")}`), ok(apostrophes(m[1]) <= 1, "plus d'une apostrophe"));
};

const checkWrite: Check = (exo) => {
  const m = /^Écris en chiffre le nombre de propositions de la phrase « (.+) »\.$/.exec(exo.prompt);
  const info = m ? INFO.get(m[1]) : undefined;
  if (!m || !info) return `phrase inconnue : ${exo.prompt}`;
  const words = ["", "une", "deux", "trois"];
  return all(
    ok(info.link !== "mixte", "une phrase mixte posée à écrire"),
    ok(exo.answerKey === String(info.count), `${exo.prompt} : ${exo.answerKey}, pas ${info.count}`),
    ok(acceptedOf(exo).includes(String(info.count)) && acceptedOf(exo).includes(words[info.count]), `les réponses admises : ${acceptedOf(exo).join(" ; ")}`),
  );
};

const checkLink: Check = (exo) => {
  const m = /^Comment sont reliées les propositions de la phrase « (.+) » \?$/.exec(exo.prompt);
  const info = m ? INFO.get(m[1]) : undefined;
  if (!m || !info) return `phrase inconnue : ${exo.prompt}`;
  if (info.link === "simple" || info.link === "mixte" || info.count !== 2) return `une phrase qui n'a pas un lien net : ${m[1]}`;
  return all(ok(rightOption(exo) === LABELS[info.link], `${exo.prompt} : ${rightOption(exo)}, pas ${LABELS[info.link]}`), ok(optionsOf(exo).slice().sort().join() === Object.values(LABELS).sort().join(), `les choix : ${optionsOf(exo).join(" ; ")}`));
};

const checkPronoun: Check = (exo) => {
  const text = textOf(exo);
  const r = RELATIVES.find((candidate) => `${candidate.before} ___ ${candidate.rel.slice(candidate.pronoun.length + 1)} ${candidate.after}` === text);
  if (!r) return `phrase à trou inconnue : ${text}`;
  const { answer, options } = blankOf(exo);
  return all(
    ok(answer === r.pronoun, `${text} : ${answer}, pas ${r.pronoun}`),
    ok(options.length === 3 && new Set(options).size === 3 && options.every((o) => PRONOUNS.includes(o)), `les choix : ${options.join(" ; ")}`),
    ok(options.filter((o) => o === r.pronoun).length === 1, "deux fois la bonne réponse"),
  );
};

const checkAntecedent: Check = (exo) => {
  const m = /^Dans la phrase « (.+) », quel mot le pronom « (.+) » complète-t-il \?$/.exec(exo.prompt);
  const r = m ? RELATIVES.find((candidate) => candidate.text === m[1]) : undefined;
  if (!m || !r) return `phrase inconnue : ${exo.prompt}`;
  return all(
    ok(m[2] === r.pronoun, `le pronom demandé est ${m[2]}, la phrase a ${r.pronoun}`),
    ok(rightOption(exo) === r.antecedent, `${exo.prompt} : ${rightOption(exo)}, pas ${r.antecedent}`),
    ok(wrongOf(exo).every((o) => o !== r.antecedent && r.text.includes(o)), `un mauvais choix qui n'est pas un mot de la phrase ou qui est la bonne réponse : ${wrongOf(exo).join(" ; ")}`),
  );
};

const checkRelative: Check = (exo) => {
  if (exo.prompt !== "Quelle phrase contient une proposition subordonnée relative ?") return `énoncé inconnu : ${exo.prompt}`;
  const infos = optionsOf(exo).map((option) => INFO.get(option));
  if (infos.some((info) => info === undefined)) return `une phrase hors corpus : ${optionsOf(exo).join(" | ")}`;
  const links = (infos as Info[]).map((info) => info.link);
  return all(
    ok(links.filter((link) => link === "relative").length === 1 && links.filter((link) => link === "juxtaposées").length === 1 && links.filter((link) => link === "coordonnées").length === 1, `les trois phrases : ${links.join(" ; ")}`),
    ok(links[exo.payload.correctIndex as number] === "relative", `la bonne réponse n'est pas la phrase à relative : ${rightOption(exo)}`),
    ok((infos as Info[]).every((info) => info.count === 2), "une phrase à trois propositions"),
  );
};

const checkFunction: Check = (exo) => {
  const m = /^Dans la phrase « (.+) », quelle est la fonction du groupe « (.+) » \?$/.exec(exo.prompt);
  const row = m ? OBJECTS.find(([sentence, group]) => sentence === m[1] && group === m[2]) : undefined;
  if (!m || !row) return `phrase inconnue : ${exo.prompt}`;
  return all(ok(rightOption(exo) === row[2], `${exo.prompt} : ${rightOption(exo)}, pas ${row[2]}`), ok(optionsOf(exo).slice().sort().join() === "COD,COI,COS", `les choix : ${optionsOf(exo).join(" ; ")}`), ok(row[0].includes(row[1]), "le groupe n'est pas dans la phrase"));
};

const checkLiaison: Check = (exo) => {
  const text = textOf(exo);
  const row = LIAISONS.find(([first, second]) => `${first}, ___ ${second}` === text);
  if (!row) return `phrase à trou inconnue : ${text}`;
  const { answer, options } = blankOf(exo);
  return all(ok(answer === row[2], `${text} : ${answer}, pas ${row[2]}`), ok(options.slice().sort().join() === "car,donc,mais", `les choix : ${options.join(" ; ")}`));
};

const checkLinks: Check = (exo) => {
  const pairs = pairsOf(exo);
  const links = pairs.map((pair) => {
    const info = INFO.get(pair.left);
    return info && info.count === 2 && info.link !== "simple" && info.link !== "mixte" ? info.link : null;
  });
  return all(
    ok(pairs.length === 3 && links.every((link) => link !== null), `une phrase hors corpus ou sans lien net : ${pairs.map((p) => p.left).join(" | ")}`),
    ...pairs.map((pair, i) => ok(pair.right === LABELS[links[i] as keyof typeof LABELS], `${pair.left} est reliée à ${pair.right}, pas à ${LABELS[links[i] as keyof typeof LABELS]}`)),
    ok(new Set(links).size === 3, "deux phrases du même lien"),
  );
};

const checkSort: Check = (exo) => {
  const zones = zonesOf(exo);
  const items = itemsOf(exo);
  return all(
    ok(zones[0] === "Phrase simple" && zones[1] === "Phrase complexe", `cases inconnues : ${zones.join(" ; ")}`),
    ok(items.length === 4 && items.filter((i) => i.correctZone === zones[0]).length === 2, "deux phrases par case"),
    ...items.map((item) => {
      const info = INFO.get(item.text);
      if (!info) return `phrase inconnue : ${item.text}`;
      return ok(item.correctZone === (info.count === 1 ? zones[0] : zones[1]) && info.link !== "mixte", `${item.text} est rangée dans « ${item.correctZone} »`);
    }),
  );
};

defineMathsTests({
  label: "de la phrase complexe du CM2",
  klass: "CM2",
  subject: "Français",
  hintsNeverWriteChoices: true,
  checks: {
    "cm2-phc-nombre": checkCount,
    "cm2-phc-lien": checkLink,
    "cm2-phc-pronom": checkPronoun,
    "cm2-phc-antecedent": checkAntecedent,
    "cm2-phc-relative": checkRelative,
    "cm2-phc-fonction": checkFunction,
    "cm2-phc-conjonction": checkLiaison,
    "cm2-phc-ecrire": checkWrite,
    "cm2-phc-relier": checkLinks,
    "cm2-phc-glisser": checkSort,
  },
  topicKinds: {
    "fr-cm2-phrase-complexe": ["cm2-phc-nombre", "cm2-phc-lien", "cm2-phc-pronom", "cm2-phc-antecedent", "cm2-phc-relative", "cm2-phc-fonction", "cm2-phc-conjonction", "cm2-phc-ecrire", "cm2-phc-relier", "cm2-phc-glisser"],
  },
});
