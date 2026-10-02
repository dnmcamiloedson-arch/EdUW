/* ==========================================================================
   Universidad Westhill — Programa de referidos (cliente)
   --------------------------------------------------------------------------
   Habla con el backend de Apps Script (apps-script/Codigo.gs).
   Expone window.Referidos para que cualquier página lo use:

     Referidos.CONFIG.ENDPOINT        URL /exec de la aplicación web
     Referidos.codigoDesdeURL()       código del link (?ref=ABC123) o ""
     Referidos.linkPersonal(codigo)   URL absoluta del formulario con ?ref=
     Referidos.obtenerReferidor(c)    → { ok, referidor: { codigo, nombre } }
     Referidos.crearReferidor(datos)  → { ok, codigo, nombre, nuevo, link }
     Referidos.registrarReferido(d)   → { ok, referidor }

   Además conecta solo el <form data-referidos-form> si existe en la página.
   ========================================================================== */
(function () {
  "use strict";

  const CONFIG = {
    // Pega aquí la URL de tu implementación (Implementar > Aplicación web).
    ENDPOINT: "",
    PAGINA_FORMULARIO: "referidos.html",
    CLAVE_LOCAL: "uw_ref", // recuerda el código si la persona navega y vuelve
  };

  const sinEndpoint = () => ({ ok: false, error: "Falta configurar Referidos.CONFIG.ENDPOINT." });

  function normalizar(codigo) {
    return String(codigo || "").trim().toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 20);
  }

  function codigoDesdeURL() {
    const params = new URLSearchParams(location.search);
    const codigo = normalizar(params.get("ref") || params.get("codigo"));
    try {
      if (codigo) localStorage.setItem(CONFIG.CLAVE_LOCAL, codigo);
      else return normalizar(localStorage.getItem(CONFIG.CLAVE_LOCAL));
    } catch (e) { /* almacenamiento bloqueado: solo se usa la URL */ }
    return codigo;
  }

  function linkPersonal(codigo, pagina = CONFIG.PAGINA_FORMULARIO) {
    const url = new URL(pagina, location.href);
    url.search = "";
    url.hash = "";
    url.searchParams.set("ref", normalizar(codigo));
    return url.toString();
  }

  async function obtenerReferidor(codigo) {
    codigo = normalizar(codigo);
    if (!codigo) return { ok: false, error: "Sin código." };
    if (!CONFIG.ENDPOINT) return sinEndpoint();
    const url = new URL(CONFIG.ENDPOINT);
    url.searchParams.set("accion", "referidor");
    url.searchParams.set("codigo", codigo);
    const res = await fetch(url.toString());
    return res.json();
  }

  // text/plain evita el preflight CORS, que Apps Script no responde.
  async function enviar(datos) {
    if (!CONFIG.ENDPOINT) return sinEndpoint();
    const res = await fetch(CONFIG.ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(datos),
    });
    return res.json();
  }

  async function crearReferidor(datos) {
    const r = await enviar(Object.assign({}, datos, { accion: "crearReferidor" }));
    if (r.ok) r.link = linkPersonal(r.codigo);
    return r;
  }

  function registrarReferido(datos) {
    return enviar(Object.assign({}, datos, { accion: "registrarReferido" }));
  }

  /* --- Formulario de registro ------------------------------------------- */
  function initFormulario(form) {
    const $ = (sel) => form.querySelector(sel);
    const codigo = codigoDesdeURL();
    const campoRef = $("[name=ref]");
    if (campoRef) campoRef.value = codigo;

    // Aviso "Te invitó ..." fuera o dentro del form.
    const aviso = document.querySelector("[data-referidor]");
    const nombreAviso = aviso && aviso.querySelector("[data-referidor-nombre]");
    if (codigo && aviso) {
      obtenerReferidor(codigo).then((r) => {
        if (r.ok && nombreAviso) {
          nombreAviso.textContent = r.referidor.nombre.split(/\s+/)[0];
          aviso.hidden = false;
        }
      }).catch(() => {});
    }

    const boton = $("button[type=submit]");
    const exito = $(".form-success");
    const error = $(".form-error");

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      if (exito) exito.hidden = true;
      if (error) error.hidden = true;

      let valido = true;
      form.querySelectorAll("[required]").forEach((input) => {
        const ok = input.type === "checkbox" ? input.checked
          : input.type === "email" ? /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(input.value.trim())
          : input.value.trim() !== "";
        const field = input.closest(".field");
        if (field) field.classList.toggle("is-invalid", !ok);
        if (!ok) valido = false;
      });
      if (!valido) { const inv = $(".is-invalid input, .is-invalid select"); if (inv) inv.focus(); return; }

      const datos = Object.fromEntries(new FormData(form).entries());
      delete datos.aviso;
      const texto = boton ? boton.textContent : "";
      if (boton) { boton.disabled = true; boton.textContent = "Enviando…"; }

      try {
        const r = await registrarReferido(datos);
        if (!r.ok) throw new Error(r.error || "No se pudo enviar.");
        form.reset();
        if (campoRef) campoRef.value = codigo;
        if (exito) { exito.hidden = false; exito.focus && exito.focus(); }
      } catch (err) {
        if (error) {
          error.textContent = "No pudimos enviar tu registro. Intenta de nuevo o escríbenos a admisiones@uw.edu.mx.";
          error.hidden = false;
        }
        console.error("[Referidos]", err);
      } finally {
        if (boton) { boton.disabled = false; boton.textContent = texto; }
      }
    });
  }

  window.Referidos = {
    CONFIG, codigoDesdeURL, linkPersonal,
    obtenerReferidor, crearReferidor, registrarReferido,
  };

  document.addEventListener("DOMContentLoaded", () => {
    document.querySelectorAll("form[data-referidos-form]").forEach(initFormulario);
  });
})();
