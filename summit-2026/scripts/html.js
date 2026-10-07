// Programa (tríptico) y flyers del Westhill Medical Leadership Summit 2026: HTML -> PDF/PNG con Chromium.
//   node scripts/html.js
// Todo el contenido sale de datos/programa.json. Si existe datos/fotos_ponentes/<archivo>.jpg (ver README)
// el flyer del ponente la usa; si no, muestra un ícono temático.
const path = require("path");
const fs = require("fs");
const React = require("react");
const ReactDOMServer = require("react-dom/server");
const fa = require("react-icons/fa6");
let chromium;
try { ({ chromium } = require("playwright")); } catch { ({ chromium } = require(path.join(require("child_process").execSync("npm root -g").toString().trim(), "playwright"))); }

const ROOT = path.join(__dirname, "..");
const BUILD = path.join(ROOT, "build");
const DATA = JSON.parse(fs.readFileSync(path.join(ROOT, "datos/programa.json"), "utf8"));
const EV = DATA.evento;
const OUT_PROG = path.join(ROOT, "entregables/02_programa");
const OUT_FLY = path.join(ROOT, "entregables/05_flyers");
for (const d of [BUILD, OUT_PROG, OUT_FLY, path.join(OUT_FLY, "ponentes"), path.join(OUT_FLY, "programa_por_dia"), path.join(OUT_FLY, "general")]) fs.mkdirSync(d, { recursive: true });

const url = (p) => "file://" + path.join(ROOT, p);
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const icon = (name, color = "currentColor", size = "1em") => ReactDOMServer.renderToStaticMarkup(React.createElement(fa[name], { color, size }));
const slug = (s) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^A-Za-z0-9]+/g, "_").replace(/^_|_$/g, "");
const MES = { "21 de octubre": "21", "22 de octubre": "22", "23 de octubre": "23" };

// Ícono decorativo por tema (no forma parte de la información del programa).
const TEMAS = [
  ["Cirugía", "FaUserDoctor"], ["reflujo", "FaPills"], ["urinario", "FaNotesMedical"], ["redes sociales", "FaHashtag"],
  ["después de la carrera", "FaGraduationCap"], ["Imagenología", "FaXRay"], ["Electrofisiología", "FaWaveSquare"],
  ["Leadership", "FaPeopleGroup"], ["Anemias", "FaVial"], ["GLP-1", "FaCapsules"], ["Nutrición", "FaAppleWhole"],
  ["AMIR", "FaBookOpenReader"], ["pediátrico", "FaChild"], ["tamiz neonatal", "FaBaby"], ["Urgencias", "FaTruckMedical"],
  ["Oncología", "FaRibbon"], ["ECG", "FaHeartPulse"], ["Atención Primaria", "FaHospital"], ["IA ", "FaBrain"], ["Mesa redonda", "FaComments"],
];
const temaIcon = (t) => (TEMAS.find(([k]) => t.includes(k)) || [null, "FaStethoscope"])[1];
const tipoIcon = { ceremonia: "FaAward", receso: "FaMugHot", patrocinadores: "FaHandshake" };

const CSS = `
@font-face{font-family:Raleway;font-weight:300;src:url(${url("marca/fuentes/Raleway-300.ttf")})}
@font-face{font-family:Raleway;font-weight:400;src:url(${url("marca/fuentes/Raleway-400.ttf")})}
@font-face{font-family:Raleway;font-weight:500;src:url(${url("marca/fuentes/Raleway-500.ttf")})}
@font-face{font-family:Raleway;font-weight:600;src:url(${url("marca/fuentes/Raleway-600.ttf")})}
@font-face{font-family:Raleway;font-weight:700;src:url(${url("marca/fuentes/Raleway-700.ttf")})}
@font-face{font-family:Raleway;font-weight:800;src:url(${url("marca/fuentes/Raleway-800.ttf")})}
@font-face{font-family:Raleway;font-weight:900;src:url(${url("marca/fuentes/Raleway-900.ttf")})}
:root{--navy:#0E2A47;--blue:#266294;--gold:#F2C94C;--gold2:#E3AC25;--ice:#EDF3FA;--muted:#5B6B7D;--ink:#15243A;--mist:#8FB3D9;--green:#28B060}
*{box-sizing:border-box;margin:0;padding:0}
html,body{font-family:Raleway,sans-serif;color:var(--ink);-webkit-font-smoothing:antialiased;font-variant-numeric:lining-nums}
.hash b{font-weight:800}.hash{font-weight:400;letter-spacing:.02em}
`;

