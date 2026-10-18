import {preset,ruleParameters} from './face-rules.mjs';

export const CASES = [
  {id:'quadripartite',name:'Quadripartite',page:19,tag:'Procedural hypothesis',description:'Two seed triangles per quarter establish the simplest four-corner bay.',comparison:'The reference has broad, continuous lobes. The current two-face seed captures the broad bay organization, but its repeated small folds do not establish a match to the reference rib hierarchy.',missing:'Recover the source seed, boundary profiles and face-specific rules.'},
  {id:'sexpartite',name:'Sexpartite',page:17,tag:'Procedural hypothesis',description:'A lowered side midpoint introduces an additional springing location and a four-face quarter.',comparison:'The model adds the intermediate support pattern. The reference has more continuous longitudinal lobes; the current interior fan and signed displacement sequence remain uncalibrated.',missing:'Verify the six-part rib layout, bay proportions and heights against a measured model.'},
  {id:'tierceron',name:'Tierceron I',page:16,tag:'Procedural hypothesis',description:'Four triangles radiate from the springing point toward divided outer edges.',comparison:'The divided fan introduces secondary branches, but uniform four-way refinement is not evidence that the original tierceron branches or their face assignments have been recovered.',missing:'Identify the secondary rib junctions and distinguish rib geometry from surface triangulation.'},
  {id:'rhino',name:'Tierceron II',page:18,tag:'Rhino-calibrated rule',description:'Recovered seed and directed-edge connectivity from MeshTest_1.3dm; positive length-scaled displacement.',comparison:'This is the strongest geometric calibration: the all-A rule reproduces the recovered Rhino subdivision. The match is to a digital reference, not a measured medieval vault; the Tierceron II attribution remains visual.',missing:'Confirm the named source model and associate it with a documented building.'},
];
export const EXPERIMENTS = [
  {id:'baseline',name:'Baseline',note:'Case seed and default grammar'},
  {id:'low',name:'Low relief',note:'All signed lifts multiplied by 0.55'},
  {id:'high',name:'High relief',note:'All signed lifts multiplied by 1.40'},
  {id:'offset',name:'Edge shift',note:'Each edge position increased by 0.10'},
  {id:'alternate',name:'A / B cycle',note:'Every A child becomes B; every B child becomes A'},
  {id:'mixed',name:'A / B / C mix',note:'Corner-specific inheritance; centres C / A / B'},
];
export function caseConfig(id,depth=3) {
  return ruleParameters({...preset(id,.6),depth});
}
export function variationConfig(id,experiment,depth=3) {
  const p=caseConfig(id,depth);
  if(experiment==='low'||experiment==='high')p.rules=p.rules.map(r=>({...r,lift:Number((r.lift*(experiment==='low'?.55:1.4)).toFixed(3))}));
  if(experiment==='offset')p.rules=p.rules.map(r=>({...r,t:r.t+.1}));
  if(experiment==='alternate')p.inherit=[['B','B','B','B'],['A','A','A','A'],['A','A','A','A']];
  if(experiment==='mixed')p.inherit=[['A','B','A','C'],['B','C','B','A'],['C','A','C','B']];
  return ruleParameters(p);
}
export function matrixSamples(depth=3) {
  return CASES.flatMap((c,i)=>EXPERIMENTS.map((e,j)=>({id:`${i+1}.${j+1}`,case:c.id,experiment:e.id,config:variationConfig(c.id,e.id,depth)})));
}
export function referencePath(c) {
  return `../References/pateerik_LATE_168276_26787024_Phase_II_Material_Pate_O'Hare_Page_${c.page}.jpg`;
}
export function editorURL(config) {
  return './rhino.html?'+new URLSearchParams({type:config.type,variant:'1',assembly:'vault',config:JSON.stringify(config)});
}

const colors={A:'#b56d43',B:'#467f92',C:'#8a873a'};
// Plan-only glyph: t is geometric; vertical displacement is stated numerically.
export function ruleGlyph(config) {
  const rows=config.rules.map((rule,i)=>{
    const tri=[[8,52],[36,4],[64,52]],t=rule.t;
    const mid=tri.map((p,j)=>p.map((x,k)=>x*(1-t)+tri[(j+1)%3][k]*t));
    const polys=[[tri[0],mid[0],mid[2]],[mid[0],tri[1],mid[1]],[mid[2],mid[1],tri[2]],[mid[0],mid[1],mid[2]]];
    const shapes=polys.map((p,j)=>{const label=config.inherit[i][j],x=p.reduce((s,v)=>s+v[0],0)/3,y=p.reduce((s,v)=>s+v[1],0)/3;return `<polygon points="${p.map(v=>v.join(',')).join(' ')}" fill="${colors[label]}" stroke="white" stroke-width="1"/><text x="${x}" y="${y+3}" text-anchor="middle" fill="white" font-size="9">${label}</text>`;}).join('');
    return `<g transform="translate(${i*88},16)">${shapes}<text x="36" y="-5" text-anchor="middle" font-size="11">${'ABC'[i]}</text><text x="36" y="66" text-anchor="middle" font-size="9">t ${t.toFixed(2)}</text><text x="36" y="79" text-anchor="middle" font-size="9">h ${rule.lift>=0?'+':''}${rule.lift.toFixed(3)}</text></g>`;
  }).join('');
  return `<svg viewBox="0 0 252 100" role="img" aria-label="Subdivision rule: parent labels above, child rule labels inside; edge position and signed lift below" xmlns="http://www.w3.org/2000/svg" font-family="Consolas,monospace">${rows}</svg>`;
}
export function seedGlyph(mesh) {
  const polys=mesh.types.map((label,i)=>{const points=mesh.faces.slice(i*3,i*3+3).map(v=>[mesh.positions[v*3]*100,100-mesh.positions[v*3+2]*100]);return `<polygon points="${points.map(v=>v.join(',')).join(' ')}" fill="${colors[label]}" stroke="white" stroke-width="1"/>`;}).join('');
  return `<svg viewBox="-3 -3 106 106" role="img" aria-label="Quarter seed plan, coloured by assigned rule" xmlns="http://www.w3.org/2000/svg">${polys}</svg>`;
}
