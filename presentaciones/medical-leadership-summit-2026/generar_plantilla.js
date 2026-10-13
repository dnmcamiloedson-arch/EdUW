// Plantilla de diapositivas "Westhill Medical Leadership Summit 2026"
// Sigue la línea gráfica del flyer oficial: ola azul con filo dorado arriba a la izquierda,
// títulos en Montserrat ExtraBold azul, resplandor celeste detrás de la foto, banda azul inferior
// con curva dorada y guiones verdes junto a la fecha.
//
// Uso:  NODE_PATH=<carpeta>/node_modules node generar_plantilla.js
// Dependencias: pptxgenjs react react-dom react-icons sharp jszip  (+ python3 para animate.py)
const path = require("path");
const fs = require("fs");
const { execFileSync } = require("child_process");
const pptxgen = require("pptxgenjs");
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
  gold: "F2C94C", green: "2DB34A", ice: "EDF3FA", sky: "CFE6FB", muted: "5B6B7D", white: "FFFFFF",
};
const F = { reg: "Montserrat", med: "Montserrat Medium", semi: "Montserrat SemiBold", xb: "Montserrat ExtraBold" };
const W = 13.333, H = 7.5, M = 0.6, P = 200; // P = px por pulgada en el arte generado
const px = (v) => Math.round(v * P);

const dataOf = (file) => {
  const ext = path.extname(file).toLowerCase();
  return `image/${ext === ".png" ? "png" : "jpeg"};base64,` + fs.readFileSync(file).toString("base64");
};
const b64 = (file) => fs.readFileSync(file).toString("base64");

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
// Ola superior izquierda (azul con filo dorado), tamaño escalable
const wave = (k, fill = "url(#wb)", edge = "#F2C94C") =>
  `<path d="M0,0 H${1380 * k} C${1060 * k},${330 * k} ${640 * k},${430 * k} 0,${515 * k} Z" fill="${edge}"/>` +
  `<path d="M0,0 H${1300 * k} C${1000 * k},${300 * k} ${600 * k},${400 * k} 0,${470 * k} Z" fill="${fill}"/>`;
const DEFS = `
  <linearGradient id="wb" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#2F78BA"/><stop offset="1" stop-color="#1A4E8B"/></linearGradient>
  <linearGradient id="band" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#${HEX.royal}"/><stop offset="1" stop-color="#${HEX.deep}"/></linearGradient>
  <linearGradient id="full" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#1769B5"/><stop offset="1" stop-color="#0A3A73"/></linearGradient>
  <radialGradient id="glow" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stop-color="#C4E1FB"/><stop offset="0.55" stop-color="#DCEEFD" stop-opacity="0.75"/><stop offset="1" stop-color="#FFFFFF" stop-opacity="0"/></radialGradient>
  <radialGradient id="glowW" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stop-color="#FFFFFF" stop-opacity="0.22"/><stop offset="1" stop-color="#FFFFFF" stop-opacity="0"/></radialGradient>`;
const svg = (body) => `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${px(W)}" height="${px(H)}"><defs>${DEFS}</defs>${body}</svg>`;

const BAND_TOP = 1150; // px: inicio de la banda azul de la portada (5.75")

