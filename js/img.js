/* Поиск по фото-референсу.
   Основной режим: нейросеть CLIP работает прямо в браузере (transformers.js), ничего никуда не отправляется.
   Векторы каталога считаются заранее (tools/build-embeddings.mjs → data/embeddings.js).
   Если нейросеть не загрузилась (нет интернета), включается запасной режим: сходство по цветам и композиции. */
window.IMG = (function () {
  var TF_URL = 'https://cdn.jsdelivr.net/npm/@xenova/transformers@2.17.2';
  var MODEL = 'Xenova/clip-vit-base-patch32';
  var tf = null, processor = null, model = null, modelFailed = false;
  var index = null; // [{id, path, v: Float32Array}]
  var indexMode = null;

  function b64ToVec(b64) {
    var bin = atob(b64), n = bin.length, out = new Float32Array(n), s = 0, i;
    for (i = 0; i < n; i++) { var x = bin.charCodeAt(i); if (x > 127) x -= 256; out[i] = x / 127; s += out[i] * out[i]; }
    s = Math.sqrt(s) || 1;
    for (i = 0; i < n; i++) out[i] /= s;
    return out;
  }
  function dot(a, b) { var s = 0; for (var i = 0; i < a.length; i++) s += a[i] * b[i]; return s; }

  function loadImage(src) {
    return new Promise(function (res, rej) {
      var im = new Image();
      im.crossOrigin = 'anonymous';
      im.onload = function () { res(im); };
      im.onerror = function () { rej(new Error('не удалось загрузить изображение')); };
      im.src = src;
    });
  }
  function toCanvas(im, max) {
    var w = im.naturalWidth || im.width, h = im.naturalHeight || im.height, k = Math.min(1, max / Math.max(w, h));
    var c = document.createElement('canvas');
    c.width = Math.max(1, Math.round(w * k)); c.height = Math.max(1, Math.round(h * k));
    var g = c.getContext('2d', { willReadFrequently: true });
    g.fillStyle = '#fff'; g.fillRect(0, 0, c.width, c.height);
    g.drawImage(im, 0, 0, c.width, c.height);
    return c;
  }

  /* запасной режим: цветовая гистограмма 2x2 областей */
  function histVec(canvas) {
    var c = document.createElement('canvas'); c.width = 48; c.height = 48;
    var g = c.getContext('2d', { willReadFrequently: true });
    g.drawImage(canvas, 0, 0, 48, 48);
    var d = g.getImageData(0, 0, 48, 48).data, out = new Float32Array(4 * 64);
    for (var y = 0; y < 48; y++) for (var x = 0; x < 48; x++) {
      var i = (y * 48 + x) * 4, q = (y < 24 ? 0 : 2) + (x < 24 ? 0 : 1);
      var bin = (d[i] >> 6) * 16 + (d[i + 1] >> 6) * 4 + (d[i + 2] >> 6);
      out[q * 64 + bin] += 1;
    }
    var s = 0, k;
    for (k = 0; k < out.length; k++) { out[k] = Math.sqrt(out[k]); s += out[k] * out[k]; }
    s = Math.sqrt(s) || 1;
    for (k = 0; k < out.length; k++) out[k] /= s;
    return out;
  }

  async function loadModel(onStatus) {
    if (model) return true;
    if (modelFailed) return false;
    try {
      onStatus && onStatus('Загружаю нейросеть CLIP (один раз, ~90 МБ)…');
      tf = await import(TF_URL);
      tf.env.allowLocalModels = false;
      processor = await tf.AutoProcessor.from_pretrained(MODEL);
      model = await tf.CLIPVisionModelWithProjection.from_pretrained(MODEL);
      return true;
    } catch (e) {
      console.warn('CLIP не загрузился', e);
      modelFailed = true;
      return false;
    }
  }
  async function clipVec(canvas) {
    var ctx = canvas.getContext('2d');
    var id = ctx.getImageData(0, 0, canvas.width, canvas.height);
    var img = new tf.RawImage(new Uint8ClampedArray(id.data), canvas.width, canvas.height, 4).rgb();
    var inputs = await processor(img);
    var out = await model(inputs);
    var v = Float32Array.from(out.image_embeds.data), s = 0, i;
    for (i = 0; i < v.length; i++) s += v[i] * v[i];
    s = Math.sqrt(s) || 1;
    for (i = 0; i < v.length; i++) v[i] /= s;
    return v;
  }

  async function ensureIndex(products, onStatus) {
    if (index) return;
    if (window.EMBEDDINGS && window.EMBEDDINGS.items && window.EMBEDDINGS.items.length) {
      var byPath = {};
      products.forEach(function (p) { (p.images || []).forEach(function (im) { (byPath[im] = byPath[im] || []).push(p.id); }); });
      index = [];
      window.EMBEDDINGS.items.forEach(function (it) {
        var ids = byPath[it.p]; if (!ids) return;
        var v = b64ToVec(it.v);
        ids.forEach(function (id) { index.push({ id: id, path: it.p, v: v }); });
      });
      indexMode = 'clip';
      return;
    }
    // векторов нет — считаем цветовые признаки (быстро) для первых фото
    var list = [];
    products.forEach(function (p) { if (p.images && p.images[0]) list.push({ id: p.id, path: p.images[0] }); });
    index = [];
    for (var i = 0; i < list.length; i++) {
      if (i % 25 === 0) onStatus && onStatus('Индексирую каталог… ' + i + ' из ' + list.length);
      try {
        var im = await loadImage(list[i].path);
        index.push({ id: list[i].id, path: list[i].path, v: histVec(toCanvas(im, 96)) });
      } catch (e) { /* пропускаем битые фото */ }
    }
    indexMode = 'hist';
  }

  var embedded = {};
  async function embedMissing(products, onStatus) {
    var have = {}; index.forEach(function (it) { have[it.path] = 1; });
    var todo = [];
    products.forEach(function (p) { (p.images || []).slice(0, 3).forEach(function (im) { if (!have[im] && !embedded[im]) todo.push([p.id, im]); }); });
    for (var i = 0; i < todo.length; i++) {
      onStatus && onStatus('Индексирую новые фото каталога… ' + (i + 1) + ' из ' + todo.length);
      try {
        var img = await loadImage(todo[i][1]);
        var v = await clipVec(toCanvas(img, 448));
        index.push({ id: todo[i][0], path: todo[i][1], v: v });
      } catch (e) { /* пропускаем */ }
      embedded[todo[i][1]] = 1;
    }
  }

  async function search(source, products, onStatus, k) {
    await ensureIndex(products, onStatus);
    var im = await loadImage(source);
    var canvas = toCanvas(im, 448), mode = indexMode, q;
    if (indexMode === 'clip') {
      var ok = await loadModel(onStatus);
      if (ok) { await embedMissing(products, onStatus); onStatus && onStatus('Анализирую фото…'); q = await clipVec(canvas); }
      else {
        // нейросеть недоступна: строим цветовой индекс заново
        index = null; window.EMBEDDINGS = null; await ensureIndex(products, onStatus);
        mode = 'hist'; q = histVec(canvas);
      }
    } else q = histVec(canvas);
    var best = {};
    index.forEach(function (it) {
      var s = dot(q, it.v);
      if (!(it.id in best) || s > best[it.id].s) best[it.id] = { id: it.id, s: s, path: it.path };
    });
    var arr = Object.keys(best).map(function (id) { return best[id]; }).sort(function (a, b) { return b.s - a.s; }).slice(0, k || 12);
    return { mode: mode, results: arr };
  }

  return { search: search };
})();
