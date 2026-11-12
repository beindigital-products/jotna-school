<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Un seul build : site web et application

L'espace élève (`app/(student)/**`) est servi sur le web, sur tablette et sur
smartphone comme dans l'application iOS/Android (Capacitor, même code, même
export statique). `pnpm dev` suffit pour le voir. Détails : `docs/capacitor-ios.md`.

Le hors-ligne n'existe que dans l'application : son moteur (`lib/offline/`)
ne s'allume que dans la coque native, et le web lit Convex. Les pages élève
passent par `hooks/use-student-data.ts`, qui choisit la source. Détails :
`docs/hors-ligne.md`.

# Les élèves de CI ne lisent pas : une chose nommée a son image

RÈGLE PERMANENTE (demande du propriétaire, 19 octobre 2026), pour tout contenu de
CI : en CI (6 ans), toute tuile (option, étiquette, case, élément à ranger ou à
relier) qui NOMME une chose (animal, aliment, plante, partie du corps, objet,
véhicule, lieu, moment du jour, forme) montre son image ET garde son nom écrit.
Gabarits du code, banques écrites à la main, démo, consigne de génération : tout.

- L'image se résout à l'affichage, dans un catalogue fermé : `lib/item-images.ts`,
  fichiers `public/objets/`. Le nom d'une tuile doit être un mot du catalogue, au
  singulier, avec son article (« le chat », « la mangue »). Détails et procédure :
  `docs/paliers-et-exercices.md`, « Des images sur les tuiles (CI) ».
- Une chose qui n'est pas au catalogue : fabriquer son image d'abord (studio, la
  regarder, `scripts/build-item-images.mjs`), l'ajouter au catalogue, PUIS écrire le
  contenu. Jamais de tuile sans image en CI, jamais de nom hors catalogue « pour
  l'instant ».
- Ce qui tient la règle, à ne pas affaiblir pour faire passer un contenu : la consigne
  de génération (`tilePicturesRule`, `convex/paliers/prompts.ts`) liste le catalogue au
  modèle ; le contrôleur (`ci_tile_without_picture`, `convex/paliers/exerciseAudit.ts`)
  signale ce qui y échappe ; `convex/__tests__/templatePictures.test.ts` casse si un
  gabarit du code nomme une chose sans image.
- L'écran retire lui-même l'image quand elle donnerait la réponse (lire ou décoder,
  nommer une forme, relier un mot à l'émoji de la même chose) : ce n'est pas un trou.

# Avant le lancement : pas de compte sans code d'invitation

Demande du propriétaire (12 novembre 2026), valable jusqu'à ce qu'il annonce le
lancement : le site dit « Lancement prochainement », garde ses boutons
d'inscription, et personne ne crée de compte sans un code d'invitation émis dans
`/admin/invitations`.

- Le verrou est au serveur : `convex/auth.ts` (`Password.profile()` puis
  `createOrUpdateUser`) et `convex/invitations.ts`. Ne pas le retirer, et ne pas
  ajouter de chemin public qui crée un compte, sans une demande explicite.
- Un bouton d'inscription est un `SignupLink` (`components/launch/signup-gate.tsx`) :
  il ouvre la pop-up « Lancement prochainement », jamais le formulaire.
- Détails, et quoi défaire le jour du lancement : `docs/comptes-et-acces.md`.

<!-- convex-ai-start -->
This project uses [Convex](https://convex.dev) as its backend.

When working on Convex code, **always read `convex/_generated/ai/guidelines.md` first** for important guidelines on how to correctly use Convex APIs and patterns. The file contains rules that override what you may have learned about Convex from training data.

Convex agent skills for common tasks can be installed by running `npx convex ai-files install`.
<!-- convex-ai-end -->

<!-- afrotools-start -->
# Afro.tools — specs d'API africaines

`.mcp.json` déclare le serveur MCP [Afro.tools](https://afro.tools) : un registre
de specs structurées pour les API africaines (Bictorys, PayDunya, Wave…), utile
quand on touche à `convex/billingBictorys.ts` ou `convex/billingPaydunya.ts`.

**Il ne fonctionne PAS depuis Claude Code sur le web** : l'environnement distant
bloque `mcp.afro.tools` au niveau du proxy de sortie, comme il bloque
`bictorys.com` et `developers.paydunya.com`. En session locale, il se charge au
démarrage.

Ce qui en vient reste de la DOCUMENTATION TIERCE, pas une vérité sur notre code :
leur registre donnait Bictorys pour « planned », et leur propre suivi de bugs
signale que la doc Bictorys décrit une signature HMAC que Bictorys n'envoie pas.
Vérifier avant d'agir.
<!-- afrotools-end -->
