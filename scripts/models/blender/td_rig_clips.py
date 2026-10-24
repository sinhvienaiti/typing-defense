"""Clips for td_rig_tools.py: CC0 retargets, scripted game clips, springs.

A clip entry in the rig preset:
  {"name": "Hero_Attack", "src": "base:Melee_Hook+base:Melee_Hook_Rec", "loop": false,
   "blendIn": 3, "blendOut": 6, "inplace": "trend|lock|keep", "speed": 1.0}
  {"name": "Enemy_Move", "script": "jiangshi_hop", "loop": true, ...script parameters}
Every clip gets the preset's "wag" (keyed sway on tail bones) and its springs.
One-shots blend in from and out to the first frame of the preset's idle clip
(design 23.9); loops are cross-faded over their last frames so they close.
"""

import math
import os

import bpy
from mathutils import Quaternion, Vector

from td_rig_common import log
import td_rig_tools as T

IDLE_NAMES = ("Hero_Idle", "Enemy_Idle", "Unit_Idle", "Helper_Idle", "Boss_Idle")


# ----------------------------------------------------------------------------
# Pose authoring helpers (scripted clips)
# ----------------------------------------------------------------------------
def Q(axis, degrees):
    axis = {"x": (1, 0, 0), "y": (0, 1, 0), "z": (0, 0, 1)}.get(axis, axis)
    return Quaternion(Vector(axis), math.radians(degrees))


class Poser:
    """Builds basis dicts from rotations about world axes in each bone's rest
    frame carried by its parent (so a leaning torso carries the arms), aims
    (rest-frame directions) and a pelvis offset; can plant feet on the ground."""

    def __init__(self, rest):
        self.rest = rest

    def pose(self, rot=None, aim=None, pelvis=Vector(), pelvis_rot=None, pivot=None, base=None, add=None, twist=None):
        """rot: replace a bone's turn (world axes, rest frame carried by the parent);
        add: turn on top of the base pose; aim: point a bone along a direction
        given in the frame of its nearest ancestor that is not aimed itself (an
        arm aimed 'forward' stays forward of the chest when the chest leans);
        pelvis: offset in metres; pelvis_rot about `pivot` (a body tipping over)."""
        rest = self.rest
        basis = dict(base) if base else T.identity_pose(rest)
        for bone, q in (rot or {}).items():
            if bone in rest.rot:
                basis[bone] = (rest.world_q(bone, q), Vector())
        for bone, q in (add or {}).items():
            if bone in rest.rot:
                q0, t0 = basis[bone]
                basis[bone] = (rest.world_q(bone, q) @ q0, t0)
        q, t = basis["pelvis"]
        offset = rest.rot["pelvis"] @ t + Vector(pelvis)
        if pelvis_rot is not None:
            head0 = rest.matrix["pelvis"].translation
            if pivot is not None:
                p = Vector(pivot)
                offset = offset + (p + pelvis_rot @ (head0 - p)) - head0
            q = rest.world_q("pelvis", pelvis_rot) @ q
        basis["pelvis"] = (q, rest.rot["pelvis"].inverted() @ offset)
        if aim:
            aim = {b: Vector(d).normalized() for b, d in aim.items() if b in rest.rot}
            world = {}
            for n in rest.names:
                parent = rest.parent[n]
                frame = (world[parent] @ rest.rot[parent].inverted() @ rest.rot[n]) if parent else rest.rot[n]
                if n in aim:
                    anchor = parent
                    while anchor in aim:
                        anchor = rest.parent[anchor]
                    delta = (world[anchor] @ rest.rot[anchor].inverted()) if anchor else Quaternion()
                    desired = delta @ aim[n]
                    turn = (frame @ Vector((0, 1, 0))).rotation_difference(desired)
                    if twist and n in twist:
                        turn = Quaternion(desired, math.radians(twist[n])) @ turn
                    basis[n] = (frame.inverted() @ turn @ frame, basis[n][1])
                world[n] = frame @ basis[n][0]
        return basis

    def contact_points(self, matrices):
        """Ankle, ball and toe tip of both feet: (name, z)."""
        out = []
        for side in ("l", "r"):
            for bone in ("foot_" + side, "ball_" + side):
                if bone in matrices:
                    m = matrices[bone]
                    out.append((bone + ".head", m.translation.z))
                    out.append((bone + ".tail", (m @ Vector((0, self.rest.length[bone], 0, 1))).z if False else
                                (m @ Vector((0, self.rest.length[bone], 0))).z))
        return dict(out)

    def plant(self, basis, lift=0.0):
        """Shift the pelvis so the lowest of ankles, balls and toe tips touches
        its rest height (the ground) + lift."""
        rest = self.rest
        now = self.contact_points(rest.fk(basis))
        then = self.contact_points(rest.matrix)
        if not now:
            return basis
        dz = lift - min(now[k] - then[k] for k in now)
        q, t = basis["pelvis"]
        offset = rest.rot["pelvis"] @ t + Vector((0, 0, dz))
        basis["pelvis"] = (q, rest.rot["pelvis"].inverted() @ offset)
        return basis


