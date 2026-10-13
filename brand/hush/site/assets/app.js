(() => {
'use strict';
const H = window.Hush3D, { gsap, ScrollTrigger } = H;
const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const rub = n => new Intl.NumberFormat('ru-RU').format(Math.round(n)).replace(/ /g, ' ') + ' ₽';
const store = { get(k, d) { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch (e) { return d; } }, set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} } };

/* ---------- data ---------- */
const DIRS = {
  city: { ru: 'Город', en: 'City', type: 'city', note: 'двор, работа, школа', electroOnly: true },
  enduro: { ru: 'Эндуро', en: 'Trail', type: 'enduro', note: 'лес, трасса, трюки' },
  buggy: { ru: 'Багги', en: 'Dune', type: 'buggy', note: 'песок, поле, двое' },
  quad: { ru: 'Квадрик', en: 'Quad', type: 'quad', note: 'хозяйство, охота, драйв' }
};
const TIERS = ['lite', 'pro', 'ultra'];
// [price, range km, top km/h, kg, power (Wh or cc)]
const SPEC = {
  city: { electro: [[89900, 60, 35, 21, 504], [129900, 95, 45, 26, 720], [189900, 150, 60, 31, 1080]] },
  enduro: { electro: [[149900, 50, 55, 48, 1200], [219900, 80, 70, 54, 1800], [329900, 120, 90, 61, 2600]], petrol: [[159900, 220, 80, 98, 125], [229900, 260, 100, 104, 250], [309900, 280, 115, 109, 300]] },
  quad: { electro: [[189900, 45, 40, 185, 2000], [289900, 70, 55, 210, 3000], [419900, 100, 70, 238, 4500]], petrol: [[169900, 180, 60, 175, 125], [259900, 200, 80, 190, 200], [379900, 230, 100, 230, 400]] },
  buggy: { electro: [[329900, 50, 45, 320, 4000], [479900, 80, 65, 360, 6000], [699900, 120, 85, 410, 9000]], petrol: [[299900, 160, 70, 300, 200], [449900, 200, 90, 340, 400], [649900, 240, 110, 390, 800]] }
};
const LOOK = { lite: { frame: '#14191A', accent: '#7C4DFF' }, pro: { frame: '#14191A', accent: '#FF4B1F' }, ultra: { frame: '#C9D3CE', accent: '#FF4B1F' } };
const ACC = [
  ['Шлем Hush matte', 7900, 's1', 'шлем на траве, матовый черный, фиолетовый кант'], ['Свет Beam front', 3900, 's3', 'передний свет в сумерках'], ['Грипсы custom violet', 2400, 's2', 'макро: руль и фиолетовые грипсы'],
  ['Сумка на раму', 4900, 's4', 'сумка на раме, двор'], ['Замок Lock-U', 3200, 's3', 'замок на перилах'], ['Snow kit: шипы + лыжа', 18900, 's1', 'байк в снегу, закат'], ['Рюкзак Roost 20 л', 5600, 's2', 'подросток с рюкзаком у гаража'], ['Защита рамы', 6900, 's4', 'защита батареи крупным планом']
];
const COPY = {
  ty: { h: 'Тихо едет.<br><em>Громко</em> чувствуется.', p: 'Электро-байки, квадрики и багги, которые собираешь под себя. Шоурум в Ростове, доставка по югу и в Москву.',
    trustH: 'Показываем все как есть', trustP: 'Ничего не прячем: батарея, мотор, сервис. Сломал на трюке – чиним быстро, без допросов.',
    trust: [['rec', 'Все видно: открываем раму, показываем батарею и мотор'], ['fix', 'Сломал – приезжай, подменный байк на время ремонта'], ['mod', 'Апгрейды и кастом ставим прямо у нас'], ['vid', 'Видео заездов снимаем сами, без монтажа под рекламу']] },
  vy: { h: 'Тихий ход.<br><em>Спокойный</em> дом.', p: 'Электротехника для семьи: плавный разгон, понятное обслуживание, сервис рядом. Шоурум в Ростове, доставка по югу и в Москву.',
    trustH: 'Спокойствие семьи', trustP: 'Мы объясняем каждую деталь и едем на тест-драйв вместе с вами. Решение принимаете без спешки.',
    trust: [['24', '24 месяца гарантии на раму, мотор, контроллер и батарею'], ['svc', 'Сервис в Ростове, запчасти всегда в наличии'], ['test', 'Тест-драйв вместе с ребенком, инструктаж на месте'], ['doc', 'Понятные цены и итог заказа до оплаты']] }
};
const state = Object.assign({ dir: 'city', fuel: 'electro', voice: 'ty', gate: false }, store.get('hush', {}));
const save = () => store.set('hush', { dir: state.dir, fuel: state.fuel, voice: state.voice, gate: state.gate });
const spec = (d, f, t) => (SPEC[d][f] || SPEC[d].electro)[t];
const modelName = (d, t) => `Hush ${DIRS[d].en} ${TIERS[t]}`;
const still = (d, t, o) => H.renderStill(DIRS[d].type, o || LOOK[TIERS[t]], 600, 392);
const toast = (m) => { const t = $('#toast'); t.textContent = m; t.classList.add('on'); clearTimeout(toast.t); toast.t = setTimeout(() => t.classList.remove('on'), 2400); };
const idle = fn => ('requestIdleCallback' in window ? requestIdleCallback(fn, { timeout: 800 }) : setTimeout(fn, 60));

