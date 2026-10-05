/* ==========================================================================
   Universidad Westhill — Programa de referidos (capa visual)
   --------------------------------------------------------------------------
   Solo presentación: no habla con el backend. La lógica vive en
   assets/js/referidos.js (window.Referidos), que no se toca desde aquí.

   Movimiento con resortes (modelo de Apple: amortiguamiento + respuesta).
   Un resorte no tiene duración fija y siempre parte de su valor y velocidad
   actuales, así que cualquier animación se puede interrumpir o redirigir.

     RefUI.Spring              resorte 1D (value, velocity, set, to)
     RefUI.morph(el, cambio)   anima la altura de `el` mientras cambia
     RefUI.initTilt(el)        inclinación 3D que sigue al puntero
     RefUI.reducido()          true si la persona pidió menos movimiento
   ========================================================================== */
(function () {
  "use strict";

  const reducido = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* --- Resorte ------------------------------------------------------------ */
  // damping 1 = sin rebote; < 1 rebota. response = segundos aprox. a llegar.
  class Spring {
    constructor(value, { damping = 1, response = 0.4, onUpdate, onRest } = {}) {
      this.value = value;
      this.target = value;
      this.velocity = 0;
      this.onUpdate = onUpdate;
      this.onRest = onRest;
      this.configure(damping, response);
      this._raf = 0;
    }
    configure(damping, response) {
      this.k = Math.pow((2 * Math.PI) / response, 2);  // rigidez (masa = 1)
      this.c = (4 * Math.PI * damping) / response;     // amortiguamiento
    }
    set(v) {                       // salto directo, sin animar (seguir al dedo)
      this.value = this.target = v;
      this.velocity = 0;
      this._stop();
      this.onUpdate && this.onUpdate(v);
    }
    to(target, velocity) {         // redirige desde el valor y velocidad actuales
      this.target = target;
      if (typeof velocity === "number") this.velocity = velocity;
      if (reducido()) { this.set(target); this.onRest && this.onRest(); return; }
      if (!this._raf) { this._last = performance.now(); this._raf = requestAnimationFrame((t) => this._tick(t)); }
    }
    _tick(now) {
      let dt = Math.min((now - this._last) / 1000, 1 / 30);
      this._last = now;
      // Pasos pequeños para que el resorte sea estable a cualquier fps
      const steps = Math.ceil(dt / (1 / 240));
      const h = dt / steps;
      for (let i = 0; i < steps; i++) {
        const fuerza = -this.k * (this.value - this.target) - this.c * this.velocity;
        this.velocity += fuerza * h;
        this.value += this.velocity * h;
      }
      const quieto = Math.abs(this.velocity) < 0.01 && Math.abs(this.value - this.target) < 0.01;
      if (quieto) this.value = this.target;
      this.onUpdate && this.onUpdate(this.value);
      if (quieto) { this._raf = 0; this.onRest && this.onRest(); return; }
      this._raf = requestAnimationFrame((t) => this._tick(t));
    }
    _stop() { cancelAnimationFrame(this._raf); this._raf = 0; }
  }

  /* --- Cambio de altura interrumpible ------------------------------------- */
  function morph(el, cambio) {
    if (!el) { cambio(); return; }
    const antes = el.getBoundingClientRect().height;
    if (!el._alto) {
      el._alto = new Spring(antes, {
        damping: 1, response: 0.42,
        onUpdate: (v) => { el.style.height = v + "px"; },
        onRest: () => { el.style.height = ""; el.style.overflow = ""; },
      });
    } else if (!el._alto._raf) {
      el._alto.set(antes);
    }
    // Si estaba animando, parte de la altura visible y conserva la velocidad
    el.style.height = "";
    cambio();
    const despues = el.getBoundingClientRect().height;
    el.style.overflow = "hidden";
    el.style.height = el._alto.value + "px";
    el._alto.to(despues);
  }

  /* --- Inclinación 3D del pase (manipulación directa) --------------------- */
  function initTilt(el) {
    if (!el || el._tilt) return;
    const MAX = 10; // grados
    const aplicar = () => {
      el.style.transform = `rotateX(${rx.value}deg) rotateY(${ry.value}deg) translateZ(0)`;
      el.style.setProperty("--gx", 50 + ry.value * 4 + "%");
      el.style.setProperty("--gy", 30 - rx.value * 5 + "%");
    };
    // Rebote suave al soltar: el gesto llevaba impulso
    const rx = new Spring(0, { damping: 0.7, response: 0.5, onUpdate: aplicar });
    const ry = new Spring(0, { damping: 0.7, response: 0.5, onUpdate: aplicar });
    el._tilt = { rx, ry };
    let activo = false;

    const seguir = (e) => {
      const r = el.getBoundingClientRect();
      const px = Math.max(-1, Math.min(1, ((e.clientX - r.left) / r.width) * 2 - 1));
      const py = Math.max(-1, Math.min(1, ((e.clientY - r.top) / r.height) * 2 - 1));
      // Con mouse se sigue con un resorte rápido; con el dedo, 1:1
      if (e.pointerType === "mouse" && !activo) { ry.to(px * MAX * 0.6); rx.to(-py * MAX * 0.6); }
      else { ry.set(px * MAX); rx.set(-py * MAX); }
    };
    el.addEventListener("pointerdown", (e) => {
      activo = true;
      el.setPointerCapture(e.pointerId);
      seguir(e);
    });
    el.addEventListener("pointermove", (e) => {
      if (activo || (e.pointerType === "mouse" && matchMedia("(hover: hover)").matches)) seguir(e);
    });
    const soltar = () => { activo = false; rx.to(0); ry.to(0); };
    el.addEventListener("pointerup", soltar);
    el.addEventListener("pointercancel", soltar);
    el.addEventListener("pointerleave", () => { if (!activo) soltar(); });
  }

  /* --- Píldoras con selección que se desliza ------------------------------ */
  function initPills(cont) {
    const thumb = document.createElement("span");
    thumb.className = "rf-thumb";
    thumb.setAttribute("aria-hidden", "true");
    cont.prepend(thumb);
    const pintar = () => { thumb.style.transform = `translate(${x.value}px, ${y.value}px)`; };
    const x = new Spring(0, { damping: 1, response: 0.36, onUpdate: pintar });
    const y = new Spring(0, { damping: 1, response: 0.36, onUpdate: pintar }); // X e Y por separado
    const w = new Spring(0, { damping: 1, response: 0.36, onUpdate: (v) => { thumb.style.width = v + "px"; } });

    const mover = (animar) => {
      const marcado = cont.querySelector("input:checked");
      cont.classList.toggle("has-value", !!marcado);
      if (!marcado) return;
      const pill = marcado.parentElement; // el <label>: su offsetParent es la fila
      const dx = pill.offsetLeft, dy = pill.offsetTop, dw = pill.offsetWidth;
      if (animar && cont.classList.contains("was-set")) { x.to(dx); y.to(dy); w.to(dw); }
      else { x.set(dx); y.set(dy); w.set(dw); }
      cont.classList.add("was-set");
    };
    cont.addEventListener("change", () => mover(true));
    // Si el formulario se limpia (reset), la píldora desaparece
    const form = cont.closest("form");
    if (form) form.addEventListener("reset", () => setTimeout(() => { cont.classList.remove("has-value", "was-set"); }, 0));
    window.addEventListener("resize", () => mover(false));
    mover(false);
  }

  /* --- Barra: borde solo cuando hay contenido debajo ----------------------- */
  function initNav() {
    const nav = document.querySelector(".rf-nav");
    if (!nav) return;
    const actualizar = () => nav.classList.toggle("is-scrolled", window.scrollY > 4);
    window.addEventListener("scroll", actualizar, { passive: true });
    actualizar();
  }

  /* --- Logotipo: usa logo-westhill.png si existe, si no el sello ---------- */
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
    const hoja = form.closest(".rf-sheet");
    const exito = form.querySelector(".form-success");
    const aviso = document.querySelector("[data-referidor]");
    const inicial = document.querySelector("[data-referidor-inicial]");
    const nombreOk = document.querySelector("[data-nombre-registro]");

    // Inicial del avatar cuando referidos.js muestra "Ana te invitó"
    if (aviso && inicial) {
      new MutationObserver(() => {
        const n = (aviso.querySelector("[data-referidor-nombre]") || {}).textContent || "";
        const letra = n.trim().charAt(0).toUpperCase();
        if (inicial.textContent !== letra) inicial.textContent = letra;
        if (!aviso.hidden && !aviso.classList.contains("rf-materialize-self")) {
          aviso.classList.add("rf-materialize-self");
          if (!reducido() && aviso.animate) {
            aviso.animate(
              [{ opacity: 0, transform: "translateY(-6px) scale(.96)", filter: "blur(6px)" }, { opacity: 1, transform: "none", filter: "none" }],
              { duration: 520, easing: "cubic-bezier(.23, 1, .32, 1)" }
            );
          }
        }
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
        morph(hoja, () => {
          if (nombreOk) nombreOk.textContent = nombre ? ", " + nombre : "";
          form.classList.add("is-sent");
          exito.classList.add("rf-materialize");
        });
        hoja.scrollIntoView({ behavior: reducido() ? "auto" : "smooth", block: "center" });
      }).observe(exito, { attributes: true, attributeFilter: ["hidden"] });
    }
  }

  document.addEventListener("DOMContentLoaded", () => {
    initLogo();
    initNav();
    document.querySelectorAll("[data-pills]").forEach(initPills);
    initFormularioInvitado();
  });

  window.RefUI = { Spring, morph, initTilt, reducido };
})();
