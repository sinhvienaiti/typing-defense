"""Scripted clips for Lời Gọi's non-humanoid rigs (td_rig_clips.make_clips).

Registered in SCRIPTS as fn(rest, clip, spec) -> frames (basis dicts); a clip
that animates bone scale (squash and stretch) leaves clip["_scale"] = [{bone:
Vector}] per frame, and clip["_events"] = {name: frame} for timed events.
Loops are periodic by construction (frame n == frame 0, closeLoop 0); one-shots
start and end on the idle clip's first pose (blendIn / blendOut 0).

Blob (nuppeppo): root, belly -> body -> head stacked up the mass (scale keys
cascade: a squash of the belly squashes everything above it, the body and head
add their own lagging scale and lean = overlap), arm nubs on the body, feet on
the root (they stay planted while the mass squashes). Bone local axes: X = the
character's left, Y = up (bone direction), Z = front, so scale = (width,
height, depth); volume is kept (width = depth = 1 / sqrt(height)) unless a key
says otherwise.
"""

import math

from mathutils import Quaternion, Vector

import td_rig_tools as T

SCRIPTS = {}


def script(fn):
    SCRIPTS[fn.__name__] = fn
    return fn


def Q(axis, degrees):
    axis = {"x": (1, 0, 0), "y": (0, 1, 0), "z": (0, 0, 1)}.get(axis, axis)
    return Quaternion(Vector(axis), math.radians(degrees))


def smooth(t):
    t = min(max(t, 0.0), 1.0)
    return t * t * (3 - 2 * t)


class Track:
    """Keyed values (frame, value) with smooth steps between keys; `period`
    makes it wrap (a loop), otherwise it holds the end values."""

    def __init__(self, keys, period=None):
        self.keys = sorted(keys)
        self.period = period

    def __call__(self, f):
        keys = self.keys
        if self.period:
            f = f % self.period
            keys = keys + [(keys[0][0] + self.period, keys[0][1])]
        if f <= keys[0][0]:
            return keys[0][1]
        for (f0, v0), (f1, v1) in zip(keys, keys[1:]):
            if f0 <= f <= f1:
                return v0 + (v1 - v0) * smooth((f - f0) / max(f1 - f0, 1e-6))
        return keys[-1][1]


def tracks(table, period=None):
    """{name: [[frame, value], ...]} -> {name: Track}."""
    return {k: Track([tuple(kv) for kv in v], period) for k, v in table.items()}


# ----------------------------------------------------------------------------
# Blob
# ----------------------------------------------------------------------------
BLOB = {"floor": "base", "base": "belly", "mid": "body", "top": "head", "arms": ("arm_l", "arm_r"), "feet": ("foot_l", "foot_r")}


def blob_bones(spec):
    return dict(BLOB, **spec.get("blob", {}))


def volume(h, wx=1.0, d=1.0):
    """Belly-style scale (width, height, depth) that keeps the volume: height h,
    width and depth 1 / sqrt(h), then widened by wx and deepened by d against
    each other (wx 1.3 = wider and shallower, d 0.8 = flattened at the front)."""
    w = 1.0 / math.sqrt(max(h, 1e-3))
    return Vector((w * wx / d, h, w * d / wx))


def blob_pose(rest, B, p):
    """p: lift, fwd (m, + = forward), lean (+ = top forward), roll (+ = top to the
    character's left), yaw, h / wx / d (belly scale), body / head {lean, roll, h,
    wx, d} (on top of the parent), arm {flap (+ = up), swing (+ = forward)} for
    both or arm_l / arm_r, foot_l / foot_r {lift, tilt (+ = toes down), flat}."""
    basis = T.identity_pose(rest)
    scales = {}
    base = B["base"]
    turn = Q("z", p.get("yaw", 0.0)) @ Q("y", p.get("roll", 0.0)) @ Q("x", p.get("lean", 0.0))
    offset = Vector((0.0, -p.get("fwd", 0.0), p.get("lift", 0.0)))
    basis[base] = (rest.world_q(base, turn), rest.rot[base].inverted() @ offset)
    size = p.get("s", 1.0)  # uniform shrink (the split remains collapse into the core)
    scales[base] = volume(p.get("h", 1.0), p.get("wx", 1.0), p.get("d", 1.0)) * size
    floor = B.get("floor")
    if floor in rest.rot:
        # The bottom over the feet follows the mass but spreads only a third as
        # much (the feet stay attached when the belly squashes wide).
        soft = Vector((1 + 0.33 * (scales[base].x / size - 1), 1.0, 1 + 0.33 * (scales[base].z / size - 1))) * size
        half = Quaternion().slerp(turn, 0.5)
        basis[floor] = (rest.world_q(floor, half), rest.rot[floor].inverted() @ offset)
        scales[floor] = soft
    for role in ("mid", "top"):
        bone = B[role]
        q = p.get("body" if role == "mid" else "head", {})
        basis[bone] = (rest.world_q(bone, Q("y", q.get("roll", 0.0)) @ Q("x", q.get("lean", 0.0))), Vector())
        scales[bone] = volume(q.get("h", 1.0), q.get("wx", 1.0), q.get("d", 1.0))
    for arm, side in zip(B["arms"], (1, -1)):
        a = dict(p.get("arm", {}), **p.get(arm, {}))
        # Left arm points +X: up = turn about -Y, forward = turn about -Z (mirrored on the right).
        q = Q("z", -side * a.get("swing", 0.0)) @ Q((0, -side, 0), a.get("flap", 0.0))
        basis[arm] = (rest.world_q(arm, q), Vector())
    for foot in B["feet"]:
        f = p.get(foot, {})
        lift = f.get("lift", 0.0)
        out = f.get("out", 0.0) * (1 if rest.matrix[foot].translation.x > 0 else -1)
        basis[foot] = (rest.world_q(foot, Q("x", -f.get("tilt", 0.0))), rest.rot[foot].inverted() @ Vector((out, -f.get("fwd", 0.0), lift)))
        if f.get("flat", 1.0) != 1.0 or size != 1.0:
            flat = f.get("flat", 1.0)
            scales[foot] = Vector((1.0 / math.sqrt(flat), flat, 1.0 / math.sqrt(flat))) * size
    return basis, scales


