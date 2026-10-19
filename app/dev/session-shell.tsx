"use client";

import { AnimatePresence, MotionConfig, motion } from "framer-motion";
import { Volume2, X } from "lucide-react";
import { useEffect, type ReactNode } from "react";
import { kidMessages } from "@/lib/kidCopy";

/**
 * LA COQUE D'UNE SÉANCE, REPRODUITE À L'IDENTIQUE pour les pages de
 * développement : le fond du monde de Pio, la marge du mode focus, la barre
 * de séance (nom de la thématique, « Palier 1 · Question 3/10 », son, quitter,
 * barre de progression) et la carte blanche de l'exercice.
 *
 * CHAQUE CLASSE EST COPIÉE de `app/(student)/layout.tsx` (mode focus) et de
 * `app/(student)/student/topics/session/online-session.tsx` : une capture de la
 * galerie doit être une capture de la séance, au pixel près. Si la séance
 * change, changer ici aussi ; un test ne le vérifie pas.
 *
 * `reduced` SIMULE « prefers-reduced-motion » depuis la page : framer-motion
 * passe en `reducedMotion="always"`, et les animations CSS des exercices
 * (`pop-in`, `shake`, `animate-pulse`) sont coupées par une règle posée sous
 * `data-reduced-motion`. C'est une simulation : ce que les composants lisent
 * par `window.matchMedia` (les confettis) n'y voit rien. Pour la vraie requête
 * média, `scripts/shoot-exercises.mjs` lance Chromium avec
 * `reducedMotion: "reduce"`.
 */
export function SessionShell({ children, reduced = false }: { children: ReactNode; reduced?: boolean }) {
  return (
    <MotionConfig reducedMotion={reduced ? "always" : "user"}>
      <div
        data-reduced-motion={reduced ? "1" : undefined}
        className="flex min-h-screen flex-col bg-[linear-gradient(180deg,#bfe6fb_0%,#f9efd2_45%,#f6dfa4_100%)]"
      >
        {reduced && (
          <style>{`[data-reduced-motion] *, [data-reduced-motion] *::before, [data-reduced-motion] *::after { animation: none !important; transition-duration: 0s !important; }`}</style>
        )}
        {/* Le fond crème derrière l'encoche, comme en mode focus. Hauteur nulle sur le web. */}
        <div
          aria-hidden
          className="fixed inset-x-0 top-0 z-30 h-[env(safe-area-inset-top)]"
          style={{
            background: "var(--focus-top-bg, rgb(255 247 224 / 0.9))",
            backdropFilter: "var(--focus-top-blur, blur(12px))",
          }}
        />
        <main className="mx-auto w-full max-w-5xl flex-1 px-4 pt-[env(safe-area-inset-top)] pb-[calc(env(safe-area-inset-bottom)+1.5rem)]">
          {children}
        </main>
        <DevProbe />
      </div>
    </MotionConfig>
  );
}

/**
 * LA SONDE DES WEBVIEWS (`?sonde=1`, pages de développement seulement) : ce
 * que la console du WKWebView ou du WebView dit de la page, là où aucun outil
 * ne s'attache (`docs/boucle-native-jeu.md`, § 6). Chaque seconde, les écarts
 * `requestAnimationFrame` (`[raf]`) et l'état du dock, du clavier et de Pio
 * (`[dock]`) ; à 2,5 s, le premier écran (`[fit]`) ; avec `&bas=1`, la page
 * défilée en bas (`[bas]`) ; chaque toucher (`[tap]`), chaque mouvement du
 * viewport visuel (`[vv]`, coupé par `&calme=1` pendant une mesure d'écarts),
 * et chaque événement des clips de Pio (`[video]`). Rien sans le paramètre.
 */
