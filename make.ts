import { fileURLToPath } from "node:url";
import * as NM from "@nomake/core";
import { project } from "./scripts/project.ts";

// ====== Workspace ======

let root = new NM.Path(fileURLToPath(new URL("./", import.meta.url))).abs();
while (!(await root.join("pnpm-workspace.yaml").exists())) {
  const parent = root.parent;
  if (parent.asOsPath() === root.asOsPath()) {
    throw new Error("pnpm-workspace.yaml not found");
  }
  root = parent;
}

const workspace = root.asOsPath();
if (process.env.NOMAKE_RUNNING_PROJECT === workspace) {
  throw new Error("nomake 嵌套重入");
}
process.env.NOMAKE_RUNNING_PROJECT = workspace;
process.chdir(workspace);

// ====== Toolchains ======

for (const tool of ["tsc", "biome"]) {
  if (!(await NM.Shell.which(tool))) {
    throw new Error(
      `Missing ${tool} on PATH. Run pnpm install and invoke targets through pnpm (e.g. pnpm verify).`,
    );
  }
}

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
