# Graph Report - elevenlabs-locale-support-27eb65  (2026-10-05)

## Corpus Check
- 364 files · ~346,849 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 4 file(s) not represented in the graph (top: (none) 3, .css 1)

## Summary
- 2543 nodes · 6437 edges · 115 communities (105 shown, 10 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 195 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `449aca22`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- refusalMessage
- billingRules.ts
- session/page.app.tsx
- lecon/page.app.tsx
- ExercisePrompt.tsx
- placement.ts
- arabic.test.ts
- arabe/page.app.tsx
- email-brand.ts
- schools.ts
- topics/edit/page.tsx
- convex/curriculum.ts
- studentCredentials.ts
- paliers/index.ts
- ecoles/detail/page.tsx
- hifz.ts
- streak.ts
- pregen.ts
- quests.ts
- studentImport.ts
- @convex-dev/auth
- mathRepair.ts
- arabic/curriculum.ts
- scripts
- sidebar.tsx
- palierAttempts.ts
- package.json
- voice.ts
- exercises.ts
- react
- prompt-reader.tsx
- tracing-canvas.tsx
- aiGateway/index.ts
- dependencies
- ExercisePreview.tsx
- convex_generated_server_query
- lucide-react
- use-device-tier.ts
- components.json
- sounds/index.ts
- MatchExercise.tsx
- convex_generated_server
- @playwright/test
- MapViewport
- monde-de-pio.md
- pio.tsx
- compilerOptions
- profil/page.app.tsx
- pdfUploads.ts
- lib/auth.ts
- billingBictorys.ts
- billing.ts
- linkRequests.ts
- pricing.ts
- game-map.tsx
- convex_generated_api_internal
- reports.ts
- vitest
- ios-brand-assets.swift
- badge-icon.tsx
- prompts.ts
- subscriptionRules.ts
- convex/badges.ts
- design.md
- compilerOptions
- app/layout.tsx
- layout.app.tsx
- badges/page.app.tsx
- balloon-fx.tsx
- progression-niveau-etoiles-trophees.md
- devDependencies
- progressionRules.ts
- dragDropRepair.ts
- admin/exercises/edit/page.tsx
- app/page.tsx
- capacitor-ios.md
- gamification.tsx
- factCheck.ts
- DragDropExercise.tsx
- modules.ts
- exercise-types.tsx
- section.tsx
- convex/auth.ts
- formatDay
- subjects/page.app.tsx
- module-arabe-coran.md
- SubscriptionSection
- footer.tsx
- hero.tsx
- profiles.ts
- students.ts
- comptes-et-acces.md
- ref_convex_generated_datamodel
- drafts/page.tsx
- admin/pdf-uploads/detail/page.tsx
- teacher/pdf-uploads/detail/page.tsx
- admin/pdf-uploads/page.tsx
- OrderExercise.tsx
- cta.tsx
- serve-export.mjs
- teacher/pdf-uploads/page.tsx
- MatchExercise.test.tsx
- ProvisionStaffForm
- access.ts
- postcss.config.mjs
- ios-brand-assets.sh script
- auth.config.ts
- convex
- Two build targets: website (no student space) vs iOS/Android app
- auth-store.ts
- published/page.tsx
- pnpm-workspace.yaml

## God Nodes (most connected - your core abstractions)
1. `convex` - 118 edges
2. `lucide-react` - 100 edges
3. `react` - 100 edges
4. `refusalMessage()` - 65 edges
5. `next` - 64 edges
6. `cn()` - 55 edges
7. `vitest` - 52 edges
8. `callerIsAdmin()` - 47 edges
9. `framer-motion` - 38 edges
10. `@convex-dev/auth` - 34 edges

## Surprising Connections (you probably didn't know these)
- `Arabic glyph centered on its ink, not on the baseline` --references--> `amiri`  [INFERRED]
  docs/module-arabe-coran.md → app/layout.tsx
- `Extending the game (subject, palier count, mission type, trail shape, Pio pose, Pio line)` --references--> `posterFor()`  [AMBIGUOUS]
  docs/monde-de-pio.md → components/student/pio.tsx
- `WalkHeading` --implements--> `Two-direction walk: walkAway (from behind) climbing, walkToward (front) descending`  [INFERRED]
  components/student/world/pio-walker.tsx → docs/pio-animations.md
- `palierCountArg` --implements--> `Dynamic palier count per topic (topics.palierCount 1-10; defaults CI/CP 3, CE1/CE2 4, CM1/CM2 5)`  [INFERRED]
  convex/topics.ts → docs/paliers-et-exercices.md
- `ArabePathPage()` --implements--> `Quran path map (/student/arabe): 30 lessons climbing from the child's village to the Kaaba`  [INFERRED]
  app/(student)/student/arabe/page.app.tsx → docs/module-arabe-coran.md

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **CLI operations guarded by confirmDeployment (real spend or writes)** — docs_comptes_et_acces_confirm_deployment_guard, convex_testseedsschool_seedtestschool, convex_paliers_pregen_run, convex_paliers_pregen_invalidate, convex_paliers_pregen_repairmath, convex_paliers_pregen_repairdragdrop [EXTRACTED 1.00]
- **Two build targets: website without student space vs Capacitor app** — docs_capacitor_ios_two_build_targets, next_config_nextconfig, lib_build_target, github_workflows_ci_build_site_web, github_workflows_ci_build_app, app_eleve_page_studentapponlypage, package_scripts_build_app [EXTRACTED 1.00]
- **Pure rule modules unit-tested without convex-test** — docs_module_arabe_coran_pure_rule_functions_pattern, convex_arabic_placementrules, convex_palierrules, convex_questrules, convex_tests_palierrules_test, convex_tests_questrules_test [INFERRED 0.85]

## Communities (115 total, 10 thin omitted)

### Community 0 - "refusalMessage"
Cohesion: 0.11
Nodes (18): SchoolImportPageInner(), handleImport(), SchoolsPage(), STATUS_CLASS, STATUS_LABEL, SubjectsPage(), ParentActivationPage(), handleSubmit() (+10 more)

### Community 1 - "billingRules.ts"
Cohesion: 0.10
Nodes (30): confirmInvoice, expectedWebhookHash(), InvoiceConfirmation, openInvoice, PaydunyaConfig, paydunyaHeaders(), AMENDMENT_DUE_DELAY_MS, amendmentDueAt() (+22 more)

### Community 2 - "session/page.app.tsx"
Cohesion: 0.06
Nodes (33): StudentHomePage(), tapPio(), TAP_POSES, AttemptProgress, PalierResult, SanitizedExo, SceneAlert, CapRegenAlternatives() (+25 more)

### Community 3 - "lecon/page.app.tsx"
Cohesion: 0.07
Nodes (57): ArabicAlphabetPage(), LessonSummary(), ReadingStep(), ReciteStep(), RecordAttempt, StepProps, StepView(), WriteStep() (+49 more)

### Community 4 - "ExercisePrompt.tsx"
Cohesion: 0.17
Nodes (12): ExercisePrompt(), parsePrompt(), PromptText(), PromptReaderButton(), usePromptReader(), optionColors, QcmExercise(), QcmExerciseProps (+4 more)

### Community 5 - "placement.ts"
Cohesion: 0.10
Nodes (39): PlacementStudent, callerProfile(), getLesson(), completeLesson, drillValidator, getLessonState, getPath, lessonHasItem() (+31 more)

### Community 6 - "arabic.test.ts"
Cohesion: 0.11
Nodes (35): judgePronunciation(), judgeReading(), judgeRecitation(), LATIN_ALIASES, LATIN_AMBIGUOUS, latinFormsForLetter(), latinMatches(), latinSkeleton() (+27 more)

### Community 7 - "arabe/page.app.tsx"
Cohesion: 0.09
Nodes (32): ArabicLessonPageInner(), ArabePathPage(), renderNode(), shake(), HifzState, LessonCard(), SayButton(), KAABA_HEIGHT (+24 more)

### Community 8 - "email-brand.ts"
Cohesion: 0.10
Nodes (32): METHOD_LABEL, sendInvoiceEmail, convex_generated_server_internalaction, sendLinkRequestEmail, sendRegenCapEmail, sendEmail, ResendOTPPasswordReset, EMAIL_FROM (+24 more)

### Community 9 - "schools.ts"
Cohesion: 0.09
Nodes (39): callerIsAdmin(), currentSchoolSubscription(), getSchedule, activateSubscription, activationRefusal(), addStaff, AmendableContract, amendableSubscription() (+31 more)

### Community 10 - "topics/edit/page.tsx"
Cohesion: 0.13
Nodes (16): AdminAiSettingsPage(), loadedData, state, TopicEditPageInner(), ParentSettingsPage(), handleSave(), receiveReportsOf(), state (+8 more)

### Community 11 - "convex/curriculum.ts"
Cohesion: 0.10
Nodes (29): catalogAccess(), assertVisibleClass(), classEnum, ClassName, HIDDEN, HIDDEN_CLASSES, isHiddenClass(), VISIBLE_CLASSES (+21 more)

### Community 12 - "studentCredentials.ts"
Cohesion: 0.16
Nodes (18): buildLoginCode(), buildParentCode(), CLASS_LEVELS, IMPORT_ROWS_LIMIT, ImportParseError, ImportParseResult, normalizeCode(), PARSE_ERROR_MESSAGES (+10 more)

### Community 13 - "paliers/index.ts"
Cohesion: 0.07
Nodes (40): convex_generated_server_actionctx, AnswerInputMode, BucketArgs, checkPalierProgression, exerciseTypeValidator, extractConcept(), findBucket, fnv1a() (+32 more)

### Community 14 - "ecoles/detail/page.tsx"
Cohesion: 0.05
Nodes (31): AdminStatus, AmendableContract, BillingScheduleView, CandidateList, CLASS_LEVELS, ClassCard(), ClassesSection(), ClassLevel (+23 more)

### Community 15 - "hifz.ts"
Cohesion: 0.17
Nodes (25): MaskedText(), clampStrength(), firstLetter(), HifzRow, hifzStates(), HifzSurahState, isDue(), linkPointOf() (+17 more)

### Community 16 - "streak.ts"
Cohesion: 0.16
Nodes (22): requireAccess(), markBadgesSeen, addDaysYmd(), applyActivity(), applyRollover(), dailyStreakRollover, daysBetween(), recordKidActivity (+14 more)

### Community 17 - "pregen.ts"
Cohesion: 0.07
Nodes (36): insertGeneratedExercises, isBaseExercise(), BucketOutcome, dedupe, DragDropBatch, DragDropSample, DragDropSummary, invalidate (+28 more)

### Community 18 - "quests.ts"
Cohesion: 0.13
Nodes (34): QuestBoard(), ActivityEvent, ALL_DONE_BONUS, allDone(), applyActivity(), bonusStarsFor(), completedCount(), EASY_TARGETS (+26 more)

### Community 19 - "studentImport.ts"
Cohesion: 0.11
Nodes (20): callerAdminProfile(), convex_generated_server_internalquery, releaseStudent, transferStudent, advanceJob, commitRow, failRow, getJob (+12 more)

### Community 20 - "@convex-dev/auth"
Cohesion: 0.12
Nodes (15): ResetPasswordForm(), generateExplanation, readVerdict(), verifyShortAnswerWithAI, buildPrompt(), explainExercise, ExplainResult, ExplanationPayload (+7 more)

### Community 21 - "mathRepair.ts"
Cohesion: 0.17
Nodes (28): acceptedForms(), closestOption(), evaluateLeftToRight(), isConsistent(), isFraction(), isNumericForm(), isOperandOf(), isPercent() (+20 more)

### Community 22 - "arabic/curriculum.ts"
Cohesion: 0.07
Nodes (53): DOT_LABEL, FORM_LABELS, LetterCard(), ARABIC_LETTERS, ArabicLetter, ArabicLetterKey, Articulation, BY_KEY (+45 more)

### Community 23 - "scripts"
Cohesion: 0.20
Nodes (12): Static export packaged by Capacitor (no Next server on device), Lint step non-blocking (continue-on-error), scripts, android:sync, dev, ios:open, ios:sync, lint (+4 more)

### Community 24 - "sidebar.tsx"
Cohesion: 0.06
Nodes (66): sidebarLinks, ParentLayout(), sidebarLinks, sidebarLinks, TeacherLayout(), Brand(), BrandProps, BrandSize (+58 more)

### Community 25 - "palierAttempts.ts"
Cohesion: 0.09
Nodes (40): blockedStudent(), checkAccess(), getAccessStateForProfile, getAttemptContextForVerification, getAttemptsForExercise, getExerciseAndAttempts, getProgressForTopic, getResumeIndex (+32 more)

### Community 26 - "package.json"
Cohesion: 0.07
Nodes (27): config, eslintConfig, name, private, version, @auth/core, @capacitor/android, @capacitor/cli (+19 more)

### Community 27 - "voice.ts"
Cohesion: 0.13
Nodes (25): isConsigneKey(), letterWord, acceptedFormsForLetter(), LatinForms, ALLOWED_MIME, audioContainer(), baseMime(), Expected (+17 more)

### Community 28 - "exercises.ts"
Cohesion: 0.19
Nodes (14): callerIsStaff(), create, getById, listAllDrafts, listAllPublished, listByTeacher, listByTopic, publish (+6 more)

### Community 29 - "react"
Cohesion: 0.09
Nodes (9): ForgotPasswordPage(), formatDate(), TeacherStudentDetailPageInner(), ICONS, VisibleClassName, convex_generated_api, convex_generated_api_api, next (+1 more)

### Community 30 - "prompt-reader.tsx"
Cohesion: 0.21
Nodes (11): PromptReader, PromptReaderContext, PromptReaderProvider(), ReaderStatus, SpeakResult, urlByExercise, attempt, mocks (+3 more)

### Community 31 - "tracing-canvas.tsx"
Cohesion: 0.16
Nodes (24): clamp01(), inkOrigin(), rasterizeGlyph(), targetCache, TraceOutcome, TracingCanvas(), What the module does not do (tajwid, binding trace grade, memorization certificate, class dashboard, translation), alphaToGrid() (+16 more)

### Community 32 - "aiGateway/index.ts"
Cohesion: 0.05
Nodes (65): BudgetContext, BudgetDecision, BudgetTier, evaluateBudget(), GENERATIVE_PURPOSES, KID_INITIATED_PURPOSES, projectMonthEndSpend(), addToMonthSpend() (+57 more)

### Community 33 - "dependencies"
Cohesion: 0.09
Nodes (25): dependencies, @auth/core, @base-ui/react, canvas-confetti, @capacitor/core, @capacitor/ios, class-variance-authority, clsx (+17 more)

### Community 34 - "ExercisePreview.tsx"
Cohesion: 0.10
Nodes (18): DragDropPayload, DragDropPreview(), DragDropPreviewProps, ExercisePreview(), ExercisePreviewProps, ExerciseType, MatchPayload, MatchPreview() (+10 more)

### Community 35 - "convex_generated_server_query"
Cohesion: 0.14
Nodes (16): convex_generated_server_query, decideLinkChild(), LinkDecision, LinkDenyReason, LinkInput, LinkRelation, requiredRoleFor(), attachGuardianByCode (+8 more)

### Community 36 - "lucide-react"
Cohesion: 0.12
Nodes (3): formatDate(), TeacherDashboardPage(), lucide-react

### Community 37 - "use-device-tier.ts"
Cohesion: 0.13
Nodes (17): SubjectBanner(), biomeFor(), BiomeMedallion(), BIOMES, Props, SavannaBackdrop(), Variant, Device tier lite/full (saveData, <=2 GB RAM, <=3 cores, 2G) (G5) (+9 more)

### Community 38 - "components.json"
Cohesion: 0.09
Nodes (21): aliases, components, hooks, lib, ui, utils, iconLibrary, menuAccent (+13 more)

### Community 39 - "sounds/index.ts"
Cohesion: 0.16
Nodes (20): useVictoryExtras(), LevelUpOverlay(), SoundOptInDialog(), attachOnlineRetry(), ensureHowler(), ensureSound(), hasOptInBeenAsked(), HowlConstructor (+12 more)

### Community 40 - "MatchExercise.tsx"
Cohesion: 0.27
Nodes (11): MatchExercise(), MatchExerciseProps, MatchPayload, pairColors, dragDropAnswer(), linkTiles(), matchAnswer(), MatchLink (+3 more)

### Community 41 - "convex_generated_server"
Cohesion: 0.14
Nodes (19): crons, purgeOldHistory, convex_generated_server, convex_generated_server_internalmutation, collectStorageIds(), deleteStoredFiles(), lowercaseAuthAccounts, lowercaseEmails (+11 more)

### Community 43 - "MapViewport"
Cohesion: 0.18
Nodes (19): ZoomControls(), clamp(), initialScaleFor(), MapViewport(), beginPan(), beginPinch(), clampAxis(), clampScale() (+11 more)

### Community 44 - "monde-de-pio.md"
Cohesion: 0.14
Nodes (16): remember(), rememberedIndex(), WorldMapPage(), onArrive(), Stamp(), SubjectTrailPage(), Carnet (/student/profil): cream page with stamps (level, stars, exercises, trophies, streak), Four places, not screens: Camp, Carte, Trophees, Carnet (+8 more)

### Community 45 - "pio.tsx"
Cohesion: 0.09
Nodes (34): NativeAppGate(), CLIP, LABELS, OUTFITS, OutfitSpec, Pio(), PioClip(), pioClipSources() (+26 more)

### Community 46 - "compilerOptions"
Cohesion: 0.10
Nodes (19): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+11 more)

