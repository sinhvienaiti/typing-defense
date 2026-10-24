"""Landmark survey for placing a rig on an unrigged Tripo character.

blender --background --factory-startup --python td_rig_survey.py -- \
    --input <art-src/3d/...glb> --yaw <deg> --height <m> --out <folder> [--triangles N]

Writes ortho renders (front, side, back, top) at a known scale and a slice
profile (per 2 % of height: X/Y extent, the runs of material across X through
the body's middle, the depth) to <out>/survey.json. Bone positions in the rig
preset are read off these (feet, crotch gap, hips, chest, shoulders, narrowest
neck, head top, arm tips), then checked with td_rig_tools.py --mode bones.
"""

import argparse
import json
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import numpy as np  # noqa: E402
from td_rig_common import (camera, import_mesh, islands, log, place, render_setup, render_to,  # noqa: E402
                           triangles, vertex_array)


def runs(values, gap):
    """Sorted 1D coordinates -> list of [start, end] runs split at gaps > gap."""
    if len(values) == 0:
        return []
    values = np.sort(values)
    out = [[values[0], values[0]]]
    for v in values[1:]:
        if v - out[-1][1] > gap:
            out.append([v, v])
        else:
            out[-1][1] = v
    return [[round(float(a), 3), round(float(b), 3)] for a, b in out]


def main():
    argv = sys.argv[sys.argv.index("--") + 1:]
    parser = argparse.ArgumentParser()
    parser.add_argument("--input", required=True)
    parser.add_argument("--yaw", type=float, default=0)
    parser.add_argument("--height", type=float, required=True)
    parser.add_argument("--out", required=True)
    args = parser.parse_args(argv)
    obj = import_mesh(args.input)
    scale = place(obj, args.yaw, args.height)
    co = vertex_array(obj)
    label, sizes = islands(obj)
    lo, hi = co.min(0), co.max(0)
    H = hi[2] - lo[2]
    profile = []
    step = 0.02 * H
    for k in range(50):
        z0 = k * step
        band = co[(co[:, 2] >= z0) & (co[:, 2] < z0 + step)]
        if not len(band):
            continue
        mid = band[np.abs(band[:, 1] - np.median(band[:, 1])) < 0.08 * H]
        profile.append({
            "z": round(z0 + step / 2, 3),
            "x": [round(float(band[:, 0].min()), 3), round(float(band[:, 0].max()), 3)],
            "y": [round(float(band[:, 1].min()), 3), round(float(band[:, 1].max()), 3)],
            "xRuns": runs(mid[:, 0], 0.02 * H),
            "yRunsAtX0": runs(band[np.abs(band[:, 0]) < 0.04 * H][:, 1], 0.02 * H),
        })
    report = {
        "input": args.input, "yaw": args.yaw, "height": args.height, "scale": round(scale, 5),
        "triangles": triangles(obj), "vertices": len(co),
        "bbox": [lo.round(3).tolist(), hi.round(3).tolist()],
        "islands": sorted(sizes.tolist(), reverse=True)[:8],
        "profile": profile,
    }
    os.makedirs(args.out, exist_ok=True)
    with open(os.path.join(args.out, "survey.json"), "w") as handle:
        json.dump(report, handle, indent=1)
    render_setup(768)
    centre = (0, 0, H / 2)
    size = max(H, hi[0] - lo[0], hi[1] - lo[1]) * 1.1
    report["ortho"] = {"scale": size, "centre": centre, "resolution": 768}
    for name, direction in (("front", (0, 1, 0)), ("side", (-1, 0, 0)), ("back", (0, -1, 0)), ("top", (0, 0, -1))):
        cam = camera("Cam_" + name, direction, centre, size)
        render_to(os.path.join(args.out, name + ".png"), cam)
    with open(os.path.join(args.out, "survey.json"), "w") as handle:
        json.dump(report, handle, indent=1)
    log("survey", args.out, "triangles", report["triangles"], "bbox", report["bbox"])


if __name__ == "__main__":
    main()
