import { access, mkdir, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import * as NM from "@nomake/core";
import toolchain from "../idris-workspace/toolchain.json" with { type: "json" };

const command = process.argv.slice(2);
if (command.length === 0) throw new Error("Usage: node scripts/idris.ts <command> [args...]");

const root = fileURLToPath(new URL("../", import.meta.url));
const home = new URL("../.nomake_files/idris-home/", import.meta.url);
const marker = new URL(".seeded", home);
const user = process.getuid?.();
const userArgs = user === undefined ? [] : ["--user", `${user}:${process.getgid?.() ?? user}`];

// Run as the host user so build output written through the bind mount stays
// owned by the host and can be cleaned up without sudo. The image keeps pack's
// source cache, collection metadata, and installed libraries in its home; copy
// that into a persistent host directory on first use so the compiler and common
// libraries are not rebuilt on every run. The image index is multi-arch, so
// Docker selects the platform matching the host.
await mkdir(home, { recursive: true });
try {
  await access(marker);
} catch {
  await NM.Shell.runChecked([
    "docker",
    "run",
    "--rm",
    ...userArgs,
    "--entrypoint",
    "bash",
    "--mount",
    `type=bind,source=${fileURLToPath(home)},target=/seed`,
    toolchain.image,
    "-lc",
    "cp -r /home/vscode/. /seed/",
  ]);
  await writeFile(marker, "");
}

await NM.Shell.runChecked([
  "docker",
  "run",
  "--rm",
  ...userArgs,
  "--env",
  "HOME=/home/vscode",
  "--mount",
  `type=bind,source=${root},target=/work`,
  "--mount",
  `type=bind,source=${fileURLToPath(home)},target=/home/vscode`,
  "--workdir",
  "/work/idris-workspace",
  "--entrypoint",
  "bash",
  toolchain.image,
  "-lc",
  'exec "$@"',
  "--",
  ...command,
]);