### Community 47 - "profil/page.app.tsx"
Cohesion: 0.17
Nodes (15): StudentAppOnlyPage(), fileToSquareBlob(), LogoutCard(), StudentProfileEditPage(), formatDuration(), LogoutCard(), StudentProfilePage(), PalierSession() (+7 more)

### Community 48 - "pdfUploads.ts"
Cohesion: 0.22
Nodes (13): callerStaffProfile(), createDraftExercises, generateUploadUrl, getById, getUploadInternal, list, listByTeacher, markError (+5 more)

### Community 49 - "lib/auth.ts"
Cohesion: 0.22
Nodes (6): LoginParams, RegisterParams, Role, SignIn, SignOut, loadRoleHomePath()

### Community 50 - "billingBictorys.ts"
Cohesion: 0.10
Nodes (27): Afro.tools MCP server (African API specs registry), Claude Code on the web egress proxy blocks external API domains, markOverdueInstallments, BictorysConfig, bictorysHeaders(), bictorysReference(), ChargeConfirmation, confirmCharge (+19 more)

### Community 51 - "billing.ts"
Cohesion: 0.13
Nodes (18): graceAnchorFor(), loadAccessInput(), activeProvider(), applyPayment, ApplyPaymentResult, BillingSchedule, chargeProviderValidator, creditInstallment() (+10 more)

