"""Rig, skin and animate an unrigged Tripo character for Lời Gọi.

blender --background --factory-startup --python-exit-code 1 --python td_rig_tools.py -- \
    --spec games/typing-defense/scripts/models/presets/td-rigs/<id>.json \
    --root games/typing-defense [--work <folder for .blend and report>] [--mode build|bones]

The AI never rebuilds the mesh: the Tripo GLB in art-src/3d is read (vertices
merged at UV seams), turned, scaled, decimated to the face limit, made matte,
then gets an armature (Mesh2Motion CC0 human skeleton without fingers, plus the
preset's extra chains), bone-heat weights kept inside per-part masks (head
rigid), FX_ sockets on bones and the clips of design 23.9: CC0 Quaternius /
Mesh2Motion clips retargeted in world space (rest-pose aware, in place), and
scripted game clips; tails, ears, robes and charms get a baked spring follow.
Output: <root>/art-src/models/<kind>/<id>.glb (front -Z, +Y up, metres).

Preset (td-rigs/<id>.json, authoring frame of td_rig_common.py):
  id, kind, source (under art-src/3d), yaw, height, triangles, material,
  bones {name: {head, tail, parent, part, radius, deform?}}  (_l bones mirror to _r),
  snap {bone: radius}         joints moved to the local centroid of the mesh,
  parts {part: {bones: [...], rigid?: bone, band?: [z0, z1]}},
  regions [{part, capsule|box|zMin|zMax, ...}]  overrides of the nearest-bone part,
  springs {chain: {bones, freq, damping, maxAngle, drive?}},
  sockets {FX_name: {bone, at}},
  retarget {inplace, abduct {bone: [axis, deg]}, scale {bone: factor}},
  clips [{name, src: "base:Clip+base:Clip2" | script: "<name>", loop, blendIn, blendOut, ...}].
"""

import argparse
import json
import math
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import bpy  # noqa: E402
import numpy as np  # noqa: E402
from mathutils import Matrix, Quaternion, Vector  # noqa: E402

import td_rig_common as C  # noqa: E402
from td_rig_common import log, select_only  # noqa: E402

FPS = 24
# Mesh2Motion human bone names (CC0 clips) used by Lời Gọi's humanoid rigs.
HUMAN = ["root", "pelvis", "spine_01", "spine_02", "spine_03", "neck_01", "head",
         "clavicle_l", "upperarm_l", "lowerarm_l", "hand_l", "clavicle_r", "upperarm_r", "lowerarm_r", "hand_r",
         "thigh_l", "calf_l", "foot_l", "ball_l", "thigh_r", "calf_r", "foot_r", "ball_r"]
# Mesh2Motion -> Mixamo (Tripo's "Mixamo" preset), for the Tripo comparison.
MIXAMO = {"pelvis": "Hips", "spine_01": "Spine", "spine_02": "Spine1", "spine_03": "Spine2", "neck_01": "Neck", "head": "Head",
          "clavicle_l": "LeftShoulder", "upperarm_l": "LeftArm", "lowerarm_l": "LeftForeArm", "hand_l": "LeftHand",
          "clavicle_r": "RightShoulder", "upperarm_r": "RightArm", "lowerarm_r": "RightForeArm", "hand_r": "RightHand",
          "thigh_l": "LeftUpLeg", "calf_l": "LeftLeg", "foot_l": "LeftFoot", "ball_l": "LeftToeBase",
          "thigh_r": "RightUpLeg", "calf_r": "RightLeg", "foot_r": "RightFoot", "ball_r": "RightToeBase"}


# ----------------------------------------------------------------------------
# Preset
# ----------------------------------------------------------------------------
SIDES = (("_l", "_r"), ("_L", "_R"))


def mirror_name(name):
    """The other side's name, both ways (hand_l <-> hand_r, FX_HAND_L <->
    FX_HAND_R, ear_l_tip <-> ear_r_tip); None for a centre name."""
    for left, right in SIDES:
        if name.endswith(left):
            return name[:-2] + right
        if name.endswith(right):
            return name[:-2] + left
    for left, right in (("_l_", "_r_"), ("_r_", "_l_")):
        if left in name:
            return name.replace(left, right)
    return None


def left_twin(name):
    """Authoring convention: only left-side entries (*_l) make a mirrored
    right twin; a lone right-side bone (Lam's bag_r) stays single."""
    return mirror_name(name) if name.endswith(("_l", "_L")) or "_l_" in name else None


def socket_side_errors(spec):
    """FX_*_L must sit on a left bone and FX_*_R on a right one."""
    errors = []
    for socket, value in spec.get("sockets", {}).items():
        side = socket[-2:] if socket[-2:] in ("_L", "_R") else None
        bone = value.get("bone", "")
        bone_side = "_L" if bone.endswith("_l") else "_R" if bone.endswith("_r") else None
        if side and bone_side and side != bone_side:
            errors.append("%s on %s" % (socket, bone))
    return errors


