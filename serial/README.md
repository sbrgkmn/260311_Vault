# 260311_Vault

## Recursive Edge Rules

Run npm start and open http://127.0.0.1:8011/serial/.
No installation/build is required. Run npm test for geometry checks.
The original generator remains at /index.html.

Each triangle has edges A, B and C. Each of two editable rules specifies:
- t: evaluation position along the directed edge, between 0.1 and 0.9.
- deltaY: signed vertical displacement coefficient, between -1.5 and 1.5.

The repeating cycle selects one complete rule for every triangle in a pass.
For example 1,2 produces 1,2,1,2,1; 1,1,2 produces 1,1,2,1,1.
Rule 1 defaults to positive displacement on all three edges; Rule 2 defaults
to negative displacement. Both can be edited independently, including mixed signs.
Expansion/contraction describe displacement, not guaranteed volume changes.

For each edge:
P = (1-t)*start + t*end
P.y += 0.56 * rise * fold * (0.5*retention)^(pass-1) * rule.deltaY

Connect the evaluated points to form the central triangle and three corner
triangles. Previous vertices remain fixed. Each child inherits one A/B/C edge:
outer half-edges keep their parent's label and direction; each internal edge
inherits the opposite parent edge's label and corresponding direction. Labels
are topological, never inferred from slope, axis or deformed edge direction.
A shared edge is evaluated exactly once, so its two incident faces always use
the same point and displacement even when t differs from 0.5.

Seed directions: A springing-to-crown; B crown-to-shoulder;
C shoulder-to-springing. Every later arrow follows this inherited convention.

The study switches between a single wedge, eight mirrored copies in one bay,
and 1-3 serial bays. All assembly copies are rigid reflections with welded seams.
A wedge has 4^pass faces. The atlas compares four rule-cycle presets. Rules and
cycle are saved in the study URL. Legacy asymmetry/series URL values are ignored.

The PDF excerpts remain a visual reference, not evidence for numerical defaults.
This implements the user's explicit two-rule interpretation; it does not claim
to recover the source's numerical algorithm or provide structural analysis.

Tests cover A/B/C inheritance on every child, directed interpolation, rule-cycle
selection, shared points, non-midpoint evaluation, manifold topology, symmetric
copies, welded bays, fixed earlier vertices, sign inversion, deterministic
prefixes, bounds, URL round trips and OBJ indices.

## Tierceron II Spatial Study

Select Tierceron II (legacy URL family=stellar), or open
/serial/?family=stellar&assembly=vault&bays=2&step=5.
This is a separate geometric approximation, not another global rule cycle.
The two-rule controls are hidden because they do not drive this preset.

References: PDF pages 10-11 show FA-FE developments; page 15 marks A-E regions;
page 18 shows the Tierceron II target. Target/region images are displayed on-page.
A compound triangular patch starts with three elongated springing triangles
and nine upper triangles carrying five persistent face identities. This seed
layout and all numerical coefficients are inferred, not recovered source data.

Each edge is bisected. Its upward arch component depends on its own parent
height difference, radial alignment, and position toward the crown. A signed
transverse component creates raised/recessed crown folds. Adjacent regions use
one averaged displacement at their shared edge. Children keep the parent face
family, unlike the earlier global up/down cycles. Prior vertices never move.
Rise defaults to 2.35; fold amplitude scales both components; retention controls
the fine scallop component. No position smoothing is used. Clay shading averages
vertex normals only; mesh mode exposes the unchanged triangulation.

A compound wedge has 12*4^pass faces; eight reflected wedges form a bay.
Two bays at pass 5 have 196,608 triangles. This attempt has a different silhouette
and spatial rule structure, but is not an exact reproduction of the reference.

## Five-step diagram

Open /serial/diagram.html for Tierceron II passes 1-5 side by side, at a shared
orthographic worm's-eye projection and scale. Geometry is unchanged. Black faces
occlude rear white mesh lines; fine lines use lower opacity at the last passes.
The white sheet has no modeling controls. Export PNG downloads the full five-panel
diagram. On narrow screens the complete row scrolls horizontally. Parameters
(rise, fold, decay, bays) are preserved from the study link.

## Rhino-calibrated reconstruction

Open /serial/rhino.html for measured-source versus parametric comparison and five worm's-eye passes. The previous image-derived Tierceron II remains unchanged.

MeshTest_1.3dm object ranges 0-32767 and 32768-65535 contain two baked vault studies. Reversing groups of four faces recovers four seed triangles per quarter, five passes and 4096 faces per quarter. Both use P = lerp(A,B,t) + vertical(0.3 * length3D(B-A)); t is 0.5 in A and 0.6 in B. Directed-edge topology is retained from the source, while all parametric offsets are recomputed, not replayed. Rise, t, signed lift and optional decay are adjustable. Four mirrored quarters form a bay.

The source files do not identify Tierceron_2 by object or layer name. The named image remains a visual reference, not a verified model label. Star_Vault_Mesh_offset (1).3dm contains 69 mesh objects including print-offset assemblies and is not the calibration source.

Extraction: python scripts/extract-rhino.py, using rhino3dm (installed locally under tmp/rhino-reader). Generated measurements: serial/assets/rhino-recursion.json. Tests: npm test. Default formula matches every recovered quarter vertex within 1e-5 half-span units over all five passes; the UI's 0.01 rise slider introduces minor rounding. OBJ export supports importing parametric variations into Rhino.

## Multi-rule landing page

The default site now opens Vault rules at /serial/rhino.html. Choose Rhino-derived Tierceron II, or procedural quadripartite, sexpartite, tierceron and stellar seeds. Each rule A/B/C has edge position and signed lift. Assign seed faces with the numbered plan or selectors; each parent rule maps its three corner children and centre child to their next rule. Shared edges average distinct incident families in a common direction and create one vertex. Inheritance takes effect on the following subdivision. The left orbit view colours the selected quarter by face family. The right view and OBJ export follow selected depth and assembly; the bottom strip shows all five passes. URLs retain the full grammar. All-A Rhino presets retain the calibrated formula; the other types are procedural studies, not claimed source reconstructions. Earlier entry pages are archived as original.html and serial/legacy.html.