### Community 52 - "linkRequests.ts"
Cohesion: 0.15
Nodes (15): createRequest, generateToken(), getPendingForParent, internalGetById, internalGetByToken, internalGetParentName, internalGetStudentEmail, internalGetStudentName (+7 more)

### Community 53 - "pricing.ts"
Cohesion: 0.19
Nodes (16): billedSeats(), PRICING_SCALE, PricingScale, PricingTier, quoteSeatAmendment(), quoteSeatAmendmentWithScale(), quoteSubscription(), quoteWithScale() (+8 more)

### Community 54 - "game-map.tsx"
Cohesion: 0.08
Nodes (37): pioWalkFacing(), GameMap(), MapNodeContext, Props, WorldBackdrop(), CameraHandle, Gesture, MAX_SCALE (+29 more)

### Community 55 - "convex_generated_api_internal"
Cohesion: 0.21
Nodes (11): isReadingLearnerClass(), READING_LEARNER_CLASSES, READING_LEARNERS, convex_generated_api_internal, PromptTarget, promptToRead, SpeakResult, MAX_SPOKEN_PROMPT_CHARS (+3 more)

### Community 56 - "reports.ts"
Cohesion: 0.16
Nodes (13): callerMayReadStudent(), generate, getById, getGuardians, getStudentProfile, internalGetById, listByParent, listByStudent (+5 more)

