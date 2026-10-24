import { acceptedOf, all, blankOf, defineMathsTests, itemsOf, levelOf, num, ok, optionsOf, pairsOf, rightOption, sequenceOf, textOf, wrongOf, zonesOf, type Check, type Exo } from "@/lib/test-support/cm1MathsKit";
import type { GameLevel } from "../paliers/games/shared";

/**
 * VITESSE, DISTANCE ET DURÉE AU CM2 (`ma-cm2-vitesse`).
 *
 * Chaque test RECALCULE la réponse avec sa propre arithmétique, écrite à part : la distance est la vitesse fois la durée en heures (les minutes sont
 * divisées par soixante), la vitesse est la distance divisée par la durée, une heure d'arrivée est le départ plus la durée, une durée entre deux horaires est
 * l'arrivée moins le départ. Les écritures « 2 h 30 min » et « 7 h 45 » sont relues par les tests eux-mêmes. Le niveau 2 réunit les paliers 2 et 3.
 */

const NUM = String.raw`\d+(?: \d{3})*`;
const DURATION = String.raw`(?:\d+ h(?: \d+ min)?|\d+ min)`;
const CLOCK = String.raw`\d+ h(?: [0-5]\d)?`;

/** Les minutes d'une durée écrite « 3 h », « 45 min » ou « 2 h 30 min ». */
function minutesOf(text: string): number {
  const full = /^(\d+) h(?: (\d+) min)?$/.exec(text);
  if (full) return Number(full[1]) * 60 + Number(full[2] ?? 0);
  const only = /^(\d+) min$/.exec(text);
  if (only) return Number(only[1]);
  throw new Error(`durée illisible : ${text}`);
}
/** Les minutes depuis minuit d'une heure écrite « 7 h » ou « 7 h 45 ». */
function clockMinutes(text: string): number {
  const m = /^(\d+) h(?: ([0-5]\d))?$/.exec(text);
  if (!m) throw new Error(`heure illisible : ${text}`);
  return Number(m[1]) * 60 + Number(m[2] ?? 0);
}
const durOf = (minutes: number) => (minutes % 60 === 0 ? `${minutes / 60} h` : minutes < 60 ? `${minutes} min` : `${Math.floor(minutes / 60)} h ${minutes % 60} min`);
const clockOf = (minutes: number) => (minutes % 60 === 0 ? `${minutes / 60} h` : `${Math.floor(minutes / 60)} h ${String(minutes % 60).padStart(2, "0")}`);
const fmt = (n: number) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, " ");
const numbersIn = (text: string) => (text.match(new RegExp(NUM, "g")) ?? []).map(num);

/** Les vitesses plausibles de chaque mobile, écrites à part des sources. */
const SPEEDS: Record<string, readonly [number, number]> = { "Un marcheur": [4, 6], "Un cycliste": [10, 20], "Un camion": [40, 70], "Un car": [50, 90], "Un train": [80, 120] };
const VERBS: Record<string, string> = { "Un marcheur": "marche", "Un cycliste": "roule", "Un camion": "roule", "Un car": "roule", "Un train": "roule" };
const speedOk = (mover: string, speed: number) => !!SPEEDS[mover] && speed >= SPEEDS[mover][0] && speed <= SPEEDS[mover][1];

/** Le pas des durées de chaque niveau : des heures (1), des demi-heures (2), des quarts d'heure (3 et 4). */
const PLAN: Record<GameLevel, { unit: number; top: number; floor: number }> = { 1: { unit: 60, top: 240, floor: 120 }, 2: { unit: 30, top: 360, floor: 30 }, 3: { unit: 15, top: 270, floor: 45 }, 4: { unit: 15, top: 360, floor: 45 } };
const durationInPlan = (minutes: number, level: GameLevel) => minutes !== 60 && minutes % PLAN[level].unit === 0 && minutes <= PLAN[level].top && minutes >= PLAN[level].floor;
/** Le pas des horaires et des trajets de chaque niveau. */
const CLOCK_UNIT: Record<GameLevel, number> = { 1: 60, 2: 15, 3: 5, 4: 5 };

const wrongsFit = (exo: Exo, answer: number, unit: string) => {
  const own = numbersIn(exo.prompt);
  return ok(
    wrongOf(exo).every((option) => option.endsWith(` ${unit}`) && num(option.replace(` ${unit}`, "")) !== answer && !own.includes(num(option.replace(` ${unit}`, ""))) && num(option.replace(` ${unit}`, "")) <= Math.max(answer * 3, 12)),
    `un mauvais choix égal à la bonne réponse, à un nombre de l'énoncé ou trop grand : ${wrongOf(exo).join(" ; ")}`,
  );
};

