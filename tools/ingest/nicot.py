"""2027 NICOT Product Catalogue: таблицы характеристик напечатаны картинкой (OCR). Страница-разворот; столбец таблицы = модель."""
import io, json, re, os
import pymupdf
from PIL import Image
from common import *
from ocr_cache import ocr_page

FID, FNAME = "1-nW-7bJVJ-cODzklfloOeD4d7IFRMCmj", "2027 NICOT Product Catalogue.pdf"
LAB = [(r"l.?w.?h", "Габариты, мм"), (r"wheelbase", "Колёсная база, мм"), (r"seat height", "Высота сиденья, мм"), (r"ground clearance", "Дорожный просвет, мм"),
       (r"net weight", "Масса, кг"), (r"fuel capacity", "Топливный бак, л"), (r"oil capacity", "Масло в двигателе, л"), (r"engine type", "Двигатель"),
       (r"displacement", "Объём, см³"), (r"max speed", "Макс. скорость, км/ч"), (r"bore", "Диаметр × ход поршня, мм"), (r"compression", "Степень сжатия"),
       (r"max ?power", "Макс. мощность, кВт/об/мин"), (r"max torque", "Макс. момент, Н·м/об/мин"), (r"ignition", "Зажигание"), (r"starting", "Запуск"),
       (r"rim size", "Диски"), (r"front tire", "Передняя шина"), (r"rear tire", "Задняя шина"), (r"front susp", "Передняя подвеска, мм"), (r"rear susp", "Задняя подвеска, мм"),
       (r"brake", "Тормоза (перед/зад)"), (r"battery", "Аккумулятор"), (r"lighting", "Освещение"), (r"container", "Загрузка в контейнер"), (r"transmission|gear", "Трансмиссия"),
       (r"clutch", "Сцепление"), (r"front track", "Колея спереди, мм"), (r"rear track", "Колея сзади, мм"), (r"track width", "Колея, мм"), (r"motor", "Мотор"), (r"controller", "Контроллер"),
       (r"charg", "Зарядка"), (r"range|mileage", "Запас хода"), (r"final drive|drive", "Привод")]
SECTIONS = re.compile(r"dimensions|power ?system|frame|suspension|&brakes|^other$|^brakes$", re.I)
MODEL = re.compile(r"^[A-Za-z][A-Za-z0-9]{0,6}[\s\-]?(?=[^\s]*\d)[A-Za-z0-9\-\s\(\)]{1,22}$")
SKIP = re.compile(r"^(LIFE|REV|RE|UF|CIF|CIFE|JF|LIE|REVL)$|DIMENSION|SYSTEM|DaretoD|NICOT|POWER|FRAME|OTHER|Wheelbase|^[A-Z]{1,3}$", re.I)

def ru_lab(l):
    ll = l.lower()
    for rx, ru in LAB:
        if re.search(rx, ll): return ru
    return l