### Community 57 - "vitest"
Cohesion: 0.09
Nodes (18): buildTopicReport(), EXERCISE_TYPE_LABELS, formatExerciseType(), ReportExercise, TopicReportContent, createMockCtx(), EqCondition, FieldRef (+10 more)

### Community 58 - "ios-brand-assets.swift"
Cohesion: 0.14
Nodes (16): CGContext, CGFloat, CGImage, CGRect, CoreGraphics, Generated iOS icon and launch screen (pnpm ios:brand), Foundation, ImageIO (+8 more)

### Community 59 - "badge-icon.tsx"
Cohesion: 0.15
Nodes (10): BadgeShield(), hashString(), ICON_MAP, LOCKED_METAL, Metal, PALETTES, pickPalette(), pickShape() (+2 more)

### Community 60 - "prompts.ts"
Cohesion: 0.12
Nodes (23): StepCard(), TopicTrail(), difficultyStage, ageForClass(), buildPalierBasePrompt(), buildPalierBaseSystemPrompt(), buildPersonalizedPrompt(), buildPersonalizedSystemPrompt() (+15 more)

### Community 61 - "subscriptionRules.ts"
Cohesion: 0.22
Nodes (10): SubscriptionStatus, OverdueInput, PostPaymentInput, ActivatableStatus, ActivationDecision, ActivationDenyReason, ActivationInput, ContractPeriod (+2 more)

