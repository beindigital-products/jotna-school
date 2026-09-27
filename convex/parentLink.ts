import { ConvexError, v } from "convex/values";
import {
  action,
  internalMutation,
  internalQuery,
  mutation,
  query,
} from "./_generated/server";
import { internal } from "./_generated/api";
import { createAccount, getAuthUserId } from "@convex-dev/auth/server";
import { decideLinkChild } from "./linkRules";
import { normalizeCode } from "./importCodes";

// ---------------------------------------------------------------------------
// RATTACHEMENT D'UN PARENT PAR CODE — spec §6.3.
//
// POURQUOI PAS `linkRequests`. Le mécanisme existant part du PARENT, cherche
// l'élève par son adresse de courriel, et lui envoie un jeton de 48 h. Rien de
// cela ne marche ici : un élève créé par une école n'a pas d'adresse — son
// identifiant est un code de connexion — et le SENS est inversé. C'est l'école
// qui pré-autorise, en imprimant un code sur le billet remis à la famille ; le
// parent ne demande pas, il consomme.
//
// CE QU'ON N'A PAS EU À ÉCRIRE. La consommation insère un `studentGuardians`
// de relation `parent` — le lien que tout l'espace parent lit déjà. Tableau de
// bord, bulletins, sélecteur d'enfant : rien n'a besoin d'être touché.
//
// L'AUTORISATION EST LE CODE LUI-MÊME, et c'est ce qui distingue ce chemin de
// `profiles.linkChild`, resté interne au plan 1/3 faute de preuve de droit.
// Ici la preuve existe : un secret de 148 millions de valeurs, remis en main
// propre par l'école, à usage unique et daté. `decideLinkChild` reste consulté
// par-dessus — elle dit QUI peut déclarer QUELLE relation, question que le code
// ne tranche pas.
// ---------------------------------------------------------------------------

/** Liens lus pour un tuteur — au-delà, la question du doublon change d'échelle. */
const GUARDIAN_LINKS_LIMIT = 200;

/**
 * Regarde un code sans le consommer, pour que l'écran confirme AVANT d'agir.
 *
 * Un parent qui tape un code veut voir le prénom de son enfant s'afficher avant
 * de valider : c'est ce qui rattrape une faute de frappe qui tomberait par
 * malchance sur un code valide d'un autre élève. Le rattachement est
 * difficilement réversible — rien dans le dépôt ne défait un `studentGuardians`
 * — donc la confirmation n'est pas du confort.
 *
 * ELLE NE REND QUE LE PRÉNOM, jamais l'identifiant de l'élève ni sa classe : un
 * code juste suffit à lire ce nom, et il n'y a pas de raison d'en dire plus à
 * qui n'a pas encore prouvé qu'il est le bon parent. Une requête ne lève
 * jamais : `null` couvre l'inconnu comme le périmé.
 */
export const previewCode = query({
  args: { code: v.string() },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) return null;

    const normalized = normalizeCode(args.code);
    if (normalized === "") return null;

    // `.first()` ET NON `.unique()` : une REQUÊTE ne lève jamais (convention du
    // dépôt), et `.unique()` lève sur un doublon. L'unicité est vérifiée à
    // l'émission ; si elle était malgré tout violée, mieux vaut un écran qui
    // montre un enfant qu'un écran qui casse. La mutation, elle, garde
    // `.unique()` — c'est là que l'invariant doit se faire entendre.
    const link = await ctx.db
      .query("parentLinkCodes")
      .withIndex("by_code", (q) => q.eq("code", normalized))
      .first();
    if (!link) return null;
    if (link.redeemedBy) return { status: "redeemed" as const, name: null };
    if (link.expiresAt <= Date.now()) {
      return { status: "expired" as const, name: null };
    }

    const student = await ctx.db.get(link.studentId);
    if (!student) return null;

    return { status: "ready" as const, name: student.name };
  },
});

