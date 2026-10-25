import { acceptedOf, all, blankOf, defineMathsTests, itemsOf, ok, optionsOf, pairsOf, rightOption, sequenceOf, textOf, zonesOf, type Check } from "@/lib/test-support/cm1MathsKit";

/**
 * LES RÉVISIONS DU CFEE DU CM2 (`fr-cm2-cfee`).
 *
 * Ce fichier a ses propres tableaux, écrits à part de `cm2Cfee.ts` : les participes passés de vingt-six verbes sous leurs quatre formes, les sujets et leur accord,
 * les noms et leur genre, les phrases à trou des homophones avec leur seule bonne réponse, soixante-quinze pluriels, quinze verbes à l'indicatif. Il RELIT chaque phrase :
 * le sujet (avec « être »), le complément placé avant le verbe (avec « avoir ») ou son absence donnent l'accord attendu, et le participe écrit doit être celui du tableau.
 * Un mauvais choix ne doit jamais être la forme qu'attend la phrase.
 */

const w = (text: string) => text.split(" ");
const PART: Record<string, string[]> = {
  arriver: w("arrivé arrivée arrivés arrivées"),
  partir: w("parti partie partis parties"),
  tomber: w("tombé tombée tombés tombées"),
  sortir: w("sorti sortie sortis sorties"),
  entrer: w("entré entrée entrés entrées"),
  rester: w("resté restée restés restées"),
  venir: w("venu venue venus venues"),
  descendre: w("descendu descendue descendus descendues"),
  monter: w("monté montée montés montées"),
  aller: w("allé allée allés allées"),
  retourner: w("retourné retournée retournés retournées"),
  cueillir: w("cueilli cueillie cueillis cueillies"),
  acheter: w("acheté achetée achetés achetées"),
  manger: w("mangé mangée mangés mangées"),
  écrire: w("écrit écrite écrits écrites"),
  lire: w("lu lue lus lues"),
  prendre: w("pris prise pris prises"),
  perdre: w("perdu perdue perdus perdues"),
  voir: w("vu vue vus vues"),
  ouvrir: w("ouvert ouverte ouverts ouvertes"),
  dormir: w("dormi dormie dormis dormies"),
  marcher: w("marché marchée marchés marchées"),
  courir: w("couru courue courus courues"),
  chanter: w("chanté chantée chantés chantées"),
  travailler: w("travaillé travaillée travaillés travaillées"),
  jouer: w("joué jouée joués jouées"),
};
const ETRE_COMP: Record<string, string> = {
  arriver: "ce matin", partir: "au marché", tomber: "dans la cour", sortir: "de la case", entrer: "dans la classe", rester: "à la maison",
  venir: "hier", descendre: "du car", monter: "sur le toit", aller: "au puits", retourner: "au village",
};
const INTRANSITIVE_COMP: Record<string, string> = { dormir: "sous le baobab", marcher: "sur le chemin", courir: "vers la plage", chanter: "sous le manguier", travailler: "dans le champ", jouer: "dans la cour" };
const OBJECTS: Record<string, string[]> = {
  cueillir: w("mangue fleur banane orange"),
  acheter: w("mangue poisson panier pagne ballon livre cahier orange"),
  manger: w("mangue poisson banane orange"),
  écrire: w("lettre histoire chanson phrase livre"),
  lire: w("livre lettre histoire phrase"),
  prendre: w("panier ballon livre cahier pagne"),
  perdre: w("ballon cahier livre pagne panier"),
  voir: w("poisson fleur pagne ballon"),
  ouvrir: w("panier livre cahier lettre"),
};
const GENDER: Record<string, "m" | "f"> = {
  mangue: "f", fleur: "f", banane: "f", orange: "f", poisson: "m", panier: "m", pagne: "m", ballon: "m", livre: "m", cahier: "m", lettre: "f", histoire: "f", chanson: "f", phrase: "f",
};
const OWNERS = ["Fatou", "Moussa", "Binta", "Sidy", "Khady", "Cheikh", "Mariama", "Modou", "ma mère", "mon père", "ma tante", "mon oncle"];
const AGR: Record<string, number> = {};
const put = (agreement: number, ...names: string[]) => names.forEach((name) => (AGR[name] = agreement));
put(0, "Moussa", "Le petit garçon", "Mon frère", "Le vieux pêcheur", "Cheikh", "Le maître");
put(1, "Fatou", "La fillette", "Ma tante", "La maîtresse", "Binta", "Khady");
put(2, "Les pêcheurs", "Mes cousins", "Moussa et Sidy", "Les garçons", "Modou et Cheikh", "Les voisins");
put(3, "Les fillettes", "Mes cousines", "Fatou et Binta", "Les voisines", "Khady et Mariama", "Les filles", "Binta et Khady");

