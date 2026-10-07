// Biblioteca de presentaciones institucionales Universidad Westhill (pptxgenjs).
// Uso:
//   const { createDeck } = require("<skill>/scripts/westhill.js");
//   const d = createDeck({ title: "Embajadores Westhill" });
//   await d.cover("EMBAJADORES WESTHILL");
//   await d.section("01", "El programa", { photo: "rotonda" });
//   const s = d.contentSlide("Título", { subtitle: "Subtítulo opcional" });
//   ... d.card(s, ...), d.badge(s, ...), d.text(s, ...) ...
//   await d.closing({ line1: "Embajadores Westhill", line2: "Enero 2027" });
//   await d.save("salida.pptx");
const path = require("path");
const fs = require("fs");
const { execFileSync } = require("child_process");
const pptxgen = require("pptxgenjs");
const React = require("react");
const ReactDOMServer = require("react-dom/server");
const sharp = require("sharp");
const fa = require("react-icons/fa6");

const ASSETS = path.join(__dirname, "..", "assets");
const asset = (f) => path.join(ASSETS, f);

const HEX = {
  ink: "15243A", navy: "0E2A47", white: "FFFFFF", ice: "EDF3FA",
  blue: "266294", gold: "F2C94C", sky: "4A90C8", deep: "163A5F", mist: "8FB3D9", muted: "5B6B7D",
};
const FONT = "Raleway";
const W = 13.333, H = 7.5, M = 0.6;
// Content slides: write Y coordinates as if content used the band 1.7"–6.65"; the deck maps that
// band into the real area under the institutional header (2.15"–7.0"). Pass abs:true for real coords.
const VBAND = { top: 1.7, bottom: 6.65 }, REAL = { top: 2.15, bottom: 7.0 };

const INTRO_PHOTOS = { edificio: "portada_edificio.jpg", rotonda: "portada_rotonda.jpg", letras: "portada_letras.jpg" };

function imgData(file) {
  const ext = path.extname(file).toLowerCase();
  const mime = ext === ".png" ? "png" : "jpeg";
  return `image/${mime};base64,` + fs.readFileSync(file).toString("base64");
}

// ---------- generated artwork (SVG -> PNG) ----------
const DPI = 150;
async function svgPng(svg) {
  const buf = await sharp(Buffer.from(svg)).png().toBuffer();
  return "image/png;base64," + buf.toString("base64");
}
function iconSvg(name, hex) {
  if (!fa[name]) throw new Error(`Ícono desconocido: ${name} (usa nombres de react-icons/fa6, p. ej. FaStar)`);
  return ReactDOMServer.renderToStaticMarkup(React.createElement(fa[name], { color: "#" + hex }));
}
const icon = (name, hex) => svgPng(iconSvg(name, hex).replace(/height="1em" width="1em"/, 'height="256" width="256"'));

