// Рендер колоды: PDF и PNG каждого слайда. Запуск: node tools/render.mjs deck.html [outDir]
import { chromium } from 'playwright';
import path from 'node:path';
import fs from 'node:fs';

const file = process.argv[2];
const out = path.resolve(process.argv[3] || 'out');
if (!file) { console.error('usage: node tools/render.mjs deck.html [outDir]'); process.exit(2); }
fs.mkdirSync(out, { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
await page.goto('file://' + path.resolve(file), { waitUntil: 'networkidle' });
await page.evaluate(() => document.fonts.ready);
await page.addStyleTag({ content: '@page{size:1920px 1080px;margin:0}html,body{background:none}' });

const n = await page.locator('section.slide').count();
for (let i = 0; i < n; i++)
  await page.locator('section.slide').nth(i).screenshot({ path: path.join(out, `slide-${String(i + 1).padStart(2, '0')}.png`) });
await page.pdf({ path: path.join(out, 'deck.pdf'), width: '1920px', height: '1080px', printBackground: true });
await browser.close();
console.log(`Готово: ${n} слайдов, PDF и PNG в ${out}`);
console.log('Следующий шаг: открой каждый PNG и PDF глазами, потом чек-лист из references/anti-patterns.md');