def lagged(track, f, delay, period=None):
    g = f - delay
    if period is None:
        g = max(g, 0.0)
    return track(g)


def blob_frames(rest, clip, spec, n, base, extra=None, period=None):
    """Build frames from belly tracks (`base`: name -> Track over frames) with the
    jelly overlap: the body follows the belly's height and lean `lag[0]` frames
    later and the head `lag[1]` frames later (scale and lean ratios on top of the
    parent), so the top of the blob trails the bottom. extra(f) -> dict merged
    into the pose (arms, feet, explicit body / head)."""
    B = blob_bones(spec)
    lag = clip.get("lag", [1.2, 2.6])
    k = clip.get("lagGain", [0.8, 0.9])
    frames, scales = [], []
    for i in range(n + (1 if period else 0)):
        f = float(i)
        p = {name: tr(f) for name, tr in base.items()}
        h0 = p.get("h", 1.0)
        h1 = lagged(base["h"], f, lag[0], period) if "h" in base else 1.0
        h2 = lagged(base["h"], f, lag[1], period) if "h" in base else 1.0
        l0 = p.get("lean", 0.0)
        l1 = lagged(base["lean"], f, lag[0], period) if "lean" in base else 0.0
        l2 = lagged(base["lean"], f, lag[1], period) if "lean" in base else 0.0
        r0 = p.get("roll", 0.0)
        r1 = lagged(base["roll"], f, lag[0], period) if "roll" in base else 0.0
        r2 = lagged(base["roll"], f, lag[1], period) if "roll" in base else 0.0
        p["body"] = {"h": (h1 / h0) ** k[0], "lean": k[0] * (l1 - l0), "roll": k[0] * (r1 - r0)}
        if clip.get("faceLevel"):
            # The face sits on the body bone: it turns back part of a forward lean.
            p["body"]["lean"] -= float(clip["faceLevel"]) * max(0.0, l0 + p["body"]["lean"])
        p["head"] = {"h": (h2 / h1) ** k[1], "lean": k[1] * (l2 - l1), "roll": k[1] * (r2 - r1)}
        if extra:
            for key, value in extra(f).items():
                if isinstance(value, dict) and isinstance(p.get(key), dict):
                    p[key] = dict(p[key], **value)
                else:
                    p[key] = value
        basis, sc = blob_pose(rest, B, p)
        frames.append(basis)
        scales.append(sc)
    if period:
        frames[-1], scales[-1] = frames[0], scales[0]
    else:
        ref = idle_reference(rest, spec)
        if ref is not None:
            frames, scales = finish_oneshot(frames, scales, ref, int(clip.get("blendIn", 2)), int(clip.get("blendOut", 3)))
    clip["_scale"] = scales
    return frames


IDLE_NAMES = ("Enemy_Idle", "Hero_Idle", "Unit_Idle", "Helper_Idle", "Boss_Idle")


def idle_reference(rest, spec):
    """(basis, scales) of the idle clip's first frame: one-shots start and end
    on it (design 23.9). Built once from the idle clip's own script."""
    if "_idleRef" not in spec:
        spec["_idleRef"] = None
        clip = next((c for c in spec.get("clips", []) if c.get("name") in IDLE_NAMES and c.get("script") in SCRIPTS), None)
        if clip is not None:
            probe = dict(clip)
            frames = SCRIPTS[clip["script"]](rest, probe, spec)
            spec["_idleRef"] = (frames[0], (probe.get("_scale") or [{}])[0])
    return spec["_idleRef"]


