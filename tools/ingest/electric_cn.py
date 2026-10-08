"""Параметрические таблицы китайских электробайков: 011坦克, 坦克二代/小忍者/T9, 大蟒蛇/飓风/M5/Z6, V5.
Лист = модель. Колонки: A метка (кит.), B значение (кит.), C метка (англ.), D значение (англ.)."""
import io, re, json, warnings
warnings.filterwarnings("ignore")
import openpyxl
from PIL import Image
from common import *

FILES = [("14MNp_7TiMpMsPWz56iNxPDZTiT3Hk0pb", "011坦克参数配置表.xlsx"),
         ("1pGS2d1LZIw0xbYmyCPYCVMqIl0t12pd1", "坦克二代-小忍者警车-T9_参数表.xlsx"),
         ("1kDxgUTxIXZOtUrNH1K_T-xcIbI_4KerW", "大蟒蛇_飓风_M5-Z6 参数配置表.xlsx"),
         ("1i710aycwZFHvMXe87vYWW6rWwNFJ5Sjz", "V5.xlsx")]
NAMES = {"坦克": ("Tank", "Tank (TK)"), "坦克二代": ("Tank 2", "Tank 2 (TKED)"), "坦克4代": ("Tank 2", "Tank 2 (TKED)"),
         "剑齿虎2代": ("Smilodon 2", "Smilodon 2 (JCH 2D)"), "剑齿虎": ("Smilodon", "Smilodon (JCH)"),
         "小忍者警车": ("Little Ninja Police", "Little Ninja Police (XRZ)"), "大蟒蛇": ("Python", "Python (DMS)"), "飓风": ("Hurricane", "Hurricane (JF)")}
ZH = [("碟刹", "дисковый"), ("鼓刹", "барабанный"), ("液压前减", "гидравлическая передняя вилка"), ("加粗后减", "усиленный задний амортизатор"),
      ("铝合金轮", "алюминиевые диски"), ("铝合金", "алюминий"), ("高强钢管", "высокопрочная сталь"), ("液晶", "ЖК-дисплей"), ("前杠边杠", "передний бампер и боковые дуги"),
      ("冷发棉座垫", "сиденье из пенополиуретана"), ("座垫", "сиденье"), ("小时", " ч"), ("公里", " км"), ("公斤", " кг"), ("最大", "макс. "), ("码", " км/ч"),
      ("安驰电机", "мотор Anchi "), ("全顺电机", "мотор Quanshun "), ("全顺", "Quanshun "), ("安驰", "Anchi "), ("卓腾", "Zhuoteng "), ("蓝德", "Landai "), ("华顺", "Huashun "), ("远驱", "Yuanqu "),
      ("控制器", "контроллер"), ("管", ""), ("寸", '"'), ("台", " шт."), ("元", " ¥")]
LAB = {"Conrroller": "Контроллер", "Motor": "Мотор", "Frame": "Рама", "Battery": "Аккумулятор", "Charger": "Зарядное устройство", "Charge Time": "Время зарядки",
       "Speed": "Макс. скорость", "Range": "Запас хода", "Climbing angle": "Угол подъёма", "Load capacity": "Макс. нагрузка", "Front brake": "Передний тормоз",
       "Rear brake": "Задний тормоз", "Front shock": "Передняя подвеска", "Rear shock": "Задняя подвеска", "Front tire": "Передняя шина", "Rear tire": "Задняя шина",
       "Wheel": "Диски", "Set": "Сиденье", "Meter": "Приборная панель", "Back": "Обвес", "Vehicle size": "Габариты, см", "Package size": "Упаковка, см", "40HQ": "В 40HQ контейнер"}

def zh(s):
    s = str(s)
    for a, b in ZH: s = s.replace(a, b)
    return re.sub(r"\s+", " ", s).strip()

