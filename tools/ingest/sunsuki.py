"""SUNSUKI product catalog.pdf: слайд = электроскутер, таблица «параметр: значение» (OCR), фото — крупная картинка слайда."""
import io, json, re
import pymupdf
from PIL import Image
from common import *
from ocr_cache import ocr_page

FID, FNAME = "1upCUl1B6-JYTUUMkBBVQB4iSbNCvwKKE", "SUNSUKI product catalog.pdf"

def val(boxes, rx):
    for b in boxes:
        if re.search(rx, b[4], re.I) and b[0] > 560:
            c = [v for v in boxes if v[0] > b[0] + 60 and abs((v[1] + v[3]) / 2 - (b[1] + b[3]) / 2) < 10 and v[0] < 900]
            c.sort(key=lambda v: v[0])
            if c: return " ".join(v[4].strip() for v in c)
    return None

def main():
    d = pymupdf.open(SRC + f"/{FID}.pdf"); out = []
    for pn in range(len(d)):
        o = ocr_page(d, FID, pn)
        mb = next((b for b in o if re.match(r"Model\s*[:：]", b[4]) and b[0] > 560), None)
        if not mb: continue
        code = re.sub(r"Model\s*[:：]\s*", "", mb[4]).strip()
        code_l = re.match(r"[A-Za-z0-9\-/ ]+", code)
        sku = (code_l.group(0).strip() if code_l else code).strip(" /")
        p = {"id": "sunsuki-" + slug(sku) + f"-{pn+1}", "cat": "ebike-city", "brand": "SUNSUKI", "sku": sku, "name": f"Электроскутер SUNSUKI {sku}", "images": [], "src": FNAME, "page": pn + 1, "extra": []}
        if re.search(r"EEC", sku): p["extra"].append(["Сертификат", "EEC"])
        mo = val(o, r"^Motor")
        if mo:
            m = re.search(r"(\d{3,5})\s*W", mo, re.I)
            if m: p["power_kw"] = int(m.group(1)) / 1000; p["extra"].append(["Мощность мотора", f"{m.group(1)} Вт"])
        bt = next((b for b in o if re.search(r"(Lithium|Lead.?acid|Gel)\s*battery", b[4], re.I) and b[0] > 560), None)
        if bt:
            bv = val(o, r"(Lithium|Lead.?acid|Gel)\s*battery")
            p["battery_type"] = "Литиевый" if re.search(r"lithium", bt[4], re.I) else "Свинцово-кислотный"
            if bv:
                m = re.search(r"(\d{2})\s*V\s*(\d{1,3})\s*Ah", bv, re.I)
                if m: p["battery_v"] = int(m.group(1)); p["battery_ah"] = int(m.group(2)); p["battery_wh"] = int(m.group(1)) * int(m.group(2))
                p["extra"].append(["Аккумулятор", f"{'литиевый' if p['battery_type']=='Литиевый' else 'свинцово-кислотный'} {bv}"])
        sp = val(o, r"Maximum Speed")
        if sp:
            m = re.search(r"(\d{2,3})", sp)
            if m: p["top_speed"] = int(m.group(1)); p["extra"].append(["Макс. скорость", f"{m.group(1)} км/ч"])
        dr = val(o, r"Driving Range")
        if dr:
            ns = [int(x) for x in re.findall(r"\d+", dr)]
            if ns: p["range_km"] = max(ns); p["extra"].append(["Запас хода", dr.replace("km", "км").replace("KM", "км")])
        br = val(o, r"Brake")
        if br:
            p["extra"].append(["Тормоза (перед/зад)", br.replace("Disc", "диск").replace("Drum", "барабан")])
            p["brakes"] = "Дисковые" if re.search(r"disc", br, re.I) else "Барабанные"
        tr = val(o, r"Tire")
        if tr: p["extra"].append(["Шины", tr])
        ch = val(o, r"Charging")
        if ch:
            m = re.search(r"(\d+)\s*-\s*(\d+)", ch)
            if m: p["charge_h"] = float(m.group(2))
            p["extra"].append(["Время зарядки", ch.replace("H", "ч")])
        wb = val(o, r"Wheelbase")
        if wb: p["extra"].append(["Колёсная база", wb.replace("mm", " мм")])
        dm = val(o, r"Dimensions")
        if dm: p["extra"].append(["Габариты", dm.replace("x", "×").replace("mm.", " мм").replace("mm", " мм")])
        co = val(o, r"Controller")
        if co: p["extra"].append(["Контроллер", co])
        me = val(o, r"Meter")
        if me: p["extra"].append(["Приборная панель", me])
        if any(re.match(r"MOQ", b[4]) for b in o): p["extra"].append(["Мин. партия (MOQ)", "20 шт."])
        if p.get("power_kw", 0) >= 3: p["cat"] = "ebike-sport"
        ims = [i for i in d[pn].get_image_info(xrefs=True) if i["xref"] and 250 < i["bbox"][2] - i["bbox"][0] < 700 and i["bbox"][3] - i["bbox"][1] > 230 and i["bbox"][0] < 500]
        if ims:
            best = max(ims, key=lambda i: (i["bbox"][2] - i["bbox"][0]) * (i["bbox"][3] - i["bbox"][1]))
            try:
                img = save_image(px_image(d, best["xref"]), f"sunsuki/{slug(sku)}-{pn+1}")
                if img: p["images"].append(img)
            except Exception as e: print("img", sku, e)
        out.append(p)
    json.dump(out, open(OUT + "/sunsuki.json", "w"), ensure_ascii=False)
    print(len(out))
    for p in out[:80]: print(p["sku"], p.get("power_kw"), p.get("battery_wh"), p.get("top_speed"), p.get("range_km"), len(p["extra"]), len(p["images"]))

main()