/**
 * Consomme un code et crée le lien — usage unique, dans UNE transaction.
 *
 * `redeemedBy` et `redeemedAt` sont posés dans la même transaction que
 * l'insertion du lien, jamais après : les écrire ensuite ouvrirait la fenêtre
 * où deux parents consomment le même code, et Convex sérialise les
 * transactions précisément pour qu'on n'ait pas à y penser.
 *
 * LES REFUS SE DISTINGUENT, à dessein. « Code inconnu », « déjà utilisé » et
 * « expiré » appellent trois gestes différents — retaper, demander à l'autre
 * parent, en redemander un à l'école — et les confondre en un « code invalide »
 * laisserait la famille sans savoir quoi faire. Rien n'est divulgué pour
 * autant : ces réponses ne valent que pour qui tient déjà un code, et l'espace
 * de codes se compte en centaines de millions.
 */
export const redeemCode = mutation({
  args: { code: v.string() },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new ConvexError("Non authentifié");

    const guardian = await ctx.db
      .query("profiles")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .unique();
    if (!guardian) throw new ConvexError("Profil introuvable");

    const normalized = normalizeCode(args.code);
    if (normalized === "") {
      throw new ConvexError("Saisissez le code inscrit sur le billet.");
    }

    const link = await ctx.db
      .query("parentLinkCodes")
      .withIndex("by_code", (q) => q.eq("code", normalized))
      .unique();
    if (!link) {
      throw new ConvexError(
        "Ce code n'existe pas. Vérifiez les caractères du billet — il ne " +
          "contient ni O ni I ni zéro, que des lettres et des chiffres nets.",
      );
    }

    if (link.redeemedBy) {
      throw new ConvexError(
        link.redeemedBy === guardian._id
          ? "Vous avez déjà utilisé ce code : cet enfant figure dans votre espace."
          : "Ce code a déjà été utilisé par un autre adulte de la famille. " +
            "Demandez-en un nouveau à l'école si vous devez y accéder aussi.",
      );
    }

    const now = Date.now();
    if (link.expiresAt <= now) {
      throw new ConvexError(
        "Ce code a expiré. L'école peut en imprimer un nouveau.",
      );
    }

    const student = await ctx.db.get(link.studentId);

    // La règle de rattachement reste celle du dépôt : elle dit qui peut
    // déclarer quelle relation, question que la possession du code ne tranche
    // pas. Un compte élève qui taperait le code de son voisin est refusé ici.
    const decision = decideLinkChild({
      guardianRole: guardian.role,
      relation: "parent",
      targetRole: student?.role ?? null,
    });
    if (!decision.ok) {
      throw new ConvexError(
        decision.reason === "target_not_student"
          ? "Ce code ne désigne plus un élève."
          : "Seul un compte parent peut rattacher un enfant.",
      );
    }

    const existing = await ctx.db
      .query("studentGuardians")
      .withIndex("by_guardianId", (q) => q.eq("guardianId", guardian._id))
      .take(GUARDIAN_LINKS_LIMIT);
    if (existing.some((l) => l.studentId === link.studentId)) {
      // Le code est bon et le lien existe déjà : on le consomme quand même,
      // sinon il resterait utilisable par un tiers alors qu'il a servi.
      await ctx.db.patch(link._id, {
        redeemedBy: guardian._id,
        redeemedAt: now,
      });
      throw new ConvexError(
        "Cet enfant figure déjà dans votre espace — rien n'a été modifié.",
      );
    }

    await ctx.db.insert("studentGuardians", {
      studentId: link.studentId,
      guardianId: guardian._id,
      relation: "parent",
    });

    await ctx.db.patch(link._id, {
      redeemedBy: guardian._id,
      redeemedAt: now,
    });

    return { studentName: student?.name ?? "" };
  },
});

