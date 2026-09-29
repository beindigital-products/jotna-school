# Graph Report - bistory-payment-test-faec90  (2026-09-29)

## Corpus Check
- 347 files · ~328,714 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 4 file(s) not represented in the graph (top: (none) 3, .css 1)

## Summary
- 2412 nodes · 6034 edges · 111 communities (100 shown, 11 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 196 edges (avg confidence: 0.85)
- Token cost: 308,462 input · 0 output

## Community Hubs (Navigation)
- Pages admin et API Convex
- Facturation et paiements
- Pio et matières élève
- Leçon d'arabe et voix
- Lecteur d'exercices
- Parcours arabe et placement
- Jugement de prononciation
- Carte du chemin du Coran
- E-mails transactionnels
- Écoles et abonnements
- Jeux de lettres arabes
- Règles des paliers
- Import des élèves
- Génération des exercices
- Fiche école admin
- Coran et mémorisation
- Parcours de l'élève
- Pré-génération et garde-fous CLI
- Missions du jour
- Accès et tentatives
- Explication des erreurs IA
- Réparation des maths
- Alphabet arabe
- Deux cibles de build
- Barre latérale et UI
- Notation des paliers
- Outillage du projet
- Stores client
- Exercices et PDF
- Suivi élève côté staff
- Layouts des rôles
- Tracé des lettres
- Dépenses IA partitionnées
- Dépendances et pile
- Aperçus d'exercices
- Liens parent-enfant
- Tableaux de bord parent et prof
- Décors du monde
- Config shadcn
- Sons de l'élève
- Séance arabe
- Migrations et graines
- Tests e2e du palier
- Caméra de la carte
- Doc Monde de Pio
- Doc animations de Pio
- Config TypeScript
- Profil de l'élève
- Boutons et navbar
- Session et déconnexion
- Série de jours
- Échéances de paiement
- Demandes de liaison
- Tarification
- Géométrie des sentiers
- Passerelle IA
- Rapports
- Tests Convex
- Icônes iOS générées
- Blasons des badges
- Prompts des paliers
- Marche de Pio
- Catalogue des badges
- Notes de conception
- Config TS Convex
- Racine de l'app
- Layout élève et accès
- Trophées de l'élève
- Boîtes de dialogue
- Doc progression
- Dépendances de dev
- Carte de jeu
- Réparation glisser-déposer
- Éditeur d'exercices admin
- Vitrine : fonctionnement
- Doc application iOS
- Vitrine : badges
- Vérification des calculs IA
- Registre des modèles IA
- Cache voix et quotas
- Détection de l'app native
- Budget IA
- Rôles et authentification
- Facturation côté admin
- Vitrine : types d'exercices
- Vitrine : FAQ et publics
- Abonnement côté admin
- Marque et layout auth
- Vitrine : héros
- Matières
- Doc paliers et exercices
- Doc comptes et accès
- Vitrine : appel à l'action
- Brouillons admin
- Détail PDF admin
- Détail PDF prof
- Liste PDF admin
- Extraction de PDF
- Tests des rapports
- Serveur d'export local
- Liste PDF prof
- Réinitialisation du mot de passe
- Sentier d'une matière
- Pied de page
- Page de connexion
- Config PostCSS
- Script icônes iOS

## God Nodes (most connected - your core abstractions)
1. `convex` - 116 edges
2. `lucide-react` - 100 edges
3. `react` - 99 edges
4. `refusalMessage()` - 65 edges
5. `next` - 64 edges
6. `cn()` - 55 edges
7. `callerIsAdmin()` - 47 edges
8. `vitest` - 40 edges
9. `framer-motion` - 38 edges
10. `@convex-dev/auth` - 34 edges

## Surprising Connections (you probably didn't know these)
- `Arabic glyph centered on its ink, not on the baseline` --references--> `amiri`  [INFERRED]
  docs/module-arabe-coran.md → app/layout.tsx
- `PioState` --implements--> `Nine everyday clips: idle, hello, cheer, sad, amazed, encourage, think, sleep, walk`  [INFERRED]
  components/student/pio.tsx → docs/pio-animations.md
- `Extending the game (subject, palier count, mission type, trail shape, Pio pose, Pio line)` --references--> `posterFor()`  [AMBIGUOUS]
  docs/monde-de-pio.md → components/student/pio.tsx
- `topicsForStudent()` --implements--> `Students only see topics of their level (profiles.class)`  [INFERRED]
  convex/students.ts → docs/paliers-et-exercices.md
- `scoreTrace()` --implements--> `What the module does not do (tajwid, binding trace grade, memorization certificate, class dashboard, translation)`  [INFERRED]
  lib/arabic/tracing.ts → docs/module-arabe-coran.md

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Two build targets: website without student space vs Capacitor app** — docs_capacitor_ios_two_build_targets, next_config_nextconfig, lib_build_target, github_workflows_ci_build_site_web, github_workflows_ci_build_app, app_eleve_page_studentapponlypage, package_scripts_build_app [EXTRACTED 1.00]
- **CLI operations guarded by confirmDeployment (real spend or writes)** — docs_comptes_et_acces_confirm_deployment_guard, convex_testseedsschool_seedtestschool, convex_paliers_pregen_run, convex_paliers_pregen_invalidate, convex_paliers_pregen_repairmath, convex_paliers_pregen_repairdragdrop [EXTRACTED 1.00]
- **Pure rule modules unit-tested without convex-test** — docs_module_arabe_coran_pure_rule_functions_pattern, convex_arabic_placementrules, convex_palierrules, convex_questrules, convex_tests_palierrules_test, convex_tests_questrules_test [INFERRED 0.85]

## Communities (111 total, 11 thin omitted)

### Community 0 - "Pages admin et API Convex"
Cohesion: 0.06
Nodes (39): AdminAiSettingsPage(), AdminBadgesPage(), CONDITION_LABELS, SchoolsPage(), STATUS_CLASS, STATUS_LABEL, SubjectsPage(), TopicEditPageInner() (+31 more)

### Community 1 - "Facturation et paiements"
Cohesion: 0.05
Nodes (58): Afro.tools MCP server (African API specs registry), Claude Code on the web egress proxy blocks external API domains, SubscriptionStatus, auth, BictorysConfig, bictorysHeaders(), bictorysReference(), ChargeConfirmation (+50 more)

### Community 2 - "Pio et matières élève"
Cohesion: 0.06
Nodes (42): ForgotPasswordPage(), TAP_POSES, PalierNode, StepCard(), TreasureMark(), AnswerOutcome, CONFETTI_COLORS, Kind (+34 more)

### Community 3 - "Leçon d'arabe et voix"
Cohesion: 0.08
Nodes (43): ArabicAlphabetPage(), ArabicLessonPageInner(), ReadingStep(), ReciteStep(), RecordAttempt, StepProps, StepView(), CoachLine() (+35 more)

### Community 4 - "Lecteur d'exercices"
Cohesion: 0.06
Nodes (37): AttemptProgress, PalierResult, PalierSession(), SanitizedExo, SceneAlert, CapRegenAlternatives(), DragDropExercise(), DragDropExerciseProps (+29 more)

### Community 5 - "Parcours arabe et placement"
Cohesion: 0.08
Nodes (49): ModuleMedallion(), callerProfile(), completeLesson, drillValidator, getLessonState, getPath, lessonHasItem(), MODULE_KEY (+41 more)

### Community 6 - "Jugement de prononciation"
Cohesion: 0.07
Nodes (51): isConsigneKey(), letterWord, acceptedFormsForLetter(), judgePronunciation(), judgeReading(), judgeRecitation(), LATIN_ALIASES, LATIN_AMBIGUOUS (+43 more)

### Community 7 - "Carte du chemin du Coran"
Cohesion: 0.08
Nodes (43): ArabePathPage(), renderNode(), shake(), HifzState, LessonCard(), SayButton(), KAABA_HEIGHT, KAABA_INDEX (+35 more)

### Community 8 - "E-mails transactionnels"
Cohesion: 0.08
Nodes (37): METHOD_LABEL, sendInvoiceEmail, sendLinkRequestEmail, decideProfileUpdate(), objectPreferences(), ProfileUpdateDecision, ProfileUpdateFields, ProfileUpdatePatch (+29 more)

### Community 9 - "Écoles et abonnements"
Cohesion: 0.08
Nodes (44): callerIsAdmin(), currentSchoolSubscription(), graceAnchorFor(), loadAccessInput(), getSchedule, amendmentDueAt(), activateSubscription, activationRefusal() (+36 more)

### Community 10 - "Jeux de lettres arabes"
Cohesion: 0.07
Nodes (38): ArabicLessonPage(), LessonSummary(), WriteStep(), StudentHomePage(), tapPio(), ArabicGlyph(), FALLBACK, fontSpec() (+30 more)

### Community 11 - "Règles des paliers"
Cohesion: 0.10
Nodes (35): SubjectDetailPageInner(), TopicLevelFields(), placementLevelValidator, assertVisibleClass(), classEnum, ClassName, HIDDEN, HIDDEN_CLASSES (+27 more)

### Community 12 - "Import des élèves"
Cohesion: 0.09
Nodes (37): SchoolImportPageInner(), handleImport(), callerAdminProfile(), buildLoginCode(), buildParentCode(), CLASS_LEVELS, IMPORT_ROWS_LIMIT, ImportParseError (+29 more)

### Community 13 - "Génération des exercices"
Cohesion: 0.07
Nodes (38): convex_generated_server_actionctx, AnswerInputMode, BucketArgs, checkPalierProgression, exerciseTypeValidator, extractConcept(), findBucket, fnv1a() (+30 more)

### Community 14 - "Fiche école admin"
Cohesion: 0.05
Nodes (34): AdminStatus, AmendableContract, BillingScheduleView, CandidateList, CLASS_LEVELS, ClassCard(), ClassesSection(), ClassLevel (+26 more)

### Community 15 - "Coran et mémorisation"
Cohesion: 0.12
Nodes (36): MaskedText(), coranLessons(), clampStrength(), firstLetter(), HifzRow, hifzStates(), HifzSurahState, isDue() (+28 more)

### Community 16 - "Parcours de l'élève"
Cohesion: 0.10
Nodes (37): StreakRibbon(), callerMayReadStudent(), checkAccess(), getAccessStateForProfile, getResumeIndex, getMyAttempt, listMyAttempts, isTopicComplete() (+29 more)

### Community 17 - "Pré-génération et garde-fous CLI"
Cohesion: 0.07
Nodes (37): insertGeneratedExercises, isBaseExercise(), BucketOutcome, dedupe, DragDropBatch, DragDropSample, DragDropSummary, invalidate (+29 more)

### Community 18 - "Missions du jour"
Cohesion: 0.13
Nodes (33): ActivityEvent, ALL_DONE_BONUS, allDone(), applyActivity(), bonusStarsFor(), completedCount(), EASY_TARGETS, gainFor() (+25 more)

### Community 19 - "Accès et tentatives"
Cohesion: 0.11
Nodes (28): blockedStudent(), callerHasProfile(), callerRole(), currentProfile(), getAccessState, studentIdsTaughtBy(), AccessInput, AccessState (+20 more)

### Community 20 - "Explication des erreurs IA"
Cohesion: 0.10
Nodes (26): generateExplanation, readVerdict(), verifyShortAnswerWithAI, crons, purgeOldHistory, buildPrompt(), explainExercise, ExplainResult (+18 more)

### Community 21 - "Réparation des maths"
Cohesion: 0.16
Nodes (31): acceptedForms(), closestOption(), declaredTolerance(), evaluateLeftToRight(), formatNumber(), isConsistent(), isFraction(), isNumericForm() (+23 more)

### Community 22 - "Alphabet arabe"
Cohesion: 0.11
Nodes (27): DOT_LABEL, FORM_LABELS, LetterCard(), ARABIC_LETTERS, ArabicLetter, Articulation, BY_KEY, getLetter() (+19 more)

### Community 23 - "Deux cibles de build"
Cohesion: 0.11
Nodes (26): Rule: read convex/_generated/ai/guidelines.md before Convex work, Rule: this is NOT the Next.js you know (read node_modules/next/dist/docs first), StudentAppOnlyPage(), Static export packaged by Capacitor (no Next server on device), Two build targets: website (no student space) vs iOS/Android app, CI step Build (application iOS/Android): requires out/student/home/index.html, CI step Build (site web): fails if out/student exists, Lint step non-blocking (continue-on-error) (+18 more)

### Community 24 - "Barre latérale et UI"
Cohesion: 0.14
Nodes (23): Input(), Separator(), SidebarContext, SidebarContextProps, SidebarGroupAction(), SidebarGroupLabel(), SidebarInput(), SidebarMenuAction() (+15 more)

### Community 25 - "Notation des paliers"
Cohesion: 0.14
Nodes (27): canonicalAnswer(), getProgressForPalierAttempt, loadFinalExercisesForAttempt(), requestHint, verifyAttempt, verifyByType(), verifyDragDrop(), verifyMatch() (+19 more)

### Community 26 - "Outillage du projet"
Cohesion: 0.07
Nodes (26): config, eslintConfig, name, private, version, @auth/core, @capacitor/android, @capacitor/cli (+18 more)

### Community 27 - "Stores client"
Cohesion: 0.10
Nodes (21): BadgeUnlockModal(), ExercisePlayer(), zustand, AuthActions, AuthState, useAuthStore, User, Attempt (+13 more)

### Community 28 - "Exercices et PDF"
Cohesion: 0.11
Nodes (26): callerIsStaff(), callerStaffProfile(), create, getById, listAllDrafts, listAllPublished, listByTeacher, listByTopic (+18 more)

### Community 29 - "Suivi élève côté staff"
Cohesion: 0.08
Nodes (10): PublishedPage(), TYPE_COLORS, TYPE_LABELS, useTopicsMap(), formatDate(), TeacherStudentDetailPageInner(), ExplainStepByStep(), Explanation (+2 more)

### Community 30 - "Layouts des rôles"
Cohesion: 0.15
Nodes (22): sidebarLinks, ParentLayout(), sidebarLinks, sidebarLinks, TeacherLayout(), KidSwitcher(), RoleGate(), Sidebar() (+14 more)

### Community 31 - "Tracé des lettres"
Cohesion: 0.17
Nodes (23): clamp01(), inkOrigin(), rasterizeGlyph(), targetCache, TraceOutcome, TracingCanvas(), alphaToGrid(), clamp01() (+15 more)

### Community 32 - "Dépenses IA partitionnées"
Cohesion: 0.15
Nodes (23): addToMonthSpend(), decrementUserDailyQuota, ensureSettings, getMonthSpend, getSettings, getUserDailyQuota, incrementUserDailyQuota, purposeValidator (+15 more)

### Community 33 - "Dépendances et pile"
Cohesion: 0.09
Nodes (26): dependencies, @auth/core, @base-ui/react, canvas-confetti, @capacitor/core, @capacitor/ios, class-variance-authority, clsx (+18 more)

### Community 34 - "Aperçus d'exercices"
Cohesion: 0.10
Nodes (18): DragDropPayload, DragDropPreview(), DragDropPreviewProps, ExercisePreview(), ExercisePreviewProps, ExerciseType, MatchPayload, MatchPreview() (+10 more)

### Community 35 - "Liens parent-enfant"
Cohesion: 0.12
Nodes (19): decideLinkChild(), LinkDecision, LinkDenyReason, LinkInput, LinkRelation, requiredRoleFor(), attachGuardianByCode, CLAIM_REFUSALS (+11 more)

### Community 36 - "Tableaux de bord parent et prof"
Cohesion: 0.09
Nodes (3): formatDate(), TeacherDashboardPage(), lucide-react

### Community 37 - "Décors du monde"
Cohesion: 0.14
Nodes (16): SubjectBanner(), biomeFor(), BiomeMedallion(), BIOMES, Props, SavannaBackdrop(), Variant, Device tier lite/full (saveData, <=2 GB RAM, <=3 cores, 2G) (G5) (+8 more)

### Community 38 - "Config shadcn"
Cohesion: 0.09
Nodes (21): aliases, components, hooks, lib, ui, utils, iconLibrary, menuAccent (+13 more)

### Community 39 - "Sons de l'élève"
Cohesion: 0.14
Nodes (20): useVictoryExtras(), LevelUpOverlay(), SoundOptInDialog(), attachOnlineRetry(), ensureHowler(), ensureSound(), hasOptInBeenAsked(), HowlConstructor (+12 more)

### Community 40 - "Séance arabe"
Cohesion: 0.19
Nodes (20): pickDistractors(), shuffle(), linkItemKey(), linkPoints(), Verses heard then read one at a time (talqin), buildHifzSession(), buildLetterSession(), buildReadingSession() (+12 more)

### Community 41 - "Migrations et graines"
Cohesion: 0.13
Nodes (19): collectStorageIds(), deleteStoredFiles(), lowercaseAuthAccounts, lowercaseEmails, removalPatch(), stripLegacyMediaFields, stripLegacyPromptAudio, ACCOUNT_TABLES (+11 more)

### Community 42 - "Tests e2e du palier"
Cohesion: 0.10
Nodes (5): AnswerFeedback(), useVictoryConfetti(), Not done: session keeps focus mode, no shop/currency (G7), no 3D Pio, student Playwright tests not run by CI, canvas-confetti, @playwright/test

### Community 43 - "Caméra de la carte"
Cohesion: 0.18
Nodes (19): ZoomControls(), clamp(), initialScaleFor(), MapViewport(), beginPan(), beginPinch(), clampAxis(), clampScale() (+11 more)

### Community 44 - "Doc Monde de Pio"
Cohesion: 0.14
Nodes (17): remember(), rememberedIndex(), WorldMapPage(), onArrive(), Stamp(), SubjectTrailPage(), Camp (/student/home): painted savanna, Pio, one resume button, missions, world medallions, Carnet (/student/profil): cream page with stamps (level, stars, exercises, trophies, streak) (+9 more)

### Community 45 - "Doc animations de Pio"
Cohesion: 0.15
Nodes (17): CLIP, LABELS, OUTFITS, PioOutfit, POSES, Arabe & Coran module (off by default, per school), No text in module images (generators invent fake letters), Redo or add a pose (PNG, plate, OpenArt, pio-encode.sh, register in pio.tsx) (+9 more)

### Community 46 - "Config TypeScript"
Cohesion: 0.10
Nodes (19): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+11 more)