function DevProbe() {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("sonde") !== "1") return;
    const round = (n: number | undefined) => (n === undefined ? "-" : Math.round(n));
    const box = (selector: string) => document.querySelector(selector)?.getBoundingClientRect();
    const layoutHeight = () => Math.max(innerHeight, document.documentElement.clientHeight);

    let last = performance.now();
    const t0 = last;
    let gaps: number[] = [];
    let raf = 0;
    const tick = (now: number) => {
      gaps.push(now - last);
      last = now;
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    const dockLine = (tag: string) => {
      const dock = document.querySelector<HTMLElement>("[data-scene-dock]");
      const d = dock?.getBoundingClientRect();
      const vv = window.visualViewport;
      const field = box("[data-exercise-card] input");
      const valider = Array.from(dock?.querySelectorAll("button") ?? []).find((b) => b.textContent?.includes("Valider"))?.getBoundingClientRect();
      const stage = document.querySelector<HTMLElement>("[data-session-stage]");
      const dockH = stage ? getComputedStyle(stage).getPropertyValue("--dock-h").trim() : "-";
      const spb = getComputedStyle(document.documentElement).scrollPaddingBottom;
      const hud = box("[data-session-hud]");
      const pio = box("[data-question-scene] .pio");
      console.log(
        `[${tag}] t=${(performance.now() / 1000).toFixed(3)} inner=${innerHeight} ch=${document.documentElement.clientHeight} vv=${round(vv?.height)} off=${round(vv?.offsetTop)} pageTop=${round(vv?.pageTop)} inset=${dock?.dataset.keyboardInset ?? "-"} empty=${dock?.dataset.dockEmpty ?? "0"} dockH=${dockH} spb=${spb} dock=${round(d?.top)}-${round(d?.bottom)} h=${round(d?.height)} tf=${dock ? getComputedStyle(dock).transform : "-"} valider=${round(valider?.top)}-${round(valider?.bottom)} field=${round(field?.top)}-${round(field?.bottom)} hud=${round(hud?.top)}-${round(hud?.bottom)} pio=${round(pio?.top)} card=${round(box("[data-exercise-card]")?.top)}-${round(box("[data-exercise-card]")?.bottom)} clip=${document.querySelector<HTMLElement>("[data-coach-clip]")?.dataset.coachClip ?? "-"} voix=${document.querySelector<HTMLElement>("[data-listen-status]")?.dataset.listenStatus ?? "-"} focus=${document.activeElement?.tagName ?? "-"} scrollY=${Math.round(scrollY)} st=${Math.round(document.scrollingElement?.scrollTop ?? -1)} sh=${document.documentElement.scrollHeight}`,
      );
    };
    // `&calme=1` : pas de ligne par événement du viewport (chaque ligne passe
    // par le pont natif et force une mise en page : elle fausse les écarts rAF).
    const quiet = params.get("calme") === "1";
    const onWindow = () => {
      if (quiet) return;
      dockLine("win");
      requestAnimationFrame(() => dockLine("win+raf"));
    };
    window.addEventListener("resize", onWindow);
    // Où un toucher de l'écran atterrit dans la page (coordonnées client) : la
    // carte entre l'écran et le viewport de mise en page.
    const onPointer = (event: PointerEvent) => {
      const target = event.target as HTMLElement | null;
      console.log(
        `[tap] client=${Math.round(event.clientX)},${Math.round(event.clientY)} page=${Math.round(event.pageX)},${Math.round(event.pageY)} cible=${target?.tagName}${target?.getAttribute("aria-label") ? `(${target.getAttribute("aria-label")})` : ""}${target?.closest("[data-scene-dock]") ? " dock" : ""}${target?.closest("[data-exercise-card]") ? " carte" : ""}`,
      );
    };
    document.addEventListener("pointerdown", onPointer, true);
    const onTouch = (event: TouchEvent) => {
      const touch = event.touches[0];
      const target = event.target as HTMLElement | null;
      if (touch) console.log(`[touch] client=${Math.round(touch.clientX)},${Math.round(touch.clientY)} page=${Math.round(touch.pageX)},${Math.round(touch.pageY)} cible=${target?.tagName}`);
    };
    document.addEventListener("touchstart", onTouch, true);
    // Ce que les clips de Pio disent d'eux-mêmes (`[video]`) : les événements
    // des médias ne remontent pas, un écouteur de capture sur le document les
    // reçoit quand même. C'est ainsi qu'on a su si un son qui part fait
    // PAUSER le clip HEVC d'iOS (il recevrait `pause`) ou éteint sa couche sans
    // un mot (18 octobre 2026, `docs/pio-animations.md`).
    const MEDIA_EVENTS = ["loadeddata", "playing", "pause", "suspend", "waiting", "stalled", "ended", "emptied", "error"] as const;
    const onMedia = (event: Event) => {
      const video = event.target as HTMLVideoElement | null;
      if (!(video instanceof HTMLVideoElement)) return;
      const clip = video.currentSrc.split("/").pop() ?? "?";
      console.log(`[video] ${event.type} t=${(performance.now() / 1000).toFixed(3)} clip=${clip} ct=${video.currentTime.toFixed(2)} paused=${video.paused} ready=${video.readyState}`);
    };
    for (const type of MEDIA_EVENTS) document.addEventListener(type, onMedia, true);

    const fit = () => {
      const scene = document.querySelector<HTMLElement>("[data-question-scene]");
      const pio = scene ? getComputedStyle(scene).getPropertyValue("--stage-pio").trim() : "";
      const pioBox = box("[data-question-scene] .pio");
      const dock = document.querySelector("[data-scene-dock]:not([data-dock-empty])")?.getBoundingClientRect();
      const card = box("[data-exercise-card]");
      const hud = box("[data-session-hud]");
      const first = Array.from(
        document.querySelectorAll(
          '[data-exercise-card] button, [data-exercise-card] input, [data-exercise-card] [aria-roledescription="draggable"], [data-exercise-card] [aria-roledescription="sortable"], [data-exercise-card] [role="gridcell"]',
        ),
      ).find((element) => !element.closest("[data-scene-actions]"));
      const answer = first?.getBoundingClientRect();
      const floor = dock ? dock.top : innerHeight;
      console.log(
        `[fit] vp=${innerWidth}x${innerHeight} pio=${pio} pioPx=${round(pioBox?.height)} hud=${round(hud?.top)}-${round(hud?.bottom)} cardTop=${round(card?.top)} cardBottom=${round(card?.bottom)} dockTop=${round(dock?.top)} dockH=${round(dock?.height)} dockBottom=${round(dock?.bottom)} firstAnswerBottom=${round(answer?.bottom)} firstAnswerRoom=${answer ? Math.round(floor - answer.bottom) : "-"} sh=${document.documentElement.scrollHeight}`,
      );
      if (params.get("bas") === "1") {
        // Jusqu'au bas exact (le WKWebView ne borne pas un `scrollTo` au-delà :
        // il dépasse puis rebondit), puis 600 ms pour que tout se pose.
        window.scrollTo({ top: document.documentElement.scrollHeight - layoutHeight(), behavior: "instant" });
        setTimeout(() => {
          const c = box("[data-exercise-card]");
          const d2 = document.querySelector("[data-scene-dock]:not([data-dock-empty])")?.getBoundingClientRect();
          const f = d2 ? d2.top : innerHeight;
          console.log(`[bas] scrollY=${Math.round(scrollY)} sh=${document.documentElement.scrollHeight} cardBottom=${round(c?.bottom)} dockTop=${round(d2?.top)} cardRoom=${c ? Math.round(f - c.bottom) : "-"}`);
        }, 600);
      }
    };

    const every = setInterval(() => {
      if (gaps.length) {
        const sorted = [...gaps].sort((a, b) => a - b);
        const mean = gaps.reduce((a, b) => a + b, 0) / gaps.length;
        console.log(
          `[raf] t=${((performance.now() - t0) / 1000).toFixed(1)} n=${gaps.length} mean=${mean.toFixed(1)} p95=${sorted[Math.floor(sorted.length * 0.95)].toFixed(1)} max=${sorted[sorted.length - 1].toFixed(1)} >50=${gaps.filter((g) => g > 50).length} >100=${gaps.filter((g) => g > 100).length}`,
        );
        gaps = [];
      }
      dockLine("dock");
    }, 1000);
    const vv = window.visualViewport;
    const onViewport = () => {
      if (quiet) return;
      dockLine("vv");
      requestAnimationFrame(() => dockLine("vv+raf"));
    };
    vv?.addEventListener("resize", onViewport);
    vv?.addEventListener("scroll", onViewport);
    const fitTimer = setTimeout(fit, 2500);
    return () => {
      cancelAnimationFrame(raf);
      clearInterval(every);
      clearTimeout(fitTimer);
      window.removeEventListener("resize", onWindow);
      document.removeEventListener("pointerdown", onPointer, true);
      document.removeEventListener("touchstart", onTouch, true);
      for (const type of MEDIA_EVENTS) document.removeEventListener(type, onMedia, true);
      vv?.removeEventListener("resize", onViewport);
      vv?.removeEventListener("scroll", onViewport);
    };
  }, []);
  return null;
}

