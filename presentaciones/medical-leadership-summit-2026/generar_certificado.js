// Certificados "Westhill Medical Leadership Summit 2026" (tamaño carta horizontal, 11 × 8.5 in).
// Misma línea visual del flyer y de la plantilla de diapositivas: ola azul con filo dorado y logo,
// guiones verdes, Montserrat. Detalle de impresión a 300 ppp: adorno en las esquinas libres (en
// diagonal con las olas, ver ESQUINAS), edificio y roseta de fondo, textura de papel y sello dorado.
//
// Genera:
//   Certificados_Medical_Leadership_Summit_2026.pptx  plantilla de participante y de ponente
//                                                      + un reconocimiento por cada ponente del programa
//   Certificados_participantes.pptx                    solo si existe participantes.txt (un nombre por renglón)
//
// Uso:  NODE_PATH=<carpeta>/node_modules node generar_certificado.js
const path = require("path");
const fs = require("fs");
const pptxgen = require("pptxgenjs");
const JSZip = require("jszip");
const sharp = require("sharp");

const DIR = __dirname;
const img = (f) => path.join(DIR, "img", f);
const HEX = { blue: "266294", royal: "0F62AE", deep: "0A4A92", navy: "0E2A47", gold: "F2C94C", goldDark: "B8861B", green: "2DB34A", muted: "5B6B7D", sky: "CFE6FB" };
const F = { reg: "Montserrat", med: "Montserrat Medium", semi: "Montserrat SemiBold", xb: "Montserrat ExtraBold" };
const W = 11, H = 8.5, P = 300;
// Adorno de las esquinas libres (arriba a la derecha y abajo a la izquierda):
//   ondas  = ondas suaves translúcidas con filo dorado (eco de las olas del logo)
//   puntos = trama de puntos que se desvanece + arco dorado
//   arcos  = arcos concéntricos dorados y azules
const ESQUINAS = process.env.ESQUINAS || "ondas";
// Zona del logo y de #SOMOSWESTHILL:
//   ola      = olas en esquinas opuestas (como el flyer)
//   banda    = banda azul superior con logo y título del evento + banda inferior con fecha
//   centrado = logo a color centrado, marco fino dorado y azul
//   panel    = panel azul lateral con logo, título del evento y fechas
const MARCO = process.env.MARCO || "banda";
const LAY = MARCO === "panel"
  ? { cx: 6.75, tw: 7.3, sig: [4.35, 9.15], sigW: 2.2, body: 6.9, rule: 5.4 }
  : { cx: W / 2, tw: 8.6, sig: [3.0, 8.0], sigW: 2.7, body: 7.9, rule: 6.2 }; // carta horizontal, arte a 300 ppp
const X = (v) => Math.round(v * P);

// ---------- datos ----------
const EVENTO = "Westhill Medical Leadership Summit 2026";
const LEMA = "Fronteras de la Medicina: actualización clínica y nuevas perspectivas en la práctica médica";
const CUANDO = "realizado los días 21, 22 y 23 de octubre de 2026 en la Facultad de Medicina de la Universidad Westhill";
const LUGAR_FECHA = "Ciudad de México, a 23 de octubre de 2026";
const FIRMAS = [["Nombre y firma", "Director(a) de la Facultad de Medicina"], ["Nombre y firma", "Rector(a) de la Universidad Westhill"]];
// Ponentes con nombre en Programa_Westhill.xlsx («Dra. Iris y Dr. Jorge Macías» se separa en dos).
const PONENTES = [
  ["Dr. Juan Manuel Ruiz Molina", "Cirugía en el mundo real: visión de un experto"],
  ["Dr. Norberto Ruiz Molina", "Enfermedad por reflujo gastroesofágico"],
  ["Dr. Alan", "¿Qué pasa después de la carrera?"],
  ["Dr. César Escalante", "Leadership in Healthcare: Leading High-Performance Medical Teams"],
  ["Dra. Guadalupe Rodríguez", "Anemias y leucemias"],
  ["Dr. Samuel Alejandro Zimbrón", "Nutrición clínica"],
  ["Dra. Iris", "AMIR"],
  ["Dr. Jorge Macías", "AMIR"],
  ["Dr. Asisclo", "Mesa redonda"],
];