def finish_oneshot(frames, scales, ref, blend_in, blend_out):
    """Blend the first / last frames from / to the idle reference (basis and scale)."""
    pose0, scale0 = ref
    n = len(frames)
    out_f, out_s = [], []
    for i, (basis, sc) in enumerate(zip(frames, scales)):
        w = 1.0
        if blend_in and i < blend_in:
            w = min(w, smooth(i / blend_in))
        if blend_out and i > n - 1 - blend_out:
            w = min(w, smooth((n - 1 - i) / blend_out))
        if w >= 1.0:
            out_f.append(basis)
            out_s.append(sc)
            continue
        out_f.append(T.slerp_pose(pose0, basis, w))
        merged = {}
        for bone in set(sc) | set(scale0):
            a = Vector(scale0.get(bone, (1, 1, 1)))
            b = Vector(sc.get(bone, (1, 1, 1)))
            merged[bone] = a.lerp(b, w)
        out_s.append(merged)
    return out_f, out_s


@script
def blob_idle(rest, clip, spec):
    """Breathing wobble: the mass rises and settles, sways side to side, the
    top trails the bottom; arm nubs bob."""
    n = int(clip.get("frames", 48))
    amp = float(clip.get("breath", 0.03))
    base = {
        "h": lambda f: 1.0 + amp * math.sin(2 * math.pi * f / n),
        "roll": lambda f: 2.2 * math.sin(2 * math.pi * f / n + 0.4),
        "lean": lambda f: -1.0 + 1.2 * math.sin(4 * math.pi * f / n),
    }

    def extra(f):
        t = 2 * math.pi * f / n
        return {"arm": {"flap": 5.0 * math.sin(t - 1.2), "swing": 3.0 * math.sin(2 * t)}}

    return blob_frames(rest, clip, spec, n, base, extra, period=n)


@script
def blob_hop(rest, clip, spec):
    """Hop-walk, one hop per loop: land and squash (frames 0-2), push off with
    anticipation (2-3), stretch at take-off, round at the apex, reach down,
    land. Feet stay planted on the ground frames and rise with the mass in
    the air (no slide: the game moves the body inside airborne_s only)."""
    n = int(clip.get("frames", 14))
    height = float(clip.get("height", 0.3))
    take_off = float(clip.get("takeOff", 3.4))  # frame the feet leave the ground
    hk = clip.get("squash", [[0, 0.8], [1, 0.72], [2, 0.84], [3, 1.04], [4, 1.14], [6, 1.06], [8, 0.98], [10, 1.0], [12, 1.07], [13, 0.95]])
    lk = clip.get("leanKeys", [[0, -3.0], [2, 4.0], [4, 8.0], [8, 1.0], [12, -2.0], [13, -4.0]])

    def lift(f):
        f = f % n
        if f < take_off:
            return 0.0
        x = (f - take_off) / (n - take_off)
        return height * 4 * x * (1 - x)

    h = Track([tuple(k) for k in hk], n)
    lean = Track([tuple(k) for k in lk], n)
    base = {"h": h, "lean": lean, "lift": lift}

    def extra(f):
        air = lift(f) / max(height, 1e-6)
        flap = Track([(0, -18.0), (2, -6.0), (4, 28.0), (8, 12.0), (12, -4.0)], n)(f - 1.0)
        tuck = 12.0 * air
        feet = {foot: {"lift": lift(f), "tilt": tuck} for foot in blob_bones(spec)["feet"]}
        return dict({"arm": {"flap": flap, "swing": -4.0 * air}}, **feet)

    frames = blob_frames(rest, clip, spec, n, base, extra, period=n)
    clip["_events"] = {"land": 0, "takeOff": take_off}
    return frames


