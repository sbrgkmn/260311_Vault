import * as THREE from 'three';
import { OrbitControls } from './vendor/OrbitControls.js';

export function createViewer(container, { compact = false, onCameraChange, view = 'vault', diagram = false, freeOrbit = false, faceFamilies = false } = {}) {
  const scene = new THREE.Scene();
  const camera = diagram ? new THREE.OrthographicCamera(-1, 1, 1, -1, .01, 100) : new THREE.PerspectiveCamera(35, 1, .01, 100);
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, compact && !diagram ? 1.5 : 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.02;
  renderer.domElement.setAttribute('aria-label', 'Interactive vault model viewed from below');
  renderer.domElement.setAttribute('role', 'img');
  container.appendChild(renderer.domElement);
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enablePan = !compact;
  controls.enableZoom = !compact;
  controls.enableRotate = !compact;
  controls.minDistance = 2;
  controls.maxDistance = 24;
  // Polar angles above pi/2 keep the camera underneath the vault.
  controls.minPolarAngle = Math.PI * 0.54;
  controls.maxPolarAngle = Math.PI * 0.96;
  if (freeOrbit) {
    controls.minPolarAngle = .01;
    controls.maxPolarAngle = Math.PI - .01;
    controls.minZoom = .25;
    controls.maxZoom = 12;
  }
  scene.add(new THREE.AmbientLight(0xcdd9df, 0.65));
  const key = new THREE.DirectionalLight(0xffecd5, 2.5);
  key.position.set(-3, -5, 4);
  scene.add(key);
  const rim = new THREE.DirectionalLight(0xa4c1d4, 0.95);
  rim.position.set(4, -1, -5);
  scene.add(rim);
  const upper = new THREE.DirectionalLight(0xfff5e6, 2.0);
  upper.position.set(-2, 5, 3);
  scene.add(upper);
  const group = new THREE.Group();
  scene.add(group);
  const material = diagram
    ? new THREE.MeshBasicMaterial({ color: 0x000000, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 1, toneMapped: false })
    : new THREE.MeshStandardMaterial({ color: 0xd8d3c5, roughness: 0.94, metalness: 0, side: THREE.DoubleSide, flatShading: true, polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 1 });
  const wireMaterial = new THREE.LineBasicMaterial({ color: 0x30434b, transparent: true, opacity: 0.42 });
  const newMaterial = new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, opacity: 0.75 });
  const guideMaterial = new THREE.LineDashedMaterial({ color: 0xd2ac81, transparent: true, opacity: .55, dashSize: .025, gapSize: .018 });
  const signedMaterial = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.94, side: THREE.DoubleSide, flatShading: true, polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 1 });
  const positive = new THREE.Color(0xd29162), negative = new THREE.Color(0x619fb7), neutral = new THREE.Color(0xd8d3c5);
  let surface, wire, fresh, guide, data, savedBounds;
  let mode = 'surface';
  let highlight = false;
  let disposed = false;
  let syncing = false;
  let framed = false;

  function render() { if (!disposed) renderer.render(scene, camera); }
  controls.addEventListener('change', () => {
    render();
    if (!syncing && onCameraChange) onCameraChange({ position: camera.position.toArray(), target: controls.target.toArray() });
  });

  function clear() {
    while (group.children.length) {
      const child = group.children[0];
      child.geometry.dispose();
      group.remove(child);
    }
  }

  function frame() {
    if (!savedBounds) return;
    const { center, radius } = savedBounds;
    if (diagram) {
      camera.zoom = 1;
      const aspect = container.clientWidth / Math.max(container.clientHeight, 1);
      const halfHeight = Math.max(savedBounds.projectedHeight / 2, savedBounds.projectedWidth / (2 * aspect)) * 1.10;
      camera.left = -halfHeight * aspect; camera.right = halfHeight * aspect;
      camera.top = halfHeight; camera.bottom = -halfHeight;
      camera.updateProjectionMatrix();
      controls.target.copy(center);
      camera.position.copy(center).add(DIAGRAM_DIRECTION.clone().multiplyScalar(radius * 4 + 1));
      camera.lookAt(center);
      controls.update(); render();
      return;
    }
    const vertical = THREE.MathUtils.degToRad(camera.fov / 2);
    const horizontal = Math.atan(Math.tan(vertical) * camera.aspect);
    const distance = radius / Math.sin(Math.min(vertical, horizontal)) * (compact ? 1.02 : 1.04);
    controls.target.copy(center);
    controls.minPolarAngle = view === 'wedge' ? .08 : Math.PI * .54;
    controls.maxPolarAngle = Math.PI * .96;
    upper.visible = view === 'wedge';
    camera.position.copy(center).add((view === 'wedge' ? new THREE.Vector3(-1.5, 1.3, 2.8) : new THREE.Vector3(.83, -.90, 1.15)).normalize().multiplyScalar(distance));
    camera.lookAt(center);
    controls.update();
    render();
  }

  function setMesh(mesh, bounds) {
    clear();
    data = mesh;
    if (bounds) savedBounds = bounds;
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(mesh.positions, 3));
    geometry.setIndex(mesh.faces);
    if (mesh.smoothNormals) geometry.computeVertexNormals();
    const flat = geometry.toNonIndexed();
    if (!mesh.smoothNormals) flat.computeVertexNormals();
    material.flatShading = !mesh.smoothNormals;
    material.needsUpdate = true;
    const faceColors = [];
    for (let i = 0; i < mesh.faces.length; i += 3) {
      const indices = mesh.faces.slice(i, i + 3).filter(index => mesh.births[index] === mesh.level);
      const offset = indices.reduce((sum, index) => sum + mesh.offsets[index], 0);
      const color = faceFamilies ? new THREE.Color({A:0xb56d43,B:0x467f92,C:0xa5a24c}[mesh.types[i/3]] || 0xd8d3c5) : Math.abs(offset) < 1e-10 ? neutral : offset > 0 ? positive : negative;
      for (let corner = 0; corner < 3; corner++) faceColors.push(color.r, color.g, color.b);
    }
    flat.setAttribute('color', new THREE.Float32BufferAttribute(faceColors, 3));
    geometry.dispose();
    surface = new THREE.Mesh(flat, material);
    group.add(surface);
    const unique = new Set();
    const lines = [], newLines = [], newColors = [];
    for (let i = 0; i < mesh.faces.length; i += 3) {
      for (let e = 0; e < 3; e++) {
        const a = mesh.faces[i + e], b = mesh.faces[i + (e + 1) % 3];
        const key = a < b ? `${a}:${b}` : `${b}:${a}`;
        if (unique.has(key)) continue;
        unique.add(key);
        const segment = [...mesh.positions.slice(a * 3, a * 3 + 3), ...mesh.positions.slice(b * 3, b * 3 + 3)];
        lines.push(...segment);
        if (mesh.level > 0 && mesh.births[a] === mesh.level && mesh.births[b] === mesh.level) {
          newLines.push(...segment);
          for (const index of [a, b]) {
            const color = mesh.offsets[index] > 0 ? positive : mesh.offsets[index] < 0 ? negative : neutral;
            newColors.push(color.r, color.g, color.b);
          }
        }
      }
    }
    const lineGeometry = new THREE.BufferGeometry().setAttribute('position', new THREE.Float32BufferAttribute(lines, 3));
    wire = new THREE.LineSegments(lineGeometry, wireMaterial);
    // Draw every triangle edge after the black surface, keeping hidden-line occlusion.
    if (diagram) wire.renderOrder = 1;
    group.add(wire);
    fresh = new THREE.LineSegments(new THREE.BufferGeometry()
      .setAttribute('position', new THREE.Float32BufferAttribute(newLines, 3))
      .setAttribute('color', new THREE.Float32BufferAttribute(newColors, 3)), newMaterial);
    group.add(fresh);
    guide = null;
    if (mesh.seedPositions && !diagram) {
      const segments = [0, 1, 1, 2, 2, 0].flatMap(index => mesh.seedPositions.slice(index * 3, index * 3 + 3));
      guide = new THREE.LineSegments(new THREE.BufferGeometry().setAttribute('position', new THREE.Float32BufferAttribute(segments, 3)), guideMaterial);
      guide.computeLineDistances();
      group.add(guide);
    }
    setDisplay(mode, highlight);
    if (!framed) { frame(); framed = true; }
    render();
  }

  function setDisplay(nextMode, nextHighlight) {
    mode = nextMode;
    highlight = nextHighlight;
    if (!surface) return;
    surface.visible = mode !== 'wire';
    surface.material = faceFamilies || highlight && !diagram ? signedMaterial : material;
    wire.visible = mode !== 'clay';
    wireMaterial.color.setHex(diagram ? 0xffffff : mode === 'wire' ? 0xc7d2cd : 0x30434b);
    wireMaterial.opacity = diagram ? .6 : mode === 'wire' ? .66 : (data.level > 3 ? .25 : .42);
    wireMaterial.transparent = true;
    wireMaterial.depthWrite = !diagram;
    wireMaterial.toneMapped = !diagram;
    fresh.visible = !diagram && highlight && mode !== 'clay';
    render();
  }

  const observer = new ResizeObserver(() => {
    const width = container.clientWidth, height = container.clientHeight;
    if (width <= 0 || height <= 0) return;
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
    frame();
  });
  observer.observe(container);

  return {
    setMesh, setDisplay, reset: frame,
    setView(nextView) {
      view = nextView;
      renderer.domElement.setAttribute('aria-label', view === 'wedge' ? 'Interactive single wedge reconstruction' : 'Interactive symmetric vault viewed from below');
      frame();
    },
    syncCamera(view) {
      syncing = true;
      camera.position.fromArray(view.position);
      controls.target.fromArray(view.target);
      controls.update();
      render();
      syncing = false;
    },
    saveImage(name) {
      render();
      const link = document.createElement('a');
      link.download = name;
      link.href = renderer.domElement.toDataURL('image/png');
      link.click();
    },
    dispose() {
      disposed = true;
      observer.disconnect();
      controls.dispose();
      clear();
      material.dispose(); signedMaterial.dispose(); wireMaterial.dispose(); newMaterial.dispose(); guideMaterial.dispose();
      renderer.dispose(); renderer.forceContextLoss(); renderer.domElement.remove();
    },
  };
}

