import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import * as NM from "@nomake/core";

export async function setupWorkspace(start: URL): Promise<void> {
  let root = new NM.Path(resolve(fileURLToPath(start)));
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
}
