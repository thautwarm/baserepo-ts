# Target patterns in NoMake 0.2.0

These are NoMake semantics. Workspace choices such as `.checked` files and
`tsProject()` are conventions of this template. Examples use `import * as NM from
"@nomake/core"` and run from the workspace root.

## Model the output and its inputs

A target has a unique `name`, dependencies, and an optional build action. For a
file target, the name is its output path. A dependency string resolves to a
registered target with that name, or otherwise to a filesystem resource. Passing
a target object makes the producer relationship explicit.

Use a named dependency record instead of rediscovering paths in the build action:

```ts
const schema = NM.target({
  name: "packages/libgreeting/src/schemas.ts",
  deps: {
    types: "packages/libgreeting/src/types.ts",
    generator: "scripts/schemas.ts",
    tooling: ["make.ts", "scripts/ts-project.ts", "package.json", "pnpm-lock.yaml"],
  },
  async build({ deps, target }) {
    await NM.Shell.runChecked([process.execPath, deps.generator, deps.types, target]);
  },
});
```

NoMake deletes an existing file target before rebuilding it. The action must
recreate the target and create any parent directories it needs. One target owns
one output path; for multiple generated files, use separate targets or a dedicated
output directory whose entire contents the action can replace. Track individual
files when consumers need per-file invalidation.