def main():
    d = pymupdf.open(SRC + f"/{FID}.pdf"); out = []
    for pn in range(len(d)):
        W = d[pn].rect.width
        boxes = ocr_page(d, FID, pn)
        dim = [b for b in boxes if re.match(r"L.?[×x]W", b[4])]
        if not dim: continue
        lab_x = dim[0][0]; y_dim = dim[0][1]
        r_bound = W
        heads = [b for b in boxes if b[1] < y_dim - 8 and lab_x + 70 < b[0] < r_bound and (MODEL.match(b[4].strip()) and not SKIP.search(b[4]) and re.search(r"\d", b[4]) or re.match(r"^E-WOLF", b[4].strip()))]
        heads.sort(key=lambda b: b[0])
        # убрать дубли в одной колонке (дальше 60 pt друг от друга)
        hs = []
        for b in heads:
            if hs and abs(b[0] - hs[-1][0]) < 50: continue
            hs.append(b)
        if not hs: continue
        # подписи строк
        labels = sorted([b for b in boxes if lab_x - 12 <= b[0] < lab_x + 55 and b[1] >= y_dim - 10 and b[0] < hs[0][0] - 20 and not SECTIONS.search(b[4].strip())], key=lambda b: b[1])
        # слить подписи из нескольких строк рядом (напр. «Distance… / front»)
        cols = [b[0] for b in hs]
        def col_of(x):
            best = min(range(len(cols)), key=lambda i: abs(cols[i] - x))
            return best if abs(cols[best] - x) < 95 else None
        vals = {i: {} for i in range(len(hs))}
        for b in boxes:
            if b[1] < y_dim - 5 or b[0] < hs[0][0] - 25 or b[0] > r_bound: continue
            if b in labels: continue
            if SECTIONS.search(b[4]) or re.match(r"NICOT|REV UP|Dare", b[4]): continue
            ci = col_of(b[0])
            if ci is None: continue
            li = None
            for k, lb in enumerate(labels):
                if lb[1] <= b[1] + 7: li = k
            if li is None: continue
            vals[ci].setdefault(li, []).append((b[1], b[4].strip()))
        # фото: предыдущая страница и текущая
        cand = []
        for q in (pn - 1, pn):
            if q < 0: continue
            for i in d[q].get_image_info(xrefs=True):
                w, h = i["bbox"][2] - i["bbox"][0], i["bbox"][3] - i["bbox"][1]
                if w > 140 and h > 120 and i["xref"] and not (w > 1100 and h < 200): cand.append((w * h, q, i["xref"]))
        cand.sort(reverse=True)
        sm = re.match(r"([A-Za-z0-9]+)", hs[0][4].strip().replace(" ", "")); series = sm.group(1) if sm else "x"
        paths = []
        for k, (_, q, xr) in enumerate(cand[:3]):
            try:
                pxi = px_image(d, xr)
                pth = save_image(pxi, f"nicot/{slug(series)}-p{pn+1}-{k+1}")
                if pth and pth not in paths: paths.append(pth)
            except Exception as e: pass
        for i, h in enumerate(hs):
            code = re.sub(r"\s+", " ", h[4].strip())
            if code.startswith("E-WOLF"):
                sub = [b for b in boxes if b[4].startswith("(") and abs(b[0] - h[0]) < 25 and 0 < b[1] - h[1] < 25]
                if sub: code += " " + sub[0][4]
            pairs = []
            for li, lb in enumerate(labels):
                if li in vals[i]:
                    v = " ".join(t for _, t in sorted(vals[i][li]))
                    pairs.append((lb[4].strip(), v))
            cat = "moto"
            if re.match(r"MOUNTAINEER", code, re.I): cat = "quad"
            if re.match(r"(E-WOLF|N2|Z1|Z3|X3)", code, re.I): cat = "ebike-sport"
            if re.match(r"T7", code): cat = "car"
            word = {"moto": "Мотоцикл", "quad": "Квадроцикл", "ebike-sport": "Электромотоцикл", "car": "Транспорт"}[cat]
            p = {"id": "nicot-" + slug(code) + f"-p{pn+1}", "cat": cat, "brand": "NICOT", "name": f"{word} NICOT {code}", "sku": code, "images": paths, "src": FNAME, "page": pn + 1, "extra": []}
            for a, b in pairs:
                p["extra"].append([ru_lab(a), ru_value(b)])
                al = a.lower()
                if "displacement" in al:
                    m = re.search(r"\d+(?:\.\d+)?", b)
                    if m: p["engine_cc"] = round(float(m.group(0)))
                elif "max speed" in al:
                    m = re.search(r"\d+", b)
                    if m: p["top_speed"] = int(m.group(0))
                elif re.match(r"max ?power", al):
                    m = re.search(r"(\d+(?:\.\d+)?)", b)
                    if m and float(m.group(1)) < 200: p["power_kw"] = float(m.group(1))
                elif "net weight" in al:
                    m = re.search(r"\d+(?:\.\d+)?", b)
                    if m: p["weight_kg"] = float(m.group(0))
                elif "fuel capacity" in al:
                    m = re.search(r"\d+(?:\.\d+)?", b)
                    if m: p["fuel_tank_l"] = float(m.group(0))
                elif "engine type" in al:
                    if re.search(r"4[- ]?stroke", b, re.I): p["engine_stroke"] = "4T"
                    if re.search(r"2[- ]?stroke", b, re.I): p["engine_stroke"] = "2T"
                    if re.search(r"liquid|water", b, re.I): p["cooling"] = "Жидкостное"
                    elif re.search(r"air", b, re.I): p["cooling"] = "Воздушное"
                elif "brake" in al:
                    if re.search(r"disc", b, re.I): p["brakes"] = "Дисковые"
                    if re.search(r"hydraulic", b, re.I): p["brakes"] = "Гидравлические"
            if len(p["extra"]) < 3: continue
            out.append(p)
    json.dump(out, open(OUT + "/nicot.json", "w"), ensure_ascii=False)
    print(len(out))
    for p in out: print(p["sku"], p["cat"], p.get("engine_cc"), p.get("power_kw"), p.get("top_speed"), p.get("weight_kg"), len(p["extra"]), len(p["images"]))

main()
