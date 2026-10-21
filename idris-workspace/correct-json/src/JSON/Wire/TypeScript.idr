module JSON.Wire.TypeScript

import JSON
import JSON.Wire.Description
import JSON.Wire.Check
import JSON.Wire.Codec
import JSON.Wire.Numeric
import Data.String

public export
data TsProfile = CanonicalGraphSyntax | NativeJSONNumbers

%default total

header : String
header = """
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

"""

quote : String -> String
quote = show . JString

fieldType : FieldKind -> String
fieldType Natural = "NaturalSyntax"
fieldType Text = "string"

fieldCheck : WireField -> String
fieldCheck field = case field.kind of
  Natural => "isNatural(value[" ++ quote field.wireName ++ "])"
  Text => "typeof value[" ++ quote field.wireName ++ "] === \"string\""

renderBinding : String -> String
renderBinding name =
  "export function bind" ++ name ++ "(transport: WireTransport) {\n" ++
    "  return {\n" ++
    "    validateInput(text: string): WireResult<" ++ name ++ "InputText> {\n" ++
    "      const checked = readResult(transport.toSyntax(text), check" ++ name ++ "SyntaxData);\n" ++
    "      if (!checked.ok) return checked;\n" ++
    "      // The original text is branded only after the linked Idris decoder\n" ++
    "      // accepts it and the generated guard accepts its syntax view.\n" ++
    "      return { ok: true, value: text as " ++ name ++ "InputText };\n    },\n" ++
    "    toSyntax(text: string): WireResult<" ++ name ++ "InputSyntax> {\n" ++
    "      return readResult(transport.toSyntax(text), check" ++ name ++ "SyntaxData);\n    },\n" ++
    "    fromSyntax(value: " ++ name ++ "OutputSyntax): WireResult<" ++ name ++ "OutputText> {\n" ++
    "      const snapshot = check" ++ name ++ "Syntax(value);\n" ++
    "      if (!snapshot.ok) return snapshot;\n" ++
    "      // The output brand relies on the linked checked Idris encoder;\n" ++
    "      // only the checked data snapshot is serialized and sent to it.\n" ++
    "      return readResult(transport.fromSyntax(serializeCheckedSyntax(snapshot.value)),\n" ++
    "        (text: unknown): text is " ++ name ++ "OutputText => typeof text === \"string\");\n" ++
    "    }\n  };\n}\n"

||| The runtime guards are generated from the same fields as the declarations.
||| Public representation has no dependency on Idris compiler object layout.
export
renderTypeScript : CheckedRecord -> String
renderTypeScript checked =
  let d = description checked
      name = d.exportName
      fields = concatMap (\field => "  readonly " ++ quote field.wireName ++ ": " ++ fieldType field.kind ++ ";\n") d.fields
      keys = show (JArray (map (JString . wireName) d.fields))
      checks = concatMap (\field => "\n    && " ++ fieldCheck field) d.fields
  in header ++
    "export type " ++ name ++ "InputSyntax = {\n" ++ fields ++ "};\n" ++
    "export type " ++ name ++ "OutputSyntax = " ++ name ++ "InputSyntax;\n" ++
    "export type " ++ name ++ "InputText = InputText<" ++ quote d.typeId ++ ">;\n" ++
    "export type " ++ name ++ "OutputText = OutputText<" ++ quote d.typeId ++ ">;\n" ++
    "// Private guard receives only captured data or parsed transport replies.\n" ++
    "function check" ++ name ++ "SyntaxData(value: unknown): value is " ++ name ++ "InputSyntax {\n" ++
    "  return isRecord(value) && exactKeys(value, " ++ keys ++ ")" ++ checks ++ ";\n}\n" ++
    "// Returns the checked own-data snapshot, never narrows the source object.\n" ++
    "export function check" ++ name ++ "Syntax(source: unknown): WireResult<" ++ name ++ "InputSyntax> {\n" ++
    "  const snapshot = snapshotSyntax(source, 2);\n" ++
    "  if (!snapshot.ok) return snapshot;\n" ++
    "  const value = snapshot.value;\n" ++
    "  if (!check" ++ name ++ "SyntaxData(value)) return { ok: false, error: \"Wire: invalid syntax value\" };\n" ++
    "  return { ok: true, value };\n}\n" ++
    "// True means a valid snapshot can be captured; source reads may differ.\n" ++
    "export function is" ++ name ++ "Syntax(value: unknown): boolean {\n" ++
    "  return check" ++ name ++ "Syntax(value).ok;\n}\n" ++
    renderBinding name

data Direction = Input | Output

naturalLexical : Direction -> String
naturalLexical Input = "integer-literal"
naturalLexical Output = "canonical-natural-literal"

