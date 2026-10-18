# 260311_Vault

A local parametric vault study with historical rib-graph analysis, recursive triangular subdivision, editable face-rule inheritance, and worm's-eye visualization. The default historical workspace presents all 16 examples from FinalReview_Pate_O'Hare in a comparative source/seed/recursion atlas. The Phase II surface atlas and its 24 controlled variations remain separate from the historical analysis.

## Features
- Sixteen PDF-ordered cases with an atlas and case dropdown: Lincoln, Reims, Amiens, Chartres, St Giles, Gloucester I, Bristol, Exeter, Ely, Winchester, Wells, Gloucester II, Westminster, Gloucester III, Sherborne and King's College.
- Matching triangle plans and flat-faced 3D models, generating quarters, mirror axes, and five plan/3D stages from seed 0 through recursion 4.
- Exeter uses a denser unequal fan: four longitudinal-sector triangles and two transverse-sector triangles per quarter. No smooth arch or conoid surface is used in the active historical view.
- Export the complete 16-case seed/first-pass symmetry atlas as a standalone SVG (without third-party photographs).
- Editable recursion, bay proportions, rise, split ratio, signed lift and decay; export triangle SVG, JSON or OBJ.
- Explicit evidence ledger: documented observations, proposed operators, missing survey calibration. Symmetry is imposed in the analytical model, not asserted as exact in the building.
- Four case-study tabs: quadripartite, sexpartite, Tierceron I and Tierceron II, linked to Phase II reference sheets 19, 17, 16 and 18.
- Side-by-side reference and generated views, explicit evidence limitations, seed plans, subdivision/inheritance glyphs and five-pass sequences.
- A 4-by-6 exploration matrix: baseline, low relief, high relief, shifted edge evaluation, A/B alternation and mixed A/B/C inheritance.
- Common matrix camera scale, recursion depth 1-5, printable figure sheets and reproducible JSON parameter exports. Each sample opens its exact configuration in the rule editor.
- A single offscreen renderer makes static previews; only the selected case is an interactive orbit view, avoiding browser WebGL context limits.
- Vault dropdown: Rhino-derived Tierceron II, quadripartite, sexpartite, tierceron, and stellar studies.
- Rules A/B/C with editable edge evaluation position and signed vertical lift.
- Numbered seed-face assignment and independent inheritance for three corner children and the centre child.
- Shared-edge evaluation, mirrored quarter assembly, and one- or two-bay views.
- Recursion depth 0-5, coloured face families, mouse orbit, zoom, pan, and five-step diagrams.
- OBJ export at the selected depth; shareable URLs preserve the complete rule configuration.
- Local Three.js assets, reference images and Rhino models, and automated geometry/research tests.

## Getting Started
1. Install Node.js if it is not already available.
2. Run npm start from this directory. No npm dependency installation is required.
3. Open http://127.0.0.1:8011/.
4. Run npm test to check geometry and inheritance.

## Controls
The landing page starts with a 16-case atlas. Each card compares a reference, primary quadrant folds and a developed triangulated plan. The coloured A/B triangles identify one quadrant; the red axes show how it reflects into a bay. Westminster isolates one bay between adjacent column lines, with fan sectors entering from its four corners. Lincoln uses a horizontally reflected full-bay C9 graph to retain its stagger.

The first plan division follows a case-specific grammar in serial/plan-grammar.mjs: unequal rays for tiercerons, staggered liernes for Ely/Winchester/Gloucester II, rotated octagonal compartments for Wells, and angular rays with radial bands for the fan vaults. Segment intersections become shared vertices before planar cells are triangulated, so faces cover the quadrant without crossings or gaps. All triangle edges share one line weight across cases, recursion stages and SVG exports. Bristol inserts one centroid per triangle and connects it to all three vertices, recursively producing three children. Other families use four-child edge subdivision after their first plan division. Parent vertices remain fixed; A/B/C weights control signed vertical displacement.

Change recursion, aspect, rise, split, lift and decay; drag the model to orbit. The plan and 3D model use exactly the same triangles. The Wells reference shows one bay with multiple compartments. Ely now uses the clearer Hotham's Choir C8 survey, replacing the Lady Chapel reference. All source bays have vertical long axes. Generated reference plans are interpretive illustrations, identified separately from survey plans. St Giles requires permission before publishing a transformed derivative.

The surface atlas offers four Phase II case tabs and a parametric exploration tab. Change the global depth, orbit the generated case view, print the active sheet, or export its parameters. Matrix cards open the detailed editor. The matrix is exploratory: only the Tierceron II all-A baseline is calibrated to recovered Rhino geometry.

Choose a vault type, recursion depth, rise, decay, and assembly. Click a numbered seed triangle to cycle A/B/C, or use its selector. Edit each rule's t and signed lift, then assign rules to its four children. Inheritance acts in the following subdivision pass. Shared edges average their incident rule families once to prevent cracks. Drag either large model to orbit, use the wheel to zoom, and right-drag to pan. Reset views restores the worm's-eye orientation. Export OBJ writes the current assembled mesh.

## Reference Fidelity
The Rhino-derived seed and directed subdivision connectivity come from References/MeshTest_1.3dm. The all-A presets reproduce its length-based displacement rule: evaluate at t = 0.5 or 0.6, then raise by 0.3 times the current 3D edge length. Other vault types are procedural studies, not verified reproductions of the reference models. The source objects do not explicitly identify Tierceron_2 by name.

FinalReview_Pate_O'Hare.pdf supplies named building photographs and abstract plan/rule decompositions. The historical workspace selects Reims, Exeter, Wells and Gloucester as a proposed comparative corpus. Exeter's tierceron, Wells' lierne and Gloucester cloister fan-vault classifications are supported by linked research/cathedral sources. The review does not establish a measured one-to-one correspondence between every anonymous plan and building. Its building-start captions must not be used to date the photographed vaults.

Measured rib plans, section profiles and independent model comparisons remain necessary before publication. Source images and generated views are not registered, so the atlas does not claim a visual similarity score. The historical view now uses explicit triangle seeds and recursive edge displacement; the previous rounded-envelope engine in serial/history.mjs is retained only as an inactive experiment. The supplied Gokmen et al. (2023) muqarnas article informs the figure sequence and comparison matrix, not the Gothic geometry or algorithm rules.

The runtime needs no Python dependencies. To regenerate the reference measurements, install rhino3dm for Python and run python scripts/extract-rhino.py. See serial/README.md for additional method notes.

## Earlier Studies
Earlier implementations remain available at /original.html and /serial/legacy.html. The latest default page is /serial/history.html; the Phase II surface atlas is /serial/research.html and the full rule editor is /serial/rhino.html. Existing landing links containing a saved config still open the editor; links with a case query open the surface atlas.

## Online Image Provenance
The original downloaded plates are retained unchanged under serial/assets/history/. Reims, Amiens, St Giles, Winchester and King's College use generated orthographic reconstructions based on source photographs. Wells, Gloucester II and Westminster use generated single-bay reconstructions from the supplied photographs, which are retained alongside the new assets. Westminster's supplied photograph is attributed to David Lambert. Ely C8 uses a dedicated high-resolution survey plate. Source URLs, authors and rights notes are recorded in serial/source-images.mjs. Generated plans are interpretive visual references, not measured surveys; publication rights for supplied photographs remain unverified. Regenerate the diagram-only paper atlas with node scripts/export-vault-atlas.mjs.
