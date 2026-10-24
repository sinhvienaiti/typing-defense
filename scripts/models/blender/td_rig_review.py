"""Review renders and checks for td_rig_tools.py output.

blender --background --factory-startup --python td_rig_review.py -- \
    --blend <work>/<id>.blend --out <folder> --mode bones|clips|stress [--clips A,B] [--frames 12]

bones:  ortho front/side/back renders with the bones drawn on, and the part map
        (each vertex coloured by its dominant bone).
clips:  for each clip, N frames from the front, the side and the 55-degree game
        camera, a contact sheet per clip, and checks per clip: edge stretch and
        collapsed triangles (candy-wrapper), head rigidity, foot sliding while a
        foot is planted, ground penetration, loop seam (first vs last pose).
stress: the pose stress set (arms overhead, elbows 90/120, crouch, leg lift,
        spine twist 35, head turn 45) with the same checks.
"""

import argparse
import json
import math
import os
import subprocess
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import bpy  # noqa: E402
import numpy as np  # noqa: E402
from mathutils import Quaternion, Vector  # noqa: E402

import td_rig_common as C  # noqa: E402
from td_rig_common import log  # noqa: E402

FONT = "/System/Library/Fonts/Supplemental/Arial.ttf"
PALETTE = [(0.90, 0.10, 0.10), (0.10, 0.60, 0.95), (0.20, 0.80, 0.20), (0.95, 0.75, 0.10), (0.70, 0.20, 0.90),
           (0.10, 0.85, 0.80), (0.95, 0.45, 0.10), (0.50, 0.50, 0.50), (0.95, 0.40, 0.70), (0.35, 0.25, 0.10),
           (0.60, 0.90, 0.30), (0.20, 0.30, 0.70), (0.85, 0.85, 0.85), (0.40, 0.70, 0.50), (0.75, 0.10, 0.40),
           (0.10, 0.40, 0.30), (0.95, 0.95, 0.30), (0.30, 0.10, 0.50), (0.60, 0.40, 0.20), (0.20, 0.20, 0.20)]


def scene_parts():
    rig = next(o for o in bpy.context.scene.objects if o.type == "ARMATURE" and not o.name.startswith("SRC_"))
    # The body mesh (checks run on it); held items (td_attachment) stay visible.
    skinned = [o for o in bpy.context.scene.objects if o.type == "MESH" and o.parent == rig]
    mesh = next((o for o in skinned if not o.get("td_attachment")), skinned[0])
    for o in bpy.context.scene.objects:
        if o not in (rig, mesh) and o.type in ("MESH", "ARMATURE") and not (o.parent == rig and o.get("td_attachment")):
            o.hide_render = True
            o.hide_viewport = True
        elif o.parent == rig and o.get("td_attachment"):
            o.hide_render = False
            o.hide_viewport = False
    return rig, mesh


def project(point, direction, size, resolution, centre):
    """Ortho camera along `direction` (front (0,1,0), side (-1,0,0), back (0,-1,0))."""
    d = Vector(direction)
    up = Vector((0, 0, 1))
    right = d.cross(up).normalized()
    p = Vector(point) - Vector(centre)
    return (resolution / 2 + p.dot(right) / size * resolution, resolution / 2 - p.dot(up) / size * resolution)


def dominant_colours(mesh, names):
    weights = np.zeros((len(mesh.data.vertices), len(names)))
    index = {g.index: names.index(g.name) for g in mesh.vertex_groups if g.name in names}
    for v in mesh.data.vertices:
        for g in v.groups:
            if g.group in index:
                weights[v.index, index[g.group]] = g.weight
    colours = np.array(PALETTE)[weights.argmax(1) % len(PALETTE)]
    # Blends show as darker: 1 at a single bone, ~0.55 where two share evenly.
    colours *= (0.45 + 0.55 * weights.max(1))[:, None]
    return colours, weights


def paint(mesh, colours):
    name = "TDReviewColour"
    attr = mesh.data.color_attributes.get(name) or mesh.data.color_attributes.new(name, "FLOAT_COLOR", "POINT")
    rgba = np.c_[colours, np.ones(len(colours))].astype(np.float32).ravel()
    attr.data.foreach_set("color", rgba)
    mesh.data.color_attributes.active_color = attr
    return attr


