"""Ливреи GT: плоская схема и фото-макет на реальных байках.
Зоны пластика заданы полигонами в нормализованных координатах (ширина 1400), см. zones.py."""
import sys, math, random
import numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageFilter, ImageChops
sys.path.insert(0, '.')
from zones import Z, GC
import os

F = 'fonts/'
INK, GRAPH, FROST, WHITE = (14, 16, 19), (34, 38, 45), (238, 241, 244), (246, 247, 248)
ACC = {'spark': (156, 201, 255), 'send': (255, 74, 43), 'ridge': (176, 40, 63), 'pulse': (42, 91, 215)}
SS = 2  # суперсэмплинг для гладких краев


def font(name, size):
    return ImageFont.truetype(F + name + '.ttf', int(size))


# ------------------------------------------------------------------ знак GT (вариант 4 «Спорт»)
def gt_mark(h, frame=WHITE, g=WHITE, t=ACC['send']):
    """Квадратная рамка, G внутри, T выходит за рамку справа внизу и вырезает рамку."""
    s = h / 262
    W, H = int(240 * s) + 4, int(262 * s) + 4
    fG, fT = font('archivo', 150 * s), font('archivo', 132 * s)
    def T_layer(stroke=0):
        L = Image.new('L', (W, H), 0); d = ImageDraw.Draw(L)
        d.text((170 * s, 236 * s), 'T', font=fT, fill=255, anchor='ms', stroke_width=int(stroke), stroke_fill=255)
        return L
    knock = T_layer(7 * s)
    frameL = Image.new('L', (W, H), 0); d = ImageDraw.Draw(frameL)
    sw = 12 * s
    d.rectangle([22 * s, 22 * s, 200 * s, 200 * s], outline=255, width=max(1, int(sw)))
    gL = Image.new('L', (W, H), 0); ImageDraw.Draw(gL).text((100 * s, 160 * s), 'G', font=fG, fill=255, anchor='ms')
    frameL = ImageChops.subtract(frameL, knock); gL = ImageChops.subtract(gL, knock)
    out = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    for L, c in ((frameL, frame), (gL, g), (T_layer(), t)):
        out.paste(Image.new('RGBA', (W, H), c + (255,)), (0, 0), L)
    return out


# ------------------------------------------------------------------ утилиты
def poly_mask(size, polys, k=SS, blur=0):
    W, H = size
    L = Image.new('L', (W * k, H * k), 0); d = ImageDraw.Draw(L)
    for p in polys:
        d.polygon([(x * k, y * k) for x, y in p], fill=255)
    L = L.resize((W, H), Image.LANCZOS)
    return L.filter(ImageFilter.GaussianBlur(blur)) if blur else L


def bbox(p):
    xs, ys = [x for x, _ in p], [y for _, y in p]
    return min(xs), min(ys), max(xs), max(ys)


class Layer:
    """Слой графики в суперсэмплинге."""
    def __init__(self, size):
        self.size = size; W, H = size
        self.im = Image.new('RGBA', (W * SS, H * SS), (0, 0, 0, 0)); self.d = ImageDraw.Draw(self.im)
    def poly(self, pts, c, a=255):
        self.d.polygon([(x * SS, y * SS) for x, y in pts], fill=c + (a,))
    def rect(self, x0, y0, x1, y1, c, r=0, a=255, outline=None, w=0):
        self.d.rounded_rectangle([x0 * SS, y0 * SS, x1 * SS, y1 * SS], radius=r * SS, fill=None if c is None else c + (a,), outline=None if outline is None else outline + (255,), width=w * SS)
    def text(self, xy, s, f, size, c, anchor='mm', rot=0, stroke=0, sc=None):
        fnt = font(f, size * SS)
        if not rot:
            self.d.text((xy[0] * SS, xy[1] * SS), s, font=fnt, fill=c + (255,), anchor=anchor, stroke_width=stroke * SS, stroke_fill=(sc or c) + (255,))
            return
        tmp = Image.new('RGBA', (int(size * SS * (len(s) + 2)), int(size * SS * 2.2)), (0, 0, 0, 0))
        ImageDraw.Draw(tmp).text((tmp.width / 2, tmp.height / 2), s, font=fnt, fill=c + (255,), anchor='mm', stroke_width=stroke * SS, stroke_fill=(sc or c) + (255,))
        tmp = tmp.rotate(rot, expand=True, resample=Image.BICUBIC)
        self.im.alpha_composite(tmp, (int(xy[0] * SS - tmp.width / 2), int(xy[1] * SS - tmp.height / 2)))
    def paste(self, img, xy, anchor='mm'):
        img = img.resize((img.width * SS, img.height * SS), Image.LANCZOS)
        x, y = xy[0] * SS, xy[1] * SS
        if anchor == 'mm': x -= img.width / 2; y -= img.height / 2
        self.im.alpha_composite(img, (int(x), int(y)))
    def done(self):
        return self.im.resize(self.size, Image.LANCZOS)


