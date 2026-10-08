"""Приведение таблицы характеристик к читаемому виду: русские подписи, разбор повторяющихся строк, «подпись: значение»,
перевод частых слов в значениях. Ничего не выдумывает: только переписывает то, что уже считано из каталога."""
import re

# (регулярка по подписи в нижнем регистре без пробелов-дублей, русская подпись)
LABELS = [
    (r"^curb ?weight", "Снаряжённая масса, кг"), (r"^riding modes?", "Режимы движения"), (r"^handlebar", "Руль"), (r"^swingarm", "Маятник"),
    (r"^main wiring", "Электропроводка"), (r"^bcm", "BCM (блок управления кузовом)"), (r"^abs/?cbs", "ABS / CBS"), (r"^rim type", "Диски"),
    (r"^display", "Дисплей"), (r"^frame type", "Тип рамы"), (r"^chassis structure", "Конструкция шасси"), (r"^roof structure", "Крыша"),
    (r"^0-?50 ?km/?h ?acceleration", "Разгон 0–50 км/ч, с"), (r"^passing acceleration", "Разгон на обгоне, с"), (r"^min turning", "Мин. радиус разворота, м"),
    (r"^passenger capacity", "Пассажировместимость"), (r"^seats$", "Количество мест"), (r"^max cargo weight|^payload capacity", "Грузоподъёмность, кг"),
    (r"^towing capacity", "Буксируемый груз, кг"), (r"^fuel type", "Тип топлива"), (r"^steering", "Рулевое управление"), (r"^approach angle", "Угол въезда, °"),
    (r"^winch capacity", "Лебёдка"), (r"^rearview mirrors?", "Зеркала заднего вида"), (r"^cargo racks?", "Багажные рейки"), (r"^bumper", "Бампер"), (r"^top case", "Верхний кофр"),
    (r"^ground ?clearance", "Дорожный просвет, мм"), (r"^rated power", "Номинальная мощность, Вт"), (r"^voltage", "Напряжение, В"), (r"^tires?$", "Шины"),
    (r"^type$", "Тип"), (r"^starter$|^start(ing)? ?mode$|^staring mode$", "Запуск"), (r"^front fork", "Передняя вилка"), (r"^bike size", "Размер байка"),
    (r"^chain$", "Цепь"), (r"^power$", "Мощность"), (r"^packaging size|^outer box size", "Размер упаковки"), (r"^packaging$|^packing$", "Упаковка"),
    (r"^braking system", "Тормозная система"), (r"^compression ratio", "Степень сжатия"), (r"^hub$", "Ступицы"), (r"^speed$", "Скорость"),
    (r"^number of containers", "Загрузка в контейнер"), (r"^40-?foot high container|^high-?cube container", "Загрузка в 40′ HC контейнер"),
    (r"^bore x stroke", "Диаметр × ход поршня"), (r"^exhaust( pipe)?$", "Выхлоп"), (r"^shell$", "Облицовка"), (r"^size$", "Размер"),
    (r"^clutch$", "Сцепление"), (r"^standard configuration", "Комплектация"), (r"^loose packaging", "Упаковка"), (r"^load$", "Нагрузка"),
    (r"^motoir$", "Мотор"), (r"^battery$", "Аккумулятор"), (r"^cbs$", "CBS (комбинированные тормоза)"), (r"^abs$", "ABS"),
    (r"^sound$", "Уровень шума"), (r"^endurance$", "Запас хода"), (r"^start$", "Запуск"), (r"^turn signal", "Указатели поворота"), (r"^rough weight", "Масса (ориентировочно)"),
    (r"^exhaust pipe", "Выхлопная труба"),
]

VALUES = [
    (r"\bdual hydraulic shock absorbers\b", "два гидравлических амортизатора"), (r"\bshock absorbers?\b", "амортизаторы"),
    (r"\baluminum alloy\b|\baluminium alloy\b", "алюминиевый сплав"), (r"\baluminum\b|\baluminium\b", "алюминий"), (r"\bhydraulic\b", "гидравлические"),
    (r"\bdisc brakes?\b|\bdisk brakes?\b", "дисковые"), (r"\bdrum brakes?\b", "барабанные"), (r"\bnone\b", "нет"), (r"\bpull start\b", "ручной стартёр (шнур)"),
    (r"\bdouble straight row\b", "двойная прямоточная"), (r"\bdual hydraulic shock absorbers\b", "два гидравлических амортизатора"),
    (r"\bdc system\b", "система постоянного тока"), (r"\bfull lighting support\b", "полное освещение"), (r"\bwaterproof ?connectors?\b", "водонепроницаемые разъёмы"),
    (r"\bmid-?drive motor\b", "центральный мотор (mid-drive)"), (r"\bternary lithium-?ion battery\b", "тройной литий-ионный (NCM)"), (r"\bswappable\b", "сменный"),
    (r"\bportable\b", "портативное"), (r"\bcommunication\b", "связь"), (r"\bcontroller\b", "контроллер"), (r"\blength\b", "длина"), (r"\btravel\b", "ход"),
    (r"\bplastic\b", "пластик"), (r"\bunits\b", "шт."), (r"\bdecibels?\b", "дБ"), (r"\bLess than\b", "менее"),
]


