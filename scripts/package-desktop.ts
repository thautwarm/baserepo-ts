import { execFileSync } from "node:child_process";
import { mkdir, readdir, readFile, stat, writeFile } from "node:fs/promises";
import { basename, dirname, join, relative, resolve } from "node:path";
import { requireDenoVersion } from "./deno.ts";
import { desktopFilenames, parseDesktopPlatform } from "./desktop-platform.ts";

const [toolchain, config, entry, platformArgument, target, output, ...extra] =
  process.argv.slice(2);
const platform = parseDesktopPlatform(platformArgument);
if (!toolchain || !config || !entry || !output || !target || extra.length)
  throw new Error(
    "Expected <toolchain.json> <deno.json> <entry.ts> <macos|windows|linux> <target> <output-dir>",
  );
const version = requireDenoVersion(toolchain);
const { desktop } = JSON.parse(await readFile(config, "utf8"));
const name = desktop?.app?.name;
if (typeof name !== "string" || !name || name === "." || name === ".." || /[/\\\0]/.test(name))
  throw new Error("Desktop app name must be a nonempty filename component");
const cwd = dirname(resolve(config));
const folder = resolve(output);
await mkdir(folder, { recursive: true });
const filenames = desktopFilenames(platform, name);
const destination = join(folder, filenames.output);
const artifact = join(folder, filenames.artifact);
const args = [
  "desktop",
  "--config",
  basename(config),
  "--no-check",
  "--allow-net=127.0.0.1",
  "--allow-run",
  "--target",
  target,
  "--output",
  destination,
  relative(cwd, resolve(entry)),
];
// Select the target's icon explicitly when cross-compiling.
const icon = desktop.app.icons?.[platform];
if (typeof icon === "string") args.push("--icon", icon);
execFileSync("deno", args, { cwd, stdio: "inherit" });
const result = { version, target, artifact, bytes: await treeBytes(artifact) };
await writeFile(join(folder, "build-result.json"), `${JSON.stringify(result, null, 2)}\n`);
console.log(JSON.stringify(result, null, 2));

async function treeBytes(path: string): Promise<number> {
  const info = await stat(path);
  if (!info.isDirectory()) return info.size;
  const sizes = await Promise.all((await readdir(path)).map((item) => treeBytes(join(path, item))));
  return sizes.reduce((sum, size) => sum + size, 0);
}