// ---------- arte vectorial ----------
const f1 = (v) => v.toFixed(1);
// Curva tipo espirógrafo (hipotrocoide) para rosetas guilloche.
function rosette(cx, cy, R, r, d, scale, steps = 2400) {
  const k = (R - r) / r, turns = r / gcd(R, r);
  let s = "";
  for (let i = 0; i <= steps; i++) {
    const t = (i / steps) * 2 * Math.PI * turns;
    const x = cx + scale * ((R - r) * Math.cos(t) + d * Math.cos(k * t));
    const y = cy + scale * ((R - r) * Math.sin(t) - d * Math.sin(k * t));
    s += (i ? "L" : "M") + f1(x) + "," + f1(y);
  }
  return s + "Z";
}
function gcd(a, b) { return b ? gcd(b, a % b) : a; }
const dots = (x0, y0, cols, rows, gap, r, color, op) => {
  let s = "";
  for (let i = 0; i < cols; i++) for (let j = 0; j < rows; j++) s += `<circle cx="${x0 + i * gap}" cy="${y0 + j * gap}" r="${r}" fill="${color}" opacity="${op}"/>`;
  return s;
};
// Ola de la línea gráfica (misma forma que en la plantilla de diapositivas; k en unidades de 200 ppp).
function wave(k, fill = "url(#wb)") {
  const base = [920, 760, 150, 640, 290, 300, 310, 150, 318, 60, 322, 330];
  const p = (s) => base.map((v) => f1(v * k * 1.5 * s));
  const [a, b, c, d, e, f, g, h, i, j, l, m] = p(1), [ga, gb, gc, gd, ge, gf, gg, gh, gi, gj, gl, gm] = p(1.075);
  return `<path d="M0,0 H${a} C${b},${c} ${d},${e} ${f},${g} C${h},${i} ${j},${l} 0,${m} Z" fill="${fill}"/>` +
    `<path d="M0,0 H${f1(700 * k * 1.5)} C${f1(560 * k * 1.5)},${f1(110 * k * 1.5)} ${f1(430 * k * 1.5)},${f1(190 * k * 1.5)} 0,${f1(215 * k * 1.5)} Z" fill="#FFFFFF" fill-opacity="0.08"/>` +
    `<path d="M${ga},-6 C${gb},${gc} ${gd},${ge} ${gf},${gg} C${gh},${gi} ${gj},${gl} -6,${gm}" fill="none" stroke="url(#gold)" stroke-width="${f1(11 * k * 1.5)}" stroke-linecap="round"/>`;
}

