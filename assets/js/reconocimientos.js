/* ==========================================================================
   Universidad Westhill — Reconocimientos digitales (cliente)
   --------------------------------------------------------------------------
   Habla con el mismo Apps Script que los referidos (apps-script/Reconocimientos.gs).
   Usa la URL de Referidos.CONFIG.ENDPOINT: carga antes assets/js/referidos.js.

     Reconocimientos.codigoDesdeURL()      código del link (?c=ABCD2345) o ""
     Reconocimientos.link(codigo)          URL absoluta de reconocimiento.html?c=
     Reconocimientos.obtener(codigo)       → { ok, reconocimiento }
     Reconocimientos.crear(datos)          → { ok, reconocimientos: [{ codigo, nombre, telefono, link }] }
     Reconocimientos.listar(clave)         → { ok, reconocimientos: [...] }
     Reconocimientos.catalogo(clave)       → { ok, prepas: [{ nombre, logo, reconocimientos }], textos }
     Reconocimientos.guardarPrepa(datos)   → { ok, prepa }   (datos: clave, nombre, logo, anterior?)
     Reconocimientos.borrarPrepa(datos)    → { ok }          (datos: clave, nombre)
     Reconocimientos.guardarTextos(datos)  → { ok, textos }  (datos: clave, motivo, mensaje, firma)
     Reconocimientos.clavePrepa("E.P.O. 23") → "epo23"  (para reconocer la prepa al escribirla)
     Reconocimientos.prepararLogo(file)    → Promise<"data:image/...">  (chico, cabe en una celda)
     Reconocimientos.fechaLarga("2026-10-15") → "15 de octubre de 2026"
     Reconocimientos.leerEstudiantes(texto)   → [{ nombre, telefono }]  (pegado de Excel o a mano)
   ========================================================================== */
