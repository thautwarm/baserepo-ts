import * as NM from "@nomake/core";
import { project } from "./scripts/project.ts";
import { checkToolchains } from "./scripts/toolchains.ts";
import { setupWorkspace } from "./scripts/workspace.ts";

// ====== Workspace ======

await setupWorkspace(new URL("./", import.meta.url));

// ====== Toolchains ======

await checkToolchains(["tsc", "biome"]);

// ====== Projects ======

const greeting = project({ name: "libgreeting", type: "library" });
const cli = project({ name: "cli", type: "app", dependencies: [greeting] });
const scripts = project({
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
  ],
});
const projects = [greeting, cli, scripts];

// ====== Aggregate targets ======

NM.target({
  name: "schema",
  virtual: true,
  deps: projects.flatMap((project) => (project.schema ? [project.schema] : [])),
});

NM.target({
  name: "check",
  virtual: true,
  deps: projects.map((project) => project.check),
});

NM.target({
  name: "interface:check",
  virtual: true,
  deps: projects.filter((project) => project.type === "library").map((project) => project.check),
});

NM.target({
  name: "tests",
  virtual: true,
  deps: projects.map((project) => project.tests),
});

NM.target({
  name: "lint",
  virtual: true,
  deps: projects.map((project) => project.lint),
});
NM.target({ name: "verify", virtual: true, deps: ["check", "tests", "lint"] });

// ====== Run ======

await NM.makefile();