/* ---------- voice ---------- */
function applyVoice() {
  document.documentElement.dataset.voice = state.voice;
  $$('[data-ty]').forEach(e => { e.textContent = e.dataset[state.voice]; });
  $$('.voice button').forEach(b => b.setAttribute('aria-pressed', b.dataset.voice === state.voice));
  const c = COPY[state.voice];
  $('#heroH').innerHTML = c.h; $('#heroP').textContent = c.p; $('#trustH').textContent = c.trustH; $('#trustP').textContent = c.trustP;
  $('#trustL').innerHTML = c.trust.map((t, i) => `<li><b>0${i + 1}</b><span>${t[1]}</span></li>`).join('');
  if (!reduce && window.__split) { }
}
$$('.voice button').forEach(b => b.addEventListener('click', () => { state.voice = b.dataset.voice; save(); applyVoice(); renderGate(); renderQuiz(); }));

/* ---------- gate ---------- */
function renderGate() {
  $('#gateGrid').innerHTML = Object.entries(DIRS).map(([k, d], i) => `<button class="gc" data-dir="${k}" data-cursor="выбрать"><span class="mono" style="position:relative">0${i + 1}</span><span><span class="n">${d.ru}</span><small>${d.note}</small></span><img alt="" src="${H.renderStill(DIRS[k].type, { frame: '#14191A', accent: i % 2 ? '#FF4B1F' : '#7C4DFF' }, 520, 340)}"></button>`).join('');
  $$('#gateGrid .gc').forEach(b => b.addEventListener('click', () => enter(b.dataset.dir)));
}
function setFuel(f) {
  if (f === 'petrol' && DIRS[state.dir].electroOnly) { toast('В городе только электро'); f = 'electro'; }
  state.fuel = f; save();
  $$('[data-fuel]').forEach(b => b.setAttribute('aria-pressed', b.dataset.fuel === f));
  $('#petrolBtn').toggleAttribute('disabled', false);
  renderTiers(); renderCmp(); heroKick();
}
$$('[data-fuel]').forEach(b => b.addEventListener('click', () => setFuel(b.dataset.fuel)));
function enter(dir) {
  state.dir = dir; if (DIRS[dir].electroOnly) state.fuel = 'electro'; state.gate = true; save();
  const g = $('#gate'); g.classList.add('out');
  const done = () => { g.style.display = 'none'; document.body.classList.remove('lock'); scrollTo(0, 0); ScrollTrigger.refresh(); };
  if (reduce) done(); else gsap.to(g, { clipPath: 'inset(0 0 100% 0)', duration: 0.9, ease: 'power4.inOut', onComplete: done });
  setDir(dir, true);
}
$('#gateSkip').addEventListener('click', () => enter(state.dir));
$('#dirBtn').addEventListener('click', () => { const g = $('#gate'); g.style.display = ''; g.classList.remove('out'); g.style.clipPath = ''; document.body.classList.add('lock'); $('#gateGrid .gc').focus(); });

/* ---------- direction ---------- */
let hero, v3, cfv;
function heroKick() { $('#heroKick').textContent = `[01] ${DIRS[state.dir].en} / ${state.fuel === 'electro' ? 'электро' : 'бенз'}`; }
function setDir(d, fromGate) {
  state.dir = d; if (DIRS[d].electroOnly && state.fuel !== 'electro') state.fuel = 'electro'; save();
  $('#petrolBtn').toggleAttribute('disabled', false);
  $$('[data-fuel]').forEach(b => b.setAttribute('aria-pressed', b.dataset.fuel === state.fuel));
  hero && hero.setType(DIRS[d].type); v3 && v3.setType(DIRS[d].type);
  $$('#dirTabs .chip').forEach(b => b.setAttribute('aria-selected', b.dataset.d === d));
  $$('#v3tabs .chip').forEach(b => b.setAttribute('aria-pressed', b.dataset.d === d)); $('#v3t').textContent = 'Hush ' + DIRS[d].en;
  heroKick(); renderTiers(); renderCmp();
  if (cfModel !== d && SPEC[d].electro) { cfModel = d; cfv && cfv.setType(DIRS[d].type); renderCfg(); }
  if (DIRS[d].electroOnly) $$('[data-fuel="petrol"]').forEach(b => b.title = 'В этом направлении только электро');
  else $$('[data-fuel="petrol"]').forEach(b => b.removeAttribute('title'));
}
$('#dirTabs').innerHTML = Object.entries(DIRS).map(([k, d]) => `<button class="chip" role="tab" data-d="${k}" aria-selected="false">${d.ru}</button>`).join('');
$$('#dirTabs .chip').forEach(b => b.addEventListener('click', () => setDir(b.dataset.d)));
$('#v3tabs').innerHTML = Object.entries(DIRS).map(([k, d]) => `<button class="chip" data-d="${k}" aria-pressed="false">${d.en}</button>`).join('');
$$('#v3tabs .chip').forEach(b => b.addEventListener('click', () => setDir(b.dataset.d)));

