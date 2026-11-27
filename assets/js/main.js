/* ---------- content ---------- */
const scenes=JSON.parse(document.getElementById('scene-data').textContent);
const N=scenes.length-1,IX=f=>scenes.findIndex(s=>s[f]),S_SIG=IX('sig'),S_DBG=IX('dbg'),S_STACK=IX('stack'),S_SAND=IX('sand'),S_AGENT=IX('agent'),S_SHIELD=IX('shield'),S_OTA=IX('ota'),S_TEE=IX('tee');
{const CLOSE={stack:.82,shield:.82,agent:.8,ota:.8,sand:.78};scenes.forEach((sc,k)=>{if(!k)return;const f=Object.keys(CLOSE).find(x=>sc[x]);const m=f?CLOSE[f]:.72,c=sc.cam;for(let q=0;q<3;q++)c[q]=c[q+3]+(c[q]-c[q+3])*m})}


const $=id=>document.getElementById(id);
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const ACC='#e0943a',BGC='#0b0c0e';
const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
const pad2=n=>String(n).padStart(2,'0');

const railBtns=[...$('rail').children];
$('rail').addEventListener('click',e=>{const b=e.target.closest('button');if(b)$('step-'+b.dataset.k).scrollIntoView({behavior:reduce?'auto':'smooth'})});
const io=new IntersectionObserver(es=>es.forEach(e=>e.target.classList.toggle('in',e.isIntersecting)),{threshold:.45});
document.querySelectorAll('.card').forEach(c=>io.observe(c));
const tabBtns=[...$('tabs').querySelectorAll('[role=tab]')],panels=[...document.querySelectorAll('.ind-panel')];
function renderInd(k){
  tabBtns.forEach((b,j)=>{b.setAttribute('aria-selected',j===k);b.tabIndex=j===k?0:-1});
  panels.forEach((p,j)=>{p.hidden=j!==k});
}
$('tabs').addEventListener('click',e=>{const b=e.target.closest('button');if(b)renderInd(+b.dataset.k)});
$('tabs').addEventListener('keydown',e=>{if(e.key!=='ArrowRight'&&e.key!=='ArrowLeft')return;let k=tabBtns.indexOf(document.activeElement);k=(k+(e.key==='ArrowRight'?1:-1)+tabBtns.length)%tabBtns.length;renderInd(k);tabBtns[k].focus()});
renderInd(0);

const sections=[...document.querySelectorAll('.scene')];
let tops=[];const measure=()=>{tops=sections.map(s=>s.offsetTop)};measure();
function progress(){const y=scrollY;let i=0;while(i<tops.length-1&&y>=tops[i+1])i++;const span=(tops[i+1]??tops[i]+innerHeight)-tops[i];return{i,f:i>=tops.length-1?Math.min(1,(y-tops[i])/span):(y-tops[i])/span}}
const hdr=document.querySelector('header');
let _rk='';
const ld=$('loader');
const setLoad=p=>{$('ldbar').style.width=p+'%';ld.querySelector('.ld-bar').setAttribute('aria-valuenow',Math.round(p))};
const hideLoad=()=>{setLoad(100);setTimeout(()=>ld.classList.add('done'),450)};
addEventListener('error',()=>setTimeout(hideLoad,800));setTimeout(()=>{if(!ld.classList.contains('done'))hideLoad()},30000);
const tick=()=>new Promise(r=>requestAnimationFrame(()=>setTimeout(r,0)));
function updRail(a){const sol=scrollY>tops[tops.length-1]+innerHeight*.5,off=a===0||scrollY>tops[tops.length-1]+innerHeight*.6,k=a+'|'+sol+'|'+off;if(k===_rk)return;_rk=k;hdr.classList.toggle('solid',scrollY>tops[tops.length-1]+innerHeight*.5);railBtns.forEach((b,k)=>{b.classList.toggle('cur',k+1===a);b.classList.toggle('done',k+1<a)});$('rail').classList.toggle('off',a===0||scrollY>tops[tops.length-1]+innerHeight*.6)}
const fallback=()=>{hideLoad();document.body.classList.add('nogl');const u=()=>{const p=progress();updRail(p.f<.5?p.i:p.i+1)};addEventListener('scroll',u,{passive:true});addEventListener('resize',measure);u()};

