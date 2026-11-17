/* שביל הווקטורים · המסע התלת־ממדי בעמוד האישי
   פותח על ידי אמתי צוברי · © כל הזכויות שמורות
   Journey.start(opts) → controller, או null אם אין תמיכה בתלת־ממד */
window.Journey={start(opts){
if(!window.THREE)return null;
const cv=document.getElementById('cv');
let renderer;
try{renderer=new THREE.WebGLRenderer({canvas:cv,antialias:true})}catch(e){return null}
if(!renderer.getContext())return null;
renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,2));
renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
const scene=new THREE.Scene();
scene.background=new THREE.Color(0xE6F4FF);
scene.fog=new THREE.Fog(0xE6F4FF,45,110);
const camera=new THREE.PerspectiveCamera(50,1,0.1,300);

/* ---------- light ---------- */
scene.add(new THREE.HemisphereLight(0xffffff,0x6FBF8C,0.55));
const sun=new THREE.DirectionalLight(0xfff4e0,0.62);
sun.position.set(-20,35,18);sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);
const sc=30;Object.assign(sun.shadow.camera,{left:-sc,right:sc,top:sc,bottom:-sc,near:1,far:100});
scene.add(sun);

const M=(c,o={})=>new THREE.MeshLambertMaterial(Object.assign({color:c,flatShading:true},o));

/* ---------- ground ---------- */
const ground=new THREE.Mesh(new THREE.CircleGeometry(80,48),M(0x9ED6AC));
ground.rotation.x=-Math.PI/2;ground.receiveShadow=true;scene.add(ground);

/* ---------- mountain ---------- */
const H=10,RB=12.5,RT=0.5;
const rAt=y=>RB-(RB-RT)*y/H;
const mg=new THREE.CylinderGeometry(RT,RB,H,16,8);
const pos=mg.attributes.position;const colors=[];
const cSnow=new THREE.Color(0xffffff),cGrass=new THREE.Color(0x6EC08C),cHigh=new THREE.Color(0x8FCBA4),cRock=new THREE.Color(0xAEB8C7);
for(let i=0;i<pos.count;i++){
  const x=pos.getX(i),y=pos.getY(i)+H/2,z=pos.getZ(i);
  const k=(y<H-0.01&&y>0.01)?(0.86+Math.random()*0.12):1; // only inward bumps → the trail always stays above the surface
  pos.setXYZ(i,x*k,pos.getY(i),z*k);
  const c=y>H*0.78?cSnow:(y>H*0.5?(Math.random()<.5?cRock:cHigh):cGrass);colors.push(c.r,c.g,c.b);
}
mg.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));mg.computeVertexNormals();
const mountain=new THREE.Mesh(mg,new THREE.MeshLambertMaterial({vertexColors:true,flatShading:true}));
mountain.position.y=H/2;mountain.castShadow=true;mountain.receiveShadow=true;scene.add(mountain);
// side hills
[[-22,-8,7,4],[20,-14,8,5],[-14,20,6,3.5],[24,14,6,3]].forEach(([x,z,r,h])=>{
  const g=new THREE.ConeGeometry(r,h,9,2);const m=new THREE.Mesh(g,M(0x86CFA0));m.position.set(x,h/2,z);m.castShadow=m.receiveShadow=true;scene.add(m)});

/* ---------- trail (spiral up the mountain) ---------- */
const turns=2.15,a0=Math.PI*0.62;
const ctrl=[];
ctrl.push(new THREE.Vector3(Math.cos(a0-0.5)*(RB+6),0.2,Math.sin(a0-0.5)*(RB+6)));
for(let i=0;i<=70;i++){
  const t=i/70,y=t*H*0.985,ang=a0+t*turns*Math.PI*2,r=rAt(y)+0.42;
  ctrl.push(new THREE.Vector3(Math.cos(ang)*r,y+0.12,Math.sin(ang)*r));
}
const curve=new THREE.CatmullRomCurve3(ctrl);
const trail=new THREE.Mesh(new THREE.TubeGeometry(curve,500,0.16,6,false),M(0xffffff,{flatShading:false}));
trail.receiveShadow=true;scene.add(trail);
// little stones along the trail edge
for(let i=0;i<160;i++){const p=curve.getPointAt(i/160);const s=new THREE.Mesh(new THREE.DodecahedronGeometry(0.07,0),M(0xB8A7FF));s.position.copy(p).add(new THREE.Vector3(0,0.14,0));scene.add(s)}

/* ---------- trees & rocks ---------- */
function tree(x,z,s){const g=new THREE.Group();
  const tr=new THREE.Mesh(new THREE.CylinderGeometry(.12*s,.16*s,.6*s,5),M(0x9C7A5B));tr.position.y=.3*s;g.add(tr);
  const c1=new THREE.Mesh(new THREE.ConeGeometry(.75*s,1.3*s,7),M(Math.random()<.5?0x4CB782:0x5CC293));c1.position.y=1.1*s;g.add(c1);
  const c2=new THREE.Mesh(new THREE.ConeGeometry(.55*s,1*s,7),M(0x6FD0A0));c2.position.y=1.65*s;g.add(c2);
  g.traverse(o=>{o.castShadow=true});g.position.set(x,0,z);scene.add(g)}
for(let i=0;i<70;i++){const a=Math.random()*Math.PI*2,r=RB+3+Math.random()*30;const x=Math.cos(a)*r,z=Math.sin(a)*r;
  const st=curve.getPointAt(0);if(Math.hypot(x-st.x,z-st.z)<4)continue;tree(x,z,.7+Math.random()*.7)}
for(let i=0;i<18;i++){const a=Math.random()*Math.PI*2,r=RB+2+Math.random()*25;const m=new THREE.Mesh(new THREE.DodecahedronGeometry(.4+Math.random()*.5,0),M(0xD5DCE6));m.position.set(Math.cos(a)*r,.25,Math.sin(a)*r);m.castShadow=true;scene.add(m)}

