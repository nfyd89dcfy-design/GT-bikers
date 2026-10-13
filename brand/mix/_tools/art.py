# Hand-drawn vehicle illustrations (stylised, original). stroke=currentColor, accent via CSS var --art-accent
def wheel(cx,cy,r,knobs=14):
    import math
    k=''
    for i in range(knobs):
        a=i*2*math.pi/knobs
        x1,y1=cx+(r+1)*math.cos(a),cy+(r+1)*math.sin(a)
        x2,y2=cx+(r+7)*math.cos(a),cy+(r+7)*math.sin(a)
        k+=f'<path d="M{x1:.1f} {y1:.1f}L{x2:.1f} {y2:.1f}" stroke-width="5"/>'
    return f'<g><circle cx="{cx}" cy="{cy}" r="{r}" fill="none" stroke-width="7"/><circle cx="{cx}" cy="{cy}" r="{r-14}" fill="none" stroke-width="2" opacity=".55"/><circle cx="{cx}" cy="{cy}" r="5" stroke-width="0" fill="var(--art-accent,currentColor)"/>{k}</g>'
def wrap(inner,label):
    return f'<svg viewBox="0 0 400 240" role="img" aria-label="{label}" xmlns="http://www.w3.org/2000/svg" fill="none" stroke="currentColor" stroke-linecap="butt" stroke-linejoin="miter" style="width:100%;height:auto">{inner}</svg>'
def ebike(label='Электровелосипед эндуро, схематичный рисунок'):
    return wrap(wheel(88,168,46)+wheel(318,168,46)+
      '<path d="M88 168 L176 150" stroke-width="7"/>'
      '<path d="M142 100 L236 88 L258 128 L210 170 L170 160 Z" fill="currentColor" fill-opacity=".14" stroke-width="6"/>'
      '<path d="M318 168 L282 70" stroke-width="8"/><path d="M268 62 L304 54" stroke-width="7"/>'
      '<path d="M120 94 L214 82" stroke-width="12"/>'
      '<circle cx="196" cy="152" r="14" fill="var(--art-accent,currentColor)" stroke="none"/>'
      '<path d="M236 88 L276 96" stroke-width="6"/>'
      '<path d="M150 124 L214 116" stroke="var(--art-accent,currentColor)" stroke-width="5"/>',label)
def atv(label='Квадроцикл, схематичный рисунок'):
    return wrap(wheel(96,170,50)+wheel(310,170,50)+
      '<path d="M96 170 L150 140 L240 140 L310 170" stroke-width="7"/>'
      '<path d="M120 138 L132 92 L240 84 L292 108 L300 140 Z" fill="currentColor" fill-opacity=".14" stroke-width="6"/>'
      '<path d="M150 90 L232 84" stroke-width="14"/>'
      '<path d="M270 106 L262 62 L296 58" stroke-width="7"/>'
      '<path d="M296 130 L360 128 L366 150 L310 152" stroke-width="6"/>'
      '<path d="M138 124 L282 120" stroke="var(--art-accent,currentColor)" stroke-width="5"/>',label)
def utv(label='UTV, схематичный рисунок'):
    return wrap(wheel(92,176,46)+wheel(318,176,46)+
      '<path d="M40 150 L84 120 L350 120 L372 150 L372 168 L40 168 Z" fill="currentColor" fill-opacity=".14" stroke-width="6"/>'
      '<path d="M120 120 L140 54 L300 54 L330 120" stroke-width="7"/><path d="M140 54 L130 120 M220 54 L222 120 M300 54 L296 120" stroke-width="4"/>'
      '<path d="M156 98 L214 98 M236 98 L290 98" stroke-width="10"/>'
      '<path d="M60 140 L350 140" stroke="var(--art-accent,currentColor)" stroke-width="5"/>',label)
def snow(label='Снегоход, схематичный рисунок'):
    return wrap('<path d="M26 192 C60 196 120 196 150 190 L330 190 L346 176 L326 166" stroke-width="7"/>'
      '<path d="M150 150 L330 150 C352 150 356 190 330 190 L150 190 C120 190 120 150 150 150Z" fill="currentColor" fill-opacity=".14" stroke-width="7"/>'
      '<path d="M170 160 L310 160 M170 172 L310 172 M170 184 L310 184" stroke-width="3" stroke-dasharray="9 7" opacity=".7"/>'
      '<path d="M40 190 C30 160 40 140 52 130 L58 190" stroke-width="7"/>'
      '<path d="M54 134 L150 90 L240 84 L270 130 L190 150" fill="currentColor" fill-opacity=".14" stroke-width="6"/>'
      '<path d="M206 84 L222 58 L246 54" stroke-width="7"/><path d="M96 118 L226 106" stroke="var(--art-accent,currentColor)" stroke-width="5"/>'
      '<path d="M150 90 L168 130" stroke-width="5"/>',label)
def van(label='Фургон в фирменной ливрее'):
    return wrap('<path d="M24 170 L24 96 L270 96 L300 126 L372 140 L372 170 Z" fill="currentColor" fill-opacity=".08" stroke-width="6"/>'
      '<path d="M270 96 L300 126 L372 140" stroke-width="6"/><path d="M276 104 L296 128 L340 134 L340 104 Z" fill="currentColor" fill-opacity=".25" stroke-width="3"/>'
      '<circle cx="96" cy="176" r="28" fill="currentColor" fill-opacity=".2" stroke-width="7"/><circle cx="312" cy="176" r="28" fill="currentColor" fill-opacity=".2" stroke-width="7"/>'
      '<path d="M40 150 L350 150" stroke="var(--art-accent,currentColor)" stroke-width="9"/>',label)