def mode_bones(args):
    rig, mesh = scene_parts()
    rig.data.pose_position = "REST"
    bpy.context.view_layer.update()
    names = [b.name for b in rig.data.bones if b.use_deform]
    co = C.vertex_array(mesh)
    H = co[:, 2].max()
    size = max(H, np.ptp(co[:, 0]), np.ptp(co[:, 1])) * 1.1
    centre = (0, 0, H / 2)
    res = 768
    C.render_setup(res)
    shading = bpy.context.scene.display.shading
    views = (("front", (0, 1, 0)), ("side", (-1, 0, 0)), ("back", (0, -1, 0)))
    colours, _w = dominant_colours(mesh, names)
    for stage in ("tex", "parts"):
        if stage == "parts":
            paint(mesh, colours)
            shading.color_type = "VERTEX"
        for view, direction in views:
            cam = C.camera("Cam_" + view, direction, centre, size)
            path = os.path.join(args.out, f"{stage}_{view}.png")
            C.render_to(path, cam)
            if stage == "tex":
                draws = []
                for bone in rig.data.bones:
                    a = project(rig.matrix_world @ bone.head_local, direction, size, res, centre)
                    b = project(rig.matrix_world @ bone.tail_local, direction, size, res, centre)
                    colour = "#ff2020" if bone.name.endswith("_l") else "#20a0ff" if bone.name.endswith("_r") else "#20ff40"
                    draws += ["-stroke", colour, "-strokewidth", "3", "-draw", f"line {a[0]:.1f},{a[1]:.1f} {b[0]:.1f},{b[1]:.1f}",
                              "-fill", "yellow", "-stroke", "black", "-strokewidth", "1", "-draw", f"circle {a[0]:.1f},{a[1]:.1f} {a[0]+3:.1f},{a[1]:.1f}"]
                subprocess.run(["magick", path, "-font", FONT] + draws + [path], check=True)
    legend = {n: "#%02x%02x%02x" % tuple(int(255 * c) for c in PALETTE[i % len(PALETTE)]) for i, n in enumerate(names)}
    with open(os.path.join(args.out, "parts_legend.json"), "w") as handle:
        json.dump(legend, handle, indent=1)
    row1 = [os.path.join(args.out, f"tex_{v}.png") for v, _ in views]
    row2 = [os.path.join(args.out, f"parts_{v}.png") for v, _ in views]
    subprocess.run(["magick"] + row1 + ["+append", os.path.join(args.out, "_r1.png")], check=True)
    subprocess.run(["magick"] + row2 + ["+append", os.path.join(args.out, "_r2.png")], check=True)
    subprocess.run(["magick", os.path.join(args.out, "_r1.png"), os.path.join(args.out, "_r2.png"), "-append", "-resize", "60%",
                    os.path.join(args.out, "bones_sheet.png")], check=True)
    for tmp in ("_r1.png", "_r2.png"):
        os.remove(os.path.join(args.out, tmp))


