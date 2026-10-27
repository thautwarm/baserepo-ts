import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";

test("resource generation preserves binary bytes and stable URL keys", async () => {
  const root = await mkdtemp(join(tmpdir(), "desktop-assets-"));
  try {
    const input = join(root, "dist");
    await mkdir(join(input, "assets"), { recursive: true });
    await writeFile(join(input, "index.html"), "<h1>Embedded</h1>");
    const bytes = new Uint8Array([0, 255, 128, 1, 13, 10]);
    await writeFile(join(input, "assets/font name.woff2"), bytes);
    const icon = join(root, "icon.png");
    await writeFile(icon, bytes);
    const output = join(root, "generated/assets.ts");
    const generate = () =>
      execFileSync(process.execPath, [
        fileURLToPath(new URL("./embed-desktop-assets.ts", import.meta.url)),
        input,
        icon,
        output,
      ]);
    generate();
    const first = await readFile(output, "utf8");
    generate();
    assert.equal(await readFile(output, "utf8"), first);
    const { assets } = await import(pathToFileURL(output).href);
    assert.equal(new TextDecoder().decode(assets.get("/index.html").body), "<h1>Embedded</h1>");
    assert.deepEqual(assets.get("/assets/font%20name.woff2").body, bytes);
    assert.equal(assets.get("/assets/font%20name.woff2").contentType, "font/woff2");
    assert.deepEqual(assets.get("/tray.png").body, bytes);
    await rm(join(input, "index.html"));
    assert.throws(generate, /Frontend output has no index.html/);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