/* ---------- lineup ---------- */
function renderTiers() {
  const d = state.dir, f = SPEC[d][state.fuel] ? state.fuel : 'electro', petrol = f === 'petrol';
  $('#tiers').innerHTML = TIERS.map((t, i) => {
    const s = spec(d, f, i);
    return `<article class="tier ${t}"><span class="mono">0${i + 1} / ${DIRS[d].ru}</span>${i === 1 ? '<span class="sticker badge">выбор</span>' : ''}<div class="pic"><img alt="${modelName(d, i)}" width="720" height="470" src="${still(d, i)}"></div><h3>${DIRS[d].en} <span>${t}</span></h3>
    <dl><dt>${petrol ? 'Запас на баке' : 'Запас хода'}</dt><dd>~${s[1]} км</dd><dt>Макс. скорость</dt><dd>${s[2]} км/ч</dd><dt>Масса</dt><dd>${s[3]} кг</dd><dt>${petrol ? 'Двигатель' : 'Батарея'}</dt><dd>${s[4]} ${petrol ? 'см³' : 'Вт·ч'}</dd></dl>
    <div class="price">от ${rub(s[0])}</div><div class="acts"><button class="btn sm" data-add="${d}|${f}|${i}">В корзину</button><a class="btn sm ghost" href="#drive" data-drive="${d}|${f}|${i}">Тест-драйв</a></div></article>`;
  }).join('');
  $$('#tiers [data-add]').forEach(b => b.addEventListener('click', () => { const [d, f, i] = b.dataset.add.split('|'); addCart({ id: `${d}-${f}-${i}`, name: modelName(d, +i) + (f === 'petrol' ? ' (бенз)' : ''), price: spec(d, f, +i)[0], img: still(d, +i) }); }));
  $$('#tiers [data-drive]').forEach(b => b.addEventListener('click', () => { const [d, f, i] = b.dataset.drive.split('|'); $('#dm').value = `${d}|${f}|${i}`; }));
}
$('#rail').innerHTML = ACC.map((a, i) => `<div class="ac"><figure class="ph ${a[2]}"><figcaption>photo placeholder: ${a[3]}</figcaption></figure><b>${a[0]}</b><div><span class="mono">${rub(a[1])}</span><button class="btn sm ghost" data-acc="${i}">В корзину</button></div></div>`).join('');
$$('#rail [data-acc]').forEach(b => b.addEventListener('click', () => { const a = ACC[b.dataset.acc]; addCart({ id: 'acc-' + b.dataset.acc, name: a[0], price: a[1], img: '' }); }));

/* ---------- marquee ---------- */
const MQ = ['тихо', 'hush', 'drop', 'roost', 'custom', 'snow', 'lite', 'pro', 'ultra', 'под ключ', 'ростов', 'тест-драйв'];
$('#marq').innerHTML = [...MQ, ...MQ, ...MQ, ...MQ].map(w => `<span>${w} /</span>`).join('');

/* ---------- configurator ---------- */
let cfModel = 'city'; const CF = { frame: 0, acc: 0, ctl: 1, bat: 1 };
const FR = [['Матовый черный', '#14191A', 0], ['Графит', '#3A4442', 0], ['Мох', '#52695C', 4900], ['Туман', '#C9D3CE', 4900], ['Ember', '#FF4B1F', 9900]];
const AC = [['Violet', '#7C4DFF'], ['Ember', '#FF4B1F'], ['Lichen', '#BFD0C2'], ['Белый', '#F5F8F6']];
const CT = [['Basic', 0, 1], ['Smart', 9900, 1.06], ['Race', 19900, 1.0]];
const BT = [['Std', 0, 1], ['+30%', 24900, 1.3], ['+60%', 44900, 1.6]];
function renderCfg() {
  const sw = (arr, key, fn) => arr.map((a, i) => fn(a, i)).join('');
  $('#cfModel').innerHTML = Object.entries(DIRS).filter(([k]) => SPEC[k].electro).map(([k, d]) => `<button class="chip" data-m="${k}" aria-pressed="${k === cfModel}">${d.en}</button>`).join('');
  $('#cfFrame').innerHTML = sw(FR, 'frame', (a, i) => `<button class="sw" data-k="frame" data-i="${i}" aria-label="${a[0]}" title="${a[0]}" aria-pressed="${CF.frame === i}" style="background:${a[1]}"></button>`);
  $('#cfAcc').innerHTML = sw(AC, 'acc', (a, i) => `<button class="sw" data-k="acc" data-i="${i}" aria-label="${a[0]}" title="${a[0]}" aria-pressed="${CF.acc === i}" style="background:${a[1]}"></button>`);
  $('#cfCtl').innerHTML = sw(CT, 'ctl', (a, i) => `<button class="chip" data-k="ctl" data-i="${i}" aria-pressed="${CF.ctl === i}">${a[0]}${a[1] ? ' +' + rub(a[1]) : ''}</button>`);
  $('#cfBat').innerHTML = sw(BT, 'bat', (a, i) => `<button class="chip" data-k="bat" data-i="${i}" aria-pressed="${CF.bat === i}">${a[0]}${a[1] ? ' +' + rub(a[1]) : ''}</button>`);
  $$('#cfModel .chip').forEach(b => b.addEventListener('click', () => { cfModel = b.dataset.m; cfv.setType(DIRS[cfModel].type); renderCfg(); }));
  $$('#cfSide [data-k]').forEach(b => b.addEventListener('click', () => { CF[b.dataset.k] = +b.dataset.i; renderCfg(); }));
  const s = spec(cfModel, 'electro', 1), price = s[0] + FR[CF.frame][2] + CT[CF.ctl][1] + BT[CF.bat][1], range = s[1] * BT[CF.bat][2] * (CT[CF.ctl][2] === 1.06 ? 1.04 : 1);
  $('#cfPrice').textContent = rub(price); $('#cfRangeV').textContent = '~' + Math.round(range) + ' км'; $('#cfRange').style.width = Math.min(100, range / 2.3) + '%'; $('#cfName').textContent = `${DIRS[cfModel].en} pro custom`;
  cfv && cfv.setColors({ frame: FR[CF.frame][1], accent: AC[CF.acc][1] });
  renderCfg.price = price;
}
$('#cfAdd').addEventListener('click', () => {
  const id = `cfg-${cfModel}-${CF.frame}${CF.acc}${CF.ctl}${CF.bat}`;
  addCart({ id, name: `Hush ${DIRS[cfModel].en} pro custom (${FR[CF.frame][0]}, ${AC[CF.acc][0]}, ${CT[CF.ctl][0]}, ${BT[CF.bat][0]})`, price: renderCfg.price, img: H.renderStill(DIRS[cfModel].type, { frame: FR[CF.frame][1], accent: AC[CF.acc][1] }, 360, 235) });
});

