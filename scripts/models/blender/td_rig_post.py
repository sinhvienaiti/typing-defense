"""Clip post-processing for td_rig_clips.py (review findings of 24/10/2026).

All functions work on basis dicts {bone: (Quaternion, Vector)} with the
armature at identity (authoring frame of td_rig_common.py: Z up, front -Y).

- layer(): a constant overlay (rot / add / aim of td_rig_clips.Poser) on every
  frame, e.g. the arm that holds a spear over a retargeted walk.
- foot_ik(): two-bone leg IK that pins ankles to targets (feet stay planted in
  one-shots; a stepping foot moves only while lifted).
- world_bone(): put a bone at a world position / rotation (a spear or a leaf
  leaving the hand or the head).
- head_level(): neck and head counter-rotate so the face never pitches below
  a minimum (the 55-degree game camera must see faces when the body leans).
- steady_lean(): replace a run's torso pitch by a constant lean (no pecking).
- drive(): flaps (kilt, robe) pushed by the thighs.
- settle(): spring chains blend back to the idle pose over a clip's last frames.
- residual_deg(): how far chains end from the idle pose (crossfade metadata).
"""

import math

from mathutils import Matrix, Quaternion, Vector

UP = Vector((0, 0, 1))


def _rot(m):
    return m.to_quaternion()


def frame_rot(rest, world, bone):
    """World rotation a bone has with an identity basis under its posed parent."""
    parent = rest.parent[bone]
    local = _rot(rest.local[bone])
    return (_rot(world[parent]) @ local) if parent else local


def set_world_rot(rest, basis, world, bone, rot):
    q = (frame_rot(rest, world, bone).inverted() @ rot).normalized()
    basis[bone] = (q, basis.get(bone, (Quaternion(), Vector()))[1])


def turn_world(rest, basis, bone, delta):
    """Turn a bone by `delta` (world axes) on top of its current pose."""
    world = rest.fk(basis)
    set_world_rot(rest, basis, world, bone, delta @ _rot(world[bone]))


# ----------------------------------------------------------------------------
def layer(poser, frames, spec):
    if not spec:
        return frames
    from td_rig_clips import Q  # noqa: E402

    def turn(rots):
        q = Quaternion()
        for axis, deg in rots:
            q = Q(axis, deg) @ q
        return q

    rot = {b: turn(r) for b, r in spec.get("rot", {}).items()}
    add = {b: turn(r) for b, r in spec.get("add", {}).items()}
    out = []
    for basis in frames:
        basis = poser.pose(rot=rot, add=add, aim=spec.get("aim"), base=basis, twist=spec.get("twist"))
        basis = apply_reach(poser.rest, basis, spec.get("reach"))
        for bone, direction in spec.get("worldAim", {}).items():
            aim_world(poser.rest, basis, bone, direction)
        out.append(basis)
    return out


def aim_world(rest, basis, bone, direction):
    """Point a bone along a world direction (shortest turn from where it is):
    a couched spear stays level whatever the jogging chest does."""
    world = rest.fk(basis)
    cur = _rot(world[bone])
    turn = (cur @ Vector((0, 1, 0))).rotation_difference(Vector(direction).normalized())
    set_world_rot(rest, basis, world, bone, turn @ cur)
    return basis


# ----------------------------------------------------------------------------
LEGS = (("thigh_l", "calf_l", "foot_l"), ("thigh_r", "calf_r", "foot_r"))


def leg_ik(rest, basis, thigh, calf, foot, target, foot_rot=None):
    """Pin the ankle (foot head) to `target`; the knee stays in its plane, the
    foot keeps its world rotation (or takes `foot_rot`: flat on the ground)."""
    world = rest.fk(basis)
    h, k, a = world[thigh].translation, world[calf].translation, world[foot].translation
    l1, l2 = (k - h).length, (a - k).length
    d = Vector(target) - h
    dist = min(max(d.length, abs(l1 - l2) + 1e-4), (l1 + l2) * 0.9995)
    u = d.normalized()
    pole = (k - h) - u * (k - h).dot(u)
    if pole.length < 1e-5:
        forward = Vector((0, -1, 0))
        pole = forward - u * forward.dot(u)
    v = pole.normalized()
    cos_a = max(-1.0, min(1.0, (l1 * l1 + dist * dist - l2 * l2) / (2 * l1 * dist)))
    angle = math.acos(cos_a)
    k_new = h + (u * math.cos(angle) + v * math.sin(angle)) * l1
    a_new = h + u * dist
    rt_old, rc_old, rf_old = _rot(world[thigh]), _rot(world[calf]), _rot(world[foot])
    rt_new = (k - h).normalized().rotation_difference((k_new - h).normalized()) @ rt_old
    set_world_rot(rest, basis, world, thigh, rt_new)
    carry = rt_new @ rt_old.inverted()
    dir_c = carry @ (a - k).normalized()
    rc_new = dir_c.rotation_difference((a_new - k_new).normalized()) @ carry @ rc_old
    world = rest.fk(basis)
    set_world_rot(rest, basis, world, calf, rc_new)
    world = rest.fk(basis)
    set_world_rot(rest, basis, world, foot, foot_rot if foot_rot is not None else rf_old)
    return basis


