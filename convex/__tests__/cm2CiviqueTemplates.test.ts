import { describe, expect, it } from "vitest";
import { defineTemplateTests } from "@/lib/test-support/cm1TestKit";
import { allProgrammeEntries } from "../programme";
import { generateGames } from "../paliers/games";

/**
 * LE CIVIQUE DU CM2 : quatre thématiques, vingt-quatre gabarits (`cm2Civique.ts`).
 *
 * Le moteur des vérifications est dans `lib/test-support/cm1TestKit.ts` (le même que pour le CM1 et les sciences du CM2). Ce fichier ne lit
 * AUCUN tableau des sources : ses tables, écrites à part, disent pour chaque réponse ce qu'un énoncé doit contenir pour l'appeler (`ASSOC`),
 * dans quel ordre vont les suites (`CHAINS`), quelles paires sont justes (`PAIRS`) et ce qui va dans chaque case (`MEMBERS`).
 *
 * Les fragments de `ASSOC` sont des suites de mots entiers, lues sans accent, sans majuscule et sans ponctuation. Une réponse sans fragment
 * (`[]`) n'est JAMAIS une bonne réponse : le moteur la refuse dès qu'un exercice la donne pour juste. Une bonne réponse a au moins un de ses
 * fragments dans l'énoncé ; un mauvais choix n'en a aucun qui ne soit aussi un fragment de la bonne réponse.
 */

const TOPIC_KINDS: Record<string, readonly string[]> = {
  "ci-cm2-republique": ["cm2-rep-qcm", "cm2-rep-trou", "cm2-rep-ecrire", "cm2-rep-ordre", "cm2-rep-relier", "cm2-rep-glisser"],
  "ci-cm2-institutions": ["cm2-ins-qcm", "cm2-ins-trou", "cm2-ins-ecrire", "cm2-ins-ordre", "cm2-ins-relier", "cm2-ins-glisser"],
  "ci-cm2-afrique": ["cm2-afr-qcm", "cm2-afr-trou", "cm2-afr-ecrire", "cm2-afr-ordre", "cm2-afr-relier", "cm2-afr-glisser"],
  "ci-cm2-monde": ["cm2-mon-qcm", "cm2-mon-trou", "cm2-mon-ecrire", "cm2-mon-ordre", "cm2-mon-relier", "cm2-mon-glisser"],
};

