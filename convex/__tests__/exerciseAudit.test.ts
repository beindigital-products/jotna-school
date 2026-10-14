import { describe, expect, it } from "vitest";

import {
  DEFECT_SEVERITY,
  PROMPT_WORD_CEILING,
  auditExercise,
  blockingDefects,
  emojiArithmetic,
  tallyCodes,
  type AuditInput,
  type DefectCode,
} from "../paliers/exerciseAudit";
import { correctAnswerText } from "../paliers/exerciseRules";
import { shapeBatch, verifyMathBatch } from "../paliers";
import { auditExercises, auditExercisesForPaliers } from "../paliers/pregen";
import { BANK as anglais } from "@/components/landing/demo/bank/anglais";
import { BANK as educationArtistique } from "@/components/landing/demo/bank/education-artistique";
import { BANK as eveilScientifique } from "@/components/landing/demo/bank/eveil-scientifique";
import { BANK as francais } from "@/components/landing/demo/bank/francais";
import { BANK as geographie } from "@/components/landing/demo/bank/geographie";
import { BANK as histoire } from "@/components/landing/demo/bank/histoire";
import { BANK as instructionCivique } from "@/components/landing/demo/bank/instruction-civique";
import { BANK as mathematiques } from "@/components/landing/demo/bank/mathematiques";
import type { SubjectBank } from "@/components/landing/demo/demo-types";

/**
 * LE CONTRÔLEUR STRUCTUREL (`paliers/exerciseAudit.ts`) : un cas par code de
 * défaut, des exercices corrects qui ne doivent rien produire, et la banque
 * écrite à la main (`components/landing/demo/bank`) qui ne doit produire aucun
 * défaut `blocking`. Un faux positif écarte un bon exercice : c'est le défaut
 * à craindre.
 */

const codesOf = (input: AuditInput) => auditExercise(input).map((defect) => defect.code);

// ---------------------------------------------------------------------------
// Des exercices de départ, corrects, que chaque cas abîme d'un seul trait
// ---------------------------------------------------------------------------

const HINTS = ["Pense à la grande ville de la côte.", "C'est aussi la plus grande ville du pays."];

function qcm(over: Partial<AuditInput> = {}, payload: Record<string, unknown> = {}): AuditInput {
  return {
    type: "qcm",
    prompt: "Quelle est la capitale du Sénégal ?",
    payload: { options: ["Dakar", "Thiès", "Kaolack"], correctIndex: 0, ...payload },
    answerKey: "Dakar",
    hints: HINTS,
    class: "CE2",
    subject: "Géographie",
    ...over,
  };
}

function shortAnswer(over: Partial<AuditInput> = {}, payload: Record<string, unknown> = {}): AuditInput {
  return {
    type: "short-answer",
    prompt: "Comment s'appelle la capitale du Sénégal ?",
    payload: { acceptedAnswers: ["Dakar"], ...payload },
    answerKey: "Dakar",
    hints: HINTS,
    class: "CE2",
    subject: "Géographie",
    ...over,
  };
}

function match(pairs: [string, string][], over: Partial<AuditInput> = {}): AuditInput {
  return {
    type: "match",
    prompt: "Relie chaque ville à sa région.",
    payload: { pairs: pairs.map(([left, right]) => ({ left, right })) },
    answerKey: "",
    hints: HINTS,
    class: "CE2",
    subject: "Géographie",
    ...over,
  };
}

const THREE_PAIRS: [string, string][] = [
  ["Mbour", "Thiès"],
  ["Touba", "Diourbel"],
  ["Richard-Toll", "Saint-Louis"],
];

function order(sequence: string[], over: Partial<AuditInput> = {}): AuditInput {
  return {
    type: "order",
    prompt: "Remets les étapes dans l'ordre.",
    payload: { correctSequence: sequence },
    answerKey: sequence.join(", "),
    hints: HINTS,
    class: "CE2",
    subject: "Éveil scientifique",
    ...over,
  };
}

function dragDrop(
  payload: { zones: string[]; items: { text: string; correctZone: string }[] },
  over: Partial<AuditInput> = {},
): AuditInput {
  return {
    type: "drag-drop",
    prompt: "Glisse chaque aliment dans la bonne case.",
    payload,
    answerKey: "",
    hints: HINTS,
    class: "CE2",
    subject: "Éveil scientifique",
    ...over,
  };
}

const FOOD = {
  zones: ["Fruits", "Légumes"],
  items: [
    { text: "Mangue", correctZone: "Fruits" },
    { text: "Banane", correctZone: "Fruits" },
    { text: "Carotte", correctZone: "Légumes" },
    { text: "Oignon", correctZone: "Légumes" },
  ],
};

function fillBlank(payload: Record<string, unknown>, over: Partial<AuditInput> = {}): AuditInput {
  return {
    type: "fill-blank",
    prompt: "Complète la phrase avec le bon mot.",
    payload,
    answerKey: "Mes amis ont un ballon.",
    hints: ["Cherche le verbe avoir.", "On peut remplacer par « avaient »."],
    class: "CE1",
    subject: "Français",
    ...over,
  };
}

// ---------------------------------------------------------------------------
// Un cas par code de défaut
// ---------------------------------------------------------------------------

