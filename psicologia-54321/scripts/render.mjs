#!/usr/bin/env node
// Render de todas las versiones con un solo bundle de Remotion.
//   node scripts/render.mjs preview      → out/preview.mp4 (540x960) + contact sheet
//   node scripts/render.mjs final        → 9:16 con y sin subtítulos, 1:1, variante 40 s, SRT
//   node scripts/render.mjs stills 0,2,5 → PNGs sueltos en out/tmp/
// Video mudo desde Remotion + mezcla de audio (scripts/audio.py) muxeada con ffmpeg (AAC).
import { bundle } from "@remotion/bundler";
import { renderMedia, renderStill, selectComposition } from "@remotion/renderer";
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, rmSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const cfg = JSON.parse(readFileSync(path.join(ROOT, "config.json"), "utf8"));
const OUT = path.join(ROOT, "out");
const TMP = path.join(OUT, "tmp");
mkdirSync(TMP, { recursive: true });
const BROWSER = process.env.REMOTION_BROWSER ?? "/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell";
const base = cfg.meta.outputBase;
const sh = (cmd, args) => execFileSync(cmd, args, { stdio: "inherit", cwd: ROOT });

const [mode = "preview", arg] = process.argv.slice(2);

const variantMain = cfg.activeVariant;
const JOBS = {
  preview: [{ variant: variantMain, layout: "9x16", captions: true, scale: 0.5, out: "preview.mp4" }],
  final: [
    { variant: variantMain, layout: "9x16", captions: true, scale: 1, out: `${base}_9x16.mp4` },
    { variant: variantMain, layout: "9x16", captions: false, scale: 1, out: `${base}_9x16_sin_subtitulos.mp4` },
    { variant: variantMain, layout: "1x1", captions: true, scale: 1, out: `${base}_1x1.mp4` },
    { variant: "40", layout: "9x16", captions: true, scale: 1, out: `${base}_40s_9x16.mp4` },
  ],
};

const serveUrl = await bundle({ entryPoint: path.join(ROOT, "src/index.ts"), publicDir: path.join(ROOT, "assets") });

const comp = (props) => selectComposition({ serveUrl, id: "Grounding", inputProps: props, browserExecutable: BROWSER });

if (mode === "stills") {
  const times = (arg ?? "0,2,5,9,13,17,21,25,27.9").split(",").map(Number);
  const props = { variant: process.env.VARIANT ?? variantMain, layout: process.env.LAYOUT ?? "9x16", captions: true };
  const composition = await comp(props);
  for (const s of times) {
    const frame = Math.min(composition.durationInFrames - 1, Math.round(s * composition.fps));
    const output = path.join(TMP, `still_${props.layout}_${props.variant}_${String(s).replace(".", "_")}.png`);
    await renderStill({ composition, serveUrl, output, frame, inputProps: props, browserExecutable: BROWSER, scale: Number(process.env.SCALE ?? 0.5) });
    console.log("still", s, "→", path.relative(ROOT, output));
  }
  process.exit(0);
}

for (const job of JOBS[mode] ?? []) {
  const props = { variant: job.variant, layout: job.layout, captions: job.captions };
  const composition = await comp(props);
  const silent = path.join(TMP, job.out.replace(".mp4", "_silent.mp4"));
  const t0 = Date.now();
  let lastPct = -1;
  await renderMedia({
    composition,
    serveUrl,
    codec: "h264",
    outputLocation: silent,
    inputProps: props,
    browserExecutable: BROWSER,
    scale: job.scale,
    crf: 17,
    pixelFormat: "yuv420p",
    x264Preset: "slow",
    imageFormat: "png", // captura sin pérdida: frames bit a bit idénticos entre renders
    muted: true,
    concurrency: 4,
    onProgress: ({ progress }) => {
      const pct = Math.floor(progress * 10) * 10;
      if (pct !== lastPct) process.stdout.write(`${job.out} ${(lastPct = pct)}%\n`);
    },
  });
  console.log(`\n${job.out}: frames en ${((Date.now() - t0) / 1000).toFixed(0)} s`);

  const mix = path.join(ROOT, "assets/audio", `mix_${job.variant}.wav`);
  if (!existsSync(mix)) throw new Error(`Falta ${mix}: corre python3 scripts/audio.py`);
  const dur = String(composition.durationInFrames / composition.fps);
  sh("ffmpeg", ["-v", "error", "-y", "-i", silent, "-i", mix, "-map", "0:v:0", "-map", "1:a:0", "-c:v", "copy", "-c:a", "aac", "-b:a", "192k", "-ar", "48000", "-t", dur, "-movflags", "+faststart", "-metadata", `title=${cfg.meta.title} · ${cfg.meta.client}`, path.join(OUT, job.out)]);
  rmSync(silent);
}
console.log("listo");
