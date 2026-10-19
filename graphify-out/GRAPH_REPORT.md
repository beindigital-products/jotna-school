# Graph Report - gracious-bouman-aa91ef  (2026-10-05)

## Corpus Check
- 399 files · ~376,499 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 7 file(s) not represented in the graph (top: (none) 4, .tsv 2, .css 1)

## Summary
- 2880 nodes · 7223 edges · 132 communities (123 shown, 9 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 212 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `bda2ba12`
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
- arabic/curriculum.ts
- email-brand.ts
- schools.ts
- session.ts
- isHiddenClass
- parentLink.ts
- paliers/index.ts
- ecoles/detail/page.tsx
- hifz.ts
- streak.ts
- pregen.ts
- quests.ts
- attempts.ts
- convex_generated_server
- mathRepair.ts
- progress
- Two build targets: website (no student space) vs iOS/Android app
- sidebar.tsx
- palierAttempts.ts
- package.json
- convex/curriculum.ts
- exercises.ts
- ref_lucide_react
- balloon-fx.tsx
- tracing-canvas.tsx
- aiGateway/db.ts
- dependencies
- ExercisePreview.tsx
- linkRules.ts
- motion/package.json
- use-device-tier.ts
- components.json
- palier-result.tsx
- voice.ts
- student.tsx
- @playwright/test
- MapViewport
- monde-de-pio.md
- student/pio.tsx
- compilerOptions
- profil/page.app.tsx
- Parents.tsx
- lib/auth.ts
- topics/edit/page.tsx
- billing.ts
- convex_generated_server_mutation
- pricing.ts
- subjects/page.app.tsx
- Presentation.tsx
- Outro.tsx
- vitest
- ios-brand-assets.swift
- badge-icon.tsx
- prompts.ts
- game-map.tsx
- convex/badges.ts
- ExercisePrompt.tsx
- compilerOptions
- (parent)/layout.tsx
- layout.app.tsx
- MatchExercise.tsx
- sound-opt-in-dialog.tsx
- progression-niveau-etoiles-trophees.md
- devDependencies
- arabe/page.app.tsx
- reports.ts
- admin/exercises/edit/page.tsx
- landing-icons.tsx
- capacitor-ios.md
- gamification.tsx
- palierRules.ts
- Students.tsx
- ref_react
- MVP stack: Next.js 16, React 19, Tailwind v4, Zustand, Convex, Resend, OpenAI GPT-4, shadcn/ui, Framer Motion, @dnd-kit
- School.tsx
- Teachers.tsx
- formatDay
- subscriptionRules.ts
- arabic-glyph.tsx
- SubscriptionSection
- compilerOptions
- hero.tsx
- waitlist.tsx
- students.ts
- arabic/db.ts
- studentImport.ts
- waitlist.ts
- admin/pdf-uploads/detail/page.tsx
- teacher/pdf-uploads/detail/page.tsx
- exercise-types.tsx
- billingBictorys.ts
- modules.ts
- capture-landing.mjs
- sheet.tsx
- registry.ts
- badges/page.app.tsx
- aiGateway/index.ts
- access.ts
- postcss.config.mjs
- ios-brand-assets.sh script
- auth.config.ts
- testSeedsSchool.ts
- comptes-et-acces.md
- design.md
- app/page.tsx
- prompt-reader.tsx
- settings/index.ts
- auth-store.ts
- prepare-audio.sh
- convex/auth.ts
- how-it-works.tsx
- budget.ts
- pnpm-workspace.yaml
- generateBucketCore
- brand.tsx
- paliers-et-exercices.md
- reportRules.ts
- secureRandom.ts
- Jotna School
- drafts/page.tsx
- module-arabe-coran.md
- AGENTS.md

## God Nodes (most connected - your core abstractions)
1. `convex` - 122 edges
2. `refusalMessage()` - 67 edges
3. `next` - 62 edges
4. `cn()` - 55 edges
5. `vitest` - 53 edges
6. `progress()` - 51 edges
7. `callerIsAdmin()` - 49 edges
8. `framer-motion` - 38 edges
9. `@convex-dev/auth` - 34 edges
10. `checkAccess()` - 29 edges

## Surprising Connections (you probably didn't know these)
- `Extending the game (subject, palier count, mission type, trail shape, Pio pose, Pio line)` --references--> `posterFor()`  [AMBIGUOUS]
  docs/monde-de-pio.md → components/student/pio.tsx
- `badges:normalizeCatalog one-off threshold fix` --conceptually_related_to--> `normalizeRarities`  [AMBIGUOUS]
  docs/progression-niveau-etoiles-trophees.md → convex/badges.ts
- `topicsForStudent()` --implements--> `Students only see topics of their level (profiles.class)`  [INFERRED]
  convex/students.ts → docs/paliers-et-exercices.md
- `buildReadingSession()` --implements--> `Verses heard then read one at a time (talqin)`  [INFERRED]
  lib/arabic/session.ts → docs/module-arabe-coran.md
- `ArabePathPage()` --implements--> `Quran path map (/student/arabe): 30 lessons climbing from the child's village to the Kaaba`  [INFERRED]
  app/(student)/student/arabe/page.app.tsx → docs/module-arabe-coran.md

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **CLI operations guarded by confirmDeployment (real spend or writes)** — docs_comptes_et_acces_confirm_deployment_guard, convex_testseedsschool_seedtestschool, convex_paliers_pregen_run, convex_paliers_pregen_invalidate, convex_paliers_pregen_repairmath, convex_paliers_pregen_repairdragdrop [EXTRACTED 1.00]
- **Two build targets: website without student space vs Capacitor app** — docs_capacitor_ios_two_build_targets, next_config_nextconfig, lib_build_target, github_workflows_ci_build_site_web, github_workflows_ci_build_app, app_eleve_page_studentapponlypage, package_scripts_build_app [EXTRACTED 1.00]
- **Pure rule modules unit-tested without convex-test** — docs_module_arabe_coran_pure_rule_functions_pattern, convex_arabic_placementrules, convex_palierrules, convex_questrules, convex_tests_palierrules_test, convex_tests_questrules_test [INFERRED 0.85]

## Communities (132 total, 9 thin omitted)

### Community 0 - "convex"
Cohesion: 0.04
Nodes (47): CONDITION_LABELS, SchoolImportPageInner(), handleImport(), SchoolsPage(), STATUS_CLASS, STATUS_LABEL, PublishedPage(), TYPE_COLORS (+39 more)

### Community 1 - "billingRules.ts"
Cohesion: 0.11
Nodes (27): SubscriptionStatus, confirmInvoice, expectedWebhookHash(), InvoiceConfirmation, openInvoice, PaydunyaConfig, paydunyaHeaders(), AMENDMENT_DUE_DELAY_MS (+19 more)

### Community 2 - "session/page.app.tsx"
Cohesion: 0.09
Nodes (16): AttemptProgress, PalierResult, SanitizedExo, SceneAlert, CapRegenAlternatives(), JotnaLoader(), ExplainStepByStep(), AnswerFeedback() (+8 more)

### Community 3 - "lecon/page.app.tsx"
Cohesion: 0.06
Nodes (64): ArabicAlphabetPage(), LessonSummary(), ReadingStep(), ReciteStep(), RecordAttempt, StepProps, StepView(), WriteStep() (+56 more)

### Community 4 - "DragDropExercise.tsx"
Cohesion: 0.27
Nodes (7): DragDropExercise(), DragDropExerciseProps, DragDropPayload, itemId(), zoneColors, zoneId(), dragDropAnswer()

### Community 5 - "placement.ts"
Cohesion: 0.09
Nodes (44): ArabicLessonPageInner(), PlacementStudent, callerProfile(), getLesson(), completeLesson, drillValidator, getLessonState, getPath (+36 more)

### Community 6 - "arabic.test.ts"
Cohesion: 0.10
Nodes (35): isLetterKey(), judgePronunciation(), judgeReading(), judgeRecitation(), LATIN_ALIASES, LATIN_AMBIGUOUS, LatinForms, latinMatches() (+27 more)

### Community 7 - "arabic/curriculum.ts"
Cohesion: 0.12
Nodes (27): ArabePathPage(), renderNode(), shake(), LessonCard(), lessonGlyph(), alphabetLessons(), ARABIC_LESSONS, ARABIC_LEVELS (+19 more)

### Community 8 - "email-brand.ts"
Cohesion: 0.08
Nodes (39): METHOD_LABEL, sendInvoiceEmail, convex_generated_server_internalaction, sendLinkRequestEmail, decideProfileUpdate(), objectPreferences(), ProfileUpdateDecision, ProfileUpdateFields (+31 more)

### Community 9 - "schools.ts"
Cohesion: 0.08
Nodes (36): callerIsAdmin(), remove, createDraftExercises, getUploadInternal, list, listByTeacher, markError, markExtracted (+28 more)

### Community 10 - "session.ts"
Cohesion: 0.11
Nodes (31): DOT_LABEL, FORM_LABELS, LetterCard(), ARABIC_LETTERS, ArabicLetter, Articulation, BY_KEY, HarakaKey (+23 more)

### Community 11 - "isHiddenClass"
Cohesion: 0.16
Nodes (20): catalogAccess(), HIDDEN, isHiddenClass(), isValidPalierCount(), listPlan, create, getById, list (+12 more)

### Community 12 - "parentLink.ts"
Cohesion: 0.16
Nodes (18): buildLoginCode(), buildParentCode(), CLASS_LEVELS, IMPORT_ROWS_LIMIT, ImportParseError, ImportParseResult, normalizeCode(), PARSE_ERROR_MESSAGES (+10 more)

### Community 13 - "paliers/index.ts"
Cohesion: 0.07
Nodes (31): convex_generated_server_actionctx, AnswerInputMode, BucketArgs, checkPalierProgression, exerciseTypeValidator, extractConcept(), findBucket, fnv1a() (+23 more)

### Community 14 - "ecoles/detail/page.tsx"
Cohesion: 0.05
Nodes (34): AdminStatus, AmendableContract, BillingScheduleView, CandidateList, CLASS_LEVELS, ClassCard(), ClassesSection(), ClassLevel (+26 more)

### Community 15 - "hifz.ts"
Cohesion: 0.18
Nodes (23): MaskedText(), clampStrength(), firstLetter(), HifzRow, hifzStates(), HifzSurahState, isDue(), linkPointOf() (+15 more)

### Community 16 - "streak.ts"
Cohesion: 0.16
Nodes (22): requireAccess(), markBadgesSeen, addDaysYmd(), applyActivity(), applyRollover(), dailyStreakRollover, daysBetween(), recordKidActivity (+14 more)

### Community 17 - "pregen.ts"
Cohesion: 0.11
Nodes (21): insertGeneratedExercises, isBaseExercise(), BucketOutcome, dedupe, DragDropBatch, DragDropSample, DragDropSummary, invalidate (+13 more)

### Community 18 - "quests.ts"
Cohesion: 0.13
Nodes (33): ActivityEvent, ALL_DONE_BONUS, allDone(), applyActivity(), bonusStarsFor(), completedCount(), EASY_TARGETS, gainFor() (+25 more)

### Community 19 - "attempts.ts"
Cohesion: 0.13
Nodes (25): StreakRibbon(), blockedStudent(), getAttemptContextForVerification, getAttemptsForExercise, getExerciseAndAttempts, getProgressForTopic, markAttemptCorrectByAI, submit (+17 more)

### Community 20 - "convex_generated_server"
Cohesion: 0.06
Nodes (45): generateExplanation, readVerdict(), verifyShortAnswerWithAI, crons, purgeOldHistory, buildPrompt(), explainExercise, ExplainResult (+37 more)

### Community 21 - "mathRepair.ts"
Cohesion: 0.08
Nodes (54): checkMathExercise(), evaluateExpression(), FactCheckOutcome, parseAnswerNumber(), parseExpression(), parseFactor(), parseNumber(), parsePower() (+46 more)

### Community 22 - "progress"
Cohesion: 0.09
Nodes (45): Backdrop(), BackdropProps, ElegantShape(), HALOS, ShapeProps, Bullet, ChapterText(), Props (+37 more)

### Community 23 - "Two build targets: website (no student space) vs iOS/Android app"
Cohesion: 0.19
Nodes (18): Static export packaged by Capacitor (no Next server on device), Two build targets: website (no student space) vs iOS/Android app, CI step Build (application iOS/Android): requires out/student/home/index.html, CI step Build (site web): fails if out/student exists, Lint step non-blocking (continue-on-error), CI job verify (Lint, typecheck, test, build), scripts, android:sync (+10 more)

### Community 24 - "sidebar.tsx"
Cohesion: 0.15
Nodes (22): Input(), Separator(), SidebarContext, SidebarContextProps, SidebarGroupAction(), SidebarGroupLabel(), SidebarInput(), SidebarMenuAction() (+14 more)

### Community 25 - "palierAttempts.ts"
Cohesion: 0.09
Nodes (48): buildStudentSnapshot(), canonicalAnswer(), requestHint, submitPalier, verifyAttempt, verifyByType(), verifyOrder(), verifyQcm() (+40 more)

### Community 26 - "package.json"
Cohesion: 0.05
Nodes (36): config, itemColors, OrderExercise(), OrderExerciseProps, OrderPayload, OrderTile, eslintConfig, lucide-react (+28 more)

### Community 27 - "convex/curriculum.ts"
Cohesion: 0.17
Nodes (14): PalierSession(), assertVisibleClass(), classEnum, ClassName, HIDDEN_CLASSES, isReadingLearnerClass(), READING_LEARNER_CLASSES, READING_LEARNERS (+6 more)

### Community 28 - "exercises.ts"
Cohesion: 0.13
Nodes (23): callerIsStaff(), callerStaffProfile(), create, createDrafts, getById, listAllDrafts, listAllPublished, listByTeacher (+15 more)

### Community 29 - "ref_lucide_react"
Cohesion: 0.10
Nodes (7): AdminWaitlistPage(), AUDIENCE_LABEL, csvCell(), downloadCsv(), formatDay(), WaitlistRow, ref_lucide_react

### Community 30 - "balloon-fx.tsx"
Cohesion: 0.30
Nodes (10): AirPuffs(), BalloonPop(), between(), BURST_DELAY, CONFETTI_COLORS, FxStyle, piece(), popParticles() (+2 more)

### Community 31 - "tracing-canvas.tsx"
Cohesion: 0.07
Nodes (42): app_globals, amiri, fredoka, geistMono, metadata, poppins, viewport, clamp01() (+34 more)

### Community 32 - "aiGateway/db.ts"
Cohesion: 0.18
Nodes (19): addToMonthSpend(), decrementUserDailyQuota, ensureSettings, getSettings, getUserDailyQuota, incrementUserDailyQuota, purposeValidator, recordUsage (+11 more)

### Community 33 - "dependencies"
Cohesion: 0.10
Nodes (20): dependencies, @auth/core, @base-ui/react, @capacitor/core, @capacitor/ios, class-variance-authority, clsx, @convex-dev/auth (+12 more)

### Community 34 - "ExercisePreview.tsx"
Cohesion: 0.10
Nodes (18): DragDropPayload, DragDropPreview(), DragDropPreviewProps, ExercisePreview(), ExercisePreviewProps, ExerciseType, MatchPayload, MatchPreview() (+10 more)

### Community 35 - "linkRules.ts"
Cohesion: 0.21
Nodes (10): decideLinkChild(), LinkDecision, LinkDenyReason, LinkInput, LinkRelation, requiredRoleFor(), attachGuardianByCode, ALL_RELATIONS (+2 more)

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
Nodes (29): CONFETTI_COLORS, DotState, PalierResultScreen(), PalierResultView, UnseenBadge, useBareStatusBar(), useVictoryConfetti(), useVictoryExtras() (+21 more)

### Community 40 - "voice.ts"
Cohesion: 0.10
Nodes (34): isConsigneKey(), letterWord, acceptedFormsForLetter(), latinFormsForLetter(), ALLOWED_MIME, audioContainer(), baseMime(), Expected (+26 more)

### Community 41 - "student.tsx"
Cohesion: 0.09
Nodes (26): bezier(), CampScreen(), chunky(), Confetti(), GameButton(), GLYPHS, LessonCard(), LessonScreen() (+18 more)

### Community 43 - "MapViewport"
Cohesion: 0.12
Nodes (25): ZoomControls(), CameraHandle, clamp(), Gesture, initialScaleFor(), MapViewport(), beginPan(), beginPinch() (+17 more)

### Community 44 - "monde-de-pio.md"
Cohesion: 0.17
Nodes (13): remember(), rememberedIndex(), WorldMapPage(), onArrive(), SubjectTrailPage(), Four places, not screens: Camp, Carte, Trophees, Carnet, Fresh redesign on main instead of merging branch doums85/student-pages, Camp backdrop as <picture> (portrait phone, landscape tablet) (+5 more)

### Community 45 - "student/pio.tsx"
Cohesion: 0.10
Nodes (29): NativeAppGate(), CLIP, LABELS, OUTFITS, OutfitSpec, PioClip(), pioClipSources(), PioOutfit (+21 more)

### Community 46 - "compilerOptions"
Cohesion: 0.10
Nodes (19): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+11 more)