const CARD = {
  light: { stops: ["#FFFFFF", "#FFFFFF"], stroke: "#DCE6F2", glow: null },
  ice: { stops: ["#F4F8FD", "#E8F0F9"], stroke: "#D6E3F1", glow: null },
  dark: { stops: ["#1C4772", "#0B2240"], stroke: "rgba(255,255,255,0.10)", glow: "rgba(90,160,225,0.45)" },
  blue: { stops: ["#3A86C8", "#1F5585"], stroke: "rgba(255,255,255,0.18)", glow: "rgba(170,210,250,0.45)" },
  gold: { stops: ["#FADF85", "#E8B530"], stroke: "rgba(255,255,255,0.4)", glow: "rgba(255,255,255,0.5)" },
};
const cardCache = {};
async function cardArt(w, h, style, r = 0.18) {
  const key = [w, h, style, r].join("|");
  if (cardCache[key]) return cardCache[key];
  const s = CARD[style], pw = Math.round(w * DPI), ph = Math.round(h * DPI), pr = Math.round(r * DPI);
  const glow = s.glow ? `<radialGradient id="g" cx="0.92" cy="0.05" r="0.75"><stop offset="0" stop-color="${s.glow}"/><stop offset="1" stop-color="rgba(0,0,0,0)"/></radialGradient>` : "";
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${pw}" height="${ph}"><defs>
    <linearGradient id="l" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${s.stops[0]}"/><stop offset="1" stop-color="${s.stops[1]}"/></linearGradient>${glow}
    <clipPath id="c"><rect width="${pw}" height="${ph}" rx="${pr}"/></clipPath></defs>
    <g clip-path="url(#c)"><rect width="${pw}" height="${ph}" fill="url(#l)"/>${s.glow ? `<rect width="${pw}" height="${ph}" fill="url(#g)"/>` : ""}</g>
    <rect x="1.5" y="1.5" width="${pw - 3}" height="${ph - 3}" rx="${pr - 1}" fill="none" stroke="${s.stroke}" stroke-width="3"/></svg>`;
  return (cardCache[key] = await svgPng(svg));
}
const BADGE = {
  blue: ["#4A93D2", "#1F5585", "FFFFFF"], gold: ["#FBE08A", "#E3AC25", "0E2A47"], navy: ["#24527F", "#0B2240", "F2C94C"],
  white: ["#FFFFFF", "#E6EEF8", "266294"], glass: ["rgba(255,255,255,0.16)", "rgba(255,255,255,0.06)", "F2C94C"],
};
async function badgeArt(name, style, ratio = 0.46) {
  const [a, b, ic] = BADGE[style], S = 300, is = Math.round(S * ratio), o = (S - is) / 2;
  const inner = iconSvg(name, ic).replace(/height="1em" width="1em"/, `x="${o}" y="${o}" width="${is}" height="${is}"`);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${S}" height="${S}"><defs>
    <linearGradient id="b" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient>
    <radialGradient id="h" cx="0.3" cy="0.2" r="0.6"><stop offset="0" stop-color="rgba(255,255,255,0.35)"/><stop offset="1" stop-color="rgba(255,255,255,0)"/></radialGradient></defs>
    <circle cx="150" cy="150" r="148" fill="url(#b)"/><circle cx="150" cy="150" r="148" fill="url(#h)"/>
    <circle cx="150" cy="150" r="146" fill="none" stroke="rgba(255,255,255,0.35)" stroke-width="3"/>${inner}</svg>`;
  return svgPng(svg);
}

// Rounded-corner copy of a photo/screenshot, optionally cropped to a w:h aspect (inches).
async function roundedImage(file, opts = {}) {
  let img = sharp(file);
  const meta = await img.metadata();
  let { width, height } = meta;
  if (opts.aspect) {
    const want = opts.aspect; // width / height
    let cw = width, ch = Math.round(width / want);
    if (ch > height) { ch = height; cw = Math.round(height * want); }
    const top = Math.round((height - ch) * (opts.focusY ?? 0.5)), left = Math.round((width - cw) / 2);
    img = img.extract({ left, top, width: cw, height: ch });
    width = cw; height = ch;
  }
  const r = Math.round(Math.min(width, height) * (opts.radius ?? 0.035));
  const mask = Buffer.from(`<svg width="${width}" height="${height}"><rect width="${width}" height="${height}" rx="${r}" fill="#fff"/></svg>`);
  const buf = await img.png().composite([{ input: mask, blend: "dest-in" }]).toBuffer();
  return { data: "image/png;base64," + buf.toString("base64"), w: width, h: height };
}

