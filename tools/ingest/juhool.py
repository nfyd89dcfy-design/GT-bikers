"""Juhool (产品目录2026版.pdf): ATV / UTV / SSV / F10 / багги. Таблицы напечатаны картинкой (OCR), фото на страницах серий."""
import io, json, re
import pymupdf
from PIL import Image
from common import *
from ocr_cache import ocr_page

FID, FNAME = "1IqAFJ5H3lEguH9lzSS3nkZnk-IxuwgGE", "产品目录2026版 (Juhool).pdf"
# (код, категория, слово, [(страница, половина 'L'/'R'/'A')], (страница фото, xref))
M = [("ATV200", "quad", "Квадроцикл", [(4, "R"), (5, "L")], (4, 15)), ("ATV250", "quad", "Квадроцикл", [(5, "R"), (6, "L")], (4, 15)),
     ("ATV300", "quad", "Квадроцикл", [(6, "R"), (7, "L")], (4, 16)), ("ATV320", "quad", "Квадроцикл", [(7, "R"), (8, "L")], (4, 16)),
     ("ATV350", "quad", "Квадроцикл", [(8, "R"), (9, "L")], (4, 16)), ("ATV400", "quad", "Квадроцикл", [(9, "R"), (10, "L")], (4, 16)),
     ("ATV1000 Mud", "quad", "Квадроцикл", [(10, "R"), (11, "L")], (4, 17)),
     ("UTV Titan", "utv", "Багги/UTV", [(12, "A")], (11, 43)), ("UTV Titan Pro", "utv", "Багги/UTV", [(13, "A")], (11, 44)), ("UTV Aurora", "utv", "Багги/UTV", [(14, "A")], (11, 45)),
     ("SSV Raider", "utv", "Багги/SSV", [(15, "R"), (16, "L")], (15, 64)), ("SSV Raider Pro", "utv", "Багги/SSV", [(16, "R"), (17, "L")], (15, 65)),
     ("F10 (бензин)", "car", "Мини-автомобиль", [(18, "A")], (17, 76)), ("F10 (электро)", "car", "Мини-автомобиль", [(19, "R"), (20, "L")], (17, 77)),
     ("Beach Buggy 1300", "utv", "Багги", [(21, "A")], None)]

def val_right(boxes, rx, dx=100, dy=9, ymin=None):
    for b in boxes:
        if re.search(rx, b[4], re.I) and (ymin is None or b[1] >= ymin):
            c = [v for v in boxes if v is not b and v[0] > b[0] + dx and abs((v[1] + v[3]) / 2 - (b[1] + b[3]) / 2) < dy + (b[3] - b[1]) / 2]
            if c:
                c.sort(key=lambda v: v[0]); return c[0][4].strip()
    return None

