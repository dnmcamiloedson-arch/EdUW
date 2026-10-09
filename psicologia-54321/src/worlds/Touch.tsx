import React from "react";
import { Palette, Section, easeInOut, mix, prog, rand, rgba, sectionPresence } from "../lib";

/** 4 · tocar — cuatro texturas abstractas; una luz suave las recorre y la textura responde. */

const H = 85; // medio lado del mosaico (unidades de diseño)

type Ctx = { lt: number; tx: number; ty: number; P: Palette; k: number };

const near = (x: number, y: number, tx: number, ty: number, s = 40) => Math.exp(-((x - tx) ** 2 + (y - ty) ** 2) / (2 * s * s));

const Fabric: React.FC<Ctx> = ({ lt, tx, P }) => {
  const bands = [];
  for (let i = 0; i < 9; i++) {
    const y0 = -H + 4 + i * 21;
    let d = "";
    for (let x = -H - 10; x <= H + 10; x += 6) {
      const bump = 9 * Math.exp(-((x - tx) ** 2) / (2 * 30 * 30)); // pliegue que sigue a la luz
      const y = y0 + 5 * Math.sin(x * 0.05 + lt * 1.6 + i * 0.5) + bump;
      d += `${d ? "L" : "M"}${x.toFixed(1)},${y.toFixed(1)} `;
    }
    bands.push(<path key={i} d={d} stroke={i % 2 ? mix(P.sage, P.white, 0.25) : mix(P.sage, P.deep, 0.25)} strokeWidth={13} fill="none" strokeLinecap="round" />);
  }
  return (
    <g>
      <rect x={-H} y={-H} width={2 * H} height={2 * H} fill={mix(P.sage, P.deep, 0.45)} />
      {bands}
    </g>
  );
};

const Rough: React.FC<Ctx> = ({ tx, ty, P }) => {
  const dots = [];
  let n = 0;
  for (let gx = 0; gx < 9; gx++)
    for (let gy = 0; gy < 9; gy++) {
      n++;
      const x = -H + 10 + gx * 19.5 + (rand(n * 3.1) - 0.5) * 9;
      const y = -H + 10 + gy * 19.5 + (rand(n * 7.7) - 0.5) * 9;
      const r = 3 + rand(n * 1.3) * 4.5;
      const lift = near(x, y, tx, ty, 34);
      dots.push(<circle key={n} cx={x} cy={y} r={r * (1 + 0.35 * lift)} fill={mix(mix(P.coral, P.deep, 0.15), P.cream, 0.25 + 0.45 * lift)} />);
    }
  return (
    <g>
      <rect x={-H} y={-H} width={2 * H} height={2 * H} fill={mix(P.coral, P.deep, 0.62)} />
      {dots}
    </g>
  );
};

const Water: React.FC<Ctx> = ({ lt, tx, ty, P }) => {
  const rings = [];
  for (let j = 0; j < 5; j++) {
    const r = (lt * 34 + j * 26) % 130;
    rings.push(<circle key={j} cx={tx} cy={ty} r={r} fill="none" stroke={P.sky} strokeOpacity={0.75 * (1 - r / 130)} strokeWidth={3.5} />);
  }
  return (
    <g>
      <rect x={-H} y={-H} width={2 * H} height={2 * H} fill={mix(P.sky, P.deep, 0.62)} />
      {[0, 1, 2].map((i) => (
        <path key={i} d={`M ${-H} ${-40 + i * 40} q 28 ${-8} 56 0 t 56 0 t 56 0 t 56 0 t 56 0`} stroke={P.sky} strokeOpacity={0.18} strokeWidth={3} fill="none" transform={`translate(${((lt * 14 + i * 20) % 56) - 56},0)`} />
      ))}
      {rings}
    </g>
  );
};

const Wool: React.FC<Ctx> = ({ lt, tx, ty, P }) => {
  const curls = [];
  let n = 0;
  for (let gx = 0; gx < 8; gx++)
    for (let gy = 0; gy < 8; gy++) {
      n++;
      const x = -H + 12 + gx * 22 + (rand(n * 2.3) - 0.5) * 6;
      const y = -H + 12 + gy * 22 + (rand(n * 5.9) - 0.5) * 6;
      const sway = 16 * Math.sin(lt * 1.8 - x * 0.035 - y * 0.02) + 34 * near(x, y, tx, ty, 30);
      const base = rand(n * 9.1) * 60 - 30;
      curls.push(
        <path key={n} d="M -9 4 C -7 -9, 7 -9, 9 4" transform={`translate(${x.toFixed(1)},${y.toFixed(1)}) rotate(${(base + sway).toFixed(1)})`} stroke={mix(P.cream, P.coral, rand(n) * 0.35)} strokeWidth={4.5} fill="none" strokeLinecap="round" />,
      );
    }
  return (
    <g>
      <rect x={-H} y={-H} width={2 * H} height={2 * H} fill={mix(P.cream, P.deep, 0.66)} />
      {curls}
    </g>
  );
};

const TEXTURES: Record<string, React.FC<Ctx>> = { fabric: Fabric, rough: Rough, water: Water, wool: Wool };

export const TouchWorld: React.FC<{ t: number; s: Section; P: Palette; orbit: number }> = ({ t, s, P, orbit }) => {
  const pres = sectionPresence(s, t);
  if (pres <= 0) return null;
  const lt = t - s.start;
  const items = s.items ?? [];
  const dur = s.end - s.start;
  const stagger = Math.min(0.8, (dur - 1.6) / items.length);
  const d = orbit / Math.SQRT2;
  const pos = [
    [-d, -d],
    [d, -d],
    [d, d],
    [-d, d],
  ];
  return (
    <g>
      {items.map((id, k) => {
        const a = 0.4 + stagger * k;
        const reveal = easeInOut(prog(lt, a, a + 0.75));
        if (reveal <= 0) return null;
        const Tex = TEXTURES[id];
        const lt2 = lt - a;
        // la "luz que recorre": trayectoria lenta tipo Lissajous dentro del mosaico
        const tx = 52 * Math.sin(0.9 * lt2 + k * 1.3);
        const ty = 44 * Math.sin(1.25 * lt2 + k * 2.1 + 0.6);
        const [x, y] = pos[k];
        const fy = 4 * Math.sin(1.0 * t + k * 1.9);
        const rr = reveal * 2.9 * H;
        return (
          <g key={id} transform={`translate(${x.toFixed(2)},${(y + fy).toFixed(2)})`}>
            <defs>
              <clipPath id={`tile-${id}`}>
                <rect x={-H} y={-H} width={2 * H} height={2 * H} rx={34} />
              </clipPath>
              <clipPath id={`wipe-${id}`}>
                <circle cx={-H} cy={-H} r={rr} />
              </clipPath>
              <radialGradient id={`light-${id}`}>
                <stop offset="0%" stopColor={P.white} stopOpacity={0.5} />
                <stop offset="100%" stopColor={P.white} stopOpacity={0} />
              </radialGradient>
            </defs>
            <g clipPath={`url(#wipe-${id})`}>
              <g clipPath={`url(#tile-${id})`}>
                <Tex lt={lt2} tx={tx} ty={ty} P={P} k={k} />
                <circle cx={tx} cy={ty} r={30} fill={`url(#light-${id})`} />
              </g>
              <rect x={-H} y={-H} width={2 * H} height={2 * H} rx={34} fill="none" stroke={rgba(P.cream, 0.28)} strokeWidth={2.5} />
            </g>
          </g>
        );
      })}
    </g>
  );
};
