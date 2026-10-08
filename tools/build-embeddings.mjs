// Считает векторы CLIP для всех фото каталога → data/embeddings.js (нужно для поиска по фото).
// Запуск: cd tools && npm install && node build-embeddings.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { AutoProcessor, CLIPVisionModelWithProjection, RawImage, env } from '@xenova/transformers';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const src = fs.readFileSync(path.join(root, 'data/products.js'), 'utf8');
const products = JSON.parse(src.slice(src.indexOf('['), src.lastIndexOf(']') + 1));
const files = [...new Set(products.flatMap(p => p.images || []))];
env.allowLocalModels = false;
const M = 'Xenova/clip-vit-base-patch32';
const processor = await AutoProcessor.from_pretrained(M);
const model = await CLIPVisionModelWithProjection.from_pretrained(M);

const items = [];
let n = 0;
for (const f of files) {
  try {
    const img = await RawImage.read(path.join(root, f));
    const out = await model(await processor(img));
    const v = Float32Array.from(out.image_embeds.data);
    let s = 0; for (const x of v) s += x * x; s = Math.sqrt(s) || 1;
    const q = Buffer.from(Int8Array.from(v, x => Math.max(-127, Math.min(127, Math.round(x / s * 127 * 3)))).buffer).toString('base64');
    items.push({ p: f, v: q });
  } catch (e) { console.error('пропуск', f, e.message); }
  if (++n % 100 === 0) console.log(n, '/', files.length);
}
fs.writeFileSync(path.join(root, 'data/embeddings.js'), '/* Сгенерировано tools/build-embeddings.mjs */\nwindow.EMBEDDINGS = ' + JSON.stringify({ model: M, items }) + ';\n');
console.log('готово', items.length);
