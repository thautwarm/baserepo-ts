---
name: integrate-deno-desktop
description: Add a Deno desktop application to this TypeScript workspace, including a web frontend, native tray or window, embedded assets, and platform packaging. Use when integrating or changing the desktop build and runtime boundary.
---

# integrate-deno-desktop

Use this skill for Deno desktop integration work. For the included starter apps,
read [starter](references/starter.md). In a provisioned project, inspect the current
app manifests and `make.ts`; app names, locations and build targets may have changed.

## start-from-the-workspace

For a new project, clone the complete template into the requested workspace, run
its provisioning command, then install with `pnpm install --frozen-lockfile`.
Use the existing package scope when extending an already provisioned project.
Preserve the template's build helpers, skills and unrelated examples; do not
recreate selected template files by hand.

Check the selected Deno release's desktop APIs and backend availability. Record
the Deno version used for declarations, builds and validation, including any
experimental status reported by its CLI. Install frontend
and bundler dependencies only when needed, using the workspace's pinned versions
or locking newly selected versions in `pnpm-lock.yaml`.

Provisioning covers both app manifests/imports and the default desktop identity.
Keep new package references discoverable by `scripts/provision.ts`, and extend
its tests when adding app metadata that should follow a project rename.

## choose-the-runtime-boundary

- Use the system WebView backend when the UI belongs in an application window.
  The backend runs Deno code and serves the frontend over local HTTP; native
  operations remain in the Deno process.
- For a tray application that opens the user's browser, keep browser launching
  behind a platform adapter. Check raw-backend packaging support for every target
  before choosing it; a working tray does not establish a working installer.
- Decide what closing the window means: quit, hide, or keep a background service.
  Wire the tray's Open and Quit actions to that lifecycle. Do not assume that
  closing the last native window leaves the process running.

Keep reusable models and behavior in ordinary `packages/lib*/` libraries, following
`AGENTS.md`. Desktop entries assemble the server, assets and native UI adapters.
Pass dependencies into the server instead of making it import the desktop entry.

## place-app-configuration-and-types

A possible layout, with app names adapted to the project:

```text
apps/desktop/deno.json          # desktop metadata, backend, app-specific settings
apps/desktop/assets/            # source icons
apps/desktop/src/main.ts        # native entry
apps/frontend/                 # frontend sources and its build output
apps/server/                   # HTTP service, when shared with another entry
packages/deno-types/src/generated/
scripts/desktop/               # Node TypeScript build helpers
```

The root stays the pnpm/NoMake coordinator. Place `deno.json` in the owning app;
invoke Deno from that directory with an explicit configuration file. Resolve
icons and output paths against that declared build working directory. Keep
TypeScript checking in `tsconfig`; desktop metadata does not replace it.

For pnpm-managed dependencies, run `pnpm install` and use
`"nodeModulesDir": "manual"` in the app config. Deno can resolve dependencies in
the app's `package.json` through the installed workspace links and package exports.
A TypeScript entry can be packaged directly; test that path before adding a
bundler. Deno's own workspace discovery is separate: `pnpm-workspace.yaml` alone
does not declare Deno workspace members.

Generate runtime declarations with the selected Deno binary:

```sh
mkdir -p packages/deno-types/src/generated
deno types > packages/deno-types/src/generated/deno.d.ts
```

Expose them through a types-only workspace package. Include that package in
server/desktop `compilerOptions.types`, and declare it as a workspace dependency.
If `deno types` omits desktop APIs, generate a separate declaration file from the
same Deno release's official desktop declarations. Handle its references explicitly;
do not copy declarations from a moving branch or write ambient API stubs by hand.

Use separate frontend and server/desktop tsconfigs so Node and Deno globals do not
leak into browser code. Make the relevant checks depend on generated declarations
and shared tsconfig files; avoid adding Deno-specific inputs to every TS project.

## build-for-distribution

Register the frontend, resource generation and desktop packaging in `make.ts`, using
the [nomake](../nomake/SKILL.md) workflow. Keep subprocesses and file generation in
focused Node TypeScript helpers under `scripts/`.

Reuse `reactProject()`, `denoTypesProject()` and `denoDesktopProject()`. Their file
targets build the browser output, generate the embedded assets/declarations, check
the desktop sources, and package the TypeScript entry directly. Platform packaging
is explicit; `pnpm verify` includes the app checks and resource generation.

```text
frontend sources → frontend build → embedded resources ┐
desktop/server/library sources + checks ───────────────┤
app config + icons + toolchain + installed dependencies┴→ platform package
```

Runtime code must not discover frontend files through the source tree. One option
is a build-time generator that reads explicit input directories and produces a
typed map of URL paths to bytes and content types; inject that map into the server.
Another is Deno's included-file mechanism with explicit inclusion paths. Read
[distribution](references/distribution.md) for the resource and packaging details.

Use the TypeScript entry directly when Deno resolves and packages its module graph.
A separate desktop bundle is optional, for example when a required transform is
outside Deno's compiler. Keep any such bundle outside handwritten source globs as
an ignored distribution output. Frontend bundling and running Node tooling directly
from TypeScript remain separate build concerns.

Give each generated file or dedicated output directory one owning target. Declare
the frontend tree, runtime sources, asset inputs, generators, tsconfigs, app config,
icons, manifests, lockfiles and selected toolchain version where they affect an
output. Connect producers to consumers through project dependencies and `outputs`.
Keep platform outputs separate, and exclude generated outputs from their own input
globs. Root package scripts should select targets or call helpers, not duplicate
the build graph.

## validate-the-result

Run the affected checks and the full `pnpm verify`. When changing the build graph,
check a cold build, an unchanged cache hit, and rebuilding after a relevant source
or asset changes.

Launch the packaged app from outside the checkout, with source access unavailable.
Confirm UI loading and one representative native operation. Exercise tray/window
actions that changed; retain earlier evidence for unchanged behavior instead of
repeating manual checks without a specific unresolved issue.

Report platform build success, package size, installation, launch and native
operation results separately. A cross-built Windows installer is not evidence of
Windows execution. Keep dated versions, measurements and failures in
`docs/worklogs/journal/`; keep product names, machine paths and temporary packaging
workarounds out of the reusable workflow.