### Community 47 - "Profil de l'élève"
Cohesion: 0.22
Nodes (11): fileToSquareBlob(), LogoutCard(), StudentProfileEditPage(), formatDuration(), LogoutCard(), StudentProfilePage(), useLogout(), CLASS_LONG_NAMES (+3 more)

### Community 48 - "Boutons et navbar"
Cohesion: 0.18
Nodes (14): LINKS, Navbar(), useActiveSection(), Button(), buttonVariants, Sheet(), SheetContent(), SheetDescription() (+6 more)

### Community 49 - "Session et déconnexion"
Cohesion: 0.16
Nodes (14): getInitials(), UserMenu(), handleLogout(), UserMenuProps, Variant, Logout: the only deliberate document navigation, clearConvexAuthTokens(), LoginParams (+6 more)

### Community 50 - "Série de jours"
Cohesion: 0.23
Nodes (17): requireAccess(), markBadgesSeen, addDaysYmd(), applyActivity(), applyRollover(), dailyStreakRollover, daysBetween(), recordKidActivity (+9 more)

### Community 51 - "Échéances de paiement"
Cohesion: 0.14
Nodes (18): activeProvider(), applyPayment, ApplyPaymentResult, BillingSchedule, chargeProviderValidator, creditInstallment(), invoiceEmailData, invoiceTarget (+10 more)

