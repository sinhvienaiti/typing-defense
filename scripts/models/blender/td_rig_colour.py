"""Even out a Tripo base-colour texture toward the 2D picture (colour only).

Tripo sometimes paints the two halves of a character differently: Mầm Gỗ's
front came out dark red-brown and its back light grey, while the picture is
one light wood. A single gain (static_model_tools.recolour) cannot fix that,
so this step works on the surface:

1. Every vertex gets a region ("leaf" by an HSV rule on its texture colour,
   else the default region) and its texture colour (linear).
2. The colours are low-passed over the mesh, inside each region (edge
   neighbours, `passes` times): the base tone of each place on the body,
   without the painted detail (cracks, veins, patches).
3. Each region's target is the mean linear colour of the picture's pixels of
   that region (chroma-key background removed, same HSV rule).
4. Gain per vertex = target / base tone, channel-wise, clamped; the gains
   are drawn into texture space through the UV triangles (barycentric), and
   every texel is multiplied by its gain. Detail keeps its contrast relative
   to the local tone, so front and back end on the same wood. Texels outside
   every triangle (padding) take the nearest drawn gain.

The geometry, the UVs and the source file are untouched; a new image is
packed into the exported GLB. Preset key (td-rigs/<id>.json):

  "colourUnify": {"picture": "enemies/mam-go.png" (under art-src),
                  "regions": {"leaf": {"hue": [55, 170], "satMin": 0.2, "valMin": 0.08}},
                  "default": "bark", "passes": 40, "gainClamp": [0.2, 6.0], "strength": 1.0,
                  "detail": {"chroma": 1.0, "contrast": 1.0}}

detail: each texel = target tone x (texel luminance / local luminance)^contrast
x (texel tint / local tint)^chroma; chroma 1 and contrast 1 are a plain
channel gain, lower values calm a texture whose dark half had strong tints.
"""

import os

import bpy
import numpy as np

import td_rig_common as C
from td_rig_common import log

LUMA = np.array([0.2126, 0.7152, 0.0722])


def srgb_to_linear(c):
    c = np.asarray(c, dtype=np.float64)
    return np.where(c <= 0.04045, c / 12.92, ((c + 0.055) / 1.055) ** 2.4)


def linear_to_srgb(c):
    c = np.clip(c, 0.0, 1.0)
    return np.where(c <= 0.0031308, c * 12.92, 1.055 * np.power(c, 1 / 2.4) - 0.055)


def base_image_node(mesh):
    mat = mesh.active_material
    if mat is None or not mat.use_nodes:
        return None
    for node in mat.node_tree.nodes:
        if node.type == "BSDF_PRINCIPLED" and node.inputs["Base Color"].is_linked:
            src = node.inputs["Base Color"].links[0].from_node
            for _ in range(3):
                if src.type == "TEX_IMAGE":
                    return src
                linked = [i for i in src.inputs if i.is_linked]
                if not linked:
                    break
                src = linked[0].links[0].from_node
    return None


def picture_pixels(path):
    """Linear RGB of the picture's subject (flat chroma background removed)."""
    image = bpy.data.images.load(path, check_existing=False)
    image.colorspace_settings.name = "Non-Color"
    w, h = image.size
    px = np.empty(w * h * image.channels, dtype=np.float32)
    image.pixels.foreach_get(px)
    px = px.reshape(h, w, image.channels)
    bpy.data.images.remove(image)
    rgb = px[:, :, :3].astype(np.float64)
    corners = np.array([rgb[2, 2], rgb[2, -3], rgb[-3, 2], rgb[-3, -3]])
    key = np.median(corners, axis=0)
    mask = np.abs(rgb - key).max(axis=2) > 0.22
    if px.shape[2] == 4:
        mask &= px[:, :, 3] > 0.5
    key_hue = key - key.min()
    if np.linalg.norm(key_hue) > 0.5:  # key spill on the rim
        hue = rgb - rgb.min(axis=2, keepdims=True)
        chroma = np.linalg.norm(hue, axis=2)
        similar = (hue @ key_hue) / np.maximum(chroma * np.linalg.norm(key_hue), 1e-6)
        mask &= ~((similar > 0.9) & (chroma > 0.3))
    for _ in range(3):
        mask = mask & np.roll(mask, 1, 0) & np.roll(mask, -1, 0) & np.roll(mask, 1, 1) & np.roll(mask, -1, 1)
    return rgb[mask]  # sRGB 0..1


def classify(rgb_srgb, regions, default):
    names = np.full(len(rgb_srgb), default, dtype=object)
    for name, rule in regions.items():
        names[C.colour_mask(rgb_srgb, rule)] = name
    return names.astype(str)