### Community 47 - "profil/page.app.tsx"
Cohesion: 0.24
Nodes (10): fileToSquareBlob(), StudentProfileEditPage(), formatDuration(), Stamp(), StudentProfilePage(), Carnet (/student/profil): cream page with stamps (level, stars, exercises, trophies, streak), CLASS_LONG_NAMES, classLongName() (+2 more)

### Community 48 - "Parents.tsx"
Cohesion: 0.09
Nodes (22): ACCENT, DashboardShell(), DashButton(), HEADER_H, NavItem, Role, ROLES, ShellProps (+14 more)

### Community 49 - "lib/auth.ts"
Cohesion: 0.14
Nodes (14): StudentAppOnlyPage(), LogoutCard(), LogoutCard(), useLogout(), clearConvexAuthTokens(), LoginParams, logout(), RegisterParams (+6 more)

### Community 50 - "topics/edit/page.tsx"
Cohesion: 0.10
Nodes (20): AdminAiSettingsPage(), loadedData, state, TopicEditPageInner(), ParentSettingsPage(), handleSave(), receiveReportsOf(), state (+12 more)

### Community 51 - "billing.ts"
Cohesion: 0.13
Nodes (19): activeProvider(), applyPayment, ApplyPaymentResult, BillingSchedule, chargeProviderValidator, creditInstallment(), getSchedule, invoiceEmailData (+11 more)

