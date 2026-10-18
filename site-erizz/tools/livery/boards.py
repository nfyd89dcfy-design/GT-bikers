"""Доски «Ливрея GT» 1920x1080: история, три направления, сравнение. Рендер через Playwright."""
import os
from playwright.sync_api import sync_playwright

HERE = os.path.abspath('.')
NM = '/home/claude/wt/erizz/site-erizz/node_modules/@fontsource'
FONTS = f"""
@font-face {{ font-family: U; font-weight: 500; src: url(file://{NM}/unbounded/files/unbounded-cyrillic-500-normal.woff2); unicode-range: U+0400-04FF; }}
@font-face {{ font-family: U; font-weight: 500; src: url(file://{NM}/unbounded/files/unbounded-latin-500-normal.woff2); unicode-range: U+0000-00FF; }}
@font-face {{ font-family: U; font-weight: 800; src: url(file://{NM}/unbounded/files/unbounded-cyrillic-800-normal.woff2); unicode-range: U+0400-04FF; }}
@font-face {{ font-family: U; font-weight: 800; src: url(file://{NM}/unbounded/files/unbounded-latin-800-normal.woff2); unicode-range: U+0000-00FF; }}
@font-face {{ font-family: O; font-weight: 400; src: url(file://{NM}/onest/files/onest-cyrillic-400-normal.woff2); unicode-range: U+0400-04FF; }}
@font-face {{ font-family: O; font-weight: 400; src: url(file://{NM}/onest/files/onest-latin-400-normal.woff2); unicode-range: U+0000-00FF, U+2013, U+00B7; }}
@font-face {{ font-family: O; font-weight: 600; src: url(file://{NM}/onest/files/onest-cyrillic-600-normal.woff2); unicode-range: U+0400-04FF; }}
@font-face {{ font-family: O; font-weight: 600; src: url(file://{NM}/onest/files/onest-latin-600-normal.woff2); unicode-range: U+0000-00FF; }}
@font-face {{ font-family: M; src: url(file://{NM}-variable/martian-mono/files/martian-mono-latin-wght-normal.woff2); unicode-range: U+0000-00FF; }}
@font-face {{ font-family: M; src: url(file://{NM}-variable/martian-mono/files/martian-mono-cyrillic-wght-normal.woff2); unicode-range: U+0400-04FF; }}
@font-face {{ font-family: A; src: url(file://{NM}/archivo-black/files/archivo-black-latin-400-normal.woff2); }}
"""
CSS = FONTS + """
* { box-sizing: border-box; margin: 0; }
body { width: 1920px; height: 1080px; overflow: hidden; background: #fff; color: #0e1013; font-family: O, sans-serif; }
.b { position: relative; width: 1920px; height: 1080px; padding: 72px 88px; }
.dark { background: #000; color: #f2f4f6; }
.mono { font-family: M, monospace; font-size: 15px; letter-spacing: .16em; text-transform: uppercase; }
.mute { color: #5a626c; } .dark .mute { color: #8d97a2; }
.h { font-family: U, sans-serif; font-weight: 800; text-transform: uppercase; line-height: .94; letter-spacing: -.02em; }
.flare { color: #ff4a2b; }
.foot { position: absolute; left: 88px; right: 88px; bottom: 40px; display: flex; justify-content: space-between; }
.chip { display: inline-flex; align-items: center; gap: 10px; padding: 8px 14px; border-radius: 999px; border: 1px solid rgb(14 16 19 / .16); font-size: 18px; font-weight: 600; }
.dark .chip { border-color: rgb(242 244 246 / .2); }
.sw { width: 18px; height: 18px; border-radius: 50%; }
.grid4 { display: grid; grid-template-columns: repeat(4, 1fr); gap: 18px; }
.tile { background: #f4f5f7; border-radius: 18px; position: relative; overflow: hidden; display: flex; align-items: center; justify-content: center; }
.dark .tile { background: #0f1012; }
.tile img { max-width: 92%; max-height: 82%; object-fit: contain; }
.tile .lb { position: absolute; left: 18px; top: 14px; }
.tile .ac { position: absolute; right: 18px; top: 14px; display: flex; align-items: center; gap: 8px; }
.list li { list-style: none; padding: 14px 0; border-top: 1px solid rgb(14 16 19 / .12); font-size: 22px; line-height: 1.3; }
.dark .list li { border-color: rgb(242 244 246 / .14); }
.list b { font-weight: 600; }
.n { font-family: M, monospace; color: #ff4a2b; font-size: 15px; margin-right: 12px; }
"""
SER = [('Spark', '#9cc9ff', 'питбайки'), ('Send', '#ff4a2b', 'trail'), ('Ridge', '#b0283f', 'эндуро'), ('Pulse', '#2a5bd7', 'город')]
MODELS = [('02', 'GT Spark 14', 'Spark', '#9cc9ff'), ('10', 'GT Send 19 R', 'Send', '#ff4a2b'), ('12', 'GT Send 19 Factory', 'Send', '#ff4a2b'), ('16', 'GT Pulse 17', 'Pulse', '#2a5bd7')]


