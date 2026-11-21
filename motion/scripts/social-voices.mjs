// Génère les voix des publications (ElevenLabs), les normalise et mesure leur durée.
//   audio-src/social/raw/<clé>.mp3   voix brutes (cache : une réplique déjà faite n'est pas refaite)
//   public/audio/social/<clé>.mp3    voix normalisées (Rachel -16 LUFS, Steve -17 LUFS)
//   src/social/durations.json        { "<clé>": secondes }
//   public/audio/music/lets-play-africa-social.mp3   la musique, -16 LUFS, jouée en boucle
//
// Usage : ELEVENLABS_KEY_FILE=/chemin/vers/clé node scripts/social-voices.mjs [--dry]
// La clé n'est jamais affichée. La clé d'une réplique est le même hachage que voiceKey() de Social.tsx.
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const posts = JSON.parse(readFileSync(join(root, "src/social/posts.json"), "utf8"));
const dry = process.argv.includes("--dry");

const VOICES = { rachel: "or4EV8aZq78KWcXw48wd", steve: "jfEwztGDkpbpy89xeku6" };
const TARGET = { rachel: -16, steve: -17 };

const keyOf = (v) => {
  const s = `${v.who ?? "rachel"}|${v.model ?? "v4"}|${v.text}`;
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) >>> 0;
  return `v${h.toString(36)}`;
};

const lines = new Map();
for (const p of posts) for (const b of p.beats) for (const v of b.voices ?? []) lines.set(keyOf(v), v);
const chars = [...lines.values()].reduce((n, v) => n + v.text.length, 0);
console.log(`${lines.size} répliques, ${chars} caractères`);
if (dry) process.exit(0);

// La clé n'est lue que si une voix manque : avec toutes les voix brutes en place, le script marche sans clé.
let apiKey;
const key = () => (apiKey ??= readFileSync(process.env.ELEVENLABS_KEY_FILE, "utf8").trim());
const raw = join(root, "audio-src/social/raw");
const norm = join(root, "public/audio/social");
mkdirSync(raw, { recursive: true });
mkdirSync(norm, { recursive: true });

const settings = (v) =>
  v.model === "v2"
    ? { stability: 0.6, similarity_boost: 0.8, style: 0, use_speaker_boost: true }
    : { stability: 0.5, similarity_boost: 0.75 };

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function tts(v) {
  const body = { text: v.text, model_id: v.model === "v2" ? "eleven_multilingual_v2" : "eleven_v4", voice_settings: settings(v) };
  for (let t = 0; t < 5; t++) {
    const r = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${VOICES[v.who ?? "rachel"]}?output_format=mp3_44100_128`, {
      method: "POST",
      headers: { "xi-api-key": key(), "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (r.ok) return Buffer.from(await r.arrayBuffer());
    if (r.status === 429) await sleep(4000);
    else throw new Error(`ElevenLabs ${r.status}`);
  }
  throw new Error("ElevenLabs : trop de 429");
}

async function transcribe(buf) {
  const f = new FormData();
  f.append("model_id", "scribe_v2");
  f.append("language_code", "fra");
  f.append("file", new Blob([buf], { type: "audio/mpeg" }), "x.mp3");
  const r = await fetch("https://api.elevenlabs.io/v1/speech-to-text", { method: "POST", headers: { "xi-api-key": key() }, body: f });
  return r.ok ? ((await r.json()).text ?? "") : "";
}

// « Jotna » sort parfois « Job Na » : on refait la prise jusqu'à ce que Scribe l'écrive bien.
async function make(key, v) {
  const out = join(raw, `${key}.mp3`);
  if (existsSync(out)) return "cache";
  let buf = await tts(v);
  // Seulement sur les répliques courtes (une prise longue refaite coûte cher en caractères), 4 prises au plus.
  if (/jotna/i.test(v.text) && v.text.length < 200) {
    for (let take = 1; take < 4 && !/jotna/i.test(await transcribe(buf)); take++) buf = await tts(v);
  }
  writeFileSync(out, buf);
  return "nouveau";
}

let next = 0;
const entries = [...lines.entries()];
let made = 0;
await Promise.all(
  Array.from({ length: 3 }, async () => {
    while (next < entries.length) {
      const [key, v] = entries[next++];
      if ((await make(key, v)) === "nouveau") made++;
    }
  }),
);
console.log(`${made} nouvelles voix, ${entries.length - made} en cache`);

// Le résumé EBU R128 de ffmpeg est écrit sur stderr : on le lit par le shell.
const loudness = (file) => {
  const out = execFileSync("sh", ["-c", `ffmpeg -hide_banner -nostats -i "${file}" -af ebur128=framelog=quiet -f null - 2>&1`], { encoding: "utf8" });
  const m = [...out.matchAll(/I:\s+(-?[\d.]+) LUFS/g)].pop();
  return m ? Number(m[1]) : -23;
};
const ff = (args) => execFileSync("ffmpeg", ["-hide_banner", "-loglevel", "error", ...args]);

const durations = {};
for (const [key, v] of entries) {
  const src = join(raw, `${key}.mp3`);
  const dst = join(norm, `${key}.mp3`);
  const gain = (TARGET[v.who ?? "rachel"] - loudness(src)).toFixed(2);
  ff(["-y", "-i", src, "-af", `volume=${gain}dB,alimiter=limit=0.84:level=false`, "-ar", "44100", "-ac", "2", "-b:a", "192k", dst]);
  durations[key] = Number(execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", dst], { encoding: "utf8" }).trim());
}
writeFileSync(join(root, "src/social/durations.json"), JSON.stringify(durations, null, 1) + "\n");
console.log(`durations.json : ${Object.keys(durations).length} entrées`);

// Musique : le morceau Mixkit déjà utilisé, normalisé, joué en boucle par la vidéo.
const music = join(root, "audio-src/music/lets-play-africa.mp3");
if (existsSync(music)) {
  mkdirSync(join(root, "public/audio/music"), { recursive: true });
  const g = (-16 - loudness(music)).toFixed(2);
  ff(["-y", "-i", music, "-af", `volume=${g}dB,afade=t=in:d=1`, "-ar", "44100", "-ac", "2", "-b:a", "192k", join(root, "public/audio/music/lets-play-africa-social.mp3")]);
  console.log("musique prête");
} else {
  console.log("Musique absente : lancer d'abord scripts/prepare-audio-ad.sh (elle télécharge le morceau).");
}
