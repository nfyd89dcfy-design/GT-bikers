(function(){
'use strict';
const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)];
const RM=matchMedia('(prefers-reduced-motion: reduce)').matches;
const COARSE=matchMedia('(hover:none),(pointer:coarse)').matches;
const S={kind:'enduro',energy:'electro',voice:'t',tier:1,cart:[],view:'list'};
const store={get(k,d){try{const v=localStorage.getItem(k);return v==null?d:JSON.parse(v)}catch(e){return d}},set(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}}};
S.voice=store.get('gritt-voice','t');S.cart=store.get('gritt-cart',[]);
const V=(o)=>typeof o==='object'?o[S.voice]:o;
const el=(h)=>{const t=document.createElement('template');t.innerHTML=h.trim();return t.content.firstChild};
let toastT;function toast(m){const t=$('#toast');t.textContent=m;t.classList.add('on');clearTimeout(toastT);toastT=setTimeout(()=>t.classList.remove('on'),2200)}
const sp=()=>specs(S.kind,S.energy);
const P=n=>fmt(n);
if(window.gsap&&window.ScrollTrigger)gsap.registerPlugin(ScrollTrigger);
const G=window.gsap;

/* ---------- ГОЛОС ты / вы ---------- */
let heroSplit=null;
function applyVoice(){
 $$('[data-t]').forEach(e=>{if(e.id==='hero-h'&&heroSplit){heroSplit.revert();heroSplit=null}e.textContent=e.dataset[S.voice]});
 $$('.voice button').forEach(b=>b.setAttribute('aria-pressed',b.dataset.voice===S.voice));
 document.documentElement.dataset.voice=S.voice;
 renderLine();renderQuiz();renderConfigOpts();renderTier();
}
$$('.voice button').forEach(b=>b.onclick=()=>{S.voice=b.dataset.voice;store.set('gritt-voice',S.voice);applyVoice()});

/* ---------- ВХОД ---------- */
const gate=$('#gate');
function openGate(){gate.hidden=false;document.body.style.overflow='hidden';gate.style.opacity=1;$('.tile',gate).focus()}
function closeGate(){if(RM||!G){gate.hidden=true;document.body.style.overflow='';return afterGate()}
 G.to(gate,{opacity:0,duration:.45,onComplete:()=>{gate.hidden=true;document.body.style.overflow='';afterGate()}})}
function afterGate(){window.scrollTo(0,0);if(G&&!RM&&!heroSplit&&window.SplitText){try{heroSplit=SplitText.create('#hero-h',{type:'words'});G.from(heroSplit.words,{yPercent:60,opacity:0,stagger:.06,duration:.7,ease:'power3.out'})}catch(e){}}}
$$('.tile',gate).forEach(t=>t.onclick=()=>{setKind(t.dataset.kind);closeGate()});
$$('[data-energy]',gate).forEach(b=>b.onclick=()=>{S.energy=b.dataset.energy;$$('[data-energy]',gate).forEach(x=>x.setAttribute('aria-pressed',x===b))});
$('#gate-skip').onclick=()=>closeGate();
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!gate.hidden)closeGate()});

/* общий переключатель направления */
function kindSeg(box,cb){box.innerHTML='';Object.entries(KINDS).forEach(([k,v])=>{const b=el(`<button class="chip" aria-pressed="${S.kind===k}">${v.name}</button>`);b.onclick=()=>{setKind(k);cb&&cb()};box.append(b)});
 [['electro','Электро'],['petrol','Бенз']].forEach(([e,n])=>{const dis=S.kind==='city'&&e==='petrol';const b=el(`<button class="chip" aria-pressed="${(S.kind==='city'?'electro':S.energy)===e}" ${dis?'disabled style="opacity:.4"':''}>${n}</button>`);b.onclick=()=>{S.energy=e;setKind(S.kind);cb&&cb()};box.append(b)})}
function setKind(k){S.kind=k;if(k==='city')S.energy='electro';$('#hero-dir').textContent=`${KINDS[k].name} · ${S.kind==='city'?'электро':S.energy==='petrol'?'бензин':'электро'} · ${KINDS[k].fam}`;
 hero.set();viewerSet();cfgSet();renderLine();renderCompare();renderTier();fillDriveModels();renderQuizKeep()}

