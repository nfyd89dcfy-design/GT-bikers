import { chromium } from 'playwright-core'; import fs from 'fs'; import path from 'path';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--no-sandbox', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
const p = await b.newPage({ viewport: { width: 800, height: 600 } }); p.setDefaultTimeout(120000);
await p.goto('file://' + path.resolve('site/index.html'), { waitUntil: 'domcontentloaded' }); await p.waitForTimeout(3000);
const jobs = [['city', '#14191A', '#7C4DFF', -0.5, 'city'], ['enduro', '#14191A', '#7C4DFF', -0.5, 'enduro'], ['quad', '#14191A', '#7C4DFF', -0.6, 'quad'], ['buggy', '#14191A', '#FF4B1F', -0.6, 'buggy'], ['enduro', '#14191A', '#7C4DFF', 0, 'enduro-side'], ['city', '#C9D3CE', '#FF4B1F', 0, 'city-side-light']];
for (const [t, f, a, y, n] of jobs) {
  const url = await p.evaluate(([t, f, a, y]) => Hush3D.renderStill(t, { frame: f, accent: a }, 1200, 780, y), [t, f, a, y]);
  fs.writeFileSync(`board/assets/bike-${n}.png`, Buffer.from(url.split(',')[1], 'base64'));
}
await b.close(); console.log('ok');
