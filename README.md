# 260311_Vault

A local parametric vault study with recursive triangular subdivision, editable face-rule inheritance, and worm's-eye visualization. The default Vault rules page combines a Rhino-calibrated seed with procedural vault types in one interactive workspace.

## Features
- Vault dropdown: Rhino-derived Tierceron II, quadripartite, sexpartite, tierceron, and stellar studies.
- Rules A/B/C with editable edge evaluation position and signed vertical lift.
- Numbered seed-face assignment and independent inheritance for three corner children and the centre child.
- Shared-edge evaluation, mirrored quarter assembly, and one- or two-bay views.
- Recursion depth 0-5, coloured face families, mouse orbit, zoom, pan, and five-step diagrams.
- OBJ export at the selected depth; shareable URLs preserve the complete rule configuration.
- Local Three.js assets, reference images and Rhino models, and 21 automated geometry tests.

## Getting Started
1. Install Node.js if it is not already available.
2. Run npm start from this directory. No npm dependency installation is required.
3. Open http://127.0.0.1:8011/.
4. Run npm test to check geometry and inheritance.

## Controls
Choose a vault type, recursion depth, rise, decay, and assembly. Click a numbered seed triangle to cycle A/B/C, or use its selector. Edit each rule's t and signed lift, then assign rules to its four children. Inheritance acts in the following subdivision pass. Shared edges average their incident rule families once to prevent cracks. Drag either large model to orbit, use the wheel to zoom, and right-drag to pan. Reset views restores the worm's-eye orientation. Export OBJ writes the current assembled mesh.

## Reference Fidelity
The Rhino-derived seed and directed subdivision connectivity come from References/MeshTest_1.3dm. The all-A presets reproduce its length-based displacement rule: evaluate at t = 0.5 or 0.6, then raise by 0.3 times the current 3D edge length. Other vault types are procedural studies, not verified reproductions of the reference models. The source objects do not explicitly identify Tierceron_2 by name.

The runtime needs no Python dependencies. To regenerate the reference measurements, install rhino3dm for Python and run python scripts/extract-rhino.py. See serial/README.md for additional method notes.

## Earlier Studies
Earlier implementations remain available at /original.html and /serial/legacy.html. The previous variation atlas and five-step diagram remain under serial/. The latest default page is /serial/rhino.html.
