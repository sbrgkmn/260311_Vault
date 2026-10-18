import {triangleParameters,triangleStudy,assembleTriangles,trianglePlan,symmetryPlan} from './triangle-vault.mjs';
import {SOURCE_IMAGES,sourceFigure,sourceVisual} from './source-images.mjs';
import {createViewer,diagramBoundsFor} from './viewer.js';
import {meshOBJ} from './generator.mjs';
import {VAULT_CASES as CASES} from './vault-cases.mjs';
import {atlasPlanSVG} from './vault-atlas.mjs';
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
  const ruleText=c.id==='bristol'?'Every triangle gains a centroid. Connect it to all three vertices to form three children. Apply the same centre rule recursively.':c.id==='lincoln'?'The horizontally reflected full-bay seed retains two staggered bosses. Shared edge points divide each triangle into four children.':'Start with the primary quadrant folds. The first application develops the case-specific rays, liernes or compartments; shared intersections form a triangular surface. Later applications split each triangle into four children.';
  document.querySelectorAll('[role=tab]').forEach(b=>{const active=b.dataset.id===c.id;b.setAttribute('aria-selected',active);b.tabIndex=active?0:-1;});
  $('history-case').setAttribute('aria-labelledby','tab-'+c.id);
  $('history-case').innerHTML=`<div class="section-heading"><div><p class="eyebrow">Review p. ${c.page} / ${c.type}</p><h2>${c.name}</h2><span class="badge">${c.symmetry + ' / ' + selected.domain + ' seed'}</span></div><p>One-bay abstraction. A triangular simplification. The same faces developed recursively in plan and 3D.</p></div>
  <div class="historical-grid">${sourceFigure(c.id)}<figure><div class="plan">${trianglePlan(mesh,params,{axes:$('axes').checked})}</div><figcaption>02 / Triangulated plan, n = ${params.depth}. All triangle edges share one line weight. Red: symmetry folds. The same faces appear in 3D.</figcaption></figure><figure><div id="history-model" class="large-model"></div><figcaption>03 / ${mesh.faces.length/3} flat triangles. Black faces / white edges. Drag to orbit.</figcaption></figure></div>
  <div class="history-analysis"><article><h3>Source to seed</h3><p>${c.note}</p></article><article><h3>What remains approximate</h3><p>${SOURCE_IMAGES[c.id].status==='survey'?'Survey comparator available; seed coordinates are not measured or fitted.':SOURCE_IMAGES[c.id].status==='generated'?'Generated top-down reconstruction from a photograph; geometry is interpretive and must not be treated as measured survey data.':'Colour single-bay photograph; display perspective is normalized for comparison, but this is not a measured orthographic plan.'}</p><p>Rise and signed displacement are editable hypotheses. More triangles do not, by themselves, prove a closer match.</p></article></div>
  <div class="triangle-rule"><div class="seed-plan">${symmetryPlan(params)}</div><div><h3>Quadrant folds &rarr; plan divisions &rarr; elevated triangles</h3><p>${ruleText}</p><p>${c.id==='bristol'?'P = (U + V + W) / 3 + vertical lift':'P = (1 - t) U + t V + vertical lift'}<br>Signed lift is scaled by family weight and decay. Existing vertices stay fixed.</p><p>A: weight +1 &nbsp; B: weight -0.35 &nbsp; C: weight +0.5<br>${c.id==='bristol'?'Three children inherit A / B / C families.':'Four children inherit A / B / C families.'}</p><p>One coloured quadrant is the generating patch. Its flat faces are elevated and developed before reflection into the full bay. Lincoln uses a full-bay patch to retain its stagger.</p></div></div>
  <div class="sequence-heading"><span>Five stages / seed 0 to pass 4</span><span>Same triangles in plan and worm's-eye view</span></div><div id="triangle-sequence" class="history-sequence"></div>
  <div class="history-actions"><button id="svg-export">Export triangle plan SVG</button><button id="json-export">Export mesh + parameters</button><button id="obj-export">Export OBJ</button><button id="print-case" disabled>Print case sheet</button><button id="view-reset">Reset view</button></div>
  <details class="paper"><summary>Reference image provenance and publication rights</summary><p>${SOURCE_IMAGES[c.id].rights}</p><p><a href="${SOURCE_IMAGES[c.id].original}" target="_blank" rel="noopener">Original reference</a> / <a href="${SOURCE_IMAGES[c.id].url}" target="_blank" rel="noopener">Source and context</a>. Survey crops isolate the named bay. Selected photographs are cropped and projectively normalized for consistent comparison. Original files are retained. Display orientation aligns the long bay axis vertically, not geographic north. These visual corrections do not create measured orthographic plans.</p></details>`;
  viewer=createViewer($('history-model'),{diagram:true,freeOrbit:true});viewer.setMesh(mesh,diagramBoundsFor([mesh]));
  $('status').textContent=`${c.name} / n = ${params.depth} / ${params.bays} bay(s) / ${selected.faces.length/3} generating-patch triangles / ${mesh.faces.length/3} assembled triangles. Source correspondence remains qualitative.`;
  $('svg-export').onclick=()=>download(trianglePlan(mesh,params,{axes:$('axes').checked}),'image/svg+xml',`${c.id}-triangles-${params.depth}.svg`);
  $('json-export').onclick=()=>download(JSON.stringify({schema:'historical-triangles/1',params,source:SOURCE_IMAGES[c.id],weights:study.weights,inherit:study.inherit,mesh},null,2),'application/json',`${c.id}-triangles-${params.depth}.json`);
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
function safeBuild(){build().catch(error=>{$('status').textContent='Unable to render: '+error.message;console.error(error);});}
function select(id){$('atlas').open=false;params=triangleParameters({id});fillControls();safeBuild();}
$('tabs').innerHTML=CASES.map((c,i)=>`<button role="tab" id="tab-${c.id}" data-id="${c.id}" aria-controls="history-case"><span>${String(i+1).padStart(2,'0')} / ${c.type}</span>${c.name}</button>`).join('');
$('tabs').onclick=e=>{const b=e.target.closest('[data-id]');if(b)select(b.dataset.id);};
$('tabs').onkeydown=e=>{if(!['ArrowLeft','ArrowRight','Home','End'].includes(e.key))return;e.preventDefault();const i=CASES.findIndex(c=>c.id===params.id),next=e.key==='Home'?0:e.key==='End'?CASES.length-1:(i+(e.key==='ArrowRight'?1:CASES.length-1))%CASES.length;select(CASES[next].id);$('tab-'+params.id).focus();};
for(const id of [...ids,'axes'])$(id).addEventListener('change',()=>{if(!$(id).checkValidity()){$(id).reportValidity();return;}safeBuild();});
$('reset').onclick=()=>select(params.id);

