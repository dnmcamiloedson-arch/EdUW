/* ==========================================================================
   Universidad Westhill — Datos de ejemplo para el tablero
   Va en el mismo proyecto que Codigo.gs y Tablero.gs.
   --------------------------------------------------------------------------
   · cargarDemo: agrega 6 referidores y 15 invitados inventados de las
     últimas 4 semanas para ver el Tablero y las gráficas con datos.
   · borrarDemo: quita SOLO esos registros (todos usan correos
     @ejemplo.com). Ejecútalo antes de lanzar.
   ========================================================================== */

var DOMINIO_DEMO = "@ejemplo.com";

function cargarDemo() {
  borrarDemo();
  // [referidor, personas que invitó] — 15 invitados en total
  var refs = [
    ["Ana Lucía Torres", 4], ["Carlos Méndez", 3], ["Mariana López", 3],
    ["Jorge Ramírez", 2], ["Fernanda Ruiz", 2], ["Diego Hernández", 1]
  ];
  var nombres = ["Alejandro", "Camila", "Daniel", "Regina", "Emiliano", "Ximena", "Santiago", "Renata",
    "Mateo", "Natalia", "Sebastián", "Daniela", "Leonardo", "Valentina", "Diego", "Isabela",
    "Rodrigo", "Andrea", "Iván", "Paulina", "Héctor", "Lucía", "Óscar", "Fernanda"];
  var apellidos = ["García", "Martínez", "Rodríguez", "Pérez", "Sánchez", "Flores", "Gómez", "Díaz",
    "Cruz", "Reyes", "Morales", "Ortiz", "Gutiérrez", "Chávez", "Romero", "Vargas"];
  var niveles = [["Licenciatura", 45], ["Maestría", 22], ["Facultad de Medicina", 15],
    ["Especialidad", 10], ["Diplomado", 8]];
  var programas = {
    "Licenciatura": ["Derecho", "Psicología", "Administración", "Arquitectura", "Comunicación"],
    "Maestría": ["Educación", "Finanzas", "Derecho Corporativo", "Mercadotecnia"],
    "Facultad de Medicina": ["Médico Cirujano"],
    "Especialidad": ["Ortodoncia", "Derecho Fiscal"],
    "Diplomado": ["Gestión de proyectos", "Marketing digital"]
  };

  var ahora = new Date();
  var diasAtras = function (maxDias) {
    // Más registros en los días recientes, para que la gráfica suba.
    var d = Math.floor(Math.pow(Math.random(), 1.6) * maxDias);
    var f = new Date(ahora.getTime() - d * 86400000);
    f.setHours(9 + Math.floor(Math.random() * 11), Math.floor(Math.random() * 60), 0, 0);
    return f;
  };
  var azar = function (a) { return a[Math.floor(Math.random() * a.length)]; };
  var pesado = function (pares) {
    var total = pares.reduce(function (s, p) { return s + p[1]; }, 0), r = Math.random() * total;
    for (var i = 0; i < pares.length; i++) { r -= pares[i][1]; if (r <= 0) return pares[i][0]; }
    return pares[0][0];
  };
  var slug = function (s) {
    return s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z]+/g, ".");
  };
  var tel = function () { return "'55" + String(Math.floor(10000000 + Math.random() * 89999999)); };

  // Referidores
  var filasRef = [], codigos = [];
  refs.forEach(function (r) {
    var codigo = nuevoCodigo_();
    codigos.push([codigo, r[0], r[1]]);
    filasRef.push([diasAtras(30), codigo, r[0], slug(r[0]) + DOMINIO_DEMO, tel()]);
  });
  var hRef = hoja_(HOJA_REFERIDORES, COLS_REFERIDORES);
  hRef.getRange(hRef.getLastRow() + 1, 1, filasRef.length, 5).setValues(filasRef);

  // Registros
  var filas = [];
  codigos.forEach(function (c) {
    for (var i = 0; i < c[2]; i++) {
      var nombre = azar(nombres) + " " + azar(apellidos) + " " + azar(apellidos);
      var nivel = pesado(niveles);
      filas.push([diasAtras(28), c[0], c[1], nombre, slug(nombre) + DOMINIO_DEMO, tel(),
        nivel, azar(programas[nivel]), ""]);
    }
  });
  var hReg = hoja_(HOJA_REFERIDOS, COLS_REFERIDOS);
  hReg.getRange(hReg.getLastRow() + 1, 1, filas.length, 9).setValues(filas);

  ordenarPorFecha_(hRef);
  ordenarPorFecha_(hReg);
  SpreadsheetApp.getActiveSpreadsheet().toast(filas.length + " registros de ejemplo cargados.", "Demo");
}

function borrarDemo() {
  [[HOJA_REFERIDORES, 3], [HOJA_REFERIDOS, 4]].forEach(function (h) {
    var hoja = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(h[0]);
    if (!hoja || hoja.getLastRow() < 2) return;
    var correos = hoja.getRange(2, h[1] + 1, hoja.getLastRow() - 1, 1).getValues();
    for (var i = correos.length - 1; i >= 0; i--) {
      if (String(correos[i][0]).toLowerCase().slice(-DOMINIO_DEMO.length) === DOMINIO_DEMO) {
        hoja.deleteRow(i + 2);
      }
    }
  });
}

function ordenarPorFecha_(hoja) {
  if (hoja.getLastRow() > 2) {
    hoja.getRange(2, 1, hoja.getLastRow() - 1, hoja.getLastColumn()).sort({ column: 1, ascending: true });
  }
}