@script
def blob_bump(rest, clip, spec):
    """Attack: rear back and squash, launch, slam the belly into the target
    (flattened at the front), bounce off and wobble back to idle."""
    n = int(clip.get("frames", 22))
    hit = int(clip.get("impact", 10))
    base = tracks({
        "lean": [[0, 0], [5, -13], [8, 10], [hit, 24], [hit + 3, 8], [hit + 6, -4], [hit + 9, 1.5], [n - 1, 0]],
        "h": [[0, 1.0], [5, 0.84], [8, 1.12], [hit, 1.04], [hit + 3, 0.94], [hit + 6, 1.04], [hit + 9, 0.99], [n - 1, 1.0]],
        "d": [[0, 1.0], [8, 1.0], [hit, 0.84], [hit + 3, 1.05], [hit + 6, 1.0], [n - 1, 1.0]],
        "fwd": [[0, 0], [5, -0.04], [hit, 0.1], [hit + 4, 0.02], [n - 1, 0]],
    })
    arms = tracks({
        "flap": [[0, 0], [5, 20], [8, 8], [hit, 26], [hit + 4, -6], [hit + 8, 3], [n - 1, 0]],
        "swing": [[0, 0], [5, -22], [8, 8], [hit, 22], [hit + 4, 4], [n - 1, 0]],
    })

    def extra(f):
        return {"arm": {k: tr(f - 1.0) for k, tr in arms.items()}}

    frames = blob_frames(rest, clip, spec, n, base, extra)
    clip["_events"] = {"impact": hit}
    return frames


@script
def blob_hit(rest, clip, spec):
    """Hit: knocked back and squashed, then a damped jiggle back to idle."""
    n = int(clip.get("frames", 12))
    base = tracks({
        "lean": [[0, 0], [2, -11], [4, 6], [6, -3.5], [8, 1.5], [n - 1, 0]],
        "h": [[0, 1.0], [2, 0.83], [4, 1.09], [6, 0.96], [8, 1.02], [n - 1, 1.0]],
        "fwd": [[0, 0], [2, -0.06], [5, -0.02], [n - 1, 0]],
    })
    arms = tracks({"flap": [[0, 0], [2, 32], [4, -10], [6, 8], [8, -2], [n - 1, 0]], "swing": [[0, 0], [2, -12], [5, 4], [n - 1, 0]]})
    return blob_frames(rest, clip, spec, n, base, lambda f: {"arm": {k: tr(f - 0.8) for k, tr in arms.items()}})


@script
def blob_melt(rest, clip, spec):
    """Death without a split (killed by a blast): a shudder, then the dough
    slumps and spreads into a flat puddle over its feet."""
    n = int(clip.get("frames", 36))
    base = tracks({
        "h": [[0, 1.0], [3, 0.84], [6, 1.12], [9, 0.82], [12, 0.92], [16, 0.66], [22, 0.5], [28, 0.42], [n - 1, 0.38]],
        "lean": [[0, 0], [3, -6], [6, 5], [9, -3], [16, 4], [n - 1, 6]],
        "roll": [[0, 0], [6, 3], [9, -3], [12, 2], [16, 0], [n - 1, 0]],
        "lift": [[0, 0], [16, 0], [n - 1, -0.06]],
    })
    arms = tracks({"flap": [[0, 0], [3, 26], [6, -10], [9, 18], [16, -30], [n - 1, -42]], "swing": [[0, 0], [16, 8], [n - 1, 14]]})

    def extra(f):
        u = smooth((f - 12) / (n - 13))
        feet = {foot: {"flat": 1.0 - 0.35 * u, "out": 0.08 * u} for foot in blob_bones(spec)["feet"]}
        return dict({"arm": {k: tr(f - 1.0) for k, tr in arms.items()}}, **feet)

    return blob_frames(rest, clip, spec, n, base, extra)


@script
def blob_split(rest, clip, spec):
    """Death that splits in two (design 22.6): shudder, stretch wide sideways
    with a fast shake; at the 'split' event the game hides this mesh and
    spawns two nuppeppo-con at FX_CORE +- 0.45 m along X; after it the mass
    shrinks into the ground (a late hide or a cream-puff VFX still looks right)."""
    n = int(clip.get("frames", 24))
    split = int(clip.get("split", 12))
    base = tracks({
        "h": [[0, 1.0], [3, 0.85], [6, 1.15], [9, 0.86], [split, 0.8], [split + 3, 0.92], [n - 1, 0.92]],
        "wx": [[0, 1.0], [3, 1.06], [6, 0.94], [9, 1.2], [split, 1.34], [split + 3, 1.1], [n - 1, 1.0]],
        "s": [[0, 1.0], [split, 1.0], [split + 2, 0.82], [split + 6, 0.32], [n - 1, 0.22]],
        "roll": [[0, 0], [7, 0], [8, 4], [9, -4], [10, 4], [11, -4], [split, 0], [n - 1, 0]],
        "lean": [[0, 0], [3, -5], [6, 3], [split, 0], [n - 1, 0]],
    })
    arms = tracks({"flap": [[0, 0], [3, 20], [6, -8], [9, 30], [split, 36], [n - 1, 10]], "swing": [[0, 0], [n - 1, 0]]})

    def extra(f):
        return {"arm": {k: tr(f - 0.8) for k, tr in arms.items()}}

    frames = blob_frames(rest, clip, spec, n, base, extra)
    clip["_events"] = {"split": split}
    return frames