/* ---------- ШЕЙДЕР ---------- */
function shaderBG(canvas,dark){
 const gl=canvas.getContext('webgl2',{antialias:false,alpha:false});if(!gl){canvas.style.display='none';return null}
 const vs=`#version 300 es\nin vec2 p;void main(){gl_Position=vec4(p,0.,1.);}`;
 const fs=`#version 300 es\nprecision highp float;uniform vec2 uR;uniform float uT;uniform vec2 uM;uniform float uD;out vec4 o;
float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float n(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(h(i),h(i+vec2(1,0)),f.x),mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x),f.y);}
float fbm(vec2 p){float v=0.,a=.5;for(int i=0;i<5;i++){v+=a*n(p);p=p*2.03+vec2(11.3,7.1);a*=.5;}return v;}
void main(){vec2 uv=gl_FragCoord.xy/uR;vec2 p=(gl_FragCoord.xy-.5*uR)/uR.y;vec2 m=(uM-.5)*vec2(uR.x/uR.y,1.);
 vec2 q=p*1.5+vec2(uT*.015,uT*.01);float w=fbm(q+fbm(q*1.4-uT*.02));
 float fld=w*11.;float fw=fwidth(fld);float ln=1.-smoothstep(0.,fw*1.6+.02,abs(fract(fld)-.5)*0.0+abs(fract(fld+.5)-.5));
 vec3 silt=vec3(.906,.91,.894),fog=vec3(.957,.961,.949),tar=vec3(.082,.09,.102),vio=vec3(.518,.2,.941),lift=vec3(.745,.576,1.),spk=vec3(1.,.357,.122);
 vec3 base=mix(silt,fog,n(p*3.));vec3 lc=tar;float la=.14;
 if(uD>.5){base=mix(vec3(.11,.12,.135),tar,uv.y);lc=fog;la=.07;}
 vec3 c=base;c=mix(c,lc,ln*la*(.6+.8*w));
 float g=exp(-pow(length(p-m)*1.7,2.));
 float cloud=smoothstep(.55,1.15,w*1.2+(uv.x*.7-uv.y*.5)+g*.6-.45);
 float th=h(floor(gl_FragCoord.xy/2.));
 vec3 vc=uD>.5?lift:vio;
 if(cloud>th)c=vc;
 if(cloud>th&&h(floor(gl_FragCoord.xy/2.)+7.)>.988)c=spk;
 c=mix(c,vc,g*.10);
 c+=(h(gl_FragCoord.xy+uT)-.5)*.035;
 o=vec4(c,1.);}`;
 const sh=(t,s)=>{const x=gl.createShader(t);gl.shaderSource(x,s);gl.compileShader(x);if(!gl.getShaderParameter(x,gl.COMPILE_STATUS)){console.warn(gl.getShaderInfoLog(x));return null}return x};
 const pr=gl.createProgram();const a=sh(gl.VERTEX_SHADER,vs),b=sh(gl.FRAGMENT_SHADER,fs);if(!a||!b){canvas.style.display='none';return null}
 gl.attachShader(pr,a);gl.attachShader(pr,b);gl.linkProgram(pr);gl.useProgram(pr);
 const buf=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buf);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,3,-1,-1,3]),gl.STATIC_DRAW);const loc=gl.getAttribLocation(pr,'p');gl.enableVertexAttribArray(loc);gl.vertexAttribPointer(loc,2,gl.FLOAT,false,0,0);
 const U=n=>gl.getUniformLocation(pr,n);const uR=U('uR'),uT=U('uT'),uM=U('uM'),uD=U('uD');
 const o={vis:true,mx:.5,my:.5,tx:.5,ty:.5};
 const size=()=>{const k=Math.min(.7,devicePixelRatio||1);canvas.width=Math.max(2,canvas.clientWidth*k|0);canvas.height=Math.max(2,canvas.clientHeight*k|0);gl.viewport(0,0,canvas.width,canvas.height)};
 new ResizeObserver(size).observe(canvas);size();
 if('IntersectionObserver' in window)new IntersectionObserver(es=>o.vis=es[0].isIntersecting).observe(canvas);
 addEventListener('pointermove',e=>{const r=canvas.getBoundingClientRect();o.tx=(e.clientX-r.left)/r.width;o.ty=1-(e.clientY-r.top)/r.height});
 const t0=performance.now();
 function f(now){requestAnimationFrame(f);if(!o.vis)return;o.mx+=(o.tx-o.mx)*.06;o.my+=(o.ty-o.my)*.06;gl.uniform2f(uR,canvas.width,canvas.height);gl.uniform1f(uT,(now-t0)/1000);gl.uniform2f(uM,o.mx,o.my);gl.uniform1f(uD,dark?1:0);gl.drawArrays(gl.TRIANGLES,0,3)}
 if(RM){canvas.style.display='none'}else requestAnimationFrame(f);
 return o}
shaderBG($('#hero-bg'),false);
{const c=document.createElement('canvas');c.setAttribute('aria-hidden','true');c.style.cssText='position:absolute;inset:0;width:100%;height:100%;opacity:.22';const s=$('#config');s.prepend(c);s.style.overflow='hidden';$('.wrap',s).style.position='relative';shaderBG(c,true)}

/* ---------- HERO 3D + СБОРКА ---------- */
const hero={prog:0,cur:0,st:null,set(){const v=this.st.set(S.kind,S.energy);this.v=v;if(RM)v.assemble(1)}};
{const st=GrittStage($('#hero-veh'),{fov:30,rad:4.4,th:.8,ph:1.36,rim:30,dpr:1.5});hero.st=st;hero.mx=0;
 addEventListener('pointermove',e=>{hero.mx=e.clientX/innerWidth-.5});
 st.tick=dt=>{if(!hero.v)return;hero.cur+=(hero.prog-hero.cur)*Math.min(1,dt*6);const p=RM?1:hero.cur;const t=Math.min(1,p/.62);hero.v.assemble(t);
  const cv2=$('#hero-veh'),w=cv2.clientWidth,h=cv2.clientHeight,asp=w/h,wide=S.kind==='buggy'||S.kind==='quad';st.th=1.35-p*.8+hero.mx*.25;st.rad=(5.6-p*1.9)*Math.max(1,(asp>1.1?1.55:1.1)/asp)*(wide?1.12:1);st.tgt.set(0,.5+(1-p)*.2,0);if(asp>1.1)st.cam.setViewOffset(w,h,-w*.17,0,w,h);else st.cam.setViewOffset(w,h,0,h*.2,w,h);
  hero.v.wheels.forEach(w=>w.rotation.z=w.userData.spin0&&t>=1?-performance.now()*.0004:w.rotation.z);
  hero.big.style.transform=`translateY(-58%) translateX(${(.5-p)*6}vw)`;
  $('#build-p').style.setProperty('--p',(t*100)+'%');$('#build-n').textContent=Math.round(t*100)+'%'};
 hero.big=$('.hero-big');st.go();
 if(G&&window.ScrollTrigger&&!RM)ScrollTrigger.create({trigger:'#hero',start:'top top',end:'bottom bottom',scrub:false,onUpdate:s=>hero.prog=s.progress});}

/* ---------- ЛИНЕЙКА ---------- */
function renderLine(){
 $('#line-h').textContent=`${KINDS[S.kind].fam}: lite / pro / ultra`;
 $('#line-p').textContent=V(KINDS[S.kind].desc);
 kindSeg($('#kind-seg'));
 const box=$('#cards');box.innerHTML='';
 sp().forEach((s,i)=>{const id=`${S.kind}-${s.tier}-${s.energy}`;const c=el(`<article class="card ${s.tier}" data-cursor="Open">
 <span class="tier">${s.tier}</span><div class="ph ${KINDS[S.kind].ph}" data-cap="${KINDS[S.kind].cap} · кадр ${i+1}"></div>
 <div class="body"><div><h3>${s.name}</h3><p style="margin-top:8px">${V(TIER_TXT[s.tier])}</p></div>
 <ul class="specs"><li><b>${s.a}</b><span>${s.ak}</span></li><li><b>${s.r} км</b><span>запас хода*</span></li><li><b>${s.t}</b><span>${s.energy==='petrol'?'мощность':'момент'}</span></li><li><b>${s.w} кг</b><span>вес</span></li></ul>
 <div class="price">от ${P(s.p)}<small>примерная цена, макет</small></div>
 <div class="row"><button class="btn sm vio" data-add>В корзину</button><button class="btn sm line" data-3d>3D</button><button class="btn sm line" data-cmp>Сравнить</button></div></div></article>`);
 c.querySelector('[data-add]').onclick=()=>addCart({id,name:s.name+(s.energy==='petrol'?' (бенз)':''),sub:`${s.a} · ${s.r} км`,price:s.p,ph:KINDS[S.kind].ph});
 c.querySelector('[data-3d]').onclick=()=>{S.tier=i;renderTier();location.hash='#viewer'};
 c.querySelector('[data-cmp]').onclick=()=>{location.hash='#compare'};
 box.append(c)});
 if(G&&!RM&&window.ScrollTrigger)G.from('#cards .card',{y:50,opacity:0,stagger:.1,duration:.6,ease:'power3.out',scrollTrigger:{trigger:'#cards',start:'top 85%',once:true}});
 const acc=$('#acc');if(!acc.children.length)ACC.forEach(a=>{const i=el(`<div class="acc-i"><div class="ph ${a.ph}" data-cap="${a.n}"></div><b>${a.n}</b><div class="row"><span class="mono">${P(a.p)}</span><button class="btn sm" aria-label="Добавить ${a.n}">+</button></div></div>`);i.querySelector('button').onclick=()=>addCart({id:a.id,name:a.n,sub:'аксессуар',price:a.p,ph:a.ph});acc.append(i)});
}

