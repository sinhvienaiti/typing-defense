# 1C C4 part B follow-up: the five mesh and texture fixes of 3D_IMPORT_2026-10-28 on copies of the Tripo sources.
# Reads art-src/3d/<kind>/<id>.glb, never writes it; writes art-src/3d/<kind>/<id>.fix1.glb (the preset's new source),
# before and after renders, and the numbers (triangles, islands, faces removed) as JSON. Blender 5:
#   $B --background --factory-startup --python scripts/models/blender/td_mesh_fix.py -- --root . --out <dir> [--only id] [--inspect]
import bmesh, colorsys, json, math, os, sys
import bpy
import numpy as np
from mathutils import Matrix, Vector

argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
arg = lambda name, default=None: argv[argv.index(name) + 1] if name in argv else default
ROOT, OUT, ONLY, INSPECT = arg("--root", "."), arg("--out", "tmp/mesh-fix"), arg("--only"), "--inspect" in argv
os.makedirs(OUT, exist_ok=True)
JOBS = {"keep-kit-l2": "kits", "keep-kit-l3": "kits", "archer-kit-l2": "kits", "cannon-barrel-l3": "kits", "gold-mine-kit-l3": "kits"}


def load(path):
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.ops.import_scene.gltf(filepath=path, merge_vertices=True)
    meshes = [o for o in bpy.context.scene.objects if o.type == "MESH"]
    bpy.ops.object.select_all(action="DESELECT")
    for o in meshes: o.select_set(True)
    bpy.context.view_layer.objects.active = meshes[0]
    if len(meshes) > 1: bpy.ops.object.join()
    obj = bpy.context.view_layer.objects.active
    bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
    return obj


def texture(obj):
    """The base colour image as an (h, w, 4) float array, and the image."""
    for slot in obj.material_slots:
        for node in slot.material.node_tree.nodes:
            if node.type == "TEX_IMAGE" and any(l.to_socket.name == "Base Color" for l in node.outputs[0].links):
                img = node.image
                return np.array(img.pixels[:], dtype=np.float32).reshape(img.size[1], img.size[0], 4), img
    raise SystemExit("no base colour texture")


def face_colours(obj, pixels):
    bm = bmesh.new(); bm.from_mesh(obj.data)
    uv = bm.loops.layers.uv.active
    h, w = pixels.shape[:2]
    out = []
    for f in bm.faces:
        u = sum(l[uv].uv.x for l in f.loops) / len(f.loops); v = sum(l[uv].uv.y for l in f.loops) / len(f.loops)
        r, g, b = pixels[min(h - 1, max(0, int(v * h))), min(w - 1, max(0, int((u % 1) * w))), :3]
        out.append(colorsys.rgb_to_hsv(float(r), float(g), float(b)))
    bm.free()
    return out


def islands(obj):
    bm = bmesh.new(); bm.from_mesh(obj.data); bm.faces.ensure_lookup_table()
    seen, parts = set(), []
    for f in bm.faces:
        if f.index in seen: continue
        stack, part = [f], []
        seen.add(f.index)
        while stack:
            cur = stack.pop(); part.append(cur.index)
            for e in cur.edges:
                for g in e.link_faces:
                    if g.index not in seen: seen.add(g.index); stack.append(g)
        parts.append(part)
    info = []
    for part in parts:
        pts = [v.co.copy() for i in part for v in bm.faces[i].verts]
        lo = Vector((min(p.x for p in pts), min(p.y for p in pts), min(p.z for p in pts))); hi = Vector((max(p.x for p in pts), max(p.y for p in pts), max(p.z for p in pts)))
        info.append({"faces": len(part), "lo": [round(c, 3) for c in lo], "hi": [round(c, 3) for c in hi]})
    bm.free()
    return parts, info


def delete_faces(obj, indices):
    bm = bmesh.new(); bm.from_mesh(obj.data); bm.faces.ensure_lookup_table()
    bmesh.ops.delete(bm, geom=[bm.faces[i] for i in indices], context="FACES")
    bmesh.ops.delete(bm, geom=[v for v in bm.verts if not v.link_faces], context="VERTS")
    bm.to_mesh(obj.data); bm.free(); obj.data.update()


def tris(obj):
    return sum(len(p.vertices) - 2 for p in obj.data.polygons)


