import * as NM from "@nomake/core";
import type { Project } from "./project.ts";

interface IdrisProjectOptions {
  name: string;
  dependencies?: Project[];
  javascript?: string;
}

export function idrisProject({
  name,
  dependencies = [],
  javascript,
}: IdrisProjectOptions): Project {
  const check = NM.target({
    name: javascript ?? `.nomake_files/idris-${name}/check.checked`,
    deps: () => ({
      tooling: [
        "make.ts",
        "scripts/project.ts",
        "scripts/idris-project.ts",
        "package.json",
        "pnpm-lock.yaml",
      ],
      generator: "scripts/build-idris.ts",
      container: ["scripts/idris.ts", "idris-workspace/toolchain.json"],
      config: "idris-workspace/pack.toml",
      manifest: `idris-workspace/${name}/${name}.ipkg`,
      sources: NM.Path.glob(`idris-workspace/${name}/src/**/*.idr`, { includeDirs: false }),
      dependencies: dependencies.map((project) => project.check),
    }),
    async build({ deps, target }) {
      if (javascript) {
        await NM.Shell.runChecked([process.execPath, deps.generator, name, target]);
      } else {
        await NM.Shell.runChecked([
          process.execPath,
          "scripts/idris.ts",
          "pack",
          "typecheck",
          name,
        ]);
        const stamp = new NM.Path(target);
        await stamp.parent.mkdir({ parents: true, onError: "existOk" });
        await stamp.writeText("ok\n");
      }
    },
  });

  const tests = NM.target({
    name: `test:idris:${name}`,
    virtual: true,
    deps: [check, ...dependencies.map((project) => project.tests)],
  });
  NM.target({ name: `idris:${name}`, virtual: true, deps: [check] });
  NM.target({ name: `check:idris:${name}`, virtual: true, deps: [check] });
  return { outputs: javascript ? [check] : [], check, tests };
}
