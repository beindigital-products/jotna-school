/**
 * LES GABARITS DE L'INVITATION ET DU CONSEIL DU CP : reconnaître une invitation et un conseil, répondre poliment,
 * retrouver qui invite, qui, quand (`fr-cp-inviter`).
 *
 * Le modèle écrivait « Associe les invitations aux bonnes personnes » (« Viens à mon anniversaire » ~ « Aïssatou » :
 * rien ne dit à qui), « ___ à mon anniversaire samedi » avec « Viens » ET « Venez » possibles, une invitation coupée
 * en fragments sans critère d'ordre. Trois exercices sur cinq étaient faux ou douteux. Ici les phrases viennent d'un
 * tableau fermé qui reprend les exemples de la fiche (« Viens à mon baptême samedi », « Je t'invite à jouer au ballon »,
 * « Fais attention en traversant », « Lave-toi les mains avant de manger »), et chaque question n'a qu'une réponse.
 *
 * CE QUE LA FICHE DONNE, ET CE QUE CE FICHIER N'INVENTE PAS
 * - Une invitation PROPOSE de venir faire quelque chose avec celui qui parle ; un conseil AIDE celui qui l'écoute à bien
 *   faire ou à rester en bonne santé. Aucune phrase de la liste n'est les deux.
 * - Une réponse polie remercie ; une réponse impolie commande, se moque ou refuse sèchement. Pour accepter, une seule
 *   réponse polie est offerte ; pour refuser, une seule réponse polie de refus : jamais deux réponses polies ensemble.
 * - Le trou « ___ à mon anniversaire » parle à UN ami : « Viens », et jamais « Venez » (deux amis).
 *
 * RÈGLES POUR AJOUTER UNE PHRASE
 * - Une invitation dit de venir (« viens », « je t'invite », « veux-tu venir ») ; un conseil parle de toi, de ta santé ou
 *   de ta sécurité. Aucune des deux phrases ne se discute.
 * - Aucun indice n'écrit un mot de la bonne réponse. Une étiquette est une phrase entière, jamais « article + un nom ».
 * - Les énoncés n'ont aucun « : », au plus une apostrophe droite, vingt-huit mots au plus.
 *
 * MODULE PUR (voir `types.ts`).
 */
import { pick, shuffle, type GameContext, type GeneratedGame } from "./shared";
import { choiceGame, firstLetter, gapGame, sequenceGame, sortGame } from "./tableaux";

/** Des phrases qui proposent de venir. */
export const INVITATIONS: readonly string[] = [
  "Viens jouer au ballon avec moi !",
  "Viens à mon baptême samedi !",
  "Je t'invite à mon anniversaire.",
  "Viens manger chez moi demain !",
  "Veux-tu venir au marché avec moi ?",
  "Viens chanter avec moi !",
];

/** Des phrases qui aident celui qui les écoute. */
export const ADVICE: readonly string[] = [
  "Fais attention en traversant la route.",
  "Lave-toi les mains avant de manger.",
  "Bois de l'eau quand il fait chaud.",
  "Mets ton chapeau quand il y a du soleil.",
  "Regarde des deux côtés avant de traverser.",
  "Mange des fruits pour grandir.",
];

/** « Invitation » et « Conseil » : les deux cases. */
const ZONES = ["Invitation", "Conseil"] as const;

/** « Glisse chaque phrase dans la bonne case. » : deux à trois invitations, deux à trois conseils. */
export function makeInvitationSort(ctx: GameContext): GeneratedGame {
  return sortGame(ctx, "invitation-glisser", "invitation ou conseil", () => {
    const each = ctx.level === 1 ? 2 : 3;
    return {
      prompt: "Glisse chaque phrase dans la bonne case.",
      zones: ZONES,
      items: [
        ...shuffle(ctx.rng, INVITATIONS)
          .slice(0, each)
          .map((text) => ({ text, zone: ZONES[0] })),
        ...shuffle(ctx.rng, ADVICE)
          .slice(0, each)
          .map((text) => ({ text, zone: ZONES[1] })),
      ],
      hints: [
        "Lis chaque phrase doucement.",
        "Une invitation te propose quelque chose à faire ensemble, un conseil t'aide à bien faire.",
        "Un conseil parle de toi, de ta santé ou de ta sécurité.",
      ],
    };
  });
}

