"""Распознавание текста (RapidOCR) на страницах PDF без текстового слоя. Результат кэшируется в WORK/ocr/<id>-<стр>.json:
список [x0, y0, x1, y1, текст] в координатах страницы PDF (pt)."""
import json, os, sys
import numpy as np
import pymupdf
from PIL import Image
from common import SRC, WORK

OCRDIR = os.path.join(WORK, "ocr"); os.makedirs(OCRDIR, exist_ok=True)
_ocr = None

def get_ocr():
    global _ocr
    if _ocr is None:
        from rapidocr_onnxruntime import RapidOCR
        _ocr = RapidOCR()
    return _ocr

def ocr_page(doc, fid, pno, dpi=170):
    f = os.path.join(OCRDIR, f"{fid[:10]}-{pno+1}.json")
    if os.path.exists(f): return json.load(open(f))
    pg = doc[pno]
    pm = pg.get_pixmap(dpi=dpi)
    im = Image.frombytes("RGB", (pm.width, pm.height), pm.samples)
    res, _ = get_ocr()(np.array(im))
    k = 72.0 / dpi
    out = []
    for box, txt, conf in (res or []):
        xs = [p[0] for p in box]; ys = [p[1] for p in box]
        out.append([min(xs) * k, min(ys) * k, max(xs) * k, max(ys) * k, txt])
    json.dump(out, open(f, "w"), ensure_ascii=False)
    return out

if __name__ == "__main__":
    fid = sys.argv[1]; dpi = int(sys.argv[2]) if len(sys.argv) > 2 else 170
    doc = pymupdf.open(SRC + f"/{fid}.pdf")
    for i in range(len(doc)):
        ocr_page(doc, fid, i, dpi)
    print("done", fid, len(doc))
