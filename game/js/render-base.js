'use strict';
// Vẽ địa hình / công trình: sao chép từ demo-thanh-tri (index.html 316-554).
const lerpC=(a,b,k)=>{const pa=parseInt(a.slice(1),16),pb=parseInt(b.slice(1),16);let o='#';for(const sh of [16,8,0]){const va=pa>>sh&255,vb=pb>>sh&255;o+=Math.round(va+(vb-va)*k).toString(16).padStart(2,'0')}return o};
const nz=(x,y)=>(Math.sin(x*.53+y*.31+1.7)+Math.sin(x*.21-y*.47+4.1)+Math.sin((x+y)*.9))/6+.5;
let GLOW=[],NIGHT=0,DUSK=0;
const glow=(p,r,c='255,180,80')=>{if(NIGHT>.05)GLOW.push([p.x,p.y,r*s,c])};
const quad=(x,y,w,d,z,fill,st,wd)=>poly([P(x,y,z),P(x+w,y,z),P(x+w,y+d,z),P(x,y+d,z)],fill,st,wd);
function paintTiles(){for(let y=0;y<N;y++)for(let x=0;x<N;x++){const q=G.map[y*N+x],n=nz(x,y);let w=0;
    for(let j=-1;j<=1;j++)for(let i=-1;i<=1;i++){const o=tile(x+i,y+j);if(o&&o.b&&o.b.k!=='farm'&&o.b.k!=='salt'&&!isRoad(o.b))w+=(i||j)?1:3}
    q.w=w;q.c=q.t==='w'?'#5a9fbe':q.t==='f'?lerpC('#6f9a5c','#88ad6a',n):q.t==='r'?lerpC('#a39f88',' #bcb8a2'.trim(),n):lerpC(lerpC('#8db46c','#b4c98b',n),'#cbb78d',Math.min(.8,w*.16))}}
function lantern(x,y,z,sc=1){const p=P(x,y,z),r=2.3*s*sc,sw=Math.sin(T*2+x*5+y)*.8*s,c={x:p.x+sw,y:p.y+4*s*sc};
  line(p,c,'#3a2a22',.6);ctx.beginPath();ctx.ellipse(c.x,c.y,r,r*1.2,0,0,7);ctx.fillStyle=NIGHT>.3?'#ff7a3a':'#d9372a';ctx.fill();ctx.strokeStyle=OUT;ctx.lineWidth=lw()*.5;ctx.stroke();
  line({x:c.x-r*.5,y:c.y-r*1.2},{x:c.x+r*.5,y:c.y-r*1.2},'#e3bd3f',1);line({x:c.x,y:c.y+r*1.2},{x:c.x,y:c.y+r*2.3},'#e3bd3f',.7);glow(c,22*sc)}
function winF(x,y,z,w,h){const lit=NIGHT>.35,c=lit?'#b9772a':'#8a6a4a';poly([P(x,y,z),P(x+w,y,z),P(x+w,y,z+h),P(x,y,z+h)],lit?'#ffd27a':'#4f3b2c',OUT,.6);
  line(P(x+w/2,y,z),P(x+w/2,y,z+h),c,.5);line(P(x,y,z+h/2),P(x+w,y,z+h/2),c,.5);if(lit)glow(P(x+w/2,y,z+h/2),15)}
function winR(x,y,z,d,h){const lit=NIGHT>.35,c=lit?'#b9772a':'#8a6a4a';poly([P(x,y,z),P(x,y+d,z),P(x,y+d,z+h),P(x,y,z+h)],lit?'#f0bd60':'#3f2f24',OUT,.6);
  line(P(x,y+d/2,z),P(x,y+d/2,z+h),c,.5);line(P(x,y,z+h/2),P(x,y+d,z+h/2),c,.5)}
function bricks(x,y,w,d,z0,h){const c='rgba(40,35,30,.17)';for(let z=z0+4;z<z0+h-1;z+=4.5){line(P(x,y+d,z),P(x+w,y+d,z),c,.5);line(P(x+w,y,z),P(x+w,y+d,z),c,.5)}}
function crenel(x,y,w,d,z,col){const m=.13,nx=Math.max(2,Math.round(w/.28)),ny=Math.max(2,Math.round(d/.28));
  for(let i=0;i<nx;i++)box(x+i*(w-m)/(nx-1),y,m,m,z,5,col);
  for(let j=1;j<ny-1;j++){box(x,y+j*(d-m)/(ny-1),m,m,z,5,col);box(x+w-m,y+j*(d-m)/(ny-1),m,m,z,5,col)}
  for(let i=0;i<nx;i++)box(x+i*(w-m)/(nx-1),y+d-m,m,m,z,5,col)}
function shadow(x,y,w,d,h){const k=h/64*.95;poly([P(x,y),P(x+w,y),P(x+w,y+d),P(x+w-k,y+d+k),P(x-k,y+d+k),P(x-k,y+k)],`rgba(25,40,30,${.2*(1-NIGHT*.8)})`,null)}
function boulder(cx,cy,r,h,seed,c0){const p=P(cx,cy),R=r*TW/2*s,Hh=h*s,j=(rnd(seed)-.5)*R*.4,c=c0||'#96999b';
  ctx.fillStyle='rgba(0,0,0,.14)';ctx.beginPath();ctx.ellipse(p.x-R*.2,p.y+R*.1,R*1.2,R*.5,0,0,7);ctx.fill();
  const bl={x:p.x-R,y:p.y-R*.05},bf={x:p.x+R*.1+j,y:p.y+R*.42},br={x:p.x+R,y:p.y-R*.1},tl={x:p.x-R*.62,y:p.y-Hh*.78},tm={x:p.x-R*.05+j,y:p.y-Hh},tr={x:p.x+R*.62,y:p.y-Hh*.66},mf={x:p.x+R*.08+j,y:p.y-Hh*.42};
  poly([bl,bf,mf,tl],shade(c,-.05));poly([bf,br,tr,mf],shade(c,-.3));poly([tl,mf,tr,tm],shade(c,.25));
  line(mf,{x:(bf.x+mf.x)/2-R*.15,y:(bf.y+mf.y)/2},'rgba(0,0,0,.25)',.6);
  if(rnd(seed+3)>.5){ctx.fillStyle='#7fa35f';ctx.beginPath();ctx.ellipse(tl.x+R*.3,tl.y+Hh*.08,R*.3,R*.12,-.3,0,7);ctx.fill()}}