/* ---------- 3D-ВЬЮЕР ---------- */
const vw={st:null,spin:true};
function viewerSet(){if(!vw.st)return;vw.v=vw.st.set(S.kind,S.energy);vw.v.assemble(1);applyTier()}
function applyTier(){if(!vw.v)return;vw.v.setBattery([.85,1,1.2][S.tier])}
function renderTier(){const b=$('#v-tier');b.innerHTML='';sp().forEach((s,i)=>{const c=el(`<button class="chip" aria-pressed="${S.tier===i}">${s.name}</button>`);c.onclick=()=>{S.tier=i;renderTier()};b.append(c)});
 const s=sp()[S.tier];$('#v-desc').textContent=`${s.name}: ${s.ak.toLowerCase()} ${s.a}, запас хода до ${s.r} км, ${s.t}, ${s.w} кг. Цифры примерные.`;applyTier()}
{const st=GrittStage($('#v-canvas'),{fov:30,rad:3.5,auto:.35,rim:26});vw.st=st;st.keepAuto=true;st.zoom=true;st.drag($('#v-stage'));st.go();
 $$('#v-view [data-view]').forEach(b=>b.onclick=()=>{$$('#v-view [data-view]').forEach(x=>x.setAttribute('aria-pressed',x===b));const m={side:[.0,1.4],front:[Math.PI/2,1.4],top:[.3,.35]}[b.dataset.view];st.auto=0;$('#v-spin').setAttribute('aria-pressed','false');
  const th=m[0]+Math.round((st.th-m[0])/(Math.PI*2))*Math.PI*2;if(G&&!RM)G.to(st,{th:th,ph:m[1],duration:.8,ease:'power3.inOut'});else{st.th=th;st.ph=m[1]}});
 $('#v-spin').onclick=e=>{const on=e.currentTarget.getAttribute('aria-pressed')!=='true';e.currentTarget.setAttribute('aria-pressed',on);st.auto=on&&!RM?.35:0};
 if(RM)st.auto=0;}
$('#ar-btn').onclick=()=>{const d=$('#ar-dlg');d.showModal?d.showModal():d.setAttribute('open','')};

/* ---------- СРАВНЕНИЕ ---------- */
let cmpDiff=false;
function renderCompare(){kindSeg($('#cmp-kind'),()=>{});const L=sp();const maxR=Math.max(...L.map(s=>s.r));
 const rows=[['energy',L[0].ak,s=>s.a],['rng','Запас хода*',s=>`${s.r} км<div class="bar"><i style="width:${s.r/maxR*100}%"></i></div>`,s=>s.r],['t',L[0].energy==='petrol'?'Мощность':'Момент',s=>s.t],['w','Вес',s=>s.w+' кг',s=>s.w],
  ['slots','Слоты кастома',(s,i)=>[2,5,8][i]+' шт',(s,i)=>i],['ctrl','Контроллер',(s,i)=>['Base','Display + App','Pro tune'][i],(s,i)=>i],['price','Цена (пример)',s=>P(s.p),s=>s.p],
  ['wr','Гарантия (пример)',()=>'2 года',()=>0],['tst','Тест-драйв',()=>'по записи',()=>0]];
 const t=$('#cmp');t.innerHTML=`<thead><tr><th scope="col"></th>${L.map(s=>`<th scope="col">${s.name}</th>`).join('')}</tr></thead><tbody>${rows.map(r=>{const vals=L.map((s,i)=>(r[3]||r[2])(s,i));const diff=new Set(vals).size>1;return `<tr class="${diff?'d':'e'}"><th scope="row">${r[1]}</th>${L.map((s,i)=>`<td class="${cmpDiff&&diff?'diff':''}" ${cmpDiff&&!diff?'style="opacity:.45"':''}>${r[2](s,i)}</td>`).join('')}</tr>`}).join('')}<tr><th scope="row"></th>${L.map((s,i)=>`<td><button class="btn sm vio" data-i="${i}">В корзину</button></td>`).join('')}</tr></tbody>`;
 $$('button[data-i]',t).forEach(b=>b.onclick=()=>{const s=L[+b.dataset.i];addCart({id:`${S.kind}-${s.tier}-${s.energy}`,name:s.name,sub:`${s.a} · ${s.r} км`,price:s.p,ph:KINDS[S.kind].ph})})}
$('#cmp-diff').onclick=e=>{cmpDiff=!cmpDiff;e.currentTarget.setAttribute('aria-pressed',cmpDiff);renderCompare()};

/* ---------- КОНФИГУРАТОР ---------- */
const cf={tier:1,color:'violet',frame:'tar',ctrl:'base',bat:'m',ex:new Set(['grip']),st:null};
function cfgCalc(){const s=sp()[cf.tier],b=CFG.bat.find(x=>x.id===cf.bat);let price=s.p+CFG.frames.find(x=>x.id===cf.frame).p+CFG.ctrl.find(x=>x.id===cf.ctrl).p;
 const big=S.kind==='buggy'||S.kind==='quad';price+=big?b.p*5:b.p;CFG.extras.forEach(e=>{if(cf.ex.has(e.id))price+=e.p});
 const range=Math.round(s.r*b.m);const m=/([\d,]+)\s*(Wh|kWh)/.exec(s.a);const bat=m?(parseFloat(m[1].replace(',','.'))*b.m).toFixed(m[2]==='kWh'?1:0).replace('.',',')+' '+m[2]:s.a;
 const w=s.w+(b.id==='l'?(big?15:2):b.id==='s'?(big?-15:-2):0);return{price,range,bat,w,s,b}}