/* ---------- 3D ---------- */
let THREE,RoundedBoxGeometry,RoomEnvironment,EffectComposer,RenderPass,UnrealBloomPass,OutputPass,BokehPass;
try{
  setLoad(4,'Power-on reset · voltage rails stable');
  THREE=await import('three');setLoad(18,'Boot ROM · reading key hash from OTP fuses');
  let n=0;const L=u=>import(u).then(m=>{setLoad(18+(++n)*3);return m});
  [{RoundedBoxGeometry},{RoomEnvironment},{EffectComposer},{RenderPass},{UnrealBloomPass},{OutputPass},{BokehPass}]=await Promise.all([
    L('three/addons/geometries/RoundedBoxGeometry.js'),L('three/addons/environments/RoomEnvironment.js'),
    L('three/addons/postprocessing/EffectComposer.js'),L('three/addons/postprocessing/RenderPass.js'),
    L('three/addons/postprocessing/UnrealBloomPass.js'),L('three/addons/postprocessing/OutputPass.js'),L('three/addons/postprocessing/BokehPass.js')]);
}catch(e){THREE=null}
let R=null;
if(THREE){try{R=new THREE.WebGLRenderer({canvas:$('gl'),antialias:true,powerPreference:'high-performance'})}catch(e){R=null}}
if(!R)fallback();else{
setLoad(40,'Verifying bootloader signature · ECDSA P-256');await Promise.race([document.fonts.ready,new Promise(r=>setTimeout(r,1500))]);
const small=Math.min(innerWidth,innerHeight)<700;
let DPR=Math.min(2,Math.max(1.25,devicePixelRatio));R.setPixelRatio(DPR);
R.toneMapping=THREE.ACESFilmicToneMapping;R.toneMappingExposure=1;
R.shadowMap.enabled=true;R.shadowMap.autoUpdate=false;R.shadowMap.type=THREE.PCFSoftShadowMap;
const ANISO=R.capabilities.getMaxAnisotropy();
const BG=0x02060b;
const S=new THREE.Scene();S.background=new THREE.Color(BG);S.fog=new THREE.Fog(BG,9,30);
const floor=new THREE.Mesh(new THREE.PlaneGeometry(80,80),new THREE.ShadowMaterial({opacity:.6}));floor.rotation.x=-Math.PI/2;floor.position.y=-.9;floor.receiveShadow=true;S.add(floor);
const pm=new THREE.PMREMGenerator(R);S.environment=pm.fromScene(new RoomEnvironment(R),.04).texture;
const cam=new THREE.PerspectiveCamera(34,1,.05,200);
const key=new THREE.DirectionalLight(0xcfe6ff,.85);key.position.set(4,12,6);key.castShadow=true;key.shadow.mapSize.set(small?1024:2048,small?1024:2048);
Object.assign(key.shadow.camera,{left:-11,right:11,top:9,bottom:-9,near:1,far:40});key.shadow.bias=-.0004;key.shadow.normalBias=.02;key.shadow.radius=3;S.add(key);
const rim=new THREE.DirectionalLight(0xffb25c,.3);rim.position.set(-8,3,-9);S.add(rim);
const warm=new THREE.DirectionalLight(0xff8a5c,.25);warm.position.set(9,2,2);S.add(warm);

let seed=11;const rnd=()=>(seed=(seed*16807)%2147483647)/2147483647;
const tx=c=>{const t=new THREE.CanvasTexture(c);t.anisotropy=ANISO;return t};
const cnv=(w,h)=>{const c=document.createElement('canvas');c.width=w;c.height=h;return c};
const HDR=(r,g,b)=>new THREE.Color(r,g,b);
const RDS=HDR(1.8,.22,.15),CY=HDR(.35,1.9,3.2),CYD=HDR(.25,1.2,2),RD=HDR(4.5,.45,.3),GN=HDR(.5,3,1.5);
const HB=HDR(.35,1.9,3.2),HBD=HDR(.25,1.2,2);
{const c=new THREE.Color(ACC),m=Math.max(c.r,c.g,c.b);CY.copy(c).multiplyScalar(3.2/m);CYD.copy(c).multiplyScalar(2/m)}
S.background.set(BGC);S.fog.color.set(BGC);

/* ---------- layout ---------- */
const parts=[
 ['soc','soc',0,0,3,3,.34,'U1'],
 ['pmic','qfn',-6,-3.5,1.15,1.15,.11,'U5',['RS-PM8','2648 A3']],
 ['se','qfn',-2.8,-3.6,.75,.75,.1,'U7',['SEC-EL','EAL6+']],
 ['flash','soic',-5.5,0,1.15,.85,.15,'U3',['NOR 128M','SPI · 2641']],
 ['dram1','bga',4.2,-3,1.5,1.05,.12,'U10',['LPDDR4X','4GB · 2639']],
 ['dram2','bga',6.2,-3,1.5,1.05,.12,'U11',['LPDDR4X','4GB · 2639']],
 ['emmc','bga',4.8,1.2,1.6,1.3,.14,'U4',['eMMC 5.1','64GB']],
 ['npu','qfn',-2.5,3.6,1.15,1.15,.11,'U8',['NPU-4','4 TOPS']],
 ['modem','shield',5.5,3.8,2,1.3,.22,'M1'],
 ['can','soic',2.2,3.9,.9,.65,.14,'U9',['CAN FD','PHY']]];
const keepOut=[...parts.map(p=>[p[2],p[3],p[4]+.5,p[5]+.5]),[-6.5,3.5,2,1],[7.6,3.8,1,1],[2.2,4.6,1.4,1],[-7.55,-1.6,1,1.2],[1.9,-1.9,1.1,.6],[-6.6,-2.2,1,1],[-5.4,-2.2,1,1],[-6.9,-1.1,.9,.9],[-7.4,-4.4,.9,.9],[7.4,-4.4,.9,.9],[-7.4,4.4,.9,.9],[7.4,4.4,.9,.9],[4.6,-4.45,4.4,.6]];
const free=(x,z,m=0)=>Math.abs(x)<7.7&&Math.abs(z)<4.7&&!keepOut.some(([cx,cz,w,d])=>Math.abs(x-cx)<w/2+m&&Math.abs(z-cz)<d/2+m);
const RT={r1:[[[-5.3,-3.3],[-4,-3.3],[-4,-1],[-1.5,-1]],5],r2:[[[-4.75,0],[-1.5,0]],7],r3:[[[-5.7,3.5],[-4,3.5],[-4,1],[-1.5,1]],5],
 r4:[[[1.5,-.8],[2.6,-.8],[2.6,-3],[3.45,-3]],11],r5:[[[4,.8],[1.5,.8]],9],r6:[[[4.2,1.85],[4.2,2.7],[-2.5,2.7],[-2.5,3.02]],5],
 r7a:[[[7.45,3.8],[6.5,3.8]],1],r7b:[[[5.5,3.15],[5.5,1.85]],5],r8c:[[[2.2,4.35],[2.2,4.22]],1],r8:[[[1.55,3.9],[.5,3.9],[.5,1.5]],3],r8b:[[[-.5,-1.5],[-.5,-3.6],[-2.42,-3.6]],3]};
const BLOCK={r3:.56,r8:.62};
function offsetPath(pts,o){if(!o)return pts.map(p=>p.slice());const n=(a,b)=>{const dx=b[0]-a[0],dz=b[1]-a[1],L=Math.hypot(dx,dz);return[-dz/L,dx/L]};
 return pts.map((p,i)=>{if(i===0||i===pts.length-1){const v=i?n(pts[i-1],p):n(p,pts[1]);return[p[0]+v[0]*o,p[1]+v[1]*o]}const a=n(pts[i-1],p),b=n(p,pts[i+1]);return[p[0]+(a[0]+b[0])*o,p[1]+(a[1]+b[1])*o]})}
function chamfer(pts,c=.28){const out=[pts[0]];for(let i=1;i<pts.length-1;i++){const p=pts[i],a=pts[i-1],b=pts[i+1];const la=Math.hypot(p[0]-a[0],p[1]-a[1]),lb=Math.hypot(b[0]-p[0],b[1]-p[1]),k=Math.min(c,la*.45,lb*.45);out.push([p[0]+(a[0]-p[0])/la*k,p[1]+(a[1]-p[1])/la*k],[p[0]+(b[0]-p[0])/lb*k,p[1]+(b[1]-p[1])/lb*k])}out.push(pts[pts.length-1]);return out}
const traces=[],pads=[],vias=[],silkR=[],silkT=[],holes=[],routes={};
const bus=(c,n,w=.04,sp=.08,fade=0)=>{for(let j=0;j<n;j++)traces.push({pts:chamfer(offsetPath(c,(j-(n-1)/2)*sp)),w,fade})};
for(const k in RT){const [c,n]=RT[k];bus(c,n,k==='r7a'?.12:.045,.085);
 const pts=chamfer(c),cum=[0];for(let j=1;j<pts.length;j++)cum.push(cum[j-1]+Math.hypot(pts[j][0]-pts[j-1][0],pts[j][1]-pts[j-1][1]));routes[k]={pts,cum,L:cum[cum.length-1]}}
/* fan-out highways from the SoC to the board edges */
[[[1.5,-.2],[3,-.2],[3.6,.4],[7.8,.4]],[[1.5,.35],[2.6,.35],[3.2,-.25],[7.8,-.25]],[[-1.5,-.5],[-3.2,-.5],[-3.7,-1.6],[-7.8,-1.6]],[[-1.5,.5],[-3.1,.5],[-3.6,1.9],[-7.8,1.9]],
 [[-.9,1.5],[-.9,2.2],[-1.3,2.4],[-6,2.4],[-6.4,4.8]],[[1,1.5],[1,2.3],[1.4,2.5],[3.4,2.5],[3.6,4.8]],[[-1,-1.5],[-1,-2.4],[-1.4,-2.8],[-1.4,-4.8]],[[1.1,-1.5],[1.1,-2.5],[1.6,-3],[1.6,-4.8]],
 [[-4,-4.8],[-4,-2.2],[-3.4,-2.2]],[[7.8,1.9],[6.2,1.9],[6,2.6]],[[7.8,-1.4],[3.4,-1.4],[3,-1.9]]].forEach(c=>bus(c,6+Math.floor(rnd()*6),.035,.075));
for(let k=0;k<260;k++){let x=-7.6+rnd()*15.2,z=-4.6+rnd()*9.2;if(!free(x,z))continue;const pts=[[x,z]];let ok=true;
 for(let s=0;s<2+Math.floor(rnd()*2);s++){if(s%2)z+=(rnd()-.5)*3;else x+=(rnd()-.5)*4;if(!free(x,z,.05)){ok=false;break}pts.push([x,z])}
 if(!ok||pts.length<2)continue;bus(pts,1+Math.floor(rnd()*4),.035,.075);
 vias.push({x:pts[0][0],z:pts[0][1],r:.05,t:rnd()<.8},{x:pts[pts.length-1][0],z:pts[pts.length-1][1],r:.05,t:rnd()<.8})}
for(let x=-7.6;x<=7.6;x+=.32){vias.push({x,z:-4.78,r:.035,t:true},{x,z:4.78,r:.035,t:true})}
for(let k=0;k<200;k++){const x=-7.6+rnd()*15.2,z=-4.6+rnd()*9.2;if(free(x,z,.05))vias.push({x,z,r:.04,t:rnd()<.85})}
const passives=[];
function addPassive(x,z,rot){if(passives.some(p=>Math.abs(p.x-x)<.3&&Math.abs(p.z-z)<.3))return;passives.push({x,z,rot,res:rnd()<.45});const dx=rot?0:.085,dz=rot?.085:0;pads.push({x:x-dx,z:z-dz,w:rot?.12:.08,d:rot?.08:.12},{x:x+dx,z:z+dz,w:rot?.12:.08,d:rot?.08:.12})}
for(let t=-1.3;t<=1.31;t+=.26){addPassive(t,-1.82,0);addPassive(t,1.82,0);addPassive(-1.82,t,1);addPassive(1.82,t,1)}
for(let k=0;k<1400&&passives.length<230;k++){const x=-7.5+rnd()*15,z=-4.5+rnd()*9;if(free(x,z,.02))addPassive(x,z,rnd()<.5?1:0)}
parts.forEach(([id,kind,x,z,w,d,h,ref])=>{
  silkR.push({x,z,w:w+(kind==='soic'?.62:.26),d:d+.26});silkT.push({x:x-w/2-.1,z:z-d/2-.24,t:ref,s:.17});
  if(kind==='soic'){for(let i=0;i<4;i++)for(const s of[-1,1])pads.push({x:x+s*(w/2+.14),z:z-d/2+(i+.5)*d/4,w:.2,d:.09})}
  if(kind==='qfn'){const n=Math.round(w/.13);for(let i=0;i<n;i++){const t=-w/2+(i+.5)*w/n;pads.push({x:x+t,z:z-d/2-.03,w:.06,d:.1},{x:x+t,z:z+d/2+.03,w:.06,d:.1},{x:x-w/2-.03,z:z+t,w:.1,d:.06},{x:x+w/2+.03,z:z+t,w:.1,d:.06})}}});
silkT.push({x:-7,z:3.0,t:'J3 JTAG',s:.17},{x:7.2,z:3.2,t:'J5',s:.17},{x:1.6,z:4.95,t:'J4 CAN',s:.14},{x:-7.85,z:-2.45,t:'J1',s:.17},{x:1.45,z:-2.35,t:'Y1',s:.15},{x:-7.1,z:-2.85,t:'L1',s:.15},{x:-5.9,z:-2.85,t:'L2',s:.15},{x:-2.15,z:-2.2,t:'D1 PWR',s:.13},{x:2.25,z:2.25,t:'D2',s:.13});
silkT.push({x:3.4,z:-4.48,t:'RELRO  SC-3  REV 3.1',s:.27,b:1},{x:3.4,z:-4.18,t:'SECURE CONTROLLER · DESIGNED IN SOFIA',s:.15});
for(let k=0;k<14;k++){const x=-7+rnd()*14,z=-4.3+rnd()*8.6;if(free(x,z,.1)){pads.push({x,z,w:.16,d:.16,round:1});silkT.push({x:x+.14,z:z+.05,t:'TP'+(10+k),s:.11})}}
holes.push([-7.4,-4.4],[7.4,-4.4],[-7.4,4.4],[7.4,4.4]);
pads.push({x:-1.2,z:-4.5,w:.12,d:.12,round:1},{x:1.2,z:4.55,w:.12,d:.12,round:1},{x:-6.5,z:3.5,w:1.55,d:.55,hdr:1},{x:7.6,z:3.8,w:.55,d:.55},{x:2.2,z:4.6,w:1.05,d:.35},{x:-7.55,z:-1.6,w:.5,d:.95});

/* ---------- board textures ---------- */
const PX=small?190:256,BW=16*PX,BH=10*PX,X=x=>(x+8)*PX,Y=z=>(z+5)*PX;
function paint(mode){
  const c=cnv(BW,BH),g=c.getContext('2d');
  const C={col:{bg:'#03090f',tr:'#0a1a26',via:'#0c1e2b',viaIn:'#030a10',pad:'#b8954c',silk:'#8f9ca5',hole:'#010203',ring:'#a9884a'},
           bmp:{bg:'#3a3a3a',tr:'#8c8c8c',via:'#9a9a9a',viaIn:'#2a2a2a',pad:'#a8a8a8',silk:'#c4c4c4',hole:'#000',ring:'#a0a0a0'},
           met:{bg:'#000',tr:'#000',via:'#000',viaIn:'#000',pad:'#fff',silk:'#000',hole:'#000',ring:'#fff'},
           rgh:{bg:'#3a3a3a',tr:'#343434',via:'#343434',viaIn:'#606060',pad:'#404040',silk:'#b0b0b0',hole:'#fff',ring:'#404040'}}[mode];
  g.fillStyle=C.bg;g.fillRect(0,0,BW,BH);
  if(mode==='col'){for(let k=0;k<22000;k++){g.fillStyle=`rgba(${rnd()<.5?'0,0,0':'60,110,150'},${.04+rnd()*.05})`;g.fillRect(rnd()*BW,rnd()*BH,1+rnd()*2,1+rnd()*2)}}
  if(mode==='bmp')g.filter='blur(1.2px)';
  g.lineJoin='round';g.lineCap='round';g.strokeStyle=C.tr;
  traces.forEach(t=>{g.lineWidth=t.w*PX;g.beginPath();t.pts.forEach((p,i)=>i?g.lineTo(X(p[0]),Y(p[1])):g.moveTo(X(p[0]),Y(p[1])));g.stroke()});
  vias.forEach(v=>{const a=v.t?C.via:C.ring,b=v.t?C.viaIn:C.hole;g.fillStyle=a;g.beginPath();g.arc(X(v.x),Y(v.z),v.r*1.7*PX,0,7);g.fill();g.fillStyle=b;g.beginPath();g.arc(X(v.x),Y(v.z),v.r*.8*PX,0,7);g.fill()});
  g.fillStyle=C.pad;
  pads.forEach(p=>{if(p.round){g.beginPath();g.arc(X(p.x),Y(p.z),p.w/2*PX,0,7);g.fill()}else if(p.hdr){for(let i=0;i<10;i++){g.beginPath();g.arc(X(-7.1+(i%5)*.3),Y(3.35+Math.floor(i/5)*.3),.1*PX,0,7);g.fill()}}else g.fillRect(X(p.x-p.w/2),Y(p.z-p.d/2),p.w*PX,p.d*PX)});
  holes.forEach(([x,z])=>{g.fillStyle=C.ring;g.beginPath();g.arc(X(x),Y(z),.3*PX,0,7);g.fill();g.fillStyle=C.hole;g.beginPath();g.arc(X(x),Y(z),.19*PX,0,7);g.fill()});
  g.strokeStyle=C.silk;g.fillStyle=C.silk;g.lineWidth=.024*PX;
  silkR.forEach(r=>{g.strokeRect(X(r.x-r.w/2),Y(r.z-r.d/2),r.w*PX,r.d*PX);g.beginPath();g.arc(X(r.x-r.w/2-.08),Y(r.z-r.d/2-.08),.035*PX,0,7);g.fill()});
  g.strokeRect(X(-7.35),Y(3.12),1.7*PX,.76*PX);g.textBaseline='middle';
  silkT.forEach(t=>{g.font=`${t.b?700:600} ${t.s*PX}px "IBM Plex Sans",Arial,sans-serif`;g.fillText(t.t,X(t.x),Y(t.z))});
  for(let i=0;i<14;i++)for(let j=0;j<14;j++)if(i===0||j===13||rnd()<.45)g.fillRect(X(-.9)+i*.032*PX,Y(-4.62)+j*.032*PX,.032*PX,.032*PX);
  const t=tx(c);if(mode==='col')t.colorSpace=THREE.SRGBColorSpace;return t}
/* glow map: R = trace, G = position along trace (for flowing light), B = per-trace offset */
function glowMap(){const c=cnv(BW,BH),g=c.getContext('2d');g.fillStyle='#000';g.fillRect(0,0,BW,BH);g.lineCap='round';const K=.55;
  traces.forEach(t=>{const off=Math.floor(rnd()*255);let d=0;g.lineWidth=t.w*PX*.85;
    for(let j=1;j<t.pts.length;j++){const a=t.pts[j-1],b=t.pts[j],L=Math.hypot(b[0]-a[0],b[1]-a[1]);let s=0;
      while(s<L-1e-4){const v0=(d+s)*K,f0=v0-Math.floor(v0),s1=Math.min(L,s+(1-f0)/K),f1=f0+(s1-s)*K;
        const x0=a[0]+(b[0]-a[0])*s/L,z0=a[1]+(b[1]-a[1])*s/L,x1=a[0]+(b[0]-a[0])*s1/L,z1=a[1]+(b[1]-a[1])*s1/L;
        const gr=g.createLinearGradient(X(x0),Y(z0),X(x1),Y(z1));gr.addColorStop(0,`rgb(255,${Math.round(f0*254)},${off})`);gr.addColorStop(1,`rgb(255,${Math.round(Math.min(1,f1)*254)},${off})`);
        g.strokeStyle=gr;g.beginPath();g.moveTo(X(x0),Y(z0));g.lineTo(X(x1),Y(z1));g.stroke();s=s1}
      d+=L}});
  const t=new THREE.CanvasTexture(c);t.generateMipmaps=false;t.minFilter=THREE.LinearFilter;return t}
setLoad(44,'Anti-rollback check · version 3.1 ≥ fused minimum');await tick();
const MAPS={};for(const [k,m,p] of [['col','col',52],['bmp','bmp',58],['met','met',62],['rgh','rgh',66]]){MAPS[k]=paint(m);setLoad(p);await tick()}
setLoad(68,'Locking JTAG / SWD debug ports');await tick();const GLOW=glowMap();setLoad(74,'Starting trusted execution environment');await tick();
const U={uAcc:{value:(()=>{const c=new THREE.Color(ACC),m=Math.max(c.r,c.g,c.b);return new THREE.Vector3(c.r,c.g,c.b).multiplyScalar(1.25/m)})()},glowMap:{value:GLOW},uTime:{value:0},uPower:{value:.2},uFlow:{value:0},uRed:{value:0}};
const board=new THREE.Group();S.add(board);
/* semi-transparent board: the substrate fades, the glowing traces stay bright */
const topMat=new THREE.MeshPhysicalMaterial({map:MAPS.col,bumpMap:MAPS.bmp,bumpScale:2.2,metalnessMap:MAPS.met,metalness:1,roughnessMap:MAPS.rgh,roughness:1,clearcoat:1,clearcoatRoughness:.24,envMapIntensity:.22,transparent:true,opacity:.42,depthWrite:false});
topMat.onBeforeCompile=sh=>{Object.assign(sh.uniforms,U);sh.fragmentShader=sh.fragmentShader.replace('#include <common>','#include <common>\nuniform sampler2D glowMap;uniform float uTime,uPower,uFlow,uRed;uniform vec3 uAcc;float gA=0.0;')
 .replace('#include <emissivemap_fragment>',`#include <emissivemap_fragment>
 {vec4 gm=texture2D(glowMap,vMapUv);float ph=fract(gm.g+gm.b*5.0-uTime*.55);float cm=pow(ph,9.0)+pow(fract(ph+.5),22.0)*.35;
  vec3 cy=mix(uAcc,vec3(1.4,.08,.05),uRed);vec3 ge=cy*gm.r*(uPower*.09+uFlow*cm*3.2);totalEmissiveRadiance+=ge;gA=max(gm.r*(.35+uPower*.3),clamp(length(ge)*.8,0.,1.));
  vec4 pm=texture2D(metalnessMap,vMetalnessMapUv);gA=max(gA,pm.g*.85);}`)
 .replace('#include <dithering_fragment>','#include <dithering_fragment>\ngl_FragColor.a=max(gl_FragColor.a,gA);')};
const top=new THREE.Mesh(new THREE.PlaneGeometry(16,10),topMat);top.rotation.x=-Math.PI/2;top.renderOrder=-2;board.add(top);
const core=new THREE.Mesh(new RoundedBoxGeometry(16,.2,10,2,.02),new THREE.MeshPhysicalMaterial({color:0x0c2a3a,roughness:.35,transparent:true,opacity:.12,depthWrite:false,transmission:0}));core.position.y=-.101;core.renderOrder=-3;board.add(core);

/* ---------- materials & helpers ---------- */
const M={
 epoxy:new THREE.MeshPhysicalMaterial({color:0x0b0c0e,roughness:.38,clearcoat:.5,clearcoatRoughness:.25}),
 tin:new THREE.MeshStandardMaterial({color:0xcfd4d8,metalness:1,roughness:.28}),
 gold:new THREE.MeshStandardMaterial({color:0xe2b85e,metalness:1,roughness:.22}),
 black:new THREE.MeshStandardMaterial({color:0x0a0b0c,roughness:.4}),
 cap:new THREE.MeshStandardMaterial({color:0x6e5a44,roughness:.5}),
 res:new THREE.MeshStandardMaterial({color:0x0e0f10,roughness:.45}),
 sub:new THREE.MeshPhysicalMaterial({color:0x0d1a22,roughness:.35,clearcoat:.8}),
 alu:new THREE.MeshStandardMaterial({color:0x9aa1a8,metalness:1,roughness:.42}),
 green:new THREE.MeshStandardMaterial({color:0x14402a,roughness:.45}),
 dark:new THREE.MeshStandardMaterial({color:0x030303,roughness:.9})};
function marking(lines,w,d,opt={}){const k=256,c=cnv(Math.round(w*k),Math.round(d*k)),g=c.getContext('2d');
  if(opt.bg){g.fillStyle=opt.bg;g.fillRect(0,0,c.width,c.height)}
  g.fillStyle=opt.fg||'rgba(130,138,145,.75)';g.textAlign='center';g.textBaseline='middle';
  const fs=Math.min(c.height/(lines.length+1.4),c.width/7.5);
  lines.forEach((l,i)=>{g.font=`${i?500:600} ${fs*(i?.82:1)}px "IBM Plex Sans",Arial,sans-serif`;g.fillText(l,c.width/2,c.height/2+(i-(lines.length-1)/2)*fs*1.25)});
  if(!opt.nodot){g.beginPath();g.arc(fs*.6,fs*.6,fs*.2,0,7);g.fillStyle='rgba(255,255,255,.1)';g.fill()}
  const t=tx(c);t.colorSpace=THREE.SRGBColorSpace;return t}
function decal(map,x,z,w,d,y,o={}){const m=new THREE.Mesh(new THREE.PlaneGeometry(w,d),o.mat||new THREE.MeshStandardMaterial({map,transparent:true,roughness:o.r??.6,metalness:o.m??0,polygonOffset:true,polygonOffsetFactor:-2}));m.rotation.x=-Math.PI/2;m.position.set(x,y,z);board.add(m);return m}
const shadowTex=(()=>{const c=cnv(128,128),g=c.getContext('2d');g.filter='blur(14px)';g.fillStyle='#000';g.fillRect(28,28,72,72);return tx(c)})();
function contact(x,z,w,d,o=.8){const m=new THREE.Mesh(new THREE.PlaneGeometry(w*1.55+.2,d*1.55+.2),new THREE.MeshBasicMaterial({map:shadowTex,transparent:true,opacity:o,depthWrite:false,color:0}));m.rotation.x=-Math.PI/2;m.position.set(x,.002,z);board.add(m)}
function box(w,h,d,mat,x,y,z,r=.012){const m=new THREE.Mesh(r?new RoundedBoxGeometry(w,h,d,2,Math.min(r,h/2.2)):new THREE.BoxGeometry(w,h,d),mat);m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;board.add(m);return m}
const dummy=new THREE.Object3D();
function instanced(geo,mat,list){const im=new THREE.InstancedMesh(geo,mat,list.length);list.forEach((f,i)=>{f(dummy);dummy.updateMatrix();im.setMatrixAt(i,dummy.matrix);dummy.rotation.set(0,0,0);dummy.scale.set(1,1,1)});im.castShadow=true;im.receiveShadow=true;board.add(im);return im}
const gull=(()=>{const a=.07,t=.016,s=new THREE.Shape();s.moveTo(0,a);s.lineTo(.045,a);s.quadraticCurveTo(.07,a,.08,a-.02);s.lineTo(.1,t+.005);s.quadraticCurveTo(.11,t,.13,t);s.lineTo(.22,t);s.lineTo(.22,0);s.lineTo(.12,0);s.quadraticCurveTo(.1,0,.09,.01);s.lineTo(.065,a-t-.01);s.quadraticCurveTo(.06,a-t,.045,a-t);s.lineTo(0,a-t);s.closePath();const g=new THREE.ExtrudeGeometry(s,{depth:.055,bevelEnabled:false,curveSegments:4});g.translate(0,0,-.0275);return g})();
const leads=[],qpads=[],comps={};
let dieMat=null;
parts.forEach(([id,kind,x,z,w,d,h,ref,mk])=>{
  comps[id]={x,z,h:kind==='soc'?.34:h,w,d};
  if(kind==='soc'){contact(x,z,w,d,.95);box(w,.1,d,M.sub,x,.05,z,.02);
    box(2.25,.13,2.25,new THREE.MeshPhysicalMaterial({color:0x0c0e11,metalness:.6,roughness:.32,clearcoat:1,clearcoatRoughness:.3}),x,.165,z,.03);
    const cs=[];for(let i=0;i<22;i++){const t=-1.3+i*(2.6/21);cs.push(o=>o.position.set(x+t,.115,z-1.38),o=>o.position.set(x+t,.115,z+1.38))}instanced(new THREE.BoxGeometry(.06,.03,.04),M.gold,cs);
    const c=cnv(512,512),g=c.getContext('2d');for(let i=0;i<40;i++)for(let j=0;j<40;j++){const v=.35+rnd()*.65;g.fillStyle=`rgba(255,${Math.round(170*v)},${Math.round(70*v)},${v})`;g.fillRect(16+i*12,16+j*12,8,8)}
    g.strokeStyle='rgba(255,190,110,.9)';g.lineWidth=4;g.strokeRect(8,8,496,496);
    const t=tx(c);t.colorSpace=THREE.SRGBColorSpace;dieMat=new THREE.MeshBasicMaterial({map:t,color:HDR(.2,.2,.2),transparent:true,toneMapped:false,blending:THREE.AdditiveBlending,depthWrite:false});
    decal(null,x,z,1.25,1.25,.2315,{mat:dieMat});
    decal(marking(['RELRO RS-1 · SECURE SoC','2647 · SG 9A1'],2.1,.5,{fg:'rgba(150,160,170,.7)',nodot:1}),x,z+.82,2.1,.5,.2318,{r:.4});
    return}
  if(kind==='shield'){contact(x,z,w,d,.85);box(w,h,d,M.alu,x,h/2,z,.02);
    const c=cnv(512,333),g=c.getContext('2d');g.fillStyle='#e8eaec';g.fillRect(0,0,512,333);g.fillStyle='#161616';g.font='700 46px "IBM Plex Sans",Arial';g.fillText('LTE · 5G RedCap',28,70);g.font='500 28px "IBM Plex Sans",Arial';g.fillText('Module  RM-5C  ·  EU',28,115);g.fillText('IMEI 35 •••• •••• 2741',28,155);
    for(let i=0,x0=28;x0<330;i++){const bw=2+Math.floor(rnd()*5);if(i%2==0)g.fillRect(x0,190,bw,95);x0+=bw}
    for(let i=0;i<12;i++)for(let j=0;j<12;j++)if(rnd()<.5||i===0||j===11)g.fillRect(372+i*9,190+j*9,9,9);
    const t=tx(c);t.colorSpace=THREE.SRGBColorSpace;decal(t,x-.1,z,1.55,1.0,h+.001,{r:.85});return}
  contact(x,z,w,d,kind==='bga'?.9:.8);
  box(w,h,d,M.epoxy,x,h/2+(kind==='soic'?.02:.004),z,.025);
  decal(marking(mk,w,d),x,z,w*.94,d*.94,h+(kind==='soic'?.02:.004)+.0008);
  if(kind==='soic'){for(let i=0;i<4;i++)for(const s of[-1,1]){const zz=z-d/2+(i+.5)*d/4;leads.push(o=>{o.position.set(x+s*w/2,0,zz);o.rotation.y=s>0?0:Math.PI})}}
  if(kind==='qfn'){const n=Math.round(w/.13);for(let i=0;i<n;i++){const t=-w/2+(i+.5)*w/n;qpads.push(o=>o.position.set(x+t,.012,z-d/2),o=>o.position.set(x+t,.012,z+d/2),o=>{o.position.set(x-w/2,.012,z+t);o.rotation.y=Math.PI/2},o=>{o.position.set(x+w/2,.012,z+t);o.rotation.y=Math.PI/2})}}
});
instanced(gull,M.tin,leads);instanced(new THREE.BoxGeometry(.055,.024,.05),M.tin,qpads);
{const capsL=passives.filter(p=>!p.res),res=passives.filter(p=>p.res),ends=[];
 const body=(list,mat,h)=>instanced(new RoundedBoxGeometry(.13,h,.09,1,.012),mat,list.map(p=>o=>{o.position.set(p.x,h/2+.004,p.z);o.rotation.y=p.rot?Math.PI/2:0}));
 body(capsL,M.cap,.08);body(res,M.res,.055);
 passives.forEach(p=>{const h=p.res?.058:.083;for(const s of[-1,1])ends.push(o=>{o.position.set(p.x+(p.rot?0:s*.075),h/2+.004,p.z+(p.rot?s*.075:0));o.rotation.y=p.rot?Math.PI/2:0;o.scale.y=h})});
 instanced(new RoundedBoxGeometry(.035,1,.095,1,.01),M.tin,ends);
 const im=instanced(new THREE.PlaneGeometry(.26,.18),new THREE.MeshBasicMaterial({map:shadowTex,transparent:true,opacity:.6,depthWrite:false,color:0}),passives.map(p=>o=>{o.position.set(p.x,.0015,p.z);o.rotation.set(-Math.PI/2,0,p.rot?Math.PI/2:0)}));im.castShadow=false}
contact(-6.5,3.5,1.6,.6,.85);box(1.5,.16,.58,M.black,-6.5,.08,3.5,.02);
{const pins=[];for(let i=0;i<10;i++)pins.push(o=>o.position.set(-7.1+(i%5)*.3,.33,3.35+Math.floor(i/5)*.3));instanced(new THREE.BoxGeometry(.065,.62,.065),M.gold,pins)}
comps.jtag={x:-6.5,z:3.5,h:.6,w:1.6,d:.6};
{const g=new THREE.Group();board.add(g);g.position.set(7.6,0,3.8);box(.55,.06,.55,M.gold,7.6,.03,3.8,.01);
 const nut=new THREE.Mesh(new THREE.CylinderGeometry(.2,.2,.18,6),M.gold);nut.rotation.z=Math.PI/2;nut.position.set(.22,.26,0);
 const bar=new THREE.Mesh(new THREE.CylinderGeometry(.15,.15,.5,28),M.gold);bar.rotation.z=Math.PI/2;bar.position.set(.55,.26,0);
 const ins=new THREE.Mesh(new THREE.CylinderGeometry(.09,.09,.02,24),new THREE.MeshStandardMaterial({color:0xf2efe6,roughness:.6}));ins.rotation.z=Math.PI/2;ins.position.set(.81,.26,0);
 const bd=new THREE.Mesh(new THREE.BoxGeometry(.3,.3,.3),M.gold);bd.position.set(-.02,.2,0);[nut,bar,ins,bd].forEach(m=>{m.castShadow=true;g.add(m)});contact(7.6,3.8,.5,.5,.7)}
comps.ant={x:8,z:3.8,h:.45,w:.6,d:.6};
contact(2.2,4.6,1,.55,.85);box(1,.5,.55,M.green,2.2,.25,4.6,.03);
{const sc=[];[1.95,2.45].forEach(x=>sc.push(o=>o.position.set(x,.505,4.52)));instanced(new THREE.CylinderGeometry(.13,.13,.03,24),M.tin,sc);[1.95,2.45].forEach(x=>{box(.2,.02,.035,M.dark,x,.52,4.52,0);box(.26,.2,.02,M.dark,x,.22,4.879,0)})}
contact(-7.55,-1.6,.4,.9,.7);box(.42,.3,.9,M.tin,-7.55,.15,-1.6,.12);box(.02,.14,.64,M.dark,-7.77,.15,-1.6,0);
contact(1.9,-1.9,.9,.4,.7);box(.9,.32,.38,M.alu,1.9,.16,-1.9,.12);
[[-6.6,-2.2],[-5.4,-2.2]].forEach(([x,z])=>{contact(x,z,.7,.7);box(.72,.38,.72,new THREE.MeshStandardMaterial({color:0x1c1d20,roughness:.7}),x,.19,z,.04);decal(marking(['4R7'],.6,.6,{fg:'rgba(200,200,200,.5)',nodot:1}),x,z,.55,.55,.3805)});
{const x=-6.9,z=-1.1;contact(x,z,.6,.6);box(.66,.06,.66,M.black,x,.03,z,.01);const c=new THREE.Mesh(new THREE.CylinderGeometry(.29,.29,.62,40),M.alu);c.position.set(x,.37,z);c.castShadow=true;board.add(c)}
const leds={};[['d1',-1.9,-2.0,0x30ff7a],['d2',2.0,2.05,0x38d0ff]].forEach(([id,x,z,c])=>{box(.16,.06,.09,M.tin,x,.035,z,0);leds[id]=box(.1,.07,.1,new THREE.MeshStandardMaterial({color:0xffffff,emissive:c,emissiveIntensity:3,roughness:.3}),x,.075,z,.01)});
/* scattered indicator lights (reference: bright dots across the board) */
const dotList=[];for(let k=0;k<1200&&dotList.length<240;k++){const x=-7.6+rnd()*15.2,z=-4.6+rnd()*9.2;if(free(x,z,.02))dotList.push([x,z,rnd()])}
const dots=new THREE.InstancedMesh(new THREE.SphereGeometry(.022,8,6),new THREE.MeshBasicMaterial({color:0xffffff,toneMapped:false}),dotList.length);
dotList.forEach(([x,z,r],i)=>{dummy.position.set(x,.02,z);dummy.updateMatrix();dots.setMatrixAt(i,dummy.matrix);dots.setColorAt(i,r<.82?CY.clone().multiplyScalar(.9):r<.94?HDR(2.5,2.4,2.2):HDR(3,.5,.3))});board.add(dots);
/* dust */
const dustG=new THREE.BufferGeometry(),DN=small?220:420,dp=new Float32Array(DN*3);for(let k=0;k<DN;k++){dp[k*3]=(rnd()-.5)*18;dp[k*3+1]=rnd()*4;dp[k*3+2]=(rnd()-.5)*12}dustG.setAttribute('position',new THREE.BufferAttribute(dp,3));
const glowT=(()=>{const c=cnv(64,64),x=c.getContext('2d'),g=x.createRadialGradient(32,32,0,32,32,32);g.addColorStop(0,'rgba(255,255,255,1)');g.addColorStop(.2,'rgba(255,255,255,.8)');g.addColorStop(.5,'rgba(255,255,255,.15)');g.addColorStop(1,'rgba(255,255,255,0)');x.fillStyle=g;x.fillRect(0,0,64,64);return new THREE.CanvasTexture(c)})();
const dust=new THREE.Points(dustG,new THREE.PointsMaterial({map:glowT,size:.05,color:HDR(.5,1.1,1.6),transparent:true,opacity:.5,depthWrite:false,blending:THREE.AdditiveBlending,toneMapped:false}));S.add(dust);

/* ---------- live overlays ---------- */
const at=(r,t)=>{const d=t*r.L;let j=1;while(j<r.cum.length-1&&r.cum[j]<d)j++;const a=r.pts[j-1],b=r.pts[j],u=(d-r.cum[j-1])/((r.cum[j]-r.cum[j-1])||1);return[a[0]+(b[0]-a[0])*u,a[1]+(b[1]-a[1])*u]};
for(const k in routes){const r=routes[k],lim=(BLOCK[k]||1)*r.L;r.mat=new THREE.MeshBasicMaterial({color:CY.clone(),transparent:true,opacity:0,depthWrite:false,toneMapped:false,blending:THREE.AdditiveBlending});
 for(let j=1;j<r.pts.length;j++){if(r.cum[j-1]>=lim)break;const a=r.pts[j-1];let b=r.pts[j];if(r.cum[j]>lim)b=at(r,BLOCK[k]);const L=Math.hypot(b[0]-a[0],b[1]-a[1]);
  const m=new THREE.Mesh(new THREE.PlaneGeometry(L+.05,.05),r.mat);m.rotation.x=-Math.PI/2;m.rotation.z=Math.atan2(-(b[1]-a[1]),b[0]-a[0]);m.position.set((a[0]+b[0])/2,.0045,(a[1]+b[1])/2);board.add(m)}}
{const p=at(routes.r3,BLOCK.r3);comps.lock={x:p[0],z:p[1],h:.25};const mat=new THREE.MeshBasicMaterial({color:RD,transparent:true,opacity:0,toneMapped:false});
 const ring=new THREE.Mesh(new THREE.TorusGeometry(.17,.022,12,48),mat);ring.rotation.x=-Math.PI/2;ring.position.set(p[0],.04,p[1]);board.add(ring);comps.lock.mat=mat;
 const bar=new THREE.Mesh(new THREE.PlaneGeometry(.25,.03),mat);bar.rotation.x=-Math.PI/2;bar.rotation.z=Math.PI/4;bar.position.set(p[0],.041,p[1]);board.add(bar)}
for(const id in comps){const c=comps[id];if(!c.w)continue;const W=c.w+.36,D=c.d+.36,mat=new THREE.MeshBasicMaterial({color:CY.clone(),transparent:true,opacity:0,depthWrite:false,toneMapped:false});
 [[0,-D/2,W,.022],[0,D/2,W,.022],[-W/2,0,.022,D],[W/2,0,.022,D]].forEach(([dx,dz,w,d])=>{const m=new THREE.Mesh(new THREE.PlaneGeometry(w,d),mat);m.rotation.x=-Math.PI/2;m.position.set(c.x+dx,.006,c.z+dz);board.add(m)});c.frame=mat}
const pool=[];for(let k=0;k<44;k++){const s=new THREE.Sprite(new THREE.SpriteMaterial({map:glowT,color:CY.clone(),transparent:true,blending:THREE.AdditiveBlending,depthWrite:false,toneMapped:false}));s.scale.set(.2,.2,1);s.visible=false;board.add(s);pool.push(s)}
S.traverse(o=>{if(o.material&&o!==top)[].concat(o.material).forEach(m=>{if(m.isMeshStandardMaterial)m.envMapIntensity=.45})});
const headL=new THREE.PointLight(0xffa64d,0,2.4,2);S.add(headL);

/* holograms */
const holo=(map,col,op=0)=>new THREE.MeshBasicMaterial({map,color:col,transparent:true,opacity:op,depthWrite:false,toneMapped:false,blending:THREE.AdditiveBlending,side:THREE.DoubleSide});
function ringTex(text,col){const c=cnv(1024,1024),g=c.getContext('2d');g.translate(512,512);g.strokeStyle=col;g.fillStyle=col;
  g.lineWidth=6;g.beginPath();g.arc(0,0,470,0,7);g.stroke();g.lineWidth=2;g.beginPath();g.arc(0,0,400,0,7);g.stroke();
  for(let i=0;i<120;i++){g.save();g.rotate(i/120*Math.PI*2);g.fillRect(-1.5,-470,3,i%10?14:30);g.restore()}
  for(let k=0;k<6;k++){g.lineWidth=14;g.globalAlpha=.55;g.beginPath();g.arc(0,0,330,k*1.05,k*1.05+.6);g.stroke()}g.globalAlpha=1;
  g.font='600 34px "IBM Plex Sans",Arial';g.textAlign='center';const chars=[...text];chars.forEach((ch,i)=>{g.save();g.rotate(i/chars.length*Math.PI*2);g.fillText(ch,0,-418);g.restore()});
  const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;return t}
const sigA=holo(ringTex('VERIFYING SIGNATURE · ECDSA P-256 · SHA-256 · BOOTLOADER IMAGE · ','#ffffff'),HB.clone()),sigB=holo(ringTex('SIGNATURE VALID · KEY HASH MATCHES OTP · BOOT CONTINUES · ','#ffffff'),GN.clone());
const sig=new THREE.Group();S.add(sig);sig.position.set(0,.62,0);
const sigMA=new THREE.Mesh(new THREE.PlaneGeometry(3.1,3.1),sigA),sigMB=new THREE.Mesh(new THREE.PlaneGeometry(3.1,3.1),sigB);[sigMA,sigMB].forEach(m=>{m.rotation.x=-Math.PI/2;sig.add(m)});
comps.sig={x:0,z:0,h:.4};
function layerTex(title,sub,badges,hero){const c=cnv(768,768),g=c.getContext('2d');g.strokeStyle='#fff';g.fillStyle='#fff';g.lineWidth=6;g.strokeRect(10,10,748,748);
  g.globalAlpha=.06;g.fillRect(10,10,748,748);g.globalAlpha=.12;g.lineWidth=1;for(let i=1;i<16;i++){g.beginPath();g.moveTo(10+i*47,10);g.lineTo(10+i*47,758);g.stroke();g.beginPath();g.moveTo(10,10+i*47);g.lineTo(758,10+i*47);g.stroke()}
  const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=ANISO;return t}
const GNC=HDR(.12,.85,.42),GNE=HDR(.3,1.8,.9);
const LY=[['KERNEL'],['APP LAYER'],['INTELLIGENCE LAYER']];
const slabGeo=new THREE.BoxGeometry(2.5,.05,2.5),slabEdge=new THREE.EdgesGeometry(slabGeo);
function tabTex(title,col='#45d4ff',bg='rgba(6,12,20,.9)'){const m=cnv(10,10).getContext('2d');m.font='700 80px "IBM Plex Sans",Arial';const W=Math.ceil(m.measureText(title).width)+120,c=cnv(W,180),g=c.getContext('2d');
  g.fillStyle=bg;g.fillRect(0,0,W,180);g.strokeStyle=col;g.lineWidth=4;g.strokeRect(2,2,W-4,176);g.fillStyle=col;g.fillRect(2,2,14,176);
  g.fillStyle='#f1ede6';g.font='700 80px "IBM Plex Sans",Arial';g.textBaseline='middle';g.fillText(title,60,94);
  const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=ANISO;return{t,ar:W/180}}
const layers=LY.map(([t,sub,bd,hero],k)=>{const g=new THREE.Group();S.add(g);
  const face=new THREE.Mesh(slabGeo,holo(null,HBD.clone(),0));g.add(face);
  const edge=new THREE.LineSegments(slabEdge,new THREE.LineBasicMaterial({color:HB.clone(),transparent:true,opacity:0,toneMapped:false,blending:THREE.AdditiveBlending,depthWrite:false}));g.add(edge);
  const lab=new THREE.Mesh(new THREE.PlaneGeometry(2.46,2.46),holo(layerTex(),HB.clone(),0));lab.rotation.x=-Math.PI/2;lab.position.y=.03;g.add(lab);
  const tb=tabTex(t),tab=new THREE.Mesh(new THREE.PlaneGeometry(.36*tb.ar,.36),new THREE.MeshBasicMaterial({map:tb.t,transparent:true,opacity:0,depthWrite:false,depthTest:false,toneMapped:false}));tab.renderOrder=20;S.add(tab);
  return{g,face,edge,lab,tab,w:0}});

/* intelligence layer: a small neural net that fires above the top slab */
const nnG=new THREE.Group();S.add(nnG);const nnN=[],nnL=[];
{const cols=[4,6,6,3];let prev=null;cols.forEach((n,ci)=>{const row=[];for(let k=0;k<n;k++){const p=new THREE.Vector3((ci-1.5)*.62,.32+Math.sin(k*1.7+ci)*.04,(k-(n-1)/2)*.34);row.push(p);nnN.push({p,o:rnd()*6})}
  if(prev)prev.forEach(a=>row.forEach(b=>nnL.push(a,b)));prev=row})}
const nnMesh=new THREE.InstancedMesh(new THREE.BoxGeometry(.09,.09,.09),new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:0,toneMapped:false,depthWrite:false}),nnN.length);
nnN.forEach((n,k)=>{dummy.position.copy(n.p);dummy.updateMatrix();nnMesh.setMatrixAt(k,dummy.matrix);nnMesh.setColorAt(k,HB)});nnG.add(nnMesh);
const nnLineM=new THREE.LineBasicMaterial({color:HBD.clone(),transparent:true,opacity:0,toneMapped:false,blending:THREE.AdditiveBlending,depthWrite:false});nnG.add(new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(nnL),nnLineM));
const nnSpark=[];for(let k=0;k<14;k++){const sp=new THREE.Sprite(new THREE.SpriteMaterial({map:glowT,color:HB.clone(),transparent:true,opacity:0,blending:THREE.AdditiveBlending,depthWrite:false,toneMapped:false}));sp.scale.set(.1,.1,1);nnG.add(sp);nnSpark.push({sp,i:Math.floor(rnd()*(nnL.length/2)),o:rnd()})}
comps.kern={x:1.25,z:1.25,h:.25};comps.scan={x:1.25,z:1.25,h:1.03};comps.ai={x:1.25,z:1.25,h:2.6};
const ups=[];for(let k=0;k<18;k++){const s=new THREE.Sprite(new THREE.SpriteMaterial({map:glowT,color:HB.clone(),transparent:true,opacity:0,blending:THREE.AdditiveBlending,depthWrite:false,toneMapped:false}));s.scale.set(.12,.12,1);s.userData={x:(rnd()-.5)*2,z:(rnd()-.5)*2,o:rnd()};S.add(s);ups.push(s)}
/* shield */
const shieldShape=s=>{const p=new THREE.Shape();p.moveTo(0,s);p.quadraticCurveTo(.5*s,.95*s,.85*s,.78*s);p.lineTo(.85*s,.1*s);p.quadraticCurveTo(.8*s,-.62*s,0,-s);p.quadraticCurveTo(-.8*s,-.62*s,-.85*s,.1*s);p.lineTo(-.85*s,.78*s);p.quadraticCurveTo(-.5*s,.95*s,0,s);return p};
const shield=new THREE.Group();S.add(shield);
const shM=holo(null,HB.clone()),shF=holo(null,HDR(.1,.5,.9));
{const o=shieldShape(1);o.holes.push(shieldShape(.9));shield.add(new THREE.Mesh(new THREE.ShapeGeometry(o,24),shM));const o2=shieldShape(.84);o2.holes.push(shieldShape(.8));shield.add(new THREE.Mesh(new THREE.ShapeGeometry(o2,24),shM));
 shield.add(new THREE.Mesh(new THREE.ShapeGeometry(shieldShape(.9),24),shF));
 const lb=new THREE.Mesh(new THREE.PlaneGeometry(.5,.38),shM);lb.position.y=-.12;shield.add(lb);const sk=new THREE.Mesh(new THREE.TorusGeometry(.17,.04,8,32,Math.PI),shM);sk.position.y=.07;shield.add(sk)}