const CASES: Record<DefectCode, AuditInput> = {
  // --- Énoncé ---
  prompt_empty: qcm({ prompt: "   " }),
  prompt_too_short: qcm({ prompt: "Où ?" }),
  prompt_truncated: qcm({ prompt: "Awa a acheté des mangues pour" }),
  prompt_ends_midphrase: qcm({ prompt: "Quel animal vit dans la" }),
  prompt_unclosed_pair: qcm({ prompt: "Quelle est la capitale du Sénégal (pays d'Afrique ?" }),
  prompt_dangling_colon: shortAnswer({ prompt: "Écris le nom du fruit :" }),
  prompt_too_long_for_class: shortAnswer({
    class: "CI",
    prompt:
      "Awa va au marché avec sa maman et son petit frère pour acheter des mangues, du riz, de l'huile, du sucre, du sel et du pain pour toute la famille ce soir.",
  }),
  visual_missing: qcm({ prompt: "Combien de billes as-tu ?" }, { options: ["3", "4", "5"] }),
  hole_without_hole: qcm({ prompt: "Complète la phrase avec le bon mot." }, { options: ["ont", "on", "sont"] }),
  payload_malformed: qcm({ payload: null }),
  short_answer_in_ci: shortAnswer({ class: "CI" }),
  // --- QCM ---
  qcm_options_few: qcm({}, { options: ["Dakar"] }),
  qcm_options_many: qcm({}, { options: ["Dakar", "Thiès", "Kaolack", "Touba", "Mbour", "Matam", "Kolda"] }),
  qcm_correct_index_out_of_range: qcm({}, { correctIndex: 5 }),
  qcm_correct_option_empty: qcm({ answerKey: "" }, { options: ["", "Thiès", "Kaolack"] }),
  qcm_option_empty: qcm({}, { options: ["Dakar", "", "Thiès"] }),
  qcm_correct_option_duplicated: qcm({}, { options: ["Dakar", "Thiès", "Dakar"] }),
  qcm_option_duplicated: qcm({}, { options: ["Dakar", "Thiès", "Thiès"] }),
  qcm_option_case_twin: qcm({}, { options: ["Dakar", "dakar", "Thiès"] }),
  qcm_equivalent_options_with_correct: qcm(
    { prompt: "Combien font 2 + 3 ?", answerKey: "5", subject: "Mathématiques" },
    { options: ["5", "cinq", "6"] },
  ),
  qcm_equivalent_options: qcm(
    { prompt: "Combien font 2 + 2 ?", answerKey: "4", subject: "Mathématiques" },
    { options: ["4", "6", "six"] },
  ),
  qcm_answer_key_mismatch: qcm({ answerKey: "Thiès" }),
  qcm_answer_key_unrelated: qcm({ answerKey: "Saint-Louis" }),
  qcm_catch_all_option: qcm({}, { options: ["Dakar", "Thiès", "Toutes les réponses"] }),
  qcm_emoji_sum_mismatch: qcm(
    { prompt: "Combien de mangues as-tu ? 🥭🥭 + 🥭", class: "CI", subject: "Mathématiques", answerKey: "2" },
    { options: ["2", "3", "4"], correctIndex: 0 },
  ),
  shape_emoji_mismatch: qcm(
    { prompt: "Quel est le nom de cette forme ? 🟦", class: "CI", subject: "Mathématiques", answerKey: "rectangle" },
    { options: ["carré", "rectangle", "triangle", "cercle"], correctIndex: 1 },
  ),
  qcm_correct_option_stands_out: qcm(
    { answerKey: "Dakar est la capitale du Sénégal depuis 1960" },
    { options: ["Thiès", "Kaolack", "Dakar est la capitale du Sénégal depuis 1960"], correctIndex: 2 },
  ),
  // --- Association ---
  match_pairs_invalid: match([["Mbour", "Thiès"]]),
  match_pairs_count: match([
    ["Mbour", "Thiès"],
    ["Touba", "Diourbel"],
  ]),
  match_side_empty: match([...THREE_PAIRS, ["Matam", ""]]),
  match_pair_duplicated: match([...THREE_PAIRS, ["Mbour", "Thiès"]]),
  match_left_repeated: match([...THREE_PAIRS, ["Mbour", "Dakar"]]),
  match_right_repeated: match([...THREE_PAIRS, ["Joal", "Thiès"]]),
  // --- Ordre ---
  order_too_few: order(["Une seule étape"]),
  order_few: order(["L'eau s'évapore", "La pluie tombe"]),
  order_item_empty: order(["L'eau s'évapore", "", "La pluie tombe"]),
  order_item_duplicated: order(["L'eau s'évapore", "La pluie tombe", "L'eau s'évapore"]),
  order_already_sorted: order(["Banane", "Mangue", "Orange", "Pomme"], { prompt: "Pose les fruits sur la table." }),
  order_spells_other_word: order(["e", "l", "o", "p", "u"], {
    prompt: "Mets les lettres dans l'ordre pour écrire 'poule'.",
    class: "CI",
    subject: "Français",
  }),
  order_without_criterion: order(["Lion", "Chat", "Chien"], {
    prompt: "Mets ces animaux dans l'ordre : chat, chien, lion.",
    class: "CI",
    subject: "Mathématiques",
  }),
  order_syllable_without_vowel: order(["ma", "ng", "ue"], {
    prompt: "Remets les syllabes dans l'ordre pour le mot de la ville.",
    class: "CI",
    subject: "Français",
  }),
  // --- Glisser-déposer ---
  dragdrop_zones_few: dragDrop({ zones: ["Fruits"], items: FOOD.items.slice(0, 2) }),
  dragdrop_items_few: dragDrop({ zones: FOOD.zones, items: [FOOD.items[0]] }),
  dragdrop_generic_zone: dragDrop({ zones: ["Zone A", "Zone B"], items: FOOD.items.map((i, k) => ({ ...i, correctZone: k < 2 ? "Zone A" : "Zone B" })) }),
  dragdrop_zone_duplicated: dragDrop({ zones: ["Fruits", "fruits", "Légumes"], items: FOOD.items }),
  dragdrop_zone_missing: dragDrop({ zones: FOOD.zones, items: [...FOOD.items, { text: "Poulet", correctZone: "Viandes" }] }),
  dragdrop_label_without_zone: dragDrop({ zones: FOOD.zones, items: [...FOOD.items, { text: "Poulet", correctZone: "" }] }),
  dragdrop_empty_zone: dragDrop({ zones: ["Fruits", "Légumes", "Céréales"], items: FOOD.items }),
  dragdrop_item_empty: dragDrop({ zones: FOOD.zones, items: [...FOOD.items, { text: "", correctZone: "Fruits" }] }),
  // --- Réponse courte ---
  short_answer_no_answer: shortAnswer({}, { acceptedAnswers: [] }),
  short_answer_empty_accepted: shortAnswer({}, { acceptedAnswers: ["Dakar", ""] }),
  short_answer_answer_in_prompt: shortAnswer({ prompt: "Écris le mot « mangue » en lettres bien droites." }, { acceptedAnswers: ["mangue"] }),
  // --- Phrase à trous ---
  fill_blank_invalid: fillBlank({
    text: "Mes amis ___ un ballon ___ ils jouent.",
    blanks: [{ options: ["ont", "on"], answer: "ont" }],
  }),
  fill_blank_off_limits: fillBlank({
    text: "Mes amis ___ un ballon.",
    blanks: [{ options: ["ont", "on", "sont", "es", "est", "a"], answer: "ont" }],
  }),
  fill_blank_word_unknown: fillBlank(
    { text: "Complète avec la bonne lettre : ___ngue.", blanks: [{ options: ["m", "t", "s"], answer: "m" }] },
    { prompt: "Complète avec la bonne lettre.", class: "CI" },
  ),
  fill_blank_word_unreadable: fillBlank(
    { text: "Le mot est ___ (pa, ra, ni).", blanks: [{ options: ["pa", "ra", "ni"], answer: "pa" }] },
    { prompt: "Complète avec la bonne syllabe.", class: "CI" },
  ),
  // --- Indices ---
  hints_few: qcm({ hints: ["Un seul indice."] }),
  hint_empty: qcm({ hints: ["Pense à la côte.", "", "C'est la plus grande ville."] }),
  hints_duplicated: qcm({ hints: ["Pense à la côte.", "pense à la côte !"] }),
  hint_gives_answer: shortAnswer({ hints: ["C'est Dakar, tout simplement.", "Pense à la côte."] }),
  hint_dangling_visual: qcm({ hints: ["Regarde tes billes.", "Pense à la côte."] }),
  // --- Texte ---
  text_double_space: qcm({ prompt: "Quelle est la  capitale du Sénégal ?" }),
  text_markup: qcm({ prompt: "Quelle est la **capitale** du Sénégal ?" }),
  text_placeholder: qcm({}, { options: ["Dakar", "undefined", "Thiès"] }),
  text_replacement_char: qcm({ prompt: "Quelle est la capit�le du Sénégal ?" }),
  text_english_in_young_class: qcm({ class: "CP", subject: "Français", prompt: "Quel animal dit the dog ?" }, { options: ["Le chien", "Le chat"] }),
  text_foreign_currency: shortAnswer({ prompt: "Un cahier coûte 5 euros. Combien coûtent 2 cahiers ?" }, { acceptedAnswers: ["10"] }),
};

describe("auditExercise : un cas par code de défaut", () => {
  it("couvre tous les codes", () => {
    expect(Object.keys(CASES).sort()).toEqual(Object.keys(DEFECT_SEVERITY).sort());
  });

  for (const [code, input] of Object.entries(CASES) as [DefectCode, AuditInput][]) {
    it(`${code} (${DEFECT_SEVERITY[code]})`, () => {
      const defects = auditExercise(input);
      const found = defects.find((defect) => defect.code === code);
      expect(found, `${code} absent de ${JSON.stringify(defects.map((d) => d.code))}`).toBeDefined();
      expect(found?.severity).toBe(DEFECT_SEVERITY[code]);
      expect(found?.detail.length).toBeGreaterThan(5);
    });
  }

  it("les cas d'un seul trait ne cumulent pas d'autres défauts bloquants que le leur", () => {
    // Un cas qui en déclenche un second prouve mal le premier. Les cas
    // volontairement doubles (un énoncé vide n'a pas de longueur) sont listés.
    const allowed: Partial<Record<DefectCode, DefectCode[]>> = {
      qcm_correct_option_empty: ["qcm_answer_key_mismatch"],
      prompt_empty: [],
      dragdrop_zone_duplicated: [],
    };
    for (const [code, input] of Object.entries(CASES) as [DefectCode, AuditInput][]) {
      if (DEFECT_SEVERITY[code] !== "blocking") continue;
      const others = blockingDefects(auditExercise(input))
        .map((d) => d.code)
        .filter((c) => c !== code && !(allowed[code] ?? []).includes(c));
      expect(others, code).toEqual([]);
    }
  });

  it("range les défauts bloquants avant les avertissements, un seul par code", () => {
    const defects = auditExercise(
      qcm(
        { prompt: "Awa a acheté des mangues pour", hints: ["Un seul indice."] },
        { options: ["Dakar", "Thiès", "Thiès", "Toutes les réponses"] },
      ),
    );
    const severities = defects.map((d) => d.severity);
    expect(severities).toEqual([...severities].sort((a, b) => (a === b ? 0 : a === "blocking" ? -1 : 1)));
    expect(new Set(defects.map((d) => d.code)).size).toBe(defects.length);
  });
});

