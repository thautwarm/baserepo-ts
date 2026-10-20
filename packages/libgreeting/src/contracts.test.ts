import assert from "node:assert/strict";
import test from "node:test";
import * as entry from "@template/libgreeting";
import type { ILibrary } from "@template/libgreeting/types";

const { libgreeting } = entry;

// An unused @ts-expect-error fails tsc.
void (libgreeting satisfies ILibrary);
// @ts-expect-error Runtime APIs are accessed through the library object.
void entry.greet;
// @ts-expect-error Public types are available only from the /types entry.
void ({} satisfies entry.ILibrary);
// @ts-expect-error The contract hides the concrete Zod object schema type.
void libgreeting.schemas.greetRequest.shape;
// @ts-expect-error The required library members are missing.
void ({} satisfies ILibrary);
void ({
  schemas: libgreeting.schemas,
  // @ts-expect-error The request parameter does not match the contract.
  greet: async (_name: number) => ({ message: "invalid" }),
} satisfies ILibrary);
void ({
  schemas: libgreeting.schemas,
  // @ts-expect-error The response does not match the contract.
  greet: async (_request: { name: string }) => 42,
} satisfies ILibrary);

test("the package exports only its library object", () => {
  assert.deepEqual(Object.keys(entry), ["libgreeting"]);
});

test("the library fulfills the async greeting contract", async () => {
  const request = libgreeting.schemas.greetRequest.parse({ name: "Lightning" });
  const response = libgreeting.schemas.greetResponse.parse(await libgreeting.greet(request));
  assert.deepEqual(response, { message: "Hello, Lightning!" });
});

test("generated schemas reject invalid requests and responses", () => {
  assert.equal(libgreeting.schemas.greetRequest.safeParse({ name: "" }).success, false);
  assert.equal(libgreeting.schemas.greetRequest.safeParse({ name: 42 }).success, false);
  assert.equal(libgreeting.schemas.greetResponse.safeParse({ message: 42 }).success, false);
});