function renderAtlas(){
  $('atlas-grid').innerHTML=CASES.map((c,i)=>{
    const study=triangleStudy({id:c.id,depth:1}),p=study.params,seed=study.stages[0],pass=assembleTriangles(study.stages[1],p),source=SOURCE_IMAGES[c.id];
    const sourceLabel=source.status==='survey'?'Bay plan':source.status==='generated'?'Generated plan':'Colour bay';
    const statusLabel=source.status==='survey'?'SURVEY COMPARATOR':source.status==='generated'?'GENERATED RECONSTRUCTION':'COLOUR CEILING PHOTO';
    return `<button class="atlas-card" data-case="${c.id}" aria-label="Open ${c.name} recursive study"><span class="atlas-number">${String(i+1).padStart(2,'0')} / PDF ${c.page}</span><strong>${c.name}</strong><span class="atlas-type">${c.type}</span><div class="atlas-views"><div class="atlas-source">${sourceVisual(c.id)}</div><div>${symmetryPlan(p)}</div><div>${trianglePlan(pass,p,{axes:false,shade:false})}</div></div><span class="atlas-labels"><span>${sourceLabel}</span><span>Seed / symmetry</span><span>Recursion</span></span><span class="atlas-meta">${c.symmetry} · ${seed.faces.length/3} patch faces · ${pass.faces.length/3} bay triangles</span><span class="source-status ${source.status}">${statusLabel}</span></button>`;
  }).join('');
  $('atlas-grid').onclick=e=>{const card=e.target.closest('[data-case]');if(card){select(card.dataset.case);$('case-picker').focus();}};
  $('case-picker').innerHTML=CASES.map((c,i)=>`<option value="${c.id}">${String(i+1).padStart(2,'0')} / ${c.name} / ${c.type}</option>`).join('');
  $('case-picker').onchange=()=>select($('case-picker').value);
  $('show-atlas').onclick=()=>{$('atlas').open=true;$('atlas').scrollIntoView({behavior:'smooth'});};
}
renderAtlas();
$('atlas-export').onclick=()=>download(atlasPlanSVG(),'image/svg+xml','sixteen-vaults-symmetry-atlas.svg');
fillControls();studio=createViewer($('triangle-studio'),{diagram:true,compact:true});await frame();await frame();safeBuild();
window.addEventListener('pagehide',()=>{revision++;viewer?.dispose();studio?.dispose();});window.addEventListener('pageshow',e=>{if(e.persisted)location.reload();});