const verbsOfParticiple = (word: string) => Object.keys(PART).filter((verb) => PART[verb].includes(word));
const capital = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);

type Read = { shape: string; verb: string; actual: string; expected: string; frame: string };
/** Lit une phrase complète et rend la forme du participe écrite, la forme attendue, le verbe et la phrase où le participe est remplacé par « _ ». */
function analyse(sentence: string): Read | string {
  const finish = (shape: string, part: string, expectedIndex: number, verbOk: (verb: string) => boolean): Read | string => {
    const verbs = verbsOfParticiple(part);
    if (verbs.length !== 1) return `${sentence} : le participe ${part} ne désigne pas un seul verbe (${verbs.join(",")})`;
    if (!verbOk(verbs[0])) return `${sentence} : ${verbs[0]} ne va pas dans cette phrase`;
    return { shape, verb: verbs[0], actual: part, expected: PART[verbs[0]][expectedIndex], frame: sentence.replace(part, "_") };
  };
  let m = /^(.+?) (est|sont) (\p{L}+) (.+)\.$/u.exec(sentence);
  if (m) {
    const [, subject, aux, part, comp] = m;
    if (AGR[subject] === undefined) return `${sentence} : sujet inconnu`;
    if ((AGR[subject] >= 2) !== (aux === "sont")) return `${sentence} : l'auxiliaire ${aux} ne va pas avec ${subject}`;
    return finish("etre", part, AGR[subject], (verb) => ETRE_COMP[verb] === comp);
  }
  m = /^Voici (le|la|les) (\p{L}+) que (.+) a (\p{L}+)\.$/u.exec(sentence);
  if (m) {
    const [, article, noun, owner, part] = m;
    const plural = article === "les";
    const single = plural ? noun.slice(0, -1) : noun;
    if (!GENDER[single] || (plural && !noun.endsWith("s"))) return `${sentence} : nom inconnu`;
    if (!plural && (article === "le") !== (GENDER[single] === "m")) return `${sentence} : l'article ne va pas avec ${noun}`;
    if (!plural && /^[aeiouyéèêâîôûh]/iu.test(noun)) return `${sentence} : « ${article} ${noun} » s'élide en « l' »`;
    if (!OWNERS.includes(owner)) return `${sentence} : sujet inconnu`;
    const index = plural ? (GENDER[single] === "m" ? 2 : 3) : GENDER[single] === "m" ? 0 : 1;
    return finish("avant", part, index, (verb) => !!OBJECTS[verb]?.includes(single));
  }
  m = /^Les (\p{L}+), (.+) les a (\p{L}+)\.$/u.exec(sentence);
  if (m) {
    const [, noun, owner, part] = m;
    const single = noun.slice(0, -1);
    if (!GENDER[single] || !noun.endsWith("s")) return `${sentence} : nom inconnu`;
    if (!OWNERS.includes(owner)) return `${sentence} : sujet inconnu`;
    return finish("pronom", part, GENDER[single] === "m" ? 2 : 3, (verb) => !!OBJECTS[verb]?.includes(single));
  }
  m = /^(.+) a (\p{L}+) (un|une|des) (\p{L}+)\.$/u.exec(sentence);
  if (m) {
    const [, owner, part, article, noun] = m;
    const plural = article === "des";
    const single = plural ? noun.slice(0, -1) : noun;
    if (!GENDER[single] || (plural && !noun.endsWith("s"))) return `${sentence} : nom inconnu`;
    if (!plural && (article === "un") !== (GENDER[single] === "m")) return `${sentence} : l'article ne va pas avec ${noun}`;
    if (!OWNERS.map(capital).includes(owner)) return `${sentence} : sujet inconnu`;
    return finish("apres", part, 0, (verb) => !!OBJECTS[verb]?.includes(single));
  }
  m = /^(.+) (a|ont) (\p{L}+) (.+)\.$/u.exec(sentence);
  if (m) {
    const [, subject, aux, part, comp] = m;
    if (AGR[subject] === undefined) return `${sentence} : sujet inconnu`;
    if ((AGR[subject] >= 2) !== (aux === "ont")) return `${sentence} : l'auxiliaire ${aux} ne va pas avec ${subject}`;
    return finish("sans", part, 0, (verb) => INTRANSITIVE_COMP[verb] === comp);
  }
  return `${sentence} : phrase inconnue`;
}

