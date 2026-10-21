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

const pArithmetic = rustProject({
  name: "arithmetic",
  wasm: "packages/libarithmetic/src/generated/wasm-bytes.ts",
});
const pJson = idrisProject({ name: "correct-json" });
const pJsonTests = idrisProject({
  name: "correct-json-tests",
  dependencies: [pJson],
  javascript: ".nomake_files/idris-correct-json-tests/correct-json-tests.mjs",
  test: true,
});
const pSalutation = idrisProject({ name: "salutation", dependencies: [pJson] });
const pSalutationJs = idrisProject({
  name: "salutation-js",
  dependencies: [pSalutation],
  javascript: "packages/libsalutation/src/generated/salutation-js.mjs",
});
const pSalutationTypes = idrisProject({
  name: "salutation-types",
  dependencies: [pSalutation],
  typescript: {
    GreetRequest: "packages/libsalutation/src/generated/greet-request.ts",
    GreetResponse: "packages/libsalutation/src/generated/greet-response.ts",
    IntegerBatch: "packages/libsalutation/src/generated/integer-batch.ts",
    IntegerBatchNative: "packages/libsalutation/src/generated/integer-batch-native.ts",
    PublicModels: "packages/libsalutation/src/generated/public-models.ts",
  },
});
const pLibGreeting = tsProject({ name: "libgreeting", type: "library" });
const pLibArithmetic = tsProject({
  name: "libarithmetic",
  type: "library",
  dependencies: [pArithmetic],
});
const pLibSalutation = tsProject({
  name: "libsalutation",
  type: "library",
  dependencies: [pSalutationJs, pSalutationTypes],
  schemaSource: "packages/libsalutation/src/generated/public-models.ts",
});
const pCli = tsProject({ name: "cli", type: "app", dependencies: [pLibGreeting] });
const pScripts = tsProject({
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
const tsProjects = [pLibGreeting, pLibArithmetic, pLibSalutation, pCli, pScripts];
const projects = [
  ...tsProjects,
  pArithmetic,
  pJson,
  pJsonTests,
  pSalutation,
  pSalutationJs,
  pSalutationTypes,
];

// #endregion

// #region Aggregate targets

NM.target({
  name: "schema",
  virtual: true,
  deps: tsProjects.flatMap((p) => (p.schema ? [p.schema] : [])),
});

NM.target({
  name: "check",
  virtual: true,
  deps: projects.map((p) => p.check),
});

NM.target({
  name: "idd:check",
  virtual: true,
  deps: tsProjects.filter((p) => p.type === "library").map((p) => p.check),
});

NM.target({
  name: "tests",
  virtual: true,
  deps: projects.map((p) => p.tests),
});

NM.target({
  name: "lint",
  virtual: true,
  deps: tsProjects.map((p) => p.lint),
});
NM.target({ name: "verify", virtual: true, deps: ["check", "tests", "lint"] });

// #endregion

// #region Run

await NM.makefile();

// #endregion