function pine(p,h,v){const sw=Math.sin(T*1.3+v*20)*1.2*s,col=v>.25?'#3c7848':'#4a8a50';
  line(p,{x:p.x,y:p.y-h*.3},'#6b4a2e',3);
  for(let i=0;i<4;i++){const yy=p.y-h*.18-i*h*.2,ww=(12-i*2.5)*s*h/(28*s),tx=p.x+sw*(i+1)*.35,ty=yy-h*.36;
    poly([{x:p.x-ww,y:yy},{x:p.x+ww,y:yy},{x:tx,y:ty}],shade(col,i*.07));
    poly([{x:p.x,y:yy},{x:p.x+ww,y:yy},{x:tx,y:ty}],shade(col,-.22+i*.05),null)}}
function broad(p,v,c1,c2){const sw=Math.sin(T*1.1+v*30)*1.4*s,sc=(.85+v*.4)*s;
  line(p,{x:p.x+1*s,y:p.y-13*sc},'#6b4a2e',3.2);line({x:p.x,y:p.y-8*sc},{x:p.x-5*sc,y:p.y-14*sc},'#6b4a2e',1.6);
  for(const [dx,dy,r] of [[-7,-17,7],[7,-16,7.5],[0,-24,8.5],[-3,-14,6],[5,-21,6]]){dot({x:p.x+dx*sc+sw,y:p.y+dy*sc},r*sc,c1,OUT)}
  for(const [dx,dy,r] of [[-8,-19,3.5],[-1,-27,4.5],[5,-19,3]]){dot({x:p.x+dx*sc+sw,y:p.y+dy*sc},r*sc,c2)}}
function bamboo(p,v){for(let i=0;i<6;i++){const o=(i-2.5)*2.6*s,h=(24+rnd(v*9+i)*14)*s,sw=Math.sin(T*1.6+i+v*9)*2.2*s,a={x:p.x+o,y:p.y+(i%2)*2*s},b={x:p.x+o*1.5+sw,y:p.y-h};
    line(a,b,i%2?'#7faa4f':'#6a9a44',1.7);for(let k=1;k<4;k++){const u=k/4,q={x:a.x+(b.x-a.x)*u,y:a.y+(b.y-a.y)*u};line({x:q.x-1.2*s,y:q.y},{x:q.x+1.2*s,y:q.y},'#4f7a36',.7)}
    for(let k=0;k<3;k++){const q={x:a.x+(b.x-a.x)*(.7+k*.15),y:a.y+(b.y-a.y)*(.7+k*.15)},e=(k%2?1:-1);line(q,{x:q.x+e*6*s+sw*.4,y:q.y+2.5*s},'#4d8a3f',1.5)}}}
function tree(x,y,v){const p=P(x+.3+v*.35,y+.3+rnd(v*99)*.35);
  ctx.fillStyle=`rgba(20,35,25,${.16*(1-NIGHT*.8)})`;ctx.beginPath();ctx.ellipse(p.x-5*s,p.y+1*s,12*s,5*s,0,0,7);ctx.fill();
  if(rnd(v*7)>.45){const p2=P(x+.75-v*.3,y+.8-rnd(v*5)*.2);pine(p2,(15+v*6)*s,rnd(v*3))}
  if(v<.45)pine(p,(24+v*18)*s,v);else if(v<.76)broad(p,v,v>.6?'#5c9a55':'#4f8a4a',v>.6?'#7fb86a':'#6fa860');
  else if(v<.9)bamboo(p,v);else{broad(p,v,'#e9a3b4','#f7cdd6');
    for(let i=0;i<3;i++){const u=(T*.25+i*.33+v)%1;dot({x:p.x+(i*9-12)*s+Math.sin(u*9+i)*5*s,y:p.y-(26-u*28)*s},1.1*s,'#f7b8c6')}}}
function rock(x,y,v){boulder(x+.42,y+.4,.44,18+v*16,v*50);boulder(x+.74,y+.72,.26,9+v*7,v*70);if(v>.5)boulder(x+.2,y+.78,.18,6,v*90)}

function drawRoad(b){const x=b.x,y=b.y,pv=b.k!=='road',c=pv?'#bdb9aa':'#c6aa7a',e=pv?'#8f8b7e':'#a2865a',a=.18,q=.82;
  const cn=(i,j)=>{const o=tile(x+i,y+j);return !!(o&&o.b&&o.b.k!=='farm'&&o.b.k!=='salt'&&o.b.k!=='wall'&&o.b.k!=='tower')};
  const Wt=cn(-1,0),E=cn(1,0),Nn=cn(0,-1),S=cn(0,1),L2=(x0,y0,x1,y1,cc=e,w=pv?1:.8)=>line(P(x+x0,y+y0),P(x+x1,y+y1),cc,w);
  quad(x+a,y+a,q-a,q-a,0,c,c,.6);if(Wt)quad(x,y+a,a,q-a,0,c,c,.6);if(E)quad(x+q,y+a,1-q,q-a,0,c,c,.6);if(Nn)quad(x+a,y,q-a,a,0,c,c,.6);if(S)quad(x+a,y+q,q-a,1-q,0,c,c,.6);
  if(Wt){L2(0,a,a,a);L2(0,q,a,q)}else L2(a,a,a,q);if(E){L2(q,a,1,a);L2(q,q,1,q)}else L2(q,a,q,q);
  if(Nn){L2(a,0,a,a);L2(q,0,q,a)}else L2(a,a,q,a);if(S){L2(a,q,a,1);L2(q,q,q,1)}else L2(a,q,q,q);
  if(pv){const j='rgba(60,55,45,.22)';L2(.5,Nn?0:a,.5,S?1:q,j,.5);L2(Wt?0:a,.5,E?1:q,.5,j,.5);L2(a,.37,q,.37,j,.4);L2(a,.63,q,.63,j,.4);L2(.37,a,.37,q,j,.4);L2(.63,a,.63,q,j,.4)}
  else{const v=rnd(x*13+y*7);for(let i=0;i<3;i++)dot(P(x+.32+rnd(v*9+i)*.36,y+.32+rnd(v*5+i)*.36),.8*s,'#a2865a');
    if(Wt||E){L2(Wt?0:a,.42,E?1:q,.42,'rgba(110,85,50,.3)',.6);L2(Wt?0:a,.58,E?1:q,.58,'rgba(110,85,50,.3)',.6)}
    if(Nn||S){L2(.42,Nn?0:a,.42,S?1:q,'rgba(110,85,50,.3)',.6);L2(.58,Nn?0:a,.58,S?1:q,'rgba(110,85,50,.3)',.6)}}}