async function background() {
  const w = X(W), h = X(H), tl = X(0.42);
  // Adorno de esquina en coordenadas locales: vértice en (0,0), brazos hacia +x y +y.
  const cornerArt = (x, y, sx, sy, id) => {
    let g = "";
    if (ESQUINAS === "ondas") {
      g = `<path d="M0,0 H760 C540,110 290,300 0,410 Z" fill="#2F7CC0" fill-opacity="0.07"/>
        <path d="M0,0 H600 C430,90 230,250 0,330 Z" fill="#2F7CC0" fill-opacity="0.10"/>
        <path d="M0,0 H430 C300,70 160,180 0,240 Z" fill="url(#${id}f)"/>
        <path d="M660,0 C470,105 250,280 0,370" fill="none" stroke="url(#gold)" stroke-width="6" stroke-linecap="round"/>
        <path d="M800,0 C570,130 300,340 0,450" fill="none" stroke="#266294" stroke-opacity="0.45" stroke-width="2.2"/>
        <circle cx="430" cy="128" r="9" fill="#2DB34A"/>`;
    } else if (ESQUINAS === "puntos") {
      for (let i = 0; i < 26; i++) for (let j = 0; j < 16; j++) {
        const px = 26 + i * 30, py = 26 + j * 30, d = Math.hypot(px / 780, py / 470);
        const r = 7.5 * (1 - d);
        if (r > 0.9) g += `<circle cx="${px}" cy="${py}" r="${f1(r)}" fill="#2F6FAE" fill-opacity="${f1(0.18 + 0.5 * (1 - d))}"/>`;
      }
      g += `<path d="M720,0 C520,60 220,260 0,440" fill="none" stroke="url(#gold)" stroke-width="6" stroke-linecap="round"/>
        <path d="M820,0 C590,80 260,300 0,500" fill="none" stroke="#266294" stroke-opacity="0.4" stroke-width="2"/>`;
    } else {
      g = `<path d="M0,0 H250 A250,250 0 0 1 0,250 Z" fill="#2F7CC0" fill-opacity="0.08"/>` +
        [[290, "#266294", 2, 0.55], [330, "url(#gold)", 6, 1], [370, "#266294", 2, 0.55], [410, "url(#gold)", 2.4, 0.7]]
          .map(([r, c, sw, o]) => `<path d="M${r},0 A${r},${r} 0 0 1 0,${r}" fill="none" stroke="${c}" stroke-opacity="${o}" stroke-width="${sw}"/>`).join("") +
        `<circle cx="${f1(330 * Math.cos(Math.PI / 4))}" cy="${f1(330 * Math.sin(Math.PI / 4))}" r="11" fill="#E8B530"/><circle cx="${f1(410 * Math.cos(Math.PI / 4))}" cy="${f1(410 * Math.sin(Math.PI / 4))}" r="7" fill="#2DB34A"/>`;
    }
    return `<g transform="translate(${x},${y}) scale(${sx},${sy})"><defs><linearGradient id="${id}f" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#2F7CC0" stop-opacity="0.22"/><stop offset="1" stop-color="#2F7CC0" stop-opacity="0.05"/></linearGradient></defs>${g}</g>`;
  };
  // Marca de agua: el edificio del logo en azul muy tenue detrás del nombre.
  const bld = await sharp(img("logo_westhill_blanco.png")).extract({ left: 163, top: 0, width: 1546, height: 432 }).toBuffer();
  const bldAlpha = await sharp(bld).extractChannel(3).toBuffer();
  const bldBlue = await sharp({ create: { width: 1546, height: 432, channels: 3, background: "#266294" } }).joinChannel(bldAlpha).png().toBuffer();
  const bw = X(6.2), bh = Math.round((bw * 432) / 1546);
  const watermark = [
    rosette(X(LAY.cx), 1300, 96, 36, 52, 6.4, 5200), rosette(X(LAY.cx), 1300, 80, 30, 46, 6.6, 4400), rosette(X(LAY.cx), 1300, 70, 21, 30, 5.2, 4200),
  ].map((d, i) => `<path d="${d}" fill="none" stroke="#2F6FAE" stroke-opacity="${[0.05, 0.04, 0.045][i]}" stroke-width="2"/>`).join("");
  const shine = (d) => `<path d="${d}" fill="#FFFFFF" fill-opacity="0.07"/>`;
  function marco() {
    if (MARCO === "banda") {
      // Curvas base: borde inferior de la banda superior y borde superior de la inferior.
      const tC = (dy = 0) => `C${X(3.4)},${X(0.98 + dy)} ${X(8.2)},${X(1.5 + dy)} ${w},${X(1.1 + dy)}`; // de izquierda a derecha
      const top = `M0,0 H${w} V${X(1.1)} C${X(8.2)},${X(1.5)} ${X(3.4)},${X(0.98)} 0,${X(1.36)} Z`;
      const bC = (dy = 0) => `C${X(3)},${X(7.98 + dy)} ${X(7.5)},${X(8.24 + dy)} ${w},${X(8.04 + dy)}`;
      const bot = `M0,${X(8.14)} ${bC()} V${h} H0 Z`;
      const side = (x, dir) => {
        const y0 = X(1.78), y1 = X(7.78), x2 = x + dir * X(0.07);
        const dia = (cx, cy, r) => `<rect x="${cx - r}" y="${cy - r}" width="${2 * r}" height="${2 * r}" transform="rotate(45 ${cx} ${cy})" fill="#E8B530"/>`;
        return `<line x1="${x}" y1="${y0}" x2="${x}" y2="${y1}" stroke="#E8B530" stroke-width="3.2"/>
          <line x1="${x2}" y1="${y0 + X(0.12)}" x2="${x2}" y2="${y1 - X(0.12)}" stroke="#266294" stroke-opacity="0.55" stroke-width="1.6"/>
          ${dia(x, y0, 11)}${dia(x, y1, 11)}${dia(x, (y0 + y1) / 2, 8)}`;
      };
      return `
        <clipPath id="bandTop"><path d="${top}"/></clipPath>
        <clipPath id="bandBot"><path d="${bot}"/></clipPath>
        <radialGradient id="bandGlow" cx="0.5" cy="0" r="0.75"><stop offset="0" stop-color="#FFFFFF" stop-opacity="0.22"/><stop offset="1" stop-color="#FFFFFF" stop-opacity="0"/></radialGradient>
        <linearGradient id="bandH" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#123F78"/><stop offset="0.5" stop-color="#2470B8"/><stop offset="1" stop-color="#123F78"/></linearGradient>
        <!-- banda superior -->
        <g clip-path="url(#bandTop)">
          <rect width="${w}" height="${X(1.6)}" fill="url(#bandH)"/>
          <rect width="${w}" height="${X(1.6)}" fill="url(#bandGlow)"/>
          <image x="${w / 2 - X(2.7)}" y="${X(0.12)}" width="${X(5.4)}" height="${Math.round((X(5.4) * 432) / 1546)}" opacity="0.08" xlink:href="data:image/png;base64,${bld.toString("base64")}"/>
          <path d="M0,${X(1.36)} ${tC()} V${X(0.84)} C${X(8.2)},${X(1.24)} ${X(3.4)},${X(0.72)} 0,${X(1.1)} Z" fill="#FFFFFF" fill-opacity="0.07"/>
          ${dots(X(3.55), X(0.28), 5, 3, 30, 4.5, "#FFFFFF", 0.25)}${dots(X(7.0), X(0.28), 5, 3, 30, 4.5, "#FFFFFF", 0.25)}
        </g>
        <path d="M0,${X(1.46)} ${tC(0.1)}" fill="none" stroke="url(#gold)" stroke-width="9"/>
        <path d="M0,${X(1.53)} ${tC(0.17)}" fill="none" stroke="#E8B530" stroke-opacity="0.6" stroke-width="2.4"/>
        <!-- banda inferior -->
        <path d="M0,${X(7.98)} ${bC(-0.16)}" fill="none" stroke="#E8B530" stroke-opacity="0.6" stroke-width="2.4"/>
        <path d="M0,${X(8.05)} ${bC(-0.09)}" fill="none" stroke="url(#gold)" stroke-width="8"/>
        <g clip-path="url(#bandBot)">
          <rect y="${X(7.9)}" width="${w}" height="${X(0.6)}" fill="url(#bandH)"/>
          <path d="M0,${X(8.14)} ${bC()} V${X(8.3)} C${X(7.5)},${X(8.5)} ${X(3)},${X(8.24)} 0,${X(8.4)} Z" fill="#FFFFFF" fill-opacity="0.07"/>
          <rect y="${h - X(0.06)}" width="${w}" height="${X(0.06)}" fill="#0B2E5C"/>
        </g>
        <!-- filetes laterales -->
        ${side(X(0.38), 1)}${side(w - X(0.38), -1)}`;
    }
    if (MARCO === "centrado") {
      const o = X(0.32), i = X(0.42), dia = (x, y) => `<rect x="${x - 16}" y="${y - 16}" width="32" height="32" transform="rotate(45 ${x} ${y})" fill="#E8B530"/>`;
      return `${cornerArt(0, 0, 1, 1, "c1")}${cornerArt(w, 0, -1, 1, "c2")}${cornerArt(0, h, 1, -1, "c3")}${cornerArt(w, h, -1, -1, "c4")}
        <rect x="${o}" y="${o}" width="${w - 2 * o}" height="${h - 2 * o}" fill="none" stroke="url(#gold)" stroke-width="6"/>
        <rect x="${i}" y="${i}" width="${w - 2 * i}" height="${h - 2 * i}" fill="none" stroke="#266294" stroke-opacity="0.8" stroke-width="2"/>
        ${dia(o, o)}${dia(w - o, o)}${dia(o, h - o)}${dia(w - o, h - o)}`;
    }
    if (MARCO === "panel") {
      const edge = `C${X(2.35)},${X(2.6)} ${X(3.05)},${X(5.6)} ${X(2.5)},${h}`;
      return `${cornerArt(w, 0, -1, 1, "p1")}${cornerArt(w, h, -1, -1, "p2")}
        <path d="M0,0 H${X(2.85)} ${edge} H0 Z" fill="url(#wb)"/>${shine(`M0,0 H${X(2.4)} C${X(1.9)},${X(2.2)} ${X(2.3)},${X(4.4)} ${X(1.6)},${h} H0 Z`)}
        <path d="M${X(2.97)},0 C${X(2.47)},${X(2.6)} ${X(3.17)},${X(5.6)} ${X(2.62)},${h}" fill="none" stroke="url(#gold)" stroke-width="9"/>
        ${dots(X(0.35), X(5.6), 6, 5, 32, 4.5, "#FFFFFF", 0.22)}
        <rect x="${X(1.35) - X(0.3)}" y="${X(4.33)}" width="${X(0.6)}" height="${X(0.05)}" fill="#2DB34A"/>`;
    }
    return `${cornerArt(w, 0, -1, 1, "tr")}${cornerArt(0, h, 1, -1, "bl")}${wave(1.15)}<g transform="translate(${w},${h}) scale(-1,-1)">${wave(0.78)}</g>`;
  }
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${w}" height="${h}">
  <defs>
    <linearGradient id="wb" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#2F7CC0"/><stop offset="1" stop-color="#174A86"/></linearGradient>
    <linearGradient id="gold" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#F7DC7A"/><stop offset="0.5" stop-color="#E8B530"/><stop offset="1" stop-color="#C9961F"/></linearGradient>
    <linearGradient id="goldH" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#E8B530" stop-opacity="0"/><stop offset="0.2" stop-color="#E8B530"/><stop offset="0.8" stop-color="#E8B530"/><stop offset="1" stop-color="#E8B530" stop-opacity="0"/></linearGradient>
    <radialGradient id="glow" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stop-color="#E3F0FC"/><stop offset="1" stop-color="#FFFFFF" stop-opacity="0"/></radialGradient>
    <filter id="paper" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="7"/><feColorMatrix type="matrix" values="0 0 0 0 0.55  0 0 0 0 0.62  0 0 0 0 0.72  0 0 0 0.06 0"/></filter>
    <clipPath id="inner"><rect x="${tl}" y="${tl}" width="${w - 2 * tl}" height="${h - 2 * tl}"/></clipPath>
  </defs>
  <rect width="100%" height="100%" fill="#FFFFFF"/>
  <rect width="100%" height="100%" filter="url(#paper)"/>
  <ellipse cx="${X(LAY.cx)}" cy="${h * 0.52}" rx="${w * 0.45}" ry="${h * 0.42}" fill="url(#glow)"/>
  <g clip-path="url(#inner)">${watermark}
    <image x="${X(LAY.cx) - bw / 2}" y="${X(4.05) - bh / 2}" width="${bw}" height="${bh}" opacity="0.045" xlink:href="data:image/png;base64,${bldBlue.toString("base64")}"/>
    ${MARCO === "panel" ? "" : dots(290, 930, 4, 6, 34, 5.5, "#3A7BC0", 0.4)}${dots(MARCO === "panel" ? 3060 : 2905, 1450, 4, 6, 34, 5.5, "#3A7BC0", 0.4)}
  </g>
  ${marco()}
</svg>`;
  return sharp(Buffer.from(svg)).png({ compressionLevel: 9 }).toBuffer();
}

// Texto en arco letra por letra (librsvg no dibuja textPath). top: lee sobre el arco superior.
function arcText(txt, cx, cy, r, size, top) {
  const adv = (ch) => (ch === " " ? 0.32 : /[MW]/.test(ch) ? 0.92 : /[I]/.test(ch) ? 0.34 : /[J]/.test(ch) ? 0.55 : 0.72) * size + size * 0.12;
  const total = [...txt].reduce((a, ch) => a + adv(ch), 0);
  const rr = r;
  let pos = -total / 2, out = "";
  for (const ch of txt) {
    const a = (pos + adv(ch) / 2) / rr; // radianes desde la vertical
    pos += adv(ch);
    if (ch === " ") continue;
    const ang = top ? -Math.PI / 2 + a : Math.PI / 2 - a;
    const x = cx + rr * Math.cos(ang), y = cy + rr * Math.sin(ang);
    const rot = top ? (a * 180) / Math.PI : (-a * 180) / Math.PI;
    out += `<text x="${f1(x)}" y="${f1(y)}" transform="rotate(${f1(rot)} ${f1(x)} ${f1(y)})" text-anchor="middle" font-family="Montserrat" font-weight="800" font-size="${size}" fill="#0E2A47">${ch}</text>`;
  }
  return out;
}

// Adornos dorados: filete que se desvanece con rombo (a los lados del subtítulo) y divisor del nombre.
async function ornaments(ruleW) {
  const png = async (svg) => "image/png;base64," + (await sharp(Buffer.from(svg)).png().toBuffer()).toString("base64");
  const side = (flip) => `<svg xmlns="http://www.w3.org/2000/svg" width="450" height="60"><defs>
      <linearGradient id="l" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#E8B530" stop-opacity="0"/><stop offset="1" stop-color="#E8B530"/></linearGradient></defs>
      <g transform="${flip ? "translate(450,0) scale(-1,1)" : ""}">
      <rect x="0" y="28" width="392" height="4" fill="url(#l)"/><rect x="250" y="35" width="142" height="1.6" fill="#2DB34A"/>
      <rect x="404" y="20" width="20" height="20" transform="rotate(45 414 30)" fill="#E8B530"/><circle cx="440" cy="30" r="4.5" fill="#E8B530"/></g></svg>`;
  const W2 = Math.round(ruleW * 300), c = W2 / 2;
  const name = `<svg xmlns="http://www.w3.org/2000/svg" width="${W2}" height="66"><defs>
      <linearGradient id="l" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#E8B530" stop-opacity="0"/><stop offset="0.45" stop-color="#E8B530"/><stop offset="1" stop-color="#E8B530"/></linearGradient>
      <linearGradient id="r" x1="1" y1="0" x2="0" y2="0"><stop offset="0" stop-color="#E8B530" stop-opacity="0"/><stop offset="0.45" stop-color="#E8B530"/><stop offset="1" stop-color="#E8B530"/></linearGradient></defs>
      <rect x="0" y="31" width="${c - 46}" height="3.5" fill="url(#l)"/><rect x="${c + 46}" y="31" width="${c - 46}" height="3.5" fill="url(#r)"/>
      <rect x="${c - 14}" y="${33 - 14}" width="28" height="28" transform="rotate(45 ${c} 33)" fill="#E8B530"/>
      <rect x="${c - 7}" y="${33 - 7}" width="14" height="14" transform="rotate(45 ${c} 33)" fill="#FFFFFF"/>
      <circle cx="${c - 34}" cy="33" r="5" fill="#E8B530"/><circle cx="${c + 34}" cy="33" r="5" fill="#E8B530"/></svg>`;
  return { left: await png(side(false)), right: await png(side(true)), name: await png(name) };
}

async function seal() {
  const S = 900, cx = 450, cy = 400, R = 300;
  const building = await sharp(img("logo_westhill_blanco.png")).extract({ left: 163, top: 0, width: 1546, height: 432 }).resize(300).png().toBuffer();
  let star = "";
  for (let i = 0; i < 144; i++) {
    const a = (i / 144) * 2 * Math.PI, r = i % 2 ? R - 16 : R;
    star += (i ? "L" : "M") + f1(cx + r * Math.cos(a)) + "," + f1(cy + r * Math.sin(a));
  }
  const rt = 236, rb = 262;
  const ribbon = (dir) => {
    const x0 = cx + dir * 70, x1 = cx + dir * 175;
    return `<path d="M${x0 - 60 * dir},${cy + 150} L${x0 + 40 * dir},${cy + 150} L${x1 + 40 * dir},${cy + 470} L${x1 - 5 * dir},${cy + 420} L${x1 - 75 * dir},${cy + 480} Z" fill="url(#rib)" stroke="#E8B530" stroke-width="6" stroke-linejoin="round"/>`;
  };
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${S}" height="${S}">
  <defs>
    <radialGradient id="g" cx="0.38" cy="0.32" r="0.75"><stop offset="0" stop-color="#FFF1B8"/><stop offset="0.45" stop-color="#F0C64A"/><stop offset="0.85" stop-color="#C9961F"/><stop offset="1" stop-color="#A97A12"/></radialGradient>
    <radialGradient id="n" cx="0.4" cy="0.35" r="0.7"><stop offset="0" stop-color="#2A6DB0"/><stop offset="1" stop-color="#0B2E5C"/></radialGradient>
    <linearGradient id="rib" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1E6DB8"/><stop offset="1" stop-color="#0B3F7E"/></linearGradient>
    <path id="top" d="M${cx - rt},${cy} A${rt},${rt} 0 0 1 ${cx + rt},${cy}"/>
    <path id="bot" d="M${cx - rb},${cy} A${rb},${rb} 0 0 0 ${cx + rb},${cy}"/>
    <filter id="sh" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="0" dy="10" stdDeviation="12" flood-color="#0E2A47" flood-opacity="0.35"/></filter>
  </defs>
  <g filter="url(#sh)">${ribbon(-1)}${ribbon(1)}<path d="${star}Z" fill="url(#g)"/></g>
  <circle cx="${cx}" cy="${cy}" r="${R - 30}" fill="none" stroke="#9C710F" stroke-width="3"/>
  <circle cx="${cx}" cy="${cy}" r="${R - 40}" fill="none" stroke="#FFF3C4" stroke-opacity="0.7" stroke-width="2"/>
  ${arcText("WESTHILL MEDICAL LEADERSHIP SUMMIT", cx, cy, 228, 25, true)}
  ${arcText("FACULTAD DE MEDICINA", cx, cy, 228, 26, false)}
  <circle cx="${cx - 222}" cy="${cy + 40}" r="5" fill="#0E2A47"/><circle cx="${cx + 222}" cy="${cy + 40}" r="5" fill="#0E2A47"/>
  <circle cx="${cx}" cy="${cy}" r="178" fill="url(#n)" stroke="#FFF3C4" stroke-width="5"/>
  <path d="${rosette(cx, cy, 60, 22, 34, 3.6, 3000)}" fill="none" stroke="#F2C94C" stroke-opacity="0.28" stroke-width="1.6"/>
  <image x="${cx - 150}" y="${cy - 105}" width="300" height="${Math.round((300 * 432) / 1546)}" xlink:href="data:image/png;base64,${building.toString("base64")}"/>
  <text x="${cx}" y="${cy + 70}" text-anchor="middle" font-family="Montserrat" font-weight="800" font-size="62" letter-spacing="6" fill="#F2C94C">2026</text>
  <rect x="${cx - 60}" y="${cy + 92}" width="120" height="6" fill="#2DB34A"/>
</svg>`;
  return "image/png;base64," + (await sharp(Buffer.from(svg)).png().toBuffer()).toString("base64");
}