### Community 52 - "convex_generated_server_mutation"
Cohesion: 0.18
Nodes (11): convex_generated_server_mutation, createRequest, generateToken(), getPendingForParent, internalGetById, internalGetByToken, internalGetParentName, internalGetStudentEmail (+3 more)

### Community 53 - "pricing.ts"
Cohesion: 0.19
Nodes (16): billedSeats(), PRICING_SCALE, PricingScale, PricingTier, quoteSeatAmendment(), quoteSeatAmendmentWithScale(), quoteSubscription(), quoteWithScale() (+8 more)

### Community 54 - "subjects/page.app.tsx"
Cohesion: 0.11
Nodes (19): PalierNode, SubjectBanner(), SubjectTrailPageInner(), TreasureMark(), LostTrail(), Pio(), biomeFor(), BiomeMedallion() (+11 more)

### Community 55 - "Presentation.tsx"
Cohesion: 0.12
Nodes (21): BrandWipe(), STRIPES, WIPE_CUT, WIPE_FRAMES, boundaries, Presentation(), SCENES, starts (+13 more)

### Community 56 - "Outro.tsx"
Cohesion: 0.11
Nodes (18): BROWSER_BAR, BrowserFrame(), BrowserProps, PHONE_H, PHONE_W, PhoneFrame(), PhoneProps, BoubouPose (+10 more)

