import {triangleParameters,triangleStudy,assembleTriangles,trianglePlan} from './triangle-vault.mjs';
import {SOURCE_IMAGES} from './source-images.mjs';
import {createViewer,diagramBoundsFor} from './viewer.js';
import {meshOBJ} from './generator.mjs';
import {VAULT_CASES as CASES} from './vault-cases.mjs';
import {VAULT_TYPES,TYPE_BY_CASE,typeDiagram,typeAtlasSVG} from './vault-types.mjs';
import {atlasPlanSVG} from './vault-atlas.mjs';
const photoResponse=await fetch('./ceiling-photos.json');
if(!photoResponse.ok)throw new Error('Unable to load ceiling photo credits');
const PHOTOS=await photoResponse.json();
const escapeHTML=s=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('"','&quot;');
function ceilingFigure(id){
  const c=CASES.find(c=>c.id===id),p=PHOTOS[id];
  const visual=id==='gloucester-net'?`<svg class="photo-crop" viewBox="290 220 710 350" preserveAspectRatio="xMidYMid slice" role="img" aria-label="Gloucester choir ceiling crop"><image href="./assets/history/${p.file}" width="1280" height="850"/></svg>`:`<img src="./assets/history/${p.file}" alt="${escapeHTML(c.name+' ceiling')}" loading="lazy">`;
  return `<figure class="ceiling-figure" data-ceiling-id="${id}"><a class="${['lincoln'].includes(id)?'rotated-photo':''}" href="./assets/history/${p.file}" target="_blank" rel="noopener" title="Display cropped${id==='lincoln'?' and rotated 90 degrees':''}; click for original" aria-label="Original photograph: ${c.name}">${visual}</a><figcaption><strong>${c.name}</strong><span><a href="${escapeHTML(p.url)}" target="_blank" rel="noopener">${escapeHTML(p.credit)}</a> · <a href="${escapeHTML(p.licenseUrl||p.url)}" target="_blank" rel="noopener">${escapeHTML(p.license)}</a></span></figcaption></figure>`;
}
const $=id=>document.getElementById(id),query=new URLSearchParams(location.search),ids=['depth','bays','aspect','rise','split','lift','decay'];
let params=triangleParameters(Object.fromEntries(query)),viewer,studio,revision=0;
// Old rounded-envelope URLs do not describe this seed system; retain only their selected site.
if(!query.has('lift'))params=triangleParameters({id:params.id});
const frame=()=>new Promise(resolve=>requestAnimationFrame(resolve));
function fillControls(){for(const key of ids)$(key).value=params[key];}
function download(content,type,name){const url=URL.createObjectURL(new Blob([content],{type}));const a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
async function build(){
  const token=++revision;viewer?.dispose();
  params=triangleParameters({...params,...Object.fromEntries(ids.map(k=>[k,Number($(k).value)]))});
  const c=CASES.find(c=>c.id===params.id),study=triangleStudy({...params,depth:4}),selected=study.stages[params.depth];
  const mesh=assembleTriangles(selected,params);
  document.querySelectorAll('[role=tab]').forEach(b=>{const active=b.dataset.id===c.id;b.setAttribute('aria-selected',active);b.tabIndex=active?0:-1;});
  $('history-case').setAttribute('aria-labelledby','tab-'+c.id);
  $('history-case').innerHTML=`<div class="section-heading"><div><h2>${c.name}</h2><span class="badge">${TYPE_BY_CASE[c.id].name}</span></div></div>
  <div class="historical-grid">${ceilingFigure(c.id)}<figure><div class="plan">${trianglePlan(mesh,params,{axes:$('axes').checked})}</div><figcaption>Plan / n = ${params.depth}</figcaption></figure><figure><div id="history-model" class="large-model"></div><figcaption>${mesh.faces.length/3} triangles / drag to orbit</figcaption></figure></div>
  <div class="sequence-heading"><span>Recursion / 0–4</span></div><div id="triangle-sequence" class="history-sequence"></div>
  <div class="history-actions"><button id="svg-export">SVG</button><button id="json-export">JSON</button><button id="obj-export">OBJ</button><button id="print-case" disabled>Print</button><button id="view-reset">Reset view</button></div>
  <details class="paper"><summary>Model notes</summary><p>${c.note}</p><p>Analytical model; not a measured reconstruction.</p></details>`;
  viewer=createViewer($('history-model'),{diagram:true,freeOrbit:true});viewer.setMesh(mesh,diagramBoundsFor([mesh]));
  $('status').textContent=`${c.name} / n = ${params.depth} / ${mesh.faces.length/3} triangles`;
  $('svg-export').onclick=()=>download(trianglePlan(mesh,params,{axes:$('axes').checked}),'image/svg+xml',`${c.id}-triangles-${params.depth}.svg`);
  $('json-export').onclick=()=>download(JSON.stringify({schema:'historical-triangles/1',params,source:PHOTOS[c.id],earlierComparator:SOURCE_IMAGES[c.id],weights:study.weights,inherit:study.inherit,mesh},null,2),'application/json',`${c.id}-triangles-${params.depth}.json`);
  $('obj-export').onclick=()=>download(meshOBJ(mesh),'text/plain',`${c.id}-triangles-${params.depth}.obj`);
  $('print-case').onclick=()=>window.print();$('view-reset').onclick=()=>viewer.reset();
  history.replaceState(null,'','?'+new URLSearchParams(params));
  $('case-picker').value=c.id;
  const sequenceParams={...params,bays:1},meshes=study.stages.map(s=>assembleTriangles(s,sequenceParams)),bounds=diagramBoundsFor(meshes);
  for(let n=0;n<meshes.length;n++){
    if(token!==revision)return;
    studio.setMesh(meshes[n],bounds);studio.reset();
    const img=$('triangle-studio').querySelector('canvas').toDataURL('image/png');
    const figure=document.createElement('figure');figure.innerHTML=`<img class="step-model" src="${img}" alt="${c.name} flat triangle model, recursion ${n}"><div class="step-plan">${trianglePlan(meshes[n],sequenceParams,{axes:false,shade:false})}</div><figcaption>${n===0?'Seed':'Pass '+n} / ${meshes[n].faces.length/3} faces</figcaption>`;$('triangle-sequence').append(figure);
    await frame();
  }
  if(token===revision)$('print-case').disabled=false;
}
async function safeBuild(){try{if(!$('study-panel').open)return;if(!studio){studio=createViewer($('triangle-studio'),{diagram:true,compact:true});await frame();await frame();}if($('study-panel').open)await build();}catch(error){$('status').textContent='Unable to render: '+error.message;console.error(error);}}
function select(id){const panel=$('study-panel'),wasOpen=panel.open;params=triangleParameters({id});fillControls();panel.open=true;if(wasOpen)safeBuild();panel.scrollIntoView({behavior:'smooth'});}
$('tabs').innerHTML=CASES.map((c,i)=>`<button role="tab" id="tab-${c.id}" data-id="${c.id}" aria-controls="history-case"><span>${String(i+1).padStart(2,'0')} / ${c.type}</span>${c.name}</button>`).join('');
$('tabs').onclick=e=>{const b=e.target.closest('[data-id]');if(b)select(b.dataset.id);};
$('tabs').onkeydown=e=>{if(!['ArrowLeft','ArrowRight','Home','End'].includes(e.key))return;e.preventDefault();const i=CASES.findIndex(c=>c.id===params.id),next=e.key==='Home'?0:e.key==='End'?CASES.length-1:(i+(e.key==='ArrowRight'?1:CASES.length-1))%CASES.length;select(CASES[next].id);$('tab-'+params.id).focus();};
for(const id of [...ids,'axes'])$(id).addEventListener('change',()=>{if(!$(id).checkValidity()){$(id).reportValidity();return;}safeBuild();});
$('reset').onclick=()=>select(params.id);


function renderAtlas(){
  $('type-filters').innerHTML=`<button data-family="all" aria-pressed="true">All types</button>`+VAULT_TYPES.map((t,i)=>`<button data-family="${t.id}" aria-pressed="false">0${i+1} / ${t.name}</button>`).join('');
  $('type-filters').onclick=e=>{const b=e.target.closest('[data-family]');if(!b)return;document.querySelectorAll('[data-family]').forEach(el=>el.setAttribute('aria-pressed',el===b));document.querySelectorAll('.type-section').forEach(el=>el.hidden=b.dataset.family!=='all'&&el.dataset.type!==b.dataset.family);};
  $('atlas-grid').innerHTML=VAULT_TYPES.map((t,i)=>`<section class="type-section" data-type="${t.id}" aria-labelledby="type-${t.id}"><div class="type-heading"><h2 id="type-${t.id}"><span class="type-index">0${i+1}</span> ${t.name}</h2><span class="type-symmetry">${t.id==='staggered'?'C2 / half-turn':'D2 / two mirrors'}</span><button data-case="${t.representative}">Study ↗</button></div><div class="type-content">${ceilingFigure(t.representative)}<div class="type-diagrams">${[['symmetry','01 / Primary'],['directions','02 / Secondary'],['recursion','03 / Triangulation']].map(([mode,label])=>`<figure>${typeDiagram(t.id,mode)}<figcaption>${['lierne','fan','staggered'].includes(t.id)&&mode==='recursion'?'03 / Tertiary':label}</figcaption></figure>`).join('')}</div></div></section>`).join('');
  $('atlas-grid').onclick=e=>{const card=e.target.closest('[data-case]');if(card){select(card.dataset.case);$('case-picker').focus();}};
  $('case-picker').innerHTML=VAULT_TYPES.map(t=>`<optgroup label="${t.name}">${t.cases.map(id=>{const c=CASES.find(c=>c.id===id);return `<option value="${c.id}">${c.name} / ${c.type}</option>`;}).join('')}</optgroup>`).join('');
  $('case-picker').onchange=()=>select($('case-picker').value);
  $('show-atlas').onclick=()=>{$('type-filters').querySelector('[data-family=all]').click();$('atlas').open=true;$('atlas').scrollIntoView({behavior:'smooth'});};
}
renderAtlas();
$('atlas-export').onclick=()=>download(typeAtlasSVG(),'image/svg+xml','six-vault-types.svg');
$('case-export').onclick=()=>download(atlasPlanSVG(),'image/svg+xml','sixteen-vaults-symmetry-atlas.svg');
fillControls();
$('study-panel').addEventListener('toggle',()=>{if($('study-panel').open){if(!viewer)safeBuild();}else{revision++;viewer?.dispose();studio?.dispose();viewer=undefined;studio=undefined;}});
window.addEventListener('pagehide',()=>{revision++;viewer?.dispose();studio?.dispose();});window.addEventListener('pageshow',e=>{if(e.persisted)location.reload();});
