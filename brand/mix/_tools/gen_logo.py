import math, os
OUT=os.path.join(os.path.dirname(__file__),'..','logo')
SK=math.tan(math.radians(12))   # italic slant 12 deg
H=60.0
INK='#0F1F1A'; BONE='#EDEAE2'; LIME='#C8F03A'

def rect(x0,y0,x1,y1,e=0.3): return [(x0-e,y0-e),(x1+e,y0-e),(x1+e,y1+e),(x0-e,y1+e)]
def T(teeth=True):
    bar=[rect(0,0,46,15)]
    return bar+[rect(15.5,12,30.5,H)], 46
SL=[rect(-13,0,-9,15), rect(-6.5,0,-2.5,15)]   # speed slashes behind the T
def YA():
    m=lambda p:[(46-x,y) for x,y in p]
    parts=[rect(0,0,15,H), rect(15,0,40,13), rect(27,13,40,40), rect(15,27,40,40), [(18,40),(33,40),(46,H),(31,H)]]
    return [m(p) for p in parts], 46
def GE():
    return [rect(0,0,15,H), rect(0,0,40,15)], 40
def A():
    return [[(0,H),(14,0),(32,0),(46,H),(31,H),(28,42),(18,42),(15,H)]], 46
def Y():
    return [rect(16,28,31,H), [(0,0),(15,0),(31,31),(16,31)], [(47,0),(32,0),(16,31),(31,31)]], 47
def G():
    return [rect(3,0,44,13), rect(0,3,14,57), rect(3,47,44,60), rect(30,27,44,57), rect(22,27,44,39)], 44

def skew(pts,dx=0):
    return [(x+dx+(H-y)*SK, y) for x,y in pts]
def d_of(pts,s=1,ox=0,oy=0):
    return 'M'+' L'.join(f'{(x*s+ox):.2f} {(y*s+oy):.2f}' for x,y in pts)+' Z'

def word(letters,gap=9):
    polys=[skew(p) for p in SL];x=0
    for l in letters:
        shapes,w=l
        for p in shapes: polys.append(skew([(a+x,b) for a,b in p]))
        x+=w+gap
    return polys, x-gap+H*SK

def bbox(polys):
    xs=[x for p in polys for x,y in p]; ys=[y for p in polys for x,y in p]
    return min(xs),min(ys),max(xs),max(ys)

def svg(w,h,body,bg=None,title=''):
    r=f'<rect width="{w}" height="{h}" fill="{bg}"/>' if bg else ''
    return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} {h}" width="{w}" height="{h}" role="img" aria-label="{title}"><title>{title}</title>{r}{body}</svg>\n'
def paths(polys,fill,s=1,ox=0,oy=0):
    return ''.join(f'<path d="{d_of(p,s,ox,oy)}" fill="{fill}"/>' for p in polys)

def w(name,s): open(os.path.join(OUT,name),'w',encoding='utf-8').write(s)

# --- mark (T with tread), 96x96, scale to fit
tshapes,tw=T(True)
tp=[skew(p) for p in tshapes+SL]
x0,y0,x1,y1=bbox(tp); s=1.15
ox=(96-(x1-x0)*s)/2-x0*s; oy=(96-(y1-y0)*s)/2-y0*s
w('logo-mark.svg', svg(96,96,paths(tp,INK,s,ox,oy),title='Знак ТЯГА: буква Т с протекторными зубцами'))
w('logo-mark-lime-on-dark.svg', svg(96,96,paths(tp,LIME,s,ox,oy),bg=INK,title='Знак ТЯГА, лайм на хвойно-черном'))
w('logo-mark-mono-dark.svg', svg(96,96,paths(tp,INK,s,ox,oy),title='Знак ТЯГА, монохром для светлого фона'))
w('logo-mark-mono-light.svg', svg(96,96,paths(tp,BONE,s,ox,oy),bg=INK,title='Знак ТЯГА, монохром для темного фона'))

# --- horizontal cyrillic ТЯГА
def horiz(letters,fill,bg=None,title='',accent=None):
    polys,_=word(letters)
    bx0,by0,bx1,by1=bbox(polys); width=bx1-bx0
    pad=20; W=width+pad*2; Hh=H+pad*2
    body=paths(polys,fill,1,pad-bx0,pad)
    if accent:  # lime slash under the wordmark baseline
        k=H*SK
        body+=f'<path d="M{pad+width-34:.2f} {pad+H+9:.2f} L{pad+width-8:.2f} {pad+H+9:.2f} L{pad+width-11:.2f} {pad+H+14:.2f} L{pad+width-37:.2f} {pad+H+14:.2f} Z" fill="{accent}"/>'
        Hh+=14
    return svg(round(W),round(Hh),body,bg,title)
CYR=[T(True),YA(),GE(),A()]
LAT=[T(True),Y(),A(),G(),A()]
w('logo-horizontal.svg', horiz(CYR,INK,title='ТЯГА',accent=None))
w('logo-horizontal-latin.svg', horiz(LAT,INK,title='TYAGA'))
w('logo-horizontal-mono-dark.svg', horiz(CYR,INK,title='ТЯГА, монохром для светлого фона'))
w('logo-horizontal-mono-light.svg', horiz(CYR,BONE,bg=INK,title='ТЯГА, монохром для темного фона'))
w('logo-horizontal-lime-on-dark.svg', horiz(CYR,LIME,bg=INK,title='ТЯГА, лайм на хвойно-черном'))
w('logo-horizontal-latin-mono-light.svg', horiz(LAT,BONE,bg=INK,title='TYAGA, монохром для темного фона'))

# --- favicon: simplified T (no tread) lime on ink tile
fs,_=T(False)
fp=[skew(p) for p in fs+SL]
fx0,fy0,fx1,fy1=bbox(fp); s2=0.36
fox=(32-(fx1-fx0)*s2)/2-fx0*s2; foy=(32-(fy1-fy0)*s2)/2-fy0*s2
w('favicon.svg', f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="32" height="32" role="img" aria-label="ТЯГА"><title>ТЯГА</title><rect width="32" height="32" rx="7" fill="{INK}"/>{paths(fp,LIME,s2,fox,foy)}</svg>\n')
# --- app icon 1024
ax0,ay0,ax1,ay1=bbox(tp); s3=10.6
aox=(1024-(ax1-ax0)*s3)/2-ax0*s3; aoy=(1024-(ay1-ay0)*s3)/2-ay0*s3
w('app-icon.svg', f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024" width="1024" height="1024" role="img" aria-label="ТЯГА"><title>ТЯГА, иконка приложения</title><rect width="1024" height="1024" rx="228" fill="{INK}"/>{paths(tp,LIME,s3,aox,aoy)}</svg>\n')
print('ok')
