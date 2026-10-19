#!/usr/bin/env bash
# Normalise les pistes audio de la vidéo (audio-src/) vers public/audio/.
#   voix off (ElevenLabs, voix « Rachel »)       -> -16 LUFS
#   voix de l'application (ElevenLabs, Steve)    -> -17 LUFS
#   musique (Mixkit, « Let's Play Africa »)      -> -16 LUFS, ralentie pour durer
#                                                   exactement la vidéo, fondu au début et à la fin
# Usage : bash scripts/prepare-audio.sh <durée de la vidéo en secondes>
set -euo pipefail
cd "$(dirname "$0")/.."
VIDEO_SECONDS="${1:?durée de la vidéo en secondes}"
OUT=public/audio
mkdir -p "$OUT/voice-off" "$OUT/voice-app" "$OUT/music"

# Gain fixe qui amène la piste à la cible (mesure EBU R128), avec un limiteur à -1,5 dBTP.
normalize() {
  local src="$1" dst="$2" target="$3" extra="${4:-}"
  local measured
  measured=$(ffmpeg -hide_banner -nostats -i "$src" -af "${extra:+$extra,}ebur128=framelog=quiet" -f null - 2>&1 | awk '/I:/{v=$2} END{print v}')
  local gain
  gain=$(python3 -c "print(round(${target} - (${measured}), 2))")
  ffmpeg -hide_banner -loglevel error -y -i "$src" -af "${extra:+$extra,}volume=${gain}dB,alimiter=limit=0.84:level=false" -ar 44100 -ac 2 -b:a 192k "$dst"
  echo "$(basename "$dst"): ${measured} LUFS -> ${target} (gain ${gain} dB)"
}

for f in audio-src/voice-off/*.mp3; do normalize "$f" "$OUT/voice-off/$(basename "$f")" -16; done
for f in audio-src/voice-app/*.mp3; do normalize "$f" "$OUT/voice-app/$(basename "$f")" -17; done

SRC=audio-src/music/lets-play-africa.mp3
# La licence Mixkit interdit de redistribuer le morceau seul : il n'est pas dans
# le dépôt (public), on le télécharge depuis Mixkit au premier lancement.
if [ ! -s "$SRC" ]; then
  mkdir -p "$(dirname "$SRC")"
  curl -fsSL -o "$SRC" https://assets.mixkit.co/music/1084/1084.mp3
fi
SRC_SECONDS=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$SRC")
TEMPO=$(python3 -c "print(round(${SRC_SECONDS} / ${VIDEO_SECONDS}, 5))")
FADE_OUT_START=$(python3 -c "print(round(${VIDEO_SECONDS} - 3.5, 3))")
normalize "$SRC" "$OUT/music/lets-play-africa.mp3" -16 "atempo=${TEMPO},afade=t=in:d=1.5,afade=t=out:st=${FADE_OUT_START}:d=3.5"
echo "musique : tempo ${TEMPO}, $(ffprobe -v error -show_entries format=duration -of csv=p=0 "$OUT/music/lets-play-africa.mp3") s"
