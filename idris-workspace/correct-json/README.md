# correct-json

Idris JSON parsers, checked encoders, and derivable `ToJSON` / `FromJSON` codecs.
Ported from `correct-ai/packages/idris-json` at commit
`78ab60cb57846cdd60bc89352f2ca9d7b482225e` and maintained here.
Its `JSON.Wire.*` and canonical Unicode dictionary modules are included.

## source-and-license

Based on [idris2-json](https://github.com/stefan-hoeck/idris2-json/tree/5971372b7fe2716dfbad022af88e3e102e101a39),
with a parser from [idris2-ilex](https://github.com/stefan-hoeck/idris2-ilex/blob/35300916952f92912f8b4894f73da7be9b4b805a/json/src/JSON/Parser.idr)
and subsequent changes from correct-ai. Retain `LICENSE` and `LICENSE.ilex`.
External dependencies are pinned in [pack.toml](../pack.toml).

## usage

Add `correct-json` to the consumer's `.ipkg` dependencies and connect its
`idrisProject()` to the JSON project in `make.ts`.

Use `JSON.Derive` for record codecs. Set `unwrapUnary := False` when single-field
records must remain objects. `decodeEither` and `encode` return `Either String`;
handle errors rather than falling back to `show` or an empty document.

Use `JSON.Wire.Authoring` when codecs and TypeScript types must share one checked
wire graph. The [salutation generator](../salutation-types/src/Main.idr) renders
types and validators from published roots; its library contract remains handwritten.

`Int64` / `Bits64` fields, including nested and container occurrences, generate
annotated TypeScript `I64` / `U64` bigint aliases. JSON uses integer literals;
both Idris codecs and TS guards enforce the signed or unsigned 64-bit range.
Use generated `stringifyWireJSON` / `parseWireJSON` instead of ordinary JSON calls,
then apply the generated Zod schema to normalize small integers to bigint.

Objects reject duplicate decoded keys and invalid Unicode scalar keys. Encoding
rejects nonfinite numbers and invalid numeric tokens.

For structured Idris/JavaScript exchange, pass JSON strings across the FFI and
validate the parsed result in TypeScript. See [Salutation.JSON](../salutation/src/Salutation/JSON.idr)
and its [TypeScript adapter](../../packages/libsalutation/src/implementation.ts).

Run the ported core codec suite with
`pnpm exec node make.ts test:idris:correct-json-tests`.