/* ---------- clouds ---------- */
const clouds=[];
for(let i=0;i<7;i++){const g=new THREE.Group();for(let j=0;j<4;j++){const s=new THREE.Mesh(new THREE.IcosahedronGeometry(1+Math.random()*.8,0),M(0xffffff));s.position.set(j*1.3-2,Math.random()*.5,Math.random()*.8);g.add(s)}
  g.position.set(-40+Math.random()*80,13+Math.random()*6,-40+Math.random()*80);scene.add(g);clouds.push(g)}

/* ---------- labels ---------- */
const stLabels=[];
function label(text,{bg='#ffffff',fg='#26324A',size=64}={}){
  const c=document.createElement('canvas');const x=c.getContext('2d');const f=`${size}px "Varela Round", sans-serif`;x.font=f;
  const w=Math.ceil(x.measureText(text).width)+size*0.9,h=size*1.5;c.width=w;c.height=h;
  x.font=f;x.direction='rtl';x.textAlign='center';x.textBaseline='middle';
  x.fillStyle=bg;const r=h/2;x.beginPath();x.moveTo(r,0);x.arcTo(w,0,w,h,r);x.arcTo(w,h,0,h,r);x.arcTo(0,h,0,0,r);x.arcTo(0,0,w,0,r);x.fill();
  x.fillStyle=fg;x.fillText(text,w/2,h/2+2);
  const tex=new THREE.CanvasTexture(c);tex.minFilter=THREE.LinearFilter;
  const sp=new THREE.Sprite(new THREE.SpriteMaterial({map:tex,depthWrite:false}));sp.scale.set(w/h*0.6,0.6,1);return sp;
}

/* ---------- stations ---------- */
const N=13;const stU=[];for(let i=0;i<=N;i++)stU.push(0.045+i*(0.955/N)); // last = summit
const stations=[];
for(let i=0;i<N;i++){
  const p=curve.getPointAt(stU[i]);const g=new THREE.Group();g.position.copy(p);
  const base=new THREE.Mesh(new THREE.CylinderGeometry(.62,.7,.22,10),M(0xffffff));base.position.y=.05;base.castShadow=base.receiveShadow=true;g.add(base);
  const ring=new THREE.Mesh(new THREE.TorusGeometry(.85,.07,6,24),M(0x6C63FF,{transparent:true,opacity:.0}));ring.rotation.x=Math.PI/2;ring.position.y=.12;g.add(ring);
  const pole=new THREE.Mesh(new THREE.CylinderGeometry(.04,.04,1.4,5),M(0x3B4A66));pole.position.set(.35,.75,0);
  const flag=new THREE.Mesh(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0,0,0),new THREE.Vector3(0,-.45,0),new THREE.Vector3(.6,-.22,0)]),new THREE.MeshLambertMaterial({color:0xFF6B6B,side:THREE.DoubleSide}));
  flag.geometry.computeVertexNormals();flag.position.set(.37,1.42,0);
  const fg=new THREE.Group();fg.add(pole);fg.add(flag);fg.scale.set(1,0.001,1);fg.visible=false;g.add(fg);
  const lab=label(String(i+1),{bg:'#ffffff',fg:'#7D8BA6',size:60});lab.position.set(0,1.0,0);lab.scale.multiplyScalar(.9);g.add(lab);stLabels.push(lab);
  scene.add(g);stations.push({g,base,ring,fg,lab,done:false});
}
// summit treasure
const sp=curve.getPointAt(1);const summit=new THREE.Group();summit.position.copy(sp);
const chest=new THREE.Group();
const cb=new THREE.Mesh(new THREE.BoxGeometry(1.1,.6,.75),M(0xC9802F));cb.position.y=.4;chest.add(cb);
const lid=new THREE.Mesh(new THREE.CylinderGeometry(.38,.38,1.1,8,1,false,0,Math.PI),M(0xB06A22));lid.rotation.z=Math.PI/2;lid.position.y=.7;chest.add(lid);
const band=new THREE.Mesh(new THREE.BoxGeometry(1.14,.12,.79),M(0xFFC93C));band.position.y=.62;chest.add(band);
const lock=new THREE.Mesh(new THREE.BoxGeometry(.18,.22,.1),M(0xFFC93C));lock.position.set(0,.5,.4);chest.add(lock);
chest.traverse(o=>o.castShadow=true);summit.add(chest);
const bigPole=new THREE.Mesh(new THREE.CylinderGeometry(.06,.06,2.6,6),M(0x3B4A66));bigPole.position.set(-.9,1.3,0);summit.add(bigPole);
const bigFlag=new THREE.Mesh(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0,0,0),new THREE.Vector3(0,-.8,0),new THREE.Vector3(1.1,-.4,0)]),new THREE.MeshLambertMaterial({color:0xFF6B6B,side:THREE.DoubleSide}));
bigFlag.position.set(-.88,2.55,0);summit.add(bigFlag);
const tl=label('האוצר',{bg:'#FF6B6B',fg:'#ffffff',size:56});tl.position.set(0,2.2,0);summit.add(tl);
scene.add(summit);

/* ---------- avatar (built from shapes, chosen by the student) ---------- */
const AV_OPTS={skin:['#FFE0C4','#F2C39B','#D9A077','#A8714A','#6E4A2E'],face:['חיוך','צחוק','קריצה','מופתע'],
  hair:['קצר','ארוך','קוקו','מתולתל','קוצים','בלי'],hairColor:['#2B2B2B','#6B4226','#C98B3F','#E8C46A','#B5452E','#7B61FF','#FF8CC6'],
  hat:['בלי','מצחייה','כובע צמר','כובע טיולים','כתר','אוזניות'],hatColor:['#FF6B6B','#3D8BFD','#4CB782','#FFB547','#26324A','#F5F5F5'],
  shirt:['#6C63FF','#FF6B6B','#3D8BFD','#4CB782','#FFB547','#FF8CC6','#26324A','#F5F5F5'],print:['חלקה','פסים','חץ וקטור','כוכב'],
  pants:['#3B4A66','#5C4A3A','#2E6B8A','#7A7F8C','#D9C7A3'],shoes:['#F5F5F5','#26324A','#FF6B6B','#3D8BFD','#FFB547'],
  pack:['#FFB547','#FF6B6B','#4CB782','#3D8BFD','#B38CFF'],glasses:['בלי','עגולות','משקפי שמש'],
  extra:['בלי','צעיף','מקל הליכה','משקפת','דגל'],buddy:['בלי','כלב','חתול','ארנב','תוכי','פינגווין']};
