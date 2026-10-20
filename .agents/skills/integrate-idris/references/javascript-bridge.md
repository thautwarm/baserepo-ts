# javascript-bridge

Follow the runnable example rather than maintaining a second copy of its code:

1. [salutation.ipkg](../../../../idris-workspace/salutation/salutation.ipkg) lists
   the library module. [Salutation.idr](../../../../idris-workspace/salutation/src/Salutation.idr)
   exports a pure `greet : String -> String` function.
2. [salutation-js.ipkg](../../../../idris-workspace/salutation-js/salutation-js.ipkg)
   depends on that library, selects `Main`, and names its executable `salutation-js.mjs`.
3. [Main.idr](../../../../idris-workspace/salutation-js/src/Main.idr) passes `greet`
   to a `javascript:lambda:` FFI function. The compiled module runs `main` on import
   and registers the function under a private `Symbol.for` key.
4. [runtime.ts](../../../../packages/libsalutation/src/runtime.ts) imports the
   generated module once, captures and validates its API, and deletes the global
   handoff. The function remains callable through its captured reference.
5. [index.ts](../../../../packages/libsalutation/src/index.ts) assembles the public
   `libsalutation: ILibrary`. Callers see the contract from `types.ts`.

Use a distinct symbol per bridge. Idris functions are curried (`f(a)(b)`); `IO`
callbacks require the backend's calling convention. Keep richer values behind an
explicit adapter rather than assuming JavaScript layouts for Idris constructors.

Use a static side-effect import for the generated module. NoMake generates it
before consumer checks; JavaScript evaluates it before the adapter's module body.
For Node and browser use, prefer `javascript:` FFI over Node-only `require`.
