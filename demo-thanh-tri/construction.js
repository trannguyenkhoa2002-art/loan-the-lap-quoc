'use strict';
// Construction is simulation time: pause and speed controls apply to every site.
const coreStep=step;
step=function(dt){coreStep(dt);let completed=false;for(const b of G.bl){if(!b.building)continue;b.progress=Math.min(1,b.progress+dt*G.speed/b.duration);if(b.progress>=1){b.building=false;b.born=-9;completed=true;float(b.x+.5,b.y+.5,'✓');for(let i=0;i<5;i++)G.fl.push({x:b.x+.5,y:b.y+.5,t:0,dust:1,a:i*1.3})}}if(completed){recalc();ui();updateSiteStatus(true)}updateTraffic(dt*G.speed)};
// Material gradients give every building a sunlit face and a cooler shaded face.
box=function(x,y,w,d,z0,h,col,kTop=.12){const z1=z0+h,a=P(x,y+d,z0),b=P(x+w,y+d,z1),g=ctx.createLinearGradient(a.x,a.y,b.x,b.y);g.addColorStop(0,shade(col,-.19));g.addColorStop(1,shade(col,.12));poly([a,P(x+w,y+d,z0),b,P(x,y+d,z1)],g);const r=ctx.createLinearGradient(b.x,b.y,P(x+w,y,z0).x,P(x+w,y,z0).y);r.addColorStop(0,shade(col,-.19));r.addColorStop(1,shade(col,-.38));poly([P(x+w,y,z0),P(x+w,y+d,z0),b,P(x+w,y,z1)],r);poly([P(x,y,z1),P(x+w,y,z1),b,P(x,y+d,z1)],shade(col,kTop))};
function detailedHouse(b){const x=b.x,y=b.y,v=rnd(x*17+y*31),wall=lerpC('#ddd0ae','#eee3ca',v),roof=lerpC('#3e5151','#637676',v);
  quad(x+.03,y+.03,.94,.94,0,'#b4a080',null);box(x+.1,y+.14,.8,.7,0,3,'#94978a');
  box(x+.15,y+.19,.7,.56,3,17,wall);for(const u of [.15,.5,.85]){box(x+u-.018,y+.73,.036,.035,3,17,'#70523b');line(P(x+u,y+.77,4),P(x+u,y+.77,19),'#c19a6355',.5)}
  line(P(x+.15,y+.75,19),P(x+.85,y+.75,19),'#614632',2);line(P(x+.85,y+.19,3),P(x+.85,y+.19,20),'#614632',1.5);
  for(const [a,w] of [[.22,.16],[.65,.13]]){winF(x+a,y+.756,9,w,7);for(let i=1;i<4;i++)line(P(x+a+w*i/4,y+.759,9),P(x+a+w*i/4,y+.759,16),'#a08c6555',.55);box(x+a-.02,y+.76,w+.04,.045,8,1.2,'#756347')}
  door(x+.44,y+.758,3,.16,13,'#493d30');line(P(x+.52,y+.76,3),P(x+.52,y+.76,16),'#b5986355',.7);dot(P(x+.55,y+.77,10),.7*s,'#c3a66d');winR(x+.854,y+.32,9,.23,7);
  hip(x+.1,y+.14,.8,.66,20,15,roof,.1);
  // Fine tile courses, ceramic ridge caps and warm timber under the eaves.
  for(let j=1;j<5;j++){const u=j/5;line(P(x+.08+u*.23,y+.91-u*.43,20+u*15),P(x+.92-u*.23,y+.91-u*.43,20+u*15),'#c5c4a128',.6)}
  for(let i=0;i<7;i++)dot(P(x+.34+i*.05,y+.47,35),.95*s,'#acb19a');
  box(x+.42,y+.78,.22,.13,0,1.5,'#a5a18e');box(x+.44,y+.77,.18,.06,1.5,1.5,'#bdb6a0');
  for(const u of [.17,.84])line(P(x+u,y+.88),P(x+u,y+.88,14),'#69503b',1.4);
  gable(x+.12,y+.7,.77,.22,14,3,'#657577',wall);lantern(x+.82,y+.91,14,.9);
  for(let i=0;i<3;i++){const p=P(x+.12,y+.3+i*.09,2.5);line(p,P(x+.12,y+.36+i*.09,2.5),'#73563d',3.5);dot(p,1.4*s,'#c2a575')}
  const pot=P(x+.93,y+.79);dot({x:pot.x,y:pot.y-3*s},3*s,'#8e6950');for(let i=0;i<5;i++)line({x:pot.x,y:pot.y-4*s},{x:pot.x+(i-2)*2*s,y:pot.y-(9+Math.sin(i)*2)*s},'#567a4a',1.7);
  // A small masonry chimney and thin rising smoke.
  box(x+.24,y+.27,.095,.095,27,10,'#919385');for(let i=0;i<5;i++){const u=(T*.15+i*.2+v)%1;ctx.globalAlpha=(1-u)*.2;dot(P(x+.285+u*.2,y+.315,39+u*22),(1+u*4)*s,'#ebe7d9')}ctx.globalAlpha=1;
}
const oldBuilding=drawB;
function finishedBuilding(b){if(b.k==='house')detailedHouse(b);else if(b.k==='road'||b.k==='pave')drawRoad(b);else oldBuilding({...b,born:-9})}
function scaffolding(b,p){const x=b.x,y=b.y,h=b.k==='tower'||b.k==='temple'?58:39,level=Math.min(h,8+p*h*1.1),timber='#9a7b50';
  for(const [a,c] of [[.04,.07],[.96,.07],[.04,.95],[.96,.95]]){line(P(x+a,y+c),P(x+a,y+c,level),timber,1.5);for(let z=8;z<level;z+=10)line(P(x+a-.035,y+c,z),P(x+a+.035,y+c,z),'#e3d1a0',1)}
  for(let z=9;z<level;z+=11){line(P(x+.04,y+.95,z),P(x+.96,y+.95,z),timber,1.5);line(P(x+.96,y+.07,z),P(x+.96,y+.95,z),timber,1.5);line(P(x+.04,y+.95,z-8),P(x+.96,y+.95,z),timber,.9);line(P(x+.96,y+.07,z-8),P(x+.96,y+.95,z),timber,.9);if(z<level-3){quad(x+.01,y+.87,.99,.12,z,'#ab8b58',null)}}
}
function drawSite(b){const x=b.x,y=b.y,p=b.progress,low=['road','pave','farm','salt','wall'].includes(b.k),phase=p<.18?'San nền':p<.43?'Dựng khung':p<.76?'Xây tường':'Lợp mái';
  quad(x+.025,y+.025,.95,.95,0,'#a18d66','#d2bd89',.6);
  for(let i=0;i<5;i++)line(P(x+.12,y+.12+i*.17),P(x+.86,y+.12+i*.17),'#786b5144',.7);
  if(low){ctx.save();const base=P(x+.5,y+.5);ctx.beginPath();ctx.rect(base.x-50*s,base.y+22*s-70*s*p,100*s,70*s*p);ctx.clip();finishedBuilding(b);ctx.restore()}
  else{
    if(p>.1){box(x+.13,y+.17,.74,.65,0,Math.min(3,(p-.1)*25),'#93917e')}
    if(p>.2&&p<.8){const h=Math.min(20,(p-.2)*70);for(const [a,c] of [[.16,.2],[.85,.2],[.16,.78],[.85,.78]])line(P(x+a,y+c,3),P(x+a,y+c,3+h),'#7a573c',2);if(p>.32){line(P(x+.16,y+.78,22),P(x+.85,y+.78,22),'#79583b',2);line(P(x+.85,y+.2,22),P(x+.85,y+.78,22),'#79583b',2)}}
    if(p>.38){const base=P(x+.5,y+.5),amount=(p-.38)/.62,height=b.k==='temple'?100:b.k==='tower'?105:85;ctx.save();ctx.beginPath();ctx.rect(base.x-80*s,base.y+30*s-height*s*amount,160*s,height*s*amount+5*s);ctx.clip();finishedBuilding(b);ctx.restore()}
    ctx.save();ctx.globalAlpha=p>.86?(1-p)/.14:1;scaffolding(b,p);ctx.restore();
  }
  // Supplies shrink as work progresses; a builder swings a mallet beside the site.
  if(p<.88){for(let i=0;i<Math.ceil((1-p)*4);i++)box(x+.05+i*.1,y+.98,.08,.09,0,3+i%2*2,'#c0ae8a');line(P(x+.12,y+.05,3),P(x+.65,y+.05,3),'#8d6b42',3)}
  const wx=x+.97,wy=y+.9,wp=P(wx,wy),swing=Math.sin(T*8)*G.speed;person(wx,wy,'#8e7754',T,'#e2bd92','non');line({x:wp.x+3*s,y:wp.y-7*s},{x:wp.x+(7+swing*2)*s,y:wp.y-(13+swing*4)*s},'#79583e',1.2);line({x:wp.x+(5+swing*2)*s,y:wp.y-(13+swing*4)*s},{x:wp.x+(10+swing*2)*s,y:wp.y-(13+swing*4)*s},'#777d74',2.5);
  if(G.speed&&Math.sin(T*8)>.7){ctx.save();ctx.globalAlpha=.15;for(let i=0;i<3;i++){const u=(T*.9+i*.3)%1;dot(P(x+.6+u*.2,y+.8,3+u*12),(1+u*4)*s,'#ddd0a5')}ctx.restore()}
  const label=P(x+.5,y+.5,low?29:78),width=82*s;ctx.fillStyle='#17332bef';ctx.fillRect(label.x-width/2,label.y-9*s,width,20*s);ctx.fillStyle='#d7bb79';ctx.font=`${Math.max(9,9*s)}px Segoe UI`;ctx.textAlign='center';ctx.fillText((low?'Thi công':phase)+' · '+Math.floor(p*100)+'%',label.x,label.y);ctx.fillStyle='#ffffff22';ctx.fillRect(label.x-width/2+5*s,label.y+5*s,width-10*s,2*s);ctx.fillStyle='#dbbd77';ctx.fillRect(label.x-width/2+5*s,label.y+5*s,(width-10*s)*p,2*s)
}
drawB=function(b){if(b.building){drawSite(b);return}finishedBuilding(b)};
// Replace the tiny icon burst with the construction site itself; preview uses full scale.
const sceneDraw=draw;
draw=function(){
  sceneActors=traffic.map(a=>({k:a.x+a.y,f:()=>a.kind===0?drawRider(a):drawWagon(a)}));
  for(const a of traffic)if(a.kind===2&&a.trail)for(const n of [9,18,27]){
    const q=a.trail[n];if(!q||!roadAt(Math.floor(q.x),Math.floor(q.y)))continue;
    sceneActors.push({k:q.x+q.y,f:()=>{
      if(n===27){person(q.x,q.y,'#81617d',a.phase,'#e5c3a0','non',1);return}
      horseBody(q.x,q.y,a.phase+n,q.dirX??1,q.dirY??0,'#78634d');
      box(q.x-.08,q.y-.15,.17,.19,10,5,n===9?'#a58e63':'#907254');
      const pt=P(q.x,q.y,17);line({x:pt.x-2*s,y:pt.y},{x:pt.x+3*s,y:pt.y},'#d7c39b',.7)
    }})
  }
  sceneDraw();
  if(hover&&G.tool==='house'&&!canPlace('house',hover.x,hover.y)){ctx.save();ctx.globalAlpha=.36;detailedHouse({x:hover.x,y:hover.y});ctx.restore()}
  updateSiteStatus()
};

