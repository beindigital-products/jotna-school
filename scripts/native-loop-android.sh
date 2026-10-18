#!/usr/bin/env bash
# LA BOUCLE NATIVE ANDROID — la galerie des exercices (ou toute page du serveur
# de développement) dans le VRAI WebView de l'application, sur l'émulateur
# Pixel_Jotna sans fenêtre, rechargée à chaud par `pnpm dev`. Mode d'emploi et
# pièges : docs/boucle-native-jeu.md.
#
# Usage :
#   scripts/native-loop-android.sh [--no-build] [--url URL] [--shot fichier.png]
#       [--record fichier.mp4 SECONDES] [--work DOSSIER] [--avd NOM] [--window]
#       [--wait SECONDES] [--stop]
#
#   --no-build  réinstalle l'APK déjà construit (android/app/build/…). Par défaut
#               on reconstruit : l'URL vit dans les assets de l'APK, changer
#               d'URL impose un `gradle assembleDebug` (incrémental, rapide).
#   --url       la page à ouvrir ; défaut http://localhost:3000/dev/exercices/?barre=0
#               Depuis l'émulateur, localhost est joint par `adb reverse
#               tcp:3000 tcp:3000` (posé par le script). PAS 10.0.2.2 : Next
#               refuse les requêtes de développement d'une autre origine que
#               localhost (`allowedDevOrigins`) ; la page reste blanche et le
#               WebSocket HMR échoue (ERR_INVALID_HTTP_RESPONSE).
#   --shot      capture d'écran après le lancement (adb exec-out screencap)
#   --record    film de N secondes (adb shell screenrecord)
#   --work      dossier de travail (journaux) ; défaut ${TMPDIR:-/tmp}/jotna-native-loop/android
#   --avd       défaut Pixel_Jotna
#   --window    une fenêtre d'émulateur (défaut : sans fenêtre, GPU logiciel)
#   --gpu       le rendu de l'émulateur : swiftshader_indirect (défaut, GPU
#               logiciel : le pire cas, tout se rastérise au processeur) ou
#               host (le GPU du Mac : plus proche d'un vrai téléphone pour
#               juger la fluidité ; voir docs/boucle-native-jeu.md § 6)
#   --wait      secondes entre le lancement et la capture (défaut 8)
#   --jobs      ouvriers Gradle en parallèle (défaut 4 : la machine fait tourner
#               d'autres travaux)
#   --stop      éteint l'émulateur à la fin
#
# Ce que le script touche dans le dépôt, et remet en place quoi qu'il arrive
# (trap) : capacitor.config.ts, remplacé le temps de `cap sync`, et les deux
# fichiers Gradle que `sync` régénère (capacitor.build.gradle,
# capacitor.settings.gradle) s'ils changent. Ce qu'il génère est ignoré par
# git : android/app/src/main/assets/{public, capacitor.config.json,
# capacitor.plugins.json}, android/capacitor-cordova-android-plugins/,
# android/app/build/, .ci-local/.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
export PATH="$HOME/.local/share/fnm/aliases/default/bin:$PATH"
export ANDROID_HOME="${ANDROID_HOME:-/opt/homebrew/share/android-commandlinetools}"
export ANDROID_SDK_ROOT="$ANDROID_HOME"
export JAVA_HOME="${JAVA_HOME:-/opt/homebrew/opt/openjdk@21/libexec/openjdk.jdk/Contents/Home}"
export PATH="$ANDROID_HOME/platform-tools:$ANDROID_HOME/emulator:$JAVA_HOME/bin:$PATH"

AVD="Pixel_Jotna"
URL="http://localhost:3000/dev/exercices/?barre=0"
WORK="${TMPDIR:-/tmp}/jotna-native-loop/android"
APP_ID="com.jotna.school"
BUILD=1
SHOT=""
RECORD=""
RECORD_SECONDS=8
WAIT=8
JOBS=4
WINDOW=0
GPU="swiftshader_indirect"
STOP=0

