// Convierte propuestas/propuesta_N.html en PNG (1920x1060 a doble resolución).
const {chromium} = require('playwright');
const path = require('path');
const fs = require('fs');
(async () => {
  const b = await chromium.launch();
  const pg = await b.newPage({viewport: {width: 1920, height: 1060}, deviceScaleFactor: 2});
  const dir = path.join(__dirname, 'propuestas');
  for (const f of fs.readdirSync(dir).filter((x) => x.endsWith('.html')).sort()) {
    await pg.goto('file://' + path.join(dir, f));
    await pg.evaluate(() => document.fonts.ready);
    await pg.waitForTimeout(300);
    await pg.screenshot({path: path.join(dir, f.replace('.html', '.png'))});
    console.log('ok', f);
  }
  await b.close();
})();
