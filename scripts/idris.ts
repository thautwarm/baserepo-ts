import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";
import * as NM from "@nomake/core";
import toolchain from "../idris-workspace/toolchain.json" with { type: "json" };

const command = process.argv.slice(2);
if (command.length === 0) throw new Error("Usage: node scripts/idris.ts <command> [args...]");

const root = fileURLToPath(new URL("../", import.meta.url));
const cache = `idris-${createHash("sha256").update(root).update(toolchain.image).digest("hex").slice(0, 12)}`;

await NM.Shell.runChecked([
  "docker",
  "run",
  "--rm",
  "--platform",
  toolchain.platform,
  "--mount",
  `type=bind,source=${root},target=/work`,
  "--mount",
  `type=volume,source=${cache},target=/home/vscode/.local/state/pack/install`,
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