-- Manifest construction uses the same canonical AST and checked boundary.
mString : String -> Either String JSON
mString = Right . JString
mInteger : Integer -> Either String JSON
mInteger = Right . JInteger
mBool : Bool -> Either String JSON
mBool = Right . JBool
mArray : List (Either String JSON) -> Either String JSON
mArray values = map JArray (sequence values)
mObject : List (String, Either String JSON) -> Either String JSON
mObject fields = do
  values <- traverse (\(key, result) => map (key,) result) fields
  objectFromLegacyPairs values

kindJSON : Direction -> FieldKind -> Either String JSON
kindJSON direction Natural = mObject
  [("kind", mString "natural"), ("lexical", mString (naturalLexical direction)),
   ("host", mString "canonical-integer-token"), ("minimum", mString "0")]
kindJSON _ Text = mObject [("kind", mString "string"), ("stringDomain", mString "utf16-code-units")]

fieldJSON : Direction -> WireField -> Either String JSON
fieldJSON direction field = mObject
  [("source", mString field.sourceName), ("key", mString field.wireName),
   ("required", mBool True), ("nullable", mBool False), ("value", kindJSON direction field.kind)]

export
renderManifest : CheckedRecord -> Either String String
renderManifest checked =
  let d = description checked
      shape = \direction => mObject [("kind", mString "object"), ("unknownFields", mString "reject"),
        ("duplicateKeys", mString "reject"), ("fields", mArray (map (fieldJSON direction) d.fields))]
  in (mObject [("descriptionVersion", mString "w1-strict-record-v1"),
    ("typeId", mString d.typeId), ("exportName", mString d.exportName),
    ("profile", mString "canonical-record-syntax-v1"),
    ("input", shape Input), ("output", shape Output)]) >>= encodeJSONValue

shapeType : Nat -> ValueShape -> String
shapeType 0 _ = "never"
shapeType (S _) NullValue = "null"
shapeType (S _) BooleanValue = "boolean"
shapeType (S _) NeverValue = "never"
shapeType (S fuel) (UntaggedValue ExactlyOne arms) = "(" ++ joinBy " | " (map (\(_, shape) => shapeType fuel shape) arms) ++ ")"
shapeType (S fuel) (TaggedValue _ arms) = "(" ++ joinBy " | " (map (\(_, shape) => shapeType fuel shape) arms) ++ ")"
shapeType (S _) NaturalValue = "NaturalSyntax"
shapeType (S _) (BoundNaturalValue _) = "NaturalSyntax"
shapeType (S _) (FiniteBinary64Value ECMAScriptBinary64) = "FiniteBinary64Syntax"
shapeType (S _) (Integer64Value Signed64) = "I64"
shapeType (S _) (Integer64Value Unsigned64) = "U64"
shapeType (S _) StringValue = "string"
shapeType (S _) ScalarValue = "string"
shapeType (S _) (EnumValue tags) = joinBy " | " (map quote tags)
shapeType (S fuel) (NullableValue shape) = "(" ++ shapeType fuel shape ++ " | null)"
shapeType (S fuel) (ArrayValue shape) = "ReadonlyArray<" ++ shapeType fuel shape ++ ">"
shapeType (S fuel) (DynamicObjectValue shape) = "Readonly<Record<string, " ++ shapeType fuel shape ++ ">>"
shapeType (S fuel) (ObjectValue fields) = "{ " ++ concatMap (\(key, optional, shape) =>
  "readonly " ++ quote key ++ (if optional then "?: " else ": ") ++ shapeType fuel shape ++ "; ") fields ++ "}"

kindGuard : RepresentationKind -> String -> String
kindGuard NullKind value = value ++ " === null"
kindGuard BooleanKind value = "typeof " ++ value ++ " === \"boolean\""
kindGuard NumberKind value = "(typeof " ++ value ++ " === \"number\" || typeof " ++ value ++ " === \"bigint\")"
kindGuard StringKind value = "typeof " ++ value ++ " === \"string\""
kindGuard ArrayKind value = "Array.isArray(" ++ value ++ ")"
kindGuard ObjectKind value = "isRecord(" ++ value ++ ")"

shapeGuard : Nat -> ValueShape -> String -> String
shapeGuard 0 _ _ = "false"
shapeGuard (S _) NullValue value = value ++ " === null"
shapeGuard (S _) BooleanValue value = "typeof " ++ value ++ " === \"boolean\""
shapeGuard (S _) NeverValue _ = "false"
shapeGuard (S fuel) (UntaggedValue ExactlyOne arms) value = "(" ++ joinBy " || "
  (map (\(_, shape) => "((" ++ (case representationKinds CanonicalRepresentation shape of
    [] => "false"
    kinds => joinBy " || " (map (\kind => kindGuard kind value) kinds)) ++ ") && (" ++ shapeGuard fuel shape value ++ "))") arms) ++ ")"
