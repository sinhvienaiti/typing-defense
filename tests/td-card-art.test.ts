import { describe, expect, it } from "vitest";
import { CALL_ICON, CALL_NAME, pips } from "../src/view/words/cards";
import { world } from "./td/fixtures";

describe("203 B deferred: 133, 165, 172 have no accepted verdict", () => {
  it("keeps the eight existing call labels pending 133", () => {
    expect(CALL_ICON).toHaveLength(8); expect(CALL_NAME).toEqual(["Power", "Build", "Reap", "Chop", "Dig", "Quiz", "Spell", "Stop"]);
  });
  it("keeps full/full/empty for three words, one done, and none for one word pending 172", () => {
    const w = world(); w.calls.words[0] = 3; w.calls.done[0] = 1;
    expect(pips(w, 0)).toBe("●●○"); w.calls.words[0] = 1; expect(pips(w, 0)).toBe("");
  });
});