# ----------------------------------------------------------------------------
# Clip checks
# ----------------------------------------------------------------------------
class Checker:
    def __init__(self, rig, mesh, names):
        self.rig, self.mesh = rig, mesh
        self.edges = C.edges_array(mesh)
        self.tris = C.faces_array(mesh)
        self.rest = C.evaluated_vertices(mesh) if False else C.vertex_array(mesh) @ np.array(mesh.matrix_world)[:3, :3].T + np.array(mesh.matrix_world)[:3, 3]
        self.rest_len = np.linalg.norm(self.rest[self.edges[:, 0]] - self.rest[self.edges[:, 1]], axis=1)
        self.rest_area = self.area(self.rest)
        # Slivers left by decimation give huge ratios on sub-millimetre edges:
        # judge edges and triangles of ordinary size only.
        self.edge_ok = self.rest_len > 0.3 * np.median(self.rest_len)
        self.tri_ok = self.rest_area > 0.1 * np.median(self.rest_area)
        _c, w = dominant_colours(mesh, names)
        self.dominant = np.array(names)[w.argmax(1)]
        self.head_rows = (w[:, names.index("head")] > 0.999) if "head" in names else np.zeros(len(w), bool)
        self.names = names
        chains = ("tail_", "ear_", "bag_", "robe_", "talisman", "kilt_", "leaf")
        self.chain_rows = np.array([str(d).startswith(chains) for d in self.dominant])

    def area(self, co):
        a, b, c = co[self.tris[:, 0]], co[self.tris[:, 1]], co[self.tris[:, 2]]
        return 0.5 * np.linalg.norm(np.cross(b - a, c - a), axis=1)

    def frame(self):
        co = C.evaluated_vertices(self.mesh)
        length = np.linalg.norm(co[self.edges[:, 0]] - co[self.edges[:, 1]], axis=1)
        ratio = np.where(self.edge_ok, length / np.maximum(self.rest_len, 1e-6), 1.0)
        area = self.area(co) / np.maximum(self.rest_area, 1e-9)
        collapsed = self.tri_ok & (area < 0.25)
        # Visible: 60 % longer and at least 2 cm longer.
        stretched = (ratio > 1.6) & (length - self.rest_len > 0.02)
        out = {
            "edgeStretchMax": float(ratio.max()), "edgeStretchP99": float(np.percentile(ratio[self.edge_ok], 99)),
            "edgeSquashMin": float(ratio[self.edge_ok].min()), "edgesOver1.6": int(stretched.sum()),
            "trianglesCollapsed": int(collapsed.sum()),
            "minZ": float(co[:, 2].min()),
        }
        if collapsed.any():
            names, counts = np.unique(self.dominant[self.tris[collapsed, 0]], return_counts=True)
            out["collapsedBy"] = {str(n): int(c) for n, c in zip(names, counts) if c >= 3}
        if stretched.any():
            names, counts = np.unique(self.dominant[self.edges[stretched, 0]], return_counts=True)
            out["stretchedBy"] = {str(n): int(c) for n, c in zip(names, counts) if c >= 3}
        if self.head_rows.any():
            h = self.head_rows
            hp = co[h]
            hr = self.rest[h]
            # rigid fit residual: distances between head vertices preserved
            idx = np.linspace(0, len(hp) - 1, min(200, len(hp))).astype(int)
            dp = np.linalg.norm(hp[idx][:, None] - hp[idx][None], axis=2)
            dr = np.linalg.norm(hr[idx][:, None] - hr[idx][None], axis=2)
            out["headDistortion"] = float(np.abs(dp - dr).max())
        return out, co


def heat_colours(checker, co):
    """Per-vertex colour: grey ok, yellow stretch 1.3-1.6, red > 1.6 or a collapsed triangle."""
    length = np.linalg.norm(co[checker.edges[:, 0]] - co[checker.edges[:, 1]], axis=1)
    ratio = np.where(checker.edge_ok, length / np.maximum(checker.rest_len, 1e-6), 1.0)
    worst = np.ones(len(co))
    np.maximum.at(worst, checker.edges[:, 0], ratio)
    np.maximum.at(worst, checker.edges[:, 1], ratio)
    area = checker.area(co) / np.maximum(checker.rest_area, 1e-9)
    bad = checker.tri_ok & (area < 0.25)
    flag = np.zeros(len(co), bool)
    flag[checker.tris[bad].ravel()] = True
    colours = np.tile([0.62, 0.62, 0.65], (len(co), 1))
    colours[worst > 1.3] = [0.95, 0.8, 0.1]
    colours[(worst > 1.6) | flag] = [0.9, 0.1, 0.1]
    return colours


def render_heat(checker, rig, mesh, frame, folder, cams):
    import td_rig_review as R  # noqa: F401
    bpy.context.scene.frame_set(frame)
    _s, co = checker.frame()
    attr_colours = heat_colours(checker, co)
    paint(mesh, attr_colours)
    shading = bpy.context.scene.display.shading
    shading.color_type = "VERTEX"
    files = []
    for view in ("front", "side", "back"):
        cam = cams.get(view) or C.camera("Cam_" + view, {"back": (0, -1, 0)}[view], (0, 0, cams["_h"] * 0.48), cams["_h"] * 1.45)
        cams[view] = cam
        path = os.path.join(folder, f"heat_{view}.png")
        C.render_to(path, cam)
        files.append(path)
    shading.color_type = "TEXTURE"
    subprocess.run(["magick"] + files + ["+append", os.path.join(folder, "heat.png")], check=True)
    for path in files:
        os.remove(path)


