"""欧铂尔虬龙款M1.pdf (OPAI OUBOR M1): одна модель, параметры считаны OCR со страницы 10."""
import json
import pymupdf
from common import *

FID, FNAME = "1QsuLGQxkkNQ3Q8nEBhNbx2dF8CMHA617", "欧铂尔虬龙款M1.pdf"

def main():
    d = pymupdf.open(SRC + f"/{FID}.pdf")
    paths = []
    for n, xr in enumerate([56]):
        img = save_image(px_image(d, xr), f"opai/m1-{n+1}")
        if img: paths.append(img)
    p = {"id": "opai-m1", "cat": "ebike-enduro", "brand": "OPAI OUBOR", "name": "Электро-эндуро OPAI OUBOR M1", "sku": "M1", "images": paths, "src": FNAME, "page": 10,
         "power_kw": 16.8, "battery_v": 72, "battery_ah": 50, "battery_wh": 3600, "removable_battery": True, "battery_type": "Литиевый", "top_speed": 100, "charge_h": 8,
         "weight_kg": 72.2, "max_load_kg": 150, "brakes": "Гидравлические",
         "extra": [["Режим движения", "электро / педали"], ["Аккумулятор", "72 В 50 А·ч, съёмный"], ["Время зарядки", "5–8 ч"], ["Мотор", "задний высокооборотистый, номинал более 10 кВт, пик 16,8 кВт"],
                   ["Шины", "70/100-19, внедорожные"], ["Макс. скорость", "62 миль/ч (около 100 км/ч)"], ["Тормоза", "передний и задний, гидравлические дисковые"], ["Тормозной путь", "сухая дорога ≤ 4,5 м, мокрая ≤ 6 м"],
                   ["Подвеска", "передняя вилка, задняя воздушная"], ["Приборная панель", "ЖК: скорость, запас хода, мощность, коды ошибок"], ["Рама", "алюминиевый сплав"],
                   ["Масса", "более 72,2 кг"], ["Макс. нагрузка", "150 кг (безопасная до 120 кг)"], ["Упаковка", "166,5 × 31,5 × 78,5 см"]],
         "desc": "Цена в каталоге не указана."}
    json.dump([p], open(OUT + "/opai_m1.json", "w"), ensure_ascii=False)
    print(len(paths))

main()