def load_spec(path):
    with open(path, encoding="utf-8") as handle:
        spec = json.load(handle)
    bones = {}
    for name, bone in spec["bones"].items():
        bones[name] = dict(bone)
        twin = left_twin(name)
        if twin and twin not in spec["bones"] and spec.get("mirror", True):
            copy = dict(bone)
            copy["head"] = [-bone["head"][0], bone["head"][1], bone["head"][2]]
            copy["tail"] = [-bone["tail"][0], bone["tail"][1], bone["tail"][2]]
            if bone.get("parent") and mirror_name(bone["parent"]):
                copy["parent"] = mirror_name(bone["parent"])
            if bone.get("part") and mirror_name(bone["part"]):
                copy["part"] = mirror_name(bone["part"])
            bones[twin] = copy
    spec["bones"] = bones
    # Parts, springs and regions named *_l get a mirrored *_r twin.
    for key in ("parts", "springs"):
        table = spec.get(key, {})
        for name, value in list(table.items()):
            value["bones"] = expand(value.get("bones", []), bones)
            twin = left_twin(name)
            if twin and twin not in table:
                copy = dict(value)
                copy["bones"] = mirror_list(value["bones"])
                if copy.get("rigid"):
                    copy["rigid"] = mirror_name(copy["rigid"]) or copy["rigid"]
                table[twin] = copy
    regions = []
    for rule in spec.get("regions", []):
        regions.append(rule)
        twin = left_twin(rule["part"])
        if twin and rule.get("mirror", True):
            copy = dict(rule)
            copy["part"] = twin
            if "capsule" in rule:
                copy["capsule"] = mirror_list(rule["capsule"])
            if "segment" in rule:
                copy["segment"] = [[-p[0], p[1], p[2]] for p in rule["segment"]]
            if "box" in rule:
                (x0, y0, z0), (x1, y1, z1) = rule["box"]
                copy["box"] = [[-x1, y0, z0], [-x0, y1, z1]]
            if rule.get("side"):
                copy["side"] = {"l": "r", "r": "l"}[rule["side"]]
            for key in ("from", "notFrom"):
                if key in rule:
                    copy[key] = mirror_list(rule[key])
            regions.append(copy)
    spec["regions"] = regions
    # FX_*_R sockets get a mirrored FX_*_L twin on the mirrored bone (hand_r ->
    # hand_l); before 24/10 the bone kept its _r name and FX_HAND_L rode hand_r.
    for socket, value in list(spec.get("sockets", {}).items()):
        twin = socket[:-2] + "_L" if socket.endswith("_R") else None
        if twin and twin not in spec["sockets"] and value.get("mirror", True):
            spec["sockets"][twin] = {"bone": mirror_name(value["bone"]) or value["bone"], "at": [-value["at"][0], value["at"][1], value["at"][2]]}
    errors = socket_side_errors(spec)
    if errors:
        raise SystemExit("socket on the wrong side: " + ", ".join(errors))
    return spec


def expand(names, bones):
    """'tail_*' style entries bring every bone with that prefix."""
    out = []
    for name in names:
        if name.endswith("*"):
            out += [b for b in bones if b.startswith(name[:-1])]
        else:
            out.append(name)
    return list(dict.fromkeys(out))


def mirror_list(names):
    return [mirror_name(n) or n for n in names]


def ordered(bones):
    """Parents before children."""
    done, out = set(), []
    while len(out) < len(bones):
        for name, bone in bones.items():
            if name in done:
                continue
            if not bone.get("parent") or bone["parent"] in done:
                out.append(name)
                done.add(name)
    return out


# ----------------------------------------------------------------------------
# Mesh
# ----------------------------------------------------------------------------
def prepare_mesh(spec, root):
    static = C.parent_tools()
    obj = C.import_mesh(os.path.join(root, "art-src", "3d", spec["source"]))
    obj.name = spec["id"] + "_mesh"
    report = {"trianglesSource": C.triangles(obj)}
    report["scale"] = round(C.place(obj, spec.get("yaw", 0), spec["height"]), 5)
    _before, after, locked = static.decimate(obj, int(spec.get("triangles") or 0))
    report["triangles"] = after
    report["seamVerticesLocked"] = locked
    if spec.get("material"):
        import tempfile
        folder = tempfile.mkdtemp(prefix="td-rig-matte-")
        sub = {"warnings": []}
        static.matte({"material": spec["material"]}, sub, folder)
        report["material"] = sub.get("material")
    return obj, report


def snap_joints(spec, mesh):
    """Move listed bones' tails to the local centroid of the mesh (tail, limbs);
    a child whose head sat on its parent's tail moves with it."""
    co = C.vertex_array(mesh)
    moved = {}
    for name, radius in spec.get("snap", {}).items():
        old = np.array(spec["bones"][name]["tail"], dtype=float)
        point = old.copy()
        for _ in range(4):
            near = co[np.linalg.norm(co - point, axis=1) < radius]
            if len(near) < 8:
                break
            point = near.mean(0)
        spec["bones"][name]["tail"] = point.round(4).tolist()
        moved[name] = [old.round(3).tolist(), point.round(3).tolist()]
        for child, bone in spec["bones"].items():
            if bone.get("parent") == name and np.allclose(bone["head"], old, atol=1e-4):
                bone["head"] = point.round(4).tolist()
    return moved


