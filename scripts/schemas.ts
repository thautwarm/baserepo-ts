import { readFile } from "node:fs/promises";

export async function generateSchema(source: string): Promise<string> {
  // Cache hits must not load the generator or its TypeScript compiler.
  const { generate } = await import("ts-to-zod");
  const result = generate({
    sourceText: await readFile(source, "utf8"),
    nameFilter: (name) => name === "Models",
  });
  if (result.errors.length > 0) throw new Error(result.errors.join("\n"));
  const output = result.getZodSchemasFile("./types.ts");
  if (!output.includes("export const modelsSchema =")) {
    throw new Error(`${source}: missing Models interface`);
  }
  return output;
}
