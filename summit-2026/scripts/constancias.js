// Constancias del Westhill Medical Leadership Summit 2026 (tamaño carta horizontal, textos editables).
//   node scripts/constancias.js            -> ponentes (desde datos/programa.json) + participantes (desde datos/participantes.csv)
// Después convierte a PDF con: bash scripts/pdf.sh  (lo hace scripts/generar_todo.sh)
const path = require("path");
const fs = require("fs");
const pptxgen = require("pptxgenjs");
const sharp = require("sharp");
const ROOT = path.join(__dirname, "..");
const DATA = JSON.parse(fs.readFileSync(path.join(ROOT, "datos/programa.json"), "utf8"));
const EV = DATA.evento;
const MARCA = (f) => path.join(ROOT, "marca", f);
const FONT = "Raleway";
const C = { navy: "0E2A47", blue: "266294", gold: "F2C94C", goldDeep: "C9A227", ice: "EDF3FA", muted: "5B6B7D", ink: "15243A" };
const W = 11, H = 8.5, DPI = 150;

const R = (text, bold = false) => ({ text, options: { bold } });
const b64 = (buf, mime = "png") => `image/${mime};base64,` + buf.toString("base64");

// Fondo: marco doble (marino + dorado) y ola institucional azul con filo dorado abajo.
async function background() {
  const pw = W * DPI, ph = H * DPI;
  const wave = (dy) => `M0,${1150 + dy} C420,${1085 + dy} 980,${1225 + dy} ${pw},${1110 + dy} L${pw},${ph} L0,${ph} Z`;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${pw}" height="${ph}">
    <rect width="${pw}" height="${ph}" fill="#FFFFFF"/>
    <rect x="38" y="38" width="${pw - 76}" height="${ph - 76}" fill="none" stroke="#0E2A47" stroke-width="5"/>
    <rect x="56" y="56" width="${pw - 112}" height="${ph - 112}" fill="none" stroke="#F2C94C" stroke-width="2.5"/>
    <path d="${wave(-16)}" fill="#F2C94C"/>
    <path d="${wave(0)}" fill="#266294"/>
  </svg>`;
  return b64(await sharp(Buffer.from(svg)).png().toBuffer());
}

function addCertificate(pres, bg, logo, o) {
  const s = pres.addSlide();
  s.background = { data: bg };
  const t = (text, opt) => s.addText(text, { fontFace: FONT, margin: 0, align: "center", valign: "middle", isTextBox: true, ...opt });
  const LW = 2.7, LH = LW * 313 / 779;
  s.addImage({ data: logo, x: (W - LW) / 2, y: 0.55, w: LW, h: LH, altText: "Universidad Westhill" });
  t(`La ${EV.organiza} de la ${EV.universidad} otorga la presente`, { x: 1, y: 1.78, w: W - 2, h: 0.36, fontSize: 14, color: C.muted });
  t("CONSTANCIA", { x: 1, y: 2.14, w: W - 2, h: 0.72, fontSize: 42, bold: true, color: C.blue, charSpacing: 10 });
  if (o.kicker) t(o.kicker, { x: (W - 2.6) / 2, y: 2.9, w: 2.6, h: 0.34, shape: pres.shapes.ROUNDED_RECTANGLE, rectRadius: 0.17, fill: { color: C.gold }, fontSize: 11, bold: true, color: C.navy, charSpacing: 4 });
  t("a", { x: 1, y: 3.26, w: W - 2, h: 0.3, fontSize: 13, color: C.muted });
  t(o.nombre, { x: 0.9, y: 3.55, w: W - 1.8, h: 0.78, fontSize: o.nombre.length > 38 ? 28 : 32, bold: true, color: C.navy, fit: "shrink" });
  s.addShape(pres.shapes.LINE, { x: (W - 6.4) / 2, y: 4.4, w: 6.4, h: 0, line: { color: C.gold, width: 2 } });
  t(o.cuerpo, { x: 1.1, y: 4.6, w: W - 2.2, h: 1.6, fontSize: 15, color: C.ink, lineSpacingMultiple: 1.15, valign: "top", fit: "shrink" });
  // Firmas (nombres y cargos por definir por el Comité Organizador)
  for (const cx of [3.0, 8.0]) {
    s.addShape(pres.shapes.LINE, { x: cx - 1.55, y: 6.55, w: 3.1, h: 0, line: { color: C.navy, width: 1 } });
    t("Nombre y firma", { x: cx - 1.7, y: 6.6, w: 3.4, h: 0.26, fontSize: 11, bold: true, color: C.navy });
    t("Cargo", { x: cx - 1.7, y: 6.85, w: 3.4, h: 0.24, fontSize: 10, color: C.muted });
  }
  t([{ text: EV.nombre, options: { bold: true } }, { text: `   ·   ${EV.fechas}`, options: { bold: false } }],
    { x: 0.75, y: 7.98, w: 7.4, h: 0.3, fontSize: 10.5, color: "FFFFFF", align: "left" });
  t([{ text: "#SOMOS", options: { bold: false } }, { text: "WESTHILL", options: { bold: true } }], { x: 8.0, y: 7.98, w: 2.3, h: 0.3, fontSize: 12, color: "FFFFFF", align: "right" });
  return s;
}

function newPres(title) {
  const pres = new pptxgen();
  pres.defineLayout({ name: "CARTA_H", width: W, height: H });
  pres.layout = "CARTA_H";
  pres.theme = { headFontFace: FONT, bodyFontFace: FONT };
  pres.title = title; pres.author = EV.universidad; pres.company = EV.universidad;
  return pres;
}

function ponentes() {
  const out = [];
  for (const d of DATA.dias) for (const a of d.actividades) {
    if (!a.ponente) continue;
    out.push({
      nombre: a.ponente,
      dia: d,
      act: a,
      cuerpo: [
        R(`por su valiosa participación como ponente ${a.tipo === "mesa" ? "en la " : "con la conferencia "}`), R(`«${a.titulo}»`, true),
        R(`, impartida el ${d.dia.toLowerCase()} ${d.fecha} de 2026 en el `), R(EV.nombre_corto, true), R(`: «${EV.lema}».`),
      ],
    });
  }
  return out;
}

function leerCSV(file) {
  if (!fs.existsSync(file)) return [];
  return fs.readFileSync(file, "utf8").split(/\r?\n/).slice(1).map((l) => l.split(",")[0].replace(/^"|"$/g, "").trim()).filter(Boolean);
}

const slug = (s) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^A-Za-z0-9]+/g, "_").replace(/^_|_$/g, "");

(async () => {
  const bg = await background();
  const logo = b64(fs.readFileSync(MARCA("logo_westhill_color.png")));
  const CUERPO_PART = [R("por su asistencia al "), R(EV.nombre_corto, true), R(`: «${EV.lema}», celebrado los días ${EV.fechas} en las instalaciones de la ${EV.universidad}.`)];

  // Ponentes: una diapositiva por ponente, en orden del programa.
  const dirP = path.join(ROOT, "entregables/04_constancias_ponentes");
  fs.mkdirSync(dirP, { recursive: true });
  let pres = newPres("Constancias ponentes WMLS 2026");
  const lista = ponentes();
  for (const p of lista) addCertificate(pres, bg, logo, { ...p, kicker: "PONENTE" });
  await pres.writeFile({ fileName: path.join(dirP, "Constancias_Ponentes_WMLS2026.pptx") });
  fs.writeFileSync(path.join(dirP, "orden.json"), JSON.stringify(lista.map((p, i) => ({ pagina: i + 1, archivo: `${String(i + 1).padStart(2, "0")}_${slug(p.nombre)}.pdf`, ponente: p.nombre })), null, 2));
  // Plantilla vacía para ponentes que se agreguen después.
  pres = newPres("Plantilla constancia ponente WMLS 2026");
  addCertificate(pres, bg, logo, { nombre: "Nombre del ponente", kicker: "PONENTE", cuerpo: [R("por su valiosa participación como ponente con la conferencia "), R("«Título de la conferencia»", true), R(", impartida el día de la semana __ de octubre de 2026 en el "), R(EV.nombre_corto, true), R(`: «${EV.lema}».`)] });
  await pres.writeFile({ fileName: path.join(dirP, "Plantilla_Constancia_Ponente_WMLS2026.pptx") });

  // Participantes: plantilla + lote desde CSV (si hay nombres).
  const dirA = path.join(ROOT, "entregables/03_constancias_participantes");
  fs.mkdirSync(dirA, { recursive: true });
  pres = newPres("Plantilla constancia participante WMLS 2026");
  addCertificate(pres, bg, logo, { nombre: "Nombre del participante", kicker: "PARTICIPANTE", cuerpo: CUERPO_PART });
  await pres.writeFile({ fileName: path.join(dirA, "Plantilla_Constancia_Participante_WMLS2026.pptx") });
  const nombres = leerCSV(path.join(ROOT, "datos/participantes.csv"));
  if (nombres.length) {
    pres = newPres("Constancias participantes WMLS 2026");
    for (const n of nombres) addCertificate(pres, bg, logo, { nombre: n, kicker: "PARTICIPANTE", cuerpo: CUERPO_PART });
    await pres.writeFile({ fileName: path.join(dirA, "Constancias_Participantes_WMLS2026.pptx") });
  }
  console.log(`Ponentes: ${lista.length} · Participantes en CSV: ${nombres.length}`);
})().catch((e) => { console.error(e); process.exit(1); });
