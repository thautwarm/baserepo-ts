---
name: integrate-idris
description: Integrate Idris libraries into a TypeScript monorepo using a containerized compiler and generate callable JavaScript. Use when adding Idris packages, configuring their dependencies, or exposing compiled functions through a TypeScript library.
---

# integrate-idris

Keep Idris libraries and JS entry points under `idris-workspace/`. Expose them
through ordinary `packages/lib*/` TypeScript libraries and their `ILibrary` contracts.

## container-toolchain

Run Idris and pack in Docker through `scripts/idris.ts`; do not use host installs.
The helper mounts the checkout at `/work`, works in `/work/idris-workspace`, and
uses the image and platform pinned in `idris-workspace/toolchain.json`.

```sh
pnpm exec node scripts/idris.ts idris2 --version
pnpm exec node scripts/idris.ts pack --cg javascript build salutation-js
```

The image targets `linux/arm64`; other hosts need ARM64 container execution or a
separately verified image. A Docker volume scoped to this checkout and image
retains compiler/library installs. Mount only pack's install directory; leave its
collection metadata and source cache available from the image.

## library-and-entry-point

- Define modules and dependencies in each library's `.ipkg`. Register local
  packages in `idris-workspace/pack.toml`, with paths relative to that directory.
- Add a small JS entry-point package depending on the library. `public export`
  makes a function available to Idris; it does not create an ESM export. The entry
  point must retain and register the functions TypeScript will call.
- Follow [Salutation.idr](../../../idris-workspace/salutation/src/Salutation.idr)
  and its [JS entry point](../../../idris-workspace/salutation-js/src/Main.idr).
  Read [javascript-bridge](references/javascript-bridge.md) when adapting the FFI and loader.
- Exchange records, collections, and other structured values as JSON strings.
  Use the local [correct-json](../../../idris-workspace/correct-json/README.md)
  package for Idris codecs and generated Zod schemas on the TypeScript side.

## build-integration

Use the [nomake](../nomake/SKILL.md) skill when changing generation. Declare each
Idris package with `idrisProject()` and connect local packages through
`dependencies`. Supply `javascript` for an entry point's generated output; its
executable name must be `<package>.mjs`.
Set `test: true` for a generated JS test executable; it must exit unsuccessfully
when a check fails. The test target caches successful runs.

`scripts/build-idris.ts` runs the container build and copies that artifact into the
TypeScript library. Its `tsProject()` depends on the Idris entry-point project;
this builds the JS before TypeScript checks and tests. Keep generated JS in Git
and ignore compiler `build/` directories. The library's runtime needs only Node.

```sh
pnpm exec node make.ts idris:salutation-js
pnpm exec node make.ts test:libsalutation
```

Verify generation, a TypeScript call, an unchanged cache hit, and regeneration after
an Idris source changes. Source: [JavaScript backend and FFI](https://idris2.readthedocs.io/en/latest/backends/javascript.html).
