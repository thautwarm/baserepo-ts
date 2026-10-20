import { readFile, readdir, writeFile } from "node:fs/promises";
import { extname } from "node:path";
import { fileURLToPath } from "node:url";

const args = process.argv.slice(2);
if (args[0] === "--help") {
  console.log("Usage: pnpm provision <project-name> [--scope <scope>]");
  process.exit(0);
}
const name = args[0];
const scopeOption = args[1] === "--scope" && args.length === 3 ? args[2] : undefined;
const validName = /^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/;
if (!name || !validName.test(name) || (args.length !== 1 && !scopeOption)) {
  throw new Error("Usage: pnpm provision <lowercase-kebab-name> [--scope <scope>]");
}
const scope = `@${(scopeOption ?? name).replace(/^@/, "")}`;
if (!validName.test(scope.slice(1))) throw new Error("Scope must be a lowercase kebab name.");

const root = new URL("../", import.meta.url);
const manifestPath = new URL("package.json", root);
const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
const oldScope = manifest.template?.scope;
if (typeof oldScope !== "string") throw new Error("Missing template.scope in root package.json.");
const replacements: [string, string][] = [];
for (const parent of ["apps", "packages"]) {
  const base = new URL(`${parent}/`, root);
  for (const directory of await readdir(base, { withFileTypes: true })) {
    if (!directory.isDirectory()) continue;
    const path = new URL(`${directory.name}/package.json`, base);
    const child = JSON.parse(await readFile(path, "utf8"));
    if (typeof child.name !== "string" || !child.name.startsWith(`${oldScope}/`)) {
      throw new Error(`Workspace package must use template scope ${oldScope}: ${path.pathname}`);
    }
    replacements.push([child.name, `${scope}/${child.name.slice(oldScope.length + 1)}`]);
  }
}

const ignored = new Set([".git", "node_modules", "dist", "target", ".pnpm-store"]);
const extensions = new Set([".json", ".jsonc", ".yaml", ".yml", ".ts", ".tsx", ".mts", ".cts", ".js", ".jsx", ".mjs", ".cjs", ".md"]);
const changes: { path: URL; text: string }[] = [];
async function collect(directory: URL): Promise<void> {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = new URL(entry.name, directory);
    if (entry.isDirectory()) {
      if (!ignored.has(entry.name)) await collect(new URL(`${entry.name}/`, directory));
    } else if (entry.isFile() && extensions.has(extname(entry.name))) {
      const original = await readFile(path, "utf8");
      let text = original;
      // Replace exact local package names and their subpaths, not unrelated
      // external packages sharing a scope or a package-name prefix.
      for (const [from, to] of replacements) {
        const escaped = from.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        text = text.replace(new RegExp(`${escaped}(?=$|[^a-zA-Z0-9._~-])`, "g"), to);
      }
      if (path.href === manifestPath.href) {
        const updated = JSON.parse(text);
        updated.name = name;
        updated.template.scope = scope;
        text = `${JSON.stringify(updated, null, 2)}\n`;
      }
      if (path.href === new URL("README.md", root).href) {
        text = text.replace(/^# .*$/m, `# ${name}`);
      }
      if (text !== original) changes.push({ path, text });
    }
  }
}
await collect(root);
for (const { path, text } of changes) await writeFile(path, text);
console.log(`Provisioned ${name} (${scope}); updated ${changes.length} files in ${fileURLToPath(root)}.`);
console.log("Run pnpm install --frozen-lockfile to refresh workspace links, then pnpm verify.");