const AV_DEF={skin:1,face:0,hair:0,hairColor:0,hat:1,hatColor:0,shirt:0,print:0,pants:0,shoes:0,pack:0,glasses:0,extra:0,buddy:0};
let AV=Object.assign({},AV_DEF),hasAvatar=false;
function applyAvatar(sv){AV=Object.assign({},AV_DEF,sv||{});
for(const k in AV){if(!AV_OPTS[k]||!(AV[k]>=0)||AV[k]>=AV_OPTS[k].length)AV[k]=0}}
if(opts.avatar){applyAvatar(opts.avatar);hasAvatar=true}
let hiker,hipL,hipR,body,buddy=null;
const C=hex=>M(new THREE.Color(hex).getHex());
const dark=()=>new THREE.MeshBasicMaterial({color:0x26324A});
const mesh=(geo,mat,x=0,y=0,z=0)=>{const m=new THREE.Mesh(geo,mat);m.position.set(x,y,z);return m};
const Box=(w,h,d)=>new THREE.BoxGeometry(w,h,d),Ball=(r,dt=0)=>new THREE.IcosahedronGeometry(r,dt);
/* ---- buddies ---- */
function walker(fur,{earH=.14,earW=.07,earC=null,snout='#E8C9A0',tailLen=.22,tailUp=-.8,bodyL=.5,legH=.24}={}){
  const d=new THREE.Group(),f=C(fur);
  d.add(mesh(Box(.28,.24,bodyL),f,0,legH+.11,0));
  d.add(mesh(Box(.24,.22,.24),f,0,legH+.28,bodyL*.6));
  d.add(mesh(Box(.12,.1,.12),C(snout),0,legH+.24,bodyL*.6+.15));
  d.add(mesh(new THREE.SphereGeometry(.035,6,4),dark(),0,legH+.27,bodyL*.6+.21));
  [-1,1].forEach(q=>{const e=mesh(Box(earW,earH,.05),C(earC||fur),q*.08,legH+.39+earH/2-.07,bodyL*.6-.02);d.add(e);
    d.add(mesh(new THREE.SphereGeometry(.025,6,4),dark(),q*.06,legH+.32,bodyL*.6+.12))});
  [[-1,1],[1,1],[-1,-1],[1,-1]].forEach(([x,z])=>d.add(mesh(new THREE.CylinderGeometry(.04,.04,legH,5),f,x*.09,legH/2,z*bodyL*.34)));
  const tail=mesh(new THREE.CylinderGeometry(.03,.025,tailLen,5),f,0,legH+.24,-bodyL/2-.05);tail.rotation.x=tailUp;d.add(tail);d.userData.tail=tail;
  return d}
function makeBuddy(kind){let d;
  if(kind==='כלב')d=walker('#C98B3F',{earC:'#6B4226'});
  else if(kind==='חתול'){d=walker('#8A8F99',{earH:.1,earW:.08,snout:'#C9CDD6',tailLen:.36,tailUp:-.35,legH:.2,bodyL:.44});
    [-1,1].forEach(q=>{const w=mesh(Box(.14,.008,.008),dark(),q*.1,.43,.42);w.rotation.z=q*.15;d.add(w)})}
  else if(kind==='ארנב'){d=new THREE.Group();const f=C('#F2F2F2');
    d.add(mesh(Ball(.17,1),f,0,.2,0));d.add(mesh(Ball(.13,1),f,0,.4,.12));
    [-1,1].forEach(q=>{const e=mesh(Box(.06,.26,.04),f,q*.05,.62,.1);e.rotation.z=q*.12;d.add(e);d.add(mesh(Box(.03,.18,.045),C('#FFB3C7'),q*.05,.62,.1).translateZ(.005).rotateZ(q*.12));
      d.add(mesh(new THREE.SphereGeometry(.022,6,4),dark(),q*.055,.43,.23))});
    d.add(mesh(new THREE.SphereGeometry(.025,6,4),C('#FF8CC6'),0,.39,.25));d.add(mesh(Ball(.07,0),f,0,.22,-.18));d.userData.hop=2.4}
  else if(kind==='פינגווין'){d=new THREE.Group();
    d.add(mesh(new THREE.CylinderGeometry(.13,.18,.42,8),C('#26324A'),0,.27,0));
    d.add(mesh(new THREE.CylinderGeometry(.1,.14,.34,8),C('#F5F5F5'),0,.25,.05));
    d.add(mesh(Ball(.13,1),C('#26324A'),0,.55,0));
    [-1,1].forEach(q=>{d.add(mesh(new THREE.SphereGeometry(.025,6,4),C('#ffffff'),q*.05,.58,.11));d.add(mesh(new THREE.SphereGeometry(.014,6,4),dark(),q*.05,.58,.13));
      const w=mesh(Box(.04,.26,.12),C('#26324A'),q*.17,.3,0);w.rotation.z=q*.25;d.add(w);(d.userData.wings=d.userData.wings||[]).push(w);
      d.add(mesh(Box(.08,.03,.12),C('#FFB547'),q*.06,.02,.06))});
    const bk=mesh(new THREE.ConeGeometry(.04,.1,5),C('#FFB547'),0,.53,.15);bk.rotation.x=Math.PI/2;d.add(bk);d.userData.waddle=true}
  else if(kind==='תוכי'){d=new THREE.Group();
    d.add(mesh(Ball(.11,1),C('#4CB782'),0,.12,0));d.add(mesh(Ball(.08,1),C('#4CB782'),0,.27,.03));
    d.add(mesh(Ball(.04,0),C('#FF6B6B'),0,.31,-.02));
    const bk=mesh(new THREE.ConeGeometry(.03,.07,5),C('#FFB547'),0,.25,.11);bk.rotation.x=Math.PI/2+.5;d.add(bk);
    [-1,1].forEach(q=>{d.add(mesh(new THREE.SphereGeometry(.018,6,4),dark(),q*.05,.29,.08));
      const w=mesh(Box(.03,.14,.16),C('#3D8BFD'),q*.11,.13,-.02);d.add(w);(d.userData.wings=d.userData.wings||[]).push(w)});
    const t=mesh(Box(.06,.2,.03),C('#FF6B6B'),0,.0,-.12);t.rotation.x=.5;d.add(t);
    d.position.set(-.34,1.06,-.02);d.userData.perch=true;d.traverse(x=>{if(x.isMesh)x.castShadow=true});return d}
  d.position.set(.8,0,-.1);d.traverse(x=>{if(x.isMesh)x.castShadow=true});return d}
