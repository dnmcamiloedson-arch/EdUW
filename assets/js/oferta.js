/* ==========================================================================
   Universidad Westhill — Oferta académica en la invitación
   --------------------------------------------------------------------------
   · Catálogo de programas por nivel (tomado de uw.edu.mx; edítalo aquí).
   · Al tocar un nivel en el formulario aparecen sus carreras para elegir.
   · Barra de promedio (7.0 a 10) y etiqueta de "¿De qué prepa vienes?".
   ========================================================================== */
(function () {
  "use strict";

  const CATALOGO = {
    "Licenciatura": [
      "Administración y Dirección Empresarial", "Administración Empresarial", "Arquitectura",
      "Arquitectura de Interiores", "Cirujano Dentista", "Derecho (Plan UNAM)", "Médico Cirujano",
      "Mercadotecnia Estratégica", "Pedagogía", "Psicología", "Relaciones Internacionales (Plan UNAM)",
    ],
    "Maestría": [
      "Administración Estratégica", "Derecho Administrativo", "Educación con Orientación en Inclusión",
      "Educación Médica", "Gestión y Emprendimiento de Proyectos", "Implantología Oral Integral",
      "Innovación Educativa en Ciencias de la Salud", "Juicios Orales en Derecho Penal",
      "Psicoterapia de Última Generación", "Recursos Humanos",
    ],
    "Especialidad": [
      "Ciencias Penales", "Educación Inclusiva", "Estudio de Género", "Gestión y Emprendimiento de Proyectos",
      "Hábitat, Urbanismo y Paisajismo", "Implantología Oral Integral", "Responsabilidades Legales Médicas",
    ],
    "Diplomado": [
      "Enseñanza de la Anatomía", "Inclusión Universitaria y Transición a la Vida Adulta",
      "Innovación en Educación en Ciencias de la Salud",
    ],
    "Facultad de Medicina": ["Médico Cirujano"],
  };
  const PLURAL = { "Licenciatura": "licenciaturas", "Maestría": "maestrías", "Especialidad": "especialidades",
                   "Diplomado": "diplomados", "Facultad de Medicina": "programas" };
  const POSGRADO = ["Maestría", "Especialidad", "Diplomado"];
  const NO_SE = "Aún no lo sé";

  const el = (tag, cls, txt) => { const n = document.createElement(tag); if (cls) n.className = cls; if (txt != null) n.textContent = txt; return n; };

  /* --- Carreras del nivel elegido --------------------------------------- */
  function initCarreras(form) {
    const caja = form.querySelector("[data-carreras]");
    const pills = form.querySelector("[data-pills]");
    if (!caja || !pills) return;
    const titulo = caja.querySelector("[data-carreras-titulo]");
    const lista = caja.querySelector("[data-carreras-lista]");
    let actual = "";

    function pintar(nivel) {
      if (nivel === actual) return;
      actual = nivel;
      const progs = CATALOGO[nivel] || [];
      caja.classList.toggle("is-open", !!nivel);
      if (!nivel) { lista.textContent = ""; return; }
      titulo.textContent = progs.length === 1
        ? "Elige tu programa"
        : `${progs.length} ${PLURAL[nivel]} en Westhill. Elige una:`;
      lista.textContent = "";
      const opciones = progs.length === 1 ? progs : progs.concat(NO_SE);
      opciones.forEach((p, i) => {
        const lab = el("label", "rf-carrera" + (p === NO_SE ? " rf-carrera--nose" : ""));
        lab.style.setProperty("--i", i);
        const inp = el("input");
        inp.type = "radio"; inp.name = "carrera"; inp.value = p;
        if (progs.length === 1) inp.checked = true;
        lab.append(inp, el("span", null, p));
        lista.appendChild(lab);
      });
      // Reinicia la entrada escalonada aunque se cambie de nivel a medio camino
      lista.classList.remove("is-in"); void lista.offsetWidth; lista.classList.add("is-in");
      etiquetas(form, nivel);
    }

    pills.addEventListener("change", () => {
      const m = pills.querySelector("input:checked");
      pintar(m ? m.value : "");
    });
    form.addEventListener("reset", () => setTimeout(() => { pintar(""); etiquetas(form, ""); }, 0));
  }

  // Si viene de licenciatura pregunta por la prepa; si es posgrado, por su escuela
  function etiquetas(form, nivel) {
    const pos = POSGRADO.includes(nivel);
    const p = form.querySelector("[data-prepa-label]");
    const i = form.querySelector("[name=prepa]");
    const pr = form.querySelector("[data-promedio-label]");
    if (p) p.textContent = pos ? "¿De qué escuela o universidad vienes?" : "¿De qué prepa vienes?";
    if (i) i.placeholder = pos ? "Nombre de tu universidad" : "Nombre de tu preparatoria";
    if (pr) pr.textContent = pos ? "Tu promedio de licenciatura" : "Tu promedio";
  }

  /* --- Barra de promedio ------------------------------------------------- */
  function initPromedio(form) {
    const caja = form.querySelector("[data-promedio]");
    if (!caja) return;
    const r = caja.querySelector("input[type=range]");
    const out = caja.querySelector("output");
    const min = +r.min, max = +r.max;

    function pintar() {
      const v = +r.value;
      caja.style.setProperty("--p", ((v - min) / (max - min)) * 100 + "%");
      if ("vacio" in r.dataset) { out.textContent = "—"; caja.classList.remove("is-set"); return; }
      out.textContent = v.toFixed(1);
      caja.classList.add("is-set");
      caja.dataset.tono = v >= 9 ? "alto" : v >= 8 ? "medio" : "base";
      caja.classList.remove("is-invalid");
    }
    const tocar = () => { delete r.dataset.vacio; pintar(); };
    r.addEventListener("input", tocar);
    r.addEventListener("change", tocar);
    form.addEventListener("reset", () => setTimeout(() => { r.dataset.vacio = ""; r.value = r.defaultValue; pintar(); }, 0));
    pintar();
  }

  document.addEventListener("DOMContentLoaded", () => {
    document.querySelectorAll("form[data-referidos-form]").forEach((f) => { initCarreras(f); initPromedio(f); });
  });

  window.RefOferta = { CATALOGO };
})();