def _rv(v):
    s = str(v)
    s = re.sub(r"(?<=[a-z])(?=\d)|(?<=\d)(?=[a-z]{3,})", " ", s)  # «length765» → «length 765», «portable1.8kW» → «portable 1.8kW»
    for rx, ru in VALUES:
        s = re.sub(rx, ru, s, flags=re.I)
    s = re.sub(r"\b(\d+(?:\.\d+)?)\s*kw\b", lambda m: m.group(1).replace(".", ",") + " кВт", s, flags=re.I)
    s = re.sub(r"(\d)\s*units\b", r"\1 шт.", s)
    s = re.sub(r",(?=[^\s\d])", ", ", s)
    return re.sub(r"\s+", " ", s).strip()


def _rl(lab):
    l = re.sub(r"\s+", " ", str(lab).strip())
    ll = l.lower()
    for rx, ru in LABELS:
        if re.search(rx, ll):
            return ru
    return l


def polish(p):
    if p["cat"] in ("gear", "parts"):
        return p
    ex = []
    for lab, val in p.get("extra", []):
        lab = str(lab).strip(); val = str(val).strip()
        # «Подпись: значение» в одной ячейке
        m = re.match(r"^([A-Za-z][A-Za-z \-/&()]{2,40})\s*[:：]\s*(.+)$", lab)
        if m and (not val or val in ("-",)):
            lab, val = m.group(1), m.group(2)
        elif m:
            lab, val = m.group(1), (m.group(2) + " " + val).strip()
        ex.append([lab, val])
    # повторяющиеся подписи, которые OCR слил из двух строк таблицы NICOT
    out, cnt = [], {}
    for lab, val in ex:
        k = lab
        cnt[k] = cnt.get(k, 0) + 1
        out.append([lab, val, cnt[k]])
    res = []
    for lab, val, n in out:
        total = sum(1 for x in out if x[0] == lab)
        if total == 2:
            seq = {"Запас хода": ["Запас хода при 60 км/ч, км", "Запас хода по циклу WMTC, км"], "Аккумулятор": ["Аккумулятор", "Тип аккумулятора"],
                   "Зарядка": ["Зарядное устройство", "Время полной зарядки, ч"], "Тормоза (перед/зад)": ["Передний тормоз", "Задний тормоз"],
                   "Масса, кг": ["Масса, кг", "Снаряжённая масса, кг"]}.get(lab)
            if seq and re.search(r"[A-Za-z]|\d", val):
                lab = seq[n - 1]
        res.append([lab, val])
    ex = res
    # слитые «Маятник + передняя + задняя подвеска» (NICOT электро)
    fixed = []
    for lab, val in ex:
        m = re.match(r"^(aluminum|aluminium|алюмини\w*)?\s*(dual hydraulic shock absorbers.*?travel\s*\d+)\s*(dual hydraulic shock absorbers.*?travel\s*\d+)\s*$", val, re.I)
        if lab.lower().startswith("swingarm") and m:
            fixed += [["Маятник", "алюминий" if m.group(1) else val], ["Передняя подвеска, мм", _rv(m.group(2))], ["Задняя подвеска, мм", _rv(m.group(3))]]
        else:
            fixed.append([lab, val])
    ex = fixed
    out = []
    for lab, val in ex:
        l2 = _rl(lab)
        v2 = _rv(val) if re.search(r"[A-Za-z]", val) else val
        if l2 not in [x[0] for x in out] or v2 != next((x[1] for x in out if x[0] == l2), None):
            out.append([l2, v2])
    for r_ in out:  # NICOT: единицы обороты/мин в подписи есть, а в значении только число
        if r_[0].endswith("кВт/об/мин") and "/" not in r_[1]: r_[0] = r_[0].replace("/об/мин", "")
        if r_[0].endswith("Н·м/об/мин") and "/" not in r_[1]: r_[0] = r_[0].replace("/об/мин", "")
    if str(p.get("src", "")).startswith("Цена с завода") and p.get("desc"):
        for it in re.split(r";\s*", p["desc"]):  # Gelan: характеристики напечатаны списком особенностей
            it = it.strip(" .")
            if len(it) > 3 and not re.search(r"^\d+\s*cc$", it, re.I): out.append(["•", it])
    p["extra"] = out
    get = lambda rx: next((v for l, v in out if re.search(rx, l, re.I)), None)

    def num(s):
        m = re.search(r"\d+(?:[.,]\d+)?", str(s or ""))
        return float(m.group(0).replace(",", ".")) if m else None
    # числовые поля для фильтров из подготовленных строк
    r = num(get(r"^запас хода"))
    if r and "range_km" not in p: p["range_km"] = r
    bat = get(r"^аккумулятор$") or ""
    mv = re.search(r"(\d{2,3})\s*V\s*(\d{1,3})\s*Ah(?:\s*[×x]\s*(\d))?", bat, re.I)
    if mv:
        v, ah, k = int(mv.group(1)), int(mv.group(2)), int(mv.group(3) or 1)
        p.setdefault("battery_v", v); p.setdefault("battery_ah", ah); p.setdefault("battery_wh", v * ah * k)
    if re.search(r"сменн|swappable|removable|съ[её]мн", bat + " " + str(p.get("desc", "")), re.I):
        p.setdefault("removable_battery", True)
    if re.search(r"литий|lithium|ncm|nmc|lfp|li-?ion", bat + " " + (get(r"^тип аккумулятора") or ""), re.I):
        p.setdefault("battery_type", "Литиевый")
    ch = num(get(r"полной зарядки"))
    if ch and "charge_h" not in p: p["charge_h"] = ch
    return p
