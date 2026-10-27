# distribution

Use this reference when implementing resource generation or packaging. Commands
show a system WebView app named `Example`, with a TypeScript entry at
`apps/desktop/src/main.ts`; adapt its identity, permissions and target paths.
Run preparation and validation through the workspace's NoMake targets first.
The CLI examples use Deno 2.9.8 conventions; recheck the CLI and configuration
schema when changing the selected release.

## resources

Choose one explicit resource contract:

- **Embedded module:** a Node build helper takes the frontend output directory,
  additional assets and output module path as arguments. It emits URL keys,
  content types and byte data. Runtime code receives those values as a dependency.
- **Included files:** pass the required files to Deno's compile/package inclusion
  mechanism and read them using the selected release's supported executable-relative
  addressing. Validate that addressing in the relocated package.

For an embedded module, keep the server contract small:

```ts
interface StaticAsset {
  readonly body: Uint8Array;
  readonly contentType: string;
}
type StaticAssets = ReadonlyMap<string, StaticAsset>;
```

Use stable URL keys such as `/index.html` and `/assets/main.js`, independent of
source paths. Generate from bytes so images and fonts survive unchanged. Sort
inputs for deterministic output, include MIME types needed by the frontend, and
fail generation when a required asset is absent. The server looks up a URL in the
map rather than resolving it into a filesystem path.

Do not put `new URL("../../frontend/dist/", import.meta.url)` in runtime code.
Such a source-relative path is valid in a build helper whose inputs are declared;
it does not establish where a packaged executable's resources live. A tray icon
embedded for runtime use and an app icon consumed by the packager are separate
build inputs even if generated from the same artwork.

## declarations

Prefer the installed release's `deno types` output. Some releases, including
2.9.8, ship desktop API declarations separately. For those releases, a Node
generator can fetch:

```text
https://raw.githubusercontent.com/denoland/deno/v<version>/cli/tsc/dts/lib.deno.desktop.d.ts
```

Read `<version>` from the selected Deno executable, verify the response before
writing, retain its license/provenance, and adapt Deno-internal reference
directives to the workspace package. Commit generated declarations when consumers
need to check TypeScript without fetching them. An explicit generation target
should refresh them when the selected Deno version changes.

## app-configuration

Example `apps/desktop/deno.json`:

```json
{
  "version": "0.1.0",
  "nodeModulesDir": "manual",
  "desktop": {
    "backend": "webview",
    "app": {
      "name": "Example",
      "identifier": "com.example.desktop"
    }
  }
}
```

Configure distribution icons and signing settings here using the selected
release's schema. Runtime tray images are supplied by the app, not by this block.
The example uses pnpm's installed layout through `nodeModulesDir: "manual"`.
Deno reads the app's `package.json` dependencies and follows installed workspace
links, including packages exporting TypeScript source. Run `pnpm install` before
building. Neither moving the workspace packages into the app nor duplicating them
in an import map is required for this path. Test both resolution and the compiled
package; a successful development import only establishes the first.
Do not rely on a desktop app's config being discovered by a sibling server entry.

## serving-and-window-lifecycle

In Deno desktop, `Deno.serve()` uses the address selected by the desktop runtime;
passing a port does not choose a different desktop UI endpoint. Read the actual
listener address for status/origin checks. Bind standalone development servers
explicitly to loopback and an available port.

The first `new Deno.BrowserWindow()` adopts the startup window. The WebView
navigates to the local server automatically. A tray's Open action can call
`show()` and `focus()` on that window. If the product keeps running without a
visible window, implement that lifecycle against the actual backend API and test
it; do not infer it from a successful `hide()` call.

Keep OS operations behind explicit server actions or native bindings. Treat
loopback HTTP as reachable by other local software; it is not authentication.
If using HTTP actions, validate the request host/origin and protect state-changing
operations with a session and an appropriate CSRF defense. Grant only permissions
the app needs. Do not expose an arbitrary shell command or filesystem API merely
to demonstrate native access.

## package-commands

In a POSIX shell, starting at the workspace root:

```sh
PROJECT_ROOT="$PWD"
mkdir -p "$PROJECT_ROOT/artifacts/desktop/macos" "$PROJECT_ROOT/artifacts/desktop/windows"
cd apps/desktop

# macOS host: Deno appends .app to the output stem.
deno desktop --config deno.json --no-check \
  --allow-net=127.0.0.1 \
  --output "$PROJECT_ROOT/artifacts/desktop/macos/Example" src/main.ts

# Build a Windows x64 MSI, including from a macOS host.
deno desktop --config deno.json --no-check \
  --allow-net=127.0.0.1 --target x86_64-pc-windows-msvc \
  --output "$PROJECT_ROOT/artifacts/desktop/windows/Example.msi" src/main.ts
```

`--no-check` assumes the workspace's TypeScript checks already passed. Add scoped
read/write, environment, subprocess or other permissions only for implemented
features; the example grants local networking only. Use an argument array and an
explicit `cwd` when implementing these commands in a Node helper. Resolve artifact
paths before changing directories, check exit status, and require the expected
output to exist before reporting success.

The system WebView uses WKWebView on macOS and WebView2 on Windows. Account for the
Windows WebView2 runtime requirement in installation testing. App signing,
notarization and installer signing are separate from compiling a package. When a
backend's official packager fails, report that failure rather than silently
assembling a replacement bundle; use an explicit workaround only when requested.

## package-verification

- Move or copy the package outside the checkout and start it with an unrelated
  working directory. Temporarily make the source unavailable or deny reads to it;
  relocation alone can still pass if runtime code uses an absolute source path.
- Verify that the UI loads and can perform a representative native action. For
  changed lifecycle behavior, check the relevant Open, close or Quit action.
- Measure the final `.app` tree or installer file, naming the artifact and units.
  Separate installed/uncompressed size from archive size. If measuring memory,
  state which backend, WebView/browser processes and sampling method are counted.
- A valid MSI container establishes packaging only. Verify installation, launch,
  WebView availability and native actions on Windows before claiming runtime
  support. Keep unsigned/ad-hoc builds distinct from signed release artifacts.

Sources: [Deno desktop configuration](https://docs.deno.com/runtime/desktop/configuration/),
[HTTP serving](https://docs.deno.com/runtime/desktop/serving/),
[windows](https://docs.deno.com/runtime/desktop/windows/),
[backends](https://docs.deno.com/runtime/desktop/backends/),
[distribution](https://docs.deno.com/runtime/desktop/distribution/),
[Node/npm compatibility](https://docs.deno.com/runtime/fundamentals/node/),
[workspace compatibility](https://docs.deno.com/runtime/fundamentals/workspaces/#npm-and-pnpm-workspace-compatibility),
[Deno 2.9.8 desktop declarations](https://github.com/denoland/deno/blob/v2.9.8/cli/tsc/dts/lib.deno.desktop.d.ts).