def main():
    out = []
    for fid, fname in FILES:
        wb = openpyxl.load_workbook(SRC + f"/{fid}.xlsx")
        for ws in wb.worksheets:
            hr = next((r for r in range(1, 40) if ws.cell(r, 1).value and ws.cell(r, 2).value), None)
            if hr is None: continue
            a1 = ws.title.strip() if ws.title.strip() in NAMES else str(ws.cell(hr, 1).value or "").strip()
            if re.sub(r"\s+", "", str(ws.cell(hr, 2).value or "")) != "参数": continue
            en, label = NAMES.get(a1, (a1, a1))
            code = str(ws.cell(hr, 3).value or "").strip()
            name = "Электробайк " + (label if a1 in NAMES else f"{a1} ({code})" if code and code != a1 else a1)
            pairs, price, raw, batt_opts, skd = [], None, {}, [], False
            for r in range(hr + 1, ws.max_row + 1):
                za, zb, ec, ed = [ws.cell(r, c).value for c in (1, 2, 3, 4)]
                if za and re.search(r"(整车|散件)价?格?\s*[:：]?\s*\d+", str(za)):
                    m = re.search(r"(\d+)\s*元", str(za))
                    if m and (price is None or "整车" in str(za)):
                        price = int(m.group(1)); skd = "散件" in str(za)
                    continue
                if za and re.search(r"电池.*\d+\s*元", str(za)):
                    m = re.search(r"(铅酸|锂)?电池[:：]?\s*([\dVvAaHh]+)[:：]?\s*(\d+)\s*元", str(za))
                    if m: batt_opts.append(f"{'литиевый' if m.group(1)=='锂' else 'свинцово-кислотный'} {m.group(2).upper()}: {m.group(3)} ¥")
                    continue
                if not za or not zb: continue
                e = str(ec or "").strip()
                val = str(ed).strip() if ed and re.search(r"\d", str(ed)) else zh(zb)
                pairs.append((LAB.get(e, zh(za)), val)); raw[e] = (str(zb), str(ed or ""))
            p = {"id": "ebike-" + slug(a1 + code), "cat": "ebike-city", "brand": "Китайский завод (Tank)", "name": name, "sku": code or a1, "price": price, "cur": "RMB", "priceNote": "завод, без налога, упаковки, АКБ и зарядки" + (" (в разборе)" if skd else ""), "src": fname, "extra": [[a, b] for a, b in pairs]}
            if batt_opts: p["extra"].append(["Аккумулятор (опция, цена)", "; ".join(batt_opts)])
            motor = " ".join(raw.get("Motor", ("", "")))
            m = re.search(r"(\d{3,5})\s*W", motor, re.I)
            if m: p["power_kw"] = int(m.group(1)) / 1000
            m = re.search(r"(\d{2})V(?:\s*(\d{2})V)?", motor)
            if m: p["battery_v"] = int(m.group(2) or m.group(1))
            sp = " ".join(raw.get("Speed", ("", "")))
            m = re.findall(r"\d+", sp)
            if m: p["top_speed"] = max(int(x) for x in m[:2])
            rg = " ".join(raw.get("Range", ("", "")))
            m = re.findall(r"\d+", rg)
            if m: p["range_km"] = max(int(x) for x in m[:2])
            m = re.search(r"(\d+)\s*(?:kg|公斤)", " ".join(raw.get("Load capacity", ("", ""))), re.I)
            if m: p["max_load_kg"] = int(m.group(1))
            if "碟刹" in " ".join(raw.get("Front brake", ("", ""))) + " ".join(raw.get("Rear brake", ("", ""))): p["brakes"] = "Дисковые"
            p["battery_type"] = None
            if p.get("power_kw", 0) >= 3: p["cat"] = "ebike-sport"
            # фото: крупнейшее изображение листа
            ims = []
            for im in ws._images:
                try:
                    pil = Image.open(io.BytesIO(im._data())); pil.load(); ims.append((pil.size[0] * pil.size[1], pil))
                except Exception: pass
            ims.sort(key=lambda x: -x[0])
            p["images"] = [x for x in [save_image(i[1], f"electric/{p['id']}-{k+1}") for k, i in enumerate(ims[:3])] if x]
            out.append(p)
    json.dump(out, open(OUT + "/electric_cn.json", "w"), ensure_ascii=False)
    for p in out: print(p["id"], p["cat"], p["name"], p.get("price"), p.get("power_kw"), p.get("top_speed"), p.get("range_km"), len(p["images"]))

main()