// Ola institucional (azul con filo dorado), en coordenadas de un viewBox 1000 x 100.
const waveSVG = (main = "#266294", edge = "#F2C94C", flip = false) => `<svg viewBox="0 0 1000 100" preserveAspectRatio="none" style="display:block;width:100%;height:100%${flip ? ";transform:scaleY(-1)" : ""}">
  <path d="M0,38 C220,0 520,70 1000,8 L1000,100 L0,100 Z" fill="${edge}"/>
  <path d="M0,52 C240,14 540,84 1000,22 L1000,100 L0,100 Z" fill="${main}"/></svg>`;

const page = (body, css, w, h) => `<!doctype html><html lang="es"><head><meta charset="utf-8"><style>${CSS}
html,body{width:${w};height:${h}} ${css}</style></head><body>${body}</body></html>`;

// ---------------------------------------------------------------- TRÍPTICO
function triptico() {
  const dias = DATA.dias;
  const ponentes = [];
  for (const d of dias) for (const a of d.actividades) if (a.ponente) ponentes.push({ ...a, dia: d });
  const entry = (a) => {
    const special = !a.ponente && a.tipo !== "ponencia";
    return `<div class="e ${special ? "sp" : ""}">
      <div class="t">${a.inicio}–${a.fin}</div>
      <div class="c"><div class="ti">${special ? `<span class="ic">${icon(tipoIcon[a.tipo] || "FaStar")}</span>` : ""}${esc(a.titulo)}</div>
      ${a.ponente ? `<div class="po">${esc(a.ponente)}${a.cargo ? `<span class="ca">${esc(a.cargo)}</span>` : ""}</div>` : ""}</div></div>`;
  };
  const dayPanel = (d, i) => `<section class="panel day">
    <header class="dh"><div class="dn">DÍA ${i + 1}</div><div class="dd">${d.dia}</div><div class="df">${d.fecha}</div></header>
    <div class="list">${d.actividades.map(entry).join("")}
    <div class="e end"><div class="t">${d.fin}</div><div class="c"><div class="ti">Fin de la jornada</div></div></div></div>
  </section>`;

  const exterior = `<div class="sheet">
    <section class="panel spk">
      <h2>Ponentes</h2><div class="bar"></div>
      ${dias.map((d) => `<div class="sd">${d.dia} ${d.fecha}</div><ul>${ponentes.filter((p) => p.dia === d).map((p) => `<li><b>${esc(p.ponente)}</b><span>${esc(p.titulo)}</span></li>`).join("")}</ul>`).join("")}
    </section>
    <section class="panel back">
      <img class="logo" src="${url("marca/logo_westhill_color.png")}">
      <div class="org">Organiza</div>
      <div class="orgn">${EV.organiza}<br>${EV.universidad}</div>
      <div class="info">
        <div class="row"><span class="bi">${icon("FaCalendarDays")}</span><div><b>${EV.fechas}</b></div></div>
        <div class="row"><span class="bi">${icon("FaLocationDot")}</span><div><b>${EV.sede}</b></div></div>
      </div>
      <div class="handle">${EV.redes}</div>
      <div class="wave">${waveSVG()}<div class="hash"><span>#SOMOS<b>WESTHILL</b></span></div></div>
    </section>
    <section class="panel front">
      <div class="photo"><img src="${url("marca/fotos/edificio_principal.jpg")}"><div class="shade"></div>
        <img class="blogo" src="${url("marca/logo_westhill_blanco.png")}">
        <div class="pw">${waveSVG("#FFFFFF", "#F2C94C", false)}</div></div>
      <div class="ft">
        <div class="kick">Programa académico</div>
        <h1>WESTHILL<br>MEDICAL<br>LEADERSHIP<br>SUMMIT <span>2026</span></h1>
        <div class="lema">${esc(EV.lema)}</div>
        <div class="dates"><span>21</span><span>22</span><span>23</span><em>de octubre de 2026</em></div>
      </div>
      <div class="wave">${waveSVG()}<div class="hash"><span>#SOMOS<b>WESTHILL</b></span></div></div>
    </section>
  </div>`;
  const interior = `<div class="sheet inner">${dias.map(dayPanel).join("")}
    <div class="strip"><span>${EV.nombre}</span><span class="dot">•</span><span class="l">${esc(EV.lema)}</span></div></div>`;

  const css = `
  @page{size:297mm 210mm;margin:0}
  .sheet{width:297mm;height:210mm;display:flex;position:relative;overflow:hidden;page-break-after:always;background:#fff}
  .panel{width:99mm;height:210mm;position:relative;overflow:hidden}
  /* ponentes */
  .spk{padding:10mm 8mm 6mm 10mm;background:var(--ice)}
  .spk h2{font-size:19pt;font-weight:800;color:var(--navy);letter-spacing:.01em}
  .bar{width:16mm;height:1.6mm;background:var(--gold);border-radius:1mm;margin:1.8mm 0 2.4mm}
  .sd{font-size:7.2pt;font-weight:800;color:var(--blue);letter-spacing:.14em;text-transform:uppercase;margin:2.6mm 0 1.2mm}
  .spk ul{list-style:none}
  .spk li{font-size:6.9pt;line-height:1.2;margin-bottom:1.15mm;padding-left:3mm;position:relative}
  .spk li:before{content:"";position:absolute;left:0;top:1.3mm;width:1.3mm;height:1.3mm;border-radius:50%;background:var(--gold2)}
  .spk li b{display:block;color:var(--navy);font-weight:700}
  .spk li span{color:var(--muted);font-weight:500}
  /* contraportada */
  .back{display:flex;flex-direction:column;align-items:center;padding:30mm 10mm 0;text-align:center}
  .back .logo{width:62mm}
  .org{margin-top:16mm;font-size:8pt;font-weight:800;letter-spacing:.3em;color:var(--blue);text-transform:uppercase}
  .orgn{margin-top:2.5mm;font-size:13pt;font-weight:700;color:var(--navy);line-height:1.3}
  .info{margin-top:14mm;display:flex;flex-direction:column;gap:5mm;width:100%;padding:0 4mm}
  .row{display:flex;align-items:center;gap:3.5mm;text-align:left;font-size:10pt;color:var(--navy);background:#fff;border:0.3mm solid #DCE6F2;border-radius:3mm;padding:3.4mm 4mm;box-shadow:0 1mm 3mm rgba(14,42,71,.08)}
  .bi{flex:none;width:9mm;height:9mm;border-radius:50%;background:linear-gradient(135deg,#4A93D2,#1F5585);color:#fff;display:flex;align-items:center;justify-content:center;font-size:4mm}
  .handle{margin-top:12mm;background:var(--gold);color:var(--navy);font-weight:800;font-size:11pt;padding:2.6mm 8mm;border-radius:10mm;letter-spacing:.03em}
  .wave{position:absolute;left:0;right:0;bottom:0;height:24mm}
  .wave .hash{position:absolute;right:7mm;bottom:4.5mm;color:#fff;font-size:10pt}
  /* portada */
  .front .photo{position:absolute;left:0;top:0;width:100%;height:92mm;overflow:hidden}
  .front .photo>img:first-child{width:100%;height:100%;object-fit:cover;object-position:50% 38%}
  .shade{position:absolute;inset:0;background:linear-gradient(180deg,rgba(14,42,71,.75) 0%,rgba(14,42,71,.05) 45%,rgba(14,42,71,0) 100%)}
  .blogo{position:absolute;top:8mm;left:50%;transform:translateX(-50%);width:48mm}
  .pw{position:absolute;left:0;right:0;bottom:-0.5mm;height:16mm}
  .ft{position:absolute;top:90mm;left:0;right:0;padding:0 9mm;text-align:center}
  .kick{display:inline-block;font-size:7.5pt;font-weight:800;letter-spacing:.28em;text-transform:uppercase;color:var(--blue)}
  .front h1{margin-top:2.5mm;font-size:24pt;line-height:1.02;font-weight:900;color:var(--navy);letter-spacing:.01em}
  .front h1 span{color:var(--gold2)}
  .lema{margin:4mm auto 0;font-size:8.6pt;line-height:1.35;color:var(--muted);font-weight:600;max-width:76mm}
  .dates{margin-top:5mm;display:flex;justify-content:center;align-items:center;gap:1.6mm;flex-wrap:wrap}
  .dates span{width:10.5mm;height:10.5mm;border-radius:50%;background:var(--navy);color:var(--gold);font-weight:800;font-size:11pt;display:flex;align-items:center;justify-content:center}
  .dates em{font-style:normal;font-weight:700;color:var(--navy);font-size:9.5pt;margin-left:1mm}
  /* interior */
  .inner .panel{padding:0 7mm 0 7mm;border-right:0.3mm dashed #DCE6F2}
  .inner .panel:last-of-type{border-right:none}
  .dh{margin:0 -7mm;padding:8mm 7mm 5mm;background:linear-gradient(135deg,#1C4772,#0B2240);color:#fff;position:relative}
  .dh:after{content:"";position:absolute;left:0;right:0;bottom:0;height:1.2mm;background:var(--gold)}
  .dn{font-size:7.5pt;font-weight:800;letter-spacing:.3em;color:var(--gold)}
  .dd{font-size:20pt;font-weight:800;line-height:1.1;margin-top:1mm}
  .df{font-size:10pt;font-weight:500;color:var(--mist)}
  .list{padding-top:4mm}
  .e{display:flex;gap:2.6mm;padding:2.1mm 0;border-bottom:0.25mm solid #E6EDF6}
  .e .t{flex:none;width:19mm;font-size:8pt;font-weight:800;color:var(--blue);padding-top:.25mm}
  .e .ti{font-size:8.8pt;line-height:1.24;font-weight:600;color:var(--ink)}
  .e .po{margin-top:.8mm;font-size:8pt;line-height:1.2;font-style:italic;color:var(--blue);font-weight:600}
  .e .ca{display:block;font-style:normal;color:var(--muted);font-weight:500;font-size:7.3pt}
  .e.sp{background:#FFF6DC;margin:0.9mm -2.4mm;padding:1.5mm 2.4mm;border-radius:1.6mm;border-bottom:none}
  .e.sp .ti{font-weight:800;color:var(--navy);display:flex;align-items:center;gap:1.6mm}
  .ic{color:var(--gold2);font-size:8pt;display:inline-flex}
  .e.end{background:var(--navy);margin:2mm -2.4mm 0;padding:1.8mm 2.4mm;border-radius:1.6mm;border:none}
  .e.end .t{color:var(--gold)}.e.end .ti{color:#fff;font-weight:800}
  .strip{position:absolute;left:0;right:0;bottom:0;height:8mm;background:var(--navy);color:#fff;font-size:7pt;display:flex;align-items:center;justify-content:center;gap:2mm;font-weight:800;letter-spacing:.06em}
  .strip .l{font-weight:500;letter-spacing:0;color:var(--mist)}.strip .dot{color:var(--gold)}
  `;
  return page(exterior + interior, css, "297mm", "210mm");
}

