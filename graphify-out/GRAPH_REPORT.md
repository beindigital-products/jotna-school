# Graph Report - waiting-list-remove-payment-6af041  (2026-10-05)

## Corpus Check
- 404 files · ~378,681 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 7 file(s) not represented in the graph (top: (none) 4, .tsv 2, .css 1)

## Summary
- 2883 nodes · 7248 edges · 120 communities (109 shown, 11 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 206 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `2ea24af5`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- convex
- billingRules.ts
- session/page.app.tsx
- lecon/page.app.tsx
- DragDropExercise.tsx
- placement.ts
- arabic.test.ts
- arabe/page.app.tsx
- email-brand.ts
- schools.ts
- session.ts
- convex/curriculum.ts
- studentImport.ts
- paliers/index.ts
- ecoles/detail/page.tsx
- hifz.ts
- streak.ts
- pregen.ts
- quests.ts
- access.ts
- convex_generated_server
- mathRepair.ts
- progress
- Two build targets: website (no student space) vs iOS/Android app
- sidebar.tsx
- palierAttempts.ts
- package.json
- ExercisePlayer.tsx
- exercises.ts
- ref_lucide_react
- drills.tsx
- tracing-canvas.tsx
- aiGateway/index.ts
- dependencies
- ExercisePreview.tsx
- profiles.ts
- motion/package.json
- use-device-tier.ts
- components.json
- palier-result.tsx
- voice.ts
- student.tsx
- @playwright/test
- MapViewport
- monde-de-pio.md
- pio-animations.md
- compilerOptions
- setSoundEnabledLocal
- Parents.tsx
- lib/auth.ts
- encaissement-mise-en-service.md
- billing.ts
- linkRequests.ts
- pricing.ts
- trail-geometry.ts
- Presentation.tsx
- Outro.tsx
- vitest
- ios-brand-assets.swift
- badges/page.app.tsx
- prompts.ts
- game-map.tsx
- convex/badges.ts
- prompt-reader.tsx
- compilerOptions
- app/layout.tsx
- PalierResultScreen
- MatchExercise.tsx
- sound-opt-in-dialog.tsx
- paliers-et-exercices.md
- devDependencies
- progressionRules.ts
- dragDropRepair.ts
- admin/exercises/edit/page.tsx
- app/page.tsx
- capacitor-ios.md
- gamification.tsx
- factCheck.ts
- Students.tsx
- ref_react
- Pio animations are OpenArt video clips, native app only (web shows the still pose)
- School.tsx
- Teachers.tsx
- formatDay
- subscriptionRules.ts
- module-arabe-coran.md
- SubscriptionSection
- compilerOptions
- hero.tsx
- waitlist.tsx
- students.ts
- arabic/db.ts
- billingPaydunya.ts
- waitlist.ts
- admin/pdf-uploads/detail/page.tsx
- published/page.tsx
- exercise-types.tsx
- billingBictorys.ts
- http.ts
- capture-landing.mjs
- answerCheck.ts
- OrderExercise.tsx
- SubjectTrailPageInner
- Motion design de Jotna School
- accessRules.ts
- postcss.config.mjs
- ios-brand-assets.sh script
- auth.config.ts
- Afro.tools MCP server (African API specs registry)
- liste-attente/page.tsx
- usePioWalker
- section.tsx
- gamification-store.ts
- reset-password/page.tsx
- auth-store.ts
- prepare-audio.sh
- pnpm-workspace.yaml

## God Nodes (most connected - your core abstractions)
1. `convex` - 123 edges
2. `refusalMessage()` - 67 edges
3. `next` - 62 edges
4. `cn()` - 55 edges
5. `vitest` - 53 edges
6. `progress()` - 51 edges
7. `callerIsAdmin()` - 49 edges
8. `framer-motion` - 39 edges
9. `@convex-dev/auth` - 34 edges
10. `checkAccess()` - 29 edges

## Surprising Connections (you probably didn't know these)
- `Arabic glyph centered on its ink, not on the baseline` --references--> `amiri`  [INFERRED]
  docs/module-arabe-coran.md → app/layout.tsx
- `PioState` --implements--> `Nine everyday clips: idle, hello, cheer, sad, amazed, encourage, think, sleep, walk`  [INFERRED]
  components/student/pio.tsx → docs/pio-animations.md
- `Extending the game (subject, palier count, mission type, trail shape, Pio pose, Pio line)` --references--> `posterFor()`  [AMBIGUOUS]
  docs/monde-de-pio.md → components/student/pio.tsx
- `bictorysOutcome()` --implements--> `Unverified payment assumptions (authorized = pending, reversed = failure, no per-method caps)`  [INFERRED]
  convex/billingRules.ts → docs/encaissement-mise-en-service.md
- `difficultyStage` --implements--> `Palier difficulty relative to the topic's palier count`  [INFERRED]
  convex/palierRules.ts → docs/paliers-et-exercices.md

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **CLI operations guarded by confirmDeployment (real spend or writes)** — docs_comptes_et_acces_confirm_deployment_guard, convex_testseedsschool_seedtestschool, convex_paliers_pregen_run, convex_paliers_pregen_invalidate, convex_paliers_pregen_repairmath, convex_paliers_pregen_repairdragdrop [EXTRACTED 1.00]
- **Two build targets: website without student space vs Capacitor app** — docs_capacitor_ios_two_build_targets, next_config_nextconfig, lib_build_target, github_workflows_ci_build_site_web, github_workflows_ci_build_app, app_eleve_page_studentapponlypage, package_scripts_build_app [EXTRACTED 1.00]
- **Pure rule modules unit-tested without convex-test** — docs_module_arabe_coran_pure_rule_functions_pattern, convex_arabic_placementrules, convex_palierrules, convex_questrules, convex_tests_palierrules_test, convex_tests_questrules_test [INFERRED 0.85]

## Communities (120 total, 11 thin omitted)

### Community 0 - "convex"
Cohesion: 0.05
Nodes (48): AdminAiSettingsPage(), CONDITION_LABELS, SchoolImportPageInner(), handleImport(), SchoolsPage(), STATUS_CLASS, STATUS_LABEL, DraftsPage() (+40 more)

### Community 1 - "billingRules.ts"
Cohesion: 0.18
Nodes (16): AMENDMENT_DUE_DELAY_MS, decideOverdue(), INSTALLMENT_COUNT, INSTALLMENT_STEP_MS, installmentDueDates(), OverdueDecision, PaymentApplicationInput, PaymentDecision (+8 more)

### Community 2 - "session/page.app.tsx"
Cohesion: 0.09
Nodes (16): AttemptProgress, PalierResult, SanitizedExo, SceneAlert, CapRegenAlternatives(), JotnaLoader(), ExplainStepByStep(), AnswerFeedback() (+8 more)

### Community 3 - "lecon/page.app.tsx"
Cohesion: 0.08
Nodes (46): ReadingStep(), ReciteStep(), RecordAttempt, StepProps, SayButton(), CoachLine(), describe(), ListenButton() (+38 more)

### Community 4 - "DragDropExercise.tsx"
Cohesion: 0.24
Nodes (7): DragDropExercise(), DragDropExerciseProps, DragDropPayload, itemId(), zoneColors, zoneId(), @dnd-kit/core

### Community 5 - "placement.ts"
Cohesion: 0.10
Nodes (42): ModuleMedallion(), callerProfile(), getLesson(), callerContext, completeLesson, drillValidator, getLessonState, getPath (+34 more)

### Community 6 - "arabic.test.ts"
Cohesion: 0.08
Nodes (43): MAX_STRENGTH, LETTER_WORDS, judgePronunciation(), judgeReading(), judgeRecitation(), LATIN_ALIASES, LATIN_AMBIGUOUS, LatinForms (+35 more)

### Community 7 - "arabe/page.app.tsx"
Cohesion: 0.05
Nodes (64): ArabicAlphabetPage(), ArabicLessonPageInner(), ArabePathPage(), renderNode(), shake(), HifzState, LessonCard(), KAABA_HEIGHT (+56 more)

### Community 8 - "email-brand.ts"
Cohesion: 0.06
Nodes (49): auth, isAuthenticated, signIn, signOut, store, METHOD_LABEL, sendInvoiceEmail, sendLinkRequestEmail (+41 more)

### Community 9 - "schools.ts"
Cohesion: 0.08
Nodes (47): callerAdminProfile(), callerIsAdmin(), currentSchoolSubscription(), graceAnchorFor(), loadAccessInput(), amendmentDueAt(), convex_generated_server_queryctx, activateSubscription (+39 more)

### Community 10 - "session.ts"
Cohesion: 0.09
Nodes (35): StepView(), MatchPictures(), DOT_LABEL, FORM_LABELS, LetterCard(), ArabicLetter, ArabicLetterKey, Articulation (+27 more)

### Community 11 - "convex/curriculum.ts"
Cohesion: 0.10
Nodes (36): TopicLevelFields(), catalogAccess(), assertVisibleClass(), classEnum, ClassName, HIDDEN, HIDDEN_CLASSES, isHiddenClass() (+28 more)

### Community 12 - "studentImport.ts"
Cohesion: 0.07
Nodes (40): LoginPage(), buildLoginCode(), buildParentCode(), CLASS_LEVELS, IMPORT_ROWS_LIMIT, ImportParseError, ImportParseResult, normalizeCode() (+32 more)

### Community 13 - "paliers/index.ts"
Cohesion: 0.07
Nodes (41): topicOpenTo(), convex_generated_server_actionctx, AnswerInputMode, BucketArgs, checkPalierProgression, exerciseTypeValidator, extractConcept(), findBucket (+33 more)

### Community 14 - "ecoles/detail/page.tsx"
Cohesion: 0.05
Nodes (34): AdminStatus, AmendableContract, BillingScheduleView, CandidateList, CLASS_LEVELS, ClassCard(), ClassesSection(), ClassLevel (+26 more)

### Community 15 - "hifz.ts"
Cohesion: 0.19
Nodes (23): MaskedText(), clampStrength(), firstLetter(), HifzRow, hifzStates(), HifzSurahState, isDue(), linkPointOf() (+15 more)

### Community 16 - "streak.ts"
Cohesion: 0.17
Nodes (21): requireAccess(), markBadgesSeen, addDaysYmd(), applyActivity(), applyRollover(), dailyStreakRollover, daysBetween(), recordKidActivity (+13 more)

### Community 17 - "pregen.ts"
Cohesion: 0.09
Nodes (26): insertGeneratedExercises, isBaseExercise(), BucketOutcome, dedupe, DragDropBatch, DragDropSample, DragDropSummary, invalidate (+18 more)

### Community 18 - "quests.ts"
Cohesion: 0.13
Nodes (33): ActivityEvent, ALL_DONE_BONUS, allDone(), applyActivity(), bonusStarsFor(), completedCount(), EASY_TARGETS, gainFor() (+25 more)

### Community 19 - "access.ts"
Cohesion: 0.09
Nodes (35): blockedStudent(), callerHasProfile(), callerRole(), checkAccess(), currentProfile(), getAccessState, getAccessStateForProfile, studentIdsTaughtBy() (+27 more)

### Community 20 - "convex_generated_server"
Cohesion: 0.05
Nodes (54): generateExplanation, readVerdict(), verifyShortAnswerWithAI, crons, purgeOldHistory, buildPrompt(), explainExercise, ExplainResult (+46 more)

### Community 21 - "mathRepair.ts"
Cohesion: 0.17
Nodes (30): acceptedForms(), closestOption(), evaluateLeftToRight(), formatNumber(), isConsistent(), isFraction(), isNumericForm(), isOperandOf() (+22 more)

### Community 22 - "progress"
Cohesion: 0.09
Nodes (45): Backdrop(), BackdropProps, ElegantShape(), HALOS, ShapeProps, Bullet, ChapterText(), Props (+37 more)

### Community 23 - "Two build targets: website (no student space) vs iOS/Android app"
Cohesion: 0.13
Nodes (24): Rule: read convex/_generated/ai/guidelines.md before Convex work, Rule: this is NOT the Next.js you know (read node_modules/next/dist/docs first), StudentAppOnlyPage(), Static export packaged by Capacitor (no Next server on device), Two build targets: website (no student space) vs iOS/Android app, CI step Build (application iOS/Android): requires out/student/home/index.html, CI step Build (site web): fails if out/student exists, Lint step non-blocking (continue-on-error) (+16 more)

### Community 24 - "sidebar.tsx"
Cohesion: 0.06
Nodes (62): sidebarLinks, sidebarLinks, sidebarLinks, Brand(), BrandProps, BrandSize, SIZES, LINKS (+54 more)

### Community 25 - "palierAttempts.ts"
Cohesion: 0.12
Nodes (33): canonicalAnswer(), requestHint, submitPalier, verifyAttempt, verifyByType(), verifyOrder(), verifyQcm(), verifyShortAnswer() (+25 more)

### Community 26 - "package.json"
Cohesion: 0.07
Nodes (28): config, eslintConfig, lucide-react, react, react-dom, @types/react, typescript, name (+20 more)

### Community 27 - "ExercisePlayer.tsx"
Cohesion: 0.10
Nodes (20): PalierSession(), ExerciseData, ExercisePlayer(), ExercisePlayerProps, ExerciseType, optionColors, QcmExercise(), QcmExerciseProps (+12 more)

### Community 28 - "exercises.ts"
Cohesion: 0.11
Nodes (26): callerIsStaff(), callerStaffProfile(), create, getById, listAllDrafts, listAllPublished, listByTeacher, listByTopic (+18 more)

### Community 29 - "ref_lucide_react"
Cohesion: 0.04
Nodes (19): ForgotPasswordPage(), formatDate(), TeacherDashboardPage(), formatDate(), TeacherStudentDetailPageInner(), ArabicPlacementList(), PLACEMENT_NOTICE, PlacementCatalog (+11 more)

### Community 30 - "drills.tsx"
Cohesion: 0.09
Nodes (34): LessonSummary(), WriteStep(), StudentHomePage(), tapPio(), AirPuffs(), BalloonPop(), between(), BURST_DELAY (+26 more)

### Community 31 - "tracing-canvas.tsx"
Cohesion: 0.16
Nodes (24): clamp01(), inkOrigin(), rasterizeGlyph(), targetCache, TraceOutcome, TracingCanvas(), What the module does not do (tajwid, binding trace grade, memorization certificate, class dashboard, translation), alphaToGrid() (+16 more)

### Community 32 - "aiGateway/index.ts"
Cohesion: 0.05
Nodes (66): BudgetContext, BudgetDecision, BudgetTier, evaluateBudget(), GENERATIVE_PURPOSES, KID_INITIATED_PURPOSES, projectMonthEndSpend(), addToMonthSpend() (+58 more)

### Community 33 - "dependencies"
Cohesion: 0.09
Nodes (26): dependencies, @auth/core, @base-ui/react, canvas-confetti, @capacitor/core, @capacitor/ios, class-variance-authority, clsx (+18 more)

### Community 34 - "ExercisePreview.tsx"
Cohesion: 0.10
Nodes (18): DragDropPayload, DragDropPreview(), DragDropPreviewProps, ExercisePreview(), ExercisePreviewProps, ExerciseType, MatchPayload, MatchPreview() (+10 more)

### Community 35 - "profiles.ts"
Cohesion: 0.11
Nodes (21): convex_generated_server_mutation, decideLinkChild(), LinkDecision, LinkDenyReason, LinkInput, LinkRelation, requiredRoleFor(), attachGuardianByCode (+13 more)

### Community 36 - "motion/package.json"
Cohesion: 0.05
Nodes (35): dependencies, lucide-react, react, react-dom, remotion, @remotion/cli, @remotion/google-fonts, @remotion/paths (+27 more)

### Community 37 - "use-device-tier.ts"
Cohesion: 0.24
Nodes (9): SavannaBackdrop(), Variant, Device tier lite/full (saveData, <=2 GB RAM, <=3 cores, 2G) (G5), detect(), getServerSnapshot(), getSnapshot(), NavigatorHints, noSubscribe() (+1 more)

### Community 38 - "components.json"
Cohesion: 0.09
Nodes (21): aliases, components, hooks, lib, ui, utils, iconLibrary, menuAccent (+13 more)

### Community 39 - "palier-result.tsx"
Cohesion: 0.09
Nodes (27): StepCard(), CONFETTI_COLORS, DotState, PalierResultView, TopicTrail(), UnseenBadge, useVictoryExtras(), LevelUpOverlay() (+19 more)

### Community 40 - "voice.ts"
Cohesion: 0.11
Nodes (32): isConsigneKey(), letterWord, acceptedFormsForLetter(), ALLOWED_MIME, audioContainer(), baseMime(), Expected, listVoices (+24 more)

### Community 41 - "student.tsx"
Cohesion: 0.09
Nodes (26): bezier(), CampScreen(), chunky(), Confetti(), GameButton(), GLYPHS, LessonCard(), LessonScreen() (+18 more)

### Community 43 - "MapViewport"
Cohesion: 0.16
Nodes (20): ZoomControls(), clamp(), initialScaleFor(), MapViewport(), beginPan(), beginPinch(), clampAxis(), clampScale() (+12 more)

### Community 44 - "monde-de-pio.md"
Cohesion: 0.15
Nodes (15): remember(), rememberedIndex(), WorldMapPage(), onArrive(), Stamp(), SubjectTrailPage(), Carnet (/student/profil): cream page with stamps (level, stars, exercises, trophies, streak), Four places, not screens: Camp, Carte, Trophees, Carnet (+7 more)

### Community 45 - "pio-animations.md"
Cohesion: 0.13
Nodes (19): CLIP, LABELS, OUTFITS, pioClipSources(), PioOutfit, POSES, resolvePose(), Arabe & Coran module (off by default, per school) (+11 more)

### Community 46 - "compilerOptions"
Cohesion: 0.10
Nodes (19): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+11 more)

