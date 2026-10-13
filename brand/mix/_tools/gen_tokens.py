import json,os
T=os.path.join(os.path.dirname(__file__),'..','tokens')
C={
 'ink':('#0F1F1A','Хвоя-ночь','Основной темный: фон режима Трасса, текст на светлом'),
 'spruce-800':('#17302A','Хвоя','Карточки и панели на темном'),
 'spruce-600':('#28493F','Мох-хвоя','Линии, второстепенные поверхности, акцент режима Салон'),
 'lime':('#C8F03A','Разряд','Сигнальный акцент: кнопки, цифры, знак на темном'),
 'lime-dim':('#9DBE22','Разряд тусклый','Состояния наведения на темном, графика'),
 'bone':('#EDEAE2','Известняк','Основной светлый фон и текст на темном'),
 'paper':('#F7F5F0','Бумага','Карточки на известняке'),
 'dust':('#CFC6B2','Пыль','Разделители и фон бейджа Lite'),
 'stone':('#6B675C','Камень','Вторичный текст на светлом'),
 'mist':('#A9B5AE','Дымка','Вторичный текст на темном'),
 'ember':('#BF3418','Сигнал','Ошибки, предупреждения, метка Ultra в салоне'),
 'violet':('#6A4AF0','Фиалка','Акцент режима Клуб, кастом-байки (Клуб на светлом: AA для текста)'),
 'violet-soft':('#B7A5FF','Фиалка светлая','Акцент Клуба на темном'),
}
def lin(c):
    c=c/255
    return c/12.92 if c<=0.03928 else ((c+0.055)/1.055)**2.4
def lum(h):
    h=h.lstrip('#'); r,g,b=[int(h[i:i+2],16) for i in (0,2,4)]
    return 0.2126*lin(r)+0.7152*lin(g)+0.0722*lin(b)
def cr(a,b):
    la,lb=lum(a),lum(b); hi,lo=max(la,lb),min(la,lb); return (hi+0.05)/(lo+0.05)
def rgb(h):
    h=h.lstrip('#'); return [int(h[i:i+2],16) for i in (0,2,4)]
pairs=[('bone','ink','Текст на известняке'),('ink','bone','Текст на хвое-ночи'),('ink','lime','Текст на лайме (кнопка)'),('lime','ink','Лайм на хвое-ночи'),
 ('stone','bone','Вторичный текст на известняке'),('mist','ink','Вторичный текст на хвое-ночи'),('stone','paper','Вторичный текст на бумаге'),
 ('bone','spruce-600','Известняк на мох-хвое'),('lime','spruce-800','Лайм на карточке'),('violet','bone','Фиалка на известняке (текст, ссылки)'),('violet-soft','ink','Фиалка светлая на хвое-ночи'),
 ('bone','violet','Известняк на фиалке (кнопка Клуба)'),('ink','violet-soft','Хвоя-ночь на светлой фиалке (кнопка Клуба)'),('ember','bone','Сигнал на известняке'),('bone','ember','Известняк на сигнале'),('lime','bone','Лайм на известняке (не использовать для текста)'),('ink','dust','Текст на пыли (бейдж Lite)')]
table=[]
for fg,bg,label in pairs:
    r=cr(C[fg][0],C[bg][0])
    table.append({'fg':fg,'bg':bg,'label':label,'ratio':round(r,2),'AA_text':r>=4.5,'AA_large':r>=3,'AAA_text':r>=7})
json.dump(table,open(os.path.join(T,'contrast.json'),'w',encoding='utf-8'),ensure_ascii=False,indent=1)
for t in table: print(f"{t['fg']:12}{t['bg']:12}{t['ratio']:6} AA:{t['AA_text']} large:{t['AA_large']} AAA:{t['AAA_text']}  {t['label']}")

