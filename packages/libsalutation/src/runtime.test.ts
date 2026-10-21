import assert from "node:assert/strict";
import test from "node:test";
import { libsalutation } from "@template/libsalutation";
import { checkPublicModelsSyntax } from "./generated/public-models.ts";
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

test("generates the model registry and its validator from the Idris graph", () => {
  assert.equal(
    checkPublicModelsSyntax({
      greetRequest: { recipients: [{ name: "Ada" }] },
      greetResponse: { greetings: [{ message: "Hello, Ada!" }] },
      integerBatch: {
        values: { signed: 0n, unsigned: 0n },
        signedValues: [],
        unsignedValues: [],
        nullableUnsigned: null,
      },
    }).ok,
    true,
  );
  assert.equal(
    checkPublicModelsSyntax({
      greetRequest: { recipients: [{ name: "Ada" }] },
      greetResponse: { greetings: [{ message: 42 }] },
      integerBatch: {
        values: { signed: 0n, unsigned: 0n },
        signedValues: [],
        unsignedValues: [],
        nullableUnsigned: null,
      },
    }).ok,
    false,
  );
});

test("TypeScript and Idris both reject fields outside the wire contract", () => {
  const request = { recipients: [{ name: "Ada", extra: true }] };
  assert.throws(() => libsalutation.greet(request), /Wire:/);
  assert.throws(() => exchange(JSON.stringify(request)), /Wire/);
});

test("uses the generated own-data validator before serializing requests", () => {
  let calls = 0;
  const recipient = {
    get name() {
      calls++;
      return "Ada";
    },
  };
  assert.throws(() => libsalutation.greet({ recipients: [recipient] }), /Wire:/);
  assert.equal(calls, 0);
});