### Community 47 - "setSoundEnabledLocal"
Cohesion: 0.31
Nodes (8): fileToSquareBlob(), StudentProfileEditPage(), formatDuration(), StudentProfilePage(), CLASS_LONG_NAMES, classLongName(), schoolClassDisplay(), setSoundEnabledLocal()

### Community 48 - "Parents.tsx"
Cohesion: 0.09
Nodes (22): ACCENT, DashboardShell(), DashButton(), HEADER_H, NavItem, Role, ROLES, ShellProps (+14 more)

### Community 49 - "lib/auth.ts"
Cohesion: 0.10
Nodes (15): ParentLayout(), BottomNav(), isActivePath(), NAV, TeacherLayout(), AccessGate(), viewport-fit=cover and env(safe-area-inset-*) padding, accessMessageForAdult() (+7 more)

### Community 50 - "encaissement-mise-en-service.md"
Cohesion: 0.29
Nodes (9): markOverdueInstallments, amount_short trap: Bictorys amount is net of fees, gross = amount + merchantFees, Bictorys chosen as payment provider over PayDunya, BILLING_PROVIDER env switch (bictorys default, paydunya fallback), Billing schema changes (installments indexes, payments.provider bictorys/manual, actorProfileId), Installment schedule created with the contract and reminded by the daily cron, Offline settlement ('Deja reglee hors ligne' -> 'Confirmer le reglement'), Unverified payment assumptions (authorized = pending, reversed = failure, no per-method caps) (+1 more)

