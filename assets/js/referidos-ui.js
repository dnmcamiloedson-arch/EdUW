/* ==========================================================================
   Universidad Westhill — Programa de referidos (capa visual)
   --------------------------------------------------------------------------
   Solo presentación: no habla con el backend. La lógica vive en
   assets/js/referidos.js (window.Referidos), que no se toca desde aquí.

     RefUI.morph(el, cambio)   anima la altura de `el` mientras `cambio()`
                               cambia su contenido (formulario → resultado).
     RefUI.reducido()          true si la persona pidió menos movimiento.
   ========================================================================== */
(function () {
  "use strict";

  const reducido = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Mide la altura antes y después del cambio y anima entre ambas.
  // Si llega otro cambio a mitad, parte de la altura visible (interrumpible).
  function morph(el, cambio) {
    if (!el) { cambio(); return; }
    const antes = el.getBoundingClientRect().height;
    if (el._morph) el._morph.cancel();
    cambio();
    const despues = el.getBoundingClientRect().height;
    if (reducido() || Math.abs(antes - despues) < 2 || !el.animate) return;
    el.style.overflow = "hidden";
    el._morph = el.animate(
      [{ height: antes + "px" }, { height: despues + "px" }],
      { duration: 420, easing: "cubic-bezier(.23, 1, .32, 1)" }
    );
    el._morph.onfinish = el._morph.oncancel = () => { el.style.overflow = ""; el._morph = null; };
  }

  /* --- Logotipo: usa logo-westhill.png si existe, si no el sello --------- */
  function initLogo() {
    document.querySelectorAll("[data-logo]").forEach((img) => {
      const marca = img.closest(".rf-brand");
      const real = new Image();
      real.onload = () => { img.src = real.src; if (marca) marca.classList.add("has-logo"); };
      real.src = "assets/img/logo-westhill.png";
    });
  }

  /* --- referidos.html: invitación y estado "enviado" --------------------- */
  function initFormularioInvitado() {
    const form = document.querySelector("form[data-referidos-form]");
    if (!form) return;
    const card = form.closest(".rf-card");
    const exito = form.querySelector(".form-success");
    const aviso = document.querySelector("[data-referidor]");
    const inicial = document.querySelector("[data-referidor-inicial]");
    const nombreOk = document.querySelector("[data-nombre-registro]");

    // Inicial del avatar cuando referidos.js muestra "Ana te invitó"
    if (aviso && inicial) {
      new MutationObserver(() => {
        const n = (aviso.querySelector("[data-referidor-nombre]") || {}).textContent || "";
        const letra = n.trim().charAt(0).toUpperCase();
        if (inicial.textContent !== letra) inicial.textContent = letra; // evita re-disparar el observer
      }).observe(aviso, { attributes: true, attributeFilter: ["hidden"] });
    }

    // Guarda el nombre antes de que referidos.js limpie el formulario
    let nombre = "";
    form.addEventListener("submit", () => {
      const campo = form.querySelector("[name=nombre]");
      nombre = campo ? campo.value.trim().split(/\s+/)[0] : "";
    }, true);

    if (exito) {
      new MutationObserver(() => {
        if (exito.hidden || form.classList.contains("is-sent")) return;
        morph(card, () => {
          if (nombreOk) nombreOk.textContent = nombre ? ", " + nombre : "";
          form.classList.add("is-sent");
        });
      }).observe(exito, { attributes: true, attributeFilter: ["hidden"] });
    }
  }

  document.addEventListener("DOMContentLoaded", () => {
    initLogo();
    initFormularioInvitado();
  });

  window.RefUI = { morph, reducido };
})();