shapeGuard (S fuel) (TaggedValue _ arms) value = "(" ++ joinBy " || " (map (\(_, shape) => shapeGuard fuel shape value) arms) ++ ")"
shapeGuard (S _) NaturalValue value = "isNatural(" ++ value ++ ")"
shapeGuard (S _) (BoundNaturalValue rules) value = "(isNatural(" ++ value ++ ") && BigInt(" ++ value ++ ".token) <= BigInt(" ++ quote (show rules.upper) ++ "))"
shapeGuard (S _) (FiniteBinary64Value ECMAScriptBinary64) value = "isFiniteBinary64Syntax(" ++ value ++ ")"
shapeGuard (S _) (Integer64Value Signed64) value = "isInteger64(" ++ value ++ ", true)"
shapeGuard (S _) (Integer64Value Unsigned64) value = "isInteger64(" ++ value ++ ", false)"
shapeGuard (S _) StringValue value = "typeof " ++ value ++ " === \"string\""
shapeGuard (S _) ScalarValue value = "isScalar(" ++ value ++ ")"
shapeGuard (S _) (EnumValue tags) value = "(" ++ joinBy " || " (map (\tag => value ++ " === " ++ quote tag) tags) ++ ")"
shapeGuard (S fuel) (NullableValue shape) value = "(" ++ value ++ " === null || (" ++ shapeGuard fuel shape value ++ "))"
shapeGuard (S fuel) (ArrayValue shape) value =
  "arrayValues(" ++ value ++ ", wireArrayValue => " ++ shapeGuard fuel shape "wireArrayValue" ++ ")"
shapeGuard (S fuel) (DynamicObjectValue shape) value =
  "dynamicObjectValues(" ++ value ++ ", wireAssocValue => " ++ shapeGuard fuel shape "wireAssocValue" ++ ")"
shapeGuard (S fuel) (ObjectValue fields) value =
  let keys = show (JArray (map (\(key, _, _) => JString key) fields))
      required = show (JArray (map (\(key, _, _) => JString key) (filter (\(_, optional, _) => not optional) fields)))
      checks = concatMap (\(key, optional, shape) =>
        " && (" ++ (if optional then "!Object.hasOwn(" ++ value ++ ", " ++ quote key ++ ") || (" else "(")
        ++ shapeGuard fuel shape (value ++ "[" ++ quote key ++ "]") ++ "))") fields
  in "(isRecord(" ++ value ++ ") && objectKeys(" ++ value ++ ", " ++ keys ++ ", " ++ required ++ ")" ++ checks ++ ")"

export
renderGraphTypeScript : CheckedGraph -> String
renderGraphTypeScript checked =
  let graph = graphDescription checked
      root = Data.List.find (\d => d.identity == graph.root) graph.definitions
      name = maybe "InvalidRoot" tsName root
      fuel = shapeDepth (graphShape checked)
      shape = graphShape checked
  in header ++
    "// Checked finite DAG; optional means absent key, never explicit undefined.\n" ++
    "export type " ++ name ++ "InputSyntax = " ++ shapeType fuel shape ++ ";\n" ++
    "export type " ++ name ++ "OutputSyntax = " ++ name ++ "InputSyntax;\n" ++
    "export type " ++ name ++ "InputText = InputText<" ++ quote graph.root ++ ">;\n" ++
    "export type " ++ name ++ "OutputText = OutputText<" ++ quote graph.root ++ ">;\n" ++
    "// Private guard receives only captured data or parsed transport replies.\n" ++
    "function check" ++ name ++ "SyntaxData(value: unknown): value is " ++ name ++ "InputSyntax {\n" ++
    "  return " ++ shapeGuard fuel shape "value" ++ ";\n}\n" ++
    "// Returns the checked own-data snapshot, never narrows the source object.\n" ++
    "export function check" ++ name ++ "Syntax(source: unknown): WireResult<" ++ name ++ "InputSyntax> {\n" ++
    "  const snapshot = snapshotSyntax(source, " ++ show (Prelude.S fuel) ++ ");\n" ++
    "  if (!snapshot.ok) return snapshot;\n" ++
    "  const value = snapshot.value;\n" ++
    "  if (!check" ++ name ++ "SyntaxData(value)) return { ok: false, error: \"Wire: invalid syntax value\" };\n" ++
    "  return { ok: true, value };\n}\n" ++
    "// True means a valid snapshot can be captured; source reads may differ.\n" ++
    "export function is" ++ name ++ "Syntax(value: unknown): boolean {\n" ++
    "  return check" ++ name ++ "Syntax(value).ok;\n}\n" ++ renderBinding name

