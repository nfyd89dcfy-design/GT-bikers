"""Собирает data/products.js из промежуточных json (out/*.json): убирает повторы, чистит поля."""
import glob, json, os, re, sys
from common import OUT, REPO

ORDER = ["ebike-sport", "ebike-city", "ebike-enduro", "moto", "quad", "utv", "golf", "car", "snow", "gear", "parts"]

def key(p):
    s = re.sub(r"[^0-9a-zа-я]+", "", (p.get("sku") or p["name"]).lower())
    return (p.get("brand", "").lower(), p["cat"], s, p.get("power_kw"), p.get("battery_wh"))

def main():
    items, seen = [], {}
    for f in sorted(glob.glob(OUT + "/*.json")):
        for p in json.load(open(f)):
            p = {k: v for k, v in p.items() if v is not None and v != "" and v != []}
            if "images" not in p: p["images"] = []
            k = key(p)
            if k in seen:                       # повтор: дополняем недостающее
                q = seen[k]
                for kk, vv in p.items():
                    if kk not in q: q[kk] = vv
                if len(p["images"]) > len(q["images"]): q["images"] = p["images"]
                q.setdefault("alt", []).append(p.get("src", ""))
                continue
            seen[k] = p; items.append(p)
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
