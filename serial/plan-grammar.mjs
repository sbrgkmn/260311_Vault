// Plan constraints are split at every crossing before polygon faces are triangulated.
// Coordinates are one quadrant, from springer (0,0) to crown (1,aspect).
const EPS=1e-8;
const cross=(a,b,c)=>(b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0]);
const edgeKey=(a,b)=>a<b?`${a}:${b}`:`${b}:${a}`;
export const RADIAL_CASES=new Set(['westminster','kings','sherborne','gloucester']);
export function primaryLines(p){
  const h=p.aspect;
  return [[[0,0],[1,h]]];
}
function clip(a,b,h){
  let lo=0,hi=1;const dx=b[0]-a[0],dy=b[1]-a[1];
  for(const [v,d,max] of [[a[0],dx,1],[a[1],dy,h]]){
    if(Math.abs(d)<EPS){if(v<0||v>max)return null;continue;}
    const t0=-v/d,t1=(max-v)/d;lo=Math.max(lo,Math.min(t0,t1));hi=Math.min(hi,Math.max(t0,t1));
  }
  if(hi-lo<EPS)return null;
  return [[a[0]+lo*dx,a[1]+lo*dy],[a[0]+hi*dx,a[1]+hi*dy]];
}
export function planConstraints(p,{primary=false}={}){
  const h=p.aspect,segments=[];
  const add=(a,b,structural=true)=>{const s=clip(a,b,h);if(s)segments.push({a:s[0],b:s[1],structural});};
  const path=points=>points.slice(1).forEach((point,i)=>add(points[i],point));
  const norm=points=>points.map(([x,y])=>[x,y*h]);
  [[[0,0],[1,0]],[[1,0],[1,h]],[[1,h],[0,h]],[[0,h],[0,0]]].forEach(s=>add(...s));
  primaryLines(p).forEach(s=>add(...s,['reims','amiens','chartres','gloucester-early'].includes(p.id)));
  if(primary)return segments;
  if(RADIAL_CASES.has(p.id)){
    const o=[0,0];
    const count={kings:16,westminster:14,sherborne:12,gloucester:12}[p.id];
    const angles=new Set(Array.from({length:count+1},(_,i)=>Math.PI/2*i/count));
    for(const corner of [[0,0],[1,0],[1,h],[0,h]])if(Math.hypot(corner[0]-o[0],corner[1]-o[1])>EPS)angles.add(Math.atan2(corner[1]-o[1],corner[0]-o[0]));
    const sorted=[...angles].sort((a,b)=>a-b),reach=4*Math.hypot(1,h);
    sorted.forEach(a=>add(o,[o[0]+reach*Math.cos(a),o[1]+reach*Math.sin(a)]));
    const radii=p.id==='westminster'?[.3,.58,.88]:p.id==='kings'?[.32,.65,.97]:p.id==='gloucester'?[.3,.64,1]:[.35,.72,1.03];
    for(const [j,r] of radii.entries()){
      const ring=sorted.map((a,i)=>{
        const radius=r*(p.id==='sherborne'&&j===1?(i%2?1.12:.88):1);
        return [o[0]+radius*Math.cos(a),o[1]+radius*Math.sin(a)];
      });
      path(ring);
    }
    return segments;
  }
  const s=[0,0];
  const rays=(long,transverse)=>{
    long.forEach(t=>add(s,[1,t*h]));transverse.forEach(t=>add(s,[t,h]));
  };
  if(p.id==='wells'){
    // Truncated-square compartments within a single C5 bay, not repeated bays.
    const cut=.28;
    const project=([u,v])=>[(u-v)*.5,(u+v)*h*.25+h*.25];
    for(let col=-3;col<5;col++)for(let row=-4;row<5;row++){
      const x=col-.5,y=row-.5,c=cut;
      const oct=[[x+c,y],[x+1-c,y],[x+1,y+c],[x+1,y+1-c],[x+1-c,y+1],[x+c,y+1],[x,y+1-c],[x,y+c]].map(project);
      path([...oct,oct[0]]);
    }
    add([0,0],[.135,.135*h]);
  }else if(p.id==='ely'){
    rays([0,.35,.68,1],[.4,1]);
    path(norm([[.34,.42],[.57,.38],[.62,.67],[.85,.59],[1,.82]]));
    path(norm([[.45,.72],[.62,.67],[.69,.91],[1,1]]));
    add(...norm([[.34,.42],[0,1]]));
  }else if(p.id==='winchester'){
    rays([0,.28,.56,.8,1],[.45,1]);
    path(norm([[.48,0],[.55,.22],[.46,.4],[.7,.55],[.62,.75],[.85,.88],[1,1]]));
    path(norm([[.77,0],[.82,.22],[.75,.4],[1,.55]]));
    path(norm([[.46,.4],[.24,.7],[.45,1]]));
  }else if(p.id==='gloucester-net'){
    const knots=norm([[.54,.21],[.35,.44],[.61,.61],[.72,.78],[.54,.85],[.3,1],[0,1]]);
    knots.forEach(k=>add(s,k));path(knots);
    path(norm([[1,0],[.54,.21],[1,.3],[.35,.44],[1,.46],[.61,.61],[1,.65],[.72,.78],[1,.83],[.54,.85],[1,1]]));
    add(...norm([[.35,.44],[.72,.78]]));
    add(...norm([[.61,.61],[.3,1]]));
  }else if(p.id==='exeter')rays([0,.25,.5,.75,1],[.5,1]);
  else if(p.id==='st-giles')rays([0,.2,.4,.65,1],[.45,1]);
  else if(['reims','amiens','chartres','gloucester-early'].includes(p.id))add(s,[1,h]);
  return segments;
}

