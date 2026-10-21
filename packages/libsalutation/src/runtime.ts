import "./generated/salutation-js.mjs";

const key = Symbol.for("monorepo.salutation");
const backend: unknown = Reflect.get(globalThis, key);
Reflect.deleteProperty(globalThis, key);

if (
  typeof backend !== "object" ||
  backend === null ||
  !("exchange" in backend) ||
  typeof backend.exchange !== "function" ||
  !("integers" in backend) ||
  typeof backend.integers !== "function"
) {
  throw new Error("Idris example did not register its JSON exchange function");
}
const callExchange = backend.exchange;
const callIntegers = backend.integers;

export function exchange(input: string): string {
  const result: unknown = callExchange(input);
  if (typeof result !== "string") throw new Error("Invalid Idris JSON result");
  return result;
}

export function exchangeIntegers(input: string): string {
  const result: unknown = callIntegers(input);
  if (typeof result !== "string") throw new Error("Invalid Idris integer JSON result");
  return result;
}
