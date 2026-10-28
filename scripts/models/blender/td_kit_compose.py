# 1C C4 part B: renders each house of map 1 at every level with its kits placed as src/view/3d/kits.json says, from
# TK 23.6's default camera side (55 deg, front) and from the front, so a fit can be judged. Blender 4+/5:
#   $B --background --factory-startup --python scripts/models/blender/td_kit_compose.py -- --root . --out <dir> [--only keep]
import json, math, os, sys
import bpy
from mathutils import Vector

argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
arg = lambda name, default=None: argv[argv.index(name) + 1] if name in argv else default
root, out, only = arg("--root", "."), arg("--out", "tmp/kit-compose"), arg("--only")
os.makedirs(out, exist_ok=True)
table = json.load(open(os.path.join(root, "src/view/3d/kits.json")))

def clear():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    scene = bpy.context.scene
    scene.render.engine = "BLENDER_EEVEE_NEXT" if "BLENDER_EEVEE_NEXT" in [e.identifier for e in bpy.types.RenderSettings.bl_rna.properties["engine"].enum_items] else "BLENDER_EEVEE"
    scene.render.resolution_x = scene.render.resolution_y = 640
    world = bpy.data.worlds.new("w"); scene.world = world; world.use_nodes = True
    world.node_tree.nodes["Background"].inputs[0].default_value = (0.78, 0.82, 0.86, 1); world.node_tree.nodes["Background"].inputs[1].default_value = 0.9
    sun = bpy.data.objects.new("sun", bpy.data.lights.new("sun", "SUN")); sun.data.energy = 3.5
    sun.rotation_euler = (math.radians(50), 0, math.radians(-35)); scene.collection.objects.link(sun)
    bpy.ops.mesh.primitive_plane_add(size=40); bpy.context.object.data.materials.append(bpy.data.materials.new("ground"))

def place(key, at, yaw=0.0):
    path = os.path.join(root, "art-src/models", key + ".glb")
    before = set(bpy.data.objects)
    bpy.ops.import_scene.gltf(filepath=path)
    for obj in set(bpy.data.objects) - before:
        if obj.parent is None:
            # glTF (x, y, z), Y up -> Blender (x, -z, y), Z up; yaw about +Y -> about +Z.
            obj.location = Vector((at[0], -at[2], at[1]))
            obj.rotation_euler[2] += math.radians(yaw)
        if obj.type == "EMPTY": obj.hide_render = True

def shoot(name, height):
    scene = bpy.context.scene
    for tag, pitch, dist in (("game", 55, 2.4), ("front", 12, 2.2)):
        cam = bpy.data.objects.new("cam", bpy.data.cameras.new("cam")); scene.collection.objects.link(cam)
        cam.data.lens = 50
        r = max(6.0, height * 1.3) * dist
        # Blender +Y is glTF -Z: the house's front. The camera stands in front of it, a little to its left.
        yaw = math.radians(-25 if tag == "game" else 0)
        cam.location = Vector((math.sin(yaw) * r * math.cos(math.radians(pitch)), r * math.cos(yaw) * math.cos(math.radians(pitch)), r * math.sin(math.radians(pitch)) + height * 0.35))
        direction = Vector((0, 0, height * 0.45)) - cam.location
        cam.rotation_euler = direction.to_track_quat("-Z", "Y").to_euler()
        scene.camera = cam
        scene.render.filepath = os.path.join(out, f"{name}__{tag}.png")
        bpy.ops.render.render(write_still=True)

for house, levels in table.items():
    if house == "note" or (only and house != only): continue
    for level in ["1", *levels.keys()]:
        clear()
        place("buildings/" + house, [0, 0, 0])
        top = 4.0
        for item in levels.get(level, []):
            if item.get("replaces"):
                for obj in list(bpy.data.objects):
                    pass  # the base's barrel is a separate prop at runtime; nothing to hide in the base model
            place(item["kit"], item["at"], item.get("yaw", 0))
            top = max(top, item["at"][1] + 3)
        shoot(f"{house}-l{level}", max(top, 8.0 if house in ("keep", "archer") else 5.0))
print("compose done:", out)
