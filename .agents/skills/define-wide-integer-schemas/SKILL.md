---
name: define-wide-integer-schemas
description: Define annotated Zod schemas for TypeScript models with i64/u64 fields. Use when modelling 64-bit integers or handling number/bigint differences across serialization boundaries.
---

# define-wide-integer-schemas

Read the documentation for the installed generator, Zod, and serializer before
defining integer wire types. Confirm signedness, range, and decoding behavior:
[ts-to-zod annotations](https://github.com/fabien0102/ts-to-zod/blob/v5.1.0/README.md#jsdoc-tag-validators),
[Zod 4 numeric formats](https://zod.dev/v4#number-formats), and, for MessagePack,
[@std/msgpack](https://jsr.io/@std/msgpack@1.0.3) and
[rmp-serde](https://docs.rs/rmp-serde/latest/rmp_serde/).

## annotated-types

Use `bigint` for application values and explicit `@schema` annotations for wire
constraints. Do not change the default meaning of every `bigint`.

In ts-to-zod 5.1.0, an overriding `@schema` expression gets a leading `z.` from the
generator. Start it with `union(...)`, keeping `z.` on the nested calls:

```ts
export interface Counts {
  /** @schema union([z.int(), z.bigint()]).transform(v => BigInt(v)).pipe(z.int64()) */
  delta: bigint;

  /** @schema union([z.int(), z.bigint()]).transform(v => BigInt(v)).pipe(z.uint64()) */
  total: bigint;
}

export interface PublicModels {
  counts: Counts;
}
```

The generated expressions start with `z.union(...)`. Both accept safe integer
`number` or `bigint` inputs and output `bigint`. Signed i64 permits
`[-2^63, 2^63 - 1]`; unsigned u64 permits `[0, 2^64 - 1]`.

- Reject unsafe numbers before conversion; their precision cannot be recovered.
  `z.coerce.bigint()` also accepts other input types, so it is not equivalent.
- A full `@schema` replaces the inferred schema. Include required `.optional()`,
  `.nullable()`, or array structure in the expression itself.
- Keep annotations in type definitions and regenerate `schemas.ts`; inspect the
  generated expression rather than editing it.

## serialization-and-verification

For MessagePack, decode with `@std/msgpack`, then parse through the generated
schema. Rust rmp-serde can encode small i64/u64 values using compact integer forms
that decode as `number`; 64-bit forms decode as `bigint`. Encode the parsed result
so the fields remain `bigint` on the sending side.

Verify generated schemas with small numbers and bigints, signed/unsigned endpoints,
one value beyond each limit, negative u64, fractions, unsafe numbers, and unwanted
strings or booleans. Check optional/nullable fields when present. For interop work,
test actual serializer round trips and compare normalized values and application
types; identical re-encoded bytes are not required.

## idris-json

For Idris-owned models, use `Int64` / `Bits64` fields and `deriveJSON`; the wire
generator emits annotated `I64` / `U64` bigint aliases. Generate Zod schemas from
that output rather than duplicating the annotations or fields in TypeScript.

JSON carries integer number literals. Use generated `stringifyWireJSON` and
`parseWireJSON`; they serialize bigint exactly and read large integer literals
from their original tokens. Parse decoded data through the generated Zod schema
to normalize small numbers to bigint before calling the wire guard. Node 24.6+
provides the required `JSON.rawJSON` and reviver `context.source` APIs.