### Community 51 - "billing.ts"
Cohesion: 0.14
Nodes (17): activeProvider(), applyPayment, ApplyPaymentResult, BillingSchedule, chargeProviderValidator, creditInstallment(), getSchedule, invoiceEmailData (+9 more)

### Community 52 - "linkRequests.ts"
Cohesion: 0.20
Nodes (10): createRequest, generateToken(), getPendingForParent, internalGetById, internalGetByToken, internalGetParentName, internalGetStudentEmail, internalGetStudentName (+2 more)

### Community 53 - "pricing.ts"
Cohesion: 0.19
Nodes (16): billedSeats(), PRICING_SCALE, PricingScale, PricingTier, quoteSeatAmendment(), quoteSeatAmendmentWithScale(), quoteSubscription(), quoteWithScale() (+8 more)

### Community 54 - "trail-geometry.ts"
Cohesion: 0.17
Nodes (17): TreasureMark(), GameMap(), buildTrail(), cubic(), SUBJECT_TRAIL, trailNodePoint(), trailNodePoints(), trailPathD() (+9 more)

### Community 55 - "Presentation.tsx"
Cohesion: 0.12
Nodes (21): BrandWipe(), STRIPES, WIPE_CUT, WIPE_FRAMES, boundaries, Presentation(), SCENES, starts (+13 more)