function drawGround(){
  for(let y=0;y<N;y++)for(let x=0;x<N;x++){const q=G.map[y*N+x],a=P(x,y);
    if(a.x<-TW*s||a.x>W+TW*s||a.y<-TH*2*s||a.y>H+TH*s)continue;
    quad(x,y,1,1,0,q.c,q.c,.8);
    if(q.t==='g'){if(q.b)continue;const v=q.v;
      if(q.w>1){for(let i=0;i<3;i++)dot(P(x+rnd(v*9+i),y+rnd(v*5+i)),.8*s,'#a8956c')}
      else if(v>.8){const p=P(x+.2+v*.5,y+.5);for(const e of [-2.5,0,2.5])line(p,{x:p.x+e*s,y:p.y-(4.5-Math.abs(e)*.4)*s},'#6f9a58',1)}
      else if(v>.6&&v<.68){const cs=['#fff6d8','#f3c0cf','#f1d35a'];for(let i=0;i<4;i++){const p=P(x+.2+rnd(v*31+i)*.6,y+.2+rnd(v*17+i)*.6);line(p,{x:p.x,y:p.y-2.5*s},'#6f9a58',.7);dot({x:p.x,y:p.y-3*s},1.2*s,cs[i%3])}}
      else if(v>.3&&v<.335){const p=P(x+.5,y+.5);ctx.fillStyle='#a9aaa4';ctx.strokeStyle=OUT;ctx.lineWidth=lw()*.5;ctx.beginPath();ctx.ellipse(p.x,p.y,3.5*s,2.2*s,0,0,7);ctx.fill();ctx.stroke()}}
    else if(q.t==='w'){const sand='#d8cc9c',nb=(i,j)=>{const o=tile(x+i,y+j);return !o||o.t!=='w'};
      if(nb(-1,0)){quad(x,y,.17,1,0,sand,null);line(P(x+.2,y),P(x+.2,y+1),'#ffffff88',1)}
      if(nb(0,-1)){quad(x,y,1,.17,0,sand,null);line(P(x,y+.2),P(x+1,y+.2),'#ffffff88',1)}
      if(nb(1,0)){quad(x+.83,y,.17,1,0,sand,null);line(P(x+.8,y),P(x+.8,y+1),'#ffffff66',1)}
      if(nb(0,1)){quad(x,y+.83,1,.17,0,sand,null);line(P(x,y+.8),P(x+1,y+.8),'#ffffff66',1)}
      const p=P(x+.5,y+.5),o=Math.sin(T*1.6+x*3+y)*3*s;line({x:p.x-7*s+o,y:p.y-2*s},{x:p.x+1*s+o,y:p.y-2*s},'#ffffff77',1);line({x:p.x-1*s-o,y:p.y+3*s},{x:p.x+5*s-o,y:p.y+3*s},'#ffffff44',1);
      if(q.v>.62){const l=P(x+.3+q.v*.3,y+.6);ctx.fillStyle='#5f9a55';ctx.strokeStyle='#3f6f3f';ctx.lineWidth=lw()*.5;ctx.beginPath();ctx.ellipse(l.x,l.y,4.5*s,2.4*s,0,.5,6.6);ctx.lineTo(l.x,l.y);ctx.fill();ctx.stroke();if(q.v>.82)dot({x:l.x+4*s,y:l.y-2*s},1.8*s,'#f3a9c0','#b8607a')}}
    else if(q.t==='r'){for(let i=0;i<3;i++)dot(P(x+rnd(q.v*9+i),y+rnd(q.v*5+i)),.9*s,'#8a8774')}
    else if(q.t==='f'&&q.v>.5){const p=P(x+.15,y+.6);line(p,{x:p.x-2*s,y:p.y-3.5*s},'#5c8a4c',1);line(p,{x:p.x+2*s,y:p.y-3.5*s},'#5c8a4c',1)}}
  poly([P(0,N),P(N,N),P(N,N,-14),P(0,N,-14)],'#8a6a48');poly([P(N,0),P(N,N),P(N,N,-14),P(N,0,-14)],'#6f5338');
  line(P(0,N,-5),P(N,N,-5),'#00000022',1);line(P(N,0,-5),P(N,N,-5),'#00000022',1);line(P(0,N,-10),P(N,N,-10),'#00000022',1);line(P(N,0,-10),P(N,N,-10),'#00000022',1);
  for(const b of G.bl)if(isRoad(b)||b.k==='gate'){const a=P(b.x,b.y);if(a.x<-TW*2*s||a.x>W+TW*2*s||a.y<-TH*3*s||a.y>H+TH*2*s)continue;if(s<.45){quad(b.x,b.y,1,1,0,b.k==='pave'?'#c9c5b6':b.k==='bridge'?'#a98b5a':'#c6aa7a',null);continue}drawRoad(b)}
  // bóng mây trôi
  for(let i=0;i<3;i++){const cx=((T*.35+i*13)%44)-9,cy=4+i*8+Math.sin(i*3)*3,p=P(cx,cy);ctx.fillStyle='rgba(30,50,40,.055)';ctx.beginPath();ctx.ellipse(p.x,p.y,170*s,62*s,0,0,7);ctx.fill()}
  // bóng công trình
  for(const b of G.bl){if(b.building)continue;const x=b.x,y=b.y,k=b.k;{const a=P(x,y);if(a.x<-TW*3*s||a.x>W+TW*3*s||a.y<-TH*6*s||a.y>H+TH*3*s)continue}
    if(k==='hall')shadow(x+.15,y+.15,1.7,1.7,[30,44,62,70][G.era]);else if(k==='house')shadow(x+.15,y+.2,.7,.6,22);
    else if(k==='tower')shadow(x+.1,y+.1,.8,.8,58);else if(k==='wall')shadow(x+.2,y+.2,.6,.6,22);
    else if(k==='barracks')shadow(x+.06,y+.2,.88,.6,22);else if(k==='temple')shadow(x+.2,y+.2,.6,.6,52);else if(k==='gate'||k==='beacon')shadow(x+.15,y+.15,.7,.7,30);
    else if(k!=='farm'&&k!=='salt'&&k!=='canal'&&k!=='tea'&&!isRoad(b))shadow(x+.1,y+.2,.75,.55,15)}}

