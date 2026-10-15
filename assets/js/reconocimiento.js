/* ==========================================================================
   Universidad Westhill — Reconocimiento del estudiante (reconocimiento.html)
   --------------------------------------------------------------------------
   1. Pide el reconocimiento con el código del link (?c=ABCD2345) y dibuja
      la imagen (RecTarjeta.diploma) mientras el sobre cae.
   2. El sobre llega amarrado con un listón dorado. El moño se jala hacia
      abajo 1:1 con el dedo; al soltar se proyecta el impulso: si iba con
      fuerza se desata, si no, regresa con un rebote. Tocarlo también abre.
   3. El listón se suelta hacia los cuatro lados, la solapa se abre, la carta
      sube y se convierte en el reconocimiento (FLIP con un resorte).
   4. Confeti, "¡Felicidades, Nombre!" letra por letra, Descargar/Compartir
      y al final el cuadro de redes.
   Con "reducir movimiento": solo fundidos.
   ========================================================================== */
(function () {
  "use strict";

  const $ = (s) => document.querySelector(s);
  const { Spring, reducido, proyectar, goma } = RefUI;

  const escena = $("[data-rc-escena]");
  const wrap = escena.querySelector(".rc-env-wrap");
  const env = escena.querySelector(".rc-env");
  const flap = env.querySelector(".rc-env-flap");
  const carta = env.querySelector(".rc-env-letter");
  const mono = env.querySelector(".rc-mono");
  const liston = env.querySelector(".rc-liston");
  const tramos = {
    arriba: liston.querySelector(".arriba"), abajo: liston.querySelector(".abajo"),
    izq: liston.querySelector(".izq"), der: liston.querySelector(".der"),
  };
  const [lazoIzq, lazoDer, pliegueIzq, pliegueDer] = mono.querySelectorAll(".lazos path");
  const [puntaIzq, puntaDer] = mono.querySelectorAll(".puntas path");
  const nudo = mono.querySelector(".nudo");
  const resultado = $("[data-rc-resultado]");
  const figura = $("[data-rc-diploma]");
  const imagen = $("[data-rc-imagen]");

  let datos = null, archivo = null;
  let fase = "cerrado";               // cerrado → desatando → abriendo → listo

  // El sobre ya cayó: quitar la animación de entrada para poder moverlo
  env.addEventListener("animationend", () => env.removeAttribute("data-in"), { once: true });

  /* --- 1. Datos e imagen ---------------------------------------------------- */
  const primerNombre = (n) => String(n || "").trim().split(/\s+/)[0] || "";

  async function cargar() {
    const codigo = Reconocimientos.codigoDesdeURL();
    if (!codigo) throw new Error("Este link no trae el código del reconocimiento.");
    const r = await Reconocimientos.obtener(codigo);
    if (!r.ok) throw new Error(r.error || "No encontramos este reconocimiento.");
    datos = r.reconocimiento;
    pintarSobre();
    const cv = await RecTarjeta.diploma(datos);
    archivo = await RecTarjeta.archivo(cv, "reconocimiento-westhill-" + slug(datos.nombre) + ".png");
    imagen.src = URL.createObjectURL(archivo);
    imagen.alt = textoAlterno(datos);
    await imagen.decode().catch(() => {});
  }
  const listo = cargar();
  listo.catch(mostrarError);

  function pintarSobre() {
    const nombre = primerNombre(datos.nombre);
    const firma = $("[data-rc-firma]");
    firma.textContent = nombre;
    const pill = $("[data-rc-para]");
    $("[data-rc-primer-nombre]").textContent = nombre;
    $("[data-rc-inicial]").textContent = nombre.charAt(0).toUpperCase();
    pill.hidden = false;
    if (!reducido() && pill.animate) {
      pill.animate(
        [{ opacity: 0, transform: "translateY(-6px) scale(.96)", filter: "blur(6px)" }, { opacity: 1, transform: "none", filter: "none" }],
        { duration: 520, easing: "cubic-bezier(.23, 1, .32, 1)" }
      );
    }
    document.title = "Tu reconocimiento, " + nombre + " | Universidad Westhill";
    // Estampilla: el logo de la prepa (si Admisiones lo subió)
    if (datos.logo) {
      const sello = $("[data-rc-sello]");
      const stamp = sello.closest(".rc-env-stamp");
      sello.src = datos.logo;
      stamp.classList.remove("is-westhill");
      stamp.classList.add("is-new");
    }
  }

  function textoAlterno(d) {
    return `Reconocimiento de la Universidad Westhill a ${d.nombre} por su participación en ${d.motivo || "su visita a la Universidad Westhill"}` +
      (d.prepa ? `, ${d.prepa}` : "") + `. ${d.mensaje || ""} ${Reconocimientos.fechaLarga(d.fechaVisita)}. Firma: ${d.firma || "Equipo de Admisiones"}.`;
  }

  function slug(s) {
    return String(s || "westhill").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40) || "westhill";
  }

  function mostrarError(err) {
    console.error("[Reconocimiento]", err);
    if (fase === "listo") return;
    escena.hidden = true;
    $("[data-rc-hero]").classList.add("is-error");
    const caja = $("[data-rc-error]");
    const sinRed = err instanceof TypeError;              // fetch sin conexión
    $("[data-rc-error-texto]").textContent = sinRed
      ? "Parece que no hay conexión. Revisa tu internet e intenta de nuevo."
      : "Revisa que el link esté completo o pídelo de nuevo a Admisiones.";
    caja.hidden = false;
    caja.classList.add("rf-materialize");
  }
  $("[data-rc-reintentar]").addEventListener("click", () => location.reload());

  /* --- 2. Jalar el moño ------------------------------------------------------ */
  const LIMITE = 96;                                       // px de jalón para desatar
  const u = () => 240 / (mono.clientWidth || 240);         // px de pantalla → unidades del SVG

  // Pinta el moño según cuánto se ha jalado (y en px; negativo = hacia arriba)
  function pintarJalon(y) {
    const k = u(), p = Math.max(0, y) / LIMITE;
    const bajaNudo = y * k * 0.32;
    const estira = 1 + Math.max(0, y * k - bajaNudo) / 110;    // las puntas miden ~110 unidades
    const lazos = `translate(0 ${bajaNudo * 0.9}) scale(${1 - 0.26 * p} ${1 - 0.14 * p})`;
    [lazoIzq, lazoDer, pliegueIzq, pliegueDer].forEach((el) => el.setAttribute("transform", lazos));
    const puntas = `translate(0 ${bajaNudo}) scale(${1 - 0.12 * p} ${estira})`;
    [puntaIzq, puntaDer].forEach((el) => el.setAttribute("transform", puntas));
    nudo.setAttribute("transform", `translate(0 ${bajaNudo}) scale(${1 - 0.12 * p})`);
    // El listón se tensa hacia el nudo y el sobre cede un poco
    tramos.abajo.style.transform = `scaleY(${1 - 0.05 * p})`;
    tramos.abajo.style.transformOrigin = "bottom";
    env.style.transform = y ? `translateY(${y * 0.05}px) rotateX(${-y * 0.02}deg)` : "";
  }

  // Rebote al soltar sin fuerza: el gesto trae impulso
  const jalon = new Spring(0, { damping: 0.55, response: 0.42, onUpdate: pintarJalon });

  let arrastre = null, arrastrado = false;
  mono.addEventListener("pointerdown", (e) => {
    if (fase !== "cerrado" || arrastre) return;           // ignora un segundo dedo
    mono.setPointerCapture(e.pointerId);
    arrastre = { y0: e.clientY - jalon.value, hist: [{ y: e.clientY, t: e.timeStamp }] };
    arrastrado = false;
  });
  mono.addEventListener("pointermove", (e) => {
    if (!arrastre) return;
    let y = e.clientY - arrastre.y0;
    if (Math.abs(y) > 6) arrastrado = true;
    if (y < 0) y = goma(y, 40);                            // hacia arriba casi no cede
    const tope = LIMITE * 1.5;
    if (y > tope) y = tope + goma(y - tope, 90);           // más allá, resistencia progresiva
    jalon.set(y);
    arrastre.hist.push({ y: e.clientY, t: e.timeStamp });
    if (arrastre.hist.length > 5) arrastre.hist.shift();
  });
  const soltar = () => {
    if (!arrastre) return;
    const h = arrastre.hist, a = h[0], b = h[h.length - 1];
    const vel = (b.y - a.y) / Math.max((b.t - a.t) / 1000, 0.016);   // px/s hacia abajo
    arrastre = null;
    if (!arrastrado) return;                                 // fue un toque: lo maneja "click"
    const destino = jalon.value + proyectar(vel);            // a dónde iba el gesto
    if (destino > LIMITE || jalon.value > LIMITE * 0.85) desatar(vel);
    else jalon.to(0, vel);
  };
  mono.addEventListener("pointerup", soltar);
  mono.addEventListener("pointercancel", soltar);
  mono.addEventListener("click", () => { if (!arrastrado) desatar(0); arrastrado = false; });
  $("[data-abrir]").addEventListener("click", () => desatar(0));

  /* --- 3. Se suelta el listón y se abre el sobre ---------------------------- */
  function desatar(vel) {
    if (fase !== "cerrado") return;
    fase = "desatando";
    env.classList.add("is-open");
    escena.classList.add("is-open");
    if (navigator.vibrate) try { navigator.vibrate(12); } catch (e) { /* sin vibración */ }
    centrar();
    if (reducido()) {
      liston.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 200, fill: "forwards" });
      mono.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 200, fill: "forwards" }).onfinish = abrir;
      return;
    }
    const y0 = jalon.value;
    jalon._stop && jalon._stop();
    let abierto = false;
    const suelta = new Spring(0, {
      damping: 1, response: 0.5,
      onUpdate: (p) => {
        const q = Math.min(Math.max(p, 0), 1);
        pintarJalon(y0 * (1 - q));
        // Los lazos salen volando a los lados y caen; las puntas se desploman
        const caida = 70 * q * q;
        lazoIzq.setAttribute("transform", `translate(${-70 * q} ${-14 * q + caida}) rotate(${-38 * q})`);
        pliegueIzq.setAttribute("transform", lazoIzq.getAttribute("transform"));
        lazoDer.setAttribute("transform", `translate(${70 * q} ${-14 * q + caida}) rotate(${38 * q})`);
        pliegueDer.setAttribute("transform", lazoDer.getAttribute("transform"));
        puntaIzq.setAttribute("transform", `translate(${-18 * q} ${130 * q * q}) rotate(${22 * q})`);
        puntaDer.setAttribute("transform", `translate(${18 * q} ${130 * q * q}) rotate(${-22 * q})`);
        nudo.setAttribute("transform", `scale(${1 - q})`);
        mono.style.opacity = String(1 - Math.max(0, q - 0.35) / 0.65);
        // Cada tramo del listón se retira hacia su lado
        const d = 30 * q, o = String(1 - q);
        tramos.arriba.style.transform = `translateY(${-d}%)`;
        tramos.abajo.style.transform = `translateY(${d}%)`;
        tramos.izq.style.transform = `translateX(${-d}%)`;
        tramos.der.style.transform = `translateX(${d}%)`;
        Object.values(tramos).forEach((t) => { t.style.opacity = o; });
        if (q > 0.4 && !abierto) { abierto = true; abrir(); }
      },
      onRest: () => { mono.hidden = true; liston.hidden = true; },
    });
    suelta.to(1, Math.max(0, vel) / 400);
  }

  // Lleva el sobre al centro de la pantalla para que la carta tenga lugar al salir
  function centrar() {
    const r = env.getBoundingClientRect();
    const libre = window.innerHeight - r.height;
    if (r.top > libre * 0.35 && r.bottom < window.innerHeight - 20) return;    // ya está bien
    window.scrollTo({ top: Math.max(0, window.scrollY + r.top - libre * 0.6), behavior: reducido() ? "auto" : "smooth" });
  }

  let subiendo = false;
  const alto = () => env.getBoundingClientRect().height;
  const solapa = new Spring(0, {
    damping: 0.8, response: 0.45,
    onUpdate: (a) => {
      flap.style.transform = `rotateX(${a}deg)`;
      flap.classList.toggle("is-behind", a > 90);
      if (fase === "abriendo" && a > 115 && !subiendo) { subiendo = true; sube.to(alto() * 0.62); }
    },
  });
  const sube = new Spring(0, {
    damping: 0.86, response: 0.5,
    onUpdate: (y) => { carta.style.transform = `translateY(${-y}px)`; },
    onRest: () => { if (fase === "abriendo") desplegar(); },
  });

  function abrir() {
    fase = "abriendo";
    if (reducido()) { desplegar(); return; }
    solapa.to(180);
  }

  /* --- 4. La carta se convierte en el reconocimiento ------------------------ */
  const progreso = new Spring(0, { damping: 1, response: 0.6 });

  async function desplegar() {
    try { await listo; } catch (e) { return; }               // el error ya se mostró
    fase = "listo";
    resultado.hidden = false;
    if (reducido()) {
      wrap.style.visibility = "hidden";
      terminar();
      return;
    }
    // FLIP: la figura nace del rectángulo de la carta
    const r = figura.getBoundingClientRect(), c = carta.getBoundingClientRect();
    const dx = c.left - r.left, dy = c.top - r.top;
    const sx = c.width / r.width, sy = c.height / r.height;
    figura.classList.add("is-morphing");
    progreso.onUpdate = (p) => {
      const k = Math.max(0, Math.min(1, p));
      figura.style.transform = `translate(${dx * (1 - k)}px, ${dy * (1 - k)}px) scale(${sx + (1 - sx) * p}, ${sy + (1 - sy) * p})`;
    };
    progreso.onRest = () => {
      progreso.onRest = null;
      figura.style.transform = "";
      figura.classList.remove("is-morphing");
      terminar();
    };
    progreso.set(0);
    progreso.onUpdate(0);
    requestAnimationFrame(() => { wrap.style.visibility = "hidden"; });   // la carta "es" la figura
    progreso.to(1);
  }

  function terminar() {
    const nombre = primerNombre(datos.nombre);
    $("[data-rc-nombre-titulo]").textContent = nombre ? ", " + nombre : "";
    $("[data-rc-nombre-redes]").textContent = nombre ? ", " + nombre : "";
    const lead = $("[data-rc-hero] .rf-lead");
    lead.textContent = nombre ? `Gracias por visitarnos, ${nombre}.` : "Gracias por visitarnos.";
    const titulo = $("[data-rc-felicidades]");
    if (!reducido()) RefUI.partirLetras(titulo, nombre);
    figura.classList.add("is-shown");
    resultado.classList.add("is-done");
    titulo.focus({ preventScroll: true });
    // Que el título quede a la vista sin brincos
    const top = resultado.getBoundingClientRect().top;
    if (top < 70 || top > window.innerHeight * 0.5) {
      window.scrollTo({ top: window.scrollY + top - 96, behavior: reducido() ? "auto" : "smooth" });
    }
    if (!reducido()) {
      RefUI.confeti(figura);
      RefUI.initTilt(imagen);
    }
    if (puedeCompartir()) $("[data-rc-compartir]").hidden = false;
    else $("[data-rc-acciones]").classList.add("is-single");
    // Redes: solo cuando ya se vio el reconocimiento
    setTimeout(() => {
      const redes = $("[data-rc-redes]");
      redes.hidden = false;
      redes.classList.add("is-in");
    }, reducido() ? 600 : 2400);
  }

  /* --- Descargar y compartir ------------------------------------------------- */
  const esCelular = () => matchMedia("(pointer: coarse)").matches && !matchMedia("(any-pointer: fine)").matches;
  function puedeCompartir() {
    if (!esCelular() || !archivo) return false;
    try { return !!(navigator.canShare && navigator.canShare({ files: [archivo] })); } catch (e) { return false; }
  }

  const descargar = $("[data-rc-descargar]");
  let tDescarga;
  descargar.addEventListener("click", () => {
    if (!archivo) return;
    if (!descargar._html) descargar._html = descargar.innerHTML;
    descargar.classList.add("is-done");
    descargar.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg> Descargado';
    clearTimeout(tDescarga);
    tDescarga = setTimeout(() => { descargar.classList.remove("is-done"); descargar.innerHTML = descargar._html; }, 1800);
    const url = URL.createObjectURL(archivo);
    const a = document.createElement("a");
    a.href = url;
    a.download = archivo.name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 4000);
  });

  $("[data-rc-compartir]").addEventListener("click", () => {
    if (!archivo) return;
    navigator.share({
      files: [archivo],
      title: "Mi reconocimiento Westhill",
      text: "Mi reconocimiento de la Universidad Westhill @univwesthill",
    }).catch(() => {});
  });
})();