# ----------------------------------------------------------------------------
# Armature
# ----------------------------------------------------------------------------
def build_armature(spec):
    data = bpy.data.armatures.new(spec["id"] + "_rig")
    rig = bpy.data.objects.new(spec["id"] + "_rig", data)
    bpy.context.scene.collection.objects.link(rig)
    select_only([rig])
    bpy.ops.object.mode_set(mode="EDIT")
    for name in ordered(spec["bones"]):
        bone = spec["bones"][name]
        edit = data.edit_bones.new(name)
        edit.head = Vector(bone["head"])
        edit.tail = Vector(bone["tail"])
        # Roll: the bone's Z axis toward the character's front (-Y) where it
        # can, else up; it only matters for readability, clips work in world space.
        axis = (edit.tail - edit.head).normalized()
        ref = Vector((0, -1, 0)) if abs(axis.y) < 0.9 else Vector((0, 0, 1))
        edit.align_roll(ref)
        if bone.get("parent"):
            edit.parent = data.edit_bones[bone["parent"]]
            edit.use_connect = False
        edit.use_deform = bone.get("deform", name != "root")
    bpy.ops.object.mode_set(mode="OBJECT")
    for pose_bone in rig.pose.bones:
        pose_bone.rotation_mode = "QUATERNION"
    return rig


def segment_distance(points, head, tail):
    ab = tail - head
    t = np.clip(((points - head) @ ab) / max(ab @ ab, 1e-12), 0, 1)
    return np.linalg.norm(points - (head + t[:, None] * ab), axis=1)


def classify(spec, co):
    """Part per vertex: nearest bone by distance / radius, then region overrides."""
    deform = [n for n, b in spec["bones"].items() if b.get("deform", n != "root") and b.get("part")]
    scores = np.stack([segment_distance(co, np.array(spec["bones"][n]["head"]), np.array(spec["bones"][n]["tail"]))
                       / float(spec["bones"][n].get("radius", 0.15)) for n in deform], axis=1)
    nearest = np.array([spec["bones"][n]["part"] for n in deform])[scores.argmin(1)]
    part = nearest.astype(object)
    for rule in spec.get("regions", []):
        mask = np.ones(len(co), dtype=bool)
        if "zMin" in rule:
            mask &= co[:, 2] >= rule["zMin"]
        if "zMax" in rule:
            mask &= co[:, 2] <= rule["zMax"]
        if "box" in rule:
            lo, hi = np.array(rule["box"][0]), np.array(rule["box"][1])
            mask &= np.all((co >= lo) & (co <= hi), axis=1)
        if "segment" in rule:
            a, b = (np.array(p, dtype=float) for p in rule["segment"])
            mask &= segment_distance(co, a, b) <= rule["radius"]
        if "capsule" in rule:
            d = np.min([segment_distance(co, np.array(spec["bones"][n]["head"]), np.array(spec["bones"][n]["tail"]))
                        for n in expand(rule["capsule"], spec["bones"])], axis=0)
            mask &= d <= rule["radius"]
        if "from" in rule:
            mask &= np.isin(part.astype(str), rule["from"])
        if "notFrom" in rule:
            mask &= ~np.isin(part.astype(str), rule["notFrom"])
        if "colour" in rule and spec.get("_rgb") is not None:
            mask &= C.colour_mask(spec["_rgb"], rule["colour"])
        side = rule.get("side")
        if side == "l":
            mask &= co[:, 0] > 0
        elif side == "r":
            mask &= co[:, 0] < 0
        part[mask] = rule["part"] + (("_" + side) if side and rule.get("suffix", False) else "")
    return part.astype(str)


def heat_weights(mesh, rig, names):
    select_only([mesh, rig])
    bpy.context.view_layer.objects.active = rig
    mesh.select_set(True)
    rig.select_set(True)
    out = np.zeros((len(mesh.data.vertices), len(names)), dtype=np.float64)
    try:
        bpy.ops.object.parent_set(type="ARMATURE_AUTO")
    except RuntimeError as error:
        log("bone heat failed:", error)
        return out, False
    column = {n: i for i, n in enumerate(names)}
    index_of = {g.index: g.name for g in mesh.vertex_groups}
    for vertex in mesh.data.vertices:
        for item in vertex.groups:
            name = index_of.get(item.group)
            if name in column:
                out[vertex.index, column[name]] = item.weight
    keep = mesh.matrix_world.copy()
    mesh.parent = None
    mesh.matrix_world = keep
    for modifier in list(mesh.modifiers):
        if modifier.type == "ARMATURE":
            mesh.modifiers.remove(modifier)
    mesh.vertex_groups.clear()
    return out, True


