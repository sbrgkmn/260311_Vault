import {assembleRhinoQuarter} from './rhino-recursion.mjs';
import {LABELS,VAULT_TYPES,preset,generateFaceStudy,ruleParameters} from './face-rules.mjs';
import {createViewer,diagramBoundsFor} from './viewer.js';
import {meshOBJ} from './generator.mjs';
const $=id=>document.getElementById(id),keys=['rise','decay','depth'];
const colors={A:'#b56d43',B:'#467f92',C:'#a5a24c'};
let viewers=[],finalMesh,recipes,config,timer;
const options=value=>LABELS.map(v=>`<option ${v===value?'selected':''}>${v}</option>`).join('');
function inputValues(){return Object.fromEntries(keys.map(k=>[k,Number($(k).value)]));}
function seedEditor(){
  const mesh=generateFaceStudy(recipes[Number($('variant').value)],{...config,depth:0}).stages[0];
  config.seed=mesh.types.slice();
  $('seed-rules').innerHTML=mesh.types.map((v,i)=>`<label>Face ${i+1}<select data-seed="${i}" aria-label="Seed face ${i+1}">${options(v)}</select></label>`).join('');
  $('seed-map').innerHTML=mesh.types.map((v,i)=>{const p=mesh.faces.slice(i*3,i*3+3).map(j=>[mesh.positions[j*3]*100,100-mesh.positions[j*3+2]*100]);const x=p.reduce((s,v)=>s+v[0],0)/3,y=p.reduce((s,v)=>s+v[1],0)/3;return `<g data-face="${i}" role="button" tabindex="0" aria-label="Cycle rule for face ${i+1}, currently ${v}"><polygon points="${p.map(v=>v.join(',')).join(' ')}" fill="${colors[v]}"/><text x="${x}" y="${y}">${i+1}</text></g>`;}).join('');
}
function editor(){
  $('rule-rows').innerHTML=LABELS.map((label,i)=>`<tr><th class="family-${label}">${label}</th><td><input aria-label="Rule ${label} edge position" data-rule="${i}" data-key="t" type="number" min="0.2" max="0.8" step="0.01" value="${config.rules[i].t}"></td><td><input aria-label="Rule ${label} signed lift" data-rule="${i}" data-key="lift" type="number" min="-0.5" max="0.5" step="0.001" value="${config.rules[i].lift}"></td>${config.inherit[i].map((v,j)=>`<td><select aria-label="Rule ${label} ${j===3?'centre':'corner '+(j+1)} child" data-parent="${i}" data-child="${j}">${options(v)}</select></td>`).join('')}</tr>`).join('');
  seedEditor();
}
function reset(){clearTimeout(timer);config=preset($('type').value,Number($('variant').value)? .6:.5);config.depth=3;for(const k of keys)$(k).value=config[k];editor();build();}
function build(){
  try{
    config=ruleParameters({...config,...inputValues(),type:$('type').value});
    keys.forEach(k=>$(k+'-value').textContent=config[k].toFixed(k==='depth'?0:2));
    $('variant-field').hidden=config.type!=='rhino';
    $('type-note').textContent=VAULT_TYPES.find(v=>v.id===config.type).note;
    const recipe=recipes[Number($('variant').value)],series=generateFaceStudy(recipe,{...config,depth:5});
    const quarter=series.stages[config.depth],assembly=$('assembly').value;
    const assemble=m=>assembly==='quarter'?m:assembleRhinoQuarter(m,assembly==='bay'?1:2);
    const stages=series.stages.slice(1).map(assemble);finalMesh=assemble(quarter);
    viewers.forEach(v=>v.dispose());viewers=[];
    const bounds=diagramBoundsFor([...stages,finalMesh]);
    const show=(el,mesh,interactive=false,families=false)=>{const v=createViewer(el,{diagram:true,compact:!interactive,freeOrbit:interactive,faceFamilies:families});v.setMesh(mesh,families?diagramBoundsFor(series.stages):bounds);viewers.push(v);};
    show($('source'),quarter,true,true);show($('generated'),finalMesh,true);
    document.querySelectorAll('.selected-step').forEach(el=>el.textContent=config.depth?`Step ${config.depth}`:'Seed');
    $('sheet').replaceChildren();stages.forEach((mesh,i)=>{const fig=document.createElement('figure');fig.innerHTML=`<div class="model"></div><figcaption><span>0${i+1}</span><span>${mesh.faces.length/3} faces</span></figcaption>`;$('sheet').append(fig);show(fig.firstElementChild,mesh);});
    const counts=LABELS.map(v=>`${v}: ${quarter.types.filter(t=>t===v).length}`).join(' / ');
    $('error').textContent=`Quarter families ${counts}. Assembled: ${finalMesh.faces.length/3} triangles. Shared edges use one welded vertex.`;
    history.replaceState(null,'','?'+new URLSearchParams({type:config.type,variant:$('variant').value,assembly,config:JSON.stringify(config)}));
  }catch(error){$('error').textContent=error.message;}
}
function schedule(){clearTimeout(timer);timer=setTimeout(build,180);}
try{
  const response=await fetch('./assets/rhino-recursion.json');if(!response.ok)throw Error('Cannot load reference seed');recipes=await response.json();
  $('type').innerHTML=VAULT_TYPES.map(v=>`<option value="${v.id}">${v.name}</option>`).join('');
  const query=new URLSearchParams(location.search);
  if(['0','1'].includes(query.get('variant')))$('variant').value=query.get('variant');
  if(VAULT_TYPES.some(v=>v.id===query.get('type')))$('type').value=query.get('type');
  config=preset($('type').value,Number($('variant').value)? .6:.5);config.depth=3;
  try{if(query.has('config'))config=ruleParameters(JSON.parse(query.get('config')));}catch{}
  $('type').value=config.type;
  for(const k of keys){if(query.has(k)&&Number.isFinite(Number(query.get(k))))config[k]=Number(query.get(k));$(k).value=config[k];}
  for(const k of ['t','lift'])if(query.has(k)&&Number.isFinite(Number(query.get(k))))config.rules[0][k]=Number(query.get(k));
  if(['quarter','bay','vault'].includes(query.get('assembly')))$('assembly').value=query.get('assembly');
  config=ruleParameters(config);editor();build();
  keys.forEach(k=>$(k).addEventListener('input',()=>{$(k+'-value').textContent=$(k).value;schedule();}));
  $('rule-rows').addEventListener('change',event=>{const el=event.target;if(el.dataset.rule!==undefined){if(!el.checkValidity()){el.reportValidity();return;}config.rules[Number(el.dataset.rule)][el.dataset.key]=Number(el.value);}else if(el.dataset.parent!==undefined)config.inherit[Number(el.dataset.parent)][Number(el.dataset.child)]=el.value;build();});
  $('seed-rules').addEventListener('change',event=>{const i=Number(event.target.dataset.seed);config.seed[i]=event.target.value;seedEditor();build();});
  const cycleFace=event=>{const el=event.target.closest('[data-face]');if(!el)return;const i=Number(el.dataset.face);config.seed[i]=LABELS[(LABELS.indexOf(config.seed[i])+1)%3];seedEditor();build();};
  $('seed-map').addEventListener('click',cycleFace);$('seed-map').addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();cycleFace(e);}});
  $('type').addEventListener('change',reset);$('variant').addEventListener('change',reset);$('reset').addEventListener('click',reset);$('assembly').addEventListener('change',build);
  $('reset-view').addEventListener('click',()=>viewers.slice(0,2).forEach(v=>v.reset()));
  $('obj').addEventListener('click',()=>{const url=URL.createObjectURL(new Blob([meshOBJ(finalMesh)],{type:'text/plain'}));const a=document.createElement('a');a.href=url;a.download=`${config.type}-step-${config.depth}.obj`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);});
}catch(error){$('error').textContent=error.message;}
window.addEventListener('pagehide',()=>viewers.forEach(v=>v.dispose()));
window.addEventListener('pageshow',e=>{if(e.persisted)location.reload();});
