import { chromium } from 'playwright-core';
import path from 'path';
const url = 'file://' + path.resolve('site/index.html');
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--no-sandbox', '--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
async function run(name, w, h, mobile) {
  const ctx = await b.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 1, isMobile: !!mobile, hasTouch: !!mobile });
  const p = await ctx.newPage(); const errs = [];
  p.on('console', m => { if (['error', 'warning'].includes(m.type())) errs.push(m.text().slice(0, 200)); }); p.on('pageerror', e => errs.push('PAGEERR ' + e.message));
  p.setDefaultTimeout(90000); await p.goto(url,{waitUntil:'domcontentloaded'}); await p.waitForTimeout(2500);
  const S = async (n) => { await p.waitForTimeout(700); await p.screenshot({ path: `board/shots/${name}-${n}.png` }); };
  await S('gate');
  await p.click('.gc[data-dir=enduro]'); await p.waitForFunction(()=>getComputedStyle(document.getElementById('gate')).display==='none'); await p.waitForTimeout(1500);
  await S('hero0');
  await p.evaluate(() => window.scrollTo({top:innerHeight * 1.3,behavior:'instant'})); await p.waitForFunction(()=>__hush.hero().progress>0.99); await p.waitForTimeout(2500); await S('hero1');
  await p.evaluate(() => window.scrollTo({top:innerHeight * 0.7,behavior:'instant'})); await p.waitForTimeout(2500); await S('hero2');
  for (const id of ['line', 'viewer', 'config', 'fit', 'tour', 'media', 'service', 'drive']) {
    await p.evaluate(i => { const e = document.getElementById(i); window.scrollTo({top:e.getBoundingClientRect().top + scrollY - 60,behavior:'instant'}); }, id); await p.waitForTimeout(2200); await S(id);
  }
  const ovf = await p.evaluate(() => ({ sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth }));
  console.log(name, 'overflow', JSON.stringify(ovf), 'errors', JSON.stringify(errs.slice(0, 6)));
  if (name === 'd') {
    await p.evaluate(() => window.scrollTo({top:0,behavior:'instant'})); await p.waitForTimeout(300);
    await p.evaluate(() => { __hush.addCart({ id: 'x1', name: 'Hush Trail pro', price: 219900, img: '' }); __hush.openCart(); }); await S('cart');
    await p.click('#toCk'); await S('checkout');
    await p.evaluate(() => { document.getElementById('cart').classList.remove('on'); document.getElementById('scrim').classList.remove('on'); document.body.classList.remove('lock'); });
    await p.evaluate(() => { const e = document.getElementById('media'); window.scrollTo({top:e.getBoundingClientRect().top + scrollY - 60,behavior:'instant'}); }); await p.waitForTimeout(500);
    await p.click('.vt[data-v="0"]'); await p.waitForTimeout(1600); await S('collage'); await p.click('#cgx');
    await p.evaluate(() => { const e = document.getElementById('hero'); window.scrollTo({top:0,behavior:'instant'}); }); await p.click('.voice button[data-voice=vy]'); await p.waitForTimeout(500); await S('heroVy');
  }
  await ctx.close();
}
const only=process.argv[2]; if(!only||only==='d') await run('d', 1440, 900, false); if(!only||only==='m') await run('m', 390, 844, true);
await b.close();
