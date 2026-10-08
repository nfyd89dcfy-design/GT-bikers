"""2025 Minibusev Product catalog.pdf: разворот = две модели (левая и правая половины). Фото — общая полоса, делим пополам."""
import io, json, re
import pymupdf
from PIL import Image
from common import *
from ocr_cache import ocr_page

FID, FNAME = "1Dwovyg6T2ByzC5flp7ITp9lFhhdhj6Hh", "2025 Minibusev Product catalog.pdf"

def val_right(boxes, rx, dx=45, dy=7):
    for b in boxes:
        if re.search(rx, b[4], re.I):
            tail = re.sub(r"^.*?(\(mm\)|\(km/h\)|Controller|Capacity|Size|Power|Range|Speed|Clearance|Gradeability)\s*", "", b[4], flags=re.I)
            c = [v for v in boxes if v is not b and v[0] > b[0] + dx and abs((v[1] + v[3]) / 2 - (b[1] + b[3]) / 2) < dy + (b[3] - b[1]) / 2 and v[0] < b[0] + 330]
            if c:
                c.sort(key=lambda v: v[0]); return c[0][4].strip()
            if tail and tail != b[4] and re.search(r"\d", tail): return tail.strip()
    return None

def main():
    d = pymupdf.open(SRC + f"/{FID}.pdf"); out = []
    for pn in range(len(d)):
        pg = d[pn]; W = pg.rect.width; mid = W / 2
        boxes = ocr_page(d, FID, pn)
        if not any(re.search(r"Model:", b[4]) for b in boxes): continue
        photo = None
        for hi, (lo_x, hi_x) in enumerate([(0, mid), (mid, W)]):
            hb = [b for b in boxes if lo_x <= b[0] < hi_x]
            mb = [b for b in hb if re.search(r"Model:", b[4])]
            if not mb: continue
            code = re.sub(r"Model:\s*", "", mb[0][4]).strip().replace(" ", "")
            series = " ".join(b[4] for b in sorted(hb, key=lambda b: (round(b[1] / 6), b[0])) if 90 <= b[1] <= 112 and not re.search(r"Model|Sending|accompany|series|MINIBUS", b[4], re.I))
            series = re.sub(r"\s+", " ", series).strip().title()
            p = {"id": "minibusev-" + slug(code), "cat": "car", "brand": "Minibus", "sku": code, "images": [], "src": FNAME, "page": pn + 1, "extra": []}
            if series: p["extra"].append(["Серия", series])
            if re.search(r"FARM|CARGO|PICK|TRUCK|BOX", series, re.I): p["cat"] = "utv"
            if re.search(r"THREE|TRI", series, re.I): p["cat"] = "car"
            p["name"] = f"Электромобиль Minibus {code}"
            dim = val_right(hb, r"Dimension")
            if dim: p["extra"].append(["Габариты, мм", dim.replace("X", "×").replace("x", "×")])
            gc = val_right(hb, r"Ground Clearance")
            if gc: p["extra"].append(["Дорожный просвет, мм", re.sub(r"\D*(\d+)\D*", r"\1", gc)])
            sp = val_right(hb, r"Max Speed")
            if sp:
                m = re.search(r"(\d{2,3})", sp)
                if m: p["top_speed"] = int(m.group(1)); p["extra"].append(["Макс. скорость", f"{'не более ' if '≤' in sp else ''}{m.group(1)} км/ч"])
            mp = val_right(hb, r"Motor Power")
            if mp:
                ws = [int(x) for x in re.findall(r"(\d{3,5})\s*W", mp, re.I)]
                if ws: p["power_kw"] = max(ws) / 1000; p["extra"].append(["Мощность мотора", mp])
            dr = val_right(hb, r"Distance Range")
            if dr:
                m = re.search(r"(\d{2,3})", dr)
                if m: p["range_km"] = int(m.group(1)); p["extra"].append(["Запас хода", f"{'не менее ' if '≥' in dr else ''}{m.group(1)} км"])
            bc = val_right(hb, r"Battery Capacity")
            if bc:
                p["extra"].append(["Аккумулятор", bc])
                m = re.search(r"(\d{2})V\s*(\d{2,3})AH", bc, re.I)
                if m: p["battery_v"] = int(m.group(1)); p["battery_ah"] = int(m.group(2)); p["battery_wh"] = int(m.group(1)) * int(m.group(2))
            ts = val_right(hb, r"Tires Size")
            if ts: p["extra"].append(["Шины", ts])
            gr = val_right(hb, r"Gradeability")
            if gr: p["extra"].append(["Угол подъёма", gr])
            brk = " ".join(b[4] for b in hb if re.search(r"drum|disc|electromagnetic|brake", b[4], re.I) and b[4] != "Braking System")
            if re.search(r"disc", brk, re.I): p["brakes"] = "Дисковые"
            elif re.search(r"drum", brk, re.I): p["brakes"] = "Барабанные"
            if brk: p["extra"].append(["Тормоза", re.sub(r"\s+", " ", brk)])
            sm = re.search(r"(\d)\s*[- ]?seat", " ".join(b[4] for b in hb), re.I)
            if sm: p["seats"] = int(sm.group(1))
            clips = [(475, 55, 816, 352), (500, 360, 740, 552)] if hi == 0 else [(1210, 55, W, 352), (1290, 360, 1570, 552)]
            for ci, c in enumerate(clips):
                pm = pg.get_pixmap(dpi=110, clip=pymupdf.Rect(*c))
                im = Image.frombytes("RGB", (pm.width, pm.height), pm.samples)
                img = save_image(im, f"minibusev/{slug(code)}-{ci+1}", min_side=60)
                if img: p["images"].append(img)
            out.append(p)
    json.dump(out, open(OUT + "/minibusev.json", "w"), ensure_ascii=False)
    print(len(out))
    for p in out: print(p["sku"], p["cat"], p.get("top_speed"), p.get("power_kw"), p.get("range_km"), p.get("battery_wh"), p.get("seats"), len(p["extra"]), len(p["images"]))

main()
