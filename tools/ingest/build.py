"""Собирает data/products.js из промежуточных json (out/*.json): убирает повторы, чистит поля."""
import glob, json, os, re, sys
from common import OUT, REPO

ORDER = ["ebike-sport", "ebike-city", "ebike-enduro", "moto", "quad", "utv", "golf", "car", "snow", "gear", "parts"]

OCR_SRC = ("2027 NICOT", "ELECTRIC CATALOGUE", "产品目录2026版", "2026JY", "SUNSUKI", "巨龙", "mimbob", "Product Manual", "阿道夫", "欧铂尔虬龙")
VEH_HEAVY = ("quad", "utv", "golf", "car", "snow")

def key(p):
    s = re.sub(r"[^0-9a-zа-я]+", "", (p.get("sku") or p["name"]).lower())
    if p.get("brand") == "Minibus":
        return ("minibus", s)
    return (p.get("brand", "").lower(), p["cat"], s, p.get("power_kw"), p.get("battery_wh"))

CJK = re.compile(r"[\u2e80-\u9fff\u3000-\u303f\uff00-\uffef]+")

def clean_name(p):
    n = re.sub(r"\s+", " ", p["name"].replace("\n", " ")).strip()
    cn = CJK.findall(n)
    if cn:
        p.setdefault("extra", []).append(["Название в прайсе (кит.)", " ".join(cn)])
        n = re.sub(r"\s+", " ", CJK.sub(" ", n)).strip(" -–/")
    if len(n) > 60 and "(" in n:
        n = re.sub(r"\s*\(.*?\)", "", n).strip()
    p["name"] = n
    return p

def _n(s):
    m = re.search(r"\d[\d\s]*(?:[.,]\d+)?", str(s))
    if not m: return None
    try: return float(m.group(0).replace(" ", "").replace(",", "."))
    except ValueError: return None

def derive(p):
    """Достаёт числовые параметры из строк таблицы характеристик, чтобы по ним работали фильтры и сортировка."""
    if p["cat"] in ("gear", "parts"): return p
    for lab, val in p.get("extra", []):
        l = lab.lower(); n = _n(val)
        if n is None: continue
        def put(k, v, lo, hi):
            if k not in p and v is not None and lo <= v <= hi: p[k] = round(v, 1)
        mm = n * 10 if "см" in l and "мм" not in l else n
        if l.startswith("колёсная база") or l.startswith("колесная база"): put("wheelbase_mm", mm, 400, 4000)
        elif l.startswith("высота сиденья"): put("seat_height_mm", mm, 300, 1500)
        elif l.startswith("дорожный просвет") or l.startswith("клиренс"): put("ground_clearance_mm", mm if mm > 60 or "мм" in l else n * 10, 30, 600)
        elif l.startswith("габариты"):
            if "упаков" not in l: put("length_mm", mm, 600, 8000)
        elif ("момент" in l) and "тормоз" not in l: put("torque_nm", n, 2, 2500)
        elif l.startswith("пиковая мощность"):
            put("peak_power_kw", n / 1000 if re.search(r"\d\s*вт", str(val).lower()) and "квт" not in str(val).lower() else n, 0.1, 400)
    return p

def powertrain(p):
    """Тип двигателя: бензин или электро (по полям ДВС и батареи, по категории и названию)."""
    if p["cat"] in ("gear", "parts") or "powertrain" in p: return p
    name = (p.get("name", "") + " " + p.get("sku", "")).lower()
    petrol = any(k in p for k in ("engine_cc", "engine_stroke", "fuel_tank_l"))
    electric = p["cat"].startswith("ebike") or any(k in p for k in ("battery_v", "battery_ah", "battery_wh", "battery_type", "removable_battery")) or "electric" in name or "электро" in name
    if petrol and not electric: p["powertrain"] = "Бензин"
    elif electric and not petrol: p["powertrain"] = "Электро"
    elif petrol and electric: p["powertrain"] = "Электро" if p["cat"].startswith("ebike") else "Бензин"
    return p

def sane(p):
    """Убирает заведомо неправдоподобные числа, которые могли получиться при распознавании."""
    def drop(k, lo, hi):
        v = p.get(k)
        if v is not None and not (lo <= v <= hi): p.pop(k)
    if p["cat"] in ("gear", "parts"): return p
    drop("top_speed", 5, 250); drop("power_kw", 0.05, 250); drop("engine_cc", 20, 2500); drop("range_km", 3, 1000)
    drop("battery_wh", 100, 40000); drop("battery_v", 12, 800); drop("seats", 1, 20); drop("max_load_kg", 20, 3000)
    drop("weight_kg", 8, 5000); drop("fuel_tank_l", 0.5, 200); drop("charge_h", 0.5, 30)
    if p["cat"] in VEH_HEAVY: drop("weight_kg", 60, 5000)
    return p

def main():
    items, seen = [], {}
    for f in sorted(glob.glob(OUT + "/*.json")):
        for p in json.load(open(f)):
            p = {k: v for k, v in p.items() if v is not None and v != "" and v != []}
            if "images" not in p: p["images"] = []
            if any(str(p.get("src", "")).startswith(s) for s in OCR_SRC): p["ocr"] = True
            p = sane(powertrain(derive(clean_name(p))))
            k = key(p)
            if k in seen:                       # повтор: дополняем недостающее
                q = seen[k]
                for kk, vv in p.items():
                    if kk not in q: q[kk] = vv
                if len(p["images"]) > len(q["images"]): q["images"] = p["images"]
                q.setdefault("alt", []).append(p.get("src", ""))
                continue
            seen[k] = p; items.append(p)
    missing = 0
    for p in items:                      # убираем ссылки на несуществующие файлы
        ok = [i for i in p["images"] if os.path.exists(os.path.join(REPO, i))]
        missing += len(p["images"]) - len(ok); p["images"] = ok
    if missing: print("битых ссылок на фото убрано:", missing)
    ids = {}
    for p in items:
        base = p["id"]; n = ids.get(base, 0); ids[base] = n + 1
        if n: p["id"] = "%s-%d" % (base, n + 1)
    items.sort(key=lambda p: (ORDER.index(p["cat"]) if p["cat"] in ORDER else 99, p.get("brand", ""), p["name"]))
    os.makedirs(REPO + "/data", exist_ok=True)
    with open(REPO + "/data/products.js", "w") as fh:
        fh.write("/* Сгенерировано tools/ingest/build.py из прайсов и каталогов поставщиков. Не править вручную. */\nwindow.PRODUCTS = [\n")
        fh.write(",\n".join(json.dumps(p, ensure_ascii=False, separators=(",", ":")) for p in items))
        fh.write("\n];\n")
    from collections import Counter
    print(len(items), "моделей;", dict(Counter(p["cat"] for p in items)))
    print("с фото:", sum(1 for p in items if p["images"]), " с ценой:", sum(1 for p in items if "price" in p))

main()
