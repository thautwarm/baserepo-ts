# Project conventions

<!-- template-only:start -->
## Template setup

`pnpm provision <project-name> [--scope <scope>] [--keep-tooling]` sets the project
name and package scope. The scope defaults to `@<project-name>`. Run
`pnpm install --frozen-lockfile` afterward.

Provisioning uses only Node built-ins. With `--keep-tooling` it must remain
idempotent and support renaming an already provisioned project. Preserve `.git`,
installed dependencies, and unrelated external references. Read package names from
manifests and the current scope from `template.scope`; do not hardcode template names.

A successful run without `--keep-tooling` removes the marked template-only sections,
the `provision` script entry, the `template` metadata, and `scripts/provision.ts` plus
`scripts/provision.test.ts`. Pass `--keep-tooling` when maintaining the template or
renaming an already provisioned project.
<!-- template-only:end -->

## Workspace

- `apps/*`: applications.
- `packages/lib*`: reusable libraries consumed by workspace packages and apps.
- `packages/tsconfig`: shared TypeScript configuration.
- `rust-workspace/*`: Rust libraries compiled to Wasm for TypeScript consumers.
- `idris-workspace/*`: Idris libraries and JavaScript entry points. Run Idris and pack in Docker through `scripts/idris.ts`.

## Development

- Use Node 24.6+ and pnpm. Run Node code directly from TypeScript; no JavaScript build step or `dist/`.
- `erasableSyntaxOnly: true` is required.
- Import JSON with `with { type: "json" }`.
- Declare projects, dependencies, and aggregate targets in `make.ts`. Use NoMake for generation and validation.
- Keep each file at one abstraction level; extract lower-level details into helpers. Tooling helpers belong in `scripts/`, including workspace discovery, toolchain setup, and target construction.
- Entry points assemble dependencies and simple adapters; keep business logic in private modules. Implementation modules must not import their entry points.
- Use Biome for formatting and linting: `pnpm fmt` and `pnpm lint`.

Run project targets from the workspace root, for example `pnpm exec node make.ts check:cli`
(also `test:cli` and `lint:cli`). Use one NoMake session to coordinate the projects.
Tests include dependency tests; lint covers only the selected project. Run `pnpm verify`
for full-workspace validation before finishing.

Libraries use the structure below. Node and web apps may use `types.ts` and generated
`schemas.ts` as needed. Public exports and IDD checks are required only for libraries.

### Types: `<package>/src/types.ts`

- Type declarations, `import type`, and `export type` only; no runtime code.
- Use Interface-Driven Design (IDD): define models and module contracts before implementations; do not infer contracts from implementations.
- Provide all public types callers need. Keep implementation-only helper types private.
- If schema generation does not support `keyof Model`, declare an explicit string-literal union and prove in type tests that it is a subtype of `keyof Model`. Check the reverse relation only when every key is required; valid subsets need not cover all keys. For a constant string array, use `as const satisfies ReadonlyArray<keyof Model>` to reject extra or misspelled keys, then check completeness separately when required. Keep runtime arrays in tests or implementations; `types.ts` remains declaration-only, and public contracts must not be inferred from runtime constants.

### Generated Schemas: `<package>/src/schemas.ts`

`PublicModels` in `types.ts` contains only models whose schemas need to be public:

```ts
export interface PublicModels {
  type1: Type1;
}
```

- Generate schemas with `ts-to-zod` from `PublicModels` and its referenced data types. Do not maintain separate data definitions or generate from behavior contracts such as `ILibrary`.
- `src/schemas.ts` is generated and internal; keep it in Git. `pnpm schema` runs the registered schema targets.
- Any app or package with `src/types.ts` automatically gets a NoMake target for `src/schemas.ts`.
- Keep generation inputs self-contained. Check support before adding cross-file references or complex types; do not accept silent fallback to `z.any()`.

### Library exports: the runtime `<library-package>/src/index.ts` and `<library-package>/src/types.ts`

Each library owns its contract; do not create a central contracts package.
It has exactly two public entry points:

```json
{
  "exports": {
    ".": "./src/index.ts",
    "./types": "./src/types.ts"
  }
}
```

`index.ts` exports one object named after the unscoped package, explicitly typed with
`ILibrary` from `<package>/types`:

```ts
import type { ILibrary } from "@template/libgreeting/types";
import { createGreeting } from "./implementation.ts";
import { publicModelsSchema } from "./schemas.ts";

const schemas = publicModelsSchema.shape;

export const libgreeting: ILibrary = {
  greet: async (request) => createGreeting(schemas.greetRequest.parse(request).name),
  schemas,
};
```

- `types.ts` supplies all public types, including the runtime contract `ILibrary` and schema registry `PublicModels`. `index.ts` exports no types.
- When consuming a library workspace dependency, agents normally only need its `src/types.ts`; reading the entire package's source is unnecessary.
- Public types must be reachable from `ILibrary` or `PublicModels`.
- Use an explicit `: ILibrary` annotation to fix the consumer-visible type. `satisfies` alone preserves implementation inference.
- Declare `ILibrary.schemas` as `{ [K in keyof PublicModels]: ZodType<PublicModels[K]> }`.
- Implementation modules must not import their own public root or package name.
- Import cross-package types through `<package>/types` and values through `<package>`. No cross-package deep imports or public `<package>/schemas` entry.

### IDD checks: `<library-package>/src/idd-check.ts`

Each library has `src/idd-check.ts`, using its actual package and object names. This
independent check normally stays unchanged when API members or assembly change:

```ts
import * as mod from "@template/libgreeting";
import type { ILibrary } from "@template/libgreeting/types";

void (mod satisfies { libgreeting: ILibrary });
```

- Include this file in the library's type check; do not import it at runtime.
- Check the public entry against its contract in `<package>/types`.
- `satisfies` checks required exports and compatible signatures. It does not enforce the `: ILibrary` annotation or forbid additional exports.
- Do not bypass contract errors with assertions, `any`, or ignored diagnostics. Use `@ts-expect-error` only for negative type tests.
- Update the contract and assembly together when changing an API; keep the independent IDD check.

## Scope

Reuse existing scripts and shared configuration. Use ordinary TypeScript checks to
enforce these conventions rather than adding an assembly framework or code generator.