def skin(spec, mesh, rig):
    co = C.vertex_array(mesh)
    names = [b.name for b in rig.data.bones if b.use_deform]
    column = {n: i for i, n in enumerate(names)}
    if any("colour" in rule for rule in spec.get("regions", [])):
        spec["_rgb"] = C.vertex_rgb(mesh)
    part = classify(spec, co)
    heat, ok = heat_weights(mesh, rig, names)
    parts = spec["parts"]
    allowed = np.zeros((len(co), len(names)))
    for name, value in parts.items():
        rows = part == name
        for bone in value["bones"]:
            allowed[rows, column[bone]] = 1
    unknown = ~np.isin(part, list(parts))
    allowed[unknown] = 1
    w = heat * allowed
    # Vertices heat left empty (or masked out): nearest allowed bone.
    heads = {n: np.array(spec["bones"][n]["head"]) for n in names}
    tails = {n: np.array(spec["bones"][n]["tail"]) for n in names}
    dist = np.stack([segment_distance(co, heads[n], tails[n]) for n in names], axis=1)
    empty = w.sum(1) < 0.05
    if empty.any():
        d = np.where(allowed[empty] > 0, dist[empty], np.inf)
        w[empty] = 0
        w[np.nonzero(empty)[0], d.argmin(1)] = 1
    w /= w.sum(1, keepdims=True)
    # Smooth along edges, re-mask, keep rigid parts rigid.
    edges = C.edges_array(mesh)
    degree = np.bincount(edges.ravel(), minlength=len(co)).astype(float)[:, None]
    degree[degree == 0] = 1
    for _ in range(int(spec.get("smoothPasses", 4))):
        total = np.zeros_like(w)
        np.add.at(total, edges[:, 0], w[edges[:, 1]])
        np.add.at(total, edges[:, 1], w[edges[:, 0]])
        w = 0.5 * w + 0.5 * total / degree
        w *= allowed
        bad = w.sum(1) < 1e-6
        w[bad] = heat[bad] * allowed[bad] + 1e-9
        w /= w.sum(1, keepdims=True)
    # Rigid parts (head, shield, hat): one bone, blended over a band in z.
    rigid_count = 0
    for name, value in parts.items():
        if not value.get("rigid"):
            continue
        rows = part == name
        target = np.zeros(len(names))
        target[column[value["rigid"]]] = 1
        if value.get("band"):
            z0, z1 = value["band"]
            t = np.clip((co[rows, 2] - z0) / max(z1 - z0, 1e-6), 0, 1)
            t = t * t * (3 - 2 * t)
            w[rows] = w[rows] * (1 - t[:, None]) + target * t[:, None]
        else:
            w[rows] = target
        rigid_count += int(rows.sum())
    # Loose pieces move with the bone that holds most of them.
    label, sizes = C.islands(mesh)
    small = sizes[label] <= int(spec.get("rigidIslands", 64))
    if small.any():
        summed = np.zeros((len(sizes), len(names)))
        np.add.at(summed, label, w)
        best = summed.argmax(1)
        w[small] = 0
        w[np.nonzero(small)[0], best[label[small]]] = 1
    # At most 4 bones per vertex.
    order = np.argsort(-w, axis=1)
    keep = np.zeros_like(w, dtype=bool)
    np.put_along_axis(keep, order[:, :4], True, axis=1)
    w = np.where(keep & (w > 0.01), w, 0)
    w /= w.sum(1, keepdims=True)
    groups = {n: mesh.vertex_groups.new(name=n) for n in names}
    for j, n in enumerate(names):
        rows = np.nonzero(w[:, j] > 0)[0]
        for value in np.unique(np.round(w[rows, j], 4)):
            members = rows[np.round(w[rows, j], 4) == value]
            groups[n].add(members.tolist(), float(value), "REPLACE")
    modifier = mesh.modifiers.new("Armature", "ARMATURE")
    modifier.object = rig
    keep_matrix = mesh.matrix_world.copy()
    mesh.parent = rig
    mesh.matrix_world = keep_matrix
    counts = {p: int((part == p).sum()) for p in np.unique(part)}
    per_bone = {n: int((w[:, j] > 0.5).sum()) for j, n in enumerate(names)}
    influences = np.bincount((w > 0).sum(1), minlength=5).tolist()
    log("skin: heat", "ok" if ok else "FAILED", "parts", counts, "rigid", rigid_count, "loose", int(small.sum()))
    return {"heat": ok, "parts": counts, "rigidVertices": rigid_count, "looseVertices": int(small.sum()),
            "dominantVerticesPerBone": per_bone, "influenceHistogram": influences}, part, w, names


def add_sockets(spec, rig):
    made = {}
    for name, value in spec.get("sockets", {}).items():
        empty = bpy.data.objects.new(name, None)
        bpy.context.scene.collection.objects.link(empty)
        empty.empty_display_type = "SPHERE"
        empty.empty_display_size = 0.05
        bone = rig.data.bones[value["bone"]]
        empty.parent = rig
        empty.parent_type = "BONE"
        empty.parent_bone = value["bone"]
        # Bone parenting puts the child at the bone's tail.
        rest = rig.matrix_world @ bone.matrix_local
        tail_frame = Matrix.Translation(rig.matrix_world @ bone.tail_local) @ rest.to_3x3().to_4x4()
        empty.matrix_parent_inverse = tail_frame.inverted()
        empty.location = Vector(value["at"])
        made[name] = [round(v, 3) for v in value["at"]]
    bpy.context.view_layer.update()
    return made


# ----------------------------------------------------------------------------
# Poses: rest data, forward kinematics, keying
# ----------------------------------------------------------------------------
class Rest:
    """Rest matrices (armature space) of an armature, parents first."""

    def __init__(self, rig):
        self.rig = rig
        self.names = []
        self.matrix = {}
        self.parent = {}
        self.length = {}

        def walk(bone):
            self.names.append(bone.name)
            self.matrix[bone.name] = bone.matrix_local.copy()
            self.parent[bone.name] = bone.parent.name if bone.parent else None
            self.length[bone.name] = bone.length
            for child in bone.children:
                walk(child)

        for bone in rig.data.bones:
            if bone.parent is None:
                walk(bone)
        self.local = {n: (self.matrix[self.parent[n]].inverted() @ self.matrix[n]) if self.parent[n] else self.matrix[n].copy()
                      for n in self.names}
        self.rot = {n: self.matrix[n].to_quaternion() for n in self.names}

    def fk(self, basis):
        """basis {bone: (Quaternion, Vector)} -> armature-space 4x4 per bone."""
        out = {}
        for n in self.names:
            q, t = basis.get(n, (Quaternion(), Vector()))
            local = self.local[n] @ Matrix.Translation(t) @ q.to_matrix().to_4x4()
            out[n] = out[self.parent[n]] @ local if self.parent[n] else local
        return out

    def world_q(self, bone, q):
        """Rotation about world axes (rest frame) -> basis quaternion."""
        r = self.rot[bone]
        return r.inverted() @ q @ r