def foot(i, dark=False):
    return f'<div class="foot mono mute"><span>GT · ливрея · черновик 18.10</span><span>{i:02d}</span></div>'


def img(p):
    return f'file://{HERE}/{p}'


def board_story():
    sw = ''.join(f'<span class="chip" style="font-size:16px;padding:6px 12px"><span class="sw" style="background:{c};width:14px;height:14px"></span>{n}<span class="mute" style="font-weight:400">{d}</span></span>' for n, c, d in SER)
    strip = ''.join(f'<div class="tile" style="height:250px"><span class="lb mono mute">{k}</span><img src="{img(f"mock/10_{v}.png")}"></div>' for k, v in (('A · Clean', 'clean'), ('B · Race', 'race'), ('C · Street', 'street')))
    return f"""<div class="b">
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:72px">
    <div>
      <p class="mono mute">ливрея gt / зачем</p>
      <h1 class="h" style="font-size:128px;margin-top:22px">Внешка<br>решает</h1>
      <p style="font-size:24px;line-height:1.38;margin-top:30px">Подросток выбирает байк глазами, а фото с ним видят все друзья в ленте. Родитель платит за ощущение серьезной вещи, а не «китайца». Сейчас байки от разных заводов выглядят по-разному, на них чужие логотипы и случайные цвета. <b>Своя ливрея делает из 20 разных байков одну линейку GT.</b></p>
      <p class="mute" style="margin-top:14px;font-size:18px;line-height:1.35">Под популярные модели (Sur-Ron, Talaria) отдельно продаются наборы графики: владельцы платят за внешний вид сверх цены байка.</p>
    </div>
    <ul class="list" style="padding:0;margin-top:54px">
      <li><span class="n">01</span><b>Одна фирменная ливрея</b> на всю линейку. Выбираем одно из трех направлений.</li>
      <li><span class="n">02</span><b>Свой цвет у серии</b>, основа общая:<div style="display:flex;flex-wrap:wrap;gap:8px;margin-top:10px">{sw}</div></li>
      <li><span class="n">03</span><b>Знак GT крупно</b> на боковине: читается с 10 метров и на фото в ленте.</li>
      <li><span class="n">04</span><b>Номер владельца</b> на табличках, как у гонщика. Печатаем при покупке.</li>
      <li><span class="n">05</span><b>Производство:</b> цвет пластика заказываем у завода в партии, наклейки печатает завод.</li>
    </ul>
  </div>
  <div style="position:absolute;left:88px;right:88px;bottom:84px;display:grid;grid-template-columns:repeat(3,1fr);gap:18px">{strip}</div>
  {foot(1)}
</div>"""


DIRS = {
    'clean': dict(no='A', name='Clean', ru='Чистая', who='взрослые и родители', idea='Графит и белые крылья, одна линия цвета серии, знак GT и номер в табличке. Дорого и спокойно, как у Zero и Stark.',
                  base=[('#22262d', 'боковины, маска'), ('#f6f7f8', 'крылья, хвост')], kit=['mark_light', 'plate_clean'],
                  pros=['Выглядит дороже всех', 'Не надоедает, грязь и царапины видны меньше', 'Нравится родителям'],
                  cons=['Тише в ленте, меньше «вау» у подростков']),
    'race': dict(no='B', name='Race', ru='Гонка', who='подростки, кросс-тусовка', idea='Белый пластик, крупные блоки цвета серии, большой номер владельца и плашки «спонсоров», которые продают наши же услуги: GT Tuning, экипировка.',
                 base=[('#f6f7f8', 'весь пластик'), ('#22262d', 'шевроны, бак')], kit=['mark_dark', 'plate_race'],
                 pros=['Самая заметная на трассе и в ленте', 'Номер владельца в центре внимания', 'Реклама тюнинга прямо на байке'],
                 cons=['Белый пластик быстрее пачкается', 'Больше наклеек, дороже набор']),
    'street': dict(no='C', name='Street', ru='Улица', who='подростки, соцсети', idea='Графитовая основа и стикербомбинг в цветах серии: GT, SEND IT, NO GAS, FULL CHARGE. Байк как скейт: его хочется снимать.',
                   base=[('#22262d', 'весь пластик'), ('цвет серии', 'стикеры')], kit=['mark_light', 'plate_street'],
                   pros=['Самая «своя» для подростков', 'Каждый байк чуть разный', 'Легко обновлять стикеры каждый сезон'],
                   cons=['Пестро, родителям может не зайти', 'Сложнее держать единый стиль линейки']),
}


