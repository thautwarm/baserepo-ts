import assert from "node:assert/strict";
import test from "node:test";
import { libsalutation } from "@template/libsalutation";
import { exchange } from "./runtime.ts";

test("exchanges nested records and arrays with Idris through JSON", () => {
  const names = ["World", "世界 🌍", 'quote " and slash \\', "line\n\u0000tab\t", ""];
  assert.deepEqual(libsalutation.greet({ recipients: names.map((name) => ({ name })) }), {
    greetings: names.map((name) => ({ message: `Hello, ${name}!` })),
  });
  assert.deepEqual(libsalutation.greet({ recipients: [] }), { greetings: [] });
});

test("validates the public request schema", () => {
  assert.throws(() => libsalutation.schemas.greetRequest.parse({ recipients: [{ name: 42 }] }));
  assert.throws(() => libsalutation.schemas.greetResponse.parse({ greetings: ["wrong"] }));
});

test("the Idris codec rejects malformed JSON and invalid record shapes", () => {
  for (const input of ["{", "null", "[]", "{}", '{"recipients":[{"name":42}]}']) {
    assert.throws(() => exchange(input), Error);
  }
});

test("the Idris parser rejects duplicate decoded keys", () => {
  assert.throws(() => exchange('{"recipients":[],"\\u0072ecipients":[]}'), /Duplicate object key/);
});

test("raw bridge returns JSON objects for unary records", () => {
  assert.deepEqual(JSON.parse(exchange('{"recipients":[{"name":"Ada"}]}')), {
    greetings: [{ message: "Hello, Ada!" }],
  });
});