function cfgApply(){if(!cf.st||!cf.v)return;const r=cfgCalc();cf.v.setAccent(CFG.colors.find(c=>c.id===cf.color).c);cf.v.setFrame(CFG.frames.find(f=>f.id===cf.frame).c);cf.v.setBattery(r.b.sc);cf.v.setLight(cf.ex.has('light'));
 $('#c-range').textContent=r.range+' км';$('#c-bat').textContent=S.energy==='petrol'&&S.kind!=='city'?r.s.a+' · бак '+r.b.n:r.bat;$('#c-w').textContent=r.w+' кг';const tp=$('#c-price');if(tp)tp.textContent=P(r.price)}
function cfgSet(){if(!cf.st)return;cf.v=cf.st.set(S.kind,S.energy);cf.v.assemble(1);cfgApply();renderConfigOpts()}
function renderConfigOpts(){const box=$('#c-opts');if(!box)return;const r=cfgCalc();const sw=(arr,key)=>arr.map(c=>`<button style="--c:${c.c}" aria-pressed="${cf[key]===c.id}" data-k="${key}" data-v="${c.id}" aria-label="${c.n}"></button>`).join('');
 const rows=(arr,key,fn)=>arr.map(o=>`<button class="opt-r" aria-pressed="${cf[key]===o.id}" data-k="${key}" data-v="${o.id}"><span><b>${o.n}</b>${o.d?`<small>${o.d}</small>`:''}</span><em>${fn(o)}</em></button>`).join('');
 const pr=p=>p===0?'в базе':(p>0?'+ ':'- ')+P(Math.abs(p));
 box.innerHTML=`<div class="opt"><h3>Версия</h3><div class="seg">${sp().map((s,i)=>`<button class="chip" aria-pressed="${cf.tier===i}" data-k="tier" data-v="${i}">${s.tier}</button>`).join('')}</div></div>
 <div class="opt"><h3>${S.voice==='t'?'Цвет деталей':'Цвет акцентных деталей'}<span>${CFG.colors.find(c=>c.id===cf.color).n}</span></h3><div class="sw">${sw(CFG.colors,'color')}</div></div>
 <div class="opt"><h3>Рама</h3><div class="opts">${rows(CFG.frames,'frame',o=>pr(o.p))}</div></div>
 <div class="opt"><h3>Контроллер</h3><div class="opts">${rows(CFG.ctrl,'ctrl',o=>pr(o.p))}</div></div>
 <div class="opt"><h3>${S.energy==='petrol'&&S.kind!=='city'?'Бак':'Батарея'}</h3><div class="opts">${CFG.bat.map(o=>`<button class="opt-r" aria-pressed="${cf.bat===o.id}" data-k="bat" data-v="${o.id}"><span><b>${o.n}</b><small>запас хода x${o.m}</small></span><em>${pr(o.p*(S.kind==='buggy'||S.kind==='quad'?5:1))}</em></button>`).join('')}</div></div>
 <div class="opt"><h3>Допы</h3><div class="opts">${CFG.extras.map(o=>`<button class="opt-r" aria-pressed="${cf.ex.has(o.id)}" data-k="ex" data-v="${o.id}"><span><b>${o.n}</b></span><em>+ ${P(o.p)}</em></button>`).join('')}</div></div>
 <div class="total"><div><span class="mono">Итого (пример)</span><br><b id="c-price">${P(r.price)}</b></div><button class="btn" id="c-add">В корзину</button></div>`;
 $$('[data-k]',box).forEach(b=>b.onclick=()=>{const k=b.dataset.k,v=b.dataset.v;if(k==='ex'){cf.ex.has(v)?cf.ex.delete(v):cf.ex.add(v)}else cf[k]=k==='tier'?+v:v;renderConfigOpts();cfgApply()});
 $('#c-add').onclick=()=>{const r=cfgCalc();addCart({id:'cfg-'+[S.kind,S.energy,cf.tier,cf.color,cf.frame,cf.ctrl,cf.bat,[...cf.ex].sort().join('')].join('-'),name:r.s.name+' custom',sub:`${CFG.colors.find(c=>c.id===cf.color).n} · ${CFG.ctrl.find(c=>c.id===cf.ctrl).n} · ${r.bat}`,price:r.price,ph:'dusk'})}}
{const st=GrittStage($('#c-canvas'),{fov:30,rad:3.6,auto:.3,rim:26});cf.st=st;st.keepAuto=true;st.drag($('#c-stage'));st.go();if(RM)st.auto=0}

