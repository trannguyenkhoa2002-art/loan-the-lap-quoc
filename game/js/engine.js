'use strict';
// Engine isometric: sao chép từ demo-thanh-tri (primitives).
const cv=document.getElementById('c');let ctx=cv.getContext('2d');const MAINCTX=ctx;
let W=0,H=0,DPR=1,s=1.2,ox=0,oy=0,T=0;
const TW=64,TH=32,OUT='#2b3034',N=LT.N;
let G=null;
const P=(x,y,z=0)=>({x:ox+(x-y)*TW/2*s,y:oy+(x+y)*TH/2*s-z*s});
const shade=(hex,k)=>{const n=parseInt(hex.slice(1),16),c=[n>>16,n>>8&255,n&255].map(v=>Math.max(0,Math.min(255,Math.round(k>0?v+(255-v)*k:v*(1+k)))));return'#'+c.map(v=>v.toString(16).padStart(2,'0')).join('')};
let lw=()=>Math.max(.7,s*.75);
const rnd=i=>{const x=Math.sin(i*127.1+31.7)*43758.5453;return x-Math.floor(x)};
function poly(pts,fill,stroke,w=1){ctx.beginPath();ctx.moveTo(pts[0].x,pts[0].y);for(let i=1;i<pts.length;i++)ctx.lineTo(pts[i].x,pts[i].y);ctx.closePath();if(fill){ctx.fillStyle=fill;ctx.fill()}const st=stroke===undefined?OUT:stroke;if(st){ctx.strokeStyle=st;ctx.lineWidth=lw()*w;ctx.lineJoin='round';ctx.stroke()}}
function line(a,b,col,w=1){ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.strokeStyle=col;ctx.lineWidth=lw()*w;ctx.lineCap='round';ctx.stroke()}
function dot(p,r,col,st){ctx.beginPath();ctx.arc(p.x,p.y,r,0,7);ctx.fillStyle=col;ctx.fill();if(st){ctx.strokeStyle=st;ctx.lineWidth=lw()*.6;ctx.stroke()}}
function box(x,y,w,d,z0,h,col,kTop=.12){const z1=z0+h;
  poly([P(x,y+d,z0),P(x+w,y+d,z0),P(x+w,y+d,z1),P(x,y+d,z1)],shade(col,-.1));
  poly([P(x+w,y,z0),P(x+w,y+d,z0),P(x+w,y+d,z1),P(x+w,y,z1)],shade(col,-.28));
  poly([P(x,y,z1),P(x+w,y,z1),P(x+w,y+d,z1),P(x,y+d,z1)],shade(col,kTop));}
function gable(x,y,w,d,z,h,col,wall){const A=P(x,y+d/2,z+h),Bq=P(x+w,y+d/2,z+h),D=P(x,y+d,z),C=P(x+w,y+d,z);
  poly([P(x,y,z),P(x+w,y,z),Bq,A],shade(col,-.3));
  poly([P(x+w,y,z),C,Bq],shade(wall,-.28));
  poly([D,C,Bq,A],col);
  const n=Math.max(3,Math.round(w*9)),c2=shade(col,-.25);for(let i=1;i<n;i++){const u=i/n;line({x:A.x+(Bq.x-A.x)*u,y:A.y+(Bq.y-A.y)*u},{x:D.x+(C.x-D.x)*u,y:D.y+(C.y-D.y)*u},c2,.5)}
  line(D,C,shade(col,.3),1.3);line(A,Bq,shade(col,-.5),2.2)}
function cone(x,y,w,d,z,h,col){const a=P(x+w/2,y+d/2,z+h);
  poly([P(x,y+d,z),P(x+w,y+d,z),a],col);poly([P(x+w,y,z),P(x+w,y+d,z),a],shade(col,-.25));}
