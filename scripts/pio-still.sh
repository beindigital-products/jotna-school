#!/usr/bin/env bash
# Détoure une pose de Pio générée sur fond bleu pur et la met au cadrage officiel.
#
# Usage : scripts/pio-still.sh <tenue> <pose> <image-generee.png> [dossier-planches]
#
# L'image source vient d'OpenArt (image vers image, fond #0000FF uni, Pio en
# pied). Le script :
#   1. rend le bleu transparent et retire son reflet sur les bords — mêmes
#      réglages que `scripts/pio-encode.sh` ;
#   2. recadre sur Pio et le pose dans un cadre 572 × 800 : 750 pixels de haut
#      au plus, pattes à 20 pixels du bas, centré — le cadrage des poses
#      d'origine, que `components/student/pio.tsx` suppose ;
#   3. écrit :
#        public/images/pio/<tenue>/<pose>.png     l'affiche, fond transparent
#        <dossier-planches>/<pose>-plate.png      720 × 1280 sur bleu pur,
#          Pio à 1000 pixels de haut et les pattes à 120 pixels du bas : la
#          planche à donner à Kling en première ET en dernière image.
#
# Tout passe par un cadre intermédiaire au double de la taille finale : la
# planche garde ainsi la netteté de l'image générée au lieu d'agrandir le PNG.
set -euo pipefail

outfit=${1:?tenue}
pose=${2:?pose}
input=${3:?image générée}
plates=${4:-.}

root="$(cd "$(dirname "$0")/.." && pwd)"
out="$root/public/images/pio/$outfit"
mkdir -p "$out" "$plates"
tmp=$(mktemp -d)
trap 'rm -rf "$tmp"' EXIT

# `green=0:blue=-1` : sans eux, `despill` retire le reflet bleu au canal VERT
# (ses réglages par défaut visent un fond vert) et assombrit le boubou émeraude.
key="format=rgba,colorkey=0x000FFC:0.28:0.12,despill=type=blue:mix=0.7:expand=0.4:green=0:blue=-1"
ffmpeg -v error -y -i "$input" -vf "$key" "$tmp/keyed.png"

# La boîte de Pio : cropdetect sur la couche alpha (noir = transparent).
crop=$(ffmpeg -v info -i "$tmp/keyed.png" \
  -vf "alphaextract,cropdetect=limit=24:round=2:reset=0:skip=0" -f null - 2>&1 \
  | grep -o 'crop=[0-9:]*' | tail -1)
[ -n "$crop" ] || { echo "Pio introuvable dans $input" >&2; exit 1; }
IFS=: read -r cw ch _ _ <<<"${crop#crop=}"

# Cadre ×2 : 1144 × 1600, Pio à 1500 px de haut au plus et 1120 px de large
# au plus, pattes à 40 px du bas.
if (( cw * 1500 > ch * 1120 )); then fit="scale=1120:-2"; else fit="scale=-2:1500"; fi
ffmpeg -v error -y -i "$tmp/keyed.png" \
  -vf "$crop,$fit:flags=lanczos,pad=1144:1600:(ow-iw)/2:1600-40-ih:color=0x00000000,format=rgba" \
  "$tmp/canvas2x.png"

ffmpeg -v error -y -i "$tmp/canvas2x.png" -vf "scale=572:800:flags=lanczos,format=rgba" "$out/$pose.png"

ffmpeg -v error -y -f lavfi -i "color=c=0x0000FF:s=720x1280" -i "$tmp/canvas2x.png" \
  -filter_complex "[1:v]scale=-1:1000:flags=lanczos[pio];[0:v][pio]overlay=(W-w)/2:H-h-120,format=rgb24" \
  -frames:v 1 "$plates/$pose-plate.png"

ls -la "$out/$pose.png" "$plates/$pose-plate.png"
