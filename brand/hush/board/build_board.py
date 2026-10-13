#!/usr/bin/env python3
# Генерирует board/hush-board.html (холст) и brandbook.html (A4 landscape) из общих фрагментов-фреймов.
import math, re, os, json
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)

FOG, PAPER, PINE, MOSS, LICHEN, EMBER, EMBER_INK, VIOLET = '#E8EDEA', '#F5F8F6', '#0F1A16', '#4A5E54', '#BFD0C2', '#FF4B1F', '#B53210', '#7C4DFF'

def lum(h):
    h = h.lstrip('#'); r, g, b = [int(h[i:i+2], 16) / 255 for i in (0, 2, 4)]
    f = lambda c: c / 12.92 if c <= .03928 else ((c + .055) / 1.055) ** 2.4
    return .2126 * f(r) + .7152 * f(g) + .0722 * f(b)
def cr(a, b):
    la, lb = lum(a), lum(b); hi, lo = max(la, lb), min(la, lb); return (hi + .05) / (lo + .05)

# ---------- shared svg bits ----------
LOGO_SYM = open(os.path.join(ROOT, 'site/index.html'), encoding='utf8').read()
LOGO_SYM = re.search(r'<symbol id="lg".*?</symbol>', LOGO_SYM, re.S).group(0)
SPRITE = f'<svg width="0" height="0" style="position:absolute" aria-hidden="true">{LOGO_SYM}</svg>'
def logo(w=240, ink=PINE, extra=''):
    return f'<svg width="{w}" height="{w*0.3}" viewBox="0 0 400 120" style="--lg-ink:{ink};{extra}" role="img" aria-label="Hush"><use href="#lg"/></svg>'
def mark(s=120, ink=PINE, wave=EMBER, sw=12):
    return f'<svg width="{s}" height="{s}" viewBox="0 0 120 120" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M32 24V96M88 24V96" stroke="{ink}" stroke-width="{sw}"/><path d="M32 60C37 28 47 28 53 60C57 80 63 80 66 60C68 54 71 56 73 60L88 60" stroke="{wave}" stroke-width="{sw*.75}"/></svg>'

def hush_lines(w, h, n=26, amp=46, decay=.34, color=PINE, sw=1.4, op=.5, phase=0.0, freq=11):
    out = []
    for i in range(n):
        y0 = h * (i + .5) / n; pts = []
        for k in range(0, 121):
            x = w * k / 120; t = k / 120
            y = y0 + amp * math.exp(-t / decay) * math.sin(t * freq + i * .22 + phase) * (1 - abs(i / n - .5) * .8)
            pts.append(f'{x:.1f},{y:.1f}')
        out.append(f'<polyline points="{" ".join(pts)}"/>')
    return f'<svg width="{w}" height="{h}" viewBox="0 0 {w} {h}" fill="none" stroke="{color}" stroke-width="{sw}" opacity="{op}" style="position:absolute;inset:0" aria-hidden="true">{"".join(out)}</svg>'

def contour(w, h, color=PINE, op=.18, seed=1):
    out = []
    cx, cy = w * .72, h * .45
    for i in range(1, 22):
        r = i * (min(w, h) / 24); pts = []
        for k in range(0, 91):
            a = k / 90 * math.pi * 2
            rr = r * (1 + .22 * math.sin(3 * a + seed + i * .15) + .1 * math.sin(5 * a + i * .3))
            pts.append(f'{cx + rr * 1.5 * math.cos(a):.1f},{cy + rr * math.sin(a):.1f}')
        out.append(f'<polygon points="{" ".join(pts)}"/>')
    return f'<svg width="{w}" height="{h}" viewBox="0 0 {w} {h}" fill="none" stroke="{color}" stroke-width="1.3" opacity="{op}" style="position:absolute;inset:0" aria-hidden="true">{"".join(out)}</svg>'

ICONS = {
 'battery': '<rect x="6" y="14" width="32" height="20" rx="5"/><path d="M42 21v6"/><path d="M23 18l-4 6h6l-4 6"/>',
 'hub': '<circle cx="24" cy="24" r="16"/><circle cx="24" cy="24" r="5"/><path d="M24 8v11M24 29v11M8 24h11M29 24h11"/>',
 'wheel': '<circle cx="24" cy="24" r="17"/><circle cx="24" cy="24" r="3"/><path d="M24 7v14M24 27v14M7 24h14M27 24h14M12 12l10 10M26 26l10 10"/>',
 'route': '<circle cx="11" cy="37" r="4"/><circle cx="37" cy="11" r="4"/><path d="M15 37h12a7 7 0 0 0 0-14h-6a7 7 0 0 1 0-14h12"/>',
 'lock': '<rect x="10" y="21" width="28" height="20" rx="5"/><path d="M16 21v-5a8 8 0 0 1 16 0v5M24 29v5"/>',
 'helmet': '<path d="M8 30a16 16 0 0 1 32 0z"/><path d="M8 30v6h14M30 22h10"/>',
 'wrench': '<path d="M31 6a9 9 0 0 0-8 12L8 33a4 4 0 0 0 7 7l15-15a9 9 0 0 0 12-8l-6 5-6-2-2-6 5-6z"/>',
 'snow': '<path d="M24 6v36M8.4 15l31.2 18M8.4 33l31.2-18"/><path d="M19 9l5 4 5-4M19 39l5-4 5 4"/>',
 'pin': '<path d="M24 43s14-12 14-24a14 14 0 0 0-28 0c0 12 14 24 14 24z"/><circle cx="24" cy="19" r="5"/>',
 'shield': '<path d="M24 6l14 5v11c0 10-6 16-14 20-8-4-14-10-14-20V11z"/><path d="M18 24l5 5 8-9"/>',
 'bolt': '<path d="M27 5L10 27h12l-2 16 18-23H26z"/>',
 'play': '<circle cx="24" cy="24" r="17"/><path d="M20 16l13 8-13 8z"/>'}
ICON_RU = {'battery': 'батарея', 'hub': 'мотор', 'wheel': 'колесо', 'route': 'маршрут', 'lock': 'замок', 'helmet': 'шлем', 'wrench': 'сервис', 'snow': 'snow', 'pin': 'шоурум', 'shield': 'гарантия', 'bolt': 'заряд', 'play': 'видео'}
def icon(n, s=56, c=PINE, sw=3):
    return f'<svg width="{s}" height="{s}" viewBox="0 0 48 48" fill="none" stroke="{c}" stroke-width="{sw}" stroke-linecap="round" stroke-linejoin="round">{ICONS[n]}</svg>'

def ph(cap, cls='s1', style=''):
    return f'<figure class="ph {cls}" style="{style}"><figcaption>photo placeholder: {cap}</figcaption></figure>'

def browser(img, w=1080, label=''):
    return f'<div class="br"><div class="bar"><i></i><i></i><i></i><span>hush.bike (макет)</span></div><img src="{img}" alt="{label}"></div>'