// ---------------------------------------------------------------------------
// Les exercices corrects : aucun défaut, pas même un avertissement
// ---------------------------------------------------------------------------

type Good = { name: string; input: AuditInput };

const good = (name: string, input: Partial<AuditInput> & Pick<AuditInput, "type" | "prompt" | "payload">): Good => ({
  name,
  input: { answerKey: "", hints: HINTS, ...input },
});

const GOOD: Good[] = [
  good("maths CI : une addition avec ses mangues dessinées", {
    type: "qcm",
    class: "CI",
    subject: "Mathématiques",
    prompt: "Aïssatou a 3 mangues 🥭🥭🥭. On lui en donne 2 de plus 🥭🥭. Combien en a-t-elle maintenant ?",
    payload: { options: ["4", "6", "5", "1"], correctIndex: 2 },
    answerKey: "5",
    hints: ["Compte les 3 mangues, puis celles qu'on lui donne.", "Ajouter, c'est avoir plus."],
  }),
  good("maths CI : compter des billes dessinées", {
    type: "qcm",
    class: "CI",
    subject: "Mathématiques",
    prompt: "Combien de billes vois-tu ? 🔵🔵🔵🔵",
    payload: { options: ["3", "4", "5"], correctIndex: 1 },
    answerKey: "4",
    hints: ["Touche chaque bille du doigt.", "Compte à voix haute : 1, 2, 3…"],
  }),
  good("maths CP : les pattes de deux chats", {
    type: "qcm",
    class: "CP",
    subject: "Mathématiques",
    prompt: "Combien de pattes ont 2 chats ?",
    payload: { options: ["2", "4", "8"], correctIndex: 2 },
    answerKey: "8",
    hints: ["Un chat a 4 pattes.", "Ajoute les pattes du premier et du second chat."],
  }),
  good("maths CP : ranger des nombres", {
    type: "order",
    class: "CP",
    subject: "Mathématiques",
    prompt: "Range ces nombres du plus petit au plus grand.",
    payload: { correctSequence: ["12", "25", "47", "83"] },
    answerKey: "12, 25, 47, 83",
  }),
  good("maths CE1 : la monnaie rendue", {
    type: "short-answer",
    class: "CE1",
    subject: "Mathématiques",
    prompt: "Une mangue coûte 150 FCFA. Awa en achète 3 et paie avec 500 FCFA. Combien lui rend-on ?",
    payload: { acceptedAnswers: ["50"] },
    answerKey: "50",
  }),
  good("maths CE2 : relier calculs et résultats", {
    type: "match",
    class: "CE2",
    subject: "Mathématiques",
    prompt: "Relie chaque calcul à son résultat.",
    payload: {
      pairs: [
        { left: "2 × 6", right: "12" },
        { left: "3 × 5", right: "15" },
        { left: "4 × 4", right: "16" },
      ],
    },
  }),
  good("maths CM1 : une fraction égale à 1/2", {
    type: "qcm",
    class: "CM1",
    subject: "Mathématiques",
    prompt: "Quelle fraction est égale à 1/2 ?",
    payload: { options: ["2/4", "1/3", "3/4", "1/4"], correctIndex: 0 },
    answerKey: "2/4",
  }),
  good("maths CM1 : un calcul qui répète le résultat dans l'énoncé", {
    type: "short-answer",
    class: "CM1",
    subject: "Mathématiques",
    prompt: "Calcule 10 − 3 + 3.",
    payload: { acceptedAnswers: ["10"] },
    answerKey: "10",
  }),
  good("maths CM1 : un décimal à partager", {
    type: "short-answer",
    class: "CM1",
    subject: "Mathématiques",
    prompt: "Une corde mesure 2,5 m. On la coupe en deux parts égales. Quelle est la longueur d'une part, en mètres ?",
    payload: { acceptedAnswers: ["1,25", "1.25"] },
    answerKey: "1,25",
  }),
  good("maths CM2 : comparer des décimaux", {
    type: "qcm",
    class: "CM2",
    subject: "Mathématiques",
    prompt: "Quel nombre est le plus grand ?",
    payload: { options: ["0,5", "0,45", "0,075", "0,4"], correctIndex: 0 },
    answerKey: "0,5",
  }),
  good("maths CM2 : distance, vitesse, durée", {
    type: "qcm",
    class: "CM2",
    subject: "Mathématiques",
    prompt: "Un car roule à 60 km/h. Il part à 8 h et arrive à 11 h 30. Quelle distance parcourt-il ?",
    payload: { options: ["180 km", "210 km", "240 km", "150 km"], correctIndex: 1 },
    answerKey: "210 km",
  }),
  good("maths CM2 : pairs et impairs", {
    type: "drag-drop",
    class: "CM2",
    subject: "Mathématiques",
    prompt: "Classe ces nombres.",
    payload: {
      zones: ["Pairs", "Impairs"],
      items: [
        { text: "12", correctZone: "Pairs" },
        { text: "7", correctZone: "Impairs" },
        { text: "20", correctZone: "Pairs" },
        { text: "9", correctZone: "Impairs" },
      ],
    },
  }),
  good("français CP : assembler des syllabes", {
    type: "short-answer",
    class: "CP",
    subject: "Français",
    prompt: "Assemble les syllabes dans le bon ordre et écris le mot : mi - te - mar.",
    payload: { acceptedAnswers: ["marmite", "une marmite"] },
    answerKey: "marmite",
  }),
  good("français CE1 : a et à, deux options qui ne diffèrent que par l'accent", {
    type: "qcm",
    class: "CE1",
    subject: "Français",
    prompt: "Quel mot complète la phrase : Awa ___ un livre ?",
    payload: { options: ["a", "à"], correctIndex: 0 },
    answerKey: "a",
    hints: ["Essaie de remplacer par « avait ».", "Si « avait » va, on écrit a, sans accent."],
  }),
  good("français CE1 : on ou ont, phrase à trous", {
    type: "fill-blank",
    class: "CE1",
    subject: "Français",
    prompt: "Complète la phrase avec le bon mot.",
    payload: { text: "Mes amis ___ un ballon.", blanks: [{ options: ["ont", "on"], answer: "ont" }] },
    answerKey: "Mes amis ont un ballon.",
    hints: ["Cherche le verbe avoir.", "On peut remplacer par « avaient »."],
  }),
  good("français CE2 : une phrase à remettre en ordre", {
    type: "order",
    class: "CE2",
    subject: "Français",
    prompt: "Remets les mots dans l'ordre pour faire une phrase.",
    payload: { correctSequence: ["Awa", "mange", "du", "riz"] },
    answerKey: "Awa mange du riz",
  }),
  good("français CM2 : l'accord du participe", {
    type: "qcm",
    class: "CM2",
    subject: "Français",
    prompt: "Quelle phrase est correctement écrite ?",
    payload: {
      options: [
        "Les mangues que Fatou a achetées sont mûres.",
        "Les mangues que Fatou a acheté sont mûres.",
        "Les mangues que Fatou à achetées sont mûres.",
      ],
      correctIndex: 0,
    },
    answerKey: "Les mangues que Fatou a achetées sont mûres.",
  }),
  good("histoire CE1 : autrefois et aujourd'hui", {
    type: "drag-drop",
    class: "CE1",
    subject: "Histoire",
    prompt: "Glisse chaque objet dans la bonne case.",
    payload: {
      zones: ["Autrefois", "Aujourd'hui"],
      items: [
        { text: "Lampe à pétrole", correctZone: "Autrefois" },
        { text: "Téléphone portable", correctZone: "Aujourd'hui" },
        { text: "Pirogue à rames", correctZone: "Autrefois" },
        { text: "Voiture", correctZone: "Aujourd'hui" },
      ],
    },
    hints: ["Pense à ce que tes grands-parents utilisaient.", "Un objet récent a souvent de l'électricité."],
  }),
  good("histoire CE2 : un royaume et le titre de son roi", {
    type: "match",
    class: "CE2",
    subject: "Histoire",
    prompt: "Associe chaque royaume au titre de son roi.",
    payload: {
      pairs: [
        { left: "Cayor", right: "Damel" },
        { left: "Baol", right: "Teigne" },
        { left: "Djolof", right: "Bourba" },
      ],
    },
  }),
  good("histoire CM2 : une date", {
    type: "qcm",
    class: "CM2",
    subject: "Histoire",
    prompt: "En quelle année l'esclavage a-t-il été aboli dans les colonies françaises ?",
    payload: { options: ["1789", "1848", "1904", "1960"], correctIndex: 1 },
    answerKey: "1848",
  }),
  good("géographie CE2 : villes et régions", {
    type: "match",
    class: "CE2",
    subject: "Géographie",
    prompt: "Associe chaque ville à sa région.",
    payload: { pairs: THREE_PAIRS.map(([left, right]) => ({ left, right })) },
  }),
  good("géographie CM1 : un océan", {
    type: "short-answer",
    class: "CM1",
    subject: "Géographie",
    prompt: "Quel océan borde le Sénégal à l'ouest ?",
    payload: { acceptedAnswers: ["Atlantique", "océan Atlantique", "l'océan Atlantique"] },
    answerKey: "Atlantique",
    hints: ["Pense à la côte de Dakar.", "Son nom commence par un A."],
  }),
  good("éveil scientifique CE1 : se protéger des moustiques", {
    type: "qcm",
    class: "CE1",
    subject: "Éveil scientifique",
    prompt: "Quel objet nous protège des moustiques la nuit ?",
    payload: { options: ["Une moustiquaire", "Un parapluie", "Un chapeau"], correctIndex: 0 },
    answerKey: "Une moustiquaire",
  }),
  good("éveil scientifique CM1 : le cycle de l'eau", {
    type: "order",
    class: "CM1",
    subject: "Éveil scientifique",
    prompt: "Remets les étapes du cycle de l'eau dans l'ordre.",
    payload: {
      correctSequence: [
        "L'eau s'évapore",
        "La vapeur forme des nuages",
        "La pluie tombe",
        "Les rivières se remplissent",
      ],
    },
  }),
  good("éveil scientifique CI : les sens", {
    type: "qcm",
    class: "CI",
    subject: "Éveil scientifique",
    prompt: "Avec quoi sentons-nous les odeurs ?",
    payload: { options: ["Le nez", "Les yeux", "Les oreilles"], correctIndex: 0 },
    answerKey: "Le nez",
  }),
  good("instruction civique CP : le casque", {
    type: "short-answer",
    class: "CP",
    subject: "Instruction civique",
    prompt: "Sur une moto, que dois-tu mettre sur la tête pour te protéger ?",
    payload: { acceptedAnswers: ["casque", "un casque", "le casque"] },
    answerKey: "casque",
    hints: ["Pense à ce qui protège la tête.", "C'est dur et ça se boucle sous le menton."],
  }),
  good("instruction civique CE2 : aider un camarade", {
    type: "qcm",
    class: "CE2",
    subject: "Instruction civique",
    prompt: "Tu vois un camarade tomber dans la cour. Que fais-tu ?",
    payload: { options: ["Je l'aide à se relever", "Je me moque de lui", "Je pars en courant"], correctIndex: 0 },
    answerKey: "Je l'aide à se relever",
  }),
  good("instruction civique CM2 : la Constitution", {
    type: "fill-blank",
    class: "CM2",
    subject: "Instruction civique",
    prompt: "Complète la phrase avec le mot qui convient.",
    payload: {
      text: "La ___ est la loi fondamentale du Sénégal.",
      blanks: [{ options: ["Constitution", "République", "Démocratie"], answer: "Constitution" }],
    },
    answerKey: "La Constitution est la loi fondamentale du Sénégal.",
    hints: ["C'est le texte le plus important du pays.", "Toutes les autres lois doivent le respecter."],
  }),
  good("éducation artistique CI : un instrument", {
    type: "qcm",
    class: "CI",
    subject: "Éducation artistique",
    prompt: "Quel instrument fait « boum boum » ?",
    payload: { options: ["🥁", "🎹", "🎺"], correctIndex: 0 },
    answerKey: "🥁",
    hints: ["Écoute le bruit : boum, boum.", "On le frappe avec des baguettes."],
  }),
  good("éducation artistique CE1 : l'archet du riti", {
    type: "short-answer",
    class: "CE1",
    subject: "Éducation artistique",
    prompt: "Avec quel objet frotte-t-on la corde du riti pour la faire sonner ?",
    payload: { acceptedAnswers: ["archet", "un archet", "l'archet"] },
    answerKey: "archet",
  }),
  good("anglais CI : un mot et son émoji, sans mot anglais dans l'énoncé", {
    type: "qcm",
    class: "CI",
    subject: "Anglais",
    prompt: "Comment dit-on « pomme » en anglais ?",
    payload: { options: ["🍎 apple", "🍌 banana", "🥭 mango"], correctIndex: 0 },
    answerKey: "🍎 apple",
  }),
  good("anglais CE2 : remettre une phrase anglaise dans l'ordre", {
    type: "order",
    class: "CE2",
    subject: "Anglais",
    prompt: "Remets les mots dans l'ordre pour former une phrase.",
    payload: { correctSequence: ["I", "have", "got", "a", "bag"] },
    answerKey: "I have got a bag",
  }),
  good("anglais CM1 : la forme en -ing", {
    type: "fill-blank",
    class: "CM1",
    subject: "Anglais",
    prompt: "Choisis le bon mot pour dire ce que fait Fatou.",
    payload: {
      text: "Fatou is ___ now.",
      blanks: [{ options: ["swimming", "swim", "swims"], answer: "swimming" }],
    },
    answerKey: "Fatou is swimming now.",
    hints: ["Le verbe suit « is » et se termine en -ing.", "Avec « swim », on double le m."],
  }),
];

