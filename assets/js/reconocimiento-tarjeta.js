/* ==========================================================================
   Universidad Westhill — Imágenes de los reconocimientos
   --------------------------------------------------------------------------
   Dibuja en <canvas> (1080 × 1350, vertical: WhatsApp e Instagram la
   muestran completa) las dos imágenes:
     · diploma: el reconocimiento. Es lo que ve y descarga el estudiante,
                así que la página y la descarga son idénticas.
     · sobre:   el sobre cerrado con moño "Para Nombre" que Admisiones manda
                por WhatsApp junto con el link, para que den ganas de abrirlo.
   El diseño es fijo; solo cambian los textos y el logo de la prepa.

     RecTarjeta.diploma(datos) → Promise<HTMLCanvasElement>
     RecTarjeta.sobre(datos)   → Promise<HTMLCanvasElement>
     RecTarjeta.archivo(canvas, nombreArchivo) → Promise<File> (PNG)
   datos: { nombre, prepa, logo, motivo, fechaVisita, mensaje, firma, codigo }
     logo: data:image/... de la prepa (o vacío: sale solo Westhill)
   Necesita assets/js/tarjeta-imgs.js y assets/js/reconocimiento-imgs.js.
   ========================================================================== */
(function () {
  "use strict";

  const W = 1080, H = 1350;
  const SANS = '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Inter", system-ui, "Segoe UI", sans-serif';
  const SERIF = '"Fraunces", "New York", Georgia, serif';
  const C = { navy: "#1d4a72", azul: "#276092", tinta: "#13304d", dorado: "#f2c94c", doradoTinta: "#a8811a",
              doradoPalido: "#fbe7a1", verde: "#27ae60", papel: "#fbf8f1", papel2: "#f2ecdf",
              gris: "rgba(29, 29, 31, .62)", gris3: "rgba(29, 29, 31, .42)" };
  const TEXTOS = { motivo: "su visita a la Universidad Westhill", firma: "Equipo de Admisiones" };

  const BASE = (document.currentScript && document.currentScript.src)
    ? new URL("../img/", document.currentScript.src).href : "assets/img/";
  const cache = {};
  function imagen(fuente) {
    if (!fuente) return Promise.resolve(null);
    if (!cache[fuente]) {
      cache[fuente] = new Promise((ok) => {
        const img = new Image();
        img.onload = () => ok(img);
        img.onerror = () => ok(null);                     // sin imagen se dibuja lo demás
        const incrustada = window.RefTarjetaImgs && window.RefTarjetaImgs[fuente];
        const src = incrustada || (/^data:/.test(fuente) ? fuente : BASE + fuente);
        if (!/^data:/.test(src)) img.crossOrigin = "anonymous";
        img.src = src;
      });
    }
    return cache[fuente];
  }

  let fuentes;
  function cargarFuentes() {
    if (!fuentes) {
      fuentes = document.fonts && document.fonts.load
        ? Promise.all([
            document.fonts.load(`500 80px ${SERIF}`), document.fonts.load(`italic 400 30px ${SERIF}`),
            document.fonts.load(`600 30px ${SANS}`),
          ]).catch(() => {})
        : Promise.resolve();
    }
    return fuentes;
  }

  function redondeado(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  // letter-spacing manual (no todos los navegadores lo soportan en canvas)
  function espaciado(ctx, texto, x, y, sep) {
    const total = [...texto].reduce((s, ch) => s + ctx.measureText(ch).width + sep, -sep);
    let cx = x - total / 2;
    ctx.textAlign = "left";
    for (const ch of texto) { ctx.fillText(ch, cx, y); cx += ctx.measureText(ch).width + sep; }
    ctx.textAlign = "center";
  }

  // Corta el texto en renglones de `ancho`; el último lleva "…" si no cabe
  function renglones(ctx, texto, ancho, max) {
    const palabras = String(texto || "").split(/\s+/).filter(Boolean);
    const lineas = [];
    let actual = "";
    for (const p of palabras) {
      const prueba = actual ? actual + " " + p : p;
      if (ctx.measureText(prueba).width <= ancho || !actual) actual = prueba;
      else { lineas.push(actual); actual = p; }
    }
    if (actual) lineas.push(actual);
    if (lineas.length > max) {
      const corte = lineas.slice(0, max);
      let u = corte[max - 1];
      while (u && ctx.measureText(u + "…").width > ancho) u = u.replace(/\s*\S+$/, "");
      corte[max - 1] = (u || corte[max - 1]) + "…";
      return corte;
    }
    return lineas;
  }

  // Tamaño de letra para que el texto quepa en `ancho`
  function ajustar(ctx, texto, peso, max, familia, ancho, min = 28) {
    let t = max;
    do { ctx.font = `${peso} ${t}px ${familia}`; t -= 1; } while (ctx.measureText(texto).width > ancho && t > min);
  }

  // Dibuja la imagen dentro de la caja sin deformarla (centrada)
  function encajar(ctx, img, x, y, w, h) {
    const k = Math.min(w / img.width, h / img.height);
    const iw = img.width * k, ih = img.height * k;
    ctx.drawImage(img, x + (w - iw) / 2, y + (h - ih) / 2, iw, ih);
    return { w: iw, h: ih };
  }

  function papel(ctx) {
    let g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, C.papel); g.addColorStop(1, C.papel2);
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    g = ctx.createRadialGradient(W / 2, 0, 0, W / 2, 0, W * 0.8);
    g.addColorStop(0, "rgba(251, 231, 161, .3)"); g.addColorStop(1, "rgba(251, 231, 161, 0)");
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    // Filo institucional arriba: azul con hilo verde (como la ola de la página)
    ctx.fillStyle = C.azul; ctx.fillRect(0, 0, W, 16);
    ctx.fillStyle = C.verde; ctx.fillRect(0, 16, W, 4);
    // Filete dorado doble de papelería
    ctx.strokeStyle = "rgba(242, 201, 76, .75)"; ctx.lineWidth = 2;
    redondeado(ctx, 40, 56, W - 80, H - 96, 26); ctx.stroke();
    ctx.strokeStyle = "rgba(242, 201, 76, .38)"; ctx.lineWidth = 1;
    redondeado(ctx, 52, 68, W - 104, H - 120, 18); ctx.stroke();
  }

  // Medalla: aro dorado, edificio azul y WESTHILL; dos cintas azules debajo
  function medalla(ctx, cx, cy, r, edificio) {
    ctx.save();
    [[-1, C.azul], [1, C.navy]].forEach(([lado, color]) => {
      ctx.save();
      ctx.translate(cx + lado * r * 0.35, cy + r * 0.3);
      ctx.rotate(lado * 0.32);
      ctx.fillStyle = color;
      const w = r * 0.62, h = r * 1.3;
      ctx.beginPath();
      ctx.moveTo(-w / 2, 0); ctx.lineTo(w / 2, 0); ctx.lineTo(w / 2, h);
      ctx.lineTo(0, h - w * 0.42); ctx.lineTo(-w / 2, h); ctx.closePath(); ctx.fill();
      ctx.restore();
    });
    ctx.shadowColor = "rgba(19, 48, 77, .28)"; ctx.shadowBlur = r * 0.4; ctx.shadowOffsetY = r * 0.1;
    const g = ctx.createLinearGradient(cx - r, cy - r, cx + r, cy + r);
    g.addColorStop(0, "#f8dc7a"); g.addColorStop(0.5, C.dorado); g.addColorStop(1, "#c99a1e");
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
    ctx.fillStyle = "#fff";
    ctx.beginPath(); ctx.arc(cx, cy, r * 0.84, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = "rgba(168, 129, 26, .45)"; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.arc(cx, cy, r * 0.76, 0, Math.PI * 2); ctx.stroke();
    if (edificio) {
      const iw = r * 1.06, ih = iw * edificio.height / edificio.width;
      ctx.drawImage(edificio, cx - iw / 2, cy - ih * 0.85, iw, ih);
    }
    ctx.fillStyle = C.navy;
    ctx.font = `700 ${Math.round(r * 0.17)}px ${SANS}`;
    espaciado(ctx, "WESTHILL", cx, cy + r * 0.36, r * 0.05);
  }

  const fechaLarga = (v) => (window.Reconocimientos ? Reconocimientos.fechaLarga(v) : String(v || ""));

  /* --- El reconocimiento -----------------------------------------------------
     Como un diploma impreso: marco azul Westhill, papel con fondo de
     seguridad (guilloché) y el edificio de marca de agua, título dorado,
     nombre en cursiva y un sello dorado con texto en círculo. */
  const M = 44;                                     // margen azul alrededor del papel

  function marco(ctx, edificio) {
    // Marco azul con luz arriba
    let g = ctx.createLinearGradient(0, 0, W * 0.35, H);
    g.addColorStop(0, "#235683"); g.addColorStop(0.6, C.navy); g.addColorStop(1, "#163a5a");
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    // Papel
    ctx.save();
    redondeado(ctx, M, M, W - 2 * M, H - 2 * M, 14);
    g = ctx.createLinearGradient(0, M, 0, H - M);
    g.addColorStop(0, "#fdfaf3"); g.addColorStop(1, "#f3ecdc");
    ctx.fillStyle = g; ctx.fill();
    ctx.clip();
    g = ctx.createRadialGradient(W / 2, M, 0, W / 2, M, W * 0.75);
    g.addColorStop(0, "rgba(251, 231, 161, .35)"); g.addColorStop(1, "rgba(251, 231, 161, 0)");
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    guilloche(ctx);
    // Marca de agua: el edificio, muy tenue, detrás del nombre
    if (edificio) {
      ctx.globalAlpha = 0.032;
      const ew = 860, eh = ew * edificio.height / edificio.width;
      ctx.drawImage(edificio, (W - ew) / 2, 760 - eh / 2, ew, eh);
      ctx.globalAlpha = 1;
    }
    ctx.restore();
    // Filetes dorados dobles con esquinas
    const a = M + 20, b = M + 30;
    ctx.strokeStyle = "rgba(201, 154, 30, .85)"; ctx.lineWidth = 2.5;
    ctx.strokeRect(a, a, W - 2 * a, H - 2 * a);
    ctx.strokeStyle = "rgba(201, 154, 30, .45)"; ctx.lineWidth = 1;
    ctx.strokeRect(b, b, W - 2 * b, H - 2 * b);
    [[a, a, 1, 1], [W - a, a, -1, 1], [a, H - a, 1, -1], [W - a, H - a, -1, -1]].forEach(([x, y, sx, sy]) => esquina(ctx, x, y, sx, sy));
  }

  // Fondo de seguridad: ondas finas entrelazadas, como en los documentos oficiales
  function guilloche(ctx) {
    ctx.save();
    ctx.strokeStyle = "rgba(168, 129, 26, .075)";
    ctx.lineWidth = 1;
    for (let k = 0; k < 64; k++) {
      const y0 = M + k * 20;
      ctx.beginPath();
      for (let x = M; x <= W - M; x += 6) {
        const y = y0 + 14 * Math.sin(x / 46 + k * 0.55) + 6 * Math.sin(x / 13 - k * 0.3);
        x === M ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
    ctx.restore();
  }

  // Esquina: cuadro dorado en el filete y una escuadra con rombo hacia adentro
  function esquina(ctx, x, y, sx, sy) {
    ctx.save();
    ctx.translate(x, y); ctx.scale(sx, sy);
    ctx.fillStyle = "#c99a1e"; ctx.strokeStyle = "rgba(201, 154, 30, .85)"; ctx.lineWidth = 1.5;
    ctx.fillRect(-7, -7, 14, 14);
    ctx.fillStyle = "#fdfaf3";
    ctx.beginPath(); ctx.moveTo(0, -4); ctx.lineTo(4, 0); ctx.lineTo(0, 4); ctx.lineTo(-4, 0); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.moveTo(30, 22); ctx.lineTo(96, 22); ctx.moveTo(22, 30); ctx.lineTo(22, 96); ctx.stroke();
    ctx.fillStyle = "#c99a1e";
    ctx.beginPath(); ctx.moveTo(22, 15); ctx.lineTo(29, 22); ctx.lineTo(22, 29); ctx.lineTo(15, 22); ctx.closePath(); ctx.fill();
    [[102, 22], [22, 102]].forEach(([px, py]) => { ctx.beginPath(); ctx.arc(px, py, 2.5, 0, Math.PI * 2); ctx.fill(); });
    ctx.restore();
  }

  // Texto en dorado "de hoja": degradado oscuro-claro-oscuro
  function oro(ctx, y0, y1) {
    const g = ctx.createLinearGradient(0, y0, 0, y1);
    g.addColorStop(0, "#9a7414"); g.addColorStop(0.45, "#c99a1e"); g.addColorStop(0.55, "#b8891a"); g.addColorStop(1, "#7d5f0e");
    return g;
  }

  // Sello: roseta dorada dentada, disco azul con el edificio y texto en círculo
  function sello(ctx, cx, cy, r, edificioBlanco) {
    ctx.save();
    // Cintas
    [[-1, C.azul], [1, C.navy]].forEach(([lado, color]) => {
      ctx.save();
      ctx.translate(cx + lado * r * 0.3, cy + r * 0.45);
      ctx.rotate(lado * 0.28);
      ctx.fillStyle = color;
      const w = r * 0.5, h = r * 0.92;
      ctx.beginPath();
      ctx.moveTo(-w / 2, 0); ctx.lineTo(w / 2, 0); ctx.lineTo(w / 2, h); ctx.lineTo(0, h - w * 0.4); ctx.lineTo(-w / 2, h); ctx.closePath(); ctx.fill();
      ctx.fillStyle = "rgba(242, 201, 76, .55)"; ctx.fillRect(-w / 2 + 5, 0, 2, h - 12); ctx.fillRect(w / 2 - 7, 0, 2, h - 12);
      ctx.restore();
    });
    // Roseta dentada
    ctx.shadowColor = "rgba(19, 48, 77, .35)"; ctx.shadowBlur = 18; ctx.shadowOffsetY = 6;
    ctx.beginPath();
    const dientes = 40;
    for (let i = 0; i <= dientes * 2; i++) {
      const ang = (i / (dientes * 2)) * Math.PI * 2;
      const rr = i % 2 ? r * 0.93 : r;
      ctx.lineTo(cx + Math.cos(ang) * rr, cy + Math.sin(ang) * rr);
    }
    let g = ctx.createRadialGradient(cx - r * 0.35, cy - r * 0.45, r * 0.1, cx, cy, r);
    g.addColorStop(0, "#fff0b8"); g.addColorStop(0.45, C.dorado); g.addColorStop(0.85, "#d4a52a"); g.addColorStop(1, "#a8811a");
    ctx.fillStyle = g; ctx.fill();
    ctx.restore();
    // Aro y disco azul
    ctx.strokeStyle = "rgba(125, 95, 14, .55)"; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.arc(cx, cy, r * 0.84, 0, Math.PI * 2); ctx.stroke();
    g = ctx.createLinearGradient(cx, cy - r * 0.6, cx, cy + r * 0.6);
    g.addColorStop(0, C.azul); g.addColorStop(1, C.navy);
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(cx, cy, r * 0.6, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = "rgba(251, 231, 161, .8)"; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.arc(cx, cy, r * 0.55, 0, Math.PI * 2); ctx.stroke();
    if (edificioBlanco) {
      const iw = r * 0.78, ih = iw * edificioBlanco.height / edificioBlanco.width;
      ctx.drawImage(edificioBlanco, cx - iw / 2, cy - ih / 2 - r * 0.06, iw, ih);
    }
    ctx.fillStyle = C.doradoPalido;
    ctx.font = `600 ${Math.round(r * 0.11)}px ${SANS}`;
    espaciado(ctx, "2026", cx, cy + r * 0.32, r * 0.03);
    // Texto en círculo sobre el aro dorado
    circular(ctx, "UNIVERSIDAD WESTHILL", cx, cy, r * 0.72, -Math.PI / 2, `700 ${Math.round(r * 0.12)}px ${SANS}`, "#5c450a", r * 0.022);
    circular(ctx, "VESTIGIA NULLA RETRORSUM", cx, cy, r * 0.72, Math.PI / 2, `600 ${Math.round(r * 0.095)}px ${SANS}`, "#5c450a", r * 0.012, true);
  }

  // Escribe el texto centrado en `centro` (radianes) siguiendo el círculo
  function circular(ctx, texto, cx, cy, radio, centro, fuente, color, sep, abajo) {
    ctx.save();
    ctx.font = fuente; ctx.fillStyle = color; ctx.textAlign = "center"; ctx.textBaseline = "middle";
    const anchos = [...texto].map((ch) => ctx.measureText(ch).width + sep);
    const total = anchos.reduce((s, w) => s + w, 0) - sep;
    let ang = centro + (abajo ? 1 : -1) * (total / radio) / 2;
    [...texto].forEach((ch, i) => {
      const paso = anchos[i] / radio;
      const a = ang + (abajo ? -1 : 1) * paso / 2;
      ctx.save();
      ctx.translate(cx + Math.cos(a) * radio, cy + Math.sin(a) * radio);
      ctx.rotate(a + (abajo ? -Math.PI / 2 : Math.PI / 2));
      ctx.fillText(ch, 0, 0);
      ctx.restore();
      ang += (abajo ? -1 : 1) * paso;
    });
    ctx.restore();
  }

  async function diploma(d) {
    await cargarFuentes();
    const [logo, edificio, edificioBlanco, prepaLogo] = await Promise.all([
      imagen("logo-westhill.png"), imagen("edificio-westhill.png"), imagen("edificio-westhill-blanco.png"), imagen(d.logo),
    ]);
    const cv = document.createElement("canvas");
    cv.width = W; cv.height = H;
    const ctx = cv.getContext("2d");
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    marco(ctx, edificio);

    // Encabezado: Westhill · filete dorado · logo de la prepa
    const cabY = 190;
    if (prepaLogo) {
      const lw = 250, lh = logo ? lw * logo.height / logo.width : 0;
      const caja = { w: 220, h: 112 };
      const k = Math.min(caja.w / prepaLogo.width, caja.h / prepaLogo.height);
      const pw = prepaLogo.width * k;
      const sep = 64, total = lw + sep + pw;
      const x0 = (W - total) / 2;
      if (logo) ctx.drawImage(logo, x0, cabY - lh / 2, lw, lh);
      ctx.fillStyle = "#c99a1e";
      ctx.fillRect(x0 + lw + sep / 2 - 1, cabY - 46, 2, 92);
      ctx.beginPath(); ctx.arc(x0 + lw + sep / 2, cabY, 4, 0, Math.PI * 2); ctx.fill();
      encajar(ctx, prepaLogo, x0 + lw + sep, cabY - caja.h / 2, pw, caja.h);
    } else if (logo) {
      const lw = 290, lh = lw * logo.height / logo.width;
      ctx.drawImage(logo, (W - lw) / 2, cabY - lh / 2, lw, lh);
    }

    ctx.fillStyle = C.doradoTinta;
    ctx.font = `600 20px ${SANS}`;
    espaciado(ctx, "LA UNIVERSIDAD WESTHILL OTORGA EL PRESENTE", W / 2, 312, 5);

    ctx.fillStyle = oro(ctx, 350, 450);
    ctx.font = `500 128px ${SERIF}`;
    ctx.fillText("Reconocimiento", W / 2, 400);

    ctx.fillStyle = C.gris;
    ctx.font = `italic 400 30px ${SERIF}`;
    ctx.fillText("a", W / 2, 482);

    const nombre = (d.nombre || "").trim() || "Nombre del estudiante";
    ctx.fillStyle = (d.nombre || "").trim() ? C.tinta : "rgba(19, 48, 77, .3)";
    ajustar(ctx, nombre, "italic 500", 96, SERIF, 840, 44);
    ctx.fillText(nombre, W / 2, 560);

    // Filete con rombo y dos puntos
    ctx.strokeStyle = "rgba(201, 154, 30, .8)"; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(310, 632); ctx.lineTo(512, 632); ctx.moveTo(568, 632); ctx.lineTo(770, 632); ctx.stroke();
    ctx.fillStyle = "#c99a1e";
    ctx.beginPath(); ctx.moveTo(540, 620); ctx.lineTo(552, 632); ctx.lineTo(540, 644); ctx.lineTo(528, 632); ctx.closePath(); ctx.fill();
    [[300, 632], [780, 632]].forEach(([x, y]) => { ctx.beginPath(); ctx.arc(x, y, 3.5, 0, Math.PI * 2); ctx.fill(); });

    ctx.fillStyle = C.gris;
    ctx.font = `400 28px ${SANS}`;
    ctx.fillText("por su participación en", W / 2, 694);

    let y = 742;
    ctx.fillStyle = C.navy;
    ctx.font = `600 36px ${SANS}`;
    renglones(ctx, d.motivo || TEXTOS.motivo, 800, 2).forEach((l) => { ctx.fillText(l, W / 2, y); y += 46; });
    if (d.prepa) {
      ctx.fillStyle = C.azul;
      ctx.font = `500 28px ${SANS}`;
      renglones(ctx, d.prepa, 800, 1).forEach((l) => ctx.fillText(l, W / 2, y + 2));
      y += 42;
    }
    if (d.mensaje) {
      y += 34;
      ctx.fillStyle = "rgba(29, 29, 31, .72)";
      ctx.font = `italic 400 30px ${SERIF}`;
      renglones(ctx, d.mensaje, 760, 3).forEach((l) => { ctx.fillText(l, W / 2, y); y += 43; });
    }

    // Pie: fecha · sello · firma
    const pieY = 1132;
    ctx.strokeStyle = "rgba(19, 48, 77, .35)"; ctx.lineWidth = 1.5;
    [262, 818].forEach((x) => { ctx.beginPath(); ctx.moveTo(x - 128, pieY + 24); ctx.lineTo(x + 128, pieY + 24); ctx.stroke(); });
    ctx.fillStyle = C.tinta;
    const fecha = fechaLarga(d.fechaVisita);
    ajustar(ctx, fecha, 500, 25, SANS, 260, 16);
    ctx.fillText(fecha, 262, pieY);
    const firma = d.firma || TEXTOS.firma;
    ajustar(ctx, firma, "italic 500", 32, SERIF, 270, 18);
    ctx.fillText(firma, 818, pieY - 2);
    ctx.fillStyle = C.gris3;
    ctx.font = `600 16px ${SANS}`;
    espaciado(ctx, "FECHA DE LA VISITA", 262, pieY + 52, 3);
    espaciado(ctx, "ADMISIONES · WESTHILL", 818, pieY + 52, 3);

    sello(ctx, W / 2, pieY - 4, 104, edificioBlanco);

    if (d.codigo) {
      ctx.fillStyle = C.gris3;
      ctx.font = `500 15px ui-monospace, "SF Mono", Menlo, monospace`;
      espaciado(ctx, "FOLIO " + d.codigo, 262, pieY + 82, 2.5);
    }
    // En el marco azul, abajo
    ctx.fillStyle = "rgba(251, 231, 161, .75)";
    ctx.font = `600 14px ${SANS}`;
    espaciado(ctx, "UNIVERSIDAD WESTHILL  ·  UW.EDU.MX", W / 2, H - M / 2, 4);
    return cv;
  }

  /* --- El sobre cerrado con moño (para WhatsApp) --------------------------- */
  async function sobre(d) {
    await cargarFuentes();
    const [logo, edificioBlanco, prepaLogo] = await Promise.all([
      imagen("logo-westhill.png"), imagen("edificio-westhill-blanco.png"), imagen(d.logo),
    ]);
    const cv = document.createElement("canvas");
    cv.width = W; cv.height = H;
    const ctx = cv.getContext("2d");
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    papel(ctx);

    if (logo) { const lw = 250, lh = lw * logo.height / logo.width; ctx.drawImage(logo, (W - lw) / 2, 104, lw, lh); }

    ctx.fillStyle = C.doradoTinta;
    ctx.font = `600 24px ${SANS}`;
    espaciado(ctx, "TIENES UN RECONOCIMIENTO", W / 2, 278, 6);
    ctx.fillStyle = C.gris;
    ctx.font = `400 30px ${SANS}`;
    ctx.fillText("Para", W / 2, 334);
    const nombre = (d.nombre || "").trim() || "Nombre del estudiante";
    ctx.fillStyle = (d.nombre || "").trim() ? C.tinta : "rgba(19, 48, 77, .3)";
    ajustar(ctx, nombre, 500, 82, SERIF, 880, 40);
    ctx.fillText(nombre, W / 2, 400);
    if (d.prepa) {
      ctx.fillStyle = C.azul;
      ctx.font = `500 27px ${SANS}`;
      renglones(ctx, d.prepa, 860, 1).forEach((l) => ctx.fillText(l, W / 2, 464));
    }

    // Sobre azul marino (igual al de la página)
    const sx = 150, sy = 548, sw = 780, sh = 494, r = 22;
    ctx.save();
    ctx.shadowColor = "rgba(19, 48, 77, .45)"; ctx.shadowBlur = 70; ctx.shadowOffsetY = 34;
    let g = ctx.createLinearGradient(sx, sy, sx + sw * 0.2, sy + sh);
    g.addColorStop(0, "#0c2442"); g.addColorStop(1, "#081a33");
    ctx.fillStyle = g; redondeado(ctx, sx, sy, sw, sh, r); ctx.fill();
    ctx.restore();
    ctx.save();
    redondeado(ctx, sx, sy, sw, sh, r); ctx.clip();
    g = ctx.createLinearGradient(sx, sy, sx + sw * 0.3, sy + sh);
    g.addColorStop(0, "#133661"); g.addColorStop(0.55, "#0d2848"); g.addColorStop(1, "#0a1f3b");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(sx, sy); ctx.lineTo(sx + sw / 2, sy + sh * 0.54); ctx.lineTo(sx + sw, sy);
    ctx.lineTo(sx + sw, sy + sh); ctx.lineTo(sx, sy + sh); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = "rgba(255, 255, 255, .07)"; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(sx, sy + sh); ctx.lineTo(sx + sw / 2, sy + sh * 0.54); ctx.lineTo(sx + sw, sy + sh); ctx.stroke();
    ctx.save();
    ctx.shadowColor = "rgba(0, 0, 0, .35)"; ctx.shadowBlur = 24; ctx.shadowOffsetY = 8;
    g = ctx.createLinearGradient(0, sy, 0, sy + sh * 0.6);
    g.addColorStop(0, "#17406f"); g.addColorStop(1, "#0f2c52");
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(sx + sw, sy); ctx.lineTo(sx + sw / 2, sy + sh * 0.6); ctx.closePath(); ctx.fill();
    ctx.restore();

    // "De parte de"
    ctx.textAlign = "left";
    ctx.fillStyle = "rgba(255, 255, 255, .55)";
    ctx.font = `400 22px ${SANS}`;
    ctx.fillText("De parte de", sx + 52, sy + sh - 88);
    ctx.fillStyle = C.doradoPalido;
    ctx.font = `500 32px ${SERIF}`;
    ctx.fillText("Universidad Westhill", sx + 52, sy + sh - 50);
    ctx.textAlign = "center";

    // Estampilla con el logo de la prepa (o el edificio si no hay logo)
    estampilla(ctx, sx + sw - 116, sy + sh - 96, prepaLogo, edificioBlanco);

    // Listón dorado que amarra el sobre y el moño en el centro
    const lx = sx + sw / 2, ly = sy + sh * 0.6;
    listonCanvas(ctx, sx, sy, sw, sh, lx, ly);
    ctx.restore();
    monoCanvas(ctx, lx, ly, 1.15);

    // Llamado
    const by = 1128, bw = 560, bh = 76;
    ctx.fillStyle = C.navy;
    redondeado(ctx, (W - bw) / 2, by, bw, bh, bh / 2); ctx.fill();
    ctx.fillStyle = "#fff";
    ctx.font = `600 29px ${SANS}`;
    ctx.fillText("Ábrelo en el link del mensaje", W / 2, by + bh / 2 + 1);

    ctx.fillStyle = C.doradoTinta;
    ctx.font = `italic 400 25px ${SERIF}`;
    ctx.fillText("Vestigia Nulla Retrorsum", W / 2, 1268);
    return cv;
  }

  function estampilla(ctx, cx, cy, prepaLogo, edificioBlanco) {
    const w = prepaLogo ? 140 : 96, h = prepaLogo ? 160 : 116, dent = 6;
    ctx.save();
    ctx.translate(cx, cy); ctx.rotate(0.06);
    ctx.shadowColor = "rgba(0, 0, 0, .35)"; ctx.shadowBlur = 14; ctx.shadowOffsetY = 6;
    ctx.fillStyle = prepaLogo ? "#ffffff" : C.doradoPalido;
    ctx.fillRect(-w / 2, -h / 2, w, h);
    ctx.shadowColor = "transparent";
    // Borde dentado: se "muerden" círculos del color del sobre
    ctx.fillStyle = "#0b2140";
    for (let x = -w / 2; x <= w / 2 + 0.1; x += w / Math.round(w / 14)) [-h / 2, h / 2].forEach((y) => { ctx.beginPath(); ctx.arc(x, y, dent / 1.5, 0, Math.PI * 2); ctx.fill(); });
    for (let y = -h / 2; y <= h / 2 + 0.1; y += h / Math.round(h / 14)) [-w / 2, w / 2].forEach((x) => { ctx.beginPath(); ctx.arc(x, y, dent / 1.5, 0, Math.PI * 2); ctx.fill(); });
    if (prepaLogo) {
      ctx.strokeStyle = "rgba(168, 129, 26, .45)"; ctx.lineWidth = 1.5;
      ctx.strokeRect(-w / 2 + 12, -h / 2 + 12, w - 24, h - 24);
      encajar(ctx, prepaLogo, -w / 2 + 20, -h / 2 + 20, w - 40, h - 40);
    } else {
      const g = ctx.createLinearGradient(-w / 2, -h / 2, w / 2, h / 2);
      g.addColorStop(0, C.azul); g.addColorStop(1, C.navy);
      ctx.fillStyle = g; ctx.fillRect(-w / 2 + 10, -h / 2 + 10, w - 20, h - 20);
      if (edificioBlanco) encajar(ctx, edificioBlanco, -w / 2 + 18, -h / 2 + 18, w - 36, h - 36);
    }
    ctx.restore();
  }

  function satin(ctx, x0, y0, x1, y1) {
    const g = ctx.createLinearGradient(x0, y0, x1, y1);
    g.addColorStop(0, "#c99a1e"); g.addColorStop(0.35, "#f8dc7a"); g.addColorStop(0.55, C.dorado); g.addColorStop(1, "#b58d1f");
    return g;
  }

  function listonCanvas(ctx, sx, sy, sw, sh, lx, ly) {
    const a = 34;
    ctx.save();
    ctx.shadowColor = "rgba(0, 0, 0, .35)"; ctx.shadowBlur = 10; ctx.shadowOffsetY = 3;
    ctx.fillStyle = satin(ctx, lx - a / 2, 0, lx + a / 2, 0);
    ctx.fillRect(lx - a / 2, sy, a, sh);
    ctx.fillStyle = satin(ctx, 0, ly - a / 2, 0, ly + a / 2);
    ctx.fillRect(sx, ly - a / 2, sw, a);
    ctx.restore();
  }

  // Moño: dos lazos, dos puntas y el nudo (mismas formas que el SVG de la página)
  function monoCanvas(ctx, cx, cy, k) {
    ctx.save();
    ctx.translate(cx, cy); ctx.scale(k, k);
    ctx.shadowColor = "rgba(0, 0, 0, .4)"; ctx.shadowBlur = 16; ctx.shadowOffsetY = 6;
    const forma = (path, x0, y0, x1, y1) => { ctx.fillStyle = satin(ctx, x0, y0, x1, y1); ctx.fill(new Path2D(path)); };
    forma(MONO.puntaIzq, -60, 0, 0, 110);
    forma(MONO.puntaDer, 0, 0, 60, 110);
    forma(MONO.lazoIzq, -110, -60, 0, 40);
    forma(MONO.lazoDer, 0, -60, 110, 40);
    ctx.shadowColor = "transparent";
    ctx.fillStyle = "rgba(120, 85, 10, .28)";
    ctx.fill(new Path2D(MONO.plieguesIzq)); ctx.fill(new Path2D(MONO.plieguesDer));
    forma(MONO.nudo, -18, -20, 18, 20);
    ctx.restore();
  }

  // Trazos del moño centrados en el nudo (0, 0). Los comparte reconocimiento.html.
  const MONO = {
    lazoIzq: "M-10 -6 C-40 -62 -112 -60 -104 -10 C-98 26 -46 22 -10 8 Z",
    lazoDer: "M10 -6 C40 -62 112 -60 104 -10 C98 26 46 22 10 8 Z",
    plieguesIzq: "M-14 -2 C-46 -30 -82 -36 -92 -16 C-70 -26 -42 -18 -14 2 Z",
    plieguesDer: "M14 -2 C46 -30 82 -36 92 -16 C70 -26 42 -18 14 2 Z",
    puntaIzq: "M-8 8 C-20 40 -34 74 -52 104 L-30 98 L-22 118 C-6 84 4 46 6 10 Z",
    puntaDer: "M8 8 C20 40 34 74 52 104 L30 98 L22 118 C6 84 -4 46 -6 10 Z",
    nudo: "M-16 -14 C-6 -20 6 -20 16 -14 C20 -4 20 6 16 14 C6 20 -6 20 -16 14 C-20 4 -20 -4 -16 -14 Z",
  };

  function archivo(cv, nombre) {
    return new Promise((ok) => cv.toBlob((b) => ok(new File([b], nombre, { type: "image/png" })), "image/png"));
  }

  window.RecTarjeta = { diploma, sobre, archivo, MONO };
})();
