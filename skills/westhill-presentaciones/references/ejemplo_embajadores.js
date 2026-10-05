// Ejemplo completo: "Embajadores Westhill" (la presentación de referencia aprobada por la Universidad).
// Úsalo como catálogo de patrones de diapositiva; copia y adapta los bloques que necesites.
// Ejecutar: NODE_PATH=<work>/node_modules EJEMPLO_IMG=<carpeta con capturas> node ejemplo_embajadores.js
// Las capturas (flyer, procesos, tablero, hojas) eran archivos del proyecto; sin ellas esas diapositivas fallan.
const path = require("path");
const { createDeck } = require(path.join(__dirname, "..", "scripts", "westhill.js"));
const IMG = (f) => path.join(process.env.EJEMPLO_IMG || ".", f);
const OUT = process.env.OUT || "Embajadores_Westhill.pptx";
const d = createDeck({ title: "Embajadores Westhill 2.0" });
const { pres, COL, W, M, step, nm, sh, text, bullets, pill, card, badge, watermark, subtitle } = d;
const { NAVY, INK, WHITE, ICE, BLUE, GOLD, MIST, MUTED } = COL;
const BONO_NOTE = "El bono se aplica una vez que el referido se encuentra inscrito y salvo a las políticas vigentes de la universidad. No es acumulativo y solo es válido dentro del mes.";

