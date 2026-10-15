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

  /* --- El reconocimiento ---------------------------------------------------- */
  async function diploma(d) {
    await cargarFuentes();
    const [logo, edificio, prepaLogo] = await Promise.all([
      imagen("logo-westhill.png"), imagen("edificio-westhill.png"), imagen(d.logo),
    ]);
    const cv = document.createElement("canvas");
    cv.width = W; cv.height = H;
    const ctx = cv.getContext("2d");
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    papel(ctx);

    // Encabezado: Westhill · filete dorado · logo de la prepa
    const cabY = 170;
    if (prepaLogo) {
      const lw = 262, lh = logo ? lw * logo.height / logo.width : 0;
      const caja = { w: 230, h: 116 };
      const k = Math.min(caja.w / prepaLogo.width, caja.h / prepaLogo.height);
      const pw = prepaLogo.width * k;
      const sep = 60, total = lw + sep + pw;
      const x0 = (W - total) / 2;
      if (logo) ctx.drawImage(logo, x0, cabY - lh / 2, lw, lh);
      ctx.strokeStyle = "rgba(201, 154, 30, .6)"; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(x0 + lw + sep / 2, cabY - 52); ctx.lineTo(x0 + lw + sep / 2, cabY + 52); ctx.stroke();
      encajar(ctx, prepaLogo, x0 + lw + sep, cabY - caja.h / 2, pw, caja.h);
    } else if (logo) {
      const lw = 300, lh = lw * logo.height / logo.width;
      ctx.drawImage(logo, (W - lw) / 2, cabY - lh / 2, lw, lh);
    }

    ctx.fillStyle = C.doradoTinta;
    ctx.font = `600 21px ${SANS}`;
    espaciado(ctx, "LA UNIVERSIDAD WESTHILL OTORGA EL PRESENTE", W / 2, 306, 4.5);

    ctx.fillStyle = C.navy;
    ctx.font = `500 112px ${SERIF}`;
    ctx.fillText("Reconocimiento", W / 2, 400);

    ctx.fillStyle = C.gris;
    ctx.font = `400 28px ${SANS}`;
    ctx.fillText("a", W / 2, 484);

    const nombre = (d.nombre || "").trim() || "Nombre del estudiante";
    ctx.fillStyle = (d.nombre || "").trim() ? C.tinta : "rgba(19, 48, 77, .3)";
    ajustar(ctx, nombre, 500, 88, SERIF, 860, 40);
    ctx.fillText(nombre, W / 2, 566);

    // Filete con rombo
    ctx.strokeStyle = "rgba(201, 154, 30, .75)"; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(300, 640); ctx.lineTo(518, 640); ctx.moveTo(562, 640); ctx.lineTo(780, 640); ctx.stroke();
    ctx.fillStyle = C.dorado;
    ctx.beginPath(); ctx.moveTo(540, 630); ctx.lineTo(550, 640); ctx.lineTo(540, 650); ctx.lineTo(530, 640); ctx.closePath(); ctx.fill();

    ctx.fillStyle = C.gris;
    ctx.font = `400 28px ${SANS}`;
    ctx.fillText("por su participación en", W / 2, 706);

    let y = 756;
    ctx.fillStyle = C.navy;
    ctx.font = `600 36px ${SANS}`;
    renglones(ctx, d.motivo || TEXTOS.motivo, 820, 2).forEach((l) => { ctx.fillText(l, W / 2, y); y += 46; });

    if (d.prepa) {
      ctx.fillStyle = C.azul;
      ctx.font = `500 29px ${SANS}`;
      renglones(ctx, d.prepa, 820, 1).forEach((l) => ctx.fillText(l, W / 2, y + 2));
      y += 42;
    }

    if (d.mensaje) {
      y += 44;
      ctx.fillStyle = "rgba(29, 29, 31, .72)";
      ctx.font = `italic 400 31px ${SERIF}`;
      renglones(ctx, d.mensaje, 780, 3).forEach((l) => { ctx.fillText(l, W / 2, y); y += 44; });
    }

    // Pie: fecha · medalla · firma
    const pieY = 1148;
    ctx.strokeStyle = "rgba(29, 29, 31, .28)"; ctx.lineWidth = 1.5;
    [255, 825].forEach((x) => { ctx.beginPath(); ctx.moveTo(x - 130, pieY + 26); ctx.lineTo(x + 130, pieY + 26); ctx.stroke(); });
    ctx.fillStyle = C.tinta;
    const fecha = fechaLarga(d.fechaVisita);
    ajustar(ctx, fecha, 500, 25, SANS, 270, 16);
    ctx.fillText(fecha, 255, pieY);
    const firma = d.firma || TEXTOS.firma;
    ajustar(ctx, firma, "italic 400", 31, SERIF, 280, 18);
    ctx.fillText(firma, 825, pieY - 2);
    ctx.fillStyle = C.gris3;
    ctx.font = `600 17px ${SANS}`;
    espaciado(ctx, "FECHA", 255, pieY + 56, 3);
    espaciado(ctx, "ADMISIONES · WESTHILL", 825, pieY + 56, 3);

    medalla(ctx, W / 2, pieY - 10, 84, edificio);

    if (d.codigo) {
      ctx.fillStyle = C.gris3;
      ctx.font = `500 16px ui-monospace, "SF Mono", Menlo, monospace`;
      espaciado(ctx, "FOLIO " + d.codigo, 255, pieY + 90, 2.5);
    }
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
