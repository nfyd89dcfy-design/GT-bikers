/* Модели, добавленные вручную. Сюда можно дописывать карточки без запуска скриптов.
   Фото кладите в папку images/custom/ и указывайте путь, например "images/custom/my-bike-1.jpg".
   Обязательные поля: cat, brand, name. Остальное по желанию (см. README.md, раздел «Как добавить модель»).

   Пример карточки (копируйте внутрь квадратных скобок ниже, между карточками ставьте запятую):
   {
     cat: "quad",                       // ebike-sport | ebike-city | ebike-enduro | moto | quad | utv | golf | car | snow | gear | parts
     brand: "Название бренда",
     name: "Квадроцикл XYZ-300",
     sku: "XYZ-300",
     price: 4500, cur: "USD",           // цена и валюта (USD, RMB, RUB, EUR); без цены — не указывать
     powertrain: "Бензин",              // Бензин или Электро
     engine_cc: 300, power_kw: 17, top_speed: 80, weight_kg: 320, seats: 1, drivetrain: "4WD",
     images: ["images/custom/xyz-300-1.jpg", "images/custom/xyz-300-2.jpg"],
     extra: [["Тормоза", "дисковые"], ["Шины", "25x8-12"]],   // любые дополнительные строки характеристик
     desc: "Короткое описание"
   }
*/
window.CUSTOM_PRODUCTS = [
];