### Community 52 - "Demandes de liaison"
Cohesion: 0.15
Nodes (15): createRequest, generateToken(), getPendingForParent, internalGetById, internalGetByToken, internalGetParentName, internalGetStudentEmail, internalGetStudentName (+7 more)

### Community 53 - "Tarification"
Cohesion: 0.19
Nodes (16): billedSeats(), PRICING_SCALE, PricingScale, PricingTier, quoteSeatAmendment(), quoteSeatAmendmentWithScale(), quoteSubscription(), quoteWithScale() (+8 more)

### Community 54 - "Géométrie des sentiers"
Cohesion: 0.20
Nodes (14): GameMap(), buildTrail(), cubic(), SUBJECT_TRAIL, trailNodePoints(), trailPathD(), TrailSample, trailWorldHeight() (+6 more)

### Community 55 - "Passerelle IA"
Cohesion: 0.22
Nodes (15): generate, GenerateResult, purposeValidator, quotaScopeValidator, sleep(), dayKey(), endOfDayUtc(), evaluateQuota() (+7 more)

### Community 56 - "Rapports"
Cohesion: 0.14
Nodes (16): convex_generated_server_query, formatExerciseType(), generate, getById, getGuardians, getStudentProfile, internalGetById, listByParent (+8 more)

### Community 58 - "Icônes iOS générées"
Cohesion: 0.14
Nodes (16): CGContext, CGFloat, CGImage, CGRect, CoreGraphics, Generated iOS icon and launch screen (pnpm ios:brand), Foundation, ImageIO (+8 more)

