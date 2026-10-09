// Records the entrance animation to a .webm (convert to .mp4 with ffmpeg afterwards).
// Usage: node record.js <poster.html> <out-dir> [seconds]
const { chromium } = require('playwright');
const [,, html, outDir, secs] = process.argv;
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 1800, height: 2700 }, reducedMotion: 'no-preference',
    recordVideo: { dir: outDir, size: { width: 1080, height: 1620 } } });
  const p = await ctx.newPage();
  await p.goto('file://' + html);
  await p.waitForTimeout(Number(secs || 7) * 1000);
  await ctx.close(); await b.close();
})();