numericJSON : NumericBinding -> Either String JSON
numericJSON rules = mObject
  [("kind", mString "bounded-natural"), ("upper", mString (show rules.upper)),
   ("interpretation", mString "exact-integral-decimal"),
   ("inputLexical", mString "json-number"), ("outputLexical", mString "canonical-natural-literal"),
   ("negativeZero", mString (case rules.negativeZero of NormalizeNegativeZero => "normalize"; RejectNegativeZero => "reject")),
   ("nativeView", mString (case rules.nativeView of CanonicalOnly => "canonical-only"; SafeIntegerNumber => "safe-integer-number"))]

integer64JSON : Integer64Kind -> Either String JSON
integer64JSON kind =
  let (lower, upper) = integer64Bounds kind in
    mObject [("kind", mString (if kind == Signed64 then "i64" else "u64")),
      ("minimum", mString (show lower)), ("maximum", mString (show upper)),
      ("inputLexical", mString "integer-literal"), ("nativeView", mString "bigint")]

binary64JSON : Binary64Policy -> Either String JSON
binary64JSON ECMAScriptBinary64 = mObject
  [("kind", mString "finite-binary64"), ("interpretation", mString "ecmascript-number-value"),
   ("executableBackend", mString "javascript"), ("inputLexical", mString "json-number"),
   ("outputLexical", mString "ecmascript-shortest-roundtrip-with-negative-zero"),
   ("negativeZero", mString "preserve"), ("underflow", mString "preserve-result-sign"),
   ("nonFinite", mString "reject"), ("nativeView", mString "finite-number"),
   ("canonicalKind", mString "finite-binary64"), ("canonicalBits", mString "16-lowercase-hex-digits-finite-exponent")]

mutual
  exprJSON : TypeExpr -> Either String JSON
  exprJSON (BoundNaturalType rules) = numericJSON rules
  exprJSON NullaryPayload = mObject [("kind", mString "absent-payload")]
  exprJSON NaturalType = mObject [("kind", mString "natural")]
  exprJSON (Integer64Type kind) = integer64JSON kind
  exprJSON StringType = mObject [("kind", mString "string")]
  exprJSON (Parameter index) = mObject [("parameter", mInteger (cast index))]
  exprJSON (Reference name arguments) = mObject [("ref", mString name), ("arguments", mArray (expressionsJSON arguments))]

  expressionsJSON : List TypeExpr -> List (Either String JSON)
  expressionsJSON [] = []
  expressionsJSON (value :: rest) = exprJSON value :: expressionsJSON rest

definitionJSON : TypeDefinition -> Either String JSON
definitionJSON d = mObject [("identity", mString d.identity), ("exportName", mString d.tsName),
  ("parameters", mInteger (cast d.parameterCount)), ("shape", bodyJSON d.body)]
  where
    bodyJSON : DefinitionShape -> Either String JSON
    bodyJSON (RecordBody constructor fields) = mObject [("kind", mString "record"), ("constructor", mString constructor),
      ("fields", mArray (map (\f => mObject [("source", mString f.source), ("key", mString f.key), ("type", exprJSON f.valueType)]) fields))]
    bodyJSON (StringEnum tags) = mObject [("kind", mString "string-enum"),
      ("arms", mArray (map (\(ctor, tag) => mObject [("constructor", mString ctor), ("tag", mString tag)]) tags))]
    bodyJSON (BooleanBody false true) = mObject [("kind", mString "boolean"),
      ("false", mString false), ("true", mString true)]
    bodyJSON EmptyBody = mObject [("kind", mString "never")]
    bodyJSON SortedAssocBody = mObject [("kind", mString "sorted-assoc-template"), ("parameter", mInteger 0),
      ("keyDomain", mString "unicode-scalars"), ("duplicateKeys", mString "reject"), ("canonicalRepresentationOrder", mString "scalar-codepoint-sorted"), ("objectKeyOrder", mString "irrelevant")]
    bodyJSON (ListBody empty full) = mObject [("kind", mString "list-template"), ("parameter", mInteger 0),
      ("empty", mString empty), ("cons", mString full)]
    bodyJSON (PresenceBody absent present) = mObject [("kind", mString "presence-template"), ("parameter", mInteger 0),
      ("absent", mString absent), ("present", mString present)]
    bodyJSON (NullableBody null value) = mObject [("kind", mString "nullable-template"), ("parameter", mInteger 0),
      ("null", mString null), ("value", mString value)]
    bodyJSON (ClosedNullableBody null value payload) = mObject [("kind", mString "closed-nullable"),
      ("nullConstructor", mString null), ("valueConstructor", mString value), ("payload", exprJSON payload)]
    bodyJSON (UpdateBody keep replace clear) = mObject [("kind", mString "update-field-template"),
      ("keep", mString keep), ("replace", mString replace), ("clear", mString clear)]
    bodyJSON (AbsentNullBody absent null) = mObject [("kind", mString "absent-null-field"),
      ("absent", mString absent), ("null", mString null)]
    bodyJSON (InternalTagBody key arms) = mObject [("kind", mString "internally-tagged"), ("key", mString key),
      ("arms", mArray (map (\(ctor, tag, payload) => mObject [("constructor", mString ctor), ("tag", mString tag), ("payload", exprJSON payload)]) arms))]
    bodyJSON (UntaggedBody ExactlyOne arms) = mObject [("kind", mString "untagged"),
      ("mode", mString "exactly-one"),
      ("arms", mArray (map (\(constructor, payload) => mObject [("constructor", mString constructor),
        ("payload", exprJSON payload)]) arms))]
    bodyJSON ScalarBody = mObject [("kind", mString "custom-string"), ("stringDomain", mString "unicode-scalars")]
    bodyJSON (FiniteBinary64Body policy) = binary64JSON policy

