#!/usr/bin/env bash
# Normalise les pistes audio de la publicité (audio-src/) vers public/audio/.
#   voix off de la pub (ElevenLabs, « Rachel »)  -> -16 LUFS
#   voix de l'application (réplique « Salam »)   -> -17 LUFS
#   musique (Mixkit, « Let's Play Africa »)      -> -16 LUFS, début du morceau coupé à la
#                                                   durée de la pub (pas de changement de tempo)
# Usage : bash scripts/prepare-audio-ad.sh <durée de la pub en secondes>   (1540 images = 51.34 s)
set -euo pipefail
cd "$(dirname "$0")/.."
VIDEO_SECONDS="${1:?durée de la pub en secondes}"
OUT=public/audio
mkdir -p "$OUT/voice-ad" "$OUT/voice-app" "$OUT/music"

normalize() {
  local src="$1" dst="$2" target="$3" extra="${4:-}"
  local measured
  measured=$(ffmpeg -hide_banner -nostats -i "$src" -af "${extra:+$extra,}ebur128=framelog=quiet" -f null - 2>&1 | awk '/I:/{v=$2} END{print v}')
  local gain
  gain=$(python3 -c "print(round(${target} - (${measured}), 2))")
  ffmpeg -hide_banner -loglevel error -y -i "$src" -af "${extra:+$extra,}volume=${gain}dB,alimiter=limit=0.84:level=false" -ar 44100 -ac 2 -b:a 192k "$dst"
  echo "$(basename "$dst"): ${measured} LUFS -> ${target} (gain ${gain} dB)"
}

for f in audio-src/voice-ad/*.mp3; do normalize "$f" "$OUT/voice-ad/$(basename "$f")" -16; done
normalize audio-src/voice-app/map_welcome.mp3 "$OUT/voice-app/map_welcome.mp3" -17

SRC=audio-src/music/lets-play-africa.mp3
if [ ! -s "$SRC" ]; then
  mkdir -p "$(dirname "$SRC")"
  curl -fsSL -o "$SRC" https://assets.mixkit.co/music/1084/1084.mp3
fi
FADE_OUT_START=$(python3 -c "print(round(${VIDEO_SECONDS} - 3.5, 3))")
normalize "$SRC" "$OUT/music/lets-play-africa-ad.mp3" -16 "atrim=0:${VIDEO_SECONDS},asetpts=PTS-STARTPTS,afade=t=in:d=1.5,afade=t=out:st=${FADE_OUT_START}:d=3.5"
echo "musique : $(ffprobe -v error -show_entries format=duration -of csv=p=0 "$OUT/music/lets-play-africa-ad.mp3") s"
