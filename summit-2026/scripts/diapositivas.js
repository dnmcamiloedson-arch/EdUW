// Plantilla oficial de diapositivas + programa para pantallas del Westhill Medical Leadership Summit 2026.
// Ejecutar desde summit-2026/:  node scripts/diapositivas.js
const path = require("path");
const fs = require("fs");
const { createDeck } = require("./westhill-lib/scripts/westhill.js");
const ROOT = path.join(__dirname, "..");
const DATA = JSON.parse(fs.readFileSync(path.join(ROOT, "datos/programa.json"), "utf8"));
const EV = DATA.evento;
const OUT = path.join(ROOT, "entregables/01_diapositivas");
fs.mkdirSync(OUT, { recursive: true });

// Marco punteado para indicar dónde va una imagen (el ponente la reemplaza).
async function imageSlot(d, s, x, y, w, h, label = "Inserta aquí tu imagen") {
  const { COL, step, text, card, badge, pres, nm } = d;
  await card(s, x, y, w, h, "ice", { name: "Image slot", flat: true, r: 0.16 });
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y, w, h, rectRadius: 0.16, fill: { type: "none" }, line: { color: "8FB3D9", width: 1.5, dashType: "dash" }, objectName: nm("Image slot outline") });
  await badge(s, "FaImage", x + w / 2 - 0.4, y + h / 2 - 0.6, 0.8, "white", 0.45);
  text(s, label, { x: x + 0.2, y: y + h / 2 + 0.3, w: w - 0.4, h: 0.4, fontSize: 13, color: COL.MUTED, align: "center", objectName: "Image slot label" });
}