### Community 56 - "Outro.tsx"
Cohesion: 0.11
Nodes (18): BROWSER_BAR, BrowserFrame(), BrowserProps, PHONE_H, PHONE_W, PhoneFrame(), PhoneProps, BoubouPose (+10 more)

### Community 57 - "vitest"
Cohesion: 0.06
Nodes (28): loadedData, state, state, isReadingLearnerClass(), READING_LEARNER_CLASSES, READING_LEARNERS, createMockCtx(), EqCondition (+20 more)

### Community 58 - "ios-brand-assets.swift"
Cohesion: 0.14
Nodes (16): CGContext, CGFloat, CGImage, CGRect, CoreGraphics, Generated iOS icon and launch screen (pnpm ios:brand), Foundation, ImageIO (+8 more)

### Community 59 - "badges/page.app.tsx"
Cohesion: 0.09
Nodes (23): BadgeRow, EarnedRow, ProgressRow, SHELF_TONE, SHELVES, StudentBadgesPage(), Tab, BadgeShield() (+15 more)

### Community 60 - "prompts.ts"
Cohesion: 0.18
Nodes (16): AiPurpose, ageForClass(), buildPalierBasePrompt(), buildPalierBaseSystemPrompt(), buildPersonalizedPrompt(), buildPersonalizedSystemPrompt(), buildVariationSystemPrompt(), ClassLevel (+8 more)

