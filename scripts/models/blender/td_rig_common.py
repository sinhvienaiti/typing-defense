"""Shared Blender helpers for Lời Gọi's rig tools (td_rig_tools.py).

Authoring frame (every rig preset, td-rigs/<id>.json): metres, Blender Z up,
the character faces -Y (Mesh2Motion / Quaternius convention, so CC0 clips need
no axis change), +X is the character's left, origin at the feet centre on the
ground. The exported GLB is turned 180 degrees so the front faces glTF -Z
(scripts/models/model-contracts.ts).
"""

import math
import os
import sys

import bmesh
import bpy
import numpy as np
from mathutils import Matrix, Quaternion, Vector

HERE = os.path.dirname(os.path.abspath(__file__))


def log(*parts):
    print("[td-rig]", *parts, flush=True)


def parent_tools():
    """The parent repo's static helper (decimate, matte), imported as a module."""
    root = HERE
    for _ in range(8):
        candidate = os.path.join(root, "scripts", "models", "blender")
        if os.path.exists(os.path.join(candidate, "static_model_tools.py")) and "games" not in os.path.relpath(candidate, root):
            sys.path.insert(0, candidate)
            import static_model_tools  # noqa: E402
            return static_model_tools
        root = os.path.dirname(root)
    raise SystemExit("parent scripts/models/blender/static_model_tools.py not found")


def select_only(objects):
    bpy.ops.object.select_all(action="DESELECT")
    for obj in objects:
        obj.select_set(True)
    if objects:
        bpy.context.view_layer.objects.active = objects[0]


def triangles(obj):
    return sum(len(p.vertices) - 2 for p in obj.data.polygons)


def import_mesh(path):
    """Empty scene, the GLB with seam vertices merged (one mesh, transforms applied)."""
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.ops.import_scene.gltf(filepath=path, merge_vertices=True)
    for obj in list(bpy.context.scene.objects):
        if obj.type in ("LIGHT", "CAMERA", "EMPTY"):
            bpy.data.objects.remove(obj, do_unlink=True)
    if any(o.type == "ARMATURE" for o in bpy.context.scene.objects):
        raise SystemExit("input has an armature: rig tools start from the unrigged Tripo mesh")
    meshes = [o for o in bpy.context.scene.objects if o.type == "MESH"]
    select_only(meshes)
    if len(meshes) > 1:
        bpy.ops.object.join()
    obj = bpy.context.view_layer.objects.active
    if obj.parent is not None:
        keep = obj.matrix_world.copy()
        obj.parent = None
        obj.matrix_world = keep
    bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
    return obj


def place(obj, yaw_deg, height):
    """Turn by yaw about Z (front to -Y), scale to height, feet centre at the origin."""
    # Straight on the mesh data: transform_apply ignores a rotation set from
    # Python until the depsgraph has run.
    obj.data.transform(Matrix.Rotation(math.radians(yaw_deg), 4, "Z"))
    obj.data.update()
    co = vertex_array(obj)
    lo, hi = co.min(0), co.max(0)
    scale = height / (hi[2] - lo[2])
    # Feet centre: the lowest 3 % of the body.
    low = co[co[:, 2] < lo[2] + 0.03 * (hi[2] - lo[2])]
    centre = Vector(((low[:, 0].min() + low[:, 0].max()) / 2, (low[:, 1].min() + low[:, 1].max()) / 2, lo[2]))
    obj.data.transform(Matrix.Scale(scale, 4) @ Matrix.Translation(-centre))
    obj.data.update()
    return scale


def vertex_array(obj):
    co = np.empty(len(obj.data.vertices) * 3, dtype=np.float64)
    obj.data.vertices.foreach_get("co", co)
    return co.reshape(-1, 3)


def evaluated_vertices(obj):
    deps = bpy.context.evaluated_depsgraph_get()
    ev = obj.evaluated_get(deps)
    mesh = ev.to_mesh()
    co = np.empty(len(mesh.vertices) * 3, dtype=np.float64)
    mesh.vertices.foreach_get("co", co)
    ev.to_mesh_clear()
    return co.reshape(-1, 3) @ np.array(obj.matrix_world)[:3, :3].T + np.array(obj.matrix_world)[:3, 3]


def edges_array(obj):
    e = np.empty(len(obj.data.edges) * 2, dtype=np.int64)
    obj.data.edges.foreach_get("vertices", e)
    return e.reshape(-1, 2)


