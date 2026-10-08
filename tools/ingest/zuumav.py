"""ZUUMAV catalogue 2026: питбайки и кроссовые мотоциклы, по две модели на страницу."""
import io, re, json
import pymupdf
from PIL import Image
from common import *

FID, FNAME = "17R5UzsKqb2B0VjjXExtfrtWFH8yMTFYk", "ZUUMAV-CATALOGUE-2026.pdf"

def col_lines(W, x_lo, x_hi):
    ws = [w for w in W if x_lo <= (w[0] + w[2]) / 2 < x_hi]
    lines = {}
    for w in ws: lines.setdefault((w[5], w[6]), []).append(w)
    out = []
    for _, v in lines.items():
        v.sort(key=lambda w: w[0]); out.append((min(w[1] for w in v), " ".join(w[4] for w in v)))
    out.sort()
    return [t for _, t in out]

def main():
    d = pymupdf.open(SRC + f"/{FID}.pdf"); out = []
    for pn, pg in enumerate(d):
        W = pg.get_text("words")
        if len(W) < 40: continue
        mid = pg.rect.width / 2
        ims = [i for i in pg.get_image_info(xrefs=True) if (i["bbox"][2] - i["bbox"][0]) > 120 and (i["bbox"][3] - i["bbox"][1]) > 90]
        for ci, (lo, hi) in enumerate([(0, mid), (mid, pg.rect.width)]):
            lines = col_lines(W, lo, hi)
            ti = next((i for i, l in enumerate(lines) if re.match(r"^[A-Z][A-Z0-9]*-[A-Z0-9][\w\-/ ]*$", l) and l not in ("ENGINE", "CHASSIS") and any(re.search(r"cc|stroke|electric|kw", x, re.I) for x in lines[i + 1:i + 3])), None)
            if ti is None: continue
            title = lines[ti]
            code = title.strip()
            rest = " ".join(x for x in lines[ti + 1:ti + 4] if x not in ("ENGINE", "CHASSIS") and not x.endswith(":") and ":" not in x)
            if re.search(r"BIKE|COMP|SIZE|ENDURO", code):
                parts = rest.split(); code, rest = parts[0], " ".join(parts[1:])
            pairs, sect = [], ""
            for l in lines:
                if l in ("ENGINE", "CHASSIS", "DIMENSIONS"): sect = l; continue
                mm = re.match(r"^([A-Za-z][A-Za-z ,/&.\-]{1,30}):\s*(.+)$", l)
                if mm: pairs.append((mm.group(1).strip(), mm.group(2).strip()))
            if len(pairs) < 3: continue
            kind = next((l for l in lines[:ti] if re.search(r"BIKE|MOTORCYCLE|PITBIKE|ENDURO|MOTO", l)), "")
            cand = [i for i in ims if lo <= (i["bbox"][0] + i["bbox"][2]) / 2 < hi]
            img = None
            if cand:
                best = max(cand, key=lambda i: (i["bbox"][2] - i["bbox"][0]) * (i["bbox"][3] - i["bbox"][1]))
                try:
                    pxi = px_image(d, best["xref"])
                    img = save_image(pxi, f"zuumav/{slug(code)}")
                except Exception as e: print("img", code, e)
            p = {"id": "zuumav-" + slug(code), "cat": "moto", "brand": "ZUUMAV", "name": f"Мотоцикл {code}", "sku": code, "images": [img] if img else [], "src": FNAME, "page": pn + 1}
            if re.search(r"electric", rest, re.I) and not re.search(r"cc", rest, re.I): p["cat"] = "ebike-enduro"; p["name"] = f"Электробайк {code}"
            apply_specs(p, [("Engine", rest)] + [(a, b) for a, b in pairs])
            if kind: p["extra"].insert(0, ["Класс", kind.title()])
            for a, b in pairs:
                if re.match(r"Max Power", a):
                    mm = re.match(r"([\d.]+)", b)
                    if mm and "power_kw" not in p: p["power_kw"] = float(mm.group(1))
                if re.match(r"Seat Height", a):
                    pass
            if p.get("power_kw", 0) > 100:
                p.pop("power_kw")
                for a, b in pairs:
                    if re.match(r"Max Power", a):
                        mm = re.match(r"\s*([\d.]+)", b)
                        if mm and float(mm.group(1)) < 100: p["power_kw"] = float(mm.group(1))
            out.append(p)
    json.dump(out, open(OUT + "/zuumav.json", "w"), ensure_ascii=False)
    print(len(out))
    for p in out: print(p["sku"], p["cat"], p.get("engine_cc"), p.get("power_kw"), p.get("engine_stroke"), len(p["images"]), p["extra"][:2])

main()
