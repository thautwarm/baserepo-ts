# javascript-bridge

Follow the runnable example rather than maintaining a second copy of its code:

1. [salutation.ipkg](../../../../idris-workspace/salutation/salutation.ipkg) lists
   the library module. [Salutation.idr](../../../../idris-workspace/salutation/src/Salutation.idr)
   exports a pure `greet : GreetRequest -> GreetResponse` function.
   [Salutation.JSON](../../../../idris-workspace/salutation/src/Salutation/JSON.idr)
   uses `deriveJSON` and `publishJSONRoot` to produce checked codecs for JSON text.
2. [salutation-js.ipkg](../../../../idris-workspace/salutation-js/salutation-js.ipkg)
   depends on that library, selects `Main`, and names its executable `salutation-js.mjs`.
3. [Main.idr](../../../../idris-workspace/salutation-js/src/Main.idr) passes `exchange`
   to a `javascript:lambda:` FFI function. The compiled module runs `main` on import
   and registers the function under a private `Symbol.for` key. Only strings cross
   the FFI; codec failures become JavaScript errors at this boundary.
4. [runtime.ts](../../../../packages/libsalutation/src/runtime.ts) imports the
   generated module once, captures and validates its API, and deletes the global
   handoff. The function remains callable through its captured reference.
5. [implementation.ts](../../../../packages/libsalutation/src/implementation.ts)
   validates requests before serialization and uses generated Zod schemas and
   wire guards on decoded responses. Schemas restore small integer literals to
   bigint and return ordinary JavaScript objects.
   [index.ts](../../../../packages/libsalutation/src/index.ts) assembles the public
   `libsalutation: ILibrary`. Callers see the contract from `types.ts`.

Use a distinct symbol per bridge. FFI lambdas receive positional arguments;
follow generated call sites for callback and `IO` conventions. Exchange structured values
through JSON rather than depending on JavaScript layouts for Idris constructors.

Use a static side-effect import for the generated module. NoMake generates it
before consumer checks; JavaScript evaluates it before the adapter's module body.
For Node and browser use, prefer `javascript:` FFI over Node-only `require`.

## generated-models

[Salutation.Types](../../../../idris-workspace/salutation/src/Salutation/Types.idr)
is the data-model source. `Salutation.JSON` derives wire definitions and publishes
request, response, and `PublicModels` roots. The registry lists the public models;
it does not repeat their fields.

[salutation-types](../../../../idris-workspace/salutation-types/src/Main.idr)
calls `renderGraphTypeScriptFor` on those checked graphs. Each generated internal
module includes structural types, validators, and transport helpers; it is not a
type-only file. `src/types.ts` uses `import type`, `export type`, and indexed-access
aliases to expose model types while keeping the `ILibrary` method contract local.

The consumer's `schemaSource` points at the generated module exposing
`PublicModels`. This lets ts-to-zod generate `schemas.ts` from the same models
without following cross-file imports or copying fields into `src/types.ts`.
Keep these generated files in Git. NoMake builds them before schemas and checks,
including when the outputs are absent.

The example uses `CanonicalGraphSyntax` and tests `NativeJSONNumbers` too.
`Int64` and `Bits64` generate `I64` / `U64` bigint aliases with Zod annotations.
Use generated `stringifyWireJSON` / `parseWireJSON` for JSON integer literals,
then parse through the generated Zod schema before the wire guard. This restores
small integer literals to bigint and preserves the full 64-bit range. The helpers
require `JSON.rawJSON` and the JSON reviver's `context.source` (available in Node 24.6+).
Other numeric models still need explicit bindings and profile selection.