# ----------------------------------------------------------------------------
# Serpent: chain fit along the body centreline, path-driven clips
# ----------------------------------------------------------------------------
def resample(points, count):
    """Polyline -> count + 1 points at equal arc length (first and last kept)."""
    import numpy as np
    pts = np.array([tuple(p) for p in points])
    seg = np.linalg.norm(np.diff(pts, axis=0), axis=1)
    s = np.concatenate([[0], np.cumsum(seg)])
    out = []
    for k in range(count + 1):
        target = s[-1] * k / count
        i = min(int(np.searchsorted(s, target, side="right")) - 1, len(seg) - 1)
        u = (target - s[i]) / max(seg[i], 1e-9)
        out.append(Vector(pts[i] + u * (pts[i + 1] - pts[i])))
    return out, float(s[-1])


def smooth_polyline(points, passes=3, keep_ends=True):
    pts = [Vector(p) for p in points]
    for _ in range(passes):
        inner = [(pts[i - 1] + pts[i] * 2 + pts[i + 1]) / 4 for i in range(1, len(pts) - 1)]
        pts = [pts[0]] + inner + [pts[-1]]
    return pts


def densify(points, step=0.05):
    out = [Vector(points[0])]
    for a, b in zip(points, points[1:]):
        a, b = Vector(a), Vector(b)
        n = max(1, int((b - a).length / step))
        out += [a.lerp(b, k / n) for k in range(1, n + 1)]
    return out


def fit_chain(spec, mesh):
    """spec["fitChain"] = {"bones": [neck, tail01, ..., tail_tip] (head joint to
    tail end), "path": [[x, y, z], ...] (the body centreline from the head joint
    to the tail end, measured on mid-plane renders: through the middle of the
    tube between belly and back, under the plates), "recentre": m}: the path is
    densified and smoothed; each point is pulled toward the centroid of the mesh
    cross-section around it (within `recentre` m, across the path only, in the
    mid plane when "lockX" is set) so the spine sits in the tube; then it is cut
    into equal segments and each bone gets its head / tail."""
    import numpy as np
    import td_rig_common as C
    fit = spec["fitChain"]
    co = C.vertex_array(mesh)
    pts = densify([Vector(p) for p in fit["path"]], 0.05)
    pts = smooth_polyline(pts, 4)
    radius = float(fit.get("recentre", 0.0))
    moved = 0.0
    if radius > 0:
        out = [pts[0]]
        for i in range(1, len(pts) - 1):
            d = (pts[i + 1] - pts[i - 1]).normalized()
            p = np.array(tuple(pts[i]))
            dn = np.array(tuple(d))
            rel = co - p
            along = rel @ dn
            lat = np.linalg.norm(rel - np.outer(along, dn), axis=1)
            mask = (np.abs(along) < 0.06) & (lat < radius)
            if mask.sum() >= 8:
                c = co[mask].mean(0)
                c = c - ((c - p) @ dn) * dn
                if fit.get("lockX") is not None:
                    c[0] = fit["lockX"]
                q = pts[i].lerp(Vector(c), float(fit.get("pull", 0.5)))
                moved = max(moved, (q - pts[i]).length)
                out.append(q)
            else:
                out.append(pts[i])
        pts = smooth_polyline(out + [pts[-1]], 3)
    bones = fit["bones"]
    joints, length = resample(pts, len(bones))
    for name, a, b in zip(bones, joints, joints[1:]):
        spec["bones"][name]["head"] = [round(v, 4) for v in a]
        spec["bones"][name]["tail"] = [round(v, 4) for v in b]
    return {"length_m": round(length, 3), "segment_m": round(length / len(bones), 3), "recentreMax_m": round(moved, 3),
            "joints": [[round(v, 3) for v in j] for j in joints]}


def world_from(rest, basis, scales=None):
    return rest.fk(basis, scales)


def put(rest, basis, bone, pos, rot):
    """Basis that puts `bone`'s head at `pos` with world rotation `rot` (parents first)."""
    import td_rig_post as P
    return P.world_bone(rest, basis, bone, pos, rot)