export function triangulatePlan(segments,initial=[]){
  const points=initial.map(v=>v.slice()),index=new Map(points.map((v,i)=>[v.map(x=>x.toFixed(8)).join(':'),i]));
  const vertex=p=>{const k=p.map(x=>(Math.abs(x)<EPS?0:x).toFixed(8)).join(':');if(!index.has(k)){index.set(k,points.length);points.push(p);}return index.get(k);};
  const split=segments.map(s=>[{t:0,p:s.a},{t:1,p:s.b}]);
  for(let i=0;i<segments.length;i++)for(let j=i+1;j<segments.length;j++){
    const a=segments[i].a,b=segments[i].b,c=segments[j].a,d=segments[j].b;
    const u=[b[0]-a[0],b[1]-a[1]],v=[d[0]-c[0],d[1]-c[1]],den=u[0]*v[1]-u[1]*v[0];
    if(Math.abs(den)>EPS){
      const t=((c[0]-a[0])*v[1]-(c[1]-a[1])*v[0])/den,q=((c[0]-a[0])*u[1]-(c[1]-a[1])*u[0])/den;
      if(t>=-EPS&&t<=1+EPS&&q>=-EPS&&q<=1+EPS){const p=[a[0]+t*u[0],a[1]+t*u[1]];split[i].push({t,p});split[j].push({t:q,p});}
    }else if(Math.abs(cross(a,b,c))<EPS){
      for(const [k,start,delta,endpoints]of [[i,a,u,[c,d]],[j,c,v,[a,b]]])for(const p of endpoints){
        const t=((p[0]-start[0])*delta[0]+(p[1]-start[1])*delta[1])/(delta[0]**2+delta[1]**2);
        if(t>EPS&&t<1-EPS)split[k].push({t,p});
      }
    }
  }
  const edges=new Set(),structural=new Set(),neighbors=new Map();
  split.forEach((list,i)=>{
    const ids=list.sort((a,b)=>a.t-b.t).map(v=>vertex(v.p)).filter((v,j,a)=>j===0||v!==a[j-1]);
    for(let j=1;j<ids.length;j++){
      const a=ids[j-1],b=ids[j],k=edgeKey(a,b);edges.add(k);if(segments[i].structural)structural.add(k);
      if(!neighbors.has(a))neighbors.set(a,new Set());if(!neighbors.has(b))neighbors.set(b,new Set());neighbors.get(a).add(b);neighbors.get(b).add(a);
    }
  });
  const ordered=new Map([...neighbors].map(([i,ns])=>[i,[...ns].sort((a,b)=>Math.atan2(points[a][1]-points[i][1],points[a][0]-points[i][0])-Math.atan2(points[b][1]-points[i][1],points[b][0]-points[i][0]))]));
  const visited=new Set(),polygons=[];
  for(const [a,ns]of ordered)for(const b of ns){
    if(visited.has(`${a}:${b}`))continue;
    let u=a,v=b,poly=[];
    for(let n=0;n<edges.size*2+2;n++){
      if(visited.has(`${u}:${v}`))break;visited.add(`${u}:${v}`);poly.push(u);
      const next=ordered.get(v),w=next[(next.indexOf(u)+next.length-1)%next.length];u=v;v=w;if(u===a&&v===b)break;
    }
    const area=poly.reduce((sum,id,j)=>{const p=points[id],q=points[poly[(j+1)%poly.length]];return sum+p[0]*q[1]-p[1]*q[0];},0);
    if(area>EPS)polygons.push(poly);
  }
  const faces=[];
  // Ear clipping preserves every junction on compartment boundaries, including collinear ones.
  for(const polygon of polygons){
    const poly=polygon.slice();let guard=0;
    while(poly.length>3&&guard++<polygon.length**2){
      let found=false;
      for(let i=0;i<poly.length;i++){
        const a=poly[(i+poly.length-1)%poly.length],b=poly[i],c=poly[(i+1)%poly.length];
        if(cross(points[a],points[b],points[c])<=EPS)continue;
        if(poly.some(k=>k!==a&&k!==b&&k!==c&&cross(points[a],points[b],points[k])>=-EPS&&cross(points[b],points[c],points[k])>=-EPS&&cross(points[c],points[a],points[k])>=-EPS))continue;
        faces.push(a,c,b);poly.splice(i,1);found=true;break;
      }
      if(!found)throw new Error('Unable to triangulate vault compartment');
    }
    if(poly.length===3&&cross(...poly.map(i=>points[i]))>EPS)faces.push(poly[0],poly[2],poly[1]);
  }
  return {points,faces,structuralEdges:[...structural].map(k=>k.split(':').map(Number))};
}

