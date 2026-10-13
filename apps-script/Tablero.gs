/* ==========================================================================
   Universidad Westhill — Tablero de referidos
   Va en el mismo proyecto de Apps Script que Codigo.gs (Archivo > + > Script).
   --------------------------------------------------------------------------
   Ejecuta una vez `instalar`: crea las hojas Embajadores y Referidos con
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
  formatearTabla_(hoja_(HOJA_REFERIDORES, COLS_REFERIDORES), [150, 90, 220, 240, 130]);
  var reg = hoja_(HOJA_REFERIDOS, COLS_REFERIDOS);
  formatearTabla_(reg, [140, 120, 180, 200, 230, 120, 130, 240, 260, 220, 90]);
  pulirRegistros_(reg);
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
  t.getRange("A1:Z200").setFontFamily("Arial").setFontColor(UW.texto).setVerticalAlignment("middle");
  [24, 150, 90, 24, 150, 90, 24, 130, 170, 200, 80, 150, 24, 240, 90, 24, 150, 90].forEach(function (w, i) {
    t.setColumnWidth(i + 1, w);
  });

  // Encabezado
  t.getRange("A1:R1").merge().setValue("Embajadores Westhill")
    .setBackground(UW.azul).setFontColor("#ffffff").setFontSize(20).setFontWeight("bold")
    .setHorizontalAlignment("left");
  t.setRowHeight(1, 56);
  t.getRange("A2:R2").merge().setValue("Se actualiza solo con cada registro nuevo.")
    .setBackground(UW.azul).setFontColor("#dbe7f3").setFontSize(10);
  t.getRange("A3:R3").setBackground(UW.dorado);
  t.setRowHeight(3, 4);

  // Indicadores (B, E, H, K)
  var R = HOJA_REFERIDOS + "!", F = HOJA_REFERIDORES + "!";
  indicador_(t, "B5", "Registros totales", "=COUNTA(" + R + "D2:D)", UW.azul);
  indicador_(t, "E5", "Embajadores", "=COUNTA(" + F + "C2:C)", UW.verde);
  indicador_(t, "H5", "Registros de hoy", "=COUNTIFS(" + R + "A2:A,\">=\"&TODAY())", UW.dorado);
  indicador_(t, "J5", "Últimos 7 días", "=COUNTIFS(" + R + "A2:A,\">=\"&(TODAY()-6))", UW.azulOscuro);
  indicador_(t, "N5", "Promedio general", "=IFERROR(ROUND(AVERAGE(" + R + "K2:K),1),\"—\")", UW.verde);

  // Tablas dinámicas por fórmula (debajo de las gráficas para que crezcan sin taparse)
  titulo_(t, "B52", "Ranking de embajadores");
  t.getRange("B53").setFormula(fx_(
    "=IFERROR(QUERY(" + R + "A2:K,\"select C, count(D) where C <> '' group by C order by count(D) desc " +
    "label C 'Embajador', count(D) 'Invitados'\",0),\"Aún no hay registros\")"));

  titulo_(t, "E52", "Por nivel de estudios");
  t.getRange("E53").setFormula(fx_(
    "=IFERROR(QUERY(" + R + "A2:K,\"select G, count(D) where G <> '' group by G order by count(D) desc " +
    "label G 'Nivel', count(D) 'Registros'\",0),\"Aún no hay registros\")"));

  titulo_(t, "H52", "Últimos registros");
  t.getRange("H53").setFormula(fx_(
    "=IFERROR(QUERY(" + R + "A2:K,\"select A, D, H, K, C where D <> '' order by A desc limit 12 " +
    "label A 'Fecha', D 'Nombre', H 'Carrera', K 'Promedio', C 'Embajador' format K '0.0'\",0),\"Aún no hay registros\")"));
  t.getRange("H54:H65").setNumberFormat("dd/mm/yyyy hh:mm");

  titulo_(t, "N52", "Carreras más pedidas");
  t.getRange("N53").setFormula(fx_(
    "=IFERROR(QUERY(" + R + "A2:K,\"select H, count(D) where H <> '' group by H order by count(D) desc " +
    "label H 'Carrera', count(D) 'Registros'\",0),\"Aún no hay registros\")"));

  titulo_(t, "Q52", "Promedio por nivel");
  t.getRange("Q53").setFormula(fx_(
    "=IFERROR(QUERY(" + R + "A2:K,\"select G, avg(K) where G <> '' and K is not null group by G order by avg(K) desc " +
    "label G 'Nivel', avg(K) 'Promedio' format avg(K) '0.0'\",0),\"Aún no hay promedios\")"));

  // Serie por día (alimenta la gráfica; columnas Y:Z ocultas)
  titulo_(t, "Y52", "Por día");
  t.getRange("Y53").setFormula(fx_(
    "=IFERROR(QUERY(" + R + "A2:K,\"select toDate(A), count(D) where D <> '' group by toDate(A) " +
    "order by toDate(A) label toDate(A) 'Día', count(D) 'Registros'\",0),\"—\")"));
  t.getRange("Y54:Y500").setNumberFormat("dd/mm");

  [["B53:C53"], ["E53:F53"], ["H53:L53"], ["N53:O53"], ["Q53:R53"], ["Y53:Z53"]].forEach(function (r) {
    t.getRange(r[0]).setBackground(UW.fondo).setFontWeight("bold").setFontColor(UW.gris);
  });

  // Promedios pintados por rango (últimos registros y promedio por nivel)
  colorearPromedio_(t, [t.getRange("K54:K65"), t.getRange("R54:R70"), t.getRange("N6:O6")]);
  t.getRange("K54:K65").setHorizontalAlignment("center");
  t.getRange("R54:R70").setHorizontalAlignment("center");

  // Gráficas (sus rangos cubren filas vacías de sobra para crecer solas)
  var base = 9;
  // Alto fijo en la zona de gráficas para que nunca invadan las tablas (empiezan en la fila 52)
  t.setRowHeights(base, 43, 21);
  t.insertChart(t.newChart().setChartType(Charts.ChartType.BAR)
    .addRange(t.getRange("B53:C103")).setNumHeaders(1)
    .setPosition(base, 2, 0, 0)
    .setOption("title", "Invitados por embajador")
    .setOption("series", { 0: { color: UW.azul, dataLabel: "value" } }).setOption("legend", { position: "none" })
    .setOption("hAxis", { format: "0", minValue: 0, viewWindow: { min: 0 } })
    .setOption("width", 520).setOption("height", 320).build());

  t.insertChart(t.newChart().setChartType(Charts.ChartType.PIE)
    .addRange(t.getRange("E53:F63")).setNumHeaders(1)
    .setPosition(base, 8, 0, 0)
    .setOption("title", "Registros por nivel").setOption("pieHole", 0.45)
    // Leyenda a la derecha y cuántos + % en cada rebanada: se entiende aunque haya un solo nivel
    .setOption("legend", { position: "right", alignment: "center", textStyle: { fontSize: 12 } })
    .setOption("pieSliceText", "value-and-percentage")
    .setOption("pieSliceTextStyle", { color: "#ffffff", fontSize: 12, bold: true })
    .setOption("colors", [UW.azul, UW.dorado, UW.verde, UW.azulOscuro, "#a8811a", "#9cc3e6"])
    .setOption("slices", { 0: { color: UW.azul }, 1: { color: UW.dorado }, 2: { color: UW.verde },
      3: { color: UW.azulOscuro }, 4: { color: "#a8811a" }, 5: { color: "#9cc3e6" } })
    .setOption("width", 460).setOption("height", 320).build());

  // Columnas (no línea): con uno o pocos días se ve una barra, no un punto perdido
  t.insertChart(t.newChart().setChartType(Charts.ChartType.COLUMN)
    .addRange(t.getRange("Y53:Z500")).setNumHeaders(1)
    .setHiddenDimensionStrategy(Charts.ChartHiddenDimensionStrategy.SHOW_BOTH)
    .setPosition(base + 20, 2, 0, 0)
    .setOption("title", "Registros por día")
    .setOption("treatLabelsAsText", true)
    .setOption("bar", { groupWidth: "60%" })
    .setOption("vAxis", { format: "0", minValue: 0, viewWindow: { min: 0 } })
    .setOption("series", { 0: { color: UW.verde, dataLabel: "value" } }).setOption("legend", { position: "none" })
    .setOption("width", 1000).setOption("height", 300).build());

  // La serie por día solo alimenta la gráfica: se oculta
  t.hideColumns(25, 2);
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
  if (hoja.getFilter()) hoja.getFilter().remove();      // se rehace para cubrir columnas nuevas
  hoja.getRange(1, 1, hoja.getMaxRows(), cols).createFilter();
  hoja.getRange(2, 1, hoja.getMaxRows() - 1, 1).setNumberFormat("dd/mm/yyyy hh:mm");
  anchos.forEach(function (w, i) { hoja.setColumnWidth(i + 1, w); });
}

/** Colores del promedio: 7–7.9 amarillo, 8–8.9 azul, 9–10 verde. */
function colorearPromedio_(hoja, rangos) {
  var key = function (r) { return r.getA1Notation(); };
  var nuevos = rangos.map(key);
  // Quita reglas viejas sobre los mismos rangos para no duplicarlas
  var reglas = hoja.getConditionalFormatRules().filter(function (regla) {
    return !regla.getRanges().some(function (r) { return nuevos.indexOf(key(r)) >= 0; });
  });
  var regla = function (min, max, fondo, texto) {
    return SpreadsheetApp.newConditionalFormatRule().whenNumberBetween(min, max)
      .setBackground(fondo).setFontColor(texto).setBold(true).setRanges(rangos).build();
  };
  reglas.push(regla(7, 7.99, UW.dorado, UW.texto));
  reglas.push(regla(8, 8.99, UW.azul, "#ffffff"));
  reglas.push(regla(9, 10, UW.verde, "#ffffff"));
  hoja.setConditionalFormatRules(reglas);
}

