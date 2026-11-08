import assert from "node:assert/strict";
import test from "node:test";
import { createHandler } from "./server.ts";

test("embedded UI establishes a session and protects native actions", async () => {
  const origin = "http://127.0.0.1:4000";
  let runs = 0;
  const handler = createHandler({
    assets: new Map([
      [
        "/index.html",
        { body: new TextEncoder().encode("<h1>Desktop</h1>"), contentType: "text/html" },
      ],
    ]),
    origin: () => origin,
    status: async () => ({ name: "example" }),
    native: async () => {
      runs++;
      return { output: "test platform", exitCode: 0 };
    },
    quit() {},
  });
  const request = (path: string, init?: RequestInit) =>
    handler(
      new Request(`${origin}${path}`, {
        ...init,
        headers: { host: "127.0.0.1:4000", ...Object.fromEntries(new Headers(init?.headers)) },
      }),
    );
  assert.equal((await request("/api/status")).status, 401);
  const home = await request("/");
  assert.equal(await home.text(), "<h1>Desktop</h1>");
  const cookie = home.headers.get("set-cookie")?.split(";")[0];
  assert.ok(cookie);
  assert.deepEqual(await (await request("/api/status", { headers: { cookie } })).json(), {
    name: "example",
  });
  assert.equal(
    (await request("/api/native", { method: "POST", headers: { cookie, origin } })).status,
    403,
  );
  assert.equal(
    (
      await request("/api/native", {
        method: "POST",
        headers: { cookie, origin: "https://foreign.example", "x-desktop-client": "frontend" },
      })
    ).status,
    403,
  );
  assert.equal(runs, 0);
  const result = await request("/api/native", {
    method: "POST",
    headers: { cookie, origin, "x-desktop-client": "frontend" },
  });
  assert.equal(result.status, 200);
  assert.deepEqual(await result.json(), { output: "test platform", exitCode: 0 });
  assert.equal(runs, 1);
  assert.equal((await request("/../../package.json")).status, 404);
  assert.equal((await request("/", { headers: { host: "foreign.example" } })).status, 403);
});
