"""Held items and GLB metadata for td_rig_tools.py.

attachments (rig preset): [{"name": "spear", "source": "models/attachments/linh-giao-spear.glb",
  "bone": "spear", "offset": 0.0, "roll": 0, "sockets": {"FX_TOOL": "FX_TOOL"}}]
The item (already prepared by models:blender: +Y up in glTF = +Z here, origin
at the grip) is read, its +Z turned onto the bone's axis, its origin put on the
bone's head (+ offset metres along the axis), then skinned 100 % to that bone as
a second mesh of the same armature (one skeleton, rigid; VAT bakes see it as
another skinned mesh). The bone needs "deform": true and no "part", so the
body's weights never use it. The item's FX_ empties become sockets on the bone.

extras(): rig object custom properties exported as glTF node extras:
  td_clips  {clip: {loop, seconds, crossfade_s, notes}}
  td_lookAt {bone, yawDeg, pitchDeg}   runtime head look-at limits (review: +-20 deg)
"""

import json
import math
import os

import bpy
from mathutils import Matrix, Quaternion, Vector

from td_rig_common import log, select_only


def attach(spec, rig, root):
    report = {}
    for item in spec.get("attachments", []):
        path = os.path.join(root, "art-src", item["source"])
        before = set(bpy.data.objects)
        bpy.ops.import_scene.gltf(filepath=path)
        bpy.context.view_layer.update()
        new = [o for o in bpy.data.objects if o not in before]
        meshes = [o for o in new if o.type == "MESH"]
        empties = {o.name.split(".")[0]: o.matrix_world.translation.copy() for o in new if o.type == "EMPTY"}
        for obj in meshes:
            world = obj.matrix_world.copy()
            obj.parent = None
            obj.data.transform(world)
            obj.matrix_world = Matrix.Identity(4)
        for obj in new:
            if obj.type != "MESH":
                bpy.data.objects.remove(obj, do_unlink=True)
        select_only(meshes)
        if len(meshes) > 1:
            bpy.ops.object.join()
        obj = bpy.context.view_layer.objects.active
        bone = rig.data.bones[item["bone"]]
        head = rig.matrix_world @ bone.head_local
        axis = (rig.matrix_world.to_3x3() @ (bone.tail_local - bone.head_local)).normalized()
        turn = Vector((0, 0, 1)).rotation_difference(axis) @ Quaternion((0, 0, 1), math.radians(item.get("roll", 0)))
        place = Matrix.Translation(head + axis * float(item.get("offset", 0.0))) @ turn.to_matrix().to_4x4()
        obj.data.transform(place)
        obj.data.update()
        obj.name = spec["id"] + "_" + item["name"]
        obj["td_attachment"] = item["name"]
        group = obj.vertex_groups.new(name=item["bone"])
        group.add(list(range(len(obj.data.vertices))), 1.0, "REPLACE")
        modifier = obj.modifiers.new("Armature", "ARMATURE")
        modifier.object = rig
        obj.parent = rig
        obj.matrix_parent_inverse = rig.matrix_world.inverted()
        for src, dst in item.get("sockets", {}).items():
            if src in empties:
                p = place @ empties[src]
                spec.setdefault("sockets", {})[dst] = {"bone": item["bone"], "at": [round(v, 4) for v in p]}
        tris = sum(len(p.vertices) - 2 for p in obj.data.polygons)
        report[item["name"]] = {"source": item["source"], "bone": item["bone"], "triangles": tris,
                                "grip": [round(v, 3) for v in head], "axis": [round(v, 3) for v in axis],
                                "sockets": {dst: spec["sockets"][dst]["at"] for dst in item.get("sockets", {}).values() if dst in spec.get("sockets", {})}}
        log("attached", item["name"], "to", item["bone"], tris, "triangles")
    return report


def attachment_meshes(rig):
    return [o for o in bpy.context.scene.objects if o.type == "MESH" and o.parent == rig and o.get("td_attachment")]


def extras(spec, rig, report):
    clips = {}
    for name, entry in (report.get("clips") or {}).items():
        clips[name] = {k: entry[k] for k in ("loop", "seconds", "crossfade_s", "notes", "groundSpeed_mps", "airborne_s", "groundFrames") if k in entry}
    rig["td_clips"] = json.dumps(clips, ensure_ascii=False)
    if spec.get("lookAt"):
        rig["td_lookAt"] = json.dumps(spec["lookAt"])
    if spec.get("attachments"):
        rig["td_attachments"] = json.dumps({a["name"]: {"bone": a["bone"], "source": a["source"]} for a in spec["attachments"]})