// ---------------------------------------------------------------------------
// ENTRÉE D'UN PARENT QUI N'A PAS ENCORE DE COMPTE — le seul chemin restant.
//
// `redeemCode` plus haut suppose une session : elle rattache un enfant DE PLUS
// à un parent déjà entré. Elle ne peut donc pas servir la première fois, et
// depuis que `Password.profile()` refuse `flow: "signUp"`, il n'existe plus
// aucun formulaire qui crée un compte parent. Sans ce qui suit, une famille
// tenant un billet n'aurait littéralement aucune porte.
//
// L'AUTORISATION EST LE CODE, ET RIEN D'AUTRE. Cette action est publique et
// non authentifiée — elle ne peut pas l'être autrement, son appelant n'a pas
// encore de compte. C'est le même secret que `redeemCode` exige déjà : usage
// unique, daté, émis par l'école pour un élève nommé.
//
// CE QUE CELA COÛTE, ET POURQUOI ON L'ACCEPTE. Un code deviné donne ici un
// compte, là où il ne donnait qu'un rattachement. L'écart est moindre qu'il
// n'y paraît : avant la fermeture de l'inscription, obtenir le compte d'abord
// prenait trente secondes et le rattachement suivait. L'espace de codes se
// compte en centaines de millions, chacun meurt à la première consommation et
// expire seul. Il n'y a EN REVANCHE aucune limitation de débit sur ce
// point d'entrée — c'est la faiblesse connue, et elle se traite au niveau du
// déploiement, pas ici.
//
// LES MESSAGES DE REFUS RESTENT DISTINCTS, comme dans `redeemCode` : retaper,
// demander à l'autre parent, ou en redemander un à l'école sont trois gestes
// différents, et une famille bloquée devant « code invalide » appelle l'école
// pour rien.
// ---------------------------------------------------------------------------

/**
 * Le code est-il consommable, et par qui ? Lecture seule, avant toute
 * écriture — la vérification qui compte est refaite dans la mutation.
 */
export const claimableCode = internalQuery({
  args: { code: v.string() },
  handler: async (
    ctx,
    args,
  ): Promise<
    | { ok: true; studentName: string }
    | { ok: false; reason: "unknown" | "redeemed" | "expired" | "not_student" }
  > => {
    const link = await ctx.db
      .query("parentLinkCodes")
      .withIndex("by_code", (q) => q.eq("code", args.code))
      .first();
    if (!link) return { ok: false, reason: "unknown" };
    if (link.redeemedBy) return { ok: false, reason: "redeemed" };
    if (link.expiresAt <= Date.now()) return { ok: false, reason: "expired" };

    const student = await ctx.db.get(link.studentId);
    if (!student || student.role !== "student") {
      return { ok: false, reason: "not_student" };
    }
    return { ok: true, studentName: student.name };
  },
});

/** La phrase que lit la famille, pour chaque motif de refus. */
const CLAIM_REFUSALS: Record<string, string> = {
  unknown:
    "Ce code n'existe pas. Vérifiez les caractères du billet — il ne " +
    "contient ni O ni I ni zéro, que des lettres et des chiffres nets.",
  redeemed:
    "Ce code a déjà été utilisé. Si c'est l'autre parent qui s'en est " +
    "servi, demandez-lui de vous ajouter, ou demandez un nouveau code à " +
    "l'école.",
  expired: "Ce code a expiré. L'école peut en imprimer un nouveau.",
  not_student: "Ce code ne désigne plus un élève.",
};

/**
 * Consomme le code et pose le lien, pour un parent qui vient d'être créé.
 *
 * ELLE REVÉRIFIE TOUT. Entre la lecture faite par l'action et cette écriture,
 * un autre adulte a pu consommer le même code : sans ce second contrôle, deux
 * parents entreraient sur un billet à usage unique. Convex sérialise les
 * transactions, donc le perdant lève ici plutôt que d'écrire.
 */