### Community 59 - "Blasons des badges"
Cohesion: 0.15
Nodes (10): BadgeShield(), hashString(), ICON_MAP, LOCKED_METAL, Metal, PALETTES, pickPalette(), pickShape() (+2 more)

### Community 60 - "Prompts des paliers"
Cohesion: 0.18
Nodes (16): AiPurpose, ageForClass(), buildPalierBasePrompt(), buildPalierBaseSystemPrompt(), buildPersonalizedPrompt(), buildPersonalizedSystemPrompt(), buildVariationSystemPrompt(), ClassLevel (+8 more)

### Community 61 - "Marche de Pio"
Cohesion: 0.18
Nodes (15): pioWalkFacing(), PioWalker, PioWalkerSprite(), STAND_OFFSET, usePioWalker(), standAt(), walkTo(), WalkerState (+7 more)

### Community 62 - "Catalogue des badges"
Cohesion: 0.19
Nodes (15): catalogReadable(), create, getById, getConditionText(), list, listMyEarned, normalizeRarities, normalizeRarity() (+7 more)

### Community 63 - "Notes de conception"
Cohesion: 0.14
Nodes (13): createDrafts, create, createChildProfile, Removed profiles.createChildAccount and /parent/children/add, @playwright/test, Original data model (profiles, studentGuardians, subjects, topics, exercises, attempts, studentTopicProgress, badges, pdfUploads, topicReports), MVP decision log (10 decisions), Managua: gamified educational web app for CE2-CM2 (8-10 years), francophone/Senegalese focus (+5 more)

