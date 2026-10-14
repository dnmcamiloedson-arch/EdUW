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
const ESQUINAS = process.env.ESQUINAS || "ondas"; // carta horizontal, arte a 300 ppp
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
    rosette(1650, 1300, 96, 36, 52, 6.4, 5200), rosette(1650, 1300, 80, 30, 46, 6.6, 4400), rosette(1650, 1300, 70, 21, 30, 5.2, 4200),
  ].map((d, i) => `<path d="${d}" fill="none" stroke="#2F6FAE" stroke-opacity="${[0.05, 0.04, 0.045][i]}" stroke-width="2"/>`).join("");
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
  <ellipse cx="${w / 2}" cy="${h * 0.52}" rx="${w * 0.45}" ry="${h * 0.42}" fill="url(#glow)"/>
  <g clip-path="url(#inner)">${watermark}
    <image x="${(w - bw) / 2}" y="${X(4.05) - bh / 2}" width="${bw}" height="${bh}" opacity="0.045" xlink:href="data:image/png;base64,${bldBlue.toString("base64")}"/>
    ${dots(290, 930, 4, 6, 34, 5.5, "#3A7BC0", 0.4)}${dots(2905, 1450, 4, 6, 34, 5.5, "#3A7BC0", 0.4)}
  </g>
  <!-- esquinas libres (arriba a la derecha y abajo a la izquierda), en diagonal con las olas -->
  ${cornerArt(w, 0, -1, 1, "tr")}${cornerArt(0, h, 1, -1, "bl")}
  <!-- olas -->
  ${wave(1.15)}
  <g transform="translate(${w},${h}) scale(-1,-1)">${wave(0.78)}</g>
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
  const LOGO_W = "image/png;base64," + fs.readFileSync(img("logo_westhill_blanco.png")).toString("base64");
  const LR = 757 / 1878;

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
      objects: [
        { image: { data: LOGO_W, x: 0.46, y: 0.36, w: 2.45, h: 2.45 * LR } },
        { image: { data: SEAL, x: W / 2 - 1.05, y: 5.68, w: 2.1, h: 2.1 } },
        { text: { text: "WESTHILL", options: { x: 6.05, y: 0.86, w: 3.5, h: 0.3, fontFace: F.reg, fontSize: 15, color: HEX.blue, align: "right", charSpacing: 2, margin: 0 } } },
        { text: { text: "MEDICAL LEADERSHIP", options: { x: 6.05, y: 1.12, w: 3.5, h: 0.32, fontFace: F.xb, fontSize: 17, color: HEX.blue, align: "right", margin: 0 } } },
        { text: { text: "SUMMIT 2026", options: { x: 6.05, y: 1.42, w: 3.5, h: 0.3, fontFace: F.reg, fontSize: 15, color: HEX.blue, align: "right", margin: 0 } } },
        { rect: { x: 9.0, y: 1.8, w: 0.55, h: 0.05, fill: { color: HEX.green }, line: { type: "none" } } },
        { text: { text: "#SOMOSWESTHILL", options: { x: 8.55, y: 7.98, w: 2.2, h: 0.26, fontFace: F.xb, fontSize: 10, color: "FFFFFF", charSpacing: 1.5, align: "right", margin: 0 } } },
      ],
    });
    return pres;
  }
  const t = (s, txt, o) => s.addText(txt, { margin: 0, isTextBox: true, fontFace: F.reg, align: "center", valign: "middle", ...o });

  function certificate(pres, { titulo, sub, otorga, nombre, cuerpo, folio }) {
    const s = pres.addSlide({ masterName: "Certificado" });
    t(s, "FACULTAD DE MEDICINA", { x: 3.5, y: 1.68, w: 4, h: 0.26, fontFace: F.semi, fontSize: 10.5, color: HEX.muted, charSpacing: 3 });
    t(s, titulo, { x: 1.5, y: 1.9, w: 8, h: 0.85, fontFace: F.xb, fontSize: titulo.length > 11 ? 42 : 50, color: HEX.blue, charSpacing: titulo.length > 11 ? 4 : 8 });
    s.addShape("rect", { x: 2.55, y: 2.96, w: 1.0, h: 0.06, fill: { color: HEX.green }, line: { type: "none" } });
    s.addShape("rect", { x: W - 2.55 - 1.0, y: 2.96, w: 1.0, h: 0.06, fill: { color: HEX.green }, line: { type: "none" } });
    t(s, sub, { x: 3.6, y: 2.8, w: 3.8, h: 0.36, fontFace: F.xb, fontSize: 15, color: HEX.navy, charSpacing: 5 });
    t(s, otorga, { x: 2, y: 3.32, w: 7, h: 0.3, fontFace: F.med, fontSize: 12.5, color: HEX.muted });
    const fsz = Math.min(38, Math.floor((38 * 26) / Math.max(26, nombre.length)));
    t(s, nombre, { x: 1.2, y: 3.62, w: 8.6, h: 0.78, fontFace: F.xb, fontSize: fsz, color: HEX.navy });
    s.addShape("line", { x: 2.4, y: 4.47, w: 6.2, h: 0, line: { color: HEX.gold, width: 1.75 } });
    s.addShape("ellipse", { x: W / 2 - 0.06, y: 4.41, w: 0.12, h: 0.12, fill: { color: HEX.gold }, line: { type: "none" } });
    t(s, cuerpo, { x: 1.55, y: 4.6, w: 7.9, h: 0.98, fontSize: 11.5, color: "2B3A4E", lineSpacingMultiple: 1.12, valign: "top" });
    t(s, LUGAR_FECHA, { x: 2.5, y: 5.6, w: 6, h: 0.26, fontFace: F.semi, fontSize: 10.5, color: HEX.blue });
    for (const [i, [n, cargo]] of FIRMAS.entries()) {
      const cx = i ? 8.0 : 3.0;
      s.addShape("line", { x: cx - 1.35, y: 6.78, w: 2.7, h: 0, line: { color: HEX.navy, width: 1 } });
      t(s, n, { x: cx - 1.6, y: 6.84, w: 3.2, h: 0.26, fontFace: F.xb, fontSize: 11, color: HEX.navy });
      t(s, cargo, { x: cx - 1.7, y: 7.09, w: 3.4, h: 0.24, fontFace: F.med, fontSize: 9, color: HEX.muted });
    }
    t(s, `Folio: ${folio}`, { x: W / 2 - 1.5, y: 8.06, w: 3, h: 0.2, fontFace: F.semi, fontSize: 8, color: "8A99AB", charSpacing: 1 });
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
