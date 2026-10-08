"""阿道夫画册.pdf (KINGCHE, Product Manual Electric Motorcycle): 5 моделей, данные считаны со страниц (OCR) и сверены вручную."""
import json
import pymupdf
from common import *

FID, FNAME = "1D0HbT0elMnn4oPqPMZyNaITEZDlsfb1p", "阿道夫画册 (KINGCHE Product Manual).pdf"
M = [
 dict(id="ex007", name="EX 007", cat="ebike-sport", word="Электромотоцикл", page=3, xr=[51, 52, 53], top_speed=100, power_kw=5.0, range_km=120, battery_type="Литиевый",
      rows=[["Макс. скорость", "100 км/ч"], ["Мощность мотора", "5000 Вт"], ["Макс. крутящий момент", "230 Н·м"], ["Запас хода (при 45 км/ч)", "120 км"], ["Разгон 0–50 км/ч", "4,5 с"],
            ["Аккумулятор", "72 В 30 А·ч (NMC, 2 шт.) или 72 В 52 А·ч (LFP, 1 шт.)"], ["Приборная панель", "7\" смарт-дисплей, управление через приложение"], ["Особенности", "IoT-модуль, быстросъёмная батарея, роботизированная сварка рамы"]]),
 dict(id="lin-x", name="LIN X", cat="ebike-sport", word="Электромотоцикл", page=4, xr=[66, 68, 69], top_speed=120, power_kw=15.0,
      rows=[["Макс. скорость", "120 км/ч"], ["Мощность мотора", "15000 Вт"], ["Макс. крутящий момент", "260 Н·м"], ["Разгон 0–50 км/ч", "3,5 с"], ["Мотор", "боковой (side mounted)"], ["Освещение", "по стандарту EEC"], ["Приборная панель", "смарт-дисплей"], ["Особенности", "быстрая зарядка, большой багажный отсек под сиденьем"]]),
 dict(id="manka", name="MANKA", cat="ebike-city", word="Электроскутер в стиле ретро", page=5, xr=[78, 79, 80], rows=[["Тип", "ретро-мопед с педалями"], ["Подвеска", "односторонний передний амортизатор"], ["Мотор", "боковой (side mounted)"]]),
 dict(id="et03", name="ET 03", cat="ebike-enduro", word="Электромотоцикл", page=6, xr=[103, 87, 102], top_speed=85, max_load_kg=290, battery_v=72, battery_ah=30, battery_wh=4320, range_km=145,
      rows=[["Макс. нагрузка", "290 кг"], ["Запас хода", "145 км в городе при 45 км/ч; 95 км при 80 км/ч (по дорожным испытаниям)"], ["Аккумулятор", "72 В 30 А·ч × 2 (сменные)"], ["Макс. скорость", "85 км/ч"], ["Пиковый момент", "285 Н·м"],
            ["Мотор", "центральный, высокий момент"], ["Колёса", "17 дюймов, повышенная проходимость"]]),
 dict(id="et03-air", name="ET 03 Air", cat="ebike-enduro", word="Электромотоцикл (карбоновая рама)", page=7, xr=[112, 113, 114], top_speed=100, weight_kg=53,
      rows=[["Макс. скорость", "100 км/ч"], ["Макс. крутящий момент", "220 Н·м"], ["Масса", "до 53 кг"], ["Рама", "цельная карбоновая"], ["Назначение", "внедорожный (эндуро)"]]),
]

def main():
    d = pymupdf.open(SRC + f"/{FID}.pdf"); out = []
    for m in M:
        paths = []
        for n, xr in enumerate(m["xr"]):
            try:
                img = save_image(px_image(d, xr), f"kingche/{m['id']}-{n+1}")
                if img and img not in paths: paths.append(img)
            except Exception as e: print("img", m["id"], xr, e)
        p = {"id": "kingche-" + m["id"], "cat": m["cat"], "brand": "KINGCHE", "name": f"{m['word']} KINGCHE {m['name']}", "sku": m["name"], "images": paths, "src": FNAME, "page": m["page"], "extra": m["rows"],
             "desc": "Цена в каталоге не указана."}
        for k in ("top_speed", "power_kw", "range_km", "battery_type", "max_load_kg", "battery_v", "battery_ah", "battery_wh", "weight_kg"):
            if k in m: p[k] = m[k]
        if m["id"] in ("et03",): p["removable_battery"] = True
        out.append(p)
    json.dump(out, open(OUT + "/kingche.json", "w"), ensure_ascii=False)
    print([len(p["images"]) for p in out])

main()