// ---------------------------------------------------------------- FLYERS
const FLY_CSS = (W, H) => `
  .fl{width:${W}px;height:${H}px;position:relative;overflow:hidden;background:#fff}
  .navybg{background:radial-gradient(120% 70% at 92% 0%,rgba(90,160,225,.45) 0%,rgba(90,160,225,0) 55%),linear-gradient(160deg,#1C4772 0%,#0B2240 70%)}
  .wm{position:absolute;color:rgba(255,255,255,.06)}
  .bw{position:absolute;left:0;right:0;bottom:0}
  .bw .hash{position:absolute;right:56px;bottom:34px;color:#fff;font-size:30px}
  .bw .hd{position:absolute;left:56px;bottom:36px;color:#fff;font-size:24px;font-weight:700;opacity:.92}
  .pill{display:inline-flex;align-items:center;gap:12px;background:var(--gold);color:var(--navy);font-weight:800;border-radius:999px;letter-spacing:.18em;text-transform:uppercase}
`;

function flyerGeneral(W, H) {
  const story = H > 1500;
  const photoH = story ? 820 : 560;
  const body = `<div class="fl">
    <div class="ph" style="height:${photoH}px"><img src="${url("marca/fotos/edificio_principal.jpg")}"><div class="shade"></div>
      <img class="blogo" src="${url("marca/logo_westhill_blanco.png")}">
      <div class="pw">${waveSVG("#FFFFFF", "#F2C94C")}</div></div>
    <div class="ct" style="top:${photoH - 30}px">
      <div class="kick">${EV.organiza} · ${EV.universidad}</div>
      <h1>WESTHILL MEDICAL<br>LEADERSHIP SUMMIT <span>2026</span></h1>
      <div class="lema">${esc(EV.lema)}</div>
      <div class="chips">
        <div class="chip big"><span class="ci">${icon("FaCalendarDays")}</span><div><b>${EV.fechas}</b></div></div>
        <div class="chip"><span class="ci">${icon("FaLocationDot")}</span><div><b>${EV.sede}</b></div></div>
      </div>
    </div>
    <div class="bw" style="height:${story ? 210 : 170}px">${waveSVG()}<div class="hd">${EV.redes}</div><div class="hash">#SOMOS<b>WESTHILL</b></div></div>
  </div>`;
  const css = FLY_CSS(W, H) + `
  .ph{position:absolute;left:0;top:0;width:100%;overflow:hidden}
  .ph>img:first-child{width:100%;height:100%;object-fit:cover;object-position:50% ${story ? 30 : 36}%}
  .shade{position:absolute;inset:0;background:linear-gradient(180deg,rgba(14,42,71,.8) 0%,rgba(14,42,71,.1) 40%,rgba(14,42,71,0) 100%)}
  .blogo{position:absolute;top:${story ? 90 : 50}px;left:50%;transform:translateX(-50%);width:${story ? 380 : 330}px}
  .pw{position:absolute;left:0;right:0;bottom:-2px;height:${story ? 150 : 120}px}
  .ct{position:absolute;left:0;right:0;padding:0 70px;text-align:center}
  .kick{font-size:${story ? 24 : 21}px;font-weight:800;letter-spacing:.2em;text-transform:uppercase;color:var(--blue)}
  h1{margin-top:18px;font-size:${story ? 86 : 74}px;line-height:1.02;font-weight:900;color:var(--navy)}
  h1 span{color:var(--gold2)}
  .lema{margin:24px auto 0;font-size:${story ? 33 : 28}px;line-height:1.35;color:var(--muted);font-weight:600;max-width:900px}
  .chips{margin-top:${story ? 64 : 34}px;display:flex;flex-direction:column;gap:18px;justify-content:center;align-items:center}
  .chip{display:flex;align-items:center;gap:16px;background:#fff;border:2px solid #DCE6F2;border-radius:22px;padding:16px 26px 16px 16px;box-shadow:0 10px 26px rgba(14,42,71,.10);font-size:${story ? 32 : 25}px;color:var(--navy);text-align:left}
  .chip.big{background:var(--navy);border-color:var(--navy);color:#fff}
  .chip.big .ci{background:linear-gradient(135deg,#FBE08A,#E3AC25);color:var(--navy)}
  .ci{flex:none;width:${story ? 64 : 54}px;height:${story ? 64 : 54}px;border-radius:50%;background:linear-gradient(135deg,#4A93D2,#1F5585);color:#fff;display:flex;align-items:center;justify-content:center;font-size:${story ? 28 : 24}px}
  `;
  return page(body, css, W + "px", H + "px");
}