def faces_array(obj):
    """Triangles (the Tripo meshes are triangulated; quads would be split here)."""
    tris = []
    for p in obj.data.polygons:
        v = list(p.vertices)
        for k in range(1, len(v) - 1):
            tris.append((v[0], v[k], v[k + 1]))
    return np.array(tris, dtype=np.int64)


def islands(obj):
    """Connected pieces (after merge): label per vertex, sizes."""
    edges = edges_array(obj)
    n = len(obj.data.vertices)
    parent = np.arange(n)

    def find(a):
        root = a
        while parent[root] != root:
            root = parent[root]
        while parent[a] != root:
            parent[a], a = root, parent[a]
        return root

    for a, b in edges:
        ra, rb = find(a), find(b)
        if ra != rb:
            parent[ra] = rb
    roots = np.array([find(i) for i in range(n)])
    _u, label, sizes = np.unique(roots, return_inverse=True, return_counts=True)
    return label.ravel(), sizes


# ----------------------------------------------------------------------------
# Rendering
# ----------------------------------------------------------------------------
def render_setup(resolution=384, engine="WORKBENCH", background=(0.80, 0.81, 0.83)):
    scene = bpy.context.scene
    scene.render.resolution_x = resolution
    scene.render.resolution_y = resolution
    scene.render.resolution_percentage = 100
    scene.render.film_transparent = False
    scene.render.image_settings.file_format = "PNG"
    scene.view_settings.view_transform = "Standard"
    if engine == "WORKBENCH":
        scene.render.engine = "BLENDER_WORKBENCH"
        shading = scene.display.shading
        shading.light = "STUDIO"
        shading.color_type = "TEXTURE"
        shading.show_object_outline = False
        shading.show_cavity = False
        shading.background_type = "VIEWPORT"
        shading.background_color = background
        scene.display.render_aa = "8"
    else:
        scene.render.engine = "BLENDER_EEVEE"
        try:
            scene.eevee.taa_render_samples = 16
        except AttributeError:
            pass
        world = bpy.data.worlds.new("TDWorld")
        scene.world = world
        world.use_nodes = True
        bg = world.node_tree.nodes.get("Background")
        bg.inputs[0].default_value = (*background, 1)
        bg.inputs[1].default_value = 0.8
        for name, rot, energy in (("Key", (50, 0, -35), 2.6), ("Fill", (70, 0, 140), 0.9)):
            data = bpy.data.lights.new(name, "SUN")
            data.energy = energy
            light = bpy.data.objects.new(name, data)
            light.rotation_euler = tuple(math.radians(v) for v in rot)
            scene.collection.objects.link(light)
    return scene


def camera(name, direction, target, ortho_scale, distance=30.0, up=(0, 0, 1), ortho=True, lens=50):
    """Camera looking along `direction` (pointing from camera to target)."""
    scene = bpy.context.scene
    data = bpy.data.cameras.get(name) or bpy.data.cameras.new(name)
    data.type = "ORTHO" if ortho else "PERSP"
    data.ortho_scale = ortho_scale
    data.lens = lens
    data.clip_start = 0.05
    data.clip_end = distance * 4
    obj = bpy.data.objects.get(name)
    if obj is None:
        obj = bpy.data.objects.new(name, data)
        scene.collection.objects.link(obj)
    d = Vector(direction).normalized()
    obj.location = Vector(target) - d * distance
    obj.rotation_euler = d.to_track_quat("-Z", "Y").to_euler()
    if abs(d.z) > 0.999:
        obj.rotation_euler = (0, 0, 0) if d.z < 0 else (math.pi, 0, 0)
    return obj


def render_to(path, cam):
    scene = bpy.context.scene
    scene.camera = cam
    os.makedirs(os.path.dirname(path), exist_ok=True)
    scene.render.filepath = path
    bpy.ops.render.render(write_still=True)


def ground_plane(size=12.0, z=0.0, colour=(0.55, 0.57, 0.6, 1)):
    mesh = bpy.data.meshes.new("Ground")
    s = size / 2
    mesh.from_pydata([(-s, -s, z), (s, -s, z), (s, s, z), (-s, s, z)], [], [(0, 1, 2, 3)])
    obj = bpy.data.objects.new("Ground", mesh)
    bpy.context.scene.collection.objects.link(obj)
    mat = bpy.data.materials.new("GroundMat")
    mat.diffuse_color = colour
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes.get("Principled BSDF")
    if bsdf:
        bsdf.inputs["Base Color"].default_value = colour
    mesh.materials.append(mat)
    return obj


def quat_world_axes(axis, degrees):
    return Quaternion(Vector(axis), math.radians(degrees))
