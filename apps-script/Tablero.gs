/* ==========================================================================
   Universidad Westhill — Tablero de referidos
   Va en el mismo proyecto de Apps Script que Codigo.gs (Archivo > + > Script).
   --------------------------------------------------------------------------
   Ejecuta una vez `instalar`: crea las hojas Referidores y Referidos con
   formato de tabla y una hoja "Tablero" con indicadores, tablas y gráficas.
   Todo sale de fórmulas, así que se actualiza solo con cada registro nuevo.
   Puedes volver a ejecutar `crearTablero` cuando quieras rehacer el tablero
   (no toca los registros).
   ========================================================================== */

var HOJA_TABLERO = "Tablero";
var UW = { azul: "#276092", azulOscuro: "#1d4a72", dorado: "#f2c94c", verde: "#27ae60",
           fondo: "#f4f7fb", texto: "#13304d", gris: "#6b7280" };

/** Ejecutar una vez desde el editor. */
function instalar() {
  configurar();
  formatearTabla_(hoja_(HOJA_REFERIDORES, COLS_REFERIDORES), [150, 90, 200, 230, 130]);
  formatearTabla_(hoja_(HOJA_REFERIDOS, COLS_REFERIDOS), [150, 110, 180, 200, 230, 130, 130, 170, 260]);
  crearTablero();
  quitarHojaVacia_();
}

function crearTablero() {
  var libro = SpreadsheetApp.getActiveSpreadsheet();
  var previa = libro.getSheetByName(HOJA_TABLERO);
  if (previa) libro.deleteSheet(previa);
  var t = libro.insertSheet(HOJA_TABLERO, 0);
  SEP = separador_(t);
  t.setHiddenGridlines(true);
  t.getRange("A1:N80").setFontFamily("Arial").setFontColor(UW.texto).setVerticalAlignment("middle");
  [24, 150, 90, 24, 150, 90, 24, 140, 180, 140, 160, 24, 110, 90].forEach(function (w, i) {
    t.setColumnWidth(i + 1, w);
  });

  // Encabezado
  t.getRange("A1:K1").merge().setValue("Referidos Westhill")
    .setBackground(UW.azul).setFontColor("#ffffff").setFontSize(20).setFontWeight("bold")
    .setHorizontalAlignment("left");
  t.setRowHeight(1, 56);
  t.getRange("A2:K2").merge().setValue("Se actualiza solo con cada registro nuevo.")
    .setBackground(UW.azul).setFontColor("#dbe7f3").setFontSize(10);
  t.getRange("A3:K3").setBackground(UW.dorado);
  t.setRowHeight(3, 4);

  // Indicadores (B, E, H, K)
  var R = "Referidos!", F = "Referidores!";
  indicador_(t, "B5", "Registros totales", "=COUNTA(" + R + "D2:D)", UW.azul);
  indicador_(t, "E5", "Referidores", "=COUNTA(" + F + "C2:C)", UW.verde);
  indicador_(t, "H5", "Registros de hoy", "=COUNTIFS(" + R + "A2:A,\">=\"&TODAY())", UW.dorado);
  indicador_(t, "J5", "Últimos 7 días", "=COUNTIFS(" + R + "A2:A,\">=\"&(TODAY()-6))", UW.azulOscuro);

  // Tablas dinámicas por fórmula
  titulo_(t, "B9", "Ranking de referidores");
  t.getRange("B10").setFormula(fx_(
    "=IFERROR(QUERY(" + R + "A2:I,\"select C, count(D) where C <> '' group by C order by count(D) desc " +
    "label C 'Referidor', count(D) 'Invitados'\",0),\"Aún no hay registros\")"));

  titulo_(t, "E9", "Por nivel de estudios");
  t.getRange("E10").setFormula(fx_(
    "=IFERROR(QUERY(" + R + "A2:I,\"select G, count(D) where G <> '' group by G order by count(D) desc " +
    "label G 'Nivel', count(D) 'Registros'\",0),\"Aún no hay registros\")"));

  titulo_(t, "H9", "Últimos registros");
  t.getRange("H10").setFormula(fx_(
    "=IFERROR(QUERY(" + R + "A2:I,\"select A, D, G, C where D <> '' order by A desc limit 12 " +
    "label A 'Fecha', D 'Nombre', G 'Nivel', C 'Invitado por'\",0),\"Aún no hay registros\")"));
  t.getRange("H11:H22").setNumberFormat("dd/mm/yyyy hh:mm");

  // Serie por día (alimenta la gráfica de línea)
  titulo_(t, "M9", "Por día");
  t.getRange("M10").setFormula(fx_(
    "=IFERROR(QUERY(" + R + "A2:I,\"select toDate(A), count(D) where D <> '' group by toDate(A) " +
    "order by toDate(A) label toDate(A) 'Día', count(D) 'Registros'\",0),\"—\")"));
  t.getRange("M11:M400").setNumberFormat("dd/mm");

  [["B10:C10"], ["E10:F10"], ["H10:K10"], ["M10:N10"]].forEach(function (r) {
    t.getRange(r[0]).setBackground(UW.fondo).setFontWeight("bold").setFontColor(UW.gris);
  });

  // Gráficas (sus rangos cubren filas vacías de sobra para crecer solas)
  var base = 25;
  t.insertChart(t.newChart().setChartType(Charts.ChartType.BAR)
    .addRange(t.getRange("B10:C30")).setNumHeaders(1)
    .setPosition(base, 2, 0, 0)
    .setOption("title", "Invitados por referidor")
    .setOption("series", { 0: { color: UW.azul } }).setOption("legend", { position: "none" })
    .setOption("width", 520).setOption("height", 320).build());

  t.insertChart(t.newChart().setChartType(Charts.ChartType.PIE)
    .addRange(t.getRange("E10:F20")).setNumHeaders(1)
    .setPosition(base, 8, 0, 0)
    .setOption("title", "Registros por nivel").setOption("pieHole", 0.5)
    .setOption("slices", { 0: { color: UW.azul }, 1: { color: UW.dorado }, 2: { color: UW.verde },
      3: { color: UW.azulOscuro }, 4: { color: "#a8811a" }, 5: { color: "#9cc3e6" } })
    .setOption("width", 460).setOption("height", 320).build());

  t.insertChart(t.newChart().setChartType(Charts.ChartType.AREA)
    .addRange(t.getRange("M10:N400")).setNumHeaders(1)
    .setHiddenDimensionStrategy(Charts.ChartHiddenDimensionStrategy.SHOW_BOTH)
    .setPosition(base + 17, 2, 0, 0)
    .setOption("title", "Registros por día")
    .setOption("series", { 0: { color: UW.verde } }).setOption("legend", { position: "none" })
    .setOption("width", 1000).setOption("height", 300).build());

  // La serie por día solo alimenta la gráfica: se oculta
  t.hideColumns(12, 3);
  t.setFrozenRows(3);
  libro.setActiveSheet(t);
}