shapeJSON : Nat -> Direction -> ValueShape -> Either String JSON
shapeJSON 0 _ _ = mObject [("unsupported", mBool True)]
shapeJSON (S _) _ NullValue = mObject [("kind", mString "null")]
shapeJSON (S _) _ BooleanValue = mObject [("kind", mString "boolean")]
shapeJSON (S _) _ NeverValue = mObject [("kind", mString "never")]
shapeJSON (S fuel) direction (UntaggedValue ExactlyOne arms) = mObject [("kind", mString "untagged"),
  ("mode", mString "exactly-one"),
  ("arms", mArray (map (\(constructor, shape) => mObject [("constructor", mString constructor),
    ("value", shapeJSON fuel direction shape)]) arms))]
shapeJSON (S fuel) direction (TaggedValue key arms) = mObject [("kind", mString "internally-tagged"),
  ("key", mString key), ("unknownFields", mString "reject"), ("duplicateKeys", mString "reject"),
  ("arms", mArray (map (\(tag, shape) => mObject [("tag", mString tag), ("value", shapeJSON fuel direction shape)]) arms))]
shapeJSON (S _) _ (BoundNaturalValue rules) = numericJSON rules
shapeJSON (S _) _ (FiniteBinary64Value policy) = binary64JSON policy
shapeJSON (S _) direction NaturalValue = kindJSON direction Natural
shapeJSON (S _) _ (Integer64Value kind) = integer64JSON kind
shapeJSON (S _) _ StringValue = kindJSON Input Text
shapeJSON (S _) _ ScalarValue = mObject [("kind", mString "string"), ("stringDomain", mString "unicode-scalars")]
shapeJSON (S _) _ (EnumValue tags) = mObject [("kind", mString "string-enum"), ("tags", mArray (map mString tags))]
shapeJSON (S fuel) direction (NullableValue shape) = mObject [("kind", mString "nullable"), ("value", shapeJSON fuel direction shape)]
shapeJSON (S fuel) direction (ArrayValue shape) = mObject [("kind", mString "array"),
  ("items", shapeJSON fuel direction shape), ("order", mString "preserve")]
shapeJSON (S fuel) direction (DynamicObjectValue shape) = mObject [("kind", mString "dynamic-object"),
  ("keyDomain", mString "unicode-scalars"), ("duplicateKeys", mString "reject"),
  ("canonicalRepresentationOrder", mString "scalar-codepoint-sorted"), ("objectKeyOrder", mString "irrelevant"), ("value", shapeJSON fuel direction shape)]
shapeJSON (S fuel) direction (ObjectValue fields) = mObject [("kind", mString "object"), ("unknownFields", mString "reject"),
  ("duplicateKeys", mString "reject"), ("fields", mArray (map (\(key, optional, shape) => mObject
    [("key", mString key), ("required", mBool (not optional)), ("absence", mString (if optional then "omit" else "reject")),
     ("value", shapeJSON fuel direction shape)]) fields))]

referenceOriginJSON : ReferenceOrigin -> Either String JSON
referenceOriginJSON origin = mObject
  [("argumentPath", mArray (map (mInteger . cast) origin.referencePath)),
   ("originalType", exprJSON origin.originalReference),
   ("normalizedType", exprJSON origin.normalizedReference),
   ("fullApplicationKey", mString origin.referenceApplicationKey),
   ("selectedWireIdentity", mString origin.selectedWireIdentity)]

definitionOriginJSON : DefinitionOrigin -> Either String JSON
definitionOriginJSON origin = mObject
  [("wireIdentity", mString origin.originWireIdentity),
   ("sourceAlias", mString origin.originSource.sourceAlias),
   ("fullApplication", exprJSON origin.originSource.sourceApplication),
   ("fullApplicationKey", mString origin.originSource.sourceApplicationKey),
   ("fields", mArray (map (\field => mObject
     [("source", mString field.fieldSource), ("originalType", exprJSON field.fieldOriginalType),
      ("references", mArray (map referenceOriginJSON field.fieldReferences))]) origin.originFields)),
   ("arms", mArray (map (\arm => mObject
     [("constructor", mString arm.armSource), ("originalType", exprJSON arm.armOriginalType),
      ("references", mArray (map referenceOriginJSON arm.armReferences))]) origin.originArms))]

