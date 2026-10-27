import * as NM from "@nomake/core";
import { desktopPlatforms, desktopTarget } from "./desktop-platform.ts";
import type { Project } from "./project.ts";
import { tsProject } from "./ts-project.ts";

interface DesktopProjectOptions {
  name: string;
  frontend: NM.Target;
  dependencies: Project[];
}

export function desktopProject({ name, frontend, dependencies }: DesktopProjectOptions) {
  const directory = `apps/${name}`;
  const assets = NM.target({
    name: `${directory}/src/generated/assets.ts`,
    deps: {
      frontend,
      icon: `${directory}/assets/icon.png`,
      generator: "scripts/embed-desktop-assets.ts",
      tooling: ["make.ts", "scripts/desktop-project.ts", process.execPath],
    },
    async build({ deps, target }) {
      await NM.Shell.runChecked([
        process.execPath,
        deps.generator,
        deps.frontend,
        deps.icon,
        target,
      ]);
    },
  });
  const resources: Project = { outputs: [assets], check: assets, tests: assets };
  const project = tsProject({
    name,
    type: "app",
    dependencies: [...dependencies, resources],
    configInputs: [
      "packages/tsconfig/browser.json",
      "packages/tsconfig/deno.json",
      `${directory}/deno.json`,
    ],
  });
  const packages = desktopPlatforms.map((platform) => {
    const { architecture, triple } = desktopTarget(platform, process.arch);
    const packaged = NM.target({
      name: `artifacts/${name}/${platform}-${architecture}`,
      deps: () => ({
        check: project.check,
        assets,
        sources: NM.Path.glob(`${directory}/src/**/*.ts`, {
          includeDirs: false,
          exclude: [assets.name],
        }),
        icons: NM.Path.glob(`${directory}/assets/**/*`, { includeDirs: false }),
        config: `${directory}/deno.json`,
        entry: `${directory}/src/main.ts`,
        toolchain: `${directory}/toolchain.json`,
        generator: "scripts/package-desktop.ts",
        tooling: [
          "make.ts",
          "scripts/desktop-project.ts",
          "scripts/desktop-platform.ts",
          "scripts/deno.ts",
          "pnpm-lock.yaml",
          `${directory}/package.json`,
        ],
      }),
      async build({ deps, target }) {
        await NM.Shell.runChecked([
          process.execPath,
          deps.generator,
          deps.toolchain,
          deps.config,
          deps.entry,
          platform,
          triple,
          target,
        ]);
      },
    });
    NM.target({ name: `package:${name}:${platform}`, virtual: true, deps: [packaged] });
    return packaged;
  });
  return { ...project, assets, packages };
}
