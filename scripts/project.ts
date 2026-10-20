import { existsSync } from "node:fs";
import * as NM from "@nomake/core";
import { lintTarget } from "./lint.ts";

interface ProjectOptions {
  name: string;
  type?: "app" | "library";
  dependencies?: Project[];
  directory?: string;
  sources?: string;
  tests?: string;
  lintPaths?: string[];
}

export interface Project {
  type?: "app" | "library";
  schema?: NM.Target;
  check: NM.Target;
  tests: NM.Target;
  lint: NM.Target;
}

const toolchain = [
  "make.ts",
  "scripts/project.ts",
  "package.json",
  "pnpm-lock.yaml",
  "pnpm-workspace.yaml",
  process.execPath,
];
const tsconfig = ["packages/tsconfig/package.json", "packages/tsconfig/base.json"];

export function project({
  name,
  type,
  dependencies = [],
  directory = type ? `${type === "library" ? "packages" : "apps"}/${name}` : name,
  sources = `${directory}/src/**/*`,
  tests = `${directory}/src/**/*.test.ts`,
  lintPaths = [directory],
}: ProjectOptions): Project {
  const root = new NM.Path(directory);
  const config = root.join("tsconfig.json").asPosix();
  const inputs = [root.join("package.json").asPosix(), config];
  const types = root.join("src/types.ts").asPosix();

  const schema = existsSync(types)
    ? NM.target({
        name: root.join("src/schemas.ts").asPosix(),
        deps: {
          toolchain,
          generator: "scripts/schemas.ts",
          types,
        },
        async build({ deps, target }) {
          await NM.Shell.runChecked([process.execPath, deps.generator, deps.types, target]);
        },
      })
    : undefined;

  const check = NM.target({
    name: `.nomake_files/${name}/check.checked`,
    deps: () => ({
      toolchain,
      tsconfig,
      project: inputs,
      sources: NM.Path.glob(sources, {
        includeDirs: false,
        exclude: schema ? [schema.name] : [],
      }),
      schema: schema ? [schema] : [],
      dependencies: dependencies.map((project) => project.check),
    }),
    async build({ target }) {
      await NM.Shell.runChecked(["tsc", "--noEmit", "--project", config]);
      await new NM.Path(target).parent.mkdir({ parents: true, onError: "existOk" });
      await new NM.Path(target).writeText("ok\n");
    },
  });

  const test = NM.target({
    name: `.nomake_files/${name}/tests.checked`,
    deps: () => ({
      check,
      dependencies: dependencies.map((project) => project.tests),
      files: NM.Path.glob(tests, { includeDirs: false }),
    }),
    async build({ deps, target }) {
      if (deps.files.length > 0) {
        await NM.Shell.runChecked(
          [
            process.execPath,
            "--test",
            ...deps.files.map((file) => new NM.Path(file).abs().asOsPath()),
          ],
          { cwd: directory },
        );
      }
      await new NM.Path(target).parent.mkdir({ parents: true, onError: "existOk" });
      await new NM.Path(target).writeText("ok\n");
    },
  });

  const lint = lintTarget({ name, paths: lintPaths });

  NM.target({ name: `check:${name}`, virtual: true, deps: [check] });
  NM.target({ name: `test:${name}`, virtual: true, deps: [test] });
  NM.target({ name: `lint:${name}`, virtual: true, deps: [lint] });

  return { type, schema, check, tests: test, lint };
}