/** Registros: promedio con un decimal y en color, columnas cortas centradas, mensaje con ajuste. */
function pulirRegistros_(hoja) {
  var filas = hoja.getMaxRows() - 1;
  hoja.getRange(2, 11, filas, 1).setNumberFormat("0.0").setHorizontalAlignment("center");
  hoja.getRange(2, 2, filas, 1).setHorizontalAlignment("center").setFontFamily("Roboto Mono");
  hoja.getRange(2, 6, filas, 2).setHorizontalAlignment("center");
  hoja.getRange(2, 9, filas, 1).setWrap(true);
  hoja.getRange(1, 1, 1, COLS_REFERIDOS.length).setHorizontalAlignment("center").setVerticalAlignment("middle");
  hoja.setRowHeight(1, 34);
  hoja.setFrozenColumns(4);
  colorearPromedio_(hoja, [hoja.getRange(2, 11, filas, 1)]);
}

/** Quita "Hoja 1" si quedó vacía. */
function quitarHojaVacia_() {
  var libro = SpreadsheetApp.getActiveSpreadsheet();
  ["Hoja 1", "Sheet1", "Hoja1"].forEach(function (n) {
    var h = libro.getSheetByName(n);
    if (h && h.getLastRow() === 0 && libro.getSheets().length > 1) libro.deleteSheet(h);
  });
}