const checkDistance: Check = (exo) => {
  const level = levelOf(exo);
  const m = new RegExp(`^(Un \\p{L}+) (roule|marche) à (\\d+) km/h pendant (${DURATION})\\. Quelle distance parcourt-il \\?$`, "u").exec(exo.prompt);
  if (!m) return `énoncé inconnu : ${exo.prompt}`;
  const speed = Number(m[3]);
  const minutes = minutesOf(m[4]);
  const distance = (speed * minutes) / 60;
  return all(
    ok(VERBS[m[1]] === m[2], `le verbe de ${m[1]} : ${m[2]}`),
    ok(speedOk(m[1], speed), `${m[1]} à ${speed} km/h`),
    ok(durationInPlan(minutes, level), `la durée ${m[4]} au niveau ${level}`),
    ok(Number.isInteger(distance) && distance >= 2, `une distance qui ne tombe pas juste : ${distance}`),
    ok(rightOption(exo) === `${fmt(distance)} km`, `${exo.prompt} : ${rightOption(exo)}, pas ${fmt(distance)} km`),
    wrongsFit(exo, distance, "km"),
  );
};

const checkSpeed: Check = (exo) => {
  const level = levelOf(exo);
  const m = new RegExp(`^(Un \\p{L}+) parcourt (${NUM}) km en (${DURATION})\\. Quelle est sa vitesse en kilomètres par heure \\?$`, "u").exec(exo.prompt);
  if (!m) return `énoncé inconnu : ${exo.prompt}`;
  const distance = num(m[2]);
  const minutes = minutesOf(m[3]);
  const speed = (distance * 60) / minutes;
  return all(
    ok(Number.isInteger(speed), `une vitesse qui ne tombe pas juste : ${speed}`),
    ok(speedOk(m[1], speed), `${m[1]} à ${speed} km/h`),
    ok(durationInPlan(minutes, level), `la durée ${m[3]} au niveau ${level}`),
    ok(rightOption(exo) === `${fmt(speed)} km/h`, `${exo.prompt} : ${rightOption(exo)}, pas ${fmt(speed)} km/h`),
    wrongsFit(exo, speed, "km/h"),
  );
};

const checkDuration: Check = (exo) => {
  const level = levelOf(exo);
  const m = new RegExp(`^(Un \\p{L}+) (roule|marche) à (\\d+) km/h\\. Il parcourt (${NUM}) km\\. Combien de temps dure son trajet \\?$`, "u").exec(exo.prompt);
  if (!m) return `énoncé inconnu : ${exo.prompt}`;
  const speed = Number(m[3]);
  const distance = num(m[4]);
  const minutes = (distance * 60) / speed;
  return all(
    ok(VERBS[m[1]] === m[2], `le verbe de ${m[1]} : ${m[2]}`),
    ok(speedOk(m[1], speed), `${m[1]} à ${speed} km/h`),
    ok(Number.isInteger(minutes) && durationInPlan(minutes, level), `la durée ${minutes} min au niveau ${level}`),
    ok(rightOption(exo) === durOf(minutes), `${exo.prompt} : ${rightOption(exo)}, pas ${durOf(minutes)}`),
    ok(wrongOf(exo).every((option) => new RegExp(`^${DURATION}$`).test(option) && minutesOf(option) !== minutes && minutesOf(option) >= 15), `un mauvais choix égal à la bonne réponse ou mal écrit : ${wrongOf(exo).join(" ; ")}`),
  );
};

const checkArrival: Check = (exo) => {
  const level = levelOf(exo);
  const m = new RegExp(`^(Le car|Le train) part de ([\\p{L}-]+) à (${CLOCK}) et roule (${DURATION})\\. À quelle heure arrive-t-il \\?$`, "u").exec(exo.prompt);
  if (!m) return `énoncé inconnu : ${exo.prompt}`;
  const start = clockMinutes(m[3]);
  const length = minutesOf(m[4]);
  const arrival = start + length;
  const wrongs = wrongOf(exo);
  return all(
    ok(start % CLOCK_UNIT[level] === 0 && length % CLOCK_UNIT[level] === 0, `${m[3]} et ${m[4]} au niveau ${level}`),
    ok(start >= 300 && start <= 900 && length >= 60 && length <= 7 * 60, `un horaire hors plage : ${m[3]}, ${m[4]}`),
    ok(arrival < 24 * 60, "une arrivée qui passe minuit"),
    ok(rightOption(exo) === clockOf(arrival), `${exo.prompt} : ${rightOption(exo)}, pas ${clockOf(arrival)}`),
    ok(wrongs.every((option) => new RegExp(`^${CLOCK}$`).test(option) && clockMinutes(option) !== arrival && clockMinutes(option) > start && clockMinutes(option) < 24 * 60), `un mauvais choix mal écrit ou égal à la bonne réponse : ${wrongs.join(" ; ")}`),
    ok(!wrongs.includes(m[3]), "un mauvais choix égal à l'heure de départ"),
  );
};