def board_dir(key, i):
    d = DIRS[key]
    tiles = ''.join(f'<div class="tile" style="height:400px"><span class="lb mono mute">{nm}</span><span class="ac mono mute"><span class="sw" style="background:{c};width:12px;height:12px"></span>{s}</span><img src="{img(f"mock/{n}_{key}.png")}"></div>' for n, nm, s, c in MODELS)
    base = ''.join(f'<span class="chip"><span class="sw" style="background:{c if c.startswith("#") else "conic-gradient(#9cc9ff 0 25%,#ff4a2b 0 50%,#b0283f 0 75%,#2a5bd7 0)"};border:1px solid rgb(0 0 0 / .15)"></span>{t}</span>' for c, t in d['base'])
    kit = ''.join(f'<div class="tile" style="width:150px;height:120px;background:{"#22262d" if k=="mark_light" else "#f4f5f7"}"><img src="{img(f"kit/{k}.png")}" style="max-height:78%"></div>' for k in d['kit'])
    pros = ''.join(f'<li style="font-size:19px;padding:9px 0">+ {p}</li>' for p in d['pros'])
    cons = ''.join(f'<li style="font-size:19px;padding:9px 0" class="mute">− {p}</li>' for p in d['cons'])
    return f"""<div class="b">
  <div style="display:flex;justify-content:space-between;align-items:flex-start">
    <div>
      <p class="mono mute">направление {d['no']} / {d['who']}</p>
      <h1 class="h" style="font-size:110px;margin-top:18px">{d['name']} <span class="mute" style="font-size:.42em;font-weight:500">{d['ru']}</span></h1>
    </div>
    <p style="font-size:24px;line-height:1.35;max-width:640px;margin-top:40px">{d['idea']}</p>
  </div>
  <div class="grid4" style="margin-top:44px">{tiles}</div>
  <div style="position:absolute;left:88px;right:88px;bottom:86px;display:grid;grid-template-columns:auto auto 1fr 1fr;gap:40px;align-items:start">
    <div><p class="mono mute" style="margin-bottom:12px">пластик с завода</p><div style="display:flex;flex-direction:column;gap:8px">{base}</div></div>
    <div><p class="mono mute" style="margin-bottom:12px">наклейки с завода</p><div style="display:flex;gap:12px">{kit}</div></div>
    <ul class="list" style="padding:0">{pros}</ul>
    <ul class="list" style="padding:0">{cons}</ul>
  </div>
  {foot(i)}
</div>"""


def board_compare():
    rows = [('Узнаваемость в ленте', '●●○', '●●●', '●●●'), ('Подросткам', '●●○', '●●●', '●●●'), ('Родителям', '●●●', '●●○', '●○○'),
            ('Стоимость набора наклеек', 'низкая', 'средняя', 'средняя'), ('Грязь и царапины', 'почти не видно', 'видно на белом', 'не видно'),
            ('Единый стиль 20 моделей', '●●●', '●●●', '●●○'), ('Продает тюнинг и экипировку', '○○○', '●●●', '●○○')]
    th = ''.join(f'<th style="text-align:left;padding:16px 18px;font-family:U;font-weight:800;font-size:30px;text-transform:uppercase">{h}</th>' for h in ('', 'A · Clean', 'B · Race', 'C · Street'))
    tr = ''.join('<tr>' + ''.join(f'<td style="padding:16px 18px;border-top:1px solid rgb(14 16 19 / .12);font-size:22px;{"color:#5a626c" if j==0 else ""}">{v}</td>' for j, v in enumerate(r)) + '</tr>' for r in rows)
    strip = ''.join(f'<div class="tile" style="height:190px"><img src="{img(f"mock/10_{k}.png")}"></div>' for k in ('clean', 'race', 'street'))
    return f"""<div class="b">
  <p class="mono mute">сравнение и что дальше</p>
  <h1 class="h" style="font-size:84px;margin-top:18px">Одна ливрея на всю линейку</h1>
  <div style="display:grid;grid-template-columns:1.25fr 1fr;gap:60px;margin-top:40px">
    <table style="border-collapse:collapse;width:100%"><tr>{th}</tr>{tr}</table>
    <div>
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px">{strip}</div>
      <ul class="list" style="padding:0;margin-top:26px">
        <li><span class="n">01</span>Выбираем направление с владельцем.</li>
        <li><span class="n">02</span>Доводим набор: точные размеры деталей пластика под каждую модель.</li>
        <li><span class="n">03</span>Отдаем заводу: цвет пластика и печать наклеек в следующую партию.</li>
        <li><span class="n">04</span>Номер владельца печатаем у себя при покупке.</li>
      </ul>
    </div>
  </div>
  {foot(5)}
</div>"""


import json as _json
FD = _json.load(open('factory/data.json'))


