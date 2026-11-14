'use strict';
// Hiệu ứng mặt đất/ánh sáng nâng cấp: lấy từ graphics.js của demo, thêm đồi và mạch quặng.
let showGrid=false;
// Softer ink outlines and a richer, less saturated terrain palette.
lw=()=>Math.max(.45,s*.52);
const basePaintTiles=paintTiles;
paintTiles=function(){basePaintTiles();for(let y=0;y<N;y++)for(let x=0;x<N;x++){const q=tile(x,y),n=nz(x,y);q.c=q.t==='w'?lerpC('#28616c','#569b98',n):q.t==='f'?lerpC('#44694e','#78935e',n):q.t==='r'?lerpC('#828d80','#a9ae94',n):q.t==='h'?lerpC('#78925d','#afbb7c',n):q.t==='m'?lerpC('#7b8177','#a19c85',n):lerpC(lerpC('#729460','#a4b77c',n),'#c5b48e',Math.min(.65,q.w*.10))}};
// These details are baked into ground chunks, never repainted across the map
// every frame. Keep their positions stable while zooming and rebuilding chunks.
const terrainDetailBase=drawGroundTiles;
drawGroundTiles=function(x0,y0,x1,y1){
  terrainDetailBase(x0,y0,x1,y1);
  if(!GFX.decor||s<.6)return;
  for(let y=y0;y<y1;y++)for(let x=x0;x<x1;x++){
    const q=tile(x,y);if(q.t!=='w')continue;
    const near=[[-1,0],[1,0],[0,-1],[0,1]].some(([dx,dy])=>{const n=tile(x+dx,y+dy);return n&&n.t!=='w'});
    if(!near)continue;
    const p=P(x,y),p2=P(x+1,y+1),g=ctx.createLinearGradient(p.x,p.y,p2.x,p2.y);
    g.addColorStop(0,'#b4d6bd30');g.addColorStop(1,'#19566308');quad(x+.04,y+.04,.92,.92,0,g,null);
  }
};
shadow=function(x,y,w,d,h){
  const k=h/64*.8,a=P(x+w*.5,y+d*.5),b=P(x-k,y+d+k);
  const g=ctx.createLinearGradient(a.x,a.y,b.x,b.y);
  const alpha=.24*(1-NIGHT*.7);g.addColorStop(0,`rgba(20,42,33,${alpha})`);g.addColorStop(1,'rgba(20,42,33,0)');
  poly([P(x,y),P(x+w,y),P(x+w,y+d),P(x+w-k,y+d+k),P(x-k,y+d+k),P(x-k,y+k)],g,null);
};
// Layered foliage with clusters of sunlit leaves, rather than flat circles.
broad=function(p,v,c1,c2){const sw=Math.sin(T*.9+v*30)*.8*s,sc=(.9+v*.45)*s;
  line(p,{x:p.x,y:p.y-19*sc},'#5d5338',3);line({x:p.x,y:p.y-9*sc},{x:p.x-7*sc,y:p.y-21*sc},'#5d5338',1.5);
  const pink=v>=.9,deep=pink?'#a86e79':'#385d43',mid=pink?'#d89b9f':'#5d824f',light=pink?'#f0c4b7':'#9baa65';
  for(const [dx,dy,r] of [[-8,-18,9],[7,-18,10],[0,-28,11],[-3,-14,8],[9,-27,7]]){
    const cx=p.x+dx*sc+sw,cy=p.y+dy*sc,g=ctx.createRadialGradient(cx-r*sc*.3,cy-r*sc*.5,0,cx,cy,r*sc);g.addColorStop(0,mid);g.addColorStop(1,deep);dot({x:cx,y:cy},r*sc,g);
    for(let i=0;i<8;i++){const a=rnd(v*300+dx+i)*6.28,rr=rnd(v*70+dy+i)*r*.8;dot({x:cx+Math.cos(a)*rr*sc,y:cy+Math.sin(a)*rr*sc-r*.18*sc},(1+rnd(i+v)*1.5)*sc,i%3?mid:light)}
  }
};
pine=function(p,h,v){const sw=Math.sin(T+v*20)*.7*s;line(p,{x:p.x,y:p.y-h*.7},'#65563c',2.4);
  for(let i=0;i<5;i++){const yy=p.y-h*.13-i*h*.16,ww=(13-i*2.2)*s*h/(32*s),tx=p.x+sw*(i+1)*.3,ty=yy-h*.32;
    poly([{x:p.x-ww,y:yy},{x:p.x-ww*.55,y:yy-2*s},{x:tx,y:ty},{x:p.x+ww*.6,y:yy-2*s},{x:p.x+ww,y:yy},{x:p.x+ww*.3,y:yy+2*s}],lerpC('#345d48','#78905b',i*.14),null);
    poly([{x:tx,y:ty},{x:p.x+ww,y:yy},{x:p.x+ww*.3,y:yy+2*s},{x:p.x,y:yy-2*s}],'#183f3535',null);line({x:p.x-ww*.65,y:yy-2*s},{x:tx,y:ty+3*s},'#b1bd7855',.65)
  }
};
function drawGroundExtras(rx0,ry0,rx1,ry1){
  if(s<.6||!GFX.decor)return;
  // Fine grass strokes and shoreline reeds use deterministic positions.
  for(let y=ry0;y<ry1;y++)for(let x=rx0;x<rx1;x++){const q=tile(x,y),p=P(x+.5,y+.5);if(p.x<-50||p.x>W+50||p.y<-50||p.y>H+50)continue;
    if(q.t==='g'&&!q.b&&q.w<2){
      const patch=rnd(x*43+y*67),count=patch>.55?4:1;
      for(let i=0;i<count;i++){const a=x+.16+rnd(x*77+y*31+i)*.65,b=y+.16+rnd(y*97+x*11+i)*.65,pt=P(a,b),h=(1.8+rnd(i+x+y)*2.4)*s;
        line(pt,{x:pt.x-s,y:pt.y-h},'#486e4a66',.65);line(pt,{x:pt.x+1.5*s,y:pt.y-h*.7},'#d5dea14d',.6);
      }
    }
    if(q.t==='f'){
      const p0=P(x+.5,y+.5);ctx.fillStyle='#294c3820';ctx.beginPath();ctx.ellipse(p0.x,p0.y,17*s,8*s,0,0,7);ctx.fill();
      if(q.v>.5)for(let i=0;i<3;i++){const pp=P(x+.2+rnd(x+y+i)*.6,y+.2+rnd(x*3+y+i)*.6);line(pp,{x:pp.x+2*s,y:pp.y+s},'#c0ab694d',1)}
    }
    if(q.t==='w'){
      const shimmer=.18+.15*Math.sin(T*1.5+x+y);ctx.save();ctx.globalAlpha=shimmer;for(let i=0;i<3;i++){const u=(T*.12+q.v+i*.28)%1,pt=P(x+.18+u*.6,y+.25+i*.21);line({x:pt.x-3*s,y:pt.y},{x:pt.x+3*s,y:pt.y},'#e5ead0',.8)}ctx.restore();
      if(q.v>.5&&[[-1,0],[0,1]].some(([a,b])=>tile(x+a,y+b)?.t==='g'))for(let i=0;i<3;i++){const pt=P(x+.1+i*.06,y+.8);line(pt,{x:pt.x+Math.sin(T+i)*s,y:pt.y-(6+i%2*3)*s},'#6a8150',.8)}
    }
  }
}
const WATERFX={map:null,points:[]};
function drawWaterHighlights(){
  if(!GFX.decor||s<.55||NIGHT>.8)return;
  if(WATERFX.map!==G.map){
    WATERFX.map=G.map;WATERFX.points=[];
    for(let y=1;y<N-1;y++)for(let x=1;x<N-1;x++)if(tile(x,y).t==='w'&&rnd(x*37+y*19)>.8)WATERFX.points.push([x+.5,y+.5,rnd(x+y*71)*6.28]);
  }
  ctx.save();ctx.strokeStyle='#e0f2d5';ctx.lineWidth=Math.max(.6,s*.65);ctx.beginPath();
  let n=0;for(const [x,y,ph] of WATERFX.points){const p=P(x,y);if(p.x<0||p.x>W||p.y<0||p.y>H)continue;if(n++>=48)break;
    const wave=.5+.5*Math.sin(T*1.3+ph),len=(2+wave*5)*s;
    ctx.moveTo(p.x-len,p.y);ctx.lineTo(p.x+len,p.y);}
  ctx.globalAlpha=.22*(1-NIGHT);ctx.stroke();ctx.restore();
}
function drawBuildingFocus(){
  if(G.tool)return;
  const q=hover&&tile(hover.x,hover.y),b=UI.selB||(q&&q.b);if(!b)return;
  const w=b.w||(b.k==='hall'?2:1),d=b.h||(b.k==='hall'?2:1);
  quad(b.x+.025,b.y+.025,w-.05,d-.05,.3,'#efcf7418','#f2d68a',1.7);
}
function drawAtmosphere(){
  ctx.save();
  // A warm directional wash and sparse drifting motes anchor the diorama.
  
  if(GFX.atmos)for(let i=0;i<24;i++){const x=(rnd(i+81)*W+Math.sin(T*.12+i)*26+W)%W,y=(rnd(i+330)*H-T*(2+rnd(i)*5)%H+H)%H;ctx.globalAlpha=(NIGHT>.6?.38:.16)*(.5+.5*Math.sin(T+i));dot({x,y},(i%3===0?1.5:.8),NIGHT>.6?'#e5e99b':'#ffecc4')}
  ctx.globalAlpha=1;
  if(hover&&!G.tool){const q=tile(hover.x,hover.y);if(q?.b){const b=q.b,hall=b.k==='hall',p=P(b.x+(hall?1:.5),b.y+(hall?1:.5),hall?[53,68,94,105][G.era]:65),label=hall?'Phủ '+LT.RANKS[G.rank].n:B[b.k].n+(b.building?' · '+Math.floor(b.progress*100)+'%':'');ctx.font='11px Segoe UI';const width=ctx.measureText(label).width+24;ctx.fillStyle='#142e28ed';ctx.strokeStyle='#c6b07899';ctx.lineWidth=1;ctx.beginPath();ctx.roundRect(p.x-width/2,p.y-20,width,27,3);ctx.fill();ctx.stroke();ctx.fillStyle='#eadcb7';ctx.textAlign='center';ctx.fillText(label,p.x,p.y-3)}}
  ctx.restore();
}
