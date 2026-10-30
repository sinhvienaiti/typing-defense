/** All accepted UI media URLs live here. Results images are only instantiated by Sheet.show("results"). */
const BASE = "/assets/typing-defense/ui/";
const asset = (name: string, dimensions: readonly (readonly [number, number])[], sizes: string, png = false) => {
  const files = dimensions.map(([width, height]) => ({ src: BASE + (png ? `${name}-${width}.png` : `${name}.${width}.webp`), width, height }));
  return { files, src: files[0]!.src, srcset: files.map((f) => `${f.src} ${f.width}w`).join(", "), sizes };
};
export const UI_ART = {
  "title-backdrop": asset("title-backdrop", [[1280, 720], [1536, 864]], "100vw"),
  logo: asset("logo", [[180, 60], [360, 120], [576, 192], [864, 288], [1296, 432], [1728, 576]], "45vw"),
  favicon: asset("favicon", [[32, 32], [64, 64]], "32px", true),
  crest: asset("crest", [[128, 128], [256, 256]], "(max-height: 800px) 72px, (min-height: 1000px) 128px, 96px"),
  banner: asset("banner", [[400, 99], [800, 198]], "(max-width: 420px) calc(100vw - 76px), 340px"),
  divider: asset("divider", [[320, 48], [640, 95]], "(max-width: 360px) calc(100vw - 76px), 280px"),
};
export type ArtName = keyof typeof UI_ART;
export const LOADING_LOGO_SIZES = "(min-height: 1080px) 180px, (max-height: 720px) 120px, 16.667vh";

/** Static markup only: no network request until the owning UI inserts it. */
export function artHtml(name: ArtName, className: string, alt = "", sizes = UI_ART[name].sizes): string {
  const art = UI_ART[name], first = art.files[0]!;
  return `<img class="${className}" data-ui-art="${name}" src="${art.src}" srcset="${art.srcset}" sizes="${sizes}" width="${first.width}" height="${first.height}" alt="${alt}"${alt === "" ? ' aria-hidden="true"' : ""}>`;
}

/** Handle failures already completed before main.ts as well as future error events. No painted substitute. */
export function bindArt(img: HTMLImageElement, name: ArtName, options: { fallback?: HTMLElement; loaded?(): void; failed?(): void } = {}): void {
  let warned = false;
  const loaded = () => {
    img.hidden = false;
    if (options.fallback) { options.fallback.hidden = true; options.fallback.setAttribute("aria-hidden", "true"); }
    options.loaded?.();
  };
  const failed = () => {
    img.hidden = true;
    if (options.fallback) { options.fallback.hidden = false; options.fallback.removeAttribute("aria-hidden"); }
    if (!warned) console.warn("UI art failed: " + name, img.currentSrc || img.src);
    warned = true;
    options.failed?.();
  };
  img.addEventListener("load", loaded);
  img.addEventListener("error", failed);
  if (img.complete) (img.naturalWidth > 0 ? loaded : failed)();
}
