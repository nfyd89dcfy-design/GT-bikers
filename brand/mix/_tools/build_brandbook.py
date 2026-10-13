import os,sys,math
sys.path.insert(0,os.path.dirname(__file__))
from common import *
import gen_logo as g
C=colors(); CT=contrast()
L=lambda n,**k: svgfile(n,**k)

# ---------- construction overlay
x0,y0,x1,y1=g.bbox(g.tp); s,ox,oy=g.s,g.ox,g.oy
def X(x,y): return (x+(g.H-y)*g.SK)*s+ox
def Y(y): return y*s+oy
B=15*s
cons=f'''<svg viewBox="0 0 96 96" class="cons" aria-hidden="true">
<rect x="{ox+x0*s-B:.1f}" y="{oy+y0*s-B:.1f}" width="{(x1-x0)*s+2*B:.1f}" height="{(y1-y0)*s+2*B:.1f}" fill="none" stroke="#6A4AF0" stroke-dasharray="2 2" stroke-width=".5"/>
<path d="M{X(15.5,15):.1f} {Y(15):.1f} L{X(15.5,60):.1f} {Y(60):.1f}" stroke="#BF3418" stroke-width=".6"/>
<path d="M{X(15.5,15):.1f} {Y(15):.1f} V{Y(60):.1f}" stroke="#BF3418" stroke-width=".4" stroke-dasharray="1.5 1.5"/>
<path d="M{X(0,0)-3:.1f} {Y(0):.1f} H{X(46,0)+3:.1f} M{X(0,15)-3:.1f} {Y(15):.1f} H{X(46,15)+3:.1f}" stroke="#6A4AF0" stroke-width=".4"/>
<text x="{X(46,0)+4:.1f}" y="{(Y(0)+Y(15))/2+1:.1f}" font-size="4" fill="#6A4AF0" font-family="monospace">B</text>
<text x="{X(15.5,40)+4:.1f}" y="{Y(40):.1f}" font-size="3.4" fill="#BF3418" font-family="monospace">12°</text>
</svg>'''

def swatch(k):
    c=C[k]; r,g_,b=c['rgb']
    dark = k in ('ink','spruce-800','spruce-600','violet','ember','stone')
    return f'''<div class="sw"><div class="chip" style="background:{c['value']};color:{'#EDEAE2' if dark else '#0F1F1A'}"><b>{c['name']}</b><span>--c-{k}</span></div>
<dl><dt>HEX</dt><dd>{c['value']}</dd><dt>RGB</dt><dd>{r}, {g_}, {b}</dd><dd class="role">{c['role']}</dd></dl></div>'''
core=['ink','spruce-800','spruce-600','lime','bone','paper']
sup=['lime-dim','dust','stone','mist','ember','violet','violet-soft']
rows=''.join(f'''<tr><td><span class="dot" style="background:{C[t['bg']]['value']}"></span><span class="dot" style="background:{C[t['fg']]['value']}"></span> {t['label']}</td><td class="mono">{C[t['fg']]['value']} / {C[t['bg']]['value']}</td><td class="mono">{t['ratio']:.2f}:1</td><td>{'AA' if t['AA_text'] else ('только крупный текст' if t['AA_large'] else 'не использовать для текста')}{', AAA' if t['AAA_text'] else ''}</td></tr>''' for t in CT)

def showcase(mode,title,addr):
    names={'trail':('Трасса','Тест-драйв Pro','Сравнить'),'salon':('Салон','Записаться на тест-драйв','Сравнить модели'),'club':('Клуб','Погнали на тест','Сравнить')}
    n=names[mode]
    h={'trail':'Тяга в цифрах.','salon':'Спокойная уверенность в цифрах.','club':'Поехали вместе.'}[mode]
    p={'trail':'120 км запаса хода. Замер: груз 80 кг, +20 °C, смешанный маршрут.','salon':'До 120 км запаса хода. Условия замера указаны под каждой цифрой, подберем модель под ваш маршрут.','club':'Суббота, 11:00, тест-драйв Pro в Ростове. Приходи, прокатим и расскажем цифры.'}[mode]
    return f'''<article class="mode" data-mode="{mode}"><div class="mtag">{n[0]} <i>{addr}</i></div>
<h4 class="mh">{h}</h4><p>{p}</p>
<div class="row"><a class="btn btn-p" href="#modes">{n[1]}</a><a class="btn btn-s" href="#modes">{n[2]}</a></div>
<div class="row"><span class="badge b-lite">Lite</span><span class="badge b-pro">Pro</span><span class="badge b-ultra">Ultra</span></div></article>'''