/** « Quelle phrase est une invitation ? » ou « …un conseil ? » : une phrase juste et deux de l'autre sorte. */
export function makeInvitationChoice(ctx: GameContext): GeneratedGame {
  return choiceGame(ctx, "invitation-choisir", "reconnaître une invitation ou un conseil", () => {
    const wantInvitation = ctx.rng() < 0.5;
    const right = wantInvitation ? INVITATIONS : ADVICE;
    const other = wantInvitation ? ADVICE : INVITATIONS;
    return {
      prompt: wantInvitation ? "Quelle phrase est une invitation ?" : "Quelle phrase est un conseil ?",
      answer: pick(ctx.rng, right),
      wrong: shuffle(ctx.rng, other).slice(0, 2),
      hints: [
        "Lis les trois phrases doucement.",
        "Une invitation te propose quelque chose à faire ensemble, un conseil t'aide à bien faire.",
        wantInvitation ? "Cherche la phrase où quelqu'un te propose une sortie ou une fête." : "Cherche la phrase qui parle de ta santé ou de ta sécurité.",
      ],
    };
  });
}

const HOSTS = ["Awa", "Fatou", "Aminata", "Moussa", "Cheikh", "Modou"] as const;

/** Ce à quoi on est invité, écrit après « t'invite à ». */
const EVENTS = ["jouer au ballon", "son anniversaire", "son baptême", "chanter"] as const;

/** Une réponse polie quand on veut venir, une réponse polie quand on ne peut pas, et des réponses qui ne le sont pas. */
const POLITE_YES = ["Oui, avec plaisir, merci !", "Oui, j'arrive, merci !", "Oui, merci beaucoup !"] as const;
const POLITE_NO = ["Merci, mais je ne peux pas venir.", "Merci beaucoup, mais je ne peux pas.", "Merci de l'invitation, mais je ne peux pas venir."] as const;
/** Aussi longues que les réponses polies : une réponse qui se devine à sa longueur n'apprend rien. */
const RUDE = [
  "Non, va-t'en, je ne veux pas venir !",
  "Je m'en fiche de ton invitation !",
  "Pas question, laisse-moi tranquille !",
  "Non, ta fête ne m'intéresse pas du tout !",
] as const;

/** « Awa t'invite à son anniversaire. Tu veux venir. Que réponds-tu poliment ? » : une réponse polie, deux qui ne le sont pas. */
export function makeInvitationReply(ctx: GameContext): GeneratedGame {
  // La première réponse d'un palier accepte, la suivante refuse : l'enfant apprend les deux, pas deux fois la même.
  const marker = "invitation-reponse:oui-servi";
  const accept = !ctx.used.has(marker);
  const game = choiceGame(ctx, "invitation-reponse", "répondre poliment à une invitation", () => {
    const host = pick(ctx.rng, HOSTS);
    const event = pick(ctx.rng, EVENTS);
    return {
      prompt: `${host} t'invite à ${event}. ${accept ? "Tu veux venir." : "Tu ne peux pas venir."} Que réponds-tu poliment ?`,
      answer: pick(ctx.rng, accept ? POLITE_YES : POLITE_NO),
      wrong: shuffle(ctx.rng, RUDE).slice(0, 2),
      hints: ["Pense à ce que dirait un enfant bien élevé.", "Une réponse polie remercie.", "Une réponse qui commande ou qui se moque n'est pas polie."],
    };
  });
  ctx.used.add(marker);
  return game;
}