### Community 57 - "vitest"
Cohesion: 0.12
Nodes (13): createMockCtx(), EqCondition, FieldRef, FilterQuery, isFieldRef(), IndexQuery, Row, AttemptData (+5 more)

### Community 58 - "ios-brand-assets.swift"
Cohesion: 0.14
Nodes (16): CGContext, CGFloat, CGImage, CGRect, CoreGraphics, Generated iOS icon and launch screen (pnpm ios:brand), Foundation, ImageIO (+8 more)

### Community 59 - "badge-icon.tsx"
Cohesion: 0.15
Nodes (10): BadgeShield(), hashString(), ICON_MAP, LOCKED_METAL, Metal, PALETTES, pickPalette(), pickShape() (+2 more)

### Community 60 - "prompts.ts"
Cohesion: 0.15
Nodes (19): StepCard(), TopicTrail(), difficultyStage, ageForClass(), buildPalierBasePrompt(), buildPalierBaseSystemPrompt(), buildPersonalizedPrompt(), buildPersonalizedSystemPrompt() (+11 more)

### Community 61 - "game-map.tsx"
Cohesion: 0.10
Nodes (29): pioWalkFacing(), GameMap(), Props, WorldBackdrop(), PioWalker, PioWalkerSprite(), STAND_OFFSET, usePioWalker() (+21 more)

