import React from "react";
import { Palette, Section, rgba, sectionPresence, springAt } from "../lib";

/** 5 · ver — cinco puntos de luz que se vuelven objetos sencillos (vector plano). */

type IconFn = (P: Palette) => React.ReactNode;

const ICONS: Record<string, { color: keyof Palette; draw: IconFn }> = {
  leaf: {
    color: "sage",
    draw: (P) => (
      <g>
        <path d="M -30 30 C -36 -8, -8 -36, 34 -36 C 36 4, 10 32, -30 30 Z" fill={P.sage} />
        <path d="M -30 30 C -10 10, 8 -8, 26 -26" stroke={P.deep} strokeOpacity={0.45} strokeWidth={4} fill="none" strokeLinecap="round" />
      </g>
    ),
  },
  window: {
    color: "sky",
    draw: (P) => (
      <g>
        <rect x={-30} y={-34} width={60} height={68} rx={10} fill={P.sky} />
        <rect x={-22} y={-26} width={19} height={23} rx={4} fill={P.deep} fillOpacity={0.55} />
        <rect x={3} y={-26} width={19} height={23} rx={4} fill={P.deep} fillOpacity={0.55} />
        <rect x={-22} y={3} width={19} height={23} rx={4} fill={P.deep} fillOpacity={0.55} />
        <rect x={3} y={3} width={19} height={23} rx={4} fill={P.deep} fillOpacity={0.55} />
      </g>
    ),
  },
  mug: {
    color: "coral",
    draw: (P) => (
      <g>
        <path d="M -12 -38 C -18 -30, -6 -26, -12 -18" stroke={P.cream} strokeOpacity={0.7} strokeWidth={4} fill="none" strokeLinecap="round" />
        <path d="M 4 -38 C -2 -30, 10 -26, 4 -18" stroke={P.cream} strokeOpacity={0.7} strokeWidth={4} fill="none" strokeLinecap="round" />
        <circle cx={22} cy={8} r={12} stroke={P.coral} strokeWidth={7} fill="none" />
        <path d="M -30 -10 H 26 V 18 C 26 30, 18 36, 6 36 H -10 C -22 36, -30 30, -30 18 Z" fill={P.coral} />
      </g>
    ),
  },
  plant: {
    color: "sage",
    draw: (P) => (
      <g>
        <path d="M 0 6 C -4 -14, -26 -22, -32 -12 C -26 -2, -10 2, 0 6 Z" fill={P.sage} />
        <path d="M 0 4 C 2 -18, 22 -32, 32 -22 C 26 -8, 12 -2, 0 4 Z" fill={P.sage} />
        <path d="M 0 2 C -6 -20, -2 -36, 6 -40 C 10 -26, 6 -12, 0 2 Z" fill={P.sage} fillOpacity={0.85} />
        <path d="M -22 8 H 22 L 16 38 H -16 Z" fill={P.coral} />
        <rect x={-25} y={4} width={50} height={9} rx={4} fill={P.coral} />
      </g>
    ),
  },
  cloud: {
    color: "cream",
    draw: (P) => <path d="M -30 22 C -44 22, -44 0, -28 -2 C -28 -20, -6 -26, 4 -14 C 12 -28, 36 -22, 34 -4 C 48 -2, 46 22, 30 22 Z" fill={P.cream} />,
  },
};

export const SeeWorld: React.FC<{ t: number; s: Section; P: Palette; orbit: number }> = ({ t, s, P, orbit }) => {
  const pres = sectionPresence(s, t);
  if (pres <= 0) return null;
  const lt = t - s.start;
  const items = s.items ?? [];
  const dur = s.end - s.start;
  const stagger = Math.min(0.9, (dur - 2) / items.length);
  return (
    <g>
      {items.map((id, k) => {
        const icon = ICONS[id];
        const a = 0.45 + stagger * k;
        const pop = springAt(lt - a, 0.45, 0.75); // pop elástico muy ligero (~3 % de rebase)
        if (pop <= 0) return null;
        const m = springAt(lt - a - 0.5, 0.7, 1); // punto → objeto, sin rebote
        const ang = ((-90 + (360 / items.length) * k) * Math.PI) / 180;
        const x = Math.cos(ang) * orbit;
        const y = Math.sin(ang) * orbit + 5 * Math.sin(1.1 * t + k * 1.7);
        const c = P[icon.color];
        const r = 13 + (72 - 13) * m;
        return (
          <g key={id} transform={`translate(${x.toFixed(2)},${y.toFixed(2)}) scale(${pop.toFixed(4)})`}>
            <circle r={r + 22 * (1 - m)} fill={rgba(c, 0.18 * (1 - m))} />
            <circle r={r} fill={rgba(c, 0.95 - 0.8 * m)} stroke={rgba(c, 0.55 * m)} strokeWidth={2.5} />
            <g opacity={m} transform={`scale(${(0.7 + 0.3 * m).toFixed(4)})`}>
              {icon.draw(P)}
            </g>
          </g>
        );
      })}
    </g>
  );
};