### Community 61 - "game-map.tsx"
Cohesion: 0.12
Nodes (17): pioWalkFacing(), Props, WorldBackdrop(), CameraHandle, Gesture, MAX_SCALE, Props, PioWalker (+9 more)

### Community 62 - "convex/badges.ts"
Cohesion: 0.08
Nodes (35): AdminBadgesPage(), catalogReadable(), BADGE_CONDITIONS, BadgeEvaluation, badgeParams, buildSnapshot(), conditionText(), evaluateBadge() (+27 more)

### Community 63 - "prompt-reader.tsx"
Cohesion: 0.14
Nodes (15): ExercisePrompt(), parsePrompt(), PromptText(), PromptReader, PromptReaderButton(), PromptReaderContext, ReaderStatus, SpeakResult (+7 more)

### Community 64 - "compilerOptions"
Cohesion: 0.12
Nodes (15): compilerOptions, allowJs, allowSyntheticDefaultImports, forceConsistentCasingInFileNames, isolatedModules, jsx, lib, module (+7 more)

### Community 65 - "app/layout.tsx"
Cohesion: 0.18
Nodes (9): app_globals, amiri, fredoka, metadata, poppins, viewport, convex, ConvexClientProvider() (+1 more)

### Community 66 - "PalierResultScreen"
Cohesion: 0.47
Nodes (6): isFocusRoute(), StudentLayout(), PalierResultScreen(), useBareStatusBar(), Focus-mode cream status bar and palier-end frosted override, End-of-palier screen replaces the old victory screen