class Serpent:
    """Rest geometry of a head-rooted serpent chain (Mesh2Motion snake: head ->
    neck -> tail01 .. tail20 -> tail_tip) and a pose builder.

    pose(p) drives the centreline: the rising neck (joints above `groundZ`) is
    walked up from its base with cumulative turns (pitch top-heavy, rise
    base-heavy, curl as an S that leaves the head's direction alone, yaw sway,
    all in degrees); the lying body follows a lateral offset (a travelling wave,
    a bend, a tail flick) walked from the neck base with fixed segment lengths,
    so bones never stretch. The head sits on the top joint, follows the neck's
    yaw and only part of its pitch (faces stay toward the 55-degree camera),
    plus its own pitch / yaw / roll; twist rolls segments about their own axis."""

    def __init__(self, rest, spec):
        cfg = dict({"head": "head", "jaw": "mouth", "pouch": "pouch", "groundZ": 0.62, "follow": 0.45}, **spec.get("serpent", {}))
        self.rest = rest
        self.cfg = cfg
        self.head = cfg["head"]
        self.chain = list(spec["fitChain"]["bones"])
        J = [rest.matrix[b].translation.copy() for b in self.chain]
        last = self.chain[-1]
        J.append(rest.matrix[last].translation + rest.rot[last] @ Vector((0, rest.length[last], 0)))
        self.J = J
        self.L = [(J[i + 1] - J[i]).length for i in range(len(self.chain))]
        self.d0 = [(J[i + 1] - J[i]).normalized() for i in range(len(self.chain))]
        self.s = [0.0]
        for length in self.L:
            self.s.append(self.s[-1] + length)
        # Neck base: the first joint (from the head) down at the lying height.
        self.base = next(i for i, j in enumerate(J) if j.z < cfg["groundZ"])
        self.body_len = self.s[-1] - self.s[self.base]

    def pose(self, p):
        rest = self.rest
        nb = self.base
        J = [None] * len(self.J)
        J[nb] = self.J[nb] + Vector(p.get("baseShift", (0, 0, 0)))
        # --- neck: walk up from the base (segments nb-1 .. 0)
        count = max(nb, 1)
        pitch, rise, curl, yaw = (math.radians(p.get(k, 0.0)) for k in ("pitch", "rise", "curl", "yaw"))
        cum_p = cum_y = 0.0
        dirs = [None] * len(self.chain)
        for k, i in enumerate(range(nb - 1, -1, -1)):
            u = (k + 0.5) / count  # 0 at the base, 1 at the top
            wt = u / (count / 2.0 + 0.5) if count > 1 else 1.0  # top-heavy, sums to ~1
            wb = (1 - u) / (count / 2.0 + 0.5) if count > 1 else 1.0  # base-heavy
            ws = (1.0 if u < 0.5 else -1.0) * 2.0 / count  # S: lower half one way, upper half back
            cum_p += pitch * wt + rise * wb + curl * ws
            cum_y += yaw * wb
            up = -self.d0[i]
            q = Quaternion((0, 0, 1), cum_y) @ Quaternion((1, 0, 0), cum_p)
            d = -(q @ up)
            dirs[i] = d
            J[i] = J[i + 1] - d * self.L[i]
        self.neck_turn = (cum_p, cum_y)
        # --- body: lateral offsets, walked from the base with fixed lengths
        amp, lam, phase = p.get("wave", 0.0), p.get("lambda", 2.4), p.get("phase", 0.0)
        bend, flick = p.get("bend", 0.0), p.get("flick", 0.0)
        ramp = p.get("ramp", 1.0)
        lift_wave = p.get("liftWave", 0.0)
        for i in range(nb, len(self.chain)):
            s = self.s[i + 1] - self.s[nb]
            v = s / max(self.body_len, 1e-6)
            a = amp * smooth(s / ramp) * (0.6 + 0.4 * v)
            x = a * math.sin(2 * math.pi * (s / lam - phase)) + bend * v * v + flick * max(0.0, (v - 0.75) / 0.25) ** 2
            z = lift_wave * smooth(s / ramp) * max(0.0, math.sin(2 * math.pi * (s / lam - phase)))
            target = self.J[i + 1] + Vector((x, 0.0, z)) + Vector(p.get("baseShift", (0, 0, 0))) * (1 - v)
            d = (target - J[i]).normalized()
            dirs[i] = d
            J[i + 1] = J[i] + d * self.L[i]
        self.joints = J
        # --- rotations
        twist_top = math.radians(p.get("twist", 0.0))
        basis = T.identity_pose(rest)
        rots = {}
        for i, bone in enumerate(self.chain):
            r = self.d0[i].rotation_difference(dirs[i]) @ rest.rot[bone]
            if twist_top:
                w = max(0.0, 1.0 - self.s[i] / max(self.s[nb] + 1.2, 1e-6))  # full at the head, gone 1.2 m down the body
                r = Quaternion(dirs[i], twist_top * w) @ r
            rots[bone] = r
        cp, cy = self.neck_turn
        follow = float(p.get("follow", self.cfg["follow"]))
        hq = (Quaternion((0, 0, 1), cy + math.radians(p.get("headYaw", 0.0)))
              @ Quaternion((1, 0, 0), follow * cp + math.radians(p.get("headPitch", 0.0)))
              @ Quaternion((0, 1, 0), math.radians(p.get("headRoll", 0.0)) + twist_top))
        put(rest, basis, self.head, J[0], hq @ rest.rot[self.head])
        for i, bone in enumerate(self.chain):
            put(rest, basis, bone, J[i], rots[bone])
        jaw = self.cfg["jaw"]
        if jaw in rest.rot:
            basis[jaw] = (rest.world_q(jaw, Quaternion((1, 0, 0), math.radians(p.get("jaw", 0.0)))), Vector())
        scales = {}
        pouch = self.cfg["pouch"]
        if pouch in rest.rot:
            k = p.get("pouch", 1.0)
            scales[pouch] = Vector((k, 0.5 + 0.5 * k, k))
        return basis, scales


