import assert from "node:assert/strict";
import test from "node:test";
import { libsalutation } from "@template/libsalutation";
import type { IntegerBatch } from "@template/libsalutation/types";
import {
  bindIntegerBatch,
  checkIntegerBatchSyntax,
  parseWireJSON,
  stringifyWireJSON,
} from "./generated/integer-batch.ts";
import {
  bindIntegerBatchNative,
  checkIntegerBatchNative,
} from "./generated/integer-batch-native.ts";
import { exchangeIntegers } from "./runtime.ts";

const minI64 = -(1n << 63n);
const maxI64 = (1n << 63n) - 1n;
const maxU64 = (1n << 64n) - 1n;
const schema = libsalutation.schemas.integerBatch;

function batch(signed = 0n, unsigned = 0n): IntegerBatch {
  return {
    values: { signed, unsigned },
    signedValues: [0n, -1n, minI64, maxI64],
    unsignedValues: [0n, 1n, maxU64],
    nullableUnsigned: null,
  };
}

test("roundtrips nested i64/u64 records, lists, optional and nullable fields", () => {
  for (const signed of [minI64, -1n, 0n, 1n, maxI64]) {
    for (const unsigned of [0n, 1n, maxU64]) {
      const input = batch(signed, unsigned);
      assert.deepEqual(libsalutation.roundtripIntegers(input), input);
      const present = { ...input, optionalSigned: signed, nullableUnsigned: unsigned };
      assert.deepEqual(libsalutation.roundtripIntegers(present), present);
    }
  }
});

test("generated Zod annotations normalize safe numbers and enforce 64-bit ranges", () => {
  const input = {
    ...batch(),
    values: { signed: -42, unsigned: 42 },
    signedValues: [1, -2],
    unsignedValues: [3],
  };
  assert.deepEqual(schema.parse(input).values, { signed: -42n, unsigned: 42n });
  assert.deepEqual(schema.parse(input).signedValues, [1n, -2n]);
  assert.equal(
    schema.parse({ ...input, optionalSigned: 4, nullableUnsigned: 5 }).optionalSigned,
    4n,
  );
  for (const signed of [minI64 - 1n, maxI64 + 1n, Number.MAX_SAFE_INTEGER + 1, 0.5, "1", true]) {
    assert.equal(schema.safeParse({ ...input, values: { signed, unsigned: 0n } }).success, false);
  }
  for (const unsigned of [-1n, maxU64 + 1n, Number.MAX_SAFE_INTEGER + 1, 0.5, "1", false]) {
    assert.equal(schema.safeParse({ ...input, values: { signed: 0n, unsigned } }).success, false);
  }
  assert.equal(schema.safeParse({ ...batch(), signedValues: [maxI64 + 1n] }).success, false);
  assert.equal(schema.safeParse({ ...batch(), optionalSigned: maxI64 + 1n }).success, false);
  assert.equal(schema.safeParse({ ...batch(), nullableUnsigned: -1n }).success, false);
});

test("JSON carries exact integer literals and decoding uses their original tokens", () => {
  const input = batch(maxI64, maxU64);
  const text = stringifyWireJSON(input);
  assert.match(text, /"signed":9223372036854775807/);
  assert.match(text, /"unsigned":18446744073709551615/);
  assert.deepEqual(schema.parse(parseWireJSON(text)), input);
  assert.deepEqual(schema.parse(parseWireJSON(exchangeIntegers(text))), input);
  assert.equal(
    typeof schema.parse(parseWireJSON(stringifyWireJSON(batch()))).values.signed,
    "bigint",
  );
});

test("both generated guards and Idris codecs reject invalid 64-bit inputs", () => {
  for (const input of [
    batch(minI64 - 1n),
    batch(maxI64 + 1n),
    batch(0n, -1n),
    batch(0n, maxU64 + 1n),
  ]) {
    assert.equal(checkIntegerBatchSyntax(input).ok, false);
    assert.throws(() => libsalutation.roundtripIntegers(input));
    assert.throws(() => exchangeIntegers(stringifyWireJSON(input)));
  }
  for (const token of ["1.5", "1e0", '"1"', "true"]) {
    const input = `{"values":{"signed":${token},"unsigned":0},"signedValues":[],"unsignedValues":[],"nullableUnsigned":null}`;
    assert.throws(() => exchangeIntegers(input));
  }
});

test("canonical and native generated transports preserve bigint values", () => {
  const transport = {
    toSyntax: (text: string) => `{"ok":true,"value":${exchangeIntegers(text)}}`,
    fromSyntax: (text: string) => JSON.stringify({ ok: true, value: exchangeIntegers(text) }),
  };
  const input = batch(minI64, maxU64);
  assert.equal(checkIntegerBatchSyntax(input).ok, true);
  assert.equal(checkIntegerBatchNative(input).ok, true);
  const canonical = bindIntegerBatch(transport);
  const native = bindIntegerBatchNative(transport);
  const encoded = native.encode(input);
  assert.equal(encoded.ok, true);
  const nativeResult = native.decode(encoded.value);
  const canonicalResult = canonical.toSyntax(encoded.value);
  assert.equal(nativeResult.ok, true);
  assert.equal(canonicalResult.ok, true);
  assert.deepEqual(schema.parse(nativeResult.value), input);
  assert.deepEqual(schema.parse(canonicalResult.value), input);
});