# ---------- frames (each is a fixed-size div) ----------
FR = []  # (id, title, w, h, html, bg)
def frame(fid, title, w, h, html, cls=''):
    FR.append(dict(id=fid, title=title, w=w, h=h, html=html, cls=cls))

# 01 cover
frame('cover', 'Cover', 1080, 600, f'''
 {hush_lines(1080, 600, 30, 70, .5, '#E8EDEA', 1.3, .22)}
 <div class="abs" style="left:64px;top:56px" class="mono">{'<span class="mono lt">Brand board v2 / 2026</span>'}</div>
 <div class="abs" style="left:64px;top:210px">{logo(560, FOG)}</div>
 <div class="abs" style="left:64px;bottom:64px;right:64px;display:flex;justify-content:space-between;align-items:flex-end"><div class="d" style="font-size:44px;color:{FOG};max-width:520px;line-height:1.02">Тихий ход,<br>громкий характер</div><div class="mono lt" style="text-align:right">электро / ATV / UTV / снег<br>Москва · Ростов-на-Дону · Краснодарский край</div></div>
 <span class="sticker v abs" style="right:70px;top:60px">drop 01</span>''', 'pine')

# 02 idea
frame('idea', 'Идея и позиционирование', 1080, 600, f'''
 <div class="pad"><span class="mono mo">[02] идея бренда</span>
 <div class="d" style="font-size:38px;margin:12px 0 18px;max-width:940px">Hush – это звук, которого нет. Мотор молчит, а характер слышно.</div>
 <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:16px;margin-bottom:22px">
  <div class="card3"><b>01 Тишина</b><p>Плавный электроход, без рева. Город и двор принимают.</p></div>
  <div class="card3"><b>02 Доверие</b><p>Родитель видит сервис, гарантию и понятную цену.</p></div>
  <div class="card3 em"><b>03 Энергия</b><p>Внутри драйв: кастом, трюки, заезды, видео своими.</p></div></div>
 <div style="display:grid;grid-template-columns:1fr 360px;gap:24px;align-items:center">
  <div class="mono" style="line-height:1.9;color:{MOSS}">Позиция: чистый светлый каркас для взрослых плюс скорость, кастом и UGC для подростков. Один продукт на экран. Короткие уверенные фразы. Баланс 50 на 50.</div>
  <svg width="360" height="190" viewBox="0 0 360 190"><rect x="1" y="1" width="358" height="188" rx="14" fill="none" stroke="{PINE}" stroke-opacity=".3"/><path d="M180 12V178M12 95H348" stroke="{PINE}" stroke-opacity=".25"/><text x="180" y="28" text-anchor="middle" class="sv">для взрослых</text><text x="180" y="178" text-anchor="middle" class="sv">для подростков</text><text x="22" y="90" class="sv">спокойно</text><text x="338" y="90" text-anchor="end" class="sv">быстро</text><circle cx="180" cy="95" r="34" fill="{EMBER}" fill-opacity=".25" stroke="{EMBER}" stroke-width="2.5"/><text x="180" y="100" text-anchor="middle" font-family="Unbounded" font-weight="700" font-size="15" fill="{PINE}">hush</text></svg></div></div>''')

VOICE = {
 'ty': dict(h='Тихо едет. Громко чувствуется.', p='Собери свой, покрути в 3D и приезжай на тест-драйв.', cta='Погнали', err='Номер не похож на телефон. Проверь цифры.', push='Твой Trail pro собран. Забирай в субботу.', trust='Сломал на трюке – чиним быстро, без допросов.', rules=['на ты, коротко', 'сленг в меру: drop, roost, кастом', 'без нравоучений и без запугивания']),
 'vy': dict(h='Тихий ход. Спокойный дом.', p='Подберем модель вместе и поедем на тест-драйв вместе с вашим ребенком.', cta='Записаться', err='Телефон введен не полностью. Проверьте, пожалуйста, цифры.', push='Ваш Trail pro готов. Ждем вас в субботу в шоуруме.', trust='24 месяца гарантии, сервис в Ростове, понятные цены.', rules=['на вы, спокойно, по делу', 'объясняем, не давим', 'цифры и сроки до оплаты'])}
def voice_frame(k):
    v = VOICE[k]; dark = (k == 'ty')
    return f'''<div class="pad"><span class="mono mo">[03] режим голоса / {"ты (подростки)" if k=="ty" else "вы (родители)"}</span>
 <div class="d" style="font-size:54px;margin:16px 0 20px;line-height:1">{v["h"]}</div>
 <p style="font-size:21px;max-width:760px;margin-bottom:22px">{v["p"]}</p>
 <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:18px">
  <div class="mini"><span class="mono">кнопка</span><div style="justify-self:start" class="btn {"e" if k=="ty" else "k"}">{v["cta"]}</div></div>
  <div class="mini"><span class="mono">ошибка в форме</span><p>{v["err"]}</p></div>
  <div class="mini"><span class="mono">уведомление</span><p>{v["push"]}</p></div>
  <div class="mini"><span class="mono">блок доверия</span><p>{v["trust"]}</p></div></div>
 <div class="mono" style="line-height:1.8">{" / ".join(v["rules"])}</div></div>'''
frame('voice-ty', 'Режим голоса: ты', 1080, 600, voice_frame('ty'), 'lichen')
frame('voice-vy', 'Режим голоса: вы', 1080, 600, voice_frame('vy'))

# 04 logo main + clear space
frame('logo', 'Логотип: основной и поля', 1080, 600, f'''
 <div class="pad"><span class="mono mo">[04] логотип / основной</span>
 <div style="display:grid;grid-template-columns:1.25fr 1fr;gap:28px;margin-top:14px">
  <div style="position:relative;height:300px;border:1.5px dashed {PINE}55;border-radius:14px;display:grid;place-items:center;background:{PAPER}">
    <div style="position:relative">{logo(420)}<div class="cs" style="inset:-38px"></div></div>
    <span class="mono" style="position:absolute;left:14px;bottom:10px;color:{MOSS}">поля = ширине одной стойки знака (x)</span></div>
  <div style="display:grid;gap:14px;align-content:start"><div class="mini" style="display:flex;gap:22px;align-items:center">{mark(86)}<div><b class="d" style="font-size:20px">Знак</b><p>Две стойки H и волна, которая затихает в ровную линию.</p></div></div>
   <div class="mini" style="display:flex;gap:22px;align-items:center"><div style="width:86px;height:86px;border-radius:20px;background:{PINE};display:grid;place-items:center">{mark(62, FOG)}</div><div><b class="d" style="font-size:20px">App-иконка</b><p>Знак на pine, волна ember.</p></div></div></div></div>
 <div style="display:flex;gap:30px;margin-top:20px" class="mono"><span>мин. ширина логотипа: 96 px / 24 мм</span><span>мин. знак: 24 px</span><span>файл: logo/*.svg</span></div></div>''')

