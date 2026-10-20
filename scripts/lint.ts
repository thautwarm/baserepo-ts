import * as NM from "@nomake/core";

interface LintOptions {
  name: string;
  paths: string[];
}

// Biome 2.5.15 has no persistent CLI result cache.
export function lintTarget({ name, paths }: LintOptions): NM.Target {
  return NM.target({
    name: `.nomake_files/${name}/lint.checked`,
    deps: () => ({
      toolchain: [
        "make.ts",
        "scripts/project.ts",
        "scripts/ts-project.ts",
        "scripts/lint.ts",
        "package.json",
        "pnpm-lock.yaml",
        "pnpm-workspace.yaml",
        process.execPath,
      ],
      config: ["biome.jsonc", ".gitignore"],
      files: lintInputs(paths),
    }),
    async build({ target }) {
      await NM.Shell.runChecked(["biome", "check", ...paths]);
      await new NM.Path(target).parent.mkdir({ parents: true, onError: "existOk" });
      await new NM.Path(target).writeText("ok\n");
    },
  });
}

async function* lintInputs(paths: string[]) {
  for (const path of paths) {
    if (await new NM.Path(path).isDir()) {
      yield* NM.Path.glob(`${path}/**/*`, {
        includeDirs: false,
        exclude: [
          "**/node_modules/**",
          "apps/*/src/schemas.ts",
          "packages/*/src/schemas.ts",
          "**/src/generated/**",
        ],
      });
    } else {
      yield path;
    }
  }
}