(function () {
  "use strict";

  const PAGINA = "reconocimiento.html";
  const endpoint = () => (window.Referidos && Referidos.CONFIG.ENDPOINT) || "";
  const sinEndpoint = () => ({ ok: false, error: "Falta configurar Referidos.CONFIG.ENDPOINT." });

  const normalizar = (c) => String(c || "").trim().toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 20);

  function codigoDesdeURL() {
    const p = new URLSearchParams(location.search);
    return normalizar(p.get("c") || p.get("codigo"));
  }

  function link(codigo) {
    const url = new URL(PAGINA, location.href);
    url.search = "";
    url.hash = "";
    url.searchParams.set("c", normalizar(codigo));
    return url.toString();
  }

  async function obtener(codigo) {
    codigo = normalizar(codigo);
    if (!codigo) return { ok: false, error: "Sin código." };
    if (!endpoint()) return sinEndpoint();
    const url = new URL(endpoint());
    url.searchParams.set("accion", "reconocimiento");
    url.searchParams.set("codigo", codigo);
    const res = await fetch(url.toString());
    return res.json();
  }

  // text/plain evita el preflight CORS, que Apps Script no responde.
  async function enviar(datos) {
    if (!endpoint()) return sinEndpoint();
    const res = await fetch(endpoint(), {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(datos),
    });
    return res.json();
  }

  async function crear(datos) {
    const r = await enviar(Object.assign({}, datos, { accion: "crearReconocimientos" }));
    if (r.ok) r.reconocimientos.forEach((x) => { x.link = link(x.codigo); });
    return r;
  }

  async function listar(clave) {
    const r = await enviar({ accion: "listarReconocimientos", clave });
    if (r.ok) r.reconocimientos.forEach((x) => { x.link = link(x.codigo); });
    return r;
  }

  const catalogo = (clave) => enviar({ accion: "catalogoReconocimientos", clave });
  const guardarPrepa = (d) => enviar(Object.assign({}, d, { accion: "guardarPrepa" }));
  const borrarPrepa = (d) => enviar(Object.assign({}, d, { accion: "borrarPrepa" }));
  const guardarTextos = (d) => enviar(Object.assign({}, d, { accion: "guardarTextos" }));

  // Igual que clavePrepa_ en Reconocimientos.gs
  const clavePrepa = (v) => String(v || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, "");

  /* El logo se reduce en el navegador (máx. 360 px, sin bordes vacíos) y se
     guarda como data: dentro de la hoja. Así no hay permisos de Drive ni
     imágenes de otro sitio que bloqueen la tarjeta. */
  const MAX_LOGO = 46000;
  function prepararLogo(file) {
    return new Promise((ok, mal) => {
      if (!file || !/^image\//.test(file.type)) { mal(new Error("Elige una imagen (PNG o JPG).")); return; }
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onerror = () => { URL.revokeObjectURL(url); mal(new Error("No se pudo leer la imagen.")); };
      img.onload = () => {
        URL.revokeObjectURL(url);
        const recorte = recortar(img);
        for (const lado of [360, 300, 240, 200, 160, 128]) {
          const k = Math.min(1, lado / Math.max(recorte.w, recorte.h));
          const cv = document.createElement("canvas");
          cv.width = Math.max(1, Math.round(recorte.w * k));
          cv.height = Math.max(1, Math.round(recorte.h * k));
          const ctx = cv.getContext("2d");
          ctx.imageSmoothingQuality = "high";
          ctx.drawImage(img, recorte.x, recorte.y, recorte.w, recorte.h, 0, 0, cv.width, cv.height);
          for (const tipo of ["image/webp", "image/png"]) {
            const d = cv.toDataURL(tipo, 0.9);
            if (d.startsWith("data:" + tipo) && d.length <= MAX_LOGO) { ok(d); return; }
          }
        }
        mal(new Error("La imagen es muy pesada. Prueba con un logo más sencillo."));
      };
      img.src = url;
    });
  }

  // Quita el margen transparente o blanco alrededor del logo para que todos se vean del mismo tamaño
  function recortar(img) {
    const w = img.naturalWidth, h = img.naturalHeight;
    const k = Math.min(1, 400 / Math.max(w, h));
    const cv = document.createElement("canvas");
    cv.width = Math.max(1, Math.round(w * k)); cv.height = Math.max(1, Math.round(h * k));
    const ctx = cv.getContext("2d");
    ctx.drawImage(img, 0, 0, cv.width, cv.height);
    let datos;
    try { datos = ctx.getImageData(0, 0, cv.width, cv.height).data; } catch (e) { return { x: 0, y: 0, w, h }; }
    let x0 = cv.width, y0 = cv.height, x1 = -1, y1 = -1;
    for (let y = 0; y < cv.height; y++) {
      for (let x = 0; x < cv.width; x++) {
        const i = (y * cv.width + x) * 4;
        const vacio = datos[i + 3] < 16 || (datos[i] > 245 && datos[i + 1] > 245 && datos[i + 2] > 245);
        if (vacio) continue;
        if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y;
      }
    }
    if (x1 < 0) return { x: 0, y: 0, w, h };
    const m = 2;
    x0 = Math.max(0, x0 - m); y0 = Math.max(0, y0 - m);
    x1 = Math.min(cv.width - 1, x1 + m); y1 = Math.min(cv.height - 1, y1 + m);
    return { x: x0 / k, y: y0 / k, w: (x1 - x0 + 1) / k, h: (y1 - y0 + 1) / k };
  }

  const MESES = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto",
    "septiembre", "octubre", "noviembre", "diciembre"];
  function fechaLarga(iso) {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(iso || ""));
    if (!m) return String(iso || "");
    return `${Number(m[3])} de ${MESES[Number(m[2]) - 1]} de ${m[1]}`;
  }

  /* Un estudiante por renglón. Acepta lo que se pega de Excel o WhatsApp:
       Ana López
       Ana López, 55 1234 5678
       Ana López<TAB>5512345678
     El teléfono es lo que queda al final con 10 dígitos o más. */
  function leerEstudiantes(texto) {
    return String(texto || "").split(/\r?\n/).map((linea) => {
      linea = linea.trim();
      if (!linea) return null;
      let telefono = "";
      const m = /^(.*?)[\s,;\t|–-]*(\+?[\d][\d\s().-]{8,}\d)$/.exec(linea);
      if (m && m[2].replace(/\D/g, "").length >= 10) {
        telefono = m[2].replace(/\D/g, "");
        linea = m[1];
      }
      const nombre = linea.replace(/^\s*\d+[.)-]\s+/, "")         // "1. Ana" → "Ana"
        .replace(/[\t,;|]+/g, " ").replace(/\s+/g, " ").trim();
      return nombre ? { nombre, telefono } : null;
    }).filter(Boolean);
  }

  window.Reconocimientos = {
    codigoDesdeURL, link, obtener, crear, listar, catalogo, guardarPrepa, borrarPrepa, guardarTextos,
    clavePrepa, prepararLogo, fechaLarga, leerEstudiantes,
  };
})();