function hip(x,y,w,d,z,h,col,o=.1){
  const x0=x-o,y0=y-o,x1=x+w+o,y1=y+d+o,W2=x1-x0,D2=y1-y0,ix=W2*.2,iy=D2*.25,zm=z+h*.36,rx=W2*.3,ym=(y0+y1)/2;
  const A=P(x0,y0,z),Bc=P(x1,y0,z),C=P(x1,y1,z),D=P(x0,y1,z);
  const Ma=P(x0+ix,y0+iy,zm),Mb=P(x1-ix,y0+iy,zm),Mc=P(x1-ix,y1-iy,zm),Md=P(x0+ix,y1-iy,zm);
  const R1=P(x0+rx,ym,z+h),R2=P(x1-rx,ym,z+h),dk=shade(col,-.45);
  poly([A,Bc,Mb,Ma],shade(col,-.4));poly([Ma,Mb,R2,R1],shade(col,-.4));
  poly([Bc,C,Mc,Mb],shade(col,-.16));poly([Mb,Mc,R2],shade(col,-.28));
  poly([D,C,Mc,Md],shade(col,.1));poly([Md,Mc,R2,R1],col);
  const n=Math.max(3,Math.round(W2*9)),m=Math.max(2,Math.round(D2*6)),L=(a,b,u)=>({x:a.x+(b.x-a.x)*u,y:a.y+(b.y-a.y)*u});
  ctx.strokeStyle=shade(col,-.28);ctx.lineWidth=lw()*.5;ctx.beginPath();
  for(let i=1;i<n;i++){const u=i/n,a=L(D,C,u),b=L(Md,Mc,u),c=L(R1,R2,u);ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.lineTo(c.x,c.y)}
  for(let i=1;i<m;i++){const u=i/m,a=L(Bc,C,u),b=L(Mb,Mc,u);ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.lineTo(R2.x,R2.y)}ctx.stroke();
  line(D,C,shade(col,.38),1.5);line(C,Bc,shade(col,.12),1.5);
  line(C,Mc,dk,1.8);line(Mc,R2,dk,1.8);line(D,Md,dk,1.6);line(Md,R1,dk,1.6);line(Bc,Mb,dk,1.4);line(Mb,R2,dk,1.4);
  line(R1,R2,dk,2.8);
  const up=(q,ex,ey)=>{ctx.beginPath();ctx.moveTo(q.x-ex*4*s,q.y-ey*2*s-1*s);ctx.quadraticCurveTo(q.x+ex*1*s,q.y+1*s,q.x+ex*6*s,q.y-6*s);ctx.strokeStyle=OUT;ctx.lineWidth=lw()*2;ctx.lineCap='round';ctx.stroke()};
  up(D,-1,0);up(Bc,1,0);ctx.beginPath();ctx.moveTo(C.x,C.y-3*s);ctx.quadraticCurveTo(C.x,C.y+2*s,C.x,C.y-7*s);ctx.strokeStyle=OUT;ctx.lineWidth=lw()*2;ctx.stroke();
  for(const [q,e] of [[R1,-1],[R2,1]]){ctx.beginPath();ctx.moveTo(q.x,q.y);ctx.quadraticCurveTo(q.x+e*4*s,q.y-1*s,q.x+e*2.5*s,q.y-6*s);ctx.strokeStyle=OUT;ctx.lineWidth=lw()*2;ctx.stroke()}}
function pillars(x,y,w,d,z,h,col='#a63a2a'){for(let i=0;i<=3;i++){line(P(x+w*i/3,y+d,z),P(x+w*i/3,y+d,z+h),col,2)}for(let i=0;i<=2;i++)line(P(x+w,y+d*i/2,z),P(x+w,y+d*i/2,z+h),shade(col,-.2),2)}
function merlons(x,y,w,d,z,col){const m=.2*Math.min(w,d)+.06;for(const [a,b] of [[x,y],[x+w-m,y],[x,y+d-m],[x+w-m,y+d-m]])box(a,b,m,m,z,6,col)}
function flag(x,y,z,h,col){const a=P(x,y,z),b=P(x,y,z+h);line(a,b,OUT,1.4);const wv=Math.sin(T*4+x)*2*s;
  poly([b,{x:b.x+9*s,y:b.y+1*s},{x:b.x+9*s+wv,y:b.y+15*s},{x:b.x+4.5*s+wv,y:b.y+12*s},{x:b.x,y:b.y+15*s}],col)}
