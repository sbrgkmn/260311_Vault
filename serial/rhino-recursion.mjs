// Connectivity and directed edges are recovered from Rhino, not guessed from images.
// Only the seed and subdivision recipe are used by the parametric generator.
export function generateRhinoStudy(recipe, input = {}, measured = false) {
  const bounded = (v, fallback, lo, hi) => Math.max(lo, Math.min(hi, Number.isFinite(Number(v)) ? Number(v) : fallback));
  const p = {
    rise: bounded(input.rise, recipe.sourceRise, .5, 3.5),
    t: bounded(input.t, recipe.objectStart ? .6 : .5, .2, .8),
    lift: bounded(input.lift, .3, -.5, .5),
    decay: bounded(input.decay, 1, .4, 1.2),
    depth: Math.round(bounded(input.depth, recipe.passes.length, 0, recipe.passes.length)),
  };
  const positions = recipe.seedPositions.map((v,i) => i%3 === 1 && !measured ? v*p.rise/recipe.sourceRise : v);
  let mesh = { positions, faces:recipe.seedFaces.slice(), births:Array(positions.length/3).fill(0), offsets:Array(positions.length/3).fill(0), moves:[], level:0, moduleCount:1, smoothNormals:false };
  mesh.types = Array(mesh.faces.length/3).fill('Rhino');
  const stages = [mesh];
  for (const [pass, instruction] of recipe.passes.slice(0,p.depth).entries()) {
    const positions = mesh.positions.slice(), births = mesh.births.slice(), offsets = mesh.offsets.slice(), moves = [];
    for (const [index,a,b,sourceT,sourceOffset] of instruction.moves) {
      const t = measured ? sourceT : p.t;
      const length = Math.hypot(...[0,1,2].map(k => positions[b*3+k]-positions[a*3+k]));
      const offset = measured ? sourceOffset : p.lift*length*p.decay**pass;
      const baseline = positions[a*3+1]*(1-t)+positions[b*3+1]*t;
      for (let k=0;k<3;k++) positions[index*3+k] = positions[a*3+k]*(1-t)+positions[b*3+k]*t+(k===1?offset:0);
      births[index] = pass+1; offsets[index] = offset;
      moves.push({index,a,b,t,baseline,offset,role:'edge',ruleNumber:1});
    }
    mesh = {...mesh,positions,births,offsets,moves,faces:instruction.faces.slice(),level:pass+1};
    mesh.types = Array(mesh.faces.length/3).fill('Rhino');
    stages.push(mesh);
  }
  return {params:p,stages};
}

export function assembleRhinoQuarter(quarter, bays = 2) {
  const positions=[],faces=[],births=[],offsets=[],lookup=new Map();
  for(let bay=0;bay<bays;bay++) for(const sx of [-1,1]) for(const sz of [-1,1]) {
    const map=[];
    for(let i=0;i<quarter.positions.length;i+=3) {
      const p=[sx*(1-quarter.positions[i]),quarter.positions[i+1],sz*(1-quarter.positions[i+2])+2*bay+1-bays];
      const key=p.map(v=>v.toFixed(7)).join(':');
      if(!lookup.has(key)) {lookup.set(key,positions.length/3);positions.push(...p);births.push(quarter.births[i/3]);offsets.push(quarter.offsets[i/3]);}
      map.push(lookup.get(key));
    }
    for(let i=0;i<quarter.faces.length;i+=3) {
      const [a,b,c]=quarter.faces.slice(i,i+3).map(v=>map[v]);
      faces.push(...(sx*sz<0?[a,c,b]:[a,b,c]));
    }
  }
  return {...quarter,positions,faces,births,offsets,moves:[],types:Array(faces.length/3).fill('Rhino'),moduleCount:4*bays};
}
