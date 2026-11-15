import numpy as np, sys, random
from PIL import Image, ImageDraw
from scipy import ndimage as nd
W,H=64,80
def hexc(s): s=s.lstrip('#'); return tuple(int(s[i:i+2],16) for i in (0,2,4))
R={ 'hull':['#24305e','#3f5694','#7d97cf','#bfd0f0','#f2f7ff'],
    'blue':['#0c1a52','#173690','#2659d0','#4588f2','#8cc2ff'],
    'yel': ['#6e3006','#b8600e','#ec9a1e','#ffcd48','#fff2a8'],
    'glass':['#052a44','#0a5478','#168fb8','#4adcf6','#d4ffff'],
    'metal':['#1b1f2e','#353d54','#5f6a86','#949fb8','#d2d9e8'],
    'red': ['#4a0a1a','#8a1630','#d0304a','#ff6a7a','#ffc0c8']}
RAD={'hull':6,'blue':2.2,'yel':1.5,'glass':4,'metal':2,'red':1.5}
OUT=hexc('#060a1c')
mats=[]
def poly(mat,pts,mirror=True):
    mats.append((mat,[pts,[(W-1-x,y) for x,y in pts]]))
# order = back to front
poly('blue',[(25,30),(14,42),(3,52),(1,60),(13,60),(25,55)])          # main wing
poly('blue',[(24,52),(15,62),(15,70),(26,64)])                          # rear fin
poly('metal',[(4,36),(7,33),(10,36),(10,58),(4,58)])                   # wingtip cannon
poly('red',[(5,52),(9,52),(9,57),(5,57)])                               # cannon band
poly('yel',[(25,33),(13,45),(14,47),(25,37)])                           # wing stripe
poly('metal',[(19,56),(25,56),(25,69),(19,69)])                         # side engine
poly('hull',[(31.5,1),(28,12),(26,26),(25,46),(26,62),(31.5,66)])       # fuselage
poly('yel',[(31.5,40),(26,46),(26,49),(31.5,44)])                       # chevron
poly('metal',[(27,62),(31.5,62),(31.5,71),(27,71)])                     # center engine
poly('glass',[(31.5,13),(29,18),(28.5,27),(29.5,32),(31.5,34)])         # cockpit
lab=np.zeros((H,W),int); names=['']
for mat,pts in mats:
    im=Image.new('L',(W,H),0); dr=ImageDraw.Draw(im)
    for p in pts: dr.polygon(p,fill=1)
    names.append(mat); lab[np.array(im)>0]=len(names)-1
mask=lab>0
img=np.zeros((H,W,4),np.uint8)
L=np.array([-0.55,-0.7,0.75]); L/=np.linalg.norm(L)
for i in range(1,len(names)):
    m=lab==i
    if not m.any(): continue
    mat=names[i]; d=nd.distance_transform_edt(m)
    r=RAD[mat]; h=np.sqrt(np.clip(d/r,0,1))*r
    gy,gx=np.gradient(h)
    n=np.dstack([-gx,-gy,np.ones_like(h)]); n/=np.linalg.norm(n,axis=2,keepdims=True)
    b=0.28+0.72*np.clip(n@L,0,1)
    if mat in('hull','blue'): b+= -0.10*(np.arange(H)[:,None]/H)   # darker toward tail
    idx=np.clip(np.round(b*4.4-0.3),0,4).astype(int)
    cols=np.array([hexc(c) for c in R[mat]])
    img[m,:3]=cols[idx[m]]; img[m,3]=255
# panel seams: darken pixel where label differs from the one above/left
for y in range(1,H):
    for x in range(1,W):
        if mask[y,x] and ((lab[y-1,x] not in(0,lab[y,x])) or (lab[y,x-1] not in(0,lab[y,x]))):
            img[y,x,:3]=(img[y,x,:3]*0.55).astype(np.uint8)
# glass specular
for x,y in [(30,16),(30,17),(29,19),(30,18)]:
    img[y,x,:3]=(235,255,255)
# outline
ring=nd.binary_dilation(mask)&~mask
img[ring,:3]=OUT; img[ring,3]=255
spr=Image.fromarray(img,'RGBA')
def flame(t):
    f=Image.new('RGBA',(W,H),(0,0,0,0)); p=f.load()
    cols=[(255,255,240),(255,236,140),(255,176,50),(240,96,30),(170,40,40)]
    for cx0,cx1,top,ln in [(20,24,70,7),(39,43,70,7),(28,35,72,9)]:
        for y in range(top,min(H,top+ln+t)):
            k=(y-top)/(ln+t); w=(cx1-cx0+1)*(1-k*0.8)
            c=(cx0+cx1)/2
            for x in range(cx0,cx1+1):
                if abs(x-c)<=w/2:
                    ci=min(4,int(k*4+abs(x-c)/(w/2+.01)*1.5))
                    p[x,y]=cols[ci]+(255,)
    return f
f=flame(0); f.alpha_composite(spr); spr=f
spr.save(sys.argv[1].replace('.png','_sprite.png'))
# preview: zoom x5 left, game-size on 480-wide screen right
Z=5; G=1.6
bg=(7,9,26)
pw=int(200); out=Image.new('RGB',(W*Z+40+pw, H*Z+40),bg)
random.seed(5)
for _ in range(260):
    x=random.randrange(out.width); y=random.randrange(out.height)
    v=random.choice([50,80,120,190]); out.putpixel((x,y),(v,v,min(255,v+30)))
big=spr.resize((W*Z,H*Z),Image.NEAREST); out.paste(big,(20,20),big)
sw,sh=int(W*G),int(H*G)
small=spr.resize((sw,sh),Image.NEAREST)
out.paste(small,(W*Z+40+(pw-sw)//2,20+(H*Z-sh)//2),small)
out.save(sys.argv[1]); print(out.size)