// Road-bound traffic: agents select adjacent completed road tiles, never cross fields.
const traffic=[];let trafficClock=0;
function roadAt(x,y){return isRoad(tile(x,y)?.b)||tile(x,y)?.b?.k==='gate'&&isBuilt(tile(x,y).b)}
function updateTraffic(dt){
  const roads=G.bl.filter(b=>roadAt(b.x,b.y));trafficClock+=dt;
  if(roads.length>=3&&traffic.length<Math.min(10,Math.floor(roads.length/3))&&trafficClock>3){trafficClock=0;const id=traffic.length,seen=new Set(),groups=[];for(const start of roads){const key=start.x+','+start.y;if(seen.has(key))continue;const group=[],queue=[[start.x,start.y]];seen.add(key);for(let i=0;i<queue.length;i++){const [x,y]=queue[i];group.push({x,y});for(const [u,v] of [[x+1,y],[x-1,y],[x,y+1],[x,y-1]]){const k=u+','+v;if(!seen.has(k)&&roadAt(u,v)){seen.add(k);queue.push([u,v])}}}if(group.length>=3*(id%3+1))groups.push(group)}if(groups.length){const group=groups[Math.floor(rnd(id+G.tick)*groups.length)],b=group[Math.floor(rnd(G.tick+id*7)*group.length)];traffic.push({x:b.x+.5,y:b.y+.5,tx:b.x+.5,ty:b.y+.5,prev:null,kind:id%3,phase:id*1.7})}}
  for(let i=traffic.length-1;i>=0;i--){const a=traffic[i],dx=a.tx-a.x,dy=a.ty-a.y,d=Math.hypot(dx,dy);if(!roadAt(Math.floor(a.x),Math.floor(a.y))){traffic.splice(i,1);continue}a.phase+=dt*6;
    if(d<.025){const x=Math.floor(a.tx),y=Math.floor(a.ty),options=[[x+1,y],[x,y+1],[x-1,y],[x,y-1]].filter(([u,v])=>roadAt(u,v));if(!options.length)continue;const forward=options.filter(([u,v])=>!a.prev||u!==a.prev[0]||v!==a.prev[1]),choices=forward.length?forward:options,[nx,ny]=choices[Math.floor(rnd(i*80+Math.floor(a.phase))*choices.length)];a.prev=[x,y];a.tx=nx+.5;a.ty=ny+.5;a.dirX=nx-x;a.dirY=ny-y}
    else{const move=Math.min(d,dt*(a.kind===0?.48:.34));a.x+=dx/d*move;a.y+=dy/d*move;a.trail??=[];if(!a.trail.length||Math.hypot(a.x-a.trail[0].x,a.y-a.trail[0].y)>.08){a.trail.unshift({x:a.x,y:a.y,dirX:a.dirX,dirY:a.dirY});a.trail.length=Math.min(35,a.trail.length)}}
  }
}
function horseBody(x,y,phase,dx,dy,coat='#856047'){
  const p=P(x,y),dir=(dx-dy)>=0?1:-1,bob=Math.sin(phase*2)*.55*s;ctx.save();ctx.translate(p.x,p.y);ctx.scale(dir,1);
  ctx.fillStyle='#15372b28';ctx.beginPath();ctx.ellipse(0,0,10*s,3.2*s,0,0,7);ctx.fill();
  for(let i=0;i<4;i++){const xx=(i<2?-5:5)*s+(i%2)*2*s,walk=Math.sin(phase+(i%2)*Math.PI+(i>1?1.5:0))*2.7*s;line({x:xx,y:-8*s+bob},{x:xx+walk*.4,y:-4*s},shade(coat,-.3),1.8);line({x:xx+walk*.4,y:-4*s},{x:xx+walk,y:0},shade(coat,-.3),1.5);line({x:xx+walk,y:0},{x:xx+walk+1.8*s,y:0},'#363b30',1.7)}
  ctx.fillStyle=coat;ctx.beginPath();ctx.ellipse(0,-10*s+bob,8*s,4*s,0,0,7);ctx.fill();line({x:5*s,y:-11*s+bob},{x:8*s,y:-18*s+bob},coat,5);dot({x:10*s,y:-18*s+bob},3*s,coat);line({x:8*s,y:-19*s+bob},{x:7*s,y:-22*s+bob},coat,1.5);line({x:7*s,y:-12*s+bob},{x:8*s,y:-18*s+bob},'#403c2d',1.5);line({x:-8*s,y:-10*s},{x:-11*s,y:-5*s+Math.sin(phase)*s},'#3e3529',1.8);dot({x:11*s,y:-19*s+bob},.55*s,'#161e1b');line({x:9*s,y:-17*s},{x:13*s,y:-17*s},'#c3b089',.6);
  ctx.fillStyle='#714b37';ctx.fillRect(-4*s,-14*s+bob,8*s,3*s);ctx.restore();return p;
}
function drawRider(a){const p=horseBody(a.x,a.y,a.phase,a.dirX??1,a.dirY??0),b=Math.sin(a.phase*2)*.55*s;line({x:p.x-1*s,y:p.y-13*s+b},{x:p.x-3*s,y:p.y-6*s+b},'#444d46',2);poly([{x:p.x-3*s,y:p.y-22*s+b},{x:p.x+2*s,y:p.y-22*s+b},{x:p.x+4*s,y:p.y-13*s+b},{x:p.x-4*s,y:p.y-13*s+b}],'#536e77');dot({x:p.x,y:p.y-25*s+b},2.4*s,'#e5c3a0');poly([{x:p.x-5*s,y:p.y-26*s+b},{x:p.x+5*s,y:p.y-26*s+b},{x:p.x,y:p.y-30*s+b}],'#cbbb83');line({x:p.x+2*s,y:p.y-19*s+b},{x:p.x+9*s,y:p.y-17*s},'#b9a27a',.7)}
function drawWagon(a){const dx=a.dirX??1,dy=a.dirY??0,tail=a.trail?.[6]||{x:a.x-dx*.52,y:a.y-dy*.52},p=P(tail.x,tail.y),hp=horseBody(a.x,a.y,a.phase,dx,dy,'#94704e');line({x:p.x-3*s,y:p.y-6*s},{x:hp.x,y:hp.y-5*s},'#805f3c',1.2);line({x:p.x+3*s,y:p.y-6*s},{x:hp.x+3*s,y:hp.y-5*s},'#805f3c',1.2);
  for(const off of [-8,8]){const cx=p.x+off*s,cy=p.y-3*s;ctx.fillStyle='#4b4937';ctx.beginPath();ctx.ellipse(cx,cy,4*s,5.3*s,0,0,7);ctx.fill();ctx.strokeStyle='#c2a26a';ctx.lineWidth=s;ctx.stroke();for(let i=0;i<5;i++){const ang=a.phase*.6+i*Math.PI*2/5;line({x:cx,y:cy},{x:cx+Math.cos(ang)*3.5*s,y:cy+Math.sin(ang)*4.6*s},'#a68a58',.65)}}
  box(tail.x-.22,tail.y-.22,.44,.44,5,6,'#95784d');for(let i=0;i<3;i++){const q={x:p.x+(i-1)*4*s,y:p.y-12*s};dot(q,3.5*s,['#c8b58c','#96724e','#c2a76e'][i]);line({x:q.x-2*s,y:q.y},{x:q.x+2*s,y:q.y},'#6c624944',.6)}
  if(a.kind===2){const q=P(tail.x,tail.y);ctx.save();ctx.translate(q.x,q.y-14*s);ctx.fillStyle='#987c50';ctx.fillRect(-8*s,-1*s,16*s,2*s);ctx.beginPath();ctx.ellipse(0,-1*s,8*s,9*s,0,Math.PI,Math.PI*2);ctx.fillStyle='#bdb297';ctx.fill();ctx.strokeStyle='#746749';ctx.lineWidth=s;ctx.stroke();for(const u of [-4,0,4])line({x:u*s,y:-8*s},{x:u*s,y:-1*s},'#7f795655',.7);ctx.restore()}
}
const works=document.createElement('div');works.id='works';works.setAttribute('role','status');$('goal').appendChild(works);let workFrame=0;
function updateSiteStatus(force=false){if(!force&&workFrame++%10)return;const sites=G.bl.filter(b=>b.building);works.innerHTML=sites.length?'<div class="works-title">ĐANG THI CÔNG · '+sites.length+'</div>'+sites.slice(-3).map(b=>'<div class="work-line"><span>'+B[b.k].n+'</span><b>'+Math.floor(b.progress*100)+'%</b></div><div class="work-track"><i style="width:'+b.progress*100+'%"></i></div>').join(''):''}

