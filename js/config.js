/* Настройки каталога: категории, поля, контакты компании.
   Поля из FIELDS автоматически превращаются в фильтры, строки таблицы характеристик,
   выжимку для КП и параметры AI-поиска. Чтобы добавить параметр, достаточно дописать его сюда
   и указать значение в data/products.js. */
window.CFG = {
  company: {
    name: 'GT Bikers',
    phone: '',
    email: '',
    address: '',
    note: 'Внутренний каталог для сотрудников. Цены указаны так, как в исходных прайсах поставщиков.'
  },

  categories: [
    { id: 'ebike-sport',  name: 'Электробайки спортивные', short: 'Спортивные' },
    { id: 'ebike-city',   name: 'Электробайки городские',  short: 'Городские' },
    { id: 'ebike-enduro', name: 'Электробайки эндуро',     short: 'Эндуро' },
    { id: 'moto',         name: 'Мотоциклы',               short: 'Мото' },
    { id: 'quad',         name: 'Квадроциклы',             short: 'Квадро' },
    { id: 'utv',          name: 'Багги и UTV',             short: 'Багги' },
    { id: 'golf',         name: 'Гольфкары и экскурсионные', short: 'Гольфкары' },
    { id: 'car',          name: 'Мини-машины',             short: 'Машины' },
    { id: 'snow',         name: 'Снежная техника',         short: 'Снег' },
    { id: 'gear',         name: 'Экипировка',              short: 'Экипировка' },
    { id: 'parts',        name: 'Запчасти и аксессуары',   short: 'Запчасти' }
  ],

  groups: ['Основное', 'Двигатель', 'Батарея', 'Ходовая', 'Габариты', 'Экипировка'],

  /* type: number | enum | multi | bool
     cats: список категорий, где параметр применим (пусто = везде)
     kw: слова для AI-поиска (корни слов, строчные) */
  fields: (function () {
    var E = ['ebike-sport', 'ebike-city', 'ebike-enduro'];
    var EL = E.concat(['golf', 'car']);
    var ICE = ['moto', 'quad', 'utv', 'snow'];
    var VEH = E.concat(['moto', 'quad', 'utv', 'golf', 'car', 'snow']);
    return [
      { key: 'brand', label: 'Бренд / поставщик', type: 'enum', group: 'Основное' },
      { key: 'cur', label: 'Валюта цены', type: 'enum', group: 'Основное' },
      { key: 'price', label: 'Цена', type: 'number', group: 'Основное', kw: ['цен', 'стоимост', 'бюджет', 'дешев', 'дорож'] },

      { key: 'power_kw', label: 'Мощность', unit: 'кВт', type: 'number', cats: VEH, group: 'Двигатель', kw: ['мощност', 'квт', 'kw'] },
      { key: 'power_hp', label: 'Мощность', unit: 'л.с.', type: 'number', cats: ICE, group: 'Двигатель', kw: ['л.с', 'лс', 'hp', 'лошад'] },
      { key: 'engine_cc', label: 'Объём двигателя', unit: 'см³', type: 'number', cats: ICE, group: 'Двигатель', kw: ['объем', 'объём', 'кубов', 'куб', 'см3', 'cc'] },
      { key: 'engine_stroke', label: 'Тактность', type: 'enum', cats: ICE, group: 'Двигатель', alias: { '2T': ['2т', '2-так', 'двухтакт'], '4T': ['4т', '4-так', 'четырехтакт', 'четырёхтакт'] } },
      { key: 'cooling', label: 'Охлаждение', type: 'enum', cats: ICE, group: 'Двигатель', alias: { 'Воздушное': ['воздушн'], 'Жидкостное': ['жидкост', 'водян'] } },
      { key: 'peak_power_kw', label: 'Пиковая мощность', unit: 'кВт', type: 'number', cats: VEH, group: 'Двигатель', kw: ['пиков'] },
      { key: 'torque_nm', label: 'Крутящий момент', unit: 'Н·м', type: 'number', cats: VEH, group: 'Двигатель', kw: ['момент', 'крутящ'] },
      { key: 'fuel_tank_l', label: 'Топливный бак', unit: 'л', type: 'number', cats: ICE, group: 'Двигатель', kw: ['бак'] },

      { key: 'battery_v', label: 'Напряжение', unit: 'В', type: 'number', cats: EL, group: 'Батарея', kw: ['напряж', 'вольт'] },
      { key: 'battery_ah', label: 'Ёмкость', unit: 'А·ч', type: 'number', cats: EL, group: 'Батарея', kw: ['емкост', 'ёмкост', 'а·ч', 'ач', 'ah'] },
      { key: 'battery_wh', label: 'Энергия батареи', unit: 'Вт·ч', type: 'number', cats: EL, group: 'Батарея', kw: ['вт·ч', 'втч', 'wh', 'энерги'] },
      { key: 'removable_battery', label: 'Съёмный аккумулятор', type: 'bool', cats: EL, group: 'Батарея' },
      { key: 'battery_type', label: 'Тип аккумулятора', type: 'enum', cats: EL, group: 'Батарея', alias: { 'Литиевый': ['литий', 'li-ion', 'lithium'], 'Свинцово-кислотный': ['свинц', 'гелев', 'lead'] } },
      { key: 'range_km', label: 'Запас хода', unit: 'км', type: 'number', cats: EL, group: 'Батарея', kw: ['запас', 'дальност', 'пробег', 'ход'] },
      { key: 'charge_h', label: 'Время зарядки', unit: 'ч', type: 'number', cats: EL, group: 'Батарея', kw: ['заряд'] },

      { key: 'top_speed', label: 'Макс. скорость', unit: 'км/ч', type: 'number', cats: VEH, group: 'Ходовая', kw: ['скорост', 'быстр', 'км/ч'] },
      { key: 'drivetrain', label: 'Привод', type: 'enum', cats: ['quad', 'utv', 'golf', 'car', 'snow'], group: 'Ходовая', alias: { '4WD': ['4wd', '4x4', '4х4', 'полный привод', 'полным привод'], '2WD': ['2wd', '4x2', '4х2', 'задний привод', 'задним привод'] } },
      { key: 'transmission', label: 'Трансмиссия', type: 'enum', cats: ICE.concat(EL), group: 'Ходовая', alias: { 'Вариатор (CVT)': ['вариатор', 'cvt', 'автомат'], 'Механика': ['механик', 'мкпп'], 'Цепь': ['цеп'], 'Кардан': ['кардан'] } },
      { key: 'seats', label: 'Мест', type: 'number', cats: ['quad', 'utv', 'golf', 'car'], group: 'Ходовая', kw: ['мест', 'местн', 'пассажир'] },
      { key: 'brakes', label: 'Тормоза', type: 'enum', cats: VEH, group: 'Ходовая', alias: { 'Дисковые': ['диск'], 'Барабанные': ['барабан'], 'Гидравлические': ['гидравл'] } },

      { key: 'length_mm', label: 'Длина', unit: 'мм', type: 'number', cats: VEH, group: 'Габариты' },
      { key: 'wheelbase_mm', label: 'Колёсная база', unit: 'мм', type: 'number', cats: VEH, group: 'Габариты' },
      { key: 'seat_height_mm', label: 'Высота сиденья', unit: 'мм', type: 'number', cats: VEH, group: 'Габариты' },
      { key: 'ground_clearance_mm', label: 'Дорожный просвет', unit: 'мм', type: 'number', cats: VEH, group: 'Габариты' },
      { key: 'weight_kg', label: 'Масса', unit: 'кг', type: 'number', cats: VEH, group: 'Габариты', kw: ['вес', 'масса', 'легч', 'тяжел'] },
      { key: 'max_load_kg', label: 'Макс. нагрузка', unit: 'кг', type: 'number', cats: VEH, group: 'Габариты', kw: ['нагруз', 'грузоподъем', 'грузоподъём', 'выдерж'] },

      { key: 'gear_type', label: 'Тип экипировки', type: 'enum', cats: ['gear'], group: 'Экипировка', alias: { 'Шлемы': ['шлем'], 'Очки': ['очк', 'маск'], 'Перчатки': ['перчат'], 'Куртки и джерси': ['куртк', 'джерси', 'футболк'], 'Штаны и шорты': ['штан', 'шорт'], 'Обувь': ['ботин', 'обув'], 'Рюкзаки и гидропаки': ['рюкзак', 'гидропак'], 'Защита': ['защит', 'наколен', 'налокот', 'панцир'] } },
      { key: 'part_type', label: 'Тип товара', type: 'enum', cats: ['parts'], group: 'Основное' },
      { key: 'sizes', label: 'Размеры', type: 'multi', cats: ['gear'], group: 'Экипировка' }
    ];
  })()
};
