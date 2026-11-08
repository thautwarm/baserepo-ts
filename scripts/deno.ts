import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";

export function requireDenoVersion(toolchain: string): string {
  const { deno } = JSON.parse(readFileSync(toolchain, "utf8"));
  if (typeof deno !== "string" || !/^\d+\.\d+\.\d+$/.test(deno))
    throw new Error(`Invalid Deno version in ${toolchain}`);
  const actual = execFileSync("deno", ["--version"], { encoding: "utf8" }).split("\n")[0];
  if (!actual?.startsWith(`deno ${deno} `))
    throw new Error(`Expected Deno ${deno} from ${toolchain}; found ${actual}`);
  return deno;
}