def serpent_frames(rest, clip, spec, n, fn, period=None):
    sp = Serpent(rest, spec)
    frames, scales = [], []
    for i in range(n + (1 if period else 0)):
        basis, sc = sp.pose(fn(float(i)))
        frames.append(basis)
        scales.append(sc)
    if period:
        frames[-1], scales[-1] = frames[0], scales[0]
    else:
        ref = idle_reference(rest, spec)
        if ref is not None:
            frames, scales = finish_oneshot(frames, scales, ref, int(clip.get("blendIn", 2)), int(clip.get("blendOut", 3)))
    clip["_scale"] = scales
    return frames


def values(table, f):
    return {k: tr(f) for k, tr in table.items()}


@script
def serpent_idle(rest, clip, spec):
    """Head held high and steady, the neck sways and breathes (throat pouch),
    a slow ripple runs down the lying body, the tail fin flicks."""
    n = int(clip.get("frames", 60))

    def fn(f):
        t = 2 * math.pi * f / n
        return {"yaw": 5.0 * math.sin(t), "headYaw": -3.5 * math.sin(t - 0.4), "pitch": 2.5 * math.sin(2 * t),
                "headPitch": -1.5 * math.sin(2 * t + 0.6), "wave": 0.07, "lambda": 2.6, "phase": f / n, "ramp": 0.8,
                "flick": 0.12 * math.sin(t + 1.2), "pouch": 1.0 + 0.04 * math.sin(2 * t + 0.3)}

    return serpent_frames(rest, clip, spec, n, fn, period=n)


@script
def serpent_slither(rest, clip, spec):
    """Lateral undulation in place: one wavelength runs from the neck base to
    the tail per loop (wave speed = lambda / loop time = the speed the game
    moves the body at, so each point of the body follows the path without
    slipping); the neck sways against it and the head keeps pointing ahead."""
    n = int(clip.get("frames", 30))
    amp = float(clip.get("amp", 0.3))
    lam = float(clip.get("lambda", 2.4))

    def fn(f):
        t = 2 * math.pi * f / n
        return {"wave": amp, "lambda": lam, "phase": f / n, "ramp": 0.9, "yaw": -4.0 * math.sin(t + 0.8),
                "headYaw": 4.5 * math.sin(t + 0.8), "pitch": 1.5 * math.sin(2 * t), "headPitch": -1.0 * math.sin(2 * t),
                "flick": 0.1 * math.sin(t - 1.0)}

    frames = serpent_frames(rest, clip, spec, n, fn, period=n)
    clip["_events"] = {}
    clip.setdefault("note", "wave speed %.2f m/s at x1 (lambda %.1f m / %.2f s): play at game speed / %.2f" % (lam / (n / T.FPS), lam, n / T.FPS, lam / (n / T.FPS)))
    return frames


@script
def serpent_bite(rest, clip, spec):
    """Attack: draw the head back and up (anticipation), strike forward and
    down with the jaw dropping, bite and shake, pull back to idle."""
    n = int(clip.get("frames", 26))
    hit = int(clip.get("impact", 11))
    table = tracks({
        "pitch": [[0, 0], [7, -16], [hit - 1, 30], [hit, 34], [hit + 5, 26], [hit + 9, 6], [n - 1, 0]],
        "rise": [[0, 0], [7, -8], [hit, 10], [hit + 6, 6], [n - 1, 0]],
        "curl": [[0, 0], [7, 14], [hit, -12], [hit + 6, -6], [n - 1, 0]],
        "headPitch": [[0, 0], [7, 10], [hit - 1, -8], [hit, -10], [hit + 6, -6], [n - 1, 0]],
        "jaw": [[0, 0], [hit - 3, 2], [hit - 1, 16], [hit, 10], [hit + 2, 0], [n - 1, 0]],
        "pouch": [[0, 1.0], [7, 1.08], [hit, 0.96], [n - 1, 1.0]],
        "wave": [[0, 0], [hit, 0.1], [n - 1, 0]],
        "phase": [[0, 0], [n - 1, 0.5]],
    })
    shake = Track([(hit + 1, 0.0), (hit + 2, 7.0), (hit + 4, -7.0), (hit + 6, 4.0), (hit + 8, 0.0)])

    def fn(f):
        p = values(table, f)
        p["headYaw"] = shake(f) if f > hit else 0.0
        return p

    frames = serpent_frames(rest, clip, spec, n, fn)
    clip["_events"] = {"impact": hit}
    return frames