def identity_pose(rest):
    return {n: (Quaternion(), Vector()) for n in rest.names}


def write_action(rig, name, frames, loop=False, track=True):
    """frames: list of basis dicts (one per frame, frame 0..n-1) -> NLA track `name`
    (track=False: the action stays assigned, for evaluation)."""
    rig.animation_data_create()
    action = bpy.data.actions.new(name)
    action.use_fake_user = True
    rig.animation_data.action = action
    n = len(frames)
    names = [pb.name for pb in rig.pose.bones]
    for bone in names:
        pb = rig.pose.bones[bone]
        pb.rotation_mode = "QUATERNION"
        pb.rotation_quaternion = Quaternion()
        pb.location = Vector()
        pb.keyframe_insert("rotation_quaternion", frame=0, group=bone)
        pb.keyframe_insert("location", frame=0, group=bone)
    curves = {}
    for fc in fcurves_of(action, rig):
        curves[(fc.data_path, fc.array_index)] = fc
    for bone in names:
        q = [frames[f].get(bone, (Quaternion(), Vector()))[0] for f in range(n)]
        # Keep quaternions in one hemisphere so linear keys do not flip.
        for f in range(1, n):
            if q[f].dot(q[f - 1]) < 0:
                q[f] = -q[f]
        t = [frames[f].get(bone, (Quaternion(), Vector()))[1] for f in range(n)]
        for index in range(4):
            fc = curves[('pose.bones["%s"].rotation_quaternion' % bone, index)]
            set_keys(fc, [(f, q[f][index]) for f in range(n)])
        for index in range(3):
            fc = curves[('pose.bones["%s"].location' % bone, index)]
            set_keys(fc, [(f, t[f][index]) for f in range(n)])
    if not track:
        return action
    rig.animation_data.action = None
    nla = rig.animation_data.nla_tracks.new()
    nla.name = name
    strip = nla.strips.new(name, 0, action)
    strip.name = name
    strip.mute = False
    nla.mute = True  # tracks only carry clips for export; nothing plays by default
    return action


def ground_clamp(rig, mesh, rest, frames, floor=0.0, ignore=None):
    """Raise the pelvis on frames where the skinned mesh goes below the floor
    (a big chibi head lying down, a deep crouch). Returns the largest lift.
    ignore: vertex mask left out of the test (fists meant to pound the ground)."""
    action = write_action(rig, "_ground_probe", frames, track=False)
    lifts = []
    for f in range(len(frames)):
        bpy.context.scene.frame_set(f)
        z = C.evaluated_vertices(mesh)[:, 2]
        lifts.append(floor - float((z if ignore is None else z[~ignore]).min()))
    rig.animation_data.action = None
    bpy.data.actions.remove(action)
    # A clip that never touches the floor (a retargeted idle whose legs splay a
    # little wider than the source's) is lowered as a whole; frames that go
    # under it are raised one by one.
    if max(lifts) < -0.003:
        drop = max(lifts)
        lifts = [drop] * len(lifts)
    else:
        lifts = [max(0.0, v) for v in lifts]
    if max(abs(v) for v in lifts) <= 1e-4:
        return 0.0
    out = []
    for basis, lift in zip(frames, lifts):
        basis = dict(basis)
        q, t = basis["pelvis"]
        basis["pelvis"] = (q, t + rest.rot["pelvis"].inverted() @ Vector((0, 0, lift)))
        out.append(basis)
    frames[:] = out
    return max(lifts, key=abs)


def fcurves_of(action, rig):
    if hasattr(action, "fcurves") and len(getattr(action, "fcurves", [])):
        return list(action.fcurves)
    # Blender 4.4+: layered actions keep curves in a channelbag per slot.
    out = []
    for layer in getattr(action, "layers", []):
        for strip in layer.strips:
            for bag in getattr(strip, "channelbags", []):
                out += list(bag.fcurves)
    return out


def set_keys(fc, keys):
    fc.keyframe_points.clear()
    fc.keyframe_points.add(len(keys))
    flat = []
    for f, v in keys:
        flat += [float(f), float(v)]
    fc.keyframe_points.foreach_set("co", flat)
    fc.keyframe_points.foreach_set("interpolation", [1] * len(keys))  # LINEAR
    fc.update()


def read_action(rig, action, rest):
    """Basis per frame of an action (sampled each frame)."""
    ad = rig.animation_data_create()
    ad.action = action
    if hasattr(ad, "action_slot") and getattr(action, "slots", None) and ad.action_slot is None:
        ad.action_slot = action.slots[0]
    start, end = (int(round(v)) for v in action.frame_range)
    out = []
    for f in range(start, end + 1):
        bpy.context.scene.frame_set(f)
        out.append({n: (rig.pose.bones[n].rotation_quaternion.copy() if rig.pose.bones[n].rotation_mode == "QUATERNION"
                        else rig.pose.bones[n].matrix_basis.to_quaternion(), rig.pose.bones[n].location.copy()) for n in rest.names})
    return out


