# Project conventions

<!-- template-only:start -->
## Template setup

`pnpm provision <project-name> [--scope <scope>]` sets the project name and package scope.
The scope defaults to `@<project-name>`. Run `pnpm install --frozen-lockfile` afterward.

Provisioning uses only Node built-ins and must remain idempotent. Preserve `.git`,
installed dependencies, and unrelated external references. Read package names from
manifests and the current scope from `template.scope`; do not hardcode template names.
Provisioning removes this marked section.
<!-- template-only:end -->

## Workspace

- `apps/*`: applications.
- `packages/lib*` (`@template/lib*`): reusable libraries consumed by workspace packages and apps.
- `packages/tsconfig`: shared TypeScript configuration.

## Development

- Use Node 24.6+ and pnpm. Run TypeScript directly; no JavaScript build step or `dist/`.
- Libraries and Node apps extend `@template/tsconfig/base.json` via a `workspace:*` dev dependency; web apps use their framework's own tsconfig.
- `erasableSyntaxOnly: true` is required.
- Import JSON with `with { type: "json" }`.
- Declare projects, dependencies, and aggregate targets in `make.ts`. Use NoMake for generation and validation.
- Keep each file at one abstraction level; extract lower-level details into helpers. Tooling helpers belong in `scripts/`, including workspace discovery, toolchain setup, and target construction.
- Use Biome for formatting and linting: `pnpm fmt` and `pnpm lint`.

Run project targets from the workspace root, for example `pnpm exec node make.ts check:cli`
(also `test:cli` and `lint:cli`). Use one NoMake session to coordinate the projects.
Tests include dependency tests; lint covers only the selected project. Run `pnpm verify`
for full-workspace validation before finishing.

Libraries use the structure below. Node and web apps may use `types.ts`, `bindings.ts`,
and generated `schemas.ts` as needed. Public exports and interface checks are required
only for libraries.

### Types: `<package>/src/types.ts`

- Type declarations, `import type`, and `export type` only; no runtime code.
- Define models and module contracts before implementing them; do not infer contracts from implementations.
- Provide all public types callers need. Keep implementation-only helper types private.

### Assembly: `<package>/src/bindings.ts`

- Record selected APIs with explicit types: `export const someRequiredAPI: SomeRequiredAPI = ...`.
- Internal callers import selected APIs from bindings. Pure functions need no artificial dependency on bindings.
- Keep simple adapters in bindings and business logic in private implementation modules.
- Bindings must not import app entry points or the public package entry. Keep assembly and business modules free of cycles.

### Generated Schemas: `<package>/src/schemas.ts`

List schema models in an exported `Models` interface in `types.ts`:

```ts
export interface Models {
  type1: Type1;
}
```

- Generate schemas with `ts-to-zod` from `Models` and its referenced data types. Do not maintain separate data definitions or generate from behavior contracts such as `ILibrary`.
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

- `types.ts` defines `ILibrary`, the runtime API contract, and `Models`, the registry of schema models.
- When consuming a library workspace dependency, agents normally only need its `src/types.ts`; reading the entire package's source is unnecessary.
- Public types must be reachable from `ILibrary` or `Models`.
- `index.ts` is the public assembly entry. Export contract-typed APIs from bindings: `export const greet: ILibrary["greet"] = bindings.greet`.
- Directly re-export original public types from `types.ts`, including `ILibrary` and `Models`. `mod.LibraryType` must refer to the original type.
- Bind `modelsSchema.shape` as `schemas` with type `{ [K in keyof Models]: ZodType<Models[K]> }` and export it through `<package>`. Include public functions and the schema map in `ILibrary` so interface checks cover both.
- Implementation modules must not import their own public root or package name.
- Import cross-package types through `<package>/types` and values through `<package>`. No cross-package deep imports or public `<package>/schemas` entry.

### Interface checks: `<library-package>/src/interface-check.ts`

Each library has `src/interface-check.ts`, using its actual package name:

```ts
import * as mod from "@template/libgreeting";
import type { ILibrary } from "@template/libgreeting/types";

void (mod satisfies ILibrary);
void (mod satisfies mod.ILibrary);
```

- Include this file in the library's type check; do not import it at runtime.
- Keep the check independent of implementations. Do not replace it with a self-module `typeof import` constraint.
- `satisfies` checks required value exports and signatures. It does not check type exports or forbid additional exports. Re-export public types directly.
- Do not bypass contract errors with assertions, `any`, or ignored diagnostics. Use `@ts-expect-error` only for negative type tests.
- Update contracts, bindings, root exports, and checks together when changing a public API.

## Scope

Reuse existing scripts and shared configuration. Use ordinary TypeScript checks to
enforce these conventions rather than adding an assembly framework or code generator.