### Community 62 - "convex/badges.ts"
Cohesion: 0.07
Nodes (39): AdminBadgesPage(), StreakRibbon(), catalogReadable(), BADGE_CONDITIONS, BadgeEvaluation, badgeParams, buildSnapshot(), conditionText() (+31 more)

### Community 63 - "design.md"
Cohesion: 0.16
Nodes (11): createDrafts, create, @playwright/test, Original data model (profiles, studentGuardians, subjects, topics, exercises, attempts, studentTopicProgress, badges, pdfUploads, topicReports), MVP decision log (10 decisions), ExercisePlayer orchestrator with QCM, DragDrop, Match, Order, ShortAnswer components, Managua: gamified educational web app for CE2-CM2 (8-10 years), francophone/Senegalese focus, PDF flow: mutation create -> scheduler -> internalAction extract -> internalMutation createDrafts (+3 more)

### Community 64 - "compilerOptions"
Cohesion: 0.12
Nodes (15): compilerOptions, allowJs, allowSyntheticDefaultImports, forceConsistentCasingInFileNames, isolatedModules, jsx, lib, module (+7 more)

### Community 65 - "app/layout.tsx"
Cohesion: 0.17
Nodes (9): app_globals, amiri, fredoka, geistMono, metadata, poppins, convex, ConvexClientProvider() (+1 more)

