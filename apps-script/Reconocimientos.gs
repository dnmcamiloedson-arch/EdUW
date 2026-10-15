/* ==========================================================================
   Universidad Westhill — Reconocimientos digitales
   Va en el mismo proyecto de Apps Script que Codigo.gs (Archivo > + > Script).
   --------------------------------------------------------------------------
   Admisiones (admisiones-reconocimientos.html) crea un reconocimiento por
   cada estudiante que visitó Westhill. Cada uno tiene un link corto
   (reconocimiento.html?c=CODIGO) que se manda por WhatsApp. Cuando el
   estudiante lo abre, la hoja anota la fecha ("Abierto").

   El diseño es fijo. Lo único que cambia son los textos y el logo de la prepa:
     · Prepas: catálogo con el logo de cada escuela. Al escribir o elegir la
               prepa en el panel, su logo sale solo en el sobre y en el
               reconocimiento. El logo se guarda como imagen pequeña (data:)
               dentro de la celda, así no depende de Drive ni de permisos.
     · Textos fijos (motivo, mensaje, firma): se guardan una vez con
               "Guardar como textos fijos" y se usan en cada grupo nuevo.

   Hojas (se crean solas la primera vez):
     · Reconocimientos: una fila por estudiante.
     · Prepas: una fila por escuela (Nombre, Logo, Actualizado).

   API (la rutea Codigo.gs):
     GET  ?accion=reconocimiento&codigo=ABCD2345
          → { ok, reconocimiento: { codigo, nombre, prepa, logo, motivo, fechaVisita, mensaje, firma } }
     POST { accion: "catalogoReconocimientos", clave }
          → { ok, prepas: [{ nombre, logo, reconocimientos }], textos: { motivo, mensaje, firma } }
     POST { accion: "guardarPrepa", clave, nombre, logo, anterior? }   (logo: data:image/... o "")
     POST { accion: "borrarPrepa", clave, nombre }
     POST { accion: "guardarTextos", clave, motivo, mensaje, firma }
     POST { accion: "crearReconocimientos", clave,
            grupo: { prepa, motivo, fechaVisita, mensaje, firma },
            estudiantes: [{ nombre, telefono }] }
          → { ok, reconocimientos: [{ codigo, nombre, telefono }] }
     POST { accion: "listarReconocimientos", clave }
          → { ok, reconocimientos: [{ codigo, fecha, nombre, telefono, prepa, motivo,
                                      fechaVisita, mensaje, firma, abierto, vistas }] }
   ========================================================================== */

var HOJA_RECONOCIMIENTOS = "Reconocimientos";
var COLS_RECONOCIMIENTOS = ["Fecha", "Código", "Nombre", "Teléfono", "Prepa / escuela", "Motivo",
  "Fecha de la visita", "Mensaje", "Firma", "Abierto", "Veces abierto"];
var HOJA_PREPAS = "Prepas";
var COLS_PREPAS = ["Nombre", "Logo", "Actualizado"];
var MAX_ESTUDIANTES = 200;
var MAX_LOGO = 48000;   // una celda admite 50,000 caracteres
var TEXTOS_INICIALES = {
  motivo: "su visita a la Universidad Westhill",
  mensaje: "Gracias por visitarnos. Que este sea el primer paso de un gran camino: aquí siempre tendrás un lugar.",
  firma: "Equipo de Admisiones"
};

/* --- Reconocimientos ----------------------------------------------------- */

function crearReconocimientos_(d) {
  var g = d.grupo || {};
  var prepa = limpiar_(g.prepa).slice(0, 80);
  if (!prepa) return { ok: false, error: "Escribe la prepa o escuela." };
  var estudiantes = (d.estudiantes || [])
    .map(function (e) { return { nombre: limpiar_(e && e.nombre).slice(0, 80), telefono: soloDigitos_(e && e.telefono) }; })
    .filter(function (e) { return e.nombre; });
  if (!estudiantes.length) return { ok: false, error: "Agrega al menos un estudiante." };
  if (estudiantes.length > MAX_ESTUDIANTES) return { ok: false, error: "Máximo " + MAX_ESTUDIANTES + " estudiantes por grupo." };

  var hoja = hoja_(HOJA_RECONOCIMIENTOS, COLS_RECONOCIMIENTOS);
  var usados = {};
  hoja.getRange(1, 2, Math.max(hoja.getLastRow(), 1), 1).getValues()
    .forEach(function (r) { usados[String(r[0]).toUpperCase()] = true; });

  var ahora = new Date();
  var filas = [], salida = [];
  estudiantes.forEach(function (e) {
    var codigo = codigoReconocimiento_(usados);
    usados[codigo] = true;
    filas.push([ahora, codigo, texto_(e.nombre), texto_(e.telefono), texto_(prepa),
      texto_(g.motivo), texto_(fechaISO_(g.fechaVisita)), texto_(g.mensaje), texto_(g.firma), "", 0]);
    salida.push({ codigo: codigo, nombre: e.nombre, telefono: e.telefono });
  });
  // Una sola escritura para todo el grupo (rápido aunque sean muchos)
  hoja.getRange(hoja.getLastRow() + 1, 1, filas.length, COLS_RECONOCIMIENTOS.length).setValues(filas);
  return { ok: true, reconocimientos: salida };
}

