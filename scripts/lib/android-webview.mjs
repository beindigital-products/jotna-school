// LE WEBVIEW ANDROID PAR LE PROTOCOLE DEVTOOLS — ce que partagent
// `scripts/android-webview-tour.mjs` et `scripts/android-webview-mesure.mjs`.
//
// Le WebView d'une application de débogage expose le protocole DevTools de
// Chrome sur une socket abstraite (`webview_devtools_remote_<pid>`), que
// `adb forward` amène sur le port 9333 du Mac. Playwright ne sait pas s'y
// attacher (« Browser context management is not supported ») : un WebSocket
// nu suffit. Ici : la connexion, l'évaluation de JavaScript dans la page, les
// touchers (`Input.dispatchTouchEvent`, en pixels CSS de la fenêtre), la
// capture d'écran par `adb exec-out screencap` et le signal `data-stage-ready`
// de la galerie. Rien n'est écrit dans le dépôt.
import { execFileSync } from "node:child_process";

const ANDROID_HOME = process.env.ANDROID_HOME ?? "/opt/homebrew/share/android-commandlinetools";
export const ADB = process.env.ADB ?? `${ANDROID_HOME}/platform-tools/adb`;
export const APP_ID = "com.jotna.school";
const PORT = 9333;

export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** Branche le port 9333 sur le WebView de l'application et ouvre la session DevTools de sa page. */
export async function connectWebView() {
  const pid = execFileSync(ADB, ["shell", "pidof", APP_ID]).toString().trim();
  if (!pid) throw new Error(`${APP_ID} ne tourne pas sur l'émulateur : lancez d'abord scripts/native-loop-android.sh`);
  execFileSync(ADB, ["forward", `tcp:${PORT}`, `localabstract:webview_devtools_remote_${pid}`]);
  const pages = await (await fetch(`http://localhost:${PORT}/json`)).json();
  const target = pages.find((p) => p.type === "page");
  if (!target) throw new Error("aucune page dans le WebView");
  const ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => { ws.onopen = resolve; ws.onerror = reject; });

  let id = 0;
  const pending = new Map();
  const listeners = { console: [], event: [] };
  ws.onmessage = (event) => {
    const msg = JSON.parse(event.data);
    if (msg.id && pending.has(msg.id)) { pending.get(msg.id)(msg); pending.delete(msg.id); return; }
    if (msg.method === "Runtime.consoleAPICalled") {
      const text = msg.params.args.map((a) => a.value ?? a.description ?? "").join(" ");
      for (const fn of listeners.console) fn(msg.params.type, text);
    } else if (msg.method === "Runtime.exceptionThrown") {
      const d = msg.params.exceptionDetails;
      for (const fn of listeners.console) fn("exception", d.exception?.description ?? d.text);
    }
    for (const fn of listeners.event) fn(msg);
  };
  const send = (method, params = {}) => new Promise((resolve) => { const n = ++id; pending.set(n, resolve); ws.send(JSON.stringify({ id: n, method, params })); });
  await send("Page.enable");
  await send("Runtime.enable");

  /** Évalue une expression dans la page et renvoie sa valeur (promesses attendues). */
  const evaluate = async (expression) => {
    const r = await send("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true });
    if (r.result?.exceptionDetails) throw new Error(r.result.exceptionDetails.exception?.description ?? "évaluation en erreur");
    return r.result?.result?.value;
  };

  return {
    send,
    evaluate,
    onConsole(fn) { listeners.console.push(fn); },
    onEvent(fn) { listeners.event.push(fn); },
    async navigate(url) { await send("Page.navigate", { url }); },
    /** Le badge « N » des outils de développement de Next, hors des captures. */
    async hideNextBadge() {
      await evaluate(`(() => { const p = document.querySelector("nextjs-portal"); if (p) p.style.display = "none"; })()`);
    },
    /** Le centre d'un élément (l'expression renvoie l'élément), en pixels CSS de la fenêtre, après l'avoir amené à l'écran. */
    async center(expr) {
      const v = await evaluate(`(() => { const el = (${expr}); if (!el) return null; el.scrollIntoView?.({ block: "center", behavior: "instant" }); const r = el.getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2, r.width, r.height]; })()`);
      if (!v) throw new Error(`élément introuvable : ${expr}`);
      return v;
    },
    async touch(type, x, y) {
      await send("Input.dispatchTouchEvent", { type, touchPoints: type === "touchEnd" ? [] : [{ x, y, radiusX: 8, radiusY: 8, force: 1 }] });
    },
    /** Un doigt posé puis levé. */
    async tapAt(x, y) {
      await this.touch("touchStart", x, y);
      await sleep(40);
      await this.touch("touchEnd", x, y);
    },
    /** Un glissé en `steps` pas, 32 ms entre deux. `hold` : le temps d'appui avant de bouger. */
    async dragFrom(x, y, dx, dy, { steps = 16, hold = 0 } = {}) {
      await this.touch("touchStart", x, y);
      if (hold) await sleep(hold);
      for (let i = 1; i <= steps; i++) {
        await this.touch("touchMove", x + (dx * i) / steps, y + (dy * i) / steps);
        await sleep(32);
      }
      await sleep(80);
      await this.touch("touchEnd", x + dx, y + dy);
    },
    /** La capture d'écran, en PNG. */
    screencap() {
      return execFileSync(ADB, ["exec-out", "screencap", "-p"], { maxBuffer: 64 * 1024 * 1024 });
    },
    close() { ws.close(); },
  };
}

/** Attend que toutes les cartes de la galerie portent `data-stage-ready="1"`. */
export async function waitStageReady(wv, timeoutMs = 20000) {
  const t0 = Date.now();
  while (Date.now() - t0 < timeoutMs) {
    const ok = await wv.evaluate(`(() => { const c = document.querySelectorAll("[data-stage-ready]"); return c.length > 0 && Array.from(c).every((e) => e.getAttribute("data-stage-ready") === "1"); })()`).catch(() => false);
    if (ok === true) return true;
    await sleep(300);
  }
  return false;
}

/** Attend qu'une page de jeu (galerie prête ou carte de séance) soit là. */
export async function waitGamePage(wv, timeoutMs = 25000) {
  const t0 = Date.now();
  while (Date.now() - t0 < timeoutMs) {
    const ok = await wv.evaluate(`!!document.querySelector("[data-exercise-card], [data-stage-ready]") && (document.querySelector("[data-stage-ready]") ? document.querySelector("[data-stage-ready]").getAttribute("data-stage-ready") === "1" : true)`).catch(() => false);
    if (ok === true) return true;
    await sleep(400);
  }
  return false;
}

/** Le JavaScript d'un bouton par son texte exact (« Valider »), non désactivé. */
export const buttonByText = (text) => `Array.from(document.querySelectorAll("button")).find((b) => b.textContent.trim() === ${JSON.stringify(text)} && !b.disabled)`;