// ---------- post-proceso: nombres de medios en ASCII y [Content_Types] limpio ----------
async function fixPackage(file) {
  const zip = await JSZip.loadAsync(fs.readFileSync(file));
  const ren = {};
  let n = 0;
  for (const name of Object.keys(zip.files).filter((f) => f.startsWith("ppt/media/") && !zip.files[f].dir)) {
    const buf = await zip.file(name).async("nodebuffer");
    const ext = buf[0] === 0xff && buf[1] === 0xd8 ? "jpeg" : buf[0] === 0x89 && buf[1] === 0x50 ? "png" : path.extname(name).slice(1);
    const base = path.basename(name);
    if (/^[A-Za-z0-9._-]+$/.test(base) && base.endsWith("." + ext)) continue;
    const nn = `medio-${++n}.${ext}`, clean = base.replace(/#U([0-9a-fA-F]{4})/g, (_, h) => String.fromCharCode(parseInt(h, 16)));
    ren[base] = nn; ren[clean] = nn;
    zip.remove(name);
    zip.file("ppt/media/" + nn, buf);
  }
  for (const name of Object.keys(zip.files).filter((f) => f.endsWith(".rels"))) {
    const xml = await zip.file(name).async("string");
    const out = xml.replace(/Target="\.\.\/media\/([^"]+)"/g, (all, t) => (ren[t] ? `Target="../media/${ren[t]}"` : all));
    if (out !== xml) zip.file(name, out);
  }
  let ct = await zip.file("[Content_Types].xml").async("string");
  ct = ct.replace(/<Override PartName="\/([^"]+)"[^>]*\/>/g, (all, p) => (zip.file(p) ? all : ""));
  zip.file("[Content_Types].xml", ct);
  fs.writeFileSync(file, await zip.generateAsync({ type: "nodebuffer", compression: "DEFLATE" }));
}