const SHAPE_OF_STAGE_ORDER = ["etre", "avant", "pronom", "apres", "sans"];

const checkEtre: Check = (exo) => {
  const m = /^(.+) \((\p{L}+)\)$/u.exec(textOf(exo));
  if (!m) return `phrase inconnue : ${textOf(exo)}`;
  const read = analyse(m[1].replace("___", blankOf(exo).answer));
  if (typeof read === "string") return read;
  const options = blankOf(exo).options;
  return all(
    ok(exo.prompt === "Complète la phrase avec le participe passé du verbe.", `énoncé inconnu : ${exo.prompt}`),
    ok(read.shape === "etre", `une phrase avec « être » est attendue : ${textOf(exo)}`),
    ok(read.verb === m[2], `le verbe de la parenthèse est ${m[2]}, la phrase en lit un autre (${read.verb})`),
    ok(read.actual === read.expected, `${textOf(exo)} : ${read.actual} au lieu de ${read.expected}`),
    ok(options.length === 3 && new Set(options).size === 3, `trois choix différents attendus : ${options.join(" | ")}`),
    ok(options.every((option) => PART[read.verb].includes(option)), `un choix n'est pas une forme de ${read.verb} : ${options.join(" | ")}`),
  );
};

const checkAvoir: Check = (exo) => {
  const options = optionsOf(exo);
  const reads = options.map(analyse);
  const failure = reads.find((read) => typeof read === "string");
  if (typeof failure === "string") return failure;
  const [first, second, third] = reads as Read[];
  const right = analyse(rightOption(exo)) as Read;
  const others = (reads as Read[]).filter((read) => read.actual !== right.actual);
  return all(
    ok(exo.prompt === "Quelle phrase est bien écrite ?", `énoncé inconnu : ${exo.prompt}`),
    ok(right.shape !== "etre", "une phrase avec « avoir » est attendue"),
    ok(right.actual === right.expected, `${rightOption(exo)} : ${right.actual} au lieu de ${right.expected}`),
    ok(others.length === 2 && others.every((read) => read.actual !== read.expected), `un mauvais choix est une phrase juste : ${options.join(" | ")}`),
    ok(first.frame === second.frame && second.frame === third.frame, `les trois phrases diffèrent par autre chose que le participe : ${options.join(" | ")}`),
    ok(new Set(options).size === 3, "trois phrases différentes"),
    ok(new Set(optionsOf(exo).map((option) => option.length)).size <= 3, "longueurs"),
  );
};