function flyerPonente(d, a, foto) {
  const W = 1080, H = 1350, ic = temaIcon(a.titulo);
  const L = a.titulo.length;
  const ts = L > 95 ? 60 : L > 70 ? 68 : L > 45 ? 78 : L > 25 ? 90 : 108;
  const kicker = a.tipo === "mesa" ? "Actividad destacada" : "Ponencia";
  const body = `<div class="fl navybg">
    <div class="wm" style="right:-90px;top:250px;font-size:600px">${icon(ic)}</div>
    <div class="top"><img src="${url("marca/logo_westhill_blanco.png")}"><div class="ev">WESTHILL MEDICAL<br>LEADERSHIP SUMMIT <b>2026</b></div></div>
    <div class="main">
      <div class="pill" style="font-size:24px;padding:14px 30px">${icon(a.tipo === "mesa" ? "FaComments" : "FaMicrophoneLines")}${kicker}</div>
      <h1 style="font-size:${ts}px">${esc(a.titulo)}</h1>
      <div class="sp">
        ${foto ? `<div class="av"><img src="file://${foto}"></div>` : `<div class="av ic">${icon(ic)}</div>`}
        <div><div class="sk">${a.tipo === "mesa" ? "Participa" : "Ponente"}</div><div class="sn">${esc(a.ponente)}</div>${a.cargo ? `<div class="sc">${esc(a.cargo)}</div>` : ""}</div>
      </div>
    </div>
    <div class="when">
      <div class="dbox"><div class="dnum">${MES[d.fecha]}</div><div class="dmon">OCT</div></div>
      <div class="dt"><div class="dday">${d.dia} ${d.fecha}</div><div class="dtime">${icon("FaClock")} ${a.inicio}–${a.fin}</div></div>
    </div>
    <div class="bw" style="height:190px">${waveSVG("#FFFFFF", "#F2C94C")}<div class="hd" style="color:var(--blue)">${EV.redes}</div><div class="hash" style="color:var(--navy)">#SOMOS<b>WESTHILL</b></div></div>
  </div>`;
  const css = FLY_CSS(W, H) + `
  .top{position:absolute;left:70px;right:70px;top:64px;display:flex;justify-content:space-between;align-items:center}
  .top img{width:270px}
  .ev{color:#fff;text-align:right;font-size:24px;line-height:1.15;font-weight:600;letter-spacing:.06em}.ev b{color:var(--gold);font-weight:900}
  .main{position:absolute;left:70px;right:70px;top:220px;bottom:370px;display:flex;flex-direction:column;justify-content:center;align-items:flex-start}
  h1{margin-top:34px;color:#fff;font-weight:800;line-height:1.08;max-width:930px}
  .sp{margin-top:54px;display:flex;align-items:center;gap:30px}
  .av{flex:none;width:170px;height:170px;border-radius:50%;overflow:hidden;border:6px solid var(--gold);box-shadow:0 12px 30px rgba(0,0,0,.35)}
  .av img{width:100%;height:100%;object-fit:cover}
  .av.ic{display:flex;align-items:center;justify-content:center;font-size:72px;color:var(--navy);background:linear-gradient(135deg,#FBE08A,#E3AC25)}
  .sk{font-size:21px;font-weight:800;letter-spacing:.3em;text-transform:uppercase;color:var(--gold)}
  .sn{margin-top:6px;font-size:${a.ponente.length > 34 ? 38 : 44}px;font-weight:800;color:#fff;line-height:1.12}
  .sc{margin-top:6px;font-size:26px;color:var(--mist);font-weight:500}
  .when{position:absolute;left:70px;bottom:225px;display:flex;align-items:center;gap:26px}
  .dbox{width:128px;height:128px;border-radius:24px;background:#fff;display:flex;flex-direction:column;align-items:center;justify-content:center;box-shadow:0 12px 30px rgba(0,0,0,.3)}
  .dnum{font-size:62px;font-weight:900;color:var(--navy);line-height:1}.dmon{font-size:22px;font-weight:800;letter-spacing:.2em;color:var(--blue)}
  .dday{font-size:36px;font-weight:800;color:#fff}.dtime{margin-top:6px;font-size:32px;font-weight:700;color:var(--gold);display:flex;align-items:center;gap:12px}
  `;
  return page(body, css, W + "px", H + "px");
}

