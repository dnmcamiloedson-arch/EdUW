/* =====================================================================
   PERDÓN — motor de la página
   Contenido: config.js · Animación: GSAP + ScrollTrigger · Scroll suave: Lenis
   ===================================================================== */
(function () {
  'use strict';

  var C = window.PERDON || {};
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var punteroFino = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var esMovil = function () { return window.innerWidth < 768; };

  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var crear = function (tag, cls, txt) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (txt != null) e.textContent = txt;
    return e;
  };
  var pad = function (n) { return String(n).padStart(2, '0'); };

  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
  window.scrollTo(0, 0);
  if (reduce) document.documentElement.classList.add('quieto');

  /* ------------------------------------------------------------------
     1. Contenido desde config.js
     ------------------------------------------------------------------ */
  var cancion = C.cancion || {};
  var portada = C.portada || {};
  var recuerdos = (C.recuerdos || []).filter(function (r) { return r && r.foto; });

  document.title = C.ella ? 'Para ' + C.ella : 'Para ti';
  $$('[data-ella]').forEach(function (n) { n.textContent = C.ella || ''; });
  $$('[data-el]').forEach(function (n) { n.textContent = C.el || ''; });
  $$('[data-cancion-titulo]').forEach(function (n) { n.textContent = cancion.titulo || ''; });
  $$('[data-cancion-artista]').forEach(function (n) { n.textContent = cancion.artista || ''; });
  $('[data-portada-sub]').textContent = portada.subtitulo || '';
  $('[data-frase-tira]').textContent = C.fraseTiraPelicula || '';
  $('#anio').textContent = new Date().getFullYear();
  $('#carta-fecha').textContent = new Date().toLocaleDateString('es', { day: 'numeric', month: 'long', year: 'numeric' });

  // Divide un texto en palabras (con máscara opcional para revelar desde abajo)
  function palabras(destino, texto, conMascara) {
    var lista = String(texto || '').split(/\s+/).filter(Boolean);
    lista.forEach(function (w, i) {
      var s = crear('span', 'pal');
      if (conMascara) s.appendChild(crear('span', null, w)); else s.textContent = w;
      destino.appendChild(s);
      if (i < lista.length - 1) destino.appendChild(document.createTextNode(' '));
    });
  }

  // Título del hero: letra por letra dentro de una máscara
  (function () {
    var h = $('[data-portada-titulo]');
    var t = portada.titulo || 'Perdóname';
    h.setAttribute('aria-label', t);
    var mascara = crear('span', 'mascara');
    mascara.setAttribute('aria-hidden', 'true');
    Array.from(t).forEach(function (ch) {
      var l = crear('span', 'letra-h', ch === ' ' ? ' ' : ch);
      mascara.appendChild(l);
    });
    h.appendChild(mascara);
  })();

  // Pregunta final
  var pregunta = $('[data-pregunta]');
  pregunta.textContent = C.pregunta || '';
  pregunta.setAttribute('data-split', '');

  // Encabezados con revelado por palabra
  $$('[data-split]').forEach(function (h) {
    var t = h.textContent;
    h.setAttribute('aria-label', t);
    h.textContent = '';
    palabras(h, t, true);
    $$('.pal', h).forEach(function (p) { p.setAttribute('aria-hidden', 'true'); });
  });

  // Foto con respaldo artístico si el archivo no existe
  function arte(i) {
    var d = crear('div', 'arte');
    d.appendChild(crear('span', null, pad(i + 1)));
    return d;
  }
  function medio(r, i) {
    if (!r) return arte(i);
    var img = new Image();
    img.className = 'foto';
    img.alt = r.momento || '';
    img.decoding = 'async';
    img.addEventListener('error', function () { img.replaceWith(arte(i)); }, { once: true });
    img.src = r.foto;
    return img;
  }

  // Hero: tres fotos sueltas
  var heroFotos = $('#hero-fotos');
  for (var h = 0; h < 3; h++) {
    var r = recuerdos[h];
    var fig = crear('figure', 'foto-suelta');
    fig.style.margin = '0';
    var marco = crear('div', 'marco-img');
    marco.appendChild(medio(r, h));
    fig.appendChild(marco);
    fig.appendChild(crear('figcaption', null, r ? (r.fecha || r.momento || '') : ''));
    heroFotos.appendChild(fig);
  }

  // Cinta en movimiento
  var cinta = $('#cinta');
  (function () {
    var items = (portada.cinta && portada.cinta.length) ? portada.cinta : ['lo siento'];
    var grupo = crear('div', 'cinta__grupo');
    for (var rep = 0; rep < 3; rep++) {
      items.forEach(function (t) {
        grupo.appendChild(crear('span', 'cinta__item', t));
        grupo.appendChild(crear('span', 'cinta__sep'));
      });
    }
    cinta.appendChild(grupo);
    cinta.appendChild(grupo.cloneNode(true));
  })();

  // Letra
  var estrofasCont = $('#estrofas');
  var letra = (C.letra || []).filter(function (e) { return e && e.length; });
  letra.forEach(function (lineas) {
    var p = crear('p', 'estrofa');
    lineas.forEach(function (l) {
      var s = crear('span', 'linea');
      palabras(s, l, false);
      p.appendChild(s);
    });
    estrofasCont.appendChild(p);
  });
  $('#estrofa-total').textContent = pad(letra.length);
  if (!letra.length) $('#letra').remove();

  // Escenas de fotos
  var escenas = $('#escenas');
  recuerdos.forEach(function (r, i) {
    var sc = crear('div', 'escena');
    var marco = crear('div', 'escena__marco');
    var capa = crear('div', 'capa');
    capa.appendChild(medio(r, i));
    marco.appendChild(capa);
    sc.appendChild(marco);
    sc.appendChild(crear('div', 'escena__velo'));
    sc.appendChild(crear('p', 'mono escena__num', 'Foto ' + pad(i + 1) + ' / ' + pad(recuerdos.length)));

    var texto = crear('div', 'escena__texto');
    var frase = crear('p', 'escena__frase');
    var tieneFrase = r.frase && r.frase.trim();
    palabras(frase, tieneFrase ? r.frase : (r.momento || ''), true);
    texto.appendChild(frase);
    var pie = crear('div', 'escena__pie');
    if (tieneFrase && r.momento) pie.appendChild(crear('p', 'escena__momento', r.momento));
    if (r.fecha) pie.appendChild(crear('span', 'escena__fecha', r.fecha));
    texto.appendChild(pie);
    sc.appendChild(texto);
    escenas.appendChild(sc);
  });

  // Tiras de película
  (function () {
    var f1 = $('#fila-1'), f2 = $('#fila-2');
    if (!recuerdos.length) { $('#pelicula').remove(); $('#momentos').remove(); return; }
    var total = Math.max(10, recuerdos.length);
    for (var k = 0; k < total; k++) {
      [f1, f2].forEach(function (fila, n) {
        var idx = n === 0 ? k % recuerdos.length : (recuerdos.length - 1 - (k % recuerdos.length));
        var c = crear('div', 'cuadro');
        c.appendChild(medio(recuerdos[idx], idx));
        c.appendChild(crear('span', 'cuadro__n', pad(k + 1) + (n === 0 ? 'A' : 'B')));
        fila.appendChild(c);
      });
    }
  })();

  // Confesiones
  var lista = $('#lista-confesion');
  (C.confesiones || []).forEach(function (c) {
    var li = crear('li', 'confesion__item');
    li.appendChild(crear('p', 'confesion__num'));
    li.appendChild(crear('h3', null, c.titulo));
    li.appendChild(crear('p', null, c.texto));
    lista.appendChild(li);
  });

  // Promesas
  var pila = $('#pila');
  var promesas = C.promesas || [];
  promesas.forEach(function (p, i) {
    var card = crear('article', 'promesa');
    card.appendChild(crear('div', 'promesa__num', pad(i + 1)));
    var cuerpo = crear('div');
    cuerpo.appendChild(crear('p', 'mono promesa__etiqueta', 'Promesa ' + pad(i + 1) + ' de ' + pad(promesas.length)));
    cuerpo.appendChild(crear('h3', null, p.titulo));
    cuerpo.appendChild(crear('p', null, p.texto));
    if (i === promesas.length - 1 && C.el) cuerpo.appendChild(crear('p', 'promesa__firma', '— ' + C.el));
    card.appendChild(cuerpo);
    card.appendChild(crear('div', 'promesa__sombra'));
    pila.appendChild(card);
  });

  // Carta
  var cartaCuerpo = $('#carta-cuerpo');
  (C.carta || []).forEach(function (t) {
    var p = crear('p');
    palabras(p, t, false);
    cartaCuerpo.appendChild(p);
  });

  /* ------------------------------------------------------------------
     2. Música (mp3 local o YouTube como respaldo)
     ------------------------------------------------------------------ */
  var audio = $('#musica');
  var disco = $('#disco');
  var estado = $('[data-estado]');
  var fuente = null;          // 'mp3' | 'yt' | null
  var yt = null, ytListo = false, quiereSonar = false, sonando = false;

  function idYoutube(u) {
    if (!u) return '';
    var m = String(u).match(/(?:v=|youtu\.be\/|embed\/|shorts\/)([\w-]{11})/);
    if (m) return m[1];
    return /^[\w-]{11}$/.test(u) ? u : '';
  }
  var ytId = idYoutube(cancion.youtube);

  function setEstado(on) {
    sonando = on;
    disco.classList.toggle('is-playing', on);
    estado.textContent = on ? 'sonando' : 'pausa';
  }
  function cargarYoutube() {
    if (!ytId) { fuente = null; actualizarDisco(); return; }
    fuente = 'yt';
    if (window.YT && window.YT.Player) return crearYoutube();
    window.onYouTubeIframeAPIReady = crearYoutube;
    var s = document.createElement('script');
    s.src = 'https://www.youtube.com/iframe_api';
    document.head.appendChild(s);
  }
  function crearYoutube() {
    yt = new window.YT.Player('yt-player', {
      width: 200, height: 200, videoId: ytId,
      playerVars: { start: cancion.inicioSegundos | 0, playsinline: 1, controls: 0, loop: 1, playlist: ytId, rel: 0 },
      events: {
        onReady: function () { ytListo = true; yt.setVolume(80); if (quiereSonar) yt.playVideo(); },
        onStateChange: function (e) { setEstado(e.data === 1); }
      }
    });
  }
  function reproducir() {
    quiereSonar = true;
    if (fuente === 'mp3') {
      audio.volume = 0;
      var p = audio.play();
      if (p && p.then) {
        p.then(function () { setEstado(true); gsap.to(audio, { volume: 0.85, duration: 3, ease: 'power1.out' }); })
         .catch(function () { setEstado(false); });
      }
    } else if (fuente === 'yt' && ytListo) {
      yt.playVideo();
    }
  }
  function pausar() {
    quiereSonar = false;
    if (fuente === 'mp3') {
      gsap.to(audio, { volume: 0, duration: 0.5, onComplete: function () { audio.pause(); } });
      setEstado(false);
    } else if (fuente === 'yt' && ytListo) {
      yt.pauseVideo();
    }
  }
  function actualizarDisco() {
    var visible = !document.body.classList.contains('is-locked') && fuente !== null;
    disco.classList.toggle('is-visible', visible);
  }
  if (cancion.mp3) {
    fuente = 'mp3';
    audio.addEventListener('error', cargarYoutube, { once: true });
    audio.addEventListener('loadedmetadata', function () {
      if (cancion.inicioSegundos) audio.currentTime = cancion.inicioSegundos;
    }, { once: true });
    audio.src = cancion.mp3;
  } else {
    cargarYoutube();
  }
  disco.addEventListener('click', function () { (sonando || quiereSonar) ? pausar() : reproducir(); });

  /* ------------------------------------------------------------------
     3. Sin GSAP (o movimiento reducido): versión estática y digna
     ------------------------------------------------------------------ */
  var hayGsap = !!(window.gsap && window.ScrollTrigger);
  var portal = $('#portal');

  if (!hayGsap) {
    $('#entrar').addEventListener('click', function () {
      reproducir();
      portal.remove();
      document.body.classList.remove('is-locked');
      document.documentElement.classList.add('quieto');
      actualizarDisco();
    }, { once: true });
    return;
  }

  gsap.registerPlugin(ScrollTrigger);
  ScrollTrigger.config({ ignoreMobileResize: true });

  /* ------------------------------------------------------------------
     4. Scroll suave
     ------------------------------------------------------------------ */
  var lenis = null;
  var velocidad = 0, direccion = 1;
  if (!reduce && window.Lenis) {
    lenis = new window.Lenis({ lerp: 0.085, wheelMultiplier: 0.9 });
    lenis.on('scroll', function (e) {
      ScrollTrigger.update();
      velocidad = e.velocity || 0;
      if (e.direction) direccion = e.direction;
    });
    gsap.ticker.add(function (t) { lenis.raf(t * 1000); });
    gsap.ticker.lagSmoothing(0);
    lenis.stop();
  }

  /* ------------------------------------------------------------------
     5. Portal: sello + telón
     ------------------------------------------------------------------ */
  var heroLetras = $$('.hero__titulo .letra-h');
  var heroFigs = $$('.foto-suelta');
  if (!reduce) {
    gsap.set(heroLetras, { yPercent: 115, rotate: 6 });
    gsap.set(heroFigs, { yPercent: 40, opacity: 0 });
    gsap.set(['.hero__kicker', '.hero__sub', '.hero__scroll'], { opacity: 0, y: 24 });
    gsap.set('.cinta', { yPercent: 160 });
  }

  function introHero() {
    var tl = gsap.timeline();
    if (reduce) return tl;
    tl.to(heroLetras, { yPercent: 0, rotate: 0, duration: 1.5, ease: 'expo.out', stagger: 0.045 }, 0)
      .to('.hero__kicker', { opacity: 1, y: 0, duration: 1, ease: 'power3.out' }, 0.2)
      .to(heroFigs, { yPercent: 0, opacity: 1, duration: 1.6, ease: 'expo.out', stagger: 0.12 }, 0.25)
      .to('.hero__sub', { opacity: 1, y: 0, duration: 1, ease: 'power3.out' }, 0.7)
      .to('.cinta', { yPercent: 0, duration: 1.4, ease: 'expo.out' }, 0.6)
      .to('.hero__scroll', { opacity: 1, y: 0, duration: 1, ease: 'power3.out' }, 1.1);
    return tl;
  }

  function desbloquear() {
    document.body.classList.remove('is-locked');
    actualizarDisco();
    if (lenis) lenis.start();
    ScrollTrigger.refresh();
  }

  $('#entrar').addEventListener('click', function () {
    reproducir();
    if (reduce) {
      gsap.to(portal, { opacity: 0, duration: 0.4, onComplete: function () { portal.remove(); } });
      desbloquear();
      return;
    }
    var tl = gsap.timeline({ onComplete: function () { portal.remove(); } });
    tl.to('.sello', { scale: 1.12, rotate: -18, duration: 0.3, ease: 'power2.out' })
      .to('.sello', { scale: 0.2, opacity: 0, duration: 0.45, ease: 'power3.in' })
      .to(['.portal__meta', '.portal__para', '.portal__nota'], { opacity: 0, y: -16, duration: 0.45, stagger: 0.04, ease: 'power2.in' }, '<')
      .add(desbloquear)
      .to('.telon--izq', { xPercent: -101, duration: 1.7, ease: 'expo.inOut' }, '-=0.05')
      .to('.telon--der', { xPercent: 101, duration: 1.7, ease: 'expo.inOut' }, '<')
      .add(introHero(), '-=1.05');
  }, { once: true });

  /* ------------------------------------------------------------------
     6. Cinta que responde a la velocidad del scroll
     ------------------------------------------------------------------ */
  (function () {
    var x = 0;
    gsap.ticker.add(function (t, dt) {
      var mitad = cinta.scrollWidth / 2;
      if (!mitad) return;
      var v = reduce ? 0.02 : 0.045 + Math.min(Math.abs(velocidad), 60) * 0.012;
      x -= v * dt * direccion;
      if (x <= -mitad) x += mitad;
      if (x > 0) x -= mitad;
      cinta.style.transform = 'translate3d(' + x.toFixed(2) + 'px,0,0)';
    });
  })();

  /* ------------------------------------------------------------------
     7. Animaciones de scroll
     ------------------------------------------------------------------ */
  // Barra de progreso
  var barra = $('.progreso span');
  ScrollTrigger.create({ start: 0, end: 'max', onUpdate: function (s) { gsap.set(barra, { scaleX: s.progress }); } });

  if (!reduce) {
    // --- Hero parallax por capas
    var tlHero = gsap.timeline({ scrollTrigger: { trigger: '#hero', start: 'top top', end: 'bottom top', scrub: true } });
    tlHero.to('.hero__titulo', { yPercent: -55, ease: 'none' }, 0)
      .to('.hero__texto', { opacity: 0.15, ease: 'none' }, 0)
      .to('.cinta', { rotate: -5, ease: 'none' }, 0);
    heroFigs.forEach(function (f, i) {
      tlHero.to(f, { y: -(140 + i * 110), rotation: (i % 2 ? -1 : 1) * (6 + i * 3), ease: 'none' }, 0);
    });

    // --- Encabezados palabra por palabra
    $$('.cabeza__titulo[data-split]').forEach(function (hd) {
      gsap.from($$('.pal > span', hd), {
        yPercent: 110, duration: 1.2, ease: 'expo.out', stagger: 0.05,
        scrollTrigger: { trigger: hd, start: 'top 82%' }
      });
      gsap.from(hd.parentNode.querySelector('.cabeza__num'), {
        opacity: 0, x: -20, duration: 1, ease: 'power3.out',
        scrollTrigger: { trigger: hd, start: 'top 82%' }
      });
    });

    // --- Letra: estrofas fijas, palabras que se encienden
    var est = $$('.estrofa');
    if (est.length) {
      var contador = $('#estrofa-actual');
      var barraLetra = $('#letra-barra');
      var marcas = [];
      var tlLetra = gsap.timeline({
        scrollTrigger: {
          trigger: '#letra', start: 'top top',
          end: function () { return '+=' + Math.round(est.length * window.innerHeight * 1.25); },
          pin: true, scrub: 0.7, invalidateOnRefresh: true,
          onUpdate: function (s) {
            gsap.set(barraLetra, esMovil() ? { scaleX: s.progress, scaleY: 1 } : { scaleY: s.progress, scaleX: 1 });
            var t = tlLetra.time(), idx = 0;
            for (var i = 0; i < marcas.length; i++) if (t >= marcas[i]) idx = i;
            var txt = pad(idx + 1);
            if (contador.textContent !== txt) contador.textContent = txt;
          }
        }
      });
      est.forEach(function (e, i) {
        var pals = $$('.pal', e);
        marcas.push(tlLetra.duration());
        tlLetra.set(e, { visibility: 'visible' })
          .fromTo(e, { opacity: 0, y: 70 }, { opacity: 1, y: 0, duration: 0.6, ease: 'power2.out' })
          .fromTo(pals, { opacity: 0.14, y: 8 }, { opacity: 1, y: 0, duration: 0.35, stagger: 0.09, ease: 'power1.out' }, '-=0.2')
          .to({}, { duration: 0.6 });
        if (i < est.length - 1) {
          tlLetra.to(e, { opacity: 0, y: -70, duration: 0.5, ease: 'power2.in' })
            .set(e, { visibility: 'hidden' });
        }
      });
    }

    // --- Escenas: la foto se abre a pantalla completa
    $$('.escena').forEach(function (sc) {
      var marco = $('.escena__marco', sc);
      var capa = $('.capa', sc);
      var fr = $$('.escena__frase .pal > span', sc);
      gsap.set(fr, { yPercent: 105 });
      var tl = gsap.timeline({
        scrollTrigger: { trigger: sc, start: 'top top', end: '+=170%', pin: true, scrub: 0.8, invalidateOnRefresh: true }
      });
      tl.fromTo(marco,
          { clipPath: function () { return esMovil() ? 'inset(22% 10% 22% 10%)' : 'inset(20% 32% 20% 32%)'; } },
          { clipPath: 'inset(0% 0% 0% 0%)', ease: 'none', duration: 1 }, 0)
        .fromTo(capa, { scale: 1.35 }, { scale: 1, ease: 'none', duration: 1.25 }, 0)
        .to($('.escena__velo', sc), { opacity: 1, duration: 0.5 }, 0.5)
        .to($('.escena__num', sc), { opacity: 1, duration: 0.3 }, 0.65)
        .to(fr, { yPercent: 0, duration: 0.5, stagger: 0.05, ease: 'power3.out' }, 0.8)
        .to($('.escena__pie', sc), { opacity: 1, duration: 0.4 }, 1.1)
        .to({}, { duration: 0.5 });
    });

    // --- Tiras de película en direcciones opuestas
    $$('.pelicula__tira').forEach(function (t) {
      var fila = t.firstElementChild;
      var dir = Number(t.getAttribute('data-dir'));
      var recorrido = function () { return Math.max(0, fila.scrollWidth - window.innerWidth); };
      gsap.fromTo(fila,
        { x: function () { return dir < 0 ? 0 : -recorrido(); } },
        { x: function () { return dir < 0 ? -recorrido() : 0; }, ease: 'none',
          scrollTrigger: { trigger: '#pelicula', start: 'top bottom', end: 'bottom top', scrub: 0.6, invalidateOnRefresh: true } });
    });
    if ($('.pelicula__frase')) {
      gsap.from('.pelicula__frase', {
        opacity: 0, scale: 0.92, ease: 'none',
        scrollTrigger: { trigger: '.pelicula__frase', start: 'top 85%', end: 'center 55%', scrub: true }
      });
    }

    // --- Confesión: scroll horizontal
    var pista = $('#pista');
    var distancia = function () { return Math.max(0, pista.scrollWidth - window.innerWidth); };
    var horizontal = gsap.to(pista, {
      x: function () { return -distancia(); }, ease: 'none',
      scrollTrigger: {
        trigger: '#confesion', start: 'top top', end: function () { return '+=' + distancia(); },
        pin: true, scrub: 0.8, invalidateOnRefresh: true
      }
    });
    $$('.confesion__item').forEach(function (it) {
      gsap.from(it.children, {
        y: 70, opacity: 0, stagger: 0.08, ease: 'power3.out',
        scrollTrigger: { trigger: it, containerAnimation: horizontal, start: 'left 90%', end: 'left 50%', scrub: true }
      });
    });
    gsap.from('.confesion__intro > *', {
      y: 40, opacity: 0, stagger: 0.1, duration: 1.1, ease: 'power3.out',
      scrollTrigger: { trigger: '#confesion', start: 'top 70%' }
    });

    // --- Promesas: tarjetas que se apilan
    var cards = $$('.promesa');
    cards.forEach(function (c, i) {
      if (i === cards.length - 1) return;
      var sig = cards[i + 1];
      var st = { trigger: sig, start: 'top bottom', end: 'top 15%', scrub: true };
      gsap.to(c, { scale: 0.9, rotation: i % 2 ? 1.6 : -1.6, ease: 'none', scrollTrigger: st });
      gsap.to($('.promesa__sombra', c), { opacity: 0.32, ease: 'none', scrollTrigger: { trigger: sig, start: 'top bottom', end: 'top 15%', scrub: true } });
    });

    // --- Carta: aparece y se escribe con el scroll
    gsap.fromTo('.carta__papel', { rotateX: 16, y: 120, opacity: 0 }, {
      rotateX: 0, y: 0, opacity: 1, duration: 1.6, ease: 'expo.out',
      scrollTrigger: { trigger: '#carta', start: 'top 72%' }
    });
  } else {
    $$('.estrofa').forEach(function (e) { e.style.visibility = 'visible'; });
  }

  // Palabras de la carta (también funciona con movimiento reducido)
  (function () {
    var ps = $$('.carta__cuerpo .pal');
    if (reduce) { ps.forEach(function (p) { p.classList.add('on'); }); return; }
    var encendidas = 0;
    ScrollTrigger.create({
      trigger: '#carta-cuerpo', start: 'top 72%', end: 'bottom 50%',
      onUpdate: function (s) {
        var n = Math.round(s.progress * ps.length);
        if (n === encendidas) return;
        var a = Math.min(n, encendidas), b = Math.max(n, encendidas);
        for (var i = a; i < b; i++) ps[i].classList.toggle('on', i < n);
        encendidas = n;
      }
    });
  })();

  // --- Final: el corazón se dibuja
  var trazo = $('#trazo-corazon');
  var largo = trazo.getTotalLength();
  if (!reduce) {
    gsap.set(trazo, { strokeDasharray: largo, strokeDashoffset: largo });
    gsap.to(trazo, {
      strokeDashoffset: 0, ease: 'none',
      scrollTrigger: { trigger: '#final', start: 'top 80%', end: 'top 10%', scrub: 1 }
    });
    gsap.from($$('.final__pregunta .pal > span'), {
      yPercent: 110, duration: 1.3, ease: 'expo.out', stagger: 0.06,
      scrollTrigger: { trigger: '.final__pregunta', start: 'top 82%' }
    });
    gsap.from('.final__botones .btn', {
      y: 30, opacity: 0, duration: 1, ease: 'power3.out', stagger: 0.1,
      scrollTrigger: { trigger: '.final__botones', start: 'top 90%' }
    });
  }

  /* ------------------------------------------------------------------
     8. Cambios de color entre secciones
     ------------------------------------------------------------------ */
  var temas = {
    oscuro: { '--bg': '#161311', '--fg': '#efe8dd', '--fg-soft': 'rgba(239, 232, 221, 0.62)', '--fg-line': 'rgba(239, 232, 221, 0.16)' },
    claro:  { '--bg': '#efe8dd', '--fg': '#1d1815', '--fg-soft': 'rgba(29, 24, 21, 0.6)',     '--fg-line': 'rgba(29, 24, 21, 0.16)' },
    vino:   { '--bg': '#3e141c', '--fg': '#efe8dd', '--fg-soft': 'rgba(239, 232, 221, 0.66)', '--fg-line': 'rgba(239, 232, 221, 0.2)' }
  };
  function ponerTema(nombre, dur) {
    var t = temas[nombre];
    if (!t) return;
    gsap.to(document.documentElement, Object.assign({ duration: dur == null ? 0.9 : dur, ease: 'power2.out', overwrite: 'auto' }, t));
    var meta = $('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', t['--bg']);
  }
  $$('[data-tema]').forEach(function (s) {
    ScrollTrigger.create({
      trigger: s, start: 'top 50%', end: 'bottom 50%',
      onToggle: function (self) { if (self.isActive) ponerTema(s.getAttribute('data-tema')); }
    });
  });

  ScrollTrigger.sort();
  ScrollTrigger.refresh();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { ScrollTrigger.refresh(); });
  window.addEventListener('load', function () { ScrollTrigger.refresh(); });

  /* ------------------------------------------------------------------
     9. Botones magnéticos (solo con mouse)
     ------------------------------------------------------------------ */
  if (punteroFino && !reduce) {
    $$('.btn').forEach(function (b) {
      var xTo = gsap.quickTo(b, 'x', { duration: 0.7, ease: 'elastic.out(1, 0.45)' });
      var yTo = gsap.quickTo(b, 'y', { duration: 0.7, ease: 'elastic.out(1, 0.45)' });
      b.addEventListener('pointermove', function (e) {
        var r = b.getBoundingClientRect();
        xTo((e.clientX - r.left - r.width / 2) * 0.28);
        yTo((e.clientY - r.top - r.height / 2) * 0.38);
      });
      b.addEventListener('pointerleave', function () { xTo(0); yTo(0); });
    });
  }

  /* ------------------------------------------------------------------
     10. Respuesta
     ------------------------------------------------------------------ */
  var respuesta = $('#respuesta');
  var botones = $('#botones');
  var wa = $('#btn-wa');
  var corazon = $('.final__corazon');

  function responder(texto, mensajeWa, celebrar) {
    gsap.to(botones, {
      opacity: 0, y: -10, duration: 0.4, ease: 'power2.in',
      onComplete: function () { botones.remove(); }
    });
    respuesta.textContent = texto;
    gsap.fromTo(respuesta, { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 1.2, delay: 0.35, ease: 'expo.out' });
    gsap.to(trazo, { strokeDashoffset: 0, duration: 0.6 });
    if (celebrar) {
      gsap.to(trazo, { fillOpacity: 1, duration: 1.2, delay: 0.2, ease: 'power2.out' });
      corazon.classList.add('late');
      papelitos(corazon);
    }
    var num = String(C.whatsapp || '').replace(/\D/g, '');
    if (num) {
      wa.href = 'https://wa.me/' + num + '?text=' + encodeURIComponent(mensajeWa || '');
      wa.hidden = false;
      gsap.fromTo(wa, { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 1, delay: 0.9, ease: 'power3.out' });
    }
    ScrollTrigger.refresh();
  }
  $('#btn-si').addEventListener('click', function () { responder(C.respuestaSi, C.mensajeSi, true); });
  $('#btn-tiempo').addEventListener('click', function () { responder(C.respuestaTiempo, C.mensajeTiempo, false); });

  /* ------------------------------------------------------------------
     11. Papelitos: confeti de papel y corazones pequeños
     ------------------------------------------------------------------ */
  function papelitos(origen) {
    if (reduce) return;
    var cv = $('#papelitos');
    var ctx = cv.getContext('2d');
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var W = window.innerWidth, H = window.innerHeight;
    cv.width = W * dpr; cv.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    var r = origen.getBoundingClientRect();
    var ox = r.left + r.width / 2, oy = r.top + r.height / 2;
    var colores = ['#a3354a', '#efe8dd', '#e5dccd', '#f7f2ea', '#7a2436'];
    var ps = [];
    for (var i = 0; i < 170; i++) {
      var ang = Math.random() * Math.PI * 2;
      var vel = 4 + Math.random() * 11;
      ps.push({
        x: ox, y: oy,
        vx: Math.cos(ang) * vel, vy: Math.sin(ang) * vel - 6,
        w: 6 + Math.random() * 8, h: 4 + Math.random() * 6,
        rot: Math.random() * Math.PI, vr: (Math.random() - 0.5) * 0.3,
        fase: Math.random() * Math.PI * 2,
        color: colores[i % colores.length],
        corazon: i % 7 === 0,
        vida: 1
      });
    }
    function corazonForma(s) {
      ctx.beginPath();
      ctx.moveTo(0, s * 0.35);
      ctx.bezierCurveTo(-s, -s * 0.2, -s * 0.5, -s, 0, -s * 0.45);
      ctx.bezierCurveTo(s * 0.5, -s, s, -s * 0.2, 0, s * 0.35);
      ctx.fill();
    }
    function cuadro() {
      ctx.clearRect(0, 0, W, H);
      var vivos = 0;
      for (var i = 0; i < ps.length; i++) {
        var p = ps[i];
        if (p.vida <= 0) continue;
        vivos++;
        p.vx *= 0.985; p.vy = p.vy * 0.985 + 0.22;
        p.fase += 0.08;
        p.x += p.vx + Math.sin(p.fase) * 0.8;
        p.y += p.vy;
        p.rot += p.vr;
        if (p.y > H + 40) p.vida = 0;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.fillStyle = p.color;
        if (p.corazon) corazonForma(p.w * 0.9);
        else { ctx.scale(1, Math.cos(p.fase)); ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h); }
        ctx.restore();
      }
      if (vivos) requestAnimationFrame(cuadro); else ctx.clearRect(0, 0, W, H);
    }
    requestAnimationFrame(cuadro);
  }
})();