### Community 67 - "MatchExercise.tsx"
Cohesion: 0.17
Nodes (12): MatchExercise(), MatchExerciseProps, MatchPayload, pairColors, payload, dragDropAnswer(), linkTiles(), matchAnswer() (+4 more)

### Community 68 - "sound-opt-in-dialog.tsx"
Cohesion: 0.25
Nodes (9): StudentAlertTone, toneStyles, Dialog(), DialogContent(), DialogDescription(), DialogFooter(), DialogHeader(), DialogOverlay() (+1 more)

### Community 69 - "paliers-et-exercices.md"
Cohesion: 0.17
Nodes (15): checkAndAward, Students only see topics of their level (profiles.class), Dev database content state (2026-09-27): duplicate and level-less topics, Paliers expire after a term (PALIER_TTL_MS) and regenerate on demand, Palier difficulty relative to the topic's palier count, End screen counts stars on exercises actually played (exerciseCount), 3 per exercise, threshold scaled, Topic completed when all its paliers are (studentTopicProgress.completedAt), Trophy engine: catalogue conditions evaluated on a student snapshot (badgeRules.evaluateBadge) (+7 more)

### Community 70 - "devDependencies"
Cohesion: 0.05
Nodes (36): createDrafts, create, buildTopicReport(), EXERCISE_TYPE_LABELS, formatExerciseType(), ReportExercise, TopicReportContent, generate (+28 more)

### Community 71 - "progressionRules.ts"
Cohesion: 0.16
Nodes (21): StreakRibbon(), AttemptRow, bestStarsByPalier(), computeLevel(), EXOS_PER_LEVEL, exosToNextLevel(), isFinished(), isFirstTry() (+13 more)

### Community 72 - "dragDropRepair.ts"
Cohesion: 0.25
Nodes (13): DragDropItem, DragDropRepairInput, DragDropRepairOutcome, isCalculation(), isGenericZoneLabel(), lettersWithoutInitials(), normalise(), oneItemPerZone() (+5 more)

### Community 73 - "admin/exercises/edit/page.tsx"
Cohesion: 0.17
Nodes (4): ExerciseEditPageInner(), ExerciseType, getDefaultPayload(), TYPE_OPTIONS

### Community 74 - "app/page.tsx"
Cohesion: 0.18
Nodes (12): ForWhom(), Persona, PERSONAS, HowItWorks(), Step, STEPS, ScrollToTop(), FadeIn() (+4 more)

### Community 75 - "capacitor-ios.md"
Cohesion: 0.12
Nodes (17): ArabicLessonPage(), createChildProfile, Android app target (Gradle project in android/, Capacitor 8.5.2, SDK 36, Java 21), Capacitor router serves root index.html for any extensionless path, Dynamic [id] routes replaced by query parameters, Export mode constraints: trailingSlash, unoptimized images, Logout: the only deliberate document navigation, Never use window.location.href for internal navigation (+9 more)

### Community 76 - "gamification.tsx"
Cohesion: 0.23
Nodes (10): BadgeItem, BADGES, BadgesCard(), Gamification(), MASTERY, MasteryCard(), STREAK_DAYS, StreakCard() (+2 more)

### Community 77 - "factCheck.ts"
Cohesion: 0.29
Nodes (11): checkMathExercise(), evaluateExpression(), FactCheckOutcome, parseAnswerNumber(), parseExpression(), parseFactor(), parseNumber(), parsePower() (+3 more)

### Community 78 - "Students.tsx"
Cohesion: 0.14
Nodes (12): ClickSounds(), Cursor(), CursorKey, positionAt(), Props, IN_OUT, LINES, NBSP (+4 more)

### Community 79 - "ref_react"
Cohesion: 0.08
Nodes (31): TAP_POSES, LogoutCard(), LogoutCard(), PalierNode, SubjectBanner(), Explanation, Status, GameButton() (+23 more)

