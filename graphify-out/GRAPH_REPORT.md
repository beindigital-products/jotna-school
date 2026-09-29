# Graph Report - bistory-payment-test-faec90  (2026-09-29)

## Corpus Check
- 351 files · ~338,374 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 4 file(s) not represented in the graph (top: (none) 3, .css 1)

## Summary
- 2472 nodes · 6221 edges · 123 communities (112 shown, 11 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 194 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `391370f7`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- refusalMessage
- billingRules.ts
- session/page.app.tsx
- lecon/page.app.tsx
- ExercisePlayer.tsx
- placement.ts
- arabic.test.ts
- arabe/page.app.tsx
- email-brand.ts
- schools.ts
- drills.tsx
- convex/curriculum.ts
- studentCredentials.ts
- paliers/index.ts
- ecoles/detail/page.tsx
- hifz.ts
- students.ts
- pregen.ts
- quests.ts
- attempts.ts
- convex_generated_server
- mathRepair.ts
- arabic/curriculum.ts
- scripts
- sidebar.tsx
- palierAttempts.ts
- package.json
- accessCopy.ts
- exercises.ts
- convex
- (parent)/layout.tsx
- tracing-canvas.tsx
- aiGateway/db.ts
- dependencies
- ExercisePreview.tsx
- parentLink.ts
- lucide-react
- use-device-tier.ts
- components.json
- sounds/index.ts
- session.ts
- ref_generated_datamodel
- @playwright/test
- MapViewport
- monde-de-pio.md
- pio-animations.md
- compilerOptions
- profil/page.app.tsx
- sheet.tsx
- user-menu.tsx
- billingBictorys.ts
- billing.ts
- linkRequests.ts
- pricing.ts
- game-map.tsx
- aiGateway/index.ts
- reports.ts
- vitest
- ios-brand-assets.swift
- badge-icon.tsx
- prompts.ts
- pio-walker.tsx
- convex/badges.ts
- design.md
- compilerOptions
- app/layout.tsx
- layout.app.tsx
- badges/page.app.tsx
- sound-opt-in-dialog.tsx
- progression-niveau-etoiles-trophees.md
- devDependencies
- progressionRules.ts
- dragDropRepair.ts
- admin/exercises/edit/page.tsx
- app/page.tsx
- capacitor-ios.md
- gamification.tsx
- factCheck.ts
- registry.ts
- home/page.app.tsx
- pio.tsx
- budget.ts
- convex/auth.ts
- formatDay
- subjects/page.app.tsx
- module-arabe-coran.md
- SubscriptionSection
- brand.tsx
- hero.tsx
- profiles.ts
- palierRules.ts
- comptes-et-acces.md
- ref_convex_generated_datamodel
- drafts/page.tsx
- admin/pdf-uploads/detail/page.tsx
- teacher/pdf-uploads/detail/page.tsx
- admin/pdf-uploads/page.tsx
- react
- reports.test.ts
- serve-export.mjs
- teacher/pdf-uploads/page.tsx
- testSeedsSchool.ts
- SubjectTrailPageInner
- answer-feedback.tsx
- access.ts
- postcss.config.mjs
- ios-brand-assets.sh script
- quran.ts
- placement-editor.tsx
- settings/index.ts
- billingInvoiceEmail.ts
- gamification-store.ts
- Two build targets: website (no student space) vs iOS/Android app
- auth-store.ts
- migrations.ts
- published/page.tsx
- MVP stack: Next.js 16, React 19, Tailwind v4, Zustand, Convex, Resend, OpenAI GPT-4, shadcn/ui, Framer Motion, @dnd-kit
- AGENTS.md
- pnpm-workspace.yaml

## God Nodes (most connected - your core abstractions)
1. `convex` - 117 edges
2. `lucide-react` - 100 edges
3. `react` - 99 edges
4. `refusalMessage()` - 65 edges
5. `next` - 64 edges
6. `cn()` - 55 edges
7. `callerIsAdmin()` - 47 edges
8. `vitest` - 43 edges
9. `framer-motion` - 38 edges
10. `@convex-dev/auth` - 34 edges

## Surprising Connections (you probably didn't know these)
- `Arabic glyph centered on its ink, not on the baseline` --references--> `amiri`  [INFERRED]
  docs/module-arabe-coran.md → app/layout.tsx
- `PioState` --implements--> `Nine everyday clips: idle, hello, cheer, sad, amazed, encourage, think, sleep, walk`  [INFERRED]
  components/student/pio.tsx → docs/pio-animations.md
- `Extending the game (subject, palier count, mission type, trail shape, Pio pose, Pio line)` --references--> `posterFor()`  [AMBIGUOUS]
  docs/monde-de-pio.md → components/student/pio.tsx
- `palierCountArg` --implements--> `Dynamic palier count per topic (topics.palierCount 1-10; defaults CI/CP 3, CE1/CE2 4, CM1/CM2 5)`  [INFERRED]
  convex/topics.ts → docs/paliers-et-exercices.md
- `scoreTrace()` --implements--> `What the module does not do (tajwid, binding trace grade, memorization certificate, class dashboard, translation)`  [INFERRED]
  lib/arabic/tracing.ts → docs/module-arabe-coran.md

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **CLI operations guarded by confirmDeployment (real spend or writes)** — docs_comptes_et_acces_confirm_deployment_guard, convex_testseedsschool_seedtestschool, convex_paliers_pregen_run, convex_paliers_pregen_invalidate, convex_paliers_pregen_repairmath, convex_paliers_pregen_repairdragdrop [EXTRACTED 1.00]
- **Two build targets: website without student space vs Capacitor app** — docs_capacitor_ios_two_build_targets, next_config_nextconfig, lib_build_target, github_workflows_ci_build_site_web, github_workflows_ci_build_app, app_eleve_page_studentapponlypage, package_scripts_build_app [EXTRACTED 1.00]
- **Pure rule modules unit-tested without convex-test** — docs_module_arabe_coran_pure_rule_functions_pattern, convex_arabic_placementrules, convex_palierrules, convex_questrules, convex_tests_palierrules_test, convex_tests_questrules_test [INFERRED 0.85]

## Communities (123 total, 11 thin omitted)

### Community 0 - "refusalMessage"
Cohesion: 0.11
Nodes (18): AdminAiSettingsPage(), SchoolImportPageInner(), handleImport(), TopicEditPageInner(), ParentActivationPage(), handleSubmit(), ChildCodePage(), handleConfirm() (+10 more)

### Community 1 - "billingRules.ts"
Cohesion: 0.08
Nodes (40): SubscriptionStatus, confirmInvoice, expectedWebhookHash(), InvoiceConfirmation, openInvoice, PaydunyaConfig, paydunyaHeaders(), AMENDMENT_DUE_DELAY_MS (+32 more)

### Community 2 - "session/page.app.tsx"
Cohesion: 0.09
Nodes (16): AttemptProgress, PalierResult, SanitizedExo, SceneAlert, CapRegenAlternatives(), JotnaLoader(), ExplainStepByStep(), CONFETTI_COLORS (+8 more)

### Community 3 - "lecon/page.app.tsx"
Cohesion: 0.09
Nodes (38): ReadingStep(), ReciteStep(), RecordAttempt, StepProps, SayButton(), CoachLine(), describe(), ListenButton() (+30 more)

### Community 4 - "ExercisePlayer.tsx"
Cohesion: 0.08
Nodes (28): DragDropExercise(), DragDropExerciseProps, DragDropPayload, zoneColors, ExerciseData, ExercisePlayerProps, ExerciseType, ExercisePrompt() (+20 more)

### Community 5 - "placement.ts"
Cohesion: 0.07
Nodes (56): callerProfile(), getLesson(), addTtsChars, callerContext, consumeSttQuota, findClip, MODULE_KEY, recordServerAttempt (+48 more)

### Community 6 - "arabic.test.ts"
Cohesion: 0.07
Nodes (52): isConsigneKey(), MAX_STRENGTH, letterWord, acceptedFormsForLetter(), judgePronunciation(), judgeReading(), judgeRecitation(), LATIN_ALIASES (+44 more)

### Community 7 - "arabe/page.app.tsx"
Cohesion: 0.10
Nodes (30): ArabicLessonPageInner(), ArabePathPage(), renderNode(), shake(), HifzState, LessonCard(), KAABA_HEIGHT, KAABA_INDEX (+22 more)

### Community 8 - "email-brand.ts"
Cohesion: 0.13
Nodes (23): sendLinkRequestEmail, sendRegenCapEmail, sendEmail, ResendOTPPasswordReset, EMAIL_FROM, emailBrandHtml(), emailLogoImgHtml(), escapeHtml() (+15 more)

### Community 9 - "schools.ts"
Cohesion: 0.07
Nodes (53): callerAdminProfile(), callerIsAdmin(), currentSchoolSubscription(), remove, getSchedule, ParsedImportRow, activateSubscription, activationRefusal() (+45 more)

### Community 10 - "drills.tsx"
Cohesion: 0.09
Nodes (26): StepView(), BALLOON_COLORS, BalloonPick(), CELEBRATE_MS, DotsGame(), tap(), LetterTile(), MatchPictures() (+18 more)

### Community 11 - "convex/curriculum.ts"
Cohesion: 0.11
Nodes (28): catalogAccess(), assertVisibleClass(), classEnum, ClassName, HIDDEN, HIDDEN_CLASSES, isHiddenClass(), VISIBLE_CLASSES (+20 more)

### Community 12 - "studentCredentials.ts"
Cohesion: 0.12
Nodes (24): buildLoginCode(), buildParentCode(), CLASS_LEVELS, IMPORT_ROWS_LIMIT, ImportParseError, ImportParseResult, normalizeCode(), PARSE_ERROR_MESSAGES (+16 more)

### Community 13 - "paliers/index.ts"
Cohesion: 0.07
Nodes (38): convex_generated_server_actionctx, AnswerInputMode, BucketArgs, checkPalierProgression, exerciseTypeValidator, extractConcept(), findBucket, fnv1a() (+30 more)

### Community 14 - "ecoles/detail/page.tsx"
Cohesion: 0.05
Nodes (34): AdminStatus, AmendableContract, BillingScheduleView, CandidateList, CLASS_LEVELS, ClassCard(), ClassesSection(), ClassLevel (+26 more)

### Community 15 - "hifz.ts"
Cohesion: 0.19
Nodes (23): MaskedText(), clampStrength(), firstLetter(), HifzRow, hifzStates(), HifzSurahState, isDue(), linkPointOf() (+15 more)

### Community 16 - "students.ts"
Cohesion: 0.09
Nodes (34): callerMayReadStudent(), conditionText(), convex_generated_server_mutation, computeLevel(), exosToNextLevel(), listByStudent, addDaysYmd(), applyActivity() (+26 more)

### Community 17 - "pregen.ts"
Cohesion: 0.11
Nodes (22): insertGeneratedExercises, isBaseExercise(), BucketOutcome, dedupe, DragDropBatch, DragDropSample, DragDropSummary, invalidate (+14 more)

### Community 18 - "quests.ts"
Cohesion: 0.13
Nodes (34): ActivityEvent, ALL_DONE_BONUS, allDone(), applyActivity(), bonusStarsFor(), completedCount(), EASY_TARGETS, gainFor() (+26 more)

### Community 19 - "attempts.ts"
Cohesion: 0.18
Nodes (16): blockedStudent(), getAttemptContextForVerification, getAttemptsForExercise, getExerciseAndAttempts, getProgressForTopic, markAttemptCorrectByAI, submit, verifyDragDrop() (+8 more)

### Community 20 - "convex_generated_server"
Cohesion: 0.09
Nodes (24): ResetPasswordForm(), generateExplanation, readVerdict(), verifyShortAnswerWithAI, crons, purgeOldHistory, buildPrompt(), explainExercise (+16 more)

### Community 21 - "mathRepair.ts"
Cohesion: 0.15
Nodes (33): parseAnswerNumber(), relabelWithResults(), acceptedForms(), closestOption(), declaredTolerance(), evaluateLeftToRight(), formatNumber(), isConsistent() (+25 more)

### Community 22 - "arabic/curriculum.ts"
Cohesion: 0.10
Nodes (32): ArabicAlphabetPage(), ARABIC_LETTERS, alphabetLessons(), ARABIC_LESSONS, ArabicLessonKind, ArabicLevel, assemblageLessons(), coranLessons() (+24 more)

### Community 23 - "scripts"
Cohesion: 0.20
Nodes (12): Static export packaged by Capacitor (no Next server on device), Lint step non-blocking (continue-on-error), scripts, android:sync, dev, ios:open, ios:sync, lint (+4 more)

### Community 24 - "sidebar.tsx"
Cohesion: 0.13
Nodes (27): Input(), Separator(), SidebarContext, SidebarContextProps, SidebarGroupAction(), SidebarGroupLabel(), SidebarInput(), SidebarMenuAction() (+19 more)

### Community 25 - "palierAttempts.ts"
Cohesion: 0.11
Nodes (34): checkAccess(), getAccessStateForProfile, requireAccess(), getResumeIndex, markBadgesSeen, canonicalAnswer(), getMyAttempt, getProgressForPalierAttempt (+26 more)

### Community 26 - "package.json"
Cohesion: 0.07
Nodes (26): config, eslintConfig, name, private, version, @auth/core, @capacitor/android, @capacitor/cli (+18 more)

### Community 27 - "accessCopy.ts"
Cohesion: 0.15
Nodes (12): PalierSession(), ExercisePlayer(), AccessReason, ACCESS_DENIED_PREFIX, isAccessDenied(), Attempt, Exercise, ExerciseSessionActions (+4 more)

### Community 28 - "exercises.ts"
Cohesion: 0.10
Nodes (29): callerIsStaff(), callerStaffProfile(), create, createDrafts, getById, listAllDrafts, listAllPublished, listByTeacher (+21 more)

### Community 29 - "convex"
Cohesion: 0.09
Nodes (8): SubjectsPage(), formatDate(), TeacherDashboardPage(), ICONS, convex_generated_api, convex_generated_api_api, convex, next

### Community 30 - "(parent)/layout.tsx"
Cohesion: 0.17
Nodes (19): sidebarLinks, ParentLayout(), sidebarLinks, sidebarLinks, TeacherLayout(), Brand(), KidSwitcher(), RoleGate() (+11 more)

### Community 31 - "tracing-canvas.tsx"
Cohesion: 0.17
Nodes (23): clamp01(), inkOrigin(), rasterizeGlyph(), targetCache, TraceOutcome, TracingCanvas(), alphaToGrid(), clamp01() (+15 more)

### Community 32 - "aiGateway/db.ts"
Cohesion: 0.17
Nodes (20): addToMonthSpend(), decrementUserDailyQuota, ensureSettings, getSettings, getUserDailyQuota, incrementUserDailyQuota, purposeValidator, recordUsage (+12 more)

### Community 33 - "dependencies"
Cohesion: 0.10
Nodes (20): dependencies, @auth/core, @base-ui/react, @capacitor/core, @capacitor/ios, class-variance-authority, clsx, @convex-dev/auth (+12 more)

### Community 34 - "ExercisePreview.tsx"
Cohesion: 0.10
Nodes (18): DragDropPayload, DragDropPreview(), DragDropPreviewProps, ExercisePreview(), ExercisePreviewProps, ExerciseType, MatchPayload, MatchPreview() (+10 more)

### Community 35 - "parentLink.ts"
Cohesion: 0.15
Nodes (15): decideLinkChild(), LinkDecision, LinkDenyReason, LinkInput, LinkRelation, requiredRoleFor(), attachGuardianByCode, CLAIM_REFUSALS (+7 more)

### Community 37 - "use-device-tier.ts"
Cohesion: 0.14
Nodes (16): SubjectBanner(), biomeFor(), BiomeMedallion(), BIOMES, Props, SavannaBackdrop(), Variant, Device tier lite/full (saveData, <=2 GB RAM, <=3 cores, 2G) (G5) (+8 more)

### Community 38 - "components.json"
Cohesion: 0.09
Nodes (21): aliases, components, hooks, lib, ui, utils, iconLibrary, menuAccent (+13 more)

### Community 39 - "sounds/index.ts"
Cohesion: 0.15
Nodes (19): useVictoryExtras(), LevelUpOverlay(), SoundOptInDialog(), attachOnlineRetry(), ensureHowler(), hasOptInBeenAsked(), HowlConstructor, HowlInstance (+11 more)

### Community 40 - "session.ts"
Cohesion: 0.20
Nodes (19): pickDistractors(), shuffle(), linkItemKey(), Verses heard then read one at a time (talqin), buildHifzSession(), buildLetterSession(), buildReadingSession(), buildSession() (+11 more)

### Community 41 - "ref_generated_datamodel"
Cohesion: 0.19
Nodes (12): ACCOUNT_TABLES, assertTargetedDeployment(), currentDeploymentName(), DATA_TABLES, purgeLegacyDailyQuests, wipeEverything, wipeStorage, debugStatus (+4 more)

### Community 43 - "MapViewport"
Cohesion: 0.14
Nodes (23): ZoomControls(), clamp(), Gesture, initialScaleFor(), MapViewport(), beginPan(), beginPinch(), clampAxis() (+15 more)

### Community 44 - "monde-de-pio.md"
Cohesion: 0.13
Nodes (17): StreakRibbon(), remember(), rememberedIndex(), WorldMapPage(), onArrive(), Stamp(), SubjectTrailPage(), Carnet (/student/profil): cream page with stamps (level, stars, exercises, trophies, streak) (+9 more)

### Community 45 - "pio-animations.md"
Cohesion: 0.16
Nodes (16): CLIP, LABELS, OUTFITS, PioOutfit, POSES, Arabe & Coran module (off by default, per school), No text in module images (generators invent fake letters), Redo or add a pose (PNG, plate, OpenArt, pio-encode.sh, register in pio.tsx) (+8 more)

### Community 46 - "compilerOptions"
Cohesion: 0.10
Nodes (19): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+11 more)

