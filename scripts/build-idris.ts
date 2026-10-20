import { copyFile, mkdir } from "node:fs/promises";
import { dirname } from "node:path";
import * as NM from "@nomake/core";

const [name, output, ...extra] = process.argv.slice(2);
if (!name || !output || extra.length > 0) {
  throw new Error("Usage: node scripts/build-idris.ts <package> <output>");
}

await NM.Shell.runChecked([
  process.execPath,
  "scripts/idris.ts",
  "pack",
  "--cg",
  "javascript",
  "build",
  name,
]);
await mkdir(dirname(output), { recursive: true });
await copyFile(`idris-workspace/${name}/build/exec/${name}.mjs`, output);
