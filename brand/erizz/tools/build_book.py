import os,re
D=os.path.join(os.path.dirname(os.path.abspath(__file__)),"..","brandbook")
COL=[("Ink","Чернила","0e1013","Основной фон"),("Deep","Глубина","07080a","Подложки, футер"),("Kelp","Графит","1c2026","Карточки, панели"),
("Silver","Серебро","b9c2cc","Хром, текст на темном"),("Sleet","Дымка","d9dee3","Светлые поверхности"),("Frost","Иней","eef1f4","Светлый фон, текст"),
("Steel","Сталь","8d97a2","Второстепенный текст"),("Flare","Флэр","ff4a2b","Главный акцент"),("Burgundy","Бордо","5e1224","Глубина, вкрапления"),
("Sky","Небо","9cc9ff","Тонкие акценты"),("Cobalt","Кобальт","2a5bd7","Редкие акценты")]
def cmyk(h):
    r,g,b=[int(h[i:i+2],16)/255 for i in (0,2,4)];k=1-max(r,g,b)
    if k==1:return "0 0 0 100"
    return " ".join(str(round(v*100)) for v in ((1-r-k)/(1-k),(1-g-k)/(1-k),(1-b-k)/(1-k),k))
def rgb(h):return ", ".join(str(int(h[i:i+2],16)) for i in (0,2,4))
def L(n):return open(f"{D}/../logo/{n}.svg").read()
def img(n,h):return f'<img src="../logo/{n}.svg" style="height:{h}px">'
css="""
@font-face{font-family:U;font-weight:500;src:url(fonts/unbounded-latin-500-normal.woff2);unicode-range:U+0000-00FF,U+2000-206F}
@font-face{font-family:U;font-weight:500;src:url(fonts/unbounded-cyrillic-500-normal.woff2);unicode-range:U+0400-04FF}
@font-face{font-family:U;font-weight:800;src:url(fonts/unbounded-latin-800-normal.woff2);unicode-range:U+0000-00FF,U+2000-206F}
@font-face{font-family:U;font-weight:800;src:url(fonts/unbounded-cyrillic-800-normal.woff2);unicode-range:U+0400-04FF}
@font-face{font-family:O;font-weight:400;src:url(fonts/onest-latin-400-normal.woff2);unicode-range:U+0000-00FF,U+2000-206F}
@font-face{font-family:O;font-weight:400;src:url(fonts/onest-cyrillic-400-normal.woff2);unicode-range:U+0400-04FF}
@font-face{font-family:O;font-weight:600;src:url(fonts/onest-latin-600-normal.woff2);unicode-range:U+0000-00FF,U+2000-206F}
@font-face{font-family:O;font-weight:600;src:url(fonts/onest-cyrillic-600-normal.woff2);unicode-range:U+0400-04FF}
@font-face{font-family:M;font-weight:100 800;src:url(fonts/martian-mono-latin-wght-normal.woff2);unicode-range:U+0000-00FF,U+2000-206F}
@font-face{font-family:M;font-weight:100 800;src:url(fonts/martian-mono-cyrillic-wght-normal.woff2);unicode-range:U+0400-04FF}
@page{size:1920px 1080px;margin:0}
*{box-sizing:border-box;margin:0;padding:0}
:root{--ink:#0e1013;--deep:#07080a;--kelp:#1c2026;--silver:#b9c2cc;--sleet:#d9dee3;--frost:#eef1f4;--steel:#8d97a2;--mute:#5a626c;--flare:#ff4a2b;--bur:#5e1224;--sky:#9cc9ff;--cob:#2a5bd7}
body{font-family:O,sans-serif;background:#000;color:var(--frost);font-size:24px;line-height:1.5}
.p{width:1920px;height:1080px;position:relative;overflow:hidden;page-break-after:always;background:var(--ink);padding:150px 120px 110px;display:flex;flex-direction:column;justify-content:center}
.p.cv .hd{position:static}
.p.cv{padding:80px 120px}
.p.light{background:var(--frost);color:var(--ink)}
.p::before{content:"";position:absolute;inset:0;background-image:linear-gradient(rgba(185,194,204,.05) 1px,transparent 1px),linear-gradient(90deg,rgba(185,194,204,.05) 1px,transparent 1px);background-size:80px 80px;pointer-events:none}
.p.light::before{background-image:linear-gradient(rgba(14,16,19,.05) 1px,transparent 1px),linear-gradient(90deg,rgba(14,16,19,.05) 1px,transparent 1px)}
.p>*{position:relative}
.hd{position:absolute;top:80px;left:120px;right:120px;display:flex;justify-content:space-between;font-family:M;font-size:15px;letter-spacing:.16em;text-transform:uppercase;color:var(--steel)}
.hd b{color:var(--flare);font-weight:500}
h1{font-family:U;font-weight:500;font-size:112px;line-height:1;letter-spacing:-.02em;text-transform:uppercase}
h2{font-family:U;font-weight:500;font-size:64px;line-height:1.08;letter-spacing:-.01em;text-transform:uppercase;margin:44px 0 36px}
h3{font-family:U;font-weight:500;font-size:26px;text-transform:uppercase;margin-bottom:12px;letter-spacing:.01em}
.lead{font-size:30px;max-width:1100px;color:var(--silver)} .light .lead{color:var(--mute)}
.mono{font-family:M;font-size:15px;letter-spacing:.12em;text-transform:uppercase;color:var(--steel)}
.cols{display:grid;gap:40px;margin-top:0}
.c2{grid-template-columns:1fr 1fr}.c3{grid-template-columns:repeat(3,1fr)}.c4{grid-template-columns:repeat(4,1fr)}
.card{border:1px solid rgba(185,194,204,.22);padding:32px;border-radius:4px;background:rgba(28,32,38,.55)}
.light .card{border-color:rgba(14,16,19,.18);background:rgba(255,255,255,.6)}
.card p,.t{font-size:22px;color:var(--silver)} .light .card p,.light .t{color:var(--mute)}
.rule{height:1px;background:rgba(185,194,204,.3);margin:24px 0}.accent{color:var(--flare)}
.chrome{background:linear-gradient(100deg,#f4f7fa,#b9c2cc 35%,#6f7a86 52%,#e6eaee 75%,#8d97a2);-webkit-background-clip:text;color:transparent}
.sw{display:flex;flex-direction:column;border:1px solid rgba(185,194,204,.2);border-radius:4px;overflow:hidden}
.sw i{height:150px;display:block}.sw div{padding:14px 18px;font-family:M;font-size:14px;line-height:1.7;color:var(--silver);background:var(--kelp)}
.sw b{font-family:U;font-weight:500;font-size:20px;color:var(--frost);display:block;margin-bottom:4px;text-transform:uppercase}
.stage{display:flex;align-items:center;justify-content:center;border-radius:4px;border:1px solid rgba(185,194,204,.2)}
.no{position:relative}.no::after{content:"✕";position:absolute;top:10px;right:14px;color:var(--flare);font-size:26px}
.ok::after{content:"✓";position:absolute;top:10px;right:14px;color:var(--sky);font-size:26px}
.ph{position:absolute;right:120px;bottom:70px;font-family:M;font-size:14px;color:var(--steel)}
ul{list-style:none} li{padding:10px 0;border-top:1px solid rgba(185,194,204,.18);font-size:23px;color:var(--silver)} .light li{border-color:rgba(14,16,19,.15);color:var(--mute)}
li b{color:var(--frost);font-weight:600}.light li b{color:var(--ink)}
"""
pages=[];N=[0]
def page(label,body,cls=""):
    N[0]+=1
    pages.append(f'<section class="p {cls}"><div class="hd"><span><b>E-Rizz</b> / Брендбук</span><span>{label}</span></div>{body}<div class="ph">{N[0]:02d}</div></section>')
