# Vault

Vault is a browser-based parametric generator for recursive triangular vault structures. It starts from a square bay seed (center + symmetric boundary ring), applies midpoint-only recursive subdivision, and deforms the result with symmetric step-based parameter patterns.

## Features
- Parametric base controls: base width, vault height, and base triangle count.
- Default base topology is a square bay with 8 center-connected triangles (corners + edge-midpoint directions).
- Midpoint-only subdivision (`4` children per face) with shared-edge midpoint indexing for adjacency symmetry.
- Symmetry-preserving displacement field (axial/diagonal mirrored, no random per-face variation).
- Step pattern system for recursion parameters (`constant`, `ramp`, `pulse`, `custom` lists).
- Height and width are decoupled in plan: changing `Vault Height` does not modify XY span.
- Face budget capping for interactive performance at higher recursion levels.
- Real-time WebGL rendering with orbit controls, shaded mode, wireframe mode, and recursion-level color visualization.
- Export to OBJ, STL, and indexed triangular network JSON.

## Getting Started
1. Open this folder in a local static server (ES modules should be served over HTTP).
2. Serve from the repository root with one of:
   - `python -m http.server 8000`
   - `npx serve .`
3. Open `http://localhost:8000` in your browser.

## Controls
- `Base`:
  - `Base Width`: overall vault span.
  - `Vault Height`: vertical field scale.
  - `Base Triangles`: radial sectors projected to a square boundary; use `8` for the square-center 8-triangle layout.
- `Recursion`:
  - `Depth`: midpoint recursion level.
  - `Smoothing`: optional Laplacian smoothing each pass.
  - `Max Faces`: recursion safety cap.
- `Step Pattern`:
  - `Pattern`: `constant`, `ramp`, `pulse`, or `custom`.
  - `Disp Start/End`: displacement strength per recursion step.
  - `Eval Start/End`: sampling resolution per recursion step.
  - `Axial Start/End`: blend between axial and diagonal wave families.
  - `Arch Start/End`: envelope exponent controlling vault falloff.
  - `Custom Disp List`: explicit per-step displacement list (comma-separated, for `custom` mode).
  - `Custom Eval List`: explicit per-step evaluation list (comma-separated, for `custom` mode).
- `Visualization`:
  - `Shaded`: shaded surface display.
  - `Wireframe`: structural wireframe overlay.
  - `Recursion Colors`: per-recursion-face coloring.
- `Output`:
  - `Export OBJ`, `Export STL`, `Download Network`.
