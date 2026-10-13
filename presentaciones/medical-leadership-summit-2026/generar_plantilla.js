// Plantilla de diapositivas "Westhill Medical Leadership Summit 2026"
// Sigue la línea gráfica del flyer oficial: ola azul con filo dorado arriba a la izquierda,
// títulos en Montserrat ExtraBold azul, resplandor celeste detrás de la foto, banda azul inferior
// con curva dorada y guiones verdes junto a la fecha. Los datos del programa vienen de
// Programa_Westhill.xlsx (ver PROGRAMA más abajo).
//
// Uso:  NODE_PATH=<carpeta>/node_modules node generar_plantilla.js
// Dependencias: pptxgenjs react react-dom react-icons sharp jszip  (+ python3 para animate.py)
const path = require("path");
const fs = require("fs");
const { execFileSync } = require("child_process");
const pptxgen = require("pptxgenjs");
const JSZip = require("jszip");
const React = require("react");
const ReactDOMServer = require("react-dom/server");
const sharp = require("sharp");
const fa = require("react-icons/fa6");

const DIR = __dirname;
const img = (f) => path.join(DIR, "img", f);
const OUT = path.join(DIR, "Plantilla_Medical_Leadership_Summit_2026.pptx");

// ---------- identidad ----------
const HEX = {
  blue: "266294", royal: "0F62AE", deep: "0A4A92", navy: "0E2A47", ink: "15243A",
  gold: "F2C94C", goldPale: "FFF4D1", green: "2DB34A", ice: "EDF3FA", sky: "CFE6FB", muted: "5B6B7D", white: "FFFFFF", line: "DCE6F2",
};
const F = { reg: "Montserrat", med: "Montserrat Medium", semi: "Montserrat SemiBold", xb: "Montserrat ExtraBold" };
const W = 13.333, H = 7.5, M = 0.6, P = 200; // P = px por pulgada en el arte generado
const px = (v) => Math.round(v * P);

// ---------- programa (Programa_Westhill.xlsx) ----------
const PROGRAMA = [
  {
    dia: "Miércoles 21 de octubre", corto: "Mié 21 oct", fin: "12:30",
    filas: [
      ["08:00", "08:30", "Ceremonia de apertura", ""],
      ["08:30", "09:00", "Cirugía en el mundo real: visión de un experto", "Dr. Juan Manuel Ruiz Molina"],
      ["09:00", "09:30", "Enfermedad por reflujo gastroesofágico", "Dr. Norberto Ruiz Molina"],
      ["09:30", "10:30", "Coffee break", ""],
      ["10:30", "11:00", "Actividad de patrocinadores", ""],
      ["11:00", "11:30", "Sintomatología del tracto urinario inferior", ""],
      ["11:30", "12:00", "Cómo presentarse a la vida como médico en redes sociales", ""],
      ["12:00", "12:30", "¿Qué pasa después de la carrera?", "Dr. Alan"],
    ],
  },
  {
    dia: "Jueves 22 de octubre", corto: "Jue 22 oct", fin: "14:30",
    filas: [
      ["09:00", "09:30", "Imagenología", ""],
      ["09:30", "10:00", "Electrofisiología: electromiografía en la clínica y en la práctica", ""],
      ["10:00", "10:30", "Leadership in Healthcare: Leading High-Performance Medical Teams", "Dr. César Escalante"],
      ["10:30", "11:30", "Coffee break", ""],
      ["11:30", "12:00", "Anemias y leucemias", "Dra. Guadalupe Rodríguez · Jefa de Hematología, La Raza"],
      ["12:00", "12:30", "Agonistas de GLP-1: un viaje a través del tiempo", ""],
      ["12:30", "13:00", "Nutrición clínica", "Dr. Samuel Alejandro Zimbrón"],
      ["13:00", "13:30", "AMIR", "Dra. Iris y Dr. Jorge Macías"],
      ["13:30", "14:00", "Interpretación rápida del paciente pediátrico: el ABCDE y el Triángulo de Evaluación Pediátrica", ""],
      ["14:00", "14:30", "Importancia del tamiz neonatal como factor preventivo de enfermedades metabólicas congénitas", ""],
    ],
  },
  {
    dia: "Viernes 23 de octubre", corto: "Vie 23 oct", fin: "13:00",
    filas: [
      ["08:00", "08:30", "Antonio Chimal", ""],
      ["08:30", "09:00", "Oncología para el médico interno de pregrado", ""],
      ["09:00", "09:30", "Hacks del ECG patológico", ""],
      ["09:30", "10:00", "Actividad de patrocinadores", ""],
      ["10:00", "11:00", "Coffee break", ""],
      ["11:00", "11:30", "Atención Primaria de la Salud y Cobertura Universal en Salud, el nuevo paradigma en la formación médica", ""],
      ["11:30", "12:00", "Cómo usar la IA sin dejar de pensar clínicamente", ""],
      ["12:00", "12:30", "Mesa redonda", "Dr. Asisclo"],
      ["12:30", "13:00", "Ceremonia de cierre", ""],
    ],
  },
];
const LEMA = "Fronteras de la Medicina: actualización clínica y nuevas perspectivas en la práctica médica";

const dataOf = (file) => {
  const ext = path.extname(file).toLowerCase();
  return `image/${ext === ".png" ? "png" : "jpeg"};base64,` + fs.readFileSync(file).toString("base64");
};
async function svgTo(svg, fmt = "png") {
  let s = sharp(Buffer.from(svg));
  s = fmt === "jpeg" ? s.jpeg({ quality: 90 }) : s.png();
  return `image/${fmt};base64,` + (await s.toBuffer()).toString("base64");
}

