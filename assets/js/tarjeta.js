/* ==========================================================================
   Universidad Westhill — Tarjeta de invitación con QR
   --------------------------------------------------------------------------
   Dibuja en un <canvas> la tarjeta que se comparte o descarga (1080 × 1350,
   formato vertical que WhatsApp e Instagram muestran completo).
   Usa assets/js/vendor/qrcode.js (qrcode-generator, MIT) con corrección de
   errores alta (H) para que el QR lea bien aunque lleve el logo en medio.

     RefTarjeta.dibujar({ nombre, codigo, link }) → Promise<HTMLCanvasElement>
     RefTarjeta.archivo(canvas, codigo)            → Promise<File> (PNG)
   ========================================================================== */
(function () {
  "use strict";

  const W = 1080, H = 1350;
  const C = { navy: "#1d4a72", navy2: "#235683", azul: "#276092", dorado: "#f2c94c",
              doradoPalido: "#fbe7a1", tinta: "#13304d", gris: "#6b7280", fondo: "#eef3f9" };
  const SANS = '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Inter", system-ui, "Segoe UI", sans-serif';
  const SERIF = '"Fraunces", "New York", Georgia, serif';

  // Ruta base de las imágenes, relativa a este script (funciona en cualquier carpeta)
  const BASE = (document.currentScript && document.currentScript.src)
    ? new URL("../img/", document.currentScript.src).href : "assets/img/";

  const cache = {};
  function imagen(nombre) {
    if (!cache[nombre]) {
      cache[nombre] = new Promise((ok, mal) => {
        const img = new Image();
        img.onload = () => ok(img);
        img.onerror = mal;
        const incrustada = window.RefTarjetaImgs && window.RefTarjetaImgs[nombre];
        if (!incrustada) img.crossOrigin = "anonymous";   // si no está incrustada, pedirla con CORS
        img.src = incrustada || BASE + nombre;
      });
    }
    return cache[nombre];
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

  // Ajusta el tamaño de letra para que el texto quepa en `ancho`
  function ajustar(ctx, texto, peso, max, familia, ancho) {
    let t = max;
    do { ctx.font = `${peso} ${t}px ${familia}`; t -= 2; } while (ctx.measureText(texto).width > ancho && t > 28);
  }

  function espaciado(ctx, texto, x, y, sep) {
    // letter-spacing manual (no todos los navegadores lo soportan en canvas)
    const total = [...texto].reduce((s, ch) => s + ctx.measureText(ch).width + sep, -sep);
    let cx = x - total / 2;
    ctx.textAlign = "left";
    for (const ch of texto) { ctx.fillText(ch, cx, y); cx += ctx.measureText(ch).width + sep; }
    ctx.textAlign = "center";
  }

  /* --- QR con módulos redondeados y sello circular al centro -------------- */
  function dibujarQR(ctx, texto, x, y, tam, edificio) {
    const qr = qrcode(0, "H");
    qr.addData(texto);
    qr.make();
    const n = qr.getModuleCount();
    const m = tam / n;
    const cx = x + tam / 2, cy = y + tam / 2;
    const radio = tam * 0.15;                          // sello: ~7% del área, H corrige hasta 30%
    const libre = radio + m * 0.9;                     // aire blanco alrededor del sello
    const esOjo = (r, c) => (r < 7 && c < 7) || (r < 7 && c >= n - 7) || (r >= n - 7 && c < 7);

    ctx.fillStyle = C.tinta;
    for (let r = 0; r < n; r++) {
      for (let c = 0; c < n; c++) {
        if (!qr.isDark(r, c) || esOjo(r, c)) continue;
        const mx = x + (c + 0.5) * m, my = y + (r + 0.5) * m;
        if (Math.hypot(mx - cx, my - cy) < libre) continue;   // hueco redondo, no cuadrado
        redondeado(ctx, x + c * m + m * 0.04, y + r * m + m * 0.04, m * 0.92, m * 0.92, m * 0.3);
        ctx.fill();
      }
    }
    // Ojos: marco azul marino y centro azul Westhill
    [[0, 0], [0, n - 7], [n - 7, 0]].forEach(([r, c]) => {
      const ox = x + c * m, oy = y + r * m;
      ctx.fillStyle = C.navy;
      redondeado(ctx, ox, oy, 7 * m, 7 * m, 2.2 * m); ctx.fill();
      ctx.fillStyle = "#fff";
      redondeado(ctx, ox + m, oy + m, 5 * m, 5 * m, 1.5 * m); ctx.fill();
      ctx.fillStyle = C.azul;
      redondeado(ctx, ox + 2 * m, oy + 2 * m, 3 * m, 3 * m, 1 * m); ctx.fill();
    });

    // Sello: medalla blanca con aro dorado, el edificio azul y WESTHILL debajo
    ctx.save();
    ctx.shadowColor = "rgba(19, 48, 77, .22)"; ctx.shadowBlur = radio * 0.35; ctx.shadowOffsetY = radio * 0.08;
    ctx.fillStyle = "#fff";
    ctx.beginPath(); ctx.arc(cx, cy, radio, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
    let g = ctx.createLinearGradient(cx - radio, cy - radio, cx + radio, cy + radio);
    g.addColorStop(0, "#f8dc7a"); g.addColorStop(0.5, C.dorado); g.addColorStop(1, "#c99a1e");
    ctx.strokeStyle = g; ctx.lineWidth = radio * 0.075;
    ctx.beginPath(); ctx.arc(cx, cy, radio * 0.94, 0, Math.PI * 2); ctx.stroke();

    const iw = radio * 1.3, ih = iw * edificio.height / edificio.width;
    ctx.drawImage(edificio, cx - iw / 2, cy - ih * 0.95, iw, ih);
    ctx.fillStyle = C.navy;
    ctx.font = `700 ${Math.round(radio * 0.17)}px ${SANS}`;
    espaciado(ctx, "WESTHILL", cx, cy + radio * 0.36, radio * 0.05);
  }

  async function dibujar({ nombre, codigo, link }) {
    if (document.fonts && document.fonts.load) {
      await Promise.all([
        document.fonts.load(`500 80px ${SERIF}`), document.fonts.load(`italic 400 30px ${SERIF}`),
      ]).catch(() => {});
    }
    const [logo, sello] = await Promise.all([imagen("logo-westhill-blanco.png"), imagen("edificio-westhill.png")]);

    const cv = document.createElement("canvas");
    cv.width = W; cv.height = H;
    const ctx = cv.getContext("2d");
    ctx.textAlign = "center";
    ctx.textBaseline = "alphabetic";

    // Fondo azul Westhill con luz arriba a la derecha (como el pase)
    let g = ctx.createLinearGradient(0, 0, W * 0.4, H);
    g.addColorStop(0, C.navy2); g.addColorStop(0.7, C.navy); g.addColorStop(1, "#163a5a");
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    g = ctx.createRadialGradient(W, 0, 0, W, 0, W * 0.95);
    g.addColorStop(0, "rgba(44, 97, 155, .95)"); g.addColorStop(1, "rgba(44, 97, 155, 0)");
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    g = ctx.createRadialGradient(W * 0.18, H * 0.06, 0, W * 0.18, H * 0.06, W * 0.55);
    g.addColorStop(0, "rgba(251, 231, 161, .16)"); g.addColorStop(1, "rgba(251, 231, 161, 0)");
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);

    // Filete dorado
    ctx.strokeStyle = "rgba(242, 201, 76, .55)"; ctx.lineWidth = 2;
    redondeado(ctx, 28, 28, W - 56, H - 56, 40); ctx.stroke();

    // Logo
    const lw = 330, lh = lw * logo.height / logo.width;
    ctx.drawImage(logo, (W - lw) / 2, 78, lw, lh);

    // Encabezado
    ctx.fillStyle = C.dorado;
    ctx.font = `600 26px ${SANS}`;
    espaciado(ctx, "PASE DE INVITACIÓN", W / 2, 300, 5);
    ctx.fillStyle = "rgba(255, 255, 255, .62)";
    ctx.font = `400 32px ${SANS}`;
    ctx.fillText("Te invita a conocer Westhill", W / 2, 360);
    ctx.fillStyle = "#fff";
    const quien = (nombre || "").trim() || "Universidad Westhill";
    ajustar(ctx, quien, 500, 80, SERIF, W - 200);
    ctx.fillText(quien, W / 2, 450);

    // Panel blanco con el QR
    const px = 120, py = 530, pw = W - 240, ph = 740;
    ctx.save();
    ctx.shadowColor = "rgba(8, 24, 42, .45)"; ctx.shadowBlur = 60; ctx.shadowOffsetY = 26;
    ctx.fillStyle = "#fff";
    redondeado(ctx, px, py, pw, ph, 44); ctx.fill();
    ctx.restore();

    const qs = 480;
    dibujarQR(ctx, link, (W - qs) / 2, py + 52, qs, sello);

    // Código en casillas (eco de los rodillos)
    const cod = String(codigo || "").toUpperCase();
    const bw = 66, bh = 82, gap = 12, total = cod.length * bw + (cod.length - 1) * gap;
    let bx = (W - total) / 2;
    const by = py + 52 + qs + 38;
    ctx.font = `600 44px ${SANS}`;
    for (const ch of cod) {
      ctx.fillStyle = C.fondo;
      redondeado(ctx, bx, by, bw, bh, 14); ctx.fill();
      ctx.strokeStyle = "rgba(39, 96, 146, .18)"; ctx.lineWidth = 2;
      redondeado(ctx, bx, by, bw, bh, 14); ctx.stroke();
      ctx.fillStyle = C.navy;
      ctx.fillText(ch, bx + bw / 2, by + bh / 2 + 16);
      bx += bw + gap;
    }

    ctx.fillStyle = C.gris;
    ctx.font = `400 26px ${SANS}`;
    ctx.fillText("Escanéalo para registrarte", W / 2, by + bh + 50);

    return cv;
  }

  function archivo(cv, codigo) {
    return new Promise((ok) => cv.toBlob((b) => ok(new File([b], `invitacion-westhill-${codigo}.png`, { type: "image/png" })), "image/png"));
  }

  window.RefTarjeta = { dibujar, archivo };
})();