### Community 64 - "Config TS Convex"
Cohesion: 0.12
Nodes (15): compilerOptions, allowJs, allowSyntheticDefaultImports, forceConsistentCasingInFileNames, isolatedModules, jsx, lib, module (+7 more)

### Community 65 - "Racine de l'app"
Cohesion: 0.14
Nodes (11): app_globals, amiri, fredoka, geistMono, metadata, poppins, viewport, convex (+3 more)

### Community 66 - "Layout élève et accès"
Cohesion: 0.22
Nodes (10): BottomNav(), isActivePath(), isFocusRoute(), NAV, StudentLayout(), AccessGate(), AccessReason, Focus-mode cream status bar and palier-end frosted override (+2 more)

### Community 67 - "Trophées de l'élève"
Cohesion: 0.24
Nodes (12): BadgeRow, EarnedRow, SHELF_TONE, SHELVES, StudentBadgesPage(), Tab, getRarityChipClass(), getRarityGlowStyle() (+4 more)

### Community 68 - "Boîtes de dialogue"
Cohesion: 0.25
Nodes (9): StudentAlertTone, toneStyles, Dialog(), DialogContent(), DialogDescription(), DialogFooter(), DialogHeader(), DialogOverlay() (+1 more)

### Community 69 - "Doc progression"
Cohesion: 0.22
Nodes (14): checkAndAward, markTopicCompleteIfDone(), submitPalier, End-of-palier screen replaces the old victory screen, End screen counts stars on exercises actually played (exerciseCount), 3 per exercise, threshold scaled, Topic completed when all its paliers are (studentTopicProgress.completedAt), Trophy engine: catalogue conditions evaluated on a student snapshot (badgeRules.evaluateBadge), progression:rebuild backfill for pre-existing students (+6 more)

