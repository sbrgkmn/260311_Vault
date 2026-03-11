import { createMesh } from "./mesh.js";

function clampBaseTriangleCount(value) {
  const count = Math.max(8, Math.round(Number(value) || 8));
  const snapped = Math.round(count / 4) * 4;
  return Math.max(8, snapped);
}

function rayToSquareBoundary(centerX, centerY, halfWidth, angle) {
  const dx = Math.cos(angle);
  const dy = Math.sin(angle);
  const t = halfWidth / Math.max(Math.abs(dx), Math.abs(dy), 1e-6);
  return [centerX + dx * t, centerY + dy * t];
}

export function generateBaseVault(params) {
  const baseWidth = Math.max(1, Number(params.baseWidth));
  const vaultHeight = Math.max(0, Number(params.vaultHeight));
  const centerX = 0;
  const centerY = 0;
  const halfWidth = baseWidth * 0.5;
  const baseTriangles = clampBaseTriangleCount(params.baseTriangles);

  const centerLift = vaultHeight;
  const edgeLift = vaultHeight * 0.58;

  const positions = [centerX, centerY, centerLift];
  for (let i = 0; i < baseTriangles; i += 1) {
    const angle = (i / baseTriangles) * Math.PI * 2;
    const [x, y] = rayToSquareBoundary(centerX, centerY, halfWidth, angle);
    const localX = Math.abs(x - centerX);
    const localY = Math.abs(y - centerY);
    const midpointInfluence = 1 - Math.min(localX, localY) / halfWidth;
    const z = edgeLift * Math.pow(midpointInfluence, 1.65);
    positions.push(x, y, z);
  }

  const faces = [];
  const faceLevels = [];
  for (let i = 0; i < baseTriangles; i += 1) {
    const next = i === baseTriangles - 1 ? 1 : i + 2;
    faces.push(0, i + 1, next);
    faceLevels.push(0);
  }

  return createMesh(positions, faces, faceLevels);
}