async function plantilla() {
  const d = createDeck({ title: "Plantilla Westhill Medical Leadership Summit 2026" });
  const { pres, COL, W, M, step, nm, text, bullets, pill, card, badge, watermark, note } = d;
  const { NAVY, INK, WHITE, BLUE, GOLD, MIST, MUTED } = COL;
  let s;

  // 1. Portada del Summit
  await d.cover(EV.nombre, { photo: "edificio", fontSize: 33, section: "Portada" });

  // 2. Portada de la ponencia
  await d.cover("Título de la ponencia", { photo: "rotonda", subtitle: "Nombre del ponente", fontSize: 36, section: "Portada de ponencia" });

  // 3. Presentación del ponente
  s = d.contentSlide("Presentación del ponente", { section: "Ponente" });
  step(1); await imageSlot(d, s, M, 1.8, 3.9, 4.8, "Fotografía del ponente");
  step(2);
  text(s, "PONENTE", { x: 4.95, y: 1.85, w: 7.5, h: 0.35, fontSize: 13, bold: true, color: BLUE, charSpacing: 6, objectName: "Speaker kicker" });
  text(s, "Nombre del ponente", { x: 4.95, y: 2.2, w: 7.7, h: 0.75, fontSize: 32, bold: true, color: NAVY, valign: "middle", objectName: "Speaker name" });
  text(s, "Cargo, especialidad o institución", { x: 4.95, y: 2.95, w: 7.7, h: 0.45, fontSize: 17, color: MUTED, valign: "middle", objectName: "Speaker role" });
  step(3);
  await card(s, 4.95, 3.7, 7.78, 2.9, "dark", { name: "Talk card" });
  await watermark(s, "FaStethoscope", 10.9, 4.55, 1.8, "24507D");
  await badge(s, "FaMicrophoneLines", 5.3, 4.0, 0.75, "gold");
  text(s, "PONENCIA", { x: 6.25, y: 4.0, w: 4, h: 0.75, fontSize: 15, bold: true, color: GOLD, charSpacing: 5, valign: "middle", objectName: "Talk label" });
  text(s, "Título de la ponencia", { x: 5.3, y: 4.95, w: 6.9, h: 1.0, fontSize: 24, bold: true, color: WHITE, valign: "top", objectName: "Talk title" });
  step(4);
  pill(s, "Día · Horario", 5.3, 5.95, 2.6, 0.42, GOLD, "0E2A47", { fontSize: 12, charSpacing: 1, objectName: "Talk time" });

  // 4. Portada de sección
  await d.section("01", "Título de la sección", { photo: "letras", section: "Sección" });

  // 5. Texto + idea clave + lista con íconos
  s = d.contentSlide("Título de la diapositiva", { section: "Contenido", subtitle: "Subtítulo opcional de la diapositiva" });
  step(1);
  text(s, "Escribe aquí el texto principal. Usa frases cortas: la diapositiva acompaña tu exposición, no la sustituye.",
    { x: M, y: 2.05, w: 6.6, h: 1.2, fontSize: 17, color: INK, valign: "top", lineSpacingMultiple: 1.12, objectName: "Body text" });
  step(2);
  await card(s, M, 3.4, 6.6, 3.2, "dark", { name: "Key idea card" });
  await watermark(s, "FaLightbulb", M + 4.7, 3.6, 1.7, "24507D");
  await badge(s, "FaLightbulb", M + 0.4, 3.7, 0.8, "gold");
  text(s, "IDEA CLAVE", { x: M + 1.4, y: 3.7, w: 4, h: 0.8, fontSize: 16, bold: true, color: GOLD, charSpacing: 5, valign: "middle", objectName: "Key idea label" });
  text(s, "El mensaje más importante de la diapositiva va en esta tarjeta destacada.",
    { x: M + 0.4, y: 4.7, w: 5.8, h: 1.6, fontSize: 18, color: WHITE, valign: "top", lineSpacingMultiple: 1.12, objectName: "Key idea text" });
  step(3);
  await card(s, 7.6, 1.9, 5.13, 4.7, "light", { name: "List card" });
  text(s, "Puntos a desarrollar", { x: 7.95, y: 2.1, w: 4.6, h: 0.55, fontSize: 19, bold: true, color: NAVY, valign: "middle", objectName: "List title" });
  const pts = [["FaStethoscope", "Primer punto"], ["FaHeartPulse", "Segundo punto"], ["FaMicroscope", "Tercer punto"], ["FaUserDoctor", "Cuarto punto"], ["FaStar", "Punto destacado"]];
  for (let i = 0; i < pts.length; i++) {
    const y = 2.85 + i * 0.73; step(4 + i);
    await badge(s, pts[i][0], 7.95, y, 0.54, i === 4 ? "gold" : "blue");
    text(s, pts[i][1], { x: 8.7, y, w: 3.85, h: 0.54, fontSize: 15, color: INK, valign: "middle", objectName: "List item" });
  }

  // 6. Tres conceptos en columnas
  s = d.contentSlide("Tres conceptos", { section: "Contenido" });
  const cols = [
    { k: "CONCEPTO 1", icon: "FaBookMedical", style: "light" },
    { k: "CONCEPTO 2", icon: "FaNotesMedical", style: "light" },
    { k: "CONCEPTO 3", icon: "FaKitMedical", style: "dark" },
  ];
  const pw = 3.84, pg = 0.33;
  for (let i = 0; i < 3; i++) {
    const c = cols[i], x = M + i * (pw + pg), y = 1.8, dark = c.style === "dark"; step(i + 1);
    await card(s, x, y, pw, 4.85, c.style, { name: "Concept card" });
    if (dark) await watermark(s, c.icon, x + pw - 1.55, y + 4.85 - 1.45, 1.25, "24507D");
    await badge(s, c.icon, x + 0.35, y + 0.35, 0.9, dark ? "gold" : "blue");
    if (dark) pill(s, "DESTACADO", x + pw - 1.75, y + 0.5, 1.4, 0.36, GOLD, "0E2A47", { fontSize: 10, objectName: "Highlight tag" });
    text(s, c.k, { x: x + 0.35, y: y + 1.45, w: pw - 0.7, h: 0.3, fontSize: 11, bold: true, color: dark ? GOLD : BLUE, charSpacing: 5, objectName: "Concept kicker" });
    text(s, "Título breve", { x: x + 0.35, y: y + 1.75, w: pw - 0.7, h: 0.6, fontSize: 25, bold: true, color: dark ? WHITE : NAVY, objectName: "Concept title" });
    text(s, bullets(["Idea de apoyo", "Idea de apoyo", "Idea de apoyo"], 8), { x: x + 0.35, y: y + 2.5, w: pw - 0.6, h: 2.2, fontSize: 15, color: dark ? WHITE : INK, valign: "top", objectName: "Concept items" });
  }

  // 7. Imagen + texto
  s = d.contentSlide("Imagen y descripción", { section: "Contenido" });
  step(1); await imageSlot(d, s, M, 1.8, 7.0, 4.85, "Inserta aquí tu imagen, estudio o gráfica");
  step(2);
  await card(s, 7.95, 1.8, 4.78, 4.85, "light", { name: "Caption card" });
  await badge(s, "FaMagnifyingGlass", 8.3, 2.1, 0.7, "blue");
  text(s, "Hallazgos", { x: 9.15, y: 2.1, w: 3.4, h: 0.7, fontSize: 21, bold: true, color: NAVY, valign: "middle", objectName: "Caption title" });
  text(s, bullets(["Describe lo que se observa.", "Señala el dato relevante.", "Relaciónalo con la práctica clínica."], 10),
    { x: 8.3, y: 3.05, w: 4.1, h: 2.4, fontSize: 15, color: INK, valign: "top", objectName: "Caption items" });
  step(3);
  text(s, "Fuente: autor, año.", { x: 8.3, y: 5.95, w: 4.1, h: 0.4, fontSize: 11, color: MUTED, italic: true, objectName: "Caption source" });

  // 8. Cifras destacadas
  s = d.contentSlide("Datos relevantes", { section: "Contenido" });
  const nums = [["00%", "Descripción breve del dato", "light"], ["000", "Descripción breve del dato", "light"], ["00", "Dato principal", "dark"]];
  for (let i = 0; i < 3; i++) {
    const x = M + i * (pw + pg), y = 1.8, dark = nums[i][2] === "dark"; step(i + 1);
    await card(s, x, y, pw, 3.6, nums[i][2], { name: "Figure card" });
    await badge(s, ["FaChartLine", "FaUsers", "FaChartPie"][i], x + 0.35, y + 0.35, 0.8, dark ? "gold" : "blue");
    text(s, nums[i][0], { x: x + 0.35, y: y + 1.35, w: pw - 0.7, h: 1.1, fontSize: 54, bold: true, color: dark ? GOLD : BLUE, valign: "middle", objectName: "Figure number" });
    text(s, nums[i][1], { x: x + 0.35, y: y + 2.5, w: pw - 0.7, h: 0.8, fontSize: 16, color: dark ? WHITE : INK, valign: "top", objectName: "Figure label" });
  }
  step(4);
  await note(s, "Cita aquí la fuente de los datos (autor, institución, año).", M, 5.75, W - 2 * M, 0.75, 13);

  // 9. Tabla
  s = d.contentSlide("Tabla comparativa", { section: "Contenido", bottom: 6.93 });
  const head = ["Criterio", "Opción A", "Opción B", "Opción C"];
  const rows = [head.map((t, j) => ({ text: t, options: { bold: true, color: j === 3 ? "0E2A47" : WHITE, fill: { color: j === 3 ? GOLD : NAVY }, fontSize: 14, align: j ? "center" : "left" } }))];
  for (let i = 0; i < 6; i++) {
    const bg = i % 2 ? WHITE : "F3F7FC";
    rows.push(head.map((_, j) => ({ text: j ? "Dato" : `Criterio ${i + 1}`, options: { color: j ? BLUE : INK, bold: !!j, fill: { color: j === 3 ? "FFF4D2" : bg }, fontSize: 14, align: j ? "center" : "left" } })));
  }
  step(1);
  await card(s, M - 0.12, 1.68, W - 2 * M + 0.24, 4.2, "light", { name: "Table card", r: 0.14 });
  s.addTable(rows, { x: M, y: 1.8, w: W - 2 * M, colW: [4.53, 2.53, 2.53, 2.54], rowH: 0.52, valign: "middle", margin: [0, 0.15, 0, 0.15], border: { type: "none" }, fontFace: d.FONT, objectName: nm("Table") });
  step(2);
  await note(s, "Usa esta nota para aclaraciones, abreviaturas o la fuente de la tabla.", M - 0.12, 6.05, W - 2 * M + 0.24, 0.7, 12);

  // 10. Algoritmo / pasos
  s = d.contentSlide("Abordaje paso a paso", { section: "Contenido" });
  const steps = [
    { icon: "FaClipboardList", head: "Evaluación", body: "Describe el paso" },
    { icon: "FaVial", head: "Diagnóstico", body: "Describe el paso" },
    { icon: "FaPrescriptionBottleMedical", head: "Tratamiento", body: "Describe el paso", hot: true },
    { icon: "FaCalendarCheck", head: "Seguimiento", body: "Describe el paso" },
  ];
  const sw = 2.75, sgap = 0.35, sy = 1.9, shh = 4.5;
  for (let i = 0; i < 4; i++) {
    const st = steps[i], x = M + i * (sw + sgap); step(2 * i + 1);
    await card(s, x, sy, sw, shh, st.hot ? "dark" : "light", { name: "Step card" });
    if (st.hot) await watermark(s, st.icon, x + sw - 1.45, sy + shh - 1.35, 1.15, "24507D");
    text(s, String(i + 1).padStart(2, "0"), { x: x + 0.3, y: sy + 0.3, w: 1.3, h: 0.8, fontSize: 40, bold: true, color: st.hot ? GOLD : MIST, valign: "middle", objectName: "Step number" });
    await badge(s, st.icon, x + sw - 1.2, sy + 0.3, 0.9, st.hot ? "gold" : "blue");
    text(s, st.head, { x: x + 0.3, y: sy + 1.6, w: sw - 0.5, h: 0.9, fontSize: 20, bold: true, color: st.hot ? WHITE : NAVY, valign: "top", objectName: "Step head" });
    text(s, st.body, { x: x + 0.3, y: sy + 2.6, w: sw - 0.5, h: 1.4, fontSize: 16, color: st.hot ? GOLD : INK, bold: !!st.hot, valign: "top", objectName: "Step body" });
    step(2 * i + 2);
    if (i < 3) await badge(s, "FaChevronRight", x + sw + sgap / 2 - 0.24, sy + 2.0 - 0.24, 0.48, "gold", 0.4);
  }

  // 11. Conclusiones
  s = d.contentSlide("Conclusiones", { section: "Cierre de la ponencia" });
  step(1);
  await card(s, M, 1.8, 7.3, 4.85, "light", { name: "Conclusions card" });
  for (let i = 0; i < 4; i++) {
    const y = 2.15 + i * 1.08; step(2 + i);
    await badge(s, "FaCheck", M + 0.35, y, 0.6, "blue", 0.45);
    text(s, `Conclusión ${i + 1}: escribe aquí un mensaje breve.`, { x: M + 1.2, y, w: 5.9, h: 0.6, fontSize: 17, color: INK, valign: "middle", objectName: "Conclusion" });
  }
  step(6);
  await card(s, 8.2, 1.8, 4.53, 4.85, "dark", { name: "Take-home card" });
  await watermark(s, "FaUserDoctor", 10.85, 4.9, 1.6, "24507D");
  await badge(s, "FaStar", 8.55, 2.15, 0.8, "gold");
  text(s, "PARA LLEVAR A LA PRÁCTICA", { x: 8.55, y: 3.15, w: 3.9, h: 0.6, fontSize: 14, bold: true, color: GOLD, charSpacing: 3, valign: "top", objectName: "Take-home label" });
  text(s, "El mensaje que quieres que el público recuerde.", { x: 8.55, y: 3.85, w: 3.85, h: 1.6, fontSize: 20, bold: true, color: WHITE, valign: "top", objectName: "Take-home text" });

  // 12. Referencias
  s = d.contentSlide("Referencias", { section: "Cierre de la ponencia" });
  step(1);
  await card(s, M, 1.8, W - 2 * M, 4.85, "light", { name: "References card" });
  await badge(s, "FaBookOpen", M + 0.35, 2.1, 0.7, "blue");
  text(s, [1, 2, 3, 4, 5].map((n, i, a) => ({ text: `Autor A, Autor B. Título del artículo. Revista. Año;Vol(Núm):páginas.`, options: { bullet: { type: "number" }, breakLine: i < a.length - 1, paraSpaceAfter: 10 } })),
    { x: M + 1.3, y: 2.1, w: W - 2 * M - 1.7, h: 4.3, fontSize: 15, color: INK, valign: "top", objectName: "References" });

  // 13. Cierre
  await d.closing({ headline: "¡Gracias!", line1: EV.nombre_corto, line1Size: 15, line2: EV.fechas, photo: "letras" });

  return d.save(path.join(OUT, "Plantilla_Diapositivas_WMLS2026.pptx"));
}

