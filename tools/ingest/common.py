"""Общие функции разбора прайсов и каталогов поставщиков.

Каждый модуль-источник возвращает список словарей-товаров. Затем build.py
объединяет их, убирает повторы и пишет data/products.js.
Пути: SRC (скачанные файлы) и OUT (репозиторий) задаются переменными окружения.
"""
import hashlib
import io
import json
import os
import re

from PIL import Image

REPO = os.environ.get("GT_REPO", os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..")))
WORK = os.environ.get("GT_WORK", "/tmp/gt-work")
SRC = os.path.join(WORK, "by")          # файлы с понятными расширениями: <id>.pdf / .xlsx / .pptx
OUT = os.path.join(WORK, "out")         # промежуточные json по источникам
os.makedirs(OUT, exist_ok=True)

_HASHES = {}


def slug(s, n=40):
    s = re.sub(r"[^0-9A-Za-z]+", "-", s).strip("-").lower()
    return s[:n] or "x"


def dhash(im):
    g = im.convert("L").resize((9, 8), Image.LANCZOS)
    px = list(g.getdata())
    bits = 0
    for r in range(8):
        for c in range(8):
            bits = (bits << 1) | (px[r * 9 + c] > px[r * 9 + c + 1])
    return bits


def save_image(data, name, max_side=900, min_side=120, quality=80):
    """Сохраняет картинку в images/<name>.jpg (до 900 px). Возвращает относительный путь,
    либо None для слишком мелких. Одинаковые картинки не дублируются."""
    try:
        im = data if isinstance(data, Image.Image) else Image.open(io.BytesIO(data))
        im.load()
    except Exception:
        return None
    if min(im.size) < min_side:
        return None
    if im.mode in ("RGBA", "LA", "P"):
        im = im.convert("RGBA")
        bg = Image.new("RGB", im.size, (255, 255, 255))
        bg.paste(im, mask=im.split()[-1])
        im = bg
    else:
        im = im.convert("RGB")
    h = dhash(im)
    for oh, path in _HASHES.items():
        if bin(oh ^ h).count("1") <= 2 and abs(oh.bit_length() - h.bit_length()) < 64:
            return path
    k = min(1.0, max_side / max(im.size))
    if k < 1:
        im = im.resize((round(im.width * k), round(im.height * k)), Image.LANCZOS)
    rel = "images/%s.jpg" % name
    full = os.path.join(REPO, rel)
    os.makedirs(os.path.dirname(full), exist_ok=True)
    im.save(full, "JPEG", quality=quality, optimize=True, progressive=True)
    _HASHES[h] = rel
    return rel


def num(s):
    m = re.search(r"-?\d+(?:[.,]\d+)?", str(s).replace(" ", ""))
    return float(m.group(0).replace(",", ".")) if m else None


def first_num(rx, text, flags=re.I):
    m = re.search(rx, text, flags)
    return float(m.group(1).replace(",", ".")) if m else None


# ---------- перевод подписей характеристик ----------
LABELS = [
    (r"model number|^model$|модель", "Модель"),
    (r"type of engine|^engine|двигател|引擎|发动机", "Двигатель"),
    (r"total emission|displacement|объ[её]м|排量", "Объём"),
    (r"max\.? ?power|maximum power|мощност|功率", "Макс. мощность"),
    (r"torque|крутящ|扭矩", "Крутящий момент"),
    (r"sta?rt(ing|up)? ?(mode|method|system)|启动", "Запуск"),
    (r"driv(e|ing) ?mode|^drive$|привод", "Привод"),
    (r"transmission|gear position|gear$|коробк|变速", "Трансмиссия"),
    (r"fuel tank|tank capacity|oil tank|топливн|油箱", "Топливный бак"),
    (r"type of fuel|^fuel", "Топливо"),
    (r"ignition|зажиган|点火", "Зажигание"),
    (r"cooling|охлажд", "Охлаждение"),
    (r"max\.? ?speed|maximum speed|скорост|速度", "Макс. скорость"),
    (r"max\.? ?load|maximum load|load capacity|payload|нагрузк|载重", "Макс. нагрузка"),
    (r"net ?weight|dry ?weight|^weight|вес|масса|净重", "Масса"),
    (r"gross ?weight|毛重", "Масса брутто"),
    (r"brake|тормоз|刹车|碟刹", "Тормоза"),
    (r"suspension|shock|подвеск|амортиз|减震", "Подвеска"),
    (r"tire|tyre|wheel|шин|колес|колёс|轮", "Колёса и шины"),
    (r"ground clearance|клиренс", "Дорожный просвет"),
    (r"wheelbase|distance between|колёсная|колесная", "Колёсная база"),
    (r"tread|track$|колея", "Колея"),
    (r"seat ?height|высота сид", "Высота сиденья"),
    (r"dimension|outside|overall|vehicle size|product size|размер|габарит|尺寸", "Габариты"),
    (r"pack(ing|age)|carton|упаков|包装", "Упаковка"),
    (r"load(ing)? ?(qty|quantity)|40 ?h?q|20 ?ft|装柜", "Загрузка в контейнер"),
    (r"controller|контроллер|控制器", "Контроллер"),
    (r"motor|мотор|电机", "Мотор"),
    (r"battery|аккумулятор|батаре|电池", "Аккумулятор"),
    (r"charg|заряд|充电", "Зарядка"),
    (r"range|запас хода|续", "Запас хода"),
    (r"climb|подъ[её]м|爬坡", "Угол подъёма"),
    (r"frame|рама|车架", "Рама"),
    (r"meter|instrument|дисплей|приборн|仪表", "Приборная панель"),
    (r"seat|cushion|сиденье|坐垫", "Сиденье"),
    (r"light|свет|灯", "Освещение"),
    (r"color|colour|цвет|颜色", "Цвет"),
    (r"material|материал", "Материал"),
    (r"track width", "Ширина гусеницы"),
    (r"track length", "Длина гусеницы"),
    (r"cargo", "Грузовой отсек"),
    (r"rim|handle", "Диски и руль"),
]
UNIT_RU = [(r"\bkm/h\b|kmh|kilometers? per hour|kilometres per hour", "км/ч"), (r"\bkgs?\b|kilograms?", "кг"),
           (r"\bmm\b", "мм"), (r"\bpcs\b", "шт."), (r"\bliters?\b|\blitres?\b", "л")]


def ru_label(label):
    l = re.sub(r"^\s*\d+[.)]\s*", "", str(label)).strip().lower().replace("\xa0", " ")
    for rx, ru in LABELS:
        if re.search(rx, l):
            return ru
    return re.sub(r"^\s*\d+[.)]\s*", "", str(label)).strip().replace("\xa0", " ")


def ru_value(v):
    v = re.sub(r"\s+", " ", str(v).replace("\xa0", " ")).strip()
    for rx, ru in UNIT_RU:
        v = re.sub(rx, ru, v, flags=re.I)
    v = re.sub(r"\b4-?stroke\b|four-?stroke", "4-тактный", v, flags=re.I)
    v = re.sub(r"\b2-?stroke\b|two-?stroke", "2-тактный", v, flags=re.I)
    v = re.sub(r"air[- ]cool(ed|ing)", "воздушное охлаждение", v, flags=re.I)
    v = re.sub(r"(water|liquid)[- ]cool(ed|ing)", "жидкостное охлаждение", v, flags=re.I)
    v = re.sub(r"single[- ]cylinder", "одноцилиндровый", v, flags=re.I)
    v = re.sub(r"(dual|double|twin)[- ]cylinder|two[- ]cylinder", "двухцилиндровый", v, flags=re.I)
    v = re.sub(r"electric start", "электростартер", v, flags=re.I)
    v = re.sub(r"disc brake", "дисковые", v, flags=re.I)
    v = re.sub(r"drum brake", "барабанные", v, flags=re.I)
    v = re.sub(r"chain drive|chain driving", "цепной", v, flags=re.I)
    v = re.sub(r"shaft drive", "кардан", v, flags=re.I)
    return v


def apply_specs(p, pairs):
    """pairs: [(метка, значение)]. Заполняет нормализованные поля p и список p['extra']."""
    extra = p.setdefault("extra", [])
    seen = {(a, b) for a, b in extra}
    for lab, val in pairs:
        if val is None or str(val).strip() in ("", "-", "None"):
            continue
        L = str(lab).lower().replace("\xa0", " ")
        V = str(val).lower().replace("\xa0", " ")
        # --- нормализованные поля ---
        if re.search(r"engine|emission|displacement|двигател", L) or re.search(r"\d\s*cc\b", V):
            cc = first_num(r"(\d{2,4})\s*(?:cc|cm3|куб)", V)
            if cc and "engine_cc" not in p:
                p["engine_cc"] = cc
            if re.search(r"4-?stroke|four-?stroke|4t\b", V):
                p.setdefault("engine_stroke", "4T")
            if re.search(r"2-?stroke|two-?stroke|2t\b", V):
                p.setdefault("engine_stroke", "2T")
            if re.search(r"air[- ]cool", V):
                p.setdefault("cooling", "Воздушное")
            if re.search(r"water|liquid", V) and re.search(r"cool", V):
                p.setdefault("cooling", "Жидкостное")
        if re.search(r"max\.? ?power|maximum power|мощност|功率", L):
            kw = first_num(r"([\d.]+)\s*kw", V)
            hp = first_num(r"([\d.]+)\s*(?:hp|ps|л\.?с)", V)
            if kw and "power_kw" not in p:
                p["power_kw"] = kw
            if hp and "power_hp" not in p:
                p["power_hp"] = hp
        if re.search(r"max\.? ?speed|maximum speed|скорост|^speed", L):
            s = first_num(r"(\d+(?:\.\d+)?)", V)
            if s and "top_speed" not in p and s < 200:
                p["top_speed"] = s
        if re.search(r"fuel tank|tank capacity|oil tank|топливн", L):
            t = first_num(r"([\d.]+)\s*l", V)
            if t and "fuel_tank_l" not in p:
                p["fuel_tank_l"] = t
        if re.search(r"max\.? ?load|maximum load|load capacity|payload|нагрузк", L):
            t = first_num(r"(\d+(?:\.\d+)?)\s*(?:kg|кг|kilogram)", V)
            if t and "max_load_kg" not in p:
                p["max_load_kg"] = t
        if re.search(r"net ?weight|dry ?weight|^weight|вес\b|масса", L) and "gross" not in L:
            t = first_num(r"(\d+(?:\.\d+)?)\s*(?:kg|кг|kilogram)?", V)
            if t and "weight_kg" not in p:
                p["weight_kg"] = t
        if re.search(r"drive|привод", L) or re.search(r"4wd|2wd|4x4", V):
            if re.search(r"4wd|4x4|four.wheel|полный", V):
                p.setdefault("drivetrain", "4WD")
            elif re.search(r"2wd|4x2|two.wheel|rear.wheel|задн", V):
                p.setdefault("drivetrain", "2WD")
        if re.search(r"transmission|drive", L):
            if re.search(r"shaft|кардан", V):
                p.setdefault("transmission", "Кардан")
            elif re.search(r"chain|цеп", V):
                p.setdefault("transmission", "Цепь")
            elif re.search(r"cvt|automatic|автомат|вариатор", V):
                p.setdefault("transmission", "Вариатор (CVT)")
        if re.search(r"brake|тормоз", L):
            if re.search(r"disc|disk|диск", V):
                p.setdefault("brakes", "Дисковые")
            elif re.search(r"drum|барабан", V):
                p.setdefault("brakes", "Барабанные")
            if re.search(r"hydraulic|гидравл", V):
                p["brakes"] = "Гидравлические"
        # --- подпись и значение для таблицы ---
        row = (ru_label(lab), ru_value(val))
        if row not in seen and len(row[1]) < 220:
            extra.append(list(row))
            seen.add(row)
    return p


# ---------- картинки WPS (формула =DISPIMG("ID_...")) ----------
def cell_images(path):
    """Возвращает {ID: байты картинки} для файлов WPS с вставкой картинок в ячейки."""
    import zipfile
    z = zipfile.ZipFile(path)
    names = z.namelist()
    if "xl/cellimages.xml" not in names:
        return {}
    xml = z.read("xl/cellimages.xml").decode("utf8", "ignore")
    relp = [n for n in names if n.endswith("cellimages.xml.rels")]
    if not relp:
        return {}
    rels = z.read(relp[0]).decode("utf8", "ignore")
    rid2t = dict((m.group(2), m.group(1)) for m in re.finditer(r'Target="([^"]+)"[^>]*Id="([^"]+)"', rels))
    rid2t.update(dict((m.group(1), m.group(2)) for m in re.finditer(r'Id="([^"]+)"[^>]*Target="([^"]+)"', rels)))
    out = {}
    for m in re.finditer(r'<xdr:cNvPr[^>]*name="(ID_[^"]+)"[^>]*/?>.*?r:embed="([^"]+)"', xml, re.S):
        t = rid2t.get(m.group(2))
        if not t:
            continue
        t = t.lstrip("/")
        if not t.startswith("xl/"):
            t = "xl/" + t
        if t in names:
            out[m.group(1)] = z.read(t)
    return out
