"""Отдельные картинки и скриншоты на Диске (новые поставщики без PDF-каталога).
Характеристики перепечатаны вручную с картинок, фото вырезаны по долям кадра (x0, y0, x1, y1).
Телефоны и визитки поставщиков не публикуются."""
import json
from common import *

Image.MAX_IMAGE_PIXELS = None


def crop(fid, box, name):
    im = Image.open(SRC + "/../src/" + fid).convert("RGB")
    W, H = im.size
    c = im.crop((int(W * box[0]), int(H * box[1]), int(W * box[2]), int(H * box[3]))) if box else im
    return save_image(c, name, min_side=100)


ZZ_SPEC = [["Двигатель", "1395 см³, Turbo, 4 цилиндра, жидкостное охлаждение"], ["Макс. мощность", "110 кВт при 6600 об/мин (150 л.с.)"],
           ["Топливная система", "common rail высокого давления"], ["Трансмиссия", "CVT, 2WD/4WD с блокировкой дифференциала"],
           ["Подвеска", "независимая, двойные поперечные рычаги, ход амортизаторов 305 мм"], ["Тормоза", "вентилируемые перфорированные диски 260 мм, 2-поршневые суппорты"],
           ["Колёса", "диски 15×5J алюминий, шины 32×10R15 8PR"], ["Каркас", "хромомолибденовая сталь 4130"], ["Ремни безопасности", "4-точечные"]]


def zz(seats, fid, sku, name, dims, wb, wt, load, pid):
    return {"id": pid, "cat": "utv", "brand": "ZZSSV", "name": name, "sku": sku, "images": [x for x in [crop(fid, None, "loose/" + pid)] if x],
            "src": "Image_20261008115535.png (ZZSSV)", "powertrain": "Бензин", "engine_cc": 1395, "power_hp": 150, "power_kw": 110, "torque_nm": 250,
            "fuel_tank_l": 55, "top_speed": 136, "cooling": "Жидкостное", "drivetrain": "4WD", "transmission": "Вариатор (CVT)", "seats": seats,
            "brakes": "Дисковые", "length_mm": dims, "wheelbase_mm": wb, "ground_clearance_mm": 410, "weight_kg": wt, "max_load_kg": load,
            "extra": [["Габариты (Д×Ш×В)", "3370 × 1890 × 1740 мм"]] + ZZ_SPEC, "desc": "Цена в источнике не указана. Параметры считаны с изображения."}


