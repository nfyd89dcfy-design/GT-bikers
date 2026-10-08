"""SIEKON -CATALOGUE.pdf: 4 модели (ELT, ADV, VISCOT, C8S), таблицы характеристик в текстовом слое."""
import io, json, re
import pymupdf
from PIL import Image
from common import *

FID, FNAME = "1pSSjpn9f_Ye3P68rcOjwcUDnaGpvou7m", "SIEKON -CATALOGUE.pdf"
MODELS = [("ELT", "ebike-sport", "Электромотоцикл", 9, (4, 9)), ("ADV", "ebike-sport", "Электромотороллер (макси)", 13, (10, 13)),
          ("VISCOT", "ebike-city", "Электроскутер", 17, (14, 17)), ("C8S", "ebike-city", "Электроскутер", 21, (18, 21))]
LAB = {"Overall L×W×H": "Габариты", "Wheelbase": "Колёсная база", "Seat Height": "Высота сиденья", "Min Ground Clearance": "Дорожный просвет", "Curb Weight": "Снаряжённая масса",
       "Max Rated Load": "Макс. нагрузка", "Motor Type": "Тип мотора", "Motor Rated Power": "Номинальная мощность", "Motor Peak Power": "Пиковая мощность", "Maximum Speed": "Макс. скорость",
       "Battery Specification": "Аккумулятор", "Battery Capacity": "Энергия батареи", "Range": "Запас хода", "Standard Charging Time": "Время зарядки", "Fast Charging Time (optional)": "Быстрая зарядка (опция)",
       "Front Brake System": "Передний тормоз", "Rear Brake System": "Задний тормоз", "CBS": "CBS", "ABS": "ABS", "Front Tire Specification": "Передняя шина", "Rear Tire Specification": "Задняя шина",
       "Front Suspension": "Передняя подвеска", "Rear Suspension": "Задняя подвеска"}

PICKS = {"ELT": [130, 131, 132, 133], "ADV": [151, 150, 152], "VISCOT": [168, 169, 170, 171], "C8S": [183, 190]}

def main():
    d = pymupdf.open(SRC + f"/{FID}.pdf"); out = []
    for code, cat, word, spage, (p0, p1) in MODELS:
        lines = [l.strip() for l in d[spage - 1].get_text().split("\n") if l.strip()]
        pairs = {}
        for i, l in enumerate(lines):
            if l in LAB and i + 1 < len(lines): pairs[l] = lines[i + 1]
        p = {"id": "siekon-" + slug(code), "cat": cat, "brand": "SIEKON", "sku": code, "name": f"{word} SIEKON {code}", "images": [], "src": FNAME, "page": spage, "extra": []}
        def num_(k, rx):
            m = re.search(rx, pairs.get(k, ""))
            return float(m.group(1).replace(",", ".")) if m else None
        for k, v in pairs.items():
            vv = v.replace("*", "×").replace("Up to", "до").replace("constant speed", "при постоянной скорости").replace("hydraulic", "гидравлический").replace("Hydraulic", "гидравлический").replace("disc brake", "дисковый тормоз")
            vv = vv.replace("Tubeless", "бескамерная").replace("standard", "серийно").replace("Not fitted", "нет").replace("Dual", "двойной").replace("telescopic fork", "телескопическая вилка").replace("spring shock", "пружинный амортизатор")
            p["extra"].append([LAB[k], vv])
        v = num_("Motor Rated Power", r"(\d{3,6})\s*W");  p["power_kw"] = v / 1000 if v else None
        v = num_("Maximum Speed", r"(\d{2,3})"); p["top_speed"] = v
        v = num_("Range", r"(\d{2,3})\s*km"); p["range_km"] = v
        v = num_("Curb Weight", r"(\d{2,3})"); p["weight_kg"] = v
        v = num_("Max Rated Load", r"(\d{2,3})"); p["max_load_kg"] = v
        v = num_("Battery Capacity", r"(\d{3,6})\s*Wh"); p["battery_wh"] = v
        m = re.search(r"(\d{2,3})V", pairs.get("Battery Specification", ""))
        if m: p["battery_v"] = int(m.group(1))
        m = re.search(r"(\d{2,3})Ah", pairs.get("Battery Specification", ""))
        if m: p["battery_ah"] = int(m.group(1))
        p["battery_type"] = "Литиевый"
        m = re.search(r"(\d)-(\d)h", pairs.get("Standard Charging Time", ""))
        if m: p["charge_h"] = float(m.group(2))
        p["brakes"] = "Гидравлические"
        p = {k: v for k, v in p.items() if v is not None}
        for n, xr in enumerate(PICKS[code]):
            try:
                img = save_image(px_image(d, xr), f"siekon/{slug(code)}-{n+1}")
                if img and img not in p["images"]: p["images"].append(img)
            except Exception as e: print("img", code, e)
        out.append(p)
    json.dump(out, open(OUT + "/siekon.json", "w"), ensure_ascii=False)
    for p in out: print(p["sku"], p.get("power_kw"), p.get("top_speed"), p.get("range_km"), p.get("battery_wh"), len(p["extra"]), len(p["images"]))

main()