def inscribed(zp):
    """Центр и радиус самого большого круга внутри зоны."""
    import cv2
    x0, y0, x1, y1 = bbox(zp); W, H = int(x1 - x0) + 4, int(y1 - y0) + 4
    m = np.zeros((H, W), np.uint8); cv2.fillPoly(m, [np.array([(x - x0 + 2, y - y0 + 2) for x, y in zp], np.int32)], 1)
    dt = cv2.distanceTransform(m, cv2.DIST_L2, 5); yy, xx = np.unravel_index(np.argmax(dt), dt.shape)
    return x0 - 2 + xx, y0 - 2 + yy, float(dt.max())


def fit_in(zp, aspect=1.4, k=1.0):
    """Табличка, которая целиком влезает в деталь: по вписанному кругу."""
    cx, cy, r = inscribed(zp)
    h = r * 2 * k / math.sqrt(1 + aspect * aspect) * 1.25
    return int(h * aspect), int(h), (cx, cy)


def fit_plate(zp, aspect=1.35, k=0.86):
    x0, y0, x1, y1 = bbox(zp); w, h = (x1 - x0) * k, (y1 - y0) * k
    if w / h > aspect: w = h * aspect
    else: h = w / aspect
    return int(w), int(h), ((x0 + x1) / 2, (y0 + y1) / 2)


def plate(w, h, num, bg, fg, border=None, r=10):
    """Номерная табличка с номером владельца."""
    L = Layer((w, h))
    L.rect(0, 0, w, h, bg, r=r)
    if border: L.rect(3, 3, w - 3, h - 3, None, r=r - 2, outline=border, w=5)
    L.text((w / 2, h / 2 + h * 0.04), num, 'archivo', h * 0.72, fg)
    return L.done()


# ------------------------------------------------------------------ ливреи
def livery_clean(z, size, acc, num):
    """Чистая заводская: графит, белые крылья, одна линия цвета серии, знак GT."""
    base = Layer(size); g = Layer(size)
    for k in ('side', 'tank', 'shroud', 'swing'): base.poly(z[k], GRAPH) if k in z else None
    for k in ('tail', 'fender'): base.poly(z[k], WHITE) if k in z else None
    sx0, sy0, sx1, sy1 = bbox(z['side'])
    if 'frame' in z:
        fx0_, fy0_, fx1_, fy1_ = bbox(z['frame'])
        g.poly([(fx0_, fy1_ - 14), (fx1_, fy0_ + 10), (fx1_, fy0_ + 18), (fx0_, fy1_ - 6)], acc)
    # одна диагональная линия цвета серии через боковину
    t = max(10, (sy1 - sy0) * 0.07)
    g.poly([(sx0 - 40, sy1 - (sy1 - sy0) * 0.30), (sx1 + 40, sy0 + (sy1 - sy0) * 0.10), (sx1 + 40, sy0 + (sy1 - sy0) * 0.10 + t), (sx0 - 40, sy1 - (sy1 - sy0) * 0.30 + t)], acc)
    # тонкая линия на крыле
    fx0, fy0, fx1, fy1 = bbox(z['fender'])
    g.poly([(fx0 + (fx1 - fx0) * .3, fy0 + 14), (fx1, fy0 + (fy1 - fy0) * .55), (fx1, fy0 + (fy1 - fy0) * .55 + 7), (fx0 + (fx1 - fx0) * .3, fy0 + 21)], acc)
    # знак GT на боковине
    mh = min(sy1 - sy0, (sx1 - sx0) * 1.1) * 0.42
    g.paste(gt_mark(int(mh), WHITE, WHITE, acc), (sx0 + (sx1 - sx0) * 0.52, sy0 + (sy1 - sy0) * 0.42))
    # номер владельца: боковая табличка на хвосте, передняя на маске
    tx0, ty0, tx1, ty1 = bbox(z['tail'])
    ph = min(90, (ty1 - ty0) * 0.55)
    g.paste(plate(int(ph * 1.45), int(ph), num, GRAPH, WHITE, r=10), (tx0 + (tx1 - tx0) * 0.62, ty0 + (ty1 - ty0) * 0.62))
    pw, ph2, c = fit_plate(z['shroud'], 0.9, 0.78)
    g.paste(plate(pw, ph2, num, WHITE, GRAPH, r=8), c)
    return base.done(), g.done()


