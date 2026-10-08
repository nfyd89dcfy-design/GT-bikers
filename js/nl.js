/* AI-поиск: превращает запрос на русском в набор фильтров.
   Работает прямо в браузере, без сервера и ключей. Разбор правилами:
   категория, числа с единицами (мощность, скорость, запас хода, цена…), да/нет-признаки,
   бренды и значения списков. Результат показывается чипами, их можно убрать или поправить. */
window.NL = (function () {
  var CFG = window.CFG;
  var norm = function (s) { return String(s).toLowerCase().replace(/ё/g, 'е'); };
  var F = {};
  CFG.fields.forEach(function (f) { F[f.key] = f; });

  var DIR_MIN = /^(от|не менее|не меньше|более|больше|свыше|минимум|быстрее|мощнее|выше|>=|>|≥)$/;
  var DIR_MAX = /^(до|не более|не больше|менее|меньше|максимум|дешевле|легче|ниже|<=|<|≤)$/;

  var CATS = [
    ['ebike-sport', /спортивн|спорт\b|быстр[а-я]+ электро/],
    ['ebike-city', /городск|сити|для города|комфорт/],
    ['ebike-enduro', /эндуро|кросс|внедорожн[а-я]* электро|электро[а-я]* внедорож/],
    ['moto', /мотоцикл|мото\b|мотик|питбайк|скутер/],
    ['quad', /квадр|атв\b|atv\b/],
    ['utv', /багги|utv\b|юти?ви|фермер|side.?by.?side/],
    ['golf', /гольф|экскурс|туристическ[а-я]* (машин|авто|вагон)|мини.?автобус|сафари/],
    ['car', /мини.?машин|электромобил|электрокар|автомобил/],
    ['snow', /снегоход|снежн|буксировщик|снег\b/],
    ['gear', /экипиров|шлем|очки|маск[а-я]* (кросс|мото)|перчат|куртк|джерси|штаны|ботинк|обувь|рюкзак|гидропак|защит/],
    ['parts', /запчаст|аксессуар|фильтр|руль|пластик|накладк/]
  ];

  var STOP = /^(и|в|на|с|со|для|по|от|до|не|или|а|но|как|что|мне|нужн[а-я]*|нужен|хочу|надо|подбери|подобрать|покажи|найди|модель|модели|техника|клиент[а-я]*|который|которая|которые|чтобы|был|была|было|были|есть|без|при|под|над|из|за|у|к|о|об|то|же|бы|ли)$/;

  var UNIT = '(тыс\\.?|тысяч[а-я]*|млн|квт|kw|вт|w|л\\.?\\s?с\\.?|лс|hp|см3|см³|куб[а-я]*|cc|км\\/ч|км|кг|л|в|v|а·ч|ач|ah|вт·ч|втч|wh|ч|час[а-я]*|мест[а-я]*|местн[а-я]*|\\$|usd|долл[а-я]*|руб[а-я]*|₽|р|rmb|юан[а-я]*|¥|eur|евро|€|к|k)';
  var NUM = '(\\d+(?:[ \\u00a0]\\d{3})*(?:[.,]\\d+)?)';
  var DIR = '(от|до|не менее|не более|не меньше|не больше|более|менее|больше|меньше|свыше|минимум|максимум|дешевле|быстрее|мощнее|легче|выше|ниже|>=|<=|>|<|≥|≤)';
  var CURW = '(\\$|usd|долл[а-я]*|руб[а-я]*|₽|rmb|юан[а-я]*|¥|eur|евро|€)';
  var RX = new RegExp('(?:' + DIR + '\\s*)?' + NUM + '\\s*' + UNIT + '?(?:\\s*' + CURW + ')?(?![a-zа-я0-9])(\\+)?', 'g');

  function fieldByKw(text, from, to) {
    // ближайшее ключевое слово поля слева (до 22 символов) или справа (до 18)
    var best = null, bestD = 99;
    CFG.fields.forEach(function (f) {
      if (!f.kw || f.type !== 'number') return;
      f.kw.forEach(function (k) {
        var i = text.lastIndexOf(k, from);
        if (i >= 0 && i < from && from - (i + k.length) <= 22 && from - (i + k.length) < bestD) { best = f.key; bestD = from - (i + k.length); }
        var j = text.indexOf(k, to);
        if (j >= 0 && j - to <= 18 && j - to < bestD) { best = f.key; bestD = j - to; }
      });
    });
    return best;
  }

  function parse(raw, products) {
    var text = norm(raw);
    var res = { cats: [], ranges: {}, enums: {}, bools: {}, q: '', chips: [] };
    var used = [];

    // категории
    CATS.forEach(function (c) { if (c[1].test(text)) res.cats.push(c[0]); });
    if (!res.cats.length || (res.cats.indexOf('moto') >= 0 && res.cats.length === 1 && /электро/.test(text))) {
      if (/электро[а-я]*\s*(байк|мото|скутер|велосипед|двухколес)|электробайк|электромот|e-?bike/.test(text)) {
        res.cats = res.cats.filter(function (c) { return c !== 'moto'; });
        if (!res.cats.some(function (c) { return /^ebike/.test(c); })) res.cats.push('ebike-sport', 'ebike-city', 'ebike-enduro');
      }
    }
    if (/электро/.test(text) && res.cats.indexOf('moto') >= 0 && res.cats.length > 1) res.cats = res.cats.filter(function (c) { return c !== 'moto'; });

    // числа с единицами
    var m;
    RX.lastIndex = 0;
    while ((m = RX.exec(text))) {
      if (m[0].trim() === '') { RX.lastIndex++; continue; }
      var dir = m[1] || '', num = parseFloat(m[2].replace(/[  ]/g, '').replace(',', '.')), unit = (m[3] || '').trim(), plus = !!m[5], curw = (m[4] || '').trim();
      if (isNaN(num)) continue;
      var key = null, cur = null, val = num;
      var u = unit.replace(/\s/g, '');
      if (curw) { cur = /^(\$|usd|долл)/.test(curw) ? 'USD' : /^(руб|₽)/.test(curw) ? 'RUB' : /^(rmb|юан|¥)/.test(curw) ? 'RMB' : 'EUR'; if (!u || /^(тыс|тысяч|млн|к|k)$/.test(u)) { key = 'price'; if (!u) u = '#'; } }
      if (key === 'price' && u === '#') { /* валюта указана словом */ }
      else if (/^(тыс|тысяч)/.test(u)) { val = num * 1000; key = 'price'; }
      else if (u === 'млн') { val = num * 1e6; key = 'price'; }
      else if (u === 'к' || u === 'k') { val = num * 1000; key = 'price'; }
      else if (/^(квт|kw)$/.test(u)) key = 'power_kw';
      else if (/^(вт|w)$/.test(u)) { key = 'power_kw'; val = num / 1000; }
      else if (/^(л\.?с\.?|лс|hp)$/.test(u)) key = 'power_hp';
      else if (/^(см3|см³|куб|cc)/.test(u)) key = 'engine_cc';
      else if (u === 'км/ч') key = 'top_speed';
      else if (u === 'км') key = 'range_km';
      else if (u === 'кг') key = /груз|нагруз|выдерж|вез/.test(text.slice(Math.max(0, m.index - 26), m.index)) ? 'max_load_kg' : 'weight_kg';
      else if (u === 'л') key = 'fuel_tank_l';
      else if (u === 'в' || u === 'v') key = 'battery_v';
      else if (/^(а·ч|ач|ah)$/.test(u)) key = 'battery_ah';
      else if (/^(вт·ч|втч|wh)$/.test(u)) key = 'battery_wh';
      else if (/^(ч|час)/.test(u)) key = 'charge_h';
      else if (/^мест/.test(u)) key = 'seats';
      else if (/^(\$|usd|долл)/.test(u)) { key = 'price'; cur = 'USD'; }
      else if (/^(руб|₽|р)/.test(u)) { key = 'price'; cur = 'RUB'; }
      else if (/^(rmb|юан|¥)/.test(u)) { key = 'price'; cur = 'RMB'; }
      else if (/^(eur|евро|€)/.test(u)) { key = 'price'; cur = 'EUR'; }
      if (!key) key = fieldByKw(text, m.index, m.index + m[0].length);
      if (!key) continue;
      if (key === 'price' && val < 20 && !cur) continue; // «2 места», «4x4» и т.п.
      var d = DIR_MIN.test(dir) ? 'min' : DIR_MAX.test(dir) ? 'max' : plus ? 'min' : (key === 'price' || key === 'weight_kg' || key === 'charge_h' ? 'max' : 'min');
      var r = res.ranges[key] || (res.ranges[key] = {});
      if (key === 'seats' && !dir && !plus) { r.min = val; r.max = val; } else r[d] = val;
      if (cur) res.enums.cur = [cur];
      used.push([m.index, m.index + m[0].length]);
    }

    // да/нет
    if (/(съемн|сменн|извлекаем)/.test(text) && /(акк|батаре)/.test(text)) res.bools.removable_battery = true;

    // значения списков по алиасам и точным названиям
    CFG.fields.forEach(function (f) {
      if (f.type !== 'enum' && f.type !== 'multi') return;
      if (f.key === 'brand' || f.key === 'cur') return;
      var hits = [];
      if (f.alias) Object.keys(f.alias).forEach(function (val) {
        f.alias[val].forEach(function (a) { if (text.indexOf(a) >= 0 && hits.indexOf(val) < 0) hits.push(val); });
      });
      if (hits.length) res.enums[f.key] = hits;
    });
    // бренды из данных
    if (products) {
      var seen = {};
      products.forEach(function (p) {
        if (!p.brand || seen[p.brand]) return;
        seen[p.brand] = 1;
        var b = norm(p.brand);
        if (b.length >= 3 && text.indexOf(b) >= 0) (res.enums.brand = res.enums.brand || []).push(p.brand);
      });
    }

    // остаток текста → поисковая строка
    var rest = text;
    used.sort(function (a, b) { return b[0] - a[0]; }).forEach(function (u) { rest = rest.slice(0, u[0]) + ' ' + rest.slice(u[1]); });
    var words = rest.split(/[^a-zа-я0-9\-]+/).filter(function (w) { return w.length >= 3 && !STOP.test(w); });
    CATS.forEach(function (c) { words = words.filter(function (w) { return !c[1].test(w); }); });
    words = words.filter(function (w) {
      return !/^(съемн|сменн|акк|батаре|мощност|скорост|запас|ход|вес|цен|привод|объем|объём|электро|байк|электробайк|пробег|дальност|нагрузк|бюджет|кроме|только|быстр|мест|размер|бензин|двс|электр)/.test(w);
    });
    res.q = words.join(' ');
    return res;
  }

  var EXAMPLES = [
    'электробайк от 5 кВт, съёмный аккумулятор, запас хода от 80 км',
    'квадроцикл 4x4 от 300 кубов до 150000 юаней',
    'гольфкар 4 места',
    'снегоход до 300 кг',
    'городской электробайк до 3000 $ скорость от 60'
  ];

  return { parse: parse, examples: EXAMPLES };
})();
