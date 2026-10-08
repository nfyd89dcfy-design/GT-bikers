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
            side = [g for g in heads if g is not h and abs(g[1] - h[1]) < 12 and g[0] > h[0] + 30]
            xr = (min(g[0] for g in side) - (h[0] - cx) - 8) if side else d[pn].rect.width
            below_ = [g[1] for g in heads if g is not h and g[1] > h[1] + 20 and g[0] < xr and g[2] > cx]
            yb = min([h[1] + 135] + [y - 3 for y in below_])
            reg = sorted([b for b in o if h[1] + 6 < b[1] < yb and cx - 10 <= b[0] < xr], key=lambda b: (round(b[1] / 6), b[0]))
            txt = " ".join(b[4] for b in reg)
            dm = re.search(r"D.MENS.{1,2}N\s*:?\s*(\d{3,4})\s*[XxХ×*]\s*(\d{3,4})\s*[XxХ×*]\s*(\d{3,4})", txt, re.I)
            bat = re.search(r"BATTERY\s*CAPACITY\s*:?\s*([\w/\-\. ]+?)\s*(?:MOTOR|TYRE|MAXIMUM|RANGE|BRAKE|CONTROLLER|$)", txt, re.I)
            mot = re.search(r"MOTOR\s*:?\s*([\d\-]+)\s*W", txt, re.I)
            tyr = re.search(r"TYRE\s*:?\s*([\w\.\-;/\* ,]+?)\s*(?:MAXIMUM|RANGE|BATTERY|DIMENS|CONTROLLER|BRAKE|$)", txt, re.I)
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
            brk = re.search(r"BRAKE\s*:?\s*([A-Z ,]+?)\s*(?:CONTROLLER|TYRE|MOTOR|BATTERY|MAXIMUM|RANGE|DIMENS|PARAMETER|$)", txt, re.I)
            if brk:
                b_ = brk.group(1).upper(); b_ru = None
                if re.search(r"FRONT\s*DISC.*REAR\s*DRUM", b_): b_ru, p["brakes"] = "передний дисковый, задний барабанный", "Дисковые"
                elif "DISC" in b_ and "DRUM" not in b_: b_ru, p["brakes"] = "дисковые", "Дисковые"
                elif "DRUM" in b_: b_ru, p["brakes"] = "барабанные", "Барабанные"
                if b_ru: p["extra"].append(["Тормоза", b_ru])
            ctl = re.search(r"CONTROLLER\s*:?\s*(\d+)?\s*TUBE", txt, re.I)
            if ctl: p["extra"].append(["Контроллер", (ctl.group(1) + "-ламповый") if ctl.group(1) else "ламповый"])
            if spd: p["top_speed"] = int(spd.group(1)); p["extra"].append(["Макс. скорость", f"{spd.group(1)} км/ч"])
            if rng:
                p["range_km"] = int(rng.group(2) or rng.group(1)); p["extra"].append(["Запас хода", f"{rng.group(1)}" + (f"–{rng.group(2)}" if rng.group(2) else "") + " км"])
            if code in THREE: p["cat"] = "car"; p["name"] = f"Электротрицикл JULONG {code}"
            elif p.get("power_kw", 0) >= 3: p["cat"] = "ebike-sport"
            cand = [i for i in imgs if cx - 30 <= (i["bbox"][0] + i["bbox"][2]) / 2 < cx + 290 and h[1] - 245 <= i["bbox"][3] <= h[1] + 12]
            # фото под таблицей-плашкой (плашка лежит прямо на фото) или над ней; модель может лежать отдельным слоем поверх фона,
            # поэтому берём не «сырую» картинку, а отрисованную область страницы без текста
            under = [i for i in imgs if i["bbox"][0] <= h[0] + 5 <= i["bbox"][2] and i["bbox"][1] <= h[1] + 3 <= i["bbox"][3] and i["bbox"][2] - i["bbox"][0] > 250 and i["bbox"][3] - i["bbox"][1] > 100]
            best = max(under, key=lambda i: (i["bbox"][2] - i["bbox"][0]) * (i["bbox"][3] - i["bbox"][1])) if under else (max(cand, key=lambda i: (i["bbox"][2] - i["bbox"][0]) * (i["bbox"][3] - i["bbox"][1])) if cand else None)
            if not best:
                # фото стоит сбоку от плашки: ближайшая крупная картинка, а не плашка-полоска и не логотип
                hx, hy = (h[0] + h[2]) / 2, (h[1] + h[3]) / 2
                near = []
                for i in imgs:
                    w, hh = i["bbox"][2] - i["bbox"][0], i["bbox"][3] - i["bbox"][1]
                    if w * hh < 8000 or w > 3 * hh: continue
                    if any(g is not h and -12 <= g[1] - i["bbox"][3] <= 70 and i["bbox"][0] - 150 <= g[0] <= i["bbox"][2] + 150 for g in heads): continue  # фото чужой плашки
                    dist = ((hx - (i["bbox"][0] + i["bbox"][2]) / 2) ** 2 + (hy - (i["bbox"][1] + i["bbox"][3]) / 2) ** 2) ** 0.5
                    if dist < 330: near.append((dist - w * hh / 400, i))
                if near: best = min(near, key=lambda t: t[0])[1]; print("FALLBACK", code, round(hx), round(hy), [round(x) for x in best["bbox"]])
            if best:
                try:
                    img = save_image(render_clip(d, pn, best["bbox"]), f"julong/{slug(code)}-{pn+1}", min_side=60)
                    if img: p["images"].append(img)
                except Exception as e: print("img", code, e)
            out.append(p)
    json.dump(out, open(OUT + "/julong.json", "w"), ensure_ascii=False)
    print(len(out))
    for p in out: print(p["sku"], p["cat"], p.get("power_kw"), p.get("top_speed"), p.get("range_km"), p.get("battery_v"), len(p["extra"]), len(p["images"]))

main()