# 05 mono
frame('logo-mono', 'Логотип: монохром и анимация', 1080, 600, f'''
 <div class="pad"><span class="mono mo">[04.1] монохром</span>
 <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin:14px 0">
  <div class="tile" style="background:{FOG};border:1.5px solid {PINE}33">{logo(300)}<span class="mono">монохром темный (pine на светлом)</span></div>
  <div class="tile" style="background:{PINE}">{logo(300, FOG)}<span class="mono lt">монохром светлый (fog на pine)</span></div>
  <div class="tile" style="background:{EMBER}">{logo(300, PINE)}<span class="mono" style="color:{PINE}">на ember: только pine</span></div>
  <div class="tile" style="background:{LICHEN}">{logo(300)}<span class="mono">на lichen: pine</span></div></div>
 <div class="mono" style="display:flex;gap:20px;align-items:center"><svg width="44" height="44" viewBox="0 0 120 120" fill="none" stroke="{EMBER}" stroke-width="9" stroke-linecap="round"><path d="M16 60C28 20 44 20 54 60C60 88 70 88 76 60C79 50 84 54 88 60L104 60"><animate attributeName="d" dur="3s" repeatCount="indefinite" values="M16 60C28 20 44 20 54 60C60 88 70 88 76 60C79 50 84 54 88 60L104 60;M16 60C28 56 44 56 54 60C60 64 70 64 76 60C79 58 84 58 88 60L104 60;M16 60C28 20 44 20 54 60C60 88 70 88 76 60C79 50 84 54 88 60L104 60"/></path></svg>анимированный знак: волна затихает за 3 с (logo/hush-mark-animated.svg)</div></div>''')

# 06 don'ts
def dont(inner, cap):
    return f'<div class="dn"><div class="dnb">{inner}<i class="x"></i></div><span class="mono">{cap}</span></div>'
frame('logo-dont', 'Логотип: запреты', 1080, 600, f'''
 <div class="pad"><span class="mono mo">[04.2] запреты</span>
 <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin-top:14px">
 {dont(f'<div style="transform:scaleX(1.5)">{logo(190)}</div>','не растягивать')}
 {dont(f'<div style="transform:rotate(-14deg)">{logo(230)}</div>','не вращать')}
 {dont(logo(230, "#3B82F6"), 'не менять цвет букв')}
 {dont(f'<div style="filter:drop-shadow(6px 8px 0 #0008)">{logo(230)}</div>','не добавлять тень')}
 {dont(f'<div style="background:linear-gradient(90deg,#7C4DFF,#3B82F6);padding:16px;border-radius:10px">{logo(200)}</div>','не ставить на градиент')}
 {dont(f'<div style="font:700 44px Unbounded;color:{PINE};letter-spacing:-.03em">HUSH</div>','не заменять шрифтом')}
 </div></div>''')

# 07 colors
cols = [('Fog', FOG, 'фон', PINE), ('Paper', PAPER, 'поверхности', PINE), ('Pine', PINE, 'текст, темные блоки', FOG), ('Moss', MOSS, 'вторичный текст', FOG), ('Lichen', LICHEN, 'подложки', PINE), ('Ember', EMBER, 'энергия, заливки', PINE), ('Ember ink', EMBER_INK, 'ember для текста', FOG), ('Violet', VIOLET, 'кастом-акцент', '#FFFFFF')]
sw = ''.join(f'<div class="sw" style="background:{c[1]};color:{c[3]};{"border:1.5px solid #0F1A1633" if c[0] in ("Paper","Fog") else ""}"><b class="d">{c[0]}</b><span class="mono" style="color:inherit">{c[1]}</span><small>{c[2]}</small><em class="mono" style="color:inherit">{cr(c[1], c[3]):.1f}:1</em></div>' for c in cols)
pairs = [('Pine на Fog', PINE, FOG), ('Moss на Fog', MOSS, FOG), ('Pine на Ember', PINE, EMBER), ('Ember на Pine', EMBER, PINE), ('Ember ink на Fog', EMBER_INK, FOG), ('Fog на Pine', FOG, PINE)]
pr = ''.join(f'<div class="pairc" style="background:{b};color:{a}"><b>Aa</b><span class="mono" style="color:inherit">{n}<br>{cr(a, b):.1f}:1 {"AAA" if cr(a,b)>=7 else "AA" if cr(a,b)>=4.5 else "крупный текст"}</span></div>' for n, a, b in pairs)
frame('colors', 'Цвета', 1080, 600, f'''<div class="pad"><span class="mono mo">[05] цвета, HEX и контраст</span>
 <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin:14px 0">{sw}</div>
 <div class="mono mo" style="margin-bottom:8px">пары для текста (WCAG)</div><div style="display:grid;grid-template-columns:repeat(6,1fr);gap:8px">{pr}</div>
 <p class="mono" style="margin-top:12px;color:{MOSS}">Ember на светлом только для заливок и крупного текста. Для мелкого текста: Ember ink.</p></div>''')

# 08 fonts
frame('fonts', 'Шрифты', 1080, 600, f'''<div class="pad"><span class="mono mo">[06] шрифты и иерархия</span>
 <div style="display:grid;grid-template-columns:1.2fr 1fr;gap:28px;margin-top:12px">
  <div><div class="d" style="font-size:76px;line-height:.95">Тихо.<br>Быстро.</div><div class="mono" style="margin:10px 0 18px;color:{MOSS}">Unbounded 600 / заголовки, цены, акценты. -3.5% трекинг</div>
  <div style="font-size:22px;line-height:1.35;max-width:430px">Onest 400 / текст и интерфейс. Читается на телефоне, кириллица родная.</div><div class="mono" style="margin-top:14px;color:{MOSS}">Onest 400-700 / 17 px, межстрочный 1.5</div>
  <div class="mono" style="margin-top:22px;font-size:15px;letter-spacing:.06em">JETBRAINS MONO 400/600 / 01 ПОДПИСИ, МЕТКИ, ЦИФРЫ</div></div>
  <div class="hier"><div><span class="mono">display</span><b class="d" style="font-size:44px">Hush</b></div><div><span class="mono">h2</span><b class="d" style="font-size:30px">lite / pro / ultra</b></div><div><span class="mono">h3</span><b class="d" style="font-size:20px">Собери свой</b></div><div><span class="mono">body</span><span style="font-size:17px">Цвет, контроллер, батарея</span></div><div><span class="mono">label</span><span class="mono">[02] ЛИНЕЙКА · ~95 КМ</span></div></div></div>
 <div class="mono" style="margin-top:18px;color:{MOSS}">Шрифты встроены локально (woff2, @fontsource), кириллица обязательна.</div></div>''')

