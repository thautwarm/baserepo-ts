---
name: nomake
description: Extend the workspace's NoMake build graph. Use when registering projects, adding or changing targets, fetching build inputs, or diagnosing cache invalidation.
---

# nomake

Work in the root `make.ts` and its `scripts/` helpers. Workspace conventions,
including schemas and IDD, live in `AGENTS.md`.

## integrate-projects

Use `tsProject()`, `rustProject()`, and `idrisProject()` from their
`scripts/*-project.ts` helpers. Declare projects, dependencies, and aggregates in
`make.ts`; reuse the returned targets:

```ts
const library = tsProject({ name: "libexample", type: "library" });
const app = tsProject({ name: "example", type: "app", dependencies: [library] });
const projects = [library, app];

NM.target({ name: "tests", virtual: true, deps: projects.map((p) => p.tests) });
```

Connect projects through `dependencies`. Each exposes `check`, `tests`, and
`outputs`; TypeScript consumers build dependency outputs before checking them.
TypeScript projects also supply schema and lint targets.

Put shared target construction in focused `scripts/` helpers. Keep workspace
setup, toolchain discovery, and individual build actions out of project declarations.

## define-targets

Read [target patterns](references/targets.md) when defining targets or changing
dependency discovery and caching. It covers typed `deps.xxx`, output ownership,
invalidation, dynamic graphs, and scheduling for NoMake 0.2.0.

- Give generated files real output targets. Record successful validation in `.nomake_files/<project>/*.checked`; write the stamp after success. Use virtual targets for aggregates and aliases.
- Use named dependency records and consume inferred `deps.xxx` paths in `build`. Declare the sources, configuration, generators, helpers, manifests, and lockfiles that affect the result.
- Run commands in `build` with `await NM.Shell.runChecked([command, ...args])`. Use executable names on PATH; add required tools to the existing `checkToolchains()` call.
- Run CPU-heavy generators as Node CLI subprocesses. The script owns generation and output; NoMake owns dependencies, caching, and scheduling. Schema generation uses `scripts/schemas.ts`.

For downloaded files or Git dependencies, read
[fetch-remote-resources](references/fetch-remote-resources.md). It distinguishes
cached targets from direct download and clone operations.

## verify-changes

Run affected targets from the workspace root, for example
`pnpm exec node make.ts test:cli`. Use one NoMake session to coordinate package work.
Run `pnpm verify` before finishing.

For cache or graph changes, check a cold run, an unchanged cache hit, and a rebuild
after a relevant input changes. Test file additions and removals when changing
dynamic discovery.