const ASSOC: Record<string, string[]> = {
  // ---------------------------------------------------------------------------------------------------------------- RÉPUBLIQUE
  drapeau: ["flotte sur les bâtiments officiels", "étoffe aux couleurs du pays", "on hisse"],
  "hymne national": ["chant officiel du pays", "se chante debout", "on chante debout"],
  devise: ["phrase qui résume l'idéal du pays", "formule un peuple un but une foi", "un peuple un but une foi est"],
  sceau: ["cachet officiel de la République", "authentifie les documents officiels", "acte officiel porte"],
  passeport: [],
  calendrier: [],
  constitution: ["loi la plus importante du pays", "règles de base de la République"],
  republique: ["chef de l'État est élu"],
  citoyen: ["droits et des devoirs dans son pays", "habitant qui vote et respecte les lois", "celui qui vote et respecte les lois"],
  monarchie: [],
  reglement: [],
  "peuple un but une foi": ["devise du Sénégal", "formule résume l'idéal de la République du Sénégal", "a pour devise"],
  "liberte egalite fraternite": [],
  "union discipline travail": [],
  "vert jaune et rouge": ["trois couleurs du drapeau du Sénégal", "bandes du drapeau sénégalais", "drapeau du Sénégal est"],
  "bleu blanc et rouge": [],
  "noir jaune et rouge": [],
  verte: ["étoile au centre du drapeau", "couleur de l'étoile", "étoile du drapeau du Sénégal est", "centre du drapeau brille une étoile"],
  rouge: [],
  jaune: [],
  // ---------------------------------------------------------------------------------------------------------------- INSTITUTIONS
  "president de la republique": ["élu par tous les citoyens pour diriger le pays", "chef de l'État, élu au suffrage universel", "chef de l'État, élu par les citoyens", "citoyens votent pour choisir"],
  gouvernement: ["ensemble réunit le Premier ministre et les ministres", "équipe formée par le Premier ministre et les ministres", "Premier ministre et les ministres forment", "ministres travaillent ensemble dans"],
  "assemblee nationale": ["institution réunit les députés qui votent les lois", "siègent les députés du pays", "députés votent les lois à", "élus qui votent les lois siègent à"],
  "cours et tribunaux": ["institutions rendent la justice", "un juge décide qui a raison", "justice est rendue par", "juge siège dans"],
  "conseil municipal": [],
  prefecture: [],
  "premier ministre": ["Qui dirige le Gouvernement", "chef du Gouvernement", "sous la direction de"],
  depute: ["membre de l'Assemblée nationale", "vote les lois à l'Assemblée nationale", "Celui qui vote les lois est"],
  ministre: ["membre du Gouvernement chargé d'un domaine", "membre du Gouvernement chargé de la santé"],
  juge: ["personne qui rend la justice dans un tribunal", "Qui décide qui a raison dans un procès", "Dans un procès, c'est"],
  maire: [],
  prefet: [],
  "voter les lois": ["font les députés à l'Assemblée nationale", "rôle des députés", "À l'Assemblée nationale, on vient pour"],
  "rendre la justice": ["font les cours et tribunaux", "rôle d'un juge", "rôle des tribunaux", "juge a pour mission de"],
  "soigner les malades": [],
  "cultiver les champs": [],
  "par un vote de tous les citoyens": ["Président de la République est-il choisi", "devient-on Président de la République", "Président de la République est choisi", "le Président est élu"],
  "par tirage au sort": [],
  "par un vote des juges": [],
  // ---------------------------------------------------------------------------------------------------------------- AFRIQUE
  cedeao: ["communauté regroupe les pays ouest-africains pour coopérer", "pays ouest-africains dans une communauté économique", "au sein de", "des pays ouest-africains forment"],
  uemoa: ["union ouest-africaine partage une même monnaie", "utilisent le même franc CFA", "partagent le franc CFA forment", "même monnaie unit les pays membres de"],
  omvs: ["gère ensemble le fleuve Sénégal", "met en valeur le fleuve Sénégal", "fleuve Sénégal est géré par", "riverains du fleuve Sénégal se sont unis dans"],
  omvg: ["gère ensemble le fleuve Gambie", "met en valeur le fleuve Gambie", "fleuve Gambie est géré par", "riverains du fleuve Gambie se sont unis dans"],
  cilss: ["lutte contre la sécheresse", "lutter contre la sécheresse", "luttent ensemble contre la sécheresse"],
  bceao: ["banque centrale des États ouest-africains a son siège à Dakar", "banque émet la monnaie commune des pays de l'UEMOA", "banque centrale des États ouest-africains, installée à Dakar", "À Dakar se trouve le siège de"],
  boad: ["banque finance le développement des pays ouest-africains", "banque ouest-africaine prête de l'argent", "financer leur développement, les pays ouest-africains", "banque ouest-africaine de développement s'appelle"],
  bad: ["banque finance le développement de tous les pays africains", "banque africaine soutient des projets dans tout le continent", "projets dans toute l'Afrique, on peut compter sur", "banque africaine de développement s'appelle"],
  "caisse d epargne": [],
  "banque postale": [],
  "union africaine": ["organisation réunit les pays du continent africain et a son siège à Addis-Abeba", "États africains et siège à Addis-Abeba", "États africains se réunissent dans", "siège de se trouve à Addis-Abeba"],
  caf: ["confédération africaine organise le football du continent", "confédération africaine dirige le football en Afrique", "football du continent africain est dirigé par", "compétitions africaines de football sont organisées par"],
  // ---------------------------------------------------------------------------------------------------------------- MONDE
  onu: ["réunit les pays du monde pour travailler à la paix", "agences comme l'UNICEF ou la FAO", "pays du monde se réunissent dans", "agences de santé et d'éducation dépendent de"],
  unicef: ["agence de l'ONU protège les enfants du monde", "agence onusienne aide les enfants", "Pour les enfants du monde", "L'agence qui protège les enfants est"],
  unesco: ["développe l'éducation et la culture", "défend l'éducation et la culture dans le monde", "culture dans le monde sont défendues par", "culture et l'éducation, on compte sur"],
  fao: ["lutte pour l'alimentation du monde", "aide à nourrir le monde", "alimentation du monde est suivie par", "Pour nourrir le monde"],
  oms: ["veille sur la santé dans le monde", "lutte contre les maladies dans le monde", "santé dans le monde est suivie par", "Pour lutter contre les maladies, on compte sur"],
  hcr: ["protège les réfugiés", "personnes qui ont dû fuir leur pays", "réfugiés sont protégés par", "ceux qui ont fui leur pays"],
  oit: ["s'occupe du travail", "défend les droits des travailleurs", "travail dans le monde est suivi par", "droits des travailleurs sont défendus par"],
  fnuap: ["s'occupe de la population", "évolution de la population mondiale", "population mondiale est suivie par", "Pour la population du monde"],
  omc: ["s'occupe du commerce", "règle les échanges commerciaux", "commerce entre les pays est suivi par", "Pour les échanges commerciaux"],
  cicr: ["secourt les victimes des guerres et des catastrophes", "soigne les blessés des conflits partout dans le monde", "secourir les victimes des guerres", "blessés des conflits sont soignés par"],
  fifa: ["dirige le football dans le monde", "organise la Coupe du monde de football", "football mondial est dirigé par", "Coupe du monde de football est organisée par"],
  cio: ["organise les Jeux olympiques", "dirige le mouvement olympique", "Jeux olympiques sont organisés par", "mouvement olympique est dirigé par"],
  dakar: ["accueille les Jeux olympiques de la jeunesse en 2026", "se tiennent les Jeux olympiques de la jeunesse en 2026", "Jeux olympiques de la jeunesse de 2026 ont lieu à", "jeunes sportifs du monde se retrouvent à"],
  abidjan: [],
  bamako: [],
  jumelage: ["amitié officielle entre deux villes de pays différents", "deux villes de pays différents deviennent officiellement amies", "villes de pays différents officiellement amies sont liées par"],
  concours: [],
  championnat: [],
};

