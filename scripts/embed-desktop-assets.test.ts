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
        output,
        "--directory",
        input,
        "--file",
        "/tray.png",
        icon,
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
    generate();
    const withoutHtml = await import(`${pathToFileURL(output).href}?without-html`);
    assert.equal(withoutHtml.assets.has("/index.html"), false);
    assert.deepEqual(withoutHtml.assets.get("/tray.png").body, bytes);
    const standalone = join(root, "generated/files-only.ts");
    execFileSync(process.execPath, [
      fileURLToPath(new URL("./embed-desktop-assets.ts", import.meta.url)),
      standalone,
      "--file",
      "/images/app.png",
      icon,
    ]);
    const fileBundle = await import(pathToFileURL(standalone).href);
    assert.deepEqual([...fileBundle.assets.keys()], ["/images/app.png"]);
    assert.deepEqual(fileBundle.assets.get("/images/app.png").body, bytes);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