def render(obj, name):
    scene = bpy.context.scene
    scene.render.engine = "BLENDER_EEVEE"
    scene.render.resolution_x = scene.render.resolution_y = 560
    if scene.world is None: scene.world = bpy.data.worlds.new("w")
    scene.world.use_nodes = True
    scene.world.node_tree.nodes["Background"].inputs[0].default_value = (0.8, 0.82, 0.85, 1)
    sun = bpy.data.objects.new("sun", bpy.data.lights.new("sun", "SUN")); sun.data.energy = 3.2; sun.rotation_euler = (math.radians(45), 0, math.radians(30)); scene.collection.objects.link(sun)
    lo = Vector([min(v.co[i] for v in obj.data.vertices) for i in range(3)]); hi = Vector([max(v.co[i] for v in obj.data.vertices) for i in range(3)])
    mid, size = (lo + hi) / 2, max((hi - lo).length, 0.5)
    for tag, direction in (("34", Vector((-0.7, -1.0, 0.8))), ("top", Vector((0.0, -0.05, 1.0))), ("under", Vector((-0.3, -0.6, -0.75)))):
        cam = bpy.data.objects.new("cam", bpy.data.cameras.new("cam")); scene.collection.objects.link(cam)
        cam.data.type = "ORTHO"; cam.data.ortho_scale = size * 1.15
        cam.location = mid + direction.normalized() * size * 3
        cam.rotation_euler = (mid - cam.location).to_track_quat("-Z", "Y").to_euler()
        scene.camera = cam
        scene.render.filepath = os.path.join(OUT, f"{name}__{tag}.png")
        bpy.ops.render.render(write_still=True)
        bpy.data.objects.remove(cam)
    bpy.data.objects.remove(sun)


def grey_faces(obj, colours, zlo, zhi, sat=0.14, vlo=0.18, vhi=0.75, inside=None):
    found = []
    for poly, (h, s, v) in zip(obj.data.polygons, colours):
        c = poly.center
        if s < sat and vlo < v < vhi and zlo <= c.z <= zhi and (inside is None or inside(c)): found.append(poly.index)
    return found


def fix_keep_l2(obj, report):
    """Two islands: the ring with the crossbow tower, and an arc of the back wall turned off its place. Turn the arc about
    the ring's centre until its open end meets the tower's side, closing the left gap (the front-right gap for the dais stays)."""
    parts, info = islands(obj)
    report["islands"] = info
    if len(parts) < 2: return
    parts.sort(key=len)
    arc = set(parts[0]) if len(parts) == 2 else set(i for p in parts[:-1] for i in p)
    # The ring's centre: the middle of the whole kit's box.
    xs = [v.co.x for v in obj.data.vertices]; ys = [v.co.y for v in obj.data.vertices]
    centre = Vector(((min(xs) + max(xs)) / 2, (min(ys) + max(ys)) / 2, 0))
    angle = lambda p: math.atan2(p.y - centre.y, p.x - centre.x)
    ring = [obj.data.vertices[v].co for i in range(len(obj.data.polygons)) if i not in arc for v in obj.data.polygons[i].vertices]
    arcs = [obj.data.vertices[v].co for i in arc for v in obj.data.polygons[i].vertices]
    # The free angle sectors (no ring vertex), as 1° bins; the arc must turn into the widest free sector next to it.
    bins = np.zeros(360, dtype=bool)
    for p in ring: bins[int(math.degrees(angle(p)) % 360)] = True
    arc_bins = sorted({int(math.degrees(angle(p)) % 360) for p in arcs})
    report["arcDeg"] = [arc_bins[0], arc_bins[-1]] if arc_bins else []
    free = [d for d in range(360) if not bins[d]]
    report["freeDeg"] = free[:12] + (["…"] if len(free) > 12 else []) + free[-6:]
    turn = float(arg("--turn", "0"))
    if turn:
        rot = Matrix.Translation(centre) @ Matrix.Rotation(math.radians(turn), 4, "Z") @ Matrix.Translation(-centre)
        verts = {v for i in arc for v in obj.data.polygons[i].vertices}
        for v in verts: obj.data.vertices[v].co = rot @ obj.data.vertices[v].co
        report["turnedDeg"] = turn


def fix_grey(obj, report, band):
    pixels, _ = texture(obj)
    colours = face_colours(obj, pixels)
    lo = min(v.co.z for v in obj.data.vertices); hi = max(v.co.z for v in obj.data.vertices)
    zlo, zhi = lo + band[0] * (hi - lo), lo + band[1] * (hi - lo)
    faces = grey_faces(obj, colours, zlo, zhi, sat=float(arg("--sat", "0.14")), vlo=float(arg("--vlo", "0.18")), vhi=float(arg("--vhi", "0.75")))
    report["grey"] = {"faces": len(faces), "band": [round(zlo, 3), round(zhi, 3)]}
    if INSPECT:  # (s, v) histogram of the band's faces, 5 x 5 bins
        hist = np.zeros((5, 5), dtype=int)
        for poly, (h, sat, val) in zip(obj.data.polygons, colours):
            if zlo <= poly.center.z <= zhi: hist[min(4, int(sat * 5)), min(4, int(val * 5))] += 1
        report["histSV"] = hist.tolist()
    if not INSPECT and faces: delete_faces(obj, faces)