### Community 47 - "profil/page.app.tsx"
Cohesion: 0.20
Nodes (12): StudentAppOnlyPage(), fileToSquareBlob(), LogoutCard(), StudentProfileEditPage(), formatDuration(), LogoutCard(), StudentProfilePage(), useLogout() (+4 more)

### Community 48 - "sheet.tsx"
Cohesion: 0.18
Nodes (14): LINKS, Navbar(), useActiveSection(), Button(), buttonVariants, Sheet(), SheetContent(), SheetDescription() (+6 more)

### Community 49 - "user-menu.tsx"
Cohesion: 0.16
Nodes (14): getInitials(), UserMenu(), handleLogout(), UserMenuProps, Variant, Logout: the only deliberate document navigation, clearConvexAuthTokens(), LoginParams (+6 more)

### Community 50 - "billingBictorys.ts"
Cohesion: 0.09
Nodes (31): Afro.tools MCP server (African API specs registry), Claude Code on the web egress proxy blocks external API domains, markOverdueInstallments, settleInstallmentOffline, BictorysConfig, bictorysHeaders(), bictorysReference(), ChargeConfirmation (+23 more)

### Community 51 - "billing.ts"
Cohesion: 0.15
Nodes (15): graceAnchorFor(), loadAccessInput(), activeProvider(), applyPayment, ApplyPaymentResult, BillingSchedule, chargeProviderValidator, creditInstallment() (+7 more)