def pcard(mode):
    return f'''<article class="pcard" data-mode="{mode}"><div class="pimg" style="--art-accent:var(--accent)">{art.ebike()}<span class="badge b-pro">Pro</span></div>
<h4>Тяга Pro 50 <em class="ex">пример</em></h4>
<dl class="specs"><div><dt>Запас хода</dt><dd>до 120 км</dd></div><div><dt>Батарея</dt><dd>1 440 Вт·ч</dd></div><div><dt>Момент</dt><dd>90 Н·м</dd></div><div><dt>Масса</dt><dd>46 кг</dd></div></dl>
<p class="note">Замер: груз 80 кг, +20 °C, смешанный маршрут.</p>
<div class="row between"><b class="price">от 389 000 ₽</b><a class="btn btn-p sm" href="#ui">Тест-драйв</a></div></article>'''

icons_html=''.join(f'<li>{icon(k,32)}<span>{lbl}</span></li>' for k,lbl in [('ebike','Электровелосипед'),('atv','Квадроцикл'),('utv','UTV'),('snow','Снегоход'),('battery','Батарея'),('motor','Мотор'),('range','Запас хода'),('test','Тест-драйв'),('pin','Шоурум'),('delivery','Доставка'),('service','Сервис'),('compare','Сравнение'),('quiz','Подбор'),('custom','Кастом')])

dont=[('Не растягивать и не сжимать','transform:scaleX(1.5)'),('Не менять наклон','transform:skewX(24deg)'),('Не обводить контуром','-webkit-text-stroke:0;filter:none'),('Не добавлять тень и свечение','filter:drop-shadow(0 6px 6px rgba(0,0,0,.5))'),('Не ставить лайм на светлый фон','bg-lime'),('Не размещать на пестром фото без подложки','bg-photo')]
def dont_tile(i,t,st):
    if st=='bg-lime': inner=f'<div class="dbox" style="background:#EDEAE2">{L("logo-horizontal.svg",fill="#C8F03A",cls="dl")}</div>'
    elif st=='bg-photo': inner=f'<div class="dbox photo">{L("logo-horizontal.svg",fill="#EDEAE2",cls="dl")}</div>'
    elif 'stroke' in st:
        o=L('logo-horizontal.svg',fill='none',cls='dl').replace('<path ','<path stroke="#0F1F1A" stroke-width="1.6" ')
        inner='<div class="dbox" style="background:#EDEAE2">'+o+'</div>'
    else: inner=f'<div class="dbox" style="background:#EDEAE2"><div style="{st};transform-origin:left center">{L("logo-horizontal.svg",cls="dl")}</div></div>'
    return f'<figure class="dont">{inner}<figcaption><b>×</b> {t}</figcaption></figure>'
donts=''.join(dont_tile(i,t,s_) for i,(t,s_) in enumerate(dont))

HTML=open(os.path.join(os.path.dirname(__file__),'brandbook.tpl.html'),encoding='utf-8').read()
rep={
 '@@TOKENS@@':tokens_css(),'@@FONTS@@':FONTS_LINK,
 '@@LOGO_MARK@@':L('logo-mark.svg',cls='lg'),'@@LOGO_MARK_LIME@@':L('logo-mark-lime-on-dark.svg',cls='lg'),
 '@@LOGO_H@@':L('logo-horizontal.svg',cls='lg'),'@@LOGO_H_LIGHT@@':L('logo-horizontal-mono-light.svg',cls='lg',strip_bg=True),
 '@@LOGO_H_LIME@@':L('logo-horizontal-lime-on-dark.svg',cls='lg'),'@@LOGO_LAT@@':L('logo-horizontal-latin.svg',cls='lg'),
 '@@LOGO_H_NAV@@':L('logo-horizontal.svg',cls='nav-logo',fill='currentColor'),
 '@@LOGO_H_CC@@':L('logo-horizontal.svg',cls='lg',fill='currentColor'),
 '@@CONS@@':cons,'@@FAV@@':L('favicon.svg',cls='fav'),'@@APP@@':L('app-icon.svg',cls='app'),
 '@@SW_CORE@@':''.join(swatch(k) for k in core),'@@SW_SUP@@':''.join(swatch(k) for k in sup),'@@CONTRAST@@':rows,
 '@@MODES@@':showcase('trail','','Основной')+showcase('salon','','Шоурум, вы')+showcase('club','','Молодежь, ты'),
 '@@PCARDS@@':pcard('trail')+pcard('salon')+pcard('club'),
 '@@ICONS@@':icons_html,'@@DONTS@@':donts,
 '@@ART_EBIKE@@':art.ebike(),'@@ART_ATV@@':art.atv(),'@@ART_UTV@@':art.utv(),'@@ART_SNOW@@':art.snow(),'@@ART_VAN@@':art.van(),
 '@@MARK_FAV16@@':L('favicon.svg',cls='fav'),
 '@@LOGO_H_BONE@@':L('logo-horizontal-mono-light.svg',cls='lg'),
}
for k,v in rep.items(): HTML=HTML.replace(k,v)
open(os.path.join(os.path.dirname(__file__),'..','brandbook','index.html'),'w',encoding='utf-8').write(HTML)
print(len(HTML))
