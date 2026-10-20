import * as NM from "@nomake/core";

export async function checkToolchains(tools: readonly string[]): Promise<void> {
  for (const tool of tools) {
    if (!(await NM.Shell.which(tool))) {
      throw new Error(
        `Missing ${tool} on PATH. Run pnpm install and invoke targets through pnpm (e.g. pnpm verify).`,
      );
    }
  }
}
