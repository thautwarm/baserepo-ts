# raw-wasm-abi

Use this pattern for a synchronous parser or similar byte-oriented library.
Choose and document the ABI on both sides before implementing the wrapper.

## exports-and-ownership

A compact ABI can export:

- `memory`: the linear memory.
- `reset()`: begin a call and reclaim the previous call's arena.
- `alloc(length) -> pointer`: reserve input bytes; reserve zero as a failure value.
- `parse(pointer, length, ...limits) -> pointer`: return a length-prefixed response.

Use numeric scalars across the ABI, not Rust references, `String`, or struct
layouts. Export unmangled `extern "C"` functions; Rust 2024 uses
`#[unsafe(no_mangle)]` for the export attribute.

Define the output as a four-byte little-endian byte length followed by UTF-8 JSON,
for example `{ "ok": true, "value": ... }` or `{ "ok": false, "message": ... }`.
Specify allocation failure, response lifetime, and input/resource limits. With an
arena, `reset` invalidates earlier pointers; a no-op `dealloc` does not free memory.

## call-sequence

In the private TypeScript adapter:

1. Validate that the instance exports the required memory and functions.
2. Encode input with `TextEncoder`, reset the arena, allocate, and copy the bytes.
   Define the zero-length-input case so it does not conflict with allocation failure.
3. Call the operation. Check its failure sentinel and response bounds.
4. Create a fresh `DataView(memory.buffer)` and read the response byte length with
   `getUint32(pointer, true)`. Check the payload fits in memory.
5. Decode with `TextDecoder`, parse JSON, and validate its shape before exposing
   the library result. Convert the error envelope to the public error behavior.

Recreate views after calls that may grow memory; old buffers may be detached.
Finish reading the result before another reset. Keep the whole sequence
synchronous, without reentrant host callbacks; use separate instances for workers
or independent concurrent owners.

## contract-details

JSON does not make Rust and TypeScript types identical. Match field names, enum
encoding, nullability, numeric ranges, and error offsets explicitly. A byte offset
in UTF-8 is not a JavaScript UTF-16 index. Test these differences through the actual
generated Wasm, including arena exhaustion and configured limits.