(async () => {
  // =============== 1. COVER ===============
  await d.cover("EMBAJADORES WESTHILL", { photo: "edificio" });

  // =============== SECTION 01 ===============
  await d.section("01", "El programa", { photo: "rotonda", section: "Programa" });

  // =============== 2. PROGRAMA ===============
  s = d.contentSlide("Embajadores Westhill 2.0", { section: "Programa" });
  step(1);
  text(s, "El programa de Embajadores Westhill es una iniciativa para que nuestros estudiantes compartan su experiencia, representen a la Universidad y ayuden a más jóvenes a descubrir su camino profesional.",
    { x: M, y: 1.8, w: 6.6, h: 1.6, fontSize: 17, color: INK, valign: "top", lineSpacingMultiple: 1.12, objectName: "Program description" });
  step(2);
  await card(s, M, 3.55, 6.6, 3.1, "dark", { name: "Objective card" });
  await watermark(s, "FaBullseye", M + 4.6, 3.7, 1.8, "24507D");
  await badge(s, "FaBullseye", M + 0.4, 3.9, 0.8, "gold");
  text(s, "OBJETIVO", { x: M + 1.4, y: 3.9, w: 4, h: 0.8, fontSize: 16, bold: true, color: GOLD, charSpacing: 5, valign: "middle", objectName: "Objective label" });
  text(s, "Generar más prospectos e inscritos, fortaleciendo el sentido de pertenencia de nuestros estudiantes y posicionando a Westhill a través de su voz auténtica.",
    { x: M + 0.4, y: 4.9, w: 5.8, h: 1.55, fontSize: 17, color: WHITE, valign: "top", lineSpacingMultiple: 1.12, objectName: "Objective text" });
  step(3);
  await card(s, 7.6, 1.8, 5.13, 4.85, "light", { name: "Why card" });
  text(s, "¿Por qué ser embajador?", { x: 7.95, y: 2.0, w: 4.6, h: 0.55, fontSize: 19, bold: true, color: NAVY, valign: "middle", objectName: "Why title" });
  const why = [["FaHandHoldingHeart", "Haces la diferencia en la vida de otros."], ["FaBuildingColumns", "Fortalece tu universidad."], ["FaRankingStar", "Desarrollas habilidades de liderazgo."], ["FaGift", "Obtienes incentivos y reconocimientos."], ["FaStar", "Vives experiencias únicas."]];
  for (let i = 0; i < why.length; i++) {
    const y = 2.75 + i * 0.76; step(4 + i);
    await badge(s, why[i][0], 7.95, y, 0.56, i === 4 ? "gold" : "blue");
    text(s, why[i][1], { x: 8.7, y, w: 3.85, h: 0.56, fontSize: 15, color: INK, valign: "middle", objectName: "Why item" });
  }

  // =============== 3. PERFILES ===============
  s = d.contentSlide("Se basa en 3 perfiles", { section: "Programa" });
  const profiles = [
    { name: "CONECTA", icon: "FaShareNodes", style: "light", items: ["Comparte Westhill con amigos, familiares y conocidos.", "Invita a eventos.", "Genera prospectos con tu código o enlace personal."] },
    { name: "EXPERIENCIA", icon: "FaUserGraduate", style: "light", items: ["Participa en eventos, ferias y webinars.", "Comparte tu experiencia como estudiante.", "Graba testimonios y contenido.", "Acompaña a prospectos en visitas."] },
    { name: "LÍDER", icon: "FaCrown", style: "dark", items: ["Es un alumno destacado que representa a Westhill.", "Participa en campañas institucionales.", "Apoya en eventos de atracción.", "Puede ser parte de videos y material de promoción."] },
  ];
  const pw = 3.84, pg = 0.33;
  for (let i = 0; i < 3; i++) {
    const p = profiles[i], x = M + i * (pw + pg), y = 1.75, dark = p.style === "dark"; STEP = i + 1;
    await card(s, x, y, pw, 4.95, p.style, { name: "Profile card" });
    if (dark) await watermark(s, p.icon, x + pw - 1.55, y + 4.95 - 1.45, 1.25, "24507D");
    await badge(s, p.icon, x + 0.35, y + 0.35, 0.9, dark ? "gold" : "blue");
    if (dark) pill(s, "DESTACADO", x + pw - 1.75, y + 0.5, 1.4, 0.36, GOLD, NAVY, { fontSize: 10, objectName: "Highlight tag" });
    text(s, "EMBAJADOR", { x: x + 0.35, y: y + 1.45, w: pw - 0.7, h: 0.3, fontSize: 11, bold: true, color: dark ? GOLD : BLUE, charSpacing: 5, objectName: "Profile kicker" });
    text(s, p.name, { x: x + 0.35, y: y + 1.75, w: pw - 0.7, h: 0.6, fontSize: 27, bold: true, color: dark ? WHITE : NAVY, objectName: "Profile name" });
    text(s, bullets(p.items, 8), { x: x + 0.35, y: y + 2.5, w: pw - 0.6, h: 2.3, fontSize: 14, color: dark ? WHITE : INK, valign: "top", objectName: "Profile items" });
  }

  // =============== SECTION 02 ===============
  await d.section("02", "¿Cómo funciona?", { photo: "letras", section: "Mecánica" });

  // =============== 4. COMO FUNCIONA ===============
  s = d.contentSlide("¿Cómo funciona?", { section: "Mecánica" });
  const steps = [
    { icon: "FaQrcode", head: "Comparte", body: "QR personalizado" },
    { icon: "FaCalendarCheck", head: "Tus referidos", body: "Agendan su visita" },
    { icon: "FaMoneyBillWave", head: "Si se inscribe", body: "Recibes un Bono económico", hot: true },
    { icon: "FaTrophy", head: "Acumulas Puntos.", body: ["Subes de nivel", "Beneficios"] },
  ];
  const sw = 2.75, sgap = 0.35, sy = 1.9, shh = 4.5;
  for (let i = 0; i < 4; i++) {
    const st = steps[i], x = M + i * (sw + sgap); step(2 * i + 1);
    await card(s, x, sy, sw, shh, st.hot ? "dark" : "light", { name: "Step card" });
    if (st.hot) await watermark(s, "FaMoneyBillWave", x + sw - 1.45, sy + shh - 1.35, 1.15, "24507D");
    text(s, String(i + 1).padStart(2, "0"), { x: x + 0.3, y: sy + 0.3, w: 1.3, h: 0.8, fontSize: 40, bold: true, color: st.hot ? GOLD : MIST, valign: "middle", objectName: "Step number" });
    await badge(s, st.icon, x + sw - 1.2, sy + 0.3, 0.9, st.hot ? "gold" : "blue");
    text(s, st.head, { x: x + 0.3, y: sy + 1.6, w: sw - 0.5, h: 0.9, fontSize: 20, bold: true, color: st.hot ? WHITE : NAVY, valign: "top", objectName: "Step head" });
    const body = Array.isArray(st.body) ? bullets(st.body, 6) : st.body;
    text(s, body, { x: x + 0.3, y: sy + 2.6, w: sw - 0.5, h: 1.4, fontSize: 16, color: st.hot ? GOLD : INK, bold: !!st.hot, valign: "top", objectName: "Step body" });
    step(2 * i + 2);
    if (i < 3) await badge(s, "FaChevronRight", x + sw + sgap / 2 - 0.24, sy + 2.0 - 0.24, 0.48, "gold", 0.4);
  }

  // =============== 5. PUNTOS + BONO ===============
  s = d.contentSlide("Sistema de puntos", { section: "Mecánica", bottom: 6.93 });
  const acts = [["Registrar un referido", 10], ["Referido asiste a eventos", 20], ["Referido agenda entrevista", 30], ["Referido inicia admisión", 50], ["Referido se inscribe", 100], ["Participar en eventos promocionales", 30], ["Participar en ferias", 30], ["Grabar testimonios", 30], ["Invitar a 5 prospectos a un evento", 50]];
  const rows = [[
    { text: "Actividades", options: { bold: true, color: WHITE, fill: { color: NAVY }, fontSize: 14 } },
    { text: "Puntos", options: { bold: true, color: NAVY, fill: { color: GOLD }, fontSize: 14, align: "center" } },
  ]];
  acts.forEach(([a, p], i) => {
    const top = p === 100;
    rows.push([
      { text: a, options: { color: top ? NAVY : INK, bold: top, fill: { color: top ? "FFF4D2" : (i % 2 ? WHITE : "F3F7FC") }, fontSize: 13.5 } },
      { text: String(p), options: { color: top ? NAVY : BLUE, bold: true, fill: { color: top ? GOLD : (i % 2 ? WHITE : "F3F7FC") }, fontSize: 15, align: "center" } },
    ]);
  });
  step(1);
  await card(s, M - 0.12, 1.68, 7.54, 4.44, "light", { name: "Table card", r: 0.14 });
  s.addTable(rows, { x: M, y: 1.8, w: 7.3, colW: [5.6, 1.7], rowH: 0.42, valign: "middle", margin: [0, 0.15, 0, 0.15], border: { type: "none" }, fontFace: d.FONT, objectName: nm("Points table") });
  const bx = 8.35, bw = W - M - bx; step(2);
  await card(s, bx, 1.68, bw, 4.44, "dark", { name: "Bonus card" });
  await badge(s, "FaMoneyBillWave", bx + 0.35, 1.95, 0.75, "gold");
  text(s, "BONO ECONÓMICO", { x: bx + 1.25, y: 1.95, w: bw - 1.4, h: 0.75, fontSize: 16, bold: true, color: GOLD, charSpacing: 2, valign: "middle", objectName: "Bonus label" });
  const bono = [["$2,000", "1 invitado inscrito"], ["$3,500", "2 invitados inscritos"], ["$5,000", "3 invitados inscritos"]];
  for (let i = 0; i < 3; i++) {
    const y = 2.9 + i * 1.02; step(3 + i);
    if (i === 2) await card(s, bx + 0.2, y - 0.15, bw - 0.4, 0.95, "gold", { name: "Top bonus highlight", r: 0.12, flat: true });
    text(s, bono[i][0], { x: bx + 0.4, y, w: 2.1, h: 0.65, fontSize: 30, bold: true, color: i === 2 ? NAVY : WHITE, valign: "middle", objectName: "Bonus amount" });
    text(s, bono[i][1], { x: bx + 2.5, y, w: bw - 2.7, h: 0.65, fontSize: 14, bold: i === 2, color: i === 2 ? NAVY : MIST, valign: "middle", objectName: "Bonus label" });
    if (i === 0) s.addShape(pres.shapes.LINE, { x: bx + 0.4, y: y + 0.84, w: bw - 0.8, h: 0, line: { color: "2B5A88", width: 1 }, objectName: nm("Divider") });
  }

  step(6);
  await d.note(s, BONO_NOTE, M - 0.12, 6.24, W - 2 * M + 0.12, 0.66, 12);

  // =============== 6. RECORRIDO ===============
  s = d.contentSlide("El recorrido del embajador", { section: "Mecánica" });
  subtitle(s, "El verdadero valor del programa es el siguiente recorrido:");
  const journey = [["FaUserGraduate", "Alumno"], ["FaShareNodes", "Comparte"], ["FaUsers", "Prospectos"], ["FaCalendarDays", "Eventos"], ["FaUserTie", "Asesor"], ["FaFileSignature", "Inscripción"], ["FaTrophy", "Recompensa"]];
  const jd = 1.4, jstep = 1.8, jx0 = M + 0.05, YU = 2.85, YD = 4.65;
  const pos = (i) => ({ x: jx0 + i * jstep, y: i % 2 ? YD : YU });
  for (let i = 0; i < journey.length - 1; i++) {
    const a = pos(i), b = pos(i + 1); step(2 * i + 2);
    const x1 = a.x + jd / 2, y1 = a.y + jd / 2, x2 = b.x + jd / 2, y2 = b.y + jd / 2;
    s.addShape(pres.shapes.LINE, { x: x1, y: Math.min(y1, y2), w: x2 - x1, h: Math.abs(y2 - y1), flipV: y2 < y1, line: { color: GOLD, width: 2.5, dashType: "dash" }, objectName: nm("Journey connector") });
  }
  for (let i = 0; i < journey.length; i++) {
    const { x, y } = pos(i), last = i === journey.length - 1; step(2 * i + 1);
    s.addShape(pres.shapes.OVAL, { keep: true, x: x - 0.12, y: y - 0.12, w: jd + 0.24, h: jd + 0.24, fill: { color: last ? GOLD : BLUE, transparency: 85 }, line: { type: "none" }, objectName: nm("Journey halo") });
    await badge(s, journey[i][0], x, y, jd, last ? "gold" : (i === 0 ? "navy" : "white"), 0.42);
    text(s, journey[i][1], { x: x - 0.3, y: i % 2 ? y + jd + 0.18 : y - 0.55, w: jd + 0.6, h: 0.4, fontSize: 15, bold: true, color: NAVY, align: "center", objectName: "Journey label" });
    text(s, String(i + 1), { keep: true, x: x + jd - 0.36, y: i % 2 ? y - 0.1 : y + jd - 0.32, w: 0.42, h: 0.42, shape: pres.shapes.OVAL, fill: { color: last ? NAVY : GOLD }, fontSize: 12, bold: true, color: last ? GOLD : NAVY, align: "center", valign: "middle", objectName: "Journey step" });
  }

  // =============== SECTION 03 ===============
  await d.section("03", "Niveles y beneficios", { photo: "edificio", section: "Niveles y beneficios" });

  // =============== 7. NIVELES ===============
  s = d.contentSlide("Niveles de embajador", { section: "Niveles y beneficios" });
  const levels = [
    { name: "JUNIOR", pts: "100", icon: "FaSeedling", style: "light", head: NAVY, txt: INK, kick: BLUE, pts_c: NAVY, badge: "blue", items: ["Credencial digital.", "Reconocimiento.", "Acceso a actividades especiales."] },
    { name: "PLUS", pts: "250", icon: "FaMedal", style: "blue", head: WHITE, txt: WHITE, kick: ICE, pts_c: WHITE, badge: "white", items: ["Todo lo anterior.", "Reconocimiento.", "Acceso a actividades especiales."] },
    { name: "ÉLITE", pts: "500", icon: "FaCrown", style: "dark", head: WHITE, txt: WHITE, kick: GOLD, pts_c: GOLD, badge: "gold", items: ["Todo lo anterior.", "Experiencias especiales con autoridades.", "Participación en campañas institucionales.", "Reconocimiento como embajador del semestre."] },
  ];
  const lw = 3.84, lgap = 0.33, bottom = 6.65, heights = [3.35, 4.15, 4.95];
  for (let i = 0; i < 3; i++) {
    const L = levels[i], x = M + i * (lw + lgap), hh = heights[i], y = bottom - hh; STEP = i + 1;
    await card(s, x, y, lw, hh, L.style, { name: "Level card" });
    await badge(s, L.icon, x + 0.3, y + 0.3, 0.75, L.badge);
    text(s, [{ text: L.pts, options: { fontSize: 34, bold: true } }, { text: " puntos", options: { fontSize: 14 } }], { x: x + 1.15, y: y + 0.28, w: lw - 1.4, h: 0.8, color: L.pts_c, align: "right", valign: "middle", objectName: "Level points" });
    text(s, [{ text: "EMBAJADOR", options: { fontSize: 11, color: L.kick, charSpacing: 5, breakLine: true } }, { text: L.name, options: { fontSize: 25, color: L.head } }], { x: x + 0.3, y: y + 1.2, w: lw - 0.6, h: 0.85, bold: true, valign: "top", objectName: "Level name" });
    text(s, bullets(L.items, 6), { x: x + 0.3, y: y + 2.15, w: lw - 0.5, h: hh - 2.3, fontSize: 13.5, color: L.txt, valign: "top", objectName: "Level items" });
  }

  // =============== 8. KIT ===============
  s = d.contentSlide("Kit del embajador", { section: "Niveles y beneficios", bottom: 6.77 });
  subtitle(s, "Te damos todas las herramientas para compartir Westhill de forma fácil y auténtica");
  const kit = [["FaQrcode", "Código QR personalizado."], ["FaWhatsapp", "Imágenes para WhatsApp"], ["FaInstagram", "Historias de Instagram"], ["FaVideo", "Videos cortos"], ["FaEnvelopeOpenText", "Invitaciones a eventos"], ["FaBookOpen", "Información de las licenciaturas"], ["FaCommentDots", "Mensajes sugeridos"], ["FaCalendarDays", "Calendarios de eventos"]];
  const kw = 2.85, kh = 2.1, kg = 0.27;
  for (let i = 0; i < 8; i++) {
    const x = M + (i % 4) * (kw + kg), y = 2.3 + Math.floor(i / 4) * (kh + kg), hot = i === 0; STEP = i + 1;
    await card(s, x, y, kw, kh, hot ? "dark" : "light", { name: "Kit tile", r: 0.16 });
    if (hot) await watermark(s, kit[i][0], x + kw - 1.15, y + 0.2, 0.95, "24507D");
    await badge(s, kit[i][0], x + 0.3, y + 0.3, 0.78, hot ? "gold" : "blue");
    text(s, kit[i][1], { x: x + 0.3, y: y + 1.25, w: kw - 0.5, h: 0.72, fontSize: 15, bold: true, color: hot ? WHITE : NAVY, valign: "top", objectName: "Kit label" });
  }

  // =============== 9. RECONOCIMIENTOS ===============
  s = d.contentSlide("Reconocimientos", { section: "Niveles y beneficios" });
  const recs = [
    { t2: "DEL MES", icon: "FaStar", dark: false, ic: ["FaBullhorn", "FaInstagram", "FaMugHot"], items: ["Reconocimiento en redes institucionales.", "Historias destacadas en Instagram.", "Regalo Especial. (Un desayuno de Starbucks)."] },
    { t2: "DEL SEMESTRE", icon: "FaTrophy", dark: true, ic: ["FaBullhorn", "FaStar", "FaNewspaper"], items: ["Reconocimiento en redes institucionales.", "Experiencia especial.", "Difusión en medios."] },
  ];
  const rw = (W - 2 * M - 0.33) / 2;
  for (let i = 0; i < 2; i++) {
    const r = recs[i], x = M + i * (rw + 0.33), y = 1.75; step(1 + i * 4);
    await card(s, x, y, rw, 4.9, r.dark ? "dark" : "light", { name: "Recognition card" });
    if (r.dark) await watermark(s, "FaTrophy", x + rw - 1.95, y + 2.85, 1.7, "24507D");
    await badge(s, r.icon, x + 0.45, y + 0.45, 1.15, r.dark ? "gold" : "blue");
    text(s, [{ text: "EMBAJADOR", options: { fontSize: 12, color: r.dark ? GOLD : BLUE, charSpacing: 5, breakLine: true } }, { text: r.t2, options: { fontSize: 28, color: r.dark ? WHITE : NAVY } }],
      { x: x + 1.85, y: y + 0.45, w: rw - 2.2, h: 1.15, bold: true, valign: "middle", objectName: "Recognition title" });
    for (let j = 0; j < 3; j++) {
      const yy = y + 2.05 + j * 0.9; step(2 + i * 4 + j);
      await badge(s, r.ic[j], x + 0.45, yy, 0.6, r.dark ? "glass" : "white", 0.44);
      text(s, r.items[j], { x: x + 1.25, y: yy - 0.05, w: rw - 1.6, h: 0.7, fontSize: 15, color: r.dark ? WHITE : INK, valign: "middle", objectName: "Recognition item" });
    }
  }

  // =============== SECTION 04 ===============
  await d.section("04", "Iniciativas", { photo: "rotonda", section: "Iniciativas" });

  // =============== 10. VIVE MI CARRERA ===============
  s = d.contentSlide("Vive mi carrera", { section: "Iniciativas" });
  text(s, "Invita a un prospecto a vivir una experiencia real en tu carrera.", { abs: true, x: M, y: 2.0, w: 6.3, h: 0.4, fontSize: 16, color: MUTED, valign: "top", objectName: "Subtitle" });
  await d.photo(s, d.asset("fotos/estudiantes_pasillo.webp"), W - M - 5.35, 2.05, 5.35, 4.9, { focusY: 0.42, name: "Campus photo" });
  const vive = [["FaChalkboardUser", "Asiste a una clase."], ["FaBuildingColumns", "Conoce profesores e instalaciones."], ["FaComments", "Conversa con estudiantes."], ["FaFlask", "Descubre laboratorios y actividades."], ["FaHandshake", "Sé su anfitrión."]];
  for (let i = 0; i < vive.length; i++) {
    const y = 2.45 + i * 0.86, last = i === vive.length - 1; STEP = i + 1;
    await card(s, M, y - 0.06, 6.3, 0.74, last ? "dark" : "light", { name: "Vive row", r: 0.37 });
    await badge(s, vive[i][0], M + 0.08, y + 0.02, 0.58, last ? "gold" : "blue");
    text(s, vive[i][1], { x: M + 0.85, y, w: 5.3, h: 0.62, fontSize: 16, bold: last, color: last ? WHITE : INK, valign: "middle", objectName: "Vive item" });
  }

  // =============== 11. RECOMENDADOS ===============
  s = d.contentSlide("Recomendados", { section: "Iniciativas", bottom: 6.93 });
  const lw2 = 8.25;
  text(s, "Con esta información podemos analizar que los medios de contacto de Recomendados, Ferias Escolares y Página Web son los más importantes generadores de inscritos. Para lo cual la propuesta es la siguiente:",
    { abs: true, x: M, y: 2.0, w: lw2, h: 0.68, fontSize: 12.5, color: MUTED, valign: "top", objectName: "Intro" });
  step(1);
  await card(s, M, 2.45, lw2, 1.42, "light", { name: "Program card", r: 0.16 });
  await badge(s, "FaLink", M + 0.3, 2.76, 0.8, "blue");
  text(s, [
    { text: "Programa de Recomendados", options: { fontSize: 16, bold: true, color: NAVY, breakLine: true } },
    { text: "La propuesta es convertir la recomendación en un programa comercial estructurado. Cada alumno inscrito recibe un código o enlace personalizado de recomendación.", options: { fontSize: 13, color: INK } },
  ], { x: M + 1.3, y: 2.53, w: lw2 - 1.5, h: 1.26, valign: "middle", paraSpaceAfter: 3, objectName: "Program text" });
  const cw = (lw2 - 0.3) / 2, cy = 4.02, ch = 2.15; step(2);
  await card(s, M, cy, cw, ch, "dark", { name: "Bonus card", r: 0.16 });
  text(s, "Beneficio económico (Bono especial)", { x: M + 0.3, y: cy + 0.2, w: cw - 0.5, h: 0.55, fontSize: 14, bold: true, color: GOLD, valign: "middle", objectName: "Bonus title" });
  [["1 invitado inscrito", "$2,000"], ["2 invitados inscritos", "$3,500"], ["3 invitados inscritos", "$5,000"]].forEach(([l, a], i) => {
    const y = cy + 0.72 + i * 0.46;
    text(s, l, { x: M + 0.3, y, w: 2.2, h: 0.45, fontSize: 13, color: MIST, valign: "middle", objectName: "Bonus row label" });
    text(s, a, { x: M + 2.4, y, w: cw - 2.65, h: 0.45, fontSize: 20, bold: true, color: i === 2 ? GOLD : WHITE, align: "right", valign: "middle", objectName: "Bonus row amount" });
  });
  const px = M + cw + 0.3; step(3);
  await card(s, px, cy, cw, ch, "light", { name: "Belonging card", r: 0.16 });
  text(s, "Beneficio de Pertenencia:", { x: px + 0.3, y: cy + 0.2, w: cw - 0.5, h: 0.55, fontSize: 14, bold: true, color: NAVY, valign: "middle", objectName: "Belonging title" });
  text(s, bullets(["Reconocimiento al “Embajador Westhill del mes”. (Historias de Instagram).", "Dar un regalo como termo, paraguas, sudadera, etc."], 8),
    { x: px + 0.3, y: cy + 0.72, w: cw - 0.5, h: 1.38, fontSize: 12.5, color: INK, valign: "top", objectName: "Belonging items" });
  step(4);
  await d.note(s, BONO_NOTE, M, 6.27, lw2, 0.66, 11);
  const fh = 4.55, fw = fh * 892 / 1154, fx = W - M - fw - 0.05, fy = 2.2; step(5);
  await card(s, fx - 0.12, fy - 0.12, fw + 0.24, fh + 0.24, "light", { name: "Flyer frame", r: 0.1, abs: true });
  s.addImage({ abs: true, data: d.imgData(IMG("flyer_referidos.jpg")), x: fx, y: fy, w: fw, h: fh, objectName: nm("Current flyer"), altText: "Programa de referidos actual" });
  step(6);
  pill(s, "ACTUAL", fx + 0.2, fy + fh - 0.6, 1.35, 0.42, GOLD, NAVY, { abs: true, fontSize: 13, charSpacing: 4, objectName: "Current tag" });

  // =============== 12. PROCESO DE INVITACIÓN ===============
  s = d.contentSlide("De tu código a su lugar en Westhill", { section: "Iniciativas", real: true });
  subtitle(s, "Así genera cada embajador su código y envía su invitación");
  const PROC = (n, w, h) => ({ data: d.imgData(IMG(`proc${n}.png`)), w, h });
  const steps2 = [
    { t: "Genera tu código", d: "Saca tu link y recibe tu pase", shots: [PROC(11, 1168, 710), PROC(12, 1178, 824)], cw: 3.1 },
    { t: "Envía tu invitación", d: "Tu invitado abre el sobre", shots: [PROC(9, 1041, 841)], cw: 2.85 },
    { t: "Confirma su lugar", d: "Llena el formulario", shots: [PROC(13, 504, 755)], cw: 2.85 },
    { t: "¡Proceso completo!", d: "Llega a Admisiones", shots: [PROC(10, 742, 740)], cw: 2.85, done: true },
  ];
  const py = 2.5, ph = 4.5, gap = 0.16;
  let px2 = M;
  for (let i = 0; i < steps2.length; i++) {
    const st = steps2[i], x = px2; step(2 * i + 1);
    await card(s, x, py, st.cw, ph, st.done ? "dark" : "light", { name: "Process card", r: 0.16 });
    pill(s, String(i + 1), x + 0.18, py + 0.22, 0.44, 0.44, st.done ? GOLD : BLUE, st.done ? NAVY : WHITE, { fontSize: 16, charSpacing: 0, objectName: "Process number" });
    text(s, st.t, { x: x + 0.74, y: py + 0.14, w: st.cw - 0.84, h: 0.36, fontSize: 13.5, bold: true, color: st.done ? WHITE : NAVY, valign: "middle", objectName: "Process step" });
    text(s, st.d, { x: x + 0.74, y: py + 0.48, w: st.cw - 0.84, h: 0.3, fontSize: 11, color: st.done ? MIST : MUTED, valign: "middle", objectName: "Process detail" });
    // screenshots, fitted inside the card below the header
    const bx2 = x + 0.15, bw2 = st.cw - 0.3, by2 = py + 0.95, bh2 = ph - 1.1, sg = 0.14;
    const slotH = (bh2 - sg * (st.shots.length - 1)) / st.shots.length;
    for (let j = 0; j < st.shots.length; j++) {
      const sh2 = st.shots[j], sc = Math.min(bw2 / (sh2.w / 100), slotH / (sh2.h / 100)) / 100;
      const iw = sh2.w * sc, ih = sh2.h * sc;
      s.addImage({ data: sh2.data, x: bx2 + (bw2 - iw) / 2, y: by2 + j * (slotH + sg) + (slotH - ih) / 2, w: iw, h: ih, shadow: sh(0.16), objectName: nm("Process screenshot"), altText: st.t });
    }
    px2 += st.cw + gap;
    if (i < steps2.length - 1) { step(2 * i + 2); await badge(s, "FaChevronRight", px2 - gap / 2 - 0.21, py + ph / 2 - 0.21, 0.42, "gold", 0.4); }
  }
  step(0);

  // =============== 13. TABLERO DE ADMISIONES ===============
  s = d.contentSlide("Tablero de control de Admisiones", { section: "Iniciativas", real: true });
  subtitle(s, "Se actualiza solo con cada registro nuevo");
  step(1); await d.framed(s, IMG("db14.png"), M, 2.55, 5.45, "Dashboard screenshot");
  const tx = M + 5.45 + 0.25, tw = W - M - tx;
  step(2); const rb = await d.framed(s, IMG("db15.png"), tx, 2.55, tw, "Rankings screenshot");
  const tab = [
    ["FaChartLine", "Indicadores al momento: registros totales, referidores, registros de hoy y últimos 7 días."],
    ["FaRankingStar", "Ranking de referidores para reconocer a los embajadores más activos."],
    ["FaListCheck", "Registros por nivel, por día y los últimos invitados con quién los refirió."],
  ];
  const ty0 = rb + 0.2, th = (7.0 - ty0 - 0.2) / 3;
  for (let i = 0; i < 3; i++) {
    const y = ty0 + i * (th + 0.1); step(3 + i);
    await card(s, tx, y, tw, th, i === 1 ? "dark" : "light", { name: "Dashboard note", r: 0.14 });
    await badge(s, tab[i][0], tx + 0.2, y + (th - 0.5) / 2, 0.5, i === 1 ? "gold" : "blue");
    text(s, tab[i][1], { x: tx + 0.85, y: y + 0.05, w: tw - 1.05, h: th - 0.1, fontSize: 13, color: i === 1 ? WHITE : INK, valign: "middle", objectName: "Dashboard note text" });
  }

  // =============== 14. BASE DE DATOS ===============
  s = d.contentSlide("Base de datos de referidos", { section: "Iniciativas", real: true });
  subtitle(s, "Cada registro queda vinculado al código del embajador que lo invitó");
  const lwc = 4.35, rx2 = M + lwc + 0.25, rw2 = W - M - rx2;
  step(1);
  await card(s, M, 2.55, lwc, 2.25, "light", { name: "Referidores card", r: 0.14 });
  pill(s, "HOJA: REFERIDORES", M + 0.2, 2.72, 2.3, 0.34, BLUE, WHITE, { fontSize: 10, objectName: "Sheet tag" });
  text(s, "Cada embajador registrado con su código único, correo y teléfono.", { x: M + 0.2, y: 3.12, w: lwc - 0.4, h: 0.55, fontSize: 12.5, color: INK, valign: "top", objectName: "Referidores text" });
  const i16w = lwc - 0.4, i16h = i16w * 172 / 714;
  s.addImage({ data: d.imgData(IMG("db16.png")), x: M + 0.2, y: 4.8 - 0.18 - i16h, w: i16w, h: i16h, shadow: sh(0.14), objectName: nm("Referidores screenshot"), altText: "Hoja Referidores" });
  step(2);
  await card(s, M, 4.98, lwc, 1.0, "dark", { name: "Referidos card", r: 0.14 });
  pill(s, "HOJA: REFERIDOS", M + 0.2, 5.13, 2.0, 0.32, GOLD, NAVY, { fontSize: 10, objectName: "Sheet tag" });
  text(s, "Cada invitado con quién lo refirió, nivel y programa de interés.", { x: M + 0.2, y: 5.5, w: lwc - 0.4, h: 0.4, fontSize: 12, color: WHITE, valign: "middle", objectName: "Referidos text" });
  step(3); const db = await d.framed(s, IMG("db17.png"), rx2, 2.55, rw2, "Referidos screenshot");
  step(4);
  const ny = Math.max(db, 5.98) + 0.18;
  await card(s, M, ny, W - 2 * M, 0.55, "ice", { name: "Sample data note", r: 0.12, flat: true });
  await badge(s, "FaCircleInfo", M + 0.15, ny + 0.08, 0.39, "gold", 0.5);
  text(s, "Datos de ejemplo para mostrar cómo se verá la información que recibe Admisiones.", { x: M + 0.68, y: ny, w: W - 2 * M - 0.9, h: 0.55, fontSize: 12, color: NAVY, valign: "middle", objectName: "Sample data note text" });
  step(0);

  // =============== 12. CIERRE ===============
  await d.closing({ line1: "Embajadores Westhill 2.0", line2: "Enero 2027" });

  await d.save(OUT);
  console.log("written");
})().catch((e) => { console.error(e); process.exit(1); });
