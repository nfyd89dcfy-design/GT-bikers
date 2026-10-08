"""巨龙进出口产品目录2026.pdf (JULONG, электромотоциклы и скутеры): ячейка = модель; код над строкой «PARAMETER CONFIGURATION» (OCR)."""
import json, re
import pymupdf
from common import *
from ocr_cache import ocr_page

FID, FNAME = "1Sd2zp-v4_LJsKlVSbs77f6kYuodHtp9z", "巨龙进出口产品目录2026 (JULONG).pdf"
THREE = {"JL18", "JC", "D1"}

def main():
    d = pymupdf.open(SRC + f"/{FID}.pdf"); out = []; seen = set()
    for pn in range(3, 19):
        o = ocr_page(d, FID, pn)
        heads = [b for b in o if b[4].strip().upper().startswith("PARAMETER")]
        heads = [h for h in heads if not any(abs(h[1] - g[1]) < 6 and 0 < h[0] - g[0] < 60 and g[4].upper().startswith("PARAMETER") for g in heads if g is not h)]
        imgs = [i for i in d[pn].get_image_info(xrefs=True) if i["xref"] and i["bbox"][2] - i["bbox"][0] > 70 and i["bbox"][3] - i["bbox"][1] > 60]
        for h in heads:
            left = [b for b in o if abs((b[1] + b[3]) / 2 - (h[1] + h[3]) / 2) < 12 and 0 < h[0] - b[2] < 260 and re.match(r"^[A-Za-z0-9\-]{2,8}( ?[A-Za-z0-9]{1,5})?$", b[4].strip())]
            if not left: continue
            c = min(left, key=lambda b: h[0] - b[2])
            code = c[4].strip().upper().replace("0", "0")
            cx = c[0]
            reg = sorted([b for b in o if h[1] + 6 < b[1] < h[1] + 80 and cx - 10 <= b[0] < cx + 285], key=lambda b: (round(b[1] / 6), b[0]))
            txt = " ".join(b[4] for b in reg)
            dm = re.search(r"DIMENSI.N\s*:?\s*(\d{3,4})\s*[XxХ×*]\s*(\d{3,4})\s*[XxХ×*]\s*(\d{3,4})", txt, re.I)
            bat = re.search(r"BATTERY CAPACITY\s*:?\s*([\w/\-\. ]+?)\s*(?:MOTOR|TYRE|MAXIMUM|RANGE|$)", txt, re.I)
            mot = re.search(r"MOTOR\s*:?\s*([\d\-]+)\s*W", txt, re.I)
            tyr = re.search(r"TYRE\s*:?\s*([\w\.\-;/ ]+?)\s*(?:MAXIMUM|RANGE|BATTERY|DIMENS|$)", txt, re.I)
            spd = re.search(r"MAXIMUM\s*SPEED\s*:?\s*(\d{2,3})", txt, re.I)
            rng = re.search(r"RANGE DISTANCE\s*:?\s*(\d{2,3})(?:\s*KM)?(?:\s*-\s*(\d{2,3}))?", txt, re.I)
            if not (dm or mot or spd): continue
            key = (code, dm.group(0) if dm else "")
            if key in seen: continue
            seen.add(key)
            p = {"id": f"julong-{slug(code)}-{pn+1}", "cat": "ebike-city", "brand": "JULONG", "sku": code, "name": f"Электроскутер/мотоцикл JULONG {code}", "images": [], "src": FNAME, "page": pn + 1, "extra": []}
            if dm: p["extra"].append(["Габариты", f"{dm.group(1)}×{dm.group(2)}×{dm.group(3)} мм"])
            if bat:
                bt = bat.group(1).strip(" :-"); p["extra"].append(["Аккумулятор", bt])
                mv = re.findall(r"(\d{2})V", bt); ma = re.findall(r"(\d{2,3})\s*A[Hh]", bt)
                if mv: p["battery_v"] = int(mv[-1])
                if mv and ma: p["battery_ah"] = int(ma[0]); p["battery_wh"] = int(mv[-1]) * int(ma[0])
            if mot:
                w = max(int(x) for x in re.findall(r"\d+", mot.group(1)))
                if w >= 100: p["power_kw"] = w / 1000; p["extra"].append(["Мощность мотора", f"{w} Вт"])
            if tyr: p["extra"].append(["Шины", tyr.group(1).strip()])
            if spd: p["top_speed"] = int(spd.group(1)); p["extra"].append(["Макс. скорость", f"{spd.group(1)} км/ч"])
            if rng:
                p["range_km"] = int(rng.group(2) or rng.group(1)); p["extra"].append(["Запас хода", f"{rng.group(1)}" + (f"–{rng.group(2)}" if rng.group(2) else "") + " км"])
            if code in THREE: p["cat"] = "car"; p["name"] = f"Электротрицикл JULONG {code}"
            elif p.get("power_kw", 0) >= 3: p["cat"] = "ebike-sport"
            cand = [i for i in imgs if cx - 30 <= (i["bbox"][0] + i["bbox"][2]) / 2 < cx + 290 and h[1] - 245 <= i["bbox"][3] <= h[1] + 12]
            if cand:
                best = max(cand, key=lambda i: (i["bbox"][2] - i["bbox"][0]) * (i["bbox"][3] - i["bbox"][1]))
                try:
                    img = save_image(px_image(d, best["xref"]), f"julong/{slug(code)}-{pn+1}", min_side=60)
                    if img: p["images"].append(img)
                except Exception as e: print("img", code, e)
            out.append(p)
    json.dump(out, open(OUT + "/julong.json", "w"), ensure_ascii=False)
    print(len(out))
    for p in out: print(p["sku"], p["cat"], p.get("power_kw"), p.get("top_speed"), p.get("range_km"), p.get("battery_v"), len(p["extra"]), len(p["images"]))

main()