function listarReconocimientos_() {
  var filas = hoja_(HOJA_RECONOCIMIENTOS, COLS_RECONOCIMIENTOS).getDataRange().getValues().slice(1);
  var lista = filas.filter(function (r) { return r[1]; }).map(filaReconocimiento_);
  lista.sort(function (a, b) { return a.fecha < b.fecha ? 1 : -1; });   // más recientes primero
  return { ok: true, reconocimientos: lista };
}

/** Lo pide reconocimiento.html. Anota la primera vez que se abre y cuántas veces. */
function verReconocimiento_(codigo) {
  codigo = limpiar_(codigo).toUpperCase().replace(/[^A-Z0-9]/g, "");
  if (!codigo) return { ok: false, error: "Sin código." };
  var hoja = hoja_(HOJA_RECONOCIMIENTOS, COLS_RECONOCIMIENTOS);
  var valores = hoja.getDataRange().getValues();
  for (var i = 1; i < valores.length; i++) {
    if (String(valores[i][1]).toUpperCase() !== codigo) continue;
    var lock = LockService.getScriptLock();
    if (lock.tryLock(3000)) {
      try {
        if (!valores[i][9]) hoja.getRange(i + 1, 10).setValue(new Date());
        hoja.getRange(i + 1, 11).setValue((Number(valores[i][10]) || 0) + 1);
      } finally { lock.releaseLock(); }
    }
    var r = filaReconocimiento_(valores[i]);
    var prepa = buscarPrepa_(r.prepa);
    // Al estudiante solo le llega lo que se ve en su reconocimiento
    return { ok: true, reconocimiento: {
      codigo: r.codigo, nombre: r.nombre, prepa: r.prepa, logo: prepa ? prepa.logo : "",
      motivo: r.motivo, fechaVisita: r.fechaVisita, mensaje: r.mensaje, firma: r.firma
    } };
  }
  return { ok: false, error: "No encontramos este reconocimiento." };
}

/* --- Catálogo de prepas y textos fijos ----------------------------------- */

function catalogoReconocimientos_() {
  var cuenta = {};
  hoja_(HOJA_RECONOCIMIENTOS, COLS_RECONOCIMIENTOS).getDataRange().getValues().slice(1)
    .forEach(function (r) { var k = clavePrepa_(r[4]); if (k) cuenta[k] = (cuenta[k] || 0) + 1; });
  var prepas = hoja_(HOJA_PREPAS, COLS_PREPAS).getDataRange().getValues().slice(1)
    .filter(function (r) { return r[0]; })
    .map(function (r) {
      return { nombre: String(r[0]), logo: String(r[1] || ""), reconocimientos: cuenta[clavePrepa_(r[0])] || 0 };
    });
  prepas.sort(function (a, b) { return a.nombre.localeCompare(b.nombre, "es"); });
  return { ok: true, prepas: prepas, textos: leerTextos_() };
}

/** Alta o cambio. Si viene `anterior`, se renombra esa prepa. */
function guardarPrepa_(d) {
  var nombre = limpiar_(d.nombre).slice(0, 80);
  if (!nombre) return { ok: false, error: "Escribe el nombre de la prepa." };
  var logo = String(d.logo || "");
  if (logo && !/^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+\/=]+$/.test(logo)) return { ok: false, error: "El logo no es una imagen válida." };
  if (logo.length > MAX_LOGO) return { ok: false, error: "El logo es muy pesado. Prueba con otra imagen." };

  var hoja = hoja_(HOJA_PREPAS, COLS_PREPAS);
  var fila = filaPrepa_(hoja, d.anterior || nombre);
  var otra = d.anterior && clavePrepa_(d.anterior) !== clavePrepa_(nombre) ? filaPrepa_(hoja, nombre) : 0;
  if (otra) return { ok: false, error: "Ya existe una prepa con ese nombre." };
  var valores = [texto_(nombre), logo, new Date()];
  if (fila) hoja.getRange(fila, 1, 1, 3).setValues([valores]);
  else hoja.appendRow(valores);
  return { ok: true, prepa: { nombre: nombre, logo: logo } };
}