function buildHiker(){
  const keep=hiker?{p:hiker.position.clone(),r:hiker.rotation.y}:null;
  if(hiker)scene.remove(hiker);
  const g=new THREE.Group(),o=AV_OPTS,skin=o.skin[AV.skin],shirt=o.shirt[AV.shirt],S=C(skin);
  const light=['#F5F5F5','#FFB547','#FF8CC6'].includes(shirt);const ink=light?'#26324A':'#ffffff';
  body=new THREE.Mesh(new THREE.CylinderGeometry(.28,.34,.7,8),C(shirt));body.position.y=.85;g.add(body);
  /* shirt print */
  const pr=o.print[AV.print];
  if(pr==='פסים'){[.68,.84,1.0].forEach(y=>{const r=mesh(new THREE.CylinderGeometry(.3-(y-.68)*.12+.012,.31-(y-.68)*.12+.012,.06,8,1,true),C(ink),0,y,0);g.add(r)})}
  if(pr==='חץ וקטור'){const sh=mesh(Box(.04,.24,.02),C(ink),0,.84,.31);sh.rotation.z=-.7;g.add(sh);
    const hd=mesh(new THREE.ConeGeometry(.06,.1,3),C(ink),.1,.93,.31);hd.rotation.z=-.7;g.add(hd)}
  if(pr==='כוכב'){const sh=new THREE.Shape();for(let i=0;i<10;i++){const r=i%2?.045:.11,a=i/10*Math.PI*2+Math.PI/2;sh[i?'lineTo':'moveTo'](Math.cos(a)*r,Math.sin(a)*r)}
    g.add(mesh(new THREE.ExtrudeGeometry(sh,{depth:.02,bevelEnabled:false}),C(ink),0,.9,.305))}
  [-1,1].forEach(q=>{const a=new THREE.Mesh(new THREE.CylinderGeometry(.07,.07,.48,6),C(shirt));a.position.set(q*.35,.86,0);a.rotation.z=q*.15;g.add(a);
    g.add(mesh(Ball(.08),S,q*.39,.6,0))});
  g.add(mesh(new THREE.CylinderGeometry(.09,.1,.08,8),S,0,1.22,0)); // neck
  const head=new THREE.Mesh(Ball(.27,1),S);head.position.y=1.42;g.add(head);
  /* face */
  const fc=o.face[AV.face];
  [-1,1].forEach(q=>{
    if(fc==='קריצה'&&q===1){const w=mesh(Box(.07,.016,.016),dark(),q*.09,1.45,.25);g.add(w)}
    else g.add(mesh(new THREE.SphereGeometry(fc==='מופתע'?.045:.035,8,6),dark(),q*.09,1.45,.245));
    const br=mesh(Box(.08,.018,.018),C(AV_OPTS.hair[AV.hair]==='בלי'?'#6B4226':o.hairColor[AV.hairColor]),q*.095,fc==='מופתע'?1.56:1.53,.235);br.rotation.z=q*(fc==='מופתע'?-.15:.08);g.add(br);
    const ch=mesh(new THREE.CircleGeometry(.04,10),new THREE.MeshBasicMaterial({color:0xFF8C8C,transparent:true,opacity:.45}),q*.16,1.38,.225);ch.rotation.y=q*.55;g.add(ch)});
  g.add(mesh(Ball(.035,0),S,0,1.41,.27)); // nose
  if(fc==='צחוק'){const m=mesh(new THREE.CircleGeometry(.07,12,Math.PI,Math.PI),dark(),0,1.355,.262);g.add(m);g.add(mesh(new THREE.CircleGeometry(.035,10,Math.PI,Math.PI),C('#FF6B6B'),0,1.33,.264))}
  else if(fc==='מופתע'){const m=mesh(new THREE.TorusGeometry(.03,.012,6,12),dark(),0,1.33,.255);g.add(m)}
  else{const sm=mesh(new THREE.TorusGeometry(.06,.014,5,10,Math.PI),dark(),0,1.36,.25);sm.rotation.z=Math.PI;g.add(sm)}
  /* hair */
  const hc=o.hairColor[AV.hairColor],hs=o.hair[AV.hair],hatT=o.hat[AV.hat],openTop=hatT==='בלי'||hatT==='מצחייה'||hatT==='אוזניות'||hatT==='כתר';
  if(hs!=='בלי'){
    if(openTop&&hs!=='קוצים'){const top=new THREE.Mesh(new THREE.SphereGeometry(.29,10,6,0,Math.PI*2,0,Math.PI*0.5),C(hc));top.position.set(0,1.45,-.02);top.rotation.x=-.3;g.add(top)}
    if(hs==='ארוך'){g.add(mesh(Box(.52,.5,.12),C(hc),0,1.27,-.2))}
    if(hs==='קוקו'){g.add(mesh(Ball(.13),C(hc),0,1.5,-.3));const tl=mesh(new THREE.ConeGeometry(.08,.3,6),C(hc),0,1.33,-.36);tl.rotation.x=Math.PI+.3;g.add(tl)}
    if(hs==='מתולתל'&&openTop){for(let i=0;i<10;i++){const an=i/10*Math.PI*2;g.add(mesh(Ball(.1),C(hc),Math.cos(an)*.24,1.58+Math.sin(i*1.7)*.04,Math.sin(an)*.22-.05))}}
    if(hs==='קוצים'){const cap=new THREE.Mesh(new THREE.SphereGeometry(.285,10,6,0,Math.PI*2,0,Math.PI*0.42),C(hc));cap.position.set(0,1.45,-.02);g.add(cap);
      if(openTop)for(let i=0;i<7;i++){const an=(i/6-.5)*1.9;const sp=mesh(new THREE.ConeGeometry(.06,.2,5),C(hc),Math.sin(an)*.17,1.66,Math.cos(an)*.06-.08);sp.rotation.z=-an*.5;sp.rotation.x=-.4;g.add(sp)}}
  }
  /* hats */
  const hatC=o.hatColor[AV.hatColor];
  if(hatT==='מצחייה'){g.add(mesh(new THREE.SphereGeometry(.3,10,6,0,Math.PI*2,0,Math.PI*0.45),C(hatC),0,1.5,0));g.add(mesh(Box(.32,.03,.24),C(hatC),0,1.55,.3))}
  if(hatT==='כובע צמר'){g.add(mesh(new THREE.SphereGeometry(.3,10,6,0,Math.PI*2,0,Math.PI*0.52),C(hatC),0,1.47,0));const rim=mesh(new THREE.TorusGeometry(.28,.05,6,16),C(hatC),0,1.5,0);rim.rotation.x=Math.PI/2;g.add(rim);g.add(mesh(Ball(.08),C('#ffffff'),0,1.79,0))}
  if(hatT==='כובע טיולים'){g.add(mesh(new THREE.CylinderGeometry(.22,.27,.22,10),C(hatC),0,1.67,0));g.add(mesh(new THREE.CylinderGeometry(.47,.47,.03,16),C(hatC),0,1.57,0));g.add(mesh(new THREE.CylinderGeometry(.272,.272,.05,10),C('#26324A'),0,1.6,0))}
  if(hatT==='כתר'){const gold=C('#FFC93C');g.add(mesh(new THREE.CylinderGeometry(.2,.2,.1,10,1,true),gold,0,1.7,0));
    for(let i=0;i<5;i++){const an=i/5*Math.PI*2;g.add(mesh(new THREE.ConeGeometry(.045,.12,4),gold,Math.sin(an)*.19,1.8,Math.cos(an)*.19))}
    g.add(mesh(Ball(.035,0),C(hatC),0,1.7,.205))}
  if(hatT==='אוזניות'){const band=mesh(new THREE.TorusGeometry(.3,.025,6,16,Math.PI),C('#26324A'),0,1.45,0);g.add(band);
    [-1,1].forEach(q=>{const cup=mesh(new THREE.CylinderGeometry(.09,.09,.08,10),C(hatC),q*.29,1.43,0);cup.rotation.z=Math.PI/2;g.add(cup)})}
  /* glasses */
  const gl=o.glasses[AV.glasses];
  if(gl==='עגולות'){[-1,1].forEach(q=>g.add(mesh(new THREE.TorusGeometry(.065,.016,6,14),dark(),q*.095,1.45,.255)));g.add(mesh(Box(.06,.015,.015),dark(),0,1.46,.262))}
  if(gl==='משקפי שמש'){[-1,1].forEach(q=>g.add(mesh(Box(.13,.08,.02),dark(),q*.085,1.455,.262)));g.add(mesh(Box(.36,.02,.02),dark(),0,1.48,.262))}
  /* pack */
  const pk=C(o.pack[AV.pack]);g.add(mesh(Box(.42,.5,.26),pk,0,.92,-.3));g.add(mesh(Box(.32,.16,.06),pk,0,.78,-.45));
  g.add(mesh(new THREE.CylinderGeometry(.07,.07,.44,8),C('#7A7F8C'),0,1.2,-.32).rotateZ(Math.PI/2));
  [-1,1].forEach(q=>g.add(mesh(Box(.05,.5,.02),pk,q*.15,.95,.29)));
  /* extras */
  const ex=o.extra[AV.extra];
  if(ex==='צעיף'){const sc=C(hatT==='בלי'?'#FF6B6B':hatC);const r=mesh(new THREE.TorusGeometry(.15,.06,6,14),sc,0,1.21,0);r.rotation.x=Math.PI/2;g.add(r);const tl=mesh(Box(.1,.32,.04),sc,-.13,1.04,.25);tl.rotation.z=-.12;g.add(tl)}
  if(ex==='מקל הליכה'){const st=mesh(new THREE.CylinderGeometry(.025,.025,1.2,5),C('#8A5A32'),.44,.55,.12);st.rotation.x=-.12;g.add(st);g.add(mesh(Ball(.04,0),C('#26324A'),.44,1.14,.05))}
  if(ex==='משקפת'){const bn=new THREE.Group();[-1,1].forEach(q=>{const c=mesh(new THREE.CylinderGeometry(.04,.045,.12,8),dark(),q*.05,0,0);c.rotation.x=Math.PI/2;bn.add(c)});bn.position.set(0,1.0,.31);g.add(bn);
    [-1,1].forEach(q=>{const s=mesh(Box(.015,.3,.015),dark(),q*.1,1.13,.27);s.rotation.z=q*.4;g.add(s)})}
  if(ex==='דגל'){g.add(mesh(new THREE.CylinderGeometry(.018,.018,1.4,5),C('#8A5A32'),-.16,1.55,-.36));const fl=mesh(Box(.02,.22,.32),C('#FF6B6B'),-.16,2.1,-.53);g.add(fl);fl.name='flag'}
  /* legs + shoes */
  const pc=o.pants[AV.pants],sh=C(o.shoes[AV.shoes]);const legL=new THREE.Mesh(new THREE.CylinderGeometry(.09,.09,.55,6),C(pc)),legR=legL.clone();
  hipL=new THREE.Group();hipR=new THREE.Group();hipL.position.set(.13,.55,0);hipR.position.set(-.13,.55,0);legL.position.y=-.27;legR.position.y=-.27;hipL.add(legL);hipR.add(legR);
  [hipL,hipR].forEach(h=>{h.add(mesh(Box(.15,.09,.26),sh,0,-.53,.04));h.add(mesh(Box(.16,.025,.27),C('#ffffff'),0,-.575,.04))});
  g.add(hipL);g.add(hipR);
  const glow=new THREE.Mesh(new THREE.CircleGeometry(.6,20),new THREE.MeshBasicMaterial({color:0x6C63FF,transparent:true,opacity:.25}));glow.rotation.x=-Math.PI/2;glow.position.y=.03;g.add(glow);
  const bk=o.buddy[AV.buddy];buddy=bk==='בלי'?null:makeBuddy(bk);if(buddy)g.add(buddy);
  g.traverse(x=>{if(x.isMesh&&x!==glow)x.castShadow=true});
  g.scale.setScalar(.85);if(keep){g.position.copy(keep.p);g.rotation.y=keep.r}
  hiker=g;scene.add(g);
}
buildHiker();