### Community 62 - "convex/badges.ts"
Cohesion: 0.09
Nodes (32): AdminBadgesPage(), catalogReadable(), BADGE_CONDITIONS, BadgeEvaluation, badgeParams, buildSnapshot(), conditionText(), evaluateBadge() (+24 more)

### Community 63 - "ExercisePrompt.tsx"
Cohesion: 0.13
Nodes (14): ExercisePrompt(), parsePrompt(), PromptText(), PromptReaderButton(), usePromptReader(), optionColors, QcmExercise(), QcmExerciseProps (+6 more)

### Community 64 - "compilerOptions"
Cohesion: 0.12
Nodes (15): compilerOptions, allowJs, allowSyntheticDefaultImports, forceConsistentCasingInFileNames, isolatedModules, jsx, lib, module (+7 more)

### Community 65 - "(parent)/layout.tsx"
Cohesion: 0.13
Nodes (26): sidebarLinks, ParentLayout(), sidebarLinks, sidebarLinks, TeacherLayout(), KidSwitcher(), RoleGate(), Sidebar() (+18 more)

### Community 66 - "layout.app.tsx"
Cohesion: 0.26
Nodes (8): BottomNav(), isActivePath(), isFocusRoute(), NAV, StudentLayout(), AccessGate(), Focus-mode cream status bar and palier-end frosted override, accessMessageForAdult()

### Community 67 - "MatchExercise.tsx"
Cohesion: 0.18
Nodes (11): MatchExercise(), MatchExerciseProps, MatchPayload, pairColors, payload, linkTiles(), matchAnswer(), MatchLink (+3 more)

### Community 68 - "sound-opt-in-dialog.tsx"
Cohesion: 0.25
Nodes (9): StudentAlertTone, toneStyles, Dialog(), DialogContent(), DialogDescription(), DialogFooter(), DialogHeader(), DialogOverlay() (+1 more)

### Community 69 - "progression-niveau-etoiles-trophees.md"
Cohesion: 0.22
Nodes (13): checkAndAward, confirmDeployment guard: CLI operations must name their target deployment, End-of-palier screen replaces the old victory screen, End screen counts stars on exercises actually played (exerciseCount), 3 per exercise, threshold scaled, Trophy engine: catalogue conditions evaluated on a student snapshot (badgeRules.evaluateBadge), badges:normalizeCatalog one-off threshold fix, progression:rebuild backfill for pre-existing students, Recount from source, never blind increments (+5 more)

### Community 70 - "devDependencies"
Cohesion: 0.12
Nodes (16): devDependencies, @capacitor/cli, eslint, eslint-config-next, jsdom, shadcn, tailwindcss, @tailwindcss/postcss (+8 more)

### Community 71 - "arabe/page.app.tsx"
Cohesion: 0.10
Nodes (25): HifzState, SayButton(), KAABA_HEIGHT, KAABA_INDEX, KAABA_POINT, KaabaNode(), LevelRibbon(), QURAN_POINTS (+17 more)

### Community 72 - "reports.ts"
Cohesion: 0.09
Nodes (25): callerMayReadStudent(), studentIdsTaughtBy(), listByTeacherStudents, convex_generated_server_query, createChildProfile, generateAvatarUploadUrl, getChildren, getCurrentProfile (+17 more)

### Community 73 - "admin/exercises/edit/page.tsx"
Cohesion: 0.17
Nodes (4): ExerciseEditPageInner(), ExerciseType, getDefaultPayload(), TYPE_OPTIONS

### Community 74 - "landing-icons.tsx"
Cohesion: 0.29
Nodes (7): ForWhom(), Persona, PERSONAS, IconProps, KidIcon(), ParentHeartIcon(), TeacherIcon()

### Community 75 - "capacitor-ios.md"
Cohesion: 0.12
Nodes (17): PostAuthPage(), ArabicLessonPage(), Android app target (Gradle project in android/, Capacitor 8.5.2, SDK 36, Java 21), Capacitor router serves root index.html for any extensionless path, App opening is client-side (NativeAppGate -> router.replace('/post-auth')), Dynamic [id] routes replaced by query parameters, Export mode constraints: trailingSlash, unoptimized images, Logout: the only deliberate document navigation (+9 more)

