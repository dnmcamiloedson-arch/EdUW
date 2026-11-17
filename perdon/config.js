/* =========================================================================
   PERSONALIZA AQUÍ TODO EL CONTENIDO DE LA PÁGINA
   No necesitas tocar ningún otro archivo. Cambia los textos entre comillas.
   ========================================================================= */

window.PERDON = {
  // ---- Nombres -----------------------------------------------------------
  ella: "Mi amor",          // Su nombre (ej. "Valentina")
  el: "Yo",                 // Tu nombre, como firmarás la carta

  // ---- Música ------------------------------------------------------------
  // Opción A (recomendada): guarda la canción como  perdon/musica/si-es-posible.mp3
  // Opción B: pega el enlace de YouTube de la canción. Si el mp3 no existe,
  //           la página usará YouTube automáticamente.
  cancion: {
    titulo: "Si es posible",
    artista: "Clave Especial",
    mp3: "musica/si-es-posible.mp3",
    youtube: "",            // ej. "https://www.youtube.com/watch?v=XXXXXXXXXXX"
    inicioSegundos: 0,      // en qué segundo quieres que empiece
    momentoSi: 216,         // cuando ella toca "Sí", la canción salta a este segundo (3:36, el momento más intenso)
    volumenTiempo: 0.45,    // si toca "Necesito tiempo", la música baja suavemente a este volumen (0 a 1)
  },

  // ---- Portada -------------------------------------------------------------
  portada: {
    titulo: "Perdóname",
    subtitulo: "No es una página. Es todo lo que no supe decirte a tiempo.",
    cinta: ["lo siento", "te extraño", "aprendí", "contigo sí"],   // la franja que se mueve
  },

  // ---- Letra que aparece al hacer scroll -----------------------------------
  // Cada bloque [ ... ] es una estrofa; cada texto entre comillas es una línea.
  // Pega aquí la letra de "Si es posible" (o deja estos versos).
  letra: [
    ["Hay silencios que pesan más", "que cualquier palabra que dije mal."],
    ["Y aunque el orgullo me quiso callar,", "hoy elijo hablarte de verdad."],
    ["No vengo a pedir que olvides.", "Vengo a pedirte que me dejes", "demostrarte que aprendí."],
    ["Porque si es posible volver a empezar,", "quiero empezar contigo."],
  ],

  // ---- Nuestros momentos (fotos de ustedes) ----------------------------------
  // 1. Guarda las fotos en la carpeta perdon/fotos/ (jpg, png o webp).
  // 2. Escribe aquí el nombre del archivo de cada una.
  // 3. "frase": una frase feliz de la canción. "momento": qué pasó ese día.
  //    "fecha": aparece como el sello de fecha de una cámara de rollo (ej. "14 02 23").
  // Agrega o borra bloques { ... } para poner las fotos que quieras.
  recuerdos: [
    { foto: "fotos/1.jpg", frase: "", momento: "El día que todo empezó", fecha: "" },
    { foto: "fotos/2.jpg", frase: "", momento: "Tu risa, mi lugar favorito", fecha: "" },
    { foto: "fotos/3.jpg", frase: "", momento: "Cuando el mundo éramos solo nosotros", fecha: "" },
    { foto: "fotos/4.jpg", frase: "", momento: "Lo que quiero volver a vivir", fecha: "" },
    { foto: "fotos/5.jpg", frase: "", momento: "Y todo lo que nos falta", fecha: "" },
  ],
  fraseTiraPelicula: "Quiero más días así. Contigo.",

  // ---- Lo que hice mal (scroll horizontal) ---------------------------------
  confesiones: [
    { titulo: "Te fallé", texto: "Rompí algo que tú cuidabas con todo el corazón. No tengo excusas, y no voy a buscarlas." },
    { titulo: "No te escuché", texto: "Me hablaste y yo estaba en otra parte. Debí estar ahí, contigo, de verdad." },
    { titulo: "Fui orgulloso", texto: "Preferí tener la razón antes que tenerte a ti. Fue lo más tonto que he hecho." },
    { titulo: "Te hice llorar", texto: "Y eso es lo que más me duele: ser yo la razón de que tus ojos se apagaran." },
  ],

  // ---- Promesas (tarjetas que se apilan) -----------------------------------
  promesas: [
    { titulo: "Escucharte de verdad", texto: "Sin el celular, sin interrumpirte, sin defenderme. Solo tú." },
    { titulo: "Hablar antes de explotar", texto: "Cuando algo me moleste te lo diré con calma, no con silencios ni con orgullo." },
    { titulo: "Demostrarlo cada día", texto: "No con palabras bonitas, sino con hechos pequeños, constantes y reales." },
    { titulo: "Cuidar lo nuestro", texto: "Tratar lo que tenemos como lo más valioso que tengo. Porque lo es." },
  ],

  // ---- Carta ---------------------------------------------------------------
  carta: [
    "Sé que un perdón no borra lo que pasó, y no pretendo que lo haga.",
    "Pero necesitaba que supieras que entiendo el daño que te hice, y que me duele haberlo causado.",
    "No te escribo esto para convencerte. Te lo escribo porque te mereces la verdad, completa y sin adornos.",
    "Quiero ser alguien que te haga sentir en paz, no alguien que te haga dudar.",
    "Si decides darme otra oportunidad, la voy a cuidar como lo que es: un regalo. Y si necesitas tiempo, lo voy a respetar.",
  ],

  // ---- Pregunta final ------------------------------------------------------
  pregunta: "¿Me dejas intentarlo de nuevo?",
  respuestaSi: "Gracias por creer en mí otra vez. Esta vez lo voy a hacer bien.",
  respuestaTiempo: "Lo entiendo, y lo respeto. Tómate todo el tiempo que necesites. Aquí voy a estar.",

  // Tu WhatsApp con código de país, sin + ni espacios (ej. "573001234567").
  // Si lo dejas vacío, no aparece el botón para escribirte.
  whatsapp: "",
  mensajeSi: "Leí todo. Sí, intentémoslo.",
  mensajeTiempo: "Leí todo. Necesito un poco de tiempo.",

  // ---- Tarjeta QR para el dulce (abre qr.html) ------------------------------
  // Si dejas "urlPagina" vacío, el QR apunta solo a esta página una vez publicada.
  urlPagina: "https://claude.ai/artifact/LHauiuDT4gxjpJLi87Z2D7",
  textoTarjeta: "Escanéame",
  dedicatoriaTarjeta: "Para ti, otra vez.",
};
