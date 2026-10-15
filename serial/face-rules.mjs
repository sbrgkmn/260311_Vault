export const LABELS = ['A','B','C'];
export const VAULT_TYPES = [
  {id:'rhino',name:'Tierceron II / Rhino seed',note:'Recovered Rhino connectivity. All-A rules reproduce the calibrated study.'},
  {id:'quadripartite',name:'Quadripartite',note:'Procedural four-corner study; two seed faces per quarter.'},
  {id:'sexpartite',name:'Sexpartite',note:'Procedural six-support study; an extra springing point at each side midpoint.'},
  {id:'tierceron',name:'Tierceron',note:'Procedural divided springing fan; four seed faces per quarter.'},
  {id:'stellar',name:'Stellar',note:'Procedural radial web around an interior junction; eight seed faces per quarter.'},
];
const edgeKey=(a,b)=>a<b?`${a}:${b}`:`${b}:${a}`;
const bound=(v,d,lo,hi)=>Math.max(lo,Math.min(hi,Number.isFinite(Number(v))?Number(v):d));
export function ruleParameters(input={}) {
  return {
    type:VAULT_TYPES.some(v=>v.id===input.type)?input.type:'rhino',
    rise:bound(input.rise,2.19,.5,3.5),decay:bound(input.decay,1,.4,1.2),depth:Math.round(bound(input.depth,5,0,5)),
    rules:LABELS.map((_,i)=>({t:bound(input.rules?.[i]?.t,.5,.2,.8),lift:bound(input.rules?.[i]?.lift,[.3,-.12,.12][i],-.5,.5)})),
    inherit:LABELS.map((label,i)=>Array.from({length:4},(_,j)=>LABELS.includes(input.inherit?.[i]?.[j])?input.inherit[i][j]:label)),
    seed:Array.isArray(input.seed)?input.seed.map(v=>LABELS.includes(v)?v:'A'):[],
  };
}
export function preset(type='rhino',t=.6) {
  return ruleParameters({type,rules:[{t:type==='rhino'?t:.5,lift:.3},{t:.5,lift:-.12},{t:.5,lift:.12}],
    inherit:type==='rhino'?[['A','A','A','A'],['B','B','B','B'],['C','C','C','C']]:[['A','A','B','C'],['B','A','B','C'],['C','B','C','A']],
    seed:type==='rhino'?['A','A','A','A']:type==='quadripartite'?['A','A']:type==='stellar'?['A','B','C','A','A','C','B','A']:['A','B','B','A']});
}
function seedMesh(p,recipe) {
  let points,faces;
  if(p.type==='rhino') {
    points=Array.from({length:recipe.seedPositions.length/3},(_,i)=>[recipe.seedPositions[i*3],recipe.seedPositions[i*3+1]/recipe.sourceRise,recipe.seedPositions[i*3+2]]);
    faces=recipe.seedFaces.slice();
  } else {
    points=[[0,0,0],[1,1,0],[1,1,1],[0,1,1]];
    faces=[0,2,1,0,3,2];
    if(p.type==='tierceron'){points.push([1,1,.5],[.5,1,1]);faces=[0,4,1,0,2,4,0,5,2,0,3,5];}
    if(p.type==='sexpartite'){points[3][1]=0;points.push([.55,.8,.55]);faces=[0,4,1,1,4,2,2,4,3,3,4,0];}
    if(p.type==='stellar'){
      points=[[0,0,0],[.5,.7,0],[1,1,0],[1,1,.5],[1,1,1],[.5,1,1],[0,1,1],[0,.7,.5],[.55,.86,.55]];
      faces=[];for(let i=0;i<8;i++)faces.push(i,8,(i+1)%8);
    }
  }
  return {positions:points.flatMap(([x,y,z])=>[x,y*p.rise,z]),faces,types:Array.from({length:faces.length/3},(_,i)=>p.seed[i]||'A'),births:points.map(()=>0),offsets:points.map(()=>0),moves:[],level:0,moduleCount:1,smoothNormals:false};
}
export function generateFaceStudy(recipe,input={}) {
  const params=ruleParameters(input),stages=[seedMesh(params,recipe)];
  for(let level=1;level<=params.depth;level++) {
    const parent=stages.at(-1),positions=parent.positions.slice(),births=parent.births.slice(),offsets=parent.offsets.slice(),moves=[],edges=new Map();
    for(let f=0;f<parent.faces.length;f+=3){const tri=parent.faces.slice(f,f+3);for(let e=0;e<3;e++){
      const a=tri[e],b=tri[(e+1)%3],key=edgeKey(a,b);
      if(!edges.has(key))edges.set(key,{a:Math.min(a,b),b:Math.max(a,b),families:new Set()});
      edges.get(key).families.add(parent.types[f/3]);
    }}
    // Retain the source's directed-edge order for calibrated asymmetric evaluation.
    const instructions=params.type==='rhino'?recipe.passes[level-1].moves: [...edges.values()].map((e,i)=>[positions.length/3+i,e.a,e.b]);
    for(const [index,a,b] of instructions){
      const edge=edges.get(edgeKey(a,b));
      const rules=[...edge.families].map(v=>params.rules[LABELS.indexOf(v)]);
      // Each shared edge gets ONE evaluation. Distinct incident families have equal weight.
      const t=rules.reduce((s,r)=>s+r.t,0)/rules.length,lift=rules.reduce((s,r)=>s+r.lift,0)/rules.length;
      const length=Math.hypot(...[0,1,2].map(k=>positions[a*3+k]-positions[b*3+k]));
      const offset=lift*length*params.decay**(level-1),baseline=positions[a*3+1]*(1-t)+positions[b*3+1]*t;
      for(let k=0;k<3;k++)positions[index*3+k]=positions[a*3+k]*(1-t)+positions[b*3+k]*t+(k===1?offset:0);
      births[index]=level;offsets[index]=offset;edge.index=index;
      moves.push({index,a,b,t,offset,baseline,role:[...edge.families].join('/'),ruleNumber:1});
    }
    let faces=[],types=[];
    if(params.type==='rhino'){
      faces=recipe.passes[level-1].faces.slice();
      for(let i=0;i<faces.length;i+=3){const f=Math.floor(i/12),tri=faces.slice(i,i+3),corners=parent.faces.slice(f*3,f*3+3);const slot=corners.findIndex(v=>tri.includes(v));types.push(params.inherit[LABELS.indexOf(parent.types[f])][slot<0?3:slot]);}
    } else for(let f=0;f<parent.faces.length;f+=3){
      const [a,b,c]=parent.faces.slice(f,f+3),ab=edges.get(edgeKey(a,b)).index,bc=edges.get(edgeKey(b,c)).index,ca=edges.get(edgeKey(c,a)).index;
      faces.push(a,ab,ca,ab,b,bc,ca,bc,c,ab,bc,ca);
      types.push(...params.inherit[LABELS.indexOf(parent.types[f/3])]);
    }
    stages.push({...parent,positions,faces,types,births,offsets,moves,level});
  }
  return {params,stages};
}
