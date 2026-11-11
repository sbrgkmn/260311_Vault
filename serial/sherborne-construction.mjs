// Topological abstraction of the supplied single-springer Sherborne markup.
// Coordinates are normalized for analysis, not a measured survey registration.
export const SHERBORNE_QUARTER={
  springer:[0,0],crown:[50,75],top:[25,75],side:[50,60],outer:[0,60],lower:[50,28],
};
export function sherborneQuarter(){
  const {springer:o,crown:c,top:u,side:r,outer:d,lower:v}=SHERBORNE_QUARTER;
  // Q is the shared junction of the springer ray and transverse red division.
  const dx=v[0]-d[0],dy=v[1]-d[1],t=(d[1]*dx-d[0]*dy)/(r[1]*dx-r[0]*dy);
  const q=r.map(x=>x*t);
  const radial=[[o,u],[o,r],[o,v]].map(([a,b])=>({a,b,structural:true}));
  const primary=[...radial,...[[u,r],[d,v]].map(([a,b])=>({a,b,structural:true}))];
  const secondary=[[d,u],[u,q],[q,[50,0]]].map(([a,b])=>({a,b,structural:true}));
  return {primary,radial,secondary,reserve:[u,c,r],junction:q};
}
