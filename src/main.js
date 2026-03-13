import { generateBaseVault } from "./vaultGenerator.js";
import { subdivideRecursive } from "./subdivision.js";
import { applyFinalTransform } from "./transform.js";
import { createViewer } from "./viewer.js";
import { createUI } from "./ui.js";
import {
  downloadText,
  meshToNetworkJSON,
  meshToOBJ,
  meshToSTL,
} from "./exporters.js";

const defaultParams = {
  baseWidth: 12,
  vaultHeight: 9,
  baseTriangles: 8,
  recursionDepth: 4,
  smoothingIterations: 0,
  maxFaces: 260000,
  recursionPattern: "cascade",
  displacementStart: 0.62,
  displacementEnd: 0.12,
  evaluationStart: 4,
  evaluationEnd: 14,
  axialWeightStart: 0.72,
  axialWeightEnd: 0.44,
  archExponentStart: 1.35,
  archExponentEnd: 2.05,
  customDisplacementPattern: "0.62,0.42,0.28,0.18,0.12",
  customEvaluationPattern: "4,6,8,11,14",
  shaded: true,
  wireframe: true,
  showRecursion: false,
};

const viewerContainer = document.getElementById("viewer");
const viewer = createViewer(viewerContainer);

let params = { ...defaultParams };
let currentMesh = null;
let rebuildQueued = false;
let ui = null;

function formatNumber(value) {
  return Number(value).toLocaleString();
}

function buildVault() {
  const baseMesh = generateBaseVault(params);
  const recursive = subdivideRecursive(baseMesh, params);
  const finalMesh = applyFinalTransform(recursive.mesh);
  currentMesh = finalMesh;
  viewer.setMesh(finalMesh, params);

  const vertexCount = finalMesh.positions.length / 3;
  const faceCount = finalMesh.faces.length / 3;
  const cappedSuffix = recursive.capped ? " (capped by max face budget)" : "";
  ui.updateStats(
    `Vertices ${formatNumber(vertexCount)} | Triangles ${formatNumber(faceCount)} | Midpoint Passes ${recursive.appliedPasses}/${recursive.requestedPasses}${cappedSuffix}`,
  );
}

function queueRebuild() {
  if (rebuildQueued) return;
  rebuildQueued = true;
  requestAnimationFrame(() => {
    rebuildQueued = false;
    buildVault();
  });
}

function timestamp() {
  return new Date().toISOString().replace(/[:.]/g, "-");
}

function exportMesh(type) {
  if (!currentMesh) return;
  const stamp = timestamp();

  if (type === "obj") {
    downloadText(`260311_Vault-${stamp}.obj`, meshToOBJ(currentMesh), "text/plain");
    return;
  }
  if (type === "stl") {
    downloadText(`260311_Vault-${stamp}.stl`, meshToSTL(currentMesh), "text/plain");
    return;
  }
  if (type === "network") {
    downloadText(
      `260311_Vault-network-${stamp}.json`,
      meshToNetworkJSON(currentMesh),
      "application/json",
    );
  }
}

ui = createUI(defaultParams, {
  onParamsChange(next) {
    params = next;
    queueRebuild();
  },
  onDisplayChange(next) {
    params = next;
    if (currentMesh) viewer.setMesh(currentMesh, params);
  },
  onExport(type) {
    exportMesh(type);
  },
});

queueRebuild();

window.addEventListener("beforeunload", () => {
  ui.dispose();
  viewer.dispose();
});