### Community 76 - "gamification.tsx"
Cohesion: 0.21
Nodes (11): BadgeItem, BADGES, BadgesCard(), Gamification(), MASTERY, MasteryCard(), STREAK_DAYS, StreakCard() (+3 more)

### Community 77 - "palierRules.ts"
Cohesion: 0.19
Nodes (17): SubjectDetailPageInner(), TopicLevelFields(), VISIBLE_CLASSES, VisibleClassName, DEFAULT_PALIERS_BY_CLASS, defaultPalierCount(), effectivePalierCount(), exercisesForTopic() (+9 more)

### Community 78 - "Students.tsx"
Cohesion: 0.14
Nodes (12): ClickSounds(), Cursor(), CursorKey, positionAt(), Props, IN_OUT, LINES, NBSP (+4 more)

### Community 79 - "ref_react"
Cohesion: 0.11
Nodes (17): ForgotPasswordPage(), ModuleMedallion(), TAP_POSES, Explanation, Status, GameButton(), Props, Size (+9 more)

### Community 80 - "MVP stack: Next.js 16, React 19, Tailwind v4, Zustand, Convex, Resend, OpenAI GPT-4, shadcn/ui, Framer Motion, @dnd-kit"
Cohesion: 0.29
Nodes (7): canvas-confetti, convex, framer-motion, openai, resend, zustand, MVP stack: Next.js 16, React 19, Tailwind v4, Zustand, Convex, Resend, OpenAI GPT-4, shadcn/ui, Framer Motion, @dnd-kit

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
Cohesion: 0.27
Nodes (7): ActivatableStatus, ActivationDecision, ActivationDenyReason, ActivationInput, ContractPeriod, decideActivation(), refusalForStatus()

### Community 85 - "arabic-glyph.tsx"
Cohesion: 0.42
Nodes (8): ArabicGlyph(), FALLBACK, fontSpec(), Ink, inkCache, inkIfFontReady(), measureInk(), useInk()

### Community 86 - "SubscriptionSection"
Cohesion: 0.36
Nodes (9): ADMIN_STATUSES, fromDayInput(), plural(), seatsContractLabel(), SeatsFullNotice(), seatsUsedLabel(), SeatUsageNotice(), SubscriptionSection() (+1 more)

### Community 87 - "compilerOptions"
Cohesion: 0.17
Nodes (11): compilerOptions, esModuleInterop, jsx, lib, module, moduleResolution, noEmit, skipLibCheck (+3 more)

### Community 88 - "hero.tsx"
Cohesion: 0.22
Nodes (5): ElegantShape(), ElegantShapeProps, Hero(), ROTATING_WORDS, StreakFlameIcon()

### Community 89 - "waitlist.tsx"
Cohesion: 0.20
Nodes (3): AUDIENCES, Waitlist(), WaitlistForm()

### Community 90 - "students.ts"
Cohesion: 0.12
Nodes (29): checkAccess(), getAccessStateForProfile, getResumeIndex, getMyAttempt, getProgressForPalierAttempt, listMyAttempts, nextPalierIndex(), resolvePalierStatuses() (+21 more)

### Community 91 - "arabic/db.ts"
Cohesion: 0.26
Nodes (11): dayKey(), addTtsChars, consumeSttQuota, findClip, MODULE_KEY, recordServerAttempt, saveClip, STT_DAILY_LIMIT (+3 more)

### Community 92 - "studentImport.ts"
Cohesion: 0.13
Nodes (21): callerAdminProfile(), amendmentDueAt(), amendableSubscription(), amendSeats, enrollStudent, pluralCount(), releaseStudent, seatStateForSchool() (+13 more)

### Community 93 - "waitlist.ts"
Cohesion: 0.29
Nodes (8): join, list, WaitlistRow, MAX_EMAIL_LENGTH, normalizeWaitlistEmail(), WaitlistAudience, waitlistAudienceValidator, RFC-5321

### Community 94 - "admin/pdf-uploads/detail/page.tsx"
Cohesion: 0.38
Nodes (5): EXERCISE_TYPE_LABELS, formatDate(), formatFileSize(), PdfUploadDetailPageInner(), STATUS_STEPS

### Community 95 - "teacher/pdf-uploads/detail/page.tsx"
Cohesion: 0.38
Nodes (5): EXERCISE_TYPE_LABELS, formatDate(), formatFileSize(), STATUS_STEPS, TeacherPdfUploadDetailPageInner()

### Community 96 - "exercise-types.tsx"
Cohesion: 0.14
Nodes (8): ExerciseCard, ExerciseTypes(), TYPES, FadeIn(), MotionWrapperProps, ScaleIn(), StaggerContainer(), StaggerItem()

### Community 97 - "billingBictorys.ts"
Cohesion: 0.08
Nodes (31): Afro.tools MCP server (African API specs registry), Claude Code on the web egress proxy blocks external API domains, settleInstallmentOffline, BictorysConfig, bictorysHeaders(), bictorysReference(), ChargeConfirmation, confirmCharge (+23 more)