/* ---------- state ---------- */
let cur=Math.max(0,Math.min(N,opts.cur||0)); // station where the hiker stands (N = summit)
let u=stU[cur];
let walking=null,queueWalk=null;
let view='intro';
let focus=null;     // station index the camera is looking at (tap on a station)
function setDone(arr,animate){arr=arr||[];stations.forEach((s,i)=>{const d=!!arr[i];
  if(d&&!s.done){s.fg.visible=true;const later=animate||(opts.from!=null&&i>=opts.from);s.fg.scale.y=later?.001:1;if(later&&i<cur)s.raise=performance.now()+400}
  if(!d){s.fg.visible=false}
  s.done=d})}
setDone(opts.done,false);
function paintStations(){stations.forEach((s,i)=>{
  s.base.material.color.set(s.done?0x4CB782:(i===cur?0x6C63FF:(opts.open&&opts.open[i]?0xffffff:0xD9DEE8)));
  s.ring.material.opacity=i===cur?.85:(i===focus?.5:0);
})}
paintStations();
const $=id=>document.getElementById(id);
function toast(t,s,ms){const el=$('toast');if(!el)return;el.innerHTML=t+(s?`<small>${s}</small>`:'');el.classList.add('on');clearTimeout(toast.t);toast.t=setTimeout(()=>el.classList.remove('on'),ms||2200)}