async function art() {
  const A = {};
  // Portada: ola, resplandor detrás de la foto, banda azul con curva dorada
  A.cover = await svgTo(svg(`
    <rect width="100%" height="100%" fill="#fff"/>${contours("#C9D6E4", 0.55)}
    <ellipse cx="1930" cy="700" rx="980" ry="760" fill="url(#glow)"/>
    ${dots(2330, 70, 9, 4, 30, 4.5, "#3A7BC0", 0.75)}${dots(48, 950, 5, 5, 30, 4.5, "#3A7BC0", 0.6)}
    ${wave(1)}
    <path d="M0,${BAND_TOP + 18} C700,${BAND_TOP - 10} 1700,${BAND_TOP + 22} 2667,${BAND_TOP - 6} V1500 H0 Z" fill="url(#band)"/>
    <path d="M-10,1472 C700,1405 1700,1452 2680,1362" fill="none" stroke="#F2C94C" stroke-width="9"/>`), "jpeg");
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
  // Contenido: blanco, ola pequeña con logo, banda inferior delgada con filo dorado
  A.content = await svgTo(svg(`
    <rect width="100%" height="100%" fill="#fff"/>${contours("#D5DEE9", 0.45, 120, -60)}
    ${dots(2420, 46, 7, 3, 26, 4, "#3A7BC0", 0.55)}
    ${wave(0.73)}
    <path d="M0,1424 C800,1404 1900,1436 2667,1384" fill="none" stroke="#F2C94C" stroke-width="7"/>
    <path d="M0,1436 C800,1416 1900,1448 2667,1396 V1500 H0 Z" fill="url(#band)"/>`), "jpeg");
  // Cierre: fondo azul, ola blanca con filo dorado para el logo a color
  A.closing = await svgTo(svg(`
    <rect width="100%" height="100%" fill="url(#full)"/>
    <ellipse cx="1333" cy="820" rx="1300" ry="700" fill="url(#glowW)"/>
    ${contours("#FFFFFF", 0.08)}
    ${dots(2330, 1140, 9, 3, 30, 4.5, "#FFFFFF", 0.35)}
    ${wave(1, "#FFFFFF")}
    <path d="M-10,1452 C700,1372 1700,1425 2680,1330" fill="none" stroke="#F2C94C" stroke-width="9"/>
    <path d="M-10,1478 C700,1398 1700,1451 2680,1356" fill="none" stroke="#F2C94C" stroke-opacity="0.45" stroke-width="4"/>`), "jpeg");
  return A;
}