# 1 cover
N[0]+=1
pages.append(f'''<section class="p cv" style="justify-content:space-between"><div class="hd"><span>Брендбук / версия 1.0</span><span>Октябрь 2026</span></div>
<div style="display:flex;align-items:center;gap:80px">{img("mark-color",360)}<div><h1 style="color:var(--frost)">E-Rizz</h1><p class="lead" style="margin-top:28px">Электробайки, ATV, UTV и снежная техника. Харизма на электротяге.</p></div></div>
<div class="hd"><span>Рабочие названия моделей и цифры в документе ориентировочные</span><span>Москва / Ростов-на-Дону / Краснодарский край</span></div></section>''')
# 2 about
page("01 О бренде",f'''<h2>Что мы делаем<br>и во что верим</h2><div class="cols c3" style="margin-top:0">
<div class="card"><h3>Миссия</h3><p>Сделать электротягу доступной и желанной. Техника для леса, города и снега, которой хочется ездить, а не только владеть.</p></div>
<div class="card"><h3>Позиционирование</h3><p>Электробайки и вездеходы с характером. Линейка Base, Sport, Pro, розница и опт, шоурум в Ростове, доставка по России.</p></div>
<div class="card"><h3>Ценности</h3><ul><li><b>Харизма.</b> Яркий, но не крикливый.</li><li><b>Честность.</b> Целевые цифры называем целевыми.</li><li><b>Заряд.</b> Дело, а не декор.</li></ul></div></div>
<p class="mono" style="margin-top:36px">Формулировки рабочие: предложены на основе сайта, подтверждаются владельцем бренда</p>''')
# 3 audience
page("02 Аудитория",f'''<h2>Две аудитории,<br>один бренд</h2><div class="cols c2" style="margin-top:0">
<div class="card"><h3 class="accent">Молодые, 14+</h3><p>Хотят скорость, внешний вид и свой язык. Живут в соцсетях и видео. На сайте выбирают обращение «на ты», тон живее, больше слэнга и хрома.</p><div class="rule"></div><p class="mono">Покупает чаще вместе с родителями</p></div>
<div class="card"><h3 style="color:var(--sky)">Взрослые и родители</h3><p>Хотят понятные характеристики, сервис и спокойствие за выбор. На сайте выбирают «на вы», тон сдержаннее, больше фактов и меньше сленга.</p><div class="rule"></div><p class="mono">Сравнивают, читают, приезжают в шоурум</p></div></div>
<p class="t" style="margin-top:36px;max-width:1300px">Отсюда переключатель тона на входе в сайт: одна айдентика, два регистра речи. Визуальная часть не меняется, меняется только манера текста.</p>''')
# 4 competitors
page("03 Ориентиры и конкуренты",f'''<h2>Кого держим<br>в поле зрения</h2><div class="cols c4" style="margin-top:0">
<div class="card"><h3>Cowboy</h3><p>Чистота и сдержанность городского электро.</p></div>
<div class="card"><h3>Sur-Ron</h3><p>Агрессивный энергичный образ эндуро.</p></div>
<div class="card"><h3>Super73</h3><p>Культура, комьюнити, стиль образа жизни.</p></div>
<div class="card"><h3>Zero</h3><p>Технологичность и серьезность премиум-сегмента.</p></div></div>
<p class="t" style="margin-top:40px;max-width:1400px"><b style="color:var(--frost)">Наше место:</b> между Sur-Ron и Cowboy, как просил заказчик. Энергия и свой язык для молодых, выверенность и порядок для взрослых. Стилистические ориентиры сайта: zeromotorcycles.com, kieran-clarke.com, eu.super73.com, stereoscopecoffee.com, savicmotorcycles.com.</p>
<p class="mono" style="margin-top:28px">Это стилистические ориентиры, а не анализ цен и долей рынка: конкурентный анализ рынка РФ делается отдельно</p>''')
# 5 name
page("04 Название и слоган",f'''<h2>Имя бренда</h2><div class="cols c2" style="margin-top:0">
<div><div class="card"><p class="mono">Написание</p><p style="font-family:U;font-size:72px;font-weight:500;color:var(--frost);margin:12px 0">E-Rizz</p><p>Латиница, дефис, две «z». В заголовках и на логотипе: E-RIZZ.</p></div>
<div class="card" style="margin-top:24px"><p class="mono">Значение</p><p>Rizz (англ. сленг) значит харизма, умение нравиться. Электро плюс харизма: машина, на которую смотрят.</p></div></div>
<div><div class="card"><p class="mono">Произношение</p><p style="font-size:30px;color:var(--frost)">«и-риз»</p><p style="margin-top:8px">Допустимо «и-риз» и «и-ризз». В тексте не склоняется: «байки E-Rizz», «в E-Rizz».</p></div>
<div class="card" style="margin-top:24px"><p class="mono">Слоган</p><p style="font-family:U;font-size:34px;font-weight:500;color:var(--frost);text-transform:uppercase;line-height:1.2;margin:10px 0">Харизма на электротяге</p><p>Рабочий вариант. Запасной: «Заряд с характером».</p></div></div></div>
<p class="mono" style="margin-top:30px">Название и слоган не проверены на товарные знаки</p>''')
# 6 tov
page("05 Tone of voice",f'''<h2>Как мы говорим</h2><div class="cols c2" style="margin-top:0">
<div class="card"><h3 class="accent">На ты</h3><p>Коротко, живо, без канцелярита. Слэнг дозированно: рэйз, дроп, заряд.</p><div class="rule"></div><p style="color:var(--frost)">«Собери свой. Колеса, цвет, мощность. Потом на тест-драйв.»</p></div>
<div class="card"><h3 style="color:var(--sky)">На вы</h3><p>Спокойно, с фактами и вежливой дистанцией. Слэнг убираем.</p><div class="rule"></div><p style="color:var(--frost)">«Соберите модель под себя: колеса, цвет, мощность. Затем запишитесь на тест-драйв.»</p></div></div>
<div class="cols c3" style="margin-top:40px"><div class="card"><h3>Всегда</h3><p>Понятные факты. Целевые значения подписаны как целевые. Русский текст, английские названия бренда и моделей.</p></div><div class="card"><h3>Никогда</h3><p>Давление и «успей купить». Пустые обещания. Упоминание внутренних поставщиков и закупочных цен.</p></div><div class="card"><h3>Пунктуация</h3><p>Без длинного тире, без «ё». Короткие предложения, активный залог.</p></div></div>''')
# 7 logo idea
page("06 Логотип: идея",f'''<div class="cols c2" style="margin-top:20px;align-items:center;grid-template-columns:.9fr 1.1fr"><div class="stage" style="height:640px;background:var(--deep)">{img("mark-color",460)}</div>
<div><h2 style="margin-top:0">Колесо<br>пробито<br><span class="accent">разрядом</span></h2><ul><li><b>Кольцо.</b> Хромированный обод колеса.</li><li><b>Тонкое внутреннее кольцо.</b> Намек на тему диаметров колес, 17/14, 19/18, 21/18.</li><li><b>Молния.</b> Цвет Flare. Выходит за обод: энергия, рэйз, тот же знак, что и курсор на сайте.</li><li><b>Зазор вокруг молнии.</b> Знак читается на любом фоне, даже мелко.</li></ul></div></div>''')
# 8 versions
page("07 Логотип: версии",f'''<h2 style="margin:30px 0 24px">Версии и сборки</h2><div style="display:grid;grid-template-columns:1fr 1fr;gap:24px;grid-template-rows:260px 260px 160px">
<div class="stage" style="background:var(--ink)">{img("lockup-color",110)}</div>
<div class="stage" style="background:var(--frost)">{img("lockup-on-light",110)}</div>
<div class="stage" style="background:var(--deep)">{img("stacked-color",190)}</div>
<div class="stage" style="background:var(--flare)">{img("stacked-black",190)}</div>
<div class="stage" style="background:var(--kelp)">{img("wordmark-white",56)}</div>
<div class="stage" style="background:var(--sleet);gap:60px">{img("mark-black",90)}{img("wordmark-black",44)}</div></div>
<p class="t" style="margin-top:22px">Основная: цветной горизонтальный знак на темном. На светлом: «on-light». Одноцветные версии (белая, черная) для печати, вышивки, гравировки и клейма.</p>''')
# 9 clear space
cs=f'''<div style="position:relative;padding:100px;border:2px dashed var(--flare);display:inline-block;background:rgba(255,74,43,.06)">{img("lockup-color",120)}</div>'''
page("08 Охранное поле и размеры",f'''<h2 style="margin:30px 0 24px">Свободное место</h2><div class="cols c2" style="margin-top:0;grid-template-columns:1.3fr 1fr;align-items:center"><div class="stage" style="height:560px;background:var(--deep)">{cs}</div>
<div><ul><li><b>Охранное поле:</b> высота знака вокруг лого со всех сторон (на схеме пунктир).</li><li><b>Минимальный размер знака:</b> 16 px в вебе, 6 мм в печати.</li><li><b>Минимальный размер горизонтальной версии:</b> 96 px в ширину, 24 мм в печати.</li><li><b>Мелко:</b> применяем только знак в кольце, без слова.</li></ul>
<div style="display:flex;gap:36px;align-items:flex-end;margin-top:36px">{img("mark-color",96)}{img("mark-color",48)}{img("mark-color",24)}{img("mark-color",16)}</div></div></div>''')
# 10 misuse
mis=[("Не растягивать и не сжимать",'<img src="../logo/lockup-color.svg" style="height:50px;width:300px">'),("Не менять цвета молнии",'<span style="filter:hue-rotate(150deg)">'+img("lockup-color",80)+'</span>'),("Не поворачивать","<span style=\"display:inline-block;transform:rotate(-16deg)\">"+img("lockup-color",80)+"</span>"),("Не ставить на пестрый фон",'<div style="background:linear-gradient(135deg,#ffd400,#00c2a8,#ff4aa0);padding:30px;border-radius:4px">'+img("lockup-color",70)+'</div>'),("Не добавлять тени и свечение","<span style=\"filter:drop-shadow(0 0 18px #ff4a2b)\">"+img("lockup-color",80)+"</span>"),("Не заменять шрифт слова",'<span style="font-family:Georgia;font-size:70px;color:#fff;display:flex;align-items:center;gap:20px">'+img("mark-color",80)+'E-Rizz</span>')]
items="".join(f'<div class="card no" style="display:flex;flex-direction:column;gap:20px;height:290px"><div style="flex:1;display:flex;align-items:center;justify-content:center;overflow:hidden">{h}</div><p>{t}</p></div>' for t,h in mis)
page("09 Недопустимое",f'<h2 style="margin:30px 0 24px">Так делать нельзя</h2><div style="display:grid;grid-template-columns:repeat(3,1fr);gap:24px">{items}</div>')
# 11 colors
sw="".join(f'<div class="sw"><i style="background:#{h}"></i><div><b>{n}</b>{r}<br>#{h.upper()}<br>RGB {rgb(h)}<br>CMYK {cmyk(h)}<br><span style="color:var(--steel)">{role}</span></div></div>' for n,r,h,role in COL[:6])
sw2="".join(f'<div class="sw"><i style="background:#{h}"></i><div><b>{n}</b>{r}<br>#{h.upper()}<br>RGB {rgb(h)}<br>CMYK {cmyk(h)}<br><span style="color:var(--steel)">{role}</span></div></div>' for n,r,h,role in COL[6:])
page("10 Цвет",f'<h2 style="margin:30px 0 24px">Палитра: база</h2><div style="display:grid;grid-template-columns:repeat(6,1fr);gap:16px">{sw}</div><p class="t" style="margin-top:30px;max-width:1400px">Основа: темные Ink, Deep, Kelp и холодный хром Silver, Sleet, Frost. Хром собирается градиентом из Frost, Silver, Steel. Золотой и бирюзовый в палитре не используются.</p>')
page("10 Цвет: акценты",f'<h2 style="margin:30px 0 24px">Палитра: акценты</h2><div style="display:grid;grid-template-columns:repeat(5,1fr);gap:16px">{sw2}</div><div style="display:flex;height:70px;margin-top:40px;border-radius:4px;overflow:hidden"><i style="flex:60;background:#0e1013;border:1px solid #333"></i><i style="flex:25;background:linear-gradient(100deg,#f4f7fa,#b9c2cc 40%,#6f7a86 55%,#d9dee3)"></i><i style="flex:10;background:#ff4a2b"></i><i style="flex:3;background:#5e1224"></i><i style="flex:2;background:#9cc9ff"></i></div><p class="t" style="margin-top:20px">Пропорции: 60% темная база, 25% хром и светлое, 10% Flare, 3% бордо, 2% голубые. Голубой и синий только вкраплениями: тонкие линии, подписи, наведение. CMYK расчетный, перед печатью нужен тестовый оттиск, цвет Pantone подбирается в типографии.</p>')
# 12 type
page("11 Типографика",f'''<h2 style="margin:30px 0 24px">Три шрифта</h2><div class="cols c3" style="margin-top:0;align-items:start">
<div class="card"><p class="mono">Заголовки / Unbounded 500, 800</p><p style="font-family:U;font-weight:500;font-size:76px;line-height:1;color:var(--frost);margin:20px 0;text-transform:uppercase">Rizz 19/18</p><p>Широкий геометричный гротеск. Только капсом в крупных заголовках, межстрочный 1.0 до 1.1, трекинг от минус 2% до 0.</p></div>
<div class="card"><p class="mono">Текст / Onest 400, 600</p><p style="font-size:62px;line-height:1.05;color:var(--frost);margin:20px 0;font-weight:600">Спокойный<br>текст</p><p>Основной шрифт для описаний и интерфейса. Размер 16 до 24 px, межстрочный 1.5.</p></div>
<div class="card"><p class="mono">Данные / Martian Mono</p><p style="font-family:M;font-size:44px;line-height:1.2;color:var(--frost);margin:20px 0;letter-spacing:.04em">10-16 КВТ<br>2,6-3,6 КВТЧ</p><p>Подписи, цифры, метки. Капсом с трекингом 10 до 16%, 12 до 15 px.</p></div></div>
<p class="t" style="margin-top:30px">Все три шрифта поддерживают кириллицу и распространяются по открытой лицензии OFL. Запасные: Arial Black для заголовков, Arial для текста, Courier New для данных.</p>''')
# 13 graphics
page("12 Графика и эффекты",f'''<h2 style="margin:30px 0 24px">Язык поверхности</h2><div class="cols c3" style="margin-top:0">
<div class="card"><h3>Сетка</h3><p>Квадратная сетка 80 px, линия 1 px, прозрачность 4 до 6%. Едва видна: задает порядок, а не рисунок.</p></div>
<div class="card"><h3>Частицы и шум</h3><p>Поле частиц и блочный шум в Flare и Silver. Только как фон секции, всегда приглушены.</p></div>
<div class="card"><h3>Хром</h3><p>Холодный градиент Frost, Silver, Steel для крупных заголовков и деталей техники.</p></div>
<div class="card"><h3>Контурные цифры</h3><p>Диаметры колес 17, 14, 19, 18, 21 крупным контуром на фоне. Главный повторяющийся мотив.</p></div>
<div class="card"><h3>3D байки</h3><p>Одна модель на сцену, мягкий студийный свет, хромовые отражения. Фото поставщиков не используются.</p></div>
<div class="card"><h3>Курсор молния</h3><p>Хромовая молния заменяет обычный курсор на сайте. Совпадает со знаком в логотипе.</p></div></div>
<p class="t" style="margin-top:30px">Анимации спокойные: плавные переходы и закрепление секций при прокрутке, без резких вспышек и мельтешения.</p>''')
# 14 grid/composition
page("13 Композиция",f'''<h2 style="margin:30px 0 24px">Сетка и ритм</h2><div class="cols c2" style="margin-top:0;grid-template-columns:1fr 1fr;align-items:start"><div><ul><li><b>Веб:</b> 12 колонок, поля 120 px на десктопе, 16 px на телефоне, отступ между колонками 24 px.</li><li><b>Базовая единица:</b> 8 px. Все отступы кратны 8.</li><li><b>Воздух:</b> больше пространства получаем не пустотой, а широкой расстановкой элементов.</li><li><b>Скругления:</b> 4 px у карточек, кнопки прямоугольные с тонкой рамкой.</li><li><b>Печать:</b> A4, поля 15 мм, сетка 6 колонок.</li></ul></div>
<div class="stage" style="height:520px;background:var(--deep);position:relative;overflow:hidden"><div style="position:absolute;inset:0;display:grid;grid-template-columns:repeat(12,1fr);gap:10px;padding:0 40px">{"".join('<i style="background:rgba(255,74,43,.12)"></i>' for _ in range(12))}</div><div style="position:relative;z-index:1;text-align:center;font-family:U;font-weight:500;font-size:70px;text-transform:uppercase" class="chrome">Sport 19/18</div></div></div>''')
# 15 site application
page("14 Применение: сайт",f'''<h2 style="margin:30px 0 24px">Сайт</h2><div style="display:grid;grid-template-columns:1fr 1fr;gap:24px"><div><img src="img/gate.png" style="width:100%;border-radius:4px;border:1px solid rgba(185,194,204,.25)"><p class="mono" style="margin-top:12px">Вход: выбор тона</p></div><div><img src="img/hero-site.png" style="width:100%;border-radius:4px;border:1px solid rgba(185,194,204,.25)"><p class="mono" style="margin-top:12px">Главный экран и 3D модель</p></div></div>''')
page("14 Применение: линейка",f'''<h2 style="margin:30px 0 24px">Линейка и модели</h2><div style="display:grid;grid-template-columns:1.4fr 1fr;gap:32px;align-items:start"><img src="img/lineup.png" style="width:100%;border-radius:4px;border:1px solid rgba(185,194,204,.25)"><div><ul><li><b>Base 17/14:</b> базовая модель.</li><li><b>Sport 19/18:</b> динамика и запас хода.</li><li><b>Pro 21/18:</b> максимум в линейке.</li></ul><p class="t" style="margin-top:20px">Каждая модель получает свой цвет сцены и контурное число диаметра колес. Характеристики на сайте помечены как целевые.</p></div></div>''')
# 16 print/ merch
card=f'''<div style="width:420px;height:240px;background:var(--ink);border:1px solid #444;border-radius:4px;position:relative;padding:26px;display:flex;flex-direction:column;justify-content:space-between">{img("lockup-color",54)}<div style="font-family:M;font-size:12px;color:var(--silver);letter-spacing:.1em;line-height:1.7">ИМЯ ФАМИЛИЯ<br>ДИЛЕРСКИЙ ОТДЕЛ<br>+7 000 000-00-00<br>ROSTOV-ON-DON</div></div>'''
stick=f'''<div style="width:240px;height:240px;border-radius:50%;background:var(--flare);display:flex;align-items:center;justify-content:center">{img("mark-black",150)}</div>'''
plate=f'''<div style="width:420px;height:150px;background:var(--frost);border:6px solid var(--ink);border-radius:10px;display:flex;align-items:center;justify-content:center;gap:24px">{img("mark-on-light",100)}<span style="font-family:U;font-weight:800;font-size:60px;color:var(--ink)">RIZZ 21</span></div>'''
post=f'''<div style="width:300px;height:300px;background:var(--deep);position:relative;overflow:hidden;padding:24px;display:flex;flex-direction:column;justify-content:space-between;background-image:linear-gradient(rgba(185,194,204,.06) 1px,transparent 1px),linear-gradient(90deg,rgba(185,194,204,.06) 1px,transparent 1px);background-size:30px 30px"><span style="position:absolute;right:-10px;bottom:-40px;font-family:U;font-weight:800;font-size:200px;color:transparent;-webkit-text-stroke:1.5px rgba(185,194,204,.4)">19</span>{img("mark-color",52)}<div style="font-family:U;font-weight:500;font-size:34px;line-height:1;text-transform:uppercase;position:relative" class="chrome">Новый<br>Sport<br>19/18</div></div>'''
page("15 Применение: носители",f'''<h2 style="margin:30px 0 24px">Носители</h2><div style="display:grid;grid-template-columns:auto auto auto;gap:40px;align-items:center;justify-content:start"><div>{card}<p class="mono" style="margin-top:12px">Визитка 90 x 50 мм</p></div><div>{stick}<p class="mono" style="margin-top:12px">Наклейка на байк, диаметр 80 мм</p></div><div>{post}<p class="mono" style="margin-top:12px">Пост в соцсетях 1080 x 1080</p></div><div>{plate}<p class="mono" style="margin-top:12px">Номерная табличка, сувенир</p></div></div><p class="t" style="margin-top:30px">Образцы иллюстративные: тексты, номера и имена вымышлены.</p>''')
# 17 dos
page("16 Принципы",f'''<h2 style="margin:30px 0 24px">Коротко о главном</h2><div class="cols c2" style="margin-top:0"><div class="card ok"><h3 style="color:var(--sky)">Делаем</h3><ul><li>Темная база, хром, один акцент Flare.</li><li>Крупные контурные цифры колес.</li><li>Один фокус на экран, одна модель на сцену.</li><li>Тон на ты или на вы по выбору пользователя.</li><li>Целевые цифры подписываем как целевые.</li></ul></div>
<div class="card no"><h3 class="accent">Не делаем</h3><ul><li>Золото, бирюзу, неоновые градиенты.</li><li>Яркую сетку и тяжелые свечения.</li><li>Фото с логотипами поставщиков.</li><li>Мультяшные эффекты и шутки про закон.</li><li>Длинное тире и «ё» в текстах.</li></ul></div></div>''')
# 18 files
page("17 Файлы",f'''<h2 style="margin:30px 0 24px">Что лежит в папке</h2><div class="cols c2" style="margin-top:0"><ul><li><b>logo/mark-*.svg:</b> знак.</li><li><b>logo/wordmark-*.svg:</b> слово E-RIZZ в кривых.</li><li><b>logo/lockup-*.svg:</b> горизонтальная сборка.</li><li><b>logo/stacked-*.svg:</b> вертикальная сборка.</li><li><b>logo/app-icon.svg:</b> иконка приложения и фавикон.</li></ul><ul><li><b>Версии:</b> color, white, black, on-light.</li><li><b>brandbook/index.html:</b> исходник брендбука.</li><li><b>tools/:</b> скрипты, которые пересобирают логотип и книгу.</li><li><b>Шрифты:</b> Unbounded, Onest, Martian Mono (OFL).</li></ul></div><div style="margin-top:auto;display:flex;justify-content:space-between;align-items:center">{img("lockup-color",90)}<span class="mono">Брендбук 1.0 / версия для обсуждения</span></div>''')
html=f'<!doctype html><html lang="ru"><meta charset="utf-8"><title>E-Rizz: брендбук</title><style>{css}</style><body>{"".join(pages)}</body></html>'
open(f"{D}/index.html","w").write(html)
bad=[m for m in re.findall(r"[^\n]{0,20}(?:—|ё|Ё)[^\n]{0,10}",re.sub(r"<style>.*?</style>","",html,flags=re.S))]
print("pages",N[0],"bad",bad[:5])
