import { generateTierceron2 } from './tierceron2.mjs';
// Explicit edge-rule experiments plus a separate spatial Tierceron II study.
export const FAMILIES = [
  { id: 'quadripartite', name: 'Alternating 1 / 2', code: 'W / 01', rise: 1.18, fold: .70, decay: .80, shoulder: .92, cycle: [1, 2], description: 'Two explicit A/B/C edge rules, repeated in the selected cycle. Eight identical mirrored wedges form a bay.' },
  { id: 'sexpartite', name: 'Expansion 1 / 1 / 2', code: 'W / 02', rise: 1.45, fold: .76, decay: .78, shoulder: .82, cycle: [1, 1, 2], description: 'Two explicit A/B/C edge rules, repeated in the selected cycle. Eight identical mirrored wedges form a bay.' },
  { id: 'tierceron', name: 'Contraction 1 / 2 / 2', code: 'W / 03', rise: 1.18, fold: .70, decay: .82, shoulder: .92, cycle: [1, 2, 2], description: 'Two explicit A/B/C edge rules, repeated in the selected cycle. Eight identical mirrored wedges form a bay.' },
  { id: 'stellar', name: 'Tierceron II', code: 'T / 02', rise: 2.35, fold: .70, decay: .84, shoulder: .90, cycle: [1], description: 'Compound springing fan with persistent FA-FE face regions. Sloping edges arch upward; crown regions develop raised and recessed scallops together.' },
];
const clamp = (value, low, high) => Math.max(low, Math.min(high, value));
const finite = (value, fallback) => Number.isFinite(Number(value)) ? Number(value) : fallback;
const edgeKey = (a, b) => a < b ? `${a}:${b}` : `${b}:${a}`;
export const EDGE_LABELS = ['A', 'B', 'C'];
export const DEFAULT_RULES = [
  [{ t: .5, dy: 1 }, { t: .5, dy: .15 }, { t: .5, dy: .85 }],
  [{ t: .5, dy: -.65 }, { t: .5, dy: -.15 }, { t: .5, dy: -.55 }],
];

function parseRules(value) {
  try { return typeof value === 'string' ? JSON.parse(value) : value; } catch { return undefined; }
}

export function parameters(input = {}) {
  const family = FAMILIES.find(f => f.id === input.family) || FAMILIES[0];
  const supplied = parseRules(input.rules);
  const cycle = (Array.isArray(input.cycle) ? input.cycle : String(input.cycle ?? family.cycle ?? '1,2').split(',')).map(Number);
  return {
    family: family.id,
    rise: clamp(finite(input.rise, family.rise), .5, 3),
    fold: clamp(finite(input.fold, family.fold), 0, 1),
    decay: clamp(finite(input.decay, family.decay), .35, .85),
    rules: DEFAULT_RULES.map((rule, r) => rule.map((edge, e) => ({
      t: clamp(finite(supplied?.[r]?.[e]?.t, edge.t), .1, .9),
      dy: clamp(finite(supplied?.[r]?.[e]?.dy, edge.dy), -1.5, 1.5),
    }))),
    cycle: cycle.length && cycle.length <= 12 && cycle.every(n => n === 1 || n === 2) ? cycle : [1, 2],
    bays: Math.round(clamp(finite(input.bays, 2), 1, 3)),
    depth: Math.round(clamp(finite(input.depth, 5), 0, 5)),
  };
}

function wedgeSeed(p) {
  const shoulder = FAMILIES.find(f => f.id === p.family).shoulder;
  // Local plan S=(0,0), R=(1,0), C=(1,1) tiles a square under D4 symmetries.
  const positions = [0, 0, 0, 1, p.rise * shoulder, 0, 1, p.rise, 1];
  const edgeRules = { '0:2': { a: 0, b: 2, label: 'A' }, '1:2': { a: 2, b: 1, label: 'B' }, '0:1': { a: 1, b: 0, label: 'C' } };
  return { positions, faces: [0, 2, 1], types: ['web'], births: [0, 0, 0], offsets: [0, 0, 0], moves: [], level: 0, seedPositions: positions.slice(), moduleCount: 1, edgeRules, ruleNumber: null };
}