export function grammarMesh(p,parent){
  const initial=parent?Array.from({length:parent.positions.length/3},(_,i)=>[parent.positions[i*3],parent.positions[i*3+2]]):[];
  const planar=triangulatePlan(planConstraints(p,{primary:!parent}),initial),positions=[],types=[],births=[],offsets=[];
  const height=(x,z)=>p.rise*Math.max(x,z/p.aspect);
  const moves=[];
  planar.points.forEach(([x,z],i)=>{
    let y=height(x,z),offset=0;
    if(parent&&i<initial.length)y=parent.positions[i*3+1];
    else if(parent){
      for(let f=0;f<parent.faces.length;f+=3){
        const ids=parent.faces.slice(f,f+3),[a,b,c]=ids.map(i=>[parent.positions[i*3],parent.positions[i*3+2]]),area=cross(a,b,c);
        const wa=cross([x,z],b,c)/area,wb=cross(a,[x,z],c)/area,wc=1-wa-wb;
        if(Math.min(wa,wb,wc)<-EPS)continue;
        y=wa*parent.positions[ids[0]*3+1]+wb*parent.positions[ids[1]*3+1]+wc*parent.positions[ids[2]*3+1];
        offset=p.lift*(f/3%2?-.35:1)*Math.min(1,Math.hypot(x,z));y+=offset;
        moves.push({index:i,parents:ids,barycentric:[wa,wb,wc],offset});break;
      }
    }
    positions.push(x,y,z);births.push(parent&&i>=initial.length?1:0);offsets.push(offset);
  });
  for(let i=0;i<planar.faces.length/3;i++)types.push(['A','B','C'][i%3]);
  return {positions,faces:planar.faces,types,births,offsets,moves,level:parent?1:0,domain:'quarter',structuralEdges:planar.structuralEdges,smoothNormals:false};
}
