import * as NM from "@nomake/core";
import type { Project } from "./project.ts";

export function denoTypesProject(toolchain: string): Project {
  const generated = NM.target({
    name: "packages/deno-types/src/generated",
    deps: {
      toolchain,
      generator: "scripts/generate-deno-types.ts",
      runtime: "scripts/deno.ts",
      manifest: "packages/deno-types/package.json",
      tooling: ["make.ts", "scripts/deno-types-project.ts", process.execPath],
    },
    async build({ deps, target }) {
      await NM.Shell.runChecked([process.execPath, deps.generator, deps.toolchain, target]);
    },
  });
  NM.target({ name: "deno:types", virtual: true, deps: [generated] });
  return { outputs: [generated], check: generated, tests: generated };
}
