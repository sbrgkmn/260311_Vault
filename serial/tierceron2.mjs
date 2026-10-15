// Spatial face-development study after PDF pp. 10, 11, 15 and 18.
// Region topology and coefficients below are inferred, not an original definition.
const key = (a, b) => a < b ? `${a}:${b}` : `${b}:${a}`;
export const FACE_DEVELOPMENTS = {
  FA: { arch: .34, crown: .12 },
  FB: { arch: .39, crown: -.035 },
  FC: { arch: .30, crown: .085 },
  FD: { arch: .24, crown: -.10 },
  FE: { arch: .28, crown: .10 },
};

function seed(p) {
  // Three slender springing fans feed two upper web regions, rather than one face.
  const points = [
    [0, 0, 0],
    [.44, .66, 0], [.44, .69, .11], [.44, .71, .27], [.44, .70, .44],
    [.72, .88, 0], [.72, .95, .36], [.72, .94, .72],
    [1, .94, 0], [1, .99, .5], [1, 1, 1],
  ];
  const positions = points.flatMap(([x, y, z]) => [x, y * p.rise, z]);
  const faces = [0,2,1, 0,3,2, 0,4,3, 1,2,5, 2,6,5, 2,3,6, 3,4,6, 4,7,6, 5,6,8, 6,9,8, 6,7,9, 7,10,9];
  const types = ['FA','FB','FC','FD','FE','FD','FE','FC','FD','FE','FD','FE'];
  return { positions, faces, types, births: points.map(() => 0), offsets: points.map(() => 0), moves: [], level: 0, ruleNumber: 'FA-FE', moduleCount: 1, seedIndices: [0,8,10], seedPositions: [0,8,10].flatMap(i => positions.slice(3*i,3*i+3)), smoothNormals: true };
}

function develop(mesh, p, level) {
  const positions = mesh.positions.slice(), births = mesh.births.slice(), offsets = mesh.offsets.slice();
  const edges = new Map(), faces = [], types = [], moves = [];
  for (let f = 0; f < mesh.faces.length; f += 3) {
    const triangle = mesh.faces.slice(f, f + 3);
    for (let e = 0; e < 3; e++) {
      const a = triangle[e], b = triangle[(e+1)%3], id = key(a,b);
      if (!edges.has(id)) edges.set(id, { a, b, families: new Set() });
      edges.get(id).families.add(mesh.types[f/3]);
    }
  }
  for (const edge of edges.values()) {
    const { a, b } = edge;
    const dx = Math.abs(positions[a*3] - positions[b*3]);
    const dz = Math.abs(positions[a*3+2] - positions[b*3+2]);
    const heightDifference = Math.abs(positions[a*3+1] - positions[b*3+1]);
    const length = Math.hypot(dx, dz);
    const developments = [...edge.families].map(f => FACE_DEVELOPMENTS[f]);
    // Shared interfaces use one compatible development, never duplicate vertices.
    const arch = developments.reduce((s,f) => s+f.arch,0)/developments.length;
    const crown = developments.reduce((s,f) => s+f.crown,0)/developments.length;
    const transverse = Math.max(0, 1 - dx / Math.max(length,1e-10));
    // The rising-edge rule follows its own height span. It is not a fixed global
    // offset decayed twice, which made the earlier model a stack of planar ledges.
    const progress = (positions[a*3] + positions[b*3])/2;
    const radial = dx / Math.max(length,1e-10);
    const archMove = arch * heightDifference * radial * (1 - .65 * progress);
    const scallop = crown * length * p.rise * transverse * p.decay ** (level-1);
    const offset = (p.fold / .7) * (archMove + scallop);
    const baseline = (positions[a*3+1]+positions[b*3+1])/2;
    edge.index = positions.length/3;
    positions.push((positions[a*3]+positions[b*3])/2, baseline+offset, (positions[a*3+2]+positions[b*3+2])/2);
    births.push(level); offsets.push(offset);
    moves.push({ index:edge.index, a,b,t:.5,baseline,offset,role:[...edge.families].sort().join('/'),ruleNumber:'FA-FE' });
  }
  for (let f=0;f<mesh.faces.length;f+=3) {
    const [a,b,c]=mesh.faces.slice(f,f+3);
    const ab=edges.get(key(a,b)).index,bc=edges.get(key(b,c)).index,ca=edges.get(key(c,a)).index;
    faces.push(a,ab,ca, ab,b,bc, ca,bc,c, ab,bc,ca);
    // Family identity is spatial and persists. No global expansion/contraction pass.
    types.push(...Array(4).fill(mesh.types[f/3]));
  }
  return { ...mesh, positions,faces,types,births,offsets,moves,level };
}

export function generateTierceron2(p) {
  const stages=[seed(p)];
  for(let level=1;level<=p.depth;level++) stages.push(develop(stages.at(-1),p,level));
  return { params:p,stages };
}