def ankles(rest, basis):
    world = rest.fk(basis)
    return {foot: world[foot].translation.copy() for _t, _c, foot in LEGS if foot in world}


def foot_ik(rest, frames, targets, rots=None):
    """targets: per frame {foot: Vector or None}; rots: {foot: world Quaternion}
    kept by planted feet (a hip tilt or twist must not dig the toes in)."""
    out = []
    for basis, goal in zip(frames, targets):
        basis = dict(basis)
        for thigh, calf, foot in LEGS:
            if foot in rest.rot and goal.get(foot) is not None:
                leg_ik(rest, basis, thigh, calf, foot, goal[foot], (rots or {}).get(foot))
        out.append(basis)
    return out


def foot_rots(rest, basis):
    world = rest.fk(basis)
    return {foot: _rot(world[foot]) for _t, _c, foot in LEGS if foot in world}


def lock_feet(rest, frames, anchor, reach=0.08, band=0.035):
    """Retargeted one-shots: a foot near the ground is pulled to the anchor
    pose's ankle (x, y); a lifted foot is free. Fully held up to `band` m
    above the anchor (a foot that counts as planted must not slide at all),
    then fades out by `reach` metres."""
    base = ankles(rest, anchor)
    targets = []
    for basis in frames:
        now = ankles(rest, basis)
        goal = {}
        for foot, p in now.items():
            w = max(0.0, min(1.0, 1 - (p.z - base[foot].z - band) / max(reach - band, 1e-6)))
            goal[foot] = Vector((p.x + (base[foot].x - p.x) * w, p.y + (base[foot].y - p.y) * w, p.z))
        targets.append(goal)
    return foot_ik(rest, frames, targets)


# ----------------------------------------------------------------------------
def world_bone(rest, basis, bone, pos, rot):
    """Basis that puts `bone`'s head at `pos` with world rotation `rot`."""
    world = rest.fk(basis)
    parent = rest.parent[bone]
    frame = (world[parent] @ rest.local[bone]) if parent else rest.local[bone].copy()
    target = Matrix.Translation(Vector(pos)) @ rot.to_matrix().to_4x4()
    local = frame.inverted() @ target
    basis[bone] = (local.to_quaternion().normalized(), local.translation.copy())
    return basis


def bone_world(rest, basis, bone):
    m = rest.fk(basis)[bone]
    return m.translation.copy(), _rot(m)


# ----------------------------------------------------------------------------
def face_dir(rest, world, bone="head"):
    """The face's direction: -Y of the authoring frame carried by the head."""
    return (_rot(world[bone]) @ rest.rot[bone].inverted()) @ Vector((0, -1, 0))


def head_level(rest, frames, options):
    """Neck and head turn up (about the face's own lateral axis) whenever the
    face points more than `minPitch` degrees below the horizon."""
    if not options:
        return frames, 0.0
    lo = math.radians(options.get("minPitch", -5.0))
    share = options.get("bones", {"neck_01": 0.4, "head": 0.6})
    head = options.get("head", "head")
    worst = 0.0
    out = []
    for basis in frames:
        basis = dict(basis)
        world = rest.fk(basis)
        f = face_dir(rest, world, head)
        pitch = math.asin(max(-1.0, min(1.0, f.z)))
        deficit = lo - pitch
        if deficit > 0:
            worst = max(worst, math.degrees(deficit))
            axis = f.cross(UP)
            if axis.length > 1e-6:
                axis.normalize()
                for bone, part in share.items():
                    if bone in rest.rot:
                        turn_world(rest, basis, bone, Quaternion(axis, deficit * part))
        out.append(basis)
    return out, worst


