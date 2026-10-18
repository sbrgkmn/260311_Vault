import {CASES,EXPERIMENTS,caseConfig,matrixSamples,referencePath,editorURL,ruleGlyph,seedGlyph} from './research.mjs';
import {generateFaceStudy} from './face-rules.mjs';
import {generateRhinoStudy,assembleRhinoQuarter} from './rhino-recursion.mjs';
import {createViewer,diagramBoundsFor} from './viewer.js';

const $=id=>document.getElementById(id);
const nextFrame=()=>new Promise(resolve=>requestAnimationFrame(resolve));
let recipes,studio,interactive,revision=0,active='rhino';
const images=new Map();
const tabs=[...CASES.map(c=>({id:c.id,name:c.name})),{id:'matrix',name:'Parametric exploration'}];
const query=new URLSearchParams(location.search);
if(tabs.some(t=>t.id===query.get('case')))active=query.get('case');
if(['1','2','3','4','5'].includes(query.get('depth')))$('depth').value=query.get('depth');
const depth=()=>Number($('depth').value);
const generated=(config)=>generateFaceStudy(recipes[1],config);
const assemble=mesh=>assembleRhinoQuarter(mesh,2);

function renderImage(mesh,bounds){
  studio.setMesh(mesh,bounds);studio.reset();
  return $('render-studio').querySelector('canvas').toDataURL('image/png');
}
function metrics(){
  const recipe=recipes[1],p={...caseConfig('rhino',5),rise:recipe.sourceRise};
  const measured=generateRhinoStudy(recipe,{},true).stages.at(-1),model=generated(p).stages.at(-1);
  let sum=0,max=0;
  for(let i=0;i<model.positions.length;i+=3){const distance=Math.hypot(...[0,1,2].map(k=>model.positions[i+k]-measured.positions[i+k]));sum+=distance*distance;max=Math.max(max,distance);}
  return `Digital calibration at source rise: ${model.positions.length/3} corresponding quarter vertices; RMS ${(Math.sqrt(sum/(model.positions.length/3))).toExponential(2)}, max ${max.toExponential(2)} (half-span = 1). This checks the recovered recipe, not building accuracy.`;
}
async function showCase(id,token){
  const c=CASES.find(c=>c.id===id),config=caseConfig(id,depth()),series=generated({...config,depth:5});
  const meshes=series.stages.slice(1).map(assemble),bounds=diagramBoundsFor(meshes);
  const model=assemble(series.stages[depth()]);
  $('case-panel').innerHTML=`<div class="section-heading"><div><p class="eyebrow">Case study / ${String(CASES.indexOf(c)+1).padStart(2,'0')}</p><h2>${c.name}</h2><span class="badge">${c.tag}</span></div><p>${c.description}</p></div>
  <div class="comparison"><figure><img class="reference-image" src="${referencePath(c)}" alt="${c.name}: two views of the supplied Phase II reference model"><figcaption>01 / Reference sheet, p. ${c.page}<a href="${referencePath(c)}" target="_blank" rel="noopener">View full sheet</a></figcaption></figure><figure><div id="case-model" class="large-model"></div><figcaption>02 / Generated, recursion ${depth()}<a href="${editorURL(config)}" class="edit-link">Edit this model</a></figcaption></figure></div>
  <div class="audit"><div><h3>Comparison / what is supported</h3><p>${c.comparison}</p></div><div><h3>Still to establish</h3><p>${c.missing}</p><p>Reference images are not camera-registered or dimensioned. No visual similarity score is claimed.</p></div></div>
  <div class="grammar-band"><div>${seedGlyph(series.stages[0])}<p>Quarter seed<br>${series.stages[0].faces.length/3} triangles</p></div><div>${ruleGlyph(config)}</div><div><h3>03 / Subdivision grammar</h3><p>One triangle becomes four. A/B/C above = parent family; the letters inside set each child's rule for the next pass. t locates each edge point; h moves it vertically by h &times; current edge length &times; decay<sup>step - 1</sup>.</p><p>Seed: ${config.seed.join(' ')} / rise ${config.rise.toFixed(2)} / decay ${config.decay.toFixed(2)}. Four reflected quarters per bay. Shared-edge values are averaged; all original vertices remain fixed.</p><p>Plan glyphs show the local rule, not the resulting 3D elevation.</p></div></div>
  <div class="sequence-heading"><span>04 / Five recursive passes</span><span>Fixed scale within this sequence</span></div><div id="sequence" class="sequence"></div>
  ${id==='rhino'?`<p class="legend">${metrics()}</p>`:''}`;
  interactive=createViewer($('case-model'),{diagram:true,freeOrbit:true});interactive.setMesh(model,bounds);
  for(let i=0;i<meshes.length;i++){
    if(token!==revision)return;
    const key=`case-${id}-${i}`,src=images.get(key)||renderImage(meshes[i],bounds);images.set(key,src);
    const figure=document.createElement('figure');figure.innerHTML=`<img src="${src}" alt="${c.name}, recursion ${i+1}, worm's-eye view"><figcaption>Pass ${i+1} / ${meshes[i].faces.length/3} triangles</figcaption>`;$('sequence').append(figure);
    await nextFrame();
  }
  if(token===revision)$('status').textContent='Drag the generated model to orbit; wheel to zoom. Reference and generated views are not registered.';
}
async function showMatrix(token){
  const samples=matrixSamples(depth()),items=[];
  // One offscreen WebGL renderer produces all 24 static images, avoiding context limits.
  for(const sample of samples){
    if(token!==revision)return;
    const series=generated(sample.config);items.push({...sample,seed:series.stages[0],mesh:assemble(series.stages.at(-1))});
    await nextFrame();
  }
  const bounds=diagramBoundsFor(items.map(s=>s.mesh));
  $('matrix').replaceChildren();
  for(const c of CASES){
    if(token!==revision)return;
    const row=document.createElement('section');row.className='matrix-row';
    const group=items.filter(s=>s.case===c.id);
    row.innerHTML=`<div class="row-title">${seedGlyph(group[0].seed)}<div><h3>${c.name}</h3><p>${c.tag} / seed ${group[0].config.seed.join(' ')} / rise 2.19 / decay 1.00 / depth ${depth()}</p></div></div><div class="samples"></div>`;$('matrix').append(row);
    for(const sample of group){
      if(token!==revision)return;
      const exp=EXPERIMENTS.find(e=>e.id===sample.experiment),key=`matrix-${depth()}-${sample.id}`;
      const src=images.get(key)||renderImage(sample.mesh,bounds);images.set(key,src);
      const card=document.createElement('a');card.className='sample';card.href=editorURL(sample.config);card.setAttribute('aria-label',`${c.name}, ${exp.name}: open exact parameters in rule editor`);
      card.innerHTML=`<h4>${sample.id} / ${exp.name}</h4><img src="${src}" alt="${c.name}, ${exp.name}, ${sample.mesh.faces.length/3} triangles"><div class="glyph">${ruleGlyph(sample.config)}</div><p>${exp.note}<br>${sample.mesh.faces.length/3} triangles / n = ${depth()}</p>`;row.querySelector('.samples').append(card);
      $('status').textContent=`Rendering matrix: ${items.indexOf(sample)+1} / 24`;
      await nextFrame();
    }
  }
  if(token===revision)$('status').textContent='24 / 24 variations ready. Shared camera scale across all samples; glyphs and exported parameters describe the actual generated models.';
}
async function show(id){
  active=id;const token=++revision;
  interactive?.dispose();interactive=null;
  $('case-panel').hidden=id==='matrix';$('matrix-panel').hidden=id!=='matrix';
  document.querySelectorAll('[role=tab]').forEach(button=>{const selected=button.dataset.id===id;button.setAttribute('aria-selected',selected);button.tabIndex=selected?0:-1;});
  const panel=$(id==='matrix'?'matrix-panel':'case-panel');panel.setAttribute('aria-labelledby','tab-'+id);
  $('status').textContent='Generating diagrams...';$('print').disabled=true;
  history.replaceState(null,'','?'+new URLSearchParams({case:id,depth:depth()}));
  try{if(id==='matrix')await showMatrix(token);else await showCase(id,token);}catch(error){if(token===revision)$('status').textContent='Unable to render: '+error.message;console.error(error);}
  finally{if(token===revision)$('print').disabled=false;}
}
function downloadParameters(){
  const samples=active==='matrix'?matrixSamples(depth()):[{case:active,experiment:'baseline',config:caseConfig(active,depth())}];
  const data={schema:'vault-research-atlas/1',assembly:'two bays',recipeVariant:1,evidence:'Typological hypotheses; only rhino baseline digitally calibrated. Historical building attribution pending.',samples};
  const url=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:'application/json'}));
  const a=document.createElement('a');a.href=url;a.download=`vault-${active}-depth-${depth()}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
}
try{
  const response=await fetch('./assets/rhino-recursion.json');if(!response.ok)throw Error('Reference recipe not available');recipes=await response.json();
  $('tabs').innerHTML=tabs.map((t,i)=>`<button id="tab-${t.id}" role="tab" data-id="${t.id}" aria-controls="${t.id==='matrix'?'matrix-panel':'case-panel'}" aria-selected="false" tabindex="-1"><span>${i<4?'CASE 0'+(i+1):'4 SEEDS / 24 SAMPLES'}</span>${t.name}</button>`).join('');
  studio=createViewer($('render-studio'),{diagram:true,compact:true});await nextFrame();await nextFrame();
  $('tabs').addEventListener('click',event=>{const button=event.target.closest('[role=tab]');if(button)show(button.dataset.id);});
  $('tabs').addEventListener('keydown',event=>{
    if(!['ArrowLeft','ArrowRight','Home','End'].includes(event.key))return;event.preventDefault();
    let index=tabs.findIndex(t=>t.id===active);
    index=event.key==='Home'?0:event.key==='End'?tabs.length-1:(index+(event.key==='ArrowRight'?1:-1)+tabs.length)%tabs.length;
    $('tab-'+tabs[index].id).focus();show(tabs[index].id);
  });
  $('depth').addEventListener('change',()=>{images.clear();show(active);});
  $('export').addEventListener('click',downloadParameters);$('print').addEventListener('click',()=>window.print());
  await show(active);
}catch(error){$('status').textContent='Unable to load study: '+error.message;console.error(error);}
window.addEventListener('pagehide',()=>{revision++;interactive?.dispose();studio?.dispose();});
window.addEventListener('pageshow',event=>{if(event.persisted)location.reload();});