const checkParticipleWrite: Check = (exo) => {
  const m = /^Dans la phrase « (.+) », écris le participe passé du verbe (\p{L}+)\.$/u.exec(exo.prompt);
  if (!m || !m[1].includes("___")) return `énoncé inconnu : ${exo.prompt}`;
  const accepted = acceptedOf(exo);
  const read = analyse(m[1].replace("___", accepted[0]));
  if (typeof read === "string") return read;
  return all(
    ok(accepted.length === 1, `une seule écriture attendue : ${accepted.join(" | ")}`),
    ok(read.verb === m[2], `le verbe de l'énoncé est ${m[2]}, la phrase en lit un autre (${read.verb})`),
    ok(accepted[0] === read.expected, `${exo.prompt} : ${accepted[0]} au lieu de ${read.expected}`),
    ok(SHAPE_OF_STAGE_ORDER.includes(read.shape), "forme inconnue"),
  );
};

// ---------------------------------------------------------------------------
// Les homophones : chaque phrase n'admet qu'un seul mot
// ---------------------------------------------------------------------------

const HOMOPHONES = new Map<string, { answer: string; wrong: string[] }>(
  ([
  ["Fatou ___ un beau cahier.", "a", "à as"],
  ["Nous allons ___ la plage.", "à", "a as"],
  ["Tu ___ de la chance.", "as", "a à"],
  ["Le chat ___ très faim.", "a", "à as"],
  ["Moussa pense ___ son frère.", "à", "a as"],
  ["Moussa ___ Binta jouent dans la cour.", "et", "est es"],
  ["Le riz ___ chaud.", "est", "et es"],
  ["Il mange du riz ___ du poisson.", "et", "est es"],
  ["La mangue ___ mûre.", "est", "et es"],
  ["Le ciel ___ bleu.", "est", "et es"],
  ["Les enfants ___ faim.", "ont", "on an"],
  ["Dans ce village, ___ parle wolof.", "on", "ont an"],
  ["Les filles ___ chanté une chanson.", "ont", "on an"],
  ["Demain, ___ part au marché.", "on", "ont an"],
  ["Mes cousins ___ un grand champ.", "ont", "on an"],
  ["Fatou range ___ cartable.", "son", "sont ont"],
  ["Les mangues ___ mûres.", "sont", "son ont"],
  ["Moussa aime ___ grand frère.", "son", "sont ont"],
  ["Mes cousins ___ au marché.", "sont", "son ont"],
  ["Binta cherche ___ cahier.", "son", "sont ont"],
  ["Veux-tu du riz ___ du mil ?", "ou", "où on"],
  ["Dis-moi ___ tu vas.", "où", "ou on"],
  ["Tu bois du thé ___ du lait ?", "ou", "où on"],
  ["Voici le champ ___ papa travaille.", "où", "ou on"],
  ["Je ne sais pas ___ est mon cahier.", "où", "ou on"],
  ["Fatou ___ lave les mains.", "se", "ce sa"],
  ["Je prends ___ livre.", "ce", "se sa"],
  ["Le soleil ___ lève tôt.", "se", "ce sa"],
  ["Regarde ___ beau poisson.", "ce", "se sa"],
  ["Le petit chat ___ cache sous le lit.", "se", "ce sa"],
  ["Binta lave ___ robe.", "sa", "ça ce"],
  ["Tu fais ___ très bien.", "ça", "sa ce"],
  ["Fatou range ___ chambre.", "sa", "ça ce"],
  ["Moussa aime ___ mangue.", "sa", "ça ce"],
  ["Ils disent que ___ va mieux.", "ça", "sa ce"],
  ["Il pleut, ___ nous sortons.", "mais", "mes met"],
  ["Fatou range ___ cahiers.", "mes", "mais met"],
  ["Maman ___ le riz dans le plat.", "met", "mes mais"],
  ["Je voulais venir, ___ je suis malade.", "mais", "mes met"],
  ["Binta prend ___ livres.", "mes", "mais met"],
  ["Tu ___ venir avec nous.", "peux", "peut peu"],
  ["Le chat ___ sauter très haut.", "peut", "peux peu"],
  ["Il mange très ___ de riz.", "peu", "peut peux"],
  ["Moussa ___ nager longtemps.", "peut", "peux peu"],
  ["Mon frère ___ allé au village.", "est", "et es"],
  ["Nous avons faim, ___ le riz est cuit.", "mais", "mes met"],
  ["Dis-moi ___ se trouve le marché.", "où", "ou on"],
  ["Les filles ___ mis leurs sacs sur le dos.", "ont", "on an"],
  ["Ils ___ partis très tôt.", "sont", "son ont"],
  ["Tu ___ un beau cahier.", "as", "a à"],
  ] as [string, string, string][]).map(([text, answer, wrong]) => [text, { answer, wrong: wrong.split(" ") }]),
);