### Community 80 - "Pio animations are OpenArt video clips, native app only (web shows the still pose)"
Cohesion: 0.25
Nodes (9): PostAuthPage(), NativeAppGate(), App opening is client-side (NativeAppGate -> router.replace('/post-auth')), Official Pio avatar replaces the MVP round-bird SVG, Pio animations are OpenArt video clips, native app only (web shows the still pose), noSubscribe(), useIsNativeApp(), framer-motion (+1 more)

### Community 81 - "School.tsx"
Cohesion: 0.16
Nodes (14): BROWSER, Fiche(), LINES, press(), SchoolImportPage(), SchoolScene(), scrollFiche(), TICKETS (+6 more)

### Community 82 - "Teachers.tsx"
Cohesion: 0.19
Nodes (13): countUp(), ACTIVITY, BROWSER, Dashboard(), GENERATED, Kpi(), PageIn(), PdfPage() (+5 more)

### Community 83 - "formatDay"
Cohesion: 0.24
Nodes (10): BillingSection(), classContext(), ContractActivation(), formatDay(), formatEventMoment(), formatFcfa(), MembershipHistory(), ModulesSection() (+2 more)

### Community 84 - "subscriptionRules.ts"
Cohesion: 0.22
Nodes (10): SubscriptionStatus, OverdueInput, PostPaymentInput, ActivatableStatus, ActivationDecision, ActivationDenyReason, ActivationInput, ContractPeriod (+2 more)

### Community 85 - "module-arabe-coran.md"
Cohesion: 0.21
Nodes (14): ArabicGlyph(), FALLBACK, fontSpec(), Ink, inkCache, inkIfFontReady(), measureInk(), useInk() (+6 more)

### Community 86 - "SubscriptionSection"
Cohesion: 0.36
Nodes (9): ADMIN_STATUSES, fromDayInput(), plural(), seatsContractLabel(), SeatsFullNotice(), seatsUsedLabel(), SeatUsageNotice(), SubscriptionSection() (+1 more)

### Community 87 - "compilerOptions"
Cohesion: 0.17
Nodes (11): compilerOptions, esModuleInterop, jsx, lib, module, moduleResolution, noEmit, skipLibCheck (+3 more)

### Community 88 - "hero.tsx"
Cohesion: 0.25
Nodes (4): ElegantShape(), ElegantShapeProps, Hero(), ROTATING_WORDS

### Community 89 - "waitlist.tsx"
Cohesion: 0.20
Nodes (3): AUDIENCES, Waitlist(), WaitlistForm()

### Community 90 - "students.ts"
Cohesion: 0.16
Nodes (24): callerMayReadStudent(), buildStudentSnapshot(), effectivePalierCount(), isTopicComplete(), nextPalierIndex(), listByStudent, approxStarsForValidatedPalier(), countValidatedWithin() (+16 more)

### Community 91 - "arabic/db.ts"
Cohesion: 0.25
Nodes (10): consumeSttQuota, findClip, MODULE_KEY, recordServerAttempt, saveClip, STT_DAILY_LIMIT, touchLessonProgress(), convex_generated_server_mutationctx (+2 more)

### Community 92 - "billingPaydunya.ts"
Cohesion: 0.25
Nodes (10): confirmInvoice, expectedWebhookHash(), InvoiceConfirmation, openInvoice, PaydunyaConfig, paydunyaHeaders(), paydunyaOutcome(), ProviderOutcome (+2 more)

### Community 93 - "waitlist.ts"
Cohesion: 0.29
Nodes (8): join, list, WaitlistRow, MAX_EMAIL_LENGTH, normalizeWaitlistEmail(), WaitlistAudience, waitlistAudienceValidator, RFC-5321

### Community 94 - "admin/pdf-uploads/detail/page.tsx"
Cohesion: 0.38
Nodes (5): EXERCISE_TYPE_LABELS, formatDate(), formatFileSize(), PdfUploadDetailPageInner(), STATUS_STEPS

### Community 95 - "published/page.tsx"
Cohesion: 0.16
Nodes (9): PublishedPage(), TYPE_COLORS, TYPE_LABELS, useTopicsMap(), EXERCISE_TYPE_LABELS, formatDate(), formatFileSize(), STATUS_STEPS (+1 more)

### Community 96 - "exercise-types.tsx"
Cohesion: 0.20
Nodes (3): ExerciseCard, ExerciseTypes(), TYPES

