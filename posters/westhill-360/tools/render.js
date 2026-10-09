// Static export (PNG + optional PDF). Renders with reduced motion so every element is in its final state.
// Usage: node render.js <poster.html> <out.png> [out.pdf] [scale]
const { chromium } = require('playwright');
const [,, html, png, pdf, scale] = process.argv;
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1800, height: 2700 }, deviceScaleFactor: Number(scale || 1), reducedMotion: 'reduce' });
  await p.goto('file://' + html); await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(300);
  await p.screenshot({ path: png, clip: { x: 0, y: 0, width: 1800, height: 2700 } });
  if (pdf) await p.pdf({ path: pdf, width: '1800px', height: '2700px', printBackground: true, pageRanges: '1' });
  await b.close();
})();