def loop_arrays(mesh):
    loops = mesh.data.loops
    uv = np.empty(len(loops) * 2)
    mesh.data.uv_layers.active.data.foreach_get("uv", uv)
    vi = np.empty(len(loops), dtype=np.int64)
    loops.foreach_get("vertex_index", vi)
    tris = []
    for p in mesh.data.polygons:
        start, total = p.loop_start, p.loop_total
        for k in range(1, total - 1):
            tris.append((start, start + k, start + k + 1))
    return uv.reshape(-1, 2), vi, np.array(tris, dtype=np.int64)


def raster_gains(width, height, uv, loop_vertex, tris, gains):
    """Barycentric fill of per-vertex gains into texel space; returns (gain map, covered mask)."""
    out = np.zeros((height, width, 3))
    hit = np.zeros((height, width), dtype=bool)
    px = np.stack([uv[:, 0] * width - 0.5, uv[:, 1] * height - 0.5], axis=1)
    for a, b, c in tris:
        p0, p1, p2 = px[a], px[b], px[c]
        x0, x1 = int(np.floor(min(p0[0], p1[0], p2[0]))) - 1, int(np.ceil(max(p0[0], p1[0], p2[0]))) + 1
        y0, y1 = int(np.floor(min(p0[1], p1[1], p2[1]))) - 1, int(np.ceil(max(p0[1], p1[1], p2[1]))) + 1
        x0, y0 = max(x0, 0), max(y0, 0)
        x1, y1 = min(x1, width - 1), min(y1, height - 1)
        if x1 < x0 or y1 < y0:
            continue
        xs, ys = np.meshgrid(np.arange(x0, x1 + 1), np.arange(y0, y1 + 1))
        d = (p1[1] - p2[1]) * (p0[0] - p2[0]) + (p2[0] - p1[0]) * (p0[1] - p2[1])
        if abs(d) < 1e-12:
            continue
        l0 = ((p1[1] - p2[1]) * (xs - p2[0]) + (p2[0] - p1[0]) * (ys - p2[1])) / d
        l1 = ((p2[1] - p0[1]) * (xs - p2[0]) + (p0[0] - p2[0]) * (ys - p2[1])) / d
        l2 = 1 - l0 - l1
        inside = (l0 >= -0.02) & (l1 >= -0.02) & (l2 >= -0.02)
        if not inside.any():
            continue
        g = (l0[..., None] * gains[loop_vertex[a]] + l1[..., None] * gains[loop_vertex[b]] + l2[..., None] * gains[loop_vertex[c]])
        yy, xx = ys[inside], xs[inside]
        out[yy, xx] = g[inside]
        hit[yy, xx] = True
    return out, hit


def dilate(gain, hit, passes=24):
    """Uncovered texels take the mean of covered neighbours, ring by ring."""
    gain, hit = gain.copy(), hit.copy()
    for _ in range(passes):
        if hit.all():
            break
        total = np.zeros_like(gain)
        count = np.zeros(hit.shape)
        for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1), (1, 1), (1, -1), (-1, 1), (-1, -1)):
            total += np.roll(np.roll(gain * hit[..., None], dy, 0), dx, 1)
            count += np.roll(np.roll(hit, dy, 0), dx, 1)
        grow = ~hit & (count > 0)
        gain[grow] = total[grow] / count[grow][:, None]
        hit = hit | grow
    if not hit.all():
        gain[~hit] = gain[hit].mean(0)
    return gain


