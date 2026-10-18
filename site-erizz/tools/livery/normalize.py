# Нормализация v2: масштаб по "телу" байка (без зеркал и тонкого руля), ширина не больше WT
import numpy as np, json, sys
from PIL import Image, ImageDraw
SRC='liv/site_out'; DST='/home/claude/wt/erizz/site-erizz/public/products/studio'
WT,HB,GROUND,CX=1080,500,839,800
T={}; tiles=[]
K_OVR={3: 1.08, 8: 0.85, 10: 0.86, 17: 0.95, 18: 0.95, 19: 0.87}
for i in range(1,21):
    im=Image.open(f'{SRC}/s{i:02d}.png').convert('RGBA'); a=np.array(im)[...,3]>40
    ys,xs=np.where(a); x0,x1=xs.min(),xs.max(); w=x1-x0+1
    rows=a.sum(1)>=0.18*w
    bt=next(y for y in range(900) if rows[y:y+45].all())
    hb=GROUND-bt+1
    full=GROUND-ys.min()+1
    k=max(HB/hb, 600/full)            # тело не меньше 500 px, общий рост не меньше 600 px
    # кадры в три четверти выглядят мельче: подтягиваем по размеру колеса до боковых
    k=K_OVR.get(i,k)
    k=min(k, WT/w, (GROUND-40)/full)  # но не шире 1080 и не выше кадра
    cx=(x0+x1)/2
    inv=(1/k,0,cx-CX/k, 0,1/k,GROUND-GROUND/k)
    out=im.transform((1600,900),Image.AFFINE,inv,resample=Image.BICUBIC)
    top=GROUND-(GROUND-ys.min())*k
    if top<20: print('!! top',i,top)
    if '--write' in sys.argv:
        out.save(f'{DST}/s{i:02d}.webp','WEBP',quality=88,method=6)
        out.resize((800,450),Image.LANCZOS).save(f'{DST}/sm-s{i:02d}.webp','WEBP',quality=86,method=6)
    T[i]=(round(float(k),4),round(float(cx),1))
    bg=Image.new('RGBA',(1600,900),(236,238,241,255)); bg.alpha_composite(out); d=ImageDraw.Draw(bg); d.line([0,GROUND,1600,GROUND],fill=(255,0,0,255),width=3); d.line([0,GROUND-HB,1600,GROUND-HB],fill=(0,120,255,255),width=2)
    d.text((20,20),str(i),fill=(0,0,0,255)); tiles.append(bg.convert('RGB').resize((400,225)))
    print(i,'k=%.3f body_h=%d w=%d top=%d'%(k,hb*k,w*k,top))
sh=Image.new('RGB',(2000,900),'white')
for j,t in enumerate(tiles): sh.paste(t,((j%5)*400,(j//5)*225))
sh.save('norm2_sheet.jpg',quality=85); json.dump(T,open('norm_T.json','w'))