export
renderGraphManifest : CheckedGraph -> Either String String
renderGraphManifest checked =
  let graph = graphDescription checked
      fuel = shapeDepth (graphShape checked)
      rule = case graph.rootRule of
        Component => mObject [("kind", mString "component")]
        FixedTag key value => mObject [("kind", mString "fixed-tag-payload"), ("key", mString key), ("value", mString value)]
  in (mObject ([("descriptionVersion", mString "w3-finite-sequence-graph-v1"),
    ("profile", mString "canonical-graph-syntax-v1"), ("root", mString graph.root), ("rootRule", rule),
    ("definitions", mArray (map definitionJSON graph.definitions)),
    ("input", shapeJSON fuel Input (graphShape checked)), ("output", shapeJSON fuel Output (graphShape checked))] ++
    if null (graphOrigins checked) then []
      else [("origins", mArray (map definitionOriginJSON (graphOrigins checked)))])) >>= encodeJSONValue

nativeCapability : Nat -> ValueShape -> Either String ()
nativeCapability 0 _ = Left "Wire native profile: shape depth exhausted"
nativeCapability (S _) NaturalValue = Left "Wire native profile: unbound Nat needs an explicit numeric binding"
nativeCapability (S _) (FiniteBinary64Value ECMAScriptBinary64) = Right ()
nativeCapability (S _) (BoundNaturalValue rules) = case rules.nativeView of
  CanonicalOnly => Left "Wire native profile: numeric binding is canonical-only"
  SafeIntegerNumber => if rules.upper > 9007199254740991
    then Left "Wire native profile: upper exceeds safe integer number capability" else Right ()
nativeCapability (S fuel) (ArrayValue shape) = nativeCapability fuel shape
nativeCapability (S fuel) (DynamicObjectValue shape) = nativeCapability fuel shape
nativeCapability (S fuel) (NullableValue shape) = nativeCapability fuel shape
nativeCapability (S fuel) (ObjectValue fields) = traverse_ (\(_, _, shape) => nativeCapability fuel shape) fields
nativeCapability (S fuel) (UntaggedValue ExactlyOne arms) = traverse_ (\(_, shape) => nativeCapability fuel shape) arms
nativeCapability (S fuel) (TaggedValue _ arms) = traverse_ (\(_, shape) => nativeCapability fuel shape) arms
nativeCapability _ _ = Right ()

nativeType : Nat -> ValueShape -> String
nativeType 0 _ = "never"
nativeType (S _) (BoundNaturalValue _) = "number"
nativeType (S _) (FiniteBinary64Value ECMAScriptBinary64) = "number"
nativeType (S fuel) (DynamicObjectValue shape) = "Readonly<Record<string, " ++ nativeType fuel shape ++ ">>"
nativeType (S fuel) (ArrayValue shape) = "ReadonlyArray<" ++ nativeType fuel shape ++ ">"
nativeType (S fuel) (NullableValue shape) = "(" ++ nativeType fuel shape ++ " | null)"
nativeType (S fuel) (UntaggedValue ExactlyOne arms) = "(" ++ joinBy " | " (map (\(_, shape) => nativeType fuel shape) arms) ++ ")"
nativeType (S fuel) (TaggedValue _ arms) = "(" ++ joinBy " | " (map (\(_, shape) => nativeType fuel shape) arms) ++ ")"
nativeType (S fuel) (ObjectValue fields) = "{ " ++ concatMap (\(key, optional, shape) =>
  "readonly " ++ quote key ++ (if optional then "?: " else ": ") ++ nativeType fuel shape ++ "; ") fields ++ "}"
nativeType fuel shape = shapeType fuel shape