def mix(*quats):
    out = Quaternion()
    for q in quats:
        out = q @ out
    return out


def smooth(t):
    t = min(max(t, 0.0), 1.0)
    return t * t * (3 - 2 * t)


def keyframes(frames_total, keys, t):
    """keys: list of (frame, value) with float values or Vectors; smooth between."""
    for (f0, v0), (f1, v1) in zip(keys, keys[1:]):
        if f0 <= t <= f1:
            u = smooth((t - f0) / max(f1 - f0, 1e-6))
            return v0 + (v1 - v0) * u
    return keys[-1][1] if t > keys[-1][0] else keys[0][1]


# ----------------------------------------------------------------------------
# Jiangshi (Cương Thi): stiff two-footed hop, arms forward
# ----------------------------------------------------------------------------
def jiangshi_arms(lift=0.0, droop=35.0, spread=0.0, bob=0.0):
    """Arms straight forward at shoulder height (lift raises them, degrees), wrists drooping."""
    rot = {}
    aim = {}
    for side, s in (("l", 1), ("r", -1)):
        pitch = math.radians(lift + bob)
        forward = Vector((s * math.sin(math.radians(6 + spread)), -math.cos(pitch), math.sin(pitch))).normalized()
        aim["upperarm_" + side] = forward
        aim["lowerarm_" + side] = forward
        rot["hand_" + side] = Q("x", droop)  # fingertips down
        rot["clavicle_" + side] = Q("x", -6)
    return rot, aim


def merge_rot(*dicts):
    out = {}
    for d in dicts:
        for k, q in d.items():
            out[k] = q @ out[k] if k in out else q
    return out


def jiangshi_idle(rest, clip):
    poser = Poser(rest)
    n = int(clip.get("frames", 48))
    frames = []
    for i in range(n + 1):  # last frame = first: the loop closes on a key
        t = i / n * 2 * math.pi
        rot, aim = jiangshi_arms(lift=2 + 3 * math.sin(t), droop=35 + 6 * math.sin(t + 1.0))
        sway = 3.0 * math.sin(t)
        body = {"pelvis": Q("y", sway * 0.4), "spine_02": Q("y", -sway * 0.3), "head": Q("y", -sway * 0.6) @ Q("x", 3 * math.sin(2 * t))}
        basis = poser.pose(rot=merge_rot(rot, body), aim=aim, pelvis=Vector((0, 0, 0.01 * math.sin(2 * t))))
        frames.append(poser.plant(basis, lift=0.0))
    return frames


