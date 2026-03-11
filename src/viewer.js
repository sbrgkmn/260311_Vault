import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

function buildIndexedGeometry(mesh) {
  const geometry = new THREE.BufferGeometry();
  const positions = Float32Array.from(mesh.positions);
  const vertexCount = mesh.positions.length / 3;
  const indexArray =
    vertexCount > 65535 ? Uint32Array.from(mesh.faces) : Uint16Array.from(mesh.faces);

  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setIndex(new THREE.BufferAttribute(indexArray, 1));
  geometry.computeVertexNormals();
  geometry.computeBoundingSphere();
  return geometry;
}

function buildPalette(maxLevel) {
  const palette = new Array(maxLevel + 1);
  const color = new THREE.Color();
  for (let i = 0; i <= maxLevel; i += 1) {
    const t = maxLevel === 0 ? 0 : i / maxLevel;
    color.setHSL(0.64 - t * 0.54, 0.75, 0.52);
    palette[i] = [color.r, color.g, color.b];
  }
  return palette;
}

function buildRecursionGeometry(mesh) {
  const faceCount = mesh.faces.length / 3;
  const outPositions = new Float32Array(faceCount * 9);
  const outColors = new Float32Array(faceCount * 9);
  let maxLevel = 0;
  for (let i = 0; i < mesh.faceLevels.length; i += 1) {
    if (mesh.faceLevels[i] > maxLevel) maxLevel = mesh.faceLevels[i];
  }
  const palette = buildPalette(maxLevel);

  let out = 0;
  for (let face = 0; face < faceCount; face += 1) {
    const faceIndex = face * 3;
    const color = palette[mesh.faceLevels[face] ?? 0];

    for (let corner = 0; corner < 3; corner += 1) {
      const vertexIndex = mesh.faces[faceIndex + corner] * 3;
      outPositions[out] = mesh.positions[vertexIndex];
      outColors[out] = color[0];
      out += 1;
      outPositions[out] = mesh.positions[vertexIndex + 1];
      outColors[out] = color[1];
      out += 1;
      outPositions[out] = mesh.positions[vertexIndex + 2];
      outColors[out] = color[2];
      out += 1;
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(outPositions, 3));
  geometry.setAttribute("color", new THREE.BufferAttribute(outColors, 3));
  geometry.computeVertexNormals();
  geometry.computeBoundingSphere();
  return geometry;
}

export function createViewer(container) {
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(
    50,
    container.clientWidth / Math.max(1, container.clientHeight),
    0.1,
    2000,
  );
  camera.up.set(0, 0, 1);
  camera.position.set(0, -20, 15);

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(container.clientWidth, container.clientHeight);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.03;
  container.appendChild(renderer.domElement);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.target.set(0, 0, 2);

  const ambient = new THREE.AmbientLight(0xffffff, 0.6);
  scene.add(ambient);

  const key = new THREE.DirectionalLight(0xfff7d6, 1.05);
  key.position.set(18, -14, 24);
  scene.add(key);

  const rim = new THREE.DirectionalLight(0x9bc0ff, 0.75);
  rim.position.set(-16, 15, 10);
  scene.add(rim);

  const placeholder = new THREE.BufferGeometry();
  const shadedMaterial = new THREE.MeshStandardMaterial({
    color: 0xd3d0c6,
    roughness: 0.63,
    metalness: 0.08,
    side: THREE.DoubleSide,
  });
  const recursionMaterial = new THREE.MeshStandardMaterial({
    vertexColors: true,
    roughness: 0.6,
    metalness: 0.07,
    side: THREE.DoubleSide,
  });
  const wireMaterial = new THREE.MeshBasicMaterial({
    color: 0x1c2b35,
    wireframe: true,
    transparent: true,
    opacity: 0.5,
    depthWrite: false,
  });

  const surfaceMesh = new THREE.Mesh(placeholder, shadedMaterial);
  const wireMesh = new THREE.Mesh(placeholder, wireMaterial);
  surfaceMesh.renderOrder = 1;
  wireMesh.renderOrder = 2;
  scene.add(surfaceMesh);
  scene.add(wireMesh);

  let currentGeometry = placeholder;
  let currentMesh = null;
  let recursionMode = false;
  let hasFramed = false;
  let lastPlanSpan = 0;
  let disposed = false;
  let rafId = 0;

  const applyDisplayOptions = (options) => {
    const shaded = Boolean(options.shaded);
    const wireframe = Boolean(options.wireframe);
    surfaceMesh.visible = shaded;
    wireMesh.visible = wireframe;
    surfaceMesh.material = recursionMode ? recursionMaterial : shadedMaterial;
  };

  function frameMesh(geometry) {
    geometry.computeBoundingBox();
    const box = geometry.boundingBox;
    if (!box) return;

    const size = new THREE.Vector3();
    box.getSize(size);
    const center = new THREE.Vector3();
    box.getCenter(center);

    const radius = Math.max(size.x, size.y, size.z, 1);
    controls.target.copy(center);
    camera.position.set(center.x, center.y - radius * 1.7, center.z + radius * 1.15);
    camera.near = Math.max(0.01, radius * 0.01);
    camera.far = radius * 40;
    camera.updateProjectionMatrix();
  }

  function setMesh(mesh, options) {
    const showRecursion = Boolean(options.showRecursion);
    const needsNewGeometry =
      currentMesh !== mesh || recursionMode !== showRecursion || currentGeometry === placeholder;

    if (needsNewGeometry) {
      const geometry = showRecursion ? buildRecursionGeometry(mesh) : buildIndexedGeometry(mesh);
      if (currentGeometry && currentGeometry !== placeholder) {
        currentGeometry.dispose();
      }
      currentGeometry = geometry;
      surfaceMesh.geometry = geometry;
      wireMesh.geometry = geometry;
      currentMesh = mesh;
      recursionMode = showRecursion;
      geometry.computeBoundingBox();
      const box = geometry.boundingBox;
      if (box) {
        const size = new THREE.Vector3();
        box.getSize(size);
        const planSpan = Math.max(size.x, size.y, 1e-6);
        const spanDrift = lastPlanSpan > 0 ? Math.abs(planSpan - lastPlanSpan) / lastPlanSpan : 1;
        if (!hasFramed || spanDrift > 0.04) {
          frameMesh(geometry);
          hasFramed = true;
          lastPlanSpan = planSpan;
        }
      }
    }

    applyDisplayOptions(options);
  }

  function resize() {
    const width = container.clientWidth;
    const height = container.clientHeight;
    if (width < 1 || height < 1) return;
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
  }

  const tick = () => {
    if (disposed) return;
    controls.update();
    renderer.render(scene, camera);
    rafId = requestAnimationFrame(tick);
  };
  tick();

  const onResize = () => resize();
  window.addEventListener("resize", onResize);

  return {
    setMesh,
    dispose() {
      disposed = true;
      cancelAnimationFrame(rafId);
      window.removeEventListener("resize", onResize);
      if (currentGeometry && currentGeometry !== placeholder) currentGeometry.dispose();
      placeholder.dispose();
      shadedMaterial.dispose();
      recursionMaterial.dispose();
      wireMaterial.dispose();
      controls.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    },
  };
}