const checkHomophone: Check = (exo) => {
  const row = HOMOPHONES.get(textOf(exo));
  if (!row) return `phrase inconnue : ${textOf(exo)}`;
  const blank = blankOf(exo);
  return all(
    ok(exo.prompt === "Choisis le mot qui convient.", `énoncé inconnu : ${exo.prompt}`),
    ok(blank.answer === row.answer, `${textOf(exo)} : ${blank.answer} au lieu de ${row.answer}`),
    ok([...blank.options].sort().join(",") === [row.answer, ...row.wrong].sort().join(","), `choix inattendus : ${blank.options.join(" | ")}`),
    ok(row.wrong.every((wrong) => wrong !== row.answer), "un mauvais choix égale la bonne réponse"),
  );
};

// ---------------------------------------------------------------------------
// Les pluriels
// ---------------------------------------------------------------------------

const PLURALS: Record<string, string> = Object.fromEntries(
  w(
    "cheval:chevaux journal:journaux animal:animaux hôpital:hôpitaux canal:canaux signal:signaux métal:métaux général:généraux local:locaux " +
      "bal:bals carnaval:carnavals festival:festivals récital:récitals chacal:chacals régal:régals " +
      "corail:coraux vitrail:vitraux émail:émaux détail:détails chandail:chandails éventail:éventails épouvantail:épouvantails " +
      "bateau:bateaux gâteau:gâteaux oiseau:oiseaux chapeau:chapeaux couteau:couteaux rideau:rideaux tableau:tableaux morceau:morceaux drapeau:drapeaux tuyau:tuyaux landau:landaus " +
      "feu:feux jeu:jeux neveu:neveux cheveu:cheveux vœu:vœux pneu:pneus bleu:bleus " +
      "trou:trous clou:clous sou:sous fou:fous verrou:verrous écrou:écrous cou:cous kangourou:kangourous " +
      "genou:genoux bijou:bijoux caillou:cailloux chou:choux hibou:hiboux joujou:joujoux pou:poux " +
      "nez:nez souris:souris voix:voix gaz:gaz bras:bras riz:riz prix:prix repas:repas fois:fois croix:croix noix:noix tapis:tapis dos:dos corps:corps " +
      "œil:yeux monsieur:messieurs madame:mesdames mademoiselle:mesdemoiselles bonhomme:bonshommes",
  ).map((pair) => pair.split(":") as [string, string]),
);
const INVARIABLE = Object.keys(PLURALS).filter((sing) => PLURALS[sing] === sing);
const IRREGULAR = ["œil", "monsieur", "madame", "mademoiselle", "bonhomme"];

const checkPlural: Check = (exo) => {
  const m = /^Quel est le pluriel du mot « (\p{L}+) » \?$/u.exec(exo.prompt);
  if (!m || !PLURALS[m[1]]) return `énoncé inconnu : ${exo.prompt}`;
  const sing = m[1];
  const wrong = optionsOf(exo).filter((option) => option !== rightOption(exo));
  return all(
    ok(!INVARIABLE.includes(sing), `${sing} ne change pas : pas de choix multiple`),
    ok(rightOption(exo) === PLURALS[sing], `${exo.prompt} : ${rightOption(exo)} au lieu de ${PLURALS[sing]}`),
    ok(wrong.length === 2 && new Set(wrong).size === 2, `deux mauvais choix différents attendus : ${optionsOf(exo).join(" | ")}`),
    ok(wrong.every((option) => option !== PLURALS[sing]), "un mauvais choix égale le pluriel"),
    ok(wrong.every((option) => !Object.values(PLURALS).includes(option) || option === sing), `un mauvais choix est le pluriel d'un autre mot : ${wrong.join(" | ")}`),
  );
};

