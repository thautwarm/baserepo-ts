# raw-wasm-abi

The arithmetic example exchanges MessagePack through linear memory. Keep the
numeric ABI and buffer ownership separate from the application's data contract.

## exports-and-ownership

The example exports:

- `memory`: the linear memory.
- `alloc(length) -> pointer`: allocate an input buffer.
- `process(pointer, length) -> pointer`: return a length-prefixed response.
- `dealloc(pointer, length)`: release either buffer using its exact allocation length.

Use numeric scalars across the ABI, not Rust references, `String`, or struct
layouts. Export unmangled `extern "C"` functions; Rust 2024 uses
`#[unsafe(no_mangle)]` for the export attribute.

The response is a four-byte little-endian payload length followed by MessagePack
bytes. The caller owns both buffers. The response allocation includes the four-byte
prefix; release it with `4 + payloadLength`, and release the input independently.
An alternative arena ABI needs an explicit reset/lifetime contract.

## call-sequence

In the private TypeScript adapter:

1. Validate the request with the generated schema, then encode its parsed result
   with `@std/msgpack`.
2. Allocate and copy the bytes into Wasm memory, then call `process`.
3. Create a fresh `DataView(memory.buffer, pointer, 4)` and read the payload length
   with `getUint32(0, true)`. Bound the payload view to that length.
4. Copy the response bytes before releasing either allocation in `finally` blocks.
5. Decode with `@std/msgpack`, parse the generated reply schema, and translate any
   error reply into the public error behavior.

Recreate views after calls that may grow memory; old buffers may be detached.
Keep the sequence synchronous, without reentrant host callbacks; use separate
instances for workers or independent concurrent owners.

## contract-details

Use `rmp_serde::to_vec_named` for replies matching TypeScript objects; default
struct serialization uses arrays. Match request fields and error variants too.

MessagePack integer widths do not preserve the source-language type. Read
[wide-integer schemas](../../define-wide-integer-schemas/SKILL.md) for annotated
i64/u64 normalization. Verify compact integers, 64-bit limits, malformed messages,
and repeated calls through the generated Wasm. Compare normalized values and types,
not identical re-encoded bytes.
