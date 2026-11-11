'use strict';
// Visual layer: all construction, economy and progression rules stay in index.html.
document.body.insertAdjacentHTML('beforeend',`
  <div id="identity"><span class="seal">國</span><div><strong>LOẠN THẾ LẬP QUỐC</strong><small>NGŨ ĐẠI · THẬP QUỐC</small></div></div>
  <div id="chronicle">Năm 907 <span id="day-label">Ngày 1 · Bình minh</span></div>
  <div id="view-controls"><button id="zoom-in" title="Phóng to" aria-label="Phóng to">+</button><button id="zoom-out" title="Thu nhỏ" aria-label="Thu nhỏ">−</button><button id="recenter" title="Về phủ" aria-label="Đưa góc nhìn về phủ">⌖</button><button id="grid-toggle" title="Hiện lưới xây dựng" aria-label="Bật tắt lưới xây dựng" aria-pressed="false">▦</button></div>
  <div id="atlas" class="card"><div class="atlas-head"><span>ĐỊA ĐỒ</span><span>北 ↑</span></div><canvas id="minimap" width="308" height="208" aria-label="Bản đồ nhỏ, bấm để di chuyển góc nhìn"></canvas><div id="map-meta"><span>Trung Nguyên</span><span id="zoom-label">120%</span></div></div>`);
