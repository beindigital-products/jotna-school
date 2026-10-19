/**
 * LES SONS QU'UN MOT FAIT ENTENDRE : de quoi vérifier, sans modèle, qu'une
 * question « Quel mot a le son [é] ? » n'a qu'une bonne réponse.
 *
 * Le modèle écrit « Quel mot a le son [é] ? » avec « été », « poule » et
 * « fumée » : « fumée » a aussi le son [é], l'enfant qui le choisit a raison et
 * l'écran lui dit qu'il a faux. Le contrôleur doit donc savoir si un mot FAIT
 * ENTENDRE un son.
 *
 * LA PRUDENCE EST LA RÈGLE (comme `exerciseAudit.ts`) : on ne connaît que les
 * sons que l'écriture donne sans ambiguïté, et seulement par leurs graphies
 * sûres. `knownSound` rend `null` pour tout autre son : le contrôleur ne dit
 * rien. Une graphie qu'on ne reconnaît pas (le « er » de « fermer », le « ez »
 * de « nez ») fait rendre `false` : on risque de laisser passer un défaut,
 * jamais d'écarter un bon exercice.
 *
 * MODULE PUR (pas de Convex).
 */

/** Les sons gérés, écrits comme dans une consigne : « [é] », « [ou] », « [ch] ». */
export type KnownSound = "é" | "è" | "ou" | "u" | "f" | "ch";

const KNOWN_SOUNDS: readonly string[] = ["é", "è", "ou", "u", "f", "ch"];

/** Le son d'une consigne (« é », « [ou] », « « ch » »), ou `null` s'il n'est pas géré. */
export function knownSound(raw: string): KnownSound | null {
  const sound = raw
    .normalize("NFC")
    .trim()
    .toLowerCase()
    .replace(/^[\[«"“'(\s]+|[\]»"”')\s]+$/gu, "");
  return KNOWN_SOUNDS.includes(sound) ? (sound as KnownSound) : null;
}

/** L'alphabet phonétique des fiches du programme : [y] est le « u », [e] le « é », [ɛ] le « è ». */
const IPA: Record<string, KnownSound> = { y: "u", e: "é", ɛ: "è", ʃ: "ch" };

/**
 * Le son écrit ENTRE CROCHETS dans une consigne. Les fiches du programme parlent
 * en alphabet phonétique, où [u] est le son « ou » (poule, foulard) et [y] le son
 * de la lettre « u » (fumée) ; le modèle écrit [u] pour l'un ou pour l'autre. On
 * rend les deux lectures : une question qui a deux bonnes réponses dans l'une
 * d'elles est ambiguë pour l'enfant qui la lit ainsi.
 */
export function bracketSounds(raw: string): KnownSound[] {
  const sound = raw.normalize("NFC").trim().toLowerCase();
  if (sound === "u") return ["u", "ou"];
  const ipa = IPA[sound];
  if (ipa) return [ipa];
  const known = knownSound(sound);
  return known ? [known] : [];
}

/**
 * Le « u » qui sonne [u] : ni dans « ou », « eu », « au », « eau », « œu », ni
 * dans « qu » (« que » : [k]), ni dans « gu » devant e, i, y (« guide »), ni
 * dans « un », « um » nasaux (« lundi », « parfum »).
 */
function hasU(word: string): boolean {
  const rest = word
    .replace(/(?:eau|œu|ou|eu|au|qu)/gu, "")
    .replace(/gu(?=[eiyéèê])/gu, "")
    .replace(/u[nm](?![aeiouyéèêâîôûh])/gu, "");
  return rest.includes("u");
}

/** Ce mot fait-il entendre ce son ? Une graphie douteuse fait rendre `false`. */
export function hasSound(word: string, sound: KnownSound): boolean {
  const text = word.normalize("NFC").toLowerCase();
  switch (sound) {
    case "é":
      return text.includes("é");
    case "è":
      return /[èê]/u.test(text);
    case "ou":
      return text.includes("ou");
    case "u":
      return hasU(text);
    case "f":
      return /f|ph/u.test(text);
    case "ch":
      return text.includes("ch");
  }
}