def livery_race(z, size, acc, num):
    """Гонка / MX: белый пластик, крупные блоки цвета серии, номер как у гонщика, «спонсоры» GT."""
    base = Layer(size); g = Layer(size)
    for k in ('tail', 'tank', 'side', 'shroud', 'fender', 'swing'):
        if k in z: base.poly(z[k], WHITE)
    sx0, sy0, sx1, sy1 = bbox(z['side']); sw, sh = sx1 - sx0, sy1 - sy0
    if 'tank' in z:
        kx0, ky0, kx1, ky1 = bbox(z['tank'])
        g.poly([(kx0, ky1), (kx0 + (kx1 - kx0) * .55, ky0), (kx1, ky0), (kx1, ky1)], GRAPH)
    if 'frame' in z:
        fx0_, fy0_, fx1_, fy1_ = bbox(z['frame'])
        g.poly([(fx0_, fy1_ - 22), (fx1_, fy0_ + 8), (fx1_, fy0_ + 26), (fx0_, fy1_ - 4)], acc)
    # нижний блок цвета серии с острым срезом
    g.poly([(sx0 - 30, sy0 + sh * 0.58), (sx0 + sw * 0.55, sy0 + sh * 0.50), (sx1 + 30, sy0 + sh * 0.22), (sx1 + 30, sy1 + 40), (sx0 - 30, sy1 + 40)], acc)
    # графитовые шевроны
    for i in range(3):
        o = i * sw * 0.07
        g.poly([(sx0 + sw * .62 + o, sy0 + sh * .30), (sx0 + sw * .68 + o, sy0 + sh * .30), (sx0 + sw * .60 + o, sy0 + sh * .56), (sx0 + sw * .54 + o, sy0 + sh * .56)], GRAPH)
    mh = min(sh, sw * 1.1) * 0.40
    g.paste(gt_mark(int(mh), GRAPH, GRAPH, acc), (sx0 + sw * 0.30, sy0 + sh * 0.30))
    # большая боковая табличка с номером на хвосте
    tx0, ty0, tx1, ty1 = bbox(z['tail'])
    ph = min(120, (ty1 - ty0) * 0.78)
    g.paste(plate(int(ph * 1.5), int(ph), num, WHITE, INK, border=acc, r=12), (tx0 + (tx1 - tx0) * 0.6, ty0 + (ty1 - ty0) * 0.6))
    # передняя табличка: цвет серии + номер
    pw, ph2, c = fit_plate(z['shroud'], 0.9, 0.86)
    g.paste(plate(pw, ph2, num, acc, INK, r=8), c)
    # крыло: полоса цвета серии и надпись
    fx0, fy0, fx1, fy1 = bbox(z['fender'])
    g.poly([(fx0, fy1), (fx0 + (fx1 - fx0) * .45, fy0), (fx0 + (fx1 - fx0) * .58, fy0), (fx0 + (fx1 - fx0) * .2, fy1 + 10)], acc)
    # «спонсорские» плашки: свои сервисы GT
    if 'swing' in z:
        wx0, wy0, wx1, wy1 = bbox(z['swing']); cx, cy = (wx0 + wx1) / 2, (wy0 + wy1) / 2
        ang = -math.degrees(math.atan2(z['swing'][1][1] - z['swing'][0][1], z['swing'][1][0] - z['swing'][0][0]))
        L = math.hypot(z['swing'][1][0] - z['swing'][0][0], z['swing'][1][1] - z['swing'][0][1])
        g.text((cx, cy), 'GT TUNING', 'archivo', min((wy1 - wy0) * 0.3, L / 6.5), INK, rot=ang)
    return base.done(), g.done()