### Community 52 - "linkRequests.ts"
Cohesion: 0.20
Nodes (10): createRequest, generateToken(), getPendingForParent, internalGetById, internalGetByToken, internalGetParentName, internalGetStudentEmail, internalGetStudentName (+2 more)

### Community 53 - "pricing.ts"
Cohesion: 0.19
Nodes (16): billedSeats(), PRICING_SCALE, PricingScale, PricingTier, quoteSeatAmendment(), quoteSeatAmendmentWithScale(), quoteSubscription(), quoteWithScale() (+8 more)

### Community 54 - "game-map.tsx"
Cohesion: 0.16
Nodes (14): GameMap(), Props, WorldBackdrop(), buildTrail(), cubic(), TrailLayout, trailNodePoints(), trailPathD() (+6 more)

### Community 55 - "aiGateway/index.ts"
Cohesion: 0.21
Nodes (14): generate, GenerateResult, purposeValidator, quotaScopeValidator, sleep(), dayKey(), endOfDayUtc(), evaluateQuota() (+6 more)

### Community 56 - "reports.ts"
Cohesion: 0.11
Nodes (19): studentIdsTaughtBy(), listByTeacherStudents, getTeacherStudents, buildTopicReport(), EXERCISE_TYPE_LABELS, formatExerciseType(), ReportExercise, TopicReportContent (+11 more)

