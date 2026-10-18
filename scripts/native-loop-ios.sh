#!/usr/bin/env bash
# LA BOUCLE NATIVE iOS — la galerie des exercices (ou toute page du serveur de
# développement) dans le VRAI WKWebView de l'application, sur le simulateur,
# rechargée à chaud par `pnpm dev`. Mode d'emploi et pièges :
# docs/boucle-native-jeu.md.
#
# Usage :
#   scripts/native-loop-ios.sh [--build] [--url URL] [--shot fichier.png]
#       [--record fichier.mov SECONDES] [--work DOSSIER] [--udid UDID]
#       [--wait SECONDES] [--shutdown]
#
#   --build     recompile l'application (xcodebuild, sans signature). Sans lui,
#               l'application déjà construite dans --work est réinstallée ; la
#               configuration Capacitor (l'URL) est recopiée DANS l'application
#               installée : changer d'URL ne demande pas de recompiler.
#   --url       la page à ouvrir ; défaut http://localhost:3000/dev/exercices/?barre=0
#               (depuis le simulateur, localhost est le Mac)
#   --shot      capture d'écran après le lancement (xcrun simctl io screenshot)
#   --record    film de N secondes (xcrun simctl io recordVideo)
#   --work      dossier de travail (DerivedData, journaux) ;
#               défaut ${TMPDIR:-/tmp}/jotna-native-loop/ios
#   --udid      défaut 3ABDFD18-0CC8-4648-BAF7-F8C5E16DAD8F (iPhone 17) ; jamais
#               un second simulateur allumé à côté
#   --wait      secondes entre le lancement et la capture (défaut 6)
#   --jobs      tâches parallèles de xcodebuild (défaut 4 : la machine fait
#               tourner d'autres travaux ; sans borne, la charge dépasse 100)
#   --shutdown  éteint le simulateur à la fin
#
# Ce que le script touche dans le dépôt, et remet en place quoi qu'il arrive
# (trap) : capacitor.config.ts, remplacé le temps de `cap sync`, et
# Package.resolved si xcodebuild l'a réécrit. Ce qu'il génère est ignoré par
# git : ios/App/App/public, ios/App/App/capacitor.config.json, .ci-local/.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
export PATH="$HOME/.local/share/fnm/aliases/default/bin:$PATH"

UDID="3ABDFD18-0CC8-4648-BAF7-F8C5E16DAD8F"
URL="http://localhost:3000/dev/exercices/?barre=0"
WORK="${TMPDIR:-/tmp}/jotna-native-loop/ios"
BUNDLE_ID="com.jotna.school"
BUILD=0
SHOT=""
RECORD=""
RECORD_SECONDS=8
WAIT=6
JOBS=4
SHUTDOWN=0

while [ $# -gt 0 ]; do
  case "$1" in
    --build) BUILD=1 ;;
    --url) URL="$2"; shift ;;
    --shot) SHOT="$2"; shift ;;
    --record) RECORD="$2"; RECORD_SECONDS="$3"; shift 2 ;;
    --work) WORK="$2"; shift ;;
    --udid) UDID="$2"; shift ;;
    --wait) WAIT="$2"; shift ;;
    --jobs) JOBS="$2"; shift ;;
    --shutdown) SHUTDOWN=1 ;;
    -h|--help) sed -n '2,30p' "$0"; exit 0 ;;
    *) echo "option inconnue : $1" >&2; exit 2 ;;
  esac
  shift
done
mkdir -p "$WORK"

# 1. Le serveur de développement répond.
if ! curl -sf -o /dev/null --max-time 20 "$URL"; then
  echo "Le serveur ne répond pas sur $URL : lancez d'abord pnpm dev." >&2
  exit 1
fi

# 2. La configuration Capacitor temporaire, le temps de `cap sync`.
CONFIG="capacitor.config.ts"
BACKUP="$WORK/capacitor.config.ts.bak"
RESOLVED="ios/App/App.xcodeproj/project.xcworkspace/xcshareddata/swiftpm/Package.resolved"
/bin/cp -f "$CONFIG" "$BACKUP"
if [ -z "$(git status --porcelain -- "$RESOLVED")" ]; then RESOLVED_WAS_CLEAN=1; else RESOLVED_WAS_CLEAN=0; fi
restore() {
  /bin/cp -f "$BACKUP" "$CONFIG"
  if [ "$RESOLVED_WAS_CLEAN" = 1 ] && [ -n "$(git status --porcelain -- "$RESOLVED")" ]; then
    git checkout -- "$RESOLVED"
  fi
}
trap restore EXIT

