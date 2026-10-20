import * as NM from "@nomake/core";
import type { Project } from "./project.ts";

interface RustProjectOptions {
  name: string;
  wasm: string;
  dependencies?: Project[];
}

export function rustProject({ name, wasm, dependencies = [] }: RustProjectOptions): Project {
  const inputs = () => ({
    tooling: [
      "make.ts",
      "scripts/project.ts",
      "scripts/rust-project.ts",
      "package.json",
      "pnpm-lock.yaml",
    ],
    config: [
      "rust-workspace/Cargo.toml",
      "rust-workspace/Cargo.lock",
      "rust-workspace/rust-toolchain.toml",
      `rust-workspace/${name}/Cargo.toml`,
    ],
    sources: NM.Path.glob(`rust-workspace/${name}/src/**/*.rs`, { includeDirs: false }),
    dependencies: dependencies.map((project) => project.check),
  });

  const check = NM.target({
    name: wasm,
    deps: () => ({ ...inputs(), generator: "scripts/build-rust-wasm.ts" }),
    async build({ deps, target }) {
      await NM.Shell.runChecked([process.execPath, deps.generator, name, target]);
    },
  });

  const tests = NM.target({
    name: `.nomake_files/rust-${name}/tests.checked`,
    deps: () => ({
      ...inputs(),
      tests: dependencies.map((project) => project.tests),
    }),
    async build({ target }) {
      await NM.Shell.runChecked(["cargo", "test", "--locked", "-p", name], {
        cwd: "rust-workspace",
      });
      const stamp = new NM.Path(target);
      await stamp.parent.mkdir({ parents: true, onError: "existOk" });
      await stamp.writeText("ok\n");
    },
  });

  NM.target({ name: `wasm:${name}`, virtual: true, deps: [check] });
  NM.target({ name: `check:rust:${name}`, virtual: true, deps: [check] });
  NM.target({ name: `test:rust:${name}`, virtual: true, deps: [tests] });
  return { outputs: [check], check, tests };
}
