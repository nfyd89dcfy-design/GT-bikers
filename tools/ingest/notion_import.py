"""Каталог в Notion («Каталог GT Bikes»): модели поставщиков, которых нет в файлах на Google Диске.
Строки выгружены из Notion в $GT_WORK/notion/part_*.json как есть. Цен и фото в Notion нет, поэтому карточки без цены и без фото.
Контакты поставщиков (e-mail, телефоны, сайты) из примечаний вырезаются."""
import glob
import json
import os
import re

from common import OUT, WORK, slug

BRAND_FIX = {"钱江之星 (Qianjiang Star)": "Qianjiang Star", "钱江之星": "Qianjiang Star", "Rongfa": "Rongfa", "Power Forever": "Power Forever"}
SKIP_SENT = re.compile(r"моя оценка|моя классификация|моя оценка по|мо[яй] вывод", re.I)
CONTACT = re.compile(r"(контакт[ы]?:[^.]*\.?|[\w.\-]+@[\w.\-]+\.\w+|\+?\d[\d\s\-()]{8,}\d|www\.[\w.\-/]+)", re.I)


def clean_note(s):
    if not s:
        return ""
    s = CONTACT.sub("", s)
    parts = [x.strip() for x in re.split(r"(?<=[.!?])\s+", s) if x.strip() and not SKIP_SENT.search(x)]
    return " ".join(parts).strip(" ,;")


def category(r):
    t, text = r.get("t") or "", " ".join(str(r.get(k) or "") for k in ("m", "e", "x", "n")).lower()
    sp, w = r.get("sp") or 0, r.get("w") or 0
    if t == "Электробайк":
        if re.search(r"кросс|эндуро|enduro|мотокросс|питбайк", text): return "ebike-enduro"
        if sp >= 70 or w >= 3000: return "ebike-sport"
        return "ebike-city"
    if t == "Квадроцикл": return "quad"
    if t == "Багги": return "utv"
    if t == "Зимняя техника": return "snow"
    if t == "Мотоцикл (бензин)": return "moto"
    if t == "Комплектующие": return "parts"
    if re.search(r"utv|багги|side.?by.?side", text): return "utv"
    if re.search(r"гольф|экскурс|автобус|туристическ|сафари|шаттл", text): return "golf"
    if re.search(r"квадр|atv", text): return "quad"
    if re.search(r"снегоход|гусениц|вездеход", text): return "snow"
    return "car"


WORD = {"ebike-sport": "Электромотоцикл", "ebike-city": "Электроскутер", "ebike-enduro": "Электро-эндуро", "moto": "Мотоцикл", "quad": "Квадроцикл", "utv": "Багги/UTV",
        "golf": "Электромобиль", "car": "Транспорт", "snow": "Снегоход/вездеход", "parts": "Комплектующие"}


def num(x):
    try:
        return float(str(x).replace(",", ".").replace("\u00a0", "").strip()) if str(x).strip() else None
    except ValueError:
        return None


def main():
    import csv
    src = os.path.join(os.path.dirname(os.path.abspath(__file__)), "data", "notion_catalog.csv")
    rows = []
    for d in csv.DictReader(open(src, encoding="utf-8-sig")):
        rows.append({"u": d["Модель"] + "|" + d["Бренд"] + "|" + d["Страница в каталоге"], "b": d["Бренд"] or None, "m": d["Модель"], "t": d["Тип"], "w": num(d["Мощность, Вт"]),
                     "cc": num(d["Объем, куб. см"]), "wh": num(d["Батарея, Вт·ч"]), "v": num(d["Напряжение, В"]), "sp": num(d["Макс. скорость, км/ч"]), "r": num(d["Запас хода, км"]),
                     "kg": num(d["Вес, кг"]), "ld": num(d["Макс. нагрузка, кг"]), "e": d["Двигатель/привод"], "s": d["Подвеска/тормоза/колеса"], "x": d["Выжимка"],
                     "n": d["Примечания"], "pg": d["Страница в каталоге"], "who": d["Для кого"], "sup": d["Поставщик"]})
    out, seen = [], set()
    for r in rows:
        if r["u"] in seen: continue
        seen.add(r["u"])
        brand = BRAND_FIX.get(r.get("b"), r.get("b")) or r.get("sup") or "Поставщик не указан"
        model = re.sub(r"\s+", " ", r["m"]).strip()
        if (brand == "ZZSSV" and model.startswith("ZZ-1400")) or (brand == "mimbob" and "TK5" in model): continue  # уже есть на сайте с фото
        cat = category(r)
        name = model if (brand.lower() in model.lower() or cat == "parts") else "%s %s" % (brand, model)
        p = {"id": "nt-" + slug(brand + "-" + model, 60) + "-" + str(abs(hash(r["u"])) % 10**5), "cat": cat, "brand": brand, "name": name, "sku": model, "images": [],
             "src": r.get("pg") or "каталог поставщика", "extra": []}
        if r.get("w"): p["power_kw"] = round(r["w"] / 1000, 2)
        if r.get("cc"): p["engine_cc"] = round(r["cc"])
        if r.get("wh"): p["battery_wh"] = round(r["wh"])
        if r.get("v"): p["battery_v"] = r["v"]
        if r.get("sp"): p["top_speed"] = r["sp"]
        if r.get("r"): p["range_km"] = r["r"]
        if r.get("kg"): p["weight_kg"] = r["kg"]
        if r.get("ld"): p["max_load_kg"] = r["ld"]
        if r.get("e"): p["extra"].append(["Двигатель / привод", r["e"]])
        if r.get("s"): p["extra"].append(["Подвеска, тормоза, колёса", r["s"]])
        note = clean_note(r.get("n"))
        if note: p["extra"].append(["Примечание", note])
        p["desc"] = clean_note(r.get("x")) or ""
        p["desc"] = (p["desc"] + " " if p["desc"] else "") + "Цена и фото в источнике не указаны."
        out.append(p)
    json.dump(out, open(OUT + "/notion.json", "w"), ensure_ascii=False)
    import collections
    print(len(out), dict(collections.Counter(p["cat"] for p in out)))


main()