### Community 97 - "billingBictorys.ts"
Cohesion: 0.31
Nodes (9): BictorysConfig, bictorysHeaders(), bictorysReference(), ChargeConfirmation, confirmCharge, openInvoice, bictorysOutcome(), Bictorys secrets: BICTORYS_API_KEY, BICTORYS_WEBHOOK_SECRET, BICTORYS_MODE (+1 more)

### Community 98 - "http.ts"
Cohesion: 0.22
Nodes (7): expectedWebhookSecret(), convex_generated_server_httpaction, http, Bictorys notification URL https://<deployment>.convex.site/bictorys-webhook, Convex CLI target asymmetry: deploy -> production, env set -> development, Dev Convex deployment impartial-ermine-150, workflow_dispatch trigger (manual run on any branch)

### Community 99 - "capture-landing.mjs"
Cohesion: 0.14
Nodes (13): here, out, appPublic, here, target, node_modules_playwright_test_index, node_modules_playwright_test_index_chromium, ref_node_fs (+5 more)

### Community 100 - "answerCheck.ts"
Cohesion: 0.42
Nodes (8): DragDropItem, isStringRecord(), key(), MatchPair, parseJson(), sameMultiset(), verifyDragDrop(), verifyMatch()

### Community 101 - "OrderExercise.tsx"
Cohesion: 0.22
Nodes (7): itemColors, OrderExercise(), OrderExerciseProps, OrderPayload, OrderTile, @dnd-kit/sortable, @dnd-kit/utilities

### Community 103 - "Motion design de Jotna School"
Cohesion: 0.25
Nodes (7): geistMono, Commandes, D'où viennent les images, Déroulé, Le son, Licence de Remotion, Motion design de Jotna School

### Community 104 - "accessRules.ts"
Cohesion: 0.43
Nodes (4): AccessInput, AccessState, decideAccess(), PAST_DUE_GRACE_MS

### Community 111 - "Afro.tools MCP server (African API specs registry)"
Cohesion: 0.29
Nodes (6): Afro.tools MCP server (African API specs registry), Claude Code on the web egress proxy blocks external API domains, constantTimeEquals(), Bictorys webhooks are unsigned (X-Secret-Key carries the plaintext secret), Voice path never executed against the real ElevenLabs API, afrotools

### Community 112 - "liste-attente/page.tsx"
Cohesion: 0.43
Nodes (6): AdminWaitlistPage(), AUDIENCE_LABEL, csvCell(), downloadCsv(), formatDay(), WaitlistRow

### Community 113 - "usePioWalker"
Cohesion: 0.38
Nodes (7): usePioWalker(), standAt(), walkTo(), WALK_SPEED, walkDuration(), Pio walk: constant speed, 0.45-2.4 s per step, whole-sprite bounce, camera follows, Walk speed 90 world-px per second (WALK_SPEED), matched to the clip's steps

### Community 114 - "section.tsx"
Cohesion: 0.47
Nodes (4): FAQ(), ITEMS, Section(), SectionProps

### Community 115 - "gamification-store.ts"
Cohesion: 0.33
Nodes (6): BadgeUnlockModal(), Badge, GamificationActions, GamificationState, useGamificationStore, mockBadge

### Community 117 - "auth-store.ts"
Cohesion: 0.28
Nodes (7): zustand, AuthActions, AuthState, useAuthStore, User, mockAdminUser, mockUser

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
- `Pio walk: constant speed, 0.45-2.4 s per step, whole-sprite bounce, camera follows` → `Walk speed 90 world-px per second (WALK_SPEED), matched to the clip's steps`  [AMBIGUOUS]
  docs/monde-de-pio.md · relation: conceptually_related_to
- `MVP final status: 28 routes build, 119 unit tests (9 files), 5 Playwright E2E files` → `Managua MVP implementation plan (6 phases, 60+ items)`  [AMBIGUOUS]
  tasks/todo.md · relation: conceptually_related_to
- `Android app target (Gradle project in android/, Capacitor 8.5.2, SDK 36, Java 21)` → `Not covered: no native plugins, no App Store publication`  [AMBIGUOUS]
  docs/capacitor-ios.md · relation: conceptually_related_to

## Knowledge Gaps
- **726 isolated node(s):** `state`, `loadedData`, `CONDITION_LABELS`, `StaffRow`, `ClassRow` (+721 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 987 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
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
- **What is the exact relationship between `Pio walk: constant speed, 0.45-2.4 s per step, whole-sprite bounce, camera follows` and `Walk speed 90 world-px per second (WALK_SPEED), matched to the clip's steps`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._
- **What is the exact relationship between `MVP final status: 28 routes build, 119 unit tests (9 files), 5 Playwright E2E files` and `Managua MVP implementation plan (6 phases, 60+ items)`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._