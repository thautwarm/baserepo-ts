import "./generated/salutation-js.mjs";

const key = Symbol.for("monorepo.salutation");
const backend: unknown = Reflect.get(globalThis, key);
Reflect.deleteProperty(globalThis, key);

if (
  typeof backend !== "object" ||
  backend === null ||
  !("greet" in backend) ||
  typeof backend.greet !== "function"
) {
  throw new Error("Idris example did not register greet");
}
const callGreet = backend.greet;

export function greet(name: string): string {
  const result: unknown = callGreet(name);
  if (typeof result !== "string") throw new Error("Invalid Idris greet result");
  return result;
}
