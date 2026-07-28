# Universidad Westhill — Sitio web (UW WEB 2026)

Versión mejorada y lista para desarrollo del sitio institucional de la
**Universidad Westhill**, a partir del diseño de Canva *"UW-WEB 2026"*.

El objetivo de este repositorio es entregar una **base sólida, limpia y
documentada** para que un programador continúe el desarrollo: HTML semántico,
un sistema de diseño en CSS con los **colores institucionales** centralizados,
y un JavaScript sin dependencias que resuelve las interacciones pedidas en el
diseño (menú sticky, contadores animados, carruseles, aparición al hacer
scroll, etc.).

> **Contenido respetado.** Todos los textos, datos de contacto, programas
> académicos, becas, convenios y avisos provienen del diseño original y **no
> se alteró la información**. Solo se reorganizó y mejoró la presentación.

---

## 🎨 Colores institucionales

Están centralizados como variables CSS en `assets/css/styles.css` (`:root`).
Cámbialos **solo ahí** para ajustar todo el sitio de una vez.

| Token             | Valor      | Uso                                   |
|-------------------|------------|---------------------------------------|
| `--uw-blue`       | `#276092`  | Azul Westhill (marca base)            |
| `--uw-blue-600`   | `#1a4676`  | Azul medio                            |
| `--uw-blue-700`   | `#0f2a4c`  | Azul oscuro                           |
| `--uw-navy`       | `#0a1e3a`  | Azul marino profundo (fondos, header) |
| `--uw-blue-mid`   | `#2c619b`  | Azul medio (degradados)               |
| `--uw-blue-light` | `#8fb3d4`  | Azul claro (texto secundario)         |
| `--uw-blue-pale`  | `#cdddec`  | Azul muy claro (texto de apoyo)       |
| `--uw-gold`       | `#C9A227`  | Dorado institucional (base)           |
| `--uw-gold-bright`| `#f2c94c`  | Dorado brillante (resaltes)           |
| `--uw-gold-pale`  | `#fbe7a1`  | Dorado claro (degradados)             |
| `--uw-gold-warm`  | `#e8b84b`  | Dorado cálido (detalles)              |
| `--uw-green`      | `#28b060`  | Verde (detalles / filo de la "ola")   |

Tipografía editorial (estilo Ivy League): **Fraunces** (serif de display para
títulos) + **Inter** (texto e interfaz), cargadas desde Google Fonts. Si no
cargan, el respaldo es Georgia (serif) y la fuente del sistema.

### El encabezado con la "ola"
El header es una franja azul marino con el **logo al centro** y la navegación
repartida a los lados; en el borde inferior baja una **ola** (SVG) con filo
verde y dorado, recreada con los colores institucionales. El logo se coloca en
`assets/img/logo-westhill.png` (ver `assets/img/LEEME-logo.txt`).

---

## 📁 Estructura

```
/
├── index.html                 Portada
├── nosotros.html              Historia, misión, visión, filosofía, acreditaciones
├── oferta-academica.html      Licenciaturas, maestrías, especialidades, diplomados
├── programa.html              Plantilla de ficha de programa (ej. Arq. de Interiores)
├── medicina.html              Facultad de Medicina + Premedical + Experiencia Westhill
├── becas.html                 Becas WES, Vinculación y programa de referidos
├── biblioteca.html            Biblioteca + acceso a recursos
├── estudiantes.html           Servicios: bienestar, psicología, buzón, trámites, egresados
├── westhill-well.html         Programa de bienestar integral
├── convenios.html             Convenios escolares y con empresas
├── noticiero.html             Noticiero West (noticias y avisos)
├── reglamentos.html           Reglamentos y normativas
├── vestigia.html              Revista Vestigia
├── solicita-informacion.html  Formulario de contacto/admisiones
├── assets/
│   ├── css/styles.css         Sistema de diseño (tokens, componentes, responsive)
│   ├── js/main.js             Header/footer compartidos + interacciones
│   └── img/                   (coloca aquí las imágenes finales)
└── README.md
```

---

## 🧩 Cómo funciona

### Header y footer compartidos (una sola fuente de la verdad)
No se repiten en cada archivo. Cada página incluye:

```html
<div data-uw-header></div>
...
<div data-uw-footer></div>
<script src="assets/js/main.js"></script>
```

`main.js` los inyecta desde `UW.renderHeader` / `UW.renderFooter`. Para
**editar el menú o el pie de página, cambia el arreglo `NAV` o las plantillas
en `assets/js/main.js` una sola vez** y se refleja en todo el sitio.

El enlace activo del menú se marca con el atributo `data-page` en el `<body>`
(`inicio`, `nosotros`, `oferta`, `estudiantes`, `mas`).

### Interacciones incluidas (notas del diseño resueltas)
- **Menú sticky** que acompaña el scroll y proyecta sombra al bajar.
- **Menú móvil** accesible (hamburguesa) con submenús desplegables.
- **Contadores animados** — los números "suben" al entrar en pantalla
  (`data-count`, `data-suffix`).
- **Aparición al hacer scroll** — bloques que se deslizan al entrar
  (`data-reveal`, `data-reveal="left|right"`, `data-reveal-delay="1|2|3"`).
- **Carruseles** horizontales con scroll-snap y botones (`data-carousel`).
- **Hover que agranda imágenes** (`.hover-grow`).
- **Acordeones** (`.accordion`).
- **Validación de formularios** (`form[data-validate]`), respetando
  `prefers-reduced-motion`.

---

## 🧱 Componentes disponibles (en `styles.css`)

Botones (`.btn`, `.btn--gold`, `.btn--ghost`, `.btn--light`, `.btn--lg`),
tarjetas (`.card`, `.program-card`), listas de chips (`.chip-list`),
listas con check (`.check-list`), formularios (`.field`, `.form-card`),
héroes (`.hero`, `.page-hero`), franjas de estadísticas (`.stats`),
franja de acreditaciones (`.logo-strip`), testimonios (`.quote`),
bloques imagen+texto (`.split`), personas/docentes (`.person`),
acordeón, y el botón flotante de WhatsApp (`.fab-wa`).

---

## 🚀 Cómo verlo en local

Es un sitio estático; basta abrir `index.html`. Para evitar restricciones del
navegador con `file://`, sirve la carpeta con un servidor local:

```bash
# Python
python3 -m http.server 8000
# o Node
npx serve .
```

Luego abre <http://localhost:8000>.

---

## ✅ Pendientes para el programador

1. **Imágenes.** Los bloques con fondo gris (`.card__media`, `.split__media`,
   `.program-card`, `.person__photo`) son marcadores de posición. Coloca las
   imágenes finales en `assets/img/` y referéncialas por `background-image`
   o `<img>`.
2. **Formularios.** `main.js → UW.initForms` valida en el front pero no envía.
   Conecta el `submit` a tu backend / servicio de correo / CRM de admisiones.
3. **Enlaces reales.** Varios `href="#"` (biblioteca virtual, ventanilla de
   trámites, brochures, redes sociales, ediciones de Vestigia) esperan la URL
   definitiva.
4. **Mapa.** Sustituye el marcador de ubicación por un embed de Google Maps.
5. **HEX oficiales.** Confirma los colores con el manual de identidad y
   ajústalos en `:root`.
6. **Páginas por replicar.** Usa `programa.html` como plantilla para cada
   licenciatura/posgrado del catálogo.

---

*"Vestigia Nulla Retrorsum" — Nunca retrocedas sobre tus huellas.*
