/* ==========================================================================
   Universidad Westhill — Programa de referidos
   Backend en Google Apps Script (la hoja de cálculo funciona como base de datos)
   --------------------------------------------------------------------------
   Instalación:
     1. Crea una Hoja de cálculo de Google (puede importarse luego a Excel).
     2. Extensiones > Apps Script. Pega este archivo como Codigo.gs.
     3. Ejecuta una vez la función `configurar` (crea las hojas y encabezados).
     4. Implementar > Nueva implementación > Aplicación web
          · Ejecutar como: Yo
          · Quién tiene acceso: Cualquier persona
     5. Copia la URL que termina en /exec y pégala en
        assets/js/referidos.js (Referidos.CONFIG.ENDPOINT).
     6. Escribe abajo la clave de Admisiones (CLAVE_ADMISIONES). Solo quien
        la sepa puede generar códigos y ver la lista en admisiones.html.
        Si la cambias: Implementar > Gestionar implementaciones > Nueva versión.

   Hojas:
     · Referidores: a quienes Admisiones les generó un código (link personal).
     · Referidos:   registros que llegan desde el formulario con ?ref=CODIGO.

   API:
     GET  ?accion=referidor&codigo=ABC123  → { ok, referidor: { codigo, nombre } }
     POST (cuerpo JSON en text/plain, evita el preflight CORS)
          { accion: "crearReferidor",   clave, nombre, email, telefono }
            → { ok, codigo, nombre, nuevo }
          { accion: "listarReferidores", clave }
            → { ok, referidores: [{ codigo, nombre, correo, telefono, fecha, invitados }] }
          { accion: "registrarReferido", ref, nombre, email, telefono,
            nivel, programa, mensaje }
            → { ok, referidor: { codigo, nombre } | null }
   ========================================================================== */

// Clave que pide admisiones.html. Cámbiala aquí (no la subas al repositorio).
var CLAVE_ADMISIONES = "";

var HOJA_REFERIDORES = "Referidores";
var HOJA_REFERIDOS = "Referidos";

var COLS_REFERIDORES = ["Fecha", "Código", "Nombre", "Correo", "Teléfono"];
var COLS_REFERIDOS = ["Fecha", "Código referidor", "Nombre referidor",
  "Nombre", "Correo", "Teléfono", "Nivel", "Programa", "Mensaje"];

/** Ejecutar una vez desde el editor para preparar la hoja. */
function configurar() {
  hoja_(HOJA_REFERIDORES, COLS_REFERIDORES);
  hoja_(HOJA_REFERIDOS, COLS_REFERIDOS);
}

function doGet(e) {
  var p = (e && e.parameter) || {};
  try {
    if (p.accion === "referidor") {
      var r = buscarReferidor_(p.codigo);
      if (!r) return json_({ ok: false, error: "Código no encontrado." });
      return json_({ ok: true, referidor: { codigo: r.codigo, nombre: r.nombre } });
    }
    return json_({ ok: true, servicio: "referidos-westhill" });
  } catch (err) {
    return json_({ ok: false, error: String(err && err.message || err) });
  }
}

function doPost(e) {
  var datos;
  try {
    datos = JSON.parse((e && e.postData && e.postData.contents) || "{}");
  } catch (err) {
    return json_({ ok: false, error: "Cuerpo inválido." });
  }

  // Todo menos registrarse es solo para Admisiones
  if (datos.accion !== "registrarReferido") {
    var acceso = validarClave_(datos.clave);
    if (!acceso.ok) return json_(acceso);
  }

  // Evita códigos o filas duplicadas cuando llegan envíos simultáneos.
  var lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    if (datos.accion === "registrarReferido") return json_(registrarReferido_(datos));
    if (datos.accion === "crearReferidor") return json_(crearReferidor_(datos));
    if (datos.accion === "listarReferidores") return json_(listarReferidores_());
    return json_({ ok: false, error: "Acción desconocida." });
  } catch (err) {
    return json_({ ok: false, error: String(err && err.message || err) });
  } finally {
    lock.releaseLock();
  }
}

/* --- Acciones ------------------------------------------------------------ */

function crearReferidor_(d) {
  var nombre = limpiar_(d.nombre), email = limpiar_(d.email).toLowerCase();
  if (!nombre || !esEmail_(email)) return { ok: false, error: "Nombre y correo válidos son obligatorios." };

  // Si el correo ya tiene link, se devuelve el mismo código.
  var existente = buscarPor_(HOJA_REFERIDORES, 3, email);
  if (existente) return { ok: true, codigo: existente[1], nombre: existente[2], nuevo: false };

  var codigo = nuevoCodigo_();
  hoja_(HOJA_REFERIDORES, COLS_REFERIDORES)
    .appendRow([new Date(), codigo, texto_(nombre), texto_(email), texto_(d.telefono)]);
  return { ok: true, codigo: codigo, nombre: nombre, nuevo: true };
}