def board_hybrid():
    tiles = ''.join(f'<div class="tile" style="height:400px"><span class="lb mono mute">{nm}</span><span class="ac mono mute"><span class="sw" style="background:{c};width:12px;height:12px"></span>{s}</span><img src="{img(f"mock/{n}_hybrid.png")}"></div>' for n, nm, s, c in MODELS)
    rules = [('Основа', 'графитовые боковины и бак, белые хвост и крыло: грязь почти не видно, выглядит дорого'),
             ('Цвет серии', 'одна диагональ через бак и боковину, тонкая линия на крыле, шевроны у знака'),
             ('Знак GT', 'крупно на боковине, белая рамка и T в цвете серии'),
             ('Номер владельца', 'большая табличка сбоку и цветная спереди, печатаем при покупке'),
             ('GT Tuning', 'плашка на маятнике: байк сам рекламирует наш тюнинг')]
    li = ''.join(f'<li style="font-size:20px;padding:11px 0"><b>{a}.</b> {b}</li>' for a, b in rules)
    return f"""<div class="b">
  <div style="display:flex;justify-content:space-between;align-items:flex-start">
    <div><p class="mono mute">выбранное направление / A + B</p>
    <h1 class="h" style="font-size:104px;margin-top:18px">Clean + Race</h1></div>
    <p style="font-size:24px;line-height:1.35;max-width:640px;margin-top:40px">Спокойная основа для родителей и гоночные детали для подростков: номер владельца и плашка GT Tuning. Одна ливрея на всю линейку, меняется только цвет серии.</p>
  </div>
  <div class="grid4" style="margin-top:40px">{tiles}</div>
  <ul class="list" style="position:absolute;left:88px;right:88px;bottom:80px;padding:0;columns:2;column-gap:60px">{li}</ul>
  {foot(6)}
</div>"""


def board_factory():
    cells = ''
    for n, nm, s_, c in MODELS:
        d = FD['rows'][n]; ser = d['ser']
        rows = ''.join(f'<tr><td style="padding:5px 0;color:#ff4a2b;font-family:M;font-size:14px">{no}</td><td style="padding:5px 10px;font-size:16px">{lab}</td><td style="padding:5px 0;font-size:16px;text-align:right;font-family:M;white-space:nowrap">{sz}</td></tr>' for no, lab, sz in d['items'])
        cells += f"""<div style="display:grid;grid-template-columns:1fr 330px;gap:18px;align-items:center;border-top:1px solid rgb(14 16 19 / .12);padding-top:14px">
  <img src="{img(f'factory/{n}.png')}" style="width:100%;height:340px;object-fit:contain">
  <div><p class="h" style="font-size:24px">{nm}</p>
  <p class="mono mute" style="margin:8px 0 6px;font-size:12px">наклейки, мм</p>
  <table style="width:100%;border-collapse:collapse">{rows}</table>
  <p class="mono mute" style="margin-top:10px;font-size:12px;line-height:1.6">пластик: графит #22262D ≈ RAL 7021<br>белый #F6F7F8 ≈ RAL 9003<br>серия: {FD['hex'][ser]} ≈ {FD['pant'][ser]}</p></div>
</div>"""
    return f"""<div class="b" style="padding-top:56px">
  <div style="display:flex;justify-content:space-between;align-items:flex-end">
    <div><p class="mono mute">развертка для завода</p><h1 class="h" style="font-size:64px;margin-top:12px">Что печатает завод</h1></div>
    <p class="mute" style="font-size:18px;max-width:700px;line-height:1.35">Размеры сняты с макета по фото в масштабе. Точные размеры подгоним по чертежам пластика от завода. Номер владельца завод печатает пустым, цифры клеим при покупке.</p>
  </div>
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px 50px;margin-top:22px">{cells}</div>
  {foot(7)}
</div>"""


BOARDS = [('01_story', board_story()), ('02_clean', board_dir('clean', 2)), ('03_race', board_dir('race', 3)), ('04_street', board_dir('street', 4)), ('05_compare', board_compare()), ('06_hybrid', board_hybrid()), ('07_factory', board_factory())]

if __name__ == '__main__':
    os.makedirs('boards', exist_ok=True)
    with sync_playwright() as p:
        b = p.chromium.launch(args=['--allow-file-access-from-files'])
        pg = b.new_page(viewport={'width': 1920, 'height': 1080})
        for name, html in BOARDS:
            open(f'boards/{name}.html', 'w').write(f'<!doctype html><html><head><meta charset="utf-8"><style>{CSS}</style></head><body>{html}</body></html>')
            pg.goto(f'file://{HERE}/boards/{name}.html'); pg.wait_for_timeout(700)
            pg.screenshot(path=f'boards/{name}.png')
        b.close()
    print('ok')