function subdivideWedge(mesh, p, level) {
  const positions = mesh.positions.slice(), births = mesh.births.slice(), offsets = mesh.offsets.slice();
  const edges = new Map(), moves = [], faces = [], edgeRules = {};
  const ruleNumber = p.cycle[(level - 1) % p.cycle.length];
  const rule = p.rules[ruleNumber - 1];
  const addEdge = (a, b, label) => { edgeRules[edgeKey(a, b)] = { a, b, label }; };
  function midpoint(a, b) {
    const key = edgeKey(a, b);
    if (edges.has(key)) return edges.get(key);
    const edge = mesh.edgeRules[key];
    ({ a, b } = edge);
    const { t, dy } = rule[EDGE_LABELS.indexOf(edge.label)];
    const baseline = positions[a * 3 + 1] * (1 - t) + positions[b * 3 + 1] * t;
    const offset = .56 * p.rise * p.fold * (.5 * p.decay) ** (level - 1) * dy;
    const index = positions.length / 3;
    positions.push(positions[a * 3] * (1 - t) + positions[b * 3] * t, baseline + offset, positions[a * 3 + 2] * (1 - t) + positions[b * 3 + 2] * t);
    births.push(level);
    offsets.push(offset);
    moves.push({ index, a, b, t, baseline, offset, role: edge.label, ruleNumber });
    addEdge(a, index, edge.label);
    addEdge(index, b, edge.label);
    edges.set(key, index);
    return index;
  }
  function bridge(from, to, sourceA, sourceB) {
    const parent = mesh.edgeRules[edgeKey(sourceA, sourceB)];
    // An internal edge inherits the label and direction of its opposite parent edge.
    if (parent.a === sourceA) addEdge(from, to, parent.label);
    else addEdge(to, from, parent.label);
  }
  for (let i = 0; i < mesh.faces.length; i += 3) {
    const [a, b, c] = mesh.faces.slice(i, i + 3);
    const ab = midpoint(a, b), bc = midpoint(b, c), ca = midpoint(c, a);
    faces.push(a, ab, ca, ab, b, bc, ca, bc, c, ab, bc, ca);
    bridge(ab, ca, b, c);
    bridge(bc, ab, c, a);
    bridge(ca, bc, a, b);
  }
  return { positions, faces, types: Array(faces.length / 3).fill('web'), births, offsets, moves, level, seedPositions: mesh.seedPositions, moduleCount: 1, edgeRules, ruleNumber };
}

export function generateWedgeSeries(input = {}) {
  const p = parameters(input);
  if (p.family === 'stellar') return generateTierceron2(p);
  const stages = [wedgeSeed(p)];
  for (let level = 1; level <= p.depth; level++) stages.push(subdivideWedge(stages.at(-1), p, level));
  return { params: p, stages };
}

// All eight square isometries. Reflecting a module also reverses its winding.
export const SYMMETRIES = [
  [1, 0, 0, 1], [0, 1, 1, 0], [-1, 0, 0, 1], [0, -1, 1, 0],
  [-1, 0, 0, -1], [0, -1, -1, 0], [1, 0, 0, -1], [0, 1, -1, 0],
];

export function assembleWedge(wedge, bays = 1) {
  bays = Math.round(clamp(finite(bays, 1), 1, 3));
  const positions = [], faces = [], types = [], births = [], offsets = [], moves = [], modules = [];
  const vertices = new Map();
  for (let bay = 0; bay < bays; bay++) {
    for (const matrix of SYMMETRIES) {
      const [a, b, c, d] = matrix, map = [];
      for (let i = 0; i < wedge.positions.length; i += 3) {
        const u = 1 - wedge.positions[i], v = 1 - wedge.positions[i + 2];
        const x = a * u + b * v, y = wedge.positions[i + 1], z = c * u + d * v + 2 * bay + 1 - bays;
        const key = [x, y, z].map(value => (Math.abs(value) < 1e-10 ? 0 : value).toFixed(10)).join(':');
        let index = vertices.get(key);
        if (index === undefined) {
          index = positions.length / 3;
          vertices.set(key, index);
          positions.push(x, y, z);
          births.push(wedge.births[i / 3]);
          offsets.push(wedge.offsets[i / 3]);
        }
        map.push(index);
      }
      const start = faces.length / 3;
      for (let i = 0; i < wedge.faces.length; i += 3) {
        const [i0, i1, i2] = wedge.faces.slice(i, i + 3).map(index => map[index]);
        faces.push(...(a * d - b * c < 0 ? [i0, i2, i1] : [i0, i1, i2]));
        types.push(wedge.types[i / 3]);
      }
      modules.push({ bay, matrix, indices: map, start, count: wedge.faces.length / 3 });
      for (const move of wedge.moves) moves.push({ ...move, index: map[move.index], a: map[move.a], b: map[move.b] });
    }
  }
  return { positions, faces, types, births, offsets, moves: [...new Map(moves.map(move => [move.index, move])).values()], level: wedge.level, moduleCount: modules.length, modules, ruleNumber: wedge.ruleNumber, smoothNormals: wedge.smoothNormals };
}

export function generateSeries(input = {}) {
  const wedge = generateWedgeSeries(input);
  return { params: wedge.params, stages: wedge.stages.map(mesh => assembleWedge(mesh, wedge.params.bays)), wedgeStages: wedge.stages };
}

export function meshOBJ(mesh) {
  const lines = ['# Serial Vaults | reconstructed wedge and symmetric assembly'];
  for (let i = 0; i < mesh.positions.length; i += 3) lines.push(`v ${mesh.positions.slice(i, i + 3).join(' ')}`);
  for (let i = 0; i < mesh.faces.length; i += 3) lines.push(`f ${mesh.faces.slice(i, i + 3).map(v => v + 1).join(' ')}`);
  return lines.join('\n');
}