export const attachGuardianByCode = internalMutation({
  args: { code: v.string(), guardianUserId: v.id("users") },
  handler: async (ctx, args) => {
    const guardian = await ctx.db
      .query("profiles")
      .withIndex("by_userId", (q) => q.eq("userId", args.guardianUserId))
      .unique();
    if (!guardian) throw new ConvexError("Profil introuvable");

    const link = await ctx.db
      .query("parentLinkCodes")
      .withIndex("by_code", (q) => q.eq("code", args.code))
      .unique();
    if (!link) throw new ConvexError(CLAIM_REFUSALS.unknown);
    if (link.redeemedBy) throw new ConvexError(CLAIM_REFUSALS.redeemed);

    const now = Date.now();
    if (link.expiresAt <= now) throw new ConvexError(CLAIM_REFUSALS.expired);

    const student = await ctx.db.get(link.studentId);
    const decision = decideLinkChild({
      guardianRole: guardian.role,
      relation: "parent",
      targetRole: student?.role ?? null,
    });
    if (!decision.ok) throw new ConvexError(CLAIM_REFUSALS.not_student);

    await ctx.db.insert("studentGuardians", {
      studentId: link.studentId,
      guardianId: guardian._id,
      relation: "parent",
    });
    await ctx.db.patch(link._id, {
      redeemedBy: guardian._id,
      redeemedAt: now,
    });

    return { studentName: student?.name ?? "" };
  },
});

/**
 * Crée le compte parent, puis consomme le code — dans cet ordre.
 *
 * L'ORDRE EST IMPOSÉ, PAS CHOISI. `createAccount` n'existe que dans une
 * `action` (même contrainte que `profiles.createChildAccount`), et une action
 * ne porte pas de transaction : les deux écritures ne peuvent pas être
 * atomiques. On crée donc le compte d'abord, et la mutation qui suit
 * revérifie le code.
 *
 * SI LA SECONDE ÉTAPE ÉCHOUE, le compte parent existe sans enfant rattaché.
 * C'est une dégradation lisible, et non une impasse : la personne se connecte
 * et saisit un autre code depuis `/parent/children/code`, écran qui existe
 * déjà. L'inverse — consommer le code avant de savoir si le compte peut être
 * créé — brûlerait le billet d'une famille sur une adresse déjà prise.
 */
export const signUpWithCode = action({
  args: {
    code: v.string(),
    name: v.string(),
    email: v.string(),
    password: v.string(),
  },
  handler: async (ctx, args): Promise<{ studentName: string }> => {
    const normalized = normalizeCode(args.code);
    if (normalized === "") {
      throw new ConvexError("Saisissez le code inscrit sur le billet.");
    }
    if (args.name.trim() === "") {
      throw new ConvexError("Le nom est obligatoire.");
    }
    if (args.password.length < 6) {
      throw new ConvexError(
        "Le mot de passe doit contenir au moins 6 caractères.",
      );
    }

    const email = args.email.trim().toLowerCase();
    if (email === "") {
      throw new ConvexError("L'adresse de courriel est obligatoire.");
    }

    // On refuse sur le code AVANT de créer quoi que ce soit : inutile de
    // fabriquer un compte pour découvrir ensuite que le billet est périmé.
    const claim = await ctx.runQuery(internal.parentLink.claimableCode, {
      code: normalized,
    });
    if (!claim.ok) {
      throw new ConvexError(CLAIM_REFUSALS[claim.reason]);
    }

    let user;
    try {
      ({ user } = await createAccount(ctx, {
        provider: "password",
        account: { id: email, secret: args.password },
        profile: {
          email,
          name: args.name.trim(),
          role: "parent",
        } as unknown as Parameters<typeof createAccount>[1]["profile"],
      }));
    } catch {
      // `createAccount` lève aussi pour d'autres raisons, mais l'adresse déjà
      // prise est la seule que la personne devant l'écran peut corriger, et
      // de loin la plus fréquente.
      throw new ConvexError(
        "Cette adresse est déjà utilisée. Connectez-vous, puis saisissez " +
          "le code depuis votre espace.",
      );
    }

    return await ctx.runMutation(internal.parentLink.attachGuardianByCode, {
      code: normalized,
      guardianUserId: user._id,
    });
  },
});