### Community 98 - "modules.ts"
Cohesion: 0.16
Nodes (18): callerContext, listForSchool, placementLevelValidator, BY_KEY, ModuleDescriptor, ModuleKey, moduleKeyValidator, MODULES (+10 more)

### Community 99 - "capture-landing.mjs"
Cohesion: 0.14
Nodes (13): here, out, appPublic, here, target, node_modules_playwright_test_index, node_modules_playwright_test_index_chromium, ref_node_fs (+5 more)

### Community 100 - "sheet.tsx"
Cohesion: 0.16
Nodes (14): LINKS, Navbar(), useActiveSection(), Button(), buttonVariants, Sheet(), SheetContent(), SheetDescription() (+6 more)

### Community 101 - "registry.ts"
Cohesion: 0.16
Nodes (14): AiPurpose, ALL_PURPOSES, estimateCostUsd(), getPurposeConfig(), GPT_4O, GPT_4O_MINI, isRetryableFailure(), PurposeConfig (+6 more)

### Community 102 - "badges/page.app.tsx"
Cohesion: 0.22
Nodes (13): BadgeRow, EarnedRow, ProgressRow, SHELF_TONE, SHELVES, StudentBadgesPage(), Tab, getRarityChipClass() (+5 more)

### Community 103 - "aiGateway/index.ts"
Cohesion: 0.23
Nodes (12): generate, GenerateResult, purposeValidator, quotaScopeValidator, sleep(), endOfDayUtc(), evaluateQuota(), QuotaCheckArgs (+4 more)

### Community 104 - "access.ts"
Cohesion: 0.15
Nodes (17): callerHasProfile(), callerRole(), currentProfile(), currentSchoolSubscription(), getAccessState, graceAnchorFor(), loadAccessInput(), AccessInput (+9 more)

### Community 111 - "testSeedsSchool.ts"
Cohesion: 0.15
Nodes (13): attachSeededStaff, CLASSES, createSchoolShell, DIRECTOR, openSeededImport, seededCredentials, SeededStaff, SeededStudent (+5 more)

### Community 112 - "comptes-et-acces.md"
Cohesion: 0.19
Nodes (11): LoginPage(), signUpWithCode, provisionStaffAccount, resetStudentLoginCode, Parent activation on /register with a single-use expiring school code, Accounts only by provisioning: four paths (directeur, professeur, student, parent), Password.profile() refuses flow 'signUp', Known weakness: parentLink.signUpWithCode is public, unauthenticated, not rate limited (+3 more)

### Community 113 - "design.md"
Cohesion: 0.18
Nodes (9): @playwright/test, Original data model (profiles, studentGuardians, subjects, topics, exercises, attempts, studentTopicProgress, badges, pdfUploads, topicReports), MVP decision log (10 decisions), ExercisePlayer orchestrator with QCM, DragDrop, Match, Order, ShortAnswer components, MVP gamification plan (progress bar green to gold, badges, confetti unlock, star end screen), Managua: gamified educational web app for CE2-CM2 (8-10 years), francophone/Senegalese focus, MVP final status: 28 routes build, 119 unit tests (9 files), 5 Playwright E2E files, MVP out-of-scope items: RBAC on all Convex functions, batch publish, role middleware, env vars (+1 more)

### Community 114 - "app/page.tsx"
Cohesion: 0.29
Nodes (6): FAQ(), ITEMS, COLUMNS, Footer(), FooterColumn, ScrollToTop()

### Community 115 - "prompt-reader.tsx"
Cohesion: 0.31
Nodes (9): PromptReader, PromptReaderContext, PromptReaderProvider(), ReaderStatus, SpeakResult, urlByExercise, newVoiceOwner(), playUrl() (+1 more)

### Community 116 - "settings/index.ts"
Cohesion: 0.29
Nodes (10): getMonthSpend, readMonthSpend(), monthKey(), convex_generated_server_databasereader, getMonthSpendSummary, getSettings, listRecentIncidents, loadAdminProfile() (+2 more)

### Community 117 - "auth-store.ts"
Cohesion: 0.28
Nodes (7): zustand, AuthActions, AuthState, useAuthStore, User, mockAdminUser, mockUser

### Community 119 - "convex/auth.ts"
Cohesion: 0.24
Nodes (8): auth, isAuthenticated, signIn, signOut, store, decideProvisionedRole(), PROVISIONABLE, ProvisionableRole

### Community 120 - "how-it-works.tsx"
Cohesion: 0.24
Nodes (8): HowItWorks(), Step, STEPS, LoginTicketIcon(), SubjectsIcon(), TrophyRibbonIcon(), Section(), SectionProps

### Community 121 - "budget.ts"
Cohesion: 0.31
Nodes (7): BudgetContext, BudgetDecision, BudgetTier, evaluateBudget(), GENERATIVE_PURPOSES, KID_INITIATED_PURPOSES, projectMonthEndSpend()

### Community 123 - "generateBucketCore"
Cohesion: 0.29
Nodes (10): generateBucketCore(), parseExercises(), regenerateFailedExercises, toPersistedShape(), validatePayload(), verifyMathBatch(), run, buildVariationPrompt() (+2 more)

