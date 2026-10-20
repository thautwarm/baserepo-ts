import { WASM_BASE64 } from "./generated/wasm-bytes.ts";

const bytes = Uint8Array.from(atob(WASM_BASE64), (char) => char.charCodeAt(0));
const backend = instantiate();

function instantiate() {
  const { memory, alloc, dealloc, process } = new WebAssembly.Instance(
    new WebAssembly.Module(bytes),
  ).exports;
  if (
    !(memory instanceof WebAssembly.Memory) ||
    typeof alloc !== "function" ||
    typeof dealloc !== "function" ||
    typeof process !== "function"
  ) {
    throw new Error("Missing Wasm MessagePack exports");
  }
  return { memory, alloc, dealloc, process };
}

function pointer(value: unknown): number {
  if (typeof value !== "number" || !Number.isInteger(value)) {
    throw new Error("Invalid Wasm pointer");
  }
  return value >>> 0;
}

export function exchange(request: Uint8Array): Uint8Array {
  const input = pointer(backend.alloc(request.length));
  try {
    new Uint8Array(backend.memory.buffer, input, request.length).set(request);
    const output = pointer(backend.process(input, request.length));
    const length = new DataView(backend.memory.buffer, output, 4).getUint32(0, true);
    try {
      return new Uint8Array(backend.memory.buffer, output + 4, length).slice();
    } finally {
      backend.dealloc(output, 4 + length);
    }
  } finally {
    backend.dealloc(input, request.length);
  }
}