# 09 photo
frame('photo', 'Фото-направление', 1080, 600, f'''<div class="pad"><span class="mono mo">[07] фото-направление / реальных фото пока нет</span>
 <div style="display:grid;grid-template-columns:1.1fr 1fr 1fr;grid-template-rows:200px 200px;gap:10px;margin:12px 0">
  {ph('лес после дождя, матовый черный байк, фиолетовые грипсы, естественный свет, камера на уровне колена','s1','grid-row:span 2')}
  {ph('песок, багги в движении, облако пыли, подростки в обычной одежде','s4')}
  {ph('двор утром, подросток катит байк, длинная тень','s3')}
  {ph('макро: руль, фиолетовые грипсы, царапина на раме','s2')}
  {ph('гараж, руки с ключом, батарея на верстаке','s3')}</div>
 <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px" class="mono"><div style="line-height:1.8">+ документальная съемка, естественный свет<br>+ матовые черные байки, фиолетовые детали руля<br>+ подростки в обычной одежде, лес, песок, двор</div><div style="line-height:1.8;color:{EMBER_INK}">- студия, глянец, постановочные улыбки<br>- ретушь, HDR, неон<br>- шлемы без людей, байк без контекста</div></div></div>''')

# 10 patterns
frame('patterns', 'Графические элементы и паттерны', 1080, 600, f'''<div class="pad"><span class="mono mo">[08] графика</span>
 <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;margin:12px 0">
  <div class="tile2" style="background:{FOG};border:1.5px solid {PINE}33">{hush_lines(300, 190, 14, 22, .5, PINE, 1.3, .6)}<span class="mono cap">hush lines: волна затихает слева направо</span></div>
  <div class="tile2" style="background:{LICHEN}">{contour(300, 190, PINE, .45)}<span class="mono cap">contour: звуковое поле, фон для шейдера</span></div>
  <div class="tile2" style="background:{PINE}"><div class="cut"></div><span class="mono cap lt">diagonal cut: срез 44 px у карточек</span></div></div>
 <div style="display:flex;gap:16px;align-items:center;flex-wrap:wrap;margin:18px 0"><span class="sticker v">drop</span><span class="sticker e">custom</span><span class="sticker v" style="transform:rotate(5deg)">roost</span><span class="proto">прототип</span><span class="chip">lite</span><span class="chip on">pro</span><span class="chip">ultra</span><span class="mono tagm">батарея в раме</span></div>
 <div class="mono" style="line-height:1.8;color:{MOSS}">Стикеры наклонены на 3-5 градусов, как наклейки на раме. Моно-метки с индексом [01]. Диагональный срез в правом верхнем углу карточек. Пунктирный бордер для прототипов.</div></div>''')

# 11 icons
ic = ''.join(f'<div class="ico">{icon(n, 56)}<span class="mono">{ICON_RU[n]}</span></div>' for n in ICONS)
frame('icons', 'Иконки', 1080, 600, f'''<div class="pad"><span class="mono mo">[09] иконки / 48 px сетка, линия 3 px, круглые концы</span>
 <div style="display:grid;grid-template-columns:repeat(6,1fr);gap:12px;margin:16px 0">{ic}</div>
 <div style="display:flex;gap:22px;align-items:center"><div class="ico on">{icon("bolt", 56, EMBER)}<span class="mono" style="color:inherit">акцент ember</span></div><div class="ico dk">{icon("shield", 56, FOG)}<span class="mono lt">на pine</span></div><div class="mono" style="color:{MOSS};max-width:480px;line-height:1.7">Один вес линии, один радиус скругления. Заливок нет. Цвет: pine, на темном fog, акцент один ember.</div></div></div>''')

# 12 UI
frame('ui', 'UI-компоненты', 1080, 600, f'''<div class="pad"><span class="mono mo">[10] ui-компоненты</span>
 <div style="display:flex;gap:12px;flex-wrap:wrap;margin:14px 0"><div class="btn e">В корзину</div><div class="btn k">Оформить заказ</div><div class="btn g">Тест-драйв</div><div class="btn k sm">Назад</div></div>
 <div style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:14px"><span class="chip">Город</span><span class="chip on">Эндуро</span><span class="chip">Багги</span><span class="chip">Квадрик</span><div class="vt2"><b>ты</b><span>вы</span></div><div class="qty2"><span>-</span><b>2</b><span>+</span></div></div>
 <div style="display:grid;grid-template-columns:300px 1fr 1fr;gap:16px;align-items:start">
  <div class="tcard"><span class="mono">02 / Эндуро</span><img src="assets/bike-enduro.png" alt=""><b class="d">Trail <i>pro</i></b><div class="mono">~80 км · 70 км/ч · 54 кг</div><div class="d" style="font-size:22px;margin-top:6px">от 219 900 ₽</div><span class="sticker v" style="position:absolute;right:46px;top:14px">выбор</span></div>
  <div style="display:grid;gap:10px"><div class="inp"><span class="mono">Имя</span><div>Алекс</div></div><div class="inp err"><span class="mono">Телефон</span><div>+7 912 3</div><em>Проверь цифры</em></div><div class="opt2"><span class="mono">Рама</span><div style="display:flex;gap:8px"><i style="background:#14191A" class="on"></i><i style="background:#3A4442"></i><i style="background:#52695C"></i><i style="background:#C9D3CE"></i><i style="background:{EMBER}"></i></div></div></div>
  <div style="display:grid;gap:10px"><div class="inp"><span class="mono">Модель</span><div>Trail pro ▾</div></div><div class="rb"><span class="mono">Запас хода ~108 км</span><div><i style="width:52%"></i></div></div><div class="focus mono">фокус: 3 px violet</div></div></div></div>''')

# 13 motion
frame('motion', 'Motion-принципы', 1080, 600, f'''<div class="pad"><span class="mono mo">[11] motion / тихо, но с рывком</span>
 <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin:14px 0">
  <div class="card3"><b>Сборка</b><p>Байк собирается из деталей при скролле (GSAP ScrollTrigger, scrub 0.6 с). Кульминация: все 100%.</p></div>
  <div class="card3"><b>Шейдер</b><p>Фон hero: контуры звукового поля (WebGL2, fbm), реагируют на курсор. Медленно, 0.05x.</p></div>
  <div class="card3"><b>Курсор</b><p>Точка ember, на плитках превращается в фиолетовую метку play / выбрать.</p></div>
  <div class="card3 em"><b>Reduce</b><p>prefers-reduced-motion: шейдер выкл, байк собран, переходы мгновенные.</p></div></div>
 <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;align-items:center"><svg width="440" height="190" viewBox="0 0 440 190"><rect x="1" y="1" width="438" height="188" rx="14" fill="{PAPER}" stroke="{PINE}" stroke-opacity=".25"/><path d="M30 160C30 160 30 160 30 160M30 160C 150 160 150 30 250 30" fill="none" stroke="none"/><path d="M40 160 C 120 160, 140 30, 230 30 S 330 30 400 30" fill="none" stroke="{EMBER}" stroke-width="4" stroke-linecap="round"/><path d="M40 160H400" stroke="{PINE}" stroke-opacity=".25"/><text x="40" y="180" class="sv">cubic-bezier(.2,.8,.2,1)</text><text x="150" y="22" class="sv">быстрый старт, мягкая посадка</text></svg>
 <div class="mono" style="line-height:2">fast 250 мс: кнопки, чипы<br>base 600 мс: карточки, появление<br>slow 1200 мс: вход, срезы, сборка<br>ease-out, без bounce, кроме счетчика корзины</div></div></div>''')

