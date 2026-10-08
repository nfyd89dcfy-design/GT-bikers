(function () {
  'use strict';
  var CFG = window.CFG, P = window.PRODUCTS || [];
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
  var CURSYM = { USD: '$', RMB: '¥', RUB: '₽', EUR: '€' };
  var USD_RATE = { USD: 1, RMB: 0.14, RUB: 0.011, EUR: 1.08 }; // только для сортировки
  var PAGE = 48;

  var CAT = {}; CFG.categories.forEach(function (c) { CAT[c.id] = c; });
  var FLD = {}; CFG.fields.forEach(function (f) { FLD[f.key] = f; });
  var BYID = {}; P.forEach(function (p, i) { p._i = i; BYID[p.id] = p; });

  var state = { cats: new Set(), f: {}, q: '', sort: 'rel', shown: PAGE, nearest: null };
  var kp = load('gt_kp', []).filter(function (x) { return BYID[x.id]; });
  var kpMeta = load('gt_kp_meta', { client: '', manager: '', contact: '', days: 7 });

  function load(k, d) { try { return JSON.parse(localStorage.getItem(k)) || d; } catch (e) { return d; } }
  function save(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* без хранилища тоже работает */ } }
  function toast(msg) { var t = $('#toast'); t.textContent = msg; t.classList.add('on'); clearTimeout(toast.t); toast.t = setTimeout(function () { t.classList.remove('on'); }, 3200); }
  function money(p) {
    if (p.price == null) return 'Цена по запросу';
    return Number(p.price).toLocaleString('ru-RU') + ' ' + (CURSYM[p.cur] || p.cur || '') + (p.priceNote ? ' · ' + p.priceNote : '');
  }
  function num(v) { return Number(v).toLocaleString('ru-RU', { maximumFractionDigits: 2 }); }
  function fieldText(p, f) {
    var v = p[f.key];
    if (v == null || v === '' || (Array.isArray(v) && !v.length)) return null;
    if (f.type === 'bool') return v ? 'Да' : 'Нет';
    if (Array.isArray(v)) return v.join(', ');
    if (f.type === 'number') return num(v) + (f.unit ? ' ' + f.unit : '');
    return String(v);
  }
  function hay(p) {
    if (!p._h) p._h = [p.name, p.brand, p.sku, (CAT[p.cat] || {}).name, p.gear_type, p.part_type, (p.extra || []).map(function (r) { return r[1]; }).join(' ')].join(' ').toLowerCase().replace(/ё/g, 'е');
    return p._h;
  }

  /* ---------- применимость полей и данные для фильтров ---------- */
  function pool() { return state.cats.size ? P.filter(function (p) { return state.cats.has(p.cat); }) : P; }
  function fieldsFor() {
    var sel = Array.from(state.cats), pl = pool();
    return CFG.fields.filter(function (f) {
      if (f.cats && sel.length && !f.cats.some(function (c) { return sel.indexOf(c) >= 0; })) return false;
      if (f.cats && !sel.length) return false;
      return pl.some(function (p) { var v = p[f.key]; return v != null && v !== '' && !(Array.isArray(v) && !v.length); });
    });
  }

  /* ---------- сопоставление ---------- */
  function critOK(p, key, c) {
    var v = p[key];
    if (c.vals) {
      if (v == null) return false;
      return Array.isArray(v) ? v.some(function (x) { return c.vals.has(x); }) : c.vals.has(v);
    }
    if (c.bool) return v === true;
    if (v == null || v === '') return false;
    if (c.min != null && v < c.min) return false;
    if (c.max != null && v > c.max) return false;
    return true;
  }
  function qOK(p) {
    if (!state.q) return true;
    var h = hay(p);
    return state.q.toLowerCase().replace(/ё/g, 'е').split(/\s+/).filter(Boolean).every(function (t) { return h.indexOf(t) >= 0; });
  }
  function score(p) { // сколько критериев выполнено
    var s = 0, n = 0;
    if (state.cats.size) { n++; if (state.cats.has(p.cat)) s++; }
    Object.keys(state.f).forEach(function (k) { n++; if (critOK(p, k, state.f[k])) s++; });
    if (state.q) { n++; if (qOK(p)) s++; }
    return [s, n];
  }
  function priceUsd(p) { return p.price == null ? Infinity : p.price * (USD_RATE[p.cur] || 1); }

  function results() {
    var out = P.filter(function (p) {
      if (state.cats.size && !state.cats.has(p.cat)) return false;
      for (var k in state.f) if (!critOK(p, k, state.f[k])) return false;
      return qOK(p);
    });
    state.nearest = null;
    var crit = Object.keys(state.f).length + (state.q ? 1 : 0) + (state.cats.size ? 1 : 0);
    if (!out.length && crit >= 2) {
      var sc = P.map(function (p) { return { p: p, s: score(p)[0] }; }).filter(function (x) { return x.s > 0; });
      var top = sc.reduce(function (m, x) { return Math.max(m, x.s); }, 0);
      sc = sc.filter(function (x) { return x.s === top && top < crit; });
      if (sc.length) { out = sc.map(function (x) { return x.p; }); state.nearest = { top: top, crit: crit }; }
    }
    var s = state.sort;
    if (s === 'price-asc') out.sort(function (a, b) { return priceUsd(a) - priceUsd(b); });
    else if (s === 'price-desc') out.sort(function (a, b) { return (b.price == null ? -1 : priceUsd(b)) - (a.price == null ? -1 : priceUsd(a)); });
    else if (s === 'name') out.sort(function (a, b) { return a.name.localeCompare(b.name, 'ru'); });
    return out;
  }

  /* ---------- отрисовка ---------- */
  function renderCats() {
    var cnt = {}; P.forEach(function (p) { cnt[p.cat] = (cnt[p.cat] || 0) + 1; });
    $('#cats').innerHTML = CFG.categories.filter(function (c) { return cnt[c.id]; }).map(function (c) {
      return '<button class="cat' + (state.cats.has(c.id) ? ' on' : '') + '" data-cat="' + c.id + '" type="button"><b>' + esc(c.short) + '</b><span>' + cnt[c.id] + '</span></button>';
    }).join('');
  }

  function renderFilters() {
    var fs = fieldsFor(), pl = pool(), groups = {};
    fs.forEach(function (f) { (groups[f.group] = groups[f.group] || []).push(f); });
    var html = '';
    if (!state.cats.size) html += '<p class="hint">Выберите категорию выше, чтобы увидеть все параметры: мощность, батарею, запас хода, привод и другие.</p>';
    CFG.groups.forEach(function (g) {
      if (!groups[g]) return;
      html += '<details class="fg" open><summary>' + esc(g) + '</summary>';
      groups[g].forEach(function (f) { html += filterHtml(f, pl); });
      html += '</details>';
    });
    $('#filters').innerHTML = html || '<p class="hint">Нет параметров для фильтрации.</p>';
  }
  function filterHtml(f, pl) {
    var cur = state.f[f.key] || {}, label = esc(f.label + (f.unit ? ', ' + f.unit : ''));
    if (f.type === 'number') {
      var vals = pl.map(function (p) { return p[f.key]; }).filter(function (v) { return typeof v === 'number'; });
      if (!vals.length) return '';
      var mn = Math.min.apply(null, vals), mx = Math.max.apply(null, vals);
      return '<div class="fl"><label>' + label + '</label><div class="rng"><input type="number" inputmode="decimal" data-k="' + f.key + '" data-b="min" placeholder="' + num(mn) + '" value="' + (cur.min != null ? cur.min : '') + '" aria-label="' + label + ' от"><i>—</i><input type="number" inputmode="decimal" data-k="' + f.key + '" data-b="max" placeholder="' + num(mx) + '" value="' + (cur.max != null ? cur.max : '') + '" aria-label="' + label + ' до"></div></div>';
    }
    if (f.type === 'bool') {
      return '<div class="fl"><label class="chk"><input type="checkbox" data-k="' + f.key + '" data-bool="1"' + (cur.bool ? ' checked' : '') + '><span>' + label + '</span></label></div>';
    }
    var cnt = {};
    pl.forEach(function (p) { var v = p[f.key]; (Array.isArray(v) ? v : [v]).forEach(function (x) { if (x != null && x !== '') cnt[x] = (cnt[x] || 0) + 1; }); });
    var keys = Object.keys(cnt).sort(function (a, b) { return cnt[b] - cnt[a] || a.localeCompare(b, 'ru'); });
    if (!keys.length) return '';
    var many = keys.length > 8;
    var opts = keys.map(function (v, i) {
      return '<label class="chk' + (many && i >= 8 && !(cur.vals && cur.vals.has(v)) ? ' extra' : '') + '"><input type="checkbox" data-k="' + f.key + '" data-v="' + esc(v) + '"' + (cur.vals && cur.vals.has(v) ? ' checked' : '') + '><span>' + esc(v) + '</span><em>' + cnt[v] + '</em></label>';
    }).join('');
    return '<div class="fl"><label>' + label + '</label><div class="opts">' + opts + (many ? '<button type="button" class="link morefl">Показать все (' + keys.length + ')</button>' : '') + '</div></div>';
  }

  function renderChips() {
    var c = [];
    state.cats.forEach(function (id) { c.push(['cat', id, CAT[id].name]); });
    Object.keys(state.f).forEach(function (k) {
      var f = FLD[k], v = state.f[k], t;
      if (v.vals) t = f.label + ': ' + Array.from(v.vals).join(', ');
      else if (v.bool) t = f.label;
      else t = f.label + (v.min != null && v.max != null ? ': ' + num(v.min) + '–' + num(v.max) : v.min != null ? ' от ' + num(v.min) : ' до ' + num(v.max)) + (f.unit ? ' ' + f.unit : '');
      c.push(['f', k, t]);
    });
    if (state.q) c.push(['q', '', '«' + state.q + '»']);
    $('#chips').innerHTML = c.map(function (x) { return '<button class="chip" data-t="' + x[0] + '" data-k="' + esc(x[1]) + '" type="button">' + esc(x[2]) + ' <span aria-hidden="true">×</span></button>'; }).join('');
    $('#resetAll').hidden = !c.length;
  }

  function cardSpecs(p) {
    var order = ['power_kw', 'power_hp', 'engine_cc', 'top_speed', 'range_km', 'battery_wh', 'seats', 'max_load_kg', 'weight_kg', 'gear_type', 'part_type'];
    var out = [];
    order.forEach(function (k) { var f = FLD[k], t = f && fieldText(p, f); if (t && out.length < 3) out.push('<li><span>' + esc(f.label) + '</span><b>' + esc(t) + '</b></li>'); });
    return out.join('');
  }
  function renderGrid() {
    var res = results(), shown = res.slice(0, state.shown);
    $('#count').textContent = state.nearest ? 'Ближайшие варианты: ' + res.length : 'Найдено моделей: ' + res.length;
    var n = $('#notice');
    if (state.nearest) { n.hidden = false; n.innerHTML = 'Точных совпадений нет. Показаны модели, подходящие по ' + state.nearest.top + ' из ' + state.nearest.crit + ' условий. Уберите лишние условия в чипах выше.'; }
    else if (!res.length) { n.hidden = false; n.textContent = 'Ничего не найдено. Измените условия или сбросьте фильтры.'; }
    else n.hidden = true;
    $('#grid').innerHTML = shown.map(function (p) {
      var inKp = kp.some(function (x) { return x.id === p.id; });
      var img = p.images && p.images[0];
      return '<article class="card" data-id="' + esc(p.id) + '"><button class="card__img" data-open="' + esc(p.id) + '" type="button" aria-label="Открыть ' + esc(p.name) + '">' + (img ? '<img loading="lazy" decoding="async" src="' + esc(img) + '" alt="' + esc(p.name) + '">' : '<span class="noimg">Нет фото</span>') + '<em>' + esc((CAT[p.cat] || {}).short || '') + '</em></button>' +
        '<div class="card__b"><div class="card__brand">' + esc(p.brand || '') + '</div><h3 data-open="' + esc(p.id) + '">' + esc(p.name) + '</h3>' +
        '<ul class="card__s">' + cardSpecs(p) + '</ul>' +
        '<div class="card__f"><div class="price">' + esc(money(p)) + '</div><button class="btn btn--sm ' + (inKp ? 'btn--on' : 'btn--line') + '" data-kp="' + esc(p.id) + '" type="button">' + (inKp ? 'В КП ✓' : '+ В КП') + '</button></div></div></article>';
    }).join('');
    $('#more').hidden = res.length <= state.shown;
  }

  function renderAll(skipFilters) {
    renderCats(); if (!skipFilters) renderFilters(); renderChips(); renderGrid();
  }

  /* ---------- события фильтров ---------- */
  function setRange(k, b, v) {
    var c = state.f[k] || {}; v = v === '' ? null : parseFloat(String(v).replace(',', '.'));
    if (v == null || isNaN(v)) delete c[b]; else c[b] = v;
    if (c.min == null && c.max == null) delete state.f[k]; else state.f[k] = c;
  }
  function pruneFilters() { // убираем фильтры, неприменимые к выбранным категориям
    var ok = {}; fieldsFor().forEach(function (f) { ok[f.key] = 1; });
    Object.keys(state.f).forEach(function (k) { if (!ok[k]) delete state.f[k]; });
  }
  $('#cats').addEventListener('click', function (e) {
    var b = e.target.closest('[data-cat]'); if (!b) return;
    var id = b.dataset.cat; state.cats.has(id) ? state.cats.delete(id) : state.cats.add(id);
    pruneFilters(); state.shown = PAGE; renderAll();
    $('#catalog').scrollIntoView({ behavior: 'smooth' });
  });
  $('#filters').addEventListener('input', function (e) {
    var t = e.target; if (t.dataset.b) { setRange(t.dataset.k, t.dataset.b, t.value); state.shown = PAGE; clearTimeout(renderAll.t); renderAll.t = setTimeout(function () { renderAll(true); }, 250); }
  });
  $('#filters').addEventListener('change', function (e) {
    var t = e.target, k = t.dataset.k; if (!k || t.dataset.b) return;
    if (t.dataset.bool) { if (t.checked) state.f[k] = { bool: true }; else delete state.f[k]; }
    else {
      var c = state.f[k] || { vals: new Set() }; if (!c.vals) c.vals = new Set();
      t.checked ? c.vals.add(t.dataset.v) : c.vals.delete(t.dataset.v);
      if (c.vals.size) state.f[k] = c; else delete state.f[k];
    }
    state.shown = PAGE; renderAll(true);
  });
  $('#filters').addEventListener('click', function (e) {
    if (e.target.classList.contains('morefl')) { var o = e.target.closest('.opts'); o.classList.toggle('all'); e.target.textContent = o.classList.contains('all') ? 'Свернуть' : 'Показать все'; }
  });
  $('#chips').addEventListener('click', function (e) {
    var b = e.target.closest('.chip'); if (!b) return;
    if (b.dataset.t === 'cat') { state.cats.delete(b.dataset.k); pruneFilters(); }
    else if (b.dataset.t === 'f') delete state.f[b.dataset.k];
    else { state.q = ''; $('#q').value = ''; }
    state.shown = PAGE; renderAll();
  });
  $('#resetAll').addEventListener('click', function () { state.cats.clear(); state.f = {}; state.q = ''; $('#q').value = ''; $('#aiInput').value = ''; state.shown = PAGE; renderAll(); });
  $('#q').addEventListener('input', function (e) { state.q = e.target.value.trim(); state.shown = PAGE; clearTimeout(renderAll.t); renderAll.t = setTimeout(function () { renderChips(); renderGrid(); }, 200); });
  $('#sort').addEventListener('change', function (e) { state.sort = e.target.value; renderGrid(); });
  $('#more').addEventListener('click', function () { state.shown += PAGE; renderGrid(); });
  $('#filtersToggle').addEventListener('click', function () { $('#filters').classList.toggle('open'); });

  /* ---------- AI-поиск ---------- */
  function applyAI(text) {
    var r = window.NL.parse(text, P);
    var q = r.q.split(/\s+/).filter(function (t) { return t && P.some(function (p) { return hay(p).indexOf(t) >= 0; }); }).join(' ');
    state.cats = new Set(r.cats);
    state.f = {};
    Object.keys(r.ranges).forEach(function (k) { state.f[k] = r.ranges[k]; });
    Object.keys(r.enums).forEach(function (k) { state.f[k] = { vals: new Set(r.enums[k]) }; });
    Object.keys(r.bools).forEach(function (k) { state.f[k] = { bool: true }; });
    state.q = q; $('#q').value = q; state.shown = PAGE;
    pruneKeep(r);
    renderAll();
    $('#catalog').scrollIntoView({ behavior: 'smooth' });
    if (!r.cats.length && !Object.keys(state.f).length && !q) toast('Не удалось выделить параметры. Попробуйте указать категорию и числа, например «квадроцикл от 300 кубов».');
  }
  function pruneKeep(r) { // оставляем только применимые к категориям фильтры, но не теряем введённые пользователем
    if (!state.cats.size) return;
    var ok = {}; fieldsFor().forEach(function (f) { ok[f.key] = 1; });
    Object.keys(state.f).forEach(function (k) { if (!ok[k]) delete state.f[k]; });
  }
  $('#aiForm').addEventListener('submit', function (e) { e.preventDefault(); var v = $('#aiInput').value.trim(); if (v) applyAI(v); });
  $('#aiExamples').innerHTML = window.NL.examples.map(function (x) { return '<button type="button" class="ex">' + esc(x) + '</button>'; }).join('');
  $('#aiExamples').addEventListener('click', function (e) { var b = e.target.closest('.ex'); if (b) { $('#aiInput').value = b.textContent; applyAI(b.textContent); } });

  /* ---------- карточка модели ---------- */
  function openModel(id) {
    var p = BYID[id]; if (!p) return;
    var m = $('#modal'), inKp = kp.some(function (x) { return x.id === id; });
    var imgs = p.images || [];
    var rows = {};
    CFG.fields.forEach(function (f) {
      if (f.key === 'brand' || f.key === 'cur' || f.key === 'price') return;
      var t = fieldText(p, f); if (t != null) (rows[f.group] = rows[f.group] || []).push([f.label, t]);
    });
    var spec = CFG.groups.filter(function (g) { return rows[g]; }).map(function (g) {
      return '<h4>' + esc(g) + '</h4><table>' + rows[g].map(function (r) { return '<tr><td>' + esc(r[0]) + '</td><td>' + esc(r[1]) + '</td></tr>'; }).join('') + '</table>';
    }).join('');
    var extra = (p.extra || []).length ? '<h4>Дополнительно</h4><table>' + p.extra.map(function (r) { return '<tr><td>' + esc(r[0]) + '</td><td>' + esc(r[1]) + '</td></tr>'; }).join('') + '</table>' : '';
    m.innerHTML = '<button class="x" data-close aria-label="Закрыть">×</button><div class="mdl"><div class="mdl__g"><div class="mdl__main">' + (imgs[0] ? '<img id="mainImg" src="' + esc(imgs[0]) + '" alt="' + esc(p.name) + '">' : '<span class="noimg">Нет фото</span>') + '</div>' +
      (imgs.length > 1 ? '<div class="mdl__th">' + imgs.slice(0, 8).map(function (s, i) { return '<button type="button" data-img="' + esc(s) + '" class="' + (i ? '' : 'on') + '"><img loading="lazy" src="' + esc(s) + '" alt=""></button>'; }).join('') + '</div>' : '') + '</div>' +
      '<div class="mdl__i"><div class="card__brand">' + esc(p.brand || '') + ' · ' + esc((CAT[p.cat] || {}).name || '') + '</div><h2>' + esc(p.name) + '</h2>' + (p.sku ? '<div class="muted">Артикул: ' + esc(p.sku) + '</div>' : '') +
      '<div class="mdl__price">' + esc(money(p)) + '</div>' +
      '<div class="mdl__btns"><button class="btn btn--blue" id="mKp" type="button">Скачать КП (PDF)</button><button class="btn btn--line" id="mAdd" type="button">' + (inKp ? 'Убрать из КП' : 'Добавить в КП') + '</button>' + (imgs[0] ? '<button class="btn btn--ghost2" id="mSim" type="button">Похожие по фото</button>' : '') + '</div>' +
      (p.desc ? '<p class="mdl__d">' + esc(p.desc) + '</p>' : '') + spec + extra + (p.src ? '<p class="muted src">Источник: ' + esc(p.src) + '</p>' : '') + '</div></div>';
    if (!m.open) m.showModal();
    m.scrollTop = 0;
    $('#mKp').onclick = function () { makeKp([{ p: p, qty: 1 }], this); };
    $('#mAdd').onclick = function () { toggleKp(id); this.textContent = kp.some(function (x) { return x.id === id; }) ? 'Убрать из КП' : 'Добавить в КП'; };
    var sim = $('#mSim'); if (sim) sim.onclick = function () { m.close(); runPhoto(p.images[0], id); };
    m.querySelectorAll('[data-img]').forEach(function (b) { b.onclick = function () { $('#mainImg').src = b.dataset.img; m.querySelectorAll('[data-img]').forEach(function (x) { x.classList.remove('on'); }); b.classList.add('on'); }; });
  }
  document.addEventListener('click', function (e) {
    var o = e.target.closest('[data-open]'); if (o) { openModel(o.dataset.open); return; }
    var k = e.target.closest('[data-kp]'); if (k) { toggleKp(k.dataset.kp); return; }
    var c = e.target.closest('[data-close]'); if (c) { c.closest('dialog').close(); return; }
    if (e.target.tagName === 'DIALOG') e.target.close();
  });

  /* ---------- КП ---------- */
  function toggleKp(id) {
    var i = kp.findIndex(function (x) { return x.id === id; });
    if (i >= 0) kp.splice(i, 1); else { kp.push({ id: id, qty: 1 }); toast('Добавлено в КП: ' + BYID[id].name); }
    save('gt_kp', kp); updKp(); renderGrid();
  }
  function updKp() { $('#kpCount').textContent = kp.length; $('#kpCount').classList.toggle('on', kp.length > 0); }
  function readMeta() {
    kpMeta = { client: $('#kpClient').value.trim(), manager: $('#kpManager').value.trim(), contact: $('#kpContact').value.trim(), days: parseInt($('#kpDays').value, 10) || 7 };
    save('gt_kp_meta', kpMeta); return kpMeta;
  }
  function renderKp() {
    $('#kpClient').value = kpMeta.client || ''; $('#kpManager').value = kpMeta.manager || ''; $('#kpContact').value = kpMeta.contact || ''; $('#kpDays').value = kpMeta.days || 7;
    $('#kpItems').innerHTML = kp.length ? kp.map(function (x) {
      var p = BYID[x.id];
      return '<div class="kpi"><img src="' + esc((p.images || [])[0] || '') + '" alt=""><div class="kpi__t"><b>' + esc(p.name) + '</b><span>' + esc(money(p)) + '</span></div><div class="qty"><button data-q="-1" data-id="' + esc(x.id) + '" type="button" aria-label="Меньше">−</button><span>' + x.qty + '</span><button data-q="1" data-id="' + esc(x.id) + '" type="button" aria-label="Больше">+</button></div><button class="del" data-del="' + esc(x.id) + '" type="button" aria-label="Убрать">×</button></div>';
    }).join('') : '<p class="muted">В КП пока нет моделей. Нажмите «+ В КП» на карточке.</p>';
    var sums = {}; kp.forEach(function (x) { var p = BYID[x.id]; if (p.price != null) sums[p.cur || ''] = (sums[p.cur || ''] || 0) + p.price * x.qty; });
    $('#kpTotal').innerHTML = Object.keys(sums).length ? 'Итого: <b>' + Object.keys(sums).map(function (c) { return sums[c].toLocaleString('ru-RU') + ' ' + (CURSYM[c] || c); }).join(' + ') + '</b>' : '';
    $('#kpMake').disabled = !kp.length;
  }
  $('#openKp').addEventListener('click', function () { renderKp(); $('#kpModal').showModal(); });
  $('#kpItems').addEventListener('click', function (e) {
    var q = e.target.closest('[data-q]'), d = e.target.closest('[data-del]');
    if (q) { var it = kp.filter(function (x) { return x.id === q.dataset.id; })[0]; it.qty = Math.max(1, it.qty + parseInt(q.dataset.q, 10)); }
    if (d) kp = kp.filter(function (x) { return x.id !== d.dataset.del; });
    if (q || d) { save('gt_kp', kp); updKp(); renderKp(); renderGrid(); }
  });
  ['kpClient', 'kpManager', 'kpContact', 'kpDays'].forEach(function (id) { $('#' + id).addEventListener('change', readMeta); });
  $('#kpMake').addEventListener('click', function () {
    makeKp(kp.map(function (x) { return { p: BYID[x.id], qty: x.qty }; }), this, readMeta());
  });
  function makeKp(items, btn, meta) {
    meta = Object.assign({}, meta || kpMeta);
    var old = btn.textContent; btn.disabled = true; btn.textContent = 'Готовлю PDF…';
    return window.KP.make(items, meta).then(function (name) { toast('Готово: ' + name); })
      .catch(function (e) { console.error(e); toast('Не удалось собрать PDF: ' + e.message); })
      .then(function () { btn.disabled = false; btn.textContent = old; });
  }

  /* ---------- поиск по фото ---------- */
  var pm = $('#photoModal'), drop = $('#drop'), file = $('#photoFile');
  function openPhoto() { if (!pm.open) pm.showModal(); }
  $('#openPhoto').addEventListener('click', function () { $('#photoRes').innerHTML = ''; $('#photoStatus').textContent = ''; $('#dropText').textContent = 'Перетащите фото сюда или нажмите для выбора'; openPhoto(); });
  file.addEventListener('change', function () { if (file.files[0]) runPhoto(URL.createObjectURL(file.files[0])); });
  ['dragenter', 'dragover'].forEach(function (ev) { drop.addEventListener(ev, function (e) { e.preventDefault(); drop.classList.add('over'); }); });
  ['dragleave', 'drop'].forEach(function (ev) { drop.addEventListener(ev, function (e) { e.preventDefault(); drop.classList.remove('over'); }); });
  drop.addEventListener('drop', function (e) { var f = e.dataTransfer.files[0]; if (f && /^image\//.test(f.type)) runPhoto(URL.createObjectURL(f)); });
  document.addEventListener('paste', function (e) {
    var items = (e.clipboardData || {}).items || [];
    for (var i = 0; i < items.length; i++) if (items[i].type.indexOf('image') === 0) { var f = items[i].getAsFile(); openPhoto(); runPhoto(URL.createObjectURL(f)); return; }
  });
  function runPhoto(src, excludeId) {
    openPhoto();
    var st = $('#photoStatus'), res = $('#photoRes');
    $('#dropText').innerHTML = '<img class="qimg" src="' + esc(src) + '" alt="Загруженное фото">';
    res.innerHTML = ''; st.textContent = 'Подготовка…';
    window.IMG.search(src, P, function (m) { st.textContent = m; }, 13).then(function (r) {
      var list = r.results.filter(function (x) { return x.id !== excludeId; }).slice(0, 12);
      st.textContent = r.mode === 'clip' ? 'Найдено ближайших моделей: ' + list.length : 'Нейросеть недоступна, подбор по цветам и композиции: ' + list.length + ' вариантов';
      res.innerHTML = list.map(function (x) {
        var p = BYID[x.id], pct = Math.max(0, Math.min(99, Math.round((r.mode === 'clip' ? (x.s - 0.5) / 0.5 : x.s) * 100)));
        return '<button class="pr" data-open2="' + esc(p.id) + '" type="button"><img loading="lazy" src="' + esc(x.path) + '" alt=""><b>' + esc(p.name) + '</b><span>' + esc(p.brand || '') + '</span><em>' + pct + '%</em></button>';
      }).join('');
    }).catch(function (e) { console.error(e); st.textContent = 'Не удалось обработать фото: ' + e.message; });
  }
  $('#photoRes').addEventListener('click', function (e) { var b = e.target.closest('[data-open2]'); if (b) { pm.close(); openModel(b.dataset.open2); } });

  /* ---------- старт ---------- */
  function init() {
    var brands = {}; P.forEach(function (p) { if (p.brand) brands[p.brand] = 1; });
    $('#heroStats').innerHTML = '<div><b>' + P.length + '</b><span>моделей</span></div><div><b>' + Object.keys(brands).length + '</b><span>брендов</span></div><div><b>' + CFG.categories.filter(function (c) { return P.some(function (p) { return p.cat === c.id; }); }).length + '</b><span>категорий</span></div>';
    var c = CFG.company;
    $('#footNote').textContent = c.note;
    $('#footContacts').innerHTML = [c.phone, c.email, c.address].filter(Boolean).map(function (x) { return '<p>' + esc(x) + '</p>'; }).join('') || '<p class="muted">Контакты компании добавляются в js/config.js</p>';
    updKp(); renderAll();
  }
  init();
})();