const checkSpan: Check = (exo) => {
  const level = levelOf(exo);
  const m = new RegExp(`^(Un car|Un train) part à (${CLOCK}) et arrive à (${CLOCK})\\. Combien de temps dure le trajet \\?$`).exec(exo.prompt);
  if (!m) return `énoncé inconnu : ${exo.prompt}`;
  const start = clockMinutes(m[2]);
  const arrival = clockMinutes(m[3]);
  const length = arrival - start;
  return all(
    ok(length >= 60 && length <= 7 * 60, `une durée de ${length} min`),
    ok(start % CLOCK_UNIT[level] === 0 && arrival % CLOCK_UNIT[level] === 0, `${m[2]} et ${m[3]} au niveau ${level}`),
    ok(rightOption(exo) === durOf(length), `${exo.prompt} : ${rightOption(exo)}, pas ${durOf(length)}`),
    ok(wrongOf(exo).every((option) => new RegExp(`^${DURATION}$`).test(option) && minutesOf(option) !== length && minutesOf(option) >= 15), `un mauvais choix égal à la bonne réponse ou mal écrit : ${wrongOf(exo).join(" ; ")}`),
  );
};

const checkGap: Check = (exo) => {
  const text = textOf(exo);
  const { answer, options } = blankOf(exo);
  const own = numbersIn(text);
  const wrongNums = options.filter((option) => option !== answer).map(num);
  const common = all(
    ok(!wrongNums.some((n) => own.includes(n) || n === num(answer)), `un mauvais choix égal à la bonne réponse ou à un nombre du texte : ${options.join(" ; ")}`),
    ok(exo.hints.length === 3, "trois indices"),
  );
  const distanceForm = new RegExp(`^(Un \\p{L}+) (roule|marche) à (\\d+) km/h pendant (\\d+) h\\. Il parcourt ___ km\\.$`, "u").exec(text);
  if (distanceForm) {
    const speed = Number(distanceForm[3]);
    const hours = Number(distanceForm[4]);
    return all(common, ok(speedOk(distanceForm[1], speed), `${distanceForm[1]} à ${speed} km/h`), ok(hours >= 2 && hours <= 6, `${hours} h`), ok(num(answer) === speed * hours, `${text} : ${answer}, pas ${speed * hours}`));
  }
  const speedForm = new RegExp(`^(Un \\p{L}+) parcourt (${NUM}) km en (\\d+) h\\. Sa vitesse est ___ km/h\\.$`, "u").exec(text);
  if (speedForm) {
    const distance = num(speedForm[2]);
    const hours = Number(speedForm[3]);
    return all(common, ok(distance % hours === 0, "une division qui ne tombe pas juste"), ok(speedOk(speedForm[1], distance / hours), `${speedForm[1]} à ${distance / hours} km/h`), ok(num(answer) === distance / hours, `${text} : ${answer}, pas ${distance / hours}`));
  }
  const hoursForm = new RegExp(`^(Un \\p{L}+) (roule|marche) à (\\d+) km/h\\. Il parcourt (${NUM}) km en ___ h\\.$`, "u").exec(text);
  if (hoursForm) {
    const speed = Number(hoursForm[3]);
    const distance = num(hoursForm[4]);
    return all(common, ok(distance % speed === 0, "une division qui ne tombe pas juste"), ok(speedOk(hoursForm[1], speed), `${hoursForm[1]} à ${speed} km/h`), ok(num(answer) === distance / speed && distance / speed >= 1, `${text} : ${answer}, pas ${distance / speed}`));
  }
  return `phrase à trou inconnue : ${text}`;
};

