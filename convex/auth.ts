import { Password } from "@convex-dev/auth/providers/Password";
import { convexAuth } from "@convex-dev/auth/server";
import { ConvexError } from "convex/values";
import type { MutationCtx } from "./_generated/server";
import { ResendOTPPasswordReset } from "./ResendOTPPasswordReset";
import { redeemInvitation } from "./invitations";
import {
  INVITATION_REFUSALS,
  normalizeInvitationCode,
  SELF_SIGNUP_INVITATION_FIELD,
  selfSignupInvitation,
} from "./invitationRules";
import { decideProvisionedRole } from "./roleRules";
import { decideSelfSignupRole } from "./openAccessRules";

export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [
    Password({
      profile(params) {
        // INSCRIPTION DES ADULTES — écoles, professeurs, parents — SUR
        // INVITATION TANT QUE LE LANCEMENT N'EST PAS FAIT. Les règles des
        // rôles vivent dans `convex/openAccessRules.ts`, celles des codes
        // d'invitation dans `convex/invitationRules.ts`.
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
        //
        // PAS DE COMPTE SANS CODE D'INVITATION, ET LE REFUS COMMENCE ICI. Une
        // inscription sans code est celle du visiteur ordinaire avant le
        // lancement : on la refuse tout de suite, par une `ConvexError` dont
        // l'écran affiche la phrase. CE CONTRÔLE-CI NE LIT PAS LA BASE —
        // `profile()` est synchrone, le fournisseur ne l'attend pas. Savoir
        // si le code EXISTE et s'il lui reste une place se décide dans
        // `createOrUpdateUser`, plus bas, dans la transaction qui crée le
        // compte. Le code voyage jusque-là dans le profil, sous
        // `SELF_SIGNUP_INVITATION_FIELD` : ce champ est posé pour TOUTE
        // inscription publique et pour elle seule, c'est à lui que
        // `createOrUpdateUser` la reconnaît.
        //
        // Le paramètre s'appelle `invitationCode`, jamais `code` : `code` est
        // déjà le nom des codes de vérification de Convex Auth (`signInImpl`
        // sans fournisseur, flux `email-verification` de `Password`), et un
        // même nom pour deux choses finirait par être lu pour l'autre.
        let role = (params.role as string) ?? "student";
        let invitation: Record<string, string> = {};
        if (params.flow === "signUp") {
          const invitationCode = normalizeInvitationCode(params.invitationCode);
          if (invitationCode === "") {
            throw new ConvexError(INVITATION_REFUSALS.missing);
          }
          invitation = { [SELF_SIGNUP_INVITATION_FIELD]: invitationCode };

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
          // Même traitement que `role` : lu par `createOrUpdateUser`, jamais
          // écrit sur `users`.
          ...invitation,
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

      // --- Compte neuf : DEUX ORIGINES, et le profil dit laquelle ---
      const fields = profile as Record<string, unknown>;
      const rawRole = fields.role as string | undefined;

      // 1. UN PROVISIONNEMENT. L'appelant est une fonction du serveur, qui
      //    passe par `createAccount` et a fait son contrôle AVANT d'appeler :
      //
      //   - `studentImportRun`                    — garde de LIEN : le
      //                                             personnel n'importe que
      //                                             dans SON école
      //   - `studentAccounts`                     — un parent, un professeur
      //                                             ou un directeur connecté
      //                                             crée un élève
      //   - `parentLink.signUpWithCode`           — un billet d'école non
      //                                             consommé, non expiré,
      //                                             émis pour cet enfant
      //   - `staffAccounts.provisionStaffAccount` — `callerIsAdmin`
      //
      // 2. UNE INSCRIPTION PUBLIQUE (`flow: "signUp"`). `Password.profile()`
      //    a filtré le rôle et joint le code d'invitation : c'est la présence
      //    de ce champ qui la désigne (`selfSignupInvitation`). Un client ne
      //    peut ni le retirer ni atteindre `createAccount` autrement — le
      //    profil est bâti par `profile()`, côté serveur, et `auth:store` est
      //    une mutation interne.
      //
      // `admin` EST REFUSÉ DANS LES DEUX CAS. Aucun chemin applicatif ne le
      // pose, pas même gardé par un admin.
      //
      // ON REFUSE PLUTÔT QUE DE RETOMBER EN SILENCE. Un repli `: "student"`
      // transformerait un provisionnement mal formé en compte ÉLÈVE, sans un
      // mot : l'école ne le découvrirait qu'à la première connexion ratée.
      //
      // Les décisions vivent dans `convex/roleRules.ts` et
      // `convex/invitationRules.ts`, pures et testées : ce handler-ci n'est
      // atteignable par aucun test unitaire du dépôt.
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

      // AVANT LE LANCEMENT, UNE INSCRIPTION PUBLIQUE CONSOMME UN CODE
      // D'INVITATION, OU N'A PAS LIEU. `redeemInvitation` lève si le code est
      // inconnu, désactivé ou épuisé, et Convex annule alors toute la
      // mutation, les deux insertions ci-dessus comprises : le compte et la
      // place comptée naissent ensemble ou pas du tout.
      //
      // POUR ROUVRIR L'INSCRIPTION À TOUS, le jour du lancement : retirer ce
      // bloc et le contrôle du code dans `profile()`, plus haut. Rien d'autre
      // ne ferme la porte côté serveur (`docs/comptes-et-acces.md`).
      const invitationCode = selfSignupInvitation(fields);
      if (invitationCode !== null) {
        // Le rappel reçoit un contexte au modèle de données générique ; la
        // mutation qui l'exécute (`auth:store`) est bien une mutation de ce
        // déploiement.
        await redeemInvitation(ctx as unknown as MutationCtx, {
          code: invitationCode,
          userId,
        });
      }

      return userId;
    },
  },
});