async function applyTheme(file) {
  const JSZip = require("jszip");
  const zip = await JSZip.loadAsync(fs.readFileSync(file));
  const colors = { dk1: HEX.ink, lt1: HEX.white, dk2: HEX.navy, lt2: HEX.ice, accent1: HEX.blue, accent2: HEX.gold, accent3: HEX.sky, accent4: HEX.deep, accent5: HEX.mist, accent6: HEX.muted, hlink: HEX.blue, folHlink: HEX.deep };
  for (const name of Object.keys(zip.files).filter((n) => /^ppt\/theme\/theme\d+\.xml$/.test(n))) {
    let xml = await zip.file(name).async("string");
    for (const [k, v] of Object.entries(colors)) xml = xml.replace(new RegExp(`<a:${k}>[\\s\\S]*?</a:${k}>`), `<a:${k}><a:srgbClr val="${v}"/></a:${k}>`);
    xml = xml.replace(/(<a:(?:major|minor)Font>\s*<a:latin typeface=")[^"]*"/g, `$1${FONT}"`);
    xml = xml.replace(/<a:clrScheme name="[^"]*"/, '<a:clrScheme name="Westhill"');
    zip.file(name, xml);
  }
  fs.writeFileSync(file, await zip.generateAsync({ type: "nodebuffer", compression: "DEFLATE" }));
}

function createDeck(opts = {}) {
  const pres = new pptxgen();
  pres.layout = "LAYOUT_WIDE";
  pres.theme = { headFontFace: FONT, bodyFontFace: FONT };
  pres.title = opts.title || "Universidad Westhill";
  pres.author = "Universidad Westhill";
  pres.company = "Universidad Westhill";
  const C = pres.SchemeColor;
  const COL = {
    NAVY: C.text2, INK: C.text1, WHITE: C.background1, ICE: C.background2,
    BLUE: C.accent1, GOLD: C.accent2, SKY: C.accent3, DEEP: C.accent4, MIST: C.accent5, MUTED: C.accent6,
  };
  const { NAVY, INK, WHITE, BLUE, GOLD, MIST, MUTED } = COL;

  const SHIELD = imgData(asset("banderin_uw.png")); // 194 x 233
  const WAVE = imgData(asset("ola_encabezado.png"));
  const LOGO_WHITE = imgData(asset("logo_westhill_blanco.png")), LOGO_COLOR = imgData(asset("logo_westhill_color.png"));
  const LOGO_RATIO = 313 / 779;

  // ---------- naming + animation steps ----------
  let objN = 0, STEP = 0;
  const nm = (s) => `${STEP ? "@" + STEP + "~" : ""}${s} ${++objN}`;
  const step = (n) => { STEP = n; };
  const sh = (o = 0.18) => ({ type: "outer", color: "0E2A47", opacity: o, blur: 18, offset: 6, angle: 90 });

  // ---------- content-band transform ----------
  let TF = null, TK = 1;
  function setBand(bottom = VBAND.bottom) { TK = (REAL.bottom - REAL.top) / (bottom - VBAND.top); TF = (y) => REAL.top + (y - VBAND.top) * TK; }
  function realCoords() { TF = null; }

  function wrap(s) {
    for (const fn of ["addText", "addShape", "addImage", "addTable"]) {
      const orig = s[fn].bind(s);
      s[fn] = (a, b) => {
        const o = fn === "addImage" ? a : b;
        if (o) {
          if (TF && !o.placeholder && !o.abs && o.y !== undefined) {
            if (o.keep) { const c = o.y + o.h / 2; o.y = TF(c) - o.h / 2; }
            else if (o.h !== undefined) { const y2 = TF(o.y + o.h); o.y = TF(o.y); o.h = y2 - o.y; }
            else { o.y = TF(o.y); if (typeof o.rowH === "number") o.rowH *= TK; }
          }
          delete o.keep; delete o.abs;
        }
        return orig(a, b);
      };
    }
    return s;
  }

  // ---------- layouts ----------
  pres.defineSlideMaster({
    title: "Westhill Content",
    background: { color: WHITE },
    objects: [
      { image: { data: WAVE, x: 0, y: 0, w: W, h: 1.05 } },
      { image: { data: SHIELD, x: W - 0.6 - 0.98, y: -0.04, w: 0.98, h: 0.98 * 233 / 194 } },
      { text: { text: "@univwesthill", options: { x: W - M - 3.6, y: 7.12, w: 3, h: 0.24, fontFace: FONT, fontSize: 10, color: MUTED, align: "right", margin: 0 } } },
      { placeholder: { options: { name: "title", type: "title", x: M, y: 1.38, w: 11.5, h: 0.58, fontFace: FONT, fontSize: 30, bold: true, color: NAVY, align: "left", valign: "middle", margin: 0 }, text: "" } },
    ],
    slideNumber: { x: W - M - 0.45, y: 7.12, w: 0.45, h: 0.24, fontFace: FONT, fontSize: 10, color: BLUE, bold: true, align: "right", margin: 0 },
  });
  pres.defineSlideMaster({ title: "Westhill Intro", background: { color: WHITE }, objects: [] });

  // ---------- primitives ----------
  function text(slide, t, o) {
    slide.addText(t, { margin: 0, isTextBox: true, fontFace: FONT, ...o, objectName: nm(o.objectName || "Text") });
  }
  function bullets(items, space = 8) {
    return items.map((t, i) => ({ text: t, options: { bullet: { code: "25CF", indent: 15 }, breakLine: i < items.length - 1, paraSpaceAfter: space } }));
  }
  function pill(slide, t, x, y, w, h, fill, color, o = {}) {
    text(slide, t, { x, y, w, h, shape: pres.shapes.ROUNDED_RECTANGLE, rectRadius: h / 2, fill: { color: fill }, color, bold: true, align: "center", valign: "middle", fontSize: 14, charSpacing: 2, objectName: "Pill", ...o });
  }
  async function card(slide, x, y, w, h, style, o = {}) {
    if (TF && !o.abs) { const y2 = TF(y + h); y = TF(y); h = y2 - y; }
    slide.addImage({ abs: true, data: await cardArt(w, h, style, o.r ?? 0.18), x, y, w, h, shadow: o.flat ? undefined : sh(style === "light" || style === "ice" ? 0.10 : 0.25), objectName: nm(o.name || "Card"), altText: "" });
  }
  async function badge(slide, name, x, y, d, style = "blue", ratio, o = {}) {
    slide.addImage({ keep: true, abs: o.abs, data: await badgeArt(name, style, ratio), x, y, w: d, h: d, objectName: nm("Icon " + name), altText: name.replace(/^Fa/, "") });
  }
  async function watermark(slide, name, x, y, size, hex = "24507D") {
    slide.addImage({ keep: true, data: await icon(name, hex), x, y, w: size, h: size, objectName: nm("Watermark " + name), altText: "" });
  }
  function subtitle(slide, t, w = 11.5) {
    text(slide, t, { abs: true, x: M, y: 2.0, w, h: 0.4, fontSize: 16, color: MUTED, objectName: "Subtitle" });
  }
  // Highlighted condition/legend card (ice background, gold outline, info icon).
  async function note(slide, t, x, y, w, h, fontSize = 12, o = {}) {
    await card(slide, x, y, w, h, "ice", { name: "Note card", r: 0.14, flat: true, abs: o.abs });
    let yy = y, hh = h;
    if (TF && !o.abs) { const y2 = TF(y + h); yy = TF(y); hh = y2 - yy; }
    slide.addShape(pres.shapes.ROUNDED_RECTANGLE, { abs: true, x, y: yy, w, h: hh, rectRadius: 0.14, fill: { type: "none" }, line: { color: GOLD, width: 1.5 }, objectName: nm("Note outline") });
    await badge(slide, "FaCircleInfo", x + 0.18, yy + (hh - 0.42) / 2, 0.42, "gold", 0.5, { abs: true });
    text(slide, t, { abs: true, x: x + 0.78, y: yy + 0.04, w: w - 0.98, h: hh - 0.08, fontSize, color: NAVY, valign: "middle", objectName: "Note text" });
  }
  // Photo or screenshot inside a white frame card (real coordinates). Returns the frame bottom.
  async function framed(slide, file, x, y, w, name = "Screenshot") {
    const r = await roundedImage(file);
    const iw = w - 0.24, ih = iw * r.h / r.w;
    await card(slide, x, y, w, ih + 0.24, "light", { name: name + " frame", r: 0.14, abs: true });
    slide.addImage({ abs: true, data: r.data, x: x + 0.12, y: y + 0.12, w: iw, h: ih, objectName: nm(name), altText: name });
    return y + ih + 0.24;
  }
  // Rounded photo cropped to fill an exact box (real coordinates).
  async function photo(slide, file, x, y, w, h, o = {}) {
    const r = await roundedImage(file, { aspect: w / h, focusY: o.focusY, radius: 0.04 });
    slide.addImage({ abs: true, data: r.data, x, y, w, h, shadow: sh(0.18), objectName: nm(o.name || "Photo"), altText: o.alt || "Foto Universidad Westhill" });
  }

  // ---------- slides ----------
  function addSlide(masterName, sectionTitle) {
    const s = wrap(pres.addSlide({ masterName, sectionTitle }));
    TF = null;
    return s;
  }
  let currentSection = null;
  function useSection(title) {
    if (title && title !== currentSection) { pres.addSection({ title }); currentSection = title; }
    return currentSection || undefined;
  }
  function contentSlide(title, o = {}) {
    STEP = 0;
    const sec = useSection(o.section);
    const s = addSlide("Westhill Content", sec);
    s.addText([{ text: "#SOMOS", options: { bold: false } }, { text: "WESTHILL", options: { bold: true } }], { x: 1.15, y: 0.1, w: 4, h: 0.42, fontFace: FONT, fontSize: 20, color: WHITE, margin: 0, valign: "middle", isTextBox: true, objectName: `Hashtag ${++objN}` });
    s.addText(title, { placeholder: "title" });
    if (o.subtitle) subtitle(s, o.subtitle);
    if (o.real) realCoords(); else setBand(o.bottom || VBAND.bottom);
    return s;
  }
  const IC = 2.95, IX = 0.45, IW = 2 * (IC - 0.45);
  function introBase(s, photoKey) {
    const file = INTRO_PHOTOS[photoKey] ? asset(INTRO_PHOTOS[photoKey]) : photoKey;
    s.addImage({ data: imgData(file), x: 0, y: 0, w: W, h: H, objectName: nm("Intro background"), altText: "Campus Universidad Westhill" });
    s.addImage({ data: SHIELD, x: IC - 0.72, y: -0.42, w: 1.44, h: 1.44 * 233 / 194, objectName: nm("Logo Westhill") });
    text(s, [{ text: "#SOMOS", options: { bold: false } }, { text: "WESTHILL", options: { bold: true } }], { x: 9.2, y: 6.95, w: 3.2, h: 0.4, fontSize: 17, color: WHITE, valign: "middle", objectName: "Hashtag" });
  }
  async function cover(title, o = {}) {
    STEP = 0;
    const s = addSlide("Westhill Intro", useSection(o.section || "Portada"));
    introBase(s, o.photo || "edificio");
    STEP = 1; text(s, title, { x: IX, y: 2.6, w: IW, h: 1.8, align: "center", fontSize: o.fontSize || 44, bold: true, color: BLUE, valign: "middle", objectName: "Cover title" });
    if (o.subtitle) { STEP = 2; text(s, o.subtitle, { x: IX, y: 4.45, w: IW, h: 0.6, align: "center", fontSize: 22, bold: true, color: BLUE, valign: "middle", objectName: "Cover subtitle" }); }
    STEP = 0;
    return s;
  }
  async function section(n, title, o = {}) {
    STEP = 0;
    const s = addSlide("Westhill Intro", useSection(o.section || title));
    introBase(s, o.photo || "rotonda");
    STEP = 1; text(s, n, { x: IX, y: 2.1, w: IW, h: 1.3, align: "center", fontSize: 88, bold: true, color: GOLD, valign: "bottom", objectName: "Section number" });
    STEP = 2; text(s, "SECCIÓN", { x: IX, y: 3.47, w: IW, h: 0.32, align: "center", fontSize: 14, bold: true, color: BLUE, charSpacing: 6, objectName: "Section kicker" });
    STEP = 3; text(s, title, { x: IX, y: 3.83, w: IW, h: 1.4, align: "center", fontSize: 38, bold: true, color: BLUE, valign: "top", objectName: "Section title" });
    STEP = 0;
    return s;
  }
  async function closing(o = {}) {
    STEP = 0;
    const s = addSlide("Westhill Intro", useSection(o.section || "Cierre"));
    introBase(s, o.photo || "letras");
    STEP = 1; text(s, o.headline || "#SOMOSWESTHILL", { x: IX, y: 2.6, w: IW, h: 0.8, align: "center", fontSize: 36, bold: true, color: BLUE, valign: "middle", objectName: "Closing headline" });
    if (o.line1) { STEP = 2; text(s, o.line1, { x: IX, y: 3.4, w: IW, h: 0.5, align: "center", fontSize: o.line1Size || 20, bold: true, color: NAVY, valign: "middle", objectName: "Closing line 1" }); }
    if (o.line2) { STEP = 3; text(s, o.line2, { x: IX, y: 3.85, w: IW, h: 0.45, align: "center", fontSize: 17, color: MUTED, valign: "middle", objectName: "Closing line 2" }); }
    STEP = 4; pill(s, o.handle || "@univwesthill", IC - 1.45, 4.55, 2.9, 0.56, GOLD, NAVY, { fontSize: 16, charSpacing: 1, objectName: "Handle" });
    STEP = 0;
    return s;
  }

  async function save(out) {
    await pres.writeFile({ fileName: out });
    await applyTheme(out);
    execFileSync("python3", [path.join(__dirname, "animate.py"), out], { stdio: "inherit" });
    return out;
  }

  return {
    pres, COL, HEX, FONT, W, H, M, VBAND, REAL, LOGO_WHITE, LOGO_COLOR, LOGO_RATIO,
    step, nm, sh, setBand, realCoords, text, bullets, pill, card, badge, watermark, subtitle, note, framed, photo,
    cover, section, closing, contentSlide, save, imgData, asset,
  };
}

module.exports = { createDeck, HEX, FONT, ASSETS };
