import { cloneMesh, getFaceCount } from "./mesh.js";

function edgeKey(a, b) {
  return a < b ? `${a}|${b}` : `${b}|${a}`;
}

export function midpointSubdivision(mesh) {
  const next = cloneMesh(mesh);
  const positions = next.positions;
  const inputFaces = mesh.faces;
  const inputLevels = mesh.faceLevels;
  const outputFaces = [];
  const outputLevels = [];
  const midpointMap = new Map();

  const getMidpointVertex = (a, b) => {
    const key = edgeKey(a, b);
    const cached = midpointMap.get(key);
    if (cached !== undefined) return cached;

    const ai = a * 3;
    const bi = b * 3;
    const index = positions.length / 3;
    positions.push(
      (positions[ai] + positions[bi]) * 0.5,
      (positions[ai + 1] + positions[bi + 1]) * 0.5,
      (positions[ai + 2] + positions[bi + 2]) * 0.5,
    );
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

    outputFaces.push(a, ab, ca);
    outputFaces.push(ab, b, bc);
    outputFaces.push(ca, bc, c);
    outputFaces.push(ab, bc, ca);
    outputLevels.push(nextLevel, nextLevel, nextLevel, nextLevel);
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

export function subdivideRecursive(baseMesh, options, transformPerPass = null) {
  const recursionDepth = Math.max(0, Math.round(Number(options.recursionDepth)));
  const requestedPasses = recursionDepth;
  const faceBudget = getFaceBudget(options);

  let mesh = cloneMesh(baseMesh);
  let appliedPasses = 0;
  let capped = false;

  for (let pass = 0; pass < requestedPasses; pass += 1) {
    if (getFaceCount(mesh) * 4 > faceBudget) {
      capped = true;
      break;
    }

    mesh = midpointSubdivision(mesh);
    if (transformPerPass) {
      mesh = transformPerPass(mesh, pass, requestedPasses);
    }
    appliedPasses += 1;
  }

  return {
    mesh,
    requestedPasses,
    appliedPasses,
    faceBudget,
    capped,
    mode: "midpoint4",
  };
}