/* ---------- avatar creator ---------- */
const ROWS=[['חבר לדרך','buddy','t'],['גוון עור','skin','c'],['פנים','face','t'],['תסרוקת','hair','t'],['צבע שיער','hairColor','c'],['כובע','hat','t'],['צבע','hatColor','c'],['חולצה','shirt','c'],['הדפס','print','t'],['מכנסיים','pants','c'],['נעליים','shoes','c'],['תרמיל','pack','c'],['משקפיים','glasses','t'],['אביזר','extra','t']];
function renderCreator(){
  $('rows').innerHTML=ROWS.filter(([,k])=>!(k==='hatColor'&&['בלי','כתר'].includes(AV_OPTS.hat[AV.hat]))&&!(k==='hairColor'&&AV_OPTS.hair[AV.hair]==='בלי')).map(([lab,k,type])=>
    `<div class="opt"><div class="l">${lab}</div><div class="sw">${AV_OPTS[k].map((v,i)=>type==='c'
      ?`<button class="c ${AV[k]===i?'on':''}" data-k="${k}" data-i="${i}" style="background:${v}" aria-label="${lab} ${i+1}"></button>`
      :`<button class="t ${AV[k]===i?'on':''}" data-k="${k}" data-i="${i}">${v}</button>`).join('')}</div></div>`).join('');
}
$('rows').addEventListener('click',e=>{const b=e.target.closest('button[data-k]');if(!b)return;AV[b.dataset.k]=+b.dataset.i;buildHiker();renderCreator()});
function openCreator(){if(walking)return;document.body.classList.add('creating');view='creator';focus=null;paintStations();resetOrbit();flyTo('creator',1600);renderCreator();$('creator').classList.add('on')}
function closeCreator(){const first=!hasAvatar;hasAvatar=true;resetOrbit();$('creator').classList.remove('on');document.body.classList.remove('creating');
  view='follow';focus=null;if(opts.onView)opts.onView(view);flyTo('follow',1800);if(opts.onAvatar)opts.onAvatar(Object.assign({},AV));if(first)setTimeout(()=>toast('יוצאים לדרך!','בהצלחה במסע'),900);setTimeout(runQueued,1900)}
$('bStart').onclick=closeCreator;
$('bDice').onclick=()=>{for(const k in AV_OPTS){const n=AV_OPTS[k].length;AV[k]=(k==='glasses'||k==='extra')&&Math.random()<.5?0:Math.floor(Math.random()*n)}buildHiker();renderCreator()};

/* ---------- camera rigs ---------- */
const tmp=new THREE.Vector3();
function overviewPose(t){const a=t*0.05+0.6;return {p:new THREE.Vector3(Math.cos(a)*30,36,Math.sin(a)*30),l:new THREE.Vector3(0,3.5,0)}}
function followPose(uu){if(uu===undefined)uu=u;
  const p=curve.getPointAt(Math.min(uu,1)),tg=curve.getTangentAt(Math.min(uu,.999));tg.y=0;tg.normalize();
  const out=new THREE.Vector3(p.x,0,p.z).normalize();
  const cp=p.clone().addScaledVector(tg,-7.6).addScaledVector(out,6.4);cp.y=p.y+5.9;
  const l=p.clone().addScaledVector(tg,2.4);l.y=p.y+0.8;return {p:cp,l};
}
const camPos=new THREE.Vector3(),camLook=new THREE.Vector3();
let fly=null; // {fromP,fromL,t0,dur}
function flyTo(target,dur=2200){fly={fromP:camPos.clone(),fromL:camLook.clone(),t0:performance.now(),dur,target}}
const ease=k=>k<.5?4*k*k*k:1-Math.pow(-2*k+2,3)/2;