describe("auditExercise : les exercices corrects ne produisent aucun défaut", () => {
  it("compte au moins 25 exercices corrects, de toutes les matières et du CI au CM2", () => {
    expect(GOOD.length).toBeGreaterThanOrEqual(25);
    const classes = new Set(GOOD.map((g) => g.input.class));
    expect([...classes].sort()).toEqual(["CE1", "CE2", "CI", "CM1", "CM2", "CP"]);
    const subjects = new Set(GOOD.map((g) => g.input.subject));
    expect(subjects.size).toBe(8);
    expect(new Set(GOOD.map((g) => g.input.type)).size).toBe(6);
  });

  for (const { name, input } of GOOD) {
    it(name, () => {
      expect(auditExercise(input)).toEqual([]);
    });
  }
});

describe("auditExercise : ce qui ne doit pas être pris pour un défaut", () => {
  it("laisse des tuiles à pictogrammes porter l'image (« Glisse chaque image »)", () => {
    const input = dragDrop(
      {
        zones: ["Fruits", "Animaux"],
        items: [
          { text: "🍎", correctZone: "Fruits" },
          { text: "🥭", correctZone: "Fruits" },
          { text: "🐟", correctZone: "Animaux" },
        ],
      },
      { prompt: "Fruits ou animaux ? Glisse chaque image dans la bonne case.", hints: ["Regarde l'image de chaque tuile.", "Un fruit se mange."] },
    );
    expect(auditExercise(input)).toEqual([]);
  });

  it("garde un indice qui explique les deux choix sans désigner le bon", () => {
    const input = fillBlank(
      {
        text: "Se laver tous les jours, c'est de l'hygiène ___.",
        blanks: [{ options: ["individuelle", "collective"], answer: "individuelle" }],
      },
      {
        hints: ["« Individuelle » parle d'une seule personne, « collective » de tout le monde.", "Se laver, c'est pour soi."],
        subject: "Éveil scientifique",
      },
    );
    expect(codesOf(input)).not.toContain("hint_gives_answer");
  });

  it("ne confond pas « -eur » avec une monnaie, ni le franc CFA avec une faute", () => {
    expect(codesOf(match(THREE_PAIRS, { hints: ["Le suffixe -eur désigne celui qui fait l'action.", "Un cahier coûte 500 FCFA."] }))).toEqual([]);
  });

  it("accepte l'anglais d'un énoncé de CE1 et celui d'une citation en CP", () => {
    expect(codesOf(qcm({ class: "CE1", subject: "Français", prompt: "Que veut dire « the dog » ?", answerKey: "Le chien" }, { options: ["Le chien", "Le chat"] }))).toEqual([]);
    expect(codesOf(qcm({ class: "CP", subject: "Français", prompt: "Que veut dire « the dog » ?", answerKey: "Le chien" }, { options: ["Le chien", "Le chat"] }))).toEqual([]);
  });

  it("n'avertit pas des variantes de casse dans une leçon de français", () => {
    const input = qcm({ subject: "Français", prompt: "Quel mot prend une majuscule ?" }, { options: ["Dakar", "dakar", "ville"], correctIndex: 0 });
    expect(codesOf(input)).not.toContain("qcm_option_case_twin");
  });

  it("laisse deux fractions équivalentes face à face (simplifier 2/4)", () => {
    const input = qcm(
      { subject: "Mathématiques", class: "CM1", prompt: "Quelle est la fraction irréductible de 2/4 ?", answerKey: "1/2" },
      { options: ["1/2", "2/4", "1/4"], correctIndex: 0 },
    );
    expect(codesOf(input)).toEqual([]);
  });

  it("compte « cinq » et « 5 » comme le même nombre, mais pas « 5 m » et « 5 km »", () => {
    const meters = qcm({ answerKey: "5 m", subject: "Mathématiques" }, { options: ["5 m", "5 km", "50 m"], correctIndex: 0 });
    expect(codesOf(meters)).not.toContain("qcm_equivalent_options_with_correct");
    const words = qcm({ answerKey: "vingt-cinq", subject: "Mathématiques" }, { options: ["vingt-cinq", "25", "52"], correctIndex: 0 });
    expect(codesOf(words)).toContain("qcm_equivalent_options_with_correct");
  });

  it("laisse opposer deux écritures du même nombre quand l'énoncé interroge l'écriture", () => {
    const digits = qcm(
      { class: "CM1", subject: "Mathématiques", prompt: "Quel nombre est écrit en chiffres ?", answerKey: "450" },
      { options: ["quatre cent cinquante", "450", "quatre mille cinq cent"], correctIndex: 1 },
    );
    expect(codesOf(digits)).not.toContain("qcm_equivalent_options_with_correct");
    const spelling = qcm(
      { class: "CE2", subject: "Mathématiques", prompt: "Quel nombre est juste en écriture ?", answerKey: "huit mille cinq cents" },
      { options: ["huit mille cinq cent", "huit mille cinq cents", "huit mille cinq cent trente"], correctIndex: 1 },
    );
    expect(codesOf(spelling)).not.toContain("qcm_equivalent_options_with_correct");
  });

  it("ne bloque pas un « : » final qui suit la matière citée, et garde le « : » qui ne suit rien", () => {
    for (const prompt of ["Écris le pluriel de 'mangue' :", "Écris le pluriel de « mil » :"]) {
      expect(codesOf(shortAnswer({ prompt })), prompt).not.toContain("prompt_dangling_colon");
    }
    for (const prompt of ["Écris le nom du fruit :", "Complète la phrase :"]) {
      expect(codesOf(shortAnswer({ prompt })), prompt).toContain("prompt_dangling_colon");
    }
  });

  it("ne signale pas une scène absente pour « ci-dessous » dans un glisser-déposer, ni pour une image à produire", () => {
    const tiles = dragDrop(
      { zones: ["Périmètre", "Aire"], items: [{ text: "20 cm", correctZone: "Périmètre" }, { text: "24 cm²", correctZone: "Aire" }] },
      { class: "CE2", subject: "Mathématiques", prompt: "Assigne les valeurs ci-dessous aux bonnes zones : Périmètre et Aire." },
    );
    expect(codesOf(tiles)).not.toContain("visual_missing");
    const art = shortAnswer({
      class: "CM2",
      subject: "Éducation artistique",
      prompt: "Donne deux éléments que l'illustrateur doit montrer dans une image de la cour de récréation.",
    });
    expect(codesOf(art)).not.toContain("visual_missing");
  });

  it("compte « a » et « à » comme deux zones (leçon d'homophones)", () => {
    const input = dragDrop(
      {
        zones: ["a", "à"],
        items: [
          { text: "Il ___ un bon repas.", correctZone: "a" },
          { text: "Nous allons ___ la plage.", correctZone: "à" },
        ],
      },
      { class: "CM1", subject: "Français", prompt: "Remplace les mots par le bon homophone." },
    );
    expect(codesOf(input)).not.toContain("dragdrop_zones_few");
    const twin = dragDrop({ zones: ["Fruits", "fruits"], items: FOOD.items.slice(0, 2).map((i) => ({ ...i, correctZone: "Fruits" })) });
    expect(codesOf(twin)).toContain("dragdrop_zones_few");
  });

  it("garde « 1 » et « 1,0 » face à face quand l'énoncé interroge une valeur", () => {
    const input = qcm(
      { class: "Tle", subject: "Mathématiques", prompt: "Quelle est la probabilité de l'union de A et B ?", answerKey: "1,0" },
      { options: ["0,2", "0,4", "1", "1,0"], correctIndex: 3 },
    );
    expect(codesOf(input)).toContain("qcm_equivalent_options_with_correct");
  });

  it("garde un association qui répète un son (« mangue » et « yassa » vont à « a »)", () => {
    const input = match([
      ["mangue", "a"],
      ["yassa", "a"],
      ["thiéboudienne", "e"],
    ], { subject: "Français", prompt: "Relie chaque mot au son qu'il contient." });
    const defects = auditExercise(input);
    expect(blockingDefects(defects)).toEqual([]);
    expect(defects.map((d) => d.code)).toContain("match_right_repeated");
  });

  it("ne bloque pas une suite d'une classe qui compte plus de mots (CM2)", () => {
    expect(PROMPT_WORD_CEILING.CM2).toBeGreaterThan(PROMPT_WORD_CEILING.CI);
    const text = Array.from({ length: 120 }, () => "mot").join(" ");
    expect(codesOf(shortAnswer({ class: "CM2", prompt: `Lis ce texte : ${text}. Que fait Awa ?` }))).not.toContain(
      "prompt_too_long_for_class",
    );
  });

  it("ne prend ni « un » / « une » pour le nombre 1, ni « thé » pour l'anglais, ni « nan » pour un défaut", () => {
    const articles = qcm({ subject: "Français", class: "CE1", prompt: "Quel petit mot va devant « robe » ?", answerKey: "une" }, { options: ["un", "une"], correctIndex: 1 });
    expect(codesOf(articles)).toEqual([]);
    const tea = qcm({ subject: "Français", class: "CP", prompt: "Que boit Awa le matin avec du pain ? Du thé.", answerKey: "Du thé" }, { options: ["Du thé", "De l'eau"], correctIndex: 0 });
    expect(codesOf(tea)).not.toContain("text_english_in_young_class");
    const wolof = qcm({ prompt: "Que répond-on à « Nanga def » ? Nan, merci." }, {});
    expect(codesOf(wolof)).not.toContain("text_placeholder");
    expect(codesOf(qcm({ prompt: "Quelle est la capitale du NaN ?" }))).toContain("text_placeholder");
  });

  it("compare l'étiquette à la zone telle qu'elle est écrite", () => {
    const spaced = dragDrop({ zones: ["Fruits ", "Légumes"], items: FOOD.items.map((item) => ({ ...item, correctZone: item.correctZone === "Fruits" ? "Fruits " : item.correctZone })) });
    expect(codesOf(spaced)).not.toContain("dragdrop_zone_missing");
    const loose = dragDrop({ zones: ["Fruits", "Légumes"], items: FOOD.items.map((item) => ({ ...item, correctZone: item.correctZone === "Fruits" ? "fruits" : item.correctZone })) });
    expect(codesOf(loose)).toContain("dragdrop_zone_missing");
  });

  it("ne lève jamais d'exception sur un contenu inattendu", () => {
    for (const payload of [null, undefined, 3, "x", [], {}, { options: null }, { pairs: [null, 3] }]) {
      for (const type of ["qcm", "match", "order", "drag-drop", "short-answer", "fill-blank", "pattern", "inconnu"]) {
        expect(() => auditExercise({ type, prompt: "Un énoncé.", payload, hints: undefined })).not.toThrow();
      }
    }
    expect(() => auditExercise({ type: "qcm", prompt: undefined as unknown as string, payload: {} })).not.toThrow();
  });

  it("ne juge pas la forme d'un jeu fabriqué par le code", () => {
    expect(codesOf({ type: "pattern", prompt: "Complète la frise.", payload: { sequence: ["🔴", null] }, hints: [] })).toEqual([]);
  });
});