shield.position.set(0,1.25,0);
/* small alarm lamp where the blocked frame stops */
const lampP=at(routes.r8,BLOCK.r8),lampM=new THREE.MeshStandardMaterial({color:0x220404,emissive:0xff2a1a,emissiveIntensity:0,roughness:.3});
const lamp=new THREE.Mesh(new THREE.SphereGeometry(.045,16,10),lampM);lamp.position.set(lampP[0]+.18,.05,lampP[1]);S.add(lamp);
const lampG=new THREE.Sprite(new THREE.SpriteMaterial({map:glowT,color:HDR(1.6,.15,.1),transparent:true,opacity:0,blending:THREE.AdditiveBlending,depthWrite:false,toneMapped:false}));lampG.scale.set(.22,.22,1);lampG.position.copy(lamp.position);S.add(lampG);
const dome=new THREE.Mesh(new THREE.IcosahedronGeometry(2.25,3),new THREE.MeshBasicMaterial({color:HB.clone(),wireframe:true,transparent:true,opacity:0,depthWrite:false,toneMapped:false,blending:THREE.AdditiveBlending}));dome.scale.y=.55;S.add(dome);

/* sandboxes */
const sand=[],sandEdge=holo(null,HB.clone()),sandBad=holo(null,RD.clone()),sandFace=holo(null,HDR(.08,.35,.7));
{const bg=new THREE.BoxGeometry(.82,.62,.82),eg=new THREE.EdgesGeometry(bg);
 [[-.95,-.55],[0,-.55],[.95,-.55],[-.95,.55],[0,.55],[.95,.55]].forEach(([x,z],k)=>{const g=new THREE.Group();g.position.set(x,.62,z);S.add(g);
  const em=k===4?sandBad:sandEdge;g.add(new THREE.Mesh(bg,sandFace));g.add(new THREE.LineSegments(eg,new THREE.LineBasicMaterial({color:k===4?RD.clone():HB.clone(),transparent:true,opacity:0,toneMapped:false,blending:THREE.AdditiveBlending,depthWrite:false})));
  const core=new THREE.Sprite(new THREE.SpriteMaterial({map:glowT,color:k===4?RD.clone():HB.clone(),transparent:true,opacity:0,blending:THREE.AdditiveBlending,depthWrite:false,toneMapped:false}));core.scale.set(.22,.22,1);g.add(core);
  sand.push({g,core,line:g.children[1],bad:k===4});comps['sb'+k]={x,z,h:.62}})}
