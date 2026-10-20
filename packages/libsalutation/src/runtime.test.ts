import assert from "node:assert/strict";
import test from "node:test";
import { libsalutation } from "@template/libsalutation";

test("calls the Idris library through generated JavaScript", () => {
  assert.equal(libsalutation.greet("World"), "Hello, World!");
  assert.equal(libsalutation.greet("世界 🌍"), "Hello, 世界 🌍!");
});