# 14 showroom
frame('showroom', 'Применение: шоурум в Ростове', 1080, 600, f'''
 <svg width="1080" height="600" viewBox="0 0 1080 600" style="position:absolute;inset:0"><rect width="1080" height="600" fill="{LICHEN}"/><rect x="0" y="470" width="1080" height="130" fill="#AEBBB2"/>
 <rect x="80" y="70" width="920" height="420" fill="{PINE}"/><rect x="80" y="70" width="920" height="110" fill="{PINE}"/><rect x="80" y="180" width="920" height="310" fill="#1C2A25"/>
 <rect x="120" y="205" width="520" height="265" fill="#E8EDEA" opacity=".92"/><rect x="660" y="205" width="300" height="265" fill="#E8EDEA" opacity=".92"/><path d="M640 205V470" stroke="{PINE}" stroke-width="6"/>
 <ellipse cx="260" cy="446" rx="110" ry="14" fill="{PINE}"/><ellipse cx="500" cy="446" rx="110" ry="14" fill="{PINE}"/>
 <image href="assets/bike-city.png" x="150" y="300" width="220" height="143"/><image href="assets/bike-enduro.png" x="390" y="292" width="220" height="143"/>
 <rect x="690" y="226" width="240" height="120" fill="{PINE}"/><g transform="translate(722 246)">{mark(80, FOG).replace('<svg','<svg x="0"')}</g><path d="M830 286h80" stroke="{EMBER}" stroke-width="6" stroke-linecap="round"/>
 <g transform="translate(110 96) scale(.9)" style="--lg-ink:{FOG}"><use href="#lg" x="0" y="0" width="360" height="108"/></g>
 <text x="940" y="150" text-anchor="end" font-family="JetBrains Mono" font-size="16" fill="{FOG}" letter-spacing="2">РОСТОВ-НА-ДОНУ / ШОУРУМ</text><text x="940" y="125" text-anchor="end" font-family="JetBrains Mono" font-size="16" fill="{EMBER}" letter-spacing="2">ТЕСТ-ДРАЙВ ЕЖЕДНЕВНО</text>
 <rect x="1010" y="70" width="40" height="300" fill="{EMBER}"/><text transform="translate(1038 350) rotate(-90)" font-family="Unbounded" font-weight="700" font-size="26" fill="{PINE}">hush</text></svg>
 <span class="mono abs lt" style="left:24px;bottom:20px;color:{PINE}">фасад: pine, вывеска fog, стойка ember. Зал: подиумы, свет-линии, стена кастома. Адрес и фото шоурума: заглушка.</span>''', 'noborder')

# 15 livery + packaging
frame('livery', 'Применение: ливрея и упаковка', 1080, 600, f'''<div class="pad"><span class="mono mo">[12] ливрея и упаковка</span>
 <div style="display:grid;grid-template-columns:1.3fr 1fr;gap:20px;margin-top:6px">
 <div style="position:relative;height:430px;background:{FOG};border-radius:14px;border:1.5px solid {PINE}22"><img src="assets/bike-enduro-side.png" style="position:absolute;left:10px;top:30px;width:560px" alt="">
  <div class="co" style="left:76px;top:300px">грипсы violet<i></i></div><div class="co" style="left:300px;top:60px">плашка 01<i></i></div><div class="co" style="left:430px;top:330px">стикер: волна<i></i></div><div class="co" style="left:60px;top:90px">рама: матовый pine<i></i></div>
  <span class="mono" style="position:absolute;left:16px;bottom:12px;color:{MOSS}">рама матовая, акценты руля violet, номер модели на раме</span></div>
 <div style="position:relative;height:430px;background:{PINE};border-radius:14px;display:grid;place-items:center">{hush_lines(300, 430, 18, 30, .5, FOG, 1.2, .25)}
  <div style="position:relative;width:250px;height:300px;background:{PINE};border:2px solid {FOG}55;display:grid;place-items:center;align-content:center;gap:18px;border-radius:6px"><div>{logo(190, FOG)}</div><div class="mono lt" style="text-align:center;line-height:1.8">Trail pro<br>S/N H-0000</div><div style="width:90px;height:8px;background:{EMBER};border-radius:8px"></div></div></div></div></div>''')

# 16 social + card
frame('social', 'Применение: соцсети и визитка', 1080, 600, f'''<div class="pad"><span class="mono mo">[13] соцсети и визитка</span>
 <div style="display:grid;grid-template-columns:200px 200px 200px 1fr;grid-template-rows:200px 200px;gap:14px;margin-top:12px">
  <div class="post">{ph('заезд по лесу, камера на руле','s1','position:absolute;inset:0;border-radius:0')}<span class="sticker v" style="position:absolute;left:12px;top:14px">drop 03</span></div>
  <div class="post" style="background:{EMBER}"><div class="d" style="font-size:21px;padding:16px;color:{PINE};line-height:1.05">Тихо едет.<br>Громко<br>чувствуется.</div><div style="position:absolute;left:14px;bottom:14px">{logo(110)}</div></div>
  <div class="post" style="background:{PINE};color:{FOG}"><div class="mono" style="padding:16px;line-height:1.7;color:{FOG};font-size:12px">TRAIL PRO<br>~80 км · 70 км/ч</div><img src="assets/bike-enduro.png" style="position:absolute;left:0;bottom:0;width:200px" alt=""></div>
  <div class="story" style="grid-row:span 2;height:414px">{ph('история: сборка кастома, руки, фиолетовые грипсы','s2','position:absolute;inset:0;border-radius:0')}<span class="sticker e" style="position:absolute;left:12px;top:14px">custom</span></div>
  <div style="grid-column:span 3;display:flex;gap:16px;align-items:center"><div class="vcard" style="background:{PINE}">{logo(180, FOG)}<div style="height:6px;width:60px;background:{EMBER};border-radius:6px;margin-top:20px"></div></div><div class="vcard" style="background:{FOG};border:1.5px solid {PINE}33"><b class="d" style="font-size:18px">Имя Фамилия</b><span class="mono" style="font-size:11px">менеджер, Ростов-на-Дону</span><span class="mono" style="margin-top:12px;font-size:11px">+7 000 000-00-00 (заглушка)<br>hush.bike (макет)</span></div></div></div></div>''')

# screens
def scr(fid, title, img, note, w=1080, h=720):
    frame(fid, title, w, h, f'<div style="position:absolute;inset:0">{browser(img)}</div><span class="mono abs note">{note}</span>', 'noborder')
