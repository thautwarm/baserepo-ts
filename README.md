# TypeScript Monorepo Template

Node 24+ runs TypeScript source directly. pnpm 10.9.0 manages the workspace.
There is no JavaScript build step or `dist/` directory for Node applications.

## Provision a project

```sh
pnpm provision my-project
# Or choose a separate package scope:
# pnpm provision my-project --scope my-team
pnpm install --frozen-lockfile
pnpm verify
pnpm start Example
```

Provisioning sets the root project name and local package scope, updates imports,
configuration references, the lockfile, and the README title. The default scope
is `@<project-name>`; `--scope` accepts a name with or without `@`. Names use
lowercase kebab case. The directory and Git repository are preserved.

The script uses only Node built-ins, so `node scripts/provision.ts my-project`
also works before dependency installation. Repeating the same request is a no-op;
provisioning an already provisioned project with new names is supported.
Unrelated external packages are not renamed. Install afterward to refresh links.

## Workspace

```text
apps/cli/                Example CLI application
packages/libgreeting/    Example reusable runtime library
packages/tsconfig/       Shared TypeScript configuration (tooling, not a library)
scripts/                 Schema generation and template provisioning
```

A library is a runtime package imported by other packages. Libraries use `lib*`
for both their folder and unscoped package name. Apps and tooling packages have
separate roles. See [AGENTS.md](AGENTS.md) for the complete conventions.

## TypeScript configuration

Apps, libraries, and root scripts inherit presets from the workspace config package:

```json
{
  "extends": "@template/tsconfig/node.json",
  "include": ["src"]
}
```

`base.json` provides environment-independent checks. `node.json` adds Node globals,
NodeNext module resolution, and erasable syntax requirements. Each consumer declares
`@template/tsconfig` as a workspace dev dependency and owns its source paths.
Root `pnpm check` checks scripts and runs all app/library `check` scripts.

Browser or framework projects may extend `base.json` and add DOM, JSX, and their
module-resolution settings. Shared configs do not contain project-relative paths;
TypeScript resolves inherited relative paths against the file declaring them.
Array options are overridden rather than concatenated. Install workspace dependencies
before checking types. A source library may be checked in multiple consuming projects.

## Library interfaces

Each library owns its types and exposes exactly two import points:

- `<package>/types`: types only, including `ILibrary` and `Models`.
- `<package>`: assembled functions and schemas, with direct type re-exports.

```text
src/types.ts             Public contract and model registry
src/bindings.ts          Typed bindings to selected APIs and schemas
src/implementation.ts    Private business implementation
src/schemas.ts           Generated schemas (internal)
src/index.ts             Public assembly entry
src/interface-check.ts   Independent public export check
```

For the unprovisioned example:

```ts
import * as mod from "@template/libgreeting";
import type { ILibrary } from "@template/libgreeting/types";

void (mod satisfies ILibrary);
void (mod satisfies mod.ILibrary);
```

The check file participates in type checking and is not imported at runtime.
Public types must be reachable from `ILibrary` or `Models`; internal helper types
stay private. There is no central contracts package.

## Schemas from Models

Each library's `types.ts` identifies its schema models:

```ts
export interface Models {
  greetRequest: GreetRequest;
  greetResponse: GreetResponse;
}
```

```sh
pnpm schema
pnpm schema:check
```

The script uses the official `ts-to-zod` generator with `Models` as its root,
including referenced data types and excluding behavior interfaces. Generated
`schemas.ts` files remain internal and are kept in version control. There is no
public `<package>/schemas` subpath.

```ts
import { greet, schemas } from "@template/libgreeting";
import type { GreetRequest } from "@template/libgreeting/types";

const request: GreetRequest = schemas.greetRequest.parse({ name: "Example" });
const response = schemas.greetResponse.parse(await greet(request));
```

## Verification

`pnpm verify` checks schema drift, checks all TypeScript projects, and runs Node's
built-in tests, including provisioning validation and idempotence. Node strips
types without checking them, so the separate type checks remain required.

The runtime setup follows [pp-brain-server](https://github.com/thautwarm/pp-brain-server).
Schema generation uses [ts-to-zod](https://github.com/fabien0102/ts-to-zod).
