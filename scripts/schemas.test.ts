import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";

async function fixture(sourceText: string) {
  const root = await mkdtemp(join(tmpdir(), "schema-generation-"));
  const source = join(root, "types.ts");
  const target = join(root, "schemas.ts");
  await writeFile(source, sourceText);
  return {
    root,
    target,
    run: () =>
      spawnSync(
        process.execPath,
        [fileURLToPath(new URL("./schemas.ts", import.meta.url)), source, target],
        { encoding: "utf8" },
      ),
  };
}

test("types without PublicModels generate an importable empty module", async () => {
  const { root, target, run } = await fixture(`
    // PublicModels is optional.
    export interface ILibrary {
      run: (options: { verbose: boolean }) => Promise<void>;
    }
  `);
  try {
    await writeFile(target, "export const staleSchema = 1;\n");
    const result = run();
    assert.equal(result.status, 0, result.stderr);
    assert.deepEqual(Object.keys(await import(pathToFileURL(target).href)), []);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("an unexported PublicModels declaration remains a generation error", async () => {
  const { root, target, run } = await fixture("interface PublicModels { name: string; }");
  try {
    const result = run();
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /PublicModels must be exported/);
    await assert.rejects(readFile(target), { code: "ENOENT" });
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("generates transitive model dependencies without behavior contracts", async () => {
  const { root, target, run } = await fixture(`
    interface Person { name: string; }
    interface Batch { recipients: Person[]; }
    interface Request extends Batch { prefix: string; }
    type Response = { messages: string[] } | { error: string };
    export interface PublicModels { request: Request; response: Response; }
    export interface ILibrary { run(request: Request): Promise<Response>; }
  `);
  try {
    const result = run();
    assert.equal(result.status, 0, result.stderr);
    const output = await readFile(target, "utf8");
    for (const name of ["person", "batch", "request", "response", "publicModels"]) {
      assert.match(output, new RegExp(`const ${name}Schema =`));
    }
    assert.doesNotMatch(output, /iLibrarySchema|z\.any\(/);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