const DAYS_OF_INVITATION = ["samedi", "dimanche", "lundi"] as const;
/** Ce à quoi on invite, écrit après « invite … à ». */
const EVENTS_FOR_TEXT = ["son baptême", "son anniversaire", "jouer au ballon"] as const;

/** « Cheikh invite Fatou à son baptême samedi. Qui invite ? » : qui invite, qui est invité, quel jour. */
export function makeInvitationWho(ctx: GameContext): GeneratedGame {
  return choiceGame(ctx, "invitation-qui", "retrouver qui invite, qui est invité, quand", () => {
    const [host, guest, third] = shuffle(ctx.rng, HOSTS);
    const event = pick(ctx.rng, EVENTS_FOR_TEXT);
    const day = pick(ctx.rng, DAYS_OF_INVITATION);
    const text = `${host} invite ${guest} à ${event} ${day}.`;
    const ask = pick(ctx.rng, ["qui", "invité", "jour"] as const);
    if (ask === "qui") {
      return { prompt: `${text}\nQui invite ?`, answer: host, wrong: [guest, third], hints: ["Lis la phrase doucement.", "Celui qui invite est le premier nom.", "Le second nom est celui qu'on invite."] };
    }
    if (ask === "invité") {
      return { prompt: `${text}\nQui est invité ?`, answer: guest, wrong: [host, third], hints: ["Lis la phrase doucement.", "Celui qu'on invite est le second nom.", "Le premier nom est celui qui invite."] };
    }
    return {
      prompt: `${text}\nQuel jour a lieu l'invitation ?`,
      answer: day,
      wrong: DAYS_OF_INVITATION.filter((other) => other !== day),
      hints: ["Lis la phrase doucement.", "Le jour est écrit à la fin de la phrase.", `Le mot commence par la lettre ${firstLetter(day)}.`],
    };
  });
}

/** Ce qu'on dit après « Viens » : le reste de l'invitation. */
const INVITATION_ENDINGS = ["à mon anniversaire samedi", "à mon baptême samedi", "jouer au ballon avec moi", "manger chez moi demain"] as const;

/** « Cheikh invite Awa. Il lui dit « ___ à mon anniversaire samedi ! » » : « Viens », pas « Venez ». */
export function makeInvitationGap(ctx: GameContext): GeneratedGame {
  return gapGame(ctx, "invitation-trou", "inviter un ami", () => {
    const [host, guest] = shuffle(ctx.rng, HOSTS);
    const female = ["Awa", "Fatou", "Aminata"].includes(host);
    const ending = pick(ctx.rng, INVITATION_ENDINGS);
    return {
      prompt: "Complète l'invitation avec le bon mot.",
      text: `${host} invite ${guest}. ${female ? "Elle" : "Il"} lui dit « ___ ${ending} ! »`,
      answer: "Viens",
      wrong: ["Venir", "Venu"],
      hints: ["Lis l'invitation en entier.", "On parle à un seul ami, le mot est celui qu'on dit pour l'appeler.", "Le mot dit de venir."],
    };
  });
}

/** « Salut Awa ! », « Je t'invite à mon anniversaire. », « À samedi ! » : le petit mot d'invitation dans l'ordre. */
export function makeInvitationOrder(ctx: GameContext): GeneratedGame {
  return sequenceGame(ctx, "invitation-ordre", "écrire une invitation dans l'ordre", () => {
    const guest = pick(ctx.rng, HOSTS);
    const event = pick(ctx.rng, ["mon anniversaire", "mon baptême", "ma fête"] as const);
    const day = pick(ctx.rng, ["samedi", "dimanche"] as const);
    return {
      prompt: "Mets les phrases de cette invitation dans le bon ordre.",
      sequence: [`Salut ${guest} !`, `Je t'invite à ${event}.`, `À ${day} !`],
      hints: ["Une invitation commence par dire bonjour.", "Elle dit ensuite ce qu'on propose.", "Elle finit par dire quand on se voit."],
    };
  });
}
