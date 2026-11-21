import React from "react";
import { Composition, Folder } from "remotion";
import { FPS, HEIGHT, WIDTH } from "./theme";
import { Presentation, SCENES, TOTAL_FRAMES } from "./Presentation";
import { Ad, AD_TOTAL_FRAMES } from "./ad/Ad";
import { POSTS, SOCIAL_H, SOCIAL_W, Social, postFrames } from "./social/Social";
import { SLIDE_H, SLIDE_W, SocialSlide } from "./social/Slides";

export const RemotionRoot: React.FC = () => (
  <>
    <Composition id="JotnaPresentation" component={Presentation} durationInFrames={TOTAL_FRAMES} fps={FPS} width={WIDTH} height={HEIGHT} />
    <Composition id="JotnaAd" component={Ad} durationInFrames={AD_TOTAL_FRAMES} fps={FPS} width={WIDTH} height={HEIGHT} />
    <Folder name="Social">
      {POSTS.filter((p) => p.format === "video").map((p) => (
        <Composition key={p.id} id={`social-${p.id}`} component={Social} defaultProps={{ id: p.id }} durationInFrames={postFrames(p)} fps={FPS} width={SOCIAL_W} height={SOCIAL_H} />
      ))}
      {POSTS.filter((p) => p.format === "carousel").map((p) => (
        <Composition key={p.id} id={`slides-${p.id}`} component={SocialSlide} defaultProps={{ id: p.id, index: 0 }} durationInFrames={1} fps={FPS} width={SLIDE_W} height={SLIDE_H} />
      ))}
    </Folder>
    <Folder name="Scenes">
      {SCENES.map((s) => (
        <Composition key={s.id} id={`scene-${s.id}`} component={s.component} durationInFrames={s.frames} fps={FPS} width={WIDTH} height={HEIGHT} />
      ))}
    </Folder>
  </>
);