/* agent graph */
const agent=new THREE.Group();S.add(agent);agent.position.set(-2.5,1.05,3.6);
const agMat=new THREE.MeshBasicMaterial({color:HB.clone(),wireframe:true,transparent:true,opacity:0,toneMapped:false,blending:THREE.AdditiveBlending,depthWrite:false});
const orb=new THREE.Mesh(new THREE.IcosahedronGeometry(.32,1),agMat);agent.add(orb);
const orbCore=new THREE.Sprite(new THREE.SpriteMaterial({map:glowT,color:HB.clone(),transparent:true,opacity:0,blending:THREE.AdditiveBlending,depthWrite:false,toneMapped:false}));orbCore.scale.set(.45,.45,1);agent.add(orbCore);
const gateM=new THREE.MeshBasicMaterial({color:HDR(.4,2.4,1.6),transparent:true,opacity:0,toneMapped:false,blending:THREE.AdditiveBlending,depthWrite:false});
const gate=new THREE.Mesh(new THREE.TorusGeometry(.72,.018,8,80),gateM);gate.rotation.x=Math.PI/2;agent.add(gate);
const gate2=new THREE.Mesh(new THREE.TorusGeometry(.78,.008,8,80),gateM);gate2.rotation.x=Math.PI/2;agent.add(gate2);
const tools=[],toolLine=new THREE.LineBasicMaterial({color:HBD.clone(),transparent:true,opacity:0,toneMapped:false,blending:THREE.AdditiveBlending,depthWrite:false});
for(let k=0;k<6;k++){const an=k/6*Math.PI*2+.3,p=new THREE.Vector3(Math.cos(an)*1.45,-.35+(k%2)*.25,Math.sin(an)*1.1);
 const n=new THREE.Mesh(new THREE.OctahedronGeometry(.09),agMat);n.position.copy(p);agent.add(n);
 const lg=new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(),p]);agent.add(new THREE.Line(lg,toolLine));
 const pk=new THREE.Sprite(new THREE.SpriteMaterial({map:glowT,color:HB.clone(),transparent:true,opacity:0,blending:THREE.AdditiveBlending,depthWrite:false,toneMapped:false}));pk.scale.set(.12,.12,1);agent.add(pk);tools.push({p,pk,o:k/6})}
