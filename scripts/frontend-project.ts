import * as NM from "@nomake/core";
import type { Project } from "./project.ts";
import { tsProject } from "./ts-project.ts";

export function frontendProject({
  name,
  dependencies = [],
}: {
  name: string;
  dependencies?: Project[];
}) {
  const directory = `apps/${name}`;
  const configCheck = NM.target({
    name: `.nomake_files/${name}/config.checked`,
    deps: {
      config: `${directory}/tsconfig.node.json`,
      source: `${directory}/vite.config.ts`,
      tooling: [
        "make.ts",
        "scripts/frontend-project.ts",
        "package.json",
        "pnpm-workspace.yaml",
        "packages/tsconfig/package.json",
        "packages/tsconfig/base.json",
        `${directory}/package.json`,
        "pnpm-lock.yaml",
        process.execPath,
      ],
    },
    async build({ deps, target }) {
      await NM.Shell.runChecked(["tsc", "--noEmit", "--project", deps.config]);
      const stamp = new NM.Path(target);
      await stamp.parent.mkdir({ parents: true, onError: "existOk" });
      await stamp.writeText("ok\n");
    },
  });
  const tooling: Project = { outputs: [], check: configCheck, tests: configCheck };
  const project = tsProject({
    name,
    type: "app",
    dependencies: [...dependencies, tooling],
    configInputs: ["packages/tsconfig/browser.json"],
  });
  const build = NM.target({
    name: `${directory}/dist`,
    deps: () => ({
      check: project.check,
      sources: NM.Path.glob(`${directory}/src/**/*`, { includeDirs: false }),
      html: `${directory}/index.html`,
      config: [`${directory}/package.json`, `${directory}/tsconfig.json`],
      public: NM.Path.glob(`${directory}/public/**/*`, { includeDirs: false }),
      vite: NM.Path.glob(`${directory}/vite.config.*`, { includeDirs: false }),
      tooling: ["make.ts", "scripts/frontend-project.ts", "pnpm-lock.yaml"],
    }),
    async build() {
      await NM.Shell.runChecked(["pnpm", "exec", "vite", "build"], { cwd: directory });
    },
  });
  NM.target({ name: `build:${name}`, virtual: true, deps: [build] });
  return { ...project, build };
}
