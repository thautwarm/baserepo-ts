import * as NM from "@nomake/core";
import { idrisProject } from "./scripts/idris-project.ts";
import { rustProject } from "./scripts/rust-project.ts";
import { checkToolchains } from "./scripts/toolchains.ts";
import { tsProject } from "./scripts/ts-project.ts";
import { setupWorkspace } from "./scripts/workspace.ts";

// #region Workspace

await setupWorkspace(new URL("./", import.meta.url));

// #endregion

// #region Toolchains

await checkToolchains(["tsc", "biome", "cargo", "docker"]);

// #endregion

// #region Projects

const arithmetic = rustProject({
  name: "arithmetic",
  wasm: "packages/libarithmetic/src/generated/wasm-bytes.ts",
});
const json = idrisProject({ name: "correct-json" });
const jsonTests = idrisProject({
  name: "correct-json-tests",
  dependencies: [json],
  javascript: ".nomake_files/idris-correct-json-tests/correct-json-tests.mjs",
  test: true,
});
const salutation = idrisProject({ name: "salutation", dependencies: [json] });
const salutationJs = idrisProject({
  name: "salutation-js",
  dependencies: [salutation],
  javascript: "packages/libsalutation/src/generated/salutation-js.mjs",
});
const greeting = tsProject({ name: "libgreeting", type: "library" });
const libarithmetic = tsProject({
  name: "libarithmetic",
  type: "library",
  dependencies: [arithmetic],
});
const libsalutation = tsProject({
  name: "libsalutation",
  type: "library",
  dependencies: [salutationJs],
});
const cli = tsProject({ name: "cli", type: "app", dependencies: [greeting] });
const scripts = tsProject({
  name: "scripts",
  directory: ".",
  sources: "scripts/**/*",
  tests: "scripts/**/*.test.ts",
  lintPaths: [
    "make.ts",
    "scripts",
    "package.json",
    "tsconfig.json",
    "biome.jsonc",
    "packages/tsconfig",
    "idris-workspace/toolchain.json",
  ],
});
const tsProjects = [greeting, libarithmetic, libsalutation, cli, scripts];
const projects = [...tsProjects, arithmetic, json, jsonTests, salutation, salutationJs];

// #endregion

// #region Aggregate targets

NM.target({
  name: "schema",
  virtual: true,
  deps: tsProjects.flatMap((project) => (project.schema ? [project.schema] : [])),
});

NM.target({
  name: "check",
  virtual: true,
  deps: projects.map((project) => project.check),
});

NM.target({
  name: "idd:check",
  virtual: true,
  deps: tsProjects.filter((project) => project.type === "library").map((project) => project.check),
});

NM.target({
  name: "tests",
  virtual: true,
  deps: projects.map((project) => project.tests),
});

NM.target({
  name: "lint",
  virtual: true,
  deps: tsProjects.map((project) => project.lint),
});
NM.target({ name: "verify", virtual: true, deps: ["check", "tests", "lint"] });

// #endregion

// #region Run

await NM.makefile();

// #endregion
