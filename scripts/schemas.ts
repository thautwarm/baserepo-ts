import { readFile, writeFile } from "node:fs/promises";
import { dirname, relative, sep } from "node:path";
import { generate } from "ts-to-zod";

const [source, target, ...extra] = process.argv.slice(2);
if (!source || !target || extra.length > 0) {
  throw new Error("Usage: node scripts/schemas.ts <input> <output>");
}

const result = generate({
  sourceText: await readFile(source, "utf8"),
  nameFilter: (name) => name === "Models",
});
if (result.errors.length > 0) throw new Error(result.errors.join("\n"));

const sourceImport = relative(dirname(target), source).split(sep).join("/");
const output = result.getZodSchemasFile(
  sourceImport.startsWith("../") ? sourceImport : `./${sourceImport}`,
);
if (!output.includes("export const modelsSchema =")) {
  throw new Error(`${source}: missing Models interface`);
}
await writeFile(target, output);