/* ---------- compare ---------- */
const MODELS = []; Object.keys(DIRS).forEach(d => Object.keys(SPEC[d]).forEach(f => TIERS.forEach((t, i) => MODELS.push({ v: `${d}|${f}|${i}`, d, f, i, label: `${DIRS[d].en} ${t}${f === 'petrol' ? ' бенз' : ''}` }))));
let cmpSel = ['city|electro|0', 'city|electro|1', 'city|electro|2'];
function renderCmp() {
  if (!renderCmp.init) { renderCmp.init = 1; } else if (!cmpSel.every(v => v.startsWith(state.dir + '|' + state.fuel)) && renderCmp.auto !== false) { }
  const sel = i => `<select aria-label="Модель ${i + 1}" data-c="${i}">${MODELS.map(m => `<option value="${m.v}" ${cmpSel[i] === m.v ? 'selected' : ''}>${m.label}</option>`).join('')}</select>`;
  const S = cmpSel.map(v => { const [d, f, i] = v.split('|'); return { d, f, i: +i, s: spec(d, f, +i) }; });
  const best = (k, low) => { const vals = S.map(x => x.s[k]); return low ? Math.min(...vals) : Math.max(...vals); };
  const rows = [['Цена', 0, 1, x => rub(x.s[0])], ['Запас хода', 1, 0, x => '~' + x.s[1] + ' км'], ['Скорость', 2, 0, x => x.s[2] + ' км/ч'], ['Масса', 3, 1, x => x.s[3] + ' кг'], ['Силовая', 4, 0, x => x.f === 'petrol' ? x.s[4] + ' см³' : x.s[4] + ' Вт·ч']];
  $('#cmp').innerHTML = `<thead><tr><th></th>${S.map((x, i) => `<th>${sel(i)}</th>`).join('')}</tr></thead><tbody>${rows.map(r => `<tr><th scope="row">${r[0]}</th>${S.map(x => `<td class="${r[0] !== 'Силовая' && x.s[r[1]] === best(r[1], r[2]) ? 'best' : ''}">${r[3](x)}</td>`).join('')}</tr>`).join('')}<tr><th scope="row">Гарантия</th>${S.map(() => '<td>24 мес</td>').join('')}</tr></tbody>`;
  $$('#cmp select').forEach(s => s.addEventListener('change', () => { cmpSel[+s.dataset.c] = s.value; renderCmp(); }));
}

/* ---------- quiz ---------- */
const QZ = [
  ['Где ты ездишь чаще всего?', 'Где вы будете ездить чаще всего?', [['Двор, город, до школы и работы', { city: 3 }], ['Лес, трасса, горки', { enduro: 3 }], ['Песок, поле, проселок', { buggy: 3 }], ['Участок, хозяйство, рыбалка', { quad: 3 }]]],
  ['Кто едет?', 'Кто будет ездить?', [['Я один', { enduro: 1, city: 1 }], ['Вдвоем', { buggy: 2 }], ['Вся семья по очереди', { city: 1, quad: 1 }], ['Команда друзей', { enduro: 1, buggy: 1 }]]],
  ['Что для тебя важнее?', 'Что важнее для вас?', [['Тишина и простота', { t: 0 }], ['Драйв и трюки', { t: 1, enduro: 1 }], ['Запас хода', { t: 2 }], ['Чтобы можно было кастомить', { t: 1 }]]],
  ['Бюджет, ориентир', 'Бюджет, ориентир', [['До 150 000 ₽', { t: 0 }], ['150 000 – 300 000 ₽', { t: 1 }], ['300 000 ₽ и выше', { t: 2 }], ['Пока не знаю', { t: 1 }]]]
];
let qi = 0, qs = { city: 0, enduro: 0, buggy: 0, quad: 0 }, qt = [0, 0, 0];
function renderQuiz() {
  const box = $('#quiz'), v = state.voice;
  if (qi >= QZ.length) {
    const d = Object.keys(qs).sort((a, b) => qs[b] - qs[a])[0], t = qt.indexOf(Math.max(...qt)); const f = DIRS[d].electroOnly ? 'electro' : state.fuel, s = spec(d, f, t);
    box.innerHTML = `<div class="res"><span class="mono idx">твой результат</span><h3 class="d" style="font-size:clamp(28px,3.4vw,48px);margin:0">${modelName(d, t)}</h3><img alt="${modelName(d, t)}" src="${still(d, t)}" width="720" height="470"><p style="margin:10px 0">~${s[1]} км, до ${s[2]} км/ч, от ${rub(s[0])} (примерно)</p><div class="row"><button class="btn em sm" id="qAdd">В корзину</button><a class="btn ghost sm" href="#drive" id="qDrive">Тест-драйв</a><button class="btn ghost sm" id="qAgain">Заново</button></div></div>`;
    $('#qAdd').onclick = () => addCart({ id: `${d}-${f}-${t}`, name: modelName(d, t) + (f === 'petrol' ? ' (бенз)' : ''), price: s[0], img: still(d, t) });
    $('#qDrive').onclick = () => { $('#dm').value = `${d}|${f}|${t}`; }; $('#qAgain').onclick = () => { qi = 0; qs = { city: 0, enduro: 0, buggy: 0, quad: 0 }; qt = [0, 0, 0]; renderQuiz(); };
    return;
  }
  const q = QZ[qi];
  box.innerHTML = `<div class="qp">${QZ.map((_, i) => `<i class="${i <= qi ? 'on' : ''}"></i>`).join('')}</div><span class="mono" style="color:var(--moss)">вопрос ${qi + 1} из ${QZ.length}</span><h3>${v === 'ty' ? q[0] : q[1]}</h3><div class="ans">${q[2].map((a, i) => `<button data-a="${i}">${a[0]}</button>`).join('')}</div>`;
  $$('#quiz .ans button').forEach(b => b.addEventListener('click', () => { const o = q[2][+b.dataset.a][1]; for (const k in o) { if (k === 't') qt[o.t] += 2; else qs[k] += o[k]; } qi++; renderQuiz(); }));
}

