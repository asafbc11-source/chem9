# Draws the app icon (atom with 5 topic electrons) in all needed sizes.
from PIL import Image, ImageDraw
import math
S=4; N=512*S; c=N/2
img=Image.new('RGBA',(N,N),'#2E45C8'); d=ImageDraw.Draw(img,'RGBA')
def circ(cx,cy,r,fill=None,outline=None,w=0):
    d.ellipse([cx-r*S,cy-r*S,cx+r*S,cy+r*S],fill=fill,outline=outline,width=int(w*S))
for r in (104,168): circ(c,c,r+8,outline=(255,255,255,217),w=16)
circ(c,c,46,fill='white')
for a in (90,270):
    t=math.radians(a); circ(c+104*S*math.cos(t),c-104*S*math.sin(t),18,fill='white')
cols=['#4CC9C0','#B79BFF','#F27BB0','#E2B04A','#FF9A5C']
for i,col in enumerate(cols):
    t=math.radians(90-72*i); x=c+168*S*math.cos(t); y=c-168*S*math.sin(t)
    circ(x,y,25,fill='white'); circ(x,y,22,fill=col)
big=img.resize((512,512),Image.LANCZOS).convert('RGB')
big.save('icons/icon-512.png'); big.save('icons/icon-maskable-512.png')
big.resize((192,192),Image.LANCZOS).save('icons/icon-192.png')
big.resize((180,180),Image.LANCZOS).save('icons/apple-touch-icon.png')
big.resize((32,32),Image.LANCZOS).save('icons/favicon-32.png')
print('icons ok')
