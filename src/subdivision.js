import { cloneMesh, computeBounds, getFaceCount } from "./mesh.js";
import { getStepParameters, laplacianSmooth } from "./transform.js";

function edgeKey(a, b) {
  return a < b ? `${a}|${b}` : `${b}|${a}`;
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function mix(a, b, t) {
  return a + (b - a) * t;
}

function normalize2(x, y) {
  const length = Math.hypot(x, y);
  if (length <= 1e-6) return [0, 0];
  return [x / length, y / length];
}

function normalize3(x, y, z) {
  const length = Math.hypot(x, y, z);
  if (length <= 1e-6) return [0, 0, 1];
  return [x / length, y / length, z / length];
}

function accumulateOffset(map, index, dx, dy, dz) {
  const current = map.get(index);
  if (current) {
    current.x += dx;
    current.y += dy;
    current.z += dz;
    current.count += 1;
    return;
  }

  map.set(index, {
    x: dx,
    y: dy,
    z: dz,
    count: 1,
  });
}

function buildEdgeContexts(mesh) {
  const contexts = new Map();
  const { positions, faces } = mesh;

  const registerEdge = (a, b, c) => {
    const key = edgeKey(a, b);
    let context = contexts.get(key);
    if (!context) {
      context = {
        normalX: 0,
        normalY: 0,
        normalZ: 0,
        oppositeIndices: [],
      };
      contexts.set(key, context);
    }

    const ai = a * 3;
    const bi = b * 3;
    const ci = c * 3;
    const abx = positions[bi] - positions[ai];
    const aby = positions[bi + 1] - positions[ai + 1];
    const abz = positions[bi + 2] - positions[ai + 2];
    const acx = positions[ci] - positions[ai];
    const acy = positions[ci + 1] - positions[ai + 1];
    const acz = positions[ci + 2] - positions[ai + 2];

    let nx = aby * acz - abz * acy;
    let ny = abz * acx - abx * acz;
    let nz = abx * acy - aby * acx;
    if (nz < 0) {
      nx *= -1;
      ny *= -1;
      nz *= -1;
    }

    const [unitX, unitY, unitZ] = normalize3(nx, ny, nz);
    context.normalX += unitX;
    context.normalY += unitY;
    context.normalZ += unitZ;
    context.oppositeIndices.push(c);
  };

  for (let i = 0; i < faces.length; i += 3) {
    const a = faces[i];
    const b = faces[i + 1];
    const c = faces[i + 2];
    registerEdge(a, b, c);
    registerEdge(b, c, a);
    registerEdge(c, a, b);
  }

  return contexts;
}

function computeArchProfile(x, y, bounds, step) {
  const halfX = Math.max(bounds.spanX * 0.5, 1e-6);
  const halfY = Math.max(bounds.spanY * 0.5, 1e-6);
  const nx = Math.abs((x - bounds.centerX) / halfX);
  const ny = Math.abs((y - bounds.centerY) / halfY);
  const major = Math.max(nx, ny);
  const diagonal = (nx + ny) * 0.5;

  const axialArch = Math.pow(Math.max(0, 1 - major), step.archExponent);
  const diagonalArch = Math.pow(Math.max(0, 1 - diagonal), step.archExponent * 1.1);
  return clamp(mix(diagonalArch, axialArch, step.axialWeight), 0, 1);
}

function computeBandProfile(x, y, bounds, step, passIndex) {
  const halfX = Math.max(bounds.spanX * 0.5, 1e-6);
  const halfY = Math.max(bounds.spanY * 0.5, 1e-6);
  const nx = Math.abs((x - bounds.centerX) / halfX);
  const ny = Math.abs((y - bounds.centerY) / halfY);
  const bands = Math.max(2, Math.round(step.evaluationPoints));

  const axialSample = Math.round(Math.max(nx, ny) * bands) / bands;
  const diagonalSample = Math.round(((nx + ny) * 0.5) * bands) / bands;
  const axialWave = Math.cos(axialSample * Math.PI * (passIndex + 2));
  const diagonalWave = Math.cos(diagonalSample * Math.PI * (passIndex + 2.5));
  const wave = mix(diagonalWave, axialWave, step.axialWeight);
  return 0.3 + 0.7 * Math.pow((wave + 1) * 0.5, 1.8);
}

function createDisplacedMidpoint(
  positions,
  a,
  b,
  bounds,
  options,
  step,
  passIndex,
  passCount,
  context,
) {
  const ai = a * 3;
  const bi = b * 3;
  const ax = positions[ai];
  const ay = positions[ai + 1];
  const az = positions[ai + 2];
  const bx = positions[bi];
  const by = positions[bi + 1];
  const bz = positions[bi + 2];

  const midX = (ax + bx) * 0.5;
  const midY = (ay + by) * 0.5;
  const midZ = (az + bz) * 0.5;

  const arch = computeArchProfile(midX, midY, bounds, step);
  const ridge = computeBandProfile(midX, midY, bounds, step, passIndex);
  const edgeLength = Math.hypot(bx - ax, by - ay);
  const planSpan = Math.max(bounds.spanX, bounds.spanY, 1e-6);
  const edgeScale = clamp(Math.sqrt(edgeLength / planSpan) * 1.6, 0.18, 1);
  const vaultHeight = Math.max(0, Number(options.vaultHeight) || 0);
  const envelopeZ = vaultHeight * arch;
  const stage = passCount > 1 ? passIndex / (passCount - 1) : 0;
  const development = Math.pow(1 - stage, 0.72);
  const settle = 0.12 + arch * mix(0.24, 0.1, stage);
  const recursiveLift =
    vaultHeight * step.displacement * arch * ridge * edgeScale * mix(0.92, 0.46, stage);
  const slopeLift = Math.abs(az - bz) * arch * mix(0.16, 0.06, stage);

  let avgOppX = midX;
  let avgOppY = midY;
  if (context && context.oppositeIndices.length > 0) {
    avgOppX = 0;
    avgOppY = 0;
    for (let i = 0; i < context.oppositeIndices.length; i += 1) {
      const oi = context.oppositeIndices[i] * 3;
      avgOppX += positions[oi];
      avgOppY += positions[oi + 1];
    }
    const invOpposite = 1 / context.oppositeIndices.length;
    avgOppX *= invOpposite;
    avgOppY *= invOpposite;
  }

  const [inwardX, inwardY] = normalize2(avgOppX - midX, avgOppY - midY);
  const [normalX, normalY, normalZ] = context
    ? normalize3(context.normalX, context.normalY, context.normalZ)
    : [0, 0, 1];

  const inset = edgeLength * step.displacement * arch * edgeScale * mix(0.08, 0.025, stage);
  const normalShift = recursiveLift * mix(0.22, 0.08, 1 - development);
  const nextX = midX + inwardX * inset + normalX * normalShift;
  const nextY = midY + inwardY * inset + normalY * normalShift;
  const nextZ =
    midZ + (envelopeZ - midZ) * settle + recursiveLift * normalZ + slopeLift;

  return [nextX, nextY, nextZ];
}

function liftCentralTriangle(
  positions,
  a,
  b,
  c,
  ab,
  bc,
  ca,
  bounds,
  options,
  step,
  passIndex,
  passCount,
  offsetMap,
) {
  const ai = a * 3;
  const bi = b * 3;
  const ci = c * 3;
  const ax = positions[ai];
  const ay = positions[ai + 1];
  const az = positions[ai + 2];
  const bx = positions[bi];
  const by = positions[bi + 1];
  const bz = positions[bi + 2];
  const cx = positions[ci];
  const cy = positions[ci + 1];
  const cz = positions[ci + 2];

  const centroidX = (ax + bx + cx) / 3;
  const centroidY = (ay + by + cy) / 3;
  const arch = computeArchProfile(centroidX, centroidY, bounds, step);
  const ridge = computeBandProfile(centroidX, centroidY, bounds, step, passIndex);
  const stage = passCount > 1 ? passIndex / (passCount - 1) : 0;
  const planSpan = Math.max(bounds.spanX, bounds.spanY, 1e-6);
  const averageEdgeLength =
    (Math.hypot(bx - ax, by - ay) +
      Math.hypot(cx - bx, cy - by) +
      Math.hypot(ax - cx, ay - cy)) /
    3;
  const localScale = clamp((averageEdgeLength / planSpan) * 3.4, 0.12, 1);

  let nx = (by - ay) * (cz - az) - (bz - az) * (cy - ay);
  let ny = (bz - az) * (cx - ax) - (bx - ax) * (cz - az);
  let nz = (bx - ax) * (cy - ay) - (by - ay) * (cx - ax);
  if (nz < 0) {
    nx *= -1;
    ny *= -1;
    nz *= -1;
  }
  const [normalX, normalY, normalZ] = normalize3(nx, ny, nz);

  const vaultHeight = Math.max(0, Number(options.vaultHeight) || 0);
  const innerLift =
    vaultHeight * step.displacement * arch * ridge * localScale * mix(0.52, 0.18, stage);
  const inset = averageEdgeLength * arch * step.displacement * mix(0.045, 0.015, stage);

  for (const vertexIndex of [ab, bc, ca]) {
    const vi = vertexIndex * 3;
    const [towardCentroidX, towardCentroidY] = normalize2(
      centroidX - positions[vi],
      centroidY - positions[vi + 1],
    );
    accumulateOffset(
      offsetMap,
      vertexIndex,
      towardCentroidX * inset + normalX * innerLift * 0.1,
      towardCentroidY * inset + normalY * innerLift * 0.1,
      normalZ * innerLift,
    );
  }
}

export function midpointSubdivision(mesh, options, step, passIndex, bounds, passCount) {
  const next = cloneMesh(mesh);
  const positions = next.positions;
  const inputFaces = mesh.faces;
  const inputLevels = mesh.faceLevels;
  const outputFaces = [];
  const outputLevels = [];
  const midpointMap = new Map();
  const edgeContexts = buildEdgeContexts(mesh);
  const midpointOffsets = new Map();

  const getMidpointVertex = (a, b) => {
    const key = edgeKey(a, b);
    const cached = midpointMap.get(key);
    if (cached !== undefined) return cached;

    const index = positions.length / 3;
    const midpoint = createDisplacedMidpoint(
      positions,
      a,
      b,
      bounds,
      options,
      step,
      passIndex,
      passCount,
      edgeContexts.get(key),
    );
    positions.push(midpoint[0], midpoint[1], midpoint[2]);
    midpointMap.set(key, index);
    return index;
  };

  for (let i = 0; i < inputFaces.length; i += 3) {
    const faceIndex = i / 3;
    const nextLevel = (inputLevels[faceIndex] ?? 0) + 1;
    const a = inputFaces[i];
    const b = inputFaces[i + 1];
    const c = inputFaces[i + 2];

    const ab = getMidpointVertex(a, b);
    const bc = getMidpointVertex(b, c);
    const ca = getMidpointVertex(c, a);
    liftCentralTriangle(
      positions,
      a,
      b,
      c,
      ab,
      bc,
      ca,
      bounds,
      options,
      step,
      passIndex,
      passCount,
      midpointOffsets,
    );

    outputFaces.push(a, ab, ca);
    outputFaces.push(ab, b, bc);
    outputFaces.push(ca, bc, c);
    outputFaces.push(ab, bc, ca);
    outputLevels.push(nextLevel, nextLevel, nextLevel, nextLevel);
  }

  for (const [vertexIndex, offset] of midpointOffsets) {
    const i3 = vertexIndex * 3;
    const inv = 1 / Math.max(offset.count, 1);
    positions[i3] += offset.x * inv;
    positions[i3 + 1] += offset.y * inv;
    positions[i3 + 2] += offset.z * inv;
  }

  return {
    positions,
    faces: outputFaces,
    faceLevels: outputLevels,
  };
}

function getFaceBudget(options) {
  const maxFaces = Math.round(Number(options.maxFaces));
  if (Number.isFinite(maxFaces) && maxFaces > 0) return maxFaces;
  return 260000;
}

export function subdivideRecursive(baseMesh, options) {
  const recursionDepth = Math.max(0, Math.round(Number(options.recursionDepth)));
  const requestedPasses = recursionDepth;
  const faceBudget = getFaceBudget(options);
  const smoothingIterations = Math.max(0, Math.round(Number(options.smoothingIterations)));

  let mesh = cloneMesh(baseMesh);
  let appliedPasses = 0;
  let capped = false;

  for (let pass = 0; pass < requestedPasses; pass += 1) {
    if (getFaceCount(mesh) * 4 > faceBudget) {
      capped = true;
      break;
    }

    const step = getStepParameters(options, pass, requestedPasses);
    const bounds = computeBounds(mesh);
    mesh = midpointSubdivision(mesh, options, step, pass, bounds, requestedPasses);
    if (smoothingIterations > 0) {
      mesh = laplacianSmooth(mesh, smoothingIterations, 0.18);
    }
    appliedPasses += 1;
  }

  return {
    mesh,
    requestedPasses,
    appliedPasses,
    faceBudget,
    capped,
    mode: "displaced-midpoint4",
  };
}