/* ---------- controls ---------- */
let userYaw=0,userPitch=0,userZoom=1,drag=null;const ptrs=new Map();let pinch0=0,zoom0=1;
const _sph=new THREE.Spherical(),_v=new THREE.Vector3(),_up=new THREE.Vector3(0,1,0);
const _rc=new THREE.Raycaster();
function orbit(T,pv,minPhi,maxPhi,minY,collide=true){
  _v.copy(T.p).sub(pv);_sph.setFromVector3(_v);const base=_sph.phi;
  _sph.theta+=userYaw;_sph.radius*=userZoom;_sph.phi=Math.max(minPhi,Math.min(maxPhi,base-userPitch));
  userPitch=base-_sph.phi; // keep pitch inside the allowed range
  _v.setFromSpherical(_sph);
  if(collide){_rc.set(pv,_v.clone().normalize());_rc.far=_sph.radius;const h=_rc.intersectObject(mountain)[0];if(h)_v.setLength(Math.max(.9,h.distance-.4))}
  T.p.copy(pv).add(_v);if(T.p.y<minY)T.p.y=minY;
  if(userYaw)T.l.sub(pv).applyAxisAngle(_up,userYaw).add(pv)}
function resetOrbit(){userYaw=0;userPitch=0;userZoom=1}
cv.addEventListener('pointerdown',e=>{ptrs.set(e.pointerId,{x:e.clientX,y:e.clientY});cv.setPointerCapture(e.pointerId);
  if(ptrs.size===2){const [a,b]=[...ptrs.values()];pinch0=Math.hypot(a.x-b.x,a.y-b.y);zoom0=userZoom;drag=null}else drag={x:e.clientX,y:e.clientY}});
