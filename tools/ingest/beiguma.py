"""Product Manual.pdf (Beiguma, электромотоциклы): страница = модель; на странице только название и фото."""
import io, json, re
import pymupdf
from PIL import Image
from common import *
from ocr_cache import ocr_page

FID, FNAME = "15tIC8wVPC0wtprqAXk7MdreYgH9PDspl", "Product Manual (Beiguma).pdf"

def main():
    d = pymupdf.open(SRC + f"/{FID}.pdf"); out = []
    for pn in range(1, len(d)):
        boxes = ocr_page(d, FID, pn)
        names = [b[4].strip() for b in boxes if b[4].strip().lower() not in ("beiguma", "cbs") and b[0] < 200 and b[1] < 80]
        if not names: continue
        code = names[0].replace(" ", "")
        ims = [i for i in d[pn].get_image_info(xrefs=True) if i["bbox"][2] - i["bbox"][0] > 120 and i["bbox"][3] - i["bbox"][1] > 80]
        ims.sort(key=lambda i: -(i["bbox"][2] - i["bbox"][0]) * (i["bbox"][3] - i["bbox"][1]))
        paths = []
        for k, im in enumerate(ims[:4]):
            try:
                pxi = px_image(d, im["xref"])
                pth = save_image(pxi, f"beiguma/{slug(code)}-{k+1}")
                if pth and pth not in paths: paths.append(pth)
            except Exception as e: print("img", code, e)
        cat, word = ("snow", "Электросноубайк") if code == "XDC" else ("ebike-sport", "Электромотоцикл")
        out.append({"id": "beiguma-" + slug(code), "cat": cat, "brand": "Beiguma", "name": f"{word} Beiguma {code}", "sku": code, "images": paths, "src": FNAME, "page": pn + 1,
                    "desc": "В каталоге поставщика указаны только фото и название модели; технические данные и цену уточнять у поставщика."})
    json.dump(out, open(OUT + "/beiguma.json", "w"), ensure_ascii=False)
    print(len(out), [p["sku"] for p in out], [len(p["images"]) for p in out])

main()