while [ $# -gt 0 ]; do
  case "$1" in
    --no-build) BUILD=0 ;;
    --url) URL="$2"; shift ;;
    --shot) SHOT="$2"; shift ;;
    --record) RECORD="$2"; RECORD_SECONDS="$3"; shift 2 ;;
    --work) WORK="$2"; shift ;;
    --avd) AVD="$2"; shift ;;
    --window) WINDOW=1 ;;
    --gpu) GPU="$2"; shift ;;
    --wait) WAIT="$2"; shift ;;
    --jobs) JOBS="$2"; shift ;;
    --stop) STOP=1 ;;
    -h|--help) sed -n '2,30p' "$0"; exit 0 ;;
    *) echo "option inconnue : $1" >&2; exit 2 ;;
  esac
  shift
done
mkdir -p "$WORK"

# 1. Le serveur de développement répond (vu du Mac : 10.0.2.2, si on l'emploie
#    quand même, devient localhost).
HOST_URL="${URL/10.0.2.2/localhost}"
if ! curl -sf -o /dev/null --max-time 20 "$HOST_URL"; then
  echo "Le serveur ne répond pas sur $HOST_URL : lancez d'abord pnpm dev." >&2
  exit 1
fi

# 2. L'émulateur, allumé et prêt. Un seul à la fois.
if ! adb devices | grep -q "^emulator-"; then
  echo "démarrage de l'émulateur $AVD (journal : $WORK/emulator.log)…"
  EMU_ARGS=(-avd "$AVD" -gpu "$GPU" -no-snapshot -no-audio -no-boot-anim)
  if [ "$WINDOW" = 0 ]; then EMU_ARGS+=(-no-window); fi
  nohup emulator "${EMU_ARGS[@]}" >"$WORK/emulator.log" 2>&1 &
  disown
fi
adb wait-for-device
for _ in $(seq 1 90); do
  if [ "$(adb shell getprop sys.boot_completed 2>/dev/null | tr -d '\r')" = "1" ]; then break; fi
  sleep 2
done
if [ "$(adb shell getprop sys.boot_completed 2>/dev/null | tr -d '\r')" != "1" ]; then
  echo "L'émulateur ne finit pas de démarrer (voir $WORK/emulator.log)." >&2
  exit 1
fi
# Le port 3000 de l'émulateur mène au Mac : le WebView parle à « localhost »,
# la seule origine que le serveur de développement de Next accepte. À refaire
# après chaque redémarrage de l'émulateur (le script le refait toujours).
adb reverse tcp:3000 tcp:3000 >/dev/null

# 3. La configuration Capacitor temporaire, le temps de `cap sync`. Avec
#    `cleartext: true`, Capacitor écrit android:usesCleartextTraffic dans le
#    manifeste de son module de plugins (android/capacitor-cordova-android-
#    plugins, ignoré par git), que Gradle fusionne : le WebView accepte http.
CONFIG="capacitor.config.ts"
BACKUP="$WORK/capacitor.config.ts.bak"
# `cap sync` (`update`) réécrit ces deux fichiers suivis par git ; s'ils étaient
# propres avant et changent, on les remet (le contenu ne dépend que des plugins
# installés : il est normalement identique).
TRACKED=(android/app/capacitor.build.gradle android/capacitor.settings.gradle)
/bin/cp -f "$CONFIG" "$BACKUP"
if [ -z "$(git status --porcelain -- "${TRACKED[@]}")" ]; then TRACKED_WERE_CLEAN=1; else TRACKED_WERE_CLEAN=0; fi
restore() {
  /bin/cp -f "$BACKUP" "$CONFIG"
  if [ "$TRACKED_WERE_CLEAN" = 1 ] && [ -n "$(git status --porcelain -- "${TRACKED[@]}")" ]; then
    git checkout -- "${TRACKED[@]}"
  fi
}
trap restore EXIT