function door(x,y,z,w,h,col){poly([P(x,y,z),P(x+w,y,z),P(x+w,y,z+h),P(x,y,z+h)],col,OUT,.7)}
function person(x,y,body,ph,head='#f1c9a5',hat='bun',carry=0,spear=0){if(typeof figPerson==='function')return figPerson(x,y,body,ph,hat,carry,spear);const p=P(x,y),st=Math.sin(T*9+ph),b=Math.abs(st)*1.2*s,Y=p.y-b,lg=hat==='futou'||hat==='wing'||hat==='bald';
  ctx.fillStyle='rgba(0,0,0,.15)';ctx.beginPath();ctx.ellipse(p.x,p.y,4.5*s,2*s,0,0,7);ctx.fill();
  if(!lg){line({x:p.x-1.2*s,y:Y-3*s},{x:p.x-1.2*s-st*1.6*s,y:p.y},'#3a2f28',1.5);line({x:p.x+1.2*s,y:Y-3*s},{x:p.x+1.2*s+st*1.6*s,y:p.y},'#3a2f28',1.5)}
  const bot=lg?Y-.6*s:Y-2.5*s,bw=lg?3.6:3.1;
  poly([{x:p.x-2.2*s,y:Y-10*s},{x:p.x+2.2*s,y:Y-10*s},{x:p.x+bw*s,y:bot},{x:p.x-bw*s,y:bot}],body,OUT,.6);
  line({x:p.x-2.5*s,y:Y-6*s},{x:p.x+2.5*s,y:Y-6*s},hat==='wing'?'#1f1b1a':shade(body,-.45),1);line({x:p.x,y:Y-10*s},{x:p.x-1*s,y:Y-6*s},shade(body,.35),.7);
  if(hat==='helm'){poly([{x:p.x-2.6*s,y:Y-10*s},{x:p.x+2.6*s,y:Y-10*s},{x:p.x+2.2*s,y:Y-6.3*s},{x:p.x-2.2*s,y:Y-6.3*s}],'#8f959b',OUT,.5)}
  if(carry){const a={x:p.x-8*s,y:Y-9.5*s+st*.6*s},c={x:p.x+8*s,y:Y-9.5*s-st*.6*s};line(a,c,'#6b4a2e',1.1);
    for(const q of [a,c]){line(q,{x:q.x,y:q.y+4*s},'#6b4a2e',.6);poly([{x:q.x-2.4*s,y:q.y+4*s},{x:q.x+2.4*s,y:q.y+4*s},{x:q.x+1.6*s,y:q.y+7*s},{x:q.x-1.6*s,y:q.y+7*s}],'#c9a36a',OUT,.5)}}
  if(spear){const a={x:p.x+4.2*s,y:Y},c={x:p.x+4.2*s,y:Y-19*s};line(a,c,'#6b4a2e',1.1);poly([{x:c.x-1.3*s,y:c.y},{x:c.x+1.3*s,y:c.y},{x:c.x,y:c.y-4.5*s}],'#d0d4d8',OUT,.4);dot({x:c.x,y:c.y+1.5*s},1*s,'#c0392b')}
  const hy=Y-12.3*s;dot({x:p.x,y:hy},2.5*s,head,OUT);
  const dome=(c,r)=>{ctx.fillStyle=c;ctx.beginPath();ctx.arc(p.x,hy-.6*s,r*s,3.14,6.29);ctx.closePath();ctx.fill();ctx.strokeStyle=OUT;ctx.lineWidth=lw()*.5;ctx.stroke()};
  if(hat==='non')poly([{x:p.x-5.2*s,y:hy-.7*s},{x:p.x+5.2*s,y:hy-.7*s},{x:p.x,y:hy-5.2*s}],'#e6d28a',OUT,.6);
  else if(hat==='helm'){dome('#9aa0a6',3);line({x:p.x,y:hy-3.6*s},{x:p.x,y:hy-6*s},'#6f757b',1);dot({x:p.x,y:hy-6.2*s},1*s,'#c0392b')}
  else if(hat==='futou'||hat==='wing'){dome('#1f1b1a',2.8);poly([{x:p.x-1.3*s,y:hy-2.8*s},{x:p.x+1.6*s,y:hy-2.8*s},{x:p.x+1.6*s,y:hy-5.2*s},{x:p.x-1.3*s,y:hy-5.2*s}],'#1f1b1a',OUT,.4);
    if(hat==='wing')line({x:p.x-6.5*s,y:hy-1.6*s},{x:p.x+6.5*s,y:hy-1.6*s},'#1f1b1a',1.3);else{line({x:p.x-1.8*s,y:hy-.5*s},{x:p.x-3.4*s,y:hy+4*s},'#1f1b1a',1);line({x:p.x+1.8*s,y:hy-.5*s},{x:p.x+3.4*s,y:hy+4*s},'#1f1b1a',1)}}
  else if(hat==='bun'){ctx.fillStyle='#2b2520';ctx.beginPath();ctx.arc(p.x,hy-.9*s,2.5*s,3.14,6.29);ctx.fill();dot({x:p.x,y:hy-3.3*s},1.2*s,'#2b2520')}}
function horse(x,y,c){const p=P(x,y),b=Math.sin(T*2+x*9)*.7*s;ctx.fillStyle='rgba(0,0,0,.15)';ctx.beginPath();ctx.ellipse(p.x,p.y,8*s,3*s,0,0,7);ctx.fill();
  for(const dx of [-5,-3,3,5])line({x:p.x+dx*s,y:p.y-7*s},{x:p.x+dx*s,y:p.y},shade(c,-.3),1.5);
  ctx.fillStyle=c;ctx.strokeStyle=OUT;ctx.lineWidth=lw()*.6;ctx.beginPath();ctx.ellipse(p.x,p.y-9*s,7*s,3.6*s,0,0,7);ctx.fill();ctx.stroke();
  line({x:p.x+5*s,y:p.y-10*s},{x:p.x+8.5*s,y:p.y-15.5*s+b},OUT,4.4);line({x:p.x+5*s,y:p.y-10*s},{x:p.x+8.5*s,y:p.y-15.5*s+b},c,3.2);
  ctx.beginPath();ctx.ellipse(p.x+10*s,p.y-15.5*s+b,3.2*s,1.9*s,.5,0,7);ctx.fillStyle=c;ctx.fill();ctx.stroke();
  line({x:p.x+5.5*s,y:p.y-12*s},{x:p.x+8*s,y:p.y-16.5*s+b},'#2b2520',1.3);line({x:p.x-7*s,y:p.y-10*s},{x:p.x-9.5*s,y:p.y-5*s},'#2b2520',1.5)}
