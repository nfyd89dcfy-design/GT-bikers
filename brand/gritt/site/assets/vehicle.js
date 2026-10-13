/* Gritt: процедурные 3D-модели (Three.js). Не пред-рендер, не рисунок: геометрия строится в коде. */
(function(){
const T=THREE,V=(x,y,z)=>new T.Vector3(x,y,z);
function mats(){return{
 frame:new T.MeshStandardMaterial({color:0x202328,roughness:.8,metalness:.15}),
 rubber:new T.MeshStandardMaterial({color:0x0e0f11,roughness:.96,metalness:0}),
 metal:new T.MeshStandardMaterial({color:0x8a8f97,roughness:.45,metalness:.45}),
 dark:new T.MeshStandardMaterial({color:0x33373e,roughness:.7,metalness:.3}),
 accent:new T.MeshStandardMaterial({color:0x8433F0,roughness:.5,metalness:.1,emissive:0x8433F0,emissiveIntensity:.18}),
 light:new T.MeshStandardMaterial({color:0xf4f5f2,emissive:0xf4f5f2,emissiveIntensity:.7})
}}
function tube(a,b,r,m,seg=10){const va=V(...a),vb=V(...b),d=vb.clone().sub(va),len=d.length();const me=new T.Mesh(new T.CylinderGeometry(r,r,len,seg),m);me.position.copy(va.clone().add(vb).multiplyScalar(.5));me.quaternion.setFromUnitVectors(V(0,1,0),d.normalize());return me}
function box(w,h,d,m,x=0,y=0,z=0,rz=0){const me=new T.Mesh(new T.BoxGeometry(w,h,d),m);me.position.set(x,y,z);me.rotation.z=rz;return me}
function cylZ(r,len,m,x=0,y=0,z=0,seg=20){const me=new T.Mesh(new T.CylinderGeometry(r,r,len,seg),m);me.rotation.x=Math.PI/2;me.position.set(x,y,z);return me}
function G(name,...kids){const g=new T.Group();g.name=name;kids.forEach(k=>g.add(k));return g}
function knobs(R,tr,wd,m,n=44){const im=new T.InstancedMesh(new T.BoxGeometry(tr*.9,tr*.5,wd*.42),m,n*2),o=new T.Object3D();let i=0;for(let k=0;k<n;k++)for(let s=0;s<2;s++){const a=k/n*Math.PI*2+(s?Math.PI/n:0);o.position.set(Math.cos(a)*(R+tr*.92),Math.sin(a)*(R+tr*.92),(s?1:-1)*wd*.22);o.rotation.set(0,0,a);o.updateMatrix();im.setMatrixAt(i++,o.matrix)}return im}
function bikeWheel(R,tr,wd,M,x,y){const g=new T.Group();g.position.set(x,y,0);
 const tire=new T.Mesh(new T.TorusGeometry(R,tr,14,48),M.rubber);tire.scale.z=wd/(tr*2);g.add(tire);g.add(knobs(R,tr,wd,M.rubber));
 const rim=new T.Mesh(new T.TorusGeometry(R-tr*.6,tr*.28,8,40),M.accent);g.add(rim);
 for(let i=0;i<14;i++){const a=i/14*Math.PI*2;const s=tube([0,0,.012*(i%2?1:-1)],[Math.cos(a)*(R-tr*.6),Math.sin(a)*(R-tr*.6),0],.0035,M.metal,4);g.add(s)}
 g.add(cylZ(.04,.1,M.metal));const rot=cylZ(R*.36,.008,M.metal,0,0,.045,28);g.add(rot);g.userData.spin=true;return g}
function wheel4(R,wd,M,x,y,z){const g=new T.Group();g.position.set(x,y,z);
 const tire=cylZ(R,wd,M.rubber,0,0,0,36);g.add(tire);g.add(knobs(R-.012,.032,wd,M.rubber,28));
 const rim=cylZ(R*.62,wd+.01,M.dark,0,0,0,28);g.add(rim);const ring=new T.Mesh(new T.TorusGeometry(R*.6,.014,8,32),M.accent);ring.position.z=(z>0?1:-1)*(wd/2+.006);g.add(ring);
 g.add(cylZ(R*.18,wd+.03,M.metal,0,0,0,16));g.userData.spin=true;return g}
function lerpV(a,b,t){return a.map((v,i)=>v+(b[i]-v)*t)}

function enduro(M,energy,city){
 const R=city?.31:.36,tr=city?.032:.065,wd=city?.06:.12,L=city?.55:.62;const rear=[-L,R,0],front=[L,R,0];
 const BB=[0,.30,0],STt=city?[-.3,.9,0]:[-.24,.86,0],HTt=city?[.40,.94,0]:[.46,.9,0],HTb=city?[.44,.78,0]:[.52,.72,0];
 const parts=[];
 const fr=G('frame');const sd=[1,-1];
 fr.add(tube(BB,STt,.024,M.frame),tube(HTb,BB,.034,M.frame),tube(HTt,HTb,.034,M.frame,12));
 if(!city)fr.add(tube(STt,HTt,.024,M.frame)); else fr.add(tube(HTb,lerpV(BB,STt,.55),.02,M.frame));
 sd.forEach(s=>{fr.add(tube(STt,[rear[0],rear[1],s*.058],.014,M.frame,8),tube(BB,[rear[0],rear[1],s*.058],.016,M.frame,8))});
 if(!city){fr.add(tube([-.1,.42,0],lerpV(STt,HTt,.35),.02,M.accent),box(.04,.06,.06,M.accent,-.16,.72,0))}
 parts.push(fr);
 const fk=G('fork');sd.forEach(s=>fk.add(tube([HTb[0]-.01,HTb[1]+.04,s*.05],[front[0],front[1],s*.048],.02,M.metal,10)));fk.add(box(.05,.03,.14,M.dark,HTb[0]+.005,HTb[1]+.02,0));
 parts.push(fk);
 const bars=G('bars');const bx=HTt[0]-.03,by=HTt[1]+.11;bars.add(tube([HTt[0],HTt[1]-.02,0],[bx,by,0],.018,M.metal),tube([bx,by,-.34],[bx,by,.34],.013,M.metal,8));
 [-1,1].forEach(s=>{bars.add(cylZ(.021,.1,M.accent,bx,by,s*.36),tube([bx,by,s*.32],[bx+.05,by-.02,s*.28],.007,M.metal,6));});
 if(city){bars.add(tube([bx,by,-.34],[bx-.1,by+.05,-.34],.012,M.metal),tube([bx,by,.34],[bx-.1,by+.05,.34],.012,M.metal))}
 parts.push(bars);
 const seat=G('seat',tube([STt[0],STt[1]-.1,0],[STt[0]-.01,STt[1]+.08,0],.016,M.metal),box(.28,.05,.11,M.dark,STt[0]-.04,STt[1]+.11,0),box(.1,.06,.12,M.dark,STt[0]+.12,STt[1]+.105,0));parts.push(seat);
 const drive=G('drive',cylZ(.035,.2,M.metal,BB[0],BB[1],0),tube([0,.3,.1],[0,.2,.1],.01,M.metal,6),tube([0,.3,-.1],[0,.4,-.1],.01,M.metal,6),box(.1,.015,.07,M.dark,0,.19,.12),box(.1,.015,.07,M.dark,0,.41,-.12),cylZ(.075,.012,M.accent,0,.3,.075,24));parts.push(drive);
 // энергия
 if(energy==='petrol'&&!city){
  parts.push(G('engine',box(.2,.17,.15,M.dark,0,.29,0),cylZ(.05,.22,M.metal,.02,.4,0,12)));
  parts.push(G('tank',new T.Mesh(new T.CapsuleGeometry(.075,.28,6,12),M.accent),).translateX(.12).translateY(.9).rotateZ(Math.PI/2+.1));
  parts.push(G('exhaust',tube([.05,.25,.07],[-.2,.3,.08],.022,M.metal),tube([-.2,.3,.08],[-.55,.5,.09],.03,M.metal),box(.02,.05,.05,M.accent,-.55,.5,.09)));
 }else{
  const a=V(...HTb),b=V(...BB),mid=a.clone().add(b).multiplyScalar(.5);
  const bat=G('battery');const bx2=box(.48,.095,.085,M.dark,0,0,0),st=box(.46,.02,.088,M.accent,0,.02,0);bat.add(bx2,st);bat.position.copy(mid).add(V(.0,.0,0));bat.rotation.z=Math.atan2(a.y-b.y,a.x-b.x)+Math.PI;bat.userData.baseScale=1;
  if(city){bat.position.set(-.36,.8,0);bat.rotation.z=0;bat.children[0].geometry=new T.BoxGeometry(.32,.12,.16);bat.children[1].geometry=new T.BoxGeometry(.3,.02,.162);bat.children[1].position.y=.04;parts.push(G('rack',box(.4,.015,.18,M.dark,-.36,.72,0),tube([-.55,.72,.08],[-.55,.28,.06],.01,M.metal,6),tube([-.55,.72,-.08],[-.55,.28,-.06],.01,M.metal,6)))}
  parts.push(bat);
  parts.push(G('motor',cylZ(.085,.13,M.dark,0,.3,0,24),cylZ(.088,.02,M.accent,0,.3,.075,24)));
 }
 parts.push(G('light',box(.07,.06,.09,M.light,HTt[0]+.06,HTt[1]-.12,0),tube([HTt[0]+.03,HTt[1]-.04,0],[HTt[0]+.06,HTt[1]-.1,0],.01,M.metal,6)));
 const wf=bikeWheel(R,tr,wd,M,...front.slice(0,2)),wr=bikeWheel(R,tr,wd,M,...rear.slice(0,2));wf.name='wheelF';wr.name='wheelR';parts.push(wf,wr);
 if(city){const fen=(x)=>{const m=new T.Mesh(new T.TorusGeometry(R+tr+.018,.012,6,28,Math.PI*.9),M.accent);m.scale.z=3;m.position.set(x,R,0);m.rotation.z=Math.PI*.05;return G('fender'+x,m)};parts.push(fen(L),fen(-L))}
 return parts}

function quad(M,energy){
 const parts=[],X=.58,Z=.46,R=.3,wd=.25;
 const wh=[[X,Z],[X,-Z],[-X,Z],[-X,-Z]].map(([x,z],i)=>{const w=wheel4(R,wd,M,x,R,z);w.name='wheel'+i;return w});
 const body=G('body',box(1.2,.14,.5,M.dark,0,.44,0),box(.55,.18,.46,M.frame,.38,.55,0,-.12),box(.5,.12,.48,M.frame,-.52,.55,0),
  tube([X,R,0],[-X,R,0],.02,M.metal,8),tube([X,R,Z-.04],[X,R,-Z+.04],.02,M.metal,8),tube([-X,R,Z-.04],[-X,R,-Z+.04],.02,M.metal,8));
 [-1,1].forEach(s=>{[X,-X].forEach(x=>body.add(box(.5,.04,.14,M.accent,x,R+.28,s*(Z-.02),0)));body.add(tube([X,R+.02,s*(Z-.08)],[.1,.45,s*.22],.015,M.metal,6),tube([-X,R+.02,s*(Z-.08)],[-.1,.45,s*.22],.015,M.metal,6))});
 body.add(box(.4,.015,.46,M.metal,.45,.67,0,-.12));
 parts.push(body);
 parts.push(G('seat',box(.55,.09,.3,M.dark,-.12,.68,0),box(.2,.12,.28,M.dark,-.45,.72,0)));
 parts.push(G('bars',tube([.3,.6,0],[.27,.98,0],.025,M.metal),tube([.27,.98,-.34],[.27,.98,.34],.014,M.metal,8),cylZ(.024,.13,M.accent,.27,.98,.36),cylZ(.024,.13,M.accent,.27,.98,-.36)));
 parts.push(G('rack',...[[.45,.78],[-.55,.78]].map(([x,y])=>box(.4,.012,.44,M.metal,x,y-.05,0)),tube([.65,.7,.2],[.65,.76,.2],.01,M.metal,4)));
 parts.push(G('light',box(.05,.06,.12,M.light,.66,.58,.15),box(.05,.06,.12,M.light,.66,.58,-.15)));
 if(energy==='petrol'){parts.push(G('tank',new T.Mesh(new T.CapsuleGeometry(.1,.3,6,12),M.accent)).translateX(.22).translateY(.74).rotateZ(Math.PI/2));parts.push(G('exhaust',tube([-.2,.4,.28],[-.7,.45,.3],.035,M.metal),box(.03,.07,.07,M.accent,-.7,.45,.3)));parts.push(G('engine',box(.35,.26,.3,M.dark,-.05,.5,0)))}
 else{parts.push(G('battery',box(.62,.2,.42,M.dark,-.05,.54,0),box(.6,.02,.43,M.accent,-.05,.65,0)));parts.push(G('motor',box(.2,.14,.3,M.dark,-.48,.32,0),cylZ(.07,.5,M.metal,-.48,.32,0)))}
 return parts.concat(wh)}

function buggy(M,energy){
 const parts=[],X=.78,Z=.62,R=.34,wd=.28;
 const wh=[[X,Z],[X,-Z],[-X,Z],[-X,-Z]].map(([x,z],i)=>{const w=wheel4(R,wd,M,x,R,z);w.name='wheel'+i;return w});
 const ch=G('chassis',box(1.55,.07,.84,M.dark,0,.36,0),box(.5,.12,.8,M.frame,.62,.46,0,-.05),tube([X,R,Z],[X,R,-Z],.02,M.metal,8),tube([-X,R,Z],[-X,R,-Z],.02,M.metal,8));
 [-1,1].forEach(s=>{[X,-X].forEach(x=>{ch.add(tube([x*.45,.38,s*.38],[x,R,s*(Z-.1)],.016,M.metal,6),tube([x*.5,.5,s*.3],[x,R+.1,s*(Z-.1)],.022,M.accent,6))})});
 parts.push(ch);
 const cage=G('cage');[-1,1].forEach(s=>{
  cage.add(tube([.32,.36,s*.42],[.2,1.05,s*.38],.024,M.frame),tube([-.3,.36,s*.42],[-.32,1.05,s*.38],.024,M.frame),tube([.2,1.05,s*.38],[-.32,1.05,s*.38],.024,M.frame),tube([.6,.4,s*.4],[.32,.9,s*.4],.022,M.frame),tube([.32,.9,s*.4],[.2,1.05,s*.38],.022,M.frame),tube([-.3,.36,s*.42],[-.7,.4,s*.4],.022,M.frame),tube([-.3,.7,s*.42],[.3,.7,s*.42],.02,M.accent))});
 cage.add(tube([.2,1.05,-.38],[.2,1.05,.38],.024,M.frame),tube([-.32,1.05,-.38],[-.32,1.05,.38],.024,M.frame),tube([.62,.42,-.36],[.62,.42,.36],.03,M.metal),box(.5,.04,.7,M.accent,-.05,1.1,0));parts.push(cage);
 parts.push(G('seat',...[-1,1].map(s=>G('s'+s,box(.3,.07,.32,M.dark,-.08,.5,s*.2),box(.07,.42,.32,M.dark,-.22,.7,s*.2,.12)))));
 const sw=new T.Mesh(new T.TorusGeometry(.12,.015,8,24),M.accent);sw.position.set(.28,.84,.2);sw.rotation.y=Math.PI/2;sw.rotation.z=.4;
 parts.push(G('steer',sw,tube([.4,.6,.2],[.29,.83,.2],.02,M.metal),box(.2,.08,.5,M.frame,.46,.64,0)));
 parts.push(G('light',box(.04,.07,.16,M.light,.88,.5,.28),box(.04,.07,.16,M.light,.88,.5,-.28)));
 if(energy==='petrol'){parts.push(G('engine',box(.5,.36,.6,M.dark,-.62,.58,0),box(.5,.02,.6,M.accent,-.62,.77,0)));parts.push(G('exhaust',tube([-.75,.5,.2],[-1.1,.55,.25],.045,M.metal),box(.03,.09,.09,M.accent,-1.1,.55,.25)))}
 else{parts.push(G('battery',box(.62,.34,.7,M.dark,-.6,.56,0),box(.64,.02,.7,M.accent,-.6,.75,0)));parts.push(G('motor',cylZ(.1,.5,M.metal,-.52,.34,0)))}
 return parts.concat(wh)}

const OFF={wheelF:[2.6,.3,0],wheelR:[-2.8,.5,0],frame:[0,-.2,-2.6],fork:[1.8,.2,1.6],bars:[.4,2.4,0],seat:[-.4,2.6,0],drive:[0,-1.4,1.8],battery:[0,-1.6,-1.4],motor:[0,-1.2,2.4],engine:[0,-1.2,2.2],tank:[.2,2.2,-1],exhaust:[-2.4,-.4,1.6],light:[2.2,1.2,0],rack:[-1.8,1.4,0],body:[0,-.5,-2.4],chassis:[0,-1.2,-2.2],cage:[0,2.8,0],steer:[1.2,2,1],fender:[0,2,0]};
function build(kind,energy){
 const M=mats();energy=energy==='petrol'&&kind!=='city'?'petrol':'electro';
 const parts=kind==='city'?enduro(M,'electro',true):kind==='enduro'?enduro(M,energy,false):kind==='quad'?quad(M,energy):buggy(M,energy);
 const root=new T.Group(),pivot=new T.Group();root.add(pivot);
 const wheels=[];
 parts.forEach((p,i)=>{pivot.add(p);p.userData.home=p.position.clone();const key=Object.keys(OFF).find(k=>p.name.indexOf(k)===0);let o=key?OFF[key]:[Math.sin(i*7.1)*2,1+Math.cos(i*3.3),Math.sin(i*2.2)*2];
  if(/^wheel[0-3]/.test(p.name)){const k=+p.name.slice(5);o=[(k<2?1:-1)*2.4,.5,(k%2?-1:1)*2.4]}
  p.userData.off=V(...o);p.userData.spin0=p.userData.spin;if(p.userData.spin)wheels.push(p)});
 const bat=parts.find(p=>p.name==='battery');
 const api={root,pivot,M,parts,wheels,
  assemble(t){const e=1-Math.pow(1-Math.min(1,Math.max(0,t)),3);parts.forEach((p,i)=>{const k=(1-e);p.position.copy(p.userData.home).addScaledVector(p.userData.off,k);p.rotation.y=(p.userData.spin?0:Math.sin(i*1.7)*.9*k);p.rotation.x=Math.sin(i*2.3)*.5*k;p.visible=t>0.01||false;if(p.userData.spin)p.rotation.z=k*Math.PI*3});},
  setAccent(hex){M.accent.color.set(hex);M.accent.emissive.set(hex)},
  setFrame(hex){M.frame.color.set(hex)},
  setBattery(s){if(bat){bat.scale.x=s}},
  setLight(on){const l=parts.find(p=>p.name==='light');if(l)l.visible=on}};
 return api}
window.GrittVehicle={build};

/* сцена */
function stage(canvas,opt={}){
 const r=new T.WebGLRenderer({canvas,antialias:true,alpha:true,preserveDrawingBuffer:opt.keep||false});r.setClearColor(0,0);
 const sc=new T.Scene(),cam=new T.PerspectiveCamera(opt.fov||32,1,.05,60);
 sc.add(new T.HemisphereLight(0xffffff,0x59606b,1.55));
 const k=new T.DirectionalLight(0xfff4e6,2.6);k.position.set(3,5,2.5);sc.add(k);
 const rim=new T.PointLight(0x8433F0,opt.rim??22,0,2);rim.position.set(-2.2,1.4,-2);sc.add(rim);
 const f=new T.DirectionalLight(0xbfd0ff,.9);f.position.set(-3,2,3);sc.add(f);
 // тень
 const c=document.createElement('canvas');c.width=c.height=128;const x=c.getContext('2d'),gr=x.createRadialGradient(64,64,6,64,64,62);gr.addColorStop(0,'rgba(0,0,0,.55)');gr.addColorStop(1,'rgba(0,0,0,0)');x.fillStyle=gr;x.fillRect(0,0,128,128);
 const sh=new T.Mesh(new T.PlaneGeometry(3.4,1.5),new T.MeshBasicMaterial({map:new T.CanvasTexture(c),transparent:true,depthWrite:false}));sh.rotation.x=-Math.PI/2;sh.position.y=.002;sc.add(sh);
 const o={r,sc,cam,sh,th:opt.th??.9,ph:opt.ph??1.32,rad:opt.rad??4.4,tgt:V(0,.5,0),auto:opt.auto??0,visible:true,veh:null,tick:null};
 o.size=()=>{const w=canvas.clientWidth||300,h=canvas.clientHeight||200;r.setPixelRatio(Math.min(opt.dpr||1.5,devicePixelRatio||1));r.setSize(w,h,false);cam.aspect=w/h;cam.updateProjectionMatrix()};
 o.place=()=>{cam.position.set(o.tgt.x+o.rad*Math.sin(o.ph)*Math.cos(o.th),o.tgt.y+o.rad*Math.cos(o.ph),o.tgt.z+o.rad*Math.sin(o.ph)*Math.sin(o.th));cam.lookAt(o.tgt)};
 o.set=(kind,energy)=>{if(o.veh)sc.remove(o.veh.root);o.veh=GrittVehicle.build(kind,energy);const wide=kind==='buggy'||kind==='quad';o.veh.root.scale.setScalar(wide?.85:1);sh.scale.set(wide?1.15:1,wide?1.2:1,1);sc.add(o.veh.root);return o.veh};
 o.drag=(el)=>{let d=null;el.addEventListener('pointerdown',e=>{d={x:e.clientX,y:e.clientY};o.auto0=o.auto;o.auto=0;try{el.setPointerCapture(e.pointerId)}catch(_){}});
  el.addEventListener('pointermove',e=>{if(!d)return;o.th-=(e.clientX-d.x)*.008;o.ph=Math.min(1.75,Math.max(.35,o.ph-(e.clientY-d.y)*.006));d={x:e.clientX,y:e.clientY}});
  const up=()=>{d=null;if(o.keepAuto)o.auto=o.auto0};el.addEventListener('pointerup',up);el.addEventListener('pointercancel',up);
  el.addEventListener('wheel',e=>{if(!o.zoom)return;e.preventDefault();o.rad=Math.min(8,Math.max(2.2,o.rad+e.deltaY*.003))},{passive:false})};
 let last=performance.now();
 o.loop=(now)=>{requestAnimationFrame(o.loop);const dt=Math.min(.05,(now-last)/1000);last=now;if(!o.visible)return;if(o.auto)o.th+=o.auto*dt;if(o.tick)o.tick(dt);o.place();r.render(sc,cam)};
 new ResizeObserver(o.size).observe(canvas);o.size();
 if('IntersectionObserver' in window)new IntersectionObserver(es=>{o.visible=es[0].isIntersecting}).observe(canvas);
 o.go=()=>requestAnimationFrame(o.loop);return o}
window.GrittStage=stage;
})();
