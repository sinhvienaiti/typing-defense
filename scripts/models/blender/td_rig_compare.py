"""Pose stress tests and a side-by-side comparison with another rig of the
same character (Tripo Auto Rig, Mixamo skeleton).

blender --background --factory-startup --python td_rig_compare.py -- \
    --blend <work>/lam.blend --out <folder> [--other <rigged.glb> --other-out <folder>] \
    [--clips A,B] [--frames 12]

1. Stress poses on our rig (td_rig_clips.Poser): arms overhead, elbows 90
   and 120 degrees, crouch, leg lift, spine twist 35, head turn 45.
2. With --other: the GLB is imported read-only, turned to face -Y, scaled to
   the same height with feet on the ground, and every clip (ours and the
   stress poses) is retargeted onto its skeleton in world space (Mesh2Motion
   -> Mixamo names), so both versions do exactly the same motion. Frames are
   rendered from the same cameras and put side by side; the same checks run
   on both (td_rig_review.Checker). The other file is never written.
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
from mathutils import Matrix, Quaternion, Vector  # noqa: E402

import td_rig_common as C  # noqa: E402
import td_rig_review as R  # noqa: E402
import td_rig_tools as T  # noqa: E402
from td_rig_clips import Poser, Q  # noqa: E402
from td_rig_common import log  # noqa: E402

FONT = R.FONT


def stress_poses(rest):
    p = Poser(rest)
    up = {"upperarm_l": (0.15, 0.0, 1.0), "lowerarm_l": (0.1, 0.0, 1.0), "upperarm_r": (-0.15, 0.0, 1.0), "lowerarm_r": (-0.1, 0.0, 1.0)}
    hang = {"upperarm_l": (0.35, 0.0, -1.0), "upperarm_r": (-0.35, 0.0, -1.0)}
    e90 = dict(hang, lowerarm_l=(0.1, -1.0, 0.0), lowerarm_r=(-0.1, -1.0, 0.0))
    e120 = dict(hang, lowerarm_l=(0.1, -0.5, 0.87), lowerarm_r=(-0.1, -0.5, 0.87))
    crouch = {}
    for s in "lr":
        crouch["thigh_" + s] = Q("x", -80)
        crouch["calf_" + s] = Q("x", 130)
        crouch["foot_" + s] = Q("x", -50)
    lift = {"thigh_l": Q("x", -90), "calf_l": Q("x", 90)}
    twist = {"spine_01": Q("z", 12), "spine_02": Q("z", 12), "spine_03": Q("z", 11)}
    head = {"head": Q("z", 45)}
    poses = {
        "Stress_ArmsOverhead": p.pose(aim=up),
        "Stress_Elbow90": p.pose(aim=e90),
        "Stress_Elbow120": p.pose(aim=e120),
        "Stress_Crouch": p.plant(p.pose(rot=dict(crouch, spine_01=Q("x", -25)))),
        "Stress_LegLift": p.pose(rot=lift),
        "Stress_SpineTwist35": p.pose(rot=twist),
        "Stress_HeadTurn45": p.pose(rot=head),
    }
    return poses


def add_stress(rig):
    rest = T.Rest(rig)
    names = []
    for name, pose in stress_poses(rest).items():
        # 0 -> pose over 8 frames, hold 4: the checks see the full pose.
        frames = [T.slerp_pose(T.identity_pose(rest), pose, T.ease(i / 8)) for i in range(9)] + [pose] * 4
        T.write_action(rig, name, frames)
        names.append(name)
    return names


def world_frames(rig, clip):
    start, end = R.clip_frames(rig, clip)
    out = []
    for f in range(start, end + 1):
        bpy.context.scene.frame_set(f)
        out.append({pb.name: rig.matrix_world @ pb.matrix for pb in rig.pose.bones})
    return out


def import_other(path, height, yaw_mesh, rig):
    """Import a rigged GLB (read only). Its mesh is placed like ours (turned by
    the preset's yaw, scaled to `height`, feet centre at the origin). Its
    skeleton is turned to face -Y and seated on the mesh by the least-squares
    translation that best matches our joints (hips, legs, arms, head): the
    Tripo file's bind skeleton sits 90 degrees off and off-centre from its
    own mesh, so without this no clip could be judged. Rotation, scale and
    translation only; bones, weights and mesh are not edited."""
    before = set(bpy.data.objects)
    bpy.ops.import_scene.gltf(filepath=path)
    new = [o for o in bpy.data.objects if o not in before]
    arm = next(o for o in new if o.type == "ARMATURE")
    meshes = [o for o in new if o.type == "MESH" and o.find_armature() == arm]
    for o in new:
        if o not in meshes and o is not arm:
            bpy.data.objects.remove(o, do_unlink=True)
    mesh = meshes[0]
    bpy.context.view_layer.update()
    keep = mesh.matrix_world.copy()
    mesh.parent = None
    mesh.matrix_world = keep
    C.select_only([mesh])
    bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
    # The rigged file's mesh is not turned like the unrigged one: try the four
    # quarter turns and keep the one whose placed bounds match our mesh.
    ours = C.vertex_array(next(o for o in bpy.context.scene.objects if o.type == "MESH" and o.parent == rig))
    target = np.r_[ours.min(0), ours.max(0)]
    raw = C.vertex_array(mesh)
    best = None
    for quarter in (0, 90, 180, 270):
        a = math.radians(quarter)
        co = raw @ np.array([[math.cos(a), math.sin(a), 0], [-math.sin(a), math.cos(a), 0], [0, 0, 1]])
        co = (co - [0, 0, co[:, 2].min()]) * (height / np.ptp(co[:, 2]))
        low = co[co[:, 2] < 0.03 * height]
        co -= [(low[:, 0].min() + low[:, 0].max()) / 2, (low[:, 1].min() + low[:, 1].max()) / 2, 0]
        err = float(np.abs(np.r_[co.min(0), co.max(0)] - target).sum())
        if best is None or err < best[1]:
            best = (quarter, err)
    report = {"meshYaw_deg": best[0], "meshBoundsError_m": round(best[1], 3)}
    scale = C.place(mesh, best[0], height)
    # Skeleton in world space as imported.
    bones = {b.name.split(":")[-1]: b for b in arm.data.bones}
    wm = arm.matrix_world.copy()
    left = (wm @ bones["LeftUpLeg"].head_local) - (wm @ bones["RightUpLeg"].head_local)
    yaw = -math.atan2(left.y, left.x)
    report["skeletonFacing"] = "left leg toward %.0f deg" % math.degrees(math.atan2(left.y, left.x))
    turn = Matrix.Rotation(yaw, 4, "Z") @ Matrix.Scale(scale, 4)
    pairs = {"Hips": "pelvis", "LeftUpLeg": "thigh_l", "RightUpLeg": "thigh_r", "LeftLeg": "calf_l", "RightLeg": "calf_r",
             "LeftFoot": "foot_l", "RightFoot": "foot_r", "Head": "head", "LeftArm": "upperarm_l", "RightArm": "upperarm_r",
             "LeftForeArm": "lowerarm_l", "RightForeArm": "lowerarm_r"}
    diffs = [(rig.matrix_world @ rig.data.bones[o].head_local) - (turn @ wm @ bones[t].head_local) for t, o in pairs.items() if t in bones]
    offset = sum(diffs, Vector()) / len(diffs)
    residual = max((d - offset).length for d in diffs)
    raw_hips = turn @ wm @ bones["Hips"].head_local
    report["seatOffset_m"] = [round(v, 3) for v in offset]
    report["seatResidualMax_m"] = round(residual, 3)
    report["hipsBeforeSeat_m"] = [round(v, 3) for v in raw_hips]
    arm.matrix_world = Matrix.Translation(offset) @ turn @ wm
    bpy.context.view_layer.update()
    C.select_only([arm])
    bpy.ops.object.transform_apply(location=True, rotation=True, scale=True, properties=False)
    for pb in arm.pose.bones:
        pb.rotation_mode = "QUATERNION"
    log("other rig", os.path.basename(path), json.dumps(report))
    return arm, mesh, report


def other_report(arm, mesh):
    names = [b.name for b in arm.data.bones]
    groups = {g.index: g.name for g in mesh.vertex_groups}
    infl = np.zeros(len(mesh.data.vertices), int)
    dom = []
    for v in mesh.data.vertices:
        ws = [(g.weight, groups.get(g.group)) for g in v.groups if g.weight > 0]
        infl[v.index] = len(ws)
        dom.append(max(ws)[1] if ws else None)
    from collections import Counter
    return {
        "bones": len(names), "fingerBones": sum(1 for n in names if any(k in n for k in ("Thumb", "Index", "Middle", "Ring", "Pinky"))),
        "vertices": len(mesh.data.vertices), "triangles": C.triangles(mesh),
        "influencesPerVertex": dict(Counter(infl.tolist())),
        "dominantBone": dict(Counter(dom).most_common(10)),
    }


def render_pair(cams, ours, other, folder, frame_index, rig, other_arm, clip_ours, clip_other, f_rel):
    for which, objs, clip, arm in (("ours", ours, clip_ours, rig), ("tripo", other, clip_other, other_arm)):
        for o in ours + other:
            o.hide_render = o not in objs
        start, _end = R.clip_frames(arm, clip)
        bpy.context.scene.frame_set(start + f_rel)
        for view, cam in cams.items():
            C.render_to(os.path.join(folder, f"{which}_{view}_{frame_index:02d}.png"), cam)


def main():
    argv = sys.argv[sys.argv.index("--") + 1:]
    ap = argparse.ArgumentParser()
    ap.add_argument("--blend", required=True)
    ap.add_argument("--out", required=True)
    ap.add_argument("--other", default="")
    ap.add_argument("--other-out", default="")
    ap.add_argument("--clips", default="")
    ap.add_argument("--frames", type=int, default=12)
    ap.add_argument("--resolution", type=int, default=320)
    ap.add_argument("--yaw", type=float, default=-90.0, help="the preset's yaw for the other file's mesh")
    args = ap.parse_args(argv)
    bpy.ops.wm.open_mainfile(filepath=args.blend)
    rig, mesh = R.scene_parts()
    names = [b.name for b in rig.data.bones if b.use_deform]
    height = float(C.vertex_array(mesh)[:, 2].max())
    stress = add_stress(rig)
    clips = args.clips.split(",") if args.clips else [t.name for t in rig.animation_data.nla_tracks]
    C.render_setup(args.resolution)
    C.ground_plane(size=20)
    cams = R.setup_cameras(height, args.resolution)
    ours_checker = R.Checker(rig, mesh, names)
    report = {"ours": {}, "other": {}}
    other_arm = other_mesh = None
    if args.other:
        other_arm, other_mesh, seat = import_other(args.other, height, args.yaw, rig)
        report["otherFile"] = args.other
        report["otherSeat"] = seat
        report["otherRig"] = other_report(other_arm, other_mesh)
        prefix = other_arm.data.bones[0].name.split(":")[0] + ":" if ":" in other_arm.data.bones[0].name else ""
        rest_o = T.Rest(other_arm)
        rest_s = {b.name: (rig.matrix_world @ b.matrix_local) for b in rig.data.bones}
        mapping = {prefix + v: k for k, v in T.MIXAMO.items() if prefix + v in rest_o.rot}
        direction = {prefix + T.MIXAMO[b] for b in ("clavicle_l", "clavicle_r", "upperarm_l", "upperarm_r", "lowerarm_l", "lowerarm_r", "hand_l", "hand_r")}
        onames = [b.name for b in other_arm.data.bones if b.use_deform]
        other_checker = R.Checker(other_arm, other_mesh, onames)
        other_checker.head_rows = np.zeros(len(other_mesh.data.vertices), bool)
        groups = {g.index: g.name for g in other_mesh.vertex_groups}
        head_name = prefix + "Head"
        other_checker.head_rows = np.array([any(groups.get(g.group) == head_name and g.weight > 0.999 for g in v.groups) for v in other_mesh.data.vertices])
        for clip in clips:
            frames = world_frames(rig, clip)
            basis = T.retarget(rest_o, rest_s, frames, mapping, {"direction": direction, "inplace": "keep", "pelvis": prefix + "Hips"})
            T.write_action(other_arm, clip, basis)
    for clip in clips:
        is_stress = clip.startswith("Stress_")
        folder = os.path.join(args.other_out if (args.other and not is_stress and args.other_out) else args.out, clip)
        if args.other and args.other_out:
            folder = os.path.join(args.other_out, clip)
        os.makedirs(folder, exist_ok=True)
        start, end = R.clip_frames(rig, clip)
        n = 6 if is_stress else args.frames
        picks = [int(round((end - start) * i / max(n - 1, 1))) for i in range(n)] if not is_stress else [end - start] * 1
        stats = {"ours": [], "other": []}
        for f in range(end - start + 1):
            bpy.context.scene.frame_set(start + f)
            stats["ours"].append(ours_checker.frame()[0])
            if other_arm is not None:
                R.clip_frames(other_arm, clip)
                bpy.context.scene.frame_set(start + f)
                stats["other"].append(other_checker.frame()[0])
        for key in ("ours", "other"):
            if stats[key]:
                report[key][clip] = {
                    "edgesOver1.6Max": max(s["edgesOver1.6"] for s in stats[key]),
                    "trianglesCollapsedMax": max(s["trianglesCollapsed"] for s in stats[key]),
                    "edgeStretchP99Max": round(max(s["edgeStretchP99"] for s in stats[key]), 3),
                    "headDistortionMax": round(max(s.get("headDistortion", 0) for s in stats[key]), 4),
                    "minZ": round(min(s["minZ"] for s in stats[key]), 3),
                }
        views = {"front": cams["front"], "side": cams["side"]} if not is_stress else {"front": cams["front"], "side": cams["side"], "game": cams["game"]}
        ours_objs = [mesh]
        other_objs = [other_mesh] if other_mesh is not None else []
        for i, f in enumerate(picks):
            for which, objs, arm in (("ours", ours_objs, rig), ("tripo", other_objs, other_arm)):
                if arm is None:
                    continue
                for o in ours_objs + other_objs:
                    o.hide_render = o not in objs
                s0, _e = R.clip_frames(arm, clip)
                bpy.context.scene.frame_set(s0 + f)
                for view, cam in views.items():
                    C.render_to(os.path.join(folder, f"{which}_{view}_{i:02d}.png"), cam)
        rows = []
        for view in views:
            for which in (("ours", "tripo") if other_arm is not None else ("ours",)):
                files = [os.path.join(folder, f"{which}_{view}_{i:02d}.png") for i in range(len(picks))]
                row = os.path.join(folder, f"_row_{which}_{view}.png")
                tag = "AI rig (Mesh2Motion + bone heat)" if which == "ours" else "Tripo Auto Rig (Mixamo)"
                subprocess.run(["magick"] + files + ["+append", "-gravity", "NorthWest", "-font", FONT, "-pointsize", "18",
                                "-fill", "#202020", "-annotate", "+6+4", f"{tag} - {view}", row], check=True)
                rows.append(row)
        label = clip
        for key in ("ours", "other"):
            if clip in report[key]:
                r = report[key][clip]
                label += f"  |  {'AI' if key == 'ours' else 'Tripo'}: stretched {r['edgesOver1.6Max']}, collapsed {r['trianglesCollapsedMax']}, head {r['headDistortionMax']}"
        sheet = os.path.join(folder, "compare.png" if other_arm is not None else "sheet.png")
        subprocess.run(["magick"] + rows + ["-append", "-resize", "60%", "-gravity", "North", "-background", "white", "-splice", "0x30",
                        "-font", FONT, "-pointsize", "18", "-annotate", "+0+5", label, sheet], check=True)
        for row in rows:
            os.remove(row)
        log("compare", clip, json.dumps({k: report[k].get(clip) for k in ("ours", "other")}))
    with open(os.path.join(args.other_out or args.out, "compare-report.json"), "w") as handle:
        json.dump(report, handle, indent=1)


if __name__ == "__main__":
    main()
