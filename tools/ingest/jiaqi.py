"""ATV UTV Catalog - Yiwu Jiaqi 2026: страница = модель, строки «Параметр значение»."""
import io, re, json
import pymupdf
from PIL import Image
from common import *

FID, FNAME = "1Gj6eurpX9wRQ8FHCR92Fyzlb4Qhata3a", "ATV UTV Catalog - Yiwu Jiaqi 2026.pdf"
LABELS = ["Zongshen Engine", "Loncin Engine", "Engine", "Max Speed", "Drive Mode", "Transmission Mode", "Fuel Tank Capacity", "Brake type", "Max Load", "Net Weight", "Gross Weight",
          "Product Size (L×W×H)", "Packing Size (L×W×H)", "Tire Size", "Cargo box size", "Start method", "Track width", "Track Length"]

def sections(t):
    parts = [p for p in re.split(r"—\s*\d+\s*—", t) if "Model:" in p]
    return parts

def main():
    d = pymupdf.open(SRC + f"/{FID}.pdf"); out = []
    for pn, pg in enumerate(d):
        secs = sections(pg.get_text())
        ims = [i for i in pg.get_image_info(xrefs=True) if i["bbox"][2] - i["bbox"][0] > 150 and i["bbox"][3] - i["bbox"][1] > 100]
        ims.sort(key=lambda i: i["bbox"][0])
        for si, t in enumerate(secs):
            code = re.search(r"Model:\s*([A-Z0-9][\w\-]+)", t).group(1)
            lines = [l.strip() for l in t.split("\n") if l.strip()]
            head = lines[0] if not lines[0].startswith("Model") else ""
            pairs = []
            for i, l in enumerate(lines):
                if l in LABELS and i + 1 < len(lines) and lines[i + 1] not in LABELS and not lines[i + 1].startswith("Model:"):
                    v = lines[i + 1]
                    if v.upper() not in ("MM", "KGS"):
                        pairs.append(("Engine" if l.endswith("Engine") else l, v if l == "Engine" or not l.endswith("Engine") else v))
                        if l.endswith("Engine") and l != "Engine": pairs.append(("Марка двигателя", l.replace(" Engine", "")))
            cat = "snow" if "Snow" in head else "utv" if re.search(r"UTV|Farm", head) else "quad"
            word = {"snow": "Снегоход", "utv": "Багги/UTV" if "Farm" not in head else "Фермерский UTV", "quad": "Квадроцикл"}[cat]
            img = None
            if ims:
                best = ims[min(si, len(ims) - 1)] if len(secs) > 1 else max(ims, key=lambda i: (i["bbox"][2] - i["bbox"][0]) * (i["bbox"][3] - i["bbox"][1]))
                try:
                    pxi = px_image(d, best["xref"])
                    img = save_image(pxi, f"jiaqi/{slug(code)}")
                except Exception as e: print("img", code, e)
            p = {"id": "jq-" + slug(code), "cat": cat, "brand": "Yiwu Jiaqi", "name": f"{word} {code}", "sku": code, "images": [img] if img else [], "src": FNAME, "page": pn + 1}
            apply_specs(p, pairs)
            if head: p["extra"].insert(0, ["Класс", head.replace("CC+", " см³ и выше")])
            if cat == "snow":
                m2 = re.search(r"(\d+)\s*CC", " ".join(v for _, v in pairs), re.I)
                if m2: p["engine_cc"] = int(m2.group(1))
            out.append(p)
    json.dump(out, open(OUT + "/jiaqi.json", "w"), ensure_ascii=False)
    print(len(out))
    for p in out: print(p["sku"], p["cat"], p.get("engine_cc"), p.get("top_speed"), p.get("max_load_kg"), p.get("weight_kg"), p.get("drivetrain"), len(p["images"]))

main()