def bone_world(rig, name, point="head"):
    pb = rig.pose.bones[name]
    return rig.matrix_world @ (pb.head if point == "head" else pb.tail)


def clip_frames(rig, track_name):
    for track in rig.animation_data.nla_tracks:
        track.mute = track.name != track_name
        track.is_solo = False
    track = rig.animation_data.nla_tracks[track_name]
    strip = track.strips[0]
    return int(strip.frame_start), int(strip.frame_end)


GAME_EL, GAME_AZ = 55.0, -30.0


def game_dir():
    """Game camera: 55 degrees down, from the front-left like the default view."""
    el, az = math.radians(GAME_EL), math.radians(GAME_AZ)
    return Vector((math.sin(az) * math.cos(el), math.cos(az) * math.cos(el), -math.sin(el)))


def camera_specs(height):
    """{view: (direction, target, ortho size)} of the default framing."""
    size = height * 1.45
    centre = (0, 0, height * 0.48)
    return {"front": ((0, 1, 0), centre, size), "side": ((-1, 0, 0), centre, size),
            "game": (tuple(game_dir()), (0, 0, height * 0.42), size * 1.05)}


def setup_cameras(height, res):
    return {view: C.camera("Cam_" + view, d, target, size) for view, (d, target, size) in camera_specs(height).items()}


def fit_cameras(height, lo, hi):
    """Widen and re-centre a camera only when the clip's mesh (box lo..hi over
    its frames) leaves the default frame: a body lying down (Death) was cut."""
    corners = [Vector((x, y, z)) for x in (lo[0], hi[0]) for y in (lo[1], hi[1]) for z in (lo[2], hi[2])]
    for view, (d, target, size) in camera_specs(height).items():
        d = Vector(d).normalized()
        right = d.cross(Vector((0, 0, 1))).normalized()
        up = right.cross(d).normalized()
        pr = [(c - Vector(target)).dot(right) for c in corners]
        pu = [(c - Vector(target)).dot(up) for c in corners]
        if max(map(abs, pr + pu)) > 0.46 * size:
            mid = (Vector(lo) + Vector(hi)) / 2
            size = max(size, 1.12 * max(max(pr) - min(pr), max(pu) - min(pu)))
            target = tuple(mid)
        C.camera("Cam_" + view, tuple(d), target, size)


# ----------------------------------------------------------------------------
# Motion checks (review 24/10): face toward the game camera, steady torso
# lean, wide hand arcs seen from above, chains back on Idle, sockets on the
# right bones.
# ----------------------------------------------------------------------------
CHAIN_PREFIXES = ("tail_", "ear_", "bag_", "robe_", "talisman", "kilt_", "leaf")


