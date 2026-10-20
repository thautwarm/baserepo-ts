import { WASM_BASE64 } from "./generated/wasm-bytes.ts";

const bytes = Uint8Array.from(atob(WASM_BASE64), (char) => char.charCodeAt(0));
const instance = new WebAssembly.Instance(new WebAssembly.Module(bytes));
const exportedDouble = instance.exports.double;
if (typeof exportedDouble !== "function") throw new Error("Wasm example did not export double");
const callDouble = exportedDouble;

export function double(value: number): number {
  const result: unknown = callDouble(value);
  if (typeof result !== "number") throw new Error("Invalid Wasm double result");
  return result;
}
