import { afterEach, describe, expect, it, vi } from "vitest";
import type { BridgeHost, LearningEvent, QueueStorage } from "../src/kit/learning";
import { learningBridge } from "../src/app/learning";

const event = { version: 1, gameId: "typing-defense", entityId: "thank" } as LearningEvent;
function fixture() {
  const postMessage = vi.fn();
  const listeners = new Set<(event: MessageEvent<unknown>) => void>();
  let queue: unknown = [event];
  const storage: QueueStorage = { readJson: () => queue, writeJson: (_key, value) => { queue = value; return true; } };
  const host: BridgeHost = {
    parent: { postMessage },
    addEventListener: (_type, listener) => { listeners.add(listener); },
    removeEventListener: (_type, listener) => { listeners.delete(listener); },
    setTimeout: (callback, ms) => setTimeout(callback, ms),
    clearTimeout: (handle) => clearTimeout(handle as ReturnType<typeof setTimeout>),
    now: () => 1,
  };
  return { host, storage, postMessage, receive: (origin: string) => {
    for (const listener of listeners) listener({ source: host.parent, origin, data: { type: "typing-game:shared-music", playing: true } } as MessageEvent);
  } };
}
afterEach(() => vi.unstubAllEnvs());

describe("portal destination", () => {
  it.each([undefined, "", "   "])("has no portal for %j", async (url) => {
    const { portalHome } = await import("../src/app/portal");
    expect(portalHome(url)).toBeNull();
  });
  it.each(["https://portal.example/learn/?game=typing-defense#book", "http://localhost:4321/path"])("accepts %s", async (url) => {
    const { portalHome } = await import("../src/app/portal");
    expect(portalHome(url)).toBe(url);
  });
  it.each(["broken", "/portal", "ftp://portal.example/", "javascript:alert(1)", "https://user@portal.example/", "https://:pass@portal.example/"])("rejects %s", async (url) => {
    const { portalHome } = await import("../src/app/portal");
    expect(() => portalHome(url)).toThrow(/VITE_PORTAL_URL.*HTTP\(S\).*credentials/);
  });
  it("keeps queued and new events when an unconfigured game is framed", async () => {
    vi.stubEnv("VITE_PORTAL_URL", "");
    const { createPortalBridge } = await import("../src/app/learning");
    const f = fixture();
    const bridge = createPortalBridge(f);
    try {
      expect(bridge.embedded).toBe(false);
      expect(bridge.queued()).toEqual([event]);
      bridge.sendAttempt(event);
      expect(bridge.flushQueue()).toBe(0);
      expect(bridge.requestFocus()).toBe(false);
      expect(bridge.queued()).toEqual([event, event]);
      expect(f.postMessage).not.toHaveBeenCalled();
    } finally { bridge.dispose(); }
    const again = createPortalBridge(f);
    expect(again.queued()).toEqual([event, event]);
    expect(f.postMessage).not.toHaveBeenCalled();
    again.dispose();
  });
  it("sends to the URL origin and ignores messages from other origins", async () => {
    vi.stubEnv("VITE_PORTAL_URL", "https://portal.example/learn/?game=typing-defense");
    const { createPortalBridge } = await import("../src/app/learning");
    const f = fixture();
    const bridge = createPortalBridge(f);
    try {
      expect(bridge.parentOrigin).toBe("https://portal.example");
      expect(bridge.queued()).toEqual([]);
      bridge.sendAttempt(event);
      expect(bridge.requestFocus()).toBe(true);
      expect(f.postMessage).toHaveBeenCalledTimes(3);
      for (const call of f.postMessage.mock.calls) expect(call[1]).toBe("https://portal.example");
      const receive = vi.fn();
      bridge.onSharedMusic(receive);
      f.receive("https://other.example");
      expect(receive).not.toHaveBeenCalled();
      f.receive("https://portal.example");
      expect(receive).toHaveBeenCalledWith(true);
    } finally { bridge.dispose(); }
  });
  it("uses the adapter for the game's lazy singleton", () => {
    vi.stubEnv("VITE_PORTAL_URL", "");
    expect(learningBridge().parentOrigin).toBe("");
    expect(learningBridge()).toBe(learningBridge());
  });
});