/* --- Ayudantes ----------------------------------------------------------- */

// En configuraciones como México o España las fórmulas separan con ";" en vez de ",".
var SEP = ",";
function separador_(t) {
  var c = t.getRange("Z1");
  c.setFormula("=SUM(1,2)");
  SpreadsheetApp.flush();
  var coma = c.getValue() === 3;
  c.clearContent();
  return coma ? "," : ";";
}
/** Cambia las comas que separan argumentos (no las de dentro de comillas). */
function fx_(formula) {
  if (SEP === ",") return formula;
  var out = "", enTexto = false;
  for (var i = 0; i < formula.length; i++) {
    var ch = formula.charAt(i);
    if (ch === '"') enTexto = !enTexto;
    out += (ch === "," && !enTexto) ? SEP : ch;
  }
  return out;
}

function indicador_(t, celda, etiqueta, formula, color) {
  var c = t.getRange(celda);
  var fila = c.getRow(), col = c.getColumn();
  t.getRange(fila, col, 1, 2).merge().setValue(etiqueta)
    .setFontSize(10).setFontColor(UW.gris).setBackground(UW.fondo);
  t.getRange(fila + 1, col, 1, 2).merge().setFormula(fx_(formula))
    .setFontSize(28).setFontWeight("bold").setFontColor(color).setBackground(UW.fondo)
    .setHorizontalAlignment("left");
  t.getRange(fila, col, 2, 2).setBorder(true, true, true, true, null, null, "#e3e9f1",
    SpreadsheetApp.BorderStyle.SOLID);
  t.setRowHeight(fila + 1, 46);
}

function titulo_(t, celda, texto) {
  t.getRange(celda).setValue(texto).setFontSize(12).setFontWeight("bold").setFontColor(UW.azul);
}

/** Encabezado azul, filas alternadas, filtro y anchos de columna. */
function formatearTabla_(hoja, anchos) {
  var cols = anchos.length;
  hoja.getBandings().forEach(function (b) { b.remove(); });
  var rango = hoja.getRange(1, 1, hoja.getMaxRows(), cols);
  rango.applyRowBanding(SpreadsheetApp.BandingTheme.BLUE, true, false)
    .setHeaderRowColor(UW.azul).setFirstRowColor("#ffffff").setSecondRowColor(UW.fondo);
  hoja.getRange(1, 1, 1, cols).setFontColor("#ffffff").setFontWeight("bold");
  hoja.setFrozenRows(1);
  if (!hoja.getFilter()) hoja.getRange(1, 1, hoja.getMaxRows(), cols).createFilter();
  hoja.getRange(2, 1, hoja.getMaxRows() - 1, 1).setNumberFormat("dd/mm/yyyy hh:mm");
  anchos.forEach(function (w, i) { hoja.setColumnWidth(i + 1, w); });
}

/** Quita "Hoja 1" si quedó vacía. */
function quitarHojaVacia_() {
  var libro = SpreadsheetApp.getActiveSpreadsheet();
  ["Hoja 1", "Sheet1", "Hoja1"].forEach(function (n) {
    var h = libro.getSheetByName(n);
    if (h && h.getLastRow() === 0 && libro.getSheets().length > 1) libro.deleteSheet(h);
  });
}