def livery_street(z, size, acc, num, seed=7):
    """Уличный кастом: графит и стикербомбинг в нашей палитре, наклейки рядами."""
    rnd = random.Random(seed)
    base = Layer(size); g = Layer(size)
    for k in ('tail', 'tank', 'side', 'shroud', 'fender', 'swing'):
        if k in z: base.poly(z[k], GRAPH)
    words = ['GT', 'SEND IT', 'ZAP', 'NO GAS', 'FULL CHARGE', '0 L', 'GT', 'ROSTOV', 'NIGHT RIDE', 'GT', 'VOLT']
    cols = [acc, WHITE, acc, FROST, (70, 76, 86), WHITE, acc]
    for k in ('side', 'tank', 'tail', 'shroud', 'fender', 'swing', 'frame'):
        if k not in z: continue
        x0, y0, x1, y1 = bbox(z[k]); w0 = x1 - x0; h0 = y1 - y0
        rows = max(1, int(h0 / 70)); 
        for r in range(rows + 1):
            x = x0 - 20 + rnd.uniform(0, 30)
            while x < x1 + 20:
                h = rnd.uniform(34, 58) * (0.7 if k in ('fender', 'swing', 'frame') else 1)
                txt = rnd.choice(words); w = max(h * 1.4, h * 0.62 * len(txt) + 18)
                c = rnd.choice(cols); a = rnd.uniform(-10, 10)
                st = Layer((int(w) + 16, int(h) + 16))
                st.rect(8, 8, 8 + w, 8 + h, c, r=rnd.choice([4, 10, h / 2]))
                fg = INK if c in (WHITE, FROST, acc) else WHITE
                st.text(((w + 16) / 2, (h + 16) / 2 + 1), txt, 'archivo', h * .44, fg)
                im = st.done().rotate(a, expand=True, resample=Image.BICUBIC)
                g.paste(im, (x + w / 2, y0 + (r + 0.5) * h0 / (rows + 0.5) + rnd.uniform(-8, 8)))
                x += w * rnd.uniform(0.82, 1.0)
    sx0, sy0, sx1, sy1 = bbox(z['side'])
    mh = min(sy1 - sy0, (sx1 - sx0) * 1.1) * 0.46
    pad = Layer((int(mh * 1.05), int(mh * 1.15)))
    pad.rect(0, 0, mh * 1.05, mh * 1.15, INK, r=14)
    g.paste(pad.done(), (sx0 + (sx1 - sx0) * .5, sy0 + (sy1 - sy0) * .45))
    g.paste(gt_mark(int(mh * .95), WHITE, WHITE, acc), (sx0 + (sx1 - sx0) * .5, sy0 + (sy1 - sy0) * .45))
    tx0, ty0, tx1, ty1 = bbox(z['tail'])
    ph = min(100, (ty1 - ty0) * .7)
    g.paste(plate(int(ph * 1.5), int(ph), num, acc, INK, r=int(ph / 2)), (tx0 + (tx1 - tx0) * .6, ty0 + (ty1 - ty0) * .6))
    return base.done(), g.done()


