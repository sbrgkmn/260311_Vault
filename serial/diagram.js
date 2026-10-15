import { generateSeries } from './generator.mjs';
import { createViewer, diagramBoundsFor } from './viewer.js';

const query = new URLSearchParams(location.search);
const config = { family:'stellar', depth:5 };
for (const key of ['rise','fold','decay','bays']) if(query.has(key)) config[key] = query.get(key);
const viewers=[];
try {
  const {params,stages}=generateSeries(config);
  const meshes=stages.slice(1,6), bounds=diagramBoundsFor(meshes);
  document.querySelector('#sheet').innerHTML=meshes.map((mesh,i)=>`<figure><div class="model" id="model-${i}" role="group" aria-label="Worm's-eye view of recursion step ${i+1}"></div><figcaption><span class="step-number">0${i+1}</span><span class="step-faces">${(mesh.faces.length/3).toLocaleString('en-US')} FACES</span></figcaption></figure>`).join('');
  meshes.forEach((mesh,i)=>{
    const viewer=createViewer(document.querySelector(`#model-${i}`),{compact:true,diagram:true});
    viewer.setMesh(mesh,bounds);
    viewers.push(viewer);
  });
  const state={family:'stellar',rise:params.rise,fold:params.fold,decay:params.decay,bays:params.bays};
  history.replaceState(null,'',`${location.pathname}?${new URLSearchParams(state)}`);
  document.querySelector('#study-link').href=`./?${new URLSearchParams({...state,assembly:'vault',step:5})}`;
  document.querySelector('#parameters').textContent=`${params.bays} BAY${params.bays===1?'':'S'} / IDENTICAL SCALE / PASSES 1-5`;
  document.querySelector('#export-sheet').disabled=false;
  document.querySelector('#export-sheet').addEventListener('click',()=>{
    const canvas=document.createElement('canvas');
    canvas.width=3600; canvas.height=1480;
    const ctx=canvas.getContext('2d');
    ctx.fillStyle='#fff'; ctx.fillRect(0,0,canvas.width,canvas.height);
    ctx.fillStyle='#111'; ctx.font='54px Palatino Linotype,serif'; ctx.fillText('Tierceron II',80,100);
    ctx.font='21px Consolas,monospace'; ctx.fillText("WORM'S-EYE / RECURSION 01-05 / SHARED ORTHOGRAPHIC PROJECTION",80,153);
    ctx.fillRect(80,195,3440,2);
    meshes.forEach((mesh,i)=>{
      const source=document.querySelector(`#model-${i} canvas`), x=80+i*696;
      const ratio=Math.min(656/source.width,1070/source.height);
      const w=source.width*ratio,h=source.height*ratio;
      ctx.drawImage(source,x+(656-w)/2,220+(1070-h)/2,w,h);
      ctx.fillStyle='#ccc'; ctx.fillRect(x,1300,656,1);
      ctx.fillStyle='#111'; ctx.font='38px Palatino Linotype,serif'; ctx.fillText(`0${i+1}`,x,1350);
      ctx.font='17px Consolas,monospace'; ctx.fillText(`${(mesh.faces.length/3).toLocaleString('en-US')} FACES`,x+410,1347);
    });
    ctx.font='18px Consolas,monospace'; ctx.fillText(`FA / FB / FC / FD / FE     ${params.bays} BAYS     BLACK SURFACE / WHITE EDGES`,80,1430);
    const link=document.createElement('a'); link.download='tierceron-ii-five-steps.png'; link.href=canvas.toDataURL('image/png'); link.click();
  });
  window.addEventListener('pagehide',()=>viewers.forEach(v=>v.dispose()));
  window.addEventListener('pageshow',event=>{if(event.persisted)location.reload();});
} catch(error) {
  viewers.forEach(v=>v.dispose());
  document.querySelector('#status').textContent=`Unable to draw the sheet: ${error.message}`;
}