/* ---------- tour ---------- */
const yawTo = (p, t) => Math.atan2(-(t[0] - p[0]), -(t[1] - p[2]));
const STOPS = [
  { n: 'Вход', p: [0, 1.6, 5], look: [0, -6], d: 'Светлый зал, матовые байки на круглых подиумах. Слева окно, справа стена с логотипом.' },
  { n: 'Городские', p: [-1, 1.6, 1.5], look: [-2.4, -1.2], d: 'Hush City lite / pro / ultra. Можно сесть, покатать по залу и взять на тест-драйв.' },
  { n: 'Эндуро', p: [0.5, 1.6, 0.2], look: [0.2, -2.6], d: 'Hush Trail: длинный ход, ноббики, фиолетовые детали руля. Здесь же демо-стенд с батареей.' },
  { n: 'Квадрики и багги', p: [2, 1.6, 1.4], look: [3.6, -0.8], d: 'Hush Quad и Dune. Можно посидеть в багги вдвоем и оценить обзор.' },
  { n: 'Кастом-стена', p: [-5, 1.6, 2], look: [-8, 1.5], d: 'Грипсы, плашки, стикеры, цветные детали. Выбираешь и ставим за вечер.' },
  { n: 'Сервис', p: [3.5, 1.6, 2.5], look: [6.6, 3.8], d: 'Стол для обслуживания и выдачи: здесь байк получает финальную настройку.' }
];
let tour;
function initTour() {
  const hs = [['Городские', [-2.4, 1.8, -1.2], 1], ['Trail', [0.2, 1.8, -2.6], 2], ['Quad', [3.6, 1.5, -0.8], 3], ['Dune', [0, 1.7, 2.2], 3], ['Кастом', [-7.8, 2, 1.8], 4], ['Сервис', [6.6, 1.5, 3.8], 5]];
  tour = H.createTour($('#tourC'), $('.tourstage'), $('#hots'), STOPS.map(s => ({ p: s.p, yaw: yawTo(s.p, s.look) })), hs.map(h => ({ label: h[0], p: h[1], onClick: () => tour.go(h[2]) })), i => {
    $('#tourT').textContent = STOPS[i].n; $('#tourD').textContent = STOPS[i].d; $$('#stops button').forEach((b, j) => b.classList.toggle('on', j === i));
  });
  $('#stops').innerHTML = STOPS.map((s, i) => `<button data-i="${i}" class="${i === 0 ? 'on' : ''}"><span>${s.n}</span><span class="mono">0${i + 1}</span></button>`).join('');
  $$('#stops button').forEach(b => b.addEventListener('click', () => tour.go(+b.dataset.i)));
}
// schematic map
(function () {
  const P = (lon, lat) => [30 + (lon - 36) / 5 * 340, 30 + (56.5 - lat) / 13.5 * 500];
  const pts = [['Москва', 37.62, 55.75, 8, 'r'], ['Ростов-на-Дону', 39.72, 47.23, 11, 's'], ['Краснодар', 38.98, 45.04, 6, 'r'], ['Анапа', 37.32, 44.89, 4, 'r'], ['Сочи', 39.72, 43.6, 4, 'r']];
  let dots = ''; for (let x = 30; x <= 370; x += 17) for (let y = 30; y <= 540; y += 17) dots += `<circle cx="${x}" cy="${y}" r="1.3" fill="#0F1A16" opacity=".18"/>`;
  const [a, b] = [P(37.62, 55.75), P(39.72, 47.23)], c = P(38.98, 45.04);
  $('#mapbox').innerHTML = `<span class="mono idx">где мы (схема, не карта)</span><svg viewBox="0 0 400 560" role="img" aria-label="Схема: Москва, Ростов-на-Дону, Краснодарский край">${dots}<path d="M${a[0]} ${a[1]}C ${a[0] + 70} ${a[1] + 120}, ${b[0] - 70} ${b[1] - 120}, ${b[0]} ${b[1]}" stroke="#FF4B1F" stroke-width="2.5" fill="none" stroke-dasharray="3 7" stroke-linecap="round"/><path d="M${b[0]} ${b[1]}L${c[0]} ${c[1]}" stroke="#FF4B1F" stroke-width="2.5" stroke-dasharray="3 7" stroke-linecap="round"/>${pts.map(p => { const [x, y] = P(p[1], p[2]); return `<g><circle cx="${x}" cy="${y}" r="${p[3]}" fill="${p[4] === 's' ? '#FF4B1F' : '#0F1A16'}">${p[4] === 's' ? '<animate attributeName="r" values="9;13;9" dur="2.4s" repeatCount="indefinite"/>' : ''}</circle><text x="${x + p[3] + 8}" y="${y + 4}">${p[0]}${p[4] === 's' ? ' / шоурум' : ''}</text></g>`; }).join('')}</svg>`;
})();