// ---------- tarjetas, íconos y fotos redondeadas ----------
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
async function cardArt(w, h, style, r = 0.18) {
  const s = CARD[style], pw = Math.round(w * 150), ph = Math.round(h * 150), pr = Math.round(r * 150);
  const g = s.glow ? `<radialGradient id="g" cx="0.92" cy="0.05" r="0.75"><stop offset="0" stop-color="${s.glow}"/><stop offset="1" stop-color="rgba(0,0,0,0)"/></radialGradient>` : "";
  return svgTo(`<svg xmlns="http://www.w3.org/2000/svg" width="${pw}" height="${ph}"><defs>
    <linearGradient id="l" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${s.stops[0]}"/><stop offset="1" stop-color="${s.stops[1]}"/></linearGradient>${g}
    <clipPath id="c"><rect width="${pw}" height="${ph}" rx="${pr}"/></clipPath></defs>
    <g clip-path="url(#c)"><rect width="${pw}" height="${ph}" fill="url(#l)"/>${s.glow ? `<rect width="${pw}" height="${ph}" fill="url(#g)"/>` : ""}</g>
    <rect x="1.5" y="1.5" width="${pw - 3}" height="${ph - 3}" rx="${pr - 1}" fill="none" stroke="${s.stroke}" stroke-width="3"/></svg>`);
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
async function iconArt(name, hex) {
  return svgTo(iconSvg(name, hex).replace(/height="1em" width="1em"/, 'height="256" width="256"'));
}
async function roundedCrop(file, aspect, focus = [0.5, 0.5], radius = 0.04) {
  const meta = await sharp(file).metadata();
  let cw = meta.width, ch = Math.round(cw / aspect);
  if (ch > meta.height) { ch = meta.height; cw = Math.round(ch * aspect); }
  const left = Math.round((meta.width - cw) * focus[0]), top = Math.round((meta.height - ch) * focus[1]);
  const r = Math.round(Math.min(cw, ch) * radius);
  const mask = Buffer.from(`<svg width="${cw}" height="${ch}"><rect width="${cw}" height="${ch}" rx="${r}" fill="#fff"/></svg>`);
  const buf = await sharp(file).extract({ left, top, width: cw, height: ch }).png().composite([{ input: mask, blend: "dest-in" }]).toBuffer();
  return "image/png;base64," + buf.toString("base64");
}

async function applyTheme(file) {
  const JSZip = require("jszip");
  const zip = await JSZip.loadAsync(fs.readFileSync(file));
  const colors = { dk1: HEX.ink, lt1: HEX.white, dk2: HEX.navy, lt2: HEX.ice, accent1: HEX.blue, accent2: HEX.gold, accent3: HEX.royal, accent4: HEX.green, accent5: HEX.deep, accent6: HEX.muted, hlink: HEX.royal, folHlink: HEX.deep };
  for (const name of Object.keys(zip.files).filter((n) => /^ppt\/theme\/theme\d+\.xml$/.test(n))) {
    let xml = await zip.file(name).async("string");
    for (const [k, v] of Object.entries(colors)) xml = xml.replace(new RegExp(`<a:${k}>[\\s\\S]*?</a:${k}>`), `<a:${k}><a:srgbClr val="${v}"/></a:${k}>`);
    xml = xml.replace(/(<a:majorFont>\s*<a:latin typeface=")[^"]*"/, `$1${F.xb}"`);
    xml = xml.replace(/(<a:minorFont>\s*<a:latin typeface=")[^"]*"/, `$1${F.reg}"`);
    xml = xml.replace(/<a:clrScheme name="[^"]*"/, '<a:clrScheme name="Westhill Medical Summit"');
    zip.file(name, xml);
  }
  fs.writeFileSync(file, await zip.generateAsync({ type: "nodebuffer", compression: "DEFLATE" }));
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
  const LR = 757 / 1878; // alto/ancho del logo
  const sh = (o = 0.12) => ({ type: "outer", color: HEX.navy, opacity: o, blur: 16, offset: 5, angle: 90 });

  // nombres de objeto con "@n~" => animación Float In en el paso n (lo procesa animate.py)
  let objN = 0, STEP = 0;
  const nm = (s) => `${STEP ? "@" + STEP + "~" : ""}${s} ${++objN}`;
  const step = (n) => { STEP = n; };

  const ph = (name, type, o, prompt) => ({ placeholder: { options: { name, type, margin: 0, ...o }, text: prompt } });
  const footer = [
    { text: { text: "WESTHILL MEDICAL LEADERSHIP SUMMIT 2026  ·  Facultad de Medicina", options: { x: M, y: 7.22, w: 8, h: 0.24, fontFace: F.semi, fontSize: 9, color: HEX.white, charSpacing: 1, margin: 0, valign: "middle" } } },
    { text: { text: "#SOMOSWESTHILL", options: { x: W - M - 3.2, y: 7.22, w: 2.5, h: 0.24, fontFace: F.xb, fontSize: 9, color: HEX.gold, charSpacing: 1, align: "right", margin: 0, valign: "middle" } } },
  ];
  const slideNum = { x: W - M - 0.5, y: 7.22, w: 0.5, h: 0.24, fontFace: F.xb, fontSize: 10, color: HEX.white, align: "right", margin: 0 };
  const titlePh = ph("title", "title", { x: 4.75, y: 0.3, w: 7.98, h: 0.8, fontFace: F.xb, fontSize: 28, color: HEX.blue, valign: "middle", align: "left" }, "Título de la diapositiva");
  const subPh = ph("subtitulo", "body", { x: 4.75, y: 1.08, w: 7.98, h: 0.38, fontFace: F.med, fontSize: 14, color: HEX.muted, valign: "top" }, "Subtítulo opcional");
  const contentBase = [{ image: { data: LOGO_W, x: 0.3, y: 0.15, w: 1.95, h: 1.95 * LR } }, ...footer, titlePh, subPh];

  // ---------- diseños (layouts) ----------
  pres.defineSlideMaster({
    title: "Portada",
    background: { data: A.cover },
    objects: [
      { image: { data: LOGO_W, x: 0.32, y: 0.2, w: 2.95, h: 2.95 * LR } },
      { rect: { x: 1.15, y: 6.2, w: 1.2, h: 0.07, fill: { color: HEX.green }, line: { type: "none" } } },
      { rect: { x: W - 1.15 - 1.2, y: 6.2, w: 1.2, h: 0.07, fill: { color: HEX.green }, line: { type: "none" } } },
      ph("antetitulo", "body", { x: 0.45, y: 2.2, w: 5.9, h: 0.62, fontFace: F.reg, fontSize: 38, color: HEX.blue, align: "center", valign: "middle", charSpacing: 1 }, "WESTHILL"),
      ph("title", "title", { x: 0.45, y: 2.82, w: 5.9, h: 1.72, fontFace: F.xb, fontSize: 54, color: HEX.blue, align: "center", valign: "middle", lineSpacingMultiple: 0.88 }, "TÍTULO DEL EVENTO"),
      ph("subtitulo", "body", { x: 0.45, y: 4.56, w: 5.9, h: 0.7, fontFace: F.reg, fontSize: 38, color: HEX.blue, align: "center", valign: "middle" }, "SUMMIT 2026"),
      ph("fecha", "body", { x: 2.45, y: 5.9, w: 8.43, h: 0.66, fontFace: F.xb, fontSize: 30, color: HEX.white, align: "center", valign: "middle" }, "FECHA DEL EVENTO"),
      ph("sede", "body", { x: 2.45, y: 6.52, w: 8.43, h: 0.42, fontFace: F.med, fontSize: 20, color: HEX.white, align: "center", valign: "middle" }, "Facultad de Medicina"),
    ],
  });
  pres.defineSlideMaster({
    title: "Sección",
    background: { data: A.section },
    objects: [
      { image: { data: LOGO_W, x: M, y: 0.45, w: 2.3, h: 2.3 * LR } },
      { rect: { x: M, y: 3.37, w: 0.6, h: 0.07, fill: { color: HEX.green }, line: { type: "none" } } },
      { text: { text: "SECCIÓN", options: { x: M + 0.75, y: 3.25, w: 3, h: 0.3, fontFace: F.xb, fontSize: 13, color: HEX.white, charSpacing: 6, margin: 0, valign: "middle" } } },
      ph("numero", "body", { x: M, y: 1.75, w: 4, h: 1.45, fontFace: F.xb, fontSize: 96, color: HEX.gold, align: "left", valign: "bottom" }, "01"),
      ph("title", "title", { x: M, y: 3.7, w: 6.6, h: 1.55, fontFace: F.xb, fontSize: 40, color: HEX.white, align: "left", valign: "top", lineSpacingMultiple: 0.95 }, "Título de la sección"),
      ph("subtitulo", "body", { x: M, y: 5.35, w: 6.4, h: 0.85, fontFace: F.med, fontSize: 17, color: HEX.sky, align: "left", valign: "top" }, "Frase breve que presenta la sección"),
    ],
  });
  pres.defineSlideMaster({
    title: "Título y contenido",
    background: { data: A.content }, slideNumber: slideNum,
    objects: [...contentBase, ph("cuerpo", "body", { x: M, y: 1.95, w: W - 2 * M, h: 4.85, fontFace: F.reg, fontSize: 18, color: HEX.ink, valign: "top", paraSpaceAfter: 10 }, "Escribe aquí el contenido")],
  });
  pres.defineSlideMaster({
    title: "Contenido e imagen",
    background: { data: A.content }, slideNumber: slideNum,
    objects: [
      ...contentBase,
      ph("cuerpo", "body", { x: M, y: 1.95, w: 6.1, h: 4.85, fontFace: F.reg, fontSize: 18, color: HEX.ink, valign: "top", paraSpaceAfter: 10 }, "Escribe aquí el contenido"),
      ph("imagen", "pic", { x: 7.05, y: 1.95, w: 5.68, h: 4.85 }, "Inserta una imagen"),
    ],
  });
  pres.defineSlideMaster({ title: "Solo título", background: { data: A.content }, slideNumber: slideNum, objects: contentBase });
  pres.defineSlideMaster({
    title: "Cierre",
    background: { data: A.closing },
    objects: [
      { image: { data: LOGO_C, x: 0.32, y: 0.2, w: 2.95, h: 2.95 * 313 / 779 } },
      { rect: { x: 2.65, y: 5.07, w: 1.2, h: 0.07, fill: { color: HEX.green }, line: { type: "none" } } },
      { rect: { x: W - 2.65 - 1.2, y: 5.07, w: 1.2, h: 0.07, fill: { color: HEX.green }, line: { type: "none" } } },
      ph("title", "title", { x: 1.5, y: 2.35, w: W - 3, h: 1.35, fontFace: F.xb, fontSize: 72, color: HEX.white, align: "center", valign: "middle" }, "¡GRACIAS!"),
      ph("evento", "body", { x: 1.5, y: 3.75, w: W - 3, h: 0.9, fontFace: F.med, fontSize: 22, color: HEX.sky, align: "center", valign: "middle", charSpacing: 1 }, "Nombre del evento"),
      ph("fecha", "body", { x: 3.2, y: 4.8, w: W - 6.4, h: 0.6, fontFace: F.xb, fontSize: 22, color: HEX.white, align: "center", valign: "middle" }, "Fecha · Sede"),
    ],
  });

  // ---------- utilidades de composición ----------
  const text = (s, t, o) => s.addText(t, { margin: 0, isTextBox: true, fontFace: F.reg, ...o, objectName: nm(o.objectName || "Text") });
  const card = async (s, x, y, w, h, style, o = {}) => s.addImage({ data: await cardArt(w, h, style, o.r ?? 0.18), x, y, w, h, shadow: o.flat ? undefined : sh(style === "light" || style === "ice" ? 0.1 : 0.25), objectName: nm(o.name || "Card"), altText: "" });
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
  const EJEMPLO = "Textos de ejemplo: sustitúyelos por la información real del evento.";

  // =============== 1. PORTADA ===============
  let s = newSlide("Portada");
  step(1); s.addImage({ data: dataOf(img("medicos.png")), x: 6.35, y: 0.95, w: 6.98, h: 6.98 * 968 / 1384, objectName: nm("Foto portada"), altText: "Médicos de la Facultad de Medicina" });
  s.addText("WESTHILL", { placeholder: "antetitulo" });
  s.addText("MEDICAL\nLEADERSHIP", { placeholder: "title" });
  s.addText([{ text: "SUMMIT ", options: { fontFace: F.reg } }, { text: "2026", options: { fontFace: F.xb } }], { placeholder: "subtitulo" });
  s.addText([{ text: "21, 22 Y 23 ", options: { fontFace: F.xb, fontSize: 32 } }, { text: "DE OCTUBRE DE 2026", options: { fontFace: F.med, fontSize: 26 } }], { placeholder: "fecha" });
  s.addText("Facultad de Medicina", { placeholder: "sede" });

  // =============== 2. AGENDA ===============
  s = newSlide("Solo título");
  s.addText("Agenda", { placeholder: "title" });
  s.addText("Lo que viviremos durante el summit", { placeholder: "subtitulo" });
  const agenda = [
    ["Bienvenida e inauguración", "Breve descripción de la actividad o del bloque del programa."],
    ["Conferencias magistrales", "Breve descripción de la actividad o del bloque del programa."],
    ["Paneles de liderazgo", "Breve descripción de la actividad o del bloque del programa."],
    ["Talleres prácticos", "Breve descripción de la actividad o del bloque del programa."],
    ["Clausura", "Breve descripción de la actividad o del bloque del programa."],
  ];
  const aw = 2.25, ag = (W - 2 * M - 5 * aw) / 4;
  for (const [i, [t, dsc]] of agenda.entries()) {
    const x = M + i * (aw + ag), last = i === agenda.length - 1;
    step(i + 1);
    await card(s, x, 1.85, aw, 4.55, last ? "dark" : "light");
    text(s, String(i + 1).padStart(2, "0"), { x: x + 0.3, y: 2.1, w: 1.6, h: 0.95, fontFace: F.xb, fontSize: 44, color: last ? HEX.gold : HEX.blue, objectName: "Num" });
    dash(s, x + 0.3, 3.15, 0.55);
    text(s, t, { x: x + 0.3, y: 3.38, w: aw - 0.5, h: 1.0, fontFace: F.xb, fontSize: 16, color: last ? HEX.white : HEX.navy, valign: "top", objectName: "Agenda title" });
    text(s, dsc, { x: x + 0.3, y: 4.45, w: aw - 0.5, h: 1.6, fontSize: 12.5, color: last ? HEX.sky : HEX.muted, valign: "top", objectName: "Agenda text" });
  }
  step(6); text(s, EJEMPLO, { x: M, y: 6.55, w: 8, h: 0.3, fontSize: 10, italic: true, color: HEX.muted, objectName: "Ejemplo" });

  // =============== 3. SECCIÓN ===============
  s = newSlide("Sección");
  s.addText("01", { placeholder: "numero" });
  s.addText("Bienvenida e inauguración", { placeholder: "title" });
  s.addText("Frase breve que presenta esta sección del summit.", { placeholder: "subtitulo" });

  // =============== 4. CONTENIDO E IMAGEN ===============
  s = newSlide("Contenido e imagen");
  s.addText("Sobre el summit", { placeholder: "title" });
  s.addText("Diseño «Contenido e imagen»: texto con viñetas y una foto", { placeholder: "subtitulo" });
  s.addText([
    { text: "Escribe aquí el primer punto clave del tema.", options: { bullet: { code: "25CF", indent: 18 }, breakLine: true } },
    { text: "Segundo punto: una idea por renglón, frases cortas.", options: { bullet: { code: "25CF", indent: 18 }, breakLine: true } },
    { text: "Tercer punto: resalta los datos o conceptos clave.", options: { bullet: { code: "25CF", indent: 18 }, breakLine: true } },
    { text: "Cuarto punto de apoyo para cerrar la idea.", options: { bullet: { code: "25CF", indent: 18 } } },
  ], { placeholder: "cuerpo" });
  s.addImage({ placeholder: "imagen", data: await roundedCrop(img("medicos.png"), 5.68 / 4.85, [0.5, 0.0], 0.035), x: 7.05, y: 1.95, w: 5.68, h: 4.85 });

  // =============== 5. TRES PILARES ===============
  s = newSlide("Solo título");
  s.addText("Ejes del summit", { placeholder: "title" });
  s.addText("Tres tarjetas para conceptos, objetivos o temas; la central va destacada", { placeholder: "subtitulo" });
  const pilares = [
    ["FaUserDoctor", "Liderazgo clínico", "Describe aquí el primer eje temático en dos o tres renglones."],
    ["FaLightbulb", "Innovación en salud", "Describe aquí el segundo eje temático en dos o tres renglones."],
    ["FaPeopleGroup", "Trabajo en equipo", "Describe aquí el tercer eje temático en dos o tres renglones."],
  ];
  const pw = 3.84, pg = 0.305;
  for (const [i, [ic, t, dsc]] of pilares.entries()) {
    const x = M + i * (pw + pg), hl = i === 1;
    step(i + 1);
    await card(s, x, 1.95, pw, 4.4, hl ? "dark" : "light");
    if (hl) await watermark(s, ic, x + pw - 1.45, 5.0, 1.15, "2A6CAE");
    await badge(s, ic, x + 0.4, 2.35, 0.95, hl ? "gold" : "blue");
    text(s, t, { x: x + 0.4, y: 3.55, w: pw - 0.8, h: 0.55, fontFace: F.xb, fontSize: 20, color: hl ? HEX.white : HEX.navy, valign: "middle", objectName: "Pilar title" });
    dash(s, x + 0.4, 4.2, 0.55, hl ? HEX.gold : HEX.green);
    text(s, dsc, { x: x + 0.4, y: 4.45, w: pw - 0.8, h: 1.5, fontSize: 14, color: hl ? HEX.sky : HEX.muted, valign: "top", objectName: "Pilar text" });
  }
  step(4); text(s, EJEMPLO, { x: M, y: 6.55, w: 8, h: 0.3, fontSize: 10, italic: true, color: HEX.muted, objectName: "Ejemplo" });

  // =============== 6. PROGRAMA POR DÍA ===============
  s = newSlide("Solo título");
  s.addText("Programa", { placeholder: "title" });
  s.addText("21, 22 y 23 de octubre de 2026", { placeholder: "subtitulo" });
  const dias = [["21", "OCT", "Día 1"], ["22", "OCT", "Día 2"], ["23", "OCT", "Día 3"]];
  for (const [i, [dn, mes, lbl]] of dias.entries()) {
    const x = M + i * (pw + pg);
    step(i + 1);
    await card(s, x, 1.85, pw, 4.6, "light");
    await card(s, x, 1.85, pw, 1.1, "dark", { flat: true });
    text(s, dn, { x: x + 0.35, y: 1.95, w: 1.1, h: 0.9, fontFace: F.xb, fontSize: 40, color: HEX.gold, valign: "middle", objectName: "Dia" });
    text(s, [{ text: mes, options: { fontFace: F.xb, fontSize: 14, color: HEX.white, breakLine: true } }, { text: lbl, options: { fontFace: F.med, fontSize: 13, color: HEX.sky } }], { x: x + 1.45, y: 2.05, w: 2.1, h: 0.7, valign: "middle", objectName: "Mes" });
    for (let j = 0; j < 3; j++) {
      const y = 3.2 + j * 1.05;
      text(s, "00:00", { x: x + 0.35, y, w: 0.95, h: 0.32, fontFace: F.xb, fontSize: 14, color: HEX.blue, objectName: "Hora" });
      text(s, [{ text: "Nombre de la actividad", options: { fontFace: F.semi, fontSize: 13, color: HEX.navy, breakLine: true } }, { text: "Ponente · Sala", options: { fontSize: 11.5, color: HEX.muted } }], { x: x + 1.35, y: y - 0.02, w: pw - 1.65, h: 0.7, valign: "top", objectName: "Actividad" });
      if (j < 2) s.addShape(pres.shapes.LINE, { x: x + 0.35, y: y + 0.85, w: pw - 0.7, h: 0, line: { color: "DCE6F2", width: 1 }, objectName: nm("Sep") });
    }
  }
  step(4); text(s, "Horarios y actividades de ejemplo: sustitúyelos por el programa oficial.", { x: M, y: 6.6, w: 8, h: 0.3, fontSize: 10, italic: true, color: HEX.muted, objectName: "Ejemplo" });

  // =============== 7. PONENTES ===============
  s = newSlide("Solo título");
  s.addText("Ponentes", { placeholder: "title" });
  s.addText("Sustituye cada círculo por la foto del ponente (clic derecho › Cambiar imagen)", { placeholder: "subtitulo" });
  const kw = 2.75, kg = (W - 2 * M - 4 * kw) / 3;
  for (let i = 0; i < 4; i++) {
    const x = M + i * (kw + kg);
    step(i + 1);
    await card(s, x, 1.9, kw, 4.3, "light");
    s.addShape(pres.shapes.OVAL, { x: x + (kw - 1.85) / 2 - 0.06, y: 2.14, w: 1.97, h: 1.97, fill: { color: HEX.gold }, line: { type: "none" }, objectName: nm("Aro") });
    await badge(s, "FaUserDoctor", x + (kw - 1.85) / 2, 2.2, 1.85, "ice", 0.42);
    text(s, "Nombre del ponente", { x: x + 0.2, y: 4.3, w: kw - 0.4, h: 0.5, fontFace: F.xb, fontSize: 15, color: HEX.navy, align: "center", valign: "middle", objectName: "Nombre" });
    dash(s, x + (kw - 0.5) / 2, 4.88, 0.5);
    text(s, [{ text: "Cargo o especialidad", options: { fontFace: F.semi, color: HEX.blue, breakLine: true } }, { text: "Institución", options: { color: HEX.muted } }], { x: x + 0.2, y: 5.05, w: kw - 0.4, h: 0.75, fontSize: 12, align: "center", valign: "top", objectName: "Cargo" });
  }

  // =============== 8. CIFRAS ===============
  s = newSlide("Solo título");
  s.addText("El summit en cifras", { placeholder: "title" });
  s.addText("Números grandes con su etiqueta; el principal va destacado", { placeholder: "subtitulo" });
  const cifras = [["3", "días de actividades", "21 al 23 de octubre"], ["00", "conferencias magistrales", "Dato de apoyo"], ["00", "ponentes invitados", "Dato de apoyo"], ["00", "talleres prácticos", "Dato de apoyo"]];
  for (const [i, [n, lbl, sub]] of cifras.entries()) {
    const x = M + i * (kw + kg), hl = i === 0;
    step(i + 1);
    await card(s, x, 2.0, kw, 3.6, hl ? "dark" : "light");
    text(s, n, { x: x + 0.3, y: 2.3, w: kw - 0.6, h: 1.35, fontFace: F.xb, fontSize: 72, color: hl ? HEX.gold : HEX.blue, valign: "middle", objectName: "Cifra" });
    dash(s, x + 0.3, 3.8, 0.55, hl ? HEX.gold : HEX.green);
    text(s, lbl, { x: x + 0.3, y: 4.0, w: kw - 0.6, h: 0.75, fontFace: F.xb, fontSize: 16, color: hl ? HEX.white : HEX.navy, valign: "top", objectName: "Etiqueta" });
    text(s, sub, { x: x + 0.3, y: 4.85, w: kw - 0.6, h: 0.4, fontSize: 12, color: hl ? HEX.sky : HEX.muted, valign: "top", objectName: "Apoyo" });
  }
  step(5); await note(s, "Los valores «00» son de ejemplo: reemplázalos por las cifras confirmadas del evento.", M, 5.95, 7.4, 0.62);

  // =============== 9. MENSAJE CLAVE ===============
  s = newSlide("Solo título");
  s.addText("Mensaje clave", { placeholder: "title" });
  step(1); await card(s, M, 1.9, W - 2 * M, 4.55, "dark");
  await watermark(s, "FaQuoteRight", W - M - 2.4, 4.0, 1.9, "235E9E");
  await badge(s, "FaQuoteLeft", M + 0.55, 2.35, 0.9, "gold");
  step(2); text(s, "Escribe aquí una frase inspiradora o el mensaje central de la presentación, en no más de tres renglones.", { x: M + 0.55, y: 3.45, w: 9.8, h: 1.7, fontFace: F.semi, fontSize: 26, color: HEX.white, valign: "top", lineSpacingMultiple: 1.05, objectName: "Cita" });
  step(3); dash(s, M + 0.55, 5.45, 0.6, HEX.green);
  text(s, [{ text: "Nombre del autor", options: { fontFace: F.xb, color: HEX.gold, breakLine: true } }, { text: "Cargo o institución", options: { color: HEX.sky } }], { x: M + 1.35, y: 5.25, w: 6, h: 0.75, fontSize: 14, valign: "middle", objectName: "Autor" });

  // =============== 10. CIERRE ===============
  s = newSlide("Cierre");
  s.addText("¡GRACIAS!", { placeholder: "title" });
  s.addText([{ text: "WESTHILL ", options: { fontFace: F.reg } }, { text: "MEDICAL LEADERSHIP ", options: { fontFace: F.xb, color: HEX.white } }, { text: "SUMMIT 2026", options: { fontFace: F.reg } }], { placeholder: "evento" });
  s.addText("21, 22 Y 23 DE OCTUBRE DE 2026", { placeholder: "fecha" });
  step(1); text(s, "Facultad de Medicina", { x: 1.5, y: 5.45, w: W - 3, h: 0.4, fontFace: F.med, fontSize: 16, color: HEX.sky, align: "center", valign: "middle", objectName: "Sede" });
  step(2); pill(s, "@univwesthill", W / 2 - 3.05, 6.05, 2.9, 0.5, HEX.gold, HEX.navy, { fontSize: 14 });
  pill(s, "#SOMOSWESTHILL", W / 2 + 0.15, 6.05, 2.9, 0.5, HEX.white, HEX.blue, { fontSize: 14 });

  await pres.writeFile({ fileName: OUT });
  await applyTheme(OUT);
  execFileSync("python3", [path.join(DIR, "animate.py"), OUT], { stdio: "inherit" });
  console.log("Listo:", OUT);
})().catch((e) => { console.error(e); process.exit(1); });