### Community 58 - "ios-brand-assets.swift"
Cohesion: 0.14
Nodes (16): CGContext, CGFloat, CGImage, CGRect, CoreGraphics, Generated iOS icon and launch screen (pnpm ios:brand), Foundation, ImageIO (+8 more)

### Community 59 - "badge-icon.tsx"
Cohesion: 0.15
Nodes (10): BadgeShield(), hashString(), ICON_MAP, LOCKED_METAL, Metal, PALETTES, pickPalette(), pickShape() (+2 more)

### Community 60 - "prompts.ts"
Cohesion: 0.15
Nodes (19): StepCard(), TopicTrail(), difficultyStage, ageForClass(), buildPalierBasePrompt(), buildPalierBaseSystemPrompt(), buildPersonalizedPrompt(), buildPersonalizedSystemPrompt() (+11 more)

### Community 61 - "pio-walker.tsx"
Cohesion: 0.17
Nodes (16): pioWalkFacing(), CameraHandle, PioWalker, PioWalkerSprite(), STAND_OFFSET, usePioWalker(), standAt(), walkTo() (+8 more)

### Community 62 - "convex/badges.ts"
Cohesion: 0.09
Nodes (31): AdminBadgesPage(), catalogReadable(), BADGE_CONDITIONS, BadgeEvaluation, badgeParams, buildSnapshot(), evaluateBadge(), isSupportedCondition() (+23 more)

