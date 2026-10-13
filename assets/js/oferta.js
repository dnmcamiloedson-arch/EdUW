/* ==========================================================================
   Universidad Westhill — Oferta académica en la invitación
   --------------------------------------------------------------------------
   · Catálogo de programas por nivel (tomado de uw.edu.mx; edítalo aquí).
   · Al tocar un nivel en el formulario aparecen sus carreras para elegir.
   · Tarjetas "Encuentra tu programa": abren la invitación con ese nivel.
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
  const TITULO = { "Licenciatura": "Licenciaturas", "Maestría": "Maestrías", "Especialidad": "Especialidades",
                   "Diplomado": "Diplomados", "Facultad de Medicina": "Medicina" };
  const POSGRADO = ["Maestría", "Especialidad", "Diplomado"];
  const NO_SE = "Aún no lo sé";

  const reducido = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;
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

  /* --- Tarjetas "Encuentra tu programa" ---------------------------------- */
  function initTarjetas() {
    const grid = document.querySelector("[data-oferta]");
    const form = document.querySelector("form[data-referidos-form]");
    if (!grid || !form) return;
    Object.keys(CATALOGO).forEach((nivel, i) => {
      const progs = CATALOGO[nivel];
      const b = el("button", "rf-nivel");
      b.type = "button";
      b.style.setProperty("--i", i);
      const n = el("span", "n", progs.length);
      const t = el("span", "t", TITULO[nivel]);
      const s = el("span", "s", progs.slice(0, 3).join(" · ") + (progs.length > 3 ? " y más" : ""));
      const go = el("span", "go", "Elegir");
      b.append(n, t, s, go);
      b.setAttribute("aria-label", `${TITULO[nivel]}: ${progs.length} programas. Elegir en la invitación`);
      b.addEventListener("click", () => irANivel(form, nivel));
      grid.appendChild(b);
    });
  }

  function irANivel(form, nivel) {
    const escena = document.querySelector("[data-escena]");
    const hoja = form.closest(".rf-letter");
    const radio = form.querySelector(`[data-pills] input[value="${nivel}"]`);
    const comportamiento = reducido() ? "auto" : "smooth";
    const elegir = () => {
      if (!radio) return;
      radio.checked = true;
      radio.dispatchEvent(new Event("change", { bubbles: true }));
      const destino = form.querySelector("[data-carreras]") || radio;
      requestAnimationFrame(() => destino.scrollIntoView({ behavior: comportamiento, block: "center" }));
    };
    if (hoja && hoja.hidden) { escena.scrollIntoView({ behavior: comportamiento, block: "start" }); return; }   // ya se envió
    if (hoja && hoja.hasAttribute("data-stowed")) {
      // Primero se abre el sobre (con su animación) y luego se marca el nivel
      escena.scrollIntoView({ behavior: comportamiento, block: "start" });
      const obs = new MutationObserver(() => {
        if (!hoja.hasAttribute("data-stowed")) { obs.disconnect(); setTimeout(elegir, reducido() ? 0 : 420); }
      });
      obs.observe(hoja, { attributes: true, attributeFilter: ["data-stowed"] });
      setTimeout(() => { const ab = escena.querySelector("[data-abrir]"); if (ab) ab.click(); }, reducido() ? 0 : 450);
    } else {
      elegir();
    }
  }

  document.addEventListener("DOMContentLoaded", () => {
    document.querySelectorAll("form[data-referidos-form]").forEach((f) => { initCarreras(f); initPromedio(f); });
    initTarjetas();
  });

  window.RefOferta = { CATALOGO };
})();
