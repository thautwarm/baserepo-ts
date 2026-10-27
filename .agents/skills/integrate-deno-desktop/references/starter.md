# starter

Use this reference for the included starter apps. In a provisioned project, inspect
the current manifests and `make.ts` before using these names or targets.

Install the Deno version pinned in `apps/desktop/toolchain.json` (currently 2.9.8).
Deno desktop is experimental in that release. Desktop type checks and packaging
use this binary; Node tooling still runs directly from TypeScript.

```sh
pnpm build:web              # NoMake → frontend check → Vite production build
pnpm verify                 # All template checks/tests, including both apps
pnpm desktop:mac            # NoMake → embedded frontend → official macOS .app
pnpm desktop:windows        # Same graph → Windows x64 MSI, including from a Mac
pnpm desktop:linux          # Same graph → Linux AppImage (build host's arm64/x64)
```

`apps/frontend` and `apps/desktop` are workspace packages. Provisioning renames
their package names, workspace dependencies, imports and shared tsconfig references.
It also changes the default desktop name and `com.example.<project-name>` identifier
in `apps/desktop/deno.json`; customized app names and identifiers are preserved.

The frontend uses `@template/libgreeting` in the browser, and the desktop uses the
same library in Deno. The app's tray opens/focuses its window or quits. Closing the
main window exits the demo. Its native-check button runs a fixed system-information
command through the local server.
Quit shuts down the server and closes the window, leaving native cleanup to the
desktop backend.
When the backend reports no native tray, the window and its Quit action remain
available. Linux tray integration depends on the desktop environment.

The build graph is declared in `make.ts`, using `frontendProject()`,
`denoTypesProject()` and `desktopProject()` from `scripts/`:

```text
frontend check → Vite dist → embedded asset module → desktop check → platform package
                            Deno declarations ────────┘
```

NoMake builds the sibling frontend explicitly before invoking
`deno desktop --config deno.json src/main.ts` from `apps/desktop`. Deno resolves the
desktop's installed workspace dependencies with `nodeModulesDir: "manual"`; no
preliminary desktop JavaScript bundle is required. Framework auto-detection in
`deno desktop .` is a separate mode and does not build this sibling app for us.

Artifacts go to `artifacts/desktop/macos-<host-arch>/<app-name>.app` and
`artifacts/desktop/windows-x64/<app-name>.msi`, plus
`artifacts/desktop/linux-<host-arch>/<app-name>.AppImage`. Separate architecture targets keep
NoMake's package cache from mixing platforms. Each directory includes a
`build-result.json` recording the Deno version, target and final artifact size.
The default Mac signature is ad-hoc; release signing/notarization and Windows
installation/runtime checks remain release validation tasks.
Linux uses the system WebKitGTK backend and requires a compatible graphical
environment and its runtime libraries. Cross-building an AppImage does not verify
those dependencies or tray support on a user's distribution.

Platform selection and output names use exhaustive switches in
`scripts/desktop-platform.ts`; adding a platform to the union requires updating
each dispatch. Native commands and signals follow the same pattern in
`apps/desktop/src/platform.ts`.

Generated Deno declarations live inside `packages/deno-types/src/generated`;
`pnpm deno:types` builds them from the pinned runtime and matching official desktop
declarations. The generated types, frontend output and embedded resource module
are ignored and recreated by NoMake. Runtime asset lookup uses the embedded map,
with no filesystem traversal to the checkout.