def jiangshi_hop(rest, clip):
    """One hop per loop with a short ground contact (review 24/10: 6 of 15
    frames on the ground slid at 3.8 m/s). Frames 0..contact-1 are on the
    ground (touch down, squash, push off; "crouch" per frame), the rest fly a
    ballistic arc, legs straight and toes down; frame n = frame 0. The clip
    metadata gives the airborne window: the game moves the body only then."""
    poser = Poser(rest)
    n = int(clip.get("frames", 14))  # 0.58 s per hop
    height = float(clip.get("height", 0.22))
    crouch_keys = clip.get("crouch", [0.35, 1.0, 0.45])
    contact = len(crouch_keys)
    take_off = contact - 0.5
    frames = []
    for i in range(n + 1):
        k = i % n
        if k < contact:
            crouch, air = float(crouch_keys[k]), 0.0
        else:
            x = (k - take_off) / (n - take_off)
            crouch, air = 0.0, 4.0 * x * (1.0 - x)
        knee = 22 * crouch
        rot, aim = jiangshi_arms(lift=4 - 8 * air + 6 * crouch, droop=35 + 15 * air)
        legs = {}
        for side in ("l", "r"):
            legs["thigh_" + side] = Q("x", -knee)
            legs["calf_" + side] = Q("x", knee * 1.9)
            legs["foot_" + side] = Q("x", -knee * 0.9 + 18 * air)
        body = {"spine_01": Q("x", -4 * crouch + 2 * air), "head": Q("x", 4 * crouch - 3 * air)}
        robe = {"robe_f": Q("x", -10 * crouch), "robe_b": Q("x", 6 * crouch), "robe_l": Q("y", 6 * crouch), "robe_r": Q("y", -6 * crouch)}
        basis = poser.pose(rot=merge_rot(rot, legs, body, robe), aim=aim)
        basis = poser.plant(basis, lift=height * air)
        frames.append(basis)
    return frames


def airborne(rest, frames, clear=0.03):
    """Windows [start, end] in seconds (flat list) where both ankles are more
    than `clear` m above their rest height, and the frames with a foot down.
    A hopper's game movement runs only inside these windows (no slide)."""
    feet = [f for f in ("foot_l", "foot_r") if f in rest.rot]
    up = [all(rest.fk(b)[f].translation.z > rest.matrix[f].translation.z + clear for f in feet) for b in frames]
    windows, k = [], 0
    while k < len(up):
        if up[k]:
            s = k
            while k < len(up) and up[k]:
                k += 1
            windows += [round(s / T.FPS, 3), round(k / T.FPS, 3)]
        else:
            k += 1
    return windows, len(up) - sum(up)


def jiangshi_attack(rest, clip):
    """Lean in and claw down twice with both stiff arms, back to the idle pose."""
    poser = Poser(rest)
    n = int(clip.get("frames", 22))
    frames = []
    for i in range(n):
        lean = keyframes(n, [(0, 0.0), (5, -8.0), (8, 22.0), (12, 10.0), (15, 24.0), (19, 4.0), (n - 1, 0.0)], i)
        chop = keyframes(n, [(0, 2.0), (5, 30.0), (8, -25.0), (12, 25.0), (15, -28.0), (19, 0.0), (n - 1, 2.0)], i)
        rot, aim = jiangshi_arms(lift=chop, droop=35 - 0.5 * min(chop, 0))
        body = {"spine_01": Q("x", -lean * 0.5), "spine_02": Q("x", -lean * 0.5), "head": Q("x", lean * 0.3)}
        knee = max(lean, 0) * 0.6
        legs = {}
        for side in ("l", "r"):
            legs["thigh_" + side] = Q("x", -knee)
            legs["calf_" + side] = Q("x", knee * 1.8)
            legs["foot_" + side] = Q("x", -knee * 0.8)
        basis = poser.pose(rot=merge_rot(rot, body, legs), aim=aim)
        frames.append(poser.plant(basis))
    return frames


