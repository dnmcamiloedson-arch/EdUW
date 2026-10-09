import React from "react";
import { Composition, continueRender, delayRender, staticFile } from "remotion";
import { Grounding, GroundingProps } from "./Grounding";
import { config, getTimeline } from "./lib";

// Fuentes locales (assets/fonts): sin red, render determinista
const fontHandle = delayRender("Cargando Nunito");
Promise.all(
  Object.entries(config.fonts.files).map(([weight, file]) => {
    const face = new FontFace(config.fonts.family, `url(${staticFile(file)}) format("woff2")`, { weight });
    document.fonts.add(face);
    return face.load();
  }),
)
  .then(() => continueRender(fontHandle))
  .catch((e) => {
    throw e;
  });

const defaults: GroundingProps = { variant: config.activeVariant, layout: "9x16", captions: true };

export const Root: React.FC = () => (
  <Composition
    id="Grounding"
    component={Grounding}
    defaultProps={defaults}
    fps={config.format.fps}
    width={config.format.width}
    height={config.format.height}
    durationInFrames={getTimeline(defaults.variant).durationInFrames}
    calculateMetadata={({ props }) => {
      const L = config.layouts[props.layout];
      return { durationInFrames: getTimeline(props.variant).durationInFrames, width: L.width, height: L.height };
    }}
  />
);
