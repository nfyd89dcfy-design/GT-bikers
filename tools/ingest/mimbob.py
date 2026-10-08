"""mimbob (压缩版mimbob 大车宣传折页): плакат Selection Guide с электрокроссами EM22-x и TK-x; ячейка = модель (OCR + рендер области страницы)."""
import json, re
import pymupdf
from PIL import Image
from common import *
from ocr_cache import ocr_page

FID, FNAME = "1rVCNWG7eFPxOMISxi_oBdw69iIoFLU3t", "mimbob Selection Guide.pdf"

def main():
    d = pymupdf.open(SRC + f"/{FID}.pdf"); out = []
    for pn in range(2):
        o = ocr_page(d, FID, pn)
        names = [b for b in o if re.match(r"^(EM22-\d+[A-Z]?|TK\d+S?|EM\d+-\d+)$", b[4].strip(), re.I)]
        names.sort(key=lambda b: (round(b[1] / 40), b[0]))
        for nb in names:
            code = nb[4].strip().upper()
            x0, y0 = nb[0], nb[1]
            pro = any(b[4].strip().upper() == "PRO" and abs(b[1] - y0) < 30 and 0 < b[0] - nb[2] < 130 for b in o)
            S = any(b[4].strip().upper() == "S" and abs(b[1] - y0) < 30 and 0 < b[0] - nb[2] < 90 for b in o)
            reg = sorted([b for b in o if x0 - 40 <= b[0] < x0 + 420 and y0 + 150 < b[1] < y0 + 380], key=lambda b: (round(b[1] / 8), b[0]))
            txt = " ".join(b[4] for b in reg)
            bat = re.search(r"(\d{2})\s*V\s*/?\s*(\d{2,3}(?:\.\d)?)\s*AH", txt, re.I)
            pw = re.search(r"(\d{3,5})\s*W\s*/\s*(\d{3,5})\s*W", txt, re.I) or re.search(r"(\d{3,5})\s*W", txt)
            sp = re.search(r"(\d{2,3})\s*km/h", txt, re.I)
            rg = re.search(r"(\d{2,3})\s*km(?!/)", txt, re.I)
            if not (bat or pw): continue
            sku = code + (" PRO" if pro else "") + (" S" if S and not code.endswith("S") else "")
            p = {"id": f"mimbob-{slug(sku)}-{pn+1}", "cat": "ebike-enduro", "brand": "mimbob", "sku": sku, "name": f"Электро-эндуро mimbob {sku}", "images": [], "src": FNAME, "page": pn + 1, "extra": []}
            if bat:
                p["battery_v"] = int(bat.group(1)); p["battery_ah"] = float(bat.group(2)); p["battery_wh"] = round(p["battery_v"] * p["battery_ah"]); p["battery_type"] = "Литиевый"
                p["extra"].append(["Аккумулятор", f"{bat.group(1)} В {bat.group(2)} А·ч"])
            if pw:
                if pw.lastindex == 2:
                    p["power_kw"] = int(pw.group(1)) / 1000; p["extra"].append(["Мощность (номинал / пик)", f"{pw.group(1)} / {pw.group(2)} Вт"])
                else: p["power_kw"] = int(pw.group(1)) / 1000; p["extra"].append(["Мощность", f"{pw.group(1)} Вт"])
            if sp: p["top_speed"] = int(sp.group(1)); p["extra"].append(["Макс. скорость", f"{sp.group(1)} км/ч"])
            if rg: p["range_km"] = int(rg.group(1)); p["extra"].append(["Запас хода", f"до {rg.group(1)} км"])
            m = re.search(r"Wheels\s*:?\s*(Fr[^C]*?(?:Rr|RR)[\.:]?\s*[\d/\-]+)", txt, re.I)
            if m: p["extra"].append(["Колёса", m.group(1).replace("Fr", "перед").replace("Rr", "зад").replace(":", " ").strip()])
            m = re.search(r"Charge Time\s*:?\s*[～~]?\s*(\d+)\s*hours", txt, re.I)
            if m: p["charge_h"] = float(m.group(1)); p["extra"].append(["Время зарядки", f"около {m.group(1)} ч"])
            m = re.search(r"Charger\s*:?\s*([\d\.]+\s*V\s*/\s*\d+\s*A)", txt, re.I)
            if m: p["extra"].append(["Зарядное устройство", m.group(1).replace(" ", "")])
            m = re.search(r"Gear Modes\s*:?\s*([\d/ ]+)\s*KM/H", txt, re.I)
            if m: p["extra"].append(["Режимы скорости", m.group(1).strip() + " км/ч"])
            m = re.search(r"Max loading\s*:?\s*(\d+)\s*KG", txt, re.I)
            if m: p["max_load_kg"] = int(m.group(1)); p["extra"].append(["Макс. нагрузка", f"{m.group(1)} кг"])
            m = re.search(r"N\.?W\.?/G\.?W\.?\s*:?\s*(\d+)\s*KGS?\s*/\s*([\d\.]+)\s*KGS?", txt, re.I)
            if m: p["weight_kg"] = float(m.group(1)); p["extra"].append(["Масса нетто / брутто", f"{m.group(1)} / {m.group(2)} кг"])
            m = re.search(r"Carton Size\s*:?\s*([\d×xX]+)\s*M{1,2}", txt, re.I)
            if m: p["extra"].append(["Упаковка, мм", m.group(1).replace("x", "×").replace("X", "×")])
            clip = pymupdf.Rect(max(0, x0 - 30), y0 + 8, min(d[pn].rect.width, x0 + 400), y0 + 215)
            pm = d[pn].get_pixmap(dpi=110, clip=clip)
            img = save_image(Image.frombytes("RGB", (pm.width, pm.height), pm.samples), f"mimbob/{slug(sku)}-{pn+1}", min_side=60)
            if img: p["images"].append(img)
            out.append(p)
    json.dump(out, open(OUT + "/mimbob.json", "w"), ensure_ascii=False)
    print(len(out))
    for p in out: print(p["sku"], p.get("battery_wh"), p.get("power_kw"), p.get("top_speed"), p.get("range_km"), p.get("max_load_kg"), len(p["extra"]), len(p["images"]))

main()