/* ---------- КВИЗ ---------- */
const QZ=[
 {q:{t:'Где будешь ездить чаще всего?',v:'Где техника будет использоваться чаще всего?'},o:[{t:'Город и дворы',k:{city:3}},{t:'Лес и трассы',k:{enduro:3}},{t:'Песок и бездорожье вдвоем',k:{buggy:3}},{t:'Поле, грязь, хозяйство',k:{quad:3}}]},
 {q:{t:'Кто за рулем?',v:'Кто будет водителем?'},o:[{t:{t:'Я, школьник или студент',v:'Подросток'},k:{enduro:1,city:1}},{t:{t:'Я, взрослый',v:'Я, взрослый'},k:{enduro:1,quad:1}},{t:{t:'Вся семья по очереди',v:'Вся семья по очереди'},k:{buggy:1,city:1,quad:1}},{t:{t:'Для работы на участке',v:'Для работы на участке'},k:{quad:2,buggy:1}}]},
 {q:{t:'Сколько ехать за раз?',v:'Какой нужен запас хода?'},o:[{t:'До 30 км',tr:0},{t:'30-80 км',tr:1},{t:'Больше 80 км',tr:2}]},
 {q:{t:'Что важнее всего?',v:'Что для вас важнее всего?'},o:[{t:{t:'Скорость и драйв',v:'Динамика'},k:{enduro:1},tr:1},{t:{t:'Чтобы просто работало',v:'Надежность и простота'},k:{city:1,quad:1},tr:0},{t:{t:'Кастом и свой стиль',v:'Возможность настройки'},k:{enduro:1,buggy:1},tr:2}]}
];
const qz={i:0,k:{enduro:0,city:0,buggy:0,quad:0},tr:[]};
function renderQuizKeep(){if(qz.i>=QZ.length)renderQuiz()}
function renderQuiz(){const b=$('#quiz-box');if(!b)return;
 if(qz.i<QZ.length){const q=QZ[qz.i];b.innerHTML=`<div class="q-prog">${QZ.map((_,i)=>`<i class="${i<=qz.i?'on':''}"></i>`).join('')}</div><div class="mono">Вопрос ${qz.i+1} из ${QZ.length}</div><h3 style="margin-top:10px;font-size:clamp(26px,3.4vw,48px)">${V(q.q)}</h3><div class="q-opts">${q.o.map((o,i)=>`<button class="q-opt" data-i="${i}">${V(o.t)}</button>`).join('')}</div>`;
  $$('.q-opt',b).forEach(x=>x.onclick=()=>{const o=q.o[+x.dataset.i];if(o.k)for(const k in o.k)qz.k[k]+=o.k[k];if(o.tr!=null)qz.tr.push(o.tr);qz.i++;renderQuiz()})}
 else{const kind=Object.entries(qz.k).sort((a,b)=>b[1]-a[1])[0][0];const tr=Math.min(2,Math.round(qz.tr.reduce((a,c)=>a+c,0)/Math.max(1,qz.tr.length)));const L=specs(kind,kind==='city'?'electro':S.energy);const s=L[tr];
  b.innerHTML=`<div class="q-res"><div class="ph ${KINDS[kind].ph}" data-cap="${KINDS[kind].cap}" style="aspect-ratio:4/3"></div><div><div class="mono">${S.voice==='t'?'Твой вариант':'Ваш вариант'}</div><h3 style="font-size:clamp(34px,4.6vw,68px);margin:8px 0 12px">${s.name}</h3><p>${V(KINDS[kind].desc)}</p><ul class="specs" style="margin:18px 0"><li><b>${s.a}</b><span>${s.ak}</span></li><li><b>${s.r} км</b><span>запас хода*</span></li></ul><div class="price">от ${P(s.p)}<small>примерная цена</small></div><div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:18px"><button class="btn vio" id="q-add">В корзину</button><button class="btn line" id="q-open">Открыть линейку</button><button class="btn line" id="q-again">Заново</button></div></div></div>`;
  $('#q-add').onclick=()=>addCart({id:`${kind}-${s.tier}-${s.energy}`,name:s.name,sub:`${s.a} · ${s.r} км`,price:s.p,ph:KINDS[kind].ph});
  $('#q-open').onclick=()=>{S.tier=tr;setKind(kind);location.hash='#line'};
  $('#q-again').onclick=()=>{qz.i=0;qz.k={enduro:0,city:0,buggy:0,quad:0};qz.tr=[];renderQuiz()}}}

