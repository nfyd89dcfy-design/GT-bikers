"""2026JY-Product Introduction.pdf (Juyang): страница = модель, 4 строки параметров (OCR, строки на английском и китайском)."""
import json, re
import pymupdf
from PIL import Image
from common import *
from ocr_cache import ocr_page

FID, FNAME = "1_SGQqTbAfsheB2OEmM9ETsiIV2NdATVU", "2026JY-Product Introduction.pdf"
MANUAL = {"JY46": ("car", "Электротрицикл"), "JY52": ("quad", "Электроквадроцикл")}

def main():
    d = pymupdf.open(SRC + f"/{FID}.pdf"); out = []
    for pn in range(1, len(d)):
        o = ocr_page(d, FID, pn)
        code = next((b[4].strip() for b in o if re.match(r"^JY[M\-\d][\w\-]*$", b[4].strip()) and b[1] < 80), None)
        if not code: continue
        lines = [b[4] for b in sorted(o, key=lambda b: (round(b[1] / 8), b[0]))]
        txt = " ".join(lines)
        cn = {k: v for k in ("电机", "控制器", "功能", "轮胎", "排量", "发动机", "制冷系统", "点火系统") for v in [next((re.sub(rf"^{k}[：:]", "", l) for l in lines if l.startswith(k)), None)] if v}
        p = {"id": "jy-" + slug(code), "brand": "Juyang (JY)", "sku": code, "images": [], "src": FNAME, "page": pn + 1, "extra": []}
        petrol = "排量" in cn or re.search(r"Displacement", txt, re.I)
        if petrol:
            p["cat"] = "moto"; p["name"] = f"Мотороллер/мотоцикл Juyang {code}"
            m = re.search(r"(\d{2,3}(?:\.\d)?)\s*ML", cn.get("排量", "") + " " + txt, re.I)
            if m: p["engine_cc"] = round(float(m.group(1))); p["extra"].append(["Объём", f"{m.group(1)} см³"])
            p["extra"].append(["Двигатель", "одноцилиндровый, 4-тактный"]); p["engine_stroke"] = "4T"
            p["cooling"] = "Воздушное"; p["extra"].append(["Охлаждение", "воздушное"]); p["extra"].append(["Зажигание", "CDI"])
        else:
            p["cat"], word = MANUAL.get(code, ("ebike-city", "Электроскутер"))
            p["name"] = f"{word} Juyang {code}"
            m = re.search(r"(\d{3,5})\s*W", cn.get("电机", ""), re.I) or re.search(r"(\d{3,5})\s*w\b", txt, re.I)
            if m:
                w = int(m.group(1))
                if w < 100: w = None
                if w: p["power_kw"] = w / 1000; p["extra"].append(["Мощность мотора", f"{w} Вт"])
            if p.get("power_kw", 0) >= 3 and p["cat"] == "ebike-city": p["cat"] = "ebike-sport"
            mv = re.search(r"(\d{2})V", cn.get("控制器", "") or txt)
            if mv: p["battery_v"] = int(mv.group(1))
            if cn.get("控制器"): p["extra"].append(["Контроллер", cn["控制器"].replace("管", "-ламповый")])
        bm = re.search(r"F-?Disc/R-?Disc|F-Disc/R-Drum", txt, re.I)
        if bm:
            p["brakes"] = "Дисковые" if "R-Disc" in bm.group(0).replace("R-Disc", "R-Disc") and "Drum" not in bm.group(0) else "Барабанные"
            p["extra"].append(["Тормоза", "передний и задний дисковые" if "Drum" not in bm.group(0) else "передний дисковый, задний барабанный"])
        tm = re.search(r"Tyre?:\s*([^;]*?)(?:Provavail|可提供|$)", txt)
        if cn.get("轮胎"): p["extra"].append(["Шины", cn["轮胎"].replace("前后", "перед и зад ").replace("前", "перед ").replace("后", " зад ").strip()])
        # фото: верхняя часть страницы с моделью
        img_boxes = [i for i in d[pn].get_image_info() if i["bbox"][2] - i["bbox"][0] > 300]
        if img_boxes:
            bb = img_boxes[0]["bbox"]
            pm = d[pn].get_pixmap(dpi=130, clip=pymupdf.Rect(max(0, bb[0]), 40, min(720, bb[2]), 360))
            im = Image.frombytes("RGB", (pm.width, pm.height), pm.samples)
            img = save_image(im, f"jy/{slug(code)}", min_side=60)
            if img: p["images"].append(img)
        out.append(p)
    json.dump(out, open(OUT + "/jy.json", "w"), ensure_ascii=False)
    print(len(out))
    for p in out: print(p["sku"], p["cat"], p.get("power_kw"), p.get("engine_cc"), p.get("battery_v"), p.get("brakes"), len(p["extra"]), len(p["images"]))

main()