scr('s-gate', 'Сайт: вход (1440)', 'shots/d-gate.png', 'вход: выбор направления и привода')
scr('s-hero', 'Сайт: hero и сборка (1440)', 'shots/d-hero1.png', 'hero: шейдер и байк, собранный при скролле')
scr('s-line', 'Сайт: линейка (1440)', 'shots/d-line.png', 'линейка lite / pro / ultra')
scr('s-3d', 'Сайт: 3D и AR (1440)', 'shots/d-viewer.png', '3D-прототип и AR-заглушка')
scr('s-cfg', 'Сайт: конфигуратор (1440)', 'shots/d-config.png', 'конфигуратор: цвет, контроллер, батарея')
scr('s-media', 'Сайт: медиа (1440)', 'shots/d-media.png', 'медиа: видео-плитки и каналы')
scr('s-tour', 'Сайт: тур по шоуруму (1440)', 'shots/d-tour.png', '3D-тур по шоуруму (прототип)')
scr('s-drive', 'Сайт: тест-драйв (1440)', 'shots/d-drive.png', 'запись на тест-драйв')
scr('s-cart', 'Сайт: корзина (1440)', 'shots/d-cart.png', 'корзина-drawer')
frame('s-mobile', 'Сайт: мобильная версия (390)', 2220, 720, f'''<div style="position:absolute;inset:0;background:{PINE};display:flex;gap:28px;padding:40px 48px;align-items:flex-start">
 {''.join(f'<div class="ph2"><img src="shots/{n}.png" alt=""><span class="mono lt">{c}</span></div>' for n, c in [('m-gate','вход'),('m-hero1','hero'),('m-line','линейка'),('m-config','конфигуратор'),('m-media','медиа')])}</div>''', 'noborder')

# ---------- css ----------
FONTS = ''.join(re.findall(r'@font-face\{[^}]*\}', open(os.path.join(ROOT, 'site/assets/hush.css'), encoding='utf8').read()))
FONTS = FONTS.replace('url(fonts/', 'url(../site/assets/fonts/')
CSS = FONTS + f'''
*{{box-sizing:border-box;margin:0}}
body{{font:400 17px/1.45 Onest,sans-serif;color:{PINE};background:#D5DAD7}}
.d{{font-family:Unbounded,Onest,sans-serif;font-weight:600;letter-spacing:-.035em}}
.mono{{font-family:"JetBrains Mono",monospace;font-size:13px;letter-spacing:.06em;text-transform:uppercase}}
.mo{{color:{MOSS}}}.lt{{color:{FOG}}}
.fr{{position:absolute;background:{PAPER};overflow:hidden;box-shadow:0 1px 0 #0001,0 14px 40px #0F1A1622;border-radius:4px;color:{PINE}}}
.fr.pine{{background:{PINE};color:{FOG}}}.fr.lichen{{background:{LICHEN}}}.fr.noborder{{background:{PINE}}}
.fr.pine .mo,.fr.pine .mono{{color:{FOG}}}
.fl{{position:absolute;font:500 22px "JetBrains Mono",monospace;color:#5C6A63;letter-spacing:.02em;white-space:nowrap}}
.fl b{{color:{PINE};font-weight:600;margin-right:12px}}
.abs{{position:absolute}}.pad{{padding:40px 48px;position:relative;height:100%}}
.note{{left:20px;bottom:14px;color:{FOG};background:#0F1A16cc;padding:6px 10px;border-radius:6px}}
.sv{{font:500 11px "JetBrains Mono";fill:{MOSS};letter-spacing:.05em}}
.sticker{{display:inline-block;padding:8px 13px;border-radius:8px;background:{VIOLET};color:#fff;font:600 13px "JetBrains Mono";letter-spacing:.06em;text-transform:uppercase;transform:rotate(-4deg)}}
.sticker.e{{background:{EMBER};color:{PINE};transform:rotate(3deg)}}.sticker.v{{background:{VIOLET}}}
.proto{{display:inline-flex;gap:8px;align-items:center;border:1.5px dashed {PINE};padding:5px 12px;border-radius:99px;font:600 12px "JetBrains Mono";text-transform:uppercase}}
.chip{{padding:9px 16px;border-radius:99px;border:1.5px solid {PINE};font:600 14px Onest}}.chip.on{{background:{PINE};color:{FOG}}}
.btn{{display:inline-block;padding:14px 24px;border-radius:99px;font:600 15px Onest}}.btn.e{{background:{EMBER};color:{PINE}}}.btn.k{{background:{PINE};color:{FOG}}}.btn.g{{border:1.5px solid {PINE}}}.btn.sm{{padding:10px 16px;font-size:13px}}
.card3{{background:{PAPER};border:1.5px solid {PINE}22;border-radius:14px;padding:16px 18px;min-height:128px}}.card3 b{{font:600 16px Unbounded;letter-spacing:-.02em;display:block;margin-bottom:8px}}.card3 p{{font-size:15px;line-height:1.4;color:{MOSS}}}
.card3.em{{background:{EMBER};border-color:{EMBER}}}.card3.em p{{color:{PINE}}}
.fr.lichen .card3,.fr.lichen .mini{{background:{PAPER}}}
.mini{{background:{FOG};border-radius:12px;padding:14px 16px;display:grid;gap:8px;align-content:start}}.mini p{{font-size:17px}}.mini .mono{{color:{MOSS};font-size:11px}}
.tile{{height:100px;border-radius:12px;display:grid;place-items:center;align-content:center;gap:8px}}
.tile2{{position:relative;height:190px;border-radius:12px;overflow:hidden}}.tile2 .cap{{position:absolute;left:12px;bottom:10px;font-size:11px;color:{PINE}}}.tile2 .cap.lt{{color:{FOG}}}
.cut{{position:absolute;left:30px;top:26px;right:30px;bottom:54px;background:{FOG};clip-path:polygon(0 0,calc(100% - 44px) 0,100% 44px,100% 100%,0 100%)}}
.cs{{position:absolute;border:1.5px dashed {EMBER_INK}}}
.dn{{display:grid;gap:8px}}.dnb{{position:relative;height:130px;background:{FOG};border-radius:12px;display:grid;place-items:center;overflow:hidden}}.dn .mono{{font-size:11px;color:{MOSS}}}
.x{{position:absolute;right:10px;top:10px;width:26px;height:26px;border-radius:50%;background:{EMBER}}}.x:before,.x:after{{content:"";position:absolute;left:12px;top:6px;width:2px;height:14px;background:{PINE};transform:rotate(45deg)}}.x:after{{transform:rotate(-45deg)}}
.sw{{height:132px;border-radius:12px;padding:12px;display:grid;align-content:space-between}}.sw b{{font-size:17px}}.sw small{{font-size:12px;opacity:.9}}.sw em{{font-style:normal;font-size:11px}}
.pairc{{border-radius:10px;padding:10px;display:grid;gap:4px;border:1.5px solid {PINE}22}}.pairc b{{font:700 26px Unbounded}}.pairc .mono{{font-size:10px;line-height:1.35}}
.hier{{display:grid;gap:10px;align-content:start}}.hier>div{{display:grid;grid-template-columns:70px 1fr;align-items:baseline;border-bottom:1px solid {PINE}22;padding-bottom:8px}}.hier .mono{{font-size:11px;color:{MOSS}}}
.ph{{position:relative;border-radius:10px;overflow:hidden;background:radial-gradient(120% 90% at var(--gx,70%) var(--gy,30%),color-mix(in srgb,var(--glow,#FF4B1F) 55%,transparent),transparent 55%),linear-gradient(160deg,var(--c1,#51655b),var(--c2,#1a2822) 70%)}}
.ph:after{{content:"";position:absolute;left:0;right:0;bottom:0;height:50%;background:linear-gradient(transparent,#080e0bb3)}}
.ph figcaption{{position:absolute;left:12px;right:12px;bottom:10px;z-index:2;font:400 11px/1.35 "JetBrains Mono";color:#F2F6F3}}
.s1{{--c1:#6c7d5a;--c2:#18231c;--glow:#FF4B1F}}.s2{{--c1:#8a8f84;--c2:#26302b;--glow:#7C4DFF;--gx:25%}}.s3{{--c1:#5e6e6a;--c2:#101b17;--glow:#BFD0C2;--gy:60%}}.s4{{--c1:#9aa38a;--c2:#2b3a2f;--glow:#FF4B1F;--gx:30%;--gy:70%}}
.ico{{display:grid;justify-items:center;gap:8px;padding:14px 6px;border-radius:12px;background:{FOG}}}.ico .mono{{font-size:11px;color:{MOSS}}}.ico.on{{background:{PINE};color:{FOG}}}.ico.dk .mono,.ico.on .mono{{color:{FOG}}}.ico.dk{{background:{PINE}}}
.vt2{{display:flex;border:1.5px solid {PINE};border-radius:99px;padding:3px}}.vt2 b,.vt2 span{{padding:6px 14px;border-radius:99px;font:600 13px Onest}}.vt2 b{{background:{PINE};color:{FOG}}}
.qty2{{display:flex;align-items:center;gap:6px;border:1.5px solid {PINE};border-radius:99px;padding:4px 12px;font:600 14px "JetBrains Mono"}}
.tcard{{position:relative;background:{LICHEN};padding:16px;clip-path:polygon(0 0,calc(100% - 40px) 0,100% 40px,100% 100%,0 100%);display:grid;gap:4px}}.tcard img{{width:100%;margin:-4px 0}}.tcard b{{font-size:26px}}.tcard i{{font-style:normal;color:{EMBER_INK}}}
.inp{{background:{FOG};border:1.5px solid {PINE};border-radius:12px;padding:8px 12px;display:grid;gap:2px}}.inp .mono{{font-size:10px;color:{MOSS}}}.inp.err{{border-color:{EMBER_INK}}}.inp em{{font:600 12px Onest;color:{EMBER_INK};font-style:normal}}
.opt2{{display:grid;gap:6px}}.opt2 i{{width:34px;height:34px;border-radius:50%;border:2px solid #0F1A1633;display:block}}.opt2 i.on{{outline:3px solid {PINE};outline-offset:3px}}
.rb>div{{height:8px;background:{PINE}22;border-radius:8px;margin-top:6px}}.rb i{{display:block;height:100%;background:{EMBER};border-radius:8px}}.focus{{outline:3px solid {VIOLET};outline-offset:3px;border-radius:8px;padding:10px 12px;width:fit-content;font-size:11px}}
.co{{position:absolute;font:600 11px "JetBrains Mono";text-transform:uppercase;background:{PINE};color:{FOG};padding:5px 8px;border-radius:5px}}.co i{{position:absolute;left:50%;top:100%;width:1.5px;height:26px;background:{PINE}}}
.post{{position:relative;width:200px;height:200px;border-radius:6px;overflow:hidden;background:{FOG}}}.story{{position:relative;width:200px;height:355px;border-radius:12px;overflow:hidden;grid-row:span 2}}
.vcard{{width:300px;height:160px;border-radius:8px;padding:20px;display:grid;align-content:center;gap:6px;box-shadow:0 8px 24px #0F1A1622}}
.br{{position:absolute;inset:0;background:{PINE}}}.br .bar{{height:30px;background:#0b130f;display:flex;gap:7px;align-items:center;padding:0 12px}}.br .bar i{{width:10px;height:10px;border-radius:50%;background:#3b4a43}}.br .bar span{{margin-left:12px;font:11px "JetBrains Mono";color:#9fb0a7}}.br img{{display:block;width:100%;height:calc(100% - 30px);object-fit:cover;object-position:top}}
.ph2{{width:380px;display:grid;gap:12px;justify-items:center}}.ph2 img{{width:380px;height:auto;border-radius:34px;border:8px solid #000;display:block}}
'''