/* ---------- ТУР ---------- */
function initTour(){
 const T=THREE,cv=$('#t-canvas');const st=GrittStage(cv,{fov:62,dpr:1.25});const sc=st.sc;sc.background=new T.Color(0x1d2024);sc.fog=new T.Fog(0x1d2024,8,22);st.sh.visible=false;
 sc.children.forEach(c=>{if(c.isDirectionalLight&&c.intensity>2)c.intensity=1.3;if(c.isHemisphereLight)c.intensity=1.1;if(c.isPointLight)c.visible=false});
 const mk=(w,h,d,c,x,y,z,em)=>{const m=new T.Mesh(new T.BoxGeometry(w,h,d),new T.MeshStandardMaterial({color:c,roughness:.8,emissive:em||0,emissiveIntensity:em?1:0}));m.position.set(x,y,z);sc.add(m);return m};
 const gc=document.createElement('canvas');gc.width=gc.height=256;const g=gc.getContext('2d');g.fillStyle='#2b2e33';g.fillRect(0,0,256,256);g.strokeStyle='#3a3e45';g.lineWidth=3;g.strokeRect(0,0,256,256);const gt=new T.CanvasTexture(gc);gt.wrapS=gt.wrapT=T.RepeatWrapping;gt.repeat.set(7,6);
 const fl=new T.Mesh(new T.PlaneGeometry(14,12),new T.MeshStandardMaterial({map:gt,roughness:.9}));fl.rotation.x=-Math.PI/2;sc.add(fl);
 mk(14,4,.2,0x2a2d33,0,2,-6);mk(.2,4,12,0x2a2d33,-7,2,0);mk(.2,4,12,0x2a2d33,7,2,0);mk(14,4,.2,0x2a2d33,0,2,6);mk(14,.2,12,0x181a1d,0,4,0);
 for(let i=0;i<5;i++)mk(2.4,.06,.12,0xf4f5f2,-5.2+i*2.6,3.9,-1.5+((i%2)?2:0),0xf4f5f2);
 mk(14,.04,.1,0x8433F0,0,.05,-5.9,0x8433F0);
 const veh=(k,e,x,z,ry,s=.9)=>{const v=GrittVehicle.build(k,e);v.assemble(1);v.root.position.set(x,.12,z);v.root.rotation.y=ry;v.root.scale.setScalar(s);sc.add(v.root);const p=new T.Mesh(new T.CylinderGeometry(.75,.8,.12,32),new T.MeshStandardMaterial({color:0x393d44}));p.position.set(x,.06,z);sc.add(p);return v};
 [0,1,2].forEach(i=>veh('enduro','electro',-4.6+i*1.5,-3.6+i*.5,.5+i*.2));
 veh('city','electro',-5.6,-.2,1.2);veh('buggy','electro',4.2,1.8,-.7,.8);veh('quad','electro',2.2,3,.5,.85);
 for(let r=0;r<2;r++)for(let c=0;c<5;c++)mk(.5,.14,.14,[0x8433F0,0xFF5B1F,0xBE93FF,0xB9B2A1,0xf4f5f2][c],2.4+c*.7,1.2+r*.5,-5.8);
 mk(4.2,1.8,.1,0x14151a,4.3,1.4,-5.9);
 mk(2.4,.9,.8,0x3a3e45,-5.4,.45,2);mk(2.4,.05,.9,0x8433F0,-5.4,.92,2,0x8433F0);mk(2.2,1.0,.6,0x3a3e45,-3.4,.5,4.4);
 const hs=$('#t-stage');const btns=TOUR.map((t,i)=>{const b=el(`<button class="hs" aria-label="${t.h}">${t.n}<span class="hl"> ${t.h}</span></button>`);b.onclick=()=>go(i);hs.append(b);return b});
 const plan=$('#t-plan');plan.innerHTML=`<rect x="10" y="10" width="260" height="180" fill="none" stroke="#5b6068" stroke-width="2"/>`+TOUR.map((t,i)=>`<circle cx="${t.plan[0]}" cy="${t.plan[1]}" r="10" data-i="${i}" tabindex="0" role="button" aria-label="${t.h}"/><text x="${t.plan[0]}" y="${t.plan[1]+4}" text-anchor="middle" font-size="11" fill="#15171A" font-family="JetBrains Mono Variable" font-weight="700" pointer-events="none">${i+1}</text>`).join('');
 $$('circle',plan).forEach(c=>{c.onclick=()=>go(+c.dataset.i);c.onkeydown=e=>{if(e.key==='Enter'||e.key===' ')go(+c.dataset.i)}});
 const cp=V3(TOUR[0].pos),tg=V3(TOUR[0].look);let yaw=0,pit=0,idx=0;
 function V3(a){return new T.Vector3(...a)}
 function go(i){idx=(i+TOUR.length)%TOUR.length;const t=TOUR[idx];if(G&&!RM)G.to([cp],{x:t.pos[0],y:t.pos[1],z:t.pos[2],duration:1.1,ease:'power3.inOut'}),G.to([tg],{x:t.look[0],y:t.look[1],z:t.look[2],duration:1.1,ease:'power3.inOut'});else{cp.set(...t.pos);tg.set(...t.look)}yaw=0;pit=0;info()}
 function info(){const t=TOUR[idx];$('#t-n').textContent=`Точка ${t.n} из 0${TOUR.length}`;$('#t-h').textContent=t.h;$('#t-p').textContent=t.p;$$('circle',plan).forEach((c,i)=>c.classList.toggle('on',i===idx));btns.forEach((b,i)=>b.style.background=i===idx?'#15171A':'')}
 $('#t-prev').onclick=()=>go(idx-1);$('#t-next').onclick=()=>go(idx+1);
 let d=null;hs.addEventListener('pointerdown',e=>{if(e.target.closest('.hs'))return;d={x:e.clientX,y:e.clientY}});addEventListener('pointerup',()=>d=null);hs.addEventListener('pointermove',e=>{if(!d)return;yaw+=(e.clientX-d.x)*.005;pit=Math.max(-.5,Math.min(.5,pit+(e.clientY-d.y)*.003));d={x:e.clientX,y:e.clientY}});
 const tmp=new T.Vector3();
 st.tick=()=>{const cam=st.cam;cam.position.copy(cp);const dir=tg.clone().sub(cp);dir.applyAxisAngle(new T.Vector3(0,1,0),-yaw);dir.y+=pit*dir.length()*.6;cam.lookAt(cp.clone().add(dir));
  const w=cv.clientWidth,h=cv.clientHeight;TOUR.forEach((t,i)=>{tmp.set(t.look[0],Math.max(1.2,t.look[1]+.4),t.look[2]).project(cam);const b=btns[i];const on=tmp.z<1&&Math.abs(tmp.x)<1.1&&Math.abs(tmp.y)<1.1;b.style.display=on?'':'none';b.style.left=((tmp.x+1)/2*w)+'px';b.style.top=((1-tmp.y)/2*h)+'px'})};
 st.place=()=>{};st.go();info();go(0)}
if('IntersectionObserver' in window){const io=new IntersectionObserver(es=>{if(es[0].isIntersecting){io.disconnect();initTour()}},{rootMargin:'400px'});io.observe($('#tour'))}else initTour();

/* ---------- МЕДИА ---------- */
const tabs=[['#tab-soc','#p-soc'],['#tab-vid','#p-vid']];
tabs.forEach(([t,p])=>$(t).onclick=()=>{tabs.forEach(([t2,p2])=>{const on=t2===t;$(t2).setAttribute('aria-selected',on);$(t2).setAttribute('aria-pressed',on);$(p2).hidden=!on})});
$$('[data-stub]').forEach(a=>a.onclick=e=>{e.preventDefault();toast('Ссылка-заглушка: подставим реальный канал')});
const vids=$('#vids');VIDEOS.forEach((v,i)=>{const b=el(`<button class="vid" data-cursor="Play" aria-label="Открыть видео: ${v.t}"><div class="ph ${v.ph}" data-cap=""></div><span class="play"><i></i></span><span class="meta"><b>${v.t}</b><span>${v.d}</span></span></button>`);b.onclick=()=>openColl(i,b);vids.append(b)});
let collFrom=null;
function openColl(i,from){collFrom=from;const c=$('#coll'),g=$('#coll-g');c.hidden=false;document.body.style.overflow='hidden';$('#coll-t').textContent=VIDEOS[i].t;
 const mob=innerWidth<720;const defs=mob?[[0,0,100,58,VIDEOS[i].ph,'кадр из ролика: '+VIDEOS[i].t],[0,60,24,38,'yard','за кадром'],[25,60,24,38,'moss','лес'],[50,60,24,38,'sand','деталь руля'],[75,60,25,38,'dusk','UGC']]:[[20,4,60,92,VIDEOS[i].ph,'кадр из ролика: '+VIDEOS[i].t],[0,4,17,44,'yard','за кадром: подготовка'],[0,52,17,44,'moss','за кадром: лес, обычная одежда'],[83,4,17,44,'sand','деталь: руль с фиолетовыми грипсами'],[83,52,17,44,'dusk','UGC: подписчик у себя во дворе']];
 g.innerHTML=defs.map(d=>`<div class="ph ${d[4]}" data-cap="${d[5]}" style="left:${d[0]}%;top:${d[1]}%;width:${d[2]}%;height:${d[3]}%"></div>`).join('');
 const r=from.getBoundingClientRect(),gr=g.getBoundingClientRect(),m=g.children[0];
 if(G&&!RM){G.from(m,{x:r.left-gr.left-gr.width*.2,y:r.top-gr.top-gr.height*.04,scale:r.width/(gr.width*.6),transformOrigin:'0 0',duration:.7,ease:'power3.out'});G.from([...g.children].slice(1),{opacity:0,scale:.6,x:i=>(i<2?-1:1)*160,duration:.6,delay:.35,stagger:.09,ease:'back.out(1.6)'})}
 $('#coll-x').focus()}
