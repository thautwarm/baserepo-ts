import assert from "node:assert/strict";
import test from "node:test";
import { libarithmetic } from "@template/libarithmetic";

test("calls the Rust library through embedded Wasm", () => {
  assert.equal(libarithmetic.double(21), 42);
  assert.equal(libarithmetic.double(-1.5), -3);
});
