// PDF order is retained, including three different Gloucester examples.
// Coordinates and heights below are modelling hypotheses, not survey measurements.
const entry=(id,name,page,type,aspect,shape,note,extra={})=>({id,name,page,type,aspect,shape,note,rise:1.4,lift:.035,decay:.7,symmetry:'D2 / two mirrors',...extra});
export const VAULT_CASES=[
  entry('lincoln','Lincoln',1,'Staggered bosses',1.7,{kind:'staggered'},'The staggered C9 rib graph is reflected horizontally to match the survey image. Its two bosses preserve half-turn symmetry; the full bay is the smallest repeating patch.',{symmetry:'C2 / half-turn seed',lift:.025}),
  entry('reims','Reims',1,'Diagonal',1.5,{long:[0,1],cross:[1]},'The diagonal system is shared with Amiens and Chartres. Similar topology is intentional; proportions are provisional.'),
  entry('amiens','Amiens',2,'Diagonal',1.65,{long:[0,1],cross:[1]},'A four-part diagonal organization, triangulated across the ridge for a flat-faced surface. No extra historical ribs are implied.'),
  entry('chartres','Chartres',2,'Diagonal',1.4,{long:[0,1],cross:[1]},'The same quadripartite topology as Reims and Amiens. Bay proportions require a measured source before comparative claims.'),
  entry('st-giles','St Giles',3,'Tierceron fan',1.5,{long:[0,.2,.4,.65,1],cross:[.45,1]},'Unequal fans converge on ridge targets; the transverse sector is subdivided less densely. The precise bay in the PDF is not identified.'),
  entry('gloucester-early','Gloucester / I',3,'Diagonal + ridge',1.5,{long:[0,1],cross:[1]},'The first Gloucester photograph is kept separate from the later net and cloister vaults. Its simplified diagonal/ridge seed remains provisional.'),
  entry('bristol','Bristol',4,'Three-way face split',1.45,{kind:'centroid'},'Each primary triangle gains a centre point connected to its three vertices, producing three child triangles. This three-way operation repeats on every emerging face.'),
  entry('exeter','Exeter',4,'Unequal fan / 4 + 2',1.6,{long:[0,.25,.5,.75,1],cross:[.5,1]},'C16 has four fan sectors toward the longitudinal ridge and two toward the transverse ridge. Target positions are idealized.',{lift:.07}),
  entry('ely','Ely',5,'Stellar liernes',1.95,{kind:'stellar'},'Hotham\'s Choir C8 replaces the Lady Chapel comparator. A corner fan meets a staggered stellar chain near the crown; intersections become shared mesh vertices.'),
  entry('winchester','Winchester',5,'Lierne ladder',1.6,{kind:'ladder'},'Unequal tierceron rays meet two broken lierne chains. The first division follows this ladder before later triangles subdivide.'),
  entry('wells','Wells',6,'Octagon + diamond cells',1.5,{kind:'compartments'},'The supplied photograph guides a reconstruction of one choir bay. Multiple octagonal and quatrefoil compartments occupy this bay. Their interiors are triangulated using a common line weight.',{decay:.65}),
  entry('gloucester-net','Gloucester / II',6,'Staggered lierne net',1.33,{kind:'net'},'The supplied photograph guides a brighter reconstruction of one presbytery bay. Unequal tierceron rays and staggered cross-links approximate its net; each crossing becomes a shared vertex.'),
  entry('westminster','Westminster',7,'Single-bay pendant fans',1.75,{kind:'pendant'},'One bay is bounded by adjacent column lines in the supplied photograph. Fan sectors enter from its four corners and meet through the central spandrel. The plan excludes the complete fan circles belonging to neighboring bays.',{rise:1.3,lift:.025}),
  entry('gloucester','Gloucester / III',7,'Cloister fan',1,{kind:'radial'},'E3 develops outward from each corner springer. Equal-angle radial divisions and polygonal concentric bands replace the previous displaced fan origin.',{rise:1.2,lift:.055}),
  entry('sherborne','Sherborne',8,'Fan + stellar web',1.5,{kind:'radial'},'Corner-centred fans expand through twelve radial sectors. A zigzag polygonal band introduces the stellar junctions visible in the painted source.'),
  entry('kings','King\'s College',8,'Banded radial fan',1.6,{kind:'radial'},'Sixteen rays expand from each corner springer. Three bands at constant radial distances approximate the fan tracery, instead of interpolating rectangular grids.',{lift:.02}),
];
export const CASE_BY_ID=Object.fromEntries(VAULT_CASES.map(c=>[c.id,c]));