function drawB(b){const x=b.x,y=b.y,v=rnd(x*17+y*31),pop=Math.min(1,(T-(b.born||-9))*4),k=b.k;
  if(pop<1){const c=P(x+.5,y+.5);ctx.save();ctx.translate(c.x,c.y);ctx.scale(1,.4+.6*pop);ctx.translate(-c.x,-c.y)}
  if(k==='house'){const wc=['#efe6d2','#e6dcc6','#dccdac'][v*3|0],rc=['#5d6b73','#667078','#57626b'][v*7%3|0];
    box(x+.12,y+.17,.76,.66,0,2,'#a9a498');box(x+.15,y+.2,.7,.6,2,11,wc);
    for(const u of [.15,.5,.85])line(P(x+u,y+.8,2),P(x+u,y+.8,13),'#7a4a34',1.5);line(P(x+.85,y+.2,2),P(x+.85,y+.2,13),'#5f3a28',1.5);line(P(x+.15,y+.8,13),P(x+.85,y+.8,13),'#7a4a34',1.6);
    winF(x+.2,y+.8,6,.14,4.5);winR(x+.85,y+.38,6,.22,4.5);door(x+.56,y+.8,2,.18,8,'#6b3a2a');
    if(v>.5)hip(x+.13,y+.18,.74,.64,13,11,rc,.09);else gable(x+.07,y+.12,.86,.76,13,11,rc,wc);
    if(v>.3)lantern(x+.8,y+.86,12,.8);
    if(v>.55){const j=P(x+.3,y+.93);ctx.fillStyle='#8a6248';ctx.strokeStyle=OUT;ctx.lineWidth=lw()*.5;ctx.beginPath();ctx.ellipse(j.x,j.y-3*s,2.6*s,3.2*s,0,0,7);ctx.fill();ctx.stroke()}
    {const p=P(x+.35,y+.45,25);ctx.fillStyle=NIGHT>.5?'#ffffff22':'#ffffff5a';for(let i=0;i<4;i++){const u=(T*.4+i*.25+v)%1;ctx.beginPath();ctx.arc(p.x+Math.sin(u*5+v*9)*3*s,p.y-u*18*s,(1.5+u*3)*s,0,7);ctx.fill()}}}
  else if(k==='farm'){const ripe=((G.tick/60+v*2)%1);quad(x+.03,y+.03,.94,.94,0,'#a8875a',OUT,.7);quad(x+.1,y+.1,.8,.8,0,'#86b8b2',null);
    line(P(x+.1,y+.5),P(x+.9,y+.5),'#a8875a',1.6);
    const gc=b.on?lerpC('#5c9a3f','#d9b53f',ripe):'#8f9a6a';
    for(let i=0;i<6;i++)for(let j=0;j<6;j++){const p=P(x+.17+i*.13,y+.16+j*.135),sw=Math.sin(T*2+i+j*.7)*1.4*s,hh=(4+ripe*4)*s;line(p,{x:p.x+sw-1*s,y:p.y-hh},gc,1.1);line(p,{x:p.x+sw+1.2*s,y:p.y-hh*.85},shade(gc,-.15),1.1)}
    {const p=P(x+.5,y+.3),o=Math.sin(T*2+x)*4*s;line({x:p.x-5*s+o,y:p.y},{x:p.x+2*s+o,y:p.y},'#ffffff66',.8)}
    if(b.on){const u=(T*.08+v)%1;person(x+.15+u*.7,y+.52,'#8a6a4a',v*9,'#f1c9a5','non')}}
  else if(k==='lumber'){for(const [a,c] of [[.1,.12],[.6,.12],[.1,.55],[.6,.55]])line(P(x+a,y+c),P(x+a,y+c,11),'#6b4a2e',1.8);
    gable(x+.05,y+.07,.6,.53,11,8,'#c9b06a','#a87c4f');
    for(const [a,c,z] of [[.14,.3,3],[.26,.3,3],[.38,.3,3],[.2,.3,7.5],[.32,.3,7.5]]){const e=P(x+a,y+c+.2,z);line(P(x+a,y+c-.15,z),e,'#8a6238',4.6);dot(e,2.3*s,'#e0b98a',OUT);dot(e,.9*s,'#b98a55')}
    for(let i=0;i<3;i++){const a=P(x+.2,y+.7+i*.09,3),c=P(x+.9,y+.7+i*.09,3);line(a,c,'#5c3d24',4.6);line(a,c,'#b98a55',3.2);dot(c,2.2*s,'#e0b98a',OUT)}
    {const st=P(x+.78,y+.35);ctx.fillStyle='#b98a55';ctx.strokeStyle=OUT;ctx.lineWidth=lw()*.6;ctx.beginPath();ctx.ellipse(st.x,st.y-3*s,4*s,2.2*s,0,0,7);ctx.fill();ctx.stroke();line({x:st.x,y:st.y-4*s},{x:st.x+5*s,y:st.y-12*s},'#6b4a2e',1.4);poly([{x:st.x-2.5*s,y:st.y-5.5*s},{x:st.x+1*s,y:st.y-3.5*s},{x:st.x+1.5*s,y:st.y-7*s}],'#c9cdd0',OUT,.5)}}
  else if(k==='quarry'){for(const [a,c] of [[.08,.1],[.52,.1],[.08,.5],[.52,.5]])line(P(x+a,y+c),P(x+a,y+c,10),'#6b4a2e',1.8);
    gable(x+.04,y+.06,.52,.48,10,7,'#8a7a66','#b8a98c');
    boulder(x+.3,y+.35,.2,9,v*11);box(x+.58,y+.5,.26,.26,0,6,'#c2c5c6');box(x+.62,y+.54,.2,.2,6,5,'#b3b6b8');box(x+.3,y+.68,.22,.2,0,5,'#bcbfc0');
    {const a=P(x+.75,y+.2),t2=P(x+.82,y+.26,24);line(a,t2,'#6b4a2e',1.6);line(P(x+.9,y+.34),t2,'#6b4a2e',1.6);line(t2,{x:t2.x,y:t2.y+12*s+Math.sin(T*2)*1.5*s},'#3a2a22',.7);box(x+.78,y+.24,.1,.1,3+Math.sin(T*2)*1,4,'#a9acad')}}
  else if(k==='market'){
    for(const [a,c] of [[.08,'#a63a2a'],[.54,'#3f6f7f']]){box(x+a,y+.3,.38,.45,0,6,'#c9a36a');
      for(const [px,py] of [[a,.3],[a+.38,.3],[a,.75],[a+.38,.75]])line(P(x+px,y+py,6),P(x+px,y+py,16),'#6b4a2e',1.3);
      for(let i=0;i<4;i++)poly([P(x+a+i*.095,y+.24,18),P(x+a+(i+1)*.095,y+.24,18),P(x+a+(i+1)*.095,y+.82,14),P(x+a+i*.095,y+.82,14)],i%2?'#e8dcc0':c,OUT,.6);
      for(let i=0;i<3;i++)dot(P(x+a+.08+i*.11,y+.56,7.5),2*s,['#e8a13a','#7fb04a','#d9534a','#e6dcc6'][(i+(a>.3?1:0))%4],OUT);
      lantern(x+a+.19,y+.84,14,.85)}
    for(const [a,c] of [[.2,.92],[.75,.9]]){const q=P(x+a,y+c);poly([{x:q.x-3*s,y:q.y-5*s},{x:q.x+3*s,y:q.y-5*s},{x:q.x+2.2*s,y:q.y},{x:q.x-2.2*s,y:q.y}],'#b98a55',OUT,.5);dot({x:q.x,y:q.y-5.5*s},2.2*s,a<.5?'#e6dcc6':'#d9a441',OUT)}
    {const a=P(x+.05,y+.95,20),c=P(x+.95,y+.95,20);line(P(x+.05,y+.95),a,'#6b4a2e',1.3);line(P(x+.95,y+.95),c,'#6b4a2e',1.3);line(a,c,'#3a2a22',.6);for(let i=1;i<5;i++)lantern(x+.05+i*.18,y+.95,20-Math.sin(i/5*3.14)*2,.6)}}
  else if(k==='wall'){const w=q=>isW(q[0],q[1]);
    const xl=w([x-1,y]),xr=w([x+1,y]),yu=w([x,y-1]),yd=w([x,y+1]),c='#9d998e';
    const x0=xl?0:.22,x1=xr?1:.78,y0=yu?0:.22,y1=yd?1:.78;
    if(xl||xr||!(yu||yd)){box(x+x0,y+.22,x1-x0,.56,0,20,c);bricks(x+x0,y+.22,x1-x0,.56,0,20)}
    if(yu||yd){box(x+.22,y+y0,.56,y1-y0,0,20,c);bricks(x+.22,y+y0,.56,y1-y0,0,20)}
    quad(x+.22,y+.22,.56,.56,20.1,shade(c,.14),null);crenel(x+.2,y+.2,.6,.6,20,c);
    if((x*7+y*3)%4===0){const a=P(x+.5,y+.5,20),f=P(x+.5,y+.5,31);line(a,f,'#4a3a2e',1.3);dot({x:f.x,y:f.y-2*s},(2+Math.sin(T*12+x)*.5)*s,'#ff9a3a');dot({x:f.x,y:f.y-2.5*s},1*s,'#ffe08a');glow(f,26)}}
  else if(k==='tower'){const c='#9d998e';box(x+.06,y+.06,.88,.88,0,3,shade(c,-.1));box(x+.1,y+.1,.8,.8,3,23,c);bricks(x+.1,y+.1,.8,.8,3,23);
    door(x+.42,y+.9,3,.16,10,'#4a3a2e');winR(x+.9,y+.42,14,.14,6);crenel(x+.08,y+.08,.84,.84,26,c);
    box(x+.24,y+.24,.52,.52,26,12,'#e6dcc6');pillars(x+.24,y+.24,.52,.52,26,12);winF(x+.4,y+.76,30,.2,5);
    hip(x+.2,y+.2,.6,.6,38,7,'#57626b',.15);
    box(x+.32,y+.32,.36,.36,45,8,'#a63a2a');winF(x+.42,y+.68,47,.16,4);hip(x+.28,y+.28,.44,.44,53,10,'#57626b',.13);
    dot(P(x+.5,y+.5,65),1.8*s,'#e3bd3f',OUT);lantern(x+.8,y+.8,38,.7);flag(x+.92,y+.92,26,22,'#e3bd3f')}
  else if(k==='barracks'){box(x+.03,y+.17,.94,.66,0,2,'#a9a498');box(x+.06,y+.2,.88,.6,2,12,'#d9c7a3');pillars(x+.06,y+.2,.88,.6,2,12,'#6b3a2a');
    winF(x+.14,y+.8,6,.16,5);winF(x+.7,y+.8,6,.16,5);winR(x+.94,y+.4,6,.2,5);door(x+.4,y+.8,2,.2,9,'#3a2a22');
    hip(x+.04,y+.18,.92,.64,14,12,'#4a545c',.09);
    for(let i=0;i<4;i++){const a=P(x+.12+i*.06,y+.95),t2=P(x+.12+i*.06,y+.93,15);line(a,t2,'#6b4a2e',1);poly([{x:t2.x-1.4*s,y:t2.y},{x:t2.x+1.4*s,y:t2.y},{x:t2.x,y:t2.y-4.5*s}],'#d0d4d8',OUT,.4)}
    line(P(x+.08,y+.94,8),P(x+.34,y+.94,8),'#6b4a2e',1.2);
    {const d2=P(x+.72,y+.95);line(d2,{x:d2.x,y:d2.y-11*s},'#6b4a2e',1.4);line({x:d2.x-4*s,y:d2.y-8*s},{x:d2.x+4*s,y:d2.y-8*s},'#6b4a2e',1.2);dot({x:d2.x,y:d2.y-12.5*s},2.4*s,'#d9c08a',OUT)}
    flag(x+.97,y+.97,0,30,b.on?'#a63a2a':'#888');flag(x+.03,y+.97,0,26,b.on?'#2f2a2a':'#888')}
  else if(k==='granary'){for(const [a,c] of [[.2,.25],[.8,.25],[.2,.75],[.8,.75]])box(x+a-.04,y+c-.04,.08,.08,0,4,'#8a8478');
    box(x+.14,y+.2,.72,.6,4,11,'#c9a36a');for(let i=1;i<5;i++)line(P(x+.14+i*.144,y+.8,4),P(x+.14+i*.144,y+.8,15),'#8a6238',.8);
    door(x+.42,y+.8,4,.16,8,'#5c3d24');gable(x+.08,y+.14,.84,.72,15,11,'#d8b866','#c9a36a');
    for(const [a,c,z] of [[.1,.94,0],[.23,.94,0],[.165,.94,4.5]]){const q=P(x+a,y+c,z);ctx.fillStyle='#e6d9b0';ctx.strokeStyle=OUT;ctx.lineWidth=lw()*.5;ctx.beginPath();ctx.ellipse(q.x,q.y-3*s,3.8*s,2.7*s,0,0,7);ctx.fill();ctx.stroke()}}
  else if(k==='temple'){box(x+.1,y+.1,.8,.8,0,3,'#a9a498');let z=3,w=.56;
    for(let i=0;i<4;i++){const o=(1-w)/2;box(x+o,y+o,w,w,z,8,i%2?'#e6dcc6':'#a63a2a');if(i===0)door(x+.44,y+o+w,z,.12,6,'#3a2a22');else winF(x+.45,y+o+w,z+2,.1,4);hip(x+o-.02,y+o-.02,w+.04,w+.04,z+8,5,'#8a7a4a',.11);z+=12;w-=.09}
    line(P(x+.5,y+.5,z),P(x+.5,y+.5,z+11),'#e3bd3f',1.8);dot(P(x+.5,y+.5,z+4),1.6*s,'#e3bd3f',OUT);dot(P(x+.5,y+.5,z+11),2*s,'#f1c232',OUT);
    {const u=P(x+.88,y+.92);box(x+.83,y+.87,.1,.1,0,4,'#6f6a5e');ctx.fillStyle='#ffffff55';for(let i=0;i<3;i++){const q=(T*.4+i*.33+v)%1;ctx.beginPath();ctx.arc(u.x+Math.sin(q*6)*2*s,u.y-(7+q*14)*s,(1+q*2)*s,0,7);ctx.fill()}}
    if(b.on)person(x+.18,y+.93,'#d08a2a',v*9,'#f1c9a5','bald')}
  else if(k==='school'){box(x+.08,y+.14,.84,.72,0,3,'#a9a498');box(x+.14,y+.2,.72,.6,3,12,'#f2ede0');pillars(x+.14,y+.2,.72,.6,3,12,'#2f5a4a');
    winF(x+.2,y+.8,7,.16,5);winF(x+.64,y+.8,7,.16,5);winR(x+.86,y+.4,7,.2,5);door(x+.42,y+.8,3,.16,9,'#6b3a2a');plaque(x+.4,y+.8,12.5,.2);
    hip(x+.12,y+.18,.76,.64,15,12,'#3f6a6a',.1);bamboo(P(x+.95,y+.3),v);
    if(b.on)person(x+.28,y+.95,'#dfe6ea',v*7,'#f1c9a5','futou')}
  else if(k==='salt'){quad(x+.03,y+.03,.94,.94,0,'#b9ae96',OUT,.7);for(let i=0;i<2;i++)for(let j=0;j<2;j++)quad(x+.09+i*.43,y+.09+j*.43,.39,.39,0,(i+j)%2?'#eef3f4':'#cfe0e4',null);
    for(const [a,c] of [[.28,.28],[.72,.3],[.3,.72]]){const q=P(x+a,y+c);poly([{x:q.x-4.5*s,y:q.y},{x:q.x+4.5*s,y:q.y},{x:q.x,y:q.y-6.5*s}],'#ffffff',OUT,.5)}
    if(b.on)person(x+.7,y+.72,'#8a6a4a',v*9,'#f1c9a5','non')}
  else if(k==='silk'){box(x+.06,y+.1,.62,.64,0,2,'#a9a498');box(x+.1,y+.14,.54,.56,2,11,'#efe6d2');winF(x+.16,y+.7,6,.14,5);door(x+.4,y+.7,2,.14,8,'#6b3a2a');hip(x+.08,y+.12,.58,.6,13,10,'#667078',.09);
    line(P(x+.8,y+.15),P(x+.8,y+.15,17),'#6b4a2e',1.3);line(P(x+.8,y+.92),P(x+.8,y+.92,17),'#6b4a2e',1.3);line(P(x+.8,y+.15,17),P(x+.8,y+.92,17),'#6b4a2e',1);
    ['#d9534a','#e3bd3f','#3f8fbf','#7fb04a','#b06ab3'].forEach((c,i)=>{const yy=y+.2+i*.14,sw=Math.sin(T*2+i)*.025;poly([P(x+.8,yy,17),P(x+.8,yy+.11,17),P(x+.8+sw,yy+.11,5),P(x+.8+sw,yy,5)],c,OUT,.5)})}
  else if(k==='kiln'){const q=P(x+.42,y+.45);ctx.fillStyle='#b0714f';ctx.strokeStyle=OUT;ctx.lineWidth=lw();ctx.beginPath();ctx.ellipse(q.x,q.y,16*s,7.5*s,0,0,3.1416);ctx.ellipse(q.x,q.y,16*s,18*s,0,3.1416,6.2832);ctx.closePath();ctx.fill();ctx.stroke();
    ctx.strokeStyle='rgba(60,30,20,.3)';ctx.lineWidth=lw()*.5;for(const r of [.75,.5]){ctx.beginPath();ctx.ellipse(q.x,q.y,16*s*r+2*s,18*s*r,0,3.3,6.1);ctx.stroke()}
    box(x+.3,y+.26,.12,.12,15,12,'#8a5a44');{const sp=P(x+.36,y+.32,29);ctx.fillStyle='#ffffff55';for(let i=0;i<4;i++){const u=(T*.35+i*.25+v)%1;ctx.beginPath();ctx.arc(sp.x+Math.sin(u*5)*3*s,sp.y-u*20*s,(2+u*3.5)*s,0,7);ctx.fill()}}
    {const m=P(x+.55,y+.72,3);ctx.fillStyle='#2a1810';ctx.beginPath();ctx.ellipse(m.x,m.y,4*s,4.5*s,0,0,7);ctx.fill();if(b.on){dot(m,(2.4+Math.sin(T*9)*.4)*s,'#ff8a2a');glow(m,26,'255,130,50')}}
    for(const [a,c] of [[.8,.5],[.88,.62],[.76,.68],[.86,.8]]){const j=P(x+a,y+c);ctx.fillStyle='#9fc5b0';ctx.strokeStyle=OUT;ctx.lineWidth=lw()*.5;ctx.beginPath();ctx.ellipse(j.x,j.y-3*s,2.3*s,3*s,0,0,7);ctx.fill();ctx.stroke()}}
  else if(k==='inn'){box(x+.08,y+.12,.7,.62,0,2,'#a9a498');box(x+.12,y+.16,.62,.54,2,12,'#e6dcc6');pillars(x+.12,y+.16,.62,.54,2,12,'#6b3a2a');winF(x+.18,y+.7,6,.14,5);winR(x+.74,y+.3,6,.2,5);door(x+.42,y+.7,2,.16,9,'#4a3a2e');
    hip(x+.1,y+.14,.66,.58,14,11,'#5d6b73',.09);lantern(x+.68,y+.76,13,.85);flag(x+.95,y+.95,0,30,'#3f6f7f');
    line(P(x+.1,y+.93,6),P(x+.4,y+.93,6),'#6b4a2e',1.3);line(P(x+.1,y+.93),P(x+.1,y+.93,6),'#6b4a2e',1.3);line(P(x+.4,y+.93),P(x+.4,y+.93,6),'#6b4a2e',1.3);
    if(b.on)horse(x+.62,y+.94,'#8a5a3a')}
  else if(k==='gate'){const xl=isW(x-1,y),xr=isW(x+1,y),yu=isW(x,y-1),yd=isW(x,y+1),c='#9d998e',dk='#2a2420';
    if(xl||xr||!(yu||yd)){box(x,y+.18,1,.64,0,26,c);bricks(x,y+.18,1,.64,0,26);
      poly([P(x+.3,y+.82,0),P(x+.7,y+.82,0),P(x+.7,y+.82,13),P(x+.5,y+.82,19),P(x+.3,y+.82,13)],dk,OUT,.8);line(P(x+.5,y+.82,0),P(x+.5,y+.82,19),'#6b3a2a',.8);
      crenel(x,y+.18,1,.64,26,c);box(x+.25,y+.3,.5,.4,26,9,'#a63a2a');pillars(x+.25,y+.3,.5,.4,26,9,'#7a2a20');winF(x+.42,y+.7,28.5,.16,4.5);hip(x+.2,y+.25,.6,.5,35,10,'#57626b',.14);
      lantern(x+.22,y+.84,20,.9);lantern(x+.78,y+.84,20,.9)}
    else{box(x+.18,y,.64,1,0,26,c);bricks(x+.18,y,.64,1,0,26);
      poly([P(x+.82,y+.3,0),P(x+.82,y+.7,0),P(x+.82,y+.7,13),P(x+.82,y+.5,19),P(x+.82,y+.3,13)],dk,OUT,.8);line(P(x+.82,y+.5,0),P(x+.82,y+.5,19),'#6b3a2a',.8);
      crenel(x+.18,y,.64,1,26,c);box(x+.3,y+.25,.4,.5,26,9,'#a63a2a');pillars(x+.3,y+.25,.4,.5,26,9,'#7a2a20');winR(x+.7,y+.42,28.5,.16,4.5);hip(x+.25,y+.2,.5,.6,35,10,'#57626b',.14);
      lantern(x+.84,y+.22,20,.9);lantern(x+.84,y+.78,20,.9)}
    flag(x+.5,y+.5,45,16,'#a63a2a')}
  else if(k==='beacon'){const c='#a39f92',big=G.raid?1.9:1;box(x+.12,y+.12,.76,.76,0,14,c);bricks(x+.12,y+.12,.76,.76,0,14);box(x+.2,y+.2,.6,.6,14,14,c);bricks(x+.2,y+.2,.6,.6,14,14);crenel(x+.18,y+.18,.64,.64,28,c);
    line(P(x+.9,y+.55),P(x+.8,y+.55,28),'#6b4a2e',1.2);line(P(x+.9,y+.68),P(x+.8,y+.68,28),'#6b4a2e',1.2);for(let i=1;i<6;i++)line(P(x+.9-i*.0166,y+.55,i*4.6),P(x+.9-i*.0166,y+.68,i*4.6),'#6b4a2e',.8);
    const f=P(x+.5,y+.5,31);poly([{x:f.x-5*s,y:f.y-2*s},{x:f.x+5*s,y:f.y-2*s},{x:f.x+3*s,y:f.y+3*s},{x:f.x-3*s,y:f.y+3*s}],'#3a3530',OUT,.6);
    for(let i=0;i<3;i++)dot({x:f.x+(i-1)*2*s+Math.sin(T*11+i)*s,y:f.y-(4+i%2*3+Math.sin(T*13+i)*1.5)*s*big},(3.2-i*.6)*s*big,i===1?'#ffe08a':'#ff8a2a');glow(f,36*big,'255,150,60');
    if(G.raid){ctx.fillStyle='rgba(70,70,70,.35)';for(let i=0;i<6;i++){const u=(T*.3+i/6)%1;ctx.beginPath();ctx.arc(f.x+Math.sin(u*4+i)*5*s+u*14*s,f.y-(10+u*46)*s,(3+u*7)*s,0,7);ctx.fill()}}}
  else if(k==='armory'){box(x+.08,y+.12,.62,.6,0,13,'#8f8a80');bricks(x+.08,y+.12,.62,.6,0,13);door(x+.3,y+.72,0,.2,9,'#2a2420');winR(x+.7,y+.3,6,.18,5);
    hip(x+.06,y+.1,.66,.64,13,10,'#4a545c',.08);box(x+.5,y+.2,.12,.12,19,11,'#6f6a62');{const sp=P(x+.56,y+.26,32);ctx.fillStyle='#55555555';for(let i=0;i<4;i++){const u=(T*.35+i*.25+v)%1;ctx.beginPath();ctx.arc(sp.x+Math.sin(u*5)*3*s,sp.y-u*20*s,(2+u*3.5)*s,0,7);ctx.fill()}}
    if(b.on){const m=P(x+.4,y+.73,4);dot(m,(2.2+Math.sin(T*10)*.4)*s,'#ff8a2a');glow(m,24,'255,130,50')}
    box(x+.78,y+.62,.14,.1,0,5,'#3a3f44');
    for(let i=0;i<4;i++){const a=P(x+.78+i*.045,y+.34),t2=P(x+.78+i*.045,y+.3,14);line(a,t2,i%2?'#c9cdd0':'#6b4a2e',1.1);if(i%2===0)poly([{x:t2.x-1.3*s,y:t2.y},{x:t2.x+1.3*s,y:t2.y},{x:t2.x,y:t2.y-4*s}],'#d0d4d8',OUT,.4)}
    line(P(x+.76,y+.33,7),P(x+.94,y+.33,7),'#6b4a2e',1.1)}
  else if(k==='stable'){for(const [a,c] of [[.06,.1],[.92,.1],[.06,.52],[.92,.52]])line(P(x+a,y+c),P(x+a,y+c,12),'#6b4a2e',1.8);
    quad(x+.06,y+.1,.86,.42,0,'#b99a62',null);gable(x+.02,y+.06,.94,.5,12,8,'#c9b06a','#a87c4f');
    horse(x+.3,y+.72,'#8a5a3a');horse(x+.66,y+.78,'#3a2f2a');
    for(const u of [.04,.34,.64,.95])line(P(x+u,y+.95),P(x+u,y+.95,6),'#6b4a2e',1.3);line(P(x+.04,y+.95,5.5),P(x+.95,y+.95,5.5),'#6b4a2e',1.1);line(P(x+.04,y+.95,3),P(x+.95,y+.95,3),'#6b4a2e',1.1);
    line(P(x+.95,y+.55,5.5),P(x+.95,y+.95,5.5),'#5c3d24',1.1)}
  if(pop<1)ctx.restore();
  if(B[k]&&B[k].job&&!b.on){const p=P(x+.5,y+.5,34+Math.sin(T*4)*2);ctx.font=`${13*s}px sans-serif`;ctx.textAlign='center';ctx.fillText('💤',p.x,p.y)}}