/** Les suites : chaque énoncé qui contient `when` n'accepte que des tuiles prises dans une de ces listes, dans cet ordre. */
const CHAINS: { when: RegExp; chain: string[] }[] = [
  { when: /mots de la devise du premier au dernier/, chain: ["Peuple", "But", "Foi"] },
  { when: /mots de la devise du dernier au premier/, chain: ["Foi", "But", "Peuple"] },
  { when: /niveaux du pays du plus petit au plus grand/, chain: ["Commune", "Département", "Région", "Pays"] },
  { when: /niveaux du pays du plus grand au plus petit/, chain: ["Pays", "Région", "Département", "Commune"] },
  { when: /etapes d une election/, chain: ["Faire campagne", "Voter", "Compter les voix", "Proclamer le résultat"] },
  { when: /pour devenir president/, chain: ["Être candidat", "Faire campagne", "Être élu", "Diriger le pays"] },
  { when: /ensembles du plus petit au plus grand/, chain: ["Sénégal", "Afrique de l'Ouest", "Afrique", "Monde"] },
  { when: /ensembles du plus grand au plus petit/, chain: ["Monde", "Afrique", "Afrique de l'Ouest", "Sénégal"] },
  { when: /echelons du plus petit au plus grand/, chain: ["Quartier", "Ville", "Pays", "Monde"] },
  { when: /echelons du plus grand au plus petit/, chain: ["Monde", "Pays", "Ville", "Quartier"] },
];