const injFrom=new THREE.Vector3(1.9,.15,.9),inj=new THREE.Sprite(new THREE.SpriteMaterial({map:glowT,color:RD.clone(),transparent:true,opacity:0,blending:THREE.AdditiveBlending,depthWrite:false,toneMapped:false}));inj.scale.set(.2,.2,1);agent.add(inj);
const injLine=new THREE.Line(new THREE.BufferGeometry().setFromPoints([injFrom,injFrom.clone().setLength(.74)]),new THREE.LineDashedMaterial({color:RD.clone(),dashSize:.06,gapSize:.05,transparent:true,opacity:0,toneMapped:false}));injLine.computeLineDistances();agent.add(injLine);
comps.agent={x:-2.5,z:3.6,h:1.05};comps.gate={x:-2.5-.75,z:3.6,h:.75};{const e=injFrom.clone().setLength(1.7);comps.inj={x:-2.5+e.x,z:3.6+e.z,h:.9+e.y}}

/* labels: drawn inside the 3D scene so they move in the same frame as the board */
const LS=new THREE.Scene(),labelEls=[];
layers.forEach(L=>LS.add(L.tab));
/* OTA: signed package travels antenna → modem → eMMC, installs to slot B, verifies, switches */
const ota={g:new THREE.Group(),slots:[]};S.add(ota.g);
{const sg=new THREE.BoxGeometry(1.15,.05,1.3),se=new THREE.EdgesGeometry(sg);
 [['SLOT A',4.15],['SLOT B',5.5]].forEach(([n,x])=>{const g=new THREE.Group();g.position.set(x,.95,1.2);ota.g.add(g);
  const face=new THREE.Mesh(sg,holo(null,HBD.clone(),0));const edge=new THREE.LineSegments(se,new THREE.LineBasicMaterial({color:HB.clone(),transparent:true,opacity:0,toneMapped:false,blending:THREE.AdditiveBlending,depthWrite:false}));
  const bar=new THREE.Mesh(new THREE.BoxGeometry(.95,.03,.14),holo(null,HB.clone(),0));bar.position.set(0,.05,.45);
  const fill=new THREE.Mesh(new THREE.BoxGeometry(.95,.035,.14),holo(null,GNE.clone(),0));fill.position.set(0,.055,.45);
  g.add(face,edge,bar,fill);const tb=tabTex(n),tab=new THREE.Mesh(new THREE.PlaneGeometry(.2*tb.ar,.2),new THREE.MeshBasicMaterial({map:tb.t,transparent:true,opacity:0,depthWrite:false,depthTest:false,toneMapped:false}));tab.renderOrder=20;LS.add(tab);
  ota.slots.push({g,face,edge,bar,fill,tab})});
 const pk=new THREE.Group();ota.g.add(pk);const pg=new THREE.BoxGeometry(.26,.26,.26);
 pk.add(new THREE.Mesh(pg,holo(null,HBD.clone(),0)),new THREE.LineSegments(new THREE.EdgesGeometry(pg),new THREE.LineBasicMaterial({color:HB.clone(),transparent:true,opacity:0,toneMapped:false,blending:THREE.AdditiveBlending,depthWrite:false})));
 const pgl=new THREE.Sprite(new THREE.SpriteMaterial({map:glowT,color:HB.clone(),transparent:true,opacity:0,blending:THREE.AdditiveBlending,depthWrite:false,toneMapped:false}));pgl.scale.set(.7,.7,1);pk.add(pgl);
 ota.pk=pk;ota.pgl=pgl;
 const act=new THREE.Sprite(new THREE.SpriteMaterial({map:glowT,color:GNE.clone(),transparent:true,opacity:0,blending:THREE.AdditiveBlending,depthWrite:false,toneMapped:false}));act.scale.set(1.3,1.3,1);ota.g.add(act);ota.act=act;
 const tb=tabTex('ACTIVE','#7fe0a6','rgba(6,20,12,.9)');ota.actTab=new THREE.Mesh(new THREE.PlaneGeometry(.17*tb.ar,.17),new THREE.MeshBasicMaterial({map:tb.t,transparent:true,opacity:0,depthWrite:false,depthTest:false,toneMapped:false}));ota.actTab.renderOrder=21;LS.add(ota.actTab)}
