import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {generateRhinoStudy,assembleRhinoQuarter} from './rhino-recursion.mjs';
const recipes=JSON.parse(readFileSync(new URL('./assets/rhino-recursion.json',import.meta.url)));
test('Recursion depth selects an exact prefix, including the seed',()=>{
  for(const recipe of recipes){
    const full=generateRhinoStudy(recipe);
    for(let depth=0;depth<=5;depth++){
      const partial=generateRhinoStudy(recipe,{depth});
      assert.equal(partial.stages.length,depth+1);
      assert.deepEqual(partial.stages,full.stages.slice(0,depth+1));
    }
    assert.equal(generateRhinoStudy(recipe,{depth:-1}).params.depth,0);
    assert.equal(generateRhinoStudy(recipe,{depth:99}).params.depth,5);
  }
});
for(const recipe of recipes) test(`Rhino ${recipe.objectStart}: recovered rule reproduces all five passes`,()=>{
  const generated=generateRhinoStudy(recipe),reference=generateRhinoStudy(recipe,{},true);
  generated.stages.forEach((mesh,level)=>{
    assert.equal(mesh.faces.length/3,4*4**level);
    assert(mesh.positions.every(Number.isFinite));
    mesh.positions.forEach((v,i)=>assert(Math.abs(v-reference.stages[level].positions[i])<1e-5));
    if(level)assert.deepEqual(mesh.positions.slice(0,generated.stages[level-1].positions.length),generated.stages[level-1].positions);
    const edges=new Map();
    for(let i=0;i<mesh.faces.length;i+=3){
      const tri=mesh.faces.slice(i,i+3),[a,b,c]=tri.map(v=>mesh.positions.slice(v*3,v*3+3));
      assert((b[0]-a[0])*(c[2]-a[2])-(c[0]-a[0])*(b[2]-a[2])<0);
      for(let e=0;e<3;e++){const k=[tri[e],tri[(e+1)%3]].sort((a,b)=>a-b).join(':');edges.set(k,(edges.get(k)||0)+1);}
    }
    assert([...edges.values()].every(n=>n===1||n===2));
    assert.equal(mesh.positions.length/3-edges.size+mesh.faces.length/3,1);
  });
  assert.equal(assembleRhinoQuarter(generated.stages[5],2).faces.length/3,32768);
});
test('Signed lift, zero lift, decay and edge position remain parametric',()=>{
  for(const t of [.2,.5,.8])for(const lift of [-.3,0,.3]){
    const {stages}=generateRhinoStudy(recipes[1],{t,lift,decay:.8});
    assert(stages[5].positions.every(Number.isFinite));
    for(const m of stages.slice(1))for(const move of m.moves)assert.equal(Math.sign(move.offset),Math.sign(lift));
  }
});