const PAIRS: [string, string][] = [
  // République
  ["Drapeau", "Flotte aux cérémonies"], ["Hymne national", "Se chante debout"], ["Devise", "Résume l'idéal du pays"], ["Sceau", "Marque les actes officiels"],
  ["Constitution", "Loi la plus importante"], ["République", "Chef de l'État élu"], ["Citoyen", "Droits et devoirs"],
  ["Vert", "Bande de gauche"], ["Jaune", "Bande du milieu"], ["Rouge", "Bande de droite"],
  // Institutions
  ["Président de la République", "Chef de l'État élu"], ["Gouvernement", "Premier ministre et ministres"], ["Assemblée nationale", "Députés qui votent les lois"], ["Cours et tribunaux", "Juges qui rendent la justice"],
  ["Premier ministre", "Chef du Gouvernement"], ["Ministre", "Dirige un domaine"], ["Député", "Vote les lois"], ["Juge", "Rend la justice"],
  ["Voter les lois", "Députés"], ["Rendre la justice", "Juges"], ["Élire le Président", "Citoyens"],
  // Afrique
  ["OMVS", "Fleuve Sénégal"], ["OMVG", "Fleuve Gambie"], ["CILSS", "Lutte contre la sécheresse"],
  ["BCEAO", "Banque centrale à Dakar"], ["Union africaine", "Siège à Addis-Abeba"], ["CAF", "Football africain"],
  ["CEDEAO", "Coopération ouest-africaine"], ["UEMOA", "Même monnaie"],
  ["BAD", "Développement de tout le continent"], ["BOAD", "Développement de l'Ouest"],
  // Monde
  ["UNICEF", "Enfants"], ["OMS", "Santé"], ["FAO", "Alimentation"], ["HCR", "Réfugiés"],
  ["OIT", "Travail"], ["OMC", "Commerce"], ["FNUAP", "Population"], ["UNESCO", "Éducation et culture"],
  ["CIO", "Jeux olympiques"], ["FIFA", "Football mondial"], ["CICR", "Croix-Rouge"],
];

const MEMBERS: Record<string, string[]> = {
  "Symbole du pays": ["Drapeau", "Hymne national", "Devise", "Sceau"],
  "Règle ou loi": ["Constitution", "Droits du citoyen", "Devoirs du citoyen"],
  "Couleur du drapeau": ["Vert", "Jaune", "Rouge"],
  "Mot de la devise": ["Peuple", "But", "Foi"],
  "Assemblée nationale": ["Voter une loi", "Discuter d'une loi", "Siéger comme député", "Député", "Séance des députés", "Vote d'une loi"],
  "Cours et tribunaux": ["Juger une affaire", "Rendre la justice", "Écouter un témoin"],
  Gouvernement: ["Premier ministre", "Ministre de la santé", "Ministre de l'éducation"],
  "Afrique de l'Ouest": ["CEDEAO", "UEMOA", "OMVS", "OMVG", "BCEAO", "BOAD"],
  "Toute l'Afrique": ["Union africaine", "BAD", "CAF"],
  Banque: ["BCEAO", "BOAD", "BAD"],
  "Pas une banque": ["OMVS", "OMVG", "CAF", "Union africaine"],
  "Agence de l'ONU": ["UNICEF", "UNESCO", "FAO", "OMS", "HCR"],
  "Hors de l'ONU": ["FIFA", "CIO", "CICR"],
  Sport: ["FIFA", "CIO", "Coupe du monde", "Jeux olympiques"],
  "Aide aux personnes": ["CICR", "HCR", "UNICEF"],
};

/** Des réponses qui sont toutes justes pour une même question : elles ne se proposent jamais ensemble. */
const TWINS: readonly (readonly string[])[] = [
  ["cedeao", "uemoa"],
  ["boad", "bad"],
  ["premier ministre", "ministre"],
];
/** Aucun énoncé de ce lot ne demande « lequel de ces noms » : tout le groupe ne peut pas être juste. */
const LIST_STEM = /^\b$/;

const { checkOf } = defineTemplateTests({
  label: "du civique du CM2",
  klass: "CM2",
  count: 5,
  topicKinds: TOPIC_KINDS,
  expectedKinds: 24,
  topicCount: 4,
  kindPattern: /^cm2-(rep|ins|afr|mon)-/,
  assoc: ASSOC,
  twins: TWINS,
  listStem: LIST_STEM,
  chains: CHAINS,
  pairs: PAIRS,
  members: MEMBERS,
  zonePairs: [
    ["Symbole du pays", "Règle ou loi"], ["Couleur du drapeau", "Mot de la devise"],
    ["Assemblée nationale", "Cours et tribunaux"], ["Gouvernement", "Assemblée nationale"],
    ["Afrique de l'Ouest", "Toute l'Afrique"], ["Banque", "Pas une banque"],
    ["Agence de l'ONU", "Hors de l'ONU"], ["Sport", "Aide aux personnes"],
  ],
});

