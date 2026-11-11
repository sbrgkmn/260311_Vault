import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,stat} from 'node:fs/promises';
import {VAULT_CASES} from './vault-cases.mjs';
import {VAULT_TYPES,TYPE_BY_CASE,typeDiagram,typeAtlasSVG} from './vault-types.mjs';
import {familyConstruction,insideTriangle,insideConvexRegion,WELLS_UNIT,diagramPresentation} from './vault-diagrams.mjs';
import {wellsGroups,WELLS_SOURCE,wellsSourceFigure} from './wells-extraction.mjs';
import {sherborneQuarter} from './sherborne-construction.mjs';
import {lincolnPattern} from './lincoln-construction.mjs';
test('six analytical families partition the complete historical corpus',()=>{
  const ids=VAULT_TYPES.flatMap(t=>t.cases);
  assert.equal(VAULT_TYPES.length,6);assert.equal(ids.length,16);assert.equal(new Set(ids).size,16);
  assert.deepEqual([...ids].sort(),VAULT_CASES.map(c=>c.id).sort());
  assert.equal(TYPE_BY_CASE.lincoln.id,'staggered');assert.equal(TYPE_BY_CASE.wells.id,'compartment');
  assert.equal(TYPE_BY_CASE.winchester.id,'tierceron');
  assert.equal(TYPE_BY_CASE.sherborne.representative,'sherborne');
  assert.equal(TYPE_BY_CASE.sherborne.cases[0],'sherborne');
  assert.deepEqual(VAULT_TYPES.map(t=>t.representative),['chartres','exeter','gloucester-net','wells','sherborne','lincoln']);
  assert.ok(VAULT_TYPES.find(t=>t.id==='compartment').note.includes('provisionally'));
});
test('comparison diagrams share a common frame aspect and normalized vault height',()=>{
  for(const t of VAULT_TYPES){
    const svg=typeDiagram(t.id,'symmetry'),box=svg.match(/viewBox="([^"]+)"/)[1].split(' ').map(Number);
    assert.deepEqual([diagramPresentation(t.id).width,diagramPresentation(t.id).height],[100,150]);
    assert.deepEqual(box,[-25,-22.5,150,210]);
    assert.ok(Math.abs(box[2]/box[3]-1/1.4)<1e-8);
    assert.ok(Math.abs(diagramPresentation(t.id).height/box[3]-1/1.4)<1e-8);
  }
});
test('family diagrams use monochrome hierarchy, shaded groups and unlabeled symmetry guides',()=>{
  for(const t of VAULT_TYPES){
    for(const mode of ['symmetry','directions','recursion']){
      const svg=typeDiagram(t.id,mode);assert.ok(svg.startsWith('<svg'));assert.ok(!svg.includes('<image'));assert.ok(!svg.includes('NaN'));assert.ok(svg.includes('aria-label='));
    }
    const symmetry=typeDiagram(t.id,'symmetry');
    assert.ok(symmetry.includes('stroke-dasharray'));
    assert.ok(!symmetry.includes('<text'));assert.ok(!symmetry.includes('<marker'));
    assert.ok(symmetry.includes('data-layer="symmetry-groups"'));
    assert.ok(symmetry.includes('stroke-width="1.15"'));
    assert.ok(typeDiagram(t.id,'directions').includes('stroke-width="0.6"'));
    assert.ok(typeDiagram(t.id,'recursion').includes('stroke-width="0.25"'));
    assert.ok(symmetry.includes('data-layer="primary"'));
    assert.ok(typeDiagram(t.id,'directions').includes('data-layer="secondary"'));
    if(t.id!=='staggered')for(const mode of ['symmetry','directions','recursion']){
      assert.ok(typeDiagram(t.id,mode).includes('data-axis-kind="mirrors" d="M50,-18V-3 M50,153V168 M-18,75H-3 M103,75H118"'),'mirror axes must be dashed outside the normalized rectangle only');
    }
  }
  const plate=typeAtlasSVG();for(const t of VAULT_TYPES)assert.ok(plate.includes(t.name));assert.ok(!plate.includes('<image'));
});
test('secondary triangulation preserves every primary parent and covers one full bay',()=>{
  for(const t of VAULT_TYPES){
    const {seed,developed,bounds,regions}=familyConstruction(t.id);
    let area=0;
    for(let f=0;f<developed.faces.length;f+=3){
      const points=developed.faces.slice(f,f+3).map(i=>developed.points[i]),[a,b,c]=points;
      area+=Math.abs((b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0]))/2;
      assert.ok(t.id==='fan'?regions.some(parent=>points.every(p=>insideConvexRegion(p,parent))):Array.from({length:seed.faces.length/3},(_,i)=>seed.faces.slice(i*3,i*3+3).map(j=>seed.points[j])).some(parent=>points.every(p=>insideTriangle(p,...parent))),t.id+' child crosses a red parent region');
    }
    assert.ok(Math.abs(area-bounds[0]*bounds[1])<1e-7,t.id+' must cover the full bay');
  }
});
test('Wells completes both halves with sixteen sectors; Gloucester uses pentagonal knots',()=>{
  const wells=familyConstruction('compartment');assert.equal(wells.seed.faces.length/3,16);
  assert.equal(wells.cells.length,8);assert.ok(wells.cells.every(c=>c.points.length===4));
  const pointKey=p=>p.map(n=>n.toFixed(6)).join(':');
  const cells=new Set(wells.cells.map(c=>c.points.map(pointKey).sort().join('|')));
  const first=wells.cells[0].points;
  for(const fx of [false,true])for(const fy of [false,true])assert.ok(cells.has(first.map(([x,y])=>pointKey([fx?100-x:x,fy?200-y:y])).sort().join('|')));
  const lierne=familyConstruction('lierne');assert.equal(lierne.cells.length,2);
  assert.ok(lierne.cells.every(c=>c.kind==='gloucester-pentagon'&&c.points.length===5));
});
test('Wells local triangulation mirrors exactly across its A/C median',()=>{
  const m=WELLS_UNIT,key=p=>p.map(v=>v.toFixed(7)).join(','),edge=(a,b)=>[key(a),key(b)].sort().join('|'),edges=new Set();
  for(let f=0;f<m.faces.length;f+=3)for(let j=0;j<3;j++)edges.add(edge(m.points[m.faces[f+j]],m.points[m.faces[f+(j+1)%3]]));
  const mirror=([u,v])=>[u,1-u-v];
  for(let f=0;f<m.faces.length;f+=3)for(let j=0;j<3;j++)assert.ok(edges.has(edge(mirror(m.points[m.faces[f+j]]),mirror(m.points[m.faces[f+(j+1)%3]]))));
  assert.ok(edges.has(edge([.36,.32],[0,.5])),'local median must be present');
  for(const g of wellsGroups()){
    const [a,b,c]=g.points,distance=(p,q)=>Math.hypot(p[0]-q[0],p[1]-q[1]);
    assert.ok(Math.abs(distance(a,b)-distance(c,b))<1e-8,'parent must be isosceles for a geometric, not sheared, reflection');
  }
});
test('staggered diagram has a solid transverse division and external dashed axis extensions',()=>{
  const p=diagramPresentation('staggered'),m=familyConstruction('staggered');
  const source=lincolnPattern();
  assert.equal(p.flipHorizontal,false);assert.equal(p.transform,'');
  assert.deepEqual(source.upper,[60,75]);assert.deepEqual(source.lower,[40,75]);
  assert.equal(source.primary.length,4);assert.deepEqual(m.secondary,source.secondary);
  assert.ok(m.developed.faces.length>m.seed.faces.length);
  assert.ok(m.primary.some(e=>e.a[0]===0&&e.a[1]===75&&e.b[0]===100&&e.b[1]===75),'horizontal division must be a primary rib');
  for(const mode of ['symmetry','directions','recursion']){
    const svg=typeDiagram('staggered',mode);
    assert.ok(svg.includes('data-axis-kind="transverse-guide" d="M-18,75H-3 M103,75H118"'));
    assert.ok(svg.includes('stroke-dasharray'));
  }
});
test('Sherborne fan follows the supplied three-branch green path and preserves primary regions',()=>{
  const m=familyConstruction('fan'),q=sherborneQuarter();
  assert.equal(q.radial.length,3);
  assert.ok(q.radial.every(s=>s.a[0]===0&&s.a[1]===0));
  assert.deepEqual(q.radial.map(s=>s.b),[[25,75],[50,60],[50,28]]);
  assert.equal(m.cells.length,4);assert.ok(m.cells.every(c=>c.kind==='fan-diagonal-reserve'));
  assert.equal(m.secondary.length,12);assert.equal(q.secondary.length,3);
  assert.deepEqual(q.secondary[0],{a:[0,60],b:[25,75],structural:true});
  assert.deepEqual(q.secondary[1].b,q.junction);assert.deepEqual(q.secondary[2].a,q.junction);
  assert.equal(m.refined.faces.length,m.developed.faces.length*4);
  assert.ok(m.regions.some(p=>p.length>3),'keep the marked primary regions, do not invent red diagonals');
  assert.equal((typeDiagram('fan','symmetry').match(/data-reserved-diagonal=/g)||[]).length,4);
  assert.ok(typeDiagram('fan','recursion').includes('data-layer="tertiary"'));
});
test('all lierne stages use a vertical rectangle with the previous top at the bottom',()=>{
  const p=diagramPresentation('lierne');assert.equal(p.flipVertical,true);assert.equal(p.width/p.height,2/3);
  for(const mode of ['symmetry','directions','recursion']){
    const svg=typeDiagram('lierne',mode);assert.ok(svg.includes('data-plan-rotation="90"'));
    assert.ok(svg.includes(`transform="${p.transform}"`));assert.ok(svg.includes('viewBox="-25 -22.5 150 210"'));
  }
  const [a,b,c,d,e,f]=p.transform.slice(7,-1).split(' ').map(Number),map=([x,y])=>[a*x+c*y+e,b*x+d*y+f];
  assert.deepEqual(map([0,0]),[100,150],'previous upper-right must be lower-right');
  assert.deepEqual(map([100,0]),[100,0],'previous lower-right must be upper-right');
  assert.ok(Math.abs(map([0,150])[0])<1e-8,'previous left side must stay left');
  assert.equal(diagramPresentation('fan').rotation,0);
});
test('Gloucester primary crossings align with the paired transverse pentagons',()=>{
  const m=familyConstruction('lierne');assert.deepEqual(m.knots,[[28,75],[72,75]]);
  assert.equal(m.seed.faces.length/3,10,'five marked primary triangles reflected into a full bay');
  assert.equal(m.secondary.length,8,'four supplied green branches per half');
  for(let i=0;i<2;i++){
    const centroid=[0,1].map(k=>m.cells[i].points.reduce((sum,p)=>sum+p[k],0)/5);
    assert.deepEqual(m.cells[i].points[0],m.knots[i],'red crossing is the outer pentagon tip');
    assert.ok(i===0?centroid[0]>m.knots[i][0]:centroid[0]<m.knots[i][0]);
    assert.ok(m.primary.filter(e=>[e.a,e.b].some(p=>p.every((v,k)=>v===m.knots[i][k]))).length>=5);
  }
  assert.equal((typeDiagram('lierne','symmetry').match(/data-knot=/g)||[]).length,2);
});
for(const family of ['lierne','fan','staggered'])test(`${family} tertiary subdivision preserves red/green parents with four welded children each`,()=>{
  const {developed,refined}=familyConstruction(family);
  assert.equal(refined.faces.length,developed.faces.length*4);
  assert.deepEqual(refined.points.slice(0,developed.points.length),developed.points);
  assert.equal(new Set(refined.points.map(p=>p.map(v=>v.toFixed(7)).join(','))).size,refined.points.length);
  for(let f=0;f<developed.faces.length;f+=3){
    const parent=developed.faces.slice(f,f+3).map(i=>developed.points[i]);
    for(const i of refined.faces.slice(f*4,f*4+12))assert.ok(insideTriangle(refined.points[i],...parent));
  }
  const svg=typeDiagram(family,'recursion');
  for(const layer of ['primary','secondary','tertiary'])assert.ok(svg.includes(`data-layer="${layer}"`));
  assert.ok(svg.includes('stroke="#111"'));assert.ok(!svg.includes('<text'));
});
test('Wells shows eight marked triangles and their eight reflected counterparts',()=>{
  const c=familyConstruction('compartment'),groups=wellsGroups();
  assert.equal(c.groups.length,16);assert.equal(groups.length,16);
  assert.equal(wellsGroups({full:false}).length,8);
  assert.deepEqual(groups.filter(g=>g.half==='marked').map(g=>g.id),[1,2,3,4,5,6,7,8]);
  assert.equal(new Set(groups.map(g=>g.ruleGroup)).size,8);
  for(const g of groups){
    assert.equal(g.points.length,3);assert.equal(g.secondary.length,3);
    assert.deepEqual(g.sourcePoints[2],g.half==='marked'?WELLS_SOURCE.centre:[WELLS_SOURCE.centre[0],2*WELLS_SOURCE.mirrorY-WELLS_SOURCE.centre[1]]);
    assert.ok(g.secondary.every(s=>insideTriangle(s.a,...g.points)&&insideTriangle(s.b,...g.points)));
    const map=([a,b,d])=>[0,1].map(k=>a*g.points[0][k]+b*g.points[1][k]+d*g.points[2][k]);
    assert.ok(g.secondary[0].a.every((v,k)=>Math.abs(v-map([.68,0,.32])[k])<1e-8));
    assert.ok(g.secondary[0].b.every((v,k)=>Math.abs(v-map([.32,.36,.32])[k])<1e-8));
  }
  for(const g of groups.filter(g=>g.half==='marked')){
    const reflected=groups.find(other=>other.id===`${g.id}'`);
    assert.deepEqual(reflected.points,g.points.map(([x,y])=>[x,200-y]));
  }
  assert.equal((typeDiagram('compartment','symmetry').match(/data-triangle-group=/g)||[]).length,16);
  assert.equal((wellsSourceFigure().match(/data-source-group=/g)||[]).length,16);
});
test('developing one quadrant and reflecting it preserves the exact secondary triangle graph',()=>{
  const key=p=>p.map(v=>v.toFixed(6)).join(',');
  const edgeKey=(a,b)=>[key(a),key(b)].sort().join('|');
  for(const t of VAULT_TYPES.filter(t=>t.id!=='staggered')){
    const construction=familyConstruction(t.id),m=construction.developed,edges=new Set();
    for(let f=0;f<m.faces.length;f+=3)for(let j=0;j<3;j++)edges.add(edgeKey(m.points[m.faces[f+j]],m.points[m.faces[f+(j+1)%3]]));
    for(let f=0;f<m.faces.length;f+=3)for(let j=0;j<3;j++){
      const a=m.points[m.faces[f+j]],b=m.points[m.faces[f+(j+1)%3]];
      for(const transform of [([x,y])=>[100-x,y],([x,y])=>[x,construction.bounds[1]-y]])assert.ok(edges.has(edgeKey(transform(a),transform(b))),t.id+' inconsistent reflected child edge');
    }
  }
});
test('all ceiling photos retain accurate rights, provenance and local assets',async()=>{
  const photos=JSON.parse(await readFile(new URL('./ceiling-photos.json',import.meta.url),'utf8'));
  assert.equal(Object.keys(photos).length,16);
  assert.equal(photos['gloucester-net'].title,'Gloucester_Cathedral_16.jpg');
  assert.equal(photos['gloucester-net'].credit,'Nilfanion');
  const overrides=JSON.parse(await readFile(new URL('./ceiling-photo-overrides.json',import.meta.url),'utf8'));
  assert.deepEqual(overrides.lincoln,photos.lincoln);
  for(const c of VAULT_CASES){
    const p=photos[c.id];assert.ok(p.credit);
    if(c.id==='lincoln'){assert.equal(p.figure,11);assert.equal(p.sourceProvider,'SAH');assert.ok(p.rights.includes('No open license'));assert.ok(p.original.startsWith('https://sah.org/'));}
    else{assert.match(p.license,/^CC (BY|BY-SA)|^CC0/);assert.ok(!/NC|ND/.test(p.license));assert.ok(p.url.startsWith('https://commons.wikimedia.org/wiki/File:'));assert.ok(p.original.startsWith('https://upload.wikimedia.org/'));}
    assert.ok((await stat(new URL('./assets/history/'+p.file,import.meta.url))).size>1000);
  }
});