### Community 66 - "layout.app.tsx"
Cohesion: 0.23
Nodes (10): viewport, BottomNav(), isActivePath(), isFocusRoute(), NAV, StudentLayout(), AccessGate(), Focus-mode cream status bar and palier-end frosted override (+2 more)

### Community 67 - "badges/page.app.tsx"
Cohesion: 0.12
Nodes (22): BadgeRow, EarnedRow, ProgressRow, SHELF_TONE, SHELVES, StudentBadgesPage(), Tab, StudentAlertTone (+14 more)

### Community 68 - "balloon-fx.tsx"
Cohesion: 0.30
Nodes (10): AirPuffs(), BalloonPop(), between(), BURST_DELAY, CONFETTI_COLORS, FxStyle, piece(), popParticles() (+2 more)

### Community 69 - "progression-niveau-etoiles-trophees.md"
Cohesion: 0.23
Nodes (12): checkAndAward, End-of-palier screen replaces the old victory screen, End screen counts stars on exercises actually played (exerciseCount), 3 per exercise, threshold scaled, Topic completed when all its paliers are (studentTopicProgress.completedAt), Trophy engine: catalogue conditions evaluated on a student snapshot (badgeRules.evaluateBadge), progression:rebuild backfill for pre-existing students, Recount from source, never blind increments, Single source of progression: palier end (palierAttempts.submitPalier) (+4 more)

### Community 70 - "devDependencies"
Cohesion: 0.12
Nodes (16): devDependencies, @capacitor/cli, eslint, eslint-config-next, jsdom, shadcn, tailwindcss, @tailwindcss/postcss (+8 more)

### Community 71 - "progressionRules.ts"
Cohesion: 0.11
Nodes (37): submitPalier, AttemptForScoring, BASE_SCORE_BY_ATTEMPT, clampAttempt(), computeExerciseScore(), computePalierScore(), ExerciseScoreInput, PALIER_VALIDATION_THRESHOLD (+29 more)

### Community 72 - "dragDropRepair.ts"
Cohesion: 0.24
Nodes (14): DragDropItem, DragDropRepairInput, DragDropRepairOutcome, isCalculation(), isGenericZoneLabel(), lettersWithoutInitials(), normalise(), oneItemPerZone() (+6 more)

### Community 73 - "admin/exercises/edit/page.tsx"
Cohesion: 0.17
Nodes (4): ExerciseEditPageInner(), ExerciseType, getDefaultPayload(), TYPE_OPTIONS

### Community 74 - "app/page.tsx"
Cohesion: 0.23
Nodes (9): HowItWorks(), Step, STEPS, ScrollToTop(), FadeIn(), MotionWrapperProps, ScaleIn(), StaggerContainer() (+1 more)

### Community 75 - "capacitor-ios.md"
Cohesion: 0.15
Nodes (14): PostAuthPage(), Android app target (Gradle project in android/, Capacitor 8.5.2, SDK 36, Java 21), Capacitor router serves root index.html for any extensionless path, App opening is client-side (NativeAppGate -> router.replace('/post-auth')), Dynamic [id] routes replaced by query parameters, Export mode constraints: trailingSlash, unoptimized images, Logout: the only deliberate document navigation, Never use window.location.href for internal navigation (+6 more)

### Community 76 - "gamification.tsx"
Cohesion: 0.23
Nodes (10): BadgeItem, BADGES, BadgesCard(), Gamification(), MASTERY, MasteryCard(), STREAK_DAYS, StreakCard() (+2 more)

### Community 77 - "factCheck.ts"
Cohesion: 0.29
Nodes (11): checkMathExercise(), evaluateExpression(), FactCheckOutcome, parseAnswerNumber(), parseExpression(), parseFactor(), parseNumber(), parsePower() (+3 more)

### Community 78 - "DragDropExercise.tsx"
Cohesion: 0.24
Nodes (7): DragDropExercise(), DragDropExerciseProps, DragDropPayload, itemId(), zoneColors, zoneId(), @dnd-kit/core

### Community 79 - "modules.ts"
Cohesion: 0.10
Nodes (29): ModuleMedallion(), addTtsChars, callerContext, consumeSttQuota, findClip, MODULE_KEY, recordServerAttempt, saveClip (+21 more)

### Community 80 - "exercise-types.tsx"
Cohesion: 0.20
Nodes (3): ExerciseCard, ExerciseTypes(), TYPES

### Community 81 - "section.tsx"
Cohesion: 0.29
Nodes (7): FAQ(), ITEMS, ForWhom(), Persona, PERSONAS, Section(), SectionProps

