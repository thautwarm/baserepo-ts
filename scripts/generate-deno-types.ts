import { execFileSync } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { requireDenoVersion } from "./deno.ts";

const [toolchain, output, ...extra] = process.argv.slice(2);
if (!toolchain || !output || extra.length)
  throw new Error("Expected <toolchain.json> <output-dir>");
const version = requireDenoVersion(toolchain);
const runtime = execFileSync("deno", ["types"], { encoding: "utf8" });
const source = `https://raw.githubusercontent.com/denoland/deno/v${version}/cli/tsc/dts/lib.deno.desktop.d.ts`;
const response = await fetch(source);
if (!response.ok) throw new Error(`Desktop declarations: HTTP ${response.status} from ${source}`);
const desktop = (await response.text()).replace(/^\/\/\/ <reference[^\n]*\n/gm, "");
if (!desktop.includes("class BrowserWindow")) throw new Error("Missing desktop API declarations");
await mkdir(output, { recursive: true });
await writeFile(join(output, "deno.d.ts"), runtime);
await writeFile(
  join(output, "desktop.d.ts"),
  `// Generated from ${source}; do not edit.\n${desktop}`,
);
