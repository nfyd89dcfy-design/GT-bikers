/* Коммерческое предложение в PDF.
   Страницы КП собираются как обычный HTML (A4), html2canvas делает из них картинки, jsPDF складывает в PDF прямо в браузере.
   Кириллица и фото работают без дополнительных шрифтов. */
window.KP = (function () {
  var CFG = window.CFG;
  var CURSYM = { USD: '$', RMB: '¥', RUB: '₽', EUR: '€' };

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  var MK = 0; // наценка, % (задаётся при формировании КП)
  function unit(p) { return Math.round(p.price * (1 + MK / 100)); }
  function money(p) {
    if (p.price == null || p.price === '') return 'Цена по запросу';
    return unit(p).toLocaleString('ru-RU') + ' ' + (CURSYM[p.cur] || p.cur || '');
  }
  function fieldVal(p, f) {
    var v = p[f.key];
    if (v == null || v === '' || (Array.isArray(v) && !v.length)) return null;
    if (f.type === 'bool') return v ? 'Да' : 'Нет';
    if (Array.isArray(v)) return v.join(', ');
    if (f.type === 'number') return Number(v).toLocaleString('ru-RU') + (f.unit ? ' ' + f.unit : '');
    return v;
  }
  function specRows(p) {
    var rows = [], skip = { brand: 1, cur: 1, price: 1 };
    CFG.fields.forEach(function (f) {
      if (skip[f.key]) return;
      var v = fieldVal(p, f);
      if (v != null) rows.push([f.label + (f.unit && f.type !== 'number' ? ', ' + f.unit : ''), v]);
    });
    (p.extra || []).forEach(function (r) { if (!/цен|доплат|артикул|контейнер|описание поставщика|серия/i.test(r[0])) rows.push([r[0], r[1]]); });
    return rows;
  }
  function highlights(p) {
    var keys = ['power_kw', 'power_hp', 'engine_cc', 'top_speed', 'range_km', 'battery_wh', 'removable_battery', 'seats', 'max_load_kg', 'drivetrain', 'weight_kg', 'gear_type'];
    var out = [];
    keys.forEach(function (k) {
      var f = CFG.fields.filter(function (x) { return x.key === k; })[0];
      var v = f && fieldVal(p, f);
      if (v != null && out.length < 6) out.push([f.label, v]);
    });
    return out;
  }
  function catName(id) { var c = CFG.categories.filter(function (x) { return x.id === id; })[0]; return c ? c.name : ''; }

  function head(meta, num, pageNo, total) {
    return '<div class="kpp-head"><div class="kpp-brand"><span class="kpp-mark"></span>' + esc(CFG.company.name) + '</div>' +
      '<div class="kpp-meta">Коммерческое предложение № ' + esc(num) + '<br>' + esc(meta.date) + (total > 1 ? ' · стр. ' + pageNo + '/' + total : '') + '</div></div>';
  }
  function foot(meta) {
    var bits = [];
    if (meta.manager) bits.push('Менеджер: ' + esc(meta.manager));
    if (meta.contact) bits.push(esc(meta.contact));
    if (CFG.company.phone) bits.push(esc(CFG.company.phone));
    if (CFG.company.email) bits.push(esc(CFG.company.email));
    return '<div class="kpp-foot"><span>' + bits.join(' · ') + '</span><span>Предложение действительно до ' + esc(meta.until) + '</span></div>';
  }

  function productPage(it, meta, num, pageNo, total) {
    var p = it.p, img = (p.images && p.images[0]) || '';
    var hl = highlights(p).map(function (h) { return '<div class="kpp-hl"><b>' + esc(h[1]) + '</b><span>' + esc(h[0]) + '</span></div>'; }).join('');
    var rows = specRows(p).slice(0, 13).map(function (r) { return '<tr><td>' + esc(r[0]) + '</td><td>' + esc(r[1]) + '</td></tr>'; }).join('');
    var thumbs = (p.images || []).slice(1, 4).map(function (s) { return '<img src="' + esc(s) + '" alt="">'; }).join('');
    return '<section class="kpp">' + head(meta, num, pageNo, total) +
      (meta.client ? '<div class="kpp-client">Для: <b>' + esc(meta.client) + '</b></div>' : '') +
      '<div class="kpp-cat">' + esc(catName(p.cat)) + (p.brand ? ' · ' + esc(p.brand) : '') + '</div>' +
      '<h1>' + esc(p.name) + '</h1>' + (p.sku ? '<div class="kpp-sku">Артикул: ' + esc(p.sku) + '</div>' : '') +
      '<div class="kpp-photo">' + (img ? '<img src="' + esc(img) + '" alt="">' : '') + '</div>' +
      (thumbs ? '<div class="kpp-thumbs">' + thumbs + '</div>' : '') +
      '<div class="kpp-hls">' + hl + '</div>' +
      '<table class="kpp-spec">' + rows + '</table>' +
      '<div class="kpp-price"><div><span>Стоимость за единицу</span><b>' + esc(money(p)) + '</b></div>' +
      (it.qty > 1 && p.price != null ? '<div><span>' + it.qty + ' шт.</span><b>' + esc((unit(p) * it.qty).toLocaleString('ru-RU') + ' ' + (CURSYM[p.cur] || p.cur || '')) + '</b></div>' : '') + '</div>' +
      foot(meta) + '</section>';
  }

  function summaryPage(items, meta, num, total) {
    var sums = {};
    var rows = items.map(function (it, i) {
      var p = it.p, line = p.price != null ? unit(p) * it.qty : null;
      if (line != null) sums[p.cur || ''] = (sums[p.cur || ''] || 0) + line;
      return '<tr><td>' + (i + 1) + '</td><td>' + (p.images && p.images[0] ? '<img src="' + esc(p.images[0]) + '" alt="">' : '') + '</td><td><b>' + esc(p.name) + '</b><br><small>' + esc(p.brand || '') + (p.sku ? ' · ' + esc(p.sku) : '') + '</small></td><td>' + it.qty + '</td><td>' + esc(money(p)) + '</td><td>' + (line != null ? esc(line.toLocaleString('ru-RU') + ' ' + (CURSYM[p.cur] || p.cur || '')) : '—') + '</td></tr>';
    }).join('');
    var tot = Object.keys(sums).map(function (c) { return '<b>' + esc(sums[c].toLocaleString('ru-RU') + ' ' + (CURSYM[c] || c)) + '</b>'; }).join(' + ');
    return '<section class="kpp">' + head(meta, num, 1, total) +
      (meta.client ? '<div class="kpp-client">Для: <b>' + esc(meta.client) + '</b></div>' : '') +
      '<h1>Состав предложения</h1><table class="kpp-sum"><tr><th>№</th><th></th><th>Модель</th><th>Кол-во</th><th>Цена</th><th>Сумма</th></tr>' + rows + '</table>' +
      '<div class="kpp-price"><div><span>Итого</span>' + (tot || '<b>по запросу</b>') + '</div></div>' + foot(meta) + '</section>';
  }

  var LIBS = ['https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js', 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js'];
  function loadScript(src) {
    return new Promise(function (res, rej) {
      var s = document.createElement('script');
      s.src = src; s.onload = res; s.onerror = function () { rej(new Error('Не удалось загрузить генератор PDF (нужен интернет)')); };
      document.head.appendChild(s);
    });
  }
  function loadLib() {
    if (window.html2canvas && window.jspdf) return Promise.resolve();
    return Promise.all(LIBS.map(loadScript));
  }

  async function make(items, meta) {
    await loadLib();
    if (document.fonts && document.fonts.ready) await document.fonts.ready;
    var d = new Date(), until = new Date(d.getTime() + (meta.days || 7) * 864e5);
    var fmt = function (x) { return x.toLocaleDateString('ru-RU'); };
    meta.date = fmt(d); meta.until = fmt(until);
    MK = Number(meta.markup) || 0;
    var num = d.toISOString().slice(2, 10).replace(/-/g, '') + '-' + String(Math.floor(Math.random() * 900) + 100);
    var multi = items.length > 1, total = items.length + (multi ? 1 : 0), html = '', n = 1;
    if (multi) html += summaryPage(items, meta, num, total), n = 2;
    items.forEach(function (it) { html += productPage(it, meta, num, n++, total); });
    var el = document.createElement('div');
    el.className = 'kp-render';
    el.innerHTML = html;
    document.body.appendChild(el);
    try {
      await Promise.all(Array.prototype.map.call(el.querySelectorAll('img'), function (im) {
        return im.complete ? Promise.resolve() : new Promise(function (r) { im.onload = im.onerror = r; });
      }));
      var name = 'КП_' + (items[0].p.name || 'модель').replace(/[^\wа-яА-Я\-]+/g, '_').slice(0, 40) + (multi ? '_и_др' : '') + '_' + num + '.pdf';
      var pdf = new window.jspdf.jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });
      var pages = el.querySelectorAll('.kpp');
      for (var i = 0; i < pages.length; i++) {
        var canvas = await window.html2canvas(pages[i], { scale: 2, useCORS: true, backgroundColor: '#ffffff', width: 794, height: 1120, scrollX: 0, scrollY: 0, windowWidth: 794 });
        if (i) pdf.addPage();
        pdf.addImage(canvas.toDataURL('image/jpeg', 0.92), 'JPEG', 0, 0, 210, 210 * 1120 / 794);
      }
      pdf.save(name);
    } finally {
      document.body.removeChild(el);
    }
    return name;
  }

  return { make: make };
})();