function showTown(){
  closeModal();G.era=1;G.w=600;G.s=400;G.f=800;G.g=500;G.pop=24;G.nextRaid=G.tick+240;
  for(let y=9;y<=19;y++)for(let x=8;x<=20;x++){const q=tile(x,y);if(!q.b)q.t='g'}
  const ready=(k,x,y)=>{if(tile(x,y).b)return;place(k,x,y);const b=tile(x,y).b;if(b){b.building=false;b.progress=1;b.on=true;b.born=-9}};
  // The example town follows the same tile occupancy and cost rules as normal play.
  for(let x=9;x<=19;x++){ready('road',x,11);ready('road',x,17)}for(let y=12;y<17;y++){ready('road',9,y);ready('road',19,y)}
  for(const [x,y] of [[10,12],[11,12],[15,12],[16,12],[10,16],[11,16],[16,16],[17,16]])ready('house',x,y);
  ready('market',15,16);ready('temple',18,12);ready('school',18,14);for(let x=10;x<=13;x++)ready('farm',x,18);
  for(let i=0;i<6;i++)updateTraffic(3.1);for(let i=0;i<180;i++)updateTraffic(.1);
  place('house',14,15);recalc();ui();centerHall();toast('Trấn mẫu · Các tuyến đường đã có kỵ mã, xe ngựa và thương đoàn.','good')
}
const townButton=document.createElement('button');townButton.className='town-preview';townButton.textContent='Xem trấn mẫu · Có xe ngựa & thương đoàn';townButton.onclick=showTown;$('mBox').querySelector('.go').after(townButton);
