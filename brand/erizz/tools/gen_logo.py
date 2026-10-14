# Generates E-Rizz logo SVGs with outlined text (no font dependency).
import os
from fontTools.ttLib import TTFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
FONT="/home/claude/wt/erizz/site-erizz/node_modules/@fontsource/unbounded/files/unbounded-latin-500-normal.woff"
OUT=os.path.join(os.path.dirname(__file__),"..","logo")
f=TTFont(FONT); gs=f.getGlyphSet(); cmap=f.getBestCmap(); upm=f["head"].unitsPerEm
def word(text,size,track=0.1):
    sc=size/upm; x=0; paths=[]
    for ch in text:
        if ch=="-":
            # custom short bar instead of hyphen: kept as drawn hyphen scaled
            pass
        g=cmap[ord(ch)]; pen=SVGPathPen(gs)
        tp=TransformPen(pen,(sc,0,0,-sc,x,0)); gs[g].draw(tp)
        paths.append(pen.getCommands()); x+=gs[g].width*sc+track*size
    return " ".join(paths), x-track*size
CAP=f["OS/2"].sCapHeight/upm
CHROME='<linearGradient id="ch" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f4f7fa"/><stop offset=".38" stop-color="#b9c2cc"/><stop offset=".55" stop-color="#6f7a86"/><stop offset=".78" stop-color="#d9dee3"/><stop offset="1" stop-color="#8d97a2"/></linearGradient>'
BOLT="M63 1 L22 57 H44 L35 99 L80 39 H56 Z"
def mark(ring,bolt,inner,grad=True,idp="a"):
    defs=(CHROME if grad else "")+f'<mask id="m{idp}"><rect width="100" height="100" fill="#fff"/><path d="{BOLT}" fill="#000" stroke="#000" stroke-width="7" stroke-linejoin="miter"/></mask>'
    rg="url(#ch)" if grad else ring
    return defs, (f'<g mask="url(#m{idp})"><circle cx="50" cy="50" r="40" fill="none" stroke="{rg}" stroke-width="6"/>'
        f'<circle cx="50" cy="50" r="29" fill="none" stroke="{inner}" stroke-width="1" opacity=".55"/></g>'
        f'<path d="{BOLT}" fill="{bolt}"/>')
def svg(w,h,body,defs="",title="E-Rizz",bg=None):
    r=f'<rect width="{w}" height="{h}" fill="{bg}"/>' if bg else ""
    return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} {h}" width="{w}" height="{h}" role="img"><title>{title}</title><defs>{defs}</defs>{r}{body}</svg>'
def write(n,s): open(os.path.join(OUT,n),"w").write(s)
V={ # name: ring,bolt,inner,text,grad,bg
 "color":("", "#ff4a2b","#b9c2cc","#eef1f4",True,None),
 "white":("#ffffff","#ffffff","#ffffff","#ffffff",False,None),
 "black":("#0e1013","#0e1013","#0e1013","#0e1013",False,None),
 "on-light":("#0e1013","#ff4a2b","#0e1013","#0e1013",False,None),
}
for k,(ring,bolt,inner,txt,grad,bg) in V.items():
    d,m=mark(ring,bolt,inner,grad,k)
    write(f"mark-{k}.svg",svg(100,100,m,d,"E-Rizz mark",bg))
    # wordmark
    size=40; p,wd=word("E-RIZZ",size,0.12); h=size*CAP
    write(f"wordmark-{k}.svg",svg(round(wd)+2,round(h)+2,f'<path transform="translate(1,{h+1:.2f})" d="{p}" fill="{txt}"/>',"","E-Rizz"))
    # horizontal lockup: mark 100 high, text cap-height ~ 34
    size=46; p,wd=word("E-RIZZ",size,0.12); h=size*CAP; W=100+34+wd
    ty=50+h/2
    write(f"lockup-{k}.svg",svg(round(W),100,f'<g>{m}</g><path transform="translate(134,{ty:.2f})" d="{p}" fill="{txt}"/>',d,"E-Rizz"))
    # stacked
    size=34; p,wd=word("E-RIZZ",size,0.14); h=size*CAP; W=max(wd,100)
    write(f"stacked-{k}.svg",svg(round(W),round(100+22+h),f'<g transform="translate({(W-100)/2:.1f},0)">{m}</g><path transform="translate({(W-wd)/2:.1f},{100+22+h:.2f})" d="{p}" fill="{txt}"/>',d,"E-Rizz"))
# app icon / favicon: dark rounded square
d,m=mark("","#ff4a2b","#b9c2cc",True,"i")
write("app-icon.svg",svg(128,128,f'<rect width="128" height="128" rx="26" fill="#0e1013"/><g transform="translate(24,24) scale(.8)">{m}</g>',d,"E-Rizz app icon"))
print(sorted(os.listdir(OUT)))
