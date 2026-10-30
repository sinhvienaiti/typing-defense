/** Optional build-time destination; the bridge uses only its origin. */
export function portalHome(value: string | undefined): string | null {
  if (!value?.trim()) return null;
  try {
    const url = new URL(value.trim());
    if (!["https:", "http:"].includes(url.protocol) || url.username || url.password) throw new Error("Invalid portal URL");
    return url.href;
  } catch {
    throw new TypeError("VITE_PORTAL_URL must be an absolute HTTP(S) URL without credentials");
  }
}
