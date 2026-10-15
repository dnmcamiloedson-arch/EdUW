/* ==========================================================================
   Universidad Westhill — Reconocimiento del estudiante (reconocimiento.html)
   --------------------------------------------------------------------------
   1. Pide el reconocimiento con el código del link (?c=ABCD2345) y dibuja
      la imagen (RecTarjeta.diploma) mientras el sobre cae.
   2. El sobre llega amarrado con un listón dorado. Se jala hacia abajo
      (desde cualquier parte del sobre) 1:1 con el dedo; al soltar se proyecta
      el impulso: si iba con fuerza se desata, si no, regresa con un rebote.
      Tocarlo también abre. Si nadie lo toca, el moño enseña el gesto.
   3. El listón se suelta hacia los cuatro lados, la solapa se abre (forro
      dorado) y la carta sube.
   4. El sobre cae y la carta vuela hacia ti convertida en el reconocimiento:
      aura de luz, destellos, confeti y "¡Felicidades, Nombre!". Guardar
      (en el celular, menú del sistema), compartir, verlo en grande y redes.
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

  /* --- 2. Jalar el moño ------------------------------------------------------
     Se puede jalar desde cualquier parte del sobre (en el celular el dedo
     casi nunca cae justo en el moño). Al pasar el punto de no retorno el
     moño brilla, vibra y la instrucción cambia a "¡Suéltalo!". */
  const LIMITE = () => Math.max(64, Math.min(104, alto() * 0.24));   // px de jalón para desatar
  const u = () => 240 / (mono.clientWidth || 240);         // px de pantalla → unidades del SVG
  const vibrar = (p) => { if (navigator.vibrate) try { navigator.vibrate(p); } catch (e) { /* sin vibración */ } };

  // Pinta el moño según cuánto se ha jalado (y en px; negativo = hacia arriba)
  function pintarJalon(y) {
    const k = u(), p = Math.max(0, y) / LIMITE();
    const bajaNudo = y * k * 0.32;
    const estira = 1 + Math.max(0, y * k - bajaNudo) / 110;    // las puntas miden ~110 unidades
    const lazos = `translate(0 ${bajaNudo * 0.9}) scale(${1 - 0.26 * Math.min(p, 1.3)} ${1 - 0.14 * Math.min(p, 1.3)})`;
    [lazoIzq, lazoDer, pliegueIzq, pliegueDer].forEach((el) => el.setAttribute("transform", lazos));
    const puntas = `translate(0 ${bajaNudo}) scale(${1 - 0.12 * Math.min(p, 1.3)} ${estira})`;
    [puntaIzq, puntaDer].forEach((el) => el.setAttribute("transform", puntas));
    nudo.setAttribute("transform", `translate(0 ${bajaNudo}) scale(${1 - 0.12 * Math.min(p, 1.3)})`);
    // El listón se tensa hacia el nudo y el sobre cede un poco hacia el dedo
    tramos.abajo.style.transform = `scaleY(${1 - 0.05 * Math.min(p, 1.3)})`;
    env.style.transform = y ? `translateY(${y * 0.06}px) rotateX(${-y * 0.025}deg)` : "";
  }

  // Rebote al soltar sin fuerza: el gesto trae impulso
  const jalon = new Spring(0, { damping: 0.55, response: 0.42, onUpdate: pintarJalon });

  let arrastre = null, arrastrado = false, tocado = false, listoSoltar = false;
  function marcarListo(si) {
    if (si === listoSoltar) return;
    listoSoltar = si;
    escena.classList.toggle("is-listo", si);
    if (si) vibrar(8);
  }
  env.addEventListener("pointerdown", (e) => {
    if (fase !== "cerrado" || arrastre) return;           // ignora un segundo dedo
    tocado = true;
    env.setPointerCapture(e.pointerId);
    arrastre = { y0: e.clientY - jalon.value, hist: [{ y: e.clientY, t: e.timeStamp }] };
    arrastrado = false;
  });
  env.addEventListener("pointermove", (e) => {
    if (!arrastre) return;
    let y = e.clientY - arrastre.y0;
    if (Math.abs(y) > 6) arrastrado = true;
    if (y < 0) y = goma(y, 40);                            // hacia arriba casi no cede
    const tope = LIMITE() * 1.5;
    if (y > tope) y = tope + goma(y - tope, 90);           // más allá, resistencia progresiva
    jalon.set(y);
    marcarListo(y > LIMITE() * 0.85);
    arrastre.hist.push({ y: e.clientY, t: e.timeStamp });
    if (arrastre.hist.length > 5) arrastre.hist.shift();
  });
  const soltar = () => {
    if (!arrastre) return;
    const h = arrastre.hist, a = h[0], b = h[h.length - 1];
    const vel = (b.y - a.y) / Math.max((b.t - a.t) / 1000, 0.016);   // px/s hacia abajo
    arrastre = null;
    marcarListo(false);
    if (!arrastrado) return;                                 // fue un toque: lo maneja "click"
    const destino = jalon.value + proyectar(vel);            // a dónde iba el gesto
    if (destino > LIMITE() || jalon.value > LIMITE() * 0.85) desatar(vel);
    else jalon.to(0, vel);
  };
  env.addEventListener("pointerup", soltar);
  env.addEventListener("pointercancel", soltar);
  // Un toque (o Enter sobre el moño) también abre
  env.addEventListener("click", () => { if (!arrastrado) desatar(0); arrastrado = false; });
  $("[data-abrir]").addEventListener("click", () => desatar(0));

  // Si nadie lo toca, el moño se jala solito dos veces para enseñar el gesto
  function invitar(veces) {
    if (tocado || fase !== "cerrado" || reducido() || document.hidden) return;
    jalon.to(LIMITE() * 0.38, 0);
    setTimeout(() => { if (!arrastre && fase === "cerrado") jalon.to(0); }, 230);
    if (veces > 1) setTimeout(() => invitar(veces - 1), 1300);
  }
  setTimeout(() => invitar(2), 2600);

  /* --- 3. Se suelta el listón y se abre el sobre ---------------------------- */
  function desatar(vel) {
    if (fase !== "cerrado") return;
    fase = "desatando";
    tocado = true;
    env.classList.add("is-open");
    escena.classList.add("is-open");
    vibrar([12, 40, 18]);
    plegarHeroe();
    if (reducido()) {
      liston.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 200, fill: "forwards" });
      mono.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 200, fill: "forwards" }).onfinish = abrir;
      return;
    }
    destellos(mono, 14, 0.5);
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

  // El título se pliega hacia arriba: el sobre sube al centro del escenario y la
  // solapa tiene lugar para abrirse sin taparlo. Después, el sobre se centra.
  function plegarHeroe() {
    const h = $("[data-rc-hero]");
    if (reducido()) { h.hidden = true; centrar(); return; }
    h.style.height = h.offsetHeight + "px";
    void h.offsetHeight;
    h.classList.add("is-plegado");
    setTimeout(centrar, 470);
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
  const subida = () => parseFloat(getComputedStyle(env).getPropertyValue("--subida")) || 0.62;
  // La solapa se abre (al pasar los 90° se ve el forro dorado)
  const solapa = new Spring(0, {
    damping: 0.78, response: 0.5,
    onUpdate: (a) => {
      flap.style.transform = `rotateX(${a}deg)`;
      flap.classList.toggle("is-behind", a > 90);
      if (fase === "abriendo" && a > 110 && !subiendo) { subiendo = true; sube.to(alto() * subida()); }
    },
  });
  // La carta sale de la bolsa con un pequeño rebote
  const sube = new Spring(0, {
    damping: 0.72, response: 0.55,
    onUpdate: (y) => { carta.style.transform = `translateY(${-y}px)`; },
  });
  let tSube = 0;
  function abrir() {
    fase = "abriendo";
    if (reducido()) { desplegar(); return; }
    solapa.to(180);
    // Cuando la carta ya asomó, sigue la transformación (no espera a que el resorte se calme)
    clearTimeout(tSube);
    tSube = setTimeout(desplegar, 980);
  }

  /* --- 4. "Se abre por completo": la carta se convierte en el reconocimiento ---
     El sobre cae y se desvanece mientras la carta vuela hacia ti, se endereza
     y crece hasta ser el reconocimiento (FLIP con resorte, un poco de rebote).
     A mitad del vuelo el papel se funde con la imagen; al llegar: aura de luz
     con rayos, destellos dorados, confeti y el título letra por letra. */
  const progreso = new Spring(0, { damping: 0.8, response: 0.75 });
  const marco = $("[data-rc-marco]");

  async function desplegar() {
    if (fase !== "abriendo") return;
    fase = "desplegando";
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
    imagen.style.opacity = "0";
    carta.style.visibility = "hidden";                       // la carta "es" la figura
    progreso.onUpdate = (p) => {
      const k = Math.max(0, Math.min(1, p)), q = 1 - k;
      figura.style.transform =
        `translate(${dx * q}px, ${dy * q}px) perspective(900px) rotateX(${18 * q}deg) rotate(${-4 * q}deg) ` +
        `scale(${sx + (1 - sx) * p}, ${sy + (1 - sy) * p})`;
      imagen.style.opacity = String(Math.max(0, Math.min(1, (p - 0.35) / 0.4)));
    };
    progreso.onRest = () => {
      progreso.onRest = null;
      figura.style.transform = "";
      imagen.style.opacity = "";
    };
    progreso.set(0);
    progreso.onUpdate(0);
    progreso.to(1);
    // El sobre vacío cae y se va
    const h = alto();
    const cae = new Spring(0, {
      damping: 1, response: 0.65,
      onUpdate: (p) => {
        env.style.transform = `translateY(${p * h * 0.8}px) rotate(${p * 6}deg) scale(${1 - p * 0.14})`;
        env.style.opacity = String(Math.max(0, 1 - p * 1.3));
      },
      onRest: () => { wrap.style.visibility = "hidden"; },
    });
    cae.to(1);
    // La fiesta empieza cuando la figura casi llegó
    setTimeout(terminar, 520);
  }

  function terminar() {
    const nombre = primerNombre(datos.nombre);
    $("[data-rc-nombre-titulo]").textContent = nombre ? ", " + nombre : "";
    $("[data-rc-nombre-redes]").textContent = nombre ? ", " + nombre : "";
    const lead = $("[data-rc-hero] .rf-lead");
    lead.textContent = nombre ? `Gracias por visitarnos, ${nombre}.` : "Gracias por visitarnos.";
    const titulo = $("[data-rc-felicidades]");
    if (!reducido()) RefUI.partirLetras(titulo, nombre);
    marco.classList.add("is-shown");
    resultado.classList.add("is-done");
    titulo.focus({ preventScroll: true });
    // Que el título quede a la vista sin brincos
    const top = resultado.getBoundingClientRect().top;
    if (top < 70 || top > window.innerHeight * 0.4) {
      window.scrollTo({ top: window.scrollY + top - (window.innerWidth <= 560 ? 84 : 100), behavior: reducido() ? "auto" : "smooth" });
    }
    if (!reducido()) {
      vibrar([20, 60, 30]);
      RefUI.confeti(figura);
      setTimeout(() => destellos(figura, 34, 1), 120);
      RefUI.initTilt(imagen);
    }
    prepararBotones();
    // Redes: solo cuando ya se vio el reconocimiento
    setTimeout(() => {
      const redes = $("[data-rc-redes]");
      redes.hidden = false;
      redes.classList.add("is-in");
    }, reducido() ? 600 : 2600);
  }

  /* Destellos: estrellitas doradas de 4 puntas que se encienden y apagan
     alrededor de `el` (canvas encima de todo, se borra solo). */
  function destellos(el, n, escala) {
    if (reducido() || !el) return;
    const r = el.getBoundingClientRect();
    const cv = document.createElement("canvas");
    cv.className = "rf-confeti";
    cv.setAttribute("aria-hidden", "true");
    document.body.appendChild(cv);
    const dpr = Math.min(window.devicePixelRatio || 1, 2), W = innerWidth, H = innerHeight;
    cv.width = W * dpr; cv.height = H * dpr;
    const ctx = cv.getContext("2d");
    ctx.scale(dpr, dpr);
    const estrellas = Array.from({ length: n }, () => {
      // Más en los bordes que en el centro: se ve como luz que se escapa del papel
      const borde = Math.random() < 0.7;
      const x = borde ? r.left + (Math.random() < 0.5 ? -0.06 : 1.06) * r.width * Math.random() ** 0.2 + (Math.random() - 0.5) * 30
                      : r.left + Math.random() * r.width;
      const y = r.top + Math.random() * r.height;
      return { x: Math.max(8, Math.min(W - 8, x)), y, t0: Math.random() * 900, vida: 600 + Math.random() * 600,
               tam: (6 + Math.random() * 10) * escala, giro: Math.random() * Math.PI,
               c: Math.random() < 0.75 ? "#f2c94c" : "#ffffff" };
    });
    const inicio = performance.now();
    (function cuadro(t) {
      const dt = t - inicio;
      ctx.clearRect(0, 0, W, H);
      let vivas = 0;
      estrellas.forEach((s) => {
        const f = (dt - s.t0) / s.vida;
        if (f < 0 || f > 1) { if (f < 0) vivas++; return; }
        vivas++;
        const k = Math.sin(f * Math.PI), z = s.tam * k;
        ctx.save();
        ctx.translate(s.x, s.y - f * 10); ctx.rotate(s.giro + f * 1.2);
        ctx.globalAlpha = k;
        ctx.fillStyle = s.c;
        ctx.shadowColor = "rgba(242, 201, 76, .9)"; ctx.shadowBlur = z * 1.4;
        ctx.beginPath();
        ctx.moveTo(0, -z); ctx.quadraticCurveTo(0, 0, z, 0); ctx.quadraticCurveTo(0, 0, 0, z);
        ctx.quadraticCurveTo(0, 0, -z, 0); ctx.quadraticCurveTo(0, 0, 0, -z); ctx.fill();
        ctx.restore();
      });
      if (vivas) requestAnimationFrame(cuadro); else cv.remove();
    })(inicio);
  }

  /* --- Guardar, compartir y verlo en grande ----------------------------------- */
  const esCelular = () => matchMedia("(pointer: coarse)").matches && !matchMedia("(any-pointer: fine)").matches;
  function puedeCompartir() {
    if (!esCelular() || !archivo) return false;
    try { return !!(navigator.canShare && navigator.canShare({ files: [archivo] })); } catch (e) { return false; }
  }

  // En el celular "Guardar" abre el menú del sistema (ahí está "Guardar imagen");
  // en computadora se descarga el archivo.
  const descargar = $("[data-rc-descargar]");
  function prepararBotones() {
    const compartible = puedeCompartir();
    $("[data-rc-compartir]").hidden = !compartible;
    $("[data-rc-acciones]").classList.toggle("is-single", !compartible);
    $("[data-rc-descargar-txt]").textContent = compartible ? "Guardar en mi celular" : "Descargar reconocimiento";
    $("[data-rc-visor-guardar]").textContent = compartible ? "Guardar" : "Descargar";
  }

  function bajarArchivo() {
    const url = URL.createObjectURL(archivo);
    const a = document.createElement("a");
    a.href = url;
    a.download = archivo.name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 4000);
  }

  let tDescarga;
  function guardar() {
    if (!archivo) return;
    if (puedeCompartir()) {
      navigator.share({ files: [archivo] }).catch((e) => { if (e && e.name !== "AbortError") bajarArchivo(); });
      return;
    }
    if (!descargar._html) descargar._html = descargar.innerHTML;
    descargar.classList.add("is-done");
    descargar.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg> Descargado';
    clearTimeout(tDescarga);
    tDescarga = setTimeout(() => { descargar.classList.remove("is-done"); descargar.innerHTML = descargar._html; }, 1800);
    bajarArchivo();
  }
  descargar.addEventListener("click", guardar);

  $("[data-rc-compartir]").addEventListener("click", () => {
    if (!archivo) return;
    navigator.share({
      files: [archivo],
      title: "Mi reconocimiento Westhill",
      text: "Mi reconocimiento de la Universidad Westhill @univwesthill",
    }).catch(() => {});
  });

  // Tocar el reconocimiento (sin arrastrar para inclinarlo) lo abre en grande
  const visor = $("[data-rc-visor]");
  let toque = null;
  figura.addEventListener("pointerdown", (e) => { toque = { x: e.clientX, y: e.clientY }; });
  function verGrande() {
    if (!resultado.classList.contains("is-done") || !visor.showModal) return;
    $("[data-rc-visor-img]").src = imagen.src;
    $("[data-rc-visor-img]").alt = imagen.alt;
    visor.showModal();
  }
  figura.addEventListener("click", (e) => {
    if (toque && Math.hypot(e.clientX - toque.x, e.clientY - toque.y) > 8) return;
    verGrande();
  });
  figura.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); verGrande(); } });
  $("[data-rc-cerrar]").addEventListener("click", () => visor.close());
  $("[data-rc-visor-guardar]").addEventListener("click", guardar);
  visor.addEventListener("click", (e) => { if (e.target === visor) visor.close(); });
})();
