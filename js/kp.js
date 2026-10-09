/* Коммерческое предложение в PDF.
   Страницы КП собираются как обычный HTML (A4), html-to-image рисует текст так же, как браузер, фото кладутся в PDF отдельно в исходном качестве, jsPDF собирает файл прямо в браузере.
   Ссылки (Telegram, WhatsApp, телефон) в PDF кликабельные, рядом QR-коды. В тексте нет буквы ё и длинного тире:
   все строки проходят через esc(). Цены пишутся по-русски (юаней, долларов, рублей, евро), сумма также прописью. */
window.KP = (function () {
  var CFG = window.CFG;
  var CURW = { RMB: ['юань', 'юаня', 'юаней'], USD: ['доллар', 'доллара', 'долларов'], RUB: ['рубль', 'рубля', 'рублей'], EUR: ['евро', 'евро', 'евро'] };

  function clean(s) { return String(s == null ? '' : s).replace(/ё/g, 'е').replace(/Ё/g, 'Е').replace(/[—―]/g, '–'); }
  function esc(s) { return clean(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function attr(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  var MK = 0; // наценка, % (задаётся при формировании КП)
  function unit(p) { return Math.round(p.price * (1 + MK / 100)); }
  function plural(n, a, b, c) { n = Math.abs(n); var m = n % 100, d = n % 10; return (m > 10 && m < 20) ? c : d === 1 ? a : (d > 1 && d < 5) ? b : c; }
  function curWord(n, c) { var w = CURW[c]; return w ? plural(n, w[0], w[1], w[2]) : (c || ''); }
  function fmt(n) { return Number(n).toLocaleString('ru-RU'); }
  function moneyText(n, c) { return fmt(n) + ' ' + curWord(n, c); }
  function moneyHtml(n, c) { return esc(fmt(n)) + '<small>' + esc(curWord(n, c)) + '</small>'; }

  /* число прописью (мужской род; тысячи женского) */
  var O_M = ['', 'один', 'два', 'три', 'четыре', 'пять', 'шесть', 'семь', 'восемь', 'девять'], O_F = ['', 'одна', 'две', 'три', 'четыре', 'пять', 'шесть', 'семь', 'восемь', 'девять'];
  var TEEN = ['десять', 'одиннадцать', 'двенадцать', 'тринадцать', 'четырнадцать', 'пятнадцать', 'шестнадцать', 'семнадцать', 'восемнадцать', 'девятнадцать'];
  var TENS = ['', '', 'двадцать', 'тридцать', 'сорок', 'пятьдесят', 'шестьдесят', 'семьдесят', 'восемьдесят', 'девяносто'];
  var HUND = ['', 'сто', 'двести', 'триста', 'четыреста', 'пятьсот', 'шестьсот', 'семьсот', 'восемьсот', 'девятьсот'];
  function triple(n, fem) {
    var w = [], h = Math.floor(n / 100), t = Math.floor(n / 10) % 10, o = n % 10;
    if (h) w.push(HUND[h]);
    if (t === 1) w.push(TEEN[o]); else { if (t) w.push(TENS[t]); if (o) w.push((fem ? O_F : O_M)[o]); }
    return w.join(' ');
  }
  function words(n) {
    n = Math.round(n);
    if (n === 0) return 'ноль';
    if (n >= 1e9) return String(n);
    var w = [], mil = Math.floor(n / 1e6), th = Math.floor(n / 1e3) % 1e3, rest = n % 1e3;
    if (mil) w.push(triple(mil, false) + ' ' + plural(mil, 'миллион', 'миллиона', 'миллионов'));
    if (th) w.push(triple(th, true) + ' ' + plural(th, 'тысяча', 'тысячи', 'тысяч'));
    if (rest) w.push(triple(rest, false));
    return w.join(' ');
  }
  function moneyWords(n, c) { return words(n) + ' ' + curWord(n, c); }

  function fieldVal(p, f) {
    var v = p[f.key];
    if (v == null || v === '' || (Array.isArray(v) && !v.length)) return null;
    if (f.type === 'bool') return v ? 'Да' : 'Нет';
    if (Array.isArray(v)) return v.join(', ');
    if (f.type === 'number') return Number(v).toLocaleString('ru-RU') + (f.unit ? ' ' + f.unit : '');
    return v;
  }
  var NOCJK = /[぀-ヿ㐀-鿿]/;
  /* Строки характеристик по группам: поля каталога + все строки из таблицы поставщика без повторов. */
  var EXTRA_FIELD = [[/^колёсная база/i, 'wheelbase_mm'], [/^высота сиденья/i, 'seat_height_mm'], [/^(дорожный просвет|клиренс)/i, 'ground_clearance_mm'], [/^масса, кг/i, 'weight_kg'],
    [/^макс\. скорость/i, 'top_speed'], [/^макс\. момент|^крутящий момент/i, 'torque_nm'], [/^топливный бак/i, 'fuel_tank_l'], [/^объ[её]м/i, 'engine_cc'], [/^запас хода при 60/i, 'range_km'], [/^макс\. мощность/i, 'power_kw'], [/^время полной зарядки/i, 'charge_h']];
  function specGroups(p) {
    var skip = { brand: 1, cur: 1, price: 1 }, hasDims = (p.extra || []).some(function (r) { return /^габариты/i.test(r[0]) && !/упаков/i.test(r[0]); });
    var groups = {};
    function add(g, label, val) { if (!groups[g]) groups[g] = []; groups[g].push([label, val]); }
    var shown = {};
    CFG.fields.forEach(function (f) {
      if (skip[f.key] || (f.key === 'length_mm' && hasDims)) return;
      var v = fieldVal(p, f);
      if (v != null) { shown[f.key] = 1; add(f.group || 'Основное', f.label + (f.unit && f.type !== 'number' ? ', ' + f.unit : ''), v); }
    });
    var mainLabels = {};
    Object.keys(groups).forEach(function (g) { groups[g].forEach(function (r) { mainLabels[r[0].toLowerCase()] = 1; }); });
    (p.extra || []).forEach(function (r) {
      var lab = String(r[0]), val = String(r[1]);
      if (/^(цен|доплат|артикул|описание поставщика|серия)/i.test(lab) || /^мин\. партия/i.test(lab)) return;
      if (NOCJK.test(lab) || NOCJK.test(val)) return;
      if (EXTRA_FIELD.some(function (m) { return m[0].test(lab) && shown[m[1]]; })) return;
      if (mainLabels[lab.toLowerCase()]) return;
      add(lab === '•' ? 'Особенности' : 'Дополнительно', lab, val);
    });
    var gs = CFG.groups.concat(['Дополнительно', 'Особенности']);
    return gs.filter(function (g) { return groups[g]; }).map(function (g) { return { name: g, rows: groups[g] }; });
  }
  function specRows(p) { var out = []; specGroups(p).forEach(function (g) { g.rows.forEach(function (r) { out.push(r); }); }); return out; }
  var HL_KEYS = ['power_kw', 'power_hp', 'engine_cc', 'top_speed', 'range_km', 'battery_wh', 'removable_battery', 'seats', 'max_load_kg', 'drivetrain', 'weight_kg', 'gear_type'];
  function highlights(p) {
    var out = [];
    HL_KEYS.forEach(function (k) {
      var f = CFG.fields.filter(function (x) { return x.key === k; })[0];
      var v = f && fieldVal(p, f);
      if (v != null && out.length < 6) out.push([f.label, v]);
    });
    return out;
  }
  function catName(id) { var c = CFG.categories.filter(function (x) { return x.id === id; })[0]; return c ? c.name : ''; }
  function bigVal(v) {
    var m = /^([\d.,\s ]*\d)\s*(\D.*)?$/.exec(String(v));
    if (m && m[1] && m[2] && m[2].length <= 8) return esc(m[1].trim()) + '<small>' + esc(m[2]) + '</small>';
    return esc(v);
  }

  var STEPS = (CFG.company.kpSteps && CFG.company.kpSteps.length) ? CFG.company.kpSteps : [
    ['Подбираем модель', 'подтверждаем выбранный продукт, количество и комплектацию'],
    ['Согласуем условия', 'письменно фиксируем цену, оплату, способ и срок доставки.'],
    ['Оформляем заказ', 'счет и договор уже у вас на руках, а мы запускаем поставку!']];

  /* ---------- контакты: ссылки и QR ---------- */
  function digits(s) { return String(s || '').replace(/\D/g, ''); }
  function shortUrl(u) { return u.replace(/^https?:\/\/(www\.)?/i, '').replace(/\/$/, ''); }
  function normTg(v) {
    v = String(v || '').trim(); if (!v) return null;
    var m = /(?:t\.me|telegram\.me|telegram\.dog)\/(@?[A-Za-z0-9_+]+)/i.exec(v);
    if (m) { var u = m[1].replace(/^@/, ''); return { url: 'https://t.me/' + u, text: 't.me/' + u }; }
    if (/^https?:\/\//i.test(v)) return { url: v, text: shortUrl(v) };
    if (/^@?[A-Za-z][A-Za-z0-9_]{3,}$/.test(v)) { var n = v.replace(/^@/, ''); return { url: 'https://t.me/' + n, text: 't.me/' + n }; }
    var d = digits(v); if (d.length >= 10) { if (d.length === 11 && d[0] === '8') d = '7' + d.slice(1); return { url: 'https://t.me/+' + d, text: 't.me/+' + d }; }
    return null;
  }
  function normWa(v) {
    v = String(v || '').trim(); if (!v) return null;
    if (/^https?:\/\//i.test(v) || /wa\.me|whatsapp\.com/i.test(v)) { var u = /^https?:\/\//i.test(v) ? v : 'https://' + v; return { url: u, text: shortUrl(u) }; }
    var d = digits(v); if (d.length < 10) return null;
    if (d.length === 11 && d[0] === '8') d = '7' + d.slice(1);
    return { url: 'https://wa.me/' + d, text: 'wa.me/' + d };
  }
  function normPhone(v) {
    v = String(v || '').trim(); if (!v) return null;
    if (/@/.test(v)) return { url: 'mailto:' + v, text: v };
    var d = digits(v); if (d.length < 7) return { url: '', text: v };
    return { url: 'tel:+' + (d.length === 11 && d[0] === '8' ? '7' + d.slice(1) : d), text: v };
  }
  function qrImg(url) {
    try {
      var q = window.qrcode(0, 'M'); q.addData(url); q.make();
      var n = q.getModuleCount(), d = '', r, c, run;
      for (r = 0; r < n; r++) for (c = 0; c < n; c++) {
        if (!q.isDark(r, c)) continue;
        run = 1; while (c + run < n && q.isDark(r, c + run)) run++;
        d += 'M' + c + ',' + r + 'h' + run + 'v1h-' + run + 'z'; c += run - 1;
      }
      var svg = '<svg xmlns="http://www.w3.org/2000/svg" width="' + n * 8 + '" height="' + n * 8 + '" viewBox="0 0 ' + n + ' ' + n + '" shape-rendering="crispEdges"><rect width="' + n + '" height="' + n + '" fill="#fff"/><path d="' + d + '" fill="#000"/></svg>';
      return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
    } catch (e) { return ''; }
  }
  function contacts(meta) {
    return { phone: normPhone(meta.contact), tg: normTg(meta.tg), wa: normWa(meta.wa) };
  }
  function linkA(c, cls) { return c && c.url ? '<span class="' + (cls || '') + '" data-href="' + attr(c.url) + '">' + esc(c.text) + '</span>' : esc(c ? c.text : ''); }

  /* ---------- общие куски ---------- */
  function logo() { return '<div class="k2-logo"><i>GT</i>Bikes</div>'; }
  function top(meta, num, pageNo, total) {
    return '<div class="k2-top">' + logo() + '<div>КП № ' + esc(num) + ' · ' + esc(meta.date) + (total > 1 ? ' · ' + pageNo + '/' + total : '') + '</div></div>';
  }
  function foot(meta) {
    var bits = [];
    if (meta.manager) bits.push(esc(meta.manager));
    if (meta.contact) bits.push(esc(meta.contact));
    if (CFG.company.phone) bits.push(esc(CFG.company.phone));
    if (CFG.company.email) bits.push(esc(CFG.company.email));
    return '<div class="k2-foot"><span>' + bits.join(' · ') + '</span><span>Действует до ' + esc(meta.until) + '</span></div>';
  }
  function sec(inner, cls) { return '<section class="k2' + (cls ? ' ' + cls : '') + '">' + inner + '</section>'; }

  /* ---------- обложка ---------- */
  /* заглавная модель: выбранная менеджером (meta.cover) или первая с фото; её первое фото идёт на обложку, дальше в КП другие */
  var FEAT = null;
  function pickFeatured(items, meta) {
    var f = items.filter(function (it) { return it.p.id === meta.cover && it.p.images && it.p.images[0]; })[0] || items.filter(function (it) { return it.p.images && it.p.images[0]; })[0];
    return f ? f.p.id : null;
  }
  function modelPhotos(it) {
    var im = it.p.images || [];
    if (it.p.id === FEAT && im.length > 1) return { main: im[1], thumbs: im.slice(2, 5) };
    return { main: im[0] || '', thumbs: im.slice(1, 4) };
  }
  function coverPage(items, meta, num) {
    var cs = contacts(meta), n = items.length;
    var fi = items.filter(function (it) { return it.p.id === FEAT; })[0], img = fi && fi.p.images[0];
    var sub = (meta.client ? 'Для ' + esc(meta.client) + '. ' : '') + (n > 1 ? n + ' ' + plural(n, 'модель', 'модели', 'моделей') + ' с характеристиками и ценами.' : esc(items[0].p.name) + ': характеристики и цена.');
    var hero = '<div class="k2-hero">' + (img ? '<img src="' + esc(img) + '" alt="">' : '') + (fi ? '<div class="nm">' + esc(fi.p.name) + '</div>' : '') + '</div>';
    var chips = '<div class="k2-chip">Действует до<b>' + esc(meta.until) + '</b></div>' +
      (meta.manager ? '<div class="k2-chip">Ваш менеджер<b>' + esc(meta.manager) + '</b></div>' : '') +
      (cs.phone ? '<div class="k2-chip">Телефон<b>' + linkA(cs.phone) + '</b></div>' : '') +
      (cs.tg ? '<div class="k2-chip">Telegram<b>' + linkA(cs.tg) + '</b></div>' : '') +
      (cs.wa ? '<div class="k2-chip">WhatsApp<b>' + linkA(cs.wa) + '</b></div>' : '');
    return sec('<div class="k2-top">' + logo() + '<div>КП № ' + esc(num) + ' · ' + esc(meta.date) + '</div></div>' +
      '<div class="k2-cover-h">Подобрали модели <span class="sc">специально для вас</span></div><div class="k2-cover-sub">' + sub + '</div>' + hero + '<div class="k2-chips">' + chips + '</div>', 'k2--cover');
  }

  /* ---------- коротко о предложении (текст зависит от наполнения) ---------- */
  function maxOf(items, key) { var v = items.map(function (it) { return it.p[key]; }).filter(function (x) { return typeof x === 'number'; }); return v.length ? Math.max.apply(null, v) : null; }
  function totals(items) {
    var sums = {};
    items.forEach(function (it) { if (it.p.price != null) sums[it.p.cur || ''] = (sums[it.p.cur || ''] || 0) + unit(it.p) * it.qty; });
    return sums;
  }
  function digest(items, meta) {
    var n = items.length, qty = items.reduce(function (a, it) { return a + it.qty; }, 0);
    var cats = [], brands = [];
    items.forEach(function (it) { var c = catName(it.p.cat).toLowerCase(); if (c && cats.indexOf(c) < 0) cats.push(c); if (it.p.brand && brands.indexOf(it.p.brand) < 0) brands.push(it.p.brand); });
    var priced = items.filter(function (it) { return it.p.price != null; }), sums = totals(items), keys = Object.keys(sums);
    var totalText = keys.map(function (c) { return moneyText(sums[c], c); }).join(' + ');
    var totalHtml = keys.map(function (c) { return moneyHtml(sums[c], c); }).join(' + ');
    var sp = maxOf(items, 'top_speed'), pw = maxOf(items, 'power_kw'), rg = maxOf(items, 'range_km');
    var parts = [];
    if (n === 1) {
      var p = items[0].p, hl = highlights(p).slice(0, 3).map(function (h) { return h[0].toLowerCase() + ' ' + h[1]; });
      parts.push('Предлагаем ' + (p.brand ? p.brand + ' ' : '') + p.name + (hl.length ? ': ' + hl.join(', ') : '') + '.');
      parts.push(p.price != null ? 'Цена за единицу ' + moneyText(unit(p), p.cur) + (items[0].qty > 1 ? ', на ' + items[0].qty + ' шт. ' + totalText : '') + '.' : p.priceLabel ? 'Цена: ' + p.priceLabel + '.' : 'Цену уточним под ваш заказ.');
    } else {
      parts.push('В предложении ' + n + ' ' + plural(n, 'модель', 'модели', 'моделей') + (qty > n ? ' (' + qty + ' ' + plural(qty, 'единица', 'единицы', 'единиц') + ' техники)' : '') + (cats.length ? ': ' + cats.join(', ') : '') + '.');
      if (brands.length) parts.push((brands.length > 1 ? 'Бренды: ' : 'Бренд: ') + brands.join(', ') + '.');
      parts.push(priced.length === n ? 'Итоговая стоимость ' + totalText + '.' : priced.length ? 'Для ' + (n - priced.length) + ' ' + plural(n - priced.length, 'модели', 'моделей', 'моделей') + ' цену уточним под заказ.' : 'Цены уточним под ваш заказ.');
    }
    parts.push('Дальше по каждой модели: фото, главные цифры и полные характеристики.');
    var stats = [[String(n), plural(n, 'модель', 'модели', 'моделей') + ' в предложении']];
    if (qty > n) stats.push([String(qty), 'единиц техники всего']); else if (cats.length > 1) stats.push([String(cats.length), 'категории техники']);
    stats.push(totalHtml ? [totalHtml, n > 1 ? 'итого по предложению' : 'стоимость', true] : [n === 1 && items[0].p.priceLabel ? items[0].p.priceLabel : 'По запросу', 'цена']);
    if (sp) stats.push([sp + '<small>км/ч</small>', 'макс. скорость' + (n > 1 ? ' среди моделей' : ''), true]);
    else if (pw) stats.push([String(pw).replace('.', ',') + '<small>кВт</small>', 'макс. мощность' + (n > 1 ? ' среди моделей' : ''), true]);
    else if (rg) stats.push([rg + '<small>км</small>', 'макс. запас хода', true]);
    stats.push([meta.until, 'предложение действует до']);
    return { text: parts.join(' '), stats: stats.slice(0, 4), sums: sums };
  }
  function sumRow(it, i) {
    var p = it.p, line = p.price != null ? unit(p) * it.qty : null;
    return '<div class="k2-sum-row"><div class="n">' + (i + 1) + '</div><div class="im">' + (p.images && p.images[0] ? '<img src="' + esc(p.images[0]) + '" alt="">' : '') + '</div><div class="t">' + esc(p.name) + '<small>' + esc(p.brand || '') + (p.sku ? ' · ' + esc(p.sku) : '') + '</small></div><div class="q">' + it.qty + ' шт.</div><div class="p">' + (p.price != null ? esc(moneyText(unit(p), p.cur)) : esc(p.priceLabel || 'Цена по запросу')) + '</div><div class="s">' + (line != null ? esc(moneyText(line, p.cur)) : '–') + '</div></div>';
  }
  function rateNote(meta) {
    var u = meta.usedRates || {}, parts = Object.keys(u).map(function (c) { return '1 ' + RATE_SYM[c] + ' = ' + String(u[c]).replace('.', ',') + ' ₽'; });
    return parts.length ? '<div class="k2-note">Цены пересчитаны в рубли по курсу: ' + esc(parts.join(', ')) + '</div>' : '';
  }
  var SUM_FIRST = 4, SUM_NEXT = 10;
  function summaryCount(items) { return 1 + Math.ceil(Math.max(0, items.length - SUM_FIRST) / SUM_NEXT); }
  function summaryPages(items, meta, num, pageNo, total) {
    var d = digest(items, meta), html = '', keys = Object.keys(d.sums);
    var cls = ['k2-c0', 'k2-c1', 'k2-c2', 'k2-c1'];
    var stats = d.stats.map(function (s, i) { return '<div class="k2-stat ' + cls[i % 4] + '"><b>' + (s[2] ? s[0] : esc(s[0])) + '</b><span>' + esc(s[1]) + '</span></div>'; }).join('');
    var pages = summaryCount(items);
    for (var k = 0; k < pages; k++) {
      var from = k === 0 ? 0 : SUM_FIRST + (k - 1) * SUM_NEXT, to = k === 0 ? SUM_FIRST : from + SUM_NEXT;
      var rows = items.slice(from, to).map(function (it, j) { return sumRow(it, from + j); }).join('');
      var totalBar = (k === pages - 1 && keys.length) ? '<div class="k2-total"><div><span>Итого по предложению</span>' + (keys.length === 1 ? '<em>' + esc(moneyWords(d.sums[keys[0]], keys[0])) + '</em>' : '') + '</div><b>' + keys.map(function (c) { return moneyHtml(d.sums[c], c); }).join(' + ') + '</b></div>' : '';
      html += sec(top(meta, num, pageNo + k, total) +
        (k === 0 ? '<h1 class="k2-h1" style="margin-top:28px">Коротко <span class="sc">о предложении</span></h1><div class="k2-lead">' + esc(d.text) + '</div><div class="k2-stats">' + stats + '</div><h2 class="k2-h2" style="margin-top:4px">Состав</h2>'
          : '<h1 class="k2-h1" style="margin-top:28px">Состав <span class="sc">(продолжение)</span></h1>') +
        rows + totalBar + (k === pages - 1 ? rateNote(meta) : '') + foot(meta));
    }
    return html;
  }

  /* ---------- сравнение моделей (если в КП больше одной) ---------- */
  var CMP_KEYS = [['power_kw', 1], ['power_hp', 1], ['engine_cc', 1], ['top_speed', 1], ['range_km', 1], ['battery_wh', 1], ['battery_v', 0], ['removable_battery', 0], ['charge_h', -1], ['torque_nm', 1], ['seats', 1], ['max_load_kg', 1], ['weight_kg', -1], ['drivetrain', 0], ['powertrain', 0], ['transmission', 0], ['brakes', 0], ['seat_height_mm', 0], ['ground_clearance_mm', 1], ['wheelbase_mm', 0], ['fuel_tank_l', 1]];
  var CMP_PER = 4, CMP_ROWS = 16;
  function cmpRows(items) {
    var rows = [];
    CMP_KEYS.forEach(function (kk) {
      var f = CFG.fields.filter(function (x) { return x.key === kk[0]; })[0]; if (!f) return;
      var vals = items.map(function (it) { return fieldVal(it.p, f); });
      if (vals.every(function (v) { return v == null; })) return;
      var best = -1;
      if (kk[1] && f.type === 'number') {
        var nums = items.map(function (it) { return typeof it.p[f.key] === 'number' ? it.p[f.key] : null; }), ok = nums.filter(function (x) { return x != null; });
        if (ok.length > 1 && Math.max.apply(null, ok) !== Math.min.apply(null, ok)) { var t = kk[1] > 0 ? Math.max.apply(null, ok) : Math.min.apply(null, ok); best = nums.indexOf(t); }
      }
      rows.push({ label: f.label + (f.unit && f.type !== 'number' ? ', ' + f.unit : ''), vals: vals, best: best });
    });
    return rows.slice(0, CMP_ROWS);
  }
  function cmpPageCount(items) { return items.length > 1 ? Math.ceil(items.length / CMP_PER) * Math.ceil(Math.max(1, cmpRows(items).length) / CMP_ROWS) : 0; }
  function comparePages(items, meta, num, pageNo, total) {
    var rows = cmpRows(items), html = '', pg = pageNo;
    var rowChunks = []; for (var r = 0; r < Math.max(1, rows.length); r += CMP_ROWS) rowChunks.push(rows.slice(r, r + CMP_ROWS));
    for (var c = 0; c < items.length; c += CMP_PER) {
      var cols = items.slice(c, c + CMP_PER);
      rowChunks.forEach(function (chunk, ci) {
        var head = '<div class="k2-cmp-h"><div class="k2-cmp-l"></div>' + cols.map(function (it) {
          var p = it.p, priced = p.price != null;
          return '<div class="k2-cmp-m"><div class="ph">' + (p.images && p.images[0] ? '<img src="' + esc(p.images[0]) + '" alt="">' : '') + '</div><b>' + esc(p.name) + '</b><span>' + (priced ? esc(moneyText(unit(p), p.cur)) : esc(p.priceLabel || 'Цена по запросу')) + '</span></div>';
        }).join('') + '</div>';
        var body = chunk.map(function (row) {
          return '<div class="k2-cmp-r"><div class="k2-cmp-l">' + esc(row.label) + '</div>' + cols.map(function (it, j) {
            var v = row.vals[c + j]; return '<div class="k2-cmp-c' + (row.best === c + j ? ' best' : '') + '">' + (v == null ? '–' : esc(v)) + '</div>';
          }).join('') + '</div>';
        }).join('');
        html += sec(top(meta, num, pg++, total) + '<h1 class="k2-h1" style="margin-top:28px">Сравнение <span class="sc">моделей</span></h1><div class="k2-sku" style="margin-bottom:16px">Лучшее значение в строке выделено синим' + (ci || c ? ' (продолжение)' : '') + '</div>' +
          '<div class="k2-cmp k2-cmp--' + cols.length + '">' + head + body + '</div>' + foot(meta));
      });
    }
    return html;
  }

  /* ---------- страницы моделей ---------- */
  var COL_UNITS = 34;
  function rowUnits(r) { return 1 + Math.floor((String(r[1]).length - 1) / 28) + (String(r[0]).length > 34 ? 1 : 0); }
  function specPageSets(p) {
    var seq = [];
    specGroups(p).forEach(function (g) {
      seq.push({ g: g.name, u: 2.2 });
      g.rows.forEach(function (r) { seq.push({ r: r, gn: g.name, u: rowUnits(r) }); });
    });
    var pages = [], i = 0;
    while (i < seq.length) {
      var chunk = [], sum = 0;
      while (i < seq.length && sum + seq[i].u <= COL_UNITS * 2) { chunk.push(seq[i]); sum += seq[i].u; i++; }
      if (chunk.length && chunk[chunk.length - 1].g) { chunk.pop(); i--; }
      var total = chunk.reduce(function (a, x) { return a + x.u; }, 0), acc = 0, cut = chunk.length;
      for (var k = 0; k < chunk.length; k++) { acc += chunk[k].u; if (acc >= total / 2) { cut = k + 1; break; } }
      if (cut < chunk.length && cut > 1 && chunk[cut - 1] && chunk[cut - 1].g) cut--;
      var c1 = chunk.slice(0, cut), c2 = chunk.slice(cut);
      if (!c1.length) { c1 = c2; c2 = []; }
      if (c2.length && !c2[0].g && c2[0].gn) c2.unshift({ g: c2[0].gn + ' (продолжение)', u: 2.2 });
      pages.push([c1, c2]);
    }
    return pages;
  }
  function colHtml(items) {
    return '<div class="k2-col">' + items.map(function (x) {
      if (x.g) return '<div class="k2-g">' + esc(x.g) + '</div>';
      return x.r[0] === '•' ? '<div class="k2-row k2-row--note">• ' + esc(x.r[1]) + '</div>' : '<div class="k2-row"><u>' + esc(x.r[0]) + '</u><b>' + esc(x.r[1]) + '</b></div>';
    }).join('') + '</div>';
  }
  var COMPACT_MAX = 20;
  function isCompact(p) { return specRows(p).length <= COMPACT_MAX; }
  function specSets(p) { return isCompact(p) ? [] : specPageSets(p); }
  function pageCount(it) { return 1 + specSets(it.p).length; }
  function compactTable(p, used) {
    var seq = [];
    specGroups(p).forEach(function (g) {
      var rows = g.rows.filter(function (r) { return !used[r[0]]; });
      if (!rows.length) return;
      seq.push({ g: g.name });
      rows.forEach(function (r) { seq.push({ r: r }); });
    });
    if (!seq.length) return '';
    if (seq.length <= 8) return '<div class="k2-cols k2-cols--c k2-cols--one">' + colHtml(seq) + '</div>';
    var half = Math.ceil(seq.length / 2);
    if (seq[half - 1] && seq[half - 1].g) half--;
    var a = seq.slice(0, half), b = seq.slice(half);
    if (b.length && !b[0].g) { var gn = ''; for (var i = half - 1; i >= 0; i--) if (seq[i].g) { gn = seq[i].g; break; } b.unshift({ g: gn + ' (продолжение)' }); }
    return '<div class="k2-cols k2-cols--c">' + colHtml(a) + colHtml(b) + '</div>';
  }

  function productPages(it, meta, num, pageNo, total) {
    var p = it.p, ph = modelPhotos(it), img = ph.main, hl = highlights(p), sets = specSets(p), compact = isCompact(p);
    var thumbs = ph.thumbs.map(function (s) { return '<img src="' + esc(s) + '" alt="">'; }).join('');
    var cc = ['k2-c0', 'k2-c1', 'k2-c2', 'k2-c2', 'k2-c0', 'k2-c1'];
    var cards = hl.map(function (h, i) { return '<div class="k2-hl ' + cc[i] + '"><b>' + bigVal(h[1]) + '</b><span>' + esc(h[0]) + '</span></div>'; }).join('');
    var used = {}; hl.forEach(function (h) { used[h[0]] = 1; });
    var qr = specRows(p).filter(function (r) { return !used[r[0]] && r[0] !== '•' && String(r[1]).length < 34; }).slice(0, ph.thumbs.length ? 3 : 4);
    var quick = compact ? compactTable(p, used) : (qr.length ? '<div style="margin-top:12px">' + qr.map(function (r) { return '<div class="k2-row"><u>' + esc(r[0]) + '</u><b>' + esc(r[1]) + '</b></div>'; }).join('') + '</div>' : '');
    var sparse = specRows(p).length <= 4 && hl.length <= 2;
    var photo = '<div class="k2-photo' + (sparse ? ' k2-photo--xl' : '') + '">' + (img ? '<img src="' + esc(img) + '" alt="">' : '') + '</div>' + (thumbs ? '<div class="k2-thumbs">' + thumbs + '</div>' : '');
    var priced = p.price != null, u = priced ? unit(p) : 0;
    var dense = compact && specRows(p).length > 8;
    var html = sec(top(meta, num, pageNo, total) +
      '<div style="margin-top:20px"><span class="k2-pill">' + esc(catName(p.cat)) + '</span>' + (p.brand ? ' <span class="k2-pill k2-pill--blue">' + esc(p.brand) + '</span>' : '') + '</div>' +
      '<h1 class="k2-h1">' + esc(p.name) + '</h1>' + (p.sku ? '<div class="k2-sku">Артикул: ' + esc(p.sku) + '</div>' : '') +
      photo + (cards ? '<h2 class="k2-h2">Главное <span class="sc">о модели</span></h2><div class="k2-hls">' + cards + '</div>' : '') + (compact && quick ? '<h2 class="k2-h2" style="margin-top:' + (cards ? 16 : 22) + 'px">Характеристики</h2>' : '') + quick + (sparse ? '<div class="k2-more">Подробные технические данные в каталоге поставщика не указаны, уточним по запросу.</div>' : '') +
      (sets.length ? '<div class="k2-more">Все характеристики по группам: на следующей странице →</div>' : '') +
      '<div class="k2-price"><div><span>Стоимость за единицу</span><b' + (!priced && (p.priceLabel || '').length > 20 ? ' style="font-size:20px"' : '') + '>' + (priced ? moneyHtml(u, p.cur) : esc(p.priceLabel || 'Цена по запросу')) + '</b>' + (priced ? '<em>' + esc(moneyWords(u, p.cur)) + '</em>' : '') + '</div><div class="gap"></div>' +
      (it.qty > 1 && priced ? '<div style="text-align:right"><span>' + it.qty + ' шт.</span><b>' + moneyHtml(u * it.qty, p.cur) + '</b></div>' : '<div class="until">до ' + esc(meta.until) + '</div>') + '</div>' +
      foot(meta), dense ? 'k2--dense' : '');
    sets.forEach(function (pg, k) {
      html += sec(top(meta, num, pageNo + 1 + k, total) +
        '<div style="margin-top:20px"><span class="k2-pill">' + esc(p.brand || catName(p.cat)) + '</span></div>' +
        '<h2 class="k2-h1" style="font-size:28px">' + esc(p.name) + '</h2>' +
        '<h2 class="k2-h2" style="margin-top:6px">В деталях' + (k ? ' <span class="sc">(продолжение)</span>' : ' <span class="sc">характеристики</span>') + '</h2>' +
        '<div class="k2-cols">' + colHtml(pg[0]) + colHtml(pg[1]) + '</div>' + foot(meta));
    });
    return html;
  }

  /* ---------- финал: шаги, условия, контакты с QR ---------- */
  function closingPage(meta, num, pageNo, total) {
    var cs = contacts(meta);
    var terms = [['Условия оплаты', meta.pay], ['Условия поставки', meta.terms], ['Срок поставки', meta.time]].filter(function (t) { return t[1]; });
    var steps = STEPS.map(function (s, i) { return '<div class="k2-step"><i>' + (i + 1) + '</i><b>' + esc(s[0]) + '</b><p>' + esc(s[1]) + '</p></div>'; }).join('');
    function qrBlock(label, c) {
      return '<div class="k2-qr"><div class="qr" data-href="' + attr(c.url) + '"><img src="' + qrImg(c.url) + '" alt=""></div><div><span>' + label + '</span><b>' + linkA(c) + '</b></div></div>';
    }
    var left = '<div class="k2-me-l"><span>Предложение действует до ' + esc(meta.until) + '</span><b>' + esc(meta.manager || CFG.company.name) + '</b>' +
      (cs.phone ? '<div class="ph">' + linkA(cs.phone) + '</div>' : '') + '</div>';
    var right = (cs.tg ? qrBlock('Telegram', cs.tg) : '') + (cs.wa ? qrBlock('WhatsApp', cs.wa) : '');
    return sec('<div class="k2-top">' + logo() + '<div>КП № ' + esc(num) + ' · ' + pageNo + '/' + total + '</div></div>' +
      '<div class="k2-cover-h" style="top:120px;font-size:52px">Давайте <span class="sc">начнем</span></div>' +
      '<div style="position:absolute;left:48px;right:48px;top:290px"><div class="k2-steps">' + steps + '</div>' +
      (terms.length ? '<div class="k2-terms">' + terms.map(function (t) { return '<div class="k2-term"><span>' + esc(t[0]) + '</span><b>' + esc(t[1]) + '</b></div>'; }).join('') + '</div>' : '') + '</div>' +
      '<div class="k2-me">' + left + (right ? '<div class="k2-me-r">' + right + '</div>' : '') + '</div>', 'k2--cover');
  }

  var LIBS = ['https://cdnjs.cloudflare.com/ajax/libs/html-to-image/1.11.11/html-to-image.min.js', 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js', 'https://cdnjs.cloudflare.com/ajax/libs/qrcode-generator/1.4.4/qrcode.min.js'];
  function loadScript(src) {
    return new Promise(function (res, rej) {
      var s = document.createElement('script');
      s.src = src; s.onload = res; s.onerror = function () { rej(new Error('Не удалось загрузить генератор PDF (нужен интернет)')); };
      document.head.appendChild(s);
    });
  }
  function loadLib() {
    if (window.htmlToImage && window.jspdf && window.qrcode) return Promise.resolve();
    return Promise.all(LIBS.map(loadScript));
  }

  /* строка цены можно переопределить на этапе КП: it.price / it.cur */
  function effective(it) {
    var p = it.p;
    if (it.mode === 'req') p = Object.assign({}, p, { price: null, priceLabel: null });
    else if (it.mode === 'text') p = Object.assign({}, p, { price: null, priceLabel: String(it.text || '').trim() || null });
    else if (it.price != null && it.price !== '' && !isNaN(Number(it.price))) p = Object.assign({}, p, { price: Number(it.price), cur: it.cur || p.cur || 'RMB' });
    else if (it.cur && p.price != null) p = Object.assign({}, p, { cur: it.cur });
    return Object.assign({}, it, { p: p });
  }

  /* цены поставщиков (юани, доллары, евро) пересчитываются в рубли по курсам из формы; без курса цена остаётся в своей валюте */
  var RATE_SYM = { RMB: '¥', USD: '$', EUR: '€' };
  function toRub(it, rates, used) {
    var p = it.p, r = Number(rates && rates[p.cur]);
    if (p.price == null || !p.cur || p.cur === 'RUB' || !(r > 0)) return it;
    used[p.cur] = r;
    return Object.assign({}, it, { p: Object.assign({}, p, { price: p.price * r, cur: 'RUB' }) });
  }

  /* CSS шрифтов Google читать из страницы нельзя (чужой домен), поэтому качаем его сами и вшиваем шрифты в картинку (только кириллица и латиница) */
  var FONT_CSS = null;
  async function fontEmbed() {
    if (FONT_CSS !== null) return FONT_CSS;
    var out = '';
    try {
      var url = 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Caveat:wght@700&display=swap&subset=cyrillic';
      var css = await (await fetch(url)).text();
      var blocks = css.split('/*').slice(1).map(function (b) { return '/*' + b; }).filter(function (b) { return /^\/\*\s*(cyrillic|latin)\s*\*\//.test(b); });
      for (var i = 0; i < blocks.length; i++) {
        var m = /url\((https:[^)]+)\)/.exec(blocks[i]); if (!m) continue;
        var bl = await (await fetch(m[1])).blob();
        var d = await new Promise(function (res) { var fr = new FileReader(); fr.onload = function () { res(fr.result); }; fr.readAsDataURL(bl); });
        out += blocks[i].replace(m[0], 'url(' + d + ')');
      }
    } catch (e) { out = ''; }
    FONT_CSS = out;
    return out;
  }

  async function make(rawItems, meta) {
    await loadLib();
    var usedRates = {}; meta.usedRates = usedRates;
    var items = rawItems.map(effective).map(function (it) { return toRub(it, meta.rates, usedRates); });
    FEAT = pickFeatured(items, meta);
    var d = new Date(), until = new Date(d.getTime() + (meta.days || 7) * 864e5);
    var f = function (x) { return x.toLocaleDateString('ru-RU'); };
    meta.date = f(d); meta.until = f(until);
    MK = Number(meta.markup) || 0;
    var num = d.toISOString().slice(2, 10).replace(/-/g, '') + '-' + String(Math.floor(Math.random() * 900) + 100);
    var cmpN = cmpPageCount(items), total = 2 + summaryCount(items) + cmpN, html = '', n = 2 + summaryCount(items) + cmpN;
    items.forEach(function (it) { total += pageCount(it); });
    html += coverPage(items, meta, num) + summaryPages(items, meta, num, 2, total) + (cmpN ? comparePages(items, meta, num, 2 + summaryCount(items), total) : '');
    items.forEach(function (it) { html += productPages(it, meta, num, n, total); n += pageCount(it); });
    html += closingPage(meta, num, total, total);
    var el = document.createElement('div');
    el.className = 'kp-render';
    el.innerHTML = html;
    document.body.appendChild(el);
    /* шрифты грузим после вставки страниц: иначе html2canvas измеряет текст запасным шрифтом, и строки съезжают */
    if (document.fonts && document.fonts.load) {
      await Promise.all(['400', '500', '600', '700', '800'].map(function (w) { return document.fonts.load(w + ' 16px Inter', 'Аа Aa 0123'); }).concat([document.fonts.load('700 24px Caveat', 'Аа Aa')])).catch(function () {});
      await document.fonts.ready;
    }
    var name = '';
    try {
      await Promise.all(Array.prototype.map.call(el.querySelectorAll('img'), function (im) {
        return im.complete ? Promise.resolve() : new Promise(function (r) { im.onload = im.onerror = r; });
      }));
      Array.prototype.forEach.call(el.querySelectorAll('.k2-hero img'), function (im) {
        var ar = im.naturalWidth / (im.naturalHeight || 1);
        im.className = ar >= 1.0 && ar <= 1.85 ? 'fill' : 'fit';
      });
      name = 'КП_' + (items[0].p.name || 'модель').replace(/[^\wа-яА-Я\-]+/g, '_').slice(0, 40) + (items.length > 1 ? '_и_др' : '') + '_' + num + '.pdf';
      var pdf = new window.jspdf.jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait', compress: true });
      var pages = el.querySelectorAll('.k2'), k = 210 / 794, fontCSS = '';
      fontCSS = await fontEmbed();
      var cache = {};
      async function dataOf(src) {
        if (cache[src]) return cache[src];
        var r = await fetch(src), bl = await r.blob();
        cache[src] = await new Promise(function (res) { var fr = new FileReader(); fr.onload = function () { res(fr.result); }; fr.readAsDataURL(bl); });
        return cache[src];
      }
      for (var i = 0; i < pages.length; i++) {
        var pr = pages[i].getBoundingClientRect(), imgs = Array.prototype.slice.call(pages[i].querySelectorAll('img')), info = [];
        imgs = imgs.filter(function (im) { return !/^data:/.test(im.getAttribute('src') || ''); });
        imgs.forEach(function (im) {
          var r = im.getBoundingClientRect(), cs = getComputedStyle(im);
          info.push({ src: im.getAttribute('src'), x: r.left - pr.left, y: r.top - pr.top, w: r.width, h: r.height, fit: cs.objectFit, rad: parseFloat(cs.borderTopLeftRadius) || 0, nw: im.naturalWidth, nh: im.naturalHeight });
          im.style.visibility = 'hidden';
        });
        var canvas = await window.htmlToImage.toCanvas(pages[i], { pixelRatio: 2, width: 794, height: 1120, backgroundColor: '#12151a', fontEmbedCSS: fontCSS, cacheBust: false });
        imgs.forEach(function (im) { im.style.visibility = ''; });
        if (i) pdf.addPage();
        pdf.addImage(canvas.toDataURL('image/jpeg', 0.95), 'JPEG', 0, 0, 210, 210 * 1120 / 794, undefined, 'FAST');
        for (var q = 0; q < info.length; q++) {
          var m = info[q]; if (!m.w || !m.h || !m.nw) continue;
          var dx = m.x, dy = m.y, dw = m.w, dh = m.h;
          if (m.fit === 'cover') { var sc = Math.max(m.w / m.nw, m.h / m.nh); dw = m.nw * sc; dh = m.nh * sc; dx = m.x + (m.w - dw) / 2; dy = m.y + (m.h - dh) / 2; }
          else if (m.fit === 'contain') { var sc2 = Math.min(m.w / m.nw, m.h / m.nh); dw = m.nw * sc2; dh = m.nh * sc2; dx = m.x + (m.w - dw) / 2; dy = m.y + (m.h - dh) / 2; }
          var data = await dataOf(m.src);
          pdf.saveGraphicsState();
          if (m.rad > 0) { var rr = Math.min(m.rad, m.w / 2, m.h / 2) * k; pdf.roundedRect(m.x * k, m.y * k, m.w * k, m.h * k, rr, rr, null); pdf.clip(); pdf.discardPath(); }
          pdf.addImage(data, /^data:image\/png/.test(data) ? 'PNG' : 'JPEG', dx * k, dy * k, dw * k, dh * k, undefined, 'NONE');
          pdf.restoreGraphicsState();
        }
        Array.prototype.forEach.call(pages[i].querySelectorAll('[data-href]'), function (a) {
          var r = a.getBoundingClientRect();
          pdf.link((r.left - pr.left) * k, (r.top - pr.top) * k, r.width * k, r.height * k, { url: a.getAttribute('data-href') });
        });
      }
      pdf.save(name);
    } finally {
      document.body.removeChild(el);
    }
    return name;
  }

  return { make: make, _t: { words: words, moneyWords: moneyWords, normTg: normTg, normWa: normWa } };
})();
