import test from 'node:test';
import assert from 'node:assert/strict';
import { FAMILIES, parameters, generateWedgeSeries, assembleWedge, generateSeries, meshOBJ } from './generator.mjs';

const close = (a, b) => assert(Math.abs(a - b) < 1e-9, a + ' != ' + b);
const pointKey = (p) => p.map(n => (Math.abs(n) < 1e-9 ? 0 : n).toFixed(8)).join(':');
function topology(mesh) {
  const edges = new Map();
  for (let f = 0; f < mesh.faces.length; f += 3) {
    const triangle = mesh.faces.slice(f, f + 3);
    for (const index of triangle) assert(index >= 0 && index < mesh.positions.length / 3);
    const [a,b,c] = triangle.map(i => mesh.positions.slice(i*3, i*3+3));
    // The mesh remains a height field; positive projected area implies no foldovers.
    assert((b[0]-a[0])*(c[2]-a[2]) - (c[0]-a[0])*(b[2]-a[2]) < -1e-10);
    for (let e = 0; e < 3; e++) {
      const a = triangle[e], b = triangle[(e+1)%3];
      const key = a < b ? a+':'+b : b+':'+a;
      edges.set(key, (edges.get(key) || 0) + 1);
    }
  }
  assert(mesh.positions.every(Number.isFinite));
  assert([...edges.values()].every(n => n === 1 || n === 2));
  const vertices = mesh.positions.length / 3;
  assert.equal(vertices - edges.size + mesh.faces.length / 3, 1, 'Connected topological disk');
  return edges;
}


const edgeKey = (a,b) => a<b ? a+':'+b : b+':'+a;
for (const family of FAMILIES.filter(f => f.id !== 'stellar')) {
  test(family.name + ': recursive counts, anchors and A/B/C inheritance', () => {
    const {params,stages}=generateWedgeSeries({family:family.id});
    stages.forEach((mesh,level)=>{
      topology(mesh);
      assert.equal(mesh.faces.length/3,4**level);
      for(let f=0;f<mesh.faces.length;f+=3) {
        const tri=mesh.faces.slice(f,f+3);
        assert.deepEqual(tri.map((a,e)=>mesh.edgeRules[edgeKey(a,tri[(e+1)%3])].label).sort(),['A','B','C']);
      }
      if(!level)return;
      assert.deepEqual(mesh.positions.slice(0,stages[level-1].positions.length),stages[level-1].positions);
      assert.equal(mesh.ruleNumber,params.cycle[(level-1)%params.cycle.length]);
      assert.equal(new Set(mesh.moves.map(m=>m.index)).size,mesh.moves.length);
      for(const move of mesh.moves) {
        const edge=stages[level-1].edgeRules[edgeKey(move.a,move.b)];
        assert.equal(move.a,edge.a); assert.equal(move.b,edge.b);
        const rule=params.rules[mesh.ruleNumber-1]['ABC'.indexOf(edge.label)];
        close(move.t,rule.t);
        close(move.offset,.56*params.rise*params.fold*(.5*params.decay)**(level-1)*rule.dy);
        for(let axis=0;axis<3;axis++)close(mesh.positions[move.index*3+axis],mesh.positions[move.a*3+axis]*(1-rule.t)+mesh.positions[move.b*3+axis]*rule.t+(axis===1?move.offset:0));
      }
    });
  });
}

test('Default cycle expands, contracts, then repeats on every edge',()=>{
  const {stages}=generateWedgeSeries();
  assert.deepEqual(stages.slice(1).map(m=>m.ruleNumber),[1,2,1,2,1]);
  for(const mesh of stages.slice(1))assert(mesh.moves.every(m=>mesh.ruleNumber===1?m.offset>0:m.offset<0));
});

test('Unequal evaluation points and mixed signs keep shared labels and welded symmetric bays',()=>{
  const rules=[[{t:.3,dy:1},{t:.65,dy:-.2},{t:.4,dy:.7}],[{t:.7,dy:-.6},{t:.35,dy:.3},{t:.6,dy:-.8}]];
  const {stages,params}=generateWedgeSeries({rules,cycle:'1,1,2'});
  assert.deepEqual(stages.slice(1).map(m=>m.ruleNumber),[1,1,2,1,1]);
  for(const wedge of stages) {
    topology(wedge);
    for(let f=0;f<wedge.faces.length;f+=3) {
      const tri=wedge.faces.slice(f,f+3);
      assert.deepEqual(tri.map((a,e)=>wedge.edgeRules[edgeKey(a,tri[(e+1)%3])].label).sort(),['A','B','C']);
    }
    for(const m of wedge.moves)close(m.t,params.rules[wedge.ruleNumber-1]['ABC'.indexOf(m.role)].t);
    const mesh=assembleWedge(wedge,2),edges=topology(mesh);
    assert.equal(mesh.faces.length,wedge.faces.length*16);
    const points=Array.from({length:mesh.positions.length/3},(_,i)=>mesh.positions.slice(i*3,i*3+3));
    const lookup=new Set(points.map(pointKey));
    assert.equal(lookup.size,points.length);
    for(const [x,y,z] of points) {
      assert(lookup.has(pointKey([-x,y,z])) || points.some(q=>Math.abs(q[0]+x)<1e-9&&Math.abs(q[1]-y)<1e-9&&Math.abs(q[2]-z)<1e-9));
      assert(lookup.has(pointKey([x,y,-z])) || points.some(q=>Math.abs(q[0]-x)<1e-9&&Math.abs(q[1]-y)<1e-9&&Math.abs(q[2]+z)<1e-9));
    }
    for(const [key,count] of edges)if(count===1){
      const [a,b]=key.split(':').map(Number).map(i=>mesh.positions.slice(i*3,i*3+3));
      assert((Math.abs(a[0])===1&&a[0]===b[0])||(Math.abs(a[2])===2&&a[2]===b[2]),'No internal seam boundary');
    }
    for(const module of mesh.modules) {
      const [a,b,c,d]=module.matrix;
      module.indices.forEach((index,i)=>{
        const [x,y,z]=wedge.positions.slice(i*3,i*3+3);
        close(mesh.positions[index*3],a*(1-x)+b*(1-z));
        close(mesh.positions[index*3+1],y);
        close(mesh.positions[index*3+2],c*(1-x)+d*(1-z)+2*module.bay-1);
      });
    }
  }
});

