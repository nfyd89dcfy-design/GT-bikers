import sys
from PIL import Image
n,h=sys.argv[1],int(sys.argv[2])
im=Image.open(n+'.png'); w,H=im.size; i=0
for y in range(0,H,h):
    im.crop((0,y,w,min(y+h,H))).save(f'{n}-part{i:02d}.png'); i+=1
print(i)
