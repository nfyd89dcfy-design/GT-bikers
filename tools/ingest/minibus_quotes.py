"""Прайс-листы Minibus Electric Vehicle (3 PDF): строка = модель, справа три цены в юанях
(базовая комплектация, комплект свинцовых АКБ, полная комплектация)."""
import io, re, json
import pymupdf
from PIL import Image
from common import *

FILES = [("1SVoG8QSfMVIiRAOYmOJmKQM8wIMGBGip", "小巴士家用类车型报价单外贸版.pdf", "car", "Электромобиль для дома"),
         ("1jbsEwMzbePNXMymqncUeT5P2Onl7dhr3", "小巴士景区卡通类产品报价单外贸版.pdf", "golf", "Экскурсионный электромобиль"),
         ("1YNbRj0kBKa9hqHVCRLhA14opHpvIi3o3", "小巴士场地工具车报价单外贸版.pdf", "utv", "Электромобиль для площадок")]

def clean(s): return re.sub(r"\s+", " ", s.replace("‑", "-")).strip()

def parse_pairs(lines):
    text = "\n".join(lines)
    parts = re.split(r"(?m)^\s*(?=\d{1,2}\s*[.．]\s*[A-Za-z])", text)
    pairs = []
    for part in parts:
        part = clean(part)
        m = re.match(r"\d{1,2}\s*[.．]\s*([A-Za-z][A-Za-z ]*?)\s*[:：]\s*(.*)$", part) or re.match(r"\d{1,2}\s*[.．]\s*(\d+\s*[‑-]?\s*seater|Seating|Colors?)\s*[:：]?\s*(.*)$", part, re.I)
        if m: pairs.append((m.group(1).strip(), m.group(2).strip()))
        else:
            m = re.match(r"\d{1,2}\s*[.．]\s*(.*)$", part)
            if m and re.search(r"seater", m.group(1), re.I): pairs.append(("Seating", m.group(1)))
    return pairs

def page_rows(pg):
    W = pg.get_text("words")
    nums = [w for w in W if w[0] > 400 and re.fullmatch(r"\d{3,6}", w[4])]
    rows = []
    for w in sorted(nums, key=lambda w: (w[1], w[0])):
        yc = (w[1] + w[3]) / 2
        for r in rows:
            if abs(r["y"] - yc) < 14: r["w"].append(w); break
        else: rows.append({"y": yc, "w": [w]})
    rows = [r for r in rows if len(r["w"]) >= 3]
    for r in rows:
        v = [int(w[4]) for w in sorted(r["w"], key=lambda w: w[0])][:3]
        r["prices"] = v; r["y"] = sum((w[1] + w[3]) / 2 for w in r["w"]) / len(r["w"])
    rows.sort(key=lambda r: r["y"])
    return W, rows

def main():
    out = []
    for fid, fname, cat, word in FILES:
        d = pymupdf.open(SRC + f"/{fid}.pdf")
        for pn, pg in enumerate(d):
            W, rows = page_rows(pg)
            ims = [i for i in pg.get_image_info(xrefs=True) if i["bbox"][2] - i["bbox"][0] > 50 and i["bbox"][3] - i["bbox"][1] > 35]
            for k, r in enumerate(rows):
                lo = (rows[k - 1]["y"] + r["y"]) / 2 if k else 0
                hi = (r["y"] + rows[k + 1]["y"]) / 2 if k + 1 < len(rows) else pg.rect.height
                # строки спецификации
                ws = [w for w in W if lo <= (w[1] + w[3]) / 2 < hi and 150 <= w[0] < 440]
                lines = {}
                for w in ws: lines.setdefault((w[5], w[6]), []).append(w)
                text = [" ".join(x[4] for x in sorted(v, key=lambda x: x[0])) for _, v in sorted(lines.items(), key=lambda kv: (min(x[1] for x in kv[1]), min(x[0] for x in kv[1])))]
                pairs = parse_pairs(text)
                left = [w for w in W if lo <= (w[1] + w[3]) / 2 < hi and w[0] < 150 and (w[2] < 160)]
                model = clean(" ".join(w[4] for w in sorted(left, key=lambda w: (round(w[1] / 4), w[0]))))
                model = re.sub(r"\b(Picture|Model|Name|No\.?|Vehicle)\b", "", model).strip() if not re.search(r"Yoyo", model) else clean(model)
                cand = [i for i in ims if lo <= (i["bbox"][1] + i["bbox"][3]) / 2 < hi]
                img = None
                if cand:
                    best = max(cand, key=lambda i: (i["bbox"][2] - i["bbox"][0]) * (i["bbox"][3] - i["bbox"][1]))
                    try:
                        px = pymupdf.Pixmap(d, best["xref"])
                        if px.n - px.alpha >= 4: px = pymupdf.Pixmap(pymupdf.csRGB, px)
                        pil = Image.open(io.BytesIO(px.tobytes("png")))
                        img = save_image(pil, f"minibus/{slug(fname[:2] + model)}-{pn+1}-{k+1}")
                    except Exception as e: print("img", e)
                model = re.sub(r"^(Model Name|Quotation\s*\.?)\s*", "", model).strip()
                if not model: continue
                base, batt, full = r["prices"]
                pid = "mb-" + slug(model) + "-" + fid[:3].lower()
                p = {"id": pid, "cat": cat, "brand": "Minibus", "name": f"{word} {model}", "sku": model, "price": full, "cur": "RMB", "priceNote": "полная комплектация, с АКБ", "images": [img] if img else [], "src": fname, "page": pn + 1}
                apply_specs(p, pairs)
                p["extra"] = [e for e in p["extra"] if e[0] not in ("Seating",)]
                p["extra"] += [["Цена базовой комплектации", f"{base} ¥"], ["Комплект свинцовых АКБ", f"{batt} ¥"]]
                txt = " ".join(v for _, v in pairs)
                m = re.search(r"(\d+)\s*[‑-]?\s*seater", txt, re.I) or re.search(r"(\d)[‑-]seater", " ".join(text), re.I)
                if m: p["seats"] = int(m.group(1))
                m = re.search(r"(\d{2})V\s*(\d{2,3})\s*AH", txt, re.I)
                if m: p["battery_v"] = int(m.group(1)); p["battery_ah"] = int(m.group(2)); p["battery_wh"] = int(m.group(1)) * int(m.group(2))
                if re.search(r"lead", txt, re.I): p["battery_type"] = "Свинцово-кислотный"
                m = re.search(r"(\d{3,5})\s*W", txt)
                if m: p["power_kw"] = int(m.group(1)) / 1000
                m = re.search(r"(\d+)mm\s*[*×x]\s*(\d+)mm\s*[*×x]\s*(\d+)\s*mm", txt)
                if m: p["extra"].append(["Габариты", f"{m.group(1)}×{m.group(2)}×{m.group(3)} мм"])
                if re.search(r"disc", txt, re.I): p["brakes"] = "Дисковые"
                elif re.search(r"drum", txt, re.I): p["brakes"] = "Барабанные"
                out.append(p)
    json.dump(out, open(OUT + "/minibus_quotes.json", "w"), ensure_ascii=False)
    print(len(out))
    for p in out[:60]: print(p["id"], p["name"], p["price"], p.get("seats"), p.get("power_kw"), p.get("battery_wh"), len(p["images"]), len(p["extra"]))

main()
