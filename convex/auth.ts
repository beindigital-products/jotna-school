import { Password } from "@convex-dev/auth/providers/Password";
import { convexAuth } from "@convex-dev/auth/server";
import { ResendOTPPasswordReset } from "./ResendOTPPasswordReset";
import { decideProvisionedRole } from "./roleRules";
import { decideSelfSignupRole } from "./openAccessRules";

export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [
    Password({
      profile(params) {
        // INSCRIPTION LIBRE POUR LES ADULTES — écoles, professeurs, parents.
        // Les règles du modèle vivent dans `convex/openAccessRules.ts`.
        //
        // `profile()` n'est appelé que par les flux du fournisseur `Password`
        // lui-même — vérifié dans
        // `node_modules/@convex-dev/auth/dist/providers/Password.js`, qui
        // fait `config.profile?.(params, ctx)` avant d'aiguiller sur `flow`.
        // Les comptes créés côté serveur (`createAccount` : import d'école,
        // comptes élèves créés par un parent ou un professeur, personnel
        // créé par un admin) ne passent jamais ici. Le contrôle du rôle d'un
        // formulaire public se fait donc ICI, et seulement pour `signUp`.
        //
        // LE RÔLE EST FILTRÉ, PAS RECOPIÉ. Le client poste le rôle qu'il veut ;
        // seuls `parent`, `professeur` et `directeur` passent. Un compte
        // `student` ne naît jamais d'un formulaire public : un enfant n'a pas
        // d'adresse, et son compte appartient à l'adulte qui l'a créé. Un
        // compte `admin` non plus, jamais.
        //
        // UN PROFESSEUR OU UN DIRECTEUR AUTO-INSCRIT N'A ACCÈS QU'À CE QU'IL
        // CRÉE. `callerIsStaff` le reconnaît comme personnel, ce qui ouvre la
        // lecture du curriculum (déjà ouvert à tout élève) ; tout ce qui touche
        // un élève passe par une garde de LIEN (`callerMayReadStudent`,
        // `classrooms.ts`) : sa classe, son école.
        let role = (params.role as string) ?? "student";
        if (params.flow === "signUp") {
          const decided = decideSelfSignupRole(params.role);
          if (decided === null) {
            throw new Error(
              "Choisissez un type de compte : école, professeur ou parent. " +
                "Les comptes élèves sont créés par un parent ou un professeur.",
            );
          }
          role = decided;
        }

        const rawEmail = (params.email as string) ?? "";
        return {
          email: rawEmail.trim().toLowerCase(),
          name: ((params.name as string) ?? "").trim(),
          // Pass role through so createOrUpdateUser can read it.
          // This field is NOT stored on the users table -- we strip it
          // out in createOrUpdateUser and store it on the profiles table.
          role,
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
