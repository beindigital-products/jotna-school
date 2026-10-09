import React from "react";
import { Composition, Folder } from "remotion";
import { FPS, HEIGHT, WIDTH } from "./theme";
import { Presentation, SCENES, TOTAL_FRAMES } from "./Presentation";

export const RemotionRoot: React.FC = () => (
  <>
    <Composition id="JotnaPresentation" component={Presentation} durationInFrames={TOTAL_FRAMES} fps={FPS} width={WIDTH} height={HEIGHT} />
    <Folder name="Scenes">
      {SCENES.map((s) => (
        <Composition key={s.id} id={`scene-${s.id}`} component={s.component} durationInFrames={s.frames} fps={FPS} width={WIDTH} height={HEIGHT} />
      ))}
    </Folder>
  </>
);
