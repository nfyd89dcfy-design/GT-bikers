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
            p = sane(p)
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
