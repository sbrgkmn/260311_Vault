function triangleNormal(ax, ay, az, bx, by, bz, cx, cy, cz) {
  const abx = bx - ax;
  const aby = by - ay;
  const abz = bz - az;
  const acx = cx - ax;
  const acy = cy - ay;
  const acz = cz - az;
  const nx = aby * acz - abz * acy;
  const ny = abz * acx - abx * acz;
  const nz = abx * acy - aby * acx;
  const len = Math.hypot(nx, ny, nz) || 1;
  return [nx / len, ny / len, nz / len];
}

export function meshToOBJ(mesh) {
  const lines = ["# Recursive Vault OBJ"];
  const positions = mesh.positions;
  const faces = mesh.faces;

  for (let i = 0; i < positions.length; i += 3) {
    lines.push(`v ${positions[i]} ${positions[i + 1]} ${positions[i + 2]}`);
  }

  for (let i = 0; i < faces.length; i += 3) {
    lines.push(`f ${faces[i] + 1} ${faces[i + 1] + 1} ${faces[i + 2] + 1}`);
  }

  return `${lines.join("\n")}\n`;
}

export function meshToSTL(mesh) {
  const positions = mesh.positions;
  const faces = mesh.faces;
  const lines = ["solid recursive_vault"];

  for (let i = 0; i < faces.length; i += 3) {
    const ai = faces[i] * 3;
    const bi = faces[i + 1] * 3;
    const ci = faces[i + 2] * 3;

    const ax = positions[ai];
    const ay = positions[ai + 1];
    const az = positions[ai + 2];
    const bx = positions[bi];
    const by = positions[bi + 1];
    const bz = positions[bi + 2];
    const cx = positions[ci];
    const cy = positions[ci + 1];
    const cz = positions[ci + 2];

    const [nx, ny, nz] = triangleNormal(ax, ay, az, bx, by, bz, cx, cy, cz);
    lines.push(`  facet normal ${nx} ${ny} ${nz}`);
    lines.push("    outer loop");
    lines.push(`      vertex ${ax} ${ay} ${az}`);
    lines.push(`      vertex ${bx} ${by} ${bz}`);
    lines.push(`      vertex ${cx} ${cy} ${cz}`);
    lines.push("    endloop");
    lines.push("  endfacet");
  }

  lines.push("endsolid recursive_vault");
  return `${lines.join("\n")}\n`;
}

export function meshToNetworkJSON(mesh) {
  return JSON.stringify(
    {
      metadata: {
        format: "indexed-triangular-network",
        vertexCount: mesh.positions.length / 3,
        faceCount: mesh.faces.length / 3,
      },
      positions: mesh.positions,
      faces: mesh.faces,
      faceLevels: mesh.faceLevels,
    },
    null,
    2,
  );
}

export function downloadText(name, text, mimeType = "text/plain") {
  const blob = new Blob([text], { type: `${mimeType};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = name;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}
