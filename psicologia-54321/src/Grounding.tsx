import React from "react";
import { AbsoluteFill, Img, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import {
  DESIGN_R,
  Layout,
  LayoutId,
  Palette,
  Section,
  Timeline,
  accentOf,
  breath01,
  config,
  easeInOut,
  easeOut,
  getTimeline,
  lerp,
  mix,
  prog,
  ramp,
  rgba,
  sectionPresence,
  springAt,
} from "./lib";
import { SeeWorld } from "./worlds/See";
import { TouchWorld } from "./worlds/Touch";
import { HearWorld } from "./worlds/Hear";
import { SmellWorld } from "./worlds/Smell";

export type GroundingProps = { variant: string; layout: LayoutId; captions: boolean };

const FONT = `${config.fonts.family}, "Quicksand", system-ui, sans-serif`;
const TRANS = config.motion.transitionFrames / config.format.fps;

/* ---------- utilidades de escena ---------- */

/** Color de acento continuo: cruza al de la nueva sección durante la transición. */
const accentAt = (tl: Timeline, P: Palette, t: number) => {
  let c = accentOf(P, tl.sections[0].accent);
  for (const s of tl.sections) c = mix(c, accentOf(P, s.accent), easeInOut(prog(t, s.start, s.start + TRANS)));
  return c;
};

/** "Morph" del círculo en cada cambio de sección: 0 → 1 → 0 durante 15 frames. */
const morphAt = (tl: Timeline, t: number) => {
  let m = 0;
  for (const s of tl.sections.slice(1)) m = Math.max(m, Math.sin(Math.PI * prog(t, s.start - TRANS / 2, s.start + TRANS / 2)));
  return m;
};

const byKind = (tl: Timeline, id: string) => tl.sections.find((s) => s.id === id)!;

/* ---------- fondo ---------- */

const Background: React.FC<{ P: Palette; accent: string; L: Layout; k: number }> = ({ P, accent, L, k }) => (
  <AbsoluteFill>
    <AbsoluteFill style={{ background: `linear-gradient(180deg, ${P.deeper} 0%, ${P.deep} 42%, ${mix(P.deep, P.mid, 0.18)} 100%)` }} />
    <AbsoluteFill
      style={{
        background: `radial-gradient(circle at ${L.circle.cx}px ${L.circle.cy}px, ${rgba(accent, 0.16)} 0px, ${rgba(accent, 0.05)} ${560 * k}px, rgba(0,0,0,0) ${900 * k}px)`,
      }}
    />
  </AbsoluteFill>
);

// <Img> (no background-image): Remotion espera a que cargue antes de capturar cada frame
const Grain: React.FC = () => (
  <Img src={staticFile("textures/grain.png")} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", opacity: 0.045, mixBlendMode: "overlay" }} />
);

/* ---------- círculo ancla ---------- */

const Disc: React.FC<{ t: number; tl: Timeline; P: Palette; accent: string; scale: number; morph: number; taste: number }> = ({ t, P, accent, scale, morph, taste }) => {
  const R = DESIGN_R;
  const N = 180;
  let d = "";
  for (let i = 0; i <= N; i++) {
    const th = (i / N) * Math.PI * 2;
    const r = R * (1 + morph * (0.011 * Math.sin(3 * th + 2.1 * t) + 0.005 * Math.sin(5 * th - 1.3 * t)));
    d += `${i ? "L" : "M"}${(Math.cos(th) * r).toFixed(2)},${(Math.sin(th) * r).toFixed(2)} `;
  }
  d += "Z";
  const segs = 10;
  // el cítrico "se ilumina" como una luz que se abre desde el centro (y se cierra igual al salir):
  // nunca pasa por un gris intermedio azul↔amarillo
  const lightR = R * 1.04 * taste;
  return (
    <g transform={`scale(${scale.toFixed(5)})`}>
      <defs>
        <radialGradient id="disc" cx="42%" cy="36%" r="70%">
          <stop offset="0%" stopColor="#20507E" />
          <stop offset="100%" stopColor="#133A62" />
        </radialGradient>
        <radialGradient id="citrus" cx="45%" cy="40%" r="68%">
          <stop offset="0%" stopColor="#FFF6DC" />
          <stop offset="100%" stopColor={P.citrus} />
        </radialGradient>
        <clipPath id="discClip">
          <path d={d} />
        </clipPath>
        <clipPath id="lightClip">
          <circle r={Math.max(0.01, lightR)} />
        </clipPath>
      </defs>
      <path d={d} fill="url(#disc)" />
      {taste > 0 && (
        <g clipPath="url(#discClip)">
          <g clipPath="url(#lightClip)">
            <path d={d} fill="url(#citrus)" />
            {Array.from({ length: segs }).map((_, i) => {
              const a0 = (i / segs) * Math.PI * 2 + 0.05;
              const a1 = ((i + 1) / segs) * Math.PI * 2 - 0.05;
              const r0 = 40;
              const r1 = R - 34;
              const p = (a: number, r: number) => `${(Math.cos(a) * r).toFixed(1)},${(Math.sin(a) * r).toFixed(1)}`;
              return <path key={i} d={`M${p(a0 + 0.12, r0)} L${p(a0, r1 - 10)} A${r1},${r1} 0 0 1 ${p(a1, r1 - 10)} L${p(a1 - 0.12, r0)} Z`} fill={P.white} fillOpacity={0.3} />;
            })}
            <circle r={R - 14} fill="none" stroke={P.white} strokeOpacity={0.7} strokeWidth={7} />
            <circle r={26} fill={P.white} fillOpacity={0.6} />
          </g>
          {taste < 1 && <circle r={lightR} fill="none" stroke={P.citrus} strokeOpacity={0.35} strokeWidth={22} />}
        </g>
      )}
      <path d={d} fill="none" stroke={accent} strokeOpacity={0.75} strokeWidth={3.5} />
      <path d={d} fill="none" stroke={accent} strokeOpacity={0.1} strokeWidth={22} clipPath="url(#discClip)" />
    </g>
  );
};

/* ---------- textos ---------- */

const NumberMark: React.FC<{ s: Section; t: number; L: Layout; k: number; P: Palette }> = ({ s, t, L, k, P }) => {
  const isTaste = s.id === "saborear";
  // en "saborear" el número sale antes de que la luz se cierre: siempre queda sobre fondo claro
  const [tout, tail] = isTaste ? [0.6, -0.15] : [0.4, 0.05];
  const pres = sectionPresence(s, t, TRANS, tout, tail);
  if (pres <= 0) return null;
  const lt = t - s.start;
  const rise = 1 - springAt(lt - 0.02, 0.75, 1);
  const leave = ramp(t, s.end - tout, s.end + tail);
  // el "1" entra cuando el círculo ya se iluminó: nunca hay un momento de bajo contraste
  const lateIn = isTaste ? ramp(lt, 0.55, 1.05) : 1;
  const numColor = isTaste ? P.deep : P.cream;
  const labelColor = isTaste ? "#1F4E79" : P.sky;
  return (
    <div
      style={{
        position: "absolute",
        left: L.circle.cx,
        top: L.circle.cy,
        transform: `translate(-50%, -50%) translateY(${((rise * 30 - leave * 22) * k).toFixed(2)}px)`,
        opacity: pres * lateIn,
        textAlign: "center",
        fontFamily: FONT,
        width: 520 * k,
      }}
    >
      <div style={{ fontSize: 300 * k, fontWeight: config.fonts.numberWeight, lineHeight: 0.92, color: numColor, letterSpacing: "-0.02em", marginTop: -14 * k }}>{s.number}</div>
      <div style={{ fontSize: 44 * k, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: labelColor, marginTop: 6 * k }}>{s.label}</div>
    </div>
  );
};

const IntroTitle: React.FC<{ s: Section; t: number; L: Layout; k: number; P: Palette }> = ({ s, t, L, k, P }) => {
  const a = ramp(t, 0.7, 1.5, easeOut) * (1 - ramp(t, s.end - 0.45, s.end));
  if (a <= 0) return null;
  return (
    <div style={{ position: "absolute", left: L.circle.cx, top: L.circle.cy, transform: `translate(-50%,-50%) translateY(${((1 - a) * 16 * k).toFixed(2)}px)`, opacity: a, textAlign: "center", fontFamily: FONT, width: 520 * k }}>
      <div style={{ fontSize: 34 * k, fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", color: P.sky }}>Grounding</div>
      <div style={{ fontSize: 92 * k, fontWeight: 500, color: P.cream, letterSpacing: "0.02em", marginTop: 4 * k }}>5·4·3·2·1</div>
    </div>
  );
};

const Heart: React.FC<{ size: number }> = ({ size }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" style={{ display: "inline-block", verticalAlign: "-0.12em", marginLeft: "0.18em" }} aria-label="corazón azul">
    <defs>
      <linearGradient id="heartG" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#8CCBF5" />
        <stop offset="1" stopColor="#3E8FD8" />
      </linearGradient>
    </defs>
    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" fill="url(#heartG)" />
    <path d="M7.2 6.2c-1.4.2-2.4 1.3-2.5 2.7" stroke="#FFFFFF" strokeOpacity={0.55} strokeWidth={1.3} fill="none" strokeLinecap="round" />
  </svg>
);

const OutroText: React.FC<{ tl: Timeline; t: number; L: Layout; k: number; P: Palette }> = ({ tl, t, L, k, P }) => {
  const a = ramp(t, tl.onScreen.start, tl.onScreen.start + 0.8, easeOut);
  if (a <= 0 || !tl.onScreen.text) return null;
  const words = tl.onScreen.text.split(" ");
  const last = words.pop();
  return (
    <div style={{ position: "absolute", left: L.circle.cx, top: L.circle.cy, transform: `translate(-50%,-50%) translateY(${((1 - a) * 18 * k).toFixed(2)}px)`, opacity: a, textAlign: "center", fontFamily: FONT, width: 470 * k }}>
      <svg width={54 * k} height={54 * k} viewBox="0 0 24 24" style={{ marginBottom: 10 * k }}>
        <path d="M6.5 3.5h11a1 1 0 0 1 1 1v16l-6.5-4.2-6.5 4.2v-16a1 1 0 0 1 1-1z" fill="none" stroke={P.sky} strokeWidth={1.7} strokeLinejoin="round" />
      </svg>
      <div style={{ fontSize: 60 * k, fontWeight: 700, lineHeight: 1.16, color: P.cream, letterSpacing: "-0.005em" }}>
        {words.join(" ")}{" "}
        <span style={{ whiteSpace: "nowrap" }}>
          {last}
          <Heart size={56 * k} />
        </span>
      </div>
    </div>
  );
};

const Captions: React.FC<{ tl: Timeline; t: number; L: Layout; P: Palette }> = ({ tl, t, L, P }) => {
  const c = tl.captions.find((c) => t >= c.showFrom && t < c.showTo + 0.12);
  if (!c) return null;
  const out = 1 - ramp(t, c.showTo, c.showTo + 0.12);
  return (
    <div style={{ position: "absolute", top: L.captions.y, left: 0, right: 0, display: "flex", justifyContent: "center", opacity: out }}>
      <div
        style={{
          maxWidth: L.captions.maxWidth,
          textAlign: "center",
          textWrap: "balance",
          fontFamily: FONT,
          fontWeight: config.fonts.captionWeight,
          fontSize: L.captions.size,
          lineHeight: 1.22,
          color: P.white,
          textShadow: `0 2px 16px ${rgba(P.deeper, 0.9)}, 0 0 3px ${rgba(P.deeper, 0.7)}`,
        }}
      >
        {c.words.map((w, i) => {
          const a = ramp(t, w.start - 0.05, w.start + 0.12, easeOut);
          return (
            <span key={i} style={{ display: "inline-block", margin: "0 0.13em", opacity: a, transform: `translateY(${((1 - a) * 0.14).toFixed(3)}em)` }}>
              {w.text}
            </span>
          );
        })}
      </div>
    </div>
  );
};

const Header: React.FC<{ t: number; L: Layout; P: Palette }> = ({ t, L, P }) => {
  const a = ramp(t, 0.3, 1.3);
  return (
    <div style={{ position: "absolute", top: L.header.y, left: 0, right: 0, textAlign: "center", fontFamily: FONT, fontWeight: 700, fontSize: 27, letterSpacing: "0.16em", textTransform: "uppercase", color: P.sky, opacity: 0.92 * a }}>
      {config.brand.logo ? <Img src={staticFile(config.brand.logo)} style={{ height: 44 }} /> : config.brand.signature}
    </div>
  );
};

const Disclaimer: React.FC<{ tl: Timeline; t: number; L: Layout; P: Palette }> = ({ tl, t, L, P }) => {
  const a = ramp(t, tl.disclaimer.start, tl.disclaimer.start + 0.6, easeOut);
  if (a <= 0) return null;
  const [first, ...rest] = tl.disclaimer.text.split(". ");
  return (
    <div style={{ position: "absolute", top: L.disclaimer.y, left: 0, right: 0, textAlign: "center", fontFamily: FONT, fontWeight: 600, fontSize: L.disclaimer.size, lineHeight: 1.3, color: P.cream, opacity: a, letterSpacing: "0.01em" }}>
      <div style={{ width: 64, height: 2, background: rgba(P.sky, 0.6), margin: "0 auto 14px", borderRadius: 2 }} />
      {L.width / L.height < 0.7 ? (
        <>
          <div>{first}.</div>
          <div>{rest.join(". ")}</div>
        </>
      ) : (
        <div>{tl.disclaimer.text}</div>
      )}
    </div>
  );
};

/* ---------- capas ---------- */

/** Cada mundo vive en su propia capa SVG y se funde con opacidad CSS (compositor).
 *  La opacidad de grupo SVG sobre contenido con clipPath anidados no rasteriza de forma
 *  determinista en Chromium; así cada frame sale idéntico bit a bit entre renders. */
const Layer: React.FC<{ L: Layout; k: number; opacity: number; children: React.ReactNode }> = ({ L, k, opacity, children }) =>
  opacity <= 0 ? null : (
    <div style={{ position: "absolute", inset: 0, opacity }}>
      <svg width={L.width} height={L.height} viewBox={`0 0 ${L.width} ${L.height}`} style={{ position: "absolute", inset: 0 }}>
        <g transform={`translate(${L.circle.cx},${L.circle.cy}) scale(${k})`}>{children}</g>
      </svg>
    </div>
  );

/* ---------- composición ---------- */

export const Grounding: React.FC<GroundingProps> = ({ variant, layout, captions }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const tl = getTimeline(variant);
  const L = config.layouts[layout] as Layout;
  const P = config.palette;
  const k = L.circle.r / DESIGN_R;
  const orbit = L.orbit;
  const M = config.motion;

  const intro = tl.sections[0];
  const outro = tl.sections[tl.sections.length - 1];
  const accent = accentAt(tl, P, t);
  const morph = morphAt(tl, t);
  const taste = sectionPresence(byKind(tl, "saborear"), t, 1.0, 0.5, 0.4);

  const enter = ramp(t, 0.05, 1.4);
  // el halo cítrico sobre azul se ensucia (oliva): se aclara hacia crema cálida
  const haloColor = mix(accent, P.white, 0.35 * taste);
  const breath = lerp(M.breathMin, M.breathMax, breath01(t, M.breathPeriod));
  const focus = 1 + 0.07 * ramp(t, outro.start, outro.start + 1.2);
  const discScale = (0.86 + 0.14 * springAt(t - 0.05, 1.6, 1)) * breath * (1 - 0.035 * morph) * focus;
  const fade = 1 - ramp(t, tl.fadeOut.start, tl.fadeOut.end);

  const steps = tl.sections.filter((s) => s.kind === "step");
  const sec = (id: string) => byKind(tl, id);

  return (
    <AbsoluteFill style={{ backgroundColor: P.deep, overflow: "hidden" }}>
      <Background P={P} accent={accent} L={L} k={k} />
      <AbsoluteFill style={{ opacity: fade }}>
        <Layer L={L} k={k} opacity={enter}>
          <defs>
            <radialGradient id="halo">
              <stop offset="0.55" stopColor={haloColor} stopOpacity={0.22 + 0.08 * breath01(t, M.breathPeriod)} />
              <stop offset="0.75" stopColor={haloColor} stopOpacity={0.08} />
              <stop offset="1" stopColor={haloColor} stopOpacity={0} />
            </radialGradient>
          </defs>
          <circle r={DESIGN_R * 1.75 * discScale} fill="url(#halo)" />
        </Layer>
        <Layer L={L} k={k} opacity={sectionPresence(sec("oler"), t)}>
          <SmellWorld t={t} s={sec("oler")} P={P} />
        </Layer>
        <Layer L={L} k={k} opacity={sectionPresence(sec("oir"), t)}>
          <HearWorld t={t} s={sec("oir")} P={P} />
        </Layer>
        <Layer L={L} k={k} opacity={enter}>
          <Disc t={t} tl={tl} P={P} accent={accent} scale={discScale} morph={morph} taste={taste} />
        </Layer>
        <Layer L={L} k={k} opacity={sectionPresence(sec("ver"), t)}>
          <SeeWorld t={t} s={sec("ver")} P={P} orbit={orbit} />
        </Layer>
        <Layer L={L} k={k} opacity={sectionPresence(sec("tocar"), t)}>
          <TouchWorld t={t} s={sec("tocar")} P={P} orbit={orbit} />
        </Layer>
        <IntroTitle s={intro} t={t} L={L} k={k} P={P} />
        {steps.map((s) => (
          <NumberMark key={s.id} s={s} t={t} L={L} k={k} P={P} />
        ))}
        <OutroText tl={tl} t={t} L={L} k={k} P={P} />
        <Header t={t} L={L} P={P} />
        {captions && <Captions tl={tl} t={t} L={L} P={P} />}
      </AbsoluteFill>
      <Disclaimer tl={tl} t={t} L={L} P={P} />
      <Grain />
    </AbsoluteFill>
  );
};