test('Zero displacement is interpolation only; inverting both rules reverses height offsets',()=>{
  const p=parameters();
  const zero=p.rules.map(rule=>rule.map(e=>({...e,dy:0})));
  const negative=p.rules.map(rule=>rule.map(e=>({...e,dy:-e.dy})));
  const up=generateWedgeSeries(p).stages[5];
  const down=generateWedgeSeries({...p,rules:negative}).stages[5];
  const flat=generateWedgeSeries({...p,rules:zero}).stages[5];
  for(let i=0;i<up.positions.length;i++)close(up.positions[i]+down.positions[i],2*flat.positions[i]);
  for(const m of flat.moves){close(m.offset,0);close(flat.positions[m.index*3+1],m.baseline);}
});

test('Rule edits affect only their selected passes and descendants',()=>{
  const p=parameters({cycle:'1,1,2'});
  const original=generateWedgeSeries(p);
  p.rules[1][0]={t:.7,dy:-1.1};
  const changed=generateWedgeSeries(p);
  assert.deepEqual(original.stages.slice(0,3),changed.stages.slice(0,3));
  assert.notDeepEqual(original.stages[3].positions,changed.stages[3].positions);
  assert.deepEqual(generateWedgeSeries({...p,depth:2}).stages,changed.stages.slice(0,3));
  assert.deepEqual(generateWedgeSeries(p),changed);
});

test('Rule input bounds, cycle parsing, URL round trip and OBJ indices',()=>{
  const p=parameters({rules:'invalid',cycle:'1,3',fold:99});
  assert.equal(p.fold,1); assert.deepEqual(p.cycle,[1,2]);
  const bad=parameters({rules:[[{t:0,dy:99},{t:2,dy:-99}]],cycle:[2]});
  assert.deepEqual(bad.rules[0].slice(0,2),[{t:.1,dy:1.5},{t:.9,dy:-1.5}]);
  assert.deepEqual(bad.cycle,[2]);
  assert.deepEqual(parameters({...bad,rules:JSON.stringify(bad.rules),cycle:bad.cycle.join(',')}),bad);
  const mesh=generateSeries({depth:2}).stages[2];
  const lines=meshOBJ(mesh).split('\n');
  assert.equal(lines.filter(l=>l.startsWith('f ')).length,mesh.faces.length/3);
  for(const line of lines.filter(l=>l.startsWith('f ')))assert(line.slice(2).split(' ').map(Number).every(i=>i>=1&&i<=mesh.positions.length/3));
});


test('Tierceron II: persistent face families, arch development and symmetric welded assembly',()=>{
  const {stages}=generateWedgeSeries({family:'stellar',depth:4});
  for(const [level,mesh] of stages.entries()) {
    topology(mesh);
    assert.equal(mesh.faces.length/3,12*4**level);
    assert.deepEqual([...new Set(mesh.types)].sort(),['FA','FB','FC','FD','FE']);
    assert(mesh.positions.every(Number.isFinite));
    if(level) {
      assert.deepEqual(mesh.positions.slice(0,stages[level-1].positions.length),stages[level-1].positions);
      mesh.types.forEach((type,i)=>assert.equal(type,stages[level-1].types[Math.floor(i/4)]));
      assert(mesh.moves.some(m=>m.offset>0));
      assert(mesh.moves.some(m=>m.offset<0));
    }
    const assembled=assembleWedge(mesh,2),edges=topology(assembled);
    assert.equal(assembled.faces.length,mesh.faces.length*16);
    for(const [key,count] of edges)if(count===1){
      const [a,b]=key.split(':').map(Number).map(i=>assembled.positions.slice(3*i,3*i+3));
      assert((Math.abs(a[0])===1&&a[0]===b[0])||(Math.abs(a[2])===2&&a[2]===b[2]),'No open internal seams');
    }
  }
  const flat=generateWedgeSeries({family:'stellar',fold:0,depth:3});
  assert(flat.stages.slice(1).every(m=>m.moves.every(v=>v.offset===0)));
});
