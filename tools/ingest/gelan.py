"""Gelan Machinery (Grizzly Legend): «Цена с завода в Китае в юанях без налогов и доставки.pdf». Страница = модель, варианты с ценами EXW в юанях.
Названия моделей напечатаны на картинках страниц, поэтому заданы вручную по просмотру страниц."""
import io, re, json
import pymupdf
from PIL import Image
from common import *

FID, FNAME = "1YHm88DdE8cd3k3GpTtz6z-bV1S-NaKBG", "Цена с завода в Китае в юанях без налогов и доставки.pdf"
MODELS = {2: ("GO-212", "utv", "Картинг/багги"), 3: ("GL-150", "utv", "Багги"), 4: ("GL-200", "utv", "Багги"), 5: ("GL-300", "utv", "Багги"),
          6: ("AT-125", "quad", "Квадроцикл"), 7: ("AT-200", "quad", "Квадроцикл"), 8: ("AQ-350", "quad", "Квадроцикл")}

def main():
    d = pymupdf.open(SRC + f"/{FID}.pdf"); out = []
    for pn, (code, cat, word) in MODELS.items():
        pg = d[pn - 1]; t = pg.get_text()
        lines = [l.strip() for l in t.split("\n") if l.strip()]
        variants, opts, bullets, sect = [], [], [], ""
        i = 0
        while i < len(lines):
            l = lines[i]
            if l.startswith("Цены EXW"): sect = "price"
            elif l.startswith("Дополнительные опции"): sect = "opt"
            elif l.startswith("Основные характеристики"): sect = "main"
            elif l.startswith("►") or l.startswith("➤"):
                txt = l.lstrip("►➤ ").strip()
                nxt = lines[i + 1] if i + 1 < len(lines) else ""
                mp = re.match(r"[￥¥]\s*([\d,]+|\?)", nxt)
                if mp and sect in ("price", "opt", ""):
                    val = None if mp.group(1) == "?" else int(mp.group(1).replace(",", ""))
                    (variants if re.search(r"cc|Electric|куб", txt, re.I) and sect != "opt" else opts).append((txt, val)); i += 1
                else: bullets.append(txt)
            i += 1
        ims = [x for x in pg.get_image_info(xrefs=True) if x["bbox"][2] - x["bbox"][0] > 150 and x["bbox"][3] - x["bbox"][1] > 150 and x["bbox"][2] - x["bbox"][0] < 600]
        ims.sort(key=lambda x: (-(x["bbox"][2] - x["bbox"][0]) * (x["bbox"][3] - x["bbox"][1])))
        paths = []
        for k, im in enumerate(ims[:3]):
            try:
                pxi = px_image(d, im["xref"])
                pth = save_image(pxi, f"gelan/{slug(code)}-{k+1}")
                if pth and pth not in paths: paths.append(pth)
            except Exception as e: print("img", code, e)
        for vt, price in variants:
            m = re.search(r"(\d{2,3})\s*cc", vt, re.I)
            p = {"id": f"gelan-{slug(code)}-{slug(vt)}", "cat": cat, "brand": "Gelan (Grizzly Legend)", "name": f"{word} {code} · {vt}", "sku": f"{code} {vt}", "price": price, "cur": "RMB",
                 "priceNote": "EXW завод, без доставки", "images": paths, "src": FNAME, "page": pn, "extra": []}
            if m: p["engine_cc"] = int(m.group(1))
            if "Electric" in vt:
                p["cat"] = cat; mm = re.search(r"(\d{3,5})\s*W", vt)
                if mm: p["power_kw"] = int(mm.group(1)) / 1000
            if re.search(r"жидкост", vt, re.I): p["cooling"] = "Жидкостное"
            if bullets: p["desc"] = "; ".join(bullets)[:600]
            if opts: p["extra"].append(["Опции (доплата)", "; ".join(f"{a}: {b} ¥" if b else a for a, b in opts)])
            if re.search(r"4x4|AWD", t, re.I) and code.startswith("AQ"): p["drivetrain"] = "4WD"
            p["extra"].append(["Модель", code])
            out.append(p)
    json.dump(out, open(OUT + "/gelan.json", "w"), ensure_ascii=False)
    print(len(out))
    for p in out: print(p["sku"], p["price"], p.get("engine_cc"), len(p["images"]))

main()