def torso_pitch(rest, world, top="neck_01", bottom="pelvis"):
    """Forward lean of the pelvis-to-neck line, degrees (+ = top toward -Y)."""
    d = world[top].translation - world[bottom].translation
    return math.degrees(math.atan2(-d.y, d.z))


def steady_lean(rest, frames, options):
    """Every frame gets the same forward lean (degrees), spread over the spine."""
    if not options:
        return frames
    deg = float(options.get("deg", 15.0))
    bones = [b for b in options.get("bones", ["spine_01", "spine_02", "spine_03"]) if b in rest.rot]
    keep = float(options.get("keep", 0.0))  # fraction of the source's oscillation kept
    pitches = [torso_pitch(rest, rest.fk(b)) for b in frames]
    mean = sum(pitches) / len(pitches)
    out = []
    for basis, pitch in zip(frames, pitches):
        basis = dict(basis)
        want = deg + keep * (pitch - mean)
        # Each bone turns about its own joint, above the pelvis, so one pass
        # under-corrects (Lam's run ended at 20 degrees for 15): iterate.
        for _ in range(4):
            now = torso_pitch(rest, rest.fk(basis))
            if abs(want - now) < 0.2:
                break
            delta = math.radians(want - now) / max(len(bones), 1)
            for bone in bones:
                turn_world(rest, basis, bone, Quaternion((1, 0, 0), delta))
        out.append(basis)
    return out


def swing(rest, world, bone, axis=(1, 0, 0)):
    """Signed swing (radians) of a bone about a world axis, relative to its rest
    direction and measured in its parent's frame."""
    parent = rest.parent[bone]
    p = (_rot(world[parent]) @ rest.rot[parent].inverted()) if parent else Quaternion()
    now = p.inverted() @ (_rot(world[bone]) @ Vector((0, 1, 0)))
    then = rest.rot[bone] @ Vector((0, 1, 0))
    ax = Vector(axis).normalized()
    a = now - ax * now.dot(ax)
    b = then - ax * then.dot(ax)
    if a.length < 1e-6 or b.length < 1e-6:
        return 0.0
    return math.atan2(b.cross(a).dot(ax), b.dot(a))


def drive(rest, frames, drives):
    """drives {bone: {"from": [bones], "axis": [x,y,z], "gain": g, "pick": "min|max|mean", "clamp": [lo, hi] deg,
    "mode": "set|add"}}."""
    if not drives:
        return frames
    out = []
    for basis in frames:
        basis = dict(basis)
        world = rest.fk(basis)
        for bone, d in drives.items():
            if bone not in rest.rot:
                continue
            axis = Vector(d.get("axis", (1, 0, 0)))
            values = [swing(rest, world, src, axis) for src in d["from"] if src in rest.rot]
            if not values:
                continue
            pick = d.get("pick", "mean")
            v = min(values) if pick == "min" else max(values) if pick == "max" else sum(values) / len(values)
            v *= d.get("gain", 0.6)
            lo, hi = (math.radians(x) for x in d.get("clamp", (-90, 90)))
            v = max(lo, min(hi, v))
            q, t = basis.get(bone, (Quaternion(), Vector()))
            turn = rest.world_q(bone, Quaternion(axis, v))
            # "set" (default): the drive owns the bone, so a key pose built on an
            # already driven idle pose is not driven twice; "add" layers on top.
            basis[bone] = (turn @ q if d.get("mode") == "add" else turn, t)
        out.append(basis)
    return out


# ----------------------------------------------------------------------------
def chain_bones(springs):
    out = []
    for chain in (springs or {}).values():
        out += [b for b in chain.get("bones", []) if b not in out]
    return out


def settle(frames, idle, bones, count):
    """Blend chain bones to the idle pose over the last `count` frames."""
    if not idle or not bones or count <= 0 or len(frames) < count + 2:
        return frames
    from td_rig_tools import ease  # noqa: E402
    n = len(frames)
    out = list(frames)
    for i in range(n - count, n):
        w = ease((i - (n - count - 1)) / count)
        basis = dict(out[i])
        for b in bones:
            if b in basis and b in idle:
                qa, ta = basis[b]
                qb, tb = idle[b]
                if qa.dot(qb) < 0:
                    qb = -qb
                basis[b] = (qa.slerp(qb, w), ta.lerp(tb, w))
        out[i] = basis
    return out