def unify(spec, mesh, root, report):
    cfg = spec.get("colourUnify")
    if not cfg:
        return None
    node = base_image_node(mesh)
    if node is None or not mesh.data.uv_layers:
        report.setdefault("warnings", []).append("colourUnify: no base colour texture")
        return None
    regions = cfg.get("regions", {})
    default = cfg.get("default", "body")
    rgb_v = C.vertex_rgb(mesh)  # sRGB 0..1 per vertex
    region = classify(rgb_v, regions, default)
    lin_v = srgb_to_linear(rgb_v)
    # Low-pass inside each region over the mesh edges.
    edges = C.edges_array(mesh)
    same = region[edges[:, 0]] == region[edges[:, 1]]
    e = edges[same]
    base = lin_v.copy()
    for _ in range(int(cfg.get("passes", 40))):
        total = np.zeros_like(base)
        count = np.zeros(len(base))
        np.add.at(total, e[:, 0], base[e[:, 1]])
        np.add.at(total, e[:, 1], base[e[:, 0]])
        np.add.at(count, e[:, 0], 1)
        np.add.at(count, e[:, 1], 1)
        nb = count > 0
        base[nb] = 0.5 * base[nb] + 0.5 * total[nb] / count[nb][:, None]
    # Targets from the picture, per region.
    picture = srgb_to_linear(picture_pixels(os.path.join(root, "art-src", cfg["picture"])))
    pic_srgb = linear_to_srgb(picture)
    pic_region = classify(pic_srgb, regions, default)
    targets = {}
    for name in set(region) | {default}:
        rows = pic_region == name
        if rows.sum() < 100:
            continue
        targets[name] = picture[rows].mean(0)
    lo, hi = cfg.get("gainClamp", [0.2, 6.0])
    strength = float(cfg.get("strength", 1.0))
    detail = cfg.get("detail", {})
    chroma = float(detail.get("chroma", 1.0))  # 1 keeps each texel's own tint around the local tone
    contrast = float(detail.get("contrast", 1.0))  # <1 softens dark cracks the gain would deepen
    target_v = base.copy()
    for name, target in targets.items():
        rows = region == name
        target_v[rows] = np.exp((1 - strength) * np.log(np.maximum(base[rows], 1e-4)) + strength * np.log(target))[None, :] \
            if strength < 1 else target[None, :]
    # Soften both fields across region borders (a leaf stem into bark).
    border = np.zeros(len(base), dtype=bool)
    border[edges[~same].ravel()] = True
    blend_base, blend_target = base.copy(), target_v.copy()
    for _ in range(int(cfg.get("borderPasses", 3))):
        for field in (blend_base, blend_target):
            total = np.zeros_like(field)
            count = np.zeros(len(field))
            np.add.at(total, edges[:, 0], field[edges[:, 1]])
            np.add.at(total, edges[:, 1], field[edges[:, 0]])
            np.add.at(count, edges[:, 0], 1)
            np.add.at(count, edges[:, 1], 1)
            field[border] = 0.5 * field[border] + 0.5 * total[border] / np.maximum(count[border], 1)[:, None]
    gains = np.clip(blend_target / np.maximum(blend_base, 1e-4), lo, hi)
    source = node.image
    width, height = source.size
    channels = source.channels
    px = np.empty(width * height * channels, dtype=np.float32)
    source.pixels.foreach_get(px)
    px = px.reshape(height, width, channels)
    uv, loop_vertex, tris = loop_arrays(mesh)
    base_map, hit = raster_gains(width, height, uv, loop_vertex, tris, blend_base)
    target_map, _hit = raster_gains(width, height, uv, loop_vertex, tris, blend_target)
    base_map = np.maximum(dilate(base_map, hit), 1e-4)
    target_map = dilate(target_map, hit)
    texel = srgb_to_linear(px[:, :, :3])
    ratio = texel / base_map
    lum_ratio = np.maximum((texel @ LUMA) / np.maximum(base_map @ LUMA, 1e-4), 1e-4)[..., None]
    linear = target_map * lum_ratio ** contrast * (np.maximum(ratio, 1e-4) / lum_ratio) ** chroma
    linear = np.clip(linear, texel * lo, np.maximum(texel * hi, 1e-4))
    px[:, :, :3] = linear_to_srgb(linear).astype(np.float32)
    image = bpy.data.images.new(source.name + "_unified", width, height, alpha=channels == 4)
    image.colorspace_settings.name = source.colorspace_settings.name
    image.pixels.foreach_set(px.ravel())
    import tempfile
    path = os.path.join(tempfile.mkdtemp(prefix="td-rig-colour-"), image.name + ".png")
    image.filepath_raw = path
    image.file_format = "PNG"
    image.save()
    image.reload()
    image.pack()
    node.image = image
    after_v = srgb_to_linear(C.vertex_rgb(mesh))
    co = C.vertex_array(mesh)
    front, back = co[:, 1] < -0.02, co[:, 1] > 0.02

    def mean(values, rows):
        return [round(float(v), 4) for v in values[rows].mean(0)] if rows.any() else None

    entry = {"picture": cfg["picture"], "texelsCovered": round(float(hit.mean()), 3), "regions": {}}
    for name in sorted(set(region)):
        rows = region == name
        entry["regions"][name] = {
            "vertices": int(rows.sum()),
            "target": [round(float(v), 4) for v in targets.get(name, np.zeros(3))],
            "beforeFront": mean(lin_v, rows & front), "beforeBack": mean(lin_v, rows & back),
            "afterFront": mean(after_v, rows & front), "afterBack": mean(after_v, rows & back),
            "gainMedian": [round(float(v), 3) for v in np.median(gains[rows], 0)],
        }
    report["colourUnify"] = entry
    log("colour unify", {k: (v["beforeFront"], v["beforeBack"], v["afterFront"], v["afterBack"], v["target"]) for k, v in entry["regions"].items()})
    return entry