def main():
    d = pymupdf.open(SRC + f"/{FID}.pdf"); out = []
    for code, cat, word, parts, photo in M:
        boxes = []
        for pg, half in parts:
            for b in ocr_page(d, FID, pg - 1):
                if half == "L" and b[0] >= 595: continue
                if half == "R" and b[0] < 595: continue
                boxes.append(b)
        txt = " ".join(b[4] for b in sorted(boxes, key=lambda b: (round(b[1] / 8), b[0])))
        p = {"id": "juhool-" + slug(code), "cat": cat, "brand": "Juhool", "name": f"{word} Juhool {code}", "sku": code, "images": [], "src": FNAME, "page": parts[0][0], "extra": []}
        def add(label, v):
            if v: p["extra"].append([label, re.sub(r"\s+", " ", v)])
        m = re.search(r"(\d{2,3}\d*)\s*mm\s*[×xX*]\s*(\d{3,4})\s*mm\s*[×xX*]\s*(\d{3,4})\s*mm", txt)
        if m: add("Габариты", f"{m.group(1)}×{m.group(2)}×{m.group(3)} мм")
        w = val_right(boxes, r"Dry Weight|Kerb|Weight")
        if w and re.search(r"\d", w):
            mm = re.search(r"(\d{2,4})", w); 
            if mm: p["weight_kg"] = float(mm.group(1)); add("Масса", w)
        l = val_right(boxes, r"rated ?load|Max\w* ?load")
        if l:
            mm = re.search(r"(\d{2,4})", l)
            if mm: p["max_load_kg"] = float(mm.group(1)); add("Макс. нагрузка", l)
        f = val_right(boxes, r"Fuel Capacity")
        if f:
            mm = re.search(r"(\d+(?:\.\d+)?)", f)
            if mm: p["fuel_tank_l"] = float(mm.group(1)); add("Топливный бак", f)
        add("Колёсная база", val_right(boxes, r"^.{0,6}Wheelbase|轴距"))
        add("Дорожный просвет", val_right(boxes, r"Ground clearance"))
        en = val_right(boxes, r"Engine Name|Engine Model")
        add("Двигатель (марка)", en)
        et = val_right(boxes, r"Engine Type")
        mm = re.search(r"(\d{3,4})\s*CC", txt, re.I) or re.search(r"Displacement[^0-9]{0,30}(\d{3,4}(?:\.\d+)?)\s*(?:ml|cc)", txt, re.I)
        if mm: p["engine_cc"] = round(float(mm.group(1)))
        nm = re.match(r"ATV(\d{3,4})", code)
        if nm and "engine_cc" not in p: p["engine_cc"] = int(nm.group(1))
        mm = re.search(r"Displacement[^0-9]{0,30}(\d{2,4}(?:\.\d+)?)\s*(ml|cc)", txt, re.I)
        if mm: add("Рабочий объём", f"{mm.group(1)} {mm.group(2)}")
        if re.search(r"4[- ]?stroke", txt, re.I): p["engine_stroke"] = "4T"
        if re.search(r"water|liquid", txt, re.I): p["cooling"] = "Жидкостное"
        elif re.search(r"air cool", txt, re.I): p["cooling"] = "Воздушное"
        mm = re.search(r"Max\.? ?Power[^0-9]{0,15}([\d.]+)\s*kw", txt, re.I)
        if mm: p["power_kw"] = float(mm.group(1)); add("Макс. мощность", mm.group(1) + " кВт")
        mm = re.search(r"Max Torque[^0-9]{0,12}([\d.]+)\s*N", txt, re.I)
        if mm: add("Макс. момент", mm.group(1) + " Н·м")
        mm = re.search(r"(?:Max speed|Top speed|Max\.speed)[^0-9]{0,25}(\d{2,3})", txt, re.I) or re.search(r"(\d{2,3})\s*-?\d*\s*km/h", txt, re.I)
        if mm: p["top_speed"] = int(mm.group(1)); add("Макс. скорость", mm.group(1) + " км/ч")
        if re.search(r"4WD|4x4|four.wheel|四驱", txt, re.I) or (nm and int(nm.group(1)) >= 300): p["drivetrain"] = "4WD"
        elif re.search(r"2WD|2x4", txt, re.I) or code in ("ATV200", "ATV250"): p["drivetrain"] = "2WD"
        mm = re.search(r"(\d)\s*(?:Seats?|People|座)", txt, re.I)
        if mm: p["seats"] = int(mm.group(1))
        if re.search(r"disc", txt, re.I): p["brakes"] = "Дисковые"
        if re.search(r"hydraulic", txt, re.I): p["brakes"] = "Гидравлические"
        mm = re.search(r"Front Tires?\s*([\dxX\-\.]+)", txt, re.I)
        if mm: add("Передние шины", mm.group(1))
        mm = re.search(r"Rear ?Tires?\s*([\dxX\-\.]+)", txt, re.I)
        if mm: add("Задние шины", mm.group(1))
        add("Скорость по таблице (км/ч)", None)
        if code.startswith("F10") and "электро" in code:
            p["battery_type"] = "Литиевый"; mm = re.search(r"(\d{3})\s*(?:km|Km)", txt)
        if photo:
            pg, xr = photo
            try:
                pxi = px_image(d, xr)
                img = save_image(pxi, f"juhool/{slug(code)}")
                if img: p["images"].append(img)
            except Exception as e: print("img", code, e)
        out.append(p)
    json.dump(out, open(OUT + "/juhool.json", "w"), ensure_ascii=False)
    for p in out: print(p["sku"], p.get("engine_cc"), p.get("power_kw"), p.get("top_speed"), p.get("weight_kg"), p.get("max_load_kg"), p.get("drivetrain"), len(p["extra"]), len(p["images"]))

main()