// Programa para pantallas del auditorio (una diapositiva por día).
async function programaPantallas() {
  const d = createDeck({ title: "Programa Westhill Medical Leadership Summit 2026" });
  const { COL, W, M, step, nm, text, card, pill } = d;
  const { NAVY, INK, WHITE, BLUE, GOLD, MUTED } = COL;
  await d.cover(EV.nombre, { photo: "edificio", fontSize: 33 });
  for (const dia of DATA.dias) {
    const s = d.contentSlide(`${dia.dia} ${dia.fecha}`, { section: dia.dia, real: true });
    text(s, EV.lema, { abs: true, x: M, y: 2.0, w: 11.5, h: 0.38, fontSize: 15, color: MUTED, objectName: "Subtitle" });
    const acts = dia.actividades;
    const pausa = (a) => ["receso", "patrocinadores", "ceremonia"].includes(a.tipo);
    const rows = [[
      { text: "Horario", options: { bold: true, color: "0E2A47", fill: { color: GOLD }, align: "center" } },
      { text: "Actividad / ponencia", options: { bold: true, color: WHITE, fill: { color: NAVY } } },
      { text: "Ponente", options: { bold: true, color: WHITE, fill: { color: NAVY } } },
    ]];
    acts.forEach((a, i) => {
      const bg = pausa(a) ? "FFF4D2" : (i % 2 ? WHITE : "F3F7FC");
      rows.push([
        { text: `${a.inicio}–${a.fin}`, options: { bold: true, color: BLUE, fill: { color: bg }, align: "center" } },
        { text: a.titulo, options: { bold: pausa(a), color: pausa(a) ? NAVY : INK, fill: { color: bg } } },
        { text: a.ponente ? [{ text: a.ponente, options: { breakLine: !!a.cargo } }, ...(a.cargo ? [{ text: a.cargo, options: { fontSize: 10, color: MUTED } }] : [])] : "", options: { color: NAVY, bold: false, fill: { color: bg } } },
      ]);
    });
    rows.push([
      { text: dia.fin, options: { bold: true, color: GOLD, fill: { color: NAVY }, align: "center" } },
      { text: "Fin de la jornada", options: { bold: true, color: WHITE, fill: { color: NAVY } } },
      { text: "", options: { fill: { color: NAVY } } },
    ]);
    const n = rows.length, top = 2.5, avail = 6.95 - top, rh = Math.min(0.46, avail / n);
    step(1);
    s.addTable(rows, { x: M, y: top, w: W - 2 * M, colW: [1.55, 6.0, 4.58], rowH: rh, valign: "middle", margin: [0.02, 0.12, 0.02, 0.12], border: { type: "solid", color: "FFFFFF", pt: 1 }, fontFace: d.FONT, fontSize: n > 11 ? 13 : 15, objectName: nm("Program table") });
  }
  await d.closing({ line1: EV.nombre_corto, line1Size: 15, line2: EV.fechas, photo: "letras" });
  return d.save(path.join(OUT, "Programa_Pantallas_WMLS2026.pptx"));
}

(async () => {
  console.log(await plantilla());
  console.log(await programaPantallas());
})().catch((e) => { console.error(e); process.exit(1); });
