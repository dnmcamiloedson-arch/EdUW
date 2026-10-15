/* ==========================================================================
   Universidad Westhill — Panel de reconocimientos (admisiones-reconocimientos.html)
   --------------------------------------------------------------------------
   · Misma clave que admisiones.html (se valida en el servidor y se recuerda
     solo mientras la pestaña siga abierta; entra a los dos paneles).
   · Reconocimientos: prepa (su logo sale solo), fecha, textos y la lista de
     estudiantes. La vista previa es la imagen real que se manda y se
     redibuja al escribir. Al crear, cada estudiante tiene su link y su
     botón de WhatsApp; los ya mandados quedan marcados.
   · Prepas: catálogo con el logo de cada escuela (se reduce en el navegador
     y se guarda en la hoja).
   ========================================================================== */
(function () {
  "use strict";

  const $ = (id) => document.getElementById(id);
  const R = window.Reconocimientos;
  const CLAVE_SESION = "uw_admisiones";            // la misma de admisiones.html
  const CLAVE_ENVIADOS = "uw_rec_enviados";
  let clave = "";
  let prepas = [];                                  // [{ nombre, logo, reconocimientos }]
  let textos = {};                                  // textos fijos guardados
  let historial = [];
  let grupo = null;                                 // { comunes, items: [...] }
  let actual = 0;                                   // índice del estudiante en la vista previa
  let vista = "sobre";

  const leerClave = () => { try { return sessionStorage.getItem(CLAVE_SESION) || ""; } catch (e) { return ""; } };
  const guardarClave = (v) => { try { v ? sessionStorage.setItem(CLAVE_SESION, v) : sessionStorage.removeItem(CLAVE_SESION); } catch (e) {} };
  const enviados = (() => { try { return JSON.parse(localStorage.getItem(CLAVE_ENVIADOS)) || {}; } catch (e) { return {}; } })();
  const marcarEnviado = (codigo) => {
    enviados[codigo] = Date.now();
    try { localStorage.setItem(CLAVE_ENVIADOS, JSON.stringify(enviados)); } catch (e) {}
  };

  const primerNombre = (n) => String(n || "").trim().split(/\s+/)[0] || "";
  const sinAcentos = (s) => String(s).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const esCelular = () => matchMedia("(pointer: coarse)").matches && !matchMedia("(any-pointer: fine)").matches;

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
  function invalido(input, si) {
    input.closest(".rf-field").classList.toggle("is-invalid", si);
    return !si;
  }

  /* --- Acceso ---------------------------------------------------------------- */
  const formClave = $("form-clave");

  async function entrar(valor, silencioso) {
    const [cat, lista] = await Promise.all([R.catalogo(valor), R.listar(valor)]);
    if (!cat.ok || !lista.ok) {
      if (!silencioso) throw new Error((!cat.ok ? cat.error : lista.error) || "No se pudo entrar.");
      if (cat.clave === false) guardarClave("");
      return false;
    }
    clave = valor;
    guardarClave(valor);
    const mostrarPanel = () => {
      $("acceso").hidden = true;
      const admin = $("admin");
      admin.hidden = false;
      admin.classList.add("rf-materialize");
      $("salir").hidden = false;
      $("otro-panel").hidden = false;
      // Las píldoras se miden ya visibles
      admin.querySelectorAll("[data-pills]").forEach((p) => p.dispatchEvent(new Event("change")));
      ponerPrepas(cat.prepas);
      ponerTextos(cat.textos, true);
      pintarHistorial(lista.reconocimientos);
      RefUI.initTilt($("vista"));
      dibujar();
    };
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
    if (!invalido(input, !input.value.trim())) { input.focus(); return; }
    const boton = formClave.querySelector("button[type=submit]");
    cargando(boton, true, "Entrando…");
    try {
      await entrar(input.value.trim());
      input.value = "";
    } catch (err) {
      error(formClave, err.message);
      formClave.classList.remove("is-wrong");
      void formClave.offsetWidth;
      formClave.classList.add("is-wrong");
      input.select();
    } finally {
      cargando(boton, false);
    }
  });
  $("salir").addEventListener("click", () => { guardarClave(""); location.reload(); });

  /* --- Pestañas -------------------------------------------------------------- */
  document.querySelectorAll("input[name=tab]").forEach((r) => r.addEventListener("change", () => {
    const prepasTab = r.value === "prepas" && r.checked;
    if (!r.checked) return;
    const sale = prepasTab ? $("tab-rec") : $("tab-prepas");
    const entra = prepasTab ? $("tab-prepas") : $("tab-rec");
    sale.hidden = true;
    entra.hidden = false;
    entra.classList.remove("is-entering");
    void entra.offsetWidth;
    entra.classList.add("is-entering");
  }));

  /* --- Catálogo de prepas ---------------------------------------------------- */
  const buscarPrepa = (nombre) => {
    const k = R.clavePrepa(nombre);
    return k ? prepas.find((p) => R.clavePrepa(p.nombre) === k) || null : null;
  };

  function ponerPrepas(lista) {
    prepas = (lista || []).slice().sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));
    $("n-prepas").textContent = prepas.length;
    // La copia "activa" de las píldoras (la que se desliza) también lleva el número
    const copia = document.querySelectorAll(".rc-tabs .rf-pills-active span")[1];
    if (copia) copia.innerHTML = `Prepas <i class="n">${prepas.length}</i>`;
    RefUI.contar($("s-prepas"), prepas.length);
    pintarPrepas();
    revisarPrepa(false);
  }

  // Iniciales para cuando la prepa aún no tiene logo
  function monograma(nombre) {
    const n = String(nombre || "").trim();
    if (n.length <= 6) return n.toUpperCase();
    const palabras = n.split(/\s+/).filter((w) => !/^(de|del|la|las|los|el|y|e)$/i.test(w));
    return palabras.slice(0, 3).map((w) => (/^\d+$/.test(w) ? w : w[0])).join("").toUpperCase().slice(0, 5);
  }

  function tileLogo(el, prepa, nombre) {
    el.classList.toggle("is-vacio", !prepa || !prepa.logo);
    el.replaceChildren();
    if (prepa && prepa.logo) {
      const img = new Image();
      img.src = prepa.logo;
      img.alt = "";
      el.appendChild(img);
    } else if (nombre) {
      el.textContent = monograma(nombre);
    } else {
      el.innerHTML = '<svg viewBox="0 0 24 24"><path d="M4 20V9l8-5 8 5v11"/><path d="M9 20v-6h6v6"/></svg>';
    }
  }

  /* --- Campo "Prepa": el logo aparece solo al reconocerla -------------------- */
  const inPrepa = $("prepa");
  const menu = $("sugerencias");
  let opciones = [], marcada = -1, ultimaPrepa = null;

  function revisarPrepa(animar = true) {
    const p = buscarPrepa(inPrepa.value);
    const tile = $("p-logo");
    const cambio = (p && p.nombre) !== (ultimaPrepa && ultimaPrepa.nombre) || (p && p.logo) !== (ultimaPrepa && ultimaPrepa.logo);
    tileLogo(tile, p, inPrepa.value.trim());
    if (animar && cambio && p && p.logo && !RefUI.reducido()) {
      tile.classList.remove("is-pop"); void tile.offsetWidth; tile.classList.add("is-pop");
    }
    ultimaPrepa = p;
    const estado = $("p-estado");
    estado.classList.remove("is-nueva");
    if (p && p.logo) estado.innerHTML = "✓ Con logo";
    else if (inPrepa.value.trim()) {
      estado.classList.add("is-nueva");
      estado.innerHTML = '<button type="button" id="subir-rapido">+ Subir logo</button>';
      $("subir-rapido").addEventListener("click", () => $("logo-rapido").click());
    } else estado.textContent = "";
    if (cambio) dibujar();
  }

  function abrirMenu() {
    const q = sinAcentos(inPrepa.value.trim());
    const k = R.clavePrepa(inPrepa.value);
    opciones = prepas.filter((p) => !q || sinAcentos(p.nombre).includes(q) || R.clavePrepa(p.nombre).includes(k)).slice(0, 8);
    // Si ya está escrita completa, no hace falta sugerir
    if (!opciones.length || (opciones.length === 1 && R.clavePrepa(opciones[0].nombre) === k)) { cerrarMenu(); return; }
    marcada = -1;
    menu.replaceChildren(...opciones.map((p, i) => {
      const li = document.createElement("li");
      li.id = "sug-" + i;
      li.setAttribute("role", "option");
      li.setAttribute("aria-selected", "false");
      const t = document.createElement("span");
      t.className = "rc-logo";
      tileLogo(t, p, p.nombre);
      const nombre = document.createElement("span");
      const n = p.nombre, j = q ? sinAcentos(n).indexOf(q) : -1;
      if (j >= 0) {
        const m = document.createElement("mark");
        m.textContent = n.slice(j, j + q.length);
        nombre.append(n.slice(0, j), m, n.slice(j + q.length));
      } else nombre.textContent = n;
      li.append(t, nombre);
      li.addEventListener("pointerdown", (e) => { e.preventDefault(); elegir(i); });   // no pierde el foco
      return li;
    }));
    menu.hidden = false;
    inPrepa.setAttribute("aria-expanded", "true");
  }
  function cerrarMenu() {
    menu.hidden = true;
    inPrepa.setAttribute("aria-expanded", "false");
    inPrepa.removeAttribute("aria-activedescendant");
  }
  function marcar(i) {
    marcada = (i + opciones.length) % opciones.length;
    menu.querySelectorAll("li").forEach((li, j) => li.setAttribute("aria-selected", String(j === marcada)));
    inPrepa.setAttribute("aria-activedescendant", "sug-" + marcada);
    const li = menu.children[marcada];
    if (li) li.scrollIntoView({ block: "nearest" });
  }
  function elegir(i) {
    const p = opciones[i];
    if (!p) return;
    inPrepa.value = p.nombre;
    invalido(inPrepa, false);
    cerrarMenu();
    revisarPrepa();
  }

  inPrepa.addEventListener("input", () => { abrirMenu(); revisarPrepa(); });
  inPrepa.addEventListener("focus", abrirMenu);
  inPrepa.addEventListener("blur", () => setTimeout(cerrarMenu, 80));
  inPrepa.addEventListener("keydown", (e) => {
    if (menu.hidden) { if (e.key === "ArrowDown") { abrirMenu(); e.preventDefault(); } return; }
    if (e.key === "ArrowDown") { marcar(marcada + 1); e.preventDefault(); }
    else if (e.key === "ArrowUp") { marcar(marcada - 1); e.preventDefault(); }
    else if (e.key === "Enter" && marcada >= 0) { elegir(marcada); e.preventDefault(); }
    else if (e.key === "Escape") { cerrarMenu(); e.preventDefault(); }
  });

  // "+ Subir logo" desde el mismo campo: la prepa queda guardada para la próxima
  $("logo-rapido").addEventListener("change", async (e) => {
    const file = e.target.files[0];
    e.target.value = "";
    if (!file) return;
    const nombre = inPrepa.value.trim();
    const estado = $("p-estado");
    estado.textContent = "Subiendo…";
    try {
      const logo = await R.prepararLogo(file);
      const r = await R.guardarPrepa({ clave, nombre, logo });
      if (!r.ok) throw new Error(r.error);
      guardarLocal(r.prepa);
      revisarPrepa();
    } catch (err) {
      estado.textContent = "";
      error($("form-rec"), err.message || "No se pudo subir el logo.");
      revisarPrepa(false);
    }
  });

  function guardarLocal(prepa, anterior) {
    const k = R.clavePrepa(anterior || prepa.nombre);
    const previa = prepas.find((p) => R.clavePrepa(p.nombre) === k);
    const nueva = Object.assign({ reconocimientos: previa ? previa.reconocimientos : 0 }, prepa);
    ponerPrepas(prepas.filter((p) => p !== previa).concat(nueva));
    return nueva;
  }

  /* --- Textos fijos ------------------------------------------------------------ */
  const campos = { motivo: $("motivo"), mensaje: $("mensaje"), firma: $("firma") };
  function ponerTextos(t, llenar) {
    textos = Object.assign({ motivo: "", mensaje: "", firma: "" }, t);
    if (llenar) Object.keys(campos).forEach((k) => { campos[k].value = textos[k] || ""; });
    revisarTextos();
  }
  function revisarTextos() {
    const distinto = Object.keys(campos).some((k) => campos[k].value.trim() !== (textos[k] || "").trim());
    const cont = $("textos-accion");
    if (distinto && !cont.querySelector("button")) {
      cont.innerHTML = '<button class="rf-text-btn" type="button">Guardar como textos fijos</button>';
      cont.querySelector("button").addEventListener("click", guardarTextosFijos);
    } else if (!distinto && cont.querySelector("button")) cont.textContent = "";
  }
  async function guardarTextosFijos() {
    const cont = $("textos-accion");
    const boton = cont.querySelector("button");
    boton.disabled = true;
    boton.textContent = "Guardando…";
    try {
      const r = await R.guardarTextos(Object.assign({ clave }, valores()));
      if (!r.ok) throw new Error(r.error);
      ponerTextos(r.textos, false);
      cont.innerHTML = '<span class="rc-guardado">✓ Guardados</span>';
      setTimeout(() => { if (cont.querySelector(".rc-guardado")) cont.textContent = ""; revisarTextos(); }, 1800);
    } catch (err) {
      boton.disabled = false;
      boton.textContent = "Guardar como textos fijos";
      error($("form-rec"), err.message || "No se pudieron guardar los textos.");
    }
  }
  Object.values(campos).forEach((c) => c.addEventListener("input", () => { revisarTextos(); dibujar(); }));

  /* --- Fecha y estudiantes ------------------------------------------------------ */
  const hoy = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  };
  $("fecha").value = hoy();
  $("fecha").addEventListener("input", dibujar);

  const inAlumnos = $("alumnos");
  let alumnos = [];
  inAlumnos.addEventListener("input", () => {
    alumnos = R.leerEstudiantes(inAlumnos.value);
    if (alumnos.length) invalido(inAlumnos, false);
    $("c-total").textContent = alumnos.length;
    $("c-wa").textContent = alumnos.filter((a) => a.telefono).length;
    const boton = $("crear");
    boton.textContent = alumnos.length === 1 ? "Crear 1 reconocimiento"
      : alumnos.length > 1 ? `Crear ${alumnos.length} reconocimientos` : "Crear reconocimientos";
    boton._texto = boton.textContent;
    dibujar();
  });

  function valores() {
    return {
      prepa: inPrepa.value.trim(), fechaVisita: $("fecha").value,
      motivo: campos.motivo.value.trim(), mensaje: campos.mensaje.value.trim(), firma: campos.firma.value.trim(),
    };
  }

  /* --- Vista previa en vivo ------------------------------------------------------ */
  const lienzo = $("vista");
  let turno = 0, pendiente = 0;

  function datosVista() {
    if (grupo && !$("res").hidden) {
      const it = grupo.items[actual] || grupo.items[0];
      return Object.assign({}, grupo.comunes, it, { logo: (buscarPrepa(grupo.comunes.prepa) || {}).logo || "" });
    }
    const v = valores();
    return Object.assign(v, { nombre: (alumnos[0] || {}).nombre || "", logo: (buscarPrepa(v.prepa) || {}).logo || "" });
  }

  // Se redibuja como mucho una vez por cuadro; si llega otra tecla, gana la última
  function dibujar() {
    if (pendiente) return;
    pendiente = requestAnimationFrame(async () => {
      pendiente = 0;
      const mio = ++turno;
      const d = datosVista();
      const cv = await (vista === "sobre" ? RecTarjeta.sobre(d) : RecTarjeta.diploma(d));
      if (mio !== turno) return;
      lienzo.getContext("2d").drawImage(cv, 0, 0);
      lienzo.setAttribute("aria-label", (vista === "sobre" ? "Sobre para " : "Reconocimiento para ") + (d.nombre || "el estudiante"));
      const n = primerNombre(d.nombre);
      $("vista-hint").textContent = vista === "sobre"
        ? (n ? `Así le llega a ${n} por WhatsApp.` : "El sobre es la imagen que llega por WhatsApp.")
        : (n ? `Esto ve ${n} al abrir el sobre.` : "Esto ve el estudiante al abrir el sobre.");
    });
  }
  document.querySelectorAll("input[name=vista]").forEach((r) => r.addEventListener("change", () => {
    if (!r.checked) return;
    vista = r.value;
    etiquetaDescarga();
    dibujar();
  }));

  /* --- Crear el grupo ------------------------------------------------------------ */
  const formRec = $("form-rec");
  const panel = $("panel-rec");
  const res = $("res");

  formRec.addEventListener("submit", async (e) => {
    e.preventDefault();
    error(formRec, "");
    cerrarMenu();
    const okPrepa = invalido(inPrepa, !inPrepa.value.trim());
    const okAlumnos = invalido(inAlumnos, !alumnos.length);
    if (!okPrepa) { inPrepa.focus(); return; }
    if (!okAlumnos) { inAlumnos.focus(); return; }

    const boton = $("crear");
    cargando(boton, true, "Creando…");
    try {
      const comunes = valores();
      const r = await R.crear({ clave, grupo: comunes, estudiantes: alumnos });
      if (!r.ok) throw new Error(r.error || "No se pudieron crear.");
      // Si la prepa es nueva, queda en el catálogo para la próxima (aunque aún no tenga logo)
      if (!buscarPrepa(comunes.prepa)) {
        R.guardarPrepa({ clave, nombre: comunes.prepa, logo: "" }).then((x) => { if (x.ok) guardarLocal(x.prepa); }).catch(() => {});
      }
      mostrarGrupo(comunes, r.reconocimientos, `${r.reconocimientos.length === 1 ? "1 reconocimiento listo" : r.reconocimientos.length + " reconocimientos listos"}`);
      recargar(r.reconocimientos.map((x) => x.codigo));
    } catch (err) {
      error(formRec, err.message || "No se pudieron crear. Intenta de nuevo.");
    } finally {
      cargando(boton, false);
    }
  });

  function mostrarGrupo(comunes, items, titulo, sub) {
    grupo = { comunes, items: items.map((x) => Object.assign({}, x, { link: x.link || R.link(x.codigo) })) };
    actual = 0;
    archivos.clear();
    $("res-titulo").textContent = titulo;
    $("res-sub").textContent = sub || "Toca un nombre para ver su tarjeta. Al mandarlo queda marcado.";
    $("wa-nota").hidden = true;
    const lista = $("envios");
    lista.replaceChildren(...grupo.items.map((it, i) => filaEnvio(it, i)));
    pintarProgreso();
    $("r-compartir").hidden = !esCelular() || !navigator.canShare;
    $("res-share").classList.toggle("is-single", $("r-compartir").hidden);
    RefUI.morph(panel, () => {
      formRec.hidden = true;
      res.hidden = false;
      res.classList.remove("rf-materialize");
      void res.offsetWidth;
      res.classList.add("rf-materialize");
    });
    $("res-titulo").focus({ preventScroll: true });
    seleccionar(0);
  }

  const telBonito = (t) => {
    const d = String(t || "").replace(/\D/g, "").slice(-10);
    return d.length === 10 ? `${d.slice(0, 2)} ${d.slice(2, 6)} ${d.slice(6)}` : t;
  };
  // 55 1234 5678 → 525512345678 (México); 044/045 de antes se quitan
  function telWhatsApp(t) {
    let d = String(t || "").replace(/\D/g, "");
    if (/^04[45]\d{10}$/.test(d)) d = d.slice(3);
    if (d.length === 10) return "52" + d;
    return d.length >= 11 ? d : "";
  }
  const mensajeWA = (it) =>
    `¡Hola, ${primerNombre(it.nombre)}! Gracias por visitar la Universidad Westhill. Te dejamos tu reconocimiento, ábrelo aquí: ${it.link}`;
  function linkWA(it) {
    const tel = telWhatsApp(it.telefono), texto = encodeURIComponent(mensajeWA(it));
    // En computadora va directo a WhatsApp Web (no pide instalar la app)
    if (esCelular()) return `https://wa.me/${tel}?text=${texto}`;
    return `https://web.whatsapp.com/send?${tel ? "phone=" + tel + "&" : ""}text=${texto}`;
  }

  function filaEnvio(it, i) {
    const li = document.createElement("li");
    li.className = "rc-envio is-new";
    li.style.setProperty("--i", Math.min(i, 14));
    li.addEventListener("animationend", () => li.classList.remove("is-new"), { once: true });
    li.innerHTML = `
      <span class="rf-avatar" aria-hidden="true"></span>
      <button class="quien" type="button"><b></b><small></small></button>
      <a class="rc-wa" target="_blank" rel="noopener">
        <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2Zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.3-.4.2-.4.7-1.4.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.8 11.9 11.9 0 0 0 4.6 4c1.7.7 2.3.8 3.2.6a2.7 2.7 0 0 0 1.8-1.3 2.2 2.2 0 0 0 .2-1.3c-.1-.1-.2-.2-.4-.3Z"/></svg>
        <span>WhatsApp</span>
      </a>
      <button class="rf-copy" type="button">
        <span class="icons" aria-hidden="true">
          <svg class="i-copy" viewBox="0 0 24 24"><rect x="9" y="9" width="11" height="11" rx="2.5"/><path d="M5 15V6a2 2 0 0 1 2-2h8"/></svg>
          <svg class="i-check" viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>
        </span>
      </button>`;
    li.querySelector(".rf-avatar").textContent = (it.nombre.trim()[0] || "·").toUpperCase();
    li.querySelector(".quien b").textContent = it.nombre;
    li.querySelector(".quien small").textContent = it.telefono ? telBonito(it.telefono) : "Sin teléfono · elige el chat";
    li.querySelector(".quien").setAttribute("aria-label", "Ver la tarjeta de " + it.nombre);
    li.querySelector(".quien").addEventListener("click", () => seleccionar(i));
    const wa = li.querySelector(".rc-wa");
    wa.href = linkWA(it);
    wa.setAttribute("aria-label", "Mandar por WhatsApp a " + it.nombre);
    pintarEnviado(wa, it.codigo);
    wa.addEventListener("click", (e) => mandar(e, i, wa));
    const copiar = li.querySelector(".rf-copy");
    copiar.setAttribute("aria-label", "Copiar el link de " + it.nombre);
    copiar.addEventListener("click", async () => {
      try { await navigator.clipboard.writeText(it.link); } catch (_) { /* sin portapapeles */ }
      copiar.classList.add("is-copied");
      setTimeout(() => copiar.classList.remove("is-copied"), 1600);
    });
    return li;
  }

  function pintarEnviado(wa, codigo) {
    const si = !!enviados[codigo];
    wa.classList.toggle("is-sent", si);
    wa.querySelector("span").textContent = si ? "Enviado" : "WhatsApp";
  }

  function pintarProgreso() {
    if (!grupo) return;
    const n = grupo.items.filter((it) => enviados[it.codigo]).length, total = grupo.items.length;
    $("res-prog").textContent = `${n} de ${total} enviados`;
    $("res-barra").style.width = (total ? (n / total) * 100 : 0) + "%";
  }

  function seleccionar(i) {
    actual = i;
    $("envios").querySelectorAll(".rc-envio").forEach((li, j) => li.classList.toggle("is-actual", j === i));
    dibujar();
  }

  /* --- Imagen de cada estudiante (se arma una vez y se guarda) ------------------- */
  const archivos = new Map();
  function archivoDe(i, tipo = vista) {
    const it = grupo.items[i];
    const k = it.codigo + "|" + tipo;
    if (!archivos.has(k)) {
      const d = Object.assign({}, grupo.comunes, it, { logo: (buscarPrepa(grupo.comunes.prepa) || {}).logo || "" });
      archivos.set(k, (tipo === "sobre" ? RecTarjeta.sobre(d) : RecTarjeta.diploma(d))
        .then((cv) => RecTarjeta.archivo(cv, `${tipo === "sobre" ? "sobre" : "reconocimiento"}-westhill-${it.codigo}.png`)));
    }
    return archivos.get(k);
  }

  const nota = $("wa-nota");
  let tNota;
  function avisar(texto) {
    nota.textContent = texto;
    nota.hidden = false;
    clearTimeout(tNota);
    tNota = setTimeout(() => { nota.hidden = true; }, 9000);
  }

  /* WhatsApp: el link va en el mensaje y la tarjeta (sobre) junto.
     · Computadora: se copia la tarjeta y se abre WhatsApp Web con el chat; solo hay que pegarla.
     · Celular con teléfono: abre directo el chat con el mensaje.
     · Celular sin teléfono: menú de compartir con la tarjeta y el texto (elige el chat). */
  function mandar(e, i, wa) {
    const it = grupo.items[i];
    seleccionar(i);
    const archivo = archivoDe(i, "sobre");
    if (esCelular() && !telWhatsApp(it.telefono) && navigator.canShare) {
      e.preventDefault();
      archivo.then((f) => {
        if (navigator.canShare({ files: [f] })) return navigator.share({ files: [f], text: mensajeWA(it) });
        location.href = wa.href;
      }).then(() => listoEnvio(it, wa)).catch(() => {});
      return;
    }
    listoEnvio(it, wa);
    if (!esCelular() && navigator.clipboard && window.ClipboardItem) {
      try {
        navigator.clipboard.write([new ClipboardItem({ "image/png": archivo })])
          .then(() => avisar(`Sobre de ${primerNombre(it.nombre)} copiado. En el chat pégalo con Ctrl+V (⌘+V en Mac) y envía.`))
          .catch(() => avisar("Si quieres mandar la imagen, descarga la tarjeta y adjúntala en el chat."));
      } catch (err) { avisar("Si quieres mandar la imagen, descarga la tarjeta y adjúntala en el chat."); }
    }
  }
  function listoEnvio(it, wa) {
    marcarEnviado(it.codigo);
    pintarEnviado(wa, it.codigo);
    pintarProgreso();
    const fila = filasHist.get(it.codigo);
    if (fila) actualizarFila(fila, fila._r);
  }

  const descargar = $("r-descargar");
  const etiquetaDescarga = () => { descargar.querySelector("span").textContent = vista === "sobre" ? "Descargar sobre" : "Descargar reconocimiento"; };
  etiquetaDescarga();
  let tDescarga;
  descargar.addEventListener("click", async () => {
    if (!grupo) return;
    const f = await archivoDe(actual);
    const t = descargar.querySelector("span");
    descargar.classList.add("is-done");
    t.textContent = "Descargada";
    clearTimeout(tDescarga);
    tDescarga = setTimeout(() => { descargar.classList.remove("is-done"); etiquetaDescarga(); }, 1600);
    const url = URL.createObjectURL(f);
    const a = document.createElement("a");
    a.href = url;
    a.download = f.name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 4000);
  });
  $("r-compartir").addEventListener("click", async () => {
    if (!grupo) return;
    const it = grupo.items[actual];
    const f = await archivoDe(actual);
    navigator.share({ files: [f], text: mensajeWA(it) }).catch(() => {});
  });

  $("otro-grupo").addEventListener("click", () => {
    RefUI.morph(panel, () => {
      res.hidden = true;
      res.classList.remove("rf-materialize");
      formRec.hidden = false;
      inAlumnos.value = "";
      inAlumnos.dispatchEvent(new Event("input"));
      formRec.querySelectorAll(".is-invalid").forEach((f) => f.classList.remove("is-invalid"));
    });
    grupo = null;
    dibujar();
    inAlumnos.focus();
  });

  /* --- Historial ------------------------------------------------------------------ */
  const lista = $("hist");
  const filasHist = new Map();
  const fechaCorta = (iso) => {
    const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso || "");
    return m ? new Intl.DateTimeFormat("es-MX", { day: "numeric", month: "short" }).format(new Date(+m[1], m[2] - 1, +m[3])) : "";
  };

  function pintarHistorial(recs, nuevos) {
    historial = recs || [];
    RefUI.contar($("s-total"), historial.length);
    RefUI.contar($("s-abiertos"), historial.filter((r) => r.abierto).length);
    let n = 0;
    const vivos = new Set();
    historial.forEach((r) => {
      vivos.add(r.codigo);
      const previa = filasHist.get(r.codigo);
      if (previa) { actualizarFila(previa, r); return; }
      const li = filaHist(r);
      li.style.setProperty("--i", Math.min(n++, 12));
      li.classList.add("is-new");
      li.addEventListener("animationend", () => li.classList.remove("is-new"), { once: true });
      filasHist.set(r.codigo, li);
    });
    filasHist.forEach((li, c) => { if (!vivos.has(c)) { li.remove(); filasHist.delete(c); } });
    filtrar();
    (nuevos || []).forEach((c) => {
      const li = filasHist.get(c);
      if (!li || RefUI.reducido()) return;
      li.classList.remove("is-flash"); void li.offsetWidth; li.classList.add("is-flash");
    });
  }

  function filtrar() {
    const q = sinAcentos($("buscar").value.trim());
    const visibles = q ? historial.filter((r) => sinAcentos(r.nombre + " " + r.prepa + " " + r.codigo).includes(q)) : historial;
    const set = new Set(visibles.map((r) => r.codigo));
    historial.forEach((r) => {
      const li = filasHist.get(r.codigo);
      li.hidden = !set.has(r.codigo);
      lista.appendChild(li);
    });
    const vacio = $("hist-vacio");
    vacio.hidden = visibles.length > 0;
    vacio.textContent = historial.length ? "Nada coincide con tu búsqueda." : "Aún no hay reconocimientos.";
  }
  $("buscar").addEventListener("input", filtrar);

  function actualizarFila(li, r) {
    li._r = r;
    const e = li.querySelector(".rc-estado");
    e.className = "rc-estado " + (r.abierto ? "is-abierto" : enviados[r.codigo] ? "is-enviado" : "");
    e.textContent = r.abierto ? "✓ Abierto" : enviados[r.codigo] ? "Enviado" : "Sin abrir";
    e.title = r.abierto ? `Lo abrió ${r.vistas || 1} ${r.vistas === 1 ? "vez" : "veces"}` : "";
  }

  function filaHist(r) {
    const li = document.createElement("li");
    li.className = "rf-code-row";
    li.innerHTML = `
      <span class="rf-avatar" aria-hidden="true"></span>
      <span class="who"><b></b><small></small></span>
      <span class="code"></span>
      <span class="count"><span class="rc-estado"></span></span>
      <button class="rf-btn rf-btn--glass rf-btn--sm rf-row-btn" type="button">Enviar</button>`;
    li.querySelector(".rf-avatar").textContent = (r.nombre.trim()[0] || "·").toUpperCase();
    li.querySelector(".who b").textContent = r.nombre;
    li.querySelector(".who small").textContent = [r.prepa, fechaCorta(r.fechaVisita)].filter(Boolean).join(" · ");
    li.querySelector(".code").textContent = r.codigo;
    actualizarFila(li, r);
    const btn = li.querySelector("button");
    btn.setAttribute("aria-label", "Enviar de nuevo a " + r.nombre);
    btn.addEventListener("click", () => {
      const x = li._r;
      mostrarGrupo(
        { prepa: x.prepa, fechaVisita: x.fechaVisita, motivo: x.motivo, mensaje: x.mensaje, firma: x.firma },
        [x], "Reconocimiento de " + primerNombre(x.nombre), "Mándalo de nuevo o descarga su tarjeta."
      );
      $("tab-rec").scrollIntoView({ behavior: RefUI.reducido() ? "auto" : "smooth", block: "start" });
    });
    return li;
  }

  async function recargar(nuevos) {
    const btn = $("recargar");
    btn.classList.add("is-spinning");
    try {
      const r = await R.listar(clave);
      if (r.ok) pintarHistorial(r.reconocimientos, nuevos);
      else if (r.clave === false) { guardarClave(""); location.reload(); }
    } catch (e) { /* sin red: se queda la lista anterior */ }
    finally { btn.classList.remove("is-spinning"); }
  }
  $("recargar").addEventListener("click", () => recargar());

  /* --- Pestaña Prepas ------------------------------------------------------------- */
  const formPrepa = $("form-prepa");
  const inNombre = $("np-nombre");
  const drop = $("drop");
  let logoNuevo = null, editando = null;

  async function usarArchivo(file) {
    error(formPrepa, "");
    try {
      logoNuevo = await R.prepararLogo(file);
      const prev = $("np-preview");
      prev.replaceChildren(Object.assign(new Image(), { src: logoNuevo, alt: "" }));
      drop.classList.remove("has-logo"); void drop.offsetWidth; drop.classList.add("has-logo");
      $("np-drop-t").textContent = "Logo listo · toca para cambiarlo";
      if (!inNombre.value.trim()) {
        // Sugiere el nombre del archivo ("logo-epo-23.png" → "Epo 23")
        inNombre.value = file.name.replace(/\.[a-z]+$/i, "").replace(/^logo[\s_-]*/i, "").replace(/[_-]+/g, " ").trim().slice(0, 80);
        inNombre.select();
      }
      inNombre.focus();
    } catch (err) {
      error(formPrepa, err.message);
    }
  }
  $("np-logo").addEventListener("change", (e) => { if (e.target.files[0]) usarArchivo(e.target.files[0]); e.target.value = ""; });
  ["dragenter", "dragover"].forEach((t) => drop.addEventListener(t, (e) => { e.preventDefault(); drop.classList.add("is-over"); }));
  ["dragleave", "drop"].forEach((t) => drop.addEventListener(t, () => drop.classList.remove("is-over")));
  drop.addEventListener("drop", (e) => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) usarArchivo(f); });
  // Pegar una imagen copiada (Ctrl+V) mientras está abierta la pestaña Prepas
  document.addEventListener("paste", (e) => {
    if ($("tab-prepas").hidden) return;
    const f = [...(e.clipboardData || {}).files || []].find((x) => /^image\//.test(x.type));
    if (f) { e.preventDefault(); usarArchivo(f); }
  });

  function limpiarPrepa() {
    formPrepa.reset();
    logoNuevo = null;
    editando = null;
    $("t-prepa").textContent = "Nueva prepa";
    $("np-cancelar").hidden = true;
    $("np-drop-t").textContent = "Sube el logo";
    $("np-preview").innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="4" width="18" height="16" rx="3"/><circle cx="9" cy="10" r="2"/><path d="M21 16l-5-5-9 9"/></svg>';
    drop.classList.remove("has-logo");
    formPrepa.querySelectorAll(".is-invalid").forEach((f) => f.classList.remove("is-invalid"));
    lista2.querySelectorAll(".is-editando").forEach((li) => li.classList.remove("is-editando"));
  }
  $("np-cancelar").addEventListener("click", limpiarPrepa);

  formPrepa.addEventListener("submit", async (e) => {
    e.preventDefault();
    error(formPrepa, "");
    const nombre = inNombre.value.trim();
    if (!invalido(inNombre, !nombre)) { inNombre.focus(); return; }
    const logo = logoNuevo != null ? logoNuevo : (editando ? editando.logo : "");
    if (!logo && !editando) { error(formPrepa, "Sube el logo de la prepa."); return; }
    const boton = formPrepa.querySelector("button[type=submit]");
    cargando(boton, true, "Guardando…");
    try {
      const r = await R.guardarPrepa({ clave, nombre, logo, anterior: editando ? editando.nombre : "" });
      if (!r.ok) throw new Error(r.error || "No se pudo guardar.");
      guardarLocal(r.prepa, editando && editando.nombre);
      limpiarPrepa();
      const li = filasPrepa.get(R.clavePrepa(r.prepa.nombre));
      if (li && !RefUI.reducido()) { li.classList.remove("is-flash"); void li.offsetWidth; li.classList.add("is-flash"); }
    } catch (err) {
      error(formPrepa, err.message);
    } finally {
      cargando(boton, false);
    }
  });

  const lista2 = $("lista-prepas");
  const filasPrepa = new Map();
  function pintarPrepas() {
    filasPrepa.clear();
    lista2.replaceChildren(...prepas.map((p) => {
      const li = document.createElement("li");
      li.className = "rf-code-row";
      li.innerHTML = `
        <span class="rc-logo"></span>
        <span class="who"><b></b><small></small></span>
        <button class="rf-btn rf-btn--glass rf-btn--sm rf-row-btn" type="button"></button>
        <button class="rf-icon-btn" type="button"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M10 11v6M14 11v6M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12M9 7V4h6v3"/></svg></button>`;
      tileLogo(li.querySelector(".rc-logo"), p, p.nombre);
      li.querySelector(".who b").textContent = p.nombre;
      li.querySelector(".who small").textContent = (p.logo ? "" : "Sin logo todavía · ") +
        (p.reconocimientos === 1 ? "1 reconocimiento" : `${p.reconocimientos || 0} reconocimientos`);
      const editar = li.querySelector(".rf-row-btn");
      editar.textContent = p.logo ? "Cambiar logo" : "Subir logo";
      editar.addEventListener("click", () => {
        limpiarPrepa();
        editando = p;
        li.classList.add("is-editando");
        $("t-prepa").textContent = "Editar " + p.nombre;
        $("np-cancelar").hidden = false;
        inNombre.value = p.nombre;
        if (p.logo) {
          $("np-preview").replaceChildren(Object.assign(new Image(), { src: p.logo, alt: "" }));
          $("np-drop-t").textContent = "Toca para cambiar el logo";
        }
        formPrepa.scrollIntoView({ behavior: RefUI.reducido() ? "auto" : "smooth", block: "center" });
        $("np-logo").focus({ preventScroll: true });
      });
      const borrar = li.querySelector(".rf-icon-btn");
      borrar.setAttribute("aria-label", "Quitar " + p.nombre);
      borrar.addEventListener("click", async () => {
        if (!confirm(`¿Quitar ${p.nombre} de la lista? Los reconocimientos ya enviados no se borran.`)) return;
        const r = await R.borrarPrepa({ clave, nombre: p.nombre }).catch(() => ({ ok: false }));
        if (r.ok) ponerPrepas(prepas.filter((x) => x !== p));
      });
      filasPrepa.set(R.clavePrepa(p.nombre), li);
      return li;
    }));
    $("prepas-vacio").hidden = prepas.length > 0;
  }

  /* --- Inicio ---------------------------------------------------------------------- */
  document.addEventListener("DOMContentLoaded", () => {
    const guardada = leerClave();
    if (guardada) entrar(guardada, true).catch(() => {});
    else $("clave").focus({ preventScroll: true });
  });
})();