function flyerDia(d, i) {
  const W = 1080, H = 1350, n = d.actividades.length + 1;
  const fs = n > 10 ? 23 : 26, pad = n > 10 ? 11 : 15;
  const rows = d.actividades.map((a) => {
    const special = a.tipo !== "ponencia" && a.tipo !== "mesa";
    return `<div class="r ${special ? "s" : ""}"><div class="h">${a.inicio}–${a.fin}</div><div class="c"><div class="t">${special ? `<span class="i">${icon(tipoIcon[a.tipo] || "FaStar")}</span>` : ""}${esc(a.titulo)}</div>${a.ponente ? `<div class="p">${esc(a.ponente)}</div>` : ""}</div></div>`;
  }).join("") + `<div class="r end"><div class="h">${d.fin}</div><div class="c"><div class="t">Fin de la jornada</div></div></div>`;
  const body = `<div class="fl">
    <div class="hdr navybg"><div class="wm" style="right:-40px;top:-60px;font-size:330px">${icon("FaStethoscope")}</div>
      <img src="${url("marca/logo_westhill_blanco.png")}">
      <div class="k">Programa · Día ${i + 1}</div><div class="d">${d.dia} <span>${d.fecha}</span></div>
      <div class="hw">${waveSVG("#FFFFFF", "#F2C94C")}</div></div>
    <div class="list">${rows}</div>
    <div class="ft"><b>${EV.nombre}</b><span class="hash">#SOMOS<b>WESTHILL</b></span></div>
  </div>`;
  const css = FLY_CSS(W, H) + `
  .hdr{position:absolute;left:0;right:0;top:0;height:310px;padding:44px 64px 0;color:#fff}
  .hdr img{width:230px}
  .k{margin-top:24px;font-size:22px;font-weight:800;letter-spacing:.3em;text-transform:uppercase;color:var(--gold)}
  .d{font-size:60px;font-weight:900;line-height:1.1}.d span{font-weight:500;color:var(--mist)}
  .hw{position:absolute;left:0;right:0;bottom:-2px;height:70px}
  .list{position:absolute;left:56px;right:56px;top:310px;bottom:86px;display:flex;flex-direction:column;justify-content:center}
  .r{display:flex;gap:22px;padding:${pad}px 18px;border-bottom:2px solid #E6EDF6}
  .h{flex:none;width:170px;font-size:${fs - 2}px;font-weight:800;color:var(--blue);padding-top:2px}
  .t{font-size:${fs}px;font-weight:700;line-height:1.2;color:var(--ink)}
  .p{margin-top:4px;font-size:${fs - 3}px;font-weight:600;font-style:italic;color:var(--blue)}
  .r.s{background:#FFF6DC;border-radius:14px;border-bottom:none;margin:3px 0}
  .r.s .t{color:var(--navy);font-weight:800;display:flex;align-items:center;gap:10px}.i{color:var(--gold2);display:inline-flex}
  .r.end{background:var(--navy);border-radius:14px;border:none;margin-top:6px}.r.end .h{color:var(--gold)}.r.end .t{color:#fff;font-weight:800}
  .ft{position:absolute;left:0;right:0;bottom:0;height:86px;background:var(--blue);color:#fff;display:flex;align-items:center;justify-content:space-between;padding:0 56px;font-size:22px;border-top:6px solid var(--gold)}
  .ft .hash{font-size:26px}
  `;
  return page(body, css, W + "px", H + "px");
}