const otaPath=[new THREE.Vector3(10.5,1.6,3.8),new THREE.Vector3(7.6,.75,3.8),new THREE.Vector3(5.5,.75,3.8),new THREE.Vector3(5.5,1.35,1.2)];
/* secure world: key vault over the secure DRAM carve-out, TrustZone barrier, normal-world probe bounces off */
const tee={g:new THREE.Group()};S.add(tee.g);
{const vg=new THREE.BoxGeometry(1,.9,1);tee.vault=new THREE.Group();tee.vault.position.set(4.2,1.05,-3);tee.g.add(tee.vault);
 tee.vFace=new THREE.Mesh(vg,holo(null,HBD.clone(),0));tee.vEdge=new THREE.LineSegments(new THREE.EdgesGeometry(vg),new THREE.LineBasicMaterial({color:HB.clone(),transparent:true,opacity:0,toneMapped:false,blending:THREE.AdditiveBlending,depthWrite:false}));tee.vault.add(tee.vFace,tee.vEdge);
 tee.keys=[];const kg=new THREE.BoxGeometry(.13,.13,.13);for(let k=0;k<3;k++){const m=new THREE.Mesh(kg,new THREE.MeshBasicMaterial({color:HBD.clone().multiplyScalar(.55),transparent:true,opacity:0,toneMapped:false,depthWrite:false}));const gl=new THREE.Sprite(new THREE.SpriteMaterial({map:glowT,color:HB.clone(),transparent:true,opacity:0,blending:THREE.AdditiveBlending,depthWrite:false,toneMapped:false}));gl.scale.set(.26,.26,1);m.add(gl);tee.vault.add(m);tee.keys.push({m,gl,o:k*2.094})}
 const ng=new THREE.BoxGeometry(1.25,.05,1.05);tee.norm=new THREE.Group();tee.norm.position.set(6.25,.7,-3);tee.g.add(tee.norm);
 tee.nFace=new THREE.Mesh(ng,holo(null,HBD.clone(),0));tee.nEdge=new THREE.LineSegments(new THREE.EdgesGeometry(ng),new THREE.LineBasicMaterial({color:HBD.clone(),transparent:true,opacity:0,toneMapped:false,blending:THREE.AdditiveBlending,depthWrite:false}));tee.norm.add(tee.nFace,tee.nEdge);
 const wallC=cnv(256,256),wg=wallC.getContext('2d');wg.strokeStyle='#fff';wg.lineWidth=2;for(let i=0;i<=16;i++){wg.globalAlpha=i%4?.35:.9;wg.beginPath();wg.moveTo(i*16,0);wg.lineTo(i*16,256);wg.stroke();wg.beginPath();wg.moveTo(0,i*16);wg.lineTo(256,i*16);wg.stroke()}
 tee.wallM=new THREE.MeshBasicMaterial({map:new THREE.CanvasTexture(wallC),color:HBD.clone(),transparent:true,opacity:0,toneMapped:false,blending:THREE.AdditiveBlending,depthWrite:false,side:THREE.DoubleSide});
 tee.wall=new THREE.Mesh(new THREE.PlaneGeometry(1.4,1.3),tee.wallM);tee.wall.rotation.y=Math.PI/2;tee.wall.position.set(5.2,.85,-3);tee.g.add(tee.wall);
 tee.rip=new THREE.Mesh(new THREE.RingGeometry(.85,1,40),new THREE.MeshBasicMaterial({color:HDR(2.2,.3,.2),transparent:true,opacity:0,toneMapped:false,blending:THREE.AdditiveBlending,depthWrite:false,side:THREE.DoubleSide}));tee.rip.rotation.y=Math.PI/2;tee.rip.position.set(5.19,.95,-3);tee.g.add(tee.rip);
 tee.probe=new THREE.Sprite(new THREE.SpriteMaterial({map:glowT,color:HDR(2.4,.5,.3),transparent:true,opacity:0,blending:THREE.AdditiveBlending,depthWrite:false,toneMapped:false}));tee.probe.scale.set(.3,.3,1);tee.g.add(tee.probe);
 const t1=tabTex('SECURE WORLD'),t2=tabTex('NORMAL WORLD','#93a9b8');
 tee.tabS=new THREE.Mesh(new THREE.PlaneGeometry(.2*t1.ar,.2),new THREE.MeshBasicMaterial({map:t1.t,transparent:true,opacity:0,depthWrite:false,depthTest:false,toneMapped:false}));
 tee.tabN=new THREE.Mesh(new THREE.PlaneGeometry(.18*t2.ar,.18),new THREE.MeshBasicMaterial({map:t2.t,transparent:true,opacity:0,depthWrite:false,depthTest:false,toneMapped:false}));
 tee.tabS.renderOrder=tee.tabN.renderOrder=20;tee.tabS.position.set(4.2,1.78,-3);tee.tabN.position.set(6.25,1.08,-3);LS.add(tee.tabS,tee.tabN)}
