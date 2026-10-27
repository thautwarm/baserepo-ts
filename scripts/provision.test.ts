import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { copyFile, mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

const appEntries = [
  { name: "desktop", entry: "main.ts", source: 'import "@starter/libhello";\n' },
  {
    name: "frontend",
    entry: "main.tsx",
    source: 'import "@starter/libhello";\nexport const title = <h1>Starter</h1>;\n',
  },
] as const;

async function fixture() {
  const root = await mkdtemp(join(tmpdir(), "ts-template-provision-"));
  for (const path of [
    "scripts",
    "packages/libhello/src",
    "packages/tsconfig",
    "apps/cli",
    "apps/desktop/src",
    "apps/frontend/src",
    "artifacts",
  ]) {
    await mkdir(join(root, path), { recursive: true });
  }
  await copyFile(new URL("./provision.ts", import.meta.url), join(root, "scripts/provision.ts"));
  await writeFile(join(root, "scripts/provision.test.ts"), "// template test placeholder\n");
  await writeFile(
    join(root, "package.json"),
    JSON.stringify({
      name: "starter-template",
      type: "module",
      template: { scope: "@starter" },
      scripts: { provision: "node scripts/provision.ts", verify: "node make.ts verify" },
      devDependencies: { "@starter/tsconfig": "workspace:*" },
    }),
  );
  for (const [path, name] of [
    ["packages/libhello", "libhello"],
    ["packages/tsconfig", "tsconfig"],
    ["apps/cli", "cli"],
    ["apps/desktop", "desktop"],
    ["apps/frontend", "frontend"],
  ] as const) {
    await writeFile(
      join(root, path, "package.json"),
      JSON.stringify({
        name: `@starter/${name}`,
        dependencies: { "@starter/libhello": "workspace:*" },
      }),
    );
  }
  await writeFile(
    join(root, "apps/desktop/deno.json"),
    JSON.stringify({
      desktop: { app: { name: "starter-template", identifier: "com.example.starter-template" } },
      nodeModulesDir: "manual",
    }),
  );
  for (const app of appEntries)
    await writeFile(join(root, `apps/${app.name}/src/${app.entry}`), app.source);
  await writeFile(join(root, "artifacts/snapshot.json"), '"@starter/libhello"\n');
  await writeFile(
    join(root, "packages/libhello/src/index.ts"),
    'import type { API } from "@starter/libhello/types";\nimport "@starter/libhello-extra";\nimport "@starter/external";\n',
  );
  await writeFile(join(root, "tsconfig.json"), '{"extends":"@starter/tsconfig/base.json"}\n');
  await writeFile(
    join(root, "pnpm-lock.yaml"),
    'dependencies:\n  "@starter/libhello": workspace:*\n',
  );
  await writeFile(
    join(root, "README.md"),
    [
      "# Starter",
      "",
      "<!-- template-only:start -->",
      "Template documentation.",
      "<!-- template-only:end -->",
      "",
      "pnpm provision starter",
      "pnpm install",
      "",
    ].join("\n"),
  );
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

test("provision renames local package references; successful runs remove the tooling", async () => {
  const { root, run } = await fixture();
  try {
    const result = run("my-project");
    assert.equal(result.status, 0, result.stderr);
    const manifest = JSON.parse(await readFile(join(root, "package.json"), "utf8"));
    assert.equal(manifest.name, "my-project");
    assert.equal(manifest.template, undefined);
    assert.equal(manifest.scripts?.provision, undefined);
    assert.equal(manifest.scripts?.verify, "node make.ts verify");
    assert.equal(manifest.devDependencies["@my-project/tsconfig"], "workspace:*");
    const source = await readFile(join(root, "packages/libhello/src/index.ts"), "utf8");
    assert.match(source, /@my-project\/libhello\/types/);
    assert.match(source, /@starter\/libhello-extra/);
    assert.match(source, /@starter\/external/);
    assert.match(await readFile(join(root, "pnpm-lock.yaml"), "utf8"), /@my-project\/libhello/);
    assert.match(await readFile(join(root, "tsconfig.json"), "utf8"), /@my-project\/tsconfig/);
    for (const app of appEntries) {
      const child = JSON.parse(await readFile(join(root, `apps/${app.name}/package.json`), "utf8"));
      assert.equal(child.name, `@my-project/${app.name}`);
      assert.equal(child.dependencies["@my-project/libhello"], "workspace:*");
      assert.match(
        await readFile(join(root, `apps/${app.name}/src/${app.entry}`), "utf8"),
        /@my-project\/libhello/,
      );
    }
    assert.match(
      await readFile(join(root, "apps/frontend/src/main.tsx"), "utf8"),
      /<h1>Starter<\/h1>/,
    );
    const desktop = JSON.parse(await readFile(join(root, "apps/desktop/deno.json"), "utf8"));
    assert.equal(desktop.desktop.app.name, "my-project");
    assert.equal(desktop.desktop.app.identifier, "com.example.my-project");
    assert.equal(desktop.nodeModulesDir, "manual");
    assert.equal(
      await readFile(join(root, "artifacts/snapshot.json"), "utf8"),
      '"@starter/libhello"\n',
    );
    assert.equal(await readFile(join(root, "README.md"), "utf8"), "# my-project\n\npnpm install\n");
    const agents = await readFile(join(root, "AGENTS.md"), "utf8");
    assert.doesNotMatch(agents, /Template and provisioning|project template|template-only/);
    assert.match(agents, /^# Project conventions\n\n## Workspace roles\n/);
    assert.match(agents, /Use "@my-project\/libhello" and keep these project conventions\./);
    assert.match(result.stdout, /Removed template-only provisioning tooling/);
    await assert.rejects(readFile(join(root, "scripts/provision.ts")), { code: "ENOENT" });
    await assert.rejects(readFile(join(root, "scripts/provision.test.ts")), { code: "ENOENT" });
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("provision keeps the tooling, reruns idempotently, and renames with --keep-tooling", async () => {
  const { root, run } = await fixture();
  try {
    const first = run("my-project", "--scope", "@acme", "--keep-tooling");
    assert.equal(first.status, 0, first.stderr);
    const manifest = JSON.parse(await readFile(join(root, "package.json"), "utf8"));
    assert.equal(manifest.template.scope, "@acme");
    assert.equal(manifest.scripts.provision, "node scripts/provision.ts");
    assert.doesNotMatch(first.stdout, /Removed template-only provisioning tooling/);
    const agentsPath = join(root, "AGENTS.md");
    const agents = await readFile(agentsPath, "utf8");
    const second = run("my-project", "--scope", "@acme", "--keep-tooling");
    assert.equal(second.status, 0, second.stderr);
    assert.match(second.stdout, /updated 0 files/);
    assert.equal(await readFile(agentsPath, "utf8"), agents);
    const next = run("next-project", "--scope", "next-team", "--keep-tooling");
    assert.equal(next.status, 0, next.stderr);
    const child = JSON.parse(await readFile(join(root, "packages/libhello/package.json"), "utf8"));
    assert.equal(child.name, "@next-team/libhello");
    const desktop = JSON.parse(await readFile(join(root, "apps/desktop/deno.json"), "utf8"));
    assert.equal(desktop.desktop.app.name, "next-project");
    assert.equal(desktop.desktop.app.identifier, "com.example.next-project");
    await readFile(join(root, "scripts/provision.ts"), "utf8");
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("provision preserves a customized desktop identity", async () => {
  const { root, run } = await fixture();
  try {
    const path = join(root, "apps/desktop/deno.json");
    await writeFile(
      path,
      JSON.stringify({ desktop: { app: { name: "custom-app", identifier: "org.custom.app" } } }),
    );
    const result = run("my-project");
    assert.equal(result.status, 0, result.stderr);
    const config = JSON.parse(await readFile(path, "utf8"));
    assert.equal(config.desktop.app.name, "custom-app");
    assert.equal(config.desktop.app.identifier, "org.custom.app");
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
      ["Valid", "--keep-tooling"],
      ["valid", "--scope"],
      ["valid", "--scope", "../escape"],
      ["valid", "--unknown"],
    ]) {
      assert.notEqual(run(...args).status, 0);
      assert.equal(await readFile(path, "utf8"), original);
    }
    await readFile(join(root, "scripts/provision.ts"), "utf8");
    await readFile(join(root, "scripts/provision.test.ts"), "utf8");
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
    await readFile(join(root, "scripts/provision.ts"), "utf8");
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
