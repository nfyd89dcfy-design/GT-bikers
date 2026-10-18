# Badge (sticker / merch) and GT series wordmarks, outlined text.
import os, math
from fontTools.ttLib import TTFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
from fontTools.pens.boundsPen import BoundsPen
FD="/home/claude/wt/erizz/site-erizz/node_modules/@fontsource/unbounded/files/"
OUT=os.path.join(os.path.dirname(__file__),"..","logo")
def load(w):
    f=TTFont(FD+f"unbounded-latin-{w}-normal.woff"); return f, f.getGlyphSet(), f.getBestCmap(), f["head"].unitsPerEm
F5=load(500); F8=load(800)
def glyph(F,ch,mat):
    f,gs,cm,upm=F; pen=SVGPathPen(gs); gs[cm[ord(ch)]].draw(TransformPen(pen,mat)); return pen.getCommands(), gs[cm[ord(ch)]].width
def width(F,text,size,track):
    f,gs,cm,upm=F; sc=size/upm; return sum(gs[cm[ord(c)]].width*sc for c in text)+track*size*(len(text)-1)
def arc_text(F,text,size,r,cx,cy,center_deg,track=0.18,outside=True):
    f,gs,cm,upm=F; sc=size/upm
    total=width(F,text,size,track); ang_total=total/r
    # top arc: reading clockwise, start angle
    out=[]; a=math.radians(center_deg)-ang_total/2 if outside else math.radians(center_deg)+ang_total/2
    for ch in text:
        w=gs[cm[ord(ch)]].width*sc
        if ch==' ':
            a+= (w+track*size)/r * (1 if outside else -1); continue
        mid=a+(w/2)/r*(1 if outside else -1)
        # position on circle (angle measured from +x, clockwise since svg y down)
        px=cx+r*math.cos(mid); py=cy+r*math.sin(mid)
        rot=mid+math.pi/2 if outside else mid-math.pi/2
        c,s=math.cos(rot),math.sin(rot)
        # glyph local: x from -w/2..w/2, baseline at 0 (y up -> flip)
        # matrix maps (gx,gy) -> rotate(scale*(gx)-w/2, -scale*gy) + p
        a11=c*sc; a12=s*sc; a21=-s*sc*-1; 
        mat=(c*sc, s*sc, s*sc, -c*sc, px + c*(-w/2), py + s*(-w/2))
        cmd,_=glyph(F,ch,mat); out.append(cmd)
        a+=(w+track*size)/r*(1 if outside else -1)
    return " ".join(out)
BOLT="M63 1 L22 57 H44 L35 99 L80 39 H56 Z"
def badge(bg,fg,acc,name):
    S=400; cx=cy=200
    top=arc_text(F8,"E-RIZZ ELECTRIC",30,150,cx,cy,-90,0.16,True)
    bot=arc_text(F5,"GT SERIES . RND",22,168,cx,cy,90,0.22,False)
    checks="".join(f'<rect x="{cx-4}" y="{cy-196}" width="8" height="10" fill="{fg if i%2 else acc}" transform="rotate({i*7.5} {cx} {cy})"/>' for i in range(48))
    body=(f'<circle cx="{cx}" cy="{cy}" r="198" fill="{bg}"/>{checks}'
          f'<circle cx="{cx}" cy="{cy}" r="182" fill="none" stroke="{fg}" stroke-width="2"/>'
          f'<circle cx="{cx}" cy="{cy}" r="120" fill="none" stroke="{fg}" stroke-width="2"/>'
          f'<path d="{top}" fill="{fg}"/><path d="{bot}" fill="{fg}" opacity=".9"/>'
          f'<g transform="translate({cx-75},{cy-75}) scale(1.5)"><circle cx="50" cy="50" r="40" fill="none" stroke="{fg}" stroke-width="6"/><path d="{BOLT}" fill="{acc}" stroke="{bg}" stroke-width="5"/></g>'
          f'<circle cx="{cx-158}" cy="{cy}" r="5" fill="{acc}"/><circle cx="{cx+158}" cy="{cy}" r="5" fill="{acc}"/>')
    open(os.path.join(OUT,f"badge-{name}.svg"),"w").write(f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {S} {S}" width="{S}" height="{S}" role="img"><title>E-Rizz badge</title>{body}</svg>')
badge("#0e1013","#eef1f4","#ff4a2b","dark"); badge("#ff4a2b","#0e1013","#eef1f4","flare"); badge("#eef1f4","#0e1013","#ff4a2b","light")
# Series wordmarks: GT + SERIES + outlined size
def series(name,num,fg,acc,outname):
    f,gs,cm,upm=F8; size=80; sc=size/upm; x=0; out=[]
    for ch in "GT":
        c,w=glyph(F8,ch,(sc,0,0,-sc,x,size*0.73)); out.append(c); x+=w*sc+0.04*size
    gt_w=x; x+=0.35*size
    f5=F5; s2=size; xs=x; o2=[]
    for ch in name:
        c,w=glyph(F5,ch,(s2/upm,0,0,-s2/upm,x,size*0.73)); o2.append(c); x+=w*(s2/upm)+0.06*size
    x+=0.3*size; o3=[]
    for ch in num:
        if ch==' ': x+=0.3*size; continue
        c,w=glyph(F8,ch,(sc,0,0,-sc,x,size*0.73)); o3.append(c); x+=w*sc+0.04*size
    W=int(x+10); H=int(size*0.85)
    svg=(f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" width="{W}" height="{H}" role="img"><title>GT {name} {num}</title>'
         f'<path d="{" ".join(out)}" fill="{acc}"/><path d="{" ".join(o2)}" fill="{fg}"/><path d="{" ".join(o3)}" fill="none" stroke="{fg}" stroke-width="2.4"/></svg>')
    open(os.path.join(OUT,outname),"w").write(svg)
for nm,num in [("SPARK","14"),("SEND","19"),("RIDGE","21"),("PULSE","17"),("DRIFT","19"),("GRAND","")]:
    series(nm,num,"#eef1f4","#ff4a2b",f"series-{nm.lower()}-dark.svg"); series(nm,num,"#0e1013","#ff4a2b",f"series-{nm.lower()}-light.svg")
print(sorted(x for x in os.listdir(OUT) if x.startswith(('badge','series'))))