describe("auditExercise : les cas d'énoncé de la plainte du client", () => {
  it("« Combien de billes as-tu ? » sans billes : bloquant, indice « Regarde tes billes » signalé", () => {
    const input = shortAnswer(
      { prompt: "Combien de billes as-tu ?", class: "CI", subject: "Mathématiques", hints: ["Regarde tes billes.", "Compte-les."] },
      { acceptedAnswers: ["5"] },
    );
    const defects = auditExercise(input);
    expect(blockingDefects(defects).map((d) => d.code)).toContain("visual_missing");
    expect(defects.map((d) => d.code)).toContain("hint_dangling_visual");
  });

  it("« Complète : » sans trou, qcm ou réponse courte", () => {
    expect(codesOf(qcm({ prompt: "Complète :" }))).toContain("hole_without_hole");
    expect(codesOf(shortAnswer({ prompt: "Complète : 3 + 4 = ?" }))).not.toContain("hole_without_hole");
    expect(codesOf(shortAnswer({ prompt: "Complète la phrase : Awa mange du ___." }))).not.toContain("hole_without_hole");
    expect(codesOf(shortAnswer({ prompt: "Complète la suite : 2, 4, 6, 8" }))).not.toContain("hole_without_hole");
  });

  it("une phrase coupée par une virgule ou une élision", () => {
    expect(codesOf(qcm({ prompt: "Quand Awa arrive à l'école," }))).toContain("prompt_truncated");
    expect(codesOf(qcm({ prompt: "Quelle est la couleur d'" }))).toContain("prompt_truncated");
    expect(codesOf(qcm({ prompt: "Trouve-le" }))).not.toContain("prompt_ends_midphrase");
  });

  it("reconnaît l'indice qui donne un résultat chiffré, pas celui qui compte des objets", () => {
    const base = shortAnswer({ prompt: "Combien font 6 + 6 ?", subject: "Mathématiques", class: "CE1" }, { acceptedAnswers: ["12"] });
    expect(codesOf({ ...base, hints: ["Le résultat est 12.", "Double 6."] })).toContain("hint_gives_answer");
    expect(codesOf({ ...base, hints: ["6 + 6 = 12.", "Double 6."] })).toContain("hint_gives_answer");
    expect(codesOf({ ...base, hints: ["Compte 12 doigts de plus.", "Double 6."] })).not.toContain("hint_gives_answer");
  });
});