def fix_archer_l2(obj, report):
    lo = min(v.co.z for v in obj.data.vertices); hi = max(v.co.z for v in obj.data.vertices)
    floor = [p.index for p in obj.data.polygons if p.center.z < lo + 0.06 * (hi - lo) and abs(p.normal.z) > 0.85]
    report["floor"] = {"faces": len(floor), "z": round(lo, 3)}
    if not INSPECT and floor: delete_faces(obj, floor)


def fix_barrel_l3(obj, report):
    """Bake the base colour of the patterned half (+X in the source) onto the whole barrel: three copies turned 90°, 180°,
    270° about the barrel's long axis, each cut to that half, are the bake's sources; the original is the target."""
    pixels, img = texture(obj)
    lo = Vector([min(v.co[i] for v in obj.data.vertices) for i in range(3)]); hi = Vector([max(v.co[i] for v in obj.data.vertices) for i in range(3)])
    ext = hi - lo
    axis = max(range(3), key=lambda i: ext[i])
    report["axis"] = "xyz"[axis]
    if INSPECT: return
    centre = (lo + hi) / 2
    sources = []
    for k in range(4):
        copy = obj.copy(); copy.data = obj.data.copy(); bpy.context.scene.collection.objects.link(copy)
        side = [p.index for p in copy.data.polygons if p.center.x - centre.x < 0.02 * ext.x]  # keep the +X half
        delete_faces(copy, side)
        axis_vec = Vector([1.0 if i == axis else 0.0 for i in range(3)])
        copy.data.transform(Matrix.Translation(centre) @ Matrix.Rotation(math.radians(90 * k), 4, axis_vec) @ Matrix.Translation(-centre))
        sources.append(copy)
    target = bpy.data.images.new(img.name + "-round", img.size[0], img.size[1], alpha=True)
    mat = obj.material_slots[0].material
    node = mat.node_tree.nodes.new("ShaderNodeTexImage"); node.image = target; mat.node_tree.nodes.active = node
    scene = bpy.context.scene
    scene.render.engine = "CYCLES"; scene.cycles.samples = 4; scene.cycles.device = "CPU"
    bpy.ops.object.select_all(action="DESELECT")
    for s in sources: s.select_set(True)
    obj.select_set(True); bpy.context.view_layer.objects.active = obj
    bpy.ops.object.bake(type="DIFFUSE", pass_filter={"COLOR"}, use_selected_to_active=True, cage_extrusion=0.02 * ext[axis], max_ray_distance=0.06 * ext[axis], margin=8)
    for s in sources: bpy.data.objects.remove(s)
    base = next(n for n in mat.node_tree.nodes if n.type == "TEX_IMAGE" and n.image == img)
    base.image = target
    mat.node_tree.nodes.remove(node)
    target.pack()
    report["baked"] = [target.size[0], target.size[1]]


for job, kind in JOBS.items():
    if ONLY and job != ONLY: continue
    src = os.path.join(ROOT, "art-src/3d", kind, job + ".glb")
    obj = load(src)
    report = {"source": src, "trianglesBefore": tris(obj)}
    render(obj, job + "__before")
    if job == "keep-kit-l2": fix_keep_l2(obj, report)
    elif job == "keep-kit-l3": fix_grey(obj, report, (0.45, 0.85))
    elif job == "gold-mine-kit-l3": fix_grey(obj, report, (0.0, 1.0))
    elif job == "archer-kit-l2": fix_archer_l2(obj, report)
    elif job == "cannon-barrel-l3": fix_barrel_l3(obj, report)
    report["trianglesAfter"] = tris(obj)
    if not INSPECT:
        render(obj, job + "__after")
        dst = os.path.join(ROOT, "art-src/3d", kind, job + ".fix1.glb")
        bpy.ops.object.select_all(action="DESELECT"); obj.select_set(True)
        bpy.ops.export_scene.gltf(filepath=dst, export_format="GLB", use_selection=True, export_image_format="AUTO")
        report["output"] = dst
    json.dump(report, open(os.path.join(OUT, job + ".json"), "w"), indent=1)
    print("FIX", job, json.dumps({k: v for k, v in report.items() if k not in ("islands",)}))
