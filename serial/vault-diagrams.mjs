import {triangulatePlan} from './plan-grammar.mjs';
import {wellsGroups} from './wells-extraction.mjs';
import {sherborneQuarter} from './sherborne-construction.mjs';
import {lincolnPattern} from './lincoln-construction.mjs';

const cache=new Map(),cross=(a,b,c)=>(b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0]);
const corners=[[0,0],[100,0],[100,150],[0,150]],centre=[50,75];
const edgeKey=(a,b)=>a<b?`${a}:${b}`:`${b}:${a}`;
function intersection(a,b,c,d){
  const u=b.map((v,k)=>v-a[k]),v=d.map((x,k)=>x-c[k]),den=u[0]*v[1]-u[1]*v[0];
  const t=((c[0]-a[0])*v[1]-(c[1]-a[1])*v[0])/den;
  return a.map((x,k)=>x+t*u[k]);
}
function midpointRefinement(mesh){
  const points=mesh.points.map(p=>p.slice()),faces=[],midpoints=new Map(),divisions=[];
  const midpoint=(a,b)=>{
    const key=edgeKey(a,b);if(!midpoints.has(key)){midpoints.set(key,points.length);points.push(points[a].map((v,k)=>(v+points[b][k])/2));}return midpoints.get(key);
  };
  for(let f=0;f<mesh.faces.length;f+=3){
    const [a,b,c]=mesh.faces.slice(f,f+3),ab=midpoint(a,b),bc=midpoint(b,c),ca=midpoint(c,a);
    faces.push(a,ab,ca,ab,b,bc,ca,bc,c,ab,bc,ca);
    for(const [u,v]of [[ab,bc],[bc,ca],[ca,ab]])divisions.push({a:points[u],b:points[v]});
  }
  return {points,faces,divisions};
}
export const WELLS_UNIT={
  points:[[0,0],[1,0],[0,1],[0,.32],[.36,.32],[0,.68],[0,.5]],
  // Paired diagonals and the median enforce A/C reflection in barycentric space.
  faces:[0,4,1,0,3,4,3,6,4,6,5,4,5,2,4,2,1,4],
};
function clipQuarter(s){
  let lo=0,hi=1;const d=s.b.map((v,k)=>v-s.a[k]);
  for(const [k,max]of [[0,50],[1,75]]){
    if(Math.abs(d[k])<1e-9){if(s.a[k]<0||s.a[k]>max)return null;continue;}
    const a=-s.a[k]/d[k],b=(max-s.a[k])/d[k];lo=Math.max(lo,Math.min(a,b));hi=Math.min(hi,Math.max(a,b));
  }
  if(hi-lo<1e-9)return null;
  return {...s,a:s.a.map((v,k)=>v+lo*d[k]),b:s.a.map((v,k)=>v+hi*d[k])};
}
export function familyConstruction(id){
  if(cache.has(id))return cache.get(id);
  const primary=[],secondary=[],cells=[],knots=[],groups=id==='compartment'?wellsGroups():[];
  const add=(list,a,b)=>list.push({a,b,structural:true});
  const path=(list,points)=>points.slice(1).forEach((p,i)=>add(list,points[i],p));
  if(id==='compartment')groups.forEach(g=>path(primary,[...g.points,g.points[0]]));
  else path(primary,[...corners,corners[0]]);
  if(id==='fan'){
    for(const c of corners){
      const map=([x,y])=>[c[0]===0?x:100-x,c[1]===0?y:150-y];
      const source=sherborneQuarter();
      source.primary.forEach(s=>add(primary,map(s.a),map(s.b)));
      source.secondary.forEach(s=>add(secondary,map(s.a),map(s.b)));
      path(primary,[map([50,0]),map([50,75]),map([0,75])]);
      cells.push({kind:'fan-diagonal-reserve',points:source.reserve.map(map)});
    }
  }else if(id==='lierne'){
    add(primary,[50,0],[50,150]);
    for(const mirrored of [false,true]){
      const map=([x,y])=>[mirrored?100-x:x,y],k=[28,75],knot=map(k);knots.push(knot);
      // Five red sectors in the supplied half-bay. No crossing-to-ridge segment.
      for(const p of [[0,0],[50,0],[50,150],[0,150],[0,75]])add(primary,knot,map(p));
      const upper=[50,70],lower=[50,80],outer=[14,75];
      for(const [a,b]of [[[0,0],upper],[[0,150],lower],[[0,0],outer],[[0,150],outer]])add(secondary,map(a),map(b));
      // The five-sided cell emerges from intersections, not an independently drawn polygon.
      const up=intersection([0,0],upper,[50,0],k),down=intersection([0,150],lower,[50,150],k);
      cells.push({kind:'gloucester-pentagon',points:[k,up,upper,lower,down].map(map)});
    }
  }else if(id==='staggered'){
    const source=lincolnPattern();
    primary.push(...source.primary,source.guide);secondary.push(...source.secondary);
  }else if(id!=='compartment'){
    corners.forEach(c=>add(primary,c,centre));
    add(primary,[50,0],[50,150]);add(primary,[0,75],[100,75]);
  }
  const seed=triangulatePlan(primary);
  // Include triangulation edges in the red graph, also for the irregular full-bay seed.
  if(!['fan','staggered'].includes(id))primary.splice(0,primary.length,...edgesOf(seed).map(e=>({...e,structural:true})));
  const quarter=(x,y,c)=>[c[0]===0?x:100-x,c[1]===0?y:150-y];
  for(const c of ['staggered','compartment','lierne'].includes(id)?[]:corners){
    const map=p=>quarter(...p,c),line=(a,b)=>add(secondary,map(a),map(b));
    if(id==='tierceron'){
      [[50,24],[50,49],[25,75]].forEach(p=>line([0,0],p));
    }
  }
  if(id==='compartment'){
    groups.forEach(group=>secondary.push(...group.secondary));
    // Cells are paired-triangle consequences, not the primary symmetry groups.
    for(const c of corners)for(const side of [-1,1])cells.push({kind:'wells-cell',points:[[16,24],[34,24],[34,51],[16,51]].map(([x,y])=>quarter(x,y,c)).map(([x,y])=>[x,100+side*y*2/3])});
  }
  if(id==='diagonal'){
    // The same midpoint operation is applied independently to every red parent.
    for(let f=0;f<seed.faces.length;f+=3){
      const p=seed.faces.slice(f,f+3).map(i=>seed.points[i]);
      const mid=p.map((a,i)=>a.map((v,k)=>(v+p[(i+1)%3][k])/2));
      path(secondary,[...mid,mid[0]]);
    }
  }
  let developed;
  if(id==='compartment'){
    const unit=WELLS_UNIT;
    const points=[],faces=[],indices=new Map();
    for(const g of groups){
      const [a,b,c]=g.points,ids=unit.points.map(([u,v])=>{
        const p=[0,1].map(k=>(1-u-v)*a[k]+u*b[k]+v*c[k]),key=p.map(x=>x.toFixed(8)).join(':');
        if(!indices.has(key)){indices.set(key,points.length);points.push(p);}return indices.get(key);
      });
      for(let f=0;f<unit.faces.length;f+=3){const [i,j,k]=unit.faces.slice(f,f+3).map(i=>ids[i]);faces.push(...(cross(a,b,c)<0?[i,k,j]:[i,j,k]));}
    }
    developed={points,faces};
  }else if(id==='staggered')developed=triangulatePlan([...primary,...secondary]);
  else{
    const qLines=primary.map(clipQuarter).filter(Boolean);
    // A computational quarter boundary may split a cell without becoming a red rib.
    if(id==='lierne')qLines.push({a:[0,75],b:[50,75]});
    const q=triangulatePlan([...qLines,...secondary.map(clipQuarter).filter(Boolean)]);
    const points=[],faces=[],indices=new Map();
    // Subdivide once, then reflect that exact result. Ear choices cannot vary by quarter.
    for(const [fx,fy]of [[false,false],[true,false],[true,true],[false,true]]){
      const ids=q.points.map(([x,y])=>{
        const p=[fx?100-x:x,fy?150-y:y],key=p.map(v=>v.toFixed(8)).join(':');
        if(!indices.has(key)){indices.set(key,points.length);points.push(p);}return indices.get(key);
      });
      for(let f=0;f<q.faces.length;f+=3){const [a,b,c]=q.faces.slice(f,f+3).map(i=>ids[i]);faces.push(...(fx!==fy?[a,c,b]:[a,b,c]));}
    }
    developed={points,faces};
  }
  const refined=['lierne','fan','staggered'].includes(id)?midpointRefinement(developed):null;
  const regions=seed.polygons.map(poly=>poly.map(i=>seed.points[i]));
  const result={id,bounds:[100,id==='compartment'?200:150],primary,secondary,cells,knots,groups,regions,seed,developed,refined};cache.set(id,result);return result;
}
function edgesOf(mesh){
  const edges=new Map();
  for(let f=0;f<mesh.faces.length;f+=3)for(let j=0;j<3;j++){
    const a=mesh.faces[f+j],b=mesh.faces[f+(j+1)%3];edges.set(edgeKey(a,b),{a:mesh.points[a],b:mesh.points[b]});
  }
  return [...edges.values()];
}
const pathData=lines=>lines.map(({a,b})=>`M${a.join(',')}L${b.join(',')}`).join('');
const esc=s=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('"','&quot;');
export function diagramPresentation(id){
  if(id==='staggered')return {width:100,height:150,rotation:0,flipHorizontal:false,transform:''};
  if(id==='lierne')return {width:100,height:150,rotation:90,flipVertical:true,transform:'matrix(0 -1.5 -0.6666666666666666 0 100 150)'};
  if(id==='compartment')return {width:100,height:150,rotation:0,transform:'scale(1 0.75)'};
  const [width,height]=familyConstruction(id).bounds;return {width,height,rotation:0,transform:''};
}
function symmetryShading(c){
  const [w,h]=c.bounds,palettes=new Map();
  const signature=points=>points.map(p=>p.map(v=>v.toFixed(6)).join(',')).sort().join('|');
  return Array.from({length:c.seed.faces.length/3},(_,i)=>{
    const points=c.seed.faces.slice(i*3,i*3+3).map(j=>c.seed.points[j]);
    const transforms=c.id==='staggered'?[[false,false],[true,true]]:[[false,false],[true,false],[false,true],[true,true]];
    const orbit=transforms.map(([fx,fy])=>signature(points.map(([x,y])=>[fx?w-x:x,fy?h-y:y]))).sort()[0];
    if(!palettes.has(orbit))palettes.set(orbit,palettes.size);
    const shade=246-Math.min(palettes.get(orbit),7)*5;
    return `<polygon data-symmetry-group="${palettes.get(orbit)}" points="${points.map(p=>p.join(',')).join(' ')}" fill="rgb(${shade},${shade},${shade})"/>`;
  }).join('');
}
export function constructionSVG(id,mode,title){
  const c=familyConstruction(id),stage=mode==='symmetry'?'primary':mode==='recursion'?'triangulated':'secondary';
  const display=diagramPresentation(id),h=display.height,w=display.width;
  const layer=(name,lines,weight)=>`<g data-layer="${name}" fill="none" stroke="#111" stroke-width="${weight}" stroke-linejoin="round" stroke-linecap="round"><path vector-effect="non-scaling-stroke" d="${pathData(lines)}"/></g>`;
  const tertiary=stage==='triangulated'?layer('tertiary',edgesOf(c.refined||c.developed),.25):'';
  const secondary=stage!=='primary'?layer('secondary',c.secondary,.6):'';
  const axes=id==='staggered'?'<path data-axis-kind="transverse-guide" d="M-18,75H-3 M103,75H118"/>':'<path data-axis-kind="mirrors" d="M50,-18V-3 M50,153V168 M-18,75H-3 M103,75H118"/>';
  const guides=`<g data-layer="symmetry-axes" fill="none" stroke="#111" stroke-width=".55" stroke-dasharray="3 3">${axes.replace('<path ','<path stroke="#fff" stroke-width="1.5" stroke-dasharray="none" ')}${axes}</g>`;
  const metadata=c.groups.map(g=>`<g data-triangle-group="${g.id}"/>`).join('')+c.cells.filter(cell=>cell.kind==='fan-diagonal-reserve').map(()=>'<g data-reserved-diagonal="true"/>').join('')+c.knots.map(()=>'<g data-knot="true"/>').join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${(w-h)/2} ${-h*.15} ${h} ${h*1.4}" role="img" aria-label="${esc(title+' / '+stage)}" data-vault-type="${id}" data-stage="${stage}" data-triangle-count="${(stage==='triangulated'?(c.refined||c.developed):c.seed).faces.length/3}"><g data-plan-rotation="${display.rotation}" transform="${display.transform}">${metadata}<g data-layer="symmetry-groups">${symmetryShading(c)}</g>${tertiary}${secondary}${layer('primary',c.primary,1.15)}</g>${guides}</svg>`;
}
export function insideTriangle(p,a,b,c){
  const s=[cross(a,b,p),cross(b,c,p),cross(c,a,p)];return s.every(v=>v>=-1e-7)||s.every(v=>v<=1e-7);
}
export function insideConvexRegion(p,polygon){
  const signs=polygon.map((a,i)=>cross(a,polygon[(i+1)%polygon.length],p));
  return signs.every(v=>v>=-1e-7)||signs.every(v=>v<=1e-7);
}