let showGrid=false;
const mini=document.getElementById('minimap'),mc=mini.getContext('2d');
function centerHall(){const p=P(G.hx+1,G.hy+1);ox+=W/2-p.x;oy+=H*.48-p.y}
$('zoom-in').onclick=()=>zoom(1.18,W/2,H/2);
$('zoom-out').onclick=()=>zoom(1/1.18,W/2,H/2);
$('recenter').onclick=centerHall;
$('grid-toggle').onclick=()=>{showGrid=!showGrid;$('grid-toggle').classList.toggle('active',showGrid);$('grid-toggle').setAttribute('aria-pressed',String(showGrid))};
const MP=(x,y)=>({x:154+(x-y)*5.25,y:17+(x+y)*3.2});
mini.addEventListener('pointerdown',e=>{const r=mini.getBoundingClientRect(),mx=(e.clientX-r.left)*308/r.width-154,my=(e.clientY-r.top)*208/r.height-17,x=(mx/5.25+my/3.2)/2,y=(my/3.2-mx/5.25)/2;if(x<0||y<0||x>N||y>N)return;const p=P(x,y);ox+=W/2-p.x;oy+=H/2-p.y});
function drawMini(){
  mc.clearRect(0,0,308,208);
  for(let y=0;y<N;y++)for(let x=0;x<N;x++){const q=tile(x,y),p=MP(x,y);mc.fillStyle=q.b?(q.b.k==='hall'?'#edd291':isRoad(q.b)?'#bca777':'#d2b880'):q.t==='w'?'#6eabae':q.t==='f'?'#3d6250':q.t==='r'?'#8e9380':'#7c9367';mc.beginPath();mc.moveTo(p.x,p.y);mc.lineTo(p.x+5.4,p.y+3.2);mc.lineTo(p.x,p.y+6.5);mc.lineTo(p.x-5.4,p.y+3.2);mc.fill()}
  mc.strokeStyle='#fae3ad';mc.lineWidth=1.4;mc.beginPath();
  [[0,0],[W,0],[W,H],[0,H]].forEach(([x,y],i)=>{const a=(x-ox)/(TW/2*s),b=(y-oy)/(TH/2*s),p=MP((a+b)/2,(b-a)/2);i?mc.lineTo(p.x,p.y):mc.moveTo(p.x,p.y)});mc.closePath();mc.stroke();
  $('zoom-label').textContent=Math.round(s*100)+'%';$('day-label').textContent='Ngày '+(G.tick+1)+' · '+(NIGHT>.65?'Đêm tĩnh':DUSK>.5?'Hoàng hôn':'Trời quang');
}
// Softer ink outlines and a richer, less saturated terrain palette.
lw=()=>Math.max(.45,s*.52);
const basePaintTiles=paintTiles;
paintTiles=function(){basePaintTiles();for(let y=0;y<N;y++)for(let x=0;x<N;x++){const q=tile(x,y),n=nz(x,y);q.c=q.t==='w'?lerpC('#397d83','#6ca5a1',n):q.t==='f'?lerpC('#55734a','#85935e',n):q.t==='r'?lerpC('#8d9278','#b3ad8d',n):lerpC(lerpC('#829b60','#b1b87b',n),'#c8b58d',Math.min(.75,q.w*.13))}};
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
const baseGround=drawGround;
drawGround=function(){
  baseGround();
  // Fine grass strokes and shoreline reeds use deterministic positions.
  for(let y=0;y<N;y++)for(let x=0;x<N;x++){const q=tile(x,y),p=P(x+.5,y+.5);if(p.x<-50||p.x>W+50||p.y<-50||p.y>H+50)continue;
    if(q.t==='g'&&!q.b&&q.w<2){for(let i=0;i<4;i++){const a=x+rnd(x*77+y*31+i)*.9,b=y+rnd(y*97+x*11+i)*.9,pt=P(a,b),h=(1.5+rnd(i+x+y)*2)*s;line(pt,{x:pt.x+Math.sin(T*.8+x+i)*s,y:pt.y-h},i%2?'#5d794840':'#d9d39a55',.55)}}
    if(q.t==='w'){
      const shimmer=.18+.15*Math.sin(T*1.5+x+y);ctx.save();ctx.globalAlpha=shimmer;for(let i=0;i<3;i++){const u=(T*.12+q.v+i*.28)%1,pt=P(x+.18+u*.6,y+.25+i*.21);line({x:pt.x-3*s,y:pt.y},{x:pt.x+3*s,y:pt.y},'#e5ead0',.8)}ctx.restore();
      if(q.v>.5&&[[-1,0],[0,1]].some(([a,b])=>tile(x+a,y+b)?.t==='g'))for(let i=0;i<3;i++){const pt=P(x+.1+i*.06,y+.8);line(pt,{x:pt.x+Math.sin(T+i)*s,y:pt.y-(6+i%2*3)*s},'#6a8150',.8)}
    }
    if(showGrid||G.tool){quad(x,y,1,1,0,null,showGrid?'#e5e5bc25':'#e5e5bc10',.55)}
  }
};
function drawAtmosphere(){
  ctx.save();
  // A warm directional wash and sparse drifting motes anchor the diorama.
  if(NIGHT<.7){const light=ctx.createLinearGradient(0,0,W,H);light.addColorStop(0,'#f4d68d20');light.addColorStop(.5,'#edd6a005');light.addColorStop(1,'#163d4820');ctx.fillStyle=light;ctx.fillRect(0,0,W,H)}
  for(let i=0;i<24;i++){const x=(rnd(i+81)*W+Math.sin(T*.12+i)*26+W)%W,y=(rnd(i+330)*H-T*(2+rnd(i)*5)%H+H)%H;ctx.globalAlpha=(NIGHT>.6?.38:.16)*(.5+.5*Math.sin(T+i));dot({x,y},(i%3===0?1.5:.8),NIGHT>.6?'#e5e99b':'#ffecc4')}
  ctx.globalAlpha=1;
  if(hover&&!G.tool){const q=tile(hover.x,hover.y);if(q?.b){const b=q.b,hall=b.k==='hall',p=P(b.x+(hall?1:.5),b.y+(hall?1:.5),hall?[53,68,94,105][G.era]:65),label=hall?'Phủ '+RANK[G.era]:B[b.k].n+(b.building?' · '+Math.floor(b.progress*100)+'%':'');ctx.font='11px Segoe UI';const width=ctx.measureText(label).width+24;ctx.fillStyle='#142e28ed';ctx.strokeStyle='#c6b07899';ctx.lineWidth=1;ctx.beginPath();ctx.roundRect(p.x-width/2,p.y-20,width,27,3);ctx.fill();ctx.stroke();ctx.fillStyle='#eadcb7';ctx.textAlign='center';ctx.fillText(label,p.x,p.y-3)}}
  ctx.restore();
}
const baseDraw=draw;let miniFrame=0;
draw=function(){baseDraw();drawAtmosphere();if(miniFrame++%12===0)drawMini()};
// Keyboard navigation complements mouse / touch controls.
addEventListener('keydown',e=>{if(e.target.matches('input,textarea')||$('modal').style.display==='flex')return;if(e.key==='+'||e.key==='=')zoom(1.12,W/2,H/2);if(e.key==='-')zoom(1/1.12,W/2,H/2);if(e.key.toLowerCase()==='h')centerHall()});
paintTiles();drawMini();
// A concise opening card gives the map room to establish its visual character.
$('mBox').innerHTML=`<span class="intro-kicker">TRUNG NGUYÊN · NĂM 907</span><svg class="intro-art" viewBox="0 0 100 100" fill="none" aria-hidden="true"><path d="M15 74h70M23 72V48h54v24M32 48V31h36v17M19 49l31-15 31 15M28 32l22-17 22 17M10 77h80M40 72V56h20v16" stroke="#cbb177" stroke-width="2"/><path d="M19 49h62M28 32h44M50 15V8M31 51v15M69 51v15M36 35v8M64 35v8" stroke="#cbb177"/><circle cx="50" cy="7" r="2" fill="#cbb177"/></svg><h2>Loạn Thế Lập Quốc</h2><div class="intro-rule"></div><p>Nhà Đường sụp đổ. Chư hầu nổi dậy.<br>Giữa một thời loạn, cơ nghiệp của bạn bắt đầu<br>từ một thôn nhỏ và bốn người lưu dân.</p><p>Dựng nhà, khai ruộng, mở đường giao thương.<br>Xây thành giữ đất, chiêu hiền đãi sĩ,<br>từng bước <b style="color:#e0c58a">xưng vương lập quốc.</b></p><button class="go" onclick="closeModal()">Khai lập cơ nghiệp &nbsp; →</button><div class="intro-help"><span>Kéo · Di chuyển</span><span>Cuộn · Thu phóng</span><span>H · Về phủ</span></div>`;
