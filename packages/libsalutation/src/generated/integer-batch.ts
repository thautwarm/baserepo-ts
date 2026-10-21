// Generated from one checked Idris wire description. Do not edit.
// Canonical syntax view: Nat uses token nodes; Int64/Bits64 use bigint.
// This is not the ExactJSON tree preserving original number lexemes.
export type WireResult<T> = { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly error: string };
/** @schema union([z.int(), z.bigint()]).transform(v => BigInt(v)).pipe(z.int64()) */
export type I64 = bigint;
/** @schema union([z.int(), z.bigint()]).transform(v => BigInt(v)).pipe(z.uint64()) */
export type U64 = bigint;
export function parseWireJSON(text: string): unknown {
  return parseIntegerJSON(text, false);
}
function parseIntegerJSON(text: string, all: boolean): unknown {
  return JSON.parse(text, (_key: string, value: unknown, context?: { source: string }) => {
    if (typeof value === "number" && context !== undefined && /^-?(0|[1-9][0-9]*)$/.test(context.source)
        && (all || value < -2147483648 || value > 4294967295)) return BigInt(context.source);
    return value;
  });
}
export function stringifyWireJSON(value: unknown): string {
  const rawJSON: unknown = Reflect.get(JSON, "rawJSON");
  const text = JSON.stringify(value, (_key: string, child: unknown) => {
    if (typeof child !== "bigint") return child;
    if (typeof rawJSON !== "function") throw new TypeError("Wire: JSON.rawJSON is required for bigint");
    return rawJSON(child.toString());
  });
  if (text === undefined) throw new TypeError("Wire: value has no JSON representation");
  return text;
}
function isInteger64(value: unknown, signed: boolean): value is bigint {
  return typeof value === "bigint" && (signed
    ? value >= -9223372036854775808n && value <= 9223372036854775807n
    : value >= 0n && value <= 18446744073709551615n);
}
export interface NaturalSyntax { readonly kind: "integer"; readonly token: string }
export interface FiniteBinary64Syntax { readonly kind: "finite-binary64"; readonly bits: string }
export interface WireTransport {
  readonly toSyntax: (text: string) => string;
  readonly fromSyntax: (text: string) => string;
}
declare const wireText: unique symbol;
type CheckedText<T extends string, D extends "input" | "output"> = string & {
  readonly [wireText]: { readonly type: T; readonly direction: D }
};
export type InputText<T extends string> = CheckedText<T, "input">;
export type OutputText<T extends string> = CheckedText<T, "output">;
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
// Capture only JSON syntax data. No source property getter or toJSON is called.
// The traversal bound is generated from the same checked shape as the guard.
// It bounds nesting, not array length or parse/allocation resources.
function snapshotSyntax(value: unknown, depth: number, allowNumbers = false): WireResult<unknown> {
  const ancestors = new WeakSet<object>();
  const captured = new WeakMap<object, Record<string, unknown> | unknown[]>();
  function capture(source: unknown, remaining: number): unknown {
    if (source === null || typeof source === "string" || typeof source === "boolean" || typeof source === "bigint" || (allowNumbers && typeof source === "number")) return source;
    if (typeof source !== "object" || source === null || remaining === 0 || ancestors.has(source)) {
      throw new TypeError("Wire: invalid syntax data");
    }
    const previous = captured.get(source);
    if (previous !== undefined) return previous;
    const descriptors = Object.getOwnPropertyDescriptors(source);
    const keys = Reflect.ownKeys(descriptors);
    if (Array.isArray(source)) {
      const lengthDescriptor = descriptors.length;
      if (lengthDescriptor === undefined || lengthDescriptor.enumerable || !Object.hasOwn(lengthDescriptor, "value")) {
        throw new TypeError("Wire: array length must be own data");
      }
      const length: unknown = lengthDescriptor.value;
      if (typeof length !== "number" || !Number.isInteger(length) || length < 0 || length > 0xFFFFFFFF || keys.length !== length + 1) {
        throw new TypeError("Wire: arrays must be dense own data");
      }
      for (let k = 0; k < keys.length; k++) {
        const key = keys[k];
        if (typeof key !== "string") throw new TypeError("Wire: symbol syntax key");
        if (key === "length") continue;
        const index = Number(key);
        if (!Number.isInteger(index) || index < 0 || index >= length || String(index) !== key) {
          throw new TypeError("Wire: extra array key");
        }
      }
      // Public checked snapshots really implement ReadonlyArray methods and
      // iteration. Define indices directly to avoid inherited source setters.
      const copy: unknown[] = [];
      ancestors.add(source);
      captured.set(source, copy);
      for (let i = 0; i < length; i++) {
        const descriptor = descriptors[String(i)];
        if (descriptor === undefined || !descriptor.enumerable || !Object.hasOwn(descriptor, "value")) {
          throw new TypeError("Wire: array indices must be enumerable data");
        }
        Object.defineProperty(copy, String(i), {
          value: capture(descriptor.value, remaining - 1), enumerable: true, writable: true, configurable: true,
        });
      }
      ancestors.delete(source);
      return copy;
    }
    const copy: Record<string, unknown> = Object.create(null);
    ancestors.add(source);
    captured.set(source, copy);
    for (let k = 0; k < keys.length; k++) {
      const key = keys[k];
      if (typeof key !== "string") throw new TypeError("Wire: symbol syntax key");
      const descriptor = descriptors[key];
      if (descriptor === undefined || !descriptor.enumerable || !Object.hasOwn(descriptor, "value")) {
        throw new TypeError("Wire: syntax properties must be enumerable data");
      }
      copy[key] = capture(descriptor.value, remaining - 1);
    }
    ancestors.delete(source);
    return copy;
  }
  try {
    return { ok: true, value: capture(value, depth) };
  } catch {
    return { ok: false, error: "Wire: invalid syntax data" };
  }
}
// Only called on the fresh checked snapshot. Never reads a source object,
// iterator or container toJSON, including Array.prototype.toJSON. String/key
// quoting uses JSON.stringify on primitives, never on a container or tree.
function serializeCheckedSyntax(value: unknown): string {
  if (value === null) return "null";
  if (typeof value === "string") return JSON.stringify(value);
  if (typeof value === "bigint") return value.toString();
  if (typeof value === "boolean") return value ? "true" : "false";
  if (Array.isArray(value)) {
    let text = "[";
    for (let i = 0; i < value.length; i++) {
      if (i !== 0) text += ",";
      text += serializeCheckedSyntax(value[i]);
    }
    return text + "]";
  }
  if (isRecord(value)) {
    const keys = Object.keys(value);
    let text = "{";
    for (let i = 0; i < keys.length; i++) {
      const key = keys[i];
      if (key === undefined) throw new TypeError("Wire: invalid checked key");
      if (i !== 0) text += ",";
      text += JSON.stringify(key) + ":" + serializeCheckedSyntax(value[key]);
    }
    return text + "}";
  }
  throw new TypeError("Wire: invalid checked syntax value");
}
function arrayValues(value: unknown, check: (value: unknown) => boolean): boolean {
  if (!Array.isArray(value)) return false;
  for (let i = 0; i < value.length; i++) if (!check(value[i])) return false;
  return true;
}
// The guard receives only captured own data or a parsed checked reply. Keys
// remain ordinary native object members, including __proto__ and integer keys.
// JS own-key enumeration may reorder integer keys; the linked Idris transport
// restores the sorted association representation, preserving the same mapping.
function dynamicObjectValues(value: unknown, check: (value: unknown) => boolean): boolean {
  return isRecord(value) && Object.keys(value).every(key => isScalar(key) && check(value[key]));
}
function objectKeys(value: Record<string, unknown>, allowed: readonly string[], required: readonly string[]): boolean {
  return Object.keys(value).every(key => allowed.includes(key)) && required.every(key => Object.hasOwn(value, key));
}
function isScalar(value: unknown): value is string {
  if (typeof value !== "string") return false;
  for (let i = 0; i < value.length; i++) {
    const point = value.charCodeAt(i);
    if (point >= 0xD800 && point <= 0xDBFF) {
      const next = value.charCodeAt(++i);
      if (!(next >= 0xDC00 && next <= 0xDFFF)) return false;
    } else if (point >= 0xDC00 && point <= 0xDFFF) return false;
  }
  return true;
}
function exactKeys(value: Record<string, unknown>, keys: readonly string[]): boolean {
  return Object.keys(value).length === keys.length && keys.every(key => Object.hasOwn(value, key));
}
function isNatural(value: unknown): value is NaturalSyntax {
  return isRecord(value) && exactKeys(value, ["kind", "token"])
    && value.kind === "integer" && typeof value.token === "string"
    && /^(0|[1-9][0-9]*)$/.test(value.token);
}
function isFiniteBinary64Syntax(value: unknown): value is FiniteBinary64Syntax {
  return isRecord(value) && exactKeys(value, ["kind", "bits"])
    && value.kind === "finite-binary64" && typeof value.bits === "string"
    && /^[0-9a-f]{16}$/.test(value.bits)
    && (BigInt("0x" + value.bits) & 0x7ff0000000000000n) !== 0x7ff0000000000000n;
}
function readResult<T>(text: string, check: (value: unknown) => value is T): WireResult<T> {
  // Canonical syntax numbers are fixed-width integers; recover their exact tokens.
  const reply: unknown = parseIntegerJSON(text, true);
  if (isRecord(reply) && reply.ok === false && typeof reply.error === "string") {
    return { ok: false, error: reply.error };
  }
  if (isRecord(reply) && reply.ok === true && check(reply.value)) {
    return { ok: true, value: reply.value };
  }
  throw new TypeError("Invalid checked wire transport reply");
}
// Checked finite DAG; optional means absent key, never explicit undefined.
export type IntegerBatchInputSyntax = { readonly "values": { readonly "signed": I64; readonly "unsigned": U64; }; readonly "signedValues": ReadonlyArray<I64>; readonly "unsignedValues": ReadonlyArray<U64>; readonly "optionalSigned"?: I64; readonly "nullableUnsigned": (U64 | null); };
export type IntegerBatchOutputSyntax = IntegerBatchInputSyntax;
export type IntegerBatchInputText = InputText<"Salutation.JSON.wireIntegerBatch">;
export type IntegerBatchOutputText = OutputText<"Salutation.JSON.wireIntegerBatch">;
// Private guard receives only captured data or parsed transport replies.
function checkIntegerBatchSyntaxData(value: unknown): value is IntegerBatchInputSyntax {
  return (isRecord(value) && objectKeys(value, ["values","signedValues","unsignedValues","optionalSigned","nullableUnsigned"], ["values","signedValues","unsignedValues","nullableUnsigned"]) && (((isRecord(value["values"]) && objectKeys(value["values"], ["signed","unsigned"], ["signed","unsigned"]) && ((isInteger64(value["values"]["signed"], true))) && ((isInteger64(value["values"]["unsigned"], false)))))) && ((arrayValues(value["signedValues"], wireArrayValue => isInteger64(wireArrayValue, true)))) && ((arrayValues(value["unsignedValues"], wireArrayValue => isInteger64(wireArrayValue, false)))) && (!Object.hasOwn(value, "optionalSigned") || (isInteger64(value["optionalSigned"], true))) && (((value["nullableUnsigned"] === null || (isInteger64(value["nullableUnsigned"], false))))));
}
// Returns the checked own-data snapshot, never narrows the source object.
export function checkIntegerBatchSyntax(source: unknown): WireResult<IntegerBatchInputSyntax> {
  const snapshot = snapshotSyntax(source, 4);
  if (!snapshot.ok) return snapshot;
  const value = snapshot.value;
  if (!checkIntegerBatchSyntaxData(value)) return { ok: false, error: "Wire: invalid syntax value" };
  return { ok: true, value };
}
// True means a valid snapshot can be captured; source reads may differ.
export function isIntegerBatchSyntax(value: unknown): boolean {
  return checkIntegerBatchSyntax(value).ok;
}
export function bindIntegerBatch(transport: WireTransport) {
  return {
    validateInput(text: string): WireResult<IntegerBatchInputText> {
      const checked = readResult(transport.toSyntax(text), checkIntegerBatchSyntaxData);
      if (!checked.ok) return checked;
      // The original text is branded only after the linked Idris decoder
      // accepts it and the generated guard accepts its syntax view.
      return { ok: true, value: text as IntegerBatchInputText };
    },
    toSyntax(text: string): WireResult<IntegerBatchInputSyntax> {
      return readResult(transport.toSyntax(text), checkIntegerBatchSyntaxData);
    },
    fromSyntax(value: IntegerBatchOutputSyntax): WireResult<IntegerBatchOutputText> {
      const snapshot = checkIntegerBatchSyntax(value);
      if (!snapshot.ok) return snapshot;
      // The output brand relies on the linked checked Idris encoder;
      // only the checked data snapshot is serialized and sent to it.
      return readResult(transport.fromSyntax(serializeCheckedSyntax(snapshot.value)),
        (text: unknown): text is IntegerBatchOutputText => typeof text === "string");
    }
  };
}
