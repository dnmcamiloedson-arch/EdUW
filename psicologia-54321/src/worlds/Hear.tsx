import React from "react";
import { Palette, Section, easeInOut, prog, rand, rgba, sectionPresence } from "../lib";

/** 3 · oír — tres anillos-onda alrededor del círculo, cada uno con su "voz": lluvia, pájaro, murmullo. */

const TAU = Math.PI * 2;
const angDist = (a: number, b: number) => {
  const d = Math.abs(a - b) % TAU;
  return d > Math.PI ? TAU - d : d;
};

const WAVES: Record<string, (th: number, t: number) => number> = {
  // gotas: pequeños pulsos suaves (suben y bajan en 0.6 s), dispersos
  rain: (th, t) => {
    let v = 0;
    for (let i = 0; i < 34; i++) {
      const c = rand(i * 4.7) * TAU;
      const dd = angDist(th, c);
      if (dd > 0.12) continue;
      const tau = (t + rand(i * 9.3) * 1.8) % 1.8;
      const life = tau < 0.6 ? Math.sin((Math.PI * tau) / 0.6) : 0;
      v += life * Math.exp(-((dd / 0.045) ** 2));
    }
    return 15 * v;
  },
  // pájaro: dos paquetes de trino que viajan por el anillo
  bird: (th, t) => {
    let v = 0;
    for (let p = 0; p < 2; p++) {
      const c = -1.2 + p * Math.PI + t * 0.55;
      const env = Math.exp(-((angDist(th, c) / 0.32) ** 2)) * (0.55 + 0.45 * Math.sin(t * 1.6 + p * 2));
      v += env * Math.sin(34 * th - 9 * t);
    }
    return 14 * v;
  },
  // murmullo: ondulación grave y continua
  murmur: (th, t) => 6 * Math.sin(3 * th + 0.9 * t) + 4 * Math.sin(5 * th - 0.7 * t) + 2.5 * Math.sin(9 * th + 1.2 * t),
};

const COLORS: Record<string, keyof Palette> = { rain: "sky", bird: "citrus", murmur: "sage" };
const ICON_ANGLE: Record<string, number> = { rain: -128, bird: -52, murmur: 180 };

const Icon: React.FC<{ id: string; c: string; P: Palette }> = ({ id, c, P }) => {
  if (id === "rain") return <path d="M0,-15 C7,-5 11,1 11,6 A11,11 0 0 1 -11,6 C-11,1 -7,-5 0,-15 Z" fill={c} />;
  if (id === "bird")
    return (
      <g>
        <path d="M -16 4 C -10 -9, 6 -10, 11 -2 L 18 -5 L 14 3 C 9 12, -7 13, -16 4 Z" fill={c} />
        <path d="M -5 1 C -2 -9, 6 -13, 9 -13 C 7 -5, 3 0, -5 1 Z" fill={P.deep} fillOpacity={0.35} />
      </g>
    );
  return <path d="M -16 0 C -12 -9, -8 -9, -4 0 S 4 9, 8 0 S 13 -8, 16 -3" stroke={c} strokeWidth={4} fill="none" strokeLinecap="round" />;
};

export const HearWorld: React.FC<{ t: number; s: Section; P: Palette }> = ({ t, s, P }) => {
  const pres = sectionPresence(s, t);
  if (pres <= 0) return null;
  const lt = t - s.start;
  const items = s.items ?? [];
  const dur = s.end - s.start;
  const stagger = Math.min(0.9, (dur - 1.8) / items.length);
  return (
    <g>
      {items.map((id, k) => {
        const a = 0.35 + stagger * k;
        const reveal = easeInOut(prog(lt, a, a + 0.9));
        if (reveal <= 0) return null;
        const r0 = 345 + 56 * k;
        const f = WAVES[id];
        const c = P[COLORS[id]];
        const N = 260;
        const span = TAU * reveal;
        let d = "";
        for (let i = 0; i <= N; i++) {
          const th = -Math.PI / 2 + (span * i) / N;
          const r = r0 + reveal * f(th, lt);
          d += `${i ? "L" : "M"}${(Math.cos(th) * r).toFixed(1)},${(Math.sin(th) * r).toFixed(1)} `;
        }
        const ia = (ICON_ANGLE[id] * Math.PI) / 180;
        const iconOn = easeInOut(prog(lt, a + 0.5, a + 1.0));
        return (
          <g key={id}>
            <circle r={r0} fill="none" stroke={rgba(c, 0.12 * reveal)} strokeWidth={14} />
            <path d={d} fill="none" stroke={c} strokeOpacity={0.9} strokeWidth={4} strokeLinejoin="round" strokeLinecap="round" />
            <g transform={`translate(${(Math.cos(ia) * r0).toFixed(1)},${(Math.sin(ia) * r0).toFixed(1)}) scale(${(0.8 + 0.2 * iconOn).toFixed(3)})`} opacity={iconOn}>
              <circle r={31} fill={P.deep} stroke={rgba(c, 0.8)} strokeWidth={2.5} />
              <Icon id={id} c={c} P={P} />
            </g>
          </g>
        );
      })}
    </g>
  );
};
