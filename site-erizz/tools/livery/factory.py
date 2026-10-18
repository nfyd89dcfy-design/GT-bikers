"""Развертка для завода: схема каждой модели с выносками и таблица наклеек в мм."""
import json, math, os
from PIL import Image, ImageDraw
import livery
from livery import font, ACC

META = json.load(open('meta.json'))
MODELS = [('02', 'GT Spark 14', 'spark', '07'), ('10', 'GT Send 19 R', 'send', '19'), ('12', 'GT Send 19 Factory', 'send', '01'), ('16', 'GT Pulse 17', 'pulse', '17')]
PANT = {'spark': 'Pantone 283 C', 'send': 'Pantone 172 C', 'pulse': 'Pantone 2728 C', 'ridge': 'Pantone 7427 C'}
HEX = {k: '#%02X%02X%02X' % v for k, v in ACC.items()}
os.makedirs('factory', exist_ok=True)
rows_all = {}
for n, name, ser, num in MODELS:
    im = livery.render(n, 'hybrid', ACC[ser], num, 'flat'); m = dict(livery.META)
    pxmm = 0.54 * META[n]['scale']
    bb = im.getbbox(); pad = 70
    W, H = bb[2] - bb[0] + pad * 2, bb[3] - bb[1] + pad * 2
    cv = Image.new('RGBA', (W, H), (255, 255, 255, 255)); cv.alpha_composite(im.crop(bb), (pad, pad))
    d = ImageDraw.Draw(cv); f = font('archivo', 30)
    def at(x, y): return x - bb[0] + pad, y - bb[1] + pad
    items = []
    if 'mark' in m: items.append(('1', 'Знак GT', at(m['mark'][0], m['mark'][1]), f"{m['mark'][2]/pxmm:.0f} × {m['mark'][3]/pxmm:.0f}"))
    if 'line' in m:
        x0, y0, x1, y1, t = m['line']; cx, cy = (x0 + x1) / 2, (y0 + y1) / 2
        items.append(('2', 'Линия серии', at(cx + (x1 - x0) * .2, cy - (y0 - y1) * .2 + t), f"ширина {t/pxmm:.0f}"))
    if 'num_side' in m: items.append(('3', 'Номер сбоку', at(m['num_side'][0], m['num_side'][1]), f"{m['num_side'][2]/pxmm:.0f} × {m['num_side'][3]/pxmm:.0f}"))
    if 'num_front' in m: items.append(('4', 'Номер спереди', at(m['num_front'][0], m['num_front'][1]), f"{m['num_front'][2]/pxmm:.0f} × {m['num_front'][3]/pxmm:.0f}"))
    if 'tuning' in m: items.append(('5', 'Плашка GT TUNING', at(m['tuning'][0], m['tuning'][1]), f"{m['tuning'][2]/pxmm:.0f} × {m['tuning'][3]/pxmm:.0f}"))
    # выноски: кружок с номером над/под элементом
    for i, (no, lab, (x, y), size) in enumerate(items):
        ox, oy = x + (60 if i % 2 else -60), y - 90 if y > H * .35 else y + 90
        ox = min(max(ox, 30), W - 30); oy = min(max(oy, 30), H - 30)
        d.line([(x, y), (ox, oy)], fill=(14, 16, 19, 255), width=3)
        d.ellipse([x - 7, y - 7, x + 7, y + 7], fill=(14, 16, 19, 255))
        d.ellipse([ox - 24, oy - 24, ox + 24, oy + 24], fill=(14, 16, 19, 255))
        d.text((ox, oy + 1), no, font=f, fill=(255, 255, 255, 255), anchor='mm')
    cv.convert('RGB').save(f'factory/{n}.png')
    rows_all[n] = dict(name=name, ser=ser, items=[(no, lab, size) for no, lab, _, size in items])
json.dump(dict(rows=rows_all, hex=HEX, pant=PANT), open('factory/data.json', 'w'), ensure_ascii=False)
print(json.dumps(rows_all, ensure_ascii=False)[:800])
