import { buildTopology, getVertexCount } from "./mesh.js";

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

export function getStepParameters(params, passIndex, totalPasses) {
  const mode = String(params.recursionPattern || "cascade");
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

  if (mode === "cascade") {
    const primaryShape = Math.pow(1 - t, 0.72);
    const refinementShape = Math.pow(t, 0.88);
    return {
      displacement: mix(dispEnd, dispStart, primaryShape),
      evaluationPoints: Math.max(2, Math.round(mix(evalStart, evalEnd, refinementShape))),
      axialWeight: mix(axialEnd, axialStart, primaryShape),
      archExponent: mix(archStart, archEnd, refinementShape),
    };
  }

  return {
    displacement: mix(dispStart, dispEnd, t),
    evaluationPoints: Math.max(2, Math.round(mix(evalStart, evalEnd, t))),
    axialWeight: mix(axialStart, axialEnd, t),
    archExponent: mix(archStart, archEnd, t),
  };
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

export function applyFinalTransform(mesh) {
  return mesh;
}