def main():
    P = []
    # ZZSSV ZZ-1400
    P.append(zz(2, "1DdvHjMOkSvXEo0TpHRGGqGD69QobEUrT", "ZZ-1400", "Багги ZZSSV ZZ-1400 (2 места)", 3370, 2649, 820, 460, "zzssv-zz1400-2"))
    P.append(zz(4, "1LmNw6AsN6luTXRfctlCR6-1je4dwwa4l", "ZZ-1400 4S", "Багги ZZSSV ZZ-1400 (4 места)", 3370, 2649, 820, 460, "zzssv-zz1400-4"))
    P[-1]["desc"] = "Четырёхместная версия «逐战 UTV». Цена и точные габариты 4-местной версии в источнике не указаны, параметры двигателя те же, что у ZZ-1400."
    P[-1]["extra"][0] = ["Габариты (Д×Ш×В)", "2-местной версии: 3370 × 1890 × 1740 мм"]

    # VELIMOTOR (RONJE) HAVOCKER
    hv_img = crop("1LNFLzM5v76-XzPVGl5_KpQre6fFsC2Gt", (0.04, 0.09, 0.40, 0.62), "loose/havocker")
    common = {"cat": "ebike-enduro", "brand": "VELIMOTOR (RONJE)", "images": [hv_img] if hv_img else [], "src": "Image_20261008115710.jpg", "powertrain": "Электро",
              "battery_type": "Литиевый", "charge_h": 2, "length_mm": 2112, "seat_height_mm": 900, "ground_clearance_mm": 310, "wheelbase_mm": 1368, "max_load_kg": 150,
              "brakes": "Дисковые", "transmission": "Цепь", "desc": "Сертификация EEC/COC, DOT/EPA. Цена в источнике не указана. Параметры считаны с изображения."}
    P.append(dict(common, id="velimotor-havocker-trail", name="Электро-эндуро VELIMOTOR HAVOCKER (трейл)", sku="HAVOCKER trail", power_kw=8, peak_power_kw=24,
                  battery_v=74, battery_ah=58, battery_wh=4292, range_km=120, torque_nm=550, top_speed=100, weight_kg=92,
                  extra=[["Мотор", "плоская обмотка, номинал 8 кВт, пик 24 кВт"], ["Аккумулятор", "74 В 58 А·ч (NMC)"], ["Макс. ток батареи", "200 А"],
                         ["Зарядка", "2 ч (20–80%), зарядное 22 А"], ["Запас хода", "120 км при 50 км/ч"], ["Момент на колесе", "550 Н·м"],
                         ["Передача", "ремень + двухступенчатая цепь, передаточное 7,42"], ["Режимы", "эко / спорт / задний ход / Turbo"],
                         ["Колёса", "перед 1.4×19 или 1.4×21, зад 2.15×18"], ["Шины", "перед 90/90-19 или 90/90-21, зад 110/90-18"],
                         ["Вилка", "перевёрнутая регулируемая, ход 240 мм, трубы 46/50 мм"], ["Задний амортизатор", "центральный, ход 85 мм"], ["Масса", "92 кг с батареей"]]))
    P.append(dict(common, id="velimotor-havocker-mx", name="Электро-эндуро VELIMOTOR HAVOCKER MX", sku="HAVOCKER MX", power_kw=8, peak_power_kw=35,
                  battery_v=96, battery_ah=48, battery_wh=4608, range_km=130, torque_nm=700, top_speed=105, weight_kg=95,
                  extra=[["Мотор", "плоская обмотка, номинал 8 кВт, пик 35 кВт"], ["Аккумулятор", "96 В 48 А·ч (полутвердотельный)"], ["Макс. ток батареи", "250 А"],
                         ["Зарядка", "2 ч (20–80%), зарядное 22 А"], ["Запас хода", "130 км при 50 км/ч"], ["Момент на колесе", "700 Н·м"],
                         ["Передача", "ремень + двухступенчатая цепь, передаточное 7,42"], ["Колёса", "перед 1.4×21, зад 2.15×18"], ["Шины", "перед 90/90-21, зад 110/90-18"],
                         ["Вилка", "перевёрнутая регулируемая, ход 240 мм, трубы 49/53 мм"], ["Масса", "95 кг с батареей"]]))

    # JX001-003
    jx = [("JX001", 3500, (0.07, 0.04, 0.48, 0.22), "Disc brake", "Гидравл. двойная пружина", "FR 3.00-17, RR 100/90-17", 6.5, 456.7, "Дисковые", 3.46),
          ("JX002", 4500, (0.09, 0.355, 0.47, 0.53), "Drum brake", "Гидравл. двойная пружина", "FR 80/90-17, RR 100/80-17", 10, 200, "Барабанные", 3.462),
          ("JX003", 5000, (0.09, 0.665, 0.47, 0.835), "Disc brake", "Два задних амортизатора", "FR 3.00-17, RR 110/90-16", 10, 385, "Дисковые", 4.28)]
    for sku, kw, box, _, shock, tyres, peak, tq, brakes, ratio in jx:
        img = crop("1ywHUBoOy2ZpZmdFWQwmYPNmsl5euNI0R", box, "loose/" + sku.lower())
        P.append({"id": "jx-" + sku.lower(), "cat": "moto", "brand": "JX", "name": "Электромотоцикл JX " + sku[2:], "sku": sku, "images": [img] if img else [],
                  "src": "Image_20261007141631_15_4.jpg", "powertrain": "Электро", "power_kw": kw / 1000, "peak_power_kw": peak, "torque_nm": tq, "brakes": brakes,
                  "transmission": "Планетарный редуктор" if sku == "JX003" else "Цепь",
                  "extra": [["Номинальная мощность", "%d Вт" % kw], ["Пиковая мощность", "более %g кВт" % peak], ["Пиковый момент", "%g Н·м" % tq], ["Передаточное число", str(ratio)],
                            ["Задняя подвеска", shock], ["Шины", tyres], ["Класс защиты", "IP67"]],
                  "desc": "Цена, ёмкость батареи и скорость в источнике не указаны. Параметры считаны с изображения."})
    P[-3]["extra"].insert(0, ["Контроллер", "шина 150 А, фаза 450 А"]); P[-2]["extra"].insert(0, ["Контроллер", "шина 150 А, фаза 450 А"]); P[-1]["extra"].insert(0, ["Контроллер", "шина 100 А, фаза 450 А"])

    # TSPY
    img = crop("1V4CUH_Oz8k8JXAwcW7E19iWH4ChQ08kK", (0.08, 0.25, 0.83, 0.43), "loose/tspy")
    P.append({"id": "tspy-max", "cat": "car", "brand": "TSPY", "name": "Электро-кабриолет TSPY Max (экспорт)", "sku": "TSPY Max", "images": [img] if img else [], "src": "Image_20261007224538_42_4.jpg",
              "price": 26800, "cur": "RMB", "powertrain": "Электро", "power_kw": 4, "battery_v": 72, "battery_ah": 30, "battery_wh": 2160, "battery_type": "Литиевый", "range_km": 75,
              "top_speed": 65, "drivetrain": "4WD", "weight_kg": 162, "length_mm": 1920,
              "extra": [["Моторы", "4 × 1000 Вт"], ["Аккумулятор", "LFP 72 В 30 А·ч"], ["Запас хода", "70–80 км"], ["Режимы привода", "4WD / передний / задний"], ["Передачи", "4, скорость до 65 км/ч"],
                        ["Габариты", "1,92 × 1,08 × 0,8 м"], ["Особенности", "подъём днища (патент), 4 амортизатора, дрифт-колёса, Bluetooth"],
                        ["Масса", "около 162 кг (в англ. колонке 120 кг)"]],
              "desc": "Цена 26 800 RMB указана на изображении. Для экспорта послепродажная поддержка поставщиком не предоставляется."})

    # ESUVEHICLE ES01
    img = crop("1l7kQELgKTWBhUk1D6KRdZltXEsLTDrG3", (0.529, 0.0, 0.973, 0.354), "loose/es01")
    P.append({"id": "esuvehicle-es01", "cat": "ebike-city", "brand": "ESUVEHICLE", "name": "Электро-кемпинг байк ESUVEHICLE ES01", "sku": "ES01", "images": [img] if img else [], "src": "Image_20261008115646.jpg",
              "powertrain": "Электро", "power_kw": 0.75, "peak_power_kw": 1.5, "battery_v": 48, "battery_ah": 50, "battery_wh": 2400, "battery_type": "Литиевый", "charge_h": 4, "top_speed": 32,
              "weight_kg": 48, "max_load_kg": 180, "length_mm": 1800, "wheelbase_mm": 1220, "seat_height_mm": 830, "ground_clearance_mm": 270, "brakes": "Дисковые",
              "extra": [["Габариты", "1800 × 1100 × 740 мм"], ["Мотор", "редукторный в ступице, 750 Вт (пик 1500 Вт)"], ["Аккумулятор", "48 В 50 А·ч (2400 Вт·ч)"], ["Зарядка", "3–4 ч"],
                        ["Запас хода", "80–120 миль"], ["Шины", "20×4.0 antipunc, фэтбайк"], ["Тормоза", "диски 180 мм спереди и сзади"], ["Рама", "алюминиевый сплав"], ["Колёса", "спицованные"],
                        ["Фара", "LED"]],
              "desc": "Цена в источнике не указана. Параметры считаны с изображения (запас хода указан в милях)."})

    # FUERDI
    fu = [("RX6000", "1UqK2L9B7RlziIIYvf_al8_Bz8o7Xa1An", (0.066, 0.227, 0.92, 0.587), 7.5, 72, 45, 105, 120, 2050, 1300, 840, "F 120/70-17, R 110/90-17", "Mid-motor", "Электро-мотард FUERDI RX6000", "moto"),
          ("G120", "1mY5khlFhdJ_j9GB1XEEByOwTWBtxv4Hd", (0.05, 0.285, 0.90, 0.49), 5, 72, 54, 105, 100, 1960, 1300, 840, "19×1.4D", "Mid-motor", "Электро-эндуро FUERDI G120", "ebike-enduro"),
          ("G5000", "1mY5khlFhdJ_j9GB1XEEByOwTWBtxv4Hd", (0.38, 0.70, 0.97, 0.835), 5, 72, 45, 105, 100, 2085, 1300, 800, "F 90/90-19, R 110/90-17", "Mid-motor", "Электро-эндуро FUERDI G5000", "ebike-enduro")]
    for sku, fid, box, kw, v, ah, sp, rng, ln, wb, sh, tyre, mot, name, cat in fu:
        img = crop(fid, box, "loose/fuerdi-" + sku.lower())
        P.append({"id": "fuerdi-" + sku.lower(), "cat": cat, "brand": "FUERDI", "name": name, "sku": sku, "images": [img] if img else [], "src": "Image_20261007224505_40_4.jpg / 224511",
                  "powertrain": "Электро", "power_kw": kw, "battery_v": v, "battery_ah": ah, "battery_wh": v * ah, "battery_type": "Литиевый", "top_speed": sp, "range_km": rng,
                  "length_mm": ln, "wheelbase_mm": wb, "seat_height_mm": sh, "brakes": "Дисковые", "transmission": "Цепь",
                  "extra": [["Мотор", mot + ", номинал %g кВт" % kw], ["Аккумулятор", "%d В %d А·ч Li-ion" % (v, ah)], ["Шины", tyre], ["Подвеска", "гидравлическая"], ["Тормоза", "передний и задний диск"]],
                  "desc": "Производитель WuXi Shengda Vehicle Technology. Цена в источнике не указана. Параметры считаны со скриншота каталога (в источнике «7245Ah» прочитано как 72 В 45 А·ч)."})
    P[1]["extra"][1] = ["Аккумулятор", "72 В 54 А·ч Li-ion"]

    # M911 Pro
    img = crop("1VW_rYexis5hqYsfTRd55Mdl1jCaABaEb", (0.46, 0.224, 0.993, 0.696), "loose/m911")
    P.append({"id": "hewush-m911-pro", "cat": "moto", "brand": "HEWUSH", "name": "Электроскутер M911 Pro", "sku": "M911 Pro", "images": [img] if img else [], "src": "Screenshot 2026-10-08 at 10.46.45 AM.png",
              "powertrain": "Электро", "power_kw": 3, "battery_v": 72, "top_speed": 90, "brakes": "Дисковые",
              "extra": [["Мотор", "3000 Вт"], ["Аккумулятор", "Li 48/60/72 В"], ["Тормоза", "двойной диск (CBS)"], ["Шины", "110/70-12"], ["Приборы", "TFT (вариант LED — LED-панель)"],
                        ["Управление", "приложение + 4G, дистанционный запуск"], ["Контроллер", "18 каналов 80 А"], ["Подседельный отсек", "30 л"]],
              "desc": "Электроскутер для курьеров. Цена в источнике не указана. Параметры переведены с китайского скриншота."})

    # SG-MAX
    img = crop("1PLn26M4p9H2YQ9ixo079rSLa2RqikQCe", (0.28, 0.05, 0.86, 0.96), "loose/sgmax")
    P.append({"id": "sg-max", "cat": "moto", "brand": "SG", "name": "Электроскутер SG-MAX", "sku": "SG-MAX", "images": [img] if img else [], "src": "Screenshot 2026-10-08 at 10.58.35 AM.png",
              "powertrain": "Электро", "power_kw": 4, "battery_v": 72, "battery_ah": 60, "battery_wh": 4320, "battery_type": "Литиевый", "top_speed": 90, "range_km": 80,
              "extra": [["Мощность", "4000 Вт"], ["Аккумулятор", "72 В 60 А·ч литиевый"], ["Запас хода", "80–90 км"]], "desc": "Цена в источнике не указана. Параметры считаны со скриншота."})

    # F-серия (прайс в юанях)
    fs = [("F280c", "F280c стандарт", 12800, 6, 16, 300, 74, 80, 0.09, 0.29, 0.15, 0.51, "10 кВт·ч версия — F280c-MAX"),
          ("F280c-MAX", "F280c-MAX", 18800, 10, 16, 300, 74, 150, 0.09, 0.29, 0.15, 0.51, ""),
          ("F380c", "F380c", 23800, 10, 30, 450, 88, 122, 0.453, 0.29, 0.52, 0.51, ""),
          ("F180", "F180", 9800, 4.5, 8, 135, 74, 61, 0.693, 0.29, 0.755, 0.51, ""),
          ("F180-MAX", "F180-MAX", 13800, 9, 8, 135, 74, 122, 0.693, 0.29, 0.755, 0.51, "")]
    for sku, nm, price, kwh, peak, tq, v, ah, x0, y0, x1, y1, _ in fs:
        img = crop("1AZ_KKA1kDc97mwPetDYRsTlEknIt-x4t", (x0, y0, x1, y1), "loose/f-" + sku.lower())
        P.append({"id": "fseries-" + sku.lower(), "cat": "moto", "brand": "F-серия", "name": "Электроскутер " + nm, "sku": sku, "images": [img] if img else [], "src": "Image_20261008090326_66_4.jpg",
                  "price": price, "cur": "RMB", "powertrain": "Электро", "peak_power_kw": peak, "torque_nm": tq, "battery_v": v, "battery_ah": ah, "battery_wh": int(kwh * 1000),
                  "battery_type": "Литиевый", "brakes": "Дисковые",
                  "extra": [["Ёмкость батареи", "%g кВт·ч" % kwh], ["Аккумулятор", "%d В %d А·ч" % (v, ah)], ["Пиковая мощность", "%d кВт" % peak], ["Момент", "%d Н·м" % tq], ["Дисплей", "7″ TFT"]],
                  "desc": "Цена в юанях со скриншота прайса. Часть значений мелкого шрифта считана приблизительно, сверяйте с оригиналом."})
        P[-1]["ocr"] = True

    # Electripet
    img = crop("1j33pjATPZwSeI9YjdcpOzQfO6xLqUZTV", (0.574, 0.535, 0.698, 0.70), "loose/electripet-grasshopper")
    P.append({"id": "electripet-grasshopper", "cat": "ebike-enduro", "brand": "ELECTRIPET", "name": "Электро-эндуро ELECTRIPET Grasshopper", "sku": "Grasshopper", "images": [img] if img else [],
              "src": "Image_20261008115649.jpg", "powertrain": "Электро", "power_kw": 6, "peak_power_kw": 17, "torque_nm": 430, "battery_v": 72, "battery_ah": 60, "battery_wh": 4320,
              "battery_type": "Литиевый", "top_speed": 110, "range_km": 120, "charge_h": 3, "seat_height_mm": 890, "weight_kg": 86, "brakes": "Гидравлические", "transmission": "Цепь",
              "extra": [["Мотор", "PMSM (mid-drive) + контроллер FOC"], ["Номинал / пик", "6 / 17 кВт"], ["Аккумулятор", "72 В 60 А·ч Li-ion"], ["Запас хода", "120 км при 40 км/ч, 150 км при 25 км/ч"],
                        ["Разгон 0–50 км/ч", "2,3 с"], ["Зарядка", "3 ч (20–80%)"], ["Шины", "перед 80/100-19, зад 90/90-18"], ["Тормоза", "гидравлические диски 220/203 мм"],
                        ["Рама", "кованый алюминий"], ["Приборы", "3,9″ TFT IP66"], ["Ход вилки/амортизатора", "200 / 208 мм"]], "desc": "Цена в источнике не указана."})
    img = crop("1_9jNCUWqxG_e8KE_YV-p5dnFk8KldLwg", (0.53, 0.05, 0.97, 0.37), "loose/electripet-f1se")
    P.append({"id": "electripet-f1se", "cat": "car", "brand": "ELECTRIPET", "name": "Электро-карт ELECTRIPET F1-SE", "sku": "F1-SE", "images": [img] if img else [], "src": "Image_20261008115652.jpg",
              "powertrain": "Электро", "top_speed": 90, "range_km": 100, "charge_h": 2.5, "brakes": "Гидравлические", "transmission": "Цепь",
              "extra": [["Макс. скорость", "90 км/ч"], ["Разгон 0–50 км/ч", "2,5 с"], ["Запас хода", "75 км при 45 км/ч; 100 км при 25 км/ч"], ["Зарядка", "2,5 ч (20–80%)"], ["Рама", "42CrMo"],
                        ["Шины", "перед 10×4.50-5, зад 11×7.10-5"], ["Передача", "цепь 420, звезда 53T"]], "desc": "Гоночный электрокарт. Цена в источнике не указана."})
    P = [p for p in P if p["images"] or True]
    json.dump(P, open(OUT + "/loose_images.json", "w"), ensure_ascii=False)
    print(len(P), sum(1 for p in P if p["images"]))


main()