describe("tallyCodes", () => {
  it("compte les exercices touchés par chaque code", () => {
    const into: Record<string, number> = {};
    tallyCodes(auditExercise(CASES.qcm_catch_all_option), into);
    tallyCodes(auditExercise(CASES.qcm_catch_all_option), into);
    expect(into.qcm_catch_all_option).toBe(2);
  });
});

// ---------------------------------------------------------------------------
// La banque écrite à la main : aucun défaut bloquant
// ---------------------------------------------------------------------------

const BANKS: Record<string, SubjectBank> = {
  Français: francais,
  Mathématiques: mathematiques,
  "Éveil scientifique": eveilScientifique,
  Histoire: histoire,
  Géographie: geographie,
  "Instruction civique": instructionCivique,
  "Éducation artistique": educationArtistique,
  Anglais: anglais,
};

describe("auditExercise sur la banque écrite à la main de la vitrine", () => {
  const found: { where: string; prompt: string; blocking: string[]; all: string[] }[] = [];
  let checked = 0;
  for (const [subject, bank] of Object.entries(BANKS)) {
    for (const [klass, items] of Object.entries(bank)) {
      items.forEach((item, i) => {
        checked += 1;
        const defects = auditExercise({
          type: item.type,
          prompt: item.prompt,
          payload: item.payload,
          answerKey: correctAnswerText({ type: item.type, payload: item.payload }) ?? "",
          hints: item.hints,
          class: klass,
          subject,
        });
        if (defects.length > 0) {
          found.push({
            where: `${subject} ${klass} #${i + 1} (${item.type})`,
            prompt: item.prompt,
            blocking: blockingDefects(defects).map((d) => d.code),
            all: defects.map((d) => d.code),
          });
        }
      });
    }
  }

  it("contrôle les 274 exercices de la banque", () => {
    expect(checked).toBeGreaterThanOrEqual(270);
  });

  it("ne produit aucun défaut bloquant", () => {
    expect(found.filter((f) => f.blocking.length > 0)).toEqual([]);
  });

  it("ne produit aucun avertissement non plus : un avertissement ici est un faux positif ou un exercice à reprendre", () => {
    expect(found).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// Branché dans la génération
// ---------------------------------------------------------------------------

describe("la génération écarte les exercices à défaut bloquant et compte les avertissements", () => {
  const raw = (over: Record<string, unknown>) => ({
    type: "qcm",
    statement: "Quelle est la capitale du Sénégal ?",
    payload: { options: ["Dakar", "Thiès", "Kaolack"], correctIndex: 0 },
    correctAnswer: "Dakar",
    hints: HINTS,
    ...over,
  });

  it("écarte une phrase coupée, garde un exercice maladroit et le compte", () => {
    const batch = shapeBatch(
      [
        raw({}),
        raw({ statement: "Awa a acheté des mangues pour" }),
        raw({
          payload: { options: ["Dakar", "Thiès", "Toutes les réponses"], correctIndex: 0 },
        }),
      ],
      { class: "CE2", subject: "Géographie" },
    );
    expect(batch.exos.map((e) => e.prompt)).toEqual([
      "Quelle est la capitale du Sénégal ?",
      "Quelle est la capitale du Sénégal ?",
    ]);
    expect(batch.audit.rejected).toBe(1);
    expect(batch.audit.warned).toBe(1);
    expect(batch.audit.byCode).toMatchObject({ prompt_truncated: 1, qcm_catch_all_option: 1 });
  });

  it("écarte une bonne réponse qui désigne une autre option que celle écrite", () => {
    const batch = shapeBatch([raw({ correctAnswer: "Thiès" })], { class: "CE2", subject: "Géographie" });
    expect(batch.exos).toEqual([]);
    expect(batch.audit.rejected).toBe(1);
  });

  it("en mathématiques, le calcul répare avant que le contrôleur ne juge", () => {
    // Le modèle désigne « 6 » mais écrit « 5 » : mathRepair remet l'index d'aplomb.
    const wrong = {
      type: "qcm",
      statement: "Combien font 2 + 3 ?",
      payload: { options: ["4", "6", "5"], correctIndex: 1 },
      correctAnswer: "5",
      mathExpression: "2 + 3",
      hints: HINTS,
    };
    const batch = verifyMathBatch([wrong], { class: "CE1", subject: "Mathématiques" });
    expect(batch.repaired).toBe(1);
    expect(batch.audit.rejected).toBe(0);
    expect(batch.exos).toHaveLength(1);
    expect((batch.exos[0].payload as { correctIndex: number }).correctIndex).toBe(2);
  });

  it("en mathématiques, un exercice à défaut bloquant est écarté aussi", () => {
    const batch = verifyMathBatch(
      [{ type: "short-answer", statement: "Écris le résultat :", payload: { acceptedAnswers: ["5"] }, correctAnswer: "5", mathExpression: "2 + 3", hints: HINTS }],
      { class: "CE1", subject: "Mathématiques" },
    );
    expect(batch.exos).toEqual([]);
    expect(batch.audit.byCode).toMatchObject({ prompt_dangling_colon: 1 });
  });
});

// ---------------------------------------------------------------------------
// L'audit de la base : `pregen:auditExercises`
// ---------------------------------------------------------------------------

type Doc = Record<string, unknown> & { _id: string };

/** Une base minuscule : de quoi lire un palier, sa matière et ses exercices, et noter les écritures. */
function fakeStore(docs: Doc[]) {
  const byId = new Map(docs.map((doc) => [doc._id, doc]));
  const patches: [string, Record<string, unknown>][] = [];
  const db = {
    get: async (id: string) => byId.get(id) ?? null,
    patch: async (id: string, fields: Record<string, unknown>) => {
      patches.push([id, fields]);
      Object.assign(byId.get(id) as Doc, fields);
    },
    query: (_table: string) => ({
      withIndex: (_index: string, build: (q: { eq: (field: string, value: unknown) => unknown }) => unknown) => {
        let wanted: unknown;
        build({ eq: (_field, value) => ((wanted = value), {}) });
        return { take: async () => docs.filter((doc) => doc.palierId === wanted && doc._id.startsWith("ex")) };
      },
    }),
  };
  return { db, patches, byId };
}

const exercise = (id: string, palierId: string, input: AuditInput): Doc => ({
  _id: id,
  palierId,
  type: input.type,
  prompt: input.prompt,
  payload: input.payload,
  answerKey: input.answerKey ?? "",
  hints: [...(input.hints ?? [])],
});

type MutationHandler = (
  ctx: { db: ReturnType<typeof fakeStore>["db"] },
  args: { palierIds: string[]; dryRun: boolean; limitSamples: number },
) => Promise<{
  checked: number;
  exercisesWithDefects: number;
  blockingExercises: number;
  warningOnlyExercises: number;
  byCode: Record<string, number>;
  paliersTouched: number;
  paliersInvalidated: number;
  samples: { exerciseId: string; prompt: string; blocking: boolean; codes: string[]; blockingCodes: string[] }[];
}>;

const mutation = (auditExercisesForPaliers as unknown as { _handler: MutationHandler })._handler;

describe("pregen:auditExercises : l'audit de tous les exercices en base", () => {
  const world = () =>
    fakeStore([
      { _id: "subject1", name: "Géographie" },
      { _id: "p1", subjectId: "subject1", class: "CE2", status: "cached" },
      { _id: "p2", subjectId: "subject1", class: "CE2", status: "cached" },
      exercise("ex1", "p1", qcm({}, { options: ["Dakar", "Thiès", "Dakar"] })),
      exercise("ex2", "p1", qcm({}, { options: ["Dakar", "Thiès", "Toutes les réponses"] })),
      exercise("ex3", "p1", qcm()),
      exercise("ex4", "p2", qcm()),
    ]);

  it("compte, classe les exemples (bloquants d'abord) et ne touche à rien en dryRun", async () => {
    const { db, patches } = world();
    const batch = await mutation({ db }, { palierIds: ["p1", "p2"], dryRun: true, limitSamples: 30 });
    expect(batch).toMatchObject({
      checked: 4,
      exercisesWithDefects: 2,
      blockingExercises: 1,
      warningOnlyExercises: 1,
      paliersTouched: 1,
      paliersInvalidated: 1,
    });
    expect(batch.byCode).toEqual({ qcm_correct_option_duplicated: 1, qcm_catch_all_option: 1 });
    expect(batch.samples.map((sample) => sample.exerciseId)).toEqual(["ex1", "ex2"]);
    expect(batch.samples[0]).toMatchObject({ blocking: true, blockingCodes: ["qcm_correct_option_duplicated"] });
    expect(patches).toEqual([]);
  });

  it("sans dryRun : marque l'exercice bloquant à relire et fait passer son palier en stale", async () => {
    const { db, patches } = world();
    await mutation({ db }, { palierIds: ["p1", "p2"], dryRun: false, limitSamples: 30 });
    expect(patches).toEqual([
      ["ex1", { needsManualReview: true }],
      ["p1", { status: "stale" }],
    ]);
  });

  it("l'action refuse un déploiement qui n'est pas celui nommé, pagine les paliers et borne les exemples", async () => {
    process.env.CONVEX_CLOUD_URL = "https://impartial-ermine-150.convex.cloud";
    type Args = { confirmDeployment: string; dryRun?: boolean; limitSamples?: number };
    const handler = (auditExercises as unknown as {
      _handler: (ctx: unknown, args: Args) => Promise<{
        checked: number;
        paliersScanned: number;
        samples: unknown[];
        samplesTruncated: boolean;
        byCode: Record<string, number>;
      }>;
    })._handler;

    await expect(handler({}, { confirmDeployment: "autre-deploiement" })).rejects.toThrow();

    const sample = (i: number) => ({ exerciseId: `ex${i}`, blocking: i % 2 === 0, codes: ["prompt_empty"], blockingCodes: [] });
    const asked: number[] = [];
    const run = async (limitSamples?: number) => {
      asked.length = 0;
      const pages = [
        { ids: ["p1", "p2"], isDone: false, cursor: "c1" },
        { ids: ["p3"], isDone: true, cursor: "c2" },
      ];
      let page = 0;
      const ctx = {
        runQuery: async () => pages[page++],
        runMutation: async (_ref: unknown, args: { limitSamples: number }) => {
          asked.push(args.limitSamples);
          return {
            checked: 10,
            exercisesWithDefects: 40,
            blockingExercises: 20,
            warningOnlyExercises: 20,
            byCode: { prompt_empty: 40 },
            paliersTouched: 1,
            paliersInvalidated: 1,
            samples: Array.from({ length: 40 }, (_, i) => sample(i)),
          };
        },
      };
      return handler(ctx, { confirmDeployment: "impartial-ermine-150", dryRun: true, limitSamples });
    };

    const defaults = await run();
    expect(defaults).toMatchObject({ paliersScanned: 3, checked: 20, samplesTruncated: true });
    expect(defaults.samples).toHaveLength(30);
    expect(asked).toEqual([30, 30]);
    expect(defaults.byCode).toEqual({ prompt_empty: 80 });

    const everything = await run(5000);
    expect(asked).toEqual([2000, 2000]);
    expect(everything.samples).toHaveLength(80);
  });
});


describe("les erreurs de contenu que la forme ne montrait pas (CI)", () => {
  const ci = { class: "CI", subject: "Français" } as const;

  it("les lettres doivent écrire le mot demandé", () => {
    const poule = (sequence: string[]) =>
      order(sequence, { ...ci, prompt: "Mets les lettres dans l'ordre pour écrire 'poule'." });
    expect(codesOf(poule(["p", "o", "u", "l", "e"]))).not.toContain("order_spells_other_word");
    expect(codesOf(poule(["e", "l", "o", "p", "u"]))).toContain("order_spells_other_word");
    expect(codesOf(poule(["p", "o", "u", "l"]))).toContain("order_spells_other_word");
  });

  it("des syllabes qui écrivent le mot passent, même avec des accents ou une majuscule", () => {
    const e = order(["Ma", "ngue"], { ...ci, prompt: "Remets les syllabes dans l'ordre pour faire « mangue »." });
    expect(codesOf(e)).not.toContain("order_spells_other_word");
    const accent = order(["thié", "bou", "dienne"], {
      ...ci,
      prompt: "Remets les syllabes dans l'ordre pour faire le mot 'thiéboudienne'.",
    });
    expect(codesOf(accent)).not.toContain("order_spells_other_word");
  });

  it("ne juge pas un ordre de mots ou d'étapes", () => {
    const e = order(["Je", "mange", "une", "mangue"], { ...ci, prompt: "Remets les mots dans l'ordre pour faire 'je mange une mangue'." });
    expect(codesOf(e)).not.toContain("order_spells_other_word");
  });

  it("une syllabe a une voyelle", () => {
    const bissap = (sequence: string[]) =>
      order(sequence, { ...ci, prompt: "Remets les syllabes dans l'ordre pour faire 'bissap'." });
    expect(codesOf(bissap(["bi", "ssap"]))).not.toContain("order_syllable_without_vowel");
    expect(codesOf(bissap(["bi", "ss", "ap"]))).toContain("order_syllable_without_vowel");
    expect(codesOf(bissap(["bi", "ssa", "p"]))).toContain("order_syllable_without_vowel");
  });

  it("le calcul dessiné en émojis doit valoir l'option juste", () => {
    const sum = (prompt: string, options: string[], correctIndex: number) =>
      qcm({ prompt, class: "CI", subject: "Mathématiques", answerKey: options[correctIndex] }, { options, correctIndex });
    expect(emojiArithmetic("Combien ? 🥭🥭 + 🥭")).toBe(3);
    expect(emojiArithmetic("Combien reste-t-il ? 🔵🔵🔵🔵 − 🔵")).toBe(3);
    expect(emojiArithmetic("🥭🥭 + 🍌")).toBeNull();
    expect(emojiArithmetic("Combien de billes vois-tu ? 🔵🔵🔵")).toBeNull();
    expect(codesOf(sum("Combien de mangues ? 🥭🥭 + 🥭", ["2", "3", "4"], 1))).not.toContain("qcm_emoji_sum_mismatch");
    expect(codesOf(sum("Combien de mangues ? 🥭🥭 + 🥭", ["2", "3", "4"], 0))).toContain("qcm_emoji_sum_mismatch");
    expect(codesOf(sum("Combien reste-t-il ? 🔵🔵🔵🔵 − 🔵", ["3", "4", "5"], 0))).not.toContain("qcm_emoji_sum_mismatch");
    // Des émojis différents : la question décide, le contrôleur ne tranche pas.
    expect(codesOf(sum("Combien de mangues ? 🥭🥭 + 🍌", ["2", "3", "4"], 0))).not.toContain("qcm_emoji_sum_mismatch");
  });
});


describe("le mot qu'un trou de lettre ou de syllabe fait écrire (CI, CP)", () => {
  const trou = (text: string, answer: string, over: Partial<AuditInput> = {}) =>
    fillBlank(
      { text, blanks: [{ options: [answer, "x", "z"], answer }] },
      { prompt: "Complète avec la bonne syllabe.", class: "CI", ...over },
    );

  it("accepte un trou qui écrit un mot connu", () => {
    expect(codesOf(trou("Complète la lettre : m___to.", "o"))).not.toContain("fill_blank_word_unknown");
    expect(codesOf(trou("Complète la syllabe : ___ngue.", "ma"))).not.toContain("fill_blank_word_unknown");
    expect(codesOf(trou("Complète la syllabe : ___ ssa", "ya"))).not.toContain("fill_blank_word_unknown");
    expect(codesOf(trou("___mille.", "fa"))).not.toContain("fill_blank_word_unknown");
  });

  it("refuse un trou qui écrit un mot inconnu", () => {
    expect(codesOf(trou("Complète la lettre : ___ngue.", "m"))).toContain("fill_blank_word_unknown");
    expect(codesOf(trou("Complète la syllabe : ___mille.", "mi"))).toContain("fill_blank_word_unknown");
  });

  it("reconnaît un pluriel et un féminin", () => {
    expect(codesOf(trou("Complète la syllabe : ___ngues.", "ma"))).not.toContain("fill_blank_word_unknown");
    expect(codesOf(trou("Complète la syllabe : pe___te.", "ti"))).not.toContain("fill_blank_word_unknown");
  });

  it("ne juge ni une phrase, ni une autre classe, ni l'anglais", () => {
    expect(codesOf(trou("Awa a ___ biscuits.", "5", { prompt: "Complète avec la bonne lettre." }))).not.toContain("fill_blank_word_unknown");
    expect(codesOf(trou("Complète la lettre : ___ngue.", "m", { class: "CE2" }))).not.toContain("fill_blank_word_unknown");
    expect(codesOf(trou("Complète la lettre : a___le.", "pp", { subject: "Anglais" }))).not.toContain("fill_blank_word_unknown");
  });

  it("juge aussi « Complète le mot »", () => {
    expect(codesOf(trou("p___lle", "o", { prompt: "Complète le mot : p___lle." }))).toContain("fill_blank_word_unknown");
    expect(codesOf(trou("m___to", "o", { prompt: "Complète le mot : m___to." }))).not.toContain("fill_blank_word_unknown");
  });

  it("refuse « Le mot est ___ » sans mot écrit, l'accepte avec une image", () => {
    expect(codesOf(trou("Le mot est ___ (pa, ra, ni).", "pa"))).toContain("fill_blank_word_unreadable");
    expect(codesOf(trou("🥭 Le mot est ___.", "mangue"))).not.toContain("fill_blank_word_unreadable");
  });
});


describe("la forme qu'un émoji dessine", () => {
  const forme = (prompt: string, options: string[], correctIndex: number) =>
    qcm({ prompt, class: "CI", subject: "Mathématiques", answerKey: options[correctIndex] }, { options, correctIndex });
  const OPTIONS = ["carré", "rectangle", "triangle", "cercle"];

  it("🟦 est un carré, pas un rectangle", () => {
    expect(codesOf(forme("Quel est le nom de cette forme ? 🟦", OPTIONS, 0))).not.toContain("shape_emoji_mismatch");
    expect(codesOf(forme("Quel est le nom de cette forme ? 🟦", OPTIONS, 1))).toContain("shape_emoji_mismatch");
  });

  it("reconnaît le cercle, le rond et le triangle", () => {
    expect(codesOf(forme("Quelle est cette forme ? 🔴", ["un rond", "un carré", "un triangle"], 0))).not.toContain("shape_emoji_mismatch");
    expect(codesOf(forme("Quelle est cette forme ? 🔴", ["un rond", "un carré", "un triangle"], 2))).toContain("shape_emoji_mismatch");
    expect(codesOf(forme("Quelle est cette forme ? 🔺", OPTIONS, 2))).not.toContain("shape_emoji_mismatch");
  });

  it("accepte l'une des formes dessinées quand l'énoncé en montre plusieurs", () => {
    expect(codesOf(forme("Quelle forme a trois côtés ? 🔴 🔺", OPTIONS, 2))).not.toContain("shape_emoji_mismatch");
  });

  it("ne juge ni une question de couleur, ni une réponse qui n'est pas une forme", () => {
    expect(codesOf(forme("De quelle couleur est cette forme ? 🔴", ["rouge", "bleu", "vert"], 0))).not.toContain("shape_emoji_mismatch");
    expect(codesOf(forme("Quel objet est un cercle ? 🔴 🍎", ["la pomme", "le livre"], 0))).not.toContain("shape_emoji_mismatch");
  });

  it("vérifie les paires d'un appariement forme ↔ nom", () => {
    const pairs = (list: [string, string][]) =>
      codesOf(match(list, { prompt: "Relie chaque forme à son nom.", class: "CI", subject: "Mathématiques" }));
    expect(pairs([["🔺", "triangle"], ["🔵", "cercle"], ["⬜", "carré"]])).not.toContain("shape_emoji_mismatch");
    expect(pairs([["🔺", "triangle"], ["🔵", "cercle"], ["🟦", "rectangle"]])).toContain("shape_emoji_mismatch");
    expect(pairs([["🔴", "rouge"], ["🔵", "bleu"], ["🟢", "vert"]])).not.toContain("shape_emoji_mismatch");
  });
});


describe("un ordre à ranger doit dire selon quoi", () => {
  const rank = (prompt: string, sequence: string[] = ["a", "b", "c"]) =>
    codesOf(order(sequence, { prompt, class: "CI", subject: "Mathématiques" }));

  it("refuse des choses sans ordre naturel rangées sans critère", () => {
    for (const prompt of [
      "Mets ces animaux dans l'ordre : lion, cat, dog.",
      "Mets les couleurs dans l'ordre.",
      "Mets ces fruits dans l'ordre : mangue, pomme, banane.",
      "Remets ces formes dans l'ordre : carré, cercle, triangle.",
      "Mets ces parties du corps dans l'ordre : main, tête, jambe.",
      "Mets ces villes en ordre.",
    ]) {
      expect(rank(prompt), prompt).toContain("order_without_criterion");
    }
  });

  it("accepte un critère nommé", () => {
    for (const prompt of [
      "Mets ces fruits dans l'ordre alphabétique.",
      "Range ces fruits du plus petit au plus grand.",
      "Mets ces formes dans l'ordre de leur nombre de côtés.",
      "Mets ces régions dans l'ordre de l'ouest à l'est.",
      "Classe les régions du Sénégal du nord au sud.",
      "Range les couleurs par ordre de l'arc-en-ciel.",
      "Mets ces animaux dans l'ordre de leur taille.",
      "Mets ces lieux dans l'ordre quand tu arrives à l'école.",
      "Classe ces objets de famille en fonction de leur âge :",
      "Mets ces animaux par leur habitat : terre, eau, air.",
      "Mets dans l'ordre les parties du corps pour se lever.",
      "Mets ces lieux dans l'ordre où tu les utilises pendant une journée, d'abord l'entrée.",
    ]) {
      expect(rank(prompt), prompt).not.toContain("order_without_criterion");
    }
  });

  it("accepte ce qui porte son ordre : étapes, phrases, jours, nombres, mots d'une phrase", () => {
    for (const prompt of [
      "Mets ces étapes dans l'ordre.",
      "Mets ces phrases dans le bon ordre.",
      "Mets les jours de la semaine dans l'ordre.",
      "Mets ces nombres dans l'ordre : 6, 1, 4.",
      "Mets les mots dans le bon ordre.",
      "Remets les syllabes dans l'ordre pour former un mot.",
    ]) {
      expect(rank(prompt), prompt).not.toContain("order_without_criterion");
    }
  });
});