/* ---------- media ---------- */
const SOCS = [['Telegram', '@hush_rides', 'новости партий, закулисье'], ['YouTube', 'Hush Rides', 'заезды, обкатки, кастом'], ['Instagram', '@hush.rides', 'истории и ридеры'], ['VK', 'vk.com/hushrides', 'сообщество, афиша тест-драйвов']];
$('#mtSoc').innerHTML = SOCS.map(s => `<a class="sc" href="#" data-cursor="скоро"><span class="mono">заглушка</span><span><b>${s[0]}</b><br><span class="mono" style="color:var(--moss)">${s[1]}</span><p style="margin-top:8px;font-size:15px">${s[2]}</p></span><span class="go" aria-hidden="true">&nearr;</span></a>`).join('');
$$('#mtSoc a').forEach(a => a.addEventListener('click', e => { e.preventDefault(); toast('Ссылка появится после запуска каналов'); }));
const VID = [['Первый выезд на Trail pro', '4:12', 's1', 'лес после дождя, матовый эндуро, фиолетовый руль, съемка с земли', 'ride'], ['Как мы красим грипсы', '1:48', 's2', 'крупный план рук, баночка краски, мастерская', 'custom'], ['Двор, 7 утра: City lite', '0:42', 's3', 'пустой двор, утренний свет, подросток на байке', 'city'], ['Dune в песках', '2:30', 's4', 'багги на песке, облако пыли, двое в обычной одежде', 'ride'], ['Обкатка в Ростове', '3:05', 's2', 'зал шоурума, механик настраивает контроллер', 'service'], ['Snow kit тест', '1:20', 's1', 'квадрик в снегу, пар от дыхания, закат', 'snow']];
$('#mtVid').innerHTML = VID.map((v, i) => `<button class="vt" data-v="${i}" data-cursor="play"><figure class="ph warp ${v[2]}"><figcaption>photo placeholder: ${v[3]}</figcaption></figure><span class="play" aria-hidden="true">&#9654;</span><span class="meta"><span>${v[1]}</span><span>${v[4]}</span></span><h4>${v[0]}</h4><span class="sr" style="position:absolute;left:-999px">Открыть видео ${v[0]}</span></button>`).join('');
$$('[data-mt]').forEach(b => b.addEventListener('click', () => { $$('[data-mt]').forEach(x => x.setAttribute('aria-selected', x === b)); $('#mtVid').hidden = b.dataset.mt !== 'vid'; $('#mtSoc').hidden = b.dataset.mt !== 'soc'; $('#mtVid').style.display = b.dataset.mt === 'vid' ? '' : 'none'; }));
let lastTile = null, playT = null;
function openCollage(i, tile) {
  lastTile = tile; const v = VID[i], cg = $('#cg'), others = VID.filter((_, j) => j !== i).slice(0, 2);
  cg.innerHTML = `<figure class="ph main ${v[2]}"><figcaption>video placeholder: ${v[0]} (${v[1]}). ${v[3]}</figcaption></figure><figure class="ph a ${others[0][2]}"><figcaption>photo placeholder: доп. кадр, ${others[0][3]}</figcaption></figure><figure class="ph b ${others[1][2]}"><figcaption>photo placeholder: доп. кадр, ${others[1][3]}</figcaption></figure><div class="c"><button class="btn em sm" id="cgPlay">Play</button><div class="bar"><i id="cgBar"></i></div><span class="mono">${v[0]}</span></div>`;
  $('#collage').classList.add('on'); document.body.classList.add('lock');
  if (!reduce) { const r = tile.getBoundingClientRect(), m = $('.cg .main').getBoundingClientRect(); gsap.from('.cg .main', { x: r.left - m.left, y: r.top - m.top, scaleX: r.width / m.width, scaleY: r.height / m.height, transformOrigin: '0 0', duration: 0.8, ease: 'power4.out' }); gsap.from('.cg .a,.cg .b,.cg .c', { opacity: 0, y: 60, scale: 0.9, stagger: 0.12, duration: 0.8, delay: 0.25, ease: 'power3.out' }); }
  $('#cgPlay').onclick = e => { const b = e.target; if (playT) { clearInterval(playT); playT = null; b.textContent = 'Play'; return; } b.textContent = 'Pause'; let p = parseFloat($('#cgBar').style.width) || 0; playT = setInterval(() => { p = (p + 0.8) % 100; $('#cgBar').style.width = p + '%'; }, 60); };
  $('#cgx').focus();
}
function closeCollage() { clearInterval(playT); playT = null; $('#collage').classList.remove('on'); document.body.classList.remove('lock'); lastTile && lastTile.focus(); }
$$('.vt').forEach(t => t.addEventListener('click', () => openCollage(+t.dataset.v, t)));
$('#cgx').addEventListener('click', closeCollage);
addEventListener('keydown', e => { if (e.key === 'Escape') { if ($('#collage').classList.contains('on')) closeCollage(); closeCart(); } });

/* ---------- AR dialog ---------- */
$('#arBtn').addEventListener('click', () => { const d = $('#arDlg'); d.showModal ? d.showModal() : d.setAttribute('open', ''); });

