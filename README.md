# Jotna School

Jotna School relie l'école, les professeurs, les parents et les élèves.

- **Le site web** sert l'école (rôle `admin`), les professeurs et les parents :
  leurs tableaux de bord, plus la vitrine destinée aux écoles.
- **L'application iOS et Android** (Capacitor) porte en plus l'espace élève :
  le Monde de Pio et le module Arabe & Coran. Tous les rôles peuvent s'y
  connecter.

Les deux sont construits à partir du même code, selon deux cibles de build
(voir plus bas).

## La pile

- Next.js 16 en export statique (`output: "export"`), React, Tailwind CSS 4.
- Convex pour la base de données, les fonctions serveur et l'authentification
  (`convex/`).
- Capacitor 8 pour les applications iOS (`ios/`) et Android (`android/`).
- Vitest pour les tests unitaires, Playwright pour les parcours (`e2e/`).

## Démarrer

```bash
pnpm install
npx convex dev
```

`npx convex dev` relie le dossier à un déploiement Convex de développement,
écrit `.env.local` (`CONVEX_DEPLOYMENT`, `NEXT_PUBLIC_CONVEX_URL`) et pousse
les fonctions à chaque changement. Dans un autre terminal :

```bash
pnpm dev
```

## Deux cibles de build

| Commande | Cible | Espace élève |
| --- | --- | --- |
| `pnpm dev`, `pnpm build` | site web | absent : un élève connecté est envoyé vers l'application |
| `pnpm dev:app`, `pnpm build:app` | application | présent |
| `pnpm ios:sync`, `pnpm android:sync`, `pnpm android:run` | application, puis Capacitor | présent |

Les fichiers de route de l'espace élève portent l'extension `.app.tsx` et ne
sont compilés qu'avec `JOTNA_TARGET=app`. Détails dans `docs/capacitor-ios.md`.

## Vérifier

```bash
pnpm lint
pnpm tsc --noEmit
pnpm test --run
pnpm test:e2e
```

La CI (`.github/workflows/ci.yml`) lance le lint, le typage, les tests
unitaires et les deux builds. Les tests Playwright ne tournent qu'en local.

## Documentation

| Fichier | Sujet |
| --- | --- |
| `docs/comptes-et-acces.md` | Les comptes créés par l'école, les rôles, les accès |
| `docs/encaissement-mise-en-service.md` | Les paiements et la mise en service de l'encaissement |
| `docs/paliers-et-exercices.md` | Les paliers et la génération des exercices |
| `docs/progression-niveau-etoiles-trophees.md` | Le niveau, les étoiles, la série, les missions et les trophées |
| `docs/monde-de-pio.md` | L'espace élève, pensé comme un jeu |
| `docs/module-arabe-coran.md` | Le module Arabe & Coran |
| `docs/pio-animations.md` | Les animations vidéo de Pio |
| `docs/capacitor-ios.md` | Les applications iOS et Android, les deux cibles de build |

## Pour les agents

`AGENTS.md` et `CLAUDE.md` donnent les règles propres au dépôt. Un graphe de
connaissance du code et des docs vit dans `graphify-out/` : `graphify query
"<question>"` l'interroge, et `graphify update .` le remet à jour après un
changement de code.
