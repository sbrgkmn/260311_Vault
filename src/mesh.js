export function createMesh(positions, faces, faceLevels = null) {
  const levels = faceLevels ?? new Array(faces.length / 3).fill(0);
  return {
    positions,
    faces,
    faceLevels: levels,
  };
}

export function cloneMesh(mesh) {
  return {
    positions: mesh.positions.slice(),
    faces: mesh.faces.slice(),
    faceLevels: mesh.faceLevels.slice(),
  };
}

export function getVertexCount(mesh) {
  return mesh.positions.length / 3;
}

export function getFaceCount(mesh) {
  return mesh.faces.length / 3;
}

export function computeBounds(mesh) {
  const positions = mesh.positions;
  let minX = Infinity;
  let minY = Infinity;
  let minZ = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  let maxZ = -Infinity;

  for (let i = 0; i < positions.length; i += 3) {
    const x = positions[i];
    const y = positions[i + 1];
    const z = positions[i + 2];
    if (x < minX) minX = x;
    if (y < minY) minY = y;
    if (z < minZ) minZ = z;
    if (x > maxX) maxX = x;
    if (y > maxY) maxY = y;
    if (z > maxZ) maxZ = z;
  }

  const spanX = Math.max(maxX - minX, 1e-6);
  const spanY = Math.max(maxY - minY, 1e-6);
  const spanZ = Math.max(maxZ - minZ, 1e-6);

  return {
    minX,
    minY,
    minZ,
    maxX,
    maxY,
    maxZ,
    spanX,
    spanY,
    spanZ,
    centerX: (minX + maxX) * 0.5,
    centerY: (minY + maxY) * 0.5,
    centerZ: (minZ + maxZ) * 0.5,
  };
}

export function buildTopology(mesh) {
  const vertexCount = getVertexCount(mesh);
  const neighborSets = Array.from({ length: vertexCount }, () => new Set());
  const edgeCounts = new Map();
  const faces = mesh.faces;

  const trackEdge = (a, b) => {
    const key = a < b ? `${a}|${b}` : `${b}|${a}`;
    edgeCounts.set(key, (edgeCounts.get(key) ?? 0) + 1);
    neighborSets[a].add(b);
    neighborSets[b].add(a);
  };

  for (let i = 0; i < faces.length; i += 3) {
    const a = faces[i];
    const b = faces[i + 1];
    const c = faces[i + 2];
    trackEdge(a, b);
    trackEdge(b, c);
    trackEdge(c, a);
  }

  const boundaryVertices = new Set();
  for (const [key, count] of edgeCounts) {
    if (count !== 1) continue;
    const parts = key.split("|");
    boundaryVertices.add(Number(parts[0]));
    boundaryVertices.add(Number(parts[1]));
  }

  return {
    neighbors: neighborSets.map((set) => Array.from(set)),
    boundaryVertices,
  };
}
