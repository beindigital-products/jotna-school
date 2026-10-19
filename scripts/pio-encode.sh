#!/usr/bin/env bash
# Détoure un clip de Pio généré sur OpenArt et l'encode avec canal alpha.
#
# Usage : scripts/pio-encode.sh <pose> <clip-openart.mp4> [tenue]
#
# Sans tenue, les clips vont dans public/videos/pio/ (Pio de tous les jours) ;
# avec une tenue (`boubou`...), dans public/videos/pio/<tenue>/.
#
# Le clip source est un rendu 720 × 1280 de la pose posée sur un fond bleu pur
# (#0000FF), généré en image-vers-vidéo avec la pose PNG en première ET en
# dernière image pour que la boucle soit invisible. Ce script :
#   1. rend le bleu transparent (colorkey) et retire son reflet sur les bords
#      (despill) ;
#   2. ramène le cadre à 576 × 1024 : Pio debout y mesure 800 pixels, les
#      pattes à 96 pixels du bas. `components/student/pio.tsx` compte dessus ;
#   3. écrit deux fichiers dans public/videos/pio/ :
#        <pose>.webm  VP9 + alpha   (Android, Chrome, Firefox)
#        <pose>.mov   HEVC + alpha  (iOS, Safari ; encodeur VideoToolbox, macOS)
#
# Préparer la planche source : voir docs/pio-animations.md.
set -euo pipefail

pose=${1:?pose}
input=${2:?clip mp4}
outfit=${3:-}
out="$(cd "$(dirname "$0")/.." && pwd)/public/videos/pio${outfit:+/$outfit}"
mkdir -p "$out"

# `green=0:blue=-1` : sans eux, `despill` retire le reflet bleu au canal VERT
# (ses réglages par défaut visent un fond vert) et assombrit le boubou émeraude.
key="format=rgba,colorkey=0x000FFC:0.28:0.12,despill=type=blue:mix=0.7:expand=0.4:green=0:blue=-1,scale=576:1024:flags=lanczos"

ffmpeg -v error -y -i "$input" -vf "$key,format=yuva420p" \
  -c:v libvpx-vp9 -pix_fmt yuva420p -b:v 0 -crf 34 -row-mt 1 -deadline good -cpu-used 2 -auto-alt-ref 0 \
  -an "$out/$pose.webm"

# WebKit compose l'HEVC alpha en alpha PRÉMULTIPLIÉ : sans cette étape, le bleu
# des zones transparentes s'ajoute au fond et Pio flotte dans un halo violet.
ffmpeg -v error -y -i "$input" -vf "$key,premultiply=inplace=1,format=bgra" \
  -c:v hevc_videotoolbox -pix_fmt bgra -alpha_quality 0.75 -q:v 58 -tag:v hvc1 \
  -an "$out/$pose.mov"

ls -la "$out/$pose.webm" "$out/$pose.mov"