### Community 124 - "brand.tsx"
Cohesion: 0.28
Nodes (4): Brand(), BrandProps, BrandSize, SIZES

### Community 125 - "paliers-et-exercices.md"
Cohesion: 0.29
Nodes (7): topicOpenTo(), getBucket, startPalierAttempt, Students only see topics of their level (profiles.class), Dev database content state (2026-09-27): duplicate and level-less topics, Lowering the palier count keeps extra paliers but closes them, Paliers expire after a term (PALIER_TTL_MS) and regenerate on demand

### Community 126 - "reportRules.ts"
Cohesion: 0.36
Nodes (5): buildTopicReport(), EXERCISE_TYPE_LABELS, formatExerciseType(), ReportExercise, TopicReportContent

### Community 127 - "secureRandom.ts"
Cohesion: 0.43
Nodes (5): cryptoUint32(), secureRandomInt(), secureRandomString(), Uint32Source, uniformInt()

### Community 128 - "Jotna School"
Cohesion: 0.25
Nodes (7): Deux cibles de build, Documentation, Démarrer, Jotna School, La pile, Pour les agents, Vérifier

### Community 129 - "drafts/page.tsx"
Cohesion: 0.33
Nodes (4): DraftsPage(), TYPE_COLORS, TYPE_LABELS, useTopicsMap()

### Community 130 - "module-arabe-coran.md"
Cohesion: 0.40
Nodes (5): One letter, one picture-word (alif as asad, the lion like Pio), Mobile mic permissions (NSMicrophoneUsageDescription, RECORD_AUDIO, MODIFY_AUDIO_SETTINGS), Module loader: Kaaba on a slowly turning eight-pointed star (replaces the baobab), iOS simulator web view mic is WebKit's test tone, Verses heard then read one at a time (talqin)

### Community 131 - "AGENTS.md"
Cohesion: 0.50
Nodes (3): Rule: read convex/_generated/ai/guidelines.md before Convex work, Rule: this is NOT the Next.js you know (read node_modules/next/dist/docs first), dev:app

## Ambiguous Edges - Review These
- `posterFor()` → `Extending the game (subject, palier count, mission type, trail shape, Pio pose, Pio line)`  [AMBIGUOUS]
  docs/monde-de-pio.md · relation: references
- `normalizeRarities` → `badges:normalizeCatalog one-off threshold fix`  [AMBIGUOUS]
  docs/progression-niveau-etoiles-trophees.md · relation: conceptually_related_to
- `createChildProfile` → `Removed profiles.createChildAccount and /parent/children/add`  [AMBIGUOUS]
  docs/comptes-et-acces.md · relation: conceptually_related_to
- `motion/README.md` → `Two build targets: website (no student space) vs iOS/Android app`  [AMBIGUOUS]
  README.md · relation: conceptually_related_to
- `Pio walk: constant speed, 0.45-2.4 s per step, whole-sprite bounce, camera follows` → `Walk speed 90 world-px per second (WALK_SPEED), matched to the clip's steps`  [AMBIGUOUS]
  docs/monde-de-pio.md · relation: conceptually_related_to
- `allowBuilds (unresolved placeholders for esbuild, msw, sharp, unrs-resolver)` → `ignoredBuiltDependencies: sharp, unrs-resolver`  [AMBIGUOUS]
  pnpm-workspace.yaml · relation: conceptually_related_to
- `MVP final status: 28 routes build, 119 unit tests (9 files), 5 Playwright E2E files` → `Managua MVP implementation plan (6 phases, 60+ items)`  [AMBIGUOUS]
  tasks/todo.md · relation: conceptually_related_to
- `Android app target (Gradle project in android/, Capacitor 8.5.2, SDK 36, Java 21)` → `Not covered: no native plugins, no App Store publication`  [AMBIGUOUS]
  docs/capacitor-ios.md · relation: conceptually_related_to

## Knowledge Gaps
- **724 isolated node(s):** `state`, `loadedData`, `CONDITION_LABELS`, `StaffRow`, `ClassRow` (+719 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 987 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **9 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **What is the exact relationship between `posterFor()` and `Extending the game (subject, palier count, mission type, trail shape, Pio pose, Pio line)`?**
  _Edge tagged AMBIGUOUS (relation: references) - confidence is low._
- **What is the exact relationship between `normalizeRarities` and `badges:normalizeCatalog one-off threshold fix`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._
- **What is the exact relationship between `createChildProfile` and `Removed profiles.createChildAccount and /parent/children/add`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._
- **What is the exact relationship between `motion/README.md` and `Two build targets: website (no student space) vs iOS/Android app`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._
- **What is the exact relationship between `Pio walk: constant speed, 0.45-2.4 s per step, whole-sprite bounce, camera follows` and `Walk speed 90 world-px per second (WALK_SPEED), matched to the clip's steps`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._
- **What is the exact relationship between `allowBuilds (unresolved placeholders for esbuild, msw, sharp, unrs-resolver)` and `ignoredBuiltDependencies: sharp, unrs-resolver`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._
- **What is the exact relationship between `MVP final status: 28 routes build, 119 unit tests (9 files), 5 Playwright E2E files` and `Managua MVP implementation plan (6 phases, 60+ items)`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._