# Project conventions

<!-- template-only:start -->
## Template and provisioning

This repository is a project template. The default names are placeholders.

- Provision with `pnpm provision <project-name> [--scope <scope>]`.
- The default scope is `@<project-name>`. Root `package.json` records the current scope in `template.scope`.
- Provisioning updates the root name, local package names and references, configuration references, lockfile, and README title. Run `pnpm install --frozen-lockfile` afterward to refresh workspace links.
- Do not hardcode the template's project name or scope in new tooling. Discover local packages from their manifests and use `template.scope`.
- Provisioning must preserve `.git`, installed dependencies, and unrelated external package references. Repeating it with the same arguments must be idempotent.
- Provisioning removes this marked template-only section from `AGENTS.md` and preserves the project's development conventions below.
<!-- template-only:end -->

## Workspace

- `packages/lib*` (`@template/lib*`): reusable libraries consumed by workspace packages and apps.
- `apps/*`: applications.
- `packages/tsconfig`: project-wide TypeScript presets.

## Runtime and checks

- Use Node 24.6+ and pnpm. Run TypeScript directly; no JavaScript build step or `dist/`.
- `erasableSyntaxOnly: true` is required.
- Environment-specific tsconfig overrides are allowed.
- Declare projects and dependencies in `make.ts`. Use NoMake targets for generation and validation.
- Import JSON with `with { type: "json" }`.
- Use Biome for formatting and linting: `pnpm fmt` and `pnpm lint`.
- Validate affected projects during local work; use `pnpm verify` for full-workspace validation.

## A library's two public entry points

Each library has exactly two public import points:

```json
{
  "exports": {
    ".": "./src/index.ts",
    "./types": "./src/types.ts"
  }
}
```

- `<package>/types` is type-only: type declarations, `import type`, and `export type`. No runtime functions, constants, classes, or side effects.
- `types.ts` defines `ILibrary`, the required runtime exports of `<package>`, and `Models`, the registry of data models requiring schemas.
- Public types should be reachable, directly or indirectly, from fields or signatures in `ILibrary` or from `Models`. Keep implementation-only helper types in private modules and do not re-export them from the root.
- `<package>` is the public assembly entry. `index.ts` selects APIs from `bindings.ts` and exports them with explicit contract types.
- Root type exports must directly re-export the original public types from `types.ts`, including `ILibrary` and `Models`. `mod.LibraryType` is the original type, not a runtime placeholder.
- Import cross-package types through `<package>/types` and runtime values through `<package>`. No cross-package deep imports or public `<package>/schemas` entry.

## Fixed assembly record: bindings.ts

Use `src/bindings.ts` as the library's internal assembly record.

- Record selected APIs with explicit types: `export const someRequiredAPI: SomeRequiredAPI = ...`.
- Internal callers import selected API bindings from this module rather than selecting implementations throughout the codebase.
- Keep simple adapters in bindings and business logic in private implementation modules.
- The root entry exports contract-typed APIs, for example `export const greet: ILibrary["greet"] = bindings.greet`.
- Implementation modules must not import their own public root or package name, and bindings must not import `index.ts`. Avoid cycles between assembly and business modules.
- Pure functions do not need an artificial dependency on bindings.
- Define the contract first; do not infer the public contract from the implementation.

## Independent interface-check.ts

Every library must have `src/interface-check.ts`, checking its public package entry:

```ts
import * as mod from "@template/libgreeting";
import type { ILibrary } from "@template/libgreeting/types";

void (mod satisfies ILibrary);
void (mod satisfies mod.ILibrary);
```

- Use the actual package name. The second expression also requires the root entry to re-export `ILibrary`.
- Wrap the entire `satisfies` expression with `void`. Do not write `(void) mod` or `void mod satisfies ILibrary`.
- Include this file in the library's type check. Do not import it from runtime entry points.
- Do not replace this check with a self-module `typeof import` constraint inside implementation files.
- Do not bypass contract errors using assertions, `any`, or ignored diagnostics. `@ts-expect-error` is only for explicit negative type tests.
- `satisfies` checks required value exports and compatible signatures. It does not check type exports or forbid additional exports. Re-export public types directly.
- Update the contract, bindings, root exports, and checks together when changing a public API.

## Schemas

- Define data types first; generate validation code with `ts-to-zod` rather than maintaining a second data definition.
- Each library's `types.ts` exports a `Models` interface listing its schema models:

  ```ts
  export interface Models {
    type1: Type1;
  }
  ```

- Generate from `Models` and its referenced data types. Do not generate from all exported types or behavior contracts such as `ILibrary`.
- `src/schemas.ts` is an internal generated file, not a public import point. Consumers obtain schemas from `<package>`.
- Bind `modelsSchema.shape` as `schemas` and export it through the root. Its keys follow `Models`, with type `{ [K in keyof Models]: ZodType<Models[K]> }`.
- `ILibrary` covers public functions and the schema map, so interface checks validate both.
- Keep generated schemas in Git.
- Keep generation inputs self-contained. Verify support before adding cross-file references or complex types; do not accept silent degradation to `z.any()`.
- Schema generation applies to `packages/lib*`, not applications or tooling packages.

## Scope

Reuse existing scripts and shared configuration. Do not add an assembly framework or code-generation system to enforce conventions that ordinary TypeScript checks can express.
