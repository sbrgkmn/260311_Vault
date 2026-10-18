// Inactive rib/envelope experiment retained for comparison. The live page uses triangle-vault.mjs.
export const HISTORICAL_CASES=[
  {id:'reims',name:'Reims',type:'Quadripartite bay',photo:1,plate:10,rule:17,baseline:0,
    observation:'The Reims photograph shows a repeated diagonal-rib bay. The review also presents a simple crossed-diagonal plan (p. 10). Their association here is an analytical selection, not an explicitly labelled measured plan in the review.',
    operation:'Preserve the diagonal rib graph. Subdivide rib curves for geometric resolution, then reflect the quarter and translate the bay. Refinement does not create additional historical ribs.',
    limitation:'The ideal rectangle and its two reflection axes are model assumptions. No surveyed bay dimensions, springing heights or rib sections have been fitted.',
    source:'FinalReview pp. 1, 10 and 17; photograph-based typological reading.',url:null},
  {id:'exeter',name:'Exeter',type:'Tierceron branching',photo:4,plate:18,rule:18,baseline:1,
    observation:'Exeter is pictured on p. 4. The research literature documents tierceron vaults through its central vessel; bay geometry varies. The review p. 18 demonstrates an A/B branching construction with two mirror axes.',
    operation:'Split a target interval on each ridge and join the new target to the springing point. Repeat separately in the two triangular quarter sectors, then reflect the whole quarter.',
    limitation:'The interval-splitting program is our interpretation of the review, not a recovered Exeter setting-out recipe. Higher iterations are speculative extensions, not additional historical phases.',
    source:'Tracing the Past: Exeter, laser-survey case study.',url:'https://www.tracingthepast.org.uk/2021/04/07/exeter_site_by_site/'},
  {id:'wells',name:'Wells',type:'Lierne connections',photo:6,plate:20,rule:20,baseline:1,
    observation:'Wells appears on p. 6. Its choir has documented lierne vaulting. The review p. 20 develops a more connected network by replacing A/B regions with triangles and quadrilaterals.',
    operation:'Start with a tierceron fan. Place junctions along neighboring rays and connect them with short links; recursively add smaller linked bands. Lierne links do not run back to a springing point.',
    limitation:'This demonstrates linking as a distinct operation. It does not yet reproduce the specific octagonal/star-shaped compartments of the photographed Wells choir. Junction positions require measured-plan calibration.',
    source:'Tracing the Past: Wells, history of the choir and lierne vault.',url:'https://www.tracingthepast.org.uk/2021/04/08/wells_history/'},
  {id:'gloucester',name:'Gloucester',type:'Fan sector subdivision',photo:7,plate:22,rule:22,baseline:3,
    observation:'The review distinguishes Gloucester rib networks (p. 6) from fan vaults (p. 7). The cathedral identifies the cloister as fan-vaulted; p. 22 of the review develops radial subdivisions in repeated half-fans.',
    operation:'Split an angular interval about a wall springer, not a triangle midpoint in world space. Add concentric links, mirror the sector and repeat it along the walk.',
    limitation:'The conoid-like envelope and clipped circular sectors are idealized. The spandrel tracery and individual stone panels shown in the reference are not reconstructed. Angular subdivision is an analytical hypothesis.',
    source:'Gloucester Cathedral: cloister architecture.',url:'https://gloucestercathedral.org.uk/cathedral/heritage/architecture'},
];
const clamp=(value,fallback,min,max)=>Math.max(min,Math.min(max,Number.isFinite(Number(value))?Number(value):fallback));
export function historyParameters(input={}){
  const id=HISTORICAL_CASES.some(c=>c.id===input.id)?input.id:'exeter';
  return {id,depth:Math.round(clamp(input.depth,1,0,4)),bays:Math.round(clamp(input.bays,2,1,3)),aspect:clamp(input.aspect,.75,.4,1.5),rise:clamp(input.rise,1.4,.5,2.5),split:clamp(input.split,.5,.25,.75)};
}
export function intervals(depth,t=.5){
  let values=[0,1];
  for(let n=0;n<depth;n++)values=values.flatMap((v,i)=>i===values.length-1?[v]:[v,v+(values[i+1]-v)*t]);
  return values;
}
const mix=(a,b,t)=>a.map((v,k)=>v+(b[k]-v)*t);
export function historicalGraph(input={}){
  const p=historyParameters(input),h=p.aspect,quarter=[],seen=new Set();
  const add=(a,b,kind,birth=0)=>{
    if(Math.hypot(a[0]-b[0],a[1]-b[1])<1e-8)return;
    const key=[a,b].map(v=>v.map(x=>x.toFixed(7)).join(',')).sort().join('|');
    if(seen.has(key))return;seen.add(key);quarter.push({a,b,kind,birth});
  };
  if(p.id==='gloucester'){
    const origin=[-1,0],radius=1;
    const point=(angle,r)=>[-1+Math.cos(angle)*r,Math.sin(angle)*r];
    const clip=angle=>Math.min(radius, h/Math.max(Math.sin(angle),1e-9));
    for(let n=0;n<=p.depth;n++){
      for(const f of intervals(n,p.split)){const angle=f*Math.PI/2;add(origin,point(angle,clip(angle)),'fan',n);}
      if(n){const r=1-2**(-n);for(let j=0;j<48;j++){const a=j*Math.PI/96,b=(j+1)*Math.PI/96;if(point(b,r)[1]<=h+1e-9)add(point(a,r),point(b,r),'link',n);}}
    }
  }else{
    const s=[-1,-h],u=[0,-h],c=[0,0],v=[-1,0];
    add(s,c,'primary');
    if(p.id!=='reims'){
      add(u,c,'ridge');add(c,v,'ridge');
      const branchDepth=p.id==='wells'?Math.min(p.depth,1):p.depth;
      for(let n=1;n<=branchDepth;n++)for(const f of intervals(n,p.split).slice(1,-1)){
        add(s,mix(u,c,f),'branch',n);add(s,mix(c,v,f),'branch',n);
      }
      if(p.id==='wells'){
        const targets=[u,mix(u,c,p.split),c,mix(c,v,p.split),v];
        for(let n=1;n<=p.depth;n++){
          const ratio=1-(1-p.split)**n,points=targets.map(t=>mix(s,t,ratio));
          for(let j=0;j<points.length-1;j++)add(points[j],points[j+1],'link',n);
        }
      }
    }
  }
  const edges=[],keys=new Set();
  function addFull(edge){const key=[edge.a,edge.b].map(v=>v.map(x=>x.toFixed(7)).join(',')).sort().join('|');if(!keys.has(key)){keys.add(key);edges.push(edge);}}
  for(let bay=0;bay<p.bays;bay++){
    const shift=(bay-(p.bays-1)/2)*2*h;
    for(const sx of [-1,1])for(const sz of [-1,1])for(const e of quarter){const transform=v=>[v[0]*sx,v[1]*sz+shift];addFull({...e,a:transform(e.a),b:transform(e.b),bay});}
    for(const z of [-h,h])addFull({a:[-1,z+shift],b:[1,z+shift],kind:'boundary',birth:0,bay});
    for(const x of [-1,1])addFull({a:[x,-h+shift],b:[x,h+shift],kind:'boundary',birth:0,bay});
  }
  return {params:p,quarter,edges};
}
export function historicalMesh(input={},triangles=false){
  const graph=historicalGraph(input),p=graph.params,h=p.aspect;
  const positions=[],faces=[],ribSegments=[];
  const elevation=(x,z)=>{
    const r=p.id==='gloucester'?Math.min(1,Math.hypot(1-Math.abs(x),z)):Math.max(1-Math.abs(x),1-Math.abs(z)/h);
    return p.rise*Math.sqrt(Math.max(0,r*(2-r)));
  };
  // The surface is a fixed-resolution illustrative envelope, NOT a historical rib generator.
  const res=48;
  for(let bay=0;bay<p.bays;bay++){
    const base=positions.length/3,shift=(bay-(p.bays-1)/2)*2*h;
    for(let j=0;j<=res;j++)for(let i=0;i<=res;i++){
      const x=-1+2*i/res,z=-h+2*h*j/res;positions.push(x,elevation(x,z),z+shift);
    }
    for(let j=0;j<res;j++)for(let i=0;i<res;i++){const a=base+j*(res+1)+i,b=a+1,c=a+res+1,d=c+1;faces.push(a,c,b,b,c,d);}
  }
  for(const edge of graph.edges){
    const shift=(edge.bay-(p.bays-1)/2)*2*h;
    const segments=p.id==='reims'?8*2**p.depth:32;
    for(let i=0;i<segments;i++)for(const t of [i/segments,(i+1)/segments]){
      const [x,z]=mix(edge.a,edge.b,t);ribSegments.push(x,elevation(x,z-shift)-.012,z);
    }
  }
  return {positions,faces,types:Array(faces.length/3).fill('history'),births:Array(positions.length/3).fill(0),offsets:Array(positions.length/3).fill(0),moves:[],level:p.depth,smoothNormals:false,...(!triangles?{ribSegments}:{})};
}
const colors={primary:'#252a23',boundary:'#a5a79e',ridge:'#666c61',branch:'#b56d43',link:'#657f85',fan:'#697342'};
export function planSVG(graph,{axes=true,quarter=true}={}){
  const {params:p,edges}=graph,w=280,h=280*p.aspect*p.bays,x=v=>20+(v+1)*w/2,y=v=>20+(v+p.aspect*p.bays)*w/2;
  const paths=edges.map(e=>`<path d="M${x(e.a[0])},${y(e.a[1])} L${x(e.b[0])},${y(e.b[1])}" stroke="${colors[e.kind]}" stroke-width="${e.kind==='boundary'?1:1.5}" fill="none"/>`).join('');
  const first=-(p.bays-1)*p.aspect;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 ${h+40}" role="img" aria-label="Idealized ${p.id} rib graph; symmetry axes dashed, generating quarter shaded">${quarter?`<rect x="20" y="${y(first-p.aspect)}" width="140" height="${140*p.aspect}" fill="#ebe6d6"/>`:''}${paths}${axes?`<path d="M160 10 V${h+30} ${Array.from({length:p.bays},(_,i)=>`M10 ${y((i-(p.bays-1)/2)*2*p.aspect)} H310`).join(' ')}" fill="none" stroke="#bd5146" stroke-width="1" stroke-dasharray="5 4"/>`:''}</svg>`;
}
