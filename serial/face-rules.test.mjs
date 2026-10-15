import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {preset,generateFaceStudy,VAULT_TYPES,ruleParameters} from './face-rules.mjs';
import {generateRhinoStudy} from './rhino-recursion.mjs';
const recipes=JSON.parse(readFileSync(new URL('./assets/rhino-recursion.json',import.meta.url)));
for(const type of VAULT_TYPES)test(`${type.id}: topology and inheritance`,()=>{
  const p=preset(type.id),{stages}=generateFaceStudy(recipes[1],p);
  stages.forEach((mesh,level)=>{
    assert.equal(mesh.faces.length/3,stages[0].faces.length/3*4**level);
    assert(mesh.positions.every(Number.isFinite));
    const edges=new Map();
    for(let i=0;i<mesh.faces.length;i+=3){const ids=mesh.faces.slice(i,i+3),[a,b,c]=ids.map(j=>mesh.positions.slice(j*3,j*3+3));assert((b[0]-a[0])*(c[2]-a[2])-(c[0]-a[0])*(b[2]-a[2])<0);for(let e=0;e<3;e++){const k=[ids[e],ids[(e+1)%3]].sort((a,b)=>a-b).join(':');edges.set(k,(edges.get(k)||0)+1);}}
    assert([...edges.values()].every(n=>n===1||n===2));assert.equal(mesh.positions.length/3-edges.size+mesh.faces.length/3,1);
    if(level){assert.deepEqual(mesh.positions.slice(0,stages[level-1].positions.length),stages[level-1].positions);assert.equal(new Set(mesh.moves.map(m=>[m.a,m.b].sort((a,b)=>a-b).join(':'))).size,mesh.moves.length);}
  });
});
test('All-A grammar preserves both calibrated Rhino variants',()=>{
  recipes.forEach((r,i)=>{const p=preset('rhino',i?.6:.5);p.rise=r.sourceRise;const a=generateFaceStudy(r,p),b=generateRhinoStudy(r);a.stages.forEach((m,k)=>assert.deepEqual(m.positions,b.stages[k].positions));});
});
test('Children inherit selected rules; changes act in following pass',()=>{
  const p=preset('quadripartite');p.seed=['A','A'];p.inherit[0]=['A','B','C','B'];
  const a=generateFaceStudy(recipes[1],p);assert.deepEqual(a.stages[1].types,['A','B','C','B','A','B','C','B']);
  const b=generateFaceStudy(recipes[1],{...p,inherit:[['C','C','C','C'],p.inherit[1],p.inherit[2]]});
  assert.deepEqual(a.stages[1].positions,b.stages[1].positions);assert.notDeepEqual(a.stages[2].positions,b.stages[2].positions);
  assert(a.stages[2].moves.some(m=>m.role.includes('/')));
});
test('Seed assignments, zero lift, depth and input validation',()=>{
  const p=preset('sexpartite');p.seed=['B','B','B','B'];
  const a=generateFaceStudy(recipes[1],{...p,depth:1});assert(a.stages[1].moves.every(m=>m.offset<0));
  p.rules=p.rules.map(r=>({...r,lift:0}));assert(generateFaceStudy(recipes[1],p).stages.slice(1).every(m=>m.moves.every(v=>v.offset===0)));
  const full=generateFaceStudy(recipes[1],p);assert.deepEqual(generateFaceStudy(recipes[1],{...p,depth:2}).stages,full.stages.slice(0,3));
  assert.equal(ruleParameters({rules:[{t:99,lift:-99}]}).rules[0].t,.8);
  assert.equal(ruleParameters({inherit:[['invalid']]}).inherit[0][0],'A');
  assert.deepEqual(ruleParameters(JSON.parse(JSON.stringify(p))),ruleParameters(p));
});