nativeHeader : String
nativeHeader = """
// Native numeric fields are never parsed with JSON.parse before Idris checks.
// The caller supplies the real linked Idris transport. Reply guards validate
// data, not the provenance or execution of an arbitrary substituted transport.
interface NativeShape {
  readonly [key: string]: unknown;
  readonly kind: string; readonly upper?: string; readonly negativeZero?: string;
  readonly stringDomain?: string; readonly tags?: readonly string[];
  readonly value?: NativeShape; readonly items?: NativeShape; readonly key?: string;
  readonly fields?: readonly { readonly [key: string]: unknown; readonly key: string; readonly required: boolean; readonly value: NativeShape }[];
  readonly arms?: readonly { readonly tag?: string; readonly constructor?: unknown; readonly value: NativeShape }[];
}
function snapshotNative(value: unknown, depth: number): WireResult<unknown> {
  return snapshotSyntax(value, depth, true);
}
// Kind selection is separate from child validity and uses the input profile.
// These helpers only inspect captured data; they never trial-decode children.
function representationKind(value: unknown): string {
  if (value === null) return "null";
  if (Array.isArray(value)) return "array";
  return typeof value === "object" ? "object" : typeof value;
}
function representationKinds(shape: NativeShape, toSyntax: boolean): readonly string[] {
  switch (shape.kind) {
    case "natural": case "bounded-natural": case "finite-binary64":
      return [toSyntax ? "number" : "object"];
    case "i64": case "u64": return ["bigint"];
    case "string": case "string-enum": return ["string"];
    case "null": return ["null"];
    case "boolean": return ["boolean"];
    case "never": return [];
    case "array": return ["array"];
    case "object": case "dynamic-object": case "internally-tagged": return ["object"];
    case "nullable":
      if (shape.value !== undefined) return ["null", ...representationKinds(shape.value, toSyntax)];
      break;
    case "untagged":
      if (shape.arms !== undefined) return shape.arms.flatMap(arm => representationKinds(arm.value, toSyntax));
      break;
  }
  throw new TypeError("Wire: invalid representation shape");
}
// Rebuild every occurrence. Capturing a shared source once is safe; caching a
// conversion by object identity would mix rules on distinct occurrence paths.
function convertNative(shape: NativeShape, value: unknown, toSyntax: boolean): unknown {
  switch (shape.kind) {
    case "untagged": {
      const kind = representationKind(value);
      const matches = shape.arms?.filter(arm => representationKinds(arm.value, toSyntax).includes(kind));
      if (matches?.length !== 1) throw new TypeError("Wire: no unique untagged representation");
      const arm = matches[0];
      if (arm === undefined) throw new TypeError("Wire: no unique untagged representation");
      return convertNative(arm.value, value, toSyntax);
    }
    case "i64": case "u64": {
      if (isInteger64(value, shape.kind === "i64")) return value;
      throw new TypeError("Wire: invalid 64-bit integer");
    }
    case "finite-binary64": {
      // Number/DataView implement the explicitly selected ECMAScript policy.
      // No float arithmetic or JSON.stringify is used, including for -0.
      const view = new DataView(new ArrayBuffer(8));
      if (toSyntax) {
        if (typeof value !== "number" || !Number.isFinite(value)) throw new TypeError("Wire: invalid finite native number");
        view.setFloat64(0, value, false);
        return { kind: "finite-binary64", bits: view.getBigUint64(0, false).toString(16).padStart(16, "0") };
      }
      if (!isFiniteBinary64Syntax(value)) throw new TypeError("Wire: invalid finite bits reply");
      view.setBigUint64(0, BigInt("0x" + value.bits), false);
      return view.getFloat64(0, false);
    }
    case "bounded-natural": {
      if (shape.upper === undefined) throw new TypeError("Wire: missing numeric upper");
      const upper = BigInt(shape.upper);
      if (toSyntax) {
        if (typeof value !== "number" || !Number.isSafeInteger(value) || value < 0
            || (shape.negativeZero === "reject" && Object.is(value, -0)) || BigInt(value) > upper) {
          throw new TypeError("Wire: invalid native natural number");
        }
        return { kind: "integer", token: String(value) };
      }
      if (!isNatural(value)) throw new TypeError("Wire: invalid canonical natural reply");
      const exact = BigInt(value.token);
      if (exact > upper || exact > 9007199254740991n) throw new TypeError("Wire: unsafe native natural reply");
      return Number(value.token);
    }
    case "null": if (value === null) return null; break;
    case "boolean": if (typeof value === "boolean") return value; break;
    case "never": break;
    case "string":
      if (typeof value === "string" && (shape.stringDomain !== "unicode-scalars" || isScalar(value))) return value;
      break;
    case "string-enum": if (typeof value === "string" && shape.tags?.includes(value)) return value; break;
    case "nullable":
      if (value === null) return null;
      if (shape.value !== undefined) return convertNative(shape.value, value, toSyntax);
      break;
    case "array":
      if (Array.isArray(value) && shape.items !== undefined) {
        const copy: unknown[] = [];
        for (let i = 0; i < value.length; i++) {
          Object.defineProperty(copy, String(i), {
            value: convertNative(shape.items, value[i], toSyntax), enumerable: true, writable: true, configurable: true,
          });
        }
        return copy;
      }
      break;
    case "internally-tagged":
      if (isRecord(value) && shape.key !== undefined) {
        const arm = shape.arms?.find(arm => arm.tag === value[shape.key!]);
        if (arm !== undefined) return convertNative(arm.value, value, toSyntax);
      }
      break;
    case "dynamic-object":
      if (isRecord(value) && shape.value !== undefined) {
        const copy: Record<string, unknown> = Object.create(null);
        for (const key of Object.keys(value)) {
          if (!isScalar(key)) throw new TypeError("Wire: isolated surrogate object key");
          Object.defineProperty(copy, key, {
            value: convertNative(shape.value, value[key], toSyntax), enumerable: true, writable: true, configurable: true,
          });
        }
        return copy;
      }
      break;
    case "object":
      if (isRecord(value) && shape.fields !== undefined) {
        const fields = shape.fields;
        if (!objectKeys(value, fields.map(field => field.key), fields.filter(field => field.required).map(field => field.key))) break;
        const copy: Record<string, unknown> = Object.create(null);
        for (const field of fields) if (Object.hasOwn(value, field.key)) {
          copy[field.key] = convertNative(field.value, value[field.key], toSyntax);
        }
        return copy;
      }
      break;
  }
  throw new TypeError("Wire: invalid native shape value");
}

"""

