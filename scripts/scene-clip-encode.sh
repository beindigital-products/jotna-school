#!/usr/bin/env bash
# Encode le clip d'une scène de l'instruction civique pour l'écran de l'enfant.
#
# Usage : scripts/scene-clip-encode.sh <id> <clip.mp4>
#         scripts/scene-clip-encode.sh po1 ~/studio/po1.mp4
#
# <id> est l'identifiant de la scène dans `convex/paliers/games/civique.ts`
# (po1 à po11, ec1 à ec10, en1 à en10, ro1 à ro10). Le clip source est celui du
# studio (MiniMax H3, image vers vidéo, 5 s, `resolution: "768p"`, 1152 × 768,
# avec une piste son que personne n'a gardée). Ce script :
#   1. recadre au centre en 3:2 (un clip en 2K fait 2176 × 1440 : huit pixels de
#      chaque côté), ramène le cadre à 768 × 512 et encode en H.264 (profil
#      main, CRF 28, `-tune animation`), SANS piste son : la voix de Pio lit
#      l'énoncé, et sur iOS un son qui part pendant un clip muet le coupe ;
#   2. écrit l'affiche : la PREMIÈRE IMAGE DU CLIP ENCODÉ, en WebP. Prise sur le
#      clip encodé et non sur la source, elle est identique au pixel près : passer
#      de l'affiche au clip, ou l'inverse, ne se voit pas.
#
#        public/videos/scenes/<id>.mp4   H.264, 768 × 512, environ 110 à 250 Ko
#        public/images/scenes/<id>.webp  l'affiche, environ 30 à 50 Ko
#
# Un seul MP4 sert tous les appareils (WKWebView de l'app iOS, Chromium de l'app
# Android, Safari, Chrome, Firefox) : pas de canal alpha ici, donc pas de VP9 ni
# de HEVC. Faire ou refaire une scène : docs/scenes-civiques-clips.md.
set -euo pipefail

id=${1:?identifiant de la scène (po1, ec3, ro9...)}
input=${2:?clip mp4}

if ! [[ "$id" =~ ^(po|ec|en|ro)[1-9][0-9]?$ ]]; then
  echo "identifiant de scène inconnu : $id (attendu : po1, ec3, en10, ro9...)" >&2
  exit 1
fi
command -v cwebp >/dev/null || { echo "cwebp est requis pour l'affiche (brew install webp)" >&2; exit 1; }

root="$(cd "$(dirname "$0")/.." && pwd)"
videos="$root/public/videos/scenes"
images="$root/public/images/scenes"
mkdir -p "$videos" "$images"
tmp=$(mktemp -d)
trap 'rm -rf "$tmp"' EXIT

# Le recadrage 3:2 ne touche pas un clip déjà en 3:2 (1152 × 768).
frame="crop='min(iw,ih*3/2)':'min(ih,iw*2/3)',scale=768:512:flags=lanczos,setsar=1"

ffmpeg -v error -y -i "$input" -an -vf "$frame" \
  -c:v libx264 -preset slow -crf 28 -tune animation -profile:v main -pix_fmt yuv420p \
  -r 24 -movflags +faststart "$videos/$id.mp4"

ffmpeg -v error -y -i "$videos/$id.mp4" -frames:v 1 "$tmp/affiche.png"
cwebp -quiet -q 80 -m 6 "$tmp/affiche.png" -o "$images/$id.webp"

# Aucune piste son ne doit rester dans le fichier.
if [ -n "$(ffprobe -v error -select_streams a -show_entries stream=codec_type -of csv=p=0 "$videos/$id.mp4")" ]; then
  echo "le clip $id a gardé une piste son" >&2
  exit 1
fi

ls -la "$videos/$id.mp4" "$images/$id.webp"
