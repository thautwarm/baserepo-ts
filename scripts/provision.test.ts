import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { copyFile, mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

async function fixture() {
  const root = await mkdtemp(join(tmpdir(), "ts-template-provision-"));
  for (const path of ["scripts", "packages/libhello/src", "packages/tsconfig", "apps/cli"]) {
    await mkdir(join(root, path), { recursive: true });
  }
  await copyFile(new URL("./provision.ts", import.meta.url), join(root, "scripts/provision.ts"));
  await writeFile(
    join(root, "package.json"),
    JSON.stringify({
      name: "starter-template",
      type: "module",
      template: { scope: "@starter" },
      devDependencies: { "@starter/tsconfig": "workspace:*" },
    }),
  );
  for (const [path, name] of [
    ["packages/libhello", "libhello"],
    ["packages/tsconfig", "tsconfig"],
    ["apps/cli", "cli"],
  ] as const) {
    await writeFile(join(root, path, "package.json"), JSON.stringify({ name: `@starter/${name}` }));
  }
  await writeFile(
    join(root, "packages/libhello/src/index.ts"),
    'import type { API } from "@starter/libhello/types";\nimport "@starter/libhello-extra";\nimport "@starter/external";\n',
  );
  await writeFile(join(root, "tsconfig.json"), '{"extends":"@starter/tsconfig/base.json"}\n');
  await writeFile(
    join(root, "pnpm-lock.yaml"),
    'dependencies:\n  "@starter/libhello": workspace:*\n',
  );
  await writeFile(join(root, "README.md"), "# Starter\n\nTemplate documentation.\n");
  await writeFile(
    join(root, "AGENTS.md"),
    [
      "# Project conventions",
      "",
      "<!-- template-only:start -->",
      "## Template and provisioning",
      "",
      "This repository is a project template.",
      "<!-- template-only:end -->",
      "",
      "## Workspace roles",
      "",
      'Use "@starter/libhello" and keep these project conventions.',
      "",
    ].join("\n"),
  );
  return {
    root,
    run: (...args: string[]) =>
      spawnSync(process.execPath, [join(root, "scripts/provision.ts"), ...args], {
        encoding: "utf8",
      }),
  };
}

test("provision renames local package references and lockfile; reruns are idempotent", async () => {
  const { root, run } = await fixture();
  try {
    const first = run("my-project");
    assert.equal(first.status, 0, first.stderr);
    const manifest = JSON.parse(await readFile(join(root, "package.json"), "utf8"));
    assert.equal(manifest.name, "my-project");
    assert.equal(manifest.template.scope, "@my-project");
    assert.equal(manifest.devDependencies["@my-project/tsconfig"], "workspace:*");
    const source = await readFile(join(root, "packages/libhello/src/index.ts"), "utf8");
    assert.match(source, /@my-project\/libhello\/types/);
    assert.match(source, /@starter\/libhello-extra/);
    assert.match(source, /@starter\/external/);
    assert.match(await readFile(join(root, "pnpm-lock.yaml"), "utf8"), /@my-project\/libhello/);
    assert.match(await readFile(join(root, "tsconfig.json"), "utf8"), /@my-project\/tsconfig/);
    assert.match(await readFile(join(root, "README.md"), "utf8"), /^# my-project\n/);
    const agentsPath = join(root, "AGENTS.md");
    const agents = await readFile(agentsPath, "utf8");
    assert.doesNotMatch(agents, /Template and provisioning|project template|template-only/);
    assert.match(agents, /^# Project conventions\n\n## Workspace roles\n/);
    assert.match(agents, /Use "@my-project\/libhello" and keep these project conventions\./);
    const second = run("my-project");
    assert.equal(second.status, 0, second.stderr);
    assert.match(second.stdout, /updated 0 files/);
    assert.equal(await readFile(agentsPath, "utf8"), agents);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("provision accepts a separate scope and can rename an already provisioned project", async () => {
  const { root, run } = await fixture();
  try {
    assert.equal(run("my-project", "--scope", "@acme").status, 0);
    const next = run("next-project", "--scope", "next-team");
    assert.equal(next.status, 0, next.stderr);
    const manifest = JSON.parse(
      await readFile(join(root, "packages/libhello/package.json"), "utf8"),
    );
    assert.equal(manifest.name, "@next-team/libhello");
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("invalid provision arguments leave the template unchanged", async () => {
  const { root, run } = await fixture();
  try {
    const path = join(root, "package.json");
    const original = await readFile(path, "utf8");
    for (const args of [
      ["../escape"],
      ["Valid"],
      ["valid", "--scope"],
      ["valid", "--scope", "../escape"],
      ["valid", "--unknown"],
    ]) {
      assert.notEqual(run(...args).status, 0);
      assert.equal(await readFile(path, "utf8"), original);
    }
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("unmatched template-only markers fail before changing any files", async () => {
  const { root, run } = await fixture();
  try {
    const manifestPath = join(root, "package.json");
    const manifest = await readFile(manifestPath, "utf8");
    const agentsPath = join(root, "AGENTS.md");
    const agents = "# Conventions\n\n<!-- template-only:start -->\nUnclosed block.\n";
    await writeFile(agentsPath, agents);
    const result = run("my-project");
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /unmatched template-only markers/);
    assert.equal(await readFile(manifestPath, "utf8"), manifest);
    assert.equal(await readFile(agentsPath, "utf8"), agents);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