const setZoom=z=>{userZoom=Math.max(.55,Math.min(2.4,z))};
cv.addEventListener('wheel',e=>{e.preventDefault();setZoom(userZoom*Math.exp(e.deltaY*0.0012))},{passive:false});
cv.addEventListener('pointermove',e=>{if(ptrs.has(e.pointerId))ptrs.set(e.pointerId,{x:e.clientX,y:e.clientY});if(ptrs.size===2&&pinch0){const [a,b]=[...ptrs.values()];setZoom(zoom0*pinch0/Math.max(10,Math.hypot(a.x-b.x,a.y-b.y)));return}if(!drag)return;userYaw-=(e.clientX-drag.x)*(view==='creator'?0.012:0.008);userPitch+=(e.clientY-drag.y)*0.007;drag.x=e.clientX;drag.y=e.clientY});
const ptrEnd=e=>{ptrs.delete(e.pointerId);if(ptrs.size<2)pinch0=0;drag=null};cv.addEventListener('pointerup',ptrEnd);cv.addEventListener('pointercancel',ptrEnd);
// tap (click without dragging) on a station → callback
let downAt=null;
cv.addEventListener('pointerdown',e=>{downAt={x:e.clientX,y:e.clientY,t:performance.now()}});
cv.addEventListener('pointerup',e=>{if(!downAt||view==='creator')return;const moved=Math.hypot(e.clientX-downAt.x,e.clientY-downAt.y);if(moved>8||performance.now()-downAt.t>600)return;
  const r=cv.getBoundingClientRect(),m=new THREE.Vector2((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1);
  _rc.far=Infinity;_rc.setFromCamera(m,camera);let best=-1,bd=1e9;
  const hits=_rc.intersectObjects(stations.map(s=>s.g).concat([summit]),true);
  if(hits.length){let o=hits[0].object;while(o&&o.parent!==scene)o=o.parent;best=o===summit?N:stations.findIndex(s=>s.g===o)}
  else{ // forgiving tap: nearest station on screen within 36px
    stations.forEach((s,i)=>{const p=s.g.position.clone().add(new THREE.Vector3(0,.6,0)).project(camera);const dx=(p.x-m.x)*r.width/2,dy=(p.y-m.y)*r.height/2,d=Math.hypot(dx,dy);if(p.z<1&&d<36&&d<bd){bd=d;best=i}})}
  if(best>=0&&opts.onStation)opts.onStation(best)});
function setView(v){resetOrbit();focus=null;view=v;paintStations();flyTo(v,1800);if(opts.onView)opts.onView(view)}
function lookAt(i){if(view==='creator')return;resetOrbit();focus=i;view='station';paintStations();flyTo('station',1500);if(opts.onView)opts.onView(view)}
function runQueued(){if(queueWalk&&!walking&&view!=='creator'){const q=queueWalk;queueWalk=null;walkTo(q)}}
function walkTo(to){to=Math.max(0,Math.min(N,to));if(to<=cur){cur=to;u=stU[cur];paintStations();return}
  if(view==='creator'){queueWalk=to;return}
  if(view!=='follow'){view='follow';focus=null;resetOrbit();flyTo('follow',1200);if(opts.onView)opts.onView(view)}
  walking={from:u,to:stU[to],target:to,t0:performance.now()+1300,dur:3000+(stU[to]-u)*4000}}

/* ---------- loop ---------- */
function resize(){const w=innerWidth,h=innerHeight;renderer.setSize(w,h,false);camera.aspect=w/h;camera.fov=w<600?62:50;camera.updateProjectionMatrix()}
addEventListener('resize',resize);resize();
const start=performance.now();
let o=overviewPose(0);camPos.copy(o.p);camLook.copy(o.l);
setTimeout(()=>{if(hasAvatar||opts.noCreator){view='follow';flyTo('follow',2600);if(opts.onView)opts.onView(view);setTimeout(runQueued,2700)}else openCreator()},1400);

function frame(now){
  const t=(now-start)/1000;
  // walking
  let moving=false;
  if(walking&&!walking.raised&&now>walking.t0-1100){walking.raised=1;stations.forEach((s,i)=>{if(s.done&&i<walking.target&&s.fg.scale.y<.01)s.raise=now+(i-cur)*250})}
  if(walking&&now>walking.t0){
    const k=Math.min(1,(now-walking.t0)/walking.dur);u=walking.from+(walking.to-walking.from)*(k<.5?2*k*k:1-Math.pow(-2*k+2,2)/2);moving=k<1;
    if(k>=1){const tgt=walking.target;walking=null;cur=tgt;paintStations();if(opts.onArrive)opts.onArrive(cur);
      if(cur>=N){toast('הגעת לפסגה!','מצאת את האוצר',3500);confetti();}}
  }
  // hiker pose
  const p=curve.getPointAt(Math.min(u,1)),tg=curve.getTangentAt(Math.min(u,.999));
  hiker.position.copy(p).add(new THREE.Vector3(0,.12,0));
  hiker.rotation.y=Math.atan2(tg.x,tg.z);
  const sw=moving?Math.sin(t*11)*.6:Math.sin(t*2)*.04;hipL.rotation.x=sw;hipR.rotation.x=-sw;
  body.position.y=.85+(moving?Math.abs(Math.sin(t*11))*.06:Math.sin(t*2)*.02);
  if(buddy){const ud=buddy.userData;
    if(ud.perch){buddy.position.y=1.06+Math.abs(Math.sin(t*(moving?12:2)))*.03;ud.wings.forEach((w,i)=>w.rotation.z=(i?-1:1)*(moving?.5+Math.sin(t*20)*.4:.1+Math.sin(t*2)*.05))}
    else{buddy.position.y=moving?Math.abs(Math.sin(t*(ud.hop?8:12)+1))*.07*(ud.hop||1):0;
      if(ud.tail)ud.tail.rotation.z=Math.sin(t*(moving?16:8))*.6;
      if(ud.waddle){buddy.rotation.z=Math.sin(t*(moving?12:3))*(moving?.15:.04);ud.wings.forEach((w,i)=>w.rotation.z=(i?-1:1)*(.25+Math.abs(Math.sin(t*4))*.2))}}}
  // flags
  stations.forEach(s=>{if(s.raise&&now>=s.raise){const k=Math.min(1,(now-s.raise)/700);s.fg.scale.y=Math.max(.001,1-Math.pow(1-k,3)*1+(k<1?Math.sin(k*Math.PI)*.15:0));if(k>=1)s.raise=0}
    if(s.ring.material.opacity>0)s.ring.scale.setScalar(1+Math.sin(t*3)*.08)});
  bigFlag.rotation.y=Math.sin(t*2)*.25;
  clouds.forEach((c,i)=>{c.position.x+=0.01+(i%3)*.004;if(c.position.x>45)c.position.x=-45});
  // camera
  stLabels.forEach(l=>l.visible=view!=='creator');
  let target;
  if(view==='creator'){const hp=hiker.position,ry=hiker.rotation.y,f=new THREE.Vector3(Math.sin(ry),0,Math.cos(ry));const sw=Math.sin(t*.5)*.5;
    const side=new THREE.Vector3(f.z,0,-f.x);const wide=innerWidth>=900;
    target=wide?{p:hp.clone().addScaledVector(f,4.3).addScaledVector(side,sw+1.6).add(new THREE.Vector3(0,1.5,0)),l:hp.clone().add(new THREE.Vector3(0,0.9,0)).addScaledVector(side,1.5)}
      :{p:hp.clone().addScaledVector(f,4.3).addScaledVector(side,sw*.6+2.2).add(new THREE.Vector3(0,1.6,0)),l:hp.clone().add(new THREE.Vector3(0,0.75,0))};
    orbit(target,hp.clone().add(new THREE.Vector3(0,.7,0)),.12,1.75,hp.y+.12)}
  else if(view==='station'){target=focus>=N?followPose(1):followPose(stU[focus]);orbit(target,target.l.clone(),.12,1.72,.2)}
  else if(view==='overview'||view==='intro'){target=overviewPose(t);orbit(target,target.l.clone(),.08,1.42,.8,false)}
  else{target=followPose();orbit(target,target.l.clone(),.12,1.72,(hiker?hiker.position.y:0)+.12)}
  if(fly){const k=Math.min(1,(now-fly.t0)/fly.dur),e=ease(k);camPos.lerpVectors(fly.fromP,target.p,e);camLook.lerpVectors(fly.fromL,target.l,e);
    // arc a little upward while flying
    camPos.y+=Math.sin(e*Math.PI)*4;if(k>=1)fly=null}
  else{camPos.lerp(target.p,0.08);camLook.lerp(target.l,0.1)}
  if(walking&&!drag){userYaw*=0.97;userPitch*=0.97;userZoom+=(1-userZoom)*.03}
  {const want=(view==='creator'&&innerWidth<900)?Math.round(innerHeight*0.27):0;
   if(want!==(camera.view&&camera.view.enabled?camera.view.offsetY:0)){if(want)camera.setViewOffset(innerWidth,innerHeight,0,want,innerWidth,innerHeight);else camera.clearViewOffset()}}
  camera.position.copy(camPos);camera.lookAt(camLook);
  // confetti
  conf.forEach(c=>{c.position.addScaledVector(c.userData.v,0.016);c.userData.v.y-=0.16;c.rotation.x+=.1;c.rotation.z+=.08});
  renderer.render(scene,camera);requestAnimationFrame(frame);
}
const conf=[];
function confetti(){const cols=[0xFF6B6B,0x6C63FF,0xFFB547,0x4CB782,0x3D8BFD];for(let i=0;i<120;i++){const m=new THREE.Mesh(new THREE.PlaneGeometry(.18,.1),new THREE.MeshBasicMaterial({color:cols[i%5],side:THREE.DoubleSide}));
  m.position.copy(sp).add(new THREE.Vector3(0,2,0));m.userData.v=new THREE.Vector3((Math.random()-.5)*6,4+Math.random()*5,(Math.random()-.5)*6);scene.add(m);conf.push(m)}}
requestAnimationFrame(frame);
if(cur>=N)setTimeout(confetti,3000);
return {walkTo,queue(to){queueWalk=to;if(!walking&&(view==='follow'||view==='station'||view==='overview'))runQueued()},openCreator,setView,lookAt,toast,
  setDone(arr){setDone(arr,true);paintStations()},
  setOpen(arr){opts.open=arr;paintStations()},
  setAvatar(av){applyAvatar(av);hasAvatar=true;buildHiker()},
  get view(){return view},get cur(){return cur},get walking(){return !!walking||!!queueWalk},get hasAvatar(){return hasAvatar}};
}};
