import * as NM from "@nomake/core";
import type { Project } from "./project.ts";

interface IdrisProjectOptions {
  name: string;
  dependencies?: Project[];
  javascript?: string;
  typescript?: Record<string, string>;
  test?: boolean;
}

export function idrisProject({
  name,
  dependencies = [],
  javascript,
  typescript,
  test = false,
}: IdrisProjectOptions): Project {
  if (test && !javascript) throw new Error(`Idris test ${name} needs a JavaScript executable`);
  const executable = javascript ?? (typescript && `.nomake_files/idris-${name}/${name}.mjs`);
  const compiled = NM.target({
    name: executable ?? `.nomake_files/idris-${name}/check.checked`,
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
      if (executable) {
        await NM.Shell.runChecked([process.execPath, deps.generator, name, target]);
      } else {
        await NM.Shell.runChecked([process.execPath, "scripts/idris.ts", "pack", "install", name]);
        const stamp = new NM.Path(target);
        await stamp.parent.mkdir({ parents: true, onError: "existOk" });
        await stamp.writeText("ok\n");
      }
    },
  });

  const outputs = typescript
    ? Object.entries(typescript).map(([root, output]) =>
        NM.target({
          name: output,
          deps: { generator: compiled },
          async build({ deps, target }) {
            const source = await NM.Shell.runChecked([process.execPath, deps.generator, root], {
              stdout: "capture",
            });
            const file = new NM.Path(target);
            await file.parent.mkdir({ parents: true, onError: "existOk" });
            await file.writeText(`${source.trimEnd()}\n`);
          },
        }),
      )
    : javascript
      ? [compiled]
      : [];
  const check = typescript
    ? NM.target({ name: `typescript:idris:${name}`, virtual: true, deps: outputs })
    : compiled;

  const tests = test
    ? NM.target({
        name: `.nomake_files/idris-${name}/tests.checked`,
        deps: { executable: check, dependencies: dependencies.map((project) => project.tests) },
        async build({ deps, target }) {
          await NM.Shell.runChecked([process.execPath, deps.executable]);
          const stamp = new NM.Path(target);
          await stamp.parent.mkdir({ parents: true, onError: "existOk" });
          await stamp.writeText("ok\n");
        },
      })
    : NM.target({
        name: `test:idris:${name}`,
        virtual: true,
        deps: [check, ...dependencies.map((project) => project.tests)],
      });
  if (test) NM.target({ name: `test:idris:${name}`, virtual: true, deps: [tests] });
  NM.target({ name: `idris:${name}`, virtual: true, deps: [check] });
  NM.target({ name: `check:idris:${name}`, virtual: true, deps: [check] });
  return { outputs, check, tests };
}