# Une coquille minimale : `cap sync` exige un webDir avec un index.html, mais
# tout vient du serveur de développement. Dans .ci-local/, ignoré par git.
SHELL_DIR=".ci-local/dev-shell"
mkdir -p "$SHELL_DIR"
printf '<!doctype html><meta charset="utf-8"><title>Jotna dev</title><p>Coquille : la page vient du serveur de d\xc3\xa9veloppement.</p>\n' > "$SHELL_DIR/index.html"
cat > "$CONFIG" <<EOF
import type { CapacitorConfig } from "@capacitor/cli";

// CONFIGURATION TEMPORAIRE écrite par scripts/native-loop-ios.sh. Ne pas commiter :
// le script remet l'original en place à la fin.
const config: CapacitorConfig = {
  appId: "$BUNDLE_ID",
  appName: "Jotna School",
  webDir: "$SHELL_DIR",
  server: { url: "$URL", cleartext: true },
};

export default config;
EOF
#    `sync`, pas seulement `copy` : `update` écrit `packageClassList` dans
#    capacitor.config.json ; sans lui, le pont natif ne charge AUCUN plugin
#    (« Error registering plugins: … packageClassList ») et l'application
#    perd le système de fichiers du hors-ligne. Vérifié : `update ios`
#    réécrit CapApp-SPM/Package.swift à l'identique, git reste propre.
if ! npx cap sync ios >"$WORK/cap-sync.log" 2>&1; then
  cat "$WORK/cap-sync.log" >&2
  exit 1
fi
/bin/cp -f "$BACKUP" "$CONFIG"

# 3. Le simulateur, allumé et prêt.
xcrun simctl boot "$UDID" 2>/dev/null || true
xcrun simctl bootstatus "$UDID" -b >/dev/null
open -a Simulator --args -CurrentDeviceUDID "$UDID" >/dev/null 2>&1 || true

# 4. Compiler, ou réutiliser l'application déjà construite.
APP="$WORK/DerivedData/Build/Products/Debug-iphonesimulator/App.app"
if [ "$BUILD" = 1 ] || [ ! -d "$APP" ]; then
  echo "xcodebuild (journal : $WORK/xcodebuild.log)…"
  if ! xcodebuild -project ios/App/App.xcodeproj -scheme App -configuration Debug -sdk iphonesimulator \
      -destination "id=$UDID" -derivedDataPath "$WORK/DerivedData" -jobs "$JOBS" \
      CODE_SIGNING_ALLOWED=NO CODE_SIGNING_REQUIRED=NO CODE_SIGN_IDENTITY="" \
      build >"$WORK/xcodebuild.log" 2>&1; then
    tail -40 "$WORK/xcodebuild.log" >&2
    exit 1
  fi
fi

# 5. Installer, pousser la configuration dans l'application installée, lancer.
#    Le bundle garde le capacitor.config.json de sa compilation ; on le remplace
#    sur place, comme docs/capacitor-ios.md le fait pour `public/`.
xcrun simctl terminate "$UDID" "$BUNDLE_ID" 2>/dev/null || true
xcrun simctl install "$UDID" "$APP"
CONTAINER="$(xcrun simctl get_app_container "$UDID" "$BUNDLE_ID" app)"
/bin/cp -f ios/App/App/capacitor.config.json "$CONTAINER/capacitor.config.json"
rsync -a ios/App/App/public/ "$CONTAINER/public/"
xcrun simctl launch "$UDID" "$BUNDLE_ID" >/dev/null
echo "lancée : $URL"

# 6. Regarder.
sleep "$WAIT"
if [ -n "$SHOT" ]; then
  mkdir -p "$(dirname "$SHOT")"
  xcrun simctl io "$UDID" screenshot --type=png "$SHOT" >/dev/null
  echo "capture : $SHOT"
fi
if [ -n "$RECORD" ]; then
  mkdir -p "$(dirname "$RECORD")"
  xcrun simctl io "$UDID" recordVideo --codec h264 --force "$RECORD" >/dev/null 2>&1 &
  REC_PID=$!
  sleep "$RECORD_SECONDS"
  kill -INT "$REC_PID" 2>/dev/null || true
  wait "$REC_PID" 2>/dev/null || true
  echo "film : $RECORD"
fi
if [ "$SHUTDOWN" = 1 ]; then
  xcrun simctl shutdown "$UDID"
  echo "simulateur éteint"
fi

DIRTY="$(git status --porcelain -- capacitor.config.ts ios android | wc -l | tr -d ' ')"
echo "git : $DIRTY fichier(s) modifié(s) sous capacitor.config.ts, ios/, android/ (attendu : 0)"