### Community 82 - "convex/auth.ts"
Cohesion: 0.24
Nodes (8): auth, isAuthenticated, signIn, signOut, store, decideProvisionedRole(), PROVISIONABLE, ProvisionableRole

### Community 83 - "formatDay"
Cohesion: 0.24
Nodes (10): BillingSection(), classContext(), ContractActivation(), formatDay(), formatEventMoment(), formatFcfa(), MembershipHistory(), ModulesSection() (+2 more)

### Community 84 - "subjects/page.app.tsx"
Cohesion: 0.12
Nodes (14): PalierNode, SubjectTrailPageInner(), TreasureMark(), GameButton(), Props, Size, SIZES, Tone (+6 more)

### Community 85 - "module-arabe-coran.md"
Cohesion: 0.16
Nodes (18): ArabicLessonPage(), ArabicGlyph(), FALLBACK, fontSpec(), Ink, inkCache, inkIfFontReady(), measureInk() (+10 more)

### Community 86 - "SubscriptionSection"
Cohesion: 0.36
Nodes (9): ADMIN_STATUSES, fromDayInput(), plural(), seatsContractLabel(), SeatsFullNotice(), seatsUsedLabel(), SeatUsageNotice(), SubscriptionSection() (+1 more)

### Community 87 - "footer.tsx"
Cohesion: 0.67
Nodes (3): COLUMNS, Footer(), FooterColumn

### Community 88 - "hero.tsx"
Cohesion: 0.25
Nodes (4): ElegantShape(), ElegantShapeProps, Hero(), ROTATING_WORDS

### Community 89 - "profiles.ts"
Cohesion: 0.13
Nodes (19): studentIdsTaughtBy(), listByTeacherStudents, decideProfileUpdate(), objectPreferences(), ProfileUpdateDecision, ProfileUpdateFields, ProfileUpdatePatch, wantsReportEmail() (+11 more)

### Community 90 - "students.ts"
Cohesion: 0.12
Nodes (34): SubjectDetailPageInner(), TopicLevelFields(), buildStudentSnapshot(), DEFAULT_PALIERS_BY_CLASS, defaultPalierCount(), effectivePalierCount(), exercisesForTopic(), FALLBACK_PALIER_COUNT (+26 more)

### Community 91 - "comptes-et-acces.md"
Cohesion: 0.21
Nodes (10): LoginPage(), signUpWithCode, provisionStaffAccount, Parent activation on /register with a single-use expiring school code, Accounts only by provisioning: four paths (directeur, professeur, student, parent), Password.profile() refuses flow 'signUp', Known weakness: parentLink.signUpWithCode is public, unauthenticated, not rate limited, Directeur/professeur receive initial credentials from the Jotna team (+2 more)

### Community 92 - "ref_convex_generated_datamodel"
Cohesion: 0.11
Nodes (8): CONDITION_LABELS, TeacherExercise, TeacherExercisesPage(), TYPE_COLORS, TYPE_LABELS, Explanation, Status, ref_convex_generated_datamodel

### Community 93 - "drafts/page.tsx"
Cohesion: 0.33
Nodes (4): DraftsPage(), TYPE_COLORS, TYPE_LABELS, useTopicsMap()

### Community 94 - "admin/pdf-uploads/detail/page.tsx"
Cohesion: 0.38
Nodes (5): EXERCISE_TYPE_LABELS, formatDate(), formatFileSize(), PdfUploadDetailPageInner(), STATUS_STEPS

### Community 95 - "teacher/pdf-uploads/detail/page.tsx"
Cohesion: 0.38
Nodes (5): EXERCISE_TYPE_LABELS, formatDate(), formatFileSize(), STATUS_STEPS, TeacherPdfUploadDetailPageInner()

### Community 96 - "admin/pdf-uploads/page.tsx"
Cohesion: 0.47
Nodes (5): formatDate(), formatFileSize(), PdfUploadsPage(), TODO: Replace with actual admin profile ID from auth context, STATUS_CONFIG

### Community 97 - "OrderExercise.tsx"
Cohesion: 0.22
Nodes (7): itemColors, OrderExercise(), OrderExerciseProps, OrderPayload, OrderTile, @dnd-kit/sortable, @dnd-kit/utilities

### Community 99 - "serve-export.mjs"
Cohesion: 0.33
Nodes (5): ref_node_fs, ref_node_http, ref_node_path, port, types

### Community 100 - "teacher/pdf-uploads/page.tsx"
Cohesion: 0.60
Nodes (4): formatDate(), formatFileSize(), STATUS_CONFIG, TeacherPdfUploadsPage()

