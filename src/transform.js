import { buildTopology, cloneMesh, computeBounds, getVertexCount } from "./mesh.js";

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function mix(a, b, t) {
  return a + (b - a) * t;
}

function safeNumber(value, fallback) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function parseNumberList(input) {
  if (!input || typeof input !== "string") return [];
  return input
    .split(/[,\s;]+/g)
    .map((part) => Number(part))
    .filter((value) => Number.isFinite(value));
}

function pickStepValue(values, index, fallback) {
  if (!values || values.length === 0) return fallback;
  if (index < values.length) return values[index];
  return values[values.length - 1];
}

function getStepParameters(params, passIndex, totalPasses) {
  const mode = String(params.recursionPattern || "ramp");
  const depth = Math.max(1, totalPasses);
  const t = depth > 1 ? passIndex / (depth - 1) : 0;

  const dispStart = safeNumber(params.displacementStart, 0);
  const dispEnd = safeNumber(params.displacementEnd, dispStart);
  const evalStart = safeNumber(params.evaluationStart, 10);
  const evalEnd = safeNumber(params.evaluationEnd, evalStart);
  const axialStart = clamp(safeNumber(params.axialWeightStart, 0.5), 0, 1);
  const axialEnd = clamp(safeNumber(params.axialWeightEnd, axialStart), 0, 1);
  const archStart = clamp(safeNumber(params.archExponentStart, 2), 0.8, 4);
  const archEnd = clamp(safeNumber(params.archExponentEnd, archStart), 0.8, 4);

  if (mode === "custom") {
    const dispPattern = parseNumberList(params.customDisplacementPattern);
    const evalPattern = parseNumberList(params.customEvaluationPattern);
    return {
      displacement: pickStepValue(dispPattern, passIndex, dispStart),
      evaluationPoints: Math.max(2, Math.round(pickStepValue(evalPattern, passIndex, evalStart))),
      axialWeight: axialStart,
      archExponent: archStart,
    };
  }

  if (mode === "pulse") {
    const pulseHigh = passIndex % 2 === 1;
    return {
      displacement: pulseHigh ? dispEnd : dispStart,
      evaluationPoints: Math.max(2, Math.round(pulseHigh ? evalEnd : evalStart)),
      axialWeight: pulseHigh ? axialEnd : axialStart,
      archExponent: pulseHigh ? archEnd : archStart,
    };
  }

  if (mode === "constant") {
    return {
      displacement: dispStart,
      evaluationPoints: Math.max(2, Math.round(evalStart)),
      axialWeight: axialStart,
      archExponent: archStart,
    };
  }

  return {
    displacement: mix(dispStart, dispEnd, t),
    evaluationPoints: Math.max(2, Math.round(mix(evalStart, evalEnd, t))),
    axialWeight: mix(axialStart, axialEnd, t),
    archExponent: mix(archStart, archEnd, t),
  };
}

function computeFieldZ(x, y, bounds, step) {
  const nx = (x - bounds.centerX) / (bounds.spanX * 0.5);
  const ny = (y - bounds.centerY) / (bounds.spanY * 0.5);
  const ux = Math.abs(nx);
  const uy = Math.abs(ny);
  const major = Math.max(ux, uy);
  const minor = Math.min(ux, uy);

  const points = step.evaluationPoints;
  const majorFreq = 0.4 + points * 0.11;
  const minorFreq = 0.58 + points * 0.14;
  const majorSample = Math.round(major * points) / points;
  const minorSample = Math.round(minor * points) / points;
  const axialWave = Math.cos(majorSample * Math.PI * majorFreq);
  const diagonalWave = Math.cos(minorSample * Math.PI * minorFreq);
  const wave = axialWave * step.axialWeight + diagonalWave * (1 - step.axialWeight);
  const arch = Math.max(0, 1 - Math.pow(major, step.archExponent));
  return step.displacement * 0.34 * arch * wave;
}

export function laplacianSmooth(mesh, iterations, strength = 0.35) {
  const totalIterations = Math.max(0, Math.round(iterations));
  if (totalIterations <= 0) return mesh;

  const topology = buildTopology(mesh);
  const boundaryVertices = topology.boundaryVertices;
  const neighbors = topology.neighbors;
  const vertexCount = getVertexCount(mesh);
  let source = mesh.positions.slice();
  let target = source.slice();

  for (let iter = 0; iter < totalIterations; iter += 1) {
    for (let i = 0; i < vertexCount; i += 1) {
      const neighborList = neighbors[i];
      if (!neighborList || neighborList.length === 0) continue;

      const i3 = i * 3;
      let avgX = 0;
      let avgY = 0;
      let avgZ = 0;
      for (let n = 0; n < neighborList.length; n += 1) {
        const ni3 = neighborList[n] * 3;
        avgX += source[ni3];
        avgY += source[ni3 + 1];
        avgZ += source[ni3 + 2];
      }

      const inv = 1 / neighborList.length;
      avgX *= inv;
      avgY *= inv;
      avgZ *= inv;

      const isBoundary = boundaryVertices.has(i);
      const localStrength = isBoundary ? strength * 0.2 : strength;
      target[i3 + 2] = source[i3 + 2] + (avgZ - source[i3 + 2]) * localStrength;

      if (isBoundary) {
        target[i3] = source[i3];
        target[i3 + 1] = source[i3 + 1];
      } else {
        target[i3] = source[i3] + (avgX - source[i3]) * localStrength * 0.04;
        target[i3 + 1] = source[i3 + 1] + (avgY - source[i3 + 1]) * localStrength * 0.04;
      }
    }

    const swap = source;
    source = target;
    target = swap;
  }

  return {
    positions: source,
    faces: mesh.faces,
    faceLevels: mesh.faceLevels,
  };
}

function transformMesh(mesh, params, step, blend) {
  const next = cloneMesh(mesh);
  const bounds = computeBounds(mesh);
  const positions = next.positions;

  for (let i = 0; i < positions.length; i += 3) {
    const x = positions[i];
    const y = positions[i + 1];
    const z = positions[i + 2];
    const targetZ = z + computeFieldZ(x, y, bounds, step);
    positions[i + 2] = mix(z, targetZ, blend);
  }

  const smoothingIterations = Math.max(0, Math.round(Number(params.smoothingIterations)));
  if (smoothingIterations > 0) {
    return laplacianSmooth(next, smoothingIterations, 0.26);
  }

  return next;
}

export function applyRecursiveTransform(mesh, params, passIndex, totalPasses) {
  if (totalPasses <= 0) return mesh;
  const step = getStepParameters(params, passIndex, totalPasses);
  return transformMesh(mesh, params, step, 1);
}

export function applyFinalTransform(mesh, params) {
  const depth = Math.max(0, Math.round(Number(params.recursionDepth)));
  if (depth > 0) return mesh;
  const step = getStepParameters(params, 0, 1);
  return transformMesh(mesh, params, step, 1);
}
