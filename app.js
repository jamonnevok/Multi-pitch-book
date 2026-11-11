'use strict';
const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)];
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const G='3 4a 4b 4c 5a 5b 5c 6a 6a+ 6b 6b+ 6c 6c+ 7a 7a+ 7b 7b+ 7c 7c+ 8a 8a+ 8b 8b+ 8c 8c+ 9a'.split(' '),gi=g=>G.indexOf(String(g||'').toLowerCase());
const IC={list:'<path d="M4 7h16M4 12h16M4 17h10"/>',data:'<path d="M12 4v11m0 0-4-4m4 4 4-4M5 19h14"/>',plus:'<path d="M12 5v14M5 12h14"/>',back:'<path d="M15 5l-7 7 7 7"/>',x:'<path d="M6 6l12 12M18 6 6 18"/>',edit:'<path d="M4 20h4L19 9l-4-4L4 16z"/>',trash:'<path d="M5 7h14M10 7V4h4v3M7 7l1 13h8l1-13"/>',filter:'<path d="M4 6h16M7 12h10M10 18h4"/>',theme:'<circle cx="12" cy="12" r="4"/><path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6 7 7M17 17l1.40 1.40M5.60 18.40 7 17M17 7l1.40-1.40"/>',cam:'<path d="M4 8h3l2-3h6l2 3h3v11H4z"/><circle cx="12" cy="13" r="3.50"/>',star:'<path d="m12 3.50 2.60 5.40 5.90.8-4.30 4.10 1 5.90-5.20-2.80-5.20 2.80 1-5.90L3.50 9.70l5.90-.8z"/>'};
const ic=(n,x='')=>`<svg viewBox="0 0 24 24" ${x}>${IC[n]}</svg>`;
const MT='<svg viewBox="0 0 300 170" preserveAspectRatio="xMidYMid slice"><path d="M0 140 70 70l30 35 50-75 60 85 30-30 60 55"/><path d="M0 155h300" opacity=".5"/></svg>';
document.querySelector('#fab').innerHTML=ic('plus');
$('[data-n=list]').innerHTML=ic('list')+'Climbs';$('[data-n=data]').innerHTML=ic('data')+'Backup';
/* DB */
const db=new Promise((res,rej)=>{const r=indexedDB.open('pitchbook',1);r.onupgradeneeded=()=>{r.result.createObjectStore('c',{keyPath:'id'});r.result.createObjectStore('m')};r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error)});
const tx=async(st,mode,fn)=>{const d=await db;return new Promise((res,rej)=>{const t=d.transaction(st,mode),r=fn(t.objectStore(st));t.oncomplete=()=>res(r&&r.result);t.onerror=()=>rej(t.error)})};
const all=()=>tx('c','readonly',s=>s.getAll()),get=id=>tx('c','readonly',s=>s.get(id)),put=c=>tx('c','readwrite',s=>s.put(c)),del=id=>tx('c','readwrite',s=>s.delete(id)),getM=k=>tx('m','readonly',s=>s.get(k)),setM=(k,v)=>tx('m','readwrite',s=>s.put(v,k));
/* helpers */
const toast=m=>{const t=$('#toast');t.textContent=m;t.classList.add('on');setTimeout(()=>t.classList.remove('on'),2200)};
const fmtD=d=>d?new Date(d+'T12:00').toLocaleDateString(undefined,{day:'numeric',month:'short',year:'numeric'}):'';
const pill=g=>{const i=gi(g);return g?`<span class=pill style="--h:${i<0?210:Math.round(205-i/(G.length-1)*185)}">${esc(g)}</span>`:''};
const stars=r=>r?`<span class=st aria-label="${r} of 5">${[1,2,3,4,5].map(i=>ic('star',i<=r?'class=f':'')).join('')}</span>`:'';
const L={style:{lead:'Lead',follow:'Follow',swap:'Swapped'},outcome:{done:'Completed',bailed:'Bailed',partial:'Partial'},weather:['Sunny','Cloudy','Windy','Rain','Snow','Fog'],rock:['Dry','Damp','Wet','Polished'],crowds:['Empty','Quiet','Some','Busy']};
const chips=(n,opts,v)=>`<div class=chips>${opts.map(([k,l])=>`<label class=chip><input type=radio name=${n} value="${esc(k)}" ${String(v)===String(k)?'checked':''}><span>${esc(l)}</span></label>`).join('')}</div>`;
const objO=o=>Object.entries(o),arrO=a=>a.map(x=>[x,x]);
const setTheme=t=>{t?document.documentElement.dataset.theme=t:delete document.documentElement.dataset.theme};setTheme(localStorage.theme);
async function shrink(f){const b=await createImageBitmap(f),k=Math.min(1,1400/Math.max(b.width,b.height)),c=document.createElement('canvas');c.width=b.width*k;c.height=b.height*k;c.getContext('2d').drawImage(b,0,0,c.width,c.height);return c.toDataURL('image/jpeg',.72)}
/* list */
let F={q:'',crag:'',g1:'',g2:'',p:'',d1:'',d2:'',r:'',s:''},fo=false;
const gOpts=`<option value="">Any</option>`+G.map(g=>`<option>${g}</option>`).join('');
async function vList(){
 const cs=(await all()).sort((a,b)=>(b.date||'').localeCompare(a.date||'')||b.created-a.created);
 const u=k=>[...new Set(cs.flatMap(c=>k=='p'?c.partners||[]:[c.crag]).filter(Boolean))].sort(),sel=(k,id,o)=>`<label class=f>${k}<select name=${id}><option value="">Any</option>${o.map(x=>`<option ${F[id]==x?'selected':''}>${esc(x)}</option>`).join('')}</select></label>`;
 const last=await getM('lastExport'),days=last?(Date.now()-last)/864e5:null;
 $('#v').innerHTML=`<div class="row sp"><h1>Climbs</h1><div class=row><button class="btn i" id=th aria-label="Toggle theme">${ic('theme')}</button><button class="btn i" id=ft aria-label=Filters>${ic('filter')}</button></div></div>
 ${cs.length&&(days===null||days>30)?`<a class=notice href="#/data" style="display:block">${days===null?'You haven’t exported a backup yet.':'Last backup was '+Math.floor(days)+' days ago.'} Tap to export.</a>`:''}
 <input type=search name=q placeholder="Search routes, crags, partners" value="${esc(F.q)}">
 <div class="fl ${fo?'on':''}" id=fl><div class=g2>${sel('Crag','crag',u('c'))}${sel('Partner','p',u('p'))}<label class=f>Grade from<select name=g1>${gOpts}</select></label><label class=f>Grade to<select name=g2>${gOpts}</select></label><label class=f>From<input type=date name=d1 value="${F.d1}"></label><label class=f>To<input type=date name=d2 value="${F.d2}"></label><label class=f>Min rating<select name=r><option value="">Any</option>${[1,2,3,4,5].map(i=>`<option ${F.r==i?'selected':''}>${i}</option>`).join('')}</select></label><label class=f>Style<select name=s><option value="">Any</option>${objO(L.style).map(([k,l])=>`<option value=${k} ${F.s==k?'selected':''}>${l}</option>`).join('')}</select></label></div><button class=btn id=clr>Clear filters</button></div>
 <div id=res style="margin-top:16px"></div>`;
 ['g1','g2'].forEach(k=>$(`[name=${k}]`).value=F[k]);
 const ok=c=>{const q=F.q.toLowerCase();return(!q||[c.name,c.crag,c.country,c.journal,...(c.partners||[])].join(' ').toLowerCase().includes(q))&&(!F.crag||c.crag===F.crag)&&(!F.p||(c.partners||[]).includes(F.p))&&(!F.s||c.style===F.s)&&(!F.r||+c.rating>=+F.r)&&(!F.d1||c.date>=F.d1)&&(!F.d2||c.date<=F.d2)&&(!F.g1||gi(c.grade)>=gi(F.g1))&&(!F.g2||(gi(c.grade)>=0&&gi(c.grade)<=gi(F.g2)))};
 const draw=()=>{const r=cs.filter(ok);$('#res').innerHTML=r.length?r.map(c=>`<a class=card href="#/c/${c.id}">${c.photos?.[0]?`<img src="${c.photos[0]}" alt="" loading=lazy>`:`<div class=ph>${MT}</div>`}<div class=cb><h3>${esc(c.name)}</h3><div class=meta>${pill(c.grade)}${c.crag?`<span>${esc(c.crag)}</span>`:''}<span>${fmtD(c.date)}</span>${stars(+c.rating)}</div></div></a>`).join(''):`<div class=empty>${cs.length?'Nothing matches. Even the guidebook shrugs.':'No routes yet. The rock isn’t going anywhere.'}</div>`};draw();
 $('#v').oninput=e=>{if(e.target.name in F){F[e.target.name]=e.target.value;draw()}};
 $('#ft').onclick=()=>$('#fl').classList.toggle('on',fo=!fo);
 $('#clr').onclick=()=>{Object.keys(F).forEach(k=>F[k]='');vList()};
 $('#th').onclick=()=>{const d=matchMedia('(prefers-color-scheme:dark)').matches,cur=localStorage.theme||(d?'dark':'light'),n=cur=='dark'?'light':'dark';localStorage.theme=n;setTheme(n)};
}
/* detail */
async function vDetail(id){
 const c=await get(id);if(!c){location.hash='#/';return}
 const rows=a=>a.filter(x=>x[1]).map(([k,v])=>`<dt>${k}</dt><dd>${esc(v)}</dd>`).join(''),sec=(t,h)=>h?`<h2>${t}</h2>${h}`:'',tx=t=>t?`<p style="white-space:pre-wrap;margin:0 0 8px">${esc(t)}</p>`:'';
 const P=c.pitches||[];
 $('#v').innerHTML=`<div class="row sp" style="margin-bottom:12px"><a class="btn i" href="#/" aria-label=Back>${ic('back')}</a><div class=row><a class="btn i" href="#/edit/${c.id}" aria-label=Edit>${ic('edit')}</a><button class="btn i d" id=dl aria-label=Delete>${ic('trash')}</button></div></div>
 ${c.photos?.length?`<div class=hero>${c.photos.map(p=>`<img src="${p}" alt="">`).join('')}</div>`:''}
 <h1 style="margin-bottom:8px">${esc(c.name)}</h1><div class=meta style="font-size:15px">${pill(c.grade)}${stars(+c.rating)}<span>${[c.crag,c.country].filter(Boolean).map(esc).join(', ')}</span><span>${fmtD(c.date)}</span></div>
 ${sec('Details',`<dl>${rows([['Style',L.style[c.style]],['Outcome',L.outcome[c.outcome]],['Length',c.length&&c.length+' m'],['Pitches',c.npitch||(P.length||'')],['Time',[c.start,c.finish].filter(Boolean).join(' – ')],['Partners',(c.partners||[]).join(', ')]])}</dl>`)}
 ${P.length?`<h2>Pitches</h2><div class=topo>${[...P].map((p,i)=>[p,i]).reverse().map(([p,i])=>`<div class=tp><div class=row><b class=mono>P${i+1}</b>${pill(p.grade)}<span class="mu mono">${p.length?p.length+' m':''}</span><span class=mu>${esc(p.leader)}</span></div>${p.note?`<p>${esc(p.note)}</p>`:''}</div>`).join('')}</div>`:''}
 ${sec('Conditions',`<dl>${rows([['Weather',c.weather],['Temp',c.temp&&c.temp+'°C'],['Rock',c.rock],['Crowds',L.crowds[c.crowds-1]]])}</dl>${tx(c.approach&&'Approach: '+c.approach)}${tx(c.descent&&'Descent: '+c.descent)}`)}
 ${sec('Gear',`<dl>${rows([['Rack',c.rack],['Ropes',c.ropes],['Fixed gear',c.fixed&&c.fixed+' / 5']])}</dl>${tx(c.issues&&'Issues: '+c.issues)}${tx(c.next&&'Bring next time: '+c.next)}`)}
 ${sec('Journal',tx(c.journal))}`;
 $('#dl').onclick=async()=>{if(confirm('Delete this climb? This can’t be undone.')){await del(c.id);location.hash='#/'}};
}
/* form */
async function vForm(id){
 const c=id?await get(id):{};if(id&&!c){location.hash='#/';return}
 const cs=await all(),pp=[...new Set(cs.flatMap(x=>x.partners||[]))],cr=[...new Set(cs.map(x=>x.crag).filter(Boolean))];
 let partners=[...(c.partners||[])],photos=[...(c.photos||[])];
 const I=(k,l,a='')=>`<label class=f>${l}<input name=${k} value="${esc(c[k])}" ${a}></label>`,T=(k,l)=>`<label class=f>${l}<textarea name=${k}>${esc(c[k])}</textarea></label>`,D=(t,b,o)=>`<details ${o?'open':''}><summary>${t}</summary><div>${b}</div></details>`;
 const pr=(p={})=>`<div class=prow><b>P</b><input class=pg list=grades placeholder=Grade value="${esc(p.grade)}"><input class=pl type=number inputmode=numeric placeholder="m" value="${esc(p.length)}"><button type=button class="btn i x" aria-label=Remove>${ic('x')}</button><input class=pw list=ppl placeholder="Led by" value="${esc(p.leader)}"><input class=pn placeholder="Note (runout, crux…)" value="${esc(p.note)}"></div>`;
 $('#v').innerHTML=`<div class="row sp"><a class="btn i" href="#/" aria-label=Back>${ic('back')}</a><h1 style="margin:0;font-size:22px">${id?'Edit climb':'New climb'}</h1><span style="width:48px"></span></div><form id=f autocomplete=off style="margin-top:12px">
 <datalist id=grades>${G.map(g=>`<option value="${g}">`).join('')}</datalist><datalist id=ppl>${pp.map(p=>`<option value="${esc(p)}">`).join('')}</datalist><datalist id=crags>${cr.map(p=>`<option value="${esc(p)}">`).join('')}</datalist>
 ${D('Basics',I('name','Route name *')+I('crag','Crag / area','list=crags')+I('country','Country')+I('date','Date *','type=date')+`<div class=g2>${I('grade','Grade','list=grades')}${I('length','Length (m)','type=number inputmode=numeric')}</div>${I('npitch','Number of pitches','type=number inputmode=numeric')}<label class=f>Style</label>${chips('style',objO(L.style),c.style)}<label class=f style="margin-top:14px">Outcome</label>${chips('outcome',objO(L.outcome),c.outcome)}<label class=f style="margin-top:14px">Rating</label>${chips('rating',[1,2,3,4,5].map(i=>[i,i]),c.rating)}<div class=g2 style="margin-top:14px">${I('start','Start','type=time')}${I('finish','Finish','type=time')}</div>`,1)}
 ${D('Partners',`<div class=tags id=tags></div><input id=pi list=ppl placeholder="Add partner, press enter">`)}
 ${D('Conditions',`<label class=f>Weather</label>${chips('weather',arrO(L.weather),c.weather)}${I('temp','Temperature (°C)','type=number inputmode=decimal').replace('<label','<label style="margin-top:14px"')}<label class=f>Rock</label>${chips('rock',arrO(L.rock),c.rock)}<label class=f style="margin-top:14px">Crowds</label>${chips('crowds',L.crowds.map((l,i)=>[i+1,l]),c.crowds)}<div style="margin-top:14px">${T('approach','Approach')}${T('descent','Descent')}</div>`)}
 ${D('Gear',I('rack','Rack used')+I('ropes','Rope(s)')+T('issues','Equipment issues (worn fixed gear, bad bolts…)')+T('next','Gear to bring next time')+`<label class=f>Fixed protection quality</label>${chips('fixed',[1,2,3,4,5].map(i=>[i,i]),c.fixed)}`)}
 ${D('Pitch by pitch',`<div id=pl>${(c.pitches||[]).map(pr).join('')}</div><button type=button class=btn id=ap>${ic('plus')}Add pitch</button>`)}
 ${D('Journal',T('journal','The story, lessons learned').replace('<textarea','<textarea style="min-height:200px"'))}
 ${D('Photos',`<label class=btn for=pf style="cursor:pointer">${ic('cam')}Add photos</label><input id=pf type=file accept="image/*" multiple hidden><div class=thumbs id=th></div>`)}
 <div class=bar><button class="btn p" type=submit>Save climb</button></div></form>`;
 if(!id)$('[name=date]').value=new Date().toISOString().slice(0,10);
 const rt=()=>{$('#tags').innerHTML=partners.map((p,i)=>`<span class=tag>${esc(p)}<button type=button data-i=${i} aria-label=Remove>${ic('x','width=18 height=18')}</button></span>`).join('')},rp=()=>{$('#th').innerHTML=photos.map((p,i)=>`<div><img src="${p}" alt=""><button type=button data-i=${i} aria-label=Remove>${ic('x')}</button></div>`).join('')};rt();rp();
 const addP=()=>{const v=$('#pi').value.trim();if(v&&!partners.includes(v))partners.push(v);$('#pi').value='';rt()};
 $('#pi').onkeydown=e=>{if(e.key=='Enter'||e.key==','){e.preventDefault();addP()}};$('#pi').onchange=addP;$('#pi').onblur=addP;
 $('#tags').onclick=e=>{const b=e.target.closest('button');if(b){partners.splice(+b.dataset.i,1);rt()}};
 $('#th').onclick=e=>{const b=e.target.closest('button');if(b){photos.splice(+b.dataset.i,1);rp()}};
 $('#pf').onchange=async e=>{for(const f of e.target.files)try{photos.push(await shrink(f))}catch{toast('Couldn’t read a photo')}e.target.value='';rp()};
 $('#ap').onclick=()=>{$('#pl').insertAdjacentHTML('beforeend',pr());numP()};
 const numP=()=>$$('.prow b').forEach((b,i)=>b.textContent='P'+(i+1));numP();
 $('#pl').onclick=e=>{const b=e.target.closest('.x');if(b){b.parentNode.remove();numP()}};
 const lastR={};$$('input[type=radio]:checked').forEach(i=>lastR[i.name]=i);
 $('#f').addEventListener('click',e=>{const i=e.target;if(i.type=='radio'){if(lastR[i.name]===i){i.checked=false;lastR[i.name]=null}else lastR[i.name]=i}});
 $('#f').onsubmit=async e=>{e.preventDefault();addP();const fd=new FormData(e.target),n={id:c.id||crypto.randomUUID(),created:c.created||Date.now()};
  const nm=$('[name=name]'),dt=$('[name=date]');[nm,dt].forEach(x=>x.classList.toggle('bad',!x.value.trim()));
  if(!nm.value.trim()||!dt.value){$('details').open=true;toast('Route name and date are needed');return}
  'name crag country date grade length npitch style outcome rating start finish weather temp rock crowds approach descent rack ropes issues next fixed journal'.split(' ').forEach(k=>n[k]=(fd.get(k)||'').trim());
  n.partners=partners;n.photos=photos;n.pitches=$$('.prow').map(r=>({grade:$('.pg',r).value.trim(),length:$('.pl',r).value,leader:$('.pw',r).value.trim(),note:$('.pn',r).value.trim()})).filter(p=>p.grade||p.length||p.leader||p.note);
  await put(n);toast('Saved');location.hash='#/c/'+n.id};
}
/* backup */
async function vData(){
 const cs=await all(),last=await getM('lastExport'),ph=cs.reduce((a,c)=>a+(c.photos?.length||0),0);
 $('#v').innerHTML=`<h1>Backup</h1><p class=mu>${cs.length} climbs, ${ph} photos stored on this device only. ${last?'Last export: '+new Date(last).toLocaleDateString()+'.':'Never exported.'}</p>
 <h2>Export</h2><button class="btn p" id=ex style="width:100%">${ic('data')}Export backup</button>
 <h2>Import</h2><div class=chips style="margin-bottom:12px"><label class=chip><input type=radio name=mode value=merge checked><span>Merge</span></label><label class=chip><input type=radio name=mode value=replace><span>Replace all</span></label></div>
 <label class=btn for=im style="width:100%;cursor:pointer">Import backup</label><input id=im type=file accept=".json,application/json" hidden>
 <p class=mu style="font-size:14px;margin-top:16px">Merge keeps your current climbs and adds or updates those in the file. Replace erases everything first.</p>`;
 $('#ex').onclick=async()=>{const b=new Blob([JSON.stringify({app:'pitchbook',v:1,exported:new Date().toISOString(),climbs:cs})],{type:'application/json'}),a=document.createElement('a');a.href=URL.createObjectURL(b);a.download=`pitchbook-${new Date().toISOString().slice(0,10)}.json`;a.click();await setM('lastExport',Date.now());toast('Backup exported');setTimeout(vData,300)};
 $('#im').onchange=async e=>{const f=e.target.files[0];if(!f)return;try{const d=JSON.parse(await f.text());if(d.app!=='pitchbook'||!Array.isArray(d.climbs))throw 0;const rep=$('[name=mode]:checked').value=='replace';if(rep&&!confirm('Replace all current climbs with this backup?'))return;await tx('c','readwrite',s=>{rep&&s.clear();d.climbs.forEach(c=>c.id&&s.put(c))});toast(`Imported ${d.climbs.length} climbs`);vData()}catch{toast('That isn’t a valid backup file')}};
}
/* router */
function route(){const h=location.hash.slice(2).split('/');$$('nav a').forEach(a=>a.classList.toggle('on',a.dataset.n==(h[0]=='data'?'data':'list')));$('#fab').style.display=h[0]=='new'||h[0]=='edit'?'none':'';scrollTo(0,0);
 ({'':vList,c:()=>vDetail(h[1]),new:()=>vForm(),edit:()=>vForm(h[1]),data:vData}[h[0]]||vList)()}
addEventListener('hashchange',route);route();
if('serviceWorker'in navigator)navigator.serviceWorker.register('sw.js');
