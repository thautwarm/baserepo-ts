import { existsSync } from "node:fs";
import { resolve } from "node:path";
import * as NM from "@nomake/core";
import type { Project } from "./project.ts";
import { tsProject } from "./ts-project.ts";

interface ReactProjectOptions {
  name: string;
  directory?: string;
  dependencies?: Project[];
  tsconfig?: string;
  sources?: string;
  output?: string;
  viteConfig?: string;
  toolingTsconfig?: string | false;
  configInputs?: string[];
  inputs?: () => NM.BuildDependencySugar;
}

export function reactProject({
  name,
  directory = `apps/${name}`,
  dependencies = [],
  tsconfig = `${directory}/tsconfig.json`,
  sources = `${directory}/src/**/*`,
  output = `${directory}/dist`,
  viteConfig,
  toolingTsconfig,
  configInputs = [],
  inputs = () => defaultInputs(directory),
}: ReactProjectOptions) {
  const checks = [...dependencies];
  if (toolingTsconfig !== false) {
    const config = toolingTsconfig ?? `${directory}/tsconfig.node.json`;
    if (toolingTsconfig !== undefined || existsSync(config)) {
      const check = NM.target({
        name: `.nomake_files/${name}/config.checked`,
        deps: () => ({
          config,
          source: viteConfig
            ? [viteConfig]
            : NM.Path.glob(`${directory}/vite.config.*`, { includeDirs: false }),
          tooling: [
            ...tooling(),
            "packages/tsconfig/package.json",
            "packages/tsconfig/base.json",
            `${directory}/package.json`,
            ...configInputs,
          ],
        }),
        async build({ deps, target }) {
          await NM.Shell.runChecked(["tsc", "--noEmit", "--project", deps.config]);
          const stamp = new NM.Path(target);
          await stamp.parent.mkdir({ parents: true, onError: "existOk" });
          await stamp.writeText("ok\n");
        },
      });
      checks.push({ outputs: [], check, tests: check });
    }
  }
  const project = tsProject({
    name,
    type: "app",
    directory,
    tsconfig,
    sources,
    dependencies: checks,
    configInputs: ["packages/tsconfig/browser.json", ...configInputs],
  });
  const build = NM.target({
    name: output,
    deps: () => ({
      check: project.check,
      sources: NM.Path.glob(sources, { includeDirs: false }),
      inputs: inputs(),
      config: [`${directory}/package.json`, tsconfig, ...(viteConfig ? [viteConfig] : [])],
      tooling: tooling(),
    }),
    async build({ target }) {
      const command = ["pnpm", "exec", "vite", "build", "--outDir", resolve(target)];
      if (viteConfig) command.push("--config", resolve(viteConfig));
      await NM.Shell.runChecked(command, { cwd: directory });
    },
  });
  NM.target({ name: `build:${name}`, virtual: true, deps: [build] });
  return { ...project, build };
}

async function* defaultInputs(directory: string) {
  yield `${directory}/index.html`;
  yield* NM.Path.glob(`${directory}/public/**/*`, { includeDirs: false });
  yield* NM.Path.glob(`${directory}/vite.config.*`, { includeDirs: false });
}

function tooling() {
  return [
    "make.ts",
    "scripts/react-project.ts",
    "package.json",
    "pnpm-workspace.yaml",
    "pnpm-lock.yaml",
    process.execPath,
  ];
}