// ---------- piezas de arte (SVG) ----------
const dots = (x0, y0, cols, rows, gap, r, color, op = 1) => {
  let s = "";
  for (let i = 0; i < cols; i++) for (let j = 0; j < rows; j++) s += `<circle cx="${x0 + i * gap}" cy="${y0 + j * gap}" r="${r}" fill="${color}" opacity="${op}"/>`;
  return s;
};
const contours = (color, op, ox = 0, oy = 0) => {
  let s = "";
  for (let i = 0; i < 7; i++) s += `<path d="M${ox + 1880 + i * 38},${oy} C${ox + 2120 + i * 30},${oy + 210 + i * 22} ${ox + 2380},${oy + 130 + i * 36} ${ox + 2700},${oy + 400 + i * 32}" fill="none" stroke="${color}" stroke-opacity="${op}" stroke-width="2.2"/>`;
  return s;
};
// Ola superior izquierda: base plana bajo el logo que sube en curva hacia la derecha,
// un brillo interior y un filo dorado separado por una línea blanca (como en el flyer).
// Con k = 1 cubre 4.6" de ancho y 1.65" de alto en el borde izquierdo.
function wave(k, fill = "url(#wb)", shine = true) {
  const p = (pts) => pts.map((v) => (v * k).toFixed(1));
  const [a, b, c, d, e, f, g, h, i, j, l, m] = p([920, 760, 150, 640, 290, 300, 310, 150, 318, 60, 322, 330]);
  const s = 1.075, [ga, gb, gc, gd, ge, gf, gg, gh, gi, gj, gl, gm] = p([920, 760, 150, 640, 290, 300, 310, 150, 318, 60, 322, 330].map((v) => v * s));
  return `<path d="M0,0 H${a} C${b},${c} ${d},${e} ${f},${g} C${h},${i} ${j},${l} 0,${m} Z" fill="${fill}"/>` +
    (shine ? `<path d="M0,0 H${700 * k} C${560 * k},${110 * k} ${430 * k},${190 * k} 0,${215 * k} Z" fill="#FFFFFF" fill-opacity="0.07"/>` : "") +
    `<path d="M${ga},-4 C${gb},${gc} ${gd},${ge} ${gf},${gg} C${gh},${gi} ${gj},${gl} -4,${gm}" fill="none" stroke="#F2C94C" stroke-width="${(11 * k).toFixed(1)}" stroke-linecap="round"/>`;
}
const DEFS = `
  <linearGradient id="wb" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#2F7CC0"/><stop offset="1" stop-color="#174A86"/></linearGradient>
  <linearGradient id="band" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#${HEX.royal}"/><stop offset="1" stop-color="#${HEX.deep}"/></linearGradient>
  <linearGradient id="full" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#1769B5"/><stop offset="1" stop-color="#0A3A73"/></linearGradient>
  <radialGradient id="glow" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stop-color="#C4E1FB"/><stop offset="0.55" stop-color="#DCEEFD" stop-opacity="0.75"/><stop offset="1" stop-color="#FFFFFF" stop-opacity="0"/></radialGradient>
  <radialGradient id="glowW" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stop-color="#FFFFFF" stop-opacity="0.22"/><stop offset="1" stop-color="#FFFFFF" stop-opacity="0"/></radialGradient>`;
const svg = (body) => `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${px(W)}" height="${px(H)}"><defs>${DEFS}</defs>${body}</svg>`;

const BAND_TOP = 1150; // px: inicio de la banda azul de la portada (5.75")
const KC = 1.25;       // escala de la ola en portada, ponencia y cierre

async function art() {
  const A = {};
  // Portada / ponencia: ola, resplandor a la derecha, banda azul con curva dorada
  const coverArt = (leftDots) => svgTo(svg(`
    <rect width="100%" height="100%" fill="#fff"/>${contours("#C9D6E4", 0.55)}
    <ellipse cx="1930" cy="700" rx="980" ry="760" fill="url(#glow)"/>
    ${dots(2330, 70, 9, 4, 30, 4.5, "#3A7BC0", 0.75)}${leftDots ? dots(48, 950, 5, 5, 30, 4.5, "#3A7BC0", 0.6) : ""}
    ${wave(KC)}
    <path d="M0,${BAND_TOP + 18} C700,${BAND_TOP - 10} 1700,${BAND_TOP + 22} 2667,${BAND_TOP - 6} V1500 H0 Z" fill="url(#band)"/>
    <path d="M-10,1472 C700,1405 1700,1452 2680,1362" fill="none" stroke="#F2C94C" stroke-width="9"/>`), "jpeg");
  A.cover = await coverArt(true);
  A.talk = await coverArt(false);
  // Sección: azul profundo, foto del campus recortada en curva con filo dorado
  const campus = await sharp(img("edificio_principal.jpg")).extract({ left: 0, top: 600, width: 1179, height: 1100 }).jpeg({ quality: 88 }).toBuffer();
  A.section = await svgTo(svg(`
    <rect width="100%" height="100%" fill="url(#full)"/>
    <ellipse cx="300" cy="250" rx="1100" ry="800" fill="url(#glowW)"/>
    ${contours("#FFFFFF", 0.07, -1700, 900)}
    <clipPath id="cp"><path d="M1760,0 C1500,480 1720,1020 1500,1500 H2667 V0 Z"/></clipPath>
    <image clip-path="url(#cp)" x="1450" y="0" width="1217" height="1500" preserveAspectRatio="xMidYMid slice" xlink:href="data:image/jpeg;base64,${campus.toString("base64")}"/>
    <path d="M1760,0 C1500,480 1720,1020 1500,1500" fill="none" stroke="#F2C94C" stroke-width="16"/>
    ${dots(1330, 120, 4, 5, 30, 4.5, "#FFFFFF", 0.35)}
    <path d="M-10,1440 C450,1380 1000,1420 1520,1330" fill="none" stroke="#F2C94C" stroke-width="7"/>`), "jpeg");
  // Contenido: blanco, ola con logo, banda inferior delgada con filo dorado
  A.content = await svgTo(svg(`
    <rect width="100%" height="100%" fill="#fff"/>${contours("#D5DEE9", 0.45, 120, -60)}
    ${dots(2420, 46, 7, 3, 26, 4, "#3A7BC0", 0.55)}
    ${wave(1)}
    <path d="M0,1424 C800,1404 1900,1436 2667,1384" fill="none" stroke="#F2C94C" stroke-width="7"/>
    <path d="M0,1436 C800,1416 1900,1448 2667,1396 V1500 H0 Z" fill="url(#band)"/>`), "jpeg");
  // Cierre / receso: fondo azul, ola blanca con filo dorado para el logo a color
  A.closing = await svgTo(svg(`
    <rect width="100%" height="100%" fill="url(#full)"/>
    <ellipse cx="1333" cy="820" rx="1300" ry="700" fill="url(#glowW)"/>
    ${contours("#FFFFFF", 0.08)}
    ${dots(2330, 1140, 9, 3, 30, 4.5, "#FFFFFF", 0.35)}
    ${wave(KC, "#FFFFFF", false)}
    <path d="M-10,1452 C700,1372 1700,1425 2680,1330" fill="none" stroke="#F2C94C" stroke-width="9"/>
    <path d="M-10,1478 C700,1398 1700,1451 2680,1356" fill="none" stroke="#F2C94C" stroke-opacity="0.45" stroke-width="4"/>`), "jpeg");
  return A;
}

