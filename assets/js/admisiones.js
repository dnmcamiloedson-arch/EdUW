/* ==========================================================================
   Universidad Westhill — Panel de Admisiones (admisiones.html)
   --------------------------------------------------------------------------
   · Pide la clave de Admisiones (se valida en el servidor; se recuerda solo
     mientras la pestaña siga abierta).
   · Genera códigos con Referidos.crearReferidor y arma la tarjeta con QR
     (RefTarjeta) para descargarla o compartirla.
   · Lista todos los códigos con cuántos invitados llegaron con cada uno.
   ========================================================================== */
(function () {
  "use strict";

  const $ = (id) => document.getElementById(id);
  const CLAVE_SESION = "uw_admisiones";
  let clave = "";
  let todos = [];
  let actual = null;        // { nombre, codigo, link, archivo }
  let temporizador;

  const leerClave = () => { try { return sessionStorage.getItem(CLAVE_SESION) || ""; } catch (e) { return ""; } };
  const guardarClave = (v) => { try { v ? sessionStorage.setItem(CLAVE_SESION, v) : sessionStorage.removeItem(CLAVE_SESION); } catch (e) {} };

  function validar(input) {
    const v = input.value.trim();
    const ok = input.type === "email" ? /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v) : v !== "";
    input.closest(".rf-field").classList.toggle("is-invalid", !ok);
    return ok;
  }

  function error(form, msg) {
    const p = form.querySelector(".rf-form-error");
    p.textContent = msg || "";
    p.hidden = !msg;
  }

  function cargando(boton, si, texto) {
    if (!boton._texto) boton._texto = boton.textContent;
    boton.disabled = si;
    boton.textContent = si ? texto : boton._texto;
  }

  /* --- Acceso -------------------------------------------------------------- */
  const formClave = $("form-clave");

  async function entrar(valor, silencioso) {
    const r = await Referidos.listarReferidores(valor);
    if (!r.ok) {
      if (!silencioso) throw new Error(r.error || "No se pudo entrar.");
      return false;
    }
    clave = valor;
    guardarClave(valor);
    const mostrarPanel = () => {
      $("acceso").hidden = true;
      const admin = $("admin");
      admin.hidden = false;
      admin.classList.add("rf-materialize");     // el panel se materializa en el lugar de la clave
      $("salir").hidden = false;
      pintarLista(r.referidores);
      RefUI.initTilt($("r-pase"));
      RefUI.initTilt($("r-tarjeta"));
    };
    // La puerta se desvanece hacia arriba y luego aparece el panel (sin salto)
    if (silencioso || RefUI.reducido()) mostrarPanel();
    else {
      const gate = $("acceso");
      gate.classList.add("is-leaving");
      gate.addEventListener("animationend", mostrarPanel, { once: true });
    }
    return true;
  }

  formClave.addEventListener("submit", async (e) => {
    e.preventDefault();
    error(formClave, "");
    const input = $("clave");
    if (!validar(input)) { input.focus(); return; }
    const boton = formClave.querySelector("button[type=submit]");
    cargando(boton, true, "Entrando…");
    try {
      await entrar(input.value.trim());
      input.value = "";
    } catch (err) {
      error(formClave, err.message);
      formClave.classList.remove("is-wrong");
      void formClave.offsetWidth;                // reinicia la sacudida si se vuelve a fallar
      formClave.classList.add("is-wrong");
      input.select();
    } finally {
      cargando(boton, false);
    }
  });

  $("salir").addEventListener("click", () => {
    guardarClave("");
    location.reload();
  });

  /* --- Pase en vivo -------------------------------------------------------- */
  const nombrePase = $("r-nombre");
  const reels = $("r-codigo");
  function pintarNombre(texto) {
    const v = String(texto || "").trim();
    nombrePase.textContent = v || "Nombre";
    nombrePase.classList.toggle("is-empty", !v);
  }
  $("l-nombre").addEventListener("input", (e) => pintarNombre(e.target.value));

  /* --- Generar código ------------------------------------------------------ */
  const tarjeta = $("tarjeta");
  const form = $("form-link");
  const resultado = $("resultado");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    error(form, "");
    const nombre = $("l-nombre"), correo = $("l-correo");
    const validos = [nombre, correo].map(validar);
    if (!validos.every(Boolean)) { (validos[0] ? correo : nombre).focus(); return; }

    const boton = form.querySelector("button[type=submit]");
    cargando(boton, true, "Generando…");
    try {
      const r = await Referidos.crearReferidor({
        clave, nombre: nombre.value.trim(), email: correo.value.trim(), telefono: $("l-telefono").value.trim(),
      });
      if (!r.ok) throw new Error(r.error || "No se pudo generar el código.");
      await mostrar({ nombre: r.nombre, codigo: r.codigo, link: r.link }, r.nuevo === false ? "existente" : "nuevo");
      recargar();
    } catch (err) {
      error(form, err.message || "No se pudo generar el código. Intenta de nuevo.");
    } finally {
      cargando(boton, false);
    }
  });

  async function mostrar(ref, modo) {
    const cod = String(ref.codigo);
    actual = Object.assign({}, ref, { archivo: null });

    $("r-titulo").textContent = modo === "existente" ? "Pase de siempre" : "Pase de invitación";
    $("r-encabezado").textContent = modo === "nuevo" ? "Pase listo" : "Pase de " + ref.nombre.split(/\s+/)[0];
    $("r-sub").textContent = modo === "existente" ? "Este correo ya tenía código; es el mismo." : "Comparte la tarjeta o el link.";
    pintarNombre(ref.nombre);
    reels.setAttribute("aria-label", "Código " + cod.split("").join(" "));
    RefUI.rodillos(reels, cod);

    $("r-link").value = ref.link;
    const texto = "Te invito a conocer la Universidad Westhill. Regístrate aquí: " + ref.link;
    $("r-whatsapp").href = "https://wa.me/?text=" + encodeURIComponent(texto);

    // La tarjeta se dibuja antes de mostrarla para que el cambio de altura sea uno solo
    // Si la tarjeta falla, el código y el link se muestran igual (ya están guardados)
    const img = $("r-tarjeta");
    let hayTarjeta = false;
    try {
      const cv = await RefTarjeta.dibujar(ref);
      img.src = cv.toDataURL("image/png");
      actual.archivo = await RefTarjeta.archivo(cv, cod);
      hayTarjeta = true;
    } catch (err) {
      console.error("[Tarjeta]", err);
    }
    img.closest("figure").hidden = !hayTarjeta;
    descargar.hidden = !hayTarjeta;
    $("r-compartir").hidden = !hayTarjeta || !puedeCompartir(actual.archivo);

    RefUI.morph(tarjeta, () => {
      form.hidden = true;
      resultado.hidden = false;
      resultado.classList.remove("rf-materialize");
      void resultado.offsetWidth;              // reinicia la animación si se cambia de pase
      resultado.classList.add("rf-materialize");
    });
  }

  function puedeCompartir(archivo) {
    try { return !!(navigator.canShare && navigator.canShare({ files: [archivo] })); } catch (e) { return false; }
  }

  const descargar = $("r-descargar");
  let tDescarga;
  descargar.addEventListener("click", () => {
    if (!actual || !actual.archivo) return;
    // Confirmación en el mismo botón: verde un momento y vuelve
    if (!descargar._html) descargar._html = descargar.innerHTML;
    descargar.classList.add("is-done");
    descargar.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg> Descargada';
    clearTimeout(tDescarga);
    tDescarga = setTimeout(() => { descargar.classList.remove("is-done"); descargar.innerHTML = descargar._html; }, 1600);
    const url = URL.createObjectURL(actual.archivo);
    const a = document.createElement("a");
    a.href = url;
    a.download = actual.archivo.name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 4000);
  });

  $("r-compartir").addEventListener("click", () => {
    if (!actual || !actual.archivo) return;
    navigator.share({
      files: [actual.archivo],
      title: "Invitación Universidad Westhill",
      text: "Te invito a conocer la Universidad Westhill. Regístrate aquí: " + actual.link,
    }).catch(() => {});
  });

  const copiar = $("r-copiar");
  copiar.addEventListener("click", async () => {
    const input = $("r-link");
    try { await navigator.clipboard.writeText(input.value); }
    catch (_) { input.select(); document.execCommand("copy"); }
    copiar.classList.add("is-copied");
    $("r-aviso").textContent = "Link copiado";
    clearTimeout(temporizador);
    temporizador = setTimeout(() => { copiar.classList.remove("is-copied"); $("r-aviso").textContent = ""; }, 1800);
  });

  $("r-otro").addEventListener("click", () => {
    RefUI.morph(tarjeta, () => {
      form.reset();
      form.querySelectorAll(".is-invalid").forEach((f) => f.classList.remove("is-invalid"));
      resultado.hidden = true;
      resultado.classList.remove("rf-materialize");
      form.hidden = false;
    });
    actual = null;
    pintarNombre("");
    RefUI.rodillos(reels, "");
    reels.setAttribute("aria-label", "El código aparecerá aquí");
    $("l-nombre").focus();
  });

  /* --- Lista de códigos ---------------------------------------------------- */
  const lista = $("lista");
  const fechaCorta = new Intl.DateTimeFormat("es-MX", { day: "numeric", month: "short", year: "numeric" });

  const filas = new Map();   // código → <li>, para no rehacer la lista en cada tecla

  function pintarLista(refs) {
    todos = refs || [];
    RefUI.contar($("s-codigos"), todos.length);
    RefUI.contar($("s-invitados"), todos.reduce((s, r) => s + (r.invitados || 0), 0));
    let nuevas = 0;
    const vivos = new Set();
    todos.forEach((r) => {
      vivos.add(r.codigo);
      const previa = filas.get(r.codigo);
      if (previa) { actualizarFila(previa, r); return; }
      const li = fila(r);
      li.style.setProperty("--i", Math.min(nuevas++, 12));
      li.classList.add("is-new");                 // solo lo nuevo entra animado
      li.addEventListener("animationend", () => li.classList.remove("is-new"), { once: true });
      filas.set(r.codigo, li);
    });
    filas.forEach((li, c) => { if (!vivos.has(c)) { li.remove(); filas.delete(c); } });
    filtrar();
  }

  const sinAcentos = (s) => String(s).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

  // Buscar pasa decenas de veces por minuto: sin animación, solo mostrar/ocultar
  function filtrar() {
    const q = sinAcentos($("buscar").value.trim());
    const visibles = q ? todos.filter((r) => sinAcentos(r.nombre + " " + r.correo + " " + r.codigo).includes(q)) : todos;
    const set = new Set(visibles.map((r) => r.codigo));
    todos.forEach((r) => {
      const li = filas.get(r.codigo);
      li.hidden = !set.has(r.codigo);
      lista.appendChild(li);                      // mantiene el orden sin recrear nodos
    });
    $("vacio").hidden = visibles.length > 0;
    $("vacio").textContent = todos.length ? "Nada coincide con tu búsqueda." : "Aún no hay códigos.";
  }

  function actualizarFila(li, r) {
    li._ref = r;
    const b = li.querySelector(".count b");
    if (b.textContent !== String(r.invitados)) RefUI.contar(b, r.invitados);
    li.classList.toggle("has-guests", r.invitados > 0);
  }

  function resaltar(codigo) {
    const li = filas.get(codigo);
    if (!li || RefUI.reducido()) return;
    li.classList.remove("is-flash");
    void li.offsetWidth;
    li.classList.add("is-flash");
  }

  function fila(r) {
    const li = document.createElement("li");
    li.className = "rf-code-row";
    li._ref = r;
    const f = new Date(r.fecha);
    li.innerHTML = `
      <span class="rf-avatar" aria-hidden="true"></span>
      <span class="who"><b></b><small></small></span>
      <span class="code"></span>
      <span class="count"><b></b><small>invitados</small></span>
      <button class="rf-btn rf-btn--glass rf-btn--sm rf-row-btn" type="button">Tarjeta</button>`;
    li.querySelector(".rf-avatar").textContent = (r.nombre.trim()[0] || "·").toUpperCase();
    li.querySelector(".who b").textContent = r.nombre;
    li.querySelector(".who small").textContent = [r.correo, isNaN(f) ? "" : fechaCorta.format(f)].filter(Boolean).join(" · ");
    li.querySelector(".code").textContent = r.codigo;
    li.querySelector(".count b").textContent = r.invitados;
    li.classList.toggle("has-guests", r.invitados > 0);
    const btn = li.querySelector("button");
    btn.setAttribute("aria-label", "Ver tarjeta de " + r.nombre);
    btn.addEventListener("click", async () => {
      cargando(btn, true, "…");
      try { await mostrar(li._ref, "lista"); }
      finally { cargando(btn, false); }
      $("admin").scrollIntoView({ behavior: RefUI.reducido() ? "auto" : "smooth", block: "start" });
    });
    return li;
  }

  $("buscar").addEventListener("input", filtrar);

  async function recargar() {
    const btn = $("recargar");
    btn.classList.add("is-spinning");
    try {
      const r = await Referidos.listarReferidores(clave);
      if (r.ok) { pintarLista(r.referidores); if (actual) resaltar(actual.codigo); }
      else if (r.clave === false) { guardarClave(""); location.reload(); }
    } catch (e) { /* sin red: se queda la lista anterior */ }
    finally { btn.classList.remove("is-spinning"); }
  }
  $("recargar").addEventListener("click", recargar);

  /* --- Inicio -------------------------------------------------------------- */
  document.addEventListener("DOMContentLoaded", () => {
    const guardada = leerClave();
    if (guardada) entrar(guardada, true).catch(() => {});
    else $("clave").focus({ preventScroll: true });
  });
})();