def livery_hybrid(z, size, acc, num):
    """A+B: основа Clean (графит, белые крылья, линия серии) + номер и плашки из Race."""
    base = Layer(size); g = Layer(size)
    for k in ('side', 'tank', 'shroud', 'swing'):
        if k in z: base.poly(z[k], GRAPH)
    for k in ('tail', 'fender'):
        if k in z: base.poly(z[k], WHITE)
    sx0, sy0, sx1, sy1 = bbox(z['side']); sw, sh = sx1 - sx0, sy1 - sy0
    # линия цвета серии: через бак и боковину одной диагональю
    top = bbox(z['tank'])[1] if 'tank' in z else sy0
    t = max(12, sh * 0.075)
    g.poly([(sx0 - 60, sy1 - sh * 0.18), (sx1 + 60, top + (sy0 - top) * 0.3 + sh * 0.06), (sx1 + 60, top + (sy0 - top) * 0.3 + sh * 0.06 + t), (sx0 - 60, sy1 - sh * 0.18 + t)], acc)
    if 'frame' in z:
        fx0_, fy0_, fx1_, fy1_ = bbox(z['frame'])
        g.poly([(fx0_, fy1_ - 16), (fx1_, fy0_ + 10), (fx1_, fy0_ + 20), (fx0_, fy1_ - 6)], acc)
    # знак GT крупно + шевроны из Race
    icx, icy, ir = inscribed(z['side'])
    mh = min(ir * 1.5, sh * 0.5)
    cx, cy = icx - mh * 0.25, icy
    gm_ = gt_mark(int(mh), WHITE, WHITE, acc); g.paste(gm_, (cx, cy))
    META.clear(); META['mark'] = (cx, cy, gm_.width, gm_.height)
    META['line'] = (sx0, sy1 - sh * 0.18, sx1, top + (sy0 - top) * 0.3 + sh * 0.06, t)
    for i in range(3):
        o = i * mh * 0.16; x = cx + mh * 0.62 + o
        g.poly([(x, cy - mh * .22), (x + mh * .09, cy - mh * .22), (x + mh * .02, cy + mh * .22), (x - mh * .07, cy + mh * .22)], acc)
    # крыло: тонкая линия серии
    fx0, fy0, fx1, fy1 = bbox(z['fender'])
    g.poly([(fx0 + (fx1 - fx0) * .3, fy0 + 12), (fx1, fy0 + (fy1 - fy0) * .55), (fx1, fy0 + (fy1 - fy0) * .55 + 7), (fx0 + (fx1 - fx0) * .3, fy0 + 19)], acc)
    # номер владельца: большая табличка на хвосте (Race) и цветная спереди
    pw, ph, c = fit_in(z['tail'], 1.45, 1.0)
    g.paste(plate(pw, ph, num, WHITE, INK, border=acc, r=max(6, int(ph * .14))), c); META['num_side'] = (c[0], c[1], pw, ph)
    pw, ph, c = fit_in(z['shroud'], 1.0, 0.85)
    g.paste(plate(pw, ph, num, acc, INK, r=max(5, int(ph * .1))), c); META['num_front'] = (c[0], c[1], pw, ph)
    # плашка GT TUNING на маятнике
    if 'swing' in z:
        wx0, wy0, wx1, wy1 = bbox(z['swing']); cx2, cy2 = (wx0 + wx1) / 2, (wy0 + wy1) / 2
        p0, p1 = z['swing'][0], z['swing'][1] if 'swing' in z else (0, 0)
        L = math.hypot(z['swing'][2][0] - z['swing'][0][0], z['swing'][2][1] - z['swing'][0][1])
        ang = -math.degrees(math.atan2(z['swing'][2][1] - z['swing'][0][1], z['swing'][2][0] - z['swing'][0][0]))
        h = min((wy1 - wy0) * 0.34, L / 7.5); w = h * 5.6
        pl = Layer((int(w) + 8, int(h) + 8)); pl.rect(4, 4, w + 4, h + 4, WHITE, r=h * .3)
        pl.text(((w + 8) / 2, (h + 8) / 2 + 1), 'GT TUNING', 'archivo', h * .58, INK)
        g.paste(pl.done().rotate(ang, expand=True, resample=Image.BICUBIC), (cx2, cy2)); META['tuning'] = (cx2, cy2, w, h)
    return base.done(), g.done()


META = {}


LIV = {'clean': livery_clean, 'race': livery_race, 'street': livery_street, 'hybrid': livery_hybrid}


