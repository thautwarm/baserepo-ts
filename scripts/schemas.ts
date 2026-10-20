import { readdir, readFile, writeFile } from "node:fs/promises";
import { generate } from "ts-to-zod";

const check = process.argv.includes("--check");
const packages = new URL("../packages/", import.meta.url);

for (const directory of await readdir(packages, { withFileTypes: true })) {
  if (!directory.isDirectory() || !directory.name.startsWith("lib")) continue;
  const base = new URL(`${directory.name}/`, packages);
  const manifest = JSON.parse(await readFile(new URL("package.json", base), "utf8"));
  const types = manifest.exports?.["./types"];
  if (typeof types !== "string") throw new Error(`${manifest.name}: missing /types entry`);
  const source = new URL(types, base);
  const output = new URL("./schemas.ts", source);
  const result = generate({
    sourceText: await readFile(source, "utf8"),
    nameFilter: (name) => name === "Models",
  });
  if (result.errors.length > 0) throw new Error(result.errors.join("\n"));
  const generated = result.getZodSchemasFile("./types.ts");
  if (!generated.includes("export const modelsSchema =")) {
    throw new Error(`${manifest.name}: /types must define Models`);
  }
  if (check) {
    if ((await readFile(output, "utf8")) !== generated) {
      throw new Error(`${manifest.name}: schemas are stale. Run pnpm schema.`);
    }
  } else {
    await writeFile(output, generated);
  }
  console.log(`${manifest.name}: schemas ${check ? "current" : "generated"} from Models.`);
}
