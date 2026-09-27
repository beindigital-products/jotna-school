import { Password } from "@convex-dev/auth/providers/Password";
import { convexAuth } from "@convex-dev/auth/server";
import { ResendOTPPasswordReset } from "./ResendOTPPasswordReset";
import { decideProvisionedRole } from "./roleRules";

export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [
    Password({
      profile(params) {
        // L'INSCRIPTION LIBRE N'EXISTE PLUS — Jotna est vendu aux écoles.
        //
        // Un compte se pose désormais par PROVISIONNEMENT, jamais par
        // formulaire ouvert : l'école importe ses élèves
        // (`studentImportRun`), un administrateur crée le personnel
        // (`schools.provisionStaffAccount`), et un parent n'entre qu'avec un
        // code émis par l'école pour SON enfant
        // (`parentLink.signUpWithCode`). Ces trois chemins appellent
        // `createAccount` côté serveur, après leur propre contrôle.
        //
        // POURQUOI LE REFUS EST ICI ET PAS DANS `createOrUpdateUser`. Ce
        // callback-là est commun : `createAccount` le traverse aussi, donc y
        // refuser toute création fermerait les trois chemins légitimes en
        // même temps que celui-ci. `profile()` en revanche n'est appelé que
        // par les flux du fournisseur `Password` lui-même — vérifié dans
        // `node_modules/@convex-dev/auth/dist/providers/Password.js`, qui
        // fait `config.profile?.(params, ctx)` avant d'aiguiller sur `flow`.
        // Le provisionnement passe `profile` directement à `createAccount`
        // et ne vient donc jamais ici.
        //
        // ON LIT `params.flow` PLUTÔT QUE DE TOUT REFUSER, parce que la même
        // fonction sert `signIn`, `reset` et `reset-verification` : lever
        // sans condition verrouillerait dehors les comptes existants, y
        // compris leur récupération de mot de passe.
        if (params.flow === "signUp") {
          throw new Error(
            "La création de compte est réservée aux écoles. " +
              "Demandez vos identifiants à votre établissement.",
          );
        }

        const rawEmail = (params.email as string) ?? "";
        return {
          email: rawEmail.trim().toLowerCase(),
          name: (params.name as string) ?? "",
          // Pass role through so createOrUpdateUser can read it.
          // This field is NOT stored on the users table -- we strip it
          // out in createOrUpdateUser and store it on the profiles table.
          role: (params.role as string) ?? "student",
        };
      },
      validatePasswordRequirements(password: string) {
        if (password.length < 6) {
          throw new Error("Le mot de passe doit contenir au moins 6 caractères.");
        }
      },
      reset: ResendOTPPasswordReset,
    }),
  ],
  callbacks: {
    async createOrUpdateUser(ctx, { existingUserId, profile }) {
      // --- Existing user (sign-in): just return the id ---
      if (existingUserId !== null) {
        return existingUserId;
      }

      // --- Compte neuf : on n'arrive ici que par PROVISIONNEMENT ---
      const rawRole = (profile as Record<string, unknown>).role as
        | string
        | undefined;

      // CE CHEMIN N'EST PLUS CELUI D'UNE INSCRIPTION. `Password.profile()`
      // refuse `flow: "signUp"` plus haut : aucun formulaire public ne crée
      // de compte. Les seuls appelants qui atteignent cette branche passent
      // par `createAccount` côté serveur, et chacun a déjà fait son contrôle
      // AVANT d'appeler :
      //
      //   - `studentImportRun`              — garde de LIEN : le personnel
      //                                       n'importe que dans SON école
      //   - `parentLink.signUpWithCode`     — un code non consommé, non
      //                                       expiré, émis pour cet enfant
      //   - `schools.provisionStaffAccount` — `callerIsAdmin`
      //
      // L'AUTORISATION EST DONC EN AMONT, ET C'EST CE QUI PERMET D'ÉLARGIR
      // LA LISTE DES RÔLES. Tant que l'inscription était ouverte, refuser ici
      // `professeur` et `directeur` était la dernière barrière — n'importe
      // qui postait le rôle qu'il voulait, et `callerIsStaff` reconnaissait
      // le résultat comme « membre du personnel » partout dans le dépôt.
      // Cette barrière-là a disparu avec le formulaire qui la rendait
      // nécessaire ; la garde vit maintenant à l'appel, pas sur une chaîne de
      // caractères arrivée du réseau.
      //
      // `admin` RESTE REFUSÉ, et c'est le seul. Aucun chemin applicatif ne le
      // pose, pas même gardé par un admin.
      //
      // ON REFUSE PLUTÔT QUE DE RETOMBER EN SILENCE. Un repli `: "student"`
      // transformerait un provisionnement mal formé en compte ÉLÈVE, sans un
      // mot : l'école ne le découvrirait qu'à la première connexion ratée.
      //
      // La décision vit dans `convex/roleRules.ts`, pure et testée : ce
      // handler-ci n'est atteignable par aucun test du dépôt.
      const role = decideProvisionedRole(rawRole);

      const name = (profile.name as string) ?? "";
      const email = (profile.email as string) ?? undefined;

      const userId = await ctx.db.insert("users", {
        name,
        email,
      });

      await ctx.db.insert("profiles", {
        userId: userId,
        role,
        name,
      });

      return userId;
    },
  },
});