### Community 63 - "design.md"
Cohesion: 0.20
Nodes (8): @playwright/test, Original data model (profiles, studentGuardians, subjects, topics, exercises, attempts, studentTopicProgress, badges, pdfUploads, topicReports), MVP decision log (10 decisions), MVP gamification plan (progress bar green to gold, badges, confetti unlock, star end screen), Managua: gamified educational web app for CE2-CM2 (8-10 years), francophone/Senegalese focus, MVP final status: 28 routes build, 119 unit tests (9 files), 5 Playwright E2E files, MVP out-of-scope items: RBAC on all Convex functions, batch publish, role middleware, env vars, Managua MVP implementation plan (6 phases, 60+ items)

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
Cohesion: 0.22
Nodes (13): BadgeRow, EarnedRow, ProgressRow, SHELF_TONE, SHELVES, StudentBadgesPage(), Tab, getRarityChipClass() (+5 more)

### Community 68 - "sound-opt-in-dialog.tsx"
Cohesion: 0.25
Nodes (9): StudentAlertTone, toneStyles, Dialog(), DialogContent(), DialogDescription(), DialogFooter(), DialogHeader(), DialogOverlay() (+1 more)

### Community 69 - "progression-niveau-etoiles-trophees.md"
Cohesion: 0.17
Nodes (16): checkAndAward, getConditionText(), normalizeRarities, approxStarsForValidatedPalier(), confirmDeployment guard: CLI operations must name their target deployment, End-of-palier screen replaces the old victory screen, End screen counts stars on exercises actually played (exerciseCount), 3 per exercise, threshold scaled, Trophy engine: catalogue conditions evaluated on a student snapshot (badgeRules.evaluateBadge) (+8 more)