class Motion:
    def __init__(self, rig):
        self.rig = rig
        self.bones = rig.pose.bones
        self.head_rest = rig.data.bones["head"].matrix_local.to_quaternion() if "head" in self.bones else None
        self.to_cam = -game_dir()
        self.rows = []

    def sample(self):
        mw = self.rig.matrix_world
        row = {}
        if self.head_rest is not None:
            q = mw.to_quaternion() @ self.bones["head"].matrix.to_quaternion() @ self.head_rest.inverted()
            f = q @ Vector((0, -1, 0))
            row["pitch"] = math.degrees(math.asin(max(-1.0, min(1.0, f.z))))
            row["cam"] = math.degrees(math.acos(max(-1.0, min(1.0, f.dot(self.to_cam)))))
        if "neck_01" in self.bones and "pelvis" in self.bones:
            u = (mw @ self.bones["neck_01"].head) - (mw @ self.bones["pelvis"].head)
            row["lean"] = math.degrees(math.atan2(-u.y, u.z))
        for side in ("l", "r"):
            if "hand_" + side in self.bones:
                row["hand_" + side] = tuple(mw @ self.bones["hand_" + side].tail)
        self.rows.append(row)

    def summary(self):
        out = {}
        if not self.rows:
            return out
        if "pitch" in self.rows[0]:
            out["facePitchMinDeg"] = round(min(r["pitch"] for r in self.rows), 1)
            # 0 = the face looks straight at the game camera; at rest about 60.
            out["faceToGameCamMaxDeg"] = round(max(r["cam"] for r in self.rows), 1)
        if "lean" in self.rows[0]:
            lean = [r["lean"] for r in self.rows]
            out["torsoLeanDeg"] = {"min": round(min(lean), 1), "mean": round(float(np.mean(lean)), 1), "max": round(max(lean), 1)}
        arcs = {}
        for side in ("l", "r"):
            key = "hand_" + side
            if key in self.rows[0]:
                p = np.array([r[key] for r in self.rows])
                # Seen from above: 0 = straight ahead (-Y), + = the character's left.
                ang = np.degrees(np.unwrap(np.arctan2(p[:, 0], -p[:, 1])))
                wide = np.hypot(p[:, 0], p[:, 1]) >= 0.6  # outside a chibi head's silhouette from above
                arcs[side] = {"sweepDeg": round(float(ang.max() - ang.min())),
                              "wideSweepDeg": round(float(ang[wide].max() - ang[wide].min())) if wide.any() else 0,
                              "wideFrames": int(wide.sum()),
                              "reachMax_m": round(float(np.hypot(p[:, 0], p[:, 1]).max()), 2),
                              "pathTop_m": round(float(np.linalg.norm(np.diff(p[:, :2], axis=0), axis=1).sum()), 2)}
        if arcs:
            out["handArcTop"] = arcs
        return out


def chain_dirs(rig):
    mw = rig.matrix_world.to_3x3()
    return {pb.name: (mw @ pb.matrix.to_3x3() @ Vector((0, 1, 0))).normalized()
            for pb in rig.pose.bones if pb.name.startswith(CHAIN_PREFIXES)}


def chain_offset(now, idle):
    return max([math.degrees(now[n].angle(idle[n], 0.0)) for n in now if n in idle] or [0.0])


def socket_report(rig):
    """Each FX_ empty: its parent bone and the nearest deform bone, in the
    current (Idle) pose. Toggling pose_position to REST from Python froze the
    later frame evaluation in Blender 5.2, so the posed bones are used."""
    mw = rig.matrix_world
    segments = {pb.name: (mw @ pb.head, mw @ pb.tail) for pb in rig.pose.bones if pb.bone.use_deform}

    def dist(p, a, b):
        ab = b - a
        t = max(0.0, min(1.0, (p - a).dot(ab) / max(ab.dot(ab), 1e-12)))
        return (p - (a + ab * t)).length

    out = {}
    for obj in bpy.context.scene.objects:
        if obj.type == "EMPTY" and obj.name.startswith("FX_") and obj.parent == rig:
            p = obj.matrix_world.translation
            near = min(segments, key=lambda n: dist(p, *segments[n]))
            out[obj.name] = {"bone": obj.parent_bone, "nearestBone": near, "at": [round(v, 3) for v in p],
                             "distToBone_m": round(dist(p, *segments[obj.parent_bone]), 3) if obj.parent_bone in segments else None}
    return out


def model_contact(folder, clips, count, label):
    """One row of game-camera frames per clip: the whole model on one page."""
    rows = []
    for clip in clips:
        files = [os.path.join(folder, clip, f"game_{i:02d}.png") for i in range(count)]
        if not all(os.path.exists(f) for f in files):
            continue
        row = os.path.join(folder, f"_contact_{clip}.png")
        subprocess.run(["magick"] + files + ["+append", "-resize", "40%", row], check=True)
        height = subprocess.run(["magick", "identify", "-format", "%h", row], check=True, capture_output=True, text=True).stdout.strip()
        # (-splice on these renders fails with "pixels are not authentic": label as its own tile)
        subprocess.run(["magick", "-size", "190x" + height, "xc:white", "-font", FONT, "-pointsize", "17", "-gravity", "West",
                        "-annotate", "+6+0", clip, row, "+append", row], check=True)
        rows.append(row)
    if not rows:
        return None
    sheet = os.path.join(folder, "contact.png")
    subprocess.run(["magick"] + rows + ["-append", "+repage", sheet], check=True)
    width = subprocess.run(["magick", "identify", "-format", "%w", sheet], check=True, capture_output=True, text=True).stdout.strip()
    subprocess.run(["magick", "-size", width + "x34", "xc:white", "-font", FONT, "-pointsize", "20", "-gravity", "West",
                    "-annotate", "+8+0", label + " - game camera 55 deg, %d frames per clip" % count, sheet, "-append", "+repage", sheet], check=True)
    for row in rows:
        os.remove(row)
    return sheet


