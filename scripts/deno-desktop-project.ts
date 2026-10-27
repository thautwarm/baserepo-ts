import * as NM from "@nomake/core";
import {
  type DesktopPackageFormats,
  type DesktopPlatform,
  defaultDesktopFormat,
  desktopTarget,
} from "./desktop-platform.ts";
import type { Project } from "./project.ts";
import { tsProject } from "./ts-project.ts";

interface DesktopResources {
  directory?: NM.BuildDependency;
  files?: Record<string, NM.BuildDependency>;
  output?: string;
}

interface DenoDesktopProjectOptions {
  name: string;
  directory?: string;
  entry?: string;
  config?: string;
  toolchain?: string;
  tsconfig?: string;
  sources?: string;
  configInputs?: string[];
  dependencies?: Project[];
  resources?: DesktopResources;
  targets: readonly DesktopPlatform[];
  formats?: DesktopPackageFormats;
  architecture?: string;
  outputDirectory?: string;
  args?: string[];
  packageInputs?: () => NM.BuildDependencySugar;
}

export function denoDesktopProject({
  name,
  directory = `apps/${name}`,
  entry = `${directory}/src/main.ts`,
  config = `${directory}/deno.json`,
  toolchain = `${directory}/toolchain.json`,
  tsconfig,
  sources = `${directory}/src/**/*.ts`,
  configInputs = [],
  dependencies = [],
  resources,
  targets,
  formats = {},
  architecture = process.arch,
  outputDirectory = `artifacts/${name}`,
  args = [],
  packageInputs = () => NM.Path.glob(`${directory}/assets/**/*`, { includeDirs: false }),
}: DenoDesktopProjectOptions) {
  const checks = [...dependencies];
  let assets: NM.Target | undefined;
  if (resources) {
    const entries = Object.entries(resources.files ?? {});
    const asset = NM.target({
      name: resources.output ?? `${directory}/src/generated/assets.ts`,
      deps: {
        directory: resources.directory ? [resources.directory] : [],
        files: entries.map(([, input]) => input),
        generator: "scripts/embed-desktop-assets.ts",
        tooling: ["make.ts", "scripts/deno-desktop-project.ts", process.execPath],
      },
      async build({ deps, target }) {
        const command = [process.execPath, deps.generator, target];
        for (const input of deps.directory) command.push("--directory", input);
        for (const [index, [url]] of entries.entries()) {
          const input = deps.files[index];
          if (!input) throw new Error(`Missing resource producer for ${url}`);
          command.push("--file", url, input);
        }
        await NM.Shell.runChecked(command);
      },
    });
    assets = asset;
    checks.push({ outputs: [asset], check: asset, tests: asset });
  }
  const project = tsProject({
    name,
    type: "app",
    directory,
    tsconfig,
    sources,
    dependencies: checks,
    configInputs: [
      "packages/tsconfig/browser.json",
      "packages/tsconfig/deno.json",
      config,
      ...configInputs,
    ],
  });
  const packages = targets.map((platform) => {
    const selected = desktopTarget(platform, architecture);
    const format = formats[platform] ?? defaultDesktopFormat(platform);
    const packaged = NM.target({
      name: `${outputDirectory}/${platform}-${selected.architecture}`,
      deps: () => ({
        check: project.check,
        assets: assets ? [assets] : [],
        sources: NM.Path.glob(sources, {
          includeDirs: false,
          exclude: assets ? [assets.name] : [],
        }),
        inputs: packageInputs(),
        config,
        entry,
        toolchain,
        generator: "scripts/package-desktop.ts",
        tooling: [
          "make.ts",
          "scripts/deno-desktop-project.ts",
          "scripts/desktop-platform.ts",
          "scripts/deno.ts",
          "pnpm-lock.yaml",
          `${directory}/package.json`,
        ],
      }),
      async build({ deps, target: output }) {
        await NM.Shell.runChecked([
          process.execPath,
          deps.generator,
          deps.toolchain,
          deps.config,
          deps.entry,
          platform,
          selected.triple,
          format,
          output,
          ...args,
        ]);
      },
    });
    NM.target({ name: `package:${name}:${platform}`, virtual: true, deps: [packaged] });
    return packaged;
  });
  return { ...project, assets, packages };
}
