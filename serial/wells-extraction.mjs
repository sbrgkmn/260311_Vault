// Manually identified bosses in the supplied markup, in a 2048 x 1145 image frame.
// These are perspective-image landmarks, not measured architectural coordinates.
export const WELLS_SOURCE={
  file:'wells-symmetry-markup.png',width:2048,height:1145,
  centre:[640,555],mirrorY:420,
  ring:[[513,421],[640,420],[774,420],[782,560],[815,810],[628,699],[440,810],[511,555]],
};
export function wellsGroups({full=true}={}){
  const ring=[[0,0],[50,0],[100,0],[100,75],[100,150],[50,150],[0,150],[0,75]],centre=[50,75];
  const marked=ring.map((p,i)=>{
    const next=ring[(i+1)%8];
    // The shared boss-to-corner diagonal is A-C; B is the adjacent axial boss.
    const corner=i%2===0?p:next,axis=i%2===0?next:p;
    const points=[corner,axis,centre];
    const map=([a,b,c])=>[0,1].map(k=>a*points[0][k]+b*points[1][k]+c*points[2][k]);
    const u=map([.68,0,.32]),v=map([.32,.36,.32]),w=map([.32,0,.68]);
    const cornerIndex=i%2===0?i:(i+1)%8,axisIndex=i%2===0?(i+1)%8:i;
    return {id:i+1,ruleGroup:i+1,half:'marked',points,sourcePoints:[WELLS_SOURCE.ring[cornerIndex],WELLS_SOURCE.ring[axisIndex],WELLS_SOURCE.centre],secondary:[{a:u,b:v,structural:true},{a:v,b:w,structural:true},{a:axis,b:v,structural:true}]};
  });
  if(!full)return marked;
  // The annotated region is only half a vault. The longitudinal ridge joins the halves.
  // Square half-bays keep the red diagonal a true geometric mirror, not a shear.
  const lower=p=>[p[0],100+p[1]*2/3],upper=p=>[p[0],100-p[1]*2/3];
  const transform=(g,map,mirrored)=>({...g,id:mirrored?`${g.id}'`:g.id,half:mirrored?'reflected':'marked',points:g.points.map(map),sourcePoints:g.sourcePoints.map(([x,y])=>[x,mirrored?2*WELLS_SOURCE.mirrorY-y:y]),secondary:g.secondary.map(s=>({...s,a:map(s.a),b:map(s.b)}))});
  return [...marked.map(g=>transform(g,lower,false)),...marked.map(g=>transform(g,upper,true))];
}
export function wellsSourceFigure(){
  const {file,width,height,mirrorY}=WELLS_SOURCE;
  const groups=wellsGroups().map(g=>{
    const pts=g.sourcePoints,x=pts.reduce((s,p)=>s+p[0],0)/3,y=pts.reduce((s,p)=>s+p[1],0)/3;
    return `<g data-source-group="${g.id}" data-half="${g.half}"><polygon points="${pts.map(p=>p.join(',')).join(' ')}" fill="${g.ruleGroup%2?'#f5f3d1':'#f9dddd'}" fill-opacity=".22" stroke="#e64435" stroke-width="1.8" ${g.half==='reflected'?'stroke-dasharray="5 3"':''}/><circle cx="${x}" cy="${y}" r="12" fill="white" fill-opacity=".95"/><text x="${x}" y="${y+4}" text-anchor="middle" font-family="Consolas,monospace" font-size="12" fill="#80251d">${g.id}</text></g>`;
  }).join('');
  return `<figure class="ceiling-figure wells-extraction"><a href="./assets/history/${file}" target="_blank" rel="noopener"><svg xmlns="http://www.w3.org/2000/svg" viewBox="415 0 420 825" role="img" aria-label="Wells full vault: eight marked triangles and eight reflected triangles across the longitudinal ridge"><image href="./assets/history/${file}" width="${width}" height="${height}"/>${groups}<path d="M415,${mirrorY}H835" stroke="white" stroke-width="3"/><path d="M415,${mirrorY}H835" stroke="#bc443b" stroke-width="1.5" stroke-dasharray="8 4"/></svg></a><figcaption><span class="source-status">FULL VAULT / MARKED HALF + MIRRORED HALF</span><strong>Wells / complete bay</strong><span>Your markup covers one half: triangles 1–8. The opposite half repeats them as 1'–8' across the longitudinal ridge: sixteen triangle instances, eight repeated rule groups.</span><span class="photo-change">Solid: supplied half. Dashed: symmetry-derived opposite half, not independently measured. The flat diagrams show both halves; proportions remain schematic.</span></figcaption></figure>`;
}
