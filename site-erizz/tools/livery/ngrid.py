import sys
from PIL import Image, ImageDraw
n=sys.argv[1]; x0,y0,x1,y1=map(int,sys.argv[2:6]); step=int(sys.argv[6]); sc=float(sys.argv[7])
im=Image.open(f'n{n}.png').convert('RGBA').crop((x0,y0,x1,y1))
bg=Image.new('RGB',im.size,(225,228,232)); bg.paste(im,(0,0),im)
bg=bg.resize((int(bg.width*sc),int(bg.height*sc)),Image.LANCZOS); d=ImageDraw.Draw(bg)
for x in range((x0//step+1)*step,x1,step):
  X=(x-x0)*sc; M=x%100==0; d.line([(X,0),(X,bg.height)],fill=(255,0,120) if M else (0,170,255),width=1)
  if M: d.text((X+2,2),str(x),fill=(255,0,120))
for y in range((y0//step+1)*step,y1,step):
  Y=(y-y0)*sc; M=y%100==0; d.line([(0,Y),(bg.width,Y)],fill=(255,0,120) if M else (0,170,255),width=1)
  if M: d.text((2,Y+2),str(y),fill=(255,0,120))
bg.save(sys.argv[8]); print(bg.size)