# ----------------------------------------------------------------------------
# Retarget (world space, rest aware)
# ----------------------------------------------------------------------------
class Source:
    """A CC0 clip library: armature + actions from one GLB."""

    def __init__(self, path, tag):
        before_objects = set(bpy.data.objects)
        before_actions = set(bpy.data.actions)
        bpy.ops.import_scene.gltf(filepath=path)
        new = [o for o in bpy.data.objects if o not in before_objects]
        self.arm = next(o for o in new if o.type == "ARMATURE")
        self.arm.name = "SRC_" + tag
        for o in new:
            if o.type == "MESH":
                o.hide_render = True
                o.hide_viewport = True
        self.actions = {}
        for action in bpy.data.actions:
            if action in before_actions:
                continue
            base = action.name.split(".")[0] if action.name.rsplit(".", 1)[-1].isdigit() else action.name
            self.actions[base] = action
            action.use_fake_user = True
        if self.arm.animation_data:
            self.arm.animation_data.action = None
            for track in list(self.arm.animation_data.nla_tracks):
                self.arm.animation_data.nla_tracks.remove(track)
        self.rest = {b.name: b.matrix_local.copy() for b in self.arm.data.bones}
        log("source", tag, len(self.actions), "actions")

    def sample(self, action_name, rate=1.0):
        """World matrices per frame for every source bone."""
        action = self.actions[action_name]
        ad = self.arm.animation_data_create()
        ad.action = action
        if hasattr(ad, "action_slot") and getattr(action, "slots", None):
            try:
                ad.action_slot = action.slots[0]
            except Exception:
                pass
        start, end = action.frame_range
        frames = []
        f = start
        while f <= end + 1e-6:
            bpy.context.scene.frame_set(int(math.floor(f)), subframe=f - math.floor(f))
            # Relative to the root bone: root motion (RM clips) and stray root
            # offsets (Hit_Chest lifts its root 0.58 m) are dropped here.
            root = self.arm.pose.bones.get("root")
            base = (self.arm.data.bones["root"].matrix_local @ root.matrix.inverted()) if root else Matrix.Identity(4)
            frames.append({pb.name: self.arm.matrix_world @ base @ pb.matrix for pb in self.arm.pose.bones})
            f += rate
        ad.action = None
        return frames


def rmin(a, b):
    return a.rotation_difference(b)


def retarget(rest, src_rest, src_frames, mapping, options):
    """Source world matrices per frame -> target basis per frame.

    Target world rotation = S(t) S0^-1 P0, where P0 is the target rest bone
    turned (shortest arc) onto the source rest bone's direction, so limbs point
    the same way as the source's at every frame whatever the two rest poses.
    The pelvis moves by the source's offset times the hip-height ratio.
    options["direction"]: bones matched by direction (arms against a T-pose
    source); the others take the source's turn from rest (delta)."""
    s0 = {t: src_rest[s].to_quaternion() for t, s in mapping.items()}
    p0 = {}
    direction = options.get("direction")
    for t, s in mapping.items():
        if direction is not None and t not in direction:
            # Delta bones (legs, spine): the source's turn from its rest is
            # applied to the target's own rest (keeps a chibi's wide stance).
            p0[t] = rest.rot[t]
            continue
        dt = rest.rot[t] @ Vector((0, 1, 0))
        ds = s0[t] @ Vector((0, 1, 0))
        p0[t] = rmin(dt, ds) @ rest.rot[t]
    pelvis_t = options.get("pelvis", "pelvis")
    pelvis_s = mapping[pelvis_t]
    hip_t = rest.matrix[pelvis_t].translation.z
    hip_s = src_rest[pelvis_s].translation.z
    # Pelvis travel scales with leg length (hip to ankle), not hip height: a
    # chibi's legs are short under a high pelvis, and the same knee bend
    # lowers it less.
    feet = [f for f in ("foot_l", "foot_r") if f in mapping and f in rest.matrix]
    if feet:
        ankle_t = sum(rest.matrix[f].translation.z for f in feet) / len(feet)
        ankle_s = sum(src_rest[mapping[f]].translation.z for f in feet) / len(feet)
        k = (hip_t - ankle_t) / max(hip_s - ankle_s, 1e-6)
    else:
        k = hip_t / hip_s
    src_head0 = src_rest[pelvis_s].translation
    abduct = {b: (Vector(v[0]), math.radians(v[1])) for b, v in options.get("abduct", {}).items()}
    scale = dict(options.get("bodyScale", {}))
    scale.update(options.get("scale", {}))
    out = []
    offsets = []
    for frame in src_frames:
        world = {}
        basis = {}
        for n in rest.names:
            parent = rest.parent[n]
            parent_rot = world[parent] if parent else Quaternion()
            frame_rot = parent_rot @ (rest.rot[parent].inverted() @ rest.rot[n] if parent else rest.rot[n])
            if n in mapping:
                s = mapping[n]
                desired = frame[s].to_quaternion() @ s0[n].inverted() @ p0[n]
                q = frame_rot.inverted() @ desired
                if n in scale:
                    q = Quaternion().slerp(q, scale[n]) if scale[n] <= 1 else q
            else:
                q = Quaternion()
            if n in abduct:
                axis, angle = abduct[n]
                # Pre-multiplied: about a world axis carried by the parent's frame,
                # so an arm stays clear of a chibi's round body whatever it swings.
                q = rest.world_q(n, Quaternion(axis, angle)) @ q
            world[n] = frame_rot @ q
            basis[n] = (q, Vector())
        head = frame[pelvis_s].translation
        offsets.append((head - src_head0) * k)
        out.append(basis)
    mode = options.get("inplace", "trend")
    n = len(out)
    if n > 1 and mode != "keep":
        first, last = offsets[0], offsets[-1]
        for i, offset in enumerate(offsets):
            if mode == "lock":
                offsets[i] = Vector((0, 0, offset.z))
            else:
                drift = first.lerp(last, i / (n - 1))
                offsets[i] = Vector((offset.x - drift.x, offset.y - drift.y, offset.z))
    for basis, offset in zip(out, offsets):
        q, _ = basis[pelvis_t]
        basis[pelvis_t] = (q, rest.rot[pelvis_t].inverted() @ offset)
    return out