def jiangshi_hit(rest, clip):
    poser = Poser(rest)
    n = int(clip.get("frames", 12))
    frames = []
    for i in range(n):
        k = keyframes(n, [(0, 0.0), (2, 1.0), (5, 0.7), (n - 1, 0.0)], i)
        rot, aim = jiangshi_arms(lift=2 + 30 * k, droop=35 - 25 * k, spread=12 * k)
        if clip.get("recoil") == "back":
            # Knocked back stiffly, face up toward the 55-degree camera (no
            # neck counter-turn needed); the feet stay (lockFeet).
            body = {"spine_01": Q("x", -6 * k), "spine_02": Q("x", -5 * k), "head": Q("x", -8 * k) @ Q("z", 8 * k)}
            shift = float(clip.get("shift", 0.03))
        else:  # "fold": doubles over a blow to the belly
            body = {"spine_01": Q("x", 10 * k), "spine_02": Q("x", 8 * k), "head": Q("x", 14 * k) @ Q("z", 8 * k)}
            shift = float(clip.get("shift", 0.05))
        basis = poser.pose(rot=merge_rot(rot, body), aim=aim, pelvis=Vector((0, shift * k, 0)))
        frames.append(poser.plant(basis))
    return frames


def jiangshi_death(rest, clip):
    """Stiff as a board: tips backward about the heels, bounces once, lies still."""
    poser = Poser(rest)
    n = int(clip.get("frames", 30))
    frames = []
    heel_y = max(rest.matrix[f].translation.y for f in ("foot_l", "foot_r")) + 0.06
    for i in range(n):
        fall = keyframes(n, [(0, 0.0), (3, -4.0), (16, 88.0), (19, 80.0), (22, 90.0), (n - 1, 90.0)], i)
        rot, aim = jiangshi_arms(lift=2 + 0.15 * fall, droop=35 - 0.2 * fall)
        body = {"head": Q("x", 0.1 * fall)}
        # Negative turn about +X tips the top backward (+Y), about the heels.
        basis = poser.pose(rot=merge_rot(rot, body), aim=aim, pelvis_rot=Q("x", -fall), pivot=(0, heel_y, 0.0))
        frames.append(basis)
    return frames


SCRIPTS = {
    "jiangshi_idle": jiangshi_idle,
    "jiangshi_hop": jiangshi_hop,
    "jiangshi_attack": jiangshi_attack,
    "jiangshi_hit": jiangshi_hit,
    "jiangshi_death": jiangshi_death,
}


# ----------------------------------------------------------------------------
def add_wag(rest, frames, wag, loop):
    if not wag:
        return frames
    n = len(frames)
    period = wag.get("period", 2.0) * T.FPS
    cycles = max(1, round(n / period)) if loop else n / period
    axis = Vector(wag.get("axis", (0, 0, 1)))
    out = []
    for i, basis in enumerate(frames):
        basis = dict(basis)
        phase = 2 * math.pi * cycles * i / n
        for k, bone in enumerate(wag["bones"]):
            if bone not in rest.rot:
                continue
            q = rest.world_q(bone, Quaternion(axis, math.radians(wag.get("deg", 5)) * math.sin(phase - 0.6 * k)))
            old_q, old_t = basis.get(bone, (Quaternion(), Vector()))
            basis[bone] = (q @ old_q, old_t)
        out.append(basis)
    return out


def keyed(rest, clip, idle):
    """Key-pose clip from the preset: {"script": "keys", "keys": [{"t": frame,
    "rot": {bone: [[axis, deg], ...]}, "add": {...}, "aim": {bone: [x, y, z]},
    "pelvis": [x, y, z], "lift": m, "ease": "smooth|in|out|linear"}, ...]}.
    Each key starts from the idle clip's first pose ("base": "rest" for the
    rest pose); rot replaces a bone's turn, add turns on top, aim points a bone
    (directions in the rest frame carried by the parent). Feet are planted
    unless "plant": false; frames between keys are slerped."""
    poser = Poser(rest)

    def turn(rots):
        q = Quaternion()
        for axis, deg in rots:
            q = Q(axis, deg) @ q
        return q

    poses = []
    for key in clip["keys"]:
        base = idle if (key.get("base", "idle") == "idle" and idle is not None) else T.identity_pose(rest)
        add = {bone: turn(rots) for bone, rots in key.get("add", {}).items()}
        # A hip twist keeps the feet where they stand: thighs turn back.
        hip = sum(deg for axis, deg in key.get("add", {}).get("pelvis", []) if axis == "z")
        if hip and clip.get("feetStay", True):
            for thigh in ("thigh_l", "thigh_r"):
                add[thigh] = Q("z", -hip) @ add.get(thigh, Quaternion())
        basis = poser.pose(rot={bone: turn(rots) for bone, rots in key.get("rot", {}).items()}, aim=key.get("aim"),
                           pelvis=Vector(key.get("pelvis", (0, 0, 0))), base=base, add=add, twist=key.get("twist"))
        if key.get("plant", clip.get("plant", True)):
            basis = poser.plant(basis, lift=float(key.get("lift", 0.0)))
        poses.append((int(key["t"]), basis, key.get("ease", "smooth")))
    frames = []
    for f in range(poses[-1][0] + 1):
        for (f0, a, _e0), (f1, b, e1) in zip(poses, poses[1:]):
            if f0 <= f <= f1:
                u = (f - f0) / max(f1 - f0, 1)
                u = {"linear": u, "in": u * u, "out": 1 - (1 - u) * (1 - u)}.get(e1, smooth(u))
                frames.append(T.slerp_pose(a, b, u))
                break
    return frames