function steps(x,y,z,w){for(let i=0;i<3;i++)box(x-i*.03,y,w+i*.06,.05+i*.045,0,z-i*z/3,'#b9b4a6')}
function rail(x,y,w,d,z){const c='#d9d4c6';for(let i=0;i<=8;i++){if(i>2&&i<6)continue;line(P(x+w*i/8,y+d,z),P(x+w*i/8,y+d,z+5),c,1.4)}
  line(P(x,y+d,z+5),P(x+w*.25,y+d,z+5),c,1.2);line(P(x+w*.75,y+d,z+5),P(x+w,y+d,z+5),c,1.2);
  for(let i=0;i<=6;i++)line(P(x+w,y+d*i/6,z),P(x+w,y+d*i/6,z+5),shade(c,-.15),1.4);line(P(x+w,y,z+5),P(x+w,y+d,z+5),shade(c,-.15),1.2)}
function plaque(x,y,z,w){poly([P(x,y,z),P(x+w,y,z),P(x+w,y,z+5),P(x,y,z+5)],'#27407a','#e3bd3f',.9);line(P(x+w*.25,y,z+2.5),P(x+w*.75,y,z+2.5),'#e3bd3f',1)}
function drawHall(){const x=G.hx,y=G.hy,e=G.era,st='#aca79a',gr='#57626b';
  if(e===0){box(x+.25,y+.3,1.5,1.4,0,2,'#a9a498');box(x+.3,y+.35,1.4,1.3,2,15,'#b98a55');
    for(const u of [.3,.76,1.24,1.7])line(P(x+u,y+1.65,2),P(x+u,y+1.65,17),'#6b4a2e',1.6);
    winF(x+.42,y+1.65,7,.22,6);winF(x+1.36,y+1.65,7,.22,6);winR(x+1.7,y+.8,7,.3,6);door(x+.85,y+1.65,2,.3,11,'#5c3d24');
    gable(x+.18,y+.22,1.64,1.56,17,19,'#d8b866','#b98a55');
    lantern(x+.8,y+1.72,16);lantern(x+1.2,y+1.72,16);
    for(const [a,c] of [[1.75,1.85],[1.9,1.7],[.2,1.9]]){const q=P(x+a,y+c);poly([{x:q.x-3.4*s,y:q.y-6*s},{x:q.x+3.4*s,y:q.y-6*s},{x:q.x+2.6*s,y:q.y},{x:q.x-2.6*s,y:q.y}],'#b98a55',OUT,.5);dot({x:q.x,y:q.y-6.5*s},2.6*s,'#e3c66a',OUT)}
    flag(x+.1,y+1.6,0,32,'#8a6a4a')}
  else if(e===1){
    box(x+.08,y+.08,1.84,1.84,0,6,st);bricks(x+.08,y+.08,1.84,1.84,0,6);steps(x+.78,y+1.92,6,.44);
    box(x+.3,y+.35,1.4,1.2,6,20,'#efe6d2');pillars(x+.3,y+.35,1.4,1.2,6,20);
    winF(x+.4,y+1.55,13,.26,8);winF(x+1.34,y+1.55,13,.26,8);winR(x+1.7,y+.55,13,.3,8);winR(x+1.7,y+1.05,13,.3,8);
    door(x+.82,y+1.55,6,.36,14,'#6b3a2a');plaque(x+.82,y+1.55,21,.36);
    hip(x+.22,y+.27,1.56,1.36,26,22,gr,.18);
    lantern(x+.45,y+1.68,25);lantern(x+1.55,y+1.68,25);
    {const d2=P(x+1.75,y+1.75,6);box(x+1.68,y+1.68,.14,.14,6,5,'#6b3a2a');dot({x:d2.x,y:d2.y-9*s},4*s,'#c9a36a',OUT);dot({x:d2.x,y:d2.y-9*s},2*s,'#a63a2a')}
    flag(x+.12,y+1.88,6,32,'#3f6f7f')}
  else{const gold=e===3,rf=gold?'#d9a82e':'#3f5a50',wl='#efe6d2',rd='#a63a2a';
    box(x+.02,y+.02,1.96,1.96,0,10,st);bricks(x+.02,y+.02,1.96,1.96,0,10);steps(x+.72,y+1.98,10,.56);
    box(x+1.5,y+.1,.38,.38,10,16,rd);hip(x+1.46,y+.06,.46,.46,26,10,rf,.11);
    box(x+.12,y+.1,.38,.38,10,16,rd);hip(x+.08,y+.06,.46,.46,26,10,rf,.11);
    box(x+.3,y+.45,1.4,1.1,10,18,wl);pillars(x+.3,y+.45,1.4,1.1,10,18);
    winF(x+.38,y+1.55,15,.28,8);winF(x+1.34,y+1.55,15,.28,8);winR(x+1.7,y+.6,15,.28,8);winR(x+1.7,y+1.1,15,.28,8);
    door(x+.8,y+1.55,10,.4,13,'#6b3a2a');plaque(x+.82,y+1.55,23.5,.36);
    hip(x+.2,y+.35,1.6,1.3,28,10,rf,.22);
    box(x+.5,y+.62,1,.76,37,10,rd);pillars(x+.5,y+.62,1,.76,37,10,'#7a2a20');winF(x+.6,y+1.38,39.5,.2,5);winF(x+1.2,y+1.38,39.5,.2,5);winF(x+.9,y+1.38,39.5,.2,5);
    hip(x+.42,y+.54,1.16,.92,47,gold?24:19,rf,.2);
    if(gold){dot(P(x+1,y+1,74),3*s,'#f1c232',OUT);glow(P(x+1,y+1,74),40,'255,220,120')}
    lantern(x+.35,y+1.7,27,1.1);lantern(x+1.65,y+1.7,27,1.1);lantern(x+1.82,y+.6,27,1);
    box(x+.12,y+1.5,.38,.38,10,14,rd);winF(x+.22,y+1.88,15,.18,5);hip(x+.08,y+1.46,.46,.46,24,10,rf,.11);
    box(x+1.5,y+1.5,.38,.38,10,14,rd);winF(x+1.6,y+1.88,15,.18,5);hip(x+1.46,y+1.46,.46,.46,24,10,rf,.11);
    rail(x+.04,y+.04,1.92,1.92,10);
    {const u=P(x+1,y+2.25);box(x+.93,y+2.18,.14,.14,0,5,'#6f6a5e');dot({x:u.x,y:u.y-8*s},3*s,'#8a7a5a',OUT);ctx.fillStyle='#ffffff55';for(let i=0;i<3;i++){const q=(T*.4+i*.33)%1;ctx.beginPath();ctx.arc(u.x+Math.sin(q*6)*2*s,u.y-(11+q*16)*s,(1+q*2)*s,0,7);ctx.fill()}}
    flag(x+1.98,y+1.98,10,36,gold?'#d9a82e':rd);flag(x+.02,y+1.98,10,36,gold?'#d9a82e':rd);
    if(gold){const p=P(x+1,y+1,108+Math.sin(T*2)*3);ctx.font=`${20*s}px sans-serif`;ctx.textAlign='center';ctx.fillText('👑',p.x,p.y)}}}
const ST={nong:['#8a6a4a','non'],cong:['#6b7f8f','bun'],thuong:['#7a4f8a','bun'],binh:['#7a2f2a','helm'],si:['#dfe6ea','futou'],tang:['#d08a2a','bald'],quan:['#a8242a','wing'],luu:['#9a8a7a','bun']};