### Community 70 - "devDependencies"
Cohesion: 0.13
Nodes (15): devDependencies, @capacitor/cli, eslint, eslint-config-next, jsdom, tailwindcss, @tailwindcss/postcss, @testing-library/jest-dom (+7 more)

### Community 71 - "progressionRules.ts"
Cohesion: 0.16
Nodes (26): buildStudentSnapshot(), submitPalier, isTopicComplete(), loadFinalExercisesForAttempt(), rebuild, summarizeAttempt(), summaryPatch(), syncTopicProgress() (+18 more)

### Community 72 - "dragDropRepair.ts"
Cohesion: 0.29
Nodes (10): DragDropItem, DragDropRepairInput, DragDropRepairOutcome, isGenericZoneLabel(), lettersWithoutInitials(), normalise(), oneItemPerZone(), repairDragDrop() (+2 more)

### Community 73 - "admin/exercises/edit/page.tsx"
Cohesion: 0.17
Nodes (4): ExerciseEditPageInner(), ExerciseType, getDefaultPayload(), TYPE_OPTIONS

### Community 74 - "app/page.tsx"
Cohesion: 0.08
Nodes (20): CallToAction(), ExerciseCard, ExerciseTypes(), TYPES, FAQ(), ITEMS, ForWhom(), Persona (+12 more)

### Community 75 - "capacitor-ios.md"
Cohesion: 0.18
Nodes (12): Android app target (Gradle project in android/, Capacitor 8.5.2, SDK 36, Java 21), Capacitor router serves root index.html for any extensionless path, Dynamic [id] routes replaced by query parameters, Export mode constraints: trailingSlash, unoptimized images, Never use window.location.href for internal navigation, Not covered: no native plugins, no App Store publication, nextConfig, @capacitor/android (+4 more)

### Community 76 - "gamification.tsx"
Cohesion: 0.23
Nodes (10): BadgeItem, BADGES, BadgesCard(), Gamification(), MASTERY, MasteryCard(), STREAK_DAYS, StreakCard() (+2 more)

### Community 77 - "factCheck.ts"
Cohesion: 0.35
Nodes (9): checkMathExercise(), evaluateExpression(), FactCheckOutcome, parseExpression(), parseFactor(), parseNumber(), parsePower(), ParserState (+1 more)

### Community 78 - "registry.ts"
Cohesion: 0.18
Nodes (13): estimateCostUsd(), getPurposeConfig(), GPT_4O, GPT_4O_MINI, isRetryableFailure(), PurposeConfig, REGISTRY, monthKey() (+5 more)

### Community 79 - "home/page.app.tsx"
Cohesion: 0.13
Nodes (21): LessonSummary(), WriteStep(), ModuleMedallion(), StudentHomePage(), tapPio(), TAP_POSES, useCheer(), GameButton() (+13 more)

### Community 80 - "pio.tsx"
Cohesion: 0.16
Nodes (17): PostAuthPage(), NativeAppGate(), OutfitSpec, Pio(), PioClip(), pioClipSources(), PioProps, posterFor() (+9 more)

### Community 81 - "budget.ts"
Cohesion: 0.23
Nodes (10): BudgetContext, BudgetDecision, BudgetTier, evaluateBudget(), GENERATIVE_PURPOSES, KID_INITIATED_PURPOSES, projectMonthEndSpend(), AiPurpose (+2 more)

### Community 82 - "convex/auth.ts"
Cohesion: 0.19
Nodes (11): auth, isAuthenticated, signIn, signOut, store, decideProvisionedRole(), PROVISIONABLE, ProvisionableRole (+3 more)

### Community 83 - "formatDay"
Cohesion: 0.24
Nodes (10): BillingSection(), classContext(), ContractActivation(), formatDay(), formatEventMoment(), formatFcfa(), MembershipHistory(), ModulesSection() (+2 more)

### Community 84 - "subjects/page.app.tsx"
Cohesion: 0.17
Nodes (13): PalierNode, TreasureMark(), LostTrail(), MapNodeContext, SUBJECT_TRAIL, trailNodePoint(), WORLD_TRAIL, TRAIL_NODE_SIZE (+5 more)

### Community 85 - "module-arabe-coran.md"
Cohesion: 0.18
Nodes (16): ArabicLessonPage(), ArabicGlyph(), FALLBACK, fontSpec(), Ink, inkCache, inkIfFontReady(), measureInk() (+8 more)

### Community 86 - "SubscriptionSection"
Cohesion: 0.36
Nodes (9): ADMIN_STATUSES, fromDayInput(), plural(), seatsContractLabel(), SeatsFullNotice(), seatsUsedLabel(), SeatUsageNotice(), SubscriptionSection() (+1 more)

