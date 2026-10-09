import React from "react";
import { Palette, Section, easeInOut, prog, rand, rgba, sectionPresence } from "../lib";

/** 2 · oler — dos volutas (flor y café) que suben, envuelven el círculo y se entrelazan arriba. */

const Y0 = 392; // origen (abajo del círculo)
const Y1 = -372; // punto más alto

const wispX = (u: number, side: number, phase: number, t: number) => {
  const amp = 40 + 320 * Math.pow(Math.sin(Math.PI * Math.min(1, u * 1.05)), 1.3);
  return side * 72 * (1 - u) ** 2 + amp * Math.sin(2 * Math.PI * 1.15 * u + phase - 0.9 * t);
};

export const SmellWorld: React.FC<{ t: number; s: Section; P: Palette }> = ({ t, s, P }) => {
  const pres = sectionPresence(s, t);
  if (pres <= 0) return null;
  const lt = t - s.start;
  const items = s.items ?? [];
  const dur = s.end - s.start;
  const stagger = Math.min(0.9, (dur - 2.2) / items.length);
  return (
    <g>
      {items.map((id, k) => {
        const side = k === 0 ? -1 : 1;
        const phase = k === 0 ? 0 : Math.PI;
        const c = id === "coffee" ? P.coffee : P.coral;
        const a = 0.35 + stagger * k;
        const grow = easeInOut(prog(lt, a + 0.25, a + 1.9));
        const srcOn = easeInOut(prog(lt, a, a + 0.6));
        const N = 120;
        let d = "";
        for (let i = 0; i <= N; i++) {
          const u = (grow * i) / N;
          const y = Y0 + (Y1 - Y0) * u;
          d += `${i ? "L" : "M"}${wispX(u, side, phase, lt).toFixed(1)},${y.toFixed(1)} `;
        }
        const gid = `wisp-${id}`;
        const sx = side * 72;
        return (
          <g key={id}>
            <defs>
              <linearGradient id={gid} gradientUnits="userSpaceOnUse" x1={0} y1={Y0} x2={0} y2={Y1}>
                <stop offset="0" stopColor={c} stopOpacity={0.35} />
                <stop offset="0.35" stopColor={c} stopOpacity={1} />
                <stop offset="0.8" stopColor={c} stopOpacity={0.8} />
                <stop offset="1" stopColor={c} stopOpacity={0} />
              </linearGradient>
            </defs>
            {grow > 0 && (
              <g>
                <path d={d} fill="none" stroke={`url(#${gid})`} strokeOpacity={0.14} strokeWidth={30} strokeLinecap="round" />
                <path d={d} fill="none" stroke={`url(#${gid})`} strokeOpacity={0.32} strokeWidth={13} strokeLinecap="round" />
                <path d={d} fill="none" stroke={`url(#${gid})`} strokeOpacity={0.9} strokeWidth={4.5} strokeLinecap="round" />
              </g>
            )}
            {Array.from({ length: 9 }).map((_, p) => {
              const u = (rand(p * 3.3 + k * 11) + lt * 0.11) % 1;
              if (u > grow) return null;
              const y = Y0 + (Y1 - Y0) * u;
              const x = wispX(u, side, phase, lt) + 14 * Math.sin(lt * 1.3 + p);
              return <circle key={p} cx={x} cy={y} r={3 + 2 * rand(p * 5.1)} fill={c} opacity={0.7 * Math.sin(Math.PI * u)} />;
            })}
            <g transform={`translate(${sx},${Y0 + 8}) scale(${(0.7 + 0.3 * srcOn).toFixed(3)})`} opacity={srcOn}>
              <circle r={36} fill={P.deep} stroke={rgba(c, 0.75)} strokeWidth={2.5} />
              {id === "coffee" ? (
                <g transform="rotate(28)">
                  <ellipse rx={14} ry={20} fill={c} />
                  <path d="M 0 -17 C -7 -6, 7 6, 0 17" stroke={P.deep} strokeOpacity={0.55} strokeWidth={3.5} fill="none" strokeLinecap="round" />
                </g>
              ) : (
                <g>
                  {[0, 1, 2, 3, 4].map((i) => {
                    const an = (i * 72 - 90) * (Math.PI / 180);
                    return <circle key={i} cx={Math.cos(an) * 12} cy={Math.sin(an) * 12} r={10} fill={c} />;
                  })}
                  <circle r={7} fill={P.citrus} />
                </g>
              )}
            </g>
          </g>
        );
      })}
    </g>
  );
};
