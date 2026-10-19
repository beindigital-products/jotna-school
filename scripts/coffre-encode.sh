#!/usr/bin/env bash
# Détoure le clip d'ouverture du coffre au trésor et l'encode avec canal alpha.
#
# Usage : scripts/coffre-encode.sh <clip.mp4> [début_s [fin_s [accéléré]]]
#
# Le clip source est un rendu carré (960 × 960) du coffre FERMÉ posé sur un fond
# bleu pur (#0000FF), généré en image-vers-vidéo avec le studio (Kling v3.0, 5 s,
# caméra fixe) : le couvercle se lève, le trésor apparaît. Ce script :
#   1. coupe le clip (par défaut de 0,95 s à 3,85 s : un instant de coffre fermé,
#      l'ouverture, un instant de coffre ouvert ; les 1,15 s d'attente du début et
#      la fin immobile ne servent à rien) et l'accélère de 20 % (par défaut) : le
#      couvercle monte en deux secondes, pas en trois ;
#   2. recadre sur le coffre (760 × 740, la caisse centrée : le couvercle ouvert
#      déborde à droite et vers le haut) et rend le bleu transparent, avec le
#      même réglage que `scripts/pio-encode.sh` (colorkey puis despill) ;
#   3. ramène le cadre à 608 × 592 et écrit :
#        public/videos/coffre/ouverture.webm  VP9 + alpha   (Android, Chrome, Firefox)
#        public/videos/coffre/ouverture.mov   HEVC + alpha  (iOS, Safari ; VideoToolbox, macOS)
#        public/images/coffre/ferme.webp      la première image : le coffre fermé
#        public/images/coffre/ouvert.webp     la dernière image : le coffre ouvert
#
# LES DEUX IMAGES FIXES SONT LES BORNES DU CLIP, au pixel près (même coupe, même
# détourage, même cadre) : passer du clip à l'image, ou l'inverse, ne se voit pas.
# `components/student/game-kit/coffre.tsx` compte sur la géométrie ci-dessous
# (constante `CADRE`) : ne pas retoucher l'une sans l'autre.
#
# Faire un autre coffre : voir docs/pio-animations.md, section « Le coffre au
# trésor ». La planche (le coffre fermé, centré, sur du bleu pur) se prépare avec
# `generate_image` du studio ; la géométrie mesurée du clip est dans le document.
set -euo pipefail

input=${1:?clip mp4}
start=${2:-0.95}
end=${3:-3.85}
speed=${4:-1.2}

root="$(cd "$(dirname "$0")/.." && pwd)"
videos="$root/public/videos/coffre"
images="$root/public/images/coffre"
mkdir -p "$videos" "$images"
tmp=$(mktemp -d)
trap 'rm -rf "$tmp"' EXIT

duration=$(awk -v s="$start" -v e="$end" 'BEGIN { printf "%.3f", e - s }')

# Même détourage que Pio : `green=0:blue=-1`, sans eux `despill` retire le reflet
# bleu au canal VERT (réglages par défaut pour un fond vert) et ternit le bois.
key="format=rgba,colorkey=0x000FFC:0.28:0.12,despill=type=blue:mix=0.7:expand=0.4:green=0:blue=-1"
frame="crop=760:740:100:150,${key},scale=608:592:flags=lanczos"
clip="${frame},setpts=PTS/${speed}"

ffmpeg -v error -y -ss "$start" -t "$duration" -i "$input" -vf "${clip},format=yuva420p" \
  -c:v libvpx-vp9 -pix_fmt yuva420p -b:v 0 -crf 32 -row-mt 1 -deadline good -cpu-used 2 -auto-alt-ref 0 \
  -r 24 -an "$videos/ouverture.webm"

# WebKit compose l'HEVC alpha en alpha PRÉMULTIPLIÉ : sans cette étape, le bleu
# des zones transparentes s'ajoute au fond (voir `scripts/pio-encode.sh`).
ffmpeg -v error -y -ss "$start" -t "$duration" -i "$input" -vf "${clip},premultiply=inplace=1,format=bgra" \
  -c:v hevc_videotoolbox -pix_fmt bgra -alpha_quality 0.75 -q:v 58 -tag:v hvc1 \
  -r 24 -an "$videos/ouverture.mov"

# Les bornes du clip, en PNG avec alpha, puis en WebP. La dernière image : un
# vingt-quatrième de seconde avant la fin de la coupe (`-ss` exactement sur la fin
# ne rendrait rien).
last=$(awk -v e="$end" 'BEGIN { printf "%.3f", e - 0.042 }')
ffmpeg -v error -y -ss "$start" -i "$input" -frames:v 1 -vf "$frame" "$tmp/ferme.png"
ffmpeg -v error -y -ss "$last" -i "$input" -frames:v 1 -vf "$frame" "$tmp/ouvert.png"
node "$root/scripts/coffre-stills.mjs" "$tmp" "$images"

ls -la "$videos/ouverture.webm" "$videos/ouverture.mov" "$images/ferme.webp" "$images/ouvert.webp"