/** La barre collée en haut de la séance, et sa barre de progression. */
export function SessionBar({
  topic,
  palierIndex,
  questionIndex,
  total,
  answered = false,
}: {
  topic: string;
  palierIndex: number;
  /** Zéro pour la première question. */
  questionIndex: number;
  total: number;
  /** Vrai quand la question courante vient d'être réussie : la barre avance d'un cran. */
  answered?: boolean;
}) {
  return (
    <div className="sticky top-[env(safe-area-inset-top)] z-20 -mx-4 mb-4 border-b border-amber-200/60 bg-[#fff7e0]/90 px-4 pb-2.5 pt-2 backdrop-blur-md">
      <div className="flex items-center gap-2">
        <div className="min-w-0 flex-1">
          <p className="truncate font-display text-xl font-extrabold leading-tight text-amber-950">{topic}</p>
          <p className="mt-0.5 font-display text-sm font-bold text-amber-900/80">
            Palier {palierIndex} · Question {questionIndex + 1}/{total}
          </p>
        </div>
        <button
          type="button"
          aria-label="Couper le son"
          aria-pressed
          className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-2 border-amber-200 bg-white text-amber-900 shadow-sm transition-all hover:bg-amber-50"
        >
          <Volume2 className="h-6 w-6" aria-hidden />
        </button>
        <button
          type="button"
          aria-label={kidMessages.cta.quit}
          className="inline-flex h-12 min-w-12 shrink-0 items-center justify-center gap-1.5 rounded-full border-2 border-amber-200 bg-white px-3 font-display text-sm font-extrabold text-amber-900 shadow-sm hover:bg-amber-50"
        >
          <X className="h-6 w-6" strokeWidth={3} aria-hidden />
          <span className="hidden sm:inline">{kidMessages.cta.quit}</span>
        </button>
      </div>

      <div className="mt-2.5 h-3 w-full overflow-hidden rounded-full bg-amber-900/15">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${((questionIndex + (answered ? 1 : 0)) / total) * 100}%` }}
          className="h-full rounded-full bg-gradient-to-r from-orange-400 to-pink-500"
        />
      </div>
    </div>
  );
}

/** La carte blanche de l'exercice, avec l'entrée de la séance. La clé change avec l'exercice. */
export function ExerciseCard({ cardKey, children }: { cardKey: string; children: ReactNode }) {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={cardKey}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.2 }}
        className="rounded-3xl bg-white p-6 shadow-md"
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}

// ---------------------------------------------------------------------------
// La barre de commande des pages de développement : sombre, hors du jeu, pour
// qu'on ne la confonde jamais avec un écran de l'élève. `?barre=0` la cache
// (les captures).
// ---------------------------------------------------------------------------

export function DevBar({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="sticky top-0 z-40 -mx-4 mb-4 border-b border-slate-700 bg-slate-900/95 px-4 py-2 text-xs text-slate-100 backdrop-blur print:hidden">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-x-3 gap-y-2">
        <span className="rounded bg-amber-400 px-1.5 py-0.5 font-mono text-[11px] font-bold text-slate-900">dev</span>
        <span className="font-bold">{title}</span>
        {children}
      </div>
    </div>
  );
}

export function DevSelect<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: readonly { value: T; label: string }[];
  onChange: (value: T) => void;
}) {
  return (
    <label className="inline-flex min-h-11 items-center gap-1.5">
      <span className="text-slate-300">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value as T)}
        className="min-h-9 rounded-md border border-slate-600 bg-slate-800 px-2 text-sm text-white"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

export function DevToggle({
  label,
  checked,
  onChange,
  title,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  title?: string;
}) {
  return (
    <label className="inline-flex min-h-11 cursor-pointer items-center gap-1.5 select-none" title={title}>
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="h-5 w-5 accent-amber-400"
      />
      <span>{label}</span>
    </label>
  );
}

export function DevButton({ children, onClick }: { children: ReactNode; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="min-h-9 rounded-md border border-slate-600 bg-slate-800 px-2.5 text-sm font-semibold text-white hover:bg-slate-700"
    >
      {children}
    </button>
  );
}