(async () => {
  const BG = "image/png;base64," + (await background()).toString("base64");
  const SEAL = await seal();
  const ORN = await ornaments(LAY.rule);
  const LOGO_W = "image/png;base64," + fs.readFileSync(img("logo_westhill_blanco.png")).toString("base64");
  const LR = 757 / 1878;

  const LOGO_C = "image/png;base64," + fs.readFileSync(img("logo_westhill_color.png")).toString("base64");
  const tx = (text, o) => ({ text: { text, options: { margin: 0, valign: "middle", fontFace: F.reg, ...o } } });
  function masterObjects() {
    const sealObj = { image: { data: SEAL, x: LAY.cx - 1.05, y: 5.68, w: 2.1, h: 2.1 } };
    const lockup = (x, y, w, color, align = "right", big = 17, small = 15) => [
      tx("WESTHILL", { x, y, w, h: 0.3, fontSize: small, color, align, charSpacing: 2 }),
      tx("MEDICAL LEADERSHIP", { x, y: y + 0.26, w, h: 0.32, fontFace: F.xb, fontSize: big, color, align }),
      tx("SUMMIT 2026", { x, y: y + 0.56, w, h: 0.3, fontSize: small, color, align }),
    ];
    if (MARCO === "banda") return [
      { image: { data: LOGO_W, x: 0.55, y: 0.18, w: 2.2, h: 2.2 * LR } }, sealObj,
      { text: { text: "FACULTAD DE MEDICINA", options: { shape: "roundRect", rectRadius: 0.2, x: W / 2 - 1.65, y: 1.13, w: 3.3, h: 0.4, fill: { color: "FFFFFF" }, line: { color: HEX.gold, width: 1.75 }, shadow: { type: "outer", color: HEX.navy, opacity: 0.18, blur: 6, offset: 2, angle: 90 }, fontFace: F.xb, fontSize: 10.5, color: HEX.blue, align: "center", valign: "middle", charSpacing: 3, margin: 0 } } },
      ...lockup(6.6, 0.12, 3.9, "FFFFFF", "right", 16, 13),
      tx("21, 22 y 23 de octubre de 2026  ·  Facultad de Medicina", { x: 3, y: 8.2, w: 5, h: 0.24, fontFace: F.semi, fontSize: 9.5, color: "FFFFFF", align: "center", charSpacing: 1 }),
      tx("#SOMOSWESTHILL", { x: 8.3, y: 8.2, w: 2.2, h: 0.24, fontFace: F.xb, fontSize: 10, color: HEX.gold, align: "right", charSpacing: 1.5 }),
    ];
    if (MARCO === "centrado") return [
      { image: { data: LOGO_C, x: W / 2 - 1.3, y: 0.5, w: 2.6, h: 2.6 * 313 / 779 } }, sealObj,
      tx("#SOMOSWESTHILL", { x: 8.0, y: 7.75, w: 2.35, h: 0.24, fontFace: F.xb, fontSize: 10, color: HEX.blue, align: "right", charSpacing: 1.5 }),
    ];
    if (MARCO === "panel") return [
      { image: { data: LOGO_W, x: 0.2, y: 0.5, w: 2.3, h: 2.3 * LR } }, sealObj,
      tx("WESTHILL", { x: 0.1, y: 2.8, w: 2.5, h: 0.3, fontSize: 13, color: "FFFFFF", align: "center", charSpacing: 2 }),
      tx("MEDICAL\nLEADERSHIP", { x: 0.1, y: 3.1, w: 2.5, h: 0.72, fontFace: F.xb, fontSize: 19, color: "FFFFFF", align: "center", lineSpacingMultiple: 0.95 }),
      tx("SUMMIT 2026", { x: 0.1, y: 3.86, w: 2.5, h: 0.3, fontSize: 13, color: "FFFFFF", align: "center" }),
      tx("21, 22 y 23 de octubre\nde 2026", { x: 0.1, y: 4.5, w: 2.5, h: 0.5, fontFace: F.semi, fontSize: 11, color: "FFFFFF", align: "center" }),
      tx("Facultad de Medicina", { x: 0.1, y: 5.0, w: 2.5, h: 0.26, fontFace: F.med, fontSize: 10, color: HEX.sky, align: "center" }),
      tx("#SOMOSWESTHILL", { x: 0.1, y: 7.95, w: 2.4, h: 0.24, fontFace: F.xb, fontSize: 10, color: HEX.gold, align: "center", charSpacing: 1.5 }),
    ];
    return [
      { image: { data: LOGO_W, x: 0.46, y: 0.36, w: 2.45, h: 2.45 * LR } }, sealObj,
      ...lockup(6.05, 0.86, 3.5, HEX.blue),
      { rect: { x: 9.0, y: 1.8, w: 0.55, h: 0.05, fill: { color: HEX.green }, line: { type: "none" } } },
      tx("#SOMOSWESTHILL", { x: 8.55, y: 7.98, w: 2.2, h: 0.26, fontFace: F.xb, fontSize: 10, color: "FFFFFF", charSpacing: 1.5, align: "right" }),
    ];
  }

  function newDeck(title) {
    const pres = new pptxgen();
    pres.defineLayout({ name: "CARTA", width: W, height: H });
    pres.layout = "CARTA";
    pres.title = title;
    pres.author = "Universidad Westhill · Facultad de Medicina";
    pres.company = "Universidad Westhill";
    pres.theme = { headFontFace: F.xb, bodyFontFace: F.reg };
    pres.defineSlideMaster({
      title: "Certificado",
      background: { data: BG },
      objects: masterObjects(),
    });
    return pres;
  }
  const t = (s, txt, o) => s.addText(txt, { margin: 0, isTextBox: true, fontFace: F.reg, align: "center", valign: "middle", ...o });

  function certificate(pres, { titulo, sub, otorga, nombre, cuerpo, folio }) {
    const s = pres.addSlide({ masterName: "Certificado" });
    const { cx, tw } = LAY, at = (w) => cx - w / 2;
    const kicker = MARCO === "centrado" ? "WESTHILL MEDICAL LEADERSHIP SUMMIT 2026  ·  FACULTAD DE MEDICINA" : "FACULTAD DE MEDICINA";
    if (MARCO !== "banda") t(s, kicker, { x: at(8.4), y: 1.68, w: 8.4, h: 0.26, fontFace: F.semi, fontSize: 10.5, color: HEX.muted, charSpacing: MARCO === "centrado" ? 2 : 3 });
    const long = titulo.length > 11, panel = MARCO === "panel";
    t(s, titulo, { x: at(tw), y: 1.9, w: tw, h: 0.85, fontFace: F.xb, fontSize: long ? (panel ? 38 : 42) : 50, color: HEX.blue, charSpacing: long ? (panel ? 3 : 4) : panel ? 5 : 8 });
    s.addImage({ data: ORN.left, x: cx - 1.95 - 1.5, y: 2.89, w: 1.5, h: 0.2 });
    s.addImage({ data: ORN.right, x: cx + 1.95, y: 2.89, w: 1.5, h: 0.2 });
    t(s, sub, { x: at(3.8), y: 2.8, w: 3.8, h: 0.36, fontFace: F.xb, fontSize: 15, color: HEX.navy, charSpacing: 5 });
    t(s, otorga, { x: at(7), y: 3.32, w: 7, h: 0.3, fontFace: F.med, fontSize: 12.5, color: HEX.muted });
    const k = tw / 8.6, fsz = Math.min(38, Math.floor((38 * 26 * k) / Math.max(26 * k, nombre.length)));
    t(s, nombre, { x: at(tw), y: 3.62, w: tw, h: 0.78, fontFace: F.xb, fontSize: fsz, color: HEX.navy });
    s.addImage({ data: ORN.name, x: at(LAY.rule), y: 4.36, w: LAY.rule, h: 0.22 });
    t(s, cuerpo, { x: at(LAY.body), y: 4.6, w: LAY.body, h: 0.98, fontSize: 11.5, color: "2B3A4E", lineSpacingMultiple: 1.12, valign: "top" });
    t(s, LUGAR_FECHA, { x: at(6), y: 5.6, w: 6, h: 0.26, fontFace: F.semi, fontSize: 10.5, color: HEX.blue });
    for (const [i, [n, cargo]] of FIRMAS.entries()) {
      const sx = LAY.sig[i], sw = LAY.sigW;
      s.addShape("line", { x: sx - sw / 2, y: 6.78, w: sw, h: 0, line: { color: HEX.navy, width: 1 } });
      t(s, n, { x: sx - 1.6, y: 6.84, w: 3.2, h: 0.26, fontFace: F.xb, fontSize: 11, color: HEX.navy });
      t(s, cargo, { x: sx - 1.7, y: 7.09, w: 3.4, h: 0.24, fontFace: F.med, fontSize: panel ? 8.5 : 9, color: HEX.muted });
    }
    const fol = MARCO === "banda" ? { x: 0.5, y: 8.2, w: 2.5, h: 0.24, color: HEX.sky, align: "left" }
      : MARCO === "centrado" ? { x: 0.65, y: 7.75, w: 2.6, h: 0.24, color: "8A99AB", align: "left" }
      : { x: cx - 1.5, y: 8.06, w: 3, h: 0.2, color: "8A99AB" };
    t(s, `Folio: ${folio}`, { ...fol, fontFace: F.semi, fontSize: 8, charSpacing: 1 });
    return s;
  }

  const bold = (txt) => ({ text: txt, options: { fontFace: F.xb, color: HEX.navy } });
  const reg = (txt) => ({ text: txt });
  const cuerpoParticipante = [reg("Por su asistencia y participación en el "), bold(EVENTO), reg(` «${LEMA}», ${CUANDO}.`)];
  const cuerpoPonente = (ponencia) => ponencia === "Mesa redonda"
    ? [reg("Por su valiosa participación en la "), bold("Mesa redonda"), reg(" del "), bold(EVENTO), reg(`, ${CUANDO}.`)]
    : [reg("Por su valiosa participación como ponente con la conferencia "), bold(`«${ponencia}»`), reg(" en el "), bold(EVENTO), reg(`, ${CUANDO}.`)];
  const PART = { titulo: "CERTIFICADO", sub: "DE PARTICIPACIÓN", otorga: "Otorga el presente certificado a" };
  const PON = { titulo: "RECONOCIMIENTO", sub: "COMO PONENTE", otorga: "Otorga el presente reconocimiento a" };

  // Plantillas + reconocimientos de ponentes
  let pres = newDeck("Certificados · " + EVENTO);
  certificate(pres, { ...PART, nombre: "Nombre del Participante", cuerpo: cuerpoParticipante, folio: "WMLS-2026-P000" });
  certificate(pres, { ...PON, nombre: "Nombre del Ponente", cuerpo: cuerpoPonente("Título de la ponencia"), folio: "WMLS-2026-R000" });
  PONENTES.forEach(([n, p], i) => certificate(pres, { ...PON, nombre: n, cuerpo: cuerpoPonente(p), folio: `WMLS-2026-R${String(i + 1).padStart(3, "0")}` }));
  let out = process.env.OUT || path.join(DIR, "Certificados_Medical_Leadership_Summit_2026.pptx");
  await pres.writeFile({ fileName: out });
  await fixPackage(out);
  console.log("Listo:", out);

  // Lote opcional de participantes
  const lista = path.join(DIR, "participantes.txt");
  if (fs.existsSync(lista)) {
    const nombres = fs.readFileSync(lista, "utf8").split(/\r?\n/).map((x) => x.trim()).filter(Boolean);
    pres = newDeck("Certificados de participación · " + EVENTO);
    nombres.forEach((n, i) => certificate(pres, { ...PART, nombre: n, cuerpo: cuerpoParticipante, folio: `WMLS-2026-P${String(i + 1).padStart(3, "0")}` }));
    out = path.join(DIR, "Certificados_participantes.pptx");
    await pres.writeFile({ fileName: out });
    await fixPackage(out);
    console.log("Listo:", out, `(${nombres.length} certificados)`);
  }
})().catch((e) => { console.error(e); process.exit(1); });
