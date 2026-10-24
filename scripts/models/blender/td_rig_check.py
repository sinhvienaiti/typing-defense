"""Checks for the rig preset loader (td_rig_tools.load_spec), run inside Blender:
  blender --background --factory-startup --python-exit-code 1 --python scripts/models/blender/td_rig_check.py
"""
import glob
import os
import sys

sys.dont_write_bytecode = True
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import td_rig_tools as T  # noqa: E402

# Both directions (review 24/10: FX_HAND_L rode hand_r because only _l -> _r existed).
assert T.mirror_name("hand_l") == "hand_r" and T.mirror_name("hand_r") == "hand_l"
assert T.mirror_name("FX_HAND_R") == "FX_HAND_L" and T.mirror_name("FX_HAND_L") == "FX_HAND_R"
assert T.mirror_name("ear_l_tip") == "ear_r_tip" and T.mirror_name("ear_r_tip") == "ear_l_tip"
assert T.mirror_name("spine_01") is None and T.mirror_name("head") is None
# Only left entries make a twin: a lone right bone (Lam's bag_r) stays single.
assert T.left_twin("upperarm_l") == "upperarm_r" and T.left_twin("bag_r") is None
assert T.socket_side_errors({"sockets": {"FX_HAND_L": {"bone": "hand_r"}}}) == ["FX_HAND_L on hand_r"]
assert T.socket_side_errors({"sockets": {"FX_HAND_L": {"bone": "hand_l"}, "FX_TOOL": {"bone": "bag_r"}}}) == []

presets = sorted(glob.glob(os.path.join(HERE, "..", "presets", "td-rigs", "*.json")))
assert presets, "no rig presets"
for path in presets:
    spec = T.load_spec(path)
    name = os.path.basename(path)
    sockets = spec.get("sockets", {})
    for socket, value in sockets.items():
        if socket.endswith("_L"):
            assert not value["bone"].endswith("_r"), (name, socket, value["bone"])
        if socket.endswith("_R"):
            assert not value["bone"].endswith("_l"), (name, socket, value["bone"])
    if "FX_HAND_R" in sockets and "FX_HAND_L" in sockets and sockets["FX_HAND_R"]["bone"].startswith("hand_"):
        assert sockets["FX_HAND_L"]["bone"] == T.mirror_name(sockets["FX_HAND_R"]["bone"]), name
    if "bag_r" in spec["bones"]:
        assert "bag_l" not in spec["bones"], name
print("td_rig_check: ok,", len(presets), "presets")