renderNative : CheckedGraph -> Either String String
renderNative checked = do
  let graph = graphDescription checked
      name = maybe "InvalidRoot" tsName (find (\d => d.identity == graph.root) graph.definitions)
      shape = graphShape checked
      fuel = shapeDepth shape
  serializedShape <- shapeJSON fuel Input shape >>= encodeJSONValue
  pure (renderGraphTypeScript checked ++ nativeHeader ++
    "const nativeShape: NativeShape = " ++ serializedShape ++ ";\n" ++
    "export type " ++ name ++ "NativeInput = " ++ nativeType fuel shape ++ ";\n" ++
    "export type " ++ name ++ "NativeOutput = " ++ name ++ "NativeInput;\n" ++
    "export type " ++ name ++ "NativeInputText = " ++ name ++ "InputText;\n" ++
    "export type " ++ name ++ "NativeOutputText = " ++ name ++ "OutputText;\n" ++
    "export function check" ++ name ++ "Native(source: unknown): WireResult<" ++ name ++ "NativeInput> {\n" ++
    "  const snapshot = snapshotNative(source, " ++ show (Prelude.S fuel) ++ ");\n" ++
    "  if (!snapshot.ok) return snapshot;\n" ++
    "  try {\n" ++
    "    const syntax = convertNative(nativeShape, snapshot.value, true);\n" ++
    "    return { ok: true, value: convertNative(nativeShape, syntax, false) as " ++ name ++ "NativeInput };\n" ++
    "  } catch { return { ok: false, error: \"Wire: invalid native value\" }; }\n}\n" ++
    "export function bind" ++ name ++ "Native(transport: WireTransport) {\n" ++
    "  const decode = (text: string): WireResult<" ++ name ++ "NativeInput> => {\n" ++
    "    const checked = readResult(transport.toSyntax(text), check" ++ name ++ "SyntaxData);\n" ++
    "    if (!checked.ok) return checked;\n" ++
    "    return { ok: true, value: convertNative(nativeShape, checked.value, false) as " ++ name ++ "NativeInput };\n" ++
    "  };\n" ++
    "  return { decode,\n" ++
    "    validateInput(text: string): WireResult<" ++ name ++ "NativeInputText> {\n" ++
    "      const checked = decode(text);\n" ++
    "      return checked.ok ? { ok: true, value: text as " ++ name ++ "NativeInputText } : checked;\n" ++
    "    },\n" ++
    "    encode(value: " ++ name ++ "NativeOutput): WireResult<" ++ name ++ "NativeOutputText> {\n" ++
    "      const checked = check" ++ name ++ "Native(value);\n" ++
    "      if (!checked.ok) return checked;\n" ++
    "      const syntax = convertNative(nativeShape, checked.value, true);\n" ++
    "      return readResult(transport.fromSyntax(serializeCheckedSyntax(syntax)),\n" ++
    "        (text: unknown): text is " ++ name ++ "NativeOutputText => typeof text === \"string\");\n" ++
    "    }\n  };\n}\n")

export
renderGraphTypeScriptFor : TsProfile -> CheckedGraph -> Either String String
renderGraphTypeScriptFor CanonicalGraphSyntax checked = Right (renderGraphTypeScript checked)
renderGraphTypeScriptFor NativeJSONNumbers checked = do
  nativeCapability (shapeDepth (graphShape checked)) (graphShape checked)
  renderNative checked

export
renderGraphManifestFor : TsProfile -> CheckedGraph -> Either String String
renderGraphManifestFor CanonicalGraphSyntax checked = renderGraphManifest checked
renderGraphManifestFor NativeJSONNumbers checked = do
  nativeCapability (shapeDepth (graphShape checked)) (graphShape checked)
  canonical <- renderGraphManifest checked
  case parseJSON Virtual canonical of
    Right (JsonObject fields) => do
      rebuilt <- traverseAssocWithKey (\key, value => Right (if scalarValue key == "profile" then JString "native-json-number-v1" else value)) fields
      encodeJSONValue (JsonObject rebuilt)
    _ => Left "Wire native profile: invalid generated manifest"
