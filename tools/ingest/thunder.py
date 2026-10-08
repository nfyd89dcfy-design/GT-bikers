"""Thunder EV (ELECTRIC CATALOGUE 2026.pdf): 6 моделей на страницу в два столбца, характеристики напечатаны картинкой (OCR)."""
import io, re, json
import pymupdf
from PIL import Image
from common import *
from ocr_cache import ocr_page

FID, FNAME = "106HUcaAOlNPTCKQcrOebPeIUzEBi7RIw", "ELECTRIC CATALOGUE 2026.pdf"

def klass(n):
    if 43 <= n <= 48 or 68 <= n <= 72: return "car", "Электротрицикл / мини-электромобиль"
    if 52 <= n <= 54 or 61 <= n <= 66: return "ebike-sport", "Электромотоцикл"
    return "ebike-city", "Электроскутер"

def main():
    d = pymupdf.open(SRC + f"/{FID}.pdf"); out = []; pageimg = {}
    for pn in range(len(d)):
        pg = d[pn]; W = pg.rect.width
        boxes = ocr_page(d, FID, pn)
        titles = [(b, re.match(r"Thun\w*\s*(\d{3})", b[4])) for b in boxes]
        titles = [(b, m) for b, m in titles if m]
        ims = [i for i in pg.get_image_info(xrefs=True) if (i["bbox"][2] - i["bbox"][0]) > 90 and (i["bbox"][3] - i["bbox"][1]) > 90 and (i["bbox"][2] - i["bbox"][0]) < W * 0.6]
        for b, m in titles:
            num = int(m.group(1)); col0 = b[0] - 20; colw = W / 2
            lo_x = 0 if b[0] < colw else colw; hi_x = colw if b[0] < colw else W
            below = [t[0][1] for t in titles if lo_x <= t[0][0] < hi_x and t[0][1] > b[1] + 5]
            y_hi = min(below) if below else pg.rect.height
            cell = [x for x in boxes if lo_x <= (x[0] + x[2]) / 2 < hi_x and b[1] - 3 <= x[1] < y_hi - 2]
            txt = " ".join(x[4] for x in sorted(cell, key=lambda x: (round(x[1] / 6), x[0])))
            p = {"id": f"thunder-{num:03d}", "brand": "Thunder EV", "sku": f"Thunder {num:03d}", "images": [], "src": FNAME, "page": pn + 1, "extra": []}
            p["cat"], word = klass(num); p["name"] = f"{word} Thunder {num:03d}"
            mp = re.search(r"(\d{3,5})\s*W", txt)
            if mp: p["power_kw"] = int(mp.group(1)) / 1000; p["extra"].append(["Мощность мотора", f"{mp.group(1)} Вт"])
            ms = re.search(r"(\d{2,3})\s*km\s*/?\s*h", txt, re.I)
            if ms: p["top_speed"] = int(ms.group(1)); p["extra"].append(["Макс. скорость", f"{ms.group(1)} км/ч"])
            mr = re.search(r"([≥>]?)\s*(\d{2,3})\s*km(?!\s*/)", txt, re.I)
            if mr: p["range_km"] = int(mr.group(2)); p["extra"].append(["Запас хода", f"{'не менее ' if mr.group(1) else ''}{mr.group(2)} км"])
            mb = re.search(r"((?:\d{2}V\s*/?\s*)+)\s*(Lead\s*Acid\s*/?\s*Lithium|Lithium|Lead\s*Acid|Li-?ion)?", txt, re.I)
            if mb:
                volts = [int(x) for x in re.findall(r"(\d{2})V", mb.group(1))]
                if volts: p["battery_v"] = max(volts)
                kind = (mb.group(2) or "").lower().replace(" ", "")
                lab = "свинцово-кислотный / литиевый на выбор" if "lead" in kind and "lith" in kind else "литиевый" if "lith" in kind or "li" in kind else "свинцово-кислотный" if "lead" in kind else ""
                if "lead" in kind and "lith" in kind: p["battery_type"] = "Литиевый"
                elif "lith" in kind or "li" in kind: p["battery_type"] = "Литиевый"
                elif "lead" in kind: p["battery_type"] = "Свинцово-кислотный"
                p["extra"].append(["Аккумулятор", (mb.group(1).replace(" ", "").strip("/") + " " + lab).strip()])
            if re.search(r"Disk\s*Rear\s*Disk|Disc", txt, re.I): p["brakes"] = "Дисковые"; p["extra"].append(["Тормоза", "передний и задний дисковые" if re.search(r"Front\s*Disk\s*Rear\s*Disk", txt, re.I) else "дисковые"])
            elif re.search(r"Drum", txt, re.I): p["brakes"] = "Барабанные"; p["extra"].append(["Тормоза", "барабанные"])
            mt = re.search(r"(\d{2,3}/\d{2,3}-\d{2}|\d\.\d{2}-\d{2}|\d{3}-\d{2})\s*Vacuum", txt, re.I)
            if mt: p["extra"].append(["Шины", mt.group(1) + " бескамерные"])
            # строки таблицы по подписям: все значения как в каталоге, переведённые на русский
            LB = r"(Motor\s*Power|Speed|Range|Battery|Brake|Tyre|Tire|Charging\s*Time|Controller|Climbing|Max\.?\s*Load|Load|Seats?)"
            parts = re.split(LB + r"\s+", txt)
            rows = []
            for i in range(1, len(parts) - 1, 2):
                rows.append((re.sub(r"\s+", " ", parts[i]).strip().lower(), re.sub(r"\s+", " ", parts[i + 1]).strip(" |")))
            def rv(v):
                v = re.sub(r"Lead\s*Acid\s*/?\s*Lithium", "свинцово-кислотный / литиевый", v, flags=re.I)
                v = re.sub(r"\bLithium\b", "литиевый", v, flags=re.I); v = re.sub(r"Lead\s*Acid", "свинцово-кислотный", v, flags=re.I)
                v = re.sub(r"Front\s*Disk\s*Rear\s*Disk", "передний и задний дисковые", v, flags=re.I); v = re.sub(r"Front\s*Drum\s*Rear\s*Drum", "передний и задний барабанные", v, flags=re.I)
                v = re.sub(r"Front\s*Disk\s*Rear\s*Drum", "передний дисковый, задний барабанный", v, flags=re.I)
                v = re.sub(r"Hydraulic\s*Disk\s*Brake", "гидравлические дисковые", v, flags=re.I); v = re.sub(r"Vacuum\s*Tire", "бескамерные", v, flags=re.I)
                v = re.sub(r"(\d)\s*KM\b", r"\1 км", v, flags=re.I); v = re.sub(r"(\d)\s*km\s*/\s*h", r"\1 км/ч", v, flags=re.I)
                v = re.sub(r"(\d)\s*Ah", r"\1 А·ч", v, flags=re.I); v = re.sub(r"(\d)\s*KW", r"\1 кВт", v, flags=re.I); v = re.sub(r"(\d)\s*W\b", r"\1 Вт", v)
                v = re.sub(r"\s*www\.\S+", "", v); v = re.sub(r"км/h", "км/ч", v); v = re.sub(r"(\d)h\b", r"\1 ч", v)
                v = re.sub(r"(Hydraulic\s*Disk)(?!\s*Brake)", "гидравлические дисковые", v, flags=re.I)
                v = re.sub(r"(?<=[A-Za-zА-я\d·])(свинцово|литиев)", r" \1", v); v = re.sub(r"(кВт|Вт)(?=\d)", r"\1 / ", v)
                return v.replace("\u2013", "–")
            names = {"motor power": "Мощность мотора", "speed": "Макс. скорость", "range": "Запас хода", "battery": "Аккумулятор", "brake": "Тормоза", "tyre": "Шины", "tire": "Шины",
                     "charging time": "Время зарядки", "controller": "Контроллер", "climbing": "Угол подъёма", "max. load": "Макс. нагрузка", "max load": "Макс. нагрузка", "load": "Нагрузка", "seat": "Мест", "seats": "Мест"}
            full_rows = [[names.get(re.sub(r"\s+", " ", l), l), rv(v)] for l, v in rows if v]
            if len(full_rows) >= len(p["extra"]): p["extra"] = full_rows
            # страница целиком — одна картинка: вырезаем фото из ячейки
            full = pageimg.get(pn)
            if full is None:
                pxi = px_image(d, pg.get_image_info(xrefs=True)[0]["xref"])
                full = pageimg[pn] = pxi.convert("RGB")
            k = full.width / W
            foot = min([x[1] for x in boxes if 'thundorev' in x[4].lower() or x[4].lower().startswith('www')] or [pg.rect.height])
            crop_hi = (min(below) - 34) if below else foot - 6
            crop = full.crop((int((b[0] + 250) * k), int((b[1] - 52) * k), int((hi_x - 6) * k), int(crop_hi * k)))
            from PIL import ImageChops
            bg = Image.new("RGB", crop.size, (255, 255, 255))
            mask = ImageChops.difference(crop, bg).convert("L").point(lambda v: 255 if v > 28 else 0)
            import numpy as np
            occ = (np.array(mask).sum(axis=1) > 255 * 3)
            bands, start = [], None
            for yy, v in enumerate(list(occ) + [False] * 14):
                if v and start is None: start = yy; last = yy
                elif v: last = yy
                elif start is not None and yy - last > 12: bands.append((start, last)); start = None
            if bands:
                y0b, y1b = max(bands, key=lambda b_: b_[1] - b_[0])
                mask = mask.crop((0, y0b, mask.width, y1b + 1)); crop = crop.crop((0, y0b, crop.width, y1b + 1))
            bbox = mask.getbbox()
            if bbox and (bbox[2] - bbox[0]) > 120 and (bbox[3] - bbox[1]) > 120:
                crop = crop.crop((max(0, bbox[0] - 8), max(0, bbox[1] - 8), min(crop.width, bbox[2] + 8), min(crop.height, bbox[3] + 8)))
                img = save_image(crop, f"thunder/t{num:03d}", min_side=60)
                if img: p["images"].append(img)
            out.append(p)
    json.dump(out, open(OUT + "/thunder.json", "w"), ensure_ascii=False)
    print(len(out))
    for p in out: print(p["sku"], p["cat"], p.get("power_kw"), p.get("top_speed"), p.get("range_km"), p.get("battery_v"), p.get("battery_type"), p.get("brakes"), len(p["images"]))

main()