def zone_masks(n, size):
    """Маски зон: полигоны, а для контрастного пластика уточнение GrabCut (кэш)."""
    z = Z[n]; ms = {k: poly_mask(size, [p]) for k, p in z.items()}
    if n in GC:
        cache = f'gc_{n}.npz'
        if os.path.exists(cache): gm = dict(np.load(cache))
        else:
            import refine; gm = refine.zone_masks(n); np.savez_compressed(cache, **gm)
        for k in GC[n]:
            ms[k] = Image.fromarray((gm[k] * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(0.8))
    return ms


# ------------------------------------------------------------------ сборка картинок
def sat_mask(a, pm):
    rgb = a[..., :3]; mx = rgb.max(-1); mn = rgb.min(-1)
    sat = (mx - mn) / np.maximum(mx, 1e-3)
    m = np.clip((sat - 0.45) / 0.2, 0, 1) * np.clip((mx - 0.22) / 0.15, 0, 1) * (1 - pm) * (a[..., 3])
    return np.asarray(Image.fromarray((m * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(1))).astype(np.float32) / 255


def recolor_accent(a, pm, acc):
    """Старые цветные детали вне пластика (обода, пружины, полосы) перекрашиваем в цвет серии."""
    out = a[..., :3].copy(); sat = sat_mask(a, pm)[..., None]
    lum = (a[..., :3] @ np.array([.299, .587, .114]))[..., None]
    col = np.array(acc, np.float32) / 255 * np.clip(0.4 + lum * 0.9, 0, 1.1)
    return out * (1 - sat) + np.clip(col, 0, 1) * sat


def render(n, liv, acc, num, mode):
    photo = Image.open(f'n{n}.png').convert('RGBA'); size = photo.size
    z = Z[n]
    ms = zone_masks(n, size)
    plastic = Image.new('L', size, 0)
    for m in ms.values(): plastic = ImageChops.lighter(plastic, m)
    alpha = photo.split()[3]
    plastic = ImageChops.multiply(plastic, alpha)
    base, gfx = LIV[liv](z, size, acc, num)
    if n in GC:
        for k in GC[n]:
            x0, y0, x1, y1 = bbox(z[k]); px = base.getpixel((int((x0 + x1) / 2), int((y0 + y1) / 2)))
            if px[3] > 0: base.paste(Image.new('RGBA', size, px[:3] + (255,)), (0, 0), ms[k])
    gfx_a = ImageChops.multiply(gfx.split()[3], plastic); gfx.putalpha(gfx_a)
    base.putalpha(ImageChops.multiply(base.split()[3], plastic))
    a = np.asarray(photo).astype(np.float32) / 255
    lum = (a[..., :3] @ np.array([.299, .587, .114]))
    if mode == 'photo':
        # затенение пластика из фото: сглаженная яркость, чтобы старые наклейки не проступали
        L = Image.fromarray((lum * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(12))
        l = np.asarray(L).astype(np.float32) / 255
        pm = np.asarray(plastic).astype(np.float32) / 255
        mean = (l * pm).sum() / max(pm.sum(), 1)
        shade = np.clip(0.93 + (l - mean) * 0.75, 0.68, 1.12)[..., None]
        spec = np.clip((l - mean - 0.08) * 0.6, 0, 0.18)[..., None]
        out = recolor_accent(a, pm, acc)
        for layer, k in ((base, 1.0), (gfx, 1.0)):
            la = np.asarray(layer).astype(np.float32) / 255
            col = np.clip(la[..., :3] * shade + spec, 0, 1); al = la[..., 3:4] * k
            out = out * (1 - al) + col * al
        # блик сверху, чтобы пластик выглядел глянцевым
        res = np.dstack([out, a[..., 3]])
        img = Image.fromarray((res * 255).astype(np.uint8), 'RGBA')
    else:
        # плоская схема: механика темным силуэтом с деталями, пластик плоско
        g = np.clip(0.10 + lum * 0.30, 0, 1)
        mech = np.dstack([g * 0.95, g, g * 1.08, a[..., 3]])
        pm = np.asarray(plastic).astype(np.float32) / 255
        sat = sat_mask(a, pm)
        accn = np.array(acc, np.float32) / 255
        mech[..., :3] = mech[..., :3] * (1 - sat[..., None]) + (accn * np.clip(0.35 + lum * 0.9, 0, 1)[..., None]) * sat[..., None]
        img = Image.fromarray((np.clip(mech, 0, 1) * 255).astype(np.uint8), 'RGBA')
        img.alpha_composite(base); img.alpha_composite(gfx)
        ol = Layer(size)
        for p in z.values(): ol.d.line([(x * SS, y * SS) for x, y in p] + [(p[0][0] * SS, p[0][1] * SS)], fill=(10, 12, 15, 150), width=2 * SS)
        oli = ol.done(); oli.putalpha(ImageChops.multiply(oli.split()[3], alpha)); img.alpha_composite(oli)
    return img


if __name__ == '__main__':
    n, liv, ser, num, mode = sys.argv[1:6]
    render(n, liv, ACC[ser], num, mode).save(f'out_{n}_{liv}_{mode}.png')