@script
def serpent_hit(rest, clip, spec):
    """Hit: the head snaps back and up and to the side, the body jolts, recover."""
    n = int(clip.get("frames", 12))
    table = tracks({
        "pitch": [[0, 0], [2, -16], [5, 5], [8, -2], [n - 1, 0]],
        "headPitch": [[0, 0], [2, -14], [5, 4], [n - 1, 0]],
        "headYaw": [[0, 0], [2, 12], [5, -4], [n - 1, 0]],
        "yaw": [[0, 0], [2, -6], [5, 3], [n - 1, 0]],
        "wave": [[0, 0], [2, 0.14], [6, 0.05], [n - 1, 0]],
        "phase": [[0, 0.1], [n - 1, 0.4]],
        "jaw": [[0, 0], [2, 8], [5, 0], [n - 1, 0]],
    })
    return serpent_frames(rest, clip, spec, n, lambda f: values(table, f))


@script
def serpent_spit(rest, clip, spec):
    """Skill (water ring, warning 0.6-0.8 s): rise high with the throat pouch
    swelling 1 -> 1.6 and a tremble, then spit forward and down (jaw open,
    pouch empties fast) at the 'spit' event, settle back to idle."""
    n = int(clip.get("frames", 38))
    spit = int(clip.get("spit", 18))
    table = tracks({
        "rise": [[0, 0], [4, -6], [spit - 3, -22], [spit, -14], [spit + 3, 6], [spit + 10, 2], [n - 1, 0]],
        "curl": [[0, 0], [spit - 3, -10], [spit, -6], [spit + 4, 0], [n - 1, 0]],
        "pitch": [[0, 0], [spit - 3, -4], [spit, 20], [spit + 3, 24], [spit + 10, 6], [n - 1, 0]],
        "headPitch": [[0, 0], [spit - 3, 12], [spit, -6], [spit + 4, -4], [n - 1, 0]],
        "pouch": [[0, 1.0], [4, 1.05], [spit - 2, 1.6], [spit, 1.55], [spit + 3, 0.95], [spit + 6, 1.0], [n - 1, 1.0]],
        "jaw": [[0, 0], [spit - 1, 0], [spit, 20], [spit + 4, 14], [spit + 8, 0], [n - 1, 0]],
    })

    def fn(f):
        p = values(table, f)
        if 6 <= f < spit:
            p["headYaw"] = 2.0 * math.sin(f * 2.4)  # tremble while the pouch swells
        return p

    frames = serpent_frames(rest, clip, spec, n, fn)
    clip["_events"] = {"warn": 0, "spit": spit}
    return frames


@script
def serpent_death(rest, clip, spec):
    """Death: rears up in pain, sways, topples onto its side to the left with
    the body rolling, bounces once and lies still (water column and falling
    scales are VFX at FX_CORE / FX_HEAD)."""
    n = int(clip.get("frames", 44))
    table = tracks({
        "rise": [[0, 0], [6, -14], [10, -10], [20, 22], [24, 18], [27, 22], [n - 1, 22]],
        "pitch": [[0, 0], [6, -10], [10, -6], [20, 58], [24, 50], [27, 56], [n - 1, 56]],
        "yaw": [[0, 0], [6, -6], [10, 8], [20, 34], [n - 1, 36]],
        "curl": [[0, 0], [6, 10], [20, -6], [n - 1, -4]],
        "headPitch": [[0, 0], [6, -18], [10, -10], [20, 12], [n - 1, 10]],
        "headRoll": [[0, 0], [10, 0], [20, 40], [n - 1, 44]],
        "twist": [[0, 0], [10, 0], [22, 50], [n - 1, 55]],
        "jaw": [[0, 0], [6, 14], [12, 6], [20, 10], [n - 1, 8]],
        "bend": [[0, 0], [10, 0], [22, 0.5], [n - 1, 0.55]],
        "flick": [[0, 0], [8, -0.2], [14, 0.25], [22, 0.15], [30, 0.2], [n - 1, 0.2]],
        "wave": [[0, 0], [6, 0.15], [14, 0.06], [n - 1, 0]],
        "phase": [[0, 0], [n - 1, 1.0]],
        "pouch": [[0, 1.0], [6, 1.1], [20, 0.95], [n - 1, 0.95]],
    })
    frames = serpent_frames(rest, clip, spec, n, lambda f: values(table, f))
    clip["_events"] = {"land": 20}
    return frames
