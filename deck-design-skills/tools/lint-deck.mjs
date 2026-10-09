// Проверка HTML-колоды на анти-паттерны. Запуск: node tools/lint-deck.mjs deck.html
// Слайд = <section class="slide"> 1920x1080. Выход 1, если есть ошибки.
import { chromium } from 'playwright';
import path from 'node:path';

const file = process.argv[2];
if (!file) { console.error('usage: node tools/lint-deck.mjs deck.html'); process.exit(2); }

const ALLOWED = (process.env.DECK_FONTS ||
  'Manrope,Onest,Golos Text,Geologica,Unbounded,Source Serif 4,Literata,JetBrains Mono').split(',').map(s => s.trim());
const DISCOURAGED = ['Inter', 'Roboto', 'Arial', 'Helvetica', 'system-ui'];

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
await page.goto('file://' + path.resolve(file), { waitUntil: 'networkidle' });
await page.evaluate(() => document.fonts.ready);

const issues = await page.evaluate(({ ALLOWED, DISCOURAGED }) => {
  const out = [];
  const families = new Set();
  const describe = el => {
    const t = (el.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 28);
    return `<${el.tagName.toLowerCase()}${el.className && typeof el.className === 'string' ? '.' + el.className.split(' ')[0] : ''}> ${t}`;
  };
  const alpha = c => {
    const m = c.match(/rgba?\(([^)]+)\)/);
    if (!m) return 0;
    const p = m[1].split(',').map(s => parseFloat(s));
    return p.length > 3 ? p[3] : 1;
  };
  const blur = cs => { const b = cs.backdropFilter || cs.webkitBackdropFilter || 'none'; return b !== 'none' && /blur/.test(b); };

  const slides = [...document.querySelectorAll('section.slide')];
  if (!slides.length) out.push({ level: 'error', rule: 'no-slides', slide: 0, el: '', msg: 'Не найдено ни одного <section class="slide">' });

  slides.forEach((s, idx) => {
    const n = idx + 1;
    const sr = s.getBoundingClientRect();
    const push = (level, rule, el, msg) => out.push({ level, rule, slide: n, el: describe(el), msg });
    const sizes = new Set();
    let textEls = 0, usesGlass = false, hasColorBehind = false;

    s.querySelectorAll('*').forEach(el => {
      const cs = getComputedStyle(el);
      if (cs.display === 'none') return;
      const decor = el.closest('[data-decor]');
      const bleed = el.closest('[data-bleed]');
      const r = el.getBoundingClientRect();
      const ownText = [...el.childNodes].some(c => c.nodeType === 3 && c.textContent.trim());
      const fs = parseFloat(cs.fontSize);

      if (ownText) {
        textEls++;
        const fam = cs.fontFamily.split(',')[0].replace(/["']/g, '').trim();
        families.add(fam);
        sizes.add(Math.round(fs));
        if (fs < 24) push('error', 'min-size', el, `Размер ${fs}px, минимум 24px`);
        const txt = el.textContent;
        if (/[ёЁ]/.test(txt)) push('error', 'yo', el, 'Буква "ё": заменить на "е"');
        if (/—/.test(txt)) push('error', 'em-dash', el, 'Длинное тире: заменить на "–" или дефис');
        if (/\[[^\]]{1,40}\]/.test(txt)) push('error', 'placeholder', el, 'Заглушка в квадратных скобках в готовом файле');
        const ls = parseFloat(cs.letterSpacing) || 0;
        const em = ls / fs;
        if (fs >= 48 && em > 0.02) push('error', 'tracking-display', el, `Трекинг ${em.toFixed(2)}em на крупном тексте: слово растягивают размером, а не трекингом`);
        if (fs < 48 && em > 0.14) push('error', 'tracking-label', el, `Трекинг ${em.toFixed(2)}em, максимум 0.14em`);
        if (el.scrollWidth - el.clientWidth > 2 && cs.overflow !== 'visible') push('warn', 'text-overflow', el, 'Текст шире контейнера');
      }

      // Слово, собранное из отдельных блоков-букв
      const kids = [...el.children];
      if (kids.length >= 5 && kids.filter(k => k.textContent.trim().length === 1).length >= 5)
        push('error', 'fake-tracking', el, 'Слово собрано из отдельных блоков по букве');

      if (!decor && !bleed && (r.left < sr.left - 2 || r.top < sr.top - 2 || r.right > sr.right + 2 || r.bottom > sr.bottom + 2))
        push('error', 'out-of-bounds', el, 'Элемент выходит за край слайда (для фото в край добавь data-bleed)');

      if (el.tagName === 'IMG') {
        const bw = ['Top', 'Right', 'Bottom', 'Left'].map(k => parseFloat(cs['border' + k + 'Width']) || 0);
        if (Math.max(...bw) > 0 && cs.borderStyle !== 'none') push('error', 'image-frame', el, 'Рамка вокруг фото. Используй скругление, тень или маску');
        if (parseFloat(cs.outlineWidth) > 0 && cs.outlineStyle !== 'none') push('error', 'image-frame', el, 'Outline вокруг фото');
        if (el.naturalWidth && cs.objectFit === 'fill') {
          const a = el.naturalWidth / el.naturalHeight, b = r.width / r.height;
          if (Math.abs(a - b) / a > 0.03) push('error', 'distorted', el, 'Фото искажено по пропорциям, нужен object-fit');
        }
        if (alpha(cs.backgroundColor) === 1 && /rgb\(255, 255, 255\)/.test(cs.backgroundColor))
          push('warn', 'white-box', el, 'Белая подложка под фото. Вырежи фон или поставь на нейтральную панель');
        if (r.width < 300 && r.height < 300 && el.naturalWidth && r.width / el.naturalWidth > 1.6)
          push('warn', 'upscaled', el, 'Фото увеличено более чем в 1.6 раза, будет мутным');
        hasColorBehind = true;
      }

      if (blur(cs)) {
        usesGlass = true;
        // стекло в стекле
        let p = el.parentElement;
        while (p && p !== s) { if (blur(getComputedStyle(p))) { push('error', 'glass-in-glass', el, 'Стекло внутри стекла'); break; } p = p.parentElement; }
        const bw = parseFloat(cs.borderTopWidth) || 0;
        if (bw >= 1 && cs.borderStyle !== 'none' && alpha(cs.borderTopColor) > 0.25)
          push('warn', 'glass-hard-border', el, 'Жесткая рамка у стекла. Нужна световая кромка inset-тенью');
      }
      if (cs.backgroundImage && /gradient/.test(cs.backgroundImage) && (decor || el === s)) hasColorBehind = true;
      if (decor) hasColorBehind = true;
    });

    if (usesGlass && !hasColorBehind && !/gradient/.test(getComputedStyle(s).backgroundImage))
      out.push({ level: 'warn', rule: 'glass-on-flat', slide: n, el: '', msg: 'Стекло на плоском фоне: под ним нечего размывать' });
    if (sizes.size > 6) out.push({ level: 'warn', rule: 'type-scale', slide: n, el: '', msg: `${sizes.size} разных размеров шрифта, держись шкалы (5-6)` });
    if (textEls > 16) out.push({ level: 'warn', rule: 'density', slide: n, el: '', msg: `${textEls} текстовых блоков: слишком плотно, раздели слайд` });
  });

  const fams = [...families].filter(f => !['serif', 'sans-serif', 'monospace'].includes(f));
  if (fams.length > 2) out.push({ level: 'error', rule: 'too-many-fonts', slide: 0, el: '', msg: `Гарнитур ${fams.length}: ${fams.join(', ')}. Максимум 2` });
  fams.forEach(f => {
    if (DISCOURAGED.includes(f)) out.push({ level: 'error', rule: 'banned-font', slide: 0, el: '', msg: `Шрифт "${f}" запрещен: дефолт нейросетей` });
    else if (!ALLOWED.includes(f)) out.push({ level: 'warn', rule: 'unknown-font', slide: 0, el: '', msg: `Шрифт "${f}" вне списка typography.md, проверь кириллицу` });
  });
  return out;
}, { ALLOWED, DISCOURAGED });

await browser.close();

const errors = issues.filter(i => i.level === 'error');
const warns = issues.filter(i => i.level === 'warn');
for (const i of [...errors, ...warns])
  console.log(`${i.level === 'error' ? 'ERROR' : 'warn '} слайд ${i.slide || '-'} [${i.rule}] ${i.msg}${i.el ? '\n        ' + i.el : ''}`);
console.log(`\n${errors.length} ошибок, ${warns.length} предупреждений`);
process.exit(errors.length ? 1 : 0);