function closeColl(){$('#coll').hidden=true;document.body.style.overflow='';collFrom&&collFrom.focus()}
$('#coll-x').onclick=closeColl;$('#coll').addEventListener('click',e=>{if(e.target.id==='coll')closeColl()});
document.addEventListener('keydown',e=>{if(e.key==='Escape'){if(!$('#coll').hidden)closeColl();else if(!$('#drawer').hidden)closeCart()}});

/* ---------- СЕРВИС ---------- */
$('#svc').innerHTML=SERVICES.map(s=>`<article class="${s.hl?'hl':''}"><span class="n">${s.n}</span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" aria-hidden="true"><path d="${s.ic}"/></svg><h3>${s.h}</h3><p>${s.d}</p><ul>${s.l.map(x=>`<li>${x}</li>`).join('')}</ul></article>`).join('');
/* ---------- КАРТА ---------- */
{const pt=(lon,lat)=>[(lon-30)*28+20,(58-lat)*30+20];const mo=pt(37.6,55.75),ro=pt(39.7,47.2),kr=pt(38.97,45.04);let dots='';for(let x=20;x<510;x+=14)for(let y=20;y<430;y+=14){const k=Math.sin(x*.05)*Math.cos(y*.04);if(k>-.2)dots+=`<circle cx="${x}" cy="${y}" r="${1.2+Math.max(0,k)*1.2}" fill="#15171A" opacity=".16"/>`}
 $('#map').innerHTML=`<rect width="520" height="470" fill="#F4F5F2"/>${dots}
 <path d="M${mo} Q${mo[0]+60},${(mo[1]+ro[1])/2} ${ro}" fill="none" stroke="#8433F0" stroke-width="3" stroke-dasharray="6 6"/><path d="M${ro} L${kr}" stroke="#8433F0" stroke-width="3" fill="none"/>
 <ellipse cx="${kr[0]}" cy="${kr[1]+6}" rx="86" ry="42" fill="rgba(132,51,240,.12)" stroke="#8433F0" stroke-dasharray="4 5" stroke-width="2"/>
 <g><circle cx="${mo[0]}" cy="${mo[1]}" r="11" fill="#15171A"/><text x="${mo[0]+20}" y="${mo[1]+5}" fill="#15171A">Москва · доставка</text></g>
 <g><circle cx="${ro[0]}" cy="${ro[1]}" r="22" fill="none" stroke="#FF5B1F" stroke-width="3"><animate attributeName="r" values="14;30;14" dur="2.4s" repeatCount="indefinite"/><animate attributeName="opacity" values="1;0;1" dur="2.4s" repeatCount="indefinite"/></circle><circle cx="${ro[0]}" cy="${ro[1]}" r="12" fill="#FF5B1F" stroke="#15171A" stroke-width="3"/><text x="${ro[0]+24}" y="${ro[1]-8}" fill="#15171A" font-weight="800">Ростов-на-Дону</text><text x="${ro[0]+24}" y="${ro[1]+10}" fill="#15171A">шоурум · сервис · склад</text></g>
 <g><circle cx="${kr[0]}" cy="${kr[1]}" r="9" fill="#8433F0"/><text x="${kr[0]-90}" y="${kr[1]+58}" fill="#15171A">Краснодарский край · выезд</text></g>
 <text x="16" y="458" fill="#454a50" font-size="11">схема условная, не карта</text>`}

/* ---------- КОРЗИНА ---------- */
const drawer=$('#drawer'),scrim=$('#scrim');
function saveCart(){store.set('gritt-cart',S.cart);$('#cart-n').textContent=S.cart.reduce((a,c)=>a+c.q,0)}
function addCart(it){const f=S.cart.find(c=>c.id===it.id);f?f.q++:S.cart.push({...it,q:1});saveCart();toast('Добавлено: '+it.name);if(!drawer.hidden)renderCart()}
function openCart(){S.view='list';renderCart();drawer.hidden=false;scrim.hidden=false;$('#cart-close').focus()}
function closeCart(){drawer.hidden=true;scrim.hidden=true;$('#cart-open').focus()}
$('#cart-open').onclick=openCart;$('#cart-close').onclick=closeCart;scrim.onclick=closeCart;
const sum=()=>S.cart.reduce((a,c)=>a+c.q*c.price,0);
function renderCart(){const b=$('#dr-b'),f=$('#dr-f');
 if(S.view==='done'){b.innerHTML=`<div class="ok" role="status"><h3>Заказ принят</h3><p>Номер: <b>${S.order}</b>. Менеджер из Ростова напишет в течение рабочего дня и уточнит доставку или время выдачи. Это макет: данные никуда не отправлены.</p></div>`;f.innerHTML=`<button class="btn" id="dn">Продолжить</button>`;$('#dn').onclick=closeCart;return}
 if(!S.cart.length){b.innerHTML=`<div class="empty"><h3>Пока пусто</h3><p style="margin:10px 0 18px">Добавьте байк из линейки или соберите свой.</p><a class="btn vio" href="#config" id="e-go">В конфигуратор</a></div>`;f.innerHTML='';$('#e-go').onclick=closeCart;return}
 if(S.view==='form'){b.innerHTML=`<form class="form" id="co" novalidate><div class="f"><label for="o-n">Имя</label><input id="o-n" required autocomplete="name"><div class="err"></div></div><div class="f"><label for="o-t">Телефон</label><input id="o-t" type="tel" required autocomplete="tel"><div class="err"></div></div><div class="f"><label for="o-c">Получение</label><select id="o-c"><option>Самовывоз, шоурум в Ростове-на-Дону</option><option>Доставка по югу (рассчитаем после подтверждения)</option><option>Доставка в Москву (рассчитаем после подтверждения)</option></select></div><div class="f"><label for="o-m">Комментарий</label><textarea id="o-m" rows="3"></textarea></div><p class="mono">Оплата при подтверждении. Макет: ничего не отправляется.</p></form>`;
  f.innerHTML=`<div class="sum"><span>Итого</span><span>${P(sum())}</span></div><div style="display:flex;gap:10px"><button class="btn line" id="bk">Назад</button><button class="btn vio" id="sb" style="flex:1;justify-content:center">Оформить</button></div>`;$('#bk').onclick=()=>{S.view='list';renderCart()};
  $('#sb').onclick=()=>{const n=$('#o-n'),t=$('#o-t');let ok=true;[[n,n.value.trim().length>=2,'Укажите имя'],[t,t.value.replace(/\D/g,'').length>=10,'Телефон: минимум 10 цифр']].forEach(([i,v,m])=>{const f=i.parentNode;i.setAttribute('aria-invalid',!v);f.querySelector('.err').textContent=v?'':m;if(!v)ok=false});if(!ok)return;S.order='G-'+Math.floor(1000+Math.random()*9000);S.cart=[];saveCart();S.view='done';renderCart()};return}
 b.innerHTML=S.cart.map((c,i)=>`<div class="ci"><div class="ph ${c.ph}" data-cap=""></div><div><b>${c.name}</b><small>${c.sub}</small><div class="qty"><button aria-label="Меньше" data-d="-1" data-i="${i}">-</button><span>${c.q}</span><button aria-label="Больше" data-d="1" data-i="${i}">+</button></div></div><div style="text-align:right"><b>${P(c.price*c.q)}</b><br><button class="mono" style="background:none;border:0;cursor:pointer;text-decoration:underline;min-height:44px" data-rm="${i}">убрать</button></div></div>`).join('');
 f.innerHTML=`<div class="sum"><span>Товары</span><span>${P(sum())}</span></div><p class="mono">Доставка: рассчитаем при подтверждении</p><button class="btn vio" id="go" style="justify-content:center">Оформить заказ</button>`;
 $$('[data-d]',b).forEach(x=>x.onclick=()=>{const c=S.cart[+x.dataset.i];c.q+=+x.dataset.d;if(c.q<1)S.cart.splice(+x.dataset.i,1);saveCart();renderCart()});$$('[data-rm]',b).forEach(x=>x.onclick=()=>{S.cart.splice(+x.dataset.rm,1);saveCart();renderCart()});$('#go').onclick=()=>{S.view='form';renderCart()}}