modes={
 'trail':{'bg':'ink','surface':'spruce-800','text':'bone','muted':'mist','accent':'lime','on-accent':'ink','line':'spruce-600','focus':'lime','radius':'2px','display-weight':'800','display-tracking':'-0.01em','display-case':'uppercase','density':'1','address':'ты (молодежь) / вы (взрослые)'},
 'salon':{'bg':'bone','surface':'paper','text':'ink','muted':'stone','accent':'ink','on-accent':'bone','line':'dust','focus':'ink','radius':'2px','display-weight':'300','display-tracking':'0.02em','display-case':'none','density':'1.35','address':'вы'},
 'club':{'bg':'ink','surface':'spruce-800','text':'bone','muted':'mist','accent':'violet-soft','on-accent':'ink','line':'spruce-600','focus':'violet-soft','radius':'999px','display-weight':'700','display-tracking':'0','display-case':'none','density':'0.9','address':'ты'},
}
tok={'name':'ТЯГА (рабочее название, TYAGA)','slope-deg':12,'color':{k:{'value':v[0],'name':v[1],'role':v[2],'rgb':rgb(v[0])} for k,v in C.items()},
 'mode':modes,
 'font':{'display':"'Unbounded', 'Onest', system-ui, sans-serif",'text':"'Onest', system-ui, -apple-system, 'Segoe UI', sans-serif",'mono':"'JetBrains Mono', ui-monospace, 'SFMono-Regular', Consolas, monospace"},
 'type-scale':{'xs':'12px','sm':'14px','base':'16px','md':'18px','lg':'22px','xl':'28px','2xl':'38px','3xl':'52px','4xl':'72px'},
 'space':{str(i):f'{i*4}px' for i in (1,2,3,4,5,6,8,10,12,16,20,24)},
 'radius':{'none':'0','sm':'2px','md':'6px','lg':'14px','pill':'999px'},
 'shadow':{'card':'0 1px 0 rgba(15,31,26,.06), 0 10px 30px -12px rgba(15,31,26,.28)','pop':'0 18px 50px -16px rgba(15,31,26,.45)'},
 'motion':{'fast':'120ms','base':'220ms','slow':'420ms','ease':'cubic-bezier(.2,.7,.2,1)'},
 'breakpoint':{'sm':'480px','md':'768px','lg':'1100px','xl':'1440px'},
 'focus':{'ring':'3px solid var(--focus-c)','offset':'3px','note':'цвет кольца зависит от режима'},
 'contrast':'см. contrast.json'}
json.dump(tok,open(os.path.join(T,'tokens.json'),'w',encoding='utf-8'),ensure_ascii=False,indent=1)
css=['/* ТЯГА (TYAGA), дизайн-токены. Рабочее название; значения примерные до утверждения бренда. */',':root{']
for k,v in C.items(): css.append(f'  --c-{k}: {v[0]}; /* {v[1]} */')
css+= ["  --f-display: 'Unbounded', 'Onest', system-ui, sans-serif;","  --f-text: 'Onest', system-ui, -apple-system, 'Segoe UI', sans-serif;","  --f-mono: 'JetBrains Mono', ui-monospace, SFMono-Regular, Consolas, monospace;"]
for k,v in tok['type-scale'].items(): css.append(f'  --fs-{k}: {v};')
for k,v in tok['space'].items(): css.append(f'  --sp-{k}: {v};')
for k,v in tok['radius'].items(): css.append(f'  --r-{k}: {v};')
css+= [f"  --shadow-card: {tok['shadow']['card']};",f"  --shadow-pop: {tok['shadow']['pop']};",'  --t-fast: 120ms; --t-base: 220ms; --t-slow: 420ms; --ease: cubic-bezier(.2,.7,.2,1);','  --slope: 12deg;','  --focus: 3px solid var(--focus-c);']
css.append('  /* режим по умолчанию: Трасса */')
def modeblock(m):
    d=modes[m]; out=[]
    for k in ['bg','surface','text','muted','accent','on-accent','line']: out.append(f'  --{k}: var(--c-{d[k]});')
    out.append(f"  --focus-c: var(--c-{d['focus']});")
    out.append(f"  --radius: {d['radius']};  --display-weight: {d['display-weight']};  --display-tracking: {d['display-tracking']};  --display-case: {d['display-case']};  --density: {d['density']};")
    return out
css+=modeblock('trail'); css.append('}')
for m in ('trail','salon','club'):
    css.append(f'[data-mode="{m}"]{{'); css+=modeblock(m); css.append('}')
css.append('@media (prefers-reduced-motion: reduce){:root{--t-fast:0ms;--t-base:0ms;--t-slow:0ms}}')
open(os.path.join(T,'tokens.css'),'w',encoding='utf-8').write('\n'.join(css)+'\n')