### Community 87 - "brand.tsx"
Cohesion: 0.18
Nodes (6): BrandProps, BrandSize, SIZES, COLUMNS, Footer(), FooterColumn

### Community 88 - "hero.tsx"
Cohesion: 0.25
Nodes (4): ElegantShape(), ElegantShapeProps, Hero(), ROTATING_WORDS

### Community 89 - "profiles.ts"
Cohesion: 0.18
Nodes (14): decideProfileUpdate(), objectPreferences(), ProfileUpdateDecision, ProfileUpdateFields, ProfileUpdatePatch, wantsReportEmail(), createChildProfile, generateAvatarUploadUrl (+6 more)

### Community 90 - "palierRules.ts"
Cohesion: 0.12
Nodes (31): SubjectDetailPageInner(), TopicLevelFields(), DEFAULT_PALIERS_BY_CLASS, defaultPalierCount(), effectivePalierCount(), exercisesForTopic(), FALLBACK_PALIER_COUNT, isValidPalierCount() (+23 more)

### Community 91 - "comptes-et-acces.md"
Cohesion: 0.28
Nodes (7): LoginPage(), signUpWithCode, provisionStaffAccount, Parent activation on /register with a single-use expiring school code, Known weakness: parentLink.signUpWithCode is public, unauthenticated, not rate limited, Directeur/professeur receive initial credentials from the Jotna team, Student login: printed code as both identifier and password

### Community 92 - "ref_convex_generated_datamodel"
Cohesion: 0.13
Nodes (10): CONDITION_LABELS, TeacherExercise, TeacherExercisesPage(), TYPE_COLORS, TYPE_LABELS, formatDate(), TeacherStudentDetailPageInner(), Explanation (+2 more)

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

### Community 97 - "react"
Cohesion: 0.14
Nodes (7): SchoolsPage(), STATUS_CLASS, STATUS_LABEL, ForgotPasswordPage(), ExerciseType, TYPE_OPTIONS, react

### Community 98 - "reports.test.ts"
Cohesion: 0.40
Nodes (4): AttemptData, computeReport(), ExerciseData, formatExerciseType()

### Community 99 - "serve-export.mjs"
Cohesion: 0.33
Nodes (5): ref_node_fs, ref_node_http, ref_node_path, port, types

### Community 100 - "teacher/pdf-uploads/page.tsx"
Cohesion: 0.60
Nodes (4): formatDate(), formatFileSize(), STATUS_CONFIG, TeacherPdfUploadsPage()

### Community 101 - "testSeedsSchool.ts"
Cohesion: 0.16
Nodes (13): attachSeededStaff, CLASSES, createSchoolShell, DIRECTOR, openSeededImport, seededCredentials, SeededStaff, SeededStudent (+5 more)

### Community 103 - "answer-feedback.tsx"
Cohesion: 0.15
Nodes (9): AnswerFeedback(), AnswerOutcome, CONFETTI_COLORS, Kind, SCENE, useVictoryConfetti(), Not done: session keeps focus mode, no shop/currency (G7), no 3D Pio, student Playwright tests not run by CI, canvas-confetti (+1 more)

### Community 104 - "access.ts"
Cohesion: 0.29
Nodes (9): callerHasProfile(), callerRole(), currentProfile(), getAccessState, AccessInput, AccessState, decideAccess(), PAST_DUE_GRACE_MS (+1 more)

### Community 111 - "quran.ts"
Cohesion: 0.20
Nodes (11): LETTER_WORDS, Ayah, ayahWords(), BASMALA, BY_KEY, EXPECTED_AYAH_COUNT, getSurah(), RIWAYA (+3 more)

### Community 112 - "placement-editor.tsx"
Cohesion: 0.25
Nodes (7): ArabicPlacementList(), PLACEMENT_NOTICE, PlacementCatalog, PlacementRow(), PlacementStudent, PLACEMENT_LEVELS, PlacementLevel

### Community 113 - "settings/index.ts"
Cohesion: 0.29
Nodes (9): getMonthSpend, readMonthSpend(), convex_generated_server_databasereader, getMonthSpendSummary, getSettings, listRecentIncidents, loadAdminProfile(), SINGLETON (+1 more)

### Community 114 - "billingInvoiceEmail.ts"
Cohesion: 0.36
Nodes (8): METHOD_LABEL, sendInvoiceEmail, escapeHtml(), formatDate(), formatFcfa(), generateInvoiceEmailHtml(), InvoiceEmailData, plural()

### Community 115 - "gamification-store.ts"
Cohesion: 0.33
Nodes (6): BadgeUnlockModal(), Badge, GamificationActions, GamificationState, useGamificationStore, mockBadge