// ---------- tarjetas, íconos y fotos ----------
function iconSvg(name, hex) {
  if (!fa[name]) throw new Error(`Ícono desconocido: ${name}`);
  return ReactDOMServer.renderToStaticMarkup(React.createElement(fa[name], { color: "#" + hex }));
}
const CARD = {
  light: { stops: ["#FFFFFF", "#FFFFFF"], stroke: "#DCE6F2" },
  ice: { stops: ["#F4F9FE", "#E6F1FC"], stroke: "#D3E4F5" },
  dark: { stops: ["#1E6DB8", "#0B3F7E"], stroke: "rgba(255,255,255,0.12)", glow: "rgba(150,205,255,0.45)" },
  gold: { stops: ["#FADF85", "#E8B530"], stroke: "rgba(255,255,255,0.4)", glow: "rgba(255,255,255,0.5)" },
};
async function cardArt(w, h, style, r = 0.18, dashed = false) {
  const s = CARD[style], pw = Math.round(w * 150), ph = Math.round(h * 150), pr = Math.round(r * 150);
  const g = s.glow ? `<radialGradient id="g" cx="0.92" cy="0.05" r="0.75"><stop offset="0" stop-color="${s.glow}"/><stop offset="1" stop-color="rgba(0,0,0,0)"/></radialGradient>` : "";
  const stroke = dashed ? `stroke="#9DBBDB" stroke-width="3" stroke-dasharray="14 10"` : `stroke="${s.stroke}" stroke-width="3"`;
  return svgTo(`<svg xmlns="http://www.w3.org/2000/svg" width="${pw}" height="${ph}"><defs>
    <linearGradient id="l" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${s.stops[0]}"/><stop offset="1" stop-color="${s.stops[1]}"/></linearGradient>${g}
    <clipPath id="c"><rect width="${pw}" height="${ph}" rx="${pr}"/></clipPath></defs>
    <g clip-path="url(#c)"><rect width="${pw}" height="${ph}" fill="url(#l)"/>${s.glow ? `<rect width="${pw}" height="${ph}" fill="url(#g)"/>` : ""}</g>
    <rect x="1.5" y="1.5" width="${pw - 3}" height="${ph - 3}" rx="${pr - 1}" fill="none" ${stroke}/></svg>`);
}
const BADGE = { blue: ["#4A93D2", "#1F5585", "FFFFFF"], gold: ["#FBE08A", "#E3AC25", "0E2A47"], white: ["#FFFFFF", "#E6EEF8", "266294"], ice: ["#EAF3FC", "#CFE2F5", "266294"] };
async function badgeArt(name, style, ratio = 0.46) {
  const [a, b, ic] = BADGE[style], S = 300, is = Math.round(S * ratio), o = (S - is) / 2;
  const inner = iconSvg(name, ic).replace(/height="1em" width="1em"/, `x="${o}" y="${o}" width="${is}" height="${is}"`);
  return svgTo(`<svg xmlns="http://www.w3.org/2000/svg" width="${S}" height="${S}"><defs>
    <linearGradient id="b" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient>
    <radialGradient id="h" cx="0.3" cy="0.2" r="0.6"><stop offset="0" stop-color="rgba(255,255,255,0.35)"/><stop offset="1" stop-color="rgba(255,255,255,0)"/></radialGradient></defs>
    <circle cx="150" cy="150" r="148" fill="url(#b)"/><circle cx="150" cy="150" r="148" fill="url(#h)"/>
    <circle cx="150" cy="150" r="146" fill="none" stroke="rgba(255,255,255,0.35)" stroke-width="3"/>${inner}</svg>`);
}
// Avatar cuadrado (ícono sobre fondo hielo); se inserta con rounding:true para que se vea circular
// y que "Cambiar imagen" conserve el recorte circular.
async function avatarArt() {
  const S = 400, is = 210, o = (S - is) / 2;
  const inner = iconSvg("FaUserDoctor", "6F9CCB").replace(/height="1em" width="1em"/, `x="${o}" y="${o + 20}" width="${is}" height="${is}"`);
  return svgTo(`<svg xmlns="http://www.w3.org/2000/svg" width="${S}" height="${S}"><defs>
    <linearGradient id="b" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#F1F7FD"/><stop offset="1" stop-color="#D3E5F6"/></linearGradient></defs>
    <rect width="${S}" height="${S}" fill="url(#b)"/>${inner}</svg>`);
}
const iconArt = (name, hex) => svgTo(iconSvg(name, hex).replace(/height="1em" width="1em"/, 'height="256" width="256"'));
async function crop(file, aspect, focus = [0.5, 0.5], radius = 0) {
  const meta = await sharp(file).metadata();
  let cw = meta.width, ch = Math.round(cw / aspect);
  if (ch > meta.height) { ch = meta.height; cw = Math.round(ch * aspect); }
  const left = Math.round((meta.width - cw) * focus[0]), top = Math.round((meta.height - ch) * focus[1]);
  let s = sharp(file).extract({ left, top, width: cw, height: ch }).flatten({ background: "#FFFFFF" }).png();
  if (radius) {
    const r = Math.round(Math.min(cw, ch) * radius);
    s = sharp(await s.toBuffer()).composite([{ input: Buffer.from(`<svg width="${cw}" height="${ch}"><rect width="${cw}" height="${ch}" rx="${r}" fill="#fff"/></svg>`), blend: "dest-in" }]).png();
  }
  return "image/png;base64," + (await s.toBuffer()).toString("base64");
}