export function boundsFor(meshes) {
  const box = new THREE.Box3();
  const point = new THREE.Vector3();
  for (const mesh of meshes) {
    for (let i = 0; i < mesh.positions.length; i += 3) box.expandByPoint(point.fromArray(mesh.positions, i));
  }
  const sphere = box.getBoundingSphere(new THREE.Sphere());
  return { center: sphere.center, radius: sphere.radius };
}

const DIAGRAM_DIRECTION = new THREE.Vector3(.65, -1.65, 1.15).normalize();

export function diagramBoundsFor(meshes) {
  const right = new THREE.Vector3().crossVectors(new THREE.Vector3(0, 1, 0), DIAGRAM_DIRECTION).normalize();
  const up = new THREE.Vector3().crossVectors(DIAGRAM_DIRECTION, right).normalize();
  const bounds = boundsFor(meshes), point = new THREE.Vector3();
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  for (const mesh of meshes) for (let i = 0; i < mesh.positions.length; i += 3) {
    point.fromArray(mesh.positions, i);
    const x = point.dot(right), y = point.dot(up);
    minX = Math.min(minX, x); maxX = Math.max(maxX, x);
    minY = Math.min(minY, y); maxY = Math.max(maxY, y);
  }
  bounds.center.addScaledVector(right, (minX + maxX) / 2 - bounds.center.dot(right));
  bounds.center.addScaledVector(up, (minY + maxY) / 2 - bounds.center.dot(up));
  return { ...bounds, projectedWidth: maxX - minX, projectedHeight: maxY - minY };
}