def face_forward(rest, frames, frame_index=0):
    """Turn the whole clip about Z so the hips face -Y at `frame_index`
    (Quaternius idles stand turned 13-41 degrees; the game turns the body)."""
    if not frames or "thigh_l" not in rest.rot:
        return frames, 0.0
    world = rest.fk(frames[frame_index])
    lateral = world["thigh_l"].translation - world["thigh_r"].translation
    yaw = math.atan2(lateral.y, lateral.x)
    turn = Quaternion((0, 0, 1), -yaw)
    out = []
    for basis in frames:
        basis = dict(basis)
        q, t = basis["pelvis"]
        offset = turn @ (rest.rot["pelvis"] @ t)
        basis["pelvis"] = (rest.world_q("pelvis", turn) @ q, rest.rot["pelvis"].inverted() @ offset)
        out.append(basis)
    return out, math.degrees(yaw)


# ----------------------------------------------------------------------------
# Springs (baked secondary motion)
# ----------------------------------------------------------------------------
def bake_springs(rest, frames, springs, loop, passes=4, substeps=8):
    if not springs:
        return frames
    dt = 1.0 / FPS / substeps
    for chain_name, chain in springs.items():
        bones = chain["bones"]
        k = (2 * math.pi * chain.get("freq", 2.5)) ** 2
        c = 2 * chain.get("damping", 0.3) * (2 * math.pi * chain.get("freq", 2.5))
        limit = math.radians(chain.get("maxAngle", 45))
        blend = chain.get("amount", 1.0)
        tips = {b: None for b in bones}
        vel = {b: Vector() for b in bones}
        runs = passes if loop else 1
        closing = loop and len(frames) > 2
        sequence = list(range(len(frames) - 1 if closing else len(frames)))
        for run in range(runs):
            last_run = run == runs - 1
            warm = [0] * (FPS if (run == 0 and not loop) else 0)
            for step_index, f in enumerate(warm + sequence):
                record = last_run and step_index >= len(warm)
                basis = frames[f]
                world = rest.fk(basis)
                for b in bones:
                    parent = rest.parent[b]
                    frame_m = world[parent] @ rest.local[b]
                    q_key, t_key = basis.get(b, (Quaternion(), Vector()))
                    target = frame_m @ Matrix.Translation(t_key) @ q_key.to_matrix().to_4x4()
                    head = target.translation.copy()
                    tdir = (target.to_3x3() @ Vector((0, 1, 0))).normalized()
                    length = rest.length[b]
                    goal = head + tdir * length
                    if tips[b] is None:
                        tips[b] = goal.copy()
                    p, v = tips[b], vel[b]
                    for _ in range(substeps):
                        a = (goal - p) * k - v * c
                        v = v + a * dt
                        p = p + v * dt
                        d = p - head
                        if d.length < 1e-6:
                            d = tdir.copy()
                        p = head + d.normalized() * length
                    if chain.get("only"):
                        # One-sided swing (a charm hanging in front of a face
                        # may swing out, never back through it).
                        normal = (world[parent].to_quaternion() @ rest.rot[parent].inverted() @ Vector(chain["only"])).normalized()
                        push = (p - goal).dot(normal)
                        if push < 0:
                            p = p - normal * push
                            p = head + (p - head).normalized() * length
                            v = v - normal * min(0.0, v.dot(normal))
                    d = (p - head).normalized()
                    angle = tdir.angle(d, 0.0)
                    if angle > limit:
                        axis = tdir.cross(d)
                        if axis.length > 1e-8:
                            d = Quaternion(axis.normalized(), limit) @ tdir
                            p = head + d * length
                    tips[b], vel[b] = p, v
                    swing = tdir.rotation_difference(d)
                    swing = Quaternion().slerp(swing, blend)
                    rot = swing @ target.to_quaternion()
                    local = (frame_m.to_quaternion().inverted() @ rot).normalized()
                    if record:
                        frames[f] = dict(frames[f])
                        frames[f][b] = (local, t_key)
                    world[b] = Matrix.Translation(head) @ rot.to_matrix().to_4x4()
                    basis = frames[f] if record else dict(basis, **{b: (local, t_key)})
        if closing:
            last = dict(frames[-1])
            for b in bones:
                last[b] = frames[0][b]
            frames[-1] = last
    return frames