# ---------- board ----------
BOARD_LAYOUT = [
  ['cover', 'idea', 'voice-ty', 'voice-vy'],
  ['logo', 'logo-mono', 'logo-dont', 'colors'],
  ['fonts', 'photo', 'patterns', 'icons'],
  ['ui', 'motion', 'showroom', 'livery'],
  ['social', 's-gate', 's-hero', 's-line'],
  ['s-3d', 's-cfg', 's-media', 's-tour'],
  ['s-drive', 's-cart', 's-mobile'],
]
byid = {f['id']: f for f in FR}
GW, MX, GAP, TOP = 60, 150, 110, 260
y = TOP; placed = []; n = 0
for row in BOARD_LAYOUT:
    h = max(byid[i]['h'] for i in row); x = MX
    for fid in row:
        f = byid[fid]; n += 1
        placed.append((n, f, x, y)); x += f['w'] + GW
    y += h + GAP
CW, CH = 4800, y - GAP + 160
parts = []
for n, f, x, y0 in placed:
    parts.append(f'<div class="fl" style="left:{x}px;top:{y0-44}px"><b>{n:02d}</b>{f["title"]}</div><section class="fr {f["cls"]}" id="f-{f["id"]}" style="left:{x}px;top:{y0}px;width:{f["w"]}px;height:{f["h"]}px">{f["html"]}</section>')
