/**
 * VÉRIFIER UNE RÉPONSE PAR SES VALEURS, JAMAIS PAR LA TUILE TOUCHÉE.
 *
 * Deux tuiles peuvent porter le même texte, et c'est souvent voulu : « a »
 * deux fois quand on relie des mots à leur son (mangue et yassa), « n » deux
 * fois dans les lettres de « banane ». L'écran suit chaque tuile par sa
 * POSITION (`components/exercises/*Exercise.tsx`, `lib/exerciseAnswers.ts`)
 * et envoie des valeurs ; ici, on les compare comme des MULTI-ENSEMBLES :
 * chaque paire attendue doit revenir autant de fois qu'elle est attendue, ni
 * plus, ni moins.
 *
 * L'ANCIENNE COMPARAISON PAR ENSEMBLE ÉTAIT TROP LARGE : pour quatre paires
 * attendues, « mangue–a » envoyée quatre fois passait, puisque chaque paire
 * reçue figurait dans l'ensemble. Un écran ne l'envoie pas, mais le serveur
 * ne doit pas compter sur l'écran.
 *
 * MODULE PUR : ni base, ni `ctx`. `palierAttempts.ts` (les paliers) et
 * `attempts.ts` (l'ancien chemin) l'importent, les tests aussi — une seule
 * règle au lieu de trois copies.
 */

export type MatchPair = { left: string; right: string };
export type DragDropItem = { text: string; correctZone: string };

/**
 * Appariement : la liste des paires reliées, `[{ left, right }, …]`.
 *
 * Juste si les paires reçues sont exactement les paires attendues, dans
 * n'importe quel ordre. Deux mots qui ont le même son se relient chacun à
 * l'une des deux tuiles « a » : les deux paires « mangue–a » et « yassa–a »
 * sont attendues, les deux sont rendues.
 */
export function verifyMatch(
  submitted: string,
  payload: { pairs: MatchPair[] },
): boolean {
  const parsed = parseJson(submitted);
  if (!Array.isArray(parsed) || parsed.length !== payload.pairs.length) {
    return false;
  }
  const given: string[] = [];
  for (const entry of parsed) {
    if (!isStringRecord(entry, "left", "right")) return false;
    given.push(key(entry.left, entry.right));
  }
  return sameMultiset(
    given,
    payload.pairs.map((pair) => key(pair.left, pair.right)),
  );
}

/**
 * Glisser-déposer, sous deux formes de réponse.
 *
 * - `{ "étiquette": "zone", … }` : la forme de toujours, que l'écran envoie
 *   tant que les copies d'une même étiquette sont dans la même zone. Chaque
 *   étiquette attendue doit y pointer vers sa zone.
 * - `[{ text, zone }, …]` : une entrée par tuile posée. L'écran l'envoie quand
 *   deux copies d'une même étiquette sont dans deux zones différentes, ce
 *   que l'objet ne sait pas dire. On compare en multi-ensemble.
 *
 * L'écran ne choisit le tableau que dans ce cas-là : un serveur qui ne le
 * connaît pas encore le lit comme un objet sans étiquettes et répond
 * « faux », ce qui est la bonne réponse pour des copies éparpillées dans un
 * exercice où elles vont ensemble. Rien ne casse pendant qu'une version de
 * l'application précède le déploiement du serveur.
 */
export function verifyDragDrop(
  submitted: string,
  payload: { items: DragDropItem[] },
): boolean {
  const parsed = parseJson(submitted);

  if (Array.isArray(parsed)) {
    if (parsed.length !== payload.items.length) return false;
    const given: string[] = [];
    for (const entry of parsed) {
      if (!isStringRecord(entry, "text", "zone")) return false;
      given.push(key(entry.text, entry.zone));
    }
    return sameMultiset(
      given,
      payload.items.map((item) => key(item.text, item.correctZone)),
    );
  }

  if (!parsed || typeof parsed !== "object") return false;
  const zoneOf = parsed as Record<string, unknown>;
  return payload.items.every(
    (item) =>
      Object.prototype.hasOwnProperty.call(zoneOf, item.text) &&
      zoneOf[item.text] === item.correctZone,
  );
}

function parseJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return undefined;
  }
}

/** Une clé sans séparateur à deviner : « a|b » + « c » et « a » + « b|c » restent deux clés. */
function key(first: string, second: string): string {
  return JSON.stringify([first, second]);
}

function isStringRecord<K extends string>(
  value: unknown,
  ...fields: K[]
): value is Record<K, string> {
  if (!value || typeof value !== "object") return false;
  const record = value as Record<string, unknown>;
  return fields.every((field) => typeof record[field] === "string");
}

function sameMultiset(given: string[], expected: string[]): boolean {
  if (given.length !== expected.length) return false;
  const remaining = new Map<string, number>();
  for (const item of expected) {
    remaining.set(item, (remaining.get(item) ?? 0) + 1);
  }
  for (const item of given) {
    const count = remaining.get(item);
    if (!count) return false;
    remaining.set(item, count - 1);
  }
  return true;
}