const checkPluralLink: Check = (exo) => {
  const pairs = pairsOf(exo);
  return all(
    ok(exo.prompt === "Relie chaque mot à son pluriel.", `énoncé inconnu : ${exo.prompt}`),
    ok(pairs.length === 4, "quatre paires attendues"),
    ...pairs.map((pair) => ok(PLURALS[pair.left] === pair.right, `${pair.left} ne se relie pas à ${pair.right}`)),
    ...pairs.map((pair) => ok(!INVARIABLE.includes(pair.left), `${pair.left} ne change pas au pluriel`)),
    ok(new Set(pairs.map((pair) => pair.left)).size === 4 && new Set(pairs.map((pair) => pair.right)).size === 4, "mots et pluriels tous différents"),
  );
};

const checkPluralSort: Check = (exo) => {
  const zones = zonesOf(exo);
  const items = itemsOf(exo);
  return all(
    ok(zones[0] === "Pluriel en -s" && zones[1] === "Pluriel en -x", `cases inconnues : ${zones.join(" ; ")}`),
    ok(items.length === 4 && items.filter((item) => item.correctZone === zones[0]).length === 2, "deux mots par case"),
    ...items.map((item) => {
      const plural = PLURALS[item.text];
      if (!plural) return `mot inconnu : ${item.text}`;
      if (INVARIABLE.includes(item.text) || IRREGULAR.includes(item.text)) return `${item.text} n'a pas sa place ici`;
      return ok(item.correctZone === (plural.endsWith("x") ? zones[1] : zones[0]), `${item.text} (${plural}) est rangé dans « ${item.correctZone} »`);
    }),
    // Un indice qui donne une règle de fin de mot ne ment pour aucune étiquette : « beaucoup de mots en -ou prennent un x » envoyait trou dans la mauvaise case,
    // « on entend -aux » y envoyait chacal. La règle des -ou nomme son exception (« sauf »), celle des -al aussi (« mais »).
    ...exo.hints.map((hint) => ok(!/en -ou/u.test(hint) || /prennent un s, sauf/u.test(hint), `l'indice des mots en -ou oublie que presque tous prennent un s : ${hint}`)),
    ...exo.hints.map((hint) => ok(!/-al\b/u.test(hint) || /mais/u.test(hint), `l'indice des mots en -al oublie ses exceptions : ${hint}`)),
  );
};

// ---------------------------------------------------------------------------
// Les terminaisons -é / -er / -ez / -ait
// ---------------------------------------------------------------------------

const ENDING_COMP: Record<string, string> = {
  chanter: "une chanson", jouer: "au ballon", regarder: "le match", écouter: "la radio", danser: "sur la place", travailler: "dans le champ", marcher: "sur le chemin", laver: "la vaisselle",
  porter: "un seau", parler: "au chef", donner: "du riz", trouver: "un coquillage", pêcher: "des sardines", cultiver: "du mil", cuisiner: "le repas", raconter: "une histoire",
};
const NAMES = ["Fatou", "Moussa", "Binta", "Sidy", "Khady", "Modou"];