### Community 102 - "ProvisionStaffForm"
Cohesion: 0.67
Nodes (3): ProvisionStaffForm(), STAFF_ROLES, StaffSection()

### Community 104 - "access.ts"
Cohesion: 0.21
Nodes (12): callerHasProfile(), callerRole(), currentProfile(), getAccessState, AccessInput, AccessReason, AccessState, decideAccess() (+4 more)

### Community 112 - "convex"
Cohesion: 0.29
Nodes (6): ArabicPlacementList(), PLACEMENT_NOTICE, PlacementCatalog, PlacementRow(), PLACEMENT_LEVELS, convex

### Community 116 - "Two build targets: website (no student space) vs iOS/Android app"
Cohesion: 0.25
Nodes (11): Rule: read convex/_generated/ai/guidelines.md before Convex work, Rule: this is NOT the Next.js you know (read node_modules/next/dist/docs first), Two build targets: website (no student space) vs iOS/Android app, CI step Build (application iOS/Android): requires out/student/home/index.html, CI step Build (site web): fails if out/student exists, CI job verify (Lint, typecheck, test, build), HAS_STUDENT_SPACE, STUDENT_APP_ONLY_PATH (+3 more)

### Community 117 - "auth-store.ts"
Cohesion: 0.28
Nodes (7): zustand, AuthActions, AuthState, useAuthStore, User, mockAdminUser, mockUser

### Community 119 - "published/page.tsx"
Cohesion: 0.33
Nodes (4): PublishedPage(), TYPE_COLORS, TYPE_LABELS, useTopicsMap()

## Ambiguous Edges - Review These
- `posterFor()` → `Extending the game (subject, palier count, mission type, trail shape, Pio pose, Pio line)`  [AMBIGUOUS]
  docs/monde-de-pio.md · relation: references
- `normalizeRarities` → `badges:normalizeCatalog one-off threshold fix`  [AMBIGUOUS]
  docs/progression-niveau-etoiles-trophees.md · relation: conceptually_related_to
- `createChildProfile` → `Removed profiles.createChildAccount and /parent/children/add`  [AMBIGUOUS]
  docs/comptes-et-acces.md · relation: conceptually_related_to
- `Two build targets: website (no student space) vs iOS/Android app` → `README.md`  [AMBIGUOUS]
  README.md · relation: conceptually_related_to
- `allowBuilds (unresolved placeholders for esbuild, msw, sharp, unrs-resolver)` → `ignoredBuiltDependencies: sharp, unrs-resolver`  [AMBIGUOUS]
  pnpm-workspace.yaml · relation: conceptually_related_to
- `Pio walk: constant speed, 0.45-2.4 s per step, whole-sprite bounce, camera follows` → `Walk speed 90 world-px per second (WALK_SPEED), matched to the clip's steps`  [AMBIGUOUS]
  docs/monde-de-pio.md · relation: conceptually_related_to
- `MVP final status: 28 routes build, 119 unit tests (9 files), 5 Playwright E2E files` → `Managua MVP implementation plan (6 phases, 60+ items)`  [AMBIGUOUS]
  tasks/todo.md · relation: conceptually_related_to
- `Android app target (Gradle project in android/, Capacitor 8.5.2, SDK 36, Java 21)` → `Not covered: no native plugins, no App Store publication`  [AMBIGUOUS]
  docs/capacitor-ios.md · relation: conceptually_related_to

## Knowledge Gaps
- **601 isolated node(s):** `state`, `loadedData`, `CONDITION_LABELS`, `StaffRow`, `ClassRow` (+596 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 832 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **10 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **What is the exact relationship between `posterFor()` and `Extending the game (subject, palier count, mission type, trail shape, Pio pose, Pio line)`?**
  _Edge tagged AMBIGUOUS (relation: references) - confidence is low._
- **What is the exact relationship between `normalizeRarities` and `badges:normalizeCatalog one-off threshold fix`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._
- **What is the exact relationship between `createChildProfile` and `Removed profiles.createChildAccount and /parent/children/add`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._
- **What is the exact relationship between `Two build targets: website (no student space) vs iOS/Android app` and `README.md`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._
- **What is the exact relationship between `allowBuilds (unresolved placeholders for esbuild, msw, sharp, unrs-resolver)` and `ignoredBuiltDependencies: sharp, unrs-resolver`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._
- **What is the exact relationship between `Pio walk: constant speed, 0.45-2.4 s per step, whole-sprite bounce, camera follows` and `Walk speed 90 world-px per second (WALK_SPEED), matched to the clip's steps`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._
- **What is the exact relationship between `MVP final status: 28 routes build, 119 unit tests (9 files), 5 Playwright E2E files` and `Managua MVP implementation plan (6 phases, 60+ items)`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._