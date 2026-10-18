import {atlasPlanSVG} from './vault-atlas.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import {triangleParameters,triangleStudy,assembleTriangles,trianglePlan,symmetryPlan} from './triangle-vault.mjs';
import {VAULT_CASES} from './vault-cases.mjs';
import {SOURCE_IMAGES} from './source-images.mjs';
const edgesOf=mesh=>{const edges=new Map();for(let i=0;i<mesh.faces.length;i+=3)for(let e=0;e<3;e++){const a=mesh.faces[i+e],b=mesh.faces[i+(e+1)%3],k=[a,b].sort((a,b)=>a-b).join(':');edges.set(k,(edges.get(k)||0)+1);}return edges;};
for(const {id} of VAULT_CASES)test(`${id}: triangular disk, fixed parents and full coverage`,()=>{
  const {params,stages}=triangleStudy({id,depth:4,split:.35});
  for(let n=0;n<stages.length;n++){
    const m=stages[n],edges=edgesOf(m),vertices=m.positions.length/3;
    assert.ok(m.positions.every(Number.isFinite));assert.equal(vertices-edges.size+m.faces.length/3,1);
    assert.ok([...edges.values()].every(count=>count===1||count===2));assert.equal(m.smoothNormals,false);assert.equal(m.ribSegments,undefined);
    if(n>1)assert.equal(m.faces.length,stages[n-1].faces.length*(id==='bristol'?3:4));
    let area=0;for(let i=0;i<m.faces.length;i+=3){const [a,b,c]=m.faces.slice(i,i+3).map(j=>m.positions.slice(j*3,j*3+3));const cross=(b[0]-a[0])*(c[2]-a[2])-(b[2]-a[2])*(c[0]-a[0]);assert.ok(cross<0);area-=cross/2;}
    assert.ok(Math.abs(area-params.aspect*(id==='lincoln'?4:1))<1e-8);
    if(n)assert.deepEqual(m.positions.slice(0,stages[n-1].positions.length),stages[n-1].positions);
  }
});
test('Exeter develops two primary folds into six fan triangles',()=>{
  const {params,stages:[s,developed]}=triangleStudy({id:'exeter',depth:1});
  assert.equal(s.faces.length/3,2);assert.equal(developed.faces.length/3,6);
  assert.equal(params.bays,1);assert.equal(params.aspect,1.6);
});
test('mirrored assembly welds seams and keeps both reflections',()=>{
  for(const {id} of VAULT_CASES.filter(c=>c.id!=='lincoln')){
    const {params,stages}=triangleStudy({id,depth:2,bays:3}),m=assembleTriangles(stages.at(-1),params);
    const key=p=>p.map(v=>(Math.abs(v)<1e-7?0:v).toFixed(7)).join(':');
    const points=new Set(Array.from({length:m.positions.length/3},(_,i)=>key(m.positions.slice(i*3,i*3+3))));
    assert.equal(points.size,m.positions.length/3);
    for(let i=0;i<m.positions.length;i+=3){const [x,y,z]=m.positions.slice(i,i+3);assert.ok(points.has(key([-x,y,z])));assert.ok(points.has(key([x,y,-z])));}
    assert.ok([...edgesOf(m).values()].every(count=>count===1||count===2));
  }
});
test('signed displacement reverses first-pass offsets and zero lift is planar interpolation',()=>{
  const a=triangleStudy({lift:.1,depth:1}).stages[1],b=triangleStudy({lift:-.1,depth:1}).stages[1],z=triangleStudy({lift:0,depth:1}).stages[1];
  for(let i=0;i<a.positions.length;i++)assert.ok(Math.abs((a.positions[i]+b.positions[i])/2-z.positions[i])<1e-10);
  assert.ok(a.moves.some(m=>m.offset>0));assert.ok(a.moves.some(m=>m.offset<0));
});
test('plan serializes the same triangle edges and clamps unsafe input',()=>{
  const {params,stages}=triangleStudy({depth:1});const m=assembleTriangles(stages[1],params),svg=trianglePlan(m,params,{axes:false});
  assert.equal(Number(svg.match(/data-edge-count="(\d+)"/)[1]),edgesOf(m).size);assert.equal((svg.match(/data-edge-count="\d+" d="([^"]+)"/)[1].match(/M/g)||[]).length,edgesOf(m).size);
  assert.equal(triangleParameters({depth:999,aspect:100}).depth,4);assert.equal(triangleParameters({aspect:100}).aspect,2.2);
});

test('atlas covers all sixteen PDF entries with explicit source status',()=>{assert.equal(VAULT_CASES.length,16);assert.equal(new Set(VAULT_CASES.map(c=>c.id)).size,16);for(const c of VAULT_CASES){assert.ok(SOURCE_IMAGES[c.id]);assert.ok(['survey','photo','generated'].includes(SOURCE_IMAGES[c.id].status));assert.ok(c.page>=1&&c.page<=8);}assert.equal(VAULT_CASES.filter(c=>c.id.startsWith('gloucester')).length,3);});
test('Lincoln retains a full-bay stagger instead of mirror assembly',()=>{const {params,stages:[m]}=triangleStudy({id:'lincoln',depth:0});assert.equal(m.domain,'bay');assert.equal(m.faces.length/3,6);const full=assembleTriangles(m,params);assert.equal(full.faces.length,m.faces.length);const edgeKey=(a,b)=>[a,b].sort().join('|');const point=i=>m.positions.slice(i*3,i*3+3).map(v=>Math.abs(v)<1e-8?0:v).join(',');const edges=new Set([...edgesOf(m).keys()].map(k=>{const [a,b]=k.split(':').map(Number);return edgeKey(point(a),point(b));}));for(const k of edgesOf(m).keys()){const [a,b]=k.split(':').map(Number),rotate=i=>{const [x,y,z]=m.positions.slice(i*3,i*3+3);return [-x,y,-z].map(v=>Math.abs(v)<1e-8?0:v).join(',');};assert.ok(edges.has(edgeKey(rotate(a),rotate(b))));}});

test('paper atlas contains primary quadrant folds and sixteen developed plans',()=>{const svg=atlasPlanSVG();assert.equal((svg.match(/quadrant symmetry folds/g)||[]).length,15);assert.equal((svg.match(/data-edge-count=/g)||[]).length,17);for(const c of VAULT_CASES)assert.ok(svg.includes(c.name));assert.ok(!svg.includes('<image'));});

test('colour sources replace PDF crops and stay within portrait bay bounds',()=>{for(const s of Object.values(SOURCE_IMAGES)){assert.ok(!s.file.startsWith('review-'));assert.ok(s.url.startsWith('https://')||s.url.startsWith('./assets/history/'));const [x,y,w,h]=s.crop;assert.ok(x>=0&&y>=0&&x+w<=s.width&&y+h<=s.height);assert.ok((s.rotation||0)%180?w>=h:h>=w);assert.ok(s.credit&&s.rights);}});

test('Bristol inserts one face centre and produces exactly three children at every application',()=>{
  const {stages}=triangleStudy({id:'bristol',depth:4});
  for(let n=1;n<stages.length;n++){
    const a=stages[n-1],b=stages[n];assert.equal(b.faces.length,a.faces.length*3);assert.equal(b.positions.length-a.positions.length,a.faces.length);
    for(const move of b.moves){assert.equal(move.parents.length,3);for(const k of [0,2])assert.ok(Math.abs(b.positions[move.index*3+k]-move.parents.reduce((sum,i)=>sum+a.positions[i*3+k],0)/3)<1e-10);}
  }
});
test('first plan division stays inside its primary triangles and has no crossing mesh edges',()=>{
  const cross=(a,b,c)=>(b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0]);
  for(const {id}of VAULT_CASES.filter(c=>c.id!=='lincoln')){
    const {stages:[seed,mesh]}=triangleStudy({id,depth:1}),point=i=>[mesh.positions[i*3],mesh.positions[i*3+2]];
    for(let f=0;f<mesh.faces.length;f+=3){
      const child=mesh.faces.slice(f,f+3).map(point);
      assert.ok(Array.from({length:seed.faces.length/3},(_,i)=>seed.faces.slice(i*3,i*3+3).map(j=>[seed.positions[j*3],seed.positions[j*3+2]])).some(([a,b,c])=>child.every(p=>cross(a,b,p)<=1e-7&&cross(b,c,p)<=1e-7&&cross(c,a,p)<=1e-7)),id+' child outside parent');
    }
    const edges=[...edgesOf(mesh).keys()].map(k=>k.split(':').map(Number));
    for(let i=0;i<edges.length;i++)for(let j=i+1;j<edges.length;j++){
      const [a,b]=edges[i],[c,d]=edges[j];if([a,b].includes(c)||[a,b].includes(d))continue;
      assert.ok(!(cross(point(a),point(b),point(c))*cross(point(a),point(b),point(d))<-1e-12&&cross(point(c),point(d),point(a))*cross(point(c),point(d),point(b))<-1e-12),id+' crossing edges');
    }
  }
});
test('symmetry diagrams retain a coarse labelled quadrant and fan plans have distinct origins',()=>{
  for(const id of ['ely','wells','kings','sherborne','gloucester-net']){const svg=symmetryPlan({id});assert.ok(svg.includes('>A</text>'));assert.ok(svg.includes('>B</text>'));assert.ok(!svg.includes('>C</text>'));}
  const s=triangleStudy({id:'westminster',depth:0}).stages[0];assert.equal(s.faces.length/3,2);
  for(const id of ['kings','sherborne','gloucester']){
    const s=triangleStudy({id,depth:1}).stages[1];const origin=s.positions.findIndex((v,i)=>i%3===0&&Math.abs(v)<1e-8&&Math.abs(s.positions[i+2])<1e-8)/3;
    assert.ok(s.structuralEdges.filter(([a,b])=>a===origin||b===origin).length>=10,id);
  }
});