const checkEnding: Check = (exo) => {
  const text = textOf(exo);
  const m = /\((\p{L}+)\) (.+)\.$/u.exec(text);
  if (!m || !ENDING_COMP[m[1]] || ENDING_COMP[m[1]] !== m[2]) return `phrase inconnue : ${text}`;
  const inf = m[1];
  const stem = inf.slice(0, -2);
  const forms = { infinitif: inf, participe: `${stem}é`, vous: `${stem}ez`, imparfait: `${stem}ait` };
  let kind: keyof typeof forms | null = null;
  const name = `(${NAMES.join("|")})`;
  if (new RegExp(`^${name} a ___ \\(`, "u").test(text)) kind = "participe";
  else if (/^Maintenant, vous ___ \(/u.test(text)) kind = "vous";
  else if (new RegExp(`^(Chaque soir, |Autrefois, |Chaque matin, |Quand il faisait beau, )${name} ___ \\(`, "u").test(text)) kind = "imparfait";
  else if (new RegExp(`^${name} (va|veut|doit|part sans|commence à) ___ \\(`, "u").test(text)) kind = "infinitif";
  if (!kind) return `phrase inconnue : ${text}`;
  const blank = blankOf(exo);
  const others = Object.values(forms).filter((form) => form !== forms[kind as keyof typeof forms]);
  return all(
    ok(exo.prompt === "Écris le verbe de la parenthèse comme il faut.", `énoncé inconnu : ${exo.prompt}`),
    ok(blank.answer === forms[kind], `${text} : ${blank.answer} au lieu de ${forms[kind]}`),
    ok(blank.options.length === 3 && new Set(blank.options).size === 3, "trois choix différents"),
    ok(blank.options.filter((option) => option !== blank.answer).every((option) => others.includes(option)), `un mauvais choix n'est pas une autre forme du verbe : ${blank.options.join(" | ")}`),
  );
};

// ---------------------------------------------------------------------------
// La conjugaison
// ---------------------------------------------------------------------------

type V = { p: string[]; i: string[]; f: string[]; part: string };
const c = (p: string, i: string, f: string, part: string): V => ({ p: w(p), i: w(i), f: w(f), part });
const TABLE: Record<string, V> = {
  chanter: c("chante chantes chante chantons chantez chantent", "chantais chantais chantait chantions chantiez chantaient", "chanterai chanteras chantera chanterons chanterez chanteront", "chanté"),
  jouer: c("joue joues joue jouons jouez jouent", "jouais jouais jouait jouions jouiez jouaient", "jouerai joueras jouera jouerons jouerez joueront", "joué"),
  manger: c("mange manges mange mangeons mangez mangent", "mangeais mangeais mangeait mangions mangiez mangeaient", "mangerai mangeras mangera mangerons mangerez mangeront", "mangé"),
  finir: c("finis finis finit finissons finissez finissent", "finissais finissais finissait finissions finissiez finissaient", "finirai finiras finira finirons finirez finiront", "fini"),
  choisir: c("choisis choisis choisit choisissons choisissez choisissent", "choisissais choisissais choisissait choisissions choisissiez choisissaient", "choisirai choisiras choisira choisirons choisirez choisiront", "choisi"),
  être: c("suis es est sommes êtes sont", "étais étais était étions étiez étaient", "serai seras sera serons serez seront", "été"),
  avoir: c("ai as a avons avez ont", "avais avais avait avions aviez avaient", "aurai auras aura aurons aurez auront", "eu"),
  aller: c("vais vas va allons allez vont", "allais allais allait allions alliez allaient", "irai iras ira irons irez iront", "allé"),
  faire: c("fais fais fait faisons faites font", "faisais faisais faisait faisions faisiez faisaient", "ferai feras fera ferons ferez feront", "fait"),
  prendre: c("prends prends prend prenons prenez prennent", "prenais prenais prenait prenions preniez prenaient", "prendrai prendras prendra prendrons prendrez prendront", "pris"),
  venir: c("viens viens vient venons venez viennent", "venais venais venait venions veniez venaient", "viendrai viendras viendra viendrons viendrez viendront", "venu"),
  voir: c("vois vois voit voyons voyez voient", "voyais voyais voyait voyions voyiez voyaient", "verrai verras verra verrons verrez verront", "vu"),
  dire: c("dis dis dit disons dites disent", "disais disais disait disions disiez disaient", "dirai diras dira dirons direz diront", "dit"),
  pouvoir: c("peux peux peut pouvons pouvez peuvent", "pouvais pouvais pouvait pouvions pouviez pouvaient", "pourrai pourras pourra pourrons pourrez pourront", "pu"),
  savoir: c("sais sais sait savons savez savent", "savais savais savait savions saviez savaient", "saurai sauras saura saurons saurez sauront", "su"),
};
const AVOIR = w("ai as a avons avez ont");
const PRONOUN_INDEX: Record<string, number> = { je: 0, tu: 1, il: 2, nous: 3, vous: 4, ils: 5 };
const TENSE_OF: Record<string, "p" | "i" | "f" | "pc"> = { "au présent": "p", "à l'imparfait": "i", "au futur simple": "f", "au passé composé": "pc" };
const AUX_ETRE = ["aller", "venir"];
const formOf = (inf: string, tense: "p" | "i" | "f" | "pc", person: number) => (tense === "pc" ? `${AVOIR[person]} ${TABLE[inf].part}` : TABLE[inf][tense][person]);

const checkConjugate: Check = (exo) => {
  const m = /^Écris le verbe (\p{L}+) (au présent|à l'imparfait|au futur simple|au passé composé) avec (je|tu|il|nous|vous|ils)\.$/u.exec(exo.prompt);
  if (!m || !TABLE[m[1]]) return `énoncé inconnu : ${exo.prompt}`;
  const tense = TENSE_OF[m[2]];
  if (tense === "pc" && AUX_ETRE.includes(m[1])) return `${m[1]} se conjugue avec être au passé composé`;
  return all(
    ok(acceptedOf(exo).length === 1, "une seule écriture attendue"),
    ok(acceptedOf(exo)[0] === formOf(m[1], tense, PRONOUN_INDEX[m[3]]), `${exo.prompt} : ${acceptedOf(exo)[0]} au lieu de ${formOf(m[1], tense, PRONOUN_INDEX[m[3]])}`),
  );
};

const checkOrder: Check = (exo) => {
  const m = /^Range ces formes du verbe (\p{L}+) (au présent|à l'imparfait|au futur simple|au passé composé) selon la personne, de je à ils\.$/u.exec(exo.prompt);
  if (!m || !TABLE[m[1]]) return `énoncé inconnu : ${exo.prompt}`;
  const tense = TENSE_OF[m[2]];
  if (tense === "pc" && AUX_ETRE.includes(m[1])) return `${m[1]} se conjugue avec être au passé composé`;
  const persons: number[] = [];
  for (const tile of sequenceOf(exo)) {
    const t = /^(ils|il|nous|vous|tu|j'|je) ?(.+)$/u.exec(tile);
    if (!t) return `tuile inconnue : ${tile}`;
    const person = t[1] === "j'" ? 0 : PRONOUN_INDEX[t[1]];
    if (t[2] !== formOf(m[1], tense, person)) return `${tile} : ${t[2]} au lieu de ${formOf(m[1], tense, person)}`;
    persons.push(person);
  }
  return all(ok(persons.length >= 4, "quatre formes au moins"), ok(persons.every((person, index) => index === 0 || person > persons[index - 1]), `personnes dans le désordre : ${persons.join(",")}`));
};

defineMathsTests({
  label: "des révisions du CFEE du CM2",
  klass: "CM2",
  subject: "Français",
  hintsNeverWriteChoices: true,
  checks: {
    "cm2-cfe-etre": checkEtre,
    "cm2-cfe-avoir": checkAvoir,
    "cm2-cfe-participe": checkParticipleWrite,
    "cm2-cfe-homophone": checkHomophone,
    "cm2-cfe-pluriel": checkPlural,
    "cm2-cfe-relier": checkPluralLink,
    "cm2-cfe-glisser": checkPluralSort,
    "cm2-cfe-terminaison": checkEnding,
    "cm2-cfe-conjuguer": checkConjugate,
    "cm2-cfe-ranger": checkOrder,
  },
  topicKinds: {
    "fr-cm2-cfee": ["cm2-cfe-etre", "cm2-cfe-avoir", "cm2-cfe-participe", "cm2-cfe-homophone", "cm2-cfe-pluriel", "cm2-cfe-relier", "cm2-cfe-glisser", "cm2-cfe-terminaison", "cm2-cfe-conjuguer", "cm2-cfe-ranger"],
  },
});
