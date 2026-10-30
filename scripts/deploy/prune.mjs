import { existsSync, lstatSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { dirname, isAbsolute, join, relative, resolve, sep } from "node:path";

const prefix = "/assets/typing-defense/models/";

// Never follow links while planning or deleting a package's files.
function filesUnder(path) {
  if (!existsSync(path)) return [];
  const stat = lstatSync(path);
  if (stat.isSymbolicLink()) throw new Error(`Refusing symlink: ${path}`);
  if (stat.isFile()) return [{ path, bytes: stat.size }];
  if (!stat.isDirectory()) throw new Error(`Not a regular package path: ${path}`);
  return readdirSync(path).flatMap((name) => filesUnder(join(path, name)));
}

function modelPath(url, key, models) {
  try {
    if (typeof url !== "string" || !url.startsWith(prefix)) throw new Error();
    const decoded = decodeURIComponent(url.split(/[?#]/)[0]);
    if (decoded.includes("\\") || decoded.includes("\0")) throw new Error();
    const parsed = new URL(decoded, "https://package.invalid");
    if (!parsed.pathname.startsWith(prefix)) throw new Error();
    const path = resolve(models, decoded.slice(prefix.length));
    const inside = relative(models, path);
    if (!inside || inside === ".." || inside.startsWith(".." + sep) || isAbsolute(inside)) throw new Error();
    return path;
  } catch {
    throw new Error(`Model ${key}: URL outside models/: ${String(url)}`);
  }
}

function prune(target) {
  if (!target) throw new Error("Usage: node scripts/deploy/prune.mjs <dist>");
  const dist = resolve(target);
  // Refuse linked ancestors, including a linked dist itself.
  for (let at = dist; ; at = dirname(at)) {
    if (lstatSync(at).isSymbolicLink()) throw new Error(`Refusing symlink: ${at}`);
    if (dirname(at) === at) break;
  }
  const index = join(dist, "index.html");
  if (!existsSync(index) || !lstatSync(index).isFile()) throw new Error(`Not a package directory (missing index.html): ${dist}`);
  const list = JSON.parse(readFileSync(new URL("../../deploy-models.json", import.meta.url), "utf8"));
  if (!Array.isArray(list.models) || list.models.some((key) => typeof key !== "string")) throw new Error("deploy-models.json must contain a models array of keys");
  const keys = [...new Set(list.models)];
  const models = join(dist, "assets/typing-defense/models");
  const vite = join(dist, ".vite");
  // Check every parent before reading a manifest through it.
  for (const path of [join(dist, "assets"), join(dist, "assets/typing-defense")]) {
    if (existsSync(path) && lstatSync(path).isSymbolicLink()) throw new Error(`Refusing symlink: ${path}`);
  }
  const modelFiles = filesUnder(models);
  const viteFiles = filesUnder(vite);
  let manifest;
  const keep = new Set();
  const manifestPath = join(models, "manifest.json");
  if (existsSync(models) && keys.length) {
    manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
    const selected = {};
    for (const key of keys) {
      if (!Object.hasOwn(manifest.models ?? {}, key)) throw new Error(`Unknown model key: ${key}`);
      const model = manifest.models[key];
      selected[key] = model;
      for (const tier of Object.values(model.tiers ?? {})) keep.add(modelPath(tier.url, key, models));
    }
    manifest = { ...manifest, models: selected };
    keep.add(manifestPath);
  }
  // All validation completes before the first write or deletion.
  const removed = [...modelFiles.filter((file) => !keep.has(file.path)), ...viteFiles];
  if (existsSync(models)) {
    if (!keys.length) rmSync(models, { recursive: true });
    else {
      for (const file of modelFiles) if (!keep.has(file.path)) rmSync(file.path);
      const removeEmpty = (dir) => {
        for (const name of readdirSync(dir)) {
          const child = join(dir, name);
          if (lstatSync(child).isDirectory()) removeEmpty(child);
        }
        if (dir !== models && !readdirSync(dir).length) rmSync(dir, { recursive: true });
      };
      removeEmpty(models);
      writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + "\n");
    }
  }
  rmSync(vite, { recursive: true, force: true });
  console.log(`Pruned ${removed.length} files, ${removed.reduce((sum, file) => sum + file.bytes, 0)} bytes; kept model keys: ${JSON.stringify(keys)}`);
}

try {
  prune(process.argv[2]);
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}
