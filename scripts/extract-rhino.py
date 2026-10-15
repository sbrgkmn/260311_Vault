"""Recover five directed-edge subdivision levels from the baked Rhino study.

Run with: python scripts/extract-rhino.py (rhino3dm must be installed).
The output contains measured edge parameters, offsets, and connectivity.
The runtime independently tests the inferred 0.3 * 3D edge-length rule.
"""
import collections
import json
import pathlib
import sys

ROOT = pathlib.Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / 'tmp/rhino-reader'))
import rhino3dm

doc = rhino3dm.File3dm.Read(str(ROOT / 'References/MeshTest_1.3dm'))
objects = list(doc.Objects)
results = []
for start in (0, 32768):
    raw = [[(v.X, v.Y, v.Z) for v in o.Geometry.Vertices]
           for o in objects[start:start + 4096]]
    anchor = min((p for f in raw for p in f), key=lambda p: p[2])
    def normalize(p):
        x, z = ((anchor[1]-p[1])/386, (anchor[0]-p[0])/386) if start == 0 else ((p[0]-anchor[0])/386, (p[1]-anchor[1])/386)
        return (round(x,5), round((p[2]-anchor[2])/386, 7), round(z,5))
    levels = [[[normalize(p) for p in f] for f in raw]]
    for _ in range(5):
        previous = []
        for j in range(0, len(levels[-1]), 4):
            counts = collections.Counter(p for f in levels[-1][j:j+4] for p in f)
            corners = [p for p, n in counts.items() if n == 1]
            assert len(counts) == 6 and len(corners) == 3, 'Not a four-child subdivision'
            previous.append(corners)
        levels.append(previous)
    levels.reverse()
    positions, lookup = [], {}
    def point_key(p):
        return p[0],p[2]
    def add(p):
        k = point_key(p)
        if k not in lookup:
            lookup[k] = len(positions)
            positions.append(p)
        return lookup[k]
    def faces_for(faces):
        out = []
        for a,b,c in faces:
            if (b[0]-a[0])*(c[2]-a[2])-(c[0]-a[0])*(b[2]-a[2]) > 0:
                b,c = c,b
            out.extend([add(a),add(b),add(c)])
        return out
    seed_faces = faces_for(levels[0])
    seed_positions = [v for p in positions for v in p]
    passes = []
    max_error = 0
    for level in range(1,6):
        candidates = {}
        for face in levels[level-1]:
            for a,b in zip(face, face[1:]+face[:1]):
                mid = ((a[0]+b[0])/2, (a[2]+b[2])/2)
                candidates.setdefault(mid, []).append((a,b))
        moves = []
        for face in levels[level]:
            for p in face:
                if point_key(p) in lookup:
                    continue
                options = []
                for pairs in candidates.values():
                    for a,b in pairs:
                        dx,dz = b[0]-a[0],b[2]-a[2]
                        t = ((p[0]-a[0])*dx+(p[2]-a[2])*dz)/(dx*dx+dz*dz)
                        err = ((p[0]-a[0]-t*dx)**2+(p[2]-a[2]-t*dz)**2)**.5
                        if 0.001 < t < .999 and err < 2e-5:
                            options.append((err,a,b,t))
                assert options, (start,level,p)
                err,a,b,t = min(options)
                index = add(p)
                offset = p[1]-(a[1]*(1-t)+b[1]*t)
                max_error = max(max_error,err)
                moves.append([index,lookup[point_key(a)],lookup[point_key(b)],round(t,8),round(offset,8)])
        faces = faces_for(levels[level])
        passes.append({'moves':moves, 'faces':faces})
    xy = collections.defaultdict(set)
    for x,y,z in (p for f in levels[-1] for p in f):
        xy[x,z].add(y)
    result = {'source':'MeshTest_1.3dm', 'objectStart':start, 'seedPositions':seed_positions,
              'seedFaces':seed_faces, 'passes':passes, 'sourceRise':max(seed_positions[1::3]),
              'maxPlanarEdgeError':max_error, 'splitHeightLocations':sum(len(v)>1 for v in xy.values())}
    result['maxSourceHeightSpread'] = max(max(v)-min(v) for v in xy.values())
    results.append(result)
    print(start, 'seed faces',len(seed_faces)//3,'vertices',len(positions), 'edge error',max_error,'split heights',result['splitHeightLocations'])
target = ROOT / 'serial/assets/rhino-recursion.json'
target.write_text(json.dumps(results,separators=(',',':')))
