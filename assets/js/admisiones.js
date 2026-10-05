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
    $("acceso").hidden = true;
    $("admin").hidden = false;
    $("salir").hidden = false;
    pintarLista(r.referidores);
    RefUI.initTilt($("r-pase"));
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
    const cv = await RefTarjeta.dibujar(ref);
    const img = $("r-tarjeta");
    img.src = cv.toDataURL("image/png");
    actual.archivo = await RefTarjeta.archivo(cv, cod);
    $("r-compartir").hidden = !puedeCompartir(actual.archivo);

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

  $("r-descargar").addEventListener("click", () => {
    if (!actual || !actual.archivo) return;
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

  function pintarLista(refs) {
    todos = refs || [];
    $("s-codigos").textContent = todos.length;
    $("s-invitados").textContent = todos.reduce((s, r) => s + (r.invitados || 0), 0);
    filtrar();
  }

  const sinAcentos = (s) => String(s).toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

  function filtrar() {
    const q = sinAcentos($("buscar").value.trim());
    const visibles = q ? todos.filter((r) => sinAcentos(r.nombre + " " + r.correo + " " + r.codigo).includes(q)) : todos;
    lista.replaceChildren(...visibles.map(fila));
    $("vacio").hidden = visibles.length > 0;
    $("vacio").textContent = todos.length ? "Nada coincide con tu búsqueda." : "Aún no hay códigos.";
  }

  function fila(r, i) {
    const li = document.createElement("li");
    li.className = "rf-code-row";
    li.style.setProperty("--i", Math.min(i, 12));
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
      try { await mostrar(r, "lista"); }
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
      if (r.ok) pintarLista(r.referidores);
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