// ---------------------------------------------------------------- RENDER
(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ deviceScaleFactor: 1 });
  const pg = await ctx.newPage();
  const load = async (name, html, vw, vh) => {
    const f = path.join(BUILD, name + ".html");
    fs.writeFileSync(f, html);
    if (vw) await pg.setViewportSize({ width: vw, height: vh });
    await pg.goto("file://" + f, { waitUntil: "networkidle" });
    await pg.evaluate(() => document.fonts.ready);
  };
  const shot = async (name, html, W, H, out) => { await load(name, html, W, H); await pg.screenshot({ path: out, clip: { x: 0, y: 0, width: W, height: H } }); };

  // Tríptico
  await load("triptico", triptico(), 1123, 794);
  await pg.pdf({ path: path.join(OUT_PROG, "Programa_Triptico_WMLS2026.pdf"), width: "297mm", height: "210mm", printBackground: true, preferCSSPageSize: true });
  console.log("tríptico listo");

  // Flyers generales
  await shot("general_post", flyerGeneral(1080, 1350), 1080, 1350, path.join(OUT_FLY, "general", "WMLS2026_General_Post_1080x1350.png"));
  await shot("general_story", flyerGeneral(1080, 1920), 1080, 1920, path.join(OUT_FLY, "general", "WMLS2026_General_Historia_1080x1920.png"));

  // Programa por día
  for (const [i, d] of DATA.dias.entries()) await shot("dia_" + d.id, flyerDia(d, i), 1080, 1350, path.join(OUT_FLY, "programa_por_dia", `WMLS2026_Programa_Dia${i + 1}_${d.dia.normalize("NFD").replace(/[̀-ͯ]/g, "")}.png`));

  // Ponentes
  let n = 0;
  for (const d of DATA.dias) for (const a of d.actividades) {
    if (!a.ponente) continue;
    n++;
    const base = `${String(n).padStart(2, "0")}_${slug(a.ponente)}`;
    const foto = [".jpg", ".jpeg", ".png"].map((e) => path.join(ROOT, "datos/fotos_ponentes", base + e)).find((p) => fs.existsSync(p))
      || [".jpg", ".jpeg", ".png"].map((e) => path.join(ROOT, "datos/fotos_ponentes", slug(a.ponente) + e)).find((p) => fs.existsSync(p));
    await shot("ponente_" + n, flyerPonente(d, a, foto), 1080, 1350, path.join(OUT_FLY, "ponentes", `WMLS2026_${base}.png`));
  }
  console.log(`flyers listos: 2 generales, ${DATA.dias.length} por día, ${n} de ponentes`);
  await browser.close();
})().catch((e) => { console.error(e); process.exit(1); });
