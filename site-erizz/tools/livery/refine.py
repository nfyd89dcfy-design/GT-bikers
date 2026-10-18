"""Уточнение зон: GrabCut по фото с полигоном как подсказкой. Результат: маска каждой зоны."""
import cv2, numpy as np, sys
from PIL import Image, ImageDraw
sys.path.insert(0, '.')
from zones import Z

def zone_masks(n, ring=10, core=0.55):
    im = np.asarray(Image.open(f'n{n}.png').convert('RGBA'))
    rgb = np.ascontiguousarray(im[..., :3]); al = im[..., 3]
    H, W = al.shape; out = {}
    for k, p in Z[n].items():
        poly = np.zeros((H, W), np.uint8); cv2.fillPoly(poly, [np.array(p, np.int32)], 1)
        dil = cv2.dilate(poly, np.ones((ring * 2 + 1,) * 2, np.uint8))
        x, y, w, h = cv2.boundingRect(np.array(p, np.int32))
        er = cv2.erode(poly, np.ones((max(3, int(min(w, h) * (1 - core) / 2) * 2 + 1),) * 2, np.uint8))
        m = np.full((H, W), cv2.GC_BGD, np.uint8)
        m[dil > 0] = cv2.GC_PR_BGD; m[poly > 0] = cv2.GC_PR_FGD; m[er > 0] = cv2.GC_FGD; m[al < 100] = cv2.GC_BGD
        x0, y0 = max(0, x - 40), max(0, y - 40); x1, y1 = min(W, x + w + 40), min(H, y + h + 40)
        sub = m[y0:y1, x0:x1].copy(); bgd = np.zeros((1, 65), np.float64); fgd = np.zeros((1, 65), np.float64)
        try:
            cv2.grabCut(rgb[y0:y1, x0:x1], sub, None, bgd, fgd, 4, cv2.GC_INIT_WITH_MASK)
        except Exception as e:
            print('gc fail', n, k, e)
        r = np.zeros((H, W), np.uint8); r[y0:y1, x0:x1] = np.isin(sub, (cv2.GC_FGD, cv2.GC_PR_FGD)).astype(np.uint8)
        # не уходим дальше кольца от полигона и чистим мелочь
        r &= dil
        r = cv2.morphologyEx(r, cv2.MORPH_OPEN, np.ones((5, 5), np.uint8)); r = cv2.morphologyEx(r, cv2.MORPH_CLOSE, np.ones((7, 7), np.uint8))
        nl, lab, st, _ = cv2.connectedComponentsWithStats(r)
        if nl > 1:
            big = 1 + np.argmax(st[1:, cv2.CC_STAT_AREA]); r = (lab == big).astype(np.uint8)
        out[k] = r
    return out

if __name__ == '__main__':
    n = sys.argv[1]
    ms = zone_masks(n)
    im = Image.open(f'n{n}.png').convert('RGBA'); bg = Image.new('RGB', im.size, (230, 232, 236)); bg.paste(im, (0, 0), im)
    a = np.asarray(bg).copy()
    cols = {'tail': (255, 74, 43), 'tank': (255, 200, 0), 'side': (42, 91, 215), 'shroud': (0, 200, 120), 'fender': (180, 0, 220), 'swing': (0, 200, 220), 'frame': (255, 0, 160)}
    for k, m in ms.items():
        e = cv2.morphologyEx(m, cv2.MORPH_GRADIENT, np.ones((3, 3), np.uint8)) > 0
        a[e] = cols[k]
        a[m > 0] = (a[m > 0] * 0.75 + np.array(cols[k]) * 0.25).astype(np.uint8)
    d = ImageDraw.Draw(out := Image.fromarray(a))
    for k, p in Z[n].items(): d.line(p + [p[0]], fill=(0, 0, 0), width=1)
    out.thumbnail((1000, 1000)); out.save(f'ref{n}.jpg', quality=82)