SHELL_DIR=".ci-local/dev-shell"
mkdir -p "$SHELL_DIR"
printf '<!doctype html><meta charset="utf-8"><title>Jotna dev</title><p>Coquille : la page vient du serveur de d\xc3\xa9veloppement.</p>\n' > "$SHELL_DIR/index.html"
cat > "$CONFIG" <<EOF
import type { CapacitorConfig } from "@capacitor/cli";

// CONFIGURATION TEMPORAIRE écrite par scripts/native-loop-android.sh. Ne pas
// commiter : le script remet l'original en place à la fin.
const config: CapacitorConfig = {
  appId: "$APP_ID",
  appName: "Jotna School",
  webDir: "$SHELL_DIR",
  server: { url: "$URL", cleartext: true },
};

export default config;
EOF
#    `sync`, pas seulement `copy` : `update` écrit capacitor.plugins.json et
#    la liste des plugins ; sans lui, le pont natif ne charge aucun plugin et
#    l'application perd le système de fichiers du hors-ligne.
if ! npx cap sync android >"$WORK/cap-sync.log" 2>&1; then
  cat "$WORK/cap-sync.log" >&2
  exit 1
fi
/bin/cp -f "$BACKUP" "$CONFIG"
if ! grep -q 'usesCleartextTraffic="true"' android/capacitor-cordova-android-plugins/src/main/AndroidManifest.xml 2>/dev/null; then
  echo "Attention : usesCleartextTraffic absent du manifeste des plugins ; le WebView refusera http." >&2
fi

# 4. L'APK.
APK="android/app/build/outputs/apk/debug/app-debug.apk"
if [ "$BUILD" = 1 ] || [ ! -f "$APK" ]; then
  echo "gradle assembleDebug (journal : $WORK/gradle.log)…"
  if ! (cd android && ./gradlew assembleDebug --console=plain -q --max-workers="$JOBS") >"$WORK/gradle.log" 2>&1; then
    tail -40 "$WORK/gradle.log" >&2
    exit 1
  fi
fi

# 5. Installer et lancer. L'émulateur peut porter l'application signée avec
#    la clé de publication (l'APK du site) : l'APK de débogage a une autre
#    signature et l'installation échoue (INSTALL_FAILED_UPDATE_INCOMPATIBLE).
#    On désinstalle alors l'ancienne (ses données locales partent avec elle)
#    et on recommence.
if ! adb install -r "$APK" >"$WORK/adb-install.log" 2>&1; then
  if grep -q "INSTALL_FAILED_UPDATE_INCOMPATIBLE" "$WORK/adb-install.log"; then
    echo "signature différente : désinstallation de $APP_ID puis réinstallation"
    adb uninstall "$APP_ID" >/dev/null 2>&1 || true
    adb install -r "$APK" >>"$WORK/adb-install.log" 2>&1
  else
    cat "$WORK/adb-install.log" >&2
    exit 1
  fi
fi
adb shell am force-stop "$APP_ID" >/dev/null 2>&1 || true
adb shell am start -n "$APP_ID/.MainActivity" >/dev/null
echo "lancée : $URL"

# 6. Regarder.
sleep "$WAIT"
if [ -n "$SHOT" ]; then
  mkdir -p "$(dirname "$SHOT")"
  adb exec-out screencap -p > "$SHOT"
  echo "capture : $SHOT"
fi
if [ -n "$RECORD" ]; then
  mkdir -p "$(dirname "$RECORD")"
  adb shell screenrecord --time-limit "$RECORD_SECONDS" /sdcard/jotna-boucle.mp4
  adb pull /sdcard/jotna-boucle.mp4 "$RECORD" >/dev/null
  adb shell rm /sdcard/jotna-boucle.mp4
  echo "film : $RECORD"
fi
if [ "$STOP" = 1 ]; then
  adb emu kill >/dev/null 2>&1 || true
  echo "émulateur éteint"
fi

DIRTY="$(git status --porcelain -- capacitor.config.ts ios android | wc -l | tr -d ' ')"
echo "git : $DIRTY fichier(s) modifié(s) sous capacitor.config.ts, ios/, android/ (attendu : 0)"
