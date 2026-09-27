#!/usr/bin/env bash
# Régénère l'icône iOS et l'écran de lancement depuis le logo et Pio.
# Aucune dépendance hors Xcode : le dessin est en Core Graphics, compilé à la
# volée. À relancer quand le logo ou la pose de Pio change.
set -euo pipefail
cd "$(dirname "$0")/.."
mkdir -p .ci-local
swiftc -O scripts/ios-brand-assets.swift -o .ci-local/ios-brand-assets
A=ios/App/App/Assets.xcassets
.ci-local/ios-brand-assets \
  "$PWD/public/jotna-logo.png" "$PWD/public/images/pio/hello.png" \
  "$PWD/$A/AppIcon.appiconset/AppIcon-512@2x.png" \
  "$PWD/$A/Splash.imageset/splash-2732x2732.png" \
  "$PWD/$A/Splash.imageset/splash-2732x2732-1.png" \
  "$PWD/$A/Splash.imageset/splash-2732x2732-2.png"
