import {VAULT_CASES,CASE_BY_ID} from './vault-cases.mjs';
import {grammarMesh} from './plan-grammar.mjs';
const bound=(v,d,lo,hi)=>Math.max(lo,Math.min(hi,Number.isFinite(Number(v))?Number(v):d));
export const TRIANGLE_PRESETS=Object.fromEntries(VAULT_CASES.map(({id,aspect,rise,lift,decay})=>[id,{aspect,rise,lift,decay}]));
export function triangleParameters(input={}){
  const id=Object.hasOwn(TRIANGLE_PRESETS,input.id)?input.id:'exeter',d=TRIANGLE_PRESETS[id];
  return {id,depth:Math.round(bound(input.depth,1,0,4)),bays:Math.round(bound(input.bays,1,1,3)),
    aspect:bound(input.aspect,d.aspect,.4,2.2),rise:bound(input.rise,d.rise,.5,2.5),
    split:bound(input.split,.5,.25,.75),lift:bound(input.lift,d.lift,-.2,.2),decay:bound(input.decay,d.decay,.3,1)};
}
const blend=(a,b,t)=>a.map((v,i)=>v+(b[i]-v)*t);
const key=(a,b)=>a<b?`${a}:${b}`:`${b}:${a}`;
function seed(p){
  if(p.id!=='lincoln')return grammarMesh(p);
  const h=p.aspect,r=p.rise,positions=[],faces=[],types=[];
  const vertex=(x,y,z)=>{positions.push(-x,y,z);return positions.length/3-1;};
  const triangle=(a,b,c,type)=>{const ax=positions[b*3]-positions[a*3],az=positions[b*3+2]-positions[a*3+2],bx=positions[c*3]-positions[a*3],bz=positions[c*3+2]-positions[a*3+2];faces.push(...(ax*bz-az*bx<0?[a,b,c]:[a,c,b]));types.push(type);};
  // Reflect the complete C9 graph, including corners, to retain its topology.
  const a=vertex(-1,0,-h),b=vertex(1,0,-h),c=vertex(1,0,h),d=vertex(-1,0,h);
  const u=vertex(-.24,r,0),v=vertex(.24,r,0);
  [[a,b,v,'A'],[a,v,u,'B'],[b,c,v,'C'],[c,d,u,'A'],[c,u,v,'B'],[d,a,u,'C']].forEach(t=>triangle(...t));
  return {positions,faces,types,births:Array(positions.length/3).fill(0),offsets:Array(positions.length/3).fill(0),moves:[],level:0,domain:'bay',smoothNormals:false};
}
export function triangleStudy(input={}){
  const params=triangleParameters(input),stages=[seed(params)];
  const weights={A:1,B:-.35,C:.5},inherit=params.id==='bristol'?{A:['A','B','C'],B:['B','C','A'],C:['C','A','B']}:{A:['A','A','B','C'],B:['B','A','B','C'],C:['C','B','C','A']};
  for(let n=1;n<=params.depth;n++){
    if(n===1&&!['lincoln','bristol','reims','amiens','chartres','gloucester-early'].includes(params.id)){
      stages.push(grammarMesh(params,stages[0]));continue;
    }
    const parent=stages.at(-1),positions=parent.positions.slice(),births=parent.births.slice(),offsets=parent.offsets.slice(),edges=new Map(),faces=[],types=[],moves=[];
    if(params.id==='bristol'){
      for(let f=0;f<parent.faces.length;f+=3){
        const ids=parent.faces.slice(f,f+3),point=[0,1,2].map(k=>ids.reduce((sum,i)=>sum+positions[i*3+k],0)/3);
        const offset=params.lift*weights[parent.types[f/3]]*params.decay**(n-1);point[1]+=offset;
        const center=positions.length/3;positions.push(...point);births.push(n);offsets.push(offset);
        faces.push(ids[0],ids[1],center,ids[1],ids[2],center,ids[2],ids[0],center);
        types.push(...inherit[parent.types[f/3]]);moves.push({index:center,parents:ids,barycentric:[1/3,1/3,1/3],offset});
      }
      const visibleEdges=new Map();
      for(let f=0;f<faces.length;f+=3)for(let e=0;e<3;e++){const a=faces[f+e],b=faces[f+(e+1)%3];visibleEdges.set(key(a,b),[a,b]);}
      stages.push({...parent,positions,faces,types,births,offsets,moves,structuralEdges:[...visibleEdges.values()],level:n});continue;
    }
    for(let f=0;f<parent.faces.length;f+=3)for(let e=0;e<3;e++){
      const a=parent.faces[f+e],b=parent.faces[f+(e+1)%3],k=key(a,b);
      if(!edges.has(k))edges.set(k,{a:Math.min(a,b),b:Math.max(a,b),families:new Set()});
      edges.get(k).families.add(parent.types[f/3]);
    }
    for(const edge of edges.values()){
      const a=positions.slice(edge.a*3,edge.a*3+3),b=positions.slice(edge.b*3,edge.b*3+3),value=blend(a,b,params.split);
      const weight=[...edge.families].reduce((sum,label)=>sum+weights[label],0)/edge.families.size;
      const offset=params.lift*weight*Math.hypot(...a.map((v,i)=>v-b[i]))*params.decay**(n-1);
      value[1]+=offset;edge.index=positions.length/3;positions.push(...value);births.push(n);offsets.push(offset);
      moves.push({index:edge.index,a:edge.a,b:edge.b,t:params.split,offset});
    }
    for(let f=0;f<parent.faces.length;f+=3){
      const [a,b,c]=parent.faces.slice(f,f+3),ab=edges.get(key(a,b)).index,bc=edges.get(key(b,c)).index,ca=edges.get(key(c,a)).index;
      faces.push(a,ab,ca,ab,b,bc,ca,bc,c,ab,bc,ca);types.push(...inherit[parent.types[f/3]]);
    }
    const structuralEdges=parent.structuralEdges?.flatMap(([a,b])=>[[a,edges.get(key(a,b)).index],[edges.get(key(a,b)).index,b]]);
    stages.push({positions,faces,types,births,offsets,moves,structuralEdges,level:n,domain:parent.domain,smoothNormals:false});
  }
  return {params,stages,weights,inherit};
}
export function assembleTriangles(quarter,p){
  const positions=[],faces=[],types=[],births=[],offsets=[],lookup=new Map(),structural=new Map();
  for(let bay=0;bay<p.bays;bay++)for(const sx of (quarter.domain==='bay'?[1]:[-1,1]))for(const sz of (quarter.domain==='bay'?[1]:[-1,1])){
    const mapping=[];
    for(let i=0;i<quarter.positions.length;i+=3){
      const point=quarter.domain==='bay'?[quarter.positions[i],quarter.positions[i+1],quarter.positions[i+2]+(bay-(p.bays-1)/2)*2*p.aspect]:[sx*(1-quarter.positions[i]),quarter.positions[i+1],sz*(p.aspect-quarter.positions[i+2])+(bay-(p.bays-1)/2)*2*p.aspect];
      const k=point.map(v=>v.toFixed(8)).join(':');
      if(!lookup.has(k)){lookup.set(k,positions.length/3);positions.push(...point);births.push(quarter.births[i/3]);offsets.push(quarter.offsets[i/3]);}
      mapping.push(lookup.get(k));
    }
    for(let i=0;i<quarter.faces.length;i+=3){const [a,b,c]=quarter.faces.slice(i,i+3).map(v=>mapping[v]);faces.push(...(sx*sz<0?[a,c,b]:[a,b,c]));types.push(quarter.types[i/3]);}
    for(const [a,b]of quarter.structuralEdges||[]){const u=mapping[a],v=mapping[b];structural.set(key(u,v),[u,v]);}
  }
  return {...quarter,positions,faces,types,births,offsets,structuralEdges:quarter.structuralEdges?[...structural.values()]:undefined,moves:[]};
}
export function trianglePlan(mesh,params){
  const w=280,h=w*params.aspect*params.bays,x=v=>20+(v+1)*w/2,y=v=>20+(v+params.aspect*params.bays)*w/2,edges=new Set(),lines=[];
  for(let f=0;f<mesh.faces.length;f+=3)for(let e=0;e<3;e++){
    const a=mesh.faces[f+e],b=mesh.faces[f+(e+1)%3],k=key(a,b);if(edges.has(k))continue;edges.add(k);
    lines.push(`M${x(mesh.positions[a*3])},${y(mesh.positions[a*3+2])}L${x(mesh.positions[b*3])},${y(mesh.positions[b*3+2])}`);
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 ${h+40}" role="img" aria-label="${params.id} triangular plan, ${mesh.faces.length/3} flat faces"><rect x="20" y="20" width="280" height="${h}" fill="white"/><g fill="none" stroke="#111" stroke-width=".6" stroke-linejoin="round" stroke-linecap="round"><path data-edge-count="${edges.size}" d="${lines.join(' ')}"/></g></svg>`;
}
export function symmetryPlan(params){
  const p=triangleParameters({...params,bays:1,depth:0}),full=assembleTriangles(seed(p),p);
  const svg=trianglePlan(full,p).replace('stroke-width=".6"','stroke-width="1.15"');
  return p.id==='lincoln'?svg:svg.replace(/aria-label="[^"]+"/,`aria-label="${p.id} quadrant symmetry folds"`);
}