grid = f'radial-gradient(#0F1A1626 2px,transparent 2.5px) 0 0/60px 60px'
board = f'''<!doctype html><html lang="ru"><head><meta charset="utf-8"><title>Hush board</title><style>{CSS}
html,body{{margin:0;width:{CW}px;height:{CH}px;overflow:hidden}}#canvas{{position:relative;width:{CW}px;height:{CH}px;background:{grid},#D5DAD7}}
</style></head><body>{SPRITE}<div id="canvas">
<div class="abs" style="left:{MX}px;top:70px">{logo(260)}</div>
<div class="abs d" style="left:{MX}px;top:150px;font-size:44px;letter-spacing:-.03em">Brand board v2: тихий ход, громкий характер</div>
<div class="abs mono" style="right:{MX}px;top:90px;font-size:20px;color:{MOSS};text-align:right">Hush / электро, ATV, UTV, снег<br>холст {CW} x {CH} / фреймы 1080 px / копируются в Figma как png</div>
{''.join(parts)}</div></body></html>'''
open(os.path.join(HERE, 'hush-board.html'), 'w', encoding='utf8').write(board)

# ---------- brandbook (A4 landscape) ----------
PW, PH = 1123, 794
NOTES = {
 'cover': 'Hush: электро, ATV, UTV и снег. Розница и опт. Москва, Ростов-на-Дону, Краснодарский край.',
 'idea': 'Три опоры: тишина, доверие, энергия. Каркас светлый и спокойный, но внутри есть скорость, кастом и видео. Один продукт на экран.',
 'logo': 'Знак: две стойки H и волна, затихающая в линию. Поля вокруг логотипа равны ширине стойки. Не ставить ниже 96 px по ширине.',
 'logo-mono': 'Монохром темный и светлый для печати, одноцветных наклеек и тиснения. На ember и lichen допустим только pine.',
 'logo-dont': 'Запреты: растягивать, вращать, перекрашивать, добавлять тень, ставить на градиент, заменять шрифтом.',
 'colors': 'Кислотных и неоновых цветов нет. Один теплый акцент ember для энергии и один violet для кастом-деталей. Для мелкого текста на светлом: Ember ink.',
 'fonts': 'Unbounded для заголовков, Onest для текста, JetBrains Mono для подписей и цифр. Все с кириллицей, встроены локально.',
 'photo': 'Реальных фото пока нет: кадры-плейсхолдеры описывают будущую съемку. Документальный свет, матовые черные байки, фиолетовые детали руля.',
 'patterns': 'Hush lines, contour, диагональный срез, наклонные стикеры и моно-метки. Все элементы собираются из линий и простых форм.',
 'icons': 'Иконки на сетке 48 px, линия 3 px, круглые концы, без заливок.',
 'ui': 'Кнопки-пилюли, чипы, переключатель ты/вы, карточка с диагональным срезом, поля с понятной ошибкой, видимый фокус.',
 'motion': 'Сборка байка при скролле, шейдер-контуры на фоне, курсор-метка. При prefers-reduced-motion все выключается.',
}
def page(inner, no, title, note=''):
    return f'<section class="pg"><div class="ph-h"><span class="mono">Hush / brand book v2</span><span class="mono">{no:02d} / {title}</span></div>{inner}<div class="pn">{note}</div></section>'
def scaled(fid, s=.966, dx=40, dy=0):
    f = byid[fid]
    return f'<div style="position:relative;margin:0 auto;width:{f["w"]*s:.0f}px;height:{f["h"]*s:.0f}px"><section class="fr {f["cls"]}" style="left:0;top:0;width:{f["w"]}px;height:{f["h"]}px;transform:scale({s});transform-origin:0 0">{f["html"]}</section></div>'
pages = []; no = 0
def add(inner, title, note=''):
    global no; no += 1; pages.append(page(inner, no, title, note))
add(scaled('cover'), 'Обложка', NOTES['cover'])
add(scaled('idea'), 'Идея бренда', NOTES['idea'])
vs = f'<div style="display:flex;gap:16px;justify-content:center">{scaled("voice-ty", .49)}{scaled("voice-vy", .49)}</div>'
vt = '<div class="two"><div><h4>ты (подростки)</h4><p>Коротко, дерзко, на ты. Сленг в меру: drop, roost, кастом. Не поучаем, не пугаем. Пример: "Сломал на трюке – чиним быстро".</p></div><div><h4>вы (родители)</h4><p>Спокойно, по делу, на вы. Объясняем и не давим. Цифры, сроки и итог заказа до оплаты. Пример: "24 месяца гарантии, сервис в Ростове".</p></div></div>'
add(vs + vt, 'Режимы голоса', 'Переключатель "ты / вы" на сайте меняет заголовок hero и блок доверия. Диапазоны пишем через дефис (40-70 км), тире только " – ".')
for fid, t in [('logo', 'Логотип'), ('logo-mono', 'Монохром'), ('logo-dont', 'Запреты'), ('colors', 'Цвета'), ('fonts', 'Шрифты'), ('photo', 'Фото-направление'), ('patterns', 'Графика'), ('icons', 'Иконки'), ('ui', 'UI'), ('motion', 'Motion')]:
    add(scaled(fid), t, NOTES[fid])
apps = '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;justify-content:center">' + ''.join(f'<div style="position:relative;height:{byid[i]["h"]*.485:.0f}px;width:{1080*.485:.0f}px;margin:0 auto">{scaled(i, .485)}</div>' for i in ['showroom', 'livery', 'social']) + f'<div style="position:relative;width:{1080*.485:.0f}px;height:{720*.485:.0f}px;overflow:hidden;border-radius:4px;margin:0 auto"><div style="transform:scale(.485);transform-origin:0 0;width:1080px;height:720px;position:relative">{byid["s-hero"]["html"]}</div></div></div>'
add(apps, 'Применение', 'Шоурум в Ростове, ливрея и упаковка, соцсети и визитка, сайт. Все фото и адреса на макетах – заглушки.')
BB_CSS = CSS + f'''
@page{{size:{PW}px {PH}px;margin:0}}
body{{background:#fff}}.pg{{width:{PW}px;height:{PH}px;position:relative;overflow:hidden;page-break-after:always;padding:26px 40px;background:{FOG}}}
.pg .fr{{box-shadow:none;border:1px solid #0F1A1622}}
.ph-h{{display:flex;justify-content:space-between;margin-bottom:16px}}.pn{{position:absolute;left:40px;right:40px;bottom:22px;font:400 15px/1.45 Onest;color:{MOSS}}}
.two{{display:grid;grid-template-columns:1fr 1fr;gap:30px;margin-top:20px}}.two h4{{font:600 22px Unbounded;letter-spacing:-.03em;margin-bottom:8px}}.two p{{font-size:17px}}
'''
bb = f'<!doctype html><html lang="ru"><head><meta charset="utf-8"><title>Hush brand book</title><style>{BB_CSS}</style></head><body>{SPRITE}{"".join(pages)}</body></html>'
open(os.path.join(HERE, 'brandbook.html'), 'w', encoding='utf8').write(bb)
json.dump({'w': CW, 'h': CH, 'frames': [dict(id=f['id'], title=f['title'], n=n, w=f['w'], h=f['h']) for n, f, x, y0 in placed], 'pages': no}, open(os.path.join(HERE, '_meta.json'), 'w'))
print('board', CW, CH, 'frames', len(placed), 'pages', no)
