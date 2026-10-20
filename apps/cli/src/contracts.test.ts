import assert from "node:assert/strict";
import test from "node:test";
import type { ILibrary } from "@template/libgreeting/types";
import * as implementation from "@template/libgreeting";

// An unused @ts-expect-error fails tsc.
void (implementation satisfies ILibrary);
// @ts-expect-error The required greet export is missing.
void ({} satisfies ILibrary);
// @ts-expect-error The request parameter does not match the contract.
void ({ schemas: implementation.schemas, greet: async (_name: number) => ({ message: "invalid" }) } satisfies ILibrary);
// @ts-expect-error The response does not match the contract.
void ({ schemas: implementation.schemas, greet: async (_request: { name: string }) => 42 } satisfies ILibrary);

test("the implementation module fulfills the async greeting contract", async () => {
  const greeting = implementation;
  const request = greeting.schemas.greetRequest.parse({ name: "Lightning" });
  const response = greeting.schemas.greetResponse.parse(await greeting.greet(request));
  assert.deepEqual(response, { message: "Hello, Lightning!" });
});

test("generated schemas reject invalid requests and responses", () => {
  assert.equal(implementation.schemas.greetRequest.safeParse({ name: "" }).success, false);
  assert.equal(implementation.schemas.greetRequest.safeParse({ name: 42 }).success, false);
  assert.equal(implementation.schemas.greetResponse.safeParse({ message: 42 }).success, false);
});
