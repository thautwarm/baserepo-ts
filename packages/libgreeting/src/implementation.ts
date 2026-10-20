import type { GreetResponse } from "./types.ts";

export function createGreeting(name: string): GreetResponse {
  return { message: `Hello, ${name}!` };
}
