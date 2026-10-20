import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import test from "node:test";
import { fileURLToPath } from "node:url";

test("the CLI greets the requested name", () => {
  const result = spawnSync(
    process.execPath,
    [fileURLToPath(new URL("./main.ts", import.meta.url)), "Example"],
    { encoding: "utf8" },
  );
  assert.equal(result.status, 0, result.stderr);
  assert.equal(result.stdout, "Hello, Example!\n");
});