### Community 70 - "Dépendances de dev"
Cohesion: 0.13
Nodes (15): devDependencies, @capacitor/cli, eslint, eslint-config-next, jsdom, tailwindcss, @tailwindcss/postcss, @testing-library/jest-dom (+7 more)

### Community 71 - "Carte de jeu"
Cohesion: 0.16
Nodes (9): Props, WorldBackdrop(), CameraHandle, Gesture, MAX_SCALE, Props, TrailLayout, WorldPoint (+1 more)

### Community 72 - "Réparation glisser-déposer"
Cohesion: 0.27
Nodes (11): DragDropItem, DragDropRepairInput, DragDropRepairOutcome, isGenericZoneLabel(), lettersWithoutInitials(), normalise(), oneItemPerZone(), relabelWithResults() (+3 more)

### Community 73 - "Éditeur d'exercices admin"
Cohesion: 0.17
Nodes (4): ExerciseEditPageInner(), ExerciseType, getDefaultPayload(), TYPE_OPTIONS

### Community 74 - "Vitrine : fonctionnement"
Cohesion: 0.24
Nodes (9): HowItWorks(), Step, STEPS, ScrollToTop(), FadeIn(), MotionWrapperProps, ScaleIn(), StaggerContainer() (+1 more)

### Community 75 - "Doc application iOS"
Cohesion: 0.19
Nodes (11): Android app target (Gradle project in android/, Capacitor 8.5.2, SDK 36, Java 21), Capacitor router serves root index.html for any extensionless path, Dynamic [id] routes replaced by query parameters, Export mode constraints: trailingSlash, unoptimized images, Never use window.location.href for internal navigation, Not covered: no native plugins, no App Store publication, nextConfig, @capacitor/android (+3 more)

### Community 76 - "Vitrine : badges"
Cohesion: 0.23
Nodes (10): BadgeItem, BADGES, BadgesCard(), Gamification(), MASTERY, MasteryCard(), STREAK_DAYS, StreakCard() (+2 more)

