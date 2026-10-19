import React from "react";
import { Img, Loop, OffthreadVideo, staticFile } from "remotion";

export type ClassicPose = "amazed" | "cheer" | "encourage" | "hello" | "idle" | "sad" | "sleep" | "think" | "walk";
export type BoubouPose = "bravo" | "encourage" | "idle" | "listen" | "recite" | "salam" | "walkAway" | "walkToward";

type Props = {
  pose: ClassicPose | BoubouPose;
  outfit?: "classic" | "boubou";
  /** Hauteur affichée ; les clips font 576 × 1024 (9:16). */
  height: number;
  /** Image fixe (comme sur le web) au lieu du clip animé (comme dans l'application). */
  still?: boolean;
  style?: React.CSSProperties;
};

// Les clips OpenArt de l'application (public/videos/pio) : 24 images/s,
// 121 images (5 s) ; les marches en boubou font 73 images (3 s). La première
// et la dernière image sont identiques, d'où une boucle sans à-coup.
const loopFrames = (pose: Props["pose"], outfit: Props["outfit"]) =>
  outfit === "boubou" && (pose === "walkAway" || pose === "walkToward") ? 91 : 151;

/**
 * Pio tel que l'application l'anime : la vidéo à canal alpha, jouée en boucle.
 * Aucun mouvement codé en plus (règle du projet : un nouveau geste = un nouveau clip).
 */
export const Pio: React.FC<Props> = ({ pose, outfit = "classic", height, still = false, style }) => {
  const dir = outfit === "boubou" ? "boubou/" : "";
  const width = (height * 576) / 1024;
  if (still) {
    // Les images fixes sont détourées serrées : on les cale en bas d'une boîte 9:16.
    return (
      <div style={{ width, height, position: "relative", ...style }}>
        <Img
          src={staticFile(`app/images/pio/${dir}${pose}.png`)}
          style={{ position: "absolute", bottom: 0, left: 0, width: "100%", height: "100%", objectFit: "contain", objectPosition: "bottom" }}
        />
      </div>
    );
  }
  return (
    <div style={{ width, height, position: "relative", ...style }}>
      <Loop durationInFrames={loopFrames(pose, outfit)} layout="none">
        <OffthreadVideo
          src={staticFile(`app/videos/pio/${dir}${pose}.webm`)}
          transparent
          muted
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
        />
      </Loop>
    </div>
  );
};