describe("les vérifications voient un énoncé abîmé", () => {
  const qcm = (prompt: string, options: string[], correctIndex: number) => ({
    type: "qcm",
    prompt,
    answerKey: options[correctIndex],
    hints: [],
    payload: { options, correctIndex },
  });

  it("refusent la CEDEAO pour la monnaie commune, et la BAD pour une banque ouest-africaine", () => {
    const check = checkOf("cm2-afr-qcm");
    expect(check(qcm("Quelle union ouest-africaine partage une même monnaie, le franc CFA ?", ["UEMOA", "OMVS", "CAF"], 0))).toBeNull();
    expect(check(qcm("Quelle union ouest-africaine partage une même monnaie, le franc CFA ?", ["CEDEAO", "OMVS", "CAF"], 0))).not.toBeNull();
    expect(check(qcm("Quelle banque finance le développement des pays ouest-africains ?", ["BOAD", "CAF", "ONU"], 0))).toBeNull();
    expect(check(qcm("Quelle banque finance le développement des pays ouest-africains ?", ["BAD", "CAF", "ONU"], 0))).not.toBeNull();
  });

  it("refusent un ministre pour le chef du Gouvernement", () => {
    const check = checkOf("cm2-ins-qcm");
    expect(check(qcm("Comment appelle-t-on le chef du Gouvernement ?", ["Premier ministre", "Juge", "Maire"], 0))).toBeNull();
    expect(check(qcm("Comment appelle-t-on le chef du Gouvernement ?", ["Ministre", "Juge", "Maire"], 0))).not.toBeNull();
  });
});

describe("une phrase à trou n'accorde aucun mot placé après le blanc", () => {
  /** Les seuls mots qui suivent un blanc dans ce lot : un petit mot ou un verbe, jamais un adjectif que le genre de la réponse ferait accorder. */
  const AFTER_BLANK = new Set(["du", "de", "pour", "qui", "à", "dans", "avec", "se", "sont", "est"]);

  it("laisse après le blanc un petit mot, jamais un mot qui s'accorde", () => {
    for (const entry of allProgrammeEntries()) {
      if (!(entry.topic.key in TOPIC_KINDS)) continue;
      for (let n = 0; n < 20; n++)
        for (let palier = 1; palier <= 5; palier++) {
          const games = generateGames(entry.topic.games ?? [], { klass: "CM2", palierIndex: palier, palierCount: 5, seed: `accord:${entry.topic.key}:${n}:${palier}` });
          for (const game of games) {
            if (game.type !== "fill-blank") continue;
            const next = /___ ([\p{L}']+)/u.exec(String(game.payload.text))?.[1];
            if (next !== undefined) expect(AFTER_BLANK.has(next.toLowerCase()), `« ${String(game.payload.text)} » : « ${next} » suit le blanc`).toBe(true);
          }
        }
    }
  });
});

describe("une réponse à écrire qui n'admet qu'un sigle le demande", () => {
  /** Un sigle : des capitales seules, avec ou sans article (« OMC », « L'OMC », « la FAO »). */
  const isSigle = (answer: string) => /^((le|la|les) |l')?[A-Z]{2,6}$/u.test(answer.replace(/^(Le|La|Les|L') ?/u, (article) => article.toLowerCase()));

  it("cm2-afr-ecrire et cm2-mon-ecrire : « Écris le sigle. » dès que toutes les écritures admises sont des sigles", () => {
    let seen = 0;
    for (const entry of allProgrammeEntries()) {
      if (!(entry.topic.key in TOPIC_KINDS)) continue;
      for (let n = 0; n < 20; n++)
        for (let palier = 1; palier <= 5; palier++) {
          const games = generateGames(entry.topic.games ?? [], { klass: "CM2", palierIndex: palier, palierCount: 5, seed: `sigle:${entry.topic.key}:${n}:${palier}` });
          for (const game of games) {
            if (game.type !== "short-answer") continue;
            const accepted = game.payload.acceptedAnswers as string[];
            // « Organisation mondiale du commerce » est juste aussi : sans la consigne, le nom en entier était refusé.
            if (!accepted.every(isSigle)) continue;
            seen++;
            expect(game.prompt, accepted.join(" | ")).toMatch(/Écris le sigle\.$/u);
          }
        }
    }
    expect(seen).toBeGreaterThan(0);
  });
});
