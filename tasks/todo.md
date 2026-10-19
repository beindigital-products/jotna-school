# Plan d'implementation — Managua

## Phase 1 : Fondations
- [ ] 1.1 Installer les dependances (convex, zustand, shadcn/ui, framer-motion, @dnd-kit, canvas-confetti, lucide-react, resend, openai)
- [ ] 1.2 Schema Convex complet (schema.ts avec toutes les tables et validateurs types)
- [ ] 1.3 Convex Auth (email/mot de passe, config, middleware Next.js)
- [ ] 1.4 Layout global + layouts par espace (admin, student, parent, auth)
- [ ] 1.5 Zustand stores (auth store, ~~exercise session store~~ supprime, voir 3.4)
- [ ] 1.6 Tests unitaires Phase 1 (schema, auth, stores)

## Phase 2 : Espace Admin - Contenu
- [ ] 2.1 CRUD Matieres (subjects) — pages + mutations/queries
- [ ] 2.2 CRUD Thematiques (topics) — pages + mutations/queries
- [ ] 2.3 CRUD Exercices manuels — editeur avec split-view preview
- [ ] 2.4 Upload PDF + extraction IA (GPT-4 Structured Outputs, scheduler, internalAction)
- [ ] 2.5 Page detail PDF (apercu, statut, exercices generes)
- [ ] 2.6 Liste brouillons + workflow edition/publication
- [ ] 2.7 Gestion badges (CRUD)
- [ ] 2.8 Vue etudiants et progression
- [ ] 2.9 Tests unitaires Phase 2 (mutations, queries, extraction IA)
- [ ] 2.10 Tests Playwright Phase 2 (flux admin complet)

## Phase 3 : Espace Enfant - Exercices
- [ ] 3.1 Page accueil gamifiee (cartes matieres, progression, dernier badge)
- [ ] 3.2 Page matiere (liste thematiques + progression)
- [ ] 3.3 Page thematique (exercices verrouilles/debloques)
- [x] ~~3.4 ExercisePlayer (orchestrateur de session)~~ abandonne : plus monte
  depuis la PR #8 (29 avril 2026), qui l'a remplace par la session de palier
  (aujourd'hui `app/(student)/student/topics/session/page.tsx`). Supprime
  le 5 octobre 2026 avec son store. Details dans
  `docs/progression-niveau-etoiles-trophees.md`, section "Ce qui reste".
- [ ] 3.5 QcmExercise (composant QCM interactif)
- [ ] 3.6 DragDropExercise (composant glisser-deposer)
- [ ] 3.7 MatchExercise (composant relier)
- [ ] 3.8 OrderExercise (composant remettre dans l'ordre)
- [ ] 3.9 ShortAnswerExercise (composant reponse courte)
- [ ] 3.10 Systeme d'indices progressifs
- [ ] 3.11 Verification reponses cote serveur (mutation attempts.submit)
- [ ] 3.12 Page fin de thematique (score, animation, badge)
- [ ] 3.13 Animations et feedback (confettis, shake, transitions)
- [ ] 3.14 Tests unitaires Phase 3 (verification reponses, progression, composants)
- [ ] 3.15 Tests Playwright Phase 3 (session exercice complete, indices, fin thematique)

## Phase 4 : Gamification
- [ ] 4.1 Logique attribution badges (internalMutation checkAndAward)
- [ ] 4.2 Page collection badges (obtenus colores, verrouilles grises)
- [ ] 4.3 Animation unlock badge
- [ ] 4.4 Page profil enfant (avatar, stats globales)
- [ ] 4.5 Tests unitaires Phase 4 (logique badges)
- [ ] 4.6 Tests Playwright Phase 4 (deblocage badge, collection)

## Phase 5 : Espace Parent + Rapports
- [ ] 5.1 Dashboard parent (vue d'ensemble enfants)
- [ ] 5.2 Ajouter/editer profil enfant
- [ ] 5.3 Progression detaillee par enfant
- [ ] 5.4 Rapport par thematique (score, forces, faiblesses, erreurs)
- [ ] 5.5 Generation rapport (internalMutation reports.generate)
- [ ] 5.6 Envoi email Resend (internalAction, template React Email)
- [ ] 5.7 Page settings parent (gestion compte, preferences email)
- [ ] 5.8 Tests unitaires Phase 5 (rapports, envoi email)
- [ ] 5.9 Tests Playwright Phase 5 (flux parent complet, consultation rapports)

## Phase 6 : Polish et Integration
- [ ] 6.1 Pages loading.tsx, error.tsx, not-found.tsx sur routes critiques
- [ ] 6.2 Responsive design (tablette + desktop)
- [ ] 6.3 Securite : controle d'acces par role sur chaque query/mutation
- [ ] 6.4 Tests E2E Playwright (flux complet : admin cree exercice -> enfant le fait -> parent recoit rapport)
- [ ] 6.5 Build final + fix erreurs