const checkWrite: Check = (exo) => {
  const level = levelOf(exo);
  const m = new RegExp(`^(Un \\p{L}+) (roule|marche) à (\\d+) km/h pendant (${DURATION})\\. Écris la distance parcourue en kilomètres\\.$`, "u").exec(exo.prompt);
  if (!m) return `énoncé inconnu : ${exo.prompt}`;
  const speed = Number(m[3]);
  const minutes = minutesOf(m[4]);
  const distance = (speed * minutes) / 60;
  return all(
    ok(Number.isInteger(distance), `une distance qui ne tombe pas juste : ${distance}`),
    ok(speedOk(m[1], speed) && VERBS[m[1]] === m[2], `${m[1]} ${m[2]} à ${speed} km/h`),
    ok(durationInPlan(minutes, level), `la durée ${m[4]} au niveau ${level}`),
    ok(exo.answerKey === fmt(distance), `${exo.prompt} : ${exo.answerKey}, pas ${fmt(distance)}`),
    ok(acceptedOf(exo).includes(fmt(distance)) && acceptedOf(exo).includes(String(distance)) && new Set(acceptedOf(exo)).size === acceptedOf(exo).length, `les réponses acceptées : ${acceptedOf(exo).join(" ; ")}`),
  );
};

/** La vitesse d'un trajet écrit « 120 km en 2 h 30 min ». */
function tripSpeed(tile: string): number | null {
  const m = new RegExp(`^(${NUM}) km en (${DURATION})$`).exec(tile);
  if (!m) return null;
  const speed = (num(m[1]) * 60) / minutesOf(m[2]);
  return Number.isInteger(speed) ? speed : null;
}

const checkOrder: Check = (exo) => {
  const speeds = sequenceOf(exo).map(tripSpeed);
  if (speeds.some((speed) => speed === null)) return `un trajet mal écrit ou à vitesse non entière : ${sequenceOf(exo).join(" ; ")}`;
  const fastest = exo.prompt === "Range ces trajets, du plus rapide au plus lent.";
  if (!fastest && exo.prompt !== "Range ces trajets, du plus lent au plus rapide.") return `énoncé inconnu : ${exo.prompt}`;
  const values = speeds as number[];
  return all(
    ok(values.length === 4 && new Set(values).size === 4, "quatre trajets de vitesses différentes"),
    ok(values.every((speed, i) => i === 0 || (fastest ? values[i - 1] > speed : values[i - 1] < speed)), `l'ordre ${values.join(" ; ")} ne suit pas la consigne`),
  );
};

const checkLinks: Check = (exo) => {
  const pairs = pairsOf(exo);
  return all(
    ok(pairs.length === 3, "trois paires"),
    ...pairs.map((pair) => {
      const speed = tripSpeed(pair.left);
      return ok(speed !== null && pair.right === `${fmt(speed)} km/h`, `${pair.left} est relié à ${pair.right}, pas à ${speed} km/h`);
    }),
    ok(new Set(pairs.map((pair) => pair.right)).size === 3, "deux trajets de la même vitesse"),
  );
};

const checkSort: Check = (exo) => {
  const zones = zonesOf(exo);
  const m = /^Plus lent que (\d+) km\/h$/.exec(zones[0]);
  if (!m || zones[1] !== `Plus rapide que ${m[1]} km/h`) return `cases inconnues : ${zones.join(" ; ")}`;
  const threshold = Number(m[1]);
  const items = itemsOf(exo);
  return all(
    ok(items.length === 4 && items.filter((item) => item.correctZone === zones[0]).length === 2, "deux trajets par case"),
    ...items.map((item) => {
      const speed = tripSpeed(item.text);
      if (speed === null) return `un trajet mal écrit ou à vitesse non entière : ${item.text}`;
      return ok(speed !== threshold && item.correctZone === (speed < threshold ? zones[0] : zones[1]), `${item.text} (${speed} km/h) est rangé dans « ${item.correctZone} »`);
    }),
  );
};

defineMathsTests({
  label: "de la vitesse, de la distance et de la durée du CM2",
  klass: "CM2",
  checks: {
    "cm2-vit-distance": checkDistance,
    "cm2-vit-vitesse": checkSpeed,
    "cm2-vit-duree": checkDuration,
    "cm2-vit-arrivee": checkArrival,
    "cm2-vit-horaire": checkSpan,
    "cm2-vit-trou": checkGap,
    "cm2-vit-ecrire": checkWrite,
    "cm2-vit-ranger": checkOrder,
    "cm2-vit-relier": checkLinks,
    "cm2-vit-glisser": checkSort,
  },
  topicKinds: {
    "ma-cm2-vitesse": ["cm2-vit-distance", "cm2-vit-vitesse", "cm2-vit-duree", "cm2-vit-arrivee", "cm2-vit-horaire", "cm2-vit-trou", "cm2-vit-ecrire", "cm2-vit-ranger", "cm2-vit-relier", "cm2-vit-glisser"],
  },
});