### Community 77 - "Vérification des calculs IA"
Cohesion: 0.33
Nodes (10): checkMathExercise(), evaluateExpression(), FactCheckOutcome, parseAnswerNumber(), parseExpression(), parseFactor(), parseNumber(), parsePower() (+2 more)

### Community 78 - "Registre des modèles IA"
Cohesion: 0.20
Nodes (9): ALL_PURPOSES, approximateTokenCount(), GPT_4O, GPT_4O_MINI, isRetryableFailure(), PurposeConfig, REGISTRY, resolveModel() (+1 more)

### Community 79 - "Cache voix et quotas"
Cohesion: 0.23
Nodes (11): addTtsChars, callerContext, consumeSttQuota, findClip, MODULE_KEY, recordServerAttempt, saveClip, STT_DAILY_LIMIT (+3 more)

### Community 80 - "Détection de l'app native"
Cohesion: 0.25
Nodes (9): PostAuthPage(), NativeAppGate(), App opening is client-side (NativeAppGate -> router.replace('/post-auth')), Official Pio avatar replaces the MVP round-bird SVG, Pio animations are OpenArt video clips, native app only (web shows the still pose), noSubscribe(), useIsNativeApp(), framer-motion (+1 more)

### Community 81 - "Budget IA"
Cohesion: 0.27
Nodes (8): BudgetContext, BudgetDecision, BudgetTier, evaluateBudget(), GENERATIVE_PURPOSES, KID_INITIATED_PURPOSES, projectMonthEndSpend(), Voice spend excluded from the OpenAI monthly AI budget

### Community 82 - "Rôles et authentification"
Cohesion: 0.24
Nodes (8): isAuthenticated, signIn, signOut, store, ResendOTPPasswordReset, decideProvisionedRole(), PROVISIONABLE, ProvisionableRole

### Community 83 - "Facturation côté admin"
Cohesion: 0.24
Nodes (10): BillingSection(), classContext(), ContractActivation(), formatDay(), formatEventMoment(), formatFcfa(), MembershipHistory(), ModulesSection() (+2 more)

### Community 84 - "Vitrine : types d'exercices"
Cohesion: 0.20
Nodes (3): ExerciseCard, ExerciseTypes(), TYPES

### Community 85 - "Vitrine : FAQ et publics"
Cohesion: 0.29
Nodes (7): FAQ(), ITEMS, ForWhom(), Persona, PERSONAS, Section(), SectionProps

### Community 86 - "Abonnement côté admin"
Cohesion: 0.36
Nodes (9): ADMIN_STATUSES, fromDayInput(), plural(), seatsContractLabel(), SeatsFullNotice(), seatsUsedLabel(), SeatUsageNotice(), SubscriptionSection() (+1 more)

### Community 87 - "Marque et layout auth"
Cohesion: 0.28
Nodes (4): Brand(), BrandProps, BrandSize, SIZES

### Community 88 - "Vitrine : héros"
Cohesion: 0.25
Nodes (4): ElegantShape(), ElegantShapeProps, Hero(), ROTATING_WORDS

### Community 89 - "Matières"
Cohesion: 0.33
Nodes (8): catalogAccess(), create, getById, list, remove, seedDefaults, subjectsHiddenWhole(), update

### Community 90 - "Doc paliers et exercices"
Cohesion: 0.25
Nodes (8): topicOpenTo(), getBucket, startPalierAttempt, Students only see topics of their level (profiles.class), Dev database content state (2026-09-27): duplicate and level-less topics, Lowering the palier count keeps extra paliers but closes them, Palier: ten exercises validated at 7/10, Paliers expire after a term (PALIER_TTL_MS) and regenerate on demand

### Community 91 - "Doc comptes et accès"
Cohesion: 0.31
Nodes (8): signUpWithCode, provisionStaffAccount, Parent activation on /register with a single-use expiring school code, Accounts only by provisioning: four paths (directeur, professeur, student, parent), Password.profile() refuses flow 'signUp', Known weakness: parentLink.signUpWithCode is public, unauthenticated, not rate limited, Directeur/professeur receive initial credentials from the Jotna team, MVP security model: admin all, parent own children via studentGuardians, student never sees answerKey

### Community 93 - "Brouillons admin"
Cohesion: 0.33
Nodes (4): DraftsPage(), TYPE_COLORS, TYPE_LABELS, useTopicsMap()

### Community 94 - "Détail PDF admin"
Cohesion: 0.38
Nodes (5): EXERCISE_TYPE_LABELS, formatDate(), formatFileSize(), PdfUploadDetailPageInner(), STATUS_STEPS