# ----------------------------------------------------------------------------
# Clip post-processing
# ----------------------------------------------------------------------------
def slerp_pose(a, b, t):
    out = {}
    for n in set(a) | set(b):
        qa, ta = a.get(n, (Quaternion(), Vector()))
        qb, tb = b.get(n, (Quaternion(), Vector()))
        if qa.dot(qb) < 0:
            qb = -qb
        out[n] = (qa.slerp(qb, t), ta.lerp(tb, t))
    return out


def ease(t):
    t = min(max(t, 0.0), 1.0)
    return t * t * (3 - 2 * t)


def blend_ends(frames, idle, blend_in, blend_out):
    n = len(frames)
    out = []
    for i, pose in enumerate(frames):
        w = 1.0
        if blend_in and i < blend_in:
            w = min(w, ease(i / blend_in))
        if blend_out and i > n - 1 - blend_out:
            w = min(w, ease((n - 1 - i) / blend_out))
        out.append(slerp_pose(idle, pose, w) if w < 1 else pose)
    return out


def close_loop(frames, span):
    """Cross-fade the last `span` frames into the first so the loop has no seam."""
    n = len(frames)
    if n < 4 or span <= 0:
        return frames
    out = list(frames)
    for i in range(span):
        t = ease((i + 1) / (span + 1))
        j = n - span + i
        out[j] = slerp_pose(frames[j], frames[0], t)
    return out


# ----------------------------------------------------------------------------
# Build
# ----------------------------------------------------------------------------
def build(args, spec):
    root = os.path.abspath(args.root)
    mesh, report = prepare_mesh(spec, root)
    report["snap"] = snap_joints(spec, mesh)
    rig = build_armature(spec)
    skin_report, part, weights, names = skin(spec, mesh, rig)
    report["skin"] = skin_report
    import td_rig_attach
    if spec.get("attachments"):
        report["attachments"] = td_rig_attach.attach(spec, rig, root)
    report["sockets"] = add_sockets(spec, rig)
    if args.mode == "bones":
        return rig, mesh, report, part, weights, names
    import td_rig_clips
    report["clips"] = td_rig_clips.make_clips(spec, rig, root, mesh)
    td_rig_attach.extras(spec, rig, report)
    return rig, mesh, report, part, weights, names


def export(spec, rig, mesh, root):
    folder = os.path.join(root, "art-src", "models", spec["kind"])
    os.makedirs(folder, exist_ok=True)
    path = os.path.join(folder, spec["id"] + ".glb")
    for obj in list(bpy.context.scene.objects):
        if obj.name.startswith("SRC_") or (obj.type == "MESH" and obj is not mesh) or obj.type in ("CAMERA", "LIGHT"):
            obj.hide_render = True
    # Front -Y (authoring) -> +Y (Blender) = glTF -Z: turn the rig object.
    rig.rotation_mode = "XYZ"
    rig.rotation_euler = (0, 0, math.pi)
    import td_rig_attach
    held = td_rig_attach.attachment_meshes(rig)
    keep = [rig, mesh] + held + [o for o in bpy.context.scene.objects if o.type == "EMPTY" and o.name.startswith("FX_")]
    select_only(keep)
    bpy.ops.export_scene.gltf(
        filepath=path, export_format="GLB", use_selection=True, export_yup=True, export_apply=False,
        export_texcoords=True, export_normals=True, export_materials="EXPORT", export_animations=True,
        export_skins=True, export_morph=False, export_animation_mode="NLA_TRACKS", export_def_bones=False,
        export_force_sampling=True, export_frame_step=1, export_extras="td_clips" in rig.keys())
    rig.rotation_euler = (0, 0, 0)
    log("exported", path)
    return path


def main():
    argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
    parser = argparse.ArgumentParser(prog="td_rig_tools.py")
    parser.add_argument("--spec", required=True)
    parser.add_argument("--root", required=True)
    parser.add_argument("--work", default="")
    parser.add_argument("--mode", default="build", choices=["build", "bones"])
    parser.add_argument("--no-export", action="store_true")
    args = parser.parse_args(argv)
    spec = load_spec(args.spec)
    bpy.context.scene.render.fps = FPS
    rig, mesh, report, part, weights, names = build(args, spec)
    root = os.path.abspath(args.root)
    if args.mode == "build" and not args.no_export:
        report["output"] = export(spec, rig, mesh, root)
    if args.work:
        os.makedirs(args.work, exist_ok=True)
        np.save(os.path.join(args.work, "parts.npy"), part)
        with open(os.path.join(args.work, "weights_names.json"), "w") as handle:
            json.dump(names, handle)
        np.save(os.path.join(args.work, "weights.npy"), weights.astype(np.float32))
        bpy.ops.wm.save_as_mainfile(filepath=os.path.join(args.work, spec["id"] + ("_bones" if args.mode == "bones" else "") + ".blend"),
                                    compress=True)
        with open(os.path.join(args.work, "build-report.json"), "w") as handle:
            json.dump(report, handle, indent=1, default=str)
    log("done", spec["id"], json.dumps({k: report.get(k) for k in ("triangles", "scale")}))


if __name__ == "__main__":
    main()