// ---------- post-proceso del .pptx ----------
async function applyTheme(zip) {
  const colors = { dk1: HEX.ink, lt1: HEX.white, dk2: HEX.navy, lt2: HEX.ice, accent1: HEX.blue, accent2: HEX.gold, accent3: HEX.royal, accent4: HEX.green, accent5: HEX.deep, accent6: HEX.muted, hlink: HEX.royal, folHlink: HEX.deep };
  for (const name of Object.keys(zip.files).filter((n) => /^ppt\/theme\/theme\d+\.xml$/.test(n))) {
    let xml = await zip.file(name).async("string");
    for (const [k, v] of Object.entries(colors)) xml = xml.replace(new RegExp(`<a:${k}>[\\s\\S]*?</a:${k}>`), `<a:${k}><a:srgbClr val="${v}"/></a:${k}>`);
    xml = xml.replace(/(<a:majorFont>\s*<a:latin typeface=")[^"]*"/, `$1${F.xb}"`);
    xml = xml.replace(/(<a:minorFont>\s*<a:latin typeface=")[^"]*"/, `$1${F.reg}"`);
    xml = xml.replace(/<a:clrScheme name="[^"]*"/, '<a:clrScheme name="Westhill Medical Summit"');
    zip.file(name, xml);
  }
}
// pptxgenjs nombra el fondo de cada diseño con el título del diseño; con acentos ("Sección",
// "Título y contenido") el archivo queda con un nombre distinto al de la relación y PowerPoint
// pide reparar el archivo (y pierde el fondo). Aquí se renombra cada imagen a ASCII con la
// extensión correcta según su contenido, se corrigen las relaciones y se quitan las entradas
// [Content_Types] de partes que no existen.
async function fixPackage(zip) {
  const decode = (n) => n.replace(/#U([0-9a-fA-F]{4})/g, (_, h) => String.fromCharCode(parseInt(h, 16)));
  const ren = {};
  let n = 0;
  for (const name of Object.keys(zip.files).filter((f) => f.startsWith("ppt/media/") && !zip.files[f].dir)) {
    const buf = await zip.file(name).async("nodebuffer");
    const ext = buf[0] === 0xff && buf[1] === 0xd8 ? "jpeg" : buf[0] === 0x89 && buf[1] === 0x50 ? "png" : path.extname(name).slice(1);
    const base = path.basename(name), clean = decode(base);
    const ok = /^[A-Za-z0-9._-]+$/.test(base) && base.endsWith("." + ext);
    if (ok) continue;
    const nn = `fondo-${++n}.${ext}`;
    ren[base] = nn; ren[clean] = nn; ren[encodeURI(clean)] = nn;
    zip.remove(name);
    zip.file("ppt/media/" + nn, buf);
  }
  for (const name of Object.keys(zip.files).filter((f) => f.endsWith(".rels"))) {
    let xml = await zip.file(name).async("string"), changed = false;
    xml = xml.replace(/Target="\.\.\/media\/([^"]+)"/g, (all, t) => (ren[t] ? ((changed = true), `Target="../media/${ren[t]}"`) : all));
    if (changed) zip.file(name, xml);
  }
  let ct = await zip.file("[Content_Types].xml").async("string");
  ct = ct.replace(/<Override PartName="\/([^"]+)"[^>]*\/>/g, (all, p) => (zip.file(p) ? all : ""));
  zip.file("[Content_Types].xml", ct);
}
// pptxgenjs no escribe type="pic" en los marcadores de imagen (solo title/body), así que se
// agrega aquí a los marcadores sin tipo de diseños y diapositivas; el de "Portada de ponencia"
// además se vuelve circular.
async function picPlaceholders(zip) {
  const files = Object.keys(zip.files).filter((n) => /^ppt\/(slideLayouts\/slideLayout|slides\/slide)\d+\.xml$/.test(n));
  files.sort((x, y) => (x.includes("Layout") ? 0 : 1) - (y.includes("Layout") ? 0 : 1)); // diseños primero
  const roundIdx = new Set();
  for (const name of files) {
    const xml = await zip.file(name).async("string");
    const isRoundLayout = xml.includes('<p:cSld name="Portada de ponencia"');
    const out = xml.replace(/<p:(sp|pic)>[\s\S]*?<\/p:\1>/g, (el) => {
      const m = el.match(/<p:ph\s+idx="(\d+)"/);
      if (!m || /<p:ph[^>]*\btype="/.test(el)) return el;
      el = el.replace(/<p:ph\s+idx=/, '<p:ph type="pic" idx=');
      if (isRoundLayout) roundIdx.add(m[1]);
      return roundIdx.has(m[1]) ? el.replace('prst="rect"', 'prst="ellipse"') : el;
    });
    if (out !== xml) zip.file(name, out);
  }
}

(async () => {
  const A = await art();
  const pres = new pptxgen();
  pres.layout = "LAYOUT_WIDE";
  pres.title = "Westhill Medical Leadership Summit 2026";
  pres.author = "Universidad Westhill · Facultad de Medicina";
  pres.company = "Universidad Westhill";
  pres.theme = { headFontFace: F.xb, bodyFontFace: F.reg };

  const LOGO_W = dataOf(img("logo_westhill_blanco.png")), LOGO_C = dataOf(img("logo_westhill_color.png"));
  const LR = 757 / 1878, LRC = 313 / 779; // alto/ancho de cada logo
  const sh = (o = 0.12) => ({ type: "outer", color: HEX.navy, opacity: o, blur: 16, offset: 5, angle: 90 });

  // nombres de objeto con "@n~" => animación Float In en el paso n (lo procesa animate.py)
  let objN = 0, STEP = 0;
  const nm = (s) => `${STEP ? "@" + STEP + "~" : ""}${s} ${++objN}`;
  const step = (n) => { STEP = n; };

  const ph = (name, type, o, prompt) => ({ placeholder: { options: { name, type, margin: 0, ...o }, text: prompt } });
  const greenBar = (x, y, w = 1.2) => ({ rect: { x, y, w, h: 0.07, fill: { color: HEX.green }, line: { type: "none" } } });
  const footer = [
    { text: { text: "WESTHILL MEDICAL LEADERSHIP SUMMIT 2026  ·  Facultad de Medicina", options: { x: M, y: 7.22, w: 8, h: 0.24, fontFace: F.semi, fontSize: 9, color: HEX.white, charSpacing: 1, margin: 0, valign: "middle" } } },
    { text: { text: "#SOMOSWESTHILL", options: { x: W - M - 3.2, y: 7.22, w: 2.5, h: 0.24, fontFace: F.xb, fontSize: 9, color: HEX.gold, charSpacing: 1, align: "right", margin: 0, valign: "middle" } } },
  ];
  const slideNum = { x: W - M - 0.5, y: 7.22, w: 0.5, h: 0.24, fontFace: F.xb, fontSize: 10, color: HEX.white, align: "right", margin: 0 };
  // Logo de contenido: centrado en la base plana de la ola, con aire alrededor.
  const LOGO_CONTENT = { image: { data: LOGO_W, x: 0.42, y: 0.25, w: 2.1, h: 2.1 * LR } };
  const LOGO_BIG = { image: { data: LOGO_W, x: 0.42, y: 0.3, w: 2.75, h: 2.75 * LR } };
  const titlePh = ph("title", "title", { x: 5.0, y: 0.3, w: 7.73, h: 0.8, fontFace: F.xb, fontSize: 28, color: HEX.blue, valign: "middle", align: "left" }, "Título de la diapositiva");
  const subPh = ph("subtitulo", "body", { x: 5.0, y: 1.08, w: 7.73, h: 0.4, fontFace: F.med, fontSize: 14, color: HEX.muted, valign: "top" }, "Subtítulo opcional");
  const contentBase = [LOGO_CONTENT, ...footer, titlePh, subPh];

  // ---------- diseños (layouts) ----------
  pres.defineSlideMaster({
    title: "Portada",
    background: { data: A.cover },
    objects: [
      LOGO_BIG, greenBar(1.15, 6.2), greenBar(W - 1.15 - 1.2, 6.2),
      ph("antetitulo", "body", { x: 0.45, y: 2.3, w: 5.9, h: 0.6, fontFace: F.reg, fontSize: 38, color: HEX.blue, align: "center", valign: "middle", charSpacing: 1 }, "WESTHILL"),
      ph("title", "title", { x: 0.45, y: 2.88, w: 5.9, h: 1.7, fontFace: F.xb, fontSize: 54, color: HEX.blue, align: "center", valign: "middle", lineSpacingMultiple: 0.88 }, "TÍTULO DEL EVENTO"),
      ph("subtitulo", "body", { x: 0.45, y: 4.6, w: 5.9, h: 0.68, fontFace: F.reg, fontSize: 38, color: HEX.blue, align: "center", valign: "middle" }, "SUMMIT 2026"),
      ph("fecha", "body", { x: 2.45, y: 5.9, w: 8.43, h: 0.66, fontFace: F.xb, fontSize: 30, color: HEX.white, align: "center", valign: "middle" }, "FECHA DEL EVENTO"),
      ph("sede", "body", { x: 2.45, y: 6.52, w: 8.43, h: 0.42, fontFace: F.med, fontSize: 20, color: HEX.white, align: "center", valign: "middle" }, "Facultad de Medicina"),
    ],
  });
  pres.defineSlideMaster({
    title: "Portada de ponencia",
    background: { data: A.talk },
    objects: [
      LOGO_BIG, greenBar(M, 2.5, 0.6),
      { image: { data: await svgTo(`<svg xmlns="http://www.w3.org/2000/svg" width="600" height="600"><circle cx="300" cy="300" r="296" fill="#F2C94C"/><circle cx="300" cy="300" r="281" fill="#FFFFFF"/></svg>`), x: 8.72, y: 1.02, w: 4.0, h: 4.0 } },
      ph("fotoponente", "image", { x: 8.87, y: 1.17, w: 3.7, h: 3.7 }, "Foto del ponente"),
      ph("tipo", "body", { x: M + 0.75, y: 2.38, w: 6.5, h: 0.32, fontFace: F.xb, fontSize: 13, color: HEX.blue, charSpacing: 5, valign: "middle" }, "PONENCIA"),
      ph("title", "title", { x: M, y: 2.85, w: 7.6, h: 1.75, fontFace: F.xb, fontSize: 32, color: HEX.blue, align: "left", valign: "top", lineSpacingMultiple: 0.95 }, "Título de la ponencia"),
      ph("ponente", "body", { x: M, y: 4.62, w: 7.6, h: 0.48, fontFace: F.xb, fontSize: 20, color: HEX.navy, valign: "middle" }, "Nombre del ponente"),
      ph("cargo", "body", { x: M, y: 5.08, w: 7.6, h: 0.42, fontFace: F.med, fontSize: 14, color: HEX.muted, valign: "top" }, "Cargo · Institución"),
      ph("horario", "body", { x: M, y: 6.0, w: 8.2, h: 0.6, fontFace: F.xb, fontSize: 22, color: HEX.white, valign: "middle" }, "Día · horario"),
      { text: { text: "Facultad de Medicina", options: { x: W - M - 4, y: 6.0, w: 4, h: 0.6, fontFace: F.med, fontSize: 16, color: HEX.white, align: "right", valign: "middle", margin: 0 } } },
    ],
  });
  pres.defineSlideMaster({
    title: "Sección",
    background: { data: A.section },
    objects: [
      { image: { data: LOGO_W, x: M, y: 0.45, w: 2.3, h: 2.3 * LR } },
      { rect: { x: 3.2, y: 0.55, w: 0.02, h: 0.75, fill: { color: HEX.white, transparency: 50 }, line: { type: "none" } } },
      { text: { text: "MEDICAL LEADERSHIP\nSUMMIT 2026", options: { x: 3.42, y: 0.55, w: 3, h: 0.75, fontFace: F.semi, fontSize: 12, color: HEX.white, charSpacing: 2, valign: "middle", margin: 0 } } },
      greenBar(M, 3.37, 0.6),
      ph("etiqueta", "body", { x: M + 0.75, y: 3.25, w: 4, h: 0.3, fontFace: F.xb, fontSize: 13, color: HEX.white, charSpacing: 6, valign: "middle" }, "SECCIÓN"),
      ph("numero", "body", { x: M, y: 1.75, w: 4, h: 1.45, fontFace: F.xb, fontSize: 96, color: HEX.gold, align: "left", valign: "bottom" }, "01"),
      ph("title", "title", { x: M, y: 3.7, w: 6.6, h: 1.55, fontFace: F.xb, fontSize: 40, color: HEX.white, align: "left", valign: "top", lineSpacingMultiple: 0.95 }, "Título de la sección"),
      ph("subtitulo", "body", { x: M, y: 5.35, w: 6.4, h: 0.85, fontFace: F.med, fontSize: 17, color: HEX.sky, align: "left", valign: "top" }, "Frase breve que presenta la sección"),
    ],
  });
  pres.defineSlideMaster({
    title: "Título y contenido",
    background: { data: A.content }, slideNumber: slideNum,
    objects: [...contentBase, ph("cuerpo", "body", { x: M, y: 2.0, w: W - 2 * M, h: 4.8, fontFace: F.reg, fontSize: 18, color: HEX.ink, valign: "top", paraSpaceAfter: 10 }, "Escribe aquí el contenido")],
  });
  pres.defineSlideMaster({
    title: "Contenido e imagen",
    background: { data: A.content }, slideNumber: slideNum,
    objects: [
      ...contentBase,
      ph("cuerpo", "body", { x: M, y: 2.0, w: 6.1, h: 4.8, fontFace: F.reg, fontSize: 18, color: HEX.ink, valign: "top", paraSpaceAfter: 10 }, "Escribe aquí el contenido"),
      ph("imagen", "image", { x: 7.05, y: 2.0, w: 5.68, h: 4.8 }, "Inserta una imagen"),
    ],
  });
  pres.defineSlideMaster({ title: "Solo título", background: { data: A.content }, slideNumber: slideNum, objects: contentBase });
  pres.defineSlideMaster({
    title: "Receso",
    background: { data: A.closing },
    objects: [
      { image: { data: LOGO_C, x: 0.42, y: 0.3, w: 2.75, h: 2.75 * LRC } },
      { image: { data: await badgeArt("FaMugHot", "gold", 0.5), x: W / 2 - 0.65, y: 1.95, w: 1.3, h: 1.3 } },
      greenBar(2.65, 5.0), greenBar(W - 2.65 - 1.2, 5.0),
      ph("title", "title", { x: 1.5, y: 3.4, w: W - 3, h: 1.2, fontFace: F.xb, fontSize: 66, color: HEX.white, align: "center", valign: "middle" }, "COFFEE BREAK"),
      ph("regreso", "body", { x: 3.9, y: 4.73, w: W - 7.8, h: 0.6, fontFace: F.xb, fontSize: 24, color: HEX.gold, align: "center", valign: "middle" }, "Regresamos a las 00:00"),
      ph("detalle", "body", { x: 1.5, y: 5.45, w: W - 3, h: 0.45, fontFace: F.med, fontSize: 16, color: HEX.sky, align: "center", valign: "middle" }, "Día · horario del receso"),
    ],
  });
  pres.defineSlideMaster({
    title: "Cierre",
    background: { data: A.closing },
    objects: [
      { image: { data: LOGO_C, x: 0.42, y: 0.3, w: 2.75, h: 2.75 * LRC } },
      greenBar(2.65, 5.07), greenBar(W - 2.65 - 1.2, 5.07),
      ph("title", "title", { x: 1.5, y: 2.35, w: W - 3, h: 1.35, fontFace: F.xb, fontSize: 72, color: HEX.white, align: "center", valign: "middle" }, "¡GRACIAS!"),
      ph("evento", "body", { x: 1.5, y: 3.75, w: W - 3, h: 0.9, fontFace: F.med, fontSize: 22, color: HEX.sky, align: "center", valign: "middle", charSpacing: 1 }, "Nombre del evento"),
      ph("fecha", "body", { x: 3.9, y: 4.8, w: W - 7.8, h: 0.6, fontFace: F.xb, fontSize: 22, color: HEX.white, align: "center", valign: "middle" }, "Fecha · Sede"),
    ],
  });

  // ---------- utilidades de composición ----------
  const text = (s, t, o) => s.addText(t, { margin: 0, isTextBox: true, fontFace: F.reg, ...o, objectName: nm(o.objectName || "Text") });
  const card = async (s, x, y, w, h, style, o = {}) => s.addImage({ data: await cardArt(w, h, style, o.r ?? 0.18, o.dashed), x, y, w, h, shadow: o.flat ? undefined : sh(style === "light" || style === "ice" ? 0.1 : 0.25), objectName: nm(o.name || "Card"), altText: "" });
  const badge = async (s, name, x, y, d, style = "blue", ratio) => s.addImage({ data: await badgeArt(name, style, ratio), x, y, w: d, h: d, objectName: nm("Icon " + name), altText: name.replace(/^Fa/, "") });
  const watermark = async (s, name, x, y, size, hex = "2B78C0") => s.addImage({ data: await iconArt(name, hex), x, y, w: size, h: size, objectName: nm("Watermark " + name), altText: "" });
  const dash = (s, x, y, w = 0.5, color = HEX.green) => s.addShape(pres.shapes.RECTANGLE, { x, y, w, h: 0.06, fill: { color }, line: { type: "none" }, objectName: nm("Dash") });
  const pill = (s, t, x, y, w, h, fill, color, o = {}) => text(s, t, { x, y, w, h, shape: pres.shapes.ROUNDED_RECTANGLE, rectRadius: h / 2, fill: { color: fill }, color, fontFace: F.xb, align: "center", valign: "middle", fontSize: 12, charSpacing: 1, objectName: "Pill", ...o });
  const note = async (s, t, x, y, w, h) => {
    await card(s, x, y, w, h, "ice", { name: "Note card", r: 0.14, flat: true });
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y, w, h, rectRadius: 0.14, fill: { type: "none" }, line: { color: HEX.gold, width: 1.5 }, objectName: nm("Note outline") });
    await badge(s, "FaCircleInfo", x + 0.16, y + (h - 0.36) / 2, 0.36, "gold", 0.5);
    text(s, t, { x: x + 0.66, y: y + 0.03, w: w - 0.8, h: h - 0.06, fontSize: 11, color: HEX.navy, valign: "middle", objectName: "Note text" });
  };
  const newSlide = (master) => { STEP = 0; return pres.addSlide({ masterName: master }); };
  const AVATAR = await avatarArt();
  const EJEMPLO = "Textos de ejemplo: sustitúyelos por el contenido de la ponencia.";
  const rango = (a, b) => `${a} – ${b}`;

  // =============== 1. PORTADA ===============
  let s = newSlide("Portada");
  step(1); s.addImage({ data: dataOf(img("medicos.png")), x: 6.35, y: 0.95, w: 6.98, h: 6.98 * 968 / 1384, objectName: nm("Foto portada"), altText: "Médicos de la Facultad de Medicina" });
  s.addText("WESTHILL", { placeholder: "antetitulo" });
  s.addText("MEDICAL\nLEADERSHIP", { placeholder: "title" });
  s.addText([{ text: "SUMMIT ", options: { fontFace: F.reg } }, { text: "2026", options: { fontFace: F.xb } }], { placeholder: "subtitulo" });
  s.addText([{ text: "21, 22 Y 23 ", options: { fontFace: F.xb, fontSize: 32 } }, { text: "DE OCTUBRE DE 2026", options: { fontFace: F.med, fontSize: 26 } }], { placeholder: "fecha" });
  s.addText("Facultad de Medicina", { placeholder: "sede" });

  // =============== 2. CEREMONIA DE APERTURA (lema) ===============
  s = newSlide("Portada de ponencia");
  s.addText("CEREMONIA DE APERTURA", { placeholder: "tipo" });
  s.addText([{ text: "Fronteras de la Medicina", options: { breakLine: true } }, { text: "Actualización clínica y nuevas perspectivas en la práctica médica", options: { fontFace: F.semi, fontSize: 20, color: HEX.navy, paraSpaceBefore: 8 } }], { placeholder: "title" });
  s.addText("Westhill Medical Leadership Summit 2026", { placeholder: "ponente" });
  s.addText(`${PROGRAMA[0].dia}  ·  ${rango("08:00", "08:30")}`, { placeholder: "horario" });
  s.addImage({ placeholder: "fotoponente", data: await crop(img("medicos.png"), 1, [0.5, 0.0]), x: 8.87, y: 1.17, w: 3.7, h: 3.7, rounding: true });

  // =============== 3-5. PROGRAMA POR DÍA ===============
  const tipoFila = (act) => (/^Coffee break/.test(act) ? "break" : /^(Ceremonia|Actividad de patrocinadores|Mesa redonda)/.test(act) ? "esp" : "");
  for (const [i, d] of PROGRAMA.entries()) {
    s = newSlide("Solo título");
    s.addText(`Programa · Día ${i + 1}`, { placeholder: "title" });
    s.addText(`${d.dia}  ·  ${rango(d.filas[0][0], d.fin)}`, { placeholder: "subtitulo" });
    const fs10 = d.filas.length > 9 ? 11 : 12.5;
    const head = (t, al = "left") => ({ text: t, options: { fill: { color: HEX.royal }, color: HEX.white, fontFace: F.xb, fontSize: 11, charSpacing: 1, align: al, valign: "middle" } });
    const rows = [[head("HORARIO"), head("ACTIVIDAD / PONENCIA"), head("PONENTE")]];
    for (const [a, b, act, pon] of d.filas) {
      const t = tipoFila(act), fill = { color: t === "break" ? HEX.goldPale : t === "esp" ? HEX.ice : HEX.white };
      const o = { fill, fontSize: fs10, valign: "middle", border: [{ type: "none" }, { type: "none" }, { pt: 0.75, color: HEX.line }, { type: "none" }] };
      rows.push([
        { text: rango(a, b), options: { ...o, fontFace: F.xb, color: HEX.blue } },
        { text: act, options: { ...o, fontFace: t ? F.xb : F.semi, color: t === "break" ? "8A6A0A" : HEX.navy } },
        { text: pon || "—", options: { ...o, fontFace: F.med, color: pon ? HEX.ink : "A9B6C4", fontSize: fs10 - 1 } },
      ]);
    }
    step(1);
    s.addTable(rows, { x: M, y: 1.9, w: W - 2 * M, colW: [1.75, 6.83, 3.55], rowH: d.filas.length > 9 ? 0.4 : 0.47, margin: [0.04, 0.12, 0.04, 0.12], fontFace: F.reg, autoPage: false, objectName: nm("Programa") });
  }

  // =============== 6. CIFRAS ===============
  const todas = PROGRAMA.flatMap((d) => d.filas.map((f) => f[2]));
  const nPon = todas.filter((a) => !tipoFila(a)).length;
  const nPat = todas.filter((a) => /^Actividad de patrocinadores/.test(a)).length;
  const nMesa = todas.filter((a) => /^Mesa redonda/.test(a)).length;
  s = newSlide("Solo título");
  s.addText("El summit en cifras", { placeholder: "title" });
  s.addText(LEMA, { placeholder: "subtitulo" });
  const kw = 2.75, kg = (W - 2 * M - 4 * kw) / 3;
  const cifras = [[String(PROGRAMA.length), "días de actividades", "21, 22 y 23 de octubre"], [String(nPon), "ponencias", "Actualización clínica"], [String(nMesa), nMesa === 1 ? "mesa redonda" : "mesas redondas", "Viernes 23 de octubre"], [String(nPat), "actividades de patrocinadores", "Miércoles 21 y viernes 23"]];
  for (const [i, [n, lbl, sub]] of cifras.entries()) {
    const x = M + i * (kw + kg), hl = i === 0;
    step(i + 1);
    await card(s, x, 2.0, kw, 3.6, hl ? "dark" : "light");
    text(s, n, { x: x + 0.3, y: 2.3, w: kw - 0.6, h: 1.35, fontFace: F.xb, fontSize: 72, color: hl ? HEX.gold : HEX.blue, valign: "middle", objectName: "Cifra" });
    dash(s, x + 0.3, 3.8, 0.55, hl ? HEX.gold : HEX.green);
    text(s, lbl, { x: x + 0.3, y: 4.0, w: kw - 0.6, h: 0.75, fontFace: F.xb, fontSize: 16, color: hl ? HEX.white : HEX.navy, valign: "top", objectName: "Etiqueta" });
    text(s, sub, { x: x + 0.3, y: 4.85, w: kw - 0.6, h: 0.4, fontSize: 12, color: hl ? HEX.sky : HEX.muted, valign: "top", objectName: "Apoyo" });
  }
  step(5); await note(s, `Conteo hecho con el programa: ${nPon} ponencias sin contar ceremonias, coffee breaks, actividades de patrocinadores ni la mesa redonda (incluye el bloque «Antonio Chimal»).`, M, 5.95, 9.2, 0.66);

  // =============== 7. PONENTES ===============
  const ponentes = [];
  for (const d of PROGRAMA) for (const [a, , act, pon] of d.filas) if (pon) {
    const [nombre, cargo] = pon.split(" · ");
    ponentes.push({ nombre, cargo, act, cuando: `${d.corto} · ${a}` });
  }
  s = newSlide("Solo título");
  s.addText("Ponentes", { placeholder: "title" });
  s.addText("Para poner la foto: clic derecho en el círculo › Cambiar imagen", { placeholder: "subtitulo" });
  const cw = 2.85, cg = (W - 2 * M - 4 * cw) / 3, chh = 2.33;
  for (const [i, p] of ponentes.entries()) {
    const x = M + (i % 4) * (cw + cg), y = 1.95 + Math.floor(i / 4) * (chh + 0.2);
    step(Math.floor(i / 4) * 4 + (i % 4) + 1);
    await card(s, x, y, cw, chh, "light");
    s.addShape(pres.shapes.OVAL, { x: x + 0.2, y: y + 0.22, w: 0.92, h: 0.92, fill: { color: HEX.gold }, line: { type: "none" }, objectName: nm("Aro") });
    s.addImage({ data: AVATAR, x: x + 0.24, y: y + 0.26, w: 0.84, h: 0.84, rounding: true, objectName: nm("Foto ponente"), altText: "Foto de " + p.nombre });
    text(s, [{ text: p.nombre, options: { fontFace: F.xb, fontSize: 12.5, color: HEX.navy, breakLine: !!p.cargo } }, ...(p.cargo ? [{ text: p.cargo, options: { fontFace: F.med, fontSize: 9.5, color: HEX.muted } }] : [])],
      { x: x + 1.24, y: y + 0.2, w: cw - 1.4, h: 0.96, valign: "middle", objectName: "Nombre" });
    dash(s, x + 0.22, y + 1.32, 0.45);
    text(s, p.act, { x: x + 0.22, y: y + 1.45, w: cw - 0.44, h: 0.52, fontFace: F.semi, fontSize: 10.5, color: HEX.blue, valign: "top", objectName: "Ponencia" });
    text(s, p.cuando, { x: x + 0.22, y: y + 1.98, w: cw - 0.44, h: 0.24, fontFace: F.xb, fontSize: 9.5, color: HEX.muted, charSpacing: 0.5, valign: "middle", objectName: "Cuando" });
  }

  // =============== 8. SECCIÓN (divisor por día) ===============
  s = newSlide("Sección");
  s.addText("DÍA", { placeholder: "etiqueta" });
  s.addText("01", { placeholder: "numero" });
  s.addText(PROGRAMA[0].dia, { placeholder: "title" });
  s.addText(`Jornada de ${PROGRAMA[0].filas[0][0]} a ${PROGRAMA[0].fin}`, { placeholder: "subtitulo" });

  // =============== 9. PORTADA DE PONENCIA ===============
  s = newSlide("Portada de ponencia");
  s.addText("PONENCIA", { placeholder: "tipo" });
  s.addText("Leadership in Healthcare: Leading High-Performance Medical Teams", { placeholder: "title" });
  s.addText("Dr. César Escalante", { placeholder: "ponente" });
  s.addText(`${PROGRAMA[1].dia}  ·  ${rango("10:00", "10:30")}`, { placeholder: "horario" });
  s.addImage({ placeholder: "fotoponente", data: AVATAR, x: 8.87, y: 1.17, w: 3.7, h: 3.7, rounding: true });

  // =============== 10. CONTENIDO E IMAGEN ===============
  s = newSlide("Contenido e imagen");
  s.addText("Título del tema", { placeholder: "title" });
  s.addText("Diseño «Contenido e imagen» para las diapositivas de cada ponencia", { placeholder: "subtitulo" });
  const bul = (t, last) => ({ text: t, options: { bullet: { code: "25CF", indent: 18 }, breakLine: !last } });
  s.addText([bul("Escribe aquí el primer punto clave del tema."), bul("Segundo punto: una idea por renglón, frases cortas."), bul("Tercer punto: resalta los datos o conceptos clave."), bul("Cuarto punto de apoyo para cerrar la idea.", true)], { placeholder: "cuerpo" });
  s.addImage({ placeholder: "imagen", data: await crop(img("medicos.png"), 5.68 / 4.8, [0.5, 0.0], 0.035), x: 7.05, y: 2.0, w: 5.68, h: 4.8 });

  // =============== 11. TRES PUNTOS CLAVE ===============
  s = newSlide("Solo título");
  s.addText("Puntos clave", { placeholder: "title" });
  s.addText("Tres tarjetas para conceptos o hallazgos; la central va destacada", { placeholder: "subtitulo" });
  const pw = 3.84, pg = 0.305;
  for (const [i, [ic, t]] of [["FaStethoscope", "Concepto uno"], ["FaHeartPulse", "Concepto dos"], ["FaMicroscope", "Concepto tres"]].entries()) {
    const x = M + i * (pw + pg), hl = i === 1;
    step(i + 1);
    await card(s, x, 2.0, pw, 4.3, hl ? "dark" : "light");
    if (hl) await watermark(s, ic, x + pw - 1.45, 4.95, 1.15, "2A6CAE");
    await badge(s, ic, x + 0.4, 2.38, 0.95, hl ? "gold" : "blue");
    text(s, t, { x: x + 0.4, y: 3.55, w: pw - 0.8, h: 0.55, fontFace: F.xb, fontSize: 20, color: hl ? HEX.white : HEX.navy, valign: "middle", objectName: "Titulo tarjeta" });
    dash(s, x + 0.4, 4.2, 0.55, hl ? HEX.gold : HEX.green);
    text(s, "Describe aquí la idea en dos o tres renglones.", { x: x + 0.4, y: 4.45, w: pw - 0.8, h: 1.4, fontSize: 14, color: hl ? HEX.sky : HEX.muted, valign: "top", objectName: "Texto tarjeta" });
  }
  step(4); text(s, EJEMPLO, { x: M, y: 6.55, w: 8, h: 0.3, fontSize: 10, italic: true, color: HEX.muted, objectName: "Ejemplo" });

  // =============== 12. MENSAJE CLAVE ===============
  s = newSlide("Solo título");
  s.addText("Mensaje clave", { placeholder: "title" });
  step(1); await card(s, M, 2.0, W - 2 * M, 4.5, "dark");
  await watermark(s, "FaQuoteRight", W - M - 2.4, 4.05, 1.9, "235E9E");
  await badge(s, "FaQuoteLeft", M + 0.55, 2.4, 0.9, "gold");
  step(2); text(s, "Escribe aquí la frase o la conclusión central de la ponencia, en no más de tres renglones.", { x: M + 0.55, y: 3.5, w: 9.8, h: 1.7, fontFace: F.semi, fontSize: 26, color: HEX.white, valign: "top", lineSpacingMultiple: 1.05, objectName: "Cita" });
  step(3); dash(s, M + 0.55, 5.5, 0.6, HEX.green);
  text(s, [{ text: "Nombre del autor", options: { fontFace: F.xb, color: HEX.gold, breakLine: true } }, { text: "Cargo o institución", options: { color: HEX.sky } }], { x: M + 1.35, y: 5.3, w: 6, h: 0.75, fontSize: 14, valign: "middle", objectName: "Autor" });

  // =============== 13. COFFEE BREAK ===============
  s = newSlide("Receso");
  s.addText("COFFEE BREAK", { placeholder: "title" });
  s.addText("Regresamos a las 10:30", { placeholder: "regreso" });
  s.addText(`${PROGRAMA[0].dia}  ·  ${rango("09:30", "10:30")}`, { placeholder: "detalle" });

  // =============== 14. PATROCINADORES ===============
  s = newSlide("Solo título");
  s.addText("Patrocinadores", { placeholder: "title" });
  s.addText(`Actividad de patrocinadores: ${PROGRAMA[0].corto} ${rango("10:30", "11:00")}  ·  ${PROGRAMA[2].corto} ${rango("09:30", "10:00")}`, { placeholder: "subtitulo" });
  const lw = 2.85, lg = (W - 2 * M - 4 * lw) / 3, lh = 2.0;
  for (let i = 0; i < 8; i++) {
    const x = M + (i % 4) * (lw + lg), y = 2.05 + Math.floor(i / 4) * (lh + 0.3);
    step(i + 1);
    await card(s, x, y, lw, lh, "light", { dashed: true, flat: true });
    await watermark(s, "FaImage", x + lw / 2 - 0.35, y + 0.42, 0.7, "B5CCE4");
    text(s, "Logo del patrocinador", { x: x + 0.2, y: y + 1.25, w: lw - 0.4, h: 0.35, fontFace: F.semi, fontSize: 11, color: "8BA5C1", align: "center", valign: "middle", objectName: "Logo" });
  }

  // =============== 15. CIERRE ===============
  s = newSlide("Cierre");
  s.addText("¡GRACIAS!", { placeholder: "title" });
  s.addText([{ text: "WESTHILL ", options: { fontFace: F.reg } }, { text: "MEDICAL LEADERSHIP ", options: { fontFace: F.xb, color: HEX.white } }, { text: "SUMMIT 2026", options: { fontFace: F.reg } }], { placeholder: "evento" });
  s.addText("21, 22 Y 23 DE OCTUBRE DE 2026", { placeholder: "fecha" });
  step(1); text(s, "Facultad de Medicina", { x: 1.5, y: 5.45, w: W - 3, h: 0.4, fontFace: F.med, fontSize: 16, color: HEX.sky, align: "center", valign: "middle", objectName: "Sede" });
  step(2); pill(s, "@univwesthill", W / 2 - 3.05, 6.05, 2.9, 0.5, HEX.gold, HEX.navy, { fontSize: 14 });
  pill(s, "#SOMOSWESTHILL", W / 2 + 0.15, 6.05, 2.9, 0.5, HEX.white, HEX.blue, { fontSize: 14 });

  await pres.writeFile({ fileName: OUT });
  execFileSync("python3", [path.join(DIR, "animate.py"), OUT], { stdio: "inherit" });
  const zip = await JSZip.loadAsync(fs.readFileSync(OUT));
  await applyTheme(zip);
  await fixPackage(zip);
  await picPlaceholders(zip);
  fs.writeFileSync(OUT, await zip.generateAsync({ type: "nodebuffer", compression: "DEFLATE" }));
  console.log("Listo:", OUT);
})().catch((e) => { console.error(e); process.exit(1); });