Sources: [target registration](https://github.com/thautwarm/nomake/blob/v0.2.0/source/build.ts#L366-L383),
[output removal](https://github.com/thautwarm/nomake/blob/v0.2.0/source/build.ts#L657-L728).

## Type-safe dependency access

`NM.target()` infers `build`'s `deps` from the dependency declaration, including a
factory's return type. In the example, `deps.generator` and `deps.types` are
`string`, while `deps.tooling` is `string[]`. The compiler rejects a misspelled
`deps.genrator` or assigning `deps.tooling` to a single `string`.

`build` receives the same record keys, with `Target` values resolved to name
strings and arrays or async generators resolved to `string[]`. It receives paths,
not target objects, file contents, or callback return values. Records have one
level; group related inputs in arrays. Keep records inferred, or validate them
with `satisfies NM.BuildDependencies`, rather than annotating them with the broad
`NM.BuildDependencies` type. Avoid `any` or assertions that discard this shape.
This checks dependency keys and path shapes, not file contents or artifact kinds;
all individual paths resolve to plain strings.

Source: [dependency resolution and inference](https://github.com/thautwarm/nomake/blob/v0.2.0/source/build.ts#L80-L200).

## Cache validation without a natural output

This project uses a success stamp for each check, test, or lint scope:

```ts
const check = NM.target({
  name: ".nomake_files/example/check.checked",
  deps: () => ({
    schema,
    sources: NM.Path.glob("packages/libgreeting/src/**/*.ts", {
      includeDirs: false,
      exclude: [schema.name],
    }),
    config: ["packages/libgreeting/tsconfig.json", "packages/tsconfig/base.json"],
    tooling: ["make.ts", "scripts/ts-project.ts", "package.json", "pnpm-lock.yaml"],
  }),
  async build({ target }) {
    await NM.Shell.runChecked(["tsc", "--noEmit", "-p", "packages/libgreeting"]);
    const stamp = new NM.Path(target);
    await stamp.parent.mkdir({ parents: true, onError: "existOk" });
    await stamp.writeText("ok\n");
  },
});
```

Write the stamp after the command succeeds. A failed rebuild revokes the prior
success record; partial output is not accepted as a cache hit next session.
Generated inputs are explicit targets, so they are built even on a clean checkout.
The glob excludes the generated file to avoid dependency lists differing between
the first and second run. In this template, `tsProject()` already creates these
schema and check targets; reuse it for ordinary packages.

Sources: [build ordering and cache commit](https://github.com/thautwarm/nomake/blob/v0.2.0/source/build.ts#L547-L643),
[failed rebuild regression](https://github.com/thautwarm/nomake/blob/v0.2.0/tests/incremental.test.ts#L106-L124).

## Understand invalidation

- With `deps` supplied, the default is `rebuild: "onChanged"`. Omitting `deps`
  defaults to `"always"`; explicit `deps: []` or `{}` uses `"onChanged"`.
- `virtual: true` removes the filesystem output requirement. It does not mean
  always run: a virtual target with dependencies can be cached too.
- `rebuild: "always"` runs the action every session. It does not itself create a
  changing dependency hash. A downstream action still uses the recorded hash.
- `rebuild: "never"` preserves an existing nonvirtual output, after processing
  dependencies; it builds when that output is absent. It is not appropriate for
  schema generation or validation that must respond to input changes.

The cache hashes file metadata (modification time, size, and filesystem type),
target names, and dependency hashes. Dependency changes propagate transitively.
This is metadata caching, not content hashing: edits preserving both size and
modification time can be missed. A directory input does not recursively represent
its contents; use file discovery for that.

The flattened dependency list is sorted for hashing. Record labels, dependency
order, build callbacks, CLI arguments, and environment values are not additional
cache inputs. Declare the relevant build script/configuration files. If a task
varies by mode or external state, give modes distinct targets, materialize that
state as an input file, or run that action with `rebuild: "always"` as appropriate.

Deleting an output rebuilds it; deleting `.nomake_files/targets` discards NoMake's
metadata records. `NOMAKE_CACHE_DIR` relocates those records, not this project's
explicit `.checked` paths. Cache reuse skips actions, not dependency discovery.

Sources: [default mode](https://github.com/thautwarm/nomake/blob/v0.2.0/source/build.ts#L366-L383),
[hash construction](https://github.com/thautwarm/nomake/blob/v0.2.0/source/build.ts#L490-L528),
[skip decisions](https://github.com/thautwarm/nomake/blob/v0.2.0/source/build.ts#L604-L625).

## Discover changing graphs

Use a dependency factory when files or target membership can change between
sessions. A factory may return a record, array, target, string, or async generator;
it is evaluated once per target per runner. A concrete generator instance retains
its first collected snapshot. `deps: () => NM.Path.glob(...)` gives each session a
fresh discovery pass, including added and removed files.

Factories can also construct targets. For example, a helper can scan handwritten
inputs, map each to a uniquely named file target, and return those targets as the
dependencies of an aggregate. The helper declares work; each child's `build`
performs it. This supports dynamic plans without a separate `plan` API.

A factory finishes collecting dependencies before any of those dependencies
build. Listing a producer first does not let the factory read its newly generated
manifest or glob its newly generated files. If output paths are already known,
declare them explicitly. If generated data determines the graph itself, use a
staged runner in a focused helper:

```ts
async function runManifestGraph(
  manifest: NM.Target,
  createTarget: (input: string) => NM.Target,
) {
  const runner = new NM.MakefileRunner();
  await runner.run(manifest.name);
  const inputs: string[] = JSON.parse(await new NM.Path(manifest.name).readText());
  const outputs = inputs.map(createTarget);
  const all = NM.target({
    name: "manifest-outputs",
    virtual: true,
    deps: [manifest, ...outputs],
  });
  await runner.run(all.name);
}
```

Here the manifest is a JSON array of input paths. `createTarget` registers each
output with its actual source dependencies. Both phases share one runner; the
manifest's completed job is reused. This is an alternative entry-point strategy
for a genuinely staged graph, not a nested `makefile()` call from a build action.
Each runner executes a target name at most once, including failures; a new build
session requires a new runner. Ordinary workspace tasks use the existing root
`NM.makefile()`.

Sources: [factory evaluation](https://github.com/thautwarm/nomake/blob/v0.2.0/source/build.ts#L229-L260),
[runner job reuse](https://github.com/thautwarm/nomake/blob/v0.2.0/source/build.ts#L531-L544),
[factory/snapshot regression](https://github.com/thautwarm/nomake/blob/v0.2.0/tests/incremental.test.ts#L179-L196).

## Execute and schedule

Use `await NM.Shell.runChecked([command, ...args], options)` for required commands;
it rejects on failure. Use `{ stdout: "capture" }` when consuming returned stdout;
the default prints output. Pass `cwd` and `env` as options when needed. Use
`NM.Shell.which()` for availability checks, without adding a tool-discovery
framework. Use `Path` for joins, globbing, and file operations; convert to a string
with `asPosix()` for target names and `asOsPath()` for operating-system paths.

Put CPU-heavy work in child processes so independent targets can use multiple
cores. NoMake's dependency scheduler awaits those processes; an `async` function
alone does not parallelize synchronous parsing or generation.

An aggregate's dependencies can run concurrently; shared dependencies execute
once per session. `makefile(["a", "b"])` requests top-level targets sequentially,
so use an aggregate with `deps: [a, b]` for parallel branches. Dependencies are
processed in sibling batches, defaulting to 12; `NOMAKE_TASK_PARALLEL_LIMIT` changes
that batch size and `NOMAKE_NO_PARALLEL=1` serializes traversal. The batch size is
not a global process-pool limit across a nested graph.

After a graph change, verify a cold run, an unchanged cache hit, and invalidation
of the affected branch after changing an input. Use temporary fixtures when
testing dynamic file additions/removals or failure recovery.

Sources: [Shell](https://github.com/thautwarm/nomake/blob/v0.2.0/source/shell.ts#L123-L199),
[dependency scheduling](https://github.com/thautwarm/nomake/blob/v0.2.0/source/build.ts#L560-L579),
[parallelism setting](https://github.com/thautwarm/nomake/blob/v0.2.0/source/compat.ts#L310-L323),
[top-level dispatch](https://github.com/thautwarm/nomake/blob/v0.2.0/source/build.ts#L879-L891).
