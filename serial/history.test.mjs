import test from 'node:test';
import assert from 'node:assert/strict';
import {HISTORICAL_CASES,historicalGraph,historicalMesh,historyParameters,intervals,planSVG} from './history.mjs';
const edgeKey=(a,b)=>[a,b].map(v=>v.map(x=>Math.abs(x)<1e-7?'0.000000':x.toFixed(6)).join(',')).sort().join('|');
test('interval recursion is ordered, nested and endpoint preserving',()=>{
  for(const t of [.25,.5,.75])for(let n=0;n<=4;n++){const v=intervals(n,t);assert.equal(v.length,2**n+1);assert.equal(v[0],0);assert.equal(v.at(-1),1);assert.ok(v.every((x,i)=>!i||x>v[i-1]));if(n)for(const x of intervals(n-1,t))assert.ok(v.includes(x));}
});
for(const {id} of HISTORICAL_CASES)test(`${id}: reflection symmetry, finite envelope and distinct rib layer`,()=>{
  for(const depth of [0,1,4]){
    const graph=historicalGraph({id,depth,bays:3,split:.35}),keys=new Set(graph.edges.map(e=>edgeKey(e.a,e.b)));
    assert.equal(keys.size,graph.edges.length);
    for(const e of graph.edges)for(const [sx,sz] of [[-1,1],[1,-1]])assert.ok(keys.has(edgeKey([e.a[0]*sx,e.a[1]*sz],[e.b[0]*sx,e.b[1]*sz])));
    const mesh=historicalMesh({id,depth});assert.ok(mesh.positions.every(Number.isFinite));assert.ok(mesh.ribSegments.every(Number.isFinite));assert.ok(mesh.ribSegments.length>0);
    assert.ok(mesh.faces.every(v=>v>=0&&v<mesh.positions.length/3));assert.equal(mesh.ribSegments.length%6,0);
  }
});
test('Reims refines curves without inventing new ribs; other operators add structure',()=>{
  assert.deepEqual(historicalGraph({id:'reims',depth:0}).edges,historicalGraph({id:'reims',depth:4}).edges);
  for(const id of ['exeter','wells','gloucester'])assert.ok(historicalGraph({id,depth:3}).edges.length>historicalGraph({id,depth:1}).edges.length);
  assert.ok(historicalGraph({id:'wells',depth:1}).edges.some(e=>e.kind==='link'));
});
test('surface tessellation does not grow with graph depth and parameters are bounded',()=>{
  assert.equal(historicalMesh({depth:0}).faces.length,historicalMesh({depth:4}).faces.length);
  assert.equal(historicalMesh({},true).ribSegments,undefined);
  assert.deepEqual(historyParameters({depth:99,bays:-1,aspect:0,split:2}),{id:'exeter',depth:4,bays:1,aspect:.4,rise:1.4,split:.75});
  assert.ok(planSVG(historicalGraph()).includes('stroke-dasharray'));
});
