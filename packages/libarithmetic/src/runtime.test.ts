import assert from "node:assert/strict";
import test from "node:test";
import { decode, encode } from "@std/msgpack";
import { libarithmetic } from "@template/libarithmetic";
import { exchange } from "./runtime.ts";

test("exchanges i64 MessagePack requests and replies with Rust Wasm", () => {
  for (const value of [0n, 21n, -3n, -(1n << 62n), (1n << 62n) - 1n]) {
    assert.equal(libarithmetic.double(value), value * 2n);
  }
});

test("normalizes compact Rust integers to bigint", () => {
  const reply = decode(exchange(encode({ value: 21n })));
  assert.deepEqual(reply, { value: 42 });
  assert.deepEqual(libarithmetic.schemas.doubleReply.parse(reply), { value: 42n });
});

test("i64 schemas normalize safe numbers and reject invalid values", () => {
  const schema = libarithmetic.schemas.doubleRequest;
  for (const value of [42, 42n, Number.MAX_SAFE_INTEGER, -(1n << 63n), (1n << 63n) - 1n]) {
    assert.deepEqual(schema.parse({ value }), { value: BigInt(value) });
  }
  const normalized = schema.parse({ value: Number.MAX_SAFE_INTEGER });
  assert.equal(libarithmetic.double(normalized.value), normalized.value * 2n);
  for (const value of [
    1n << 63n,
    -(1n << 63n) - 1n,
    Number.MAX_SAFE_INTEGER + 1,
    1.5,
    "42",
    true,
  ]) {
    assert.equal(schema.safeParse({ value }).success, false);
  }
});

test("Rust returns MessagePack errors and remains usable afterwards", () => {
  for (const value of [-(1n << 63n), (1n << 63n) - 1n]) {
    assert.throws(() => libarithmetic.double(value), /i64 overflow/);
  }
  for (const request of [
    new Uint8Array(),
    new Uint8Array([0xc1]),
    encode({ value: 1n << 63n }),
    encode({ value: Number.MAX_SAFE_INTEGER }),
  ]) {
    const malformed = libarithmetic.schemas.doubleReply.parse(decode(exchange(request)));
    assert.ok("error" in malformed);
  }
  assert.equal(libarithmetic.double(21n), 42n);
});

test("repeated requests keep their responses independent", () => {
  for (let value = 0n; value < 1000n; value++) {
    assert.equal(libarithmetic.double(value), value * 2n);
  }
});
