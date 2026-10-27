# TypeScript Monorepo Template

A starting point for applications built from reusable TypeScript libraries.
Each library owns its public interface and data models, with validation schemas
generated from those models.

Includes Rust/Wasm and Idris library examples with TypeScript interfaces.

## Get started

Requires Node 24.6+ and pnpm.

```sh
pnpm provision my-project
pnpm install --frozen-lockfile
pnpm start Example
```

<!-- template-only:start -->
Provisioning removes the template-only scripts and metadata. Pass `--keep-tooling`
to retain them for re-provisioning or renaming.
<!-- template-only:end -->

The example CLI prints `Hello, Example!` using the included greeting library.
Replace these examples with your application's features.

See [AGENTS.md](AGENTS.md) for development conventions.

For a Deno desktop app, follow the
[integration workflow](.agents/skills/integrate-deno-desktop/SKILL.md) for app-local
configuration, frontend resources, native UI and platform packaging.