/* runtime: blinking threat alert + ripple where the malicious frame is stopped */
const alertTb=tabTex('THREAT DETECTED','#ff5a4a','rgba(24,6,6,.92)'),alertTab=new THREE.Mesh(new THREE.PlaneGeometry(.24*alertTb.ar,.24),new THREE.MeshBasicMaterial({map:alertTb.t,transparent:true,opacity:0,depthWrite:false,depthTest:false,toneMapped:false}));
alertTab.renderOrder=22;alertTab.position.set(lampP[0]+.6,.95,lampP[1]);LS.add(alertTab);
const ripple=new THREE.Mesh(new THREE.RingGeometry(.9,1,48),new THREE.MeshBasicMaterial({color:HDR(2.2,.25,.15),transparent:true,opacity:0,toneMapped:false,blending:THREE.AdditiveBlending,depthWrite:false,side:THREE.DoubleSide}));
ripple.rotation.x=-Math.PI/2;ripple.position.set(lampP[0],.05,lampP[1]);S.add(ripple);let lastHit=-9;
function pill(txt,red){const f=2,fs=13*f,padL=26*f,padR=12*f,h=28*f,c=document.createElement('canvas'),g=c.getContext('2d');g.font=`600 ${fs}px "IBM Plex Sans",Arial,sans-serif`;
  const w=Math.ceil(g.measureText(txt).width+padL+padR);c.width=w+4;c.height=h+4;g.font=`600 ${fs}px "IBM Plex Sans",Arial,sans-serif`;
  const col=red?'#ff5a4a':ACC;g.fillStyle='rgba(11,12,14,.88)';g.strokeStyle=col;g.lineWidth=2;g.fillRect(2,2,w,h);g.strokeRect(2,2,w,h);
  g.fillStyle=col;g.fillRect(2+11.5*f,2+h/2-3.5*f,7*f,7*f);g.fillStyle=red?'#ffe1dc':'#f1ede6';g.textBaseline='middle';g.fillText(txt,2+padL,2+h/2+1);
  const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.minFilter=THREE.LinearFilter;t.generateMipmaps=false;return{t,ar:c.width/c.height,ph:c.height/f}}
scenes.forEach((s,si)=>(s.labels||[]).forEach(([id,txt,dx,dy,dz])=>{const red=(s.red&&id!=='se')||['lock','inj','sb4'].includes(id),{t,ar,ph}=pill(txt,red);
  const sp=new THREE.Sprite(new THREE.SpriteMaterial({map:t,transparent:true,opacity:0,depthTest:false,depthWrite:false,sizeAttenuation:false,toneMapped:false}));
  const c=comps[id];sp.position.set(c.x+dx,c.h+.3+dy,c.z+dz);sp.center.set(.5,0);sp.visible=false;sp.renderOrder=10;LS.add(sp);labelEls.push({sp,si,ar,ph})}));
function sizeLabels(){const k=2*Math.tan(THREE.MathUtils.degToRad(cam.fov)/2)/H;labelEls.forEach(L=>L.sp.scale.set(L.ph*k*L.ar,L.ph*k,1))}

setLoad(84,'Kernel verified · dm-verity root hash OK');await tick();
/* post */
const comp=new EffectComposer(R);comp.addPass(new RenderPass(S,cam));
const bokeh=small?null:new BokehPass(S,cam,{focus:6,aperture:.00009,maxblur:.009});if(bokeh)comp.addPass(bokeh);
const bloom=new UnrealBloomPass(new THREE.Vector2(256,256),.85,.55,1.7);comp.addPass(bloom);comp.addPass(new OutputPass());

/* camera rig */
const camP=new THREE.Vector3(...scenes[0].cam),camL=new THREE.Vector3(...scenes[0].cam.slice(3)),tP=new THREE.Vector3(),tL=new THREE.Vector3(),tmp=new THREE.Vector3(),UP=new THREE.Vector3(0,1,0);
let W=0,H=0,narrow=false;
function resize(){W=innerWidth;H=innerHeight;R.setSize(W,H,false);comp.setSize(W,H);bloom.resolution.set(W*.75,H*.75);cam.aspect=W/H;narrow=W<760;cam.fov=narrow?50:34;
 if(narrow)cam.setViewOffset(W,H,0,H*.2,W,H);else cam.setViewOffset(W,H,-W*.14,0,W,H);cam.updateProjectionMatrix();measure();if(typeof sizeLabels==='function'&&labelEls.length)sizeLabels()}