function registrarReferido_(d) {
  var nombre = limpiar_(d.nombre), email = limpiar_(d.email).toLowerCase();
  var telefono = limpiar_(d.telefono);
  if (!nombre || !esEmail_(email) || !telefono) {
    return { ok: false, error: "Nombre, correo y teléfono son obligatorios." };
  }

  var ref = buscarReferidor_(d.ref);
  hoja_(HOJA_REFERIDOS, COLS_REFERIDOS).appendRow([
    new Date(),
    ref ? ref.codigo : texto_(d.ref),   // se guarda aunque el código no exista, para revisarlo
    ref ? ref.nombre : "",
    texto_(nombre), texto_(email), texto_(telefono),
    texto_(d.nivel), texto_(d.programa), texto_(d.mensaje)
  ]);
  return { ok: true, referidor: ref ? { codigo: ref.codigo, nombre: ref.nombre } : null };
}

function listarReferidores_() {
  var refs = hoja_(HOJA_REFERIDORES, COLS_REFERIDORES).getDataRange().getValues().slice(1);
  var regs = hoja_(HOJA_REFERIDOS, COLS_REFERIDOS).getDataRange().getValues().slice(1);
  var cuenta = {};
  regs.forEach(function (r) {
    var c = String(r[1]).toUpperCase();
    cuenta[c] = (cuenta[c] || 0) + 1;
  });
  var lista = refs.filter(function (r) { return r[1]; }).map(function (r) {
    var c = String(r[1]).toUpperCase();
    return {
      codigo: c, nombre: String(r[2]), correo: String(r[3]), telefono: String(r[4]),
      fecha: r[0] instanceof Date ? r[0].toISOString() : String(r[0]),
      invitados: cuenta[c] || 0
    };
  });
  lista.sort(function (a, b) { return a.fecha < b.fecha ? 1 : -1; });   // más recientes primero
  return { ok: true, referidores: lista };
}

/* --- Utilidades ---------------------------------------------------------- */

function buscarReferidor_(codigo) {
  codigo = limpiar_(codigo).toUpperCase();
  if (!codigo) return null;
  var fila = buscarPor_(HOJA_REFERIDORES, 1, codigo);
  return fila ? { codigo: fila[1], nombre: fila[2] } : null;
}

/** Devuelve la primera fila cuya columna `col` (base 0) coincide sin importar mayúsculas. */
function buscarPor_(nombreHoja, col, valor) {
  var valores = hoja_(nombreHoja).getDataRange().getValues();
  var buscado = String(valor).toLowerCase();
  for (var i = 1; i < valores.length; i++) {
    if (String(valores[i][col]).toLowerCase() === buscado) return valores[i];
  }
  return null;
}

function nuevoCodigo_() {
  var letras = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // sin 0/O ni 1/I para dictarlos sin errores
  for (var intento = 0; intento < 20; intento++) {
    var codigo = "";
    for (var i = 0; i < 6; i++) codigo += letras.charAt(Math.floor(Math.random() * letras.length));
    if (!buscarPor_(HOJA_REFERIDORES, 1, codigo)) return codigo;
  }
  throw new Error("No se pudo generar un código único.");
}

function hoja_(nombre, columnas) {
  var libro = SpreadsheetApp.getActiveSpreadsheet();
  var hoja = libro.getSheetByName(nombre);
  if (!hoja) hoja = libro.insertSheet(nombre);
  if (columnas && hoja.getLastRow() === 0) {
    hoja.appendRow(columnas);
    hoja.setFrozenRows(1);
    hoja.getRange(1, 1, 1, columnas.length).setFontWeight("bold");
  }
  return hoja;
}

function validarClave_(clave) {
  if (!CLAVE_ADMISIONES) return { ok: false, error: "Falta poner CLAVE_ADMISIONES en Codigo.gs." };
  if (String(clave || "") !== CLAVE_ADMISIONES) {
    Utilities.sleep(800);                       // frena a quien intente adivinar
    return { ok: false, error: "Clave incorrecta.", clave: false };
  }
  return { ok: true };
}

function limpiar_(v) {
  return String(v == null ? "" : v).trim().slice(0, 500);
}

/** Guarda el valor como texto: evita fórmulas inyectadas (=...) y que +52 55... se vuelva número. */
function texto_(v) {
  v = limpiar_(v);
  return v ? "'" + v : "";
}

function esEmail_(v) {
  return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v);
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
