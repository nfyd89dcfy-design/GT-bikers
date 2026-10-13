import { chromium } from 'playwright-core'; import path from 'path'; import fs from 'fs';
const meta = JSON.parse(fs.readFileSync('board/_meta.json'));
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--no-sandbox'] });
const p = await b.newPage({ viewport: { width: meta.w, height: meta.h }, deviceScaleFactor: 1 }); p.setDefaultTimeout(120000);
await p.goto('file://' + path.resolve('board/hush-board.html')); await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(1500);
const fonts = await p.evaluate(async () => { await document.fonts.ready; return ['Unbounded', 'Onest', 'JetBrains Mono'].map(f => [f, document.fonts.check(`16px "${f}"`)]); });
console.log('fonts', JSON.stringify(fonts));
await p.screenshot({ path: 'board/hush-board.png' });
await p.pdf({ path: 'board/hush-board.pdf', width: meta.w + 'px', height: meta.h + 'px', printBackground: true, pageRanges: '1' });
for (const f of meta.frames) { await p.locator('#f-' + f.id).screenshot({ path: `board/frames/${String(f.n).padStart(2, '0')}-${f.id}.png` }); }
const q = await b.newPage({ viewport: { width: 1123, height: 794 } }); await q.goto('file://' + path.resolve('board/brandbook.html')); await q.evaluate(() => document.fonts.ready); await q.waitForTimeout(1200);
await q.pdf({ path: 'brandbook.pdf', width: '1123px', height: '794px', printBackground: true });
await b.close(); console.log('rendered');