def residual_deg(rest, last, idle, bones):
    """Largest world-direction difference (degrees) of chain bones, last frame vs idle."""
    if not idle or not bones:
        return 0.0
    wa, wb = rest.fk(last), rest.fk(idle)
    worst = 0.0
    for b in bones:
        if b in wa:
            da = _rot(wa[b]) @ Vector((0, 1, 0))
            db = _rot(wb[b]) @ Vector((0, 1, 0))
            worst = max(worst, math.degrees(da.angle(db, 0.0)))
    return worst


def ground_speed(rest, frames, fps=24, band=0.035):
    """In-place locomotion: speed (m/s) of a planted ankle moving back = the
    speed the game should move the body at; spread = p90 / median (1.0 = no
    slide while planted)."""
    import statistics
    speeds = []
    tracks = [ankles(rest, b) for b in frames]
    for foot in tracks[0]:
        zs = [t[foot].z for t in tracks]
        low = min(zs)
        for a, b in zip(tracks, tracks[1:]):
            if a[foot].z < low + band and b[foot].z < low + band:
                speeds.append((b[foot].xy - a[foot].xy).length * fps)
    if len(speeds) < 3:
        return None, None
    speeds.sort()
    med = statistics.median(speeds)
    p90 = speeds[int(0.9 * (len(speeds) - 1))]
    return round(med, 2), round(p90 / max(med, 1e-6), 2)


def reach(rest, basis, hand, target_bone, at=0.4, offset=(0, 0, 0), grip=0.06):
    """Two-bone arm IK: the hand's wrist goes next to a point `at` metres along
    `target_bone` (a second hand on a spear shaft); the hand keeps its world turn."""
    side = hand[-2:]
    upper, lower = "upperarm" + side, "lowerarm" + side
    if target_bone not in rest.rot or upper not in rest.rot:
        return basis
    world = rest.fk(basis)
    point = world[target_bone] @ Vector((0, at, 0)) + Vector(offset)
    shoulder = world[upper].translation
    wrist = point + (shoulder - point).normalized() * grip
    return leg_ik(rest, basis, upper, lower, hand, wrist)


def apply_reach(rest, basis, reaches, weight=1.0):
    if not reaches or weight <= 0:
        return basis
    solved = dict(basis)
    for hand, r in reaches.items():
        reach(rest, solved, hand, r["bone"], float(r.get("at", 0.4)), r.get("offset", (0, 0, 0)), float(r.get("grip", 0.06)))
    if weight >= 1:
        return solved
    out = dict(basis)
    for hand in reaches:
        side = hand[-2:]
        for b in ("upperarm" + side, "lowerarm" + side, hand):
            qa, ta = basis[b]
            qb, tb = solved[b]
            if qa.dot(qb) < 0:
                qb = -qb
            out[b] = (qa.slerp(qb, weight), ta.lerp(tb, weight))
    return out


def oscillate(rest, frames, items, loop=True):
    """Additive sine turns: [{"bone", "axis": [x,y,z] (world, rest frame carried
    by the parent), "deg", "cycles" per clip, "phase" (0..1)}], e.g. a waddle's
    pelvis roll with the spine rolling back so the head stays level."""
    if not items:
        return frames
    n = len(frames) - 1 if loop and len(frames) > 1 else len(frames)
    out = []
    for i, basis in enumerate(frames):
        basis = dict(basis)
        for item in items:
            bone = item["bone"]
            if bone not in rest.rot:
                continue
            angle = math.radians(item.get("deg", 5)) * math.sin(2 * math.pi * (item.get("cycles", 1) * i / max(n, 1) + item.get("phase", 0)))
            q, t = basis.get(bone, (Quaternion(), Vector()))
            basis[bone] = (rest.world_q(bone, Quaternion(Vector(item.get("axis", (0, 1, 0))), angle)) @ q, t)
        out.append(basis)
    return out


def dominant_mask(mesh, bones):
    """Vertices whose strongest weight is one of `bones` (None if no bones)."""
    if not bones:
        return None
    import numpy as np
    index = {g.index: g.name for g in mesh.vertex_groups}
    mask = np.zeros(len(mesh.data.vertices), dtype=bool)
    for v in mesh.data.vertices:
        if v.groups:
            best = max(v.groups, key=lambda g: g.weight)
            mask[v.index] = index.get(best.group) in bones
    return mask