def make_clips(spec, rig, root, mesh=None):
    rest = T.Rest(rig)
    sources = {}

    def source(tag):
        if tag not in sources:
            sources[tag] = T.Source(os.path.join(root, "art-src", spec["cc0"][tag]), tag)
        return sources[tag]

    options = dict(spec.get("retarget", {}))
    mapping = {n: n for n in T.HUMAN if n != "root" and n in rest.rot}
    report = {}
    built = {}
    idle_pose = None
    for clip in spec["clips"]:
        loop = bool(clip.get("loop"))
        if "src" in clip:
            frames = []
            for part in clip["src"].split("+"):
                tag, name = part.split(":", 1)
                src = source(tag)
                sampled = src.sample(name, rate=clip.get("speed", 1.0))
                opts = dict(options, inplace=clip.get("inplace", options.get("inplace", "trend")))
                if "scale" in clip:
                    opts["scale"] = clip["scale"]
                frames += retarget_mixed(rest, src.rest, sampled, mapping, opts)
            yaw = 0.0
            if clip.get("face", True):
                frames, yaw = T.face_forward(rest, frames)
            origin = "CC0 " + clip["src"] + (" (turned %+.0f deg to face front)" % -yaw if abs(yaw) > 1 else "")
        elif clip.get("script") == "keys":
            frames = keyed(rest, clip, idle_pose)
            origin = "script keys (%d key poses)" % len(clip["keys"])
        else:
            frames = SCRIPTS[clip["script"]](rest, clip)
            origin = "script " + clip["script"]
        frames = add_wag(rest, frames, spec.get("wag"), loop)
        if loop:
            frames = T.close_loop(frames, int(clip.get("closeLoop", 3)))
        elif idle_pose is not None:
            frames = T.blend_ends(frames, idle_pose, int(clip.get("blendIn", 0)), int(clip.get("blendOut", 0)))
        springs = {k: v for k, v in spec.get("springs", {}).items()}
        frames = T.bake_springs(rest, frames, springs, loop)
        if loop:
            # Loop closes on frame 0: drop the duplicate last frame if it equals the first.
            pass
        lift = T.ground_clamp(rig, mesh, rest, frames) if (mesh is not None and clip.get("ground", True)) else 0.0
        if clip["name"] in IDLE_NAMES and idle_pose is None:
            idle_pose = frames[0]
        T.write_action(rig, clip["name"], frames, loop)
        built[clip["name"]] = frames
        report[clip["name"]] = {"frames": len(frames), "seconds": round((len(frames) - 1) / T.FPS, 3), "loop": loop, "from": origin,
                                "groundLift_m": round(lift, 3)}
        log("clip", clip["name"], len(frames), "frames", origin)
    for src in sources.values():
        src.arm.hide_render = True
    return report


def retarget_mixed(rest, src_rest, sampled, mapping, options):
    """Direction-matched bones (arms) vs delta bones (legs, spine): see T.retarget."""
    direction = set(options.get("direction", []))
    return T.retarget(rest, src_rest, sampled, mapping, dict(options, direction=direction))