### Community 116 - "Two build targets: website (no student space) vs iOS/Android app"
Cohesion: 0.42
Nodes (8): Two build targets: website (no student space) vs iOS/Android app, CI step Build (application iOS/Android): requires out/student/home/index.html, CI step Build (site web): fails if out/student exists, CI job verify (Lint, typecheck, test, build), HAS_STUDENT_SPACE, STUDENT_APP_ONLY_PATH, build, build:app

### Community 117 - "auth-store.ts"
Cohesion: 0.28
Nodes (7): zustand, AuthActions, AuthState, useAuthStore, User, mockAdminUser, mockUser

### Community 118 - "migrations.ts"
Cohesion: 0.46
Nodes (7): collectStorageIds(), deleteStoredFiles(), lowercaseAuthAccounts, lowercaseEmails, removalPatch(), stripLegacyMediaFields, stripLegacyPromptAudio

### Community 119 - "published/page.tsx"
Cohesion: 0.33
Nodes (4): PublishedPage(), TYPE_COLORS, TYPE_LABELS, useTopicsMap()

### Community 120 - "MVP stack: Next.js 16, React 19, Tailwind v4, Zustand, Convex, Resend, OpenAI GPT-4, shadcn/ui, Framer Motion, @dnd-kit"
Cohesion: 0.33
Nodes (6): canvas-confetti, convex, openai, resend, zustand, MVP stack: Next.js 16, React 19, Tailwind v4, Zustand, Convex, Resend, OpenAI GPT-4, shadcn/ui, Framer Motion, @dnd-kit

### Community 121 - "AGENTS.md"
Cohesion: 0.50
Nodes (3): Rule: read convex/_generated/ai/guidelines.md before Convex work, Rule: this is NOT the Next.js you know (read node_modules/next/dist/docs first), dev:app

## Ambiguous Edges - Review These
- `posterFor()` → `Extending the game (subject, palier count, mission type, trail shape, Pio pose, Pio line)`  [AMBIGUOUS]
  docs/monde-de-pio.md · relation: references
- `normalizeRarities` → `badges:normalizeCatalog one-off threshold fix`  [AMBIGUOUS]
  docs/progression-niveau-etoiles-trophees.md · relation: conceptually_related_to
- `createChildProfile` → `Removed profiles.createChildAccount and /parent/children/add`  [AMBIGUOUS]
  docs/comptes-et-acces.md · relation: conceptually_related_to
- `allowBuilds (unresolved placeholders for esbuild, msw, sharp, unrs-resolver)` → `ignoredBuiltDependencies: sharp, unrs-resolver`  [AMBIGUOUS]
  pnpm-workspace.yaml · relation: conceptually_related_to
- `Two build targets: website (no student space) vs iOS/Android app` → `README.md`  [AMBIGUOUS]
  README.md · relation: conceptually_related_to
- `Pio walk: constant speed, 0.45-2.4 s per step, whole-sprite bounce, camera follows` → `Walk speed 90 world-px per second (WALK_SPEED), matched to the clip's steps`  [AMBIGUOUS]
  docs/monde-de-pio.md · relation: conceptually_related_to
- `MVP final status: 28 routes build, 119 unit tests (9 files), 5 Playwright E2E files` → `Managua MVP implementation plan (6 phases, 60+ items)`  [AMBIGUOUS]
  tasks/todo.md · relation: conceptually_related_to
- `Android app target (Gradle project in android/, Capacitor 8.5.2, SDK 36, Java 21)` → `Not covered: no native plugins, no App Store publication`  [AMBIGUOUS]
  docs/capacitor-ios.md · relation: conceptually_related_to

## Knowledge Gaps
- **581 isolated node(s):** `CONDITION_LABELS`, `StaffRow`, `ClassRow`, `ClassStudentRow`, `MembershipEventRow` (+576 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 809 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **11 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **What is the exact relationship between `posterFor()` and `Extending the game (subject, palier count, mission type, trail shape, Pio pose, Pio line)`?**
  _Edge tagged AMBIGUOUS (relation: references) - confidence is low._
- **What is the exact relationship between `normalizeRarities` and `badges:normalizeCatalog one-off threshold fix`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._
- **What is the exact relationship between `createChildProfile` and `Removed profiles.createChildAccount and /parent/children/add`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._
- **What is the exact relationship between `allowBuilds (unresolved placeholders for esbuild, msw, sharp, unrs-resolver)` and `ignoredBuiltDependencies: sharp, unrs-resolver`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._
- **What is the exact relationship between `Two build targets: website (no student space) vs iOS/Android app` and `README.md`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._
- **What is the exact relationship between `Pio walk: constant speed, 0.45-2.4 s per step, whole-sprite bounce, camera follows` and `Walk speed 90 world-px per second (WALK_SPEED), matched to the clip's steps`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._
- **What is the exact relationship between `MVP final status: 28 routes build, 119 unit tests (9 files), 5 Playwright E2E files` and `Managua MVP implementation plan (6 phases, 60+ items)`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._