/* ---------- cart ---------- */
let cart = store.get('hushCart', []), view = 'cart';
const ship = { 'pickup': ['Самовывоз, Ростов-на-Дону', 0], 'rostov': ['Доставка по Ростову', 3000], 'kuban': ['Краснодарский край', 6000], 'moscow': ['Москва', 9000] };
let shipKey = 'pickup';
function addCart(it) { const e = cart.find(c => c.id === it.id); if (e) e.qty++; else cart.push({ ...it, qty: 1 }); persist(); toast(`В корзине: ${it.name}`); renderCart(); bump(); }
const persist = () => store.set('hushCart', cart.map(c => ({ ...c, img: c.img && c.img.length < 60000 ? c.img : '' })));
function bump() { const b = $('#cartN'); if (!reduce) gsap.fromTo(b, { scale: 1.6 }, { scale: 1, duration: 0.5, ease: 'back.out(3)' }); }
const total = () => cart.reduce((s, c) => s + c.price * c.qty, 0);
function openCart() { $('#cart').classList.add('on'); $('#cart').setAttribute('aria-hidden', 'false'); $('#scrim').classList.add('on'); document.body.classList.add('lock'); $('#cartX').focus(); }
function closeCart() { $('#cart').classList.remove('on'); $('#cart').setAttribute('aria-hidden', 'true'); $('#scrim').classList.remove('on'); if (!$('#collage').classList.contains('on') && $('#gate').style.display === 'none') document.body.classList.remove('lock'); }
$('#cartBtn').addEventListener('click', () => { view = 'cart'; renderCart(); openCart(); }); $('#cartX').addEventListener('click', closeCart); $('#scrim').addEventListener('click', closeCart);
function renderCart() {
  $('#cartN').textContent = cart.reduce((s, c) => s + c.qty, 0);
  const B = $('#cartB'), F = $('#cartF');
  if (view === 'done') return;
  if (view === 'cart') {
    B.innerHTML = cart.length ? cart.map((c, i) => `<div class="ci">${c.img ? `<img alt="" src="${c.img}">` : '<div class="ph s3" style="height:56px;width:84px"></div>'}<div><b>${c.name}</b><div class="qty"><button data-q="${i}|-1" aria-label="Меньше">-</button><span>${c.qty}</span><button data-q="${i}|1" aria-label="Больше">+</button></div></div><div class="mono">${rub(c.price * c.qty)}</div></div>`).join('') : '<p style="color:var(--moss)">Пока пусто. Выбери байк в линейке или собери свой в конфигураторе.</p>';
    F.innerHTML = `<div class="sum t"><span>Итого</span><span>${rub(total())}</span></div><button class="btn em" id="toCk" ${cart.length ? '' : 'disabled'}>Оформить заказ</button>`;
    $$('[data-q]', B).forEach(b => b.addEventListener('click', () => { const [i, d] = b.dataset.q.split('|'); cart[+i].qty += +d; if (cart[+i].qty <= 0) cart.splice(+i, 1); persist(); renderCart(); }));
    $('#toCk') && $('#toCk').addEventListener('click', () => { view = 'ck'; renderCart(); });
  } else if (view === 'ck') {
    B.innerHTML = `<form id="ckF" class="form" novalidate><div class="fl"><label for="ckn"><span>Имя</span></label><input type="text" id="ckn" autocomplete="name" required></div><div class="fl"><label for="ckp"><span>Телефон</span></label><input type="tel" id="ckp" autocomplete="tel" placeholder="+7" required></div><div class="fl"><label for="cke"><span>Почта (по желанию)</span></label><input type="email" id="cke" autocomplete="email"></div><div class="fl"><label for="cks"><span>Получение</span></label><select id="cks">${Object.entries(ship).map(([k, v]) => `<option value="${k}" ${k === shipKey ? 'selected' : ''}>${v[0]} (${v[1] ? rub(v[1]) : 'бесплатно'})</option>`).join('')}</select></div><div class="fl"><label for="ckc"><span>Комментарий</span></label><textarea id="ckc" rows="2"></textarea></div><p id="ckE" role="alert" style="color:var(--ember-ink);font-weight:600"></p></form>`;
    const upd = () => { shipKey = $('#cks').value; F.innerHTML = `<div class="sum"><span>Товары</span><span>${rub(total())}</span></div><div class="sum"><span>${ship[shipKey][0]}</span><span>${ship[shipKey][1] ? rub(ship[shipKey][1]) : 'бесплатно'}</span></div><div class="sum t"><span>К оплате</span><span>${rub(total() + ship[shipKey][1])}</span></div><button class="btn em" id="ckGo">Подтвердить заказ</button><button class="btn ghost sm" id="ckBack">Назад в корзину</button>`; $('#ckBack').onclick = () => { view = 'cart'; renderCart(); }; $('#ckGo').onclick = submit; };
    upd(); $('#cks').addEventListener('change', upd);
    const submit = () => { const n = $('#ckn').value.trim(), p = $('#ckp').value.replace(/\D/g, ''); if (n.length < 2) { $('#ckE').textContent = 'Напиши имя.'; $('#ckn').focus(); return; } if (p.length < 10) { $('#ckE').textContent = 'Проверь телефон: нужно минимум 10 цифр.'; $('#ckp').focus(); return; }
      const code = 'H-' + String(Math.floor(Math.random() * 9000) + 1000), sum = total() + ship[shipKey][1]; cart = []; persist(); view = 'done'; $('#cartN').textContent = '0';
      B.innerHTML = `<div class="ok on" style="padding-top:20px"><span class="mono">заказ принят (макет)</span><div class="code">${code}</div><p>Спасибо, ${n.replace(/</g, '&lt;')}. Сумма ${rub(sum)}. Мы позвоним в течение рабочего дня, подтвердим комплектацию и срок. Платеж на этом макете не проводится.</p></div>`; F.innerHTML = `<button class="btn" id="ckDone">Продолжить смотреть</button>`; $('#ckDone').onclick = () => { view = 'cart'; renderCart(); closeCart(); }; };
  }
}