function borrarPrepa_(d) {
  var hoja = hoja_(HOJA_PREPAS, COLS_PREPAS);
  var fila = filaPrepa_(hoja, d.nombre);
  if (fila) hoja.deleteRow(fila);
  return { ok: true };
}

function guardarTextos_(d) {
  var textos = { motivo: limpiar_(d.motivo).slice(0, 90), mensaje: limpiar_(d.mensaje).slice(0, 200), firma: limpiar_(d.firma).slice(0, 60) };
  PropertiesService.getScriptProperties().setProperty("textosReconocimiento", JSON.stringify(textos));
  return { ok: true, textos: textos };
}

function leerTextos_() {
  try {
    var guardados = JSON.parse(PropertiesService.getScriptProperties().getProperty("textosReconocimiento") || "null");
    if (guardados) return guardados;
  } catch (err) { /* textos dañados: se usan los iniciales */ }
  return TEXTOS_INICIALES;
}

/* --- Utilidades ---------------------------------------------------------- */

function buscarPrepa_(nombre) {
  var hoja = hoja_(HOJA_PREPAS, COLS_PREPAS);
  var fila = filaPrepa_(hoja, nombre);
  if (!fila) return null;
  var v = hoja.getRange(fila, 1, 1, 2).getValues()[0];
  return { nombre: String(v[0]), logo: String(v[1] || "") };
}

/** Número de fila (base 1) de la prepa, sin importar mayúsculas, acentos ni espacios. */
function filaPrepa_(hoja, nombre) {
  var k = clavePrepa_(nombre);
  if (!k) return 0;
  var nombres = hoja.getRange(1, 1, Math.max(hoja.getLastRow(), 1), 1).getValues();
  for (var i = 1; i < nombres.length; i++) if (clavePrepa_(nombres[i][0]) === k) return i + 1;
  return 0;
}

/** "EPO 23", "epo23" y "E.P.O. 23" cuentan como la misma prepa. */
function clavePrepa_(v) {
  return String(v == null ? "" : v).toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]/g, "");
}

function filaReconocimiento_(r) {
  var fecha = function (v) { return v instanceof Date ? v.toISOString() : String(v || ""); };
  return {
    codigo: String(r[1]).toUpperCase(), fecha: fecha(r[0]),
    nombre: String(r[2]), telefono: String(r[3]), prepa: String(r[4]), motivo: String(r[5]),
    fechaVisita: r[6] instanceof Date ? Utilities.formatDate(r[6], "America/Mexico_City", "yyyy-MM-dd") : String(r[6]),
    mensaje: String(r[7]), firma: String(r[8]),
    abierto: fecha(r[9]), vistas: Number(r[10]) || 0
  };
}

/** 8 caracteres sin 0/O ni 1/I: difícil de adivinar y fácil de dictar. */
function codigoReconocimiento_(usados) {
  var letras = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  for (var intento = 0; intento < 50; intento++) {
    var codigo = "";
    for (var i = 0; i < 8; i++) codigo += letras.charAt(Math.floor(Math.random() * letras.length));
    if (!usados[codigo]) return codigo;
  }
  throw new Error("No se pudo generar un código único.");
}

function soloDigitos_(v) {
  return String(v == null ? "" : v).replace(/\D/g, "").slice(0, 15);
}

/** Acepta 2026-10-15; cualquier otra cosa se guarda tal cual (ya limpia). */
function fechaISO_(v) {
  v = limpiar_(v);
  return /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : v.slice(0, 40);
}

/** Formato de las hojas (lo llama `instalar` en Tablero.gs). */
function formatearReconocimientos_() {
  var hoja = hoja_(HOJA_RECONOCIMIENTOS, COLS_RECONOCIMIENTOS);
  formatearTabla_(hoja, [140, 110, 220, 120, 220, 220, 120, 320, 180, 140, 100]);
  var filas = hoja.getMaxRows() - 1;
  hoja.getRange(2, 2, filas, 1).setHorizontalAlignment("center").setFontFamily("Roboto Mono");
  hoja.getRange(2, 10, filas, 1).setNumberFormat("dd/mm/yyyy hh:mm");
  hoja.getRange(2, 10, filas, 2).setHorizontalAlignment("center");
  hoja.getRange(2, 8, filas, 1).setWrap(true);
  hoja.setFrozenColumns(3);
  var prepas = hoja_(HOJA_PREPAS, COLS_PREPAS);
  prepas.getRange(1, 1, 1, 3).setFontWeight("bold").setBackground("#276092").setFontColor("#ffffff");
  prepas.setColumnWidth(1, 240); prepas.setColumnWidth(2, 160); prepas.setColumnWidth(3, 140);
  prepas.getRange(2, 2, prepas.getMaxRows() - 1, 1).setWrap(false);
  prepas.setFrozenRows(1);
}
