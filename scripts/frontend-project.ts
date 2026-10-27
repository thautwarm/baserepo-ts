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
  const project = tsProject({
    name,
    type: "app",
    dependencies,
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