### Community 95 - "Détail PDF prof"
Cohesion: 0.38
Nodes (5): EXERCISE_TYPE_LABELS, formatDate(), formatFileSize(), STATUS_STEPS, TeacherPdfUploadDetailPageInner()

### Community 96 - "Liste PDF admin"
Cohesion: 0.47
Nodes (5): formatDate(), formatFileSize(), PdfUploadsPage(), TODO: Replace with actual admin profile ID from auth context, STATUS_CONFIG

### Community 97 - "Extraction de PDF"
Cohesion: 0.47
Nodes (4): convex_generated_server_internalaction, exerciseExtractionSchema, ExtractedExercise, ExtractionResponse

### Community 98 - "Tests des rapports"
Cohesion: 0.40
Nodes (4): AttemptData, computeReport(), ExerciseData, formatExerciseType()

### Community 99 - "Serveur d'export local"
Cohesion: 0.33
Nodes (5): ref_node_fs, ref_node_http, ref_node_path, port, types

### Community 100 - "Liste PDF prof"
Cohesion: 0.60
Nodes (4): formatDate(), formatFileSize(), STATUS_CONFIG, TeacherPdfUploadsPage()

### Community 103 - "Pied de page"
Cohesion: 0.67
Nodes (3): COLUMNS, Footer(), FooterColumn

## Ambiguous Edges - Review These
- `posterFor()` → `Extending the game (subject, palier count, mission type, trail shape, Pio pose, Pio line)`  [AMBIGUOUS]
  docs/monde-de-pio.md · relation: references
- `normalizeRarities` → `badges:normalizeCatalog one-off threshold fix`  [AMBIGUOUS]
  docs/progression-niveau-etoiles-trophees.md · relation: conceptually_related_to
- `createChildProfile` → `Removed profiles.createChildAccount and /parent/children/add`  [AMBIGUOUS]
  docs/comptes-et-acces.md · relation: conceptually_related_to
- `README.md` → `Two build targets: website (no student space) vs iOS/Android app`  [AMBIGUOUS]
  README.md · relation: conceptually_related_to
- `allowBuilds (unresolved placeholders for esbuild, msw, sharp, unrs-resolver)` → `ignoredBuiltDependencies: sharp, unrs-resolver`  [AMBIGUOUS]
  pnpm-workspace.yaml · relation: conceptually_related_to
- `Not covered: no native plugins, no App Store publication` → `Android app target (Gradle project in android/, Capacitor 8.5.2, SDK 36, Java 21)`  [AMBIGUOUS]
  docs/capacitor-ios.md · relation: conceptually_related_to
- `Pio walk: constant speed, 0.45-2.4 s per step, whole-sprite bounce, camera follows` → `Walk speed 90 world-px per second (WALK_SPEED), matched to the clip's steps`  [AMBIGUOUS]
  docs/monde-de-pio.md · relation: conceptually_related_to
- `MVP final status: 28 routes build, 119 unit tests (9 files), 5 Playwright E2E files` → `Managua MVP implementation plan (6 phases, 60+ items)`  [AMBIGUOUS]
  tasks/todo.md · relation: conceptually_related_to

## Knowledge Gaps
- **569 isolated node(s):** `CONDITION_LABELS`, `StaffRow`, `ClassRow`, `ClassStudentRow`, `MembershipEventRow` (+564 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 787 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **11 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **What is the exact relationship between `posterFor()` and `Extending the game (subject, palier count, mission type, trail shape, Pio pose, Pio line)`?**
  _Edge tagged AMBIGUOUS (relation: references) - confidence is low._
- **What is the exact relationship between `normalizeRarities` and `badges:normalizeCatalog one-off threshold fix`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._
- **What is the exact relationship between `createChildProfile` and `Removed profiles.createChildAccount and /parent/children/add`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._
- **What is the exact relationship between `README.md` and `Two build targets: website (no student space) vs iOS/Android app`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._
- **What is the exact relationship between `allowBuilds (unresolved placeholders for esbuild, msw, sharp, unrs-resolver)` and `ignoredBuiltDependencies: sharp, unrs-resolver`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._
- **What is the exact relationship between `Not covered: no native plugins, no App Store publication` and `Android app target (Gradle project in android/, Capacitor 8.5.2, SDK 36, Java 21)`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._
- **What is the exact relationship between `Pio walk: constant speed, 0.45-2.4 s per step, whole-sprite bounce, camera follows` and `Walk speed 90 world-px per second (WALK_SPEED), matched to the clip's steps`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._