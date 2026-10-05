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
    if (!el || el._tilt || reducido()) return;   // inclinar es movimiento puro: fuera con reduced-motion
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
      if (activo) return;                        // ignora un segundo dedo
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
  // Técnica de Emil Kowalski para pestañas: una copia "activa" de la fila
  // encima de la original, recortada con clip-path a la píldora elegida.
  // Solo anima clip-path (sin layout) y el color del texto cambia exacto.
  // Es una transición CSS: si se toca otra píldora a medio camino, se
  // redirige desde donde va (interrumpible).
  function initPills(cont) {
    const capa = document.createElement("div");
    capa.className = "rf-pills-active";
    capa.setAttribute("aria-hidden", "true");
    cont.querySelectorAll(".rf-pill span").forEach((s) => {
      const c = document.createElement("span");
      c.textContent = s.textContent;
      capa.appendChild(c);
    });
    cont.appendChild(capa);

    const mover = (animar) => {
      const marcado = cont.querySelector("input:checked");
      cont.classList.toggle("has-value", !!marcado);
      if (!marcado) return;
      const pill = marcado.parentElement; // el <label>: su offsetParent es la fila
      const W = cont.clientWidth, H = cont.clientHeight;
      const t = pill.offsetTop, l = pill.offsetLeft;
      const r = W - (l + pill.offsetWidth), b = H - (t + pill.offsetHeight);
      capa.style.transition = animar && cont.classList.contains("was-set") ? "" : "none";
      capa.style.clipPath = `inset(${t}px ${r}px ${b}px ${l}px round 999px)`;
      if (capa.style.transition === "none") { void capa.offsetWidth; capa.style.transition = ""; }
      cont.classList.add("was-set");
    };
    cont.addEventListener("change", () => mover(true));
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
  /* --- Proyección de impulso (función de Apple, como el scroll) ---------- */
  const proyectar = (v, d = 0.99) => (v / 1000) * d / (1 - d);
  // Resistencia progresiva al pasar un límite
  const goma = (exceso, dim, c = 0.55) => (exceso * dim * c) / (dim + c * Math.abs(exceso));

  /* --- referidos.html: el sobre ------------------------------------------- */
  function initSobre() {
    const escena = document.querySelector("[data-escena]");
    if (!escena) return;
    const wrap = escena.querySelector(".rf-env-wrap");
    const env = escena.querySelector(".rf-env");
    const flap = env.querySelector(".env-flap");
    const carta = env.querySelector(".env-letter");
    const sello = env.querySelector(".env-seal");
    const botonAbrir = escena.querySelector("[data-abrir]");
    const hoja = escena.querySelector(".rf-letter");
    const listo = escena.querySelector(".rf-done");
    const form = hoja.querySelector("form[data-referidos-form]");
    const exito = form.querySelector(".form-success");
    const nombreOk = escena.querySelector("[data-nombre-registro]");
    const LIBRE = 180; // grados con la solapa totalmente abierta

    // El sobre ya cayó: quitar la animación de entrada para poder moverlo
    env.addEventListener("animationend", () => env.removeAttribute("data-in"), { once: true });

    let fase = "cerrado";           // cerrado → abriendo → carta → enviando → enviado
    const alto = () => env.getBoundingClientRect().height;

    const solapa = new Spring(0, {
      damping: 0.8, response: 0.45,
      onUpdate: (a) => {
        flap.style.transform = `rotateX(${a}deg)`;
        flap.classList.toggle("is-behind", a > 90);
        if (fase === "abriendo" && a > 130 && !subiendo) { subiendo = true; sube.to(alto() * 0.62); }
      },
      onRest: () => { if (fase === "enviando" && solapa.target === 0) sellar(); },
    });
    let subiendo = false;
    const sube = new Spring(0, {
      damping: 0.86, response: 0.5,
      onUpdate: (y) => {
        carta.style.transform = `translateY(${-y}px)`;
        if (fase === "enviando" && y < alto() * 0.12 && solapa.target !== 0) solapa.to(0);
      },
      onRest: () => { if (fase === "abriendo" && sube.target > 0) desplegar(); },
    });

    // --- Gesto: deslizar el sello hacia arriba abre la solapa (1:1) ---------
    let arrastre = null, arrastrado = false;
    sello.addEventListener("pointerdown", (e) => {
      if (fase !== "cerrado" || arrastre) return;  // ignora un segundo dedo
      sello.setPointerCapture(e.pointerId);
      arrastre = { y0: e.clientY, a0: solapa.value, hist: [{ y: e.clientY, t: e.timeStamp }] };
      arrastrado = false;
    });
    sello.addEventListener("pointermove", (e) => {
      if (!arrastre) return;
      const dy = arrastre.y0 - e.clientY;                 // hacia arriba = positivo
      if (Math.abs(dy) > 6) arrastrado = true;
      let a = arrastre.a0 + (dy / (alto() * 0.7)) * LIBRE;
      if (a > LIBRE) a = LIBRE + goma(a - LIBRE, 60);
      if (a < 0) a = goma(a, 30);
      solapa.set(a);
      arrastre.hist.push({ y: e.clientY, t: e.timeStamp });
      if (arrastre.hist.length > 5) arrastre.hist.shift();
    });
    const soltar = () => {
      if (!arrastre) return;
      const h = arrastre.hist, p = h[0], q = h[h.length - 1];
      const dt = Math.max((q.t - p.t) / 1000, 0.016);
      const vel = (((p.y - q.y) / dt) / (alto() * 0.7)) * LIBRE;   // grados/s
      arrastre = null;
      if (!arrastrado) return;                           // fue un toque: lo maneja "click"
      const destino = solapa.value + proyectar(vel);     // a dónde iba el gesto
      if (destino > 90) abrir(vel); else solapa.to(0, vel);
    };
    sello.addEventListener("pointerup", soltar);
    sello.addEventListener("pointercancel", soltar);
    sello.addEventListener("click", () => { if (!arrastrado) abrir(); arrastrado = false; });
    if (botonAbrir) botonAbrir.addEventListener("click", () => abrir());

    function abrir(vel) {
      if (fase !== "cerrado") return;
      fase = "abriendo";
      env.classList.add("is-open");
      escena.classList.add("is-open");
      if (reducido()) { desplegar(); return; }
      subiendo = false;
      solapa.to(LIBRE, vel);
    }

    // FLIP con un resorte de progreso: la hoja nace del rectángulo de la carta
    const progreso = new Spring(0, { damping: 1, response: 0.55 });
    function flip(desde, hasta, alTerminar) {
      const r = hoja.getBoundingClientRect();
      const a = desde, b = hasta;
      const dx = carta.getBoundingClientRect().left - r.left;
      const dy = carta.getBoundingClientRect().top - r.top;
      const sx = carta.offsetWidth / r.width, sy = carta.offsetHeight / r.height;
      progreso.set(a);
      progreso.onUpdate = (p) => {
        const k = Math.max(0, Math.min(1, p));
        hoja.style.transform = `translate(${dx * (1 - k)}px, ${dy * (1 - k)}px) scale(${sx + (1 - sx) * p}, ${sy + (1 - sy) * p})`;
      };
      progreso.onRest = () => { progreso.onRest = null; alTerminar(); };
      progreso.onUpdate(a);
      progreso.to(b);
    }

    function desplegar() {
      fase = "carta";
      hoja.removeAttribute("data-stowed");
      if (reducido()) {
        wrap.style.visibility = "hidden";
        hoja.classList.add("rf-materialize");
        return;
      }
      hoja.classList.add("is-morphing");
      flip(0, 1, () => {
        hoja.style.transform = "";
        hoja.classList.remove("is-morphing");
        hoja.classList.add("rf-materialize");
        const primero = hoja.querySelector("input:not([type=hidden])");
        if (primero && matchMedia("(pointer: fine)").matches) primero.focus({ preventScroll: true });
      });
      // La carta "es" la hoja: el sobre se esconde mientras la hoja crece
      requestAnimationFrame(() => { wrap.style.visibility = "hidden"; });
    }

    // --- Envío: la hoja vuelve al sobre, se sella y vuela ------------------
    let nombre = "";
    form.addEventListener("submit", () => {
      const campo = form.querySelector("[name=nombre]");
      nombre = campo ? campo.value.trim().split(/\s+/)[0] : "";
    }, true);

    new MutationObserver(() => {
      if (exito.hidden || fase !== "carta") return;
      if (nombreOk) nombreOk.textContent = nombre ? ", " + nombre : "";
      fase = "enviando";
      if (reducido()) { terminar(); return; }
      hoja.scrollIntoView({ behavior: "smooth", block: "center" });
      hoja.classList.remove("rf-materialize");
      hoja.classList.add("is-morphing");
      wrap.style.visibility = "";
      carta.style.visibility = "hidden";
      flip(1, 0, () => {
        hoja.setAttribute("data-stowed", "");
        hoja.style.transform = "";
        carta.style.visibility = "";
        sube.to(0);                    // la carta entra en la bolsa; luego cierra la solapa
      });
    }).observe(exito, { attributes: true, attributeFilter: ["hidden"] });

    function sellar() {
      // El sello "cae" sobre la solapa: rebote porque llega con impulso
      const s = sello.animate(
        [{ transform: "scale(1.6)", opacity: 0 }, { transform: "scale(.92)", opacity: 1, offset: .6 }, { transform: "scale(1)", opacity: 1 }],
        { duration: 420, easing: "cubic-bezier(.3, 1.3, .5, 1)" }
      );
      s.onfinish = volar;
    }

    function volar() {
      const r = env.getBoundingClientRect();
      const lejos = r.bottom + 80;
      const vuelo = new Spring(0, {
        damping: 1, response: 0.7,
        onUpdate: (p) => {
          env.style.transform = `translateY(${-lejos * p}px) rotate(${-8 * p}deg) scale(${1 - 0.25 * p})`;
          env.style.opacity = String(Math.max(0, 1 - Math.max(0, p - 0.55) / 0.45));
        },
        onRest: terminar,
      });
      // Pequeño "agarre" hacia abajo antes de salir (anticipa la dirección)
      vuelo.set(-0.04);
      vuelo.to(1, 0.4);
    }

    function terminar() {
      fase = "enviado";
      wrap.style.visibility = "hidden";
      hoja.setAttribute("data-stowed", "");
      listo.hidden = false;
      listo.classList.add("rf-materialize");
      listo.focus({ preventScroll: true });
    }

    // Firma del sobre con el nombre de quien invita
    const aviso = document.querySelector("[data-referidor]");
    const firma = escena.querySelector("[data-firma]");
    const inicial = document.querySelector("[data-referidor-inicial]");
    if (aviso) {
      new MutationObserver(() => {
        if (aviso.hidden) return;
        const n = (aviso.querySelector("[data-referidor-nombre]") || {}).textContent || "";
        if (inicial) inicial.textContent = n.trim().charAt(0).toUpperCase();
        if (firma && n) firma.textContent = n;
        if (!reducido() && aviso.animate) {
          aviso.animate(
            [{ opacity: 0, transform: "translateY(-6px) scale(.96)", filter: "blur(6px)" }, { opacity: 1, transform: "none", filter: "none" }],
            { duration: 520, easing: "cubic-bezier(.23, 1, .32, 1)" }
          );
        }
      }).observe(aviso, { attributes: true, attributeFilter: ["hidden"] });
    }
  }

  /* --- saca-tu-link.html: rodillos del código ----------------------------- */
  const LETRAS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  function rodillos(cont, codigo) {
    const reels = cont.querySelectorAll(".rf-reel");
    reels.forEach((reel, i) => {
      const tira = reel.querySelector(".rf-reel-strip");
      const h = reel.clientHeight;
      if (tira._s) tira._s._stop();
      if (!codigo) {                        // vuelve a los puntos
        tira.innerHTML = '<span class="dot">·</span>';
        tira.style.transform = "";
        return;
      }
      const vueltas = 8 + i * 2;
      const simbolos = Array.from({ length: vueltas }, () => LETRAS[Math.floor(Math.random() * LETRAS.length)]);
      simbolos.push(codigo[i] || "");
      tira.replaceChildren(...simbolos.map((c) => { const s = document.createElement("span"); s.textContent = c; return s; }));
      const fin = -(simbolos.length - 1) * h;
      if (reducido()) { tira.style.transform = `translateY(${fin}px)`; return; }
      // Rebote leve al frenar: el rodillo trae impulso
      tira._s = new Spring(0, { damping: 0.74, response: 0.55 + i * 0.06, onUpdate: (y) => { tira.style.transform = `translateY(${y}px)`; } });
      setTimeout(() => tira._s.to(fin, -2400), i * 90);
    });
  }

  document.addEventListener("DOMContentLoaded", () => {
    initLogo();
    initNav();
    document.querySelectorAll("[data-pills]").forEach(initPills);
    initSobre();
  });

  window.RefUI = { Spring, morph, initTilt, rodillos, reducido };
})();
