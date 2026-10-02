/* ==========================================================================
   Landing Premedical · Universidad Westhill
   Interacciones y animaciones. Usa GSAP + ScrollTrigger + Lenis (en
   assets/vendor). Si faltan o el usuario pide movimiento reducido, la página
   funciona igual, sin animaciones.
   ========================================================================== */
(() => {
  "use strict";

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const root = document.documentElement;
  const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const gsap = window.gsap;
  const ScrollTrigger = window.ScrollTrigger;
  const motion = !reduceMotion && !!gsap && !!ScrollTrigger;

  if (!motion) root.classList.remove("js-motion");
  if (motion) gsap.registerPlugin(ScrollTrigger);

  /* Fotos de cada ruta. */
  const TRACK_IMAGES = {
    licenciatura: {
      src: "assets/img/premedical/caracal-3.webp",
      alt: "La mascota Westhill explicando reanimación en el laboratorio de simulación",
      label: "Foto ruta Licenciatura: laboratorio de simulación (1536x1024)",
    },
    maestria: {
      src: "assets/img/premedical/caracal-4.webp",
      alt: "La mascota Westhill investigando en la biblioteca con una laptop",
      label: "Foto ruta Maestría: biblioteca e investigación (1536x1024)",
    },
  };

  /* Mensajes de la guía por sección. EJEMPLO: ajustar el tono final. */
  const GUIDE_LINES = {
    hero: "¡Hola! Soy tu guía Westhill. Te acompaño en el recorrido.",
    rutas: "¿Vienes de la prepa o ya eres profesional? Elige tu ruta.",
    programa: "Así se ve tu mes, semana por semana. Sigue bajando.",
    experiencia: "Grupos pequeños y un mentor médico para ti.",
    voces: "Ellos ya lo vivieron. Arrastra las tarjetas.",
    preguntas: "¿Dudas? Aquí respondo las más comunes.",
    solicitud: "Solo 6 datos y apartamos tu lugar.",
    listo: "¡Todo listo! Ya puedes enviar tu solicitud.",
    enviado: "¡Nos vemos en el campus!",
  };

  /* ---------- Marcador cuando una foto no carga ---------- */
  function fallbackFor(img) {
    if (!img.dataset.label || img.dataset.failed) return;
    img.dataset.failed = "1";
    const box = document.createElement("div");
    box.className = "img-fallback";
    box.setAttribute("role", "img");
    box.setAttribute("aria-label", img.alt || img.dataset.label);
    const isAvatar = img.closest(".quote footer");
    box.innerHTML = isAvatar ? "" : '<i class="ph ph-image" aria-hidden="true"></i>';
    box.append(document.createTextNode(img.dataset.label));
    if (img.hasAttribute("data-parallax")) box.setAttribute("data-parallax", "");
    box.style.cssText = img.style.cssText;
    img.replaceWith(box);
  }
  function watchImage(img) {
    if (img.complete && img.naturalWidth === 0 && img.src) fallbackFor(img);
    else img.addEventListener("error", () => fallbackFor(img), { once: true });
  }
  $$("img[data-label]").forEach(watchImage);

  /* ---------- Desplazamiento suave ---------- */
  let lenis = null;
  if (motion && window.Lenis) {
    lenis = new window.Lenis({ lerp: 0.11, smoothWheel: true });
    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add((t) => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
  }
  $$('a[href^="#"]').forEach((a) => {
    a.addEventListener("click", (e) => {
      const id = a.getAttribute("href");
      const target = id.length > 1 && $(id);
      if (!target) return;
      e.preventDefault();
      if (lenis) lenis.scrollTo(target, { offset: -8, duration: 1.4 });
      else target.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth" });
      history.replaceState(null, "", id);
    });
  });

  /* ---------- Navegación ---------- */
  const nav = $("[data-nav]");
  const hero = $(".hero");
  new IntersectionObserver(
    ([entry]) => nav.classList.toggle("is-solid", !entry.isIntersecting),
    { rootMargin: "-80px 0px 0px 0px", threshold: 0 }
  ).observe($(".hero__copy"));

  if (motion) {
    ScrollTrigger.create({
      start: 0,
      end: "max",
      onUpdate: (self) => {
        const y = self.scroll();
        nav.classList.toggle("is-hidden", self.direction === 1 && y > 500);
      },
    });
  }

  const navLinks = $$(".nav__links a");
  const sectionObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        navLinks.forEach((l) => l.classList.toggle("is-active", l.getAttribute("href") === "#" + entry.target.id));
      });
    },
    { rootMargin: "-45% 0px -50% 0px" }
  );
  navLinks.forEach((l) => {
    const s = $(l.getAttribute("href"));
    if (s) sectionObserver.observe(s);
  });

  /* ---------- Botones: el relleno entra por el lado del cursor ---------- */
  $$(".btn").forEach((btn) => {
    const setOrigin = (e) => {
      const r = btn.getBoundingClientRect();
      btn.style.setProperty("--x", `${e.clientX - r.left}px`);
      btn.style.setProperty("--y", `${e.clientY - r.top}px`);
    };
    btn.addEventListener("pointerenter", setOrigin);
    btn.addEventListener("pointerleave", setOrigin);
  });

  /* ---------- Separar una palabra en letras animables ---------- */
  function splitLetters(el) {
    if (!el) return [];
    const text = el.textContent;
    el.setAttribute("aria-label", text);
    el.textContent = "";
    return Array.from(text).map((c) => {
      const s = document.createElement("span");
      s.className = "ch";
      s.setAttribute("aria-hidden", "true");
      s.textContent = c;
      el.append(s);
      return s;
    });
  }

  /* ---------- Guía: la mascota comenta cada sección ---------- */
  const guide = $("[data-guide]");
  const guideText = $("[data-guide-text]");
  const guideToggle = $("[data-guide-toggle]");
  const smallScreen = matchMedia("(max-width: 900px)");
  let guideKey = "hero";
  let guideMuted = false;
  let guideTimer = 0;
  try { guideMuted = localStorage.getItem("wh-guide-muted") === "1"; } catch (e) { /* sin almacenamiento */ }

  function setGuideOpen(open) {
    guide.classList.toggle("is-collapsed", !open);
    guideToggle.setAttribute("aria-expanded", String(open));
    clearTimeout(guideTimer);
    // El globo se oculta solo tras unos segundos para no tapar contenido.
    if (open) guideTimer = setTimeout(() => setGuideOpen(false), smallScreen.matches ? 4500 : 6500);
  }
  function say(key) {
    if (!guide || !GUIDE_LINES[key] || key === guideKey) return;
    guideKey = key;
    guideText.textContent = GUIDE_LINES[key];
    if (guideMuted) return;
    setGuideOpen(true);
    if (motion) {
      gsap.fromTo("[data-guide-bubble]", { scale: 0.86, y: 8 }, { scale: 1, y: 0, duration: 0.6, ease: "back.out(2.4)" });
      gsap.fromTo(guideToggle, { rotate: -10 }, { rotate: 0, duration: 0.8, ease: "elastic.out(1, .4)" });
    }
  }
  function guideEnter() {
    if (!guide) return;
    gsap.fromTo(guide, { opacity: 0, y: 40 }, { opacity: 1, y: 0, duration: 0.9, ease: "back.out(1.8)" });
  }
  if (guide) {
    setGuideOpen(!guideMuted);
    $("[data-guide-close]").addEventListener("click", () => {
      guideMuted = true;
      try { localStorage.setItem("wh-guide-muted", "1"); } catch (e) { /* sin almacenamiento */ }
      setGuideOpen(false);
    });
    guideToggle.addEventListener("click", () => {
      const open = guide.classList.contains("is-collapsed");
      guideMuted = !open;
      try { localStorage.setItem("wh-guide-muted", open ? "0" : "1"); } catch (e) { /* sin almacenamiento */ }
      setGuideOpen(open);
    });
    const guideObserver = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && say(e.target.dataset.section)),
      { rootMargin: "-45% 0px -50% 0px" }
    );
    $$("[data-section]").forEach((s) => guideObserver.observe(s));
  }

  /* ---------- Utilidades de trazo SVG ---------- */
  function prepStroke(path, visible = 0) {
    const len = path.getTotalLength();
    path.style.strokeDasharray = `${len}`;
    path.style.strokeDashoffset = `${len * (1 - visible)}`;
    return len;
  }

  /* ---------- Hero ---------- */
  const ecgPath = $(".ecg--hero .ecg__path");
  const ecgPulse = $(".ecg--hero .ecg__pulse");

  if (motion) {
    const len = prepStroke(ecgPath);
    const pulseLen = ecgPulse.getTotalLength();
    const seg = 140;
    ecgPulse.style.strokeDasharray = `${seg} ${pulseLen}`;
    ecgPulse.style.strokeDashoffset = `${seg}`;

    // La señal verde recorre la línea como un latido; solo corre con el hero en pantalla.
    const pulse = gsap.fromTo(
      ecgPulse,
      { strokeDashoffset: seg, opacity: 1 },
      { strokeDashoffset: -pulseLen, duration: 3.4, ease: "power1.inOut", repeat: -1, repeatDelay: 0.6, paused: true }
    );

    // La palabra clave entra letra por letra, con un pequeño rebote, sin marcas previas.
    const letters = splitLetters($("[data-letters]"));

    const tl = gsap.timeline({ defaults: { ease: "expo.out" } });
    tl.to("[data-iris]", { clipPath: "circle(150% at 55% 40%)", duration: 1.7, ease: "expo.inOut" }, 0)
      .fromTo(".hero__photo img", { scale: 1.3 }, { scale: 1, duration: 2.2 }, 0.1)
      .fromTo(".hero__title .line > span", { y: 0, yPercent: 105 }, { y: 0, yPercent: 0, duration: 1.2, stagger: 0.12 }, 0.35)
      .fromTo(letters, { yPercent: 115, rotate: 14, opacity: 0 }, { yPercent: 0, rotate: 0, opacity: 1, duration: 0.9, stagger: 0.045, ease: "back.out(2.2)" }, 0.6)
      .to("[data-hero-fade]", { opacity: 1, y: 0, duration: 1, stagger: 0.1 }, 0.7)
      .fromTo("[data-hero-inset]", { opacity: 0, y: 50, scale: 0.85 }, { opacity: 1, y: 0, scale: 1, duration: 1.3, ease: "back.out(1.5)" }, 0.95)
      .fromTo("[data-orb]", { opacity: 0, scale: 0.4 }, { opacity: 1, scale: 1, duration: 0.9, stagger: 0.12, ease: "back.out(2.4)" }, 1.15)
      .to(ecgPath, { strokeDashoffset: 0, duration: 2.2, ease: "power2.inOut" }, 0.5)
      .add(() => ScrollTrigger.isInViewport(hero) && pulse.play())
      .add(() => guideEnter(), 1.6);

    // Profundidad con el cursor: cada capa se desplaza según su data-depth.
    if (matchMedia("(pointer: fine)").matches) {
      const layers = $$("[data-depth]").map((el) => ({
        d: Number(el.dataset.depth),
        x: gsap.quickTo(el, "x", { duration: 0.9, ease: "power3.out" }),
        y: gsap.quickTo(el, "y", { duration: 0.9, ease: "power3.out" }),
      }));
      hero.addEventListener("pointermove", (e) => {
        const nx = e.clientX / window.innerWidth - 0.5;
        const ny = e.clientY / window.innerHeight - 0.5;
        layers.forEach((l) => { l.x(nx * 18 * l.d); l.y(ny * 14 * l.d); });
      });
      hero.addEventListener("pointerleave", () => layers.forEach((l) => { l.x(0); l.y(0); }));
    }

    ScrollTrigger.create({
      trigger: hero,
      start: "top bottom",
      end: "bottom top",
      onToggle: (self) => (self.isActive && tl.progress() === 1 ? pulse.play() : pulse.pause()),
    });

    // Profundidad: foto principal e inserto se separan al bajar.
    gsap.to(".hero__photo", { yPercent: -6, ease: "none", scrollTrigger: { trigger: hero, start: "top top", end: "bottom top", scrub: true } });
    gsap.to("[data-hero-inset]", { yPercent: -35, ease: "none", scrollTrigger: { trigger: hero, start: "top top", end: "bottom top", scrub: true } });
    void len;
  }

  /* ---------- Marquesina: avanza sola y acelera con la velocidad del scroll ---------- */
  const ticker = $("[data-ticker-track]");
  if (ticker && motion) {
    const set = $(".ticker__set", ticker);
    const clone = set.cloneNode(true);
    clone.setAttribute("aria-hidden", "true");
    ticker.append(clone);
    const loop = gsap.to(ticker, { xPercent: -50, duration: 28, ease: "none", repeat: -1 });
    let boost = gsap.to({}, {});
    ScrollTrigger.create({
      start: 0,
      end: "max",
      onUpdate: (self) => {
        const v = self.getVelocity();
        const dir = v < 0 ? -1 : 1;
        boost.kill();
        loop.timeScale(dir * Math.min(5, 1 + Math.abs(v) / 400));
        boost = gsap.to(loop, { timeScale: dir, duration: 1.2, ease: "power2.out" });
      },
    });
  }

  /* ---------- Declaración: las palabras se encienden con el scroll ---------- */
  const words = $("[data-words]");
  if (words) {
    const wrapWords = (node) => {
      Array.from(node.childNodes).forEach((child) => {
        if (child.nodeType === Node.TEXT_NODE) {
          const frag = document.createDocumentFragment();
          child.textContent.split(/(\s+)/).forEach((part) => {
            if (!part) return;
            if (/^\s+$/.test(part)) frag.append(document.createTextNode(" "));
            else {
              const s = document.createElement("span");
              s.className = "w";
              s.textContent = part;
              frag.append(s);
            }
          });
          child.replaceWith(frag);
        } else if (child.nodeType === Node.ELEMENT_NODE) {
          wrapWords(child);
        }
      });
    };
    if (motion) {
      wrapWords(words);
      const spans = $$(".w", words);
      gsap.set(spans, { opacity: 0.14 });
      gsap.set($$(".hl .w", words), { yPercent: 30 });
      gsap.to(spans, {
        opacity: 1,
        yPercent: 0,
        ease: "none",
        stagger: 0.08,
        scrollTrigger: { trigger: words, start: "top 80%", end: "bottom 40%", scrub: 0.6 },
      });
    }
  }

  /* ---------- Aparición al entrar en pantalla ---------- */
  if (motion) {
    ScrollTrigger.batch("[data-reveal]", {
      start: "top 88%",
      once: true,
      onEnter: (batch) => gsap.to(batch, { opacity: 1, y: 0, duration: 1.1, ease: "expo.out", stagger: 0.09, overwrite: true }),
    });
  }

  /* ---------- Rutas: Licenciatura / Maestría ---------- */
  const trackSwitch = $(".tracks__switch");
  const trackTabs = $$("[role=tab]", trackSwitch);
  const trackBody = $("[data-track-body]");
  const trackImg = $("[data-track-img]");
  const trackPanel = $("[data-track-panel]");
  let currentTrack = null;
  let routeTouched = false;

  function renderTrack(name, animate) {
    if (name === currentTrack) return;
    const prev = currentTrack;
    currentTrack = name;
    trackSwitch.dataset.active = name;
    trackTabs.forEach((t) => {
      const on = t.dataset.track === name;
      t.setAttribute("aria-selected", String(on));
      t.tabIndex = on ? 0 : -1;
      if (on) trackPanel.setAttribute("aria-labelledby", t.id);
    });

    const tpl = $(`template[data-track-tpl="${name}"]`);
    const fill = () => {
      trackBody.replaceChildren(tpl.content.cloneNode(true));
    };

    // Foto: la nueva se descubre de derecha a izquierda sobre la anterior.
    const data = TRACK_IMAGES[name];
    const swapImage = () => {
      const img = new Image();
      img.src = data.src;
      img.alt = data.alt;
      img.dataset.label = data.label;
      img.width = 1536;
      img.height = 1024;
      Object.assign(img.style, { position: "absolute", inset: "0" });
      trackImg.style.position = "relative";
      trackImg.append(img);
      watchImage(img);
      const added = trackImg.lastElementChild;
      const cleanup = () => {
        const kids = Array.from(trackImg.children);
        kids.slice(0, -1).forEach((n) => n.remove());
        kids[kids.length - 1].style.cssText = "";
      };
      if (animate && motion) {
        gsap.fromTo(added, { clipPath: "inset(0 0 0 100%)", scale: 1.12 }, { clipPath: "inset(0 0 0 0%)", scale: 1, duration: 1, ease: "expo.inOut", onComplete: cleanup });
      } else cleanup();
    };

    if (!prev) {
      fill();
      return;
    }
    swapImage();
    if (animate && motion) {
      gsap.to(trackBody.children, {
        opacity: 0, y: -14, filter: "blur(6px)", duration: 0.28, stagger: 0.03, ease: "power2.in",
        onComplete: () => {
          fill();
          gsap.fromTo(trackBody.children, { opacity: 0, y: 18, filter: "blur(6px)" }, { opacity: 1, y: 0, filter: "blur(0px)", duration: 0.7, stagger: 0.06, ease: "expo.out", clearProps: "filter" });
          gsap.fromTo($$(".ticks li", trackBody), { opacity: 0, x: -12 }, { opacity: 1, x: 0, duration: 0.6, stagger: 0.06, delay: 0.15, ease: "expo.out" });
        },
      });
    } else fill();

    // Si la persona aún no eligió ruta en el formulario, la preseleccionamos.
    if (!routeTouched) {
      const radio = $(`input[name="ruta"][value="${name}"]`);
      if (radio) {
        radio.checked = true;
        updateProgress();
      }
    }
  }

  trackTabs.forEach((tab, i) => {
    tab.addEventListener("click", () => renderTrack(tab.dataset.track, true));
    tab.addEventListener("keydown", (e) => {
      if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
      e.preventDefault();
      const next = trackTabs[(i + (e.key === "ArrowRight" ? 1 : -1) + trackTabs.length) % trackTabs.length];
      next.focus();
      renderTrack(next.dataset.track, true);
    });
  });

  /* ---------- Programa: recorrido horizontal fijado ---------- */
  if (motion) {
    const mm = gsap.matchMedia();
    mm.add("(min-width: 901px)", () => {
      const pin = $("[data-pan]");
      const track = $("[data-pan-track]");
      const line = $(".ecg--program .ecg__path");
      prepStroke(line);
      const distance = () => Math.max(0, track.scrollWidth - window.innerWidth);

      const pan = gsap.to(track, {
        x: () => -distance(),
        ease: "none",
        scrollTrigger: {
          trigger: pin,
          start: "top top",
          end: () => "+=" + distance(),
          pin: true,
          scrub: 1,
          invalidateOnRefresh: true,
        },
      });
      gsap.to(line, { strokeDashoffset: 0, ease: "none", scrollTrigger: { trigger: pin, start: "top top", end: () => "+=" + distance(), scrub: 1, invalidateOnRefresh: true } });

      // Cada módulo se endereza al entrar desde la derecha.
      $$(".module", track).forEach((m) => {
        gsap.fromTo(m, { rotate: 4, yPercent: 6 }, {
          rotate: 0, yPercent: 0, ease: "none",
          scrollTrigger: { trigger: m, containerAnimation: pan, start: "left 100%", end: "left 55%", scrub: true },
        });
      });
      return () => gsap.set([track, line], { clearProps: "all" });
    });
  }

  /* ---------- Bento: cifras, luz bajo el cursor y profundidad ---------- */
  function countUp(el) {
    const target = Number(el.dataset.count);
    const suffix = el.dataset.suffix || "";
    if (!motion) {
      el.textContent = target + suffix;
      return;
    }
    const obj = { v: 0 };
    gsap.to(obj, { v: target, duration: 1.6, ease: "expo.out", onUpdate: () => (el.textContent = Math.round(obj.v) + suffix) });
  }
  const counters = $$("[data-count]");
  if (motion) counters.forEach((el) => (el.textContent = "0" + (el.dataset.suffix || "")));
  const counterObserver = new IntersectionObserver(
    (entries, obs) => entries.forEach((e) => { if (e.isIntersecting) { countUp(e.target); obs.unobserve(e.target); } }),
    { threshold: 0.6 }
  );
  counters.forEach((el) => counterObserver.observe(el));

  $$("[data-spot]").forEach((cell) => {
    cell.addEventListener("pointermove", (e) => {
      const r = cell.getBoundingClientRect();
      cell.style.setProperty("--mx", `${e.clientX - r.left}px`);
      cell.style.setProperty("--my", `${e.clientY - r.top}px`);
    });
  });

  // Se monta al cargar la página para tomar el marcador si alguna foto falló.
  if (motion) {
    window.addEventListener("load", () => {
      $$(".cell--photo").forEach((cell) => {
        gsap.fromTo($("[data-parallax]", cell), { yPercent: -5 }, { yPercent: 5, ease: "none", scrollTrigger: { trigger: cell, start: "top bottom", end: "bottom top", scrub: true } });
      });
    });
  }

  /* ---------- Testimonios: pila que se arrastra ---------- */
  const stack = $("[data-stack]");
  if (stack) {
    let cards = $$(".quote", stack);
    const EASE = "cubic-bezier(.16,1,.3,1)";

    const layout = (instant) => {
      cards.forEach((card, k) => {
        card.style.transition = instant ? "none" : `transform .7s ${EASE}, opacity .45s ${EASE}`;
        const rot = k === 0 ? 0 : k % 2 ? 1.5 : -1.5;
        card.style.transform = `translate3d(0, ${k * 16}px, 0) scale(${1 - k * 0.05}) rotate(${rot}deg)`;
        card.style.opacity = k > 2 ? "0" : String(1 - k * 0.12);
        card.style.zIndex = String(cards.length - k);
        card.setAttribute("aria-hidden", String(k !== 0));
      });
    };
    layout(true);

    const flingTop = (dir) => {
      const top = cards[0];
      const w = stack.offsetWidth;
      top.style.transition = `transform .55s ${EASE}, opacity .55s ${EASE}`;
      top.style.transform = `translate3d(${dir * w * 1.15}px, -30px, 0) rotate(${dir * 18}deg)`;
      top.style.opacity = "0";
      cards = cards.slice(1).concat(top);
      setTimeout(() => layout(), 180);
    };
    const bringBack = () => {
      const last = cards[cards.length - 1];
      last.style.transition = "none";
      last.style.transform = `translate3d(${-stack.offsetWidth * 1.15}px, -30px, 0) rotate(-18deg)`;
      last.style.opacity = "0";
      cards = [last].concat(cards.slice(0, -1));
      requestAnimationFrame(() => requestAnimationFrame(() => layout()));
    };

    $("[data-stack-next]").addEventListener("click", () => flingTop(1));
    $("[data-stack-prev]").addEventListener("click", bringBack);

    let startX = 0, dx = 0, lastX = 0, lastT = 0, vx = 0, dragging = null;
    stack.addEventListener("pointerdown", (e) => {
      if (e.target.closest(".quote") !== cards[0]) return;
      dragging = cards[0];
      startX = lastX = e.clientX;
      lastT = performance.now();
      dx = vx = 0;
      dragging.setPointerCapture(e.pointerId);
      dragging.style.transition = "none";
    });
    stack.addEventListener("pointermove", (e) => {
      if (!dragging) return;
      const now = performance.now();
      vx = (e.clientX - lastX) / Math.max(1, now - lastT);
      lastX = e.clientX;
      lastT = now;
      dx = e.clientX - startX;
      dragging.style.transform = `translate3d(${dx}px, ${Math.abs(dx) * -0.04}px, 0) rotate(${dx * 0.05}deg)`;
    });
    const release = () => {
      if (!dragging) return;
      const flick = Math.abs(vx) > 0.6;
      if (Math.abs(dx) > 110 || flick) flingTop(Math.sign(dx || vx) || 1);
      else layout();
      dragging = null;
    };
    stack.addEventListener("pointerup", release);
    stack.addEventListener("pointercancel", release);
  }

  /* ---------- Preguntas frecuentes: apertura con altura animada ---------- */
  $$(".qa").forEach((qa) => {
    const summary = $("summary", qa);
    summary.addEventListener("click", (e) => {
      if (reduceMotion || !qa.animate) return;
      e.preventDefault();
      if (qa.dataset.busy) return;
      const closing = qa.open;
      if (!closing) {
        $$(`.qa[name="${qa.getAttribute("name")}"][open]`).forEach((other) => other !== qa && toggleQa(other, true));
      }
      toggleQa(qa, closing);
    });
  });
  function toggleQa(qa, closing) {
    const summary = $("summary", qa);
    const startH = qa.offsetHeight;
    qa.dataset.busy = "1";
    if (!closing) qa.open = true;
    const endH = closing ? summary.offsetHeight : qa.scrollHeight;
    const anim = qa.animate({ height: [`${startH}px`, `${endH}px`] }, { duration: 450, easing: "cubic-bezier(.16,1,.3,1)" });
    anim.onfinish = () => {
      if (closing) qa.open = false;
      delete qa.dataset.busy;
    };
  }

  /* ---------- Formulario ---------- */
  const form = $("[data-form]");
  const status = $("[data-form-status]");
  const success = $("[data-success]");
  const pulsePath = $("[data-pulse]");
  const pulseWrap = pulsePath.closest(".pulse");
  const pulseLabel = $("[data-pulse-label]");
  const pulseLen = prepStroke(pulsePath);
  const touched = new Set();

  const RULES = {
    ruta: () => !!form.querySelector('input[name="ruta"]:checked'),
    nombre: (v) => v.trim().length >= 2,
    apellidos: (v) => v.trim().length >= 2,
    correo: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()),
    telefono: (v) => v.replace(/\D/g, "").length >= 10,
    generacion: (v) => !!v,
  };
  const PROGRESS_KEYS = Object.keys(RULES);

  const fieldValue = (name) => (name === "ruta" ? "" : form.elements[name].value);
  const fieldBox = (name) => (name === "ruta" ? $("fieldset", form) : form.elements[name].closest(".field"));

  function check(name, showErrors) {
    const ok = RULES[name](fieldValue(name));
    const box = fieldBox(name);
    const err = $(`#err-${name === "telefono" ? "tel" : name === "generacion" ? "gen" : name}`);
    box.classList.toggle("is-valid", ok);
    const show = !ok && (showErrors || touched.has(name));
    box.classList.toggle("is-invalid", show);
    if (err) err.hidden = !show;
    const input = name === "ruta" ? null : form.elements[name];
    if (input) input.setAttribute("aria-invalid", String(show));
    return ok;
  }

  function updateProgress() {
    const done = PROGRESS_KEYS.filter((k) => RULES[k](fieldValue(k))).length;
    pulsePath.style.strokeDashoffset = `${pulseLen * (1 - done / PROGRESS_KEYS.length)}`;
    pulseWrap.classList.toggle("is-complete", done === PROGRESS_KEYS.length);
    if (done === PROGRESS_KEYS.length) say("listo");
    pulseLabel.textContent = done === PROGRESS_KEYS.length ? "Tu solicitud está lista para enviarse" : `Tu solicitud: ${done} de ${PROGRESS_KEYS.length} datos`;
  }

  form.addEventListener("input", (e) => {
    const name = e.target.name;
    if (name === "ruta") routeTouched = true;
    if (RULES[name]) check(name, false);
    if (name === "privacidad") $("#err-privacidad").hidden = e.target.checked;
    updateProgress();
  });
  form.addEventListener("focusout", (e) => {
    const name = e.target.name;
    if (!RULES[name] || name === "ruta") return;
    if (e.target.value) touched.add(name);
    check(name, false);
  });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    status.textContent = "";
    const results = PROGRESS_KEYS.map((k) => [k, check(k, true)]);
    const privacy = form.elements.privacidad.checked;
    $("#err-privacidad").hidden = privacy;
    const firstBad = results.find(([, ok]) => !ok);
    if (firstBad || !privacy) {
      status.textContent = "Revisa los campos marcados.";
      const focusEl = firstBad
        ? firstBad[0] === "ruta" ? form.querySelector('input[name="ruta"]') : form.elements[firstBad[0]]
        : form.elements.privacidad;
      focusEl.focus({ preventScroll: true });
      if (lenis) lenis.scrollTo(focusEl, { offset: -140 });
      else focusEl.scrollIntoView({ block: "center" });
      if (motion) gsap.fromTo(".btn--submit", { x: -6 }, { x: 0, duration: 0.5, ease: "elastic.out(1, .3)" });
      return;
    }

    const btn = $(".btn--submit", form);
    btn.classList.add("is-loading");
    btn.setAttribute("aria-busy", "true");
    const data = Object.fromEntries(new FormData(form));

    try {
      const endpoint = form.dataset.endpoint;
      if (endpoint) {
        const res = await fetch(endpoint, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
        if (!res.ok) throw new Error(String(res.status));
      } else {
        // Sin servicio conectado todavía: simulamos el envío.
        await new Promise((r) => setTimeout(r, 1200));
      }
      showSuccess(data.nombre);
    } catch (err) {
      status.textContent = "No pudimos enviar tu solicitud. Intenta de nuevo o escríbenos por WhatsApp.";
    } finally {
      btn.classList.remove("is-loading");
      btn.removeAttribute("aria-busy");
    }
  });

  function showSuccess(name) {
    say("enviado");
    $("[data-success-name]").textContent = name ? `, ${name.trim().split(/\s+/)[0]}` : "";
    const beat = $(".success__beat", success);
    const swap = () => {
      form.hidden = true;
      success.hidden = false;
      success.focus({ preventScroll: true });
      if (motion) {
        prepStroke(beat);
        gsap.to(beat, { strokeDashoffset: 0, duration: 1.4, ease: "power2.inOut" });
        gsap.fromTo($$(":scope > :not(svg)", success), { opacity: 0, y: 16 }, { opacity: 1, y: 0, stagger: 0.08, duration: 0.8, delay: 0.5, ease: "expo.out" });
      }
    };
    if (motion) gsap.to(form, { opacity: 0, y: -10, duration: 0.35, ease: "power2.in", onComplete: () => { gsap.set(form, { clearProps: "all" }); swap(); } });
    else swap();
  }

  $("[data-reset]").addEventListener("click", () => {
    form.reset();
    touched.clear();
    routeTouched = false;
    $$(".is-valid, .is-invalid", form).forEach((n) => n.classList.remove("is-valid", "is-invalid"));
    $$(".field__error", form).forEach((n) => (n.hidden = true));
    success.hidden = true;
    form.hidden = false;
    if (currentTrack) {
      const radio = $(`input[name="ruta"][value="${currentTrack}"]`);
      if (radio) radio.checked = true;
    }
    updateProgress();
    form.elements.nombre.focus();
  });

  /* ---------- Barra fija en móvil ---------- */
  const mbar = $("[data-mbar]");
  const vis = { hero: true, apply: false };
  const syncBar = () => {
    const show = !vis.hero && !vis.apply;
    mbar.classList.toggle("is-visible", show);
    if (guide) guide.classList.toggle("is-lifted", show);
  };
  new IntersectionObserver(([e]) => { vis.hero = e.isIntersecting; syncBar(); }).observe(hero);
  new IntersectionObserver(([e]) => { vis.apply = e.isIntersecting; syncBar(); }, { threshold: 0.05 }).observe($("#solicitud"));

  /* ---------- Arranque ---------- */
  renderTrack("licenciatura", false);
  updateProgress();
  if (motion) window.addEventListener("load", () => ScrollTrigger.refresh());
})();
