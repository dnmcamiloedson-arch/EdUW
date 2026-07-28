/* ==========================================================================
   Universidad Westhill — UW WEB 2026
   JavaScript principal (vanilla, sin dependencias)
   --------------------------------------------------------------------------
   Responsabilidades:
     · Inyectar header y footer compartidos (una sola fuente de la verdad)
     · Menú sticky + menú móvil + dropdowns accesibles
     · Contadores animados (los números "suben" al entrar en pantalla)
     · Reveal on scroll (los bloques aparecen deslizándose)
     · Carruseles con scroll-snap y botones
     · Acordeones
     · Validación del formulario "Solicita información"
   --------------------------------------------------------------------------
   NOTA PARA EL PROGRAMADOR:
   El header/footer se definen UNA vez aquí (UW.renderHeader / renderFooter).
   Cada página sólo necesita <div data-uw-header></div> y
   <div data-uw-footer></div>, y opcionalmente <body data-page="nosotros">
   para marcar el enlace activo del menú.
   ========================================================================== */
(function () {
  "use strict";

  const UW = {};
  const $  = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

  /* --- Estructura de navegación (fuente única) -------------------------- */
  const NAV = [
    { id: "inicio", label: "Inicio", href: "index.html" },
    { id: "nosotros", label: "Nosotros", href: "nosotros.html", children: [
      { label: "Historia y filosofía", href: "nosotros.html" },
      { label: "Misión y visión", href: "nosotros.html#mision" },
      { label: "Acreditaciones", href: "nosotros.html#acreditaciones" },
    ]},
    { id: "oferta", label: "Oferta Académica", href: "oferta-academica.html", children: [
      { label: "Licenciaturas", href: "oferta-academica.html#licenciaturas" },
      { label: "Maestrías", href: "oferta-academica.html#maestrias" },
      { label: "Especialidades", href: "oferta-academica.html#especialidades" },
      { label: "Diplomados", href: "oferta-academica.html#diplomados" },
      { label: "Facultad de Medicina", href: "medicina.html" },
    ]},
    { id: "estudiantes", label: "Estudiantes", href: "estudiantes.html", children: [
      { label: "Westhill Well (Bienestar)", href: "westhill-well.html" },
      { label: "Atención psicológica", href: "estudiantes.html#psicologia" },
      { label: "Buzón ¡Te escuchamos!", href: "estudiantes.html#buzon" },
      { label: "Trámites escolares", href: "estudiantes.html#tramites" },
      { label: "Egresados y bolsa de trabajo", href: "estudiantes.html#egresados" },
    ]},
    { id: "mas", label: "Más", href: "#", children: [
      { label: "Becas Westhill", href: "becas.html" },
      { label: "Convenios", href: "convenios.html" },
      { label: "Biblioteca", href: "biblioteca.html" },
      { label: "Noticiero West", href: "noticiero.html" },
      { label: "Reglamentos", href: "reglamentos.html" },
      { label: "Revista Vestigia", href: "vestigia.html" },
    ]},
  ];

  /* --- Render del header ------------------------------------------------- */
  UW.renderHeader = function (mount) {
    const active = document.body.dataset.page || "inicio";
    const items = NAV.map((item) => {
      const isActive = item.id === active ? " is-active" : "";
      const hasDrop = item.children ? " has-dropdown" : "";
      const drop = item.children
        ? `<ul class="dropdown">${item.children.map((c) => `<li><a href="${c.href}">${c.label}</a></li>`).join("")}</ul>`
        : "";
      return `<li class="nav__item${hasDrop}${isActive}">
        <a class="nav__link" href="${item.href}">${item.label}</a>${drop}
      </li>`;
    }).join("");

    mount.innerHTML = `
      <div class="topbar">
        <div class="container">
          <span>📞 (55) 8851 7010 · ✉️ admisiones@uw.edu.mx</span>
          <ul class="topbar__links">
            <li><a href="biblioteca.html">Biblioteca</a></li>
            <li><a href="estudiantes.html#tramites">Alumnos</a></li>
            <li><a href="solicita-informacion.html">Solicita información</a></li>
          </ul>
        </div>
      </div>
      <header class="site-header" id="siteHeader">
        <div class="container">
          <nav class="nav" aria-label="Navegación principal">
            <a class="brand" href="index.html">
              <span class="brand__logo" aria-hidden="true">UW</span>
              <span class="brand__name">Universidad Westhill<small>Vestigia Nulla Retrorsum</small></span>
            </a>
            <ul class="nav__menu" id="navMenu">${items}</ul>
            <div class="nav__actions">
              <a class="btn btn--gold" href="solicita-informacion.html">Solicita información</a>
              <button class="nav__toggle" id="navToggle" aria-label="Abrir menú" aria-expanded="false" aria-controls="navMenu"><span></span></button>
            </div>
          </nav>
        </div>
      </header>`;
  };

  /* --- Render del footer ------------------------------------------------- */
  UW.renderFooter = function (mount) {
    mount.innerHTML = `
      <footer class="site-footer">
        <div class="container footer-top">
          <div class="footer-col">
            <a class="brand" href="index.html" style="color:#fff">
              <span class="brand__logo" aria-hidden="true">UW</span>
              <span class="brand__name" style="color:#fff">Universidad Westhill</span>
            </a>
            <ul class="footer-contact" style="margin-top:1rem">
              <li>📞 (55) 8851 7010</li>
              <li>✉️ admisiones@uw.edu.mx</li>
              <li>📍 Domingo García Ramos 56, Santa Fe, CDMX 05610</li>
              <li>🕗 Lunes a viernes de 08:00 a 17:00 hrs.</li>
            </ul>
            <div class="footer-social">
              <a href="#" aria-label="Facebook">f</a>
              <a href="#" aria-label="Instagram">◎</a>
              <a href="#" aria-label="TikTok">♪</a>
              <a href="#" aria-label="YouTube">▶</a>
            </div>
          </div>
          <div class="footer-col">
            <h4>Institución</h4>
            <ul>
              <li><a href="nosotros.html">Nosotros</a></li>
              <li><a href="oferta-academica.html">Oferta Académica</a></li>
              <li><a href="medicina.html">Facultad de Medicina</a></li>
              <li><a href="reglamentos.html">Reglamentos</a></li>
              <li><a href="nosotros.html#acreditaciones">Acreditaciones</a></li>
            </ul>
          </div>
          <div class="footer-col">
            <h4>Comunidad</h4>
            <ul>
              <li><a href="estudiantes.html">Estudiantes</a></li>
              <li><a href="westhill-well.html">Westhill Well</a></li>
              <li><a href="becas.html">Becas</a></li>
              <li><a href="convenios.html">Convenios</a></li>
              <li><a href="estudiantes.html#egresados">Bolsa de trabajo</a></li>
            </ul>
          </div>
          <div class="footer-col">
            <h4>Recursos</h4>
            <ul>
              <li><a href="biblioteca.html">Biblioteca</a></li>
              <li><a href="noticiero.html">Noticiero West</a></li>
              <li><a href="vestigia.html">Revista Vestigia</a></li>
              <li><a href="#">Algebraix</a></li>
              <li><a href="solicita-informacion.html">Solicita información</a></li>
            </ul>
          </div>
        </div>
        <div class="container footer-bottom">
          <span>© <span id="year"></span> Universidad Westhill. Todos los derechos reservados.</span>
          <span class="footer-motto">“Vestigia Nulla Retrorsum” — Nunca retrocedas sobre tus huellas</span>
          <a href="https://www.uw.edu.mx/wp-content/uploads/2021/10/AVISO-DE-PRIVACIDAD-INSTITUTE-Y-UNIVERSIDAD-2021.pdf" target="_blank" rel="noopener">Aviso de privacidad</a>
        </div>
      </footer>
      <a class="fab-wa" href="https://wa.me/525588517010" target="_blank" rel="noopener" aria-label="Escríbenos por WhatsApp">
        <svg viewBox="0 0 32 32" fill="currentColor" aria-hidden="true"><path d="M16 3C9 3 3.5 8.5 3.5 15.5c0 2.4.7 4.6 1.8 6.5L3 29l7.2-2.3c1.8 1 3.9 1.6 6 1.6 7 0 12.5-5.5 12.5-12.5S23 3 16 3zm0 22.7c-1.9 0-3.7-.5-5.3-1.5l-.4-.2-4.3 1.4 1.4-4.2-.3-.4a10 10 0 0 1-1.6-5.3C5.6 9.6 10.2 5 16 5s10.4 4.6 10.4 10.5S21.8 25.7 16 25.7zm5.7-7.8c-.3-.2-1.8-.9-2.1-1s-.5-.2-.7.2-.8 1-.9 1.2-.3.2-.6 0a8.3 8.3 0 0 1-2.4-1.5 9 9 0 0 1-1.7-2.1c-.2-.3 0-.5.1-.6l.5-.5.3-.5c.1-.2 0-.4 0-.5l-.9-2.2c-.2-.6-.5-.5-.7-.5h-.6a1.1 1.1 0 0 0-.8.4c-.3.3-1 1-1 2.5s1.1 2.9 1.2 3.1 2.1 3.3 5.1 4.6c2.5 1.1 3 .9 3.6.8s1.8-.7 2-1.4.4-1.3.3-1.4-.3-.3-.6-.4z"/></svg>
      </a>`;
    const y = $("#year"); if (y) y.textContent = new Date().getFullYear();
  };

  /* --- Interacciones del header ----------------------------------------- */
  UW.initHeader = function () {
    const header = $("#siteHeader");
    const toggle = $("#navToggle");
    const menu   = $("#navMenu");

    if (header) {
      const onScroll = () => header.classList.toggle("is-stuck", window.scrollY > 8);
      onScroll();
      window.addEventListener("scroll", onScroll, { passive: true });
    }
    if (toggle && menu) {
      toggle.addEventListener("click", () => {
        const open = menu.classList.toggle("is-open");
        toggle.setAttribute("aria-expanded", String(open));
        toggle.setAttribute("aria-label", open ? "Cerrar menú" : "Abrir menú");
      });
      // En móvil, un tap en un item con submenú lo despliega en lugar de navegar a "#"
      $$(".nav__item.has-dropdown > .nav__link", menu).forEach((link) => {
        link.addEventListener("click", (e) => {
          if (window.innerWidth <= 860 && link.getAttribute("href") === "#") {
            e.preventDefault();
            link.parentElement.classList.toggle("is-active");
          }
        });
      });
    }
  };

  /* --- Contadores animados ---------------------------------------------- */
  UW.initCounters = function () {
    const counters = $$("[data-count]");
    if (!counters.length || !("IntersectionObserver" in window)) {
      counters.forEach((el) => (el.textContent = el.dataset.count));
      return;
    }
    const animate = (el) => {
      const end = parseFloat(el.dataset.count);
      const suffix = el.dataset.suffix || "";
      const dur = 1600;
      const start = performance.now();
      const step = (now) => {
        const p = Math.min((now - start) / dur, 1);
        const eased = 1 - Math.pow(1 - p, 3); // easeOutCubic
        el.textContent = Math.round(end * eased).toLocaleString("es-MX") + suffix;
        if (p < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    };
    const io = new IntersectionObserver((entries, obs) => {
      entries.forEach((e) => { if (e.isIntersecting) { animate(e.target); obs.unobserve(e.target); } });
    }, { threshold: 0.4 });
    counters.forEach((el) => io.observe(el));
  };

  /* --- Reveal on scroll -------------------------------------------------- */
  UW.initReveal = function () {
    const items = $$("[data-reveal]");
    if (!items.length || !("IntersectionObserver" in window)) {
      items.forEach((el) => el.classList.add("is-visible"));
      return;
    }
    const io = new IntersectionObserver((entries, obs) => {
      entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("is-visible"); obs.unobserve(e.target); } });
    }, { threshold: 0.15 });
    items.forEach((el) => io.observe(el));
  };

  /* --- Carruseles -------------------------------------------------------- */
  UW.initCarousels = function () {
    $$("[data-carousel]").forEach((car) => {
      const track = $(".carousel__track", car);
      const prev = $(".carousel__btn--prev", car);
      const next = $(".carousel__btn--next", car);
      if (!track) return;
      const amount = () => Math.max(track.clientWidth * 0.8, 260);
      prev && prev.addEventListener("click", () => track.scrollBy({ left: -amount(), behavior: "smooth" }));
      next && next.addEventListener("click", () => track.scrollBy({ left:  amount(), behavior: "smooth" }));
    });
  };

  /* --- Acordeones -------------------------------------------------------- */
  UW.initAccordions = function () {
    $$(".accordion__head").forEach((head) => {
      const item = head.closest(".accordion__item");
      const panel = $(".accordion__panel", item);
      head.setAttribute("aria-expanded", "false");
      head.addEventListener("click", () => {
        const open = item.classList.toggle("is-open");
        head.setAttribute("aria-expanded", String(open));
        panel.style.maxHeight = open ? panel.scrollHeight + "px" : null;
      });
    });
  };

  /* --- Validación de formularios ---------------------------------------- */
  UW.initForms = function () {
    $$("form[data-validate]").forEach((form) => {
      form.addEventListener("submit", (e) => {
        let ok = true;
        $$("[required]", form).forEach((input) => {
          const field = input.closest(".field");
          const valid = input.type === "email"
            ? /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(input.value)
            : input.value.trim() !== "";
          field && field.classList.toggle("is-invalid", !valid);
          if (!valid) ok = false;
        });
        if (!ok) { e.preventDefault(); return; }
        e.preventDefault(); // Demo: sin backend. El programador conecta aquí el endpoint real.
        const done = $(".form-success", form);
        if (done) { done.hidden = false; }
        form.reset();
      });
    });
  };

  /* --- Boot ------------------------------------------------------------- */
  document.addEventListener("DOMContentLoaded", () => {
    const h = $("[data-uw-header]"); if (h) UW.renderHeader(h);
    const f = $("[data-uw-footer]"); if (f) UW.renderFooter(f);
    UW.initHeader();
    UW.initCounters();
    UW.initReveal();
    UW.initCarousels();
    UW.initAccordions();
    UW.initForms();
  });

  window.UW = UW;
})();