resize();sizeLabels();addEventListener('resize',resize);
const ease=f=>{const x=Math.min(1,Math.max(0,(f-.2)/.65));return x*x*(3-2*x)};
const tmpC=new THREE.Color(),lerp=(a,b,t)=>a+(b-a)*t,clamp=(v,a=0,b=1)=>Math.min(b,Math.max(a,v));
let last=performance.now(),time=0,active=-1,since=0,impact=0;
function frame(now){
  const dt=Math.min(.05,(now-last)/1000);last=now;time+=dt;since+=dt;
  const p=progress(),i=p.i,f=p.f,j=Math.min(N,i+1),e=i>=N?0:ease(f),P=i+e;
  const A=scenes[i].cam,B=scenes[j].cam;
  tP.set(lerp(A[0],B[0],e),lerp(A[1],B[1],e),lerp(A[2],B[2],e));tL.set(lerp(A[3],B[3],e),lerp(A[4],B[4],e),lerp(A[5],B[5],e));
  if(!reduce){const ang=(i===0?Math.sin(time*.12)*.18*(1-e)+(1-e)*-.0:0)+Math.sin(time*.3)*.006;tmp.copy(tP).sub(tL).applyAxisAngle(UP,ang);if(i===0)tmp.multiplyScalar(1-.06*Math.min(1,time/8));tP.copy(tL).add(tmp);tP.y+=Math.sin(time*.45)*.01}
  if(i>=N&&f>0){tP.y+=f*4;tP.z+=f*2}
  if(narrow){tmp.copy(tP).sub(tL).multiplyScalar(1.25);tP.copy(tL).add(tmp)}
  const k=reduce?1:1-Math.exp(-dt*3.2);camP.lerp(tP,k);camL.lerp(tL,k);cam.position.copy(camP);cam.lookAt(camL);
  if(bokeh)bokeh.uniforms.focus.value=cam.position.distanceTo(camL);
  const a=f<.5?i:Math.min(N,i+1);if(a!==active){active=a;since=0}updRail(a);
  const sc=scenes[a],sm=1-Math.exp(-dt*4),pulse=.5+.5*Math.sin(time*4),reds=sc.red||[];
  const wt=k=>clamp(1-Math.abs(P-k)*1.7);
  U.uTime.value=time;U.uPower.value=lerp(U.uPower.value,sc.power??1,1-Math.exp(-dt*(a===1?1.2:3)));U.uFlow.value=lerp(U.uFlow.value,sc.flow??.4,1-Math.exp(-dt*1.5));U.uRed.value=0;
  dots.material.color.setScalar(.15+U.uPower.value*.85);dieMat.color.setScalar((.15+U.uPower.value*.6+wt(2)*1.4)*(1+.15*pulse*wt(2)));
  const hotNow=new Set(sc.hot||[]),done=new Set();for(let s=1;s<a;s++)(scenes[s].hot||[]).forEach(h=>done.add(h));
  for(const id in comps){const c=comps[id];if(!c.frame)continue;let tg=0;
    if(hotNow.has(id)){tg=.6+.4*pulse;c.frame.color.copy(reds.length&&id!=='se'?RD:CY)}else if(done.has(id)){tg=.18;c.frame.color.copy(id==='jtag'?RD:CYD)}
    c.frame.opacity=lerp(c.frame.opacity,tg,sm)}
  comps.lock.mat.opacity=lerp(comps.lock.mat.opacity,a===S_DBG?.65+.35*pulse:(a>S_DBG?.3:0),sm);
  const doneR=new Set();for(let s=1;s<a;s++)(scenes[s].routes||[]).forEach(r=>doneR.add(r));const actR=sc.routes||[];
  for(const id in routes){const r=routes[id],on=actR.includes(id);r.mat.color.copy(on?(reds.includes(id)?RD:CY):CYD);r.mat.opacity=lerp(r.mat.opacity,on?.5:doneR.has(id)?.12:0,sm)}
  leds.d1.material.emissiveIntensity=.5+U.uPower.value*3;
  leds.d2.material.emissiveIntensity=a===S_DBG||a===S_SHIELD||a===S_AGENT?(Math.sin(time*9)>0?2.2:.15):1+2*pulse;leds.d2.material.emissive.setHex(a===S_DBG||a===S_SHIELD||a===S_AGENT?0xff2a1a:0x38d0ff);
  /* pulses */
  let n=0,head=null,hit=0;const per=Math.floor(pool.length/Math.max(1,actR.length));
  actR.forEach((id,ri)=>{const r=routes[id],blk=BLOCK[id]||1,red=reds.includes(id),cnt=Math.min(per,Math.max(3,Math.round(r.L*1.6))),spd=reduce?.15:1.1;
    for(let q=0;q<cnt;q++){const s=pool[n++];const t=((time*spd/r.L)+q/cnt+ri*.13)%1,[x,z]=at(r,t*blk);s.position.set(x,.03,z);s.visible=true;
      const fade=blk<1?Math.min(1,(1-t)*5,t*8):Math.min(1,t*8,(1-t)*8);s.material.opacity=fade;s.material.color.copy(red?(a===S_SHIELD?RDS:RD):CY);const scl=(a===S_SHIELD&&red?.11:.17)+(blk<1&&t>.85&&a!==S_SHIELD?(t-.85)*1.6:0);s.scale.set(scl,scl,1);
      if(blk<1&&t>.88)hit=Math.max(hit,(t-.88)*8);if(!head||t>head.t)head={x,z,t,f:fade,red}}});
  for(;n<pool.length;n++)pool[n].visible=false;
  impact=lerp(impact,a===S_SHIELD?hit:0,.35);
  if(head){headL.position.set(head.x,.35,head.z);headL.color.setHex(head.red?0xff4a3a:0xffa64d);headL.intensity=lerp(headL.intensity,(a===S_SHIELD?.5:2)*head.f,.3)}else headL.intensity=lerp(headL.intensity,0,.2);
  /* holograms */
  const w3=wt(S_SIG),ok=a===S_SIG&&since>2.6;sig.visible=w3>.01;sig.rotation.y+=dt*.35;sigA.opacity=lerp(sigA.opacity,w3*(ok?0:.9),.12);sigB.opacity=lerp(sigB.opacity,w3*(ok?.95:0),.12);
  const w6=wt(S_STACK),stackOn=a===S_STACK,cyc=(since%4.5)/4.5,ez=x=>1-Math.pow(1-x,3);
  layers.forEach((L,k)=>{L.w=lerp(L.w,stackOn&&since>k*.28?1:(w6>.5&&!stackOn?w6:0),1-Math.exp(-dt*(stackOn?3.2:5)));const w=ez(clamp(L.w));L.g.visible=L.w>.01;
    L.g.position.set(0,.35+(.25+k*.85)*w,0);L.g.rotation.y=(1-w)*.9;L.g.scale.setScalar(.55+.45*w);
    L.face.material.opacity=w*.07;L.face.material.color.copy(HBD);L.edge.material.opacity=w*(.55+.2*Math.sin(time*3+k));L.edge.material.color.copy(HB);L.lab.material.opacity=w*.45;L.lab.material.color.copy(HBD).multiplyScalar(.5);L.tab.visible=L.w>.01;L.tab.material.opacity=clamp(w*1.4-.3);L.tab.position.set(1.15,L.g.position.y+.3,1.45);L.tab.quaternion.copy(cam.quaternion);L.tab.scale.setScalar(.7+.3*w)});
  {const w4=ez(clamp(layers[2].w));nnG.visible=layers[2].w>.01;nnG.position.copy(layers[2].g.position);nnG.rotation.y=layers[2].g.rotation.y;nnG.scale.setScalar(.55+.45*w4);
    nnMesh.material.opacity=w4;nnLineM.opacity=w4*.35;nnN.forEach((n,k)=>{const f=.6+.4*Math.sin(time*3+n.o);nnMesh.setColorAt(k,tmpC.copy(HB).multiplyScalar(.55*f))});nnMesh.instanceColor.needsUpdate=true;
    nnSpark.forEach(q=>{const t=(time*.7+q.o)%1;if(t<dt*.7)q.i=Math.floor(Math.random()*(nnL.length/2));q.sp.position.lerpVectors(nnL[q.i*2],nnL[q.i*2+1],t);q.sp.material.opacity=w4*Math.sin(t*Math.PI)})}
  ups.forEach(s=>{const u=s.userData,t=(time*.35+u.o)%1;s.visible=w6>.01;s.position.set(u.x,.4+t*2.4*w6,u.z);s.material.opacity=w6*Math.sin(t*Math.PI)});
  const w9=wt(S_SHIELD);shield.visible=w9>.01;shield.quaternion.copy(cam.quaternion);shield.scale.setScalar(.5*(.7+.3*w9)*(1+.02*Math.sin(time*2)));
  const blink=a===S_SHIELD&&(impact>.15||Math.sin(time*6)>.6)?1:0;lampM.emissiveIntensity=lerp(lampM.emissiveIntensity,blink*2.2,.5);lampG.material.opacity=lerp(lampG.material.opacity,blink*.9*w9,.5);
  shM.opacity=w9*.45;shF.opacity=w9*.06;
  dome.visible=false;dome.rotation.y+=dt*.1;
  const w7=wt(S_SAND);sandFace.opacity=w7*.08;
  sand.forEach((b,k)=>{b.g.visible=w7>.01;b.g.position.y=.3+.32*w7;b.line.material.opacity=w7*(b.bad?.6+.4*pulse:.75);
    const sx=b.bad?Math.sin(time*2.6)*.33:Math.sin(time*1.3+k)*.18,sz=b.bad?Math.cos(time*1.9)*.2:Math.cos(time*1.1+k*2)*.18;b.core.position.set(sx,Math.sin(time*1.7+k)*.15,sz);b.core.material.opacity=w7;
    if(b.bad){const hitW=Math.max(0,Math.abs(Math.sin(time*2.6))-.9)*10;b.line.material.color.copy(RD).multiplyScalar(1+hitW*1.5)}});
  const w9a=wt(S_AGENT);agent.visible=w9a>.01;agent.scale.setScalar(.6+.4*w9a);orb.rotation.y+=dt*.4;orb.rotation.x+=dt*.15;agMat.opacity=w9a*.9;orbCore.material.opacity=w9a*(.4+.2*pulse);
  toolLine.opacity=w9a*.6;gate.rotation.z+=dt*.5;
  const injT=(time*.45)%1,blocked=injT>.82;gateM.color.copy(blocked&&a===S_AGENT?RD:HDR(.4,2.4,1.6));gateM.opacity=w9a*(blocked?1:.75);
  tools.forEach(t=>{const u=(time*.5+t.o)%1;t.pk.position.copy(t.p).multiplyScalar(u);t.pk.material.opacity=w9a*Math.sin(u*Math.PI)});
  inj.position.copy(injFrom).lerp(injFrom.clone().setLength(.74),Math.min(1,injT/.82));inj.material.opacity=w9a*(injT<.82?1:Math.max(0,1-(injT-.82)*6));inj.scale.setScalar(.2+(blocked?(injT-.82)*1.5:0));injLine.material.opacity=w9a*.5;
  /* OTA */
  {const on=a===S_OTA,wO=wt(S_OTA),T=(since%7)/7;ota.g.visible=wO>.01;
   const pT=clamp(T/.2),seg=pT*3,si=Math.min(2,Math.floor(seg)),u=seg-si;ota.pk.position.lerpVectors(otaPath[si],otaPath[si+1],u);
   ota.pk.visible=on&&T<.24;ota.pk.rotation.y+=dt*2;ota.pk.rotation.x+=dt*1.3;ota.pk.children.forEach(m=>{if(m.material)m.material.opacity=wO*(m.isSprite?.9:(m.isLineSegments?1:.15))});
   const prog=clamp((T-.22)/.36),ver=T>.6,sw=T>.72;
   ota.slots.forEach((S2,k)=>{S2.face.material.opacity=wO*.08;const isAct=k===0?!sw:sw;S2.edge.material.opacity=wO*(isAct?.95:.55);S2.edge.material.color.copy(isAct?GNE:HB);
     S2.bar.material.opacity=wO*.25;const f=k===1?prog:1;S2.fill.scale.x=Math.max(.001,f);S2.fill.position.x=-.475+.475*f;S2.fill.material.opacity=wO*(k===1?(ver?.9:.55):.6);S2.fill.material.color.copy(k===1&&!ver?HB:GNE);
     S2.tab.visible=wO>.01;S2.tab.material.opacity=wO;S2.tab.position.set(S2.g.position.x,1.02,S2.g.position.z+.78);S2.tab.quaternion.copy(cam.quaternion)});
   const ax=sw?5.5:4.15;ota.act.position.set(lerp(ota.act.position.x||4.15,ax,.12),1,1.2);ota.act.material.opacity=wO*(.35+.15*pulse);
   ota.actTab.visible=wO>.01;ota.actTab.material.opacity=wO;ota.actTab.position.set(ota.act.position.x,1.6,1.2);ota.actTab.quaternion.copy(cam.quaternion)}
  /* secure world */
  {const wT=wt(S_TEE),on=a===S_TEE,T=(time%3.2)/3.2;tee.g.visible=wT>.01;tee.vault.scale.setScalar(.6+.4*wT);
   tee.vFace.material.opacity=wT*.1;tee.vEdge.material.opacity=wT*(.8+.2*pulse);tee.nFace.material.opacity=wT*.06;tee.nEdge.material.opacity=wT*.5;
   tee.keys.forEach(k=>{const an=time*.9+k.o;k.m.position.set(Math.cos(an)*.25,Math.sin(time*1.3+k.o)*.15,Math.sin(an)*.25);k.m.rotation.set(time,time*.7,0);k.m.material.opacity=wT;k.gl.material.opacity=wT*.18});
   const go=T<.45?T/.45:T<.55?1:Math.max(0,1-(T-.55)/.35),px=lerp(6.25,5.27,go);tee.probe.position.set(px,.95,-3);tee.probe.material.opacity=on?wT*(T<.9?1:0):0;
   const hitW=on&&T>.43&&T<.62?1-Math.abs(T-.5)/.12:0;tee.wallM.opacity=wT*(.28+hitW*.5);tee.wallM.color.copy(hitW>.2?RDS:HBD);
   const rp=clamp((T-.45)/.4);tee.rip.visible=on&&T>.45&&T<.85;tee.rip.scale.setScalar(.05+rp*.55);tee.rip.material.opacity=wT*(1-rp)*.9;
   [tee.tabS,tee.tabN].forEach(t=>{t.visible=wT>.01;t.material.opacity=wT;t.quaternion.copy(cam.quaternion)})}
  /* runtime alert */
  {if(a===S_SHIELD&&hit>.45&&time-lastHit>.9)lastHit=time;const at2=time-lastHit,w9b=wt(S_SHIELD);
   alertTab.visible=w9b>.01&&at2<1.6;alertTab.material.opacity=w9b*(Math.floor(at2*7)%2?.25:1);alertTab.quaternion.copy(cam.quaternion);
   const rp=clamp(at2/1.1);ripple.visible=w9b>.01&&at2<1.1;ripple.scale.setScalar(.05+rp*.55);ripple.material.opacity=w9b*(1-rp)*.9}
  /* dust */
  if(!reduce){const pa=dustG.attributes.position.array;for(let q=0;q<DN;q++){pa[q*3+1]+=dt*.03;pa[q*3]+=Math.sin(time*.2+q)*dt*.02;if(pa[q*3+1]>4)pa[q*3+1]=0}dustG.attributes.position.needsUpdate=true}
  const showL=!(i>=N&&f>.35);
  for(const L of labelEls){const on=showL&&L.si===a,m=L.sp.material;m.opacity=lerp(m.opacity,on?1:0,1-Math.exp(-dt*8));L.sp.visible=m.opacity>.01}
  /* adaptive quality */
  perf.t+=dt;perf.n++;if(perf.t>2){const avg=perf.t/perf.n;perf.t=0;perf.n=0;if(avg>.03&&perf.lvl<4){perf.lvl++;if(perf.lvl===1&&bokeh)bokeh.enabled=false;else{DPR=Math.max(.75,DPR-.3);R.setPixelRatio(DPR);comp.setPixelRatio(DPR);resize()}}}
  if(scrollY<tops[tops.length-1]+innerHeight*1.2){comp.render();R.autoClear=false;R.render(LS,cam);R.autoClear=true}
  requestAnimationFrame(frame);
}
const perf={t:0,n:0,lvl:0};
/* precompile every material (holograms included) so scrolling never stalls on shader compiles */
setLoad(90,'Applying AppArmor profiles · sandboxing services');await tick();
{const hidden=[];S.traverse(o=>{if(!o.visible){hidden.push(o);o.visible=true}});
 try{if(R.compileAsync)await R.compileAsync(S,cam);else R.compile(S,cam);R.compile(LS,cam)}catch(e){}
 R.shadowMap.needsUpdate=true;comp.render();hidden.forEach(o=>o.visible=false)}
setLoad(97,'Arming policy gate for on-device agents');await tick();
last=performance.now();requestAnimationFrame(frame);hideLoad();
}