/* ---------- ТЕСТ-ДРАЙВ ---------- */
function fillDriveModels(){const s=$('#d-model');if(!s)return;const cur=s.value;s.innerHTML=Object.entries(KINDS).map(([k,v])=>TIERS.map(t=>`<option value="${v.fam} ${t}">${v.fam} ${t} (${v.name})</option>`).join('')).join('');s.value=cur||`${KINDS[S.kind].fam} pro`;if(!s.value)s.selectedIndex=0}
fillDriveModels();
{const d=$('#d-date');const dt=new Date();const iso=x=>x.toISOString().slice(0,10);d.min=iso(dt);dt.setDate(dt.getDate()+2);d.value=iso(dt);
 $$('.city').forEach(c=>c.onclick=()=>$$('.city').forEach(x=>x.setAttribute('aria-checked',x===c)));
 $('#drive-form').onsubmit=e=>{e.preventDefault();const n=$('#d-name'),t=$('#d-tel'),da=$('#d-date');let ok=true;
  [[n,n.value.trim().length>=2,'#e-name','Укажите имя'],[t,t.value.replace(/\D/g,'').length>=10,'#e-tel','Телефон: минимум 10 цифр'],[da,da.value&&da.value>=da.min,'#e-date','Выберите дату не раньше сегодняшней']].forEach(([i,v,s,m])=>{i.setAttribute('aria-invalid',!v);$(s).textContent=v?'':m;if(!v)ok=false});if(!ok)return;
  const city=$('.city[aria-checked=true]').dataset.city,model=$('#d-model').value,time=$('#d-time').value;
  const ok$=$('#drive-ok');ok$.hidden=false;$('#drive-form').hidden=true;ok$.innerHTML=`<h3>Записали, ${n.value.trim()}</h3><p>${city}, ${new Date(da.value).toLocaleDateString('ru-RU',{day:'numeric',month:'long'})}, ${time}. Модель: ${model}. Подтвердим по телефону ${t.value}. Это макет: данные не отправляются.</p><div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:18px"><a class="btn" id="ics" download="gritt-test-drive.ics" href="#">В календарь (.ics)</a><button class="btn line" id="again" style="color:#fff">Записать еще</button></div>`;
  const z=da.value.replace(/-/g,'')+'T'+time.replace(':','')+'00';const ics=`BEGIN:VCALENDAR\r\nVERSION:2.0\r\nBEGIN:VEVENT\r\nDTSTART:${z}\r\nDURATION:PT1H\r\nSUMMARY:Gritt тест-драйв ${model}\r\nLOCATION:${city}\r\nEND:VEVENT\r\nEND:VCALENDAR`;
  $('#ics').href=URL.createObjectURL(new Blob([ics],{type:'text/calendar'}));$('#again').onclick=()=>{ok$.hidden=true;$('#drive-form').hidden=false}}}

/* ---------- КУРСОР ---------- */
if(!COARSE&&!RM){const c=$('.cur');let x=0,y=0,tx=0,ty=0;addEventListener('pointermove',e=>{tx=e.clientX;ty=e.clientY});
 (function f(){x+=(tx-x)*.25;y+=(ty-y)*.25;c.style.transform=`translate(${x}px,${y}px)`;requestAnimationFrame(f)})();
 document.addEventListener('pointerover',e=>{const t=e.target.closest('[data-cursor],.tile,.stage,.tour-stage');if(t){c.classList.add('big');c.textContent=t.dataset.cursor||(t.classList.contains('tile')?'Войти':'Drag')}else{c.classList.remove('big');c.textContent=''}})}
else document.body.classList.remove('cur-on');

/* ---------- СТАРТ ---------- */
applyVoice();setKind(S.kind);saveCart();renderCompare();renderQuiz();
if(G&&!RM&&window.ScrollTrigger){G.from('.svc article',{y:40,opacity:0,stagger:.08,duration:.6,scrollTrigger:{trigger:'#svc',start:'top 85%',once:true}});G.from('.vid',{y:40,opacity:0,stagger:.06,duration:.5,scrollTrigger:{trigger:'#vids',start:'top 90%',once:true}})}
const q=new URLSearchParams(location.search);if(q.has('skip')){gate.hidden=true;document.body.style.overflow='';if(q.get('kind'))setKind(q.get('kind'));if(q.get('energy')){S.energy=q.get('energy');setKind(S.kind)}}else openGate();
window.GRITT={S,setKind,hero};
})();