def contact_sheet(folder, clip, views, count, label):
    rows = []
    for view in views:
        files = [os.path.join(folder, f"{view}_{i:02d}.png") for i in range(count)]
        row = os.path.join(folder, f"_row_{view}.png")
        subprocess.run(["magick"] + files + ["+append", row], check=True)
        rows.append(row)
    sheet = os.path.join(folder, "sheet.png")
    subprocess.run(["magick"] + rows + ["-append", "+repage", "-resize", "50%", "-gravity", "North", "-background", "white",
                    "-splice", "0x28", "-font", FONT, "-pointsize", "20", "-annotate", "+0+3", label, sheet], check=True)
    for row in rows:
        os.remove(row)
    return sheet


def foot_metrics(samples, rest_ankle_z):
    """samples: per frame {foot: (x, y, z) of the foot bone head and ball head}."""
    out = {}
    for foot, track in samples.items():
        pts = np.array(track)
        if len(pts) < 2:
            continue
        low = pts[:, 2] < rest_ankle_z[foot] + 0.03
        speed = np.linalg.norm(np.diff(pts[:, :2], axis=0), axis=1) * 24
        planted = low[1:] & low[:-1]
        out[foot] = {
            "plantedFrames": int(planted.sum()),
            "slideWhilePlanted_mps_max": float(speed[planted].max()) if planted.any() else None,
            "slideWhilePlanted_mps_median": float(np.median(speed[planted])) if planted.any() else None,
            "groundGapMin": float(pts[:, 2].min() - rest_ankle_z[foot]),
        }
    return out