/* ---------- test drive ---------- */
$('#dm').innerHTML = MODELS.map(m => `<option value="${m.v}">Hush ${m.label}</option>`).join('');
$('#dm').value = 'city|electro|1';
$('#slots').innerHTML = ['11:00', '13:00', '15:00', '17:00', '19:00'].map((t, i) => `<input type="radio" name="slot" id="s${i}" value="${t}" ${i === 1 ? 'checked' : ''}><label for="s${i}">${t}</label>`).join('');
(() => { const d = new Date(); d.setDate(d.getDate() + 1); $('#dd').min = d.toISOString().slice(0, 10); d.setDate(d.getDate() + 1); $('#dd').value = d.toISOString().slice(0, 10); })();
$('#driveF').addEventListener('submit', e => {
  e.preventDefault(); const n = $('#dn').value.trim(), p = $('#dp').value.replace(/\D/g, ''), E = $('#dErr');
  if (!$('#dd').value) { E.textContent = 'Выбери дату.'; return; } if (n.length < 2) { E.textContent = 'Напиши имя.'; $('#dn').focus(); return; } if (p.length < 10) { E.textContent = 'Проверь телефон: нужно минимум 10 цифр.'; $('#dp').focus(); return; }
  E.textContent = ''; const city = $('input[name=city]:checked').value, slot = $('input[name=slot]:checked').value, dt = new Date($('#dd').value).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' }), m = $('#dm').selectedOptions[0].textContent;
  $('#dCode').textContent = 'D-' + (Math.floor(Math.random() * 9000) + 1000);
  $('#dTxt').textContent = `${n}, ждем: ${city}, ${dt} в ${slot}, ${m}.${city === 'Ростов-на-Дону' ? ' Адрес шоурума пришлем в сообщении (на макете это заглушка).' : ' Привезем демо-образец, место встречи согласуем по телефону.'}${$('#dt').checked ? ' Берем два шлема: для вас и для ребенка.' : ''}`;
  $('#driveF').style.display = 'none'; $('#driveOk').classList.add('on');
});
$('#dAgain').addEventListener('click', () => { $('#driveF').style.display = ''; $('#driveOk').classList.remove('on'); });

/* ---------- header, cursor ---------- */
addEventListener('scroll', () => $('#top').classList.toggle('solid', scrollY > 60), { passive: true });
if (!reduce && matchMedia('(hover:hover)').matches) {
  const cur = $('#cur'); let x = 0, y = 0, cx = 0, cy = 0;
  addEventListener('pointermove', e => { x = e.clientX; y = e.clientY; cur.classList.add('on'); });
  (function f() { cx += (x - cx) * 0.25; cy += (y - cy) * 0.25; cur.style.transform = `translate(${cx}px,${cy}px)`; requestAnimationFrame(f); })();
  document.addEventListener('pointerover', e => { const t = e.target.closest('[data-cursor]'); if (t) { cur.textContent = t.dataset.cursor; cur.classList.add('big'); } else { cur.textContent = ''; cur.classList.remove('big'); } });
}

/* ---------- init ---------- */
applyVoice(); renderGate(); renderQuiz(); renderCart(); renderCmp(); renderCfg();
const FOG = [0.91, 0.929, 0.918];
const gsh = H.createShader($('#gate .sh'), $('#gate'), { k: 1.3 });
const hsh = reduce ? null : H.createShader($('#heroSh'), $('#hero'), { k: 0 });
if (reduce) { $('#gate .sh').style.display = 'none'; }
if (state.gate) { $('#gate').style.display = 'none'; } else { document.body.classList.add('lock'); }
try {
  const onProg = p => { $('#progBar').style.width = p * 100 + '%'; $('#heroProg').textContent = 'сборка ' + Math.round(p * 100) + '%'; ['t1', 't2', 't3'].forEach((id, i) => $('#' + id).classList.toggle('on', p > 0.62 + i * 0.12)); };
  hero = H.createHero($('#heroGL'), $('.hero-stage'), { onProgress: onProg });
  v3 = H.createViewer($('#v3c'), { type: DIRS[state.dir].type });
  cfv = H.createViewer($('#cfc'), { type: 'city', still: false });
  initTour();
} catch (err) { console.warn('WebGL unavailable', err); document.body.classList.add('nogl'); }
setDir(state.dir);
cfModel = SPEC[state.dir].electro ? state.dir : 'city'; renderCfg();
if (!reduce) {
  gsap.utils.toArray('.sec-h, .tier, .card, .sv, .sc, .vt').forEach(el => gsap.from(el, { y: 40, opacity: 0, duration: 0.9, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 90%', once: true } }));
}
if (window.__test) window.__hush = { enter, setDir, openCart, addCart, openCollage, state, tour: () => tour, hero: () => hero };
window.__hush = { enter, setDir, openCart, closeCart, addCart, openCollage, closeCollage, state, tour: () => tour, hero: () => hero, renderCart, setView: v => { view = v; renderCart(); } };
})();