def mode_clips(args):
    rig, mesh = scene_parts()
    names = [b.name for b in rig.data.bones if b.use_deform]
    checker = Checker(rig, mesh, names)
    height = float(C.vertex_array(mesh)[:, 2].max())
    res = args.resolution
    C.render_setup(res)
    C.ground_plane(size=20)
    cams = setup_cameras(height, res)
    wanted = args.clips.split(",") if args.clips else [t.name for t in rig.animation_data.nla_tracks]
    report = {}
    feet = [n for n in ("foot_l", "foot_r") if n in rig.pose.bones]
    rest_ankle = {f: (rig.matrix_world @ rig.data.bones[f].head_local).z for f in feet}
    tracks = [t.name for t in rig.animation_data.nla_tracks]
    idle_name = next((t for t in ("Hero_Idle", "Enemy_Idle", "Unit_Idle", "Helper_Idle", "Boss_Idle") if t in tracks), None)
    idle_dirs = {}
    if idle_name:
        first = clip_frames(rig, idle_name)[0]
        for f in (first + 1, first):  # evaluate the mesh too: a bare frame_set left the saved pose
            bpy.context.scene.frame_set(f)
            checker.frame()
        idle_dirs = chain_dirs(rig)
    sockets = socket_report(rig)
    for clip in wanted:
        start, end = clip_frames(rig, clip)
        folder = os.path.join(args.out, clip)
        os.makedirs(folder, exist_ok=True)
        stats = []
        foot_track = {f: [] for f in feet}
        first_co = last_co = None
        setup_cameras(height, res)  # a fitted camera of the last clip goes back to the default frame
        motion = Motion(rig)
        lo, hi = np.full(3, np.inf), np.full(3, -np.inf)
        start_dirs = end_dirs = {}
        bpy.context.scene.frame_set(start + 1)  # the first frame_set(start) must re-evaluate
        for f in range(start, end + 1):
            bpy.context.scene.frame_set(f)
            s, co = checker.frame()
            stats.append(s)
            motion.sample()
            lo, hi = np.minimum(lo, co.min(0)), np.maximum(hi, co.max(0))
            if f == start:
                start_dirs = chain_dirs(rig)
            if f == end:
                end_dirs = chain_dirs(rig)
            for foot in feet:
                foot_track[foot].append(tuple(bone_world(rig, foot)))
            if f == start:
                first_co = co
            if f == end:
                last_co = co
        worst_frame = start + max(range(len(stats)), key=lambda i: stats[i]["edgesOver1.6"] + 4 * stats[i]["trianglesCollapsed"])
        render_heat(checker, rig, mesh, worst_frame, folder, dict(cams, _h=height))
        n = args.frames
        picks = [int(round(start + (end - start) * i / max(n - 1, 1))) for i in range(n)]
        fit_cameras(height, lo, hi)
        for i, f in enumerate(picks):
            bpy.context.scene.frame_set(f)
            for view, cam in cams.items():
                C.render_to(os.path.join(folder, f"{view}_{i:02d}.png"), cam)
        agg = {
            "frames": end - start + 1, "seconds": round((end - start) / 24.0, 3),
            "edgeStretchMax": round(max(s["edgeStretchMax"] for s in stats), 3),
            "edgeStretchP99Max": round(max(s["edgeStretchP99"] for s in stats), 3),
            "edgesOver1.6Max": max(s["edgesOver1.6"] for s in stats),
            "trianglesCollapsedMax": max(s["trianglesCollapsed"] for s in stats),
            "minZ": round(min(s["minZ"] for s in stats), 3),
            "headDistortionMax": round(max(s.get("headDistortion", 0) for s in stats), 5),
            "loopSeamMaxVertex_m": round(float(np.linalg.norm(first_co - last_co, axis=1)[~checker.chain_rows].max()), 4),
            "loopSeamChains_m": round(float(np.linalg.norm(first_co - last_co, axis=1)[checker.chain_rows].max()), 4) if checker.chain_rows.any() else 0.0,
            "feet": foot_metrics(foot_track, rest_ankle),
            "worstFrame": worst_frame - start,
            "chainStartOffsetDeg": round(chain_offset(start_dirs, idle_dirs), 1),
            "chainEndOffsetDeg": round(chain_offset(end_dirs, idle_dirs), 1),
            **motion.summary(),
        }
        worst = max(stats, key=lambda s: s["trianglesCollapsed"])
        if worst.get("collapsedBy"):
            agg["collapsedBy"] = worst["collapsedBy"]
        worst = max(stats, key=lambda s: s["edgesOver1.6"])
        if worst.get("stretchedBy"):
            agg["stretchedBy"] = worst["stretchedBy"]
        report[clip] = agg
        label = f"{args.label} {clip}  {agg['seconds']}s  stretch max {agg['edgeStretchMax']}  collapsed {agg['trianglesCollapsedMax']}  seam {agg['loopSeamMaxVertex_m']} m"
        contact_sheet(folder, clip, list(cams), n, label)
        log("clip", clip, json.dumps({k: agg[k] for k in ("edgeStretchMax", "trianglesCollapsedMax", "loopSeamMaxVertex_m", "minZ")}))
    report["_sockets"] = sockets
    model_contact(args.out, wanted, args.frames, args.label)
    path = os.path.join(args.out, "checks-" + (args.tag or "clips") + ".json")
    old = {}
    if os.path.exists(path):
        with open(path) as handle:
            old = json.load(handle)
    old.update(report)
    with open(path, "w") as handle:
        json.dump(old, handle, indent=1)


def main():
    argv = sys.argv[sys.argv.index("--") + 1:]
    parser = argparse.ArgumentParser()
    parser.add_argument("--blend", required=True)
    parser.add_argument("--out", required=True)
    parser.add_argument("--mode", default="clips", choices=["bones", "clips"])
    parser.add_argument("--clips", default="")
    parser.add_argument("--frames", type=int, default=12)
    parser.add_argument("--resolution", type=int, default=320)
    parser.add_argument("--label", default="")
    parser.add_argument("--tag", default="")
    args = parser.parse_args(argv)
    bpy.ops.wm.open_mainfile(filepath=args.blend)
    os.makedirs(args.out, exist_ok=True)
    if args.mode == "bones":
        mode_bones(args)
    else:
        mode_clips(args)


if __name__ == "__main__":
    main()
